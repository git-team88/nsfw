<template>
  <div class="delete-record-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleClose" />

      <div class="modal-title">{{ t('recordList.deleteConfirm') }}</div>
      <div class="modal-tip">{{ t('recordList.deleteWarning') }}</div>
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="btn btn-confirm" @click="handleConfirm">{{ t('recordList.delete') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DeleteRecordModal">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'confirm']);

function handleClose() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style lang="scss">
.delete-record-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
    padding: 3.2rem 2.4rem 2.4rem;

    .close-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin-bottom: 1.6rem;
      text-align: center;
    }

    .modal-tip {
      font-size: 1.4rem;
      color: #99A1AF;
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

      .btn-cancel {
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }
      .btn-confirm {
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
            background: rgba(255, 255, 255, 0.1);
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>