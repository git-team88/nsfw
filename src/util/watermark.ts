import api from "@/api/index";

/** 从 post/addPost* 的返回里取新作品 id（返回可能是数字 / 字符串 / {post_id} / {id}） */
export function pickNewPostId(res: any): string | number | undefined {
  const data = res?.data;
  if (data == null) return undefined;
  if (typeof data === "number" || typeof data === "string") return data;
  return data.post_id ?? data.id;
}

/**
 * 作品发布成功后提交「图片加水印」异步任务（app/posts_watermark）。
 * 漫画 1 / 小说 2 / 图片 4 调；漫剧 3、短剧 5 不调；siteid 由 request 拦截器按站点带上。
 * 失败只记日志，不影响发布流程；不 await 也行——SPA 路由跳转不会取消已发出的请求。
 */
export async function submitPostWatermark(postId: unknown) {
  if (!postId || (typeof postId !== "string" && typeof postId !== "number")) return;
  try {
    await api.postsWatermark(postId);
  } catch (err) {
    console.warn("[watermark] 提交加水印任务失败", postId, err);
  }
}
