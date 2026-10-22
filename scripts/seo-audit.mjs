#!/usr/bin/env node
/**
 * seo-audit.mjs — 预渲染覆盖率巡检 + 失败告警（SEO T14）
 *
 * 用法（在 /data/seo-render/<site>/ 下）：
 *   node scripts/seo-audit.mjs --full     每天一次：sitemap 全部 URL + 随机 50 个合集页
 *   node scripts/seo-audit.mjs --probe    每 5 分钟：只抓 2 个页面，看渲染服务活没活
 *
 * 环境变量：
 *   SEO_SITE_URL      站点地址，默认 https://www.blfans.ai（URL / canonical / 报告都按它）
 *   SEO_AUDIT_ORIGIN  实际把请求发到哪，默认 http://127.0.0.1（本机 nginx 回环，带 Host 头；
 *                     走公网会被 Cloudflare 把假 Googlebot UA 拦成 403）。要测 CF 这一层就设成 SITE_URL
 *   SEO_AUDIT_DIR     报告目录，默认 /data/seo-audit/<域名>
 *   SEO_ALERT_WEBHOOK 告警 webhook（企微 / 飞书机器人地址），不填只写日志
 *   SEO_ALERT_TYPE    wecom | feishu | generic，默认按地址自动判断
 *   SEO_AUDIT_SAMPLE  随机抽的合集页数量，默认 50
 *   SEO_AUDIT_CONCURRENCY 并发，默认 2（渲染服务同时只跑 4 个，太高会把爬虫挤成骨架）
 *   SEO_AUDIT_P95_MS  冷渲染 p95 告警阈值，默认 5000
 *
 * 每条 URL 断言 4 件事，任一不满足记 fail：
 *   1. HTTP 200
 *   2. 预渲染命中：HTML > 20KB 且正文可见字 > 300（视频 / 图片作品详情页本身文字少，按 > 60）
 *   3. 语言正确：html[lang] 与 URL 前缀一致，无前缀页为 en
 *   4. canonical 等于自身（去查询串、去尾斜杠；/en 系列指向无前缀地址是预期的）
 * 输出：<dir>/YYYY-MM-DD.csv（url,status,bytes,text_len,lang,canonical,x_seo_cache,ttfb_ms,ok,reason）
 *       <dir>/latest.json（汇总），保留 30 天
 * 告警：失败率 > 2%，或任一 P0 页（首页 / 语言页 / 工具页）失败，或 MISS 渲染的 p95 耗时 > SEO_AUDIT_P95_MS
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'

const MODE = process.argv.includes('--probe') ? 'probe' : 'full'
const SITE_URL = (process.env.SEO_SITE_URL || 'https://www.blfans.ai').replace(/\/+$/, '')
const HOST = new URL(SITE_URL).host
const ORIGIN = (process.env.SEO_AUDIT_ORIGIN || 'http://127.0.0.1').replace(/\/+$/, '')
const OUT_DIR = process.env.SEO_AUDIT_DIR || `/data/seo-audit/${HOST}`
const WEBHOOK = process.env.SEO_ALERT_WEBHOOK || ''
const ALERT_TYPE = process.env.SEO_ALERT_TYPE || (WEBHOOK.includes('qyapi.weixin') ? 'wecom' : WEBHOOK.includes('feishu') || WEBHOOK.includes('larksuite') ? 'feishu' : 'generic')
const SAMPLE = parseInt(process.env.SEO_AUDIT_SAMPLE || '50', 10)
const CONCURRENCY = parseInt(process.env.SEO_AUDIT_CONCURRENCY || '2', 10)
// 冷渲染 p95 阈值：渲染本身要等页面加载完再等 3s（WAIT_AFTER_LOAD），3s 以内不现实，默认 5s
const P95_MS = parseInt(process.env.SEO_AUDIT_P95_MS || '5000', 10)
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) seo-audit'
const TIMEOUT_MS = 60000

const LANGS = { ja: 'ja', en: 'en', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW', ko: 'ko', th: 'th' }
const TYPES = ['novel', 'comic', 'drama', 'photo', 'video']

fs.mkdirSync(OUT_DIR, { recursive: true })
const log = (...a) => console.log(new Date().toISOString(), ...a)

// ---------- 取样 ----------
/** 抓一个页面：请求发到 ORIGIN，Host 头用站点域名，走回环时带 X-Forwarded-Proto: https 免得被 http→https 301 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const o = new URL(ORIGIN)
    const mod = o.protocol === 'https:' ? https : http
    const t0 = Date.now()
    const req = mod.request({
      host: o.hostname, port: o.port || (o.protocol === 'https:' ? 443 : 80), method: 'GET', path: u.pathname + u.search,
      headers: { Host: u.host, 'User-Agent': UA, 'Accept-Language': 'en', 'X-Forwarded-Proto': 'https' },
      servername: u.hostname, timeout: TIMEOUT_MS,
    }, res => {
      const ttfb = Date.now() - t0
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({
        status: res.statusCode, text: Buffer.concat(chunks).toString('utf-8'), ttfb,
        headers: { get: n => { const v = res.headers[n.toLowerCase()]; return Array.isArray(v) ? v.join(', ') : (v || null) } },
        location: res.headers.location || '',
      }))
      res.on('error', reject)
    })
    req.on('timeout', () => { req.destroy(); const e = new Error('timeout'); e.name = 'AbortError'; reject(e) })
    req.on('error', reject)
    req.end()
  })
}

async function sitemapUrls() {
  const seen = new Set()
  const out = []
  async function walk(url, depth = 0) {
    if (depth > 2) return
    let r
    try { r = await fetchText(url) } catch (e) { log(`[sitemap] ${url} ${e.message}`); return }
    if (r.status !== 200) { log(`[sitemap] ${url} HTTP ${r.status}`); return }
    const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1])
    if (/<sitemapindex/i.test(r.text)) {
      for (const l of locs) await walk(l, depth + 1)
    } else {
      for (const l of locs) {
        // sitemap 里写的可能是正式域名，巡检哪个站就换成哪个站
        const u = l.replace(/^https?:\/\/[^/]+/, SITE_URL)
        if (!seen.has(u)) { seen.add(u); out.push(u) }
      }
    }
  }
  await walk(`${SITE_URL}/sitemap.xml`)
  return out
}

/** 随机合集页：先从 sitemap 里拿（T03 之后有），没有就从首页渲染结果里采集 /collection/ 链接 */
async function sampleCollections(fromSitemap) {
  let pool = fromSitemap.filter(u => /\/collection\/\d+$/.test(u))
  if (pool.length < SAMPLE) {
    const found = new Set(pool)
    for (const p of ['/', '/ja', '/en', '/zh-cn', '/zh-tw', '/ko', '/th']) {
      try {
        const r = await fetchText(`${SITE_URL}${p}`)
        for (const m of r.text.matchAll(/href="\/collection\/(\d+)"/g)) found.add(`${SITE_URL}/collection/${m[1]}`)
      } catch {}
      if (found.size >= SAMPLE * 2) break
    }
    pool = [...found]
  }
  // 洗牌取前 N
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  return pool.slice(0, SAMPLE)
}

// ---------- 断言 ----------
function isP0(url) {
  const p = new URL(url).pathname.replace(/\/$/, '') || '/'
  if (p === '/') return true
  const m = p.match(/^\/([a-z-]+)(?:\/([a-z]+))?$/)
  if (!m) return false
  if (LANGS[m[1]] && (!m[2] || TYPES.includes(m[2]))) return true
  return TYPES.includes(m[1]) && !m[2]
}
function expectedLang(url) {
  const p = new URL(url).pathname
  const m = p.match(/^\/(ja|en|zh-cn|zh-tw|ko|th)(\/|$)/)
  return m ? LANGS[m[1]] : 'en'
}
function expectedCanonical(url) {
  const u = new URL(url)
  let p = u.pathname.replace(/\/+$/, '') || '/'
  // T08 方案甲：/en 和 /en/{type} 的 canonical 指向不带前缀的地址
  const en = p.match(/^\/en(\/(novel|comic|drama|photo|video))?$/)
  if (en) p = en[1] || '/'
  return `${SITE_URL}${p}`
}
function visibleText(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1]
  return body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, '')
}

async function audit(url) {
  const row = { url, status: 0, bytes: 0, text_len: 0, lang: '', canonical: '', x_seo_cache: '', ttfb_ms: 0, ok: false, reason: '' }
  try {
    const r = await fetchText(url)
    row.status = r.status
    row.bytes = Buffer.byteLength(r.text)
    row.ttfb_ms = r.ttfb
    row.x_seo_cache = r.headers.get('x-seo-cache') || ''
    row.lang = (r.text.match(/<html[^>]*\blang=["']([^"']*)["']/i) || [, ''])[1]
    row.canonical = (r.text.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) || r.text.match(/<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i) || [, ''])[1]
    row.text_len = visibleText(r.text).length
    const reasons = []
    if (r.status !== 200) reasons.push(`http_${r.status}${r.location ? '->' + r.location : ''}`)
    // guide.html / about.html 这类是构建时就有的静态 HTML，不经过渲染服务、也只有一种语言，
    // 只看能不能打开，不查渲染头 / 语言 / canonical
    if (/\.html$/.test(new URL(url).pathname)) {
      row.ok = reasons.length === 0
      row.reason = reasons.join(';')
      return row
    }
    const isMedia = /\/detail\/\d+/.test(url)
    const minText = isMedia ? 60 : 300
    if (row.bytes <= 20000 || row.text_len <= minText) reasons.push(`thin(bytes=${row.bytes},text=${row.text_len})`)
    if (!row.x_seo_cache) reasons.push('no_prerender_header')
    const el = expectedLang(url)
    if (row.lang.toLowerCase() !== el.toLowerCase()) reasons.push(`lang(${row.lang || '-'}!=${el})`)
    const ec = expectedCanonical(url)
    if (row.canonical.replace(/\/+$/, '') !== ec.replace(/\/+$/, '')) reasons.push(`canonical(${row.canonical || '-'})`)
    row.ok = reasons.length === 0
    row.reason = reasons.join(';')
  } catch (e) {
    row.reason = `error(${e.name === 'AbortError' ? 'timeout' : e.message})`
  }
  return row
}

async function runPool(urls) {
  const rows = []
  let i = 0
  async function worker() {
    while (i < urls.length) {
      const u = urls[i++]
      const row = await audit(u)
      rows.push(row)
      if (!row.ok) log(`[fail] ${u} ${row.reason}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker))
  return rows
}

// ---------- 输出 / 告警 ----------
function csvEscape(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
function writeCsv(rows, file) {
  const cols = ['url', 'status', 'bytes', 'text_len', 'lang', 'canonical', 'x_seo_cache', 'ttfb_ms', 'ok', 'reason']
  fs.writeFileSync(file, [cols.join(','), ...rows.map(r => cols.map(c => csvEscape(r[c])).join(','))].join('\n') + '\n')
}
function percentile(arr, p) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] }
function cleanupOld() {
  const keep = 30 * 86400000
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!/^\d{4}-\d{2}-\d{2}\.csv$/.test(f)) continue
    const fp = path.join(OUT_DIR, f)
    if (Date.now() - fs.statSync(fp).mtimeMs > keep) fs.unlinkSync(fp)
  }
}
async function alert(title, lines) {
  const text = [`【SEO 巡检告警】${HOST} ${title}`, ...lines].join('\n')
  log('[alert]\n' + text)
  if (!WEBHOOK) return
  let body
  if (ALERT_TYPE === 'wecom') body = { msgtype: 'text', text: { content: text } }
  else if (ALERT_TYPE === 'feishu') body = { msg_type: 'text', content: { text } }
  else body = { text }
  try {
    const res = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    log(`[alert] webhook ${res.status}`)
  } catch (e) {
    log(`[alert] webhook failed: ${e.message}`)
  }
}

// ---------- 主流程 ----------
async function main() {
  if (MODE === 'probe') {
    // 探活：首页语言页 + 一个合集页。渲染服务停了 nginx 会回退静态壳（没有 X-SEO-Cache 头、正文空）
    const urls = [`${SITE_URL}/ja`]
    try {
      const r = await fetchText(`${SITE_URL}/ja`)
      const m = r.text.match(/href="\/collection\/(\d+)"/)
      if (m) urls.push(`${SITE_URL}/collection/${m[1]}`)
    } catch {}
    const rows = await runPool(urls)
    const bad = rows.filter(r => !r.ok)
    const stateFile = path.join(OUT_DIR, 'probe-state.json')
    let state = { failStreak: 0 }
    try { state = JSON.parse(fs.readFileSync(stateFile, 'utf-8')) } catch {}
    state.failStreak = bad.length ? state.failStreak + 1 : 0
    state.last = { at: new Date().toISOString(), ok: !bad.length, rows }
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
    // 连续两次失败才报（单次网络抖动不报），恢复时报一次
    if (state.failStreak === 2) await alert('探活失败（连续 2 次）', bad.map(r => `${r.url} → ${r.reason}`))
    if (!bad.length && state.notified) { await alert('探活恢复', urls); state.notified = false }
    if (state.failStreak >= 2) state.notified = true
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
    log(`[probe] ${bad.length ? 'FAIL' : 'OK'} ${rows.map(r => `${r.url} ${r.status} ${r.ttfb_ms}ms ${r.x_seo_cache || '-'}`).join(' | ')}`)
    return
  }

  const t0 = Date.now()
  const fromSitemap = await sitemapUrls()
  const samples = await sampleCollections(fromSitemap)
  const urls = [...new Set([...fromSitemap, ...samples])]
  log(`[full] sitemap=${fromSitemap.length} sample=${samples.length} total=${urls.length}`)
  let rows = await runPool(urls)

  // 第一轮失败的隔 20s 再抓一次：没缓存的页第一次可能只拿到骨架（渲染转后台了），第二次就该命中了。
  // 两次都不行才算真失败；第一次的耗时仍记进 MISS 统计。
  const firstFails = rows.filter(r => !r.ok)
  if (firstFails.length) {
    log(`[full] retry ${firstFails.length} failed url(s) after 20s`)
    await new Promise(r => setTimeout(r, 20000))
    const again = await runPool(firstFails.map(r => r.url))
    const byUrl = new Map(again.map(r => [r.url, r]))
    rows = rows.map(r => (!r.ok && byUrl.get(r.url)?.ok) ? { ...byUrl.get(r.url), ttfb_ms: r.ttfb_ms, x_seo_cache: r.x_seo_cache + '>' + byUrl.get(r.url).x_seo_cache } : r)
  }

  const fails = rows.filter(r => !r.ok)
  const p0Fails = fails.filter(r => isP0(r.url))
  const missTtfb = rows.filter(r => /MISS/.test(r.x_seo_cache)).map(r => r.ttfb_ms)
  const p95Miss = percentile(missTtfb, 0.95)
  const failRate = rows.length ? fails.length / rows.length : 0
  const day = new Date().toISOString().slice(0, 10)
  const csv = path.join(OUT_DIR, `${day}.csv`)
  writeCsv(rows, csv)
  const summary = {
    at: new Date().toISOString(), site: SITE_URL, total: rows.length, fail: fails.length, fail_rate: +failRate.toFixed(4),
    p0_fail: p0Fails.length, miss_count: missTtfb.length, miss_p50_ms: percentile(missTtfb, 0.5), miss_p95_ms: p95Miss,
    all_p95_ms: percentile(rows.map(r => r.ttfb_ms), 0.95), elapsed_s: Math.round((Date.now() - t0) / 1000), csv,
    fails: fails.map(r => ({ url: r.url, reason: r.reason })),
  }
  fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify(summary, null, 2))
  cleanupOld()
  log(`[full] done total=${rows.length} fail=${fails.length} (${(failRate * 100).toFixed(1)}%) p0_fail=${p0Fails.length} miss_p95=${p95Miss}ms csv=${csv}`)

  const problems = []
  if (failRate > 0.02) problems.push(`失败率 ${(failRate * 100).toFixed(1)}%（${fails.length}/${rows.length}）> 2%`)
  if (p0Fails.length) problems.push(`P0 页失败 ${p0Fails.length} 个：${p0Fails.slice(0, 5).map(r => r.url.replace(SITE_URL, '')).join(' ')}`)
  if (p95Miss > P95_MS) problems.push(`冷渲染 p95 ${p95Miss}ms > ${P95_MS}ms（${missTtfb.length} 次 MISS）`)
  if (problems.length) {
    await alert('每日巡检', [...problems, '失败明细（最多 10 条）：', ...fails.slice(0, 10).map(r => `${r.url.replace(SITE_URL, '')} → ${r.reason}`), `报告：${csv}`])
  }
}

main().catch(e => { log('[fatal]', e); process.exit(1) })
