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
  width: 500px;
  padding: 18px 36px;
  background: #ffffff;
  border-radius: 14px;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  overflow: hidden;

  .close-btn {
    position: absolute;
    top: 20px;
    right: 18px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    .title {
      font-size: 16px;
      font-weight: 800;
      color: #161122;
    }
  }

  .tip {
    margin-top: 12px;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #161122;
    opacity: 0.4;
  }

  .desc {
    font-size: 14px;
    color: #161122;
    font-weight: 700;
    margin: 18px 0 24px;
    line-height: 20px;
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
      color: #161122;
      opacity: 0.65;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 24px;

    button {
      min-width: 136px;
      height: 48px;
      -webkit-border-radius: 14px;
      border-radius: 14px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-cancel {
      background: #ffffff;
      color: #161122;
      border: 2px solid #161122;
      box-shadow: 2px 2px 0 #161122;
      font-weight: 800;

      &:hover {
        border-color: #FF4D8E;
        color: #FF4D8E;
      }
    }
    .btn-confirm {
      border: 2px solid #161122;
      background: linear-gradient(135deg, #FF4D8D, #FF7A45);
      color: #ffffff;
      box-shadow: 2px 2px 0 #161122;
      font-weight: 800;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 3px 3px 0 #161122;
      }
    }
  }
}
</style>
