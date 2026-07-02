<template>
  <div class="sidebar-overlay" v-if="visible" @click="close">
    <div class="sidebar" @click.stop>
      <div class="sidebar-header">
        <div class="header-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab == 'comment' }"
            @click="activeTab = 'comment'; loadComments()"
          >
            {{ t('detail.comment') }}
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab == 'toc' }"
            @click="activeTab = 'toc'; loadChapters()"
          >
            {{ t('detail.tableOfContents') }}
          </div>
        </div>
        <div class="close-btn" @click="close">
          <img src="@/assets/images/detail/close.png" alt="" />
        </div>
      </div>

      <div class="sidebar-content" ref="scrollContentRef" @scroll="handleScroll" :style="{ paddingBottom: isInputting ? '20rem' : '90px' }">
        <!-- Comments tab -->
        <div class="comments-tab" v-if="activeTab == 'comment'">
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
            <div v-if="comments.length > 0 && !isLoadingComments" class="comment-item" v-for="comment in comments" :key="comment.id" :data-comment-id="comment.id">
              <div class="comment-main" :style="{ backgroundColor: comment.backgroundColor }">
                <img class="c-avatar" :src="comment.avatar" alt="" />
                <div class="c-content">
                  <div class="c-header">
                    <span class="c-author">{{ comment.author }}</span>
                    <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, Number(comment.id))">
                      <button class="c-more-btn" @click.stop="toggleCommentMore(Number(comment.id))">
                        <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                      </button>
                      <div class="dropdown-menu" v-if="activeCommentMoreId == Number(comment.id)">
                        <span class="menu-item" v-if="comment.user_id == uid" @click="deleteComment(comment.id)">
                          {{ t("detail.delete") }}
                        </span>
                        <span class="menu-item" v-else @click="openReportModal('comment', comment.id)">
                          {{ t("detail.report") }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="c-text hidden" v-if="comment.is_blacked == 1">
                    <img src="@/assets/images/home/intro.png" alt="" class="hidden-icon" />
                    <span>{{ t("detail.commentHidden") }}</span>
                  </div>
                  <p class="c-text" v-else v-html="formatContent(comment.content_replace || comment.text || comment.content)"></p>

                  <div class="c-media" v-if="comment.images && comment.images.length > 0">
                    <div class="c-images">
                      <div class="c-image"
                        v-for="(imgUrl, index) in comment.images"
                        :key="index"
                        @click="previewCommentImage(imgUrl.image_url)">
                        <img
                          :src="imgUrl.image_url"
                          alt=""
                        />
                      </div>
                    </div>
                  </div>

                  <div class="c-media" v-if="comment.video_url">
                    <div class="c-video">
                      <div class="video-wrapper">
                        <video
                          :src="comment.video_url.trim()"
                          class="c-video-player"
                          controls
                          controlslist="nodownload noremoteplayback noplaybackrate"
                          disablePictureInPicture
                        ></video>
                      </div>
                    </div>
                  </div>

                  <div class="c-footer">
                    <span class="c-time">{{ formatTimestamp(comment.created_at) }}</span>
                    <div class="c-actions">
                      <div
                        class="action-btn like-btn"
                        :class="{ active: comment.liked }"
                        @click="toggleCommentLike(comment)"
                      >
                        <b></b>
                        <span>{{ comment.likes }}</span>
                      </div>
                      <div class="action-btn reply-btn" @click="startReply(comment)">
                        <b></b>
                        <span>{{ t("detail.reply") }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Replies -->
              <div class="replies-list" v-if="comment.showingReplies && comment.replies && comment.replies.length > 0">
                <div class="reply-item" v-for="reply in comment.replies" :key="reply.id" :style="{ backgroundColor: reply.backgroundColor }">
                  <img class="c-avatar" :src="reply.avatar" alt="" />
                  <div class="c-content">
                    <div class="c-header">
                      <span class="c-author">{{ reply.author }}</span>
                      <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, Number(reply.id))">
                            <button class="c-more-btn" @click.stop="toggleCommentMore(Number(reply.id))">
                              <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                            </button>
                            <div class="dropdown-menu" v-if="activeCommentMoreId == Number(reply.id)">
                          <span class="menu-item" v-if="reply.user_id == uid" @click="deleteComment(reply.id)">
                            {{ t("detail.delete") }}
                          </span>
                          <span class="menu-item" v-else @click="openReportModal('comment', reply.id)">
                            {{ t("detail.report") }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="c-text hidden" v-if="reply.is_blacked == 1">
                      <img src="@/assets/images/home/intro.png" alt="" class="hidden-icon" />
                      <span>{{ t("detail.commentHidden") }}</span>
                    </div>
                    <p class="c-text" v-else v-html="formatContent(reply.content_replace || reply.text || reply.content)"></p>
                    <div class="c-footer">
                      <span class="c-time">{{ formatTimestamp(reply.created_at) }}</span>
                      <div class="c-actions">
                        <div
                          class="action-btn like-btn"
                          :class="{ active: reply.liked }"
                          @click="toggleReplyLike(reply)"
                        >
                          <b></b>
                          <span>{{ reply.likes }}</span>
                        </div>
                        <div class="action-btn reply-btn" @click="startReply(comment, reply)">
                          <b></b>
                          <span>{{ t("detail.reply") }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Show more replies button -->
              <div v-if="!comment.showingReplies && comment.replies_count > 0" class="show-more-replies" @click="loadReplies(comment)">
                {{ t('detail.showMoreReplies', { count: comment.replies_count }) }}
              </div>
            </div>

            <!-- Loading more comments -->
            <div v-if="loadingMore" class="loading-more">
              <div class="loading-spinner"></div>
              <p>{{ t('detail.loadingComments') }}</p>
            </div>

            <!-- No more comments -->
            <div v-if="!loadingMore && !hasMoreComments && comments.length > 0" class="no-more">
              {{ t('detail.noMore') }}
            </div>
          </div>

          <!-- Comment Form -->
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

        <!-- Table of Contents tab -->
        <div class="toc-tab" v-if="activeTab === 'toc'">
          <div class="collection-name" v-if="detail.book_title">
            {{ detail.book_title }}
          </div>
          <div class="toc-header">
            <span>{{ t('detail.updatedChapters', { count: chapterCount }) }}</span>

            <div class="view-collection-info" @click="goToCollectionDetail">
              {{ t('detail.viewCollectionInfo') }}
            </div>
          </div>

          <div class="toc-list" ref="tocListRef" @scroll="handleTocScroll">
            <!-- Empty State -->
            <EmptyState v-if="chapters.length === 0 && !isLoadingChapters" class="empty-with-padding"></EmptyState>

            <div
              class="toc-item"
              v-for="chapter in chapters"
              :key="chapter.id"
              @click="navigateToChapter(chapter)"
              :class="{ active: chapter.id == detail.id || chapter.chapter_index === detail.chapter_index }"
            >
              <div class="toc-info" :class="chapter.access_rights == '2' ? 'on' : ''">
                <span class="chapter-title">{{ chapter.title }}</span>
                <span class="subscribe-badge" v-if="chapter.access_rights == '2' && detail.author && detail.author.id !== uid">
                  {{ t('detail.subscribe') }}
                </span>
              </div>

              <!-- <div class="chapter-actions">
                <div class="collection-views" @click="toggleChapterLike(chapter, $event)">
                  <img src="@/assets/images/detail/like.png" alt="" :class="{ 'active': chapter.liked }" />
                  <span>{{ formatNumber(chapter.likes || 0) }}</span>
                </div>
              </div> -->

            </div>

            <!-- Loading more chapters -->
            <div v-if="isLoadingChapters" class="loading-more">
              <div class="loading-spinner"></div>
              <p>{{ t('detail.loadingChapters') }}</p>
            </div>

            <!-- No more chapters -->
            <div v-if="!isLoadingChapters && !hasMoreChapters && chapters.length > 0" class="no-more">
              {{ t('detail.noMoreChapters') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <PreviewModal
      :visible="showPreviewModal"
      :videoUrl="curVideoUrl"
      @close="closePreviewModal"
    />

    <UploadMask :visible="isLoading" :text="loadText"></UploadMask>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { baseUrl } from '@/util/config';
import { formatTimestamp } from '@/util/utils';
import { useRoute, useRouter } from "vue-router";
import EmptyState from '@/components/EmptyState.vue';
import UploadMask from '@/components/UploadMask.vue';
import PreviewModal from '@/components/PreviewModal.vue';

const route = useRoute();
const router = useRouter();

// Import images
import likeIcon from '@/assets/images/detail/like.png';
import likeActiveIcon from '@/assets/images/detail/like_active.png';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  detail: {
    type: Object,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  activeTab: {
    type: String,
    default: 'comment'
  }
});

const emit = defineEmits(['close', 'navigate-to-user', 'navigate-to-chapter', 'open-report-modal', 'update-post-data']);

const { t, locale } = useI18n();

function getI18nMsg(res: any) {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: 'msg_cn', jp: 'msg_jp', tc: 'msg_tc' };
  const key = msgMap[lang];
  return (key && res?.[key]) || res?.msg || t('fail');
}

const comments = ref<any[]>([]);
const totalComments = ref(props.detail?.comment_total?.toString() || '0');
const commentText = ref('');
const activeTab = ref(props.activeTab);
const isLoadingComments = ref(false);
const commentsListRef = ref<HTMLElement | null>(null);
const activeCommentMoreId = ref<number | null>(null);
const commentMoreRefs = ref<Map<number, HTMLElement>>(new Map());
const commentToDelete = ref<string | number>('');
const deleteModalVisible = ref(false);

// Watch for changes in detail prop
watch(() => props.detail, (newDetail) => {
  if (newDetail) {
    totalComments.value = newDetail.comment_total?.toString() || '0';
  }
}, { deep: true });

// Comment form
const isInputting = ref(false);
const liked = ref(false);
const likes = ref(0);
const replyingTo = ref<any>(null);
const commentInputRef = ref<HTMLElement | null>(null);
const isInputEmpty = ref(true);
const currentLength = ref(0);
const MAX_LENGTH = 1000;
const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;
const uploadedFiles = ref<any[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const showDropdown = ref(false);
const dropdownItems = ref<any[]>([]);
const dropdownType = ref<string>('');
const dropdownPosition = ref({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isComposing = ref(false);
const loadText = ref('');
const isLoading = ref(false);
const videoUrl = ref('');
const largeImage = ref<any[]>([]);
const currentImageIndex = ref(0);
const showLargeViewer = ref(false);
const showPreviewModal = ref(false);
const curVideoUrl = ref('');
const videoRef = ref<HTMLVideoElement | null>(null);
const loadingMore = ref(false);
const hasMoreComments = ref(true);
const isScrolled = ref(false);
const scrollContentRef = ref<HTMLElement | null>(null);
const isRightPanelHidden = ref(false);
const isCollectionMode = ref(false);
const videoSize = ref<number>(0);
const isPageFullscreen = ref(false);

// Chapters
const chapters = ref<any[]>([]);
const chapterCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(50);
const isLoadingChapters = ref(false);
const hasMoreChapters = ref(true);
const tocListRef = ref<HTMLElement | null>(null);

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// onMounted(() => {
//   document.addEventListener("click", handleClickOutside);
// });

// onBeforeUnmount(() => {
//   document.removeEventListener("click", handleClickOutside);
// });

// function handleClickOutside(event: MouseEvent) {
//   if (activeCommentMoreId.value != null) {
//     const el = commentMoreRefs.value.get(activeCommentMoreId.value);
//     if (el && !el.contains(target)) {
//       activeCommentMoreId.value = null;
//     }
//   }

//   // Hide mention dropdown when clicking outside
//   if (showDropdown.value) {
//     const dropdown = document.querySelector('.mention-dropdown');
//     const inputWrapper = commentInputRef.value?.parentElement;
//     if (dropdown && !dropdown.contains(target) && inputWrapper && !inputWrapper.contains(target)) {
//       showDropdown.value = false;
//     }
//   }
// }

// Set comment more ref
function setCommentMoreRef(el: any, id: number) {
  if (el && el.nodeType === 1) {
    commentMoreRefs.value.set(id, el as HTMLElement);
  }
}

// Toggle comment more menu
function toggleCommentMore(id: number) {
  if (activeCommentMoreId.value == id) {
    activeCommentMoreId.value = null;
  } else {
    activeCommentMoreId.value = id;
  }
}

// Open report modal
function openReportModal(type: string, id: string | number) {
  emit('open-report-modal', type, id);
  // Close the dropdown menu after opening the report modal
  activeCommentMoreId.value = null;
}

// Close dropdown menu when clicking outside
function closeDropdownOnClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  if (activeCommentMoreId.value !== null) {
    const el = commentMoreRefs.value.get(activeCommentMoreId.value);
    if (el && !el.contains(target)) {
      activeCommentMoreId.value = null;
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdownOnClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside);
});

function formatNumber(n: number) {
  if (n == 0) return '0';
  return n.toLocaleString();
}

// Delete comment
function deleteComment(commentId: string | number, isReply: boolean = false) {
  // Close dropdown menu
  activeCommentMoreId.value = null;

  // Find the comment object
  let comment = null;

  // Check in main comments
  for (const c of comments.value) {
    if (Number(c.id) === Number(commentId)) {
      comment = c;
      break;
    }
    // Check in replies
    if (c.replies) {
      for (const r of c.replies) {
        if (Number(r.id) === Number(commentId)) {
          comment = r;
          isReply = true;
          break;
        }
      }
      if (comment) break;
    }
  }

  if (!comment) return;

  // If it's a reply or a main comment with no replies, delete directly
  let hasReplies = false;

  // Check for reply count
  const replyCount = comment.reply_count || comment.children_count || 0;
  if (replyCount > 0) {
    hasReplies = true;
  }

  // Check for children array
  if (comment.children && comment.children.length > 0) {
    hasReplies = true;
  }

  // Check for replies array
  if (comment.replies && comment.replies.length > 0) {
    hasReplies = true;
  }

  if (isReply || !hasReplies) {
    // Directly delete without showing modal
    handleDeleteConfirmDirect(commentId, isReply);
  } else {
    // Show confirm modal for main comments with replies
    commentToDelete.value = commentId;
    deleteModalVisible.value = true;
  }
}

async function handleDeleteConfirmDirect(commentId: string | number, isReply: boolean = false) {
  try {
    const res = await api.deleteComment({ comment_id: String(commentId) }) as any;
    if (res.code === 0 || res.code === 200) {
      toast(t('success'));

      await updateCommentCount();

      if (isReply) {
        // For replies, find the parent comment and reload its replies
        for (const comment of comments.value) {
          if (comment.replies) {
            const replyIndex = comment.replies.findIndex((r: { id: any; }) => String(r.id) === String(commentId));
            if (replyIndex !== -1) {
              // Reload replies for this comment
              comment.replyPage = 0;
              comment.replies = [];
              await loadReplies(comment, 1);
              break;
            }
          }
        }
      } else {
        // For top-level comments, reload all comments
        await loadComments(1, false);

        const cid = route.query.cid as string || "";
        if (cid) {
          await loadCommentDetail(cid);
        }

        const rid = route.query.rid as string || "";
        if (rid) {
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadCommentToReplyList(rid);
        }
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

// Format content
function formatContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Preview comment image
function previewCommentImage(imgUrl: string) {
  // Implement image preview functionality
  console.log('Preview image:', imgUrl);
}

// Like comment
function likeComment(id: string, liked: boolean) {
  api.likeComment({ comment_id: id, action: liked ? 'unlike' : 'like' })
    .then((response: any) => {
      if (response.code === 0) {
        // Update comment likes
        comments.value.forEach(comment => {
          if (comment.id === id) {
            comment.liked = liked;
            comment.likes = liked ? comment.likes + 1 : comment.likes - 1;
          }
          // Check replies
          if (comment.replies) {
            comment.replies.forEach((reply: any) => {
              if (reply.id === id) {
                reply.liked = liked;
                reply.likes = liked ? reply.likes + 1 : reply.likes - 1;
              }
            });
          }
        });
      }
    })
    .catch((error) => {
      console.error('Error liking comment:', error);
      toast(t('fail'));
    });
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

function startReply(comment: any, reply?: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  if (reply) {
    // If replying to a reply, attach the parent comment id to the reply object
    reply.parentCommentId = comment.id;
    replyingTo.value = reply;
  } else {
    replyingTo.value = comment;
  }
  activateInput();
}

// Reply to comment
function replyToComment(id: string, author: string) {
  replyingTo.value = { author, text: '' };
  isInputting.value = true;
  activeTab.value = 'comment';
  // Focus on the input
  setTimeout(() => {
    if (commentInputRef.value) {
      commentInputRef.value.focus();
    }
  }, 100);
}

// Load replies with page
async function loadReplies(comment: any, page: number = 1) {
  try {
    const response = await api.replyList(comment.id, page, 5) as any;
    if (response.code === 0) {
      const newReplies = response.data?.data || [];
      if (page === 1) {
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

function updateScrollContentPadding() {
  // if (scrollContentRef.value && rightFooterRef.value) {
  //   const footerHeight = rightFooterRef.value.offsetHeight;
  //   scrollContentRef.value.style.paddingBottom = `${footerHeight}px`;
  // }
}

// Load comments
async function loadComments(page: number = 1, append: boolean = false) {
  // Set loading state
  if (append) {
    loadingMore.value = true;
  } else {
    isLoadingComments.value = true;
  }

  try {
    const res = await api.commentList(props.detail.id, page, 10) as any;
    if (res.code == 0 || res.code == 200) {
      const newComments = (res.data.data || []).map((comment: any) => {
        const commentObj: any = {
          id: comment.id || comment.comment_id || Date.now(),
          author: comment.author || comment.nickname || "",
          user_id: comment.user_id || "",
          avatar: comment.avatar || "",
          text: comment.content_replace || comment.text || comment.content || "",
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
            user_id: firstChild.user_id || "",
            avatar: firstChild.avatar || firstChild.user?.avatar || "",
            text: firstChild.content_replace || firstChild.content_replace || firstChild.text || firstChild.content || "",
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

      // Filter out the comment with the same ID as cid or rid parameter only if they exist
      const cid = route.query.cid as string || "";
      const rid = route.query.rid as string || "";
      let filteredComments = newComments;
      if (cid || rid) {
        filteredComments = newComments.filter((comment: { id: string | number; }) => {
          // Ensure both are strings for comparison
          return String(comment.id) !== String(cid) && String(comment.id) !== String(rid);
        });
      }

      if (append) {
        comments.value = [...comments.value, ...filteredComments];
      } else {
        comments.value = filteredComments;
      }

      const totalCount = parseInt(res.data?.allnums) || 0;

      currentPage.value = page;
      hasMoreComments.value = comments.value.length < totalCount;
    } else {
      if (!append) {
        comments.value = [];
      }
    }
  } catch (error) {
    console.log('Error loading comments:', error);
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

  try {
    let parentId = 0;
    let commentId = 0;
    const isReply = !!replyingTo.value;
    const parentCommentId = replyingTo.value?.parentCommentId || replyingTo.value?.id;

    if (replyingTo.value) {
      if (replyingTo.value.parentCommentId) {
        parentId = replyingTo.value.parentCommentId;
        // If we're replying to a reply, set reply_to_comment to the reply's id
        commentId = replyingTo.value.id;
      } else {
        parentId = replyingTo.value.replyTo ? replyingTo.value.replyTo : replyingTo.value.id;
        // If we're replying to a reply, set reply_to_comment to the reply's id
        if (replyingTo.value.replyTo) {
          commentId = replyingTo.value.id;
        }
      }
    }

    // 处理content参数，只在有span标签的@提及前面添加空格
    let processedContent = text;

    // 获取输入框的HTML内容，检查是否有span标签的@提及
    const el = commentInputRef.value;
    if (el) {
      // 检查输入框中的span标签
      const mentionSpans = el.querySelectorAll('.tag.mention');
      if (mentionSpans.length > 0) {
        // 对于每个span标签的@提及，检查其在文本中的位置
        mentionSpans.forEach((span, index) => {
          const spanText = span.textContent || '';
          if (spanText.startsWith('@')) {
            const username = spanText.substring(1);
            // 构建正则表达式，匹配@username，前面没有空格的情况
            const regex = new RegExp(`(^|[^\s])@${username}`, 'g');
            processedContent = processedContent.replace(regex, (match, prefix) => {
              return `${prefix} @${username}`;
            });
          }
        });
      }
    }

    const commentData: {
      post_id: number;
      parent_id: number;
      reply_to_comment: number;
      content: string;
      video_url: string;
      image_urls: string[];
    } = {
      post_id: props.detail.id,
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

    const authToken = token || '';
    const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);

    const response = await fetch(`${baseUrl}comment/createComment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token,
        ts,
        sign
      },
      body: JSON.stringify(commentData)
    });

    const res = await response.json();
    if (res.code === 0 || res.code === 200) {
      cancelInput();

      await updateCommentCount();

      // Emit event to update post data in parent component
      emit('update-post-data', {
        totalComments: totalComments.value
      });

      if (isReply && parentCommentId) {
        // For replies, only reload the specific comment's replies
        for (const comment of comments.value) {
          if (String(comment.id) === String(parentCommentId)) {
            comment.replyPage = 0;
            comment.replies = [];
            comment.showingReplies = true; // Ensure replies are visible
            await loadReplies(comment, 1);

            nextTick(() => {
              try {
                const commentIdStr = String(parentCommentId);
                const commentElement = document.querySelector(`[data-comment-id="${commentIdStr}"]`);
                if (commentElement && scrollContentRef.value) {
                  const rect = commentElement.getBoundingClientRect();
                  const scrollRect = scrollContentRef.value.getBoundingClientRect();
                  scrollContentRef.value.scrollTop += rect.top - scrollRect.top - 100;
                }
              } catch (error) {
                console.log('Error scrolling to comment:', error);
              }
            });
            break;
          }
        }
      } else {
        await loadComments();

        const cid = route.query.cid as string || "";
        if (cid) {
          await loadCommentDetail(cid);
        }

        const rid = route.query.rid as string || "";
        if (rid) {
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadCommentToReplyList(rid);
        }

        nextTick(() => {
          if (scrollContentRef.value) {
            scrollContentRef.value.scrollTop = 0;
          }
        });
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    console.log(error);
    toast(t('fail'));
  }
}

async function updateCommentCount() {
  try {
    var data = JSON.stringify({
      post_id: props.detail.id
    })

    const token = localStorage.getItem('token');

    const headers: HeadersInit = {};

    if (token) {
      headers['token'] = token;
    }

    const authToken = '';
    const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);
    headers['ts'] = ts;
    headers['sign'] = sign;
    headers['Platform'] = 'web';

    const response = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers: headers,
      body: data
    });

    const res = await response.json();

    if (res.code === 0 || res.code === 200) {
      totalComments.value = res.data.comment_total || '';
    }
  } catch (error) {
    console.log('Error updating comment count:', error);
  }
}

// Load comment detail
async function loadCommentDetail(commentId: string) {
  try {
    const res = await api.commentDetail(commentId) as any;
    if (res.code == 0 || res.code == 200) {
      const commentData = res.data;
      // Calculate total replies count
      const totalReplies = commentData.reply_count || commentData.children_count || 0;
      // Check if rid parameter exists
      const rid = route.query.rid as string || "";
      // Add the comment to the beginning of the comments list
      const commentObj: any = {
        id: commentData.id || commentData.comment_id || Date.now(),
        author: commentData.author || commentData.nickname || "",
        user_id: commentData.user_id || "",
        avatar: commentData.avatar || "",
        text: commentData.content_replace || commentData.text || commentData.content || "",
        likes: commentData.like_count || 0,
        liked: commentData.is_liked == 1 || false,
        images: commentData.images || [],
        video_url: commentData.video_url || "",
        created_at: commentData.created_at || "",
        reply_count: totalReplies,
        replies: [],
        initialReply: null,
        replyPage: 0,
        replyTotal: totalReplies,
        hasMoreReplies: totalReplies > 1,
        showingReplies: true,
        isMentioned: true,
        // Only add background color if there's no rid parameter
        backgroundColor: rid ? '' : '#F5F5F5'
      };

      // Check if there are children (replies) and process them
      if (commentData.children && commentData.children.length > 0) {
        // Store the first reply as initial reply
        const firstChild = commentData.children[0];
        commentObj.initialReply = {
          id: firstChild.id || firstChild.reply_id || Date.now(),
          author: firstChild.author || firstChild.nickname || firstChild.user?.nickname || "",
          user_id: firstChild.user_id || "",
          avatar: firstChild.avatar || firstChild.user?.avatar || "",
          text: firstChild.content_replace || firstChild.content_replace || firstChild.text || firstChild.content || "",
          created_at: firstChild.created_at || "",
          likes: firstChild.like_count || 0,
          liked: firstChild.is_liked == 1 || false,
          replyTo: firstChild.replyTo || firstChild.reply_to || firstChild.target_user || "",
          reply_to_user_nickname: firstChild.reply_to_user_nickname || ""
        };
        // Show the initial reply
        commentObj.replies = [commentObj.initialReply];
      }

      // Load replies for cid comment if there are replies and no rid parameter
      if (totalReplies > 0 && !rid) {
        // If we have children data, use it for initialReply
        if (commentData.children && commentData.children.length > 0) {
          const firstChild = commentData.children[0];
          commentObj.initialReply = {
            id: firstChild.id || firstChild.reply_id || Date.now(),
            author: firstChild.author || firstChild.nickname || firstChild.user?.nickname || "",
            user_id: firstChild.user_id || "",
            avatar: firstChild.avatar || firstChild.user?.avatar || "",
            text: firstChild.content_replace || firstChild.content_replace || firstChild.text || firstChild.content || "",
            created_at: firstChild.created_at || "",
            likes: firstChild.like_count || 0,
            liked: firstChild.is_liked == 1 || false,
            replyTo: firstChild.replyTo || firstChild.reply_to || firstChild.target_user || "",
            reply_to_user_nickname: firstChild.reply_to_user_nickname || ""
          };
          // Only show the first reply
          commentObj.replies = [commentObj.initialReply];
          // Set hasMoreReplies to true if there are more than 1 reply
          commentObj.hasMoreReplies = totalReplies > 1;
        } else {
          // If no children data, load replies but only show the first one
          await loadReplies(commentObj, 1);
          // Ensure we only show the first reply
          if (commentObj.replies.length > 0) {
            // Set the first reply as initialReply
            commentObj.initialReply = commentObj.replies[0];
            // Only show the first reply
            commentObj.replies = [commentObj.initialReply];
            // Set hasMoreReplies to true if there are more than 1 reply
            commentObj.hasMoreReplies = totalReplies > 1;
          } else if (totalReplies > 0) {
            // Create a placeholder reply to show
            commentObj.initialReply = {
              id: Date.now(),
              author: "",
              user_id: "",
              avatar: "",
              text: "",
              created_at: "",
              likes: 0,
              liked: false,
              replyTo: "",
              reply_to_user_nickname: ""
            };
            commentObj.replies = [commentObj.initialReply];
            commentObj.hasMoreReplies = totalReplies > 1;
          }
        }
      }

      // Add to the beginning of the comments list
      comments.value.unshift(commentObj);
    }
  } catch (error) {
    console.log('Error loading comment detail:', error);
  }
}

// Load comment to reply list
async function loadCommentToReplyList(rid: string) {
  try {
    const res = await api.commentDetail(rid) as any;
    if (res.code == 0 || res.code == 200) {
      const commentData = res.data;
      // Find the first comment in the comments list
      const firstComment = comments.value[0];
      if (firstComment) {
        // Create the comment detail object to be added to replies
        const commentDetailObj: any = {
          id: commentData.id || commentData.comment_id || Date.now(),
          author: commentData.author || commentData.nickname || "",
          user_id: commentData.user_id || "",
          avatar: commentData.avatar || "",
          text: commentData.content_replace || commentData.text || commentData.content || "",
          created_at: commentData.created_at || "",
          likes: commentData.like_count || 0,
          liked: commentData.is_liked == 1 || false,
          replyTo: commentData.replyTo || commentData.reply_to || commentData.target_user || "",
          reply_to_user_nickname: commentData.reply_to_user_nickname || "",
          backgroundColor: '#F5F5F5',
          isRidComment: true
        };

        // Add the comment detail as the first item in the replies list
        firstComment.replies.unshift(commentDetailObj);
        firstComment.showingReplies = true;
        // Store rid for filtering later
        firstComment.rid = rid;
      }
    }
  } catch (error) {
    console.log('Error loading comment to reply list:', error);
  }
}

// Toggle like
function toggleLike() {
  if (!props.detail.id) return;

  api.likePost({ post_id: props.detail.id, action: liked.value ? 'unlike' : 'like' })
    .then((response: any) => {
      if (response.code === 0) {
        liked.value = !liked.value;
        likes.value = liked.value ? likes.value + 1 : likes.value - 1;

        // Emit event to update post data in parent component
        emit('update-post-data', {
          likes: likes.value,
          liked: liked.value
        });
      }
    })
    .catch((error) => {
      console.error('Error toggling like:', error);
      toast(t('fail'));
    });
}

// Share function
function share() {
  // Implement share functionality
  console.log('Share functionality');
}

// Composition event handlers
function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd() {
  isComposing.value = false;
  handleInput();
}

// Paste handler
function handlePaste(event: ClipboardEvent) {
  // Implement paste functionality
  console.log('Paste functionality');
}

// Input blur handler
function onInputBlur() {
  // Implement blur functionality
  console.log('Input blur');
}

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
    console.log("Search error:", error);
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
  loadText.value = t('detail.uploading');
  isLoading.value = true;

  try {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        videoSize.value = parseFloat((file.size / (1024 * 1024)).toFixed(1));
        resolve(true);
      };
    });

    const videoIdResponse = await api.getVideoId({ filename: file.name, filesize: file.size }) as any;
    if (!videoIdResponse || videoIdResponse.code !== 0) {
      toast(getI18nMsg(videoIdResponse));
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
        toast(getI18nMsg(videoUrlData));
        return false;
      }

      const etag = videoUrlData.data?.etag || '';
      uploadedParts.push({ PartNumber: i, ETag: etag });
    }

    const videoMergeResponse = await api.getVideoMerge({ uploadId, key: fileKey, parts: JSON.stringify(uploadedParts) }) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      toast(getI18nMsg(videoMergeResponse));
      return false;
    }

    videoUrl.value = videoMergeResponse.data.url || '';

    uploadedFiles.value.push({
      type: 'video',
      url: videoUrl.value,
      file});
  } catch (error: any) {
    toast(getI18nMsg(error?.response?.data || error));
  } finally {
    isLoading.value = false;
  }
}

async function uploadImage(file: File) {
  const token = localStorage.getItem("token");
  if (!token) {
    return '';
  }

  loadText.value = t('detail.uploading');
  isLoading.value = true;

  try {
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
    isLoading.value = false;
  }
}

function handleScroll() {
  if (scrollContentRef.value) {
    isScrolled.value = scrollContentRef.value.scrollTop > 10;

    // Check if scrolled to near bottom (within 10px) for loading more comments
    if (activeTab.value === 'comment' && !loadingMore.value && hasMoreComments.value && commentsListRef.value) {
      const scrollTop = commentsListRef.value.scrollTop;
      const scrollHeight = commentsListRef.value.scrollHeight;
      const clientHeight = commentsListRef.value.clientHeight;

      if (scrollHeight - scrollTop - clientHeight <= 10) {
        loadComments(currentPage.value + 1, true);
      }
    }
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
    // 暂停左侧主视频
    if (videoRef.value) {
      videoRef.value.pause();
    }

    // 暂停所有评论区和回复区的视频
    const commentVideos = document.querySelectorAll('.c-video-player');
    commentVideos.forEach(video => {
      (video as HTMLVideoElement).pause();
    });

    // 显示视频预览模态框
    showPreviewModal.value = true;
    curVideoUrl.value = file.url;
  }
}

// Handle scroll to load more comments
function handleCommentsScroll() {
  const scrollContent = commentsListRef.value;
  if (!scrollContent || loadingMore.value || !hasMoreComments.value) return;

  const scrollTop = scrollContent.scrollTop;
  const scrollHeight = scrollContent.scrollHeight;
  const clientHeight = scrollContent.clientHeight;

  // Check if scrolled to near bottom (within 10px)
  if (scrollHeight - scrollTop - clientHeight <= 10) {
    loadComments(currentPage.value + 1, true);
  }
}

// Handle fullscreen change event on document
function handleFullscreenChange() {
  const fullscreenEl = document.fullscreenElement;
  isPageFullscreen.value = fullscreenEl !== null;

  const collectionInfoBar = document.querySelector('.collection-info-bar') as HTMLElement | null;
  const collectionModeBar = document.querySelector('.collection-mode-bar') as HTMLElement | null;
  const navArrows = document.querySelector('.nav-arrows') as HTMLElement | null;

  if (isPageFullscreen.value) {
    // Page is in fullscreen mode — elevate z-index of overlay elements
    if (collectionInfoBar) {
      collectionInfoBar.style.zIndex = '10000';
    }
    if (collectionModeBar) {
      collectionModeBar.style.zIndex = '10000';
    }
    if (navArrows) {
      navArrows.style.zIndex = '10000';
    }
  } else {
    // Exited fullscreen — restore z-index
    if (collectionInfoBar) {
      collectionInfoBar.style.zIndex = '10';
    }
    if (collectionModeBar) {
      collectionModeBar.style.zIndex = '10';
    }
    if (navArrows) {
      navArrows.style.zIndex = '10';
    }
    // 退出全屏时，如果是图片类型，恢复右侧面板显示
    if (props.detail.type === '1') {
      isRightPanelHidden.value = false;
      activeTab.value = isCollectionMode.value ? 'collection' : 'detail';
    }
  }
}

function closePreviewModal() {
  showPreviewModal.value = false;
  curVideoUrl.value = '';
}

// Close sidebar
function close() {
  cancelInput();
  activeTab.value = 'comment';
  emit('close');
}

// Watch for activeTab changes from parent
watch(() => props.activeTab, (newTab) => {
  activeTab.value = newTab;
  if (newTab == 'toc') {
    loadChapters();
  } else if (newTab == 'comment') {
    loadComments();
  }
}, { immediate: true });

// Watch for visible changes to reload comments when sidebar opens
watch(() => props.visible, (newVisible) => {
  if (newVisible && activeTab.value === 'comment') {
    loadComments();
  }
});

// Watch for detail changes to update comment count
watch(() => props.detail, (newDetail) => {
  if (newDetail && newDetail.comment_total !== undefined) {
    totalComments.value = newDetail.comment_total.toString();
  }
}, { immediate: true, deep: true });

// Load chapters list
async function loadChapters(isLoadMore = false) {
  if (!props.detail.book_id || Number(props.detail.book_id) === 0) {
    chapters.value = [];
    chapterCount.value = 0;
    hasMoreChapters.value = false;
    currentPage.value = 1;
    return;
  }

  // If loading more but no more chapters, return
  if (isLoadMore && !hasMoreChapters.value) return;

  isLoadingChapters.value = true;

  try {
    const page = isLoadMore ? currentPage.value + 1 : 1;
    // Get user_id from localStorage
    const userInfoStr = localStorage.getItem('userInfo');
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
    const userId = userInfo?.id || 0;

    const response = await api.singleCollection(String(props.detail.book_id), page, pageSize.value) as any;
    if (response.code === 0) {
      const newChapters = (response.data?.data || []).map((chapter: any) => ({
        ...chapter,
        liked: chapter.is_liked == 1 || chapter.is_liked === true,
        likes: chapter.likes || 0
      }));

      if (isLoadMore) {
        chapters.value = [...chapters.value, ...newChapters];
      } else {
        chapters.value = newChapters;
        currentPage.value = 1;
        hasMoreChapters.value = true;
      }

      chapterCount.value = response.data?.allnums || response.data?.count || 0;

      // Check if there are more chapters
      if (newChapters.length < pageSize.value) {
        hasMoreChapters.value = false;
      } else {
        currentPage.value = page;
      }
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  } finally {
    isLoadingChapters.value = false;
  }
}

// Navigate to chapter
function navigateToChapter(chapter: any) {
  emit('navigate-to-chapter', chapter);
  emit('close');
}

// Go to collection detail page
function goToCollectionDetail() {
  if (props.detail.book_id && Number(props.detail.book_id) > 0) {
    emit('close');

    router.push(`/collection/${props.detail.book_id}?uid=${props.detail.author.id}`);
  }
}

// Toggle like for chapter
async function toggleChapterLike(chapter: any, event: MouseEvent) {
  // Prevent the click event from triggering navigateToChapter
  event.stopPropagation();

  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    const previousLiked = chapter.liked;
    const previousLikes = chapter.likes;

    if (!chapter.liked) {
      // Like chapter
      const res = await api.likePost({ post_id: chapter.post_id }) as any;
      if (res.code === 0 || res.code === 200) {
        chapter.liked = true;

        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          chapter.likes = Number(res.data.like_count || res.data.likes);
        } else {
          chapter.likes = previousLikes + 1;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else {
      // Unlike chapter
      const res = await api.dislikePost({ post_id: chapter.post_id }) as any;
      if (res.code === 0 || res.code === 200) {
        chapter.liked = false;
        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          chapter.likes = Number(res.data.like_count || res.data.likes);
        } else {
          chapter.likes = Math.max(0, previousLikes - 1);
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

// Handle toc list scroll
function handleTocScroll() {
  if (!tocListRef.value || isLoadingChapters.value || !hasMoreChapters.value) return;

  const { scrollTop, scrollHeight, clientHeight } = tocListRef.value;

  // When scroll to bottom
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadChapters(true);
  }
}

// Navigate to user home
function navigateToUserHome() {
  emit('navigate-to-user', props.detail.author.id);
  emit('close');
}

// Load more replies
function loadMoreReplies(comment: any) {
  if (comment.reply_count > comment.replies.length) {
    api.replyList(comment.id, Math.floor(comment.replies.length / 10) + 1, 10)
      .then((response: any) => {
        if (response.code === 0) {
          if (!comment.replies) {
            comment.replies = [];
          }
          comment.replies = [...comment.replies, ...(response.data?.data || [])];
        }
      })
      .catch((error: any) => {
        console.error('Error loading more replies:', error);
      });
  }
}

// Like reply
function likeReply(id: string, liked: boolean) {
  api.likeComment({ comment_id: id, action: liked ? 'unlike' : 'like' })
    .then((response: any) => {
      if (response.code === 0) {
        // Update reply likes
        comments.value.forEach(comment => {
          if (comment.replies) {
            comment.replies.forEach((reply: any) => {
              if (reply.id === id) {
                reply.liked = liked;
                reply.likes = liked ? reply.likes + 1 : reply.likes - 1;
              }
            });
          }
        });
      }
    })
    .catch((error: any) => {
      console.error('Error liking reply:', error);
      toast(t('fail'));
    });
}
</script>

<style scoped lang="scss">
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 60rem;
  height: 100vh;
  background-color: white;
  box-shadow: -0.2rem 0 1rem rgba(0, 0, 0, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 8.4rem;
    padding: 0 2.4rem;
    border-bottom: 1px solid #F5F5F5;

    .header-tabs {
      display: flex;
      height: 100%;
      gap: 3rem;

      .tab-item {
        display: flex;
        align-items: center;
        font-size: 1.8rem;
        color: #6A7282;
        cursor: pointer;
        position: relative;

        &.active {
          color: #101828;
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0.2rem;
            background-color: #FB64B6;
          }
        }
      }
    }

    .close-btn {
      position: absolute;
      top: 1.8rem;
      right: 2.4rem;
      width: 4.8rem;
      height: 4.8rem;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    padding-bottom: 9rem;

    .detail-tab {
      flex: 1;
      overflow-y: auto;
      padding: 2.4rem;

      .detail-content {
        .user-info {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-bottom: 2.4rem;
          cursor: pointer;

          .avatar {
            width: 4.8rem;
            height: 4.8rem;
            border-radius: 50%;
          }

          .nickname {
            font-size: 1.6rem;
            color: #364153;
            font-weight: 500;
          }
        }

        .post-info {
          margin-bottom: 2.4rem;

          .post-title {
            font-size: 2rem;
            color: #364153;
            font-weight: 500;
            margin-bottom: 1.6rem;
          }

          .post-desc {
            font-size: 1.4rem;
            color: #6A7282;
            line-height: 2rem;
            margin-bottom: 1.6rem;
          }

          .post-time-box {
            .post-time {
              font-size: 1.2rem;
              color: #99A1AF;
            }
          }
        }

        .header-actions {
          .action-btns {
            display: flex;
            gap: 1.6rem;

            .action-btn {
              padding: 0.8rem 2rem;
              border-radius: 2rem;
              font-size: 1.4rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.8rem;

              &.follow-btn {
                background-color: #ff6b6b;
                color: white;
                position: relative;

                img {
                  width: 1.6rem;
                  height: 1.6rem;
                }

                .btn-text {
                  font-weight: 500;
                }

                .hover-text {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: #e955a8;
                  border-radius: 2rem;
                  opacity: 0;
                  transition: opacity 0.3s;
                }

                &:hover .hover-text {
                  opacity: 1;
                }

                &.followed {
                  background-color: #f0f0f0;
                  color: #6A7282;

                  .hover-text {
                    background-color: #e0e0e0;
                    color: #6A7282;
                  }
                }
              }
            }
          }
        }
      }
    }

    .comments-tab {
      flex: 1;
      display: flex;
      flex-direction: column;

      .comments-header {
        padding: 2.4rem;
        font-size: 1.4rem;
        color: #6A7282;
      }

      .comments-list {
        flex: 1;
        overflow-y: auto;
        padding: 0 2.4rem;

        .loading-more {
          text-align: center;
          padding: 2rem 0;
          color: #99a1af;
          font-size: 1.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6rem;

          .loading-spinner {
            width: 4rem;
            height: 4rem;
            border: 0.4rem solid #F5F5F5;
            border-top: 0.4rem solid #6A7282;
            border-radius: 50%;
            animation: spin 1s ease-in-out infinite;
          }

          p {
            font-size: 1.4rem;
            color: #99A1AF;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }

        .empty-with-padding {
          padding: 4rem 0;
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

          .author-wrap {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
          }

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

          &.hidden {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 1.4rem;
            color: #99A1AF;

            .hidden-icon {
              width: 2rem;
              height: 2rem;
              object-fit: contain;
              flex-shrink: 0;
            }
          }
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
              color: #99A1AF;
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

      .show-more-replies {
        font-size: 1.2rem;
        color: #ff6b6b;
        cursor: pointer;
        margin-left: 5.2rem;
        margin-top: 0.8rem;

        &:hover {
          text-decoration: underline;
        }
      }

      .right-footer {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 60rem;
        padding: 1.8rem 2.4rem;
        border-top: 1px solid #F5F5F5;
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
            border: 1px solid #F5F5F5;
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

                video{
                  width: auto;
                  max-width: 100%;
                  height: 100%;
                  object-fit: contain;
                }

                .video-icon {
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  transform: translateX(-50%) translateY(-30%);
                  width: 6rem;
                  height: 6rem;
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
    }

    .toc-tab {
      flex: 1;
      display: flex;
      flex-direction: column;

      .collection-name {
        margin-bottom: 2rem;
        padding: 2.4rem 2.4rem 0;
        font-size: 1.6rem;
        font-weight: 500;
        line-height: 3.2rem;
        color: #364153;
      }

      .toc-header {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 0 2.4rem 2.4rem;
        border-bottom: 0.1rem solid #F5F5F5;
        font-size: 1.4rem;
        color: #6A7282;

        .view-collection-info{
          color: #FB64B6;
          cursor: pointer;
        }
      }

      .toc-list {
        flex: 1;
        overflow-y: auto;

        .toc-item {
            height: 7.2rem;
            padding: 0 2.4rem;
            cursor: pointer;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;

            &.active {
              background: rgba(251,100,182,0.06);
            }

            .toc-info{
              display: flex;
              align-items: center;
              width: 100%;
              height: 100%;
              border-bottom: 1px solid #F5F5F5;

              &.on{
                .chapter-title {
                  color: #99A1AF;
                }
              }
            }

            .chapter-title {
              flex: 1;
              min-width: 0;
              font-size: 1.6rem;
              color: #364153;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-right: 1.2rem;
            }

            .subscribe-badge {
              flex-shrink: 0;
              padding: 0.6rem 1.6rem;
              background-color: #F5F5F5;
              color: #6A7282;
              border-radius: 0.6rem;
              font-size: 1.4rem;
            }

            .chapter-actions {
              display: flex;
              align-items: center;
              height: 100%;
              padding-left: 1.6rem;
              border-bottom: 0.1rem solid #F5F5F5;

              .collection-views {
                display: flex;
                align-items: center;
                cursor: pointer;

                img {
                  width: 1.6rem;
                  height: 1.6rem;
                  margin-right: 0.8rem;

                  &.active {
                    filter: invert(50%) sepia(100%) saturate(500%) hue-rotate(300deg) brightness(100%) contrast(100%);
                  }
                }

                span {
                  font-size: 1.4rem;
                  color: #6A7282;
                }
              }
            }
          }

        .loading-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          min-height: 20rem;

          .loading-spinner {
            width: 2.4rem;
            height: 2.4rem;
            border: 0.3rem solid #f3f3f3;
            border-top: 0.3rem solid #ff6b6b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1.2rem;
          }

          p {
            font-size: 1.4rem;
            color: #99A1AF;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }

        .empty-with-padding {
          padding: 4rem 0;
          min-height: 20rem;
        }


      }
    }
  }
}

.no-more {
  text-align: center;
  padding: 2rem;
  font-size: 1.4rem;
  color: #99A1AF;
}

/* Hidden file inputs */
.hidden-file-input {
  display: none;
}

/* Dropdown Menu */
.c-more-wrap {
  position: relative;
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

.comment-main:hover .c-more-btn,
.reply-item:hover .c-more-btn,
.c-more-wrap:hover .c-more-btn {
  opacity: 1;
}

.dropdown-menu {
  position: absolute;
  right: -1.8rem;
  top: 100%;
  margin-top: 0.2rem;
  border-radius: 0.6rem;
  background: #FFFFFF;
  box-shadow: 0px 0px 15px -3px rgba(0,0,0,0.08);
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
    color: #6A7282;
  }
}

</style>