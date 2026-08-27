<template>
  <div class="submit-image" :class="imageUrls.length > 0 ? 'on' : ''">
    <Header :cur="-1"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- Top Nav Tabs -->
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

      <!-- Loading Detail State -->
      <div v-if="isLoadingDetail" class="loading-detail-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">{{ t('loading') }}</span>
      </div>

      <!-- Upload Method Section (hidden once images are chosen) -->
      <div class="upload-tabs" v-else-if="!showFullContent">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.image.imageLabel") }}</span>
        </div>

        <!-- Upload Method Tabs -->
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

        <!-- History Tab -->
        <div v-if="uploadOption === 'history'" class="history-list">
          <!-- Loading State -->
          <div v-if="isLoadingProjects" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('loading') }}</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="projects.length === 0" class="empty-state">
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
                :class="{ selected: selectedProjectIds.includes(project.id) }"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
                @click="toggleProjectSelection(project)"
              >
                <img :src="processImageUrl(getProjectCover(project))" alt="" class="project-image" />
                <div class="view-icon" @click.stop="openImageView(project)">
                  <img src="@/assets/images/publish/view.png" alt="View" />
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
              <button class="confirm-btn" :disabled="selectedProjectIds.length === 0" @click="confirmSelectedProjects">
                {{ t('submit.cover.confirm') }}{{ selectedProjectIds.length > 0 ? ` (${selectedProjectIds.length}/12)` : '' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Local Upload Tab -->
        <div v-else-if="uploadOption === 'local'" class="upload-area-box">
          <div
            class="upload-area"
            @dragover.prevent="onDragOver"
            @drop.prevent="onDropImages"
          >
            <div class="upload-info">
              <p>{{ t("submit.image.uploadCta") }}</p>
              <button class="btn" @click="pickImages" :disabled="imageFiles.length >= 12">
                {{ t("submit.image.uploadBtn") }}
              </button>
            </div>
            <div class="upload-spec">
              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specFormat") }}</span>
                <span>{{ t("submit.image.formatInfo") }}</span>
              </div>

              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specSize") }}</span>
                <span>{{ t("submit.image.sizeInfo") }}</span>
              </div>

              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specResolution") }}</span>
                <span>{{ t("submit.image.resolutionInfo") }}</span>
              </div>
            </div>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              title=""
              class="hidden-file"
              @click.stop
              @change="onImagesPicked"
            />
          </div>
        </div>
      </div>

      <!-- Image Preview Area -->
      <div class="preview-section" v-if="showFullContent && imageUrls.length > 0">
        <div class="form-label-box">
          <span><b>*</b>{{ t('submit.image.imageLabel') }}</span>
          <button v-if="imageUrls.length < 15" class="add-more-btn" @click="addMoreImages">{{ t('submit.image.add') }}</button>
          <input
            ref="addImagesInputRef"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            title=""
            class="hidden-file"
            @change="onAddImagesPicked"
          />
        </div>
        <div class="image-list-box">
          <div class="image-list">
            <div
              v-for="(url, index) in imageUrls"
              :key="index"
              class="image-item"
            >
              <img class="image" :src="processImageUrl(url)" alt="" />
              <div class="image-btn">
                <div class="reload">
                  <img
                    src="@/assets/images/publish/reload.png"
                    alt=""
                    @click.stop="reloadImage(index)"
                  />
                </div>
                <img
                  src="@/assets/images/publish/delete.png"
                  alt=""
                  @click="removeImage(index)"
                  v-if="imageUrls.length > 1"
                />
              </div>
            </div>
          </div>
        </div>

        <input
          ref="reuploadInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          class="hidden-file"
          style="display: none;"
          @change="onReuploadPicked"
        />

        <!-- Permission -->
        <div class="inline-perm-row">
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.permission') }}</span>
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
      </div>

      <!-- Cover Section -->
      <div class="preview-section cover-section" v-if="showFullContent && imageUrls.length > 0">
        <div class="form-label-box">
          <span><b>*</b>{{ t('submit.coverLabel') }}</span>
        </div>
        <div class="cover-row">
          <div class="cover-upload">
            <img v-if="coverPreview" :src="processImageUrl(coverPreview)" alt="" class="cover-preview" />
            <div v-else class="cover-placeholder">
              <img src="@/assets/images/user/upload.png" alt="" />
              <span>{{ t('collection.uploadCover') }}</span>
            </div>
          </div>
          <button class="set-cover" @click="openCoverModal">{{ t('submit.image.setting') }}</button>
        </div>
      </div>

      <!-- Publish Form -->
      <div class="form-section" v-if="showFullContent">
        <!-- Title -->
        <div class="form-item">
          <div class="form-label-box">
            <span><b>*</b>{{ t('submit.titleLabel') }}</span>
            <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
          </div>
          <input
            type="text"
            class="form-input"
            v-model="form.title"
            :placeholder="t('submit.titlePlaceholder')"
            :maxlength="TITLE_MAX"
          />
        </div>

        <!-- Description -->
        <div class="form-item">
          <div class="form-label-box">
            <span>{{ t('submit.descriptionLabel') }}</span>
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

        <!-- Content Settings -->
        <div class="inline-perm-row" v-if="false">
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

      <!-- Publish Button -->
      <div class="submit-section" v-if="showFullContent">
        <button class="publish-btn" :disabled="isUploading" @click="onSubmit">
          {{ isUploading ? t('submit.publishing') : t('submit.submit') }}
        </button>
      </div>
    </div>

    <!-- Cover Selection Modal -->
    <SetImageCoverModal
      v-model:visible="showCoverModal"
      :images="imageUrls"
      :cover-image="coverPreview"
      @confirm="onCoverConfirmed"
    />

    <!-- Media Preview Modal -->
    <MediaPreviewModal
      v-model:visible="showPreviewMedia"
      :type="previewMediaType"
      :url="previewMediaUrl"
    />

    <!-- Subscription Prompt Modal -->
    <SubscriptionPromptModal
      :visible="showSubscriptionModal"
      @cancel="closeSubscriptionModal"
      @go-to-settings="goToSubscriptionSettings"
    />

    <UploadMask :visible="isUploadingImages" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { processImageUrl } from "@/util/utils";
import Header from "@/components/Header.vue";
import Pagination from "@/components/Pagination.vue";
import SetImageCoverModal from "@/components/SetImageCoverModal.vue";
import MediaPreviewModal from "@/components/MediaPreviewModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import UploadMask from "@/components/UploadMask.vue";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();
const route = useRoute();

const TITLE_MAX = 60;
const DESC_MAX = 4000;
const pageSize = 15;

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

interface TabItem {
  name: string;
  path: string;
}

const tabList = ref<TabItem[]>([]);
const tabIndex = ref(2);

const uploadOption = ref("history");
const uploadOptions = [
  { id: "history", value: "history", label: "submit.image.uploadFromHistory" },
  { id: "local", value: "local", label: "submit.image.localUpload" },
];

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc" }[locale.value] || "jp");

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "yes",
  language: defaultLang,
});

const session_id = ref("");
const imageUrls = ref<string[]>([]);
const imageSessionMap = ref<Map<string, string>>(new Map());
const coverPreview = ref("");
const showCoverModal = ref(false);
const showFullContent = ref(false);
const isUploading = ref(false);
const isUpload = ref(false);
const editPostId = ref("");
const previewImageUrl = ref("");
const showPreviewMedia = ref(false);
const previewMediaType = ref<'image' | 'video'>('image');
const previewMediaUrl = ref("");

const hasActiveSubscription = ref(false);
const showSubscriptionModal = ref(false);

const isLoadingDetail = ref(false);
const isUploadingImages = ref(false);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const reuploadIndex = ref<number | null>(null);

// History list state
const projects = ref<any[]>([]);
const totalProjects = ref(0);
const currentPage = ref(1);
const isLoadingProjects = ref(false);
const selectedProjectIds = ref<(number | string)[]>([]);
const selectedProjectsMap = ref<Map<number | string, any>>(new Map());

// Local upload state
type PreviewFile = File & { _key: string; _preview: string; _url?: string };
const imageFiles = ref<PreviewFile[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);
const addImagesInputRef = ref<HTMLInputElement | null>(null);

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

function addMoreImages() {
  addImagesInputRef.value?.click();
}

function onAddImagesPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  const maxCount = 12;
  if (imageUrls.value.length + files.length > maxCount) {
    toast(t("submit.image.maxSelectTip"));
    return;
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const validFiles: File[] = [];
  for (const f of files) {
    if (!validTypes.includes(f.type)) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast(t("submit.image.uploadTip"));
      continue;
    }
    validFiles.push(f);
  }

  if (validFiles.length === 0) return;

  isUploadingImages.value = true;
  Promise.all(validFiles.map(f => uploadImageForAdd(f))).finally(() => {
    isUploadingImages.value = false;
  });
}

async function uploadImageForAdd(file: File) {
  const token = localStorage.getItem("token");
  if (!token) { router.push("/login"); return; }
  const formData = new FormData();
  formData.append("file", file);
  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);
  try {
    const res = await fetch(baseUrl + "user/uploadImage", {
      method: "POST",
      headers: { token, Platform: "web", ...authHeaders },
      body: formData,
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === "string" && url) {
        imageUrls.value.push(url);
        imageSessionMap.value.set(url, session_id.value || "");
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
  }
}

function reloadImage(idx: number) {
  reuploadIndex.value = idx;
  reuploadInputRef.value?.click();
}

function removeImage(idx: number) {
  const removedUrl = imageUrls.value[idx];
  imageUrls.value.splice(idx, 1);
  imageSessionMap.value.delete(removedUrl);
  if (coverPreview.value === removedUrl) {
    coverPreview.value = imageUrls.value[0] || "";
  }
}

async function onReuploadPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  input.value = "";
  if (reuploadIndex.value === null || !file) return;

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    toast(t("submit.image.uploadFormatError"));
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast(t("submit.image.uploadTip"));
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) { router.push("/login"); return; }

  isUploadingImages.value = true;
  const formData = new FormData();
  formData.append("file", file);
  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);
  try {
    const res = await fetch(baseUrl + "user/uploadImage", {
      method: "POST",
      headers: { token, Platform: "web", ...authHeaders },
      body: formData,
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === "string" && url) {
        const idx = reuploadIndex.value;
        const oldUrl = imageUrls.value[idx];
        imageUrls.value.splice(idx, 1, url);
        imageSessionMap.value.delete(oldUrl);
        imageSessionMap.value.set(url, session_id.value || "");
        if (coverPreview.value === oldUrl) {
          coverPreview.value = url;
        }
      }
    }
  } catch (error) {
    console.error("Reupload error:", error);
  } finally {
    isUploadingImages.value = false;
    reuploadIndex.value = null;
  }
}

function buildTabList(): TabItem[] {
  return [
    { name: t("submit.tabs.novel"), path: "/publish/novel" },
    { name: t("submit.tabs.manhua"), path: "/publish/comic" },
    { name: t("submit.tabs.photo"), path: "/publish/image" },
    { name: t("submit.tabs.video"), path: "/publish/clip" },
  ];
}

function getProjectCover(project: any): string {
  const ra = typeof project.result_async === 'string' ? JSON.parse(project.result_async || '{}') : (project.result_async || {});
  return (ra.final_images && ra.final_images[0]) || project.cover || "";
}

function goBack() {
  router.go(-1);
}

function goToHome() {
  router.push("/");
}

function openCoverModal() {
  showCoverModal.value = true;
}

function onCoverConfirmed(url: string) {
  coverPreview.value = url;
}

function openImageView(project: any) {
  const cover = getProjectCover(project);
  if (cover) {
    previewMediaType.value = 'image';
    previewMediaUrl.value = processImageUrl(cover);
    showPreviewMedia.value = true;
  }
}

function changeTab(item: TabItem, index: number) {
  if (tabIndex.value === index) {
    return;
  }
  tabIndex.value = index;
  router.replace(item.path);
}

// Fetch photo generation history
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = await api.singleTaskList(currentPage.value, pageSize, "simple_image", true) as any;
    if (response.code !== 200) {
      toast(t("fail"));
      return;
    }

    projects.value = response.data.data_list || [];

    if (response.data.data_total) {
      totalProjects.value = response.data.data_total;
    } else if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }

    if (projects.value.length > 0 && selectedProjectIds.value.length === 0) {
      selectedProjectIds.value = [projects.value[0].id];
      selectedProjectsMap.value.set(projects.value[0].id, projects.value[0]);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    isLoadingProjects.value = false;
  }
}

function toggleProjectSelection(project: any) {
  const idx = selectedProjectIds.value.indexOf(project.id);
  if (idx >= 0) {
    selectedProjectIds.value.splice(idx, 1);
    selectedProjectsMap.value.delete(project.id);
  } else {
    if (selectedProjectIds.value.length >= 12) {
      toast(t("submit.image.maxSelectTip"));
      return;
    }
    selectedProjectIds.value.push(project.id);
    selectedProjectsMap.value.set(project.id, project);
  }
}

async function confirmSelectedProjects() {
  if (selectedProjectIds.value.length === 0) return;

  const selected = selectedProjectIds.value.map(id => selectedProjectsMap.value.get(id)).filter(Boolean);
  const allUrls: string[] = [];

  for (const project of selected) {
    let urls: string[] = [];
    const ra = project.result_async;
    if (ra && Array.isArray(ra.final_images) && ra.final_images.length > 0) {
      urls = ra.final_images;
    } else if (ra && Array.isArray(ra.images) && ra.images.length > 0) {
      urls = ra.images;
    }

    if (urls.length === 0 && project.session_id) {
      try {
        const detailRes = await api.detailProject(project.session_id) as any;
        if (detailRes.code === 200 && detailRes.data) {
          Object.assign(project, detailRes.data);
        }
        const dRA = project.result_async;
        if (dRA && Array.isArray(dRA.final_images) && dRA.final_images.length > 0) {
          urls = dRA.final_images;
        } else if (dRA && Array.isArray(dRA.images) && dRA.images.length > 0) {
          urls = dRA.images;
        }
        if (urls.length === 0) {
          const episode = project.episode || project.chapter || 1;
          const chapterRes = await api.detailChapter(project.session_id, episode) as any;
          if (chapterRes.code === 200 && chapterRes.data) {
            const cd = chapterRes.data;
            let cRA = cd.result_async;
            if (typeof cRA === "string") {
              try { cRA = JSON.parse(cRA); } catch { cRA = null; }
            }
            if (Array.isArray(cd.final_images) && cd.final_images.length > 0) {
              urls = cd.final_images;
            } else if (Array.isArray(cd.images) && cd.images.length > 0) {
              urls = cd.images;
            } else if (cRA && Array.isArray(cRA.final_images) && cRA.final_images.length > 0) {
              urls = cRA.final_images;
            } else if (cRA && Array.isArray(cRA.images) && cRA.images.length > 0) {
              urls = cRA.images;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project detail:", error);
      }
    }

    allUrls.push(...urls);
    const sid = project.session_id || session_id.value || "";
    for (const u of urls) {
      imageSessionMap.value.set(u, sid);
    }
  }

  if (allUrls.length === 0) {
    toast(t("fail"));
    return;
  }

  imageUrls.value = allUrls.slice(0, 15);
  coverPreview.value = allUrls[0] || "";
  const firstProject = selected[0];
  session_id.value = firstProject?.session_id || "";
  showFullContent.value = true;
  if (firstProject?.name) {
    form.value.title = firstProject.name;
  }
}

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

// --- Local upload helpers ---
function pickImages() {
  if (imageFiles.value.length >= 12) {
    toast(t("submit.image.maxSelectTip"));
    return;
  }
  imageInputRef.value?.click();
}

function onImagesPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  appendFiles(files);
}

function onDragOver() {}

function onDropImages(e: DragEvent) {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  const files = Array.from(e.dataTransfer?.files ?? []);
  appendFiles(files);
}

function isImageCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width === 0 || img.height === 0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

async function appendFiles(files: File[]) {
  const maxCount = 12;
  const maxSize = 10 * 1024 * 1024;
  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  for (const f of files) {
    if (imageFiles.value.length >= maxCount) {
      toast(t("submit.image.maxSelectTip"));
      break;
    }
    if (!validImageTypes.includes(f.type)) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > maxSize) {
      toast(t("home.error.maxPhotoSize", { max: 10 }));
      continue;
    }

    const corrupted = await isImageCorrupted(f);
    if (corrupted) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }

    const pf = f as PreviewFile;
    pf._key = `${Date.now()}_${Math.random()}`;
    pf._preview = URL.createObjectURL(f);

    uploadImage(pf);
  }
}

function uploadImage(pf: PreviewFile) {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return false;
  }

  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validImageTypes.includes(pf.type)) {
    toast(t("submit.image.uploadFormatError"));
    return false;
  }

  isUpload.value = true;

  const formData = new FormData();
  formData.append("file", pf);

  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);

  const parma = {
    method: "POST",
    headers: {
      token: token,
      Platform: "web",
      ...authHeaders,
    },
    body: formData,
  };

  fetch(baseUrl + "user/uploadImage", parma)
    .then((response) => response.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const url = (res?.data && (res.data.url || res.data)) || res?.url;
        if (typeof url === "string") {
          pf._url = url;
        }

        imageFiles.value.push(pf);

        if (imageFiles.value.length === 1) {
          coverPreview.value = pf._url || pf._preview;
        }

        showFullContent.value = true;
        isUpload.value = false;
      } else {
        toast(locale.value === "en" ? res.msg : locale.value === "zh" ? res.msg_cn : locale.value === "tc" ? res.msg_tc : res.msg_jp);
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      isUpload.value = false;
    });

  return true;
}

// Keep imageUrls in sync with uploaded files (first is cover)
const uploadedUrls = computed(() => imageFiles.value.filter((f) => f._url).map((f) => f._url!));

// --- Contenteditable helpers ---
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
    dropdownItems.value = [];
  } finally {
    isDropdownLoading.value = false;
  }
}

function updateCaptionStats() {
  if (captionRef.value) {
    captionLength.value = captionRef.value.innerText.replace(/\n$/, "").length;
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
      dropdownPosition.value = { top: 0, position: 'above', bottom: window.innerHeight - rect.top + 5, left: absLeft + 2 };
    } else {
      dropdownPosition.value = { top: 50, left: absLeft + 2 };
    }
  } else {
    dropdownPosition.value = { top: absTop, left: absLeft + 2 };
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
      if (captionRect) { absTop = captionRect.top + 26; absLeft = captionRect.left; }
    }
    dropdownPosition.value = { top: absTop, left: absLeft };
    const dropdownHeight = 250;
    const dropdownWidth = 280;
    if (absTop + dropdownHeight > window.innerHeight) {
      const spaceAbove = absTop - (captionRect?.top || 0);
      if (spaceAbove >= dropdownHeight) { dropdownPosition.value.top = absTop - dropdownHeight - 8; }
      else { dropdownPosition.value.top = 100; }
    }
    if (absLeft + dropdownWidth > window.innerWidth) {
      dropdownPosition.value.left = Math.max(10, window.innerWidth - dropdownWidth - 10);
    }
    showDropdown.value = true;
    captionRef.value?.focus();
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
    captionLength.value = DESC_MAX;
    return;
  }
  captionLength.value = currentLength;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') { inSpan = true; break; }
    node = node.parentNode;
  }
  if (inSpan) { showDropdown.value = false; return; }
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
    setTimeout(() => { isOpeningDropdown.value = false; }, 100);
  } else {
    showDropdown.value = false;
  }
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') { inSpan = true; break; }
    node = node.parentNode;
  }
  if (inSpan) { showDropdown.value = false; return; }
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  if (textBefore.endsWith('#') || textBefore.endsWith('@')) {
    const trigger = textBefore.endsWith('#') ? '#' : '@';
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, '');
    setTimeout(() => { isOpeningDropdown.value = false; }, 100);
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
        if (hasChineseChars || hasSpaces) {
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
          if (currentText.length + 1 > DESC_MAX) { e.preventDefault(); return; }
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
            if (existingTopicTags.length >= 5) { e.preventDefault(); toast(t('submit.video.toastTopicLimit')); return; }
          }
          const fullMatch = "#" + tagContent;
          const currentText = captionRef.value?.innerText || "";
          if (currentText.length + 1 > DESC_MAX) { e.preventDefault(); return; }
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
  const currentText = captionRef.value?.innerText || '';
  const remainingLength = DESC_MAX - currentText.length;
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
  updateCaptionStats();
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;
  const selection = window.getSelection();
  if (!selection) return;
  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) { toast(t("submit.video.toastTopicLimit")); showDropdown.value = false; return; }
  }
  const currentText = captionRef.value.innerText || "";
  const tagText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  const spaceText = " ";
  if (currentText.length + tagText.length + spaceText.length > DESC_MAX) { showDropdown.value = false; return; }
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

// --- Submit ---
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  if (!form.value.title.trim()) {
    toast(t("submit.titleRequired"));
    return;
  }

  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }

  // Merge uploaded local files into imageUrls if present
  const finalUrls = uploadedUrls.value.length > 0 ? uploadedUrls.value : imageUrls.value;

  if (finalUrls.length === 0) {
    toast(t("submit.image.uploadFirst"));
    return;
  }

  const finalCover = coverPreview.value || finalUrls[0] || "";
  if (!finalCover) {
    toast(t("submit.image.setCover"));
    return;
  }

  isUploading.value = true;

  try {
    const imageUrlsPayload: string[] = finalUrls.map((url: string) => {
      const sid = imageSessionMap.value.get(url) || session_id.value || "";
      return sid ? `${sid}|${url}` : url;
    });

    const isEditMode = !!editPostId.value;
    const payload = {
      type: 4,
      title: form.value.title.trim(),
      cover: finalCover,
      content: form.value.description.trim(),
      is_nsfw: form.value.content === "yes" ? 1 : 0,
      access_rights: form.value.permission === "partial" ? 2 : form.value.permission === "private" ? 3 : 1,
      image_urls: imageUrlsPayload,
      language: form.value.language,
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
      ? `${baseUrl}post/modifyPostFour`
      : `${baseUrl}post/addPostFour`;
    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      toast(t("success"));
      router.push(`/publish/success?type=${4}`);
    } else {
      toast(locale.value === "en" ? res.msg : locale.value === "zh" ? res.msg_cn : locale.value === "tc" ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("fail"));
  } finally {
    isUploading.value = false;
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

// --- URL jump entry ---
onMounted(async () => {
  tabList.value = buildTabList();
  checkSubscriptionStatus();

  const sessionId = route.query.session_id as string;
  const postId = route.query.post_id as string;

  if (postId || sessionId) {
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
        if (post.cover) coverPreview.value = post.cover;
        if (post.image_urls && Array.isArray(post.image_urls) && post.image_urls.length > 0) {
          imageUrls.value = post.image_urls.slice(0, 15);
          for (const u of imageUrls.value) {
            imageSessionMap.value.set(u, post.session_id || "");
          }
        } else if (post.images && Array.isArray(post.images) && post.images.length > 0) {
          imageUrls.value = post.images.map((img: any) => img.image_url || img).filter(Boolean).slice(0, 15);
          for (const u of imageUrls.value) {
            imageSessionMap.value.set(u, post.session_id || "");
          }
        } else {
          const dataImages = postRes.data.images;
          if (dataImages && Array.isArray(dataImages) && dataImages.length > 0) {
            imageUrls.value = dataImages.map((img: any) => img.image_url || img).filter(Boolean).slice(0, 15);
            for (const u of imageUrls.value) {
              imageSessionMap.value.set(u, post.session_id || "");
            }
          }
        }
        if (!coverPreview.value && imageUrls.value.length > 0) coverPreview.value = imageUrls.value[0];
        if (post.session_id) session_id.value = post.session_id;
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

  if (sessionId) {
    session_id.value = sessionId;
    // 通过 session_id 请求详情接口获取图片数据
    try {
      const detailRes = await api.detailProject(sessionId) as any;
      if (detailRes.code === 200 && detailRes.data) {
        const ra = typeof detailRes.data.result_async === 'string'
          ? (() => { try { return JSON.parse(detailRes.data.result_async || '{}'); } catch { return {}; } })()
          : (detailRes.data.result_async || {});
        let urls: string[] = [];
        if (Array.isArray(ra.final_images) && ra.final_images.length > 0) {
          urls = ra.final_images.slice(0, 15);
        } else if (Array.isArray(detailRes.data.final_images) && detailRes.data.final_images.length > 0) {
          urls = detailRes.data.final_images.slice(0, 15);
        } else if (Array.isArray(detailRes.data.images) && detailRes.data.images.length > 0) {
          urls = detailRes.data.images.slice(0, 15);
        }
        if (urls.length > 0) {
          imageUrls.value = urls;
          for (const u of urls) {
            imageSessionMap.value.set(u, sessionId);
          }
          coverPreview.value = urls[0];
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

  // Otherwise load history list
  await fetchProjects();
});

// Watch route path to update tabIndex
watch(
  () => route.path,
  (newPath) => {
    const tab = tabList.value.find((tItem) => tItem.path === newPath);
    if (tab) {
      const index = tabList.value.indexOf(tab);
      tabIndex.value = index;
    }
  }
);

// Watch currentPage to reload history
watch(currentPage, () => {
  if (!showFullContent.value) {
    fetchProjects();
  }
});

// Watch locale to rebuild tab names
watch(locale, () => {
  tabList.value = buildTabList();
});
</script>

<style lang="scss" scoped>
@use '@/scss/Image.scss';
</style>
