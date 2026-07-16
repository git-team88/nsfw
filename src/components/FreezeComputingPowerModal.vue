<template>
  <div v-if="visible" class="freeze-computing-power-modal">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleClose" />

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
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: relative;
    background: #FFFFFF;
    border-radius: 12px;
    width: 500px;
    padding: 18px 36px 24px;
    overflow: hidden;

    .close-btn {
      position: absolute;
      right: 12px;
      top: 16px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 500;
      color: #364153;
      margin-bottom: 24px;
      text-align: center;
    }

    .freeze-power-info {
      display: flex;
      align-items: baseline;
      margin-bottom: 10px;
      font-size: 14px;

      .info-label {
        color: #364153;
      }

      .info-value {
        color: #FB64B6;
      }
    }

    .modal-rules {
      margin-bottom: 24px;
      font-size: 14px;
      color: #6A7282;
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
          background: #F5F5F5;
          color: #6A7282;

          &:hover {
            color: #FB64B6;
          }
        }

        &.confirm {
          background: #FB64B6;
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
        color: #6a7282;
      }
    }
  }
}
</style>
