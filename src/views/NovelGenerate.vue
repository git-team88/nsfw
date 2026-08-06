<template>
  <div class="novel-generate-page" @click="closeDropdowns">

    <div class="left-panel">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Logo -->
      <div class="logo" @click="checkOutlineEditBeforeAction(goHome)">
        <img src="@/assets/images/novel/logo.png" alt="Logo" />
      </div>

      <!-- Navigation -->
      <div class="nav-item" @click="checkOutlineEditBeforeAction(goHome)">
        <img src="@/assets/images/novel/home.png" alt="Home" />
        <span>{{ t("header.title1") }}</span>
      </div>

      <div class="nav-item last" @click="checkOutlineEditBeforeAction(goProject)">
        <img src="@/assets/images/novel/project.png" alt="Project" />
        <span>{{ t("header.title3") }}</span>
      </div>

      <!-- User Avatar -->
      <div class="user-avatar" @click="checkOutlineEditBeforeAction(goUser)">
        <img :src="userInfo?.info?.avatar || defaultAvatar" alt="Avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
      </div>
    </div>

    <!-- Access Denied Overlay -->
    <div v-if="isAccessDenied" class="access-denied-overlay">
      <img class="access-denied-icon" src="@/assets/images/novel/lock.png" alt="" />
      <span class="access-denied-title">{{ t('novel.accessDeniedTitle') }}</span>
      <span class="access-denied-desc">{{ t('novel.accessDeniedDesc') }}</span>
      <button class="access-denied-btn" @click="goHome">{{ t('novel.accessDeniedBtn') }}</button>
    </div>

    <!-- Left Area -->
    <div v-if="!isAccessDenied" class="left-area">
      <!-- Project Name with Edit Icon -->
      <div class="project-name-section">
        <div class="project-name">
          <span v-if="!isEditingName" class="project-name-display">{{ projectName || t('novel.untitled') }}</span>
          <div v-else class="project-name-edit-container">
            <div class="project-name-input-wrapper">
              <input type="text" v-model="projectName" class="project-name-input" ref="projectNameInputRef" spellcheck="false" maxlength="60" @blur="handleProjectNameBlur" />
              <span class="project-name-counter">{{ projectName.length }}/60</span>
            </div>
               <div class="edit-actions">
              <button class="save-icon" @mousedown.prevent="checkOutlineEditBeforeAction(saveProjectName)"><img src="@/assets/images/novel/check.png" alt="Save" /></button>
              <button class="cancel-icon" @mousedown.prevent="checkOutlineEditBeforeAction(cancelEditProjectName)"><img src="@/assets/images/novel/cancel.png" alt="Cancel" /></button>
            </div>
          </div>
          <button v-if="!isEditingName" class="edit-icon" @click="checkOutlineEditBeforeAction(startEditProjectName)"><img src="@/assets/images/novel/edit.png" alt="Edit" /></button>
        </div>
      </div>

      <div class="left-content">
        <div class="scrollable-content">
          <!-- Generation Status -->
          <!-- <div v-if="shouldShowEstimatedTime" class="generation-status">
            <span class="status-text">{{ t('novel.generatingStatus') }}</span>
            <button class="similar-content-btn" @click="goToSimilar()">{{ t('novel.similarContent') }}</button>
          </div> -->

          <!-- Generation Status / Progress / Chapters -->
          <div v-if="taskStatus == 'DOING' || taskStatus == 'FAIL' || isPreparing" class="progress-section">
            <div class="progress-item" v-if="taskStatus == 'FAIL'">
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
              </div>

              <div class="progress-content">
                <span class="progress-label">{{ currentStepName == 'outline' ? t('novel.novelOutline') : t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot error" src="@/assets/images/novel/fail_icon.png" alt="" />
                  <span class="status-text error">{{ t('novel.generationFailed') }}</span>
                </div>
              </div>
            </div>

            <div class="progress-item" v-else-if="(queueInfo || prepareQueueInfo) && taskStatus != 'DOING'">
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time" v-if="((queueInfo || prepareQueueInfo)?.count ?? 0) > 0">
                  {{ t('novel.queueInfo', { count: (queueInfo || prepareQueueInfo)?.count, estimatedTime: Math.max(displayMinutes, 1) }) }}
                </span>
                <span class="progress-time" v-else>
                  {{ t('novel.estimatedMinutes', { minutes: Math.max(displayMinutes, 1) }) }}
                </span>
              </div>

              <div class="progress-content">
                <span class="progress-label">{{ currentStepName == 'outline' ? t('novel.novelOutline') : t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot" src="@/assets/images/novel/doing.png" alt="" />
                  <span class="status-text">{{ t('novel.waiting') }}</span>
                </div>
              </div>
            </div>

            <div class="progress-item" v-else-if="generatingChapter">
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time">
                  {{ t('novel.estimatedMinutes', { minutes: Math.max(displayMinutes, 1) }) }}
                </span>

              </div>

              <div class="progress-content">
                <span class="progress-label">{{ t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot on" src="@/assets/images/novel/load.png" alt="Loading" />
                  <span class="status-text">{{ isPreparing ? t('novel.waiting') : t('novel.generating') }}</span>
                </div>
              </div>
            </div>

            <div class="progress-item" v-else>
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time">
                  {{ t('novel.estimatedMinutes', { minutes: Math.max(displayMinutes, 1) }) }}
                </span>
              </div>

              <div class="progress-content">
                <span class="progress-label">{{ currentStepName == 'outline' ? t('novel.novelOutline') : t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot on" src="@/assets/images/novel/load.png" alt="Loading" />
                  <span class="status-text">{{ isPreparing ? t('novel.waiting') : t('novel.generating') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="outlineData && taskStatus == 'SUCCESS' && chapterCount > stepChapterIndex && !(isBatchChapter == 1 || isUserInitiatedGeneration)" class="text-wrapper-1">
            <span class="text_3">{{ t('novel.chaptersToGenerate', { count: chapterCount - stepChapterIndex }) }}</span>
            <!-- <span class="text_4" :class="{ loading: isConfirmAllLoading }" @click="() => confirmGenerateAllChapters()">
              {{ t('novel.generateAllChapters') }}
              <span v-if="isConfirmAllLoading" class="btn-spinner btn-spinner-small"></span>
            </span> -->
          </div>

          <!-- Novel Outline Preview -->
          <div
            v-if="isDetailLoaded"
            class="outline-preview"
            @click="checkOutlineEditBeforeAction(handleOutlinePreviewClick)"
            :class="{ 'disabled': !outlineData || !outlineData.outline, 'active': !currentChapter, 'end': taskStatus == 'SUCCESS' && chapterCount > 0 && stepChapterIndex >= chapterCount }"
            :disabled="!outlineData || !outlineData.outline"
          >
            <span class="preview-title">{{ t('novel.novelOutline') }}</span>
            <button
              v-if="unpublishedChapterCount >= 2"
              class="batch-publish-btn"
              :class="{ loading: isBatchPublishBtnLoading }"
              :disabled="isBatchPublishBtnLoading"
              @click.stop="handleBatchPublishClick"
            >{{ t('novel.batchPublish.batchPublish') }}<span v-if="isBatchPublishBtnLoading" class="btn-spinner btn-spinner-small"></span></button>
          </div>

          <!-- Chapter List -->
          <div v-if="chapters.length > 0" class="chapter-list">
            <div
              v-for="chapter in chapters"
              :key="chapter.id"
              class="chapter-item"
              :class="{ 'on': currentChapter && currentChapter.chapter == chapter.chapter, 'published': chapter.is_publish == 1 }"
              @click="checkOutlineEditBeforeAction(() => handleChapterItemClick(chapter.chapter))"
            >
              <div v-if="!editingChapterId || editingChapterId !== chapter.chapter" class="chapter-item-content">
                <span class="chapter-item-label">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                <span class="chapter-item-title">{{ chapter.title }}</span>

                <button
                  v-if="chapter.is_publish == 2 && !(taskStatus == 'DOING' && chapter.chapter == stepChapterIndex) && !(taskStatus == 'FAIL' && chapter.chapter == stepChapterIndex) && !(isPreparing && chapter.chapter == stepChapterIndex)"
                  class="edit-chapter-btn"
                  @click.stop="checkOutlineEditBeforeAction(() => startEditChapterTitle(chapter.chapter, chapter.title))"
                ><img src="@/assets/images/novel/edit.png" alt="Edit" /></button>
                <button
                  v-if="chapter.is_publish == 2 && !(taskStatus == 'DOING' && chapter.chapter == stepChapterIndex) && !(taskStatus == 'FAIL' && chapter.chapter == stepChapterIndex)"
                  class="chapter-publish-btn unpublish"
                  @click.stop="checkOutlineEditBeforeAction(() => handlePublishChapter(chapter))"
                >{{ t('novel.publish') }}</button>
                <button
                  v-else-if="chapter.is_publish == 1"
                  class="chapter-publish-btn published"
                >{{ t('novel.published') }}</button>

              </div>
              <div v-else class="chapter-title-edit" @click.stop>
                <div class="chapter-edit-content">
                  <span class="chapter-item-label">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                  <input
                    type="text"
                    v-model="editingChapterTitle"
                    class="chapter-title-input"
                    @input="editingChapterTitle = editingChapterTitle.substring(0, 60)"
                    @blur="handleChapterTitleBlur"
                    :maxlength="60"
                    :ref="el => chapterTitleInputs[chapter.chapter] = el"
                  />
                  <span class="chapter-title-counter">{{ editingChapterTitle.length }}/60</span>
                </div>
                <div class="chapter-edit-actions">
                  <button
                    class="edit-action-btn cancel-edit"
                    @mousedown.prevent="cancelChapterTitle"
                  ><img src="@/assets/images/novel/cancel.png" alt="Cancel" /></button>
                  <button
                    class="edit-action-btn save-edit"
                    @mousedown.prevent="saveChapterTitle(chapter.chapter)"
                  ><img src="@/assets/images/novel/check.png" alt="Save" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Regenerate Input Section - Fixed at bottom -->
        <div v-if="showRegenerateInput" class="regenerate-section">
          <div class="regenerate-header">
            <span class="regenerate-title">{{ t('novel.regenerate') }}:</span>
            <button class="cancel-regenerate-btn" @click="cancelRegenerate">{{ t('novel.cancel') }}</button>
          </div>

          <div class="regenerate-content">
            <textarea v-model="regenerateContent" class="regenerate-textarea" :placeholder="t('novel.outlinePlaceholder')" @input="handleRegenerateInput"></textarea>

            <div class="regenerate-footer">
              <div class="regenerate-settings">
                <!-- NSFW Toggle - only shown when region allows -->
                <div v-if="userRegion" class="nsfw-toggle" @click="toggleRegenerateNsfw">
                  <span class="nsfw-btn" :class="{ on: regenerateNsfwMode }">
                    <span class="nsfw-dot"></span>
                    NSFW
                  </span>
                </div>

                <!-- Word Count Selector -->
                <div class="novel-selector icon-selector" @click.stop="toggleWordCountDropdown" :class="{ open: showWordCountDropdown }">
                  <div class="selector-header">
                    <img class="selector-icon" src="@/assets/images/novel/word.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showWordCountDropdown">
                    <div
                      v-for="count in wordCountOptions"
                      :key="count"
                      class="dropdown-item"
                      :class="{ active: selectedWordCount == count }"
                      @click.stop="selectWordCount(count)"
                    >
                      <span>{{ count }}</span>
                    </div>
                  </div>
                </div>

                <!-- Language Selector -->
                <div class="novel-selector icon-selector" @click.stop="toggleLanguageDropdown" :class="{ open: showLanguageDropdown }">
                  <div class="selector-header">
                    <img class="selector-icon" src="@/assets/images/novel/lang.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showLanguageDropdown">
                    <div
                      v-for="lang in languageOptions"
                      :key="lang.value"
                      class="dropdown-item"
                      :class="{ active: selectedLanguage == lang.value }"
                      @click.stop="selectLanguage(lang.value)"
                    >
                      <span>{{ lang.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- Insert Image Selector - only show when region allows and NSFW mode is on -->
                <div v-if="userRegion && regenerateNsfwMode" class="novel-selector icon-selector" @click.stop="toggleInsertImageDropdown" :class="{ open: showInsertImageDropdown }">
                  <div class="selector-header">
                    <img class="selector-icon" src="@/assets/images/novel/pic.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showInsertImageDropdown">
                    <div
                      v-for="option in insertImageOptions"
                      :key="option.value"
                      class="dropdown-item"
                      :class="{ active: selectedInsertImage == option.value }"
                      @click.stop="selectInsertImage(option.value)"
                    >
                      <span>{{ option.label }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="send-btn" :class="{ loading: isSendingRegenerate }" @click="sendRegenerateRequest">
                <span v-if="!isSendingRegenerate" class="send-btn-cost">{{ regenerateCost }}</span>
                <img v-if="!isSendingRegenerate" class="send-btn-coin" src="@/assets/images/novel/coin.png" alt="" />
                <div v-if="isSendingRegenerate" class="btn-spinner-wrapper"><span class="btn-spinner"></span></div>
              </button>
            </div>
          </div>


        </div>

        <!-- Cover Edit Section - Fixed at bottom -->
        <div v-if="isEditingCover" class="cover-edit-section" ref="coverEditSectionRef">
          <div>
            <div class="cover-edit-header">
              <span class="cover-edit-title">{{ t('novel.editCover') }}:</span>
              <button class="cancel-cover-edit-btn" @click="toggleCoverEdit">{{ t('novel.cancel') }}</button>
            </div>

            <div class="cover-edit-content">
              <!-- Input Area -->
              <div class="input-area">
                <div class="input-inner">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedCoverItems.length > 0">
                    <!-- Combined Items -->
                    <div
                      v-for="(item, index) in combinedCoverItems"
                      :key="item.id"
                      :class="['item-tag', 'uploaded-image-item']"
                    >
                      <span class="image-index">{{ uploadedCoverImages.findIndex(img => img.id == item.id) + 1 }}</span>

                      <span class="image-name">{{ t('novel.image') }}{{ uploadedCoverImages.findIndex(img => img.id == item.id) + 1 }}</span>

                      <div class="image-box">
                        <img :src="item.image" :alt="item.name" class="uploaded-image" />
                        <span class="img-bg"></span>
                      </div>

                      <button class="remove-btn" @click="removeUploadedCoverImage(item.id)"><img src="@/assets/images/home/remove.png" alt="Remove" /></button>
                    </div>
                  </div>

                  <div
                    ref="coverInputRef"
                    class="input-textarea"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleCoverInput"
                    @keydown="handleCoverKeydown"
                    @click="handleCoverInputClick"
                    @blur="handleCoverInputBlur"
                    @paste="handleCoverPaste"
                    @focus="handleCoverInputFocus"
                    :data-placeholder="t('novel.coverInputPlaceholder')"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="coverFileInputRef"
                    type="file"
                    accept="image/*"
                    class="file-input"
                    style="display: none;"
                    @change="handleCoverFileChange"
                  />

                  <!-- @ Dropdown -->
                  <div v-if="showCoverAtDropdown" class="at-dropdown">
                    <div
                      v-for="(item, index) in coverAtDropdownItems"
                      :key="index"
                      class="dropdown-item"
                      @mousedown.prevent="selectCoverAtItem(item)"
                    >
                      <div class="dropdown-img">
                        <img :src="item.image" :alt="item.name" />
                      </div>
                      <span>{{ t('home.img') }}{{ uploadedCoverImages.findIndex(img => img.id == item.id) + 1 }}</span>
                    </div>
                  </div>

                  <div class="input-box">
                    <div class="input-options">
                      <button class="option-btn reference-btn" @click="() => { if (checkLogin() && checkCoverItemLimit()) triggerCoverFileUpload() }">
                        <img src="@/assets/images/novel/upload.png" alt="" />
                      </button>
                    </div>

                    <button class="generate-btn" @click="generateNovelCover">
                      <span class="send-btn-cost">{{ coverCost }}</span>
                      <img class="send-btn-coin" src="@/assets/images/novel/coin.png" alt="" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Insert Image Edit Section - Fixed at bottom -->
        <div v-if="showInsertImageEdit" class="insert-image-edit-section">
          <div class="insert-image-edit-header">
            <span class="insert-image-edit-title">{{ t('novel.editImageTitle') }}:</span>
            <button class="cancel-insert-image-edit-btn" @click="cancelInsertImageEdit">{{ t('novel.cancel') }}</button>
          </div>

          <div class="insert-image-edit-content">
            <!-- Uploaded reference images -->
            <div class="insert-image-ref-list" v-if="insertImageRefImages.length > 0">
              <div v-for="img in insertImageRefImages" :key="img.id" class="insert-image-ref-item">
                <img :src="img.image" alt="" class="insert-image-ref-thumb" />
                <button class="insert-image-ref-remove" @click="removeInsertImageRefImage(img.id)"><img src="@/assets/images/home/remove.png" alt="Remove" /></button>
              </div>
            </div>

            <div class="insert-image-input-inner">
              <div
                ref="insertImageInputRef"
                class="insert-image-input"
                contenteditable="true"
                spellcheck="false"
                @input="handleInsertImageInput"
                @keydown="handleInsertImageKeydown"
                @click="handleInsertImageInputClick"
                @blur="handleInsertImageInputBlur"
                @paste="handleInsertImagePaste"
                @focus="handleInsertImageInputFocus"
                @compositionstart="isInsertImageComposing = true"
                @compositionend="isInsertImageComposing = false"
                :data-placeholder="t('novel.insertImageEditPlaceholder')"
              ></div>

              <!-- @ Dropdown -->
              <div v-if="showInsertImageAtDropdown" class="at-dropdown">
                <div
                  v-for="(item, index) in insertImageAtDropdownItems"
                  :key="index"
                  class="dropdown-item"
                  @mousedown.prevent="selectInsertImageAtItem(item)"
                >
                  <div class="dropdown-img">
                    <img :src="item.image" :alt="item.name || ''" />
                  </div>
                  <span>{{ t('home.img') }}{{ insertImageRefImages.findIndex(img => img.id == item.id) + 1 }}</span>
                </div>
              </div>
            </div>

            <!-- Hidden file input for reference image upload -->
            <input
              ref="insertImageFileInputRef"
              type="file"
              accept="image/*"
              style="display: none;"
              @change="handleInsertImageFileChange"
            />

            <div class="insert-image-edit-footer">
              <button class="insert-image-upload-btn" @click="() => { if (checkLogin()) triggerInsertImageFileUpload() }">
                <img src="@/assets/images/novel/upload.png" alt="" />
              </button>
              <button class="insert-image-edit-send-btn" :class="{ loading: isRenewingInsertImage }" @click="generateInsertImage">
                <span v-if="!isRenewingInsertImage" class="send-btn-cost">{{ insertImageCost }}</span>
                <img v-if="!isRenewingInsertImage" class="send-btn-coin" src="@/assets/images/novel/coin.png" alt="" />
                <div v-else class="btn-spinner-wrapper"><span class="btn-spinner"></span></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Outline AI Edit Section - Fixed at bottom -->
        <div v-if="isAiEditingOutline" class="outline-edit-section" ref="outlineEditSectionRef">
          <div class="outline-edit-header">
            <span class="outline-edit-title">{{ t('novel.editOutline') }}:</span>
            <button class="cancel-outline-edit-btn" @click="cancelAiEditOutline">{{ t('novel.cancel') }}</button>
          </div>

          <div class="outline-edit-content">
            <div class="outline-edit-input-area">
              <textarea v-model="aiEditOutlineInput" class="outline-edit-textarea" :placeholder="t('novel.outlineEditPlaceholder')" @input="handleOutlineEditInput"></textarea>

              <div class="outline-edit-footer">
                <button class="outline-edit-send-btn" :class="{ loading: isSendingOutlineEdit }" @click="sendAiEditOutlineRequest">
                  <span v-if="!isSendingOutlineEdit" class="send-btn-cost">{{ outlineEditCost }}</span>
                  <img v-if="!isSendingOutlineEdit" class="send-btn-coin" src="@/assets/images/novel/coin.png" alt="" />
                  <div v-if="isSendingOutlineEdit" class="btn-spinner-wrapper"><span class="btn-spinner"></span></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chapter AI Edit Section -->
        <div v-if="isAiEditingChapter" class="outline-edit-section" ref="chapterEditSectionRef">
          <div class="outline-edit-header">
            <span class="outline-edit-title">{{ t('novel.editChapterTitle', { chapter: currentChapter?.chapter }) }}:</span>
            <button class="cancel-outline-edit-btn" @click="cancelAiEditChapter">{{ t('novel.cancel') }}</button>
          </div>

          <div class="outline-edit-content">
            <div class="outline-edit-input-area">
              <textarea v-model="aiEditChapterInput" class="outline-edit-textarea" :placeholder="t('novel.chapterEditPlaceholder')" @input="handleAiEditChapterInput"></textarea>

              <div class="outline-edit-footer">
                <button class="outline-edit-send-btn" :class="{ loading: isSendingChapterEdit }" @click="sendAiEditChapterRequest">
                  <span v-if="!isSendingChapterEdit" class="send-btn-cost">{{ chapterEditCost }}</span>
                  <img v-if="!isSendingChapterEdit" class="send-btn-coin" src="@/assets/images/novel/coin.png" alt="" />
                  <div v-if="isSendingChapterEdit" class="btn-spinner-wrapper"><span class="btn-spinner"></span></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Right Area -->
    <div v-if="!isAccessDenied" class="right-area">
      <!-- Top Bar with Credit -->
      <div class="right-top-bar">
         <div class="header-bean" @click="checkOutlineEditBeforeAction(goRechargeDetail)">
           <img src="../assets/images/header/bean_icon.png" alt="" />
            <span>{{ userBalance.toLocaleString() }}</span>
         </div>

         <span class="header-line"></span>

         <button class="header-recharge" @click="checkOutlineEditBeforeAction(goRecharge)">{{ t("header.recharge") }}</button>
      </div>

      <!-- Novel Outline -->
      <div class="novel-outline">
        <div class="outline-title">
          <h2 v-if="isDetailLoaded && !currentChapter">{{ t('novel.novelOutline') }}</h2>
          <div v-else-if="isDetailLoaded && currentChapter && isEditingChapter" class="chapter-title-edit-row">
            <span class="chapter-title-edit-label">{{ t('novel.chapter', { chapter: currentChapter.chapter }) }}</span>
            <input v-model="editingChapterTitle" class="chapter-title-edit-input" :maxlength="60" :placeholder="t('novel.chapterTitlePlaceholder')" />
            <span class="chapter-title-edit-counter">{{ editingChapterTitle.length }}/60</span>
          </div>
          <h2 v-else-if="isDetailLoaded && currentChapter && isLoading">{{ t('novel.chapter', { chapter: currentChapter.chapter }) }}</h2>
          <h2 v-else-if="isDetailLoaded && currentChapter">{{ t('novel.chapter', { chapter: currentChapter.chapter }) }} {{ currentChapter.title }}</h2>
           <div v-if="!isLoading && (outlineData || outlineStreamDone) && !hasFailed && !currentChapter && taskStatus !== 'DOING' && stepChapterIndex < 1 && !isPreparing && !isManualEditingOutline" class="outline-actions">
             <button v-if="hasFailed ? outlineHistoryList.length >= 1 : outlineHistoryList.length >= 2" class="outline-history-btn" @click="handleOutlineHistoryClick">{{ t('novel.outlineHistoryTitle') }}</button>
             <button class="regenerate-btn" @click="regenerateOutline">
               {{ t('novel.regenerate') }}
             </button>
             <button class="manual-edit-btn" @click="startManualEditOutline">
               {{ t('novel.manualEdit') }}
             </button>
             <button class="ai-edit-btn" @click="startAiEditOutline">
               {{ t('novel.aiEdit') }}
             </button>
                <div class="outline-edit-tooltip-icon">
                  <img src="@/assets/images/novel/intro.png" alt="" />
                  <div class="outline-edit-tooltip">{{ t('novel.outlineEditTooltip') }}</div>
                </div>
          </div>
          <template v-else-if="currentChapter">
            <div v-if="!isEditingChapter && taskStatus !== 'DOING' && !isChapterTyping && !isPreparing && !isLoading && renewingInsertImagePlaceholder === null" class="chapter-actions">
              <button v-if="hasFailed ? chapterHistoryCount >= 1 : chapterHistoryCount >= 2" class="chapter-history-btn" @click="handleChapterHistoryClick">{{ t('novel.chapterHistoryTitle') }}</button>
              <template v-if="!hasFailed">
              <button class="manual-edit-btn" @click="startEditChapter">{{ t('novel.manualEdit') }}</button>
              <button class="ai-edit-btn" @click="startAiEditChapter">{{ t('novel.aiEdit') }}</button>
               <div class="outline-edit-tooltip-icon">
                 <img src="@/assets/images/novel/intro.png" alt="" />
                 <div class="outline-edit-tooltip">{{ t('novel.outlineEditTooltip') }}</div>
               </div>
              </template>
            </div>
          </template>
        </div>

        <div class="outline-content" :class="{ 'outline-content-generating': shouldShowSimilar, 'similar-collapsed': isSimilarCollapsed }" ref="outlineContentRef">
          <NovelLoading
            v-if="(isGeneratingOutline && !outlineStreamDone && !hasFailed) || (taskStatus == 'DOING' && !isLoadingComplete && !hasFailed && currentStepName != 'renew_novel_cover' && currentStepName != 'refresh_novel_cover')"
            v-show="isGeneratingOutline || (currentChapter && currentChapter.chapter == stepChapterIndex)"
            :key="loadingKey"
            :process-type="loadingProcessType"
            :remaining-time="rawChapterRemainingSeconds || (estimatedTimeFetched ? (displayMinutes || 10) * 60 : undefined)"
            :estimated-time="originalEstimatedSeconds || undefined"
            :is-streaming="isStreaming"
            :has-streaming-content="hasStreamingContent"
            :has-stream-data="hasStreamData"
            :task-status="taskStatus || undefined"
            :start-from-beginning="isLoadingNewChapter"
            :animation-start-time="animationStartTime"
            @loading-complete="handleLoadingComplete"
            @update:animation-start-time="animationStartTime = $event"
          />

          <!-- Loading spinner instead of skeleton -->
          <div v-if="isOutlineLoading" class="loading-state">
            <div class="loading-spinner"></div>
          </div>
          <div v-else-if="isLoading && !isGeneratingOutline && !(taskStatus == 'DOING' && currentChapter)" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>

          <!-- Loading spinner during outline generation before stream text arrives -->
          <div v-else-if="isGeneratingOutline && !outlineStreamText && !outlineStreamDone && !hasFailed && !isLoading && taskStatus != 'DOING'" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>

          <!-- Outline Preparation State Display -->
          <div v-else-if="isPreparing && !currentChapter && lastGenerationType == 'outline'" class="preparation-state">
            <div class="preparation-content">
              <div class="preparation-image">
                <img src="@/assets/images/role/load_role.png" alt="" />
              </div>

              <div class="preparation-middle">
                <div class="preparation-line"></div>
              </div>

              <div class="preparation-text">
                <span class="preparation-title">{{ t('novel.preparationTitle') }}</span>
                <div class="preparation-subtitle" v-if="ongoingTaskCount > 0" v-html="t('novel.preparationSubtitle', { count: ongoingTaskCount })"></div>
              </div>
            </div>
          </div>

          <!-- Preparation State Display -->
          <div v-else-if="isPreparing && currentChapter && currentChapter.chapter == stepChapterIndex" class="preparation-state">
            <div class="preparation-content">
              <div class="preparation-image">
                <img src="@/assets/images/role/load_role.png" alt="" />
              </div>

              <div class="preparation-middle">
                <div class="preparation-line"></div>
              </div>

              <div class="preparation-text">
                <span class="preparation-title">{{ t('novel.preparationTitle') }}</span>
                <div class="preparation-subtitle" v-if="ongoingTaskCount > 0" v-html="t('novel.preparationSubtitle', { count: ongoingTaskCount })"></div>
              </div>
            </div>
          </div>

          <!-- Outline Streaming Display with Typewriter Effect -->
          <div v-else-if="isGeneratingOutline && outlineStreamText && !outlineStreamDone && !hasFailed" class="outline-stream-content">
            <pre class="stream-text">{{ outlineStreamText }}<span class="typing-cursor"></span></pre>
          </div>

          <!-- Insufficient Balance Failed State Display -->
          <div v-else-if="hasFailed && isInsufficientBalance && (!currentChapter || currentChapter.chapter == stepChapterIndex)" class="failed-state insufficient-balance-state">
            <div class="failed-icon">
              <img src="@/assets/images/novel/fail.png" alt="">
            </div>
            <h3 class="failed-title">{{ t('novel.insufficientBalance') }}</h3>
            <div class="insufficient-balance-detail">
              <span class="detail-line">{{ t('novel.insufficientBalanceNoDeduct') }}</span>
              <span class="detail-line">{{ t('novel.insufficientBalanceInterrupt') }}</span>
              <span class="detail-line" v-if="estimatedComputingPower > 0">{{ t('novel.insufficientBalanceFrozenInfo', { estimated: estimatedComputingPower, frozen: Math.round(estimatedComputingPower * (balanceInfo?.over_freeze_rate || 1)) }) }}</span>
            </div>
            <div class="failed-actions vertical">
              <button class="recharge-button" @click="goRecharge">{{ t('novel.goRecharge') }}</button>
              <button class="retry-button" @click="handleRetry">{{ t('novel.retry') }}</button>
            </div>
          </div>

          <div v-else-if="hasFailed && (!currentChapter || currentChapter.chapter == stepChapterIndex)" class="failed-state">
            <div class="failed-icon">
              <img src="@/assets/images/novel/fail.png" alt="">
            </div>
            <h3 class="failed-title">{{ t('novel.generationFailed') }}</h3>

            <div class="failed-message">
              <p class="detail-line">{{ t('novel.insufficientBalanceNoDeduct') }}</p>
              {{ t('novel.error.generationFailedMessage') }}<br />
              {{ t('novel.error.contactSupport') }}<br />
              <span v-html="t('novel.error.supportEmail').replace(/\n/g, '<br />')"></span>
            </div>
            <button class="retry-button" @click="handleRetry">
              {{ t('novel.retry') }}
            </button>
          </div>

          <!-- Chapter Content -->
          <div v-else-if="currentChapter && !(taskStatus == 'DOING' && currentChapter.chapter == stepChapterIndex) && !(isPreparing && currentChapter.chapter == stepChapterIndex)" class="chapter-content" ref="chapterContentRef">
            <!-- Loading spinner when switching chapters and content is not yet displayed -->
          <div v-if="isLoading && !isGeneratingOutline && !displayedContent && !(taskStatus == 'DOING' && currentChapter.chapter == stepChapterIndex) && !(isPreparing && currentChapter.chapter == stepChapterIndex)" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>
            <div class="chapter-text" v-else-if="!isEditingChapter">
              <template v-if="!hasInsertImages">
                <p class="paragraph">{{ displayedContent }}<span v-if="isChapterTyping || (taskStatus == 'DOING' && currentChapter.chapter == stepChapterIndex && !displayedContent)" class="typing-cursor" :class="{ 'blink': !displayedContent || isWaitingForData }"></span></p>
              </template>
              <template v-else>
                <template v-for="(seg, idx) in contentSegments" :key="idx">
                  <p v-if="seg.type === 'text' && seg.text" class="paragraph">{{ seg.text }}</p>
                  <div v-else-if="seg.type === 'image'" class="insert-image-block">
                    <div v-if="isInsertImageRenewing(seg.placeholder)" class="insert-image-wrapper">
                      <div class="insert-image-skeleton"></div>
                    </div>
                    <div v-else-if="seg.url" class="insert-image-wrapper">
                      <img :src="insertImageSrc(seg.url)" alt="" class="insert-image" />
                      <button class="insert-image-zoom-btn" @click="zoomCoverImage(seg.url)"><img src="@/assets/images/novel/zoom.png" alt="Zoom" /></button>
                    </div>
                    <div class="insert-image-actions" v-if="!isChapterRenewingInsertImage()">
                      <button v-if="hasInsertImageHistory(seg.placeholder)" class="insert-image-action-btn" @click="openInsertImageHistory(seg.placeholder)"><img src="@/assets/images/novel/history.png" alt="History" /></button>
                      <button class="insert-image-action-btn" @click="openInsertImageEdit(seg.placeholder)"><img src="@/assets/images/novel/cover_edit.png" alt="Edit" /></button>
                      <MarkupEditIcon v-if="seg.url" class="insert-image-action-btn" :label="t('markup.markupEditAction')" @click="openInsertMarkup(seg.placeholder)" />
                    </div>
                  </div>
                </template>
              </template>
            </div>

            <div class="chapter-textarea" v-else>
              <template v-if="!hasInsertImages">
                <div class="chapter-edit-wrapper">
                  <textarea
                    v-model="editingChapterContent"
                    class="chapter-edit-textarea"
                    @input="handleChapterEditInput"
                    ref="chapterEditTextareaRef"
                    spellcheck="false"
                    :maxlength="50000"
                  ></textarea>
                  <div class="chapter-edit-counter">{{ editingChapterContent.length }}/50000</div>
                </div>
              </template>
              <template v-else>
                <template v-for="(seg, idx) in editingSegments" :key="idx">
                  <textarea
                    v-if="seg.type === 'text'"
                    v-model="seg.text"
                    class="chapter-edit-textarea segment-textarea"
                    spellcheck="false"
                  ></textarea>
                  <div v-else-if="seg.type === 'image'" class="insert-image-block">
                    <div v-if="seg.url" class="insert-image-wrapper">
                      <img :src="insertImageSrc(seg.url)" alt="" class="insert-image" />
                      <button class="insert-image-zoom-btn" @click="zoomCoverImage(seg.url)"><img src="@/assets/images/novel/zoom.png" alt="Zoom" /></button>
                    </div>
                    <div class="insert-image-actions">
                      <button class="insert-image-action-btn" @click="checkOutlineEditBeforeAction(() => openInsertImageEdit(seg.placeholder))"><img src="@/assets/images/novel/edit.png" alt="Edit" /></button>
                      <button class="insert-image-action-btn" @click="checkOutlineEditBeforeAction(() => openInsertImageHistory(seg.placeholder))"><img src="@/assets/images/novel/history.png" alt="History" /></button>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <!-- Manual Outline Edit -->
          <div v-else-if="isManualEditingOutline && editingOutlineData && !currentChapter" class="manual-outline-edit-content">
            <!-- 基本信息 -->
            <div v-if="editingOutlineData.base_info" class="section basic-info">
              <h3 class="section-title">{{ t('novel.basicInfo') }}</h3>
              <div class="info-item">
                <span class="info-label">{{ t('novel.totalChapters') }}</span>
                <span class="info-value">{{ editingOutlineData.base_info.total_chapters }}{{ t('novel.chaptersLabel') }}</span>
              </div>
              <div class="info-item" v-if="editingOutlineData.base_info.words_per_chapter && editingOutlineData.base_info.words_per_chapter.length == 2">
                <span class="info-label">{{ t('novel.wordsPerChapter') }}</span>
                <span class="info-value">{{ editingOutlineData.base_info.words_per_chapter[0] }}-{{ editingOutlineData.base_info.words_per_chapter[1] }}{{ t('novel.wordsLabel') }}</span>
              </div>
              <div class="info-item" v-if="editingOutlineData.base_info.genre">
                <span class="info-label">{{ t('novel.genreLabel') }}</span>
                <span class="info-value">{{ editingOutlineData.base_info.genre }}</span>
              </div>
              <div class="info-item" v-if="editingOutlineData.base_info.writing_style">
                <span class="info-label">{{ t('novel.writingStyle') }}</span>
                <span class="info-value">{{ editingOutlineData.base_info.writing_style }}</span>
              </div>
            </div>

            <!-- 故事概要 -->
            <div v-if="editingOutlineData.story_summary" class="section story-summary">
              <h3 class="section-title">{{ t('novel.storySummaryLabel') }}<span class="section-title-counter">（{{ editingOutlineData.story_summary.summary.length }}/5000）</span></h3>
              <textarea v-model="editingOutlineData.story_summary.summary" class="outline-edit-textarea" :class="{ 'outline-edit-error': outlineEditErrorKeys.has('story-summary') }" :maxlength="5000" @input="outlineEditErrorKeys.delete('story-summary'); markOutlineEditDirty()"></textarea>
              <div v-if="outlineEditErrorKeys.has('story-summary')" class="outline-edit-field-error">{{ t('novel.storySummaryRequired') }}</div>
            </div>

            <!-- 角色图鉴 -->
            <div v-if="editingOutlineData.characters && editingOutlineData.characters.length > 0" class="section characters">
              <h3 class="section-title">
                {{ t('novel.characterGallery') }}
                <button class="outline-edit-add-btn" @click="addOutlineCharacter">{{ t('novel.addCharacter') }}</button>
              </h3>
              <div class="characters-list">
                <div v-for="(character, index) in editingOutlineData.characters" :key="index" class="character-item">
                     <div class="character-name-row">
                     <div class="character-name-left">
                       <span class="character-name-label">{{ t('novel.characterNameLabel') }}</span>
                       <span class="character-name-counter">（{{ character.name.length }}/20）</span>
                     </div>
                      <button v-if="editingOutlineData.characters.length > 1" class="delete-character-btn" @click="removeOutlineCharacter(index)">{{ t('novel.deleteCharacter') }}</button>
                   </div>
                  <div class="character-name-input-row">
                    <input v-model="character.name" class="outline-edit-input" :class="{ 'outline-edit-error': outlineEditErrorKeys.has(`character-name-${index}`) }" :maxlength="20" :placeholder="t('novel.characterNamePlaceholder')" @input="outlineEditErrorKeys.delete(`character-name-${index}`); markOutlineEditDirty()" />
                   </div>
                   <div v-if="outlineEditErrorKeys.has(`character-name-${index}`)" class="outline-edit-field-error">{{ t('novel.characterNameRequired') }}</div>
                  <div class="character-desc-label-row">
                    <span class="character-desc-label">{{ t('novel.characterDescLabel') }}</span>
                    <span class="character-desc-counter">（{{ character.description.length }}/3000）</span>
                  </div>
                  <textarea v-model="character.description" class="outline-edit-textarea character-desc-textarea" :class="{ 'outline-edit-error': outlineEditErrorKeys.has(`character-desc-${index}`) }" :maxlength="3000" :placeholder="t('novel.characterDescPlaceholder')" @input="outlineEditErrorKeys.delete(`character-desc-${index}`); markOutlineEditDirty()"></textarea>
                  <div v-if="outlineEditErrorKeys.has(`character-desc-${index}`)" class="outline-edit-field-error">{{ t('novel.characterDescRequired') }}</div>
                </div>
              </div>
            </div>

            <!-- 分章情节 -->
            <div v-if="editingOutlineData.outline" class="section chapters">
              <h3 class="section-title">{{ t('novel.chapterPlot') }}</h3>
              <div
                v-for="(chapter, index) in editingOutlineData.outline"
                :key="chapter.chapter"
                class="chapter-card"
              >
                    <div class="chapter-title-label-row">
                     <div class="chapter-title-left">
                       <span class="chapter-title-label">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                       <span class="chapter-title-counter">（{{ chapter.title.length }}/60）</span>
                     </div>
                    <div class="chapter-title-actions">
                       <button v-if="editingOutlineData.outline.length > 1" class="delete-chapter-btn" @click="removeOutlineChapter(index)">{{ t('novel.deleteChapter') }}</button>
                       <button class="insert-chapter-btn" @click="insertChapterBefore(index)">{{ t('novel.insertChapterBefore') }}</button>
                       <button class="insert-chapter-btn" @click="insertChapterAfter(index)">{{ t('novel.insertChapterAfter') }}</button>
                    </div>
                  </div>
                  <div class="chapter-title-input-row">
                    <input v-model="chapter.title" class="outline-edit-input" :class="{ 'outline-edit-error': outlineEditErrorKeys.has(`chapter-title-${index}`) }" :maxlength="60" :placeholder="t('novel.chapterTitlePlaceholder')" @input="outlineEditErrorKeys.delete(`chapter-title-${index}`); markOutlineEditDirty()" />
                   </div>
                   <div v-if="outlineEditErrorKeys.has(`chapter-title-${index}`)" class="outline-edit-field-error">{{ t('novel.chapterTitleRequired') }}</div>
                <div class="chapter-desc-label-row">
                  <span class="chapter-desc-label">{{ t('novel.chapterDescLabel') }}</span>
                  <span class="chapter-desc-counter">（{{ chapter.description.length }}/3000）</span>
                </div>
                  <textarea v-model="chapter.description" class="outline-edit-textarea chapter-desc-textarea" :class="{ 'outline-edit-error': outlineEditErrorKeys.has(`chapter-desc-${index}`) }" :maxlength="3000" :placeholder="t('novel.chapterDescPlaceholder')" @input="outlineEditErrorKeys.delete(`chapter-desc-${index}`); markOutlineEditDirty()"></textarea>
                  <div v-if="outlineEditErrorKeys.has(`chapter-desc-${index}`)" class="outline-edit-field-error">{{ t('novel.chapterDescRequired') }}</div>
              </div>
            </div>
          </div>

          <!-- Structured Content -->
          <div v-else-if="outlineData && !currentChapter" class="structured-content">
            <!-- 基本信息 -->
            <div v-if="outlineData.base_info" class="section basic-info">
              <h3 class="section-title">{{ t('novel.basicInfo') }}</h3>
              <div class="info-item">
                <span class="info-label">{{ t('novel.totalChapters') }}</span>
                <span class="info-value">{{ outlineData.base_info.total_chapters }}{{ t('novel.chaptersLabel') }}</span>
              </div>
              <div class="info-item" v-if="outlineData.base_info.words_per_chapter && outlineData.base_info.words_per_chapter.length == 2">
                <span class="info-label">{{ t('novel.wordsPerChapter') }}</span>
                <span class="info-value">{{ outlineData.base_info.words_per_chapter[0] }}-{{ outlineData.base_info.words_per_chapter[1] }}{{ t('novel.wordsLabel') }}</span>
              </div>
              <div class="info-item" v-if="outlineData.base_info.genre">
                <span class="info-label">{{ t('novel.genreLabel') }}</span>
                <span class="info-value">{{ outlineData.base_info.genre }}</span>
              </div>
              <div class="info-item" v-if="outlineData.base_info.writing_style">
                <span class="info-label">{{ t('novel.writingStyle') }}</span>
                <span class="info-value">{{ outlineData.base_info.writing_style }}</span>
              </div>
            </div>

            <!-- 故事概要 -->
            <div v-if="outlineData.story_summary" class="section story-summary">
              <h3 class="section-title">{{ t('novel.storySummary') }}</h3>
              <p class="summary-text">{{ outlineData.story_summary.summary }}</p>
            </div>

            <!-- 角色图鉴 -->
            <div v-if="outlineData.characters && outlineData.characters.length > 0" class="section characters">
              <h3 class="section-title">{{ t('novel.characterGallery') }}</h3>
              <div class="characters-list">
                <div v-for="(character, index) in outlineData.characters" :key="index" class="character-item">
                   <div class="character-name">{{ t('novel.name') }}：{{ character.name }}</div>
                  <p class="character-description">{{ character.description }}</p>
                </div>
              </div>
            </div>

            <!-- 分章情节 -->
            <div v-if="outlineData.outline" class="section chapters">
              <h3 class="section-title">{{ t('novel.chapterPlot') }}</h3>
              <div
                v-for="chapter in outlineData.outline"
                :key="chapter.chapter"
                class="chapter-card"
                :class="{ 'current-chapter': chapter.chapter == stepChapterIndex && taskStatus == 'DOING' }"
              >
                <div class="chapter-title-box">
                  <span class="chapter-number">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>

                <div class="chapter-desc">{{ chapter.description }}</div>
              </div>
            </div>

            <!-- 小说封面 -->
            <div class="section novel-cover" v-if="outlineData.outline">
              <h3 class="section-title">{{ t('novel.novelCover') }}</h3>
              <div class="cover-container">
                <div v-if="coverRenewLoading" class="cover-skeleton-wrapper">
                  <div class="skeleton-line cover-skeleton"></div>
                </div>
                <div v-else-if="coverRenewFailed" class="cover-renew-failed">
                   <img class="cover-renew-failed-icon" src="@/assets/images/novel/cover_fail.png" alt="" />
                   <span class="cover-renew-failed-text">{{ t('novel.coverRenewFailed') }}</span>
                   <button class="use-prev-cover-btn" @click="usePreviousCover">{{ t('novel.usePrevCover') }}</button>
                 </div>
                 <div v-else-if="coverLoading" class="cover-skeleton-wrapper">
                   <div class="skeleton-line cover-skeleton"></div>
                 </div>
                 <div class="cover-image" v-else-if="coverImage">
                   <img :src="coverImageWebp" alt="" />
                   <button class="zoom-cover-btn" @click="zoomCoverImage(coverImage)"><img src="@/assets/images/novel/zoom.png" alt="Zoom" /></button>
                 </div>
                 <div class="cover-placeholder" v-else-if="!coverTaskId">
                   <span>{{ t('novel.coverPlaceholder') }}</span>
                 </div>

                 <div class="cover-renew">
                    <button v-if="coverImage && !coverRenewLoading && coverHistoryList.length >= 2" class="cover-action-btn" @click="handleCoverHistoryClick"><img src="@/assets/images/novel/history.png" /></button>
                    <button v-if="(showCoverEditBtn || coverRenewFailed) && coverImage && !coverRenewLoading" class="cover-action-btn" @click="handleCoverEditClick"><img src="@/assets/images/novel/cover_edit.png" alt="Edit" /></button>
                    <MarkupEditIcon v-if="coverImage && !coverRenewLoading" class="cover-action-btn" :label="t('markup.markupEditAction')" side="right" @click="openCoverMarkup" />
                   <button v-if="coverRenewFailed && !isPreparing" class="cover-action-btn" @click="handleCoverEditClick"><img src="@/assets/images/novel/refresh.png" /></button>
                 </div>

              </div>
            </div>
          </div>

          <!-- Final Outline Stream Text (fallback) -->
          <div v-else-if="outlineStreamDone && outlineStreamText" class="outline-stream-content">
            <pre class="stream-text">{{ outlineStreamText }}</pre>

            <!-- 小说封面 -->
            <div class="section novel-cover">
              <h3 class="section-title">{{ t('novel.novelCover') }}</h3>
              <div class="cover-container">
                <div v-if="coverRenewLoading" class="cover-skeleton-wrapper">
                  <div class="skeleton-line cover-skeleton"></div>
                </div>
                <div v-else-if="coverRenewFailed" class="cover-renew-failed">
                   <img class="cover-renew-failed-icon" src="@/assets/images/novel/cover_fail.png" alt="" />
                   <span class="cover-renew-failed-text">{{ t('novel.coverRenewFailed') }}</span>
                   <button class="use-prev-cover-btn" @click="usePreviousCover">{{ t('novel.usePrevCover') }}</button>
                 </div>
                 <div v-else-if="coverLoading" class="cover-skeleton-wrapper">
                   <div class="skeleton-line cover-skeleton"></div>
                 </div>
                 <div class="cover-image" v-else-if="coverImage">
                   <img :src="coverImageWebp" alt="" />
                   <button class="zoom-cover-btn" @click="zoomCoverImage(coverImage)"><img src="@/assets/images/novel/zoom.png" alt="Zoom" /></button>
                 </div>
                 <div class="cover-placeholder" v-else-if="!coverTaskId">
                   <span>{{ t('novel.coverPlaceholder') }}</span>
                 </div>
                 <div class="cover-renew">
                    <button v-if="coverImage && !coverRenewLoading && coverHistoryList.length >= 2" class="cover-action-btn" @click="handleCoverHistoryClick"><img src="@/assets/images/novel/history.png" /></button>
                    <button v-if="(showCoverEditBtn || coverRenewFailed) && coverImage && !coverRenewLoading" class="cover-action-btn" @click="handleCoverEditClick"><img src="@/assets/images/novel/edit.png" alt="Edit" /></button>
                    <MarkupEditIcon v-if="coverImage && !coverRenewLoading" class="cover-action-btn" :label="t('markup.markupEditAction')" side="right" @click="openCoverMarkup" />
                 </div>
              </div>
            </div>
          </div>

          <!-- Fallback for unstructured content -->
          <div v-else-if="outlineContent" class="content-text">
            <p class="paragraph">{{ displayedContent }}</p>
          </div>

        </div>
      </div>

      <!-- Similar Content Section -->
      <div  class="similar-section" v-if="shouldShowSimilar">
        <div class="similar-inner">
          <div class="similar-header">
            <div class="similar-header-left">
              <span class="similar-title">{{ t('novel.similarRecommend') }}</span>
              <button v-if="!isSimilarCollapsed" class="similar-refresh-btn" :disabled="similarLoading" @click="refreshSimilar">{{ t('novel.similarRefresh') }} <span v-if="similarLoading" class="btn-spinner btn-spinner-small"></span></button>
            </div>
            <div class="similar-header-right">
              <span class="similar-hint">{{ t('novel.similarExitHint') }}</span>
              <button class="similar-toggle-btn" @click="toggleSimilarCollapsed">{{ isSimilarCollapsed ? t('novel.similarExpand') : t('novel.similarCollapse') }}<img class="similar-toggle-arrow" :class="{ 'collapsed': isSimilarCollapsed }" src="@/assets/images/novel/arrow_icon.png" alt="" /></button>
            </div>
          </div>
          <div v-if="!isSimilarCollapsed && (similarList.length > 0 || similarLoading)" class="similar-list" :class="{ 'similar-loading': similarLoading }">
            <div v-if="similarLoading" class="similar-list-loading">
              <div class="loading-spinner"></div>
            </div>

            <div v-for="item in similarList" :key="item.id" class="similar-item" @click="goToSimilarDetail(item)">
              <div class="similar-item-cover">
                <img :src="item.cover || ''" alt="" />
                <div class="similar-item-type" v-if="item.type">
                  <span v-if="item.type == '2'" class="type-badge type-2">{{ t('home.contentType.novel') }}</span>
                  <span v-else-if="item.type == '1'" class="type-badge type-1">{{ t('home.contentType.comic') }}</span>
                  <span v-else-if="item.type == '3'" class="type-badge type-3">{{ t('home.contentType.drama') }}</span>
                </div>
                <div class="similar-item-r18" v-if="item.is_nsfw == '1'">
                  <span class="r18-text">R18</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!isSimilarCollapsed && similarList.length == 0 && !similarLoading" class="similar-empty">{{ t('novel.similarEmpty') }}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <div class="left">
          <button v-if="currentChapter" class="prev-btn" @click="checkOutlineEditBeforeAction(goPrevChapter)">
            <img src="@/assets/images/novel/prev.png" alt="" />
          </button>
          <button v-if="showNextArrow" class="next-btn" @click="checkOutlineEditBeforeAction(goNextChapter)">
            <img src="@/assets/images/novel/next.png" alt="" />
          </button>
        </div>

        <div class="right" v-if="shouldShowGenerateButtons && !(isManualEditingOutline && !currentChapter)">
          <span v-if="!currentChapter && chapters.length === 0" class="outline-edit-warning" v-html="t('novel.outlineEditWarning')"></span>
          <button class="action-btn" :class="{ loading: isNextLoading }" :disabled="isNextLoading" @click="checkOutlineEditBeforeAction(() => callNovelNext())">
            {{ t('novel.nextChapterTitle') }} <span class="action-btn-cost">/{{ nextChapterCost }}{{ t('novel.computingPower') }}</span>
            <span v-if="isNextLoading" class="btn-spinner"></span>
          </button>
        </div>

        <div class="right" v-if="isManualEditingOutline && !currentChapter">
          <button class="cancel-edit-chapter-btn" :disabled="isSavingManualOutline" @click="cancelManualEditOutline">
            {{ t('novel.cancel') }}
          </button>
          <button class="save-edit-chapter-btn" :disabled="isSavingManualOutline" @click="saveManualEditOutline">
            {{ t('novel.save') }}
            <span v-if="isSavingManualOutline" class="btn-spinner"></span>
          </button>
        </div>

        <div class="right" v-if="isEditingChapter && currentChapter">
          <button class="cancel-edit-chapter-btn" :disabled="isSavingChapter" @click="cancelEditChapter">
            {{ t('novel.cancel') }}
          </button>
          <button class="save-edit-chapter-btn" :disabled="isSavingChapter" @click="saveEditChapter">
            {{ t('novel.save') }}
            <span v-if="isSavingChapter" class="btn-spinner"></span>
          </button>
        </div>

      </div>
    </div>

    <!-- Batch Publish Loading Mask -->
    <LoadingMask :visible="isBatchPublishLoading" @cancel="cancelBatchPublish" />

    <!-- Cover Action Confirmation Modal -->
    <!-- Upload Mask -->
    <UploadMask :visible="isUploading" />

    <!-- Cover Zoom Modal -->
    <div v-if="showCoverZoomModal" class="cover-zoom-modal" @click="closeCoverZoomModal">
      <div class="cover-zoom-content" @click.stop>
        <button class="close-zoom-btn" @click="closeCoverZoomModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        <img :src="zoomedCoverImage + '?imageMogr2/format/webp/quality/60'" alt="" class="zoomed-cover-image" />
      </div>
    </div>

    <!-- Cover History Modal -->
    <CoverHistoryModal
      :visible="showCoverHistoryModal"
      :cover-list="coverHistoryList"
      :current-cover="coverImage"
      @cancel="closeCoverHistoryModal"
      @select="selectHistoryCover"
    />

    <!-- Chapter History Modal -->
    <ChapterHistoryModal
      :visible="showChapterHistoryModal"
      :chapter-list="chapterHistoryList"
      :current-chapter="currentChapter"
      :is-using="isUsingChapterHistory"
      @cancel="showChapterHistoryModal = false"
      @select="selectHistoryChapter"
    />

    <!-- Insert Image History Modal -->
    <InsertImageHistoryModal
      :visible="showInsertImageHistoryModal"
      :image-list="insertImageHistoryList"
      :current-image="getInsertImageUrl(historyTargetPlaceholder)"
      @cancel="closeInsertImageHistoryModal"
      @select="selectHistoryInsertImage"
    />

    <!-- Outline History Modal -->
    <OutlineHistoryModal
      :visible="showOutlineHistoryModal"
      :outline-list="outlineHistoryList"
      :current-outline="outlineData"
      :is-using="isUsingOutlineHistory"
      @cancel="closeOutlineHistoryModal"
      @select="selectHistoryOutline"
    />

    <!-- NSFW (Unlimited) Mode Modals -->
    <UnlimitedModeModal
      v-if="showUnlimitedModal"
      @close="showUnlimitedModal = false"
      @confirm="confirmRegenerateNsfw"
    />

    <UnderageNoBirthdayModal
      v-if="showUnderageNoBirthdayModal"
      @close="showUnderageNoBirthdayModal = false"
      @confirm="handleUnlimitedAgeConfirm"
    />

    <!-- Confirm Computing Power Modal -->
    <ConfirmComputingPowerModal
      :visible="showConfirmComputingPowerModal"
      :computing-power="estimatedComputingPower"
      :frozen-power="confirmFrozenPower"
      @cancel="showConfirmComputingPowerModal = false"
      @confirm="() => { showConfirmComputingPowerModal = false; executeRetryAction(); }"
    />

    <!-- Insufficient Balance Modal -->
    <InsufficientBalanceModal
      :visible="showInsufficientBalanceModal"
      :estimated-frozen-power="estimatedFrozenPower"
      :available-balance="userBalance"
      :system-frozen-balance="systemFrozenBalance"
      @cancel="closeInsufficientBalanceModal"
      @recharge="goRecharge"
    />

    <!-- Generate All Chapters Modal -->
    <GenerateAllChaptersModal
      :visible="showGenerateAllChaptersModal"
      :computing-power="estimatedComputingPower"
      :estimated-time="modalEstimatedTime"
      @cancel="showGenerateAllChaptersModal = false"
      @confirm="() => { showGenerateAllChaptersModal = false; callNovelAllChapters(true); }"
    />

    <!-- Freeze Computing Power Modal -->
    <FreezeComputingPowerModal
      :visible="showFreezeComputingPowerModal"
      :estimated-power="freezeComputingPower"
      @cancel="showFreezeComputingPowerModal = false"
      @confirm="handleFreezeComputingPowerConfirm"
    />

    <!-- Task Limit Exceeded Modal -->
    <TaskLimitExceededModal
      :visible="showTaskLimitExceededModal"
      @close="showTaskLimitExceededModal = false"
    />
    <!-- Outline Edit Confirm Exit Modal -->
    <ExitConfirmModal
      :visible="showOutlineEditConfirmModal"
      @cancel="cancelOutlineEditExit"
      @confirm="confirmOutlineEditExit"
    />

    <!-- Batch Publish Dialog -->
    <BatchPublishDialog
      :visible="showBatchPublishDialog"
      :chapters="chapters"
      :session-id="sessionId"
      :check-ownership="checkProjectOwnership"
      @close="showBatchPublishDialog = false"
      @confirm="handleBatchPublishConfirm"
      @refresh="handleBatchPublishRefresh"
    />

    <!-- 标记修改（标记修图）编辑器 -->
    <MarkupImageEditor
      v-if="markupOpen"
      :image-url="markupImageUrl"
      :image-name="markupImageName"
      :initial-instruction="markupInstruction"
      :estimated-points="markupEstimatedPoints"
      :show-guide="showMarkupGuide"
      :on-close="closeMarkupEditor"
      :on-send="handleSendMarkedImage"
      :on-dismiss-guide="handleDismissMarkupGuide"
      :on-request-guide="() => { showMarkupGuide = true; }"
    />

  </div>
</template>

<script lang="ts">
// Define OutlineStreamParser class outside script setup
class OutlineStreamParser {
  onText: (text: string) => void;
  onComplete: (text: string, data?: any) => void;
  onError: (error: string) => void;
  t: (key: string, params?: object) => string;

  rawBuf: string = '';
  jsonBuf: string = '';
  jsonStarted: boolean = false;
  pendingText: string = '';
  pendingConsumed: number = 0;
  displayedText: string = '';
  typewriterTimer: ReturnType<typeof setInterval> | null = null;
  visibilityChangeHandler: ((() => void) | null) = null;

  parseStage: number = 0;
  parsedTitle: boolean = false;
  parsedTotalChapters: boolean = false;
  parsedWordsPerChapter: boolean = false;
  parsedGenre: boolean = false;
  parsedStyle: boolean = false;
  parsedSummary: boolean = false;
  headerWritten: boolean = false;
  charHeaderWritten: boolean = false;
  outlineHeaderWritten: boolean = false;
  parsedCharNames: Set<string> = new Set();
  parsedOutlineChapters: Set<number> = new Set();

  novelTitle: string = '';
  totalChapters: number = 0;
  abortController: AbortController | null = null;

  constructor({ onText, onComplete, onError, t }: { onText: (text: string) => void; onComplete: (text: string, data?: any) => void; onError: (error: string) => void; t: (key: string, params?: object) => string }) {
    this.onText = onText;
    this.onComplete = onComplete;
    this.onError = onError;
    this.t = t;
  }

  async start(sessionId: string, token: string) {
    const url = `${aiUrl}app/stream_read/${sessionId}`;

    // Add visibility change handler
    this.visibilityChangeHandler = () => {
      if (document.visibilityState == 'visible') {
        // When tab becomes visible, immediately display all pending text
        if (this.pendingConsumed < this.pendingText.length) {
          this.pendingConsumed = this.pendingText.length;
          this.displayedText = this.pendingText;
          this.onText(this.displayedText);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    this.typewriterTimer = setInterval(() => {
      if (this.pendingConsumed >= this.pendingText.length) return;

      this.pendingConsumed++;
      this.displayedText = this.pendingText.substring(0, this.pendingConsumed);
      this.onText(this.displayedText);
    }, 30);

    try {
      this.abortController = new AbortController();

      const response = await fetch(url, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Platform': 'web',
          'token': token,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) throw new Error(`SSE connect failed: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

        if (isFirstChunk) {
          isFirstChunk = false;
          if (chunk.startsWith('data: ')) chunk = chunk.substring(6);
          else if (chunk.startsWith('data:')) chunk = chunk.substring(5);
        }

        this.rawBuf += chunk;
        this._processChunk(chunk);
      }

      this._onStreamDone();
    } catch (err: any) {
      if (err.name == 'AbortError') {
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        if (this.visibilityChangeHandler) {
          document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }
        return;
      }
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
      if (this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      }
      this.onError(err.message || 'Stream error');
    }
  }

  _processChunk(chunk: string) {
    if (!this.jsonStarted) {
      const marker = this.rawBuf.indexOf('"base_info"');
      if (marker !== -1) {
        this.jsonStarted = true;
        const jsonStart = this.rawBuf.lastIndexOf('{', marker);
        const startPos = jsonStart !== -1 ? jsonStart : marker;
        this.jsonBuf = this.rawBuf.substring(startPos);
        this._tryIncrementalParse();
      }
    } else {
      this.jsonBuf += chunk;
      this._tryIncrementalParse();
    }
  }

  _tryIncrementalParse() {
    if (this.parseStage >= 4) return;
    const s = this.jsonBuf;

    if (this.parseStage == 0) {
      if (!this.headerWritten) {
        this.pendingText += `${this.t('novel.novelOutline')}\n\n${this.t('novel.basicInfo')}\n`;
        this.headerWritten = true;
      }

      if (!this.parsedTitle) {
        const m = s.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          this.novelTitle = m[1].replace(/\\"/g, '"');
          this.parsedTitle = true;
        }
      }

      if (!this.parsedTotalChapters) {
        const m = s.match(/"total_chapters"\s*:\s*(\d+)/);
        if (m) {
          this.totalChapters = parseInt(m[1]);
          this.pendingText += `${this.t('novel.totalChapters')}${this.totalChapters} ${this.t('novel.chaptersLabel')}\n`;
          this.parsedTotalChapters = true;
        }
      }

      // Add words per chapter if available, even if total chapters already parsed
      if (!this.parsedWordsPerChapter) {
        // Try different formats for words_per_chapter
        const wordsMatch = s.match(/"words_per_chapter"\s*:\s*\[(\d+),\s*(\d+)\]/);
        if (wordsMatch) {
          const minWords = wordsMatch[1];
          const maxWords = wordsMatch[2];
          this.pendingText += `${this.t('novel.wordsPerChapter')}${minWords}-${maxWords}${this.t('novel.wordsLabel')}\n`;
          this.parsedWordsPerChapter = true;
        }
      }

      if (!this.parsedGenre) {
        const m = s.match(/"genre"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const genre = m[1].replace(/\\"/g, '"');
          if (genre) this.pendingText += `${this.t('novel.genreLabel')}${genre}\n`;
          this.parsedGenre = true;
        }
      }

      if (!this.parsedStyle) {
        const m = s.match(/"writing_style"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const style = m[1].replace(/\\"/g, '"');
          if (style) this.pendingText += `${this.t('novel.writingStyle')}：${style}\n`;
          this.pendingText += '\n';
          this.parsedStyle = true;
        }
      }

      if (s.includes('"story_summary"') || s.includes('"summary"')) {
        // Display current text for 1 second before moving to next stage
        setTimeout(() => {
          this.parseStage = 1;
        }, 1000);
      }
    }

    if (this.parseStage == 1) {
      if (!this.parsedSummary) {
        const m = s.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const summary = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          this.pendingText += `${this.t('novel.storySummary')}\n${summary}\n\n`;
          this.parsedSummary = true;
          this.parseStage = 2;
        }
      }
    }

    if (this.parseStage == 2) {
      if (s.includes('"characters"')) {
        if (!this.charHeaderWritten) {
          this.pendingText += `${this.t('novel.characterGallery')}\n`;
          this.charHeaderWritten = true;
        }

        // Try to parse characters incrementally
        const charRegex = /\{\s*"name"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*"description"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*\}/g;
        let match;
        while ((match = charRegex.exec(s)) !== null) {
          const name = match[1].replace(/\\"/g, '"');
          const description = match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');

          if (!this.parsedCharNames.has(name)) {
            this.pendingText += `${this.t('novel.name')}：${name}\n`;
            this.pendingText += `${this.t('novel.description')}：${description}\n\n`;
            this.parsedCharNames.add(name);
          }
        }

        if (s.includes('"outline"')) {
          this.parseStage = 3;
        }
      }
    }

    if (this.parseStage == 3) {
      if (!this.outlineHeaderWritten) {
        this.pendingText += `${this.t('novel.chapterPlot')}\n`;
        this.outlineHeaderWritten = true;
      }

      // Try to parse outline chapters incrementally
      const chapterRegex = /\{\s*"chapter"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*"description"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*\}/g;
      let match;
      while ((match = chapterRegex.exec(s)) !== null) {
        const chapter = parseInt(match[1]);
        const title = match[2].replace(/\\"/g, '"');
        const description = match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n');

        if (!this.parsedOutlineChapters.has(chapter)) {
          this.pendingText += `${this.t('novel.chapter', { chapter })} ${title}\n`;
          this.pendingText += `${description}\n\n`;
          this.parsedOutlineChapters.add(chapter);
        }
      }

      if (s.includes('}')) {
        this.parseStage = 4;
      }
    }
  }

  _onStreamDone() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    // Final flush - show all remaining text
    if (this.pendingConsumed < this.pendingText.length) {
      this.pendingConsumed = this.pendingText.length;
      this.displayedText = this.pendingText;
      this.onText(this.displayedText);
    }

    try {
      const json = JSON.parse(this.jsonBuf);
      const fullText = this._formatOutlineResult(json);
      this.onComplete(fullText, json);
    } catch (e) {
      console.error('Failed to parse final JSON:', e);
      this.onComplete(this.displayedText);
    }
  }

  _formatOutlineResult(json: any): string {
    const bi = json.base_info || {};
    const ss = json.story_summary || {};
    const chars = json.characters || [];
    const outline = json.outline || [];

    let text = `${this.t('novel.novelOutline')}\n\n`;
    text += `${this.t('novel.basicInfo')}\n`;
    text += `${this.t('novel.totalChapters')}：${bi.total_chapters || 0} ${this.t('novel.chaptersLabel')}\n`;
    if (bi.words_per_chapter && bi.words_per_chapter.length == 2) {
      text += `${this.t('novel.wordsPerChapter')}${bi.words_per_chapter[0]}-${bi.words_per_chapter[1]}${this.t('novel.wordsLabel')}\n`;
    }
    if (bi.genre) text += `${this.t('novel.genreLabel')}：${bi.genre}\n`;
    if (bi.writing_style) text += `${this.t('novel.writingStyle')}：${bi.writing_style}\n`;
    text += '\n';

    if (ss.summary) {
      text += `${this.t('novel.storySummary')}\n${ss.summary}\n\n`;
    }

    if (chars.length > 0) {
      text += `${this.t('novel.characterGallery')}\n`;
      for (const c of chars) {
        if (c.type) text += `${c.type}\n`;
        text += `${this.t('novel.name')}：${c.name || ''}\n`;
        text += `${this.t('novel.description')}：${c.description || ''}\n\n`;
      }
    }

    if (outline.length > 0) {
      text += `${this.t('novel.chapterPlot')}\n`;
      for (const ch of outline) {
        text += `${this.t('novel.chapter', { chapter: ch.chapter })} ${ch.title || ''}\n`;
        text += `${ch.description || ''}\n\n`;
      }
    }

    return text.trimEnd();
  }

  destroy() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.abortController) this.abortController.abort();
  }

  extractJson(rawBuf: string): any {
    try {
      // Find the start of the JSON object
      const marker = rawBuf.indexOf('"base_info"');
      if (marker !== -1) {
        const jsonStart = rawBuf.lastIndexOf('{', marker);
        if (jsonStart !== -1) {
          // Find the matching closing bracket
          let bracketCount = 1;
          let jsonEnd = jsonStart + 1;

          while (bracketCount > 0 && jsonEnd < rawBuf.length) {
            if (rawBuf[jsonEnd] === '{') {
              bracketCount++;
            } else if (rawBuf[jsonEnd] === '}') {
              bracketCount--;
            }
            jsonEnd++;
          }

          if (bracketCount === 0) {
            const jsonStr = rawBuf.substring(jsonStart, jsonEnd);
            return JSON.parse(jsonStr);
          }
        }
      }
      return null;
    } catch (e) {
      console.error('Error extracting JSON:', e);
      return null;
    }
  }
}
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { toast, limitToast } from '@/util/toast';
import { trackClickPublishButton } from '@/utils/analytics';
import api from '@/api/index';
import { aiUrl, baseUrl } from '@/util/config';
import { parseToUnixTimestamp } from '@/util/utils';

import UploadMask from '@/components/UploadMask.vue';
import LoadingMask from '@/components/LoadingMask.vue';
import ConfirmComputingPowerModal from '@/components/ConfirmComputingPowerModal.vue';

import InsufficientBalanceModal from '@/components/InsufficientBalanceModal.vue';
import GenerateAllChaptersModal from '@/components/GenerateAllChaptersModal.vue';
import FreezeComputingPowerModal from '@/components/FreezeComputingPowerModal.vue';
import CoverHistoryModal from '@/components/CoverHistoryModal.vue';
import OutlineHistoryModal from '@/components/OutlineHistoryModal.vue';
import TaskLimitExceededModal from '@/components/TaskLimitExceededModal.vue';
import ExitConfirmModal from '@/components/ExitConfirmModal.vue';
import ChapterHistoryModal from '@/components/ChapterHistoryModal.vue';
import BatchPublishDialog from '@/components/BatchPublishDialog.vue';
import InsertImageHistoryModal from '@/components/InsertImageHistoryModal.vue';
import NovelLoading from '@/components/NovelLoading.vue';
import defaultAvatar from '@/assets/images/base/avatar.png';
import UnlimitedModeModal from '@/components/UnlimitedModeModal.vue';
import UnderageNoBirthdayModal from '@/components/UnderageNoBirthdayModal.vue';
import MarkupEditIcon from '@/components/markup/MarkupEditIcon.vue';
import MarkupImageEditor from '@/components/markup/MarkupImageEditor.vue';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// Get session id from route params (ref instead of computed)
const sessionId = ref<string>('');

// State
const userInfo = ref<any>(null);
const isLoading = ref(true);
const isDetailLoaded = ref(false);
const isAccessDenied = ref(false);
const outlineContent = ref<string>('');
const displayedContent = ref<string>('');
const pendingDisplayContent = ref<string>(''); // Store content to display after loading animation completes
const outlineContentRef = ref<HTMLElement | null>(null);
const chapterContentRef = ref<HTMLElement | null>(null);
const chapterEditTextareaRef = ref<HTMLTextAreaElement | null>(null);
const printerInterval = ref<number | null>(null);
const pollingInterval = ref<number | null>(null);
const detailPollingInterval = ref<number | null>(null);

const similarList = ref<any[]>([]);
const similarPage = ref<number>(1);
const similarTotalPages = ref<number>(1);
const similarLoading = ref<boolean>(false);
const isSimilarCollapsed = ref<boolean>(localStorage.getItem('similarCollapsed') === '1');

const toggleSimilarCollapsed = () => {
  isSimilarCollapsed.value = !isSimilarCollapsed.value;
  localStorage.setItem('similarCollapsed', isSimilarCollapsed.value ? '1' : '0');
};
const projectName = ref<string>('');
const originalProjectName = ref<string>('');
const isEditingName = ref<boolean>(false);
const projectNameInputRef = ref<HTMLElement | null>(null);
const userBalance = ref<number>(0);
const frozenBalance = ref<number>(0);
const estimatedFrozenPower = ref<number>(0);
const systemFrozenBalance = ref<number>(0);
const balanceInfo = ref<any>(null);
const taskStatus = ref<'DOING' | 'SUCCESS' | 'FAIL' | 'PREPARE' | ''>('');
const chapterCount = ref<number>(0);
const hasFailed = ref<boolean>(false);
const statusMessage = ref<string>('');
const isInsufficientBalance = computed(() => hasFailed.value && statusMessage.value.includes('user credit is not enough'));
const outlineData = ref<any>(null);

watch(() => outlineData.value, (newVal) => {
  if (newVal?.base_info?.total_chapters) {
    chapterCount.value = newVal.base_info.total_chapters;
  }
});

const backupOutlineData = ref<any>(null);
const chapters = ref<any[]>([]);
const unpublishedChapterCount = computed(() => chapters.value.filter(c => c.is_publish == 2).length);
const showRegenerateInput = ref<boolean>(false);
const regenerateContent = ref<string>('');
const isSendingRegenerate = ref<boolean>(false);
const selectedWordCount = ref<string>('30K');
const selectedLanguage = ref<string>('en');
const wordCountOptions = ['30K', '100K', '300K'];
const wordCountDisplayMap: Record<string, Record<string, string>> = {
  jp: { '30K': '30,000字', '100K': '100,000字', '300K': '300,000字' },
};
const selectedWordCountDisplay = computed(() => {
  const langMap = wordCountDisplayMap[locale.value];
  if (langMap && langMap[selectedWordCount.value]) {
    return langMap[selectedWordCount.value];
  }
  return selectedWordCount.value;
});
const languageOptions = computed(() => [
  { value: 'jp', label: t('novel.language.jp') },
  { value: 'en', label: t('novel.language.en') },
  { value: 'tc', label: t('novel.language.tc') },
  { value: 'cn', label: t('novel.language.zh') }
]);
const isBatchChapter = ref<number>(0);
const isUserInitiatedGeneration = ref<boolean>(false);
const shouldAutoNavigate = ref<boolean>(true);
const isRetryingChapter = ref<boolean>(false);

// Preparation status state
const isPreparing = ref<boolean>(false);
const prepareQueueInfo = ref<{ count: number, estimatedTime: number } | null>(null);
const ongoingTaskCount = ref<number>(0);

// Cover related state
const isEditingCover = ref<boolean>(false);
const coverInputRef = ref<HTMLElement | null>(null);
const coverFileInputRef = ref<HTMLInputElement | null>(null);
const coverEditSectionRef = ref<HTMLElement | null>(null);
const uploadedCoverImages = ref<any[]>([]);
const combinedCoverItems = ref<any[]>([]);
const showCoverAtDropdown = ref<boolean>(false);
const coverAtDropdownItems = ref<any[]>([]);
const lastCoverRange = ref<Range | null>(null);

const isCoverComposing = ref<boolean>(false);
const previousCoverInputHtml = ref<string>('');
const coverInputKey = ref<number>(0);

const coverGenerationTaskId = ref<string>('');



const showCoverEditBtn = ref<boolean>(false);
const showWordCountDropdown = ref(false);
const showLanguageDropdown = ref(false);

// NSFW mode & insert image (illustration) settings for regenerate
const regenerateNsfwMode = ref(false);
const selectedInsertImage = ref(4);
const showInsertImageDropdown = ref(false);
// Region gate for the NSFW switch (only non-CN regions can show it)
const userRegion = ref(false);
const hasFetchedRegion = ref(false);
const isFetchingRegion = ref(false);
// NSFW age-check / confirmation modal state
const showUnlimitedModal = ref(false);
const showUnderageNoBirthdayModal = ref(false);
const isTeenager = computed(() => !userInfo.value || userInfo.value.is_adult != 1);
const insertImageOptions = computed(() => [
  { value: 0, label: t('novel.insertImageNone') },
  { value: 4, label: t('novel.insertImage4') },
]);
const selectedInsertImageText = computed(() => {
  const option = insertImageOptions.value.find(o => o.value === selectedInsertImage.value);
  return option ? option.label : '';
});

const currentChapter = ref<any>(null);

const regenerateCost = computed(() => {
  if (!balanceInfo.value) {
    return 20;
  }
  // Calculate regenerate cost using outline_cost + single_image_cost (same as home.vue)
  const manhuaManjuOutlineBase = Number(balanceInfo.value.outline_cost) || 0;
  const singleImageCost = Number(balanceInfo.value.single_image_cost) || 0;

  const total = manhuaManjuOutlineBase + singleImageCost;

  // Ensure minimum value is 1, default to 20 if total is 0
  return total > 0 ? Math.max(1, total) : 20;
});
const isEditingChapter = ref<boolean>(false);
const isSavingChapter = ref<boolean>(false);
const coverRenewLoading = ref<boolean>(false);
const coverRenewFailed = ref<boolean>(false);
const coverRenewTaskId = ref<string>('');
const coverRenewPollTimer = ref<number | null>(null);
const editingChapterContent = ref<string>('');
const originalChapterContent = ref<string>('');
// Per-segment editing state when the chapter has insert images
const editingSegments = ref<ChapterSegment[]>([]);
const estimatedTime = ref<number | null>(null);
const modalEstimatedTime = ref<string>('');
const originalEstimatedSeconds = ref<number | null>(null);
const chapterRemainingSeconds = ref<number | null>(null); // Remaining time for current chapter only (without queue time)
const rawChapterRemainingSeconds = ref<number | null>(null); // Unclamped version for loading component
const displayMinutes = ref<number>(0);
const startTime = ref<number | null>(null);
const estimatedTimeFetched = ref<boolean>(false);
const isGeneratingOutline = ref<boolean>(false);
const generatingChapter = ref<number | null>(null);
const isChapterTyping = ref<boolean>(false);
const isWaitingForData = ref<boolean>(false);
const stepChapterIndex = ref<number>(0);
const streamReaderController = ref<AbortController | null>(null);
// Control whether to show typewriter effect for chapter generation
const shouldShowTypewriter = ref<boolean>(false);

const topic = ref<string>('');
const lastGenerationType = ref<string>('outline');
const queueInfo = ref<{ count: number, estimatedTime: number } | null>(null);
const currentStepName = ref<string>('');
const userSelectedSettings = ref<any>(null);
const taskStartAt = ref<string>('');
const countdownTimer = ref<number | null>(null);

// Confirm computing power modal
const showConfirmComputingPowerModal = ref<boolean>(false);
const showInsufficientBalanceModal = ref<boolean>(false);
const showGenerateAllChaptersModal = ref<boolean>(false);
const showFreezeComputingPowerModal = ref<boolean>(false);
const showBatchPublishDialog = ref<boolean>(false);
const isBatchPublishLoading = ref<boolean>(false);
const isBatchPublishBtnLoading = ref<boolean>(false);
let isBatchPublishCancelled = false;
const freezeComputingPower = ref<number>(0);
const pendingGenerationAction = ref<string>(''); // 'outline', 'chapter', 'all', 'retry-outline', 'retry-chapter', 'retry-all'
const showTaskLimitExceededModal = ref<boolean>(false);

const isTaskLimitExceeded = async () => {
  const totalProcessRes = await api.totalProcess(true) as any;

  if (totalProcessRes.code == 200 && totalProcessRes.data?.novel_doing_count >= 10) {
    showTaskLimitExceededModal.value = true;
    return true;
  }
  return false;
};

const projectOwnerId = ref<number | string | null>(null);

const checkProjectOwnership = () => {
  const currentUserId = userInfo.value?.info?.id;
  if (!currentUserId || !projectOwnerId.value) return false;
  if (String(currentUserId) !== String(projectOwnerId.value)) {
    toast(t('novel.error.cannotOperateOtherUserProject'));
    return true;
  }
  return false;
};

const checkProjectOwnershipByEstimate = async (stepName?: string) => {
  const estimateRes = await api.novelEstimate({ session_id: sessionId.value, step_name: stepName || undefined }) as any;
  if (estimateRes.code == 10404) {
    toast(t('novel.error.cannotOperateOtherUserProject'));
    return true;
  }
  return false;
};

const checkServerStateSync = async (expectedStepName?: string, expectedStepStatus?: string, expectedStepChapterIndex?: number): Promise<boolean> => {
  try {
    const res = await api.detailProject(sessionId.value) as any;
    if (res.code !== 200) return false;

    const serverStepName = res.data?.step_name;
    const serverStepStatus = res.data?.step_status;
    const serverStepChapterIndex = res.data?.step_chapter_index;

    currentStepName.value = serverStepName || currentStepName.value;
    if (serverStepStatus) taskStatus.value = serverStepStatus;
    if (serverStepChapterIndex !== undefined && serverStepChapterIndex !== null) {
      stepChapterIndex.value = serverStepChapterIndex;
    }
    if (res.data?.chapters) {
      chapters.value = res.data.chapters;
    }

    if (expectedStepName !== undefined || expectedStepStatus !== undefined) {
      if ((expectedStepName !== undefined && serverStepName !== expectedStepName) ||
          (expectedStepStatus !== undefined && serverStepStatus !== expectedStepStatus)) {
        toast(t('novel.error.staleOperation'));
        setTimeout(() => { window.location.reload(); }, 1000);
        return false;
      }
    }

    if (expectedStepChapterIndex !== undefined && serverStepChapterIndex !== undefined && serverStepChapterIndex !== null && serverStepChapterIndex !== expectedStepChapterIndex) {
      toast(t('novel.error.staleOperation'));
      setTimeout(() => { window.location.reload(); }, 1000);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking server state sync:', error);
    return false;
  }
};

const isCoverSendClicked = ref<boolean>(false);
const coverAbortController = ref<AbortController | null>(null);
const estimatedComputingPower = ref<number>(0);
const confirmFrozenPower = ref<number>(0);
const retryAction = ref<string>(''); // 'outline', 'chapter', 'all'
const isNextLoading = ref<boolean>(false);
const isAllChaptersLoading = ref<boolean>(false);
const isConfirmAllLoading = ref<boolean>(false);

// State for chapter title editing
const editingChapterId = ref<number | null>(null);
const editingChapterTitle = ref<string>('');
const originalChapterTitle = ref<string>('');
const isSavingChapterTitle = ref<boolean>(false);
const isHandlingChapterAction = ref<boolean>(false);
const chapterTitleInputs = ref<{[key: number]: any}>({});
const nextChapterPoints = ref<number>(0);
const allChaptersPoints = ref<number>(0);
const coverCost = ref<number>(1);
const isFetchingNovelOutline = ref<boolean>(false);

const isAiEditingOutline = ref<boolean>(false);
const aiEditOutlineInput = ref<string>('');
const isSendingOutlineEdit = ref<boolean>(false);
const outlineEditCost = ref<number>(1);
const outlineEditSectionRef = ref<HTMLElement | null>(null);

const isManualEditingOutline = ref<boolean>(false);
const isSavingManualOutline = ref<boolean>(false);
const manualEditingOutlineContent = ref<string>('');
const manualOutlineEditTextareaRef = ref<HTMLTextAreaElement | null>(null);
const outlineEditErrorKeys = ref<Set<string>>(new Set());

const editingOutlineData = ref<any>(null);
const outlineEditOriginalData = ref<any>(null);
const showOutlineEditConfirmModal = ref<boolean>(false);
const outlineEditPendingAction = ref<(() => void) | null>(null);
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
  } else {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
      if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
    }
  }
  return true;
}

const outlineEditDirty = ref<boolean>(false);

const markOutlineEditDirty = () => {
  outlineEditDirty.value = true;
};

const isOutlineEditDirty = computed(() => {
  return outlineEditDirty.value;
});

const isAnyEditing = computed(() => {
  return isManualEditingOutline.value || isEditingChapter.value;
});

const isChapterEditDirty = computed(() => {
  if (!isEditingChapter.value || !currentChapter.value) return false;
  const titleChanged = editingChapterTitle.value !== (currentChapter.value?.title || '');
  // Insert-image chapters are edited via per-segment textareas (editingSegments),
  // so compare the reconstructed content instead of editingChapterContent.
  const contentChanged = (hasInsertImages.value && editingSegments.value.length)
    ? reconstructChapterContent() !== originalChapterContent.value
    : editingChapterContent.value !== originalChapterContent.value;
  return contentChanged || titleChanged;
});

const isAnyEditDirty = computed(() => {
  return isOutlineEditDirty.value || isChapterEditDirty.value;
});

const checkOutlineEditBeforeAction = (action: () => void) => {
  if (!isAnyEditing.value) {
    action();
    return;
  }
  if (isAnyEditDirty.value) {
    outlineEditPendingAction.value = action;
    showOutlineEditConfirmModal.value = true;
    return;
  }
  isManualEditingOutline.value = false;
  editingOutlineData.value = null;
  outlineEditOriginalData.value = null;
  isEditingChapter.value = false;
  action();
};

const confirmOutlineEditExit = () => {
  showOutlineEditConfirmModal.value = false;
  outlineEditDirty.value = false;
  isManualEditingOutline.value = false;
  editingOutlineData.value = null;
  outlineEditOriginalData.value = null;
  isEditingChapter.value = false;
  if (outlineEditPendingAction.value) {
    outlineEditPendingAction.value();
    outlineEditPendingAction.value = null;
  }
};

const cancelOutlineEditExit = () => {
  showOutlineEditConfirmModal.value = false;
  outlineEditPendingAction.value = null;
};

// Loading component state
const loadingProcessType = ref<'outline' | 'chapter'>('outline');
const loadingKey = ref(0);
const isLoadingNewChapter = ref(false);
const animationStartTime = ref<number>(0);
const isOutlineLoading = ref<boolean>(false);

// Start loading animation
function startLoadingAnimation(processType: 'outline' | 'chapter', fromBeginning: boolean = false) {
  loadingProcessType.value = processType;
  loadingKey.value++;
  isLoadingNewChapter.value = fromBeginning;
}

// Stop loading animation
function stopLoadingAnimation() {
  isLoadingNewChapter.value = false;
}

// Fetch task progress
const fetchTaskProgress = async () => {
  try {
    // Call totalProcess API to get novel_doing_count for task limit check
    const progressRes = await api.totalProcess(true) as any;
    if (progressRes.code == 200 && progressRes.data) {
      return progressRes.data;
    }
  } catch (error) {
    console.error('Error fetching task progress:', error);
  }
  return null;
};

// Cover image state
const coverImage = ref<string>('');

const coverImageWebp = computed(() => {
  if (!coverImage.value) return '';
  return coverImage.value + '?imageMogr2/format/webp/quality/60';
});
const coverLoading = ref<boolean>(false);
const coverTaskId = ref<string>('');
const coverPollTimer = ref<number | null>(null);
const isUploading = ref<boolean>(false);
const showCoverZoomModal = ref<boolean>(false);
const zoomedCoverImage = ref<string>('');
const showCoverHistoryModal = ref<boolean>(false);
const coverHistoryList = ref<string[]>([]);

const showOutlineHistoryModal = ref<boolean>(false);
const isUsingOutlineHistory = ref<boolean>(false);
const outlineHistoryList = ref<any[]>([]);
const chapterHistoryList = ref<any[]>([]);
const chapterHistoryCount = ref<number>(0);
const isUsingChapterHistory = ref<boolean>(false);

// Chapter insert images (illustrations)
const insertImages = ref<Array<{ img_placeholder: number; url: string }>>([]);
// Raw history_data["novel_insert_image"] for the current chapter
const insertImageHistoryData = ref<any>(null);

const updateChapterHistoryFromDetail = (chapterRes: any) => {
  if (chapterRes.data?.history_data) {
    let historyData = chapterRes.data.history_data;
    if (typeof historyData == 'string') {
      try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
    }
    if (historyData?.novel_chapter && Array.isArray(historyData.novel_chapter)) {
      chapterHistoryList.value = historyData.novel_chapter;
      chapterHistoryCount.value = historyData.novel_chapter.length;
    } else {
      chapterHistoryList.value = [];
      chapterHistoryCount.value = 0;
    }
    // Insert image history (grouped/keyed by img_placeholder, structure resolved when opening modal)
    insertImageHistoryData.value = historyData?.novel_insert_image ?? null;
  } else {
    chapterHistoryList.value = [];
    chapterHistoryCount.value = 0;
    insertImageHistoryData.value = null;
  }

  // Extract insert images from result_async
  applyInsertImages(chapterRes);
};

// Parse result_async.insert_images from a chapter detail response.
// insert_images is an ordered array of image URL strings; the Nth
// [[img_placeholder]] in the content maps to the Nth URL (img_placeholder = index).
const applyInsertImages = (chapterRes: any) => {
  let ra = chapterRes?.data?.result_async;
  if (typeof ra === 'string') {
    try { ra = JSON.parse(ra); } catch (e) { ra = null; }
  }
  const images = ra?.insert_images;
  insertImages.value = Array.isArray(images)
    ? images.map((item: any, index: number) => ({
        img_placeholder: index,
        url: typeof item === 'string'
          ? item
          : (item?.url || item?.image_url || item?.img_url || item?.image || '')
      }))
    : [];
};

const hasInsertImages = computed(() => insertImages.value.length > 0);

// Compressed src for inline illustration display (raw image is too large).
// Mirrors the cover webp suffix; zoom still uses the original url.
const insertImageSrc = (url?: string): string => {
  if (!url) return '';
  return url + '?imageMogr2/format/webp/quality/60';
};

// Split displayedContent into ordered text/image segments by [[img_placeholder]] markers.
// Each occurrence of the marker maps, in order, to an item in insertImages
// (sorted by img_placeholder). The image's img_placeholder is kept for edit/history ops.
interface ChapterSegment {
  type: 'text' | 'image';
  text?: string;
  placeholder?: number;
  url?: string;
}

// Insert images ordered by img_placeholder so occurrence order is stable
const orderedInsertImages = computed(() =>
  [...insertImages.value].sort((a, b) => Number(a.img_placeholder) - Number(b.img_placeholder))
);

const parseContentSegments = (text: string): ChapterSegment[] => {
  const segments: ChapterSegment[] = [];
  const source = text || '';
  const regex = /\[\[img_placeholder\]\]/g;
  const ordered = orderedInsertImages.value;
  let lastIndex = 0;
  let occurrence = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    segments.push({ type: 'text', text: source.slice(lastIndex, match.index) });
    const img = ordered[occurrence];
    segments.push({
      type: 'image',
      placeholder: img ? Number(img.img_placeholder) : occurrence,
      url: img?.url || ''
    });
    occurrence += 1;
    lastIndex = match.index + match[0].length;
  }
  segments.push({ type: 'text', text: source.slice(lastIndex) });
  return segments;
};

const contentSegments = computed<ChapterSegment[]>(() => {
  if (!hasInsertImages.value) {
    return [{ type: 'text', text: displayedContent.value || '' }];
  }
  return parseContentSegments(displayedContent.value || '');
});

// Rebuild raw chapter content (with [[img_placeholder]] markers) from edited segments
const reconstructChapterContent = (): string => {
  return editingSegments.value
    .map(seg => (seg.type === 'image' ? `[[img_placeholder]]` : (seg.text || '')))
    .join('');
};

// ===== Insert image edit ("修改") + history ("历史") =====
const showInsertImageEdit = ref<boolean>(false);
const editingInsertImagePlaceholder = ref<number | null>(null);
const insertImagePrompt = ref<string>('');
const isRenewingInsertImage = ref<boolean>(false);
const insertImageRenewTaskId = ref<string>('');
const insertImageRenewPollTimer = ref<number | null>(null);
// Which illustration (by img_placeholder) is currently regenerating — drives its skeleton
const renewingInsertImagePlaceholder = ref<number | null>(null);
// Chapter of the illustration currently regenerating (so the skeleton only shows
// on the correct chapter, not a same-index image in another chapter)
const renewingInsertImageChapter = ref<number | null>(null);
// Reference images uploaded for the insert image edit (mirrors cover upload)
const insertImageRefImages = ref<any[]>([]);
const insertImageFileInputRef = ref<HTMLInputElement | null>(null);
// Contenteditable prompt input + @-mention dropdown state (mirrors cover input)
const insertImageInputRef = ref<HTMLElement | null>(null);
const showInsertImageAtDropdown = ref<boolean>(false);
const insertImageAtDropdownItems = ref<any[]>([]);
const isInsertImageComposing = ref<boolean>(false);
const previousInsertImageInputHtml = ref<string>('');

const showInsertImageHistoryModal = ref<boolean>(false);
const insertImageHistoryList = ref<string[]>([]);
const historyTargetPlaceholder = ref<number | null>(null);
// Estimated computing power for renewing an insert image
const insertImageCost = ref<number>(1);

// ===== 标记修改（标记修图）=====
const markupOpen = ref(false);
const markupType = ref<'cover' | 'insert'>('cover');
const markupImageUrl = ref('');
const markupImageName = ref('');
const markupPlaceholder = ref<number | null>(null);
const markupInstruction = ref('');
const showMarkupGuide = ref(false);
const markupGuideDisabled = ref(localStorage.getItem('novel-markup-guide-disabled') === '1');
const markupEstimatedPoints = computed(() => markupType.value === 'cover' ? coverCost.value : insertImageCost.value);

function openMarkupGuideIfNeeded() {
  if (!markupGuideDisabled.value) showMarkupGuide.value = true;
}
function handleDismissMarkupGuide(dontShowAgain: boolean) {
  showMarkupGuide.value = false;
  if (dontShowAgain) {
    markupGuideDisabled.value = true;
    localStorage.setItem('novel-markup-guide-disabled', '1');
  }
}
function closeMarkupEditor() {
  markupOpen.value = false;
}

// 打开封面的标记修改
async function openCoverMarkup() {
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (!coverImage.value) return;
  if (await checkProjectOwnershipByEstimate()) return;
  markupType.value = 'cover';
  markupPlaceholder.value = null;
  markupImageUrl.value = coverImage.value;
  markupImageName.value = t('novel.novelCover');
  markupInstruction.value = '';
  markupOpen.value = true;
  openMarkupGuideIfNeeded();
  // 拉取封面预估算力，展示在发送按钮上
  try {
    const estimateRes = await api.novelEstimate({ session_id: sessionId.value, step_name: 'cover' }) as any;
    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      coverCost.value = estimateRes.data.total_points;
    }
  } catch (error) {
    console.error('Error fetching cover estimate:', error);
  }
}

// 打开配图（插图）的标记修改
async function openInsertMarkup(placeholder?: number) {
  if (placeholder == null) return;
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;
  const seg = contentSegments.value.find((s: any) => s.type === 'image' && s.placeholder === placeholder);
  const url = seg?.url ? insertImageSrc(seg.url) : '';
  if (!url) return;
  markupType.value = 'insert';
  markupPlaceholder.value = placeholder;
  markupImageUrl.value = url;
  const chapterNum = currentChapter.value?.chapter ?? 1;
  const imageIndex = (insertImages.value.findIndex((i: any) => Number(i.img_placeholder) === placeholder) + 1) || (placeholder + 1);
  markupImageName.value = t('novel.insertImageChapter', { chapter: chapterNum, index: imageIndex });
  markupInstruction.value = '';
  markupOpen.value = true;
  openMarkupGuideIfNeeded();
  // 拉取插图预估算力，展示在发送按钮上
  fetchInsertImageEstimate();
}

// 发送标记图：上传后作为参考图 + 修改意见走现有重绘接口
async function handleSendMarkedImage(blob: Blob, instruction: string) {
  const file = new File([blob], `markup_${Date.now()}.png`, { type: 'image/png' });
  const uploadedUrl = await uploadCoverImage(file);
  if (!uploadedUrl) throw new Error(t('fail'));

  const token = localStorage.getItem('token') || '';

  if (markupType.value === 'cover') {
    if (await isTaskLimitExceeded()) return;
    isEditingCover.value = false;
    coverRenewLoading.value = true;
    coverRenewFailed.value = false;
    showCoverEditBtn.value = false;
    coverAbortController.value = new AbortController();
    const response = await fetch(`${aiUrl}ai/novel/renew_novel_cover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Platform': 'web', 'token': token },
      body: JSON.stringify({
        session_id: sessionId.value,
        prompt: instruction,
        new_reference_images: [uploadedUrl],
        is_markup: true,
      }),
      signal: coverAbortController.value.signal,
    });
    const res = await response.json();
    if (res.code == 200) {
      await fetchUserBalance();
      // 与普通封面重绘一致：发送后提示本次冻结算力
      const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
      if (hideFreezeModal !== '1') {
        freezeComputingPower.value = Math.round(coverCost.value * (balanceInfo.value?.over_freeze_rate || 1));
        showFreezeComputingPowerModal.value = true;
      }
      const taskId = res.data?.task_id || '';
      if (taskId) startCoverRenewPolling(taskId);
      markupOpen.value = false;
    } else {
      coverRenewLoading.value = false;
      showCoverEditBtn.value = true;
      throw new Error(res.message || t('fail'));
    }
    return;
  }

  // insert image
  const placeholder = markupPlaceholder.value;
  if (placeholder == null) return;
  if (await isTaskLimitExceeded()) return;
  const response = await fetch(`${aiUrl}ai/novel/renew_novel_insert_image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Platform': 'web', 'token': token },
    body: JSON.stringify({
      session_id: sessionId.value,
      chapter: currentChapter.value?.chapter,
      image_index: placeholder,
      prompt: instruction,
      new_reference_images: [uploadedUrl],
      is_markup: true,
    }),
  });
  const res = await response.json();
  if (res.code !== 200) {
    throw new Error(res.message || t('fail'));
  }
  const taskId = res.data?.task_id;
  markupOpen.value = false;
  if (taskId) {
    renewingInsertImagePlaceholder.value = placeholder;
    renewingInsertImageChapter.value = currentChapter.value?.chapter ?? null;
    await fetchUserBalance();
    showInsertFreezeModalIfNeeded();
    startInsertImageRenewPolling(taskId, placeholder);
  } else {
    const url = res.data?.url || res.data?.insert_image_url || '';
    if (url) updateInsertImageUrl(placeholder, url);
  }
}

// 配图重绘的冻结算力提示（与封面重绘一致的展示逻辑）
function showInsertFreezeModalIfNeeded() {
  const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
  if (hideFreezeModal !== '1') {
    freezeComputingPower.value = Math.round(insertImageCost.value * (balanceInfo.value?.over_freeze_rate || 1));
    showFreezeComputingPowerModal.value = true;
  }
}


// Fetch the estimated computing power for the insert image renew (step_name = insert_image)
const fetchInsertImageEstimate = async () => {
  try {
    const estimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'insert_image'
    }) as any;
    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      insertImageCost.value = estimateRes.data.total_points;
    }
  } catch (error) {
    console.error('Error fetching insert image estimate:', error);
  }
};

// Update an insert image url both in the source list and the edit segments
const updateInsertImageUrl = (placeholder: number, url: string) => {
  if (!url) return;
  const target = insertImages.value.find(i => Number(i.img_placeholder) === placeholder);
  if (target) target.url = url;
  editingSegments.value.forEach(seg => {
    if (seg.type === 'image' && seg.placeholder === placeholder) seg.url = url;
  });
};

// Sync edit-mode segment image urls from the current insertImages source
const syncEditSegmentImages = () => {
  editingSegments.value.forEach(seg => {
    if (seg.type === 'image') {
      const img = insertImages.value.find(i => Number(i.img_placeholder) === seg.placeholder);
      if (img) seg.url = img.url;
    }
  });
};

// Current image url for a placeholder (used as "current" in the history modal)
const getInsertImageUrl = (placeholder: number | null): string => {
  if (placeholder == null) return '';
  return insertImages.value.find(i => Number(i.img_placeholder) === placeholder)?.url || '';
};

// Open the edit input box for a specific illustration
const openInsertImageEdit = (placeholder?: number) => {
  if (placeholder == null) return;
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;
  editingInsertImagePlaceholder.value = placeholder;
  insertImagePrompt.value = '';
  insertImageRefImages.value = [];
  showInsertImageAtDropdown.value = false;
  showInsertImageHistoryModal.value = false;
  showInsertImageEdit.value = true;
  nextTick(() => { if (insertImageInputRef.value) insertImageInputRef.value.innerHTML = ''; });
  // Fetch estimated computing power for the insert image renew
  fetchInsertImageEstimate();
};

const cancelInsertImageEdit = () => {
  showInsertImageEdit.value = false;
  showInsertImageAtDropdown.value = false;
  editingInsertImagePlaceholder.value = null;
  insertImagePrompt.value = '';
  insertImageRefImages.value = [];
  if (insertImageInputRef.value) insertImageInputRef.value.innerHTML = '';
};

// Close the insert image edit box when navigating away (switching chapters,
// going to the outline, etc. — currentChapter changes on any such navigation)
watch(currentChapter, () => {
  if (showInsertImageEdit.value) {
    cancelInsertImageEdit();
  }
});

// Trigger the hidden file input for insert image reference upload
const triggerInsertImageFileUpload = () => {
  insertImageFileInputRef.value?.click();
};

const removeInsertImageRefImage = (imageId: number) => {
  insertImageRefImages.value = insertImageRefImages.value.filter(img => img.id !== imageId);
  // Remove any @-mention chips referencing this image from the prompt input
  if (insertImageInputRef.value) {
    const tags = insertImageInputRef.value.querySelectorAll(`span.image-tag[data-item-id="${imageId}"]`);
    tags.forEach(tag => tag.remove());
  }
};

// Upload a reference image for the insert image edit (reuses cover upload endpoint)
const handleInsertImageFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length == 0) return;
  const file = files[0];

  const maxImages = 3;
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (insertImageRefImages.value.length >= maxImages) {
    toast(t('novel.maxCoverImages', { max: maxImages }));
    input.value = '';
    return;
  }

  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    toast(t('novel.invalidCoverImageType'));
    input.value = '';
    return;
  }

  if (file.size > maxSizeBytes) {
    toast(t('novel.maxCoverSize', { max: maxSizeMB }));
    input.value = '';
    return;
  }

  isUploading.value = true;

  const imageCorrupted = await new Promise<boolean>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.width === 0 || img.height === 0); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(true); };
    img.src = url;
  });

  if (imageCorrupted) {
    toast(t('home.error.corruptedImage'));
    input.value = '';
    isUploading.value = false;
    return;
  }

  try {
    const uploadedUrl = await uploadCoverImage(file);
    insertImageRefImages.value.push({
      id: Date.now(),
      image: uploadedUrl,
      file
    });
  } catch (error) {
    console.error('Insert image reference upload error', error);
    toast(t('fail'));
  } finally {
    isUploading.value = false;
  }

  input.value = '';
};

// ===== Insert image prompt @-mention (contenteditable) — mirrors the cover input =====
const INSERT_IMAGE_PROMPT_MAX = 5000;

const getInsertImageInputCharCount = (element: HTMLElement): number => {
  let charCount = 0;
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        charCount += (node.textContent || '').length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute('contenteditable') && el.contentEditable === 'false') {
        charCount += 7;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNodes(node.childNodes[i]);
        }
      }
    }
  };
  walkNodes(element);
  return charCount;
};

const getInsertImageCursorPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
};

// Position the @-dropdown right under the @ symbol
const positionInsertImageDropdown = (atIndex: number) => {
  nextTick(() => {
    try {
      if (!insertImageInputRef.value) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      let currentPos = 0;
      let foundAtNode: Node | null = null;
      let atNodeOffset = 0;

      const findAtSymbol = (node: Node): boolean => {
        if (node.nodeType === 3) {
          if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
            return false;
          }
          const nodeText = node.textContent || '';
          const nodeLength = nodeText.length;
          if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
            foundAtNode = node;
            atNodeOffset = atIndex - currentPos;
            return true;
          }
          currentPos += nodeLength;
        } else if (node.nodeType === 1) {
          if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
            return false;
          }
          for (let i = 0; i < node.childNodes.length; i++) {
            if (findAtSymbol(node.childNodes[i])) return true;
          }
        }
        return false;
      };

      findAtSymbol(insertImageInputRef.value);

      if (foundAtNode) {
        const atRange = document.createRange();
        atRange.setStart(foundAtNode as Node, atNodeOffset);
        atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

        const rect = atRange.getBoundingClientRect();
        const inputInner = insertImageInputRef.value.parentElement;
        const dropdown = document.querySelector('.insert-image-edit-section .at-dropdown') as HTMLElement;

        if (inputInner && dropdown) {
          const inputInnerRect = inputInner.getBoundingClientRect();
          const relativeTop = rect.bottom - inputInnerRect.top;
          const relativeLeft = rect.left - inputInnerRect.left;
          dropdown.style.left = `${relativeLeft}px`;

          const dropdownHeight = dropdown.offsetHeight || 200;
          const availableBottomSpace = window.innerHeight - rect.bottom;
          if (availableBottomSpace < dropdownHeight) {
            dropdown.style.top = `${relativeTop - dropdownHeight - rect.height - 5}px`;
            dropdown.style.bottom = 'auto';
          } else {
            dropdown.style.top = `${relativeTop + 5}px`;
            dropdown.style.bottom = 'auto';
          }
        }
      }
    } catch (error) {
      console.error('Error positioning insert image dropdown:', error);
    }
  });
};

const maybeShowInsertImageAtDropdown = (target: HTMLElement) => {
  const cursorPosition = getInsertImageCursorPosition(target);
  const text = target.textContent || '';
  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  const hasItems = insertImageRefImages.value.length > 0;

  if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1 && hasItems) {
    showInsertImageAtDropdown.value = true;
    insertImageAtDropdownItems.value = insertImageRefImages.value;
    positionInsertImageDropdown(atIndex);
  } else {
    showInsertImageAtDropdown.value = false;
  }
};

const handleInsertImageInput = () => {
  if (!insertImageInputRef.value) return;
  const target = insertImageInputRef.value;

  if (getInsertImageInputCharCount(target) > INSERT_IMAGE_PROMPT_MAX) {
    target.innerHTML = previousInsertImageInputHtml.value;
    limitToast(t('home.error.maxInputLimit', { max: INSERT_IMAGE_PROMPT_MAX }));
    return;
  }
  previousInsertImageInputHtml.value = target.innerHTML;
  maybeShowInsertImageAtDropdown(target);
};

const handleInsertImageKeydown = (event: KeyboardEvent) => {
  if (isInsertImageComposing.value) return;
  if (event.key == 'Escape') {
    showInsertImageAtDropdown.value = false;
  } else if (event.key == 'Enter' && event.shiftKey) {
    event.preventDefault();
    document.execCommand('insertLineBreak');
  }
  if (insertImageInputRef.value) {
    const currentCharCount = getInsertImageInputCharCount(insertImageInputRef.value);
    if (currentCharCount >= INSERT_IMAGE_PROMPT_MAX && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      limitToast(t('home.error.maxInputLimit', { max: INSERT_IMAGE_PROMPT_MAX }));
    }
  }
};

const handleInsertImageInputClick = () => {
  if (insertImageInputRef.value) maybeShowInsertImageAtDropdown(insertImageInputRef.value);
};

const handleInsertImageInputBlur = () => {
  setTimeout(() => { showInsertImageAtDropdown.value = false; }, 200);
};

const handleInsertImagePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  if (!insertImageInputRef.value) return;
  const currentCharCount = getInsertImageInputCharCount(insertImageInputRef.value);
  const text = event.clipboardData?.getData('text/plain') || '';
  if (currentCharCount + text.length > INSERT_IMAGE_PROMPT_MAX) {
    limitToast(t('home.error.maxInputLimit', { max: INSERT_IMAGE_PROMPT_MAX }));
    return;
  }
  document.execCommand('insertText', false, text);
  nextTick(() => {
    const el = insertImageInputRef.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
      previousInsertImageInputHtml.value = el.innerHTML;
    }
  });
};

const handleInsertImageInputFocus = () => {
  if (insertImageInputRef.value) previousInsertImageInputHtml.value = insertImageInputRef.value.innerHTML;
};

// Insert an image chip at the @ symbol
const selectInsertImageAtItem = (item: any) => {
  if (!insertImageInputRef.value) return;
  const target = insertImageInputRef.value;
  const savedHtml = target.innerHTML;

  if (target.textContent?.trim() === '') target.innerHTML = '';

  const itemTag = document.createElement('span');
  itemTag.className = 'image-tag';
  itemTag.contentEditable = 'false';
  itemTag.dataset.itemId = String(item.id);

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.name || '';
  img.className = 'image-tag-img';
  itemTag.appendChild(img);

  const imageIndex = insertImageRefImages.value.findIndex(imgItem => imgItem.id === item.id) + 1;
  const labelText = `${t('home.img')}${imageIndex}`;
  itemTag.appendChild(document.createTextNode(labelText));

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.appendChild(itemTag);
    target.appendChild(document.createTextNode(' '));
    target.focus();
    showInsertImageAtDropdown.value = false;
    return;
  }

  const range = selection.getRangeAt(0);
  const cursorPos = getInsertImageCursorPosition(target);

  let atNode: Node | null = null;
  let atOffset = 0;
  let currentCharPos = 0;

  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        const text = node.textContent || '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '@' && currentCharPos + i <= cursorPos) {
            atNode = node;
            atOffset = i;
          }
        }
        currentCharPos += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') return;
      for (let i = 0; i < node.childNodes.length; i++) walkNodes(node.childNodes[i]);
    }
  };
  walkNodes(target);

  if (atNode) {
    const atRange = document.createRange();
    atRange.setStart(atNode, atOffset);
    atRange.setEnd(range.endContainer, range.endOffset);
    atRange.deleteContents();
    atRange.insertNode(itemTag);
  } else {
    range.insertNode(itemTag);
  }

  const space = document.createTextNode(' ');
  const newRange = document.createRange();
  newRange.setStartAfter(itemTag);
  newRange.insertNode(space);
  newRange.setStartAfter(space);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  showInsertImageAtDropdown.value = false;
  insertImageInputRef.value.focus();

  if (getInsertImageInputCharCount(insertImageInputRef.value) > INSERT_IMAGE_PROMPT_MAX) {
    insertImageInputRef.value.innerHTML = savedHtml;
    limitToast(t('home.error.maxInputLimit', { max: INSERT_IMAGE_PROMPT_MAX }));
    return;
  }
  previousInsertImageInputHtml.value = insertImageInputRef.value.innerHTML;
};

// Build the prompt string, replacing image chips with <ref_N> markers
const processInsertImagePrompt = (): string => {
  if (!insertImageInputRef.value) return '';
  const spans = insertImageInputRef.value.querySelectorAll('span.image-tag');
  let prompt = insertImageInputRef.value.innerText || insertImageInputRef.value.textContent || '';
  spans.forEach((span) => {
    const itemId = span.getAttribute('data-item-id');
    if (itemId) {
      const imageIndex = insertImageRefImages.value.findIndex(img => img.id === parseInt(itemId));
      if (imageIndex !== -1) {
        prompt = prompt.replace(span.textContent || '', `<ref_${imageIndex + 1}>`);
      }
    }
  });
  prompt = prompt.replace(/\n/g, '');
  return prompt.trim();
};

// Regenerate a single illustration from a prompt (mirrors cover renew flow)
const generateInsertImage = async () => {
  if (isRenewingInsertImage.value) return;
  if (editingInsertImagePlaceholder.value == null) return;
  const prompt = processInsertImagePrompt();
  if (!prompt) {
    toast(t('novel.insertImageEditEmpty'));
    return;
  }
  if (checkProjectOwnership()) return;

  const token = localStorage.getItem('token') || '';
  const placeholder = editingInsertImagePlaceholder.value;
  try {
    isRenewingInsertImage.value = true;
    if (await isTaskLimitExceeded()) {
      isRenewingInsertImage.value = false;
      return;
    }
    // 插图重绘接口（已确认）
    const response = await fetch(`${aiUrl}ai/novel/renew_novel_insert_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        chapter: currentChapter.value?.chapter,
        image_index: placeholder,
        prompt: prompt,
        new_reference_images: insertImageRefImages.value.map(img => img.image)
      })
    });
    const res = await response.json();
    if (res.code !== 200) {
      toast(res.message || t('fail'));
      isRenewingInsertImage.value = false;
      return;
    }
    const taskId = res.data?.task_id;
    if (taskId) {
      // Close the edit box and show a skeleton on the target illustration.
      // The skeleton (renewingInsertImagePlaceholder) tracks progress from here,
      // so reset the send button's loading state.
      renewingInsertImagePlaceholder.value = placeholder;
      renewingInsertImageChapter.value = currentChapter.value?.chapter ?? null;
      showInsertImageEdit.value = false;
      showInsertImageAtDropdown.value = false;
      await fetchUserBalance();
      showInsertFreezeModalIfNeeded();
      startInsertImageRenewPolling(taskId, placeholder);
      isRenewingInsertImage.value = false;
    } else {
      // No task id: try to read url directly
      const url = res.data?.url || res.data?.insert_image_url || '';
      if (url) updateInsertImageUrl(placeholder, url);
      isRenewingInsertImage.value = false;
      showInsertImageEdit.value = false;
    }
  } catch (e) {
    console.error('Error renewing insert image:', e);
    toast(t('fail'));
    isRenewingInsertImage.value = false;
  }
};

const stopInsertImageRenewPolling = () => {
  if (insertImageRenewPollTimer.value) {
    clearInterval(insertImageRenewPollTimer.value);
    insertImageRenewPollTimer.value = null;
  }
  insertImageRenewTaskId.value = '';
  renewingInsertImagePlaceholder.value = null;
  renewingInsertImageChapter.value = null;
};

const startInsertImageRenewPolling = (taskId: string, placeholder: number) => {
  insertImageRenewTaskId.value = taskId;
  isRenewingInsertImage.value = true;

  const poll = async () => {
    try {
      const res = await api.taskPolling(taskId) as any;
      if (handleSessionTimeout(res.code) || res.code == 401) {
        stopInsertImageRenewPolling();
        isRenewingInsertImage.value = false;
        return;
      }
      if (res.code == 200 && res.data?.status == 'SUCCESS') {
        // Renew task result carries { chapter, image_index, image_url }
        const result = res.data.result || {};
        const editedChapter = result.chapter ?? currentChapter.value?.chapter;
        const editedIndex = result.image_index;
        const newUrl = result.image_url || result.insert_image_url || result.url || '';

        // Only apply to the chapter currently displayed
        if (currentChapter.value && Number(currentChapter.value.chapter) === Number(editedChapter)) {
          // Immediate feedback: swap the regenerated illustration's url
          if (newUrl && editedIndex != null) {
            updateInsertImageUrl(Number(editedIndex), newUrl);
          }
          // Refresh chapter detail to sync the latest images + history
          // (history_data.novel_insert_image)
          try {
            const chapterRes = await api.detailChapter(sessionId.value, editedChapter) as any;
            if (chapterRes.code == 200) {
              updateChapterHistoryFromDetail(chapterRes);
              syncEditSegmentImages();
            }
          } catch (e) {
            console.error('Error refreshing chapter after insert image renew:', e);
          }
        }

        isRenewingInsertImage.value = false;
        showInsertImageEdit.value = false;
        await fetchUserBalance();
        stopInsertImageRenewPolling();
      } else if (res.data?.status == 'FAIL') {
        toast(t('fail'));
        isRenewingInsertImage.value = false;
        await fetchUserBalance();
        stopInsertImageRenewPolling();
      }
    } catch (error) {
      console.error('Error polling insert image renew:', error);
      isRenewingInsertImage.value = false;
      stopInsertImageRenewPolling();
    }
  };

  poll();
  insertImageRenewPollTimer.value = window.setInterval(poll, 3000);
};

// Resolve the history url list for a specific illustration.
// history_data.novel_insert_image is a flat array of records:
//   { chapter, image_index, image_url, prompt, updated_at, ... }
// History for an illustration = records matching its chapter + image_index,
// newest first.
const getInsertImageHistoryList = (placeholder: number | null): string[] => {
  if (placeholder == null) return [];
  const data = insertImageHistoryData.value;
  if (!Array.isArray(data)) return [];
  const chapterNum = currentChapter.value?.chapter;
  return data
    .filter((item: any) => item && typeof item === 'object'
      && Number(item.image_index) === Number(placeholder)
      && (chapterNum == null || Number(item.chapter) === Number(chapterNum)))
    .sort((a: any, b: any) =>
      new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
    .map((item: any) => item.image_url)
    .filter(Boolean);
};

// Show the history icon only when the illustration has 2+ history records
const hasInsertImageHistory = (placeholder?: number): boolean => {
  if (placeholder == null) return false;
  return getInsertImageHistoryList(placeholder).length >= 2;
};

// Whether a given segment's illustration is the one currently regenerating
// (matched by both chapter and image index, so a same-index image in another
// chapter never shows the skeleton)
const isInsertImageRenewing = (placeholder?: number): boolean => {
  return renewingInsertImagePlaceholder.value != null
    && renewingInsertImagePlaceholder.value === placeholder
    && renewingInsertImageChapter.value === (currentChapter.value?.chapter ?? null);
};

// Whether an illustration in the currently displayed chapter is regenerating.
// While true, all edit/history icons of this chapter are hidden until the task
// succeeds or fails.
const isChapterRenewingInsertImage = (): boolean => {
  return renewingInsertImagePlaceholder.value != null
    && renewingInsertImageChapter.value === (currentChapter.value?.chapter ?? null);
};

const openInsertImageHistory = (placeholder?: number) => {
  if (placeholder == null) return;
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;
  historyTargetPlaceholder.value = placeholder;
  // Resolve the history list for this specific illustration
  insertImageHistoryList.value = getInsertImageHistoryList(placeholder);
  showInsertImageEdit.value = false;
  showInsertImageHistoryModal.value = true;
};

const closeInsertImageHistoryModal = () => {
  showInsertImageHistoryModal.value = false;
};

// Restore a selected history image for the target placeholder (mirrors cover replace flow)
const selectHistoryInsertImage = async (url: string) => {
  if (checkProjectOwnership()) return;
  if (historyTargetPlaceholder.value == null) return;
  const placeholder = historyTargetPlaceholder.value;
  try {
    const token = localStorage.getItem('token') || '';
    // TODO 确认端点: 插图历史替换接口
    const response = await fetch(`${aiUrl}ai/novel/replace_novel_insert_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        chapter: currentChapter.value?.chapter,
        img_placeholder: placeholder,
        url
      })
    });
    const res = await response.json();
    if (res.code == 200) {
      updateInsertImageUrl(placeholder, url);
      showInsertImageHistoryModal.value = false;
    } else {
      toast(res.message || t('fail'));
    }
  } catch (e) {
    console.error('Error replacing insert image:', e);
    toast(t('fail'));
  }
};

const showChapterHistoryModal = ref<boolean>(false);

const isAiEditingChapter = ref<boolean>(false);
const aiEditChapterInput = ref<string>('');
const isSendingChapterEdit = ref<boolean>(false);
const chapterEditCost = ref<number>(1);
const chapterEditSectionRef = ref<HTMLElement | null>(null);

// Start polling for cover image
const startCoverPolling = (taskId: string) => {
  coverTaskId.value = taskId;
  coverLoading.value = true;
  isGeneratingOutline.value = false;
  taskStatus.value = 'DOING';
  hasFailed.value = false;

  const poll = async () => {
    try {
      const res = await api.taskPolling(taskId) as any;

      if (handleSessionTimeout(res.code) || res.code == 401) {
        if (coverPollTimer.value) {
          clearInterval(coverPollTimer.value);
          coverPollTimer.value = null;
        }
        return;
      }

      if (res.code == 200 && res.data?.status == 'SUCCESS') {
        coverImage.value = res.data.result?.generate_novel_cover || '';
        coverLoading.value = false;
        showCoverEditBtn.value = true;
        // Set status to success when cover generation is successful
        taskStatus.value = 'SUCCESS';
        hasFailed.value = false;
        // Reset isGeneratingOutline to false to hide similar content row
        isGeneratingOutline.value = false;
        // Reset currentChapter to show "待生成章节" section in left sidebar
        currentChapter.value = null;
        // Reset stepChapterIndex to 0 to show "待生成章节" section
        stepChapterIndex.value = 0;
        // Reset currentStepName to outline to show generate buttons
        currentStepName.value = 'outline';

        // Ensure outlineData is available for showing "待生成章节" section
        if (!outlineData.value && outlineStreamParser.value) {
          try {
            const json = outlineStreamParser.value.extractJson(outlineStreamParser.value.rawBuf || '');
            if (json && json.base_info) {
              outlineData.value = json;
              if (json.base_info.total_chapters) {
                chapterCount.value = json.base_info.total_chapters;
              }
            }
          } catch (e) {
            console.error('Error parsing outline data during cover polling:', e);
          }
        }

        // Always fetch detailProject to ensure latest outline data and chapter titles
        try {
          const detailProjectRes = await api.detailProject(sessionId.value) as any;
          if (detailProjectRes.code == 200) {
            if (detailProjectRes.data?.user_id) {
              projectOwnerId.value = detailProjectRes.data.user_id;
            }
            // Update project name if available
            if (detailProjectRes.data?.name) {
              projectName.value = detailProjectRes.data.name;
            }

            // Update outline data if available
            if (detailProjectRes.data?.result_async) {
              let result = detailProjectRes.data.result_async;
              if (typeof result == 'string') {
                result = JSON.parse(result);
              }
              if (result.generate_novel_outline) {
                result = result.generate_novel_outline;
              }
              if (result.base_info) {
                outlineData.value = result;
                if (result.base_info.total_chapters) {
                  chapterCount.value = result.base_info.total_chapters;
                }
              }
            }

            // Update chapters if available
            if (detailProjectRes.data?.chapters) {
              chapters.value = detailProjectRes.data.chapters;
            }
          }
        } catch (e) {
          console.error('Error fetching detail project during cover polling:', e);
        }

        // Fetch latest balance after generation completes
        await fetchUserBalance();

        if (coverPollTimer.value) {
          clearInterval(coverPollTimer.value);
          coverPollTimer.value = null;
        }
      } else if (res.data?.status == 'FAIL') {
        coverLoading.value = false;
        // Set status to fail when cover generation fails
        taskStatus.value = 'FAIL';
        hasFailed.value = true;
        // Reset isGeneratingOutline to false when cover generation fails
        isGeneratingOutline.value = false;
        // Fetch latest balance after generation fails
        await fetchUserBalance();
        if (coverPollTimer.value) {
          clearInterval(coverPollTimer.value);
          coverPollTimer.value = null;
        }
      }
    } catch (error) {
      console.error('Error polling cover:', error);
      // Set status to fail when polling fails
      taskStatus.value = 'FAIL';
      hasFailed.value = true;
      coverLoading.value = false;
      if (coverPollTimer.value) {
        clearInterval(coverPollTimer.value);
        coverPollTimer.value = null;
      }
    }
  };

  poll();
  coverPollTimer.value = window.setInterval(poll, 3000);
};

// Stop polling for cover image
const stopCoverPolling = () => {
  if (coverPollTimer.value) {
    clearInterval(coverPollTimer.value);
    coverPollTimer.value = null;
  }
  coverTaskId.value = '';
};

// Outline streaming state
const outlineStreamParser = ref<OutlineStreamParser | null>(null);
const outlineStreamText = ref<string>('');
const outlineStreamDone = ref<boolean>(false);
const outlineStreamError = ref<string>('');
const outlineStreamMetadata = ref<{ title?: string; totalChapters?: number } | null>(null);

// Streaming state variables
const isLoadingComplete = ref<boolean>(false);
const isStreaming = ref<boolean>(false);
const hasStreamingContent = ref<boolean>(false);
const hasStreamData = ref<boolean>(false);

// Handle loading complete event from NovelLoading component
const handleLoadingComplete = () => {
  isLoadingComplete.value = true;

  // If there's pending content to display, show it now
  if (pendingDisplayContent.value) {
    displayedContent.value = pendingDisplayContent.value;
    pendingDisplayContent.value = '';
  }

  // Hide loading
  isLoading.value = false;
};

const startOutlineStream = async () => {
  if (outlineStreamParser.value) {
    outlineStreamParser.value.destroy();
  }

  outlineStreamText.value = '';
  outlineStreamDone.value = false;
  outlineStreamError.value = '';
  outlineStreamMetadata.value = null;
  isLoading.value = true; // Ensure loading is shown while waiting for data

  // Start loading animation for outline generation
  startLoadingAnimation('outline', true);
  isStreaming.value = true;
  hasStreamingContent.value = false;
  hasStreamData.value = false;

  // Set cover task ID for polling
  coverTaskId.value = sessionId.value;

  const token = localStorage.getItem('token') || '';

  outlineStreamParser.value = new OutlineStreamParser({
    onText: (text) => {
      outlineStreamText.value = text;
      // Hide loading screen once we start receiving data
      if (text.length > 0) {
        isLoading.value = false;
        hasStreamingContent.value = true;
        // 初始滚动到顶部，确保内容从开始处显示
        nextTick(() => {
          if (outlineContentRef.value) {
            outlineContentRef.value.scrollTop = 0;
          }
        });
      }
      // Auto-scroll outline content to bottom during streaming
      nextTick(() => {
        nextTick(() => {
          if (outlineContentRef.value) {
            // Force scroll to bottom
            outlineContentRef.value.scrollTop = outlineContentRef.value.scrollHeight;
          }
        });
      });
    },
    onComplete: (finalText, metadata) => {
      outlineStreamDone.value = true;
      outlineStreamMetadata.value = metadata || null;
      outlineStreamText.value = finalText;

      if (metadata?.title) {
        projectName.value = metadata.title;
      }

      if (metadata?.totalChapters) {
        chapterCount.value = metadata.totalChapters;
      }

      // Parse outline data before starting cover polling
      try {
        const json = outlineStreamParser.value?.extractJson(outlineStreamParser.value?.rawBuf || '');
        if (json) {
          if (json.base_info) {
            outlineData.value = json;
          }
        }
      } catch (e) {
        console.error('Error parsing outline data:', e);
      }

      // Keep loading state until task polling returns SUCCESS
      isLoading.value = true;

      // Reset streaming state
      isStreaming.value = false;
      hasStreamingContent.value = false;
      hasStreamData.value = false;

      // Stop loading animation
      stopLoadingAnimation();

      // Start polling for task status after outline stream is done
      if (sessionId.value) {
        startPolling();
      }

      // Start polling for cover image only after task status is SUCCESS
      // This will be handled in handlePollingResponse when status is SUCCESS
    },
    onError: (error) => {
      outlineStreamError.value = error;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
      isLoading.value = false;
      isGeneratingOutline.value = false;

      // Reset streaming state
      isStreaming.value = false;
      hasStreamingContent.value = false;
      hasStreamData.value = false;

      // Stop loading animation
      stopLoadingAnimation();
    },
    t: t
  });

  outlineStreamParser.value.start(sessionId.value, token);
};

const shouldShowEstimatedTime = computed(() => {
  // Show estimated time when task is in progress, regardless of startTime
  // Show when: DOING, isPreparing (queue), or isGeneratingOutline
  // Don't show when: FAIL or SUCCESS
  if (taskStatus.value == 'DOING' || isGeneratingOutline.value || isPreparing.value) return true;
  return false;
});

// 封面或配图正在重绘（普通重绘 / 标记修改都会经过这些状态）
const isImageRenewing = computed(() => coverRenewLoading.value || renewingInsertImagePlaceholder.value != null);

// 相似推荐显示条件：生成大纲/生成当前章节内容时，或封面/配图重绘时
const shouldShowSimilar = computed(() =>
  (shouldShowEstimatedTime.value && (isGeneratingOutline.value || (currentChapter.value && generatingChapter.value && currentChapter.value.chapter == generatingChapter.value)))
  || isImageRenewing.value,
);

const shouldShowActionButtons = computed(() => {
  if (taskStatus.value == 'DOING') return false;
  if (isLoading.value) return false;
  if (hasFailed.value && (!currentChapter.value || currentChapter.value.chapter == stepChapterIndex.value)) return false;
  if (!outlineData.value && !currentChapter.value && !outlineStreamDone.value) return false;
  return true;
});

// Show next arrow: on outline page with chapters, or on a chapter that's not the latest
const showNextArrow = computed(() => {
  // Don't show while typing
  if (isChapterTyping.value) return false;
  if (stepChapterIndex.value < 1) return false;

  // On outline page (no currentChapter), show next arrow if there are chapters generated
  if (!currentChapter.value && outlineData.value && chapterCount.value > 0) {
    return true;
  }

  // On a chapter, show next arrow if not the latest generated chapter
  if (currentChapter.value && currentChapter.value.chapter < stepChapterIndex.value) {
    return true;
  }

  return false;
});

const shouldShowGenerateButtons = computed(() => {
  if (!shouldShowActionButtons.value) return false;

  // Don't show buttons while editing a chapter
  if (isEditingChapter.value) return false;

  // Don't show buttons when task is in progress
  if (taskStatus.value == 'DOING') return false;

  // Don't show buttons while typewriter is still printing chapter content
  if (isChapterTyping.value) return false;

  // Don't show if all chapters are generated
  if (currentChapter.value && currentChapter.value.chapter >= chapterCount.value) return false;

  // Don't show buttons when in preparation state
  if (isPreparing.value) return false;

  // Don't show buttons if step_name is chapter when viewing outline
  if (!currentChapter.value) {
    if (currentStepName.value == 'chapter' || ((currentStepName.value == 'renew_novel_cover' || currentStepName.value == 'refresh_novel_cover') && coverRenewLoading.value)) return false;
    if (stepChapterIndex.value >= chapterCount.value && chapterCount.value > 0) return false;
  }

  // Don't show buttons during batch chapter generation
  if (isBatchChapter.value == 1) return false;

  // For outline page, show buttons if outline is available
  if (!currentChapter.value) return true;

  // For chapter page, only show on the latest chapter (stepChapterIndex)
  // When a chapter failed, show on the latest successful chapter instead
  if (hasFailed.value && taskStatus.value == 'FAIL') {
    const maxExistingChapter = chapters.value.length > 0
      ? Math.max(...chapters.value.map((c: any) => c.chapter))
      : 0;
    if (currentChapter.value.chapter !== maxExistingChapter) return false;
  } else {
    if (currentChapter.value.chapter !== stepChapterIndex.value) return false;
  }

  return true;
});

const selectedLanguageLabel = computed(() => {
  const lang = languageOptions.value.find(l => l.value == selectedLanguage.value);
  return lang ? lang.label : t('novel.language.zh');
});

watch(() => shouldShowGenerateButtons.value, (newValue) => {
  if (newValue) {
    fetchPointsEstimate();
  }
});

// Auto-scroll to bottom when loading state changes
// Only auto-scroll during chapter generation, not outline generation
// watch(() => taskStatus.value, (newStatus) => {
//   if (newStatus == 'DOING' && !outlineStreamDone.value && !isChapterTyping.value && !isGeneratingOutline.value) {
//     nextTick(() => {
//       if (outlineContentRef.value) {
//         outlineContentRef.value.scrollTop = outlineContentRef.value.scrollHeight;
//       }
//     });
//   }
// });

// Parse and handle structured outline data
const handleStructuredData = async (result: any) => {
  try {
    let parsedResult;
    if (typeof result == 'string') {
      parsedResult = JSON.parse(result);
      // Check if parsed result has generate_novel_cover field
      if (parsedResult.generate_novel_cover) {
        coverImage.value = parsedResult.generate_novel_cover;
        showCoverEditBtn.value = true;
      }
      // Check if parsed result has generate_novel_outline field
      if (parsedResult.generate_novel_outline) {
        parsedResult = parsedResult.generate_novel_outline;
      }
    } else {
      parsedResult = result;
      // Check if result has generate_novel_cover field
      if (parsedResult.generate_novel_cover) {
        coverImage.value = parsedResult.generate_novel_cover;
        showCoverEditBtn.value = true;
      }
      // Check if result has generate_novel_outline field
      if (parsedResult.generate_novel_outline) {
        parsedResult = parsedResult.generate_novel_outline;
      }
    }

    // Check if this is chapter data
    if (parsedResult && parsedResult.chapter !== undefined) {
      currentChapter.value = parsedResult;
      // Update step chapter index when viewing a chapter
      if (parsedResult.chapter > stepChapterIndex.value) {
        stepChapterIndex.value = parsedResult.chapter;
      }
      // Don't clear outlineData when viewing a chapter
      // outlineData.value = null;
      // Fetch points estimate for chapter data only if generation hasn't failed
      if (!hasFailed.value) {
        await fetchPointsEstimate();
      }
      return;
    }

    // This is outline data
    outlineData.value = parsedResult;
    backupOutlineData.value = parsedResult;
    currentChapter.value = null;
    // Don't reset stepChapterIndex to 0 when viewing outline
    // stepChapterIndex.value = 0;

    if (outlineData.value?.base_info?.total_chapters) {
      chapterCount.value = outlineData.value.base_info.total_chapters;
    }

    // Check if base_info has title and update project name directly
    if (outlineData.value?.base_info?.title) {
      const titleFromApi = outlineData.value.base_info.title;
      if (titleFromApi) {
        projectName.value = titleFromApi;
      }
    }

    // Fetch points estimate for next chapter and all chapters only if generation hasn't failed
    // if (!hasFailed.value) {
    //   await fetchPointsEstimate();
    // }
  } catch (error) {
    console.error('Error parsing structured data:', error);
    outlineContent.value = typeof result == 'string' ? result : JSON.stringify(result);
    printContent(outlineContent.value);
  }
};

// Fetch points estimate for next chapter, all chapters, and cover
const fetchPointsEstimate = async (includeCover = false) => {
  try {
    if (stepChapterIndex.value >= chapterCount.value && chapterCount.value > 0 && !includeCover) {
      return;
    }

    // Only fetch chapter estimates if not just fetching cover estimate
    if (!includeCover) {
      // Calculate from_chapter: if stepChapterIndex is 0 (outline), use 1; otherwise use stepChapterIndex + 1
      const fromChapter = stepChapterIndex.value == 0 ? 1 : stepChapterIndex.value + 1;

      // Estimate for next chapter
      const nextChapterEstimateRes = await api.novelEstimate({
        session_id: sessionId.value,
        step_name: 'chapter',
        from_chapter: fromChapter
      }) as any;
      if (nextChapterEstimateRes.code == 200 && nextChapterEstimateRes.data?.total_points) {
        nextChapterPoints.value = nextChapterEstimateRes.data.total_points;
      } else if (nextChapterEstimateRes.code == 10404) {
        toast(t('novel.error.cannotOperateOtherUserProject'));
        return;
      }

      // Estimate for all chapters
      const allChaptersEstimateRes = await api.novelEstimate({
        session_id: sessionId.value,
        step_name: 'all_chapters',
        from_chapter: fromChapter
      }) as any;
      if (allChaptersEstimateRes.code == 200 && allChaptersEstimateRes.data?.total_points) {
        allChaptersPoints.value = allChaptersEstimateRes.data.total_points;
      }
    }

    // Estimate for cover (only if includeCover is true)
    if (includeCover) {
      const coverEstimateRes = await api.novelEstimate({
        session_id: sessionId.value,
        step_name: 'cover'
      }) as any;
      if (coverEstimateRes.code == 200 && coverEstimateRes.data?.total_points) {
        coverCost.value = coverEstimateRes.data.total_points;
      }
    }
  } catch (error) {
    console.error('Error fetching points estimate:', error);
  }
};

// Compute costs
const nextChapterCost = computed(() => Math.max(nextChapterPoints.value, 1));
const allChaptersCost = computed(() => allChaptersPoints.value);

// Store original content when opening regenerate input
const originalRegenerateContent = ref<string>('');

const regenerateOutline = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (await checkProjectOwnershipByEstimate('outline')) return;
  // if (!await checkServerStateSync('SUCCESS')) return;

  hideEdit();

  // Fetch latest user settings
  await fetchUserSelectedSettings();

  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
  showRegenerateInput.value = true;

  // Store original content from user settings
  if (userSelectedSettings.value?.others?.content) {
    originalRegenerateContent.value = userSelectedSettings.value.others.content;
    regenerateContent.value = userSelectedSettings.value.others.content;
  } else {
    originalRegenerateContent.value = '';
    regenerateContent.value = '';
  }

  // Set word count if available
  if (userSelectedSettings.value?.total_words) {
    switch (userSelectedSettings.value.total_words) {
      case 3:
        selectedWordCount.value = '30K';
        break;
      case 10:
        selectedWordCount.value = '100K';
        break;
      case 30:
        selectedWordCount.value = '300K';
        break;
      default:
        selectedWordCount.value = '30K';
    }
  }

  // Set language if available
  if (userSelectedSettings.value?.language) {
    selectedLanguage.value = userSelectedSettings.value.language;
  }

  // Set NSFW mode & illustration setting from user settings (default to 4)
  regenerateNsfwMode.value = userSelectedSettings.value?.story_mode === 'nsfw';
  const rawInsertCount = userSelectedSettings.value?.insert_image_count;
  selectedInsertImage.value = (rawInsertCount !== undefined && rawInsertCount !== null && rawInsertCount !== '')
    ? Number(rawInsertCount)
    : 4;
  showInsertImageDropdown.value = false;
};

// Cancel regenerate
const cancelRegenerate = () => {
  showRegenerateInput.value = false;
  // Reset to original content when canceling
  regenerateContent.value = originalRegenerateContent.value;
};

// Dropdown toggle methods
const toggleWordCountDropdown = () => {
  showWordCountDropdown.value = !showWordCountDropdown.value;
  showLanguageDropdown.value = false;
  showInsertImageDropdown.value = false;
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
  showWordCountDropdown.value = false;
  showInsertImageDropdown.value = false;
};

const toggleInsertImageDropdown = () => {
  showInsertImageDropdown.value = !showInsertImageDropdown.value;
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
};

const selectInsertImage = (value: number) => {
  selectedInsertImage.value = value;
  showInsertImageDropdown.value = false;
};

// Close regenerate footer dropdowns when clicking outside
const handleRegenerateClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target && !target.closest('.novel-selector')) {
    showWordCountDropdown.value = false;
    showLanguageDropdown.value = false;
    showInsertImageDropdown.value = false;
  }
};

// Determine whether the NSFW switch can be shown based on region (non-CN only)
function getCountry(): Promise<void> {
  if (hasFetchedRegion.value) {
    return Promise.resolve();
  }
  if (isFetchingRegion.value) {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (hasFetchedRegion.value) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }
  isFetchingRegion.value = true;
  return (api.getCode() as Promise<any>).then((res: any) => {
    hasFetchedRegion.value = true;
    isFetchingRegion.value = false;
    if (res.code == 0 && res.data?.countryCode != 'CN') {
      userRegion.value = true;
    } else {
      userRegion.value = false;
    }
  }).catch(err => {
    console.log(err);
    userRegion.value = false;
    hasFetchedRegion.value = true;
    isFetchingRegion.value = false;
  });
}

const toggleRegenerateNsfw = () => {
  if (!regenerateNsfwMode.value) {
    // Turning NSFW ON — run age check + confirmation flow (consistent with Home)
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (checkAgeForUnlimitedMode()) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      regenerateNsfwMode.value = true;
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    // Turning NSFW OFF — reset illustration setting to default
    regenerateNsfwMode.value = false;
    selectedInsertImage.value = 4;
    showInsertImageDropdown.value = false;
  }
};

// Age check before enabling NSFW/unlimited mode
const checkAgeForUnlimitedMode = (): boolean => {
  if (!userInfo.value) {
    return false;
  }

  // 未满18岁（详情接口 is_adult != 1）：弹出「是否满18岁」问询
  if (isTeenager.value) {
    showUnderageNoBirthdayModal.value = true;
    return true;
  }

  return false;
};

// Confirm enabling NSFW mode from the UnlimitedModeModal
const confirmRegenerateNsfw = () => {
  regenerateNsfwMode.value = true;
  showUnlimitedModal.value = false;
};

const handleUnlimitedAgeConfirm = async (isAdult: boolean) => {
  showUnderageNoBirthdayModal.value = false;
  // 选择"否"：未满18岁，直接关闭不开启
  if (!isAdult) {
    return;
  }
  // 选择"是"：声明已满18岁，写回后端 is_adult
  try {
    const res = await api.setAdult({ is_adult: 1 }) as any;
    if (res.code != 0 && res.code != 200) {
      toast(t('fail'));
      return;
    }
  } catch (error) {
    console.error('Error setting adult:', error);
    return;
  }
  if (userInfo.value) {
    userInfo.value.is_adult = 1;
  }

  // 确认满18岁后直接开启无限制模式（不再二次弹「是否开启无限制」确认）
  regenerateNsfwMode.value = true;
};

const closeDropdowns = () => {
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
};

const selectWordCount = (count: string) => {
  selectedWordCount.value = count;
  showWordCountDropdown.value = false;
};

const selectLanguage = (lang: string) => {
  selectedLanguage.value = lang;
  showLanguageDropdown.value = false;
};

// Send regenerate request
const sendRegenerateRequest = async () => {
  // Guard against double click
  if (isSendingRegenerate.value) {
    return;
  }
  isSendingRegenerate.value = true;

  // Hide dropdowns when sending regenerate request
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
  showInsertImageDropdown.value = false;

  if (!regenerateContent.value?.trim()) {
    toast(t('novel.error.emptyRegenerateContent'));
    isSendingRegenerate.value = false;
    return;
  }

  try {
    // if (!await checkServerStateSync('SUCCESS')) {
    //   isSendingRegenerate.value = false;
    //   return;
    // }
    // Check if task limit is exceeded
    if (await isTaskLimitExceeded()) {
      isSendingRegenerate.value = false;
      return;
    }

    let totalWords;
    switch (selectedWordCount.value) {
      case '30K':
        totalWords = 3;
        break;
      case '100K':
        totalWords = 10;
        break;
      case '300K':
        totalWords = 30;
        break;
      default:
        totalWords = 3;
    }

    const token = localStorage.getItem('token');

    // Get previous settings from userSelectedSettings
    const previousSettings = userSelectedSettings.value || {};
    const previousOthers = previousSettings.others || {};

    // When the NSFW switch is hidden (region not allowed), force normal mode + 0 images,
    // even if the previous setting was NSFW/unlimited.
    const effectiveNsfw = userRegion.value && regenerateNsfwMode.value;

    // Build request data based on previous settings, only updating modified fields
    const requestData = {
      ...previousSettings,
      session_id: sessionId.value,
      language: selectedLanguage.value,
      story_mode: effectiveNsfw ? 'nsfw' : 'normal',
      insert_image_count: effectiveNsfw ? selectedInsertImage.value : 0,
      others: {
        ...previousOthers,
        content: regenerateContent.value.trim(),
        total_words: totalWords,
        lang: selectedLanguage.value
      },
      total_words: totalWords
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token || ''
      },
      body: JSON.stringify(requestData)
    });

    const userSelectedRes = await response.json();

    if (userSelectedRes.code !== 200) {
      toast(userSelectedRes.message || t('fail'));
      isSendingRegenerate.value = false;
      return;
    }

    // Update userSelectedSettings with new data
    if (userSelectedRes.data) {
      userSelectedSettings.value = userSelectedRes.data;
    }

    // Read content, word count, and language from others if available
    if (userSelectedRes.data?.others) {
      // Display the content in the left area
      if (userSelectedRes.data.others.content) {
        outlineContent.value = userSelectedRes.data.others.content;
        displayedContent.value = userSelectedRes.data.others.content;
        // Set topic to content for novelOutline API
        topic.value = userSelectedRes.data.others.content;
      }

      // Update word count and language if available
      if (userSelectedRes.data.total_words) {
        switch (userSelectedRes.data.total_words) {
          case 3:
            selectedWordCount.value = '30K';
            break;
          case 10:
            selectedWordCount.value = '100K';
            break;
          case 30:
            selectedWordCount.value = '300K';
            break;
          default:
            selectedWordCount.value = '30K';
        }
      }
      if (userSelectedRes.data.language) {
        selectedLanguage.value = userSelectedRes.data.language;
      }

      // Update novelSettings in local storage
      const novelSettings = {
        wordCount: selectedWordCount.value,
        language: selectedLanguage.value
      };
      localStorage.setItem('novelSettings', JSON.stringify(novelSettings));
    }

    // Hide regenerate input and clear content
    // First hide dropdowns
    showWordCountDropdown.value = false;
    showLanguageDropdown.value = false;
    showInsertImageDropdown.value = false;
    // Then hide the entire regenerate section
    showRegenerateInput.value = false;
    regenerateContent.value = '';

    // Await callNovelOutline to handle errors properly - data clearing and loading state are handled inside
    try {
      await callNovelOutline('renew');
    } finally {
      // Reset flag after call completes
      isSendingRegenerate.value = false;
    }
  } catch (error) {
    console.error('Error sending regenerate request:', error);
    toast(t('fail'));
    isSendingRegenerate.value = false;
  }
};

// Start editing project name
const startEditProjectName = async () => {
  hideEdit();
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;

  originalProjectName.value = projectName.value;
  // Ensure project name is not longer than 60 characters
  if (projectName.value.length > 60) {
    projectName.value = projectName.value.substring(0, 60);
  }
  isEditingName.value = true;
  nextTick(() => {
    if (projectNameInputRef.value) {
      (projectNameInputRef.value as HTMLElement).focus();
    }
  });
};

// Save project name
const saveProjectName = async () => {
  if (!projectName.value?.trim()) {
    toast(t('novel.error.emptyProjectName'));
    return;
  }

  isSavingProjectName.value = true;
  try {
    const modifyRes = await api.modifyProject({
      session_id: sessionId.value,
      name: projectName.value.trim()
    }) as any;

    if (modifyRes.code == 200 || modifyRes.code == 0) {
      isEditingName.value = false;
    } else {
      toast(modifyRes.message || t('fail'));
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isSavingProjectName.value = false;
  }
};

// Cancel editing project name
const cancelEditProjectName = () => {
  projectName.value = originalProjectName.value;
  isEditingName.value = false;
};

// Handle project name input blur
const isSavingProjectName = ref<boolean>(false);
const handleProjectNameBlur = () => {
  if (!isSavingProjectName.value) {
    if (!projectName.value?.trim()) {
      projectName.value = originalProjectName.value;
    }
    isEditingName.value = false;
  }
};

// Start editing chapter
 const startEditChapter = async () => {
   if (coverRenewFailed.value) {
     toast(t('novel.coverRenewFailedTip'));
     return;
   }
   if (coverRenewLoading.value) {
     toast(t('novel.coverRenewLoadingTip'));
     return;
   }
   if (renewingInsertImagePlaceholder.value != null) {
     toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
     return;
   }
   if (checkProjectOwnership()) return;

   if (!currentChapter.value?.chapter) return;

   isAiEditingChapter.value = false;

   if (currentChapter.value?.content) {
     originalChapterContent.value = currentChapter.value.content;
     editingChapterContent.value = currentChapter.value.content;
     editingChapterTitle.value = currentChapter.value.title || '';
     // Build per-segment editing model when the chapter has insert images
     editingSegments.value = hasInsertImages.value
       ? parseContentSegments(currentChapter.value.content)
       : [];
     isEditingChapter.value = true;

    nextTick(() => {
      if (chapterEditTextareaRef.value) {
        chapterEditTextareaRef.value.focus();
        chapterEditTextareaRef.value.setSelectionRange(0, 0);
        // Scroll textarea to top
        chapterEditTextareaRef.value.scrollTop = 0;
      }
      // Restore scroll position to keep it at the top
      if (outlineContentRef.value) {
        outlineContentRef.value.scrollTop = 0;
      }

      // Use setTimeout to ensure scroll position is set after browser's auto-scroll
      setTimeout(() => {
        if (chapterEditTextareaRef.value) {
          chapterEditTextareaRef.value.scrollTop = 0;
        }
        if (outlineContentRef.value) {
          outlineContentRef.value.scrollTop = 0;
        }
      }, 0);
    });
  }
};

// Handle session timeout error (code=10407)
// This error indicates the session has expired and needs a page refresh
const handleSessionTimeout = (code: number) => {
  if (code == 10407) {
    toast(t('novel.error.staleOperation'));
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    return true;
  }
  return false;
};

// Fetch estimated time
const fetchEstimatedTime = async (queuePosition: number = 0) => {
  try {
    const res = await api.estimateTime(sessionId.value) as any;

    if (res.code == 200 && res.data) {
      // Get estimated time in seconds from API
      let apiEstimatedSeconds;
      if (isGeneratingOutline.value) {
        apiEstimatedSeconds = res.data.max_outline_estimate_seconds;
      } else {
        apiEstimatedSeconds = res.data.max_chapter_estimate_seconds;
      }

      // Validate the estimated time
      if (apiEstimatedSeconds && apiEstimatedSeconds > 0 && apiEstimatedSeconds < 86400) {
        originalEstimatedSeconds.value = apiEstimatedSeconds;
      } else {
        originalEstimatedSeconds.value = 600;
      }

      // Get queue position from API response if available
      let apiQueuePosition = res.data.queue_position ?? queuePosition;

      // Update ongoing task count with queue position
      ongoingTaskCount.value = apiQueuePosition;

      // Update prepareQueueInfo count with accurate queue_position from estimate API
      if (isPreparing.value) {
        const estimatedMinutes = Math.ceil((originalEstimatedSeconds.value || 600) / 60) + apiQueuePosition * 20;
        prepareQueueInfo.value = {
          count: apiQueuePosition,
          estimatedTime: estimatedMinutes
        };
      }

      // Calculate total estimated time in seconds
      estimatedTime.value = (originalEstimatedSeconds.value || 0) + apiQueuePosition * 20 * 60;

      estimatedTimeFetched.value = true;

      // Calculate initial display minutes
      let initialMinutes = Math.ceil(estimatedTime.value / 60);
      let chapterRemaining = originalEstimatedSeconds.value || 600;

      // Check if we're in chapter generation mode (next chapter or all chapters)
      // In this case, use startTime instead of taskStartAt since we don't have fresh task_start_at
      if (lastGenerationType.value == 'chapter' && startTime.value) {
        // Use startTime for chapter generation
        const startTimestamp = startTime.value / 1000;
        const currentTimestamp = res.data.current_timestamp;
        const elapsedSeconds = currentTimestamp - startTimestamp;
        const remainingSeconds = Math.max(0, estimatedTime.value - elapsedSeconds);
        initialMinutes = Math.ceil(remainingSeconds / 60);
        // Calculate chapter-specific remaining time (subtract queue time)
          const queueTimeSeconds = apiQueuePosition * 20 * 60;
        const chapterElapsedSeconds = Math.max(0, elapsedSeconds - queueTimeSeconds);
        chapterRemaining = Math.max(0, (originalEstimatedSeconds.value || 600) - chapterElapsedSeconds);
      } else if (taskStartAt.value && res.data.current_timestamp) {
        const startTimestamp = parseToUnixTimestamp(taskStartAt.value);

        if (startTimestamp) {
          const currentTimestamp = res.data.current_timestamp;
          const elapsedSeconds = currentTimestamp - startTimestamp;
          const remainingSeconds = Math.max(0, estimatedTime.value - elapsedSeconds);
          initialMinutes = Math.ceil(remainingSeconds / 60);
        const queueTimeSeconds = apiQueuePosition * 20 * 60;
          const chapterElapsedSeconds = Math.max(0, elapsedSeconds - queueTimeSeconds);
          chapterRemaining = Math.max(0, (originalEstimatedSeconds.value || 600) - chapterElapsedSeconds);
        }
      } else if (startTime.value) {
        // Fallback: use startTime if taskStartAt is not available
        const elapsedSeconds = Math.floor((Date.now() - startTime.value) / 1000);
        const remainingSeconds = Math.max(0, estimatedTime.value - elapsedSeconds);
        initialMinutes = Math.ceil(remainingSeconds / 60);
        // Calculate chapter-specific remaining time (subtract queue time)
        const queueTimeSeconds = apiQueuePosition * 20 * 60;
        const chapterElapsedSeconds = Math.max(0, elapsedSeconds - queueTimeSeconds);
        chapterRemaining = Math.max(0, (originalEstimatedSeconds.value || 600) - chapterElapsedSeconds);
      }

      // Ensure at least 1 minute
      if (initialMinutes < 1) {
        initialMinutes = 1;
      }
      if (chapterRemaining < 60) {
        chapterRemaining = 60;
      }

      displayMinutes.value = initialMinutes;
      if (isGeneratingOutline.value) {
        const startTimeSec = taskStartAt.value ? parseToUnixTimestamp(taskStartAt.value) : (startTime.value || Date.now()) / 1000;
        const totalElapsedSeconds = res.data.current_timestamp - startTimeSec;
        const queueTimeSeconds = apiQueuePosition * 20 * 60;
        const outlineElapsedSeconds = Math.max(0, totalElapsedSeconds - queueTimeSeconds);
        const outlineRemaining = (originalEstimatedSeconds.value || 600) - outlineElapsedSeconds;
        chapterRemainingSeconds.value = Math.max(60, outlineRemaining);
        rawChapterRemainingSeconds.value = outlineRemaining;
      } else {
        chapterRemainingSeconds.value = chapterRemaining;
        rawChapterRemainingSeconds.value = chapterRemaining;
      }

      // Start countdown timer
      startCountdownTimer();
    }
  } catch (error) {
    console.error('Error fetching estimated time:', error);
    // Set default values on error
    originalEstimatedSeconds.value = 600;
    chapterRemainingSeconds.value = 600;
    // If queuePosition is 0, use 1 instead to ensure estimated time is shown
    const adjustedQueuePosition = queuePosition === 0 ? 1 : queuePosition;
    estimatedTime.value = adjustedQueuePosition * 600 + 600;
    displayMinutes.value = Math.ceil(estimatedTime.value / 60);
    estimatedTimeFetched.value = true;
  }
};

// Start countdown timer: simply decrement displayMinutes by 1 every 60 seconds
const startCountdownTimer = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }

  countdownTimer.value = window.setInterval(() => {
    if (taskStartAt.value && !isLoadingNewChapter.value) {
      const startTimestamp = parseToUnixTimestamp(taskStartAt.value);
      if (startTimestamp) {
        const totalSeconds = (originalEstimatedSeconds.value || 600) + (ongoingTaskCount.value || 0) * 20 * 60;
        const elapsedSeconds = Math.floor(Date.now() / 1000) - startTimestamp;
        const remainingMinutes = Math.max(1, Math.ceil((totalSeconds - elapsedSeconds) / 60));
        displayMinutes.value = remainingMinutes;
        return;
      }
    }
    if (startTime.value) {
      const totalSeconds = (originalEstimatedSeconds.value || 600) + (ongoingTaskCount.value || 0) * 20 * 60;
      const elapsedSeconds = Math.floor((Date.now() - startTime.value) / 1000);
      const remainingMinutes = Math.max(1, Math.ceil((totalSeconds - elapsedSeconds) / 60));
      displayMinutes.value = remainingMinutes;
      return;
    }
    if (displayMinutes.value > 1) {
      displayMinutes.value--;
    } else {
      displayMinutes.value = 1;
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value);
        countdownTimer.value = null;
      }
    }
  }, 1000);
};

// Auto resize textarea to fit content
const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';

  textarea.style.height = textarea.scrollHeight + 'px';
};

// Handle chapter edit input
const handleChapterEditInput = () => {
  // Limit input to 50000 characters
  if (editingChapterContent.value.length > 50000) {
    editingChapterContent.value = editingChapterContent.value.substring(0, 50000);
  }

  nextTick(() => {
    if (chapterEditTextareaRef.value) {
      autoResizeTextarea(chapterEditTextareaRef.value);
    }
  });
};

// Cancel editing chapter
const cancelEditChapter = () => {
  editingChapterContent.value = originalChapterContent.value;
  editingSegments.value = [];
  isEditingChapter.value = false;
};

// Save edited chapter
  const saveEditChapter = async () => {
    if (coverRenewFailed.value) {
      toast(t('novel.coverRenewFailedTip'));
      return;
    }
    if (coverRenewLoading.value) {
      toast(t('novel.coverRenewLoadingTip'));
      return;
    }
    if (renewingInsertImagePlaceholder.value != null) {
      toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
      return;
    }
    if (currentChapter.value) {
      // When the chapter has insert images, rebuild content from the edited segments
      if (hasInsertImages.value && editingSegments.value.length) {
        editingChapterContent.value = reconstructChapterContent();
      }
      if (editingChapterContent.value == originalChapterContent.value && editingChapterTitle.value == currentChapter.value.title) {
        isEditingChapter.value = false;
        return;
      }

      if (!editingChapterContent.value?.trim()) {
        toast(t('novel.error.emptyChapterContent'));
        return;
      }

      if (!editingChapterTitle.value?.trim()) {
        toast(t('novel.chapterTitleRequired'));
        return;
      }

  try {
    isSavingChapter.value = true;
    const token = localStorage.getItem('token');

        const updateData = {
          chapter: currentChapter.value.chapter,
          title: editingChapterTitle.value,
          content: editingChapterContent.value
        };

        const response = await fetch(`${aiUrl}app/project/update_chapter/${sessionId.value}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Platform': 'web',
            'token': token || ''
          },
          body: JSON.stringify(updateData)
        });

        const res = await response.json();

        if (res.code !== 200) {
          toast(res.message || t('fail'));
          return;
        }

        currentChapter.value.title = editingChapterTitle.value;
        currentChapter.value.content = editingChapterContent.value;
        displayedContent.value = editingChapterContent.value;

        const existingChapter = chapters.value.find((c: any) => c.chapter === currentChapter.value?.chapter);
        if (existingChapter) {
          existingChapter.title = editingChapterTitle.value;
        }

        try {
          const chapterRes = await api.detailChapter(sessionId.value, currentChapter.value?.chapter) as any;
          if (chapterRes.code == 200) {
            updateChapterHistoryFromDetail(chapterRes);
          }
        } catch (e) {
          console.error('Error fetching chapter detail after edit:', e);
        }
      } catch (error) {
        console.error('Error updating chapter:', error);
        toast(t('fail'));
      } finally {
        isSavingChapter.value = false;
      }
    }
    isEditingChapter.value = false;
  };

// Start editing chapter title
const startEditChapterTitle = async (chapterId: number, currentTitle: string) => {
  hideEdit();
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;

  editingChapterId.value = chapterId;
  originalChapterTitle.value = currentTitle;
  // Ensure chapter title is not longer than 60 characters
  editingChapterTitle.value = currentTitle.length > 60 ? currentTitle.substring(0, 60) : currentTitle;
  nextTick(() => {
    if (chapterTitleInputs.value[chapterId]) {
      chapterTitleInputs.value[chapterId]?.focus();
    }
  });
};

// Save edited chapter title
const saveChapterTitle = async (chapterId: number) => {
  if (!editingChapterTitle.value?.trim()) {
    toast(t('novel.error.emptyChapterTitle'));
    return;
  }

  isHandlingChapterAction.value = true;
  isSavingChapterTitle.value = true;
  try {
    let chapterContent = '';
    if (currentChapter.value && currentChapter.value.chapter == chapterId) {
      chapterContent = currentChapter.value.content || '';
    } else {
      try {
        const chapterRes = await api.detailChapter(sessionId.value, chapterId) as any;
        if (chapterRes.code == 200 && chapterRes.data) {
          chapterContent = chapterRes.data.content || '';
        }
      } catch (e) {
        console.error('Error fetching chapter content for title update:', e);
      }
    }

    const token = localStorage.getItem('token');
    const updateData = {
      chapter: chapterId,
      title: editingChapterTitle.value,
      content: chapterContent
    };

    const response = await fetch(`${aiUrl}app/project/update_chapter/${sessionId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token || ''
      },
      body: JSON.stringify(updateData)
    });

    const res = await response.json();

    if (res.code == 200) {
      if (outlineData.value && outlineData.value.outline) {
        const chapter = outlineData.value.outline.find((c: any) => c.chapter == chapterId);
        if (chapter) {
          chapter.title = editingChapterTitle.value;
        }
      }

      if (chapters.value.length > 0) {
        const chapter = chapters.value.find((c: any) => c.chapter == chapterId);
        if (chapter) {
          chapter.title = editingChapterTitle.value;
        }
      }

      if (currentChapter.value && currentChapter.value.chapter == chapterId) {
        currentChapter.value = { ...currentChapter.value, title: editingChapterTitle.value };
      }
    } else {
      toast(res.message || t('fail'));
    }
  } catch (error) {
    console.error('Error updating chapter title:', error);
    toast(t('fail'));
  } finally {
    editingChapterId.value = null;
    isSavingChapterTitle.value = false;
    isHandlingChapterAction.value = false;
  }
};

const cancelChapterTitle = () => {
  isHandlingChapterAction.value = true;
  editingChapterId.value = null;
  editingChapterTitle.value = originalChapterTitle.value;
  setTimeout(() => {
    isHandlingChapterAction.value = false;
  }, 100);
};

const handleChapterTitleBlur = () => {
  // Only cancel if not saving and not handling an action
  if (!isSavingChapterTitle.value && !isHandlingChapterAction.value) {
    cancelChapterTitle();
  }
};

// Get main characters
const getMainCharacters = () => {
  if (!outlineData.value?.characters) return [];
  return outlineData.value.characters.filter((char: any) => char.type == '主角');
};

// Get supporting characters
const getSupportingCharacters = () => {
  if (!outlineData.value?.characters) return [];
  return outlineData.value.characters.filter((char: any) => char.type == '配角' || char.type !== '主角');
};

// Printer effect for content display - character by character
const printContent = (content: string) => {
  displayedContent.value = '';
  let charIndex = 0;
  let userScrolled = false;

  // Find # CH followed by digits and start from after there if it exists
  let startContent = content;
  startContent = startContent.replace(/\\n/g, '\n');

  // Clear any existing interval
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
  }

  // Get the appropriate scroll element based on current content
  const getScrollElement = () => {
    return currentChapter.value ? chapterContentRef.value : outlineContentRef.value;
  };

  const scrollElement = getScrollElement();

  // Add scroll event listener to detect user scrolling
  let programmaticScroll = false;
  let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
  const handleScroll = () => {
    if (programmaticScroll) return; // Ignore scroll events triggered by our own code
    userScrolled = true;
    // Resume auto-scroll after 3 seconds of no user scrolling
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      userScrolled = false;
    }, 3000);
  };

  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll);
  }

  const doAutoScroll = () => {
    if (!userScrolled && scrollElement) {
      programmaticScroll = true;
      scrollElement.scrollTop = scrollElement.scrollHeight;
      requestAnimationFrame(() => { programmaticScroll = false; });
    }
  };

  printerInterval.value = window.setInterval(() => {
    if (charIndex < startContent.length) {
      displayedContent.value += startContent[charIndex];
      charIndex++;

      // Auto scroll to bottom only if user hasn't scrolled
      doAutoScroll();
    } else {
      if (printerInterval.value) {
        clearInterval(printerInterval.value);
        printerInterval.value = null;
      }
      // Remove scroll event listener
      if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    }
  }, 30);
};

function goHome() {
  hideEdit();

  // Clean up stream reader before leaving
  try {
    if (streamReaderController.value) {
      streamReaderController.value.abort();
      streamReaderController.value = null;
    }
  } catch (e: any) {
    streamReaderController.value = null;
  }

  // Clean up polling before leaving
  try {
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }
  } catch (e: any) {
    printerInterval.value = null;
  }

  try {
    if (outlineStreamParser.value) {
      outlineStreamParser.value.destroy();
      outlineStreamParser.value = null;
    }
  } catch (e: any) {
    outlineStreamParser.value = null;
  }

  router.push("/");
}

function goProject() {


  hideEdit();

  // Clean up stream reader before leaving
  try {
    if (streamReaderController.value) {
      streamReaderController.value.abort();
      streamReaderController.value = null;
    }
  } catch (e: any) {
    streamReaderController.value = null;
  }

  // Clean up polling before leaving
  try {
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }
  } catch (e: any) {
    printerInterval.value = null;
  }

  try {
    if (outlineStreamParser.value) {
      outlineStreamParser.value.destroy();
      outlineStreamParser.value = null;
    }
  } catch (e: any) {
    outlineStreamParser.value = null;
  }

  router.push({
    path: '/my-projects',
    query: {
      tab: 1
    }
  })
}

function goUser() {


  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
  } else {
    hideEdit();

    router.push("/user-personal");
  }
}

function goToSimilar() {


  hideEdit();

  // Get language from user selected settings (from result_async -> user_selected.language)
  // selectedLanguage is already set from userSelectedSettings.value?.language
  const lang = selectedLanguage.value;

  // For NovelGenerate, the content type is novel (type=2)
  const type = 2;

  router.push({
    path: "/similar",
    query: {
      type: type,
      lang: lang,
      session_id: sessionId.value
    }
  });
}

const fetchSimilarList = async (page: number = 1) => {
  if (similarLoading.value) return;
  similarLoading.value = true;
  try {
    const lang = selectedLanguage.value;
    const showNsfw = localStorage.getItem('allowSensitiveContent') == '1' ? 1 : 0;
    const res = await api.getRelativeByTopicPublic({
      session_id: sessionId.value || '',
      cat: 2,
      lang: lang,
      show_nsfw: showNsfw,
      page: page,
      page_size: 7,
    }) as any;
    if ((res.code == 200 || res.code == 0) && res.data?.data) {
      similarList.value = res.data.data;
      const total = res.data.allnums || 0;
      similarTotalPages.value = Math.max(1, Math.ceil(total / 7));
      similarPage.value = page;
    }
  } catch (e) {
    console.error('Error fetching similar list:', e);
  } finally {
    similarLoading.value = false;
  }
};

const refreshSimilar = () => {
  similarList.value = [];
  const nextPage = similarPage.value >= similarTotalPages.value ? 1 : similarPage.value + 1;
  fetchSimilarList(nextPage);
};

const goToSimilarDetail = (item: any) => {
  const bookId = item.book_id;
  const uid = item.author?.id || item.author_info?.id || '';
  router.push(`/collection/${bookId}${uid ? '?uid=' + uid : ''}`);
};



// Call novelNext API
const callNovelNext = async (retryChapter?: number, skipBalanceCheck: boolean = false) => {
  hideEdit();
  stopDetailPolling();

  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }

  // if (!await checkServerStateSync('SUCCESS')) return;

  if (!skipBalanceCheck) isNextLoading.value = true;
  try {

  if (await isTaskLimitExceeded()) { isRetryingChapter.value = false; return; }

  const nextChapterIndex = retryChapter !== undefined ? retryChapter : (currentChapter.value ? currentChapter.value.chapter + 1 : 1);

  // Check balance before proceeding (skip if already checked in retry flow)
  if (!skipBalanceCheck) {
    const fromChapter = retryChapter !== undefined ? retryChapter : (stepChapterIndex.value == 0 ? 1 : stepChapterIndex.value + 1);
    const estimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'chapter',
      from_chapter: fromChapter
    }) as any;
    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      const estimatedPoints = estimateRes.data.total_points;
      estimatedComputingPower.value = estimatedPoints;
      await fetchUserBalance();
      const requiredPower = Math.round(estimatedPoints * 1.05);
      if (userBalance.value < requiredPower) {
        estimatedFrozenPower.value = Math.round(estimatedPoints * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        isRetryingChapter.value = false;
        return;
      }
    } else if (estimateRes.code == 10404) {
      toast(t('novel.error.cannotOperateOtherUserProject'));
      isRetryingChapter.value = false;
      return;
    }
  }

  const generateMode = retryChapter !== undefined ? 'retry' : 'new';

  isUserInitiatedGeneration.value = true;
  shouldShowTypewriter.value = true;
  shouldAutoNavigate.value = false;
  isRetryingChapter.value = retryChapter !== undefined;

  // Call API first, set loading state only after success
  const novelNextRes = await api.novelNext({
    session_id: sessionId.value,
    chapter: nextChapterIndex,
    generate_mode: generateMode
  }) as any;

  if (novelNextRes.code == 40015) {
    const retryRes = await api.novelNext({
      session_id: sessionId.value,
      chapter: nextChapterIndex,
      generate_mode: 'retry'
    }) as any;
    if (retryRes.code !== 200) {
      isRetryingChapter.value = false;
      if (handleSessionTimeout(retryRes.code)) {
        return;
      }
      if (retryRes.code == 40011) {
        await fetchUserBalance();
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        return;
      }
      toast(retryRes.message || t('fail'));
      return;
    }
    Object.assign(novelNextRes, retryRes);
  }

  if (novelNextRes.code !== 200) {
    isRetryingChapter.value = false;
    // Handle session timeout error - refresh page
    if (handleSessionTimeout(novelNextRes.code)) {
      return;
    }
    // Handle insufficient balance error
    if (novelNextRes.code == 40011) {
      await fetchUserBalance();
      estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
      showInsufficientBalanceModal.value = true;
      return;
    }
    toast(novelNextRes.message || t('fail'));
    return;
  }

  // API successful, now set UI state
  const nextChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == nextChapterIndex);
  currentChapter.value = {
    chapter: nextChapterIndex,
    title: nextChapterData?.title || '',
    content: ''
  };

  // Add new chapter to chapters array if not exists
  const existingChapter = chapters.value.find((c: any) => c.chapter == nextChapterIndex);
  if (!existingChapter) {
    chapters.value.push({
      id: `temp-${nextChapterIndex}`,
      chapter: nextChapterIndex,
      title: nextChapterData?.title || t('novel.untitled'),
      is_publish: 2 // 未发布状态
    });
  }

  displayedContent.value = '';
  pendingDisplayContent.value = '';
  isLoadingComplete.value = false;
  isLoading.value = true;

  // Start loading animation for chapter generation
  startLoadingAnimation('chapter', true);
  hasFailed.value = false;
  taskStatus.value = 'DOING';
  lastGenerationType.value = 'chapter';
  isGeneratingOutline.value = false;
  isChapterTyping.value = false;
  generatingChapter.value = nextChapterIndex;
  stepChapterIndex.value = nextChapterIndex;
  currentStepName.value = 'chapter';

  // API successful, check if we need to show freeze computing power modal
  const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
  if (hideFreezeModal !== '1') {
    // Get frozen points from detail project
    const detailRes = await api.detailProject(sessionId.value) as any;
    if (detailRes.code == 200 && detailRes.data?.frozen_points !== undefined) {
      freezeComputingPower.value = detailRes.data.frozen_points;
      pendingGenerationAction.value = retryChapter !== undefined ? 'retry-chapter' : 'chapter';
      showFreezeComputingPowerModal.value = true;
    }
  }

  // Get task_id from response
  const taskId = novelNextRes.data?.task_id || '';

  // Use the time from API response as start time if available
  if (novelNextRes.time) {
    const startTimestamp = parseToUnixTimestamp(novelNextRes.time);
    if (startTimestamp) {
      startTime.value = startTimestamp * 1000;
    } else {
      startTime.value = Date.now();
    }
  } else {
    startTime.value = Date.now();
  }

  // Fetch estimated time
  estimatedTime.value = null;
  originalEstimatedSeconds.value = null;
  displayMinutes.value = 0;
  estimatedTimeFetched.value = false;
  fetchEstimatedTime();

  await fetchUserBalance();

  // Use polling to fetch chapter content
  await fetchChapterStream(nextChapterIndex, taskId);

  // Update points estimate after chapter generation only if generation hasn't failed
  if (!hasFailed.value) {
    await fetchPointsEstimate();
  }
  } finally {
    isNextLoading.value = false;
  }
};

function hideEdit() {
  isEditingName.value = false;
  isEditingChapter.value = false;
  editingChapterId.value = null;
  isEditingCover.value = false;
  isAiEditingOutline.value = false;
  isAiEditingChapter.value = false;
  isManualEditingOutline.value = false;
  editingOutlineData.value = null;
  showRegenerateInput.value = false;
}

const startManualEditOutline = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (await checkProjectOwnershipByEstimate('outline')) return;
  hideEdit();
  isManualEditingOutline.value = true;
  editingOutlineData.value = JSON.parse(JSON.stringify(outlineData.value));
  outlineEditOriginalData.value = JSON.parse(JSON.stringify(outlineData.value));
  outlineEditDirty.value = false;
  outlineEditErrorKeys.value = new Set();
  nextTick(() => {
    if (outlineContentRef.value) {
      outlineContentRef.value.scrollTop = 0;
    }
  });
};

const cancelManualEditOutline = () => {
  isManualEditingOutline.value = false;
  editingOutlineData.value = null;
  nextTick(() => {
    if (outlineContentRef.value) {
      outlineContentRef.value.scrollTop = 0;
    }
  });
};

const addOutlineCharacter = () => {
  if (!editingOutlineData.value) return;
  if (editingOutlineData.value.characters.length >= 10) {
    toast(t('novel.maxCharactersLimit'));
    return;
  }
  editingOutlineData.value.characters.push({
    name: '',
    description: ''
  });
  outlineEditDirty.value = true;
  nextTick(() => {
    const container = outlineContentRef.value;
    const characterItems = container?.querySelectorAll('.character-item');
    if (characterItems && characterItems.length > 0) {
      const lastItem = characterItems[characterItems.length - 1];
      lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};
const removeOutlineCharacter = (index: number) => {
  if (!editingOutlineData.value) return;
  editingOutlineData.value.characters.splice(index, 1);
  const newErrors = new Set<string>();
  outlineEditErrorKeys.value.forEach(key => {
    const match = key.match(/^(character-name|character-desc)-(\d+)$/);
    if (match) {
      const idx = parseInt(match[2]);
      if (idx < index) {
        newErrors.add(key);
      } else if (idx > index) {
        newErrors.add(`${match[1]}-${idx - 1}`);
      }
    } else {
      newErrors.add(key);
    }
  });
  outlineEditErrorKeys.value = newErrors;
  outlineEditDirty.value = true;
};

const removeOutlineChapter = (index: number) => {
  if (!editingOutlineData.value) return;
  editingOutlineData.value.outline.splice(index, 1);
  updateOutlineChapterNumbers();
  const newErrors = new Set<string>();
  outlineEditErrorKeys.value.forEach(key => {
    const match = key.match(/^(chapter-title|chapter-desc)-(\d+)$/);
    if (match) {
      const idx = parseInt(match[2]);
      if (idx < index) {
        newErrors.add(key);
      } else if (idx > index) {
        newErrors.add(`${match[1]}-${idx - 1}`);
      }
    } else {
      newErrors.add(key);
    }
  });
  outlineEditErrorKeys.value = newErrors;
  outlineEditDirty.value = true;
};

const insertChapterBefore = (index: number) => {
  if (!editingOutlineData.value) return;
  const outline = editingOutlineData.value.outline;
  if (outline.length >= 100) {
    toast(t('novel.maxChaptersLimit'));
    return;
  }
  outline.splice(index, 0, {
    chapter: 0,
    title: '',
    description: ''
  });
  updateOutlineChapterNumbers();
  const newErrors = new Set<string>();
  outlineEditErrorKeys.value.forEach(key => {
    const match = key.match(/^(chapter-title|chapter-desc)-(\d+)$/);
    if (match) {
      const idx = parseInt(match[2]);
      if (idx < index) {
        newErrors.add(key);
      } else {
        newErrors.add(`${match[1]}-${idx + 1}`);
      }
    } else {
      newErrors.add(key);
    }
  });
  outlineEditErrorKeys.value = newErrors;
  outlineEditDirty.value = true;
  nextTick(() => {
    const container = outlineContentRef.value;
    const chapterCards = container?.querySelectorAll('.chapter-card');
    if (chapterCards && chapterCards[index]) {
      chapterCards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

const insertChapterAfter = (index: number) => {
  if (!editingOutlineData.value) return;
  const outline = editingOutlineData.value.outline;
  if (outline.length >= 100) {
    toast(t('novel.maxChaptersLimit'));
    return;
  }
  outline.splice(index + 1, 0, {
    chapter: 0,
    title: '',
    description: ''
  });
  updateOutlineChapterNumbers();
  const newErrors = new Set<string>();
  outlineEditErrorKeys.value.forEach(key => {
    const match = key.match(/^(chapter-title|chapter-desc)-(\d+)$/);
    if (match) {
      const idx = parseInt(match[2]);
      if (idx <= index) {
        newErrors.add(key);
      } else {
        newErrors.add(`${match[1]}-${idx + 1}`);
      }
    } else {
      newErrors.add(key);
    }
  });
  outlineEditErrorKeys.value = newErrors;
  outlineEditDirty.value = true;
  nextTick(() => {
    const container = outlineContentRef.value;
    const chapterCards = container?.querySelectorAll('.chapter-card');
    if (chapterCards && chapterCards[index + 1]) {
      chapterCards[index + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

const updateOutlineChapterNumbers = () => {
  if (!editingOutlineData.value) return;
  const outline = editingOutlineData.value.outline;
  for (let i = 0; i < outline.length; i++) {
    outline[i].chapter = i + 1;
  }
  editingOutlineData.value.base_info.total_chapters = outline.length;
};

const scrollToOutlineError = () => {
  nextTick(() => {
    const el = document.querySelector('.outline-edit-error');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus();
    }
  });
};

const saveManualEditOutline = async () => {
  if (!editingOutlineData.value) return;

  const errors = new Set<string>();

  if (editingOutlineData.value.story_summary && !editingOutlineData.value.story_summary.summary.trim()) {
    errors.add('story-summary');
  }

  if (editingOutlineData.value.characters) {
    for (let i = 0; i < editingOutlineData.value.characters.length; i++) {
      const c = editingOutlineData.value.characters[i];
      if (!c.name.trim()) {
        errors.add(`character-name-${i}`);
      }
      if (!c.description.trim()) {
        errors.add(`character-desc-${i}`);
      }
    }
  }

  if (editingOutlineData.value.outline) {
    for (let i = 0; i < editingOutlineData.value.outline.length; i++) {
      const ch = editingOutlineData.value.outline[i];
      if (!ch.title.trim()) {
        errors.add(`chapter-title-${i}`);
      }
      if (!ch.description.trim()) {
        errors.add(`chapter-desc-${i}`);
      }
    }
  }

  if (errors.size > 0) {
    outlineEditErrorKeys.value = errors;
    toast(t('novel.outlineRequiredFieldsTip'));
    scrollToOutlineError();
    return;
  }

  outlineEditErrorKeys.value = new Set();

  if (deepEqual(editingOutlineData.value, outlineData.value)) {
    isManualEditingOutline.value = false;
    editingOutlineData.value = null;
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const updateData = {
      base_info: editingOutlineData.value.base_info,
      cover_prompt: editingOutlineData.value.cover_prompt || outlineData.value?.cover_prompt || '',
      story_summary: editingOutlineData.value.story_summary,
      characters: editingOutlineData.value.characters.map((c: any) => ({
        name: c.name,
        description: c.description
      })),
      outline: editingOutlineData.value.outline,
      generate_mode: editingOutlineData.value.generate_mode || outlineData.value?.generate_mode || 'edit',
      cost_tokens: editingOutlineData.value.cost_tokens || outlineData.value?.cost_tokens || 0
    };

    const response = await fetch(`${aiUrl}app/project/update_outline/${sessionId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token || ''
      },
      body: JSON.stringify(updateData)
    });

    const res = await response.json();

    if (res.code !== 200) {
      toast(res.message || t('fail'));
      return;
    }

    outlineData.value = JSON.parse(JSON.stringify(editingOutlineData.value));
    isManualEditingOutline.value = false;
    editingOutlineData.value = null;

    try {
      const detailRes = await api.detailProject(sessionId.value) as any;
      if (detailRes.code == 200 && detailRes.data?.history_data) {
        let historyData = detailRes.data.history_data;
        if (typeof historyData == 'string') {
          try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
        }
        if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
          outlineHistoryList.value = historyData.outline_novel;
          const latestOutline = historyData.outline_novel[historyData.outline_novel.length - 1];
          if (latestOutline) {
            outlineData.value = latestOutline;
          }
        } else {
          outlineHistoryList.value = [];
        }
      }
    } catch (e) {
      console.error('Error fetching history after manual edit:', e);
    }
  } catch (error) {
    console.error('Error saving manual outline edit:', error);
    toast(t('fail'));
  } finally {
    isSavingManualOutline.value = false;
  }
};

const startAiEditOutline = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  const outlineEstimateRes = await api.novelEstimate({
    session_id: sessionId.value,
    step_name: 'outline'
  }) as any;
  if (outlineEstimateRes.code == 10404) {
    toast(t('novel.error.cannotOperateOtherUserProject'));
    return;
  }
  hideEdit();
  isAiEditingOutline.value = true;
  aiEditOutlineInput.value = '';
  if (outlineEstimateRes.code == 200 && outlineEstimateRes.data?.total_points) {
    outlineEditCost.value = outlineEstimateRes.data.total_points;
  } else {
    outlineEditCost.value = regenerateCost.value;
  }
  nextTick(() => {
    const textarea = outlineEditSectionRef.value?.querySelector('.outline-edit-textarea');
    if (textarea) (textarea as HTMLTextAreaElement).focus();
  });
};

const cancelAiEditOutline = () => {
  isAiEditingOutline.value = false;
  aiEditOutlineInput.value = '';
};

const handleOutlineEditInput = () => {
  const maxLimit = 20000;
  if (aiEditOutlineInput.value.length > maxLimit) {
    aiEditOutlineInput.value = aiEditOutlineInput.value.substring(0, maxLimit);
  }
};

const sendAiEditOutlineRequest = async () => {
  if (isSendingOutlineEdit.value) return;
  isSendingOutlineEdit.value = true;

  if (!aiEditOutlineInput.value?.trim()) {
    toast(t('novel.error.emptyRegenerateContent'));
    isSendingOutlineEdit.value = false;
    return;
  }

  try {
    if (await isTaskLimitExceeded()) {
      isSendingOutlineEdit.value = false;
      return;
    }

    const editContent = aiEditOutlineInput.value.trim();

    try {
      await callNovelOutline('edit');

      isAiEditingOutline.value = false;
      aiEditOutlineInput.value = '';
      topic.value = editContent;
    } finally {
      isSendingOutlineEdit.value = false;
    }
  } catch (error) {
    console.error('Error sending outline edit request:', error);
    toast(t('fail'));
    isSendingOutlineEdit.value = false;
  }
};

function formatOutlineToText(data: any): string {
  if (!data) return '';
  const bi = data.base_info || {};
  const ss = data.story_summary || {};
  const chars = data.characters || [];
  const outline = data.outline || [];

  let text = '';
  if (bi.title) text += `${t('novel.novelOutline')}\n\n`;
  text += `${t('novel.basicInfo')}\n`;
  text += `${t('novel.totalChapters')}${bi.total_chapters || 0} ${t('novel.chaptersLabel')}\n`;
  if (bi.words_per_chapter && bi.words_per_chapter.length == 2) {
    text += `${t('novel.wordsPerChapter')}${bi.words_per_chapter[0]}-${bi.words_per_chapter[1]}${t('novel.wordsLabel')}\n`;
  }
  if (bi.genre) text += `${t('novel.genreLabel')}${bi.genre}\n`;
  if (bi.writing_style) text += `${t('novel.writingStyle')}：${bi.writing_style}\n`;
  text += '\n';

  if (ss.summary) {
    text += `${t('novel.storySummary')}\n${ss.summary}\n\n`;
  }

  if (chars.length > 0) {
    text += `${t('novel.characterGallery')}\n`;
    for (const c of chars) {
      if (c.type) text += `${c.type}\n`;
      text += `${t('novel.name')}：${c.name || ''}\n`;
      text += `${t('novel.description')}：${c.description || ''}\n\n`;
    }
  }

  if (outline.length > 0) {
    text += `${t('novel.chapterPlot')}\n`;
    for (const ch of outline) {
      text += `${t('novel.chapter', { chapter: ch.chapter })} ${ch.title || ''}\n`;
      text += `${ch.description || ''}\n\n`;
    }
  }

  return text.trimEnd();
}

const goPrevChapter = async () => {


  hideEdit();
  chapterHistoryCount.value = 0;

  // Stop auto navigation when user navigates manually
  shouldAutoNavigate.value = false;

  if (!currentChapter.value) {
    return;
  }

  const currentChapterNum = currentChapter.value.chapter;
  if (currentChapterNum > 1) {
    // Go to previous chapter
    try {
      // Clear displayed content and set loading state first
      displayedContent.value = '';
      isLoading.value = true;

      // Stop any ongoing polling
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
      stopDetailPolling();
      if (printerInterval.value) {
        clearInterval(printerInterval.value);
        printerInterval.value = null;
      }

      const res = await api.detailChapter(sessionId.value, currentChapterNum - 1) as any;
      if (res.code == 200 && res.data) {
        isEditingChapter.value = false;
        isChapterTyping.value = false;
        hasFailed.value = false;

        let filteredContent = res.data.content || '';
        filteredContent = filteredContent.replace(/\\n/g, '\n');

        const chapterStartMatch = filteredContent.match(/# CH\d+/);
        if (chapterStartMatch && chapterStartMatch.index !== undefined) {
          filteredContent = filteredContent.substring(chapterStartMatch.index + chapterStartMatch[0].length);
        }

        const verifyMatch = filteredContent.indexOf('让我验证衔接一致性：');
        if (verifyMatch > -1) {
          filteredContent = filteredContent.substring(0, verifyMatch);
        }

        const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == currentChapterNum - 1);
        currentChapter.value = {
          chapter: currentChapterNum - 1,
          title: chapterData?.title || res.data.title || '',
          content: filteredContent
        };
        displayedContent.value = filteredContent;
        updateChapterHistoryFromDetail(res);
        // 滚动到内容开始处
        nextTick(() => {
          if (chapterContentRef.value) {
            chapterContentRef.value.scrollTop = 0;
          }
        });
      }
    } catch (error) {
      console.error('Error navigating to previous chapter:', error);
    } finally {
      isLoading.value = false;
    }
  } else {
    // Go to novel outline
    currentChapter.value = null;
    chapterHistoryCount.value = 0;
    try {
      isLoading.value = true;

      // Stop any ongoing polling
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
      if (printerInterval.value) {
        clearInterval(printerInterval.value);
        printerInterval.value = null;
      }

      // Keep detailPolling running if a chapter is in PREPARE state
      // so left sidebar continues showing progress and similar content
      if (isPreparing.value && !detailPollingInterval.value) {
        startDetailPolling();
      } else if (!isPreparing.value) {
        stopDetailPolling();
      }

      const detailProjectRes = await api.detailProject(sessionId.value) as any;

      if (detailProjectRes.code == 200) {
        if (detailProjectRes.data?.user_id) {
          projectOwnerId.value = detailProjectRes.data.user_id;
        }
        const resultAsync = detailProjectRes.data?.result_async;
        if (resultAsync) {
          isEditingChapter.value = false;
          outlineData.value = null;
          currentChapter.value = null;
          await nextTick();
          handleStructuredData(resultAsync);
        }
      }
    } catch (error) {
      console.error('Error fetching outline details:', error);
    } finally {
      // Reset loading state
      isLoading.value = false;
    }
  };
}

const goNextChapter = async () => {


  hideEdit();
  chapterHistoryCount.value = 0;

  // Stop auto navigation when user navigates manually
  shouldAutoNavigate.value = false;

  // If currentChapter is null (on outline page), go to first chapter
  const currentChapterNum = currentChapter.value ? currentChapter.value.chapter : 0;
  const nextChapterNum = currentChapterNum + 1;

  // Don't go beyond generated chapters
  if (nextChapterNum > stepChapterIndex.value) return;

  await goToChapter(nextChapterNum);
};

// Go to specific chapter
const goToChapter = async (chapterNum: number) => {
  hideEdit();
  chapterHistoryCount.value = 0;

  // Reset typewriter effect when navigating to a different chapter
  if (isChapterTyping.value) {
    isChapterTyping.value = false;
  }

  // Stop any existing polling or typewriter effect
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
    printerInterval.value = null;
  }
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
  stopDetailPolling();

  // Check if this chapter is in PREPARE state
  const isPrepareChapter = chapterNum == stepChapterIndex.value && isPreparing.value;

  if (isPrepareChapter) {
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: ''
    };
    displayedContent.value = '';
    isLoading.value = false;
    if (!detailPollingInterval.value) {
      startDetailPolling();
    }
    return;
  }

  // Check if this is the currently generating chapter with DOING status
  // Or if this chapter is at/beyond stepChapterIndex (meaning generation was triggered for this chapter)
  // Also check if generatingChapter is set to this chapter, even if taskStatus is not DOING
  const isCurrentlyGenerating = generatingChapter.value == chapterNum ||
                                (chapterNum == stepChapterIndex.value && taskStatus.value == 'DOING') ||
                                (chapterNum >= stepChapterIndex.value && taskStatus.value == 'DOING');

  if (isCurrentlyGenerating) {
    // Reset estimated time for new chapter generation
    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    chapterRemainingSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    isLoadingComplete.value = false;
    hasStreamData.value = false;
    hasStreamingContent.value = false;
    queueInfo.value = null;
    prepareQueueInfo.value = null;
    startTime.value = null; // Reset startTime to use fresh estimated time

    // Use polling to fetch chapter content
    try {
      // Don't set isLoading if we're viewing outline during chapter generation
      if (currentChapter.value) {
        isLoading.value = true;
      }
      isChapterTyping.value = false;
      taskStatus.value = 'DOING';
      lastGenerationType.value = 'chapter';
      isGeneratingOutline.value = false;
      generatingChapter.value = chapterNum;

      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
      currentChapter.value = {
        chapter: chapterNum,
        title: chapterData?.title || '',
        content: ''
      };
      displayedContent.value = '';

      // Fetch estimated time for the new chapter
      await fetchEstimatedTime();

      // Fetch chapter stream
      await fetchChapterStream(chapterNum);
    } catch (error) {
      toast(t('fail'));
      isLoading.value = false;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
    }
    return;
  }

  // Check if this chapter has failed
  // If taskStatus is FAIL and we're clicking on the stepChapterIndex (the chapter that failed), show failure
  const hasFailedChapter = chapterNum == stepChapterIndex.value && taskStatus.value == 'FAIL';

  if (hasFailedChapter) {
    // Show failed state - don't need to fetch detailChapter
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: ''
    };
    displayedContent.value = '';
    hasFailed.value = true;
    isLoading.value = false;
    return;
  }

  // If clicking on a future chapter that hasn't been generated yet
  if (chapterNum > stepChapterIndex.value) {
    // Cannot view chapters that haven't been generated yet
    return;
  }

  // Otherwise, use detailChapter API (including already generated chapters)
  try {
    // Stop printer interval but keep polling running in batch mode
    // Don't stop polling when viewing already generated chapters
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }

    // Check if we already have chapter content locally (from chapters array)
    const existingChapter = chapters.value.find((c: any) => c.chapter === chapterNum);
    if (existingChapter && existingChapter.content) {
      // Already have content locally, display it directly without loading
      let filteredContent = existingChapter.content || '';
      filteredContent = filteredContent.replace(/\\n/g, '\n');

      const chapterStartMatch = filteredContent.match(/# CH\d+/);
      if (chapterStartMatch && chapterStartMatch.index !== undefined) {
        filteredContent = filteredContent.substring(chapterStartMatch.index + chapterStartMatch[0].length);
      }

      const verifyMatch = filteredContent.indexOf('让我验证衔接一致性：');
      if (verifyMatch > -1) {
        filteredContent = filteredContent.substring(0, verifyMatch);
      }

      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
      currentChapter.value = {
        chapter: chapterNum,
        title: existingChapter.title || chapterData?.title || '',
        content: filteredContent
      };
      displayedContent.value = filteredContent;
      isLoading.value = false;
      hasFailed.value = false;

      try {
        const chapterRes = await api.detailChapter(sessionId.value, chapterNum) as any;
        if (chapterRes.code == 200) {
          updateChapterHistoryFromDetail(chapterRes);
        }
      } catch (e) {
        console.error('Error fetching chapter history in goToChapter:', e);
      }

      nextTick(() => {
        if (chapterContentRef.value) {
          chapterContentRef.value.scrollTop = 0;
        }
      });
      return;
    }

    // Don't have content locally, need to fetch from API
    displayedContent.value = '';
    isLoading.value = true;
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: ''
    };

    const res = await api.detailChapter(sessionId.value, chapterNum) as any;
    if (res.code == 200 && res.data) {
      isEditingChapter.value = false;
      isChapterTyping.value = false;
      isGeneratingOutline.value = false;

      let filteredContent = res.data.content || '';
      filteredContent = filteredContent.replace(/\\n/g, '\n');

      const chapterStartMatch = filteredContent.match(/# CH\d+/);
      if (chapterStartMatch && chapterStartMatch.index !== undefined) {
        filteredContent = filteredContent.substring(chapterStartMatch.index + chapterStartMatch[0].length);
      }

      const verifyMatch = filteredContent.indexOf('让我验证衔接一致性：');
      if (verifyMatch > -1) {
        filteredContent = filteredContent.substring(0, verifyMatch);
      }

      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
      // Use API title first, fallback to outline title
      currentChapter.value = {
        chapter: chapterNum,
        title: res.data.title || chapterData?.title || '',
        content: filteredContent
      };
      displayedContent.value = filteredContent;
      hasFailed.value = false;
      updateChapterHistoryFromDetail(res);
      nextTick(() => {
        if (chapterContentRef.value) {
          chapterContentRef.value.scrollTop = 0;
        }
      });
    }
  } catch (error) {
    console.error('Error navigating to chapter:', error);
  } finally {
    isLoading.value = false;
  }
};

// Call novelAllChapters API
const callNovelAllChapters = async (skipBalanceCheck: boolean = false) => {
  stopDetailPolling();

  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }

  // if (!await checkServerStateSync('SUCCESS')) return;

  hideEdit();

  if (!skipBalanceCheck) isAllChaptersLoading.value = true;
  try {

  // Check if user has reached the task limit
  if (await isTaskLimitExceeded()) return;

  // Determine the first chapter to generate and generate mode
  let fromChapter: number;
  let generateMode: string;
  const previousTaskStatus = taskStatus.value;

  if (previousTaskStatus == 'FAIL') {
    fromChapter = stepChapterIndex.value;
    generateMode = 'retry';
  } else if (currentChapter.value?.chapter) {
    fromChapter = currentChapter.value.chapter + 1;
    generateMode = 'new';
  } else {
    fromChapter = 1;
    generateMode = 'new';
  }

  // Check balance before proceeding (skip if already checked in retry flow)
  if (!skipBalanceCheck) {
    const estimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'all_chapters',
      from_chapter: fromChapter
    }) as any;
    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      const estimatedPoints = estimateRes.data.total_points;
      estimatedComputingPower.value = estimatedPoints;
      await fetchUserBalance();
      const requiredPower = Math.round(estimatedPoints * 1.05);
      if (userBalance.value < requiredPower) {
        estimatedFrozenPower.value = Math.round(estimatedPoints * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        return;
      }
    } else if (estimateRes.code == 10404) {
      toast(t('novel.error.cannotOperateOtherUserProject'));
      return;
    }
  }

  const firstChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == fromChapter);

  // Call API first, set loading state only after success
  const novelAllChaptersRes = await api.novelAll({
    session_id: sessionId.value,
    from_chapter: fromChapter,
    generate_mode: generateMode
  }) as any;

  if (novelAllChaptersRes.code == 40015) {
    const retryRes = await api.novelAll({
      session_id: sessionId.value,
      from_chapter: fromChapter,
      generate_mode: 'retry'
    }) as any;
    if (retryRes.code !== 200) {
      if (handleSessionTimeout(retryRes.code)) {
        return;
      }
      if (retryRes.code == 40011) {
        await fetchUserBalance();
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        return;
      }
      toast(retryRes.message || t('fail'));
      return;
    }
    Object.assign(novelAllChaptersRes, retryRes);
  }

  if (novelAllChaptersRes.code !== 200) {
    // Handle session timeout error - refresh page
    if (handleSessionTimeout(novelAllChaptersRes.code)) {
      return;
    }
    // Handle insufficient balance error
    if (novelAllChaptersRes.code == 40011) {
      await fetchUserBalance();
      estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
      showInsufficientBalanceModal.value = true;
      return;
    }
    toast(novelAllChaptersRes.message || t('fail'));
    return;
  }

  // API successful, now set UI state
  // Set flag for batch chapter generation
  isBatchChapter.value = 1;
  // Set shouldShowTypewriter to false for direct content display
  shouldShowTypewriter.value = false;
  // Enable auto navigation for batch generation
  shouldAutoNavigate.value = true;

  currentChapter.value = {
    chapter: fromChapter,
    title: firstChapterData?.title || '',
    content: ''
  };
  displayedContent.value = '';
  pendingDisplayContent.value = '';
  isLoading.value = true;
  isLoadingComplete.value = false;
  hasFailed.value = false;
  taskStatus.value = 'DOING';
  lastGenerationType.value = 'chapter';
  isGeneratingOutline.value = false;
  isChapterTyping.value = false;
  generatingChapter.value = fromChapter;
  stepChapterIndex.value = fromChapter;
  currentStepName.value = 'chapter';
  startLoadingAnimation('chapter', true);

  // Add first chapter to chapters array if not exists
  const existingChapter = chapters.value.find((c: any) => c.chapter === fromChapter);
  if (!existingChapter) {
    chapters.value.push({
      id: `temp-${fromChapter}`,
      chapter: fromChapter,
      title: firstChapterData?.title || t('novel.untitled'),
      is_publish: 2
    });
  }

  // API successful, check if we need to show freeze computing power modal
    const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
    if (hideFreezeModal !== '1') {
      // Get frozen points from detail project
      const detailRes = await api.detailProject(sessionId.value) as any;
      if (detailRes.code == 200 && detailRes.data?.frozen_points !== undefined) {
        freezeComputingPower.value = detailRes.data.frozen_points;
        pendingGenerationAction.value = previousTaskStatus == 'FAIL' ? 'retry-all' : 'all';
        showFreezeComputingPowerModal.value = true;
      }
    }

  // Use the time from API response as start time if available
  if (novelAllChaptersRes.time) {
    const startTimestamp = parseToUnixTimestamp(novelAllChaptersRes.time);
    if (startTimestamp) {
      startTime.value = startTimestamp * 1000;
    } else {
      startTime.value = Date.now();
    }
  } else {
    startTime.value = Date.now();
  }

  // Fetch estimated time
  estimatedTime.value = null;
  originalEstimatedSeconds.value = null;
  displayMinutes.value = 0;
  estimatedTimeFetched.value = false;
  fetchEstimatedTime();

  await fetchUserBalance();

  // Use polling to fetch chapter content
  await fetchChapterStream(fromChapter);

  // Update points estimate after chapter generation only if generation hasn't failed
  if (!hasFailed.value) {
    await fetchPointsEstimate();
  }
  } finally {
    isAllChaptersLoading.value = false;
  }
};

// Handle retry on failed generation
const handleRetry = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  // Check if task limit is exceeded
  if (await isTaskLimitExceeded()) return;

  let estimateRes;
  if (lastGenerationType.value == 'outline') {
    estimateRes = await api.novelEstimate({ session_id: sessionId.value, step_name: 'outline' }) as any;
    retryAction.value = 'outline';
  } else if (lastGenerationType.value == 'chapter') {
    if (isBatchChapter.value == 1) {
      estimateRes = await api.novelEstimate({ session_id: sessionId.value, step_name: 'all_chapters', from_chapter: stepChapterIndex.value || 1 }) as any;
      retryAction.value = 'all';
    } else {
      estimateRes = await api.novelEstimate({ session_id: sessionId.value, step_name: 'chapter', from_chapter: currentChapter.value?.chapter || 1 }) as any;
      retryAction.value = 'chapter';
    }
  }

  if (estimateRes && estimateRes.code == 200) {
    const estimatedPoints = estimateRes.data.total_points;
    estimatedComputingPower.value = estimatedPoints;

    await fetchUserBalance();
    const requiredPower = Math.round(estimatedPoints * 1.05);
    if (userBalance.value < requiredPower) {
      estimatedFrozenPower.value = Math.round(estimatedPoints * (balanceInfo.value?.over_freeze_rate || 1));
      showInsufficientBalanceModal.value = true;
      return;
    }

    confirmFrozenPower.value = Math.round(estimatedPoints * (balanceInfo.value?.over_freeze_rate || 1));
    showConfirmComputingPowerModal.value = true;
  } else if (estimateRes && estimateRes.code == 10404) {
    toast(t('novel.error.cannotOperateOtherUserProject'));
    return;
  } else {
    toast(estimateRes.message);
  }
};

// Execute retry action after confirmation
const executeRetryAction = () => {
  // Set shouldShowTypewriter to true for typewriter effect only for chapters
  if (retryAction.value == 'chapter' || retryAction.value == 'all') {
    shouldShowTypewriter.value = true;
  }
  if (retryAction.value == 'outline') {
    callNovelOutline('retry');
  } else if (retryAction.value == 'chapter') {
    callNovelNext(currentChapter.value?.chapter, true);
  } else if (retryAction.value == 'all') {
    callNovelAllChapters(true);
  }
};

// Handle freeze computing power modal confirm
const handleFreezeComputingPowerConfirm = () => {
  showFreezeComputingPowerModal.value = false;
  // 弹窗只做提示，不重新调用API，流程已经在API调用成功后继续进行了
};

// Function to confirm generate all chapters
const confirmGenerateAllChapters = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }

  hideEdit();
  isConfirmAllLoading.value = true;
  try {
    // Check if user has reached the task limit
    if (await isTaskLimitExceeded()) return;

    // Calculate from_chapter based on current stepChapterIndex
    const fromChapter = stepChapterIndex.value == 0 ? 1 : stepChapterIndex.value + 1;

    // Calculate number of chapters to generate
    const chaptersToGenerate = Math.max(1, chapterCount.value - fromChapter + 1);

    const estimateRes = await
      api.novelEstimate({
        session_id: sessionId.value,
        step_name: 'all_chapters',
        from_chapter: fromChapter,
      }) as any;

    // Check balance before proceeding
    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      estimatedComputingPower.value = estimateRes.data.total_points || 0;
      await fetchUserBalance();
      const requiredPower = Math.round(estimatedComputingPower.value * 1.05);
      if (userBalance.value < requiredPower) {
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        return;
      }
    } else if (estimateRes.code == 10404) {
      toast(t('novel.error.cannotOperateOtherUserProject'));
      return;
    }

    const timeRes = await api.estimateTime(sessionId.value) as any;

    if (estimateRes.code == 200 && timeRes.code == 200) {
      // Set the estimated computing power from the API response
      estimatedComputingPower.value = estimateRes.data.total_points || 0;

      // Get the estimated time per chapter in seconds, multiply by chapters to generate
      const perChapterSeconds = timeRes.data.max_chapter_estimate_seconds || 0;
      const totalSeconds = perChapterSeconds * chaptersToGenerate;
      let formattedTime = '';

      if (totalSeconds > 0) {
        if (totalSeconds < 3600) {
          // Less than an hour, show integer minutes
          const minutes = Math.round(totalSeconds / 60);
          formattedTime = `${minutes}${t('novel.minutes')}`;
        } else {
          // More than an hour, show hours and minutes
          const hours = Math.floor(totalSeconds / 3600);
          const remainingSeconds = totalSeconds % 3600;
          const minutes = Math.round(remainingSeconds / 60);
          formattedTime = `${hours}${t('novel.hours')}${minutes}${t('novel.minutes')}`;
        }
      }

      modalEstimatedTime.value = formattedTime;

      // Show the modal
      showGenerateAllChaptersModal.value = true;
    } else {
      // If API call fails, show error message and proceed with default values
      toast(t('novel.error.estimateFailed'));
      estimatedComputingPower.value = 0;
      modalEstimatedTime.value = t('novel.tenMinutes');
      showGenerateAllChaptersModal.value = true;
    }
  } catch (error) {
    toast(t('novel.error.estimateFailed'));
  } finally {
    isConfirmAllLoading.value = false;
  }
};

function goRechargeDetail() {


  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-points-details');
}

function goRecharge() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-recharge');
}

const closeInsufficientBalanceModal = () => {
  showInsufficientBalanceModal.value = false;
  estimatedFrozenPower.value = 0;
};

// Handle chapter info text click
const handleChapterInfoClick = async () => {
  if (!currentChapter.value?.chapter) {
    return;
  }
  try {
    isLoading.value = true;
    const res = await api.detailChapter(sessionId.value, currentChapter.value.chapter) as any;
    if (res.code == 200) {
        const result = res.data;
        if (result) {
          currentChapter.value = result;
        }
      }
  } catch (error) {
    console.error('Error fetching chapter detail:', error);
  } finally {
    isLoading.value = false;
  }
};

// Handle chapter item click in the list
const handleChapterItemClick = async (chapterNum: number) => {

  nextTick(() => {
    if (outlineContentRef.value) {
      outlineContentRef.value.scrollTop = 0;
    }
  });

  hideEdit();
  chapterHistoryCount.value = 0;

  // Only stop auto navigation when user clicks a chapter that's not currently generating
  if (chapterNum !== generatingChapter.value) {
    shouldAutoNavigate.value = false;
  }

  // Don't reset isPreparing when clicking on other chapters
  // isPreparing should only be reset when task is completed, failed, or explicitly cancelled
  // This ensures estimated time and similar content keep showing while task is in progress
  // if (chapterNum != stepChapterIndex.value) {
  //   isPreparing.value = false;
  //   prepareQueueInfo.value = null;
  // }

  // Check if this chapter is in queue preparation state
  const isInQueueState = chapterNum == stepChapterIndex.value && isPreparing.value;

  if (isInQueueState) {
    // Don't fetch chapter details when in queue state
    // Show the preparation state instead
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: ''
    };
    displayedContent.value = '';
    outlineContent.value = '';
    isLoading.value = false;
    // Keep isPreparing true so the preparation state is shown
    // Start polling detailProject API for chapter PREPARE state
    if (!detailPollingInterval.value) {
      startDetailPolling();
    }
    return;
  }
  // Don't stop polling for preparation status when clicking on other chapters
  // Keep isPreparing true so the preparation state is shown everywhere
  // Just load the clicked chapter's content
  if (pollingInterval.value) {
    // Don't clear the polling interval - keep it running
  }

  // Check if this chapter has failed - only when clicking on the failed chapter (stepChapterIndex with FAIL status)
  const hasFailedChapter = chapterNum == stepChapterIndex.value && taskStatus.value == 'FAIL';

  if (hasFailedChapter) {
    // Show failed state - don't need to fetch detailChapter
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: ''
    };
    displayedContent.value = '';
    outlineContent.value = '';
    hasFailed.value = true;
    isLoading.value = false;
    return;
  }

  // Stop printer interval if running
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
    printerInterval.value = null;
  }
  isGeneratingOutline.value = false;
  outlineContent.value = '';
  displayedContent.value = '';
  const existingChapter = chapters.value.find((c: any) => c.chapter == chapterNum);
  currentChapter.value = {
    chapter: chapterNum,
    title: existingChapter?.title || '',
    content: ''
  };
  isLoading.value = true;

  // Check if this chapter is being generated or in preparation or failed
  if (chapterNum == stepChapterIndex.value && (taskStatus.value == 'DOING' || isPreparing.value || taskStatus.value == 'FAIL')) {
    loadingProcessType.value = 'chapter';
    // Use polling to fetch chapter content if in DOING state
    if (taskStatus.value == 'DOING') {
      await fetchChapterStream(chapterNum);
    }
    // For PREPARE or FAIL state, just show the status
    return;
  }

  // Check if any chapter is being generated (step_name is chapter and step_status is DOING)
  if (currentStepName.value == 'chapter' && taskStatus.value == 'DOING') {
    // For the chapter being generated, use polling
    if (chapterNum == stepChapterIndex.value) {
      loadingProcessType.value = 'chapter';
      await fetchChapterStream(chapterNum);
      return;
    }
  }

  try {
    const res = await api.detailChapter(sessionId.value, chapterNum) as any;
    if (res.code == 200) {
      const result = res.data;
      if (result) {
        isEditingChapter.value = false;

        // Filter the content
        let filteredContent = result.content || '';

        // Find # CH followed by digits and start from after there if it exists
        const chapterStartMatch = filteredContent.match(/# CH\d+/);
        if (chapterStartMatch) {
          const chapterStartIndex = chapterStartMatch.index + chapterStartMatch[0].length;
          if (chapterStartIndex > -1) {
            filteredContent = filteredContent.substring(chapterStartIndex);
            // Replace newline characters with actual line breaks
            filteredContent = filteredContent.replace(/\\n/g, '\n');
          }
        }

        // Filter out content after "让我验证衔接一致性："
        const verifyMatch = filteredContent.indexOf('让我验证衔接一致性：');
        if (verifyMatch > -1) {
          filteredContent = filteredContent.substring(0, verifyMatch);
        }

        // Update result content with filtered content
        result.content = filteredContent;

        // Get outline chapter title for reference
        const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
        // Use API title first, fallback to outline title
        currentChapter.value = {
          chapter: result.chapter,
          title: result.title || chapterData?.title || '',
          content: filteredContent
        };

        if (result.title) {
          const existingChapter = chapters.value.find((c: any) => c.chapter == chapterNum);
          if (existingChapter) {
            existingChapter.title = result.title;
          }
          if (outlineData.value && outlineData.value.outline) {
            const outlineChapter = outlineData.value.outline.find((c: any) => c.chapter == chapterNum);
            if (outlineChapter) {
              outlineChapter.title = result.title;
            }
          }
        }

        // Scroll to top
        nextTick(() => {
          if (chapterContentRef.value) {
            chapterContentRef.value.scrollTop = 0;
          }
        });

        // Ensure chapterCount is set from outlineData if available
        if (outlineData.value?.base_info?.total_chapters) {
          chapterCount.value = outlineData.value.base_info.total_chapters;
        }

        // Directly display filtered content
        displayedContent.value = filteredContent;
        nextTick(() => {
          if (chapterContentRef.value) {
            chapterContentRef.value.scrollTop = 0;
          }
        });

        updateChapterHistoryFromDetail(res);
      } else {
        // No result data
        console.error('No chapter data returned from API');
        // Set a default message instead of empty string
        displayedContent.value = '';
        // Update currentChapter with default content
        const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
        currentChapter.value = {
          chapter: chapterNum,
          title: chapterData?.title || '',
          content: ''
        };
      }
    } else {
      // API request failed
      console.error('API request failed:', res);
      // Set an error message instead of empty string
      displayedContent.value = '获取章节内容失败';
      // Update currentChapter with error content
      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
      currentChapter.value = {
        chapter: chapterNum,
        title: chapterData?.title || '',
        content: t('fail')
      };
    }
  } catch (error) {
    // Handle error
    console.error('Error fetching chapter:', error);
    // Set an error message instead of empty string
    displayedContent.value = t('fail');
    // Update currentChapter with error content
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterNum);
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData?.title || '',
      content: t('fail')
    };
  } finally {
    isLoading.value = false;
    // Don't mark loading complete if generation is still in progress
    // This preserves the NovelLoading component for when the user navigates back
    if (!(taskStatus.value == 'DOING')) {
      isLoadingComplete.value = true;
    }
  }
};

// Handle publish chapter button click
const handlePublishChapter = async (chapter: any) => {
  trackClickPublishButton(1);
  if (checkProjectOwnership()) return;

  const session_id = sessionId.value;
  const index = chapter.chapter;

  try {
    const res = await api.detailChapter(session_id, index) as any;

    if (res.code != 200) {
      toast(res.message || t('fail'));
      return;
    }

    if (res.code == 200 && res.data?.is_publish == 1) {
      toast(t('novel.chapterAlreadyPublished'));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }
  } catch (e) {
    toast(t('fail'));
    return;
  }

  const cover = coverImage.value || '';
  const title = projectName.value || '';

  router.push({
    path: '/publish/novel',
    query: {
      session_id,
      cover,
      index,
      title
    }
  });
};

const handleBatchPublishClick = async () => {
  if (checkProjectOwnership()) return;
  isBatchPublishBtnLoading.value = true;
  try {
    const res = await api.detailProject(sessionId.value) as any;
    if (res.code === 200 && res.data?.chapters) {
      chapters.value = res.data.chapters;
    }
  } catch (e) {
    console.error('Failed to refresh chapters:', e);
  } finally {
    isBatchPublishBtnLoading.value = false;
  }

  if (unpublishedChapterCount.value >= 2) {
    showBatchPublishDialog.value = true;
  }
};

const handleBatchPublishRefresh = (freshChapters: any[]) => {
  chapters.value = freshChapters;
};

const handleBatchPublishConfirm = async (selectedChapters: any[]) => {
  showBatchPublishDialog.value = false;
  if (selectedChapters.length === 0) return;

  isBatchPublishLoading.value = true;
  isBatchPublishCancelled = false;

  await nextTick();

  if (isBatchPublishCancelled) {
    isBatchPublishLoading.value = false;
    return;
  }

  const cover = coverImage.value || '';
  const title = projectName.value || '';

  if (selectedChapters.length === 1) {
    router.push({
      path: '/publish/novel',
      query: {
        session_id: sessionId.value,
        cover,
        index: selectedChapters[0].chapter,
        title
      }
    });
    return;
  }

  const chapterIndexes = selectedChapters.map(c => c.chapter);

  router.push({
    path: '/publish/novel',
    query: {
      session_id: sessionId.value,
      batch: 'true',
      indexes: chapterIndexes.join(','),
      cover,
      name: title
    }
  });
};

const cancelBatchPublish = () => {
  isBatchPublishCancelled = true;
  isBatchPublishLoading.value = false;
};

// Handle outline preview click
const handleOutlinePreviewClick = async () => {


  hideEdit();
  // Stop auto navigation when user clicks on outline
  shouldAutoNavigate.value = false;

  // Don't reset preparation state when clicking on outline
  // isPreparing should only be reset when task is completed, failed, or explicitly cancelled
  // This ensures estimated time and similar content keep showing while task is in progress
  // isPreparing.value = false;
  // prepareQueueInfo.value = null;

  // Don't allow click if no outline data
  if (!outlineData.value || !outlineData.value.outline) {
    return;
  }

  // Don't stop polling when clicking outline, regardless of batch or single chapter mode
  // Keep polling running so estimated time continues to update and generation continues normally
  // The polling will handle updating the UI when chapters are completed

  // Set currentChapter to null to show outline area
  currentChapter.value = null;
  displayedContent.value = '';
  pendingDisplayContent.value = '';
  outlineContent.value = '';
  isGeneratingOutline.value = false;
  isLoading.value = false;
  isLoadingComplete.value = false;
  isWaitingForData.value = false;
  isChapterTyping.value = false;

  nextTick(() => {
    if (outlineContentRef.value) {
      outlineContentRef.value.scrollTop = 0;
    }
  });

  // Stop printer interval to prevent auto-scrolling
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
    printerInterval.value = null;
  }

  try {
    // Set loading state
    isOutlineLoading.value = true;

    const detailProjectRes = await api.detailProject(sessionId.value) as any;
    if (detailProjectRes.code == 200) {
      if (detailProjectRes.data?.user_id) {
        projectOwnerId.value = detailProjectRes.data.user_id;
      }
      const resultAsync = detailProjectRes.data?.result_async;
      const stepName = detailProjectRes.data?.step_name;
      const stepStatus = detailProjectRes.data?.step_status;

      // Update currentStepName with the step_name from API
      if (stepName) {
        currentStepName.value = stepName;
      }

      // Handle PREPARE status
      if (stepStatus == 'PREPARE' && stepName == 'outline') {
        isPreparing.value = true;
        hasFailed.value = false;
        taskStatus.value = 'PREPARE';
        isLoading.value = false;
        isGeneratingOutline.value = false;
        isOutlineLoading.value = false;

        const initialQueuePosition = detailProjectRes.data?.queue_position ?? 0;
        if (initialQueuePosition > 0) {
          fetchEstimatedTime();
          prepareQueueInfo.value = {
             count: initialQueuePosition,
            estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60) + initialQueuePosition * 20
          };
          displayMinutes.value = prepareQueueInfo.value.estimatedTime;
          startCountdownTimer();
        } else {
          prepareQueueInfo.value = {
             count: 0,
            estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60)
          };
          displayMinutes.value = prepareQueueInfo.value.estimatedTime;
          startCountdownTimer();
        }

        // Use detailPolling to wait for PREPARE→DOING transition
        if (!detailPollingInterval.value) {
          startDetailPolling();
        }
      } else {
        if (resultAsync) {
          // Reset hasFailed when viewing outline
          hasFailed.value = false;

          // Handle the structured data, but skip points estimate if step_name is chapter
          try {
            let parsedResult;
            if (typeof resultAsync == 'string') {
              parsedResult = JSON.parse(resultAsync);
              // Check if parsed result has generate_novel_cover field
              if (parsedResult.generate_novel_cover) {
                coverImage.value = parsedResult.generate_novel_cover;
                showCoverEditBtn.value = true;
              }
              // Check if parsed result has generate_novel_outline field
              if (parsedResult.generate_novel_outline) {
                parsedResult = parsedResult.generate_novel_outline;
              }
            } else {
              parsedResult = resultAsync;
              // Check if result has generate_novel_cover field
              if (parsedResult.generate_novel_cover) {
                coverImage.value = parsedResult.generate_novel_cover;
                showCoverEditBtn.value = true;
              }
              // Check if result has generate_novel_outline field
              if (parsedResult.generate_novel_outline) {
                parsedResult = parsedResult.generate_novel_outline;
              }
            }

            // This is outline data - always show outline content when user clicks outline
            // Don't show chapter data even if it's in the response
            // Check if parsedResult has base_info (outline structure), otherwise use backup
            if (parsedResult && parsedResult.base_info) {
              outlineData.value = parsedResult;
              backupOutlineData.value = parsedResult;
            } else if (backupOutlineData.value) {
              // If current result is not outline data, use backup
              outlineData.value = backupOutlineData.value;
            }
            currentChapter.value = null;

            // Check if outline generation failed
            if (stepName == 'outline' && stepStatus == 'FAIL') {
              // Set hasFailed to true to show failure message
              hasFailed.value = true;
            } else {
              // Reset hasFailed for other cases
              hasFailed.value = false;
            }
            // Don't reset stepChapterIndex to 0 when viewing outline

            if (outlineData.value?.base_info?.total_chapters) {
              chapterCount.value = outlineData.value.base_info.total_chapters;
            }

            // Check if base_info has title and update project name directly
            if (outlineData.value?.base_info?.title) {
              const titleFromApi = outlineData.value.base_info.title;
              if (titleFromApi) {
                projectName.value = titleFromApi;
              }
            }

            // Don't fetch points estimate if step_name is chapter or generation has failed
            if (stepName !== 'chapter' && !hasFailed.value) {
              await fetchPointsEstimate();
            }
          } catch (error) {
            console.error('Error parsing structured data:', error);
            outlineContent.value = typeof resultAsync == 'string' ? resultAsync : JSON.stringify(resultAsync);
            printContent(outlineContent.value);
          }

          // Force re-render
          await nextTick();
          // Scroll to top
          if (outlineContentRef.value) {
            outlineContentRef.value.scrollTop = 0;
          }
        }
      }
    }
  } catch (error) {
    // Handle error
  } finally {
    // Reset loading state
    isOutlineLoading.value = false;
    // Don't change taskStatus here - it's a global state that should only be changed by polling responses
  }
};

// Fetch user info
const fetchUserInfo = async () => {
  try {
    const res = await api.userInfo() as any;
    if (res.code == 0) {
      userInfo.value = res.data;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

// Fetch user balance
const fetchUserBalance = async () => {
  try {
    const res = await api.userBalance() as any;
    if (res.code == 200) {
      const totalBalance = res.data.total_balance || 0;
      const balance = res.data.balance || 0;
      userBalance.value = balance;
      frozenBalance.value = Math.max(0, totalBalance - balance);
      systemFrozenBalance.value = Math.max(0, totalBalance - balance);
      balanceInfo.value = res.data;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Error fetching user balance:', error);
  }
}

// Call novelOutline API
const callNovelOutline = async (type: string, retryCount = 0) => {
  try {
    // Check if user has reached the task limit
    if (await isTaskLimitExceeded()) return;

    // Only fetch user settings if topic is not already set (e.g. not called from sendRegenerateRequest)
    if (!topic.value) {
      try {
        const userSelectedData = await api.userSelect(sessionId.value) as any;

        if (userSelectedData.code == 200 && userSelectedData.data?.others?.content) {
          topic.value = userSelectedData.data.others.content;
        }
      } catch (error) {
        console.error('Error calling userSelect API:', error);
      }
    }

    const novelOutlineRes = await api.novelOutline({
      session_id: sessionId.value,
      topic: topic.value,
      generate_mode: type
    }) as any;

    if (novelOutlineRes.code == 40015) {
      const retryRes = await api.novelOutline({
        session_id: sessionId.value,
        topic: topic.value,
        generate_mode: 'retry'
      }) as any;
      if (retryRes.code !== 200) {
        if (handleSessionTimeout(retryRes.code)) {
          isLoading.value = false;
          return;
        }
        if (retryRes.code == 40011) {
          await fetchUserBalance();
          estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
          showInsufficientBalanceModal.value = true;
          isLoading.value = false;
          return;
        }
        toast(retryRes.message || t('fail'));
        isLoading.value = false;
        return;
      }
      Object.assign(novelOutlineRes, retryRes);
    }

    if (novelOutlineRes.code !== 200) {
      // Handle session timeout error - refresh page
      if (handleSessionTimeout(novelOutlineRes.code)) {
        isLoading.value = false;
        return;
      }
      // Handle insufficient balance error
      if (novelOutlineRes.code == 40011) {
        await fetchUserBalance();
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        isLoading.value = false;
        return;
      }
      // Retry once if failed and it's the first attempt
      if (retryCount == 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return callNovelOutline(type, retryCount + 1);
      }
      toast(novelOutlineRes.message || t('fail'));
      isLoading.value = false;
      return;
    }

    // API successful, check if we need to show freeze computing power modal
    const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
    if (hideFreezeModal !== '1') {
      // Get frozen points from detail project
      const detailRes = await api.detailProject(sessionId.value) as any;
      if (detailRes.code == 200 && detailRes.data?.frozen_points !== undefined) {
        freezeComputingPower.value = detailRes.data.frozen_points;
        pendingGenerationAction.value = type === 'retry' ? 'retry-outline' : 'outline';
        showFreezeComputingPowerModal.value = true;
      }
    }

    // Set cover task_id to session_id
    coverTaskId.value = sessionId.value;

    // Reset state for new generation - clear data only after API success
    outlineData.value = null;
    currentChapter.value = null;
    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    isGeneratingOutline.value = true;
    isLoading.value = true;
    hasFailed.value = false;
    lastGenerationType.value = 'outline';
    queueInfo.value = null;

    // Reset outline stream parser for new generation
    if (outlineStreamParser.value) {
      outlineStreamParser.value.destroy();
      outlineStreamParser.value = null;
    }
    outlineStreamText.value = '';
    outlineStreamDone.value = false;
    outlineStreamError.value = '';

    // Fetch novel estimate to check queue status
    try {
      const novelEstimateRes = await api.novelEstimate({ session_id: sessionId.value }) as any;

      if (novelEstimateRes.code == 200 && novelEstimateRes.data) {
        queueInfo.value = {
          count: novelEstimateRes.data.queue_position ?? novelEstimateRes.data.in_queue_count ?? 0,
          estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60) + (novelEstimateRes.data.queue_position ?? 0) * 20
        };
      } else if (novelEstimateRes.code == 10404) {
        toast(t('novel.error.cannotOperateOtherUserProject'));
        return;
      }
    } catch (error) {
      console.error('Error fetching novel estimate:', error);
    }

    // Fetch detailProject to get task status and task_start_at
    try {
      const detailProjectRes = await api.detailProject(sessionId.value) as any;
      if (detailProjectRes.code == 200 && detailProjectRes.data) {
        if (detailProjectRes.data.user_id) {
          projectOwnerId.value = detailProjectRes.data.user_id;
        }
        taskStatus.value = detailProjectRes.data.status || 'DOING';
        if (detailProjectRes.data.task_start_at) {
          taskStartAt.value = detailProjectRes.data.task_start_at;
        }
        if (detailProjectRes.data.step_name) {
          currentStepName.value = detailProjectRes.data.step_name;
        }
        // Check if detailProject has cover information
        if (detailProjectRes.data?.result_async) {
          try {
            let result = detailProjectRes.data.result_async;

            if (result.generate_novel_cover) {
              coverImage.value = result.generate_novel_cover;
              showCoverEditBtn.value = true;
            }
          } catch (error) {
            console.error('Error parsing cover from detailProject:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching detailProject:', error);
    }

    // Start polling for task status
    startPolling();

    // Fetch estimated time after successful novelOutline request
    fetchEstimatedTime();
  } catch (error) {
    console.error('Error calling novelOutline:', error);
    // Retry once if failed and it's the first attempt
    if (retryCount == 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return callNovelOutline(type, retryCount + 1);
    }
    toast(t('fail'));
    isLoading.value = false;
  }
};

// Fetch user selected settings
const fetchUserSelectedSettings = async () => {
  try {
    const userSelectedData = await api.userSelect(sessionId.value) as any;
    if (userSelectedData.code == 200 && userSelectedData.data) {
      userSelectedSettings.value = userSelectedData.data;

      // Update local settings based on user selected data
      if (userSelectedData.data.total_words) {
        switch (userSelectedData.data.total_words) {
          case 3:
            selectedWordCount.value = '30K';
            break;
          case 10:
            selectedWordCount.value = '100K';
            break;
          case 30:
            selectedWordCount.value = '300K';
            break;
        }
      }
      if (userSelectedData.data.language) {
        selectedLanguage.value = userSelectedData.data.language;
      }
      if (userSelectedData.data.others?.content) {
        topic.value = userSelectedData.data.others.content;
      }
    }
  } catch (error) {
    console.error('Error fetching user selected settings:', error);
  }
};

// Fetch chapter content via polling instead of streaming
const fetchChapterStream = async (chapterIndex: number, taskId: string = '') => {
  try {
    // Stop printer interval but keep global polling running
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }

    // Ensure loading is shown before starting polling
    // Only show loading if we're still viewing a chapter
    // Don't show loading if we're viewing outline
    // Only set loading state if the requested chapter matches the currently viewed chapter
    if (currentChapter.value && currentChapter.value.chapter === chapterIndex) {
      isLoading.value = true;
      displayedContent.value = '';
      pendingDisplayContent.value = '';
      isWaitingForData.value = true;
    } else {
      // If viewing a different chapter, don't interfere with its display
      return;
    }

    // Wait for DOM to mount chapter content view
    await nextTick();

    // Start polling for task status
    // Clear any existing polling interval to prevent duplicate polling
    let pollingCount = 0;
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    pollingInterval.value = window.setInterval(async () => {
      try {
        // Don't stop polling when user clicks outline
        // Keep polling running to update chapter status and estimated time
        // even when showing outline view
        if (!currentChapter.value) {
          // Still poll for updates but don't update displayed content
          // Continue polling to keep chapter list updated
        }

        // For batch mode, poll detailProject API every 5 seconds
        // For single chapter, use taskPolling API
        let pollingResponse;
        if (isBatchChapter.value == 1) {
          // Poll project detail API for batch generation
          pollingResponse = await api.detailProject(sessionId.value) as any;
        } else {
          // Poll task status API for single chapter
          pollingResponse = await api.taskPolling(taskId || sessionId.value) as any;
        }

        // Check for session timeout error
        if (handleSessionTimeout(pollingResponse.code)) {
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
          }
          return;
        }

        // Check for unauthorized error
        if (pollingResponse.code == 401) {
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
          }
          return;
        }

        if (pollingResponse.code == 200 && pollingResponse.data) {
          const taskData = pollingResponse.data;

          // Update stepChapterIndex if available (skip during retry to prevent server state from advancing past the retry chapter)
          if (taskData.step_chapter_index && !isRetryingChapter.value) {
            stepChapterIndex.value = taskData.step_chapter_index;
          }

          // Merge chapters list if available (don't replace completely)
          if (taskData.chapters && taskData.chapters.length > 0) {
            taskData.chapters.forEach((serverChapter: any) => {
              const existingIndex = chapters.value.findIndex((c: any) => c.chapter === serverChapter.chapter);
              if (existingIndex !== -1) {
                // Update existing chapter
                chapters.value[existingIndex] = serverChapter;
              } else {
                // Add new chapter
                chapters.value.push(serverChapter);
              }
            });
          }

          // Check if chapter index has changed in batch mode
          if (isBatchChapter.value == 1 &&
              taskData.step_chapter_index &&
              taskData.step_chapter_index !== chapterIndex) {
            // Chapter index has changed
            const newChapterIndex = taskData.step_chapter_index;
            const previousChapterIndex = chapterIndex;

            // First, fetch and display content for the completed chapter (previous chapter)
            try {
              const chapterRes = await api.detailChapter(sessionId.value, previousChapterIndex) as any;
              if (chapterRes.code == 200 && chapterRes.data) {
                let content = chapterRes.data.content || '';
                content = content.replace(/\\n/g, '\n');

                // Get chapter data for previous chapter
                let prevChapterData = taskData.chapters?.find((c: any) => c.chapter == previousChapterIndex);
                if (!prevChapterData) {
                  prevChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == previousChapterIndex);
                }

                // Update UI with completed chapter content only if viewing the generating chapter
                // Don't force-navigate if user is viewing a different completed chapter
                if (currentChapter.value && (currentChapter.value.chapter === previousChapterIndex || shouldAutoNavigate.value)) {
                  currentChapter.value = {
                    chapter: previousChapterIndex,
                    title: prevChapterData?.title || '',
                    content: content
                  };
                  displayedContent.value = content;
                  taskStatus.value = 'SUCCESS';
                  isLoading.value = false;
                  hasFailed.value = false;
                }
              }
            } catch (error) {
              console.error('Error fetching completed chapter detail:', error);
            }

            // Wait 2 seconds before showing loading for new chapter
            setTimeout(() => {
              // Get chapter data from chapters array first, then from outline
              let newChapterData = taskData.chapters?.find((c: any) => c.chapter == newChapterIndex);
              if (!newChapterData) {
                newChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == newChapterIndex);
              }

              // Add new chapter to chapters array if not exists (for left sidebar display)
              const existingChapter = chapters.value.find((c: any) => c.chapter === newChapterIndex);
              if (!existingChapter && newChapterData) {
                chapters.value.push({
                  id: `temp-${newChapterIndex}`,
                  chapter: newChapterIndex,
                  title: newChapterData.title || t('novel.untitled'),
                  is_publish: 2
                });
              }

              // Always update global generation state regardless of navigation
              generatingChapter.value = newChapterIndex;
              stepChapterIndex.value = newChapterIndex;

              // Only auto-navigate to new generating chapter if shouldAutoNavigate is true
              // or user is currently viewing the chapter that just completed
              // Don't force-navigate if user is viewing a different completed chapter
              if (currentChapter.value && (shouldAutoNavigate.value || currentChapter.value.chapter === previousChapterIndex)) {
                // Reset estimated time for new chapter
                estimatedTime.value = null;
                originalEstimatedSeconds.value = null;
                chapterRemainingSeconds.value = null;
                displayMinutes.value = 0;
                estimatedTimeFetched.value = false;
                isLoadingComplete.value = false;
                hasStreamData.value = false;
                hasStreamingContent.value = false;
                queueInfo.value = null;
                prepareQueueInfo.value = null;
                startTime.value = null; // Reset startTime to use fresh estimated time

                // Update taskStartAt from taskData if available (new chapter start time)
                if (taskData.task_start_at) {
                  taskStartAt.value = taskData.task_start_at;
                }

                // Fetch estimated time for new chapter
                fetchEstimatedTime();

                // Update UI for new chapter
                currentChapter.value = {
                  chapter: newChapterIndex,
                  title: newChapterData?.title || '',
                  content: ''
                };
                displayedContent.value = '';
                isLoading.value = true;
                hasFailed.value = false;
                taskStatus.value = taskData.step_status || 'DOING';

                // Reset loading animation for new chapter
                stopLoadingAnimation();
              }
            }, 2000);

            // Update local chapterIndex to new chapter
            chapterIndex = newChapterIndex;

            // Continue polling
            return;
          }

          // Check task status
          if (taskData.status == 'SUCCESS' || (taskData.step_status && taskData.step_status == 'SUCCESS')) {
            // Always fetch chapter detail from API after polling success
            // The polling response does not contain chapter content
            let content = '';
            try {
              const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;
              if (chapterRes.code == 200 && chapterRes.data) {
                content = chapterRes.data.content || '';
        const detailRes = await api.detailChapter(sessionId.value, currentChapter.value?.chapter) as any;
        if (detailRes.code == 200) {
          updateChapterHistoryFromDetail(detailRes);
        }
              }
            } catch (error) {
              console.error('Error fetching chapter detail:', error);
            }

            // Update task status to SUCCESS but keep loading visible
            // Let the loading component finish its steps, then handleLoadingComplete will hide loading and show content
            taskStatus.value = 'SUCCESS';
            generatingChapter.value = null;
            hasFailed.value = false;

            // Store content to display after loading animation completes
            pendingDisplayContent.value = content;

            // Only update currentChapter if we're still viewing a chapter
            // Don't update if we're viewing outline
            if (currentChapter.value) {
              currentChapter.value.content = content;
            }
            // Hide estimated time display after chapter generation completes
            estimatedTime.value = null;
            displayMinutes.value = 0;

            // Directly show the full content instead of typewriter effect
            isChapterTyping.value = false;
            isWaitingForData.value = false;

            // Stop loading animation
            stopLoadingAnimation();

            // Directly call handleLoadingComplete to hide loading and show content
            handleLoadingComplete();

            // Check if we need to continue polling in batch mode
            if (isBatchChapter.value == 1) {
              // Don't clear polling interval - continue polling until all chapters are generated
              // Only stop polling if all chapters are generated or there's a failure
              if (chapterIndex >= chapterCount.value) {
                // All chapters have been generated
                if (pollingInterval.value) {
                  clearInterval(pollingInterval.value);
                  pollingInterval.value = null;
                }
                // Reset flags when batch generation is complete
                isUserInitiatedGeneration.value = false;
                isBatchChapter.value = 0;
                shouldAutoNavigate.value = true;
              } else if (currentChapter.value && (shouldAutoNavigate.value || currentChapter.value.chapter === chapterIndex)) {
                // Auto navigate to next chapter after 2 seconds
                // Only if user is viewing a chapter, not outline
                setTimeout(() => {
                  const nextChapterIndex = chapterIndex + 1;
                  if (nextChapterIndex <= chapterCount.value) {
                    const nextChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == nextChapterIndex);

                    // Add next chapter to chapters array if not exists
                    const existingChapter = chapters.value.find((c: any) => c.chapter === nextChapterIndex);
                    if (!existingChapter) {
                      chapters.value.push({
                        id: `temp-${nextChapterIndex}`,
                        chapter: nextChapterIndex,
                        title: nextChapterData?.title || t('novel.untitled'),
                        is_publish: 2
                      });
                    }

                    currentChapter.value = {
                      chapter: nextChapterIndex,
                      title: nextChapterData?.title || '',
                      content: ''
                    };
                    displayedContent.value = '';
                    isLoading.value = true;
                    hasFailed.value = false;
                    taskStatus.value = 'DOING';
                    generatingChapter.value = nextChapterIndex;
                    stepChapterIndex.value = nextChapterIndex;
                    // Continue polling for the new chapter
                  }
                }, 2000);
              }
            } else {
              // Clear polling interval for single chapter generation
              if (pollingInterval.value) {
                clearInterval(pollingInterval.value);
                pollingInterval.value = null;
              }
              isUserInitiatedGeneration.value = false;

              // Find the latest chapter from chapters array for stepChapterIndex
              const latestChapterNum = chapters.value.length > 0
                ? Math.max(...chapters.value.map((c: any) => c.chapter))
                : chapterIndex;
              stepChapterIndex.value = latestChapterNum;
              isRetryingChapter.value = false;
            }
          } else if (taskData.status == 'FAIL' || (taskData.step_status && taskData.step_status == 'FAIL')) {
            // Clear polling interval
            if (pollingInterval.value) {
              clearInterval(pollingInterval.value);
              pollingInterval.value = null;
            }

            // Update state for failure
            hasFailed.value = true;
            isGeneratingOutline.value = false;
            isPreparing.value = false;
            statusMessage.value = taskData.status_message || '';
            taskStatus.value = 'FAIL';
            isLoading.value = false;
            isChapterTyping.value = false;
            isWaitingForData.value = false;
            isRetryingChapter.value = false;

            // Fetch estimate and balance if insufficient balance
            if (taskData.status_message && taskData.status_message.includes('user credit is not enough')) {
              try {
                let estimateStepName = lastGenerationType.value;
                let estimateFromChapter: number | undefined;
                if (lastGenerationType.value == 'chapter') {
                  estimateStepName = isBatchChapter.value == 1 ? 'all_chapters' : 'chapter';
                  estimateFromChapter = stepChapterIndex.value || 1;
                }
                const estRes = await api.novelEstimate({
                  session_id: sessionId.value,
                  step_name: estimateStepName,
                  ...(estimateFromChapter !== undefined ? { from_chapter: estimateFromChapter } : {})
                }) as any;
                if (estRes.code == 200 && estRes.data?.total_points) {
                  estimatedComputingPower.value = estRes.data.total_points;
                } else if (estRes.code == 10404) {
                  toast(t('novel.error.cannotOperateOtherUserProject'));
                }
                await fetchUserBalance();
              } catch (e) {
                console.error('Error fetching estimate for insufficient balance:', e);
              }
            }

            stopCoverPolling();

            // Stop loading animation
            stopLoadingAnimation();
          } else if (taskData.status == 'DOING' || taskData.status == 'PREPARE' ||
                     (taskData.step_status && (taskData.step_status == 'DOING' || taskData.step_status == 'PREPARE'))) {
            // Task is still in progress, continue polling
            isWaitingForData.value = true;
            // When task status changes, fetch estimated time once (without polling)
            const currentStatus = taskData.status || taskData.step_status;
            if (taskStatus.value != currentStatus) {
              fetchEstimatedTime();
            }
            // Update task status
            taskStatus.value = currentStatus;
            // Update remaining time if available
            // In queue state, don't reset displayMinutes from polling - let the countdown run independently
            // Only update queueInfo for display purposes; displayMinutes is managed by the countdown timer
            if (taskData.estimated_time) {
              const wasInQueue = !!(queueInfo.value || prepareQueueInfo.value);
              queueInfo.value = {
                count: queueInfo.value?.count || 0,
                estimatedTime: taskData.estimated_time
              };
              if (!wasInQueue) {
                displayMinutes.value = taskData.estimated_time;
                startCountdownTimer();
              }
            }
            // Keep loading visible during polling only if:
            // 1. We're viewing a chapter (not outline)
            // 2. The currently viewed chapter is the one being generated (has DOING status)
            // Don't show loading for already generated chapters
            if (currentChapter.value) {
              const currentChapterNum = currentChapter.value.chapter;
              const isCurrentChapterGenerating = generatingChapter.value == currentChapterNum ||
                                                 currentChapterNum == stepChapterIndex.value;
              if (isCurrentChapterGenerating) {
                isLoading.value = true;
              }
            }
          }
        }

        pollingCount++;
      } catch (error) {
        console.error('Error polling task status:', error);
        // Clear polling interval on error
        if (pollingInterval.value) {
          clearInterval(pollingInterval.value);
          pollingInterval.value = null;
        }

        // Update state for failure
        hasFailed.value = true;
        taskStatus.value = 'FAIL';
        isLoading.value = false;
        isChapterTyping.value = false;
        isWaitingForData.value = false;
        stopCoverPolling();

        // Stop loading animation
        stopLoadingAnimation();
      }
    }, isBatchChapter.value == 1 || isUserInitiatedGeneration.value ? 5000 : 3000); // Poll every 5 seconds for batch mode, 3 seconds for single chapter

  } catch (error: any) {
    if (error.name == 'AbortError') return;
    hasFailed.value = true;
    taskStatus.value = 'FAIL';
    isLoading.value = false;
    isChapterTyping.value = false;
    isWaitingForData.value = false;
    stopCoverPolling();

    // Stop loading animation
    stopLoadingAnimation();
  }
};

// Fetch novel outline with complete API flow
const fetchNovelOutline = async () => {
  if (isFetchingNovelOutline.value) {
    return;
  }
  isFetchingNovelOutline.value = true;
  // Don't set isLoading to true here - wait until we know the step_name and step_status
  // isLoading.value = true;
  try {
    if (!sessionId.value) {
      toast(t('novel.error.noSessionId'));
      isLoading.value = false;
      isFetchingNovelOutline.value = false;
      return;
    }

    // Step 0: Fetch user selected settings
    await fetchUserSelectedSettings();

    // Step 1: Call detailProject API
    const detailProjectRes = await api.detailProject(sessionId.value) as any;

    if (detailProjectRes.code == 404 || detailProjectRes.code == 10423) {
      isAccessDenied.value = true;
      isLoading.value = false;
      isFetchingNovelOutline.value = false;
      return;
    }

    if (detailProjectRes.code !== 200) {
      toast(detailProjectRes.message || t('novel.error.fetchFailed'));
      isLoading.value = false;
      isFetchingNovelOutline.value = false;
      return;
    }

    // Set detail loaded flag
    isDetailLoaded.value = true;

    if (detailProjectRes.data?.user_id) {
      projectOwnerId.value = detailProjectRes.data.user_id;
    }

    // Initialize cover history list from history_data
    if (detailProjectRes.data?.history_data) {
      let historyData = detailProjectRes.data.history_data;
      if (typeof historyData == 'string') {
        try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
      }
      if (historyData?.novel_cover && Array.isArray(historyData.novel_cover)) {
        coverHistoryList.value = historyData.novel_cover;
      }
      if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
        outlineHistoryList.value = historyData.outline_novel;
      }
    }

    // Initialize project name from detailProject response
    if (detailProjectRes.data?.name) {
      projectName.value = detailProjectRes.data.name;
    }

    // Initialize topic from detailProject response
    if (detailProjectRes.data?.topic) {
      topic.value = detailProjectRes.data.topic;
    }

    // Save task_start_at if available
    if (detailProjectRes.data?.task_start_at) {
      taskStartAt.value = detailProjectRes.data.task_start_at;
      const startTimestamp = parseToUnixTimestamp(detailProjectRes.data.task_start_at);

      if (startTimestamp) {
        startTime.value = startTimestamp * 1000;
      }
    }

    // Check if detailProject has cover information and novel outline title
    if (detailProjectRes.data?.result_async) {
      try {
        let result = detailProjectRes.data.result_async;

        if (result.generate_novel_cover) {
          coverImage.value = result.generate_novel_cover;
          showCoverEditBtn.value = true;
        }

        // Check for novel outline title and update project name if needed
        if (result.generate_novel_outline?.title) {
          const novelTitle = result.generate_novel_outline.title;
          projectName.value = novelTitle;
          // If project name is empty, call modifyProject API to update project name
          if (!detailProjectRes.data?.name) {
            try {
              const res = await api.modifyProject({
                session_id: sessionId.value,
                name: novelTitle
              }) as any;
              if (res.code == 200) {
                // Update project name in left area
                projectName.value = novelTitle;
              } else {
                console.error('Failed to update project name:', res.message);
              }
            } catch (error) {
              console.error('Error updating project name:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing cover from detailProject:', error);
      }
    }

    // Get is_batch_chapter from detailProject response
    if (detailProjectRes.data?.is_batch_chapter) {
      isBatchChapter.value = detailProjectRes.data.is_batch_chapter;
    }

    // Get chapters from detailProject response
    if (detailProjectRes.data?.chapters) {
      chapters.value = detailProjectRes.data.chapters;
      // Update chapterCount based on chapters length
      chapterCount.value = detailProjectRes.data.chapters.length;
    }

    // Get step_name from detailProject response
    if (detailProjectRes.data?.step_name) {
      currentStepName.value = detailProjectRes.data.step_name;

      if (currentStepName.value == 'renew_novel_cover' || currentStepName.value == 'refresh_novel_cover') {
        const stepStatus = detailProjectRes.data?.step_status;
        const resultAsync = detailProjectRes.data?.result_async;

        if (stepStatus == 'DOING' || stepStatus == 'PREPARE') {
          coverRenewLoading.value = true;
          coverRenewFailed.value = false;
          showCoverEditBtn.value = false;
          taskStatus.value = 'SUCCESS';
          currentChapter.value = null;

          if (!outlineData.value) {
            try {
              let result = resultAsync;
              if (typeof result == 'string') {
                try { result = JSON.parse(result); } catch (e) { result = null; }
              }
              if (result?.generate_novel_outline) {
                outlineData.value = result.generate_novel_outline;
                if (result.generate_novel_outline.base_info?.total_chapters) {
                  chapterCount.value = result.generate_novel_outline.base_info.total_chapters;
                }
              }
            } catch (e) {
              console.error('Error parsing outline data for cover renew:', e);
            }
          }

          isLoading.value = false;
          isLoadingComplete.value = true;

          startCoverRenewPolling(sessionId.value);
        } else if (stepStatus == 'SUCCESS') {
          coverRenewLoading.value = false;
          coverRenewFailed.value = false;
          showCoverEditBtn.value = true;
          taskStatus.value = 'SUCCESS';

          if (resultAsync) {
            try {
              let result = resultAsync;
              if (typeof result == 'string') {
                result = JSON.parse(result);
              }
              const newCoverUrl = result?.cover_url || result?.generate_novel_cover || result?.renew_novel_cover || result?.refresh_novel_cover || '';
              if (newCoverUrl) {
                coverImage.value = newCoverUrl;
              }
            } catch (e) {
              console.error('Error parsing cover renew result:', e);
            }
          }

          if (!outlineData.value && resultAsync) {
            try {
              let result = resultAsync;
              if (typeof result == 'string') {
                try { result = JSON.parse(result); } catch (e) { result = null; }
              }
              if (result?.generate_novel_outline) {
                outlineData.value = result.generate_novel_outline;
                if (result.generate_novel_outline.base_info?.total_chapters) {
                  chapterCount.value = result.generate_novel_outline.base_info.total_chapters;
                }
              }
            } catch (e) {}
          }

          const chapterIndex = detailProjectRes.data?.step_chapter_index;
          if (chapterIndex && chapterIndex >= 1) {
            stepChapterIndex.value = chapterIndex;
            const latestChapterNum = chapters.value.length > 0
              ? Math.max(...chapters.value.map((c: any) => c.chapter))
              : 0;
            if (latestChapterNum > chapterIndex) {
              const chapterData = chapters.value.find((c: any) => c.chapter == latestChapterNum);
              currentChapter.value = {
                chapter: latestChapterNum,
                title: chapterData?.title || '',
                content: ''
              };
              displayedContent.value = '';
              try {
                const chapterRes = await api.detailChapter(sessionId.value, latestChapterNum) as any;
                if (chapterRes.code == 200 && chapterRes.data) {
                  let content = chapterRes.data.content || '';
                  content = content.replace(/\\n/g, '\n');
                  currentChapter.value = {
                    chapter: latestChapterNum,
                    title: chapterData?.title || chapterRes.data.title || '',
                    content
                  };
                  displayedContent.value = content;
                }
              } catch (e) {
                console.error('Error fetching chapter data on cover renew success:', e);
              }
            }
          } else {
            currentChapter.value = null;
          }

          isLoading.value = false;
          isLoadingComplete.value = true;
        } else if (stepStatus == 'FAIL') {
          coverRenewLoading.value = false;
          coverRenewFailed.value = true;
          showCoverEditBtn.value = false;
          hasFailed.value = false;
          taskStatus.value = 'SUCCESS';
          currentChapter.value = null;

          if (!outlineData.value && resultAsync) {
            try {
              let result = resultAsync;
              if (typeof result == 'string') {
                try { result = JSON.parse(result); } catch (e) { result = null; }
              }
              if (result?.generate_novel_outline) {
                outlineData.value = result.generate_novel_outline;
                if (result.generate_novel_outline.base_info?.total_chapters) {
                  chapterCount.value = result.generate_novel_outline.base_info.total_chapters;
                }
              }
            } catch (e) {
              console.error('Error parsing outline data for cover renew FAIL:', e);
            }
          }

          isLoading.value = false;
          isLoadingComplete.value = true;
        }

        isFetchingNovelOutline.value = false;
        return;
      } else if (currentStepName.value == 'renew_novel_insert_image') {
        // Resume an in-progress illustration regeneration after a page refresh
        const stepStatus = detailProjectRes.data?.step_status;
        const resultAsync = detailProjectRes.data?.result_async;
        let editState = detailProjectRes.data?.edit_state;
        if (typeof editState == 'string') {
          try { editState = JSON.parse(editState); } catch (e) { editState = null; }
        }
        const editedChapter = Number(editState?.chapter);
        const editedIndex = editState?.image_index;

        // Make sure outline data is available (for chapter titles / sidebar)
        if (!outlineData.value && resultAsync) {
          try {
            let result = resultAsync;
            if (typeof result == 'string') {
              try { result = JSON.parse(result); } catch (e) { result = null; }
            }
            if (result?.generate_novel_outline) {
              outlineData.value = result.generate_novel_outline;
              if (result.generate_novel_outline.base_info?.total_chapters) {
                chapterCount.value = result.generate_novel_outline.base_info.total_chapters;
              }
            }
          } catch (e) {
            console.error('Error parsing outline data for insert image renew:', e);
          }
        }

        const chapterIndex = detailProjectRes.data?.step_chapter_index;
        if (chapterIndex && chapterIndex >= 1) {
          stepChapterIndex.value = chapterIndex;
        }
        // Ensure the target chapter isn't treated as an ungenerated future chapter
        if (editedChapter >= 1 && stepChapterIndex.value < editedChapter) {
          stepChapterIndex.value = editedChapter;
        }

        taskStatus.value = 'SUCCESS';
        isLoading.value = false;
        isLoadingComplete.value = true;

        // Load and display the chapter that owns the illustration (edit_state.chapter)
        if (editedChapter >= 1) {
          await goToChapter(editedChapter);

          // If still generating, show the skeleton on that illustration and resume polling
          if ((stepStatus == 'DOING' || stepStatus == 'PREPARE') && editedIndex != null) {
            renewingInsertImagePlaceholder.value = Number(editedIndex);
            renewingInsertImageChapter.value = Number(editedChapter);
            startInsertImageRenewPolling(sessionId.value, Number(editedIndex));
          }
        }

        isFetchingNovelOutline.value = false;
        return;
      } else if (currentStepName.value == 'outline') {
        // Show novel outline area
        currentChapter.value = null;

        // Check if outline is being generated
        const stepStatus = detailProjectRes.data?.step_status;

        if (stepStatus == 'DOING') {
          // Set generation type flag so fetchEstimatedTime uses correct logic
          lastGenerationType.value = 'outline';
          isGeneratingOutline.value = true;

          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          // Fetch estimated time FIRST - before setting any flags that would
          // cause NovelLoading to render with default/null time values
          await fetchEstimatedTime();

          // NOW set rendering flags - time values are ready
          isLoading.value = true;
          hasFailed.value = false;
          taskStatus.value = 'DOING';
          startLoadingAnimation('outline');

          // Start polling for task status
          startPolling();
        } else if (stepStatus == 'PREPARE') {
          // Outline is in preparation/queue - show queue info, not loading progress
          lastGenerationType.value = 'outline';

          const initialQueuePosition = detailProjectRes.data?.queue_position ?? 0;
          isLoading.value = false;
          hasFailed.value = false;
          taskStatus.value = 'PREPARE';
          isPreparing.value = true;
          isGeneratingOutline.value = false;

          if (initialQueuePosition > 0) {
            await fetchEstimatedTime();
            prepareQueueInfo.value = {
               count: initialQueuePosition,
              estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60) + initialQueuePosition * 20
            };
          } else {
            prepareQueueInfo.value = {
               count: 0,
              estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60)
            };
          }

          displayMinutes.value = prepareQueueInfo.value.estimatedTime;
          startCountdownTimer();
          // Use detailPolling to wait for PREPARE→DOING transition
          startDetailPolling();
        } else if (stepStatus == 'FAIL') {
          // Outline generation failed - show failed state
          isLoading.value = false;
          hasFailed.value = true;
          taskStatus.value = 'FAIL';
          isGeneratingOutline.value = false;
          lastGenerationType.value = 'outline';
          // Set loading process type for outline generation
          startLoadingAnimation('outline');
        } else if (stepStatus == 'SUCCESS') {
          // Outline generation succeeded - set stream data flag
          hasStreamData.value = true;
          // Outline generation succeeded - show success state
          isLoading.value = false;
          hasFailed.value = false;
          taskStatus.value = 'SUCCESS';
          isGeneratingOutline.value = false;
          lastGenerationType.value = 'outline';
          stepChapterIndex.value = 0;
          // Set loading process type for outline generation
          startLoadingAnimation('outline');

          // Check if result_async has generate_novel_cover field
          const resultAsync = detailProjectRes.data?.result_async;
          if (resultAsync) {
            try {
              let result = resultAsync;
              if (typeof result == 'string') {
                result = JSON.parse(result);
              }
              if (result.generate_novel_cover) {
                coverImage.value = result.generate_novel_cover;
                showCoverEditBtn.value = true;
              } else {
                // No cover yet, start polling for cover
                coverTaskId.value = sessionId.value;
                coverLoading.value = true;
                startCoverPolling(sessionId.value);
              }
            } catch (error) {
              console.error('Error parsing cover from result_async:', error);
              // If parsing fails, start polling for cover
              coverTaskId.value = sessionId.value;
              coverLoading.value = true;
              startCoverPolling(sessionId.value);
            }
          } else {
            // No result_async, start polling for cover
            coverTaskId.value = sessionId.value;
            coverLoading.value = true;
            startCoverPolling(sessionId.value);
          }
        }
      } else if (currentStepName.value == 'chapter') {
        // Show chapter area
        const stepStatus = detailProjectRes.data?.step_status;
        const chapterIndex = detailProjectRes.data?.step_chapter_index;
        const resultAsync = detailProjectRes.data?.result_async;

        // First, try to get outline data from result_async if available
        if (resultAsync && !outlineData.value) {
          try {
            let outlineResult = resultAsync;
            if (typeof outlineResult == 'string') {
              outlineResult = JSON.parse(outlineResult);
            }
            if (outlineResult.generate_novel_outline) {
              outlineResult = outlineResult.generate_novel_outline;
            }
            // Only set outlineData without calling fetchPointsEstimate
            outlineData.value = outlineResult;
            if (outlineData.value?.base_info?.total_chapters) {
              chapterCount.value = outlineData.value.base_info.total_chapters;
            }
          } catch (error) {
            console.error('Error parsing outline from result_async:', error);
          }
        }

        // Set stepChapterIndex to the current chapter index
        if (chapterIndex) {
          stepChapterIndex.value = chapterIndex;

          // Check if chapterIndex is greater than chapters length, add generating chapter if needed
          const existingChapter = chapters.value.find((c: any) => c.chapter == chapterIndex);
          if (!existingChapter && (stepStatus == 'PREPARE' || stepStatus == 'DOING')) {
            // Get chapter title from outline data if available
            const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterIndex);
            chapters.value.push({
              id: `temp-${chapterIndex}`,
              chapter: chapterIndex,
              title: chapterData?.title || t('novel.untitled'),
              is_publish: 2 // 未发布状态
            });
          }
        }

        if (stepStatus == 'PREPARE' && chapterIndex) {
          const chapterData = chapters.value.find((c: any) => c.chapter == chapterIndex);

          // Set generation type flag so fetchEstimatedTime uses correct logic
          lastGenerationType.value = 'chapter';
          currentStepName.value = 'chapter';
          generatingChapter.value = chapterIndex;

          // Ensure startTime is set from taskStartAt for accurate progress
          if (taskStartAt.value && !startTime.value) {
            const startTimestamp = parseToUnixTimestamp(taskStartAt.value);
            if (startTimestamp) {
              startTime.value = startTimestamp * 1000;
            }
          }

          // Fetch estimated time FIRST - before setting any flags that would
          // cause NovelLoading to render with default/null time values
          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          await fetchEstimatedTime();

          // NOW set rendering flags - time values are ready
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          displayedContent.value = '';
          isPreparing.value = true;
          hasFailed.value = false;
          taskStatus.value = 'PREPARE';
          startLoadingAnimation('chapter');

          // Start polling detailProject API for PREPARE state
          startDetailPolling();

          isLoading.value = false;
          isFetchingNovelOutline.value = false;
          return;
        } else if (stepStatus == 'SUCCESS' && chapterIndex) {
          // Find the latest chapter from chapters array instead of relying on step_chapter_index
          const latestChapterNum = chapters.value.length > 0
            ? Math.max(...chapters.value.map((c: any) => c.chapter))
            : chapterIndex;
          stepChapterIndex.value = latestChapterNum;

          const chapterData = chapters.value.find((c: any) => c.chapter == latestChapterNum);
          currentChapter.value = {
            chapter: latestChapterNum,
            title: chapterData?.title || '',
            content: ''
          };
          startLoadingAnimation('chapter');

          try {
            const chapterRes = await api.detailChapter(sessionId.value, latestChapterNum) as any;
            if (chapterRes.code == 200 && chapterRes.data) {
              currentChapter.value = {
                chapter: latestChapterNum,
                title: chapterData?.title || chapterRes.data.title || '',
                content: chapterRes.data.content || ''
              };
              taskStatus.value = 'SUCCESS';
              hasFailed.value = false;
              isPreparing.value = false;
              prepareQueueInfo.value = null;

              let content = chapterRes.data.content || '';
              content = content.replace(/\\n/g, '\n');

              displayedContent.value = content;

              updateChapterHistoryFromDetail(chapterRes);

              nextTick(() => {
                if (chapterContentRef.value) {
                  chapterContentRef.value.scrollTop = 0;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching chapter data:', error);
          } finally {
            isLoading.value = false;
            isLoadingComplete.value = true;
          }

          await fetchUserBalance();

          isFetchingNovelOutline.value = false;
          return;
        }

        if (stepStatus == 'DOING' && chapterIndex) {
          // Set up chapter state before streaming
          const chapterData = chapters.value.find((c: any) => c.chapter == chapterIndex);
          displayedContent.value = '';
          isPreparing.value = false;
          prepareQueueInfo.value = null;
          lastGenerationType.value = 'chapter';
          isGeneratingOutline.value = false;
          generatingChapter.value = chapterIndex;

          // Ensure startTime is set from taskStartAt for accurate progress calculation on refresh
          if (taskStartAt.value && !startTime.value) {
            const startTimestamp = parseToUnixTimestamp(taskStartAt.value);
            if (startTimestamp) {
              startTime.value = startTimestamp * 1000;
            }
          }

          // Fetch estimated time FIRST before setting taskStatus and currentChapter
          // This ensures the loading animation starts from the correct position
          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          await fetchEstimatedTime();

          // Now set taskStatus and currentChapter AFTER we have time estimates
          // This prevents the NovelLoading component from rendering with default values
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          hasFailed.value = false;
          taskStatus.value = 'DOING';
          currentStepName.value = 'chapter';
          // Set loading process type for chapter generation
          startLoadingAnimation('chapter');
          isLoading.value = true;

          // Call fetchChapterStream to handle chapter streaming
          await fetchChapterStream(chapterIndex);
          // Return early to avoid polling logic
          isFetchingNovelOutline.value = false;
          return;
        } else if (stepStatus == 'FAIL' && chapterIndex) {
          const chapterAtIndex = chapters.value.find((c: any) => c.chapter == chapterIndex);
          if (chapterAtIndex) {
            const maxExistingChapter = chapters.value.length > 0
              ? Math.max(...chapters.value.map((c: any) => c.chapter))
              : 0;
            stepChapterIndex.value = maxExistingChapter;
            hasFailed.value = false;
            taskStatus.value = 'SUCCESS';

            if (outlineData.value?.base_info?.total_chapters) {
              chapterCount.value = outlineData.value.base_info.total_chapters;
            }

            const latestChapterData = chapters.value.find((c: any) => c.chapter == maxExistingChapter);

            try {
              const chapterRes = await api.detailChapter(sessionId.value, maxExistingChapter) as any;
              if (chapterRes.code == 200 && chapterRes.data) {
                let content = chapterRes.data.content || '';
                content = content.replace(/\\n/g, '\n');
                currentChapter.value = {
                  chapter: maxExistingChapter,
                  title: latestChapterData?.title || chapterRes.data.title || '',
                  content
                };
                displayedContent.value = content;
                updateChapterHistoryFromDetail(chapterRes);
              } else {
                currentChapter.value = {
                  chapter: maxExistingChapter,
                  title: latestChapterData?.title || '',
                  content: ''
                };
                displayedContent.value = '';
              }
            } catch (e) {
              currentChapter.value = {
                chapter: maxExistingChapter,
                title: latestChapterData?.title || '',
                content: ''
              };
              displayedContent.value = '';
            }

            isPreparing.value = false;
            prepareQueueInfo.value = null;
            generatingChapter.value = null;
            currentStepName.value = 'chapter';
            lastGenerationType.value = 'chapter';
            showCoverEditBtn.value = true;
            isLoading.value = false;
            isLoadingComplete.value = true;
            isFetchingNovelOutline.value = false;
            await fetchUserBalance();
            return;
          }

          stepChapterIndex.value = chapterIndex;
          const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterIndex);
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          displayedContent.value = '';
          hasFailed.value = true;
          taskStatus.value = 'FAIL';
          isPreparing.value = false;
          prepareQueueInfo.value = null;
          generatingChapter.value = chapterIndex;
          currentStepName.value = 'chapter';
          lastGenerationType.value = 'chapter';
          showCoverEditBtn.value = true;
          startLoadingAnimation('chapter');

          const existingChapter = chapters.value.find((c: any) => c.chapter == chapterIndex);
          if (!existingChapter) {
            chapters.value.push({
              id: `temp-${chapterIndex}`,
              chapter: chapterIndex,
              title: chapterData?.title || t('novel.untitled'),
              is_publish: 2
            });
          }

          await fetchUserBalance();
          isLoading.value = false;
          isFetchingNovelOutline.value = false;
          return;
        } else if (chapterIndex) {
          // step_status is SUCCESS or other non-DOING state: fetch chapter detail and display directly
          try {
            const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;
            if (chapterRes.code == 200 && chapterRes.data) {
              const chapterData = chapters.value.find((c: any) => c.chapter == chapterIndex);
              currentChapter.value = {
                chapter: chapterIndex,
                title: chapterData?.title || chapterRes.data.title || '',
                content: chapterRes.data.content || ''
              };
              currentStepName.value = 'chapter';
              taskStatus.value = 'SUCCESS';
              // Set loading process type for chapter generation
              startLoadingAnimation('chapter');

              // Process content: handle escape characters and filter
              let content = chapterRes.data.content || '';
              content = content.replace(/\\n/g, '\n');

              currentChapter.value.content = content;
              displayedContent.value = content;

              updateChapterHistoryFromDetail(chapterRes);
            }
          } catch (error) {
            console.error('Error fetching chapter data:', error);
          }

          // Fetch points estimate for chapter step only if generation hasn't failed
          if (!hasFailed.value) {
            await fetchPointsEstimate();
          }
          // Return early to avoid polling logic
          isLoading.value = false;
          isLoadingComplete.value = true;
          isFetchingNovelOutline.value = false;
          return;
        }
      }
    }

    // Check if result_async is empty
    if (!detailProjectRes.data?.result_async) {
      // Check step_name and status_message
      const stepName = detailProjectRes.data?.step_name;
      const statusMessage = detailProjectRes.data?.status_message;

      // If step_name has no value and status_message has no value, directly call novelOutline API
      if (!stepName && !statusMessage) {
        callNovelOutline('new');
      }
    } else {
      // Only parse result_async and show content when step_status is SUCCESS
      // For DOING/PREPARE states, keep showing loading state and continue polling
      const stepStatusForResult = detailProjectRes.data?.step_status;

      if (currentStepName.value == 'outline' && stepStatusForResult == 'SUCCESS') {
        isLoading.value = false;
        hasFailed.value = false;
        // Try to parse result_async if it's available
        if (detailProjectRes.data?.result_async) {
          try {
            let result = detailProjectRes.data.result_async;
            // Check if result is string and parse it
            if (typeof result == 'string') {
              result = JSON.parse(result);
            }
            // Check if result has generate_novel_cover field
            if (result.generate_novel_cover) {
              coverImage.value = result.generate_novel_cover;
              showCoverEditBtn.value = true;
            }
            // Check if result has generate_novel_outline field
            if (result.generate_novel_outline) {
              result = result.generate_novel_outline;
            }
            handleStructuredData(result);
          } catch (error) {
            console.error('Error parsing result_async:', error);
          }
        }
      } else if (currentStepName.value !== 'chapter' && stepStatusForResult !== 'FAIL') {
        // For non-outline step_names, start polling directly
        if (currentStepName.value !== 'chapter') {
          // Start polling for task status
          startPolling();
        }
      }
    }
  } catch (error) {
    toast(t('fail'));
    isLoading.value = false;
  } finally {
    isFetchingNovelOutline.value = false;
  }
};

// Handle polling response
const handlePollingResponse = async (pollingRes: any) => {
  if (handleSessionTimeout(pollingRes.code)) {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    return;
  }

  if (pollingRes.code == 401) {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    return;
  }

  if (pollingRes.code != 200) {
    return;
  }

  const status = pollingRes.data?.status;
  taskStatus.value = status;

  // Check if queue_info is available and update estimated time
  if (pollingRes.data?.queue_info) {
    const queuePosition = pollingRes.data.queue_info.queue_position ?? 0;
    const baseEstimatedSeconds = isGeneratingOutline.value
      ? (originalEstimatedSeconds.value || 600)
      : (originalEstimatedSeconds.value || 600);
    const estimatedMinutes = Math.ceil(baseEstimatedSeconds / 60) + queuePosition * 20;
    const queuePositionChanged = queuePosition !== (prepareQueueInfo.value?.count ?? -1);

    // Update queue information
    prepareQueueInfo.value = {
        count: queuePosition,
       estimatedTime: estimatedMinutes
     };
    if (queuePositionChanged) {
      displayMinutes.value = estimatedMinutes;
      startCountdownTimer();
    }
     // Only fetch estimated time if not already fetched to avoid resetting progress
     if (!estimatedTimeFetched.value) {
       fetchEstimatedTime(queuePosition);
     }
  }

  if (status == 'SUCCESS') {
    // Stop polling
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }

    isLoading.value = false;
    hasFailed.value = false;
    isPreparing.value = false;
    prepareQueueInfo.value = null;
    generatingChapter.value = null;
    isLoadingComplete.value = true;
    stopLoadingAnimation();

    // Check if we're generating outline or chapter
    if (isGeneratingOutline.value) {
      // Outline generation completed - need to fetch detail project for full data
      fetchDetailProjectForOutline();
    } else if (outlineStreamDone.value) {
      // Legacy: for streaming outline that's already done
      // Set hasStreamData to true to show outline content
      hasStreamData.value = true;

      // Reset currentChapter to show "待生成章节" section in left sidebar
      currentChapter.value = null;
      // Reset stepChapterIndex to 0 to show "待生成章节" section
      stepChapterIndex.value = 0;
      // Reset currentStepName to outline to show generate buttons
      currentStepName.value = 'outline';
      // Reset generating outline flag
      isGeneratingOutline.value = false;
      // Start polling for cover image
      if (coverTaskId.value) {
        startCoverPolling(coverTaskId.value);
      }
    } else {
      // Chapter generation completed - need to fetch chapter detail
      fetchChapterDetailForGeneration();
    }
  } else if (status == 'FAIL') {
    // Stop polling
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }

    // If outline stream has error, don't override
    if (outlineStreamError.value) {
      return;
    }

    isLoading.value = false;
    hasFailed.value = true;
    isGeneratingOutline.value = false;
    isPreparing.value = false; // Reset preparation state
    prepareQueueInfo.value = null; // Clear queue info
    generatingChapter.value = null;
    outlineContent.value = pollingRes.data?.error_msg || pollingRes.data?.result || t('novel.error.generationFailed');

    if (currentChapter.value && currentStepName.value == 'chapter') {
      const chapterIndex = currentChapter.value.chapter;
      const existingChapter = chapters.value.find((c: any) => c.chapter == chapterIndex);
      if (existingChapter) {
        try {
          const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;
          if (chapterRes.code == 200 && chapterRes.data) {
            updateChapterHistoryFromDetail(chapterRes);
          }
        } catch (e) {
          console.error('Error fetching chapter detail on polling FAIL:', e);
        }
      }
    }
  } else if (status == 'DOING') {
    // DOING state: continue polling, no need to update estimated time
    // If the currently viewed chapter is the one being generated, start fetching content
    isPreparing.value = false; // Reset preparation state
    prepareQueueInfo.value = null; // Clear queue info
    if (generatingChapter.value !== null && currentChapter.value?.chapter === generatingChapter.value) {
      fetchChapterStream(generatingChapter.value);
    }
  } else if (status == 'PREPARE') {
    // Switch to detailPolling to wait for PREPARE→DOING transition
    isPreparing.value = true;
    isGeneratingOutline.value = false;
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    startDetailPolling();
  } else if (status != 'DOING') {
    // Stop polling if status is not DOING, SUCCESS, FAIL, or PREPARE
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    isPreparing.value = false; // Reset preparation state
    prepareQueueInfo.value = null; // Clear queue info
  }
};

// Start polling for task status
const startPolling = () => {
  // Clear any existing polling interval
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }

  // Stop detail polling when switching to task polling
  stopDetailPolling();

  // Start polling every 3 seconds
  pollingInterval.value = window.setInterval(async () => {
    try {
      // Always poll taskPolling API for task status
      // This handles both outline generation and chapter generation
      const pollingRes = await api.taskPolling(sessionId.value) as any;

      // Handle polling response
      handlePollingResponse(pollingRes);

    } catch (error) {
      console.error('Error during polling:', error);
      // Stop loading when polling fails
      isLoading.value = false;
      // If in preparation state, set to failed state
      if (isPreparing.value) {
        hasFailed.value = true;
        isPreparing.value = false;
        prepareQueueInfo.value = null;
      }
    }
  }, 3000);
};

// Start polling detailProject API for PREPARE state
// When step_status transitions from PREPARE to DOING:
// - Single chapter: switch to taskPolling via startPolling + fetchChapterStream
// - Batch chapter: continue polling detailProject API
const startDetailPolling = () => {
  if (detailPollingInterval.value) {
    clearInterval(detailPollingInterval.value);
  }

  // Stop taskPolling while in PREPARE state
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }

  detailPollingInterval.value = window.setInterval(async () => {
    try {
      const detailRes = await api.detailProject(sessionId.value) as any;

      if (handleSessionTimeout(detailRes.code) || detailRes.code == 401) {
        if (detailPollingInterval.value) {
          clearInterval(detailPollingInterval.value);
          detailPollingInterval.value = null;
        }
        return;
      }

      if (detailRes.code != 200 || !detailRes.data) return;

      if (detailRes.data.user_id) {
        projectOwnerId.value = detailRes.data.user_id;
      }

      const stepStatus = detailRes.data.step_status;
      const stepName = detailRes.data.step_name;
      const chapterIndex = detailRes.data.step_chapter_index;

      if (stepName) {
        currentStepName.value = stepName;
      }

      if (stepName == 'renew_novel_cover' || stepName == 'refresh_novel_cover') {
        if (!coverRenewLoading.value) {
          coverRenewLoading.value = true;
          coverRenewFailed.value = false;
          showCoverEditBtn.value = false;
        }

        const resultAsync = detailRes.data.result_async;

        if (stepStatus == 'SUCCESS') {
          coverRenewLoading.value = false;
          coverRenewFailed.value = false;
          showCoverEditBtn.value = true;
          if (resultAsync) {
            let result = resultAsync;
            if (typeof result == 'string') {
              try { result = JSON.parse(result); } catch (e) {}
            }
            const newCoverUrl = result?.cover_url || result?.generate_novel_cover || result?.renew_novel_cover || result?.refresh_novel_cover || '';
            if (newCoverUrl) {
              coverImage.value = newCoverUrl;
            }
          }
          await fetchUserBalance();
          stopDetailPolling();
          return;
        } else if (stepStatus == 'FAIL') {
          coverRenewLoading.value = false;
          coverRenewFailed.value = true;
          showCoverEditBtn.value = false;
          hasFailed.value = false;
          taskStatus.value = 'SUCCESS';
          currentChapter.value = null;
          isLoading.value = false;
          isLoadingComplete.value = true;
          await fetchUserBalance();
          stopDetailPolling();
          return;
        } else if (stepStatus == 'PREPARE' || stepStatus == 'DOING') {
          return;
        }
      }

      if (chapterIndex && !isRetryingChapter.value) {
        stepChapterIndex.value = chapterIndex;
      }

      // Merge chapters list
      if (detailRes.data.chapters && detailRes.data.chapters.length > 0) {
        detailRes.data.chapters.forEach((serverChapter: any) => {
          const existingIndex = chapters.value.findIndex((c: any) => c.chapter === serverChapter.chapter);
          if (existingIndex !== -1) {
            chapters.value[existingIndex] = serverChapter;
          } else {
            chapters.value.push(serverChapter);
          }
        });
      }

      if (stepStatus == 'PREPARE') {
        // Still in PREPARE, update queue info and estimated time
        isPreparing.value = true;
        isGeneratingOutline.value = false;
        const newQueuePosition = detailRes.data?.queue_position ?? 0;
        const queuePositionChanged = newQueuePosition !== (prepareQueueInfo.value?.count ?? -1);

        if (newQueuePosition > 0) {
          const newEstimatedTime = Math.ceil((originalEstimatedSeconds.value || 600) / 60) + newQueuePosition * 20;
          prepareQueueInfo.value = {
             count: newQueuePosition,
            estimatedTime: newEstimatedTime
          };
          if (queuePositionChanged) {
            displayMinutes.value = newEstimatedTime;
            startCountdownTimer();
          }
          if (!estimatedTimeFetched.value) {
            fetchEstimatedTime();
          }
        } else {
          prepareQueueInfo.value = {
             count: 0,
            estimatedTime: Math.ceil((originalEstimatedSeconds.value || 600) / 60)
          };
          if (queuePositionChanged) {
            displayMinutes.value = prepareQueueInfo.value.estimatedTime;
            startCountdownTimer();
          }
        }
      } else if (stepStatus == 'DOING') {
        // PREPARE -> DOING transition
        stopDetailPolling();
        isPreparing.value = false;
        prepareQueueInfo.value = null;

        if (stepName == 'outline') {
          // Outline PREPARE -> DOING: start outline generation flow
          lastGenerationType.value = 'outline';
          isGeneratingOutline.value = true;
          hasFailed.value = false;

          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          await fetchEstimatedTime();

          taskStatus.value = 'DOING';
          startLoadingAnimation('outline');
          startPolling();
        } else if (chapterIndex) {
          generatingChapter.value = chapterIndex;
          stepChapterIndex.value = chapterIndex;

          const chapterData = chapters.value.find((c: any) => c.chapter == chapterIndex);
          const existingChapter = chapters.value.find((c: any) => c.chapter == chapterIndex);
          if (!existingChapter) {
            const outlineChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == chapterIndex);
            chapters.value.push({
              id: `temp-${chapterIndex}`,
              chapter: chapterIndex,
              title: outlineChapterData?.title || t('novel.untitled'),
              is_publish: 2
            });
          }

          // Only navigate to the generating chapter if user is viewing it (or shouldAutoNavigate)
          // Don't force-navigate away from outline or other chapters
          if (currentChapter.value && currentChapter.value.chapter == chapterIndex) {
            currentChapter.value = {
              chapter: chapterIndex,
              title: chapterData?.title || '',
              content: ''
            };
            displayedContent.value = '';
          }

          hasFailed.value = false;

          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          await fetchEstimatedTime();

          taskStatus.value = 'DOING';
          startLoadingAnimation('chapter');

          if (isBatchChapter.value == 1) {
            // Batch mode: continue polling detailProject API via fetchChapterStream
            fetchChapterStream(chapterIndex);
          } else {
            // Single chapter mode: switch to taskPolling via startPolling + fetchChapterStream
            startPolling();
            if (generatingChapter.value !== null) {
              fetchChapterStream(generatingChapter.value);
            }
          }
        }
      } else if (stepStatus == 'FAIL') {
        stopDetailPolling();
        isPreparing.value = false;
        isGeneratingOutline.value = false;
        prepareQueueInfo.value = null;
        generatingChapter.value = null;
        isRetryingChapter.value = false;

        if (stepName == 'outline') {
          lastGenerationType.value = 'outline';
          hasFailed.value = true;
          taskStatus.value = 'FAIL';
          isLoading.value = false;
          stopLoadingAnimation();
          await fetchUserBalance();
          return;
        }

        lastGenerationType.value = 'chapter';

        // Show the failed chapter
        hasFailed.value = true;
        taskStatus.value = 'FAIL';
        isLoading.value = false;

        if (chapterIndex) {
          const chapterData = chapters.value.find((c: any) => c.chapter == chapterIndex);
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          displayedContent.value = '';
        }

        await fetchUserBalance();
        stopLoadingAnimation();
      } else if (stepStatus == 'SUCCESS') {
        stopDetailPolling();
        taskStatus.value = 'SUCCESS';
        isLoading.value = false;
        hasFailed.value = false;
        isPreparing.value = false;
        prepareQueueInfo.value = null;
        generatingChapter.value = null;
        isRetryingChapter.value = false;

        // Find the latest chapter from chapters array instead of relying on step_chapter_index
        const latestChapterNum = chapters.value.length > 0
          ? Math.max(...chapters.value.map((c: any) => c.chapter))
          : (chapterIndex || 0);

        if (latestChapterNum > 0) {
          stepChapterIndex.value = latestChapterNum;
          try {
            const chapterRes = await api.detailChapter(sessionId.value, latestChapterNum) as any;
            if (chapterRes.code == 200 && chapterRes.data) {
              let content = chapterRes.data.content || '';
              content = content.replace(/\\n/g, '\n');
              const chapterData = chapters.value.find((c: any) => c.chapter == latestChapterNum);
              currentChapter.value = {
                chapter: latestChapterNum,
                title: chapterData?.title || chapterRes.data.title || '',
                content
              };
              displayedContent.value = content;
            }
          } catch (e) {
            console.error('Error fetching chapter data after SUCCESS:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error during detail polling:', error);
    }
  }, 3000);
};

// Stop detail polling
const stopDetailPolling = () => {
  if (detailPollingInterval.value) {
    clearInterval(detailPollingInterval.value);
    detailPollingInterval.value = null;
  }
};

// Fetch detail project after outline generation completes
const fetchDetailProjectForOutline = async () => {
  try {
    const detailProjectRes = await api.detailProject(sessionId.value) as any;

    if (detailProjectRes.code == 200 && detailProjectRes.data) {
      const taskData = detailProjectRes.data;

      if (taskData.user_id) {
        projectOwnerId.value = taskData.user_id;
      }

      // Set task status to SUCCESS
      taskStatus.value = 'SUCCESS';

      // Set detail loaded flag - this is crucial for displaying content
      isDetailLoaded.value = true;

      // Initialize project name from detailProject response
      if (detailProjectRes.data?.name) {
        projectName.value = detailProjectRes.data.name;
      }

      // Initialize topic from detailProject response
      if (detailProjectRes.data?.topic) {
        topic.value = detailProjectRes.data.topic;
      }

      // Parse outline data from result_async
      let resultAsync = null;
      if (taskData.result_async) {
        if (typeof taskData.result_async === 'string') {
          try {
            resultAsync = JSON.parse(taskData.result_async);
          } catch (e) {
            console.error('Error parsing result_async:', e);
          }
        } else {
          resultAsync = taskData.result_async;
        }
      }

      // Update outline data
      if (resultAsync) {
        // Check if resultAsync has generate_novel_outline field
        let outlineResult = resultAsync;
        if (resultAsync.generate_novel_outline) {
          outlineResult = resultAsync.generate_novel_outline;
        }

        if (outlineResult && outlineResult.base_info) {
          outlineData.value = outlineResult;

          // Update project name
          if (outlineResult.base_info.title) {
            projectName.value = outlineResult.base_info.title;
          }

          // Update chapter count
          if (outlineResult.base_info.total_chapters) {
            chapterCount.value = outlineResult.base_info.total_chapters;
          }

          // Update chapters list if available
          if (taskData.chapters) {
            chapters.value = taskData.chapters;
          }
        }
      }

      // Update cover if available
      if (taskData.result_async) {
        try {
          let coverData = taskData.result_async;
          if (typeof coverData === 'string') {
            coverData = JSON.parse(coverData);
          }
          if (coverData.generate_novel_cover) {
            coverImage.value = coverData.generate_novel_cover;
            showCoverEditBtn.value = true;
          }
        } catch (e) {
          console.error('Error parsing cover data:', e);
        }
      }

      // Update outline history list from history_data
      if (detailProjectRes.data?.history_data) {
        let historyData = detailProjectRes.data.history_data;
        if (typeof historyData == 'string') {
          try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
        }
        if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
          outlineHistoryList.value = historyData.outline_novel;
        } else {
          outlineHistoryList.value = [];
        }
      }

      // Update UI states
      isGeneratingOutline.value = false;
      hasStreamData.value = true;
      isLoadingComplete.value = true;
      isLoading.value = false;

      // Reset currentChapter to show "待生成章节" section in left sidebar
      currentChapter.value = null;
      // Reset stepChapterIndex to 0 to show "待生成章节" section
      stepChapterIndex.value = 0;
      // Reset currentStepName to outline to show generate buttons
      currentStepName.value = 'outline';

      // Start polling for cover image only if not already available
      if (coverTaskId.value && !coverImage.value) {
        startCoverPolling(coverTaskId.value);
      }
    }
  } catch (error) {
    console.error('Error fetching detail project for outline:', error);
    // Fallback: show error state
    isGeneratingOutline.value = false;
    hasFailed.value = true;
  }
};

// Fetch chapter detail after chapter generation completes
const fetchChapterDetailForGeneration = async () => {
  try {
    const chapterIndex = generatingChapter.value;

    if (chapterIndex !== null) {
      const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;

      if (chapterRes.code == 200 && chapterRes.data) {
        const content = chapterRes.data.content || '';

        if (currentChapter.value && currentChapter.value.chapter === chapterIndex) {
          currentChapter.value.content = content;
        }

        const chapterIndexInArray = chapters.value.findIndex(ch => ch.chapter === chapterIndex);
        if (chapterIndexInArray !== -1) {
          chapters.value[chapterIndexInArray].content = content;
          chapters.value[chapterIndexInArray].status = 1;
        }

        updateChapterHistoryFromDetail(chapterRes);
      }
    }
  } catch (error) {
    console.error('Error fetching chapter detail:', error);
  }
};

function setSeoMeta() {
  document.title = t('seo.novelGenerate.title');

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.novelGenerate.keywords'));

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.novelGenerate.description'));
}

// Lifecycle
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  setSeoMeta();

  const routeSessionId = route.params.id as string;
  if (routeSessionId && routeSessionId !== 'undefined' && routeSessionId !== 'null') {
    sessionId.value = routeSessionId;
  }

  fetchUserInfo();
  fetchUserBalance();
  getCountry();
  await fetchNovelOutline();

  // Don't fetch points estimate here as it's already called in handleStructuredData

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('click', handleRegenerateClickOutside);
});

watch(() => locale.value, () => {
  setSeoMeta();
});

watch(() => shouldShowSimilar.value, (newVal) => {
  if (newVal) {
    fetchSimilarList(1);
  } else {
    similarList.value = [];
    similarPage.value = 1;
    similarTotalPages.value = 1;
  }
});

function handleBeforeUnload(event: BeforeUnloadEvent) {
}

onBeforeUnmount(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
  if (detailPollingInterval.value) {
    clearInterval(detailPollingInterval.value);
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }
  stopCoverPolling();
  stopCoverRenewPolling();
  stopInsertImageRenewPolling();
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('click', handleRegenerateClickOutside);
});

onBeforeRouteLeave((_to, _from, next) => {
  next();
});

// Handle visibility change - continue polling when tab becomes visible again
function handleVisibilityChange() {
  if (document.visibilityState == 'visible') {
    // When tab becomes visible again, refresh the content
    if (isLoading.value && currentChapter.value) {
      // Trigger a content refresh by re-fetching
      const chapterIndex = currentChapter.value.chapter;
      if (chapterIndex && sessionId.value) {
        // Refresh content from server
        refreshChapterContent(chapterIndex);
      }
    }
  }
}

// Refresh chapter content from server
async function refreshChapterContent(chapterIndex: number) {
  try {
    const pollingResponse = await api.taskPolling(sessionId.value) as any;
    if (pollingResponse.code == 200 && pollingResponse.data) {
      const taskData = pollingResponse.data;

      if (taskData.status == 'SUCCESS') {
        let content = '';
        if (taskData.result && taskData.result.content) {
          content = taskData.result.content;
        } else if (taskData.content) {
          content = taskData.content;
        }

        if (content) {
          currentChapter.value.content = content;
          displayedContent.value = content;
          isLoading.value = false;
          isWaitingForData.value = false;
          isChapterTyping.value = false;
          taskStatus.value = 'SUCCESS';

          if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing chapter content:', error);
  }
}

class OutlineStreamParser {
  onText: (text: string) => void;
  onComplete: (text: string, data?: any) => void;
  onError: (error: string) => void;
  t: (key: string, params?: object) => string;

  rawBuf: string = '';
  jsonBuf: string = '';
  jsonStarted: boolean = false;
  pendingText: string = '';
  pendingConsumed: number = 0;
  displayedText: string = '';
  typewriterTimer: ReturnType<typeof setInterval> | null = null;
  visibilityChangeHandler: ((() => void) | null) = null;

  parseStage: number = 0;
  parsedTitle: boolean = false;
  parsedTotalChapters: boolean = false;
  parsedWordsPerChapter: boolean = false;
  parsedGenre: boolean = false;
  parsedStyle: boolean = false;
  parsedSummary: boolean = false;
  headerWritten: boolean = false;
  charHeaderWritten: boolean = false;
  outlineHeaderWritten: boolean = false;
  parsedCharNames: Set<string> = new Set();
  parsedOutlineChapters: Set<number> = new Set();

  novelTitle: string = '';
  totalChapters: number = 0;
  abortController: AbortController | null = null;

  constructor({ onText, onComplete, onError, t }: { onText: (text: string) => void; onComplete: (text: string, data?: any) => void; onError: (error: string) => void; t: (key: string) => string }) {
    this.onText = onText;
    this.onComplete = onComplete;
    this.onError = onError;
    this.t = t;
  }

  async start(sessionId: string, token: string) {
    const url = `${aiUrl}app/stream_read/${sessionId}`;

    // Add visibility change handler
    this.visibilityChangeHandler = () => {
      if (document.visibilityState == 'visible') {
        // When tab becomes visible, immediately display all pending text
        if (this.pendingConsumed < this.pendingText.length) {
          this.pendingConsumed = this.pendingText.length;
          this.displayedText = this.pendingText;
          this.onText(this.displayedText);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    this.typewriterTimer = setInterval(() => {
      if (this.pendingConsumed >= this.pendingText.length) return;

      this.pendingConsumed++;
      this.displayedText = this.pendingText.substring(0, this.pendingConsumed);
      this.onText(this.displayedText);
    }, 30);

    try {
      this.abortController = new AbortController();

      const response = await fetch(url, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Platform': 'web',
          'token': token,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) throw new Error(`SSE connect failed: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

        if (isFirstChunk) {
          isFirstChunk = false;
          if (chunk.startsWith('data: ')) chunk = chunk.substring(6);
          else if (chunk.startsWith('data:')) chunk = chunk.substring(5);
        }

        this.rawBuf += chunk;
        this._processChunk(chunk);
      }

      this._onStreamDone();
    } catch (err: any) {
      if (err.name == 'AbortError') {
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        if (this.visibilityChangeHandler) {
          document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }
        return;
      }
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
      if (this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      }
      this.onError(err.message || 'Stream error');
    }
  }

  _processChunk(chunk: string) {
    if (!this.jsonStarted) {
      const marker = this.rawBuf.indexOf('"base_info"');
      if (marker !== -1) {
        this.jsonStarted = true;
        const jsonStart = this.rawBuf.lastIndexOf('{', marker);
        const startPos = jsonStart !== -1 ? jsonStart : marker;
        this.jsonBuf = this.rawBuf.substring(startPos);
        this._tryIncrementalParse();
      }
    } else {
      this.jsonBuf += chunk;
      this._tryIncrementalParse();
    }
  }

  _tryIncrementalParse() {
    if (this.parseStage >= 4) return;
    const s = this.jsonBuf;

    if (this.parseStage == 0) {
      if (!this.headerWritten) {
        this.pendingText += `${this.t('novel.novelOutline')}\n\n${this.t('novel.basicInfo')}\n`;
        this.headerWritten = true;
      }

      if (!this.parsedTitle) {
        const m = s.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          this.novelTitle = m[1].replace(/\\"/g, '"');
          this.parsedTitle = true;
        }
      }

      if (!this.parsedTotalChapters) {
        const m = s.match(/"total_chapters"\s*:\s*(\d+)/);
        if (m) {
          this.totalChapters = parseInt(m[1]);
          this.pendingText += `${this.t('novel.totalChapters')}${this.totalChapters} ${this.t('novel.chaptersLabel')}\n`;
          this.parsedTotalChapters = true;
        }
      }

      // Add words per chapter if available, even if total chapters already parsed
      if (!this.parsedWordsPerChapter) {
        // Try different formats for words_per_chapter
        const wordsMatch = s.match(/"words_per_chapter"\s*:\s*\[(\d+),\s*(\d+)\]/);
        if (wordsMatch) {
          const minWords = wordsMatch[1];
          const maxWords = wordsMatch[2];
          this.pendingText += `${this.t('novel.wordsPerChapter')}${minWords}-${maxWords}${this.t('novel.wordsLabel')}\n`;
          this.parsedWordsPerChapter = true;
        }
      }

      if (!this.parsedGenre) {
        const m = s.match(/"genre"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const genre = m[1].replace(/\\"/g, '"');
          if (genre) this.pendingText += `${this.t('novel.genreLabel')}${genre}\n`;
          this.parsedGenre = true;
        }
      }

      if (!this.parsedStyle) {
        const m = s.match(/"writing_style"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const style = m[1].replace(/\\"/g, '"');
          if (style) this.pendingText += `${this.t('novel.writingStyle')}：${style}\n`;
          this.pendingText += '\n';
          this.parsedStyle = true;
        }
      }

      if (s.includes('"story_summary"') || s.includes('"summary"')) {
        // Display current text for 1 second before moving to next stage
        setTimeout(() => {
          this.parseStage = 1;
        }, 1000);
      }
    }

    if (this.parseStage == 1) {
      if (!this.parsedSummary) {
        const m = s.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const summary = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          this.pendingText += `${this.t('novel.storySummary')}\n${summary}\n\n`;
          this.parsedSummary = true;
        }
      }

      if (s.includes('"characters"')) {
        // Display current text for 1 second before moving to next stage
        setTimeout(() => {
          this.parseStage = 2;
        }, 1000);
      }
    }

    if (this.parseStage == 2) {
      const charRegex = /"name"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"description"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"type"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let m;
      while ((m = charRegex.exec(s)) !== null) {
        const name = m[1].replace(/\\"/g, '"');
        if (this.parsedCharNames.has(name)) continue;
        this.parsedCharNames.add(name);

        if (!this.charHeaderWritten) {
          this.pendingText += `${this.t('novel.characterGallery')}\n`;
          this.charHeaderWritten = true;
        }
        const type = m[3].replace(/\\"/g, '"');
        const desc = m[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        if (type) this.pendingText += `${type}\n`;
        this.pendingText += `${this.t('novel.name')}：${name}\n`;
        this.pendingText += `${this.t('novel.description')}：${desc}\n\n`;
      }

      if (s.includes('"outline"')) {
        // Display current text for 1 second before moving to next stage
        setTimeout(() => {
          this.parseStage = 3;
        }, 1000);
      }
    }

    if (this.parseStage == 3) {
      if (s.includes('"power_system"')) {
        this.parseStage = 4;
        return;
      }

      const outRegex = /"chapter"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"description"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let m;
      while ((m = outRegex.exec(s)) !== null) {
        const chNum = parseInt(m[1]);
        if (this.parsedOutlineChapters.has(chNum)) continue;
        this.parsedOutlineChapters.add(chNum);

        if (!this.outlineHeaderWritten) {
          this.pendingText += `${this.t('novel.chapterPlot')}\n`;
          this.outlineHeaderWritten = true;
        }
        const chTitle = m[2].replace(/\\"/g, '"');
        const chDesc = m[3].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        this.pendingText += `${this.t('novel.chapter', { chapter: chNum })} ${chTitle}\n`;
        this.pendingText += `${chDesc}\n\n`;
      }
    }
  }

  _onStreamDone() {
    const waitTimer = setInterval(() => {
      if (this.pendingConsumed >= this.pendingText.length) {
        clearInterval(waitTimer);
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        if (this.visibilityChangeHandler) {
          document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }

        let finalText = this.pendingText.trimEnd();

        const json = this.extractJson(this.rawBuf);
        if (json && json.base_info) {
          finalText = this._formatOutlineResult(json);
          this.novelTitle = json.base_info.title || this.novelTitle;
          this.totalChapters = json.base_info.total_chapters || this.totalChapters;
        }

        this.onComplete(finalText, {
          title: this.novelTitle,
          totalChapters: this.totalChapters,
        });
      }
    }, 50);
  }

  extractJson(rawText: string): any | null {
    let start = rawText.indexOf('```json');
    if (start !== -1) {
      const jsonStart = rawText.indexOf('{', start);
      if (jsonStart !== -1) {
        const jsonEnd = rawText.lastIndexOf('}');
        if (jsonEnd > jsonStart) {
          try { return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1)); } catch (e) {}
        }
      }
    }

    start = rawText.indexOf('"base_info"');
    if (start !== -1) {
      const jsonStart = rawText.lastIndexOf('{', start);
      const jsonEnd = rawText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        try { return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1)); } catch (e) {}
      }
    }

    return null;
  }

  _formatOutlineResult(json: any): string {
    const bi = json.base_info || {};
    const ss = json.story_summary || {};
    const chars = json.characters || [];
    const outline = json.outline || [];

    let text = `${this.t('novel.novelOutline')}\n\n`;
    text += `${this.t('novel.basicInfo')}\n`;
    text += `${this.t('novel.totalChapters')}：${bi.total_chapters || 0} ${this.t('novel.chaptersLabel')}\n`;
    if (bi.words_per_chapter && bi.words_per_chapter.length == 2) {
      text += `${this.t('novel.wordsPerChapter')}${bi.words_per_chapter[0]}-${bi.words_per_chapter[1]}${this.t('novel.wordsLabel')}\n`;
    }
    if (bi.genre) text += `${this.t('novel.genreLabel')}：${bi.genre}\n`;
    if (bi.writing_style) text += `${this.t('novel.writingStyle')}：${bi.writing_style}\n`;
    text += '\n';

    if (ss.summary) {
      text += `${this.t('novel.storySummary')}\n${ss.summary}\n\n`;
    }

    if (chars.length > 0) {
      text += `${this.t('novel.characterGallery')}\n`;
      for (const c of chars) {
        if (c.type) text += `${c.type}\n`;
        text += `${this.t('novel.name')}：${c.name || ''}\n`;
        text += `${this.t('novel.description')}：${c.description || ''}\n\n`;
      }
    }

    if (outline.length > 0) {
      text += `${this.t('novel.chapterPlot')}\n`;
      for (const ch of outline) {
        text += `${this.t('novel.chapter', { chapter: ch.chapter })} ${ch.title || ''}\n`;
        text += `${ch.description || ''}\n\n`;
      }
    }

    return text.trimEnd();
  }

  destroy() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.abortController) this.abortController.abort();
  }
}

// Cover edit functions
async function handleCoverEditClick() {
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (await checkProjectOwnershipByEstimate()) return;
  await toggleCoverEdit();
}

async function handleCoverHistoryClick() {
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  if (checkProjectOwnership()) return;
  openCoverHistory();
}

async function handleOutlineHistoryClick() {
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (checkProjectOwnership()) return;
  openOutlineHistory();
}

async function openOutlineHistory() {
  outlineHistoryList.value = [];
  showOutlineHistoryModal.value = true;
  try {
    const detailRes = await api.detailProject(sessionId.value) as any;
    if (detailRes.code == 200 && detailRes.data?.history_data) {
      let historyData = detailRes.data.history_data;
      if (typeof historyData == 'string') {
        try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
      }
      if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
        outlineHistoryList.value = historyData.outline_novel;
      } else {
        outlineHistoryList.value = [];
      }
    } else {
      outlineHistoryList.value = [];
    }
  } catch (error) {
    console.error('Error fetching outline history:', error);
    outlineHistoryList.value = [];
  }
}

function closeOutlineHistoryModal() {
  showOutlineHistoryModal.value = false;
}

async function selectHistoryOutline(outlineObj: any) {
  if (checkProjectOwnership()) return;
  if (isUsingOutlineHistory.value) return;

  isUsingOutlineHistory.value = true;
  try {
    const token = localStorage.getItem('token');

    const updateData = {
      base_info: outlineObj.base_info,
      cover_prompt: outlineObj.cover_prompt || outlineData.value?.cover_prompt || '',
      story_summary: outlineObj.story_summary,
      characters: (outlineObj.characters || []).map((c: any) => ({
        name: c.name,
        description: c.description
      })),
      outline: outlineObj.outline,
      generate_mode: outlineObj.generate_mode || outlineData.value?.generate_mode || 'edit',
      cost_tokens: outlineObj.cost_tokens || outlineData.value?.cost_tokens || 0
    };

    const response = await fetch(`${aiUrl}app/project/update_outline/${sessionId.value}?is_save_history=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token || ''
      },
      body: JSON.stringify(updateData)
    });

    const res = await response.json();

    if (res.code !== 200) {
      toast(res.message || t('fail'));
      return;
    }

    outlineData.value = outlineObj;
    hasFailed.value = false;
    taskStatus.value = 'SUCCESS';
    showOutlineHistoryModal.value = false;
  } catch (error) {
    console.error('Error updating outline from history:', error);
    toast(t('fail'));
  } finally {
    isUsingOutlineHistory.value = false;
  }
}

async function handleChapterHistoryClick() {
  if (isPreparing.value || (taskStatus.value == 'DOING' && generatingChapter.value)) {
    const chapterNum = generatingChapter.value || stepChapterIndex.value;
    toast(t('novel.generatingChapterTip', { chapter: chapterNum }));
    return;
  }
  if (checkProjectOwnership()) return;

  chapterHistoryList.value = [];
  showChapterHistoryModal.value = true;

  try {
    const chapterRes = await api.detailChapter(sessionId.value, currentChapter.value?.chapter) as any;
    if (chapterRes.code == 200) {
      updateChapterHistoryFromDetail(chapterRes);
    }
  } catch (error) {
    console.error('Error fetching chapter history:', error);
    chapterHistoryList.value = [];
    chapterHistoryCount.value = 0;
  }
}

async function selectHistoryChapter(chapterObj: any) {
  if (checkProjectOwnership()) return;
  if (isUsingChapterHistory.value) return;
  if (currentChapter.value) {
    isUsingChapterHistory.value = true;
    try {
      const token = localStorage.getItem('token');

      const updateData = {
        chapter: currentChapter.value.chapter,
        title: chapterObj.title || currentChapter.value.title,
        content: chapterObj.content || ''
      };

      const response = await fetch(`${aiUrl}app/project/update_chapter/${sessionId.value}?is_save_history=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Platform': 'web',
          'token': token || ''
        },
        body: JSON.stringify(updateData)
      });

      const res = await response.json();

      if (res.code !== 200) {
        toast(res.message || t('fail'));
        return;
      }

      currentChapter.value.content = chapterObj.content || '';
      currentChapter.value.title = chapterObj.title || currentChapter.value.title;
      displayedContent.value = chapterObj.content || '';
    } catch (error) {
      console.error('Error updating chapter from history:', error);
      toast(t('fail'));
      return;
    } finally {
      isUsingChapterHistory.value = false;
    }
  }
  showChapterHistoryModal.value = false;
}

const startAiEditChapter = async () => {
  if (coverRenewFailed.value) {
    toast(t('novel.coverRenewFailedTip'));
    return;
  }
  if (coverRenewLoading.value) {
    toast(t('novel.coverRenewLoadingTip'));
    return;
  }
  if (renewingInsertImagePlaceholder.value != null) {
    toast(t('novel.insertImageRenewLoadingTip', { chapter: renewingInsertImageChapter.value }));
    return;
  }
  const chapterEstimateRes = await api.novelEstimate({
    session_id: sessionId.value,
    step_name: 'chapter'
  }) as any;
  if (chapterEstimateRes.code == 10404) {
    toast(t('novel.error.cannotOperateOtherUserProject'));
    return;
  }
  hideEdit();
  isAiEditingChapter.value = true;
  aiEditChapterInput.value = '';
  if (chapterEstimateRes.code == 200 && chapterEstimateRes.data?.total_points) {
    chapterEditCost.value = chapterEstimateRes.data.total_points;
  } else {
    chapterEditCost.value = regenerateCost.value;
  }
  nextTick(() => {
    const textarea = chapterEditSectionRef.value?.querySelector('.outline-edit-textarea');
    if (textarea) (textarea as HTMLTextAreaElement).focus();
  });
};

const cancelAiEditChapter = () => {
  isAiEditingChapter.value = false;
  aiEditChapterInput.value = '';
};

const handleAiEditChapterInput = () => {
  const maxLimit = 20000;
  if (aiEditChapterInput.value.length > maxLimit) {
    aiEditChapterInput.value = aiEditChapterInput.value.substring(0, maxLimit);
  }
};

const sendAiEditChapterRequest = async () => {
  if (isSendingChapterEdit.value) return;
  isSendingChapterEdit.value = true;

  if (!aiEditChapterInput.value?.trim()) {
    toast(t('novel.error.emptyRegenerateContent'));
    isSendingChapterEdit.value = false;
    return;
  }

  try {
    if (await isTaskLimitExceeded()) {
      isSendingChapterEdit.value = false;
      return;
    }

    const editChapterIndex = currentChapter.value?.chapter;

    const estimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'chapter',
      from_chapter: editChapterIndex
    }) as any;

    if (estimateRes.code == 10404) {
      toast(t('novel.error.cannotOperateOtherUserProject'));
      isSendingChapterEdit.value = false;
      return;
    }

    if (estimateRes.code == 200 && estimateRes.data?.total_points) {
      const estimatedPoints = estimateRes.data.total_points;
      estimatedComputingPower.value = estimatedPoints;
      await fetchUserBalance();
      const requiredPower = Math.round(estimatedPoints * 1.05);
      if (userBalance.value < requiredPower) {
        estimatedFrozenPower.value = Math.round(estimatedPoints * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        isSendingChapterEdit.value = false;
        return;
      }
    }

    const editPrompt = aiEditChapterInput.value.trim();

    stopDetailPolling();

    isUserInitiatedGeneration.value = true;
    shouldShowTypewriter.value = true;
    shouldAutoNavigate.value = false;
    isRetryingChapter.value = false;

    const novelNextParams: any = {
      session_id: sessionId.value,
      chapter: editChapterIndex,
      generate_mode: 'edit',
      prompt: editPrompt
    };

    const novelNextRes = await api.novelNext(novelNextParams) as any;

    if (novelNextRes.code !== 200) {
      if (handleSessionTimeout(novelNextRes.code)) {
        return;
      }
      if (novelNextRes.code == 40011) {
        await fetchUserBalance();
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        return;
      }
      toast(novelNextRes.message || t('fail'));
      isSendingChapterEdit.value = false;
      return;
    }

    isAiEditingChapter.value = false;
    aiEditChapterInput.value = '';

    hideEdit();

    const nextChapterData = outlineData.value?.outline?.find((c: any) => c.chapter == editChapterIndex);

    displayedContent.value = '';
    pendingDisplayContent.value = '';
    isLoadingComplete.value = false;
    isLoading.value = true;

    startLoadingAnimation('chapter', true);
    hasFailed.value = false;
    taskStatus.value = 'DOING';
    lastGenerationType.value = 'chapter';
    isGeneratingOutline.value = false;
    isChapterTyping.value = false;
    generatingChapter.value = editChapterIndex;
    stepChapterIndex.value = editChapterIndex;
    currentStepName.value = 'chapter';

    const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
    if (hideFreezeModal !== '1') {
      const detailRes = await api.detailProject(sessionId.value) as any;
      if (detailRes.code == 200 && detailRes.data?.frozen_points !== undefined) {
        freezeComputingPower.value = detailRes.data.frozen_points;
        pendingGenerationAction.value = 'edit-chapter';
        showFreezeComputingPowerModal.value = true;
      }
    }

    const taskId = novelNextRes.data?.task_id || '';

    if (novelNextRes.time) {
      const startTimestamp = parseToUnixTimestamp(novelNextRes.time);
      if (startTimestamp) {
        startTime.value = startTimestamp * 1000;
      } else {
        startTime.value = Date.now();
      }
    } else {
      startTime.value = Date.now();
    }

    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    fetchEstimatedTime();

    await fetchUserBalance();

    await fetchChapterStream(editChapterIndex, taskId);

    if (!hasFailed.value) {
      await fetchPointsEstimate();
    }
  } catch (error) {
    console.error('Error sending AI edit chapter request:', error);
    toast(t('fail'));
  } finally {
    isSendingChapterEdit.value = false;
  }
};

async function toggleCoverEdit() {
  if (coverRenewFailed.value) {
    coverRenewFailed.value = false;
    isEditingCover.value = true;
  } else {
    isEditingCover.value = !isEditingCover.value;
  }

  if (isEditingCover.value) {
    combinedCoverItems.value = [];
    uploadedCoverImages.value = [];
    coverInputKey.value++;

    if (!hasFailed.value) {
      await fetchPointsEstimate(true);
    }

    nextTick(() => {
      if (coverInputRef.value) {
        coverInputRef.value.focus();
      }
    });
  }
}



function getCoverInputCharCount(element: HTMLElement): number {
  let charCount = 0;
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        charCount += (node.textContent || '').length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute('contenteditable') && el.contentEditable === 'false') {
        charCount += 7;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNodes(node.childNodes[i]);
        }
      }
    }
  };
  walkNodes(element);
  return charCount;
}

function handleRegenerateInput() {
  const maxLimit = 20000;
  if (regenerateContent.value.length > maxLimit) {
    regenerateContent.value = regenerateContent.value.substring(0, maxLimit);
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
  }
}

function handleCoverInput() {
  if (!coverInputRef.value) return;

  const target = coverInputRef.value;

  const maxLimit = 5000;
  const currentCharCount = getCoverInputCharCount(target);
  if (currentCharCount > maxLimit) {
    target.innerHTML = previousCoverInputHtml.value;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }
  previousCoverInputHtml.value = target.innerHTML;

  // 计算实际的文本内容，排除非可编辑标签中的文本（参考 Home.vue）
  let actualText = '';
  const textNodes = Array.from(target.childNodes).filter(node => {
    if (node.nodeType === 3) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      return !isInNonEditable;
    }
    return false;
  });
  textNodes.forEach(node => {
    actualText += node.textContent || '';
  });

  const cursorPosition = getCoverCursorPosition(target);
  const textBeforeCursor = actualText.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  const hasItems = combinedCoverItems.value.length > 0;

  if (atIndex !== -1 &&
      atIndex === textBeforeCursor.length - 1 &&
      hasItems) {

    showCoverAtDropdown.value = true;
    coverAtDropdownItems.value = combinedCoverItems.value;

    // Calculate dropdown position based on @ symbol position（参考 Home.vue）
    nextTick(() => {
      try {
        if (coverInputRef.value) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) {
                if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
                  return false;
                }

                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) {
                if (node.nodeType === 1 && (node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
                  return false;
                }

                for (let i = 0; i < node.childNodes.length; i++) {
                  if (findAtSymbol(node.childNodes[i])) {
                    return true;
                  }
                }
              }
              return false;
            };

            findAtSymbol(coverInputRef.value);

            if (foundAtNode) {
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = coverInputRef.value.parentElement;
              const dropdown = document.querySelector('.cover-edit-section .at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.left = `${relativeLeft}px`;

                const dropdownHeight = dropdown.offsetHeight || 200;
                const availableBottomSpace = window.innerHeight - rect.bottom;

                if (availableBottomSpace < dropdownHeight) {
                  dropdown.style.top = `${relativeTop - dropdownHeight - rect.height - 5}px`;
                  dropdown.style.bottom = 'auto';
                } else {
                  dropdown.style.top = `${relativeTop + 5}px`;
                  dropdown.style.bottom = 'auto';
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error positioning dropdown:', error);
      }
    });
  } else {
    showCoverAtDropdown.value = false;
  }
}

// Get cursor position（参考 Home.vue 的 getCursorPosition）
function getCoverCursorPosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);

  return preRange.toString().length;
}

function handleCoverKeydown(event: KeyboardEvent) {
  if (isCoverComposing.value) return;

  if (event.key == "Escape") {
    showCoverAtDropdown.value = false;
  } else if (event.key == "Enter") {
    if (event.shiftKey) {
      event.preventDefault();
      document.execCommand('insertLineBreak');
    }
  }

  const maxLimit = 5000;
  if (coverInputRef.value) {
    const currentCharCount = getCoverInputCharCount(coverInputRef.value);
    if (currentCharCount >= maxLimit && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
      return;
    }
  }
}

function handleCoverInputClick() {
  if (coverInputRef.value) {
    const target = coverInputRef.value;
    const text = target.textContent || '';
    const cursorPosition = getCoverCursorPosition(target);
    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const hasItems = combinedCoverItems.value.length > 0;

    if (atIndex !== -1 &&
        atIndex === textBeforeCursor.length - 1 &&
        hasItems) {
      showCoverAtDropdown.value = true;
      coverAtDropdownItems.value = combinedCoverItems.value;

      nextTick(() => {
        try {
          if (coverInputRef.value) {
            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) {
                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) {
                for (let i = 0; i < node.childNodes.length; i++) {
                  if (findAtSymbol(node.childNodes[i])) {
                    return true;
                  }
                }
              }
              return false;
            };

            findAtSymbol(coverInputRef.value);

            if (foundAtNode) {
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = coverInputRef.value.parentElement;
              const dropdown = document.querySelector('.cover-edit-section .at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.left = `${relativeLeft}px`;

                const dropdownHeight = dropdown.offsetHeight || 200;
                const availableBottomSpace = window.innerHeight - rect.bottom;

                if (availableBottomSpace < dropdownHeight) {
                  dropdown.style.top = `${relativeTop - dropdownHeight - rect.height - 5}px`;
                  dropdown.style.bottom = 'auto';
                } else {
                  dropdown.style.top = `${relativeTop + 5}px`;
                  dropdown.style.bottom = 'auto';
                }
              }
            }
          }
        } catch (error) {
          console.error('Error positioning dropdown:', error);
        }
      });
    }
  }
}

function handleCoverInputBlur() {
  setTimeout(() => {
    showCoverAtDropdown.value = false;
  }, 200);
}

function handleCoverPaste(event: ClipboardEvent) {
  event.preventDefault();

  if (!coverInputRef.value) return;

  const maxLimit = 5000;
  const currentCharCount = getCoverInputCharCount(coverInputRef.value);
  const text = event.clipboardData?.getData('text/plain') || '';

  if (currentCharCount + text.length > maxLimit) {
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  document.execCommand('insertText', false, text);
  nextTick(() => {
    const el = coverInputRef.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
      previousCoverInputHtml.value = el.innerHTML;
    }
  });
}

function handleCoverInputFocus() {
  if (coverInputRef.value) {
    previousCoverInputHtml.value = coverInputRef.value.innerHTML;
  }
}

// Upload image to server
async function uploadCoverImage(file: File): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return '';
  }

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

  const res = await fetch(`${baseUrl}user/uploadImage`, parma);
  const data = await res.json();
  if (data.code == 0 || data.code == 200) {
    return data.data.url || '';
  } else {
    throw new Error(data.msg);
  }
}

// Handle cover file change
async function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length == 0) return;

  const file = files[0];

  // Determine limits based on mode
  // Default to normal mode limits if mode is not available
  // Unlimited (NSFW) mode is determined from the current project settings
  const isUnlimitedMode = userSelectedSettings.value?.story_mode === 'nsfw';
  const maxImages = isUnlimitedMode ? 3 : 7;
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Check maximum count limit
  if (uploadedCoverImages.value.length >= maxImages) {
    toast(t('novel.maxCoverImages', { max: maxImages }));
    input.value = '';
    return;
  }

  // Check file type
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    toast(t('novel.invalidCoverImageType'));
    input.value = '';
    return;
  }

  // Check file size limit
  if (file.size > maxSizeBytes) {
    toast(t('novel.maxCoverSize', { max: maxSizeMB }));
    input.value = '';
    return;
  }

  isUploading.value = true;

  // Check if image is corrupted
  const imageCorrupted = await new Promise<boolean>((resolve) => {
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

  if (imageCorrupted) {
    toast(t('home.error.corruptedImage'));
    input.value = '';
    isUploading.value = false;
    return;
  }

  try {
    const uploadedUrl = await uploadCoverImage(file);
    const imageId = Date.now();
    const newImage = {
      id: imageId,
      image: uploadedUrl,
      file: file,
      name: `img${uploadedCoverImages.value.length + 1}`
    };
    uploadedCoverImages.value.push(newImage);
    combinedCoverItems.value.push({
      id: imageId,
      type: 'image',
      image: uploadedUrl,
      name: newImage.name
    });
    // Update dropdown items immediately after upload
    updateCoverAtDropdownItems();
  } catch (error) {
    console.error('Upload error for file', error);
    toast(t('fail'));
  } finally {
    isUploading.value = false;
  }

  // Reset input
  input.value = '';
}

function triggerCoverFileUpload() {
  coverFileInputRef.value?.click();
}

function removeUploadedCoverImage(imageId: number) {
  // Remove from arrays
  uploadedCoverImages.value = uploadedCoverImages.value.filter(img => img.id !== imageId);
  combinedCoverItems.value = combinedCoverItems.value.filter(item => item.id !== imageId);

  // Remove all corresponding tags from the input editor
  if (coverInputRef.value) {
    const tagElements = coverInputRef.value.querySelectorAll(`span.image-tag[data-item-id="${imageId}"]`);
    tagElements.forEach((tagElement) => {
      // Also remove the following space if exists
      const nextSibling = tagElement.nextSibling;
      if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent?.trim() === '') {
        tagElement.parentElement?.removeChild(nextSibling);
      }
      tagElement.parentElement?.removeChild(tagElement);
    });
  }
}

function selectCoverAtItem(item: any) {
  if (!coverInputRef.value) return;

  const target = coverInputRef.value;
  const savedHtml = target.innerHTML;

  if (target.textContent?.trim() === '') {
    target.innerHTML = '';
  }

  // Create image tag - cover editing only supports images
  const itemTag = document.createElement('span');
  itemTag.className = 'image-tag';
  itemTag.contentEditable = 'false';
  itemTag.dataset.itemId = String(item.id);

  // Create image element
  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.name;
  img.className = 'image-tag-img';
  itemTag.appendChild(img);

  // Create text node with label
  const imageIndex = uploadedCoverImages.value.findIndex(imgItem => imgItem.id === item.id) + 1;
  const labelText = `${t('home.img')}${imageIndex}`;
  const textNode = document.createTextNode(labelText);
  itemTag.appendChild(textNode);

  // Find @ symbol before cursor
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.appendChild(itemTag);
    target.appendChild(document.createTextNode(' '));
    target.focus();
    showCoverAtDropdown.value = false;
    return;
  }

  const range = selection.getRangeAt(0);
  const cursorPos = getCoverCursorPosition(target);

  let atNode: Node | null = null;
  let atOffset = 0;
  let currentCharPos = 0;

  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }

      if (!isInNonEditable) {
        const text = node.textContent || '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '@' && currentCharPos + i <= cursorPos) {
            atNode = node;
            atOffset = i;
          }
        }
        currentCharPos += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        walkNodes(node.childNodes[i]);
      }
    }
  };

  walkNodes(target);

  // Replace @ symbol with tag
  if (atNode) {
    const atRange = document.createRange();
    atRange.setStart(atNode, atOffset);
    atRange.setEnd(range.endContainer, range.endOffset);
    atRange.deleteContents();

    atRange.insertNode(itemTag);

    // Insert space after
    const space = document.createTextNode(' ');
    const newRange = document.createRange();
    newRange.setStartAfter(itemTag);
    newRange.insertNode(space);
    newRange.setStartAfter(space);
    newRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(newRange);
  } else {
    range.insertNode(itemTag);

    const space = document.createTextNode(' ');
    const newRange = document.createRange();
    newRange.setStartAfter(itemTag);
    newRange.insertNode(space);
    newRange.setStartAfter(space);
    newRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  showCoverAtDropdown.value = false;
  coverInputRef.value.focus();

  const maxLimit = 5000;
  if (getCoverInputCharCount(coverInputRef.value) > maxLimit) {
    coverInputRef.value.innerHTML = savedHtml;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  previousCoverInputHtml.value = coverInputRef.value.innerHTML;
}

function updateCoverAtDropdownItems() {
  coverAtDropdownItems.value = combinedCoverItems.value;
}

function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

function checkCoverItemLimit() {
  // Unlimited (NSFW) mode is determined from the current project settings
  const isUnlimitedMode = userSelectedSettings.value?.story_mode === 'nsfw';
  const maxImages = isUnlimitedMode ? 3 : 7;
  if (combinedCoverItems.value.length >= maxImages) {
    toast(t('novel.maxCoverImages', { max: maxImages }));
    return false;
  }
  return true;
}

// Process prompt to replace image spans with <ref_X> format
function processCoverPrompt() {
  if (!coverInputRef.value) return '';

  // Get all span elements with class 'image-tag' (image tags)
  const spans = coverInputRef.value.querySelectorAll('span.image-tag');
  let prompt = coverInputRef.value.innerText || coverInputRef.value.textContent || "";

  // Replace each span with <ref_X> format based on actual image order
  spans.forEach((span) => {
    const itemId = span.getAttribute('data-item-id');
    if (itemId) {
      const imageIndex = uploadedCoverImages.value.findIndex(img => img.id === parseInt(itemId));
      if (imageIndex !== -1) {
        prompt = prompt.replace(span.textContent || '', `<ref_${imageIndex + 1}>`);
      }
    }
  });

  // Remove newline characters
  prompt = prompt.replace(/\n/g, '');

  return prompt.trim();
}

// Zoom cover image
function zoomCoverImage(imageUrl: string) {
  // Close the insert image edit box when opening the large-image view,
  // so it does not reappear after the zoom modal is closed
  if (showInsertImageEdit.value) {
    cancelInsertImageEdit();
  }
  zoomedCoverImage.value = imageUrl;
  showCoverZoomModal.value = true;
}

function closeCoverZoomModal() {
  showCoverZoomModal.value = false;
  zoomedCoverImage.value = '';
}

async function openCoverHistory() {
  try {
    const detailRes = await api.detailProject(sessionId.value) as any;
    if (detailRes.code == 200 && detailRes.data?.history_data) {
      let historyData = detailRes.data.history_data;
      if (typeof historyData == 'string') {
        try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
      }
      if (historyData?.novel_cover && Array.isArray(historyData.novel_cover)) {
        coverHistoryList.value = historyData.novel_cover;
      } else {
        coverHistoryList.value = [];
      }
      if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
        outlineHistoryList.value = historyData.outline_novel;
      } else {
        outlineHistoryList.value = [];
      }
    } else {
      coverHistoryList.value = [];
      outlineHistoryList.value = [];
    }
  } catch (error) {
    console.error('Error fetching cover history:', error);
    coverHistoryList.value = [];
  }
  showCoverHistoryModal.value = true;
  isEditingCover.value = false;
}

function closeCoverHistoryModal() {
  showCoverHistoryModal.value = false;
}

async function selectHistoryCover(coverUrl: string) {
  if (checkProjectOwnership()) return;
  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${aiUrl}ai/novel/replace_novel_cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        cover_url: coverUrl
      })
    });
    const res = await response.json();
    if (res.code == 200) {
      coverImage.value = coverUrl;
      showCoverHistoryModal.value = false;
    } else {
      toast(res.message);
    }
  } catch (e) {
    console.error('Error replacing cover:', e);
    toast(t('fail'));
  }
}

async function usePreviousCover() {
  try {
    const detailRes = await api.detailProject(sessionId.value) as any;
    let prevCover = '';

    if (detailRes.code == 200 && detailRes.data?.history_data) {
      let historyData = detailRes.data.history_data;
      if (typeof historyData == 'string') {
        try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
      }
      if (historyData?.novel_cover && Array.isArray(historyData.novel_cover) && historyData.novel_cover.length > 0) {
        prevCover = historyData.novel_cover[historyData.novel_cover.length - 1];
      }
    }

    if (!prevCover && detailRes.code == 200 && detailRes.data?.result_async) {
      let result = detailRes.data.result_async;
      if (typeof result == 'string') {
        try { result = JSON.parse(result); } catch (e) { result = null; }
      }
      prevCover = result?.generate_novel_cover || '';
    }

    if (prevCover) {
      const token = localStorage.getItem('token') || '';
      const replaceRes = await fetch(`${aiUrl}ai/novel/replace_novel_cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Platform': 'web',
          'token': token
        },
        body: JSON.stringify({
          session_id: sessionId.value,
          cover_url: prevCover
        })
      });
      const replaceData = await replaceRes.json();
      if (replaceData.code == 200) {
        coverImage.value = prevCover;
        coverRenewFailed.value = false;
        showCoverEditBtn.value = true;
      } else {
        toast(replaceData.message || t('fail'));
      }
    }
  } catch (e) {
    console.error('Error fetching previous cover:', e);
  }
}

async function generateNovelCover() {
  if (!coverInputRef.value) return;

  const prompt = processCoverPrompt();
  if (!prompt) {
    toast(t('novel.coverInputEmpty'));
    return;
  }

  doGenerateNovelCover();
}

const startCoverRenewPolling = (taskId: string) => {
  coverRenewTaskId.value = taskId;
  coverRenewLoading.value = true;
  coverRenewFailed.value = false;

  const poll = async () => {
    try {
      const res = await api.taskPolling(taskId) as any;

      if (handleSessionTimeout(res.code) || res.code == 401) {
        stopCoverRenewPolling();
        return;
      }

      if (res.code == 200 && res.data?.status == 'SUCCESS') {
        const newCoverUrl = res.data.result?.cover_url || res.data.result?.generate_novel_cover || res.data.result?.renew_novel_cover || '';
        if (newCoverUrl) {
          coverImage.value = newCoverUrl;
        }
        coverRenewLoading.value = false;
        coverRenewFailed.value = false;
        showCoverEditBtn.value = true;

        // Update cover history list after successful renewal
        try {
          const detailRes = await api.detailProject(sessionId.value) as any;
          if (detailRes.code == 200 && detailRes.data?.history_data) {
            let historyData = detailRes.data.history_data;
            if (typeof historyData == 'string') {
              try { historyData = JSON.parse(historyData); } catch (e) { historyData = null; }
            }
      if (historyData?.novel_cover && Array.isArray(historyData.novel_cover)) {
        coverHistoryList.value = historyData.novel_cover;
      }
      if (historyData?.outline_novel && Array.isArray(historyData.outline_novel)) {
        outlineHistoryList.value = historyData.outline_novel;
      }
          }
        } catch (e) {
          console.error('Error updating cover history:', e);
        }

        await fetchUserBalance();
        stopCoverRenewPolling();
      } else if (res.data?.status == 'FAIL') {
        coverRenewLoading.value = false;
        coverRenewFailed.value = true;
        showCoverEditBtn.value = false;
        hasFailed.value = false;
        taskStatus.value = 'SUCCESS';
        await fetchUserBalance();
        stopCoverRenewPolling();
      }
    } catch (error) {
      console.error('Error polling cover renew:', error);
      coverRenewLoading.value = false;
      coverRenewFailed.value = true;
      showCoverEditBtn.value = false;
      hasFailed.value = false;
      taskStatus.value = 'SUCCESS';
      stopCoverRenewPolling();
    }
  };

  poll();
  coverRenewPollTimer.value = window.setInterval(poll, 3000);
};

const stopCoverRenewPolling = () => {
  if (coverRenewPollTimer.value) {
    clearInterval(coverRenewPollTimer.value);
    coverRenewPollTimer.value = null;
  }
  coverRenewTaskId.value = '';
};

async function doGenerateNovelCover() {
  isCoverSendClicked.value = true;

  if (!coverInputRef.value) return;

  const prompt = processCoverPrompt();
  if (!prompt) {
    toast(t('novel.coverInputEmpty'));
    return;
  }

  try {
    // if (!await checkServerStateSync('SUCCESS')) return;
    if (await isTaskLimitExceeded()) return;

    const newReferenceImages = uploadedCoverImages.value.map(img => img.image);

    isEditingCover.value = false;
    coverRenewLoading.value = true;
    coverRenewFailed.value = false;
    showCoverEditBtn.value = false;

    coverAbortController.value = new AbortController();
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${aiUrl}ai/novel/renew_novel_cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        prompt: prompt,
        new_reference_images: newReferenceImages
      }),
      signal: coverAbortController.value.signal
    });

    const res = await response.json();

    if (res.code == 200) {
      const taskId = res.data?.task_id || '';

      await fetchUserBalance();

      const hideFreezeModal = localStorage.getItem('hideFreezeComputingPowerModal');
      if (hideFreezeModal !== '1') {
        freezeComputingPower.value = Math.round(coverCost.value * (balanceInfo.value?.over_freeze_rate || 1));
        showFreezeComputingPowerModal.value = true;
      }

      if (taskId) {
        startCoverRenewPolling(taskId);
      }
    } else {
      if (res.code == 40011) {
        await fetchUserBalance();
        estimatedFrozenPower.value = Math.round(estimatedComputingPower.value * (balanceInfo.value?.over_freeze_rate || 1));
        showInsufficientBalanceModal.value = true;
        coverRenewLoading.value = false;
        showCoverEditBtn.value = true;
        return;
      }
      if (res.code == 10407) {
        toast(t('novel.error.staleOperation'));
        coverRenewLoading.value = false;
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }
      coverRenewLoading.value = false;
      coverRenewFailed.value = true;
      toast(res.message);
    }
  } catch (error: any) {
    if (error.name == 'AbortError') return;
    console.error('Error generating cover:', error);
    coverRenewLoading.value = false;
    coverRenewFailed.value = true;
    toast(t('novel.coverGenerateFailed'));
  } finally {
    coverAbortController.value = null;
  }

  nextTick(() => {
    isCoverSendClicked.value = false;
  });
}
</script>

<style scoped lang="scss">
  @use '@/scss/NovelGenerate.scss';
</style>
