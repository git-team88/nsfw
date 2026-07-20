# ============================================
# 预热缓存脚本
# 部署后执行，提前渲染热门页面，让 Googlebot 首次访问直接命中缓存
#
# 用法: bash warm-cache.sh
# ============================================

SEO_SERVICE="http://127.0.0.1:3001"
SITE="https://www.moegen.ai"
LANGS=("ja" "en" "zh-cn" "zh-tw")
TYPES=("novel" "comic" "drama" "photo" "video")

log() { echo "[warm] $*"; }

# 1. 静态页面（首页、分类页）- 已有预渲染，跳过
log "静态页面已有预渲染，跳过"

# 2. 热门详情页 - 从后端 API 获取热门作品 ID
# 需要根据实际 API 调整
log "获取热门作品列表..."

# 示例：从 API 获取最近 100 个作品 ID
# WORK_IDS=$(curl -s "https://api.moegen.ai/hot-works?limit=100" | jq -r '.[].id')

# 临时示例 ID（替换为实际 API 调用）
WORK_IDS="1 2 3 4 5"

for lang in "${LANGS[@]}"; do
  for id in $WORK_IDS; do
    for type in "${TYPES[@]}"; do
      url="${SITE}/${lang}/${type}?id=${id}"
      log "预热: ${url}"
      curl -s "${SEO_SERVICE}/render?url=${url}" > /dev/null
    done
  done
done

# 3. 热门合集
COLLECTION_IDS="1 2 3"
for lang in "${LANGS[@]}"; do
  for id in $COLLECTION_IDS; do
    url="${SITE}/${lang}/collection/${id}"
    log "预热: ${url}"
    curl -s "${SEO_SERVICE}/render?url=${url}" > /dev/null
  done
done

log "预热完成 ✓"
