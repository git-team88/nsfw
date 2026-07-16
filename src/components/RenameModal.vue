<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="handleOverlayClick"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3 class="modal-title">{{ t('myProjects.renameModal.title') }}</h3>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <div class="label-with-counter">
            <label for="project-name">{{ t('myProjects.renameModal.workTitle') }}</label>
            <span class="char-counter">{{ newName.length }}/60</span>
          </div>
          <div class="input-container">
            <input
              type="text"
              id="project-name"
              v-model="newName"
              class="input-field"
              :placeholder="t('myProjects.renameModal.enterNewTitle')"
              spellcheck="false"
              maxlength="60"
            />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel-btn" @click="handleClose">{{ t('myProjects.renameModal.cancel') }}</button>
        <button class="btn confirm-btn" @click="handleConfirm">{{ t('myProjects.renameModal.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RenameModal">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from '@/util/toast';

const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  projectId: string | number;
  currentName: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', newName: string): void;
}>();

const newName = ref('');

watch(() => props.currentName, (newVal) => {
  newName.value = newVal;
}, { immediate: true });

function handleClose() {
  emit('close');
}

function handleConfirm() {
  if (!newName.value.trim()) {
    toast(t('myProjects.renameModal.enterNewTitle'));
    return false;
  }

  if (newName.value.trim()) {
    emit('confirm', newName.value.trim());
  }
}

function handleOverlayClick() {
  handleClose();
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #ffffff;
  border-radius: 12px;
  width: 520px;
  padding: 18px 0;
}

.close-btn {
  background: none;
  border: none;
  padding: 0;
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 0 20px 18px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #161122;
    margin: 0;
  }
}

.modal-body {
  margin-bottom: 18px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);

  .form-group {
      display: flex;
      flex-direction: column;

      .label-with-counter {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        label {
          font-size: 14px;
          color: #161122;
          margin: 0;
        }

        .char-counter {
          margin-left: 6px;
          font-size: 12px;
          color: #9a93a4;
        }
      }

      .input-container {
        width: 100%;

        .input-field {
          width: 100%;
          height: 50px;
          padding: 14px 10px;
          border: 1px solid rgba(22, 17, 34, 0.12);
          border-radius: 8px;
          font-size: 14px;
          color: #161122;
          outline: none;
          background: rgba(22, 17, 34, 0.06);

          &:focus {
            border-color: #FF4D8D;
          }

          &::placeholder {
            color: #9a93a4;
          }
        }
      }
    }
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 24px;

  .btn {
    min-width: 136px;
    height: 48px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .cancel-btn {
    background: rgba(22, 17, 34, 0.06);
    color: #5b5566;

    &:hover {
      color: #FF4D8D;
    }
  }
  .confirm-btn {
    border: none;
    background: #FF4D8D;
    color: #ffffff;

    &:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }
    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #161122;
    }
  }
}
</style>
