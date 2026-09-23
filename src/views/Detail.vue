<template>
  <div class="detail-view">
    <div class="" v-if="!isNovelType">
      <div class="close-page-btn" @click="closePage()">
        <span></span>
      </div>

      <!-- 上 / 下一个作品切换时不弹全屏加载遮罩：滑动本身就是加载反馈，遮罩会把动效整个盖住 -->
      <UploadMask :visible="isLoading && !slideLoading" :text="loadText"></UploadMask>

      <div class="main-container" :class="{ 'isRightPanelHidden': isRightPanelHidden }">
        <div class="left-panel" :class="{ 'scroll-panel': detail?.type == '1' || detail?.type == '3' || detail?.type == '5', 'type-1': detail?.type == '1', 'swipe-nav': isStandaloneType && !isCollectionMode, 'composer-open': composerOpen, 'composer-overlay': composerOpen && isOverlayComposerType }" :style="composerOpen ? { '--composer-h': composerHeight + 'px' } : undefined" @wheel="handleLeftPanelWheel" @pointerdown="handleLeftPanelPointerDown">
          <div class="media-container" :key="detail?.id || 'loading'">
            <template v-if="isCollectionMode">
              <!-- Image content -->
              <div v-if="detail.type == '1'" class="comic-gallery">
                <div class="comic-scroll" ref="comicScrollRef" @scroll="handleComicScroll">
                  <!-- 敏感内容：整个图片区域显示开启面板 -->
                  <SensitiveNsfwPanel
                    v-if="isSensitiveContentLocked"
                    :isTeenager="detail.is_teenager == 1"
                    :isChina="isChinaRegion"
                    @enable="enableSensitiveBrowsing"
                    @confirm-adult="confirmAdultBrowsing"
                  />

                  <template v-else-if="!isLoading">
                    <div
                        class="comic-image-wrap"
                        v-for="(img, index) in detail.images"
                        :key="index"
                        @click="toggleComicZoom(index)"
                        :style="{ cursor: (isComicFullscreen[index] || false) ? 'zoom-out' : 'zoom-in' }"
                        @mousedown.prevent
                      >
                        <img :src="processImageUrl(img.image_url)" alt="" class="comic-image" draggable="false" @load="onImageLoaded(detail.images.length)" />
                      </div>

                    <div class="locked-view" v-if="detail.permission == 'partial' && !detail.isSubscribed && detail.author?.id !== uid">
                      <div class="lock-tip">
                        <span>{{ t("detail.lock.tip") }}</span>
                        <span class="subs-btn" @click="onSubscribe">
                          {{ t("detail.lock.subscribe") }}
                        </span>
                      </div>
                    </div>

                    <div class="last-chapter-section" v-if="isChapterNavigationLoaded && (bookGenSwitch == '2' || !nextChapterId) && (isImagesLoaded || detail.type !== '1')">
                      <span class="last-chapter-txt">{{ t("detail.lock.lastChapterTip") }}</span>
                      <button class="last-chapter-btn" @click="goToHomePage">{{ t("detail.lock.goGenerate") }}</button>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <div v-if="detail.type == '3' || detail.type == '5'" class="video-wrapper" @mouseenter="isVideoHovered = true" @mouseleave="onVideoMouseLeave">
              <!-- 漫剧（type 3）的「做同款」只放右侧合集信息栏里，左侧视频右上角不再显示 -->
              <div class="make-actions">
                <div class="make-similar-btn" v-if="detail.type == '5' && detail.videoUrl && parseFloat(String(detail.duration)) <= 30" @click.stop="goMakeSimilarVideo()">
                  <img :src="makeIcon" alt="" class="make-icon" />
                  <span>{{ t('home.makeSimilarVideo') }}</span>
                </div>
                <div class="make-similar-btn" v-if="detail.type == '5' && detail.videoUrl" @click.stop="goMakeSequel()">
                  <img src="@/assets/images/base/video.png" alt="" class="make-icon" />
                  <span>{{ t('home.makeSequel') }}</span>
                </div>
              </div>
              <div v-if="!isVideoLocked && !isLoading" @click="togglePlay">
                <div class="video-poster" v-if="isVideoEnded && currentVideoPoster">
                  <img :src="currentVideoPoster" alt="Cover" draggable="false" />
                </div>

                <!-- 首次加载、拖进度条后缓冲、播放中卡顿，都显示转圈 -->
                <div class="video-loading" v-if="isVideoLoading || isVideoBuffering">
                  <div class="loading-spinner"></div>
                </div>

                <video
                  ref="videoRef"
                  class="video-player"
                  :src="currentVideoSrc"
                  :poster="currentVideoPoster"
                  preload="auto"
                  playsinline
                  muted
                  @play="isPlaying = true; isVideoEnded = false"
                  @pause="isPlaying = false"
                  @timeupdate="onTimeUpdate"
                  @loadedmetadata="onLoadedMetadata"
                  @error="onVideoError"
                  @canplay="onCanPlay"
                  @waiting="onVideoWaiting"
                  @seeking="onVideoSeeking"
                  @seeked="onVideoSeeked"
                  @playing="onVideoPlaying"
                  @volumechange="onVolumeChange"
                  @ended="onVideoEnded"
                ></video>

                <div class="subtitle-overlay" v-if="currentSubtitleText && selectedSubtitleLang && !isStandaloneType" v-html="currentSubtitleText.replace(/\n/g, '<br/>')"></div>

                <div class="custom-video-controls" v-show="(isVideoHovered || !isPlaying || isDraggingProgress) && !isVideoLoading" @click.stop>
                  <div ref="progressBarRef" class="progress-bar" @click="onProgressClick" @mousedown="onProgressDragStart">
                    <div class="progress-track">
                      <div class="progress-buffered" :style="{ width: bufferedPercent + '%' }"></div>
                      <div class="progress-filled" :style="{ width: progressPercent() + '%' }"></div>
                    </div>
                  </div>
                  <div class="controls-row">
                    <div class="controls-left">
                      <div class="ctrl-play-btn" @click.stop="togglePlay">
                        <img v-if="!isPlaying" src="@/assets/images/detail/play_icon.png" alt="Play" />
                        <img v-else src="@/assets/images/detail/pause_icon.png" alt="Pause" />
                      </div>
                      <div class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration || 0) }}</div>
                    </div>
                    <div class="controls-right">
                      <div class="subtitle-control" v-if="availableSubtitleLangs.length > 0 && !isStandaloneType" @click.stop="showSubtitleMenu = !showSubtitleMenu">
                          <span class="subtitle-label">{{ t('detail.subtitle') }}：{{ selectedSubtitleLang ? t(subtitleLangMap[selectedSubtitleLang] || '') : t('detail.subtitleNone') }}</span>
                        <svg class="subtitle-arrow" viewBox="0 0 12 12" width="10" height="10"><path d="M3 5l3 3 3-3" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <div class="subtitle-menu" v-show="showSubtitleMenu" @click.stop>
                          <div class="subtitle-option" v-for="lang in subtitleMenuLangs" :key="lang" @click="selectSubtitle(lang)">{{ lang === 'none' ? t('detail.subtitleNone') : t(subtitleLangMap[lang] || '') }}</div>
                        </div>
                      </div>
                       <div class="volume-control" :class="{ 'volume-active': showVolumeSlider || isDraggingVolume }" @mouseenter="showVolumeSlider = true" @mouseleave="onVolumeControlLeave">
                         <div class="volume-slider" @mouseenter="showVolumeSlider = true" @mouseleave="onVolumeSliderLeave">
                           <div ref="volumeTrackRef" class="volume-track" @mousedown="onVolumeDragStart">
                             <div class="volume-filled" :style="{ height: (volume * 100) + '%' }"></div>
                          </div>
                        </div>
                        <div class="volume-btn" @click.stop="toggleMute">
                          <img v-if="volume > 0 && !autoMutedByPolicy" src="@/assets/images/detail/volume.png" alt="Volume" />
                          <svg v-else class="volume-muted-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="white"/><line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
                        </div>
                      </div>
                      <div class="ctrl-fullscreen-btn" @click.stop="togglePageFullscreen">
                        <img v-if="!isPageFullscreen" src="@/assets/images/detail/fullscreen.png" alt="Fullscreen" />
                        <img v-else src="@/assets/images/detail/unfull.png" alt="Exit Fullscreen" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="play-overlay" v-show="!isPlaying && !isVideoLoading && !isVideoBuffering" @click.stop="togglePlay">
                  <img src="@/assets/images/detail/play.png" alt="Play" />
                </div>

              </div>

              <div v-if="isVideoLocked" class="video-lock-overlay">
                <template v-if="isSensitiveContentLocked && !isPaidContentLocked">
                  <SensitiveNsfwPanel
                    :isTeenager="detail.is_teenager == 1"
                    :isChina="isChinaRegion"
                    @enable="enableSensitiveBrowsing"
                    @confirm-adult="confirmAdultBrowsing"
                  />
                </template>
                <!-- 漫剧付费：未订阅且作品设了订阅可见时，给解锁全集的入口 -->
                <template v-else-if="showDramaUnlock">
                  <img class="lock_bg" src="@/assets/images/detail/lock_pic.png" alt="" />
                  <!-- 卡片要盖在背景图上，overlay 是 flex 行，不套一层就会被挤到图右边 -->
                  <div class="drama-unlock-wrap">
                    <DramaUnlockCard
                      :book-id="detail.book_id"
                      :post-id="detail.id"
                      :author-id="detail.author?.id"
                      :price="detail.book_price"
                      :currency="detail.book_currency"
                      :web3-price="detail.book_web3_price"
                      :plan-id="detail.book_plan_id"
                      :blogger-status="authorBloggerStatus"
                      @unlocked="handleDramaUnlocked"
                    />
                  </div>
                </template>
                <template v-else>
                  <img class="lock_bg" src="@/assets/images/detail/lock_pic.png" alt="" />

                  <div class="lock-content">
                    <img class="lock-icon" src="@/assets/images/detail/lock.png" alt="" />
                    <div class="lock-info">
                      <span class="lock-txt">{{ t("detail.lock.tip") }}</span>
                      <span class="lock-txt-secondary">{{ t("detail.lock.unlockOtherWorks") }}</span>
                      <span class="lock-btn" @click="onSubscribe">
                        {{ t("detail.lock.subscribe") }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <template v-else-if="detail.type == '4' && !isCollectionMode">
              <SensitiveNsfwPanel
                v-if="isSensitiveContentLocked"
                class="nsfw-panel-full"
                :isTeenager="detail.is_teenager == 1"
                :isChina="isChinaRegion"
                @enable="enableSensitiveBrowsing"
                @confirm-adult="confirmAdultBrowsing"
              />

              <div v-else class="image-carousel" ref="imageStackRef" :style="{ cursor: isImageFullscreen ? 'zoom-out' : 'zoom-in' }">
                <div class="make-action-group">
                  <!-- 图片作品每张图各有各的 session（发布时按 "session|url" 提交），做同款按当前这张的来，
                       不看帖子级 session_id（图片帖那个字段基本是空的，按它判断按钮永远不出现） -->
                  <div class="make-similar-btn" v-if="detail.images?.[currentImageIndex]?.session_id" @click.stop="goMakeSimilar(detail.images[currentImageIndex].session_id!)">
                    <img :src="makeIcon" alt="" class="make-icon" />
                    <span>{{ t('home.makeSimilar') }}</span>
                  </div>
                  <div class="make-video-btn" v-if="detail.images?.[currentImageIndex]?.image_url" @click.stop="!isMakeVideoLoading && goMakeVideo()">
                    <img src="@/assets/images/base/video.png" alt="" class="make-icon" />
                    <span>{{ t('home.makeVideo') }}</span>
                  </div>
                </div>

                <template v-if="!isLoading">
                  <div class="carousel-arrow carousel-arrow-left" v-if="currentImageIndex > 0" @click.stop="prevImage()">
                    <svg viewBox="0 0 24 24" width="28" height="28"><path d="M15 6l-6 6 6 6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>

                  <div class="carousel-content" ref="galleryContentRef">
                    <div
                      class="carousel-slide"
                      v-for="(img, index) in detail.images"
                      :key="index"
                    >
                      <template v-if="isImageLocked(index)">
                        <div class="locked-view">
                          <div class="lock-tip">
                            <span>{{ t("detail.lock.tip") }}</span>
                            <span class="lock-txt-secondary">{{ t("detail.lock.unlockOtherWorks") }}</span>
                            <span class="subs-btn" @click="onSubscribe">
                              {{ t("detail.lock.subscribe") }}
                            </span>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div
                          class="image-wrap"
                          @click="handleImageClick(index)"
                          @mousedown.prevent
                        >
                          <img
                            class="stacked-image"
                            :src="processImageUrl(img.image_url) || ''"
                            alt=""
                            draggable="false"
                            @load="onImageLoaded(detail.images.length)"
                          />
                        </div>

                        <div class="locked-view" v-if="detail.permission == 'partial' && !detail.isSubscribed && detail.author?.id !== uid">
                          <div class="lock-tip">
                            <span>{{ t("detail.lock.tip") }}</span>
                            <span class="lock-txt-secondary">{{ t("detail.lock.unlockOtherWorks") }}</span>
                            <span class="subs-btn" @click="onSubscribe">
                              {{ t("detail.lock.subscribe") }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <div class="carousel-arrow carousel-arrow-right" v-if="currentImageIndex < (detail.images?.length || 0) - 1" @click.stop="nextImage()">
                    <svg viewBox="0 0 24 24" width="28" height="28"><path d="M9 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>

                  <div class="carousel-dots" v-if="(detail.images?.length || 0) > 1">
                    <span
                      class="carousel-dot"
                      :class="{ active: currentImageIndex === index }"
                      v-for="(img, index) in detail.images"
                      :key="index"
                      @click="goToImage(index)"
                    ></span>
                  </div>

                  <div class="last-chapter-section" v-if="isChapterNavigationLoaded && (bookGenSwitch == '2' || !nextChapterId) && isImagesLoaded">
                    <span class="last-chapter-txt">{{ t("detail.lock.lastChapterTip") }}</span>
                    <button class="last-chapter-btn" @click="goToHomePage">{{ t("detail.lock.goGenerate") }}</button>
                  </div>
                </template>
              </div>
            </template>

            <template v-else-if="detail.type == '1' && !isCollectionMode">
              <!-- 敏感内容：面板独立于 image-stack，占满整个区域 -->
              <SensitiveNsfwPanel
                v-if="isSensitiveContentLocked"
                class="nsfw-panel-full"
                :isTeenager="detail.is_teenager == 1"
                :isChina="isChinaRegion"
                @enable="enableSensitiveBrowsing"
                @confirm-adult="confirmAdultBrowsing"
              />

              <div v-else class="image-stack" ref="imageStackRef" @scroll="handleImageStackScroll" :style="{ cursor: isImageFullscreen ? 'zoom-out' : 'zoom-in' }">
                <template v-if="!isLoading">
                  <div
                    class="image-stack-item"
                    v-for="(img, index) in detail.images"
                    :key="index"
                  >
                    <template v-if="isImageLocked(index)">
                      <div class="locked-view">
                        <div class="lock-tip">
                          <span>{{ t("detail.lock.tip") }}</span>
                          <span class="lock-txt-secondary">{{ t("detail.lock.unlockOtherWorks") }}</span>
                          <span class="subs-btn" @click="onSubscribe">
                            {{ t("detail.lock.subscribe") }}
                          </span>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div
                        class="image-wrap"
                        @click="handleImageClick(index)"
                        @mousedown.prevent
                      >
                        <img
                          class="stacked-image"
                          :src="processImageUrl(img.image_url) || ''"
                          alt=""
                          draggable="false"
                          @load="onImageLoaded(detail.images.length)"
                        />
                      </div>

                      <div class="locked-view" v-if="detail.permission == 'partial' && !detail.isSubscribed && detail.author?.id !== uid">
                        <div class="lock-tip">
                          <span>{{ t("detail.lock.tip") }}</span>
                          <span class="lock-txt-secondary">{{ t("detail.lock.unlockOtherWorks") }}</span>
                          <span class="subs-btn" @click="onSubscribe">
                            {{ t("detail.lock.subscribe") }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </div>

                  <div class="last-chapter-section" v-if="isChapterNavigationLoaded && (bookGenSwitch == '2' || !nextChapterId) && (isImagesLoaded || detail.type != '1')">
                    <span class="last-chapter-txt">{{ t("detail.lock.lastChapterTip") }}</span>
                    <button class="last-chapter-btn" @click="goToHomePage">{{ t("detail.lock.goGenerate") }}</button>
                  </div>
                </template>
              </div>
            </template>

            <!-- Collection Info Bar -->
            <div
              class="collection-info-bar"
              v-if="detail.book_id != '' && Number(detail.book_id) > 0 && !isCollectionMode && !isSensitiveContentLocked && !isStandaloneType"
            >

              <div class="collection-info" @click="enterCurrentChapter">
                <template v-if="detail.type == '1' || detail.type == '3'">
                  <span class="comic-title">{{ detail.title }}</span>
                </template>
                <template v-else>
                  {{ t('detail.collection') }}:{{ detail.book_title }}
                </template>
              </div>
              <div class="collection-line" @click="enterCurrentChapter"></div>
              <div class="collection-status" @click="enterCurrentChapter">
                <template v-if="detail.latest_read_chapter_index && Number(detail.latest_read_chapter_index) > 0">
                  {{ t('detail.readToEpisode', { count: detail.latest_read_chapter_index }) }}
                </template>
                <template v-else>
                  {{ t('detail.updatedToEpisode', { count: chapterCount }) }}
                </template>
              </div>
              <div class="collection-action" @click="enterNextOrCurrentChapter" v-if="detail.latest_read_chapter_index && Number(detail.latest_read_chapter_index) > 0">
                {{ t('detail.continueReading') }}
              </div>
              <div class="collection-action" @click="goToNextChapter" v-if="!detail.latest_read_chapter_index || Number(detail.latest_read_chapter_index) == 0" v-show="nextChapterId">
                {{ t('detail.nextEpisode') }}
              </div>
            </div>

            <!-- Collection Mode Info Bar -->
            <div class="collection-mode-bar" v-else-if="detail.book_id !== '' && Number(detail.book_id) > 0 && isCollectionMode && !isStandaloneType">
              <div class="current-episode">
                <!-- <span class="episode-number">第{{ currentCollectionIndex + 1 }}集</span>
                <span class="episode-line"></span> -->
                <span class="episode-title">{{ currentCollection?.title }}</span>
              </div>
            </div>
          </div>

          <!-- 合集模式（type 1 / 3）不显示右侧上下箭头，换集走右栏的合集列表和「下一集」按钮 -->

          <!-- 上一个 / 下一个作品只走这两个按钮。滚轮、上下拖、方向键的切换都关了：
               看图 / 看视频时手一滑就换了作品，误触太多（handleLeftPanelWheel /
               handleLeftPanelPointerDown / handleKeyDown 里各自直接 return）。
               图片 / 视频（type 4、5）锚在左栏底部（at-bottom），其余类型垂直居中 -->
          <div class="nav-arrows" :class="{ 'at-bottom': isStandaloneType }" v-if="!isCollectionMode">
            <button class="nav-btn up" @click="goPrev" v-if="!isFirst"></button>
            <button class="nav-btn down" @click="goNext" v-if="!isLast"></button>
          </div>

          <!-- 做同款 / 做续集：漫剧、图片、视频（type 3/4/5）把媒体顶上去，
               输入框排在左侧区域底部居中；全屏时不显示 -->
          <div class="detail-composer" v-if="isPanelComposerType" v-show="composerOpen">
            <PromptComposer
              ref="composerRef"
              placement="panel"
              closable
              @active-change="composerActive = $event"
              @height-change="composerHeight = $event"
              @loading-change="composerLoading = $event"
              @media-modal-open="pauseForComposerModal"
              @media-modal-close="resumeAfterComposerModal"
            />
          </div>
        </div>

        <!-- Right Side: Info & Comments -->
        <div class="right-panel" v-show="!isRightPanelHidden">
          <!-- Right Header: User Info & Actions -->
          <div class="right-header-box" :class="{ 'with-border': isScrolled }">
            <div class="right-header">
              <div class="user-info" @click="navigateToUserHome">
                <img class="avatar" :src="detail.author?.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                <span class="nickname">{{ detail.author?.nickname }}</span>
              </div>

              <div class="right-header-actions">
                <div v-if="detail.author?.id != uid">
                  <button
                    class="follow-btn"
                    :class="{ followed: detail.isFollowed }"
                    @click="toggleFollow"
                  >
                    <img v-if="!detail.isFollowed" src="@/assets/images/detail/follow.png" alt="" />
                    <span class="btn-text">{{ detail.isFollowed ? t("detail.following") : t("detail.follow") }}</span>
                    <span class="hover-text" v-if="detail.isFollowed">{{ t("detail.unfollow") }}</span>
                  </button>
                </div>
                <div class="close-right-panel-btn" v-if="isPageFullscreen && isCollectionMode" @click="closeRightPanel">
                  <img src="@/assets/images/detail/close.png" alt="Close" />
                </div>
              </div>
            </div>

            <!-- Tab Bar -->
            <div class="tab-bar">
              <div
                class="tab-item"
                :class="{ active: activeTab == 'detail' }"
                @click="activeTab = 'detail'"
              >
                {{ t('detail.detail') }}
              </div>
              <div
                class="tab-item"
                :class="{ active: activeTab == 'collection' }"
                @click="openCollectionTab()"
                v-if="detail.book_id && Number(detail.book_id) > 0 && !isStandaloneType"
              >
                {{ t('detail.collection') }}
              </div>
            </div>

          </div>

          <!-- Collection Info Bar (only shows in collection tab) -->
          <div class="collection-info-section" v-if="activeTab == 'collection' && detail.book_id !== '' && Number(detail.book_id) > 0 && !isStandaloneType">
            <div class="collection-info-row">
              <div class="collection-title">{{ detail.book_title }}</div>
            </div>
            <div class="collection-chapters-count">
              <span>{{ t('detail.updatedChapters', { count: chapterCount }) }}</span>

              <div class="collection-link" @click="goToCollectionDetail">
                {{ t('detail.viewCollectionInfo') }}
              </div>
              <div class="make-similar-wrap" v-if="detail.session_id && detail.type != '5'">
                <div class="make-similar-btn" @click.stop="goMakeSimilar(detail.session_id)">
                  <img :src="makeIcon" alt="" class="make-icon" />
                  <span>{{ t('home.makeSimilar') }}</span>
                </div>
              </div>
              <div class="make-similar-wrap" v-if="detail.type == '5' && detail.videoUrl && parseFloat(String(detail.duration)) <= 30">
                <div class="make-similar-btn" @click.stop="goMakeSimilarVideo()">
                  <img :src="makeIcon" alt="" class="make-icon" />
                  <span>{{ t('home.makeSimilarVideo') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="scroll-content" ref="scrollContentRef" @scroll="handleScroll" v-if="activeTab == 'detail'">
            <!-- Scrollable Content Area -->
            <div>
              <!-- Standard Content Mode (Video/Image) -->
              <div class="post-info">
                <div class="header-actions" v-if='detail.permission == "partial"'>
                  <div class="perm-tag">{{ permText }}</div>
                </div>
                <h1 class="post-title">{{ detail.title }}</h1>
                <p class="post-desc" v-html="formatContent(detail.description)"></p>

                <div class="post-time-box">
                  <span class="post-time">{{ detail.time }}</span>

                  <div class="more-menu-wrap" ref="headerMoreRef" v-if="detail.author?.id != uid">
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
                  <div v-if="comments.length > 0 && !isLoadingComments" class="comment-item" v-for="c in comments" :key="c.id" :data-comment-id="c.id">
                    <div class="comment-main" :style="{ backgroundColor: c.backgroundColor }">
                      <img class="c-avatar" :src="c.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                      <div class="c-content">
                        <div class="c-header">
                          <span class="c-author">{{ c.author }}</span>
                          <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, c.id)">
                            <button class="c-more-btn" @click.stop="toggleCommentMore(c.id)">
                              <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                            </button>
                            <div class="dropdown-menu" v-if="activeCommentMoreId == c.id">
                              <span class="menu-item" v-if="c.user_id == uid" @click="deleteComment(c.id)">
                                {{ t("detail.delete") }}
                              </span>
                              <span class="menu-item" v-else @click="openReportModal('comment', c.id)">
                                {{ t("detail.report") }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="c-text hidden" v-if="c.is_blacked == 1">
                          <img src="@/assets/images/home/intro.png" alt="" class="hidden-icon" />
                          <span>{{ t("detail.commentHidden") }}</span>
                        </div>
                        <p class="c-text" v-else v-html="formatContent(c.content_replace || c.text || c.content)"></p>

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
                    controlslist="nodownload noremoteplayback noplaybackrate nofullscreen"
                                disablePictureInPicture
                                @click="toggleCommentVideoPlay"
                                @play="onCommentVideoPlay"
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
                          <span class="c-time">{{ formatTimestamp(c.created_at) }}</span>
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
                      <div class="reply-item" v-for="r in c.replies" :key="r.id" :style="{ backgroundColor: r.backgroundColor }">
                        <img class="c-avatar" :src="r.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                        <div class="c-content">
                          <div class="c-header">
                            <div class="author-wrap">
                              <span class="c-author">{{ r.author }}</span>
                              <span class="reply-to" v-if="r.reply_to_user_nickname">@{{ r.reply_to_user_nickname }}</span>
                            </div>
                            <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, r.id)">
                              <button class="c-more-btn" @click.stop="toggleCommentMore(r.id)">
                                <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                              </button>
                              <div class="dropdown-menu" v-if="activeCommentMoreId == r.id">
                                <span class="menu-item" v-if="r.user_id == uid" @click="deleteComment(r.id, true)">
                                  {{ t("detail.delete") }}
                                </span>
                                <span class="menu-item" v-else @click="openReportModal('reply', r.id)">
                                  {{ t("detail.report") }}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p class="c-text" v-html="formatContent(r.content_replace || r.text || r.content)"></p>

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
                    controlslist="nodownload noremoteplayback noplaybackrate nofullscreen"
                              @click="toggleCommentVideoPlay"
                              @play="onCommentVideoPlay"
                            ></video>
                          </div>
                        </div>

                        <div class="c-footer">
                          <span class="c-time">{{ formatTimestamp(r.created_at) }}</span>
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
                  <div class="icon-action footer-collect" :class="{ active: isFav }" @click="toggleFav">
                    <b></b>
                    <span>{{ formatNumber(favNum) }}</span>
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
                      <!-- <div class="item-right">
                        <span class="stats">
                          {{ dropdownType === '#' ? `${item.views} views` : `${item.followers} followers` }}
                        </span>
                      </div> -->
                    </div>
                  </div>
                </div>
              </div>

              <!-- File Inputs (Hidden) -->
              <input
                ref="imageInputRef"
                type="file"
                accept="image/*"
                class="hidden-file-input"
                @change="handleFileUpload"
              />
              <input
                ref="videoInputRef"
                type="file"
                accept="video/mp4,video/quicktime"
                class="hidden-file-input"
                @change="handleFileUpload"
              />
            </div>
          </div>

          <!-- Collection Tab Content -->
          <div v-else-if="activeTab === 'collection' && !isStandaloneType">
            <div class="collection-list" ref="collectionListRef" @scroll="handleCollectionScroll">
              <!-- Loading State -->
              <div v-if="isLoadingCollections" class="loading-more">
                <div class="loading-spinner"></div>
                <p>{{ t('detail.loadingCollections') }}</p>
              </div>

              <!-- Empty State -->
              <EmptyState v-if="collections.length === 0 && !isLoadingCollections" class="empty-with-padding"></EmptyState>

              <!-- Collections List -->
              <div v-if="collections.length > 0 && !isLoadingCollections"
                  class="collection-item"
                  v-for="(item, index) in collections"
                  :key="item.post_id"
                  :class="{ 'active': item.post_id == detail.id }"
                  @click="playCollectionItem(item)">
                <div class="collection-content">
                  <div class="collection-cover-wrapper" :class="{ 'playing': isCollectionItemPlaying(index) }">
                    <img class="collection-cover" :src="processImageUrl(item.cover) || ''" alt="" />
                    <div class="collection-subscribe-badge" v-if="item.access_rights == '2' && detail.author && detail.author.id !== uid">{{ t(detail.type == '3' ? 'detail.paid' : 'detail.subscribe') }}</div>
                    <div class="collection-duration" v-if="item.type == '3' && item.duration && !isCollectionItemPlaying(index)">
                      {{ item.duration }}
                    </div>
                    <div class="collection-playing-overlay" v-if="isCollectionItemPlaying(index)">
                      <div class="playing-icon">
                        <img v-if="item.type == '3'" src="@/assets/images/detail/c_play.png" alt="Playing" />
                        <img v-else src="@/assets/images/detail/reading.png" alt="Reading" />
                      </div>
                      <div class="playing-text">{{ item.type == '3' ? t('detail.playing') : t('detail.reading') }}</div>
                    </div>
                  </div>
                  <div class="collection-info" :class="item.access_rights == '2' ? 'on' : ''">
                    <div class="collection-title">{{ item.title }}</div>
                    <div class="collection-stats">
                      <div class="collection-views" :class="{ 'active': item.liked }" @click.stop="toggleCollectionLike(item)">
                        <b></b>
                        <span>{{ formatNumber(item.likes) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading More Collections -->
              <div v-if="loadingMoreCollections" class="loading-more">
                <div class="loading-spinner"></div>
                <p>{{ t('detail.loadingCollections') }}</p>
              </div>

              <!-- No More Collections -->
              <div v-if="!isLoadingCollections && !loadingMoreCollections && collections.length > 0 && !hasMoreCollections" class="no-more">
                {{ t('detail.noMoreCollections') }}
              </div>

              <!-- 触底加载哨兵（页面/容器任意滚动都可触发下一页） -->
              <div ref="collectionSentinelRef" class="collection-sentinel"></div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-else-if="isNovelType">
      <NovelDetail
        :content-type="contentType"
        :show-nsfw="showNsfw"
      ></NovelDetail>
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

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      :visible="deleteModalVisible"
      @close="handleDeleteCancel"
      @confirm="handleDeleteConfirm"
    />

    <!-- Sensitive Content Modals -->
    <SensitiveContentAdultConfirmModal
      v-if="showSensitiveContentAdultConfirmModal"
      @close="showSensitiveContentAdultConfirmModal = false"
      @confirm="handleSensitiveContentAgeConfirm"
    />
    <SensitiveContentConfirmModal
      v-if="showSensitiveContentConfirmModal"
      :hideDontAsk="true"
      @close="showSensitiveContentConfirmModal = false"
      @confirm="confirmSensitiveContent"
    />

    <MakeSequelSubscribeModal
      :visible="showMakeSequelSubscribeModal"
      @go-subscribe="goMakeSequelSubscribe"
      @close="showMakeSequelSubscribeModal = false"
    />
    <UploadMask :visible="isMakeSequelLoading" :text="t('home.loading')" />
    <UploadMask :visible="isMakeVideoLoading" :text="t('home.loading')" />
    <!-- 做同款 / 做续集：在本页底部展开输入框，不再跳首页 -->
    <!-- 小说 / 漫画：输入框固定在视口底部即可 -->
    <PromptComposer
      v-if="!isPanelComposerType"
      ref="composerRef"
      placement="bottom"
      closable
      @active-change="composerActive = $event"
      @media-modal-open="pauseForComposerModal"
      @media-modal-close="resumeAfterComposerModal"
    />
    <!-- 做同款 / 做续集的来源数据请求中 -->
    <UploadMask :visible="composerLoading" :text="t('home.loading')" />
  </div>
</template>

<script setup lang="ts" name="Detail">
import PromptComposer from '@/components/PromptComposer.vue';
import NovelDetail from "@/views/NovelDetail.vue"
import ReportModal from "@/components/ReportModal.vue";
import MakeSequelSubscribeModal from "@/components/MakeSequelSubscribeModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import PreviewBig from "@/components/PreviewBig.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";
import SensitiveContentAdultConfirmModal from "@/components/SensitiveContentAdultConfirmModal.vue";
import SensitiveContentConfirmModal from "@/components/SensitiveContentConfirmModal.vue";
import SensitiveNsfwPanel from "@/components/SensitiveNsfwPanel.vue";
import DramaUnlockCard from "@/components/DramaUnlockCard.vue";

import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { pageSlideDir } from '@/util/pageSlide';
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { pickPlan } from "@/util/bookRechargePlan";
import { formatTimestamp, initLanguage, processImageUrl } from "@/util/utils";
import collapseIcon from "@/assets/images/detail/show.png";
import expandIcon from "@/assets/images/detail/hide.png";
import api from "@/api/index";
import { useContentSwitchStore } from "@/stores/contentSwitch";

const composerRef = ref<InstanceType<typeof PromptComposer> | null>(null);
// 输入框是否已经被做同款 / 做续集唤出
const composerActive = ref(false);
// 来源数据请求中：输入框先不显示，接口回来才露出
const composerLoading = ref(false);
// 输入框当前高度，漫画类型要靠它把章节条抬到输入框上面
const composerHeight = ref(0);
// 漫剧 / 图片 / 视频：输入框排进左侧区域底部，把媒体顶上去
// 漫画（type 1）是整页滚动的长图，顶不动，改成浮在左侧区域底部
const isPanelComposerType = computed(() => ['1', '3', '4', '5'].includes(String(detail.value?.type ?? '')));
const isOverlayComposerType = computed(() => String(detail.value?.type ?? '') === '1');
// 全屏下不显示输入框，媒体也要恢复满高
const composerOpen = computed(() => composerActive.value && isPanelComposerType.value && !isPageFullscreen.value);
import EmptyState from "@/components/EmptyState.vue";
import { baseUrl } from "@/util/config";
import { uploadVideoFile, PartUploadError } from "@/util/uploadVideo";
import defaultAvatar from "@/assets/images/base/avatar.png";
import makeIcon from "@/assets/images/base/make.png";
import videoIcon from "@/assets/images/home/video_icon.png";
import { trackShare } from "@/utils/analytics";

const { t, locale } = useI18n();

function getI18nMsg(res: any) {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: 'msg_cn', jp: 'msg_jp', tc: 'msg_tc' };
  const key = msgMap[lang];
  return (key && res?.[key]) || res?.msg || t('fail');
}

const route = useRoute();
const router = useRouter();

// --- State ---
const id = ref<number>(Number(route.query.id));
const contentType = ref<string>(route.query.tab as string || route.query.contentType as string || "");
const isNovelType = computed(() => contentType.value === '2' || contentType.value === 'novel' || detail.value.type === '2');
const isStandaloneType = computed(() => detail.value.type === '4' || detail.value.type === '5');
const isPlaying = ref(false);
const isVideoEnded = ref(false);
const isVideoLoading = ref(true);
const videoRef = ref<HTMLVideoElement | null>(null);
const isLoading = ref(false);
const loadText = ref(t('userHome.loading'));
const isVideoBuffering = ref(false);
// 是否已完成首次自动播放（首次自动播放需静音以符合浏览器策略，之后应保留用户的音量设置）
const hasAutoPlayed = ref(false);

// Fullscreen state
const isPageFullscreen = ref(false);
const isRightPanelHidden = ref(false);
const userClosedRightPanel = ref(false);

// --- New State for Image/Article ---
const currentImageIndex = ref(0);
const showLargeViewer = ref(false);
const showBigViewer = ref(false);
const isArticleExpanded = ref(false);
const zoomLevel = ref(100);

// Comic State
const hoveredComicIndex = ref(-1);
const isComicFullscreen = ref<{ [key: number]: boolean }>({});
const comicScrollRef = ref<HTMLElement | null>(null);
const imageStackRef = ref<HTMLElement | null>(null);
const isNearBottom = ref(false);

// Video State
const currentTime = ref(0);
const duration = ref(0);
const isDraggingProgress = ref(false);
const progressBarRef = ref<HTMLElement | null>(null);
const bufferedPercent = ref(0);
const subtitles = ref<{ lang: string; url: string }[]>([]);
// 当前这份字幕是哪一集的。合集里切集要靠它判断需不需要重新拉
const subtitlesPostId = ref('');
const selectedSubtitleLang = ref<string>('');
const showSubtitleMenu = ref(false);
const subtitleCues = ref<{ start: number; end: number; text: string }[]>([]);
const currentSubtitleText = ref('');

const subtitleLangMap: Record<string, string> = { cn: 'novel.language.zh', tc: 'novel.language.tc', jp: 'novel.language.jp', en: 'novel.language.en' };

// 字幕语言的固定顺序。既是下拉项的排列顺序（后端返回顺序不保证稳定，
// 排一下菜单才不会每次进来都跳），也是「导航语言没有对应字幕」时的兜底优先级：
// 英语 -> 日语 -> 中文简体 -> 中文繁体。
const SUBTITLE_LANG_ORDER = ['en', 'jp', 'cn', 'tc'];


// 已经选了某个语言时，下拉项按漫剧自身的语言排（作品自身的语言本来就不在列表里）。
// 认不出作品语言就退回 SUBTITLE_LANG_ORDER。
const SUBTITLE_MENU_ORDER: Record<string, string[]> = {
  cn: ['jp', 'en', 'tc'],
  tc: ['jp', 'en', 'cn'],
  jp: ['en', 'tc', 'cn'],
  en: ['jp', 'tc', 'cn'],
};

/** 导航语言换算成后端的字幕语言码（后端把简体叫 cn，导航里叫 zh） */
function navSubtitleLang(): string {
  return locale.value == 'zh' ? 'cn' : locale.value == 'tc' ? 'tc' : locale.value == 'jp' ? 'jp' : 'en';
}

/** 合集的解锁价格。取不到或是 0 就当这个合集没设收费档 */
const dramaUnlockPrice = computed(() => {
  const raw = detail.value?.book_price;
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

/**
 * 漫剧解锁全集的入口。条件都满足才给：
 * 漫剧类型、作品设了订阅可见且当前被锁、自己没订阅过、不是作者本人。
 * 不看价格：价格取不到时卡片内部自己不渲染。
 */
const showDramaUnlock = computed(
  () => detail.value?.type == '3'
    && isPaidContentLocked.value
    && !detail.value?.isSubscribed
    && detail.value?.author?.id !== uid
    // 已经买过整个合集的不再给解锁入口（这时 isPaidContentLocked 本来也是 false）
    && !hasBoughtBook.value,
);

/** 解锁成功后重新拉一遍详情，锁自然就开了 */
function handleDramaUnlocked() {
  fetchDetail(Number(detail.value?.id ?? id.value));
}

// 真正能选的字幕语言：后端返回了哪些就有哪些，去掉作品自身的语言（漫剧是中文简体
// 就不给简体字幕）和认不出来的语言码，再按固定顺序排。
// 这个数组为空 = 一条字幕都没有 = 整个开关不显示。
const availableSubtitleLangs = computed(() => {
  const ownLang = detail.value?.language || '';
  const langs = subtitles.value
    .map(s => s.lang)
    .filter(l => !!subtitleLangMap[l] && l !== ownLang);
  return SUBTITLE_LANG_ORDER.filter(l => langs.includes(l));
});

/** 默认字幕：和导航语言一致的优先，没有就按 SUBTITLE_LANG_ORDER 取第一个能用的 */
function pickDefaultSubtitleLang(): string {
  const langs = availableSubtitleLangs.value;
  if (!langs.length) return '';
  const nav = navSubtitleLang();
  return langs.includes(nav) ? nav : langs[0];
}

/** 字幕列表就位后统一走这里：记下是哪一集的，并挑出默认选中项 */
function applySubtitleList(list: any, postId: number | string) {
  subtitles.value = Array.isArray(list) ? list : [];
  subtitlesPostId.value = String(postId || '');
  selectedSubtitleLang.value = pickDefaultSubtitleLang();
}

async function loadSubtitleCues() {
  subtitleCues.value = [];
  currentSubtitleText.value = '';
  const rawUrl = subtitleTrackUrl.value;
  if (!rawUrl) return;
  try {
    const res = await fetch(rawUrl, { cache: 'no-cache' });
    if (!res.ok) return;
    const text = await res.text();
    subtitleCues.value = parseVTT(text);
  } catch {
    subtitleCues.value = [];
  }
}

const subtitleTrackUrl = computed(() => {
  if (!selectedSubtitleLang.value) return '';
  const sub = subtitles.value.find(s => s.lang == selectedSubtitleLang.value);
  return sub?.url || '';
});

function selectSubtitle(lang: string) {
  selectedSubtitleLang.value = lang == 'none' ? '' : lang;
  showSubtitleMenu.value = false;
  loadSubtitleCues();
}

function parseVTT(text: string): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const blocks = text.replace(/\r\n/g, '\n').split('\n\n');
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) { timeLineIdx = i; break; }
    }
    if (timeLineIdx === -1) continue;
    const match = lines[timeLineIdx].match(/(\d{0,2}:?\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{0,2}:?\d{2}:\d{2}\.\d{3})/);
    if (!match) continue;
    const parseTime = (t: string) => {
      const parts = t.split(':');
      if (parts.length === 3) {
        return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
      }
      return Number(parts[0]) * 60 + Number(parts[1]);
    };
    const start = parseTime(match[1]);
    const end = parseTime(match[2]);
    const txt = lines.slice(timeLineIdx + 1).join('\n');
    if (txt.trim()) cues.push({ start, end, text: txt.trim() });
  }
  return cues;
}

watch(subtitleTrackUrl, () => {
  loadSubtitleCues();
}, { immediate: true });

function updateCurrentSubtitle() {
  if (!subtitleCues.value.length || !currentTime.value) {
    currentSubtitleText.value = '';
    return;
  }
  const t = currentTime.value;
  const cue = subtitleCues.value.find(c => t >= c.start && t <= c.end);
  currentSubtitleText.value = cue?.text || '';
}

// 单选菜单。「无」固定排在最前且一直在（随时可以关字幕），后面的语言分两种排法：
//   当前是「无」        -> 英语 -> 日语 -> 中文简体 -> 中文繁体
//   当前选了某个语言    -> 按漫剧自身语言定的顺序（SUBTITLE_MENU_ORDER），且不列出当前选中的那个
const subtitleMenuLangs = computed(() => {
  const available = availableSubtitleLangs.value;
  if (!selectedSubtitleLang.value) return ['none', ...available];

  const order = SUBTITLE_MENU_ORDER[detail.value?.language || ''] || SUBTITLE_LANG_ORDER;
  const langs = order.filter(l => available.includes(l) && l !== selectedSubtitleLang.value);
  return ['none', ...langs];
});

const isDraggingVolume = ref(false);
const volumeTrackRef = ref<HTMLElement | null>(null);
const isVideoHovered = ref(false);
const showVolumeSlider = ref(false);
const volumeSliderTimer = ref<ReturnType<typeof setTimeout> | null>(null);

function scheduleVolumeSliderClose() {
  if (volumeSliderTimer.value) {
    clearTimeout(volumeSliderTimer.value);
  }
  volumeSliderTimer.value = setTimeout(() => {
    showVolumeSlider.value = false;
  }, 3000);
}

function onVideoMouseLeave() {
  if (isDraggingProgress.value || isDraggingVolume.value) return;
  isVideoHovered.value = false;
  showVolumeSlider.value = false;
}

function onVolumeControlLeave() {
  if (isDraggingVolume.value) return;
  showVolumeSlider.value = false;
}

function onVolumeSliderLeave() {
  if (isDraggingVolume.value) return;
  showVolumeSlider.value = false;
}

function progressPercent() {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
}

// 从localStorage中读取音量设置，如果没有则使用默认值0
const savedVolume = localStorage.getItem('videoVolume');
const volume = ref(savedVolume ? parseFloat(savedVolume) : 0);
// 刷新后带声自动播放被浏览器拦截、回退成静音播放时置 true。
// 这时喇叭显示成静音（和视频实际状态一致），缓存的音量值不动；
// 用户点一下喇叭就按缓存音量把声音开回来（有手势了，浏览器允许）。
const autoMutedByPolicy = ref(false);


// Comment Video State
const commentVideoRef = ref<HTMLVideoElement | null>(null);

// Image Fullscreen State
const isImageFullscreen = ref(false);
const hoveredImageIndex = ref(-1);

// Header & Report
const headerMoreVisible = ref(false);
const headerMoreRef = ref<HTMLElement | null>(null);

// Sensitive content modals
const showSensitiveContentAdultConfirmModal = ref(false);
const showSensitiveContentConfirmModal = ref(false);
const pendingChapter = ref<any>(null);
const pendingAction = ref<(() => void) | null>(null);
const isAllowSensitiveContent = ref(true);
const reportModalVisible = ref(false);
const reportTarget = ref<{ type: string; id: number } | null>(null);

// Delete confirm modal
const deleteModalVisible = ref(false);
const commentToDelete = ref<string | null>(null);

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
// 评论区视频的限制。发布页（漫剧 5GB / 视频不限、都是 1 小时）面向的是正片，
// 评论区只是附一段短视频，单独收紧一档，别让人往评论里塞几个 G 的文件。
const COMMENT_VIDEO_EXTENSIONS = ['mp4', 'mov'];
const COMMENT_VIDEO_MAX_SIZE = 200 * 1024 * 1024;
const COMMENT_VIDEO_MAX_DURATION = 5 * 60;

/**
 * 评论视频的格式与大小校验。
 * 时长要等元数据加载完才知道，放在 uploadVideo 里判，不在这里。
 */
function validateCommentVideo(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!COMMENT_VIDEO_EXTENSIONS.includes(ext)) {
    toast(t('detail.videoFormatError'));
    return false;
  }
  if (file.size > COMMENT_VIDEO_MAX_SIZE) {
    toast(t('detail.videoSizeError'));
    return false;
  }
  return true;
}

// Dropdown state for # and @
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<any[]>([]);
const lastRange = ref<Range | null>(null);

// File upload state
const uploadedFiles = ref<any[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const videoUrl = ref('');
const videoSize = ref(0);

// Preview modal state
const showPreviewModal = ref(false);
const previewFile = ref<any>(null);
const previewFiles = ref<any[]>([]);
const currentPreviewIndex = ref(0);
const curVideoUrl = ref('')

const uid = localStorage.getItem('uid');

// 未登录时跳转到注册页，并记录当前作品详情页地址，注册/登录成功后回跳
function goAuth() {
  localStorage.setItem('loginRedirect', route.fullPath);
  router.push('/register');
}

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
  session_id?: string;
}

const largeImage = ref([] as imgItem[])
const bigImage = ref([] as imgItem[])

// Detail Data
interface DetailData {
  id: number;
  author: {
    avatar: string;
    nickname: string;
    id: string;
  };
  isFollowed: boolean;
  time: string;
  title: string;
  description: string;
  type: string;
  videoUrl: string;
  cover: string;
  language: string;
  images: imgItem[];
  articleHtml: string;
  content: string;
  content_replace: string;
  permission: string;
  subscriptionPlans: string[];
  isSubscribed: boolean;
  commentsEnabled: boolean;
  isLast: boolean;
  likes: number;
  liked: boolean;
  favNum: number;
  isFav: boolean;
  is_teenager: number;
  is_nsfw: string;
  /** 漫剧解锁的收费档位。没设置档位时接口给空数组 / 空对象，取不到就不渲染解锁卡片 */
  book_price?: string | number;
  book_currency?: string;
  book_web3_price?: string | number;
  book_plan_id?: string | number;
  /** 是否已经买过这个合集。买过就不再显示解锁入口 */
  book_buy?: number | string | boolean;
  book_is_nsfw: number;
  book_id: string;
  book_title: string;
  chapter_index: string | number;
  latest_read_chapter_index: string | number;
  session_id: string;
  duration: number | string;
}

const detail = ref<DetailData>({
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
  type: "",
  videoUrl: "",
  cover: "",
  language: "",
  images: [],
  articleHtml: "",
  content: "",
  content_replace: "",
  permission: "public",
  subscriptionPlans: [],
  isSubscribed: false,
  commentsEnabled: true,
  isLast: false,
  likes: 0,
  liked: false,
  favNum: 0,
  isFav: false,
  is_teenager: 1,
  is_nsfw: '0',
  book_is_nsfw: 0,
  book_id: '',
  book_title: '',
  chapter_index: '',
  latest_read_chapter_index: '',
  session_id: '',
  duration: 0
});

// Tab state
// 做同款 / 图片做视频回填的是「当前这张图 / 当前这篇作品」，
// 左右切图或切到上一个 / 下一个作品之后来源就作废了：清空输入框并收起。
watch(currentImageIndex, (v, prev) => {
  if (v !== prev && composerActive.value) composerRef.value?.close();
});

watch(() => detail.value?.id, (id, prev) => {
  if (id !== prev && composerActive.value) composerRef.value?.close();
});

const activeTab = ref('detail');

// Collection Mode
const isCollectionMode = ref(false);
const currentCollectionIndex = ref(0);

// Collections
const collections = ref<any[]>([]);
const isLoadingCollections = ref(false);
const currentCollectionPage = ref(1);
const hasMoreCollections = ref(true);
const loadingMoreCollections = ref(false);

// Chapter navigation (for collection mode)
const chapterCount = ref(0);
const prevChapterId = ref('');
const nextChapterId = ref('');
const isChapterNavigationLoaded = ref(false);
// 合集章节生成按钮开关：'2'=合集每一章都显示 last-chapter-section；'1'=仅最后一章显示
const bookGenSwitch = ref('1');

// Track if images are loaded to prevent layout shift
const isImagesLoaded = ref(false);
const loadedImageCount = ref(0);

// Current collection
const currentCollection = computed(() => {
  return collections.value[currentCollectionIndex.value] || null;
});

const currentVideoSrc = computed(() => {
  if (isCollectionMode.value && currentCollection.value?.videoUrl) {
    return currentCollection.value.videoUrl;
  }
  return detail.value.videoUrl;
});

// 博主有没有开通 Stripe 收款（blogger_status == 1），原本决定解锁卡上能不能选现金支付。
// 现在现金支付不看这个状态了（见 DramaUnlockCard 里恒为 true 的 canPayCash），
// 所以这次额外的博主信息请求先停掉，authorBloggerStatus 保留默认值 0 继续传给解锁卡。
// 恢复时把下面 bloggerStatusFetchedFor 和整段 watch 的注释一起解开。
const authorBloggerStatus = ref<number>(0);
// let bloggerStatusFetchedFor: string | number | null = null;
// watch(
//   () => (showDramaUnlock.value ? detail.value?.author?.id : null),
//   async (authorId) => {
//     if (!authorId || authorId === bloggerStatusFetchedFor) return;
//     bloggerStatusFetchedFor = authorId;
//     try {
//       const res = await api.authorInfo(authorId) as any;
//       if (res.code === 0 || res.code === 200) {
//         const status = res.data?.blogger_status ?? res.data?.user?.blogger_status;
//         authorBloggerStatus.value = Number(status) || 0;
//       }
//     } catch (error) {
//       console.error('Fetch author blogger_status error:', error);
//     }
//   },
//   { immediate: true },
// );


watch(currentVideoSrc, () => {
  // 切换视频源时重置自动播放标记，新视频仍需静音自动播放以符合浏览器策略
  hasAutoPlayed.value = false;
});

watch([currentVideoSrc, videoRef], () => {
  if (!currentVideoSrc.value || !videoRef.value) return;
  if (detail.value.type !== '3' && detail.value.type !== '5') return;

  nextTick(() => {
    tryAutoPlay();
  });
});

const currentVideoPoster = computed(() => {
  if (isCollectionMode.value && currentCollection.value?.cover) {
    return processImageUrl(currentCollection.value.cover);
  }
  return processImageUrl(detail.value.cover);
});

// User region (true = not in China, false = in China)
const userRegion = ref(false);
// 地区接口是否已返回（避免未返回前误判为中国大陆）
const regionLoaded = ref(false);

// Get user region
function getCountry(){
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      userRegion.value = false;
    }
  }).catch(err => {
    console.log(err);
    userRegion.value = false;
  }).finally(() => {
    regionLoaded.value = true;
  })
}

// 是否中国大陆用户（地区接口已返回且非海外）
const isChinaRegion = computed(() => regionLoaded.value && !userRegion.value);

const isMakeVideoLoading = ref(false);
const isMakeSequelLoading = ref(false);
const showMakeSequelSubscribeModal = ref(false);
const makeSequelAuthorId = ref('');

const contentSwitch = useContentSwitchStore();
// userRegion.value = true means NOT in China, false means IN China
// Pass show_nsfw only when NOT in China (userRegion.value = true)
const showNsfw = computed(() => contentSwitch.showNsfw);

// Enter collection mode
async function enterCollectionMode() {
  if (detail.value.type == '1') {
    if (nextChapterId.value) {
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: nextChapterId.value
        }
      });
    }
  }

  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    isCollectionMode.value = true;
  }

  activeTab.value = 'collection';
  isRightPanelHidden.value = false;

  await loadChapters();
  // loadChapters 把列表重置回第一页了，这一集可能在后面几页，重新定位一次
  await locateActiveCollection();
}

// Enter current chapter
async function enterCurrentChapter() {
  // Only navigate if the current ID is different from the route ID
  if (String(detail.value.id) !== route.query.id) {
    // Enter current chapter
    router.replace({
      path: '/detail',
      query: {
        ...route.query,
        id: detail.value.id
      }
    });
  }

  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    isCollectionMode.value = true;
    activeTab.value = 'collection';
    isRightPanelHidden.value = false;
    await loadChapters();
  }
}

// Go to next chapter directly (used by "下一集" button)
async function goToNextChapter() {
  if (nextChapterId.value) {
    isCollectionMode.value = true;
    activeTab.value = 'collection';
    isRightPanelHidden.value = false;
    await loadChapters();

    router.replace({
      path: '/detail',
      query: {
        ...route.query,
        id: nextChapterId.value
      }
    });
  }
}

// Go to collection detail page
function goToCollectionDetail() {
  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    router.push(`/collection/${detail.value.book_id}`);
  }
}

function goMakeSimilar(sessionId: string) {
  if (isChinaRegion.value && (detail.value.is_nsfw == '1' || detail.value.book_is_nsfw == 1)) {
    toast(t('home.error.unlimitedModeRestricted'));
    return;
  }
  checkSensitiveContentBeforeAction(() => {
    // 在本页底部展开输入框回填，不再跳首页
    composerRef.value?.applyMakeSame(sessionId);
  });
}

async function goMakeSimilarVideo() {
  const postId = detail.value.id || '';
  if (!postId) return;

  const doMakeSimilarVideo = async () => {
  const token = localStorage.getItem('token');

  isMakeSequelLoading.value = true;

  try {
    const { ts, sign } = (window as any).AntiCrawler.generateAuthParams('');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Platform': 'web',
      'ts': ts,
      'sign': sign,
    };
    if (token) {
      headers['token'] = token;
    }
    const detailRes = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        post_id: postId,
        fromIndexRecommend: { tab: 'hot' },
      }),
    }).then(r => r.json());

    if (detailRes.code != 0 && detailRes.code != 200) {
      toast(detailRes.message || t('fail'));
      return;
    }

    const data = detailRes.data.post || detailRes.data;
    const authorId = detailRes.data.author?.id || data.author_id || '';
    const uid = localStorage.getItem('uid');
    const needsSubscription = (!token) ? (data.access_rights == '2' && authorId) : (data.access_rights == '2' && data.is_subscribed != 1 && authorId && authorId != uid);
    if (needsSubscription) {
      makeSequelAuthorId.value = String(authorId);
      showMakeSequelSubscribeModal.value = true;
      return;
    }

    const videoUrl = data.video_url || '';
    const cover = data.cover || '';
    const isNsfw = data.is_nsfw == 1 || data.is_nsfw == '1';
    const videoDuration = Number(data.duration) || 0;

    await composerRef.value?.applyMakeSimilarVideoData({ videoUrl, cover, isNsfw, duration: videoDuration, postId });
  } catch (error) {
    console.error('Error fetching post detail for make similar video:', error);
    toast(t('fail'));
  } finally {
    isMakeSequelLoading.value = false;
  }
  };

  checkSensitiveContentBeforeAction(doMakeSimilarVideo);
}

async function goMakeSequel() {
  const videoUrl = detail.value.videoUrl || '';
  if (!videoUrl) return;
  const isNsfw = detail.value.is_nsfw == '1' || detail.value.book_is_nsfw == 1;
  if (isChinaRegion.value && isNsfw) {
    toast(t('home.error.unlimitedModeRestricted'));
    return;
  }

  const doMakeSequel = async () => {
  const token = localStorage.getItem('token');

  isMakeSequelLoading.value = true;

  try {
    const postId = detail.value.id || '';
    const cover = detail.value.cover || '';
    const { ts, sign } = (window as any).AntiCrawler.generateAuthParams('');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Platform': 'web',
      'ts': ts,
      'sign': sign,
    };
    if (token) {
      headers['token'] = token;
    }
    const detailRes = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        post_id: postId,
        fromIndexRecommend: { tab: 'hot' },
      }),
    }).then(r => r.json());

    if (detailRes.code != 0 && detailRes.code != 200) {
      toast(detailRes.message || t('fail'));
      return;
    }

    const data = detailRes.data.post || detailRes.data;
    const authorId = detailRes.data.author?.id || data.author_id || '';
    const uid = localStorage.getItem('uid');
    const needsSubscription = (!token) ? (data.access_rights == '2' && authorId) : (data.access_rights == '2' && data.is_subscribed != 1 && authorId && authorId != uid);
    if (needsSubscription) {
      makeSequelAuthorId.value = String(authorId);
      showMakeSequelSubscribeModal.value = true;
      return;
    }

    const videoDuration = Number(data.duration) || 0;
    await composerRef.value?.applyMakeSequelData({
      videoUrl, cover, type: detail.value.type, videoExtend: true, postId, isNsfw, duration: videoDuration
    });
  } catch (error) {
    console.error('Error fetching post detail for make sequel:', error);
    toast(t('fail'));
  } finally {
    isMakeSequelLoading.value = false;
  }
  };

  checkSensitiveContentBeforeAction(doMakeSequel);
}

function goMakeSequelSubscribe() {
  showMakeSequelSubscribeModal.value = false;
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/register');
    return;
  }
  if (makeSequelAuthorId.value) {
    router.push(`/subscription-payment?id=${makeSequelAuthorId.value}`);
  }
}

function goMakeVideo() {
  const img = detail.value.images?.[currentImageIndex.value]?.image_url || detail.value.cover || '';
  if (!img) return;
  const isNsfw = detail.value.is_nsfw == '1' || detail.value.book_is_nsfw == 1;

  const validExts = /\.(jpe?g|png|webp)(\?.*)?$/i;
  if (!validExts.test(img)) {
    toast(t('home.error.makeVideoImageInvalid'));
    return;
  }

  const doMakeVideo = () => {
  isMakeVideoLoading.value = true;
  const testImg = new Image();
  testImg.onload = () => {
    const width = testImg.naturalWidth;
    const height = testImg.naturalHeight;
    if (width === 0 || height === 0) {
      isMakeVideoLoading.value = false;
      toast(t('home.error.makeVideoImageInvalid'));
      return;
    }
    const ratio = width / height;
    if (isNsfw) {
      if (ratio < 1 / 8 || ratio > 8 || width < 240 || width > 8000 || height < 240 || height > 8000) {
        isMakeVideoLoading.value = false;
        toast(t('home.error.makeVideoImageInvalid'));
        return;
      }
    } else {
      if (ratio < 0.4 || ratio > 2.5 || width < 300 || width > 6000 || height < 300 || height > 6000) {
        isMakeVideoLoading.value = false;
        toast(t('home.error.makeVideoImageInvalid'));
        return;
      }
    }
    isMakeVideoLoading.value = false;
    composerRef.value?.applyMakeVideoData({ imageUrl: img, isNsfw });
  };
  testImg.onerror = () => {
    isMakeVideoLoading.value = false;
    toast(t('home.error.makeVideoImageInvalid'));
  };
  testImg.src = img;
  };

  checkSensitiveContentBeforeAction(doMakeVideo);
}

// Enter next chapter if available, otherwise enter current chapter
async function enterNextOrCurrentChapter() {
  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    isCollectionMode.value = true;
    activeTab.value = 'collection';
    isRightPanelHidden.value = false;
    await loadChapters();

    let targetChapterId = '';

    // Case 1: User has reading history - continue from last read position
    if (Number(detail.value.latest_read_chapter_index) > 0) {
      const targetChapter = collections.value.find(chapter =>
        Number(chapter.chapter_index) === Number(detail.value.latest_read_chapter_index)
      );
      if (targetChapter) {
        targetChapterId = targetChapter.post_id;
      }
    }

    // Case 2: No reading history but has next chapter - go to next chapter
    if (!targetChapterId && nextChapterId.value) {
      targetChapterId = nextChapterId.value;
    }

    // Case 3: Fallback to current chapter
    if (!targetChapterId) {
      targetChapterId = String(detail.value.id);
    }

    if (targetChapterId && targetChapterId !== route.query.id) {
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: targetChapterId
        }
      });
    }
  }
}

// Load chapters (collection episodes)
async function loadChapters() {
  if (!detail.value.book_id || Number(detail.value.book_id) == 0) {
    return;
  }

  try {
    const response = await api.singleCollection(String(detail.value.book_id), 1, COLLECTION_PAGE_SIZE) as any;
    if (response.code == 0) {
      const newCollections = response.data?.data || [];
      collections.value = newCollections.map((chapter: any) => ({
        ...chapter,
        type: String(detail.value.type)
      }));
      chapterCount.value = response.data?.allnums || 0;
      // 和 loadCollections 共用同一份分页状态 —— 这里只拿了第一页，
      // 后面定位当前这一集要接着往下翻，状态对不上就翻不动了
      currentCollectionPage.value = 1;
      hasMoreCollections.value = newCollections.length > 0
        && collections.value.length < Number(chapterCount.value || 0);
      setChapterNavigation();
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

// Navigate to chapter
async function navigateToChapter(chapter: any) {
  if (!chapter || !chapter.post_id) return;

  if (isSensitiveContent.value) {
    if (detail.value.author.id && detail.value.author.id === uid) {
      // author bypass
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const parsedUserInfo = JSON.parse(userInfoStr);
          // 未满18岁（详情接口 is_adult != 1）：弹出「是否满18岁」问询
          if (parsedUserInfo.is_adult != 1) {
            pendingChapter.value = chapter;
            showSensitiveContentAdultConfirmModal.value = true;
            return;
          }
        }
        if (!isAllowSensitiveContent.value) {
          // 已勾选「不再提示」则直接开启，不再弹「允许敏感？」
          if (localStorage.getItem('sensitiveContentDontAsk') == '1') {
            localStorage.setItem('allowSensitiveContent', '1');
            isAllowSensitiveContent.value = true;
          } else {
            pendingChapter.value = chapter;
            showSensitiveContentConfirmModal.value = true;
            return;
          }
        }
      }
    }
  }

  await doNavigateToChapter(chapter);
}

async function doNavigateToChapter(chapter: any) {
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

  activeTab.value = 'collection';
  isRightPanelHidden.value = false;

  await loadChapters();
  // loadChapters 把列表重置回第一页了，这一集可能在后面几页，重新定位一次
  await locateActiveCollection();
}

// Set chapter navigation
async function setChapterNavigation() {
  // First try to find by post_id (more reliable)
  let currentIndex = collections.value.findIndex(chapter => {
    return chapter.post_id == detail.value.id;
  });

  // If not found by post_id, try to find by chapter_index
  if (currentIndex == -1 && detail.value.chapter_index) {
    currentIndex = collections.value.findIndex(chapter => {
      return Number(chapter.chapter_index) == Number(detail.value.chapter_index);
    });
  }

  // Reset navigation
  prevChapterId.value = '';
  nextChapterId.value = '';

  if (currentIndex > 0) {
    prevChapterId.value = collections.value[currentIndex - 1].post_id;
  }

  if (currentIndex < collections.value.length - 1) {
    nextChapterId.value = collections.value[currentIndex + 1].post_id;
  }

  // Update current collection index
  if (currentIndex !== -1) {
    currentCollectionIndex.value = currentIndex;
  }

  // Don't set activeTab to 'collection' here - leave it as 'detail' by default
  // activeTab.value = 'collection';
  isRightPanelHidden.value = false;

  // Mark chapter navigation as loaded to enable last-chapter-section display
  isChapterNavigationLoaded.value = true;

  // await loadChapters();
}

// Handle image load completion to prevent layout shift
// Show last-chapter-section only after ALL images are loaded
function onImageLoaded(totalImages: number) {
  loadedImageCount.value++;
  // Show last-chapter-section only after ALL images are loaded
  if (loadedImageCount.value >= totalImages) {
    isImagesLoaded.value = true;
  }
}

// Exit collection mode
function exitCollectionMode() {
  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    router.push(`/collection/${detail.value.book_id}`);
    return;
  }
  isCollectionMode.value = false;
  activeTab.value = 'detail';
  currentCollectionIndex.value = 0;
  isNearBottom.value = false;
  if (imageStackRef.value) {
    imageStackRef.value.scrollTop = 0;
  }
  if (comicScrollRef.value) {
    comicScrollRef.value.scrollTop = 0;
  }

  prevChapterId.value = '';
  nextChapterId.value = '';
  isChapterNavigationLoaded.value = false;
  isImagesLoaded.value = false;
  loadedImageCount.value = 0;

  setChapterNavigation();
}

// Record view history for collection episodes
async function recordViewHistory() {
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  if (!isCollectionMode.value || chapterCount.value < 1) {
    return;
  }

  const bookId = detail.value.book_id;
  const currentIndex = collections.value.findIndex(chapter => {
    return chapter.post_id == detail.value.id;
  });
  if (currentIndex === -1) {
    return;
  }
  const chapterIndex = currentIndex + 1;

  if (!bookId) {
    return;
  }

  try {
    await api.recordHistory({
      book_id: bookId,
      chapter_index: chapterIndex
    });
  } catch (error) {
    console.error('Error recording view history:', error);
  }
}

// Check if a collection item is "active" (highlighted in the list)
function isCollectionItemActive(index: number): boolean {
  const item = collections.value[index];
  if (!item) return false;

  return item.post_id && detail.value.id && item.post_id == detail.value.id;
}

// Check if a collection item is currently "playing"
function isCollectionItemPlaying(index: number): boolean {
  const item = collections.value[index];
  if (!item) return false;

  // Current item is "playing" if its post_id matches the current detail id
  // In collection mode, also check the currentCollectionIndex
  if (isCollectionMode.value) {
    return currentCollectionIndex.value == index && item.post_id == detail.value.id;
  }
  // In non-collection mode, just check if it's the current item
  return item.post_id == detail.value.id;
}

// Toggle page fullscreen
function togglePageFullscreen() {
  const detailView = document.querySelector('.detail-view') as HTMLElement | null;
  if (!detailView) return;

  if (!document.fullscreenElement) {
    // Entering fullscreen
    if (isCollectionMode.value) {
      // Collection mode: keep right panel visible
      isRightPanelHidden.value = false;
    } else {
      // Non-collection mode: hide right panel
      isRightPanelHidden.value = true;
    }
    detailView.requestFullscreen().catch((err) => {
      console.log('Fullscreen request failed:', err);
    });
  } else {
    // Exiting fullscreen
    if (isCollectionMode.value) {
      isRightPanelHidden.value = false;
    }
    document.exitFullscreen();
  }
}

// Close right panel in fullscreen (collection mode)
function closeRightPanel() {
  isRightPanelHidden.value = true;
  userClosedRightPanel.value = true;
}

// Restore right panel when clicking image in fullscreen (user had closed it manually)
function restoreRightPanel() {
  if (userClosedRightPanel.value) {
    isRightPanelHidden.value = false;
    userClosedRightPanel.value = false;
  }
}

// Handle mouse wheel on left panel for video navigation (non-collection mode only)
let wheelDebounceTimer: ReturnType<typeof setTimeout> | null = null;
// 做同款 / 做续集唤出的输入框、以及各种弹窗里的滚动 / 拖动，都不是切作品的手势
function isComposerTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  return !!el.closest('.detail-composer, .input-area-box, [class*="modal"]');
}

function handleLeftPanelWheel(event: WheelEvent) {
  // 滚轮切作品关掉了：误触太多，切换只走右侧的上下箭头。函数和调用先留着，要恢复删掉这行即可
  return;
  // 合集模式换集走右栏的合集列表，滚轮不接管
  if (isCollectionMode.value) return;
  // 在底部输入框（做同款 / 做续集）里滚动是在看输入内容，不能切作品
  if (isComposerTarget(event.target)) return;
  // 漫画(1) / 漫剧(2) 是往下读的长内容，滚轮留给右侧滚动条
  if (detail.value.type === '1' || detail.value.type === '2') return;
  // 短剧(3) / 图片(4) / 视频(5)：滚轮上下 = 上一个 / 下一个作品
  if (detail.value.type !== '3' && detail.value.type !== '4' && detail.value.type !== '5') return;

  // Debounce to prevent rapid switching
  if (wheelDebounceTimer) return;

  wheelDebounceTimer = setTimeout(() => {
    wheelDebounceTimer = null;
  }, 800);

  if (event.deltaY > 0) {
    // Scroll down -> next
    goNext();
  } else if (event.deltaY < 0) {
    // Scroll up -> prev
    goPrev();
  }
}

// Play collection item
function playCollectionItem(chapter: any) {
  if (chapter) {
    navigateToChapter(chapter);
  }

  if (isCollectionMode.value) {
    // 停止当前播放的视频
    if (videoRef.value) {
      videoRef.value.pause();
    }

    // 切换到点击的合集项目
    const index = collections.value.findIndex(item => item.post_id == chapter.post_id);
    if (index !== -1) {
      currentCollectionIndex.value = index;
    }

    // 重置视频状态
    isVideoLoading.value = true;
    isVideoEnded.value = false;
  } else {
    // 进入合集模式并播放点击的项目
    enterCollectionMode();
    setTimeout(() => {
      const index = collections.value.findIndex(item => item.post_id == chapter.post_id);
      if (index !== -1) {
        currentCollectionIndex.value = index;
      }
    }, 100);
  }
}

// Collection list scroll ref
// 右侧合集列表每页条数。一页装得多，定位当前这一集时少翻几次
const COLLECTION_PAGE_SIZE = 100;

const collectionListRef = ref<HTMLElement | null>(null);
const collectionSentinelRef = ref<HTMLElement | null>(null);
let collectionObserver: IntersectionObserver | null = null;

// 触底哨兵：无论是合集列表内部滚动（桌面）还是整页滚动（移动端堆叠布局），
// 只要哨兵进入视口就加载下一页，避免依赖列表元素自身的固定高度滚动。
function setupCollectionObserver() {
  if (collectionObserver) return;
  collectionObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !loadingMoreCollections.value && hasMoreCollections.value && !isLoadingCollections.value) {
      loadCollections(true);
    }
  }, { root: null, rootMargin: '120px' });
  if (collectionSentinelRef.value) collectionObserver.observe(collectionSentinelRef.value);
}

watch(activeTab, (tab) => {
  if (tab === 'collection') {
    nextTick(() => setupCollectionObserver());
  }
});

// Handle collection list scroll for load more
function handleCollectionScroll() {
  const collectionList = collectionListRef.value;
  if (!collectionList || loadingMoreCollections.value || !hasMoreCollections.value) return;

  const scrollTop = collectionList.scrollTop;
  const scrollHeight = collectionList.scrollHeight;
  const clientHeight = collectionList.clientHeight;

  // Check if scrolled to near bottom (within 10px)
  if (scrollHeight - scrollTop - clientHeight <= 10) {
    loadCollections(true);
  }
}

const likes = ref(0);
const liked = ref(false);
const favNum = ref(0);
const isFav = ref(false);

// Navigation arrows
const hasPrev = ref(false);
const hasNext = ref(false);
const prevId = ref<string | null>(null);
const nextId = ref<string | null>(null);
// 上 / 下一个作品的切换动效是整页滑动，由 App.vue 的 <Transition> 做（旧页滑出、新页滑入）。
// 这里只负责：换 id 前把方向写进 pageSlideDir；新实例挂载时看到方向没清，就知道是滑过来的，
// 这次加载不弹全屏遮罩（滑动 + 深色底就是反馈），数据回来（isLoading 落下）自动恢复。
const slideLoading = ref(false);
watch(isLoading, (v) => { if (!v) slideLoading.value = false; });

function slideSwitch(dir: 'up' | 'down', go: () => void) {
  pageSlideDir.value = dir;
  go();
  // 正常由 App.vue 的 after-leave 清空；万一导航被拦下没发生过渡，别让方向残留到下一次跳转
  setTimeout(() => { if (pageSlideDir.value === dir) pageSlideDir.value = ''; }, 1000);
}

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

  // 处理 [mention:value|user] 格式
  // 匹配规则：[mention:数字|用户名] 格式，用于标识用户
  // 只有当value > 0时才显示为蓝色且可点击
  result = result.replace(/\[mention:(\d+)\|([^\]]+)\]/g, (match, value, user) => {
    const numValue = parseInt(value);
    if (numValue > 0) {
      // 真实用户，添加蓝色可点击的span标签
      return `<span style="color: #00d3f2; cursor: pointer;" onclick="window.searchByMention('@${user}')">${user}</span>`;
    } else {
      // 普通文案，只显示用户名
      return user;
    }
  });

  return result;
}

function setSeoMeta(title: string, description: string, type: string) {
  const typeMap: { [key: string]: string } = {
    '1': t('detail.type.comic'),
    '2': t('detail.type.novel'),
    '3': t('detail.type.drama')
  };

  const typeLabel = typeMap[type] || '';

  let pageTitle = t('seo.detail.title');
  pageTitle = pageTitle.replace(/\[\[title\]\]/g, title);

  let keywords = t('seo.detail.keywords');
  keywords = keywords.replace(/\[\[title\]\]/g, title).replace(/\[\[type\]\]/g, typeLabel);

  const trimmedDesc = description.replace(/<[^>]*>/g, '').replace(/[\n\r]+/g, '').substring(0, 80);
  let pageDescription = t('seo.detail.description');
  pageDescription = pageDescription.replace(/\[\[title\]\]/g, title).replace(/\[\[description\]\]/g, trimmedDesc);

  document.title = pageTitle;

  let metaKeywords = document.querySelector('meta[name="Keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', keywords);

  let metaDescription = document.querySelector('meta[name="Description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', pageDescription);
}

// API Data Load
/**
 * 拉某一集的字幕。
 *
 * 合集里每一集都是独立的 post，字幕各自一套 —— 原来只在 fetchDetail 里拉一次，
 * 切到下一集时上一集的字幕还挂在新视频上对着轴放，这里补上。
 */
async function loadSubtitles(postId: number | string) {
  if (!postId || isStandaloneType.value || detail.value?.type != '3') {
    applySubtitleList([], postId);
    return;
  }

  try {
    const res = (await api.getSubtitlesPublic({ post_id: postId })) as any;
    const ok = res && (res.code == 0 || res.code == 200);
    applySubtitleList(ok ? res.data?.subtitles || res.data || [] : [], postId);
  } catch {
    applySubtitleList([], postId);
  }
}

// 正在播的那一集。合集模式下是当前章节，否则就是详情本身
const playingPostId = computed(() => {
  if (isCollectionMode.value && currentCollection.value?.post_id) {
    return String(currentCollection.value.post_id);
  }
  return String(detail.value?.id || '');
});

watch(playingPostId, (id) => {
  if (!id) return;
  // 每一集的 access_rights 各自独立，切集时按这一集重新取一遍详情里的权限，
  // 不然锁沿用的还是最初打开那一集的（该放的不放、该锁的不锁）
  refreshPlayingPermission(id);
  // 进详情时那一集的字幕在 fetchDetail 里和详情并行拉过了，别重复请求
  if (id === subtitlesPostId.value) return;
  loadSubtitles(id);
});

/**
 * 切集时把当前这一集的权限同步过来。
 *
 * 不走 fetchDetail —— 那个会连带重置合集列表、当前下标、评论、播放状态，整页重建。
 * 这里只打同一个详情接口，取回来只更新和锁有关的几个字段。
 * 请求失败就沿用上一集的，宁可保守，不把该锁的放开。
 */
async function refreshPlayingPermission(postId: string) {
  try {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers['token'] = token;
    const { ts, sign } = window.AntiCrawler.generateAuthParams('');
    headers['Platform'] = 'web';
    headers['ts'] = ts;
    headers['sign'] = sign;

    const res = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_id: Number(postId) }),
    }).then(r => r.json());

    if (res.code != 0 && res.code != 200) return;
    // 这一步可能被下一次切集赶超，结果回来时已经不是当前这一集了，丢掉
    if (String(postId) !== playingPostId.value) return;

    const data = res.data?.post || res.data || {};
    detail.value.permission = data.access_rights == '2'
      ? 'partial'
      : data.access_rights == '3' ? 'private' : 'public';
    if (data.book_buy !== undefined) detail.value.book_buy = data.book_buy;
    if (data.is_subscribed !== undefined) detail.value.isSubscribed = data.is_subscribed == 1;
  } catch {
    // ignore
  }
}

async function fetchDetail(newId: number) {
  await contentSwitch.ensureLoaded();
  // Get query parameters at the beginning
  const type = route.query.type as string || "";
  const cid = route.query.cid as string || "";
  const contentType = route.query.tab as string || route.query.contentType as string || "";
  const language = locale.value == 'zh' ? 'cn' : locale.value;
  // 未登录用户确认满18岁后缓存的成年标识，随详情接口下发
  // 仅未登录且本地自声明满18岁（is_adult=1）时才传该参数；其余情况不传（JSON.stringify 会忽略 undefined）
  const isAdult = (!localStorage.getItem('token') && localStorage.getItem('is_adult') == '1') ? 1 : undefined;

  try {
    id.value = newId;

    // 该遮罩与上传共用 loadText，此处必须复位，否则会残留上一次的上传文案
    loadText.value = t('userHome.loading');
    isLoading.value = true;
    comments.value = [];
    isLoadingComments.value = true;
    // Reset isNearBottom when fetching new detail
    isNearBottom.value = false;
    // Reset collection state when fetching new detail
    collections.value = [];
    currentCollectionIndex.value = 0;
    // Reset image loading state when fetching new detail
    isImagesLoaded.value = false;
    loadedImageCount.value = 0;
    isChapterNavigationLoaded.value = false;

    var data = null;

    if (type == "1")  {
      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        fromIndexRecommend: {
          "tab": "hot",
          "type": contentType,
          "language": language,
          "show_nsfw": showNsfw.value
        }
      })
    } else if (type == "2") {
      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        fromIndexFollow: {
          "type": contentType,
          "language": language,
          "show_nsfw": showNsfw.value
        }
      })
    } else if (type == "3") {
      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        fromIndexSubscription: {
          "type": contentType,
          "language": language,
          "show_nsfw": showNsfw.value
        }
      })
    } else if (type == "4") {
      const bloggerId = route.query.uid as string || "";
      const searchKeyword = route.query.keyword as string || "";
      const startDay = route.query.start_day as string || "";
      const endDay = route.query.end_day as string || "";

      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        fromBloggerIndex: {
          blogger_id: bloggerId,
          keywords: searchKeyword,
          start_day: startDay,
          end_day: endDay,
          "type": contentType,
          "language": language,
          "show_nsfw": showNsfw.value
        }
      })
    } else if (type == "5") {
      const searchKeyword = route.query.keyword as string || "";
      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        show_nsfw: showNsfw.value,
        fromSearch: {
          keywords: searchKeyword,
          "type": contentType,
          "language": language,
          "show_nsfw": showNsfw.value
        }
      })
    } else {
      data = JSON.stringify({
        post_id: newId,
        is_adult: isAdult,
        "type": contentType,
        "language": language,
        "show_nsfw": showNsfw.value
      })
    }

    const contentPayload = JSON.parse(data);
    if (contentSwitch.channel !== undefined) contentPayload.channel = contentSwitch.channel;
    data = JSON.stringify(contentPayload);

    const token = localStorage.getItem('token');

    const headers: HeadersInit = {};

    if (token) {
      headers['token'] = token;
    }

    const authToken = '';
    const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);
    headers['Platform'] = 'web';
    headers['ts'] = ts;
    headers['sign'] = sign;

    const detailPromise = fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers: headers,
      body: data
    }).then(r => r.json());

    const res = await detailPromise;

    if (res.code == 0 || res.code == 200) {
      const data = res.data.post || res.data;
      // 收费档位。没设置时接口给的是空数组 []，设置了才是对象，交给 pickPlan 收口
      const detailPlan = (pickPlan(data.plan ?? res.data?.plan) ?? {}) as any;

      let bookIsNsfw = 0;
      let bookSessionId = '';
      if (data.book_id && Number(data.book_id) > 0) {
        try {
          const bookRes = await api.getCollectionDetail(String(data.book_id)) as any;
          if (bookRes.code === 0) {
            const bookData = bookRes.data?.book_info || bookRes.data;
            if (bookData && (bookData.is_nsfw == 1 || bookData.is_nsfw == '1')) {
              bookIsNsfw = 1;
            }
            if (bookData?.session_id) {
              bookSessionId = bookData.session_id;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      detail.value = {
        id: data.id || newId,
        author: res.data.author,
        isFollowed: data.is_followed == 1 || false,
        time: formatTimestamp(data.created_at) || "",
        title: data.title || "",
        description: data.content_replace || data.content || "",
        type: data.type,
        videoUrl: data.video_url || "",
        cover: data.cover || "",
        language: data.language || "",
        images: res.data.images || [],
        articleHtml: formatContent(data.content_replace || data.content || ""),
        content: data.content || "",
        content_replace: data.content_replace || "",
        permission: data.access_rights == '2' ? "partial" : data.access_rights == '3' ? "private" : "public",
        subscriptionPlans: data.subscription_plans || data.plans || [],
        isSubscribed: data.is_subscribed == 1 || false,
        commentsEnabled: data.comments_enabled !== false,
        isLast: data.is_last || false,
        likes: Number(data.like_count || data.likes || 0),
        liked: data.is_liked == 1 || data.is_liked === true,
        favNum: Number(res.data.fav_num || 0),
        isFav: res.data.is_fav == 1 || res.data.is_fav === true,
        is_teenager: data.is_teenager,
        is_nsfw: data.is_nsfw || '0',
        book_price: detailPlan.price ?? '',
        book_currency: detailPlan.currency ?? '',
        book_web3_price: detailPlan.web3_price ?? '',
        book_plan_id: detailPlan.plan_id ?? detailPlan.id ?? '',
        book_buy: data.book_buy ?? res.data?.book_buy ?? 0,
        book_is_nsfw: bookIsNsfw,
        book_id: data.book_id || '',
        book_title: data.book_title || '',
        chapter_index: data.chapter_index || '',
        latest_read_chapter_index: res.data.latest_read_chapter_index || '',
        session_id: data.session_id || bookSessionId || '',
        duration: data.duration || 0
      } as DetailData;

      setSeoMeta(
        detail.value.title,
        detail.value.description,
        detail.value.type
      );

      // 字幕：等详情回来知道类型了再拉，只有漫剧（type 3）才请求 getSubtitlesPublic；
      // 以前是和详情并行发的，那时类型还是上一条 / 初始值，漫画、小说也会白请求一次。
      // 不是漫剧、或者这条没有字幕，loadSubtitles 里都会显式清空，
      // 不会把上一条的字幕留在开关里。
      loadSubtitles(newId);

      // Load chapters if it's part of a collection
      if (detail.value.book_id != '' && Number(detail.value.book_id) > 0 && !isStandaloneType.value) {
        await loadChapters();

        // Auto enter collection mode when book has chapters
        isCollectionMode.value = true;
        activeTab.value = 'collection';
        isRightPanelHidden.value = false;

        // 地址栏带的这一集不一定在第一页，翻到它所在的页并滚到列表中间
        locateActiveCollection();

        if (localStorage.getItem('token')) {
          await recordViewHistory();
        }
      }

      totalComments.value = res.data.comment_total || '';

      // Update local state
      likes.value = detail.value.likes;
      liked.value = detail.value.liked;
      favNum.value = detail.value.favNum;
      isFav.value = detail.value.isFav;

      // Preload cover image for faster display
      if (detail.value.cover) {
        const img = new Image();
        img.src = processImageUrl(detail.value.cover);
      }

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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)

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
        language: "",
        images: [],
        articleHtml: "",
        content: "",
        content_replace: "",
        permission: "public",
        subscriptionPlans: [],
        isSubscribed: false,
        commentsEnabled: true,
        isLast: false,
        likes: 0,
        liked: false,
        favNum: 0,
        isFav: false,
        is_teenager: 1,
        is_nsfw: '0',
        book_is_nsfw: 0,
        book_id: "",
        book_title: "",
        chapter_index: "",
        latest_read_chapter_index: "",
        session_id: '',
        duration: 0
      };
      return;
    }
  } catch (error) {
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
      language: "",
      images: [],
      articleHtml: "",
      content: "",
      content_replace: "",
      permission: "public",
      subscriptionPlans: [],
      isSubscribed: false,
      commentsEnabled: true,
      isLast: false,
      likes: 0,
      liked: false,
      favNum: 0,
      isFav: false,
      is_teenager: 1,
      is_nsfw: '0',
      book_is_nsfw: 0,
      book_id: "",
      book_title: "",
      chapter_index: "",
      latest_read_chapter_index: "",
      session_id: '',
      duration: 0
    };
    likes.value = 0;
    liked.value = false;
    favNum.value = 0;
    isFav.value = false;
    comments.value = [];
    totalComments.value = '';
  } finally {
    isLoading.value = false;
  }

  // Reset states
  currentImageIndex.value = 0;
  isArticleExpanded.value = false;
  isVideoLoading.value = true;
  isPlaying.value = false;

  if (detail.value.type == '3') {
    setTimeout(() => {
      if (isVideoLoading.value) {
        isVideoLoading.value = false;
      }
    }, 8000);
  }

  // Load comments after fetching detail
  await loadComments();

  // Load comment detail if cid parameter exists
  if (cid) {
    await loadCommentDetail(cid);
  }

  // Load comment detail to reply list if rid parameter exists
  const rid = route.query.rid as string || "";
  if (rid) {
    await loadCommentToReplyList(rid);
  }
}

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

// Search functions for # and @
function searchByTag(tag: string) {
  const url = router.resolve({ path: "/search", query: { keyword: tag.substring(1), type: "post" } }).href;
  window.open(url, "_blank");
}

// Load collections
/**
 * 右侧合集列表里，当前这一集的下标。
 * 按地址栏的 id 比对（切集时 router.replace 会同步这个 id），取不到再退回详情自己的 id。
 */
function findActiveCollectionIndex(): number {
  const targetId = String(route.query.id ?? detail.value?.id ?? '').trim();
  if (!targetId) return -1;
  return collections.value.findIndex((item: any) => String(item?.post_id ?? '') === targetId);
}

/**
 * 把当前这一集滚到列表可视区正中间。
 *
 * 只滚列表自己，不碰整页滚动 —— 窄屏下这个列表是跟着整页滚的（height:auto），
 * 内容没超出时 scrollHeight == clientHeight，这里直接不动，免得把页面顶跑。
 */
async function scrollCollectionToActive(index: number) {
  if (index < 0) return;
  await nextTick();
  const listEl = collectionListRef.value;
  if (!listEl || listEl.scrollHeight <= listEl.clientHeight) return;

  const items = listEl.querySelectorAll('.collection-item');
  const el = items[index] as HTMLElement | undefined;
  if (!el) return;

  const offset = el.getBoundingClientRect().top - listEl.getBoundingClientRect().top;
  const centered = listEl.scrollTop + offset - (listEl.clientHeight - el.offsetHeight) / 2;
  const max = listEl.scrollHeight - listEl.clientHeight;
  listEl.scrollTop = Math.max(0, Math.min(centered, max));
}

// 定位时最多往下翻这么多页，防止 id 根本不在这个合集里时一直翻到底
const MAX_LOCATE_PAGES = 20;

/**
 * 定位到地址栏 id 对应的那一集：已加载的这几页里找不到，就继续加载下一页再找，
 * 直到找到、没有更多数据、或者翻够 MAX_LOCATE_PAGES 页为止。
 */
async function locateActiveCollection() {
  for (let i = 0; i < MAX_LOCATE_PAGES; i++) {
    const index = findActiveCollectionIndex();
    if (index !== -1) {
      await scrollCollectionToActive(index);
      return;
    }
    if (!hasMoreCollections.value || isLoadingCollections.value || loadingMoreCollections.value) return;
    await loadCollections(true);
  }
}

/** 切到「合集」tab：拉列表，然后定位到当前这一集 */
async function openCollectionTab() {
  activeTab.value = 'collection';
  await loadCollections();
  await locateActiveCollection();
}

async function loadCollections(append: boolean = false) {
  try {
    if (append) {
      loadingMoreCollections.value = true;
    } else {
      isLoadingCollections.value = true;
      currentCollectionPage.value = 1;
      hasMoreCollections.value = true;
    }

    const page = append ? currentCollectionPage.value + 1 : 1;
    const pageSize = COLLECTION_PAGE_SIZE;

    // 有book_id且值大于0，使用真实API调用
    if (detail.value.book_id && Number(detail.value.book_id) > 0) {
      const response = await api.singleCollection(String(detail.value.book_id), page, pageSize) as any;
      if (response.code === 0) {
        const newCollections = response.data?.data || [];

        const transformedCollections = newCollections.map((chapter: any) => ({
          post_id: chapter.post_id,
          title: chapter.title,
          cover: chapter.cover,
          likes: chapter.like_count || 0,
          liked: chapter.is_liked == 1 || false,
          author: detail.value.author.nickname,
          type: String(detail.value.type),
          duration: chapter.duration,
          isSubscribed: detail.value.isSubscribed,
          requiresSubscription: chapter.access_rights == '2' || false
        }));

        if (append) {
          collections.value = [...collections.value, ...transformedCollections];
          currentCollectionPage.value = page;
        } else {
          collections.value = transformedCollections;
        }

        // 还有没有下一页：这一页有东西，且已经拿到的条数还没到总数。
        // （原来写的是「这一页条数 == 总数」，只在一页正好装下全部时才成立，反了）
        const totalChapters = Number(response.data?.allnums ?? 0);
        hasMoreCollections.value = newCollections.length > 0
          && collections.value.length < totalChapters;
      }
    } else {
      // 如果没有book_id或book_id值不大于0，清空collections
      if (!append) {
        collections.value = [];
        hasMoreCollections.value = false;
      }
    }
  } catch (error) {
    console.log('Error loading collections:', error);
    if (!append) {
      collections.value = [];
    }
  } finally {
    isLoadingCollections.value = false;
    loadingMoreCollections.value = false;
  }
}

async function searchByMention(mention: string) {
  try {
    const username = mention.replace(/@/g, '');

    const res = await api.getUserId({ nickname: username }) as any;

    if (res.code === 0 || res.code === 200) {
      const userId = res.data?.user_id;
      if (userId) {
        router.push({ path: "/user-home", query: { id: userId } });
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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

      const totalComments = parseInt(res.data?.allnums) || 0;
      currentPage.value = page;
      hasMoreComments.value = comments.value.length < totalComments;
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

// Delete comment - show confirm modal only if there are replies
function deleteComment(commentId: string, isReply: boolean = false) {
  // Close dropdown menu
  activeCommentMoreId.value = null;

  // Find the comment object
  let comment = null;

  // Check in main comments
  for (const c of comments.value) {
    if (String(c.id) === commentId) {
      comment = c;
      break;
    }
    // Check in replies
    if (c.replies) {
      for (const r of c.replies) {
        if (String(r.id) === commentId) {
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

// Direct delete without showing modal
async function handleDeleteConfirmDirect(commentId: string, isReply: boolean = false) {
  try {
    const res = await api.deleteComment({ comment_id: commentId }) as any;
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

async function updateCommentCount() {
  try {
    var data = JSON.stringify({
      post_id: id.value
    })

    const token = localStorage.getItem('token');

    const headers: HeadersInit = {};

    if (token) {
      headers['token'] = token;
    }

    const authToken = '';
    const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);
    headers['Platform'] = 'web';
    headers['ts'] = ts;
    headers['sign'] = sign;

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

async function handleDeleteConfirm() {
  if (!commentToDelete.value) return;

  deleteModalVisible.value = false;

  try {
    const res = await api.deleteComment({ comment_id: commentToDelete.value }) as any;
    if (res.code === 0 || res.code === 200) {
      toast(t('success'));

      // Update comment count without showing loading
      await updateCommentCount();

      // For top-level comments with replies, reload all comments
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
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    deleteModalVisible.value = false;
    commentToDelete.value = null;
  }
}

// Handle delete cancel
function handleDeleteCancel() {
  deleteModalVisible.value = false;
  commentToDelete.value = null;
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
        user_id: reply.user_id || "",
        avatar: reply.avatar || reply.user?.avatar || "",
        text: reply.text || reply.content || "",
        created_at: reply.created_at || "",
        likes: reply.like_count || 0,
        liked: reply.is_liked == 1 || false,
        replyTo: reply.replyTo || reply.reply_to || "",
        reply_to_user_nickname: reply.reply_to_user_nickname || ""
      }));

      // Filter out rid comment if it exists
      if (comment.rid) {
        formattedReplies = formattedReplies.filter((reply: any) => String(reply.id) !== String(comment.rid));
      }

      // Get rid comment if it exists in current replies
      let ridComment = null;
      if (comment.rid) {
        ridComment = comment.replies.find((r: any) => r.isRidComment);
      }

      // If this is first page
      if (page === 1) {
        // If we have an initialReply, filter it out from API response
        if (comment.initialReply) {
          const initialReplyId = comment.initialReply.id;
          formattedReplies = formattedReplies.filter((reply: any) => String(reply.id) !== String(initialReplyId));
          // Prepend the initialReply to the list
          let newReplies = [comment.initialReply, ...formattedReplies];
          // If there's a rid comment, add it to the beginning
          if (ridComment) {
            newReplies.unshift(ridComment);
          }
          comment.replies = newReplies;
        } else if (formattedReplies.length > 0) {
          // No initialReply but we have replies from API
          // Set the first reply as initialReply
          comment.initialReply = formattedReplies[0];
          // Use all replies
          let newReplies = formattedReplies;
          // If there's a rid comment, add it to the beginning
          if (ridComment) {
            newReplies.unshift(ridComment);
          }
          comment.replies = newReplies;
        } else {
          // No initialReply and no replies from API
          // Create a placeholder reply
          comment.initialReply = {
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
          comment.replies = [comment.initialReply];
        }
      } else if (page > 1) {
        // Append replies for subsequent pages
        comment.replies = [...comment.replies, ...formattedReplies];
      }

      comment.replyPage = page;
      comment.replyTotal = res.data?.allnums || res.data?.total || comment.reply_count || 0;
      comment.hasMoreReplies = comment.replies.length < comment.replyTotal;
    } else {
      // If API fails, keep initialReply if it exists
      if (comment.initialReply && comment.replies.length === 0) {
        comment.replies = [comment.initialReply];
        // If there's a rid comment, add it to the beginning
        if (comment.rid) {
          const ridComment = comment.replies.find((r: any) => r.isRidComment);
          if (ridComment) {
            comment.replies.unshift(ridComment);
          }
        }
      }
      comment.replyPage = 1;
      comment.replyTotal = comment.reply_count || 0;
      comment.hasMoreReplies = false;
    }
  } catch (error) {
    toast(t('fail'));
    // Keep initialReply on error
    if (comment.initialReply && comment.replies.length === 0) {
      comment.replies = [comment.initialReply];
      // If there's a rid comment, add it to the beginning
      if (comment.rid) {
        const ridComment = comment.replies.find((r: any) => r.isRidComment);
        if (ridComment) {
          comment.replies.unshift(ridComment);
        }
      }
    }
    comment.replyPage = 1;
    comment.replyTotal = comment.reply_count || 0;
    comment.hasMoreReplies = false;
  } finally {
    comment.loadingReplies = false;
  }
}

const isFirst = computed(() => {
  if (isCollectionMode.value) {
    return currentCollectionIndex.value <= 0;
  }
  return !hasPrev.value;
});

const isLast = computed(() => {
  if (isCollectionMode.value) {
    return currentCollectionIndex.value >= collections.value.length - 1;
  }
  return !hasNext.value;
});

const permText = computed(() => {
  if (detail.value.permission == "partial") return t("detail.permissionText.partial");
  if (detail.value.permission == "private") return t("detail.permissionText.private");
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

/** 买过整个合集 —— 没订阅博主也照样能看这个合集里的作品 */
const hasBoughtBook = computed(
  () => detail.value?.book_buy == 1 || detail.value?.book_buy === true,
);

const isArticleLocked = computed(() => {
  if (detail.value.permission !== "partial") return false;
  if (detail.value.isSubscribed) return false;
  if (hasBoughtBook.value) return false;
  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;
  // If paid and not subscribed, show lock
  return true;
});

const isPaidContentLocked = computed(() => {
  if (detail.value.permission !== "partial") return false;
  if (detail.value.isSubscribed) return false;
  // 合集已购：锁直接放开，不用再看有没有订阅博主
  if (hasBoughtBook.value) return false;
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;
  return true;
});

const isSensitiveContent = computed(() => {
  return (detail.value.book_id && Number(detail.value.book_id) > 0)
    ? detail.value.book_is_nsfw == 1
    : detail.value.is_nsfw == '1';
});

const checkSensitiveContentBeforeAction = (action: () => void): boolean => {
  if (!isSensitiveContent.value) {
    action();
    return true;
  }
  const authorId = detail.value.author?.id;
  const uid = localStorage.getItem('uid');
  if (authorId && authorId === uid) {
    action();
    return true;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    const isAdult = localStorage.getItem('is_adult') == '1';
    if (!isAdult) {
      pendingAction.value = action;
      showSensitiveContentAdultConfirmModal.value = true;
      return false;
    }
    if (!isAllowSensitiveContent.value) {
      if (localStorage.getItem('sensitiveContentDontAsk') == '1') {
        localStorage.setItem('allowSensitiveContent', '1');
        isAllowSensitiveContent.value = true;
      } else {
        pendingAction.value = action;
        showSensitiveContentConfirmModal.value = true;
        return false;
      }
    }
    action();
    return true;
  }
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    const parsedUserInfo = JSON.parse(userInfoStr);
    if (parsedUserInfo.is_adult != 1) {
      pendingAction.value = action;
      showSensitiveContentAdultConfirmModal.value = true;
      return false;
    }
  }
  if (!isAllowSensitiveContent.value) {
    if (localStorage.getItem('sensitiveContentDontAsk') == '1') {
      localStorage.setItem('allowSensitiveContent', '1');
      isAllowSensitiveContent.value = true;
    } else {
      pendingAction.value = action;
      showSensitiveContentConfirmModal.value = true;
      return false;
    }
  }
  action();
  return true;
};

const isSensitiveContentLocked = computed(() => {
  return false;
});

const isVideoLocked = computed(() => {
  return isPaidContentLocked.value || isSensitiveContentLocked.value;
});

const shouldShowExpand = computed(() => {
  // Simple check: if article length is long enough
  return detail.value.articleHtml.length > 500;
});

const hasPrevImage = computed(() => {
  if (detail.value.type === "1" || detail.value.type === "4") return currentImageIndex.value > 0;
  return false; // Article cover only has 1 image usually, or handle array if needed
});

const hasNextImage = computed(() => {
  if (detail.value.type === "1" || detail.value.type === "4")
    return currentImageIndex.value < (detail.value.images?.length || 0) - 1;
  return false;
});

function onTimeUpdate(e: Event) {
  const v = e.target as HTMLVideoElement;
  currentTime.value = v.currentTime;
  duration.value = v.duration || 0;

  if (isVideoLoading.value && v.currentTime > 0) {
    isVideoLoading.value = false;
    isVideoBuffering.value = false;
  }

  if (v.buffered.length > 0) {
    bufferedPercent.value = (v.buffered.end(v.buffered.length - 1) / (duration.value || 1)) * 100;
  }

  updateCurrentSubtitle();
}

function onLoadedMetadata(e: Event) {
  const v = e.target as HTMLVideoElement;
  duration.value = v.duration;
  v.volume = volume.value;
  // 按缓存音量决定是否静音（音量为 0 才静音）；带声播放能否成立最终由 tryAutoPlay 处理
  v.muted = volume.value === 0;
}

function onCanPlay() {
  isVideoBuffering.value = false;
  // canplay 在每次 seek 完成后都会再触发一次。只有首次加载才走自动播放；
  // 拖进度条时如果视频是暂停的就保持暂停，正在播的浏览器会自己续播。
  // 否则拖动过程中会连续 play()，前一个 play() 被后一个 seek 打断就抛 AbortError，
  // 下面的 catch 又会把它当成自动播放被拦截，把视频静音掉。
  if (!hasAutoPlayed.value) tryAutoPlay();
}

function tryAutoPlay() {
  if (!videoRef.value) return;

  if (!videoRef.value.paused) {
    isPlaying.value = true;
    isVideoLoading.value = false;
    return;
  }

  // 打开即按缓存音量尝试带声自动播放；缓存音量为 0（从未开过声）则静音。
  // 若浏览器自动播放策略拦截了带声播放，回退为静音重试，保证视频仍能自动播放。
  const wantSound = volume.value > 0;
  videoRef.value.volume = volume.value;
  videoRef.value.muted = !wantSound;
  const playPromise = videoRef.value.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      autoMutedByPolicy.value = false;
      hasAutoPlayed.value = true;
      isPlaying.value = true;
      isVideoLoading.value = false;
    }).catch((error: any) => {
      // 只有 NotAllowedError 才是浏览器自动播放策略拦截；
      // AbortError 是 play() 被 pause() / 换源 / seek 打断，不是拦截，别回退成静音
      if (error?.name !== 'NotAllowedError') {
        isVideoLoading.value = false;
        return;
      }
      // 带声自动播放被拦截 → 回退静音重试，并记下来让喇叭图标显示成静音
      if (wantSound && videoRef.value) {
        videoRef.value.muted = true;
        videoRef.value.play().then(() => {
          autoMutedByPolicy.value = true;
          hasAutoPlayed.value = true;
          isPlaying.value = true;
          isVideoLoading.value = false;
        }).catch(() => {
          isPlaying.value = false;
          isVideoLoading.value = false;
        });
      } else {
        isPlaying.value = false;
        isVideoLoading.value = false;
      }
    });
  }
}

function onVideoWaiting() {
  isVideoBuffering.value = true;
}

// 拖进度条：seek 开始就转圈，seek 完成（新位置的数据到了）再收起。
// 如果 seek 完成后数据还不够播，浏览器会紧接着触发 waiting，转圈会再亮起来。
function onVideoSeeking() {
  isVideoBuffering.value = true;
}

function onVideoSeeked() {
  const v = videoRef.value;
  // readyState >= 3（HAVE_FUTURE_DATA）才算真的能播了
  if (v && v.readyState >= 3) isVideoBuffering.value = false;
}

function onVideoPlaying() {
  isVideoBuffering.value = false;
  isVideoLoading.value = false;
  pauseAllOtherVideos();
  // 关闭视频预览模态框
  if (showPreviewModal.value) {
    showPreviewModal.value = false;
  }
}

function pauseAllOtherVideos() {
  // 暂停所有评论区和回复区的视频
  const commentVideos = document.querySelectorAll('.c-video-player');
  commentVideos.forEach(video => {
    (video as HTMLVideoElement).pause();
  });
}

function onCommentVideoPlay(event: Event) {
  // 暂停左侧主视频
  if (videoRef.value) {
    videoRef.value.pause();
  }

  // 暂停所有其他评论区和回复区的视频
  const commentVideos = document.querySelectorAll('.c-video-player');
  commentVideos.forEach(video => {
    if (video !== event.currentTarget) {
      (video as HTMLVideoElement).pause();
    }
  });

  if (showPreviewModal.value) {
    showPreviewModal.value = false;
  }
}

function onVideoError(e: Event) {
  const v = e.target as HTMLVideoElement;
  isVideoBuffering.value = false;
  isVideoLoading.value = false;
  isPlaying.value = false;
  console.log('video error');
}

function onVolumeChange(e: Event) {
  const v = e.target as HTMLVideoElement;
  if (isDraggingVolume.value) return;

  if (!v.muted && v.volume === 1) {
    v.volume = 0.6;
    volume.value = 0.6;
  } else if (!v.muted && v.volume === 0) {
    v.volume = 0.6;
    volume.value = 0.6;
  } else if (!v.muted) {
    volume.value = Math.round(v.volume * 10) / 10;
  }
  localStorage.setItem('videoVolume', volume.value.toString());
}

function onVideoEnded() {
  isPlaying.value = false;
  isVideoEnded.value = true;
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
  }

  // 漫剧（type 3）合集模式：一集播完自动接下一集；到最后一集就单集循环。
  // 换集必须走 playCollectionItem —— 合集列表接口不带视频地址，光改 currentCollectionIndex 视频不会换，
  // 得跳到下一集的 post 重新拉详情，新视频源到位后 watch(currentVideoSrc) 会自动播放。
  if (isCollectionMode.value && detail.value.type === '3' && collections.value.length > 0) {
    const nextEpisode = collections.value[currentCollectionIndex.value + 1];
    if (nextEpisode) {
      playCollectionItem(nextEpisode);
    } else if (videoRef.value) {
      isVideoEnded.value = false;
      videoRef.value.play().catch(() => {
        isPlaying.value = false;
      });
    }
  }
}

function seekVideo(e: MouseEvent) {
  if (!videoRef.value || !duration.value) return;
  const bar = e.currentTarget as HTMLElement;
  const rect = bar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, x / rect.width));
  videoRef.value.currentTime = percent * duration.value;
}

function onProgressClick(e: MouseEvent) {
  if (!videoRef.value || !duration.value) return;
  const bar = e.currentTarget as HTMLElement;
  const rect = bar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, x / rect.width));
  videoRef.value.currentTime = percent * duration.value;
}

function onProgressDragStart(e: MouseEvent) {
  e.preventDefault();
  isDraggingProgress.value = true;
  onProgressClick(e);

  // 拖动时进度条 UI 每次 mousemove 都更新，但真正 seek 每帧最多一次：
  // 每次改 currentTime 浏览器都会取消上一个分段（Range）请求再发新的，
  // mousemove 一秒几十次，全部 seek 会刷出一堆「已取消」的请求，还容易卡顿
  let pendingSeek: number | null = null;
  let seekRaf = 0;
  const flushSeek = () => {
    seekRaf = 0;
    if (pendingSeek === null || !videoRef.value) return;
    videoRef.value.currentTime = pendingSeek;
    pendingSeek = null;
  };
  const onMove = (moveEvent: MouseEvent) => {
    if (!isDraggingProgress.value || !videoRef.value || !duration.value) return;
    const bar = progressBarRef.value;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = moveEvent.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const target = percent * duration.value;
    currentTime.value = target;
    pendingSeek = target;
    if (!seekRaf) seekRaf = requestAnimationFrame(flushSeek);
  };

  const onUp = () => {
    isDraggingProgress.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    if (seekRaf) cancelAnimationFrame(seekRaf);
    flushSeek();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function toggleMute() {
  if (!videoRef.value) return;
  if (autoMutedByPolicy.value) {
    // 刷新后被浏览器强制静音的：点喇叭就是要开声，按缓存音量恢复
    autoMutedByPolicy.value = false;
    if (volume.value === 0) volume.value = 0.6;
  } else if (volume.value > 0) {
    volume.value = 0;
  } else {
    volume.value = 0.6;
  }
  videoRef.value.volume = volume.value;
  videoRef.value.muted = volume.value === 0;
  localStorage.setItem('videoVolume', volume.value.toString());
}

function toggleVolumeSlider() {
  if (showVolumeSlider.value) {
    showVolumeSlider.value = false;
    if (volumeSliderTimer.value) {
      clearTimeout(volumeSliderTimer.value);
      volumeSliderTimer.value = null;
    }
  } else {
    showVolumeSlider.value = true;
    scheduleVolumeSliderClose();
  }
}

function onVolumeDragStart(e: MouseEvent) {
  e.preventDefault();
  isDraggingVolume.value = true;
  updateVolumeFromEvent(e);

  const onMove = (moveEvent: MouseEvent) => {
    if (!isDraggingVolume.value) return;
    updateVolumeFromEvent(moveEvent);
  };

  const onUp = () => {
    isDraggingVolume.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function updateVolumeFromEvent(e: MouseEvent) {
  const track = volumeTrackRef.value;
  if (!track || !videoRef.value) return;
  const rect = track.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const percent = Math.round(Math.max(0, Math.min(1, 1 - y / rect.height)) * 10) / 10;
  volume.value = percent;
  videoRef.value.volume = percent;
  videoRef.value.muted = percent === 0;
  if (percent > 0) autoMutedByPolicy.value = false;
  localStorage.setItem('videoVolume', percent.toString());
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
  const currentHost = window.location.hostname;
  const referrer = document.referrer;
  let isFromExternal = false;
  let isReferrerEmpty = !referrer;

  if (referrer) {
    try {
      const referrerHost = new URL(referrer).hostname;
      isFromExternal = !!(referrerHost && referrerHost !== currentHost);
    } catch (e) {
      isFromExternal = true;
    }
  }

  // vue-router 会把上一条站内记录挂在 history.state.back 上。
  // 从 Stripe 回来 → 成功页 → replace 到详情页这条路径上它是 null，
  // 这时 history.back() 退回去的是 Stripe 的地址，所以直接回首页。
  const hasInAppBack = !!(window.history.state && (window.history.state as any).back);

  if (!hasInAppBack || window.history.length <= 1 || isFromExternal || (isReferrerEmpty && window.history.length <= 2)) {
    router.push('/');
  } else {
    router.back();
  }
}

function goToHomePage() {
  router.push('/');
}

// 获取合集章节生成按钮开关：switch=2 每一章都显示，switch=1 仅最后一章显示
async function fetchBookGenSwitch() {
  try {
    const res = await api.getBookGenSwitch() as any;
    if ((res.code == 0 || res.code == 200) && res.data) {
      bookGenSwitch.value = String(res.data.switch ?? '1');
    }
  } catch (e) {
    console.error('Error fetching book gen switch:', e);
  }
}

function confirmSensitiveContent() {
  showSensitiveContentConfirmModal.value = false;
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  if (pendingAction.value) {
    const action = pendingAction.value;
    pendingAction.value = null;
    action();
  } else if (pendingChapter.value) {
    const chapter = pendingChapter.value;
    pendingChapter.value = null;
    doNavigateToChapter(chapter);
    fetchDetail(id.value);
  } else {
    fetchDetail(id.value);
  }
}

// 成年用户（is_teenager==0）在详情页直接开启敏感内容浏览：仅设置缓存开关，无需 setAdult
// 开启NSFW（成年用户）：仅缓存"是否允许敏感内容"
function enableSensitiveBrowsing() {
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  fetchDetail(id.value);
}

// 我确认已满18岁：已登录写回后端 setAdult；未登录仅本地缓存 is_adult
async function confirmAdultBrowsing() {
  const token = localStorage.getItem('token');
  if (token) {
    // 已登录：声明满18岁，写回后端（不写本地 is_adult，年龄以后端为准）
    try {
      const res = await api.setAdult({ is_adult: 1 }) as any;
      if (res.code != 0 && res.code != 200) {
        toast(getI18nMsg(res));
        return;
      }
    } catch (error) {
      console.error('Error setting adult:', error);
      return;
    }
  } else {
    // 未登录：仅本地缓存 is_adult 自声明
    localStorage.setItem('is_adult', '1');
  }
  // 声明成年后：直接开启敏感内容浏览，左侧切换为内容
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  fetchDetail(id.value);
}

async function handleSensitiveContentAgeConfirm(isAdult: boolean) {
  showSensitiveContentAdultConfirmModal.value = false;
  if (!isAdult) {
    pendingChapter.value = null;
    pendingAction.value = null;
    return;
  }
  if (localStorage.getItem('token')) {
    try {
      const res = await api.setAdult({ is_adult: 1 }) as any;
      if (res.code != 0 && res.code != 200) {
        toast(getI18nMsg(res));
        return;
      }
    } catch (error) {
      console.error('Error setting adult:', error);
      return;
    }
  } else {
    localStorage.setItem('is_adult', '1');
  }
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  const action = pendingAction.value;
  pendingAction.value = null;
  const chapter = pendingChapter.value;
  pendingChapter.value = null;
  if (action) {
    action();
  } else if (chapter) {
    doNavigateToChapter(chapter);
  }
  fetchDetail(id.value);
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

function goToImage(index: number) {
  if (index === currentImageIndex.value) return;
  if (index < 0 || index >= (detail.value.images?.length || 0)) return;
  if (galleryContentRef.value) {
    requestAnimationFrame(() => {
      galleryContentRef.value!.style.transition = "none";
      galleryContentRef.value!.style.transform = `translateX(-${index * 100}%)`;
      galleryContentRef.value!.style.willChange = "transform";

      void galleryContentRef.value!.offsetHeight;

      requestAnimationFrame(() => {
        galleryContentRef.value!.style.transition =
          "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";
        galleryContentRef.value!.style.transform = `translateX(-${index * 100}%)`;

        currentImageIndex.value = index;

        setTimeout(() => {
          if (galleryContentRef.value) {
            galleryContentRef.value!.style.willChange = "auto";
          }
        }, 400);
      });
    });
  } else {
    currentImageIndex.value = index;
  }
}

function openLargeViewer(type: number) {
  if (type == 2) {
    const obj = {
      image_url: processImageUrl(detail.value.cover)
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

function handleComicScroll() {
  const el = comicScrollRef.value;
  if (!el) return;
  const scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;
  // Set isNearBottom to true when scrolled to bottom for the first time
  if (scrollHeight - scrollTop - clientHeight <= 20) {
    isNearBottom.value = true;
  }
}

function handleImageStackScroll() {
  const el = imageStackRef.value;
  if (!el) return;
  const scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;
  // Set isNearBottom to true when scrolled to bottom for the first time
  if (scrollHeight - scrollTop - clientHeight <= 20) {
    isNearBottom.value = true;
  }
}

function toggleComicZoom(index: number) {
  const detailView = document.querySelector('.detail-view') as HTMLElement | null;
  if (!detailView) return;

  if (!document.fullscreenElement) {
    // Entering fullscreen
    isComicFullscreen.value[index] = true;
    detailView.requestFullscreen().catch((err) => {
      console.log('Fullscreen request failed:', err);
    });
    if (isCollectionMode.value) {
      isRightPanelHidden.value = false;
      activeTab.value = 'collection';
    } else {
      isRightPanelHidden.value = true;
    }
  } else {
    // Exiting fullscreen
    isComicFullscreen.value[index] = false;
    document.exitFullscreen();
  }
}

function toggleImageFullscreen() {
  const detailView = document.querySelector('.detail-view') as HTMLElement | null;
  if (!detailView) return;

  if (!document.fullscreenElement) {
    isImageFullscreen.value = true;
    detailView.requestFullscreen().catch((err) => {
      console.log('Fullscreen request failed:', err);
    });
    if (isCollectionMode.value) {
      isRightPanelHidden.value = false;
      activeTab.value = 'collection';
    } else {
      isRightPanelHidden.value = true;
    }
  } else {
    isImageFullscreen.value = false;
    document.exitFullscreen();
  }
}

function handleImageClick(index: number) {
  toggleImageFullscreen();
  restoreRightPanel();
}

async function onSubscribe() {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
    return;
  }

  try {
    var data = {
      'blogger_id': detail.value.author.id
    }
    const res = await api.getOthersSubscription(data) as any;
    if (res.code == 0 || res.code == 200) {
      const plan = res.data?.plan;
      if (!plan) {
        toast(t('detail.authorClosedSubscription'));
        return;
      }
      router.push(`/subscription-payment?id=${detail.value.author.id}`);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    toast(t('fail'));
  }
}

// Navigation
function goPrev() {
  if (!isCollectionMode.value && isFirst.value) return;
  if (isCollectionMode.value && !prevChapterId.value) return;

  if (isCollectionMode.value) {
    // 在合集模式下，直接切换到上一个合集项目
    const chapter = collections.value.find(c => c.post_id === prevChapterId.value);
    if (chapter) {
      navigateToChapter(chapter);
    }
  } else if (prevId.value) {
    // 在非合集模式下切换页面：当前往下滑出，上一个从上滑入
    const targetId = prevId.value;
    slideSwitch('down', () => {
      activeTab.value = 'detail';
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: targetId
        }
      });
    });
  }
}

function goNext() {
  if (!isCollectionMode.value && isLast.value) return;
  if (isCollectionMode.value && !nextChapterId.value) return;

  if (isCollectionMode.value) {
    // 在合集模式下，直接切换到下一个合集项目
    const chapter = collections.value.find(c => c.post_id === nextChapterId.value);
    if (chapter) {
      navigateToChapter(chapter);
    }
  } else if (nextId.value) {
    // 在非合集模式下切换页面：当前往上滑出，下一个从下滑入
    const targetId = nextId.value;
    slideSwitch('up', () => {
      activeTab.value = 'detail';
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: targetId
        }
      });
    });
  }
}

// Media
// 输入框里点视频 / 音频缩略图会弹一个自带 autoplay 的预览窗：左侧的作品要是正在播，
// 两路一起响。弹窗打开时把左侧暂停，关掉再接着放（只恢复是被这里暂停掉的那次）
let pausedByComposerModal = false;
function pauseForComposerModal() {
  pausedByComposerModal = false;
  const v = videoRef.value;
  if (!v || v.paused) return;
  v.pause();
  isPlaying.value = false;
  isVideoBuffering.value = false;
  pausedByComposerModal = true;
}
function resumeAfterComposerModal() {
  if (!pausedByComposerModal) return;
  pausedByComposerModal = false;
  const v = videoRef.value;
  if (!v || !v.paused) return;
  v.play().then(() => { isPlaying.value = true; }).catch(() => { /* 被别的操作打断就算了 */ });
}

function togglePlay() {
  if (!videoRef.value) {
    console.log('Video element not found');
    return;
  }

  if (!videoRef.value.src) {
    toast(t('detail.videoUrlInvalid'));
    return;
  }

  if (videoRef.value.paused) {
    isVideoBuffering.value = true;

    videoRef.value.play().then(() => {
      isPlaying.value = true;
      isVideoBuffering.value = false;
    }).catch(error => {
      isPlaying.value = false;
      isVideoBuffering.value = false;
      // AbortError 是这次 play() 被随后的 pause() / seek / 换源打断（比如加载中连点、拖进度条），
      // 不是真的播放失败，不提示
      if (error?.name === 'AbortError') return;
      toast(t('detail.videoPlayFailed') + ': ' + error.message);
    });
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
    isVideoBuffering.value = false;
  }
}

function toggleCommentVideoPlay(event: Event) {
  event.stopPropagation();
  const video = event.currentTarget as HTMLVideoElement;
  if (video) {
    if (video.paused) {
      if (videoRef.value) {
        videoRef.value.pause();
      }

      const commentVideos = document.querySelectorAll('.c-video-player');
      commentVideos.forEach(v => {
        if (v !== video) {
          (v as HTMLVideoElement).pause();
        }
      });

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
    goAuth();
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
    goAuth();
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
  if (activeCommentMoreId.value == id) {
    activeCommentMoreId.value = null;
  } else {
    activeCommentMoreId.value = id;
  }
}

async function toggleCommentLike(c: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
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
    goAuth();
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

// Footer / Input
function activateInput() {
  const token = localStorage.getItem("token");
  if (!token) {
    goAuth();
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

      if (!validateCommentVideo(file)) break;

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
    // 时长要等元数据加载完才知道。顺带补上 onerror 和超时兜底 ——
    // 原来只挂了 onloadedmetadata，选到坏文件这个 Promise 永远不 resolve，
    // isLoading 会一直转下去。
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    const duration = await new Promise<number>((resolve) => {
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => resolve(NaN);
      setTimeout(() => resolve(NaN), 15000);
    });
    URL.revokeObjectURL(video.src);

    if (!Number.isFinite(duration) || duration <= 0) {
      toast(t('detail.videoCorruptedError'));
      return;
    }
    if (duration > COMMENT_VIDEO_MAX_DURATION) {
      toast(t('detail.videoDurationError'));
      return;
    }
    videoSize.value = parseFloat((file.size / (1024 * 1024)).toFixed(1));

    videoUrl.value = await uploadVideoFile(file, (percent) => {
      loadText.value = `${t('detail.uploading')} ${percent}%`;
    });

    uploadedFiles.value.push({
      type: 'video',
      url: videoUrl.value,
      file});
  } catch (error: any) {
    toast(getI18nMsg(error instanceof PartUploadError
      ? error.payload
      : (error?.response?.data || error)));
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
    goAuth();
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

function handleScroll() {
  if (scrollContentRef.value) {
    isScrolled.value = scrollContentRef.value.scrollTop > 10;

    // Check if scrolled to near bottom (within 10px) for loading more comments
    if (!loadingMore.value && hasMoreComments.value) {
      const scrollTop = scrollContentRef.value.scrollTop;
      const scrollHeight = scrollContentRef.value.scrollHeight;
      const clientHeight = scrollContentRef.value.clientHeight;

      if (scrollHeight - scrollTop - clientHeight <= 10) {
        loadComments(currentPage.value + 1, true);
      }
    }
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
  // Reset to showing only initialReply and rid comment if exists
  c.showingReplies = true;
  const newReplies = [];

  // Add rid comment if it exists
  if (c.rid) {
    const ridComment = c.replies.find((r: any) => r.isRidComment);
    if (ridComment) {
      newReplies.push(ridComment);
    }
  }

  // Add initialReply if it exists
  if (c.initialReply) {
    newReplies.push(c.initialReply);
  }

  if (newReplies.length > 0) {
    c.replies = newReplies;
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
    goAuth();
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
      post_id: id.value,
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
    toast(t('fail'));
  }
}

async function toggleLike() {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
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

        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          likes.value = Number(res.data.like_count || res.data.likes);
        } else {
          likes.value = previousLikes + 1;
        }
        detail.value.likes = likes.value;
        detail.value.liked = liked.value;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else {
      // Unlike post
      const res = await api.dislikePost({ post_id: id.value }) as any;
      if (res.code === 0 || res.code === 200) {
        liked.value = false;
        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          likes.value = Number(res.data.like_count || res.data.likes);
        } else {
          likes.value = Math.max(0, previousLikes - 1);
        }
        detail.value.likes = likes.value;
        detail.value.liked = liked.value;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function toggleFav() {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
    return;
  }

  const isStandalone = detail.value.type === '4' || detail.value.type === '5';

  if (!isStandalone && (!detail.value.book_id || Number(detail.value.book_id) == 0)) return;

  try {
    const previousFavNum = favNum.value;

    if (!isFav.value) {
      const res = isStandalone
        ? await api.bookLikePost({ post_id: detail.value.id }) as any
        : await api.likeBook({ book_id: detail.value.book_id }) as any;
      if (res.code === 0 || res.code === 200) {
        isFav.value = true;
        detail.value.isFav = true;
        if (res.data && res.data.fav_num !== undefined) {
          favNum.value = Number(res.data.fav_num);
          detail.value.favNum = favNum.value;
        } else {
          favNum.value = previousFavNum + 1;
          detail.value.favNum = favNum.value;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else {
      const res = isStandalone
        ? await api.bookUnlikePost({ post_id: detail.value.id }) as any
        : await api.unlikeBook({ book_id: detail.value.book_id }) as any;
      if (res.code === 0 || res.code === 200) {
        isFav.value = false;
        detail.value.isFav = false;
        if (res.data && res.data.fav_num !== undefined) {
          favNum.value = Number(res.data.fav_num);
          detail.value.favNum = favNum.value;
        } else {
          favNum.value = Math.max(0, previousFavNum - 1);
          detail.value.favNum = favNum.value;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

// Toggle like for collection item
async function toggleCollectionLike(item: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
    return;
  }

  // 合集列表里这一项的作品 id 是 post_id。列表数据是 loadCollections 映射出来的，
  // 字段只有 post_id / title / cover / likes / liked ... 根本没有 id，
  // 原来传 item.id 等于传了 undefined，接口直接回参数错误。
  const postId = item?.post_id;
  if (!postId) return;

  try {
    const previousLikes = Number(item.likes) || 0;
    const isCurrentPost = detail.value && postId == detail.value.id;
    if (!item.liked) {
      // Like collection item
      const res = await api.likePost({ post_id: postId }) as any;
      if (res.code == 0 || res.code == 200) {
        item.liked = true;
        // 原来这里写的是 likes.value —— 那是详情页顶部整篇作品的赞数，
        // 结果列表这一项的数字不动，反而把顶部的赞数冲掉了。
        // 取消点赞那条分支本来就是改 item.likes，两边保持一致。
        item.likes = previousLikes + 1;
        // 点的正好是当前正在看的这一话时，把顶部的点赞态一起同步过去
        if (isCurrentPost) {
          liked.value = true;
          likes.value = previousLikes + 1;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else {
      // Unlike collection item
      const res = await api.dislikePost({ post_id: postId }) as any;
      if (res.code === 0 || res.code === 200) {
        item.liked = false;
        item.likes = Math.max(0, previousLikes - 1);
        if (isCurrentPost) {
          liked.value = false;
          likes.value = Math.max(0, previousLikes - 1);
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function share() {
  const id = route.query.id as string;
  if (!id) return;

  const shareUrl = `${window.location.origin}/detail?id=${id}`;

  try {
    await navigator.clipboard.writeText(shareUrl);
    toast(t('userHome.shareSuccess'));
    trackShare({ method: "copy_link", itemId: id });
  } catch (e) {
    console.log(e);
  }
}

function formatNumber(n: number | undefined) {
  if (n === 0 || n === undefined) return '0';
  return n.toLocaleString();
}

// Click Outside to close menus
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  if (showSubtitleMenu.value) {
    const subtitleControl = (target as HTMLElement).closest?.('.subtitle-control');
    if (!subtitleControl) {
      showSubtitleMenu.value = false;
    }
  }

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
    // 退出全屏时，恢复右侧面板显示
    if (!isCollectionMode.value) {
      // 非合集模式：退出全屏后恢复右侧面板（覆盖 type 1/3/4/5）
      isRightPanelHidden.value = false;
    } else if (detail.value.type === '1') {
      // 合集模式 + 图片类型：恢复并切到合集 tab
      isRightPanelHidden.value = false;
      activeTab.value = 'collection';
    }
  }
}

// Disable F12 and right-click context menu
// --- 图片(4) / 视频(5) 上下切作品：键盘方向键、滚轮、按住左键上下拖 ---
// 三种都只在「独立作品」（非合集）下生效；合集模式换集走右栏列表。

function canSwitchWork(): boolean {
  return !isCollectionMode.value && isStandaloneType.value;
}

// 焦点在输入框 / 富文本里时不接管方向键，否则光标没法上下移动
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  if (el.isContentEditable) return true;
  return !!el.closest('input, textarea, select, [contenteditable="true"]');
}

// 这些元素上按下左键是要操作它们本身的，不当成切作品的手势
function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  return !!el.closest('button, a, input, textarea, select, [contenteditable="true"], .nav-arrows, .input-area, .video-controls, .progress-bar, .control-bar');
}

// 上下拖动（鼠标按住左键 / 手指滑动）超过这个距离才算一次切换。
// 45px：比手抖 / 点按时的抖动（几个像素）大得多，不会误触；
// 又比 60px 轻一截，有翻页意图的一划就能到，不用刻意划一大段。
const DRAG_SWITCH_THRESHOLD = 45;
// 超过这个距离就算「拖」不算「点」：抬手带出的 click 一律吞掉。
// 不这么做的话，在图片上拖一下（没够切换距离、或者已经是第一个/最后一个）
// 抬手就把全屏预览打开了。
const DRAG_CLICK_CANCEL_THRESHOLD = 8;
let dragPointerId: number | null = null;
let dragStartY: number | null = null;
let dragStartX = 0;
let dragMoved = false;
let dragSwitched = false;

// 用 Pointer Events 而不是 mouse* —— 一套同时覆盖鼠标、触摸屏和手写笔。
// 触屏上不会有合成的 mousemove（合成的 mousedown/mouseup 是 touchend 之后才补发的），
// 只监听 mouse* 的话手指划动永远进不来。
function handleLeftPanelPointerDown(event: PointerEvent) {
  // 上下拖 / 触屏滑动切作品关掉了：误触太多，切换只走右侧的上下箭头。要恢复删掉这行即可
  return;
  // 鼠标只认左键；触摸和手写笔的 button 同样是 0
  if (event.button !== 0) return;
  if (!canSwitchWork()) return;
  if (isInteractiveTarget(event.target) || isComposerTarget(event.target)) return;
  // 图片默认可拖拽，鼠标拖会拖出一个半透明副本挡住手势；
  // 触摸不走原生拖拽，这里不拦，免得把点击也一起吃掉
  if (event.pointerType === 'mouse' && (event.target as HTMLElement)?.tagName === 'IMG') {
    event.preventDefault();
  }

  dragPointerId = event.pointerId;
  dragStartY = event.clientY;
  dragStartX = event.clientX;
  dragMoved = false;
  dragSwitched = false;
  window.addEventListener('pointermove', handleDragMove);
  window.addEventListener('pointerup', handleDragEnd);
  // 浏览器把手势接管过去（比如判成页面滚动）时会派发 pointercancel，要一起收尾
  window.addEventListener('pointercancel', handleDragEnd);
}

function handleDragMove(event: PointerEvent) {
  // 多指时只跟第一根手指，别被第二根带跑
  if (dragStartY === null || event.pointerId !== dragPointerId) return;
  const dy = event.clientY - dragStartY;
  const dx = event.clientX - dragStartX;
  // 先记「这次是拖不是点」，和够不够切换距离无关
  if (!dragMoved && Math.hypot(dx, dy) > DRAG_CLICK_CANCEL_THRESHOLD) dragMoved = true;

  if (dragSwitched) return;
  if (Math.abs(dy) < DRAG_SWITCH_THRESHOLD) return;

  // 上划 = 下一个作品，下划 = 上一个作品（和短视频的手势一致）
  const goingNext = dy < 0;
  // 已经是第一个 / 最后一个时这个手势不生效，直接不切换（click 仍然会被吞掉，
  // 因为拖都拖了，不该顺手再触发图片全屏）
  if (goingNext ? isLast.value : isFirst.value) return;

  dragSwitched = true;
  if (goingNext) goNext();
  else goPrev();
  // 一次手势只切一次，剩下的移动不再响应
  window.removeEventListener('pointermove', handleDragMove);
}

// 拖动之后抬手带出来的那一下 click 不要再落到底下的元素上 ——
// 图片上是全屏预览，视频上是播放/暂停，都不该被一次拖拽顺手触发
function swallowClickOnce(event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();
  window.removeEventListener('click', swallowClickOnce, true);
}

function handleDragEnd(event?: PointerEvent) {
  if (event && dragPointerId !== null && event.pointerId !== dragPointerId) return;
  // 只要真的拖动过就吞掉 click —— 不管有没有切成功。
  // 切换到头了、或者没拖够 60px，都不该顺手触发图片全屏 / 视频播放暂停。
  const moved = dragMoved;
  dragPointerId = null;
  dragStartY = null;
  dragMoved = false;
  dragSwitched = false;
  window.removeEventListener('pointermove', handleDragMove);
  window.removeEventListener('pointerup', handleDragEnd);
  window.removeEventListener('pointercancel', handleDragEnd);

  if (moved) {
    window.addEventListener('click', swallowClickOnce, true);
    // 没有后续 click 时（比如在窗口外抬手）也要把监听摘掉
    setTimeout(() => window.removeEventListener('click', swallowClickOnce, true), 0);
  }
}

function stopDragTracking() {
  dragPointerId = null;
  dragStartY = null;
  dragMoved = false;
  dragSwitched = false;
  window.removeEventListener('pointermove', handleDragMove);
  window.removeEventListener('pointerup', handleDragEnd);
  window.removeEventListener('pointercancel', handleDragEnd);
  window.removeEventListener('click', swallowClickOnce, true);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
    return;
  }

  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  // 方向键切作品关掉了：切换只走右侧的上下箭头。要恢复删掉这行即可
  return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
  if (!canSwitchWork()) return;
  if (isTypingTarget(e.target)) return;

  e.preventDefault();
  if (e.key === 'ArrowUp') goPrev();
  else goNext();
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
}

onMounted(async () => {
  // 是从上 / 下一个滑过来的：这次加载不弹全屏遮罩（方向由 App.vue 在滑完后清空）
  if (pageSlideDir.value) slideLoading.value = true;
  // 初始化语言设置
  await initLanguage();

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("contextmenu", handleContextMenu);

  if (!isNovelType.value) {
    getCountry();
    fetchBookGenSwitch();
    fetchDetail(id.value);
  }

  nextTick(() => {
    updateScrollContentPadding();

    // Add scroll listener for loading more comments
    const scrollContent = document.querySelector('.scroll-content');
    if (scrollContent) {
      scrollContent.addEventListener('scroll', handleCommentsScroll);
    }

    // Listen for fullscreen change on document (handles video -> page fullscreen promotion)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
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
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("contextmenu", handleContextMenu);
  stopDragTracking();

  // Remove scroll listener
  const scrollContent = document.querySelector('.scroll-content');
  if (scrollContent) {
    scrollContent.removeEventListener('scroll', handleCommentsScroll);
  }

  // Remove fullscreen change listener
  document.removeEventListener('fullscreenchange', handleFullscreenChange);

  // Disconnect collection load-more observer
  if (collectionObserver) {
    collectionObserver.disconnect();
    collectionObserver = null;
  }
});

watch(
  () => route.query.id,
  async (newId) => {
    if (newId) {
      id.value = Number(newId);
      contentType.value = route.query.tab as string || route.query.contentType as string || "";
      await getCountry();
      if (!isNovelType.value) {
        fetchDetail(Number(newId));
      }
    }
  },
);
</script>

<style lang="scss" scoped>
  @use '@/scss/Detail.scss';
</style>
