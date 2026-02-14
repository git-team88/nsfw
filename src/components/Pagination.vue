<template>
  <div class="pagination" :class="`theme-${theme}`">
    <div class="pg-pages">
      <template v-for="p in pages" :key="`p-${p}`">
        <span v-if="p === '...'" class="pg-ellipsis">...</span>
        <button v-else class="pg-num" :class="{ on: p === page }" @click="to(p as number)">{{ p }}</button>
      </template>
    </div>
    <button class="pg-btn" :disabled="page<=1" @click="to(page-1)">
      <img class="pg-icon" :src="leftDisIcon" alt="" v-if="page<=1" />
      <img class="pg-icon" :src="leftIcon" alt="" v-else />
      <span>{{ t('pagination.prev') }}</span>
    </button>
    <button class="pg-btn" :disabled="page>=totalPages" @click="to(page+1)">
      <span>{{ t('pagination.next') }}</span>
      <img class="pg-icon" :src="rightDisIcon" alt="" v-if="page>=totalPages" />
      <img class="pg-icon" :src="rightIcon" alt="" v-else />
    </button>
    <div class="pg-go">
      <span>{{ t('pagination.page') }}</span>
      <input class="pg-input" type="text" inputmode="numeric" :max="totalPages" v-model="goPageStr" @input="onGoInput" />
      <button class="pg-go-btn" @click="go()">{{ t('pagination.go') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserPagination">
defineOptions({ name: 'UserPagination' })
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{ total: number; pageSize: number; modelValue: number; theme?: 'pink' | 'blue' }>()
const emit = defineEmits(['update:modelValue'])
import leftIcon from '@/assets/images/base/left.png'
import leftDisIcon from '@/assets/images/base/left_dis.png'
import rightIcon from '@/assets/images/base/right.png'
import rightDisIcon from '@/assets/images/base/right_dis.png'
const page = computed(() => props.modelValue)
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const theme = computed(() => props.theme ?? 'blue')
const pages = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = page.value
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
.pagination{
  display:flex; align-items:center; justify-content: center; gap:1rem; flex-wrap:wrap;
}
.pg-btn{ height:3.2rem; padding:0 1rem; border:none; border-radius:.6rem; background:#fff; color:#364153; cursor: pointer;}
.pg-btn:disabled{ cursor:default; color: #99A1AF;}
.pg-btn{ display:flex; align-items:center; gap:.6rem; }
.pg-icon{ width:1.6rem; height:1.6rem; }
.pg-pages{ display:flex; gap:.6rem; }
.pg-num{ height:3.2rem; min-width:3.2rem; padding:0 .6rem; border:none; border-radius:.6rem; background:#fff; color:#364153; transition: all .15s ease; cursor: pointer;}
.pg-ellipsis{ display:flex; align-items:center; justify-content:center; width:3.2rem; color:#99A1AF; }
.pg-go{ display:flex; align-items:center; gap:.6rem; font-size: 1.4rem; color:#6A7282; }
.pg-input{ width:5rem; height:3.2rem; padding:0 .6rem; border-radius:.6rem; text-align: center; background: #FFFFFF;}
.pg-go-btn{ height:3.2rem; padding:0 .8rem; border:none; border-radius:.6rem; background:none; color:#fff; }

.theme-blue .pg-go-btn{ color:#00D3F2; cursor: pointer; }
.theme-blue .pg-go-btn:hover{background: rgba(0,211,242,0.12);}
.theme-blue .pg-num:hover{ background: rgba(0,211,242,0.12); color: #00D3F2;}
.theme-blue .pg-num.on, .theme-blue .pg-num.on:hover{ background: linear-gradient( 360deg, #00D3F2 0%, #7FEFFF 50%, #00D3F2 100%);
box-shadow: 0px 2px 8px 0px rgba(0,211,242,0.3); color:#FFFFFF; }
.theme-blue .pg-input{ border: 1px solid rgba(0,211,242,0.2);}
.theme-blue .pg-input:focus{ border: 1px solid #00D3F2;}

.theme-pink .pg-go-btn{ color:#FB64B6; cursor: pointer; }
.theme-pink .pg-go-btn:hover{background: rgba(251,100,182,0.12);}
.theme-pink .pg-num:hover{ background: rgba(251,100,182,0.12); color: #FB64B6;}
.theme-pink .pg-num.on, .theme-pink .pg-num.on:hover{ background: linear-gradient( 0deg, #FB64B6 0%, #FF94CE 50%, #FB64B6 100%);
box-shadow: 0px 2px 8px 0px rgba(251,100,182,0.3); color:#FFFFFF; }
.theme-pink .pg-input{ border: 1px solid #FCCEE8;}
.theme-pink .pg-input:focus{ border: 1px solid #FB64B6;}
</style>
