<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <img class="close-btn" src="../assets/images/base/close.png" alt="" @click="emitCancel" />

      <div class="modal-header">
        <span class="title">{{ t("submit.sensitiveConfirmTitle") }}</span>
      </div>

      <div class="tip">{{ t("submit.sensitiveTip") }}</div>

      <div class="desc">{{ t("submit.sensitiveConfirmText") }}</div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="emitCancel">{{ t("submit.cancelBtn") }}</button>
        <button class="btn btn-confirm" @click="emitConfirm">{{ t("submit.confirmBtn") }}</button>
      </div>

      <div class="modal-check">
        <div @click="isCheck = !isCheck">
          <img src="@/assets/images/register/check_active.png" alt="" v-if="isCheck" />
          <img src="@/assets/images/register/check.png" alt="" v-else />
        </div>

        <span @click="isCheck = !isCheck">{{ t("submit.sensitiveDontAsk") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SensitiveConfirmModal">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "confirm", dontAsk: boolean): void;
  (e: "cancel"): void;
  (e: "dontAsk"): void;
}>();
const { t, locale } = useI18n();

const localDontAsk = ref(false);
const isCheck = ref(false);

function emitCancel() {
  emit("update:visible", false);
  emit("cancel");
  localDontAsk.value = false;
  isCheck.value = false;
}
function emitConfirm() {
  if (isCheck.value == true) {
    localStorage.setItem('sensitiveDontAsk', '1');
  }

  emit("confirm", isCheck.value);
  emit("update:visible", false);
  localDontAsk.value = false;
  isCheck.value = false;
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-content {
  position: relative;
  width: 50rem;
  padding: 1.8rem 3.6rem;
  background: #ffffff;
  border-radius: 1.2rem;
  overflow: hidden;

  .close-btn {
    position: absolute;
    top: 2rem;
    right: 1.8rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    .title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
    }
  }

  .tip {
    margin-top: 1.2rem;
    font-size: 1.2rem;
    line-height: 1.8rem;
    text-align: center;
    color: #99a1af;
  }

  .desc {
    font-size: 1.4rem;
    color: #364153;
    margin: 1.8rem 0 2.4rem;
    line-height: 2rem;
  }

  .modal-check {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1.2rem;
    cursor: pointer;

    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #6a7282;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 2.4rem;

    button {
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #6A7282;

      &:hover {
        color: #fb64b6;
      }
    }
    .btn-confirm {
      border: none;
      background: #fb64b6;
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
</style>
