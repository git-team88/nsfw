import { defineStore } from 'pinia'
import api from '@/api/index'

export type ContentSwitchMode = 0 | 1 | 2

function readMode(value: unknown): ContentSwitchMode | null {
  if (typeof value === 'number' && (value === 0 || value === 1 || value === 2)) return value
  if (typeof value === 'string' && /^[012]$/.test(value)) return Number(value) as ContentSwitchMode
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
    mode: (readMode(localStorage.getItem('contentSwitchMode')) ?? 1) as ContentSwitchMode,
    userAllowsSensitive: localStorage.getItem('allowSensitiveContent') === '1',
    loaded: false,
    loading: null as Promise<void> | null,
  }),
  getters: {
    showNsfw: (state): number => state.mode === 0 ? 0 : state.mode === 2 ? 1 : state.userAllowsSensitive ? 1 : 0,
    showSensitiveToggle: (state): boolean => state.mode === 1,
    channel: (state): number | undefined => state.mode === 2 ? 2 : undefined,
  },
  actions: {
    async ensureLoaded() {
      if (this.loaded) return
      if (this.loading) return this.loading
      this.loading = api.getContentSwitchPublic().then((response: any) => {
        const mode = readMode(response)
        this.mode = mode ?? 1
        this.userAllowsSensitive = this.mode === 2 || (this.mode === 1 && (localStorage.getItem('allowSensitiveContent') === '1'))
        localStorage.setItem('contentSwitchMode', String(this.mode))
        localStorage.setItem('allowSensitiveContent', this.userAllowsSensitive ? '1' : '0')
        this.loaded = true
      }).catch((error: unknown) => {
        console.error('Failed to load content switch:', error)
        this.mode = 1
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
