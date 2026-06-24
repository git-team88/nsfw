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
      <div class="upload-tabs" v-if="!showFullContent && !postId && !route.query.session_id">
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
                <span class="select-value">{{ selectedProject?.name }}</span>
                <div class="select-arrow">
                  <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                </div>
              </div>
              <div class="custom-dropdown" v-if="showProjectDropdown" @scroll="handleProjectDropdownScroll">
                <div class="project-dropdown-item" v-for="(project, index) in projects" :key="project.id">
                  <span class="project-name" @click="selectProject(project)">{{ project.name }}</span>
                  <span class="preview-btn" @click.stop="openViewModal(project)">{{ t('submit.image.preview') }}</span>
                </div>
                <div v-if="isLoadingMoreProjects" class="loading-indicator">
                  <div class="loading-spinner"></div>
                  <span>{{ t('loading') }}</span>
                </div>
              </div>
            </div>

            <!-- Chapter Selection -->
            <div class="chapter-selection">
              <label>{{ t('submit.image.selectChapter') }}</label>
              <div class="chapter-dropdown">
                <div class="custom-select" :class="{ 'open': showChapterDropdown }" @click="toggleChapterDropdown($event)">
                  <span class="select-value">{{ getChapterLabel(selectedEpisode) }}</span>
                  <div class="select-arrow">
                    <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                  </div>
                </div>
                <div class="custom-dropdown" v-if="showChapterDropdown">
                  <div
                    class="chapter-dropdown-item"
                    :class="{ 'selected': selectedEpisode == chapter.chapter }"
                    v-for="chapter in selectedProject?.chapters || []"
                    :key="chapter.chapter"
                    @click="selectChapter(chapter)"
                  >
                    <span class="chapter-number">{{ t('chapter', { chapter: chapter.chapter }) }}</span>
                    <span class="chapter-status" v-if="chapter.is_publish == 1">{{ t('novel.published') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Publish Button -->
            <div class="publish-section">
              <button
                class="publish-btn"
                :class="{ 'published': isChapterPublished }"
                @click="handlePublish"
                :disabled="isChapterPublished"
              >
                {{ isChapterPublished ? t('novel.published') : t('submit.cover.confirm') }}
              </button>
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
                @blur="handleTitleBlur"
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
                <!-- <div class="item-right">
                  <span class="stats">
                    {{
                      dropdownType === "#" ? `${item.views} views` : `${item.followers} followers`
                    }}
                  </span>
                </div> -->
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
      <div class="content-wrapper" v-if="showFullContent || postId || route.query.session_id">
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
                @blur="handleTitleBlur"
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
            <div class="collection-row">
              <div class="collection-group">
                <div class="form-label-inner">
                  <label class="form-label"><b>*</b>{{ t("submit.collection") }}</label>

                  <div class="info-icon" @mouseover="adjustTooltipPosition">
                    <img src="@/assets/images/publish/intro.png" alt="Info" />
                    <div class="tooltip-arrow"></div>
                    <div class="tooltip">
                      <div class="tooltip-content">
                        <div v-html="t('submit.collectionInfo')"></div>
                      </div>
                    </div>
                  </div>

                  <div class="switch-collection-btn" @click="openCollectionListModal">
                    <span>{{ t('collection.switchCollection') }}</span>
                    <img src="@/assets/images/publish/switch.png" alt="" />
                  </div>
                </div>

                <div class="collection-display">
                  <div class="collection-info" v-if="selectedCollection">
                    <img v-if="selectedCollection.cover" :src="processImageUrl(selectedCollection.cover)" alt="" class="collection-cover" />
                    <div class="collection-text">
                      <div class="collection-top">
                        <span class="collection-name">{{ selectedCollection.name }}</span>
                        <span class="collection-desc">{{ selectedCollection.description || t('collection.defaultDescription') }}</span>
                      </div>

                      <div class="content-sensitive">
                        <div class="sensitive-left">
                          <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>

                          <div class="info-icon" @mouseover="adjustTooltipPosition">
                            <img src="@/assets/images/publish/info.png" alt="Info" />
                            <div class="tooltip-arrow"></div>
                            <div class="tooltip">
                              <div class="tooltip-content">
                                <div v-html="t('submit.sensitiveContent')"></div>
                              </div>
                            </div>
                          </div>

                          <img
                            class="sensitive-switch"
                            :src="selectedCollection?.is_nsfw == 1 ? requireSwitchOn : requireSwitchOff"
                            alt=""
                            @click="toggleCollectionSensitive"
                          />
                        </div>
                        <span class="modify-link" v-if="selectedCollection" @click="handleEditCollection">{{ t('collection.modifyCollection') }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="collection-info" v-else>
                    <span class="collection-name no-collection" @click="openCollectionListModal">{{ t('collection.noCollection') }}</span>
                  </div>
                </div>


              </div>
              <div class="collection-group" v-if="!isNoCollection">
                <label class="form-label">{{ t("collection.orderInCollection") }}</label>
                <div class="collection-select">
                  <div class="custom-select" :class="{ 'open': showEpisodeDropdown }" @click="toggleEpisodeDropdown($event)">
                    <span class="select-value">{{ getEpisodeLabel(selectedEpisodeNumber) }}</span>
                    <div class="select-arrow">
                      <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                    </div>
                  </div>
                  <div class="custom-dropdown" v-if="showEpisodeDropdown" :class="{ 'dropdown-top': episodeDropdownPosition === 'top' }">
                    <div class="collection-dropdown-item" v-for="episode in episodes" :key="episode.value" @click="selectEpisode(episode.value)" :class="{ 'selected': selectedEpisodeNumber == episode.value }">
                      {{ episode.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover Image - hidden, using collection cover automatically -->
        <!-- <div class="section">
          <div class="form-item">
            <label class="form-label"><b>*</b>{{ t("submit.coverLabel") }}
            </label>
            <div class="cover-row">
              <div class="cover-box">
                <img v-if="coverPreview || (selectedCollection && selectedCollection.cover)" :src="coverPreview || selectedCollection.cover" alt="" />
              </div>
              <div class="reupload-box">
                <button class="reupload" @click="openCoverModal">{{ t("submit.cover.set") }}</button>
              </div>
            </div>
          </div>
        </div> -->

        <div class="submit-row">
          <button class="submit" :disabled="uploading" @click="onSubmit">
            {{ t("submit.submit") }}
          </button>
        </div>

        <div class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span class="agreement-text"
            >{{ t("submit.agree") }}<span class="terms-text">{{ t("submit.terms") }}</span></span
          >
        </div>
      </div>
    </div>
  </div>

  <UploadMask :visible="isUpload"></UploadMask>

  <ConfirmLeaveModal :show="isShowConfirm" @cancel="confirmStay" @confirm="confirmLeave" />

  <SensitiveConfirmModal
    :visible="showSensitiveConfirm"
    @cancel="cancelSensitive"
    @confirm="confirmSensitive"
  />

  <SetArticleCoverModal
    v-model:visible="showCoverModal"
    :title="form.title"
    :current-cover="coverPreview"
    :project-cover="projectCover"
    :has-title-generated-cover="hasTitleGeneratedCover"
    :cover-color="coverColor"
    :cover-title="coverTitle"
    @confirm="onCoverConfirmed"
  />

  <!-- Project View Modal -->
  <ProjectNovelViewModal
    :visible="showViewModal"
    :project="previewProject"
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

  <!-- Edit Collection Modal -->
  <EditCollectionModal
    :visible="showEditCollectionModal"
    :is-edit="editingCollectionId !== null"
    :collection-id="editingCollectionId || ''"
    :collection-name="isCreateFromCollectionList && projectInfoForNewCollection ? projectInfoForNewCollection.title : ''"
    :cover-url="isCreateFromCollectionList && projectInfoForNewCollection ? projectInfoForNewCollection.cover : ''"
    :is-nsfw="0"
    :type="2"
    @close="handleCloseEditCollectionModal"
    @save="handleSaveCollection"
  />

  <!-- Switch Collection Confirm Modal -->
  <SwitchCollectionModal
    :visible="showSwitchCollectionModal"
    @close="handleCloseSwitchCollectionModal"
    @confirm="handleConfirmSwitchCollection"
  />

  <!-- Collection List Modal -->
  <CollectionListModal
    v-model="collectionListSelectedId"
    :visible="showCollectionListModal"
    :uid="uid"
    :type="2"
    @close="handleCloseCollectionListModal"
    @select="handleSelectCollectionCard"
    @confirm="handleSelectCollectionFromModal"
    @create="handleCreateCollectionFromModal"
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
import SwitchCollectionModal from "@/components/SwitchCollectionModal.vue";
import EditCollectionModal from "@/components/EditCollectionModal.vue";
import CollectionListModal from "@/components/CollectionListModal.vue";
import api from "@/api/index";
import mammoth from "mammoth";
import { extractDocText } from "@/util/docParser";
import * as pdfjsLib from "pdfjs-dist";

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import { toast } from "@/util/toast";
import { trackClickPublishButton } from "@/utils/analytics";
import { baseUrl } from "@/util/config";
import { processImageUrl } from "@/util/utils";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import requireSwitchOn from "@/assets/images/home/open.png";
import requireSwitchOff from "@/assets/images/publish/close.png";
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

const TITLE_MAX = 60;
const DESC_MAX = 50000;

const uid = localStorage.getItem('uid') || '';

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

// Check if cover is provided in the URL
const hasUrlCover = ref(false);

// Check if cover is generated by AI
const hasAICover = ref(false);

// Check if cover is from history selection
const hasHistoryCover = ref(false);

// Check if cover is generated from title
const hasTitleGeneratedCover = ref(false);

// Project cover for comparison
const projectCover = ref('');

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
const dropdownType = ref('');


// Handle dropdown item selection
function selectDropdownItem(item: any) {
  if (!captionRef.value) return;

  const currentText = captionRef.value.textContent || "";
  const currentLength = currentText.replace(/\n$/, "").length;
  if (currentLength >= DESC_MAX) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const remaining = DESC_MAX - currentLength;
  const insertText = item.value.substring(0, remaining);

  const textNode = document.createTextNode(insertText);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  if (captionRef.value) {
    const text = captionRef.value.textContent || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }

  showDropdown.value = false;
}

// Project dropdown ref
const projectDropdownRef = ref<HTMLDivElement | null>(null);

// Sensitive content
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");
const pendingCollectionIdForSensitive = ref<number | null>(null);

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
const isLoadingMoreProjects = ref(false);
const hasMoreProjects = ref(true);
const currentProjectPage = ref(1);

// Pagination
const currentPage = ref(1);
const totalProjects = ref(1000);
const pageSize = ref(8);

// Episode selection
const totalEpisodes = ref(10);
const selectedEpisode = ref(null);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(null);

// Preview modal project (separate from selected project)
const previewProject = ref<any>(null);

// Project dropdown
const showProjectDropdown = ref(false);
const showChapterDropdown = ref(false);

// Collection
const selectedCollection = ref<{ id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number } | null>(null);
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const isCollectionHovered = ref(false);
const collectionDropdownPosition = ref<'top' | 'bottom'>('bottom');
const episodeDropdownPosition = ref<'top' | 'bottom'>('bottom');
const showSwitchCollectionModal = ref(false);
const showEditCollectionModal = ref(false);
const showCollectionListModal = ref(false);
const collectionListSelectedId = ref<string | number | null>(null);
const editingCollectionId = ref<string | number | null>(null);
const isCreateFromCollectionList = ref(false);
const projectInfoForNewCollection = ref<{ title: string; cover: string } | null>(null);
const isNoCollection = ref(true);
const collections = ref<any[]>([]);
const episodes = ref([
  { value: '1', label: '1' },
]);

// Flag to check if switch collection warning has been shown
const switchCollectionWarningShown = ref(false);

// Store the target collection when confirmation is pending
const pendingCollectionId = ref<number | null>(null);

// Flag to check if current page is for editing existing work
const isEditingWork = ref(false);

// Store collection data for pending switch
const pendingCollectionData = ref<any>(null);

// Collection dropdown ref
const collectionDropdownRef = ref<HTMLDivElement | null>(null);

// Collection pagination
const currentCollectionPage = ref(1);
const collectionPageSize = ref(20);
const hasMoreCollections = ref(true);
const isLoadingCollections = ref(false);

// Subscription prompt modal
const showSubscriptionModal = ref(false);

// Community Convention Modal
const showConventionModal = ref(false);

// User subscription status
const hasActiveSubscription = ref(false);

const canSubmit = computed(() => {
  return form.value.title.trim().length > 0 && form.value.description.trim().length > 0 && selectedCollection.value;
});

// Watch route changes to update tabIndex
watch(() => route.path, (newPath) => {
  const tab = tabList.value.find(t => t.path === newPath);
  if (tab) {
    const index = tabList.value.indexOf(tab);
    tabIndex.value = index;
  }
});

// Cover settings
const coverTitle = ref("");
const coverColor = ref("#FCCEE8"); // Pink background

// Load cover settings from local storage on initialization
const loadCoverSettings = () => {
  // Clear cover settings on every load
  localStorage.removeItem('novelCoverSettings');
  coverColor.value = "#FCCEE8";
  coverTitle.value = "";
};

// Load cover settings on component mount
loadCoverSettings();

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
    hasMoreProjects.value = true;
    currentProjectPage.value = 1;
    fetchProjects();
  } else if (newOption === 'local') {
    // Reset selected project when switching to local upload mode
    selectedProject.value = null;
    selectedProjectId.value = '';
    // Reset all cover flags
    hasHistoryCover.value = false;
    hasUrlCover.value = false;
    hasAICover.value = false;
    hasTitleGeneratedCover.value = false;
    // Reset form title when switching to local upload
    form.value.title = '';
  }
  // Reset history cover flag when switching options
  hasHistoryCover.value = false;
});

// Handle title input and auto-generate cover
function handleTitleInput() {
  if (uploadOption.value === 'local') return;
  if (form.value.title.trim() && !selectedProject.value?.cover && !hasUrlCover.value && !hasAICover.value && !hasHistoryCover.value) {
    generateCoverFromTitle();
  }
}

// Handle title blur and upload cover
async function handleTitleBlur() {
  if (uploadOption.value === 'local') return;

  if (form.value.title.trim() && !selectedProject.value?.cover && !hasUrlCover.value && !hasAICover.value && !hasHistoryCover.value) {
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

        const authHeaders = window.AntiCrawler.generateAuthParams(token);

        const parma = {
          method: "POST",
          headers: {
            token: token,
            ...authHeaders,
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
          toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
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

async function goToNextStep() {
  if (uploadOption.value === 'local') {
    if (captionRef.value) {
      form.value.description = captionRef.value.textContent || "";
      captionLength.value = form.value.description.length;
    }
    showFullContent.value = true;
    setTimeout(() => {
      if (captionRef.value) {
        captionRef.value.textContent = form.value.description;
        captionLength.value = form.value.description.length;
      }
    }, 0);
    return;
  }

  // Update form.description from the contenteditable div
  if (captionRef.value) {
    form.value.description = captionRef.value.textContent || "";
    captionLength.value = form.value.description.length;
  }

  if (form.value.title.trim() && form.value.description.trim()) {
    // Only generate cover if no existing cover from history, no cover from URL, and no AI-generated cover
    if (!selectedProject.value?.result_async?.generate_novel_cover && !hasUrlCover.value && !hasAICover.value && !hasHistoryCover.value) {
      generateCoverFromTitle();

      // Upload the generated cover
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

            const authHeaders = window.AntiCrawler.generateAuthParams(token);

            const parma = {
              method: "POST",
              headers: {
                token: token,
                ...authHeaders,
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
              toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
            }
          } catch (error) {
            console.error("Cover upload error:", error);
            toast(t('fail'));
          } finally {
            isUpload.value = false;
          }
        }
      }

      // Show full content after generating cover
      showFullContent.value = true;

      // Update the contenteditable div in the full content view
      setTimeout(() => {
        if (captionRef.value) {
          captionRef.value.textContent = form.value.description;
          captionLength.value = form.value.description.length;
        }
      }, 0);
    } else {
      console.log('goToNextStep - Skipping cover generation and upload');
      // If there's an existing cover from history, URL, or AI, just show full content
      showFullContent.value = true;

      // Update the contenteditable div in the full content view
      setTimeout(() => {
        if (captionRef.value) {
          captionRef.value.textContent = form.value.description;
          captionLength.value = form.value.description.length;
        }
      }, 0);
    }
  }
}

const canGoToNextStep = computed(() => {
  return form.value.title.trim().length > 0 && captionLength.value > 0;
});

// Check if selected chapter is already published
const isChapterPublished = computed(() => {
  if (!selectedProject.value?.chapters) return false;
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === selectedEpisode.value);
  return chapter?.is_publish == 1;
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
  hasTitleGeneratedCover.value = true;
  return dataUrl;
}

// Get post details for editing
async function getPostDetails() {
  if (!postId.value) return;

  try {
    const res = await api.modifyPostDetail(postId.value );
    const data = res as any;
    if (data.code == 0 || data.code == 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights == '2' ? "partial" : postData.access_rights == '3' ? "private" : "public";
      form.value.content = postData.is_nsfw == '1' ? "yes" : "no";
      coverPreview.value = postData.cover || "";
      if (postData.cover) {
        hasUrlCover.value = true;
      }

      // Update cover settings if cover_color and cover_title are available
      if (postData.cover_color && postData.cover_title) {
        coverColor.value = postData.cover_color;
        coverTitle.value = postData.cover_title;
        // Store cover settings in local storage
        const coverSettings = {
          color: postData.cover_color,
          title: postData.cover_title
        };
        localStorage.setItem('novelCoverSettings', JSON.stringify(coverSettings));
      }

      // Get session_id from post data
      const session_id = postData.session_id as string;
      if (session_id) {
        // Fetch project details to get the original cover
        await fetchProjectDetails(session_id);
      }

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
            let textBefore = content.substring(currentIndex, nextMatchIndex);
            // Convert literal \n to actual newlines
            textBefore = textBefore.replace(/\\n/g, '\n');
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
          let textAfter = content.substring(currentIndex);
          // Convert literal \n to actual newlines
          textAfter = textAfter.replace(/\\n/g, '\n');
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

      // Set selected collection from book_title
      if (postData.book_title) {
        selectedCollection.value = {
          id: postData.book_id || 0,
          name: postData.book_title,
          cover: data.data?.book_info?.cover,
          description: data.data?.book_info?.description,
          is_nsfw: data.data?.book_info?.is_nsfw ?? 0
        };
        isNoCollection.value = false;

        // Set chapter index from postData
        if (postData.chapter_index) {
          const chapterIndex = postData.chapter_index;
          selectedEpisodeNumber.value = chapterIndex.toString();
        }

        // Request singleCollection to get complete episode list
        if (postData.book_id) {
          try {
            const collectionRes = await api.singleCollectionIndex(postData.book_id) as any;
            if (collectionRes.code == 0 && collectionRes.data) {
              const allnums = collectionRes.data.count || 0;
              const totalEpisodes = parseInt(allnums);

              // Update episodes array with complete list
              episodes.value = [];
              for (let i = 1; i <= totalEpisodes; i++) {
                episodes.value.push({
                  value: i.toString(),
                  label: i.toString()
                });
              }
            }
          } catch (error) {
            console.error('Error fetching collection details:', error);
            // Fallback to local chapter index if API call fails
            if (postData.chapter_index) {
              const chapterIndex = postData.chapter_index;
              episodes.value = [];
              for (let i = 1; i <= chapterIndex; i++) {
                episodes.value.push({
                  value: i.toString(),
                  label: i.toString()
                });
              }
            }
          }
        }
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    console.error("Get post details error:", error);
    toast(t('fail'));
  }
}

// Fetch project details using session_id
async function fetchProjectDetails(session_id: string) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await api.detailProject(session_id) as any;

    if (res.code == 200 && res.data) {
      const projectData = res.data;
      // Compare current cover with project's generated cover
      if (projectData && projectData.result_async && projectData.result_async.generate_novel_cover) {
        // If covers are different, set projectCover to show in the list
        if (projectData.result_async.generate_novel_cover != coverPreview.value) {
          projectCover.value = projectData.result_async.generate_novel_cover;
        } else {
          // If covers are the same, clear projectCover to avoid duplicate
          projectCover.value = '';
        }
      }
    }
  } catch (error) {
    console.error("Fetch project details error:", error);
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

function goToHome() {
  router.push('/');
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

  if (!form.value.title.trim()) {
    toast(t('submit.article.titleRequired'));
    return;
  } else if (!form.value.description.trim()) {
    toast(t('submit.article.contentRequired'));
    return;
  } else if (!selectedCollection.value) {
    toast(t('collection.noCollection'));
    return;
  } else if (!selectedEpisodeNumber.value) {
    toast(t('collection.enterEpisode'));
    return;
  }

  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  isUpload.value = true;

  try {
    // Get session_id from selectedProject or route query
    const session_id = selectedProject.value?.session_id || (route.query.session_id as string);
    const index = route.query.index as string;

    // Get cover settings from local storage
    let coverColor = "";
    let coverTitle = "";
    const coverSettingsStr = localStorage.getItem('novelCoverSettings');
    if (coverSettingsStr) {
      try {
        const coverSettings = JSON.parse(coverSettingsStr);
        coverColor = coverSettings.color || "";
        coverTitle = coverSettings.title || "";
      } catch (e) {
        console.error('Error parsing cover settings:', e);
      }
    }

    const payload = {
      type: 2,
      title: form.value.title.trim(),
      cover: coverPreview.value || (selectedCollection.value?.cover || ''),
      content: form.value.description.trim(),
      is_nsfw: selectedCollection.value?.is_nsfw ?? 0,
      access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
      book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
      chapter_index: selectedCollection.value ? parseInt(selectedEpisodeNumber.value) : 0,
      cover_color: coverColor,
      cover_title: coverTitle,
      ...(session_id ? { session_id } : {}),
      ...(chapterIdForPublish.value ? { ai_chapter_index: chapterIdForPublish.value } : (index ? { ai_chapter_index: parseInt(index) } : {})),
      ...(isEditMode && { post_id: postId.value })
    };

    const headers = new Headers();

    const { ts, sign } = window.AntiCrawler.generateAuthParams(token);
    headers.append("token", token);
    headers.append("ts", ts);
    headers.append("sign", sign);
    headers.append("Content-Type", "application/json");

    const data = JSON.stringify(payload);

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data
    };

    const url = postId.value
      ? `${baseUrl}post/modifyPost`
      : `${baseUrl}post/addPost`;

    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code == 0 || res.code == 200) {
      localStorage.removeItem('novelCoverSettings');
      router.push(`/publish/success?type=${2}`);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  const text = target.textContent || "";
  if (text.length > DESC_MAX) {
    const truncated = text.substring(0, DESC_MAX);
    target.textContent = truncated;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    captionLength.value = DESC_MAX;
  } else {
    captionLength.value = text.replace(/\n$/, "").length;
  }
}

function handleCaptionKeydown(e: KeyboardEvent) {
  // No special handling needed
}

function updateCaptionStats() {
  if (captionRef.value) {
    const text = captionRef.value.textContent || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }
}

function onCaptionBlur() {
  if (captionRef.value) {
    form.value.description = captionRef.value.textContent || "";
  }
}

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();

    const pasteText = e.clipboardData?.getData('text/plain') || '';
    if (!pasteText) return;

    const currentText = captionRef.value?.textContent || "";
    const currentLength = currentText.replace(/\n$/, "").length;
    const remaining = DESC_MAX - currentLength;

    if (remaining <= 0) return;

    const text = pasteText.substring(0, remaining);

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
      textContent = await readWordFile(file, fileExtension);
    }

    // Update the caption with the document content
    if (captionRef.value) {
      // Limit to 50000 characters
      const limitedContent = textContent.substring(0, DESC_MAX);
      captionRef.value.textContent = limitedContent;
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
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();

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
async function readWordFile(file: File, fileExtension: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  if (fileExtension === '.doc') {
    try {
      return extractDocText(arrayBuffer);
    } catch (error) {
      console.error('Word .doc parsing error:', error);
      throw new Error('Failed to parse .doc file');
    }
  }
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Word .docx parsing error:', error);
    throw new Error('Failed to parse .docx file');
  }
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
async function openCoverModal() {
  // If coverColor and coverTitle have values, need to fetch project details to get project cover
  if (coverColor.value && coverTitle.value && !projectCover.value) {
    // Get session_id from selectedProject or route query
    const session_id = selectedProject.value?.session_id || (route.query.session_id as string);
    if (session_id) {
      await fetchProjectDetails(session_id);
    }
  }

  showCoverModal.value = true;
}

function onCoverConfirmed(coverData: { url: string; hasBackground: boolean; color: string; title: string }) {
  coverPreview.value = coverData.url;

  hasAICover.value = true;
  hasTitleGeneratedCover.value = false;

  // Store cover settings in local storage if it has background
  if (coverData.hasBackground) {
    const coverSettings = {
      color: coverData.color,
      title: coverData.title
    };
    localStorage.setItem('novelCoverSettings', JSON.stringify(coverSettings));
    // Update coverColor and coverTitle variables
    coverColor.value = coverData.color;
    coverTitle.value = coverData.title;
  } else {
    // Remove cover settings from local storage if it doesn't have background
    localStorage.removeItem('novelCoverSettings');
    // Reset coverColor and coverTitle variables
    coverColor.value = "#FCCEE8";
    coverTitle.value = "";
  }
}

// Sensitive content methods
function toggleSensitive(val: string) {
  if (form.value.content == val) return;

  const dontAsk = localStorage.getItem('sensitiveDontAsk');

  if (val == 'yes') {
    if (dontAsk == '1') {
      form.value.content = val as "yes" | "no";
    } else {
      showSensitiveConfirm.value = true;
    }
  } else {
    form.value.content = val as "yes" | "no";
  }
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
  pendingSensitiveFromSwitch.value = false;
  if (pendingCollectionIdForSensitive.value !== null) {
    doSelectCollection(pendingCollectionIdForSensitive.value, true);
    pendingCollectionIdForSensitive.value = null;
    showCollectionListModal.value = false;
  }
}

async function confirmSensitive() {
  form.value.content = "yes";
  showSensitiveConfirm.value = false;
  if (pendingSensitiveFromSwitch.value) {
    pendingSensitiveFromSwitch.value = false;
    await doToggleCollectionSensitive();
  } else if (pendingCollectionIdForSensitive.value !== null) {
    doSelectCollection(pendingCollectionIdForSensitive.value);
    pendingCollectionIdForSensitive.value = null;
    showCollectionListModal.value = false;
  }
}

const pendingSensitiveFromSwitch = ref(false);

async function toggleCollectionSensitive() {
  if (!selectedCollection.value) return;

  const newNsfw = selectedCollection.value.is_nsfw == 1 ? 0 : 1;

  if (newNsfw == 1) {
    const dontAsk = localStorage.getItem('sensitiveDontAsk');
    if (dontAsk == '1') {
      await doToggleCollectionSensitive();
    } else {
      pendingSensitiveFromSwitch.value = true;
      showSensitiveConfirm.value = true;
    }
  } else {
    await doToggleCollectionSensitive();
  }
}

async function doToggleCollectionSensitive() {
  if (!selectedCollection.value) return;

  const newNsfw = selectedCollection.value.is_nsfw == 1 ? 0 : 1;

  try {
    const res = await api.modifyCollection({
      book_id: selectedCollection.value.id,
      is_nsfw: newNsfw,
    }) as any;

    if (res.code == 0 || res.code == 200) {
      selectedCollection.value.is_nsfw = newNsfw;
      form.value.content = newNsfw == 1 ? 'yes' : 'no';
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Toggle sensitive error:', error);
    toast(t('fail'));
  }
}

// Collection methods
function toggleCollectionDropdown(event: Event) {
  event.stopPropagation();

  if (!showCollectionDropdown.value) {
    // Calculate dropdown position based on element position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 350; // Estimated dropdown height

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > windowHeight) {
        // Not enough space below, check if there's enough space above
        if (rect.top > dropdownHeight) {
          // Show above
          collectionDropdownPosition.value = 'top';
        } else {
          // Not enough space above either, show below but limit height
          collectionDropdownPosition.value = 'bottom';
        }
      } else {
        // Enough space below, show normally
        collectionDropdownPosition.value = 'bottom';
      }
    } else {
      // Default to bottom if target is not available
      collectionDropdownPosition.value = 'bottom';
    }
  }

  showCollectionDropdown.value = !showCollectionDropdown.value;
  showEpisodeDropdown.value = false;

  // Fetch collections when opening dropdown - always refresh for latest data
  if (showCollectionDropdown.value) {
    hasMoreCollections.value = true;
    currentCollectionPage.value = 1;
    collections.value = [];
    fetchCollections(false);
  }
}

function toggleEpisodeDropdown(event: Event) {
  event.stopPropagation();

  if (!showEpisodeDropdown.value) {
    // Calculate dropdown position based on element position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 300; // Estimated dropdown height

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > windowHeight) {
        // Not enough space below, check if there's enough space above
        if (rect.top > dropdownHeight) {
          // Show above
          episodeDropdownPosition.value = 'top';
        } else {
          // Not enough space above either, show below but limit height
          episodeDropdownPosition.value = 'bottom';
        }
      } else {
        // Enough space below, show normally
        episodeDropdownPosition.value = 'bottom';
      }
    } else {
      // Default to bottom if target is not available
      episodeDropdownPosition.value = 'bottom';
    }
  }

  showEpisodeDropdown.value = !showEpisodeDropdown.value;
  showCollectionDropdown.value = false;
}

function createNewCollection() {
  editingCollectionId.value = null;
  isCreateFromCollectionList.value = false;
  showEditCollectionModal.value = true;
  showCollectionDropdown.value = false;
}

function openCollectionListModal() {
  collectionListSelectedId.value = selectedCollection.value?.id || null;
  showCollectionListModal.value = true;
}

function handleCloseCollectionListModal() {
  showCollectionListModal.value = false;
}

function handleSelectCollectionCard(collection: any) {
  if (!route.query.session_id && !selectedProject.value?.session_id && !postId.value) return;
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== collection.id) {
    pendingCollectionId.value = collection.id;
    pendingCollectionData.value = collection;
    showSwitchCollectionModal.value = true;
  }
}

async function handleSelectCollectionFromModal(collection: any) {
  showCollectionListModal.value = false;
  await doSelectCollection(collection.id, true, collection);
}

function handleCreateCollectionFromModal() {
  editingCollectionId.value = null;
  isCreateFromCollectionList.value = true;
  showEditCollectionModal.value = true;
}

function handleEditCollection() {
  showCollectionDropdown.value = false;

  if (selectedCollection.value) {
    const currentCollection = selectedCollection.value;
    editingCollectionId.value = currentCollection.id;

    // Ensure cover and description are available - fetch from collections array if missing
    const collection = collections.value.find(c => c.id === currentCollection.id);

    if (collection) {
      selectedCollection.value = {
        ...currentCollection,
        cover: collection.cover || currentCollection.cover,
        description: collection.description || currentCollection.description
      };
    }
  } else {
    editingCollectionId.value = null;
  }

  isCreateFromCollectionList.value = false;
  showEditCollectionModal.value = true;
}

function handleEditCollectionFromDropdown() {
  showCollectionDropdown.value = false;
  if (selectedCollection.value) {
    const currentCollection = selectedCollection.value;
    editingCollectionId.value = currentCollection.id;

    // Ensure cover and description are available - fetch from collections array if missing
    const collection = collections.value.find(c => c.id === currentCollection.id);
    if (collection) {
      console.log('Collection from array:', JSON.parse(JSON.stringify(collection)));
      selectedCollection.value = {
        ...currentCollection,
        cover: collection.cover || currentCollection.cover,
        description: collection.description || currentCollection.description
      };
    }

    isCreateFromCollectionList.value = false;
    showEditCollectionModal.value = true;
  }
}

async function handleSaveCollection(collection: { id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number }) {
  showEditCollectionModal.value = false;
  projectInfoForNewCollection.value = null;

  if (editingCollectionId.value === null) {
    selectedCollection.value = {
      id: collection.id,
      name: collection.name,
      cover: collection.cover,
      description: collection.description,
      is_nsfw: collection.is_nsfw ?? 0
    };

    if (collection.is_nsfw == 1) {
      form.value.content = 'yes';
    }

    coverPreview.value = collection.cover || '';

    await fetchCollections();

    const chapterCount = 0;
    const defaultEpisode = chapterCount + 1;
    selectedEpisodeNumber.value = defaultEpisode.toString();
    episodes.value = [];
    for (let i = 1; i <= defaultEpisode; i++) {
      episodes.value.push({
        value: i.toString(),
        label: i.toString()
      });
    }
  } else {
    if (selectedCollection.value && selectedCollection.value.id === collection.id) {
      selectedCollection.value.name = collection.name;
      selectedCollection.value.description = collection.description;
      if (collection.cover) {
        selectedCollection.value.cover = collection.cover;
        coverPreview.value = collection.cover;
      }
      selectedCollection.value.is_nsfw = collection.is_nsfw ?? 0;
      if (collection.is_nsfw == 1) {
        form.value.content = 'yes';
      } else if (collection.is_nsfw == 0 && form.value.content !== 'no') {
        form.value.content = 'no';
      }
    }

    const index = collections.value.findIndex(c => c.id === collection.id);
    if (index !== -1) {
      collections.value[index].title = collection.name;
      collections.value[index].description = collection.description;
      if (collection.cover) {
        collections.value[index].cover = collection.cover;
      }
      collections.value[index].is_nsfw = collection.is_nsfw ?? 0;
    }
  }
}

function handleCloseEditCollectionModal() {
  showEditCollectionModal.value = false;
  projectInfoForNewCollection.value = null;
}

async function selectCollection(id: number) {
  if (!route.query.session_id && !selectedProject.value?.session_id && !postId.value) {
    await doSelectCollection(id);
    return;
  }
  // Check if we need to show warning before switching collection
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== id) {
    // Store the target collection ID for confirmation
    pendingCollectionId.value = id;
    showSwitchCollectionModal.value = true;
    showCollectionDropdown.value = false;
    return;
  }

  await doSelectCollection(id);
}

async function doSelectCollection(id: number, skipSensitiveCheck = false, collectionData?: any) {
  const collection = collectionData || collections.value.find(c => c.id === id);
  if (collection) {
    if (!skipSensitiveCheck && collection.is_nsfw == 1 && form.value.content == 'no') {
      const dontAsk = localStorage.getItem('sensitiveDontAsk');
      if (dontAsk == '1') {
        form.value.content = 'yes';
      } else {
        pendingCollectionIdForSensitive.value = id;
        showSensitiveConfirm.value = true;
        return;
      }
    }

    selectedCollection.value = {
      id: collection.id,
      name: collection.title,
      cover: collection.cover,
      description: collection.description,
      is_nsfw: collection.is_nsfw ?? 0
    };

    // Update cover preview to use collection cover
    coverPreview.value = collection.cover || '';

    try {
      // Request collection details to get the current chapter count
      const response = await api.singleCollectionIndex(id) as any;
      if (response.code == 0 && response.data) {
        // Get the total chapter count from the response
        const allnum = response.data.count || 0;
        const defaultEpisode = parseInt(allnum) + 1;

        selectedEpisodeNumber.value = defaultEpisode.toString();

        // Update episodes array based on collection chapters
        episodes.value = [];
        for (let i = 1; i <= defaultEpisode; i++) {
          episodes.value.push({
            value: i.toString(),
            label: i.toString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching collection details:', error);
      // Fallback to local chapter count if API call fails
      const chapterCount = collection.chapters ? collection.chapters.length : 0;
      const defaultEpisode = chapterCount + 1;
      selectedEpisodeNumber.value = defaultEpisode.toString();

      // Update episodes array based on collection chapters
      episodes.value = [];
      for (let i = 1; i <= defaultEpisode; i++) {
        episodes.value.push({
          value: i.toString(),
          label: i.toString()
        });
      }
    }
  }
  showCollectionDropdown.value = false;
  isNoCollection.value = false;
}

function handleCloseSwitchCollectionModal() {
  showSwitchCollectionModal.value = false;
  collectionListSelectedId.value = selectedCollection.value?.id || null;
  pendingCollectionId.value = null;
  pendingCollectionData.value = null;
}

async function handleConfirmSwitchCollection() {
  switchCollectionWarningShown.value = true;
  showSwitchCollectionModal.value = false;
  showCollectionListModal.value = false;

  if (pendingCollectionId.value !== null) {
    await doSelectCollection(pendingCollectionId.value, true, pendingCollectionData.value);
    pendingCollectionId.value = null;
    pendingCollectionData.value = null;
  } else {
    editingCollectionId.value = null;
    isCreateFromCollectionList.value = true;
    showEditCollectionModal.value = true;
  }
}

function clearCollection() {
  selectedCollection.value = null;
  showCollectionDropdown.value = false;
  showEpisodeDropdown.value = false;
  isNoCollection.value = true;
}

function selectEpisode(value: string) {
  selectedEpisodeNumber.value = value;
  showEpisodeDropdown.value = false;
}

function getEpisodeLabel(value: string) {
  const episode = episodes.value.find(ep => ep.value === value);
  return episode ? episode.label : '1';
}

// Project dropdown methods
function toggleProjectDropdown(event: Event) {
  event.stopPropagation();
  showProjectDropdown.value = !showProjectDropdown.value;
  showChapterDropdown.value = false;
}

function toggleChapterDropdown(event: Event) {
  event.stopPropagation();
  showChapterDropdown.value = !showChapterDropdown.value;
  showProjectDropdown.value = false;
}

function getChapterLabel(chapterNumber: number | null) {
  if (!chapterNumber || !selectedProject.value?.chapters) return '';
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === chapterNumber);
  if (!chapter) return '';
  return t('chapter', { chapter: chapterNumber });
}

function selectChapter(chapter: any) {
  selectedEpisode.value = chapter.chapter;
  showChapterDropdown.value = false;
}

// Close dropdowns when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (showProjectDropdown.value && projectDropdownRef.value && !projectDropdownRef.value.contains(target)) {
    showProjectDropdown.value = false;
  }

  // Handle chapter dropdown
  const chapterDropdown = document.querySelector(".chapter-dropdown");
  if (showChapterDropdown.value && chapterDropdown && !chapterDropdown.contains(target)) {
    showChapterDropdown.value = false;
  }

  // Handle collection and episode dropdowns
  const collectionSelect = document.querySelector(".collection-select");
  if (showEpisodeDropdown.value && collectionSelect && !collectionSelect.contains(target)) {
    showEpisodeDropdown.value = false;
  }
}

// Project details cache
const projectDetailsCache = ref<Record<string, any>>({});

// Project list methods
async function fetchProjects(loadMore = false) {
  if (loadMore) {
    if (isLoadingMoreProjects.value || !hasMoreProjects.value) return;
    isLoadingMoreProjects.value = true;
  } else {
    if (isLoadingProjects.value || !hasMoreProjects.value) return;
    isLoadingProjects.value = true;
  }

  try {
    const page = loadMore ? currentProjectPage.value + 1 : 1;
    const response = await api.getProject(0, 'novel', page, 20, 1) as any;
    if (response.code !== 200) {
      toast(t('fail'));
      return;
    }

    const newProjects = response.data.data_list || [];

    if (loadMore) {
      projects.value = [...projects.value, ...newProjects];
      currentProjectPage.value = page;
    } else {
      projects.value = newProjects;
      currentProjectPage.value = 1;

      if(projects.value && projects.value.length > 0) {
        await selectProject(projects.value[0]);
      }
    }

    if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }

    hasMoreProjects.value = newProjects.length == 20;
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    if (loadMore) {
      isLoadingMoreProjects.value = false;
    } else {
      isLoadingProjects.value = false;
    }
  }
}

async function selectProject(project: any) {
  selectedProjectId.value = project.id;
  selectedProject.value = project;
  // Close dropdown
  showProjectDropdown.value = false;

  // Mark as editing mode when selecting from history
  isEditingWork.value = true;

  // Check if project details are in cache
  if (projectDetailsCache.value[project.session_id]) {
    // Use cached project details
    const cachedProject = projectDetailsCache.value[project.session_id];
    Object.assign(project, cachedProject);

    // Show all chapters
    if (project.chapters && project.chapters.length > 0) {
      // Sort chapters by chapter number
      project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);

      // Update episodes array based on all chapters
      episodes.value = [];
      project.chapters.forEach((chapter: any, index: number) => {
        episodes.value.push({
          value: chapter.chapter.toString(),
          label: chapter.chapter.toString()
        });
      });

      // If there are chapters, set default episode to the first one
      if (project.chapters.length > 0) {
        selectedEpisode.value = project.chapters[0].chapter;
        selectedModalEpisode.value = project.chapters[0].chapter;
        selectedEpisodeNumber.value = project.chapters[0].chapter.toString();
      }
    }
    return;
  }

  // Request project details
  try {
    const res = await api.detailProject(project.session_id) as any;
    if (res.code == 200 && res.data) {
      // Update project with details
      Object.assign(project, res.data);

      // Cache project details
      projectDetailsCache.value[project.session_id] = { ...project };

      // Show all chapters
      if (project.chapters && project.chapters.length > 0) {
        // Sort chapters by chapter number
        project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);

        // Update episodes array based on all chapters
        episodes.value = [];
        project.chapters.forEach((chapter: any, index: number) => {
          episodes.value.push({
            value: chapter.chapter.toString(),
            label: chapter.chapter.toString()
          });
        });

        // If there are chapters, set default episode to the first one
        if (project.chapters.length > 0) {
          selectedEpisode.value = project.chapters[0].chapter;
          selectedModalEpisode.value = project.chapters[0].chapter;
          selectedEpisodeNumber.value = project.chapters[0].chapter.toString();
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

      hasMoreCollections.value = newCollections.length === collectionPageSize.value;
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

// Handle project dropdown scroll
function handleProjectDropdownScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;

  // Load more when scrolled to within 100px of the bottom
  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreProjects.value && !isLoadingMoreProjects.value) {
    fetchProjects(true);
  }
}

// Modal methods
async function openViewModal(project: any) {
  previewProject.value = project;

  // Request project details to get chapters array
  try {
    const res = await api.detailProject(project.session_id) as any;
    if (res.code === 200 && res.data) {
      // Update project with details
      Object.assign(project, res.data);
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }

  showViewModal.value = true;
}

function closeViewModal() {
  showViewModal.value = false;
  previewProject.value = null;
}

async function handlePublish(publishData?: any) {
  if (!publishData) trackClickPublishButton(2);
  // Check if publishData is provided (from modal) or if we're handling a direct click
  if (publishData && typeof publishData == 'object' && publishData.project) {
    // From modal: use the provided data
    const { project: targetProject, episode: targetEpisode, title, content, chapterIndex, session_id, cover } = publishData;

    if (!targetProject) {
      toast(t('submit.image.selectNovelFirst'));
      return;
    }

    // Check if chapter is already published
    const chapter = targetProject.chapters?.find((c: any) => c.chapter === targetEpisode);
    if (chapter && chapter.is_publish === 1) {
      toast(t('submit.image.episodeNotUnpublished'));
      return;
    }

    // Store chapterId for publish
    chapterIdForPublish.value = chapterIndex;

    // Use the provided title and content
    form.value.title = title.substring(0, TITLE_MAX);
    form.value.description = content || `This is the content for episode ${targetEpisode} of ${targetProject.name}.`;

    // Set cover from modal (使用合集封面)
    if (cover) {
      coverPreview.value = cover;
    }

    // Store session_id for publish (优先使用传入的session_id)
    if (session_id) {
      selectedProject.value = { ...targetProject, session_id };
    }
  } else {
    // Direct click: use selectedProject and selectedEpisode
    const targetProject = selectedProject.value;
    const targetEpisode = selectedEpisode.value;

    if (!targetProject) {
      toast(t('submit.image.selectNovelFirst'));
      return;
    }

    if (!targetEpisode) {
      toast(t('submit.image.selectChapter'));
      return;
    }

    // Check if chapter is already published
    const chapter = targetProject.chapters?.find((c: any) => c.chapter === targetEpisode);
    if (chapter && chapter.is_publish === 1) {
      toast(t('submit.image.episodeNotUnpublished'));
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

    // Generate title: chapter number + chapter title
    const chapterText = t('chapter', { chapter: targetEpisode });
    let generatedTitle = `${chapterText} ${chapterTitle}`;
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

  // Use cover from project if available, otherwise generate from title
  if (selectedProject.value?.result_async?.generate_novel_cover) {
    coverPreview.value = selectedProject.value.result_async?.generate_novel_cover;
    projectCover.value = selectedProject.value.result_async?.generate_novel_cover;
    hasHistoryCover.value = true;
  } else {
    generateCoverFromTitle();
  }

  // Handle collection logic based on the project name
  const projectName = publishData?.project?.name || selectedProject.value?.name;
  if (projectName) {
    try {
      // Search for collection by title
      const searchRes = await api.searchCollection({ title: projectName, type: 2 }) as any;

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          // Create new collection with cover and description
          const collectionCover = selectedProject.value?.result_async?.generate_novel_cover || '';
          const collectionDescription = t('collection.defaultDescription');
          const projectStoryMode = publishData?.project?.user_selected?.story_mode || publishData?.project?.story_mode || selectedProject.value?.user_selected?.story_mode || selectedProject.value?.story_mode || 'normal';
          const collectionIsNsfw = projectStoryMode == 'nsfw' ? 1 : 0;

          const createRes = await api.addCollection({
            title: projectName,
            type: 2,
            cover: collectionCover,
            description: collectionDescription,
            is_nsfw: collectionIsNsfw
          }) as any;

          if (createRes.code == 0 && createRes.data?.book_id) {
            projectInfoForNewCollection.value = { title: projectName, cover: collectionCover };
            selectedCollection.value = {
              id: createRes.data.book_id,
              name: projectName,
              cover: collectionCover,
              description: collectionDescription,
              is_nsfw: collectionIsNsfw
            };
            selectedEpisodeNumber.value = '1';
            isNoCollection.value = false;
          }
        } else {
          // Get collection details to determine episode number
          const collectionRes = await api.singleCollectionIndex(book_id) as any;

          if (collectionRes.code == 0 && collectionRes.data) {
            const allnums = collectionRes.data.count || 0;
            const episodeNumber = parseInt(allnums) + 1;

            selectedCollection.value = {
              id: book_id,
              name: projectName,
              cover: searchRes.data?.book_info?.cover,
              description: searchRes.data?.book_info?.description,
              is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
            };
            selectedEpisodeNumber.value = episodeNumber.toString();
            isNoCollection.value = false;

            // Update episodes array
            episodes.value = [];
            for (let i = 1; i <= episodeNumber; i++) {
              episodes.value.push({
                value: i.toString(),
                label: i.toString()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling collection from title:', error);
    }
  }

  // Auto-enable sensitive content if project is in unlimited/NSFW mode
  const projectData = publishData?.project || selectedProject.value;
  if (projectData) {
    const storyMode = projectData.user_selected?.story_mode || projectData.story_mode;
    if (storyMode === 'nsfw') {
      form.value.content = 'yes';
    }
  }

  // Switch to full content view
  showFullContent.value = true;

  // Update the contenteditable div after switching to full content view
  setTimeout(() => {
    if (captionRef.value) {
      // Convert literal \n to actual newlines
      const processedContent = form.value.description.replace(/\\n/g, '\n');
      captionRef.value.textContent = processedContent;
      captionLength.value = processedContent.length;
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
    const data = response as any;

    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = subscription && subscription.plan && parseFloat(subscription.plan.price) > 0;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
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

  // Fetch subscription status first so it's ready when needed
  checkSubscriptionStatus();

  // Get post details if postId exists
  if (postId.value) {
    showFullContent.value = true;
    isEditingWork.value = true;
    await getPostDetails();
    // After getting post details (which sets user_id), fetch collections
    await fetchCollections(false);
  } else {
    // Check if session_id and index are provided
    const session_id = route.query.session_id as string;

    if (session_id) {
      isEditingWork.value = true;
    }
    const index = route.query.index as string;
    const cover = route.query.cover as string;
    const title = route.query.title as string;

    if (session_id && index) {
      // Request chapter detail interface
      try {
        // Request project details to get the cover
        try {
          await fetchProjectDetails(session_id);
        } catch (error) {
          console.error('Error fetching project details:', error);
        }

        const res = await api.detailChapter(session_id, parseInt(index)) as any;
        if (res.code === 200 && res.data && res.data.content) {
          // Set form data
          if (res.data.title) {
            // Format: 章节号+章节名称
            const chapterNumber = t('chapter', { chapter: index });
            form.value.title = `${chapterNumber} ${res.data.title}`;
          } else {
            // Fallback: 章节号
            form.value.title = `${t('chapter', { chapter: index })}`;
          }
          form.value.description = res.data.content;

          // Set cover if provided
          if (cover) {
            // If cover is provided in the URL, just display it, no need to upload
            coverPreview.value = cover;
            hasUrlCover.value = true;
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
            if (token) {
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

                  const authHeaders = window.AntiCrawler.generateAuthParams(token);

                  const parma = {
                    method: "POST",
                    headers: {
                      token: token,
                      ...authHeaders,
                    },
                    body: formData,
                  };

                  const res = await fetch(baseUrl + "user/uploadImage", parma);
                  const data = await res.json();
                  if (data.code == 0 || data.code == 200) {
                    const url = (data?.data && (data.data.url || data.data)) || data?.url;
                    if (typeof url == "string") {
                      coverPreview.value = url;
                    }
                  } else {
                    toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
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
              // Convert literal \n to actual newlines
              const processedContent = form.value.description.replace(/\\n/g, '\n');
              captionRef.value.textContent = processedContent;
              captionLength.value = processedContent.length;
            }
          }, 0);

          // Handle collection logic if title is provided
          if (title) {
            try {
              // Search for collection by title
              const searchRes = await api.searchCollection({ title, type: 2 }) as any;

              if (searchRes.code == 0) {
                const book_id = searchRes.data?.book_id || 0;

                if (book_id == 0) {
                  // Create new collection with cover and description
                  const collectionCover = cover || selectedProject.value?.result_async?.generate_novel_cover || '';
                  const collectionDescription = t('collection.defaultDescription');
                  const projectStoryMode = selectedProject.value?.user_selected?.story_mode || selectedProject.value?.story_mode || 'normal';
                  const collectionIsNsfw = projectStoryMode == 'nsfw' ? 1 : 0;

                  const createRes = await api.addCollection({
                    title,
                    type: 2,
                    cover: collectionCover,
                    description: collectionDescription,
                    is_nsfw: collectionIsNsfw
                  }) as any;

                  if (createRes.code == 0 && createRes.data?.book_id) {
                    projectInfoForNewCollection.value = { title, cover: collectionCover };
                    selectedCollection.value = {
                      id: createRes.data.book_id,
                      name: title,
                      cover: collectionCover,
                      description: collectionDescription,
                      is_nsfw: collectionIsNsfw
                    };
                    selectedEpisodeNumber.value = '1';
                    isNoCollection.value = false;
                  }
                } else {
                  // Get collection details to determine episode number
                  const collectionRes = await api.singleCollectionIndex(book_id) as any;

                  if (collectionRes.code == 0 && collectionRes.data) {
                    const allnums = collectionRes.data.count || 0;
                    const episodeNumber = parseInt(allnums) + 1;

                    selectedCollection.value = {
                      id: book_id,
                      name: title,
                      cover: searchRes.data?.book_info?.cover,
                      description: searchRes.data?.book_info?.description,
                      is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
                    };
                    selectedEpisodeNumber.value = episodeNumber.toString();
                    isNoCollection.value = false;

                    // Update episodes array
                    episodes.value = [];
                    for (let i = 1; i <= episodeNumber; i++) {
                      episodes.value.push({
                        value: i.toString(),
                        label: i.toString()
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error handling collection from route:', error);
            }
          }

          // Check subscription status for this user
          await checkSubscriptionStatus();
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
  // Clear cover settings from local storage when leaving the page
  localStorage.removeItem('novelCoverSettings');
});
</script>

<style lang="scss" scoped>
 @use '@/scss/Novel.scss';
</style>
