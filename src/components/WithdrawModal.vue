<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal withdraw-modal">
      <button class="modal-close" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
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
          <a href="#">{{ t("subscribe.paymentTerms") }}</a>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.modal {
  width: 500px;
  padding: 18px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  position: relative;
}

.modal-close {
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
  font-size: 20px;
  color: #aaa;
  margin-bottom: 30px;
  font-weight: 600;
  text-align: center;
}

.modal-amount {
  font-size: 32px;
  color: #f5f5f5;
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
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;

  &:hover:not(:disabled) {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }
  &:active {
    box-shadow: 0 0 20px rgba(255, 50,140, 0.5);
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
  color: #777;
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
    color: #ff4f9a;
    text-decoration: none;
    margin-left: 4px;
    pointer-events: none;
  }
}
</style>