<template>
  <div v-if="visible" class="cover-edit-confirm-modal" @click="$emit('cancel')">
    <div class="cover-edit-confirm-content" @click.stop>
      <div class="modal-body">
        <p class="modal-message">{{ t('submit.cover.exitWarning') }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('cancel')">{{ t('submit.cover.cancel') }}</button>
        <button class="exit-btn" @click="$emit('confirm')">{{ t('submit.cover.exit') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(["cancel", "confirm"]);
const { t } = useI18n();
</script>

<style scoped lang="scss">
.cover-edit-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .cover-edit-confirm-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 24px;

    .modal-body {
      margin-bottom: 34px;

      .modal-message {
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        color: #6A7282;
        margin: 0;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 24px;

      .cancel-btn, .exit-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .cancel-btn {
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .exit-btn {
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
}
</style>