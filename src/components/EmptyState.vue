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
  padding: 80px 20px 0;
  text-align: center;
  gap: 8px;
}

.empty-icon {
  width: 140px;
  height: 140px;
}

.empty-text {
  font-size: 14px;
  color: #ccc;
  font-weight: 500;
}

.empty-hint {
  font-size: 13px;
  color: #777;
  font-weight: 600;
  max-width: 320px;
  line-height: 1.6;
}
</style>