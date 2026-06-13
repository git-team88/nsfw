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
  border-radius: 1.2rem;
  width: 44rem;
  z-index: 510;
  display: flex;
  flex-direction: column;
  padding: 2rem 3rem 3rem;
  box-sizing: border-box;
}

.logo {
  width: 16.4rem;
  height: 3.8rem;
}

.modal-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.modal-header {
  width: 100%;
  margin-top: 2rem;
  font-weight: bold;
  font-size: 2rem;
  color: #101828;
}

.modal-description {
  font-size: 1.6rem;
  color: #99A1AF;
}

.input-section {
  width: 100%;
  margin-top: 3rem;
}

.invite-code-input {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 5rem;
  padding: 0 1.6rem;
  border: 1px solid #F5F5F5;
  border-radius: 0.8rem;
  font-size: 1.6rem;
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
  margin-top: 1rem;
}

.error-message {
  font-size: 1.4rem;
  color: #FA2D47;
}

.modal-footer {
  width: 100%;
  padding-top: 2rem;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 5rem;
  background: #FB64B6;
  border-radius: 0.8rem;
  color: #ffffff;
  font-size: 1.4rem;
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
  height: 5rem;
  margin-top: 1rem;
  background: #F5F5F5;
  border-radius: 0.8rem;
  color: #6A7282;
  font-size: 1.4rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background: #E8E8E8;
}
</style>