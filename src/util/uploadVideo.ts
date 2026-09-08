import { baseUrl } from "@/util/config";

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
