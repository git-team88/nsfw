import { defineStore } from 'pinia'
import api from '@/api/index'

export type ContentSwitchMode = 0 | 1 | 2

function readMode(value: unknown): ContentSwitchMode | null {
  if (typeof value == 'number' && (value == 0 || value == 1 || value == 2)) return value
  if (typeof value == 'string' && /^[012]$/.test(value)) return Number(value) as ContentSwitchMode
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  for (const key of ['switch_no', 'content_switch', 'contentSwitch', 'show_nsfw', 'showNsfw', 'channel', 'value', 'status', 'data']) {
    const mode = readMode(record[key])
    if (mode !== null) return mode
  }
  return null
}

export const useContentSwitchStore = defineStore('contentSwitch', {
  state: () => ({
    // mode 是「生效模式」：后端下发值经过地区规则处理之后的结果，全站都读它。
    mode: (readMode(localStorage.getItem('contentSwitchMode')) ?? 1) as ContentSwitchMode,
    // rawMode 保留后端原始下发值，只用于排查，不参与展示判断
    rawMode: (readMode(localStorage.getItem('contentSwitchModeRaw')) ?? 1) as ContentSwitchMode,
    isChinaRegion: localStorage.getItem('isChinaRegion') == '1',
    userAllowsSensitive: localStorage.getItem('allowSensitiveContent') == '1',
    loaded: false,
    loading: null as Promise<void> | null,
  }),
  getters: {
    showNsfw: (state): number => state.mode == 0 ? 0 : state.mode == 2 ? 1 : state.userAllowsSensitive ? 1 : 0,
    showSensitiveToggle: (state): boolean => state.mode == 1,
    channel: (state): number | undefined => state.mode == 2 ? 1 : undefined,
    projectNsfwFilter: (state): number => state.mode == 0 ? 2 : state.mode == 2 ? 3 : 1,
    // 创作类型标题前的「R18」前缀：只有强制展示 NSFW（生效模式 2）时才挂。
    // 中国地区已降级为 0，标题回到「视频 / 图片 / 漫画 / 小说」。
    showAdultLabel: (state): boolean => state.mode == 2,
    // 中国地区 + 后端下发 2：整块运营 banner 既不请求也不展示。
    // 用 rawMode 而不是 mode —— mode 已被降级为 0，分不出「后端本来就给 0」和「被降级的 2」。
    bannerDisabled: (state): boolean => state.isChinaRegion && state.rawMode == 2,
  },
  actions: {
    async ensureLoaded() {
      if (this.loaded) return
      if (this.loading) return this.loading

      // content switch 和地区一起取，两个请求并行，不互相阻塞
      this.loading = Promise.all([
        api.getContentSwitchPublic().catch((error: unknown) => {
          console.error('Failed to load content switch:', error)
          return null
        }),
        api.getCode().catch((error: unknown) => {
          console.error('Failed to load country code:', error)
          return null
        }),
      ]).then(([switchRes, codeRes]: any[]) => {
        const rawMode = (switchRes ? readMode(switchRes) : null) ?? 1

        // 只有明确拿到非 CN 的国家码才算「非中国地区」。
        // 接口失败或字段缺失时按中国处理 —— 与各页面 userRegion 出错置 false 的口径一致，
        // 宁可少展示也不误展示。
        const countryCode = codeRes && codeRes.code == 0 ? codeRes.data?.countryCode : ''
        const isChina = !countryCode || countryCode == 'CN'

        // 中国地区即使后端下发 2（强制展示 NSFW），也降级为 0 按普通模式展示：
        // 不显示敏感内容，也不给用户开关。其余地区维持后端下发值。
        const effectiveMode: ContentSwitchMode = (isChina && rawMode == 2) ? 0 : rawMode

        this.rawMode = rawMode
        this.isChinaRegion = isChina
        this.mode = effectiveMode
        this.userAllowsSensitive = this.mode == 2 || (this.mode == 1 && (localStorage.getItem('allowSensitiveContent') == '1'))

        localStorage.setItem('contentSwitchMode', String(this.mode))
        localStorage.setItem('contentSwitchModeRaw', String(this.rawMode))
        localStorage.setItem('isChinaRegion', isChina ? '1' : '0')
        localStorage.setItem('allowSensitiveContent', this.userAllowsSensitive ? '1' : '0')
        this.loaded = true
      }).finally(() => {
        this.loading = null
      })
      return this.loading
    },
    setUserAllowsSensitive(value: boolean) {
      if (this.mode !== 1) return
      this.userAllowsSensitive = value
      localStorage.setItem('allowSensitiveContent', value ? '1' : '0')
    },
  },
})
