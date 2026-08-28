<template>
  <div class="submit-video" :class="showFullContent ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="main-tabs">
        <div
          class="main-tab"
          :class="{ active: tabIndex == index }"
          v-for="(tab, index) in tabList"
          :key="index"
          @click="changeTab(tab, index)"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Upload Tabs -->
      <!-- Loading Detail State -->
      <div v-if="isLoadingDetail" class="loading-detail-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">{{ t('loading') }}</span>
      </div>

      <div class="upload-tabs" v-else-if="!showFullContent">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.video.videoLabel") }}</span>
        </div>

        <!-- Upload Options -->
        <div class="upload-options">
          <div
            v-for="option in uploadOptions"
            :key="option.id"
            class="option-item"
            :class="{ active: uploadOption === option.value }"
            @click="uploadOption = option.value"
          >
            <span class="radio-dot">
              <span class="radio-inner"></span>
            </span>
            <span class="option-label">{{ t(option.label) }}</span>
          </div>
        </div>

        <!-- History List -->
        <div v-if="uploadOption == 'history'" class="history-list">
          <!-- Loading State -->
          <div v-if="isLoadingProjects" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('loading') }}</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="projects.length == 0" class="empty-state">
            <div class="empty-icon">
              <img src="@/assets/images/publish/empty.png" alt="No data" />
            </div>
            <div class="empty-text">
              {{ t('emptyState.noProjects') }}
              <span class="empty-link" @click="goToHome">{{ t('emptyState.generate') }}</span>
            </div>
          </div>

          <div v-else>
            <!-- Project Grid -->
            <div class="project-grid">
              <div
                v-for="(project, index) in projects"
                :key="project.id"
                class="project-item"
                :class="{ selected: selectedProjectId == project.id }"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
                @click="selectProject(project)"
              >
                <img :src="getProjectCover(project)" alt="" class="project-image" />
                <div class="view-icon" @click.stop="openViewModal(project)">
                  <img src="@/assets/images/publish/play.png" alt="Play" />
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <Pagination
              v-if="projects.length > 0 && totalProjects > pageSize"
              :total="totalProjects"
              :page-size="pageSize"
              v-model="currentPage"
              theme="pink"
            />

            <!-- Confirm Button -->
            <div class="confirm-section">
              <button class="confirm-btn" :disabled="!selectedProjectId" @click="confirmSelectedProject">
                {{ t('submit.cover.confirm') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Local Upload -->
        <div v-else-if="uploadOption == 'local'" class="upload-area-box">
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
              accept="video/mp4,video/quicktime"
              class="hidden-file"
              title=""
              @change="onVideoPicked"
            />
          </div>

          <!-- Upload Progress -->
          <div v-if="isUpload" class="upload-progress-box">
            <div class="upload-progress-bar">
              <div class="upload-progress-inner" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <span class="upload-progress-text">{{ uploadProgress }}%</span>
          </div>
        </div>
      </div>

      <!-- Full Publish Form -->
      <div v-if="showFullContent" class="full-content">
        <!-- Video status + permission -->
        <div class="section">
          <div>
            <div class="form-label-box">
              <span><b>*</b>{{ t('submit.video.videoLabel') }}</span>
            </div>

            <div class="upload-status-box">
              <div class="status-header">
                <div class="status-info success">
                  <span class="status-text">{{ t('submit.video.uploadSuccess') }}</span>
                  <div class="video-meta-box">格式:mp4</div>
                </div>
                <div class="status-actions">
                  <span class="action-link play" @click="previewVideo">{{ t('submit.video.playBtn') }}</span>
                  <div class="reupload-video-box" @click="reuploadVideo">
                    <span class="action-link reupload">{{ t('submit.video.reuploadBtn') }}</span>
                    <input
                      ref="reuploadInputRef"
                      type="file"
                      accept="video/mp4,video/quicktime"
                      class="reupload-file"
                      title=""
                      @change="onReuploadPicked"
                    />
                  </div>
                </div>
              </div>
              <div class="status-progress-bar">
                <div class="progress-fill success" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <div class="perm-box">
            <div class="form-label-inner">
              <label class="form-label">{{ t('submit.permission') }}:</label>
            </div>
            <div class="perm-options">
              <div
                class="perm-option"
                :class="{ active: form.permission === opt.key }"
                v-for="opt in permOptions"
                :key="opt.key"
                @click="handlePermissionChange(opt.key)"
              >
                <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                <span>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover Image -->
        <div class="section">
          <div class="form-label-box">
            <span><b>*</b>{{ t('submit.coverLabel') }}</span>
          </div>
          <div class="cover-row">
            <div class="cover-upload">
              <img v-if="coverUrl" :src="processImageUrl(coverUrl)" alt="" class="cover-preview" />
              <div v-else class="cover-placeholder">
                <img src="@/assets/images/user/upload.png" alt="" />
                <span>{{ t('collection.uploadCover') }}</span>
              </div>
            </div>
            <button class="set-cover-btn" @click="openCoverModal">{{ t('submit.image.setting') }}</button>
          </div>
        </div>

        <!-- Form area -->
        <div class="content-section">
          <!-- Title -->
          <div class="form-item">
            <div class="caption-container">
              <div class="label-row">
                <label class="form-label"><b>*</b>{{ t('submit.titleLabel') }}</label>
                <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
              </div>
              <div class="title-input-wrap">
                <input
                  v-model="form.title"
                  class="title-input"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :placeholder="t('submit.titlePlaceholder')"
                />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="form-item">
            <div class="caption-container">
              <div class="label-row">
                <label class="form-label">{{ t('submit.descriptionLabel') }}</label>
                <span class="char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
              </div>
              <div class="desc-input-wrap">
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

                <div class="caption-actions-box">
                  <div class="caption-actions">
                    <button class="action-btn" @click="onActionBtnClick('#')">
                      #{{ t("submit.topic") }}
                    </button>
                    <button class="action-btn" @click="onActionBtnClick('@')">
                      @{{ t("submit.mention") }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Mention/Topic Dropdown -->
              <div
                v-if="showDropdown"
                class="mention-dropdown"
                :style="getDropdownStyle()"
              >
                <div class="dropdown-list">
                  <div v-if="isDropdownLoading" class="dropdown-loading">
                    <div class="loading-spinner"></div>
                    <span>{{ t('loading') }}</span>
                  </div>
                  <template v-else>
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
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Settings -->
          <div class="inline-perm-row" v-if="true">
            <div class="perm-group">
              <span class="perm-label">{{ t('submit.contentSettings') }}</span>
              <div class="perm-options">
                <div
                  class="perm-option"
                  :class="{ active: form.content === opt.key }"
                  v-for="opt in contentOptions"
                  :key="opt.key"
                  @click="form.content = opt.key"
                >
                  <img :src="form.content === opt.key ? selectActive : select" alt="" />
                  <span>{{ t(opt.labelKey) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Language -->
          <div class="inline-perm-row">
            <div class="perm-group">
              <span class="perm-label">{{ t('submit.language') }}</span>
              <div class="lang-dropdown" :class="{ open: langDropdownOpen, up: langDropdownUp }" ref="langDropdownRef">
                <div class="lang-dropdown-trigger" @click="toggleLangDropdown">
                  <span>{{ currentLangLabel }}</span>
                  <svg class="lang-arrow" :class="{ rotated: langDropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div class="lang-dropdown-menu" v-if="langDropdownOpen">
                  <div
                    class="lang-dropdown-item"
                    v-for="opt in langOptions"
                    :key="opt.key"
                    :class="{ active: form.language === opt.key }"
                    @click="form.language = opt.key; langDropdownOpen = false"
                  >{{ t(opt.labelKey) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Publish button -->
        <div class="submit-btn-wrap">
          <button
            class="submit-btn"
            :disabled="isUpload"
            @click="onSubmit"
          >{{ isUpload ? t('submit.count') : t('submit.submit') }}</button>
        </div>
      </div>
    </div>

    <!-- Media Preview Modal -->
    <MediaPreviewModal
      v-model:visible="showPreviewMedia"
      type="video"
      :url="previewMediaUrl"
    />

    <!-- Cover Selection Modal -->
    <SetImageCoverModal
      v-model:visible="showCoverModal"
      :images="coverImages"
      :cover-image="coverUrl"
      :hide-strip="true"
      @confirm="onCoverConfirmed"
    />

    <!-- Subscription Prompt Modal -->
    <SubscriptionPromptModal
      :visible="showSubscriptionModal"
      @cancel="closeSubscriptionModal"
      @go-to-settings="goToSubscriptionSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { processImageUrl } from "@/util/utils";
import Header from "@/components/Header.vue";
import Pagination from "@/components/Pagination.vue";
import MediaPreviewModal from "@/components/MediaPreviewModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import SetImageCoverModal from "@/components/SetImageCoverModal.vue";
import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();
const route = useRoute();

const TITLE_MAX = 60;
const DESC_MAX = 4000;

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc" }[locale.value] || "jp");

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "yes",
  language: defaultLang,
});

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
];

const langDropdownOpen = ref(false);
const langDropdownUp = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);

function toggleLangDropdown() {
  if (langDropdownOpen.value) {
    langDropdownOpen.value = false;
    return;
  }
  const el = langDropdownRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    langDropdownUp.value = spaceBelow < 200;
  }
  langDropdownOpen.value = true;
}

const currentLangLabel = computed(() => {
  const opt = langOptions.find((o) => o.key === form.value.language);
  return opt ? t(opt.labelKey) : "";
});

// Top navigation tabs (5)
const tabList = [
  { name: t("submit.tabs.photo"), path: "/publish/image" },
  { name: t("submit.tabs.video"), path: "/publish/clip" },
  { name: t("submit.tabs.novel"), path: "/publish/novel" },
  { name: t("submit.tabs.manhua"), path: "/publish/comic" },
];
const tabIndex = ref(1);

function changeTab(tab: { name: string; path: string }, _index: number) {
  if (tab.path === route.path) return;
  router.replace(tab.path);
}

// Upload method tabs
const uploadOption = ref("history");
const uploadOptions = [
  { id: "history", value: "history", label: "submit.image.uploadFromHistory" },
  { id: "local", value: "local", label: "submit.video.localUpload" },
];

watch(uploadOption, (newOption) => {
  if (newOption === "history") {
    isLoadingProjects.value = true;
    fetchProjects();
  } else if (newOption === "local") {
    selectedProject.value = null;
    selectedProjectId.value = "";
    coverUrl.value = "";
    videoUrl.value = "";
  }
});

const isLoadingDetail = ref(false);

// Project list (history)
const projects = ref<any[]>([]);
const selectedProjectId = ref<string | number>("");
const selectedProject = ref<any>(null);
const isLoadingProjects = ref(true);

const currentPage = ref(1);
const totalProjects = ref(0);
const pageSize = 10;

// Full publish form state
const showFullContent = ref(false);
const videoUrl = ref("");
const coverUrl = ref("");
const coverImages = ref<string[]>([]);
const showCoverModal = ref(false);
const sessionId = ref("");
const isUpload = ref(false);
const editPostId = ref("");
const uploadProgress = ref(0);

  // Local upload file input
  const videoInputRef = ref<HTMLInputElement | null>(null);
  const reuploadInputRef = ref<HTMLInputElement | null>(null);

const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

const showDropdown = ref(false);
const dropdownType = ref<"" | "#" | "@">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number; align?: 'right' }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);
const showPreviewMedia = ref(false);
const previewMediaUrl = ref("");

const hasActiveSubscription = ref(false);
const showSubscriptionModal = ref(false);

function handlePermissionChange(permission: string) {
  if (permission === "partial" && !hasActiveSubscription.value) {
    showSubscriptionModal.value = true;
    return;
  }
  form.value.permission = permission;
}

async function checkSubscriptionStatus() {
  try {
    const response = await api.getSubscription();
    const data = response as any;
    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = subscription && subscription.plan && parseFloat(subscription.plan.price) > 0;
    }
  } catch (error) {
    console.error("Subscription check error:", error);
    hasActiveSubscription.value = false;
  }
}

function closeSubscriptionModal() {
  showSubscriptionModal.value = false;
}

function goToSubscriptionSettings() {
  showSubscriptionModal.value = false;
  window.location.href = '/user-subscription';
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);

  const currentText = captionRef.value?.innerText || '';
  const currentLength = currentText.length;

  const remainingLength = DESC_MAX - currentLength;
  const pasteText = remainingLength > 0 ? text.substring(0, remainingLength) : '';

  range.deleteContents();

  const textNode = document.createTextNode(pasteText);
  range.insertNode(textNode);

  const newRange = document.createRange();
  newRange.setStartAfter(textNode);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  captionRef.value?.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });

  requestAnimationFrame(() => {
    if (captionRef.value) {
      const el = captionRef.value;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        const tmp = document.createElement('span');
        tmp.textContent = '\u200b';
        r.insertNode(tmp);
        const top = tmp.offsetTop;
        const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
        tmp.parentNode?.removeChild(tmp);
        el.normalize();
        if (top + lineHeight > el.scrollTop + el.clientHeight) {
          el.scrollTop = top + lineHeight - el.clientHeight;
        }
      }
    }
  });

  updateCaptionStats();
}

function truncateContentPreservingTags(element: HTMLElement, maxLength: number) {
  const childNodes = Array.from(element.childNodes);
  let totalLength = 0;
  let overflow = false;

  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    if (overflow) {
      element.removeChild(node);
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const nodeLength = text.replace(/\n$/, '').length;

      if (totalLength + nodeLength > maxLength) {
        const remaining = maxLength - totalLength;
        node.textContent = text.substring(0, remaining > 0 ? remaining : 0);
        overflow = true;
      } else {
        totalLength += nodeLength;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const elText = el.innerText || '';
      const elLength = elText.replace(/\n$/, '').length;

      if (totalLength + elLength > maxLength) {
        if (el.classList.contains('tag')) {
          element.removeChild(node);
        } else {
          truncateContentPreservingTags(el, maxLength - totalLength);
          overflow = true;
        }
      } else {
        totalLength += elLength;
      }
    }
  }

  element.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });
}

async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;

  if (captionRef.value) {
    captionRef.value.querySelectorAll('.tag').forEach((span: Element) => {
      const el = span as HTMLElement;
      el.style.color = '#00d3f2';
      el.contentEditable = 'false';
    });
  }

  const text = target.innerText || "";
  const trimmedText = text.replace(/\n$/, "");
  const currentLength = trimmedText.length;

  if (currentLength > DESC_MAX) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      truncateContentPreservingTags(target, DESC_MAX);

      captionLength.value = DESC_MAX;

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

  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') {
      inSpan = true;
      break;
    }
    node = node.parentNode;
  }
  if (inSpan) {
    showDropdown.value = false;
    return;
  }

  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  const match = textBefore.match(/([#@])([^#@\s]*)$/u);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
    setTimeout(() => {
      isOpeningDropdown.value = false;
    }, 100);
   } else {
    showDropdown.value = false;
  }

  requestAnimationFrame(() => {
    if (captionRef.value) {
      const el = captionRef.value;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const tmp = document.createElement('span');
        tmp.textContent = '\u200b';
        range.insertNode(tmp);
        const top = tmp.offsetTop;
        const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
        tmp.parentNode?.removeChild(tmp);
        el.normalize();
        if (top + lineHeight > el.scrollTop + el.clientHeight) {
          el.scrollTop = top + lineHeight - el.clientHeight;
        }
      }
    }
  });
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
  isDropdownLoading.value = true;
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
  } finally {
    isDropdownLoading.value = false;
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

async function searchTagsImmediate(type: "#" | "@", query: string) {
  isDropdownLoading.value = true;
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
  } finally {
    isDropdownLoading.value = false;
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

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;

  const range = selection.getRangeAt(0).cloneRange();

  let rect: DOMRect;
  if (range.collapsed) {
    const marker = document.createElement('span');
    marker.textContent = '\u200B';
    range.insertNode(marker);
    rect = marker.getBoundingClientRect();
    marker.parentNode?.removeChild(marker);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    rect = range.getBoundingClientRect();
  }

  let absTop = rect.bottom + 5;
  let absLeft = rect.left;

  if ((rect.width === 0 && rect.height === 0) || absTop < 100 || absLeft < 10) {
    const captionRect = captionRef.value.getBoundingClientRect();
    absTop = captionRect.top + 26;
    absLeft = captionRect.left;
  }

  const dropdownHeight = 250;
  const dropdownWidth = 480;

  if (absTop + dropdownHeight > window.innerHeight) {
    const spaceAbove = rect.top;
    if (spaceAbove >= dropdownHeight) {
      dropdownPosition.value = {
        top: 0,
        position: 'above',
        bottom: window.innerHeight - rect.top + 5,
        left: absLeft + 2,
      };
    } else {
      dropdownPosition.value = {
        top: 50,
        left: absLeft + 2,
      };
    }
  } else {
    dropdownPosition.value = {
      top: absTop,
      left: absLeft + 2,
    };
  }

  if (absLeft + dropdownWidth > window.innerWidth) {
    dropdownPosition.value.left = Math.max(10, window.innerWidth - dropdownWidth - 20);
    dropdownPosition.value.right = undefined;
  }
}

function getDropdownStyle(): Record<string, string> {
  const style: Record<string, string> = {};

  if (dropdownPosition.value.position === 'above') {
    style.bottom = `${dropdownPosition.value.bottom}px`;
  } else {
    style.top = `${dropdownPosition.value.top}px`;
  }

  if (dropdownPosition.value.right !== undefined) {
    style.right = `${dropdownPosition.value.right}px`;
  } else if (dropdownPosition.value.left !== undefined) {
    style.left = `${dropdownPosition.value.left}px`;
  }

  return style;
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

  const insertedNode = textNode;

  dropdownType.value = symbol;

  nextTick(async () => {
    await searchTagsImmediate(symbol, "");

    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.rangeCount === 0) return;

    const currentRange = currentSelection.getRangeAt(0);
    lastRange.value = currentRange.cloneRange();

    const symbolRange = document.createRange();
    symbolRange.selectNodeContents(insertedNode);
    const rect = symbolRange.getBoundingClientRect();

    const captionRect = captionRef.value?.getBoundingClientRect();

    let absTop = rect.bottom + 5;
    let absLeft = rect.left;

    if ((rect.width === 0 && rect.height === 0) || !captionRect || absTop < 50 || absLeft < 10 || absTop > window.innerHeight - 50) {
      if (captionRect) {
        absTop = captionRect.top + 26;
        absLeft = captionRect.left;
      }
    }

    dropdownPosition.value = {
      top: absTop,
      left: absLeft,
    };

    const dropdownHeight = 250;
    const dropdownWidth = 280;

    if (absTop + dropdownHeight > window.innerHeight) {
      const spaceAbove = absTop - (captionRect?.top || 0);
      if (spaceAbove >= dropdownHeight) {
        dropdownPosition.value.top = absTop - dropdownHeight - 8;
      } else {
        dropdownPosition.value.top = 100;
      }
    }

    if (absLeft + dropdownWidth > window.innerWidth) {
      dropdownPosition.value.left = Math.max(10, window.innerWidth - dropdownWidth - 10);
    }

    showDropdown.value = true;
    captionRef.value?.focus();
  });
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') {
      inSpan = true;
      break;
    }
    node = node.parentNode;
  }
  if (inSpan) {
    showDropdown.value = false;
    return;
  }

  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  if (textBefore.endsWith('#') || textBefore.endsWith('@')) {
    const trigger = textBefore.endsWith('#') ? '#' : '@';
    const query = '';
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
    setTimeout(() => {
      isOpeningDropdown.value = false;
    }, 100);
  } else {
    showDropdown.value = false;
  }
}

function handleCaptionKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Spacebar") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === 'SPAN') {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            node.textContent = '\u0020' + (node.textContent || '');
            const newRange = document.createRange();
            newRange.setStart(node, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
      if (node === captionRef.value && range.startOffset > 0) {
        const child = node.childNodes[range.startOffset - 1];
        if (child?.nodeName === 'SPAN') {
          const span = child as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            const space = document.createTextNode('\u0020');
            node.insertBefore(space, node.childNodes[range.startOffset] || null);
            const newRange = document.createRange();
            newRange.setStart(space, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
    }

    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBefore = textNode.textContent?.substring(0, range.startOffset) || "";

      const hashMatch = textBefore.match(/#([^#@]+)$/u);

      if (hashMatch) {
        const tagContent = hashMatch[1];
        const hasChineseChars = /[\u4e00-\u9fa5]/.test(tagContent);
        const hasSpaces = tagContent.includes(" ");
        const hasApostrophes = tagContent.includes("'") || tagContent.includes('"');

        if (hasApostrophes) {
          return;
        } else if (hasChineseChars || hasSpaces) {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              toast(t('submit.video.toastTopicLimit'));
              return;
            }
          }

          const fullMatch = "#" + tagContent.trim();
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (range.startOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          if (newLength > DESC_MAX) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, range.startOffset);

          tagRange.deleteContents();

          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";

          tagRange.insertNode(span);

          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          tagRange.setStart(space, 1);
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          showDropdown.value = false;

          updateCaptionStats();
          return;
        } else {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              toast(t('submit.video.toastTopicLimit'));
              return;
            }
          }

          const fullMatch = hashMatch[0];
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (range.startOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          if (newLength > DESC_MAX) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, range.startOffset);

          tagRange.deleteContents();

          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";

          tagRange.insertNode(span);

          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          tagRange.setStart(space, 1);
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          showDropdown.value = false;

          updateCaptionStats();
          return;
        }
      }
    }
  }

  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType === Node.TEXT_NODE && offset > 0) {
        const charBefore = node.textContent?.[offset - 1];

        if (charBefore === "\u0020" || charBefore === " ") {
          if (offset === 1 && node.previousSibling?.nodeName === "SPAN") {
            const span = node.previousSibling as HTMLElement;
            if (span.classList.contains("tag")) {
              return;
            }
          }
        }
      }

      if (offset === 0 && node.previousSibling?.nodeName === "SPAN") {
        const span = node.previousSibling as HTMLElement;
        if (span.classList.contains("tag")) {
          e.preventDefault();
          span.remove();
          showDropdown.value = false;
          updateCaptionStats();
          return;
        }
      }

      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === "SPAN") {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains("tag")) {
            e.preventDefault();
            span.remove();
            showDropdown.value = false;
            updateCaptionStats();
            return;
          }
        }
      }
    }
  }
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

  const currentText = captionRef.value.innerText || "";
  const currentLength = currentText.length;
  const tagText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  const spaceText = " ";
  const newLength = currentLength + tagText.length + spaceText.length;

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
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }

  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  span.innerText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  span.style.color = "#00d3f2";

  range.insertNode(span);

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
  if (isOpeningDropdown.value) return;

  if (showDropdown.value &&
      !document.querySelector(".mention-dropdown")?.contains(target) &&
      !captionRef.value?.contains(target)) {
    showDropdown.value = false;
  }
}

const accessRights = computed(() => {
  if (form.value.permission === "partial") return 2;
  if (form.value.permission === "private") return 3;
  return 1;
});

function handleUserInfoLoaded() {
  // placeholder for header user-info callback
}

function goBack() {
  router.go(-1);
}

function goToHome() {
  router.push("/");
}

function getProjectCover(project: any): string {
  const ra = typeof project.result_async === 'string' ? (() => { try { return JSON.parse(project.result_async || '{}'); } catch { return {}; } })() : (project.result_async || {});
  const finalVideos = ra.final_videos || [];
  const firstVideo = finalVideos[0] || ra.final_video_output || {};
  return firstVideo.video_cover_url || ra.cover_url || ra.cover || ra.final_video_cover || project.cover || project.video_cover_url || "";
}

function getI18nMsg(res: any): string {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: "msg_cn", jp: "msg_jp", tc: "msg_tc" };
  return (res as any)[msgMap[lang] || "msg"] || res?.msg || "";
}

// Project list loading
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = (await api.singleTaskList(currentPage.value, 10, "simple_video", true)) as any;
    if (response.code != 200) {
      toast(t("fail"));
      return;
    }
    projects.value = response.data.data_list || [];
    if (response.data.data_total) {
      totalProjects.value = response.data.data_total;
    } else if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }

    if (projects.value.length > 0 && !selectedProjectId.value) {
      selectedProjectId.value = projects.value[0].id;
      selectedProject.value = projects.value[0];
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    isLoadingProjects.value = false;
  }
}

watch(currentPage, () => {
  if (uploadOption.value === "history") {
    isLoadingProjects.value = true;
    fetchProjects();
  }
});

// Select a project from history (toggle selection, don't go to publish form yet)
async function selectProject(project: any) {
  if (selectedProjectId.value == project.id) {
    selectedProjectId.value = "";
    selectedProject.value = null;
    return;
  }
  selectedProjectId.value = project.id;
  selectedProject.value = project;
}

async function confirmSelectedProject() {
  const project = selectedProject.value;
  if (!project) return;

  const projectRa = typeof project.result_async === 'string'
    ? (() => { try { return JSON.parse(project.result_async || '{}'); } catch { return {}; } })()
    : (project.result_async || {});
  const projectFinalVideos = projectRa.final_videos || [];
  const projectFirstVideo = projectFinalVideos[0] || {};

  const cover = projectFirstVideo.video_cover_url || projectRa.cover_url || projectRa.cover || project?.cover || "";
  coverUrl.value = cover;

  coverImages.value = projectFinalVideos
    .map((v: any) => v.video_cover_url)
    .filter(Boolean);

  const currentSessionId: string =
    (project?.session_id as string) || (route.query.session_id as string) || "";
  if (currentSessionId) {
    sessionId.value = currentSessionId;
  }

  let url = projectFirstVideo.video_url || "";

  if (!url && currentSessionId) {
    try {
      const chapterRes = (await api.detailChapter(currentSessionId, 1)) as any;
      if (chapterRes.code == 200 && chapterRes.data) {
        const resultAsync = chapterRes.data.result_async;
        if (resultAsync?.final_video_output) {
          url =
            resultAsync.final_video_output.video_url_1080p ||
            resultAsync.final_video_output.video_url ||
            "";
        }
        if (!url && resultAsync?.final_videos?.length > 0) {
          url = resultAsync.final_videos[0].video_url || "";
        }
        if (!cover && resultAsync?.final_videos?.length > 0) {
          coverUrl.value = resultAsync.final_videos[0].video_cover_url || "";
        }
        if (resultAsync?.final_videos?.length > 0) {
          coverImages.value = resultAsync.final_videos
            .map((v: any) => v.video_cover_url)
            .filter(Boolean);
        }
        if (chapterRes.data.title) {
          form.value.title = chapterRes.data.title;
        }
        if (chapterRes.data.chapter_description) {
          form.value.description = chapterRes.data.chapter_description;
        }
      }
    } catch (error) {
      console.error("Error fetching chapter details for publish:", error);
    }
  }

  if (url) {
    videoUrl.value = url;
    showFullContent.value = true;
  } else {
    toast(t("submit.video.noVideoContent"));
  }
}

function openViewModal(project: any) {
  const url =
    project?.result_async?.final_videos?.[0]?.video_url ||
    project?.video_url ||
    "";
  if (url) {
    previewMediaUrl.value = url;
    showPreviewMedia.value = true;
  }
}

function previewVideo() {
  if (videoUrl.value) {
    previewMediaUrl.value = videoUrl.value;
    showPreviewMedia.value = true;
  }
}

function reuploadVideo() {
  reuploadInputRef.value?.click();
}

function onReuploadPicked(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleVideoFile(file);
  }
  target.value = "";
  showFullContent.value = false;
  videoUrl.value = "";
  coverUrl.value = "";
}

// Local upload handlers
function pickVideo() {
  videoInputRef.value?.click();
}

function onDropFile(e: DragEvent) {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleVideoFile(files[0]);
  }
}

function onVideoPicked(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleVideoFile(file);
  }
  target.value = "";
}

async function handleVideoFile(file: File) {
  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  if (extension !== "mp4" && extension !== "mov") {
    toast(t("submit.video.formatError"));
    return;
  }

  isUpload.value = true;
  uploadProgress.value = 0;

  try {
    // Validate metadata first
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    const metadataOk = await new Promise<boolean>((resolve) => {
      video.onloadedmetadata = () => {
        if (video.duration > 3600) {
          resolve(false);
          return;
        }
        if (video.duration === 0 || isNaN(video.duration) || video.videoWidth === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 15000);
    });

    if (!metadataOk) {
      URL.revokeObjectURL(video.src);
      isUpload.value = false;
      if (video.duration > 3600) {
        toast(t("submit.video.durationLimit"));
      } else {
        toast(t("submit.video.corruptedError"));
      }
      return;
    }

    URL.revokeObjectURL(video.src);

    // 1. Get uploadId + fileKey
    const videoIdResponse = (await api.getVideoId({
      filename: file.name,
      filesize: file.size,
    })) as any;
    if (!videoIdResponse || videoIdResponse.code != 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoIdResponse));
      return;
    }

    uploadProgress.value = 30;
    const { uploadId, fileKey } = videoIdResponse.data;

    // 2. Upload parts in 5MB chunks
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const uploadedParts: { PartNumber: number; ETag: string }[] = [];

    for (let i = 1; i <= totalParts; i++) {
      const start = (i - 1) * CHUNK_SIZE;
      const end = Math.min(i * CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("key", fileKey);
      formData.append("partNumber", String(i));
      formData.append("file", chunk);

      const authToken = localStorage.getItem("token") ?? "";
      const authHeaders = (window as any).AntiCrawler.generateAuthParams(authToken);
      const videoUrlResponse = await fetch(baseUrl + "user/uploadCosPart", {
        method: "POST",
        headers: {
          token: authToken || undefined,
          Platform: "web",
          ...authHeaders,
        } as Record<string, string>,
        body: formData,
      });
      const videoUrlData = await videoUrlResponse.json();
      if (!videoUrlData || videoUrlData.code !== 0) {
        isUpload.value = false;
        toast(getI18nMsg(videoUrlData));
        return;
      }

      const etag = videoUrlData.data?.etag || "";
      uploadedParts.push({ PartNumber: i, ETag: etag });

      uploadProgress.value = Math.round(30 + (i / totalParts) * 60);
    }

    // 3. Merge parts
    const videoMergeResponse = (await api.getVideoMerge({
      uploadId,
      key: fileKey,
      parts: JSON.stringify(uploadedParts),
    })) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoMergeResponse));
      return;
    }

    videoUrl.value = videoMergeResponse.data.url || "";
    uploadProgress.value = 100;

    // Capture first frame as cover
    await captureFirstFrame(file);

    isUpload.value = false;
    showFullContent.value = true;
  } catch (error) {
    isUpload.value = false;
    toast(t("fail"));
  }
}

async function captureFirstFrame(file: File) {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
      resolve();
    };
    video.onerror = () => resolve();
  });

  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
    setTimeout(() => resolve(), 3000);
  });

  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    await mockUploadCover(dataUrl);
  } catch (error) {
    console.error("Error capturing first frame:", error);
  }

  URL.revokeObjectURL(video.src);
}

async function mockUploadCover(dataUrl: string) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], "cover.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);

    const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);

    const res = await fetch(baseUrl + "user/uploadFile", {
      method: "POST",
      headers: {
        token: token,
        Platform: "web",
        ...authHeaders,
      } as Record<string, string>,
      body: formData,
    });
    const data = await res.json();
    if (data && (data.code === 0 || data.code === 200) && data.data?.url) {
      coverUrl.value = data.data.url;
      if (!coverImages.value.includes(data.data.url)) {
        coverImages.value.unshift(data.data.url);
      }
    }
  } catch (error) {
    console.error("Error uploading cover:", error);
  }
}

function openCoverModal() {
  showCoverModal.value = true;
}

function onCoverConfirmed(url: string) {
  coverUrl.value = url;
}

// Publish submit
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }

  if (!form.value.title.trim()) {
    toast(t("submit.titleRequired"));
    return;
  }

  if (!videoUrl.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  if (!coverUrl.value) {
    toast(t("submit.video.toastSetCover"));
    return;
  }

  isUpload.value = true;

  try {
    const isEditMode = !!editPostId.value;
    const payload = {
      type: 5,
      title: form.value.title.trim(),
      cover: coverUrl.value,
      content: form.value.description.trim(),
      is_nsfw: form.value.content === "yes" ? 1 : 0,
      access_rights: accessRights.value,
      video_url: videoUrl.value,
      language: form.value.language,
      ...(sessionId.value ? { session_id: sessionId.value } : {}),
      ...(isEditMode && { post_id: editPostId.value }),
    };

    const headers = new Headers();
    const { ts, sign } = (window as any).AntiCrawler.generateAuthParams(token);
    headers.append("token", token);
    headers.append("ts", ts);
    headers.append("sign", sign);
    headers.append("Content-Type", "application/json");
    headers.append("Platform", "web");

    const data = JSON.stringify(payload);

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data,
    };

    const url = isEditMode
      ? `${baseUrl}post/modifyPostFive`
      : `${baseUrl}post/addPostFive`;
    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      router.push("/publish/success?type=5");
    } else {
      toast(getI18nMsg(res));
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isUpload.value = false;
  }
}

function renderCaptionContent() {
  if (!captionRef.value) return;
  const content = form.value.description || "";
  captionRef.value.innerHTML = '';

  const regex = /\[mention:(\d+)\|([^\]]+)\]|(?<=^|\s)(#[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      captionRef.value!.appendChild(document.createTextNode(textBefore));
    }

    if (match[1] !== undefined) {
      const value = parseInt(match[1]);
      const username = match[2];

      if (value > 0) {
        const span = document.createElement('span');
        span.className = 'tag mention';
        span.style.color = '#00d3f2';
        span.style.marginRight = '4px';
        span.contentEditable = 'false';
        span.textContent = username;
        captionRef.value!.appendChild(span);
      } else {
        captionRef.value!.appendChild(document.createTextNode(username));
      }
    } else if (match[3] !== undefined) {
      const span = document.createElement('span');
      span.className = 'tag topic';
      span.style.color = '#00d3f2';
      span.style.marginRight = '4px';
      span.contentEditable = 'false';
      span.textContent = match[3];
      captionRef.value!.appendChild(span);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    captionRef.value!.appendChild(document.createTextNode(textAfter));
  }

  captionLength.value = captionRef.value.innerText.length;
}

// URL jump entry
onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  checkSubscriptionStatus();

  const sid = route.query.session_id as string;
  const postId = route.query.post_id as string;

  if (postId || sid) {
    isLoadingDetail.value = true;
  }

  if (postId) {
    editPostId.value = postId;
    try {
      const postRes = await api.modifyPostDetail(postId) as any;
      if ((postRes.code === 200 || postRes.code === 0) && postRes.data) {
        const post = postRes.data.post || postRes.data;
        form.value.title = post.title || "";
        const rawContent = post.content_replace || post.content || "";
        form.value.description = rawContent;
        if (post.is_nsfw == 1 || post.is_nsfw == '1') form.value.content = "yes";
        if (post.access_rights == 2 || post.access_rights == '2') form.value.permission = "partial";
        if (post.access_rights == 3 || post.access_rights == '3') form.value.permission = "private";
        if (post.language) form.value.language = post.language;
        if (post.cover) coverUrl.value = post.cover;
        if (post.video_url) videoUrl.value = post.video_url;
        if (post.session_id) sessionId.value = post.session_id;
        if (videoUrl.value && sessionId.value) {
          try {
            const detailRes = await api.detailProject(sessionId.value) as any;
            if (detailRes.code === 200 && detailRes.data) {
              const dRa = typeof detailRes.data.result_async === 'string'
                ? (() => { try { return JSON.parse(detailRes.data.result_async || '{}'); } catch { return {}; } })()
                : (detailRes.data.result_async || {});
              const dFv = dRa.final_videos || [];
              if (dFv.length > 0) {
                coverImages.value = dFv.map((v: any) => v.video_cover_url).filter(Boolean);
              }
            }
          } catch {}
        }
        if (videoUrl.value) {
          isLoadingDetail.value = false;
          showFullContent.value = true;
          await nextTick();
          renderCaptionContent();
          return;
        }
        isLoadingDetail.value = false;
        showFullContent.value = true;
        await nextTick();
        renderCaptionContent();
        return;
      }
    } catch (error) {
      console.error("Error fetching post detail:", error);
    }
    isLoadingDetail.value = false;
  }

  if (sid) {
    sessionId.value = sid;
    try {
      const detailRes = await api.detailProject(sid) as any;
      if (detailRes.code === 200 && detailRes.data) {
        const ra = typeof detailRes.data.result_async === 'string'
          ? (() => { try { return JSON.parse(detailRes.data.result_async || '{}'); } catch { return {}; } })()
          : (detailRes.data.result_async || {});
        const finalVideos = ra.final_videos || [];
        const firstVideo = finalVideos[0] || ra.final_video_output || {};
        const vUrl = firstVideo.video_url || ra.final_video || detailRes.data.video_url || '';
        const vCover = firstVideo.video_cover_url || ra.cover_url || ra.cover || ra.final_video_cover || detailRes.data.cover || '';
        if (vUrl) {
          videoUrl.value = vUrl;
          coverUrl.value = vCover;
          coverImages.value = finalVideos
            .map((v: any) => v.video_cover_url)
            .filter(Boolean);
          isLoadingDetail.value = false;
          showFullContent.value = true;
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching project detail:", error);
    }
    isLoadingDetail.value = false;
  }

  // default to history tab
  isLoadingProjects.value = true;
  fetchProjects();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
@use "@/scss/Clip.scss";
</style>
