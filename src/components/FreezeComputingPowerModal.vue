<template>
  <div v-if="visible" class="freeze-computing-power-modal">
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ t('novel.freezeComputingPower.title') }}</h3>

      <div class="freeze-power-info">
        <span class="info-label">{{ t('novel.freezeComputingPower.label') }}</span>
        <span class="info-value">{{ estimatedPower }}</span>
      </div>

      <div class="modal-rules" v-html="t('novel.freezeComputingPower.rules')">
      </div>

      <div class="modal-footer">
        <span class="modal-btn cancel" @click="handleCancel">{{ t('novel.cancel') }}</span>
        <span class="modal-btn confirm" @click="handleConfirm">{{ t('novel.iKnow') }}</span>
      </div>

      <div class="modal-check">
        <div @click="dontShowAgain = !dontShowAgain">
          <img src="@/assets/images/register/check_active.png" alt="" v-if="dontShowAgain" />
          <img src="@/assets/images/register/check.png" alt="" v-else />
        </div>
        <span @click="dontShowAgain = !dontShowAgain">{{ t('novel.freezeComputingPower.dontShowAgain') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  estimatedPower: number;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const dontShowAgain = ref(false);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    dontShowAgain.value = false;
  }
});

const handleClose = () => {
  emit('cancel');
};

const handleCancel = () => {
  emit('cancel');
};

const handleConfirm = () => {
  if (dontShowAgain.value) {
    localStorage.setItem('hideFreezeComputingPowerModal', '1');
  }
  emit('confirm');
};
</script>

<style scoped lang="scss">
.freeze-computing-power-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: relative;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    border-radius: 18px;
    width: 500px;
    padding: 18px 36px 24px;
    overflow: hidden;

    .close-btn {
      position: absolute;
      right: 14px;
      top: 14px;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #1a1a1a;
      border: 1px solid #3d3d3d;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 6px;
      transition: transform .2s;

      &:hover { transform: scale(1.1) rotate(90deg); }
    }

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 24px;
      text-align: center;
    }

    .freeze-power-info {
      display: flex;
      align-items: baseline;
      margin-bottom: 10px;
      font-size: 14px;

      .info-label {
        color: #f5f5f5;
      }

      .info-value {
        color: #ff4f9a;
      }
    }

    .modal-rules {
      margin-bottom: 24px;
      font-size: 14px;
      color: #aaa;
      line-height: 20px;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;

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
          background: rgba(255, 255, 255, 0.06);
          color: #aaa;

          &:hover {
            color: #ff4f9a;
          }
        }

        &.confirm {
          background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
          color: #f5f5f5;

          &:hover:not(:disabled) {
            box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
          }
          &:active {
            box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
          }
        }
      }
    }

    .modal-check {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
      cursor: pointer;

      img {
        width: 24px;
        height: 24px;
      }

      span {
        font-size: 14px;
        color: #aaa;
      }
    }
  }
}
</style>
