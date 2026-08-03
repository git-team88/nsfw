<template>
  <div class="create-collection">
    <Header :cur="-1"></Header>

    <div class="content-container">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
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
              <img :src="isNsfw == 1 ? selectActive : select" alt="" />
              <span>{{ t("submit.yes") }}</span>
            </div>
            <div class="option" @click="toggleSensitive('no')">
              <img :src="isNsfw == 0 ? selectActive : select" alt="" />
              <span>{{ t("submit.no") }}</span>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="form-group">
          <div class="form-label-inner">
            <label class="form-label" style="margin-bottom: 0;">
              <span>{{ t('collectionSettings.description') }}</span>
              <span class="char-counter">({{ description.length }}/1000)</span>
            </label>
            <div class="info-icon" @mouseover="adjustTooltipPosition">
              <img src="@/assets/images/publish/info.png" alt="Info" />
              <div class="tooltip-arrow"></div>
              <div class="tooltip">
                <div class="tooltip-content">
                  <div v-html="t('collectionSettings.descriptionInfo')"></div>
                </div>
              </div>
            </div>
          </div>
          <textarea
            v-model="description"
            class="form-textarea"
            :placeholder="t('collection.descriptionPlaceholder')"
            maxlength="1000"
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

    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
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
import SensitiveConfirmModal from '@/components/SensitiveConfirmModal.vue';

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const collectionName = ref('');
const description = ref('');
const coverUrl = ref('');
const isNsfw = ref(0);
const errorMessage = ref('');
const isLoading = ref(false);
const editId = ref('');
const showCoverModal = ref(false);
const showSensitiveConfirm = ref(false);
const coverModified = ref(false);
const nameModified = ref(false);
const descriptionModified = ref(false);
const isNsfwModified = ref(false);
const isNsfwSelected = ref(true);
const originalName = ref('');
const originalDescription = ref('');
const originalCover = ref('');
const originalIsNsfw = ref(0);

function toggleSensitive(val: 'yes' | 'no') {
  const targetNsfw = val == 'yes' ? 1 : 0;
  isNsfwSelected.value = true;
  if (isNsfw.value == targetNsfw) return;

  if (val == 'yes') {
    const dontAsk = localStorage.getItem('sensitiveDontAsk');
    if (dontAsk == '1') {
      isNsfw.value = 1;
      isNsfwModified.value = true;
    } else {
      showSensitiveConfirm.value = true;
    }
  } else {
    isNsfw.value = 0;
    isNsfwModified.value = true;
  }
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  isNsfw.value = 1;
  isNsfwModified.value = true;
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
    tooltip.style.marginLeft = '20px';
    tooltip.style.marginRight = '0';
    tooltip.classList.remove('tooltip-left');

    const infoIconRect = infoIcon.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    if (infoIconRect.right + 300 > windowWidth) {
      tooltip.style.left = 'auto';
      tooltip.style.right = '100%';
      tooltip.style.marginLeft = '0';
      tooltip.style.marginRight = '20px';
      tooltip.classList.add('tooltip-left');
    }
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = id as string;
    await loadCollection(id as string);
  } else {
    description.value = t('collection.defaultDescription');
  }
});

async function loadCollection(id: string) {
  try {
    const response = await api.getSelfCollectionDetail(id) as any;
    if (response.code === 0) {
      const data = response.data;
      const bookInfo = data.book_info || data;
      collectionName.value = bookInfo.title || '';
      description.value = bookInfo.description || t('collection.defaultDescription');
      coverUrl.value = bookInfo.cover || '';
      isNsfw.value = bookInfo.is_nsfw == 1 ? 1 : 0;
      isNsfwSelected.value = true;
      originalName.value = bookInfo.title || '';
      originalDescription.value = bookInfo.description || '';
      originalCover.value = bookInfo.cover || '';
      originalIsNsfw.value = bookInfo.is_nsfw == 1 ? 1 : 0;
    }
  } catch (error) {
    console.error('Failed to load collection:', error);
  }
}

async function handleSave() {
  errorMessage.value = '';

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

    if (editId.value) {
      params.book_id = editId.value;

      if (collectionName.value.trim() !== originalName.value) {
        params.title = collectionName.value.trim();
      }

      if (description.value.trim() !== originalDescription.value) {
        params.description = description.value.trim();
      }

      if (coverModified.value && coverUrl.value !== originalCover.value) {
        params.cover = coverUrl.value;
      }

      if (isNsfw.value !== originalIsNsfw.value) {
        params.is_nsfw = isNsfw.value;
      }
    } else {
      params.title = collectionName.value.trim();
      params.description = description.value.trim();
      params.cover = coverUrl.value;
      params.is_nsfw = isNsfw.value;
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
          router.push(`/collection-settings/${id}`);
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
  background-color: #FFFDF7;
}

.content-container {
  max-width: 840px;
  margin: 0 auto;
  padding: 100px 24px 24px;
  position: relative;
}

.back-btn {
  width: fit-content;
  height: 40px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #161122;
  cursor: pointer;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FFFDF7;
  box-shadow: 3px 3px 0 #161122;
  padding: 0 10px;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 4px 4px 0 #161122;
  }

  .back-text {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
}

.main-content {
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  .form-label {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #161122;
    margin-bottom: 12px;
    gap: 10px;

    .required {
      font-weight: normal;
      color: #E5484D;
    }

    .char-counter {
      font-size: 14px;
      color: #9a93a4;
    }
  }

  .form-input {
    width: 100%;
    height: 50px;
    padding: 10px;
    border: 2px solid #161122;
    border-radius: 8px;
    font-size: 16px;
    color: #161122;
    background: #FFFDF7;
    outline: none;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &::placeholder {
      color: #9a93a4;
    }

    &:focus{
      border-color: #FF4D8D;
      box-shadow: 2px 2px 0 rgba(255, 77, 141, 0.2);
    }
  }

  .form-textarea {
    width: 100%;
    height: 200px;
    padding: 10px;
    border: 2px solid #161122;
    border-radius: 8px;
    font-size: 16px;
    color: #161122;
    min-height: 200px;
    resize: none;
    outline: none;
    line-height: 24px;
    background: #FFFDF7;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &::placeholder {
      color: #9a93a4;
    }

    &:focus{
      border-color: #FF4D8D;
      box-shadow: 2px 2px 0 rgba(255, 77, 141, 0.2);
    }
  }

  .error-message {
    color: #E5484D;
    font-size: 12px;
    margin-top: 12px;
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
    width: 20px;
    height: 20px;
  }
}

.tooltip-arrow {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  margin-left: 8px;
  width: 12px;
  height: 33px;
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
  margin-left: 20px;
  padding: 18px;
  width: 280px;
  background: #FFFDF7;
  font-size: 12px;
  line-height: 16px;
  border-radius: 8px;
  white-space: normal;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;

  .tooltip-content {
    font-size: 12px;
    line-height: 20px;
    color: #9a93a4;

    :deep(span) {
      color: #161122;
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
  gap: 32px;
  margin-top: 12px;

  .option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    img {
      width: 24px;
      height: 24px;
    }

    span {
      font-size: 14px;
      color: #161122;
    }
  }
}

.cover-wrapper {
  .cover-label {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #161122;
    margin-bottom: 12px;
    gap: 10px;

    .required {
      font-weight: normal;
      color: #E5484D;
    }
  }

  .cover-upload-box {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .cover-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 240px;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    background: #FFFDF7;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    .cover-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      img {
        width: 44px;
        height: 44px;
      }

      span {
        font-size: 16px;
        color: #5b5566;
      }
    }
  }

  .set-cover {
    font-size: 16px;
    color: #FF4D8D;
    cursor: pointer;
  }
}

.hidden-file-input {
  display: none;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 30px;
}

.btn {
  min-width: 136px;
  height: 48px;
  padding: 0 48px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-cancel {
    background: #FFFDF7;
    color: #5b5566;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &:hover {
      color: #FF4D8D;
      border-color: #FF4D8D;
    }
  }

  &.btn-save {
    background: #FF4D8D;
    color: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 4px 4px 0 #161122;

    &:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }

    &:active:not(:disabled) {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #161122;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 1440px) {
  .content-container {
    max-width: 840px;
    padding: 100px 24px 24px;
  }
  .back-btn {
    width: fit-content;
    height: 40px;
  }
  .form-group {
    margin-bottom: 20px;
    .form-label {
      font-size: 16px;
      margin-bottom: 12px;
      gap: 10px;
      .char-counter {
        font-size: 14px;
      }
    }
    .form-input {
      height: 50px;
      padding: 10px;
      border-radius: 8px;
      font-size: 16px;
    }
    .form-textarea {
      height: 200px;
      min-height: 200px;
      padding: 10px;
      border-radius: 8px;
      font-size: 16px;
      line-height: 24px;
    }
    .error-message {
      font-size: 12px;
      margin-top: 12px;
    }
  }
  .info-icon img {
    width: 20px;
    height: 20px;
  }
  .tooltip-arrow {
    margin-left: 8px;
    width: 12px;
    height: 33px;
  }
  .tooltip {
    margin-left: 20px;
    padding: 18px;
    width: 280px;
    border-radius: 8px;
    .tooltip-content {
      font-size: 12px;
      line-height: 20px;
    }
  }
  .sensitive-options {
    gap: 32px;
    margin-top: 12px;
    .option {
      gap: 8px;
      img {
        width: 24px;
        height: 24px;
      }
      span {
        font-size: 14px;
      }
    }
  }
  .cover-wrapper {
    .cover-label {
      font-size: 16px;
      margin-bottom: 12px;
      gap: 10px;
    }
    .cover-upload-box {
      gap: 12px;
    }
    .cover-upload {
      width: 180px;
      height: 240px;
      border-radius: 12px;
      .cover-placeholder {
        gap: 10px;
        img {
          width: 44px;
          height: 44px;
        }
        span {
          font-size: 16px;
        }
      }
    }
    .set-cover {
      font-size: 16px;
    }
  }
  .action-buttons {
    gap: 24px;
    margin-top: 30px;
  }
  .btn {
    min-width: 136px;
    height: 48px;
    padding: 0 48px;
    border-radius: 8px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .content-container {
    max-width: 100%;
    padding: 100px 16px 16px;
  }
  .back-btn {
    width: fit-content;
    height: 32px;
  }
  .form-group {
    margin-bottom: 16px;
    .form-label {
      font-size: 14px;
      margin-bottom: 8px;
      gap: 6px;
      .char-counter {
        font-size: 12px;
      }
    }
    .form-input {
      height: 44px;
      padding: 8px;
      border-radius: 6px;
      font-size: 14px;
    }
    .form-textarea {
      height: 160px;
      min-height: 160px;
      padding: 8px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 20px;
    }
    .error-message {
      font-size: 12px;
      margin-top: 8px;
    }
  }
  .info-icon img {
    width: 16px;
    height: 16px;
  }
  .tooltip {
    margin-left: 12px;
    padding: 12px;
    width: 200px;
    border-radius: 6px;
    .tooltip-content {
      font-size: 12px;
      line-height: 18px;
    }
  }
  .tooltip-arrow {
    margin-left: 6px;
    width: 10px;
    height: 28px;
  }
  .sensitive-options {
    gap: 24px;
    margin-top: 8px;
    .option {
      gap: 6px;
      img {
        width: 20px;
        height: 20px;
      }
      span {
        font-size: 12px;
      }
    }
  }
  .cover-wrapper {
    .cover-label {
      font-size: 14px;
      margin-bottom: 8px;
      gap: 6px;
    }
    .cover-upload-box {
      gap: 8px;
    }
    .cover-upload {
      width: 140px;
      height: 186px;
      border-radius: 8px;
      .cover-placeholder {
        gap: 6px;
        img {
          width: 32px;
          height: 32px;
        }
        span {
          font-size: 14px;
        }
      }
    }
    .set-cover {
      font-size: 14px;
    }
  }
  .action-buttons {
    gap: 16px;
    margin-top: 24px;
  }
  .btn {
    min-width: 100px;
    height: 40px;
    padding: 0 24px;
    border-radius: 6px;
    font-size: 14px;
  }
}
</style>
