<template>
  <div class="submit-video" :class="uploadSuccess || postId || isBatchPublish ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/publish/back.png" alt="" v-if="uploadSuccess" />
        <img src="@/assets/images/base/back.png" alt="" v-else />
      </div>

      <div class="tabs" :class="(uploadSuccess || postId || isBatchPublish) ? 'on' : ''">
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
              <div class="chapter-lists-container">
                <div v-if="unpublishedChapters.length > 0" class="pending-section">
                  <div class="pending-header">
                    <span class="pending-label">{{ t('submit.video.pendingEpisodes') }}</span>
                    <button class="select-all-btn" @click="toggleSelectAllChapters">
                      <span class="select-all-text">{{ t('submit.video.selectAllEpisodes', { count: unpublishedChapters.length }) }}</span>
                      <img
                        class="select-all-checkbox"
                        :src="isAllChaptersSelected ? checkboxActive : checkboxInactive"
                        alt=""
                      />
                    </button>
                  </div>
                  <div class="pending-chapters-list">
                    <div
                      v-for="(chapter, index) in unpublishedChapters"
                      :key="'pending-' + chapter.chapter"
                      class="pending-chapter-item"
                      :class="{ selected: selectedChapters.includes(chapter.chapter) }"
                      @click="toggleChapterSelection(chapter.chapter)"
                    >
                      <span class="chapter-name">{{ t('submit.video.episode', { episode: chapter.chapter }) }} {{ chapter.title }}</span>
                      <div class="chapter-status-wrap">
                        <span class="chapter-status-text">{{ t('submit.video.pendingEpisode') }}</span>
                        <img
                          class="chapter-checkbox"
                          :src="selectedChapters.includes(chapter.chapter) ? checkboxActive : checkboxInactive"
                          alt=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="publishedChapters.length > 0" class="published-section">
                  <div class="published-header">
                    <span class="published-tab-label">{{ t('submit.video.publishedEpisodes') }}</span>
                    <span class="published-count-info">{{ t('submit.video.publishedEpisodeCount', { count: publishedChapters.length }) }}</span>
                  </div>
                  <div class="published-chapters-list">
                    <div
                      v-for="(chapter, index) in publishedChapters"
                      :key="'published-' + chapter.chapter"
                      class="published-chapter-item"
                    >
                      <span class="chapter-name">{{ t('submit.video.episode', { episode: chapter.chapter }) }} {{ chapter.title }}</span>
                      <span class="chapter-status-text published">{{ t('novel.published') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Publish Button -->
            <div class="publish-section">
              <button
                class="publish-btn"
                :class="selectedChapters.length > 0 ? 'active' : 'disabled'"
                @click="handlePublishFromSelection"
                :disabled="selectedChapters.length === 0"
              >
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
        </div>
      </div>

      <!-- Batch Publish Loading -->
      <div v-if="isLoadingBatchPublish" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ t('home.loading') }}</div>
      </div>

      <div class="content-wrapper" v-if="uploadSuccess || postId || shouldShowSessionContent">

        <!-- Single mode: video status + permission -->
        <div v-if="!isBatchPublish" class="section">

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
                    <span class="video-meta" v-if="(uploadSuccess || uploadError || isUpload) && !postId && !route.query.url && !route.query.session_id && !selectedProject">
                      {{ t("submit.video.size") }}:
                      {{ videoSize }}MB {{ t("submit.video.duration") }}:{{ videoDuration }}s
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
              accept="video/mp4,video/quicktime"
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

        <!-- Batch mode: collection + batch settings in one white container -->
        <div v-if="isBatchPublish" class="batch-collection-perm-wrapper">
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

                    <span v-if="publishedChapters.length > 0" class="batch-published-info">{{ t('novel.batchPublish.publishedInCollection', { count: publishedChapters.length }) }}</span>

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
                          <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
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
              </div>
            </div>
          </div>

          <div class="batch-perm-settings">
            <span class="batch-perm-title">{{ t('novel.batchPublish.batchSettings') }}</span>
            <div class="batch-perm-options">
              <div
                class="perm-option"
                v-for="(opt, index) in batchPermOptions"
                :key="opt.key"
                @click="handleBatchPermissionChange(opt.key, index)"
              >
                <img :src="batchPermission === opt.key ? selectActive : select" alt="" />
                <span v-if="opt.key === 'partial'">
                  {{ t('novel.batchPublish.partialStart') }}
                  <span class="partial-chapter-inline-select" @click.stop="handleInlineChapterSelect($event)">
                    <input
                      type="number"
                      class="partial-chapter-inline-input"
                      v-model.number="batchPartialStartChapter"
                      @click.stop
                      :min="1"
                    />
                    <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                    <div v-if="showBatchChapterDropdown && batchPermission === 'partial'" class="partial-chapter-dropdown">
                      <div
                        v-for="ch in batchCollectionChapterList"
                        :key="ch"
                        class="partial-chapter-dropdown-item"
                        :class="{ selected: batchPartialStartChapter === ch }"
                        @click.stop="selectBatchPartialStart(ch)"
                      >
                        {{ ch }}
                      </div>
                    </div>
                  </span>
                  {{ t('novel.batchPublish.partialEnd') }}
                </span>
                <span v-else>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Batch mode: batch chapter title edit section -->
        <div v-if="isBatchPublish" class="batch-chapter-edit-section">
          <span class="batch-edit-title">{{ t('novel.batchPublish.chapterTitleEdit') }}</span>

          <div class="batch-page-tabs">
            <div
              v-for="(tab, idx) in batchPageTabs"
              :key="idx"
              class="batch-page-tab"
              :class="{ active: idx === activeBatchPage }"
              @click="activeBatchPage = idx"
            >
              <span>{{ tab }}</span>
            </div>
          </div>

          <div class="batch-chapter-list">
            <div
              v-for="chapter in batchVisibleChapters"
              :key="chapter.chapter"
              class="batch-chapter-item"
            >
              <span class="batch-chapter-label">{{ t('submit.video.episode', { episode: chapter.chapter }) }}：{{ chapter.title }}</span>
              <div class="batch-chapter-fields">
                <div class="batch-field-label">
                  <span class="required">*</span>
                  <span class="field-name">{{ t('novel.batchPublish.chapterTitleLabel') }}</span>
                </div>
                <span class="batch-char-count">({{ getBatchChapterTitleLength(chapter.chapter) }}/60)</span>
                <div class="batch-field-order">
                  <span class="order-label">{{ t('novel.batchPublish.collectionOrder') }}</span>
                  <span class="order-value">{{ getCollectionOrder(chapter.chapter) }}</span>
                </div>
              </div>
              <div class="batch-chapter-input-wrap">
                <input
                  type="text"
                  class="batch-chapter-input"
                  :value="getBatchChapterTitle(chapter.chapter)"
                  @input="updateBatchChapterTitle(chapter.chapter, $event)"
                  :placeholder="t('novel.batchPublish.chapterTitlePlaceholder')"
                  maxlength="60"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Single mode: collection-section -->
        <div v-if="!isBatchPublish" class="collection-section">
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
                        <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
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
        </div> -->

        <!-- Title & Description (single mode only) -->
        <div v-if="!isBatchPublish" class="content-section">
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

        <!-- Submit -->
        <div class="submit-row">
          <button v-if="isBatchPublish" class="submit" :disabled="isUpload" @click="onBatchPublish">
            {{ t("submit.submit") }}
          </button>
          <button v-else class="submit" @click="onSubmit">
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
    <LoadingMask :visible="isSelectionLoading" @cancel="cancelSelectionLoading" />

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

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-if="showEditCollectionModal"
      :visible="showEditCollectionModal"
      :is-edit="editingCollectionId !== null"
      :collection-id="editingCollectionId || ''"
      :collection-name="isCreateFromCollectionList ? projectNameForNewCollection : ''"
      :cover-url="isCreateFromCollectionList ? projectCoverForNewCollection : ''"
      :is-nsfw="0"
      :type="3"
      :session-id="selectedProject?.session_id || route.query.session_id || sessionId || ''"
      :story-summary="selectedProject?.result_async?.generate_novel_outline?.story_summary?.summary || ''"
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
      :type="3"
      @close="handleCloseCollectionListModal"
      @select="handleSelectCollectionCard"
      @confirm="handleSelectCollectionFromModal"
      @create="handleCreateCollectionFromModal"
    />

    <!-- Batch Publish Progress Dialog -->
    <BatchPublishProgressDialog
      :visible="showBatchPublishProgress"
      :chapters="batchPublishChapterStatuses"
      @close="showBatchPublishProgress = false"
      @complete="handleBatchPublishComplete"
    />

    <!-- Batch Publish Fail Dialog -->
    <BatchPublishFailDialog
      :visible="showBatchPublishFail"
      :chapters="batchPublishFailChapters"
      :failed-chapter="batchPublishFailedChapter"
      @close="showBatchPublishFail = false"
      @exit="handleBatchPublishExit"
      @retry="handleBatchPublishRetry"
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
import LoadingMask from "@/components/LoadingMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import ProjectVideoViewModal from "@/components/ProjectVideoViewModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import CollectionListModal from "@/components/CollectionListModal.vue";
import EditCollectionModal from "@/components/EditCollectionModal.vue";
import SwitchCollectionModal from "@/components/SwitchCollectionModal.vue";
import BatchPublishProgressDialog from "@/components/BatchPublishProgressDialog.vue";
import BatchPublishFailDialog from "@/components/BatchPublishFailDialog.vue";
import Pagination from "@/components/Pagination.vue";
import api from "@/api/index";
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { trackClickPublishButton } from "@/utils/analytics";
import router from "@/router";
import { processImageUrl } from "@/util/utils";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import checkboxActive from "@/assets/images/register/check_active.png";
import checkboxInactive from "@/assets/images/register/check.png";
import requireSwitchOn from "@/assets/images/home/open.png";
import requireSwitchOff from "@/assets/images/publish/close.png";
import { baseUrl } from "@/util/config";

const isEditing = computed(() => !!postId.value);

const { t, locale } = useI18n();

function getI18nMsg(res: any) {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: 'msg_cn', jp: 'msg_jp', tc: 'msg_tc' };
  const key = msgMap[lang];
  return (key && res?.[key]) || res?.msg || t('fail');
}

// State
const isUpload = ref(false);
const uploadSuccess = ref(false);

const isBatchRoute = computed(() => route.query.batch === 'true');
const shouldShowSessionContent = computed(() => {
  if (!route.query.session_id) return false;
  return uploadSuccess.value;
});
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
const pendingCollectionIdForSensitive = ref<number | null>(null);

const toastShow = ref(false);
const toastMsg = ref("");
const toastIcon = ref("");
const toastTheme = ref("pink");
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const titleError = ref(false);

const userRegion = ref(false);
const hasActiveSubscription = ref(false);
const isAdult = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

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
    label: 'submit.video.localUpload'
  }
];

watch(uploadOption, (newOption) => {
  if (newOption === 'history') {
    fetchProjects();
  } else if (newOption === 'local') {
    selectedProject.value = null;
    selectedProjectId.value = '';
    coverPreview.value = '';
  }
});

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
const selectedEpisode = ref<number | null>(null);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(null);

// Chapter dropdown
const showChapterDropdown = ref(false);
const chapterDropdownPosition = ref<'top' | 'bottom'>('bottom');

// Project details cache
const projectDetailsCache = ref<Record<string, any>>({});

// Preview modal project (separate from selected project)
const previewProject = ref<any>(null);

// Collection
const selectedCollection = ref<{ id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number } | null>(null);
const editingCollectionId = ref<string | number | null>(null);
const showEditCollectionModal = ref(false);
const isCollectionHovered = ref(false);
const selectedCollectionId = ref<number | ''>(''); // Keep for backward compatibility
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const collectionDropdownPosition = ref<'top' | 'bottom'>('bottom');
const episodeDropdownPosition = ref<'top' | 'bottom'>('bottom');
const showCollectionListModal = ref(false);
const collectionListSelectedId = ref<string | number | null>(null);
const isCreateFromCollectionList = ref(false);
const projectNameForNewCollection = ref('');
const projectCoverForNewCollection = ref('');
const showSwitchCollectionModal = ref(false);
const switchCollectionWarningShown = ref(false);
const pendingCollectionId = ref<number | null>(null);
const pendingCollectionData = ref<any>(null);
const isEditingWork = ref(false);
const isNoCollection = ref(true);
const collections = ref<any[]>([]);
const episodes = ref([
  { value: '1', label: '1' },
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

let isRouteInitialized = false;
watch(() => route.query, async (newQuery) => {
  if (isRouteInitialized) return;
  const sessionIdParam = newQuery.session_id as string;
  if (!sessionIdParam) return;
  const isBatch = newQuery.batch === 'true';
  const urlParam = newQuery.url as string;

  isRouteInitialized = true;

  if (isBatch) {
    isEditingWork.value = true;
    await initBatchPublish(sessionIdParam);
  } else if (urlParam) {
    const indexParam = newQuery.index as string;
    await initSingleChapter(sessionIdParam, urlParam, indexParam);
  }
}, { immediate: false });



// Check if selected chapter is already published
const isChapterPublished = computed(() => {
  if (!selectedProject.value?.chapters || !selectedEpisode.value) return false;
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === selectedEpisode.value);
  return chapter?.is_publish == 1;
});

const selectedChapters = ref<number[]>([]);
const isBatchPublish = computed(() => selectedChapters.value.length > 1);
const isLoadingBatchPublish = ref(false);

const unpublishedChapters = computed(() =>
  (selectedProject.value?.chapters || []).filter((c: any) => c.is_publish != 1)
);

const publishedChapters = computed(() =>
  (selectedProject.value?.chapters || []).filter((c: any) => c.is_publish == 1)
);

const isAllChaptersSelected = computed(() =>
  unpublishedChapters.value.length > 0 &&
  selectedChapters.value.length === unpublishedChapters.value.length
);

function toggleSelectAllChapters() {
  if (isAllChaptersSelected.value) {
    selectedChapters.value = [];
  } else {
    selectedChapters.value = unpublishedChapters.value.map((c: any) => c.chapter);
  }
}

function toggleChapterSelection(chapterNum: number) {
  const idx = selectedChapters.value.indexOf(chapterNum);
  if (idx === -1) {
    selectedChapters.value.push(chapterNum);
  } else {
    selectedChapters.value.splice(idx, 1);
  }
}

const isSelectionLoading = ref(false);
let isSelectionCancelled = false;

async function handlePublishFromSelection() {
  if (selectedChapters.value.length === 0) return;

  isSelectionLoading.value = true;
  isSelectionCancelled = false;

  if (isBatchPublish.value) {
    const targetProject = selectedProject.value;
    if (!targetProject) { isSelectionLoading.value = false; return; }

    const currentSessionId = targetProject.session_id || sessionId.value;
    if (!currentSessionId) { isSelectionLoading.value = false; return; }

    const firstChapterNum = selectedChapters.value[0];
    let firstChapterTitle = '';

    for (const chNum of selectedChapters.value) {
      if (isSelectionCancelled) {
        isSelectionLoading.value = false;
        return;
      }
      try {
        const res = await api.detailChapter(currentSessionId, chNum) as any;
        if (res.code === 200 && res.data) {
          if (res.data.is_publish === 1) {
            isSelectionLoading.value = false;
            toast(t('submit.video.episodeAlreadyPublished'));
            setTimeout(() => { location.reload(); }, 1000);
            return;
          }
          batchChapterContents.value[chNum] = res.data.chapter_description || '';
          if (chNum === firstChapterNum) {
            firstChapterTitle = res.data.title || '';
          }
        }
      } catch (error) {
        console.error(`Error fetching chapter ${chNum} details:`, error);
      }
    }

    if (isSelectionCancelled) {
      isSelectionLoading.value = false;
      return;
    }

    isSelectionLoading.value = false;

    const episodeText = t('submit.video.episode', { episode: firstChapterNum });
    let generatedTitle = `${episodeText} ${firstChapterTitle || targetProject.name}`;
    selectedEpisode.value = firstChapterNum;
    chapterIdForPublish.value = firstChapterNum;
    form.value.title = generatedTitle.substring(0, TITLE_MAX);

    if (targetProject.result_async?.generate_manju_cover) {
      coverPreview.value = targetProject.result_async.generate_manju_cover;
    }

    // Handle collection logic
    if (targetProject.name) {
      projectNameForNewCollection.value = targetProject.name;
      projectCoverForNewCollection.value = targetProject.result_async?.generate_manju_cover || coverPreview.value || '';
      try {
        let searchRes: any = null;
        if (currentSessionId) {
          searchRes = await api.searchSessionId({ session_id: currentSessionId, type: 3 }) as any;
        }
        if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
          searchRes = await api.searchFullCollection({ title: targetProject.name, type: 3 }) as any;
        }

        if (searchRes.code == 0) {
          const book_id = searchRes.data?.book_id || 0;

          if (book_id == 0) {
            const createRes = await api.addCollection({
              title: targetProject.name,
              type: 3,
              cover: targetProject.result_async?.generate_manju_cover || '',
              description: t('collectionSettings.sampleDescription'),
              is_nsfw: 0
            }) as any;

            if (createRes.code == 0 && createRes.data?.book_id) {
              selectedCollection.value = {
                id: createRes.data.book_id,
                name: targetProject.name,
                cover: targetProject.result_async?.generate_manju_cover || '',
                description: t('collectionSettings.sampleDescription'),
                is_nsfw: 0
              };
              selectedEpisodeNumber.value = '1';
              isNoCollection.value = false;
            }
          } else {
            const collectionRes = await api.singleCollectionIndex(book_id) as any;

            if (collectionRes.code == 0 && collectionRes.data) {
              const allnum = collectionRes.data.count || 0;
              const episodeNumber = parseInt(allnum) + 1;

              selectedCollection.value = {
                id: book_id,
                name: searchRes.data?.book_info?.title || targetProject.name,
                cover: searchRes.data?.book_info?.cover,
                description: searchRes.data?.book_info?.description || '',
                is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
              };
              isNoCollection.value = false;
              selectedEpisodeNumber.value = episodeNumber.toString();

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

    uploadSuccess.value = true;
    uploadProgress.value = 100;
  } else {
    selectedEpisode.value = selectedChapters.value[0];
    isSelectionLoading.value = false;
    await handlePublish();
  }
}

const cancelSelectionLoading = () => {
  isSelectionCancelled = true;
  isSelectionLoading.value = false;
};

const batchChapterTitles = ref<Record<number, string>>({});
const batchChapterContents = ref<Record<number, string>>({});

const batchPermission = ref<'public' | 'partial' | 'private'>('public');
const batchPartialStartChapter = ref<number>(1);
const showBatchChapterDropdown = ref(false);

const batchPermOptions = [
  { key: 'public', labelKey: 'submit.permPublic' },
  { key: 'partial', labelKey: 'submit.permPartial' },
  { key: 'private', labelKey: 'submit.permPrivate' },
];

const batchCollectionChapterList = computed(() => {
  const start = parseInt(selectedEpisodeNumber.value) || 1;
  const count = selectedChapters.value.length;
  const list: number[] = [];
  for (let i = 0; i < count; i++) {
    list.push(start + i);
  }
  return list;
});

watch(batchCollectionChapterList, (list) => {
  if (list.length > 0) {
    if (!list.includes(batchPartialStartChapter.value)) {
      batchPartialStartChapter.value = list[0];
    }
  }
}, { immediate: true });

async function handleBatchPermissionChange(permission: string, _index: number) {
  if (_index === 1 && !hasActiveSubscription.value) {
    showSubscriptionModal.value = true;
    return;
  }
  batchPermission.value = permission as 'public' | 'partial' | 'private';

  if (permission === 'partial' && batchCollectionChapterList.value.length > 0) {
    batchPartialStartChapter.value = batchCollectionChapterList.value[0];
  }
}

function handleInlineChapterSelect(event: Event) {
  event.stopPropagation();
  if (batchPermission.value !== 'partial') {
    batchPermission.value = 'partial';
    if (batchCollectionChapterList.value.length > 0) {
      batchPartialStartChapter.value = batchCollectionChapterList.value[0];
    }
  }
  showBatchChapterDropdown.value = !showBatchChapterDropdown.value;
}

function selectBatchPartialStart(ch: number) {
  batchPartialStartChapter.value = ch;
  showBatchChapterDropdown.value = false;
}

const CHAPTERS_PER_PAGE = 20;
const activeBatchPage = ref(0);

const batchPageTabs = computed(() => {
  const chapters = unpublishedChapters.value.filter((c: any) => selectedChapters.value.includes(c.chapter));
  const total = chapters.length;
  const pages = Math.ceil(total / CHAPTERS_PER_PAGE) || 1;
  const tabs: string[] = [];
  for (let i = 0; i < pages; i++) {
    const startChapter = chapters[i * CHAPTERS_PER_PAGE]?.chapter;
    const endChapter = chapters[Math.min((i + 1) * CHAPTERS_PER_PAGE - 1, total - 1)]?.chapter;
    if (startChapter === endChapter) {
      tabs.push(`${startChapter}`);
    } else {
      tabs.push(`${startChapter}-${endChapter}`);
    }
  }
  return tabs;
});

const batchVisibleChapters = computed(() => {
  if (!selectedProject.value?.chapters) return [];
  const chapters = unpublishedChapters.value.filter((c: any) => selectedChapters.value.includes(c.chapter));
  const start = activeBatchPage.value * CHAPTERS_PER_PAGE;
  const end = start + CHAPTERS_PER_PAGE;
  return chapters.slice(start, end);
});

function getBatchChapterTitle(chapterNum: number): string {
  if (batchChapterTitles.value[chapterNum]) return batchChapterTitles.value[chapterNum];
  const chapter = (selectedProject.value?.chapters || []).find((c: any) => c.chapter === chapterNum);
  if (chapter) return `${t('submit.video.episode', { episode: chapter.chapter })} ${chapter.title}`;
  return '';
}

function getBatchChapterTitleLength(chapterNum: number): number {
  return getBatchChapterTitle(chapterNum).length;
}

function getCollectionOrder(chapterNum: number): number {
  const idx = selectedChapters.value.indexOf(chapterNum);
  const start = parseInt(selectedEpisodeNumber.value) || 1;
  return start + idx;
}

function updateBatchChapterTitle(chapterNum: number, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  batchChapterTitles.value[chapterNum] = value;
}

const showBatchPublishProgress = ref(false);
const showBatchPublishFail = ref(false);
const batchPublishChapterStatuses = ref<{ chapter: number; status: 'success' | 'publishing' | 'waiting' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailChapters = ref<{ chapter: number; status: 'success' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailedChapter = ref<number | undefined>(undefined);

async function onBatchPublish() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  if (!selectedCollection.value) {
    toast(t('collection.noCollection'));
    return;
  }

  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  batchPublishChapterStatuses.value = selectedChapters.value.map(chapter => ({
    chapter,
    status: 'waiting' as const
  }));
  showBatchPublishProgress.value = true;

  const session_id = selectedProject.value?.session_id || sessionId.value;
  const collectionStart = parseInt(selectedEpisodeNumber.value) || 1;

  for (let i = 0; i < selectedChapters.value.length; i++) {
    const chapterNum = selectedChapters.value[i];
    const collectionChapterIndex = collectionStart + i;

    batchPublishChapterStatuses.value[i].status = 'publishing';

    try {
      let title = batchChapterTitles.value[chapterNum] || getBatchChapterTitle(chapterNum);

      const accessRights = batchPermission.value === 'partial'
        ? (collectionChapterIndex >= batchPartialStartChapter.value ? 2 : 1)
        : batchPermission.value === 'private' ? 3 : 1;

      const payload: any = {
        type: 3,
        title: title.substring(0, 60),
        cover: coverPreview.value || (selectedCollection.value?.cover || ''),
        is_nsfw: selectedCollection.value?.is_nsfw ?? 0,
        access_rights: accessRights,
        book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
        chapter_index: collectionChapterIndex,
        ...(session_id ? { session_id } : {}),
        ai_chapter_index: chapterNum,
      };

      const chapterRes = await api.detailChapter(session_id!, chapterNum) as any;
      if (chapterRes.code === 200 && chapterRes.data) {
        if (chapterRes.data.result_async?.final_video_output) {
          const videoOutput = chapterRes.data.result_async.final_video_output;
          payload.video_url = videoOutput.video_url_1080p || videoOutput.video_url;
          payload.video_cover_url = videoOutput.video_cover_url || '';
        }
        if (chapterRes.data.chapter_description) {
          payload.content = chapterRes.data.chapter_description;
        }
      }

      const headers = new Headers();
      const { ts, sign } = window.AntiCrawler.generateAuthParams(token);
      headers.append("token", token);
      headers.append("ts", ts);
      headers.append("sign", sign);
      headers.append("Content-Type", "application/json");
      headers.append("Platform", "web");

      const response = await fetch(`${baseUrl}post/addPost`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const result = await response.text();
      const res = JSON.parse(result);

      if (res.code == 0 || res.code == 200) {
        batchPublishChapterStatuses.value[i].status = 'success';
      } else {
        batchPublishChapterStatuses.value[i].status = 'fail';
        for (let j = i + 1; j < selectedChapters.value.length; j++) {
          batchPublishChapterStatuses.value[j].status = 'unpublished';
        }
        break;
      }
    } catch (error) {
      console.error(`Error publishing chapter ${chapterNum}:`, error);
      batchPublishChapterStatuses.value[i].status = 'fail';
      for (let j = i + 1; j < selectedChapters.value.length; j++) {
        batchPublishChapterStatuses.value[j].status = 'unpublished';
      }
      break;
    }
  }

  handleBatchPublishComplete();
}

function handleBatchPublishComplete() {
  showBatchPublishProgress.value = false;
  const successCount = batchPublishChapterStatuses.value.filter(c => c.status === 'success').length;
  const totalCount = batchPublishChapterStatuses.value.length;
  if (successCount === totalCount) {
    handleBatchPublishAllSuccess(totalCount);
  } else {
    batchPublishFailChapters.value = batchPublishChapterStatuses.value.map(c => ({
      chapter: c.chapter,
      status: c.status
    }));
    const failItem = batchPublishChapterStatuses.value.find(c => c.status === 'fail');
    batchPublishFailedChapter.value = failItem?.chapter;
    showBatchPublishFail.value = true;
  }
}

function handleBatchPublishAllSuccess(count: number) {
  toast(t('novel.batchPublish.allPublishSuccess', { count, unit: t('novel.batchPublish.allPublishSuccessUnitChapter') }));
  router.push(`/user-home?id=${uid}&type=3`);
}

function handleBatchPublishExit() {
  showBatchPublishFail.value = false;
  router.push(`/user-home?id=${uid}&type=3`);
}

function handleBatchPublishRetry() {
  showBatchPublishFail.value = false;
  showBatchPublishProgress.value = true;
}

// Check if a project is selected
const isProjectSelected = computed(() => {
  return !!selectedProject.value && !!selectedEpisode.value;
});

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
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== collection.id) {
    pendingCollectionId.value = collection.id;
    pendingCollectionData.value = collection;
    showSwitchCollectionModal.value = true;
  } else {
    collectionListSelectedId.value = collection.id;
  }
}

async function handleSelectCollectionFromModal(collection: any) {
  showCollectionListModal.value = false;
  await doSelectCollection(collection.id, true, collection);
}

function handleCreateCollectionFromModal() {
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value) {
    pendingCollectionId.value = null;
    pendingCollectionData.value = null;
    showSwitchCollectionModal.value = true;
    return;
  }
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

function handleCloseEditCollectionModal() {
  showEditCollectionModal.value = false;
}

async function selectCollection(id: number) {
  if (!route.query.session_id && !selectedProject.value?.session_id && !sessionId.value && !postId.value) {
    await doSelectCollection(id);
    return;
  }
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== id) {
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
        // 先添加已有的章节
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: (index + 1).toString()
            });
          });
        } else if (collection.chapters && collection.chapters.length > 0) {
          // Fallback to collection.chapters if response.data.data is not available
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
  collectionListSelectedId.value = selectedCollection.value?.id || null;
  pendingCollectionId.value = null;
  pendingCollectionData.value = null;
}

async function handleConfirmSwitchCollection() {
  switchCollectionWarningShown.value = true;
  showSwitchCollectionModal.value = false;

  if (pendingCollectionId.value !== null) {
    collectionListSelectedId.value = pendingCollectionId.value;
    pendingCollectionId.value = null;
    pendingCollectionData.value = null;
  } else {
    showCollectionListModal.value = false;
    editingCollectionId.value = null;
    isCreateFromCollectionList.value = true;
    showEditCollectionModal.value = true;
  }
}

function selectEpisode(value: string) {
  selectedEpisodeNumber.value = value;
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

async function handleSaveCollection(collection: { id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number }) {
  showEditCollectionModal.value = false;

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

    if (isCreateFromCollectionList.value) {
      showCollectionListModal.value = false;
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
  selectedChapters.value = [];

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
        }
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
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

async function handlePublish(publishData?: any) {
  if (!publishData) trackClickPublishButton(2);

  isEditingWork.value = true;

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

    if (publishData.session_id) {
      selectedProject.value = { ...project, session_id: publishData.session_id };
    }
  } else {
    // Direct click: use selectedProject and selectedEpisode
    project = selectedProject.value;
    episode = selectedEpisode.value;
  }

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

  const currentSessionId = publishData?.session_id || project.session_id || sessionId.value;

  // Get chapter details to get video, cover, and title from chapter data
  try {
    if (currentSessionId) {
      // Set cover from project cover, not chapter cover
      if (project.cover) {
        coverPreview.value = project.cover;
      } else if (project.result_async?.generate_manju_cover) {
        coverPreview.value = project.result_async.generate_manju_cover;
      }

      const chapterRes = await api.detailChapter(currentSessionId, episode) as any;
      if (chapterRes.code == 200) {
        if (chapterRes.code != 200) {
          toast(chapterRes.message || t('fail'));
          return;
        }

        if (chapterRes.data && chapterRes.data.is_publish == 1) {
          toast(t('submit.video.episodeAlreadyPublished'));
          setTimeout(() => { location.reload(); }, 1000);
          return;
        }

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
    }
  } catch (error) {
    console.error('Error fetching chapter details for publish:', error);
  }

  // Generate title: Episode X Title (不带书名)
  if (episodeTitle) {
    form.value.title = `${episodeText} ${episodeTitle}`;
  } else {
    form.value.title = episodeText;
  }

  // Handle collection logic based on the project name
  if (project.name) {
    projectNameForNewCollection.value = project.name;
    projectCoverForNewCollection.value = project.video_cover_url || project.result_async?.generate_manju_cover || coverPreview.value || '';
    try {
      let searchRes: any = null;
      if (currentSessionId) {
        searchRes = await api.searchSessionId({ session_id: currentSessionId, type: 3 }) as any;
      }
      if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
        searchRes = await api.searchFullCollection({ title: project.name, type: 3 }) as any;
      }

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          const createRes = await api.addCollection({
            title: project.name,
            type: 3,
            cover: project.video_cover_url || '',
            description: t('collectionSettings.sampleDescription'),
            is_nsfw: 0
          }) as any;

          if (createRes.code == 0 && createRes.data?.book_id) {

            selectedCollection.value = {
              id: createRes.data.book_id,
              name: project.name,
              cover: project.video_cover_url || '',
              description: t('collectionSettings.sampleDescription'),
              is_nsfw: 0
            };
            selectedEpisodeNumber.value = '1';
            isNoCollection.value = false;
          }
        } else {
          const collectionRes = await api.singleCollectionIndex(book_id) as any;

          if (collectionRes.code == 0 && collectionRes.data) {
            const allnums = collectionRes.data.count || 0;
            const episodeNumber = parseInt(allnums) + 1;
            const collectionCover = collectionRes.data.cover || '';

            selectedCollection.value = {
              id: book_id,
              name: searchRes.data?.book_info?.title || project.name,
              cover: searchRes.data?.book_info?.cover || collectionCover,
              description: searchRes.data?.book_info?.description || '',
              is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
            };
            selectedEpisodeNumber.value = episodeNumber.toString();
            isNoCollection.value = false;

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
    const metadataOk = await new Promise<boolean>((resolve) => {
      video.onloadedmetadata = () => {
        videoSize.value = parseFloat((file.size / (1024 * 1024)).toFixed(1));
        videoDuration.value = Math.round(video.duration);
        if (video.duration > 3600) {
          resolve(false);
          return;
        }
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        videoType.value = extension;
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
      if (videoDuration.value > 3600) {
        toast(t('submit.video.durationLimit'));
      } else {
        toast(t('submit.video.corruptedError'));
      }
      return false;
    }

    URL.revokeObjectURL(video.src);

    const videoIdResponse = await api.getVideoId({ filename: file.name, filesize: file.size }) as any;
    if (!videoIdResponse || videoIdResponse.code != 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoIdResponse));
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

      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('key', fileKey);
      formData.append('partNumber', String(i));
      formData.append('file', chunk);

      const authToken = localStorage.getItem("token") ?? "";
      const authHeaders = window.AntiCrawler.generateAuthParams(authToken);
      const videoUrlResponse = await fetch(baseUrl + "user/uploadCosPart", {
        method: "POST",
        headers: {
          token: authToken || undefined,
          'Platform': 'web',
          ...authHeaders,
        } as Record<string, string>,
        body: formData,
      });
      const videoUrlData = await videoUrlResponse.json();
      if (!videoUrlData || videoUrlData.code !== 0) {
        isUpload.value = false;
        toast(getI18nMsg(videoUrlData));
        return false;
      }

      uploadProgress.value = 60;

      const etag = videoUrlData.data?.etag || '';
      uploadedParts.push({ PartNumber: i, ETag: etag });

      uploadProgress.value = Math.round((i / totalParts) * 100);
    }

    const videoMergeResponse = await api.getVideoMerge({ uploadId, key: fileKey, parts: JSON.stringify(uploadedParts) }) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoMergeResponse));
      return false;
    }

    videoUrl.value = videoMergeResponse.data.url || '';

    uploadSuccess.value = true;
    isUpload.value = false;
  } catch (error: any) {
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
        'Platform': 'web',
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

const ALLOWED_EXTENSIONS = ['mp4', 'mov'];

function validateVideoFormat(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    toast(t('submit.video.formatError'));
    return false;
  }
  return true;
}

async function onVideoPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 1) {
    toast(t('submit.video.multiSelectError'));
    input.value = "";
    return;
  }
  const file = files?.[0];
  if (file) {
    if (!validateVideoFormat(file)) {
      input.value = "";
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast(t('submit.video.sizeError'));
      input.value = "";
      return;
    }
    await startFakeUpload(file);
  }
  input.value = "";
}

async function onDropFile(e: DragEvent) {
  const files = e.dataTransfer?.files;
  if (files && files.length > 1) {
    toast(t('submit.video.multiSelectError'));
    return;
  }
  const file = files?.[0];
  if (file) {
    if (!validateVideoFormat(file)) return;
    const MAX_SIZE = 5 * 1024 * 1024 * 1024;
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

function toggleSensitive(val: string) {
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
  pendingSensitiveFromSwitch.value = false;
  if (pendingCollectionIdForSensitive.value !== null) {
    doSelectCollection(pendingCollectionIdForSensitive.value, true);
    pendingCollectionIdForSensitive.value = null;
    showCollectionListModal.value = false;
  }
}

function onTitleInput() {
  if (titleError.value && form.value.title.trim()) {
    titleError.value = false;
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
      form.value.content = postData.is_nsfw == '1' ? "yes" : "no";
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
        selectedCollection.value = {
          id: postData.book_id || '',
          name: postData.book_title,
          cover: postData.cover || ''
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
              if (collectionRes.code === 0 && collectionRes.data) {
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

  // Restore tag span styles
  captionRef.value?.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });

  updateCaptionStats();
  requestAnimationFrame(() => scrollCaptionToCursor());
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

  // Restore tag span styling that may have been lost during input
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

  requestAnimationFrame(() => scrollCaptionToCursor());
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

    // Protect existing tag spans: if cursor is right after a contentEditable=false span,
    // prevent default and manually insert the space to avoid browser destroying the span
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

function scrollCaptionToCursor() {
  if (!captionRef.value) return;

  const el = captionRef.value;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
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

    if ((rect.width === 0 && rect.height === 0) || !captionRect || absTop < 100 || absLeft < 10) {
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
    if (absTop + dropdownHeight > window.innerHeight) {
      dropdownPosition.value.top = rect.top - dropdownHeight - 5;
    }

    showDropdown.value = true;
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

  if (!form.value.title.trim()) {
    toast(t("submit.titleRequired"));
    titleError.value = true;
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
  if (!selectedEpisodeNumber.value) {
    toast(t("collection.enterEpisode"));
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
      is_nsfw: selectedCollection.value?.is_nsfw ?? 0,
      access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
      video_url: videoUrl.value,
      book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
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
    headers.append("Platform", "web");

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

async function initSingleChapter(sessionIdParam: string, urlParam: string, indexParam: string) {
  sessionId.value = sessionIdParam;
  isEditingWork.value = true;

  if (urlParam && urlParam.trim()) {
    videoUrl.value = urlParam;
    uploadSuccess.value = true;
    uploadProgress.value = 100;

    const coverParam = route.query.cover as string;
    if (coverParam && coverParam.trim()) {
      coverPreview.value = coverParam;
    }

    const title = route.query.title as string;
    if (title) {
      projectNameForNewCollection.value = title;
      projectCoverForNewCollection.value = coverPreview.value || '';
      try {
        let searchRes: any = null;
        if (sessionIdParam) {
          searchRes = await api.searchSessionId({ session_id: sessionIdParam, type: 3 }) as any;
        }
        if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
          searchRes = await api.searchFullCollection({ title, type: 3 }) as any;
        }

        if (searchRes.code === 0) {
          const book_id = searchRes.data?.book_id || 0;

          if (book_id === 0) {
            const createRes = await api.addCollection({
              title,
              type: 3,
              cover: coverPreview.value || '',
              description: t('collectionSettings.sampleDescription'),
              is_nsfw: 0
            }) as any;

            if (createRes.code === 0 && createRes.data?.book_id) {
              selectedCollection.value = {
                id: createRes.data.book_id,
                name: title,
                cover: coverPreview.value || '',
                description: t('collectionSettings.sampleDescription'),
                is_nsfw: 0
              };
              selectedCollectionId.value = createRes.data.book_id;
              selectedEpisodeNumber.value = '1';
              isNoCollection.value = false;
            }
          } else {
            const collectionRes = await api.singleCollectionIndex(book_id) as any;

            if (collectionRes.code === 0 && collectionRes.data) {
              const allnums = collectionRes.data.count || 0;
              const episodeNumber = parseInt(allnums) + 1;

              selectedCollection.value = {
                id: book_id,
                name: searchRes.data?.book_info?.title || title,
                cover: searchRes.data?.book_info?.cover || '',
                description: searchRes.data?.book_info?.description || '',
                is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
              };
              selectedCollectionId.value = book_id;
              selectedEpisodeNumber.value = episodeNumber.toString();
              isNoCollection.value = false;

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
  }
}

async function initBatchPublish(session_id: string) {
  const batchIndexesRaw = route.query.indexes as string;
  const batchCover = route.query.cover as string || '';
  const batchName = route.query.name as string || '';
  if (!batchIndexesRaw) {
    isLoadingBatchPublish.value = false;
    router.push({ path: '/novel-generate', query: { session_id } });
    return;
  }

  const batchIndexes = batchIndexesRaw.split(',').map(Number).filter(n => !isNaN(n));

  isLoadingBatchPublish.value = true;

  try {
    const projectRes = await api.detailProject(session_id) as any;
    if (projectRes.code === 200 && projectRes.data) {
      selectedProject.value = {
        ...projectRes.data,
        session_id,
        chapters: projectRes.data.chapters || []
      };
      if (projectRes.data.result_async?.generate_manju_cover) {
        coverPreview.value = projectRes.data.result_async.generate_manju_cover;
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }

  sessionId.value = session_id;

  if (batchCover) {
    coverPreview.value = batchCover;
  }

  const projectTitle = batchName || selectedProject.value?.name || '';
  if (projectTitle) {
    projectNameForNewCollection.value = projectTitle;
    projectCoverForNewCollection.value = coverPreview.value || '';
  }

  selectedChapters.value = batchIndexes;

  let hasChapterError = false;
  for (const chapterIndex of batchIndexes) {
    try {
      const res = await api.detailChapter(session_id, chapterIndex) as any;
      if (res.code === 200 && res.data) {
        batchChapterContents.value[chapterIndex] = res.data.chapter_description || '';
      } else {
        hasChapterError = true;
      }
    } catch (e) {
      hasChapterError = true;
      console.error(`Failed to fetch chapter ${chapterIndex}:`, e);
    }
  }

  if (hasChapterError) {
    toast(t('novel.batchPublish.chapterLoadError'));
  }

  // Setup collection
  if (projectTitle) {
    try {
      let searchRes: any = null;
      if (session_id) {
        searchRes = await api.searchSessionId({ session_id, type: 3 }) as any;
      }
      if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
        searchRes = await api.searchFullCollection({ title: projectTitle, type: 3 }) as any;
      }

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          const createRes = await api.addCollection({
            title: projectTitle,
            type: 3,
            cover: coverPreview.value || '',
            description: t('collectionSettings.sampleDescription'),
            is_nsfw: 0
          }) as any;

          if (createRes.code == 0 && createRes.data?.book_id) {
            selectedCollection.value = {
              id: createRes.data.book_id,
              name: projectTitle,
              cover: coverPreview.value || '',
              description: t('collectionSettings.sampleDescription'),
              is_nsfw: 0
            };
            selectedCollectionId.value = createRes.data.book_id;
            selectedEpisodeNumber.value = '1';
            isNoCollection.value = false;
          }
        } else {
          const collectionRes = await api.singleCollectionIndex(book_id) as any;

          if (collectionRes.code == 0 && collectionRes.data) {
            const allnums = collectionRes.data.count || 0;
            const episodeNumber = parseInt(allnums) + 1;

            selectedCollection.value = {
              id: book_id,
              name: searchRes.data?.book_info?.title || projectTitle,
              cover: searchRes.data?.book_info?.cover || '',
              description: searchRes.data?.book_info?.description || '',
              is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
            };
            selectedCollectionId.value = book_id;
            selectedEpisodeNumber.value = episodeNumber.toString();
            isNoCollection.value = false;

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
      console.error('Error setting up collection:', error);
    }
  }

  isLoadingBatchPublish.value = false;
  uploadSuccess.value = true;
  uploadProgress.value = 100;
  await fetchCollections(false);
}

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  getCountry();
  await checkSubscriptionStatus();

  const sessionIdParam = route.query.session_id as string;
  const urlParam = route.query.url as string;
  const indexParam = route.query.index as string;
  const isBatch = route.query.batch === 'true';

  if (isBatch && sessionIdParam) {
    isEditingWork.value = true;
    await initBatchPublish(sessionIdParam);
  } else if (sessionIdParam && urlParam) {
    await initSingleChapter(sessionIdParam, urlParam, indexParam);
  } else if (sessionIdParam) {
    sessionId.value = sessionIdParam;
    isEditingWork.value = true;
  } else if (postId.value) {
    isEditingWork.value = true;
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
