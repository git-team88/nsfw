<template>
  <div class="submit-article" :class="showFullContent ? 'on' : ''">
    <Header :cur="-1"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="tabs" :class="showFullContent ? 'on' : ''">
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

      <!-- Upload Tabs -->
      <div class="upload-tabs" v-if="!showFullContent && !postId">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.articleTitleLabel") }}</span>
        </div>

        <!-- Upload Options -->
        <div class="upload-options">
          <div
            v-for="option in uploadOptions"
            :key="option.id"
            class="option-item"
            @click="uploadOption = option.value"
          >
            <img
              :src="uploadOption === option.value ? selectActive : select"
              alt="Select"
              class="radio-icon"
            />
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

          <!-- Project Dropdown -->
          <div v-else class="project-dropdown-section">
            <label class="project-label">{{ t('submit.image.novelName') }}</label>
            <div ref="projectDropdownRef" class="project-dropdown">
              <div class="custom-select" :class="{ 'open': showProjectDropdown }" @click="toggleProjectDropdown($event)">
                <span class="select-value">{{ selectedProject?.name || t('submit.image.selectProject') }}</span>
                <div class="select-arrow">
                  <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                </div>
              </div>
              <div class="custom-dropdown" v-if="showProjectDropdown">
                <div class="project-dropdown-item" v-for="(project, index) in projects" :key="project.id">
                  <span class="project-name" @click="selectProject(project)">{{ project.name }}</span>
                  <span class="preview-btn" @click.stop="openViewModal(project)">{{ t('submit.image.preview') }}</span>
                </div>
              </div>
            </div>

            <!-- Chapter Selection -->
            <div class="chapter-selection">
              <label>{{ t('submit.image.selectChapter') }}</label>
              <div class="chapter-select">
                <input
                  type="text"
                  class="chapter-input"
                  :value="selectedEpisode"
                  readonly
                />
                <div class="chapter-buttons">
                  <button
                    class="chapter-btn up"
                    @click="increaseEpisode"
                    :disabled="!selectedProject || !selectedProject.chapters || selectedProject.chapters.filter((chapter: any) => chapter.is_publish === 2).length === 0 || selectedProject.chapters.filter((chapter: any) => chapter.is_publish === 2).findIndex((chapter: any) => chapter.chapter === selectedEpisode.value) >= selectedProject.chapters.filter((chapter: any) => chapter.is_publish === 2).length - 1"
                  >
                    <span class="arrow-icon"></span>
                  </button>
                  <button
                    class="chapter-btn down"
                    @click="decreaseEpisode"
                    :disabled="!selectedProject || !selectedProject.chapters || selectedProject.chapters.filter((chapter: any) => chapter.is_publish === 2).length === 0 || selectedProject.chapters.filter((chapter: any) => chapter.is_publish === 2).findIndex((chapter: any) => chapter.chapter === selectedEpisode.value) <= 0"
                  >
                    <span class="arrow-icon"></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Publish Button -->
            <div class="publish-section">
              <button class="publish-btn" @click="handlePublish">{{ t('submit.cover.confirm') }}</button>
            </div>
          </div>
        </div>

        <!-- Local Upload -->
        <div v-else-if="uploadOption == 'local'" class="create-post-section">
          <div class="caption-container-local">
            <div class="input-wrap-local">
              <input
                v-model="form.title"
                class="title-input"
                type="text"
                :maxlength="TITLE_MAX"
                :placeholder="t('submit.titlePlaceholder')"
                @input="handleTitleInput"
              />
              <span class="char-count-local">{{ form.title.length }}/{{ TITLE_MAX }}</span>
            </div>
            <div class="caption-line-local"></div>
            <div class="textarea-wrap-local">
              <div
                ref="captionRef"
                class="description-content"
                contenteditable="true"
                :placeholder="t('submit.descriptionPlaceholder')"
                @input="handleCaptionInput"
                @blur="onCaptionBlur"
                @paste="handlePaste"
              ></div>
            </div>

            <div class="caption-actions-local">
              <div class="upload-document">
                <div class="upload-btn" @click="triggerDocumentUpload">
                  <img src="@/assets/images/publish/text.png" alt="Upload" class="upload-icon" />
                  <span class="upload-text">{{ t('submit.uploadDocument') }}</span>
                  <div class="info-icon" @mouseover="adjustTooltipPosition">
                    <img src="@/assets/images/publish/intro.png" alt="Info" />
                    <div class="tooltip-arrow"></div>
                    <div class="tooltip">
                      <div class="tooltip-content">
                        <div v-html="t('submit.uploadDocumentInfo')"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  ref="documentInputRef"
                  type="file"
                  accept=".doc,.docx,.pdf,.txt"
                  class="hidden-file-input"
                  @change="handleDocumentUpload"
                />
              </div>
              <span class="char-count-local">{{ captionLength }}/{{ DESC_MAX }}</span>
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
                  <img v-if="dropdownType == '@'" :src="item.avatar" class="avatar" alt="" />
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
          <div class="next-step-container">
            <button class="next-step-btn" :disabled="!canGoToNextStep" @click="goToNextStep">
              {{ t("submit.article.next") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Full Content View: After clicking Next Step or Edit Mode -->
      <div class="content-wrapper" v-if="showFullContent || postId">
        <div class="content-section">
          <div class="content-label-box">
            <span><b>*</b>{{ t("submit.articleTitleLabel") }}</span>
          </div>

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
            <div class="textarea-wrap">
              <div
                ref="captionRef"
                class="description-content"
                contenteditable="true"
                :placeholder="t('submit.descriptionPlaceholder')"
                @input="handleCaptionInput"
                @blur="onCaptionBlur"
                @paste="handlePaste"
              ></div>
            </div>
          </div>

          <div class="content-perm">
            <div class="perm-box">
              <div class="form-label-inner">
                <label class="form-label">{{ t("submit.permission") }}</label>
                <div class="info-icon" @mouseover="adjustTooltipPosition">
                  <img src="@/assets/images/publish/intro.png" alt="Info" />
                  <div class="tooltip-arrow"></div>
                  <div class="tooltip">
                    <div class="tooltip-content">
                      <div v-html="t('submit.permissionInfo')"></div>
                    </div>
                  </div>
                </div>

              </div>

              <div class="perm-options">
                <div
                  class="perm-option"
                  v-for="(opt, index) in permOptions"
                  :key="opt.key"
                  @click="handlePermissionChange(opt.key, index)"
                >
                  <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                  <span>{{ t(opt.labelKey) }}
                    <b v-if="opt.key == 'partial'"> {{ t("submit.articleTip") }}</b>
                  </span>
                </div>
              </div>
            </div>

            <div class="caption-actions-box">
              <span class="char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
            </div>
          </div>

        </div>

        <!-- Collection -->
        <div class="collection-section">
          <div class="form-item">
            <div class="form-label-inner">
              <label class="form-label">{{ t("submit.collection") }}</label>

              <div class="info-icon" @mouseover="adjustTooltipPosition">
                <img src="@/assets/images/publish/intro.png" alt="Info" />
                <div class="tooltip-arrow"></div>
                <div class="tooltip">
                  <div class="tooltip-content">
                    <div v-html="t('submit.collectionInfo')"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="collection-row">
              <div class="collection-select">
                <div class="custom-select" :class="{ 'open': showCollectionDropdown }" @click="toggleCollectionDropdown($event)" @mouseenter="isCollectionHovered = true" @mouseleave="isCollectionHovered = false">
                  <span class="select-value">{{ selectedCollection?.name || (isNoCollection ? t('collection.noCollection') : '小说作品项目名称') }}</span>
                  <div class="select-actions">
                    <div class="select-clear" v-if="selectedCollection && isCollectionHovered" @click.stop="clearCollection">
                      <img src="@/assets/images/publish/delete_icon.png" alt="Clear" />
                    </div>
                    <div class="select-arrow" v-if="!selectedCollection || !isCollectionHovered">
                      <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                    </div>
                  </div>
                </div>
                <div ref="collectionDropdownRef" class="custom-dropdown" v-if="showCollectionDropdown" @scroll="handleCollectionDropdownScroll">
                  <div class="collection-dropdown-item new-collection" @click="createNewCollection">
                    <span>{{ t('collection.newCollection') }}</span>
                    <img src="@/assets/images/publish/plus_icon.png" alt="Plus" />
                  </div>
                  <div class="collection-dropdown-item" v-for="(collection, index) in collections" :key="collection.id" @click="selectCollection(collection.id)" :class="{ 'selected': selectedCollection && selectedCollection.id == collection.id }">
                    {{ collection.title }}
                  </div>
                  <!-- Loading indicator -->
                  <div v-if="isLoadingCollections" class="loading-indicator">
                    <div class="loading-spinner"></div>
                    <span>{{ t('loading') }}</span>
                  </div>
                  <!-- No more collections message -->
                  <div v-else-if="!hasMoreCollections && collections.length > 0" class="no-more-collections">
                    {{ t('emptyState.noMoreData') }}
                  </div>
                </div>
              </div>
              <div class="collection-select" v-if="!isNoCollection">
                <div class="custom-select" :class="{ 'open': showEpisodeDropdown }" @click="toggleEpisodeDropdown($event)">
                  <span class="select-value">{{ getEpisodeLabel(selectedEpisodeNumber) }}</span>
                  <div class="select-arrow">
                    <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                  </div>
                </div>
                <div class="custom-dropdown" v-if="showEpisodeDropdown">
                  <div class="collection-dropdown-item" v-for="episode in episodes" :key="episode.value" @click="selectEpisode(episode.value)" :class="{ 'selected': selectedEpisodeNumber == episode.value }">
                    {{ episode.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover Image -->
        <div class="section">
          <div class="form-item">
            <label class="form-label"><b>*</b>{{ t("submit.coverLabel") }}
            </label>
            <div class="cover-row">
              <div class="cover-box">
                <img v-if="coverPreview" :src="coverPreview" alt="" />
                <img v-else src="@/assets/images/base/cover.png" alt="" />
              </div>
              <div class="reupload-box">
                <button class="reupload" @click="openCoverModal">{{ t("submit.cover.set") }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sensitive Content -->
        <div class="section">
          <div class="form-item">
            <div class="form-label-inner">
              <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>

              <div class="info-icon" @mouseover="adjustTooltipPosition">
                <img src="@/assets/images/publish/intro.png" alt="Info" />
                <div class="tooltip-arrow"></div>
                <div class="tooltip">
                  <div class="tooltip-content">
                    <div v-html="t('submit.sensitiveContent')"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="sensitive-options">
              <div
                class="option"
                v-for="a in contentOptions"
                :key="a.key"
                @click="toggleSensitive(a.key as 'yes' | 'no')"
              >
                <img :src="form.content === a.key ? selectActive : select" alt="" />
                <span>{{ t(a.labelKey) }}</span>
              </div>
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
          <span class="agreement-text"
            >{{ t("submit.agree") }}<a href="javascript:void(0)" @click="openCommunityConvention">{{ t("submit.terms") }}</a></span
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

  <!-- Project View Modal -->
  <ProjectNovelViewModal
    :visible="showViewModal"
    :project="selectedProject"
    @close="closeViewModal"
    @publish="handlePublish"
  />

  <!-- Community Convention Modal -->
  <CommunityConventionModal
    :visible="showConventionModal"
    @cancel="closeConventionModal"
    @confirm="confirmConvention"
  />

  <!-- Subscription Prompt Modal -->
  <SubscriptionPromptModal
    :visible="showSubscriptionModal"
    @cancel="closeSubscriptionModal"
    @go-to-settings="goToSubscriptionSettings"
  />

  <!-- Create Collection Modal -->
  <CreateCollectionModal
    :visible="showCreateCollectionModal"
    :existing-collections="collections.map(c => c.name)"
    :type="2"
    @close="handleCloseCreateCollectionModal"
    @save="handleCreateCollection"
  />
</template>

<script setup lang="ts" name="PublishNovel">
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import SetArticleCoverModal from "@/components/SetArticleCoverModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import Pagination from "@/components/Pagination.vue";
import ProjectNovelViewModal from "@/components/ProjectNovelViewModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import CreateCollectionModal from "@/components/CreateCollectionModal.vue";
import api from "@/api/index";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import router from "@/router";
import { useRoute } from "vue-router";

import "@/scss/Novel.scss";

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

const agreeTerms = ref(true);

const TITLE_MAX = 30;
const DESC_MAX = 20000;

const tabList = ref([
  {
    name: t("submit.tabs.article"),
    path: "/publish/novel",
  },
  {
    name: t("submit.tabs.image"),
    path: "/publish/comic",
  },
  {
    name: t("submit.tabs.video"),
    path: "/publish/video",
  }
]);
const tabIndex = ref(0);
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
const documentInputRef = ref<HTMLInputElement | null>(null);
const coverPreview = ref("");
const showCoverModal = ref(false);
const chapterIdForPublish = ref<number | null>(null);
const agreeToTerms = ref(false);

const uploading = ref(false);
const disableComments = ref(false);
const editorHtml = ref("");
const MAX_COUNT = 10000;

// Caption related
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);

// Mention/Topic dropdown
const showDropdown = ref(false);
const dropdownItems = ref<any[]>([]);
const dropdownPosition = ref({ top: 0, left: 0 });

// Handle dropdown item selection
function selectDropdownItem(item: any) {
  if (!captionRef.value) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  // Create text node with the selected item
  const textNode = document.createTextNode(item.value);
  range.insertNode(textNode);

  // Move cursor after the inserted text
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // Update caption length
  if (captionRef.value) {
    const text = captionRef.value.innerText || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }

  // Hide dropdown
  showDropdown.value = false;
}

// Project dropdown ref
const projectDropdownRef = ref<HTMLDivElement | null>(null);

// Sensitive content
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");

// UI state
const showFullContent = ref(false);

// Upload options
const uploadOption = ref('history');
const uploadOptions = [
  {
    id: 'history',
    value: 'history',
    label: 'submit.image.uploadFromHistory'
  },
  {
    id: 'local',
    value: 'local',
    label: 'submit.image.localUpload'
  }
];

// Project list
const projects = ref<any[]>([]);
const selectedProjectId = ref('');
const selectedProject = ref<any>(null);
const isLoadingProjects = ref(false);

// Pagination
const currentPage = ref(1);
const totalProjects = ref(1000);
const pageSize = ref(8);

// Episode selection
const totalEpisodes = ref(10);
const selectedEpisode = ref(1);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(1);

// Project dropdown
const showProjectDropdown = ref(false);

// Collection
const selectedCollection = ref<{ id: string | number; name: string } | null>(null);
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const isCollectionHovered = ref(false);
const showCreateCollectionModal = ref(false);
const isNoCollection = ref(false);
const collections = ref<any[]>([]);
const episodes = ref([
  { value: '1', label: t('chapter', { chapter: 1 }) },
]);

// Collection dropdown ref
const collectionDropdownRef = ref<HTMLDivElement | null>(null);

// Collection pagination
const currentCollectionPage = ref(1);
const collectionPageSize = ref(50);
const hasMoreCollections = ref(true);
const isLoadingCollections = ref(false);

// Subscription prompt modal
const showSubscriptionModal = ref(false);

// Community Convention Modal
const showConventionModal = ref(false);

// User subscription status
const hasActiveSubscription = ref(false);

const canSubmit = computed(() => {
  return form.value.title.trim().length > 0 && form.value.description.trim().length > 0 && coverPreview.value;
});

// Cover settings
const coverTitle = ref("");
const coverColor = ref("#FCCEE8"); // Pink background

watch(locale, () => {
  tabList.value = [
    {
      name: t("submit.tabs.article"),
      path: "/publish/novel",
    },
    {
      name: t("submit.tabs.image"),
      path: "/publish/comic",
    },
    {
      name: t("submit.tabs.video"),
      path: "/publish/video",
    },
  ];
});

// Watch for upload option changes
watch(uploadOption, (newOption) => {
  if (newOption === 'history') {
    fetchProjects();
  }
});

// Handle title input and auto-generate cover
function handleTitleInput() {
  if (form.value.title.trim()) {
    generateCoverFromTitle();
  }
}

async function goToNextStep() {
  // Update form.description from the contenteditable div
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
    captionLength.value = form.value.description.length;
  }

  if (form.value.title.trim() && form.value.description.trim()) {
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

            // Update the contenteditable div in the full content view
            setTimeout(() => {
              if (captionRef.value) {
                captionRef.value.innerText = form.value.description;
                captionLength.value = form.value.description.length;
              }
            }, 0);
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
  return form.value.title.trim().length > 0 && captionLength.value > 0;
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
  ctx.fillText('"', 100, 80);

  // Draw title
  ctx.font = "60px Arial";
  ctx.fillStyle = "#58474C";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split title into lines if too long
  const title = form.value.title.trim();
  const maxWidth = canvas.width - 200; // 20px margin on each side
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

  const lineHeight = 90;
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
    const res = await api.modifyPostDetail(postId.value );
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code == 0 || data.code == 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights == '2' ? "partial" : postData.access_rights == '3' ? "private" : "public";
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
  router.replace(item.path);
}

function confirmStay() {
  isShowConfirm.value = false;
  pendingRoute.value = null;
}
function confirmLeave() {
  if (pendingRoute.value) {
    router.push(pendingRoute.value.path);
    pendingRoute.value = null;
  } else {
    router.go(-1);
  }
  isShowConfirm.value = false;
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

// Handle tooltip position to avoid window edge overflow
function adjustTooltipPosition(event: MouseEvent) {
  const infoIcon = event.currentTarget as HTMLElement;
  const tooltip = infoIcon.querySelector('.tooltip') as HTMLElement;

  if (tooltip) {
    // Reset tooltip styles
    tooltip.style.top = '50%';
    tooltip.style.left = '100%';
    tooltip.style.right = 'auto';
    tooltip.style.transform = 'translateY(-50%)';
    tooltip.style.marginLeft = '2rem';
    tooltip.style.marginRight = '0';
    tooltip.classList.remove('tooltip-left');

    // Get element positions
    const infoIconRect = infoIcon.getBoundingClientRect();

    // Calculate available space
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Check horizontal overflow
    if (infoIconRect.right + 300 > windowWidth) {
      // Adjust tooltip
      tooltip.style.left = 'auto';
      tooltip.style.right = '100%';
      tooltip.style.marginLeft = '0';
      tooltip.style.marginRight = '2rem';
      tooltip.classList.add('tooltip-left');
    }

    // Check vertical overflow for tooltip
    const tooltipTop = infoIconRect.top + infoIconRect.height / 2 - 180 / 2;
    if (tooltipTop + 180 > windowHeight) {
      // Adjust position upwards
      const overflow = (tooltipTop + 180) - windowHeight;
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '0';
      tooltip.style.transform = 'none';
    } else if (tooltipTop < 0) {
      // Adjust position downwards
      tooltip.style.top = '0';
      tooltip.style.transform = 'none';
    } else {
      // Center vertically
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateY(-50%)';
    }
  }
}

// Submit
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  if (!canSubmit.value) {
    if (!form.value.title.trim()) {
      toast(t('submit.article.titleRequired'));
    } else if (!form.value.description.trim()) {
      toast(t('submit.article.contentRequired'));
    } else if (!coverPreview.value) {
      toast(t('submit.article.coverRequired'));
    }
    return;
  }

  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  isUpload.value = true;

  try {
    // Get session_id and index from route query or selectedProject
    const session_id = route.query.session_id as string || (selectedProject.value?.session_id as string);
    const index = route.query.index as string;

    const payload = {
      type: 2,
      title: form.value.title.trim(),
      cover: coverPreview.value,
      content: form.value.description.trim(),
      is_nsfw: form.value.content == "yes" ? 1 : 0,
      access_rights: form.value.permission === "partial" ? 1 : form.value.permission === "private" ? 2 : 0,
      book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
      chapter_index: selectedCollection.value ? parseInt(selectedEpisodeNumber.value) : 0,
      ...(session_id ? { session_id } : {}),
      ...(chapterIdForPublish.value ? { ai_chapter_index: chapterIdForPublish.value } : (index ? { ai_chapter_index: parseInt(index) } : {}))
    };

    console.log(payload)

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
      console.log('Error code:', res.code);
      console.log('Error message:', locale.value == 'jp' ? res.msg_jp : res.msg);
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
function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;
  const text = target.innerText || "";
  captionLength.value = text.replace(/\n$/, "").length;
}





function handleCaptionKeydown(e: KeyboardEvent) {
  // No special handling needed
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

// Document upload functions
function triggerDocumentUpload() {
  if (documentInputRef.value) {
    documentInputRef.value.click();
  }
}

async function handleDocumentUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    toast(t('submit.fileTooLarge'));
    return;
  }

  // Validate file type
  const allowedTypes = ['.doc', '.docx', '.pdf', '.txt'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    toast(t('submit.invalidFileFormat'));
    return;
  }

  isUpload.value = true;

  try {
    // Read file content based on file type
    let textContent = '';

    if (fileExtension === '.txt') {
      // Read text file directly
      textContent = await readTextFile(file);
    } else if (fileExtension === '.pdf') {
      // Read PDF file content
      textContent = await readPDFFile(file);
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      // Read Word document content
      textContent = await readWordFile(file);
    }

    // Update the caption with the document content
    if (captionRef.value) {
      // Limit to 20000 characters
      const limitedContent = textContent.substring(0, DESC_MAX);
      captionRef.value.innerText = limitedContent;
      captionLength.value = limitedContent.length;
      form.value.description = limitedContent;
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isUpload.value = false;
    if (documentInputRef.value) {
      documentInputRef.value.value = '';
    }
  }
}

// Helper function to read text files
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

// Helper function to read PDF files
async function readPDFFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (result && result instanceof ArrayBuffer) {
        try {
          // Set the worker source for PDF.js
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

          // Load the PDF document
          const pdf = await pdfjsLib.getDocument({ data: result }).promise;
          let fullText = '';

          // Extract text from each page
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          resolve(fullText.trim());
        } catch (error) {
          console.error('PDF parsing error:', error);
          reject(new Error('Failed to parse PDF file'));
        }
      } else {
        reject(new Error('Failed to read PDF file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };
    reader.readAsArrayBuffer(file);
  });
}

// Helper function to read Word files
async function readWordFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (result && result instanceof ArrayBuffer) {
        try {
          // Use mammoth to extract text from Word document
          const arrayBuffer = result;
          const result_mammoth = await mammoth.extractRawText({ arrayBuffer });
          resolve(result_mammoth.value);
        } catch (error) {
          console.error('Word parsing error:', error);
          reject(new Error('Failed to parse Word file'));
        }
      } else {
        reject(new Error('Failed to read Word file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read Word file'));
    };
    reader.readAsArrayBuffer(file);
  });
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

// Collection methods
function toggleCollectionDropdown(event) {
  event.stopPropagation();
  showCollectionDropdown.value = !showCollectionDropdown.value;
  showEpisodeDropdown.value = false;

  // Fetch collections when opening dropdown
  if (showCollectionDropdown.value) {
    // Reset pagination and fetch first page
    hasMoreCollections.value = true;
    fetchCollections(false);
  }
}

function toggleEpisodeDropdown(event) {
  event.stopPropagation();
  showEpisodeDropdown.value = !showEpisodeDropdown.value;
  showCollectionDropdown.value = false;
}

function createNewCollection() {
  showCollectionDropdown.value = false;
  showCreateCollectionModal.value = true;
}

function selectCollection(id) {
  const collection = collections.value.find(c => c.id === id);
  if (collection) {
    selectedCollection.value = {
      id: collection.id,
      name: collection.title
    };
    // Set default episode number to number of existing chapters + 1
    const chapterCount = collection.chapters ? collection.chapters.length : 0;
    const defaultEpisode = chapterCount + 1;
    selectedEpisodeNumber.value = defaultEpisode.toString();

    // Update episodes array based on collection chapters
    episodes.value = [];
    for (let i = 1; i <= defaultEpisode; i++) {
      episodes.value.push({
        value: i.toString(),
        label: t('chapter', { chapter: i })
      });
    }
  }
  showCollectionDropdown.value = false;
  isNoCollection.value = false;
}

function clearCollection() {
  selectedCollection.value = null;
  showCollectionDropdown.value = false;
  showEpisodeDropdown.value = false;
  isNoCollection.value = true;
}

function selectEpisode(value) {
  selectedEpisodeNumber.value = value;
  showEpisodeDropdown.value = false;
}

function getEpisodeLabel(value) {
  const episode = episodes.value.find(ep => ep.value === value);
  return episode ? episode.label : t('chapter', { chapter: 1 });
}

async function handleCreateCollection(collection) {
  selectedCollection.value = collection;
  selectedEpisodeNumber.value = '1';
  showCreateCollectionModal.value = false;
  isNoCollection.value = false;
}

function handleCloseCreateCollectionModal() {
  showCreateCollectionModal.value = false;
}

// Project dropdown methods
function toggleProjectDropdown(event) {
  event.stopPropagation();
  showProjectDropdown.value = !showProjectDropdown.value;
  showCollectionDropdown.value = false;
  showEpisodeDropdown.value = false;
}

// Close dropdowns when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (showProjectDropdown.value && projectDropdownRef.value && !projectDropdownRef.value.contains(target)) {
    showProjectDropdown.value = false;
  }
  if (showCollectionDropdown.value && !document.querySelector(".collection-select")?.contains(target)) {
    showCollectionDropdown.value = false;
  }
  if (showEpisodeDropdown.value && !document.querySelector(".collection-select")?.contains(target)) {
    showEpisodeDropdown.value = false;
  }
}

// Project list methods
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = await api.getProject(2, 0, 'novel', currentPage.value, pageSize.value, 'desc', 1, 1) as any;
    if (response.code !== 200) {
      toast(t('fail'));
      return;
    }

    projects.value = response.data.data_list || [];

    if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }
    // Don't select first project by default - show default text instead
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    isLoadingProjects.value = false;
  }
}

async function selectProject(project: any) {
  selectedProjectId.value = project.id;
  selectedProject.value = project;
  // Set default episode to first one
  selectedEpisode.value = 1;
  selectedModalEpisode.value = 1;
  // Close dropdown
  showProjectDropdown.value = false;

  // Request project details
  try {
    const res = await api.detailProject(project.session_id) as any;
    if (res.code === 200 && res.data) {
      // Update project with details
      Object.assign(project, res.data);

      // Filter chapters to only include unpublished ones (is_publish = 2)
      if (project.chapters && project.chapters.length > 0) {
        const unpublishedChapters = project.chapters.filter((chapter: any) => chapter.is_publish === 2);

        // Update episodes array based on unpublished chapters
        episodes.value = [];
        unpublishedChapters.forEach((chapter: any, index: number) => {
          episodes.value.push({
            value: chapter.chapter.toString(),
            label: t('chapter', { chapter: chapter.chapter })
          });
        });

        // If there are unpublished chapters, set default episode to the first one
        if (unpublishedChapters.length > 0) {
          selectedEpisode.value = unpublishedChapters[0].chapter;
          selectedEpisodeNumber.value = unpublishedChapters[0].chapter.toString();
        }
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }
}

function decreaseEpisode() {
  // Get unpublished chapters
  const unpublishedChapters = selectedProject.value?.chapters?.filter((chapter: any) => chapter.is_publish == 2) || [];
  if (unpublishedChapters.length == 0) return;

  // Find current chapter index in unpublished chapters
  const currentIndex = unpublishedChapters.findIndex((chapter: any) => chapter.chapter == selectedEpisode.value);
  if (currentIndex > 0) {
    // Move to previous chapter in unpublished list
    selectedEpisode.value = unpublishedChapters[currentIndex - 1].chapter;
  }
}

function increaseEpisode() {
  // Get unpublished chapters
  const unpublishedChapters = selectedProject.value?.chapters?.filter((chapter: any) => chapter.is_publish == 2) || [];
  if (unpublishedChapters.length == 0) return;

  // Find current chapter index in unpublished chapters
  const currentIndex = unpublishedChapters.findIndex((chapter: any) => chapter.chapter == selectedEpisode.value);
  if (currentIndex < unpublishedChapters.length - 1) {
    // Move to next chapter in unpublished list
    selectedEpisode.value = unpublishedChapters[currentIndex + 1].chapter;
  }
}

// Pagination methods
function changePage(page: number) {
  currentPage.value = page;
  fetchProjects();
}

// Fetch collections
async function fetchCollections(loadMore = false) {
  if (isLoadingCollections.value || (!loadMore && !hasMoreCollections.value)) return;

  isLoadingCollections.value = true;

  const uid = localStorage.getItem('uid')

  try {
    const page = loadMore ? currentCollectionPage.value + 1 : 1;
    const response = await api.getCollection(2, page, collectionPageSize.value, uid) as any;

    if (response.code == 0) {
      const newCollections = response.data?.data || [];

      if (loadMore) {
        collections.value = [...collections.value, ...newCollections];
        currentCollectionPage.value = page;
      } else {
        collections.value = newCollections;
        currentCollectionPage.value = 1;
      }

      hasMoreCollections.value = newCollections.length == response.data?.allnums;
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  } finally {
    isLoadingCollections.value = false;
  }
}

// Handle collection dropdown scroll
function handleCollectionDropdownScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;

  // Load more when scrolled to within 100px of the bottom
  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreCollections.value && !isLoadingCollections.value) {
    fetchCollections(true);
  }
}

// Modal methods
async function openViewModal(project: any) {
  selectedProject.value = project;
  selectedModalEpisode.value = 1;

  // Request project details to get chapters array
  try {
    const res = await api.detailProject(project.session_id) as any;
    if (res.code === 200 && res.data) {
      // Update project with details
      Object.assign(project, res.data);

      // Filter chapters to only include unpublished ones (is_publish = 2)
      if (project.chapters && project.chapters.length > 0) {
        project.chapters = project.chapters.filter((chapter: any) => chapter.is_publish === 2);
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }

  showViewModal.value = true;
}

function closeViewModal() {
  showViewModal.value = false;
  selectedProject.value = null;
}

async function handlePublish(publishData?: any) {
  // Check if publishData is provided (from modal) or if we're handling a direct click
  if (publishData && typeof publishData == 'object' && publishData.project) {
    // From modal: use the provided data
    const { project: targetProject, episode: targetEpisode, title, content, chapterIndex } = publishData;

    if (!targetProject) {
      toast(t('submit.image.selectNovelFirst'));
      return;
    }

    // Store chapterId for publish
    chapterIdForPublish.value = chapterIndex;

    // Use the provided title and content
    form.value.title = title.substring(0, TITLE_MAX);
    form.value.description = content || `This is the content for episode ${targetEpisode} of ${targetProject.name}.`;
  } else {
    // Direct click: use selectedProject and selectedEpisode
    const targetProject = selectedProject.value;
    const targetEpisode = selectedEpisode.value;

    if (!targetProject) {
      toast(t('submit.image.selectNovelFirst'));
      return;
    }

    // Store chapterId for publish
    chapterIdForPublish.value = targetEpisode;

    // Get chapter title from project outline
    let chapterTitle = targetProject.name;
    if (targetProject.result_async?.generate_novel_outline?.outline) {
      const chapterIndex = targetEpisode - 1;
      if (targetProject.result_async.generate_novel_outline.outline[chapterIndex]) {
        chapterTitle = targetProject.result_async.generate_novel_outline.outline[chapterIndex].title || chapterTitle;
      }
    }

    // Generate title: chapter number + chapter title + novel name in brackets
    const chapterText = t('chapter', { chapter: targetEpisode });
    let generatedTitle = `${chapterText} ${chapterTitle}「${targetProject.name}」`;
    // Truncate title to TITLE_MAX characters
    form.value.title = generatedTitle.substring(0, TITLE_MAX);

    // Fetch episode content from API
    let episodeContent = `This is the content for episode ${targetEpisode} of ${targetProject.name}.`;
    if (targetProject.session_id) {
      try {
        const res = await api.detailChapter(targetProject.session_id, targetEpisode) as any;
        if (res.code === 200 && res.data && res.data.content) {
          episodeContent = res.data.content;
        }
      } catch (error) {
        console.error('Error fetching chapter content:', error);
      }
    }
    form.value.description = episodeContent;
  }

  // Generate cover from title
  generateCoverFromTitle();

  // Upload cover to server
  if (coverPreview.value) {
    isUpload.value = true;

    const token = localStorage.getItem("token");
    if (token) {
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

  // Switch to full content view
  showFullContent.value = true;

  // Update the contenteditable div after switching to full content view
  setTimeout(() => {
    if (captionRef.value) {
      captionRef.value.innerText = form.value.description;
      captionLength.value = form.value.description.length;
    }
  }, 0);

  // Close modal
  showViewModal.value = false;
}

// Subscription prompt modal methods
function closeSubscriptionModal() {
  showSubscriptionModal.value = false;
}

function goToSubscriptionSettings() {
  showSubscriptionModal.value = false;
  window.location.href = '/user-subscription';
}

// Community Convention Modal methods
function closeConventionModal() {
  showConventionModal.value = false;
}

function confirmConvention() {
  showConventionModal.value = false;
  agreeTerms.value = true;
  // After confirming, trigger publish again
  onSubmit();
}

// Check subscription status
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

// Handle permission change with subscription check
async function handlePermissionChange(permission: string, index: number) {
  if (index == 1 && !hasActiveSubscription.value) {
    showSubscriptionModal.value = true;
    return;
  }

  form.value.permission = permission;
}

// Lifecycle
onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  // Get post details if postId exists
  if (postId.value) {
    showFullContent.value = true;
    await getPostDetails();
    // After getting post details (which sets user_id), fetch collections
    await fetchCollections(false);
  } else {
    // Check if session_id and index are provided
    const session_id = route.query.session_id as string;
    const index = route.query.index as string;
    const cover = route.query.cover as string;
    const title = route.query.title as string;

    if (session_id && index) {
      // Request chapter detail interface
      try {
        const res = await api.detailChapter(session_id, parseInt(index)) as any;
        if (res.code === 200 && res.data && res.data.content) {
          // Set form data
          if (title && res.data.title) {
            // Format: 章节号+章节名称+空格+「小说名」
            const chapterNumber = t('chapter', { chapter: index });
            form.value.title = `${chapterNumber} ${res.data.title} 「${title}」`;
          } else if (title) {
            // If no chapter title, use: 章节号+「小说名」
            const chapterNumber = t('chapter', { chapter: index });
            form.value.title = `${chapterNumber} 「${title}」`;
          } else {
            // Fallback: 章节号+章节名称 or 章节号
            form.value.title = res.data.title ? `${t('chapter', { chapter: index })} ${res.data.title}` : `${t('chapter', { chapter: index })}`;
          }
          form.value.description = res.data.content;

          // Set cover if provided
          if (cover) {
            // If cover is provided in the URL, just display it, no need to upload
            coverPreview.value = cover;
          } else {
            // Generate cover from title and upload it
            await generateAndUploadCover();
          }

          // Function to generate cover from title and upload it
          async function generateAndUploadCover() {
            // Generate cover from title using canvas
            generateCoverFromTitle();

            // Upload the generated cover to server
            const token = localStorage.getItem("token");
            if (token && coverPreview.value) {
              isUpload.value = true;
              try {
                // Check if coverPreview is a data URL (generated by canvas)
                if (coverPreview.value.startsWith('data:image/')) {
                  // Convert data URL to blob
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
                    }
                  } else {
                    toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
                  }
                }
              } catch (error) {
                console.error("Cover upload error:", error);
                toast(t('fail'));
              } finally {
                isUpload.value = false;
              }
            }
          }

          // Show full content view
          showFullContent.value = true;

          // Update contenteditable div
          setTimeout(() => {
            if (captionRef.value) {
              captionRef.value.innerText = form.value.description;
              captionLength.value = form.value.description.length;
            }
          }, 0);
        }
      } catch (error) {
        console.error('Error fetching chapter details:', error);
        // Fetch projects and check subscription status if chapter detail fails
        await fetchProjects();
        await checkSubscriptionStatus();
      }
    } else {
      // Fetch projects and check subscription status for new posts
      await fetchProjects();
      await checkSubscriptionStatus();
    }
  }
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
 @use '@/scss/Novel.scss';
</style>
