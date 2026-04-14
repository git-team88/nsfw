<template>
  <div class="novel-detail">
    <div class="close-page-btn" @click="isCollectionMode ? exitCollectionMode() : closePage()">
      <span class="close-icon" v-if="isCollectionMode"></span>
      <span class="back-icon" v-else></span>
    </div>

    <UploadMask :visible="isLoading" :text="loadText"></UploadMask>

    <!-- Underage content warning -->
    <div class="main-container" v-if="isUnderage && isSensitiveContent">
      <div class="novel-content">
        <div class="chapter-header">
          <div class="header-left">
            <h1 class="chapter-title">{{ detail.title }}</h1>
            <div class="chapter-meta">
              <span class="chapter-date">{{ detail.time }}</span>
              <div class="more-menu-wrap" ref="headerMoreRef" v-if="detail.author.id != uid">
                <div class="more-btn" @click.stop="toggleHeaderMore">
                  <img src="@/assets/images/detail/menu.png" alt="" />
                </div>
                <div class="dropdown-menu" v-if="headerMoreVisible">
                  <span class="menu-item" @click="openReportModal('post', detail.id); headerMoreVisible = false">
                    {{ t("detail.report") }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info" @click="navigateToUserHome">
              <img class="avatar" :src="detail.author.avatar" alt="" />
              <span class="nickname">{{ detail.author.nickname }}</span>
            </div>
            <button
              class="follow-btn"
              :class="{ followed: detail.isFollowed }"
              @click="toggleFollow"
              v-if="detail.author.id != uid"
            >
              <img v-if="!detail.isFollowed" src="@/assets/images/detail/follow.png" alt="" />
              <span class="btn-text">{{ detail.isFollowed ? t('detail.following') : t('detail.follow') }}</span>
              <span class="hover-text" v-if="detail.isFollowed">{{ t('detail.unfollow') }}</span>
            </button>
          </div>
        </div>

        <div class="sensitive-body">
          <div class="sensitive-content-warning">
            <span class="warning-text">{{ t('detail.lock.sensitiveContent') }}</span>
            <button class="warning-btn" @click="navigateToProfileSettings">
              {{ t('detail.lock.profileSettings') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Floating action buttons -->
      <div class="floating-actions">
        <div class="action-btn toc-btn" @click="toggleToc">
          <img src="@/assets/images/detail/collection.png" alt="" />
        </div>
        <div class="action-btn like-btn" @click="toggleLike">
          <img :src="liked ? likeActiveIcon : likeIcon" alt="Like" />
          <span class="action-count">{{ likes }}</span>
        </div>
        <div class="action-btn comment-btn" @click="toggleComments">
          <img src="@/assets/images/detail/reply.png" alt="Comment" />
          <span class="action-count">{{ detail.comment_total || 0 }}</span>
        </div>
        <div class="action-btn share-btn" @click="shareContent">
          <img src="@/assets/images/detail/share.png" alt="Share" />
        </div>
      </div>
    </div>

    <div class="main-container" v-else>
      <div class="novel-content" :class="detail.book_id && Number(detail.book_id) > 0 && !isCollectionMode ? 'on' : ''" ref="novelContentRef">
        <div class="chapter-header">
          <div class="header-left">
            <h1 class="chapter-title">{{ detail.title }}</h1>
            <div class="chapter-meta">
              <span class="chapter-date">{{ detail.time }}</span>
              <div class="more-menu-wrap" ref="headerMoreRef" v-if="detail.author.id != uid">
                <div class="more-btn" @click.stop="toggleHeaderMore">
                  <img src="@/assets/images/detail/menu.png" alt="" />
                </div>
                <div class="dropdown-menu" v-if="headerMoreVisible">
                  <span class="menu-item" @click="openReportModal('post', detail.id); headerMoreVisible = false">
                    {{ t("detail.report") }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="user-info" @click="navigateToUserHome">
              <img class="avatar" :src="detail.author.avatar" alt="" />
              <span class="nickname">{{ detail.author.nickname }}</span>
            </div>
            <button
              class="follow-btn"
              :class="{ followed: detail.isFollowed }"
              @click="toggleFollow"
              v-if="detail.author.id != uid"
            >
              <img v-if="!detail.isFollowed" src="@/assets/images/detail/follow.png" alt="" />
              <span class="btn-text">{{ detail.isFollowed ? t('detail.following') : t('detail.follow') }}</span>
              <span class="hover-text" v-if="detail.isFollowed">{{ t('detail.unfollow') }}</span>
            </button>
          </div>
        </div>

        <div class="chapter-body" :class="isCollectionMode ? 'on' : ''">
          {{ detail.content }}
        </div>

        <!-- Subscription required提示 -->
        <div class="subscription-required" v-if="detail.permission == 'partial' && !detail.isSubscribed && detail.author.id !== uid">
          <div class="subscription-content">
            <span class="subscription-text">{{ t('detail.subscribeToView') }}</span>
            <button class="subscribe-btn" @click="onSubscribe">
              {{ t('detail.subscribe') }}
            </button>
          </div>
        </div>

        <!-- Chapter navigation buttons (only in collection mode) -->
        <div class="chapter-navigation" v-if="isCollectionMode && (prevChapterId || nextChapterId)">
          <button class="nav-btn prev" @click="navigateToChapter({ post_id: prevChapterId })" v-if="prevChapterId">
            {{ t('detail.prevChapter') }}
          </button>
          <button class="nav-btn next" @click="navigateToChapter({ post_id: nextChapterId })" v-if="nextChapterId">
            {{ t('detail.nextChapter') }}
          </button>
        </div>

        <div class="collection-info-bar" v-if="detail.book_id && Number(detail.book_id) > 0 && !isCollectionMode">
          <div class="collection-info" @click="enterCollectionMode(1)">
            <div class="collection-main">
              <span class="collection-label">{{ t('detail.collection') }}:</span>
              <span class="collection-name">{{ detail.book_title }}</span>
            </div>
            <div class="collection-line"></div>
            <div class="update-info">
              {{ t('detail.updatedToEpisode', { count: chapterCount }) }}
            </div>
          </div>
          <div class="collection-actions" @click="enterCollectionMode(2)">
            <div class="collection-link" v-if="nextChapterId">
              {{ t('detail.enterCollectionMode') }}
            </div>
            <button class="next-btn">
              {{ !nextChapterId ? t('detail.viewCollection') : t('detail.nextChapter') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows -->
      <div class="nav-arrows"v-if="isCollectionMode">
        <button class="nav-btn up" @click="navigateToChapter({ post_id: prevChapterId })" v-if="prevChapterId"></button>
        <button class="nav-btn down" @click="navigateToChapter({ post_id: nextChapterId })" v-if="nextChapterId"></button>
      </div>

      <div class="nav-arrows" v-else>
        <button class="nav-btn up" @click="goPrev" v-if="!isFirst"></button>
        <button class="nav-btn down" @click="goNext" v-if="!isLast"></button>
      </div>

      <!-- Floating action buttons -->
      <div class="floating-actions">
        <div class="action-btn toc-btn" @click="toggleToc" v-if="isCollectionMode">
          <img src="@/assets/images/detail/collection.png" alt="" />
        </div>
        <div class="action-btn like-btn" @click="toggleLike">
          <img :src="liked ? likeActiveIcon : likeIcon" alt="Like" />
          <span class="action-count">{{ likes }}</span>
        </div>
        <div class="action-btn comment-btn" @click="toggleComments">
          <img src="@/assets/images/detail/reply.png" alt="Comment" />
          <span class="action-count">{{ detail.comment_total || 0 }}</span>
        </div>
        <div class="action-btn share-btn" @click="shareContent">
          <img src="@/assets/images/detail/share.png" alt="Share" />
        </div>
      </div>

      <!-- Comments and table of contents sidebar -->
      <Sidebar
        :visible="showSidebar"
        :detail="detail"
        :uid="uid"
        :active-tab="activeTab"
        @close="toggleComments"
        @navigate-to-user="navigateToUserHome"
        @navigate-to-chapter="navigateToChapter"
        @open-report-modal="openReportModal"
        @update-post-data="updatePostData"
      />
    </div>
  </div>

  <!-- Report Modal -->
  <ReportModal
    v-if="reportTarget"
    v-model:visible="reportModalVisible"
    :title="reportModalTitle"
    :options="reportOptions"
    :targetType="reportTarget"
    @submit="handleReportSubmit"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import UploadMask from '@/components/UploadMask.vue';
import ReportModal from '@/components/ReportModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import Sidebar from '@/components/Sidebar.vue';
import { toast } from '@/util/toast';
import { formatTimestamp } from '@/util/utils';
import { baseUrl } from '@/util/config';

// Import images
import likeIcon from '@/assets/images/detail/like.png';
import likeActiveIcon from '@/assets/images/detail/like_active.png';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

// Loading state
const isLoading = ref(false);
const loadText = ref(t('detail.loading'));

// Detail data
const detail = ref({
  id: '',
  author: {
    avatar: '',
    nickname: '',
    id: ''
  },
  isFollowed: false,
  time: '',
  title: '',
  description: '',
  type: '2', // Novel type
  content: '',
  content_replace: '',
  permission: 'public',
  isSubscribed: false,
  commentsEnabled: true,
  likes: 0,
  liked: false,
  is_teenager: 1,
  is_nsfw: '1',
  isLast: false,
  book_id: '',
  book_title: '',
  chapter_index: '',
  comment_total: 0
});

// Content sections
const contentSections = computed(() => {
  const content = detail.value.content_replace || detail.value.content || '';
  return content.split('\n').filter(section => section.trim() !== '');
});

const novelContentRef = ref<HTMLElement | null>(null);

const chapterCount = ref(0);
const lastUpdated = ref('');

// Chapter navigation
const prevChapterId = ref('');
const nextChapterId = ref('');

// Navigation arrows
const isFirst = ref(false);
const isLast = ref(false);
const prevId = ref('');
const nextId = ref('');

// Chapters list (table of contents)
const chapters = ref<any[]>([]);

// Comments
const comments = ref<any[]>([]);
const totalComments = ref('0');
const commentText = ref('');
const showSidebar = ref(false);
const isCollectionMode = ref(false);
const activeTab = ref('detail');
const isLoadingComments = ref(false);
const currentPage = ref(1);
const loadingMoreComments = ref(false);
const hasMoreComments = ref(true);

// Header more menu
const headerMoreVisible = ref(false);
const headerMoreRef = ref<HTMLElement | null>(null);

// Comment related refs and state
const commentsListRef = ref<HTMLElement | null>(null);
const activeCommentMoreId = ref<string | null>(null);
const commentMoreRefs = ref<Record<string, HTMLElement>>({});

// Comment input state
const replyingTo = ref<any | null>(null);
const isInputting = ref(false);
const isInputEmpty = ref(true);
const currentLength = ref(0);
const MAX_LENGTH = 500;
const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;
const uploadedFiles = ref<any[]>([]);
const showDropdown = ref(false);
const dropdownItems = ref<any[]>([]);
const dropdownType = ref<'@' | '#'>('@');
const commentInputRef = ref<HTMLElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const isComposing = ref(false);
const lastRange = ref<Range | null>(null);

// Likes
const likes = ref(0);
const liked = ref(false);

// User info
const isUnderage = ref(false);
const isSensitiveContent = computed(() => detail.value.is_nsfw === '1');
const uid = localStorage.getItem('uid') || '';

// Report modal
const reportModalVisible = ref(false);
const reportTarget = ref<{ type: string; id: string } | null>(null);

// Report modal title
const reportModalTitle = computed(() => {
  if (reportTarget.value?.type === "comment" || reportTarget.value?.type === "reply") {
    return t("report.commentTitle");
  }
  return t("report.workTitle");
});

// Report options
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

// Fetch novel detail
async function fetchDetail() {
  const id = route.query.id as string;
  if (!id) return;

  // Get query parameters
  const type = route.query.type as string || "";

  isLoading.value = true;
  loadText.value = t('loading');

  try {
    let requestData = null;

    if (type == "1") {
      requestData = JSON.stringify({
        post_id: id,
        fromIndexRecommend: {
          "tab": "hot"
        }
      });
    } else if (type == "2") {
      requestData = JSON.stringify({
        post_id: id,
        fromIndexFollow: {
          test: 1
        }
      });
    } else if (type == "3") {
      requestData = JSON.stringify({
        post_id: id,
        fromIndexSubscription: {
          test: 1
        }
      });
    } else if (type == "4") {
      const bloggerId = route.query.uid as string || "";
      const searchKeyword = route.query.keyword as string || "";
      const startDay = route.query.start_day as string || "";
      const endDay = route.query.end_day as string || "";

      requestData = JSON.stringify({
        post_id: id,
        fromBloggerIndex: {
          blogger_id: bloggerId,
          keywords: searchKeyword,
          start_day: startDay,
          end_day: endDay
        }
      });
    } else if (type == "5") {
      const searchKeyword = route.query.keyword as string || "";
      requestData = JSON.stringify({
        post_id: id,
        fromSearch: {
          keywords: searchKeyword
        }
      });
    } else {
      requestData = JSON.stringify({
        post_id: id
      });
    }

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};

    if (token) {
      headers['token'] = token;
    }

    const response = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers: headers,
      body: requestData
    });

    const res = await response.json();

    if (res.code == 0 || res.code == 200) {
      const data = res.data.post;

      detail.value = {
        id: data.id || id,
        author: res.data.author,
        isFollowed: data.is_followed == 1 || false,
        time: formatTimestamp(data.created_at) || "",
        title: data.title || "",
        description: data.content_replace || data.content || data.description || "",
        type: data.type,
        content: data.content || "",
        content_replace: data.content_replace || "",
        permission: data.access_rights == '2' ? "partial" : data.access_rights == '3' ? "private" : "public",
        isSubscribed: data.is_subscribed == 1 || false,
        commentsEnabled: data.comments_enabled !== false,
        likes: Number(data.like_count || data.likes || 0),
        liked: data.is_liked == 1 || data.is_liked === true,
        is_teenager: data.is_teenager,
        is_nsfw: data.is_nsfw || '1',
        isLast: data.is_last || false,
        book_id: data.book_id || "",
        book_title: data.book_title || '',
        chapter_index: data.chapter_index || '',
        comment_total: res.data.comment_total || 0
      };

      likes.value = detail.value.likes;
      liked.value = detail.value.liked;

      // Check if user is underage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        isUnderage.value = parsedUserInfo.is_teenager === 1;
      }

      // Load chapters list
      await loadChapters();

      // Set chapter navigation
      setChapterNavigation();

      // Store navigation info
      if (res.data.posts) {
        isFirst.value = !res.data.posts.prev_id;
        isLast.value = !res.data.posts.next_id;
        prevId.value = res.data.posts.prev_id || '';
        nextId.value = res.data.posts.next_id || '';
      } else if (data.prev_id || data.next_id) {
        isFirst.value = !data.prev_id;
        isLast.value = !data.next_id;
        prevId.value = data.prev_id || '';
        nextId.value = data.next_id || '';
      } else {
        isFirst.value = true;
        isLast.value = true;
        prevId.value = '';
        nextId.value = '';
      }
    } else {
      toast(locale.value == 'jp' ? res.msg_jp : res.msg);
    }
  } catch (error) {
    console.error('Error fetching novel detail:', error);
    toast(t('fail'));
  } finally {
    isLoading.value = false;
    // Scroll to top after loading new content
    nextTick(() => {
      if (novelContentRef.value) {
        novelContentRef.value.scrollTop = 0;
      }
    });
  }
}

// Load chapters list
async function loadChapters() {
  if (!detail.value.book_id || Number(detail.value.book_id) === 0) {
    chapters.value = [];
    chapterCount.value = 0;
    setChapterNavigation();
    return;
  }

  try {
    const response = await api.singleCollection(String(detail.value.book_id), 1, 50) as any;
    if (response.code === 0) {
      chapters.value = response.data?.data || [];
      chapterCount.value = response.data?.allnums || response.data?.count || 0;
      // 加载章节列表后设置导航
      setChapterNavigation();
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

function toggleHeaderMore() {
  headerMoreVisible.value = !headerMoreVisible.value;
}

// Set chapter navigation
function setChapterNavigation() {
  // First try to find by id, then by chapter_index
  let currentIndex = chapters.value.findIndex(chapter => chapter.chapter_index == detail.value.chapter_index);

  // If not found by id, try to find by chapter_index
  if (currentIndex === -1 && detail.value.chapter_index) {
    currentIndex = chapters.value.findIndex(chapter => {
      return Number(chapter.chapter_index) === Number(detail.value.chapter_index);
    });
  }

  // Reset navigation
  prevChapterId.value = '';
  nextChapterId.value = '';

  if (currentIndex > 0) {
    prevChapterId.value = chapters.value[currentIndex - 1].post_id;
  }

  if (currentIndex < chapters.value.length - 1) {
    nextChapterId.value = chapters.value[currentIndex + 1].post_id;
  }
}

// Load comments
async function loadComments(page = 1, loadMore = false) {
  const id = route.query.id as string;
  if (!id) return;

  if (loadMore) {
    loadingMoreComments.value = true;
  } else {
    isLoadingComments.value = true;
    currentPage.value = 1;
    comments.value = [];
    hasMoreComments.value = true;
  }

  try {
    const response = await api.commentList(id, page, 10) as any;
    if (response.code === 0) {
      const newComments = response.data?.data || [];
      if (loadMore) {
        comments.value = [...comments.value, ...newComments];
        currentPage.value = page;
      } else {
        comments.value = newComments;
      }
      totalComments.value = response.data?.count || '0';
      hasMoreComments.value = comments.value.length < Number(totalComments.value);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  } finally {
    isLoadingComments.value = false;
    loadingMoreComments.value = false;
  }
}

// Toggle like
async function toggleLike() {
  const id = route.query.id as string;
  if (!id) return;

  try {
    const response = await api.likePost({ post_id: id }) as any;
    if (response.code === 0) {
      liked.value = !liked.value;
      likes.value += liked.value ? 1 : -1;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    toast(t('fail'));
  }
}

function onSubscribe() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  router.push(`/subscription-payment?uid=${detail.value.author.id}`);
}

// Submit comment
async function submitComment() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  const text = commentText.value.trim();
  if (!text && uploadedFiles.value.length === 0) {
    toast(t('detail.enterComment'));
    return;
  }

  if (currentLength.value > MAX_LENGTH) {
    toast("Exceeded the maximum word count limit");
    return;
  }

  const id = route.query.id as string;

  try {
    let parentId = 0;
    let commentId = 0;
    const isReply = !!replyingTo.value;
    const parentCommentId = replyingTo.value?.parentCommentId || replyingTo.value?.id;

    if (replyingTo.value) {
      if (replyingTo.value.parentCommentId) {
        parentId = replyingTo.value.parentCommentId;
        commentId = replyingTo.value.id;
      } else {
        parentId = replyingTo.value.replyTo ? replyingTo.value.replyTo : replyingTo.value.id;
        if (replyingTo.value.replyTo) {
          commentId = replyingTo.value.id;
        }
      }
    }

    let processedContent = text;
    const el = commentInputRef.value;
    if (el) {
      const mentionSpans = el.querySelectorAll('.tag.mention');
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

    const commentData: any = {
      post_id: id,
      parent_id: parentId,
      reply_to_comment: commentId,
      content: processedContent,
      video_url: "",
      image_urls: []
    };

    if (uploadedFiles.value.length > 0) {
      const videos = uploadedFiles.value.filter(file => file.type === 'video');
      const images = uploadedFiles.value.filter(file => file.type === 'image');

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
      cancelInput();
      await loadComments();
      toast(t('detail.commentSubmitted'));
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
    toast(t('fail'));
  }
}

// Comment input functions
function activateInput() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return false;
  }

  isInputting.value = true;
  nextTick(() => {
    commentInputRef.value?.focus();
  });
}

function cancelInput() {
  isInputting.value = false;
  replyingTo.value = null;
  commentText.value = "";
  currentLength.value = 0;
  uploadedFiles.value = [];
}

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
        event.preventDefault();
        const fullMatch = match[0];
        const matchStartIndex = match.index!;

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

        // Move cursor after the tag
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  }
}

function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd() {
  isComposing.value = false;
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
}

function onInputBlur() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Debounced search
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
    console.log("Search error:", error);
    dropdownItems.value = [];
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

function selectDropdownItem(item: any) {
  if (!lastRange.value) return;

  const trigger = dropdownType.value;
  const text = trigger + item.label;

  const range = lastRange.value;
  const textNode = range.startContainer;
  const textContent = textNode.textContent || "";
  const beforeTrigger = textContent.substring(0, range.startOffset);

  const match = beforeTrigger.match(/([#@])([^#@\s]*)$/);
  if (!match) return;

  const triggerStart = match.index!;
  const triggerEnd = triggerStart + 1 + match[2].length;

  const newRange = document.createRange();
  newRange.setStart(textNode, triggerStart);
  newRange.setEnd(textNode, triggerEnd);
  newRange.deleteContents();

  if (trigger === '@') {
    const span = document.createElement("span");
    span.className = "tag mention";
    span.contentEditable = "false";
    span.textContent = text;
    span.style.color = "#00d3f2";
    newRange.insertNode(span);
  } else {
    const span = document.createElement("span");
    span.className = "tag topic";
    span.contentEditable = "false";
    span.textContent = text;
    span.style.color = "#00d3f2";
    newRange.insertNode(span);
  }

  const afterRange = document.createRange();
  afterRange.setStartAfter(newRange.startContainer instanceof Node ? newRange.startContainer : newRange.startContainer);
  afterRange.collapse(true);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(afterRange);
  }

  showDropdown.value = false;
}

function triggerFileUpload(type: "image" | "video") {
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

    if (fileType === "video") {
      if (hasVideo || imageCount > 0 || uploadedFiles.value.length >= MAX_VIDEOS) {
        toast(t('detail.uploadTip'));
        break;
      }
      await uploadVideo(file);
    } else {
      if (hasVideo || imageCount >= MAX_IMAGES) {
        toast(t('detail.uploadTip'));
        break;
      }
      await uploadImage(file);
    }
  }

  input.value = '';
}

async function uploadImage(file: File) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${baseUrl}upload/image`, {
      method: 'POST',
      headers: { 'token': token },
      body: formData
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      uploadedFiles.value.push({
        type: 'image',
        url: data.data.url,
        file: file
      });
    }
  } catch (error) {
    console.error('Image upload error:', error);
  }
}

async function uploadVideo(file: File) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${baseUrl}upload/video`, {
      method: 'POST',
      headers: { 'token': token },
      body: formData
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      uploadedFiles.value.push({
        type: 'video',
        url: data.data.url,
        file: file
      });
    }
  } catch (error) {
    console.error('Video upload error:', error);
  }
}

function previewFileItem(file: any, index: number) {
  // Preview functionality
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1);
}

// Toggle follow
async function toggleFollow() {
  const authorId = detail.value.author.id;
  if (!authorId) return;

  try {
    const response = await api.follow({ user_id: authorId }) as any;
    if (response.code === 0) {
      detail.value.isFollowed = !detail.value.isFollowed;
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    toast(t('fail'));
  }
}

// Navigate to chapter
function navigateToChapter(chapter: any) {
  if (!chapter || !chapter.post_id) return;
  router.replace({
    path: '/detail',
    query: {
      ...route.query,
      id: chapter.post_id
    }
  });

  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    isCollectionMode.value = true;
  }
}

// Toggle comments sidebar
async function toggleComments() {
  showSidebar.value = !showSidebar.value;
  if (showSidebar.value) {
    // First set activeTab to comment
    activeTab.value = 'comment';
    // Then load comments
    await loadComments();
  }
}

// Handle scroll to load more comments
function handleCommentsScroll() {
  const scrollContent = document.querySelector('.comments-list') as HTMLElement;
  if (!scrollContent || loadingMoreComments.value || !hasMoreComments.value) return;

  const scrollTop = scrollContent.scrollTop;
  const scrollHeight = scrollContent.scrollHeight;
  const clientHeight = scrollContent.clientHeight;

  // Check if scrolled to near bottom (within 10px)
  if (scrollHeight - scrollTop - clientHeight <= 10) {
    loadComments(currentPage.value + 1, true);
  }
}

// Toggle table of contents sidebar
function toggleToc() {
  showSidebar.value = !showSidebar.value;
  if (showSidebar.value) {
    activeTab.value = 'toc';
    // 合集数据由Sidebar组件的watch函数自动加载
  }
}

// Share content
function shareContent() {
  // Implement share functionality
  console.log('Share content');
}

// Back to top
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigate to profile settings
function navigateToProfileSettings() {
  router.push('/user/profile');
}

// Open report modal
function openReportModal(type: string, id: string | number) {
  reportTarget.value = { type: type, id: String(id) };
  reportModalVisible.value = true;
}

// Handle report submit
async function handleReportSubmit(reason: string) {
  if (!reportTarget.value) return;

  try {
    const response = await api.report({
      post_id: reportTarget.value.id,
      reason: reason
    }) as any;

    if (response.code === 0) {
      toast(t('report.success'));
      reportModalVisible.value = false;
      reportTarget.value = null;
    } else {
      toast(response.msg || t('report.failed'));
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    toast(t('report.failed'));
  }
}

// Navigate to user home
function navigateToUserHome() {
  if (detail.value.author.id) {
    router.push({ path: '/user-home', query: { id: detail.value.author.id } });
  }
}

function enterCollectionMode(type: number) {
  if (type == 2) {
    if (!nextChapterId.value) {
      if (detail.value.book_id && Number(detail.value.book_id) > 0) {
        isCollectionMode.value = true;
      }
    } else {
      if (nextChapterId.value) {
        router.replace({
          path: '/detail',
          query: {
            ...route.query,
            id: nextChapterId.value
          }
        });

        if (detail.value.book_id && Number(detail.value.book_id) > 0) {
          isCollectionMode.value = true;
        }
      }
    }
  } else {
    if (detail.value.book_id && Number(detail.value.book_id) > 0) {
      isCollectionMode.value = true;
    }
  }
}

// Exit collection mode
function exitCollectionMode() {
  isCollectionMode.value = false;
  // router.replace({
  //   path: '/detail',
  //   query: {
  //     ...route.query
  //     // 不添加collectionMode参数，确保它不显示在URL上
  //   }
  // });
}

// Comment related functions
function setCommentMoreRef(el: HTMLElement, id: string) {
  if (el) {
    commentMoreRefs.value[id] = el;
  }
}

function toggleCommentMore(id: string) {
  if (activeCommentMoreId.value === id) {
    activeCommentMoreId.value = null;
  } else {
    activeCommentMoreId.value = id;
  }
}

async function deleteComment(commentId: string, isReply: boolean = false) {
  try {
    const response = await api.deleteComment({ comment_id: commentId }) as any;
    if (response.code === 0) {
      // Remove the comment from the list
      if (isReply) {
        // Find the parent comment and remove the reply
        for (let i = 0; i < comments.value.length; i++) {
          const comment = comments.value[i];
          if (comment.replies) {
            const replyIndex = comment.replies.findIndex((r: any) => r.id === commentId);
            if (replyIndex !== -1) {
              comment.replies.splice(replyIndex, 1);
              break;
            }
          }
        }
      } else {
        // Remove the comment itself
        const commentIndex = comments.value.findIndex((c: any) => c.id === commentId);
        if (commentIndex !== -1) {
          comments.value.splice(commentIndex, 1);
          totalComments.value = (parseInt(totalComments.value) - 1).toString();
        }
      }
      activeCommentMoreId.value = null;
      toast(t('detail.commentDeleted'));
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast(t('fail'));
  }
}

function replyToComment(commentId: string, author: string) {
  replyingTo.value = {
    id: commentId,
    author: author,
    text: '',
    parentCommentId: null,
    replyTo: null
  };
  isInputting.value = true;
  nextTick(() => {
    commentInputRef.value?.focus();
  });
}

async function likeComment(commentId: string, liked: boolean) {
  try {
    const response = await api.likeComment({ comment_id: commentId }) as any;
    if (response.code === 0) {
      // Update local state
      const comment = comments.value.find((c: any) => c.id === commentId);
      if (comment) {
        comment.liked = liked;
        comment.likes += liked ? 1 : -1;
      }
    }
  } catch (error) {
    console.error('Error liking comment:', error);
  }
}

async function loadMoreReplies(comment: any) {
  if (!comment.replies) {
    comment.replies = [];
    comment.replyPage = 0;
  }
  comment.replyPage++;

  try {
    const response = await api.replyList(comment.id, comment.replyPage, 5) as any;
    if (response.code === 0) {
      const newReplies = response.data?.data || [];
      if (comment.replyPage === 1) {
        comment.replies = newReplies;
      } else {
        comment.replies = [...comment.replies, ...newReplies];
      }
      comment.hasMoreReplies = newReplies.length >= 5;
    }
  } catch (error) {
    console.error('Error loading replies:', error);
  }
}

function formatContent(content: string): string {
  // Simple content formatting
  return content;
}

function previewCommentImage(imageUrl: string) {
  // Preview comment image
  console.log('Preview image:', imageUrl);
}

// Navigation arrows functions
function goPrev() {
  if (!isCollectionMode.value && isFirst.value) return;
  if (isCollectionMode.value && !prevChapterId.value) return;

  if (isCollectionMode.value) {
    const chapter = chapters.value.find(c => c.post_id === prevChapterId.value);
    if (chapter) {
      navigateToChapter(chapter);
    }
  } else {
    if (prevId.value) {
      // 保留当前路由的所有查询参数，只更新 id
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: prevId.value
        }
      });
    }
  }
}

function goNext() {
  if (!isCollectionMode.value && isLast.value) return;
  if (isCollectionMode.value && !nextChapterId.value) return;

  if (isCollectionMode.value) {
    const chapter = chapters.value.find(c => c.post_id === nextChapterId.value);
    if (chapter) {
      navigateToChapter(chapter);
    }
  } else {
    if (nextId.value) {
      // 保留当前路由的所有查询参数，只更新 id
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: nextId.value
        }
      });
    }
  }
}

// Close page
function closePage() {
  if (window.history.length <= 1) {
    router.push('/');
  } else {
    router.back();
  }
}

// Update post data from sidebar
function updatePostData(data: any) {
  if (data.likes !== undefined) {
    likes.value = data.likes;
  }
  if (data.liked !== undefined) {
    liked.value = data.liked;
  }
  if (data.totalComments !== undefined) {
    totalComments.value = data.totalComments;
  }
}

// Watch for route changes
watch(() => route.query.id, async (newId) => {
  if (newId) {
    await fetchDetail();
  }
});

// Mounted
onMounted(async () => {
  await fetchDetail();

  // Add scroll event listener for comments list
  setTimeout(() => {
    const commentsList = document.querySelector('.comments-list');
    if (commentsList) {
      commentsList.addEventListener('scroll', handleCommentsScroll, { passive: true });
    }
  }, 100);

  // Add click outside listener to close dropdown
  document.addEventListener('click', handleClickOutside);
});

// Unmounted
onUnmounted(() => {
  // Remove event listeners
  const commentsList = document.querySelector('.comments-list');
  if (commentsList) {
    commentsList.removeEventListener('scroll', handleCommentsScroll);
  }
  document.removeEventListener('click', handleClickOutside);
});

// Handle click outside to close dropdown
function handleClickOutside(event: MouseEvent) {
  if (headerMoreVisible.value && headerMoreRef.value) {
    const target = event.target as HTMLElement;
    if (!headerMoreRef.value.contains(target)) {
      headerMoreVisible.value = false;
    }
  }
}
</script>

<style scoped lang="scss">
  @use '@/scss/NovelDetail.scss';
</style>