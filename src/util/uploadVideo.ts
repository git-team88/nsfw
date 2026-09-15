import { baseUrl } from "@/util/config";
import api from "@/api/index";
import { uploadFileToCos, CosUploadError, type CosTarget } from "@/util/cosUpload";

/** 分片大小，需与后端 / COS 约定保持一致 */
const CHUNK_SIZE = 5 * 1024 * 1024;
/** 并发上传的分片数，移动端网络较差时可下调至 2 */
const CONCURRENCY = 4;
/** 单个分片的网络失败重试次数 */
const MAX_RETRY = 3;

export type UploadPart = { PartNumber: number; ETag: string };

/**
 * 分片上传过程中的业务错误（后端返回 code !== 0）。
 * 携带原始响应体，便于调用方用 getI18nMsg 还原提示文案。
 */
export class PartUploadError extends Error {
  payload: any;
  constructor(payload: any) {
    super("upload part failed");
    this.name = "PartUploadError";
    this.payload = payload;
  }
}

/**
 * 上传单个分片。
 * 网络异常会按 200ms / 400ms / 800ms 退避重试；
 * 后端明确返回的业务错误（code !== 0）不重试，直接抛出。
 */
async function uploadPart(
  file: File,
  partNumber: number,
  uploadId: string,
  fileKey: string,
): Promise<UploadPart> {
  const start = (partNumber - 1) * CHUNK_SIZE;
  const chunk = file.slice(start, Math.min(partNumber * CHUNK_SIZE, file.size));

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("key", fileKey);
      formData.append("partNumber", String(partNumber));
      formData.append("file", chunk);

      const authToken = localStorage.getItem("token") ?? "";
      const authHeaders = (window as any).AntiCrawler.generateAuthParams(authToken);

      const res = await fetch(baseUrl + "user/uploadCosPart", {
        method: "POST",
        headers: {
          token: authToken || undefined,
          Platform: "web",
          ...authHeaders,
        } as Record<string, string>,
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // 业务错误不重试：重试也不会变好，且可能重复扣配额
      if (!data || data.code !== 0) throw new PartUploadError(data);

      return { PartNumber: partNumber, ETag: data.data?.etag || "" };
    } catch (err) {
      if (err instanceof PartUploadError) throw err;
      if (attempt === MAX_RETRY) throw err;
      await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
    }
  }

  throw new Error("unreachable");
}

/**
 * 以固定并发上传全部分片。
 *
 * 返回的数组按 PartNumber 升序排列 —— COS 的 completeMultipartUpload
 * 要求 parts 有序，并发完成顺序是乱的，因此必须按下标写回而非 push。
 *
 * @param onProgress 已完成分片占比（0-100）
 */
export async function uploadParts(
  file: File,
  uploadId: string,
  fileKey: string,
  onProgress?: (percent: number) => void,
): Promise<UploadPart[]> {
  const total = Math.ceil(file.size / CHUNK_SIZE);
  const parts: UploadPart[] = new Array(total);
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= total) return;
      parts[index] = await uploadPart(file, index + 1, uploadId, fileKey);
      done++;
      onProgress?.(Math.round((done / total) * 100));
    }
  };

  // 任一 worker 抛错，Promise.all 立即 reject
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()),
  );

  return parts;
}

// ---------------------------------------------------------------------------
// 上传通道
//
//   direct     预签名直传：浏览器 → COS，一次 PUT 传完。少一跳，不占自己的带宽，
//              但断了整个重来。改用 XHR 之后有进度了。
//   multipart  服务端中转分片：浏览器 → 自己的服务器 → COS。
//              慢、吃带宽，单片可重试、有进度。留着做兜底。
//   cos-sts    STS 凭证直传分片：浏览器拿临时密钥自己和 COS 说话，
//              Initiate → UploadPart x N（并发）→ Complete。
//              既不占自己的带宽，又有单片重试和字节级进度。
//
// 页面调用方只认 uploadVideoFile(file, onProgress)，换通道不用动页面。
// ---------------------------------------------------------------------------
const UPLOAD_MODE: "direct" | "multipart" | "cos-sts" = "cos-sts";

/** 视频上传成功后统一替换成的静态域名 */
const STATIC_HOST = "https://static.moegen.ai";

/** 小于这个大小就一次 PUT 传完，没必要为几 MB 走三次请求的分片流程 */
const SLICE_THRESHOLD = 10 * 1024 * 1024;

function contentTypeOf(ext: string): string {
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return "video/mp4";
}

function extensionOf(file: File): string {
  return file.name.toLowerCase().substring(file.name.lastIndexOf(".") + 1);
}

/** 预签名地址去掉签名参数、换成静态域名，就是最终可访问的地址 */
function toStaticUrl(presignedUrl: string): string {
  return presignedUrl.split("?")[0].replace(/^https?:\/\/[^/]+/, STATIC_HOST);
}

/**
 * 从预签名地址里解析出桶、地域和对象路径。
 *
 * 凭证接口只给临时密钥，桶 / 地域 / key 一个都没有；而预签名地址里三样俱全，
 * 且一定落在后端 STS 策略允许写入的范围内。所以桶名、地域、路径规则全留在后端，
 * 前端一个常量都不写死，后端换桶、换地域、换路径，前端都不用跟着发版。
 */
function parseCosTarget(presignedUrl: string): CosTarget | null {
  try {
    const url = new URL(presignedUrl);
    const matched = /^(.+)\.cos\.([a-z0-9-]+)\.myqcloud\.com$/i.exec(url.hostname);
    if (!matched) return null;
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    if (!key) return null;
    return { bucket: matched[1], region: matched[2], key };
  } catch {
    return null;
  }
}

/** 向后端要一个预签名 PUT 地址 */
async function allocateTarget(file: File): Promise<string> {
  const res = (await api.uploadAduio({ extension: extensionOf(file) })) as any;
  if (!res || (res.code !== 0 && res.code !== 200)) throw new PartUploadError(res);
  const presignedUrl = res.data?.url;
  if (!presignedUrl) throw new PartUploadError(res);
  return presignedUrl;
}

/**
 * 预签名直传：一次 PUT 把整个文件传上去。
 * 用 XHR 而不是 fetch —— fetch 拿不到上传进度。
 */
function putPresigned(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", contentTypeOf(extensionOf(file)));

    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        // 压到 99：这里统计的是交给网络的字节，COS 确认之前先别满
        if (e.lengthComputable) onProgress?.(Math.min(99, Math.floor((e.loaded / e.total) * 100)));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(toStaticUrl(presignedUrl));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send(file);
  });
}

/** 预签名直传通道 */
async function uploadDirect(file: File, onProgress?: (percent: number) => void): Promise<string> {
  return putPresigned(await allocateTarget(file), file, onProgress);
}

/** 服务端中转分片：getCosUploadId → 分片并发上传 → completeCosMultipartUpload */
async function uploadMultipart(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const idRes = (await api.getVideoId({ filename: file.name, filesize: file.size })) as any;
  if (!idRes || idRes.code !== 0) throw new PartUploadError(idRes);

  const { uploadId, fileKey } = idRes.data;
  const parts = await uploadParts(file, uploadId, fileKey, onProgress);

  const mergeRes = (await api.getVideoMerge({
    uploadId,
    key: fileKey,
    parts: JSON.stringify(parts),
  })) as any;
  if (!mergeRes || mergeRes.code !== 0) throw new PartUploadError(mergeRes);

  return mergeRes.data?.url || "";
}

/**
 * STS 凭证直传分片通道。选完文件之后的请求顺序：
 *
 *   <= 10MB：getCosUploadPreSignUrl -> PUT 一次传完（和以前一样，不碰凭证接口）
 *   >  10MB：getCosUploadPreSignUrl -> cos_upload_credential
 *            -> Initiate -> UploadPart x N（并发）-> Complete
 *
 * 分片要往 https://{Bucket}.cos.{Region}.myqcloud.com/{Key} 上发，这三样凭证接口
 * 不给，都在预签名地址里（见 parseCosTarget）—— 所以大文件也要先要一次预签名地址。
 * 那个请求很轻，之后几百 MB 的字节流全部是浏览器直连 COS，不经过自己的服务器。
 */
async function uploadCosSts(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const presignedUrl = await allocateTarget(file);

  // 小文件一次 PUT 就够了，不申请凭证
  if (file.size <= SLICE_THRESHOLD) return putPresigned(presignedUrl, file, onProgress);

  const target = parseCosTarget(presignedUrl);
  // 解析不出桶信息（比如以后换成自定义加速域名）就用手上这个地址一次 PUT 传完
  if (!target) return putPresigned(presignedUrl, file, onProgress);

  try {
    // 第一步就是 getCosCredential（凭证带缓存，2 小时内只申请一次）
    await uploadFileToCos(file, target, onProgress);
  } catch (err) {
    // setup 阶段（申请凭证、Initiate）失败时一个字节都还没出去，退回单次 PUT，
    // 别让上传直接挂掉；传到一半才失败的就老实报错，整个重传不划算。
    if (err instanceof CosUploadError && err.stage === "setup") {
      console.warn("[upload] COS 分片启动失败，退回预签名直传", err);
      return putPresigned(presignedUrl, file, onProgress);
    }
    console.error("[upload] COS 分片上传失败", err);
    throw err instanceof Error ? err : new Error("cos upload failed");
  }

  onProgress?.(100);
  return toStaticUrl(presignedUrl);
}

/**
 * 上传一个视频文件，返回可访问的地址。
 * 走哪条通道由 UPLOAD_MODE 决定，调用方不用关心。
 *
 * @param onProgress 上传进度（0-100）。三条通道现在都会回调。
 */
export async function uploadVideoFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (UPLOAD_MODE === "cos-sts") return uploadCosSts(file, onProgress);
  if (UPLOAD_MODE === "multipart") return uploadMultipart(file, onProgress);
  return uploadDirect(file, onProgress);
}
