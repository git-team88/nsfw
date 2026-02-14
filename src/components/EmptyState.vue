<template>
  <div class="empty-state">
    <img class="empty-icon" :src="noDataIcon" alt="No data" />
    <div class="empty-text">{{ text || t('common.noData') }}</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import noDataIcon from '@/assets/images/base/no_data.png'

interface Props {
  text?: string
}

defineProps<Props>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rem 2rem 0;
  text-align: center;
}

.empty-icon {
  width: 12rem;
  height: 12rem;
  margin-bottom: 2rem;
  opacity: 0.6;
}

.empty-text {
  font-size: 1.4rem;
  color: #99A1AF;
  font-weight: 300;
}
</style>