<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ t('home.videoSettings.title') }}</h3>

      <div class="modal-body">
        <div class="setting-section">
          <h4 class="setting-label">{{ t('home.videoSettings.language') }}</h4>
          <div class="language-options">
            <div
              v-for="lang in languageOptions"
              :key="lang.value"
              class="radio-option"
              @click="selectedLanguage = lang.value"
            >
              <img
                :src="selectedLanguage === lang.value ? selectActive : selectIcon"
                alt=""
              />
              <span class="radio-label">{{ lang.label }}</span>
            </div>
          </div>
        </div>

        <div class="setting-section">
          <h4 class="setting-label">{{ t('home.videoSettings.aspectRatio') }}</h4>
          <div class="aspect-options">
            <div
              v-for="aspect in aspectRatioOptions"
              :key="aspect.value"
              class="radio-option"
              @click="selectedAspect = aspect.value"
            >
              <img
                :src="selectedAspect === aspect.value ? selectActive : selectIcon"
                alt=""
              />
              <span class="radio-label">{{ aspect.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="$emit('close')">
          {{ t('home.videoSettings.cancel') }}
        </button>
        <button class="modal-btn confirm" @click="confirmSettings">
          {{ t('home.videoSettings.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import selectIcon from '@/assets/images/publish/select.png';
import selectActive from '@/assets/images/publish/select_active.png';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [settings: { language: string; aspectRatio: string }];
}>();

const { t, locale } = useI18n();

const languageOptions = [
  { value: 'english', label: t('home.videoSettings.languages.english') },
  { value: 'japanese', label: t('home.videoSettings.languages.japanese') },
  { value: 'chinese', label: t('home.videoSettings.languages.chinese') }
];

// Aspect ratio options for v-for
const aspectRatioOptions = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' }
];

const selectedLanguage = ref<string>('');
const selectedAspect = ref<string>('');

// Load settings from local storage
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem('videoSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      selectedLanguage.value = settings.language || (locale.value == 'en' ? 'english' : locale.value == 'jp' ? 'japanese' : 'chinese');
      selectedAspect.value = settings.aspectRatio || '16:9';
    } else {
      selectedLanguage.value = locale.value == 'en' ? 'english' : locale.value == 'jp' ? 'japanese' : 'chinese';
      selectedAspect.value = '16:9';
    }
  } catch (error) {
    console.error('Error loading settings from local storage:', error);
    selectedLanguage.value = locale.value == 'en' ? 'english' : locale.value == 'jp' ? 'japanese' : 'chinese';
    selectedAspect.value = '16:9';
  }
}

function confirmSettings() {
  try {
    const settings = {
      language: selectedLanguage.value,
      aspectRatio: selectedAspect.value
    };
    localStorage.setItem('videoSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to local storage:', error);
  }

  emit('confirm', {
    language: selectedLanguage.value,
    aspectRatio: selectedAspect.value
  });
}

// Load settings when component is mounted
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 17, 34, 0.4);
  z-index: 500;
}

.modal-content {
  position: relative;
  width: 520px;
  border-radius: 12px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
}

.modal-close {
  background: none;
  border: none;
  padding: 0;
  position: absolute;
  right: 18px;
  top: 20px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #161122;
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);
}

.modal-body {
  padding: 24px;
}

.setting-section {
  margin-bottom: 24px;
  &:last-child{
    margin-bottom: 0;
  }

  .setting-label {
    font-weight: normal;
    font-size: 14px;
    color: #9a93a4;
    margin-bottom: 14px;
  }
}

.language-options,
.aspect-options {
  display: flex;
  align-items: center;
  gap: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  img {
    width: 20px;
    height: 20px;
  }

  .radio-label {
    font-size: 14px;
    color: #5b5566;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 18px 24px ;
  border-top: 1px solid rgba(22, 17, 34, 0.12);

  .modal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 136px;
    height: 48px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &.cancel {
      background: rgba(22, 17, 34, 0.06);
      color: #5b5566;

      &:hover {
        color: #FF4D8D;
      }
    }

    &.confirm {
      background: #FF4D8D;
      color: #ffffff;

      &:hover:not(:disabled) {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }
      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
      }

      &:disabled {
        background: #f8d7e8;
        color: white;
        cursor: not-allowed;
      }
    }
  }
}
</style>
