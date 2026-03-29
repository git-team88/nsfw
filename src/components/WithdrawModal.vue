<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal withdraw-modal">
      <button class="modal-close" @click="$emit('close')">
        <img src="@/assets/images/base/close.png" alt="Close" />
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
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.modal {
  width: 50rem;
  padding: 1.8rem;
  border-radius: 1.2rem;
  background: #ffffff;
  position: relative;
}

.modal-close {
  position: absolute;
  right: 1.4rem;
  top: 1.6rem;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1;

  img {
    width: 2rem;
    height: 2rem;
  }
}

.modal-title {
  font-size: 2rem;
  color: #99A1AF;
  margin-bottom: 3rem;
  font-weight: 500;
  text-align: center;
}

.modal-amount {
  font-size: 3.2rem;
  color: #364153;
  font-weight: 500;
  text-align: center;
}

.modal-confirm {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24rem;
  height: 4.8rem;
  margin: 3rem auto 1.2rem;
  border: none;
  border-radius: 0.8rem;
  background: #FB64B6;
  color: #ffffff;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover:not(:disabled) {
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

.modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-agree {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
  color: #99A1AF;
  font-size: 1.4rem;
}

.check-btn {
  width: 2.4rem;
  height: 2.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-btn img {
  width: 2.4rem;
  height: 2.4rem;
}

.modal-agree span {
  a {
    color: #fb64b6;
    text-decoration: none;
    margin-left: 0.4rem;
  }
}
</style>