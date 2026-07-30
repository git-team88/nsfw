import express from 'express'
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const app = express()
const PORT = process.env.SEO_PORT || 3001
const SPA_URL = process.env.SPA_URL || 'https://www.moegen.ai'
const CACHE_DIR = process.env.CACHE_DIR || '/data/seo-cache'
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10)

const BOTS = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp|facebot|ia_archiver|mediapartners|adsbot|ahrefsbot|semrushbot|rogerbot|dotbot|chatgpt-user/i

const RENDER_TIMEOUT = 15000
const WAIT_AFTER_LOAD = 3000
// 混合策略的「同步等待窗口」：缓存未命中时最多同步等这么久拿完整正文，
// 超时则先返回骨架、同一次渲染转后台跑完写缓存。需小于 nginx/爬虫的超时阈值。
const SYNC_RENDER_TIMEOUT = parseInt(process.env.SYNC_RENDER_TIMEOUT || '9000', 10)
const SITE_NAME = 'MoeGen 萌創'
const SITE_URL = 'https://www.moegen.ai'

const LANG_MAP = { ja: 'ja', en: 'en', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' }
const CONTENT_TYPES = ['novel', 'comic', 'drama', 'photo', 'video']

const SEO_TITLES = {
  detail: { ja: '作品詳細 - MoeGen 萌創', en: 'Work Detail - MoeGen', 'zh-cn': '作品详情 - MoeGen 萌创', 'zh-tw': '作品詳情 - MoeGen 萌創' },
  collection: { ja: 'コレクション - MoeGen 萌創', en: 'Collection - MoeGen', 'zh-cn': '合集 - MoeGen 萌创', 'zh-tw': '合集 - MoeGen 萌創' },
  novel: { ja: 'AI小説生成 - MoeGen 萌創', en: 'AI Novel Generator - MoeGen', 'zh-cn': 'AI小说生成 - MoeGen 萌创', 'zh-tw': 'AI小說生成 - MoeGen 萌創' },
}

function detectLang(url) {
  const match = url.match(/\/(ja|en|zh-cn|zh-tw)\//)
  return match ? match[1] : 'ja'
}

function detectPageType(url) {
  if (url.includes('/detail')) return 'detail'
  if (url.includes('/collection/')) return 'collection'
  if (url.match(/\/novel\/\d+/)) return 'novel'
  return null
}

function generateSkeleton(url, query = {}) {
  const lang = detectLang(url)
  const htmlLang = LANG_MAP[lang] || 'ja'
  const pageType = detectPageType(url)
  const titles = pageType ? SEO_TITLES[pageType] : null
  const title = titles ? (titles[lang] || titles.ja) : 'MoeGen 萌創'
  const description = 'MoeGen 萌創は二次元AI創作プラットフォーム。ひとこと入力で小説・漫画・アニメドラマを自動生成。'

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/assets/js/app.js"></script>
</body>
</html>`
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;')
}

// 渲染后补全「爬虫需要、但 SPA 运行时没注入」的元信息：og:* / twitter:* / hreflang x-default。
// title/description 直接从已渲染的 HTML 里取（首页来自 Home.vue 的 i18n，详情页来自接口数据），
// 因此首页与详情页通用，无需再维护一份静态 SEO 文案表。
function enrichSeoMeta(html, url) {
  // 运行时已注入 og:title 就跳过，避免重复
  if (/<meta\s+property=["']og:title["']/i.test(html)) return html

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : SITE_NAME
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  const description = descMatch ? descMatch[1] : ''

  const tags = [
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
  ]

  return html.replace('</head>', tags.join('\n') + '\n</head>')
}

let browser = null

async function getBrowser() {
  if (!browser || !browser.connected) {
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
    // 例: SEO_RESOLVER_RULES="MAP www.moegen.ai 127.0.0.1,MAP api.moegen.ai 127.0.0.1"
    if (process.env.SEO_RESOLVER_RULES) {
      launchArgs.push(`--host-resolver-rules=${process.env.SEO_RESOLVER_RULES}`)
      launchArgs.push('--ignore-certificate-errors') // 回环反代用的是自签证书
    }
    browser = await puppeteer.launch({ headless: true, args: launchArgs })
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
  fs.writeFileSync(getCachePath(url), html)
}

function invalidateCache(url) {
  const filePath = getCachePath(url)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

async function renderPage(url) {
  const b = await getBrowser()
  const page = await b.newPage()
  try {
    await page.setViewport({ width: 1440, height: 900 })
    await page.setUserAgent('Mozilla/5.0 (compatible; MoeGen-SEO-Bot/1.0)')
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
  } finally {
    await page.close()
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
      return res.type('html').send(cached)
    }

    // 无缓存：混合策略。启动一次渲染，在 SYNC_RENDER_TIMEOUT 内完成
    // → 直接返回带正文/图片的完整 HTML（爬虫首次抓取即有内容）；
    // 若超时未完成 → 先返回带 meta 的骨架，同一次渲染继续在后台跑完并写缓存
    // （不重复渲染），下次请求直接命中。渲染失败则降级返回骨架 200（保住 meta）。
    let responded = false

    const timer = setTimeout(() => {
      if (responded) return
      responded = true
      res.set('X-SEO-Cache', 'MISS-TIMEOUT-ASYNC')
      res.type('html').send(generateSkeleton(targetUrl, req.query))
    }, SYNC_RENDER_TIMEOUT)

    renderPage(targetUrl)
      .then(html => {
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
  } catch (e) {
    console.error(`Render handler error: ${targetUrl} - ${e.message}`)
    // 兜底：即便 getCache 等同步逻辑异常，也返回骨架而非报错，避免爬虫拿到 5xx
    res.status(200).type('html').send(generateSkeleton(targetUrl, req.query))
  }
})

app.post('/invalidate', express.json(), (req, res) => {
  const { url, pattern } = req.body
  if (url) {
    invalidateCache(url)
  } else if (pattern) {
    const files = fs.readdirSync(CACHE_DIR)
    for (const file of files) {
      const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8')
      if (content.includes(pattern)) {
        fs.unlinkSync(path.join(CACHE_DIR, file))
      }
    }
  }
  res.json({ ok: true })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`SEO render service running on port ${PORT}`)
  console.log(`  SPA URL: ${SPA_URL}`)
  console.log(`  Cache dir: ${CACHE_DIR}`)
  console.log(`  Cache TTL: ${CACHE_TTL}s`)
  console.log(`  CF bypass (host-resolver): ${process.env.SEO_RESOLVER_RULES ? 'ON -> ' + process.env.SEO_RESOLVER_RULES : 'OFF (direct render)'}`)
})

process.on('SIGINT', async () => {
  if (browser) await browser.close()
  process.exit(0)
})
