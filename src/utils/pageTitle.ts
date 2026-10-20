// 浏览器标签标题：页面名 - 站点名。
// 普通页面在 router 里配 meta.titleKey，路由切换 / 切换语言时自动设；
// 有自己 SEO 标题的页面（首页、生成页、详情、登录等）不配 titleKey，照旧各自 setSeoMeta。
import i18n from "@/lang/i18n";
import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from "vue-router";

const t = (key: string) => String((i18n.global as any).t(key));

export function siteName(): string {
  return t("pageTitle.siteName");
}

/** name 传翻译好的页面名（合集标题这种动态的也走这里）；不传只显示站点名 */
export function setPageTitle(name?: string) {
  if (typeof document === "undefined") return;
  document.title = name ? `${name} - ${siteName()}` : siteName();
}

/** 按路由的 meta.titleKey 设标题；没配的路由不动 */
export function applyRouteTitle(route: RouteLocationNormalized | RouteLocationNormalizedLoaded) {
  const key = route.meta?.titleKey as string | undefined;
  if (key) setPageTitle(t(key));
}
