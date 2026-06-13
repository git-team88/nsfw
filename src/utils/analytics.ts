declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-82ZH65FHJS";

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function trackLogin(method: string) {
  gtag("event", "login", { method });
}

export function trackSignUp(method: string) {
  gtag("event", "sign_up", { method });
}

export function trackPurchase(params: {
  paymentType: "subscription" | "topup";
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

export function initGA() {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
    security_storage: "granted",
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
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
