<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal-content">
      <img src="@/assets/images/base/close.png" class="close-btn" @click="close" />

      <div class="modal-header">
        <div class="tabs">
          <span :class="{ active: activeTab == 'select' }" @click="changeTab('select')">
            {{ t("submit.cover.select") }}
          </span>
          <span :class="{ active: activeTab == 'upload' }" @click="changeTab('upload')">
            {{ t("submit.cover.upload") }}
          </span>
        </div>
      </div>

      <div class="modal-body">
        <!-- Select from Background Colors -->
        <div v-if="activeTab == 'select'" class="tab-content select-mode">
          <div class="preview-container">
            <div class="preview-box" :class="{ 'ai-generating': isLoading }">
              <div class="preview-text" v-if="selectedBackground && !isLoading">
                <div v-if="selectedBackground.isImage" class="preview-img-container">
                  <img
                    :src="selectedBackground.color"
                    class="preview-img"
                    ref="previewImgRef"
                  />
                </div>

                <div
                  v-else
                  class="preview-bg"
                  :class="selectedBackground.color == '#494949' ? 'one' : ''"
                  :style="{ backgroundColor: selectedBackground.color }"
                >
                  <div class="quote-mark">"</div>
                  <div class="title-input-container">
                    <textarea
                      v-model="coverTitle"
                      class="title-text"
                      :maxlength="45"
                      :placeholder="t('submit.titlePlaceholder')"
                      @input="handleTitleInput"
                    ></textarea>
                    <!-- <span class="title-count">{{ coverTitle.length }}/20</span> -->
                  </div>
                </div>
              </div>
              <div v-else-if="!isLoading" class="placeholder">
                {{ t("submit.cover.selectBackground") }}
              </div>
              <div v-else class="ai-loading">
                <div class="skeleton"></div>
              </div>
            </div>
            <div class="ai-generate-btn-container">
              <button class="ai-generate-btn" @click="generateAICover">
                {{ t('submit.cover.aiGenerate') }}/{{ coverCost }} {{ t('submit.cover.power') }}
              </button>
            </div>
          </div>

          <div class="backgrounds-section-box" ref="backgroundsSectionBoxRef">
            <div class="backgrounds-strip" v-if="imageOptions.length > 0" :style="{ justifyContent: hasScrollbar ? 'flex-start' : 'center' }">
              <div
                v-for="(img, index) in imageOptions"
                :key="img.color || index"
                class="background-cell"
                :class="{ selected: selectedBackground && (selectedBackground == img || (selectedBackground.color == img.color && selectedBackground.isImage)) }"
                @click="selectImage(img)"
                :style="{ backgroundColor: '#F5F5F5', border: selectedBackground && (selectedBackground == img || (selectedBackground.color == img.color && selectedBackground.isImage)) ? '1px solid #fb64b6' : '1px solid transparent' }"
              >
                <div class="bg-preview-img" v-if="img.isLoading">
                  <div class="loading-placeholder"></div>
                </div>
                <div class="bg-preview-img" v-else>
                  <img :src="img.color" class="bg-img" />
                </div>
              </div>
            </div>

            <div class="backgrounds-strip" :style="{ justifyContent: hasScrollbar ? 'flex-start' : 'center' }">
              <div
                v-for="(bg, index) in backgroundColorOptions"
                :key="index"
                class="background-cell"
                :class="{ selected: selectedBackground && selectedBackground.color == bg.color && !selectedBackground.isImage }"
                @click="selectBackground(bg)"
                :style="{ backgroundColor: bg.color }"
              >
                <div class="bg-preview">
                  <div class="mini-title">Aa</div>
                </div>
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

        <button class="btn confirm" @click="confirm" :disabled="!selectedBackground && !localImage">
          {{ t("submit.cover.confirm") }}
        </button>
      </div>

    </div>
  </div>

  <UploadMask :visible="loading"></UploadMask>

  <!-- AI Generation Alert Modal -->
  <AIGenerationAlertModal
    :visible="showAlert"
    @cancel="cancelAlert"
    @confirm="confirmAlert"
  />

  <!-- AI Generate Cover Modal -->
  <AIGenerateCoverModal
    :visible="showAIGenerateModal"
    :cover-cost="coverCost"
    :default-prompt="currentPrompt || coverTitle"
    @update:visible="showAIGenerateModal = $event"
    @generation="handleGeneration"
  />

  <!-- Failure Modal -->
  <div v-if="showFailureModal" class="generation-failure-modal">
    <div class="modal-content">
      <p class="modal-message">{{ t('submit.cover.generationFailed') }}</p>
      <p class="modal-message">{{ t('submit.cover.avoidCopyright') }}</p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="handleFailureClose">{{ t('submit.cover.close') }}</button>
        <button class="modal-retry-btn" @click="handleFailureRetry">{{ t('submit.cover.retry') }}</button>
      </div>
    </div>
  </div>

  <!-- Timeout Modal -->
  <div v-if="showTimeoutModal" class="generation-timeout-modal">
    <div class="modal-content">
      <p class="modal-message">{{ t('submit.cover.generationTimeout') }}</p>
      <p class="modal-message">{{ t('submit.cover.noPowerDeducted') }}</p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="handleTimeoutClose">{{ t('submit.cover.close') }}</button>
        <button class="modal-retry-btn" @click="handleTimeoutRetry">{{ t('submit.cover.retry') }}</button>
      </div>
    </div>
  </div>

  <!-- Insufficient Balance Modal -->
  <InsufficientBalanceModal
    :visible="showInsufficientBalanceModal"
    @cancel="showInsufficientBalanceModal = false"
    @recharge="goRecharge"
  />

  <!-- Cover Edit Confirmation Modal -->
  <CoverEditConfirmModal
    :visible="showCoverEditConfirmModal"
    @cancel="cancelCoverEditConfirm"
    @confirm="confirmCoverEditExit"
  />

</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from "vue";
import { useRoute } from 'vue-router';
import router from "@/router";
import { useI18n } from "vue-i18n";
import InsufficientBalanceModal from "./InsufficientBalanceModal.vue";
import { baseUrl } from "@/util/config";
import UploadMask from "./UploadMask.vue";
import AIGenerateCoverModal from "./AIGenerateCoverModal.vue";
import AIGenerationAlertModal from "./AIGenerationAlertModal.vue";
import CoverEditConfirmModal from "./CoverEditConfirmModal.vue";
import api from "@/api/index";
import { toast } from "@/util/toast";

const props = defineProps<{
  visible: boolean;
  title: string;
  currentCover?: string;
  projectCover?: string;
  hasTitleGeneratedCover?: boolean;
  coverColor?: string;
  coverTitle?: string;
}>();

const emit = defineEmits(["update:visible", "confirm"]);
const { t, locale } = useI18n();

const activeTab = ref("select"); // select | upload
const selectedBackground = ref<{ color: string; isImage?: boolean; backgroundColor?: string; isLoading?: boolean } | null>({ color: "#FCCEE8" }); // Default to pink background
const localImage = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);
const previewImgRef = ref<HTMLImageElement | null>(null);
const backgroundsSectionBoxRef = ref<HTMLElement | null>(null);
const coverTitle = ref(props.title); // Editable title for cover
const loading = ref(false); // Loading state for upload
const coverCost = ref(''); // Cost for AI cover generation
const isMounted = ref(true); // Track if component is mounted
const hasScrollbar = ref(false); // Track if backgrounds-section-box has scrollbar

// Computed loading state
const isLoading = computed(() => selectedBackground.value?.isLoading || false);
const showAlert = ref(false); // Track if AI generation alert should be shown
const showAIGenerateModal = ref(false);
const showFailureModal = ref(false);
const showTimeoutModal = ref(false);
const showInsufficientBalanceModal = ref(false);
const showCoverEditConfirmModal = ref(false);
const currentPrompt = ref(''); // Track if AI generate modal should be shown

// Watch for visible changes to fetch cover cost and handle current cover
watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchCoverCost();
    // Handle cover color if provided and it's not the default color
    if (props.coverColor && props.coverColor != "#FCCEE8") {
      // Select the corresponding background color
      const bgOption = backgroundColorOptions.value.find(bg => bg.color == props.coverColor);
      if (bgOption) {
        selectedBackground.value = bgOption;
        // Update coverTitle if provided
        if (props.coverTitle) {
          coverTitle.value = props.coverTitle.substring(0, 45);
        }
      } else {
        // If the color is not in the predefined options, create a new option
        const newBgOption = { color: props.coverColor };
        selectedBackground.value = newBgOption;
        // Update coverTitle if provided
        if (props.coverTitle) {
          coverTitle.value = props.coverTitle.substring(0, 45);
        }
      }
      // Don't add currentCover to imageOptions when coverColor is provided
      // This ensures only the color is selected in the color list and the title is echoed
      return;
    }
    // Handle title-generated cover
    if (props.hasTitleGeneratedCover) {
      // Select the pink background for title-generated covers
      const pinkBgColor = "#FCCEE8";
      const bgOption = backgroundColorOptions.value.find(bg => bg.color == pinkBgColor);
      if (bgOption) {
        selectedBackground.value = bgOption;
      }
    } else if (props.currentCover) {
      // Handle current cover if provided
      // Check if current cover is a base64 data URL (canvas-generated)
      if (props.currentCover.startsWith('data:image/')) {
        // For canvas-generated covers, select the corresponding background color
        // The generateCoverFromTitle function uses #FCCEE8 as background
        const canvasBgColor = "#FCCEE8";
        const bgOption = backgroundColorOptions.value.find(bg => bg.color == canvasBgColor);
        if (bgOption) {
          selectedBackground.value = bgOption;
        }
      } else {
        // For non-base64 covers, add to image options
        // Check if current cover is already in imageOptions
        const existingIndex = imageOptions.value.findIndex(img => img.color == props.currentCover);
        if (existingIndex == -1) {
          const currentCoverOption = { color: props.currentCover, isImage: true, backgroundColor: "#F5F5F5" };
          imageOptions.value.unshift(currentCoverOption);
          selectedBackground.value = currentCoverOption;
        } else {
          // If already exists, select it
          selectedBackground.value = imageOptions.value[existingIndex];
        }
      }
    }

    // Handle project cover if provided and different from current cover
    if (props.projectCover && props.projectCover != props.currentCover) {
      // Check if project cover is already in imageOptions
      const projectCoverIndex = imageOptions.value.findIndex(img => img.color == props.projectCover);
      if (projectCoverIndex == -1) {
        // Add project cover to the beginning of imageOptions
        const projectCoverOption = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
        imageOptions.value.unshift(projectCoverOption);
      }
    }
  }
});

// Watch for title changes to update coverTitle
watch(() => props.title, (newVal) => {
  coverTitle.value = newVal.substring(0, 45);
});

// Watch for projectCover changes to update imageOptions
watch(() => props.projectCover, (newVal) => {
  if (newVal && newVal != props.currentCover) {
    // Check if project cover is already in imageOptions
    const projectCoverIndex = imageOptions.value.findIndex(img => img.color == newVal);
    if (projectCoverIndex == -1) {
      // Add project cover to the beginning of imageOptions
      const projectCoverOption = { color: newVal, isImage: true, backgroundColor: "#F5F5F5" };
      imageOptions.value.unshift(projectCoverOption);
    }
  }
});

// Crop related variables
const imgOffsetY = ref(0);
const imgOffsetX = ref(0);
const imgScale = ref(1);
const isImgDragging = ref(false);
const lastY = ref(0);
const lastX = ref(0);

// Calculate crop dimensions - target 900x1200
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

// Background color options
const backgroundColorOptions = ref([
  { color: "#494949" }, // Pink
  { color: "#BDFFF9" }, // Blue
  { color: "#FCCEE8" }, // Purple
  { color: "#CEF0FE" }, // Green
  { color: "#FFF7C6" }, // Orange
]);

// Image options (AI generated or uploaded)
const imageOptions = ref<{ color: string; isImage: boolean; backgroundColor?: string; isLoading?: boolean }[]>([]);

// Check if there's an active AI generation
const hasActiveGeneration = computed(() => imageOptions.value.some(img => img.isLoading));

function changeTab(tab: string) {
  if (localImage.value) {
    localImage.value = null;
  }
  activeTab.value = tab;
}

// Fetch cover cost estimate
async function fetchCoverCost() {
  try {
    const res = await api.userBalance() as any;
    if (res.code == 0 || res.code == 200) {
      coverCost.value = res.data?.single_image_cost ? res.data.single_image_cost.toString() : '';
    } else {
      toast(res.message);
    }
  } catch (error) {
    console.error('Error fetching cover cost:', error);
    coverCost.value = '';
  }
}

// Generate AI cover
async function generateAICover() {
  try {
    // Check user balance first
    const balanceResponse = await api.userBalance() as any;
    if (balanceResponse.code == 200) {
      const userBalance = balanceResponse.data?.balance || 0;
      const freezeRate = balanceResponse.data?.freeze_rate || 1;

      // Calculate required power and round to nearest integer
      const coverCostNum = parseFloat(coverCost.value) || 0;
      const requiredPower = Math.round(freezeRate * coverCostNum);

      if (userBalance < requiredPower) {
        showInsufficientBalanceModal.value = true;
      } else {
        showAIGenerateModal.value = true;
      }
    } else {
      console.error('Error fetching user balance:', balanceResponse);
    }
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

// Polling timer for cover generation
let pollTimer: number | null = null;

// Poll for cover generation result
async function pollCoverResult(taskId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Poll every 3 seconds
    pollTimer = window.setInterval(async () => {
      try {
        const pollResponse = await api.taskGgenerateCover(taskId) as any;

        if (pollResponse.code == 200 && pollResponse.data) {
          const status = pollResponse.data.status;

          if (status == 'SUCCESS') {
            // Success, get cover URL
            const coverUrl = pollResponse.data.result?.generate_novel_cover_by_prompt;
            if (coverUrl) {
              if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
              }
              resolve(coverUrl);
            }
          } else if (status == 'FAIL') {
            // Failed
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
            reject(new Error('fail'));
          }
          // If status is DOING, continue polling
        }
      } catch (error) {
        console.error('Error polling cover:', error);
      }
    }, 3000);
  });
}

// Handle generation event
async function handleGeneration(prompt: string) {
  try {
    showAIGenerateModal.value = false;
    currentPrompt.value = prompt;

    // Add loading placeholder to image options
    const loadingPlaceholder = { color: "", isImage: true, isLoading: true, backgroundColor: "#F5F5F5" };
    imageOptions.value.unshift(loadingPlaceholder);
    // Select the loading placeholder
    selectedBackground.value = loadingPlaceholder;

    // Step 1: Call generateCover API to get task_id
    const response = await api.generateCover({
      prompt: prompt
    }) as any;

    if (response.code != 200) {
      // Handle initial API failure
      const index = imageOptions.value.findIndex(img => img.isLoading);
      if (index !== -1) { imageOptions.value.splice(index, 1);
        if (selectedBackground.value?.isLoading) {
          if (props.projectCover) {
            const projectCoverObj = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
            selectedBackground.value = projectCoverObj;
          } else {
            selectedBackground.value = null;
          }
        }
      }
      showFailureModal.value = true;
      return;
    }

    // Get task_id from response
    const taskId = response.data?.task_id;
    if (!taskId) {
      const index = imageOptions.value.findIndex(img => img.isLoading);
      if (index !== -1) {
        imageOptions.value.splice(index, 1);
        if (selectedBackground.value?.isLoading) {
          if (props.projectCover) {
            const projectCoverObj = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
            selectedBackground.value = projectCoverObj;
          } else {
            selectedBackground.value = null;
          }
        }
      }
      showFailureModal.value = true;
      return;
    }

    // Step 2: Poll for result
    const coverUrl = await pollCoverResult(taskId);

    // Step 3: Update UI with generated cover
    const index = imageOptions.value.findIndex(img => img.isLoading);
    if (index !== -1) {
      const newImage = { color: coverUrl, isImage: true, backgroundColor: "#F5F5F5" };
      imageOptions.value[index] = newImage;
      selectedBackground.value = newImage;
    }
  } catch (error: any) {
    console.error('Error generating AI cover:', error);
    // Clear polling timer if exists
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    // Remove loading placeholder on error
    const index = imageOptions.value.findIndex(img => img.isLoading);
    if (index !== -1) {
      imageOptions.value.splice(index, 1);
      if (selectedBackground.value?.isLoading) {
        if (props.projectCover) {
          const projectCoverObj = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
          selectedBackground.value = projectCoverObj;
        } else {
          selectedBackground.value = null;
        }
      }
    }
    if (error.name == 'AbortError') {
      showTimeoutModal.value = true;
    } else {
      showFailureModal.value = true;
    }
  }
}

function selectBackground(bg: { color: string; isImage?: boolean }) {
  selectedBackground.value = bg;
  // Reset image crop when selecting a background color
  imgOffsetY.value = 0;
  imgOffsetX.value = 0;
  imgScale.value = 1;
}

function selectImage(img: { color: string; isImage: boolean; backgroundColor?: string; isLoading?: boolean }) {
  selectedBackground.value = img;
  // Reset image crop when selecting a new image
  imgOffsetY.value = 0;
  imgOffsetX.value = 0;
  imgScale.value = 1;
  // Detect image orientation and set initial scale (only if not loading)
  if (img.color && !img.isLoading) {
    detectOrientation(img.color);
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
      // Reset offset before loading new image
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 1;
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
      // Reset offset before loading new image
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 1;
      localImage.value = e.target?.result as string;
      detectOrientation(localImage.value);
    };
    reader.readAsDataURL(file);
  }
}

function close() {
  // Check if AI is generating cover or has generated cover
  if (hasActiveGeneration.value) {
    showCoverEditConfirmModal.value = true;
  } else {
    emit("update:visible", false);
    activeTab.value = 'select';
    localImage.value = null;
  }
}

function cancelAlert() {
  showAlert.value = false;
}

function confirmAlert() {
  showAlert.value = false;
  // Remove loading placeholder if exists
  const index = imageOptions.value.findIndex(img => img.isLoading);
  if (index !== -1) {
    imageOptions.value.splice(index, 1);
  }
  // If this was the selected item, clear the selection
  if (selectedBackground.value?.isLoading) {
    selectedBackground.value = null;
  }
  emit("update:visible", false);
  activeTab.value = 'select';
  localImage.value = null;
}

function goRecharge(){
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-recharge');
  showInsufficientBalanceModal.value = false;
};

// Handle cover edit confirmation
function cancelCoverEditConfirm() {
  showCoverEditConfirmModal.value = false;
}

function confirmCoverEditExit() {
  showCoverEditConfirmModal.value = false;
  // Remove loading placeholder if exists
  const index = imageOptions.value.findIndex(img => img.isLoading);
  if (index !== -1) {
    imageOptions.value.splice(index, 1);
  }
  // Clear selected background
  selectedBackground.value = null;
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
      // Reset offset before loading new image
      imgOffsetY.value = 0;
      imgOffsetX.value = 0;
      imgScale.value = 1;
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
  // Apply the offset to the image element
  imgEl.style.transform = `translate(${imgOffsetX.value}px, ${imgOffsetY.value}px) scale(${imgScale.value})`;
}

async function detectOrientation(dataUrl: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));

  const { width: CROP_W, height: CROP_H } = cropDimensions.value;

  const scaleByWidth = CROP_W / img.naturalWidth;
  
  // 始终按宽度占满裁剪框，高度方向可以上下拖动
  imgScale.value = scaleByWidth;

  // Ensure image is not enlarged beyond original size
  // 如果缩放比例大于1（原图小于裁剪框），保持原尺寸不放大
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

  const canvas = document.createElement("canvas");
  canvas.width = actualSw;
  canvas.height = actualSh;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, actualSx, actualSy, actualSw, actualSh, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 1.0);
}

async function confirm() {
  // Only show alert if AI is still generating, not if it's already generated
  if (hasActiveGeneration.value && selectedBackground.value?.isLoading) {
    showAlert.value = true;
    return;
  }
  loading.value = true;
  try {
    if (activeTab.value == "select" && selectedBackground.value) {
      if (selectedBackground.value.isImage) {
        // For AI-generated image covers, use the URL directly
        const coverUrl = selectedBackground.value.color;
        emit("confirm", { url: coverUrl, hasBackground: false, color: "", title: "" });
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

          const authHeaders = window.AntiCrawler.generateAuthParams(token);

          const parma = {
            method: "POST",
            headers: {
              token: token,
              ...authHeaders,
            },
            body: formData,
          };

          const res = await fetch(baseUrl + "/user/uploadImage", parma);
          const data = await res.json();
          if (data.code == 0 || data.code == 200) {
            const url = (data?.data && (data.data.url || data.data)) || data?.url;
            if (typeof url == "string") {
              emit("confirm", { url, hasBackground: true, color: selectedBackground.value.color, title: coverTitle.value });
              close();
            } else {
              emit("confirm", { url: coverUrl, hasBackground: true, color: selectedBackground.value.color, title: coverTitle.value });
              close();
            }
          } else {
            emit("confirm", { url: coverUrl, hasBackground: true, color: selectedBackground.value.color, title: coverTitle.value });
            close();
          }
        } else {
          emit("confirm", { url: coverUrl, hasBackground: true, color: selectedBackground.value.color, title: coverTitle.value });
          close();
        }
      }
    } else if (activeTab.value == "upload" && localImage.value) {
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

          const authHeaders = window.AntiCrawler.generateAuthParams(token);

          const parma = {
            method: "POST",
            headers: {
              token: token,
              ...authHeaders,
            },
            body: formData,
          };

          const res = await fetch(baseUrl + "/user/uploadImage", parma);
          const data = await res.json();
          if (data.code == 0 || data.code == 200) {
            const url = (data?.data && (data.data.url || data.data)) || data?.url;
            if (typeof url == "string") {
              emit("confirm", { url, hasBackground: false, color: "", title: "" });
              close();
            } else {
              emit("confirm", { url: cropped, hasBackground: false, color: "", title: "" });
              close();
            }
          } else {
            emit("confirm", { url: cropped, hasBackground: false, color: "", title: "" });
            close();
          }
        } else {
          emit("confirm", { url: cropped, hasBackground: false, color: "", title: "" });
          close();
        }
      }
  } catch (error) {
    console.error("Cover upload error:", error);
    if (activeTab.value == "select" && selectedBackground.value) {
      if (selectedBackground.value.isImage) {
        emit("confirm", { url: selectedBackground.value.color, hasBackground: false, color: "", title: "" });
      } else {
        const coverUrl = await generateCover(selectedBackground.value.color, coverTitle.value);
        emit("confirm", { url: coverUrl, hasBackground: true, color: selectedBackground.value.color, title: coverTitle.value });
      }
    } else if (activeTab.value == "upload" && localImage.value) {
      emit("confirm", { url: localImage.value, hasBackground: false, color: "", title: "" });
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
  ctx.fillStyle = backgroundColor == "#494949" ? "#FFF7C6" : "#58474C";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText('"', 100, 80);

  // Draw title
  ctx.font = "60px Arial";
  ctx.fillStyle = backgroundColor == "#494949" ? "#FFF7C6" : "#58474C";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split title into lines if too long
  const maxWidth = canvas.width - 200;
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
  const lineHeight = 90;
  const firstLineY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, firstLineY + index * lineHeight);
  });

  return canvas.toDataURL("image/jpeg", 0.9);
}

function handleFailureClose() {
  showFailureModal.value = false;
  // Select project cover if available
  if (props.projectCover) {
    const projectCoverObj = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
    selectedBackground.value = projectCoverObj;
  } else if (props.coverColor) {
    // If no project cover, use coverColor if provided
    const bgOption = backgroundColorOptions.value.find(bg => bg.color == props.coverColor);
    if (bgOption) {
      selectedBackground.value = bgOption;
    } else {
      // If color not in predefined options, create a new one
      selectedBackground.value = { color: props.coverColor };
    }
  } else {
    // If no project cover or coverColor, select default background
    const defaultBgColor = "#FCCEE8";
    const bgOption = backgroundColorOptions.value.find(bg => bg.color == defaultBgColor);
    if (bgOption) {
      selectedBackground.value = bgOption;
    }
  }
}

function handleTimeoutClose() {
  showTimeoutModal.value = false;
  // Select project cover if available
  if (props.projectCover) {
    const projectCoverObj = { color: props.projectCover, isImage: true, backgroundColor: "#F5F5F5" };
    selectedBackground.value = projectCoverObj;
  } else if (props.coverColor) {
    // If no project cover, use coverColor if provided
    const bgOption = backgroundColorOptions.value.find(bg => bg.color == props.coverColor);
    if (bgOption) {
      selectedBackground.value = bgOption;
    } else {
      // If color not in predefined options, create a new one
      selectedBackground.value = { color: props.coverColor };
    }
  } else {
    // If no project cover or coverColor, select default background
    const defaultBgColor = "#FCCEE8";
    const bgOption = backgroundColorOptions.value.find(bg => bg.color == defaultBgColor);
    if (bgOption) {
      selectedBackground.value = bgOption;
    }
  }
}

async function handleFailureRetry() {
  showFailureModal.value = false;
  // Check balance before retrying
  await generateAICover();
}

async function handleTimeoutRetry() {
  showTimeoutModal.value = false;
  // Check balance before retrying
  await generateAICover();
}

// Handle title input to check length and truncate to 45 characters
function handleTitleInput() {
  if (coverTitle.value.length > 45) {
    coverTitle.value = coverTitle.value.substring(0, 45);
    toast(t('submit.cover.maxLength'));
  }
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
  z-index: 600;
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.6rem;
  }

  .skeleton {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .ai-generate-btn-container {
    position: absolute;
    bottom: 0;
    left: 17rem;
    width: max-content;
    display: flex;
    justify-content: center;
    border-radius: 0.8rem;
    background: linear-gradient( 90deg, rgba(194, 122, 255, 0.07) 0%, rgba(255, 127, 250, 0.07) 50%, rgba(251, 100, 243, 0.07) 100%);
    box-shadow: 0px 0px 12px 0px rgba(251,100,182,0.12);
    overflow: hidden;
    z-index: 1;
    cursor: pointer;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      background: linear-gradient(360deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1));
      z-index: -1;
      padding: 1px;
      -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
      mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
      -webkit-mask-composite: destination-out;
      mask-composite: exclude;
    }
  }

  .ai-generate-btn {
    font-size: 1.4rem;
    padding: 1rem;
    color: transparent;
    background: linear-gradient(135deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    cursor: pointer;

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
    border-radius: 0.4rem;
  }

  .bg-img {
    width: 100%;
    height: 100%;
    border-radius: 0.4rem;
    object-fit: cover;
  }

  .loading-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #fb64b6;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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
    top: 1.6rem;
    left: 1.8rem;
  }

  .title-input-container {
    position: relative;
    width: 75%;
    display: flex;
    flex-direction: column;
    padding-top: 5rem;
    z-index: 1;
  }

  .title-text {
    font-weight: 500;
    font-size: 1.4rem;
    color: #58474c;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    max-width: 100%;
    resize: none;
    height: 13rem;
    line-height: 1.5;
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

  .backgrounds-section-box{
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    overflow-x: auto;
  }

  .backgrounds-section {
    margin-bottom: 2rem;

    .section-title {
      font-size: 1.4rem;
      color: #364153;
      margin-bottom: 1rem;
      font-weight: 500;
    }
  }

  .backgrounds-strip {
    display: flex;
    justify-content: flex-start;
    gap: 0.8rem;

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

/* Generation Failure Modal */
.generation-failure-modal,
.generation-timeout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 700;

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 52rem;
    background-color: #ffffff;
    border-radius: 1.2rem;
    padding: 5.4rem 2.4rem 2.4rem;

    .modal-message {
      font-size: 1.4rem;
      color: #6A7282;
      margin-bottom: 1.2rem;
      text-align: center;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 2.4rem;
      margin-top: 2.4rem;

      .modal-cancel-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .modal-retry-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        border: none;
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
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>
