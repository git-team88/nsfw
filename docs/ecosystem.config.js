module.exports = {
  apps: [{
    name: 'seo-render',
    script: 'scripts/seo-server.mjs',
    cwd: '/data/wwwroot/www.moegen.ai',
    env: {
      SEO_PORT: 3001,
      SPA_URL: 'https://www.moegen.ai',
      CACHE_DIR: '/data/seo-cache',
      CACHE_TTL: 86400
    },
    instances: 1,
    max_memory_restart: '512M',
    restart_delay: 3000
  }]
}
