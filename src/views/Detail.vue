<template>
  <div class="detail-view">
    <div class="close-page-btn" @click="closePage">
      <span></span>
    </div>

    <UploadMask :visible="isLoading" :text="t('userHome.loading')"></UploadMask>

    <UploadMask :visible="isUploading" :text="t('detail.uploading')"></UploadMask>

    <div class="main-container">
      <div class="left-panel">
        <div class="media-container">
          <template v-if="detail.type === '3'">
            <div class="video-wrapper">
              <div v-if="!isVideoLocked">
                <video
                  ref="videoRef"
                  class="video-player"
                  :src="detail.videoUrl"
                  :poster="detail.cover"
                  playsinline
                  @play="isPlaying = true"
                  @pause="isPlaying = false"
                  @timeupdate="onTimeUpdate"
                  @loadedmetadata="onLoadedMetadata"
                  @error="onVideoError"
                  @click="togglePlay"
                ></video>

                <div class="play-overlay" v-show="!isPlaying" @click="togglePlay">
                  <img src="@/assets/images/detail/play.png" alt="Play" />
                </div>
              </div>

              <div v-if="isVideoLocked" class="video-lock-overlay">
                <img class="lock_bg" src="@/assets/images/detail/lock_pic.png" alt="" />

                <div class="lock-content">
                  <img class="lock-icon" src="@/assets/images/detail/lock.png" alt="" />
                  <div class="lock-info">
                    <!-- Paid content lock -->
                    <template v-if="isPaidContentLocked">
                      <span class="lock-txt">{{ t("detail.lock.tip") }}</span>
                      <span class="lock-btn" @click="onSubscribe">
                        {{ t("detail.lock.subscribe") }}
                      </span>
                    </template>
                    <!-- Teenager or sensitive content lock -->
                    <template v-else-if="isSensitiveContentLocked">
                      <span class="lock-txt">{{ t("detail.lock.sensitiveContent") }}</span>
                      <span class="lock-btn" @click="navigateToProfileSettings">
                        {{ t("detail.lock.profileSettings") }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- <template v-else-if="detail.type === '1'">
            <div class="image-gallery">
              <div class="gallery-counter" v-if="(detail.images?.length || 0) > 1">
                {{ currentImageIndex + 1 }}/{{ detail.images?.length || 0 }}
              </div>

              <div class="gallery-content" ref="galleryContentRef">
                <template v-if="isImageLocked(currentImageIndex)">
                  <div class="locked-view">
                    <img class="lock-icon" src="@/assets/images/detail/lock.png" alt="Locked" />
                    <div class="lock-tip">
                      <span>{{ t("detail.lock.tip") }}</span>
                      <span class="subs-btn" @click="onSubscribe">
                        {{ t("detail.lock.subscribe") }}
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <img
                    class="current-image"
                    :src="detail.images[currentImageIndex]?.image_url || ''"
                    alt=""
                    @click="openLargeViewer(1)"
                  />
                </template>
              </div>

              <div
                class="gallery-nav prev"
                :class="currentImageIndex <= 0 ? 'dis' : ''"
                @click.stop="prevImage"
                v-if="detail.images.length > 1"
              >
                <span></span>
              </div>
              <div
                class="gallery-nav next"
                :class="currentImageIndex >= detail.images.length - 1 ? 'dis' : ''"
                @click.stop="nextImage"
                v-if="detail.images.length > 1"
              >
                <span></span>
              </div>
            </div>
          </template> -->

          <!-- <template v-else-if="detail.type === '2'">
            <div class="article-cover" @click="openLargeViewer(2)">
              <img :src="detail.cover" alt="Cover" />
            </div>
          </template> -->
        </div>

        <!-- Page Navigation Arrows (Bottom Right) -->
        <div class="nav-arrows">
          <button class="nav-btn up" @click.stop="goPrev" v-if="!isFirst"></button>
          <button class="nav-btn down" @click.stop="goNext" v-if="!isLast"></button>
        </div>
      </div>

      <!-- Right Side: Info & Comments -->
      <div class="right-panel">
        <!-- Right Header: User Info & Actions -->
        <div class="right-header" :class="{ 'with-border': isScrolled }">
          <div class="user-info" @click="navigateToUserHome">
            <img class="avatar" :src="detail.author.avatar" alt="" />
            <span class="nickname">{{ detail.author.nickname }}</span>
          </div>

          <div v-if="detail.author.id != uid">
            <button
              class="follow-btn"
              :class="{ followed: detail.isFollowed }"
              @click="toggleFollow"
            >
              <img v-if="!detail.isFollowed" src="@/assets/images/detail/follow.png" alt="" />
              <span>{{ detail.isFollowed ? t("detail.followed") : t("detail.follow") }}</span>
            </button>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="scroll-content" ref="scrollContentRef" @scroll="handleScroll">
          <!-- Article Content Mode -->
          <div v-if="detail.type === '2'" class="article-body">
            <div class="header-actions">
              <div class="perm-tag">{{ permText }}</div>
            </div>

            <h1 class="post-title">{{ detail.title }}</h1>

            <div class="article-text" :class="{ collapsed: !isArticleExpanded }">
              <div v-html="detail.articleHtml"></div>
            </div>

            <div class="article-actions" v-if="shouldShowExpand">
              <div
                class="expand-btn"
                :class="isArticleExpanded ? 'hide' : ''"
                @click="toggleExpand"
              >
                <img :src="isArticleExpanded ? expandIcon : collapseIcon" alt="" />
                {{ isArticleExpanded ? t("detail.collapse") : t("detail.expand") }}
              </div>
            </div>

            <div class="article-lock" v-if="isArticleLocked">
              <div class="lock-overlay">
                <img src="@/assets/images/detail/lock.png" alt="" />

                <div class="lock-info">
                  <span class="lock-txt">{{ t("detail.lock.tip") }}</span>
                  <button class="lock-btn" @click="onSubscribe">
                    {{ t("detail.lock.subscribe") }}
                  </button>
                </div>

              </div>
            </div>

            <div class="post-time-box article-meta">
              <span class="post-time">{{ detail.time }}</span>
              <div class="more-menu-wrap" ref="headerMoreRef" v-if="detail.author.id != uid">
                <div class="more-btn" @click.stop="toggleHeaderMore">
                  <img src="@/assets/images/detail/menu.png" alt="" />
                </div>
                <div class="dropdown-menu" v-if="headerMoreVisible">
                  <span class="menu-item" @click="openReportModal('post', detail.id)">
                    {{ t("detail.report") }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Standard Content Mode (Video/Image) -->
          <div v-else class="post-info">
            <div class="header-actions">
              <div class="perm-tag">{{ permText }}</div>
            </div>
            <h1 class="post-title">{{ detail.title }}</h1>
            <p class="post-desc" v-html="formatContent(detail.description)"></p>

            <div class="post-time-box">
              <span class="post-time">{{ detail.time }}</span>

              <div class="more-menu-wrap" ref="headerMoreRef" v-if="detail.author.id != uid">
                <div class="more-btn" @click.stop="toggleHeaderMore">
                  <img src="@/assets/images/detail/menu.png" alt="" />
                </div>
                <div class="dropdown-menu" v-if="headerMoreVisible">
                  <span class="menu-item" @click="openReportModal('post', detail.id)">
                    {{ t("detail.report") }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="comments-section">
            <div class="comments-header">
              <span>{{ t("detail.comments", { num: totalComments }) }}</span>
            </div>

            <div class="comments-list" ref="commentsListRef">
              <!-- Loading State -->
              <div v-if="isLoadingComments" class="loading-more">
                <div class="loading-spinner"></div>
                <p>{{ t('detail.loadingComments') }}</p>
              </div>

              <!-- Empty State -->
              <EmptyState v-if="comments.length === 0 && !isLoadingComments" class="empty-with-padding"></EmptyState>

              <!-- Comments List -->
              <div v-if="comments.length > 0 && !isLoadingComments" class="comment-item" v-for="c in comments" :key="c.id">
                <div class="comment-main">
                  <img class="c-avatar" :src="c.avatar" alt="" />
                  <div class="c-content">
                    <div class="c-header">
                      <span class="c-author">{{ c.author }}</span>
                      <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, c.id)">
                        <button class="c-more-btn" @click.stop="toggleCommentMore(c.id)">
                          <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                        </button>
                        <div class="dropdown-menu" v-if="activeCommentMoreId === c.id">
                          <span class="menu-item" @click="openReportModal('comment', c.id)">
                            {{ t("detail.report") }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p class="c-text" v-html="formatContent(c.text)"></p>

                    <div class="c-media" v-if="c.images && c.images.length > 0">
                      <div class="c-images">
                        <div class="c-image"
                          v-for="(imgUrl, index) in c.images"
                          :key="index"
                          @click="previewCommentImage(imgUrl.image_url)">
                          <img
                            :src="imgUrl.image_url"
                            alt=""
                          />
                        </div>
                      </div>
                    </div>

                    <div class="c-media" v-if="c.video_url">
                      <div class="c-video">
                        <div class="video-wrapper">
                          <video
                            :src="c.video_url.trim()"
                            class="c-video-player"
                            :poster="getVideoPoster(c.video_url.trim())"
                            controls
                          ></video>
                        </div>
                        <img
                          src="@/assets/images/detail/zoom.png"
                          alt=""
                          class="zoom-icon"
                          @click.stop="fullscreenCommentVideo(c.video_url.trim())"
                        />
                      </div>
                    </div>

                    <div class="c-footer">
                      <span class="c-time">{{ c.created_at }}</span>
                      <div class="c-actions">
                        <div
                          class="action-btn like-btn"
                          :class="{ active: c.liked }"
                          @click="toggleCommentLike(c)"
                        >
                          <b></b>
                          <span>{{ c.likes }}</span>
                        </div>
                        <div class="action-btn reply-btn" @click="startReply(c)">
                          <b></b>
                          <span>{{ t("detail.reply") }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Replies -->
                <div class="replies-list" v-if="c.showingReplies && c.replies && c.replies.length > 0">
                  <div class="reply-item" v-for="r in c.replies" :key="r.id">
                    <img class="c-avatar" :src="r.avatar" alt="" />
                    <div class="c-content">
                      <div class="c-header">
                        <div class="author-wrap">
                          <span class="c-author">{{ r.author }}</span>
                          <span class="reply-to" v-if="r.reply_to_user_nickname != ''">@{{ r.reply_to_user_nickname }}</span>
                        </div>
                        <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, r.id)">
                          <button class="c-more-btn" @click.stop="toggleCommentMore(r.id)">
                            <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                          </button>
                          <div class="dropdown-menu" v-if="activeCommentMoreId === r.id">
                            <span class="menu-item" @click="openReportModal('reply', r.id)">
                              {{ t("detail.report") }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p class="c-text" v-html="formatContent(r.text)"></p>

                    <!-- Reply Media (Images and Videos) -->
                    <div class="c-media" v-if="r.images && r.images.length > 0">
                      <div class="c-images">
                        <div class="c-image"
                          v-for="(imgUrl, index) in r.images"
                          :key="index"
                          @click="previewCommentImage(imgUrl.image_url)">
                          <img
                            :src="imgUrl.image_url"
                            alt=""
                          />
                        </div>
                      </div>
                    </div>

                    <div class="c-media" v-if="r.video_url">
                      <div class="c-video">
                        <video
                          :src="r.video_url.trim()"
                          class="c-video-player"
                          controls
                          @click="toggleCommentVideoPlay"
                        ></video>
                      </div>
                    </div>

                    <div class="c-footer">
                      <span class="c-time">{{ r.created_at }}</span>
                      <div class="c-actions">
                        <div
                          class="action-btn like-btn"
                          :class="{ active: r.liked }"
                          @click="toggleReplyLike(r)"
                        >
                          <b></b>
                          <span>{{ r.likes }}</span>
                        </div>
                        <div class="action-btn reply-btn" @click="startReply(c, r)">
                          <b></b>
                          <span>{{ t("detail.reply") }}</span>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <!-- Expand/Collapse Replies Button -->
                  <div class="replies-btn" v-if="c.showingReplies && c.hasMoreReplies" @click="expandReplies(c)">
                    <img src="@/assets/images/detail/show.png" />
                    <span v-if="c.replies.length === 1">
                      {{ t("detail.expandReplies") }} {{ c.reply_count - 1 }} {{ t("detail.moreReplies") }}
                    </span>
                    <span v-else>
                      {{ t("detail.loadMoreReplies") }}
                    </span>
                  </div>

                  <!-- Collapse Replies Button -->
                  <div class="replies-btn hide" v-if="c.showingReplies && !c.hasMoreReplies && c.replies.length > 1" @click="collapseReplies(c)">
                    <img src="@/assets/images/detail/hide.png" />
                    <span>{{ t("detail.collapseReplies") }}</span>
                  </div>
                </div>
              </div>

              <!-- Loading More -->
              <div v-if="loadingMore" class="loading-more">
                <div class="loading-spinner"></div>
                <span>{{ t('detail.loading') }}</span>
              </div>

              <!-- No More Comments -->
              <div v-if="!loadingMore && !hasMoreComments && comments.length > 0" class="no-more">
                {{ t('detail.noMore') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Footer -->
        <div class="right-footer" ref="rightFooterRef" :class="{ 'is-inputting': isInputting }">
          <div v-if="!isInputting" class="footer-default">
            <div class="fake-input" @click="activateInput">
              {{ t('detail.addComment') }}
            </div>
            <div class="footer-actions">
              <div class="icon-action footer-like" :class="{ active: liked }" @click="toggleLike">
                <b></b>
                <span>{{ formatNumber(likes) }}</span>
              </div>
              <div class="icon-action footer-share" @click="share">
                <b></b>
                <span>{{ t("detail.share") }}</span>
              </div>
            </div>
          </div>

          <div v-else class="footer-input">
            <div class="reply-indicator" v-if="replyingTo">
              <div class="reply-author">@{{ replyingTo.author }}</div>
              <div class="reply-text">{{ replyingTo.text }}</div>
            </div>
            <div class="input-wrapper">
              <div
                ref="commentInputRef"
                class="real-input"
                :class="{ 'empty': isInputEmpty }"
                :contenteditable="true"
                :data-placeholder="t('detail.topicMention')"
                @input="handleInput"
                @keydown="handleKeydown"
                @compositionstart="handleCompositionStart"
                @compositionend="handleCompositionEnd"
                @paste="handlePaste"
                @click="handleInputClick"
                @blur="onInputBlur"
              ></div>

              <span class="char-count" :class="{ 'over-limit': currentLength > MAX_LENGTH }">{{ currentLength }}/{{ MAX_LENGTH }}</span>

              <div class="input-footer">
                <div class="uploaded-files" v-if="uploadedFiles.length">
                  <div class="file-item" v-for="(file, index) in uploadedFiles" :key="index">
                    <div v-if="file.type === 'video'" class="video-preview" @click="previewFileItem(file, index)">
                      <video :src="videoUrl" muted></video>
                      <img class="video-icon" src="@/assets/images/detail/play.png" alt="" />
                    </div>
                    <img v-else :src="file.url" alt="" @click="previewFileItem(file, index)" />

                    <img src="@/assets/images/project/delete.png" class="remove-file" @click="removeFile(index)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="input-bottom">
              <div class="upload-btn-box">
                <img src="@/assets/images/detail/upload-image.png" alt="" @click="triggerFileUpload('image')" />
                <img src="@/assets/images/detail/upload-video.png" alt="" @click="triggerFileUpload('video')" />
              </div>

              <div class="input-actions">
                <span class="cancel-btn" @click="cancelInput"></span>
                <span class="send-btn" @click="submitComment"></span>
              </div>
            </div>

            <!-- Mention/Topic Dropdown -->
            <div
              v-if="showDropdown"
              class="mention-dropdown"
            >
              <div class="dropdown-list">
                <div
                  v-for="item in dropdownItems"
                  :key="item.value"
                  class="dropdown-item"
                  @click="selectDropdownItem(item)"
                >
                  <div class="item-left">
                    <img v-if="dropdownType === '@'" :src="item.avatar" class="avatar" alt="" />
                    <span class="label">{{ dropdownType + item.label }}</span>
                  </div>
                  <div class="item-right">
                    <span class="stats">
                      {{ dropdownType === '#' ? `${item.views} views` : `${item.followers} followers` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- File Inputs (Hidden) -->
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden-file-input"
            @change="handleFileUpload"
          />
          <input
            ref="videoInputRef"
            type="file"
            accept="video/*"
            class="hidden-file-input"
            @change="handleFileUpload"
          />
        </div>
      </div>
    </div>

    <!-- Large Image Viewer -->
    <ImageViewer
      :visible="showLargeViewer"
      :images="largeImage"
      :initial-index="currentImageIndex"
      @close="closeLargeViewer"
    />

    <ReportModal
      v-if="reportTarget"
      v-model:visible="reportModalVisible"
      :title="reportModalTitle"
      :options="reportOptions"
      :targetType="reportTarget"
      @submit="handleReportSubmit"
    />

    <PreviewModal
      :visible="showPreviewModal"
      :videoUrl="curVideoUrl"
      @close="closePreviewModal"
    />

    <PreviewBig
      :visible="showBigViewer"
      :videoUrl="curVideoUrl"
      @close="closeBigViewer"
    />
  </div>
</template>

<script setup lang="ts" name="Detail">
import ReportModal from "@/components/ReportModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import PreviewBig from "@/components/PreviewBig.vue";
import router from "@/router";
import { useRoute } from "vue-router";
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { formatTimestamp } from "@/util/utils";
import collapseIcon from "@/assets/images/detail/show.png";
import expandIcon from "@/assets/images/detail/hide.png";
import api from "@/api/index";
import EmptyState from "@/components/EmptyState.vue";
import { baseUrl } from "@/util/config";

const { t, locale } = useI18n();
const route = useRoute();

// --- State ---
const id = ref<number>(Number(route.query.id));
const isPlaying = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const isLoading = ref(false);

// --- New State for Image/Article ---
const currentImageIndex = ref(0);
const showLargeViewer = ref(false);
const showBigViewer = ref(false);
const isArticleExpanded = ref(false);
const zoomLevel = ref(100);

// Video State
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);

// Comment Video State
const commentVideoRef = ref<HTMLVideoElement | null>(null);

// Header & Report
const headerMoreVisible = ref(false);
const headerMoreRef = ref<HTMLElement | null>(null);
const reportModalVisible = ref(false);
const reportTarget = ref<{ type: string; id: number } | null>(null);

const reportModalTitle = computed(() => {
  if (reportTarget.value?.type === "comment" || reportTarget.value?.type === "reply") {
    return t("report.commentTitle");
  }
  return t("report.workTitle");
});

const reportOptions = computed(() => {
  if (reportTarget.value?.type === "comment" || reportTarget.value?.type === "reply") {
    return [
      { label: t("report.reasons.unfriendly"), value: "Unfriendly & Provocative" },
      { label: t("report.reasons.scam"), value: "Scam Information" },
      { label: t("report.reasons.suicide"), value: "Suspected Self-harm/Suicide" },
      { label: t("report.reasons.porn"), value: "Pornographic & Obscene" },
      { label: t("report.reasons.illegal"), value: "Illegal & Rule-Breaking" },
      { label: t("report.reasons.political"), value: "Politically Sensitive" },
      { label: t("report.reasons.spam"), value: "Spam/Unqualified Ads" },
      { label: t("report.reasons.irrelevant"), value: "Content Irrelevant" },
      { label: t("report.reasons.other"), value: "Other" },
    ];
  }

  return [
    { label: t("report.reasons.porn"), value: "Pornographic & Obscene" },
    { label: t("report.reasons.political"), value: "Politically Sensitive" },
    { label: t("report.reasons.publicOrder"), value: "Violation of Public Order" },
    { label: t("report.reasons.danger"), value: "Endangering Personal Safety" },
    { label: t("report.reasons.clickbait"), value: "Clickbait" },
    { label: t("report.reasons.uncomfortable"), value: "Causing Discomfort" },
    { label: t("report.reasons.scam"), value: "Scam Information" },
    { label: t("report.reasons.induce"), value: "Inducing Likes/Follows" },
    { label: t("report.reasons.plagiarism"), value: "Plagiarism/Reprinting" },
    { label: t("report.reasons.copyright"), value: "Copyright Infringement" },
    { label: t("report.reasons.notInList"), value: "Not in the list above" },
  ];
});

// Comments
const activeCommentMoreId = ref<number | null>(null);
const commentMoreRefs = ref<Map<number, HTMLElement>>(new Map());
const isInputting = ref(false);
const commentText = ref("");
const commentInputRef = ref<HTMLElement | null>(null);
const replyingTo = ref<any | null>(null); // Comment or Reply object
const currentLength = ref(0);
const isScrolled = ref(false);
const scrollContentRef = ref<HTMLElement | null>(null);
const commentsListRef = ref<HTMLElement | null>(null);
const isComposing = ref(false);
const isMultiline = ref(false);
const rightFooterRef = ref<HTMLElement | null>(null);
const galleryContentRef = ref<HTMLElement | null>(null);
const isInputEmpty = ref(true); // Track if input is empty

// Constants
const MAX_LENGTH = 280;
const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;

// Dropdown state for # and @
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<any[]>([]);
const lastRange = ref<Range | null>(null);

// File upload state
const uploadedFiles = ref<any[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const videoUrl = ref('');
const videoSize = ref(0);

// Preview modal state
const showPreviewModal = ref(false);
const previewFile = ref<any>(null);
const previewFiles = ref<any[]>([]);
const currentPreviewIndex = ref(0);
const curVideoUrl = ref('')

const uid = localStorage.getItem('uid');

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface imgItem {
  image_url: string;
}

const largeImage = ref([] as imgItem[])
const bigImage = ref([] as imgItem[])

// Detail Data
const detail = ref({
  id: id.value,
  author: {
    avatar: "",
    nickname: "",
    id: ""
  },
  isFollowed: false,
  time: "",
  title: "",
  description: "",
  type: "", // video, image, article
  videoUrl: "",
  cover: "",
  images: [] as imgItem[],
  articleHtml: "",
  content: "",
  permission: "public", // public, private, partial
  subscriptionPlans: [] as string[],
  isSubscribed: false,
  commentsEnabled: true,
  isLast: false,
  likes: 0,
  liked: false,
  is_teenager: 1,
  is_nsfw: '1'
});

const likes = ref(0);
const liked = ref(false);

// Navigation arrows
const hasPrev = ref(false);
const hasNext = ref(false);
const prevId = ref<string | null>(null);
const nextId = ref<string | null>(null);

const comments = ref<any[]>([]);
const totalComments = ref('');
const loadingMore = ref(false);
const isLoadingComments = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const hasMoreComments = ref(true);

// Format content with # and @ highlights
function formatContent(content: string): string {
  if (!content) return "";

  let result = content;

  // 处理 #标签
  // 匹配规则：# 前面是开头、空格、特殊字符或任意字符，# 后面匹配完整词组（直到遇到空格、@、# 或其他特殊字符）
  // 使用负向后顾(?<!<a[^>]*>) 避免处理已经转换的链接
  result = result.replace(/(^|[\s\u00A0]|(?<!<a[^>]*>).?)#([a-zA-Z0-9\u4e00-\u9fa5_.\-]+)(?=\s|@|#|$|[^\w\u4e00-\u9fa5_.\-])/g, (match, prefix, tag) => {
    // 如果prefix是完整的字符（不是空格或开头），需要保留它
    const preservePrefix = prefix && prefix !== ' ' && prefix !== '\u00A0' && prefix !== '';
    const displayPrefix = preservePrefix ? prefix : (prefix || '');
    return `${displayPrefix}<a href="javascript:void(0)" class="tag-link" style="color: #00d3f2; cursor: pointer;" onclick="window.searchByTag('#${tag}')">#${tag}</a>`;
  });

  // 处理 @提及
  // 匹配规则：@ 前面是开头、空格、特殊字符或任意字符，@ 后面匹配完整词组（包括域名格式和多个@）
  // 支持: @user, @user@domain.com, @herui@ifensi.com 等格式
  // 匹配直到遇到空格、# 或其他特殊字符（但保留@符号用于邮箱格式）
  result = result.replace(/(^|[\s\u00A0]|(?<!<a[^>]*>).?)@([a-zA-Z0-9\u4e00-\u9fa5_.\-@]+)(?=\s|#|$|(?![a-zA-Z0-9\u4e00-\u9fa5_.\-@]))/g, (match, prefix, mention) => {
    // 避免重复处理已经转换的链接
    if (match.includes('</a>') || match.includes('href=')) {
      return match;
    }
    // 如果prefix是完整的字符（不是空格或开头），需要保留它
    const preservePrefix = prefix && prefix !== ' ' && prefix !== '\u00A0' && prefix !== '';
    const displayPrefix = preservePrefix ? prefix : (prefix || '');
    return `${displayPrefix}<a href="javascript:void(0)" class="mention-link" style="color: #00d3f2; cursor: pointer;" onclick="window.searchByMention('@${mention}')">@${mention}</a>`;
  });

  return result;
}

// API Data Load
async function fetchDetail(newId: number) {
  try {
    // Update id value first
    id.value = newId;

    // Set loading state before fetching
    isLoading.value = true;
    comments.value = [];
    isLoadingComments.value = true;

    // Fetch post detail from API
    const res = await api.postDetail(newId) as any;

    if (res.code == 0 || res.code == 200) {
      const data = res.data.post;

      detail.value = {
        id: data.id || newId,
        author: res.data.author,
        isFollowed: data.is_followed || false,
        time: formatTimestamp(data.created_at) || "",
        title: data.title || "",
        description: data.content || data.description || "",
        type: data.type,
        videoUrl: data.video_url || "",
        cover: data.cover || "",
        images: res.data.images || [],
        articleHtml: formatContent(data.content || ""),
        content: data.content || "",
        permission: data.access_rights == '2' ? "partial" : data.access_rights == '0' ? "private" : "public",
        subscriptionPlans: data.subscription_plans || data.plans || [],
        isSubscribed: data.is_subscribed || false,
        commentsEnabled: data.comments_enabled !== false,
        isLast: data.is_last || false,
        likes: data.likes || data.like_count || 0,
        liked: !!(data.is_liked),
        is_teenager: data.is_teenager,
        is_nsfw: data.is_nsfw || '1'
      };

      totalComments.value = res.data.comment_total || '';

      // Update local state
      likes.value = Number(detail.value.likes);
      liked.value = detail.value.liked;

      // Store navigation info
      if (res.data.posts) {
        hasPrev.value = !!res.data.posts.prev_id;
        hasNext.value = !!res.data.posts.next_id;
        prevId.value = res.data.posts.prev_id;
        nextId.value = res.data.posts.next_id;
      } else {
        hasPrev.value = false;
        hasNext.value = false;
        prevId.value = null;
        nextId.value = null;
      }
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)

      detail.value = {
        id: newId,
        author: {
          avatar: "",
          nickname: "",
          id: ""
        },
        isFollowed: false,
        time: "",
        title: "",
        description: "",
        type: "1",
        videoUrl: "",
        cover: "",
        images: [],
        articleHtml: "",
        content: "",
        permission: "public",
        subscriptionPlans: [],
        isSubscribed: false,
        commentsEnabled: true,
        isLast: false,
        likes: 0,
        liked: false,
        is_teenager: 1,
        is_nsfw: '1'
      };
      likes.value = 0;
      liked.value = false;
      comments.value = [];
      totalComments.value = '';
    }
  } catch (error) {
    toast(t('fail'));

    // Clear data on error
    detail.value = {
      id: newId,
      author: {
        avatar: "",
        nickname: "",
        id: ""
      },
      isFollowed: false,
      time: "",
      title: "",
      description: "",
      type: "1",
      videoUrl: "",
      cover: "",
      images: [],
      articleHtml: "",
      content: "",
      permission: "public",
      subscriptionPlans: [],
      isSubscribed: false,
      commentsEnabled: true,
      isLast: false,
      likes: 0,
      liked: false,
      is_teenager: 1,
      is_nsfw: '1'
    };
    likes.value = 0;
    liked.value = false;
    comments.value = [];
    totalComments.value = '';
  } finally {
    isLoading.value = false;
  }

  // Reset states
  currentImageIndex.value = 0;
  isArticleExpanded.value = false;

  // Load comments after fetching detail
  await loadComments();
}

// Search functions for # and @
function searchByTag(tag: string) {
  const url = router.resolve({ path: "/search", query: { keyword: tag.substring(1), type: "post" } }).href;
  window.open(url, "_blank");
}

async function searchByMention(mention: string) {
  try {
    // Extract username from mention (remove @ symbol)
    const username = mention.substring(1);

    // Call getUserId API to get user ID
    const res = await api.getUserId({ nickname: username }) as any;

    if (res.code === 0 || res.code === 200) {
      const userId = res.data?.user_id
      if (userId) {
        // Navigate to user home page
        const url = router.push({ path: "/user-home", query: { id: userId } });
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    toast(t('fail'));
  }
}

(window as any).searchByTag = searchByTag;
(window as any).searchByMention = searchByMention;

async function loadComments(page: number = 1, append: boolean = false) {
  // Set loading state
  if (append) {
    loadingMore.value = true;
  } else {
    isLoadingComments.value = true;
  }

  try {
    const res = await api.commentList(id.value, page, pageSize) as any;
    if (res.code === 0 || res.code === 200) {
      const newComments = (res.data.data || []).map((comment: any) => {
        const commentObj: any = {
          id: comment.id || comment.comment_id || Date.now(),
          author: comment.author || comment.nickname || "",
          avatar: comment.avatar || "",
          text: comment.text || comment.content || "",
          likes: comment.like_count || 0,
          liked: comment.is_liked == 1 || false,
          images: comment.images || [],
          video_url: comment.video_url || "",
          created_at: comment.created_at || "",
          reply_count: comment.reply_count || 0,
          replies: [],
          initialReply: null, // Store the first reply from children
          replyPage: 0,
          replyTotal: comment.reply_count || 0,
          hasMoreReplies: false,
          showingReplies: false
        };

        // If comment has children, store the first one as initial reply
        if (comment.children && comment.children.length > 0) {
          const firstChild = comment.children[0];
          commentObj.initialReply = {
            id: firstChild.id || firstChild.reply_id || Date.now(),
            author: firstChild.author || firstChild.nickname || firstChild.user?.nickname || "",
            avatar: firstChild.avatar || firstChild.user?.avatar || "",
            text: firstChild.text || firstChild.content || "",
            created_at: firstChild.created_at || "",
            likes: firstChild.like_count || 0,
            liked: firstChild.is_liked == 1 || false,
            replyTo: firstChild.replyTo || firstChild.reply_to || firstChild.target_user || "",
            reply_to_user_nickname: firstChild.reply_to_user_nickname || ""
          };
          // Show the initial reply
          commentObj.replies = [commentObj.initialReply];
          commentObj.showingReplies = true;
          commentObj.hasMoreReplies = comment.reply_count > 1;
        }

        return commentObj;
      });

      if (append) {
        comments.value = [...comments.value, ...newComments];
      } else {
        comments.value = newComments;
      }

      const totalComments = parseInt(res.data?.allnums) || 0;
      currentPage.value = page;
      hasMoreComments.value = comments.value.length < totalComments;
    } else {
      if (!append) {
        comments.value = [];
      }
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    if (!append) {
      comments.value = [];
    }
  } finally {
    // Clear loading state
    if (append) {
      loadingMore.value = false;
    } else {
      isLoadingComments.value = false;
    }
  }
}

// Load replies for a comment
async function loadReplies(comment: any, page: number = 1) {
  try {
    comment.loadingReplies = true;

    // Load 5 replies per page
    const pageSize = 5;
    const res = await api.replyList(comment.id, page, pageSize) as any;
    if (res.code == 0 || res.code == 200) {
      let repliesData = [];
      if (res.data?.data) {
        repliesData = res.data.data;
      } else {
        repliesData = [];
      }

      let formattedReplies = repliesData.map((reply: any) => ({
        id: reply.id || reply.reply_id || Date.now(),
        author: reply.author || reply.nickname || reply.user?.nickname || "",
        avatar: reply.avatar || reply.user?.avatar || "",
        text: reply.text || reply.content || "",
        created_at: reply.created_at || "",
        likes: reply.like_count || 0,
        liked: reply.is_liked == 1 || false,
        replyTo: reply.replyTo || reply.reply_to || reply.target_user || "",
        reply_to_user_nickname: reply.reply_to_user_nickname || ""
      }));

      // If this is first page and we have an initialReply, filter it out from API response
      if (page === 1 && comment.initialReply) {
        const initialReplyId = comment.initialReply.id;
        formattedReplies = formattedReplies.filter((reply: any) => reply.id !== initialReplyId);
        // Prepend the initialReply to the list
        comment.replies = [comment.initialReply, ...formattedReplies];
      } else if (page > 1) {
        // Append replies for subsequent pages
        comment.replies = [...comment.replies, ...formattedReplies];
      } else {
        // No initialReply, just use API response
        comment.replies = formattedReplies;
      }

      comment.replyPage = page;
      comment.replyTotal = res.data?.allnums || res.data?.total || comment.reply_count || 0;
      comment.hasMoreReplies = comment.replies.length < comment.replyTotal;
    } else {
      // If API fails, keep initialReply if it exists
      if (comment.initialReply && comment.replies.length === 0) {
        comment.replies = [comment.initialReply];
      }
      comment.replyPage = 1;
      comment.replyTotal = comment.reply_count || 0;
      comment.hasMoreReplies = false;
    }
  } catch (error) {
    console.error('Error loading replies:', error);
    toast(t('fail'));
    // Keep initialReply on error
    if (comment.initialReply && comment.replies.length === 0) {
      comment.replies = [comment.initialReply];
    }
    comment.replyPage = 1;
    comment.replyTotal = comment.reply_count || 0;
    comment.hasMoreReplies = false;
  } finally {
    comment.loadingReplies = false;
  }
}

const isFirst = computed(() => !hasPrev.value);
const isLast = computed(() => !hasNext.value);

const permText = computed(() => {
  if (detail.value.permission === "partial") return t("detail.permissionText.partial");
  if (detail.value.permission === "private") return t("detail.permissionText.private");
  return t("detail.permissionText.public");
});

// --- Computed Properties for Logic ---
const isImageLocked = (index: number) => {
  if (detail.value.permission !== "partial") return false;
  if (detail.value.isSubscribed) return false;
  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;
  // If paid and not subscribed, lock all images except the first one
  return index > 0;
};

const isArticleLocked = computed(() => {
  if (detail.value.permission !== "partial") return false;
  if (detail.value.isSubscribed) return false;
  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;
  // If paid and not subscribed, show lock
  return true;
});

const isPaidContentLocked = computed(() => {
  if (detail.value.permission !== "partial") return false;
  if (detail.value.isSubscribed) return false;
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;
  return true;
});

const isSensitiveContentLocked = computed(() => {
  if (isPaidContentLocked.value) return false;

  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;

  // Check if user is teenager or content is sensitive
  const isTeenager = detail.value.is_teenager == 1;

  return isTeenager;
});

const isVideoLocked = computed(() => {
  return isPaidContentLocked.value || isSensitiveContentLocked.value;
});

const shouldShowExpand = computed(() => {
  // Simple check: if article length is long enough
  return detail.value.articleHtml.length > 500;
});

const hasPrevImage = computed(() => {
  if (detail.value.type === "1") return currentImageIndex.value > 0;
  return false; // Article cover only has 1 image usually, or handle array if needed
});

const hasNextImage = computed(() => {
  if (detail.value.type === "1")
    return currentImageIndex.value < (detail.value.images?.length || 0) - 1;
  return false;
});

function onTimeUpdate(e: Event) {
  const v = e.target as HTMLVideoElement;
  currentTime.value = v.currentTime;
  duration.value = v.duration || 0;
}

function onLoadedMetadata(e: Event) {
  const v = e.target as HTMLVideoElement;
  duration.value = v.duration;
  v.volume = volume.value;
}

function onVideoError(e: Event) {
  const v = e.target as HTMLVideoElement;
  toast(t('detail.videoLoadingFailed'));
}

function seekVideo(e: MouseEvent) {
  if (!videoRef.value || !duration.value) return;
  const bar = e.currentTarget as HTMLElement;
  const rect = bar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, x / rect.width));
  videoRef.value.currentTime = percent * duration.value;
}

function toggleMute() {
  if (!videoRef.value) return;
  if (volume.value > 0) {
    volume.value = 0;
  } else {
    volume.value = 1;
  }
  videoRef.value.volume = volume.value;
}

function updateVolume() {
  if (videoRef.value) {
    videoRef.value.volume = volume.value;
  }
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function zoomIn() {
  if (zoomLevel.value < 100) zoomLevel.value += 10;
}

function zoomOut() {
  if (zoomLevel.value > 10) zoomLevel.value -= 10;
}

function closePage() {
  router.back();
}

function navigateToProfileSettings() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  router.push('/user-personal');
}

function prevImage() {
  if (currentImageIndex.value > 0) {
    const nextIndex = currentImageIndex.value - 1;
    if (galleryContentRef.value) {
      requestAnimationFrame(() => {
        galleryContentRef.value!.style.transition = "none";
        galleryContentRef.value!.style.transform = `translateX(-${nextIndex * 100}%)`;
        galleryContentRef.value!.style.willChange = "transform";

        void galleryContentRef.value!.offsetHeight;

        requestAnimationFrame(() => {
          galleryContentRef.value!.style.transition =
            "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";
          galleryContentRef.value!.style.transform = `translateX(-${nextIndex * 100}%)`;

          currentImageIndex.value = nextIndex;

          setTimeout(() => {
            if (galleryContentRef.value) {
              galleryContentRef.value!.style.willChange = "auto";
            }
          }, 400);
        });
      });
    } else {
      currentImageIndex.value--;
    }
  }
}

function nextImage() {
  // If next image is locked, we still switch to it, but template will show to lock screen
  if (currentImageIndex.value < (detail.value.images?.length || 0) - 1) {
    const nextIndex = currentImageIndex.value + 1;
    if (galleryContentRef.value) {

      requestAnimationFrame(() => {
        galleryContentRef.value!.style.transition = "none";
        galleryContentRef.value!.style.transform = `translateX(-${nextIndex * 100}%)`;
        galleryContentRef.value!.style.willChange = "transform";

        void galleryContentRef.value!.offsetHeight;

        requestAnimationFrame(() => {
          galleryContentRef.value!.style.transition =
            "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";
          galleryContentRef.value!.style.transform = `translateX(-${nextIndex * 100}%)`;

          currentImageIndex.value = nextIndex;

          setTimeout(() => {
            if (galleryContentRef.value) {
              galleryContentRef.value!.style.willChange = "auto";
            }
          }, 400);
        });
      });
    } else {
      currentImageIndex.value++;
    }
  }
}

function openLargeViewer(type: number) {
  if (type == 2) {
    const obj = {
      image_url: detail.value.cover
    }
    largeImage.value.push(obj)
  } else {
    largeImage.value = detail.value.images
  }

  showLargeViewer.value = true;
}

function closeLargeViewer() {
  showLargeViewer.value = false;
}

function closeBigViewer() {
  showBigViewer.value = false;
}

function toggleExpand() {
  isArticleExpanded.value = !isArticleExpanded.value;
}

function onSubscribe() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  router.push(`/subscription-payment?uid=${detail.value.author.id}`);
}

// Navigation
function goPrev() {
  if (isFirst.value || !prevId.value) return;
  router.replace(`/detail?id=${prevId.value}`);
}

function goNext() {
  if (isLast.value || !nextId.value) return;
  router.replace(`/detail?id=${nextId.value}`);
}

// Media
function togglePlay() {
  if (!videoRef.value) {
    console.error('Video element not found');
    return;
  }

  if (!videoRef.value.src) {
    console.error('Video URL is empty:', detail.value.videoUrl);
    toast('Video URL is invalid. Please try again.');
    return;
  }

  if (videoRef.value.paused) {
    console.log('Attempting to play video:', videoRef.value.src);
    videoRef.value.play().then(() => {
      console.log('Video play successful');
      isPlaying.value = true;
    }).catch(error => {
      console.error('Video play failed:', error);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      isPlaying.value = false;
      toast('Video play failed: ' + error.message);
    });
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
  }
}

function toggleCommentVideoPlay(event: Event) {
  event.stopPropagation();
  const video = event.currentTarget as HTMLVideoElement;
  if (video) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
}

// Generate video poster from first frame
function getVideoPoster(videoUrl: string): string {
  // Create a canvas element to capture the first frame
  const canvas = document.createElement('canvas');
  const video = document.createElement('video');

  // Set video source
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';

  // Capture the first frame when video is loaded
  video.addEventListener('loadeddata', () => {
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    // Draw the first frame on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Convert canvas to base64 image
    const posterUrl = canvas.toDataURL('image/jpeg');

    // Update the video's poster attribute
    const videoElements = document.querySelectorAll(`video[src="${videoUrl}"]`);
    videoElements.forEach((el: any) => {
      el.poster = posterUrl;
    });
  });

  // Return empty string initially, poster will be set after video loads
  return '';
}

// Fullscreen play comment video
function fullscreenCommentVideo(videoUrl: string) {
  // Pause all comment videos before opening fullscreen
  const commentVideos = document.querySelectorAll('.c-video-player');
  commentVideos.forEach(video => {
    (video as HTMLVideoElement).pause();
  });

  curVideoUrl.value = videoUrl;
  showBigViewer.value = true;
}

// Header Actions
async function toggleFollow() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  try {
    const authorId = detail.value.author.id;
    if (!authorId) return;

    const data = { followed_id: authorId };
    let res;

    if (detail.value.isFollowed) {
      res = await api.unfollow(data) as any;
    } else {
      res = await api.follow(data) as any;
    }

    if (res.code === 0 || res.code === 200) {
      detail.value.isFollowed = !detail.value.isFollowed;
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

function toggleHeaderMore() {
  headerMoreVisible.value = !headerMoreVisible.value;
}

function openReportModal(type: string, id: number) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  reportTarget.value = { type, id };
  reportModalVisible.value = true;
  headerMoreVisible.value = false;
  activeCommentMoreId.value = null;
}

function handleReportSubmit(data: any) {
  toast(t("detail.reportSuccess") || "Reported successfully");
}

// Comment Actions
function setCommentMoreRef(el: any, id: number) {
  if (el) commentMoreRefs.value.set(id, el as HTMLElement);
}

function toggleCommentMore(id: number) {
  if (activeCommentMoreId.value === id) {
    activeCommentMoreId.value = null;
  } else {
    activeCommentMoreId.value = id;
  }
}

async function toggleCommentLike(c: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    const res = await api.likeComment({ comment_id: c.id, action: c.liked ? 'unlike' : 'like' }) as any;
    if (res.code === 0 || res.code === 200) {
      c.liked = !c.liked;
      c.likes = parseInt(c.likes) + (c.liked ? 1 : -1);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function toggleReplyLike(r: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    const res = await api.likeComment({ comment_id: r.id, action: r.liked ? 'unlike' : 'like' }) as any;
    if (res.code === 0 || res.code === 200) {
      r.liked = !r.liked;
      r.likes = parseInt(r.likes) + (r.liked ? 1 : -1);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    console.error('Error toggling reply like:', error);
    toast(t('fail'));
  }
}

// Footer / Input
function activateInput() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return false;
  }

  isInputting.value = true;
  nextTick(() => {
    commentInputRef.value?.focus();
    // adjustHeight();
    updateScrollContentPadding();
  });
}

function cancelInput() {
  isInputting.value = false;
  replyingTo.value = null;
  commentText.value = "";
  currentLength.value = 0;
  uploadedFiles.value = [];
  nextTick(() => {
    updateScrollContentPadding();
  });
}

// Handle # and @ input functionality
function handleInput() {
  const el = commentInputRef.value;
  if (!el) return;

  const text = el.innerText || el.textContent || "";
  currentLength.value = text.length;
  commentText.value = text;
  isInputEmpty.value = text.trim() === "";

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  const match = textBefore.match(/([#@])([^#@\s]*)$/);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];

    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

// Debounced search function
const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
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
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

function handleInputClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  const el = commentInputRef.value;
  if (!el) return;

  const text = el.innerText || el.textContent || "";

  if (text.length >= MAX_LENGTH && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    return;
  }

  if ((event.key === " " || event.key === "Spacebar") && !isComposing.value) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBefore = textNode.textContent?.substring(0, range.startOffset) || "";
      const match = textBefore.match(/#([^\s#@]+)$/);

      if (match) {
        // Count existing topic tags (with class "tag topic")
        const existingTopicTags = el.querySelectorAll('.tag.topic');
        if (existingTopicTags.length >= 5) {
          event.preventDefault();
          toast(t('detail.maxTopicsReached') || 'Maximum 5 topics allowed');
          return;
        }

        event.preventDefault();

        const fullMatch = match[0]; // e.g., "#hello"
        const matchStartIndex = match.index!;

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

        updateCommentStats();
        return;
      }
    }
  }

  // Handle Backspace key
  if (event.key === "Backspace" && !isComposing.value) {
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
          event.preventDefault();
          span.remove();
          showDropdown.value = false; // Hide dropdown when tag is deleted
          updateCommentStats();
          return;
        }
      }

      // Case 3: Handle when there's no text node after the tag yet
      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === "SPAN") {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains("tag")) {
            event.preventDefault();
            span.remove();
            showDropdown.value = false; // Hide dropdown when tag is deleted
            updateCommentStats();
            return;
          }
        }
      }
    }
  }
}

function updateCommentStats() {
  if (commentInputRef.value) {
    const text = commentInputRef.value.innerText || "";
    currentLength.value = text.length;
    commentText.value = text;
  }
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !commentInputRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  if (dropdownType.value === "#") {
    const topicCount = commentInputRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      toast(t("detail.maxTopicsReached") || "Maximum 5 topics allowed");
      showDropdown.value = false;
      return;
    }
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
  span.innerText = dropdownType.value === "@" ? "@" + item.label : "#" + item.label;
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

  showDropdown.value = false;
  updateCommentStats();
  commentInputRef.value.focus();
}

// File upload functionality
function triggerFileUpload(type: "image" | "video") {
  // Validate file upload limits
  const hasVideo = uploadedFiles.value.some(file => file.type === "video");
  const imageCount = uploadedFiles.value.filter(file => file.type === "image").length;

  if (type === "video") {
    if (hasVideo) {
      toast(t('detail.uploadTip'));
      return;
    }
    if (imageCount > 0) {
      toast(t('detail.uploadTip'));
      return;
    }
    videoInputRef.value?.click();
  } else {
    if (hasVideo) {
      toast(t('detail.uploadTip'));
      return;
    }
    if (imageCount >= MAX_IMAGES) {
      toast(t('detail.uploadTip'));
      return;
    }
    imageInputRef.value?.click();
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const hasVideo = uploadedFiles.value.some(file => file.type === "video");
  const imageCount = uploadedFiles.value.filter(file => file.type === "image").length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileType = file.type.startsWith("image/") ? "image" : "video";

    // Validate file type and limits
    if (fileType === "video") {
      if (hasVideo) {
        toast(t('detail.uploadTip'));
        break;
      }
      if (imageCount > 0) {
        toast(t('detail.uploadTip'));
        break;
      }
      if (uploadedFiles.value.length >= MAX_VIDEOS) {
        toast(t('detail.uploadTip'));
        break;
      }

      // Upload video using three-step process
      await uploadVideo(file);
    } else {
      if (hasVideo) {
        toast(t('detail.uploadTip'));
        break;
      }
      if (imageCount >= MAX_IMAGES) {
        toast(t('detail.uploadTip'));
        break;
      }

      // Upload image
      await uploadImage(file);
    }
  }

  // Reset input
  input.value = "";
}

async function uploadVideo(file: File) {
  isUploading.value = true;

  try {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        videoSize.value = parseFloat((file.size / (1024 * 1024)).toFixed(1));
        resolve(true);
      };
    });

    const videoIdResponse = await api.getVideoId({ filename: file.name }) as any;
    if (!videoIdResponse || videoIdResponse.code !== 0) {
      toast(t('fail'));
      return false;
    }

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
        throw new Error('Failed to get upload URL');
      }

      const presignedUrl = videoUrlResponse.data.url;

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: chunk
      });

      if (!uploadRes.ok) {
        toast(t('fail'));
        return false;
      }

      const etag = uploadRes.headers.get('etag')?.replace(/"/g, '') || '';
      uploadedParts.push({ PartNumber: i, ETag: etag });
    }

    const videoMergeResponse = await api.getVideoMerge({ uploadId, fileKey, parts: uploadedParts }) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      toast(t('fail'));
      return false;
    }

    videoUrl.value = videoMergeResponse.data.url || '';

    uploadedFiles.value.push({
      type: 'video',
      url: videoUrl.value,
      file});
  } catch (error) {
    toast(t('fail'));
  } finally {
    isUploading.value = false;
  }
}

async function uploadImage(file: File) {
  const token = localStorage.getItem("token");
  if (!token) {
    return '';
  }

  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const parma = {
      method: "POST",
      headers: {
        token: token,
      },
      body: formData,
    };

    const res = await fetch(baseUrl + "/user/uploadImage", parma);
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const imageUrl = data.data.url || '';

      uploadedFiles.value.push({
        type: 'image',
        url: imageUrl,
        file
      });
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isUploading.value = false;
  }
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1);
}

function previewFileItem(file: any, index: number) {
  if (file.type === 'image') {
    const uploadedImages = uploadedFiles.value.filter(f => f.type === 'image').map(f => ({ image_url: f.url }));
    largeImage.value = uploadedImages;
    currentImageIndex.value = index;
    showLargeViewer.value = true;
  } else if (file.type === 'video') {
    showPreviewModal.value = true;
  }
}

function closePreviewModal() {
  showPreviewModal.value = false;
  curVideoUrl.value = '';
}

function navigateToUserHome() {
  if (detail.value.author.id) {
    router.push({ path: '/user-home', query: { id: detail.value.author.id } });
  }
}

// Comment media functions
function previewCommentImage(imageUrl: string) {
  largeImage.value = [{ image_url: imageUrl }];
  showLargeViewer.value = true;
}

// function toggleCommentVideoPlay(event: MouseEvent) {
//   const video = event.target as HTMLVideoElement;
//   if (video.paused) {
//     video.play();
//   } else {
//     video.pause();
//   }
// }

function onInputBlur() {
  // Save content to commentText if needed
  if (commentInputRef.value) {
    commentText.value = commentInputRef.value.innerText;
  }

  // 移除自动关闭输入状态的逻辑，输入框在失去焦点时不消失
  // 只有在发布成功或者点击关闭时才消失
}

function startReply(comment: any, reply?: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  replyingTo.value = reply || comment;
  activateInput();
}

function handleScroll() {
  if (scrollContentRef.value) {
    isScrolled.value = scrollContentRef.value.scrollTop > 10;
  }
}

function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd() {
  isComposing.value = false;
  const el = commentInputRef.value;
  if (!el) return;

  let text = el.innerText || el.textContent || "";

  if (text.length > 280) {
    text = text.substring(0, 280);
    el.textContent = text;
    setCaretToEnd(el);
  }
  currentLength.value = text.length;
  commentText.value = text;
  isInputEmpty.value = text.trim() === "";
  detectMultiline();
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") || "";
  if (text) {
    document.execCommand("insertText", false, text);

    setTimeout(() => {
      const el = commentInputRef.value;
      if (!el) return;
      const pastedText = el.innerText || el.textContent || "";
      const limitedText = pastedText.length > 280 ? pastedText.substring(0, 280) : pastedText;
      if (limitedText !== pastedText) {
        el.textContent = limitedText;
        setCaretToEnd(el);
      }
      currentLength.value = limitedText.length;
      commentText.value = limitedText;
      detectMultiline();
    }, 0);
  }
}

function detectMultiline() {
  const el = commentInputRef.value;
  if (!el) return;

  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;

  const newMultilineState = scrollHeight > clientHeight + 10;

  if (newMultilineState !== isMultiline.value) {
    isMultiline.value = newMultilineState;
  }
}

function adjustHeight(el: any) {
  if (!el) return;

  if (isMultiline.value) {
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    if (scrollHeight > 84) {
      el.style.height = "84px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = scrollHeight + "px";
      el.style.overflowY = "auto";
    }
  } else {
    el.style.height = "50px";
    el.style.overflowY = "auto";
  }
}

function setCaretToEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

// Replies expand/collapse
async function expandReplies(c: any) {
  // If only showing 1 reply (initial state with initialReply), load the full first page
  if (c.showingReplies && c.replies.length === 1 && c.reply_count > 1) {
    await loadReplies(c, 1); // Load first page (5 items, filtered)
  } else if (!c.showingReplies) {
    // If collapsed, show the initialReply again
    c.showingReplies = true;
    if (c.initialReply) {
      c.replies = [c.initialReply];
      c.hasMoreReplies = c.reply_count > 1;
    }
  } else if (c.hasMoreReplies) {
    // Load next page if there are more replies (5 per page)
    const nextPage = (c.replyPage || 1) + 1;
    await loadReplies(c, nextPage);
  }
}

async function collapseReplies(c: any) {
  // Reset to showing only initialReply
  c.showingReplies = true;
  if (c.initialReply) {
    c.replies = [c.initialReply];
  } else {
    c.replies = [];
    c.showingReplies = false;
  }
  c.replyPage = 0;
  c.hasMoreReplies = c.reply_count > 1;
}

async function submitComment() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  const text = commentText.value.trim();

  // 验证：文字、图片、视频至少有一种
  if (!text && uploadedFiles.value.length === 0) {
    toast(t('detail.enterComment'));
    return;
  }

  if (currentLength.value > MAX_LENGTH) {
    toast("Exceeded the maximum word count limit");
    return;
  }

  try {
    const commentData: {
      post_id: number;
      parent_id: number;
      content: string;
      video_url: string;
      image_urls: string[];
    } = {
      post_id: id.value,
      parent_id: replyingTo.value?.id || 0,
      content: text,
      video_url: "",
      image_urls: []
    };

    // Handle file uploads if any
    if (uploadedFiles.value.length > 0) {
      // Separate videos and images
      const videos = uploadedFiles.value.filter(file => file.type === 'video');
      const images = uploadedFiles.value.filter(file => file.type === 'image');

      // Set video_url if there's a video
      if (videos.length > 0) {
        commentData.video_url = videos[0].url;
      }

      if (images.length > 0) {
        commentData.image_urls = images.map(img => img.url);
      }
    }

    const response = await fetch(`${baseUrl}comment/createComment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(commentData)
    });

    const res = await response.json();
    if (res.code === 0 || res.code === 200) {
      // 更新评论总数
      const currentTotal = parseInt(totalComments.value) || 0;
      totalComments.value = String(currentTotal + 1);

      await loadComments();

      if (replyingTo.value) {
        const parentComment = comments.value.find((c) => c.id === replyingTo.value.id);
        if (parentComment) {
          await loadReplies(parentComment);
        }
      }

      cancelInput();

      nextTick(() => {
        if (commentsListRef.value) {
          commentsListRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function toggleLike() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    const previousLiked = liked.value;
    const previousLikes = likes.value;

    if (!liked.value) {
      // Like post
      const res = await api.likePost({ post_id: id.value }) as any;
      if (res.code === 0 || res.code === 200) {
        liked.value = true;
        // Use returned like count if available, otherwise increment
        likes.value = Number(res.data?.like_count) ?? (previousLikes + 1);
        detail.value.likes = likes.value;
        detail.value.liked = liked.value;
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    } else {
      // Unlike post
      const res = await api.dislikePost({ post_id: id.value }) as any;
      if (res.code === 0 || res.code === 200) {
        liked.value = false;
        // Use returned like count if available, otherwise decrement
        likes.value = Number(res.data?.like_count) ?? Math.max(0, previousLikes - 1);
        detail.value.likes = likes.value;
        detail.value.liked = liked.value;
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast("Copied to clipboard");
  } catch (e) {
    console.error(e);
  }
}

function formatNumber(n: number) {
  if (n === 0) return '0';
  return n.toLocaleString();
}

// Click Outside to close menus
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  // Header More
  if (headerMoreRef.value && !headerMoreRef.value.contains(target)) {
    headerMoreVisible.value = false;
  }

  // Comment More
  if (activeCommentMoreId.value !== null) {
    const el = commentMoreRefs.value.get(activeCommentMoreId.value);
    if (el && !el.contains(target)) {
      activeCommentMoreId.value = null;
    }
  }

  // Hide mention dropdown when clicking outside
  if (showDropdown.value) {
    const dropdown = document.querySelector('.mention-dropdown');
    const inputWrapper = commentInputRef.value?.parentElement;
    if (dropdown && !dropdown.contains(target) && inputWrapper && !inputWrapper.contains(target)) {
      showDropdown.value = false;
    }
  }

  // Handle tag and mention clicks
  if (target instanceof HTMLElement) {
    if (target.classList.contains('tag-link')) {
      event.preventDefault();
      const tag = target.getAttribute('data-tag');
      if (tag) {
        searchByTag(tag);
      }
    } else if (target.classList.contains('mention-link')) {
      event.preventDefault();
      const mention = target.getAttribute('data-mention');
      if (mention) {
        searchByMention(mention);
      }
    }
  }
}

function updateScrollContentPadding() {
  if (scrollContentRef.value && rightFooterRef.value) {
    const footerHeight = rightFooterRef.value.offsetHeight;
    scrollContentRef.value.style.paddingBottom = `${footerHeight}px`;
  }
}

// Handle scroll to load more comments
function handleCommentsScroll() {
  const scrollContent = document.querySelector('.scroll-content') as HTMLElement;
  if (!scrollContent || loadingMore.value || !hasMoreComments.value) return;

  const scrollTop = scrollContent.scrollTop;
  const scrollHeight = scrollContent.scrollHeight;
  const clientHeight = scrollContent.clientHeight;

  // Check if scrolled to near bottom (within 10px)
  if (scrollHeight - scrollTop - clientHeight <= 10) {
    loadComments(currentPage.value + 1, true);
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);

  fetchDetail(id.value);

  nextTick(() => {
    updateScrollContentPadding();

    // Add scroll listener for loading more comments
    const scrollContent = document.querySelector('.scroll-content');
    if (scrollContent) {
      scrollContent.addEventListener('scroll', handleCommentsScroll);
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    updateScrollContentPadding();
  });

  if (rightFooterRef.value) {
    resizeObserver.observe(rightFooterRef.value);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);

  // Remove scroll listener
  const scrollContent = document.querySelector('.scroll-content');
  if (scrollContent) {
    scrollContent.removeEventListener('scroll', handleCommentsScroll);
  }
});

watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      id.value = Number(newId);
      fetchDetail(Number(newId));
    }
  },
);
</script>

<style scoped lang="scss">
.detail-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 3px solid rgba(251, 100, 182, 0.1);
  border-radius: 50%;
  border-top-color: #fb64b6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* No Comments State */
.no-comments {
  text-align: center;
  padding: 40px 0;
  color: #99a1af;
  font-size: 14px;
}

/* Loading Comments State */
.loading-more {
  text-align: center;
  padding: 2rem 0;
  color: #99a1af;
  font-size: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  padding: 2rem 0;
  color: #99a1af;
  font-size: 1.2rem;
}

/* Tag and Mention Links */
:deep(.tag-link),
:deep(.mention-link) {
  color: #00d3f2;
  text-decoration: none;
  cursor: pointer;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Left Panel */
.left-panel {
  flex: 1;
  background: rgba(251, 100, 182, 0.06);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;

  .video-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .video-player {
      width: 100%;
      height: 100%;
      object-fit: contain;
      vertical-align: middle;
    }

    .video-lock-overlay {
      position: relative;
      width: 100%;
      height: 100%;

      .lock_bg{
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: default;
      }

      .lock-content {
        position: absolute;
        left: 50%;
        top: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%) translateY(-18%);
        cursor: default;
        z-index: 10;

        img {
          width: 11rem;
          height: 11rem;
        }

        .lock-info{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.2rem;
          width: max-content;
          margin-top: 8rem;
          padding: 1rem 2.4rem;
          border-radius: 1rem;
          background: #FFFFFF;
          .lock-txt {
            max-width: 30rem;
            font-size: 1.4rem;
            color: #364153;
          }

          .lock-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fb64b6;
            color: #ffffff;
            height: 4rem;
            padding: 0 2.4rem;
            border-radius: 0.8rem;
            cursor: pointer;
            font-size: 1.4rem;

            &:hover{
              position: relative;

              &::after{
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.2);
                z-index: 100;
              }
            }
          }
        }
      }
    }
  }

  .image-viewer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    overflow: auto;
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .play-overlay,
  .pause-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -42%);
    pointer-events: none;

    img {
      width: 12rem;
      height: 12rem;
    }
  }
}

.nav-arrows {
  position: absolute;
  right: 2.4rem;
  bottom: 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 10;

  .nav-btn {
    width: 4.8rem;
    height: 4.8rem;
    cursor: pointer;

    &.up {
      background: url("@/assets/images/detail/prev.png") no-repeat;
      background-size: 100% 100%;

      &:hover {
        background: url("@/assets/images/detail/prev_hover.png") no-repeat;
        background-size: 100% 100%;
      }

      &.disabled {
        background: url("@/assets/images/detail/prev_dis.png") no-repeat;
        background-size: 100% 100%;
        cursor: not-allowed;
        pointer-events: none;
      }
    }

    &.down {
      background: url("@/assets/images/detail/next.png") no-repeat;
      background-size: 100% 100%;

      &:hover {
        background: url("@/assets/images/detail/next_hover.png") no-repeat;
        background-size: 100% 100%;
      }

      &.disabled {
        background: url("@/assets/images/detail/next_dis.png") no-repeat;
        background-size: 100% 100%;
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }
}

/* Right Panel */
.right-panel {
  position: relative;
  width: 60rem;
  display: flex;
  flex-direction: column;
}

.right-header {
  position: sticky;
  top: 0;
  right: 0;
  padding: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .user-info {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    cursor: pointer;

    .avatar {
      width: 4.8rem;
      height: 4.8rem;
      border-radius: 0.8rem;
      border: 1px solid #fb64b6;
      object-fit: cover;
    }

    .nickname {
      font-size: 1.6rem;
      font-weight: 500;
      color: #101828;
    }
  }

  .follow-btn {
    background: none;
    border: none;
    padding: 0;
    min-width: 13.6rem;
    height: 4.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    gap: 1.2rem;
    font-size: 1.4rem;
    border-radius: 0.8rem;
    color: #ffffff;
    cursor: pointer;
    background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);

    img {
      width: 2rem;
      height: 2rem;
    }

    &.followed {
      border: 1px solid rgba(251, 100, 182, 0.2);
      background: none;
      color: #fb64b6;
    }
  }
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-left: 1.8rem;
  padding-right: 1.8rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin: 0 0 1.2rem;

  .perm-tag {
    padding: 0.7rem 1.2rem;
    border-radius: 0.4rem;
    font-size: 1.2rem;
    background: rgba(251, 100, 182, 0.12);
    color: #fb64b6;
  }
}

.post-info {
  margin: 0 0.6rem 1.8rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);

  .post-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
    margin-bottom: 0.8rem;
    line-height: 1.4;
  }

  .post-desc {
    font-size: 1.4rem;
    color: #364153;
    margin-bottom: 0.8rem;
    word-break: break-all;
    line-height: 1.5;

    :deep(a){
      text-decoration: none;
    }
  }

  .post-time-box {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .post-time {
      font-size: 1.2rem;
      color: #99a1af;
    }

    .more-btn {
      width: 2rem;
      height: 2rem;
      cursor: pointer;

      img {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}

.comments-section {
  .comments-header {
    margin: 0 0.6rem 1.8rem;
    font-size: 1.4rem;
    color: #99a1af;
  }
}

.comment-item {
  margin-bottom: 1.2rem;

  .comment-main {
    display: flex;
    gap: 1.2rem;
    padding: 0.6rem;
    border-radius: 0.8rem;
  }

  .c-avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 0.6rem;
    border: 1px solid #fb64b6;
    object-fit: cover;
    flex-shrink: 0;
  }

  .c-content {
    flex: 1;
    min-width: 0;
  }

  .c-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.6rem;

    .c-author {
      font-size: 1.4rem;
      color: #6a7282;
    }

    .reply-to {
      color: #fb64b6;
      margin-left: 1.2rem;
      font-size: 1.2rem;
    }

    .c-more-btn {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;

      img {
        width: 2rem;
        height: 2rem;
      }
    }
  }

  .comment-main:hover .c-more-btn,
  .reply-item:hover .c-more-btn,
  .c-more-wrap:hover .c-more-btn {
    opacity: 1;
  }

  .c-text {
    font-size: 1.4rem;
    color: #364153;
    line-height: 2rem;
    margin-bottom: 0.6rem;
    word-break: break-all;
  }

  /* Comment Media (Images and Videos) */
  .c-media {
    margin: 0.6rem 0 1rem;

    .c-images {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;

      .c-image {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 10.8rem;
        height: 10.8rem;
        border-radius: 0.8rem;
        background: #F5F5F5;
        cursor: pointer;

        img{
          max-width: 100%;
          width: auto;
          height: 10.8rem;
          border-radius: 0.8rem;
          object-fit: contain;
        }
      }
    }

    .c-video {
      position: relative;
      max-width: 24rem;
      .c-video-player {
        width: 100%;
        max-height: 20rem;
        object-fit: cover;
        border-radius: 0.8rem;
      }

      img{
        position: absolute;
        right: 0.8rem;
        bottom: 0.8rem;
        width: 2.2rem;
        height: 2.2rem;
        cursor: pointer;
        z-index: 5;
      }
    }
  }

  .c-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .c-time {
      font-size: 1.2rem;
      color: #99a1af;
    }

    .c-actions {
      display: flex;
      gap: 1.8rem;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
        color: #6a7282;
        font-size: 1.2rem;

        b {
          width: 1.8rem;
          height: 1.8rem;
        }

        &.like-btn {
          b {
            background: url("@/assets/images/detail/like.png") no-repeat;
            background-size: 100% 100%;
          }

          &:hover {
            b {
              background: url("@/assets/images/detail/like_hover.png") no-repeat;
              background-size: 100% 100%;
            }
          }

          &.active {
            b {
              background: url("@/assets/images/detail/like_active.png") no-repeat;
              background-size: 100% 100%;
            }
          }
        }

        &.reply-btn {
          b {
            background: url("@/assets/images/detail/reply.png") no-repeat;
            background-size: 100% 100%;
          }

          &:hover {
            b {
              background: url("@/assets/images/detail/reply_hover.png") no-repeat;
              background-size: 100% 100%;
            }
          }

          &.active {
            b {
              background: url("@/assets/images/detail/reply_active.png") no-repeat;
              background-size: 100% 100%;
            }
          }
        }
      }
    }
  }
}

.replies-list {
  margin-left: 4.8rem;
  margin-top: 0.4rem;

  .reply-item {
    display: flex;
    gap: 0.8rem;
    margin-bottom: 0.6rem;
    padding: 0.6rem;
    border-radius: 0.8rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .replies-btn {
    margin-left: 0;
    margin-top: 0.8rem;
    margin-bottom: 0.8rem;
  }
}

.comment-item > .replies-btn {
  margin-left: 4.8rem;
  margin-top: 0.8rem;
}

/* Right Footer */
.right-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 60rem;
  padding: 1.8rem 2.4rem;
  border-top: 1px solid rgba(251, 100, 182, 0.2);
  background: #ffffff;
  min-height: 8.6rem;
  display: flex;
  align-items: center;
  z-index: 20;

  &.is-inputting {
    align-items: flex-end;
  }

  .footer-default {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1.2rem;

    .fake-input {
      flex: 1;
      height: 5rem;
      background: #f5f5f5;
      border-radius: 0.8rem;
      padding: 1.2rem;
      display: flex;
      align-items: center;
      color: #99a1af;
      font-size: 1.4rem;
      cursor: text;
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 1.8rem;

      .icon-action {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
        color: #6a7282;
        font-size: 1.4rem;

        b {
          width: 2.4rem;
          height: 2.4rem;
        }

        &.footer-like {
          b {
            background: url("@/assets/images/detail/like.png") no-repeat;
            background-size: 100% 100%;
          }

          &:hover {
            color: #fb64b6;

            b {
              background: url("@/assets/images/detail/like_hover.png") no-repeat;
              background-size: 100% 100%;
            }
          }

          &.active {
            color: #fb64b6;

            b {
              background: url("@/assets/images/detail/like_active.png") no-repeat;
              background-size: 100% 100%;
            }
          }
        }

        &.footer-share {
          b {
            background: url("@/assets/images/detail/share.png") no-repeat;
            background-size: 100% 100%;
          }

          &:hover {
            color: #00d3f2;

            b {
              background: url("@/assets/images/detail/share_hover.png") no-repeat;
              background-size: 100% 100%;
            }
          }

          &.active {
            b {
              background: url("@/assets/images/detail/share_active.png") no-repeat;
              background-size: 100% 100%;
            }
          }
        }
      }
    }
  }

  .footer-input {
    position: relative;
    width: 100%;

    .reply-indicator {
      margin-bottom: 1.2rem;

      .reply-author {
        font-size: 1.2rem;
        margin-bottom: 0.6rem;
        color: #99a1af;
      }
      .reply-text {
        font-size: 1.4rem;
        line-height: 2rem;
        color: #6a7282;
      }
    }

    .input-wrapper {
      position: relative;
      width: 100%;
      min-height: 10rem;
      margin-bottom: 1.2rem;
      padding: 0.8rem 1.2rem 2.4rem;
      border: 1px solid rgba(251, 100, 182, 0.2);
      border-radius: 0.8rem;
      background: #f5f5f5;

      &:focus-within {
        border: 1px solid #fb64b6;
      }

      .real-input{
        width: 100%;
        min-height: 6rem;
        max-height: 12rem;
        cursor: text;
        outline: none;
        overflow-y: auto;
        font-size: 1.4rem;
        line-height: 2rem;
        color: #364153;
        white-space: pre-wrap;
        word-break: break-word;
        position: relative;

        &.empty:before {
          content: attr(data-placeholder);
          position: absolute;
          top: 0;
          left: 0;
          color: #99a1af;
          pointer-events: none;
        }

        :deep(.tag) {
          color: #00d3f2;
          margin-right: 0.4rem;
          user-select: none;
        }
      }

      .char-count {
        position: absolute;
        right: 1.2rem;
        bottom: 0.8rem;
        font-size: 1.2rem;
        color: #99a1af;

        &.over-limit {
          color: #fa2d47;
        }
      }
    }
  }

  .input-actions-top {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.8rem;

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: #f5f5f5;
      border-radius: 0.6rem;
      font-size: 1.2rem;
      color: #6a7282;
      cursor: pointer;

      &.upload-btn {
        padding: 0.5rem;

        img {
          width: 1.6rem;
          height: 1.6rem;
        }
      }
    }
  }

  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.8rem;

    .uploaded-files {
      display: flex;
      gap: 0.8rem;

      .file-item {
        position: relative;
        width: 6.4rem;
        height: 6.4rem;
        border-radius: 0.4rem;
        background: #FFFFFF;
        overflow: hidden;

        img {
          max-width: 100%;
          width: auto;
          height: 6.4rem;
          object-fit: contain;
          cursor: pointer;
        }

        .video-preview {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          .video-icon {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translateX(-50%) translateY(-42%);
            width: 4rem;
            height: 4rem;
            cursor: pointer;
          }
        }

        .remove-file {
          position: absolute;
          top: 0.2rem;
          right: 0.2rem;
          width: 1.6rem;
          height: 1.6rem;
          font-size: 1.4rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  .input-bottom{
    display: flex;
    align-items: center;
    justify-content: space-between;
    .upload-btn-box{
      display: flex;
      align-items: center;
      gap: 1.2rem;
      img{
        width: 3.8rem;
        height: 3.8rem;
        cursor: pointer;
      }
    }

    .input-actions {
      display: flex;
      gap: 0.6rem;

      .cancel-btn {
        width: 5rem;
        height: 5rem;
        background: url("@/assets/images/detail/cancel.png") no-repeat;
        background-size: 100% 100%;
        cursor: pointer;

        &:hover {
          background: url("@/assets/images/detail/cancel_hover.png") no-repeat;
          background-size: 100% 100%;
        }
      }

      .send-btn {
        width: 4.8rem;
        height: 4.8rem;
        background: url("@/assets/images/detail/send.png") no-repeat;
        background-size: 100% 100%;
        cursor: pointer;
        transition: box-shadow 0.2s ease;

        &:hover {
          background: url("@/assets/images/detail/send_hover.png") no-repeat;
          background-size: 100% 100%;
        }
      }
    }
  }
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-left: 1.8rem;
  padding-right: 1.8rem;
  padding-bottom: 8.6rem;
  transition: padding-bottom 0.2s ease;
}

/* Dropdown Menu */
.more-menu-wrap,
.c-more-wrap {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: -1.8rem;
  top: 100%;
  margin-top: 0.2rem;
  background: #ffffff;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.6rem;
  box-shadow: 0px 0px 15px -3px rgba(0, 0, 0, 0.08);
  z-index: 100;
  cursor: pointer;

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 5.8rem;
    height: 2.8rem;
    padding: 0.5rem 1rem;
    font-size: 1.2rem;
    color: #6a7282;
  }
}

.close-page-btn {
  position: fixed;
  top: 2.4rem;
  left: 2.4rem;
  width: 4.8rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 100;
  span {
    width: 4.8rem;
    height: 4.8rem;
    background: url("@/assets/images/detail/close.png");
    background-size: 100% 100%;

    &:hover {
      background: url("@/assets/images/detail/close_hover.png");
      background-size: 100% 100%;
    }
  }
}

/* Video Controls */
.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8rem;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  z-index: 10;
}

.progress-bar-wrap {
  width: 100%;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.progress-bar {
  width: 46rem;
  height: 0.4rem;
  background: #4b5563;
  border-radius: 0.2rem;
  position: relative;
  overflow: hidden;
  transition: height 0.2s;

  .progress-fill {
    height: 100%;
    background: #ffffff;
    border-radius: 0.2rem;
  }
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 46rem;
  color: #ffffff;
  font-weight: 500;
  font-size: 1.4rem;
}

.volume-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;

  .volume-icon {
    width: 2rem;
    height: 2rem;
    cursor: pointer;
    filter: brightness(0) invert(1);
  }

  .volume-slider-container {
    width: 0;
    overflow: hidden;
    transition: width 0.3s;
    display: flex;
    align-items: center;
  }

  &:hover .volume-slider-container {
    width: 8rem;
  }

  .volume-slider {
    width: 7rem;
    height: 0.4rem;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0.2rem;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 1.2rem;
      height: 1.2rem;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;
    }
  }
}

.image-gallery {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gallery-counter {
  position: absolute;
  top: 2.4rem;
  right: 2.4rem;
  background: #ffffff;
  color: #4a5565;
  padding: 0.5rem 1.6rem;
  border-radius: 0.6rem;
  font-size: 1.2rem;
  z-index: 2;
}
.gallery-content {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .current-image {
    max-width: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: zoom-in;
  }
}
.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 4.8rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;

  span {
    width: 4.8rem;
    height: 4.8rem;
  }

  &.prev {
    left: 2.4rem;
    span {
      background: url("@/assets/images/detail/left.png") no-repeat;
      background-size: 100% 100%;
    }

    &.dis {
      cursor: not-allowed;
      span {
        background: url("@/assets/images/detail/left_dis.png") no-repeat;
        background-size: 100% 100%;
      }
    }
  }
  &.next {
    right: 2.4rem;
    span {
      background: url("@/assets/images/detail/right.png") no-repeat;
      background-size: 100% 100%;
    }

    &.dis {
      cursor: not-allowed;
      span {
        background: url("@/assets/images/detail/right_dis.png") no-repeat;
        background-size: 100% 100%;
      }
    }
  }
}
.locked-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  width: 100%;
  height: 100%;
  background: #fdf2f8; /* Light pink bg */

  .lock-icon {
    width: 4rem;
    height: 4rem;
  }
  .lock-tip {
    background: #fff;
    padding: 1.2rem 2rem;
    border-radius: 0.8rem;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    span {
      font-size: 1.4rem;
      color: #364153;
    }
    .subs-btn {
      background: #fb64b6;
      color: #fff;
      border: none;
      padding: 0.6rem 1.6rem;
      border-radius: 0.4rem;
      cursor: pointer;
    }
  }
}

/* Article */
.article-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.article-body {
  margin: 0 0.6rem 1.8rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);

  .post-title {
    font-size: 1.8rem;
    font-weight: 500;
    color: #101828;
    margin-bottom: 1.2rem;
    line-height: 2.6rem;
  }
}
.article-text {
  font-size: 1.4rem;
  line-height: 2rem;
  color: #6a7282;
  margin-bottom: 1.2rem;

  &.collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
.expand-btn {
  color: #00d3f2;
  font-size: 1.2rem;
  cursor: pointer;
  margin-bottom: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  &.hide {
    color: #99a1af;
  }

  img {
    width: 1.8rem;
    height: 1.8rem;
  }
}

.replies-btn {
  color: #00d3f2;
  font-size: 1.2rem;
  cursor: pointer;
  margin-bottom: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  &.hide {
    color: #99a1af;
  }

  img {
    width: 1.8rem;
    height: 1.8rem;
  }
}
.article-lock {
  margin: 1.2rem 0;
  background: url("../assets/images/detail/not_open.png") no-repeat;
  background-size: 100% 100%;
  padding: 3rem;
  border-radius: 1.2rem;

  .lock-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;

    img {
      width: 9rem;
      height: 9rem;
    }

    .lock-info{
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 42rem;
      width: max-content;
      padding: 1rem 2.4rem;
      border-radius: 1rem;
      background: #FFFFFF;
      .lock-txt {
        max-width: 30rem;
        font-size: 1.4rem;
        color: #364153;
      }
      .lock-btn {
        background: #fb64b6;
        color: #fff;
        border: none;
        height: 4rem;
        padding: 0 2.4rem;
        border-radius: 0.8rem;
        cursor: pointer;
        font-size: 1.4rem;

        &:hover{
          position: relative;

          &::after{
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.2);
            z-index: 1;
          }
        }
      }
    }
  }
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .post-time {
    font-size: 1.2rem;
    color: #99a1af;
  }

  .more-btn {
    width: 2rem;
    height: 2rem;
    cursor: pointer;

    img {
      width: 2rem;
      height: 2rem;
    }
  }
}

/* Mention/Topic Dropdown */
.mention-dropdown {
  position: absolute;
  left: 0;
  bottom: calc(100% + 1rem);
  width: 48rem;
  background: #ffffff;
  border-radius: 0.8rem;
  box-shadow: 0px 0px 16px 0px rgba(0,0,0,0.12);
  z-index: 100;
  max-height: 23rem;
  overflow-y: auto;

  .dropdown-list {
    padding: 0.8rem 0;

    .dropdown-item {
      padding: 0.8rem 1.6rem;
      min-height: 4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;

      &:hover {
        background: rgba(251, 100, 182, 0.06);
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 0.8rem;

        .avatar {
          width: 3.2rem;
          height: 3.2rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .label {
          font-size: 1.4rem;
          color: #364153;
        }
      }

      .item-right {
        .stats {
          font-size: 1.2rem;
          color: #99a1af;
        }
      }
    }
  }
}

/* Empty State with Padding */
.empty-with-padding {
  padding-bottom: 40px;
}

/* Tag styles */
:deep(.tag) {
  color: #00d3f2;
  margin-right: 0.4rem;
  user-select: none;
}

/* Hidden file inputs */
.hidden-file-input {
  display: none;
}
</style>
