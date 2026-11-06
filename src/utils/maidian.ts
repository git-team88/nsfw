// 自家埋点（业务层）。发送由 public/maidian-sdk.js 负责（index.html 里引入，挂在 window.maidian 上）：
// 本地队列、批量合并、失败重试、event_id 去重、会话（session_start / session_end）、
// 端 / 设备 / 系统 / 浏览器 / 页面等公共字段都在 SDK 里，这里只管「报什么事件、带什么参数」。
//
// 事件名和 params 按《埋点字段定义.md》填；移动端独有的事件（plus_click / next_step_click）不在这里。
// 用法：各页面调下面导出的 trackXxx()；新事件直接 track(event_name, params)。
// 后端接口：POST {trackUrl}/api/v1/track/batch，每条 { app_id, event, distinct_id, user_id, timestamp, extra_data }，
// 这里的 params 原样进 extra_data。
import { IS_TESTNET, trackUrl, trackAppId } from "@/util/config";

// 上报总开关：先全部关掉（SDK enabled=false：不入队、不存本地、不请求）。要打开改成 true
const TRACK_ENABLED = true;

// 暂不上报的事件：代码和调用处都保留，要恢复把对应开关改成 true
const FIRST_OPEN_ENABLED = false; // first_open（设备首次打开）
// collection_view / chapter_view / work_view / catalog_chapter_click：浏览量改用 history_view（接口文档 4.4）
const VIEW_EVENTS_ENABLED = false;
// register / login / user_identify：不做身份绑定，登录前 user_id 传空、登录后传值，靠 distinct_id 关联（登录态照常同步给 SDK）
const IDENTIFY_EVENTS_ENABLED = false;

const KEY_FIRST_VISIT = "trk_first_visit_at";
const KEY_LOGGED_USERS = "trk_logged_users"; // 这台设备登录过的账号（user_identify 的 is_first_login）
const KEY_VIEWED = "trk_viewed"; // 本会话已曝光的目标（浏览去重）

// 调试日志：本地和测试环境打。原来按域名结尾判断，wwwtest.fansfans.ai / wwwtest.blfans.ai 会被误当成正式环境
const isDebug = IS_TESTNET;

// initTracking 里 config 过 SDK 才为 true。App.vue 调 initTracking 之前路由可能已经报了 page_view，
// 所以 ready 之前的事件先攒在 pendingEvents 里，config 完了再按顺序交给 SDK；总开关关着 / 没 app_id 时直接丢
let ready = false;
let pendingEvents: Array<[string, Record<string, unknown>, { lowPriority?: boolean; keepEmpty?: boolean }]> = [];

function safeGet(store: Storage, key: string): string {
  try { return store.getItem(key) || ""; } catch { return ""; }
}
function safeSet(store: Storage, key: string, val: string) {
  try { store.setItem(key, val); } catch { /* 隐私模式等存不了就算了 */ }
}

/** window.maidian：index.html 里的桩或 SDK 本体；SSR / 预渲染没有 window 时为空 */
function sdk(): MaidianFn | null {
  return typeof window !== "undefined" && typeof window.maidian === "function" ? window.maidian : null;
}

function getUserId(): string {
  return safeGet(localStorage, "uid");
}

/** 设备 id（= SDK 的 distinct_id：客户端生成的 uuid v4，存 localStorage）；user_identify 的 anonymous_id 用 */
function getDeviceId(): string {
  const m = sdk();
  return m ? String(m("get_distinct_id") || "") : "";
}

/** 当前会话 id（SDK 管理：30 分钟无动作开新会话并自动报 session_start / session_end）；config 之前还没有会话 */
function currentSessionId(): string {
  const m = sdk();
  return m && ready ? String(m("get_session_id") || "") : "";
}

// ============================================================
// 发送：交给 SDK
// ============================================================

/**
 * 报一条事件。lowPriority=true 的高频事件（视频播放进度）只进队列不触发定时器，
 * 等别的事件发送时捎上、攒够一批或关页时才发。
 */
export function track(eventName: string, params: Record<string, unknown> = {}, opts: { lowPriority?: boolean; keepEmpty?: boolean } = {}) {
  if (!TRACK_ENABLED) return;
  // 默认过滤掉 undefined / null / 空串，少传没意义的字段；keepEmpty=true 时字段都保留，没值的传空串（字段固定的事件用）
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (opts.keepEmpty) clean[k] = v === undefined || v === null ? "" : v;
    else if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  if (!ready) {
    pendingEvents.push([eventName, clean, opts]);
    return;
  }
  const m = sdk();
  if (!m) return;
  m("event", eventName, clean, opts.lowPriority ? { lowPriority: true } : undefined);
  if (isDebug) console.log("[Track Debug]", eventName, clean);
}

/** 登录态同步给 SDK：登录 / 冷启动传 uid，退出登录传 null（之后的事件 user_id 为空） */
export function setTrackUser(userId: string | number | null) {
  const m = sdk();
  if (!m) return;
  m("set", { user_id: userId === null || userId === undefined || userId === "" ? null : String(userId) });
}

/**
 * 应用启动时调一次（App.vue）：config SDK，同步登录态，报 first_open（首次）；
 * 已登录用户冷启动报一次 user_identify(auto)。会话、关页兜底发送都在 SDK 里。
 */
export async function initTracking() {
  const m = sdk();
  if (!m) return;
  if (!trackAppId) {
    if (isDebug) console.warn("[Track Debug] config.ts 没配 trackAppId，埋点不上报");
    return;
  }
  // 冷启动 = 这个标签页还没有会话（刷新页面 sessionStorage 还在，不算）；要在 config 之前判，config 会开会话
  const coldStart = !safeGet(sessionStorage, "__maidian_session_id__");
  // 设备 id（distinct_id）不传，由 SDK 生成 uuid v4 存 localStorage（__maidian_distinct_id__），之后一直用这个
  m("config", trackAppId, {
    server_url: trackUrl.replace(/\/+$/, ""),
    app_version: (import.meta as any).env?.VITE_APP_VERSION || "",
    enabled: TRACK_ENABLED,
    debug: isDebug && TRACK_ENABLED,
    // 会话事件（session_start / session_end）不报了，只报 page_view / history_view
    auto_session: false,
  });
  ready = TRACK_ENABLED;
  const uid = getUserId();
  setTrackUser(uid || null);
  trackFirstVisit();
  // 已登录用户冷启动：报一次 user_identify(auto) 确认身份（文档 user_identify 触发时机）
  if (coldStart && uid) trackUserIdentify(uid, "auto");
  // config 之前攒下的事件（首个 page_view 等）按顺序补上
  const backlog = pendingEvents;
  pendingEvents = [];
  for (const [name, params, opts] of backlog) track(name, params, opts);
}

// ============================================================
// 二、用户概况：first_open / page_view / user_identify（session_start / session_end 由 SDK 报）
// ============================================================

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

/**
 * first_visit：这台设备（浏览器）第一次打开网站时报一次，带推广来源。
 * 判定靠 localStorage 标记；用户清缓存 / 无痕会再算一次，和 GA 的 first_visit 口径一致。
 * referrer / device / os / browser 由 SDK 自动带，这里不传。
 */
export function trackFirstVisit() {
  if (!ready) return;
  if (safeGet(localStorage, KEY_FIRST_VISIT)) return;
  safeSet(localStorage, KEY_FIRST_VISIT, String(Date.now()));
  // 关着时照样记「已打开过」，以后打开开关不会把老设备再算成首次
  if (!FIRST_OPEN_ENABLED) return;
  track("first_open", {
    landing_page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
    ...landingInfo(),
    ...utmParams(),
  });
}

/** 营销参数（接口文档 4.3）：当前地址上的 utm_source / utm_medium / utm_campaign，有才带 */
function utmFields(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
      const v = (q.get(k) || "").trim();
      if (v) out[k] = v;
    }
  } catch { /* ignore */ }
  return out;
}

/**
 * page_view（接口文档 4.3）：每次路由切换都报（所有页面），页面分类放 page_type：
 * home 首页 / generate 生成页（视频 / 图片）/ novel_generate 小说生成页（/novel/:id）/ user_home 个人主页 /
 * detail 作品详情 / collection_detail 合集详情 / search 搜索页 / publish 发布页；
 * 其它页面按路径取名（/user-payment-history → user_payment_history，/publish/success → publish_success），404 记 not_found。
 * SDK 会按 page_view 事件数算 session_end 的 page_views。
 */
export function trackPageView(info: {
  path: string;
  name?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  /** 上一个路由的完整地址（站内跳转才有），作 referrer */
  from?: string;
}) {
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
  } else if (/^\/user-home/.test(path)) {
    page_name = "user_home";
  } else if (/^\/detail/.test(path)) {
    page_name = "detail";
  } else if (/^\/collection\/[^/]+/.test(path)) {
    page_name = "collection_detail";
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
  }
  if (!page_name) {
    page_name = info.name === "NotFound"
      ? "not_found"
      : path.replace(/^\/+|\/+$/g, "").split("/").filter((seg) => seg && !/^\d+$/.test(seg)).join("_").replace(/-/g, "_") || "other";
  }
  track("page_view", {
    page_type: page_name,
    path,
    // 站内跳转：来源 = 上一个路由的完整地址（接口文档 5.3 的 SPA 写法）；首次打开不传，用 SDK 默认的 document.referrer
    referrer: info.from || undefined,
    ...utmFields(),
    ...extra,
  });
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
  if (!IDENTIFY_EVENTS_ENABLED) return;
  const uid = String(userId || "");
  if (!uid) return;
  track("user_identify", {
    user_id: uid,
    anonymous_id: getDeviceId(),
    login_type: loginType,
    is_first_login: isFirstLoginOnDevice(uid),
  });
}

/** register：注册成功（邮箱 / Google …），同步登录态给 SDK，同时报 user_identify 做身份缝合 */
export function trackRegisterSuccess(userId: string | number, loginType: LoginType) {
  const uid = String(userId || "");
  if (!uid) return;
  setTrackUser(uid);
  if (!IDENTIFY_EVENTS_ENABLED) return;
  track("register", { user_id: uid, anonymous_id: getDeviceId(), login_type: loginType });
  trackUserIdentify(uid, loginType);
}

/** login：登录成功（邮箱 / Google …），同步登录态给 SDK，同时报 user_identify 做身份缝合 */
export function trackLoginSuccess(userId: string | number, loginType: LoginType) {
  const uid = String(userId || "");
  if (!uid) return;
  setTrackUser(uid);
  if (!IDENTIFY_EVENTS_ENABLED) return;
  track("login", { user_id: uid, anonymous_id: getDeviceId(), login_type: loginType });
  trackUserIdentify(uid, loginType);
}

// ============================================================
// 九、浏览量曝光：collection_view / chapter_view / work_view / catalog_chapter_click
// 「一次浏览」= 详情页加载完成；同一会话内同一目标只计 1 次（sessionStorage 记已曝光的 key），
// 目标变了或换了会话才再计。字段名按接口：post_id / book_id / user_id（博主）。
// ============================================================
let prevPagePath = "";
let curPagePath = "";
let lastChapterPostId = "";

/** 作品 type 数字 → 内容类型：1 漫画 / 2 小说 / 3 漫剧 / 4 图片 / 5 视频 */
export function contentTypeOf(type: unknown): string {
  const m: Record<string, string> = { "1": "comic", "2": "novel", "3": "drama", "4": "image", "5": "video" };
  return m[String(type ?? "")] || "";
}

/** 本会话里这个目标是否已经曝光过；没曝光过就记下来并返回 false */
function viewedThisSession(key: string): boolean {
  const sid = currentSessionId();
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
  if (!VIEW_EVENTS_ENABLED) return;
  if (!p.book_id || viewedThisSession("collection:" + p.book_id)) return;
  track("collection_view", { ...p, entry_source: entrySourceOf() });
}

/** 9.1.2 章节（小说 / 漫画 / 漫剧的作品详情页）曝光 */
export function trackChapterView(p: { post_id: string | number; book_id: string | number; content_type: string; user_id?: string | number; chapter_index?: string | number }) {
  if (!VIEW_EVENTS_ENABLED) return;
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
  if (!VIEW_EVENTS_ENABLED) return;
  if (!p.post_id || viewedThisSession("work:" + p.post_id)) return;
  track("work_view", { ...p, entry_source: entrySourceOf() });
}

/** 9.1.4 目录里点某一章 */
export function trackCatalogChapterClick(p: { book_id: string | number; post_id: string | number; chapter_index?: string | number; content_type: string; user_id?: string | number }) {
  if (!VIEW_EVENTS_ENABLED) return;
  markEntrySource("catalog"); // 接下来的 chapter_view 记目录进来
  track("catalog_chapter_click", p);
}

/**
 * history_view（接口文档 4.4）：合集 & 作品的查看历史（观看历史、继续阅读用）。
 * 进合集详情页报一次：book_id / book_name；打开章节或单篇作品报一次：再带 post_id / post_name / chapter_index。
 * 不做会话去重：每次打开都是一条历史。单独的视频 / 图片不属于合集，book_id 传 0。
 */
export function trackHistoryView(p: { book_id: string | number; book_name?: string; post_id?: string | number; post_name?: string; chapter_index?: string | number }) {
  if (p.book_id === undefined || p.book_id === null || p.book_id === "") return;
  if (!p.post_id && !(Number(p.book_id) > 0)) return;
  const idx = Number(p.chapter_index);
  // 5 个字段固定都带：合集详情页没有作品 / 章节，post_id / post_name / chapter_index 传空串
  track("history_view", {
    book_id: p.book_id,
    book_name: p.book_name || "",
    post_id: p.post_id || "",
    post_name: p.post_name || "",
    chapter_index: Number.isFinite(idx) && idx > 0 ? idx : "",
  }, { keepEmpty: true });
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
export function trackLike(t: InteractTarget) {
  // 互动事件先不报，要恢复去掉注释
  // track("like_click", t);
}
/** 9.2.3 取消点赞 */
export function trackUnlike(t: InteractTarget) {
  // track("unlike_click", t);
}
/** 9.2.4 发布评论成功 */
export function trackCommentPublish(t: InteractTarget, p: { comment_id?: string | number; reply_to_comment_id?: string | number; content_length?: number }) {
  // track("comment_publish", { ...t, ...p });
}
/** 9.2.5 分享（复制链接等） */
export function trackShareEvent(t: InteractTarget, channel: "copy_link" | "whatsapp" | "x" | "facebook" | "instagram" | "telegram" | "other" = "copy_link") {
  // track("share", { ...t, share_channel: channel });
}
/** 9.2.6 关注博主 */
export function trackFollow(bloggerId: string | number) {
  // track("follow", { target_type: "blogger", target_id: bloggerId });
}
