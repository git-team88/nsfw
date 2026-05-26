<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <img src="@/assets/images/base/close.png" class="close-btn" @click="close" />

      <div class="modal-header">
        <div class="tabs">
          <span :class="{ active: activeTab === 'select' }" @click="changeTab('select')">{{
            t("submit.cover.select")
          }}</span>
          <span :class="{ active: activeTab === 'upload' }" @click="changeTab('upload')">{{
            t("submit.cover.upload")
          }}</span>
        </div>
      </div>

      <div class="modal-body">
        <!-- Select from Uploaded Images -->
        <div v-if="activeTab === 'select'" class="tab-content select-mode">
          <div class="preview-container">
            <div class="preview-crop-box" @mousedown="startImageDrag">
              <img
                v-if="selectedImage"
                :src="selectedImage"
                alt=""
                class="preview-img"
                ref="previewImgRef"
                :style="imageStyle"
              />
              <div class="crop-frame">
                <div v-if="!selectedImage" class="placeholder">
                  {{ t("submit.cover.selectImage") }}
                </div>
              </div>
            </div>
          </div>

          <div class="images-strip">
            <!-- Cover Image -->
            <div
              v-if="coverImage"
              class="image-cell"
              :class="{ selected: selectedIndex == -1 }"
              @click="onCoverClick"
            >
              <img :src="coverImage" alt="Cover" />
            </div>
            <!-- Regular Images -->
            <div
              v-for="(image, index) in images"
              :key="index"
              class="image-cell"
              :class="{ selected: selectedIndex == index }"
              @click="onImageClick(index)"
            >
              <img :src="image" alt="" />
            </div>
          </div>
        </div>

        <!-- Upload Local -->
        <div v-else class="tab-content upload-mode">
          <div
            class="upload-area"
            v-if="!localImage"
            @click="triggerUpload"
            @drop.prevent="onDrop"
            @dragover.prevent
          >
            <img src="@/assets/images/publish/upload.png" alt="" />
            <div class="modal-text" v-html='t("submit.cover.dragOrClick")'></div>
            <div class="modal-tip">{{ t("submit.cover.uploadTip") }}</div>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              class="hidden"
              title=""
              @change="onFileChange"
            />
          </div>
          <div class="crop-area" v-else>
            <div class="preview-crop-box" @mousedown="startImageDrag">
              <img
                :src="localImage"
                alt=""
                class="preview-img"
                ref="previewImgRef"
                :style="imageStyle"
              />
              <div class="crop-frame"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="reupload-box">
          <button
            class="reupload-btn"
            v-if="activeTab == 'upload' && localImage"
            @click="reupload"
          >
            {{ t("submit.cover.reupload") }}
          </button>

          <input
              type="file"
              ref="uploadInput"
              accept="image/*"
              class="upload-hidden"
              title=""
              @change="onFileUploadChange"
            />
        </div>

        <button class="btn confirm" @click="confirm">{{ t("submit.cover.confirm") }}</button>
      </div>
    </div>

    <!-- Upload Mask -->
    <UploadMask :visible="isUploading" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import UploadMask from "./UploadMask.vue";
import api from "@/api/index";
import { baseUrl } from "@/util/config";

const props = defineProps<{
  visible: boolean;
  images: string[];
  coverImage?: string;
  isCanvasGenerated?: boolean;
}>();

const emit = defineEmits(["update:visible", "confirm"]);
const { t, locale } = useI18n();

const activeTab = ref("select"); // select | upload
const selectedImage = ref("");
const selectedIndex = ref(-1);
const previewImgRef = ref<HTMLImageElement | null>(null);
const isPortrait = ref(false);
const imgOffsetY = ref(0);
const imgOffsetX = ref(0);
const imgScale = ref(1);
const isImgDragging = ref(false);
const lastY = ref(0);
const lastX = ref(0);
const localImage = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

// Calculate crop dimensions from rem to px dynamically
function getCropDimensions() {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const CROP_W_REM = 15; // From CSS: width: 15rem;
  const CROP_H_REM = 20; // From CSS: height: 20rem;
  return {
    width: CROP_W_REM * rootFontSize,
    height: CROP_H_REM * rootFontSize,
  };
}

const cropDimensions = computed(() => getCropDimensions());

const imageStyle = computed(() => {
  return {
    transform: `translate(${imgOffsetX.value}px, ${imgOffsetY.value}px) scale(${imgScale.value})`,
  };
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = "select"; // Default first tab
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 0.1; // Start with small scale to prevent large image flash
      localImage.value = null;

      // Check if cover is canvas-generated (not from uploaded images)
      if (props.isCanvasGenerated) {
        // For canvas-generated covers, don't select it, let user choose from images
        selectedImage.value = '';
        selectedIndex.value = -1;
      } else if (props.coverImage) {
        // For uploaded/URL covers, select the cover image
        selectedImage.value = props.coverImage;
        selectedIndex.value = -1;
        detectOrientation(selectedImage.value);
      } else if (props.images.length > 0 && !selectedImage.value) {
        // Select first image from the list
        selectedImage.value = props.images[0];
        selectedIndex.value = 0;
        detectOrientation(selectedImage.value);
      } else {
        // Reset selection
        selectedImage.value = '';
        selectedIndex.value = -1;
      }
    }
  },
);

watch(localImage, (newVal) => {
  if (newVal) {
    detectOrientation(newVal);
  }
});

function changeTab(tab: string) {
  if (localImage.value) {
    localImage.value = null;
  }
  activeTab.value = tab;
}

function onImageClick(index: number) {
  selectedImage.value = props.images[index];
  selectedIndex.value = index;
  detectOrientation(selectedImage.value);
}

function onCoverClick() {
  if (props.coverImage) {
    selectedImage.value = props.coverImage;
    selectedIndex.value = -1;
    detectOrientation(selectedImage.value);
  }
}

function triggerUpload() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      localImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      localImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function close() {
  emit("update:visible", false);
  activeTab.value = 'select';
  localImage.value = null;
}

function reupload() {
  uploadInput.value?.click();
}

function onFileUploadChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      localImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function confirm() {
  const src = activeTab.value === "select" ? selectedImage.value : localImage.value;
  if (!src) return;

  cropToCanvas(src).then((cropped) => {
    // Show UploadMask
    isUploading.value = true;
    // Upload the cropped image
    mockUpload(cropped).then((uploadedUrl) => {
      // Hide UploadMask
      isUploading.value = false;
      emit("confirm", uploadedUrl);
      close();
    }).catch((error) => {
      // Hide UploadMask on error
      isUploading.value = false;
      console.error("Upload error:", error);
    });
  });
}

async function mockUpload(dataUrl: string): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) {
    return '';
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = window.AntiCrawler.generateAuthParams(token);

    const parma = {
      method: "POST",
      headers: {
        token: token,
        ...authHeaders,
      },
      body: formData,
    };

    const res = await fetch(baseUrl + "user/uploadImage", parma);
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      return data.data.url || dataUrl;
    } else {
      // 如果上传失败，使用本地 dataUrl 作为 fallback
      return dataUrl;
    }
  } catch (error) {
    console.error("Cover upload error:", error);
    // 出错时使用本地 dataUrl
    return dataUrl;
  }
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener("mousemove", onImageMove);
  document.removeEventListener("mouseup", endImageDrag);
});

// Crop drag on image
function startImageDrag(e: MouseEvent) {
  isImgDragging.value = true;
  lastY.value = e.clientY;
  lastX.value = e.clientX;
  document.addEventListener("mousemove", onImageMove);
  document.addEventListener("mouseup", endImageDrag);
}
function onImageMove(e: MouseEvent) {
  if (!isImgDragging.value) return;
  const dy = e.clientY - lastY.value;
  const dx = e.clientX - lastX.value;
  lastY.value = e.clientY;
  lastX.value = e.clientX;
  imgOffsetY.value += dy;
  imgOffsetX.value += dx;
  applyImageOffset();
}
function endImageDrag() {
  isImgDragging.value = false;
  document.removeEventListener("mousemove", onImageMove);
  document.removeEventListener("mouseup", endImageDrag);
}
function applyImageOffset() {
  const imgEl = previewImgRef.value;
  if (!imgEl) return;

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const imgWidth = imgEl.naturalWidth * imgScale.value;
  const imgHeight = imgEl.naturalHeight * imgScale.value;

  const maxOffsetX = Math.max(0, (imgWidth - CROP_W) / 2);
  const maxOffsetY = Math.max(0, (imgHeight - CROP_H) / 2);

  if (imgOffsetX.value > maxOffsetX) imgOffsetX.value = maxOffsetX;
  if (imgOffsetX.value < -maxOffsetX) imgOffsetX.value = -maxOffsetX;
  if (imgOffsetY.value > maxOffsetY) imgOffsetY.value = maxOffsetY;
  if (imgOffsetY.value < -maxOffsetY) imgOffsetY.value = -maxOffsetY;
}

onMounted(() => {
  imgOffsetY.value = 0;
  imgOffsetX.value = 0;
});

async function detectOrientation(dataUrl: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const naturalRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = CROP_W / CROP_H;

  if (naturalRatio > targetRatio) {
    // Landscape relative to crop frame
    imgScale.value = CROP_H / img.naturalHeight;
  } else {
    // Portrait relative to crop frame
    imgScale.value = CROP_W / img.naturalWidth;
  }

  imgOffsetX.value = 0;
  imgOffsetY.value = 0;
  isPortrait.value = img.naturalHeight >= img.naturalWidth;
}

async function cropToCanvas(dataUrl: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const imgEl = previewImgRef.value!;
  const imgRect = imgEl.getBoundingClientRect();

  // The crop frame is centered in the preview-crop-box
  // Let's get the box rect
  const boxEl = imgEl.parentElement!;
  const boxRect = boxEl.getBoundingClientRect();

  const cropLeft = boxRect.left + (boxRect.width - CROP_W) / 2;
  const cropTop = boxRect.top + (boxRect.height - CROP_H) / 2;

  const scale = (img.naturalWidth * imgScale.value) / img.naturalWidth;
  const sx = (cropLeft - imgRect.left) / scale;
  const sy = (cropTop - imgRect.top) / scale;
  const sw = CROP_W / scale;
  const sh = CROP_H / scale;

  const actualSx = Math.max(0, sx);
  const actualSy = Math.max(0, sy);
  const actualSw = Math.min(img.naturalWidth - actualSx, sw);
  const actualSh = Math.min(img.naturalHeight - actualSy, sh);

  // Output at original dimensions, no scaling up
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(actualSw);
  canvas.height = Math.round(actualSh);
  const ctx = canvas.getContext("2d")!;

  // Enable image smoothing for better quality when scaling up or down
  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(img, actualSx, actualSy, actualSw, actualSh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  position: relative;
  width: 52rem;
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
  height: 6rem;
  border-bottom: 1px solid #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2.4rem;

  .tabs {
    display: flex;
    align-items: center;
    gap: 2.4rem;
    height: 100%;

    span {
      height: 100%;
      display: flex;
      align-items: center;
      font-size: 1.6rem;
      color: #667085;
      cursor: pointer;
      position: relative;

      &.active {
        color: #101828;
        font-weight: 500;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: #fb64b6;
        }
      }
    }
  }
}

.modal-body {
  padding: 1.8rem 2.4rem;
}

.select-mode {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;

  .preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preview-crop-box {
    width: 47rem;
    height: 22.4rem;
    border-radius: 0.8rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .crop-frame {
    width: 15rem;
    height: 20rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.7);
    pointer-events: none;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-img {
    position: absolute;
    max-width: none;
    max-height: none;
    pointer-events: none;
  }

  .placeholder {
    color: #ffffff;
    font-size: 1.2rem;
    text-align: center;
  }

  .images-strip {
    display: flex;
    gap: 0.8rem;
    overflow-x: auto;
    width: 100%;

    .image-cell {
      width: auto;
      height: 6rem;
      border-radius: 0.4rem;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid transparent;
      position: relative;

      &:hover {
        border-color: #fb64b6;
      }

      &.selected {
        border-color: #fb64b6;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: #ffffff;
        font-size: 1rem;
        text-align: center;
        padding: 0.2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.upload-mode {
  height: 100%;
  padding: 3rem 0;

  .upload-area {
    width: 100%;
    height: 28rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    img {
      width: 4.8rem;
      height: 4.8rem;
    }

    .modal-text {
      margin: 2.4rem 0 1.2rem;
      font-size: 1.4rem;
      color: #364153;

      :deep(span){
        color: #FB64B6;
        cursor: pointer;
      }
    }

    .modal-tip {
      font-size: 1.2rem;
      color: #99A1AF;
    }
  }

  .crop-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;

    .preview-crop-box {
      width: 47rem;
      height: 22.4rem;
      border-radius: 0.8rem;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: grab;

      &:active {
        cursor: grabbing;
      }

      .preview-img {
        position: absolute;
        max-width: none;
        max-height: none;
        pointer-events: none;
      }

      .crop-frame {
        width: 15rem;
        height: 20rem;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.7);
        pointer-events: none;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.modal-footer {
  padding: 1.8rem;
  border-top: 1px solid #F5F5F5;
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;

  .reupload-box{
    position: relative;
  }

  .reupload-btn {
    min-width: 13.6rem;
    height: 4.8rem;
    border: 1px solid #FB64B6;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    color: #FB64B6;
    background: none;
    cursor: pointer;
    &:hover {
      background: rgba(251,100,182,0.12);
    }
  }

  .upload-hidden{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 5;
    display: none;
  }

  .btn.confirm {
    background: #fb64b6;
    color: #ffffff;
    border: none;
    min-width: 13.6rem;
    height: 4.8rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;

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
      }
    }

    &:disabled {
      background: #f8d7e8;
      cursor: not-allowed;
    }
  }
}

.hidden {
  display: none;
}
</style>
