// 浏览器标签标题：页面名 | 站点名。
// 普通页面在 router 里配 meta.titleKey，路由切换 / 切换语言时自动设；
// 有自己 SEO 标题的页面（首页、生成页、详情、登录等）不配 titleKey，照旧各自 setSeoMeta。
// 配了 meta.seoKey（如 "seo.computingRules"）的路由，有对应语言文案时整套 title / description / keywords 用它；
// 配了 meta.noindex 的路由写 robots=noindex,follow（个人账单这类）。
import i18n from "@/lang/i18n";
import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from "vue-router";
import { setMetaKeywords, TITLE_SEP } from "@/utils/seoMeta";

const t = (key: string) => String((i18n.global as any).t(key));
const te = (key: string) => Boolean((i18n.global as any).te(key));

export function siteName(): string {
  return t("pageTitle.siteName");
}

/** name 传翻译好的页面名（合集标题这种动态的也走这里）；不传只显示站点名 */
export function setPageTitle(name?: string) {
  if (typeof document === "undefined") return;
  document.title = name ? `${name}${TITLE_SEP}${siteName()}` : siteName();
}

function setDescription(content: string) {
  let el = document.head.querySelector<HTMLMetaElement>('meta[name="description" i]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const ROBOTS_MARK = "data-seo-route";
function setRouteRobots(noindex: boolean) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="robots"][${ROBOTS_MARK}]`);
  if (!noindex) { el?.remove(); return; }
  if (el) return;
  const m = document.createElement("meta");
  m.setAttribute("name", "robots");
  m.setAttribute("content", "noindex, follow");
  m.setAttribute(ROBOTS_MARK, "1");
  document.head.appendChild(m);
}

/** 按路由的 meta.titleKey / seoKey / noindex 设标题等；没配的路由不动 */
export function applyRouteTitle(route: RouteLocationNormalized | RouteLocationNormalizedLoaded) {
  if (typeof document === "undefined") return;
  const key = route.meta?.titleKey as string | undefined;
  const seoKey = route.meta?.seoKey as string | undefined;
  // 上一页的 keywords 不留给下一页；页面自己有的话 mounted 时再写
  setMetaKeywords("");
  setRouteRobots(Boolean(route.meta?.noindex));
  if (seoKey && te(`${seoKey}.title`)) {
    document.title = t(`${seoKey}.title`);
    if (te(`${seoKey}.description`)) setDescription(t(`${seoKey}.description`));
    if (te(`${seoKey}.keywords`)) setMetaKeywords(t(`${seoKey}.keywords`));
    return;
  }
  if (key) setPageTitle(t(key));
}
