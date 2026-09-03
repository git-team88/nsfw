<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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

          <div class="images-strip" v-if="!hideStrip">
            <!-- Regular Images -->
            <div
              v-for="(image, index) in images"
              :key="index"
              class="image-cell"
              :class="{ selected: selectedIndex == index }"
              @click="onImageClick(index)"
            >
              <img :src="processImageUrl(image)" alt="" />
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
import { ref, watch, onUnmounted, onMounted, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import UploadMask from "./UploadMask.vue";
import api from "@/api/index";
import { baseUrl } from "@/util/config";
import { processImageUrl } from "@/util/utils";

const props = defineProps<{
  visible: boolean;
  images: string[];
  coverImage?: string;
  isCanvasGenerated?: boolean;
  hideStrip?: boolean;
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

function getCropDimensions() {
  return {
    width: 150,
    height: 200,
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
        selectedImage.value = '';
        selectedIndex.value = -1;
      } else if (props.coverImage) {
        const matchIdx = props.images.findIndex(img => img === props.coverImage);
        if (matchIdx >= 0) {
          selectedImage.value = props.images[matchIdx];
          selectedIndex.value = matchIdx;
        } else {
          selectedImage.value = props.coverImage;
          selectedIndex.value = -1;
        }
      } else if (props.images.length > 0 && !selectedImage.value) {
        selectedImage.value = props.images[0];
        selectedIndex.value = 0;
      } else {
        selectedImage.value = '';
        selectedIndex.value = -1;
      }
    }
  },
);

watch(localImage, (newVal) => {
  if (newVal) {
    detectOrientation();
  }
});

watch(selectedImage, () => {
  nextTick(() => {
    detectOrientation();
  });
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

  isUploading.value = true;

  cropToCanvas(src).then((cropped) => {
    return mockUpload(cropped);
  }).then((uploadedUrl) => {
    isUploading.value = false;
    emit("confirm", uploadedUrl);
    close();
  }).catch((error) => {
    isUploading.value = false;
    console.error("Upload error:", error);
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
        'Platform': 'web',
        ...authHeaders,
      },
      body: formData,
    };

    const res = await fetch(baseUrl + "user/uploadImage", parma);
    const data = await res.json();
    if (data.code == 0 || data.code == 200) {
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

async function fetchImageToBlobUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return url;
  }

  let fetchUrl = url;
  const cloudfrontDomain = 'https://static.moegen.ai';
  const proxyDomain = `${baseUrl}proxy_download`;

  if (url.startsWith(cloudfrontDomain)) {
    fetchUrl = proxyDomain + url.replace(cloudfrontDomain, '');
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function detectOrientation() {
  const imgEl = previewImgRef.value;
  if (!imgEl) return;

  await new Promise((resolve) => {
    if (imgEl.complete) {
      resolve(null);
    } else {
      imgEl.onload = resolve;
    }
  });

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;

  const scaleByWidth = CROP_W / imgEl.naturalWidth;
  const scaleByHeight = CROP_H / imgEl.naturalHeight;

  let scale = Math.max(scaleByWidth, scaleByHeight);

  if (scale > 1) {
    scale = 1;
  }

  imgScale.value = scale;

  const scaledWidth = imgEl.naturalWidth * scale;
  const scaledHeight = imgEl.naturalHeight * scale;

  imgOffsetX.value = (CROP_W - scaledWidth) / 2;
  imgOffsetY.value = (CROP_H - scaledHeight) / 2 + 24;

  isPortrait.value = imgEl.naturalHeight >= imgEl.naturalWidth;
}

async function cropToCanvas(dataUrl: string): Promise<string> {
  const blobUrl = await fetchImageToBlobUrl(dataUrl);
  const img = new Image();
  img.src = blobUrl;
  await new Promise((r) => (img.onload = r));

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const scale = imgScale.value;

  const scaledImgWidth = img.naturalWidth * scale;
  const scaledImgHeight = img.naturalHeight * scale;

  const imgCenterX = scaledImgWidth / 2 + imgOffsetX.value;
  const imgCenterY = scaledImgHeight / 2 + imgOffsetY.value;

  const cropLeft = imgCenterX - CROP_W / 2;
  const cropTop = imgCenterY - CROP_H / 2;

  const sx = cropLeft / scale;
  const sy = cropTop / scale;
  const sw = CROP_W / scale;
  const sh = CROP_H / scale;

  const actualSx = Math.max(0, sx);
  const actualSy = Math.max(0, sy);
  const actualSw = Math.min(img.naturalWidth - actualSx, sw);
  const actualSh = Math.min(img.naturalHeight - actualSy, sh);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(actualSw);
  canvas.height = Math.round(actualSh);
  const ctx = canvas.getContext("2d")!;

  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(img, actualSx, actualSy, actualSw, actualSh, 0, 0, canvas.width, canvas.height);

  if (blobUrl !== dataUrl) {
    URL.revokeObjectURL(blobUrl);
  }

  return canvas.toDataURL("image/jpeg", 1.0);
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  position: relative;
  width: 520px;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;

  .tabs {
    display: inline-flex;
    gap: 0;
    border: 1px solid #3d3d3d;
    border-radius: 10px;
    padding: 3px;
    background: rgba(255, 255, 255, 0.04);

    span {
      padding: 6px 16px;
      font-size: 14px;
      color: #aaa;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.15s ease;
      white-space: nowrap;

      &.active {
        color: #f5f5f5;
        background: #1a1a1a;
        font-weight: 600;
      }
    }
  }
}

.modal-body {
  padding: 18px 24px;
}

.select-mode {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;

  .preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preview-crop-box {
    width: 470px;
    height: 224px;
    border-radius: 8px;
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
    width: 150px;
    height: 200px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5);
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
    color: #f5f5f5;
    font-size: 12px;
    text-align: center;
  }

  .images-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    width: 100%;

    .image-cell {
      width: auto;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid transparent;
      position: relative;

      &:hover {
        border-color: #ff4f9a;
      }

      &.selected {
        border-color: #ff4f9a;
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
        color: #f5f5f5;
        font-size: 10px;
        text-align: center;
        padding: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.upload-mode {
  height: 100%;

  .upload-area {
    width: 100%;
    height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    img {
      width: 48px;
      height: 48px;
    }

    .modal-text {
      margin: 24px 0 12px;
      font-size: 14px;
      color: #f5f5f5;

      :deep(span){
        color: #ff4f9a;
        cursor: pointer;
      }
    }

    .modal-tip {
      font-size: 12px;
      color: #777;
    }
  }

  .crop-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .preview-crop-box {
      width: 470px;
      height: 224px;
      border-radius: 8px;
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
        width: 150px;
        height: 200px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5);
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
  padding: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .reupload-box{
    position: relative;
  }

  .reupload-btn {
    min-width: 136px;
    height: 48px;
    border: 1px solid #ff4f9a;
    border-radius: 8px;
    font-size: 14px;
    color: #ff4f9a;
    background: none;
    cursor: pointer;
    &:hover {
      background: rgba(255,79,154,0.12);
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
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    color: #f5f5f5;
    border: 1px solid #3d3d3d;
    min-width: 136px;
    height: 48px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover:not(:disabled) {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }

    &:active {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      box-shadow: none;
    }

    &:disabled {
      background: rgba(255,79,154,0.3);
      cursor: not-allowed;
    }
  }
}

.hidden {
  display: none;
}
</style>
