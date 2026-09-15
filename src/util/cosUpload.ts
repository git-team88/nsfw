import CryptoJS from "crypto-js";
import api from "@/api/index";

// ---------------------------------------------------------------------------
// COS 直传分片。
//
// 浏览器拿一份 STS 临时凭证（common/cos_upload_credential，有效期 2 小时），
// 自己算 COS 的请求签名，直接和 COS 说话：
//   InitiateMultipartUpload -> UploadPart x N（并发）-> CompleteMultipartUpload
//
// 相比预签名单次 PUT：单片失败可重试，有字节级进度，断的只是一片不是整个文件。
// 相比服务端中转分片：不走自己的服务器，不吃自己的带宽。
//
// 签名算法见 https://cloud.tencent.com/document/product/436/7778，
// 下面 buildAuthorization 的实现按官方示例逐步核对过（HttpString 的 SHA1
// 与文档示例一致）。改这里之前先去看那篇文档。
// ---------------------------------------------------------------------------

/** STS 凭证接口返回体 */
export interface CosCredential {
  TmpSecretId: string;
  TmpSecretKey: string;
  Token: string;
  StartTime: number;
  ExpiredTime: number;
}

/** 单片大小的下限。COS 要求除最后一片外每片不小于 1MB，这里取 10MB */
const MIN_CHUNK_SIZE = 10 * 1024 * 1024;
/** COS 单次分片上传最多 10000 片，留足余量按 1000 片封顶，片数超了就把片调大 */
const MAX_PART_COUNT = 1000;
/** 并发上传的分片数 */
const CONCURRENCY = 4;
/** 单片的网络失败重试次数 */
const MAX_RETRY = 3;
/** 凭证提前过期的余量：剩不到 5 分钟就重新申请，避免大文件传到一半签名失效 */
const CREDENTIAL_MARGIN = 5 * 60;

/** 按文件大小挑分片尺寸，保证片数不超过 MAX_PART_COUNT */
export function pickChunkSize(fileSize: number): number {
  let size = MIN_CHUNK_SIZE;
  while (Math.ceil(fileSize / size) > MAX_PART_COUNT) size *= 2;
  return size;
}

/**
 * COS 直传过程中的错误。
 *
 * stage 区分「还没开始传」和「传到一半」：setup 阶段（申请凭证、Initiate）失败时
 * 一个字节都还没出去，调用方可以安全地改走别的通道；upload 阶段失败就只能报错，
 * 换通道等于整个文件重传。
 */
export class CosUploadError extends Error {
  payload: any;
  stage: "setup" | "upload";
  constructor(payload: any, message = "cos upload failed", stage: "setup" | "upload" = "upload") {
    super(message);
    this.name = "CosUploadError";
    this.payload = payload;
    this.stage = stage;
  }
}

// --- 凭证缓存 ---------------------------------------------------------------
// 一次发布可能连着传封面、视频，凭证 2 小时有效，没必要每次都申请。
// inflight 保证并发调用只会打一个请求。

let credentialCache: CosCredential | null = null;
let credentialInflight: Promise<CosCredential> | null = null;

/** 退出登录或切账号时清掉，避免用着上一个账号的凭证 */
export function resetCosCredential() {
  credentialCache = null;
  credentialInflight = null;
}

function credentialUsable(c: CosCredential | null): c is CosCredential {
  if (!c) return false;
  return c.ExpiredTime - CREDENTIAL_MARGIN > Math.floor(Date.now() / 1000);
}

export async function getCosCredential(): Promise<CosCredential> {
  if (credentialUsable(credentialCache)) return credentialCache;

  if (!credentialInflight) {
    credentialInflight = (async () => {
      const res = (await api.getCosCredential()) as any;
      if (!res || (res.code !== 0 && res.code !== 200)) {
        throw new CosUploadError(res, "credential failed", "setup");
      }
      const data = res.data || {};
      if (!data.TmpSecretId || !data.TmpSecretKey || !data.Token) {
        throw new CosUploadError(res, "credential incomplete", "setup");
      }
      credentialCache = data as CosCredential;
      return credentialCache;
    })().finally(() => {
      credentialInflight = null;
    });
  }
  return credentialInflight;
}

// --- 签名 -------------------------------------------------------------------

/** RFC3986：encodeURIComponent 漏掉的 !'()* 也要编码 */
function urlEncode(str: string): string {
  return encodeURIComponent(String(str)).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/**
 * 把 query 拼成签名用的两段：
 *   list   —— 分号分隔的键名（小写、排序后）
 *   string —— key=value&key=value（键小写、键值都编码、按键排序）
 * 注意键在签名里要小写，真正发出去的 URL 保持原样（partNumber 不能变成 partnumber）。
 */
function buildParamParts(params: Record<string, string | number>) {
  const keys = Object.keys(params).map((k) => k.toLowerCase()).sort();
  const lowered: Record<string, string> = {};
  Object.keys(params).forEach((k) => {
    lowered[k.toLowerCase()] = String(params[k] ?? "");
  });
  return {
    list: keys.join(";"),
    string: keys.map((k) => `${urlEncode(k)}=${urlEncode(lowered[k])}`).join("&"),
  };
}

/**
 * 算一条请求的 Authorization。
 *
 * 只签 query，不签 header —— 浏览器里 host / content-length 都改不了，
 * 签了反而对不上。x-cos-security-token 按约定走 header 且不参与签名。
 */
export function buildAuthorization(opts: {
  secretId: string;
  secretKey: string;
  method: string;
  pathname: string;
  params?: Record<string, string | number>;
  startTime: number;
  expiredTime: number;
}): string {
  const keyTime = `${opts.startTime};${opts.expiredTime}`;
  const signKey = CryptoJS.HmacSHA1(keyTime, opts.secretKey).toString();

  const { list: paramList, string: paramString } = buildParamParts(opts.params || {});

  // HttpString：方法小写、pathname 不编码、末尾要有换行
  const httpString = [
    opts.method.toLowerCase(),
    opts.pathname,
    paramString,
    "", // header string：不签 header
    "",
  ].join("\n");

  const stringToSign = ["sha1", keyTime, CryptoJS.SHA1(httpString).toString(), ""].join("\n");
  const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();

  return [
    "q-sign-algorithm=sha1",
    `q-ak=${opts.secretId}`,
    `q-sign-time=${keyTime}`,
    `q-key-time=${keyTime}`,
    "q-header-list=",
    `q-url-param-list=${paramList}`,
    `q-signature=${signature}`,
  ].join("&");
}

// --- 请求 -------------------------------------------------------------------

export interface CosTarget {
  /** 形如 examplebucket-1250000000 */
  bucket: string;
  /** 形如 ap-guangzhou */
  region: string;
  /** 对象路径，不带开头的斜杠 */
  key: string;
}

function targetUrl(target: CosTarget, params: Record<string, string | number>): string {
  const host = `${target.bucket}.cos.${target.region}.myqcloud.com`;
  const path = target.key.split("/").map(urlEncode).join("/");
  const query = Object.keys(params)
    .map((k) => {
      const v = params[k];
      return v === "" ? urlEncode(k) : `${urlEncode(k)}=${urlEncode(String(v))}`;
    })
    .join("&");
  return `https://${host}/${path}${query ? "?" + query : ""}`;
}

function pathnameOf(target: CosTarget): string {
  return "/" + target.key.replace(/^\/+/, "");
}

/**
 * 发一条签好名的 COS 请求。用 XHR 而不是 fetch：
 * fetch 拿不到上传进度，而进度正是分片上传的意义之一。
 */
function cosRequest(opts: {
  credential: CosCredential;
  target: CosTarget;
  method: string;
  params?: Record<string, string | number>;
  body?: Blob | string | null;
  onUploadProgress?: (loaded: number) => void;
}): Promise<{ status: number; text: string; etag: string }> {
  const params = opts.params || {};
  const authorization = buildAuthorization({
    secretId: opts.credential.TmpSecretId,
    secretKey: opts.credential.TmpSecretKey,
    method: opts.method,
    pathname: pathnameOf(opts.target),
    params,
    startTime: opts.credential.StartTime,
    expiredTime: opts.credential.ExpiredTime,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method, targetUrl(opts.target, params), true);
    xhr.setRequestHeader("Authorization", authorization);
    xhr.setRequestHeader("x-cos-security-token", opts.credential.Token);

    if (opts.onUploadProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onUploadProgress!(e.loaded);
      };
    }

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        text: xhr.responseText || "",
        // 需要桶的 CORS 里 ExposeHeader 带上 ETag，否则这里恒为空
        etag: xhr.getResponseHeader("ETag") || "",
      });
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.ontimeout = () => reject(new Error("timeout"));

    xhr.send(opts.body ?? null);
  });
}

/** COS 出错时返回一段 XML，把里面的 Code / Message 抠出来当提示 */
function parseCosError(text: string): string {
  const code = /<Code>(.*?)<\/Code>/.exec(text)?.[1] || "";
  const message = /<Message>(.*?)<\/Message>/.exec(text)?.[1] || "";
  return [code, message].filter(Boolean).join(": ") || text.slice(0, 200);
}

function assertOk(res: { status: number; text: string }, stage: "setup" | "upload" = "upload") {
  // COS 偶尔会用 200 带一段 <Error> 回来，光看状态码不够
  if (res.status < 200 || res.status >= 300 || /<Error>/.test(res.text)) {
    const msg = parseCosError(res.text);
    throw new CosUploadError({ message: msg }, msg, stage);
  }
}

// --- 分片流程 ---------------------------------------------------------------

async function initiateUpload(credential: CosCredential, target: CosTarget): Promise<string> {
  const res = await cosRequest({ credential, target, method: "POST", params: { uploads: "" } });
  assertOk(res, "setup");
  const uploadId = /<UploadId>(.*?)<\/UploadId>/.exec(res.text)?.[1];
  if (!uploadId) throw new CosUploadError({ message: "missing UploadId" }, "missing UploadId", "setup");
  return uploadId;
}

async function uploadPart(
  credential: CosCredential,
  target: CosTarget,
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  onLoaded: (loaded: number) => void,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await cosRequest({
        credential,
        target,
        method: "PUT",
        params: { partNumber, uploadId },
        body: chunk,
        onUploadProgress: onLoaded,
      });
      assertOk(res);
      if (!res.etag) {
        // 拿不到 ETag 合并一定失败，早点报出来，别等到最后一步
        throw new CosUploadError(
          { message: "ETag missing, check COS CORS ExposeHeader" },
          "ETag missing",
        );
      }
      return res.etag;
    } catch (err) {
      // 业务错误重试也不会变好；只重试网络抖动
      if (err instanceof CosUploadError) throw err;
      if (attempt === MAX_RETRY) throw err;
      onLoaded(0); // 这一片要重传，已上报的字节数清零
      await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

async function completeUpload(
  credential: CosCredential,
  target: CosTarget,
  uploadId: string,
  etags: string[],
): Promise<void> {
  const body =
    "<CompleteMultipartUpload>" +
    etags
      .map((etag, i) => `<Part><PartNumber>${i + 1}</PartNumber><ETag>${etag}</ETag></Part>`)
      .join("") +
    "</CompleteMultipartUpload>";
  const res = await cosRequest({
    credential,
    target,
    method: "POST",
    params: { uploadId },
    body,
  });
  assertOk(res);
}

async function abortUpload(credential: CosCredential, target: CosTarget, uploadId: string) {
  try {
    await cosRequest({ credential, target, method: "DELETE", params: { uploadId } });
  } catch {
    // 清理失败无所谓，COS 侧有碎片回收策略
  }
}

/**
 * 把一个文件分片直传到 COS。
 *
 * @param onProgress 0-100。统计的是「交给网络的字节」，所以这里压到 99，
 *                   等 CompleteMultipartUpload 返回之后由调用方置 100 —— 合并
 *                   大文件要几秒，进度条满着不动比停在 99% 更像卡死。
 */
export async function uploadFileToCos(
  file: File,
  target: CosTarget,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const credential = await getCosCredential();
  const chunkSize = pickChunkSize(file.size);
  const total = Math.ceil(file.size / chunkSize);

  const uploadId = await initiateUpload(credential, target);

  // 每片各自上报已传字节，求和算总进度。并发完成顺序是乱的，
  // 所以按下标记，不能用累加的方式。
  const loaded: number[] = new Array(total).fill(0);
  const report = () => {
    if (!onProgress) return;
    const sum = loaded.reduce((a, b) => a + b, 0);
    onProgress(Math.min(99, Math.floor((sum / file.size) * 100)));
  };

  const etags: string[] = new Array(total);
  let next = 0;

  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= total) return;
      const start = index * chunkSize;
      const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
      etags[index] = await uploadPart(credential, target, uploadId, index + 1, chunk, (bytes) => {
        loaded[index] = bytes;
        report();
      });
      loaded[index] = chunk.size;
      report();
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()));
    await completeUpload(credential, target, uploadId, etags);
  } catch (err) {
    await abortUpload(credential, target, uploadId);
    throw err;
  }
}
