<template>
  <div v-if="visible" class="mode-switch-warning-modal" @click="$emit('cancel')">
    <div class="mode-switch-warning-content" @click.stop>
      <div class="modal-body">
        <p class="modal-message">{{ t(messageKey) }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('cancel')">{{ t('cancel') }}</button>
        <button class="confirm-btn" @click="$emit('confirm')">{{ t('confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// variant 决定弹哪条文案：
//   files  切模型版本，多模态 / 视频编辑 / 视频续写（参考文件 + 引用）
//   images 切模型版本，首尾帧（只有图片）
//   mode   切视频模式（参考文件不跨模式带）
const props = withDefaults(defineProps<{
  visible: boolean;
  variant?: 'files' | 'images' | 'mode';
}>(), { variant: 'files' });

const messageKey = computed(() => {
  if (props.variant === 'images') return 'home.modeSwitch.imageNotSupported';
  if (props.variant === 'mode') return 'home.modeSwitch.modeChangeFiles';
  return 'home.modeSwitch.fileNotSupported';
});

defineEmits(["cancel", "confirm"]);
const { t } = useI18n();
</script>

<style scoped lang="scss">
.mode-switch-warning-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .mode-switch-warning-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-width: calc(100vw - 40px);
    background-color: #ffffff;
    border-radius: 12px;
    padding: 24px;

    .modal-body {
      margin-bottom: 34px;

      .modal-message {
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        color: #5b5566;
        margin: 0;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 24px;

      .cancel-btn,
      .confirm-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 2px 2px 0 #161122;
      }

      .cancel-btn {
        background: #ffffff;
        color: #161122;

        &:hover {
          color: #ff4d8d;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }

      .confirm-btn {
        background: #ff4d8d;
        color: #ffffff;

        &:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }
    }
  }
}
</style>
