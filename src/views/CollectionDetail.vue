<template>
  <div class="collection-detail">
    <Header :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="content-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>

      <!-- Content -->
      <template v-else-if="collection">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <span class="breadcrumb-item" @click="goHome">{{ authorInfo.nickname }}{{ t('collectionDetail.community') }}</span>
          <span class="breadcrumb-arrow">|</span>
          <span class="breadcrumb-item active">{{ collection.title }}</span>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Author Section -->
          <div class="author-section">
            <div class="author-left">
              <div class="cover-image">
                <img :src="processImageUrl(collection.cover) || defaultCover" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultCover }" />
                <div class="r18-overlay" v-if="collection.is_nsfw == 1">
                  <span class="r18-text">R18</span>
                </div>
              </div>
              <div class="author-info">
                <div class="title-row">
                  <h1 class="title">{{ collection.title }}</h1>
                  <div class="type-badge" :class="`type-${collection.type || '1'}`">{{ getTypeLabel(collection.type) }}</div>
                </div>

                <div class="update-read-section">
                  <div class="status-row">
                    <span class="status">{{ collection.status == '2' ? t('collectionSettings.statusFinished') : t('collectionSettings.statusOngoing') }}</span>
                  </div>
                  <div class="update-chapter" v-if="Number(collection.latestChapterIndex) > 0">
                    <span class="label">{{ t('collectionDetail.lastUpdate') }}：</span>
                    <span class="chapter-value">
                      {{ t('home.chapterFormat', { chapter: collection.latestChapterIndex }) }}
                    </span>
                    <span class="time">{{ formatTimestamp(collection.lastUpdate) }}</span>
                  </div>
                  <div class="read-info" v-if="collection.history">
                    <span class="label">{{ t('collectionDetail.lastRead') }}：</span>
                    <span class="value">{{ collection.history.title }}</span>
                  </div>
                  <div class="btn-row">
                    <button class="favorite-btn" :class="{ active: isLiked }" @click="toggleLike" v-if="!isOwn">
                      <img v-if="!isLiked" src="@/assets/images/detail/collect.png" alt="" />
                      <img v-else src="@/assets/images/detail/collect_active.png" alt="" />
                      <span>{{ isLiked ? t('collectionDetail.favorited') : t('collectionDetail.favorite') }}</span>
                    </button>
                    <button class="continue-reading-btn" v-if="collection.chapters && collection.chapters.length > 0 && collection.history && !Array.isArray(collection.history)" @click="continueReading">{{ t('collectionDetail.continueReading') }}</button>
                    <button class="continue-reading-btn" v-if="collection.chapters && collection.chapters.length > 0 && (!collection.history || Array.isArray(collection.history))" @click="startReading">{{ t('collectionDetail.startReading') }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Author Info (always show) -->
            <div class="author-right">
              <div class="avatar-top">
                <div class="avatar-container" @click="goHome">
                  <img :src="authorInfo.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                </div>
                <div class="author-name" @click="goHome">{{ authorInfo.nickname }}</div>
              </div>

              <div class="avatar-bottom">
                <div class="stats">
                  <div class="stat-item">
                    <span class="stat-label">{{ t('collectionDetail.workCount') }}</span>
                    <span class="stat-value">{{ formatNumber(totalWorks) }}</span>
                  </div>

                  <div class="stat-line"></div>

                  <div class="stat-item">
                    <span class="stat-label">{{ t('collectionDetail.followerCount') }}</span>
                    <span class="stat-value">{{ formatNumber(authorInfo.followerCount) }}</span>
                  </div>
                </div>

                <!-- Only show action buttons if not own -->
                <div class="action-buttons" v-if="!isOwn">
                  <button
                    class="btn btn-follow"
                    :class="{ followed: authorInfo.isFollow == 1 }"
                    @click="toggleFollow"
                  >
                    <span class="btn-text">{{ authorInfo.isFollow == 1 ? t('detail.following') : t('detail.follow') }}</span>
                    <span class="hover-text" v-if="authorInfo.isFollow == 1">{{ t('detail.unfollow') }}</span>
                  </button>
                  <button
                    v-if="authorInfo.subscribePrice"
                    class="btn btn-subscribe"
                    :class="{ subscribed: authorInfo.isSubscribe == 1 }"
                    :disabled="authorInfo.isSubscribe == 1"
                    @click="toggleSubscribe"
                  >
                    {{ authorInfo.isSubscribe == 1 ? t('userHome.subscribed') : t('userHome.subscribePriceOnly', { price: authorInfo.subscribePrice }) }}
                  </button>
                </div>
                <div v-if="!isOwn && authorInfo.subscribePrice" class="subscribe-tip">{{ t('userHome.subscribeUnlock') }}</div>
              </div>
            </div>
          </div>

          <!-- Description Section -->
          <div class="section">
            <h2 class="section-title">{{ getTypeLabel(collection.type) }}{{ t('collectionDetail.description') }}</h2>
            <div class="description-content">{{ collection.description || '' }}</div>
          </div>

          <!-- Table of Contents -->
          <div class="section-chapter">
            <div class="section-header">
              <h2 class="section-title">{{ getTypeLabel(collection.type) }}{{ t('collectionDetail.tableOfContents') }}</h2>

              <!-- <button
                v-if="isOwn"
                class="publish-btn"
                @click="goPublish"
              >{{ t('collectionDetail.publish') }}</button> -->
            </div>

            <div class="chapter-list" :class="{ 'is-own': isOwn }">
              <div
                v-for="(chapter, index) in collection.chapters"
                :key="chapter.id"
                class="chapter-item"
                :class="{ 'is-read': collection.readIndexes.includes(index + 1), 'is-own': isOwn }"
                @click="goChapter(chapter)"
              >
                <div class="chapter-left">
                  <span
                    v-if="chapter.accessRights && chapter.accessRights != '1' && (chapter.accessRights != '3' || isOwn)"
                    class="chapter-status"
                    :class="getPermClass(chapter.accessRights)"
                  >{{ getPermText(chapter.accessRights) }}</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>
                <div class="chapter-right" v-if="isOwn && collection.status != '2'">
                  <div class="chapter-action" @click.stop="editChapter(chapter)">
                    <img class="action-icon" src="@/assets/images/user/edit.png" alt="" />
                    <span class="action-text">{{ t('collectionDetail.edit') }}</span>
                  </div>
                  <div class="chapter-action" @click.stop="confirmDeleteChapter(chapter)">
                    <img class="action-icon" src="@/assets/images/user/delete.png" alt="" />
                    <span class="action-text action-text-danger">{{ t('collectionDetail.delete') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <SensitiveContentAdultConfirmModal
      v-if="showSensitiveContentAdultConfirmModal"
      @close="showSensitiveContentAdultConfirmModal = false"
      @confirm="handleSensitiveContentAgeConfirm"
    />

    <SensitiveContentConfirmModal
      v-if="showSensitiveContentConfirmModal"
      @close="showSensitiveContentConfirmModal = false"
      @confirm="confirmSensitiveContent"
    />

    <DeleteChapterConfirmModal
      v-if="showDeleteChapterModal"
      :visible="showDeleteChapterModal"
      @close="showDeleteChapterModal = false"
      @confirm="deleteChapter(currentChapter)"
    />
  </div>
</template>

<script setup lang="ts" name="CollectionDetail">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Header from '@/components/Header.vue';
import SensitiveContentAdultConfirmModal from '@/components/SensitiveContentAdultConfirmModal.vue';
import SensitiveContentConfirmModal from '@/components/SensitiveContentConfirmModal.vue';
import DeleteChapterConfirmModal from '@/components/DeleteChapterConfirmModal.vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import { toast } from '@/util/toast';
import { formatTimestamp, processImageUrl } from '@/util/utils';
import { eventBus } from '@/utils/eventBus';
import { trackBookView } from '@/util/viewTracker';
import defaultCover from '@/assets/images/base/cover.png';
import defaultAvatar from '@/assets/images/base/avatar.png';

const { t, locale } = useI18n();
const contentSwitch = useContentSwitchStore();
const route = useRoute();
const router = useRouter();

interface Chapter {
  id: string | number;
  title: string;
  subtitle?: string;
  status: 'published' | 'draft' | 'subscribed' | 'private';
  accessRights?: '1' | '2' | '3';
}

interface CollectionHistory {
  post_id: string;
  chapter_index: string;
  title: string;
  cover: string;
}

interface Collection {
  id: string | number;
  title: string;
  cover: string;
  tags: string[];
  lastUpdate: string;
  lastRead: string;
  description: string;
  isOwn: boolean;
  authorId: string | number;
  latestChapterIndex: string;
  type: string;
  status: string;
  chapters: Chapter[];
  is_nsfw: number | string;
  chapter_count_private: number | string;
  readIndexes: number[];
  history: CollectionHistory | null;
}

interface BooksGroupItem {
  type: string;
  num: string;
}

interface AuthorInfo {
  id: string | number;
  nickname: string;
  avatar: string;
  totalPosts: number;
  followerCount: number;
  isFollow: number;
  isSubscribe: number;
  subscribePrice: string;
  books_group: BooksGroupItem[];
}

const collection = ref<Collection | null>(null);
const authorInfo = ref<AuthorInfo>({
  id: '',
  nickname: '',
  avatar: '',
  totalPosts: 0,
  followerCount: 0,
  isFollow: 0,
  isSubscribe: 0,
  subscribePrice: '$12/月',
  books_group: []
});
const loading = ref(false);
const userRegion = ref(false);
const userInfo = ref<any>(null);
const showSensitiveContentAdultConfirmModal = ref(false);
const showSensitiveContentConfirmModal = ref(false);
const pendingChapter = ref<Chapter | null>(null);

function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

async function getCountry() {
  try {
    const res = await api.getCode() as any;
    if (res.code == 0) {
      userRegion.value = res.data.countryCode != 'CN';
    }
  } catch {
    userRegion.value = false;
  }
}

function getChapterLabel(type: string): string {
  switch (type) {
    case '2':
      return '章';
    case '1':
    case '3':
      return '集';
    default:
      return '集';
  }
}

function getTypeLabel(type: string): string {
  return t(`collectionDetail.type${type || '1'}`);
}

const currentChapter = ref<Chapter | null>(null);
const isOwn = ref(false);
const isLiked = ref(false);
const showDeleteChapterModal = ref(false);

const tagColors = ['tag-pink', 'tag-yellow', 'tag-green'];

const totalWorks = computed(() => {
  const booksGroup = authorInfo.value.books_group || [];
  return booksGroup.reduce((sum, item) => sum + (parseInt(item.num) || 0), 0);
});

function getTagClass(index: number): string {
  return tagColors[index % tagColors.length];
}

async function fetchCollectionDetail() {
  try {
    loading.value = true;
    const bookId = route.query.book_id || route.params.id;

    if (!bookId) {
      console.error('No book ID found');
      return;
    }

    const id = (Array.isArray(bookId) ? bookId[0] : bookId) as string;
    if (!id) {
      console.error('No book ID found');
      return;
    }

    const localUid = localStorage.getItem('uid');
    await contentSwitch.ensureLoaded();
    const showNsfw = contentSwitch.showNsfw;

    // 先请求合集详情接口（公开接口）
    let response = await api.getCollectionDetail(id) as any;

    if (response.code == 0) {
      const data = response.data;
      const bookInfo = data.book_info || data;

      // 从 book_info 获取作者 ID
      const resolvedAuthorId = bookInfo?.user_id || data.author?.id || data.author_id || '';

      // 如果是自己作品，用私密接口重新请求以获取完整章节数据
      const isSelf = !!localUid && String(localUid) === String(resolvedAuthorId);
      if (isSelf) {
        response = await api.getSelfCollectionDetail(id) as any;
      }

      if (response.code == 0) {
        const finalData = response.data;
        const finalBookInfo = finalData.book_info || finalData;
        const chaptersData = finalData.chatpers || finalData.chapters || [];

        isOwn.value = isSelf;
        isLiked.value = finalData.is_fav == 1;

        collection.value = {
          id: finalBookInfo.id || finalData.book_id || '',
          title: finalBookInfo.title || '',
          cover: finalBookInfo.cover || defaultCover,
          tags: finalData.tags || [],
          lastUpdate: finalBookInfo.updated_at || finalBookInfo.latest_post_updated || '',
          lastRead: finalData.last_read || '',
          description: finalBookInfo.description || '',
          isOwn: isSelf,
          authorId: resolvedAuthorId,
          latestChapterIndex: finalBookInfo.chapter_count || '',
          type: finalBookInfo.type || '',
          status: finalBookInfo.status || '',
          is_nsfw: finalBookInfo.is_nsfw || 0,
          chapter_count_private: finalBookInfo.chapter_count_private || 0,
          readIndexes: Array.isArray(finalData.indexs) ? finalData.indexs.map(Number) : [],
          chapters: chaptersData.map((chapter: any) => ({
            id: chapter.post_id || chapter.id,
            title: chapter.title || '',
            subtitle: chapter.subtitle,
            status: chapter.status as 'published' | 'draft' | 'subscribed' | 'private' || 'published',
            accessRights: (String(chapter.access_rights) as '1' | '2' | '3') || '1'
          })),
          history: finalData.history && !Array.isArray(finalData.history) && finalData.history.post_id ? {
            post_id: String(finalData.history.post_id || ''),
            chapter_index: String(finalData.history.chapter_index || '0'),
            title: finalData.history.title || '',
            cover: finalData.history.cover || ''
          } : null
        };

        // 从 book_info 获取作者后，请求博主详情接口
        if (resolvedAuthorId) {
          await fetchAuthorInfo(resolvedAuthorId, showNsfw);
        }
      } else {
        toast(locale.value == 'en' ? response.msg : locale.value == 'zh' ? response.msg_cn : locale.value == 'tc' ? response.msg_tc : response.msg_jp);
      }
    } else {
      toast(locale.value == 'en' ? response.msg : locale.value == 'zh' ? response.msg_cn : locale.value == 'tc' ? response.msg_tc : response.msg_jp);
    }
  } catch (error) {
    console.error('Failed to fetch collection detail:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchAuthorInfo(authorId: string | number, showNsfw?: number) {
  try {
    const localUid = localStorage.getItem('uid');
    const isSelf = String(localUid) === String(authorId);

    let res;
    if (isSelf) {
      res = await api.authorSelfInfo();
    } else {
      res = await api.authorInfo(authorId, showNsfw);
    }

    const data = res as any;
    if (data.code == 0 || data.code == 200) {
      authorInfo.value = {
        id: data.data?.user?.id || data.data?.id || authorId,
        nickname: data.data?.user?.nickname || data.data?.nickname || '',
        avatar: data.data?.user?.avatar || data.data?.avatar || defaultAvatar,
        totalPosts: parseInt(data.data?.user?.total_posts || data.data?.total_posts || '0'),
        followerCount: parseInt(data.data?.user?.follower_count || data.data?.follower_count || '0'),
        isFollow: data.data?.is_follow || 0,
        isSubscribe: data.data?.is_subscribe || 0,
        subscribePrice: data.data?.subscribe_price || '',
        books_group: data.data?.books_group || []
      };

      // 如果是看别人的合集且订阅价格为空，请求订阅计划接口
      if (!isSelf && !authorInfo.value.subscribePrice) {
        try {
          const subscriptionRes = await api.getOthersSubscription({ blogger_id: authorId }) as any;
          if (subscriptionRes.code === 0 && subscriptionRes.data?.plan) {
            authorInfo.value.subscribePrice = subscriptionRes.data.plan.price || '';
          }
        } catch (error) {
          console.error('Failed to fetch subscription price:', error);
        }
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    console.error('Failed to fetch author info:', error);
  }
}

function goHome() {
  const type = collection.value?.type || '1';
  router.push(`/user-home?id=${authorInfo.value.id}&type=${type}`);
}

function goPublish() {
  console.log('Go to publish');
}

function handleUserInfoLoaded(info: any) {
  userInfo.value = info;
}

async function handleSensitiveContentAgeConfirm(isAdult: boolean) {
  showSensitiveContentAdultConfirmModal.value = false;
  // 选择"否"：未满18岁，直接关闭不开启
  if (!isAdult) {
    pendingChapter.value = null;
    return;
  }
  // 选择"是"：声明已满18岁（与首页一致：已登录写回后端，未登录仅本地缓存）
  localStorage.setItem('is_adult', '1');
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await api.setAdult({ is_adult: 1 }) as any;
      if (res.code != 0 && res.code != 200) {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
        return;
      }
    } catch (error) {
      console.error('Error setting adult:', error);
      return;
    }
    if (userInfo.value) {
      userInfo.value.is_adult = 1;
    }
  }
  // 确认满18岁后直接开启敏感浏览并进入章节（不再弹「允许敏感？」）
  localStorage.setItem('allowSensitiveContent', '1');
  const chapter = pendingChapter.value;
  pendingChapter.value = null;
  if (chapter) {
    navigateToChapter(chapter);
  }
}

function goChapter(chapter: Chapter) {
  if (isOwn.value) {
    navigateToChapter(chapter);
    return;
  }

  if (collection.value?.is_nsfw == 1) {
    // nsfw content - allow directly without age/sensitive checks
  }

  navigateToChapter(chapter);
}

function navigateToChapter(chapter: Chapter) {
  const ct = collection.value?.type || '';
  router.push(`/detail?id=${chapter.id}${ct ? `&tab=${ct}` : ''}`);
}

function startReading() {
  const chapters = collection.value?.chapters;
  if (!chapters || chapters.length === 0) return;
  const firstChapter = chapters[0];
  goChapter(firstChapter);
}

function continueReading() {
  const history = collection.value?.history;
  if (!history) return;
  const ct = collection.value?.type || '';
  const ctParam = ct ? `&tab=${ct}` : '';

  if (isOwn.value) {
    router.push(`/detail?id=${history.post_id}${ctParam}`);
    return;
  }

  if (collection.value?.is_nsfw == 1) {
    // nsfw content - allow directly without age/sensitive checks
  }

  router.push(`/detail?id=${history.post_id}${ctParam}`);
}

function confirmSensitiveContent() {
  showSensitiveContentConfirmModal.value = false;
  localStorage.setItem('allowSensitiveContent', '1');
  if (pendingChapter.value) {
    navigateToChapter(pendingChapter.value);
    pendingChapter.value = null;
  }
}

async function toggleFollow() {
  if (!checkLogin()) return;

  if (!authorInfo.value.id) return;

  const data = {
    followed_id: authorInfo.value.id
  };

  try {
    if (authorInfo.value.isFollow == 1) {
      const res = await api.unfollow(data) as any;
      if (res.code == 0) {
        authorInfo.value.isFollow = 0;
        authorInfo.value.followerCount = Math.max(0, authorInfo.value.followerCount - 1);
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    } else {
      const res = await api.follow(data) as any;
      if (res.code == 0) {
        authorInfo.value.isFollow = 1;
        authorInfo.value.followerCount = authorInfo.value.followerCount + 1;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
  }
}

async function toggleLike() {
  if (!checkLogin()) return;
  if (!collection.value || !collection.value.id) return;

  try {
    if (isLiked.value) {
      const res = await api.unlikeBook({ book_id: collection.value.id }) as any;
      if (res.code == 0 || res.code == 200) {
        isLiked.value = false;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    } else {
      const res = await api.likeBook({ book_id: collection.value.id }) as any;
      if (res.code == 0 || res.code == 200) {
        isLiked.value = true;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

function toggleSubscribe() {
  if (!authorInfo.value.id) return;

  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (authorInfo.value.isSubscribe === 1) {
    toast(t('userHome.alreadySubscribed'));
  } else {
    router.push(`/subscription-payment?id=${authorInfo.value.id}`);
  }
}

function editChapter(chapter: Chapter | null) {
  if (chapter && collection.value) {
    const type = collection.value.type;
    let path = '/publish/comic';
    if (type === '2') {
      path = '/publish/novel';
    } else if (type === '3') {
      path = '/publish/video';
    }
    router.push({ path, query: { post_id: chapter.id.toString() } });
  }
}

async function refreshChapters() {
  try {
    const bookId = route.query.book_id || route.params.id;
    if (!bookId) return;
    const id = (Array.isArray(bookId) ? bookId[0] : bookId) as string;
    if (!id) return;

    const localUid = localStorage.getItem('uid');
    await contentSwitch.ensureLoaded();
    const showNsfw = contentSwitch.showNsfw;

    // 先请求公开接口，从 book_info 获取作者后判断是否为自己作品
    let response = await api.getCollectionDetail(id) as any;

    if (response.code === 0) {
      const data = response.data;
      const bookInfo = data.book_info || data;
      const resolvedAuthorId = bookInfo?.user_id || data.author?.id || data.author_id || '';

      const isSelf = !!localUid && String(localUid) === String(resolvedAuthorId);
      if (isSelf) {
        response = await api.getSelfCollectionDetail(id) as any;
      }

      if (response.code === 0) {
        const finalData = response.data;
        const chaptersData = finalData.chatpers || finalData.chapters || [];
        const finalBookInfo = finalData.book_info || finalData;
        if (collection.value) {
          collection.value.chapters = chaptersData.map((chapter: any) => ({
            id: chapter.post_id || chapter.id,
            title: chapter.title || '',
            subtitle: chapter.subtitle,
            status: chapter.status as 'published' | 'draft' | 'subscribed' | 'private' || 'published'
          }));
          collection.value.latestChapterIndex = finalBookInfo.chapter_count || '';
          collection.value.lastUpdate = finalBookInfo.updated_at || finalBookInfo.latest_post_updated || '';
        }

        if (resolvedAuthorId) {
          await fetchAuthorInfo(resolvedAuthorId, showNsfw);
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh chapters:', error);
  }
}

async function deleteChapter(chapter: Chapter | null) {
  if (chapter && collection.value) {
    try {
      const res = await api.deletePost({ post_id: chapter.id }) as any;
      if (res.code == 0) {
        toast(t('success'));
        await refreshChapters();
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    } catch (error) {
      console.error(error);
      toast(t('fail'));
    }
  }
  showDeleteChapterModal.value = false;
}

function confirmDeleteChapter(chapter: Chapter) {
  currentChapter.value = chapter;
  showDeleteChapterModal.value = true;
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'K';
  }
  return num.toString();
}

function getStatusClass(status: string): string {
  return `status-${status}`;
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'published': t('collectionDetail.statusPublished'),
    'draft': t('collectionDetail.statusDraft'),
    'subscribed': t('collectionDetail.statusSubscribed'),
    'private': t('collectionDetail.statusPrivate')
  };
  return statusMap[status] || status;
}

function getPermClass(accessRights?: string): string {
  if (accessRights == '2') return 'status-subscribed';
  if (accessRights == '3') return 'status-private';
  return 'status-public';
}

function getPermText(accessRights?: string): string {
  if (accessRights == '2') return t('collectionDetail.statusSubscribed');
  if (accessRights == '3') return t('submit.permPrivate');
  return t('submit.permPublic');
}

function onUserLoggedOut() {
  authorInfo.value.isFollow = 0;
  authorInfo.value.isSubscribe = 0;
  if (!isOwn.value && authorInfo.value.id) {
    fetchAuthorInfo(authorInfo.value.id);
  }
}

onMounted(async () => {
  eventBus.on('userLoggedOut', onUserLoggedOut);
  await getCountry();
  fetchCollectionDetail();

  // 上报合集详情浏览（10 分钟内只上报一次）
  const bookId = route.query.book_id || route.params.id;
  const bid = (Array.isArray(bookId) ? bookId[0] : bookId) as string;
  if (bid) trackBookView(bid);
});

onBeforeUnmount(() => {
  eventBus.off('userLoggedOut', onUserLoggedOut);
});
</script>

<style lang="scss" scoped>
.collection-detail {
  min-height: 100vh;
  background-color: #111111;
  padding-bottom: 40px;
}

.content-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 120px 24px 24px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #3d3d3d;
    border-top-color: #ff4f9a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
  color: #777;

  .breadcrumb-item {
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      color: #ff4f9a;
    }

    &.active {
      color: #f5f5f5;
      cursor: default;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .breadcrumb-arrow {
    margin: 0 10px;
    color: #3d3d3d;
    flex-shrink: 0;
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.author-section {
  display: flex;
  justify-content: space-between;
  padding: 20px 0 20px 20px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;

  .author-left {
    display: flex;
    gap: 20px;
    flex: 1;
    padding-right: 20px;
    min-width: 0;
  }

  .cover-image {
    position: relative;
    width: 212px;
    height: 284px;
    border-radius: 12px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .r18-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      min-width: 42px;
      height: 28px;
      background: rgba(16,24,40,0.7);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;

      .r18-text {
        font-size: 14px;
        font-weight: 500;
        color: #FFFFFF;
      }
    }
  }

  .author-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .title-row {
      display: flex;
      flex-direction: column;
    }

    .type-badge {
      width: max-content;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      padding: 4px 12px;
      font-weight: 800;
      font-size: 12px;
      color: #f5f5f5;
      background: #FFC24B;
      margin-top: 18px;

      &.type-2 {
        background: #C9B6FF;
      }

      &.type-3 {
        background: #7FD8E8;
      }
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 0;
      line-height: 36px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tags-list {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;

      .tag-item {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        color: #fff;

        &.tag-pink {
          background: #FFB6C1;
        }
        &.tag-yellow {
          background: #FFD700;
        }
        &.tag-green {
          background: #98FB98;
          color: #333;
        }
      }
    }

    .update-read-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 14px;
    }
    .update-chapter{
      display: flex;
      align-items: center;
      color: #ff4f9a;
      font-size: 16px;

      .chapter-value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }

      .time {
        color: #777;
        margin-left: 8px;
        flex-shrink: 0;
      }
    }

    .status-row {
      font-size: 16px;

      .status{
        font-weight: 500;
        color: #f5f5f5;
      }
    }

    .read-info {
      font-size: 16px;
      color: #aaa;
      display: flex;
      align-items: center;

      .value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .btn-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .favorite-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 48px;
      padding: 8px 20px;
      border-radius: 12px;
      border: 1px solid #3d3d3d;
      background: #1a1a1a;
      color: #f5f5f5;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      img {
        width: 20px;
        height: 20px;
      }

      &:not(.active) img {
        filter: brightness(0) invert(1);
      }

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    }

    .continue-reading-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 136px;
      height: 48px;
      padding: 8px 20px;
      border-radius: 12px;
      border: 1px solid #ff9aca;
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      align-self: flex-start;
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);

      &:hover {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }
    }
  }

  .author-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 312px;
    padding: 0 30px;
    border-left: 1px dashed rgba(255, 255, 255, 0.12);

    .avatar-top{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .avatar-container {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 10px;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .author-name {
      font-size: 16px;
      font-weight: 500;
      color: #f5f5f5;
      cursor: pointer;
    }

    .avatar-bottom{
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .stats {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .stat-line{
        width: 1px;
        height: 20px;
        margin: 0 40px;
        background: rgba(255, 255, 255, 0.12);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 16px;
          font-weight: 500;
          color: #f5f5f5;
        }

        .stat-label {
          font-size: 14px;
          color: #aaa;
          margin-bottom: 8px;
        }
      }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;

      .btn {
        min-width: 120px;
        height: 48px;
        padding: 0 10px;
        border-radius: 8px;
        font-size: 14px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;

        &.btn-follow {
          background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
          color: #ffffff;
          border: 1px solid #3d3d3d;
          box-shadow: 0 2px 12px rgba(255,79,154,0.3);

          &:hover {
            box-shadow: 0 4px 16px rgba(255,79,154,0.4);
          }

          &:active {
            box-shadow: 0 2px 8px rgba(255,79,154,0.3);
          }

          .hover-text {
            display: none;
          }

          &.followed {
            background: rgba(255,255,255,0.06);
            color: #aaa;
            border: 1px solid #3d3d3d;
            box-shadow: none;

            &:hover {
              color: #ff4f9a;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);

              .btn-text {
                display: none;
              }

              .hover-text {
                display: inline;
              }
            }

            &:active {
              box-shadow: none;
            }
          }
        }

        &.btn-subscribe {
          background: #00d3f2;
          color: #ffffff;
          padding: 0 10px;
          border: 1px solid #3d3d3d;
          box-shadow: 0 2px 8px rgba(0,211,242,0.2);

          &:hover {
            box-shadow: 0 4px 12px rgba(0,211,242,0.3);
          }

          &:active {
            box-shadow: 0 2px 8px rgba(0,211,242,0.2);
          }

          &.subscribed {
            background: rgba(255,255,255,0.06);
            color: #aaa;
            border: 1px solid #3d3d3d;
            box-shadow: none;
            cursor: not-allowed;
          }
        }
      }
    }

    .subscribe-tip {
      margin-top: 10px;
      font-size: 14px;
      color: #777;
      text-align: center;
    }
  }

  .own-actions {
    display: flex;
    align-items: center;

    .settings-btn {
      padding: 10px;
      background: transparent;
      border: none;
      cursor: pointer;

      img {
        width: 20px;
        height: 20px;
      }
    }
  }
}

.section {
  padding: 20px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.section-chapter{
  padding: 0 20px 20px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 66px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #f5f5f5;
}

.private-hint {
  font-size: 14px;
  color: #777;
}

.publish-btn {
  padding: 8px 20px;
  background: #ff4f9a;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.description-content {
  margin-top: 14px;
  font-size: 14px;
  color: #aaa;
  line-height: 24px;
}

.chapter-list {
  display: flex;
  flex-direction: column;

  &:not(.is-own) {
    gap: 0;
  }

  &.is-own {
    gap: 10px;
  }
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
  padding: 0 16px;
  cursor: pointer;

  &:not(.is-own) {
    padding: 0;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0;
    transition: none;

    &:hover {
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: none;
      transform: none;
    }
  }

  &.is-own {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    transition: border-color 0.25s, box-shadow 0.25s;

    &:hover {
      border-color: #3d3d3d;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
  }

  .chapter-left {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    flex: 1;
    min-width: 0;

    .chapter-status {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 16px;
      border-radius: 6px;
      font-size: 14px;
      flex-shrink: 0;

      &.status-subscribed {
        background: #ff4f9a;
        color: #FFFFFF;
      }

      &.status-private {
        background: #222;
        color: #FFFFFF;
      }
    }

    .chapter-title {
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #f5f5f5;
      flex-shrink: 1;
      min-width: 0;
    }
  }

  &.is-read .chapter-left .chapter-title {
    color: #777;
  }

  .chapter-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    padding-left: 10px;

    .chapter-action {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 10px;
      border: 1px solid #3d3d3d;
      border-radius: 6px;
      background: #1a1a1a;
      color: #f5f5f5;
      cursor: pointer;

      &:first-child{
        background: #ff4f9a;
        color: #FFFFFF;
      }

      &:nth-child(2){
        .action-icon {
          filter: brightness(0) invert(1);
        }
      }

      .action-icon {
        width: 16px;
        height: 16px;
      }

      .action-text {
        font-size: 14px;
        white-space: nowrap;
      }
    }
  }
}

@media (max-width: 1440px) {
  .content-container {
    max-width: 75vw;
    padding: 10vw 1.6667vw 1.6667vw;
  }
  .breadcrumb {
    margin-bottom: 1.3889vw;
    .breadcrumb-arrow {
      margin: 0 0.6944vw;
    }
  }
  .main-content {
    gap: 1.1111vw;
  }
  .author-section {
    padding: 1.3889vw 0 1.3889vw 1.3889vw;
    border-radius: 0.8333vw;
    .author-left {
      gap: 1.3889vw;
      padding-right: 1.3889vw;
    }
    .cover-image {
      width: 14.7222vw;
      height: 19.7222vw;
      border-radius: 0.8333vw;
    }
    .author-info {
      .title {
        font-size: 1.6667vw;
        line-height: 2.5vw;
      }
      .tags-list {
        gap: 0.5556vw;
        margin-bottom: 0.8333vw;
        .tag-item {
          padding: 0.2778vw 0.6944vw;
          border-radius: 1.3889vw;
          font-size: 0.8333vw;
        }
      }
      .update-read-section {
        gap: 8px;
      }
      .status-row {
        font-size: 1.1111vw;
      }
      .update-chapter {
        font-size: 1.1111vw;
      }
      .read-info {
        font-size: 1.1111vw;
      }
      .continue-reading-btn {
        min-width: 9.4444vw;
        height: 3.3333vw;
        padding: 0.5556vw 1.3889vw;
        font-size: 12px;
        border-radius: 0.5556vw;
      }
      .favorite-btn {
        height: 3.3333vw;
        padding: 0.5556vw 1.3889vw;
        font-size: 12px;
        border-radius: 0.5556vw;

        img {
          width: 1.3889vw;
          height: 1.3889vw;
        }
      }
    }
    .author-right {
      width: 21.6667vw;
      padding: 0 2.0833vw;
      .avatar-container {
        width: 5.5556vw;
        height: 5.5556vw;
        margin-bottom: 0.6944vw;
      }
      .author-name {
        font-size: 1.1111vw;
      }
      .stats {
        margin-bottom: 1.3889vw;
        .stat-line {
          height: 1.3889vw;
          margin: 0 2.7778vw;
        }
        .stat-item {
          .stat-value {
            font-size: 1.1111vw;
          }
          .stat-label {
            font-size: 0.9722vw;
            margin-bottom: 0.5556vw;
          }
        }
      }
      .action-buttons {
        gap: 0.8333vw;
        .btn {
          min-width: 9.3vw;
          height: 3.3333vw;
          padding: 0 0.6944vw;
          border-radius: 0.5556vw;
          font-size: 0.9722vw;
        }
      }
      .subscribe-tip {
        margin-top: 0.6944vw;
        font-size: 0.9722vw;
      }
    }
  }
  .section {
    padding: 1.3889vw;
    border-radius: 0.8333vw;
  }
  .section-chapter {
    padding: 0 1.3889vw 1.3889vw;
    border-radius: 0.8333vw;
  }
  .section-header {
    height: 4.5833vw;
  }
  .section-title {
    font-size: 1.3889vw;
  }
  .private-hint {
    font-size: 0.9722vw;
  }
  .publish-btn {
    padding: 0.5556vw 1.3889vw;
    border-radius: 0.4167vw;
    font-size: 0.9722vw;
  }
  .description-content {
    font-size: 12px;
    line-height: 20px;
  }
  .chapter-item {
    height: 5vw;
    padding: 0 1.2vw;

    .chapter-left {
      gap: 0.6944vw;
      .chapter-status {
        height: 2.2222vw;
        padding: 0 1.1111vw;
        border-radius: 0.4167vw;
        font-size: 0.9722vw;
      }
      .chapter-title {
        font-size: 1.1111vw;
      }
    }
    .chapter-right {
      gap: 0.5vw;
      padding-left: 0.6944vw;
      .chapter-action {
        gap: 0.1389vw;
        padding: 0.5vw 0.8vw;
        border-radius: 0.5vw;
        .action-icon {
          width: 1.1111vw;
          height: 1.1111vw;
        }
        .action-text {
          font-size: 0.9722vw;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .content-container {
    max-width: 100%;
    padding: 100px 16px 16px;
  }
  .breadcrumb {
    margin-bottom: 12px;
    font-size: 12px;
    .breadcrumb-arrow {
      margin: 0 6px;
    }
  }
  .main-content {
    gap: 12px;
  }
  .author-section {
    flex-direction: column;
    padding: 16px;
    border-radius: 8px;
    .author-left {
      gap: 12px;
      padding-right: 0;
    }
    .cover-image {
      width: 120px;
      height: 160px;
      border-radius: 8px;
      .r18-overlay {
        height: 24px;
        border-radius: 12px;
        padding: 0 6px;
        .r18-text {
          font-size: 12px;
        }
      }
    }
    .author-info {
      .title {
        font-size: 18px;
        line-height: 26px;
      }
      .update-read-section {
        gap: 6px;
      }
      .status-row {
        font-size: 14px;
      }
      .update-chapter {
        font-size: 14px;
      }
      .read-info {
        font-size: 14px;
      }
      .continue-reading-btn {
        min-width: 9.4444vw;
        height: 4.5vw;
        padding: 6px 14px;
        font-size: 12px;
      }
      .favorite-btn {
        height: 4.5vw;
        padding: 6px 14px;
        font-size: 12px;

        img {
          width: 16px;
          height: 16px;
        }
      }
    }
    .author-right {
      width: 100%;
      padding: 16px 0;
      border-left: none;
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
      margin-top: 12px;
      gap: 12px;
      .avatar-top {
        flex-direction: row;
        gap: 8px;
      }
      .avatar-container {
        width: 48px;
        height: 48px;
        margin-bottom: 0;
      }
      .author-name {
        font-size: 14px;
      }
      .avatar-bottom {
        gap: 10px;
      }
      .stats {
        margin-bottom: 0;
        .stat-line {
          height: 16px;
          margin: 0 20px;
        }
        .stat-item {
          .stat-value {
            font-size: 14px;
          }
          .stat-label {
            font-size: 12px;
            margin-bottom: 4px;
          }
        }
      }
      .action-buttons {
        gap: 8px;
        .btn {
          min-width: 80px;
          height: 36px;
          padding: 0 8px;
          border-radius: 6px;
          font-size: 12px;
        }
      }
      .subscribe-tip {
        margin-top: 6px;
        font-size: 12px;
      }
    }
  }
  .section {
    padding: 12px;
    border-radius: 8px;
  }
  .section-chapter {
    padding: 0 12px 12px;
    border-radius: 8px;
  }
  .section-header {
    height: 48px;
  }
  .section-title {
    font-size: 16px;
  }
  .private-hint {
    font-size: 12px;
  }
  .publish-btn {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
  }
  .description-content {
    font-size: 12px;
    line-height: 20px;
  }
  .chapter-item {
    height: 52px;
    .chapter-left {
      gap: 6px;
      .chapter-status {
        height: 24px;
        padding: 0 10px;
        border-radius: 4px;
        font-size: 12px;
      }
      .chapter-title {
        font-size: 14px;
      }
    }
    .chapter-right {
      gap: 6px;
      padding-left: 6px;
      .chapter-action {
        gap: 2px;
        padding: 4px 6px;
        border-radius: 4px;
        .action-icon {
          width: 14px;
          height: 14px;
        }
        .action-text {
          font-size: 12px;
        }
      }
    }
  }
}
</style>