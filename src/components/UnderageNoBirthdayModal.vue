<template>
  <div class="underage-no-birthday-modal-overlay" @click.self="handleClose">
    <div class="underage-no-birthday-modal">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-content">
        <h3>{{ t('home.underageNoBirthday.title') }}</h3>
        <p>{{ t('home.underageNoBirthday.description') }}</p>
      </div>
      <div class="modal-footer">
        <span class="modal-btn cancel" @click="handleClose">{{ t('home.underageNoBirthday.cancel') }}</span>
        <span class="modal-btn confirm" @click="handleGoToFill">{{ t('home.underageNoBirthday.goToFill') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
  goToFill: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleGoToFill = () => {
  emit('goToFill');
};
</script>

<style scoped lang="scss">
.underage-no-birthday-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.underage-no-birthday-modal {
  position: relative;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  width: 500px;
  padding: 36px;
  overflow: hidden;

  .modal-close {
    background: none;
    border: none;
    padding: 0;
    position: absolute;
    right: 12px;
    top: 16px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-content {
    text-align: center;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #161122;
      margin: 0 0 16px;
    }

    p {
      font-size: 14px;
      color: #5b5566;
      line-height: 20px;
      margin: 0;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-top: 32px;

    .modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 136px;
      height: 48px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;

      &.cancel {
        background: rgba(22, 17, 34, 0.06);
        color: #5b5566;

        &:hover {
          color: #FF4D8D;
        }
      }

      &.confirm {
        background: #FF4D8D;
        color: #ffffff;

        &:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }
    }
  }
}
</style>
