<template>
  <div class="unlimited-mode-modal-overlay" @click.self="handleClose">
    <div class="unlimited-mode-modal">
      <div class="modal-corner-deco"></div>

      <button class="modal-close" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="modal-badge">
        <span class="badge-icon">⚡</span>
        UNLIMITED
      </div>

      <div class="modal-header">
        <h3>{{ t('home.unlimitedMode.title') }}</h3>
      </div>

      <div class="modal-content">
        <p v-html="t('home.unlimitedMode.description')"></p>
      </div>

      <div class="modal-check">
        <input type="checkbox" v-model="isCheck" class="modal-checkbox" />
        <span @click="isCheck = !isCheck">{{ t("submit.sensitiveDontAsk") }}</span>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="handleClose">{{ t('home.unlimitedMode.cancel') }}</button>
        <button class="modal-btn confirm" @click="handleConfirm">{{ t('home.unlimitedMode.confirm') }}</button>
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
  dontAsk: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  if (isCheck.value) {
    localStorage.setItem('unlimitedDontAsk', '1');
  }
  emit('confirm');
};
</script>

<style scoped lang="scss">
$ink: #161122;
$paper: #FFFDF7;
$pink: #FF4D8D;
$sub: #5b5566;
$muted: #9a93a4;
$line: #e7e1d8;
$yellow: #FFD23F;

@keyframes modalFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.94) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.unlimited-mode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFade 0.18s ease-out both;
}

.unlimited-mode-modal {
  position: relative;
  background: $paper;
  border: 3px solid $ink;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.18);
  border-radius: 18px;
  width: min(400px, 92%);
  padding: 22px 24px;
  overflow: hidden;
  animation: modalPop 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;

  .modal-corner-deco {
    position: absolute;
    right: 0;
    top: 0;
    width: 120px;
    height: 120px;
    pointer-events: none;
    border-radius: 0 14px 0 0;
    background-image: radial-gradient($ink 1px, transparent 1px);
    background-size: 8px 8px;
    opacity: 0.07;
    -webkit-mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
    mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
  }

  .modal-close {
    background: #fff;
    border: 2px solid $ink;
    border-radius: 999px;
    padding: 6px;
    position: absolute;
    right: 14px;
    top: 14px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 2px 2px 0 $ink;
    transition: transform 0.16s;

    &:hover {
      transform: scale(1.1);
    }
  }

  .modal-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    font-size: 11px;
    border-radius: 999px;
    padding: 3px 12px;
    background: $yellow;
    color: $ink;
    border: 2px solid $ink;
    letter-spacing: 0.06em;
    margin-bottom: 12px;

    .badge-icon {
      font-size: 13px;
    }
  }

  .modal-header {
    h3 {
      font-size: 19px;
      font-weight: 800;
      color: $ink;
      margin: 0;
    }
  }

  .modal-content {
    margin: 10px 0 0;
    p {
      font-size: 13px;
      font-weight: 600;
      color: $ink;
      line-height: 1.75;
      margin: 0;
      opacity: 0.7;
    }
  }

  .modal-check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    cursor: pointer;

    .modal-checkbox {
      width: 16px;
      height: 16px;
      accent-color: $pink;
      cursor: pointer;
    }

    span {
      font-size: 12.5px;
      font-weight: 800;
      color: $ink;
      opacity: 0.65;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;

    .modal-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: auto;
      border: 2px solid $ink;
      border-radius: 12px;
      box-shadow: 2px 2px 0 $ink;
      font-weight: 800;
      font-size: 14px;
      padding: 11px 10px;
      cursor: pointer;
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s;

      &:hover {
        transform: translate(-1px, -2px);
        box-shadow: 4px 5px 0 rgba(22, 17, 34, 0.4);
      }

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0 rgba(22, 17, 34, 0.4);
      }

      &.cancel {
        background: #fff;
        color: $ink;

        &:hover {
          color: $pink;
        }
      }

      &.confirm {
        background: $pink;
        color: #fff;

        &:disabled {
          background: #f8d7e8;
          cursor: not-allowed;
        }
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .unlimited-mode-modal-overlay {
    animation: modalFade 0.16s ease-out both;
  }
  .unlimited-mode-modal {
    animation: modalFade 0.16s ease-out both;
  }
  .unlimited-mode-modal .modal-footer .modal-btn {
    transition: none;
    &:hover, &:active {
      transform: none;
    }
  }
}
</style>
