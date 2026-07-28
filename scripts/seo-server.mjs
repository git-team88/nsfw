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
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
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
    await page.evaluateOnNewDocument(() => { window.__SEO_PRERENDER__ = true })
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

    // 无缓存：先返回带 meta 的骨架 HTML（爬虫可抓到 title/description/canonical）
    // 同时异步渲染，渲染完成后写入缓存，下次请求直接命中
    const skeletonHtml = generateSkeleton(targetUrl, req.query)
    res.set('X-SEO-Cache', 'MISS-ASYNC')
    res.type('html').send(skeletonHtml)

    // 异步渲染并缓存（不阻塞响应）
    renderPage(targetUrl).then(html => {
      setCache(targetUrl, html)
      console.log(`Async render cached: ${targetUrl}`)
    }).catch(e => {
      console.error(`Async render failed: ${targetUrl} - ${e.message}`)
    })
  } catch (e) {
    console.error(`Render failed: ${targetUrl} - ${e.message}`)
    res.status(502).send('Render failed')
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
})

process.on('SIGINT', async () => {
  if (browser) await browser.close()
  process.exit(0)
})
