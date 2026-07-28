// ⚠️ 已废弃（DEPRECATED）：
// 全站已改为「爬虫按需动态渲染」（scripts/seo-server.mjs），首页/分类页不再构建时预渲染。
// 本文件保留仅作参考/回退，不再接入构建与部署流程（package.json、build_and_deploy_web.sh 已移除对它的调用）。
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LANG_ROUTES = ['ja', 'en', 'zh-cn', 'zh-tw']
const LANG_URL_TO_HTML = { ja: 'ja', en: 'en', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' }
const CONTENT_TYPES = ['novel', 'comic', 'drama', 'photo', 'video']

const SEO_DATA = {
  ja: {
    '/': { title: 'MoeGen 萌創 - AI で小説・漫画・アニメドラマを一括生成｜ひとことで物語を', description: 'MoeGen 萌創は二次元 AI 創作プラットフォーム。ひとこと入力で小説・漫画・アニメドラマを自動生成。30K文字無料。', keywords: 'AI小説生成,AI漫画生成,AIアニメドラマ,二次元AI,MoeGen,萌創,なろう AI' },
    '/novel': { title: 'AI小説生成 - MoeGen 萌創｜ひとことで小説を自動生成', description: 'MoeGen 萌創のAI小説生成。ひとこと入力で30K文字の小説を自動生成。キャラクター設定も自由自在。', keywords: 'AI小説生成,ひとこと小説,AI執筆,MoeGen,萌創,なろう AI' },
    '/comic': { title: 'AI漫画生成 - MoeGen 萌創｜ひとことで漫画を自動生成', description: 'MoeGen 萌創のAI漫画生成。ひとこと入力でオリジナル漫画を自動生成。キャラクター画像も設定可能。', keywords: 'AI漫画生成,ひとこと漫画,AI漫画作成,MoeGen,萌創' },
    '/drama': { title: 'AIアニメドラマ生成 - MoeGen 萌創｜ひとことでアニメドラマを自動生成', description: 'MoeGen 萌創のAIアニメドラマ生成。ひとこと入力でアニメ調のドラマを自動生成。', keywords: 'AIアニメドラマ生成,アニメドラマ作成,MoeGen,萌創' },
    '/photo': { title: 'AIイラスト生成 - MoeGen 萌創｜ひとことでイラストを自動生成', description: 'MoeGen 萌創のAIイラスト生成。ひとこと入力で高品質なイラストを自動生成。キャラクター設定も可能。', keywords: 'AIイラスト生成,AI画像生成,ひとことイラスト,MoeGen,萌創' },
    '/video': { title: 'AI動画生成 - MoeGen 萌創｜ひとことで動画を自動生成', description: 'MoeGen 萌創のAI動画生成。ひとこと入力でアニメ調の動画を自動生成。キャラクター設定も可能。', keywords: 'AI動画生成,AIアニメ動画,ひとこと動画,MoeGen,萌創' },
  },
  en: {
    '/': { title: 'MoeGen - AI Novel & Manga Generator | Create Stories with One Prompt', description: 'MoeGen is an AI-powered creative platform. Generate novels, manga, and anime dramas with a single prompt. Start free with 30K characters.', keywords: 'AI novel generator,AI manga generator,anime drama AI,MoeGen,AI writing tool' },
    '/novel': { title: 'AI Novel Generator - MoeGen | Generate Novels with One Prompt', description: 'Generate 30K-character novels with a single prompt on MoeGen. Customize characters and story styles.', keywords: 'AI novel generator,one prompt novel,AI writing,MoeGen' },
    '/comic': { title: 'AI Manga Generator - MoeGen | Generate Manga with One Prompt', description: 'Generate original manga with a single prompt on MoeGen. Set characters and art styles.', keywords: 'AI manga generator,one prompt manga,MoeGen' },
    '/drama': { title: 'AI Anime Drama Generator - MoeGen', description: 'Generate anime-style dramas with a single prompt on MoeGen.', keywords: 'AI anime drama generator,MoeGen' },
    '/photo': { title: 'AI Illustration Generator - MoeGen | Generate Illustrations with One Prompt', description: 'Generate high-quality illustrations with a single prompt on MoeGen. Customize characters and art styles.', keywords: 'AI illustration generator,AI image generator,MoeGen' },
    '/video': { title: 'AI Video Generator - MoeGen | Generate Videos with One Prompt', description: 'Generate anime-style videos with a single prompt on MoeGen. Customize characters and scenes.', keywords: 'AI video generator,AI anime video,MoeGen' },
  },
  'zh-cn': {
    '/': { title: 'MoeGen 萌创 - AI一键生成小说·漫画·动画剧', description: 'MoeGen 萌创是面向创作者的二次元AI创作平台。一句话输入即可自动生成小说、漫画、动画剧。30K字免费体验。', keywords: 'AI小说生成,AI漫画生成,二次元AI,MoeGen,萌创,AI写作工具' },
    '/novel': { title: 'AI小说生成 - MoeGen 萌创｜一句话生成小说', description: 'MoeGen 萌创的AI小说生成功能。一句话输入即可生成30K字小说，自由设定角色。', keywords: 'AI小说生成,一句话小说,AI写作,MoeGen,萌创' },
    '/comic': { title: 'AI漫画生成 - MoeGen 萌创｜一句话生成漫画', description: 'MoeGen 萌创的AI漫画生成功能。一句话输入即可生成原创漫画。', keywords: 'AI漫画生成,一句话漫画,MoeGen,萌创' },
    '/drama': { title: 'AI动画剧生成 - MoeGen 萌创｜一句话生成动画剧', description: 'MoeGen 萌创的AI动画剧生成功能。一句话输入即可生成动画剧。', keywords: 'AI动画剧生成,MoeGen,萌创' },
    '/photo': { title: 'AI插画生成 - MoeGen 萌创｜一句话生成插画', description: 'MoeGen 萌创的AI插画生成功能。一句话输入即可生成高品质插画，自由设定角色。', keywords: 'AI插画生成,AI图片生成,一句话插画,MoeGen,萌创' },
    '/video': { title: 'AI视频生成 - MoeGen 萌创｜一句话生成视频', description: 'MoeGen 萌创的AI视频生成功能。一句话输入即可生成动画视频，自由设定角色。', keywords: 'AI视频生成,AI动画视频,一句话视频,MoeGen,萌创' },
  },
  'zh-tw': {
    '/': { title: 'MoeGen 萌創 - AI一鍵生成小說·漫畫·動畫劇', description: 'MoeGen 萌創是面向創作者的二次元AI創作平台。一句話輸入即可自動生成小說、漫畫、動畫劇。30K字免費體驗。', keywords: 'AI小說生成,AI漫畫生成,二次元AI,MoeGen,萌創,AI寫作工具' },
    '/novel': { title: 'AI小說生成 - MoeGen 萌創｜一句話生成小說', description: 'MoeGen 萌創的AI小說生成功能。一句話輸入即可生成30K字小說，自由設定角色。', keywords: 'AI小說生成,一句話小說,AI寫作,MoeGen,萌創' },
    '/comic': { title: 'AI漫畫生成 - MoeGen 萌創｜一句話生成漫畫', description: 'MoeGen 萌創的AI漫畫生成功能。一句話輸入即可生成原創漫畫。', keywords: 'AI漫畫生成,一句話漫畫,MoeGen,萌創' },
    '/drama': { title: 'AI動畫劇生成 - MoeGen 萌創｜一句話生成動畫劇', description: 'MoeGen 萌創的AI動畫劇生成功能。一句話輸入即可生成動畫劇。', keywords: 'AI動畫劇生成,MoeGen,萌創' },
    '/photo': { title: 'AI插畫生成 - MoeGen 萌創｜一句話生成插畫', description: 'MoeGen 萌創的AI插畫生成功能。一句話輸入即可生成高品質插畫，自由設定角色。', keywords: 'AI插畫生成,AI圖片生成,一句話插畫,MoeGen,萌創' },
    '/video': { title: 'AI影片生成 - MoeGen 萌創｜一句話生成影片', description: 'MoeGen 萌創的AI影片生成功能。一句話輸入即可生成動畫影片，自由設定角色。', keywords: 'AI影片生成,AI動畫影片,一句話影片,MoeGen,萌創' },
  },
}

const HREFLANG_MAP = { ja: 'ja', en: 'en', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' }

const routes = LANG_ROUTES.flatMap(lang =>
  [`/${lang}`, ...CONTENT_TYPES.map(type => `/${lang}/${type}`)]
)

function cleanupRuntimeResidue(html) {
  // reCAPTCHA: Puppeteer 在 localhost 加载的 reCAPTCHA 绑定了 localhost:4173，完全移除
  // 实际 reCAPTCHA 由 SPA 运行时用正式 siteKey 初始化
  html = html.replace(/<script[^>]*src[^>]*gstatic\.com\/recaptcha[^>]*><\/script>/gi, '')
  html = html.replace(/<iframe[^>]*google\.com\/recaptcha[^>]*>[^<]*<\/iframe>/gi, '')
  html = html.replace(/<iframe[^>]*google\.com\/recaptcha[^>]*>/gi, '')
  html = html.replace(/<style[^>]*>\s*\.grecaptcha-badge[^<]*<\/style>/gi, '')

  // GA: Puppeteer 动态创建的 <script async> 标签用了测试 ID (G-BBR6VR3HNF)，需要移除
  // 原始内联 GA 初始化脚本 (var GA_ID = window.location.hostname...) 保留不动，
  // 它会在 www.moegen.ai 上自动选生产 ID (G-82ZH65FHJS)
  html = html.replace(/<script[^>]*async[^>]*src[^>]*googletagmanager[^>]*><\/script>/gi, '')

  // Vue 运行时标记
  html = html.replace(/<div id="app" data-v-app="">/, '<div id="app">')

  // 运行时 hreflang 链接（由 App.vue 动态生成的 data-hreflang）
  html = html.replace(/<link[^>]*data-hreflang[^>]*>/g, '')

  return html
}

async function prerender() {
  const distDir = path.join(__dirname, '..', 'dist')
  const indexPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html not found. Run "npm run build-only" first.')
    process.exit(1)
  }

  console.log('Starting prerender...')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  for (const route of routes) {
    console.log(`  Prerendering ${route}...`)

    const url = `http://localhost:4173${route}`
    const page = await browser.newPage()
    try {
      // 注入 SEO 预渲染标记：Home.vue 据此按 URL 显示对应内容类型并保留地址，
      // 而不是像真实用户那样重置为默认内容类型 / 只保留域名。
      await page.evaluateOnNewDocument(() => { window.__SEO_PRERENDER__ = true })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForFunction(() => document.querySelector('#app')?.children?.length > 0, { timeout: 10000 }).catch(() => {})
      await new Promise(r => setTimeout(r, 3000))

      let html = await page.content()

      html = cleanupRuntimeResidue(html)

      const match = route.match(/^\/(ja|en|zh-cn|zh-tw)(\/(novel|comic|drama|photo|video))?$/)
      const lang = match ? match[1] : 'ja'
      const pagePath = match?.[3] ? `/${match[3]}` : '/'
      const seo = SEO_DATA[lang]?.[pagePath] || SEO_DATA.ja['/']
      const htmlLang = LANG_URL_TO_HTML[lang] || 'ja'

      html = html.replace(/<html[^>]*>/i, `<html lang="${htmlLang}">`)
      html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${seo.description}" />`)
      html = html.replace(/<meta\s+name=["']keywords["'][^>]*>/i, `<meta name="keywords" content="${seo.keywords}" />`)
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${seo.title}</title>`)

      // PC↔移动 A/C 互指：把 index.html 里静态的移动端 alternate 替换成「本页对应」的移动端 URL
      // 例：PC /zh-cn/novel → 移动 https://m.moegen.ai/zh-cn/novel/
      html = html.replace(
        /<link\s+rel=["']alternate["']\s+media=[^>]*>/i,
        `<link rel="alternate" media="only screen and (max-width: 640px)" href="https://m.moegen.ai${route}/" />`
      )

      const hreflangTags = LANG_ROUTES.map(l =>
        `<link rel="alternate" hreflang="${HREFLANG_MAP[l]}" href="https://www.moegen.ai/${l}${pagePath === '/' ? '/' : pagePath}" />`
      ).join('\n')

      const inject = `
${hreflangTags}
<link rel="alternate" hreflang="x-default" href="https://www.moegen.ai/ja${pagePath === '/' ? '/' : pagePath}" />
<meta property="og:title" content="${seo.title}" />
<meta property="og:description" content="${seo.description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.moegen.ai${route}" />
<meta property="og:site_name" content="MoeGen 萌創" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${seo.title}" />
<meta name="twitter:description" content="${seo.description}" />`

      html = html.replace('</head>', inject + '\n</head>')

      const outDir = path.join(distDir, route)
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'index.html'), html)

      console.log(`  ✓ ${route}`)
    } catch (e) {
      console.error(`  ✗ ${route}: ${e.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log('Prerender done!')
}

prerender()
