<template>
  <div class="modal-overlay" v-if="visible">
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
            spellcheck="false"
          />
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>

        <!-- Sensitive Content Section -->
        <div class="form-group">
          <div class="form-label-inner">
            <label class="form-label" style="margin-bottom: 0;"><b class="required">*</b>{{ t("submit.contentSettings") }}</label>
            <div class="info-icon" @mouseover="adjustTooltipPosition">
              <img src="@/assets/images/publish/info.png" alt="Info" />
              <div class="tooltip-arrow"></div>
              <div class="tooltip">
                <div class="tooltip-content">
                  <div v-html="t('submit.sensitiveContent')"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="sensitive-options">
            <div class="option" @click="toggleSensitive('yes')">
              <img :src="isNsfw === 1 ? selectActive : select" alt="" />
              <span>{{ t("submit.yes") }}</span>
            </div>
            <div class="option" @click="toggleSensitive('no')">
              <img :src="isNsfw === 0 ? selectActive : select" alt="" />
              <span>{{ t("submit.no") }}</span>
            </div>
          </div>
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
            spellcheck="false"
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
            {{ t('collection.save') }}
          </button>
        </div>
        <p v-if="isEdit" class="edit-sync-tip">{{ t('collection.editSyncTip') }}</p>
      </div>
    </div>

    <CollectionCoverModal
      v-model:visible="showCoverModal"
      :cover-image="coverUrl"
      @confirm="handleCoverConfirm"
    />

    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import CollectionCoverModal from './CollectionCoverModal.vue';
import SensitiveConfirmModal from './SensitiveConfirmModal.vue';

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  collectionId?: string | number;
  collectionName?: string;
  coverUrl?: string;
  description?: string;
  type?: number;
  isNsfw?: string | number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', collection: { id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number }): void;
}>();

const collectionName = ref(props.collectionName || '');
const coverUrl = ref(props.coverUrl || '');
const description = ref(props.isEdit ? (props.description || '') : (props.description || t('collection.defaultDescription')));
const isNsfw = ref(props.isNsfw == 1 ? 1 : 0);
const isNsfwSelected = ref(true);
const errorMessage = ref('');
const isLoading = ref(false);
const showCoverModal = ref(false);
const showSensitiveConfirm = ref(false);

const initialCollectionName = ref(props.collectionName || '');
const initialCoverUrl = ref(props.coverUrl || '');
const initialDescription = ref(props.isEdit ? (props.description || '') : (props.description || t('collection.defaultDescription')));
const initialIsNsfw = ref(props.isNsfw == 1 ? 1 : 0);

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    isLoading.value = false;
    if (!props.isEdit) {
      collectionName.value = props.collectionName || '';
      coverUrl.value = props.coverUrl || '';
      description.value = props.description || t('collection.defaultDescription');
      isNsfw.value = props.isNsfw == 1 ? 1 : 0;
      isNsfwSelected.value = true;
      initialCollectionName.value = collectionName.value;
      initialCoverUrl.value = coverUrl.value;
      initialDescription.value = description.value;
      initialIsNsfw.value = isNsfw.value;
    } else if (props.collectionId) {
      isLoading.value = true;
      try {
        const response = await api.getSelfCollectionDetail(props.collectionId) as any;
        if (response.code === 0) {
          const data = response.data;
          const bookInfo = data.book_info || data;
          collectionName.value = bookInfo.title || '';
          coverUrl.value = bookInfo.cover || '';
          description.value = bookInfo.description || '';
          isNsfw.value = bookInfo.is_nsfw == 1 ? 1 : 0;
          isNsfwSelected.value = true;
          initialCollectionName.value = collectionName.value;
          initialCoverUrl.value = coverUrl.value;
          initialDescription.value = description.value;
          initialIsNsfw.value = isNsfw.value;
        } else {
          toast(t('fail'));
          emit('close');
        }
      } catch (error) {
        console.error('Failed to load collection:', error);
        toast(t('fail'));
        emit('close');
      } finally {
        isLoading.value = false;
      }
    }
  } else {
    isLoading.value = false;
    errorMessage.value = '';
  }
}, { immediate: true });

function toggleSensitive(val: 'yes' | 'no') {
  const targetNsfw = val === 'yes' ? 1 : 0;
  isNsfwSelected.value = true;
  if (isNsfw.value === targetNsfw) return;

  if (val === 'yes') {
    const dontAsk = localStorage.getItem('sensitiveDontAsk');
    if (dontAsk == '1') {
      isNsfw.value = 1;
    } else {
      showSensitiveConfirm.value = true;
    }
  } else {
    isNsfw.value = 0;
  }
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  isNsfw.value = 1;
  showSensitiveConfirm.value = false;
}

function adjustTooltipPosition(event: MouseEvent) {
  const infoIcon = event.currentTarget as HTMLElement;
  const tooltip = infoIcon.querySelector('.tooltip') as HTMLElement;

  if (tooltip) {
    tooltip.style.top = '50%';
    tooltip.style.left = '100%';
    tooltip.style.right = 'auto';
    tooltip.style.transform = 'translateY(-50%)';
    tooltip.style.marginLeft = '2rem';
    tooltip.style.marginRight = '0';
    tooltip.classList.remove('tooltip-left');

    const infoIconRect = infoIcon.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    if (infoIconRect.right + 300 > windowWidth) {
      tooltip.style.left = 'auto';
      tooltip.style.right = '100%';
      tooltip.style.marginLeft = '0';
      tooltip.style.marginRight = '2rem';
      tooltip.classList.add('tooltip-left');
    }
  }
}

function openCoverModal() {
  showCoverModal.value = true;
}

function handleCoverConfirm(url: string) {
  coverUrl.value = url;
}

async function handleSave() {
  errorMessage.value = '';

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
      const params: any = {
        book_id: props.collectionId
      };

      if (coverUrl.value !== initialCoverUrl.value) {
        params.cover = coverUrl.value;
      }
      if (collectionName.value.trim() !== initialCollectionName.value) {
        params.title = collectionName.value.trim();
      }
      if (description.value.trim() !== initialDescription.value) {
        params.description = description.value.trim();
      }
      if (isNsfw.value !== initialIsNsfw.value) {
        params.is_nsfw = isNsfw.value;
      }

      const response = await api.modifyCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: props.collectionId,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim(),
          is_nsfw: isNsfw.value
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
      const params: any = {
        type: props.type || 2,
        title: collectionName.value.trim(),
        description: description.value.trim() || t('collection.defaultDescription'),
        cover: coverUrl.value,
        is_nsfw: isNsfw.value
      };

      const response = await api.addCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: response.data.book_id,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim(),
          is_nsfw: isNsfw.value
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
  isLoading.value = false;
  emit('close');
}

function handleModalKeydown(e: KeyboardEvent) {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
      e.preventDefault();
    }
    e.stopPropagation();
  }
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
  z-index: 1200;
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

.form-label-inner {
  display: flex;
  align-items: center;
}

.info-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  overflow: visible;
  z-index: 30;

  img {
    width: 2rem;
    height: 2rem;
  }
}

.tooltip-arrow {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  margin-left: 0.8rem;
  width: 1.2rem;
  height: 3.3rem;
  background: url('@/assets/images/publish/intro_arrow.png') no-repeat center center;
  background-size: contain;
  flex-shrink: 0;
  display: block;
  z-index: 101;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.tooltip {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  margin-left: 2rem;
  padding: 1.8rem;
  width: 28rem;
  background: #FFFFFF;
  font-size: 1.2rem;
  line-height: 1.6rem;
  border-radius: 0.8rem;
  white-space: normal;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;

  .tooltip-content {
    font-size: 1.2rem;
    line-height: 2rem;
    color: #99A1AF;

    :deep(span) {
      color: #364153;
    }
  }
}

.info-icon:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.info-icon:hover .tooltip-arrow {
  opacity: 1;
  visibility: visible;
}

.sensitive-options {
  display: flex;
  gap: 3.2rem;
  margin-top: 1.2rem;

  .option {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;

    img {
      width: 2.4rem;
      height: 2.4rem;
    }

    span {
      font-size: 1.4rem;
      color: #364153;
    }
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
  justify-content: center;
  gap: 2.4rem;
  margin-top: 3rem;
}

.edit-sync-tip {
  color: #FA2D47;
  font-size: 1.4rem;
  margin-top: 1rem;
  margin-bottom: 0;
  text-align: center;
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
