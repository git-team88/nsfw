# ============================================
# 缓存失效 API 调用示例
# 当后端内容更新时，调用此接口让 SEO 缓存失效
# ============================================

# 方式1：失效指定URL的缓存
curl -X POST http://127.0.0.1:3001/invalidate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.moegen.ai/detail?id=123"}'

# 方式2：失效包含特定内容的缓存（如某作品ID）
curl -X POST http://127.0.0.1:3001/invalidate \
  -H "Content-Type: application/json" \
  -d '{"pattern": "work_id_123"}'

# 方式3：在业务代码中集成（后端API更新时自动调用）
# 例如 Python/Java 后端在更新作品后：
#   requests.post('http://127.0.0.1:3001/invalidate', json={'url': f'https://www.moegen.ai/detail?id={work_id}'})
