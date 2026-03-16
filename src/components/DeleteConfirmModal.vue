<template>
  <div class="delete-confirm-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleCancel" />

      <div class="modal-message">
        <p>{{ t('deleteConfirm.message') }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="handleCancel">{{ t('deleteConfirm.cancel') }}</button>
        <button class="confirm-btn" @click="handleConfirm">{{ t('deleteConfirm.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function handleCancel() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style scoped lang="scss">
.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50rem;
    background-color: #ffffff;
    border-radius: 1.2rem;
    padding: 5.4rem 2.4rem 2.4rem;

    .close-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-message {
      font-size: 1.4rem;
      color: #364153;
      margin-bottom: 3.4rem;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 2.4rem;

      button {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
      }

      .cancel-btn {
        border: 1px solid #fb64b6;
        background: none;
        color: #fb64b6;

        &:hover {
          background: rgba(251, 100, 182, 0.06);
        }
      }
      .confirm-btn {
        border: none;
        background: #fb64b6;
        color: #ffffff;

        &:hover {
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
      }
    }
  }
}
</style>