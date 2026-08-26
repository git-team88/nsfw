declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
    GA_ID: string;
  }
}

const GA_ID =
  typeof window !== "undefined" && window.GA_ID
    ? window.GA_ID
    : "G-82ZH65FHJS";

const isDebug =
  typeof window !== "undefined" &&
  !window.location.hostname.endsWith("wwwfansfans.ai");

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

export function trackPurchase(params: {
  paymentType: "1" | "2" | "3";
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

export function setUserId(userId: string) {
  gtag("config", GA_ID, { user_id: userId });
}

export function clearUserId() {
  gtag("config", GA_ID, { user_id: null });
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
