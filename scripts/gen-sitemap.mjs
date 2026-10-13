#!/usr/bin/env node
/**
 * gen-sitemap.mjs — 生成 public/sitemap.xml
 *
 * 用法：
 *   node scripts/gen-sitemap.mjs                         # 仅静态 URL（默认，永远可用）
 *   node scripts/gen-sitemap.mjs --harvest https://www.fansfans.ai
 *                                                        # 静态 URL + 用 puppeteer 渲染首页族页面，
 *                                                        # 采集详情/合集/创作者页链接后一并写入
 *   node scripts/gen-sitemap.mjs --out path/to/sitemap.xml
 *
 * 设计要点：
 * - 静态模式零依赖、零网络，构建机上直接跑，绝不失败。
 * - harvest 模式依赖 puppeteer（seo-render 同款），任何一步失败都退回静态清单，
 *   保证 sitemap 永远能产出 —— 宁可少列 URL，也不能交出一张坏 sitemap。
 * - lastmod 用生成当日真实日期，不再硬编码（Google 会逐渐不信任长期不变的 lastmod）。
 */

import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SEO_SITE_URL || 'https://www.fansfans.ai').replace(/\/+$/, '')
const LANGS = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'th']
const TYPES = ['novel', 'comic', 'drama', 'photo', 'video']

// 内容型 URL 上限（防止采集失控撑爆 sitemap；单文件上限 5 万条）
const MAX_CONTENT_URLS = parseInt(process.env.SITEMAP_MAX_URLS || '2000', 10)
// harvest 渲染这些页面来收集内链（首页 + 6 语言首页）
const HARVEST_PATHS = ['/', ...LANGS.map(l => `/${l}`)]

// ---- 静态 URL 清单（与 src/router/index.ts 的有效公开路由核对过）----
function staticUrls() {
  const urls = []
  urls.push({ path: '/', priority: '1.0', freq: 'daily' })
  for (const l of LANGS) urls.push({ path: `/${l}`, priority: '0.9', freq: 'daily' })
  for (const l of LANGS) for (const t of TYPES) urls.push({ path: `/${l}/${t}`, priority: '0.8', freq: 'daily' })
  for (const t of TYPES) urls.push({ path: `/${t}`, priority: '0.8', freq: 'daily' })
  urls.push({ path: '/guide.html', priority: '0.7', freq: 'monthly' })
  urls.push({ path: '/about.html', priority: '0.7', freq: 'monthly' })
  urls.push({ path: '/computing-rules', priority: '0.6', freq: 'monthly' })
  urls.push({ path: '/ai-recharge', priority: '0.6', freq: 'weekly' })
  urls.push({ path: '/terms', priority: '0.5', freq: 'yearly' })
  urls.push({ path: '/privacy', priority: '0.5', freq: 'yearly' })
  urls.push({ path: '/payment-terms', priority: '0.5', freq: 'yearly' })
  urls.push({ path: '/ai-points-details', priority: '0.4', freq: 'monthly' })
  return urls
}

// ---- harvest：渲染页面并收集内链 ----
// 只收「内容实体页」：作品详情 / 合集 / 创作者主页。
// 登录墙后的路径（/my-projects /publish /user-* 等）即使出现也会被这个白名单滤掉。
const CONTENT_LINK_RE = /^\/(?:detail\/[^/?#]+|collection\/[^/?#]+|user-home\/[^/?#]+)\/?$/

async function harvestContentUrls(base) {
  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch {
    console.error('[harvest] puppeteer 不可用，退回静态清单')
    return []
  }

  let browser = null
  const found = new Map() // path -> priority

  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (compatible; FansFans-SEO-Renderer/1.0; +https://www.fansfans.ai/)')

    for (const p of HARVEST_PATHS) {
      try {
        await page.goto(base + p, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('#app > *', { timeout: 12000 }).catch(() => {})
        await new Promise(r => setTimeout(r, 2500))
        const links = await page.$$eval('a[href]', as =>
          as.map(a => { try { return new URL(a.getAttribute('href'), location.origin).pathname } catch { return '' } })
        )
        for (const link of links) {
          if (!CONTENT_LINK_RE.test(link)) continue
          if (!found.has(link)) found.set(link, link.startsWith('/user-home/') ? '0.6' : '0.7')
          if (found.size >= MAX_CONTENT_URLS) break
        }
        console.log(`[harvest] ${p}: 累计 ${found.size} 条内容页`)
      } catch (e) {
        console.error(`[harvest] ${p} 渲染失败: ${e.message}（跳过）`)
      }
      if (found.size >= MAX_CONTENT_URLS) break
    }
  } catch (e) {
    console.error(`[harvest] 启动失败: ${e.message}，退回静态清单`)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
  return [...found.entries()].map(([path, priority]) => ({ path, priority, freq: 'monthly' }))
}

// ---- 输出 ----
function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildXml(entries) {
  const today = new Date().toISOString().slice(0, 10)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]
  for (const { path: p, priority, freq } of entries) {
    lines.push(
      '  <url>',
      `    <loc>${escapeXml(SITE_URL + p)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${freq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    )
  }
  lines.push('</urlset>')
  return lines.join('\n') + '\n'
}

async function main() {
  const argv = process.argv.slice(2)
  const outIdx = argv.indexOf('--out')
  const outPath = outIdx >= 0 ? argv[outIdx + 1] : path.resolve('public/sitemap.xml')
  const harvestIdx = argv.indexOf('--harvest')
  const base = harvestIdx >= 0 ? (argv[harvestIdx + 1] || SITE_URL).replace(/\/+$/, '') : null

  const entries = staticUrls()

  if (base) {
    const content = await harvestContentUrls(base)
    console.log(`[harvest] 采集到内容页 ${content.length} 条`)
    entries.push(...content)
  }

  const xml = buildXml(entries)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, xml)
  console.log(`已生成 ${outPath}（共 ${entries.length} 条 URL，lastmod=${new Date().toISOString().slice(0, 10)}）`)
}

main().catch(e => {
  console.error('sitemap 生成失败:', e)
  process.exit(1)
})
