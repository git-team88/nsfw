import { baseUrl } from "@/util/config";
import api from "@/api/index";

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
//   direct    预签名直传：浏览器 → COS，少一跳，快，且不占用自己的服务器带宽。
//             代价是没有分片粒度的重试（中途断了整个重来），暂时也不上报进度。
//   multipart 服务端中转分片：浏览器 → 自己的服务器 → COS。
//             慢、吃带宽，但单片失败可重试、有进度。
//
// 后端把分片直传（按 partNumber 批量签 URL + CORS 放开 ETag）做好之后，
// 只要把这个常量改回 'multipart'，或者加一个 'direct-multipart' 分支即可，
// 页面调用方一行都不用动。
// ---------------------------------------------------------------------------
const UPLOAD_MODE: "direct" | "multipart" = "direct";

/** 视频上传成功后统一替换成的静态域名 */
const STATIC_HOST = "https://static.moegen.ai";

function contentTypeOf(ext: string): string {
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return "video/mp4";
}

/** 预签名直传：拿一个 PUT URL，整个文件一次传上去 */
async function uploadDirect(file: File): Promise<string> {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf(".") + 1);

  const res = (await api.uploadAduio({ extension: ext })) as any;
  if (!res || (res.code !== 0 && res.code !== 200)) throw new PartUploadError(res);

  const presignedUrl = res.data?.url;
  if (!presignedUrl) throw new PartUploadError(res);

  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentTypeOf(ext) },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload failed with status ${putRes.status}`);

  const cleanUrl = presignedUrl.split("?")[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, STATIC_HOST);
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
 * 上传一个视频文件，返回可访问的地址。
 * 走哪条通道由 UPLOAD_MODE 决定，调用方不用关心。
 *
 * @param onProgress 上传进度（0-100）。direct 通道暂时不会回调 —— fetch 拿不到
 *                   上传进度，调用方的进度条判空即可（现有几处都是 `> 0` 才显示）。
 */
export async function uploadVideoFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return UPLOAD_MODE === "direct" ? uploadDirect(file) : uploadMultipart(file, onProgress);
}
