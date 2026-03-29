<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="close" @click="close" />

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

    const parma = {
      method: "POST",
      headers: {
        token: token,
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
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
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
    const response = await fetch(`${baseUrl}report/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { token })
      },
      body: JSON.stringify(reportData)
    });

    const data = await response.json();
    if (data.code === 0 || data.code === 200) {
      toast(t("report.success"));
      close();
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  width: 42rem;
  background: #ffffff;
  border-radius: 1.2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 2rem;
  right: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.8rem 2.4rem;
  border-bottom: 1px solid #F5F5F5;

  h3 {
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
    margin: 0;
  }
}

.modal-body {
  padding: 1.2rem;
  max-height: 39rem;
  overflow-y: auto;

  &.step {
    padding: 1.8rem 2.4rem;
  }
}

.report-options {
  display: flex;
  flex-direction: column;
}

.radio-item {
  height: 4.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.2rem;
  border-radius: 0.8rem;
  cursor: pointer;
  color: #6A7282;

  &:hover {
    color: #4A5565;
  }

  &.active {
    background: #F5F5F5;
    .label-text {
      color: #4A5565;
    }
  }

  .label-text {
    font-size: 1.4rem;
  }

  .radio {
    width: 2rem;
    height: 2rem;

    img {
      width: 100%;
      height: 100%;
    }
  }
}

.info-row {
  margin-bottom: 2.4rem;
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
}

.form-item {
  margin-bottom: 1.8rem;

  &:last-child {
    margin-bottom: 0;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
    .label {
      font-size: 1.4rem;
      color: #6A7282;
    }
    .count {
      font-size: 1.2rem;
      color: #99A1AF;
    }
  }
}

.desc-input {
  width: 100%;
  height: 13.6rem;
  padding: 1rem;
  border: 1px solid #F5F5F5;
  border-radius: 0.8rem;
  resize: none;
  font-family: inherit;
  font-size: 1.4rem;
  background: #F5F5F5;
  color: #364153;

  &::placeholder {
    color: #99a1af;
  }

  &:focus {
    outline: none;
    border-color: #fb64b6;
  }
}

.upload-list {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.img-item {
  position: relative;
  width: 10rem;
  height: 10rem;
  border-radius: 0.8rem;
  overflow: hidden;

  &:hover {
    .delete-mask {
      position: absolute;
      top: 0.4rem;
      right: 0.4rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
      z-index: 5;

      img {
        width: 2rem;
        height: 2rem;
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
  width: 10rem;
  height: 10rem;
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  cursor: pointer;

  &.uploading {
    cursor: not-allowed;
    opacity: 0.7;
  }

  img {
    width: 2.4rem;
    height: 2.4rem;
    cursor: pointer;
  }
}

.uploading-spinner {
  width: 2.4rem;
  height: 2.4rem;
  border: 2px solid rgba(251, 100, 182, 0.3);
  border-top: 2px solid #fb64b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  padding: 1.8rem;
  border-top: 1px solid #F5F5F5;
  display: flex;
  justify-content: center;

  button {
    width: 24rem;
    height: 4.8rem;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .next-btn,
  .submit-btn {
    background: #fb64b6;
    color: #ffffff;

    &:hover {
      position: relative;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &:disabled {
      background: rgba(251, 100, 182, 0.5);
      cursor: not-allowed;

      &:hover {
        &::after {
          opacity: 0;
        }
      }
    }
  }
}
</style>
