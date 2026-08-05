<template>
  <div v-if="visible" class="freeze-computing-power-modal">
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: relative;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    border-radius: 12px;
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
      background: #fff;
      border: 2px solid #161122;
      box-shadow: 2px 2px 0 #161122;
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
      color: #161122;
      margin-bottom: 24px;
      text-align: center;
    }

    .freeze-power-info {
      display: flex;
      align-items: baseline;
      margin-bottom: 10px;
      font-size: 14px;

      .info-label {
        color: #161122;
      }

      .info-value {
        color: #FF4D8D;
      }
    }

    .modal-rules {
      margin-bottom: 24px;
      font-size: 14px;
      color: #5b5566;
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
        color: #5b5566;
      }
    }
  }
}
</style>
