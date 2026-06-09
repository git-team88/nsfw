<template>
  <div class="modal-overlay" v-if="visible" @click.self="handleCancel">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isEdit ? t('userHome.collection.editName') : t('collection.createCollection') }}</h3>
        <img class="close-btn" src="@/assets/images/base/close.png" alt="Close" @click="handleCancel" />
      </div>

      <div class="modal-body">
        <!-- Cover Section -->
        <div class="form-group cover-group">
          <div class="cover-wrapper">
            <div class="cover-label">
              <b class="required">*</b>{{ t('collection.cover') }}
            </div>

            <div class="cover-upload-box">
              <div class="cover-upload" @click="openCoverModal">
                <img v-if="coverUrl" :src="coverUrl" alt="" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <img src="@/assets/images/user/upload.png" alt="" />
                  <span>{{ t('collection.uploadCover') }}</span>
                </div>
              </div>
              <span class="set-cover" @click="openCoverModal">{{ coverUrl ? t('collection.changeCover') : t('collection.setCover') }}</span>
            </div>
          </div>
        </div>

        <!-- Name Section -->
        <div class="form-group">
          <label class="form-label">
            <span><b class="required">*</b>{{ t('collectionSettings.collectionName') }}</span>
            <span class="char-counter">({{ collectionName.length }}/60)</span>
          </label>
          <input
            type="text"
            v-model="collectionName"
            class="form-input"
            :placeholder="t('collection.placeholder')"
            maxlength="60"
          />
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>

        <!-- Description Section -->
        <div class="form-group">
          <label class="form-label">
            <span>{{ t('collectionSettings.description') }}</span>
            <span class="char-counter">({{ description.length }}/500)</span>
          </label>
          <textarea
            v-model="description"
            class="form-textarea"
            :placeholder="t('collection.descriptionPlaceholder')"
            maxlength="500"
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-cancel" @click="handleCancel">{{ t('collection.cancel') }}</button>
          <button
            class="btn btn-save"
            @click="handleSave"
            :disabled="isLoading"
          >
            {{ isLoading ? t('loading') : t('collection.save') }}
          </button>
        </div>
      </div>
    </div>

    <CollectionCoverModal
      v-model:visible="showCoverModal"
      :cover-image="coverUrl"
      @confirm="handleCoverConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import CollectionCoverModal from './CollectionCoverModal.vue';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  collectionId?: string | number;
  collectionName: string;
  coverUrl?: string;
  description?: string;
  type?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', collection: { id: string | number; name: string; cover?: string; description?: string }): void;
}>();

const collectionName = ref(props.collectionName);
const coverUrl = ref(props.coverUrl || '');
const description = ref(props.description || '');
const errorMessage = ref('');
const isLoading = ref(false);
const showCoverModal = ref(false);

// 保存初始值用于比较
const initialCollectionName = ref(props.collectionName);
const initialCoverUrl = ref(props.coverUrl || '');
const initialDescription = ref(props.description || '');

watch(() => props.collectionName, (newName) => {
  collectionName.value = newName;
  initialCollectionName.value = newName;
});

watch(() => props.coverUrl, (newUrl) => {
  coverUrl.value = newUrl || '';
  initialCoverUrl.value = newUrl || '';
});

watch(() => props.description, (newDesc) => {
  description.value = newDesc || '';
  initialDescription.value = newDesc || '';
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (!props.isEdit) {
      collectionName.value = '';
      coverUrl.value = '';
      description.value = '';
      errorMessage.value = '';
    }
    // 保存初始值用于比较
    initialCollectionName.value = collectionName.value;
    initialCoverUrl.value = coverUrl.value;
    initialDescription.value = description.value;
  }
});

function openCoverModal() {
  showCoverModal.value = true;
}

function handleCoverConfirm(url: string) {
  coverUrl.value = url;
}

async function handleSave() {
  errorMessage.value = '';

  // 新建模式：所有字段都必须填
  if (!props.isEdit) {
    if (!coverUrl.value) {
      toast(t('collection.emptyCover'));
      return;
    }

    if (!collectionName.value.trim()) {
      toast(t('collection.placeholder'));
      return;
    }
  }

  isLoading.value = true;

  try {
    if (props.isEdit && props.collectionId) {
      // 编辑模式：只传递修改过的字段
      const params: any = {
        book_id: props.collectionId
      };

      // 只传递修改过的字段
      if (coverUrl.value !== initialCoverUrl.value) {
        params.cover = coverUrl.value;
      }
      if (collectionName.value.trim() !== initialCollectionName.value) {
        params.title = collectionName.value.trim();
      }
      if (description.value.trim() !== initialDescription.value) {
        params.description = description.value.trim();
      }

      const response = await api.modifyCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: props.collectionId,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim()
        });
        handleCancel();
      } else {
        if (response.code == 22004) {
          errorMessage.value = t('collection.duplicateError');
        } else {
          toast(t('fail'));
        }
      }
    } else {
      // 新建模式：所有字段都必须传
      const params: any = {
        type: props.type || 2,
        title: collectionName.value.trim(),
        description: description.value.trim() || t('collection.defaultDescription'),
        cover: coverUrl.value
      };

      const response = await api.addCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: response.data.book_id,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim()
        });
        handleCancel();
      } else {
        if (response.code === 22004) {
          errorMessage.value = t('collection.duplicateError');
        } else {
          toast(t('fail'));
        }
      }
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isLoading.value = false;
  }
}

function handleCancel() {
  emit('close');
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
  width: 84rem;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 1.2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2.4rem;
  border-bottom: 1px solid #F5F5F5;
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 500;
    color: #101828;
  }

  .close-btn {
    width: 3.2rem;
    height: 3.2rem;
    cursor: pointer;
  }
}

.modal-body {
  padding: 2.4rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 2rem;

  .form-label {
    display: flex;
    align-items: center;
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
    margin-bottom: 1.2rem;
    gap: 1rem;

    .required {
      font-weight: normal;
      color: #FA2D47;
    }

    .char-counter {
      font-size: 1.4rem;
      color: #99A1AF;
    }
  }

  .form-input {
    width: 100%;
    height: 5rem;
    padding: 1rem;
    border: 1px solid #F5F5F5;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    color: #364153;
    background: #F5F5F5;
    outline: none;
    box-sizing: border-box;

    &::placeholder {
      color: #99A1AF;
    }

    &:focus {
      border-color: #FB64B6;
    }
  }

  .form-textarea {
    width: 100%;
    height: 20rem;
    padding: 1rem;
    border: 1px solid #F5F5F5;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    color: #364153;
    min-height: 20rem;
    resize: none;
    outline: none;
    line-height: 2.4rem;
    background: #F5F5F5;
    box-sizing: border-box;

    &::placeholder {
      color: #99A1AF;
    }

    &:focus {
      border-color: #FB64B6;
    }
  }

  .error-message {
    color: #FA2D47;
    font-size: 1.2rem;
    margin-top: 1.2rem;
    margin-bottom: 0;
  }
}

.cover-group {
  .cover-wrapper {
    .cover-label {
      display: flex;
      align-items: center;
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin-bottom: 1.2rem;
      gap: 1rem;

      .required {
        font-weight: normal;
        color: #FA2D47;
      }
    }

    .cover-upload-box {
      display: flex;
      align-items: flex-end;
      gap: 1.2rem;
    }

    .cover-upload {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18rem;
      height: 24rem;
      border-radius: 1.2rem;
      cursor: pointer;
      overflow: hidden;
      background: #F5F5F5;

      .cover-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        img {
          width: 4.4rem;
          height: 4.4rem;
        }

        span {
          font-size: 1.6rem;
          color: #6A7282;
        }
      }
    }

    .set-cover {
      font-size: 1.6rem;
      color: #FB64B6;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  margin-top: 3rem;
}

.btn {
  min-width: 13.6rem;
  height: 4.8rem;
  padding: 0 4.8rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-cancel {
    background: #F5F5F5;
    color: #6A7282;

    &:hover {
      color: #FB64B6;
    }
  }

  &.btn-save {
    background: #FB64B6;
    color: #fff;

    &:hover:not(:disabled) {
      position: relative;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>