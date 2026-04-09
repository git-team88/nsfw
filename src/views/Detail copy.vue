<template>
  <div class="detail-view">
    <div class="close-page-btn" @click="isCollectionMode ? exitCollectionMode() : closePage()">
      <span v-if="!isCollectionMode"></span>
      <span class="back-icon" v-else></span>
    </div>

    <UploadMask :visible="isLoading" :text="loadText"></UploadMask>

    <div class="main-container">
      <div class="left-panel" :class="{ 'scroll-panel': detail?.type === '1' || detail?.type === '2', 'slide-out': isSliding, 'slide-in': isSlidingIn, 'type-1': detail?.type === '1' }" @wheel="handleLeftPanelWheel">
        <div class="media-container" :key="detail?.id">
          <template v-if="isCollectionMode">
            <!-- Video content -->
            <div v-if="detail.type == '3'" class="video-wrapper">
              <div v-if="!isVideoLocked">
                <div class="video-poster" v-if="isVideoEnded && currentCollection.cover">
                  <img :src="currentCollection.cover" alt="Cover" />
                </div>

                <div class="video-loading" v-if="isVideoLoading">
                  <div class="loading-spinner"></div>
                </div>

                <video
                  ref="videoRef"
                  class="video-player"
                  :src="currentCollection.videoUrl || detail.videoUrl"
                  :poster="currentCollection.cover"
                  preload="auto"
                  playsinline
                  autoplay
                  muted
                  controls
                  controlslist="nodownload noremoteplayback noplaybackrate"
                  disablePictureInPicture
                  v-show="!isVideoLoading"
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

                <div class="play-overlay" v-show="!isPlaying && !isVideoBuffering" @click="togglePlay">
                  <img src="@/assets/images/detail/play.png" alt="Play" />
                </div>

                <!-- Custom Fullscreen Toggle Button -->
                <div class="fullscreen-btn" @click.stop="togglePageFullscreen">
                  <img v-if="!isPageFullscreen" src="@/assets/images/detail/fullscreen.png" alt="Fullscreen" />
                  <img v-else src="@/assets/images/detail/unfull.png" alt="Exit Fullscreen" />
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

            <!-- Image content -->
            <div v-else-if="detail.type == '1'" class="comic-gallery">
              <div class="comic-scroll" ref="comicScrollRef" @scroll="handleComicScroll">
                <div
                  class="comic-image-wrap"
                  v-for="(img, index) in currentCollection.images || detail.images"
                  :key="index"
                  @mouseenter="hoveredComicIndex = index"
                  @mouseleave="hoveredComicIndex = -1"
                  @click="toggleComicZoom(index)"
                >
                  <img :src="img.image_url" alt="" class="comic-image" />
                  <div class="comic-zoom-icon" v-if="hoveredComicIndex == index && isImageFullscreen">
                    <img src="@/assets/images/detail/small.png" alt="" @click.stop="toggleComicZoom(index)" />
                  </div>
                  <div class="comic-zoom-icon" v-else>
                    <img src="@/assets/images/detail/big.png" alt="Zoom" />
                  </div>
                </div>
              </div>
              <div class="comic-controls">
                <div class="control-btn left" @click="scrollComicLeft">
                  <img src="@/assets/images/detail/left.png" alt="Left" />
                </div>
                <div class="control-btn right" @click="scrollComicRight">
                  <img src="@/assets/images/detail/right.png" alt="Right" />
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="detail.type == '3'">
            <div class="video-wrapper">
              <div v-if="!isVideoLocked">
                <div class="video-poster" v-if="isVideoEnded && detail.cover">
                  <img :src="detail.cover" alt="Cover" />
                </div>

                <div class="video-loading" v-if="isVideoLoading">
                  <div class="loading-spinner"></div>
                </div>

                <video
                  ref="videoRef"
                  class="video-player"
                  :src="detail.videoUrl"
                  :poster="detail.cover"
                  preload="auto"
                  playsinline
                  autoplay
                  muted
                  controls
                  controlslist="nodownload noremoteplayback noplaybackrate nofullscreen"
                  disablePictureInPicture
                  v-show="!isVideoLoading"
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

                <div class="play-overlay" v-show="!isPlaying && !isVideoBuffering" @click="togglePlay">
                  <img src="@/assets/images/detail/play.png" alt="Play" />
                </div>

                <!-- Custom Fullscreen Toggle Button -->
                <div class="fullscreen-btn" @click.stop="togglePageFullscreen">
                  <img v-if="!isPageFullscreen" src="@/assets/images/detail/fullscreen.png" alt="Fullscreen" />
                  <img v-else src="@/assets/images/detail/unfull.png" alt="Exit Fullscreen" />
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

          <template v-else-if="detail.type == '1'">
            <div class="image-stack">
              <div
                class="image-stack-item"
                v-for="(img, index) in detail.images"
                :key="index"
              >
                <template v-if="isImageLocked(index)">
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
                  <div
                    class="image-wrap"
                    @click="handleImageClick(index)"
                    @mouseenter="hoveredImageIndex = index"
                    @mouseleave="hoveredImageIndex = -1"
                  >
                    <img
                      class="stacked-image"
                      :src="img.image_url || ''"
                      alt=""
                    />
                    <div class="image-zoom-icon" v-if="hoveredImageIndex === index && !isImageFullscreen">
                      <img src="@/assets/images/detail/big.png" alt="Zoom" />
                    </div>
                    <div class="image-unzoom-icon" v-else-if="hoveredImageIndex === index && isImageFullscreen">
                      <img src="@/assets/images/detail/small.png" alt="Unzoom" />
                    </div>
                  </div>
                  <div class="subscribe-overlay" v-if="index == 0 && detail.permission == 'partial' && !detail.isSubscribed && detail.author.id !== uid">
                    <span class="subs-tip">{{ t("detail.lock.tip") }}</span>
                    <span class="subs-btn" @click="onSubscribe">
                      {{ t("detail.lock.subscribe") }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- Collection Info Bar -->
          <div
            class="collection-info-bar"
            :class="{ 'near-bottom': detail.type == '1' && isNearBottom }"
            v-if="detail.book_id && Number(detail.book_id) > 0 && !isCollectionMode"
            @click="enterCollectionMode"
          >

            <div class="collection-info">
              <template v-if="detail.type == '2'">
                <span class="comic-title">{{ detail.title }}</span>
              </template>
              <template v-else>
                {{ t('detail.collection') }}:{{ detail.book_title }}
              </template>
            </div>
            <div class="collection-line"></div>
            <div class="collection-status">
              <template v-if="detail.type == '1' && isNearBottom">
                下一集
              </template>
              <template v-else>
                {{ t('detail.updatedToEpisode', { count: chapterCount }) }}
              </template>
            </div>
          </div>

          <!-- Collection Mode Info Bar -->
          <div class="collection-mode-bar" v-else-if="detail.book_id && Number(detail.book_id) > 0">
            <div class="current-episode">
              <span class="episode-title">{{ currentCollectionIndex + 1 }}集：{{ currentCollection?.title }}</span>
            </div>
          </div>
        </div>

        <!-- Page Navigation Arrows (Bottom Right) -->
        <div class="nav-arrows">
          <button class="nav-btn up" @click.stop="goPrev" v-if="!isFirst"></button>
          <button class="nav-btn down" @click.stop="goNext" v-if="!isLast"></button>
        </div>
      </div>

      <!-- Right Side: Info & Comments -->
      <div class="right-panel" v-show="!isRightPanelHidden">
        <!-- Right Header: User Info & Actions -->
        <div class="right-header-box" :class="{ 'with-border': isScrolled }">
          <div class="right-header">
            <div class="user-info" @click="navigateToUserHome">
              <img class="avatar" :src="detail.author.avatar" alt="" />
              <span class="nickname">{{ detail.author.nickname }}</span>
            </div>

            <div class="right-header-actions">
              <div v-if="detail.author.id != uid">
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
              :class="{ active: activeTab === 'detail' }"
              @click="activeTab = 'detail'"
            >
              {{ t('detail.detail') }}
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'collection' }"
              @click="activeTab = 'collection'; loadCollections()"
            >
              {{ t('detail.collection') }}
            </div>
          </div>
        </div>

        <div class="scroll-content" ref="scrollContentRef" @scroll="handleScroll" v-if="activeTab === 'detail'">
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
                <div v-if="comments.length > 0 && !isLoadingComments" class="comment-item" v-for="c in comments" :key="c.id" :data-comment-id="c.id">
                  <div class="comment-main" :style="{ backgroundColor: c.backgroundColor }">
                    <img class="c-avatar" :src="c.avatar" alt="" />
                    <div class="c-content">
                      <div class="c-header">
                        <span class="c-author">{{ c.author }}</span>
                        <div class="c-more-wrap" :ref="(el) => setCommentMoreRef(el, c.id)">
                          <button class="c-more-btn" @click.stop="toggleCommentMore(c.id)">
                            <img src="@/assets/images/detail/menu.png" alt="" class="dots-icon" />
                          </button>
                          <div class="dropdown-menu" v-if="activeCommentMoreId === c.id">
                            <span class="menu-item" v-if="c.user_id == uid" @click="deleteComment(c.id)">
                              {{ t("detail.delete") }}
                            </span>
                            <span class="menu-item" v-else @click="openReportModal('comment', c.id)">
                              {{ t("detail.report") }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p class="c-text" v-html="formatContent(c.content_replace || c.text || c.content)"></p>

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
                              controlslist="nodownload noremoteplayback noplaybackrate"
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
                    <div class="reply-item" v-for="r in c.replies" :key="r.id" :style="{ backgroundColor: r.backgroundColor }">
                      <img class="c-avatar" :src="r.avatar" alt="" />
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
                            controlslist="nodownload noremoteplayback noplaybackrate"
                            @click="toggleCommentVideoPlay"
                            @play="onCommentVideoPlay"
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
                 :class="{ 'active': isCollectionItemActive(index) }"
                 @click="playCollectionItem(index)">
              <div class="collection-content">
                <div class="collection-cover-wrapper" :class="{ 'playing': isCollectionItemPlaying(index) }">
                  <img class="collection-cover" :src="item.cover" alt="" />
                  <div class="collection-subscribe-badge" v-if="item.requiresSubscription">{{ t('detail.subscribe') }}</div>
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
                <div class="collection-info">
                  <div class="collection-title">{{ item.title }}</div>
                  <div class="collection-stats">
                    <div class="collection-views">
                      <img src="@/assets/images/detail/like.png" alt="" />
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
  </div>
</template>

<script setup lang="ts" name="Detail">
import ReportModal from "@/components/ReportModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import PreviewBig from "@/components/PreviewBig.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";

import { useRoute, useRouter } from "vue-router";
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
const router = useRouter();

// --- State ---
const id = ref<number>(Number(route.query.id));
const isPlaying = ref(true);
const isVideoEnded = ref(false);
const isVideoLoading = ref(true);
const videoRef = ref<HTMLVideoElement | null>(null);
const isLoading = ref(false);
const loadText = ref(t('userHome.loading'));
const isVideoBuffering = ref(false);

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
const isNearBottom = ref(false);

// Video State
const currentTime = ref(0);
const duration = ref(0);

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
  content_replace: "",
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

// Tab state
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

// Current collection
const currentCollection = computed(() => {
  return collections.value[currentCollectionIndex.value] || null;
});

// Enter collection mode
function enterCollectionMode() {
  isCollectionMode.value = true;
  activeTab.value = 'collection';
  isRightPanelHidden.value = false;
  loadChapters();
}

// Load chapters (collection episodes)
async function loadChapters() {
  if (!detail.value.book_id || Number(detail.value.book_id) === 0) return;

  try {
    const response = await api.singleCollection(Number(detail.value.book_id), 1, 50) as any;
    if (response.code === 0) {
      collections.value = response.data?.data || [];
      chapterCount.value = response.data?.allnums || response.data?.count || 0;
      // 加载章节列表后设置导航
      setChapterNavigation();
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

// Set chapter navigation
function setChapterNavigation() {
  // First try to find by chapter_index
  let currentIndex = collections.value.findIndex(chapter => {
    return Number(chapter.chapter_index) === Number(detail.value.chapter_index);
  });

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
}

// Exit collection mode
function exitCollectionMode() {
  isCollectionMode.value = false;
  activeTab.value = 'detail';
  currentCollectionIndex.value = 0;
}

// Check if a collection item is "active" (highlighted in the list)
function isCollectionItemActive(index: number): boolean {
  if (isCollectionMode.value) {
    return currentCollectionIndex.value === index;
  }
  // In non-collection mode, match by current post id
  const item = collections.value[index];
  return item && item.id === detail.value.id;
}

// Check if a collection item is currently "playing"
function isCollectionItemPlaying(index: number): boolean {
  if (isCollectionMode.value) {
    return currentCollectionIndex.value === index && isPlaying.value;
  }
  // In non-collection mode, the current post is "playing" if video is playing
  const item = collections.value[index];
  return item && item.id === detail.value.id && isPlaying.value;
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
function playCollectionItem(index: number) {
  if (isCollectionMode.value) {
    // 停止当前播放的视频
    if (videoRef.value) {
      videoRef.value.pause();
    }

    // 切换到点击的合集项目
    currentCollectionIndex.value = index;

    // 重置视频状态
    isVideoLoading.value = true;
    isVideoEnded.value = false;

    // 模拟视频加载完成
    setTimeout(() => {
      isVideoLoading.value = false;
      isPlaying.value = true;
    }, 1000);
  } else {
    // 进入合集模式并播放点击的项目
    enterCollectionMode();
    setTimeout(() => {
      currentCollectionIndex.value = index;
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

// API Data Load
async function fetchDetail(newId: number) {
  // Get query parameters at the beginning
  const type = route.query.type as string || "";
  const cid = route.query.cid as string || "";

  try {
    id.value = newId;

    isLoading.value = true;
    comments.value = [];
    isLoadingComments.value = true;

    var data = null;

    if (type == "1")  {
      data = JSON.stringify({
        post_id: newId,
        fromIndexRecommend: {
          "tab": "hot"
        }
      })
    } else if (type == "2") {
      data = JSON.stringify({
        post_id: newId,
        fromIndexFollow: {
          test: 1
        }
      })
    } else if (type == "3") {
      data = JSON.stringify({
        post_id: newId,
        fromIndexSubscription: {
          test: 1
        }
      })
    } else if (type == "4") {
      const bloggerId = route.query.uid as string || "";
      const searchKeyword = route.query.keyword as string || "";
      const startDay = route.query.start_day as string || "";
      const endDay = route.query.end_day as string || "";

      data = JSON.stringify({
        post_id: newId,
        fromBloggerIndex: {
          blogger_id: bloggerId,
          keywords: searchKeyword,
          start_day: startDay,
          end_day: endDay
        }
      })
    } else if (type == "5") {
      const searchKeyword = route.query.keyword as string || "";
      data = JSON.stringify({
        post_id: newId,
        fromSearch: {
          keywords: searchKeyword
        }
      })
    } else {
      data = JSON.stringify({
        post_id: newId
      })
    }

    const token = localStorage.getItem('token');

    const headers: HeadersInit = {};

    if (token) {
      headers['token'] = token;
    }

    const response = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers: headers,
      body: data
    });

    const res = await response.json();

    if (res.code == 0 || res.code == 200) {
      const data = res.data.post;

      detail.value = {
        id: data.id || newId,
        author: res.data.author,
        isFollowed: data.is_followed == 1 || false,
        time: formatTimestamp(data.created_at) || "",
        title: data.title || "",
        description: data.content_replace || data.content || data.description || "",
        type: data.type,
        videoUrl: data.video_url || "",
        cover: data.cover || "",
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
        is_nsfw: data.is_nsfw || '1',
        book_id: data.book_id || data.collection_id || "",
        book_title: data.book_title || "",
        chapter_index: data.chapter_index || ""
      };

      // Load chapters if it's part of a collection
      if (detail.value.book_id && Number(detail.value.book_id) > 0) {
        await loadChapters();
      }

      totalComments.value = res.data.comment_total || '';

      // Update local state
      likes.value = detail.value.likes;
      liked.value = detail.value.liked;

      // Preload cover image for faster display
      if (detail.value.cover) {
        const img = new Image();
        img.src = detail.value.cover;
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
        content_replace: "",
        permission: "public",
        subscriptionPlans: [],
        isSubscribed: false,
        commentsEnabled: true,
        isLast: false,
        likes: 0,
        liked: false,
        is_teenager: 1,
        is_nsfw: '1',
        book_id: "",
        book_title: "",
        chapter_index: ""
      };
      likes.value = 0;
      liked.value = false;
      comments.value = [];
      totalComments.value = '';
    }

  } catch (error) {
    toast(t('fail'));

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
      content_replace: "",
      permission: "public",
      subscriptionPlans: [],
      isSubscribed: false,
      commentsEnabled: true,
      isLast: false,
      likes: 0,
      liked: false,
      is_teenager: 1,
      is_nsfw: '1',
      book_id: "",
      book_title: "",
      chapter_index: ""
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

    // 参考NovelDetail.vue的逻辑，使用真实API调用
    const page = append ? currentCollectionPage.value + 1 : 1;
    const pageSize = 4;

    // 有book_id且值大于0，使用真实API调用
    if (detail.value.book_id && Number(detail.value.book_id) > 0) {
      const response = await api.singleCollection(Number(detail.value.book_id), page, pageSize) as any;
      if (response.code === 0) {
        const newCollections = response.data?.data || [];

        // 转换数据结构以匹配现有的合集列表结构
        const transformedCollections = newCollections.map((chapter: any) => ({
          id: chapter.post_id,
          title: chapter.title,
          cover: chapter.cover || detail.value.cover,
          likes: chapter.likes || 0,
          author: detail.value.author.nickname,
          type: detail.value.type,
          duration: chapter.duration,
          isSubscribed: detail.value.isSubscribed,
          requiresSubscription: chapter.access_rights === '2' || false
        }));

        // 检查是否有更多数据
        hasMoreCollections.value = newCollections.length === pageSize;

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
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
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
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
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

const isSensitiveContentLocked = computed(() => {
  if (isPaidContentLocked.value) return false;

  // If it's the author's own work, don't lock
  if (detail.value.author.id && detail.value.author.id === localStorage.getItem('uid')) return false;

  // Check if user is teenager or content is sensitive
  const isTeenager = detail.value.is_teenager == 1;
  const isSensitive = detail.value.is_nsfw == '1';

  if (isTeenager && !isSensitive) {
    return false;
  } else if (isTeenager && isSensitive) {
    return true;
  } else if (!isTeenager && !isSensitive) {
    return false;
  } else if (!isTeenager && isSensitive) {
    return false;
  } else {
    return true;
  }
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
  v.muted = volume.value === 0;
  isPlaying.value = true;
}

function onCanPlay() {
  isVideoBuffering.value = false;
  isVideoLoading.value = false;

  if (videoRef.value && videoRef.value.paused) {
    videoRef.value.play().catch(error => {
      console.log('Video play failed:', error);
    });
  }
}

function onVideoWaiting() {
  isVideoBuffering.value = true;
}

function onVideoPlaying() {
  isVideoBuffering.value = false;
  // 暂停所有其他视频的播放
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

  if (!v.muted && v.volume === 1) {
    v.volume = 0.6;
    volume.value = 0.6;
    localStorage.setItem('videoVolume', volume.value.toString());
  } else if (!v.muted && v.volume === 0) {
    v.volume = 0.6;
    volume.value = 0.6;
    localStorage.setItem('videoVolume', volume.value.toString());
  } else if (!v.muted) {
    volume.value = v.volume;
    localStorage.setItem('videoVolume', volume.value.toString());
  }
}

function onVideoEnded() {
  // 视频播放结束时，设置isPlaying为false，isVideoEnded为true，显示封面和播放按钮
  isPlaying.value = false;
  isVideoEnded.value = true;
  if (videoRef.value) {
    videoRef.value.pause();
    // 重置视频到开始位置，确保视频画面回到初始状态
    videoRef.value.currentTime = 0;
    // 确保视频不会自动播放下一遍
    videoRef.value.autoplay = false;
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

      // 模拟视频加载完成
      setTimeout(() => {
        isVideoLoading.value = false;
        // 如果下一集需要订阅但用户没订阅，不自动播放，保持暂停状态
        if (!needSubscription) {
          isPlaying.value = true;
        }
      }, 1000);
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

function toggleMute() {
  if (!videoRef.value) return;
  if (volume.value > 0) {
    volume.value = 0;
  } else {
    volume.value = 0.6;
  }
  videoRef.value.volume = volume.value;
  localStorage.setItem('videoVolume', volume.value.toString());
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
  if (window.history.length <= 1) {
    router.push('/');
  } else {
    router.back();
  }
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

function handleComicScroll() {
  const el = comicScrollRef.value;
  if (!el) return;
  const scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;
  isNearBottom.value = scrollHeight - scrollTop - clientHeight <= 20;
}

function toggleComicZoom(index: number) {
  isComicFullscreen.value[index] = !isComicFullscreen.value[index];
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
  if (isFirst.value) return;

  // 添加滑出动画
  isSliding.value = true;
  isSlidingIn.value = false;

  setTimeout(() => {
    if (isCollectionMode.value) {
      // 在合集模式下，切换到上一个合集项目
      currentCollectionIndex.value--;
      // 添加滑入动画
      setTimeout(() => {
        isSliding.value = false;
        isSlidingIn.value = true;
        setTimeout(() => {
          isSlidingIn.value = false;
        }, 300);
      }, 100);
    } else if (prevId.value) {
      // 保留当前路由的所有查询参数，只更新 id
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: prevId.value
        }
      });
      // 重置动画状态
      setTimeout(() => {
        isSliding.value = false;
      }, 300);
    }
  }, 300);
}

function goNext() {
  if (isLast.value) return;

  // 添加滑出动画
  isSliding.value = true;
  isSlidingIn.value = false;

  setTimeout(() => {
    if (isCollectionMode.value) {
      // 在合集模式下，切换到下一个合集项目
      currentCollectionIndex.value++;
      // 添加滑入动画
      setTimeout(() => {
        isSliding.value = false;
        isSlidingIn.value = true;
        setTimeout(() => {
          isSlidingIn.value = false;
        }, 300);
      }, 100);
    } else if (nextId.value) {
      // 保留当前路由的所有查询参数，只更新 id
      router.replace({
        path: '/detail',
        query: {
          ...route.query,
          id: nextId.value
        }
      });
      // 重置动画状态
      setTimeout(() => {
        isSliding.value = false;
      }, 300);
    }
  }, 300);
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

        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          likes.value = Number(res.data.like_count || res.data.likes);
        } else {
          likes.value = previousLikes + 1;
        }
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
        if (res.data && (res.data.like_count !== undefined || res.data.likes !== undefined)) {
          likes.value = Number(res.data.like_count || res.data.likes);
        } else {
          likes.value = Math.max(0, previousLikes - 1);
        }
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
    toast(t('detail.videoUrlCopied'));
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
  (newId) => {
    if (newId) {
      id.value = Number(newId);
      fetchDetail(Number(newId));
    }
  },
);
</script>

<style lang="scss" scoped>
   @use '@/scss/Detail.scss';
</style>
