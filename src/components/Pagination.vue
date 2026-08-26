<template>
  <div class="pagination" :class="`theme-${theme}`">
    <button class="pg-btn" :disabled="page <= 1" @click="to(page - 1)">
      <svg class="pg-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9.25 12.06L8.72 11.53L5.90 8.71C5.50 8.32 5.50 7.68 5.90 7.29L8.72 4.47L9.25 3.94L10.31 5.00L9.78 5.53L7.31 8.00L9.78 10.47L10.31 11.00L9.25 12.06Z" fill="currentColor"/>
      </svg>
      <span>{{ t('pagination.prev') }}</span>
    </button>
    <div class="pg-pages">
      <template v-for="p in pages" :key="`p-${p}`">
        <span v-if="p === '...'" class="pg-ellipsis">…</span>
        <button v-else class="pg-num" :class="{ on: p === page }" @click="to(p as number)">{{ p }}</button>
      </template>
    </div>
    <button class="pg-btn" :disabled="page >= totalPages" @click="to(page + 1)">
      <span>{{ t('pagination.next') }}</span>
      <svg class="pg-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6.75 3.94L7.28 4.47L10.10 7.29C10.50 7.68 10.50 8.32 10.10 8.71L7.28 11.53L6.75 12.06L5.69 11.00L6.22 10.47L8.69 8.00L6.22 5.53L5.69 5.00L6.75 3.94Z" fill="currentColor"/>
      </svg>
    </button>
    <div class="pg-go">
      <span>{{ t('pagination.page') }}</span>
      <input class="pg-input" type="text" inputmode="numeric" :max="totalPages" v-model="goPageStr" @input="onGoInput" />
      <button class="pg-go-btn" @click="go()">{{ t('pagination.go') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserPagination">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{ total: number; pageSize: number; modelValue: number; theme?: 'pink' | 'blue' }>()
const emit = defineEmits(['update:modelValue'])
const page = computed(() => {
  const val = props.modelValue
  if (typeof val !== 'number' || isNaN(val)) {
    return 1
  }
  return val
})
const totalPages = computed(() => {
  const total = typeof props.total === 'number' && !isNaN(props.total) ? props.total : 0
  const size = typeof props.pageSize === 'number' && !isNaN(props.pageSize) && props.pageSize > 0 ? props.pageSize : 10
  return Math.max(1, Math.ceil(total / size))
})
const theme = computed(() => props.theme ?? 'blue')
const pages = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = Math.max(1, Math.min(page.value, total))

  if (total <= 5) {
    return Array.from({ length: total }).map((_, i) => i + 1)
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  if (current >= total - 2) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, '...', current - 1, current, current + 1, '...', total]
})
const goPageStr = ref('')
const goPage = ref<number | null>(null)
function onGoInput(ev: Event) {
  const el = ev.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '')
  el.value = digits
  if (!digits) {
    goPageStr.value = ''
    goPage.value = null
    return
  }
  let num = Number(digits)
  const max = totalPages.value
  if (num < 1) num = 1
  if (num > max) num = max
  goPageStr.value = String(num)
  goPage.value = num
}
function to(p: number) {
  if (p < 1 || p > totalPages.value) return
  emit('update:modelValue', p)
}
function go() {
  if (goPage.value == null) return
  to(goPage.value)
}
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pg-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #3d3d3d;
  border-radius: 25px;
  background: #1a1a1a;
  color: #f5f5f5;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.15s, color 0.15s;
}

.pg-btn:hover:not(:disabled) {
  border-color: #ff4f9a;
  color: #ff4f9a;
}

.pg-btn:active:not(:disabled) {
  border-color: #ff4f9a;
}

.pg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.pg-btn:focus-visible {
  outline: 2px solid #ff4f9a;
  outline-offset: 2px;
}

.pg-arrow {
  width: 14px;
  height: 14px;
  flex: none;
}

.pg-pages {
  display: flex;
  gap: 6px;
}

.pg-num {
  height: 36px;
  min-width: 36px;
  padding: 0 8px;
  border: 1px solid #3d3d3d;
  border-radius: 50%;
  background: #1a1a1a;
  color: #aaa;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.pg-num:hover:not(.on) {
  border-color: #ff4f9a;
  color: #f5f5f5;
}

.pg-num:focus-visible {
  outline: 2px solid #ff4f9a;
  outline-offset: 2px;
}

.pg-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  font-weight: 800;
  color: #777;
}

.pg-go {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: #777;
}

.pg-input {
  width: 50px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  text-align: center;
  background: #1a1a1a;
  font-weight: 800;
  font-size: 14px;
  color: #f5f5f5;
}

.pg-input:focus {
  outline: 2px solid #ff4f9a;
  outline-offset: 2px;
}

.pg-go-btn {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background: #1a1a1a;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.pg-go-btn:hover {
  border-color: #ff4f9a;
  color: #ff4f9a;
}

.pg-go-btn:focus-visible {
  outline: 2px solid #ff4f9a;
  outline-offset: 2px;
}

.theme-pink .pg-num.on,
.theme-pink .pg-num.on:hover {
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  color: #fff;
  border: 2px solid #ff9aca;
  box-shadow: 0 0 10px rgba(255, 61, 134, .25);
  transform: none;
}

.theme-pink .pg-go-btn {
  color: #ff4f9a;
}

.theme-pink .pg-go-btn:hover {
  border-color: #ff4f9a;
  background: rgba(255,79,154,0.12);
}

.theme-blue .pg-num.on,
.theme-blue .pg-num.on:hover {
  background: #f5f5f5;
  color: #1a1a1a;
  border-color: #3d3d3d;
  box-shadow: none;
  transform: none;
}

.theme-blue .pg-go-btn {
  color: #00D3F2;
}

.theme-blue .pg-go-btn:hover {
  border-color: #00D3F2;
  background: rgba(0, 211, 242, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .pg-btn,
  .pg-num,
  .pg-go-btn {
    transition: none !important;
  }
}
</style>
