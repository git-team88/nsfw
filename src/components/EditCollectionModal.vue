<template>
  <div class="create-modal-overlay" v-if="visible">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="Close" @click="handleCancel" />

      <div class="modal-header">
        <h3>{{ t('userHome.collection.editName') }}</h3>
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
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  collectionId: string | number;
  collectionName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', collection: { id: string | number; name: string }): void;
}>();

const collectionName = ref(props.collectionName);
const errorMessage = ref('');
const isLoading = ref(false);

// Watch for changes in props.collectionName
watch(() => props.collectionName, (newName) => {
  collectionName.value = newName;
});

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
      const response = await api.modifyCollection({ book_id: props.collectionId, title: collectionName.value.trim() }) as any;
      if (response.code == 0) {
        emit('save', { id: props.collectionId, name: collectionName.value.trim() });
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
  collectionName.value = props.collectionName;
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
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #FFFFFF;
  border-radius: 1.2rem;
  width: 52rem;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.8rem 2.4rem;
  border-bottom: 1px solid #F5F5F5;

  h3 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
  }
}

.modal-body {
  padding: 2.4rem;

  .form-group {
    .form-label {
      display: block;
      margin-bottom: 1.2rem;
      font-size: 1.4rem;
      color: #6A7282;
    }

    .input-with-counter {
      position: relative;
      width: 100%;
    }

    .form-input {
      width: 100%;
      height: 5rem;
      padding: 1.2rem 1rem;
      border: 1px solid #F5F5F5;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      background: #F5F5F5;
      outline: none;
      color: #364153;

      &:focus {
        border-color: #fb64b6;
      }

      &::placeholder {
        color: #99A1AF;
      }
    }

    .character-counter {
      font-size: 1.2rem;
      color: #99A1AF;
    }

    .error-message {
      margin-top: 0.6rem;
      font-size: 1.4rem;
      color: #FA2D47;
    }
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.4rem;
  padding: 1.8rem;
  border-top: 1px solid #F5F5F5;

  .btn {
    min-width: 13.6rem;
    height: 4.8rem;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;

    &.btn-cancel {
      background-color: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #FB64B6;
      }
    }

    &.btn-save {
      background-color: #FB64B6;
      color: #FFFFFF;

      &:disabled {
        background-color: rgba(251, 100, 182, 0.5);
        cursor: not-allowed;
      }
    }
  }
}
</style>