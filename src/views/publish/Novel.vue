<template>
  <div class="submit-article" :class="showFullContent ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
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
      <div class="upload-tabs" v-if="!showFullContent && !postId && !isInitializing">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.articleTitleLabel") }}</span>
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
              <div class="chapter-lists-container">
                <div v-if="unpublishedChapters.length > 0" class="pending-section">
                  <div class="pending-header">
                    <span class="pending-label">{{ t('submit.image.pendingChapters') }}</span>
                    <button class="select-all-btn" @click="toggleSelectAllChapters">
                      <span class="select-all-text">{{ t('submit.image.selectAll', { count: unpublishedChapters.length }) }}</span>
                      <img
                        class="select-all-checkbox"
                        :src="isAllChaptersSelected ? checkboxActive : checkboxInactive"
                        alt=""
                      />
                    </button>
                  </div>
                  <div class="pending-chapters-list">
                    <div
                      v-for="chapter in unpublishedChapters"
                      :key="'pending-' + chapter.chapter"
                      class="pending-chapter-item"
                      :class="{ selected: selectedChapters.includes(chapter.chapter) }"
                      @click="toggleChapterSelection(chapter.chapter)"
                    >
                      <span class="chapter-name">{{ t('chapter', { chapter: chapter.chapter }) }} {{ chapter.title }}</span>
                      <div class="chapter-status-wrap">
                        <span class="chapter-status-text">{{ t('submit.image.pending') }}</span>
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
                    <span class="published-tab-label">{{ t('submit.image.publishedChapters') }}</span>
                    <span class="published-count-info">{{ t('submit.image.publishedCount', { count: publishedChapters.length }) }}</span>
                  </div>
                  <div class="published-chapters-list">
                    <div
                      v-for="(chapter, index) in publishedChapters"
                      :key="'published-' + chapter.chapter"
                      class="published-chapter-item"
                    >
                      <span class="chapter-name" :class="{ active: index === 0 }">{{ t('chapter', { chapter: chapter.chapter }) }} {{ chapter.title }}</span>
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
              >
                {{ t('submit.cover.confirm') }}
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    <div class="info-tooltip">
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

      <!-- Batch Publish Loading -->
      <div v-if="(isLoadingBatchPublish || isInitializing) && !showFullContent && !postId" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ t('home.loading') }}</div>
      </div>

      <!-- Full Content View: After clicking Next Step or Edit Mode -->
      <div class="content-wrapper" v-if="showFullContent || postId">
        <!-- Single mode: Permission Range -->
        <div v-if="!isBatchPublish" class="section">
          <div class="form-label-box">
            <span><b>*</b>{{ t("submit.articleTitleLabel") }}</span>
            <button class="insert-image-btn" @click="triggerCaptionImageUpload">
              <span>{{ t('submit.insertImage') }}</span>
            </button>
          </div>

          <!-- Single mode: Title & Description -->
          <div class="content-section">
            <div class="form-item">
              <div class="caption-container" :class="{ 'title-error': titleError }">
                <div class="title-input-wrap">
                  <input
                    v-model="form.title"
                    class="title-input"
                    type="text"
                    :maxlength="TITLE_MAX"
                    :placeholder="t('submit.titlePlaceholder')"
                    @input="onTitleInput"
                  />
                  <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
                </div>

                <div class="desc-input-wrap">
                  <input
                    ref="captionImageFileInputRef"
                    type="file"
                    accept="image/*"
                    style="display: none;"
                    @change="handleCaptionImageChange"
                  />
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
                    @keyup="saveCaptionRange"
                    @mouseup="saveCaptionRange"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="perm-box">
            <div class="form-label-inner">
              <label class="form-label">{{ t("submit.permission") }}</label>
              <div class="info-icon" @mouseover="adjustTooltipPosition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div class="info-tooltip">
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

            <span class="char-count desc-char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
          </div>
        </div>

        <!-- Batch mode: collection + batch settings -->
        <div v-if="isBatchPublish" class="batch-collection-perm-wrapper">
          <div class="collection-section">
            <div class="form-item">
              <div class="collection-row">
                <div class="collection-group" v-if="selectedCollection">
                  <div class="form-label-inner">
                    <label class="form-label"><b>*</b>{{ t("submit.collection") }}</label>

                    <div class="info-icon" @mouseover="adjustTooltipPosition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <div class="info-tooltip">
                        <div class="tooltip-content">
                          <div v-html="t('submit.collectionInfo')"></div>
                        </div>
                      </div>
                    </div>

                    <div class="switch-collection-btn" @click="openCollectionListModal">
                      <span>{{ t('collection.switchCollection') }}</span>
                      <img src="@/assets/images/publish/switch.png" alt="" />
                    </div>

                    <span v-if="publishedChapters.length > 0" class="batch-published-info">{{ t('novel.batchPublish.publishedInCollection', { count: publishedChapters.length }) }}</span>
                  </div>

                  <div class="collection-display">
                    <div class="collection-info" v-if="selectedCollection">
                      <img v-if="selectedCollection.cover" :src="processImageUrl(selectedCollection.cover)" alt="" class="collection-cover" />
                      <div class="collection-text">
                        <div class="collection-top">
                          <span class="collection-name">{{ selectedCollection.name }}</span>
                          <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="collection-info" v-else>
                      <span class="collection-name no-collection" @click="openCollectionListModal">{{ t('collection.noCollection') }}</span>
                    </div>

                    <div class="content-sensitive">
                      <div class="sensitive-left">
                        <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>

                        <div class="info-icon" @mouseover="adjustTooltipPosition">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          <div class="info-tooltip">
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
                      <span class="modify-link" @click="handleEditCollection">{{ t('collection.modifyCollection') }}</span>
                    </div>

                    <div class="content-language">
                      <label class="form-label">{{ t('submit.language') }}</label>
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
                            :class="{ active: collectionLanguage === opt.key }"
                            @click="handleCollectionLanguageChange(opt.key)"
                          >{{ t(opt.labelKey) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="collection-info" v-else>
                  <span class="collection-name no-collection" @click="openCollectionListModal">{{ t('collection.noCollection') }}</span>
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
              <span class="batch-chapter-label">{{ t('chapter', { chapter: chapter.chapter }) }}：{{ chapter.title }}</span>
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <div class="info-tooltip">
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
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              <div class="info-tooltip">
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

                        <div class="content-language">
                          <label class="form-label"><b>*</b>{{ t('submit.language') }}</label>
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
                                :class="{ active: collectionLanguage === opt.key }"
                                @click="handleCollectionLanguageChange(opt.key)"
                              >{{ t(opt.labelKey) }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="collection-info" v-else>
                      <span class="collection-name no-collection" @click="openCollectionListModal">{{ t('collection.noCollection') }}</span>
                    </div>
                  </div>


                </div>
                <div class="collection-group" v-if="!isNoCollection && selectedCollection">
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
                <div class="collection-info" v-else-if="!isNoCollection">
                  <span class="collection-name no-collection" @click="openCollectionListModal">{{ t('collection.noCollection') }}</span>
                </div>

              </div>
            </div>
          </div>

        <!-- Single mode: submit -->
        <div v-if="!isBatchPublish" class="submit-row">
          <button class="submit" :class="!canSubmit ? 'dis' : ''" :disabled="!canSubmit || uploading" @click="onSubmit">
            {{ t("submit.submit") }}
          </button>
        </div>
        <div v-if="!isBatchPublish" class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span class="agreement-text"
            >{{ t("submit.agree") }}<span class="terms-text">{{ t("submit.terms") }}</span></span
          >
        </div>

        <!-- Batch mode: submit -->
        <div v-if="isBatchPublish" class="submit-row">
          <button class="submit" :disabled="uploading" @click="onBatchPublish">
            {{ t("submit.submit") }}
          </button>
        </div>
        <div v-if="isBatchPublish" class="agreement-row">
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

  <UploadMask :visible="isUpload"></UploadMask>
  <LoadingMask :visible="isSelectionLoading" @cancel="cancelSelectionLoading" />

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
    @batch-publish="handleBatchPublishFromModal"
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
    :type="2"
    :session-id="selectedProject?.session_id || route.query.session_id || ''"
    :story-summary="selectedProject?.result_async?.generate_novel_outline?.story_summary?.summary || ''"
    :language="collectionLanguage"
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
  </div>
</template>

<script setup lang="ts" name="PublishNovel">
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import SetArticleCoverModal from "@/components/SetArticleCoverModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import LoadingMask from "@/components/LoadingMask.vue";
import Pagination from "@/components/Pagination.vue";
import ProjectNovelViewModal from "@/components/ProjectNovelViewModal.vue";
import BatchPublishProgressDialog from "@/components/BatchPublishProgressDialog.vue";
import BatchPublishFailDialog from "@/components/BatchPublishFailDialog.vue";
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
import checkboxActive from "@/assets/images/register/check_active.png";
import checkboxInactive from "@/assets/images/register/check.png";
import requireSwitchOn from "@/assets/images/home/open.png";
import requireSwitchOff from "@/assets/images/publish/close.png";
import router from "@/router";
import { useRoute } from "vue-router";

const isUpload = ref(false);

function adjustTooltipPosition(event: MouseEvent) {
  const infoIcon = event.currentTarget as HTMLElement;
  const tooltip = infoIcon.querySelector('.info-tooltip') as HTMLElement;
  if (tooltip) {
    tooltip.classList.remove('tooltip-align-left', 'tooltip-fixed');
    tooltip.style.position = '';
    tooltip.style.top = '';
    tooltip.style.left = '';
    tooltip.style.right = '';
    tooltip.style.marginTop = '';
    tooltip.style.removeProperty('--arrow-left');

    const infoIconRect = infoIcon.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const tooltipWidth = 280;
    const margin = 10;

    const wouldOverflowLeft = infoIconRect.right - tooltipWidth < margin;
    const wouldOverflowRight = infoIconRect.left + tooltipWidth > windowWidth - margin;

    if (!wouldOverflowLeft) return;

    if (!wouldOverflowRight) {
      tooltip.classList.add('tooltip-align-left');
      return;
    }

    tooltip.classList.add('tooltip-align-left', 'tooltip-fixed');
    tooltip.style.position = 'fixed';
    tooltip.style.top = `${infoIconRect.bottom + 10}px`;
    tooltip.style.left = `${margin}px`;
    tooltip.style.right = 'auto';
    tooltip.style.marginTop = '0';

    const iconCenterX = infoIconRect.left + infoIconRect.width / 2;
    const arrowOffset = iconCenterX - margin;
    tooltip.style.setProperty('--arrow-left', `${Math.max(8, Math.min(arrowOffset, tooltipWidth - 20))}px`);
  }
}

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

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc" }[locale.value] || "jp");

const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
];

const langDropdownOpen = ref(false);
const langDropdownUp = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);
const collectionLanguage = ref(defaultLang);

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
  const opt = langOptions.find((o) => o.key === collectionLanguage.value);
  return opt ? t(opt.labelKey) : "";
});

async function handleCollectionLanguageChange(key: string) {
  langDropdownOpen.value = false;
  if (key === collectionLanguage.value) return;
  const prevLang = collectionLanguage.value;
  collectionLanguage.value = key;
  if (selectedCollection.value) {
    try {
      await api.modifyCollection({ book_id: selectedCollection.value.id, language: key });
    } catch (e) {
      collectionLanguage.value = prevLang;
      toast(t('fail'));
    }
  }
}

const agreeTerms = ref(true);

const TITLE_MAX = 60;
const DESC_MAX = 50000;

const uid = localStorage.getItem('uid') || '';

const tabList = ref([
  {
    name: t("submit.tabs.novel"),
    path: "/publish/novel",
  },
  {
    name: t("submit.tabs.manhua"),
    path: "/publish/comic",
  },
  {
    name: t("submit.tabs.manju"),
    path: "/publish/video",
  },
  {
    name: t("submit.tabs.photo"),
    path: "/publish/image",
  },
  {
    name: t("submit.tabs.video"),
    path: "/publish/clip",
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

const isBatchPublishMode = ref(false);
const isLoadingBatchPublish = ref(false);
const isInitializing = ref(false);
const batchPublishIndexes = ref<number[]>([]);
const batchPublishCurrentIndex = ref(0);
const batchPublishTotal = ref(0);
const batchPublishProgress = ref<{ chapter: number; status: string }[]>([]);
const batchPublishFailCount = ref(0);
const batchChapterDetails = ref<Record<number, { title: string; content: string }>>({});

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
const isSelectionLoading = ref(false);
let isSelectionCancelled = false;

const disableComments = ref(false);
const editorHtml = ref("");
const MAX_COUNT = 10000;

// Caption related
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);
// Insert images (illustrations) loaded from the chapter's result_async.insert_images
const captionInsertImages = ref<string[]>([]);

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

// Mention/Topic dropdown
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number; align?: 'right' }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);

const titleError = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const userRegion = ref(false);
const isAdult = ref(false);


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

// Project dropdown ref
const projectDropdownRef = ref<HTMLDivElement | null>(null);

// Sensitive content
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");
const pendingCollectionIdForSensitive = ref<number | null>(null);

// UI state
const showFullContent = ref(false);

const isBatchRoute = computed(() => route.query.batch === 'true');

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
const isNoCollection = ref(true);
const projectNameForNewCollection = ref('');
const projectCoverForNewCollection = ref('');
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
const showBatchPublishProgress = ref(false);
const showBatchPublishFail = ref(false);
const batchPublishChapterStatuses = ref<{ chapter: number; status: 'success' | 'publishing' | 'waiting' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailChapters = ref<{ chapter: number; status: 'success' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailedChapter = ref<number | undefined>(undefined);

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

let isRouteInitialized = false;
  watch(() => route.query, async (newQuery) => {
    if (isRouteInitialized) return;
    const session_id = newQuery.session_id as string;
    if (!session_id) return;
    const isBatch = newQuery.batch === 'true';
    const index = newQuery.index as string;

    isRouteInitialized = true;
    isEditingWork.value = true;
    isInitializing.value = true;

    if (isBatch) {
      await initBatchPublish(session_id);
    } else if (index) {
      await initSingleChapter(session_id, index, newQuery.cover as string, newQuery.title as string);
    }

    isInitializing.value = false;
  }, { immediate: false });

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
      name: t("submit.tabs.novel"),
      path: "/publish/novel",
    },
    {
      name: t("submit.tabs.manhua"),
      path: "/publish/comic",
    },
    {
      name: t("submit.tabs.manju"),
      path: "/publish/video",
    },
    {
      name: t("submit.tabs.photo"),
      path: "/publish/image",
    },
    {
      name: t("submit.tabs.video"),
      path: "/publish/clip",
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

function onTitleInput() {
  if (titleError.value && form.value.title.trim()) {
    titleError.value = false;
  }
}

function handleUserInfoLoaded(userInfo: any) {
  if (userInfo) {
    isAdult.value = userInfo.is_adult == 1;
  }
}

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    }
  }).catch(err => {
    console.log(err);
  })
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
            'Platform': 'web',
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
                'Platform': 'web',
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

const selectedChapters = ref<number[]>([]);

const isBatchPublish = computed(() => selectedChapters.value.length > 1);

const activeBatchPage = ref(0);
const batchChapterTitles = ref<Record<number, string>>({});
const batchChapterContents = ref<Record<number, string>>({});

const batchPermission = ref<'public' | 'partial' | 'private'>('public');
const batchPartialStartChapter = ref<number>(1);
const showBatchChapterDropdown = ref(false);

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
const batchPermOptions = [
  { key: 'public', labelKey: 'submit.permPublic' },
  { key: 'partial', labelKey: 'submit.permPartial' },
  { key: 'private', labelKey: 'submit.permPrivate' },
];

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

function toggleBatchChapterDropdown(event: Event) {
  event.stopPropagation();
  showBatchChapterDropdown.value = !showBatchChapterDropdown.value;
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
  if (chapter) return `${t('chapter', { chapter: chapter.chapter })} ${chapter.title}`;
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

const unpublishedChapters = computed(() =>
  (selectedProject.value?.chapters || []).filter((c: any) => c.is_publish == 2)
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

async function handlePublishFromSelection() {
  if (selectedChapters.value.length === 0) {
    toast(t('submit.selectPublishChapter'));
    return;
  }

  isSelectionLoading.value = true;
  isSelectionCancelled = false;

  if (isBatchPublish.value) {
    const targetProject = selectedProject.value;
    if (!targetProject) { isSelectionLoading.value = false; return; }

    const sessionId = targetProject.session_id;
    if (!sessionId) { isSelectionLoading.value = false; return; }

    const firstChapterNum = selectedChapters.value[0];
    let firstChapterContent = '';
    let firstChapterTitle = '';

    for (const chNum of selectedChapters.value) {
      if (isSelectionCancelled) {
        isSelectionLoading.value = false;
        return;
      }
      try {
        const res = await api.detailChapter(sessionId, chNum) as any;
        if (res.code === 200 && res.data) {
          if (res.data.is_publish === 1) {
            isSelectionLoading.value = false;
            toast(t('submit.image.episodeNotUnpublished'));
            setTimeout(() => { location.reload(); }, 1000);
            return;
          }
          batchChapterContents.value[chNum] = mergeInsertImagesIntoContent(res.data.content || '', res.data.result_async);
          if (chNum === firstChapterNum) {
            firstChapterContent = batchChapterContents.value[chNum];
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

    const chapterText = t('chapter', { chapter: firstChapterNum });
    let generatedTitle = `${chapterText} ${firstChapterTitle || targetProject.name}`;
    selectedEpisode.value = firstChapterNum as any;
    await handlePublish({
      project: targetProject,
      episode: firstChapterNum,
      title: generatedTitle,
      content: firstChapterContent,
      chapterIndex: firstChapterNum,
      session_id: sessionId,
      cover: coverPreview.value || targetProject.result_async?.generate_novel_cover || ''
    });
  } else {
    selectedEpisode.value = selectedChapters.value[0] as any;
    isSelectionLoading.value = false;
    await handlePublish();
  }
}

const cancelSelectionLoading = () => {
  isSelectionCancelled = true;
  isSelectionLoading.value = false;
};

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
      // (render inline <img> illustrations + #tags/@mentions)
      renderSavedCaption(postData.content || "");

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
      return projectData;
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
      content: (captionRef.value ? serializeCaptionContent() : form.value.description).trim(),
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

function updateCaptionStats() {
  if (captionRef.value) {
    const text = captionRef.value.textContent || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }
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

function onCaptionBlur() {
  if (captionRef.value) {
    form.value.description = serializeCaptionContent();
  }
}

// ===== Insert images into the caption content (max 12) =====
const MAX_CAPTION_IMAGES = 12;
const captionImageFileInputRef = ref<HTMLInputElement | null>(null);

// Remember the caret position inside the editor so a later upload can insert there
function saveCaptionRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (captionRef.value && captionRef.value.contains(range.commonAncestorContainer)) {
    lastRange.value = range.cloneRange();
  }
}

function captionImageCount(): number {
  return captionRef.value
    ? captionRef.value.querySelectorAll('img.caption-insert-image').length
    : 0;
}

function triggerCaptionImageUpload() {
  if (captionImageCount() >= MAX_CAPTION_IMAGES) {
    toast(t('novel.maxCoverImages', { max: MAX_CAPTION_IMAGES }));
    return;
  }
  captionImageFileInputRef.value?.click();
}

async function handleCaptionImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;
  const file = files[0];

  if (captionImageCount() >= MAX_CAPTION_IMAGES) {
    toast(t('novel.maxCoverImages', { max: MAX_CAPTION_IMAGES }));
    input.value = '';
    return;
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast(t('novel.invalidCoverImageType'));
    input.value = '';
    return;
  }
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast(t('novel.maxCoverSize', { max: maxSizeMB }));
    input.value = '';
    return;
  }

  // Corrupted image check
  const imageCorrupted = await new Promise<boolean>((resolve) => {
    const testImg = new Image();
    const objUrl = URL.createObjectURL(file);
    testImg.onload = () => { URL.revokeObjectURL(objUrl); resolve(testImg.width === 0 || testImg.height === 0); };
    testImg.onerror = () => { URL.revokeObjectURL(objUrl); resolve(true); };
    testImg.src = objUrl;
  });
  if (imageCorrupted) {
    toast(t('home.error.corruptedImage'));
    input.value = '';
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) { input.value = ''; return; }

  isUpload.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const authHeaders = window.AntiCrawler.generateAuthParams(token);
    const res = await fetch(baseUrl + 'user/uploadImage', {
      method: 'POST',
      headers: { token, 'Platform': 'web', ...authHeaders },
      body: formData,
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === 'string') insertCaptionImage(url);
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (e) {
    console.error('Caption image upload error:', e);
    toast(t('fail'));
  } finally {
    isUpload.value = false;
    input.value = '';
  }
}

// Build an <img> element for an inserted illustration.
// Display a compressed version, keep the original url in data-url.
function buildCaptionImage(url: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = url + '?imageMogr2/format/webp/quality/60';
  img.dataset.url = url;
  img.className = 'caption-insert-image';
  img.setAttribute('contenteditable', 'false');
  return img;
}

// Merge a chapter's [[img_placeholder]] markers with its illustrations
// (result_async.insert_images) so batch-published content carries the same
// <img src="url" /> tags that single publish produces via serializeCaptionContent.
function mergeInsertImagesIntoContent(content: string, resultAsync: any): string {
  if (!content) return content || '';
  let ra = resultAsync;
  if (typeof ra === 'string') {
    try { ra = JSON.parse(ra); } catch (e) { ra = null; }
  }
  const images: string[] = Array.isArray(ra?.insert_images) ? ra.insert_images : [];
  if (images.length === 0) return content;
  let occurrence = 0;
  return content.replace(/\[\[img_placeholder\]\]/g, (match) => {
    const url = images[occurrence++];
    return url ? `<img src="${url}" />` : match;
  });
}

// Serialize the editor content to a string: text as-is, illustrations as
// self-closing <img src="url" /> tags (original url from data-url).
function serializeCaptionContent(): string {
  if (!captionRef.value) return form.value.description || '';
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    if (el.tagName === 'IMG') {
      const url = (el as HTMLImageElement).dataset.url || el.getAttribute('src') || '';
      return `<img src="${url}" />`;
    }
    if (el.tagName === 'BR') return '\n';
    let s = '';
    el.childNodes.forEach((c) => { s += walk(c); });
    return s;
  };
  let out = '';
  captionRef.value.childNodes.forEach((c) => { out += walk(c); });
  return out;
}

// Render the chapter content into the editor, replacing each [[img_placeholder]]
// marker with the matching illustration (in order) from insert_images.
function renderCaptionContent(content: string, images: string[]) {
  if (!captionRef.value) return;
  captionRef.value.innerHTML = '';
  const source = (content || '').replace(/\\n/g, '\n');
  const regex = /\[\[img_placeholder\]\]/g;
  let lastIndex = 0;
  let occurrence = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const textPart = source.slice(lastIndex, match.index);
    if (textPart) captionRef.value.appendChild(document.createTextNode(textPart));
    const url = images[occurrence];
    if (url) {
      captionRef.value.appendChild(buildCaptionImage(url));
    } else {
      captionRef.value.appendChild(document.createTextNode(match[0]));
    }
    occurrence++;
    lastIndex = match.index + match[0].length;
  }
  const tail = source.slice(lastIndex);
  if (tail) captionRef.value.appendChild(document.createTextNode(tail));
  captionLength.value = (captionRef.value.textContent || '').replace(/\n$/, '').length;
}

// Append a plain-text segment to the editor, converting #tags and @mentions
// into non-editable tag spans (used when loading an existing post).
function appendCaptionTextWithTags(text: string) {
  if (!captionRef.value || !text) return;
  const contentLength = text.length;
  let currentIndex = 0;
  let pos = 0;

  while (pos < contentLength) {
    const tagIndex = text.indexOf('#', pos);
    const mentionIndex = text.indexOf('@', pos);

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
      captionRef.value.appendChild(document.createTextNode(text.substring(currentIndex, nextMatchIndex)));
    }

    let endIndex = nextMatchIndex + 1;
    while (endIndex < contentLength) {
      const char = text[endIndex];
      if (char === ' ' || char === '\n' || char === '\t') break;
      endIndex++;
    }

    const span = document.createElement('span');
    span.className = isTag ? 'tag topic' : 'tag mention';
    span.style.color = '#00d3f2';
    span.style.marginRight = '4px';
    span.contentEditable = 'false';
    span.textContent = text.substring(nextMatchIndex, endIndex);
    captionRef.value.appendChild(span);
    captionRef.value.appendChild(document.createTextNode('\u0020'));

    currentIndex = endIndex;
    pos = endIndex;
  }

  if (currentIndex < contentLength) {
    captionRef.value.appendChild(document.createTextNode(text.substring(currentIndex)));
  }
}

// Render a saved post's content into the editor: inline <img ... /> markers
// become illustration elements; the rest is rendered with #tags/@mentions.
function renderSavedCaption(rawContent: string) {
  if (!captionRef.value) return;
  captionRef.value.innerHTML = '';
  const content = (rawContent || '').replace(/\\n/g, '\n');

  const imgRegex = /<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(content)) !== null) {
    appendCaptionTextWithTags(content.slice(lastIndex, match.index));
    // Strip any display-only compression query so the original url is restored
    const url = match[1].split('?')[0];
    captionRef.value.appendChild(buildCaptionImage(url));
    lastIndex = match.index + match[0].length;
  }
  appendCaptionTextWithTags(content.slice(lastIndex));

  captionLength.value = (captionRef.value.textContent || '').replace(/\n$/, '').length;
}

// Insert an uploaded image at the saved caret position inside the editor
function insertCaptionImage(url: string) {
  if (!captionRef.value) return;

  const img = buildCaptionImage(url);

  captionRef.value.focus();
  const selection = window.getSelection();
  let range = lastRange.value;
  // Fall back to the end of the editor if there is no valid saved caret
  if (!range || !captionRef.value.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(captionRef.value);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(img);

  // Move the caret right after the inserted image
  range.setStartAfter(img);
  range.collapse(true);
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  lastRange.value = range.cloneRange();
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

function handleCloseEditCollectionModal() {
  showEditCollectionModal.value = false;
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
  if (isOpeningDropdown.value) return;

  if (showDropdown.value &&
      !document.querySelector(".mention-dropdown")?.contains(target) &&
      !captionRef.value?.contains(target)) {
    showDropdown.value = false;
  }

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

  // Handle batch chapter dropdown
  const batchChapterDropdown = document.querySelector(".partial-chapter-dropdown");
  if (showBatchChapterDropdown.value && batchChapterDropdown && !batchChapterDropdown.contains(target)) {
    showBatchChapterDropdown.value = false;
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
  selectedChapters.value = [];
  showProjectDropdown.value = false;

  if (project.user_selected?.language) {
    collectionLanguage.value = project.user_selected.language;
  } else {
    collectionLanguage.value = defaultLang;
  }

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

async function handleBatchPublishFromModal() {
  if (!selectedProject.value) return;
  if (isSelectionLoading.value) return;
  isSelectionLoading.value = true;
  isSelectionCancelled = false;

  const targetProject = selectedProject.value;
  const sessionId = targetProject.session_id;
  if (!sessionId) { isSelectionLoading.value = false; return; }

  const unpublished = (targetProject.chapters || []).filter((c: any) => c.is_publish !== 1);
  selectedChapters.value = unpublished.map((c: any) => c.chapter);

  if (selectedChapters.value.length === 0 || isSelectionCancelled) {
    isSelectionLoading.value = false;
    return;
  }

  const firstChapterNum = selectedChapters.value[0];
  let firstChapterContent = '';
  let firstChapterTitle = '';

  for (const chNum of selectedChapters.value) {
    if (isSelectionCancelled) {
      isSelectionLoading.value = false;
      return;
    }
    try {
      const res = await api.detailChapter(sessionId, chNum) as any;
      if (res.code === 200 && res.data) {
        if (res.data.is_publish === 1) {
          isSelectionLoading.value = false;
          toast(t('submit.image.episodeNotUnpublished'));
          setTimeout(() => { location.reload(); }, 1000);
          return;
        }
        batchChapterContents.value[chNum] = mergeInsertImagesIntoContent(res.data.content || '', res.data.result_async);
        if (chNum === firstChapterNum) {
          firstChapterContent = batchChapterContents.value[chNum];
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

  const chapterText = t('chapter', { chapter: firstChapterNum });
  let generatedTitle = `${chapterText} ${firstChapterTitle || targetProject.name}`;
  selectedEpisode.value = firstChapterNum as any;
  await handlePublish({
    project: targetProject,
    episode: firstChapterNum,
    title: generatedTitle,
    content: firstChapterContent,
    chapterIndex: firstChapterNum,
    session_id: sessionId,
    cover: coverPreview.value || targetProject.result_async?.generate_novel_cover || ''
  });
}

function handleBatchPublishAllSuccess(count: number) {
  const sid = selectedProject.value?.session_id || (route.query.session_id as string);
  toast(t('novel.batchPublish.allPublishSuccess', { count, unit: t('novel.batchPublish.allPublishSuccessUnitChapter') }));
  router.push(`/user-home?id=${uid}&type=2`);
}

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

  await runBatchPublishLoop();
}

async function runBatchPublishLoop() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  const session_id = selectedProject.value?.session_id || (route.query.session_id as string);
  const collectionStart = parseInt(selectedEpisodeNumber.value) || 1;

  for (let i = 0; i < selectedChapters.value.length; i++) {
    // 跳过已发布成功的章节，仅重试失败/未发布的
    if (batchPublishChapterStatuses.value[i]?.status === 'success') {
      continue;
    }

    const chapterNum = selectedChapters.value[i];
    const collectionChapterIndex = collectionStart + i;

    batchPublishChapterStatuses.value[i].status = 'publishing';

    try {
      let content = batchChapterContents.value[chapterNum] || batchChapterDetails.value[chapterNum]?.content || '';
      let title = batchChapterTitles.value[chapterNum] || getBatchChapterTitle(chapterNum);

      const accessRights = batchPermission.value === 'partial'
        ? (collectionChapterIndex >= batchPartialStartChapter.value ? 2 : 1)
        : batchPermission.value === 'private' ? 3 : 1;

      const payload = {
        type: 2,
        title: title.substring(0, 60),
        cover: coverPreview.value || (selectedCollection.value?.cover || ''),
        content: content,
        is_nsfw: selectedCollection.value?.is_nsfw ?? 0,
        access_rights: accessRights,
        book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
        chapter_index: collectionChapterIndex,
        ...(session_id ? { session_id } : {}),
        ai_chapter_index: chapterNum,
      };

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
          if (batchPublishChapterStatuses.value[j].status !== 'success') {
            batchPublishChapterStatuses.value[j].status = 'unpublished';
          }
        }
        break;
      }
    } catch (error) {
      console.error(`Error publishing chapter ${chapterNum}:`, error);
      batchPublishChapterStatuses.value[i].status = 'fail';
      for (let j = i + 1; j < selectedChapters.value.length; j++) {
        if (batchPublishChapterStatuses.value[j].status !== 'success') {
          batchPublishChapterStatuses.value[j].status = 'unpublished';
        }
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
      status: c.status as 'success' | 'fail' | 'unpublished'
    }));
    const failItem = batchPublishChapterStatuses.value.find(c => c.status === 'fail');
    batchPublishFailedChapter.value = failItem?.chapter;
    showBatchPublishFail.value = true;
  }
}

function handleBatchPublishExit() {
  const sid = selectedProject.value?.session_id || (route.query.session_id as string);
  showBatchPublishFail.value = false;
  router.push(`/user-home?id=${uid}&type=2`);
}

function handleBatchPublishRetry() {
  // 将失败/未发布的章节重置为等待状态，保留已成功的章节
  batchPublishChapterStatuses.value.forEach(item => {
    if (item.status !== 'success') {
      item.status = 'waiting';
    }
  });
  showBatchPublishFail.value = false;
  showBatchPublishProgress.value = true;
  runBatchPublishLoop();
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

    // Fetch episode content from API and check publish status
    let episodeContent = `This is the content for episode ${targetEpisode} of ${targetProject.name}.`;
    if (targetProject.session_id) {
      try {
        const res = await api.detailChapter(targetProject.session_id, targetEpisode) as any;
        if (res.code === 200 && res.data) {
          if (res.data.is_publish === 1) {
            toast(t('submit.image.episodeNotUnpublished'));
            setTimeout(() => { location.reload(); }, 1000);
            return;
          }
          if (res.data.content) {
            episodeContent = res.data.content;
          }
        }
      } catch (error) {
        console.error('Error fetching chapter content:', error);
      }
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
  const currentSessionId = publishData?.session_id || selectedProject.value?.session_id;
  projectNameForNewCollection.value = projectName || '';
  projectCoverForNewCollection.value = coverPreview.value || selectedProject.value?.result_async?.generate_novel_cover || '';
  if (projectName) {
    try {
      let searchRes: any = null;
      if (currentSessionId) {
        searchRes = await api.searchSessionId({ session_id: currentSessionId, type: 2 }) as any;
      }
      if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
        searchRes = await api.searchFullCollection({ title: projectName, type: 2 }) as any;
      }

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          const collectionCover = selectedProject.value?.result_async?.generate_novel_cover || '';
          const storySummary = (publishData?.project?.result_async?.generate_novel_outline?.story_summary?.summary
            || selectedProject.value?.result_async?.generate_novel_outline?.story_summary?.summary
            || '').slice(0, 1000);
          const collectionDescription = storySummary || t('collection.defaultDescription');
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
          const collectionRes = await api.singleCollectionIndex(book_id) as any;

          if (collectionRes.code == 0 && collectionRes.data) {
            const allnums = collectionRes.data.count || 0;
            const episodeNumber = parseInt(allnums) + 1;

            selectedCollection.value = {
              id: book_id,
              name: searchRes.data?.book_info?.title || projectName,
              cover: searchRes.data?.book_info?.cover,
              description: searchRes.data?.book_info?.description,
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
async function initSingleChapter(session_id: string, index: string, cover: string, title: string) {
  let projectDetailData: any = null;
  try {
    try {
      projectDetailData = await fetchProjectDetails(session_id);
    } catch (error) {
      console.error('Error fetching project details:', error);
    }

    const res = await api.detailChapter(session_id, parseInt(index)) as any;
    if (res.code === 200 && res.data && res.data.content) {
      if (res.data.title) {
        const chapterNumber = t('chapter', { chapter: index });
        form.value.title = `${chapterNumber} ${res.data.title}`;
      } else {
        form.value.title = `${t('chapter', { chapter: index })}`;
      }
      form.value.description = res.data.content;

      // Capture insert images (illustrations) from result_async for [[img_placeholder]] markers
      let ra = res.data.result_async;
      if (typeof ra === 'string') {
        try { ra = JSON.parse(ra); } catch (e) { ra = null; }
      }
      captionInsertImages.value = Array.isArray(ra?.insert_images) ? ra.insert_images : [];

      if (cover) {
        coverPreview.value = cover;
        hasUrlCover.value = true;
      } else {
        await generateAndUploadCover();
      }

      async function generateAndUploadCover() {
        generateCoverFromTitle();

        const token = localStorage.getItem("token");
        if (token) {
          isUpload.value = true;
          try {
            if (coverPreview.value.startsWith('data:image/')) {
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
                  'Platform': 'web',
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
                toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : locale.value == 'zh' ? data.msg_jp : data.msg_jp)
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

      showFullContent.value = true;

      setTimeout(() => {
        if (captionRef.value) {
          // Render content with [[img_placeholder]] markers replaced by illustrations
          renderCaptionContent(form.value.description, captionInsertImages.value);
        }
      }, 0);

      if (title) {
        projectNameForNewCollection.value = title;
        projectCoverForNewCollection.value = coverPreview.value || '';
        try {
          let searchRes: any = null;
          if (session_id) {
            searchRes = await api.searchSessionId({ session_id, type: 2 }) as any;
          }
          if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
            searchRes = await api.searchFullCollection({ title, type: 2 }) as any;
          }

          if (searchRes.code == 0) {
            const book_id = searchRes.data?.book_id || 0;

            if (book_id == 0) {
              const collectionCover = cover || selectedProject.value?.result_async?.generate_novel_cover || '';
              const storySummary = (projectDetailData?.result_async?.generate_novel_outline?.story_summary?.summary
                || selectedProject.value?.result_async?.generate_novel_outline?.story_summary?.summary
                || '').slice(0, 1000);
              const collectionDescription = storySummary || t('collection.defaultDescription');
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
              const collectionRes = await api.singleCollectionIndex(book_id) as any;

              if (collectionRes.code == 0 && collectionRes.data) {
                const allnums = collectionRes.data.count || 0;
                const episodeNumber = parseInt(allnums) + 1;

                selectedCollection.value = {
                  id: book_id,
                  name: searchRes.data?.book_info?.title || title,
                  cover: searchRes.data?.book_info?.cover,
                  description: searchRes.data?.book_info?.description,
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
          console.error('Error handling collection from route:', error);
        }
      }

      await checkSubscriptionStatus();
    }
  } catch (error) {
    console.error('Error fetching chapter details:', error);
    await fetchProjects();
    await checkSubscriptionStatus();
  }
}

async function initBatchPublish(session_id: string) {
  const batchIndexesRaw = route.query.indexes as string;
  const batchCover = route.query.cover as string;
  const batchName = route.query.name as string;
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
      if (projectRes.data.result_async?.generate_novel_cover) {
        projectCover.value = projectRes.data.result_async.generate_novel_cover;
      }
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
  }

  if (batchCover) {
    coverPreview.value = batchCover;
    hasUrlCover.value = true;
  } else if (projectCover.value) {
    coverPreview.value = projectCover.value;
    hasUrlCover.value = true;
  }

  const projectTitle = batchName || selectedProject.value?.name || '';
  if (projectTitle) {
    projectNameForNewCollection.value = projectTitle;
  }

  isBatchPublishMode.value = true;
  batchPublishIndexes.value = batchIndexes;
  batchPublishCurrentIndex.value = 0;
  batchPublishTotal.value = batchIndexes.length;
  batchPublishProgress.value = [];
  batchPublishFailCount.value = 0;

  selectedChapters.value = batchIndexes;

  let hasChapterError = false;
  for (const chapterIndex of batchIndexes) {
    try {
      const res = await api.detailChapter(session_id, chapterIndex) as any;
      if (res.code === 200 && res.data) {
        batchChapterDetails.value[chapterIndex] = {
          title: res.data.title || '',
          content: mergeInsertImagesIntoContent(res.data.content || '', res.data.result_async)
        };
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
        searchRes = await api.searchSessionId({ session_id, type: 2 }) as any;
      }
      if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
        searchRes = await api.searchFullCollection({ title: projectTitle, type: 2 }) as any;
      }

      if (searchRes.code == 0) {
        const book_id = searchRes.data?.book_id || 0;

        if (book_id == 0) {
          const collectionCover = batchCover || selectedProject.value?.result_async?.generate_novel_cover || '';
          const storySummary = (selectedProject.value?.result_async?.generate_novel_outline?.story_summary?.summary || '').slice(0, 1000);
          const collectionDescription = storySummary || t('collection.defaultDescription');
          const projectStoryMode = selectedProject.value?.user_selected?.story_mode || selectedProject.value?.story_mode || 'normal';
          const collectionIsNsfw = projectStoryMode == 'nsfw' ? 1 : 0;

          const createRes = await api.addCollection({
            title: projectTitle,
            type: 2,
            cover: collectionCover,
            description: collectionDescription,
            is_nsfw: collectionIsNsfw
          }) as any;

          if (createRes.code == 0 && createRes.data?.book_id) {
            selectedCollection.value = {
              id: createRes.data.book_id,
              name: projectTitle,
              cover: collectionCover,
              description: collectionDescription,
              is_nsfw: collectionIsNsfw
            };
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
              cover: searchRes.data?.book_info?.cover,
              description: searchRes.data?.book_info?.description,
              is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0
            };
            selectedEpisodeNumber.value = episodeNumber.toString();
            isNoCollection.value = false;
          }
        }
      }
    } catch (error) {
      console.error('Error setting up collection:', error);
    }
  }

  isLoadingBatchPublish.value = false;
  showFullContent.value = true;
  await fetchCollections(false);
}

  onMounted(async () => {
    document.addEventListener("click", handleClickOutside);

    checkSubscriptionStatus();

    if (postId.value) {
      isInitializing.value = true;
      showFullContent.value = true;
      isEditingWork.value = true;
      await getPostDetails();
      await fetchCollections(false);
      isInitializing.value = false;
    } else {
      const session_id = route.query.session_id as string;
      const index = route.query.index as string;
      const cover = route.query.cover as string;
      const title = route.query.title as string;
      const isBatch = route.query.batch === 'true';

      if (isBatch && session_id) {
        isInitializing.value = true;
        isEditingWork.value = true;
        await initBatchPublish(session_id);
        isInitializing.value = false;
        return;
      }

      if (session_id) {
        isEditingWork.value = true;
      }

      if (session_id && index) {
        isInitializing.value = true;
        await initSingleChapter(session_id, index, cover, title);
        isInitializing.value = false;
      } else {
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

<style lang="scss">
 @use '@/scss/Novel.scss';
</style>
