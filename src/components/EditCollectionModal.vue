<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isEdit ? t('userHome.collection.editName') : t('collection.createCollection') }}</h3>
        <button class="close-btn" @click="handleCancel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
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
              <img class="set-cover" src="@/assets/images/publish/set.png" alt="" @click="openCoverModal" />
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
          <div class="form-label-inner">
            <label class="form-label">
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
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Language Section -->
        <div class="form-group">
          <label class="form-label"><b>*</b>{{ t('submit.language') }}</label>
          <div class="lang-dropdown" :class="{ open: langDropdownOpen, up: langDropdownUp }" ref="langDropdownRef">
            <div class="lang-dropdown-trigger" @click="toggleLangDropdown">
              <span>{{ currentLangLabel }}</span>
              <svg class="lang-arrow" :class="{ rotated: langDropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div class="lang-dropdown-menu" v-if="langDropdownOpen">
              <div
                class="lang-dropdown-item"
                v-for="opt in langOptions"
                :key="opt.key"
                :class="{ active: selectedLanguage === opt.key }"
                @click="selectedLanguage = opt.key; langDropdownOpen = false"
              >{{ t(opt.labelKey) }}</div>
            </div>
          </div>
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
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import CollectionCoverModal from './CollectionCoverModal.vue';
import SensitiveConfirmModal from './SensitiveConfirmModal.vue';

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  collectionId?: string | number;
  collectionName?: string;
  coverUrl?: string;
  description?: string;
  type?: number;
  isNsfw?: string | number;
  sessionId?: string;
  storySummary?: string;
  language?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', collection: { id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number; language?: string }): void;
}>();

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc" }[locale.value] || "jp");

const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
];

const langDropdownOpen = ref(false);
const langDropdownUp = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);
const selectedLanguage = ref(props.language || defaultLang);

const currentLangLabel = computed(() => {
  const opt = langOptions.find((o) => o.key === selectedLanguage.value);
  return opt ? t(opt.labelKey) : "";
});

function toggleLangDropdown() {
  if (langDropdownOpen.value) {
    langDropdownOpen.value = false;
    return;
  }
  const el = langDropdownRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    langDropdownUp.value = spaceBelow < 200;
  }
  langDropdownOpen.value = true;
}

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
const initialLanguage = ref(props.language || defaultLang);

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    isLoading.value = false;
    selectedLanguage.value = props.language || defaultLang;
    if (!props.isEdit) {
      collectionName.value = props.collectionName || '';
      coverUrl.value = props.coverUrl || '';
      isNsfw.value = props.isNsfw == 1 ? 1 : 0;
      isNsfwSelected.value = true;

      if (props.storySummary) {
        description.value = props.storySummary.slice(0, 1000);
      } else if (props.sessionId) {
        isLoading.value = true;
        description.value = '';
        try {
          const projectRes = await api.detailProject(props.sessionId) as any;
          if (projectRes.code == 200 && projectRes.data?.result_async?.generate_novel_outline?.story_summary?.summary) {
            description.value = projectRes.data.result_async.generate_novel_outline.story_summary.summary.slice(0, 1000);
          } else {
            description.value = props.description || t('collection.defaultDescription');
          }
        } catch (e) {
          console.error('Failed to fetch story summary:', e);
          description.value = props.description || t('collection.defaultDescription');
        } finally {
          isLoading.value = false;
        }
      } else {
        description.value = props.description || t('collection.defaultDescription');
      }

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
      if (selectedLanguage.value !== initialLanguage.value) {
        params.language = selectedLanguage.value;
      }

      const response = await api.modifyCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: props.collectionId,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim(),
          is_nsfw: isNsfw.value,
          language: selectedLanguage.value
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
        is_nsfw: isNsfw.value,
        language: selectedLanguage.value
      };

      const response = await api.addCollection(params) as any;
      if (response.code === 0) {
        emit('save', {
          id: response.data.book_id,
          name: collectionName.value.trim(),
          cover: coverUrl.value,
          description: description.value.trim(),
          is_nsfw: isNsfw.value,
          language: selectedLanguage.value
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
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-content {
  width: 840px;
  max-height: 90vh;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #161122;
  }

  .close-btn {
    background: #fff;
    border: 2.5px solid #161122;
    border-radius: 999px;
    padding: 6px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    box-shadow: 2px 2px 0 #161122;
    transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover { transform: scale(1.1) rotate(90deg); }
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;

  .form-label {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #161122;

    .required {
      font-weight: normal;
      color: #E5484D;
    }

    .char-counter {
      margin-left: 10px;
      font-size: 14px;
      color: #99A1AF;
    }
  }

  .form-input {
    width: 100%;
    height: 50px;
    margin-top: 12px;
    padding: 10px;
    border: 2px solid #161122;
    border-radius: 8px;
    font-size: 16px;
    color: #161122;
    background: #FFFDF7;
    outline: none;
    box-sizing: border-box;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &::placeholder {
      color: #99A1AF;
    }

    &:focus {
      border-color: #FF4D8D;
      box-shadow: 2px 2px 0 rgba(255, 77, 141, 0.2);
    }
  }

  .form-textarea {
    width: 100%;
    height: 200px;
    margin-top: 12px;
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
    box-sizing: border-box;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &::placeholder {
      color: #99A1AF;
    }

    &:focus {
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
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  font-size: 12px;
  line-height: 16px;
  border-radius: 8px;
  white-space: normal;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;

  .tooltip-content {
    font-size: 12px;
    line-height: 20px;
    color: #99A1AF;

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

.cover-group {
  .cover-wrapper {
    .cover-label {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #161122;
      margin-bottom: 12px;

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
      background: rgba(22, 17, 34, 0.06);

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
      width: 28px;
      height: 28px;
      cursor: pointer;
      align-self: flex-end;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

.lang-dropdown {
  position: relative;
  flex: 1;
  margin-top: 12px;

  .lang-dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    height: 40px;
    padding: 0 12px;
    border: 2px solid #161122;
    border-radius: 10px;
    background: #FFFFFF;
    cursor: pointer;
    box-shadow: 2px 2px 0 #161122;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    span {
      font-size: 14px;
      font-weight: 700;
      color: #161122;
    }

    .lang-arrow {
      transition: transform 0.2s ease;
      flex-shrink: 0;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  &.open .lang-dropdown-trigger {
    border-color: #FF4D8E;
    box-shadow: 2px 2px 0 #FF4D8E;
  }

  &.up .lang-dropdown-menu {
    bottom: calc(100% + 6px);
    top: auto;
  }

  .lang-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    border: 2px solid #161122;
    border-radius: 10px;
    background: #FFFFFF;
    box-shadow: 2px 2px 0 #161122;
    z-index: 100;
    overflow: hidden;
  }

  .lang-dropdown-item {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 700;
    color: #161122;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #FFF5F9;
    }

    &.active {
      background: #FFEFF5;
      color: #FF4D8E;
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 30px;
}

.edit-sync-tip {
  color: #E5484D;
  font-size: 14px;
  margin-top: 10px;
  margin-bottom: 0;
  text-align: center;
}

.btn {
  min-width: 136px;
  height: 48px;
  padding: 0 48px;
  border-radius: 14px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-cancel {
    background: #ffffff;
    color: #161122;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 #161122;
    font-weight: 800;

    &:hover {
      border-color: #FF4D8E;
      color: #FF4D8E;
    }
  }

  &.btn-save {
    border: 2px solid #161122;
    background: linear-gradient(135deg, #FF4D8D, #FF7A45);
    color: #ffffff;
    box-shadow: 2px 2px 0 #161122;
    font-weight: 800;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 3px 3px 0 #161122;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
