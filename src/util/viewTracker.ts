import api from '@/api/index'

// 浏览上报节流时长：10 分钟
const TTL = 10 * 60 * 1000
// 缓存键统一前缀，便于批量清理过期项
const PREFIX = 'view_'

/** 清理所有已过期的浏览上报缓存 */
function cleanupExpired() {
  try {
    const now = Date.now()
    // 先收集要删除的 key，避免遍历过程中修改 localStorage
    const expired: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(PREFIX)) continue
      const ts = Number(localStorage.getItem(key))
      if (!ts || now - ts >= TTL) expired.push(key)
    }
    expired.forEach(k => localStorage.removeItem(k))
  } catch (e) {
    console.error('cleanupExpired', e)
  }
}

/**
 * 带缓存节流的浏览上报。
 * 首次上报后写入 localStorage，10 分钟内不再上报；
 * 超过 10 分钟则清除缓存，检测到无缓存后重新上报。
 */
async function reportOnce(cacheKey: string, report: () => Promise<any>) {
  try {
    // 每次调用先清理所有过期缓存
    cleanupExpired()

    const now = Date.now()
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const ts = Number(raw)
      // 仍在 10 分钟有效期内，跳过上报
      if (ts && now - ts < TTL) return
      // 已过期，去掉缓存
      localStorage.removeItem(cacheKey)
    }
    // 无缓存（或已过期删除）时才上报，且仅在上报成功后才写入缓存
    const res: any = await report()
    if (res && (res.code === 0 || res.code === 200)) {
      localStorage.setItem(cacheKey, String(now))
    }
  } catch (e) {
    console.error('reportView', cacheKey, e)
  }
}

/** 上报个人主页浏览 */
export function trackHomeView(authorId: string | number) {
  if (!authorId && authorId !== 0) return
  reportOnce(`${PREFIX}home_${authorId}`, () => api.trackHomeView(authorId))
}

/** 上报合集/作品详情浏览 */
export function trackBookView(bookId: string | number) {
  if (!bookId && bookId !== 0) return
  reportOnce(`${PREFIX}book_${bookId}`, () => api.trackBookView(bookId))
}
