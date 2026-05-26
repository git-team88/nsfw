<template>
  <div class="switch-collection-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-title">{{ t('collection.switchConfirm.title') }}</div>
      <div class="modal-message">
        <p>{{ t('collection.switchConfirm.message') }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="handleCancel">{{ t('collection.switchConfirm.cancel') }}</button>
        <button class="confirm-btn" @click="handleConfirm">{{ t('collection.switchConfirm.confirm') }}</button>
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
.switch-collection-modal {
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
    padding: 3.2rem;
    text-align: center;

    .modal-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: #364153;
      margin-bottom: 2.4rem;
    }

    .modal-message {
      font-size: 1.4rem;
      color: #6A7282;
      line-height: 1.8;
      margin-bottom: 3.4rem;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 2.4rem;

      button {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
      }

      .cancel-btn {
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .confirm-btn {
        background: #fb64b6;
        color: #ffffff;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
}
</style>