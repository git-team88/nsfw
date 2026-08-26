<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background: rgba(0, 0, 0, 0.5);
  z-index: 500;
}

.modal-content {
  position: relative;
  width: 520px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}

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

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #f5f5f5;
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid #2c2c2c;
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
    color: #777;
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
    color: #aaa;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 18px 24px ;
  border-top: 1px solid #2c2c2c;

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
      background: rgba(255,255,255,0.06);
      color: #aaa;

      &:hover {
        color: #ff4f9a;
      }
    }

    &.confirm {
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #ffffff;

      &:hover:not(:disabled) {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }
      &:active {
        box-shadow: 0 0 20px rgba(255, 50,140, 0.5);
      }

      &:disabled {
        background: rgba(255,79,154,0.3);
        color: white;
        cursor: not-allowed;
      }
    }
  }
}
</style>