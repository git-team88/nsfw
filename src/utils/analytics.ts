declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
    GA_ID: string;
  }
}

const PROD_GA_ID = "G-VNJ9YW8YN6";

const GA_ID =
  typeof window !== "undefined" && window.GA_ID ? window.GA_ID : PROD_GA_ID;

// 用哪个 id 是 index.html 按域名定的（测试站走调试 id），这里跟着它走。
// 不在这儿再判一遍域名 —— 判两遍的话，以后加测试域名只改一处就会出现
// 「打的是调试 GA、isDebug 却是 false」这种拧着的状态。
const isDebug = GA_ID !== PROD_GA_ID;

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
    if (isDebug) {
      console.log("[GA Debug]", ...args);
    }
  }
}

/** 兜底：从 _ga cookie 解析 client_id。GA1.1.1234567890.1700000000 -> 1234567890.1700000000 */
function clientIdFromCookie(): string {
  try {
    const m = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
    if (!m) return "";
    const parts = decodeURIComponent(m[1]).split(".");
    return parts.length >= 4 ? parts.slice(-2).join(".") : "";
  } catch {
    return "";
  }
}

/**
 * 下单时取 GA 的 client_id，随下单接口传给后端 —— 购买改由后端用 Measurement Protocol 上报，
 * 带上它购买才能归到这个访客的会话和来源渠道上。
 * gtag('get') 是异步回调，且 gtag 被广告拦截插件挡掉时回调永远不会触发，
 * 所以超时就退回读 _ga cookie；都拿不到给空串 —— 不能因为取不到就卡住下单。
 */
export function getGaClientId(timeout = 800): Promise<string> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (id: string) => {
      if (done) return;
      done = true;
      resolve(id || clientIdFromCookie());
    };
    const timer = setTimeout(() => finish(""), timeout);
    if (typeof window === "undefined" || !window.gtag) {
      clearTimeout(timer);
      finish("");
      return;
    }
    window.gtag("get", GA_ID, "client_id", (id: unknown) => {
      clearTimeout(timer);
      finish(typeof id === "string" ? id : "");
    });
  });
}

export function trackLogin() {
  gtag("event", "login");
}

export function trackSignUp() {
  gtag("event", "sign_up");
}

/**
 * 购买上报。payment_type：1 博主订阅 / 2 AI 会员订阅 / 3 AI 积分包 / 4 漫剧解锁全集。
 * 现金（Stripe）支付的金额、币种由后端拼在成功页的 success_url 上；
 * USDT 支付是前端转账完成后自己跳成功页，金额、币种要在跳转时自己拼进 query。
 */
const PURCHASE_REPORTED_KEY = "ga_purchase_reported";
const PURCHASE_REPORTED_MAX = 50;

/** 这笔订单是否已经上报过（按 transactionId 记在 localStorage 里） */
function hasReportedPurchase(transactionId: string): boolean {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(PURCHASE_REPORTED_KEY) || "[]");
    return list.includes(transactionId);
  } catch {
    return false;
  }
}

function markPurchaseReported(transactionId: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(PURCHASE_REPORTED_KEY) || "[]");
    if (!list.includes(transactionId)) list.push(transactionId);
    // 只留最近几十条，别无限涨
    localStorage.setItem(PURCHASE_REPORTED_KEY, JSON.stringify(list.slice(-PURCHASE_REPORTED_MAX)));
  } catch {
    // localStorage 不可用就算了，最多重复报一次
  }
}

export function trackPurchase(params: {
  paymentType: "1" | "2" | "3" | "4";
  value: number;
  currency: string;
  /**
   * 订单标识：现金是 Stripe 的 session_id，USDT 是我们自己的 order_id。
   * 用来防重复上报（刷新成功页、回退再前进），同时作为 GA 的 transaction_id，GA 那边也会按它去重。
   * 老链接没有的话就不去重，照报。
   */
  transactionId?: string;
}) {
  const tid = (params.transactionId || "").trim();
  if (tid && hasReportedPurchase(tid)) {
    if (isDebug) console.log("[GA Debug] purchase already reported, skip:", tid);
    return;
  }
  gtag("event", "purchase", {
    payment_type: params.paymentType,
    value: params.value,
    currency: params.currency,
    ...(tid ? { transaction_id: tid } : {}),
  });
  if (tid) markPurchaseReported(tid);
}

export function trackShare(params: {
  method: string;
  itemId: string;
}) {
  gtag("event", "share", {
    method: params.method,
    item_id: params.itemId,
  });
}

export function trackClickContentCover(category: "Novel" | "Comic" | "Drama" | "Image" | "Video") {
  gtag("event", "click_content_cover", { category });
}

export function trackClickPromptBox() {
  gtag("event", "click_prompt_box");
}

export function trackContentPublished(contentId: string) {
  gtag("event", "content_published", { content_id: contentId });
}

export function trackClickPublishButton(entrance: 1 | 2 | 3) {
  gtag("event", "click_publish_button", { entrance: entrance });
}

export function trackClickGenerateButton() {
  gtag("event", "click_generate_button");
}

// 用 set 不用 config：config 每调一次都会顺带发一条 page_view，
// 登录时同步一次 uid 就多一条 PV，数据会虚高。
export function setUserId(userId: string) {
  gtag("set", { user_id: userId });
}

export function clearUserId() {
  gtag("set", { user_id: null });
}

export function updateConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
    functionality_storage: value,
    personalization_storage: value,
  });
}
