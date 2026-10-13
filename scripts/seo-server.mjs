import express from 'express'
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const app = express()
const PORT = process.env.SEO_PORT || 3002
// 站点自身地址（爬虫渲染的目标站）。默认 FansFans；部署到其它站时用 SPA_URL 覆盖。
const SPA_URL = process.env.SPA_URL || 'https://www.fansfans.ai'
const CACHE_DIR = process.env.CACHE_DIR || '/data/seo-cache/nsfw'
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10)

// 判定「这次抓取是不是爬虫」的兜底名单（nginx 的 $is_bot 才是主判据）。
// 只覆盖两类：搜索引擎 + 生成式引擎（GEO）—— 它们要么把搜索用户带回来，
// 要么在回答问题时引用本站并附来源链接。
// ⚠️ 刻意不包含 ahrefsbot / semrushbot / dotbot / ccbot / bytespider / omgili /
//    diffbot 等「数据商 / 内容搬运」型爬虫：它们抓走内容后不回馈任何流量。
//    nginx 侧对这类 UA 直接 403（见 $is_content_scraper），这里同步排除以保持两层一致。
const BOTS = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp|facebot|ia_archiver|mediapartners|adsbot|chatgpt-user|oai-searchbot|gptbot|claudebot|claude-user|claude-searchbot|anthropic-ai|perplexitybot|perplexity-user|applebot|google-extended|googleother|amazonbot|meta-externalagent|cohere-ai|duckassistbot|bravebot|youbot|petalbot|timpibot|mistralai/i

const RENDER_TIMEOUT = 15000
const WAIT_AFTER_LOAD = 3000
// 混合策略的「同步等待窗口」：缓存未命中时最多同步等这么久拿完整正文，
// 超时则先返回骨架、同一次渲染转后台跑完写缓存。需小于 nginx/爬虫的超时阈值。
const SYNC_RENDER_TIMEOUT = parseInt(process.env.SYNC_RENDER_TIMEOUT || '9000', 10)
// ============================================================
// 品牌信息 —— 全部可用环境变量覆盖
// ⚠️ 这里的默认值必须与「当前站点」一致。历史问题：本项目从 moegen.ai 拷贝而来，
// 一路把 og:site_name / 骨架标题 / canonical 都写成了「MoeGen 萌創」，
// 等于给搜索引擎与 AI 抓取器喂了错误的品牌实体。改站时请一并改这里或用环境变量覆盖。
// ============================================================
const SITE_NAME = process.env.SEO_SITE_NAME || 'FansFans 萌創'
const SITE_URL = (process.env.SEO_SITE_URL || 'https://www.fansfans.ai').replace(/\/+$/, '')
const SITE_LOGO = process.env.SEO_SITE_LOGO || `${SITE_URL}/logo.png`
const SITE_DESC = process.env.SEO_SITE_DESC ||
  'FansFans 萌創は、日本・台湾・香港のクリエイター向けの二次元 AI 創作プラットフォーム。ひとこと入力で小説・漫画・アニメドラマを自動生成。30K 文字無料からスタート。'
// OG / Twitter 卡片主图（1200x630 社交标准比例）。之前用 logo.png（640x200）会被裁切或留白。
// 重新生成：python scripts/gen-og-image.py
const SITE_OG_IMAGE = process.env.SEO_SITE_OG_IMAGE || `${SITE_URL}/og-image.png`

// —— 内存治理配置 ——
// 每渲染 N 次主动换一个 browser 实例，回收 Chromium 长期运行累积的内存（P0）。
// 注意：这是防 Chrome 内存泄漏的主防线——process.memoryUsage().rss 只量 Node 主进程，
// 测不到 Chrome 子进程的内存，所以 RSS 软阈值（P5）对 Chrome 泄漏无效，
// 次数回收不能定太大。20 次 × 每次 page.close 后残留几 MB ≈ 可控，且 launch 开销摊薄到每请求仅几十 ms。
const BROWSER_MAX_RENDERS = parseInt(process.env.SEO_BROWSER_MAX_RENDERS || '20', 10)
// 同时渲染的页面上限，超出直接降级返回骨架，避免并发风暴吃爆内存（P1）
const MAX_CONCURRENT = parseInt(process.env.SEO_MAX_CONCURRENT || '4', 10)
// 单次渲染整体截止时间，超时强制关掉 page，防任一单步 hang 拖死渲染槽（P2）
const RENDER_DEADLINE_MS = parseInt(process.env.SEO_RENDER_DEADLINE_MS || '20000', 10)
// RSS 超过该阈值（MB）主动回收 browser，避免高峰期被 PM2 整个重启丢缓存（P5）
const MEM_SOFT_LIMIT_MB = parseInt(process.env.SEO_MEM_SOFT_LIMIT_MB || '400', 10)

const LANG_MAP = { ja: 'ja', en: 'en', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW', ko: 'ko', th: 'th' }
const CONTENT_TYPES = ['novel', 'comic', 'drama', 'photo', 'video']

const SEO_TITLES = {
  detail: { ja: `作品詳細 - ${SITE_NAME}`, en: 'Work Detail - FansFans', 'zh-cn': `作品详情 - ${SITE_NAME}`, 'zh-tw': `作品詳情 - ${SITE_NAME}` },
  collection: { ja: `コレクション - ${SITE_NAME}`, en: 'Collection - FansFans', 'zh-cn': `合集 - ${SITE_NAME}`, 'zh-tw': `合集 - ${SITE_NAME}` },
  novel: { ja: `AI小説生成 - ${SITE_NAME}`, en: 'AI Novel Generator - FansFans', 'zh-cn': `AI小说生成 - ${SITE_NAME}`, 'zh-tw': `AI小說生成 - ${SITE_NAME}` },
  comic: { ja: `AI漫画生成 - ${SITE_NAME}`, en: 'AI Comic Generator - FansFans', 'zh-cn': `AI漫画生成 - ${SITE_NAME}`, 'zh-tw': `AI漫畫生成 - ${SITE_NAME}` },
  drama: { ja: `AIアニメドラマ生成 - ${SITE_NAME}`, en: 'AI Anime Drama Generator - FansFans', 'zh-cn': `AI动画短剧生成 - ${SITE_NAME}`, 'zh-tw': `AI動畫短劇生成 - ${SITE_NAME}` },
  photo: { ja: `AIイラスト生成 - ${SITE_NAME}`, en: 'AI Illustration Generator - FansFans', 'zh-cn': `AI插画生成 - ${SITE_NAME}`, 'zh-tw': `AI插畫生成 - ${SITE_NAME}` },
  video: { ja: `AI動画生成 - ${SITE_NAME}`, en: 'AI Video Generator - FansFans', 'zh-cn': `AI视频生成 - ${SITE_NAME}`, 'zh-tw': `AI影片生成 - ${SITE_NAME}` },
}

// 面包屑叶子名（结构化数据用）
const BREADCRUMB_LEAF = {
  detail: '作品詳細', collection: 'コレクション', novel: '小説',
  comic: '漫画', drama: 'アニメドラマ', photo: 'イラスト', video: '動画',
}

function detectLang(url) {
  // ⚠️ 原实现要求语言段后必须跟 "/"，导致 /en、/ko 这类「语言首页」被误判成 ja。
  const path = String(url).replace(/^https?:\/\/[^/]+/i, '').split('?')[0]
  const m = path.match(/^\/(ja|en|zh-cn|zh-tw|ko|th)(\/|$)/)
  return m ? m[1] : 'ja'
}

// 页面类型 —— 决定骨架标题与结构化数据。
// ⚠️ /{lang}/{type}（如 /ja/novel）是站内重要的「内容分类页」，同样可被索引，
// 必须能识别出来，否则骨架页会退回平台通用标题。
const CATEGORY_TYPES = 'novel|comic|drama|photo|video'

function detectPageType(url) {
  const path = String(url).replace(/^https?:\/\/[^/]+/i, '').split('?')[0]
  if (/^\/detail(\/|$)/.test(path)) return 'detail'
  if (/^\/collection\//.test(path)) return 'collection'
  if (/^\/novel\/\d+/.test(path)) return 'novel' // 小说阅读页
  const m = path.match(new RegExp(`^/(?:(?:ja|en|zh-cn|zh-tw|ko|th)/)?(${CATEGORY_TYPES})/?$`))
  return m ? m[1] : null
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// escapeAttr 的逆操作。用于「从已渲染 HTML 里取回文本」的场景：
// 那里拿到的值本身已经过一次实体转义，若不再解码就写回，会变成 &amp;amp;（双重转义）。
function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

// —— hreflang ——
// 与 src/App.vue 的规则保持一致：只给「有独立语言 URL 变体」的首页族页面输出
// （/ 、/{lang} 、/{lang}/{type} 、/{type}）。详情页等是「单 URL 多语言」，
// 没有 per-language URL 对应关系，输出 hreflang 反而制造错误信号。
const LANG_URLS = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'th']
const HREFLANG_MAP = { ja: 'ja', en: 'en', 'zh-cn': 'zh-Hans', 'zh-tw': 'zh-Hant', ko: 'ko', th: 'th' }
const OG_LOCALE_MAP = { ja: 'ja_JP', en: 'en_US', 'zh-cn': 'zh_CN', 'zh-tw': 'zh_TW', ko: 'ko_KR', th: 'th_TH' }

// 返回 null 表示该 URL 没有语言变体；否则 { base: 语言段之后的部分, lang: 语言段 }
function detectLangVariant(url) {
  const path = String(url).replace(/^https?:\/\/[^/]+/i, '').split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/') return { base: '', lang: 'ja' }
  const m = path.match(new RegExp(`^/(ja|en|zh-cn|zh-tw|ko|th)(/(${CATEGORY_TYPES}))?$`))
  if (m) return { base: m[2] || '', lang: m[1] }
  const t = path.match(new RegExp(`^/(${CATEGORY_TYPES})$`))
  if (t) return { base: `/${t[1]}`, lang: 'ja' }
  return null
}

function hreflangTags(url) {
  const v = detectLangVariant(url)
  if (!v) return ''
  const tags = LANG_URLS.map(lg =>
    `  <link rel="alternate" hreflang="${HREFLANG_MAP[lg]}" href="${escapeAttr(`${SITE_URL}/${lg}${v.base}`)}">`
  )
  tags.push(`  <link rel="alternate" hreflang="x-default" href="${escapeAttr(`${SITE_URL}${v.base === '' ? '/' : v.base}`)}">`)
  return tags.join('\n')
}

// NotFound 视图会带上这个标记；seo-server 据此返回真实 404 状态码（配合 App.vue 的 404 路由）。
// 不加这层的话，未知 URL 会「200 + 首页内容」，形成无限重复内容（soft 404）。
const NOTFOUND_MARKER = '<meta name="seo-status" content="404">'

function isNotFoundRender(html) {
  return !!html && html.includes(NOTFOUND_MARKER)
}

// 404 响应必须带 noindex（NotFound.vue 自带；渲染路径被 enrich 改写时这里兜底补上）
function ensureNoindex(html) {
  if (/<meta\s+name=["']robots["']/i.test(html)) return html
  return html.replace('</head>', '  <meta name="robots" content="noindex, follow">\n</head>')
}

// —— 骨架页正文素材 ——
// 骨架页是「渲染超时/失败」时的降级产物。它必须自带真实可索引正文，
// 否则爬虫在降级路径上拿到的仍是一张空壳（这正是本清单指出的问题之一）。
const SKELETON_H1 = 'ことばひとつで、物語・漫画・アニメを。'
const SKELETON_FEATURES = [
  ['AI 小説生成', 'ひとことのアイデアから 30,000 文字級の長編 Web 小説を自動生成。玄幻・恋愛・BL・異世界など多ジャンルに対応。'],
  ['AI 漫画生成', 'テキストから漫画を自動生成。コマ割りとキャラクターの一貫性を AI が担保します。'],
  ['AI アニメドラマ', '1〜3 分の二次元アニメショートを自動生成。分鏡・台詞・音声・BGM まで一括で作成。'],
  ['AI イラスト / 動画', 'キャラクターの立ち絵・イラスト生成と、静止画から二次元ショートビデオへの変換に対応。'],
]

// —— 结构化数据（JSON-LD）——
// 抓取层注入：搜索引擎与生成式引擎（GEO）都读它。按页面类型给出对应实体。
function buildJsonLd(url) {
  const pageType = detectPageType(url)
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ['FansFans', '萌創', '萌创'],
      description: SITE_DESC,
      inLanguage: 'ja',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?keyword={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ['FansFans', '萌創'],
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: SITE_LOGO, width: 720, height: 200 },
      description: SITE_DESC,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'AI content generation',
      operatingSystem: 'Web',
      inLanguage: ['ja', 'en', 'zh-CN', 'zh-TW', 'ko', 'th'],
      description: 'ひとつのアイデアから AI 小説・漫画・アニメドラマ・イラストを生成できる二次元 AI 創作プラットフォーム。',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'JPY',
        description: '無料枠 30,000 文字から利用可能',
      },
    },
  ]

  // 作品/合集/小说页：补一条「首页 → 作品页」面包屑（只用确定成立的两级，不猜层级，避免结构化数据报错）
  if (pageType) {
    const leafName = BREADCRUMB_LEAF[pageType] || '作品詳細'
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: leafName, item: url },
      ],
    })
  }
  return graph
}

function jsonLdScript(url) {
  return `<script type="application/ld+json">\n${JSON.stringify(
    { '@context': 'https://schema.org', '@graph': buildJsonLd(url) },
    null,
    2
  )}\n</script>`
}

function generateSkeleton(url, query = {}) {
  const lang = detectLang(url)
  const htmlLang = LANG_MAP[lang] || 'ja'
  const pageType = detectPageType(url)
  const titles = pageType ? SEO_TITLES[pageType] : null
  // 韩、泰没有单独的标题文案，退回英文
  const title = titles ? (titles[lang] || (lang === 'ko' || lang === 'th' ? titles.en : titles.ja)) : SITE_NAME
  const description = SITE_DESC

  const featuresHtml = SKELETON_FEATURES
    .map(([name, desc]) => `      <li><strong>${name}</strong>：${desc}</li>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeAttr(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeAttr(url)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeAttr(url)}">
  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">
  <meta property="og:image" content="${escapeAttr(SITE_OG_IMAGE)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${escapeAttr(OG_LOCALE_MAP[lang] || 'ja_JP')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(SITE_OG_IMAGE)}">
${hreflangTags(url)}
${jsonLdScript(url)}
</head>
<body>
  <div id="app">
    <main>
      <h1>${SKELETON_H1}</h1>
      <p>${description}</p>
      <h2>主な機能 / Key features</h2>
      <ul>
${featuresHtml}
      </ul>
      <p><a href="${SITE_URL}/">${SITE_NAME} を開く</a></p>
    </main>
  </div>
</body>
</html>`
}

// 渲染后补全「爬虫需要、但 SPA 运行时没注入」的元信息：og:* / twitter:* / JSON-LD。
// title/description 直接从已渲染的 HTML 里取（首页来自 Home.vue 的 i18n，详情页来自接口数据），
// 因此首页与详情页通用，无需再维护一份静态 SEO 文案表。
function enrichSeoMeta(html, url) {
  // ⚠️ 取到的是「已渲染 HTML 里的值」，本身已做过一次实体转义（如 &amp;）。
  // 写回时还会再 escapeAttr 一次，所以必须先 decode 再 escape，否则出现 &amp;amp;。
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : SITE_NAME
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  const description = descMatch ? decodeEntities(descMatch[1]) : SITE_DESC

  const tags = []

  // og:image / twitter:image：index.html 静态兜底已带一份，只有缺失时才补，避免重复标签。
  // （此前是无条件追加，导致渲染结果里 og:image 出现两条：静态兜底 1 条 + 这里补 1 条。）
  if (!/<meta\s+property=["']og:image["']/i.test(html)) {
    tags.push(`<meta property="og:image" content="${escapeAttr(SITE_OG_IMAGE)}" />`)
  }
  if (!/<meta\s+name=["']twitter:image["']/i.test(html)) {
    tags.push(`<meta name="twitter:image" content="${escapeAttr(SITE_OG_IMAGE)}" />`)
  }

  // og:* 只有运行时没注入时才补，避免重复标签
  if (!/<meta\s+property=["']og:title["']/i.test(html)) {
    tags.unshift(
      `<meta property="og:title" content="${escapeAttr(title)}" />`,
      `<meta property="og:description" content="${escapeAttr(description)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${escapeAttr(url)}" />`,
      `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(description)}" />`
    )
  }

  // hreflang：首页族 URL（/ 、/{lang} 、/{lang}/{type} 、/{type}）的语言变体声明。
  // ⚠️ 真实渲染路径此前完全没有注入 —— 只有骨架降级路径 renderSkeleton() 里有，
  //    于是「渲染成功」时 Google / AI 爬虫拿到的版本一条 hreflang 都没有，
  //    多语言信号彻底丢失（只有前端 JS 执行才补得上，而爬虫不执行 JS）。
  //    这里补上；若前端已注入则跳过，避免重复。
  if (!/<link[^>]+hreflang=/i.test(html)) {
    const hl = hreflangTags(url)
    if (hl) tags.push(hl)
  }

  // 结构化数据：渲染结果里没有才注入（index.html 静态兜底已带一份，避免重复）
  if (!/application\/ld\+json/i.test(html)) {
    tags.push(jsonLdScript(url))
  }

  // canonical：运行时/静态兜底都没有时补自指
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    tags.push(`<link rel="canonical" href="${escapeAttr(url)}" />`)
  }

  return html.replace('</head>', tags.join('\n') + '\n</head>')
}

// —— 坏渲染检测 ——
// 线上真实故障：seo-render 未开 SEO_RESOLVER_RULES 时，puppeteer 直连公网被 Cloudflare
// 按 IP 拦截，渲染结果是一张 CF「Access denied / 1008」错误页（还带 noindex），
// 却被原样写进缓存并回给 Googlebot —— 等于主动叫搜索引擎别收录。
// 这里做两道闸：命中错误特征、或 #app 里没有任何内容，都判为坏渲染：
// 不写缓存、不返回给爬虫，改为返回带完整 meta 与正文的骨架。
const BAD_RENDER_PATTERNS = [
  'Access denied',
  'Sorry, you have been blocked',
  'Attention Required!',
  'cf-error-details',
  'Your request was blocked',
  'error code: 1008',
  'error code: 1020',
]

// 渲染成功的最低门槛：body 里除脚本/样式/注释外，至少要有这么多可见文本。
// 前端没起来时 body 基本是空的（≈0 字符）；正常首页/分类页是数千字符。
const MIN_RENDER_TEXT = 120

function isBadRender(html) {
  if (!html) return true
  const head = html.slice(0, 3000)
  if (BAD_RENDER_PATTERNS.some(p => head.includes(p))) return true

  // 第二道闸：body 可见文本过短 → 前端没起来（接口被拦 / JS 报错）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const body = bodyMatch ? bodyMatch[1] : html
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s/g, '')
  return text.length < MIN_RENDER_TEXT
}

let browser = null
let renderCount = 0
// launch 锁：防止多个并发渲染在 browser 为 null 时同时触发 puppeteer.launch，
// 开出多个 Chromium 实例反而加剧内存问题。
let launchingPromise = null

// 关闭旧 browser 实例并清零计数。断连的实例也要尝试 close，避免残留孤儿 Chromium 进程占内存。
// 先同步摘掉引用，让并发调用者立即看到 null 并走 launch 锁路径，避免对同一实例重复 close。
async function closeBrowserSafe() {
  const old = browser
  browser = null
  renderCount = 0
  if (old) {
    try { await old.close() } catch {}
  }
}

async function getBrowser() {
  // 回收条件：实例丢失/断连、渲染次数达上限、RSS 超软阈值。
  // 前两者治泄漏本身；RSS 阈值让高峰期主动换 browser，避免被 PM2 整个进程重启丢缓存。
  const rssMB = process.memoryUsage().rss / 1024 / 1024
  const overMemSoftLimit = rssMB > MEM_SOFT_LIMIT_MB
  const needRecycle = !browser || !browser.connected || renderCount >= BROWSER_MAX_RENDERS || overMemSoftLimit

  if (needRecycle) {
    const reason = !browser ? 'init'
      : !browser.connected ? 'disconnected'
      : renderCount >= BROWSER_MAX_RENDERS ? `render-count(${renderCount})`
      : `mem-high(${Math.round(rssMB)}MB)`
    if (browser) console.log(`[browser] recycling: ${reason}`)
    await closeBrowserSafe()
  }

  if (!browser) {
    // launch 锁：多个并发渲染在 browser 为 null 时会同时走到这里，
    // 不加锁会开出多个 Chromium 实例。launchingPromise 保证同一时刻只有一个 launch。
    if (!launchingPromise) {
      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        // 抹掉 navigator.webdriver 自动化标记（配合下方 evaluateOnNewDocument），
        // 否则前端反爬 antiCrawler.ts 的 isRealBrowser() 会判为非真实浏览器并下发陷阱签名，
        // 导致依赖接口数据的详情页/合集页渲染成空壳。此项两环境通用。
        '--disable-blink-features=AutomationControlled'
      ]
      // ⚠️ 仅正式环境（站点在 Cloudflare 后面）需要：源站 IP 走公网访问会被 Cloudflare 按 IP 拦截，
      // 所以把站点域名解析到本机源站绕过 CF（本机需有 127.0.0.1:443 回环反代 → :80）。
      // 通过环境变量 SEO_RESOLVER_RULES 开启；测试环境不设此变量 → 直接联网渲染，无需回环反代。
      // 例: SEO_RESOLVER_RULES="MAP www.fansfans.ai 127.0.0.1,MAP api.fansfans.ai 127.0.0.1"
      if (process.env.SEO_RESOLVER_RULES) {
        launchArgs.push(`--host-resolver-rules=${process.env.SEO_RESOLVER_RULES}`)
        launchArgs.push('--ignore-certificate-errors') // 回环反代用的是自签证书
      }
      launchingPromise = puppeteer.launch({ headless: true, args: launchArgs })
        .then(b => { browser = b; renderCount = 0; return b })
        .finally(() => { launchingPromise = null })
    }
    return launchingPromise
  }
  return browser
}

fs.mkdirSync(CACHE_DIR, { recursive: true })

function getCachePath(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  return path.join(CACHE_DIR, `${hash}.html`)
}

function getCache(url) {
  const filePath = getCachePath(url)
  if (!fs.existsSync(filePath)) return null
  const stat = fs.statSync(filePath)
  if (Date.now() - stat.mtimeMs > CACHE_TTL * 1000) {
    fs.unlinkSync(filePath)
    return null
  }
  return fs.readFileSync(filePath, 'utf-8')
}

function setCache(url, html) {
  // ⚠️ 写缓存失败（目录不存在 / 磁盘满 / 权限不足）绝不能影响本次渲染结果的返回。
  // 以前这里没有 try/catch：一旦写失败就向上抛，整次渲染被丢弃、爬虫只拿到骨架，
  // 而日志里只有一句 ENOENT，看起来像「渲染失败」，极难定位。
  try {
    fs.writeFileSync(getCachePath(url), html)
  } catch (e) {
    console.error(`[cache] write failed (${e.code || 'ERR'}): ${e.message}`)
  }
}

function invalidateCache(url) {
  const filePath = getCachePath(url)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

// 流式判断缓存文件是否含 pattern，避免 readFileSync 把大文件整体读进内存（P4）。
// 命中即立即返回 true，无需读完整个文件。
function fileContainsPattern(filePath, pattern) {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk
      if (buf.includes(pattern)) {
        stream.destroy()
        resolve(true)
        return
      }
      // 保留末尾一段防止跨 chunk 截断 pattern
      buf = buf.slice(-pattern.length)
    })
    stream.on('end', () => resolve(false))
    stream.on('error', () => resolve(false))
  })
}

// 定期清扫过期缓存：getCache 只在命中时删单个文件，从未被读到的过期文件
// 永远不清。低频（每小时）扫一遍 CACHE_DIR 删过期项，防止目录无限膨胀（P4）。
function sweepExpiredCache() {
  let removed = 0
  try {
    const files = fs.readdirSync(CACHE_DIR)
    const now = Date.now()
    for (const file of files) {
      if (!file.endsWith('.html')) continue
      const filePath = path.join(CACHE_DIR, file)
      try {
        const stat = fs.statSync(filePath)
        if (now - stat.mtimeMs > CACHE_TTL * 1000) {
          fs.unlinkSync(filePath)
          removed++
        }
      } catch {}
    }
  } catch (e) {
    console.error(`Cache sweep error: ${e.message}`)
  }
  if (removed) console.log(`[cache] swept ${removed} expired files`)
}

// 渲染槽位：同时进行的渲染数，受 MAX_CONCURRENT 约束（P1）。
// 超时后转后台的渲染仍占实际资源，也计入此计数（P3）。
let activeRenders = 0

async function renderPage(url) {
  const b = await getBrowser()
  const page = await b.newPage()
  const work = (async () => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.setUserAgent('Mozilla/5.0 (compatible; FansFans-SEO-Renderer/1.0; +https://www.fansfans.ai/)')
    // 注入 SEO 预渲染标记：Home.vue 据此按 URL 显示对应内容类型并保留地址，
    // 而不是像真实用户那样重置为默认内容类型 / 只保留域名。
    // 同时抹掉 navigator.webdriver（配合 --disable-blink-features=AutomationControlled），
    // 让 antiCrawler.ts 的 isRealBrowser() 判为真实浏览器，接口才会返回真实数据。
    await page.evaluateOnNewDocument(() => {
      window.__SEO_PRERENDER__ = true
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
    await page.waitForFunction(
      () => document.querySelector('#app')?.children?.length > 0,
      { timeout: 10000 }
    ).catch(() => {})
    await new Promise(r => setTimeout(r, WAIT_AFTER_LOAD))
    let html = await page.content()
    html = html.replace(/<div id="app" data-v-app="">/, '<div id="app">')
    html = enrichSeoMeta(html, url)
    return html
  })()
  try {
    // 整体截止时间：任一单步 hang 都不会无限占用一个渲染槽（P2）。
    // 用可清理的定时器，避免 work 先完成时定时器仍触发产生未捕获 rejection。
    let deadlineTimer
    const result = await Promise.race([
      work,
      new Promise((_, rej) => {
        deadlineTimer = setTimeout(
          () => rej(new Error('render deadline exceeded')),
          RENDER_DEADLINE_MS
        )
      })
    ])
    clearTimeout(deadlineTimer)
    return result
  } finally {
    // 无论成功/超时/异常都强制关掉 page，避免 page 泄漏累积内存。
    await page.close().catch(() => {})
    renderCount++
  }
}

app.get('/render', async (req, res) => {
  // 优先取 nginx 传来的 X-Render-Url（用 $request_uri，不受 rewrite 影响，且请求头不会被 query 解析截断）
  const targetUrl = req.get('x-render-url') || req.query.url
  if (!targetUrl) return res.status(400).send('Missing url parameter')

  try {
    const cached = getCache(targetUrl)
    if (cached) {
      res.set('X-SEO-Cache', 'HIT')
      // 404 页也走缓存，命中时还原真实 404 状态码
      if (isNotFoundRender(cached)) return res.status(404).type('html').send(cached)
      return res.type('html').send(cached)
    }

    // 并发上限：槽位满时直接降级返回骨架，避免并发风暴吃爆内存（P1）。
    // 超时后转后台的渲染仍占实际资源，也计入此计数（P3）。
    if (activeRenders >= MAX_CONCURRENT) {
      res.set('X-SEO-Cache', 'OVERLOAD-SKELETON')
      return res.type('html').send(generateSkeleton(targetUrl, req.query))
    }

    // 无缓存：混合策略。启动一次渲染，在 SYNC_RENDER_TIMEOUT 内完成
    // → 直接返回带正文/图片的完整 HTML（爬虫首次抓取即有内容）；
    // 若超时未完成 → 先返回带 meta 的骨架，同一次渲染继续在后台跑完并写缓存
    // （不重复渲染），下次请求直接命中。渲染失败则降级返回骨架 200（保住 meta）。
    let responded = false
    activeRenders++

    const timer = setTimeout(() => {
      if (responded) return
      responded = true
      res.set('X-SEO-Cache', 'MISS-TIMEOUT-ASYNC')
      res.type('html').send(generateSkeleton(targetUrl, req.query))
    }, SYNC_RENDER_TIMEOUT)

    renderPage(targetUrl)
      .then(html => {
        // ① 404 页（NotFound 路由）：返回真实 404 + noindex，并写缓存（下次命中直接 404）。
        //    必须放在坏渲染检测之前 —— 404 页可见文本少，会被 MIN_RENDER_TEXT 误判为坏渲染。
        if (isNotFoundRender(html)) {
          const withNoindex = ensureNoindex(html)
          setCache(targetUrl, withNoindex)
          console.log(`[not-found] 404: ${targetUrl}`)
          if (responded) return
          clearTimeout(timer)
          responded = true
          res.set('X-SEO-Cache', 'MISS-404')
          return res.status(404).type('html').send(withNoindex)
        }
        // 坏渲染（CF 拦截页 / 前端没起来）：绝不写缓存，本次直接给骨架。
        // 否则一张带 noindex 的错误页会被缓存 24h，持续喂给 Googlebot。
        if (isBadRender(html)) {
          console.error(`[bad-render] rejected, not cached: ${targetUrl}`)
          if (responded) return
          clearTimeout(timer)
          responded = true
          res.set('X-SEO-Cache', 'BAD-RENDER-SKELETON')
          return res.status(200).type('html').send(generateSkeleton(targetUrl, req.query))
        }
        setCache(targetUrl, html)
        if (responded) {
          // 已超时吐过骨架：此次渲染仅用于写缓存
          console.log(`Async render cached (after timeout): ${targetUrl}`)
          return
        }
        clearTimeout(timer)
        responded = true
        res.set('X-SEO-Cache', 'MISS')
        res.type('html').send(html)
      })
      .catch(e => {
        console.error(`Render failed: ${targetUrl} - ${e.message}`)
        if (responded) return
        clearTimeout(timer)
        responded = true
        // 渲染失败降级：返回带 meta 的骨架，至少保证 title/description/canonical 可抓取
        res.set('X-SEO-Cache', 'ERROR-FALLBACK')
        res.status(200).type('html').send(generateSkeleton(targetUrl, req.query))
      })
      .finally(() => {
        // 释放渲染槽位（前台命中、后台写缓存、降级失败三路都走这里）。
        activeRenders--
      })
  } catch (e) {
    console.error(`Render handler error: ${targetUrl} - ${e.message}`)
    // 兜底：即便 getCache 等同步逻辑异常，也返回骨架而非报错，避免爬虫拿到 5xx
    res.status(200).type('html').send(generateSkeleton(targetUrl, req.query))
  }
})

app.post('/invalidate', express.json(), async (req, res) => {
  const { url, pattern } = req.body
  if (url) {
    invalidateCache(url)
  } else if (pattern) {
    // 用流式匹配代替 readFileSync，避免缓存文件多时一次性把所有内容读进内存（P4）。
    const files = fs.readdirSync(CACHE_DIR)
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file)
      if (await fileContainsPattern(filePath, pattern)) {
        try { fs.unlinkSync(filePath) } catch {}
      }
    }
  }
  res.json({ ok: true })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// P5: 内存监控——每 2 分钟打印 RSS，超软阈值时在下一次 getBrowser 主动回收 browser。
// 主动换 browser 的回收逻辑已在 getBrowser 里，这里只做日志暴露，便于定位内存增长曲线。
setInterval(() => {
  const mem = process.memoryUsage()
  const rssMB = (mem.rss / 1024 / 1024).toFixed(1)
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1)
  console.log(`[mem] rss=${rssMB}MB heap=${heapMB}MB renders=${renderCount} active=${activeRenders}` + (browser ? ` browserConnected=${browser.connected}` : ''))
}, 120000)
// P4: 缓存定期清扫——每小时清一次过期文件。
setInterval(() => sweepExpiredCache(), 3600000)

app.listen(PORT, () => {
  console.log(`SEO render service running on port ${PORT}`)
  console.log(`  SPA URL: ${SPA_URL}`)
  console.log(`  Cache dir: ${CACHE_DIR}`)
  console.log(`  Cache TTL: ${CACHE_TTL}s`)
  console.log(`  CF bypass (host-resolver): ${process.env.SEO_RESOLVER_RULES ? 'ON -> ' + process.env.SEO_RESOLVER_RULES : 'OFF (direct render)'}`)
  console.log(`  Mem guard: maxRenders=${BROWSER_MAX_RENDERS} maxConcurrent=${MAX_CONCURRENT} deadline=${RENDER_DEADLINE_MS}ms softLimit=${MEM_SOFT_LIMIT_MB}MB`)
})

process.on('SIGINT', async () => {
  await closeBrowserSafe()
  process.exit(0)
})
