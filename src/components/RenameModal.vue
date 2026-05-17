<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleOverlayClick" />

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
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #ffffff;
  border-radius: 1.2rem;
  width: 52rem;
  padding: 1.8rem 0;
}

.close-btn {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 0 2rem 1.8rem;
  border-bottom: 1px solid #F5F5F5;

  h3 {
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
    margin: 0;
  }
}

.modal-body {
  margin-bottom: 1.8rem;
  padding: 1.8rem 2.4rem;
  border-bottom: 1px solid #F5F5F5;

  .form-group {
      display: flex;
      flex-direction: column;

      .label-with-counter {
        display: flex;
        align-items: center;
        margin-bottom: 1.2rem;

        label {
          font-size: 1.4rem;
          color: #4A5565;
          margin: 0;
        }

        .char-counter {
          margin-left: 0.6rem;
          font-size: 1.2rem;
          color: #99A1AF;
        }
      }

      .input-container {
        width: 100%;

        .input-field {
          width: 100%;
          height: 5rem;
          padding: 1.4rem 1rem;
          border: 1px solid #F5F5F5;
          border-radius: 0.8rem;
          font-size: 1.4rem;
          color: #364153;
          outline: none;
          background: #F5F5F5;

          &:focus {
            border-color: #FB64B6;
          }

          &::placeholder {
            color: #99A1AF;
          }
        }
      }
    }
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 2.4rem;

  .btn {
    min-width: 13.6rem;
    height: 4.8rem;
    border: none;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;
  }

  .cancel-btn {
    background: #F5F5F5;
    color: #6A7282;

    &:hover {
      color: #FB64B6;
    }
  }
  .confirm-btn {
    border: none;
    background: #FB64B6;
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
</style>