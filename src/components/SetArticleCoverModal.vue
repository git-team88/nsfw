<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <img src="@/assets/images/base/close.png" class="close-btn" @click="close" />

      <div class="modal-header">
        <div class="tabs">
          <span :class="{ active: activeTab === 'select' }" @click="changeTab('select')">
            {{ t("submit.cover.select") }}
          </span>
          <span :class="{ active: activeTab === 'upload' }" @click="changeTab('upload')">
            {{ t("submit.cover.upload") }}
          </span>
        </div>
      </div>

      <div class="modal-body">
        <!-- Select from Background Colors -->
        <div v-if="activeTab === 'select'" class="tab-content select-mode">
          <div class="preview-container">
            <div class="preview-box" :class="{ 'ai-generating': aiGenerating }">
              <div class="preview-text" v-if="selectedBackground && !aiGenerating">
                <div
                  v-if="!selectedBackground.isImage"
                  class="preview-bg"
                  :class="selectedBackground.color == '#494949' ? 'one' : ''"
                  :style="{ backgroundColor: selectedBackground.color }"
                >
                  <div class="quote-mark">"</div>
                  <div class="title-input-container">
                    <textarea
                      v-model="coverTitle"
                      class="title-text"
                      :maxlength="20"
                      :placeholder="t('submit.titlePlaceholder')"
                      rows="3"
                    ></textarea>
                    <!-- <span class="title-count">{{ coverTitle.length }}/20</span> -->
                  </div>
                </div>
                <div v-else class="preview-img-container">
                  <img :src="selectedBackground.color" class="preview-img" />
                </div>
              </div>
              <div v-else-if="!aiGenerating" class="placeholder">
                {{ t("submit.cover.selectBackground") }}
              </div>
              <div v-else class="ai-loading">
                <div class="loading-strip"></div>
              </div>
            </div>
            <div class="ai-generate-btn-container">
              <button class="ai-generate-btn" @click="generateAICover" :disabled="aiGenerating">
                {{ t('submit.cover.aiGenerate') }}/{{ coverCost }} {{ t('submit.cover.power') }}
              </button>
            </div>
          </div>

          <div class="backgrounds-strip">
            <div
              v-for="(bg, index) in backgroundOptions"
              :key="index"
              class="background-cell"
              :class="{ selected: selectedBackground && selectedBackground.color === bg.color }"
              @click="selectBackground(bg)"
              :style="{ backgroundColor: bg.isImage ? 'transparent' : bg.color }"
            >
              <div class="bg-preview" v-if="!bg.isImage">
                <div class="mini-title">Aa</div>
              </div>
              <div class="bg-preview-img" v-else>
                <img :src="bg.color" class="bg-img" />
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

        <button class="btn confirm" @click="confirm" :disabled="!selectedBackground && !localImage">
          {{ t("submit.cover.confirm") }}
        </button>
      </div>

      <UploadMask :visible="loading"></UploadMask>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { baseUrl } from "@/util/config";
import UploadMask from "./UploadMask.vue";

const props = defineProps<{
  visible: boolean;
  title: string;
}>();

const emit = defineEmits(["update:visible", "confirm"]);
const { t, locale } = useI18n();

const activeTab = ref("select"); // select | upload
const selectedBackground = ref<{ color: string } | null>({ color: "#FCCEE8" }); // Default to pink background
const localImage = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);
const previewImgRef = ref<HTMLImageElement | null>(null);
const coverTitle = ref(props.title); // Editable title for cover
const loading = ref(false); // Loading state for upload
const aiGenerating = ref(false); // Loading state for AI generation
const coverCost = ref(0); // Cost for AI cover generation

// Watch for visible changes to fetch cover cost
watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchCoverCost();
  }
});

// Crop related variables
const imgOffsetY = ref(0);
const imgOffsetX = ref(0);
const imgScale = ref(1);
const isImgDragging = ref(false);
const lastY = ref(0);
const lastX = ref(0);

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

const backgroundOptions = [
  { color: "#494949" }, // Pink
  { color: "#BDFFF9" }, // Blue
  { color: "#FCCEE8" }, // Purple
  { color: "#CEF0FE" }, // Green
  { color: "#FFF7C6" }, // Orange
];

function changeTab(tab: string) {
  if (localImage.value) {
    localImage.value = null;
  }
  activeTab.value = tab;
}

// Fetch cover cost estimate
async function fetchCoverCost() {
  try {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.error('No session ID found');
      return;
    }

    const response = await fetch(`${baseUrl}/ai/novelEstimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        step_name: 'cover',
      }),
    });

    const data = await response.json();
    if (data.code === 0 || data.code === 200) {
      coverCost.value = data.data?.points || 0;
    }
  } catch (error) {
    console.error('Error fetching cover cost:', error);
  }
}

// Generate AI cover
async function generateAICover() {
  try {
    aiGenerating.value = true;

    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.error('No session ID found');
      aiGenerating.value = false;
      return;
    }

    const response = await fetch(`${baseUrl}/ai/novelGenerateCover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        content: coverTitle.value,
      }),
    });

    const data = await response.json();
    if (data.code === 0 || data.code === 200) {
      const coverUrl = data.data?.cover_url || data.cover_url;
      if (coverUrl) {
        // Add the generated cover to the backgrounds list and select it
        const newBackground = { color: coverUrl, isImage: true };
        backgroundOptions.unshift(newBackground);
        selectedBackground.value = newBackground;
      }
    }
  } catch (error) {
    console.error('Error generating AI cover:', error);
  } finally {
    aiGenerating.value = false;
  }
}

function selectBackground(bg: { color: string; isImage?: boolean }) {
  selectedBackground.value = bg;
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
      detectOrientation(localImage.value);
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
      detectOrientation(localImage.value);
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
      detectOrientation(localImage.value);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

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

async function confirm() {
  loading.value = true;
  try {
    if (activeTab.value === "select" && selectedBackground.value) {
      if (selectedBackground.value.isImage) {
        // For AI-generated image covers, use the URL directly
        const coverUrl = selectedBackground.value.color;
        emit("confirm", coverUrl);
        close();
      } else {
        // Generate cover with selected background and edited title
        const coverUrl = await generateCover(selectedBackground.value.color, coverTitle.value);

        // Upload cover to server
        const token = localStorage.getItem("token");
        if (token) {
          // Convert data URL to Blob
          const response = await fetch(coverUrl);
          const blob = await response.blob();
          const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("file", file);

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
            const url = (data?.data && (data.data.url || data.data)) || data?.url;
            if (typeof url === "string") {
              emit("confirm", url);
              close();
            } else {
              emit("confirm", coverUrl);
              close();
            }
          } else {
            emit("confirm", coverUrl);
            close();
          }
        } else {
          emit("confirm", coverUrl);
          close();
        }
      }
    } else if (activeTab.value === "upload" && localImage.value) {
        // Crop the image and upload
        const cropped = await cropToCanvas(localImage.value);
        // Upload the cropped image
        const token = localStorage.getItem("token");
        if (token) {
          // Convert data URL to Blob
          const response = await fetch(cropped);
          const blob = await response.blob();
          const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("file", file);

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
            const url = (data?.data && (data.data.url || data.data)) || data?.url;
            if (typeof url === "string") {
              emit("confirm", url);
              close();
            } else {
              emit("confirm", cropped);
              close();
            }
          } else {
            emit("confirm", cropped);
            close();
          }
        } else {
          emit("confirm", cropped);
          close();
        }
      }
  } catch (error) {
    console.error("Cover upload error:", error);
    if (activeTab.value === "select" && selectedBackground.value) {
      if (selectedBackground.value.isImage) {
        emit("confirm", selectedBackground.value.color);
      } else {
        const coverUrl = await generateCover(selectedBackground.value.color, coverTitle.value);
        emit("confirm", coverUrl);
      }
    } else if (activeTab.value === "upload" && localImage.value) {
      emit("confirm", localImage.value);
    }
    close();
  } finally {
    loading.value = false;
  }
}

async function generateCover(backgroundColor: string, title: string): Promise<string> {
  // Create canvas for cover generation
  const canvas = document.createElement("canvas");
  canvas.width = 600; // 15rem at 40px font size
  canvas.height = 800; // 20rem at 40px font size
  const ctx = canvas.getContext("2d")!;

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw quote mark
  ctx.font = "200px Arial";
  ctx.fillStyle = backgroundColor === "#494949" ? "rgba(255, 247, 198, 0.3)" : "rgba(255, 255, 255, 0.3)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText('"', 60, 60);

  // Draw title
  ctx.font = "40px Arial";
  ctx.fillStyle = backgroundColor === "#494949" ? "#FFF7C6" : "#444550";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split title into lines if too long
  const maxWidth = canvas.width - 40; // 20px margin on each side
  const lines: string[] = [];
  let currentLine = "";

  // Handle Chinese text and English words
  if (/[\u4e00-\u9fa5]/.test(title)) {
    // For Chinese text, split by characters
    for (let i = 0; i < title.length; i++) {
      const char = title[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
  } else {
    // For English text, split by words
    const words = title.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + " " + word : word;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw lines
  const lineHeight = 50;
  const firstLineY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, firstLineY + index * lineHeight);
  });

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
    position: relative;
  }

  .preview-box {
    width: 15rem;
    height: 20rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f5f5;

    &.ai-generating {
      background: linear-gradient( 29deg, #F0F0F0 0%, #F5F5F5 25%, #F0F0F0 50%, #F5F5F5 75%, #F0F0F0 100%), #FCCEE8;
      animation: loading-pulse 1.5s infinite;
    }
  }

  .preview-text{
    width: 15rem;
    height: 20rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .ai-loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-strip {
    width: 80%;
    height: 20%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 4px;
    animation: loading-shift 1.5s infinite;
  }

  .ai-generate-btn-container {
    display: flex;
    justify-content: center;
  }

  .ai-generate-btn {
    position: relative;
    bottom: 0;
    right: -13rem;
    border: 1px solid;
    border-image: linear-gradient(360deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1)) 1 1;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    padding: 1rem;
    cursor: pointer;
    box-shadow: 0px 0px 12px 0px rgba(251,100,182,0.12);
    overflow: hidden;
    z-index: 1;

    /* Gradient text */
    color: transparent;
    background: linear-gradient(90deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
      border-radius: 0.8rem;
      z-index: -1;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .preview-img-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .bg-preview-img {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @keyframes loading-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes loading-shift {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .preview-bg {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;

    &.one{
      .quote-mark, .title-text {
        color: #FFF7C6;
      }
    }
  }

  .quote-mark {
    font-weight: 500;
    font-size: 4rem;
    color: #58474c;
    position: absolute;
    top: 2rem;
    left: 1.8rem;
  }

  .title-input-container {
    position: relative;
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
  }

  .title-text {
    font-weight: 500;
    font-size: 1.2rem;
    color: #58474c;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    max-width: 100%;
    resize: none;
    height: 6rem;
    line-height: 1.6;
  }

  .title-count {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.5rem;
  }

  .placeholder {
    color: #99a1af;
    font-size: 1.4rem;
  }

  .backgrounds-strip {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
    overflow-x: auto;
    width: 100%;

    .background-cell {
      width: 5.4rem;
      height: 7.2rem;
      border-radius: 0.4rem;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid transparent;

      &:nth-of-type(1) {
        .mini-title {
          color: #fff7c6;
        }
      }

      &.selected {
        border-color: #fb64b6;
      }

      .bg-preview {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .mini-title {
        font-weight: 500;
        font-size: 2.4rem;
        color: #444550;
        text-align: center;
        z-index: 1;
      }
    }
  }
}

.upload-mode {
  height: 100%;
  padding: 0.4rem 0;

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
        border: 1px solid #fb64b6;
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
