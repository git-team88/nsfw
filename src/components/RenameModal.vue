<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="handleOverlayClick"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #1a1a1a;
  border-radius: 18px;
  width: 520px;
  padding: 18px 0;
}

.close-btn {
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

.modal-header {
  display: flex;
  align-items: center;
  padding: 0 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
    margin: 0;
  }
}

.modal-body {
  margin-bottom: 18px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .form-group {
      display: flex;
      flex-direction: column;

      .label-with-counter {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        label {
          font-size: 14px;
          color: #f5f5f5;
          margin: 0;
        }

        .char-counter {
          margin-left: 6px;
          font-size: 12px;
          color: #777;
        }
      }

      .input-container {
        width: 100%;

        .input-field {
          width: 100%;
          height: 50px;
          padding: 14px 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          font-size: 14px;
          color: #f5f5f5;
          outline: none;
          background: rgba(255, 255, 255, 0.06);

          &:focus {
            border-color: #ff4f9a;
          }

          &::placeholder {
            color: #777;
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
    background: rgba(255, 255, 255, 0.06);
    color: #aaa;

    &:hover {
      color: #ff4f9a;
    }
  }
  .confirm-btn {
    border: none;
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    color: #f5f5f5;

    &:hover:not(:disabled) {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }
    &:active {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }
  }
}
</style>
