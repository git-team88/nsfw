import { createI18n } from "vue-i18n";

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

// 6 个语言包按需加载（SEO T17）：首屏只带当前语言，其余在空闲时预加载。
// 每个语言包 100～230KB，全部打进入口会让首屏 JS 多出近 1MB。
const LOCALE_LOADERS: Record<string, () => Promise<{ default: Record<string, any> }>> = {
  en: () => import("./en"),
  jp: () => import("./jp"),
  zh: () => import("./zh"),
  tc: () => import("./tc"),
  ko: () => import("./ko"),
  th: () => import("./th"),
};
export const SUPPORTED_LOCALES = Object.keys(LOCALE_LOADERS);

const messages: TranslationMessages = {};

/**
 * 浏览器语言 → 站点语言：繁体（zh-TW / zh-HK / zh-MO / zh-Hant）→ tc，其余中文 → zh，日文 → jp，英文 → en，韩文 → ko，泰文 → th。
 * 按浏览器的语言偏好顺序取第一个站点支持的；都不支持 → en。
 */
export function detectBrowserLang(): string {
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const raw of list) {
    const l = String(raw || "").toLowerCase();
    if (!l) continue;
    if (l.startsWith("zh")) return /(tw|hk|mo|hant)/.test(l) ? "tc" : "zh";
    if (l.startsWith("ja")) return "jp";
    if (l.startsWith("en")) return "en";
    if (l.startsWith("ko")) return "ko";
    if (l.startsWith("th")) return "th";
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
const savedOrBrowser = (readSavedLang() || detectBrowserLang()).toLowerCase();
const locale = SUPPORTED_LOCALES.includes(savedOrBrowser) ? savedOrBrowser : "en";

document.documentElement.lang = ({ jp: 'ja', en: 'en', zh: 'zh-CN', tc: 'zh-TW', ko: 'ko', th: 'th' }[locale] || 'en');

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale,
  messages,
  warnHtmlMessage: false,
});

const loaded = new Set<string>();
const loading = new Map<string, Promise<void>>();

/** 把某个语言包装进 i18n（已装过直接返回；并发调用共用一个 Promise） */
export function loadLocaleMessages(lang: string): Promise<void> {
  const key = String(lang || "").toLowerCase();
  if (loaded.has(key)) return Promise.resolve();
  const loader = LOCALE_LOADERS[key];
  if (!loader) return Promise.resolve();
  let p = loading.get(key);
  if (!p) {
    p = loader()
      .then(mod => {
        i18n.global.setLocaleMessage(key, { ...(mod.default as any) });
        loaded.add(key);
      })
      .finally(() => loading.delete(key));
    loading.set(key, p);
  }
  return p;
}

/** 这个语言包是不是已经装好了 */
export function isLocaleLoaded(lang: string): boolean {
  return loaded.has(String(lang || "").toLowerCase());
}

/** 切换语言：先确保语言包已加载，再改 locale（否则切换瞬间页面会露出 key） */
export async function setLocale(lang: string): Promise<void> {
  const key = String(lang || "").toLowerCase();
  if (!LOCALE_LOADERS[key]) return;
  await loadLocaleMessages(key);
  if (i18n.global.locale.value !== key) i18n.global.locale.value = key;
}

/** 空闲时把其余语言包也拉下来，之后切换语言不用等 */
export function preloadOtherLocales() {
  const run = () => {
    for (const key of SUPPORTED_LOCALES) {
      if (key !== i18n.global.locale.value) loadLocaleMessages(key);
    }
  };
  if (typeof (window as any).requestIdleCallback === "function") (window as any).requestIdleCallback(run, { timeout: 5000 });
  else setTimeout(run, 3000);
}

export default i18n;
