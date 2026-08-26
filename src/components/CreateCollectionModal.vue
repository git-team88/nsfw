<template>
  <div class="create-modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="handleCancel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3>{{ t('collection.createCollection') }}</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">{{ t('collection.collectionName') }}
            <span class="character-counter">{{ collectionName.length }}/60</span>
          </label>

          <div class="input-with-counter">
            <input
              type="text"
              v-model="collectionName"
              class="form-input"
              :placeholder="t('collection.placeholder')"
              @input="handleInput"
              maxlength="60"
            />
          </div>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleCancel">{{ t('collection.cancel') }}</button>
        <button class="btn btn-save" @click="handleSave" :disabled="!isValid || isLoading">
          {{ isLoading ? t('loading') : t('collection.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  existingCollections: string[];
  type: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', collection: { id: string | number; name: string }): void;
}>();

const collectionName = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const isValid = computed(() => {
  return collectionName.value.trim() !== '';
});

function handleInput() {
  // Limit to 30 characters
  if (collectionName.value.length > 30) {
    collectionName.value = collectionName.value.substring(0, 30);
  }

  const name = collectionName.value.trim();
  if (name == '') {
    errorMessage.value = '';
  }
}

async function handleSave() {
  if (isValid.value) {
    isLoading.value = true;
    try {
      const response = await api.addCollection({ type: props.type, title: collectionName.value.trim() }) as any;
      if (response.code == 0) {
        emit('save', { id: response.data.book_id, name: collectionName.value.trim() });
        resetForm();
      } else {
        if (response.code == 22004) {
          errorMessage.value = t('collection.duplicateError');
        } else {
          toast(t('fail'));
        }
      }
    } catch (error: any) {
      toast(t('fail'));
    } finally {
      isLoading.value = false;
    }
  }
}

function handleCancel() {
  emit('close');
  resetForm();
}

function handleOverlayClick() {
  handleCancel();
}

function resetForm() {
  collectionName.value = '';
  errorMessage.value = '';
}
</script>

<style lang="scss" scoped>
.create-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  width: 520px;
  overflow: hidden;
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
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #2c2c2c;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
  }
}

.modal-body {
  padding: 24px;

  .form-group {
    .form-label {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
      color: #aaa;
    }

    .input-with-counter {
      position: relative;
      width: 100%;
    }

    .form-input {
      width: 100%;
      height: 50px;
      padding: 12px 10px;
      border: 1px solid #2c2c2c;
      border-radius: 8px;
      font-size: 14px;
      background: rgba(255,255,255,0.06);
      outline: none;
      color: #f5f5f5;

      &:focus {
        border-color: #ff4f9a;
      }

      &::placeholder {
        color: #777;
      }
    }

    .character-counter {
      font-size: 12px;
      color: #777;
    }

    .error-message {
      margin-top: 6px;
      font-size: 14px;
      color: #E5484D;
    }
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 18px;
  border-top: 1px solid #2c2c2c;

  .btn {
    min-width: 136px;
    height: 48px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &.btn-cancel {
      background-color: rgba(255,255,255,0.06);
      color: #aaa;

      &:hover {
        color: #ff4f9a;
      }
    }

    &.btn-save {
      background-color: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #FFFFFF;

      &:disabled {
        background-color: rgba(255,79,154,0.5);
        cursor: not-allowed;
      }
    }
  }
}
</style>
