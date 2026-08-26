<template>
  <div class="invite-code-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-btn" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="modal-header">
        <h3>{{ t('inviteCode.title') }}</h3>
      </div>

      <div class="modal-body">
        <p class="modal-description">{{ t('inviteCode.enterCode') }}</p>
        <div class="input-section">
          <input
            v-model="inviteCode"
            type="text"
            class="invite-code-input"
            maxlength="4"
            spellcheck="false"
            :placeholder="t('inviteCode.enterCode')"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="confirm-btn" @click="confirm">{{ t('inviteCode.confirm') }}</button>
        <span class="skip-link" @click="skip">{{ t('inviteCode.noCode') }} →</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from '@/util/toast';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialCode: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'confirm', 'skip']);

const inviteCode = ref('');

watch(() => props.initialCode, (newCode) => {
  if (newCode) {
    inviteCode.value = newCode;
  }
}, { immediate: true });

const close = () => {
  inviteCode.value = props.initialCode;

  emit('close');
};

const confirm = () => {
  if (!inviteCode.value) {
    toast(t('inviteCode.enterCode'));
    return false;
  }

  if (inviteCode.value) {
    localStorage.setItem('invite_code', inviteCode.value);
  }
  emit('confirm', inviteCode.value);
};

const skip = () => {
  emit('skip');
};
</script>

<style lang="scss" scoped>
.invite-code-modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 500;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  width: 480px;
  max-width: 90vw;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}

.close-btn {
  background: none;
  border: none;
  padding: 0;
  position: absolute;
  top: 14px;
  right: 16px;
  width: 28px;
  height: 28px;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background: #1a1a1a;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  padding: 0;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-body {
  width: 100%;
  padding: 16px 32px 24px;
}

.modal-header {
  width: 100%;
  padding: 20px 32px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    font-size: 22px;
    font-weight: 800;
    color: #f5f5f5;
    margin: 0;
  }
}

.modal-description {
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin: 0 0 12px;
}

.input-section {
  width: 100%;
}

.invite-code-input {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 13px 15px;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 600;
  color: #f5f5f5;
  outline: none;
  background: #1a1a1a;
  box-sizing: border-box;
  transition: box-shadow 0.18s;
}

.invite-code-input:focus {
  box-shadow: none;
}

.invite-code-input::placeholder {
  color: #777;
}

.modal-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 32px 24px;
}

.confirm-btn {
  width: 100%;
  border: 1px solid #ff9aca;
  border-radius: 13px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  color: #f5f5f5;
  font-size: 16px;
  font-weight: 800;
  padding: 14px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }

  &:active {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
}

.skip-link {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #f5f5f5;
  opacity: 0.55;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
}
</style>
