<template>
  <div class="novel-generate-page">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Logo -->
      <div class="logo" @click="goHome()">
        <img src="@/assets/images/novel/logo.png" alt="Logo" />
      </div>

      <!-- Navigation -->
      <div class="nav-item" @click="goHome()">
        <img src="@/assets/images/novel/home.png" alt="Home" />
        <span>{{ t("header.title1") }}</span>
      </div>

      <!-- User Avatar -->
      <div class="user-avatar" @click="goUser()">
        <img :src="userInfo?.info?.avatar" alt="Avatar" />
      </div>
    </div>

    <!-- Left Area -->
    <div class="left-area">
      <!-- Project Name with Edit Icon -->
      <div class="project-name-section">
        <div class="project-name">
          <span v-if="!isEditingName" class="project-name-display">{{ projectName || t('novel.untitled') }}</span>
          <div v-else class="project-name-edit-container">
            <div class="project-name-input-wrapper">
              <input type="text" v-model="projectName" class="project-name-input" ref="projectNameInputRef" spellcheck="false" @input="projectName = projectName.substring(0, 30)" maxlength="30" />
              <span class="project-name-counter">{{ projectName.length }}/30</span>
            </div>
            <div class="edit-actions">
              <img class="save-icon" src="@/assets/images/novel/check.png" alt="Save" @click="saveProjectName" />
              <img class="cancel-icon" src="@/assets/images/novel/cancel.png" alt="Cancel" @click="cancelEditProjectName" />
            </div>
          </div>
          <img v-if="!isEditingName" class="edit-icon" src="@/assets/images/novel/edit.png" alt="Edit" @click="startEditProjectName" />
        </div>
      </div>

      <div class="left-content">
        <div class="scrollable-content">
          <!-- Generation Status -->
          <div v-if="taskStatus == 'DOING' && shouldShowEstimatedTime && !hasFailed && !outlineContent" class="generation-status">
            <span class="status-text">{{ t('novel.generatingStatus') }}</span>
            <button class="similar-content-btn" @click="goToSimilar()">{{ t('novel.similarContent') }}</button>
          </div>

          <!-- Generation Status / Progress / Chapters -->
          <div v-if="taskStatus == 'DOING'" class="progress-section">
            <div class="progress-item" v-if="queueInfo">
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time">
                  {{ t('novel.queueInfo', { count: queueInfo.count, estimatedTime: queueInfo.estimatedTime }) }}
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

            <div class="progress-item" v-if="generatingChapter">
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time">
                  {{ t('novel.estimatedMinutes', { minutes: displayMinutes }) }}
                </span>
              </div>

              <div class="progress-content">
                <span class="progress-label">{{ t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot on" src="@/assets/images/novel/load.png" alt="Loading" />
                  <span class="status-text">{{ queueInfo ? t('novel.waiting') : t('novel.generating') }}</span>
                </div>
              </div>
            </div>

            <div class="progress-item" v-else>
              <div class="progress-info">
                <span class="progress-label">{{ t('novel.generationProgress') }}</span>
                <span class="progress-time">
                  {{ t('novel.estimatedMinutes', { minutes: displayMinutes }) }}
                </span>
              </div>

              <div class="progress-content">
                <span class="progress-label">{{ currentStepName === 'outline' ? t('novel.novelOutline') : t('novel.newChapter') }}</span>
                <div class="progress-status">
                  <img class="status-dot on" src="@/assets/images/novel/load.png" alt="Loading" />
                  <span class="status-text">{{ queueInfo ? t('novel.waiting') : t('novel.generating') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="taskStatus === 'FAIL'" class="progress-section">
            <div class="progress-info">
              <span class="progress-label">{{ t('novel.generationProgress') }}</span>
              <span class="progress-time">
                {{ t('novel.generationTerminated') }}
              </span>
            </div>

            <div class="progress-content">
              <span class="progress-label">{{ currentStepName == 'outline' || lastGenerationType == 'outline' ? t('novel.novelOutline') : t('novel.newChapter') }}</span>
              <div class="progress-status">
                <img class="status-dot" src="@/assets/images/novel/fail_icon.png" alt="Error" />
                <span class="status-text">{{ t('novel.generationFailed') }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="outlineData && taskStatus === 'SUCCESS' && chapterCount > stepChapterIndex" class="text-wrapper-1">
            <span class="text_3">{{ t('novel.chaptersToGenerate', { count: chapterCount - stepChapterIndex }) }}</span>
            <span class="text_4" @click="callNovelAllChapters">{{ t('novel.generateAllChapters') }}</span>
          </div>

          <!-- Novel Outline Preview -->
          <div
            class="outline-preview"
            @click="handleOutlinePreviewClick"
            :class="{ 'disabled': !outlineData || !outlineData.outline, 'active': !currentChapter }"
            :disabled="!outlineData || !outlineData.outline"
          >
            <span class="preview-title">{{ t('novel.novelOutline') }}</span>
          </div>

          <!-- Chapter List -->
          <div v-if="chapters.length > 0" class="chapter-list">
            <div
              v-for="chapter in chapters"
              :key="chapter.id"
              class="chapter-item"
              :class="{ 'on': currentChapter && currentChapter.chapter === chapter.chapter, 'published': chapter.is_publish !== 2 }"
              @click="handleChapterItemClick(chapter.chapter)"
            >
              <div v-if="!editingChapterId || editingChapterId !== chapter.chapter" class="chapter-item-content">
                <span class="chapter-item-label">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                <span class="chapter-item-title">{{ chapter.title }}</span>
                <span
                  v-if="chapter.is_publish == 2"
                  class="chapter-publish-btn unpublish"
                  @click.stop="handlePublishChapter(chapter)"
                >{{ t('novel.publish') }}</span>
                <span
                  v-else
                  class="chapter-publish-btn published"
                >{{ t('novel.published') }}</span>
                <img
                  v-if="chapter.is_publish == 2"
                  class="edit-chapter-btn"
                  src="@/assets/images/novel/edit.png"
                  alt="Edit"
                  @click.stop="startEditChapterTitle(chapter.chapter, chapter.title)"
                />
              </div>
              <div v-else class="chapter-title-edit">
                <div class="chapter-edit-content">
                  <span class="chapter-item-label">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                  <input
                    type="text"
                    v-model="editingChapterTitle"
                    class="chapter-title-input"
                    @input="editingChapterTitle = editingChapterTitle.substring(0, 30)"
                    @blur="handleChapterTitleBlur"
                    :maxlength="30"
                    :ref="el => chapterTitleInputs[chapter.chapter] = el"
                  />
                  <span class="chapter-title-counter">{{ editingChapterTitle.length }}/30</span>
                </div>
                <div class="chapter-edit-actions">
                  <img
                    class="edit-action-btn"
                    src="@/assets/images/novel/check.png"
                    alt="Save"
                    @mousedown.prevent="saveChapterTitle(chapter.chapter)"
                  />
                  <img
                    class="edit-action-btn"
                    src="@/assets/images/novel/cancel.png"
                    alt="Cancel"
                    @mousedown.prevent="cancelChapterTitle"
                  />
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
            <textarea v-model="regenerateContent" class="regenerate-textarea" :placeholder="t('novel.outlinePlaceholder')"></textarea>

            <div class="regenerate-footer">
              <div class="regenerate-settings">
                <!-- Word Count Selector -->
                <div class="novel-selector" @click="toggleWordCountDropdown" :class="{ open: showWordCountDropdown }">
                  <div class="selector-header">
                    <span>{{ t('novel.totalWords') }} : {{ selectedWordCount }}</span>
                    <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
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
                <div class="novel-selector" @click="toggleLanguageDropdown" :class="{ open: showLanguageDropdown }">
                  <div class="selector-header">
                    <span>{{ selectedLanguageLabel }}</span>
                    <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
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
              </div>

              <div class="regenerate-action-buttons">
                <!-- <div class="regenerate-cost-display">
                  <span class="regenerate-cost">{{ regenerateCost }}</span>
                  <img src="@/assets/images/novel/coin.png" alt="" />
                </div> -->
                <div class="send-btn" @click="sendRegenerateRequest">
                  <img src="@/assets/images/novel/send.png" alt="" />
                </div>
              </div>
            </div>
          </div>


        </div>

        <!-- Cover Edit Section - Fixed at bottom -->
        <div v-if="isEditingCover" class="cover-edit-section" ref="coverEditSectionRef">
          <div v-if="!isGeneratingCover && !showCoverResult">
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

                      <div class="image-box">
                        <img :src="item.image" :alt="item.name" class="uploaded-image" />
                        <span class="img-bg"></span>
                      </div>

                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removeUploadedCoverImage(item.id)" />
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
                    multiple
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
                      <span v-if="item.type === 'character'">{{ item.name }}</span>
                      <span v-else>{{ t('home.img') }}{{ uploadedCoverImages.findIndex(img => img.id == item.id) + 1 }}</span>
                    </div>
                  </div>

                  <div class="input-box">
                    <div class="input-options">
                      <div class="option-btn reference-btn" @click="() => { if (checkLogin() && checkCoverItemLimit()) triggerCoverFileUpload() }">
                        <img src="@/assets/images/novel/upload.png" alt="" />
                      </div>
                    </div>

                    <div class="input-cover-right">
                      <div class="cover-cost-display">
                        <span class="cover-cost">{{ coverCost }}</span>
                        <img src="@/assets/images/novel/coin.png" alt="" />
                      </div>

                      <div class="generate-btn" @click="generateNovelCover">
                        <img src="@/assets/images/home/send.png" alt="Send" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

           <!-- Generating Cover State -->
            <div v-else-if="isGeneratingCover" class="cover-generating-state">
              <span class="generating-text">{{ t('novel.generatingCover') }}</span>
              <div class="skeleton-loader">
                <div class="skeleton-line content"></div>
              </div>
            </div>

            <!-- Cover Result State -->
            <div v-else-if="showCoverResult" class="cover-result-state">
              <span class="result-title">{{ t('novel.modifiedCover') }}:</span>
              <div class="cover-result-image">
                <img :src="generatedCover" alt="" />
                <img class="zoom-cover-btn" src="@/assets/images/novel/zoom.png" alt="Zoom" @click="zoomCoverImage(generatedCover)" />
              </div>
              <div class="result-actions">
                <button class="abandon-btn" @click="abandonCover">
                  {{ t('novel.abandon') }}
                </button>
                <button class="use-btn" @click="useCover">
                  {{ t('novel.use') }}
                </button>
              </div>
              <span class="result-note">{{ t('novel.coverNote') }}</span>
            </div>

        </div>
      </div>
    </div>

    <!-- Right Area -->
    <div class="right-area">
      <!-- Top Bar with Credit -->
      <div class="right-top-bar">
        <div class="header-bean" @click="goRechargeDetail">
          <img src="../assets/images/header/bean_icon.png" alt="" />
          <span>{{ userBalance }}</span>
        </div>

        <span class="header-line"></span>

        <span class="header-recharge" @click="goRecharge">{{ t("header.recharge") }}</span>
      </div>

      <!-- Novel Outline -->
      <div class="novel-outline">
        <div class="outline-title">
          <h2 v-if="!currentChapter">{{ t('novel.novelOutline') }}</h2>
          <h2 v-else>{{ t('novel.chapter', { chapter: currentChapter.chapter }) }} {{ currentChapter.title }}</h2>
          <button v-if="!isLoading && outlineData && !hasFailed && !currentChapter && taskStatus !== 'DOING' && !(currentStepName == 'chapter' && stepChapterIndex >= 1)" class="regenerate-btn" @click="regenerateOutline">
            {{ t('novel.regenerate') }}
          </button>
          <template v-else-if="currentChapter && !hasFailed">
            <button v-if="!isEditingChapter && taskStatus !== 'DOING' && !isChapterTyping && currentChapter.chapter === stepChapterIndex" class="regenerate-btn" @click="startEditChapter">
              {{ t('novel.edit') }}
            </button>
            <div v-else-if="isEditingChapter" class="edit-chapter-actions">
              <button class="cancel-edit-chapter-btn" @click="cancelEditChapter">
                {{ t('novel.cancel') }}
              </button>
              <button class="save-edit-chapter-btn" @click="saveEditChapter">
                {{ t('novel.complete') }}
              </button>
            </div>
          </template>
        </div>

        <div class="outline-content" ref="outlineContentRef">
          <!-- Skeleton Loader (闪屏效果) -->
          <div v-if="isLoading && !isGeneratingOutline" class="skeleton-loader">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line content"></div>
          </div>

          <!-- Skeleton during outline generation before stream text arrives -->
          <div v-else-if="isGeneratingOutline && !outlineStreamText && !outlineStreamDone && !hasFailed" class="skeleton-loader">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line content"></div>
          </div>

          <!-- Outline Streaming Display with Typewriter Effect -->
          <div v-else-if="isGeneratingOutline && outlineStreamText && !outlineStreamDone && !hasFailed" class="outline-stream-content">
            <pre class="stream-text">{{ outlineStreamText }}<span class="typing-cursor"></span></pre>
          </div>

          <!-- Failed State Display -->
          <div v-else-if="hasFailed" class="failed-state">
            <div class="failed-icon">
              <img src="@/assets/images/novel/fail.png" alt="">
            </div>
            <h3 class="failed-title">{{ t('novel.generationFailed') }}</h3>
            <p class="failed-message">
              {{ t('novel.error.generationFailedMessage') }}<br />
              {{ t('novel.error.contactSupport') }}<br />
              {{ t('novel.error.supportEmail') }}
            </p>
            <button class="retry-button" @click="handleRetry">
              {{ t('novel.retry') }}
            </button>
          </div>

          <!-- Chapter Content -->
          <div v-else-if="currentChapter" class="chapter-content" ref="chapterContentRef">
            <div class="chapter-text" v-if="!isEditingChapter">
              <p class="paragraph">{{ displayedContent }}<span v-if="isChapterTyping || (taskStatus === 'DOING' && !displayedContent)" class="typing-cursor" :class="{ 'blink': !displayedContent || isWaitingForData }"></span></p>
            </div>

            <div class="chapter-textarea" v-else>
              <div class="chapter-edit-wrapper">
                <textarea
                  v-model="editingChapterContent"
                  class="chapter-edit-textarea"
                  @input="handleChapterEditInput"
                  ref="chapterEditTextareaRef"
                  spellcheck="false"
                  :maxlength="20000"
                ></textarea>
                <div class="chapter-edit-counter">{{ editingChapterContent.length }}/20000</div>
              </div>
            </div>

            <!-- Cover Image Display -->
            <div v-if="coverTaskId" class="chapter-cover">
              <div v-if="coverLoading" class="skeleton-loader">
                <div class="skeleton-line cover-skeleton"></div>
              </div>
              <img v-else-if="coverImage" :src="coverImage" alt="Cover" class="cover-image" />
            </div>
          </div>

          <!-- Structured Content -->
          <div v-else-if="outlineData" class="structured-content">
            <!-- 基本信息 -->
            <div v-if="outlineData.base_info" class="section basic-info">
              <h3 class="section-title">{{ t('novel.basicInfo') }}</h3>
              <div class="info-item">
                <span class="info-label">{{ t('novel.totalChapters') }}</span>
                <span class="info-value">{{ outlineData.base_info.total_chapters }}{{ t('novel.chaptersLabel') }}</span>
              </div>
              <div class="info-item" v-if="outlineData.base_info.words_per_chapter">
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
            <div v-if="outlineData.characters" class="section characters">
              <h3 class="section-title">{{ t('novel.characterGallery') }}</h3>
              <!-- 主角 -->
              <div v-if="getMainCharacters().length > 0" class="character-group">
                <h4 class="group-title">{{ t('novel.mainCharacter') }}</h4>
                <div v-for="character in getMainCharacters()" :key="character.name" class="character-card">
                  <div class="character-name">{{ character.name }}</div>
                  <div class="character-desc">{{ character.description }}</div>
                </div>
              </div>
              <!-- 配角 -->
              <div v-if="getSupportingCharacters().length > 0" class="character-group">
                <h4 class="group-title">{{ t('novel.supportingCharacter') }}</h4>
                <div v-for="character in getSupportingCharacters()" :key="character.name" class="character-card">
                  <div class="character-name">{{ character.name }}</div>
                  <div class="character-desc">{{ character.description }}</div>
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
                :class="{ 'current-chapter': chapter.chapter === stepChapterIndex && taskStatus === 'DOING' }"
                @click="goToChapter(chapter.chapter)"
              >
                <div class="chapter-number">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</div>
                <div class="chapter-title">{{ chapter.title }}</div>
              </div>
            </div>

            <!-- 小说封面 -->
            <div class="section novel-cover">
              <h3 class="section-title">{{ t('novel.novelCover') }}</h3>
              <div class="cover-container">
                <div v-if="coverLoading" class="skeleton-loader cover-skeleton-wrapper">
                  <div class="skeleton-line cover-skeleton"></div>
                </div>
                <div class="cover-image" v-else-if="coverImage">
                  <img :src="coverImage" alt="Novel Cover" />
                </div>
                <div class="cover-placeholder" v-else-if="!coverTaskId">
                  <span>{{ t('novel.coverPlaceholder') }}</span>
                </div>
                <img v-if="showCoverEditBtn" class="edit-cover-btn" src="@/assets/images/novel/edit.png" alt="Edit" @click="toggleCoverEdit" />
              </div>
            </div>
          </div>

          <!-- Fallback for unstructured content -->
          <div v-else-if="outlineContent" class="content-text">
            <p class="paragraph">{{ displayedContent }}</p>
          </div>

        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <div class="left">
          <button v-if="currentChapter" class="prev-btn" @click="goPrevChapter">
            <img src="@/assets/images/novel/prev.png" alt="" />
          </button>
          <button v-if="showNextArrow" class="next-btn" @click="goNextChapter">
            <img src="@/assets/images/novel/next.png" alt="" />
          </button>
        </div>

        <div class="right" v-if="shouldShowGenerateButtons">
          <button class="action-btn" @click="() => callNovelNext()">
            {{ t('novel.nextChapterTitle') }} <span class="action-btn-cost">/{{ nextChapterCost }}{{ t('novel.computingPower') }}</span>
          </button>
          <button class="action-btn primary" @click="callNovelAllChapters">
            {{ t('novel.allChaptersTitle') }} <span class="action-btn-cost">/{{ allChaptersCost }}{{ t('novel.computingPower') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Cover Action Confirmation Modal -->
    <ExitConfirmModal
      :visible="showCoverActionConfirmModal"
      @cancel="cancelCoverAction"
      @confirm="confirmCoverAction"
    />

    <!-- Upload Mask -->
    <UploadMask :visible="isUploading" />

    <!-- Cover Zoom Modal -->
    <div v-if="showCoverZoomModal" class="cover-zoom-modal" @click="closeCoverZoomModal">
      <div class="cover-zoom-content" @click.stop>
        <img class="close-zoom-btn" src="@/assets/images/novel/close.png" alt="Close" @click="closeCoverZoomModal" />
        <img :src="zoomedCoverImage" alt="" class="zoomed-cover-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { toast } from '@/util/toast';
import api from '@/api/index';
import { aiUrl, baseUrl } from '@/util/config';
import ExitConfirmModal from '@/components/ExitConfirmModal.vue';
import UploadMask from '@/components/UploadMask.vue';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// Get session id from route params
const sessionId = computed(() => route.params.id as string);

// State
const userInfo = ref<any>(null);
const isLoading = ref(true);
const outlineContent = ref<string>('');
const displayedContent = ref<string>('');
const outlineContentRef = ref<HTMLElement | null>(null);
const chapterContentRef = ref<HTMLElement | null>(null);
const chapterEditTextareaRef = ref<HTMLTextAreaElement | null>(null);
const printerInterval = ref<number | null>(null);
const pollingInterval = ref<number | null>(null);
const projectName = ref<string>('');
const originalProjectName = ref<string>('');
const isEditingName = ref<boolean>(false);
const projectNameInputRef = ref<HTMLElement | null>(null);
const userBalance = ref<number>(0);
const taskStatus = ref<string>('');
const chapterCount = ref<number>(0);
const hasFailed = ref<boolean>(false);
const outlineData = ref<any>(null);
const chapters = ref<any[]>([]);
const showRegenerateInput = ref<boolean>(false);
const regenerateContent = ref<string>('');
const selectedWordCount = ref<string>('100K');
const selectedLanguage = ref<string>('en');
const wordCountOptions = ['100K', '500K', '10M'];
const languageOptions = computed(() => [
  { value: 'cn', label: t('novel.language.zh') },
  { value: 'en', label: t('novel.language.en') },
  { value: 'jp', label: t('novel.language.jp') }
]);

// Cover related state
const novelCover = ref<string>('');
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
const coverInputKey = ref<number>(0);
const isGeneratingCover = ref<boolean>(false);
const coverGenerationTaskId = ref<string>('');
const coverPollingInterval = ref<number | null>(null);
const generatedCover = ref<string>('');
const showCoverResult = ref<boolean>(false);
const showCoverEditBtn = ref<boolean>(true);
const showWordCountDropdown = ref(false);
const showLanguageDropdown = ref(false);
const currentChapter = ref<any>(null);
const regenerateCost = computed(() => 20);
const isEditingChapter = ref<boolean>(false);
const editingChapterContent = ref<string>('');
const originalChapterContent = ref<string>('');
const estimatedTime = ref<number | null>(null);
const originalEstimatedSeconds = ref<number | null>(null);
const displayMinutes = ref<number>(0);
const startTime = ref<number | null>(null);
const estimatedTimeFetched = ref<boolean>(false);
const isGeneratingOutline = ref<boolean>(false);
const generatingChapter = ref<number | null>(null);
const isChapterTyping = ref<boolean>(false);
const isWaitingForData = ref<boolean>(false);
const stepChapterIndex = ref<number>(0);
const streamReaderController = ref<AbortController | null>(null);
const topic = ref<string>('');
const lastGenerationType = ref<string>('outline');
const queueInfo = ref<{ count: number, estimatedTime: number } | null>(null);
const currentStepName = ref<string>('');
const userSelectedSettings = ref<any>(null);
const taskStartAt = ref<string>('');
const countdownTimer = ref<number | null>(null);

// Cover action confirmation modal
const showCoverActionConfirmModal = ref<boolean>(false);
const pendingCoverAction = ref<string>(''); // 'next' or 'all'

// State for chapter title editing
const editingChapterId = ref<number | null>(null);
const editingChapterTitle = ref<string>('');
const originalChapterTitle = ref<string>('');
const isSavingChapterTitle = ref<boolean>(false);
const chapterTitleInputs = ref<{[key: number]: any}>({});
const nextChapterPoints = ref<number>(10);
const allChaptersPoints = ref<number>(100);
const coverCost = ref<number>(0);
const isFetchingNovelOutline = ref<boolean>(false);

// Cover image state
const coverImage = ref<string>('');
const coverLoading = ref<boolean>(false);
const coverTaskId = ref<string>('');
const coverPollTimer = ref<number | null>(null);
const isUploading = ref<boolean>(false);
const showCoverZoomModal = ref<boolean>(false);
const zoomedCoverImage = ref<string>('');

// Start polling for cover image
const startCoverPolling = (taskId: string) => {
  coverTaskId.value = taskId;
  coverLoading.value = true;

  const poll = async () => {
    try {
      const res = await api.coverTaskPolling(taskId) as any;
      if (res.code === 200 && res.data?.status === 'SUCCESS') {
        coverImage.value = res.data.result?.image_url || '';
        coverLoading.value = false;
        if (coverPollTimer.value) {
          clearInterval(coverPollTimer.value);
          coverPollTimer.value = null;
        }
      } else if (res.data?.status === 'FAIL') {
        coverLoading.value = false;
        if (coverPollTimer.value) {
          clearInterval(coverPollTimer.value);
          coverPollTimer.value = null;
        }
      }
    } catch (error) {
      console.error('Error polling cover:', error);
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

const startOutlineStream = async () => {
  if (outlineStreamParser.value) {
    outlineStreamParser.value.destroy();
  }

  outlineStreamText.value = '';
  outlineStreamDone.value = false;
  outlineStreamError.value = '';
  outlineStreamMetadata.value = null;
  isLoading.value = true; // Ensure loading is shown while waiting for data

  const token = localStorage.getItem('token') || '';

  outlineStreamParser.value = new OutlineStreamParser({
    onText: (text) => {
      outlineStreamText.value = text;
      // Hide loading screen once we start receiving data
      if (text.length > 0) {
        isLoading.value = false;
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

        try {
        const json = outlineStreamParser.value?.extractJson(outlineStreamParser.value?.rawBuf || '');
        if (json && json.base_info) {
          outlineData.value = json;
        }
      } catch (e) {
        console.error('Error parsing outline data:', e);
      }

      isLoading.value = false;
      isGeneratingOutline.value = false;
      taskStatus.value = 'SUCCESS';
      hasFailed.value = false;

      // Start polling for cover image
      if (coverTaskId.value) {
        startCoverPolling(coverTaskId.value);
      }

      // Reset currentChapter to show "待生成章节" section in left sidebar
      currentChapter.value = null;
    },
    onError: (error) => {
      outlineStreamError.value = error;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
      isLoading.value = false;
      isGeneratingOutline.value = false;
    },
    t: t
  });

  outlineStreamParser.value.start(sessionId.value, token);
};

const shouldShowEstimatedTime = computed(() => {
  if (!startTime.value) return false;
  // Show estimated time if it's available, or after 30 seconds
  if (estimatedTime.value != null) return true;
  const elapsed = Date.now() - startTime.value;
  return elapsed > 30000;
});

const shouldShowActionButtons = computed(() => {
  if (taskStatus.value == 'DOING') return false;
  if (isLoading.value) return false;
  if (hasFailed.value) return false;
  if (!outlineData.value && !currentChapter.value) return false;
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

  // Don't show buttons when task is in progress
  if (taskStatus.value === 'DOING') return false;

  // Don't show buttons while typewriter is still printing chapter content
  if (isChapterTyping.value) return false;

  // Never show on outline page
  if (!currentChapter.value) return false;

  // Only show on the latest chapter (stepChapterIndex)
  if (currentChapter.value.chapter !== stepChapterIndex.value) return false;

  // Don't show if all chapters are generated
  if (currentChapter.value.chapter >= chapterCount.value) return false;

  return true;
});

const selectedLanguageLabel = computed(() => {
  const lang = languageOptions.value.find(l => l.value == selectedLanguage.value);
  return lang ? lang.label : t('novel.language.zh');
});

// Parse and handle structured outline data
const handleStructuredData = async (result: any) => {
  try {
    let parsedResult;
    if (typeof result === 'string') {
      parsedResult = JSON.parse(result);
      // Check if parsed result has generate_novel_outline field
      if (parsedResult.generate_novel_outline) {
        parsedResult = parsedResult.generate_novel_outline;
      }
    } else {
      parsedResult = result;
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
      // Fetch points estimate for chapter data
      await fetchPointsEstimate();
      return;
    }

    // This is outline data
    outlineData.value = parsedResult;
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

    // Fetch points estimate for next chapter and all chapters
    await fetchPointsEstimate();
  } catch (error) {
    console.error('Error parsing structured data:', error);
    outlineContent.value = typeof result === 'string' ? result : JSON.stringify(result);
    printContent(outlineContent.value);
  }
};

// Fetch points estimate for next chapter, all chapters, and cover
const fetchPointsEstimate = async () => {
  try {
    // Estimate for next chapter
    const nextChapterEstimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'chapter',
      from_chapter: stepChapterIndex.value || 1
    }) as any;
    if (nextChapterEstimateRes.code == 200 && nextChapterEstimateRes.data?.total_points) {
      nextChapterPoints.value = nextChapterEstimateRes.data.total_points;
    }

    // Estimate for all chapters
    const allChaptersEstimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'chapter',
      from_chapter: stepChapterIndex.value || 1
    }) as any;
    if (allChaptersEstimateRes.code == 200 && allChaptersEstimateRes.data?.total_points) {
      allChaptersPoints.value = allChaptersEstimateRes.data.total_points;
    }

    // Estimate for cover
    const coverEstimateRes = await api.novelEstimate({
      session_id: sessionId.value,
      step_name: 'cover'
    }) as any;
    if (coverEstimateRes.code == 200 && coverEstimateRes.data?.total_points) {
      coverCost.value = coverEstimateRes.data.total_points;
    }
  } catch (error) {
    console.error('Error fetching points estimate:', error);
  }
};

// Compute costs
const nextChapterCost = computed(() => nextChapterPoints.value);
const allChaptersCost = computed(() => allChaptersPoints.value);

// Store original content when opening regenerate input
const originalRegenerateContent = ref<string>('');

const regenerateOutline = async () => {
  hideEdit();

  // Fetch latest user settings
  await fetchUserSelectedSettings();

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
      case 10:
        selectedWordCount.value = '100K';
        break;
      case 50:
        selectedWordCount.value = '500K';
        break;
      case 100:
        selectedWordCount.value = '10M';
        break;
      default:
        selectedWordCount.value = '100K';
    }
  }

  // Set language if available
  if (userSelectedSettings.value?.language) {
    selectedLanguage.value = userSelectedSettings.value.language;
  }
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
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
  showWordCountDropdown.value = false;
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
  if (!regenerateContent.value?.trim()) {
    toast(t('novel.error.emptyRegenerateContent'));
    return;
  }

  try {
    // Convert selectedWordCount to total_words
    let totalWords;
    switch (selectedWordCount.value) {
      case '100K':
        totalWords = 10;
        break;
      case '500K':
        totalWords = 50;
        break;
      case '10M':
        totalWords = 100;
        break;
      default:
        totalWords = 10;
    }

    const token = localStorage.getItem('token');

    // Get previous settings from userSelectedSettings
    const previousSettings = userSelectedSettings.value || {};
    const previousOthers = previousSettings.others || {};

    // Build request data based on previous settings, only updating modified fields
    const requestData = {
      ...previousSettings,
      session_id: sessionId.value,
      language: selectedLanguage.value,
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
        'token': token || ''
      },
      body: JSON.stringify(requestData)
    });

    const userSelectedRes = await response.json();

    if (userSelectedRes.code !== 200) {
      toast(userSelectedRes.message || t('fail'));
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
          case 10:
            selectedWordCount.value = '100K';
            break;
          case 50:
            selectedWordCount.value = '500K';
            break;
          case 100:
            selectedWordCount.value = '10M';
            break;
          default:
            selectedWordCount.value = '100K';
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
    showRegenerateInput.value = false;
    regenerateContent.value = '';

    // Call novelOutline API
    outlineData.value = null;
    isLoading.value = true;
    hasFailed.value = false;
    currentChapter.value = null;
    callNovelOutline('renew');
  } catch (error) {
    console.error('Error sending regenerate request:', error);
    toast(t('fail'));
  }
};

// Start editing project name
const startEditProjectName = () => {
  originalProjectName.value = projectName.value;
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
  }
};

// Cancel editing project name
const cancelEditProjectName = () => {
  projectName.value = originalProjectName.value;
  isEditingName.value = false;
};

// Start editing chapter
const startEditChapter = () => {
  if (currentChapter.value?.content) {
    originalChapterContent.value = currentChapter.value.content;
    editingChapterContent.value = currentChapter.value.content;
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

// Fetch estimated time
const fetchEstimatedTime = async () => {
  if (estimatedTimeFetched.value) {
    return;
  }
  try {
    const res = await api.estimateTime(sessionId.value) as any;
    if (res.code === 200 && res.data) {
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
        estimatedTime.value = apiEstimatedSeconds;
      } else {
        originalEstimatedSeconds.value = 600;
        estimatedTime.value = 600;
      }

      estimatedTimeFetched.value = true;

      // Calculate initial display minutes
      let initialMinutes = Math.ceil((originalEstimatedSeconds.value || 600) / 60);

      // If we have task_start_at, subtract elapsed time
      if (taskStartAt.value && res.current_timestamp) {
        const startTimestamp = new Date(taskStartAt.value).getTime() / 1000;
        const currentTimestamp = res.current_timestamp;
        const elapsedSeconds = currentTimestamp - startTimestamp;
        const remainingSeconds = Math.max(0, (originalEstimatedSeconds.value || 600) - elapsedSeconds);
        initialMinutes = Math.ceil(remainingSeconds / 60);
      } else if (startTime.value) {
        // Fallback: use startTime if taskStartAt is not available
        const elapsedSeconds = Math.floor((Date.now() - startTime.value) / 1000);
        const remainingSeconds = Math.max(0, (originalEstimatedSeconds.value || 600) - elapsedSeconds);
        initialMinutes = Math.ceil(remainingSeconds / 60);
      }

      // Ensure at least 1 minute
      if (initialMinutes < 1) {
        initialMinutes = 1;
      }

      displayMinutes.value = initialMinutes;

      // Start countdown timer
      startCountdownTimer();
    }
  } catch (error) {
    console.error('Error fetching estimated time:', error);
  }
};

// Start countdown timer: simply decrement displayMinutes by 1 every 60 seconds
const startCountdownTimer = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }

  countdownTimer.value = window.setInterval(() => {
    if (displayMinutes.value > 1) {
      displayMinutes.value--;
    }
  }, 60000);
};

// Auto resize textarea to fit content
const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';

  textarea.style.height = textarea.scrollHeight + 'px';
};

// Handle chapter edit input
const handleChapterEditInput = () => {
  // Limit input to 20000 characters
  if (editingChapterContent.value.length > 20000) {
    editingChapterContent.value = editingChapterContent.value.substring(0, 20000);
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
  isEditingChapter.value = false;
};

// Save edited chapter
const saveEditChapter = async () => {
  if (currentChapter.value) {
    // Check if content has been modified
    if (editingChapterContent.value !== originalChapterContent.value) {
      try {
        // Call API to modify chapter content
        const modifyRes = await api.modifyChapterContent({
          session_id: sessionId.value,
          chapter: currentChapter.value.chapter,
          content: editingChapterContent.value
        }) as any;

        if (modifyRes.code === 200) {
          // Update local data
          currentChapter.value.content = editingChapterContent.value;
          displayedContent.value = editingChapterContent.value;
        } else {
          console.error('Error modifying chapter content:', modifyRes.message);
          toast(t('novel.error.fetchFailed'));
        }
      } catch (error) {
        console.error('Error modifying chapter content:', error);
        toast(t('novel.error.fetchFailed'));
      }
    }
  }
  isEditingChapter.value = false;
};

// Start editing chapter title
const startEditChapterTitle = (chapterId: number, currentTitle: string) => {
  editingChapterId.value = chapterId;
  originalChapterTitle.value = currentTitle;
  editingChapterTitle.value = currentTitle;
  nextTick(() => {
    if (chapterTitleInputs.value[chapterId]) {
      chapterTitleInputs.value[chapterId]?.focus();
    }
  });
};

// Save edited chapter title
const saveChapterTitle = async (chapterId: number) => {
  isSavingChapterTitle.value = true;
  try {
    // Call API to modify chapter title
    const modifyRes = await api.modifyChapterTitle({
      session_id: sessionId.value,
      chapter: chapterId,
      title: editingChapterTitle.value
    }) as any;

    if (modifyRes.code == 200) {
      // Update local data
      if (outlineData.value && outlineData.value.outline) {
        const chapter = outlineData.value.outline.find((c: any) => c.chapter === chapterId);
        if (chapter) {
          chapter.title = editingChapterTitle.value;
          // Also update currentChapter if it's the same chapter
          if (currentChapter.value && currentChapter.value.chapter === chapterId) {
            currentChapter.value.title = editingChapterTitle.value;
          }
        }
      }
    } else {
      console.error('Error modifying chapter title:', modifyRes.message);
      toast(t('novel.error.fetchFailed'));
    }
  } catch (error) {
    console.error('Error modifying chapter title:', error);
    toast(t('novel.error.fetchFailed'));
  } finally {
    // Reset editing state regardless of API result
    editingChapterId.value = null;
    isSavingChapterTitle.value = false;
  }
};

const cancelChapterTitle = () => {
  editingChapterId.value = null;
  editingChapterTitle.value = originalChapterTitle.value;
};

const handleChapterTitleBlur = () => {
  // Only cancel if not saving
  if (!isSavingChapterTitle.value) {
    cancelChapterTitle();
  }
};

// Get main characters
const getMainCharacters = () => {
  if (!outlineData.value?.characters) return [];
  return outlineData.value.characters.filter((char: any) => char.type === '主角');
};

// Get supporting characters
const getSupportingCharacters = () => {
  if (!outlineData.value?.characters) return [];
  return outlineData.value.characters.filter((char: any) => char.type === '配角' || char.type !== '主角');
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

  router.push("/similar");
}

// Stream read from stream_url
const readStream = async (streamUrl: string, chapterNum: number) => {
  try {
    const token = localStorage.getItem('token');
    streamReaderController.value = new AbortController();

    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'token': token || ''
      },
      signal: streamReaderController.value.signal
    });

    if (!response.ok) {
      throw new Error(`Stream request failed with status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    // Initialize chapter state
    taskStatus.value = 'DOING';
    currentChapter.value = {
      chapter: chapterNum,
      title: '',
      content: ''
    };
    displayedContent.value = '';
    outlineContent.value = '';

    // Update step chapter index
    stepChapterIndex.value = chapterNum;

    // Read all chunks first
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
    }

    // Parse the complete SSE response
    let chapterContent = '';
    try {
      // Split by lines
      const lines = fullContent.trim().split('\n');
      let allContent = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Check if it's an SSE data line
          if (trimmedLine.startsWith('data:')) {
            // Extract JSON part after 'data: '
            const jsonStr = trimmedLine.substring(5).trim();
            if (jsonStr) {
              const jsonData = JSON.parse(jsonStr);
              if (jsonData.content) {
                allContent += jsonData.content + '\n';
              }
            }
          } else {
            // Not an SSE data line, try to parse as JSON directly
            try {
              const jsonData = JSON.parse(trimmedLine);
              if (jsonData.content) {
                allContent += jsonData.content + '\n';
              }
            } catch (e) {
              // Not JSON, add as-is
              allContent += trimmedLine + '\n';
            }
          }
        }
      }

      chapterContent = allContent.trim();
    } catch (e) {
      chapterContent = fullContent;
    }

    // Find ```json and start from after there if it exists, otherwise don't show any content
    let displayContent = '';
    const jsonStartMatch = chapterContent.match(/```json/);
    if (jsonStartMatch && jsonStartMatch.index !== undefined) {
      // Find the JSON content after ```json
      const jsonStartIndex = jsonStartMatch.index + jsonStartMatch[0].length;
      const jsonContent = chapterContent.substring(jsonStartIndex);

      // Try to parse the JSON content
      try {
        // Find the end of JSON (next ```)
        const jsonEndMatch = jsonContent.match(/```/);
        if (jsonEndMatch && jsonEndMatch.index !== undefined) {
          const jsonStr = jsonContent.substring(0, jsonEndMatch.index).trim();
          const jsonData = JSON.parse(jsonStr);
          if (jsonData.content) {
            displayContent = jsonData.content;
            // Replace newline characters with actual line breaks
            displayContent = displayContent.replace(/\\n/g, '\n');
          }
        }
      } catch (e) {
        // If parsing fails, don't show any content
        displayContent = '';
      }
    }

    // Printer effect for the content
    let charIndex = 0;
    let userScrolled = false;

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

    // Only hide loading screen when we have content to display
    if (displayContent) {
      isLoading.value = false;
    }

    // Use chapterContentRef since we're displaying chapter content
    const scrollElement = chapterContentRef.value;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    const doAutoScroll = () => {
      // Get the latest scroll element each time to ensure it's always valid
      const currentScrollElement = chapterContentRef.value;
      if (!userScrolled && currentScrollElement) {
        programmaticScroll = true;
        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
          currentScrollElement.scrollTop = currentScrollElement.scrollHeight;
          requestAnimationFrame(() => { programmaticScroll = false; });
        });
      }
    };

    const printInterval = setInterval(() => {
      if (charIndex < displayContent.length) {
        displayedContent.value += displayContent[charIndex];
        charIndex++;

        // Auto scroll to bottom only if user hasn't scrolled
        doAutoScroll();
      } else {
        clearInterval(printerInterval.value);
        // Stream completed
        taskStatus.value = 'SUCCESS';
        isGeneratingOutline.value = false;
        hasFailed.value = false;
        currentChapter.value.content = chapterContent;
        // Reset currentChapter to show "待生成章节" section in left sidebar
        currentChapter.value = null;
        // Remove scroll event listener
        if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
        if (scrollElement) {
          scrollElement.removeEventListener('scroll', handleScroll);
        }
      }
    }, 10);

    // Initial scroll to bottom when content starts displaying
    setTimeout(() => {
      doAutoScroll();
    }, 100);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return;
    }
    hasFailed.value = true;
    taskStatus.value = 'FAIL';
    outlineContent.value = t('novel.error.generationFailed');
  }
};

// Call novelNext API
const callNovelNext = async (retryChapter?: number) => {
  hideEdit();

  // Check if there's an unprocessed cover generation result
  if (showCoverResult.value) {
    pendingCoverAction.value = 'next';
    showCoverActionConfirmModal.value = true;
    return;
  }

  try {
    const nextChapterIndex = retryChapter !== undefined ? retryChapter : (currentChapter.value ? currentChapter.value.chapter + 1 : 1);

    // Immediately set UI state: show chapter title + loading on right, show chapter in left sidebar
    const nextChapterData = outlineData.value?.outline?.find((c: any) => c.chapter === nextChapterIndex);
    currentChapter.value = {
      chapter: nextChapterIndex,
      title: nextChapterData?.title || '',
      content: ''
    };

    // Add new chapter to chapters array if not exists
    const existingChapter = chapters.value.find((c: any) => c.chapter === nextChapterIndex);
    if (!existingChapter) {
      chapters.value.push({
        id: `temp-${nextChapterIndex}`,
        chapter: nextChapterIndex,
        title: nextChapterData?.title || t('novel.untitled'),
        is_publish: 2 // 未发布状态
      });
    }

    displayedContent.value = '';
    isLoading.value = true;
    hasFailed.value = false;
    taskStatus.value = 'DOING';
    lastGenerationType.value = 'chapter';
    isGeneratingOutline.value = false;
    isChapterTyping.value = false;
    generatingChapter.value = nextChapterIndex;
    stepChapterIndex.value = nextChapterIndex;
    currentStepName.value = 'chapter';

    const generateMode = retryChapter !== undefined ? 'retry' : 'new';
    const novelNextRes = await api.novelNext({
      session_id: sessionId.value,
      chapter: nextChapterIndex,
      generate_mode: generateMode
    }) as any;

    if (novelNextRes.code !== 200) {
      toast(t('novel.error.fetchFailed'));
      isLoading.value = false;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
      return;
    }

    // Fetch estimated time
    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    startTime.value = Date.now();
    fetchEstimatedTime();

    await fetchUserBalance();

    // Always use stream_read to fetch chapter content
    await fetchChapterStream(nextChapterIndex);

  } catch (error) {
    console.error('Error calling novelNext:', error);
    toast(t('novel.error.fetchFailed'));
    isLoading.value = false;
    hasFailed.value = true;
    taskStatus.value = 'FAIL';
  }
};

function hideEdit() {
  if (isEditingCover.value) {
    isEditingCover.value = false;
  }
}

const goPrevChapter = async () => {
  hideEdit();

  if (!currentChapter.value) {
    return;
  }

  const currentChapterNum = currentChapter.value.chapter;
  if (currentChapterNum > 1) {
    // Go to previous chapter
    try {
      isLoading.value = true;

      // Stop any ongoing stream first
      if (streamReaderController.value) {
        streamReaderController.value.abort();
        streamReaderController.value = null;
      }
      if (printerInterval.value) {
        clearInterval(printerInterval.value);
        printerInterval.value = null;
      }

      const res = await api.detailChapter(sessionId.value, currentChapterNum - 1) as any;
      if (res.code == 200 && res.data) {
        isEditingChapter.value = false;
        taskStatus.value = 'SUCCESS';
        isChapterTyping.value = false;
        isGeneratingOutline.value = false;
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

        const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === currentChapterNum - 1);
        currentChapter.value = {
          chapter: currentChapterNum - 1,
          title: chapterData?.title || res.data.title || '',
          content: filteredContent
        };
        displayedContent.value = filteredContent;
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
    try {
      isLoading.value = true;

      // Stop any ongoing stream first
      if (streamReaderController.value) {
        streamReaderController.value.abort();
        streamReaderController.value = null;
      }
      if (printerInterval.value) {
        clearInterval(printerInterval.value);
        printerInterval.value = null;
      }

      const detailProjectRes = await api.detailProject(sessionId.value) as any;

      if (detailProjectRes.code === 200) {
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
      console.error('Error fetching outline preview:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

// Handle chapter streaming with common logic
const handleChapterStream = async (streamUrl: string, chapterNum: number, chapterData?: any) => {
  // Clean up any existing stream reader
  if (streamReaderController.value) {
    streamReaderController.value.abort();
  }

  // Stop polling since we're using stream
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }

  // Start streaming
  generatingChapter.value = chapterNum;
  hasFailed.value = false;
  taskStatus.value = 'DOING';
  lastGenerationType.value = 'chapter';
  isGeneratingOutline.value = false;

  // Update user balance
  await fetchUserBalance();

  // Fetch estimated time
  estimatedTime.value = null;
  originalEstimatedSeconds.value = null;
  displayMinutes.value = 0;
  estimatedTimeFetched.value = false;
  await fetchEstimatedTime();

  // Initialize currentChapter to show chapter info in right area
  if (chapterData) {
    currentChapter.value = {
      chapter: chapterNum,
      title: chapterData.title,
      content: ''
    };
  }

  // Ensure chapterCount is set from outlineData if available
  if (outlineData.value?.base_info?.total_chapters) {
    chapterCount.value = outlineData.value.base_info.total_chapters;
  }

  await readStream(streamUrl, chapterNum);
};

const goNextChapter = async () => {
  hideEdit();

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

  // Check if this is the currently generating chapter with DOING status
  // Or if this chapter is at/beyond stepChapterIndex (meaning generation was triggered for this chapter)
  const isCurrentlyGenerating = (chapterNum === stepChapterIndex.value && taskStatus.value === 'DOING') ||
                                (chapterNum >= stepChapterIndex.value && taskStatus.value === 'DOING');

  if (isCurrentlyGenerating) {
    // Use stream to fetch chapter content
    try {
      isLoading.value = true;
      isChapterTyping.value = false;
      taskStatus.value = 'DOING';
      lastGenerationType.value = 'chapter';
      isGeneratingOutline.value = false;
      generatingChapter.value = chapterNum;

      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterNum);
      currentChapter.value = {
        chapter: chapterNum,
        title: chapterData?.title || '',
        content: ''
      };
      displayedContent.value = '';

      // Fetch chapter stream
      await fetchChapterStream(chapterNum);
    } catch (error) {
      console.error('Error fetching chapter stream:', error);
      toast(t('novel.error.fetchFailed'));
      isLoading.value = false;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
    }
    return;
  }

  // Check if this chapter has failed
  // If taskStatus is FAIL and we're clicking on the stepChapterIndex (the chapter that failed), show failure
  const hasFailedChapter = chapterNum === stepChapterIndex.value && taskStatus.value === 'FAIL';

  if (hasFailedChapter) {
    // Show failed state - don't need to fetch detailChapter
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterNum);
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
    isLoading.value = true;

    // Stop any ongoing stream first
    if (streamReaderController.value) {
      streamReaderController.value.abort();
      streamReaderController.value = null;
    }
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }

    const res = await api.detailChapter(sessionId.value, chapterNum) as any;
    if (res.code === 200 && res.data) {
      isEditingChapter.value = false;
      taskStatus.value = 'SUCCESS';
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

      const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterNum);
      // Use API title first, fallback to outline title
      currentChapter.value = {
        chapter: chapterNum,
        title: res.data.title || chapterData?.title || '',
        content: filteredContent
      };
      displayedContent.value = filteredContent;
      hasFailed.value = false;
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
const callNovelAllChapters = async () => {
  hideEdit();

  // Check if there's an unprocessed cover generation result
  if (showCoverResult.value) {
    pendingCoverAction.value = 'all';
    showCoverActionConfirmModal.value = true;
    return;
  }

  try {
    // Determine the first chapter to generate and generate mode
    let fromChapter: number;
    let generateMode: string;

    if (taskStatus.value === 'FAIL') {
      // If there's a failed chapter, retry from that chapter
      fromChapter = stepChapterIndex.value;
      generateMode = 'retry';
    } else if (currentChapter.value?.chapter) {
      // If current chapter generated successfully, start from next chapter
      fromChapter = currentChapter.value.chapter + 1;
      generateMode = 'new';
    } else {
      // No chapters generated yet, start from 1
      fromChapter = 1;
      generateMode = 'new';
    }

    const firstChapterIndex = fromChapter;
    const firstChapterData = outlineData.value?.outline?.find((c: any) => c.chapter === firstChapterIndex);

    // Immediately set UI state
    currentChapter.value = {
      chapter: firstChapterIndex,
      title: firstChapterData?.title || '',
      content: ''
    };
    displayedContent.value = '';
    isLoading.value = true;
    hasFailed.value = false;
    taskStatus.value = 'DOING';
    lastGenerationType.value = 'chapter';
    isGeneratingOutline.value = false;
    isChapterTyping.value = false;
    generatingChapter.value = firstChapterIndex;
    stepChapterIndex.value = firstChapterIndex;
    currentStepName.value = 'chapter';

    const novelAllRes = await api.novelAll({
      session_id: sessionId.value,
      generate_mode: generateMode,
      from_chapter: fromChapter
    }) as any;

    if (novelAllRes.code !== 200) {
      toast(novelAllRes.message || t('novel.error.fetchFailed'));
      isLoading.value = false;
      hasFailed.value = true;
      taskStatus.value = 'FAIL';
      return;
    }

    // Get cover task_id from response
    if (novelAllRes.data?.task_id) {
      coverTaskId.value = novelAllRes.data.task_id;
    } else {
      coverTaskId.value = '';
    }

    // Fetch estimated time
    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    startTime.value = Date.now();
    fetchEstimatedTime();

    await fetchUserBalance();

    // Use stream_read to fetch chapter content
    await fetchChapterStream(firstChapterIndex);

  } catch (error) {
    console.error('Error calling novelAll:', error);
    toast(t('novel.error.fetchFailed'));
    isLoading.value = false;
    hasFailed.value = true;
    taskStatus.value = 'FAIL';
  }
};

// Handle retry on failed generation
const handleRetry = () => {
  if (lastGenerationType.value == 'outline') {
    callNovelOutline('retry');
  } else if (lastGenerationType.value == 'chapter') {
    callNovelNext(currentChapter.value?.chapter);
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

// Handle chapter info text click
const handleChapterInfoClick = async () => {
  if (!currentChapter.value?.chapter) {
    return;
  }
  try {
    isLoading.value = true;
    const res = await api.detailChapter(sessionId.value, currentChapter.value.chapter) as any;
    if (res.code === 200) {
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
  hideEdit();

  // Check if this chapter has failed - only when clicking on the failed chapter (stepChapterIndex with FAIL status)
  const hasFailedChapter = chapterNum === stepChapterIndex.value && taskStatus.value === 'FAIL';

  if (hasFailedChapter) {
    // Show failed state - don't need to fetch detailChapter
    const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterNum);
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

  // Stop any ongoing stream first
  if (streamReaderController.value) {
    streamReaderController.value.abort();
    streamReaderController.value = null;
  }
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
    printerInterval.value = null;
  }
  isGeneratingOutline.value = false;
  outlineContent.value = '';
  displayedContent.value = '';
  currentChapter.value = null;
  isLoading.value = true;

  try {
    const res = await api.detailChapter(sessionId.value, chapterNum) as any;
    if (res.code === 200) {
      const result = res.data;
      if (result) {
        isEditingChapter.value = false;

        // Filter the content
        let filteredContent = result.content;

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
        hasFailed.value = false;

        // Get outline chapter title for reference
        const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterNum);
        // Use API title first, fallback to outline title
        currentChapter.value = {
          chapter: result.chapter,
          title: result.title || chapterData?.title || '',
          content: filteredContent
        };

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

        // Check if this chapter is currently being generated
        if (generatingChapter.value === chapterNum && taskStatus.value === 'DOING') {
          // Show printer effect
          printContent(filteredContent);
        } else {
          // Directly display filtered content
          displayedContent.value = filteredContent;
          // 滚动到内容开始处
          nextTick(() => {
            if (chapterContentRef.value) {
              chapterContentRef.value.scrollTop = 0;
            }
          });
        }
      }
    }
  } catch (error) {
    // Handle error
  } finally {
    isLoading.value = false;
  }
};

// Handle publish chapter button click
const handlePublishChapter = (chapter: any) => {
  // Get session_id from route params
  const session_id = route.params.id as string;

  // Get cover from detail data
  const cover = '';

  // Get chapter index
  const index = chapter.chapter;

  // Get project name
  const title = projectName.value || '';

  // Navigate to novel publish page with params
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

// Handle outline preview click
const handleOutlinePreviewClick = async () => {
  hideEdit();

  // Don't allow click if no outline data
  if (!outlineData.value || !outlineData.value.outline) {
    return;
  }

  // Set currentChapter to null to show outline area with skeleton loader
  currentChapter.value = null;
  displayedContent.value = '';
  outlineContent.value = '';
  isGeneratingOutline.value = false;

  try {
    isLoading.value = true;
    const detailProjectRes = await api.detailProject(sessionId.value) as any;
    if (detailProjectRes.code === 200) {
      const resultAsync = detailProjectRes.data?.result_async;
      const stepName = detailProjectRes.data?.step_name;
      const stepStatus = detailProjectRes.data?.step_status;

      if (resultAsync) {
        // Reset hasFailed when viewing outline
        hasFailed.value = false;

        // Handle the structured data, but skip points estimate if step_name is chapter
        try {
          let parsedResult;
          if (typeof resultAsync === 'string') {
            parsedResult = JSON.parse(resultAsync);
            // Check if parsed result has generate_novel_outline field
            if (parsedResult.generate_novel_outline) {
              parsedResult = parsedResult.generate_novel_outline;
            }
          } else {
            parsedResult = resultAsync;
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
            // Don't fetch points estimate if step_name is chapter
            if (stepName !== 'chapter') {
              await fetchPointsEstimate();
            }
            return;
          }

          // This is outline data
          outlineData.value = parsedResult;
          currentChapter.value = null;
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

          // Don't fetch points estimate if step_name is chapter
          if (stepName !== 'chapter') {
            await fetchPointsEstimate();
          }
        } catch (error) {
          console.error('Error parsing structured data:', error);
          outlineContent.value = typeof resultAsync === 'string' ? resultAsync : JSON.stringify(resultAsync);
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
  } catch (error) {
    // Handle error
  } finally {
    isLoading.value = false;
  }
};

// Fetch user info
const fetchUserInfo = async () => {
  try {
    const res = await api.userInfo() as any;
    if (res.code == 0) {
      userInfo.value = res.data;
    } else {
      toast(locale.value == 'jp' ? res.msg_jp : res.msg);
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
      userBalance.value = res.data.balance || 0;
    }
  } catch (error) {
    console.error('Error fetching user balance:', error);
  }
}

// Call novelOutline API
const callNovelOutline = async (type: string, retryCount = 0) => {
  try {
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

    if (novelOutlineRes.code !== 200) {
      // Retry once if failed and it's the first attempt
      if (retryCount === 0) {
        console.log('novelOutline failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return callNovelOutline(type, retryCount + 1);
      }
      toast(t('novel.error.fetchFailed'));
      isLoading.value = false;
      return;
    }

    // Get cover task_id from response
    if (novelOutlineRes.data?.task_id) {
      coverTaskId.value = novelOutlineRes.data.task_id;
    } else {
      coverTaskId.value = '';
    }

    // Reset state for new generation
    estimatedTime.value = null;
    originalEstimatedSeconds.value = null;
    displayMinutes.value = 0;
    estimatedTimeFetched.value = false;
    startTime.value = Date.now();
    isGeneratingOutline.value = true;
    isLoading.value = true;
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

      if (novelEstimateRes.code === 200 && novelEstimateRes.data?.in_queue_count > 0) {
        queueInfo.value = {
          count: novelEstimateRes.data.in_queue_count,
          estimatedTime: novelEstimateRes.data.estimated_time || 30 // Default to 30 minutes if not provided
        };
      }
    } catch (error) {
      console.error('Error fetching novel estimate:', error);
    }

    // Fetch detailProject to get task status and task_start_at
    try {
      const detailProjectRes = await api.detailProject(sessionId.value) as any;
      if (detailProjectRes.code === 200 && detailProjectRes.data) {
        taskStatus.value = detailProjectRes.data.status || 'DOING';
        if (detailProjectRes.data.task_start_at) {
          taskStartAt.value = detailProjectRes.data.task_start_at;
        }
        if (detailProjectRes.data.step_name) {
          currentStepName.value = detailProjectRes.data.step_name;
        }
      }
    } catch (error) {
      console.error('Error fetching detailProject:', error);
    }

    // Start outline stream instead of polling
    startOutlineStream();

    // Fetch estimated time after successful novelOutline request
    fetchEstimatedTime();
  } catch (error) {
    console.error('Error calling novelOutline:', error);
    // Retry once if failed and it's the first attempt
    if (retryCount === 0) {
      console.log('novelOutline failed, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return callNovelOutline(type, retryCount + 1);
    }
    toast(t('novel.error.fetchFailed'));
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
          case 10:
            selectedWordCount.value = '100K';
            break;
          case 50:
            selectedWordCount.value = '500K';
            break;
          case 100:
            selectedWordCount.value = '10M';
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

// Fetch chapter stream and handle output via stream_read
const fetchChapterStream = async (chapterIndex: number) => {
  try {
    // Stop any existing stream first
    if (streamReaderController.value) {
      streamReaderController.value.abort();
      streamReaderController.value = null;
    }
    if (printerInterval.value) {
      clearInterval(printerInterval.value);
      printerInterval.value = null;
    }

    // Ensure loading is shown before starting stream
    isLoading.value = true;
    displayedContent.value = '';
    isWaitingForData.value = true;

    const token = localStorage.getItem('token');
    streamReaderController.value = new AbortController();

    const response = await fetch(`${aiUrl}app/stream_read/${sessionId.value}`, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'token': token || '',
      },
      signal: streamReaderController.value.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream');
    }

    const decoder = new TextDecoder();
    let pendingText = '';      // Full text to display (producer writes here)
    let pendingConsumed = 0;   // How many chars the typewriter has consumed
    let streamDone = false;
    let lastContent = '';      // Track the latest content from SSE to detect incremental vs full replacement
    let sseBuffer = '';        // Buffer for incomplete SSE lines
    let autoScroll = true;
    let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;

    // Hide skeleton once we start the typewriter
    displayedContent.value = '';
    isWaitingForData.value = true;

    // Wait for DOM to mount chapter content view
    await nextTick();

    let programmaticScroll = false;
    const handleScroll = () => {
      if (programmaticScroll) return;
      autoScroll = false;
      if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        autoScroll = true;
      }, 3000);
    };

    // Wait for DOM to update and get scroll element
    await nextTick();
    await nextTick();
    let scrollElement = chapterContentRef.value;

    // If scroll element not found, try to get it after a short delay
    if (!scrollElement) {
      await new Promise(resolve => setTimeout(resolve, 100));
      scrollElement = chapterContentRef.value;
    }

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      scrollElement.scrollTop = 0;
    }

    const doAutoScroll = () => {
      if (scrollElement) {
        // Force scroll to bottom
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };

    // Start typewriter timer: 30ms per character
    isChapterTyping.value = true;
    const typewriterTimer = setInterval(() => {
      if (pendingConsumed >= pendingText.length) {
        // Nothing to consume, check if stream is done
        if (streamDone) {
          clearInterval(typewriterTimer);
          isChapterTyping.value = false;
          isWaitingForData.value = false;
          if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
          if (scrollElement) {
            scrollElement.removeEventListener('scroll', handleScroll);
          }
        } else {
          // Waiting for more data from stream
          isWaitingForData.value = true;
        }
        return;
      }

      isWaitingForData.value = false;
      pendingConsumed++;
      displayedContent.value = pendingText.substring(0, pendingConsumed);

      // Use nextTick to ensure DOM is updated before scrolling
      nextTick(() => {
        doAutoScroll();
      });
    }, 30);

    // Hide skeleton once typewriter starts
    isLoading.value = false;

    // Read SSE stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      sseBuffer += chunk;

      // Process complete lines from buffer
      const lines = sseBuffer.split('\n');
      // Keep the last element (may be incomplete line)
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Extract data after "data:" prefix
        let dataStr = '';
        if (trimmedLine.startsWith('data: ')) {
          dataStr = trimmedLine.substring(6);
        } else if (trimmedLine.startsWith('data:')) {
          dataStr = trimmedLine.substring(5);
        } else {
          continue; // Skip non-data lines
        }

        if (!dataStr) continue;

        // Parse JSON and extract content
        try {
          const jsonData = JSON.parse(dataStr);

          // Extract chapter info from JSON if available
          if (jsonData.chapter_number !== undefined) {
            const chapterNum = jsonData.chapter_number;
            const chapterTitle = jsonData.title || '';
            if (currentChapter.value && currentChapter.value.chapter !== chapterNum) {
              currentChapter.value.chapter = chapterNum;
            }
            if (currentChapter.value && chapterTitle) {
              currentChapter.value.title = chapterTitle;
            }
          }

          if (jsonData.content) {
            const newContent = jsonData.content;

            // The SSE may send full content each time (replacement) or incremental
            // If new content starts with old content, it's a replacement — take the new part
            if (lastContent && newContent.startsWith(lastContent)) {
              const increment = newContent.substring(lastContent.length);
              if (increment) {
                pendingText += increment;
              }
            } else if (lastContent && newContent.length > lastContent.length) {
              // Full replacement with more content
              pendingText = filterChapterContent(newContent);
              pendingConsumed = Math.min(pendingConsumed, pendingText.length);
            } else if (!lastContent) {
              // First content received
              pendingText = filterChapterContent(newContent);
            }

            lastContent = newContent;
          }
        } catch (e) {
          // Not valid JSON, skip
        }
      }
    }

    // Process any remaining buffer
    if (sseBuffer.trim()) {
      const trimmedLine = sseBuffer.trim();
      let dataStr = '';
      if (trimmedLine.startsWith('data: ')) {
        dataStr = trimmedLine.substring(6);
      } else if (trimmedLine.startsWith('data:')) {
        dataStr = trimmedLine.substring(5);
      }
      if (dataStr) {
        try {
          const jsonData = JSON.parse(dataStr);
          if (jsonData.content) {
            const newContent = jsonData.content;
            if (lastContent && newContent.startsWith(lastContent)) {
              const increment = newContent.substring(lastContent.length);
              if (increment) pendingText += increment;
            } else if (!lastContent || newContent.length > lastContent.length) {
              pendingText = filterChapterContent(newContent);
              pendingConsumed = Math.min(pendingConsumed, pendingText.length);
            }
            lastContent = newContent;
          }
        } catch (e) {}
      }
    }

    // Mark stream as done
    streamDone = true;

    // Update final state
    taskStatus.value = 'SUCCESS';
    generatingChapter.value = null;
    hasFailed.value = false;
    if (currentChapter.value) {
      currentChapter.value.content = pendingText;
    }

    // Start polling for cover image if task_id exists
    if (coverTaskId.value) {
      startCoverPolling(coverTaskId.value);
    }

    // Keep currentChapter to display content with cover below

  } catch (error: any) {
    if (error.name === 'AbortError') return;
    hasFailed.value = true;
    taskStatus.value = 'FAIL';
    isLoading.value = false;
    isChapterTyping.value = false;
    stopCoverPolling();
  }
};

// Filter chapter content: remove # CH header and verification text
const filterChapterContent = (content: string): string => {
  let result = content;
  const chapterStartMatch = result.match(/# CH\d+/);
  if (chapterStartMatch && chapterStartMatch.index !== undefined) {
    result = result.substring(chapterStartMatch.index + chapterStartMatch[0].length);
    result = result.replace(/\\n/g, '\n');
  }
  const verifyMatch = result.indexOf('让我验证衔接一致性：');
  if (verifyMatch > -1) {
    result = result.substring(0, verifyMatch);
  }
  return result;
};

// Fetch novel outline with complete API flow
const fetchNovelOutline = async () => {
  if (isFetchingNovelOutline.value) {
    return;
  }
  isFetchingNovelOutline.value = true;
  isLoading.value = true;
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

    if (detailProjectRes.code !== 200) {
      toast(t('novel.error.fetchFailed'));
      isLoading.value = false;
      isFetchingNovelOutline.value = false;
      return;
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

      // Set initial state based on step_name
      if (currentStepName.value == 'outline') {
        // Show novel outline area
        currentChapter.value = null;

        // Check if outline is being generated
        const stepStatus = detailProjectRes.data?.step_status;

        if (stepStatus === 'DOING') {
          // Outline is being generated - show loading state
          isLoading.value = true;
          hasFailed.value = false;
          taskStatus.value = 'DOING';
          isGeneratingOutline.value = true;
          lastGenerationType.value = 'outline';
          startTime.value = Date.now();
          fetchEstimatedTime();

          // Start outline stream
          startOutlineStream();
        }
      } else if (currentStepName.value == 'chapter') {
        // Show chapter area
        const stepStatus = detailProjectRes.data?.step_status;
        const chapterStreamUrl = detailProjectRes.data?.chapter_stream_url;
        const chapterIndex = detailProjectRes.data?.step_chapter_index;
        const resultAsync = detailProjectRes.data?.result_async;

        // First, try to get outline data from result_async if available
        if (resultAsync && !outlineData.value) {
          try {
            let outlineResult = resultAsync;
            if (typeof outlineResult === 'string') {
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
            if (outlineData.value?.base_info?.title) {
              projectName.value = outlineData.value.base_info.title;
            }
          } catch (error) {
            console.error('Error parsing outline from result_async:', error);
          }
        }

        // Set stepChapterIndex to the current chapter index
        if (chapterIndex) {
          stepChapterIndex.value = chapterIndex;

          // Check if chapterIndex is greater than chapters length, add generating chapter if needed
          const existingChapter = chapters.value.find((c: any) => c.chapter === chapterIndex);
          if (!existingChapter && (stepStatus === 'PREPARE' || stepStatus === 'DOING')) {
            // Get chapter title from outline data if available
            const chapterData = outlineData.value?.outline?.find((c: any) => c.chapter === chapterIndex);
            chapters.value.push({
              id: `temp-${chapterIndex}`,
              chapter: chapterIndex,
              title: chapterData?.title || t('novel.untitled'),
              is_publish: 2 // 未发布状态
            });
          }
        }

        if (stepStatus === 'SUCCESS' && chapterIndex) {
          // Chapter generation completed - fetch and display the chapter content
          try {
            const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;
            if (chapterRes.code === 200 && chapterRes.data) {
              const chapterData = chapters.value.find((c: any) => c.chapter === chapterIndex);
              currentChapter.value = {
                chapter: chapterIndex,
                title: chapterData?.title || chapterRes.data.title || '',
                content: chapterRes.data.content || ''
              };
              taskStatus.value = 'SUCCESS';
              hasFailed.value = false;

              // Process content: handle escape characters and filter
              let content = chapterRes.data.content || '';
              content = content.replace(/\\n/g, '\n');

              displayedContent.value = content;

              // Scroll to top
              nextTick(() => {
                if (chapterContentRef.value) {
                  chapterContentRef.value.scrollTop = 0;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching chapter data:', error);
          }
          isLoading.value = false;
          isFetchingNovelOutline.value = false;
          return;
        }

        if ((stepStatus === 'PREPARE' || stepStatus === 'DOING') && chapterIndex) {
          // Set up chapter state before streaming
          const chapterData = chapters.value.find((c: any) => c.chapter === chapterIndex);
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          displayedContent.value = '';
          isLoading.value = true;
          hasFailed.value = false;
          taskStatus.value = 'DOING';
          lastGenerationType.value = 'chapter';
          isGeneratingOutline.value = false;
          generatingChapter.value = chapterIndex;
          currentStepName.value = 'chapter';

          // Fetch estimated time
          estimatedTime.value = null;
          originalEstimatedSeconds.value = null;
          displayMinutes.value = 0;
          estimatedTimeFetched.value = false;
          startTime.value = Date.now();
          fetchEstimatedTime();

          // Call fetchChapterStream to handle chapter streaming
          await fetchChapterStream(chapterIndex);
          // Return early to avoid polling logic
          isLoading.value = false;
          isFetchingNovelOutline.value = false;
          return;
        } else if (stepStatus === 'FAIL' && chapterIndex) {
          // Chapter generation failed - show failed state
          const chapterData = chapters.value.find((c: any) => c.chapter === chapterIndex);
          currentChapter.value = {
            chapter: chapterIndex,
            title: chapterData?.title || '',
            content: ''
          };
          displayedContent.value = '';
          hasFailed.value = true;
          taskStatus.value = 'FAIL';
          generatingChapter.value = chapterIndex;
          currentStepName.value = 'chapter';
          lastGenerationType.value = 'chapter';

          // Fetch points estimate
          await fetchPointsEstimate();
          isLoading.value = false;
          isFetchingNovelOutline.value = false;
          return;
        } else if (chapterIndex) {
          // step_status is SUCCESS or other non-DOING state: fetch chapter detail and display directly
          try {
            const chapterRes = await api.detailChapter(sessionId.value, chapterIndex) as any;
            if (chapterRes.code === 200 && chapterRes.data) {
              const chapterData = chapters.value.find((c: any) => c.chapter === chapterIndex);
              currentChapter.value = {
                chapter: chapterIndex,
                title: chapterData?.title || chapterRes.data.title || '',
                content: chapterRes.data.content || ''
              };
              currentStepName.value = 'chapter';
              taskStatus.value = 'SUCCESS';

              // Process content: handle escape characters and filter
              let content = chapterRes.data.content || '';
              content = content.replace(/\\n/g, '\n');

              currentChapter.value.content = content;
              displayedContent.value = content;
            }
          } catch (error) {
            console.error('Error fetching chapter data:', error);
          }

          // Fetch points estimate for chapter step
          await fetchPointsEstimate();
          // Return early to avoid polling logic
          isLoading.value = false;
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
      } else {
        const initialPollingRes = await api.taskPolling(sessionId.value) as any;

        if (initialPollingRes.code !== 200) {
          toast(initialPollingRes.message);
          isLoading.value = false;
          return;
        }

        const status = initialPollingRes.data?.status;
        taskStatus.value = status;

        if (status == 'DOING' && currentStepName.value !== 'chapter') {
          startTime.value = Date.now();
          isGeneratingOutline.value = !currentChapter.value;
          isLoading.value = true;
          // Start outline stream instead of polling
          startOutlineStream();
          fetchEstimatedTime();
          // Fetch queue info
          try {
            const novelEstimateRes = await api.novelEstimate({ session_id: sessionId.value }) as any;
            if (novelEstimateRes.code === 200 && novelEstimateRes.data?.in_queue_count > 0) {
              queueInfo.value = {
                count: novelEstimateRes.data.in_queue_count,
                estimatedTime: novelEstimateRes.data.estimated_time || 30
              };
            }
          } catch (error) {
            console.error('Error fetching novel estimate:', error);
          }
        } else if (status != 'SUCCESS' && status != 'FAIL') {
          callNovelOutline('new');
        } else if (status == 'SUCCESS') {
          isLoading.value = false;
          hasFailed.value = false;
          const result = initialPollingRes.data?.result;
          handleStructuredData(result);
        } else if (status == 'FAIL') {
          isLoading.value = false;
          hasFailed.value = true;
          outlineContent.value = initialPollingRes.data?.error_msg || initialPollingRes.data?.result || t('novel.error.generationFailed');
        }
      }
    } else {
      // If result_async has value and step_name is outline, no need to poll
      if (currentStepName.value === 'outline') {
        isLoading.value = false;
        hasFailed.value = false;
        // Try to parse result_async if it's available
        if (detailProjectRes.data?.result_async) {
          try {
            let result = detailProjectRes.data.result_async;
            // Check if result is string and parse it
            if (typeof result === 'string') {
              result = JSON.parse(result);
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
      } else {
        const initialPollingRes = await api.taskPolling(sessionId.value) as any;
        if (initialPollingRes.code == 200) {
          const status = initialPollingRes.data?.status;
          taskStatus.value = status;
          if (status == 'DOING') {
            startTime.value = Date.now();
            fetchEstimatedTime();
            // Fetch queue info
            try {
              const novelEstimateRes = await api.novelEstimate({ session_id: sessionId.value }) as any;
              if (novelEstimateRes.code === 200 && novelEstimateRes.data?.in_queue_count > 0) {
                queueInfo.value = {
                  count: novelEstimateRes.data.in_queue_count,
                  estimatedTime: novelEstimateRes.data.estimated_time || 30
                };
              }
            } catch (error) {
              console.error('Error fetching novel estimate:', error);
            }
          }
        }

        if (currentStepName.value !== 'chapter') {
          // Start outline stream instead of polling
          startOutlineStream();
        }
      }
    }
  } catch (error) {
    toast(t('Fail'));
    isLoading.value = false;
  }
};

// Handle polling response
const handlePollingResponse = (pollingRes: any) => {
  if (pollingRes.code != 200) {
    return;
  }

  const status = pollingRes.data?.status;
  taskStatus.value = status;

  if (status == 'SUCCESS') {
    // Stop polling
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }

    // If outline stream is done, don't process polling result again
    if (outlineStreamDone.value) {
      return;
    }

    isLoading.value = false;
    hasFailed.value = false;
    generatingChapter.value = null;
    const result = pollingRes.data?.result;
    handleStructuredData(result);
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
    generatingChapter.value = null;
    outlineContent.value = pollingRes.data?.error_msg || pollingRes.data?.result || t('novel.error.generationFailed');
  } else if (status != 'DOING') {
    // Stop polling if status is not DOING, SUCCESS, or FAIL
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  }
};

// Start polling for task status
const startPolling = () => {
  // Clear any existing polling interval
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }

  // Start outline stream if generating outline
  if (isGeneratingOutline.value && !outlineStreamParser.value) {
    startOutlineStream();
  }

  // Start polling every 3 seconds
  pollingInterval.value = window.setInterval(async () => {
    try {
      const pollingRes = await api.taskPolling(sessionId.value) as any;
      handlePollingResponse(pollingRes);
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }, 3000);
};

// Handle click outside cover edit section
function handleClickOutside(event: MouseEvent) {
  // Check if cover edit section is open
  if (isEditingCover.value && coverEditSectionRef.value) {
    // Check if click is inside cover edit section
    if (!coverEditSectionRef.value.contains(event.target as Node)) {
      // If showing result, show exit confirmation
      if (showCoverResult.value) {
        showExitConfirmModal.value = true;
      }
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchUserInfo();
  fetchUserBalance();
  fetchNovelOutline();
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// Handle before unload event
function handleBeforeUnload(event: BeforeUnloadEvent) {
  // Check if there's an unprocessed cover generation result
  if (showCoverResult.value) {
    // This will trigger the browser's default confirmation dialog
    event.preventDefault();
    event.returnValue = '';
    return '';
  }
}

onBeforeUnmount(() => {
  if (printerInterval.value) {
    clearInterval(printerInterval.value);
  }
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }
  if (streamReaderController.value) {
    streamReaderController.value.abort();
  }
  if (outlineStreamParser.value) {
    outlineStreamParser.value.destroy();
  }
  stopCoverPolling();
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

class OutlineStreamParser {
  onText: (text: string) => void;
  onComplete: (text: string, data?: any) => void;
  onError: (error: string) => void;
  t: (key: string) => string;

  rawBuf: string = '';
  jsonBuf: string = '';
  jsonStarted: boolean = false;
  pendingText: string = '';
  pendingConsumed: number = 0;
  displayedText: string = '';
  typewriterTimer: ReturnType<typeof setInterval> | null = null;

  parseStage: number = 0;
  parsedTitle: boolean = false;
  parsedTotalChapters: boolean = false;
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
      if (err.name === 'AbortError') {
        return;
      }
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
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

    if (this.parseStage === 0) {
      if (!this.headerWritten) {
        this.pendingText += `${this.t('novel.novelOutline')}\n\n${this.t('novel.basicInfo')}\n`;
        this.headerWritten = true;
      }

      if (!this.parsedTitle) {
        const m = s.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          this.novelTitle = m[1].replace(/\\"/g, '"');
          this.pendingText += `${this.t('novel.title')}：${this.novelTitle}\n`;
          this.parsedTitle = true;
        }
      }

      if (!this.parsedTotalChapters) {
        const m = s.match(/"total_chapters"\s*:\s*(\d+)/);
        if (m) {
          this.totalChapters = parseInt(m[1]);
          this.pendingText += `${this.t('novel.totalChapters')}：${this.totalChapters} ${this.t('novel.chaptersLabel')}\n`;
          this.parsedTotalChapters = true;
        }
      }

      if (!this.parsedGenre) {
        const m = s.match(/"genre"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const genre = m[1].replace(/\\"/g, '"');
          if (genre) this.pendingText += `${this.t('novel.genreLabel')}：${genre}\n`;
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
        this.parseStage = 1;
      }
    }

    if (this.parseStage === 1) {
      if (!this.parsedSummary) {
        const m = s.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          const summary = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          this.pendingText += `${this.t('novel.storySummary')}\n${summary}\n\n`;
          this.parsedSummary = true;
        }
      }

      if (s.includes('"characters"')) {
        this.parseStage = 2;
      }
    }

    if (this.parseStage === 2) {
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
        this.parseStage = 3;
      }
    }

    if (this.parseStage === 3) {
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
        this.pendingText += `${this.t('novel.chapterLabel')}${chNum} ${chTitle}\n`;
        this.pendingText += `${chDesc}\n\n`;
      }
    }
  }

  _onStreamDone() {
    const waitTimer = setInterval(() => {
      if (this.pendingConsumed >= this.pendingText.length) {
        clearInterval(waitTimer);
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);

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
    text += `${this.t('novel.title')}：${bi.title || this.t('novel.untitled')}\n`;
    text += `${this.t('novel.totalChapters')}：${bi.total_chapters || 0} ${this.t('novel.chaptersLabel')}\n`;
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
        text += `${this.t('novel.chapterLabel')}${ch.chapter} ${ch.title || ''}\n`;
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
async function toggleCoverEdit() {
  isEditingCover.value = !isEditingCover.value;
  if (isEditingCover.value) {
    // Reset cover input
    combinedCoverItems.value = [];
    uploadedCoverImages.value = [];
    coverInputKey.value++;

    // Fetch cover cost when opening edit modal
    try {
      const coverEstimateRes = await api.novelEstimate({
        session_id: sessionId.value,
        step_name: 'cover'
      }) as any;
      if (coverEstimateRes.code == 200 && coverEstimateRes.data?.total_points) {
        coverCost.value = coverEstimateRes.data.total_points;
      }
    } catch (error) {
      console.error('Error fetching cover cost:', error);
    }

    nextTick(() => {
      if (coverInputRef.value) {
        coverInputRef.value.focus();
      }
    });
  }
}

// Cancel cover action
function cancelCoverAction() {
  showCoverActionConfirmModal.value = false;
}

// Confirm cover action
function confirmCoverAction() {
  showCoverActionConfirmModal.value = false;

  isGeneratingCover.value = false;
  showCoverResult.value = false;
  generatedCover.value = '';
  isEditingCover.value = false;
  showCoverEditBtn.value = true;
}

function handleCoverInput() {
  if (!coverInputRef.value) return;

  const text = coverInputRef.value.innerText || coverInputRef.value.textContent || "";

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  const match = textBefore.match(/([#@])([^#@\s]*)$/);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];

    if (trigger === "@") {
      showCoverAtDropdown.value = true;
      lastCoverRange.value = range.cloneRange();
      updateCoverAtDropdownItems();
    } else {
      showCoverAtDropdown.value = false;
    }
  } else {
    showCoverAtDropdown.value = false;
  }
}

function handleCoverKeydown(event: KeyboardEvent) {
  if (isCoverComposing.value) return;

  if (event.key === "Escape") {
    showCoverAtDropdown.value = false;
  } else if (event.key === "Enter") {
    event.preventDefault();
    generateNovelCover();
  }
}

function handleCoverInputClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match && match[1] === "@") {
    showCoverAtDropdown.value = true;
    lastCoverRange.value = range.cloneRange();
    updateCoverAtDropdownItems();
  } else {
    showCoverAtDropdown.value = false;
  }
}

function handleCoverInputBlur() {
  setTimeout(() => {
    showCoverAtDropdown.value = false;
  }, 200);
}

function handleCoverPaste(event: ClipboardEvent) {
  // Handle paste event if needed
}

function handleCoverInputFocus() {
  // Handle focus event if needed
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
  formData.append('mode', 'normal');

  const parma = {
    method: "POST",
    headers: {
      token: token,
    },
    body: formData,
  };

  const res = await fetch(`${baseUrl}user/uploadImage`, parma);
  const data = await res.json();
  if (data.code === 0 || data.code === 200) {
    return data.data.url || '';
  } else {
    throw new Error(data.msg);
  }
}

// Handle cover file change
async function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  isUploading.value = true;

  try {
    const filesArray = Array.from(files);
    const uploadPromises = filesArray.map(async (file, index) => {
      try {
        const uploadedUrl = await uploadCoverImage(file);
        const imageId = Date.now() + index;
        uploadedCoverImages.value.push({
          id: imageId,
          image: uploadedUrl,
          file: file
        });
        combinedCoverItems.value.push({
          id: imageId,
          type: 'image',
          image: uploadedUrl
        });
      } catch (error) {
        console.error('Upload error for file', file.name, error);
        toast(t('fail'));
      }
    });

    await Promise.all(uploadPromises);
  } catch (error) {
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
  uploadedCoverImages.value = uploadedCoverImages.value.filter(img => img.id !== imageId);
  combinedCoverItems.value = combinedCoverItems.value.filter(item => item.id !== imageId);
}

function selectCoverAtItem(item: any) {
  if (!lastCoverRange.value || !coverInputRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  const range = lastCoverRange.value;
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

  // Insert the selected item
  const span = document.createElement("span");
  span.className = `tag ${item.type === 'character' ? 'character' : 'image'}`;
  span.contentEditable = "false";
  span.innerHTML = `@${item.name || `img${uploadedCoverImages.value.findIndex(img => img.id === item.id) + 1}`}`;
  span.style.color = "#00d3f2";

  range.insertNode(span);

  // Insert a space after the tag
  const space = document.createTextNode(" ");
  range.setStartAfter(span);
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  showCoverAtDropdown.value = false;
  coverInputRef.value.focus();
}

function updateCoverAtDropdownItems() {
  // Only include uploaded images
  const images = uploadedCoverImages.value.map(img => ({
    id: img.id,
    type: 'image',
    image: img.image
  }));

  coverAtDropdownItems.value = images;
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
  if (combinedCoverItems.value.length >= 5) {
    toast(t('home.itemLimitReached'));
    return false;
  }
  return true;
}

// Process prompt to replace image spans with <ref_X> format
function processCoverPrompt() {
  if (!coverInputRef.value) return '';

  // Get all span elements in the input
  const spans = coverInputRef.value.querySelectorAll('span.uploaded-image-item');
  let prompt = coverInputRef.value.innerText || coverInputRef.value.textContent || "";

  // Replace each span with <ref_X> format
  spans.forEach((span, index) => {
    const imageIndex = index + 1;
    prompt = prompt.replace(span.textContent || '', `<ref_${imageIndex}>`);
  });

  return prompt.trim();
}

// Abandon generated cover
function abandonCover() {
  showCoverResult.value = false;
  generatedCover.value = '';
  isEditingCover.value = false;
  showCoverEditBtn.value = true;
}

// Use generated cover
async function useCover() {
  try {
    // Call API to save novel cover
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${aiUrl}ai/novel/save_novel_cover'`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        cover_url: generatedCover.value
      })
    });

    const res = await response.json();

    if (res.code == 200) {
      // Cover saved successfully
      novelCover.value = generatedCover.value;
      showCoverResult.value = false;
      isEditingCover.value = false;
      showCoverEditBtn.value = true;
      toast(t('novel.coverGenerated'));
    } else {
      showCoverEditBtn.value = true;
      toast(res.message || t('novel.coverGenerateFailed'));
    }
  } catch (error) {
    console.error('Error saving cover:', error);
    showCoverEditBtn.value = true;
    toast(t('novel.coverGenerateFailed'));
  }
}

// Zoom cover image
function zoomCoverImage(imageUrl: string) {
  zoomedCoverImage.value = imageUrl;
  showCoverZoomModal.value = true;
}

function closeCoverZoomModal() {
  showCoverZoomModal.value = false;
  zoomedCoverImage.value = '';
}

async function generateNovelCover() {
  if (!coverInputRef.value) return;

  const prompt = processCoverPrompt();
  if (!prompt) {
    toast(t('novel.coverInputEmpty'));
    return;
  }

  try {
    // Prepare reference images
    const newReferenceImages = uploadedCoverImages.value.map(img => img.image);

    // Start generating cover
    isGeneratingCover.value = true;
    showCoverEditBtn.value = false;

    // Call API to renew novel cover
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${aiUrl}ai/novel/renew_novel_cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        prompt: prompt,
        new_reference_images: newReferenceImages
      })
    });

    const res = await response.json();

    if (res.code == 200 && res.data.url) {
      // Cover generated successfully
      generatedCover.value = res.data.result.generate_novel_cover;
      showCoverResult.value = true;
      isGeneratingCover.value = false;
    } else {
      isGeneratingCover.value = false;
      showCoverEditBtn.value = true;
      toast(res.message || t('novel.coverGenerateFailed'));
    }
  } catch (error) {
    console.error('Error generating cover:', error);
    isGeneratingCover.value = false;
    showCoverEditBtn.value = true;
    toast(t('novel.coverGenerateFailed'));
  }
}
</script>

<style scoped lang="scss">
 @use '@/scss/NovelGenerate.scss';
</style>
