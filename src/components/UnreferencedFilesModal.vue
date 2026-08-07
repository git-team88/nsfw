<template>
  <div class="unreferenced-files-modal-overlay">
    <div class="unreferenced-files-modal">
      <div class="modal-header">
        <div class="modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D8D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h3>{{ t('home.unreferencedFiles.title') }}</h3>
      </div>
      <div class="modal-content">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <span class="modal-btn skip" @click="$emit('skip')">{{ t('home.unreferencedFiles.skip') }}</span>
        <span class="modal-btn go-back" @click="$emit('goBack')">{{ t('home.unreferencedFiles.goBack') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  labels: string[];
}>();

defineEmits<{
  skip: [];
  goBack: [];
}>();

const message = computed(() => {
  const fileList = props.labels.join('、');
  return t('home.unreferencedFiles.descriptionPrefix') + fileList + t('home.unreferencedFiles.descriptionSuffix');
});
</script>

<style scoped lang="scss">
.unreferenced-files-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.unreferenced-files-modal {
  position: relative;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 16px;
  width: 480px;
  padding: 32px 36px 28px;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .modal-icon {
      flex-shrink: 0;
    }

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #161122;
      margin: 0;
    }
  }

  .modal-content {
    margin: 20px 0 28px;
    padding: 16px;
    background: rgba(255, 77, 141, 0.06);
    border-radius: 10px;
    border: 1.5px solid rgba(255, 77, 141, 0.15);

    p {
      font-size: 14px;
      color: #3d3650;
      line-height: 22px;
      margin: 0;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;

    .modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 160px;
      height: 48px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease-out;

      &:hover {
        transform: translate(-1px, -2px);
      }

      &:active {
        transform: translate(1px, 1px);
      }
    }

    .skip {
      background: #fff;
      color: #5b5566;
      border: 2px solid #161122;
      box-shadow: 2px 2px 0 #161122;

      &:hover {
        color: #FF4D8D;
      }
    }

    .go-back {
      background: #FF4D8D;
      color: #ffffff;
      border: 2.5px solid #161122;
      box-shadow: 2px 2px 0 #161122;

      &:hover {
        box-shadow: 3px 3px 0 #161122;
      }
    }
  }
}
</style>
