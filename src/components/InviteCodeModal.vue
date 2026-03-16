<template>
  <div class="invite-code-modal" v-if="visible">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="close" />

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
        <div class="skip-link" @click="skip">{{ t('inviteCode.noCode') }}→</div>
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
    console.log(t('inviteCode.inviteError'))
    toast(t('inviteCode.inviteError'));
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
  background-color: #ffffff;
  border-radius: 1.6rem;
  width: 52rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.close-btn {
  position: absolute;
  top: 2rem;
  right: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-body {
  width: 100%;
  padding: 1.8rem 2.4rem;
}

.modal-header {
  width: 100%;
  padding: 1.8rem 2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);

  h3 {
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
    margin: 0;
  }
}

.modal-description {
  font-size: 1.4rem;
  color: #4A5565;
  margin: 0 0 1.2rem;
}

.input-section {
  width: 100%;
}

.invite-code-input {
  display: flex;
  align-items: center;
  width: 100%;
  height: 5rem;
  padding: 1rem;
  border: 1px solid rgba(251,100,182,0.2);
  border-radius: 0.8rem;
  font-size: 1.4rem;
  font-weight: 500;
  color: #101828;
  outline: none;
  background: rgba(255,255,255,0.9);
}

.invite-code-input:focus {
  border-color: #fb64b6;
}

.invite-code-input::placeholder {
  color: #99A1AF;
}

.modal-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.8rem 0;
  border-top: 1px solid rgba(251,100,182,0.2);
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24rem;
  height: 4.8rem;
  margin: 0 auto;
  background: #fb64b6;
  border-radius: 0.8rem;
  color: #ffffff;
  font-size: 1.4rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.skip-link {
  text-align: center;
  font-size: 1.2rem;
  color: #6A7282;
  cursor: pointer;
}
</style>