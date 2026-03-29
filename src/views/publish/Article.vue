<template>
  <div class="submit-article">
    <Header :cur="-1"></Header>

    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="tabs">
        <span
          :class="tabIndex == index ? 'on' : ''"
          v-for="(tab, index) in tabList"
          :key="index"
          @click="changeTab(tab, index)"
        >
          {{ tab.name }}
          <b></b>
        </span>
      </div>

      <!-- Initial View: Only Create Post Section -->
      <div class="initial-view">
        <div class="create-post-section">
          <div class="section-title"><b>*</b>{{ t("submit.articleTitleLabel") }}</div>

          <div class="caption-container">
            <div class="input-wrap">
              <input
                v-model="form.title"
                class="title-input"
                type="text"
                :maxlength="TITLE_MAX"
                :placeholder="t('submit.titlePlaceholder')"
                @input="handleTitleInput"
              />
              <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
            </div>
            <div class="caption-line"></div>
            <div class="textarea-wrap" :class="showFullContent ? 'hide' : ''">
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

          <!-- Next Step Button -->
          <div class="next-step-container" v-if="!showFullContent">
            <button class="next-step-btn" :disabled="!canGoToNextStep" @click="goToNextStep">
              {{ t("submit.article.next") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Full Content View: After clicking Next Step -->
      <div class="full-content" v-if="showFullContent">
        <div class="section">
          <div class="form-item">
            <div class="perm-box">
              <div class="form-label">{{ t("submit.permission") }}</div>

              <div class="perm-options">
                <div
                  class="perm-option"
                  v-for="opt in permOptions"
                  :key="opt.key"
                  @click="form.permission = opt.key"
                >
                  <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                  <span
                    >{{ t(opt.labelKey) }}
                    <b v-if="opt.key == 'partial'">{{ t("submit.articleTip") }}</b></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="form-item">
            <label class="form-label"> <b>*</b>{{ t("submit.coverLabel") }} </label>

            <div class="cover-row">
              <div class="cover-box">
                <img v-if="coverPreview" :src="coverPreview" alt="" />
                <img v-else-if="!coverPreview" src="@/assets/images/base/cover.png" alt="" />
              </div>

              <div class="reupload-box">
                <button class="reupload" @click="openCoverModal">
                  {{ t("submit.reupload") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="content-section">
          <div class="form-label-box">
            <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>
          </div>

          <div class="content-options">
            <div
              class="content-option"
              v-for="a in contentOptions"
              :key="a.key"
              @click="toggleSensitive(a.key as 'yes' | 'no')"
            >
              <img :src="form.content === a.key ? selectActive : select" alt="" />
              <span>{{ t(a.labelKey) }}</span>
            </div>
          </div>
        </div>

        <div class="submit-row">
          <button class="submit" :disabled="!canSubmit || uploading" @click="onSubmit">
            {{ t("submit.submit") }}
          </button>
        </div>

        <div class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span
            >{{ t("submit.agree") }} <a href="#">{{ t("submit.terms") }}</a></span
          >
        </div>
      </div>
    </div>
  </div>

  <UploadMask :visible="isUpload"></UploadMask>

  <ConfirmLeaveModal :show="isShowConfirm" @cancel="confirmStay" @confirm="confirmLeave" />
  <SetArticleCoverModal
    v-model:visible="showCoverModal"
    :title="form.title"
    @confirm="onCoverConfirmed"
  />
  <SensitiveConfirmModal
    :visible="showSensitiveConfirm"
    @cancel="cancelSensitive"
    @confirm="confirmSensitive"
  />
</template>

<script setup lang="ts" name="PublishArticleView">
defineOptions({ name: "PublishArticleView" });
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import SetArticleCoverModal from "@/components/SetArticleCoverModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import api from "@/api/index";

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import router from "@/router";
import { useRoute } from "vue-router";

const isUpload = ref(false);
const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

// Check if in edit mode
const route = useRoute();
const isEditMode = ref(route.query.edit === "1");
const postId = ref(route.query.post_id as string);

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

const agreeTerms = ref(false);

const TITLE_MAX = 20;
const DESC_MAX = 10000;

const tabList = ref([
  {
    name: t("submit.tabs.video"),
    path: "/publish/video",
  },
  {
    name: t("submit.tabs.image"),
    path: "/publish/image",
  },
  {
    name: t("submit.tabs.article"),
    path: "/publish/article",
  },
]);
const tabIndex = ref(2);
const pendingRoute = ref<{ path: string } | null>(null);
const isShowConfirm = ref(false);

const form = ref({
  title: "",
  description: "",
  permission: "public",
  category: t("submit.type3"),
  keywords: "",
  age: "adult",
  allowComments: true,
  allowRepost: false,
  content: "no",
});

const coverInputRef = ref<HTMLInputElement | null>(null);
const coverPreview = ref("");
const showCoverModal = ref(false);
const agreeToTerms = ref(false);

const uploading = ref(false);
const disableComments = ref(false);
const editorHtml = ref("");
const MAX_COUNT = 10000;

// Caption related
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<
  { label: string; value: string; views?: string; followers?: string; avatar?: string }[]
>([]);
const dropdownPosition = ref({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);

// Sensitive content
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");

// UI state
const showFullContent = ref(false);

const canSubmit = computed(() => {
  return form.value.title.trim().length > 0 && coverPreview.value;
});

// Cover settings
const coverTitle = ref("");
const coverColor = ref("#FCCEE8"); // Pink background

// Handle title input and auto-generate cover
function handleTitleInput() {
  if (form.value.title.trim()) {
    generateCoverFromTitle();
  }
}

async function goToNextStep() {
  if (form.value.title.trim()) {
    generateCoverFromTitle();

    if (coverPreview.value) {
      isUpload.value = true;

      const token = localStorage.getItem("token");
      if (!token) {
        isUpload.value = false;
        return false;
      }

      try {
        const response = await fetch(coverPreview.value);
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

        const res = await fetch(baseUrl + "user/uploadImage", parma);
        const data = await res.json();
        if (data.code === 0 || data.code === 200) {
          const url = (data?.data && (data.data.url || data.data)) || data?.url;
          if (typeof url === "string") {
            coverPreview.value = url;

            showFullContent.value = true;
          }
        } else {
          toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
        }
      } catch (error) {
        console.error("Cover upload error:", error);
        toast(t('fail'));
      } finally {
        isUpload.value = false;
      }

    }
  }
}

const canGoToNextStep = computed(() => {
  return form.value.title.trim().length > 0 || captionLength.value > 0;
});

// Cover generation
function generateCoverFromTitle() {
  // Create canvas for cover generation
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Draw background (pink by default)
  ctx.fillStyle = "#FCCEE8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw quote marks in top left
  ctx.font = "200px Arial";
  ctx.fillStyle = "#58474C";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText('"', 60, 60);

  // Draw title
  ctx.font = "40px Arial";
  ctx.fillStyle = "#58474C";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split title into lines if too long
  const title = form.value.title.trim();
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

  const lineHeight = 50;
  const firstLineY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, firstLineY + index * lineHeight);
  });

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  coverPreview.value = dataUrl;
  return dataUrl;
}

// Get post details for editing
async function getPostDetails() {
  if (!postId.value) return;

  try {
    const res = await api.postDetail( postId.value );
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 0 || data.code === 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights === 2 ? "partial" : postData.access_rights === 3 ? "private" : "public";
      form.value.content = postData.is_nsfw === 1 ? "yes" : "no";
      coverPreview.value = postData.cover || "";

      // Update contenteditable div with description
      if (captionRef.value) {
        const content = postData.content || "";
        // Clear the div first
        captionRef.value.innerHTML = '';

        // Process content to handle #tags and @mentions
        let currentIndex = 0;

        // Find all #tags and @mentions using a more robust approach
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
            if (char === ' ' || char === '\n' || char === '\t') {
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
          span.style.marginRight = '4px';
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

      // Auto-generate cover if no cover provided
      if (!coverPreview.value && form.value.title.trim()) {
        generateCoverFromTitle();
      }
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error("Get post details error:", error);
    toast(t('fail'));
  }
}

// Navigation
function goBack() {
  const hasData =
    form.value.title.trim().length > 0 ||
    form.value.description.trim().length > 0 ||
    coverPreview.value !== "" ||
    editorHtml.value.trim().length > 0 ||
    form.value.keywords.trim().length > 0;

  if (hasData) {
    isShowConfirm.value = true;
    return;
  }

  router.go(-1);
}

function changeTab(item: { path: string }, index: number) {
  if (tabIndex.value === index) {
    return false;
  }

  const hasData =
    form.value.title.trim().length > 0 ||
    form.value.description.trim().length > 0 ||
    coverPreview.value !== "" ||
    editorHtml.value.trim().length > 0 ||
    form.value.keywords.trim().length > 0;

  if (hasData) {
    pendingRoute.value = item;
    isShowConfirm.value = true;
    return;
  }

  tabIndex.value = index;
  router.push(item.path);
}

function confirmStay() {
  isShowConfirm.value = false;
  pendingRoute.value = null;
}
function confirmLeave() {
  if (pendingRoute.value) {
    router.push(pendingRoute.value.path);
    pendingRoute.value = null;
    isShowConfirm.value = false;
  }
}

// Submit
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  if (!canSubmit.value || !agreeTerms.value) return;

  isUpload.value = true;

  try {
    const payload = {
      type: 2,
      title: form.value.title.trim(),
      cover: coverPreview.value,
      content: form.value.description.trim(),
      is_nsfw: form.value.content === "yes" ? 1 : 0,
      access_rights: form.value.permission === "partial" ? 1 : form.value.permission === "private" ? 2 : 0,
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
      toast(t("success"));
      router.push(`/publish/success?type=${2}`);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("submit.article.publishFailed"));
  } finally {
    isUpload.value = false;
  }
}

// Caption methods
async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;
  const text = target.innerText || "";
  captionLength.value = text.replace(/\n$/, "").length;

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

// Debounce function
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
  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (range.startOffset === 0 && node.previousSibling?.nodeName === "SPAN") {
      const span = node.previousSibling as HTMLElement;
      if (span.classList.contains("tag")) {
        e.preventDefault();
        span.remove();
        updateCaptionStats();
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
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  updateCaptionStats();
}

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getBoundingClientRect();

  const absTop = rect.bottom + 5;
  const absLeft = rect.left;

  dropdownPosition.value = {
    top: absTop,
    left: absLeft + 2,
  };

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

  range.deleteContents();

  const textNode = document.createTextNode(symbol);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  dropdownType.value = symbol;
  showDropdown.value = true;
  lastRange.value = range.cloneRange();
  updateDropdownPosition();
  searchTags(symbol, "");
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      toast(t("submit.video.toastTopicLimit"));
      showDropdown.value = false;
      return;
    }
  }

  const range = lastRange.value;
  const textNode = range.startContainer;
  const offset = range.startOffset;
  const textContent = textNode.textContent || "";
  const textBefore = textContent.substring(0, offset);
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const triggerIndex = match.index!;
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }

  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  span.innerText = dropdownType.value === "@" ? "@" + item.label : item.label;
  span.style.color = "#00d3f2";
  span.style.marginRight = "4px";

  range.insertNode(span);

  const space = document.createTextNode("\u00A0");
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

// Cover modal methods
function openCoverModal() {
  showCoverModal.value = true;
}

function onCoverConfirmed(imgData: string) {
  coverPreview.value = imgData;
}

// Sensitive content methods
function toggleSensitive(val: "yes" | "no") {
  if (form.value.content === val) return;

  if (dontAskSensitive.value) {
    form.value.content = val;
  } else {
    pendingSensitiveValue.value = val;
    showSensitiveConfirm.value = true;
  }
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  if (pendingSensitiveValue.value) {
    form.value.content = pendingSensitiveValue.value as "yes" | "no";
    if (dontAskSensitive.value) {
      localStorage.setItem("dont_ask_sensitive", "true");
    }
  }
  showSensitiveConfirm.value = false;
}

// Lifecycle
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  // Get post details if postId exists
  if (postId.value) {
    showFullContent.value = true;
    getPostDetails();
  }
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.submit-article {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: #FFFFFF;
}
.container {
  position: relative;
  max-width: 90rem;
  min-height: calc(100vh - 14rem);
  margin: 0 auto 2rem;
  padding: 0 0 2rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);
}

.back {
  position: fixed;
  left: 50%;
  top: 12rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-55rem);
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background: rgba(251, 100, 182, 0.06);
  }

  img {
    width: 2.4rem;
    height: 2.4rem;
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
    position: relative;

    &.on {
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

    &:hover {
      color: #101828;
    }
  }
}

/* Initial View */
.initial-view {
  padding: 0 3rem;
}

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

.content-section {
  margin: 0 3rem 2.4rem;
}

/* Create Post Section */
.create-post-section {
  .section-title {
    font-weight: normal;
    font-size: 1.4rem;
    color: #101828;
    margin-bottom: 1.2rem;

    b {
      color: #fa2d47;
      margin-right: 0.4rem;
    }
  }
}

.full-content {
  margin-top: 1.2rem;
}

.form-item {
  position: relative;
  margin-bottom: 2.4rem;
  padding: 0 3rem;
}

.form-label-box {
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;

  span {
    font-size: 1.2rem;
    color: #99a1af;
  }
}
.form-label {
  font-size: 1.4rem;
  color: #101828;

  b {
    font-weight: normal;
    color: #fa2d47;
  }

  span {
    font-size: 1.2rem;
    color: #99a1af;
  }
}

.caption-container {
  margin-top: 1.2rem;
  border: 1px solid #fccee8;
  border-radius: 0.8rem;
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
    background: rgba(251, 100, 182, 0.1);
  }

  .textarea-wrap {
    position: relative;
    padding: 1.4rem 1rem 0 1.8rem;

    &.hide {
      .description-content {
        height: 11rem;
      }
    }
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
    height: calc(100vh - 46.6rem);
    word-break: break-word;
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

/* Next Step Button */
.next-step-container {
  display: flex;
  justify-content: center;
  margin-top: 2.4rem;
}

.next-step-btn {
  min-width: 24rem;
  height: 4.8rem;
  border: none;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  font-weight: 500;
  font-size: 1.6rem;
  background: #fb64b6;
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
  color: #ffffff;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

/* Permissions Section */
.permissions-section {
  .section-subtitle {
    font-size: 1.4rem;
    color: #101828;
    margin-bottom: 1.2rem;
    font-weight: 500;

    b {
      color: #fa2d47;
      margin-right: 0.4rem;
    }
  }
}

.perm-box {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  margin: 0 0 2.4rem;
  padding: 1.2rem;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: rgba(251, 100, 182, 0.04);

  .form-label {
    color: #99a1af;
  }
}
.perm-options {
  display: flex;
  align-items: center;
  gap: 2.4rem;
}
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

    b {
      font-weight: normal;
      font-size: 1.2rem;
      color: #99a1af;
    }
  }
}
.content-options {
  display: flex;
  align-items: center;
  gap: 2rem;
  .content-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
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

/* Cover Section */
.cover-section {
  .section-subtitle {
    font-size: 1.4rem;
    color: #101828;
    margin-bottom: 1.2rem;
    font-weight: 500;

    b {
      color: #fa2d47;
      margin-right: 0.4rem;
    }
  }
}

.cover-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 1.2rem;
  margin-top: 1.2rem;
}
.cover-box {
  width: 9rem;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
  }
}
.cover-placeholder {
  width: 72px;
  height: 72px;
  background: linear-gradient(180deg, #eaeef5, #f7f9fc);
  border-radius: 8px;
}

.reupload-box {
  position: relative;
  cursor: pointer;
}

.reupload {
  font-size: 1.6rem;
  background: none;
  color: #fb64b6;
  cursor: pointer;
}

.submit-row {
  display: flex;
  justify-content: center;
}
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
  background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
  color: #ffffff;
  cursor: pointer;

  &:disabled {
    position: relative;
    cursor: not-allowed;

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
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.2rem;
  font-size: 1.4rem;
  color: #6a7282;
  .checkbox {
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
  }
  a {
    color: #fb64b6;
    text-decoration: none;
  }
}

/* Mention Dropdown */
.mention-dropdown {
  position: fixed;
  width: 48rem;
  background: #ffffff;
  border-radius: 0.8rem;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.12);
  z-index: 10000;

  .dropdown-list {
    max-height: 24rem;
    padding: 0.8rem 0;
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1.6rem;
    min-height: 4rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

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
</style>
