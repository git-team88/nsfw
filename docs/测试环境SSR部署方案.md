# 测试环境 SSR（SEO 爬虫渲染服务）部署方案

> 目标：在测试环境把「给爬虫用的按需渲染服务」（`scripts/seo-server.mjs`）从零跑起来。
> **方案已定为全站动态渲染**：首页/分类页/详情页统一由 nginx 判定爬虫 UA → 走 seo-server 动态渲染，**不再做构建时预渲染**。
>
> 说明：本项目「SSR」= SPA + 爬虫按需动态渲染（Dynamic Rendering）。本文所有命令基于对测试机的实际巡检结果编写。

---

## 一、测试环境现状（巡检结论）

| 检查项 | 结果 |
|---|---|
| 测试机 | `root@43.153.158.49`（hostname `jp49test`），Debian 12，Node v22.22、npm 10.9、PM2 6.0，包管理 `apt` |
| 前端部署目录 | `/data/wwwroot/testapp.addaiaroot.com/`（静态 + `try_files $uri /index.html` SPA 兜底） |
| PM2 进程 | 仅 `manju_api` / `manju_web` / `manju_worker`，**无 `seo-render`** |
| `seo-server.mjs` / `scripts/` | 服务器上**不存在** |
| 端口 3001 | **无监听** |
| puppeteer / 系统 Chromium | **均未安装**（`/root/.cache/puppeteer` 不存在，无系统 chromium） |
| nginx | 源码编译版，主配 `/usr/local/nginx/conf/nginx.conf`，测试站 vhost `/usr/local/nginx/conf/vhost/testapp.addaiaroot.com.conf` |
| 测试站移动域名 | **`m.addaiaroot.com`**（vhost 里有移动 UA 301 跳转），**不是** `m.fansfans.ai` |

**结论：测试环境从未部署过 SSR 服务，需要从零搭建，而不是「改配置」。**

---

## 二、测试环境 与 正式环境 的差异（务必注意）

| 项 | 正式（www.fansfans.ai） | 测试（testapp.addaiaroot.com） |
|---|---|---|
| 部署目录 | `/data/wwwroot/www.fansfans.ai` | `/data/wwwroot/testapp.addaiaroot.com` |
| `docs/ecosystem.config.js` 的 `cwd`/`SPA_URL` | 已按正式写死 | 需改成测试路径/域名 |
| 移动端域名 | `m.fansfans.ai` | `m.addaiaroot.com` |
| nginx 爬虫转发 | `docs/nginx-seo.conf` | 尚无，需新增 |

### ⚠️ 两个已知坑

1. **A/C 标签里的移动端域名**：本次改的 `src/App.vue` 里 `MOBILE_ORIGIN` 写死为 `https://m.fansfans.ai`。`index.html` 里有段内联脚本会在非正式站把 `m.fansfans.ai` 替换成 `m.addaiaroot.com`，但**那段脚本只改 index.html 里静态那条，不会改 App.vue 运行时注入的 link**。因此测试环境上 App.vue 注入的 alternate 仍指向 `m.fansfans.ai`。
   - 影响：测试环境验证「标签是否按页面正确生成」没问题；但域名会是 `m.fansfans.ai`。若测试环境也要域名正确，需让 `App.vue` 的 `MOBILE_ORIGIN` 按 `location.hostname` 动态取值（见第六节）。

2. **测试站 vhost 已有移动 UA 跳转**：
   ```nginx
   if ($http_user_agent ~* (mobile|...|android|iphone|ipad|...)) {
       rewrite ^(.*) https://m.addaiaroot.com$1 permanent;
   }
   ```
   **Googlebot 智能手机版**（UA 含 `Android`/`Mobile`）会命中此规则被 301 到移动站，走不到 SEO 渲染服务。新增爬虫转发时，**必须让爬虫判断排在移动跳转之前**，否则移动爬虫抓不到 PC 渲染结果。

---

## 三、架构（部署后）

```
爬虫请求 https://testapp.addaiaroot.com/  (首页/分类/详情，任意路径)
        │
   nginx vhost
        │  ① 先判 UA：是爬虫？（$is_bot，必须在移动跳转之前）
        │      是 → rewrite 到内部 /seo-render
        │      否 → 原逻辑（移动跳转 / try_files SPA）
        ▼
   /seo-render (internal)
   proxy_pass → 127.0.0.1:3001/render?url=https://$host$uri$is_args$args
        ▼
   PM2: seo-render (scripts/seo-server.mjs)
   puppeteer 渲染 → enrichSeoMeta 补 og/twitter/x-default → 缓存（/data/seo-cache-test，TTL 24h）
   渲染失败 → 降级返回 meta 骨架
```

全站（含首页/语言/分类页）都走此服务；title/description 由页面运行时（Home.vue i18n / 详情页接口数据）提供，seo-server 再补 og/twitter/x-default。**不再有构建时预渲染静态 HTML。**

---

## 四、部署步骤（从零搭建）

### Step 0 · 前置：安装 Chromium 系统依赖（Debian 12）

puppeteer 下载的 Chrome 需要一批系统库，否则启动报 `error while loading shared libraries`：

```bash
apt-get update
apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 \
  libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 \
  libxrandr2 xdg-utils
# 中日文渲染建议再装字体（可选）
apt-get install -y fonts-noto-cjk
```

### Step 1 · 建独立运行目录 + 安装依赖

不与前端静态目录混用，单独放 `/data/seo-render`：

```bash
mkdir -p /data/seo-render/scripts
cd /data/seo-render

# package.json（只装 SSR 服务需要的两个包）
cat > package.json <<'EOF'
{
  "name": "moegen-seo-render",
  "private": true,
  "type": "module",
  "dependencies": {
    "express": "^4.22.2",
    "puppeteer": "^25.3.0"
  }
}
EOF

npm install    # 会自动下载 Chromium 到 /root/.cache/puppeteer
```

然后把仓库里的 `scripts/seo-server.mjs` 上传到 `/data/seo-render/scripts/seo-server.mjs`（本地执行）：

```bash
# 本地机器执行
scp -i /Users/chunliu/Downloads/acg.pem \
  /Users/chunliu/Desktop/social/scripts/seo-server.mjs \
  root@43.153.158.49:/data/seo-render/scripts/seo-server.mjs
```

> `seo-server.mjs` 里的域名判断（`SITE_URL`、bot 正则等）目前写死正式站，测试环境功能验证不受影响；若要精确可后续参数化。

### Step 2 · 测试版 PM2 配置

在 `/data/seo-render/ecosystem.test.config.js`：

```js
module.exports = {
  apps: [{
    name: 'seo-render',
    script: 'scripts/seo-server.mjs',
    cwd: '/data/seo-render',
    env: {
      SEO_PORT: 3001,
      SPA_URL: 'https://testapp.addaiaroot.com',
      CACHE_DIR: '/data/seo-cache-test',
      CACHE_TTL: 86400
    },
    instances: 1,
    max_memory_restart: '512M',
    restart_delay: 3000
  }]
}
```

### Step 3 · 启动并设为开机自启

```bash
cd /data/seo-render
pm2 start ecosystem.test.config.js
pm2 save
pm2 logs seo-render --lines 30   # 确认 "SEO render service running on port 3001"
```

### Step 4 · 本机自测（先不碰 nginx）

```bash
# 模拟爬虫直接打渲染服务，确认能返回带正文的完整 HTML
curl -s "http://127.0.0.1:3001/render?url=https://testapp.addaiaroot.com/detail?id=3541&contentType=novel" \
  | grep -Ei 'rel="canonical"|rel="alternate"|<title>'
# 期望能看到 canonical / alternate(mobile) / title
curl -s http://127.0.0.1:3001/health   # {"status":"ok"}
```

自测通过后再进行 Step 5。

### Step 5 · 修改 nginx（有风险，需单独确认后执行）

编辑 `/usr/local/nginx/conf/vhost/testapp.addaiaroot.com.conf`：

1. **在 `http` 或 server 外层**（主配 `nginx.conf` 的 http 块）加爬虫 UA map：
   ```nginx
   map $http_user_agent $is_bot {
       default 0;
       ~*googlebot 1;  ~*bingbot 1;  ~*baiduspider 1;  ~*yandexbot 1;
       ~*duckduckbot 1; ~*slurp 1;  ~*facebot 1;  ~*ia_archiver 1;
       ~*mediapartners 1; ~*adsbot-google 1; ~*ahrefsbot 1; ~*semrushbot 1;
       ~*chatgpt-user 1;
   }
   ```

2. **在 server 块内、移动 UA 跳转之前**插入爬虫优先转发：
   ```nginx
   # ★ 必须放在 mobile UA rewrite 之前，避免 Googlebot-Mobile 被 301 到移动站
   if ($is_bot) { rewrite ^(.*)$ /seo-render last; }

   location /seo-render {
       internal;
       proxy_pass http://127.0.0.1:3001/render?url=https://$host$uri$is_args$args;
       proxy_set_header Host $host;
       proxy_read_timeout 30s;
       proxy_intercept_errors on;
       error_page 502 503 504 /index.html;   # 渲染服务挂了降级回 SPA
   }
   ```
   > 注意 `$is_args$args`：详情页靠 query（`?id=&contentType=`），必须带上，否则渲染服务拿不到参数。

3. **校验后再 reload**（reload 不断连接，比 restart 安全）：
   ```bash
   nginx -t && nginx -s reload
   ```

### Step 6 · 线上验证 + 缓存

```bash
# 用爬虫 UA 访问，X-SEO-Cache 应为 MISS/HIT
curl -s -A "Googlebot/2.1" -I "https://testapp.addaiaroot.com/detail?id=3541&contentType=novel"
curl -s -A "Googlebot/2.1" "https://testapp.addaiaroot.com/collection/722" | grep -i canonical

# 内容更新后让缓存失效（后端可集成，见 docs/cache-invalidate-examples.sh）
curl -X POST http://127.0.0.1:3001/invalidate -H "Content-Type: application/json" \
  -d '{"url":"https://testapp.addaiaroot.com/detail?id=3541&contentType=novel"}'
```

---

## 五、回滚

| 改动 | 回滚 |
|---|---|
| PM2 进程 | `pm2 delete seo-render && pm2 save` |
| nginx 改动 | 改前先备份：`cp testapp.addaiaroot.com.conf{,.bak}`；出问题 `cp .bak 回去 && nginx -t && nginx -s reload` |
| 运行目录 | `rm -rf /data/seo-render /data/seo-cache-test` |

nginx 每次改动务必：**先备份 → `nginx -t` → 再 `nginx -s reload`**。

---

## 六、可选优化（本次不一定做）

1. **A/C 移动域名按环境动态取值**：把 `src/App.vue` 的 `MOBILE_ORIGIN` 改成按 `location.hostname` 判断——正式站用 `m.fansfans.ai`，测试站用 `m.addaiaroot.com`（与 index.html 内联脚本一致）。这样测试环境标签域名也正确。
2. **`seo-server.mjs` 参数化站点信息**：把 `SITE_URL`/`SITE_NAME` 改为读环境变量，彻底复用同一份脚本跑测试/正式。
3. **缓存预热**：参考 `scripts/warm-cache.sh`，把 `SITE` 改成 `https://testapp.addaiaroot.com`，部署后预热热门详情页。

---

## 七、待你确认的点

- 是否接受在测试机新增独立目录 `/data/seo-render` 并 `npm install` 下载 Chromium（约数百 MB）？
- Step 5 改 nginx 需要你明确授权（有搞挂测试站风险，虽已做降级与备份）。
- A/C 标签在测试环境是否需要域名也正确（决定是否做第六节第 1 项）。
