import CryptoJS from "crypto-js";
import SparkMD5 from "spark-md5";
import api from "@/api/index";

// ---------------------------------------------------------------------------
// COS 直传分片。
//
// 浏览器拿一份 STS 临时凭证（common/cos_upload_credential），自己算 COS 的请求签名，
// 直接和 COS 说话：
//   InitiateMultipartUpload -> UploadPart x N（并发）-> CompleteMultipartUpload
//
// 凭证接口给出三样：目录前缀（upload_prefix）、写请求发往的接入点（endpoint）、
// 读取用的 CDN 域名（cdn_domain）。桶名、地域、目录规则全在后端，前端一个都不写死。
//
// 写和读的域名不是同一个：
//   写 —— endpoint，COS 自己的接入点（如 {bucket}.cos.accelerate.myqcloud.com）。
//         CDN 域名走不通：请求穿 EdgeOne 回源时 Authorization 头被剥掉，COS 当匿名请求，一律 403。
//   读 —— cdn_domain，传完拼给业务用的地址。
//
// 完整 key = {upload_prefix}/{md5 前两位}/{完整 md5}.{扩展名}，见 buildObjectKey。
//
// 完整 key = {upload_prefix}/{YYYYMMDD}/{文件内容的 md5}.{扩展名}。
// 文件名用内容 md5，不用原文件名 —— 一来中文、日文、空格、emoji 这些进不了路径，
// 二来同一个文件重传落在同一个 key 上，断线重来和手抖点两次都不会在桶里堆垃圾。
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
  /** 上传目录前缀，形如 /test/video —— 后面的分桶目录和文件名由前端拼（见 buildObjectKey） */
  uploadPrefix: string;
  /** 写请求（Initiate / UploadPart / Complete）发往的 COS 接入点 */
  endpoint: string;
  /** 传完之后拼访问地址用的 CDN 域名。只用于读，写不走它 */
  cdnDomain: string;
}

/**
 * 分片大小，固定 5MB。算 md5 时也按这个尺寸读文件。
 * 发布页限的是 5GB，5GB / 5MB = 1000 片，离 COS 的 10000 片上限还远，不用动态调。
 * 小于一片的文件就传一片 —— COS 的「每片不小于 1MB」不约束最后一片。
 */
const CHUNK_SIZE = 5 * 1024 * 1024;
/** 并发上传的分片数 */
const CONCURRENCY = 4;
/** 单片的网络失败重试次数 */
const MAX_RETRY = 3;
/** 算 md5 在总进度里占的比重：进度条前 5% 是校验，后面才是真上传 */
const HASH_WEIGHT = 5;

/** 这条通道只传视频，允许的扩展名就这两个 */
const ALLOWED_EXTENSIONS = ["mp4", "mov"] as const;
/** 原文件名取不到可用后缀时，按 file.type 兜底 */
const MIME_EXTENSION: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};
/** MIME 也认不出来时的最后兜底 —— 发布页只放行 mp4 / mov，走到这里基本是 mp4 */
const DEFAULT_EXTENSION = "mp4";

/**
 * 洗出一个能进路径的扩展名。
 *
 * 「我的视频.mp4」「動画.MOV」取到的是 mp4 / mov；「影片」这种没后缀的、
 * 后缀全是非 ASCII 的、或者后缀不在白名单里的（有人把文件随手改成 .txt），
 * 退回按 file.type 猜，再不行按 mp4 处理 —— 页面那层已经拦过格式了。
 */
function extensionOf(file: File): string {
  const dot = file.name.lastIndexOf(".");
  const cleaned = dot < 0
    ? ""
    : file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
  if ((ALLOWED_EXTENSIONS as readonly string[]).includes(cleaned)) return cleaned;
  return MIME_EXTENSION[file.type] || DEFAULT_EXTENSION;
}

/** 域名可能带协议也可能不带，统一补成 https 并去掉尾斜杠 */
function withScheme(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * 按 CHUNK_SIZE 增量算整个文件的 md5。
 * 不能一次 arrayBuffer() 读完 —— 几百 MB 的视频直接把内存打爆。
 */
export async function md5OfFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const spark = new SparkMD5.ArrayBuffer();
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size));
    spark.append(await chunk.arrayBuffer());
    offset += chunk.size;
    onProgress?.(Math.floor((offset / file.size) * 100));
  }
  return spark.end();
}

/**
 * 完整对象 key：{前缀}/{md5 前两位}/{完整 md5}.{扩展名}
 *
 * 前缀先去掉首尾斜杠 —— 接口给的是 /test/video，直接相加会拼出 test/video86/…，
 * 而且 key 自己绝不能带头斜杠：签名里的 UriPathname 是 "/" + key，
 * 带了就成了 //test/video/…，和实际请求路径对不上，直接 SignatureDoesNotMatch。
 *
 * md5 前两位当分桶目录，256 个，均匀分布且同一个文件永远落同一个目录。
 */
export function buildObjectKey(uploadPrefix: string, md5: string, file: File): string {
  const prefix = uploadPrefix.replace(/^\/+|\/+$/g, "");
  return `${prefix}/${md5.slice(0, 2)}/${md5}.${extensionOf(file)}`;
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

// --- 凭证 -------------------------------------------------------------------
// 一次上传打一次，不做缓存。凭证接口很轻，而缓存要处理过期、切账号、并发去重，
// 省下的那一个请求不值当 —— 何况原来那次预签名请求已经省掉了，净请求数没变。

export async function getCosCredential(): Promise<CosCredential> {
  const res = (await api.getCosCredential()) as any;
  if (!res || (res.code !== 0 && res.code !== 200)) {
    throw new CosUploadError(res, "credential failed", "setup");
  }
  const data = res.data || {};
  if (!data.TmpSecretId || !data.TmpSecretKey || !data.Token) {
    throw new CosUploadError(res, "credential incomplete", "setup");
  }
  // cdn_domain 兼容旧字段名 cos_domain
  const cdnDomain = data.cdn_domain || data.cos_domain;
  if (!data.upload_prefix || !data.endpoint || !cdnDomain) {
    throw new CosUploadError(
      res,
      "credential missing upload_prefix/endpoint/cdn_domain",
      "setup",
    );
  }
  return {
    ...(data as CosCredential),
    uploadPrefix: String(data.upload_prefix),
    endpoint: withScheme(String(data.endpoint)),
    cdnDomain: withScheme(String(cdnDomain)),
  };
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
  /** 请求发往的域名，形如 https://static.moegen.ai，不带结尾斜杠 */
  origin: string;
  /** 对象路径，不带开头的斜杠 */
  key: string;
}

/** 传完之后可访问的地址 */
export function fileUrlOf(target: CosTarget): string {
  return `${target.origin}/${target.key}`;
}

function targetUrl(target: CosTarget, params: Record<string, string | number>): string {
  const path = target.key.split("/").map(urlEncode).join("/");
  const query = Object.keys(params)
    .map((k) => {
      const v = params[k];
      return v === "" ? urlEncode(k) : `${urlEncode(k)}=${urlEncode(String(v))}`;
    })
    .join("&");
  return `${target.origin}/${path}${query ? "?" + query : ""}`;
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
 * 把一个文件分片直传到 COS，返回传完之后可访问的地址。
 *
 * 目录前缀和两个域名都来自凭证接口，分桶目录和文件名由 buildObjectKey 拼，调用方不用准备。
 *
 * @param onProgress 0-100。前 HASH_WEIGHT% 是算 md5，之后才是真上传；
 *                   上传段统计的是「交给网络的字节」，所以压到 99，等
 *                   CompleteMultipartUpload 返回之后由调用方置 100 —— 合并
 *                   大文件要几秒，进度条满着不动比停在 99% 更像卡死。
 */
export async function uploadFileToCos(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const credential = await getCosCredential();

  // 先算内容 md5 —— key 要用它，所以这一步必须在 Initiate 之前
  const md5 = await md5OfFile(file, (percent) => {
    onProgress?.(Math.floor((percent * HASH_WEIGHT) / 100));
  });

  const key = buildObjectKey(credential.uploadPrefix, md5, file);
  // 写打 COS 接入点，读用 CDN 域名，key 是同一份
  const target: CosTarget = { origin: credential.endpoint, key };
  const cdnTarget: CosTarget = { origin: credential.cdnDomain, key };

  const total = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = await initiateUpload(credential, target);

  // 每片各自上报已传字节，求和算总进度。并发完成顺序是乱的，
  // 所以按下标记，不能用累加的方式。
  const loaded: number[] = new Array(total).fill(0);
  const report = () => {
    if (!onProgress) return;
    const sum = loaded.reduce((a, b) => a + b, 0);
    const percent = HASH_WEIGHT + (sum / file.size) * (99 - HASH_WEIGHT);
    onProgress(Math.min(99, Math.floor(percent)));
  };

  const etags: string[] = new Array(total);
  let next = 0;

  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= total) return;
      const start = index * CHUNK_SIZE;
      const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
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

  return fileUrlOf(cdnTarget);
}
