<template>
  <div class="submit-image" :class="imageFiles.length > 0 ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/publish/back.png" alt="" v-if="imageFiles.length > 0" />
        <img src="@/assets/images/base/back.png" alt="" v-else />
      </div>

      <div class="tabs" :class="imageFiles.length > 0 ? 'on' : ''">
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
          <span><b>*</b>{{ t("submit.image.imageLabel") }}</span>
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
                <div class="project-image-container">
                  <img :src="processImageUrl(project.result_async.generate_manhua_cover)" alt="" class="project-image" />
                  <div class="view-icon" @click.stop="openViewModal(project)">
                    <img src="@/assets/images/publish/view.png" alt="View" />
                  </div>
                </div>
                <div v-if="project.name" class="project-title">{{ project.name }}</div>
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
            <div v-if="projects.length > 0" class="chapter-selection">
              <label>{{ t('submit.image.selectChapter') }}</label>
              <div class="chapter-dropdown">
                <div class="custom-select" :class="{ 'open': showChapterDropdown }" @click="toggleChapterDropdown($event)">
                  <span class="select-value">{{ getChapterLabel(selectedEpisode) }}</span>
                  <div class="select-arrow">
                    <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                  </div>
                </div>
                <div class="custom-dropdown" v-if="showChapterDropdown" :class="{ 'dropdown-top': chapterDropdownPosition === 'top' }">
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
            <div v-if="projects.length > 0" class="publish-section">
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
        <div v-else-if="uploadOption == 'local'" class="upload-area-box">
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

      <div class="content-wrapper" v-if="showFullContent || postId || route.query.session_id">
        <input
          ref="reuploadInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style="display: none;"
          @change="onReuploadPicked"
        />
        <div class="section">
          <div class="list-section">
            <div class="list-top">
              <div class="form-label-box">
                <span><b>*</b>{{ t("submit.image.imageLabel") }}</span>
              </div>

              <div class="add-more-row" @click="pickImages" v-if="imageFiles.length < 12">
                <span class="add-btn">{{ t("submit.image.add") }}</span>
                <input
                  ref="imageAddRef"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  title=""
                  class="add-file"
                  @click.stop
                  @change="onImagesPicked"
                />
              </div>

            </div>

            <div class="image-list-box">
              <div class="image-list">
                <div class="image-item" v-for="(f, idx) in imageFiles" :key="f._key">
                  <img class="image" :src="processImageUrl(f._url || f._preview)" alt="" />

                  <div class="image-btn">
                    <div class="reload">
                      <img
                        src="@/assets/images/publish/reload.png"
                        alt=""
                        @click.stop="reloadImage(idx)"
                      />
                    </div>

                    <img
                      src="@/assets/images/publish/delete.png"
                      alt=""
                      @click="removeImage(idx)"
                      v-if="imageFiles.length > 1"
                    />
                   </div>
                 </div>
                <!-- Show placeholder in edit mode when no images -->
                <div v-if="postId && imageFiles.length === 0" class="image-item">
                  <img src="@/assets/images/base/cover.png" alt="" class="image" />
                  <div class="image-btn">
                    <div class="reload">
                      <img
                        src="@/assets/images/publish/reload.png"
                        alt=""
                        @click="pickImages"
                      />
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>

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
                <span>{{ t(opt.labelKey) }}</span>
              </div>
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
                </div>

                <div class="collection-select">
                  <div class="custom-select" :class="{ 'open': showCollectionDropdown }" @click="toggleCollectionDropdown($event)" @mouseenter="isCollectionHovered = true" @mouseleave="isCollectionHovered = false">
                    <div class="select-content" v-if="selectedCollection">
                      <img v-if="selectedCollection.cover" :src="processImageUrl(selectedCollection.cover)" alt="" class="collection-cover" />
                      <div class="select-text">
                        <span class="select-value">{{ selectedCollection.name }}</span>
                        <span class="modify-link" @click.stop="handleEditCollection">{{ t('collection.modifyCollection') }}</span>
                      </div>
                    </div>
                    <span class="select-value" v-else>{{ t('collection.noCollection') }}</span>
                    <div class="select-actions">
                      <div class="select-arrow">
                        <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                      </div>
                    </div>
                  </div>
                  <div ref="collectionDropdownRef" class="custom-dropdown" v-if="showCollectionDropdown" :class="{ 'dropdown-top': collectionDropdownPosition === 'top' }" @scroll="handleCollectionDropdownScroll">
                    <div class="collection-dropdown-item new-collection" @click="createNewCollection">
                      <span>{{ t('collection.newCollection') }}</span>
                      <img src="@/assets/images/publish/plus_icon.png" alt="Plus" />
                    </div>
                    <div class="collection-dropdown-item" v-for="(collection, index) in collections" :key="collection.id" @click="selectCollection(collection.id)" :class="{ 'selected': selectedCollection && selectedCollection.id == collection.id }">
                      <img v-if="collection.cover" :src="processImageUrl(collection.cover)" alt="" class="collection-item-cover" />
                      <span class="collection-item-title">{{ collection.title }}</span>
                    </div>
                    <!-- Loading indicator -->
                    <div v-if="isLoadingCollections" class="loading-indicator">
                      <div class="loading-spinner"></div>
                      <span>{{ t('loading') }}</span>
                    </div>
                    <!-- No more collections message - only show when there's more than one page -->
                    <div v-else-if="!hasMoreCollections && currentCollectionPage > 1" class="no-more-collections">
                      {{ t('emptyState.noMoreData') }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="collection-group" v-if="!isNoCollection">
                <label class="form-label"><b>*</b>{{ t("collection.orderInCollection") }}</label>
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

        <!-- Cover Image -->
        <!-- <div class="section">
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
        </div> -->

        <!-- Title & Description -->
        <div class="content-section">
          <div class="form-item">
            <div class="caption-container" :class="{ 'title-error': titleError }">
              <div class="label-row">
                <label class="form-label"><b>*</b>{{ t("submit.titleLabel") }}</label>
                <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
              </div>

              <div class="title-input-wrap">
                <input
                  v-model="form.title"
                  class="title-input"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :placeholder="t('submit.titlePlaceholder')"
                  @input="onTitleInput"
                />
              </div>

              <div class="label-row">
                <label class="form-label">{{ t("submit.descriptionLabel") }}</label>
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

        <div class="submit-row">
          <button class="submit" :class="!canSubmit ? 'dis' : ''" :disabled="!canSubmit || uploading" @click="onSubmit">
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

    <UploadMask :visible="isUpload" :text="uploadTxt"></UploadMask>

    <ConfirmLeaveModal :show="isShowConfirm" @cancel="confirmStay" @confirm="confirmLeave" />

    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
    />

    <!-- Cover Selection Modal -->
    <SetImageCoverModal
      v-model:visible="showCoverModal"
      :images="imageFiles.map((f) => f._url || f._preview)"
      :cover-image="projectCoverForModal || coverPreview"
      :is-canvas-generated="isCanvasGeneratedCover"
      @confirm="onCoverConfirmed"
    />

    <!-- Project View Modal -->
    <ProjectCoimcViewModal
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
      :type="2"
      @close="handleCloseCreateCollectionModal"
      @save="handleCreateCollection"
    />

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      :visible="showEditCollectionModal"
      :is-edit="editingCollectionId !== null"
      :collection-id="editingCollectionId || ''"
      :collection-name="selectedCollection?.name || ''"
      :cover-url="selectedCollection?.cover || ''"
      :description="selectedCollection?.description || ''"
      :type="1"
      @close="handleCloseEditCollectionModal"
      @save="handleEditCollectionSave"
    />

    <!-- Switch Collection Confirm Modal -->
    <SwitchCollectionModal
      :visible="showSwitchCollectionModal"
      @close="handleCloseSwitchCollectionModal"
      @confirm="handleConfirmSwitchCollection"
    />
  </div>
</template>

<script setup lang="ts" name="PublishComic">
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import SetImageCoverModal from "@/components/SetImageCoverModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import ProjectCoimcViewModal from "@/components/ProjectCoimcViewModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import CreateCollectionModal from "@/components/CreateCollectionModal.vue";
import EditCollectionModal from "@/components/EditCollectionModal.vue";
import SwitchCollectionModal from "@/components/SwitchCollectionModal.vue";
import Pagination from "@/components/Pagination.vue";

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { processImageUrl } from "@/util/utils";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import { useRoute } from "vue-router";

const isUpload = ref(false);
const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

const TITLE_MAX = 60;
const DESC_MAX = 4000;

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
const tabIndex = ref(1);
const pendingRoute = ref<{ path: string } | null>(null);
const isShowConfirm = ref(false);

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
  allowRepost: false,
});

const coverInputRef = ref<HTMLInputElement | null>(null);
const coverPreview = ref("");

const imageInputRef = ref<HTMLInputElement | null>(null);
const imageAddRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const reuploadIndex = ref<number | null>(null);
type PreviewFile = File & { _key: string; _preview: string; _url?: string };
const imageFiles = ref<PreviewFile[]>([]);
const uploading = ref(false);

const agreeTerms = ref(true);
const showConventionModal = ref(false);
const titleError = ref(false);

// Subscription prompt modal
const showSubscriptionModal = ref(false);

// Collection
const selectedCollection = ref<{ id: string | number; name: string; cover?: string; description?: string } | null>(null);
const editingCollectionId = ref<string | number | null>(null);
const showEditCollectionModal = ref(false);
const isCollectionHovered = ref(false);
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const collectionDropdownPosition = ref<'top' | 'bottom'>('bottom');
const episodeDropdownPosition = ref<'top' | 'bottom'>('bottom');
const showCreateCollectionModal = ref(false);
const showSwitchCollectionModal = ref(false);
const switchCollectionWarningShown = ref(false);
const pendingCollectionId = ref<number | null>(null);
const isCreatingNewCollection = ref(false);
const isEditingWork = ref(false);
const isNoCollection = ref(true);
const collections = ref<any[]>([]);
const selectedCollectionId = ref(''); // Keep for backward compatibility
const episodes = ref([
  { value: '1', label: '1' },
]);

// Collection pagination
const collectionDropdownRef = ref<HTMLDivElement | null>(null);
const currentCollectionPage = ref(1);
const collectionPageSize = ref(20);
const hasMoreCollections = ref(true);
const isLoadingCollections = ref(false);

const uid = localStorage.getItem("uid") || '';

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

  if (!showEpisodeDropdown.value) {
    // Calculate dropdown position based on element position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 300; // Estimated dropdown height

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > windowHeight) {
        // Not enough space below, show above
        episodeDropdownPosition.value = 'top';
      } else {
        // Enough space below, show normally
        episodeDropdownPosition.value = 'bottom';
      }
    }
  }

  showEpisodeDropdown.value = !showEpisodeDropdown.value;
  showCollectionDropdown.value = false;
}

function createNewCollection() {
  if (selectedCollection.value) {
    pendingCollectionId.value = null;
    isCreatingNewCollection.value = true;
    showSwitchCollectionModal.value = true;
    showCollectionDropdown.value = false;
  } else {
    editingCollectionId.value = null;
    showEditCollectionModal.value = true;
  }
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
        ...selectedCollection.value,
        cover: collection.cover || selectedCollection.value.cover,
        description: collection.description || selectedCollection.value.description
      };
    }
  } else {
    editingCollectionId.value = null;
  }

  showEditCollectionModal.value = true;
}

function handleCloseEditCollectionModal() {
  showEditCollectionModal.value = false;
}

async function selectCollection(id: number) {
  // Check if we need to show warning before switching collection
  if (isEditingWork.value && !switchCollectionWarningShown.value && selectedCollectionId.value && selectedCollectionId.value !== id.toString()) {
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
    selectedCollection.value = {
      id: collection.id,
      name: collection.title,
      cover: collection.cover,
      description: collection.description
    };

    try {
      // Request collection details to get the current chapter count
      const response = await api.singleCollectionIndex(id) as any;
      if (response.code == 0 && response.data) {
        const allnums = response.data.count || 0;
        const defaultEpisode = allnums + 1;

        selectedEpisodeNumber.value = defaultEpisode.toString();

        // Update episodes array based on collection chapters
        episodes.value = [];
        // 先添加已有的集
        if (response.data.chapters && response.data.chapters.length > 0) {
          response.data.chapters.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: (index + 1).toString()
            });
          });
        }
        // 添加新的一集
        episodes.value.push({
          value: defaultEpisode.toString(),
          label: defaultEpisode.toString()
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
      // 先添加已有的集
      if (collection.chapters && collection.chapters.length > 0) {
        collection.chapters.forEach((chapter: any, index: number) => {
          episodes.value.push({
            value: (index + 1).toString(),
            label: (index + 1).toString()
          });
        });
      }
      // 添加新的一集
      episodes.value.push({
        value: defaultEpisode.toString(),
        label: defaultEpisode.toString()
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

function handleCloseSwitchCollectionModal() {
  showSwitchCollectionModal.value = false;
  pendingCollectionId.value = null;
  isCreatingNewCollection.value = false;
}

async function handleConfirmSwitchCollection() {
  switchCollectionWarningShown.value = true;
  showSwitchCollectionModal.value = false;

  await new Promise(resolve => setTimeout(resolve, 100));

  if (pendingCollectionId.value !== null) {
    await doSelectCollection(pendingCollectionId.value);
    pendingCollectionId.value = null;
  } else if (isCreatingNewCollection.value) {
    isCreatingNewCollection.value = false;
    editingCollectionId.value = null;
    showEditCollectionModal.value = true;
  }
}

function selectEpisode(value: string) {
  selectedEpisodeNumber.value = value;
  // Also update selectedEpisode to match the selected episode number
  selectedEpisode.value = parseInt(value);
  showEpisodeDropdown.value = false;
}

function getEpisodeLabel(value: string) {
  const episode = episodes.value.find(ep => ep.value === value);
  return episode ? episode.label : '1';
}

// Fetch collections
async function fetchCollections(loadMore = false) {
  if (isLoadingCollections.value || (!loadMore && !hasMoreCollections.value)) return;

  isLoadingCollections.value = true;

  try {
    const page = loadMore ? currentCollectionPage.value + 1 : 1;
    const response = await api.getCollection(1, page, collectionPageSize.value, uid) as any;

    if (response.code == 0) {
      const newCollections = response.data?.data || [];

      if (loadMore) {
        collections.value = [...collections.value, ...newCollections];
        currentCollectionPage.value = page;
      } else {
        collections.value = newCollections;
        currentCollectionPage.value = 1;
      }

      // 检查是否有更多合集
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
  // 刷新合集列表
  await fetchCollections(false);
  // 查找并设置新创建的合集
  const newCollection = collections.value.find(c => c.title === collection.name);
  if (newCollection) {
    selectedCollection.value = {
      id: newCollection.id,
      name: newCollection.title,
      cover: newCollection.cover,
      description: newCollection.description
    };
  }
  // 保持当前章节号，不重置为第一集
  // 关闭弹窗
  showCreateCollectionModal.value = false;
  // 设置isNoCollection为false，因为用户选择了一个合集
  isNoCollection.value = false;
}

function handleCloseCreateCollectionModal() {
  showCreateCollectionModal.value = false;
}

function handleEditCollectionSave(updatedCollection: { id: string | number; name: string; cover?: string; description?: string }) {
  if (selectedCollection.value) {
    selectedCollection.value = {
      ...selectedCollection.value,
      ...updatedCollection
    };
  }
  showEditCollectionModal.value = false;
}

// Chapter dropdown functions
function toggleChapterDropdown(event: Event) {
  event.stopPropagation();

  if (!showChapterDropdown.value) {
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
          chapterDropdownPosition.value = 'top';
        } else {
          // Not enough space above either, show below but limit height
          chapterDropdownPosition.value = 'bottom';
        }
      } else {
        // Enough space below, show normally
        chapterDropdownPosition.value = 'bottom';
      }
    } else {
      // Default to bottom if target is not available
      chapterDropdownPosition.value = 'bottom';
    }
  }

  showChapterDropdown.value = !showChapterDropdown.value;
}

function getChapterLabel(chapterNumber: number | null) {
  if (!chapterNumber || !selectedProject.value?.chapters) return '';
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === chapterNumber);
  if (!chapter) return '';
  return t('chapter', { chapter: chapterNumber });
}

function selectChapter(chapter: any) {
  selectedEpisode.value = chapter.chapter;
  selectedModalEpisode.value = chapter.chapter;
  showChapterDropdown.value = false;
}

// Cover selection state
const showCoverModal = ref(false);
const selectedCoverIndex = ref<number | null>(null);
const isCanvasGeneratedCover = ref(false);
const projectCoverForModal = ref<string>('');

// Sensitive content state
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");

// Caption state
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);

// Check if in edit mode
const route = useRoute();
const isEditMode = ref(route.query.edit === "1");
const postId = ref(route.query.post_id as string);
const chapterIdForPublish = ref<number | null>(null);

// UI state
const showFullContent = ref(false);

const userRegion = ref(false);
const hasActiveSubscription = ref(false);
const isAdult = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

// Upload options
const activeTab = ref('comic');
const uploadOption = ref('history');

// Upload options for v-for
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
const isLoadingProjects = ref(true);

// Pagination
const currentPage = ref(1);
const totalProjects = ref(1000); // Example total, should be set based on API response
const pageSize = ref(8);

// Episode selection
const totalEpisodes = ref(10);
const selectedEpisode = ref<number | null>(null);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(null);

// Project details cache
const projectDetailsCache = ref<Record<string, any>>({});

// Chapter dropdown
const showChapterDropdown = ref(false);
const chapterDropdownPosition = ref<'top' | 'bottom'>('bottom');

// Preview modal project (separate from selected project)
const previewProject = ref<any>(null);
const previewModalEpisode = ref<number | null>(null);

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
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number; align?: 'right' }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);

const uploadTxt = ref("");

const canSubmit = computed(() => {
  return imageFiles.value.length > 0 && coverPreview.value;
});

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
    }
  ];
});

function goBack() {
  const hasData =
    form.value.title.trim().length > 0 ||
    captionLength.value > 0 ||
    coverPreview.value !== "" ||
    imageFiles.value.length > 0;

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
  if (tabIndex.value == index) {
    return false;
  }

  const hasData =
    form.value.title.trim().length > 0 ||
    captionLength.value > 0 ||
    coverPreview.value !== "" ||
    imageFiles.value.length > 0;

  if (hasData) {
    pendingRoute.value = item;
    isShowConfirm.value = true;
    return;
  }

  tabIndex.value = index;
  router.replace(item.path);
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

function handleUserInfoLoaded(userInfo: any) {
  if (userInfo) {
    isAdult.value = userInfo.is_adult == 1;
  }
}

async function handlePermissionChange(permission: string, index: number) {
  if (index == 1 && !hasActiveSubscription.value) {
    showSubscriptionModal.value = true;
    return;
  }

  form.value.permission = permission;
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

function pickImages() {
  if (imageFiles.value.length >= 12) {
    toast(t("submit.image.uploadTip"));
    return;
  }
  if (imageAddRef.value) {
    imageAddRef.value.click();
  } else {
    imageInputRef.value?.click();
  }
}

function onImagesPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);

  input.value = "";

  appendFiles(files);
}

function isImageCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width === 0 || img.height === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

function onDragOver() {}

function onDropImages(e: DragEvent) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  const files = Array.from(e.dataTransfer?.files ?? []);

  if (files.length > 1) {
    toast(t("submit.image.multiSelectError"));
    return;
  }

  appendFiles(files.slice(0, 1));
}

async function appendFiles(files: File[]) {
  const maxCount = 12;
  const maxSize = 10 * 1024 * 1024;
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  for (const f of files) {
    if (imageFiles.value.length >= maxCount) {
      toast(t("submit.image.uploadTip"));
      break;
    }
    if (!validImageTypes.includes(f.type)) {
      toast(t("home.error.invalidPhotoFormat"));
      continue;
    }
    if (f.size > maxSize) {
      toast(t("home.error.maxPhotoSize", { max: 10 }));
      continue;
    }

    const corrupted = await isImageCorrupted(f);
    if (corrupted) {
      toast(t("home.error.corruptedImage"));
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
    return false;
  }

  if (pf) {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(pf.type)) {
      toast(t("home.error.invalidPhotoFormat"));
      return false;
    }

    isUpload.value = true;

    const formData = new FormData();
    formData.append("file", pf);

    const authHeaders = window.AntiCrawler.generateAuthParams(token);

    const parma = {
      method: "POST",
      headers: {
        token: token,
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

          // Add to array only after successful upload
          imageFiles.value.push(pf);

          // Set first image as cover by default
          if (imageFiles.value.length === 1) {
            coverPreview.value = pf._url || pf._preview;
            selectedCoverIndex.value = 0;
          }

          // Show full content after successful upload
          showFullContent.value = true;

          isUpload.value = false;
        } else {
          toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
          isUpload.value = false;
        }
      })
      .catch((error: unknown) => {
        toast(String(error));
        isUpload.value = false;
      });
  }
}

function reloadImage(idx: number) {
  reuploadIndex.value = idx;
  reuploadInputRef.value?.click();
}

async function onReuploadPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  input.value = "";
  if (reuploadIndex.value === null || !file) return;

  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    toast(t("home.error.invalidPhotoFormat"));
    return false;
  }
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    toast(t("home.error.maxPhotoSize", { max: 10 }));
    return false;
  }

  const corrupted = await isImageCorrupted(file);
  if (corrupted) {
    toast(t("home.error.corruptedImage"));
    return false;
  }
  isUpload.value = true;
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
  fetch(baseUrl + "user/uploadImage", parma)
    .then((response) => response.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const idx = reuploadIndex.value as number;
        const old = imageFiles.value[idx];
        URL.revokeObjectURL(old._preview);
        const pf = file as PreviewFile;
        pf._key = `${Date.now()}_${Math.random()}`;
        pf._preview = URL.createObjectURL(file);
        const url = (res?.data && (res.data.url || res.data)) || res?.url;
        if (typeof url === "string") {
          pf._url = url;
        }
        imageFiles.value.splice(idx, 1, pf);
        isUpload.value = false;
        reuploadIndex.value = null;

        // Update cover if the reuploaded image was the cover
        if (idx === selectedCoverIndex.value) {
          coverPreview.value = pf._preview;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      isUpload.value = false;
    });
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

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  form.value.content = "yes";
  showSensitiveConfirm.value = false;
}

function removeImage(idx: number) {
  const pf = imageFiles.value[idx];
  URL.revokeObjectURL(pf._preview);
  imageFiles.value.splice(idx, 1);
  if (coverPreview.value && idx === selectedCoverIndex.value) {
    coverPreview.value = imageFiles.value.length > 0 ? imageFiles.value[0]._preview : "";
    selectedCoverIndex.value = imageFiles.value.length > 0 ? 0 : null;
  }
}

function onTitleInput() {
  if (titleError.value && form.value.title.trim()) {
    titleError.value = false;
  }
}

function openCoverModal() {
  if (imageFiles.value.length > 0) {
    showCoverModal.value = true;
  }
}

function selectCover(index: number) {
  selectedCoverIndex.value = index;
}

function onCoverConfirmed(coverUrl: string) {
  // Reset canvas-generated flag since user confirmed a new cover selection
  isCanvasGeneratedCover.value = false;
  isUpload.value = true;

  const token = localStorage.getItem("token");
  if (!token) {
    isUpload.value = false;
    return;
  }

  // Convert data URL to Blob
  fetch(coverUrl)
    .then((response) => response.blob())
    .then((blob) => {
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

      return fetch(baseUrl + "user/uploadImage", parma);
    })
    .then((response) => response.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const url = (res?.data && (res.data.url || res.data)) || res?.url;
        if (typeof url === "string") {
          coverPreview.value = url;
        }
        isUpload.value = false;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
        coverPreview.value = coverUrl;
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      coverPreview.value = coverUrl;
      isUpload.value = false;
    });
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

// Caption functions
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

// Direct search without debounce (for button clicks)
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

  // 点击时，只有光标正好在 # 或 @ 后面才显示下拉框
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
        const hasApostrophes = tagContent.includes("'") || tagContent.includes('"');

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
              toast(t('submit.video.toastTopicLimit'));
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
              toast(t('submit.video.toastTopicLimit'));
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

  // 处理右边溢出，调整 left 位置
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

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  // Check topic limit
  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      toast(t("submit.video.toastTopicLimit"));
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

async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  if (!form.value.title.trim()) {
    toast(t("submit.titleRequired"));
    titleError.value = true;
    return;
  }

  if (!imageFiles.value.length) {
    toast(t("submit.image.uploadFirst"));
    return;
  }
  if (!coverPreview.value) {
    toast(t("submit.image.setCover"));
    return;
  }
  if (!selectedCollection.value) {
    toast(t("collection.noCollection"));
    return;
  }
  if (!selectedEpisodeNumber.value) {
    toast(t("collection.enterEpisode"));
    return;
  }
  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  uploadTxt.value = t("submit.publishing");
  isUpload.value = true;

  // Get session_id and index from route query or selectedProject
  const session_id = route.query.session_id as string || (selectedProject.value?.session_id as string);
  const index = route.query.index as string;

  const payload = {
    type: 1,
    title: form.value.title.trim(),
    cover: coverPreview.value,
    content: form.value.description.trim(),
    is_nsfw: form.value.content == "yes" ? 1 : 0,
    access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
    image_urls: imageFiles.value.filter(f => f._url).map((f) => f._url!),
    book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
    chapter_index: selectedCollection.value ? parseInt(selectedEpisodeNumber.value) : 0,
    cover_color: '',
    cover_title: '',
    ...(session_id ? { session_id } : {}),
    ...(chapterIdForPublish.value ? { ai_chapter_index: chapterIdForPublish.value } : (index ? { ai_chapter_index: parseInt(index) } : {})),
    ...(isEditMode && { post_id: postId.value })
  };

  try {
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
      toast(t("success"));
      router.push(`/publish/success?type=${1}`);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("fail"));
  } finally {
    isUpload.value = false;
    uploadTxt.value = '';
  }
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
  } else {
    router.go(-1);
  }
}

// Community Convention Modal methods
function closeConventionModal() {
  showConventionModal.value = false;
}

function confirmConvention() {
  showConventionModal.value = false;
  agreeTerms.value = true;
  // Re-trigger submit after confirming
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

// Project list methods
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = await api.getProject(0, 'manhua', currentPage.value, 12, 1) as any;
    if (response.code !== 200) {
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

  // Check if project details are in cache
  if (projectDetailsCache.value[project.session_id]) {
    // Use cached project details
    const cachedProject = projectDetailsCache.value[project.session_id];
    Object.assign(project, cachedProject);

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

    // Reset collection state - no auto collection lookup
    selectedCollection.value = null;
    isNoCollection.value = true;
    episodes.value = [];
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

        // If there are chapters, set default episode to the first one
        if (project.chapters.length > 0) {
          selectedEpisode.value = project.chapters[0].chapter;
          selectedModalEpisode.value = project.chapters[0].chapter;
        }
      }

      // Reset collection state - no auto collection lookup
      selectedCollection.value = null;
      isNoCollection.value = true;
      episodes.value = [];
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }
}

// Handle collection creation/selection from project name
async function handleCollectionFromProjectName(projectName: string) {
  try {
    // Search for collection by title
    const searchRes = await api.searchCollection({ title: projectName, type: 1 }) as any;

    if (searchRes.code == 0) {
      const book_id = searchRes.data?.book_id || 0;

      if (book_id == 0) {
        // Create new collection with cover and default description
        const createRes = await api.addCollection({
          title: projectName,
          type: 1,
          cover: coverPreview.value || '',
          description: t('collectionSettings.sampleDescription')
        }) as any;

        if (createRes.code === 0 && createRes.data?.id) {
          selectedCollection.value = {
            id: createRes.data.id,
            name: projectName,
            cover: coverPreview.value || '',
            description: ''
          };
          isNoCollection.value = false;
        }
      } else {
        // Get collection details to determine episode number
        const collectionRes = await api.singleCollectionIndex(book_id) as any;

        if (collectionRes.code == 0 && collectionRes.data) {
          const allnums = collectionRes.data.count || 0;
          const episodeNumber = parseInt(allnums) + 1;
          const collectionCover = searchRes.data?.book_info?.cover || '';

          selectedCollection.value = {
            id: book_id,
            name: projectName,
            cover: collectionCover,
            description: searchRes.data?.book_info?.description || ''
          };
          isNoCollection.value = false;
          selectedEpisodeNumber.value = episodeNumber.toString();

          // Update episodes array to include up to the current episode number
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
    console.error('Error handling collection from project name:', error);
  }
}

function decreaseEpisode() {
  // Get unpublished chapters
  const unpublishedChapters = selectedProject.value?.chapters?.filter((chapter: any) => chapter.is_publish == 2) || [];
  if (unpublishedChapters.length == 0) {
    toast(t('submit.image.noUnpublishedChapters'));
    return;
  }

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
  if (unpublishedChapters.length == 0) {
    toast(t('submit.image.noUnpublishedChapters'));
    return;
  }

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

// Modal methods
async function openViewModal(project: any) {
  previewProject.value = project;
  previewModalEpisode.value = null;

  // Request project details to get chapters array
  try {
    const res = await api.detailProject(project.session_id) as any;
    if (res.code === 200 && res.data) {
      // Update project with details
      Object.assign(project, res.data);

      // Sort chapters by chapter number
      if (project.chapters && project.chapters.length > 0) {
        project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);
        previewModalEpisode.value = project.chapters[0].chapter;
      }
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
  // Scroll to publish section when clicking publish button
  nextTick(() => {
    const publishSection = document.querySelector('.publish-section');
    if (publishSection) {
      publishSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  });

  // Check if publishData is provided (from modal) or if we're handling a direct click
  let project: any, episode: any;

  if (publishData && typeof publishData == 'object' && publishData.project) {
    // From modal: use the provided data
    project = publishData.project;
    episode = publishData.episode;
  } else {
    // Direct click: use selectedProject and selectedEpisode
    project = selectedProject.value;
    episode = selectedEpisode.value;
  }

  if (!project) {
    toast(t('submit.image.selectComicFirst'));
    return;
  }

  if (!episode) {
    toast(t('submit.image.selectEpisode'));
    return;
  }

  const episodeText = t('submit.image.episode', { episode });

  // 请求集详情接口获取图片和标题
  let episodeImages: string[] = [];
  let chapterCover: string = '';
  let episodeTitle = '';
  let episodeDescription = '';

  try {
    const chapterResponse = await api.detailChapter(project.session_id, episode) as any;
    if (chapterResponse.code == 200 && chapterResponse.data) {
      const chapterData = chapterResponse.data;
      // 从集详情中获取图片
      if (chapterData.result_async?.final_images) {
        episodeImages = chapterData.result_async.final_images;
      }

      // 从集详情中获取封面
      if (project.result_async?.generate_manhua_cover) {
        chapterCover = project.result_async.generate_manhua_cover;
        // Mark as canvas-generated so it won't be auto-selected in modal
        isCanvasGeneratedCover.value = true;
      }

      // 从集详情中获取标题
      if (chapterData.title) {
        episodeTitle = chapterData.title;
      }

      // Get description from chapter data
      if (chapterData.chapter_description) {
        episodeDescription = chapterData.chapter_description;
      }
    }
  } catch (error) {
    console.error('Error fetching chapter detail:', error);
  }

  // 如果从集详情中没有获取到标题，尝试从项目的大纲中获取
  if (!episodeTitle && project.result_async?.generate_manhua_outline?.outline) {
    const outline = project.result_async.generate_manhua_outline.outline;
    const currentEpisode = outline.find((item: any) => item.chapter === episode);
    if (currentEpisode?.title) {
      episodeTitle = currentEpisode.title;
    }
  }

  // 生成标题：第几集 集的标题 (不带书名)
  if (episodeTitle) {
    form.value.title = `${episodeText} ${episodeTitle}`;
  } else {
    form.value.title = episodeText;
  }

  // Store episode for publish
  chapterIdForPublish.value = episode;

  // 如果没有从集详情中获取到图片，尝试从项目的 result_async 中获取
  if (episodeImages.length == 0) {
    // 尝试从不同的数据源获取图片
    if (project.result_async?.final_images) {
      // 如果有 final_images，使用它
      episodeImages = project.result_async.final_images;
    } else if (project.result_async?.images) {
      // 如果有 images，使用它
      episodeImages = project.result_async.images;
    }
  }

  // 如果没有找到封面，尝试从项目的 result_async 中获取
  if (!chapterCover) {
    if (project.result_async?.generate_manhua_cover) {
      chapterCover = project.result_async.generate_manhua_cover;
    }
  }

  // 清空现有的图片数组
  imageFiles.value = [];

  // 将集数图片添加到图片数组中
  episodeImages.forEach((imageUrl, index) => {
    const mockFile = {
      _key: `${Date.now()}_${index}`,
      _preview: imageUrl,
      _url: imageUrl
    } as PreviewFile;
    imageFiles.value.push(mockFile);
  });

  // 设置封面
  if (chapterCover) {
    // 优先使用章节详情中的封面
    coverPreview.value = chapterCover;
  } else if (imageFiles.value.length > 0) {
    // 其次使用第一张图片作为封面
    coverPreview.value = imageFiles.value[0]._url || imageFiles.value[0]._preview;
  }

  // Handle collection logic based on the project name
  if (project.name) {
    try {
      // Search for collection by title
      const searchRes = await api.searchCollection({ title: project.name, type: 1 }) as any;

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          // Create new collection with cover and default description
          const createRes = await api.addCollection({
            title: project.name,
            type: 1,
            cover: project.result_async.generate_manhua_cover || '',
            description: t('collectionSettings.sampleDescription')
          }) as any;

          if (createRes.code == 0) {
            selectedCollection.value = {
              id: createRes.data.book_id,
              name: project.name,
              cover: project.result_async.generate_manhua_cover || '',
              description: t('collectionSettings.sampleDescription')
            };
            isNoCollection.value = false;
          }
        } else {
          // Get collection details to determine episode number
          const collectionRes = await api.singleCollectionIndex(book_id) as any;

          if (collectionRes.code === 0 && collectionRes.data) {
            const allnums = collectionRes.data.count || 0;
            const episodeNumber = parseInt(allnums) + 1;
            const collectionCover = searchRes.data?.book_info?.cover || '';

            selectedCollection.value = {
              id: book_id,
              name: project.name,
              cover: collectionCover,
              description: searchRes.data?.book_info?.description || ''
            };
            isNoCollection.value = false;
            selectedEpisodeNumber.value = episodeNumber.toString();

            // Update episodes array to include up to the current episode number
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

  // 切换到本地上传标签页，显示有图片的块
  uploadOption.value = 'local';

  // 显示发布表单
  showFullContent.value = true;

  // 关闭模态框
  showViewModal.value = false;

  // Set description (moved here after showFullContent is true)
  if (episodeDescription) {
    form.value.description = episodeDescription;
    nextTick(() => {
      if (captionRef.value) {
        captionRef.value.innerText = episodeDescription;
      }
    });
  }
}

// Get post details for editing
async function getPostDetails() {
  if (!postId.value) return;

  try {
    const res = await api.modifyPostDetail(postId.value);
    const data = res as any;
    if (data.code == 0 || data.code == 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights == '2' ? "partial" : postData.access_rights == '3' ? "private" : "public";
      form.value.content = postData.is_nsfw == '1' ? "yes" : "no";
      coverPreview.value = postData.cover || "";

      // If there's a session_id from post data, fetch project details to get the cover
      const sessionIdFromPost = postData.session_id;
      if (sessionIdFromPost) {
        try {
          const projectRes = await api.detailProject(sessionIdFromPost) as any;
          if (projectRes.code == 200 && projectRes.data) {
            const projectData = projectRes.data;
            // Get the project cover
            const projectCover = projectData.result_async?.generate_manhua_cover;
            if (projectCover) {
              // Store project cover for cover modal
              projectCoverForModal.value = projectCover;
            }
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
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

      // Handle images for edit mode
      if (res.data.images && Array.isArray(res.data.images)) {
        for (const url of res.data.images) {
          // Create a mock file object for existing images
          const mockFile = new File([], "existing_image.jpg", { type: "image/jpeg" }) as PreviewFile;
          mockFile._key = `${Date.now()}_${Math.random()}`;
          mockFile._preview = url.image_url;
          mockFile._url = url.image_url;
          imageFiles.value.push(mockFile);
        }

        if (!coverPreview.value) {
          coverPreview.value = imageFiles.value[0]._url || imageFiles.value[0]._preview;
        }
      }

      // Set selected collection from book_title
      if (postData.book_title) {
        selectedCollection.value = {
          id: postData.book_id || 0,
          name: postData.book_title,
          cover: data.data?.book_info?.cover,
          description: data.data?.book_info?.description,
        };
        isNoCollection.value = false;

        // Set chapter index from postData
        if (postData.chapter_index) {
          const chapterIndex = postData.chapter_index;
          selectedEpisodeNumber.value = chapterIndex.toString();

          // If there's a book_id, request collection details to get complete episode list
          if (postData.book_id) {
            try {
              const collectionRes = await api.singleCollectionIndex(postData.book_id) as any;
              if (collectionRes.code == 0 && collectionRes.data) {
                const allnum = collectionRes.data.count || 0;
                const totalEpisodes = parseInt(allnum);

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
              episodes.value = [];
              for (let i = 1; i <= chapterIndex; i++) {
                episodes.value.push({
                  value: i.toString(),
                  label: i.toString()
                });
              }
            }
          } else {
            // Update episodes array
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
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    console.error("Get post details error:", error);
    toast(t('fail'));
  }
}

// Watch currentPage change to fetch projects
watch(currentPage, () => {
  fetchProjects();
});

// Watch route changes to update tabIndex
watch(() => route.path, (newPath) => {
  const tab = tabList.value.find(t => t.path === newPath);
  if (tab) {
    const index = tabList.value.indexOf(tab);
    tabIndex.value = index;
  }
});

// Lifecycle hooks
onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  getCountry();
  await checkSubscriptionStatus(); // Check subscription status on page load
  // Get post details if postId exists
  if (postId.value) {
    getPostDetails();
  } else {
    // Check if session_id and index are provided
    const session_id = route.query.session_id as string;
    const index = route.query.index as string;
    const cover = route.query.cover as string;
    const title = route.query.title as string;

    if (session_id && index) {
      // Request chapter detail interface
      try {
        // Request project details to get the cover
        try {
          const projectRes = await api.detailProject(session_id) as any;
          if (projectRes.code == 200 && projectRes.data) {
            const projectData = projectRes.data;
            // Get the project cover
            const projectCover = projectData.result_async?.generate_manhua_cover;
            if (projectCover) {
              // Store project cover for cover modal
              projectCoverForModal.value = projectCover;
            }
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
        }

        const chapterResponse = await api.detailChapter(session_id, parseInt(index)) as any;
        if (chapterResponse.code === 200 && chapterResponse.data) {
          const chapterData = chapterResponse.data;

          // Extract images
          let episodeImages: string[] = [];
          if (chapterData.final_images) {
            episodeImages = chapterData.final_images;
          } else if (chapterData.images) {
            episodeImages = chapterData.images;
          } else if (chapterData.result_async?.final_images) {
            episodeImages = chapterData.result_async.final_images;
          } else if (chapterData.result_async?.images) {
            episodeImages = chapterData.result_async.images;
          }

          // Extract cover - prioritize URL parameter, then chapter data
          let chapterCover = '';
          if (cover) {
            chapterCover = cover;
          } else if (chapterData.cover) {
            chapterCover = chapterData.cover;
          } else if (chapterData.result_async?.cover) {
            chapterCover = chapterData.result_async.cover;
          }

          // Extract title
          let episodeTitle = '';
          if (chapterData.title) {
            episodeTitle = chapterData.title;
          }

          // Extract description
          let episodeDescription = '';
          if (chapterData.chapter_description) {
            episodeDescription = chapterData.chapter_description;
          }

          // Generate title
          const episodeText = t('submit.image.episode', { episode: index });
          if (episodeTitle) {
            if (title) {
              form.value.title = `${episodeText} ${episodeTitle} 「${title}」`;
            } else {
              form.value.title = `${episodeText} ${episodeTitle}`;
            }
          } else {
            if (title) {
              form.value.title = `${episodeText} 「${title}」`;
            } else {
              form.value.title = episodeText;
            }
          }

          // 将集数图片添加到图片数组中
          imageFiles.value = [];
          episodeImages.forEach((imageUrl, index) => {
            const mockFile = {
              _key: `${Date.now()}_${index}`,
              _preview: imageUrl,
              _url: imageUrl
            } as PreviewFile;
            imageFiles.value.push(mockFile);
          });

          // 设置封面
          if (chapterCover) {
            coverPreview.value = chapterCover;
          } else if (imageFiles.value.length > 0) {
            coverPreview.value = imageFiles.value[0]._url || imageFiles.value[0]._preview;
          }

          // Show publish form
          showFullContent.value = true;

          // Set description
          if (episodeDescription) {
            form.value.description = episodeDescription;
            nextTick(() => {
              if (captionRef.value) {
                captionRef.value.innerText = episodeDescription;
              }
            });
          }

          // Handle collection logic if title is provided
          if (title) {
            try {
              // Search for collection by title
              const searchRes = await api.searchCollection({ title, type: 1 }) as any;

              if (searchRes.code == 0) {
                const book_id = searchRes.data?.book_id || 0;

                if (book_id == 0) {
                  // Create new collection
                  const createRes = await api.addCollection({
                    title,
                    type: 1,
                    cover: coverPreview.value || '',
                    description: t('collectionSettings.sampleDescription')
                  }) as any;

                  if (createRes.code == 0 && createRes.data?.book_id) {
                    selectedCollection.value = {
                      id: createRes.data.book_id,
                      name: title,
                      cover: coverPreview.value || '',
                      description: t('collectionSettings.sampleDescription')
                    };
                    selectedEpisodeNumber.value = '1';
                    isNoCollection.value = false;
                  }
                } else {
                  // Get collection details to determine episode number
                  const collectionRes = await api.singleCollectionIndex(book_id) as any;

                  if (collectionRes.code == 0 && collectionRes.data) {
                    // Get the total chapter count from the response
                    const allnum = collectionRes.data.count || 0;
                    const episodeNumber = parseInt(allnum) + 1;
                    const collectionCover = searchRes.data?.book_info?.cover || '';

                    selectedCollection.value = {
                      id: book_id,
                      name: title,
                      cover: collectionCover,
                      description: searchRes.data?.book_info?.description || ''
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
        }
      } catch (error) {
        console.error('Error handling session_id and index:', error);
        // If error, fall back to fetching projects
        await fetchProjects();
      }
    } else {
      // Fetch projects for comic tab
      await fetchProjects();
    }
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  // Clean up object URLs to prevent memory leaks
  imageFiles.value.forEach((file) => {
    if (file._preview && !file._url) {
      URL.revokeObjectURL(file._preview);
    }
  });
});
</script>

<style lang="scss" scoped>
 @use '@/scss/Comic.scss';
</style>
