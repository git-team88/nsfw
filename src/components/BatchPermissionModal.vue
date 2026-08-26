<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ isEpisode ? t('collectionSettings.batchPermTitleEpisode') : t('collectionSettings.batchPermTitle') }}</h3>

      <div class="modal-body">
        <div class="perm-section">
          <div class="section-label"><span class="required">*</span>{{ t('collectionSettings.batchPermSettings') }}</div>
          <div class="perm-options">
            <div
              class="perm-option"
              :class="{ selected: selectedPerm === opt.key }"
              v-for="opt in permOptions"
              :key="opt.key"
              @click="selectedPerm = opt.key"
            >
              <img :src="selectedPerm === opt.key ? selectActive : select" alt="" />
              <div class="perm-content" v-if="opt.key === 'partial'">
                {{ t('novel.batchPublish.partialStart') }}
                <span class="partial-chapter-inline-select">
                  <input
                    type="number"
                    class="partial-chapter-inline-input"
                    v-model.number="partialStartChapter"
                    @click.stop="selectedPerm = 'partial'"
                    @focus="selectedPerm = 'partial'"
                    :min="1"
                    :max="chapters.length"
                  />
                  <img src="@/assets/images/publish/arrow_icon.png" alt="Down" @click.stop="selectedPerm = 'partial'; showPartialDropdown = !showPartialDropdown" />
                  <div v-if="showPartialDropdown" class="partial-chapter-dropdown">
                    <div
                      v-for="ch in chapterNumbers"
                      :key="ch"
                      class="partial-chapter-dropdown-item"
                      :class="{ selected: partialStartChapter === ch }"
                      @click.stop="selectPartialStart(ch)"
                    >
                      {{ ch }}
                    </div>
                  </div>
                </span>
                <span class="partial-end-text">{{ t('novel.batchPublish.partialEnd') }}</span>
              </div>
              <span v-else>{{ t(opt.labelKey) }}</span>
            </div>
          </div>
        </div>

        <div class="preview-section">
          <div class="section-label">{{ isEpisode ? t('collectionSettings.batchPermPreviewEpisode') : t('collectionSettings.batchPermPreview') }}</div>
          <div class="chapter-list">
            <div class="chapter-item" v-for="chapter in chapters" :key="chapter.id">
              <span class="chapter-index">{{ isEpisode ? t('recordList.episode', { episode: chapter.index }) : t('chapter', { chapter: chapter.index }) }}</span>
              <span class="chapter-perm" :class="{ 'perm-partial': getAccessRightsPerm(chapter) == 'partial' }">{{ getAccessRightsText(chapter) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="handleClose">{{ t('cancel') }}</button>
        <button class="modal-btn confirm" @click="handleConfirm">{{ t('confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="BatchPermissionModal">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import select from '@/assets/images/publish/select.png';
import selectActive from '@/assets/images/publish/select_active.png';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  collectionType: string;
  chapters: Array<{
    id: string | number;
    title: string;
    index: number;
    accessRights?: string;
  }>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', type: number, startChapter?: number): void;
}>();

const isEpisode = (props.collectionType === '1' || props.collectionType === '3');

const permOptions = [
  { key: 'public', labelKey: 'novel.batchPublish.allPublic' },
  { key: 'partial', labelKey: 'novel.batchPublish.partialStart' },
  { key: 'private', labelKey: 'novel.batchPublish.allPrivate' },
];

const selectedPerm = ref('public');
const partialStartChapter = ref(1);
const showPartialDropdown = ref(false);

const chapterNumbers = computed(() => {
  return props.chapters.map((ch) => ch.index);
});

watch(() => props.visible, (val) => {
  if (val) {
    selectedPerm.value = 'public';
    partialStartChapter.value = 1;
    showPartialDropdown.value = false;
  }
});

function selectPartialStart(ch: number) {
  partialStartChapter.value = ch;
  showPartialDropdown.value = false;
}

function handleOutsideClick(e: MouseEvent) {
  if (!showPartialDropdown.value) return;
  const dropdown = document.querySelector('.partial-chapter-dropdown');
  const selectEl = document.querySelector('.partial-chapter-inline-select');
  if (dropdown && !dropdown.contains(e.target as Node) && selectEl && !selectEl.contains(e.target as Node)) {
    showPartialDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

function getAccessRightsPerm(chapter: any): string {
  const ar = chapter.accessRights;
  if (ar == '3') return 'private';
  if (ar == '2') return 'partial';
  return 'public';
}

function getAccessRightsText(chapter: any): string {
  const perm = getAccessRightsPerm(chapter);
  if (perm == 'private') return t('submit.permPrivate');
  if (perm == 'partial') return t('submit.permPartial');
  return t('submit.permPublic');
}

function handleClose() {
  emit('close');
}

function handleConfirm() {
  const typeMap: Record<string, number> = { public: 1, partial: 2, private: 3 };
  const type = typeMap[selectedPerm.value] || 1;
  if (type === 2) {
    emit('confirm', type, partialStartChapter.value);
  } else {
    emit('confirm', type);
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 18px;
  width: 520px;
  display: flex;
  flex-direction: column;
  position: relative;

  .modal-close {
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
    z-index: 10;

    &:hover { transform: scale(1.1) rotate(90deg); }
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
    margin: 0;
    padding: 18px 20px;
  }

  .modal-body {
    flex: 1;
    padding: 0 20px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
    }
  }

  .perm-section {
    margin-bottom: 20px;

    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 12px;

      .required {
        color: #ff4f9a;
        margin-right: 4px;
      }
    }
  }

  .perm-options {
    display: flex;
    flex-direction: column;
    row-gap: 12px;
  }

  .perm-option {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 14px;
    border: 1px solid #2c2c2c;
    border-radius: 12px;
    transition: border-color 0.2s;

    &.selected {
      border-color: #3d3d3d;
    }

    > img {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    span {
      font-size: 12px;
      font-weight: 700;
      color: #f5f5f5;
      line-height: 30px;
    }

    .perm-content{
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 700;
      color: #f5f5f5;
      line-height: 30px;
    }

    .partial-end-text {
      flex: 1;
      margin-left: 12px;
    }

    .partial-chapter-inline-select {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      background-color: #1a1a1a;
      border-radius: 11px;
      width: 100px;
      height: 40px;
      border: 1px solid #3d3d3d;
      margin-left: 4px;
      padding: 0 8px 0 14px;
      cursor: pointer;
      position: relative;
      vertical-align: middle;
      box-shadow: none;

      .partial-chapter-inline-input {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        font-weight: 700;
        color: #f5f5f5;
        line-height: 22px;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }

      > img {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
    }

    .partial-chapter-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 8px;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #3d3d3d;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;

      .partial-chapter-dropdown-item {
        padding: 6px 4px;
        font-size: 14px;
        font-weight: 700;
        color: #f5f5f5;
        text-align: center;
        opacity: 0.65;
        cursor: pointer;
        border-radius: 11px;
        transition: background 0.15s, opacity 0.15s;

        &:hover {
          opacity: 1;
          background: rgba(255,79,154,0.12);
        }

        &.selected {
          opacity: 1;
          font-weight: 800;
        }
      }
    }
  }

  .preview-section {
    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 12px;
    }
  }

  .chapter-list {
    max-height: 190px;
    border: 1px solid #3d3d3d;
    border-radius: 10px;
    overflow-y: auto;
  }

  .chapter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-weight: 600;

    .chapter-index {
      font-size: 14px;
      color: #f5f5f5;
    }

    .chapter-perm {
      font-size: 14px;
      color: #f5f5f5;

      &.perm-partial {
        color: #ff4f9a;
      }
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 18px 20px;

    .modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 136px;
      height: 48px;
      border: 1px solid #3d3d3d;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &.cancel {
        background: #1a1a1a;
        color: #aaa;
        box-shadow: none;

        &:hover {
          color: #ff4f9a;
          border-color: #ff4f9a;
          box-shadow: none;
        }

        &:active {
          box-shadow: none;
        }
      }

      &.confirm {
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #ffffff;
        border: 1px solid #ff9aca;
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);

        &:hover {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }

        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }
    }
  }
}
</style>
