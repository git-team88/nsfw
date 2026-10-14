// ============================================================
// SEO 动态渲染服务 —— pm2 配置（nsfw 站，正式 / 测试通用）
// 放置位置：/data/seo-render/fansfans/ecosystem.config.cjs
//   （三个站各一个子目录：/data/seo-render/{blfans,moegen,fansfans}/，互不影响；
//     进程名 / 端口 / 缓存目录三站不同：blfans 3001 · moegen 3000 · fansfans 3002）
//
// 正式站启动：  pm2 start /data/seo-render/fansfans/ecosystem.config.cjs                 （默认 env = 正式）
// 测试站启动：  pm2 start /data/seo-render/fansfans/ecosystem.config.cjs --env test      （用 env_test）
// 重载：        pm2 reload seo-render-fansfans [--env test]
// 日志：        pm2 logs seo-render-fansfans
//
// ⚠️ pm2 会记住上次启动用的 env，改了配置要 pm2 delete seo-render-fansfans 再 start，
//    或 pm2 reload seo-render-fansfans --update-env [--env test]。
// ============================================================

// 两边完全相同的部分
const common = {
  // 渲染服务监听端口（nginx vhost 里 proxy_pass 必须指向同一个端口）
  SEO_PORT: 3002,
  // 渲染结果缓存目录与有效期（秒）
  CACHE_DIR: '/data/seo-cache/fansfans',
  CACHE_TTL: 86400,
  // 站点品牌名与描述（seo-server.mjs 的默认值是 BlFans，这里显式指定）
  SEO_SITE_NAME: 'FansFans 萌創',
  SEO_SITE_DESC: 'FansFans 萌創は、日本・台湾・香港のクリエイター向けの二次元 AI 創作プラットフォーム。ひとこと入力で小説・漫画・アニメドラマを自動生成。30K 文字無料からスタート。',
}

// 按站点域名生成那几个会变的变量
// extraHosts：还需要绕 CF 的其它域名（如测试 API 域名），一并加进 host-resolver
function site(host, extraHosts = []) {
  return {
    ...common,
    // 被渲染的站点地址
    SPA_URL: `https://${host}`,
    // 渲染出的 hreflang / canonical / og:url 使用的站点地址
    SEO_SITE_URL: `https://${host}`,
    // ★ 关键：站点在 Cloudflare 后面，且 CF 可能封禁服务器本机 IP。
    //   puppeteer 渲染时把目标域名强制解析到 127.0.0.1（本机 nginx），绕开 Cloudflare。
    //   由 zz-seo-loopback.conf 在 127.0.0.1:443 提供自签回环服务（所有站的域名都接）。
    //   ⚠️ 若 API 域名也在 CF 后面并被封，把 API 域名一并加进这个 MAP 列表。
    SEO_RESOLVER_RULES: [host, ...extraHosts].map(h => `MAP ${h} 127.0.0.1`).join(','),
  }
}

module.exports = {
  apps: [{
    name: 'seo-render-fansfans',
    script: 'scripts/seo-server.mjs',
    cwd: '/data/seo-render/fansfans',

    env:      site('www.fansfans.ai', ['fansfans.ai', 'api.moegen.ai', 'api2.moegen.ai']),  // 默认：正式站（裸域 + API 域名也在 CF 后面，一起走回环）
    env_test: site('wwwtest.fansfans.ai', ['testapi.addaiaroot.com']),  // --env test：测试站（测试 API 也在 CF 后面，一起走回环）

    instances: 1,
    max_memory_restart: '512M',
    restart_delay: 3000
  }]
}
