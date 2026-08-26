<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3>{{ title || t("report.title") }}</h3>
      </div>

      <div class="modal-body" :class="{ step: step === 2 }">
        <!-- Step 1: Select Reason -->
        <div v-if="step === 1" class="step-1">
          <div class="report-options">
            <div
              v-for="option in options"
              :key="option.value"
              class="radio-item"
              :class="{ active: selectedReason === option.value }"
              @click="checkOption(option.value)"
            >
              <span class="label-text">{{ option.label }}</span>

              <div class="radio">
                <img
                  v-if="selectedReason === option.value"
                  src="@/assets/images/header/check_active.png"
                  alt=""
                />
                <img v-else src="@/assets/images/header/check.png" alt="" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Details & Evidence -->
        <div v-else class="step-2">
          <div class="info-row">
            <span class="label">{{ t("report.reason") }}:</span>
            <span class="value">{{ currentReasonLabel }}</span>
          </div>

          <div class="form-item">
            <div class="label-row">
              <span class="label">{{ t("report.description") }}</span>
              <span class="count">{{ description.length }}/200</span>
            </div>
            <textarea
              v-model="description"
              class="desc-input"
              maxlength="200"
              :placeholder="t('report.placeholder')"
              spellcheck="false"
            ></textarea>
          </div>

          <div class="form-item">
            <div class="label-row">
              <span class="label">{{ t("report.evidence") }}</span>
              <span class="count">{{ imageList.length }}/3</span>
            </div>
            <div class="upload-list">
              <div v-for="(img, index) in imageList" :key="index" class="img-item">
                <img :src="img" alt="" />
                <div class="delete-mask" @click="removeImage(index)">
                  <img src="@/assets/images/publish/delete.png" alt="" />
                </div>
              </div>
              <div v-if="imageList.length < 3" class="upload-btn" @click="triggerUpload" :class="{ uploading: isUploading }">
                <img v-if="!isUploading" src="@/assets/images/base/upload_icon.png" alt="" />
                <div v-else class="uploading-spinner"></div>
                <input type="file" ref="fileInput" accept="image/*" hidden @change="onFileChange" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="step === 2" class="submit-btn" @click="submit">
          {{ t("report.submit") }}
        </button>

        <button v-else class="next-btn" @click="step = 2" :disabled="!selectedReason">
          {{ t("report.next") }}
        </button>
      </div>
    </div>
  </div>

  <UploadMask :visible="isUploading"></UploadMask>
</template>

<script setup lang="ts">
import UploadMask  from "./UploadMask.vue";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";

interface ReportOption {
  label: string;
  value: string;
}

interface TargetType {
  type: string;
  id: string | number;
}

const props = defineProps<{
  visible: boolean;
  title?: string;
  options: ReportOption[];
  targetType: TargetType;
}>();

const emit = defineEmits(["update:visible", "submit"]);

const { t, locale } = useI18n();

const step = ref(1);
const selectedReason = ref("");
const description = ref("");
const imageList = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const currentReasonLabel = computed(() => {
  return props.options.find((opt) => opt.value === selectedReason.value)?.label || "";
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      step.value = 1;
      selectedReason.value = "";
      description.value = "";
      imageList.value = [];
    }
  },
);

function checkOption(option: string) {
  selectedReason.value = option;
}

function close() {
  emit("update:visible", false);
}

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    return '';
  }

  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (file.size > 10 * 1024 * 1024) {
    toast("Image size must be less than 10MB");
    return;
  }

  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = window.AntiCrawler.generateAuthParams(token);

    const parma = {
      method: "POST",
      headers: {
        token: token,
        'Platform': 'web',
        ...authHeaders,
      },
      body: formData,
    };

    const response = await fetch(baseUrl + "/user/uploadImage", parma);

    const data = await response.json();
    if (data.code === 0 || data.code === 200) {
      if (data.data && data.data.url) {
        imageList.value.push(data.data.url);
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isUploading.value = false;
  }

  if (fileInput.value) fileInput.value.value = "";
}

function removeImage(index: number) {
  imageList.value.splice(index, 1);
}

async function submit() {
  try {
    const reportData = {
      target_type: props.targetType.type,
      target_id: props.targetType.id,
      reason: selectedReason.value,
      description: description.value,
      images: imageList.value,
    };

    const token = localStorage.getItem('token');

    const authToken = token || '';
    const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);

    const response = await fetch(`${baseUrl}report/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        ...(token && { token }),
        ts,
        sign
      },
      body: JSON.stringify(reportData)
    });

    const data = await response.json();
    if (data.code === 0 || data.code === 200) {
      toast(t("report.success"));
      close();
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    console.error(error);
    toast(t("fail"));
  }
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  width: 420px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
    margin: 0;
  }
}

.modal-body {
  padding: 12px;
  max-height: 390px;
  overflow-y: auto;

  &.step {
    padding: 18px 24px;
  }
}

.report-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-item {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 14px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  color: #aaa;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    color: #f5f5f5;
    border-color: rgba(255, 255, 255, 0.15);
  }

  &.active {
    border-color: #3d3d3d;
    .label-text {
      color: #f5f5f5;
      font-weight: 700;
    }
  }

  .label-text {
    font-size: 14px;
  }

  .radio {
    width: 20px;
    height: 20px;

    img {
      width: 100%;
      height: 100%;
    }
  }
}

.info-row {
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 600;
  color: #f5f5f5;
}

.form-item {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    .label {
      font-size: 14px;
      color: #aaa;
    }
    .count {
      font-size: 12px;
      color: #777;
    }
  }
}

.desc-input {
  width: 100%;
  height: 136px;
  padding: 10px;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  box-shadow: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  background: #1a1a1a;
  color: #f5f5f5;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder {
    color: #777;
  }

  &:focus {
    outline: none;
    border-color: #ff4f9a;
    box-shadow: none;
  }
}

.upload-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.img-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;

  &:hover {
    .delete-mask {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      cursor: pointer;
      z-index: 5;

      img {
        width: 20px;
        height: 20px;
      }
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }
}

.upload-btn {
  width: 100px;
  height: 100px;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #ff4f9a;
    box-shadow: none;
  }

  &.uploading {
    cursor: not-allowed;
    opacity: 0.7;
  }

  img {
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
}

.uploading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(251, 100, 182, 0.3);
  border-top: 2px solid #ff4f9a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: center;

  button {
    width: 240px;
    height: 48px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    border: 1px solid #3d3d3d;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  }

  .next-btn,
  .submit-btn {
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    color: #f5f5f5;
    box-shadow: none;

    &:hover:not(:disabled) {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }

    &:active:not(:disabled) {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }

    &:disabled {
      background: rgba(255,79,154,0.3);
      box-shadow: none;
      cursor: not-allowed;
    }
  }
}
</style>
