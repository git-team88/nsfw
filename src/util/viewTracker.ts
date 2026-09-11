import api from '@/api/index'

// 浏览上报节流时长：10 分钟
const TTL = 10 * 60 * 1000
// 缓存键统一前缀，便于批量清理过期项
const PREFIX = 'view_'

// 正在请求中的 key，防止同一次进入页面并发重复上报
const inFlight = new Set<string>()

/**
 * 清理所有已过期的浏览上报缓存。
 * 每次上报时会调用，另外 main.ts 里在应用启动时也会调用一次，
 * 这样即使用户之后再没进过个人主页 / 合集详情，残留的 key 也会在下次打开站点时被清掉。
 */
export function cleanupExpiredViews() {
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
    console.error('cleanupExpiredViews', e)
  }
}

/**
 * 带缓存节流的浏览上报。
 * 首次上报后写入 localStorage，10 分钟内不再上报；
 * 超过 10 分钟则清除缓存，检测到无缓存后重新上报。
 */
async function reportOnce(cacheKey: string, report: () => Promise<any>) {
  // 同一个 key 正在请求中，直接跳过（缓存要等接口返回才写，这期间不挡重复调用）
  if (inFlight.has(cacheKey)) return
  try {
    // 每次调用先清理所有过期缓存
    cleanupExpiredViews()

    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const ts = Number(raw)
      // 仍在 10 分钟有效期内，跳过上报
      if (ts && Date.now() - ts < TTL) return
      // 已过期，去掉缓存
      localStorage.removeItem(cacheKey)
    }
    // 无缓存（或已过期删除）时才上报，且仅在上报成功后才写入缓存
    inFlight.add(cacheKey)
    const res: any = await report()
    if (res && (res.code === 0 || res.code === 200)) {
      // 用接口返回后的时间，保证 10 分钟是从上报成功那一刻开始算
      localStorage.setItem(cacheKey, String(Date.now()))
    }
  } catch (e) {
    console.error('reportView', cacheKey, e)
  } finally {
    inFlight.delete(cacheKey)
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
