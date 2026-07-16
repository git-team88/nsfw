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
$ink: #161122;
$pink: #FF4D8D;
$muted: #9a93a4;

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px 0;
  text-align: center;
  gap: 16px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 3px solid $ink;
  padding: 12px;
  background: linear-gradient(135deg, #FFE885, #FF7AAE);
  box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
}

.empty-text {
  font-size: 15px;
  color: $ink;
  font-weight: 800;
}

.empty-hint {
  font-size: 13px;
  color: $muted;
  font-weight: 600;
  max-width: 320px;
  line-height: 1.6;
}
</style>