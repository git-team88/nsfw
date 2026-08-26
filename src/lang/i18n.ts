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

const locale = (window.localStorage.getItem("lang") || "en").toLowerCase();

document.documentElement.lang = ({ jp: 'ja', en: 'en', zh: 'zh-CN', tc: 'zh-TW' }[locale] || 'en');

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale,
  messages,
  warnHtmlMessage: false,
});

export default i18n;
