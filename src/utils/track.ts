// 自家埋点上报（Moegen Track，POST {host}/report）。
// 信封格式固定：header（设备 / 用户 / 端）+ events[]（事件名 / 时间 / 会话 / 参数），
// 事件名和 params 按《埋点字段定义.md》填；移动端独有的事件（plus_click / next_step_click / first_open）不在这里。
//
// 用法：各页面调下面导出的 trackXxx()；新事件直接 track(event_name, params)。
// 事件先存进本地队列（localStorage），满 1 分钟或攒够 50 条才请求一次上报接口；
// 页面隐藏 / 关闭时用 sendBeacon 把剩下的一次送出，发失败的留在本地下次打开再发。
import { IS_TESTNET, trackUrl } from "@/util/config";
import { getGaClientId } from "@/utils/analytics";

// 上报总开关：先全部关掉，不入队、不存本地、不请求 /report。要打开改成 true
const TRACK_ENABLED = false;

// 上报地址：域名在 config.ts 的 trackUrl 里配
const REPORT_URL = trackUrl + "report";

const KEY_DEVICE = "trk_device_id";
const KEY_FIRST_VISIT = "trk_first_visit_at";
const KEY_SESSION = "trk_session_id";
const KEY_SESSION_ACTIVE = "trk_session_active";
const KEY_SESSION_START = "trk_session_start";
const KEY_SESSION_PV = "trk_session_pv"; // 本次会话浏览页次数（session_end 的 page_views）
const KEY_LOGGED_USERS = "trk_logged_users"; // 这台设备登录过的账号（user_identify 的 is_first_login）
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
 * 当前会话 id。30 分钟没动作就开新会话（先补报上一个会话的 session_end，再报新会话的 session_start）。
 * touch=true 表示这是一次用户动作，刷新「最后活动时间」。
 */
function currentSessionId(touch = true): string {
  const now = Date.now();
  let sid = safeGet(sessionStorage, KEY_SESSION);
  const last = Number(safeGet(sessionStorage, KEY_SESSION_ACTIVE)) || 0;
  if (!sid || (last && now - last > SESSION_TIMEOUT)) {
    // 没有会话 = 新开的标签页 / 冷启动；有但超时 = 超时后重新计
    const reason = sid ? "timeout_restart" : "cold_start";
    if (sid) flushSessionEnd();
    sid = "s_" + uuid();
    safeSet(sessionStorage, KEY_SESSION, sid);
    safeSet(sessionStorage, KEY_SESSION_START, String(now));
    safeSet(sessionStorage, KEY_SESSION_ACTIVE, String(now));
    safeSet(sessionStorage, KEY_SESSION_PV, "0");
    safeDel(sessionStorage, "trk_session_ended");
    enqueue("session_start", { start_reason: reason });
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

type TrackEvent = { event_id: string; event_name: string; event_time: number; session_id: string; params: Record<string, unknown> };

// 发送方式和 GA 一样是「近实时 + 小批量合并」：事件先进本地队列（localStorage），
// 5 秒内连着触发的几条合成一个请求发出去，攒够 20 条立即发；页面隐藏 / 关闭用 sendBeacon 把剩下的送出。
// 高频低价值的事件（视频播放进度）标 lowPriority：只进队列不起定时器，等别的事件发送时捎上、攒够 20 条或关页时才发。
// 存本地是为了刷新 / 关页不丢：下次打开时把上次没发完的一起带上。
// 发失败按 2s → 4s → 8s … 最多 60s 退避重试（GA 是丢了就丢，这里不丢），每条事件带 event_id 给后端去重。
const KEY_QUEUE = "trk_queue";
const FLUSH_DELAY = 5000;           // 合并窗口：事件触发后等这么久再发，期间触发的一起带上
const FLUSH_MAX = 20;               // 攒够这么多条不等窗口直接发
const RETRY_BASE = 2000;            // 失败后首次重试间隔
const RETRY_MAX = 60 * 1000;        // 重试间隔上限
const QUEUE_CAP = 500; // 本地最多攒这么多，再多丢最旧的，避免 localStorage 撑爆
let queue: TrackEvent[] = loadQueue();
let flushTimer: number | null = null;
let flushing = false;
let failCount = 0; // 连续失败次数，算退避间隔用；成功一次清零

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
function armTimer(delay = FLUSH_DELAY) {
  if (flushTimer == null && typeof window !== "undefined") {
    flushTimer = window.setTimeout(() => void flush(), delay);
  }
}
/** 失败后的重试间隔：2s、4s、8s … 封顶 60s */
function retryDelay(): number {
  return Math.min(RETRY_MAX, RETRY_BASE * Math.pow(2, Math.max(0, failCount - 1)));
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

function enqueue(eventName: string, params: Record<string, unknown>, lowPriority = false) {
  if (!TRACK_ENABLED) return;
  queue.push({
    event_id: uuid(), // 补发可能重复，后端按它去重
    event_name: eventName,
    event_time: Date.now(),
    session_id: safeGet(sessionStorage, KEY_SESSION), // 事件归哪个会话；队列会跨会话攒着，所以放事件上不放 header
    params,
  });
  saveQueue();
  if (isDebug) console.log("[Track Debug]", eventName, params, `(队列 ${queue.length})`);
  // 正在退避重试时不插队，等重试定时器；否则攒够了立即发，没攒够等合并窗口；
  // 低优先级事件不起定时器，只在攒满时发，其余时候等别的事件 / 关页捎带
  if (failCount > 0) armTimer(retryDelay());
  else if (queue.length >= FLUSH_MAX) void flush();
  else if (!lowPriority) armTimer();
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
      failCount = 0;
      if (isDebug) console.log("[Track Debug] 已上报", events.length, "条");
    } else {
      failCount++;
      if (isDebug) console.warn("[Track Debug] 上报失败 HTTP", res.status, "，", retryDelay() / 1000, "秒后重试");
    }
  } catch (err) {
    failCount++;
    if (isDebug) console.warn("[Track Debug] 上报失败", err, "，", retryDelay() / 1000, "秒后重试");
  } finally {
    flushing = false;
    // 还有剩：发成功了接着发下一批；失败了按退避间隔再试，别把挂掉的接口打爆
    if (queue.length > 0) {
      if (failCount > 0) armTimer(retryDelay());
      else if (queue.length >= FLUSH_MAX) void flush();
      else armTimer();
    }
  }
}

/** 通用上报：事件名 + 业务参数（按《埋点字段定义.md》） */
export function track(eventName: string, params: Record<string, unknown> = {}, opts: { lowPriority?: boolean } = {}) {
  // 过滤掉 undefined / null / 空串，少传没意义的字段
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  enqueue(eventName, clean, !!opts.lowPriority);
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
    page_views: Number(safeGet(sessionStorage, KEY_SESSION_PV)) || 0,
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
  safeSet(sessionStorage, KEY_SESSION_PV, String((Number(safeGet(sessionStorage, KEY_SESSION_PV)) || 0) + 1));
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

export type LoginType = "email" | "google" | "phone" | "third_party" | "auto";

/** 这台设备是否第一次登录这个账号（localStorage 记登录过的账号列表） */
function isFirstLoginOnDevice(uid: string): boolean {
  let list: string[] = [];
  try { list = JSON.parse(safeGet(localStorage, KEY_LOGGED_USERS) || "[]"); } catch { list = []; }
  if (list.includes(uid)) return false;
  list.push(uid);
  if (list.length > 50) list = list.slice(list.length - 50);
  safeSet(localStorage, KEY_LOGGED_USERS, JSON.stringify(list));
  return true;
}

/**
 * user_identify：登录 / 注册成功时调，把登录前的 device_id 和账号绑上（身份缝合）；
 * 已登录用户冷启动（initTracking）也报一次，login_type=auto。
 */
export function trackUserIdentify(userId: string | number, loginType: LoginType) {
  const uid = String(userId || "");
  if (!uid) return;
  track("user_identify", {
    user_id: uid,
    anonymous_id: safeGet(localStorage, KEY_DEVICE),
    login_type: loginType,
    is_first_login: isFirstLoginOnDevice(uid),
  });
}

/** register：注册成功（邮箱 / Google …），同时报 user_identify 做身份缝合 */
export function trackRegisterSuccess(userId: string | number, loginType: LoginType) {
  const uid = String(userId || "");
  if (!uid) return;
  track("register", { user_id: uid, anonymous_id: safeGet(localStorage, KEY_DEVICE), login_type: loginType });
  trackUserIdentify(uid, loginType);
}

/** login：登录成功（邮箱 / Google …），同时报 user_identify 做身份缝合 */
export function trackLoginSuccess(userId: string | number, loginType: LoginType) {
  const uid = String(userId || "");
  if (!uid) return;
  track("login", { user_id: uid, anonymous_id: safeGet(localStorage, KEY_DEVICE), login_type: loginType });
  trackUserIdentify(uid, loginType);
}

/**
 * 应用启动时调一次：报 first_open（首次），开会话，
 * 并挂上页面隐藏 / 关闭时的 session_end + 批量兜底发送。
 */
export function initTracking() {
  if (typeof window === "undefined" || !TRACK_ENABLED) return;
  // 上次没发完的先排上（满 50 立即发，否则 1 分钟后发）
  if (queue.length >= FLUSH_MAX) void flush(); else if (queue.length > 0) armTimer();
  // 冷启动 = 这个标签页还没有会话（刷新页面 sessionStorage 还在，不算）
  const coldStart = !safeGet(sessionStorage, KEY_SESSION);
  currentSessionId(); // 先开会话，后面的 first_open 等事件才带得上 session_id
  trackFirstVisit();
  // 已登录用户冷启动：报一次 user_identify(auto) 确认身份（文档 user_identify 触发时机）
  if (coldStart) {
    const uid = getUserId();
    if (uid) trackUserIdentify(uid, "auto");
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSessionEnd(true);
      void flush(true);
    } else {
      // 回到前台：超过 30 分钟会在 currentSessionId 里开新会话（报 timeout_restart）；
      // 没超时就是同一会话恢复：报一条 session_start(resume)，并允许它之后再报一次 session_end
      const before = safeGet(sessionStorage, KEY_SESSION);
      const sid = currentSessionId();
      if (sid === before && safeGet(sessionStorage, "trk_session_ended") === sid) {
        safeDel(sessionStorage, "trk_session_ended");
        enqueue("session_start", { start_reason: "resume" });
      }
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
 * 入口来源，取值按文档：
 *   合集 / 视频图片详情：home_feed（首页）/ community（博主主页）/ search / recommend / share（外站链接）/ other
 *   章节详情：catalog（目录点进来）/ auto_play（上一章 / 下一章 / 连播）/ home_feed / share / other
 * 「点了什么进来」优先：点击处先 markEntrySource()，下一次曝光事件用掉；没标记的按上一个路由推。
 */
export type EntrySource = "home_feed" | "community" | "search" | "recommend" | "share" | "catalog" | "auto_play" | "other";
let pendingEntrySource: EntrySource | "" = "";
/** 点击「会进详情页」的入口时标一下来源（目录点击在 trackCatalogChapterClick 里自动标；上一章 / 下一章 / 连播标 auto_play） */
export function markEntrySource(src: EntrySource) {
  pendingEntrySource = src;
}
function entrySourceOf(forChapter = false): EntrySource {
  if (pendingEntrySource) {
    const src = pendingEntrySource;
    pendingEntrySource = "";
    return src;
  }
  const prev = prevPagePath;
  if (!prev) {
    let ref = "";
    try { ref = document.referrer || ""; } catch { ref = ""; }
    if (ref && !ref.startsWith(window.location.origin)) return "share";
    return "other";
  }
  if (/^\/(?:(?:ja|en|zh-cn|zh-tw|ko|th)\/?)?(?:(?:novel|comic|drama|photo|video)\/?)?$/.test(prev)) return "home_feed";
  if (forChapter) {
    // 章节页：从合集页来的默认算目录进来；其它页面来的没有对应枚举，记 other
    if (/^\/collection\//.test(prev)) return "catalog";
    return "other";
  }
  if (/^\/user-home/.test(prev)) return "community";
  if (/^\/search/.test(prev)) return "search";
  return "other";
}

/** 9.1.1 合集详情页曝光（book_title = 文档的 collection_name） */
export function trackCollectionView(p: { book_id: string | number; book_title?: string; content_type: string; user_id?: string | number; entry_post_id?: string | number }) {
  if (!p.book_id || viewedThisSession("collection:" + p.book_id)) return;
  track("collection_view", { ...p, entry_source: entrySourceOf() });
}

/** 9.1.2 章节（小说 / 漫画 / 漫剧的作品详情页）曝光 */
export function trackChapterView(p: { post_id: string | number; book_id: string | number; content_type: string; user_id?: string | number; chapter_index?: string | number }) {
  if (!p.post_id) return;
  const prev = lastChapterPostId;
  lastChapterPostId = String(p.post_id);
  if (viewedThisSession("chapter:" + p.post_id)) { pendingEntrySource = ""; return; }
  track("chapter_view", {
    ...p,
    entry_source: entrySourceOf(true),
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
  markEntrySource("catalog"); // 接下来的 chapter_view 记目录进来
  track("catalog_chapter_click", p);
}

// ============================================================
// 九 9.2 互动：like_click / unlike_click / comment_publish / share / follow
// 目标用 target_type + target_id：collection 合集 / chapter 章节 / video / image / blogger 博主；
// 章节带所属合集 book_id；内容带博主 user_id；is_bot 由后端判，前端不报。
// ============================================================
export type InteractTarget = {
  target_type: "collection" | "chapter" | "video" | "image" | "blogger";
  target_id: string | number;
  /** 章节所属合集 */
  book_id?: string | number;
  /** 内容所属博主 */
  user_id?: string | number;
  content_type?: string;
};
/** 作品的互动目标：type 4 图片 / 5 视频按单作品，其它（小说 / 漫画 / 漫剧）按章节 */
export function workTarget(post: { id: string | number; type?: unknown; book_id?: string | number; user_id?: string | number }): InteractTarget {
  const ct = contentTypeOf(post.type);
  const target_type = ct === "video" ? "video" : ct === "image" ? "image" : "chapter";
  return {
    target_type,
    target_id: post.id,
    book_id: target_type === "chapter" && post.book_id && Number(post.book_id) > 0 ? post.book_id : undefined,
    user_id: post.user_id,
    content_type: ct || undefined,
  };
}
/** 9.2.2 点赞 */
export function trackLike(t: InteractTarget) { track("like_click", t); }
/** 9.2.3 取消点赞 */
export function trackUnlike(t: InteractTarget) { track("unlike_click", t); }
/** 9.2.4 发布评论成功 */
export function trackCommentPublish(t: InteractTarget, p: { comment_id?: string | number; reply_to_comment_id?: string | number; content_length?: number }) {
  track("comment_publish", { ...t, ...p });
}
/** 9.2.5 分享（复制链接等） */
export function trackShareEvent(t: InteractTarget, channel: "copy_link" | "whatsapp" | "x" | "facebook" | "instagram" | "telegram" | "other" = "copy_link") {
  track("share", { ...t, share_channel: channel });
}
/** 9.2.6 关注博主 */
export function trackFollow(bloggerId: string | number) {
  track("follow", { target_type: "blogger", target_id: bloggerId });
}
