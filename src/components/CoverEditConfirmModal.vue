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
  background-color: rgba(0,0,0,0.5);
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
    background-color: #1a1a1a;
    border: 1px solid #3d3d3d;
    border-radius: 18px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    padding: 24px;

    .modal-body {
      margin-bottom: 34px;

      .modal-message {
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        color: #aaa;
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
        border: 1px solid #3d3d3d;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: none;
      }

      .cancel-btn {
        background: #1a1a1a;
        color: #f5f5f5;

        &:hover {
          color: #ff4f9a;
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }

      .exit-btn {
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #ffffff;

        &:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }
    }
  }
}
</style>