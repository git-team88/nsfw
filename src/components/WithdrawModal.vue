<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal withdraw-modal">
      <button class="modal-close" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
      <div class="modal-title">{{ t("user.revenue.totalWithdrawable") }}</div>
      <div class="modal-amount">{{ totalWithdrawable != null ? `${formatSci(totalWithdrawable)}` : "--" }}</div>
      <div class="modal-confirm" @click="handleConfirm" :disabled="!agreeTerms">
        {{ t("user.revenue.confirmWithdraw") }}
      </div>
      <div class="modal-agree">
        <div class="check-btn" @click="toggleAgree">
          <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="Checked" />
          <img v-else src="@/assets/images/register/check.png" alt="Unchecked" />
        </div>

        <span>
          {{ t("subscribe.agree") }}
          <a href="#" @click.prevent="openLink">{{ t("subscribe.paymentTerms") }}</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="WithdrawModal">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  totalWithdrawable: number | null;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

// State
const agreeTerms = ref(true);

// Methods
function toggleAgree() {
  agreeTerms.value = !agreeTerms.value;
}

function handleConfirm() {
  if (!agreeTerms.value) return;
  emit('confirm');
}

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}

function openLink() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.modal {
  width: 500px;
  padding: 18px;
  border-radius: 12px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  position: relative;
}

.modal-close {
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
  font-size: 20px;
  color: #364153;
  margin-bottom: 30px;
  font-weight: 600;
  text-align: center;
}

.modal-amount {
  font-size: 32px;
  color: #161122;
  font-weight: 600;
  text-align: center;
}

.modal-confirm {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 48px;
  margin: 30px auto 12px;
  border: 2.5px solid #161122;
  border-radius: 8px;
  background: #FF4D8D;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;

  &:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(0, 0);
    box-shadow: 2px 2px 0 #161122;
  }
}

.modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-agree {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: #9a93a4;
  font-size: 14px;
}

.check-btn {
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-btn img {
  width: 24px;
  height: 24px;
}

.modal-agree span {
  a {
    color: #FF4D8D;
    text-decoration: none;
    margin-left: 4px;
    pointer-events: none;
  }
}
</style>
