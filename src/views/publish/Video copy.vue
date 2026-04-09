<template>
  <div class="submit-video" :class="uploadSuccess ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/publish/back.png" alt="" v-if="uploadSuccess" />
        <img src="@/assets/images/base/back.png" alt="" v-else />
      </div>

      <!-- <div class="tabs">
        <span
          :class="tabIndex == index ? 'on' : ''"
          v-for="(tab, index) in tabList"
          :key="index"
          @click="changeTab(tab, index)"
        >
          {{ tab.name }}
          <b></b>
        </span>
      </div> -->

      <!-- Video Upload Section -->
      <div class="section-video">
        <!-- Upload Status Area -->
         <div v-if="uploadSuccess">
          <div class="form-label-box">
            <span><b>*</b>{{t('submit.tabs.video') }}</span>
          </div>

          <div class="upload-status-box">
            <div class="status-header">
              <div class="status-info" :class="{ success: uploadSuccess && !isUpload, error: uploadError && !isUpload }">
                <span class="status-text">
                  {{
                    uploadSuccess && !isUpload
                      ? t("submit.video.uploadSuccess")
                      : uploadError && !isUpload
                        ? t("submit.video.uploadFailed")
                        : t("submit.video.uploading")
                  }}
                </span>
                <div class="video-meta-box">
                  {{ t("submit.video.format") }}:{{ videoType || 'mp4' }}
                  <span class="video-meta" v-if="(uploadSuccess || uploadError || isUpload) && !postId && !route.query.url">
                    {{ t("submit.video.size") }}:
                    >{{ videoSize }}MB {{ t("submit.video.duration") }}:{{ videoDuration }}s
                  </span>
                </div>
              </div>
              <div class="status-actions">
                <span class="action-link play" v-if="uploadSuccess" @click="previewVideo">{{
                  t("submit.video.playBtn")
                }}</span>

                <div class="reupload-video-box" @click="reuploadVideo">
                  <span class="action-link reupload">{{
                    t("submit.video.reuploadBtn")
                  }}</span>

                  <input
                    ref="reuploadInputRef"
                    type="file"
                    accept="video/mp4,video/MOV,video/AVI"
                    class="reupload-file"
                    title=""
                    @change="onVideoPicked"
                  />
                </div>
              </div>
            </div>
            <div class="status-progress-bar">
              <div
                class="progress-fill"
                :class="{ success: uploadSuccess, error: uploadError, uploading: isUpload }"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Default Upload Area -->
         <div v-else>
          <div class="upload-title">
            {{t('submit.tabs.video') }}
          </div>

          <div class="upload-area-box">
            <div class="upload-area" @dragover.prevent @drop.prevent="onDropFile">
              <div class="upload-info">
                <p>{{ t("submit.video.uploadCta") }}</p>
                <button class="btn" @click="pickVideo">{{ t("submit.video.uploadBtn") }}</button>
              </div>
              <div class="upload-spec">
                <div class="upload-spec-item">
                  <span class="upload-spec-title">{{ t("submit.video.specFormat") }}</span>
                  <span>{{ t("submit.video.formatInfo") }}</span>
                </div>
                <div class="upload-spec-item">
                  <span class="upload-spec-title">{{ t("submit.video.specSize") }}</span>
                  <div class="upload-spec-info">
                    <span>{{ t("submit.video.sizeInfo1") }}</span>
                    <span>|</span>
                    <span>{{ t("submit.video.sizeInfo2") }}</span>
                  </div>
                </div>
                <div class="upload-spec-item">
                  <span class="upload-spec-title">{{ t("submit.video.specResolution") }}</span>
                  <span>{{ t("submit.video.resolutionInfo") }}</span>
                </div>
              </div>
              <input
                ref="videoInputRef"
                type="file"
                accept="video/mp4,video/MOV,video/AVI"
                class="hidden-file"
                title=""
                @change="onVideoPicked"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Rest of Content - Visible after successful upload or in edit mode -->
      <div class="content-wrapper" v-if="uploadSuccess || postId">
        <!-- Permission Range -->
        <div class="section">
          <div class="form-item">
            <div class="perm-box">
              <label class="form-label">{{ t("submit.permission") }}:</label>
              <div class="perm-options">
                <div
                  class="perm-option"
                  v-for="(opt, index) in permOptions"
                  :key="opt.key"
                  @click="handlePermissionChange(opt.key, index)"
                >
                  <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                  <span>{{ t(opt.labelKey) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover Image -->
        <div class="section">
          <div class="form-item">
            <label class="form-label"><b>*</b>{{ t("submit.coverLabel") }}</label>
            <div class="cover-row">
              <div class="cover-box">
                <img v-if="coverPreview" :src="coverPreview" alt="" />
                <img v-else src="@/assets/images/base/cover.png" alt="" />
              </div>
              <div class="reupload-box">
                <button class="reupload" @click="pickCover">{{ t("submit.cover.set") }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Caption -->
        <div class="section">
          <div class="form-item">
            <label class="form-label">{{ t("submit.titleLabel") }}</label>
            <div class="caption-container">
              <div class="input-wrap">
                <input
                  v-model="form.title"
                  class="title-input"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :placeholder="t('submit.titlePlaceholder')"
                />
                <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
              </div>
              <div class="caption-line"></div>
              <div class="textarea-wrap">
                <div
                  ref="captionRef"
                  class="description-content"
                  contenteditable="true"
                  :placeholder="t('submit.descriptionPlaceholder')"
                  @input="handleCaptionInput"
                  @keydown="handleCaptionKeydown"
                  @click="handleCaptionClick"
                  @blur="onCaptionBlur"
                  @paste="handlePaste"
                ></div>
              </div>

              <div class="caption-actions-box">
                <div class="caption-actions">
                  <button class="action-btn" @click="onActionBtnClick('#')">
                    #{{ t("submit.topic") }}
                  </button>
                  <button class="action-btn" @click="onActionBtnClick('@')">
                    @{{ t("submit.mention") }}
                  </button>
                </div>

                <span class="char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
              </div>
            </div>

            <!-- Mention/Topic Dropdown -->
            <div
              v-if="showDropdown"
              class="mention-dropdown"
              :style="{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }"
            >
              <!-- <div class="dropdown-header">
                {{ dropdownType === "#" ? t("submit.topic") : t("submit.mention") }}
              </div> -->
              <div class="dropdown-list">
                <div
                  v-for="item in dropdownItems"
                  :key="item.value"
                  class="dropdown-item"
                  @click="selectDropdownItem(item)"
                >
                  <div class="item-left">
                    <img v-if="dropdownType === '@'" :src="item.avatar" class="avatar" alt="" />
                    <span class="label">{{ item.label }}</span>
                  </div>
                  <div class="item-right">
                    <span class="stats">
                      {{
                        dropdownType === "#" ? `${item.views} views` : `${item.followers} followers`
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sensitive Content -->
        <div class="section">
          <div class="form-item">
            <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>
            <div class="sensitive-options" :class="{ disabled: postId }">
              <div class="option" @click="toggleSensitive('yes')" :class="{ disabled: postId }">
                <img :src="form.content === 'yes' ? selectActive : select" alt="" />
                <span>{{ t("submit.yes") }}</span>
              </div>
              <div class="option" @click="toggleSensitive('no')" :class="{ disabled: postId }">
                <img :src="form.content === 'no' ? selectActive : select" alt="" />
                <span>{{ t("submit.no") }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="submit-row">
          <button class="submit" :class="!canSubmit ? 'dis' : ''" :disabled="!canSubmit" @click="onSubmit">
            {{ t("submit.submit") }}
          </button>
        </div>
        <div class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span class="agreement-text"
            >{{ t("submit.agree") }}<a href="javascript:void(0)" @click="openCommunityConvention">{{ t("submit.terms") }}</a></span
          >
        </div>
      </div>
    </div>

    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
    />

    <ConfirmLeaveModal :show="isShowConfirm" @confirm="confirmLeave" @cancel="cancelLeave" />

    <PreviewModal
      :visible="showPreviewModal"
      :videoUrl="videoPreviewUrl"
      @close="showPreviewModal = false"
    />

    <SetCoverModal
      v-model:visible="showCoverModal"
      :video-file="videoFile"
      :video-url="videoUrl"
      :cover-url="coverPreview"
      :extract-all-frames="true"
      @confirm="onCoverConfirmed"
    />

    <CustomToast :visible="toastShow" :message="toastMsg" :icon="toastIcon" :theme="toastTheme" />

    <!-- Upload Mask -->
    <UploadMask :visible="isUpload"></UploadMask>
  </div>
</template>

<script setup lang="ts" name="PublishVideo">
import Header from "@/components/Header.vue";
import SetCoverModal from "@/components/SetCoverModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import CustomToast from "@/components/CustomToast.vue";
import UploadMask from "@/components/UploadMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import api from "@/api/index";
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import router from "@/router";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import { baseUrl } from "@/util/config";

const isEditing = computed(() => !!postId.value);

const { t, locale } = useI18n();

// State
const isUpload = ref(false);
const uploadSuccess = ref(false);
const uploadError = ref("");
const uploadProgress = ref(0);
const videoSize = ref(0);
const videoDuration = ref(0);
const videoType = ref("");
const videoFile = ref<File | null>(null);
const videoUrl = ref("");
const coverPreview = ref("");
const showCoverModal = ref(false);
const agreeTerms = ref(false);
const sessionId = ref("");

const videoInputRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const captionRef = ref<HTMLDivElement | null>(null);

// Check if in edit mode
const route = useRoute();
const postId = ref(route.query.post_id as string);

const showPreviewModal = ref(false);
const videoPreviewUrl = ref("");

const isShowConfirm = ref(false);
const pendingRoute = ref<{ path: string } | null>(null);
const tabIndex = ref(0);
const tabList = ref([
  { name: t("submit.tabs.video"), path: "/publish/video" },
  { name: t("submit.tabs.image"), path: "/publish/comic" },
  { name: t("submit.tabs.article"), path: "/publish/novel" },
]);

const TITLE_MAX = 100;
const DESC_MAX = 4000;

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
});

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

// Dropdown state
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);

const showSensitiveConfirm = ref(false);

const toastShow = ref(false);
const toastMsg = ref("");
const toastIcon = ref("");
const toastTheme = ref("pink");
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const userRegion = ref(false);
const hasActiveSubscription = ref(false);
const isAdult = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

// Computed
const captionLength = ref(0);
const canSubmit = computed(() => {
  return uploadSuccess.value && coverPreview.value && agreeTerms.value;
});

// Check subscription status on page load
async function checkSubscriptionStatus() {
  try {
    const response = await api.getSubscription();
    const data = response as unknown as { code: number; msg: string; data?: any };

    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = subscription && subscription.plan && parseFloat(subscription.plan.price) > 0;
    }
  } catch (error) {
    console.error("Subscription check error:", error);
    hasActiveSubscription.value = false;
  }
}

// Methods
function goBack() {
  const isVideoFromUrl = !!route.query.url;

  if (videoFile.value || form.value.title || captionLength.value > 0 || isVideoFromUrl) {
    isShowConfirm.value = true;
    return;
  }
  router.go(-1);
}

// function changeTab(item: { path: string }, index: number) {
//   if (tabIndex.value === index) return;
//   if (videoFile.value || form.value.title || captionLength.value > 0) {
//     pendingRoute.value = item;
//     isShowConfirm.value = true;
//     return;
//   }
//   tabIndex.value = index;
//   router.push(item.path);
// }

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      console.log()
    }
  }).catch(err => {
    console.log(err);
  })
}

function confirmLeave() {
  if (pendingRoute.value) {
    router.push(pendingRoute.value.path);
  } else {
    router.go(-1);
  }
}

function cancelLeave() {
  isShowConfirm.value = false;
}

function handleUserInfoLoaded(userInfo: any) {
  if (userInfo) {
    isAdult.value = userInfo.is_adult == 1;
  }
}

async function startFakeUpload(file: File) {
  videoFile.value = file;
  uploadProgress.value = 0;
  isUpload.value = true;

  try {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        videoSize.value = parseFloat((file.size / (1024 * 1024)).toFixed(1));
        videoDuration.value = Math.round(video.duration);
        // Extract video type from file extension
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        videoType.value = extension;
        resolve(true);
      };
    });

    // const filenameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const videoIdResponse = await api.getVideoId({ filename: file.name }) as any;
    if (!videoIdResponse || videoIdResponse.code !== 0) {
      isUpload.value = false;
      toast(t('fail'));
      return false;
    }

    uploadProgress.value = 30;
    const { uploadId, fileKey } = videoIdResponse.data;

    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const uploadedParts = [];

    for (let i = 1; i <= totalParts; i++) {
      const start = (i - 1) * CHUNK_SIZE;
      const end = Math.min(i * CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const videoUrlResponse = await api.getVideoUrl({ uploadId, fileKey, partNumber: i }) as any;
      if (!videoUrlResponse || videoUrlResponse.code !== 0) {
        isUpload.value = false;
        toast(t('fail'));
        return false;
      }

      uploadProgress.value = 60;
      const presignedUrl = videoUrlResponse.data.url;

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: chunk
      });

      if (!uploadRes.ok) {
        isUpload.value = false;
        toast(t('fail'));
        return false;
      }

      const etag = uploadRes.headers.get('etag')?.replace(/"/g, '') || '';
      uploadedParts.push({ PartNumber: i, ETag: etag });

      uploadProgress.value = Math.round((i / totalParts) * 100);
    }

    const videoMergeResponse = await api.getVideoMerge({ uploadId, fileKey, parts: uploadedParts }) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      isUpload.value = false;
      toast(t('fail'));
      return false;
    }

    videoUrl.value = videoMergeResponse.data.url || '';

    uploadSuccess.value = true;
    isUpload.value = false;

    await captureFirstFrame(file);
  } catch (error) {
    console.error("Video upload error:", error);
    isUpload.value = false;
    toast(t('fail'));
  }
}

async function captureFirstFrame(file: File) {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.crossOrigin = "anonymous";

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
      resolve(true);
    };
  });

  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg");

  await mockUploadCover(dataUrl);

  URL.revokeObjectURL(video.src);
}

async function mockUploadCover(dataUrl: string) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
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
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === "string") {
        coverPreview.value = url;
      }
    } else {
      coverPreview.value = dataUrl;
    }
  } catch (error) {
    console.error("Cover upload error:", error);

    coverPreview.value = dataUrl;
  }
}

function pickVideo() {
  videoInputRef.value?.click();
}

function reuploadVideo() {
  reuploadInputRef.value?.click();
}

async function onVideoPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await startFakeUpload(file);
  }
  input.value = "";
}

async function onDropFile(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file) await startFakeUpload(file);
}

function previewVideo() {
  if (videoFile.value) {
    videoPreviewUrl.value = URL.createObjectURL(videoFile.value);
    showPreviewModal.value = true;
  } else if (videoUrl.value) {
    videoPreviewUrl.value = videoUrl.value;
    showPreviewModal.value = true;
  }
}

function pickCover() {
  showCoverModal.value = true;
}

function toggleSensitive(val: "yes" | "no") {
  if (postId.value) return;
  if (form.value.content === val) return;

  const dontAsk = localStorage.getItem('sensitiveDontAsk');

  if (val == 'yes') {
    if (dontAsk == '1') {
      form.value.content = val;
    } else {
      showSensitiveConfirm.value = true;
    }
  } else {
    form.value.content = val;
  }
}

async function handlePermissionChange(permission: string, index: number) {
  if (index == 1 && !hasActiveSubscription.value) {
    toast(t('submit.subscriptionTip'));
    return;
  }

  form.value.permission = permission;
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  form.value.content = "yes";
  showSensitiveConfirm.value = false;
}

function onCoverConfirmed(imgData: string) {
  coverPreview.value = imgData;
}

// Get post details for editing
async function getPostDetails() {
  if (!postId.value) return;

  try {
    const res = await api.modifyPostDetail(postId.value );
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 0 || data.code === 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights === '2' ? "partial" : postData.access_rights === '3' ? "private" : "public";
      form.value.content = postData.is_nsfw === '1' ? "yes" : "no";
      coverPreview.value = postData.cover || "";

      // Check if video_url exists and set uploadSuccess to true
      if (postData.video_url) {
        videoUrl.value = postData.video_url;
        uploadSuccess.value = true;
        uploadProgress.value = 100; // Set progress to 100% when editing with video URL

        // Don't get video metadata for post_id case
      }

      // Update contenteditable div with description and handle #tags and @mentions
      if (captionRef.value) {
        const content = postData.content || "";
        // Clear the div
        captionRef.value.innerHTML = '';

        // Process content to handle #tags and @mentions
        let currentIndex = 0;
        let pos = 0;
        const contentLength = content.length;

        while (pos < contentLength) {
          // Find the next # or @
          const tagIndex = content.indexOf('#', pos);
          const mentionIndex = content.indexOf('@', pos);

          // Determine which comes first
          let nextMatchIndex = -1;
          let isTag = false;

          if (tagIndex === -1 && mentionIndex === -1) {
            // No more matches
            break;
          } else if (tagIndex === -1) {
            nextMatchIndex = mentionIndex;
            isTag = false;
          } else if (mentionIndex === -1) {
            nextMatchIndex = tagIndex;
            isTag = true;
          } else {
            nextMatchIndex = Math.min(tagIndex, mentionIndex);
            isTag = nextMatchIndex === tagIndex;
          }

          // Add text before the match
          if (nextMatchIndex > currentIndex) {
            const textBefore = content.substring(currentIndex, nextMatchIndex);
            const textNode = document.createTextNode(textBefore);
            captionRef.value?.appendChild(textNode);
          }

          // Find the end of the tag/mention (until whitespace or end of string)
          let endIndex = nextMatchIndex + 1;
          while (endIndex < contentLength) {
            const char = content[endIndex];
            if (char === '\u0020' || char === '\n' || char === '\t') {
              break;
            }
            endIndex++;
          }

          // Extract the match
          const matchText = content.substring(nextMatchIndex, endIndex);

          // Create span for the match
          const span = document.createElement('span');
          span.className = isTag ? 'tag topic' : 'tag mention';
          span.style.color = '#00d3f2';
          span.contentEditable = 'false';
          span.textContent = matchText;
          captionRef.value?.appendChild(span);

          // Add a space after
          const space = document.createTextNode('\u0020');
          captionRef.value?.appendChild(space);

          // Update current index
          currentIndex = endIndex;
          pos = endIndex;
        }

        // Add remaining text
        if (currentIndex < content.length) {
          const textAfter = content.substring(currentIndex);
          const textNode = document.createTextNode(textAfter);
          captionRef.value?.appendChild(textNode);
        }

        // Update caption length
        captionLength.value = content.length;
      }

      // For video, we might need to handle the video file differently
      // This is a placeholder - actual implementation would depend on how videos are stored
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error("Get post details error:", error);
    toast(t('fail'));
  }
}


function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  // Get current text length
  const currentText = captionRef.value?.innerText || '';
  const currentLength = currentText.length;

  // Calculate remaining length
  const remainingLength = DESC_MAX - currentLength;

  // Truncate text if it exceeds remaining length
  const pasteText = remainingLength > 0 ? text.substring(0, remainingLength) : '';

  const textNode = document.createTextNode(pasteText);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  updateCaptionStats();
}

async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;
  const text = target.innerText || "";
  const trimmedText = text.replace(/\n$/, "");
  const currentLength = trimmedText.length;

  // Check if length exceeds maximum
  if (currentLength > DESC_MAX) {
    // Get the selection before the input
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // Revert to the previous state
      target.innerText = trimmedText.substring(0, DESC_MAX);

      // Update length
      captionLength.value = DESC_MAX;

      // Move cursor to the end
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return;
  }

  captionLength.value = currentLength;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  const match = textBefore.match(/([#@])([^#@\s]*)$/u);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];

    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

// Debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Debounced search function
const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    console.error("Search error:", error);
    dropdownItems.value = [];
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

// Direct search without debounce (for button clicks)
async function searchTagsImmediate(type: "#" | "@", query: string) {
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    console.error("Search error:", error);
    dropdownItems.value = [];
  }
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

function handleCaptionKeydown(e: KeyboardEvent) {
  // Handle Space key - convert #content to blue tag
  if (e.key === " " || e.key === "Spacebar") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBefore = textNode.textContent?.substring(0, range.startOffset) || "";

      // Check if there's a # followed by content
      const hashMatch = textBefore.match(/#([^#@]+)$/u);

      if (hashMatch) {
        const tagContent = hashMatch[1];
        // Check if the content contains Chinese characters or spaces
        const hasChineseChars = /[\u4e00-\u9fa5]/.test(tagContent);
        const hasSpaces = tagContent.includes(" ");
        const hasApostrophes = tagContent.includes("'") || tagContent.includes("\"");

        if (hasApostrophes) {
          // For pinyin input (with apostrophes), just confirm the input
          return;
        } else if (hasChineseChars || hasSpaces) {
          // For Chinese characters or content with spaces, create the tag
          // Count existing topic tags (with class "tag topic")
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              showToast(t('submit.video.toastTopicLimit'), "");
              return;
            }
          }

          // Calculate new length after adding the tag
          const fullMatch = "#" + tagContent.trim();
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (range.startOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          // Check if adding the tag would exceed the limit
          if (newLength > DESC_MAX) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          // Create a new range to select the hashtag text
          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, range.startOffset);

          // Delete the original text
          tagRange.deleteContents();

          // Create the blue tag span (without space)
          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch; // Only the hashtag and content
          span.style.color = "#00d3f2";

          // Insert the span
          tagRange.insertNode(span);

          // Insert a real visible space after the tag
          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          // Move cursor AFTER the space
          tagRange.setStart(space, 1); // Position at offset 1 (after the space character)
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          // Hide dropdown after creating tag
          showDropdown.value = false;

          updateCaptionStats();
          return;
        } else {
          // For non-Chinese content, create the tag immediately
          // Count existing topic tags (with class "tag topic")
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              showToast(t('submit.video.toastTopicLimit'), "");
              return;
            }
          }

          // Calculate new length after adding the tag
          const fullMatch = hashMatch[0]; // e.g., "#hello"
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (range.startOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          // Check if adding the tag would exceed the limit
          if (newLength > DESC_MAX) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          // Create a new range to select the hashtag text
          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, range.startOffset);

          // Delete the original text
          tagRange.deleteContents();

          // Create the blue tag span (without space)
          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch; // Only the hashtag, no space
          span.style.color = "#00d3f2";

          // Insert the span
          tagRange.insertNode(span);

          // Insert a real visible space after the tag
          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          // Move cursor AFTER the space
          tagRange.setStart(space, 1); // Position at offset 1 (after the space character)
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          // Hide dropdown after creating tag
          showDropdown.value = false;

          updateCaptionStats();
          return;
        }
      }
    }
  }

  // Handle Backspace key
  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // If selection is collapsed (no text selected)
    if (range.collapsed) {
      const node = range.startContainer;
      const offset = range.startOffset;

      // Case 1: Cursor is right after a space that follows a tag
      // Just delete the space (default behavior), don't prevent
      if (node.nodeType === Node.TEXT_NODE && offset > 0) {
        const charBefore = node.textContent?.[offset - 1];

        // If the character before cursor is a space
        if (charBefore === "\u0020" || charBefore === " ") {
          // Check if there's a tag before this space
          if (offset === 1 && node.previousSibling?.nodeName === "SPAN") {
            const span = node.previousSibling as HTMLElement;
            if (span.classList.contains("tag")) {
              // Just delete the space, let default behavior handle it
              // Don't show dropdown
              return;
            }
          }
        }
      }

      // Case 2: Cursor is at the start of a text node, right after a tag
      // After the space is deleted, this will trigger to delete the whole tag
      if (offset === 0 && node.previousSibling?.nodeName === "SPAN") {
        const span = node.previousSibling as HTMLElement;
        if (span.classList.contains("tag")) {
          e.preventDefault();
          span.remove();
          showDropdown.value = false; // Hide dropdown when tag is deleted
          updateCaptionStats();
          return;
        }
      }

      // Case 3: Handle when there's no text node after the tag yet
      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === "SPAN") {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains("tag")) {
            e.preventDefault();
            span.remove();
            showDropdown.value = false; // Hide dropdown when tag is deleted
            updateCaptionStats();
            return;
          }
        }
      }
    }
  }
}

function updateCaptionStats() {
  if (captionRef.value) {
    const text = captionRef.value.innerText || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }
}

function onCaptionBlur() {
  // Save content to form if needed
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }
}

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getBoundingClientRect();

  // Check if rect is valid (not at origin or with zero dimensions)
  let absTop = rect.bottom + 5;
  let absLeft = rect.left;

  // If rect is invalid (likely after space deletion), use fallback position
  if (rect.width === 0 && rect.height === 0 || absTop < 100 || absLeft < 10) {
    const captionRect = captionRef.value.getBoundingClientRect();
    absTop = captionRect.top + 26;
    absLeft = captionRect.left;
  }

  dropdownPosition.value = {
    top: absTop,
    left: absLeft + 2, // Small offset to the right
  };

  // Adjust if overflow bottom
  const dropdownHeight = 250;
  if (absTop + dropdownHeight > window.innerHeight) {
    dropdownPosition.value.top = rect.top - dropdownHeight - 5;
  }
}

function onActionBtnClick(symbol: "#" | "@") {
  if (!captionRef.value) return;
  captionRef.value.focus();

  const selection = window.getSelection();
  if (!selection) return;

  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(captionRef.value);
    range.collapse(false);
  }

  // Delete selection if any
  range.deleteContents();

  // Insert the symbol text node
  const textNode = document.createTextNode(symbol);
  range.insertNode(textNode);

  // Move cursor after the text node
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // Force show dropdown immediately after button click
  dropdownType.value = symbol;

  // Use nextTick to ensure DOM is updated
  nextTick(async () => {
    // Search immediately without debounce
    await searchTagsImmediate(symbol, "");

    // Use setTimeout to ensure layout is calculated
    setTimeout(() => {
      // Get the current selection and range
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.rangeCount === 0) {
        console.log('No selection found');
        return;
      }

      // Get the current range (cursor position after the symbol)
      const currentRange = currentSelection.getRangeAt(0);
      lastRange.value = currentRange.cloneRange();

      // Get the bounding rect of the cursor position
      const rect = currentRange.getBoundingClientRect();

      // If rect is invalid (width and height are 0), try alternative method
      let absTop = rect.top + window.scrollY;
      let absLeft = rect.left + window.scrollX;

      // For fixed positioning, we don't need to add scroll offset
      absTop = rect.bottom + 5;
      absLeft = rect.left;

      // If position looks wrong (too small or at origin), use fallback
      if ((absTop < 100 || absLeft < 10) && captionRef.value) {
        const captionRect = captionRef.value.getBoundingClientRect();
        absTop = captionRect.top + 26;
        absLeft = captionRect.left;
        console.log('Using fallback position from captionRef:', captionRect);
      }

      dropdownPosition.value = {
        top: absTop,
        left: absLeft,
      };

      // Adjust if overflow bottom
      const dropdownHeight = 250;
      if (absTop + dropdownHeight > window.innerHeight) {
        dropdownPosition.value.top = rect.top - dropdownHeight - 5;
      }

      // Show dropdown after position is set
      showDropdown.value = true;
    }, 100); // Increased to 100ms for more reliable positioning

    // Keep the input focused
    captionRef.value?.focus();
  });
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  // Check topic limit
  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      showToast(t("submit.video.toastTopicLimit"), "");
      showDropdown.value = false;
      return;
    }
  }

  // Calculate new length after adding the tag
  const currentText = captionRef.value.innerText || "";
  const currentLength = currentText.length;
  const tagText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  const spaceText = " ";
  const newLength = currentLength + tagText.length + spaceText.length;

  // Check if adding the tag would exceed the limit
  if (newLength > DESC_MAX) {
    showDropdown.value = false;
    return;
  }

  const range = lastRange.value;
  const textNode = range.startContainer;
  const offset = range.startOffset;
  const textContent = textNode.textContent || "";
  const textBefore = textContent.substring(0, offset);
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const triggerIndex = match.index!;
    // Set range to cover the trigger and the typed query
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }

  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  // Format: hashtags include #, mentions include @
  span.innerText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  span.style.color = "#00d3f2";

  range.insertNode(span);

  // Insert a space after the tag
  const space = document.createTextNode("\u0020");
  range.setStartAfter(span);
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  showDropdown.value = false;
  updateCaptionStats();
  captionRef.value.focus();
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (showDropdown.value && !document.querySelector(".mention-dropdown")?.contains(target)) {
    showDropdown.value = false;
  }
}

async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  // Check if in edit mode
  const isEditMode = !!postId.value;
  // Check if video is from URL parameter
  const isVideoFromUrl = !!route.query.url;

  // Always require video URL
  if (!videoUrl.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  // In create mode and not from URL, require video file
  if (!isEditMode && !isVideoFromUrl && !videoFile.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  // In edit mode, if upload failed, prompt to upload
  if (isEditMode && uploadError.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  // Check if upload was successful (except when video is from URL parameter)
  if (!isVideoFromUrl && !uploadSuccess.value) {
    toast(t("submit.video.toastUploadFailed"));
    return;
  }

  // Check if cover is set
  if (!coverPreview.value) {
    toast(t("submit.video.toastSetCover"));
    return;
  }

  // Check if terms are agreed
  if (!agreeTerms.value) {
    toast(t("submit.video.toastAgreeTerms"));
    return;
  }

  // 处理content参数，只在有span标签的@提及前面添加空格
  let processedContent = form.value.description.trim();

  // 获取输入框的HTML内容，检查是否有span标签的@提及
  const el = captionRef.value;
  if (el) {
    // 检查输入框中的span标签
    const mentionSpans = el.querySelectorAll('.tag.mention');
    if (mentionSpans.length > 0) {
      // 对于每个span标签的@提及，检查其在文本中的位置
      mentionSpans.forEach((span) => {
        const spanText = span.textContent || '';
        if (spanText.startsWith('@')) {
          const username = spanText.substring(1);
          // 构建正则表达式，匹配@username，前面没有空格的情况
          const regex = new RegExp(`(^|[^\s])@${username}`, 'g');
          processedContent = processedContent.replace(regex, (match, prefix) => {
            return `${prefix} @${username}`;
          });
        }
      });
    }
  }

  isUpload.value = true;

  try {
    const payload = {
      type: 3,
      title: form.value.title.trim(),
      cover: coverPreview.value,
      content: processedContent,
      is_nsfw: form.value.content == "yes" ? 1 : 0,
      access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
      video_url: videoUrl.value,
      ...(sessionId.value && { session_id: sessionId.value }),
      ...(isEditMode && { post_id: postId.value })
    };

    const headers = new Headers();

    headers.append("token", token);
    headers.append("Content-Type", "application/json");

    const data = JSON.stringify(payload);

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data
    };

    const url = postId.value
      ? `${baseUrl}/post/modifyPost`
      : `${baseUrl}/post/addPost`;

    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      router.push(`/publish/success`);
      // router.push(`/publish/success?type=${3}`);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isUpload.value = false;
  }
}

function showToast(msg: string, icon: string) {
  toastMsg.value = msg;
  toastIcon.value = icon;
  toastShow.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastShow.value = false;
  }, 3000);
}

// Open community convention in new window
function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  getCountry();
  await checkSubscriptionStatus(); // Check subscription status on page load

  // Check if URL parameter 'session_id' exists
  const sessionIdParam = route.query.session_id as string;
  if (sessionIdParam) {
    sessionId.value = sessionIdParam;
  }

  // Check if URL parameter 'url' exists and has value
  const urlParam = route.query.url as string;
  if (urlParam && urlParam.trim()) {
    videoUrl.value = urlParam;
    uploadSuccess.value = true;
    uploadProgress.value = 100; // Set progress to 100%

    // Check if URL parameter 'cover' exists
    const coverParam = route.query.cover as string;
    if (coverParam && coverParam.trim()) {
      coverPreview.value = coverParam;
    }

    // Don't get video metadata for URL parameter case
  } else if (postId.value) {
    await getPostDetails();
  }
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(locale, () => {
  tabList.value = [
    { name: t("submit.tabs.video"), path: "/publish/video" },
    { name: t("submit.tabs.image"), path: "/publish/comic" },
    { name: t("submit.tabs.article"), path: "/publish/novel" },
  ];
});
</script>

<style lang="scss" scoped>
.submit-video {
  width: 100%;
  min-height: 100vh;
  padding: 14rem 0 0;
  background: #FFFFFF;

  &.on{
    background: #F5F5F5;
  }
}

.container {
  width: 84rem;
  margin: 0 auto 2rem;
  position: relative;
}

.back {
  position: fixed;
  left: 50%;
  top: 14rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-55rem);
  cursor: pointer;
  z-index: 10;

  img {
    width: 4rem;
    height: 4rem;
  }
}

.tabs {
  display: flex;
  align-items: center;
  gap: 3rem;
  height: 6.4rem;
  margin-bottom: 2.4rem;
  padding: 0 3rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
  span {
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 1.6rem;
    color: #6a7282;
    cursor: pointer;
    &.on {
      position: relative;
      font-weight: 600;
      color: #101828;
      &::before {
        position: absolute;
        left: 0;
        bottom: 0;
        content: "";
        width: 100%;
        height: 0.2rem;
        background-color: #fb64b6;
      }
    }
  }
}

.section-video {
  margin-bottom: 1.2rem;
}

.form-label-box {
  display: flex;
  align-items: center;

  span {
    font-weight: 500;
    font-size: 1.4rem;
    color: #101828;

    b {
      color: #fa2d47;
      margin-right: 0.4rem;
    }
  }
}

.form-label {
  font-size: 1.4rem;
  color: #101828;
  b {
    color: #fa2d47;
    margin-right: 0.4rem;
  }
}

.upload-title{
  margin-bottom: 4rem;
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}

.upload-area-box {
  position: relative;
  padding: 4rem 0;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: #F5F5F5;
  cursor: pointer;

  &:hover{
    position: relative;
    &::after{
      position: absolute;
      left: 0;
      top: 0;
      content: '';
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: rgba(0,0,0,0.06);
    }
  }
}

.upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  .upload-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    p {
      margin-bottom: 2.4rem;
      font-size: 1.4rem;
      color: #364153;
    }
  }
}

.btn {
  min-width: 11.2rem;
  height: 4rem;
  padding: 0 1rem;
  font-size: 1.4rem;
  border: none;
  border-radius: 0.8rem;
  background: #fb64b6;
  color: #ffffff;
  cursor: pointer;
}

.upload-spec {
  display: flex;
  gap: 8rem;
  margin-top: 2.4rem;
  .upload-spec-item {
    display: flex;
    flex-direction: column;
    .upload-spec-title {
      font-size: 1.2rem;
      color: #99a1af;
      margin-bottom: 0.4rem;
    }
    span,
    .upload-spec-info {
      font-size: 1.2rem;
      color: #6a7282;
    }
  }
}

/* New Upload Status Box */
.upload-status-box {
  margin-top: 1.2rem;
  padding: 2.4rem 2rem;
  border-radius: 0.8rem;
  background: #FFFFFF;

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.2rem;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 0.2rem;

    .status-icon {
      width: 2rem;
      height: 2rem;
    }
    .status-text {
      font-size: 1.4rem;
    }

    .video-meta-box{
      display: flex;
      align-items: center;
      margin-left: 0.6rem;
      font-size: 1.2rem;
      color: #99a1af;

      .video-meta {
        margin-left: 0.6rem;
      }
    }

    &.success {
      .status-text {
        color: #05df4b;
      }
    }
    &.error {
      .status-text {
        color: #fa2d47;
      }
    }
  }

  .status-actions {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 1.6rem;
    .action-link {
      font-size: 1.4rem;
      cursor: pointer;
      &.play {
        color: #00d3f2;
      }
      &.reupload {
        color: #fb64b6;
      }
    }
  }

  .reupload-video-box{
    position: relative;

    .reupload-file{
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      display: none;
    }
  }

  .status-progress-bar {
    height: 0.8rem;
    background: #f2f4f7;
    border-radius: 0.4rem;
    overflow: hidden;
    .progress-fill {
      height: 100%;
      background: rgba(251, 100, 182, 0.12);
      border-radius: 0.4rem;
      transition: width 0.2s ease;
      &.success {
        background: #05df4b;
      }
      &.error {
        background: #fa2d47;
      }
    }
  }
}

// .content-wrapper {
//   animation: fadeIn 0.5s ease;
// }

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section {
  margin-bottom: 2.4rem;
}

.perm-box {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  padding: 1.2rem 2.4rem;
  border-radius: 0.8rem;
  background: #FFFFFF;
  .form-label {
    color: #99a1af;
    margin: 0;
  }
}

.perm-options {
  display: flex;
  gap: 2.4rem;
  .perm-option {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #364153;
    }
  }
}

.cover-row {
  display: flex;
  align-items: flex-end;
  gap: 1.6rem;
  margin-top: 1.2rem;
  .cover-box {
    width: 9rem;
    height: 12rem;
    background: #f2f4f7;
    border-radius: 0.8rem;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0.8rem;
    }
  }
  .reupload {
    background: none;
    border: none;
    color: #fb64b6;
    font-size: 1.6rem;
    cursor: pointer;
  }
}

.caption-container {
  margin-top: 1.2rem;
  border-radius: 0.8rem;
  background: #FFFFFF;
  overflow: hidden;

  .input-wrap {
    position: relative;
    padding: 1.4rem 6rem 1.4rem 1.8rem;

    .char-count {
      position: absolute;
      top: 1.6rem;
      right: 1.4rem;
      font-size: 1.2rem;
      color: #99a1af;
    }
  }

  .caption-line {
    width: calc(100% - 3.6rem);
    height: 1px;
    margin: 0 1.8rem;
    background: #F5F5F5;
  }

  .textarea-wrap {
    position: relative;
    padding: 1.4rem 1rem 0 1.8rem;
  }

  .title-input,
  .description-content {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 1.4rem;
    color: #101828;
    &::placeholder {
      color: #99a1af;
    }
  }

  .description-content {
    height: 10rem;
    word-break: break-all;
    white-space: pre-wrap;
    overflow-y: auto;
    &:focus {
      outline: none;
    }
    &[contenteditable="true"]:empty:before {
      content: attr(placeholder);
      color: #99a1af;
      pointer-events: none;
      display: block;
    }

    :deep(.tag) {
      color: #00d3f2;
      margin-right: 0.4rem;
      user-select: none;
    }
  }
}

.caption-actions-box {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.2rem 1.2rem 1.2rem 1.8rem;
  background: rgba(255, 255, 255, 0.9);

  .char-count {
    font-size: 1.2rem;
    color: #99a1af;
  }
}

.caption-actions {
  display: flex;
  gap: 1.2rem;

  .action-btn {
    padding: 0.7rem 1.6rem;
    border-radius: 0.6rem;
    border: none;
    background: #f5f5f5;
    color: #4a5565;
    font-size: 1.2rem;
    cursor: pointer;
  }
}

.sensitive-options {
  display: flex;
  gap: 3.2rem;
  margin-top: 1.2rem;
  .option {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #364153;
    }
  }
  &.disabled {
    .option {
      cursor: not-allowed;
      img {
        opacity: 0.5;
      }
    }
  }
}

.submit-row {
  display: flex;
  justify-content: center;
  .submit {
    min-width: 24rem;
    height: 4.8rem;
    border: none;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    font: {
      weight: 500;
      size: 1.6rem;
    }
    background: #fb64b6;
    color: #ffffff;
    cursor: pointer;

    &:hover:not(:disabled) {
      position: relative;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        z-index: 1;
      }
    }

    &.dis{
      background: rgba(251,100,182,0.5);
      cursor: not-allowed;
    }
  }
}

.agreement-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.6rem;
  .checkbox {
    width: 2rem;
    height: 2rem;
    cursor: pointer;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .agreement-text {
    font-size: 1.4rem;
    color: #99A1AF;
    a {
      color: #fb64b6;
      text-decoration: none;
    }
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  position: relative;
  width: 50rem;
  padding: 1.8rem 3.6rem;
  background: #ffffff;
  border-radius: 1.2rem;
  overflow: hidden;

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
    justify-content: center;
    align-items: center;
    .title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #101828;
    }
  }

  .desc {
    font-size: 1.4rem;
    color: #364153;
    margin: 1.8rem 0 2.4rem;
    line-height: 2rem;
  }

  .dont-ask {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1.2rem;
    cursor: pointer;

    .checkbox {
      width: 2.4rem;
      height: 2.4rem;
      img {
        width: 100%;
        height: 100%;
      }
    }
    span {
      font-size: 1.4rem;
      color: #6a7282;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 2.4rem;

    button {
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
    }

    .btn-cancel {
      border: 1px solid #fb64b6;
      background: none;
      color: #fb64b6;

      &:hover {
        background: rgba(251, 100, 182, 0.06);
      }
    }
    .btn-confirm {
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

.mention-dropdown {
  position: fixed;
  width: 48rem;
  background: #ffffff;
  border-radius: 0.8rem;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  .dropdown-header {
    padding: 1.2rem;
    font-size: 1.4rem;
    color: #99a1af;
    border-bottom: 1px solid #f2f4f7;
  }
  .dropdown-list {
    max-height: 24rem;
    padding: 0.8rem 0;
    overflow-y: auto;
    // &::-webkit-scrollbar {
    //   width: 5px;
    // }
    // &::-webkit-scrollbar-thumb {
    //   background: #f2f4f7;
    //   border-radius: 2px;
    // }
  }
  .dropdown-item {
    padding: 0.6rem 1.6rem;
    min-height: 4rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    &:hover {
      background: rgba(251, 100, 182, 0.06);
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      .avatar {
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .label {
        font-size: 1.4rem;
        color: #364153;
      }
    }

    .item-right {
      .stats {
        font-size: 1.2rem;
        color: #99a1af;
      }
    }
  }
}

.hidden-file {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 5;
  cursor: pointer;
}
</style>
