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
export function trackPurchase(params: {
  paymentType: "1" | "2" | "3" | "4";
  value: number;
  currency: string;
}) {
  gtag("event", "purchase", {
    payment_type: params.paymentType,
    value: params.value,
    currency: params.currency,
  });
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
