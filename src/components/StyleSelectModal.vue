<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt="Close"
        @click="handleClose"
      />

      <h3 class="modal-title">{{ t('home.styleSelect.title') }}</h3>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <img src="@/assets/images/base/load.png" alt="Loading" />
          <span>{{ t('home.loading') }}</span>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-message">{{ error }}</div>
          <button class="retry-button" @click="loadStyles">{{ t('home.retry') }}</button>
        </div>

        <div v-else-if="styles.length > 0" class="style">
          <div
            v-for="(style, index) in styles"
            :key="index"
            class="style-item"
            :class="{ selected: isStyleSelected(style) }"
            @click="selectStyle(style.name)"
          >
            <img :src="style.image" :alt="locale == 'jp' ? style.name_ja : locale == 'zh' ? style.name_cn : style.name" />
            <div class="style-name">
              {{ locale == 'jp' ? style.name_ja : locale == 'zh' ? style.name_cn : style.name }}
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-message">{{ t('home.styleSelect.empty') }}</div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="modal-btn confirm" @click="handleConfirm" :disabled="!selectedStyle">{{ t('home.styleSelect.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const { t, locale } = useI18n();

const props = defineProps<{
  currentSelectedStyle?: string;
}>();

const styles = ref<Array<{
  name: string;
  name_cn: string,
  name_ja: string,
  image: string;
  description: string;
}>>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const emit = defineEmits<{
  close: [];
  confirm: [style: any];
}>();

const selectedStyle = ref<string | null>(props.currentSelectedStyle || null);

const isStyleSelected = (style: any) => {
  if (!selectedStyle.value) return false;
  // Check if selectedStyle matches any of the name variants
  return selectedStyle.value === style.name ||
         selectedStyle.value === style.name_cn ||
         selectedStyle.value === style.name_ja;
};

const selectStyle = (styleName: string) => {
  selectedStyle.value = styleName;
};

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  if (selectedStyle.value) {
      // Find the style by comparing all possible name fields
      const style = styles.value.find(s =>
        s.name === selectedStyle.value ||
        s.name_cn === selectedStyle.value ||
        s.name_ja === selectedStyle.value
      );

      if (style) {
        // Store the entire style object with all language names and image
        const styleData = {
          name: style.name,
          name_cn: style.name_cn,
          name_ja: style.name_ja,
          image: style.image
        };

        localStorage.setItem('selectedStyle', JSON.stringify(styleData));
        emit('confirm', style);
      }
    }
};

const loadStyles = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.getStoryStyles();
    if (response && response.data) {
        styles.value = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          name_cn: item.name_cn,
          name_ja: item.name_ja,
          image: item.image
        }));

      // Default to first style if no saved style or saved style not found
      if (styles.value && styles.value.length > 0) {
        // First priority: use currentSelectedStyle from props
        if (props.currentSelectedStyle) {
          const currentStyleExists = styles.value.some(s =>
            s.name === props.currentSelectedStyle || s.name_cn === props.currentSelectedStyle || s.name_ja === props.currentSelectedStyle
          );
          if (currentStyleExists) {
            selectedStyle.value = props.currentSelectedStyle;
          }
        }
        // Second priority: use saved style from localStorage
        else {
          const savedStyle = localStorage.getItem('selectedStyle');
          let savedStyleValue = savedStyle;

          // Try to parse savedStyle as JSON object
          try {
            if (savedStyle) {
              const parsedStyle = JSON.parse(savedStyle);
              if (parsedStyle.name) {
                savedStyleValue = parsedStyle.name;
              }
            }
          } catch (e) {
            // If parsing fails, use as string
          }

          const savedStyleExists = savedStyleValue && styles.value.some(s =>
            s.name === savedStyleValue || s.name_cn === savedStyleValue || s.name_ja === savedStyleValue
          );

          if (savedStyleExists) {
            selectedStyle.value = savedStyleValue;
          } else {
            // Default to first style based on current locale
            const firstStyle = styles.value[0];
            selectedStyle.value = locale.value == 'jp'
              ? firstStyle.name_ja
              : locale.value == 'zh'
              ? firstStyle.name_cn
              : firstStyle.name;
          }
        }
      }
    }
  } catch (err) {
    toast(t('fail'));
    styles.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStyles();
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 768px;
  display: flex;
  flex-direction: column;
  position: relative;

  .modal-close {
    position: absolute;
    right: 18px;
    top: 18px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 500;
    color: #364153;
    margin: 0;
    padding: 18px 20px;
    border-bottom: 1px solid #F5F5F5;
  }

  .modal-body {
    flex: 1;
    padding: 20px 0 20px 24px;
    max-height: 460px;
    overflow-y: auto;

    .style {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .style-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        width: 136px;

        border-radius: 8px;

        &.selected {
          img{
            border-color: #fb64b6;
          }
        }

        img {
          width: 136px;
          height: 136px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid transparent;
        }

        .style-name {
          position: absolute;
          left: 0;
          bottom: 0;
          font-size: 14px;
          color: #364153;
          text-align: center;
          width: 100%;
          padding: 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-radius: 0 0 8px 8px;
          background: linear-gradient( 180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%);
          z-index: 1;
        }
      }
    }

    .loading-state,
        .loading-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          margin-top: 10px;

          img {
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
          }

          span {
            font-size: 14px;
            color: #6a7282;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px;
          text-align: center;

          .error-message {
            font-size: 14px;
            color: #ff4d4f;
            max-width: 400px;
          }

          .retry-button {
             display: flex;
              align-items: center;
              justify-content: center;
              min-width: 240px;
              height: 48px;
              padding: 8px 24px;
              font-size: 14px;
              color: #fff;
              background: #fb64b6;
              border: none;
              border-radius: 8px;
              cursor: pointer;

              &:hover {
                opacity: 0.8;
              }
          }
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;

          .empty-message {
            font-size: 14px;
            color: #6a7282;
          }
        }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
    padding: 18px 24px ;
    border-top: 1px solid #F5F5F5;

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
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #FB64B6;
        }
      }

      &.confirm {
        background: #FB64B6;
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
            background: rgba(255, 255, 255, 0.1);
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
}
</style>