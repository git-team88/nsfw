<template>
  <div class="create-collection">
    <Header :cur="-1"></Header>

    <div class="content-container">
      <button class="back-btn" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </button>

      <div class="main-content">
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
              <span class="set-cover" @click="openCoverModal">{{ t('submit.cover.set') }}</span>
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
          <button class="btn btn-cancel" @click="goBack">{{ t('collection.cancel') }}</button>
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

<script setup lang="ts" name="CreateCollection">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { baseUrl } from '@/util/config';
import CollectionCoverModal from '@/components/CollectionCoverModal.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const collectionName = ref('');
const description = ref('');
const coverUrl = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const editId = ref('');
const showCoverModal = ref(false);
const coverModified = ref(false);
const nameModified = ref(false);
const descriptionModified = ref(false);
const originalName = ref('');
const originalDescription = ref('');
const originalCover = ref('');

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = id as string;
    await loadCollection(id as string);
  }
});

async function loadCollection(id: string) {
  try {
    const response = await api.getSelfCollectionDetail(id) as any;
    if (response.code === 0) {
      const data = response.data;
      const bookInfo = data.book_info || data;
      collectionName.value = bookInfo.title || '';
      description.value = bookInfo.description || '';
      coverUrl.value = bookInfo.cover || '';
      // Save original values for comparison
      originalName.value = bookInfo.title || '';
      originalDescription.value = bookInfo.description || '';
      originalCover.value = bookInfo.cover || '';
    }
  } catch (error) {
    console.error('Failed to load collection:', error);
  }
}

async function handleSave() {
  errorMessage.value = '';

  // Check if creating new collection (all fields are required)
  if (!editId.value) {
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
    const params: any = {};

    // For editing, only include modified fields
    if (editId.value) {
      params.book_id = editId.value;

      // Check if name was modified
      if (collectionName.value.trim() !== originalName.value) {
        params.title = collectionName.value.trim();
      }

      // Check if description was modified
      if (description.value.trim() !== originalDescription.value) {
        params.description = description.value.trim();
      }

      // Check if cover was modified
      if (coverModified.value && coverUrl.value !== originalCover.value) {
        params.cover = coverUrl.value;
      }
    } else {
      // For creating new collection, include all required fields
      params.title = collectionName.value.trim();
      params.description = description.value.trim();
      params.cover = coverUrl.value;
    }

    let response;
    if (editId.value) {
      response = await api.modifyCollection(params) as any;
    } else {
      response = await api.addCollection(params) as any;
    }

    if (response.code == 0) {
      toast(editId.value ? t('collection.modifySuccess') : t('collection.createSuccess'));
      setTimeout(() => {
        const type = route.query.type || '2';
        const id = route.query.id;
        if (id) {
          router.push(`/collection/${id}?type=${type}`);
        } else {
          const uid = route.query.uid || localStorage.getItem('uid');
          router.push(`/user-home?id=${uid}&type=${type}`);
        }
      }, 500);
    } else {
      if (response.code == 22004) {
        errorMessage.value = t('collection.duplicateError');
      } else {
        toast(t('fail'));
      }
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isLoading.value = false;
  }
}

function openCoverModal() {
  showCoverModal.value = true;
}

function handleCoverConfirm(url: string) {
  coverUrl.value = url;
  coverModified.value = true;
}

function goBack() {
  window.history.back();
}
</script>

<style lang="scss" scoped>
.create-collection {
  min-height: 100vh;
  background-color: #ffffff;
}

.content-container {
  max-width: 84rem;
  margin: 0 auto;
  padding: 14rem 0 2.4rem;
}

.back-btn {
  position: fixed;
  left: 50%;
  top: 14rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-54rem);
  cursor: pointer;
  z-index: 10;
  border: none;
  background: transparent;
  padding: 0;

  img {
    width: 4rem;
    height: 4rem;
  }
}

.main-content {
  background: #fff;
  padding: 0;
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

    &::placeholder {
      color: #99A1AF;
    }

    &:focus{
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

    &::placeholder {
      color: #99A1AF;
    }

    &:focus{
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

  .cover-upload-box{
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
  }
}

.hidden-file-input {
  display: none;
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