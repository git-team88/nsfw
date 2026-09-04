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
      // 例: SEO_RESOLVER_RULES="MAP www.moegen.ai 127.0.0.1,MAP api.moegen.ai 127.0.0.1"
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
  fs.writeFileSync(getCachePath(url), html)
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
