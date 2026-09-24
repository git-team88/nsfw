import { createI18n } from "vue-i18n";

import en from "./en";
import jp from "./jp";
import zh from "./zh";
import tc from "./tc";

interface SocialMedia {
  title: string;
  desc: string;
}

interface Additional {
  title: string;
  desc: string;
  twitter: SocialMedia;
  discord: SocialMedia;
  email: SocialMedia;
}

interface TranslationMessages {
  [key: string]: {
    [nestedKey: string]:
      | string
      | string[]
      | Additional
      | {
          [deeperNestedKey: string]: string | string[];
        };
  };
}

const messages: TranslationMessages = {
  en: { ...(en as any) },
  jp: { ...(jp as any) },
  zh: { ...(zh as any) },
  tc: { ...(tc as any) },
};

/**
 * 浏览器语言 → 站点语言：繁体（zh-TW / zh-HK / zh-MO / zh-Hant）→ tc，其余中文 → zh，日文 → jp，英文 → en。
 * 按浏览器的语言偏好顺序取第一个站点支持的；都不支持（韩、泰等）→ en。
 */
export function detectBrowserLang(): string {
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const raw of list) {
    const l = String(raw || "").toLowerCase();
    if (!l) continue;
    if (l.startsWith("zh")) return /(tw|hk|mo|hant)/.test(l) ? "tc" : "zh";
    if (l.startsWith("ja")) return "jp";
    if (l.startsWith("en")) return "en";
  }
  return "en";
}

function readSavedLang(): string {
  try {
    return window.localStorage.getItem("lang") || "";
  } catch {
    return "";
  }
}

// 站点语言规则：
//   a. 第一次进来（localStorage 里没有 lang）不再按 IP，直接按浏览器语言显示，且不写 localStorage
//   b. 用户在导航里手动切换过语言才存 lang（Header changeLang），之后一直用用户切的
const locale = (readSavedLang() || detectBrowserLang()).toLowerCase();

document.documentElement.lang = ({ jp: 'ja', en: 'en', zh: 'zh-CN', tc: 'zh-TW' }[locale] || 'en');

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale,
  messages,
  warnHtmlMessage: false,
});

export default i18n;
