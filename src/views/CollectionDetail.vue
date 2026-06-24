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
                <img :src="collection.cover || defaultCover" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultCover }" />
                <div class="r18-overlay" v-if="collection.is_nsfw == 1">
                  <span class="r18-text">R18</span>
                </div>
              </div>
              <div class="author-info">
                <div class="title-row">
                  <h1 class="title">{{ collection.title }}</h1>
                </div>

                <div class="update-read-section">
                  <div class="update-chapter" v-if="Number(collection.latestChapterIndex) > 0">
                    <span class="label">{{ t('collectionDetail.lastUpdate') }}：</span>
                    <span class="chapter-value">
                      {{ t('home.chapterFormat', { chapter: collection.latestChapterIndex }) }}
                    </span>
                  </div>
                  <div class="read-info" v-if="collection.lastRead">
                    <span class="label">{{ t('collectionDetail.lastRead') }}：</span>
                    <span class="value">{{ collection.lastRead }}</span>
                  </div>
                  <div class="update-info">
                    <span class="status">{{ collection.status == '2' ? t('collectionSettings.statusFinished') : t('collectionSettings.statusOngoing') }}</span>
                    <span class="time">{{ collection.lastUpdate }}</span>
                  </div>

                </div>
              </div>
            </div>

            <!-- Author Info (always show) -->
            <div class="author-right">
              <div class="avatar-top">
                <div class="avatar-container">
                  <img :src="authorInfo.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                </div>
                <div class="author-name">{{ authorInfo.nickname }}</div>
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
            <h2 class="section-title">{{ t('collectionDetail.description') }}</h2>
            <div class="description-content">{{ collection.description || '' }}</div>
          </div>

          <!-- Table of Contents -->
          <div class="section-chapter">
            <div class="section-header">
              <h2 class="section-title">{{ t('collectionDetail.tableOfContents') }}</h2>

              <!-- <button
                v-if="isOwn"
                class="publish-btn"
                @click="goPublish"
              >{{ t('collectionDetail.publish') }}</button> -->
            </div>

            <div class="chapter-list">
              <div
                v-for="(chapter, index) in collection.chapters"
                :key="chapter.id"
                class="chapter-item"
                @click="goChapter(chapter)"
              >
                <div class="chapter-left">
                  <span
                    v-if="chapter.status && (chapter.status == 'subscribed' || chapter.status == 'private')"
                    class="chapter-status"
                    :class="getStatusClass(chapter.status)"
                  >{{ getStatusText(chapter.status) }}</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>
                <div class="chapter-right">
                  <img
                    v-if="isOwn && collection.status != '2'"
                    class="chapter-menu"
                    src="@/assets/images/detail/menu.png"
                    @click.stop="showChapterMenu(chapter, $event)"
                  />
                  <div
                    v-if="showMenu && currentChapter?.id === chapter.id"
                    class="chapter-menu-dropdown"
                    :class="{ 'dropdown-top': menuPosition.useBottom, 'dropdown-bottom': !menuPosition.useBottom }"
                    @click.stop
                  >
                    <div
                      class="dropdown-item"
                      @click="editChapter(currentChapter)"
                    >{{ t('collectionDetail.edit') }}</div>
                    <div
                      class="dropdown-item"
                      @click="deleteChapter(currentChapter)"
                    >{{ t('collectionDetail.delete') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <SensitiveContentNoBirthdayModal
      v-if="showSensitiveContentNoBirthdayModal"
      @close="showSensitiveContentNoBirthdayModal = false"
      @go-to-fill="handleGoToFillBirthday"
    />

    <SensitiveContentUnderageModal
      v-if="showSensitiveContentUnderageModal"
      @close="showSensitiveContentUnderageModal = false"
    />

    <SensitiveContentConfirmModal
      v-if="showSensitiveContentConfirmModal"
      :hide-dont-ask="true"
      @close="showSensitiveContentConfirmModal = false"
      @confirm="confirmSensitiveContent"
    />
  </div>
</template>

<script setup lang="ts" name="CollectionDetail">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import Header from '@/components/Header.vue';
import SensitiveContentNoBirthdayModal from '@/components/SensitiveContentNoBirthdayModal.vue';
import SensitiveContentUnderageModal from '@/components/SensitiveContentUnderageModal.vue';
import SensitiveContentConfirmModal from '@/components/SensitiveContentConfirmModal.vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { eventBus } from '@/utils/eventBus';
import defaultCover from '@/assets/images/base/cover.png';
import defaultAvatar from '@/assets/images/base/avatar.png';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

interface Chapter {
  id: string | number;
  title: string;
  subtitle?: string;
  status: 'published' | 'draft' | 'subscribed' | 'private';
}

interface Collection {
  id: string | number;
  title: string;
  cover: string;
  tags: string[];
  lastUpdate: string;
  lastRead: string;
  lastReadTime: string;
  description: string;
  isOwn: boolean;
  authorId: string | number;
  latestChapterIndex: string;
  type: string;
  status: string;
  chapters: Chapter[];
  is_nsfw: number | string;
  chapter_count_private: number | string;
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
const isTeenager = computed(() => !userInfo.value || userInfo.value.is_teenager == '1');
const showSensitiveContentNoBirthdayModal = ref(false);
const showSensitiveContentUnderageModal = ref(false);
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

const showMenu = ref(false);
const currentChapter = ref<Chapter | null>(null);
const menuPosition = reactive({ useBottom: false });
const isOwn = ref(false);

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
    const authorIdFromUrl = route.query.uid;

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
    const urlUid = Array.isArray(authorIdFromUrl) ? authorIdFromUrl[0] : authorIdFromUrl;
    const isSelf = String(localUid) === String(urlUid);

    let response;
    const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1';
    const showNsfw = userRegion.value && allowSensitive ? 1 : 0;

    if (isSelf) {
      response = await api.getSelfCollectionDetail(id) as any;
    } else {
      response = await api.getCollectionDetail(id) as any;
    }
    if (response.code == 0) {
      const data = response.data;
      // Prioritize author_id from URL, then from response
      const resolvedAuthorId = authorIdFromUrl
        ? (Array.isArray(authorIdFromUrl) ? authorIdFromUrl[0] : authorIdFromUrl)
        : (data.author?.id || data.author_id || '');

      const bookInfo = data.book_info || data;
      const chaptersData = data.chatpers || data.chapters || [];

      // 只根据URL上的uid和本地缓存的uid做对比
      isOwn.value = isSelf;

      collection.value = {
        id: bookInfo.id || data.book_id || '',
        title: bookInfo.title || '',
        cover: bookInfo.cover || defaultCover,
        tags: data.tags || [],
        lastUpdate: bookInfo.updated_at || bookInfo.latest_post_updated || '',
        lastRead: data.last_read || '',
        lastReadTime: data.last_read_time || '',
        description: bookInfo.description || '',
        isOwn: isSelf,
        authorId: resolvedAuthorId || (bookInfo.user_id || ''),
        latestChapterIndex: bookInfo.chapter_count || '',
        type: bookInfo.type || '',
        status: bookInfo.status || '',
        is_nsfw: bookInfo.is_nsfw || 0,
        chapter_count_private: bookInfo.chapter_count_private || 0,
        chapters: chaptersData.map((chapter: any) => ({
          id: chapter.post_id || chapter.id,
          title: chapter.title || '',
          subtitle: chapter.subtitle,
          status: chapter.status as 'published' | 'draft' | 'subscribed' | 'private' || 'published'
        }))
      };

      if (resolvedAuthorId) {
        await fetchAuthorInfo(resolvedAuthorId, showNsfw);
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

function handleGoToFillBirthday() {
  showSensitiveContentNoBirthdayModal.value = false;
  router.push('/user-personal-edit');
}

function goChapter(chapter: Chapter) {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (isOwn.value) {
    navigateToChapter(chapter);
    return;
  }

  if (collection.value?.is_nsfw == 1) {
    if (userInfo.value) {
      const birthday = userInfo.value.info?.birthday;
      if (!birthday) {
        pendingChapter.value = chapter;
        showSensitiveContentNoBirthdayModal.value = true;
        return;
      }
      if (isTeenager.value) {
        pendingChapter.value = chapter;
        showSensitiveContentUnderageModal.value = true;
        return;
      }
    }

    if (localStorage.getItem('allowSensitiveContent') === '1') {
      navigateToChapter(chapter);
      return;
    }

    pendingChapter.value = chapter;
    showSensitiveContentConfirmModal.value = true;
    return;
  }

  navigateToChapter(chapter);
}

function navigateToChapter(chapter: Chapter) {
  const uid = authorInfo.value.id;
  router.push(`/detail?id=${chapter.id}&type=4&uid=${uid}`);
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
    router.push(`/subscription-payment?uid=${authorInfo.value.id}`);
  }
}

function showChapterMenu(chapter: Chapter, event: MouseEvent) {
  event.stopPropagation();

  if (showMenu.value) {
    showMenu.value = false;
    document.removeEventListener('click', closeMenu);
    return;
  }

  currentChapter.value = chapter;
  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  const dropdownHeight = 80;
  const useBottom = rect.bottom + dropdownHeight > window.innerHeight;

  menuPosition.useBottom = useBottom;
  showMenu.value = true;

  document.addEventListener('click', closeMenu);
}

function closeMenu() {
  showMenu.value = false;
  document.removeEventListener('click', closeMenu);
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
  closeMenu();
}

async function refreshChapters() {
  try {
    const bookId = route.query.book_id || route.params.id;
    const authorIdFromUrl = route.query.uid;
    if (!bookId) return;
    const id = (Array.isArray(bookId) ? bookId[0] : bookId) as string;
    if (!id) return;

    const localUid = localStorage.getItem('uid');
    const urlUid = Array.isArray(authorIdFromUrl) ? authorIdFromUrl[0] : authorIdFromUrl;
    const isSelf = String(localUid) === String(urlUid);

    let response;
    const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1';
    const showNsfw = userRegion.value && allowSensitive ? 1 : undefined;
    if (isSelf) {
      response = await api.getSelfCollectionDetail(id) as any;
    } else {
      response = await api.getCollectionDetail(id) as any;
    }

    if (response.code === 0) {
      const data = response.data;
      const chaptersData = data.chatpers || data.chapters || [];
      const bookInfo = data.book_info || data;
      if (collection.value) {
        collection.value.chapters = chaptersData.map((chapter: any) => ({
          id: chapter.post_id || chapter.id,
          title: chapter.title || '',
          subtitle: chapter.subtitle,
          status: chapter.status as 'published' | 'draft' | 'subscribed' | 'private' || 'published'
        }));
        collection.value.latestChapterIndex = bookInfo.chapter_count || '';
        collection.value.lastUpdate = bookInfo.updated_at || bookInfo.latest_post_updated || '';
      }

      const resolvedAuthorId = authorIdFromUrl
        ? (Array.isArray(authorIdFromUrl) ? authorIdFromUrl[0] : authorIdFromUrl)
        : (data.author?.id || data.author_id || '');
      if (resolvedAuthorId) {
        await fetchAuthorInfo(resolvedAuthorId, showNsfw);
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
  closeMenu();
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
});

onBeforeUnmount(() => {
  eventBus.off('userLoggedOut', onUserLoggedOut);
});
</script>

<style lang="scss" scoped>
.collection-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 4rem;
}

.content-container {
  max-width: 108rem;
  margin: 0 auto;
  padding: 12rem 0 2.4rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 3px solid #e0e0e0;
    border-top-color: #ff47a9;
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
  margin-bottom: 2rem;
  font-size: 1.4rem;
  color: #99A1AF;

  .breadcrumb-item {
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      color: #FB64B6;
    }

    &.active {
      color: #364153;
      cursor: default;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .breadcrumb-arrow {
    margin: 0 1rem;
    color: #ddd;
    flex-shrink: 0;
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.author-section {
  display: flex;
  justify-content: space-between;
  padding: 2rem 0 2rem 2rem;
  background: #FFFFFF;
  border-radius: 1.2rem;

  .author-left {
    display: flex;
    gap: 2rem;
    flex: 1;
    padding-right: 2rem;
    min-width: 0;
  }

  .cover-image {
    position: relative;
    width: 21.2rem;
    height: 28.4rem;
    border-radius: 1.2rem;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .r18-overlay {
      position: absolute;
      top: 0;
      right: 0;
      width: 10rem;
      height: 10rem;
      background: linear-gradient(222deg, #FB64B6 0%, rgba(251,100,182,0) 50%);
      border-radius: 0 1.2rem 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 0.6rem;

      .r18-text {
        font-size: 1.6rem;
        font-weight: 500;
        color: #FFFFFF;
        text-shadow: 0px 0px 8px rgba(0,0,0,0.18);
      }
    }
  }

  .author-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;

    .title-row {
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: 2.4rem;
      font-weight: 600;
      color: #101828;
      margin-bottom: 0;
      line-height: 3.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tags-list {
      display: flex;
      gap: 0.8rem;
      margin-bottom: 1.2rem;

      .tag-item {
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-size: 1.2rem;
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
      gap: 1rem;
      overflow: hidden;
    }
    .update-chapter{
      display: flex;
      align-items: center;
      color: #FB64B6;

      .chapter-value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }

    .update-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 1.6rem;

      .status{
        font-weight: 500;
        color: #364153;
      }

      .time {
        color: #99A1AF;
      }
    }

    .read-info {
      font-size: 1.6rem;
      color: #6A7282;
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
  }

  .author-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 31.2rem;
    padding: 0 3rem;
    border-left: 1px dashed #DDDDDD;

    .avatar-top{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .avatar-container {
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 1rem;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .author-name {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
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
      margin-bottom: 2rem;

      .stat-line{
        width: 1px;
        height: 2rem;
        margin: 0 4rem;
        background: #F5F5F5;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 1.6rem;
          font-weight: 500;
          color: #364153;
        }

        .stat-label {
          font-size: 1.4rem;
          color: #6A7282;
          margin-bottom: 0.8rem;
        }
      }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.2rem;
      width: 100%;

      .btn {
        min-width: 12rem;
        height: 4.8rem;
        padding: 0 1rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;

        &.btn-follow {
          background: #fb64b6;
          color: #ffffff;

          &:hover {
            &::after {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background: rgba(255, 255, 255, 0.1);
            }
          }

          .hover-text {
            display: none;
          }

          &.followed {
            background: #F5F5F5;
            color: #6A7282;

            &:hover {
              color: #fb64b6;

              .btn-text {
                display: none;
              }

              .hover-text {
                display: inline;
              }
            }
          }
        }

        &.btn-subscribe {
          background: #00d3f2;
          color: #ffffff;
          padding: 0 1rem;

          &:hover {
            &::after {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background: rgba(255, 255, 255, 0.1);
            }
          }

          &.subscribed {
            background: #F5F5F5;
            color: #6A7282;
            cursor: not-allowed;
          }
        }
      }
    }

    .subscribe-tip {
      margin-top: 1rem;
      font-size: 1.4rem;
      color: #99A1AF;
      text-align: center;
    }
  }

  .own-actions {
    display: flex;
    align-items: center;

    .settings-btn {
      padding: 1rem;
      background: transparent;
      border: none;
      cursor: pointer;

      img {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}

.section {
  padding: 2rem;
  background: #FFFFFF;
  border-radius: 1.2rem;
}

.section-chapter{
  padding: 0 2rem 2rem;
  background: #FFFFFF;
  border-radius: 1.2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 6.6rem;
  border-bottom: 1px solid #F5F5F5;
}

.section-title {
  font-size: 2rem;
  font-weight: 500;
  color: #101828;
  margin-bottom: 1.2rem;
}

.private-hint {
  font-size: 1.4rem;
  color: #99A1AF;
}

.publish-btn {
  padding: 0.8rem 2rem;
  background: #FF47A9;
  color: #FFFFFF;
  border: none;
  border-radius: 0.6rem;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;
}

.description-content {
  font-size: 1.4rem;
  color: #6A7282;
  line-height: 2.4rem;
}

.chapter-list {
  display: flex;
  flex-direction: column;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 7.2rem;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;

  .chapter-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    overflow: hidden;
    flex: 1;
    min-width: 0;

    .chapter-status {
      display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      flex-shrink: 0;

      &.status-subscribed {
        background: rgba(251,100,182,0.12);
        color: #FB64B6;
      }

      &.status-private {
        background: #F5F5F5;
        color: #6A7282;
      }
    }

    .chapter-title {
      font-size: 1.6rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #364153;
      flex-shrink: 1;
      min-width: 0;
    }
  }

  .chapter-right {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
    padding-left: 1rem;
    width: 4rem;

    .chapter-menu {
      width: 1.8rem;
      height: 1.8rem;
      cursor: pointer;
    }
  }
}

.chapter-menu-dropdown {
  position: absolute;
  right: 0;
  background: #FFFFFF;
  border-radius: 0.8rem;
  box-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.15);
  padding: 0.6rem 1.2rem;
  min-width: 10rem;
  z-index: 10;
  white-space: nowrap;

  &.dropdown-bottom {
    top: 100%;
  }

  &.dropdown-top {
    bottom: 100%;
  }

  .dropdown-item {
    padding: 0.6rem 0;
    font-size: 1.4rem;
    text-align: center;
    color: #6A7282;
    cursor: pointer;

    &:hover {
      color: #364153;
    }
  }
}
</style>