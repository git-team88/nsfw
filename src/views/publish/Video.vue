<template>
  <div class="submit-video" :class="uploadSuccess || postId ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/publish/back.png" alt="" v-if="uploadSuccess" />
        <img src="@/assets/images/base/back.png" alt="" v-else />
      </div>

      <div class="tabs" :class="uploadSuccess || postId ? 'on' : ''">
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
      <div class="upload-tabs" v-if="!uploadSuccess && !postId && !route.query.session_id">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.video.videoLabel") }}</span>
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

          <div v-else>
            <!-- Project Grid -->
            <div class="project-grid">
              <div
                v-for="(project, index) in projects"
                :key="project.id"
                class="project-item"
                :class="{ selected: selectedProjectId == project.id }"
                @click="selectProject(project)"
              >
                <img :src="project.result_async.generate_manju_cover" alt="" class="project-image" />
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

            <!-- Chapter Selection -->
            <div class="chapter-selection">
              <label>{{ t('submit.video.selectEpisode') }}</label>
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
                    <span class="chapter-number">{{ t('submit.video.episode', { episode: chapter.chapter }) }}</span>
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
                :disabled="isChapterPublished || !isProjectSelected"
              >
                {{ isChapterPublished ? t('novel.published') : t('submit.cover.confirm') }}
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
              accept="video/mp4,video/MOV"
              class="hidden-file"
              title=""
              @change="onVideoPicked"
            />
          </div>
        </div>
      </div>

      <div class="content-wrapper" v-if="uploadSuccess || postId || route.query.session_id">
        <!-- Permission Range -->
        <div class="section">

          <div>
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
                      accept="video/mp4,video/MOV"
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

          <div class="perm-box">
            <div class="form-label-inner">
              <label class="form-label">{{ t("submit.permission") }}:</label>
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
                <span>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Collection -->
        <div class="collection-section">
          <div class="form-item">
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
            </div>
            <div class="collection-row">
              <div class="collection-select">
                <div class="custom-select" :class="{ 'open': showCollectionDropdown }" @click="toggleCollectionDropdown($event)" @mouseenter="isCollectionHovered = true" @mouseleave="isCollectionHovered = false">
                  <span class="select-value">{{ selectedCollection || t('collection.noCollection') }}</span>
                  <div class="select-actions">
                    <div class="select-arrow">
                      <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                    </div>
                  </div>
                </div>
                <div class="custom-dropdown" ref="collectionDropdownRef" v-if="showCollectionDropdown" @scroll="handleCollectionDropdownScroll">
                  <div class="collection-dropdown-item new-collection" @click="createNewCollection">
                    <span>{{ t('collection.newCollection') }}</span>
                    <img src="@/assets/images/publish/plus_icon.png" alt="Plus" />
                  </div>
                  <div class="collection-dropdown-item" v-for="(collection, index) in collections" :key="collection.id" @click="selectCollection(collection.id)" :class="{ 'selected': selectedCollection == collection.title }">
                    {{ collection.title }}
                  </div>
                  <div v-if="isLoadingCollections" class="loading-indicator">
                    <div class="loading-spinner"></div>
                    <span>{{ t('loading') }}</span>
                  </div>
                  <div v-else-if="!hasMoreCollections && currentCollectionPage > 1" class="no-more-collections">
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
        <div class="caption-section">
          <div class="form-item">
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
              <div class="option" @click="toggleSensitive('yes')">
                <img :src="form.content === 'yes' ? selectActive : select" alt="" />
                <span>{{ t("submit.yes") }}</span>
              </div>
              <div class="option" @click="toggleSensitive('no')">
                <img :src="form.content === 'no' ? selectActive : select" alt="" />
                <span>{{ t("submit.no") }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="submit-row">
          <button class="submit" @click="onSubmit">
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

    <!-- Project View Modal -->
    <ProjectVideoViewModal
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

    <!-- Create Collection Modal -->
    <CreateCollectionModal
      :visible="showCreateCollectionModal"
      :existing-collections="collections.map(c => c.name)"
      :type="3"
      @close="handleCloseCreateCollectionModal"
      @save="handleCreateCollection"
    />

    <!-- Switch Collection Confirm Modal -->
    <SwitchCollectionModal
      :visible="showSwitchCollectionModal"
      @close="handleCloseSwitchCollectionModal"
      @confirm="handleConfirmSwitchCollection"
    />
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
import ProjectVideoViewModal from "@/components/ProjectVideoViewModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import CreateCollectionModal from "@/components/CreateCollectionModal.vue";
import SwitchCollectionModal from "@/components/SwitchCollectionModal.vue";
import Pagination from "@/components/Pagination.vue";
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
const agreeTerms = ref(true);
const sessionId = ref("");

const videoInputRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const captionRef = ref<HTMLDivElement | null>(null);

// Check if in edit mode
const route = useRoute();
const postId = ref(route.query.post_id as string);
const chapterIdForPublish = ref<number | null>(null);

const showPreviewModal = ref(false);
const videoPreviewUrl = ref("");

const isShowConfirm = ref(false);
const pendingRoute = ref<{ path: string } | null>(null);
const tabIndex = ref(2);

const TITLE_MAX = 60;
const DESC_MAX = 4000;

const uid = localStorage.getItem("uid") || '';

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
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);

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

// Upload options
const uploadOption = ref('history');

// Upload options for v-for
const uploadOptions = [
  {
    id: 'history',
    value: 'history',
    label: 'submit.video.uploadFromHistory'
  },
  {
    id: 'local',
    value: 'local',
    label: 'submit.video.localUpload'
  }
];

// Tab list
const tabList = [
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
];

// Change tab
function changeTab(tab: { name: string; path: string }, index: number) {
  if (uploadSuccess.value || videoFile.value || form.value.title || captionLength.value > 0) {
    isShowConfirm.value = true;
    pendingRoute.value = { path: tab.path };
  } else {
    router.replace(tab.path);
  }
}

function goToHome() {
  router.push('/');
}


// Project list
const projects = ref<any[]>([]);
const selectedProjectId = ref('');
const selectedProject = ref<any>(null);
const isLoadingProjects = ref(true);

// Pagination
const currentPage = ref(1);
const totalProjects = ref(1000);
const pageSize = ref(8);

// Episode selection
const selectedEpisode = ref(null);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(null);

// Chapter dropdown
const showChapterDropdown = ref(false);

// Project details cache
const projectDetailsCache = ref<Record<string, any>>({});

// Preview modal project (separate from selected project)
const previewProject = ref<any>(null);

// Collection
const selectedCollection = ref('');
const selectedCollectionId = ref<number | ''>('');
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const isCollectionHovered = ref(false);
const showCreateCollectionModal = ref(false);
const showSwitchCollectionModal = ref(false);
const switchCollectionWarningShown = ref(false);
const pendingCollectionId = ref<number | null>(null);
const isEditingWork = ref(false);
const isNoCollection = ref(true);
const collections = ref<any[]>([]);
const episodes = ref([
  { value: '1', label: t('submit.video.episode', { episode: 1 }) },
]);

// Collection pagination
const collectionDropdownRef = ref<HTMLDivElement | null>(null);
const currentCollectionPage = ref(1);
const collectionPageSize = ref(20);
const hasMoreCollections = ref(true);
const isLoadingCollections = ref(false);

// Community Convention Modal
const showConventionModal = ref(false);

// Subscription prompt modal
const showSubscriptionModal = ref(false);

// Computed
const captionLength = ref(0);
const canSubmit = computed(() => {
  return uploadSuccess.value && selectedCollection.value && coverPreview.value;
});

// Watch route changes to update tabIndex
watch(() => route.path, (newPath) => {
  const tab = tabList.find(t => t.path === newPath);
  if (tab) {
    const index = tabList.indexOf(tab);
    tabIndex.value = index;
  }
});

// Watch uploadOption changes to fetch projects when switching to history
watch(uploadOption, (newOption) => {
  if (newOption == 'history') {
    fetchProjects();
  }
});

// Check if selected chapter is already published
const isChapterPublished = computed(() => {
  if (!selectedProject.value?.chapters || !selectedEpisode.value) return false;
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === selectedEpisode.value);
  return chapter?.is_publish == 1;
});

// Check if a project is selected
const isProjectSelected = computed(() => {
  return !!selectedProject.value && !!selectedEpisode.value;
});

// Collection methods
function toggleCollectionDropdown(event: Event) {
  event.stopPropagation();
  showCollectionDropdown.value = !showCollectionDropdown.value;
  showEpisodeDropdown.value = false;

  if (showCollectionDropdown.value) {
    // Reset pagination and clear collections first
    hasMoreCollections.value = true;
    collections.value = [];
    currentCollectionPage.value = 1;
    fetchCollections(false);
  }
}

function toggleEpisodeDropdown(event: Event) {
  event.stopPropagation();
  showEpisodeDropdown.value = !showEpisodeDropdown.value;
  showCollectionDropdown.value = false;
}

function createNewCollection() {
  showCollectionDropdown.value = false;
  showCreateCollectionModal.value = true;
}

async function selectCollection(id: number) {
  // Check if we need to show warning before switching collection
  if (isEditingWork.value && !switchCollectionWarningShown.value && selectedCollectionId.value && selectedCollectionId.value !== id) {
    // Store the target collection ID for confirmation
    pendingCollectionId.value = id;
    showSwitchCollectionModal.value = true;
    showCollectionDropdown.value = false;
    return;
  }

  await doSelectCollection(id);
}

async function doSelectCollection(id: number) {
  const collection = collections.value.find(c => c.id === id);
  if (collection) {
    selectedCollection.value = collection.title;
    selectedCollectionId.value = collection.id;

    try {
      // Request collection details to get the current chapter count
      const response = await api.singleCollection(id, 1, 10) as any;
      if (response.code == 0 && response.data) {
        // Get the total chapter count from the response
        const allnum = response.data.allnums || '0';
        const defaultEpisode = parseInt(allnum) + 1;
        selectedEpisodeNumber.value = defaultEpisode.toString();

        // Update episodes array based on collection chapters
        episodes.value = [];
        // 先添加已有的章节
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: t('submit.video.episode', { episode: index + 1 })
            });
          });
        } else if (collection.chapters && collection.chapters.length > 0) {
          // Fallback to collection.chapters if response.data.data is not available
          collection.chapters.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: t('submit.video.episode', { episode: index + 1 })
            });
          });
        }
        // 添加新的一集
        episodes.value.push({
          value: defaultEpisode.toString(),
          label: t('submit.video.episode', { episode: defaultEpisode })
        });
      }
    } catch (error) {
      console.error('Error fetching collection details:', error);
      // Fallback to local chapter count if API call fails
      const chapterCount = collection.chapters ? collection.chapters.length : 0;
      const defaultEpisode = chapterCount + 1;
      selectedEpisodeNumber.value = defaultEpisode.toString();

      // Update episodes array based on collection chapters
      episodes.value = [];
      // 先添加已有的章节
      if (collection.chapters && collection.chapters.length > 0) {
        collection.chapters.forEach((chapter: any, index: number) => {
          episodes.value.push({
            value: (index + 1).toString(),
            label: t('submit.video.episode', { episode: index + 1 })
          });
        });
      }
      // 添加新的一集
      episodes.value.push({
        value: defaultEpisode.toString(),
        label: t('submit.video.episode', { episode: defaultEpisode })
      });
    }
  }
  showCollectionDropdown.value = false;
  isNoCollection.value = false;
}

function clearCollection() {
  selectedCollection.value = '';
  selectedCollectionId.value = '';
  showCollectionDropdown.value = false;
  showEpisodeDropdown.value = false;
  isNoCollection.value = true;
}

function handleCloseSwitchCollectionModal() {
  showSwitchCollectionModal.value = false;
  pendingCollectionId.value = null;
}

async function handleConfirmSwitchCollection() {
  // Mark warning as shown
  switchCollectionWarningShown.value = true;

  // Close modal first before updating collection
  showSwitchCollectionModal.value = false;

  // Wait for modal to close before updating collection
  await new Promise(resolve => setTimeout(resolve, 100));

  if (pendingCollectionId.value !== null) {
    await doSelectCollection(pendingCollectionId.value);
  }

  pendingCollectionId.value = null;
}

function selectEpisode(value: string) {
  selectedEpisodeNumber.value = value;
  showEpisodeDropdown.value = false;
}

function getEpisodeLabel(value: string) {
  const episode = episodes.value.find(ep => ep.value === value);
  return episode ? episode.label : t('submit.video.episode', { episode: 1 });
}

// Fetch collections
async function fetchCollections(loadMore = false) {
  if (isLoadingCollections.value || (!loadMore && !hasMoreCollections.value)) return;

  isLoadingCollections.value = true;

  try {
    const page = loadMore ? currentCollectionPage.value + 1 : 1;
    const response = await api.getCollection(3, page, collectionPageSize.value, uid) as any;

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

  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreCollections.value && !isLoadingCollections.value) {
    fetchCollections(true);
  }
}

async function handleCreateCollection(collection: { name: string }) {
  // Refresh collections list from API
  await fetchCollections(false);
  // Select the newly created collection
  selectedCollection.value = collection.name;
  // Find and set the new collection ID
  const newCollection = collections.value.find(c => c.title === collection.name);
  if (newCollection) {
    selectedCollectionId.value = newCollection.id;
  }
  // Keep current episode number, don't reset to 1
  showCreateCollectionModal.value = false;
  isNoCollection.value = false;
}

function handleCloseCreateCollectionModal() {
  showCreateCollectionModal.value = false;
}

// Chapter dropdown functions
function toggleChapterDropdown(event: Event) {
  event.stopPropagation();
  showChapterDropdown.value = !showChapterDropdown.value;
}

function getChapterLabel(chapterNumber: number | null) {
  if (!chapterNumber || !selectedProject.value?.chapters) return '';
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === chapterNumber);
  if (!chapter) return '';
  return t('submit.video.episode', { episode: chapterNumber });
}

function selectChapter(chapter: any) {
  selectedEpisode.value = chapter.chapter;
  selectedModalEpisode.value = chapter.chapter;
  showChapterDropdown.value = false;
}

// Project list methods
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = await api.getProject(0, 'manju', currentPage.value, 10, 1) as any;
    if (response.code != 200) {
      toast(t('fail'));
      return;
    }

    projects.value = response.data.data_list || [];

    if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }

    if(projects.value && projects.value.length > 0) {
      await selectProject(projects.value[0]);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    isLoadingProjects.value = false;
  }
}

async function selectProject(project: any) {
  selectedProjectId.value = project.id;
  selectedProject.value = project;

  // Mark as editing mode when selecting from history
  isEditingWork.value = true;

  if (project.result_async?.generate_manju_cover) {
    coverPreview.value = project.result_async.generate_manju_cover;
  }

  // Check if project details are in cache
  if (project.session_id && projectDetailsCache.value[project.session_id]) {
    // Use cached project details
    const cachedProject = projectDetailsCache.value[project.session_id];
    Object.assign(project, cachedProject);

    // Set cover from cached project details
    if (project.cover) {
      coverPreview.value = project.cover;
    } else if (project.result_async?.generate_manju_cover) {
      coverPreview.value = project.result_async.generate_manju_cover;
    }

    // Show all chapters
    if (project.chapters && project.chapters.length > 0) {
      // Sort chapters by chapter number
      project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);

      // If there are chapters, set default episode to the first one
      if (project.chapters.length > 0) {
        selectedEpisode.value = project.chapters[0].chapter;
        selectedModalEpisode.value = project.chapters[0].chapter;
      }
    }
    return;
  }

  // Request project details
  try {
    if (project.session_id) {
      const res = await api.detailProject(project.session_id) as any;
      if (res.code === 200 && res.data) {
        // Update project with details
        Object.assign(project, res.data);

        // Set cover from project details
        if (project.cover) {
          coverPreview.value = project.cover;
        } else if (project.result_async?.generate_manju_cover) {
          coverPreview.value = project.result_async.generate_manju_cover;
        }

        // Cache project details
        projectDetailsCache.value[project.session_id] = { ...project };

        // Show all chapters
        if (project.chapters && project.chapters.length > 0) {
          // Sort chapters by chapter number
          project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);

          // If there are chapters, set default episode to the first one
          if (project.chapters.length > 0) {
            selectedEpisode.value = project.chapters[0].chapter;
            selectedModalEpisode.value = project.chapters[0].chapter;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }
}



// Modal methods
async function openViewModal(project: any) {
  previewProject.value = project;

  // Check if project details are in cache
  if (projectDetailsCache.value[project.session_id]) {
    // Use cached project details
    const cachedProject = projectDetailsCache.value[project.session_id];
    Object.assign(project, cachedProject);

    // Show all chapters
    if (project.chapters && project.chapters.length > 0) {
      // Sort chapters by chapter number
      project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);
    }
  } else {
    // Request project details to get chapters array
    try {
      const res = await api.detailProject(project.session_id) as any;
      if (res.code === 200 && res.data) {
        // Update project with details
        Object.assign(project, res.data);

        // Cache project details
        projectDetailsCache.value[project.session_id] = { ...project };

        // Show all chapters
        if (project.chapters && project.chapters.length > 0) {
          // Sort chapters by chapter number
          project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);
        }
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  }

  showViewModal.value = true;
}

function closeViewModal() {
  showViewModal.value = false;
  previewProject.value = null;
}

async function handlePublish() {
  const project = selectedProject.value;
  const episode = selectedEpisode.value;

  if (!project) {
    toast(t('submit.video.selectVideoFirst'));
    return;
  }

  if (!episode) {
    toast(t('submit.video.selectEpisode'));
    return;
  }

  const episodeText = t('submit.video.episode', { episode });
  let episodeTitle = '';

  // Get chapter details to get video, cover, and title from chapter data
  try {
    // Check if session_id exists
    if (project.session_id) {
      // Set cover from project cover, not chapter cover
      if (project.cover) {
        coverPreview.value = project.cover;
      } else if (project.result_async?.generate_manju_cover) {
        coverPreview.value = project.result_async.generate_manju_cover;
      }

      const chapterRes = await api.detailChapter(project.session_id, episode) as any;
      if (chapterRes.code == 200) {
        const chapterData = chapterRes.data;
        const resultAsync = chapterRes.data.result_async;

        // Get title from chapter data
        if (chapterData.title) {
          episodeTitle = chapterData.title;
        }

        // Get description from chapter data
        let episodeDescription = '';
        if (chapterData.chapter_description) {
          episodeDescription = chapterData.chapter_description;
        }

        // Set video URL from final_video_output, prefer 1080p if available
        if (resultAsync?.final_video_output) {
          videoUrl.value = resultAsync.final_video_output.video_url_1080p || resultAsync.final_video_output.video_url;
          uploadSuccess.value = true;
          uploadProgress.value = 100;
        }

        // Set description
        if (episodeDescription) {
          form.value.description = episodeDescription;
          nextTick(() => {
            if (captionRef.value) {
              captionRef.value.innerText = episodeDescription;
            }
          });
        }
      }
    } else {
      // Set title using project name and episode if session_id is not available
      form.value.title = `${project.name} ${episodeText}`;
    }
  } catch (error) {
    console.error('Error fetching chapter details for publish:', error);

    // Set title using project name and episode if API call fails
    form.value.title = `${project.name} ${episodeText}`;
  }

  // Generate title: Episode X Title
  if (episodeTitle) {
    form.value.title = `${episodeText} ${episodeTitle}`;
  } else {
    form.value.title = episodeText;
  }

  // Handle collection logic based on the project name
  if (project.name) {
    try {
      // Search for collection by title
      const searchRes = await api.searchCollection({ title: project.name, type: 3 }) as any;

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          // Create new collection
          const createRes = await api.addCollection({ title: project.name, type: 3 }) as any;

          if (createRes.code == 0 && createRes.data?.book_id) {
            selectedCollection.value = project.name;
            selectedCollectionId.value = createRes.data.book_id;
            selectedEpisodeNumber.value = '1';
            isNoCollection.value = false;
          }
        } else {
          // Get collection details to determine episode number
          const collectionRes = await api.singleCollection(book_id, 1, 10) as any;

          if (collectionRes.code == 0 && collectionRes.data) {
            const allnums = collectionRes.data.allnums || '0';
            const episodeNumber = parseInt(allnums) + 1;

            selectedCollection.value = project.name;
            selectedCollectionId.value = book_id;
            selectedEpisodeNumber.value = episodeNumber.toString();
            isNoCollection.value = false;

            // Update episodes array
            episodes.value = [];
            for (let i = 1; i <= episodeNumber; i++) {
              episodes.value.push({
                value: i.toString(),
                label: t('submit.video.episode', { episode: i })
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling collection from title:', error);
    }
  }

  // Store episode for publish
  chapterIdForPublish.value = episode;

  uploadSuccess.value = true;
  uploadProgress.value = 100;

  showViewModal.value = false;
}

// Community Convention Modal methods
function closeConventionModal() {
  showConventionModal.value = false;
}

function confirmConvention() {
  showConventionModal.value = false;
  agreeTerms.value = true;
  onSubmit();
}

// Subscription prompt modal methods
function closeSubscriptionModal() {
  showSubscriptionModal.value = false;
}

function goToSubscriptionSettings() {
  showSubscriptionModal.value = false;
  window.location.href = '/user-subscription';
}

// Check subscription status on page load
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

// Methods
function goBack() {
  const isVideoFromUrl = !!route.query.url;

  if (videoFile.value || form.value.title || captionLength.value > 0 || isVideoFromUrl) {
    isShowConfirm.value = true;
    return;
  }
  router.go(-1);
}

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
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        videoType.value = extension;
        resolve(true);
      };
    });

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
    // Check file size (5GB limit)
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > MAX_SIZE) {
      toast(t('submit.video.sizeError'));
      return;
    }
    await startFakeUpload(file);
  }
  input.value = "";
}

async function onDropFile(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    // Check file size (5GB limit)
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > MAX_SIZE) {
      toast(t('submit.video.sizeError'));
      return;
    }
    await startFakeUpload(file);
  }
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
    showSubscriptionModal.value = true;
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
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights == '2' ? "partial" : postData.access_rights == '3' ? "private" : "public";
      form.value.content = postData.is_nsfw === '1' ? "yes" : "no";
      coverPreview.value = postData.cover || "";

      if (postData.video_url) {
        videoUrl.value = postData.video_url;
        uploadSuccess.value = true;
        uploadProgress.value = 100;
      }

      if (captionRef.value) {
        const content = postData.content || "";
        captionRef.value.innerHTML = '';

        let currentIndex = 0;
        let pos = 0;
        const contentLength = content.length;

        while (pos < contentLength) {
          const tagIndex = content.indexOf('#', pos);
          const mentionIndex = content.indexOf('@', pos);

          let nextMatchIndex = -1;
          let isTag = false;

          if (tagIndex === -1 && mentionIndex === -1) {
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

          if (nextMatchIndex > currentIndex) {
            const textBefore = content.substring(currentIndex, nextMatchIndex);
            const textNode = document.createTextNode(textBefore);
            captionRef.value?.appendChild(textNode);
          }

          let endIndex = nextMatchIndex + 1;
          while (endIndex < contentLength) {
            const char = content[endIndex];
            if (char === '\u0020' || char === '\n' || char === '\t') {
              break;
            }
            endIndex++;
          }

          const matchText = content.substring(nextMatchIndex, endIndex);

          const span = document.createElement('span');
          span.className = isTag ? 'tag topic' : 'tag mention';
          span.style.color = '#00d3f2';
          span.contentEditable = 'false';
          span.textContent = matchText;
          captionRef.value?.appendChild(span);

          const space = document.createTextNode('\u0020');
          captionRef.value?.appendChild(space);

          currentIndex = endIndex;
          pos = endIndex;
        }

        if (currentIndex < content.length) {
          const textAfter = content.substring(currentIndex);
          const textNode = document.createTextNode(textAfter);
          captionRef.value?.appendChild(textNode);
        }

        captionLength.value = content.length;
      }

      // Set selected collection from book_title
      if (postData.book_title) {
        selectedCollection.value = postData.book_title;
        selectedCollectionId.value = postData.book_id || '';
        isNoCollection.value = false;

        // Set chapter index from postData
        if (postData.chapter_index) {
          const chapterIndex = postData.chapter_index;
          selectedEpisodeNumber.value = chapterIndex.toString();

          // If there's a book_id, request collection details to get complete episode list
          if (postData.book_id) {
            try {
              const collectionRes = await api.singleCollection(postData.book_id, 1, 10) as any;
              if (collectionRes.code === 0 && collectionRes.data) {
                const allnum = collectionRes.data.allnums || '0';
                const totalEpisodes = parseInt(allnum);

                // Update episodes array with complete list
                episodes.value = [];
                for (let i = 1; i <= totalEpisodes; i++) {
                  episodes.value.push({
                    value: i.toString(),
                    label: t('submit.video.episode', { episode: i })
                  });
                }
              }
            } catch (error) {
              console.error('Error fetching collection details:', error);
              // Fallback to local chapter index if API call fails
              episodes.value = [];
              for (let i = 1; i <= chapterIndex; i++) {
                episodes.value.push({
                  value: i.toString(),
                  label: t('submit.video.episode', { episode: i })
                });
              }
            }
          } else {
            // Update episodes array
            episodes.value = [];
            for (let i = 1; i <= chapterIndex; i++) {
              episodes.value.push({
                value: i.toString(),
                label: t('submit.video.episode', { episode: i })
              });
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

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const currentText = captionRef.value?.innerText || '';
  const currentLength = currentText.length;
  const remainingLength = DESC_MAX - currentLength;
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

  if (currentLength > DESC_MAX) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      target.innerText = trimmedText.substring(0, DESC_MAX);
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

  // 检查是否在 span 标签内（已选中的话题/提及标签）
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

  // 只有光标在 # 或 @ 后面（包括正在输入中）才显示下拉框
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

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 检查是否在 span 标签内（已选中的话题/提及标签）
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

  // 只有光标紧跟在 # 或 @ 后面才显示下拉框
  // 检查 textBefore 是否以 # 或 @ 结尾
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
              showToast(t('submit.video.toastTopicLimit'), "");
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
              showToast(t('submit.video.toastTopicLimit'), "");
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

  const dropdownHeight = 250;
  const dropdownWidth = 280;

  // 处理底部溢出
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

  // 处理右边溢出，使用 right 属性定位
  if (absLeft + dropdownWidth > window.innerWidth) {
    dropdownPosition.value.left = undefined;
    dropdownPosition.value.right = 10;
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

  dropdownType.value = symbol;

  nextTick(async () => {
    await searchTagsImmediate(symbol, "");

    setTimeout(() => {
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.rangeCount === 0) {
        return;
      }

      const currentRange = currentSelection.getRangeAt(0);
      lastRange.value = currentRange.cloneRange();

      const rect = currentRange.getBoundingClientRect();

      let absTop = rect.top + window.scrollY;
      let absLeft = rect.left + window.scrollX;

      absTop = rect.bottom + 5;
      absLeft = rect.left;

      if ((absTop < 100 || absLeft < 10) && captionRef.value) {
        const captionRect = captionRef.value.getBoundingClientRect();
        absTop = captionRect.top + 26;
        absLeft = captionRect.left;
      }

      dropdownPosition.value = {
        top: absTop,
        left: absLeft,
      };

      const dropdownHeight = 250;
      if (absTop + dropdownHeight > window.innerHeight) {
        dropdownPosition.value.top = rect.top - dropdownHeight - 5;
      }

      showDropdown.value = true;
    }, 100);

    captionRef.value?.focus();
  });
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

  // Handle chapter dropdown
  const chapterDropdown = document.querySelector(".chapter-dropdown");
  if (showChapterDropdown.value && chapterDropdown && !chapterDropdown.contains(target)) {
    showChapterDropdown.value = false;
  }

  // Handle collection and episode dropdowns
  const collectionSelect = document.querySelector(".collection-select");
  if (showCollectionDropdown.value && collectionSelect && !collectionSelect.contains(target)) {
    showCollectionDropdown.value = false;
  }
  if (showEpisodeDropdown.value && collectionSelect && !collectionSelect.contains(target)) {
    showEpisodeDropdown.value = false;
  }
}

function adjustTooltipPosition(event: MouseEvent) {
  const infoIcon = event.currentTarget as HTMLElement;
  const tooltip = infoIcon.querySelector('.tooltip') as HTMLElement;

  if (tooltip) {
    tooltip.style.top = '50%';
    tooltip.style.left = '100%';
    tooltip.style.right = 'auto';
    tooltip.style.transform = 'translateY(-50%)';
    tooltip.style.marginLeft = '2rem';
    tooltip.style.marginRight = '0';
    tooltip.classList.remove('tooltip-left');

    const infoIconRect = infoIcon.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (infoIconRect.right + 300 > windowWidth) {
      tooltip.style.left = 'auto';
      tooltip.style.right = '100%';
      tooltip.style.marginLeft = '0';
      tooltip.style.marginRight = '2rem';
      tooltip.classList.add('tooltip-left');
    }

    const tooltipTop = infoIconRect.top + infoIconRect.height / 2 - 180 / 2;
    if (tooltipTop + 180 > windowHeight) {
      const overflow = (tooltipTop + 180) - windowHeight;
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '0';
      tooltip.style.transform = 'none';
    } else if (tooltipTop < 0) {
      tooltip.style.top = '0';
      tooltip.style.transform = 'none';
    } else {
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateY(-50%)';
    }
  }
}

async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  const isEditMode = !!postId.value;
  const isVideoFromUrl = !!route.query.url;

  if (!videoUrl.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  if (!isEditMode && !isVideoFromUrl && !videoFile.value && (!videoUrl.value || !uploadSuccess.value)) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  if (isEditMode && uploadError.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  if (!isVideoFromUrl && !uploadSuccess.value) {
    toast(t("submit.video.toastUploadFailed"));
    return;
  }

  if (!selectedCollection.value) {
    toast(t("collection.noCollection"));
    return;
  }

  if (!coverPreview.value) {
    toast(t("submit.video.toastSetCover"));
    return;
  }

  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  let processedContent = form.value.description.trim();

  const el = captionRef.value;
  if (el) {
    const mentionSpans = el.querySelectorAll('.tag.mention');
    if (mentionSpans.length > 0) {
      mentionSpans.forEach((span) => {
        const spanText = span.textContent || '';
        if (spanText.startsWith('@')) {
          const username = spanText.substring(1);
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
    // Get session_id and index from route query or selectedProject
    const session_id = route.query.session_id as string || (selectedProject.value?.session_id as string) || sessionId.value;
    const index = route.query.index as string;

    const payload = {
      type: 3,
      title: form.value.title.trim(),
      cover: coverPreview.value,
      content: processedContent,
      is_nsfw: form.value.content == "yes" ? 1 : 0,
      access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
      video_url: videoUrl.value,
      book_id: selectedCollection.value ? (selectedCollectionId.value || 0) : 0,
      chapter_index: selectedCollection.value ? parseInt(selectedEpisodeNumber.value) : 0,
      cover_color: '',
      cover_title: '',
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

    if (res.code === 0 || res.code === 200) {
      router.push(`/publish/success`);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  getCountry();
  await checkSubscriptionStatus();

  const sessionIdParam = route.query.session_id as string;
  if (sessionIdParam) {
    sessionId.value = sessionIdParam;
  }

  const urlParam = route.query.url as string;
  const indexParam = route.query.index as string;

  if (urlParam && urlParam.trim()) {
    videoUrl.value = urlParam;
    uploadSuccess.value = true;
    uploadProgress.value = 100;

    const coverParam = route.query.cover as string;
    if (coverParam && coverParam.trim()) {
      coverPreview.value = coverParam;
    }

    // Handle collection logic if title is provided
    const title = route.query.title as string;
    if (title) {
      try {
        // Search for collection by title
        const searchRes = await api.searchCollection({ title, type: 3 }) as any;

        if (searchRes.code === 0) {
          const book_id = searchRes.data?.book_id || 0;

          if (book_id === 0) {
            // Create new collection
            const createRes = await api.addCollection({ title, type: 3 }) as any;

            if (createRes.code === 0 && createRes.data?.id) {
              selectedCollection.value = title;
              selectedCollectionId.value = createRes.data.id;
              selectedEpisodeNumber.value = '1';
              isNoCollection.value = false;
            }
          } else {
            // Get collection details to determine episode number
            const collectionRes = await api.singleCollection(book_id, 1, 10) as any;

            if (collectionRes.code === 0 && collectionRes.data) {
              const allnums = collectionRes.data.allnums || '0';
              const episodeNumber = parseInt(allnums) + 1;

              selectedCollection.value = title;
              selectedCollectionId.value = book_id;
              selectedEpisodeNumber.value = episodeNumber.toString();
              isNoCollection.value = false;

              // Update episodes array
              episodes.value = [];
              for (let i = 1; i <= episodeNumber; i++) {
                episodes.value.push({
                  value: i.toString(),
                  label: t('submit.video.episode', { episode: i })
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling collection from route:', error);
      }
    }

    // Request chapter details if session_id and index are provided
    if (sessionIdParam && indexParam) {
      try {
        const chapterRes = await api.detailChapter(sessionIdParam, parseInt(indexParam)) as any;
        if (chapterRes.code == 200 && chapterRes.data) {
          const chapterData = chapterRes.data;
          if (chapterData.title) {
            const episodeText = t('submit.video.episode', { episode: indexParam });
            form.value.title = `${episodeText} ${chapterData.title}`;
          }

          if (chapterData.chapter_description) {
            form.value.description = chapterData.chapter_description;
            captionLength.value = chapterData.chapter_description.length;

            // Render content to captionRef
            await nextTick();
            if (captionRef.value) {
              const content = chapterData.chapter_description;
              captionRef.value.innerHTML = '';

              let currentIndex = 0;
              let pos = 0;
              const contentLength = content.length;

              while (pos < contentLength) {
                const tagIndex = content.indexOf('#', pos);
                const mentionIndex = content.indexOf('@', pos);

                let nextMatchIndex = -1;
                let isTag = false;

                if (tagIndex === -1 && mentionIndex === -1) {
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

                if (nextMatchIndex > currentIndex) {
                  const textBefore = content.substring(currentIndex, nextMatchIndex);
                  const textNode = document.createTextNode(textBefore);
                  captionRef.value?.appendChild(textNode);
                }

                let endIndex = nextMatchIndex + 1;
                while (endIndex < contentLength) {
                  const char = content[endIndex];
                  if (char === '\u0020' || char === '\n' || char === '\t') {
                    break;
                  }
                  endIndex++;
                }

                const matchText = content.substring(nextMatchIndex, endIndex);
                const span = document.createElement('span');
                span.className = isTag ? 'topic-tag' : 'mention-tag';
                span.innerText = matchText;
                captionRef.value?.appendChild(span);

                currentIndex = endIndex;
                pos = endIndex;
              }

              if (currentIndex < contentLength) {
                const remainingText = content.substring(currentIndex);
                const textNode = document.createTextNode(remainingText);
                captionRef.value?.appendChild(textNode);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chapter details:', error);
      }
    }
  } else if (postId.value) {
    await getPostDetails();
  } else {
    await fetchProjects();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
 @use '@/scss/Video.scss';
</style>
