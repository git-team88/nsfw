import { createI18n } from "vue-i18n";

import en from "./en";
import jp from "./jp";
import zh from "./zh";

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
      | Additional
      | {
          [deeperNestedKey: string]: string;
        };
  };
}

const messages: TranslationMessages = {
  en: { ...(en as any) },
  jp: { ...(jp as any) },
  zh: { ...(zh as any) },
};

const locale = (window.localStorage.getItem("lang") || "en").toLowerCase();

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale,
  messages,
  warnHtmlMessage: false,
});

export default i18n;
