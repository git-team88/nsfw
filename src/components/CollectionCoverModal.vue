<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <div class="tabs">
          <span v-if="coverImage" :class="{ active: activeTab === 'select' }" @click="changeTab('select')">
            {{ t("collection.selectCover") }}
          </span>
          <span :class="{ active: activeTab === 'upload' }" @click="changeTab('upload')">
            {{ t("collection.uploadCover") }}
          </span>
        </div>
      </div>

      <div class="modal-body">
        <!-- Select from Current Cover -->
        <div v-if="activeTab === 'select'" class="tab-content select-mode">
          <div class="preview-container">
            <div class="preview-box">
              <div v-if="selectedImage" class="preview-crop-box" @mousedown="startImageDrag">
                <div v-if="!isImageReady" class="loading-overlay">
                  <div class="loading-spinner"></div>
                </div>
                <img
                  v-show="isImageReady"
                  :src="selectedImage"
                  alt=""
                  class="preview-img"
                  ref="previewImgRef"
                  :style="imageStyle"
                />
                <div class="crop-frame"></div>
              </div>
              <div v-else class="placeholder">
                {{ t("collection.noCover") }}
              </div>
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
              <div v-if="!isImageReady" class="loading-overlay">
                <div class="loading-spinner"></div>
              </div>
              <img
                v-show="isImageReady"
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

        <button class="btn confirm" @click="confirm" :disabled="coverImage ? (!selectedImage && !localImage) : !localImage">{{ t("submit.cover.confirm") }}</button>
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
import { baseUrl } from "@/util/config";
import { toast } from "@/util/toast";

const props = defineProps<{
  visible: boolean;
  coverImage?: string;
}>();

const emit = defineEmits(["update:visible", "confirm"]);
const { t, locale } = useI18n();

const activeTab = ref("upload");
const selectedImage = ref("");
const previewImgRef = ref<HTMLImageElement | null>(null);
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
const isImageReady = ref(false);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function isImageCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width === 0 || img.height === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

async function validateImageFile(file: File): Promise<boolean> {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    toast(t('home.error.invalidPhotoFormat'));
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast(t('home.error.maxPhotoSize', { max: 10 }));
    return false;
  }
  const corrupted = await isImageCorrupted(file);
  if (corrupted) {
    toast(t('home.error.corruptedImage'));
    return false;
  }
  return true;
}

function readFileAsDataURL(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    localImage.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function getCropDimensions() {
  return {
    width: 150,
    height: 200,
  };
}

const cropDimensions = computed(() => getCropDimensions());

const imageStyle = computed(() => {
  const imgEl = previewImgRef.value;
  if (!imgEl || !imgEl.naturalWidth) {
    return {
      transform: `translate(${imgOffsetX.value}px, ${imgOffsetY.value}px) scale(${imgScale.value})`,
      transformOrigin: 'top left',
    };
  }
  const PREVIEW_W = 470;
  const PREVIEW_H = 224;
  const scaledWidth = imgEl.naturalWidth * imgScale.value;
  const scaledHeight = imgEl.naturalHeight * imgScale.value;
  const centerOffsetX = (PREVIEW_W - scaledWidth) / 2;
  const centerOffsetY = (PREVIEW_H - scaledHeight) / 2;
  return {
    transform: `translate(${centerOffsetX + imgOffsetX.value}px, ${centerOffsetY + imgOffsetY.value}px) scale(${imgScale.value})`,
    transformOrigin: 'top left',
  };
});

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      activeTab.value = props.coverImage ? "select" : "upload";
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 1;
      localImage.value = null;
      isImageReady.value = false;

      if (props.coverImage) {
        selectedImage.value = props.coverImage;
        await nextTick();
        detectOrientation();
      } else {
        selectedImage.value = "";
      }
    }
  },
);

watch(localImage, (newVal) => {
  if (newVal) {
    isImageReady.value = false;
    nextTick(() => {
      detectOrientation();
    });
  }
});

watch(selectedImage, () => {
  isImageReady.value = false;
  nextTick(() => {
    detectOrientation();
  });
});

function changeTab(tab: string) {
  if (localImage.value) {
    localImage.value = null;
  }
  activeTab.value = tab;
  isImageReady.value = false;
  imgOffsetX.value = 0;
  imgOffsetY.value = 0;
  imgScale.value = 1;
  nextTick(() => {
    if (activeTab.value === 'select' && selectedImage.value) {
      detectOrientation();
    }
  });
}

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const valid = await validateImageFile(file);
    if (!valid) {
      input.value = '';
      return;
    }
    readFileAsDataURL(file);
  }
}

async function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  if (files.length > 1) {
    toast(t('home.error.onlyOneImage'));
    return;
  }
  const file = files[0];
  if (file.type.startsWith("image/")) {
    const valid = await validateImageFile(file);
    if (!valid) return;
    readFileAsDataURL(file);
  }
}

function close() {
  emit("update:visible", false);
  activeTab.value = props.coverImage ? "select" : "upload";
  localImage.value = null;
}

function reupload() {
  uploadInput.value?.click();
}

async function onFileUploadChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const valid = await validateImageFile(file);
    if (!valid) {
      input.value = '';
      return;
    }
    readFileAsDataURL(file);
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
    const file = new File([blob], 'cover.webp', { type: 'image/webp' });

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
      return dataUrl;
    }
  } catch (error) {
    console.error("Cover upload error:", error);
    return dataUrl;
  }
}

onUnmounted(() => {
  document.removeEventListener("mousemove", onImageMove);
  document.removeEventListener("mouseup", endImageDrag);
});

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
  const scaledWidth = imgEl.naturalWidth * imgScale.value;
  const scaledHeight = imgEl.naturalHeight * imgScale.value;

  // Max drag distance: how far the image can move while still covering crop frame
  const maxOffsetX = Math.max(0, (scaledWidth - CROP_W) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - CROP_H) / 2);

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
  const proxyDomain = `${baseUrl}/proxy_download`;

  if (url.startsWith(cloudfrontDomain)) {
    fetchUrl = proxyDomain + url.replace(cloudfrontDomain, '');
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('Response is not an image');
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

  const PREVIEW_W = 470;
  const PREVIEW_H = 224;

  // 裁剪框比例是 3:4 (15:20)
  const cropAspectRatio = CROP_W / CROP_H;
  const imgAspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;

  let scale = 1;

  // 检查图片是否接近3:4比例（允许5%误差）
  const ratioDiff = Math.abs(imgAspectRatio - cropAspectRatio) / cropAspectRatio;
  if (ratioDiff < 0.05) {
    // 3:4比例图片：直接缩放到裁剪框大小
    scale = Math.max(CROP_W / imgEl.naturalWidth, CROP_H / imgEl.naturalHeight);
  } else if (imgAspectRatio > PREVIEW_W / PREVIEW_H) {
    // 宽图：按预览框宽度缩放
    scale = PREVIEW_W / imgEl.naturalWidth;
  } else {
    // 竖图：按预览框高度缩放
    scale = PREVIEW_H / imgEl.naturalHeight;
  }

  // 确保图片至少能覆盖裁剪区域
  const minScaleForCrop = Math.max(CROP_W / imgEl.naturalWidth, CROP_H / imgEl.naturalHeight);
  if (scale < minScaleForCrop) {
    scale = minScaleForCrop;
  }

  // 最大缩放不超过2倍，避免过度放大
  const maxScale = Math.max(PREVIEW_W / imgEl.naturalWidth, PREVIEW_H / imgEl.naturalHeight) * 2;
  if (scale > maxScale) scale = maxScale;

  imgScale.value = scale;
  imgOffsetX.value = 0;
  imgOffsetY.value = 0;

  applyImageOffset();

  await nextTick();
  isImageReady.value = true;
}

async function cropToCanvas(dataUrl: string): Promise<string> {
  const blobUrl = await fetchImageToBlobUrl(dataUrl);
  const img = new Image();
  img.src = blobUrl;
  await new Promise((r) => (img.onload = r));

  const imgEl = previewImgRef.value!;
  const imgRect = imgEl.getBoundingClientRect();

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const boxEl = imgEl.parentElement!;
  const boxRect = boxEl.getBoundingClientRect();

  // Calculate crop frame position (centered in the preview box)
  const cropLeft = boxRect.left + (boxRect.width - CROP_W) / 2;
  const cropTop = boxRect.top + (boxRect.height - CROP_H) / 2;

  // Display scale - how much the image is visually scaled
  const displayScale = imgRect.width / img.naturalWidth;

  // Convert display coordinates to natural image coordinates
  const sx = (cropLeft - imgRect.left) / displayScale;
  const sy = (cropTop - imgRect.top) / displayScale;
  const sw = CROP_W / displayScale;
  const sh = CROP_H / displayScale;

  // Clamp to image bounds
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

  return canvas.toDataURL("image/webp", 0.92);
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  position: relative;
  width: 520px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-btn {
  background: #fff;
  border: 2.5px solid #161122;
  border-radius: 999px;
  padding: 6px;
  position: absolute;
  top: 12px;
  right: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  box-shadow: 2px 2px 0 #161122;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }
}

.modal-header {
  height: 60px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .tabs {
    display: inline-flex;
    gap: 6px;
    background: #FFFDF7;
    border: 2.5px solid #161122;
    border-radius: 14px;
    padding: 5px;

    span {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #5b5566;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 500;
      transition: all 0.15s ease;

      &:hover {
        color: #161122;
      }

      &.active {
        background: #161122;
        color: #fff;
        border-radius: 10px;
        font-weight: 800;
      }
    }
  }
}

.modal-body {
  padding: 24px 24px 30px;
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

  .preview-box {
    width: 470px;
    height: 224px;
    border-radius: 8px;
    background: rgba(22, 17, 34, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .placeholder {
    font-size: 14px;
    color: #9a93a4;
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
    box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.7);
    pointer-events: none;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-img {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    max-width: none;
    max-height: none;
    pointer-events: none;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(22, 17, 34, 0.06);
    z-index: 10;
  }
}

.upload-mode {
  height: 100%;
  padding: 30px 0;

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
      color: #161122;

      :deep(span){
        color: #FF4D8D;
        cursor: pointer;
      }
    }

    .modal-tip {
      font-size: 12px;
      color: #9a93a4;
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
        top: 0;
        left: 0;
        transform-origin: top left;
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
  padding: 20px 24px;
  border-top: 1px solid rgba(22, 17, 34, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .reupload-box{
    position: relative;
  }

  .reupload-btn {
    min-width: 136px;
    height: 48px;
    border: 2px solid #161122;
    border-radius: 8px;
    font-size: 14px;
    color: #5b5566;
    background: #FFFDF7;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

    &:hover {
      color: #FF4D8D;
      border-color: #FF4D8D;
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
    background: #FF4D8D;
    color: #ffffff;
    border: 3px solid #161122;
    min-width: 136px;
    height: 48px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 2px 2px 0 #161122;

    &:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }
    &:active:not(:disabled) {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #161122;
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
