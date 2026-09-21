<template>
  <div class="home-page" ref="homePageRef">
    <Header ref="headerRef" :cur="0" @user-info-loaded="handleUserInfoLoaded" @balance-info-loaded="handleBalanceInfoLoaded"></Header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Banner：本地固定推广位，不再请求接口 -->
      <div class="event-banner" v-if="showPromoBanner" :class="{ clickable: !!PROMO_BANNER_LINK }">
        <PromoBanner
          :image="bannerSlotImage"
          :video="bannerSlotVideo"
          @click="PROMO_BANNER_LINK && goBanner(PROMO_BANNER_LINK)"
        >
          <template #title><h2 v-html="t('home.promoBanner.title', {}, { locale: 'en' })"></h2></template>
          <template #sub><p v-html="t('home.promoBanner.sub', {}, { locale: 'en' })"></p></template>
        </PromoBanner>
      </div>

      <!-- Hero Section -->
      <div ref="heroSectionRef" class="hero-section">
        <!-- switch_no = 2 且非中国地区：整块背景换成视频，漂浮卡片 / 拟声词 / 柔光都不要 -->
        <video
          v-if="showHeroVideo"
          ref="heroVideoRef"
          class="hero-video-layer"
          :src="HERO_VIDEO_SRC"
          :poster="HERO_VIDEO_POSTER || undefined"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          aria-hidden="true"
        ></video>

        <!-- 接口没返回前，不知道该展示动效还是视频，两个都先不显示，只留 hero-section 自己的背景 -->
        <template v-else-if="contentSwitch.loaded">
          <!-- 3D 漂浮漫画卡片背景动效 -->
          <Hero3DBackground class="hero-3d-layer" :paused="heroPaused" :scattered="heroEditing" />
          <!-- 中间柔光层（让中间内容更清晰） -->
          <div class="hero-glow" aria-hidden="true"></div>
          <!-- 边上飘的拟声词装饰 -->
          <div class="hero-parts" aria-hidden="true" ref="heroPartsRef">
            <img
              v-for="(p, i) in heroParts"
              :key="p.before"
              class="hero-part"
              :src="`/onomatopoeia/${heroPartSrc[i]}.png`"
              alt=""
              :style="heroPartStyle(p, i)"
            />
          </div>
        </template>

        <!-- 左下：说明按钮（暂时隐藏） -->
        <a v-if="false" class="hero-howto" href="/guide.html" target="_blank" rel="noopener noreferrer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
          {{ t('home.howto') }}
        </a>

        <!-- 右下：暂停/播放背景动画 -->
        <button class="hero-pause-btn" :title="t('home.pauseAnim')" :aria-label="t('home.pauseAnim')" @click="heroPaused = !heroPaused">
          <svg v-if="heroPaused" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z" /></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.6" stroke-linecap="round"><path d="M9 5v14" /><path d="M15 5v14" /></svg>
        </button>

        <div class="hero-content">
          <div class="hero-title-wrap">
            <span class="hero-speedlines left" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span class="hero-speedlines right" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <h1 class="hero-title">{{ t('home.hero.title') }}</h1>
          </div>
          <p class="hero-subtitle">{{ t('home.hero.sub') }}</p>

          <!-- Input Area -->
           <PromptComposer
             ref="composerRef"
             placement="home"
             :user-info="userInfo"
             :balance-info="balanceInfo"
             @seo="setSeoMeta"
             @input-active="popHeroParts"
             @make-source-applied="handleMakeSourceApplied"
             @height-change="composerHeight = $event"
           />
        </div>
      </div>

      <ProcessList @toggle="composerRef?.collapse()" />

      <!-- 推荐创作者 + 人气作品（3D 动效 Showcase，移植自 moegen-web） -->
      <div v-if="false">
        <HomeShowcase :user-region="userRegion" :region-ready="hasFetchedRegion" :allow-sensitive="allowSensitiveContent" />
      </div>

      <!-- Content Section -->
      <div id="feed" class="content-section" ref="contentSectionRef" :style="composerHeight ? { paddingBottom: `${composerHeight + 24}px` } : undefined">
        <div class="feed-heading">
          <h2 class="feed-title">{{ t('home.feedTitle') }}</h2>
          <p class="feed-sub">{{ t('home.feedSub') }}</p>
        </div>
        <!-- Tabs -->
        <div class="content-header">
          <!-- Tabs -->
          <div class="content-tabs">
            <span
              v-for="(tab, index) in contentTabs"
              :key="index"
              class="tab-btn"
              :class="{ active: activeContentTab == tab.id }"
              @click="switchContentTab(tab.id, index)"
            >
              {{ t(tab.label) }}
            </span>
          </div>

          <div class="header-spacer"></div>

          <!-- Search -->
          <div class="search-box">
            <input
              type="text"
              :placeholder="t('home.search.placeholder')"
              v-model="searchQuery"
              class="search-input"
              spellcheck="false"
              @focus="isSearchFocused = true"
              @blur="isSearchFocused = false"
            />
            <img
              src="@/assets/images/user/search.png"
              alt=""
              class="search-icon"
              @click="handleSearch"
            />
          </div>
        </div>

         <div class="view-mode-filter-box" v-if="activeContentTab !== 'suggested'">
           <!-- User/Content toggle - only show for following/subscriptions tabs -->
           <div class="view-mode-filter">
             <span
               class="view-mode-btn"
               :class="{ active: viewMode === 'user' }"
               @click="viewMode = 'user'"
             >
               {{ t('home.tab.user') }}
             </span>
             <span
               class="view-mode-btn"
               :class="{ active: viewMode === 'content' }"
               @click="viewMode = 'content'"
             >
               {{ t('home.tab.content') }}
             </span>
           </div>
         </div>

        <div class="filter-container">
            <div class="content-type-filter" v-if="activeContentTab === 'suggested' || viewMode === 'content'" ref="contentTypeFilterRef">
            <span
              v-for="type in contentTypes"
              :key="type.id"
              v-show="type.id !== 0"
              class="type-btn"
              :class="{ active: activeContentType == type.id }"
              @click="activeContentType = type.id"
            >
              {{ t('home.contentType.' + type.label) }}
            </span>
          </div>

          <!-- Sensitive Content Toggle -->
          <div class="sensitive-content-toggle" v-if="contentSwitch.loaded && contentSwitch.showSensitiveToggle && (activeContentTab === 'suggested' || viewMode === 'content')">
            <span class="nsfw-label">{{ t('home.sensitiveContent') }}</span>
            <button class="nsfw-switch" :class="{ on: allowSensitiveContent }" @click="handleSensitiveContentToggle" :aria-pressed="allowSensitiveContent">
              <span class="nsfw-knob"></span>
            </button>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Content View - always show for suggested tab, or when viewMode is content -->
          <template v-if="activeContentTab === 'suggested' || viewMode === 'content'">
            <!-- Empty State -->
            <EmptyState v-if="!loading && allContent.length === 0" :text="t('home.emptyContent')" />

            <!-- Waterfall Layout -->
            <div
              v-else-if="allContent.length > 0"
              class="waterfall"
              ref="waterfallRef"
              :key="`waterfall-${activeContentTab}`"
            >
              <a
                v-for="(item, index) in displayContent"
                :key="item.id"
                class="content-item"
                :ref="(el) => setContentCardRef(el, index)"
                :href="detailHref(item.book_id || item.id, item.type, item.id)"
                @mousemove="onCardTilt"
                @mouseleave="onCardTiltReset"
                @click.prevent="navigateToDetail(item.book_id || item.id, item.type, item.id)"
              >
                <div class="content-image">
                  <img :src="item.cover || defaultCover" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultCover }" />

                  <div class="r18-overlay" v-if="item.is_nsfw == 1">
                    <span class="r18-text">R18</span>
                  </div>

                  <!-- Type Icon -->
                  <div class="type-icon" v-if="item.type">
                    <span class="type-badge" :class="'type-' + item.type">{{ item.type == '1' ? t('collection.typeComic') : item.type == '2' ? t('collection.typeNovel') : item.type == '3' ? t('collection.typeVideo') : item.type == '4' ? t('collection.typeImage') : t('collection.typePhoto') }}</span>
                  </div>
                  <!-- Video Play Icon -->
                  <div v-if="item.type == '3' || item.type == '5'" class="play-icon">
                    <img src="@/assets/images/detail/play.png" alt="" />
                  </div>

                  <div class="content-bottom">
                    <!-- Update Time and Chapter Count -->
                    <div class="update-info">
                      <!-- Completed status -->
                      <template v-if="item.status == 2">
                        <span>{{ t('home.statusFinished') }}</span>
                        <span v-if="item.total_post_nums" class="chapter-divider">|</span>
                        <span v-if="item.total_post_nums">
                          {{ item.type == '2' ? t('home.totalChapterFormat', { chapter: item.total_post_nums }) : t('home.totalEpisodeFormat', { episode: item.total_post_nums }) }}
                        </span>
                      </template>
                      <!-- Ongoing status -->
                      <template v-else>
                        <span v-if="item.latest_post_updated">{{ t(formatUpdateTime(item.latest_post_updated).key, formatUpdateTime(item.latest_post_updated).params || {}) }}</span>
                        <span v-if="(item.latest_post_updated) && item.latest_post_chapter_index" class="chapter-divider">|</span>
                        <span v-if="item.latest_post_chapter_index">
                          {{ item.type == '2' ? t('home.chapterFormat', { chapter: item.latest_post_chapter_index }) : t('home.episodeFormat', { episode: item.latest_post_chapter_index }) }}
                        </span>
                      </template>
                    </div>
                    <!-- Video Duration -->
                    <!-- <div class="video-duration" v-if="item.type == '3' && item.duration">
                      {{ formatDuration(item.duration) }}
                    </div> -->
                    <div class="make-btns-wrap" v-if="(item.session_id && item.type != '4') || item.type == '5'">
                      <div class="make-similar-btn" v-if="item.type != '4' && item.type != '5' && item.session_id" @click.stop.prevent="composerRef?.applyMakeSimilar(item)">
                        <img :src="makeIcon" alt="" class="make-icon" />
                        <div class="make-similar-tooltip">{{ t('home.makeSimilar') }}</div>
                      </div>
                      <div class="make-similar-btn" v-if="item.type == '5' && parseFloat(item.duration) < 31" @click.stop.prevent="composerRef?.applyMakeSimilarVideo(item)">
                        <img :src="makeIcon" alt="" class="make-icon" />
                        <div class="make-similar-tooltip">{{ t('home.makeSimilarVideo') }}</div>
                      </div>
                      <div class="make-similar-btn" v-if="item.type == '5'" @click.stop.prevent="composerRef?.applyMakeSequel(item)">
                        <img :src="videoIcon" alt="" class="make-icon" />
                        <div class="make-similar-tooltip">{{ t('home.makeSequel') }}</div>
                      </div>
                    </div>
                  </div>

                </div>
                <div class="content-info">
                  <div class="content-desc" v-if="item.description || item.title">{{ item.description ? item.description : item.title ? item.title : '' }}</div>
                  <div class="content-meta">
                    <div class="author-info" v-if="activeContentTab != 'suggested'" @click.stop.prevent="navigateToUserHome(item.author?.id)">
                      <img :src="item.author?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                      <span class="author-name">{{ item.author?.nickname }}</span>
                    </div>
                    <div class="author-info" v-else @click.stop.prevent="navigateToUserHome(item.author_info?.id)">
                      <img :src="item.author_info?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                      <span class="author-name">{{ item.author_info?.nickname }}</span>
                    </div>
                    <div class="content-stats-top">
                      <span>{{ formatNumber(parseInt(item.all_like || "0")) }}</span>
                      <img :src="like" alt="" />
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t('home.loading') }}</div>
            </div>

            <div v-if="loadingMoreContent" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t('home.loading') }}</div>
            </div>
            <div v-if="!hasMoreContent && allContent.length > 0" class="no-more-text">{{ t('home.noMore') }}</div>
          </template>

          <!-- User List View - only show for following/subscriptions tabs when viewMode is user -->
          <template v-else-if="activeContentTab !== 'suggested' && viewMode === 'user'">
            <!-- Empty State -->
            <EmptyState v-if="!loading && followUserList.length === 0" />

            <!-- User List -->
            <div v-else-if="followUserList.length > 0" class="follow-list">
              <div
                v-for="(user, index) in followUserList"
                :key="user.id"
                class="follow-card"
              >
                <div class="card-body" @click="navigateToUserHome(user.id)">
                  <div class="card-top">
                    <img :src="user.avatar || defaultAvatar" class="user-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                    <div class="user-meta">
                      <div class="nickname">{{ user.nickname }}</div>
                      <div class="fans-count">
                        {{ t('home.user.fans', { count: formatNumber(user.fans) }) }}
                      </div>
                    </div>
                  </div>
                  <div class="card-bio">{{ user.bio }}</div>
                </div>
                <div class="card-footer" v-if="user.id != uid">
                  <button
                    class="follow-btn"
                    :class="{ followed: user.isFollowed }"
                    @click.stop="toggleUserFollow(user)"
                  >
                    <span class="btn-text">{{ user.isFollowed ? t('home.user.following') : t('home.user.follow') }}</span>
                    <span class="hover-text" v-if="user.isFollowed">{{ t('home.user.unfollow') }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t('home.loading') }}</div>
            </div>

            <div v-if="loadingMoreUsers" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t('home.loading') }}</div>
            </div>
            <div v-if="!hasMoreUsers && followUserList.length > 0" class="no-more-text">{{ t('home.noMore') }}</div>
          </template>
        </div>
      </div>
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

    <UserInfoModal
      :visible="showUserInfoModal"
      :userInfo="userInfo"
      @confirm="handleUserInfoConfirm"
      @close="handleUserInfoCancel"
      @skip="handleUserInfoSkip"
    />

    <InviteCodeModal
      :visible="showInviteCodeModal"
      @close="handleInviteCodeSkip"
      @confirm="handleInviteCodeConfirm"
      @skip="handleInviteCodeSkip"
    />

    <!-- Guide Modal -->
    <GuideModal
      :visible="showGuideModal"
      @close="showGuideModal = false"
    />

    <!-- Event Modal (首页延迟弹出的活动告知) -->
    <!-- 暂时注释：活动弹窗遮挡了「详细使用方法」按钮，先关闭 -->
    <!-- <EventModal /> -->




    <!-- Bottom content tabs -->
    <nav v-if="showBottomContentTabs" class="bottom-content-tabs" aria-label="content types">
      <button
        v-for="type in contentTypes"
        :key="`bottom-${type.id}`"
        v-show="type.id !== 0"
        type="button"
        class="bottom-content-tab"
        :class="{ active: activeContentType == type.id }"
        @click="activeContentType = type.id"
      >
        {{ t('home.contentType.' + type.label) }}
      </button>
    </nav>

    <!-- Footer -->
    <Footer
      :total-pages="Math.ceil(totalPosts / pageSize)"
      :current-page="currentPage"
      @page-change="handlePageChange"
    ></Footer>

    <!-- Video Player Modal -->
    <div v-if="showVideoModal" class="video-modal">
      <div class="video-modal-content">
        <button class="close-btn" @click="closeVideoModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        <video :src="playingVideoUrl" controls autoplay class="video-player" playsinline></video>
      </div>
    </div>

    <!-- Audio Player Modal -->
    <div v-if="showAudioModal" class="video-modal audio-modal">
      <div class="audio-modal-content">
        <div class="audio-modal-inner">
          <button class="close-btn" @click="closeAudioModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
          <img src="@/assets/images/home/audio.png" alt="audio" class="audio-modal-icon" />
          <audio :src="playingAudioUrl" controls autoplay class="audio-player"></audio>
        </div>
      </div>
    </div>

    <!-- Image Zoom Modal -->
    <div v-if="showImageZoomModal" class="cover-zoom-modal" @click="closeImageZoomModal">
      <div class="cover-zoom-content">
        <button class="close-btn" @click.stop="closeImageZoomModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        <img :src="zoomedImageUrl" alt="" class="zoomed-cover-image" />
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import { toast, limitToast } from '@/util/toast';
import Header from '@/components/Header.vue';
import SensitiveContentAdultConfirmModal from '@/components/SensitiveContentAdultConfirmModal.vue';
import SensitiveContentConfirmModal from '@/components/SensitiveContentConfirmModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import UserInfoModal from '@/components/UserInfoModal.vue';
import InviteCodeModal from '@/components/InviteCodeModal.vue';
import GuideModal from '@/components/GuideModal.vue';
// import EventModal from '@/components/EventModal.vue';
import Footer from '@/components/Footer.vue';
import ProcessList from '@/components/ProcessList.vue';
import Hero3DBackground from '@/components/Hero3DBackground.vue';
import HomeShowcase from '@/components/HomeShowcase.vue';
import router from '@/router';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import PromoBanner from '@/components/PromoBanner.vue';
import bannerSlotImage from '@/assets/images/home/banner.jpg';
import bannerSlotVideo from '@/assets/images/home/banner.mp4';
import heroBgVideo from '@/assets/images/home/video.mp4';
import { trackClickContentCover, trackClickPromptBox, trackContentPublished, trackClickGenerateButton } from '@/utils/analytics';
import { formatDuration, formatUpdateTime, initLanguage, processImageUrl } from '@/util/utils';

import like from '@/assets/images/home/like.png';
import defaultAvatar from "@/assets/images/base/avatar.png";
import defaultCover from "@/assets/images/base/cover.png";
import makeIcon from "@/assets/images/base/make.png";
import videoIcon from "@/assets/images/base/video.png";

import { useI18n } from 'vue-i18n';
import PromptComposer from '@/components/PromptComposer.vue';
import { ensureRegion, userRegion, hasFetchedRegion } from '@/util/region';

const { t, locale } = useI18n();

const composerRef = ref<InstanceType<typeof PromptComposer> | null>(null);

// hero 拟声词只炸开一次
const heroPartsPopped = ref(false);
const getCountry = () => ensureRegion();

// 登录校验：输入框那份跟着组件走了，信息流这边（关注、点赞、切 tab）自己留一份
const checkLogin = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    try {
      localStorage.setItem('loginRedirect', route.fullPath);
    } catch {
      /* 忽略 */
    }
    router.push('/login');
    return false;
  }
  return true;
};


const route = useRoute();

const activeContentTab = ref('suggested');
const searchQuery = ref('');
const sortOrder = ref('hot');
const loading = ref(false);
const activeContentType = ref(5);
const isSearchFocused = ref(false);
const contentTypeFilterRef = ref<HTMLElement | null>(null);
const showBottomContentTabs = ref(false);


const uid = localStorage.getItem('uid');

// hero 背景动画暂停/播放
// hero 背景视频：switch_no = 2 且非中国地区时，用它替掉漂浮动效 / 拟声词 / 柔光。
// 换素材直接改这两个常量（放 public/ 下或填完整 URL 都行）。
const HERO_VIDEO_SRC = heroBgVideo;
const HERO_VIDEO_POSTER = '';
const heroVideoRef = ref<HTMLVideoElement | null>(null);

const heroPaused = ref(false);
// hero 编辑态：聚焦输入框后 3D 漫画卡片背景散开并消失
const heroEditing = ref(false);

// hero 边上飘的拟声词（对齐 moegen PARTS，浮动装饰 + 点击炸开变换）
const heroParts = [
  { before: 'doon', after: 'gokuri', left: '1%', top: '4%', w: 19, rot: -6 },
  { before: 'left_cloud', after: 'hirameki', left: '12%', top: '45%', w: 8, rot: 0, afterScale: 0.7, afterRot: -30 },
  { before: 'exclamation', after: 'excl_white', left: '1.5%', top: '33%', w: 9, rot: -4 },
  { before: 'fk_input', after: 'story_bubble', left: '2.5%', top: '58%', w: 13, rot: 2 },
  { before: 'zuba', after: 'gogogo', left: '22%', top: '87%', w: 10, rot: -3 },
  { before: 'fk_oneword', after: 'imagination', left: '84%', top: '4%', w: 12.5, rot: 3 },
  { before: 'dogaan', after: 'zawazawa', left: '81.5%', top: '27.5%', w: 10, rot: 0 },
  { before: 'right_cloud', after: 'dokidoki', left: '91.5%', top: '47%', w: 7.5, rot: 0 },
  { before: 'fk_imagine', after: 'yokan', left: '85%', top: '61%', w: 12.5, rot: -2 },
  { before: 'bashitsu', after: 'su', left: '62%', top: '87.5%', w: 9, rot: 4 },
] as { before: string; after: string; left: string; top: string; w: number; rot: number; afterScale?: number; afterRot?: number }[];
const heroPartSrc = ref<string[]>(heroParts.map((p) => p.before));

const heroPartStyle = (p: typeof heroParts[number], i: number) => ({
  left: p.left,
  top: p.top,
  '--w': p.w,
  '--rot': `${p.rot}deg`,
  '--fdur': `${(6.4 + (i % 5) * 0.9).toFixed(2)}s`,
  '--fdelay': `${(-(i * 0.83)).toFixed(2)}s`,
  '--fdx': `${(7 + (i % 3) * 4).toFixed(0)}px`,
  '--fdy': `${(9 + (i % 4) * 4).toFixed(0)}px`,
  '--frot': `${(1.6 + (i % 3) * 0.7).toFixed(2)}deg`,
}) as any;

const heroPartsRef = ref<HTMLDivElement>();

// mode 已经是「生效模式」（中国地区的 2 会被降级成 0），这里再显式排一次中国地区，
// 免得以后降级规则改了这块跟着走偏。
const showHeroVideo = computed(
  () => contentSwitch.loaded && contentSwitch.mode === 2 && !contentSwitch.isChinaRegion,
);

// 右下角那个暂停按钮在视频模式下改成控制视频播放
watch(heroPaused, (paused) => {
  const v = heroVideoRef.value;
  if (!v) return;
  if (paused) v.pause();
  else v.play().catch(() => {});
});

const initHeroParts = () => {
  const box = heroPartsRef.value;
  if (!box) return;
  const items = Array.from(box.querySelectorAll<HTMLImageElement>('.hero-part'));
  items.forEach((im, i) => {
    window.setTimeout(() => { im.style.opacity = '1'; }, 140 + i * 70);
  });
  box.classList.add('mg-parts-live');
};

const popHeroParts = () => {
  if (heroPartsPopped.value) return;
  heroPartsPopped.value = true;
  heroEditing.value = true;
  const box = heroPartsRef.value;
  if (!box) return;
  const items = Array.from(box.querySelectorAll<HTMLImageElement>('.hero-part'));
  items.forEach((im, i) => {
    const p = heroParts[i];
    im.style.animation = 'none';
    im.style.transformOrigin = '50% 50%';
    const d = (i * 0.04).toFixed(2);
    im.style.transition = `transform .5s cubic-bezier(.5,0,.75,0) ${d}s, opacity .5s cubic-bezier(.5,0,.75,0) ${d}s`;
    im.style.transform = `translate(0,0) scale(.06) rotate(${p.rot}deg)`;
    im.style.opacity = '0';
    window.setTimeout(() => {
      heroPartSrc.value[i] = p.after;
      const aSc = p.afterScale ?? 1;
      const aRot = p.afterRot ?? p.rot;
      im.style.transition = 'transform 1s cubic-bezier(.34,1.56,.64,1), opacity .5s cubic-bezier(.16,1,.3,1)';
      im.style.transform = `translate(0,0) scale(${aSc}) rotate(${aRot}deg)`;
      im.style.opacity = '1';
    }, 520 + i * 40);
  });
};

// Banner data
// Banner 是本地固定推广位，素材见上面的 import，文案走 i18n。
// 填了链接整块就可点，留空则纯展示。
const PROMO_BANNER_LINK = '';

// 中国地区不展示这块运营 banner（口径见 contentSwitch.bannerDisabled）
const showPromoBanner = computed(() => contentSwitch.loaded && !contentSwitch.bannerDisabled);


// Request identifier to avoid race conditions
const currentRequestId = ref(0);


const showVideoModal = ref(false);

const playingVideoUrl = ref('');


const closeVideoModal = () => {
  showVideoModal.value = false;
  playingVideoUrl.value = '';
};

const showAudioModal = ref(false);
const playingAudioUrl = ref('');


const closeAudioModal = () => {
  showAudioModal.value = false;
  playingAudioUrl.value = '';
};

const showImageZoomModal = ref(false);
const zoomedImageUrl = ref('');


const closeImageZoomModal = () => {
  showImageZoomModal.value = false;
  zoomedImageUrl.value = '';
};


const heroSectionRef = ref<HTMLDivElement | null>(null);

const contentSectionRef = ref<HTMLElement | null>(null);


// 从详情页/搜索页点做同款、做视频、做续集跳回首页时，停在推荐列表这一屏。
// 用户是奔着「看列表 + 底部输入框」来的，滚到顶部的 hero 反而把输入框顶出视野。
const FEED_SCROLL_OFFSET = 70; // 顶部固定 header 的高度
const scrollToFeed = () => {
  const el = contentSectionRef.value;
  if (!el) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }
  let top = el.getBoundingClientRect().top + window.scrollY - FEED_SCROLL_OFFSET;
  // 至少要滚到 hero 完全离开视口。只按「列表顶部 - header」算的话，
  // hero 和列表之间的间距不足 header 高度时，hero 底边还露在视口里，
  // 吸底输入框的判定条件就不成立。
  const hero = heroSectionRef.value;
  if (hero) {
    top = Math.max(top, hero.getBoundingClientRect().bottom + window.scrollY + 1);
  }
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
};
const justSwitchedTab = ref(false);


// Pagination variables
const totalPosts = ref(0);
const pageSize = ref(48);
const homePageRef = ref<HTMLElement | null>(null);
const currentStyleName = ref(''); // Current selected style name

// Waterfall layout state
const waterfallRef = ref<HTMLElement | null>(null);
const contentCardRefs = ref<(HTMLElement | null)[]>([]);

// Function to set content card ref at specific index
const setContentCardRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el && el instanceof HTMLElement) {
    contentCardRefs.value[index] = el;
  }
};

// 卡片鼠标跟随 3D 倾斜（对齐 moegen GridCard onMove/reset）
const onCardTilt = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-3px)`;
};
const onCardTiltReset = (e: MouseEvent) => {
  (e.currentTarget as HTMLElement).style.transform = '';
};

// Content Types
// 漫画 / 小说先隐藏（推荐、关注、订阅三个 tab 下的作品列表共用这一份类型筛选）。
// 要恢复把下面两行的注释去掉即可。
const contentTypes = ref([
  { id: 0, label: 'all' },
  { id: 5, label: 'video' },
  { id: 4, label: 'image' },
  // { id: 1, label: 'comic' },
  // { id: 2, label: 'novel' }
]);

// Sort Options
const sortOptions = ref([
  { id: 'hot', label: 'home.filter.trending' },
  { id: 'new', label: 'home.filter.latest' }
]);

// Mode Options
const modeOptions = computed(() => contentSwitch.showSensitiveToggle ? [
  { id: 'normal', label: 'home.mode.normal', name: 'normal' },
  { id: 'unlimited', label: 'home.mode.unlimited', name: 'unlimited' }
] : [
  { id: 'normal', label: 'home.mode.normal', name: 'normal' }
]);

const contentSwitch = useContentSwitchStore();
// 是否未成年：以详情接口 is_adult 字段为准（is_adult == 1 为已满18岁）
const isTeenager = computed(() => !userInfo.value || userInfo.value.is_adult != 1);

const showSensitiveContentAdultConfirmModal = ref(false);
const showSensitiveContentConfirmModal = ref(false);
const showUserInfoModal = ref(false);
const showInviteCodeModal = ref(false);
const showGuideModal = ref(false);

// Balance info
const balanceInfo = ref<any>(null);


const headerRef = ref<InstanceType<typeof Header> | null>(null);
const userInfo = ref<any>(null);

function handleUserInfoLoaded(info: any) {
  userInfo.value = info;
  // Update userRegion based on user info
  updateUnlimitedModeVisibility();
}

function handleBalanceInfoLoaded(info: any) {
  balanceInfo.value = info;
}


// Content Pagination
const currentPage = ref(1);
const hasMoreContent = ref(true);
const hasMoreUsers = ref(true);
const loadingMoreContent = ref(false);
const loadingMoreUsers = ref(false);


// Content Tabs
const contentTabs = ref([
  { id: 'suggested', label: 'home.tab.suggested' },
  { id: 'subscriptions', label: 'home.tab.subscriptions' },
  { id: 'following', label: 'home.tab.following' }
]);

const tabCur = ref(0);

// User/Content toggle for following/subscriptions tabs
const viewMode = ref<'content' | 'user'>('user');

// Content data
const allContent = ref<any[]>([]);

// User list data for following/subscriptions tabs
const followUserList = ref<any[]>([]);
const followUserPage = ref(1);
const followUserTotal = ref(0);

// Computed
const displayContent = computed(() => {
  return allContent.value;
});

// Methods

const allowSensitiveContent = computed({
  get: () => contentSwitch.showNsfw === 1,
  set: (value: boolean) => contentSwitch.setUserAllowsSensitive(value),
});

const checkAgeForSensitiveContent = (): boolean => {
  return false;
};

const handleSensitiveContentToggle = () => {
  if (!contentSwitch.showSensitiveToggle) return;
  if (allowSensitiveContent.value) {
    allowSensitiveContent.value = false;
    localStorage.setItem('allowSensitiveContent', '0');
    loadContent(1);
    return;
  }

  if (checkAgeForSensitiveContent()) {
    return;
  }

  const hasConfirmed = localStorage.getItem('sensitiveContentDontAsk') == '1';
  if (hasConfirmed) {
    allowSensitiveContent.value = true;
    localStorage.setItem('allowSensitiveContent', '1');
    loadContent(1);
  } else {
    showSensitiveContentConfirmModal.value = true;
  }
};

const confirmSensitiveContent = () => {
  allowSensitiveContent.value = true;
  localStorage.setItem('allowSensitiveContent', '1');
  showSensitiveContentConfirmModal.value = false;
  loadContent(1);
};

const handleSensitiveContentAgeConfirm = async (isAdult: boolean) => {
  showSensitiveContentAdultConfirmModal.value = false;
  // 单按钮自声明满18岁；isAdult 恒为 true
  if (!isAdult) {
    return;
  }
  // 存本地缓存 is_adult=1（不直接打开开关）
  localStorage.setItem('is_adult', '1');
  // 已登录：同时写回后端 is_adult
  const token = localStorage.getItem('token');
  if (token) {
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
  }

  // 声明成年后，直接打开敏感内容开关，不再二次弹「允许敏感？」确认弹窗
  allowSensitiveContent.value = true;
  localStorage.setItem('allowSensitiveContent', '1');
  loadContent(1);
};


// Banner jump
const goBanner = (url: string) => {
  window.location.href = url
}




// Update unlimited mode visibility based on country and user info
function updateUnlimitedModeVisibility() {
  // Use the cached getCountry function to avoid duplicate API calls
  getCountry();
}


// Switch content tab and reload data
const switchContentTab = (tabId: string, index: number) => {
  // Check if user is logged in when switching to following or subscriptions tabs
  if ((tabId === 'following' || tabId === 'subscriptions')) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/register');
      return;
    }
  }

  // Set flag to prevent content restoration
  justSwitchedTab.value = true;

  activeContentTab.value = tabId;
  tabCur.value = index;
  currentPage.value = 1;
  followUserPage.value = 1;
  hasMoreContent.value = true;
  hasMoreUsers.value = true;
  // 「全部」筛选项已经隐藏，订阅/关注切到作品视图时跟推荐 tab 一样默认选中「视频」
  activeContentType.value = 5;
  allContent.value = []; // Clear old data to show loading state
  followUserList.value = []; // Clear user list
  contentCardRefs.value = []; // Clear card refs to reset layout
  loading.value = false; // Reset loading state to allow new request

  // Reset viewMode to 'user' when switching to following/subscriptions tabs
  if (tabId === 'following' || tabId === 'subscriptions') {
    viewMode.value = 'user';
  }

  // 切换推荐/关注/订阅时清掉输入框里视频 tab 的内容（小说/漫画/漫剧草稿不受影响）
  composerRef.value?.resetOnTabSwitch();

  // Use nextTick to ensure DOM is updated before loading new content
  nextTick(() => {
    if (tabId === 'following' || tabId === 'subscriptions') {
      // For following/subscriptions tabs, load user list first since viewMode defaults to 'user'
      fetchFollowUserList();
    } else {
      loadContent(1);
    }
    // Reset flag after a short delay
    setTimeout(() => {
      justSwitchedTab.value = false;
    }, 100);
  });
};


// Load content from API
let isLoadingContent = false;
const loadContent = async (page = 1) => {
  // Prevent multiple concurrent requests
  if (isLoadingContent) {
    return;
  }
  isLoadingContent = true;

  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab combination at the time of the request
  const currentActiveTab = activeContentTab.value;
  const currentContentType = activeContentType.value;
  const currentSortOrder = sortOrder.value;

  if (page === 1) {
    loading.value = true;
    allContent.value = [];
  } else {
    loadingMoreContent.value = true;
  }

  await contentSwitch.ensureLoaded();
  await getCountry();

  try {
    let res;

    const showNsfw = contentSwitch.showNsfw;
    const channel = contentSwitch.channel;

    switch (currentActiveTab) {
      case 'suggested':
        if (currentContentType === 4 || currentContentType === 5) {
          res = await api.homeRecommendPostList(page, pageSize.value, currentContentType, locale.value == 'zh' ? 'cn' : locale.value, showNsfw, channel) as any;
        } else {
          res = await api.homePostList(page, pageSize.value, currentContentType, locale.value == 'zh' ? 'cn' : locale.value, showNsfw, channel) as any;
        }
        break;
      case 'following':
        if (currentContentType === 4 || currentContentType === 5) {
          res = await api.homeFollowPostList(page, pageSize.value, currentContentType, showNsfw, channel) as any;
        } else {
          res = await api.homeFollowList(page, pageSize.value, currentContentType, showNsfw, channel) as any;
        }
        break;
      case 'subscriptions':
        if (currentContentType === 4 || currentContentType === 5) {
          res = await api.homeSubscriptionPostList(page, pageSize.value, currentContentType, showNsfw, channel) as any;
        } else {
          res = await api.homeSubscriptionList(page, pageSize.value, currentContentType, showNsfw, channel) as any;
        }
        break;
      default:
        res = await api.homePostList(page, pageSize.value, currentContentType, locale.value == 'zh' ? 'cn' : locale.value, showNsfw, channel) as any;
    }

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      isLoadingContent = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab or content type has changed while the request was in flight
    if (currentActiveTab !== activeContentTab.value || currentContentType !== activeContentType.value || currentSortOrder !== sortOrder.value) {
      isLoadingContent = false;
      return; // Skip processing this response as the tab has changed
    }

    if (res.code == 0 || res.code == 200) {
      let data = res.data?.data || res.data || [];

      data.forEach((item: any) => {
        if (activeContentTab.value == 'suggested') {
          item.is_liked = item.is_liked || 0;
        } else {
          item.is_liked = item.is_liked ? 1 : 0;
        }
      });

      // Filter out blocked users
      const rawCount = res.data?.count || (res.data?.data || res.data || []).length;

      data = data.filter((item: any) => item.is_blacked != 1 && item.blogger_info?.is_blacked != 1);

      if (page === 1) {
        allContent.value = data;
      } else {
        allContent.value = [...allContent.value, ...data];
      }

      if (rawCount < pageSize.value) {
        hasMoreContent.value = false;
      } else {
        const totalNum = res.data?.allnums;
        totalPosts.value = typeof totalNum === 'number' && !isNaN(totalNum) ? totalNum : (typeof totalNum === 'string' && !isNaN(Number(totalNum)) ? Number(totalNum) : 0);
        hasMoreContent.value = allContent.value.length < totalPosts.value;
      }

      nextTick(() => {
        layoutWaterfall();
      });
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
    loadingMoreContent.value = false;
    isLoadingContent = false;
  }
};

function layoutWaterfall() {
  if (!waterfallRef.value || !allContent.value || allContent.value.length === 0) {
    return;
  }

  // Wait for next tick to ensure all DOM elements are rendered
  nextTick(() => {
    // Flex layout will handle positioning automatically
    // No need for absolute positioning calculations
  });
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

// 首页三个 tab 对应详情接口的「来源列表」类型（Detail.vue 的 fetchDetail 按它拼 fromXxx）：
// 1 = fromIndexRecommend（推荐）/ 2 = fromIndexFollow（关注）/ 3 = fromIndexSubscription（订阅）。
// 图片、视频（type 4/5）是单篇作品，详情页靠这个参数才能算出上一个/下一个，显示上下箭头。
const HOME_TAB_SOURCE: Record<string, string> = {
  suggested: '1',
  following: '2',
  subscriptions: '3',
};

const detailQuery = (postId: string | number) => ({
  id: String(postId),
  // 详情接口把 tab 当 contentType 用，要传列表当前的内容类型（4 图片 / 5 视频），
  // 不能传 tab 名，否则后端还原不出同一份列表
  tab: String(activeContentType.value),
  type: HOME_TAB_SOURCE[activeContentTab.value] || '1',
});

const navigateToDetail = (bookId: string, type?: string, postId?: string | number) => {
  const typeCategoryMap: Record<string, "Novel" | "Comic" | "Drama" | "Image" | "Video"> = {
    '1': 'Comic',
    '2': 'Novel',
    '3': 'Drama',
    '4': 'Image',
    '5': 'Video'
  };
  if (type && typeCategoryMap[type]) {
    trackClickContentCover(typeCategoryMap[type]);
  }
  localStorage.setItem('homeContentTab', activeContentTab.value);
  localStorage.setItem('homeContentType', activeContentType.value.toString());
  if (String(type) === '4' || String(type) === '5') {
    router.push({ path: '/detail', query: detailQuery(postId || bookId) });
  } else {
    router.push(`/collection/${bookId}`);
  }
};

// 提供真实可爬取的详情页链接（配合模板里的 <a :href> + @click.prevent，兼顾 SEO 与 SPA 体验）
const detailHref = (bookId: string, type?: string, postId?: string | number) => {
  if (String(type) === '4' || String(type) === '5') {
    const q = detailQuery(postId || bookId);
    return `/detail?id=${q.id}&tab=${q.tab}&type=${q.type}`;
  }
  return `/collection/${bookId}`;
};

const navigateToUserHome = (userId: number) => {
  router.push({ path: '/user-home', query: { id: userId } });
};

const toggleUserFollow = async (user: any) => {
  if (!checkLogin()) return;

  try {
    const data = { followed_id: user.id };
    const res = user.isFollowed
      ? await api.unfollow(data)
      : await api.follow(data);

    const response = res as any;
    if (response.code === 200 || response.code === 0) {
      user.isFollowed = !user.isFollowed;
      toast(t(user.isFollowed ? 'home.user.followSuccess' : 'home.user.unfollowSuccess'));
    } else {
      toast(locale.value == 'jp' ? response.msg_jp : response.msg);
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    toast(t('fail'));
  }
};

const handleUserPageChange = (page: number) => {
  followUserPage.value = page;
  fetchFollowUserList();
};

const fetchFollowUserList = async (append = false) => {
  if (append) {
    loadingMoreUsers.value = true;
  } else {
    loading.value = true;
  }
  const authorId = localStorage.getItem('uid') || '';
  try {
    let res;
    if (activeContentTab.value === 'following') {
      res = await api.authorFollowList(followUserPage.value, 36, authorId) as any;
    } else {
      res = await api.authorSubList(followUserPage.value, 36) as any;
    }

    if (res.code === 200 || res.code === 0) {
      const newUsers = (res.data?.data || res.data?.list || []).map((item: any) => {
        const bloggerInfo = item.blogger_info || item.user_info || item;
        return {
          id: item.blogger_id || item.user_id || bloggerInfo.id || item.id,
          nickname: bloggerInfo.nickname,
          avatar: bloggerInfo.avatar,
          bio: item.intro || bloggerInfo.bio || bloggerInfo.signature || '',
          fans: parseInt(item.fans_total) || parseInt(item.fans) || item.follower_count || 0,
          isFollowed: item.is_followed == 1 || false
        };
      });

      if (append) {
        followUserList.value = [...followUserList.value, ...newUsers];
      } else {
        followUserList.value = newUsers;
       }

      const rawUserCount = res.data?.count || (res.data?.data || res.data?.list || []).length;
      if (rawUserCount < 36) {
        hasMoreUsers.value = false;
      } else {
        followUserTotal.value = parseInt(res.data?.allnums) || res.data?.count || res.data?.total || 0;
        hasMoreUsers.value = followUserList.value.length < followUserTotal.value;
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : locale.value == 'jp' ? res.msg_jp : res.msg);
    }
  } catch (error) {
    console.error('Error fetching user list:', error);
    toast(t('fail'));
  } finally {
    loading.value = false;
    loadingMoreUsers.value = false;
  }
}

async function toggleLike(item: any) {
  // Check if user is logged in
  if (!checkLogin()) return;

  try {
    const postId = item.id;
    // Find the post in the allContent array
    const postIndex = allContent.value.findIndex(p => p.id === postId);
    if (postIndex == -1) return;

    const isCurrentlyLiked = item.is_liked == 1;

    // Call the appropriate API first
    let res;
    if (isCurrentlyLiked) {
      // Unlike post
      res = await api.dislikePost({ post_id: postId }) as any;
    } else {
      // Like post
      res = await api.likePost({ post_id: postId }) as any;
    }

    // Check if API call was successful
    if (res.code === 0 || res.code === 200) {
      // Update the UI only after API success
      if (allContent.value) {
        allContent.value[postIndex].is_liked = isCurrentlyLiked ? 0 : 1;

        allContent.value[postIndex].all_like = isCurrentlyLiked
          ? (parseInt(allContent.value[postIndex].all_like || "0") - 1).toString()
          : (parseInt(allContent.value[postIndex].all_like || "0") + 1).toString();
      }
    }
  } catch (error) {
    console.error('Like/unlike error:', error);
  }
}

const handleSearch = () => {
  router.push({ path: "/search", query: { keyword: searchQuery.value.trim(), type: "post" } });
};


function setSeoMeta(type?: string) {
  let title: string, keywords: string, description: string;

  if (type) {
    const seoKeyMap: Record<string, string> = {
      'novel': 'seo.home.novel',
      'comic': 'seo.home.comic',
      'drama': 'seo.home.drama',
      'photo': 'seo.home.photo',
      'video': 'seo.home.video'
    };
    const seoKey = seoKeyMap[type];
    if (seoKey) {
      title = t(`${seoKey}.title`);
      keywords = t(`${seoKey}.keywords`);
      description = t(`${seoKey}.description`);
    } else {
      title = t('seo.home.title');
      keywords = t('seo.home.keywords');
      description = t('seo.home.description');
    }
  } else {
    title = t('seo.home.title');
    keywords = t('seo.home.keywords');
    description = t('seo.home.description');
  }

  document.title = title;

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', keywords);

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);
}

// Handle window resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
function handleResize() {
  // Debounce resize event
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = setTimeout(() => {
    if (allContent.value.length > 0) {
      layoutWaterfall();
    }
  }, 200);
}

async function checkFirstRegister() {
  const isFirstLogin = localStorage.getItem('isFirstLogin');
  const isFirstRegister = localStorage.getItem('isFirstRegister');

  // if (isFirstLogin == '1') {
  //   showInviteCodeModal.value = true;
  //   localStorage.removeItem("isFirstLogin");
  // }

  if (isFirstRegister == '1') {
    // 首次注册不再弹资料填写弹窗，直接进入新手引导
    showGuideModal.value = true;
    localStorage.removeItem("isFirstRegister");
  }
}

function handleUserInfoConfirm(info: { username: string; avatar: string; birth?: { year: number | ''; month: number | ''; day: number | '' } }) {
  const originalNickname = userInfo.value?.info?.nickname || "";
  const originalAvatar = userInfo.value?.info?.avatar || "";
  const hasNicknameChanged = info.username !== originalNickname;
  const hasAvatarChanged = info.avatar !== originalAvatar;
  const hasBirthChanged = info.birth && info.birth.year && info.birth.month && info.birth.day;

  if (hasNicknameChanged || hasAvatarChanged || hasBirthChanged) {
    let operationsCount = 0;
    let completedOperations = 0;
    let hasError = false;

    const checkAllOperationsComplete = () => {
      completedOperations++;
      if (completedOperations === operationsCount && !hasError) {
        showUserInfoModal.value = false;

        if (headerRef.value) {
          headerRef.value.getUserInfo();
        }

        showGuideModal.value = true;
      }
    };

    if (hasNicknameChanged) {
      operationsCount++;
      const nicknameData = {
        nickname: info.username,
      };

      api
        .modifyUsername(nicknameData)
        .then((res: any) => {
          if (res.code === 0 || res.code === 200) {
            checkAllOperationsComplete();
          } else {
            hasError = true;
            toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
          }
        })
        .catch((e: any) => {
          hasError = true;
          console.error(e);
          toast(t('fail'));
        });
    }

    if (hasAvatarChanged) {
      operationsCount++;
      const avatarData = {
        avatar: info.avatar,
      };

      api
        .modifyAvatar(avatarData)
        .then((res: any) => {
          if (res.code === 0 || res.code === 200) {
            checkAllOperationsComplete();
          } else {
            hasError = true;
            toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
          }
        })
        .catch((e: any) => {
          hasError = true;
          console.error(e);
          toast(t('fail'));
        });
    }

    if (hasBirthChanged && info.birth) {
      operationsCount++;
      const birthData = {
        year: info.birth.year,
        month: info.birth.month,
        day: info.birth.day
      };

      api
        .modifyBirth(birthData)
        .then((res: any) => {
          if (res.code === 0 || res.code === 200) {
            checkAllOperationsComplete();
          } else {
            hasError = true;
            toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
          }
        })
        .catch((e: any) => {
          hasError = true;
          toast(t('fail'));
        });
    }
  } else {
    showUserInfoModal.value = false;
  }
}

function handleUserInfoSkip() {
  showUserInfoModal.value = false;

  showGuideModal.value = true;
}

function handleInviteCodeConfirm(code: string) {
  const data = {
    invite_code: code,
  }

  api.userInvite(data).then((res: any) => {
    if (res.code == 200 || res.code == 0) {
      showInviteCodeModal.value = false;
      showUserInfoModal.value = true;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  }).catch(() => {
    toast(t('fail'));
  });
}

function handleInviteCodeSkip() {
  showInviteCodeModal.value = false;

  showUserInfoModal.value = true;
}

function handleUserInfoCancel() {
  showUserInfoModal.value = false;

  showGuideModal.value = true;
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadContent(page);
}

const handleScrollToBottom = () => {
  const filter = contentTypeFilterRef.value;
  const shouldShowFilterTabs = activeContentTab.value === 'suggested' || viewMode.value === 'content';
  showBottomContentTabs.value = shouldShowFilterTabs && !!filter && filter.getBoundingClientRect().bottom < 0;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= documentHeight - 200) {
    if (activeContentTab.value === 'suggested' || viewMode.value === 'content') {
      if (hasMoreContent.value && !isLoadingContent && !loading.value && !loadingMoreContent.value) {
        currentPage.value++;
        loadContent(currentPage.value);
      }
    } else if (activeContentTab.value !== 'suggested' && viewMode.value === 'user') {
      if (hasMoreUsers.value && !loading.value && !loadingMoreUsers.value) {
        followUserPage.value++;
        fetchFollowUserList(true);
      }
    }
  }
};


// ---------------------------------------------------------------------------
// 生命周期
// ---------------------------------------------------------------------------
watch(activeContentType, () => {
  currentPage.value = 1;
  hasMoreContent.value = true;
  allContent.value = [];
  loadContent(1);
});

watch(sortOrder, () => {
  currentPage.value = 1;
  hasMoreContent.value = true;
  allContent.value = [];
  loadContent(1);
});

watch(viewMode, (newMode) => {
  if (newMode === 'user' && (activeContentTab.value === 'following' || activeContentTab.value === 'subscriptions')) {
    followUserPage.value = 1;
    hasMoreUsers.value = true;
    followUserList.value = [];
    fetchFollowUserList();
  } else if (newMode === 'content') {
    currentPage.value = 1;
    hasMoreContent.value = true;
    allContent.value = [];
    loadContent(1);
  }
});

watch(() => locale.value, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentPage.value = 1;
  allContent.value = [];
  loadContent(1);
  setSeoMeta();
});

// 输入框回填完做同款来源后，停在推荐列表这一屏
// 输入框吸底时的高度（收起 / 展开不一样），垫到列表底部，别挡住最后一排
const composerHeight = ref(0);

function handleMakeSourceApplied() {
  scrollToFeed();
}

onMounted(async () => {
  // 带着做同款/做视频/做续集的来源进来时，落地不滚顶部（输入框回填完会停在推荐列表）；
  // 来源在输入框组件里消费，这里只先探一下，好知道要不要滚回顶部。
  const queryParams = new URLSearchParams(window.location.search);
  const arrivedWithMakeSource = !!(
    queryParams.get('make') || queryParams.get('session_id')
    || localStorage.getItem('makeVideoData')
    || localStorage.getItem('makeSimilarVideoData')
    || localStorage.getItem('makeSequelData')
  );

  await contentSwitch.ensureLoaded();
  window.addEventListener('scroll', handleScrollToBottom);

  // 初始化语言设置
  await initLanguage();

  nextTick(() => {
    initHeroParts();
    if (!arrivedWithMakeSource) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  });

  // Restore last content tab and content type if coming back from detail page
  try {
    const homeContentTab = localStorage.getItem('homeContentTab');
    if (homeContentTab && (homeContentTab == 'suggested' || homeContentTab == 'following' || homeContentTab == 'subscriptions')) {
      activeContentTab.value = homeContentTab;
      localStorage.removeItem('homeContentTab');

      // If coming from following or subscriptions tab, force content view mode
      if (homeContentTab == 'following' || homeContentTab == 'subscriptions') {
        viewMode.value = 'content';
      }
    }

    const homeContentType = localStorage.getItem('homeContentType');
    if (homeContentType !== null) {
      const contentTypeNum = parseInt(homeContentType, 10);
      // 只认当前还显示着的类型，漫画/小说隐藏后旧缓存值会让页面停在看不见的筛选上
      if (!isNaN(contentTypeNum) && contentTypes.value.some((tp) => tp.id === contentTypeNum)) {
        activeContentType.value = contentTypeNum;
      }
      localStorage.removeItem('homeContentType');
    }
  } catch (error) {
    console.error('Error loading last content tab or type:', error);
  }

  loadContent(1);

  window.addEventListener('resize', handleResize);

  checkFirstRegister();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScrollToBottom);
});

</script>

<style lang="scss" scoped>
@use '@/scss/Home.scss';
</style>
