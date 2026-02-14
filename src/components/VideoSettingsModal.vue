<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt="Close"
        @click="$emit('close')"
      />

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
  background: rgba(0, 0, 0, 0.3);
  z-index: 500;
}

.modal-content {
  position: relative;
  width: 52rem;
  border-radius: 1.2rem;
  background: #ffffff;
}

.modal-close {
  position: absolute;
  right: 1.8rem;
  top: 2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-title {
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
  margin: 0;
  padding: 1.8rem 2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}

.modal-body {
  padding: 2.4rem;
}

.setting-section {
  margin-bottom: 2.4rem;
  &:last-child{
    margin-bottom: 0;
  }

  .setting-label {
    font-weight: normal;
    font-size: 1.4rem;
    color: #99A1AF;
    margin-bottom: 1.4rem;
  }
}

.language-options,
.aspect-options {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;

  img {
    width: 2rem;
    height: 2rem;
  }

  .radio-label {
    font-size: 1.4rem;
    color: #6a7282;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2.4rem;
  padding: 1.8rem 2.4rem ;
  border-top: 1px solid rgba(251, 100, 182, 0.2);

  .modal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;

    &.cancel {
      border: 1px solid #fb64b6;
      background: none;
      color: #fb64b6;

      &:hover {
        background: rgba(251, 100, 182, 0.06);
      }
    }

    &.confirm {
      background: #fb64b6;
      color: #ffffff;

      &:hover:not(:disabled) {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
        }
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