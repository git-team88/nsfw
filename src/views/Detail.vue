<template>
  <div class="detail-view">
    <div class="" v-if="detail.type == '1' || detail.type == '3'">
      <div class="close-page-btn" @click="isCollectionMode ? exitCollectionMode() : closePage()">
        <div class="back-icon-container" v-if="isCollectionMode">
          <span class="back-icon"></span>
          <div class="info-tooltip">
            {{ t('detail.exitCollectionPlayMode') }}
          </div>
        </div>

        <span v-else></span>
      </div>

      <UploadMask :visible="isLoading" :text="loadText"></UploadMask>

      <div class="main-container" :class="{ 'isRightPanelHidden': isRightPanelHidden }">
        <div class="left-panel" :class="{ 'scroll-panel': detail?.type == '1' || detail?.type == '3', 'slide-out': isSliding, 'slide-in': isSlidingIn, 'type-1': detail?.type == '1' }" @wheel="handleLeftPanelWheel">
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

                    <div class="last-chapter-section" v-if="isChapterNavigationLoaded && !nextChapterId && (isImagesLoaded || detail.type !== '1')">
                      <span class="last-chapter-txt">{{ t("detail.lock.lastChapterTip") }}</span>
                      <button class="last-chapter-btn" @click="goToHomePage">{{ t("detail.lock.goGenerate") }}</button>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <div v-if="detail.type == '3'" class="video-wrapper" @mouseenter="isVideoHovered = true" @mouseleave="onVideoMouseLeave">
              <div v-if="!isVideoLocked && !isLoading" @click="togglePlay">
                <div class="video-poster" v-if="isVideoEnded && currentVideoPoster">
                  <img :src="currentVideoPoster" alt="Cover" draggable="false" />
                </div>

                <div class="video-loading" v-if="isVideoLoading">
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
                  @playing="onVideoPlaying"
                  @volumechange="onVolumeChange"
                  @ended="onVideoEnded"
                ></video>

                <div class="subtitle-overlay" v-if="currentSubtitleText && selectedSubtitleLang" v-html="currentSubtitleText.replace(/\n/g, '<br/>')"></div>

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
                      <div class="subtitle-control" v-if="subtitles.length > 0" @click.stop="showSubtitleMenu = !showSubtitleMenu">
                          <span class="subtitle-label">{{ t('detail.subtitle') }}：{{ selectedSubtitleLang ? t(subtitleLangMap[selectedSubtitleLang] || '') : t('detail.subtitleNone') }}</span>
                        <svg class="subtitle-arrow" viewBox="0 0 12 12" width="10" height="10"><path d="M3 5l3 3 3-3" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <div class="subtitle-menu" v-show="showSubtitleMenu" @click.stop>
                          <div class="subtitle-option" :class="{ active: selectedSubtitleLang === lang }" v-for="lang in subtitleMenuLangs" :key="lang" @click="selectSubtitle(lang)">{{ lang === 'none' ? t('detail.subtitleNone') : t(subtitleLangMap[lang]) }}</div>
                        </div>
                      </div>
                       <div class="volume-control" :class="{ 'volume-active': showVolumeSlider || isDraggingVolume }" @mouseenter="showVolumeSlider = true" @mouseleave="onVolumeControlLeave">
                         <div class="volume-slider" @mouseenter="showVolumeSlider = true" @mouseleave="onVolumeSliderLeave">
                           <div ref="volumeTrackRef" class="volume-track" @mousedown="onVolumeDragStart">
                             <div class="volume-filled" :style="{ height: (volume * 100) + '%' }"></div>
                          </div>
                        </div>
                        <div class="volume-btn" @click.stop="toggleMute">
                          <img v-if="volume > 0" src="@/assets/images/detail/volume.png" alt="Volume" />
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

                <div class="play-overlay" v-show="!isPlaying && !isVideoLoading" @click.stop="togglePlay">
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

            <template v-else-if="detail.type == '1' && !isCollectionMode">
              <div class="image-stack" ref="imageStackRef" @scroll="handleImageStackScroll" :style="{ cursor: isImageFullscreen ? 'zoom-out' : 'zoom-in' }">
                <!-- 敏感内容：整个图片列表区域显示开启面板 -->
                <SensitiveNsfwPanel
                  v-if="isSensitiveContentLocked"
                  :isTeenager="detail.is_teenager == 1"
                  :isChina="isChinaRegion"
                  @enable="enableSensitiveBrowsing"
                  @confirm-adult="confirmAdultBrowsing"
                />

                <template v-else-if="!isLoading">
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

                  <div class="last-chapter-section" v-if="isChapterNavigationLoaded && !nextChapterId && (isImagesLoaded || detail.type != '1')">
                    <span class="last-chapter-txt">{{ t("detail.lock.lastChapterTip") }}</span>
                    <button class="last-chapter-btn" @click="goToHomePage">{{ t("detail.lock.goGenerate") }}</button>
                  </div>
                </template>
              </div>
            </template>

            <!-- Collection Info Bar -->
            <div
              class="collection-info-bar"
              v-if="detail.book_id != '' && Number(detail.book_id) > 0 && !isCollectionMode && !isSensitiveContentLocked"
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
            <div class="collection-mode-bar" v-else-if="detail.book_id !== '' && Number(detail.book_id) > 0 && isCollectionMode">
              <div class="current-episode">
                <span class="episode-number">第{{ currentCollectionIndex + 1 }}集</span>
                <span class="episode-line"></span>
                <span class="episode-title">{{ currentCollection?.title }}</span>
              </div>
            </div>
          </div>

          <div class="nav-arrows on" v-if="isCollectionMode">
            <button class="nav-btn up" @click="navigateToChapter({ post_id: prevChapterId })" v-if="prevChapterId"></button>
            <button class="nav-btn down" @click="navigateToChapter({ post_id: nextChapterId })" v-if="nextChapterId"></button>
          </div>

          <div class="nav-arrows" v-else>
            <button class="nav-btn up" @click="goPrev" v-if="!isFirst"></button>
            <button class="nav-btn down" @click="goNext" v-if="!isLast"></button>
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
                @click="activeTab = 'collection'; loadCollections()"
                v-if="detail.book_id && Number(detail.book_id) > 0"
              >
                {{ t('detail.collection') }}
              </div>
            </div>

          </div>

          <!-- Collection Info Bar (only shows in collection tab) -->
          <div class="collection-info-section" v-if="activeTab == 'collection' && detail.book_id !== '' && Number(detail.book_id) > 0">
            <div class="collection-info-row">
              <div class="collection-title">{{ detail.book_title }}</div>
            </div>
            <div class="collection-chapters-count">
              <span>{{ t('detail.updatedChapters', { count: chapterCount }) }}</span>

              <div class="collection-link" @click="goToCollectionDetail">
                {{ t('detail.viewCollectionInfo') }}
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
                accept="video/*"
                class="hidden-file-input"
                @change="handleFileUpload"
              />
            </div>
          </div>

          <!-- Collection Tab Content -->
          <div v-else-if="activeTab === 'collection'">
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
                  :key="item.id"
                  :class="{ 'active': item.post_id == detail.id }"
                  @click="playCollectionItem(item)">
                <div class="collection-content">
                  <div class="collection-cover-wrapper" :class="{ 'playing': isCollectionItemPlaying(index) }">
                    <img class="collection-cover" :src="processImageUrl(item.cover) || ''" alt="" />
                    <div class="collection-subscribe-badge" v-if="item.access_rights == '2' && detail.author && detail.author.id !== uid">{{ t('detail.subscribe') }}</div>
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
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-else-if="detail.type == '2'">
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
  </div>
</template>

<script setup lang="ts" name="Detail">
import NovelDetail from "@/views/NovelDetail.vue"
import ReportModal from "@/components/ReportModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import PreviewBig from "@/components/PreviewBig.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";
import SensitiveContentAdultConfirmModal from "@/components/SensitiveContentAdultConfirmModal.vue";
import SensitiveContentConfirmModal from "@/components/SensitiveContentConfirmModal.vue";
import SensitiveNsfwPanel from "@/components/SensitiveNsfwPanel.vue";

import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { formatTimestamp, initLanguage, processImageUrl } from "@/util/utils";
import collapseIcon from "@/assets/images/detail/show.png";
import expandIcon from "@/assets/images/detail/hide.png";
import api from "@/api/index";
import EmptyState from "@/components/EmptyState.vue";
import { baseUrl } from "@/util/config";
import defaultAvatar from "@/assets/images/base/avatar.png";
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
const contentType = ref<string>(route.query.contentType as string || "");
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
const selectedSubtitleLang = ref<string>('');
const showSubtitleMenu = ref(false);
const subtitleCues = ref<{ start: number; end: number; text: string }[]>([]);
const currentSubtitleText = ref('');

const subtitleLangMap: Record<string, string> = { cn: 'novel.language.zh', tc: 'novel.language.tc', jp: 'novel.language.jp', en: 'novel.language.en' };

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

function enableSubtitleTrack() {
  if (!videoRef.value || !selectedSubtitleLang.value) return;
  nextTick(() => {
    if (!videoRef.value) return;
    const tracks = videoRef.value.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].language === selectedSubtitleLang.value) {
        tracks[i].mode = 'showing';
        break;
      }
    }
  });
  setTimeout(() => {
    if (!videoRef.value) return;
    const tracks = videoRef.value.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].language === selectedSubtitleLang.value) {
        tracks[i].mode = 'showing';
        break;
      }
    }
  }, 1000);
}

watch([() => videoRef.value, () => subtitles.value.length, selectedSubtitleLang], () => {
  enableSubtitleTrack();
});

const subtitleMenuLangs = computed(() => {
  const langs = subtitles.value.map(s => s.lang).filter(l => l !== selectedSubtitleLang.value);
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
const isAllowSensitiveContent = ref(localStorage.getItem('allowSensitiveContent') == '1');
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
  is_teenager: number;
  is_nsfw: string;
  book_is_nsfw: number;
  book_id: string;
  book_title: string;
  chapter_index: string | number;
  latest_read_chapter_index: string | number;
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
  is_teenager: 1,
  is_nsfw: '0',
  book_is_nsfw: 0,
  book_id: '',
  book_title: '',
  chapter_index: '',
  latest_read_chapter_index: ''
});

// Tab state
const activeTab = ref('detail');

// Collection Mode
const isCollectionMode = ref(false);
const currentCollectionIndex = ref(0);
const pendingRecordHistory = ref(false);

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

watch(currentVideoSrc, () => {
  // 切换视频源时重置自动播放标记，新视频仍需静音自动播放以符合浏览器策略
  hasAutoPlayed.value = false;
});

watch([currentVideoSrc, videoRef], () => {
  if (!currentVideoSrc.value || !videoRef.value) return;
  if (detail.value.type !== '3') return;

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

// Show nsfw parameter based on user region
// userRegion.value = true means NOT in China, false means IN China
// Pass show_nsfw only when NOT in China (userRegion.value = true)
const showNsfw = computed(() => {
  return userRegion.value ? (isAllowSensitiveContent.value ? 1 : 0) : undefined;
});

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
  if (localStorage.getItem('token')) {
    pendingRecordHistory.value = true;
  }

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
    if (localStorage.getItem('token')) {
      pendingRecordHistory.value = true;
    }
  }
}

// Go to next chapter directly (used by "下一集" button)
async function goToNextChapter() {
  if (nextChapterId.value) {
    isCollectionMode.value = true;
    activeTab.value = 'collection';
    isRightPanelHidden.value = false;
    await loadChapters();

    // Record view history before navigating to next chapter
    // This is done before navigation to avoid losing state due to component reinitialization
    if (detail.value.book_id && Number(detail.value.book_id) > 0 && chapterCount.value > 1) {
      await recordViewHistory();
    }

    router.replace({
      path: '/detail',
      query: {
        ...route.query,
        id: nextChapterId.value,
        collected: '1' // Add collected=1 to trigger collection mode on page load
      }
    });
  }
}

// Go to collection detail page
function goToCollectionDetail() {
  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    router.push(`/collection/${detail.value.book_id}?uid=${detail.value.author?.id}`);
  }
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
          id: targetChapterId,
          collected: '1' // Add collected=1 to trigger collection mode on page load
        }
      });
      if (localStorage.getItem('token')) {
        pendingRecordHistory.value = true;
      }
    }
  }
}

// Load chapters (collection episodes)
async function loadChapters() {
  if (!detail.value.book_id || Number(detail.value.book_id) == 0) {
    return;
  }

  try {
    const response = await api.singleCollection(String(detail.value.book_id), 1, 50) as any;
    if (response.code == 0) {
      const newCollections = response.data?.data || [];
      collections.value = newCollections.map((chapter: any) => ({
        ...chapter,
        type: String(detail.value.type)
      }));
      chapterCount.value = response.data?.allnums || 0;
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
      id: chapter.post_id,
      collected: '1' // Add collected=1 to trigger collection mode on page load
    }
  });

  if (detail.value.book_id && Number(detail.value.book_id) > 0) {
    isCollectionMode.value = true;
  }

  activeTab.value = 'collection';
  isRightPanelHidden.value = false;

  await loadChapters();
  if (localStorage.getItem('token')) {
    pendingRecordHistory.value = true;
  }
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
  isCollectionMode.value = false;
  activeTab.value = 'detail';
  currentCollectionIndex.value = 0;
  // Reset isNearBottom to false when exiting collection mode
  isNearBottom.value = false;
  // Scroll to top when exiting collection mode
  if (imageStackRef.value) {
    imageStackRef.value.scrollTop = 0;
  }
  if (comicScrollRef.value) {
    comicScrollRef.value.scrollTop = 0;
  }

  // Reset navigation and image loading states so last-chapter-section
  // doesn't appear immediately on exit - wait for proper re-evaluation
  prevChapterId.value = '';
  nextChapterId.value = '';
  isChapterNavigationLoaded.value = false;
  isImagesLoaded.value = false;
  loadedImageCount.value = 0;

  // Re-calculate chapter navigation for non-collection mode
  setChapterNavigation();
}

// Record view history for collection episodes
async function recordViewHistory() {
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  if (!isCollectionMode.value || chapterCount.value <= 1) {
    return;
  }

  const bookId = detail.value.book_id;
  const chapterIndex = currentCollectionIndex.value + 1;

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
function handleLeftPanelWheel(event: WheelEvent) {
  // Only in non-collection mode and for video type
  if (isCollectionMode.value) return;
  // For image type (1) and comic type (2), don't handle wheel - use right scrollbar instead
  if (detail.value.type === '1' || detail.value.type === '2') return;
  if (detail.value.type !== '3') return;

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
const collectionListRef = ref<HTMLElement | null>(null);

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

// Navigation arrows
const hasPrev = ref(false);
const hasNext = ref(false);
const prevId = ref<string | null>(null);
const nextId = ref<string | null>(null);
const isSliding = ref(false);
const isSlidingIn = ref(false);

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
async function fetchSubtitles(postId: number) {
  try {
    const res = await api.getSubtitlesPublic({ post_id: postId }) as any;
    if (res.code == 0 || res.code == 200) {
      const list = res.data?.subtitles || [];
      subtitles.value = Array.isArray(list) ? list : [];
      const navLang = locale.value == 'zh' ? 'cn' : locale.value == 'tc' ? 'tc' : locale.value == 'jp' ? 'jp' : 'en';
      if (subtitles.value.some(s => s.lang == navLang)) {
        selectedSubtitleLang.value = navLang;
      } else {
        selectedSubtitleLang.value = '';
      }
    } else {
      subtitles.value = [];
      selectedSubtitleLang.value = '';
    }
  } catch {
    subtitles.value = [];
    selectedSubtitleLang.value = '';
  }
}

async function fetchDetail(newId: number) {
  // Get query parameters at the beginning
  const type = route.query.type as string || "";
  const cid = route.query.cid as string || "";
  const contentType = route.query.contentType as string || "";
  const language = locale.value == 'zh' ? 'cn' : locale.value;
  // 未登录用户确认满18岁后缓存的成年标识，随详情接口下发
  // 仅未登录且本地自声明满18岁（is_adult=1）时才传该参数；其余情况不传（JSON.stringify 会忽略 undefined）
  const isAdult = (!localStorage.getItem('token') && localStorage.getItem('is_adult') == '1') ? 1 : undefined;

  try {
    id.value = newId;

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
          test: 1,
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
          test: 1,
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

    const subtitlePromise = api.getSubtitlesPublic({ post_id: newId }).catch(() => null);

    const [res, subRes] = await Promise.all([detailPromise, subtitlePromise]);

    if (res.code == 0 || res.code == 200) {
      const data = res.data.post || res.data;

      let bookIsNsfw = 0;
      if (data.book_id && Number(data.book_id) > 0) {
        try {
          const bookRes = await api.getCollectionDetail(String(data.book_id)) as any;
          if (bookRes.code === 0) {
            const bookData = bookRes.data?.book_info || bookRes.data;
            if (bookData && (bookData.is_nsfw == 1 || bookData.is_nsfw == '1')) {
              bookIsNsfw = 1;
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
        is_teenager: data.is_teenager,
        is_nsfw: data.is_nsfw || '0',
        book_is_nsfw: bookIsNsfw,
        book_id: data.book_id || '',
        book_title: data.book_title || '',
        chapter_index: data.chapter_index || '',
        latest_read_chapter_index: res.data.latest_read_chapter_index || ''
      } as DetailData;

      setSeoMeta(
        detail.value.title,
        detail.value.description,
        detail.value.type
      );

      if (detail.value.type === '3' && subRes && ((subRes as any).code === 0 || (subRes as any).code === 200)) {
        const list = (subRes as any).data?.subtitles || (subRes as any).data || [];
        if (Array.isArray(list) && list.length > 0) {
          subtitles.value = list;
          const navLang = locale.value === 'zh' ? 'cn' : locale.value == 'tc' ? 'tc' : locale.value === 'jp' ? 'jp' : 'en';
          if (subtitles.value.some(s => s.lang === navLang)) {
            selectedSubtitleLang.value = navLang;
          } else {
            selectedSubtitleLang.value = '';
          }
        }
      }

      // Load chapters if it's part of a collection
      if (detail.value.book_id != '' && Number(detail.value.book_id) > 0) {
        await loadChapters();
        if (pendingRecordHistory.value) {
          pendingRecordHistory.value = false;
          await recordViewHistory();
        }

        // Auto enter collection mode when coming from collection navigation
        if (route.query.collected == '1' || (route.query.type == '4' && detail.value.author.id && detail.value.author.id === uid)) {
          isCollectionMode.value = true;
          activeTab.value = 'collection';
          isRightPanelHidden.value = false;
        }
      }

      totalComments.value = res.data.comment_total || '';

      // Update local state
      likes.value = detail.value.likes;
      liked.value = detail.value.liked;

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
        is_teenager: 1,
        is_nsfw: '0',
        book_is_nsfw: 0,
        book_id: "",
        book_title: "",
        chapter_index: "",
        latest_read_chapter_index: ""
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
      is_teenager: 1,
      is_nsfw: '0',
      book_is_nsfw: 0,
      book_id: "",
      book_title: "",
      chapter_index: "",
      latest_read_chapter_index: ""
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
    const pageSize = 50;

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

        // 检查是否有更多数据
        hasMoreCollections.value = newCollections.length == response.data.allnums;

        if (append) {
          collections.value = [...collections.value, ...transformedCollections];
          currentCollectionPage.value = page;
        } else {
          collections.value = transformedCollections;
        }
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
    // Extract username from mention (remove all @ symbols)
    const username = mention.replace(/@/g, '');

    // Call getUserId API to get user ID
    const res = await api.getUserId({ nickname: username }) as any;

    if (res.code === 0 || res.code === 200) {
      const userId = res.data?.user_id
      if (userId) {
        // Navigate to user home page
        const url = router.push({ path: "/user-home", query: { id: userId } });
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

const isSensitiveContent = computed(() => {
  return (detail.value.book_id && Number(detail.value.book_id) > 0)
    ? detail.value.book_is_nsfw == 1
    : detail.value.is_nsfw == '1';
});

const isSensitiveContentLocked = computed(() => {
  if (isLoading.value) return false;
  if (isPaidContentLocked.value) return false;

  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;

  // Check if user is teenager or content is sensitive
  const isTeenager = detail.value.is_teenager == 1;

  if (!isSensitiveContent.value) return false;
  // 中国大陆用户：敏感内容始终锁定，不可开启
  if (isChinaRegion.value) return true;
  if (isTeenager) return true;
  return !isAllowSensitiveContent.value;
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
  tryAutoPlay();
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
      hasAutoPlayed.value = true;
      isPlaying.value = true;
      isVideoLoading.value = false;
    }).catch(() => {
      // 带声自动播放被拦截 → 回退静音重试
      if (wantSound && videoRef.value) {
        videoRef.value.muted = true;
        videoRef.value.play().then(() => {
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

  // 在合集模式下，自动跳转到下一集，但如果是最后一集则暂停
  if (isCollectionMode.value && currentCollectionIndex.value < collections.value.length - 1) {
    // 获取下一集
    const nextEpisode = collections.value[currentCollectionIndex.value + 1];
    // 检查下一集是否需要订阅以及用户是否已订阅
    const needSubscription = nextEpisode.requiresSubscription && !nextEpisode.isSubscribed;

    // 延迟一段时间后自动跳转，给用户时间看到视频结束画面
    setTimeout(() => {
      currentCollectionIndex.value++;
      // 重置视频状态
      isVideoLoading.value = true;
      isVideoEnded.value = false;
    }, 2000);
  }
  // 如果是最后一集，保持暂停状态
  else if (isCollectionMode.value && currentCollectionIndex.value >= collections.value.length - 1) {
    // 保持当前状态，不自动播放
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

  const onMove = (moveEvent: MouseEvent) => {
    if (!isDraggingProgress.value || !videoRef.value || !duration.value) return;
    const bar = progressBarRef.value;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = moveEvent.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    videoRef.value.currentTime = percent * duration.value;
    currentTime.value = percent * duration.value;
  };

  const onUp = () => {
    isDraggingProgress.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function toggleMute() {
  if (!videoRef.value) return;
  if (volume.value > 0) {
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

  if (window.history.length <= 1 || isFromExternal || (isReferrerEmpty && window.history.length <= 2)) {
    router.push('/');
  } else {
    router.back();
  }
}

function goToHomePage() {
  router.push('/');
}

function confirmSensitiveContent() {
  showSensitiveContentConfirmModal.value = false;
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  if (pendingChapter.value) {
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
  // 选择"否"：未满18岁，直接关闭不开启
  if (!isAdult) {
    pendingChapter.value = null;
    return;
  }
  // 选择"是"：声明已满18岁
  if (localStorage.getItem('token')) {
    // 已登录：写回后端 is_adult
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
    // 未登录：仅存本地，不请求接口
    localStorage.setItem('is_adult', '1');
  }
  // 声明成年后，直接开启敏感内容浏览，不再二次弹「允许敏感？」确认弹窗
  localStorage.setItem('allowSensitiveContent', '1');
  isAllowSensitiveContent.value = true;
  const chapter = pendingChapter.value;
  pendingChapter.value = null;
  if (chapter) {
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
      router.push(`/subscription-payment?uid=${detail.value.author.id}`);
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
    // 在非合集模式下，直接切换页面
    activeTab.value = 'detail';
    router.replace({
      path: '/detail',
      query: {
        ...route.query,
        id: prevId.value
      }
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
    // 在非合集模式下，直接切换页面
    activeTab.value = 'detail';
    router.replace({
      path: '/detail',
      query: {
        ...route.query,
        id: nextId.value
      }
    });
  }
}

// Media
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

// Toggle like for collection item
async function toggleCollectionLike(item: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    goAuth();
    return;
  }

  try {
    const previousLiked = item.liked;
    const previousLikes = item.likes;
    if (!item.liked) {
      // Like collection item
      const res = await api.likePost({ post_id: item.id }) as any;
      if (res.code == 0 || res.code == 200) {
        item.liked = true;

        likes.value = previousLikes + 1;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else {
      // Unlike collection item
      const res = await api.dislikePost({ post_id: item.id }) as any;
      if (res.code === 0 || res.code === 200) {
        item.liked = false;
        item.likes = Math.max(0, previousLikes - 1);
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
    // 退出全屏时，如果是图片类型，恢复右侧面板显示
    if (detail.value.type === '1') {
      isRightPanelHidden.value = false;
      activeTab.value = isCollectionMode.value ? 'collection' : 'detail';
    }
  }
}

// Disable F12 and right-click context menu
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
  }
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
}

onMounted(async () => {
  // 初始化语言设置
  await initLanguage();

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("contextmenu", handleContextMenu);

  getCountry();
  fetchDetail(id.value);

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

  // Remove scroll listener
  const scrollContent = document.querySelector('.scroll-content');
  if (scrollContent) {
    scrollContent.removeEventListener('scroll', handleCommentsScroll);
  }

  // Remove fullscreen change listener
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

watch(
  () => route.query.id,
  async (newId) => {
    if (newId) {
      id.value = Number(newId);
      await getCountry();
      fetchDetail(Number(newId));
    }
  },
);
</script>

<style lang="scss" scoped>
  @use '@/scss/Detail.scss';
</style>
