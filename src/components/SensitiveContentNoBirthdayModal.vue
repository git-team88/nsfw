<template>
  <div class="sensitive-content-no-birthday-modal-overlay" @click.self="handleClose">
    <div class="sensitive-content-no-birthday-modal">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt=""
        @click="handleClose"
      />

      <div class="modal-content">
        <h3>{{ t('home.sensitiveContentNoBirthday.title') }}</h3>
        <p>{{ t('home.sensitiveContentNoBirthday.description') }}</p>
      </div>
      <div class="modal-footer">
        <span class="modal-btn cancel" @click="handleClose">{{ t('home.sensitiveContentNoBirthday.cancel') }}</span>
        <span class="modal-btn confirm" @click="handleGoToFill">{{ t('home.sensitiveContentNoBirthday.goToFill') }}</span>
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
.sensitive-content-no-birthday-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sensitive-content-no-birthday-modal {
  position: relative;
  background: #FFFFFF;
  border-radius: 1.2rem;
  width: 50rem;
  padding: 3.6rem;
  overflow: hidden;

  .modal-close {
    position: absolute;
    right: 1.2rem;
    top: 1.6rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-content {
    text-align: center;

    h3 {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin: 0 0 1.6rem;
    }

    p {
      font-size: 1.4rem;
      color: #6A7282;
      line-height: 2rem;
      margin: 0;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
    margin-top: 3.2rem;

    .modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;

      &.cancel {
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #FB64B6;
        }
      }

      &.confirm {
        background: #FB64B6;
        color: #ffffff;

        &:hover:not(:disabled) {
          position: relative;
          &::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>