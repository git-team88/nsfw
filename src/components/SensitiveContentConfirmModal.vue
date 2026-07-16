<template>
  <div class="sensitive-content-confirm-modal-overlay" @click.self="handleClose">
    <div class="sensitive-content-confirm-modal">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3>{{ t('home.sensitiveContentConfirm.title') }}</h3>
      </div>
      <div class="modal-content">
        <p v-html="t('home.sensitiveContentConfirm.description')"></p>
      </div>
      <div class="modal-footer">
        <span class="modal-btn cancel" @click="handleClose">{{ t('home.sensitiveContentConfirm.cancel') }}</span>
        <span class="modal-btn confirm" @click="handleConfirm">{{ t('home.sensitiveContentConfirm.confirm') }}</span>
      </div>

      <div class="modal-check" v-if="!hideDontAsk">
        <div @click="isCheck = !isCheck">
          <img src="@/assets/images/register/check_active.png" alt="" v-if="isCheck" />
          <img src="@/assets/images/register/check.png" alt="" v-else />
        </div>
        <span @click="isCheck = !isCheck">{{ t('home.sensitiveContentConfirm.dontAsk') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  hideDontAsk?: boolean;
}>();

const isCheck = ref(false);

const emit = defineEmits<{
  close: [];
  confirm: [];
  dontAsk: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  if (isCheck.value) {
    localStorage.setItem('sensitiveContentDontAsk', '1');
  }
  emit('confirm');
};
</script>

<style scoped lang="scss">
.sensitive-content-confirm-modal-overlay {
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

.sensitive-content-confirm-modal {
  position: relative;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  width: 500px;
  padding: 20px 36px;
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

  .modal-header {
    display: flex;
    justify-content: center;
    align-items: center;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #161122;
      margin: 0;
    }
  }

  .modal-content {
    margin: 34px 0;
    text-align: center;

    p {
      font-size: 14px;
      color: #5b5566;
      line-height: 24px;
      margin: 0;
    }
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
</style>
