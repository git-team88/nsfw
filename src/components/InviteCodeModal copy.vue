<template>
  <div class="invite-code-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <img class="logo" src="@/assets/images/register/logo.png" alt="MoeGen" />

      <div class="modal-header">
      {{ t('inviteCode.title') }}
      </div>

      <div class="modal-body">
        <p class="modal-description">{{ t('inviteCode.enterCode') }}</p>
        <div class="input-section">
          <input
            v-model="inviteCode"
            type="text"
            class="invite-code-input"
            spellcheck="false"
            :placeholder="t('inviteCode.title')"
          />
        </div>
        <div class="error-container" v-if="errorMessage">
          <p class="error-message">{{ errorMessage }}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="confirm-btn" @click="confirm">{{ t('inviteCode.confirm') }}</button>
        <button class="skip-btn" @click="skip">{{ t('inviteCode.noCode') }}{{ t('inviteCode.skip') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from '@/util/toast';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';

const { t, locale } = useI18n();

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

const emit = defineEmits(['confirm', 'skip']);

const inviteCode = ref('');
const errorMessage = ref('');

watch(() => props.initialCode, (newCode) => {
  if (newCode) {
    inviteCode.value = newCode;
  }
}, { immediate: true });

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    errorMessage.value = '';
  }
});

const confirm = async () => {
  if (!inviteCode.value) {
    errorMessage.value = t('inviteCode.inviteError');
    return;
  }

  try {
    const data = await api.checkCode({ referral_code: inviteCode.value }) as any;

    if (data.code == 0 || data.code == 200) {
      emit('confirm', inviteCode.value);
    } else {
      errorMessage.value = locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp;
    }
  } catch (error) {
    errorMessage.value = t('inviteCode.inviteError');
  }
};

const skip = () => {
  emit('skip');
};
</script>

<style scoped>
.invite-code-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.modal-content {
  position: relative;
  background-color: #FFFFFF;
  border-radius: 12px;
  width: 440px;
  z-index: 510;
  display: flex;
  flex-direction: column;
  padding: 20px 30px 30px;
  box-sizing: border-box;
}

.logo {
  width: 164px;
  height: 38px;
}

.modal-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.modal-header {
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
  font-size: 20px;
  color: #101828;
}

.modal-description {
  font-size: 16px;
  color: #99A1AF;
}

.input-section {
  width: 100%;
  margin-top: 30px;
}

.invite-code-input {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 1px solid #F5F5F5;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  color: #101828;
  outline: none;
  background: #F5F5F5;
}

.invite-code-input:focus {
  border-color: #FB64B6;
}

.invite-code-input::placeholder {
  color: #99A1AF;
  font-weight: normal;
}

.error-container {
  width: 100%;
  margin-top: 10px;
}

.error-message {
  font-size: 14px;
  color: #FA2D47;
}

.modal-footer {
  width: 100%;
  padding-top: 20px;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  background: #FB64B6;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  border: 1px solid #F5F5F5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled),
.confirm-btn:active:not(:disabled) {
  position: relative;

  &::after{
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
  }
}

.confirm-btn:disabled {
  background: rgba(251, 100, 182, 0.5);
  cursor: not-allowed;
}

.skip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  margin-top: 10px;
  background: #F5F5F5;
  border-radius: 8px;
  color: #6A7282;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background: #E8E8E8;
}
</style>