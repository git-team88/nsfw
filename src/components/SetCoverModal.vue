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

          <div class="modal-list">
            <div
              v-if="coverUrl"
              class="cover-cell"
              :class="{ selected: selectedFrame == coverUrl }"
              @click="onCoverClick"
            >
              <img :src="coverUrl" alt="" />
            </div>

            <div class="timeline-box" ref="timelineRef">
              <div class="frames-strip">
                <div class="frames-list">
                  <div
                    v-for="(frame, index) in frames"
                    :key="'frame-' + index"
                    class="frame-cell"
                    @click="onFrameClick(index)"
                  >
                    <img :src="frame" alt="" />
                  </div>
                  <div v-if="isLoadingFrames" class="frame-skeleton-container">
                    <div v-for="i in remainingFrameCount" :key="'skeleton-' + i" class="frame-skeleton"></div>
                  </div>
                </div>
              </div>
              <!-- Drag Handle -->
              <div class="drag-handle" :style="{ left: dragPos + 'px' }" @mousedown="startDrag">
                <div class="line"></div>
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

const remainingFrameCount = computed(() => {
  const total = estimatedFrameCount.value;
  const loaded = frames.value.length;
  return Math.max(0, total - loaded);
});

function getCropDimensions() {
  return {
    width: 150,
    height: 200,
  };
}

const cropDimensions = computed(() => getCropDimensions());

const imageStyle = computed(() => ({
  transform: `translate(${imgOffsetX.value}px, ${imgOffsetY.value}px) scale(${imgScale.value})`,
  transformOrigin: 'center center',
}));

const timelineRef = ref<HTMLElement | null>(null);
const dragPos = ref(0);
const isDragging = ref(false);

// Watch for visible change to initialize
watch(
  [() => props.visible, () => props.videoFile, () => props.videoUrl],
  async ([newVisible, newVideoFile, newVideoUrl], [oldVisible, oldVideoFile, oldVideoUrl]) => {
    if (newVisible) {
      activeTab.value = "select"; // Default first tab
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 0.1; // Start with small scale to prevent large image flash
      localImage.value = null;
      // If coverUrl is provided, use it as selectedFrame initially
      if (props.coverUrl) {
        selectedFrame.value = props.coverUrl;
        await detectOrientation(props.coverUrl);
      }
      // Regenerate frames if videoFile or videoUrl changed
      if ((newVideoFile || newVideoUrl) &&
          (newVideoFile !== oldVideoFile || newVideoUrl !== oldVideoUrl)) {
        // Reset frames and show loading skeleton
        frames.value = [];
        isLoadingFrames.value = true;
        generateFrames();
      } else if ((newVideoFile || newVideoUrl) && frames.value.length === 0) {
        // Generate frames if none exist
        frames.value = [];
        isLoadingFrames.value = true;
        generateFrames();
      }
    }
  },
  { deep: true }
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
  video.muted = true;

  let objectUrlToRevoke = "";

  try {
    if (props.videoFile) {
      video.src = URL.createObjectURL(props.videoFile);
      objectUrlToRevoke = video.src;
    } else if (props.videoUrl) {
      try {
        const resp = await fetch(props.videoUrl, { mode: "cors" });
        const blob = await resp.blob();
        video.src = URL.createObjectURL(blob);
        objectUrlToRevoke = video.src;
      } catch {
        video.crossOrigin = "anonymous";
        video.src = props.videoUrl;
      }
    }

    const loaded = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      video.onerror = () => {
        clearTimeout(timeout);
        console.log("Error loading video for frame generation");
        resolve(false);
      };
    });

    const duration = video.duration;
    if (!loaded || !duration) {
      isLoadingFrames.value = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      return;
    }

    const count = props.extractAllFrames ? Math.floor(duration) : 8;
    estimatedFrameCount.value = count;
    const interval = duration / count;

    for (let i = 0; i < count; i++) {
      video.currentTime = i * interval + 0.1;
      await new Promise<void>((resolve) => {
        const seekTimeout = setTimeout(() => resolve(), 3000);
        video.onseeked = () => {
          clearTimeout(seekTimeout);
          resolve();
        };
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const data = canvas.toDataURL("image/jpeg", 0.6);
        frames.value.push(data);
        if (frames.value.length === 1 && !selectedFrame.value) {
          selectedFrame.value = data;
          dragPos.value = 0;
          detectOrientation(data);
        }
      } catch {
        console.log("Canvas tainted. skipping frame", i);
      }
    }

    if (frames.value.length > 0 && selectedFrame.value) {
      if (props.coverUrl && selectedFrame.value === props.coverUrl) {
        const matchIndex = frames.value.findIndex(f => f === selectedFrame.value);
        if (matchIndex >= 0) {
          const frameWidth = 45;
          dragPos.value = (matchIndex + 0.5) * frameWidth;
        } else {
          dragPos.value = 0;
        }
      }
    }
  } catch (err) {
    console.error("generateFrames error:", err);
  } finally {
    if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    isLoadingFrames.value = false;
  }
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

  const frameWidth = 45;

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

function onCoverClick() {
  if (!timelineRef.value || !props.coverUrl) return;

  const frameWidth = 45;

  const clickedPosition = 0.5 * frameWidth;

  dragPos.value = clickedPosition;

  selectedFrame.value = props.coverUrl;
  detectOrientation(selectedFrame.value);
}

async function onFrameClick(index: number) {
  if (!timelineRef.value) return;

  const frameWidth = 45;

  const clickedPosition = (index + 0.5) * frameWidth;

  dragPos.value = clickedPosition;

  selectedFrame.value = frames.value[index];
  await detectOrientation(selectedFrame.value);
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
    const file = new File([blob], 'cover.png', { type: 'image/png' });

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
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;
  const naturalRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = CROP_W / CROP_H;

  let scaleByWidth = CROP_W / img.naturalWidth;
  let scaleByHeight = CROP_H / img.naturalHeight;

  if (naturalRatio > targetRatio) {
    // Landscape relative to crop frame - scale by height
    imgScale.value = scaleByHeight;
  } else {
    // Portrait relative to crop frame - scale by width
    imgScale.value = scaleByWidth;
  }

  // Ensure image is not enlarged beyond original size
  // If scaling ratio greater than 1 (original image smaller than crop frame), keep original size without upscaling
  if (imgScale.value > 1) {
    imgScale.value = 1;
  }

  // Center the image in the crop frame
  const scaledWidth = img.naturalWidth * imgScale.value;
  const scaledHeight = img.naturalHeight * imgScale.value;

  // Calculate offsets to center the image
  imgOffsetX.value = (CROP_W - scaledWidth) / 2;
  imgOffsetY.value = (CROP_H - scaledHeight) / 2;

  // Apply the transformation immediately
  applyImageOffset();
}

async function cropToCanvas(dataUrl: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));

  const imgEl = previewImgRef.value!;
  const imgRect = imgEl.getBoundingClientRect();

  const boxEl = imgEl.parentElement!;
  const boxRect = boxEl.getBoundingClientRect();

  const previewCropW = boxRect.width * 0.319;
  const previewCropH = boxRect.height * 0.893;
  const cropLeft = boxRect.left + (boxRect.width - previewCropW) / 2;
  const cropTop = boxRect.top + (boxRect.height - previewCropH) / 2;

  const displayScale = imgScale.value;

  const sx = (cropLeft - imgRect.left) / displayScale;
  const sy = (cropTop - imgRect.top) / displayScale;
  const sw = previewCropW / displayScale;
  const sh = previewCropH / displayScale;

  const actualSx = Math.max(0, sx);
  const actualSy = Math.max(0, sy);
  const actualSw = Math.min(img.naturalWidth - actualSx, sw);
  const actualSh = Math.min(img.naturalHeight - actualSy, sh);

  // Output at original dimensions, no scaling up
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(actualSw);
  canvas.height = Math.round(actualSh);

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, actualSx, actualSy, actualSw, actualSh, 0, 0, canvas.width, canvas.height);

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
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .tabs {
    display: flex;
    align-items: center;
    gap: 24px;
    height: 100%;

    span {
      height: 100%;
      display: flex;
      align-items: center;
      font-size: 16px;
      color: #aaa;
      cursor: pointer;
      position: relative;

      &:hover{
        color: #f5f5f5;
      }

      &.active {
        color: #f5f5f5;
        font-weight: 600;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        }
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

  .crop-tip {
    font-size: 12px;
    color: #999;
  }

  .modal-list{
    display: flex;
    align-items: center;
    gap: 4px;

    .cover-cell {
      display: flex;
      justify-content: center;
      height: 100%;
      flex-shrink: 0;
      border: 1px solid #3d3d3d;

      img {
        width: 45px;
        height: 60px;
        object-fit: cover;
      }

      &.selected {
        border-color: #ff4f9a;
      }
    }
  }

  .timeline-box {
    max-width: 100%;
    position: relative;
    display: flex;
    justify-content: flex-start;
    height: 60px;
    cursor: pointer;
    overflow-x: auto; // 允许横向滚动
    overflow-y: hidden;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #2c2c2c;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      border-radius: 3px;
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
          width: 45px;
          height: 60px;
          object-fit: cover;
        }
      }

      .frame-skeleton-container {
        display: flex;
        height: 100%;
      }

      .frame-skeleton {
        flex: 0 0 45px;
        height: 100%;
        background: linear-gradient(90deg, #2c2c2c 25%, #3d3d3d 50%, #2c2c2c 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }

      .cover-skeleton {
        flex: 0 0 45px;
        height: 100%;
        background: linear-gradient(90deg, #2c2c2c 25%, #3d3d3d 50%, #2c2c2c 75%);
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
      top: -5px;
      bottom: -5px;
      width: 4px;
      margin-left: -2px; /* Center align */
      cursor: ew-resize;
      z-index: 10;
      pointer-events: none; // 不阻挡滚动

      .line {
        width: 2px;
        height: 100%;
        margin: 0 auto;
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        box-shadow: 0px 0px 6px 0px rgba(251, 100, 182, 0.12);
        pointer-events: auto; // 线本身可以拖动
      }
    }
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
      color: #f5f5f5;

      :deep(span){
        color: #ff4f9a;
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
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
    border: none;
    min-width: 136px;
    height: 48px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
  }
}

.hidden {
  display: none;
}
</style>
