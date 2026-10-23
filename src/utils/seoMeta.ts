/**
 * 页面级 SEO meta 的写入与还原（title / description / og:*）。
 * canonical 由 App.vue 按路由统一维护，这里不碰。
 *
 * SPA 不刷新 <head>，一个页面改过的标签会原样留给下一个页面。
 * 所以每个用到它的页面要在 onBeforeUnmount 里调 restoreSeoMeta()，
 * 把改过的值还原、把新建的标签删掉。
 *
 * seo-server 预渲染时会把这些标签原样带出去，爬虫看到的就是这里写的值。
 */

export interface SeoMetaInput {
  /** 浏览器标签 + og:title */
  title: string;
  /** meta description + og:description */
  description: string;
  /** og:image / twitter:image；没有就不写 */
  image?: string;
  /** og:url；默认用当前地址（去掉查询串和尾斜杠） */
  url?: string;
  /** og:type，默认 article */
  type?: string;
}

/** 多段拼成一个 title，过滤掉空值 */
export function safeJoin(parts: Array<string | null | undefined>, sep = '｜'): string {
  return parts.map(p => (p ?? '').toString().trim()).filter(Boolean).join(sep);
}

/** 去掉 html 标签和换行，截断到 max 个字符 */
/** UGC 标题各段之间统一用「 | 」隔开，空段自动丢掉 */
export const TITLE_SEP = ' | ';

/**
 * meta keywords：传空就删掉标签。Google 不用它排名，按运营要求输出；
 * 每次路由切换 router.afterEach 会先删一次，页面再按自己的内容写，不会把上一页的留给下一页。
 */
export function setMetaKeywords(keywords: Array<string | null | undefined> | string | null | undefined) {
  if (typeof document === 'undefined') return;
  const content = Array.isArray(keywords)
    ? Array.from(new Set(keywords.map(k => String(k ?? '').trim()).filter(Boolean))).join(',')
    : String(keywords ?? '').trim();
  let el = document.head.querySelector<HTMLMetaElement>('meta[name="keywords" i]');
  if (!content) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'keywords');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function clamp(text: unknown, max: number): string {
  const s = String(text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) : s;
}

/** 当前页的规范地址：origin + pathname，去查询串、去尾斜杠 */
export function canonicalUrl(path?: string): string {
  const p = (path ?? window.location.pathname).replace(/[?#].*$/, '').replace(/\/+$/, '');
  return `${window.location.origin}${p || '/'}`;
}

type Tracked = { el: Element; attr: string; prev: string | null; created: boolean };
let modified: Tracked[] = [];

function remember(el: Element, attr: string, created: boolean) {
  if (modified.some(x => x.el === el)) return;
  modified.push({ el, attr, prev: created ? null : el.getAttribute(attr), created });
}

function setMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let m = document.head.querySelector<HTMLMetaElement>(selector);
  if (!m) {
    m = create();
    document.head.appendChild(m);
    remember(m, 'content', true);
  } else {
    remember(m, 'content', false);
  }
  m.setAttribute('content', content);
}

function setOg(prop: string, content: string) {
  setMeta(`meta[property="${prop}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', prop);
    return m;
  }, content);
}

function setNamed(name: string, content: string) {
  // index.html 里是小写 name="description"，选择器加 i 免得大小写不一致时又建一个
  setMeta(`meta[name="${name}" i]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  }, content);
}

/** 写入一组页面级 meta；重复调用会覆盖，但只记第一次之前的原值 */
export function applySeoMeta(input: SeoMetaInput) {
  const url = input.url || canonicalUrl();

  document.title = input.title;
  setNamed('description', input.description);
  setOg('og:title', input.title);
  setOg('og:description', input.description);
  setOg('og:type', input.type || 'article');
  setOg('og:url', url);
  if (input.image) {
    setOg('og:image', input.image);
    setNamed('twitter:image', input.image);
  }
}

/**
 * 页面级 JSON-LD（T10）：一个页面一个 <script type="application/ld+json" data-seo-page>，
 * 重复调用就替换；restoreSeoMeta() 时删掉。
 */
export function applyJsonLd(graph: Record<string, unknown>[]) {
  removeJsonLd();
  if (!graph.length) return;
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.setAttribute('data-seo-page', '');
  el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(el);
}

export function removeJsonLd() {
  document.head.querySelectorAll('script[data-seo-page]').forEach(el => el.remove());
}

/**
 * 离开页面时调用：还原被覆盖的值，删掉本页新建的标签和 JSON-LD。
 * document.title 不在这里还原——下一个页面的标题由 router.afterEach 写，
 * 这里再还原会把它盖掉。
 */
export function restoreSeoMeta() {
  for (const { el, attr, prev, created } of modified) {
    if (created) el.remove();
    else if (prev !== null) el.setAttribute(attr, prev);
  }
  modified = [];
  removeJsonLd();
}

// ---- 软 404 → 真 404（T04）----

/** 后端答复里是不是「不存在 / 已删除」这一类：匹配各语言 msg 关键词 */
export function isNotFoundResponse(res: any): boolean {
  if (!res || typeof res !== 'object') return false;
  if (res.code == 0 || res.code == 200) return !res.data || (typeof res.data === 'object' && !Object.keys(res.data).length);
  const text = ['msg', 'msg_cn', 'msg_tc', 'msg_jp', 'msg_ko', 'msg_th'].map(k => String(res[k] || '')).join(' ').toLowerCase();
  return /not (found|exist)|does not exist|不存在|已删除|已刪除|削除|存在しません|見つかりません|존재하지|삭제|ไม่พบ|ไม่มีอยู่/.test(text);
}

/**
 * 数据接口说目标不存在时切到 404 页（地址不变）。
 * NotFound 页会写 robots=noindex + seo-status=404 标记，seo-server 据此对爬虫返回真实 404。
 * 预渲染时（window.__SEO_PRERENDER__）后端只要没给出数据就按 404 处理，避免「200 + 空壳」的软 404；
 * 真实用户只在后端明确说不存在时才切，其它错误（未登录、无权限等）维持原来的提示。
 */
export function goNotFoundIfMissing(router: { replace: (to: any) => any }, route: { path: string; query: any }, res: any): boolean {
  const prerender = (window as any).__SEO_PRERENDER__ === true;
  if (!prerender && !isNotFoundResponse(res)) return false;
  router.replace({ name: 'NotFound', params: { pathMatch: route.path.replace(/^\//, '').split('/') }, query: route.query });
  return true;
}

// ---- 发布 / 更新后预热预渲染缓存（T05）----

/**
 * 通知渲染服务重渲染某个公开页并刷新缓存（nginx 的 /seo-warm → seo-server /warm）。
 * 发布作品、改合集信息后调一次，让爬虫下次来就拿到新内容。
 * 只发请求不等结果，失败也不影响业务；本地开发（localhost）不发。
 */
export function warmSeo(path: string) {
  try {
    if (!path || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
    const p = path.startsWith('/') ? path : `/${path}`;
    fetch(`/seo-warm?url=${encodeURIComponent(p)}`, { method: 'GET', keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch { /* ignore */ }
}
