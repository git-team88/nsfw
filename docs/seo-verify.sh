#!/bin/bash
# ============================================
# seo-verify.sh — 测试环境 SEO 渲染验证脚本
#
# 用 Googlebot UA 抓取目标页，检查：是否走到渲染服务、关键 SEO 标签、
# 正文是否真的渲染出来，并与普通用户对比。
#
# 用法:
#   bash docs/seo-verify.sh <url或path> [--invalidate]
#
# 示例:
#   bash docs/seo-verify.sh /ja
#   bash docs/seo-verify.sh "/detail?id=3541&contentType=novel"
#   bash docs/seo-verify.sh https://testapp.addaiaroot.com/collection/722
#   bash docs/seo-verify.sh /ja --invalidate     # 先清该页缓存再抓（需 SSH）
#
# 可用环境变量覆盖默认值:
#   SEO_BASE   目标站点          (默认 https://testapp.addaiaroot.com)
#   SEO_HOST   SSH 主机(用于 --invalidate，默认 root@43.153.158.49)
#   SSH_KEY    SSH 私钥          (默认 ~/Downloads/acg.pem)
#   SEO_PORT   渲染服务端口      (默认 3001)
# ============================================

set -u

SEO_BASE="${SEO_BASE:-https://testapp.addaiaroot.com}"
SEO_HOST="${SEO_HOST:-root@43.153.158.49}"
SSH_KEY="${SSH_KEY:-$HOME/Downloads/acg.pem}"
SEO_PORT="${SEO_PORT:-3001}"

GBOT="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
GBOT_M="Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
NORMAL="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"

# 颜色
G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; N=$'\033[0m'
ok()   { echo "  ${G}✓${N} $*"; }
bad()  { echo "  ${R}✗${N} $*"; }
warn() { echo "  ${Y}!${N} $*"; }

if [[ $# -lt 1 ]]; then
  echo "用法: bash docs/seo-verify.sh <url或path> [--invalidate]"
  exit 1
fi

ARG="$1"; shift || true
INVALIDATE=0
[[ "${1:-}" == "--invalidate" ]] && INVALIDATE=1

# 拼出完整 URL（支持传 path 或完整 URL）
if [[ "$ARG" == http* ]]; then URL="$ARG"; else URL="${SEO_BASE}${ARG}"; fi

echo "═══════════════════════════════════════════════"
echo " 目标: $URL"
echo "═══════════════════════════════════════════════"

# 可选：先失效缓存（渲染服务只监听 127.0.0.1，需经 SSH）
if [[ $INVALIDATE -eq 1 ]]; then
  echo "[0] 失效缓存..."
  if [[ -f "$SSH_KEY" ]]; then
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SEO_HOST" \
      "curl -s -X POST http://127.0.0.1:${SEO_PORT}/invalidate -H 'Content-Type: application/json' -d '{\"url\":\"${URL}\"}'" \
      && echo && ok "已失效" || bad "失效失败（检查 SSH_KEY / SEO_HOST）"
  else
    bad "找不到 SSH_KEY: ${SSH_KEY}，跳过失效"
  fi
fi

TMP_BOT=$(mktemp); TMP_USER=$(mktemp)
trap 'rm -f "$TMP_BOT" "$TMP_USER"' EXIT

# ---- 1) Googlebot(PC) 抓取 ----
echo "[1] Googlebot(PC) 抓取"
HDR=$(curl -sk -A "$GBOT" -D - "$URL" -o "$TMP_BOT")
HTTP=$(echo "$HDR" | grep -i '^HTTP/' | tail -1 | tr -d '\r')
CACHE=$(echo "$HDR" | grep -i '^X-SEO-Cache:' | tr -d '\r')
echo "  $HTTP"
if [[ -n "$CACHE" ]]; then
  echo "  $CACHE"
  echo "$CACHE" | grep -qi 'ERROR-FALLBACK' && bad "渲染失败降级（只有 meta 骨架，无正文）—— 查 pm2 logs seo-render"
else
  warn "无 X-SEO-Cache 头 —— 可能没走到渲染服务（检查 nginx 爬虫转发 / UA 规则）"
fi

# ---- 2) 关键 SEO 标签 ----
echo "[2] 关键标签"
title=$(grep -Eio '<title>[^<]*</title>' "$TMP_BOT" | head -1 | sed -E 's/<[^>]+>//g')
canon=$(grep -Eio 'rel="canonical" href="[^"]*"' "$TMP_BOT" | head -1)
alt=$(grep -Eio 'media="only screen[^>]*href="[^"]*"' "$TMP_BOT" | head -1)
ogt=$(grep -Eio 'og:title" content="[^"]*"' "$TMP_BOT" | head -1)
[[ -n "$title" ]] && ok "title: $title" || bad "缺 <title>"
if echo "$title" | grep -qiE '404|not found'; then bad "标题疑似 404，渲染到了错误页"; fi
[[ -n "$canon" ]] && ok "$canon" || bad "缺 canonical"
[[ -n "$alt" ]]   && ok "alternate(mobile): $alt" || bad "缺 移动端 alternate"
[[ -n "$ogt" ]]   && ok "$ogt" || warn "缺 og:title"
echo "  hreflang:"; grep -Eio 'hreflang="[^"]*" href="[^"]*"' "$TMP_BOT" | sed 's/^/    /'

# ---- 3) 正文是否渲染 ----
echo "[3] 正文渲染校验"
CNT=$(grep -c -Ei 'post-title|comic-title|chapter-title|home-page|<h1' "$TMP_BOT")
SIZE=$(wc -c < "$TMP_BOT" | tr -d ' ')
if [[ "$CNT" -gt 0 ]]; then ok "内容元素数: ${CNT}（正文已渲染），HTML ${SIZE} 字节"
else bad "未检测到正文元素（可能是空壳/骨架），HTML ${SIZE} 字节"; fi

# ---- 4) 对比普通用户 ----
echo "[4] 普通用户对比（应为空壳 SPA）"
curl -sk -A "$NORMAL" "$URL" -o "$TMP_USER"
UOG=$(grep -c 'og:title' "$TMP_USER"); USIZE=$(wc -c < "$TMP_USER" | tr -d ' ')
BOG=$(grep -c 'og:title' "$TMP_BOT")
echo "  普通用户: og:title=$UOG, ${USIZE} 字节 | 爬虫: og:title=$BOG"
if [[ "$BOG" -ge 1 && "$UOG" -eq 0 ]]; then ok "爬虫拿到富标签、普通用户拿空壳 —— 分流正确"
else warn "分流不符预期（普通用户不应有 og，爬虫应有 og）"; fi

# ---- 5) Googlebot 手机版：不应被 301 到移动站 ----
echo "[5] Googlebot 手机版（不应 301 跳 m 站）"
MHDR=$(curl -sk -A "$GBOT_M" -D - "$URL" -o /dev/null)
MHTTP=$(echo "$MHDR" | grep -i '^HTTP/' | tail -1 | tr -d '\r')
MLOC=$(echo "$MHDR" | grep -i '^location:' | tr -d '\r')
if echo "$MHTTP" | grep -q '301' || [[ -n "$MLOC" ]]; then
  bad "被 301 跳转: $MLOC —— 爬虫判断未置于移动跳转之前"
else ok "${MHTTP}（未跳转，正常进入渲染）"; fi

echo "═══════════════════════════════════════════════"
