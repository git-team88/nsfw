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
        <!-- Select from Frames -->
        <div v-if="activeTab === 'select'" class="tab-content select-mode">
          <div class="preview-container">
            <div class="preview-crop-box" @mousedown="startImageDrag">
              <img
                v-if="selectedFrame"
                :src="selectedFrame"
                alt=""
                class="preview-img"
                ref="previewImgRef"
                :style="imageStyle"
              />
              <div class="crop-frame">
                <div v-if="!selectedFrame" class="placeholder">
                  {{ t("submit.cover.loadingFrames") }}
                </div>
              </div>
            </div>
          </div>

          <div class="timeline-box" ref="timelineRef">
            <div class="frames-strip">
              <!-- Skeleton loading for frames -->
              <div v-if="isLoadingFrames" class="frame-skeleton-container">
                <div v-for="i in estimatedFrameCount" :key="'skeleton-' + i" class="frame-skeleton"></div>
              </div>
              <!-- Actual frames -->
              <div class="frames-list" v-else>
                <div
                  v-for="(frame, index) in frames"
                  :key="index"
                  class="frame-cell"
                  @click="onFrameClick(index)"
                >
                  <img :src="frame" alt="" />
                </div>
              </div>
            </div>
            <!-- Drag Handle -->
            <div class="drag-handle" :style="{ left: dragPos + 'px' }" @mousedown="startDrag">
              <div class="line"></div>
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
            @click="reupload"
            v-if="activeTab == 'upload' && localImage"
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
import { baseUrl } from "@/util/config";

const props = defineProps<{
  visible: boolean;
  videoFile: File | null;
  videoUrl?: string;
  coverUrl?: string;
  extractAllFrames?: boolean;
}>();

const emit = defineEmits(["update:visible", "confirm"]);
const { t, locale } = useI18n();

const activeTab = ref("select"); // select | upload
const frames = ref<string[]>([]);
const selectedFrame = ref("");
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
const isLoadingFrames = ref(false);
const estimatedFrameCount = ref(8);

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

const timelineRef = ref<HTMLElement | null>(null);
const dragPos = ref(0);
const isDragging = ref(false);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = "select"; // Default first tab
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      localImage.value = null;
      // If coverUrl is provided, use it as selectedFrame initially
      if (props.coverUrl) {
        selectedFrame.value = props.coverUrl;
        detectOrientation(props.coverUrl);
      }
      if ((props.videoFile || props.videoUrl) && frames.value.length === 0) {
        // Reset frames and show loading skeleton
        frames.value = [];
        isLoadingFrames.value = true;
        generateFrames();
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

async function generateFrames() {
  if (!props.videoFile && !props.videoUrl) return;
  frames.value = [];
  isLoadingFrames.value = true;

  const video = document.createElement("video");

  if (props.videoFile) {
    video.src = URL.createObjectURL(props.videoFile);
  } else if (props.videoUrl) {
    video.src = props.videoUrl;
  }

  video.muted = true;
  video.crossOrigin = "anonymous";

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(true);
    };
    video.onerror = () => {
      console.log("Error loading video for frame generation");
      resolve(false);
    };
  });

  const duration = video.duration;
  if (!duration) {
    isLoadingFrames.value = false;
    return;
  }

  const count = props.extractAllFrames ? Math.floor(duration) : 8;
  estimatedFrameCount.value = count;
  const interval = duration / count;

  for (let i = 0; i < count; i++) {
    video.currentTime = i * interval + 0.1; // Add small offset
    await new Promise((r) => (video.onseeked = r));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.6); // Lower quality for thumbnails
    frames.value.push(data);
  }

  if (frames.value.length > 0) {
    if (!selectedFrame.value) {
      selectedFrame.value = frames.value[0];
      dragPos.value = 0;
      await detectOrientation(selectedFrame.value);
    } else if (props.coverUrl) {
      const matchIndex = frames.value.findIndex(f => f === selectedFrame.value);
      if (matchIndex >= 0) {
        const frameWidth = 4.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
        dragPos.value = (matchIndex + 0.5) * frameWidth;
      } else {
        dragPos.value = 0;
      }
    }
  }

  if (props.videoFile) {
    URL.revokeObjectURL(video.src);
  }

  isLoadingFrames.value = false;
}

// Drag Logic
function startDrag() {
  isDragging.value = true;
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value || !timelineRef.value) return;

  const rect = timelineRef.value.getBoundingClientRect();
  const scrollLeft = timelineRef.value.scrollLeft;

  let x = e.clientX - rect.left + scrollLeft;

  const framesList = timelineRef.value.querySelector('.frames-list') as HTMLElement;
  const maxWidth = framesList ? framesList.scrollWidth : rect.width;

  if (x < 0) x = 0;
  if (x > maxWidth) x = maxWidth;

  dragPos.value = x;

  const frameWidth = 4.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  const index = Math.min(
    Math.floor(x / frameWidth),
    frames.value.length - 1,
  );
  if (index >= 0 && index < frames.value.length) {
    selectedFrame.value = frames.value[index];
  }
}

function onDragEnd() {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
}

function onFrameClick(index: number) {
  if (!timelineRef.value) return;

  const frameWidth = 4.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);

  const clickedPosition = (index + 0.5) * frameWidth;

  dragPos.value = clickedPosition;

  selectedFrame.value = frames.value[index];
  detectOrientation(selectedFrame.value);
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

  frames.value = [];
  selectedFrame.value = '';
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
  const src = activeTab.value === "select" ? selectedFrame.value : localImage.value;
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

    const parma = {
      method: "POST",
      headers: {
        token: token,
      },
      body: formData,
    };

    const res = await fetch(baseUrl + "/user/uploadImage", parma);
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      return data.data.url || dataUrl;
    } else {
      return dataUrl;
    }
  } catch (error) {
    console.error("Cover upload error:", error);
    return dataUrl;
  }
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
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

  const canvas = document.createElement("canvas");
  canvas.width = CROP_W;
  canvas.height = CROP_H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
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
      color: #6A7282;
      cursor: pointer;
      position: relative;

      &:hover{
        color: #101828;
      }

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
  padding: 2.4rem 2.4rem 3rem;
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
    color: #fff;
    font-size: 1.2rem;
    text-align: center;
  }

  .crop-tip {
    font-size: 1.2rem;
    color: #999;
  }

  .timeline-box {
    max-width: 100%;
    position: relative;
    display: flex;
    justify-content: flex-start;
    height: 6rem;
    cursor: pointer;
    overflow-x: auto; // 允许横向滚动
    overflow-y: hidden;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      height: 0.6rem;
    }

    &::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 0.3rem;
    }

    &::-webkit-scrollbar-thumb {
      background: #FB64B6;
      border-radius: 0.3rem;
    }

    .frames-strip {
      display: flex;
      min-width: 100%; // 确保至少占满容器
      height: 100%;

      .frames-list{
        display: flex;
        align-items: center;
        min-width: max-content; // 根据内容自动扩展
      }
      .frame-cell {
        display: flex;
        justify-content: center;
        height: 100%;
        flex-shrink: 0; // 防止帧被压缩
        img {
          width: 4.5rem;
          height: 6rem;
          object-fit: cover;
        }
      }

      .frame-skeleton-container {
        display: flex;
        min-width: 100%;
        height: 100%;
      }

      .frame-skeleton {
        flex: 0 0 4.5rem;
        height: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }

      @keyframes loading {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    }

    .drag-handle {
      position: absolute;
      top: -0.5rem;
      bottom: -0.5rem;
      width: 4px;
      margin-left: -2px; /* Center align */
      cursor: ew-resize;
      z-index: 10;
      pointer-events: none; // 不阻挡滚动

      .line {
        width: 2px;
        height: 100%;
        margin: 0 auto;
        background: #fb64b6;
        box-shadow: 0px 0px 6px 0px rgba(251, 100, 182, 0.12);
        pointer-events: auto; // 线本身可以拖动
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
      }
    }

    .modal-tip {
      font-size: 1.2rem;
      color: #99a1af;
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
  }
}

.hidden {
  display: none;
}
</style>
