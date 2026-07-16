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
  height: 32px;
  padding: 0 12px;
  border: 2.5px solid #161122;
  border-radius: 10px;
  background: #fff;
  color: #161122;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.12);
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.16s;
}

.pg-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 rgba(22, 17, 34, 0.18);
}

.pg-btn:active:not(:disabled) {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.12);
}

.pg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.06);
}

.pg-btn:focus-visible {
  outline: 2.5px solid #FF4D8D;
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
  height: 32px;
  min-width: 32px;
  padding: 0 8px;
  border: 2.5px solid #161122;
  border-radius: 10px;
  background: #fff;
  color: #6A7282;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.08);
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.16s, background 0.16s, color 0.16s;
}

.pg-num:hover:not(.on) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.14);
  color: #161122;
}

.pg-num:focus-visible {
  outline: 2.5px solid #FF4D8D;
  outline-offset: 2px;
}

.pg-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  font-weight: 800;
  color: #9a93a4;
}

.pg-go {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: #9a93a4;
}

.pg-input {
  width: 50px;
  height: 32px;
  padding: 0 8px;
  border: 2.5px solid #161122;
  border-radius: 10px;
  text-align: center;
  background: #FFFCF6;
  font-weight: 800;
  font-size: 14px;
  color: #161122;
}

.pg-input:focus {
  outline: 2.5px solid #FF4D8D;
  outline-offset: 2px;
}

.pg-go-btn {
  height: 32px;
  padding: 0 12px;
  border: 2.5px solid #161122;
  border-radius: 10px;
  background: #fff;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.12);
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.16s, background 0.16s;
}

.pg-go-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 rgba(22, 17, 34, 0.18);
}

.pg-go-btn:focus-visible {
  outline: 2.5px solid #FF4D8D;
  outline-offset: 2px;
}

.theme-pink .pg-num.on,
.theme-pink .pg-num.on:hover {
  background: #FB64B6;
  color: #fff;
  border-color: #161122;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.22);
  transform: none;
}

.theme-pink .pg-go-btn {
  color: #FB64B6;
}

.theme-pink .pg-go-btn:hover {
  background: #FFE1EC;
}

.theme-blue .pg-num.on,
.theme-blue .pg-num.on:hover {
  background: #161122;
  color: #00D3F2;
  border-color: #161122;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.22);
  transform: none;
}

.theme-blue .pg-go-btn {
  color: #00D3F2;
}

.theme-blue .pg-go-btn:hover {
  background: rgba(0, 211, 242, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .pg-btn,
  .pg-num,
  .pg-go-btn {
    transition: none !important;
  }
  .pg-btn:hover:not(:disabled),
  .pg-num:hover:not(.on),
  .pg-go-btn:hover {
    transform: none !important;
  }
}
</style>
