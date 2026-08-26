<template>
  <div v-if="visible" class="ai-generate-modal">
    <div class="ai-generate-content">
      <div class="ai-generate-header">
        <h3>{{ t('submit.cover.aiGenerateTitle') }}</h3>
        <button class="ai-generate-close" @click="close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
      </div>
      <div class="ai-generate-body">
        <div class="input-container">
          <textarea
            v-model="prompt"
            class="ai-generate-input"
            :placeholder="t('submit.cover.aiGeneratePlaceholder')"
            maxlength="1000"
            spellcheck="false"
          ></textarea>
          <div class="word-count">{{ prompt.length }}/1000</div>
        </div>
      </div>
      <div class="ai-generate-footer">
        <button class="ai-generate-btn-large" @click="startGeneration">
          {{ t('submit.cover.aiGenerateStart') }}/{{ coverCost }} {{ t('submit.cover.power') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api/index";
import { toast } from '@/util/toast';

const props = defineProps<{
  visible: boolean;
  coverCost: string;
  defaultPrompt: string;
}>();

const emit = defineEmits(["update:visible", "generation"]);
const { t } = useI18n();

const prompt = ref('');
const loading = ref(false);

// Watch for visible changes to reset prompt
watch(() => props.visible, (newVal) => {
  if (newVal) {
    prompt.value = '';
  }
});

function close() {
  emit("update:visible", false);
}

async function startGeneration() {
  // Check if prompt is too short
  if (prompt.value.trim().length < 10) {
    toast(t('submit.cover.minCharacters'));
    emit("update:visible", false);
    return;
  }

  try {
    // Set loading state
    loading.value = true;

    // Emit generation event
    emit("generation", prompt.value);
  } catch (error) {
    console.error('Error generating AI cover:', error);
  } finally {
    loading.value = false;
    emit("update:visible", false);
  }
}
</script>

<style scoped lang="scss">
.ai-generate-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.ai-generate-content {
  position: relative;
  width: 520px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 18px;
  overflow: hidden;
}

.ai-generate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #2c2c2c;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
    margin: 0;
  }

  .ai-generate-close {
    background: none;
    border: none;
    padding: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
}

.ai-generate-body {
  padding: 18px 24px;
  border-bottom: 1px solid #2c2c2c;

  .input-container {
    position: relative;
    height: 120px;
    padding: 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);

    .ai-generate-input {
      width: 100%;
      height: 80px;
      font-size: 14px;
      color: #f5f5f5;
      resize: none;
      outline: none;
      background: none;

      &::placeholder {
        color: #777;
      }
    }

    .word-count {
      text-align: right;
      font-size: 12px;
      color: #777;
    }
  }
}

.ai-generate-footer {
  display: flex;
  justify-content: center;
  padding: 18px;

  .ai-generate-btn-large {
    min-width: 240px;
    height: 48px;
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &:hover:not(:disabled) {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }
    &:active {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }

    &:disabled {
      background: rgba(255,79,154,0.3);
      cursor: not-allowed;
    }
  }
}

</style>
