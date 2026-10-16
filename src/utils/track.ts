// 自家埋点上报（Moegen Track，POST {host}/report）。
// 信封格式固定：header（设备 / 用户 / 端）+ events[]（事件名 / 时间 / 会话 / 参数），
// 事件名和 params 按《埋点字段定义.md》填；移动端独有的事件（plus_click / next_step_click / first_open）不在这里。
//
// 用法：各页面调下面导出的 trackXxx()；新事件直接 track(event_name, params)。
// 事件先存进本地队列（localStorage），满 1 分钟或攒够 50 条才请求一次上报接口；
// 页面隐藏 / 关闭时用 sendBeacon 把剩下的一次送出，发失败的留在本地下次打开再发。
import { IS_TESTNET, trackUrl } from "@/util/config";
import { getGaClientId } from "@/utils/analytics";

// 上报总开关：本地 / 测试 / 正式先全部关掉。
// 关掉时不入队、不存本地、不请求 /report，也不写首访标记（以后打开时老用户不会被漏报 first_open）。
// 要打开：把 false 改成 IS_TESTNET（本地和测试环境开、正式关），
// 或者 .env 里配 VITE_TRACK_ENABLED=true（只在本地 / 某个环境开）
const TRACK_ENABLED = false || (import.meta as any).env?.VITE_TRACK_ENABLED === "true";

// 上报地址：域名在 config.ts 的 trackUrl 里配
const REPORT_URL = trackUrl + "report";

const KEY_DEVICE = "trk_device_id";
const KEY_FIRST_VISIT = "trk_first_visit_at";
const KEY_SESSION = "trk_session_id";
const KEY_SESSION_ACTIVE = "trk_session_active";
const KEY_SESSION_START = "trk_session_start";
const SESSION_TIMEOUT = 30 * 60 * 1000;

// 调试日志：本地和测试环境打。原来按域名结尾判断，wwwtest.fansfans.ai / wwwtest.blfans.ai 会被误当成正式环境
const isDebug = IS_TESTNET;

function safeGet(store: Storage, key: string): string {
  try { return store.getItem(key) || ""; } catch { return ""; }
}
function safeSet(store: Storage, key: string, val: string) {
  try { store.setItem(key, val); } catch { /* 隐私模式等存不了就算了 */ }
}
function safeDel(store: Storage, key: string) {
  try { store.removeItem(key); } catch { /* ignore */ }
}
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ============================================================
// 设备 / 会话 / 用户
// ============================================================

let deviceIdCache = "";

/** 设备标识：优先 GA 的 client_id（和 GA 数据能对上），拿不到就自己生成一个存起来 */
async function getDeviceId(): Promise<string> {
  if (deviceIdCache) return deviceIdCache;
  const cached = safeGet(localStorage, KEY_DEVICE);
  if (cached) return (deviceIdCache = cached);
  let id = "";
  try { id = await getGaClientId(800); } catch { id = ""; }
  if (!id) id = "d_" + uuid();
  safeSet(localStorage, KEY_DEVICE, id);
  return (deviceIdCache = id);
}

/**
 * 当前会话 id。30 分钟没动作就开新会话（先补报上一个会话的 session_end）。
 * touch=true 表示这是一次用户动作，刷新「最后活动时间」。
 */
function currentSessionId(touch = true): string {
  const now = Date.now();
  let sid = safeGet(sessionStorage, KEY_SESSION);
  const last = Number(safeGet(sessionStorage, KEY_SESSION_ACTIVE)) || 0;
  if (!sid || (last && now - last > SESSION_TIMEOUT)) {
    if (sid) flushSessionEnd();
    sid = "s_" + uuid();
    safeSet(sessionStorage, KEY_SESSION, sid);
    safeSet(sessionStorage, KEY_SESSION_START, String(now));
    safeSet(sessionStorage, KEY_SESSION_ACTIVE, String(now));
  }
  if (touch) safeSet(sessionStorage, KEY_SESSION_ACTIVE, String(now));
  return sid;
}

function getUserId(): string {
  return safeGet(localStorage, "uid");
}

// ============================================================
// 环境信息
// ============================================================

const UA = typeof navigator !== "undefined" ? navigator.userAgent : "";

// pc
function clientType(): "web" {
  return "web";
}
function osName(): string {
  if (/iPhone|iPad|iPod/i.test(UA)) return "iOS";
  if (/Android/i.test(UA)) return "Android";
  if (/Windows/i.test(UA)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(UA)) return "macOS";
  if (/Linux/i.test(UA)) return "Linux";
  return "other";
}
function browserName(): string {
  if (/Edg\//i.test(UA)) return "Edge";
  if (/OPR\//i.test(UA)) return "Opera";
  if (/Chrome\//i.test(UA)) return "Chrome";
  if (/Safari\//i.test(UA) && !/Chrome/i.test(UA)) return "Safari";
  if (/Firefox\//i.test(UA)) return "Firefox";
  return "other";
}

/**
 * 落地页类型 + 对应 id：投放链接一般是首页 / 作品详情 / 合集详情 / 个人主页，
 * 从落地路径解析出来，后端不用再拆 landing_page。
 */
function landingInfo(): Record<string, string> {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/detail\/([^/?#]+)/))) return { landing_type: "detail", post_id: m[1] };
  if (path === "/detail" && q.get("id")) return { landing_type: "detail", post_id: q.get("id") || "" };
  if ((m = path.match(/^\/novel\/([^/?#]+)/))) return { landing_type: "novel_generate", gen_session_id: m[1] };
  if ((m = path.match(/^\/collection\/([^/?#]+)/))) return { landing_type: "collection_detail", book_id: m[1] };
  if ((m = path.match(/^\/user-home\/([^/?#]+)/))) return { landing_type: "user_home", user_id: m[1] };
  if (/^\/(?:(?:ja|en|zh-cn|zh-tw|ko|th)\/?)?$/.test(path) || /^\/(?:ja|en|zh-cn|zh-tw|ko|th)\/(?:novel|comic|drama|photo|video)\/?$/.test(path)) return { landing_type: "home" };
  return { landing_type: "other" };
}

/** 推广来源：落地 URL 上的 utm_source（X / facebook / youtube / instagram / tiktok …） */
function utmParams(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    const v = (q.get("utm_source") || "").trim();
    if (v) out.source = v;
  } catch { /* ignore */ }
  return out;
}

// ============================================================
// 发送（队列 + 批量）
// ============================================================

type TrackEvent = { event_name: string; event_time: number; params: Record<string, unknown> };

// 事件不是来一条发一条：先存进 localStorage 队列，满 1 分钟或攒够 50 条才请求一次上报接口。
// 存本地是为了刷新 / 关页不丢：下次打开时把上次没发完的一起带上。
const KEY_QUEUE = "trk_queue";
const FLUSH_DELAY = 60 * 1000;
const FLUSH_MAX = 50;
const QUEUE_CAP = 500; // 本地最多攒这么多，再多丢最旧的，避免 localStorage 撑爆
let queue: TrackEvent[] = loadQueue();
let flushTimer: number | null = null;
let flushing = false;

function loadQueue(): TrackEvent[] {
  try {
    const raw = safeGet(localStorage, KEY_QUEUE);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveQueue() {
  if (queue.length > QUEUE_CAP) queue = queue.slice(queue.length - QUEUE_CAP);
  if (queue.length === 0) safeDel(localStorage, KEY_QUEUE);
  else safeSet(localStorage, KEY_QUEUE, JSON.stringify(queue));
}
function armTimer() {
  if (flushTimer == null && typeof window !== "undefined") {
    flushTimer = window.setTimeout(() => void flush(), FLUSH_DELAY);
  }
}

function buildHeader(deviceId: string) {
  return {
    device_id: deviceId,
    user_id: getUserId() || "",
    client_type: clientType(),
    platform: clientType(), // 端口：PC 站固定 web（os 放在 first_open 的 params 里）
    source: "fansfans", // 平台（来源站点）
    app_version: (import.meta as any).env?.VITE_APP_VERSION || "",
  };
}

function enqueue(eventName: string, params: Record<string, unknown>) {
  if (!TRACK_ENABLED) return;
  queue.push({
    event_name: eventName,
    event_time: Date.now(),
    params,
  });
  saveQueue();
  if (isDebug) console.log("[Track Debug]", eventName, params, `(队列 ${queue.length})`);
  if (queue.length >= FLUSH_MAX) void flush();
  else armTimer();
}

/** 把队列里的事件发出去。beacon=true 用 sendBeacon（页面关闭 / 隐藏时用，fetch 可能发不出去） */
async function flush(beacon = false) {
  if (!TRACK_ENABLED) return;
  if (flushTimer != null) { clearTimeout(flushTimer); flushTimer = null; }
  if (queue.length === 0 || flushing) return;
  flushing = true;
  const events = queue.slice(0, FLUSH_MAX);
  try {
    const body = JSON.stringify({ header: buildHeader(await getDeviceId()), events });
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      // sendBeacon 只能发简单类型，服务端要能接 text/plain 的 JSON 串。
      // 它不返回结果，按已发出处理（发不出去也只是丢这一批）
      navigator.sendBeacon(REPORT_URL, new Blob([body], { type: "text/plain" }));
      queue = queue.slice(events.length);
      saveQueue();
      return;
    }
    const res = await fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    if (res.ok) {
      // 发成功才从本地队列里去掉，失败留着下一轮再发
      queue = queue.slice(events.length);
      saveQueue();
      if (isDebug) console.log("[Track Debug] 已上报", events.length, "条");
    } else if (isDebug) {
      console.warn("[Track Debug] 上报失败 HTTP", res.status);
    }
  } catch (err) {
    if (isDebug) console.warn("[Track Debug] 上报失败", err);
  } finally {
    flushing = false;
    // 还有剩（一批没发完 / 发失败）：接着排下一次
    if (queue.length >= FLUSH_MAX) void flush();
    else if (queue.length > 0) armTimer();
  }
}

/** 通用上报：事件名 + 业务参数（按《埋点字段定义.md》） */
export function track(eventName: string, params: Record<string, unknown> = {}) {
  // 过滤掉 undefined / null / 空串，少传没意义的字段
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  enqueue(eventName, clean);
}

// ============================================================
// 二、用户概况：first_open / session_end / page_view / user_identify
// ============================================================

/**
 * first_visit：这台设备（浏览器）第一次打开网站时报一次，带推广来源。
 * 判定靠 localStorage 标记；用户清缓存 / 无痕会再算一次，和 GA 的 first_visit 口径一致。
 */
export function trackFirstVisit() {
  if (safeGet(localStorage, KEY_FIRST_VISIT)) return;
  safeSet(localStorage, KEY_FIRST_VISIT, String(Date.now()));
  track("first_open", {
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    landing_page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
    ...landingInfo(),
    ...utmParams(),
    device: clientType(),
    os: osName(),
    browser: browserName(),
  });
}

/** session_end：带会话时长（给"会话>10s"用） */
function flushSessionEnd(beacon = false) {
  const sid = safeGet(sessionStorage, KEY_SESSION);
  const start = Number(safeGet(sessionStorage, KEY_SESSION_START)) || 0;
  if (!sid || !start) return;
  const last = Number(safeGet(sessionStorage, KEY_SESSION_ACTIVE)) || Date.now();
  const ended = safeGet(sessionStorage, "trk_session_ended");
  if (ended === sid) return; // 同一会话只报一次结束
  safeSet(sessionStorage, "trk_session_ended", sid);
  enqueue("session_end", {
    duration: Math.max(0, Math.round((last - start) / 1000)),
  });
  if (beacon) void flush(true);
}

/**
 * page_view：路由切换时调，只报这几个页面：
 * home 首页 / generate 生成页（视频 / 图片）/ novel_generate 小说生成页（/novel/:id）/ user_home 个人主页 /
 * detail 作品详情 / collection_detail 合集详情 / search 搜索页 / publish 发布页。其它路由不报。
 */
export function trackPageView(info: {
  path: string;
  name?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
}) {
  currentSessionId(); // 刷新会话活动时间（超时会自动开新会话）
  const p = info.params || {};
  const q = info.query || {};
  const path = info.path || "";
  prevPagePath = curPagePath;
  curPagePath = path;
  let page_name = "";
  const extra: Record<string, unknown> = {};
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/(?:(?:ja|en|zh-cn|zh-tw|ko|th)\/?)?(?:(novel|comic|drama|photo|video)\/?)?$/))) {
    page_name = "home";
    if (m[1]) extra.content_type = m[1] === "photo" ? "image" : m[1];
  } else if (/^\/generate\/?$/.test(path)) {
    page_name = "generate";
  } else if (/^\/novel\/[^/]+/.test(path)) {
    page_name = "novel_generate";
    extra.gen_session_id = p.id;
  } else if (/^\/user-home/.test(path)) {
    page_name = "user_home";
    extra.user_id = p.id || q.uid;
  } else if (/^\/detail/.test(path)) {
    page_name = "detail";
    extra.post_id = p.id || q.id;
  } else if (/^\/collection\/[^/]+/.test(path)) {
    page_name = "collection_detail";
    extra.book_id = p.id;
  } else if (/^\/search\/?$/.test(path)) {
    page_name = "search";
    extra.keyword = q.keyword;
  } else if ((m = path.match(/^\/publish\/(video|video-batch|clip|clip-batch|comic|novel|image)\/?$/))) {
    // 发布页：路径里的 video 是漫剧、clip 是视频，上报按内容类型给：
    // drama / drama_batch / video / video_batch / comic / novel / image；/publish/success 不报
    const publishType: Record<string, string> = {
      video: "drama", "video-batch": "drama_batch",
      clip: "video", "clip-batch": "video_batch",
      comic: "comic", novel: "novel", image: "image",
    };
    page_name = "publish";
    extra.publish_type = publishType[m[1]] || m[1];
    if (q.id || q.post_id) extra.post_id = q.id || q.post_id; // 编辑作品时带
  }
  if (!page_name) return;
  enqueue("page_view", { page_name, path, ...extra });
}

/**
 * user_identify：登录 / 注册成功时调，把登录前的 device_id 和账号绑上（身份缝合）。
 * 已登录状态下的日常事件 header 里本来就带 user_id，不需要再报。
 */
export function trackUserIdentify(userId: string | number, loginType: "email" | "google") {
  const uid = String(userId || "");
  if (!uid) return;
  track("user_identify", {
    user_id: uid,
    anonymous_id: safeGet(localStorage, KEY_DEVICE),
    login_type: loginType,
  });
}

/**
 * 应用启动时调一次：报 first_open（首次），开会话，
 * 并挂上页面隐藏 / 关闭时的 session_end + 批量兜底发送。
 */
export function initTracking() {
  if (typeof window === "undefined" || !TRACK_ENABLED) return;
  // 上次没发完的先排上（满 50 立即发，否则 1 分钟后发）
  if (queue.length >= FLUSH_MAX) void flush(); else if (queue.length > 0) armTimer();
  trackFirstVisit();
  currentSessionId();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSessionEnd(true);
      void flush(true);
    } else {
      // 回到前台：超过 30 分钟会在 currentSessionId 里开新会话；
      // 没超时就是同一会话恢复，允许它之后再报一次 session_end
      const before = safeGet(sessionStorage, KEY_SESSION);
      const sid = currentSessionId();
      if (sid === before) safeDel(sessionStorage, "trk_session_ended");
    }
  });
  window.addEventListener("pagehide", () => { flushSessionEnd(true); void flush(true); });
}

// ============================================================
// 九、浏览量曝光：collection_view / chapter_view / work_view / catalog_chapter_click
// 「一次浏览」= 详情页加载完成；同一会话内同一目标只计 1 次（sessionStorage 记已曝光的 key），
// 目标变了或换了会话才再计。字段名按接口：post_id / book_id / user_id（博主）。
// ============================================================
let prevPagePath = "";
let curPagePath = "";
let lastChapterPostId = "";
const KEY_VIEWED = "trk_viewed";

/** 作品 type 数字 → 内容类型：1 漫画 / 2 小说 / 3 漫剧 / 4 图片 / 5 视频 */
export function contentTypeOf(type: unknown): string {
  const m: Record<string, string> = { "1": "comic", "2": "novel", "3": "drama", "4": "image", "5": "video" };
  return m[String(type ?? "")] || "";
}

/** 本会话里这个目标是否已经曝光过；没曝光过就记下来并返回 false */
function viewedThisSession(key: string): boolean {
  const sid = currentSessionId(false);
  let list: string[] = [];
  try { list = JSON.parse(safeGet(sessionStorage, KEY_VIEWED) || "[]"); } catch { list = []; }
  const k = sid + "|" + key;
  if (list.includes(k)) return true;
  list.push(k);
  if (list.length > 300) list = list.slice(list.length - 300);
  safeSet(sessionStorage, KEY_VIEWED, JSON.stringify(list));
  return false;
}

/**
 * 入口来源：按上一个路由推。没有上一个路由（直接打开 / 刷新）时，
 * 外站 referrer 当分享链接 share，其它算 other。
 */
function entrySourceOf(): string {
  const prev = prevPagePath;
  if (!prev) {
    let ref = "";
    try { ref = document.referrer || ""; } catch { ref = ""; }
    if (ref && !ref.startsWith(window.location.origin)) return "share";
    return "other";
  }
  // 取值和 page_view 的 page_name 一套：home / user_home / search / collection_detail / detail
  if (/^\/(?:(?:ja|en|zh-cn|zh-tw|ko|th)\/?)?(?:(?:novel|comic|drama|photo|video)\/?)?$/.test(prev)) return "home";
  if (/^\/user-home/.test(prev)) return "user_home";
  if (/^\/search/.test(prev)) return "search";
  if (/^\/collection\//.test(prev)) return "collection_detail";
  if (/^\/detail/.test(prev)) return "detail";
  return "other";
}

/** 9.1.1 合集详情页曝光 */
export function trackCollectionView(p: { book_id: string | number; book_title?: string; content_type: string; user_id?: string | number; entry_post_id?: string | number }) {
  if (!p.book_id || viewedThisSession("collection:" + p.book_id)) return;
  track("collection_view", { ...p, entry_source: entrySourceOf() });
}

/** 9.1.2 章节（小说 / 漫画 / 漫剧的作品详情页）曝光 */
export function trackChapterView(p: { post_id: string | number; book_id: string | number; content_type: string; user_id?: string | number; chapter_index?: string | number }) {
  if (!p.post_id) return;
  const prev = lastChapterPostId;
  lastChapterPostId = String(p.post_id);
  if (viewedThisSession("chapter:" + p.post_id)) return;
  track("chapter_view", {
    ...p,
    entry_source: entrySourceOf(),
    prev_post_id: prev && prev !== String(p.post_id) ? prev : undefined,
  });
}

/** 9.1.3 视频 / 图片作品详情页曝光 */
export function trackWorkView(p: { post_id: string | number; content_type: string; user_id?: string | number; duration?: string | number }) {
  if (!p.post_id || viewedThisSession("work:" + p.post_id)) return;
  track("work_view", { ...p, entry_source: entrySourceOf() });
}

/** 9.1.4 目录里点某一章 */
export function trackCatalogChapterClick(p: { book_id: string | number; post_id: string | number; chapter_index?: string | number; content_type: string; user_id?: string | number }) {
  track("catalog_chapter_click", p);
}
