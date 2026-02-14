<template>
  <div class="unlimited-mode-modal-overlay" @click.self="handleClose">
    <div class="unlimited-mode-modal">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt=""
        @click="handleClose"
      />

      <div class="modal-header">
        <h3>{{ t('home.unlimitedMode.title') }}</h3>
      </div>
      <div class="modal-content">
        <p>{{ t('home.unlimitedMode.description') }}</p>
      </div>
      <div class="modal-footer">
        <span class="modal-btn cancel" @click="handleClose">{{ t('home.unlimitedMode.cancel') }}</span>
        <span class="modal-btn confirm" @click="handleConfirm">{{ t('home.unlimitedMode.confirm') }}</span>
      </div>

      <div class="modal-check">
        <div @click="isCheck = !isCheck">
          <img src="@/assets/images/register/check_active.png" alt="" v-if="isCheck" />
          <img src="@/assets/images/register/check.png" alt="" v-else />
        </div>

        <span>{{ t("submit.sensitiveDontAsk") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const isCheck = ref(false);

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped lang="scss">
.unlimited-mode-modal-overlay {
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

.unlimited-mode-modal {
  position: relative;
  background: #FFFFFF;
  border-radius: 1.2rem;
  width: 50rem;
  padding: 1.8rem 3.6rem;
  overflow: hidden;

  .modal-close {
    position: absolute;
    right: 1.2rem;
    top: 1.6rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-header {
    display: flex;
    justify-content: center;
    align-items: center;

    h3 {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin: 0;
    }
  }

  .modal-content {
    margin: 2.4rem 0;
    p {
      font-size: 1.4rem;
      color: #364153;
      line-height: 2rem;
      margin: 0;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;

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
        border: 1px solid #fb64b6;
        background: none;
        color: #fb64b6;

        &:hover {
          background: rgba(251, 100, 182, 0.06);
        }
      }

      &.confirm {
        background: #fb64b6;
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
            background: rgba(255, 255, 255, 0.2);
            z-index: 1;
          }
        }

        &:disabled {
          background: #f8d7e8;
          color: white;
          cursor: not-allowed;
        }
      }
    }
  }

  .modal-check {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1.2rem;
    cursor: pointer;

    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #6a7282;
    }
  }
}
</style>