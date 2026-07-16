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
  z-index: 1100;

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
    width: 500px;
    background-color: #ffffff;
    border-radius: 14px;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    padding: 32px;
    text-align: center;

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #161122;
      margin-bottom: 24px;
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
      opacity: 0.65;
      line-height: 1.8;
      margin-bottom: 34px;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 24px;

      button {
        min-width: 136px;
        height: 48px;
        border: 2px solid #161122;
        border-radius: 14px;
        font-size: 14px;
        cursor: pointer;
      }

      .cancel-btn {
        background: #FFFFFF;
        color: #161122;
        box-shadow: 2px 2px 0 #161122;
        font-weight: 800;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

        &:hover {
          border-color: #FF4D8E;
          color: #FF4D8E;
        }
      }

      .confirm-btn {
        background: linear-gradient(135deg, #FF4D8D, #FF7A45);
        color: #ffffff;
        box-shadow: 2px 2px 0 #161122;
        font-weight: 800;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 #161122;
        }
      }
    }
  }
}
</style>