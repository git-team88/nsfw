<template>
  <div class="generate-page">
    <Header :cur="-1" @balanceInfoLoaded="handleBalanceInfoLoaded"></Header>

    <div class="container">
      <div class="filter-bar">
        <div class="type-selector" @click.stop="toggleTypeDropdown">
          <div class="type-selector-info">
            <span class="selected-type">{{ selectedTypeLabel }}</span>
            <img
              :src="arrowIcon"
              :class="['dropdown-arrow', { rotated: showTypeDropdown }]"
              alt="arrow"
            />
          </div>
          <div v-if="showTypeDropdown" class="type-dropdown">
            <div
              v-for="option in typeOptions"
              :key="option.value"
              :class="['dropdown-item', { active: selectedType == option.value }]"
              @click.stop="selectType(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>

      <div class="main">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ t('home.loading') }}</div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isLoading && records.length == 0" class="empty-state">
          <div class="empty-icon">
            <img src="@/assets/images/base/no_data.png" alt="empty" />
          </div>
          <p class="empty-text">{{ t('recordList.empty') }}</p>
        </div>

        <!-- Record List -->
        <div v-else-if="!isLoading && displayRecords.length > 0" class="record-list" :style="{ paddingBottom: displayRecords.length > 0 ? '280px' : '0' }">
          <div v-for="(record, index) in displayRecords"
            :key="record.session_id || record.id"
            class="record-item"
            :id="`record-${record.session_id}`"
          >
            <!-- 图片类型 -->
            <template v-if="record.type == 'photo' || !record.type">
              <!-- 内容区域（灰色背景） -->
              <div class="photo-record-content">
                <!-- 预览图列表 -->
                <div v-if="record.user_selected?.others?.list?.length > 0" class="photo-thumbnail-list">
                  <div
                    v-for="(item, imgIndex) in record.user_selected.others.list.slice(0, 4)"
                    :key="imgIndex"
                    class="photo-thumbnail"
                  >
                    <span class="image-index">{{ imgIndex + 1 }}</span>
                    <img :src="item.image || item.url" alt="preview" class="thumbnail-image" />
                    <span class="thumbnail-title">{{ t('recordList.image') }}{{ imgIndex + 1 }}</span>
                  </div>
                </div>

                <!-- 描述内容 - 只在有内容时显示 -->
                <p v-if="record.description || record.formattedDescription" class="photo-desc" v-html="formatContent(record.description || '', record)"></p>

                <!-- 底部：设置信息和时间 -->
                <div class="photo-meta-row">
                  <div class="photo-meta">
                    <span class="meta-item type-label">{{ t('recordList.photoGenerate') }}: {{ record.user_selected.story_mode == 'nsfw' ? t('home.mode.unlimited') : t('home.mode.normal') }}</span>
                    <span class="meta-item">{{ t('recordList.quality') }}: {{ record.resolution }}</span>
                    <span class="meta-item">{{ t('recordList.ratio') }}: {{ record.ratio }}</span>
                  </div>
                  <span class="photo-time">{{ formatTimestamp(record.createTime) }}</span>
                </div>
              </div>

              <!-- 图片网格区域（白色背景） -->
              <div class="photo-grid-container">
                <div class="photo-grid">
                  <template v-if="record.status == 'DOING' || record.status == 'PREPARE'">
                    <div
                      v-for="i in 1"
                      :key="i"
                      class="photo-item skeleton"
                      :class="{
                        'ratio-9-16': record.ratio === '9:16',
                        'ratio-16-9': record.ratio === '16:9'
                      }"
                    >
                      <img :src="getLoadingGif(record.ratio)" alt="loading" class="skeleton-image" />
                    </div>
                  </template>
                  <template v-else>
                    <div
                      v-for="(image, index) in (record.images || []).slice(0, 1)"
                      :key="index"
                      class="photo-item"
                      :class="{
                        'ratio-9-16': record.ratio === '9:16',
                        'ratio-16-9': record.ratio === '16:9'
                      }"
                    >
                      <img :src="image" alt="generated" class="grid-image" @click="openImageViewer(image)" />
                      <!-- 图片操作按钮 - 仅在任务成功后显示 -->
                      <div v-if="isTaskSuccess(record.step_status || record.status)" class="photo-item-overlay">
                        <div v-if="record.user_selected?.story_mode != 'nsfw'" class="overlay-btn download-btn" @click.stop="downloadSingleImage(image)">
                          <img src="@/assets/images/home/download.png" alt="download" />
                        </div>

                        <div class="overlay-btn edit-btn" @click.stop="editImage(record, index)">
                          <img src="@/assets/images/home/edit.png" alt="edit" />
                        </div>

                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 失败提示 -->
              <div v-if="isTaskFailed(record.step_status || record.status)" class="record-failed">
                <img src="@/assets/images/home/intro.png" alt="warning" class="failed-icon" />
                <span class="failed-text">{{ record.fail_reason || t('recordList.generateFailed') }}</span>
              </div>

              <!-- 底部操作 - 仅在任务完成后显示 -->
              <div v-if="!isTaskProcessing(record.step_status || record.status)" class="photo-footer">
                <div class="regenerate-btn" @click="regenerateRecord(record)">
                  <img src="@/assets/images/home/renew.png" alt="regenerate" />
                </div>

                <div class="photo-more">
                  <img class="more-dots" src="@/assets/images/detail/menu.png" alt="more" @click.stop="showPhotoMoreOptions(record, $event)" />

                  <div
                    v-if="showMoreOptions && activeRecord?.id == record.id"
                    class="more-options-popup"
                    :class="{ 'popup-top': photoPopupPosition == 'top' }"
                  >
                    <div class="popup-item delete-item" @click="deleteRecord(record)">
                      <span>{{ t('recordList.delete') }}</span>
                    </div>
                  </div>
                </div>
              </div>


            </template>

            <!-- 视频类型 -->
            <template v-else-if="record.type == 'video'">
              <div class="video-record-content">
                <!-- 预览图列表 - 首尾帧模式显示reference_images -->
                <template v-if="record.user_selected?.simple_video_generate_mode == 'first_last_frames' && record.user_selected?.reference_images?.length > 0">
                  <div class="video-thumbnail-list">
                    <div
                      v-for="(refImg, imgIndex) in record.user_selected.reference_images.slice(0, 4)"
                      :key="'ref-' + imgIndex"
                      class="video-thumbnail"
                    >
                      <span class="image-index">1</span>
                      <img :src="refImg.url" alt="preview" class="thumbnail-image" />
                      <span class="thumbnail-title">{{ refImg.type === 'first_frame' ? t('home.start') : refImg.type === 'last_frame' ? t('home.end') : refImg.type }}</span>
                    </div>
                  </div>
                </template>
                <!-- 预览图列表 - 视频续写模式显示第一个视频 -->
                <template v-else-if="record.user_selected?.simple_video_generate_mode == 'video_extension' && record.user_selected?.others?.list?.length > 0">
                  <div class="video-thumbnail-list">
                    <div
                      v-for="(item, imgIndex) in record.user_selected.others.list.filter((i: any) => i.type === 'video').slice(0, 1)"
                      :key="imgIndex"
                      class="video-thumbnail"
                    >
                      <span class="image-index">1</span>
                      <div class="video-thumbnail-item" @click="playVideoItem(item)">
                        <img :src="item.cover || item.image || item.url" alt="preview" class="thumbnail-image" />
                        <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                      </div>
                      <span class="thumbnail-title">{{ t('recordList.video') }}1</span>
                    </div>
                  </div>
                </template>
                <!-- 预览图列表 - 多模态模式显示others.list -->
                <template v-else-if="record.user_selected?.others?.list?.length > 0">
                  <div class="video-thumbnail-list">
                    <div
                      v-for="(item, imgIndex) in record.user_selected.others.list.slice(0, 4)"
                      :key="imgIndex"
                      class="video-thumbnail"
                    >
                      <span class="image-index">{{ record.user_selected.others.list.slice(0, imgIndex).filter((i: any) => i.type === item.type).length + 1 }}</span>
                      <template v-if="item.type === 'video'">
                        <div class="video-thumbnail-item" @click="playVideoItem(item)">
                          <img :src="item.cover || item.image || item.url" alt="preview" class="thumbnail-image" />
                          <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                        </div>
                      </template>
                      <img v-else-if="item.type === 'audio'" src="@/assets/images/home/audio.png" alt="audio" class="thumbnail-image audio-thumbnail" />
                      <img v-else :src="item.image || item.url" alt="preview" class="thumbnail-image" />
                      <span class="thumbnail-title">{{ item.type === 'audio' ? t('recordList.audio') : item.type === 'video' ? t('recordList.video') : t('recordList.image') }}{{ record.user_selected.others.list.slice(0, imgIndex).filter((i: any) => i.type === item.type).length + 1 }}</span>
                    </div>
                  </div>
                </template>

                <!-- 中间：描述内容 -->
                <p v-if="record.description || record.formattedDescription" class="video-desc" v-html="formatContent(record.description || '', record)"></p>

                <!-- 底部：设置信息和时间 -->
                <div class="video-meta-row">
                  <div class="video-meta">
                    <span class="meta-item type-label">{{ t('recordList.videoGenerate') }}: {{ record.user_selected.story_mode == 'nsfw' ? t('home.mode.unlimited') : t('home.mode.normal') }}</span>
                    <span class="meta-item">{{ t('recordList.quality') }}: {{ record.resolution }}</span>
                    <span class="meta-item">{{ t('recordList.ratio') }}: {{ record.ratio }}</span>
                    <span v-if="record.duration" class="meta-item">{{ t('recordList.duration') }}: {{ record.duration }}s</span>
                  </div>
                  <span class="video-time">{{ formatTimestamp(record.createTime) }}</span>
                </div>
              </div>

              <div class="video-player-container" v-if="!isTaskFailed(record.step_status || record.status) && (isTaskProcessing(record.step_status || record.status) || record.videoUrl)">
                <div
                  v-if="isTaskProcessing(record.step_status || record.status)"
                  class="video-player-wrapper skeleton"
                  :style="getVideoPlayerStyle(record.ratio)"
                >
                  <img :src="getLoadingGif(record.ratio)" alt="loading" class="video-skeleton-gif" />
                </div>
                <div
                  v-else-if="record.videoUrl"
                  class="video-player-wrapper"
                  @click="playVideo(record)"
                  :style="getVideoPlayerStyle(record.ratio)"
                >
                  <img :src="record.videoCover" alt="video cover" class="video-cover" />
                  <div class="play-overlay">
                    <img src="@/assets/images/detail/play.png" alt="play" class="play-icon" />
                  </div>
                  <div v-if="record.user_selected?.story_mode != 'nsfw'" class="download-btn" @click.stop="downloadVideo(record)">
                    <img src="@/assets/images/home/download.png" alt="download" />
                  </div>
                </div>
              </div>

              <!-- 失败提示 -->
              <div v-if="isTaskFailed(record.step_status || record.status)" class="record-failed">
                <img src="@/assets/images/home/intro.png" alt="warning" class="failed-icon" />
                <span class="failed-text">{{ t('recordList.generateFailed') }}</span>
              </div>

              <!-- 视频底部操作 -->
              <div v-if="!isTaskProcessing(record.step_status || record.status)" class="video-footer">
                <div class="regenerate-btn" @click="regenerateRecord(record)">
                  <img src="@/assets/images/home/renew.png" alt="regenerate" />
                </div>

                <div class="video-more">
                  <img class="more-dots" src="@/assets/images/detail/menu.png" alt="more" @click.stop="showVideoMoreOptions(record, $event)" />

                  <!-- 视频更多选项弹窗 -->
                  <div
                    v-if="showVideoMoreOptionsVisible && activeVideoRecord?.id == record.id"
                    class="more-options-popup"
                    :class="{ 'popup-top': videoPopupPosition == 'top' }"
                  >
                    <div class="popup-item delete-item" @click="deleteVideoRecord(record)">
                      <span>{{ t('recordList.delete') }}</span>
                    </div>
                  </div>
                </div>

              </div>

            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom Generator -->
    <div class="bottom-generator">
      <div class="bottom-container">
        <div class="input-type-box">
          <div class="content-type-selector">
            <div
              :class="['type-btn', { active: bottomActiveTab == 'photo' }]"
              @click="switchBottomTab('photo')"
            >
              <div class="type-text">
                <span>{{ t('home.contentType.photo') }}</span>
              </div>
            </div>
            <div
              :class="['type-btn', { active: bottomActiveTab == 'video' }]"
              @click="switchBottomTab('video')"
            >
              <div class="type-text">
                <span>{{ t('home.contentType.video') }}</span>
              </div>
            </div>
          </div>


        </div>

        <!-- Photo Generator -->
        <div v-if="bottomActiveTab == 'photo'" class="input-area">
          <input
            ref="photoFileInput"
            type="file"
            accept="image/*"
            class="file-input"
            style="display: none;"
            @change="handlePhotoFileChange"
          />
          <div :class="['input-inner', { collapsed: isPhotoInputCollapsed }]">
            <!-- Uploaded Images Preview -->
            <div v-if="uploadedPhotoImages.length > 0" class="uploaded-images">
              <div
                v-for="(image, index) in uploadedPhotoImages"
                :key="image.id"
                class="uploaded-image-item"
              >
                <span class="image-index">{{ index + 1 }}</span>
                <img :src="image.image" class="uploaded-image" />
                <span class="image-name">{{ t('recordList.image') }}{{ index + 1 }}</span>
                <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removePhotoImage(image.id)" />
              </div>
            </div>

            <div
              ref="photoEditableInputRef"
              :key="`photo-input-${photoInputKey}`"
              :class="['input-textarea', { collapsed: isPhotoInputCollapsed, 'has-focus': isPhotoInputFocused }]"
              contenteditable="true"
              spellcheck="false"
              @input="handlePhotoInput"
              @keydown="handlePhotoKeydown"
              @focus="handlePhotoInputFocus"
              @blur="handlePhotoInputBlur"
              @paste="handlePhotoPaste"
              :data-placeholder="photoPlaceholderDisplay"
            ></div>

            <!-- @ Dropdown for photo -->
            <div v-if="showPhotoRefDropdown" class="at-dropdown photo-at-dropdown">
              <div
                v-for="(item, index) in photoRefDropdownItems"
                :key="item.id"
                class="dropdown-item"
                @mousedown.prevent="selectPhotoRefItem(item)"
              >
                <div class="dropdown-img">
                  <img :src="item.url" :alt="item.name" />
                </div>
                <span>{{ t('home.img') }}{{ index + 1 }}</span>
              </div>
            </div>

            <div class="input-box" :class="{ collapsed: isPhotoInputCollapsed }">
              <div class="input-options" v-show="!isPhotoInputCollapsed">

                <div v-if="userRegion" class="unlimited-switch" :class="{ active: currentPhotoMode == 'unlimited' }" @click="switchPhotoMode(currentPhotoMode == 'normal' ? 'unlimited' : 'normal', currentPhotoMode == 'normal' ? 2 : 1)">
                  <span class="unlimited-dot"></span>
                  <span class="unlimited-label">{{ t('home.mode.unlimited') }}</span>
                </div>

                <div class="option-btn reference-btn" @click="triggerPhotoUpload">
                  <img src="@/assets/images/home/img_icon.png" alt="" />
                  <span>{{ t('home.option.reference') }}</span>
                </div>

                <div class="photo-settings-selector" @click="showPhotoSettings = !showPhotoSettings" :class="{ open: showPhotoSettings }">
                  <div class="selector-header">
                    <span>{{ selectedPhotoQuality }}</span>
                    <span class="settings-divider"></span>
                    <span>{{ selectedPhotoRatio }}</span>
                    <span class="settings-line"></span>
                    <img class="dropdown-arrow" src="@/assets/images/home/menu.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showPhotoSettings" @click.stop>
                    <div class="settings-section">
                      <span class="settings-label">{{ t('home.photoSettings.quality') }}</span>
                      <div class="settings-options">
                        <div
                          v-for="quality in photoQualityOptions"
                          :key="quality.value"
                          class="dropdown-item"
                          :class="{ active: selectedPhotoQuality == quality.value }"
                          @click.stop="selectedPhotoQuality = quality.value"
                        >
                          {{ quality.label }}
                        </div>
                      </div>
                    </div>
                    <div class="settings-section">
                      <span class="settings-label">{{ t('home.photoSettings.ratio') }}</span>
                      <div class="settings-options">
                        <div
                          v-for="ratio in photoRatioOptions"
                          :key="ratio.value"
                          class="dropdown-item"
                          :class="{ active: selectedPhotoRatio == ratio.value }"
                          @click.stop="selectedPhotoRatio = ratio.value"
                        >
                          {{ ratio.label }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="generate-box">
                <div class="generate-btn" :class="{ loading: isPhotoGenerating }" @click="generatePhoto">
                  <div class="generate-novel-btn">
                    <span>{{ estimatedPhotoPower }}</span>
                    <div v-if="isPhotoGenerating" class="loading-spinner-small"></div>
                    <img v-else src="@/assets/images/home/power.png" alt="Power" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Video Generator -->
        <div v-else class="input-area">
          <input
            ref="videoRefInput"
            type="file"
            :accept="currentVideoMode == 'normal' ? 'image/*,video/mp4,video/quicktime,audio/mp3,audio/wav' : 'image/*,video/mp4,video/quicktime'"
            class="file-input"
            style="display: none;"
            @change="handleVideoRefUpload"
          />
          <div :class="['input-inner', { collapsed: isVideoInputCollapsed }]">
            <!-- Uploaded Reference Files Preview - Only show in multimodal mode -->
            <div v-if="selectedVideoMultimodal == 'multimodal' && uploadedVideoRefs.length > 0" class="uploaded-images">
              <div
                v-for="(ref, index) in uploadedVideoRefs"
                :key="ref.id"
                class="uploaded-image-item"
              >
                <span class="image-index">{{ uploadedVideoRefs.slice(0, index).filter(r => r.type == ref.type).length + 1 }}</span>
                <div class="uploaded-item-wrapper">
                  <div v-if="ref.type == 'video'" class="video-thumbnail-wrapper" @click="playUploadedVideo(ref)">
                    <img :src="ref.cover" class="uploaded-image" />
                    <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                  </div>
                  <img v-else-if="ref.type == 'image'" :src="ref.image" class="uploaded-image" />
                  <img v-else-if="ref.type == 'audio'" src="@/assets/images/home/audio.png" class="uploaded-image audio-icon" />
                </div>
                <span class="tooltip-name">{{ ref.name }}</span>
                <span class="image-name">
                  {{ ref.type == 'video' ? t('home.video') : ref.type == 'audio' ? t('home.audio') : t('home.img') }}{{ uploadedVideoRefs.slice(0, index).filter(r => r.type == ref.type).length + 1 }}
                </span>
                <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removeVideoRef(ref.id)" />
              </div>
            </div>

            <!-- Multi-modal Reference Mode -->
            <template v-if="selectedVideoMultimodal == 'multimodal'">
              <div
                ref="videoEditableInputRef"
                :class="['input-textarea', { collapsed: isVideoInputCollapsed, 'has-focus': isVideoInputFocused }]"
                contenteditable="true"
                spellcheck="false"
                :data-placeholder="videoPlaceholderDisplay"
                @input="handleVideoInput"
                @keydown="handleVideoKeydown"
                @click="handleVideoInputClick"
                @focus="handleVideoInputFocus"
                @blur="handleVideoInputBlur"
                @paste="handleVideoPaste"
              ></div>

              <!-- @ Dropdown -->
              <div v-if="showVideoRefDropdown" class="at-dropdown">
                <div
                  v-for="(item, index) in videoRefDropdownItems"
                  :key="item.id"
                  class="dropdown-item"
                  @mousedown.prevent="selectVideoRefItem(item)"
                >
                  <div class="dropdown-img">
                    <img :src="item.type === 'audio' ? audioIcon : item.type === 'video' ? (item.cover || item.image) : item.image" :alt="item.name" />
                  </div>
                  <span v-if="item.type === 'video'">{{ t('home.video') }}{{ videoRefDropdownItems.slice(0, index).filter((i: any) => i.type === 'video').length + 1 }}</span>
                  <span v-else-if="item.type === 'audio'">{{ t('home.audio') }}{{ videoRefDropdownItems.slice(0, index).filter((i: any) => i.type === 'audio').length + 1 }}</span>
                  <span v-else>{{ t('home.img') }}{{ videoRefDropdownItems.slice(0, index).filter((i: any) => i.type === 'image').length + 1 }}</span>
                </div>
              </div>
            </template>

            <!-- Start and End Frames Mode -->
            <template v-else-if="selectedVideoMultimodal == 'startEndFrames'">
              <div class="start-end-frames-input">
                <div class="frames-upload-section">
                  <div class="frame-upload" :class="{ uploaded: startFrameImage }">
                    <input
                      ref="startFrameInput"
                      type="file"
                      accept="image/*"
                      class="file-input"
                      style="display: none;"
                      @change="handleStartFrameChange"
                    />
                    <div class="upload-area" @click="triggerStartFrameUpload">
                      <img v-if="startFrameImage" :src="startFrameImage" class="frame-preview" />
                      <template v-else>
                        <img class="upload-icon start-icon" src="@/assets/images/home/img_icon.png" alt="Upload" />
                        <span class="upload-label">{{ t('home.start') }}</span>
                      </template>
                    </div>
                    <img v-if="startFrameImage" class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removeStartFrame" />
                  </div>

                  <img class="arrow-icon" src="@/assets/images/home/exchange.png" alt="Exchange" @click="swapFrames" />

                  <div class="frame-upload" :class="{ uploaded: endFrameImage }">
                    <input
                      ref="endFrameInput"
                      type="file"
                      accept="image/*"
                      class="file-input"
                      style="display: none;"
                      @change="handleEndFrameChange"
                    />
                    <div class="upload-area" @click="triggerEndFrameUpload">
                      <img v-if="endFrameImage" :src="endFrameImage" class="frame-preview" />
                      <template v-else>
                        <img class="upload-icon end-icon" src="@/assets/images/home/img_icon.png" alt="Upload" />
                        <span class="upload-label">{{ t('home.end') }}</span>
                      </template>
                    </div>
                    <img v-if="endFrameImage" class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removeEndFrame" />
                  </div>
                </div>

                <textarea
                  :class="['frames-textarea', { collapsed: isVideoInputCollapsed }]"
                  :placeholder="t('home.input.placeholder')"
                  v-model="videoInput"
                  spellcheck="false"
                  @input="handleVideoTextareaInput"
                ></textarea>
              </div>
            </template>

            <!-- Video Extend Mode -->
            <template v-else-if="selectedVideoMultimodal == 'videoExtend'">
              <div class="video-extend-input">
                <div class="video-upload" :class="{ uploaded: uploadedVideo }">
                  <input
                    ref="videoInputRef"
                    type="file"
                    accept="video/mp4,video/quicktime"
                    class="file-input"
                    style="display: none;"
                    @change="handleVideoUpload"
                  />
                  <div class="upload-area" @click="uploadedVideo && !isUploading ? playVideo({ videoUrl: uploadedVideo, videoCover: uploadedVideoCover }) : triggerExtendVideoUpload()">
                    <template v-if="uploadedVideo">
                      <img :src="uploadedVideoCover || uploadedVideo" class="preview-video" />
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="removeVideo" />
                      <img class="play-icon" src="@/assets/images/detail/play.png" alt="Play" />
                    </template>
                    <template v-else>
                      <img class="upload-icon video-icon" src="@/assets/images/home/img_icon.png" alt="Upload" />
                      <span class="upload-label">{{ t('home.contentType.video') }}</span>
                    </template>
                  </div>
                </div>

                <textarea
                  :class="['video-textarea', { collapsed: isVideoInputCollapsed }]"
                  :placeholder="t('home.input.placeholder')"
                  v-model="videoInput"
                  spellcheck="false"
                  @input="handleVideoTextareaInput"
                  @focus="handleVideoInputFocus"
                  @blur="handleVideoInputBlur"
                ></textarea>
              </div>
            </template>

            <div class="input-box" :class="{ collapsed: isVideoInputCollapsed }">
              <div class="input-options" v-show="!isVideoInputCollapsed">
                <div v-if="userRegion" class="unlimited-switch" :class="{ active: currentVideoMode == 'unlimited' }" @click="switchVideoMode(currentVideoMode == 'normal' ? 'unlimited' : 'normal', currentVideoMode == 'normal' ? 2 : 1)">
                  <span class="unlimited-dot"></span>
                  <span class="unlimited-label">{{ t('home.mode.unlimited') }}</span>
                </div>

                <div class="video-selector" @click="showVideoMultimodalDropdown = !showVideoMultimodalDropdown" :class="{ open: showVideoMultimodalDropdown }">
                  <div class="selector-header">
                    <span>{{ videoMultimodalOptions.find(opt => opt.value == selectedVideoMultimodal)?.label || selectedVideoMultimodal }}</span>
                    <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showVideoMultimodalDropdown">
                    <div
                      v-for="option in videoMultimodalOptions"
                      :key="option.value"
                      class="dropdown-item"
                      :class="{ active: selectedVideoMultimodal == option.value }"
                      @click.stop="selectVideoMultimodal(option.value)"
                    >
                      <span>{{ option.label }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="selectedVideoMultimodal == 'multimodal'" class="option-btn reference-btn" @click="triggerVideoUpload">
                  <img src="@/assets/images/home/img_icon.png" alt="" />
                  <span>{{ t('home.option.reference') }}</span>
                </div>

                <div class="video-settings-selector" @click="showVideoSettings = !showVideoSettings" :class="{ open: showVideoSettings }">
                  <div class="selector-header">
                    <span>{{ selectedVideoQuality }}</span>
                    <span class="settings-divider"></span>
                    <span>{{ selectedVideoRatio }}</span>
                    <span class="settings-divider"></span>
                    <span>{{ selectedVideoDuration }}s</span>
                    <span class="settings-line"></span>
                    <img class="dropdown-arrow" src="@/assets/images/home/menu.png" alt="" />
                  </div>
                  <div class="dropdown" v-if="showVideoSettings" @click.stop>
                    <div class="settings-section">
                      <span class="settings-label">{{ t('home.videoSettings.quality') }}</span>
                      <div class="settings-options">
                        <div
                          v-for="quality in videoQualityOptions"
                          :key="quality.value"
                          class="dropdown-item"
                          :class="{ active: selectedVideoQuality == quality.value }"
                          @click.stop="selectedVideoQuality = quality.value"
                        >
                          {{ quality.label }}
                        </div>
                      </div>
                    </div>
                    <div class="settings-section">
                      <span class="settings-label">{{ t('home.videoSettings.ratio') }}</span>
                      <div class="settings-options">
                        <div
                          v-for="ratio in videoRatioOptions"
                          :key="ratio.value"
                          class="dropdown-item"
                          :class="{ active: selectedVideoRatio == ratio.value }"
                          @click.stop="selectedVideoRatio = ratio.value"
                        >
                          {{ ratio.label }}
                        </div>
                      </div>
                    </div>
                    <div class="settings-section">
                      <span class="settings-label">{{ t('home.videoSettings.duration') }}</span>
                      <div class="duration-slider">
                        <div class="slider-track"></div>
                        <div class="slider-marks">
                          <template v-for="mark in sliderMarks" :key="mark.value">
                            <div class="mark" :style="{ left: mark.position, transform: 'translateX(-50%)' }"></div>
                            <div class="mark-label" :style="{ left: mark.position, transform: 'translateX(-50%)' }">
                              {{ mark.value }}s
                            </div>
                          </template>
                        </div>
                        <div class="slider-value" :style="{ left: getSliderValuePosition() }">
                          {{ selectedVideoDuration }}s
                        </div>
                        <input
                          type="range"
                          :min="currentVideoMode === 'unlimited' ? 2 : 4"
                          max="15"
                          step="1"
                          :value="selectedVideoDuration"
                          @input="onVideoDurationChange"
                          @mousedown="saveLastValidDuration"
                          @mouseup="validateDurationAndRestore"
                          @click.stop
                          class="slider-input"
                        />
                        <!-- <div class="slider-labels">
                          <span>{{ currentVideoMode === 'unlimited' ? '4s' : '2s' }}</span>
                          <span>5s</span>
                          <span>10s</span>
                          <span>15s</span>
                        </div> -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="generate-box">
                <!-- <div class="cover-cost-display">
                  <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                </div> -->
                <div class="generate-btn" :class="{ loading: isVideoGenerating }" @click="generateVideo">
                  <div class="generate-novel-btn">
                    <span>{{ estimatedVideoPower }}</span>
                    <div v-if="isVideoGenerating" class="loading-spinner-small"></div>
                    <img v-else src="@/assets/images/home/power.png" alt="Power" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Insufficient Balance Modal -->
    <InsufficientBalanceModal
      :visible="showInsufficientBalanceModal"
      @cancel="showInsufficientBalanceModal = false"
      @recharge="goRecharge"
    />

    <!-- Delete Record Modal -->
    <DeleteRecordModal
      :visible="showDeleteRecordModal"
      @close="handleCloseDeleteModal"
      @confirm="handleConfirmDelete"
    />

    <!-- Upload Loading Mask -->
    <UploadMask :visible="isUploading" />

    <!-- Cover Zoom Modal -->
    <div v-if="showCoverZoomModal" class="cover-zoom-modal" @click="closeCoverZoomModal">
      <div class="cover-zoom-content" @click.stop>
        <img class="close-zoom-btn" src="@/assets/images/novel/close.png" alt="Close" @click="closeCoverZoomModal" />
        <img :src="zoomedCoverImage + '?imageMogr2/format/webp/quality/60'" alt="" class="zoomed-cover-image" />
      </div>
    </div>

    <!-- Video Player Modal -->
    <div v-if="showVideoModal" class="video-modal">
      <div class="video-modal-content" :class="{ 'portrait': playingVideoRatio == '9:16' }">
        <img class="close-video-btn" src="@/assets/images/novel/close.png" alt="Close" @click="closeVideoModal" />
        <video :src="playingVideoUrl" controls autoplay class="video-player" playsinline :controlsList="playingVideoIsUnlimited ? 'nodownload' : undefined"></video>
      </div>
    </div>

    <!-- Unlimited Mode Confirm Modal -->
    <UnlimitedModeModal
      v-if="showUnlimitedModal"
      @close="showUnlimitedModal = false"
      @confirm="confirmUnlimitedMode"
    />

    <!-- 是否满18岁问询弹窗 -->
    <UnderageNoBirthdayModal
      v-if="showUnderageNoBirthdayModal"
      @close="showUnderageNoBirthdayModal = false"
      @confirm="handleUnlimitedAgeConfirm"
    />
  </div>
</template>

<script setup lang="ts" name="Generate">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast, limitToast } from '@/util/toast';
import { v4 as uuidv4 } from 'uuid';
import { aiUrl, baseUrl } from '@/util/config';
import { formatTimestamp } from '@/util/utils';
import Header from '@/components/Header.vue';
import arrowIcon from '@/assets/images/publish/arrow_icon.png';
import router from "@/router";
import api from "@/api/index";
import { eventBus } from "@/utils/eventBus";
import InsufficientBalanceModal from '@/components/InsufficientBalanceModal.vue';
import DeleteRecordModal from '@/components/DeleteRecordModal.vue';
import UploadMask from '@/components/UploadMask.vue';
import UnderageNoBirthdayModal from '@/components/UnderageNoBirthdayModal.vue';
import UnlimitedModeModal from '@/components/UnlimitedModeModal.vue';
import loadingGif916 from '@/assets/images/home/9_16.gif';
import loadingGif169 from '@/assets/images/home/16_9.gif';
import loadingGif11 from '@/assets/images/home/1_1.gif';
import audioIcon from '@/assets/images/home/audio.png';

const { t, locale } = useI18n();

const selectedType = ref('all');
const showTypeDropdown = ref(false);
const showMoreOptions = ref(false);
const activeRecord = ref<any>(null);
const showVideoMoreOptionsVisible = ref(false);
const activeVideoRecord = ref<any>(null);
const photoPopupPosition = ref<'top' | 'bottom'>('bottom');
const videoPopupPosition = ref<'top' | 'bottom'>('bottom');
const showInsufficientBalanceModal = ref(false);
const showDeleteRecordModal = ref(false);
const recordToDelete = ref<any>(null);
const showCoverZoomModal = ref(false);
const zoomedCoverImage = ref('');
const showVideoModal = ref(false);
const playingVideoUrl = ref('');
const playingVideoRatio = ref('16:9');
const playingVideoIsUnlimited = ref(false);
const userRegion = ref(false);
const userInfo = ref<any>(null);
const isTeenager = computed(() => !userInfo.value || userInfo.value.is_adult != 1);
const currentPhotoMode = ref('normal');
const currentVideoMode = ref('normal');
const showUnlimitedModal = ref(false);
const pendingModeType = ref('');
const showUnderageNoBirthdayModal = ref(false);
const isPositioningTarget = ref(false);

const typeOptions = ref([
  { value: 'all', label: t('recordList.photo') + '&' + t('recordList.video') },
  { value: 'simple_image', label: t('recordList.photo') },
  { value: 'simple_video', label: t('recordList.video') },
]);

const selectedTypeLabel = computed(() => {
  const type = typeOptions.value.find(t => t.value == selectedType.value);
  return type?.label || '';
});

const toggleTypeDropdown = () => {
  showTypeDropdown.value = !showTypeDropdown.value;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const typeSelector = document.querySelector('.type-selector');
  if (typeSelector && !typeSelector.contains(target)) {
    showTypeDropdown.value = false;
  }

  const photoSettingsSelector = document.querySelector('.photo-settings-selector');
  if (photoSettingsSelector && !photoSettingsSelector.contains(target)) {
    showPhotoSettings.value = false;
  }

  const videoSettingsSelector = document.querySelector('.video-settings-selector');
  if (videoSettingsSelector && !videoSettingsSelector.contains(target)) {
    showVideoSettings.value = false;
  }

  const videoSelector = document.querySelector('.video-selector');
  if (videoSelector && !videoSelector.contains(target)) {
    showVideoMultimodalDropdown.value = false;
  }

  const photoMoreDots = document.querySelectorAll('.photo-footer .more-dots');
  const videoMoreDots = document.querySelectorAll('.video-footer .more-dots');
  const photoMoreOptionsPopup = document.querySelector('.photo-record-content .more-options-popup');
  const videoMoreOptionsPopup = document.querySelector('.video-record-content .more-options-popup');

  let clickedOnPhotoMoreDots = false;
  photoMoreDots.forEach(dot => {
    if (dot.contains(target)) {
      clickedOnPhotoMoreDots = true;
    }
  });

  let clickedOnVideoMoreDots = false;
  videoMoreDots.forEach(dot => {
    if (dot.contains(target)) {
      clickedOnVideoMoreDots = true;
    }
  });

  const clickedOnPhotoPopup = photoMoreOptionsPopup && photoMoreOptionsPopup.contains(target);
  const clickedOnVideoPopup = videoMoreOptionsPopup && videoMoreOptionsPopup.contains(target);

  if (!clickedOnPhotoMoreDots && !clickedOnPhotoPopup) {
    showMoreOptions.value = false;
  }

  if (!clickedOnVideoMoreDots && !clickedOnVideoPopup) {
    showVideoMoreOptionsVisible.value = false;
  }
};

const records = ref<any[]>([]);
const displayRecords = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(100);
const displayCount = ref(20);
const totalCount = ref(0);
const isLoadingNewer = ref(false);
const pollingTasks = ref<Set<string>>(new Set());
const pollingTimers = ref<Map<string, ReturnType<typeof setInterval>>>(new Map());
const isLoading = ref(false);
const balanceInfo = ref<any>(null);
const isPhotoGenerating = ref(false);
const isVideoGenerating = ref(false);

const handleBalanceInfoLoaded = (info: any) => {
  balanceInfo.value = info;
};

// Photo settings for bottom generator
const showPhotoSettings = ref(false);
const selectedPhotoQuality = ref('1K');
const selectedPhotoRatio = ref('9:16');
const photoFileInput = ref<HTMLInputElement | null>(null);
const photoEditableInputRef = ref<HTMLElement | null>(null);
const uploadedPhotoImages = ref<any[]>([]);
const photoInputKey = ref(0);
const isPhotoInputCollapsed = ref(false);
const isPhotoInputFocused = ref(false);
const isVideoInputCollapsed = ref(false);
const showPhotoRefDropdown = ref(false);
const photoRefDropdownItems = ref<any[]>([]);
const isVideoInputFocused = ref(false);
const isUploading = ref(false);
const previousPhotoInputHtml = ref('');
const previousVideoInputHtml = ref('');

const photoPlaceholderFull = computed(() => t('home.input.placeholderPhoto'));
const videoPlaceholderFull = computed(() => t('home.input.placeholderVideo'));
const photoPlaceholderDisplay = ref('');
const videoPlaceholderDisplay = ref('');
const photoTypewriterState = ref({ charIndex: 0, deleting: false });
const videoTypewriterState = ref({ charIndex: 0, deleting: false });
let photoTypewriterTimer: ReturnType<typeof setTimeout> | null = null;
let videoTypewriterTimer: ReturnType<typeof setTimeout> | null = null;

const prefersReducedMotion = ref(false);

const checkReducedMotion = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

const startPhotoTypewriter = () => {
  if (photoTypewriterTimer) {
    clearTimeout(photoTypewriterTimer);
    photoTypewriterTimer = null;
  }
  if (prefersReducedMotion.value || isPhotoInputFocused.value) {
    photoPlaceholderDisplay.value = photoPlaceholderFull.value;
    return;
  }
  photoTypewriterState.value = { charIndex: 0, deleting: false };
  const tick = () => {
    const s = photoTypewriterState.value;
    if (!s.deleting) {
      s.charIndex++;
      photoPlaceholderDisplay.value = photoPlaceholderFull.value.slice(0, s.charIndex);
      if (s.charIndex >= photoPlaceholderFull.value.length) {
        s.deleting = true;
        photoTypewriterTimer = setTimeout(tick, 1500);
        return;
      }
      photoTypewriterTimer = setTimeout(tick, 85);
    } else {
      s.charIndex--;
      photoPlaceholderDisplay.value = photoPlaceholderFull.value.slice(0, Math.max(0, s.charIndex));
      if (s.charIndex <= 0) {
        s.deleting = false;
        photoTypewriterTimer = setTimeout(tick, 380);
        return;
      }
      photoTypewriterTimer = setTimeout(tick, 42);
    }
  };
  photoTypewriterTimer = setTimeout(tick, 700);
};

const startVideoTypewriter = () => {
  if (videoTypewriterTimer) {
    clearTimeout(videoTypewriterTimer);
    videoTypewriterTimer = null;
  }
  if (prefersReducedMotion.value || isVideoInputFocused.value) {
    videoPlaceholderDisplay.value = videoPlaceholderFull.value;
    return;
  }
  videoTypewriterState.value = { charIndex: 0, deleting: false };
  const tick = () => {
    const s = videoTypewriterState.value;
    if (!s.deleting) {
      s.charIndex++;
      videoPlaceholderDisplay.value = videoPlaceholderFull.value.slice(0, s.charIndex);
      if (s.charIndex >= videoPlaceholderFull.value.length) {
        s.deleting = true;
        videoTypewriterTimer = setTimeout(tick, 1500);
        return;
      }
      videoTypewriterTimer = setTimeout(tick, 85);
    } else {
      s.charIndex--;
      videoPlaceholderDisplay.value = videoPlaceholderFull.value.slice(0, Math.max(0, s.charIndex));
      if (s.charIndex <= 0) {
        s.deleting = false;
        videoTypewriterTimer = setTimeout(tick, 380);
        return;
      }
      videoTypewriterTimer = setTimeout(tick, 42);
    }
  };
  videoTypewriterTimer = setTimeout(tick, 700);
};

const getInputCharCount = (element: HTMLElement): number => {
  let charCount = 0;
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        charCount += (node.textContent || '').length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute('contenteditable') && el.contentEditable === 'false') {
        charCount += 7;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNodes(node.childNodes[i]);
        }
      }
    }
  };
  walkNodes(element);
  return charCount;
};

const getPhotoMaxInputLimit = (): number => {
  return 5000;
};

const getVideoMaxInputLimit = (): number => {
  return currentVideoMode.value === 'normal' ? 1000 : 5000;
};

const getPhotoInputContent = () => {
  if (!photoEditableInputRef.value) return '';

  let content = '';
  let imageIndex = 1;

  const processNode = (node: Node) => {
    if (node.nodeType == Node.TEXT_NODE) {
      content += node.textContent || '';
    } else if (node.nodeType == Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      if (element.classList.contains('image-tag')) {
        const src = element.dataset.src;
        if (src) {
          content += `<ref_${imageIndex}>`;
          imageIndex++;
          return;
        }
      }

      if (element.classList.contains('ref-tag')) {
        const src = element.dataset.src;
        if (src) {
          content += `<ref_${imageIndex}>`;
          imageIndex++;
          return;
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        processNode(node.childNodes[i]);
      }
    }
  };

  for (let i = 0; i < photoEditableInputRef.value.childNodes.length; i++) {
    processNode(photoEditableInputRef.value.childNodes[i]);
  }

  return content;
};

const handlePhotoInput = (event: Event) => {
  if (!photoEditableInputRef.value) return;

  const target = photoEditableInputRef.value;

  const maxLimit = getPhotoMaxInputLimit();
  const currentCharCount = getInputCharCount(target);
  if (currentCharCount > maxLimit) {
    target.innerHTML = previousPhotoInputHtml.value;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }
  previousPhotoInputHtml.value = target.innerHTML;

  let actualText = '';
  const textNodes = Array.from(target.childNodes).filter(node => {
    if (node.nodeType === 3) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        actualText += node.textContent || '';
      }
    }
    return node.nodeType === 3;
  });

  const selection = window.getSelection();
  let cursorPosition = actualText.length;
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    cursorPosition = getPositionInText(target, range);
  }

  const textBeforeCursor = actualText.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1 && uploadedPhotoImages.value.length > 0) {
    showPhotoRefDropdown.value = true;
    photoRefDropdownItems.value = uploadedPhotoImages.value.map((item, index) => ({
      id: item.id,
      name: item.name,
      url: item.image,
      type: 'image',
      cover: ''
    }));

    nextTick(() => {
      try {
        if (photoEditableInputRef.value) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) {
                if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
                  return false;
                }
                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) {
                if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
                  return false;
                }
                for (let i = 0; i < node.childNodes.length; i++) {
                  if (findAtSymbol(node.childNodes[i])) {
                    return true;
                  }
                }
              }
              return false;
            };

            findAtSymbol(photoEditableInputRef.value);

            if (foundAtNode) {
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = photoEditableInputRef.value.parentElement;
              const dropdown = document.querySelector('.photo-at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.top = `${relativeTop + 5}px`;
                dropdown.style.left = `${relativeLeft}px`;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error positioning photo dropdown:', e);
      }
    });
  } else {
    showPhotoRefDropdown.value = false;
  }
};

const selectPhotoRefItem = (item: any) => {
  if (!photoEditableInputRef.value) return;

  const target = photoEditableInputRef.value;
  const savedHtml = target.innerHTML;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    // 没有选中区域，直接在末尾添加
    const itemTag = createPhotoItemTag(item);
    target.appendChild(itemTag);
    target.appendChild(document.createTextNode(' '));
    target.focus();
    showPhotoRefDropdown.value = false;
    return;
  }

  const range = selection.getRangeAt(0);

  // 查找光标位置前的 @ 符号
  const atInfo = findAtSymbolBeforeCursor(target, selection);

  if (atInfo) {
    const { node, offset } = atInfo;

    // 创建 range 删除 @ 符号
    const atRange = document.createRange();
    atRange.setStart(node, offset);
    atRange.setEnd(node, offset + 1);

    // 删除 @
    atRange.deleteContents();

    // 创建 item tag
    const itemTag = createPhotoItemTag(item);

    // 插入 item tag
    atRange.insertNode(itemTag);

    // 添加空格
    const spaceNode = document.createTextNode(' ');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 设置光标位置在空格后面
    const cursorRange = document.createRange();
    cursorRange.setStartAfter(spaceNode);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  } else {
    // 没有找到 @，直接在光标位置插入
    const itemTag = createPhotoItemTag(item);
    range.insertNode(itemTag);

    // 添加空格
    const spaceNode = document.createTextNode(' ');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 设置光标位置在空格后面
    const cursorRange = document.createRange();
    cursorRange.setStartAfter(spaceNode);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  }

  showPhotoRefDropdown.value = false;

  const maxLimit = getPhotoMaxInputLimit();
  if (getInputCharCount(target) > maxLimit) {
    target.innerHTML = savedHtml;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  previousPhotoInputHtml.value = target.innerHTML;
};

const createPhotoItemTag = (item: any): HTMLElement => {
  const itemIndex = uploadedPhotoImages.value.findIndex(img => img.id === item.id) + 1;

  const itemTag = document.createElement('span');
  itemTag.className = 'image-tag';
  itemTag.contentEditable = 'false';
  itemTag.dataset.itemId = item.id;
  itemTag.dataset.src = item.url;
  itemTag.dataset.type = 'image';

  const typeLabel = t('home.img');
  const itemName = `${typeLabel}${itemIndex}`;
  itemTag.dataset.name = itemName;

  const img = document.createElement('img');
  img.src = item.url;
  img.alt = item.name;
  img.className = 'image-tag-img';
  itemTag.appendChild(img);

  const textNode = document.createTextNode(itemName);
  itemTag.appendChild(textNode);

  return itemTag;
};

const findAtSymbolBeforeCursor = (element: HTMLElement, selection: Selection): { node: Node; offset: number } | null => {
  const range = selection.getRangeAt(0);

  // 获取光标位置
  let cursorPos = 0;
  const calcPosition = (node: Node, endNode: Node, endOffset: number): boolean => {
    if (node === endNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        cursorPos += Math.min(endOffset, (node as Text).textContent?.length || 0);
      }
      return true;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      cursorPos += (node as Text).textContent?.length || 0;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).contentEditable === 'false') {
        return false;
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        if (calcPosition(node.childNodes[i], endNode, endOffset)) {
          return true;
        }
      }
    }
    return false;
  };
  calcPosition(element, range.startContainer, range.startOffset);

  // 查找光标前的 @ 符号
  let atNode: Node | null = null;
  let atOffset = 0;
  let currentPos = 0;

  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).textContent || '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '@' && currentPos + i <= cursorPos) {
          atNode = node;
          atOffset = i;
        }
      }
      currentPos += text.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).contentEditable === 'false') {
        return;
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        walkNodes(node.childNodes[i]);
      }
    }
  };

  walkNodes(element);

  return atNode ? { node: atNode, offset: atOffset } : null;
};

const handlePhotoKeydown = (event: KeyboardEvent) => {
  if (event.key == 'Enter') {
    if (event.shiftKey) {
      event.preventDefault();
      document.execCommand('insertLineBreak');
    }
  }

  const maxLimit = getPhotoMaxInputLimit();
  if (photoEditableInputRef.value) {
    const currentCharCount = getInputCharCount(photoEditableInputRef.value);
    if (currentCharCount >= maxLimit && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
      return;
    }
  }

  if (!photoEditableInputRef.value) return;

  const target = photoEditableInputRef.value;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  if (event.key === 'Backspace') {
    if (range.startOffset === 0 && range.startContainer === target.firstChild) {
      return;
    }

    if (range.startContainer.nodeType === 3 && range.startOffset > 0) {
      const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || '';
      if (textBeforeCursor.trim() !== '') {
        return;
      }
    }

    let previousSibling: Node | null = range.startContainer;
    if (range.startOffset > 0) {
      if (previousSibling && previousSibling.nodeType === 3) {
        const textBeforeCursor = previousSibling.textContent?.substring(0, range.startOffset) || '';
        if (textBeforeCursor.trim() === '') {
          previousSibling = previousSibling.previousSibling;
        } else {
          return;
        }
      }
    } else {
      previousSibling = previousSibling?.previousSibling || null;
    }

    while (previousSibling) {
      if (previousSibling.nodeType === 1) {
        const element = previousSibling as HTMLElement;
        if (element.classList.contains('image-tag')) {
          let hasTextBetween = false;
          let currentNode: Node | null = range.startContainer;

          while (currentNode && currentNode !== element) {
            if (currentNode.nodeType === 3) {
              const text = currentNode.textContent || '';
              if (text.trim() !== '') {
                hasTextBetween = true;
                break;
              }
            }
            currentNode = currentNode.previousSibling;
          }

          if (!hasTextBetween) {
            const whitespaceNode = element.previousSibling;
            if (whitespaceNode && whitespaceNode.nodeType === 3 && whitespaceNode.textContent?.trim() === '') {
              whitespaceNode.remove();
            }
            element.remove();
            event.preventDefault();
            break;
          }
        }
      }
      previousSibling = previousSibling.previousSibling;
    }
  } else if (event.key === 'Delete') {
    let nextSibling: Node | null = range.startContainer;

    if (range.startOffset < (range.startContainer.textContent?.length || 0)) {
      const textAfterCursor = range.startContainer.textContent?.substring(range.startOffset) || '';
      if (textAfterCursor.trim() !== '') {
        return;
      }
      nextSibling = nextSibling.nextSibling;
    } else {
      nextSibling = nextSibling.nextSibling;
    }

    while (nextSibling) {
      if (nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
        nextSibling = nextSibling.nextSibling;
        continue;
      }

      if (nextSibling.nodeType === 1) {
        const element = nextSibling as HTMLElement;
        if (element.classList.contains('image-tag')) {
          element.remove();
          event.preventDefault();
          break;
        }
      }
      break;
    }
  }
};

const handlePhotoInputFocus = () => {
  isPhotoInputFocused.value = true;
  isPhotoInputCollapsed.value = false;
  lastCollapseState = false;
  if (photoEditableInputRef.value) {
    previousPhotoInputHtml.value = photoEditableInputRef.value.innerHTML;
  }
  if (photoTypewriterTimer) {
    clearTimeout(photoTypewriterTimer);
    photoTypewriterTimer = null;
  }
  photoPlaceholderDisplay.value = photoPlaceholderFull.value;
};

const handlePhotoInputBlur = () => {
  isPhotoInputFocused.value = false;
  checkInputCollapse();
  if (!isPhotoInputCollapsed.value) {
    photoPlaceholderDisplay.value = '';
    startPhotoTypewriter();
  }
};

const handleVideoInputFocus = () => {
  isVideoInputFocused.value = true;
  isVideoInputCollapsed.value = false;
  lastCollapseState = false;
  if (videoEditableInputRef.value) {
    previousVideoInputHtml.value = videoEditableInputRef.value.innerHTML;
  }
  if (videoTypewriterTimer) {
    clearTimeout(videoTypewriterTimer);
    videoTypewriterTimer = null;
  }
  videoPlaceholderDisplay.value = videoPlaceholderFull.value;
};

const handleVideoInputBlur = () => {
  isVideoInputFocused.value = false;
  checkInputCollapse();
  if (!isVideoInputCollapsed.value) {
    videoPlaceholderDisplay.value = '';
    startVideoTypewriter();
  }
};

const handlePhotoPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  if (!photoEditableInputRef.value) return;

  const maxLimit = getPhotoMaxInputLimit();
  const currentCharCount = getInputCharCount(photoEditableInputRef.value);
  const text = event.clipboardData?.getData('text/plain') || '';

  if (currentCharCount + text.length > maxLimit) {
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  // Insert plain text at cursor position
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move cursor after the inserted text
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // If no selection, append to end
    photoEditableInputRef.value.textContent += text;
  }
  previousPhotoInputHtml.value = photoEditableInputRef.value.innerHTML;
};

const handleVideoPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  if (!videoEditableInputRef.value) return;

  const maxLimit = getVideoMaxInputLimit();
  const currentCharCount = getInputCharCount(videoEditableInputRef.value);
  const text = event.clipboardData?.getData('text/plain') || '';

  if (currentCharCount + text.length > maxLimit) {
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  // Insert plain text at cursor position
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move cursor after the inserted text
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // If no selection, append to end
    videoEditableInputRef.value.textContent += text;
  }
  previousVideoInputHtml.value = videoEditableInputRef.value.innerHTML;
};

let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let lastCollapseState: boolean | null = null;

const checkInputCollapse = () => {
  if (isPhotoInputFocused.value) {
    if (lastCollapseState !== false) {
      isPhotoInputCollapsed.value = false;
      isVideoInputCollapsed.value = false;
      lastCollapseState = false;
    }
    return;
  }

  if (isVideoInputFocused.value) {
    if (lastCollapseState !== false) {
      isVideoInputCollapsed.value = false;
      isPhotoInputCollapsed.value = false;
      lastCollapseState = false;
    }
    return;
  }

  const bottomGenerator = document.querySelector('.bottom-generator');
  if (!bottomGenerator) {
    if (lastCollapseState !== false) {
      isPhotoInputCollapsed.value = false;
      isVideoInputCollapsed.value = false;
      lastCollapseState = false;
      startPhotoTypewriter();
      startVideoTypewriter();
    }
    return;
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;
  const isNearBottom = scrollTop + windowHeight >= docHeight - 10;

  const targetState = !isNearBottom;

  if (lastCollapseState !== targetState) {
    isPhotoInputCollapsed.value = targetState;
    isVideoInputCollapsed.value = targetState;
    lastCollapseState = targetState;
    if (bottomActiveTab.value === 'photo') {
      startPhotoTypewriter();
    } else {
      startVideoTypewriter();
    }
  }
};

const handleScrollForInput = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    // Blur input fields when scrolling
    if (photoEditableInputRef.value) {
      photoEditableInputRef.value.blur();
    }
    if (videoEditableInputRef.value) {
      videoEditableInputRef.value.blur();
    }
    checkInputCollapse();
  }, 150);
};

const photoQualityOptions = ref([
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' }
]);
const photoRatioOptions = ref([
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' }
]);

// Video settings for bottom generator
const showVideoSettings = ref(false);
const selectedVideoQuality = ref('1080P');
const selectedVideoRatio = ref('9:16');
const selectedVideoDuration = ref('15');
const lastValidVideoDuration = ref('15');
const uploadedVideoDuration = ref(0);
const showVideoMultimodalDropdown = ref(false);
const selectedVideoMultimodal = ref('multimodal');
const videoRefInput = ref<HTMLInputElement | null>(null);
const videoEditableInputRef = ref<HTMLElement | null>(null);
const uploadedVideoRefs = ref<any[]>([]);
const videoMultimodalOptions = computed(() => {
  const options = [
    { value: 'multimodal', label: t('home.videoMode.multimodal') },
    { value: 'startEndFrames', label: t('home.videoMode.startEndFrames') }
  ];
  // 视频续写类型只在无限制模式下显示
  if (currentVideoMode.value === 'unlimited') {
    options.push({ value: 'videoExtend', label: t('home.videoMode.videoExtend') });
  }
  return options;
});
const videoQualityOptions = ref([
  { value: '720P', label: '720P' },
  { value: '1080P', label: '1080P' }
]);
const videoRatioOptions = ref([
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' }
]);
const videoDurationOptions = computed(() => {
  const minDuration = currentVideoMode.value === 'unlimited' ? 4 : 2;
  if (minDuration === 4) {
    return [
      { value: '4', label: '4s' },
      { value: '5', label: '5s' },
      { value: '10', label: '10s' },
      { value: '15', label: '15s' }
    ];
  }
  return [
    { value: '2', label: '2s' },
    { value: '5', label: '5s' },
    { value: '10', label: '10s' },
    { value: '15', label: '15s' }
  ];
});

// Input content
const videoInput = ref('');

const handleVideoTextareaInput = () => {
  const maxLimit = getVideoMaxInputLimit();
  if (videoInput.value.length > maxLimit) {
    videoInput.value = videoInput.value.substring(0, maxLimit);
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
  }
};

// Bottom generator active tab
const bottomActiveTab = ref('photo');

const resetPhotoSettings = () => {
  selectedPhotoQuality.value = '1K';
  selectedPhotoRatio.value = '9:16';
  // Reset unlimited mode when switching tabs
  currentPhotoMode.value = 'normal';
};

const resetVideoSettings = () => {
  selectedVideoQuality.value = '1080P';
  selectedVideoRatio.value = '9:16';
  selectedVideoDuration.value = '15';
  selectedVideoMultimodal.value = 'multimodal';
  videoInput.value = '';
  uploadedVideoRefs.value = [];
  startFrameImage.value = '';
  endFrameImage.value = '';
  uploadedVideo.value = '';
  uploadedVideoCover.value = '';
  // Reset unlimited mode when switching tabs
  currentVideoMode.value = 'normal';
};

const switchBottomTab = (tab: string) => {
  bottomActiveTab.value = tab;
  setSeoMeta(tab);
  if (tab == 'photo') {
    resetPhotoSettings();
    // Clear video input when switching to photo
    if (videoEditableInputRef.value) {
      videoEditableInputRef.value.innerHTML = '';
    }
    uploadedVideoRefs.value = [];
    if (videoTypewriterTimer) {
      clearTimeout(videoTypewriterTimer);
      videoTypewriterTimer = null;
    }
    startPhotoTypewriter();
  } else {
    resetVideoSettings();
    // Clear photo input when switching to video
    if (photoEditableInputRef.value) {
      photoEditableInputRef.value.innerHTML = '';
    }
    uploadedPhotoImages.value = [];
    photoInputKey.value++;
    if (photoTypewriterTimer) {
      clearTimeout(photoTypewriterTimer);
      photoTypewriterTimer = null;
    }
    startVideoTypewriter();
  }
};

const triggerPhotoUpload = () => {
  if (photoFileInput.value) {
    photoFileInput.value.click();
  }
};

const handlePhotoFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files);

    // Photo upload limits based on mode
    const maxPhotos = currentPhotoMode.value === 'unlimited' ? 3 : 7;
    const maxFileSizeMB = currentPhotoMode.value === 'unlimited' ? 20 : 30;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Check total count limit
    if (uploadedPhotoImages.value.length + files.length > maxPhotos) {
      toast(t('home.error.maxPhotoReached', { max: maxPhotos }));
      input.value = '';
      return;
    }

    // Check individual file format, size and corruption
    for (const file of files) {
      if (!validImageTypes.includes(file.type)) {
        toast(t('home.error.invalidPhotoFormat'));
        input.value = '';
        return;
      }
      if (file.size > maxFileSizeBytes) {
        toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
        input.value = '';
        return;
      }
      // Check if image is corrupted (broken image)
      const isCorrupted = await isImageCorrupted(file);
      if (isCorrupted) {
        toast(t('home.error.corruptedImage'));
        input.value = '';
        return;
      }
    }

    isUploading.value = true;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedUrl = await uploadImage(file, 'normal');
        if (uploadedUrl) {
          const newImageItem = {
            id: Date.now() + i.toString(),
            name: file.name,
            image: uploadedUrl,
            type: 'image'
          };
          uploadedPhotoImages.value.push(newImageItem);

          if (photoEditableInputRef.value) {
            const imageIndex = uploadedPhotoImages.value.length;

            const itemTag = document.createElement('span');
            itemTag.className = 'image-tag';
            itemTag.contentEditable = 'false';
            itemTag.dataset.itemId = newImageItem.id;

            const img = document.createElement('img');
            img.src = newImageItem.image;
            img.alt = newImageItem.name;
            img.className = 'image-tag-img';

            const textNode = document.createTextNode(`${t('home.img')}${imageIndex}`);

            itemTag.appendChild(img);
            itemTag.appendChild(textNode);

            photoEditableInputRef.value.appendChild(itemTag);
            photoEditableInputRef.value.appendChild(document.createTextNode(' '));
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast((error as Error).message || '上传失败');
    } finally {
      isUploading.value = false;
      input.value = '';
    }
  }
};

const removePhotoImage = (id: string) => {
  uploadedPhotoImages.value = uploadedPhotoImages.value.filter(img => img.id !== id);

  if (photoEditableInputRef.value) {
    // Remove all tags with matching item-id
    const tagsToRemove = photoEditableInputRef.value.querySelectorAll(`span[data-item-id="${id}"]`);
    tagsToRemove.forEach(tag => {
      const nextSibling = tag.nextSibling;
      if (nextSibling && nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
        nextSibling.remove();
      }
      tag.remove();
    });

    // Update remaining tags' numbering
    const remainingImages = photoEditableInputRef.value.querySelectorAll('.image-tag');
    const imageCount = { image: 0 };
    remainingImages.forEach(tag => {
      imageCount.image++;
      const textNode = tag.querySelector('img')?.nextSibling;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = `${t('home.img')}${imageCount.image}`;
      }
    });
  }
};

const triggerVideoUpload = () => {
  if (videoRefInput.value) {
    videoRefInput.value.click();
  }
};

const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration || 0);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(file);
    } else {
      resolve(0);
    }
  });
};

// Check if image file is corrupted (broken image)
const isImageCorrupted = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      // Check if image dimensions are valid (0x0 usually indicates corruption)
      if (img.width === 0 || img.height === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };

    img.src = url;
  });
};

const captureVideoFirstFrame = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let hasResolved = false;

    const captureFrame = () => {
      if (hasResolved) return;
      hasResolved = true;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(video.src);
          reject(new Error('无法获取canvas上下文'));
        }
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onloadedmetadata = () => {
      // 设置一个很小的时间点（0.1秒），确保能获取到第一帧
      video.currentTime = Math.min(0.1, video.duration || 0);
    };

    video.onseeked = () => {
      captureFrame();
    };

    video.onerror = () => {
      if (!hasResolved) {
        URL.revokeObjectURL(video.src);
        reject(new Error('视频加载失败'));
      }
    };

    // 添加超时处理，防止无限等待
    const timeout = setTimeout(() => {
      if (!hasResolved && video.readyState >= 2) {
        captureFrame();
      }
    }, 3000);

    video.src = URL.createObjectURL(file);
  });
};

const dataURLToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const handleVideoRefUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files);

    // Get upload limits based on mode
    const maxFileSizeBytes = currentVideoMode.value === 'unlimited' ? 20 * 1024 * 1024 : 30 * 1024 * 1024;
    const maxVideoSizeBytes = currentVideoMode.value === 'unlimited' ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    const maxAudioSizeBytes = 15 * 1024 * 1024;

    // Check video and audio total duration limits (15 seconds each) for video multimodal mode
    if (selectedVideoMultimodal.value == 'multimodal') {
      let totalVideoDuration = 0;
      let totalAudioDuration = 0;

      // Add duration of existing uploaded videos
      for (const item of uploadedVideoRefs.value) {
        if (item.type === 'video' && item.duration) {
          totalVideoDuration += item.duration;
        } else if (item.type === 'audio' && item.duration) {
          totalAudioDuration += item.duration;
        }
      }

      // Add duration of new files
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          const duration = await getMediaDuration(file);
          totalVideoDuration += duration;
        } else if (file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(file);
          totalAudioDuration += duration;
        }
      }

      // Check video duration limit (15 seconds)
      if (totalVideoDuration > 15) {
        toast(t('home.error.videoDurationLimit'));
        input.value = '';
        return;
      }

      // Check audio duration limit (15 seconds)
      if (totalAudioDuration > 15) {
        toast(t('home.error.audioDurationLimit'));
        input.value = '';
        return;
      }
    }

    // Check file size limits for multimodal mode
    if (selectedVideoMultimodal.value == 'multimodal') {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          if (file.size > maxVideoSizeBytes) {
            toast(t('home.error.maxVideoSize', { max: currentVideoMode.value === 'unlimited' ? 100 : 50 }));
            input.value = '';
            return;
          }
        } else if (file.type.startsWith('audio/')) {
          if (file.size > maxAudioSizeBytes) {
            toast(t('home.error.maxAudioSize', { max: 15 }));
            input.value = '';
            return;
          }
          const duration = await getMediaDuration(file);
          if (duration < 2) {
            toast(t('home.error.audioDurationTooShort', { min: 2 }));
            input.value = '';
            return;
          }
        } else {
          if (!validImageTypes.includes(file.type)) {
            toast(t('home.error.invalidPhotoFormat'));
            input.value = '';
            return;
          }
          if (file.size > maxFileSizeBytes) {
            toast(t('home.error.maxPhotoSize', { max: currentVideoMode.value === 'unlimited' ? 20 : 30 }));
            input.value = '';
            return;
          }
          const isCorrupted = await isImageCorrupted(file);
          if (isCorrupted) {
            toast(t('home.error.corruptedImage'));
            input.value = '';
            return;
          }
        }
      }

      // Check video and audio count limits (max 3 each in multimodal mode)
      const existingVideos = uploadedVideoRefs.value.filter(ref => ref.type === 'video').length;
      const existingAudios = uploadedVideoRefs.value.filter(ref => ref.type === 'audio').length;
      const newVideos = files.filter(f => f.type.startsWith('video/')).length;
      const newAudios = files.filter(f => f.type.startsWith('audio/')).length;

      if (existingVideos + newVideos > 3) {
        toast(t('home.error.maxVideoCount'));
        input.value = '';
        return;
      }
      if (existingAudios + newAudios > 3) {
        toast(t('home.error.maxAudioCount'));
        input.value = '';
        return;
      }
    }

    if (selectedVideoMultimodal.value == 'multimodal') {
      const existingImages = uploadedVideoRefs.value.filter(ref => ref.type === 'image').length;
      const newImages = files.filter(f => !f.type.startsWith('video/') && !f.type.startsWith('audio/')).length;

      const maxImages = currentVideoMode.value === 'unlimited' ? 3 : 9;

      if (existingImages + newImages > maxImages) {
        toast(t('home.error.maxPhotoReached', { max: maxImages }));
        input.value = '';
        return;
      }
    } else {
      if (uploadedVideoRefs.value.length + files.length > 4) {
        toast(t('home.error.maxItemsReached'));
        input.value = '';
        return;
      }
    }

    isUploading.value = true;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileType = 'image';
        let coverUrl = '';

        if (file.type.startsWith('video/')) {
          fileType = 'video';
          const videoExtensions = ['.mp4', '.mov'];
          const videoExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          if (!videoExtensions.includes(videoExtension)) {
            toast(t('home.error.invalidVideoFormat'));
            continue;
          }

          try {
            const frameDataUrl = await captureVideoFirstFrame(file);
            const coverFile = dataURLToFile(frameDataUrl, `${file.name}_cover.jpg`);
            coverUrl = await uploadImage(coverFile, 'normal');
          } catch (error) {
            console.error('Failed to capture video cover:', error);
          }
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
          const audioExtensions = ['.mp3', '.wav'];
          const audioExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          if (!audioExtensions.includes(audioExtension)) {
            toast(t('home.error.invalidAudioFormat'));
            continue;
          }
        }

        const duration = fileType === 'video' || fileType === 'audio' ? await getMediaDuration(file) : 0;

        const uploadedUrl = fileType === 'video'
          ? await uploadVideo(file)
          : fileType === 'audio'
          ? await uploadAudio(file)
          : await uploadImage(file, 'normal');

        if (uploadedUrl) {
          const newItem = {
            id: Date.now() + i.toString(),
            name: file.name,
            image: uploadedUrl,
            type: fileType,
            cover: coverUrl,
            duration: duration
          };
          const newIndex = uploadedVideoRefs.value.length;
          uploadedVideoRefs.value.push(newItem);

          insertVideoRefTag(newItem, newIndex);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast((error as Error).message || '上传失败');
    } finally {
      isUploading.value = false;
      input.value = '';
    }
  }
};

const insertVideoRefTag = (item: any, index: number) => {
  if (selectedVideoMultimodal.value !== 'multimodal') {
    return;
  }

  if (!videoEditableInputRef.value) {
    return;
  }

  const target = videoEditableInputRef.value;

  if (target.textContent?.trim() == '') {
    target.innerHTML = '';
  }

  // Calculate type-specific index (e.g., image1, image2, video1, video2)
  const typeCount = uploadedVideoRefs.value.slice(0, index).filter((i: any) => i.type === item.type).length + 1;

  const itemTag = document.createElement('span');
  itemTag.className = item.type === 'image' ? 'image-tag' : item.type === 'video' ? 'video-tag' : 'audio-tag';
  itemTag.contentEditable = 'false';
  itemTag.dataset.itemId = item.id;
  itemTag.dataset.src = item.image;
  itemTag.dataset.type = item.type;

  const typeLabel = item.type == 'image' ? t('home.img') : item.type == 'video' ? t('home.video') : t('home.audio');
  itemTag.dataset.name = `${typeLabel}${typeCount}`;

  if (item.type == 'image') {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';
    itemTag.appendChild(img);
  } else if (item.type == 'video') {
    const img = document.createElement('img');
    img.src = item.cover || item.image;
    img.alt = item.name;
    img.className = 'video-tag-img';
    img.style.maxWidth = '60px';
    img.style.maxHeight = '60px';
    img.style.objectFit = 'cover';
    itemTag.appendChild(img);
  } else if (item.type == 'audio') {
    const img = document.createElement('img');
    img.src = audioIcon;
    img.alt = item.name;
    img.className = 'audio-tag-img';
    itemTag.appendChild(img);
  }

  const textNode = document.createTextNode(`${typeLabel}${typeCount}`);
  itemTag.appendChild(textNode);

  const lastChild = target.lastChild;
  if (lastChild && lastChild.nodeType == Node.TEXT_NODE && lastChild.textContent && !lastChild.textContent.endsWith(' ')) {
    lastChild.textContent += ' ';
  } else if (!lastChild) {
    target.appendChild(document.createTextNode(''));
  }

  target.appendChild(itemTag);
  target.appendChild(document.createTextNode(' '));
};

const showVideoRefDropdown = ref(false);
const videoRefDropdownItems = ref<any[]>([]);

const handleVideoInput = () => {
  if (!videoEditableInputRef.value) return;

  const target = videoEditableInputRef.value;

  const maxLimit = getVideoMaxInputLimit();
  const currentCharCount = getInputCharCount(target);
  if (currentCharCount > maxLimit) {
    target.innerHTML = previousVideoInputHtml.value;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }
  previousVideoInputHtml.value = target.innerHTML;

  let actualText = '';
  const textNodes = Array.from(target.childNodes).filter(node => {
    if (node.nodeType === 3) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      return !isInNonEditable;
    }
    return false;
  });
  textNodes.forEach(node => {
    actualText += node.textContent || '';
  });

  const cursorPosition = getVideoCursorPosition(target);
  const textBeforeCursor = actualText.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1 && uploadedVideoRefs.value.length > 0) {
    showVideoRefDropdown.value = true;
    videoRefDropdownItems.value = uploadedVideoRefs.value;

    nextTick(() => {
      try {
        if (videoEditableInputRef.value) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) {
                if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
                  return false;
                }

                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) {
                if (node.nodeType === 1 && (node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
                  return false;
                }

                for (let i = 0; i < node.childNodes.length; i++) {
                  if (findAtSymbol(node.childNodes[i])) {
                    return true;
                  }
                }
              }
              return false;
            };

            findAtSymbol(videoEditableInputRef.value);

            if (foundAtNode) {
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = videoEditableInputRef.value.parentElement;
              const dropdown = document.querySelector('.at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.top = `${relativeTop + 5}px`;
                dropdown.style.left = `${relativeLeft}px`;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error positioning dropdown:', error);
      }
    });
  } else {
    showVideoRefDropdown.value = false;
  }
};

const getVideoCursorPosition = (element: HTMLElement): number => {
  let position = 0;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return position;
  }

  const range = selection.getRangeAt(0);
  const rangeClone = range.cloneRange();

  const calculatePosition = (node: Node, offset: number): number => {
    if (node.nodeType === 3) {
      let parent = node.parentElement;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          return 0;
        }
        parent = parent.parentElement;
      }
      return Math.min(offset, node.textContent?.length || 0);
    } else if (node.nodeType === 1) {
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return 0;
      }
      let total = 0;
      for (let i = 0; i < node.childNodes.length; i++) {
        if (i < offset) {
          total += getTextLength(node.childNodes[i]);
        } else if (i === offset) {
          total += calculatePosition(node.childNodes[i], node.childNodes[i].nodeType === 3 ? (node.textContent?.length || 0) : node.childNodes[i].childNodes.length);
        }
      }
      return total;
    }
    return 0;
  };

  const getTextLength = (node: Node): number => {
    if (node.nodeType === 3) {
      let parent = node.parentElement;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          return 0;
        }
        parent = parent.parentElement;
      }
      return node.textContent?.length || 0;
    } else if (node.nodeType === 1) {
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return 0;
      }
      let total = 0;
      for (let i = 0; i < node.childNodes.length; i++) {
        total += getTextLength(node.childNodes[i]);
      }
      return total;
    }
    return 0;
  };

  if (range.startContainer.nodeType === 3) {
    const parent = range.startContainer.parentElement;
    if (parent?.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
      return 0;
    }
  }

  let total = 0;
  const parent = range.commonAncestorContainer;

  const traverseToStart = (node: Node, targetNode: Node, targetOffset: number): boolean => {
    if (node === targetNode) {
      total += calculatePosition(node, targetOffset);
      return true;
    }

    if (node.nodeType === 1) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverseToStart(node.childNodes[i], targetNode, targetOffset)) {
          return true;
        }
        if (node.childNodes[i] !== targetNode) {
          total += getTextLength(node.childNodes[i]);
        }
      }
    }
    return false;
  };

  traverseToStart(element, range.startContainer, range.startOffset);
  return total;
};

const handleVideoKeydown = (event: KeyboardEvent) => {
  if (!videoEditableInputRef.value) return;

  const maxLimit = getVideoMaxInputLimit();
  const currentCharCount = getInputCharCount(videoEditableInputRef.value);
  if (currentCharCount >= maxLimit && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  const target = videoEditableInputRef.value;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  if (event.key === 'Backspace') {
    if (range.startOffset === 0 && range.startContainer === target.firstChild) {
      return;
    }

    if (range.startContainer.nodeType === 3 && range.startOffset > 0) {
      const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || '';
      if (textBeforeCursor.trim() !== '') {
        return;
      }
    }

    let previousSibling: Node | null = range.startContainer;
    if (range.startOffset > 0) {
      if (previousSibling && previousSibling.nodeType === 3) {
        const textBeforeCursor = previousSibling.textContent?.substring(0, range.startOffset) || '';
        if (textBeforeCursor.trim() === '') {
          previousSibling = previousSibling.previousSibling;
        } else {
          return;
        }
      }
    } else {
      previousSibling = previousSibling?.previousSibling || null;
    }

    while (previousSibling) {
      if (previousSibling.nodeType === 1) {
        const element = previousSibling as HTMLElement;
        if (element.classList.contains('image-tag')) {
          let hasTextBetween = false;
          let currentNode: Node | null = range.startContainer;

          while (currentNode && currentNode !== element) {
            if (currentNode.nodeType === 3) {
              const text = currentNode.textContent || '';
              if (text.trim() !== '') {
                hasTextBetween = true;
                break;
              }
            }
            currentNode = currentNode.previousSibling;
          }

          if (!hasTextBetween) {
            const whitespaceNode = element.previousSibling;
            if (whitespaceNode && whitespaceNode.nodeType === 3 && whitespaceNode.textContent?.trim() === '') {
              whitespaceNode.remove();
            }
            element.remove();
            event.preventDefault();
            break;
          }
        }
      }
      previousSibling = previousSibling.previousSibling;
    }
  } else if (event.key === 'Delete') {
    let nextSibling: Node | null = range.startContainer;

    if (range.startOffset < (range.startContainer.textContent?.length || 0)) {
      const textAfterCursor = range.startContainer.textContent?.substring(range.startOffset) || '';
      if (textAfterCursor.trim() !== '') {
        return;
      }
      nextSibling = nextSibling.nextSibling;
    } else {
      nextSibling = nextSibling.nextSibling;
    }

    while (nextSibling) {
      if (nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
        nextSibling = nextSibling.nextSibling;
        continue;
      }

      if (nextSibling.nodeType === 1) {
        const element = nextSibling as HTMLElement;
        if (element.classList.contains('image-tag')) {
          element.remove();
          event.preventDefault();
          break;
        }
      }
      break;
    }
  }
};

const handleVideoInputClick = () => {
  handleVideoInput();
};

const selectVideoRefItem = (item: any) => {
  if (!videoEditableInputRef.value) return;

  const target = videoEditableInputRef.value;
  const savedHtml = target.innerHTML;
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    // 没有选中区域，直接在末尾添加
    const itemTag = createVideoItemTag(item);
    target.appendChild(itemTag);
    target.appendChild(document.createTextNode(' '));
    target.focus();
    showVideoRefDropdown.value = false;
    return;
  }

  const range = selection.getRangeAt(0);

  // 查找光标位置前的 @ 符号
  const atInfo = findAtSymbolBeforeCursor(target, selection);

  if (atInfo) {
    const { node, offset } = atInfo;

    // 创建 range 删除 @ 符号
    const atRange = document.createRange();
    atRange.setStart(node, offset);
    atRange.setEnd(node, offset + 1);

    // 删除 @
    atRange.deleteContents();

    // 创建 item tag
    const itemTag = createVideoItemTag(item);

    // 插入 item tag
    atRange.insertNode(itemTag);

    // 添加空格
    const spaceNode = document.createTextNode(' ');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 设置光标位置在空格后面
    const cursorRange = document.createRange();
    cursorRange.setStartAfter(spaceNode);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  } else {
    // 没有找到 @，直接在光标位置插入
    const itemTag = createVideoItemTag(item);
    range.insertNode(itemTag);

    // 添加空格
    const spaceNode = document.createTextNode(' ');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 设置光标位置在空格后面
    const cursorRange = document.createRange();
    cursorRange.setStartAfter(spaceNode);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  }

  showVideoRefDropdown.value = false;

  const maxLimit = getVideoMaxInputLimit();
  if (getInputCharCount(target) > maxLimit) {
    target.innerHTML = savedHtml;
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }

  previousVideoInputHtml.value = target.innerHTML;
};

const createVideoItemTag = (item: any): HTMLElement => {
  // Calculate index based on type (same logic as dropdown display)
  let itemIndex = 0;
  if (item.type === 'image') {
    const itemPos = uploadedVideoRefs.value.findIndex((v: any) => v.id === item.id);
    itemIndex = uploadedVideoRefs.value.slice(0, itemPos + 1).filter((i: any) => i.type === 'image').length;
  } else {
    const itemPos = uploadedVideoRefs.value.findIndex((v: any) => v.id === item.id);
    itemIndex = uploadedVideoRefs.value.slice(0, itemPos + 1).filter((i: any) => i.type === item.type).length;
  }

  const itemTag = document.createElement('span');
  itemTag.className = item.type == 'image' ? 'image-tag' : item.type == 'video' ? 'video-tag' : 'audio-tag';
  itemTag.contentEditable = 'false';
  itemTag.dataset.itemId = item.id;
  itemTag.dataset.src = item.image;
  itemTag.dataset.type = item.type;

  const typeLabel = item.type == 'image' ? t('home.img') : item.type == 'video' ? t('home.video') : t('home.audio');
  const itemName = `${typeLabel}${itemIndex}`;
  itemTag.dataset.name = itemName;

  if (item.type == 'image') {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';
    itemTag.appendChild(img);
  } else if (item.type == 'video') {
    const img = document.createElement('img');
    img.src = item.cover || item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';
    img.style.objectFit = 'cover';
    itemTag.appendChild(img);
  } else if (item.type == 'audio') {
    const img = document.createElement('img');
    img.src = audioIcon;
    img.alt = item.name;
    img.className = 'audio-tag-img';
    itemTag.appendChild(img);
  }

  const textNode = document.createTextNode(itemName);
  itemTag.appendChild(textNode);

  return itemTag;
};

const getVideoInputContent = () => {
  if (selectedVideoMultimodal.value === 'startEndFrames' || selectedVideoMultimodal.value === 'videoExtend') {
    return videoInput.value || '';
  }

  if (!videoEditableInputRef.value) return '';

  let content = '';
  let imageIndex = 1;
  let videoIndex = 1;
  let audioIndex = 1;

  const processNode = (node: Node) => {
    if (node.nodeType == Node.TEXT_NODE) {
      content += node.textContent || '';
    } else if (node.nodeType == Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      if (element.classList.contains('image-tag') || element.classList.contains('video-tag') || element.classList.contains('audio-tag')) {
        const src = element.dataset.src;
        const itemType = element.dataset.type;
        if (src && itemType) {
          let tagPrefix = 'ref';
          let currentIndex = imageIndex;
          if (itemType === 'video') {
            currentIndex = videoIndex++;
            tagPrefix = 'vid';
          } else if (itemType === 'audio') {
            currentIndex = audioIndex++;
            tagPrefix = 'aud';
          } else {
            currentIndex = imageIndex++;
          }
          content += `<${tagPrefix}_${currentIndex}>`;
          return;
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        processNode(node.childNodes[i]);
      }
    }
  };

  for (let i = 0; i < videoEditableInputRef.value.childNodes.length; i++) {
    processNode(videoEditableInputRef.value.childNodes[i]);
  }

  return content.trim();
};

const removeVideoRef = (id: string) => {
  // First, remove references from video input-textarea
  if (videoEditableInputRef.value) {
    const tags = videoEditableInputRef.value.querySelectorAll('.image-tag, .video-tag, .audio-tag');

    // Collect all tags to remove first
    const tagsToRemove: HTMLElement[] = [];
    tags.forEach(tag => {
      const tagElement = tag as HTMLElement;
      const tagItemId = tagElement.dataset.itemId;
      if (tagItemId === id) {
        tagsToRemove.push(tagElement);
      }
    });

    // Remove all matching tags
    tagsToRemove.forEach(tag => {
      // Check if there's a space after the tag and remove it too
      const nextSibling = tag.nextSibling;
      if (nextSibling && nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
        nextSibling.remove();
      }
      tag.remove();
    });

    // Update remaining tags' numbering
    const remainingTags = videoEditableInputRef.value.querySelectorAll('.image-tag, .video-tag, .audio-tag');

    const videoCount = { video: 0, audio: 0, image: 0 };
    remainingTags.forEach(tag => {
      const tagElement = tag as HTMLElement;
      const tagType = tagElement.dataset.type || 'image';
      videoCount[tagType as keyof typeof videoCount]++;

      const textNode = tag.querySelector('img')?.nextSibling;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const typeLabel = tagType === 'video' ? t('home.video') : tagType === 'audio' ? t('home.audio') : t('home.img');
        textNode.textContent = `${typeLabel}${videoCount[tagType as keyof typeof videoCount]}`;
      }
    });
  }

  // Then remove from the uploaded refs array
  uploadedVideoRefs.value = uploadedVideoRefs.value.filter(ref => ref.id !== id);
};

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const triggerExtendVideoUpload = () => {
  if (videoInputRef.value) {
    videoInputRef.value.click();
  }
};

const selectVideoMultimodal = (value: string) => {
  selectedVideoMultimodal.value = value;
  showVideoMultimodalDropdown.value = false;
  videoInput.value = '';
  startFrameImage.value = '';
  endFrameImage.value = '';
  uploadedVideo.value = '';
  uploadedVideoCover.value = '';
  uploadedVideoRefs.value = [];

  selectedVideoQuality.value = '1080P';
  selectedVideoRatio.value = '9:16';
  selectedVideoDuration.value = '15';

  if (value === 'videoExtend' && uploadedVideoRefs.value.length > 0) {
    const videoItem = uploadedVideoRefs.value.find((item: any) => item.type === 'video');
    if (videoItem) {
      uploadedVideo.value = videoItem.url;
      uploadedVideoCover.value = videoItem.cover || '';
    }
  }
};

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}

// Upload image to server
async function uploadImage(file: File, mode: string): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return '';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const authHeaders = (window as any).AntiCrawler?.generateAuthParams?.(token) || {};

  const params = {
    method: "POST",
    headers: {
      token: token,
      'Platform': 'web',
      ...authHeaders,
    },
    body: formData,
  };

  const res = await fetch(baseUrl + "user/uploadImage", params);
  const data = await res.json();
  if (data.code == 0 || data.code == 200) {
    return data.data.url || '';
  } else {
    throw new Error(data.msg);
  }
}

// Upload video to server using presigned URL
async function uploadVideo(file: File): Promise<string> {
  // Get file extension
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.') + 1);

  // Step 1: Get presigned upload URL using api.uploadAduio
  const response = await api.uploadAduio({ extension: ext }) as any;
  const getUrlRes = response;

  if (getUrlRes.code !== 0 && getUrlRes.code !== 200) {
    throw new Error(getUrlRes.msg);
  }

  const presignedUrl = getUrlRes.data.url;
  if (!presignedUrl) {
    throw new Error('Failed to get upload URL');
  }

  // Step 2: Upload file using PUT method
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': ext === 'mov' ? 'video/quicktime' : 'video/mp4',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }

  // Extract the clean URL without signature parameters and replace domain
  const cleanUrl = presignedUrl.split('?')[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, 'https://static.moegen.ai');
}

// Upload audio to server using presigned URL
async function uploadAudio(file: File): Promise<string> {
  // Get file extension
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.') + 1);

  // Step 1: Get presigned upload URL using api.uploadAduio
  const response = await api.uploadAduio({ extension: ext }) as any;
  const getUrlRes = response;

  if (getUrlRes.code !== 0 && getUrlRes.code !== 200) {
    throw new Error(getUrlRes.msg);
  }

  const presignedUrl = getUrlRes.data.url;
  if (!presignedUrl) {
    throw new Error('Failed to get upload URL');
  }

  // Step 2: Upload file using PUT method
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }

  // Extract the clean URL without signature parameters and replace domain
  const cleanUrl = presignedUrl.split('?')[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, 'https://static.moegen.ai');
}

// Video mode images and videos
const startFrameImage = ref<string>('');
const endFrameImage = ref<string>('');
const uploadedVideo = ref<string>('');
const uploadedVideoCover = ref<string>('');
const startFrameInput = ref<HTMLInputElement | null>(null);
const endFrameInput = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);

const triggerStartFrameUpload = () => {
  startFrameInput.value?.click();
};

const triggerEndFrameUpload = () => {
  endFrameInput.value?.click();
};

const handleStartFrameChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // Check image format
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast(t('home.error.invalidPhotoFormat'));
      target.value = '';
      return;
    }
    const maxFileSizeBytes = currentVideoMode.value === 'unlimited' ? 20 * 1024 * 1024 : 30 * 1024 * 1024;
    const maxFileSizeMB = currentVideoMode.value === 'unlimited' ? 20 : 30;
    if (file.size > maxFileSizeBytes) {
      toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
      target.value = '';
      return;
    }
    // Check if image is corrupted (broken image)
    if (await isImageCorrupted(file)) {
      toast(t('home.error.corruptedImage'));
      target.value = '';
      return;
    }
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, 'normal');
      if (uploadedUrl) {
        startFrameImage.value = uploadedUrl;
      }
    } catch (error) {
      console.error('Failed to upload start frame:', error);
      toast((error as Error).message || '上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

const handleEndFrameChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // Check image format
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast(t('home.error.invalidPhotoFormat'));
      target.value = '';
      return;
    }
    const maxFileSizeBytes = currentVideoMode.value === 'unlimited' ? 20 * 1024 * 1024 : 30 * 1024 * 1024;
    const maxFileSizeMB = currentVideoMode.value === 'unlimited' ? 20 : 30;
    if (file.size > maxFileSizeBytes) {
      toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
      target.value = '';
      return;
    }
    // Check if image is corrupted (broken image)
    if (await isImageCorrupted(file)) {
      toast(t('home.error.corruptedImage'));
      target.value = '';
      return;
    }
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, 'normal');
      if (uploadedUrl) {
        endFrameImage.value = uploadedUrl;
      }
    } catch (error) {
      console.error('Failed to upload end frame:', error);
      toast((error as Error).message || '上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

const removeStartFrame = () => {
  startFrameImage.value = '';
  if (startFrameInput.value) {
    startFrameInput.value.value = '';
  }
};

const removeEndFrame = () => {
  endFrameImage.value = '';
  if (endFrameInput.value) {
    endFrameInput.value.value = '';
  }
};

const swapFrames = () => {
  const temp = startFrameImage.value;
  startFrameImage.value = endFrameImage.value;
  endFrameImage.value = temp;
};

const handleVideoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const videoExtensions = ['.mp4', '.mov'];
    const videoExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!videoExtensions.includes(videoExtension)) {
      toast(t('home.error.invalidVideoFormat'));
      target.value = '';
      return;
    }
    // Video duration validation
    const duration = await getVideoDuration(file);

    // 视频续写模式下，验证时长在2-5秒之间
    if (selectedVideoMultimodal.value == 'videoExtend') {
      if (duration < 2 || duration > 5) {
        toast(t('home.error.videoExtendDurationLimit'));
        target.value = '';
        return;
      }
    } else {
      // 其他模式下的时长验证
      const minDuration = currentVideoMode.value === 'unlimited' ? 1 : 2;
      const maxDuration = currentVideoMode.value === 'unlimited' ? 30 : 14;

      if (duration < minDuration) {
        toast(t('home.error.videoDurationTooShort', { min: minDuration }));
        target.value = '';
        return;
      }

      if (duration > maxDuration) {
        toast(t('home.error.videoDurationTooLong', { max: maxDuration }));
        target.value = '';
        return;
      }
    }

    // Video file size validation
    const maxVideoSizeBytes = currentVideoMode.value === 'unlimited' ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxVideoSizeBytes) {
      toast(t('home.error.maxVideoSize', { max: currentVideoMode.value === 'unlimited' ? 100 : 50 }));
      target.value = '';
      return;
    }

    isUploading.value = true;
    try {
      let coverUrl = '';
      // Capture and upload video cover first
      try {
        const frameDataUrl = await captureVideoFirstFrame(file);
        const coverFile = dataURLToFile(frameDataUrl, `${file.name}_cover.jpg`);
        coverUrl = await uploadImage(coverFile, 'normal');
        uploadedVideoCover.value = coverUrl;
      } catch (error) {
        console.error('Failed to capture video cover:', error);
        uploadedVideoCover.value = '';
      }

      // Upload the video
      const uploadedUrl = await uploadVideo(file);
      if (uploadedUrl) {
        uploadedVideo.value = uploadedUrl;

        // 视频续写模式下，保存上传视频时长并调整生成时长
        if (selectedVideoMultimodal.value === 'videoExtend') {
          uploadedVideoDuration.value = duration;
          lastValidVideoDuration.value = selectedVideoDuration.value;

          // 如果当前设置的时长小于等于视频时长，自动调整
          const currentDuration = parseInt(selectedVideoDuration.value);
          if (currentDuration <= duration) {
            const minDuration = currentVideoMode.value === 'unlimited' ? 2 : 4;
            const newDuration = Math.max(duration + 1, minDuration);
            selectedVideoDuration.value = Math.min(newDuration, 15).toString();
            lastValidVideoDuration.value = selectedVideoDuration.value;
          }

          uploadedVideoRefs.value.push({
            id: Date.now().toString(),
            name: file.name,
            url: uploadedUrl,
            type: 'video',
            cover: coverUrl
          });
        }
      }
    } catch (error) {
      toast(t('fail'));
    } finally {
      isUploading.value = false;
    }
  }
};

const removeVideo = () => {
  uploadedVideo.value = '';
  uploadedVideoCover.value = '';
  uploadedVideoDuration.value = 0;
  if (selectedVideoMultimodal.value === 'videoExtend') {
    uploadedVideoRefs.value = uploadedVideoRefs.value.filter((item: any) => item.type !== 'video');
  }
  if (videoInputRef.value) {
    videoInputRef.value.value = '';
  }
};

const sliderMarks = computed(() => {
  const min = currentVideoMode.value === 'unlimited' ? 2 : 4;
  const max = 15;
  const marks = [min, 5, 10, 15];
  return marks.map(value => ({
    value,
    position: `${((value - min) / (max - min)) * 100}%`
  }));
});

const getSliderValuePosition = () => {
  const value = parseInt(selectedVideoDuration.value);
  const min = currentVideoMode.value === 'unlimited' ? 2 : 4;
  const max = 15;
  return `${((value - min) / (max - min)) * 100}%`;
};

const saveLastValidDuration = () => {
  lastValidVideoDuration.value = selectedVideoDuration.value;
};

const onVideoDurationChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedVideoDuration.value = target.value;
};

const validateDurationAndRestore = () => {
  // 只有在视频续写模式且有上传视频时才验证
  if (selectedVideoMultimodal.value === 'videoExtend' && uploadedVideoDuration.value > 0) {
    const newDuration = parseInt(selectedVideoDuration.value);
    // 如果生成时长小于等于上传视频时长，恢复之前的值并提示
    if (newDuration <= uploadedVideoDuration.value) {
      selectedVideoDuration.value = lastValidVideoDuration.value;
      toast(t('home.error.videoExtendDurationExceed'));
    } else {
      // 验证通过，更新lastValidVideoDuration
      lastValidVideoDuration.value = selectedVideoDuration.value;
    }
  } else {
    // 不在验证模式，更新lastValidVideoDuration
    lastValidVideoDuration.value = selectedVideoDuration.value;
  }
};

const isTaskProcessing = (status: string) => {
  return status == 'DOING' || status == 'PREPARE' || status == 'PROCESSING';
};

const isTaskFailed = (status: string) => {
  return status == 'FAIL' || status == 'FAILED';
};

const isTaskSuccess = (status: string) => {
  return status == 'SUCCESS';
};

// Computed property to calculate estimated computing power for photo
const estimatedPhotoPower = computed(() => {
  if (!balanceInfo.value) {
    return 4;
  }

  let cost = 0;
  if (selectedPhotoQuality.value == '1K') {
    cost = Number(balanceInfo.value.single_image_cost) || 4;
  } else if (selectedPhotoQuality.value == '2K') {
    cost = Number(balanceInfo.value.single_image_cost_2k) || 7;
  }

  return Math.max(1, cost);
});

// Computed property to calculate estimated computing power for video
const estimatedVideoPower = computed(() => {
  if (!balanceInfo.value) {
    return 1;
  }

  const duration = parseInt(selectedVideoDuration.value) || 15;
  let costPerSecond = 0;

  if (selectedVideoQuality.value == '720P') {
    if (currentVideoMode.value === 'unlimited') {
      costPerSecond = Number(balanceInfo.value.single_video_cost_720p_per_second_nsfw);
    } else {
      costPerSecond = Number(balanceInfo.value.single_video_cost_720p_per_second);
    }
  } else if (selectedVideoQuality.value == '1080P') {
    if (currentVideoMode.value === 'unlimited') {
      costPerSecond = Number(balanceInfo.value.single_video_cost_1080p_per_second_nsfw);
    } else {
      costPerSecond = Number(balanceInfo.value.single_video_cost_1080p_per_second);
    }
  }

  const totalCost = costPerSecond * duration;
  return Math.max(1, totalCost);
});

const pollTaskStatus = async (taskId: string) => {
  try {
    const response = await api.taskPolling(taskId) as any;

    if (response.code == 200) {
      const taskData = response.data;

      const recordIndex = records.value.findIndex(r => r.session_id == taskId);

      if (recordIndex !== -1) {
        const updatedRecord = { ...records.value[recordIndex], ...taskData };

        if (taskData.result && taskData.result.final_images) {
          updatedRecord.images = taskData.result.final_images;
        }

        if (taskData.result && taskData.result.final_videos) {
          const finalVideos = taskData.result.final_videos || [];
          const firstVideo = finalVideos.length > 0 ? finalVideos[0] : {};

          if (firstVideo.video_url) {
            updatedRecord.videoUrl = firstVideo.video_url;
            updatedRecord.video_url = firstVideo.video_url;
          }
          if (firstVideo.video_cover_url) {
            updatedRecord.videoCover = firstVideo.video_cover_url;
            updatedRecord.video_cover_url = firstVideo.video_cover_url;
          }
        }

        if (taskData.status === 'SUCCESS') {
          updatedRecord.step_status = 'SUCCESS';
        }

        if (taskData.status === 'FAIL' || taskData.status === 'FAILED') {
          updatedRecord.step_status = 'FAILED';
          updatedRecord.fail_reason = t('recordList.generateFailed');
        }

        records.value[recordIndex] = { ...updatedRecord };
        const displayedRecordIndex = displayRecords.value.findIndex(r => r.session_id == taskId);
        if (displayedRecordIndex !== -1) {
          displayRecords.value[displayedRecordIndex] = { ...updatedRecord };
        }

        if (!isTaskProcessing(taskData.status)) {
          stopPolling(taskId);
        }
      }
    } else {
      const recordIndex = records.value.findIndex(r => r.session_id == taskId);
      if (recordIndex !== -1) {
        records.value[recordIndex] = {
          ...records.value[recordIndex],
          step_status: 'FAILED',
          fail_reason: t('recordList.generateFailed')
        };
      }
      stopPolling(taskId);
    }
  } catch (error) {
    console.error('Error polling task:', error);
    const recordIndex = records.value.findIndex(r => r.session_id == taskId);
    if (recordIndex !== -1) {
      records.value[recordIndex] = {
        ...records.value[recordIndex],
        step_status: 'FAILED',
        fail_reason: t('recordList.generateFailed')
      };
    }
    stopPolling(taskId);
  }
};

const startPolling = (taskId: string) => {
  if (pollingTasks.value.has(taskId)) return;

  pollingTasks.value.add(taskId);
  const timer = setInterval(() => {
    pollTaskStatus(taskId);
  }, 3000);
  pollingTimers.value.set(taskId, timer);
};

const stopPolling = (taskId: string) => {
  const timer = pollingTimers.value.get(taskId);
  if (timer) {
    clearInterval(timer);
    pollingTimers.value.delete(taskId);
  }
  pollingTasks.value.delete(taskId);
};

const formatContent = (content: string, record: any) => {
  if (!content) return '';
  const userSelected = record?.user_selected || {};
  const others = userSelected?.others || {};
  const list = others?.list || [];

  const getTagContent = (index: string, tagType: string) => {
    const refIndex = parseInt(index);
    const arrayIndex = refIndex - 1;

    let targetType = '';
    if (tagType === 'vid') {
      targetType = 'video';
    } else if (tagType === 'aud') {
      targetType = 'audio';
    } else {
      targetType = 'image';
    }

    const filteredList = list.filter((item: any) => item.type === targetType);
    const item = filteredList[arrayIndex];

    if (item) {
      const imgUrl = item.image || item.url;
      let itemType = '';
      let iconUrl = '';
      let tagClass = 'image-tag';
      let innerClass = 'image-tag-img';

      if (item.type === 'audio') {
        itemType = t('recordList.audio');
        iconUrl = audioIcon;
        tagClass = 'audio-tag';
        innerClass = 'audio-tag-img';
      } else if (item.type === 'video') {
        itemType = t('recordList.video');
        iconUrl = item.cover || imgUrl;
        tagClass = 'video-tag';
        innerClass = 'video-tag-img';
      } else {
        itemType = t('recordList.image');
        iconUrl = imgUrl;
        tagClass = 'image-tag';
        innerClass = 'image-tag-img';
      }

      const typeCount = refIndex;
      const imgName = `${itemType}${typeCount}`;

      return `<span class="${tagClass}" contenteditable="false" data-src="${imgUrl}" data-name="${imgName}" data-item-id="${item.id || ''}" data-type="${item.type}"><img src="${iconUrl}" class="${innerClass}" />${imgName}</span>`;
    }

    return `<span class="image-tag" contenteditable="false" data-src="" data-name="" data-type="image"><span>&lt;${tagType}_${index}&gt;</span></span>`;
  };

  let result = content;

  result = result.replace(/<vid_(\d+)>/gi, (match, index) => getTagContent(index, 'vid'));
  result = result.replace(/<vid_(\d+)><\/vid_\d+>/gi, (match, index) => getTagContent(index, 'vid'));

  result = result.replace(/<aud_(\d+)>/gi, (match, index) => getTagContent(index, 'aud'));
  result = result.replace(/<aud_(\d+)><\/aud_\d+>/gi, (match, index) => getTagContent(index, 'aud'));

  result = result.replace(/<ref_(\d+)>/gi, (match, index) => getTagContent(index, 'ref'));
  result = result.replace(/<ref_(\d+)><\/ref_\d+>/gi, (match, index) => getTagContent(index, 'ref'));

  result = result.replace(/&lt;vid_(\d+)&gt;/gi, (match, index) => getTagContent(index, 'vid'));
  result = result.replace(/&lt;vid_(\d+)&gt;&lt;\/vid_\d+&gt;/gi, (match, index) => getTagContent(index, 'vid'));

  result = result.replace(/&lt;aud_(\d+)&gt;/gi, (match, index) => getTagContent(index, 'aud'));
  result = result.replace(/&lt;aud_(\d+)&gt;&lt;\/aud_\d+&gt;/gi, (match, index) => getTagContent(index, 'aud'));

  result = result.replace(/&lt;ref_(\d+)&gt;/gi, (match, index) => getTagContent(index, 'ref'));
  result = result.replace(/&lt;ref_(\d+)&gt;&lt;\/ref_\d+&gt;/gi, (match, index) => getTagContent(index, 'ref'));

  return result;
};

const normalizeSimpleRecord = (record: any) => {
  const parseRecordField = (value: any) => {
    if (typeof value !== 'string') return value || {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const userSelected = parseRecordField(record.user_selected);
  const resultAsync = parseRecordField(record.result_async);
  const others = userSelected.others || {};
  const uploadedImages = others.list || [];
  const coverImage = uploadedImages.length > 0 ? uploadedImages[0].image : record.cover || '';

  let recordType = record.type || 'photo';
  if (record.story_type === 'simple_video') {
    recordType = 'video';
  } else if (record.story_type === 'simple_image') {
    recordType = 'photo';
  }

  const finalVideos = resultAsync.final_videos || [];
  const firstVideo = finalVideos[0] || resultAsync.final_video_output || {};
  const videoCover = firstVideo.video_cover_url || resultAsync.cover_url || resultAsync.cover || resultAsync.final_video_cover || coverImage;
  const videoUrl = firstVideo.video_url || resultAsync.final_video || record.video_url || '';
  const resolution = record.story_type === 'simple_video'
    ? (userSelected.simple_video_resolution || '').replace(/p$/i, 'P')
    : userSelected.simple_image_resolution || '';

  return {
    ...record,
    user_selected: userSelected,
    result_async: resultAsync,
    images: resultAsync.final_images || record.images || [],
    resolution,
    ratio: userSelected.ratio || record.ratio || '',
    duration: userSelected.simple_video_duration || record.duration || '',
    description: others.content || record.topic || '',
    formattedDescription: formatContent(others.content || record.topic || '', { ...record, user_selected: userSelected }),
    type: recordType,
    cover: coverImage,
    videoCover,
    videoUrl,
    createTime: record.created_at || ''
  };
};

const loadRecords = async (isLoadMore = false, targetSessionId: string = '', targetRecord: any = null) => {
  if (isLoading.value) return;

  isLoading.value = true;
  let shouldScrollToTarget = false;
  const normalizedTargetRecord = targetRecord?.session_id == targetSessionId
    ? normalizeSimpleRecord(targetRecord)
    : null;
  if (targetSessionId && normalizedTargetRecord) {
    records.value = [normalizedTargetRecord];
    displayRecords.value = [normalizedTargetRecord];
    shouldScrollToTarget = true;
  }

  try {
      const storyType = selectedType.value == 'all' ? '' : selectedType.value;
      const loadSize = targetSessionId ? 1000 : pageSize.value;
      const response = await api.singleTaskList(currentPage.value, loadSize, storyType) as any;
      if (response.code == 200) {
        const dataList = response.data.data_list || response.data.list || [];

        let newRecords = dataList.map(normalizeSimpleRecord);

        if (targetSessionId && normalizedTargetRecord && !newRecords.some((record: any) => record.session_id == targetSessionId)) {
          const targetInsertIndex = Math.floor(newRecords.length / 2);
          newRecords.splice(targetInsertIndex, 0, normalizedTargetRecord);
        }

        newRecords = newRecords.filter((record: any, index: number, list: any[]) =>
          !record.session_id || list.findIndex(item => item.session_id == record.session_id) === index
        );

        if (isLoadMore && newRecords.length > 0) {
          const prevDisplayLen = displayRecords.value.length;
          const beforeHeight = document.documentElement.scrollHeight;
          const beforeTop = window.scrollY || document.documentElement.scrollTop;
          records.value = [...newRecords, ...records.value];
          // 只渲染"本次加载的更旧数据 + 原有窗口"，避免一次性把内存里的全部记录塞进 DOM
          displayRecords.value = records.value.slice(0, newRecords.length + prevDisplayLen);
          // 顶部插入了数据，锚定滚动位置，保持用户当前视图不跳动
          nextTick(() => {
            const afterHeight = document.documentElement.scrollHeight;
            const delta = afterHeight - beforeHeight;
            if (delta !== 0) {
              window.scrollTo({ top: beforeTop + delta, behavior: 'auto' });
            }
          });
        } else {
          records.value = newRecords;

          // 按实际已加载条数修正当前页码，保证后续滚动到顶部继续加载"更旧"数据时页码不重复
          // （定位模式使用 limit=1000 一次性加载，等价于消费了多页 pageSize 数据）
          currentPage.value = Math.max(1, Math.ceil(records.value.length / pageSize.value));

          totalCount.value = response.data.data_total || response.data.total || 0;

          newRecords.forEach((record: any) => {
            if (record.session_id && isTaskProcessing(record.step_status || record.status)) {
              startPolling(record.session_id);
            }
          });

          // 如果有目标sessionId，找到目标记录附近的数据
          if (targetSessionId) {
            const targetIndex = records.value.findIndex((r: any) => r.session_id == targetSessionId);
            if (targetIndex !== -1) {
              const halfCount = Math.floor(displayCount.value / 2);
              const startIndex = Math.max(0, targetIndex - halfCount);
              const endIndex = Math.min(records.value.length, startIndex + displayCount.value);
              displayRecords.value = records.value.slice(startIndex, endIndex);
              shouldScrollToTarget = true;
            } else {
              displayRecords.value = records.value;
            }
          } else {
            // 没有目标，显示所有数据
            displayRecords.value = records.value;

            if (!isLoadMore && displayRecords.value.length > 0) {
              setTimeout(() => {
                const lastRecord = document.querySelector('.record-item:last-child');
                if (lastRecord) {
                  lastRecord.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      isLoading.value = false;
      if (shouldScrollToTarget) {
        await nextTick();
        scrollToRecord(targetSessionId);
      }
    }
  }

const generatePhoto = async () => {
  if (isPhotoGenerating.value) return;
  isPhotoGenerating.value = true;

  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    isPhotoGenerating.value = false;
    return;
  }

  if (!getPhotoInputContent().trim()) {
    toast(t('home.error.emptyInput'));
    isPhotoGenerating.value = false;
    return;
  }

  try {
    const balanceRes = await api.userBalance() as any;
    if (balanceRes.code == 200) {
      balanceInfo.value = balanceRes.data;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
  }

  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedPhotoPower.value || 1;
    const requiredBalance = Math.round(coverCost * overFreezeRate);
    const userBalance = balanceInfo.value.balance || 0;

    if (requiredBalance > userBalance) {
      showInsufficientBalanceModal.value = true;
      return;
    }
  }

  try {
    const sessionId = uuidv4();

    const skeletonRecord = {
      id: Date.now(),
      session_id: sessionId,
      status: 'DOING',
      step_status: 'PROCESSING',
      result_async: null,
      story_type: 'simple_image',
      status_message: '',
      history_data: null,
      name: '',
      is_step_readed: 1,
      created_at: new Date().toISOString(),
      createTime: new Date().toISOString(),
      topic: getPhotoInputContent().trim(),
      description: getPhotoInputContent().trim(),
      step_name: 'simple_image',
      is_publish: 2,
      is_batch_chapter: 2,
      updated_at: new Date().toISOString(),
      is_final: 1,
      step_chapter_index: 0,
      deleted_at: null,
      frozen_points: 0,
      task_start_at: new Date().toISOString(),
      user_id: 0,
      total_chapters: 1,
      resolution: selectedPhotoQuality.value,
      ratio: selectedPhotoRatio.value,
      user_selected: {
        ratio: selectedPhotoRatio.value,
        language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
        story_type: 'simple_image',
        story_mode: currentPhotoMode.value == 'unlimited' ? 'nsfw' : 'normal',
        story_style: '',
        reference_images: uploadedPhotoImages.value.map(img => img.image),
        emotion: '',
        others: {
          content: getPhotoInputContent().trim(),
          list: uploadedPhotoImages.value
        },
        addition_characters: [],
        total_words: 10,
        chapter_count: 1,
        per_chapter_duration: 1.5,
        per_chapter_scene_count: 6,
        simple_image_resolution: selectedPhotoQuality.value,
        simple_video_resolution: '720p',
        simple_video_generate_mode: 'multimodal'
      }
    };

    records.value.push(skeletonRecord);
    displayRecords.value = records.value;

    nextTick(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    const photoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
      aspectRatio: selectedPhotoRatio.value,
      resolution: selectedPhotoQuality.value
    };

    const settingsParams: Record<string, any> = {
      ratio: photoSettings.aspectRatio,
      language: photoSettings.language,
      story_type: "simple_image",
      simple_image_resolution: photoSettings.resolution,
      story_mode: currentPhotoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: uploadedPhotoImages.value.map(img => img.image),
      emotion: "",
      others: {
        content: getPhotoInputContent().trim(),
        list: uploadedPhotoImages.value
      },
      addition_characters: []
    };

    if (currentPhotoMode.value == 'unlimited') {
      settingsParams.image_count = 1;
    }

    const settingsResponse = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify(settingsParams)
    });

    if (!settingsResponse.ok) {
      const index = records.value.findIndex(r => r.session_id == sessionId);
      if (index !== -1) {
        records.value.splice(index, 1);
      }
      const data = await settingsResponse.json();
      toast(data.message || t('fail'));
      return;
    }

    const settingsData = await settingsResponse.json();
    if (settingsData.code != 200 && settingsData.code != 0) {
      const index = records.value.findIndex(r => r.session_id == sessionId);
      if (index !== -1) {
        records.value.splice(index, 1);
      }
      toast(settingsData.message || t('fail'));
      return;
    }

    const params = {
      session_id: sessionId,
      topic: getPhotoInputContent().trim()
    };

    const response = await api.generateSinglePhoto(params) as any;

    if (response.code == 200) {
      if (photoEditableInputRef.value) {
        photoEditableInputRef.value.innerHTML = '';
      }
      photoInputKey.value++;
      uploadedPhotoImages.value = [];

      const index = records.value.findIndex(r => r.session_id == sessionId);
      if (index !== -1) {
        records.value[index].createTime = response.time;
      }

      startPolling(sessionId);
      eventBus.emit('balanceUpdated');

      // Scroll to bottom, considering the fixed bottom input area
      nextTick(() => {
        const bottomInputArea = document.querySelector('.bottom-input-area') as HTMLElement | null;
        const bottomOffset = bottomInputArea ? bottomInputArea.offsetHeight : 120;
        const scrollPosition = Math.max(0, document.body.scrollHeight - window.innerHeight - bottomOffset + 20);
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      });
    } else {
      const index = records.value.findIndex(r => r.session_id == sessionId);
      if (index !== -1) {
        records.value.splice(index, 1);
      }
      toast(response.message);
    }
  } catch (error) {
    console.error('Error generating photo:', error);
    toast(t('fail'));
  } finally {
    isPhotoGenerating.value = false;
  }
};

const generateVideo = async () => {
  if (isVideoGenerating.value) return;
  isVideoGenerating.value = true;

  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    isVideoGenerating.value = false;
    return;
  }

  const videoContent = getVideoInputContent();
  if (!videoContent.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  // 首尾帧模式验证：首帧必须上传，尾帧可以不上传
  if (selectedVideoMultimodal.value === 'startEndFrames' && !startFrameImage.value) {
    toast(t('home.error.startFrameRequired'));
    return;
  }

  try {
    const balanceRes = await api.userBalance() as any;
    if (balanceRes.code == 200) {
      balanceInfo.value = balanceRes.data;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
  }

  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedVideoPower.value || 1;
    const requiredBalance = Math.round(coverCost * overFreezeRate);
    const userBalance = balanceInfo.value.balance || 0;

    if (requiredBalance > userBalance) {
      showInsufficientBalanceModal.value = true;
      return;
    }
  }

  let sessionId = '';
  try {
    sessionId = uuidv4();

    let referenceImages: any[] = [];

    if (selectedVideoMultimodal.value === 'startEndFrames') {
      if (startFrameImage.value) {
        referenceImages.push({ type: "first_frame", url: startFrameImage.value });
      }
      if (endFrameImage.value) {
        referenceImages.push({ type: "last_frame", url: endFrameImage.value });
      }
    } else {
      referenceImages = uploadedVideoRefs.value
        .filter(ref => ref.type === 'image')
        .map(ref => ref.image);
      if (uploadedVideo.value) referenceImages.push(uploadedVideo.value);
    }

    const skeletonRecord = {
      id: Date.now(),
      session_id: sessionId,
      type: 'video',
      status: 'DOING',
      step_status: 'PROCESSING',
      result_async: null,
      story_type: 'simple_video',
      status_message: '',
      history_data: null,
      name: '',
      is_step_readed: 1,
      created_at: new Date().toISOString(),
      createTime: new Date().toISOString(),
      topic: videoContent,
      description: videoContent,
      step_name: 'simple_video',
      is_publish: 2,
      is_batch_chapter: 2,
      updated_at: new Date().toISOString(),
      is_final: 1,
      step_chapter_index: 0,
      deleted_at: null,
      frozen_points: 0,
      task_start_at: new Date().toISOString(),
      user_id: 0,
      total_chapters: 1,
      resolution: selectedVideoQuality.value,
      ratio: selectedVideoRatio.value,
      duration: selectedVideoDuration.value,
      user_selected: {
        ratio: selectedVideoRatio.value,
        language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
        story_type: 'simple_video',
        story_mode: currentVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
        story_style: '',
        reference_images: referenceImages,
        emotion: '',
        others: {
          content: videoContent,
          list: uploadedVideoRefs.value
        },
        addition_characters: [],
        total_words: 10,
        chapter_count: 1,
        per_chapter_duration: 1.5,
        per_chapter_scene_count: 6,
        simple_image_resolution: '1K',
        simple_video_resolution: selectedVideoQuality.value == '720P' ? '720p' : '1080p',
        simple_video_generate_mode: selectedVideoMultimodal.value == 'multimodal' ? 'multi_modal_reference' : selectedVideoMultimodal.value == 'startEndFrames' ? 'first_last_frames' : 'video_extension'
      }
    };

    records.value.push(skeletonRecord);

    displayRecords.value = records.value;

    const videoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
      aspectRatio: selectedVideoRatio.value,
      duration: selectedVideoDuration.value
    };

    let referenceVideos: any[] = [];
    if (selectedVideoMultimodal.value === 'videoExtend') {
      if (uploadedVideo.value) {
        referenceVideos = [uploadedVideo.value];
      }
    } else {
      referenceVideos = uploadedVideoRefs.value
        .filter((ref: any) => ref.type === 'video')
        .map((ref: any) => ref.image);
    }
    const referenceAudios = uploadedVideoRefs.value
      .filter((ref: any) => ref.type === 'audio')
      .map((ref: any) => ref.image);

    const params = {
      ratio: videoSettings.aspectRatio,
      language: videoSettings.language,
      story_type: "simple_video",
      story_mode: currentVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: referenceImages,
      reference_videos: referenceVideos,
      reference_audios: referenceAudios,
      emotion: "",
      others: {
        content: videoContent,
        list: uploadedVideoRefs.value
      },
      addition_characters: [],
      total_words: 10,
      chapter_count: 1,
      per_chapter_duration: 1.5,
      per_chapter_scene_count: 6,
      simple_image_resolution: '1K',
      simple_video_resolution: selectedVideoQuality.value == '720P' ? '720p' : '1080p',
      simple_video_generate_mode: selectedVideoMultimodal.value == 'multimodal' ? 'multi_modal_reference' : selectedVideoMultimodal.value == 'startEndFrames' ? 'first_last_frames' : 'video_extension',
      simple_video_duration: parseInt(selectedVideoDuration.value)
    };

    const settingsResponse = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (!settingsResponse.ok) {
      throw new Error('Failed to update user settings');
    }

    const settingsData = await settingsResponse.json();
    if (settingsData.code !== 200 && settingsData.code !== 0) {
      const index = records.value.findIndex(r => r.session_id == sessionId);
      if (index !== -1) {
        records.value.splice(index, 1);
      }
      toast(settingsData.message || t('fail'));
      return;
    }

    const index = records.value.findIndex(r => r.session_id == sessionId);
    if (index !== -1) {
      records.value[index].createTime = settingsData.time;
    }

    const generateResponse = await api.generateSingleVideo({
      session_id: sessionId,
      topic: videoContent
    }) as any;

    if (generateResponse.code == 200) {
      videoInput.value = '';
      if (videoEditableInputRef.value) {
        videoEditableInputRef.value.innerHTML = '';
      }
      startFrameImage.value = '';
      endFrameImage.value = '';
      uploadedVideo.value = '';
      uploadedVideoRefs.value = [];

      startPolling(sessionId);
      eventBus.emit('balanceUpdated');

      // Scroll to bottom, considering the fixed bottom input area
      nextTick(() => {
        const bottomInputArea = document.querySelector('.bottom-input-area') as HTMLElement | null;
        const bottomOffset = bottomInputArea ? bottomInputArea.offsetHeight : 120;
        const scrollPosition = Math.max(0, document.body.scrollHeight - window.innerHeight - bottomOffset + 20);
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      });
    } else {
      const idx = records.value.findIndex(r => r.session_id == sessionId);
      if (idx !== -1) {
        records.value.splice(idx, 1);
      }
      toast(generateResponse.message || t('fail'));
    }
  } catch (error) {
    console.error('Error generating video:', error);
    const idx = records.value.findIndex(r => r.session_id == sessionId);
    if (idx !== -1) {
      records.value.splice(idx, 1);
    }
    toast(t('fail'));
  } finally {
    isVideoGenerating.value = false;
  }
};

// 滚动到底部且已加载的记录全部展示后，拉取"更新的"数据（第1页最新一批），
// 把本地没有的新记录追加到列表底部（底部=最新）
// 冷却时间戳：避免在底部时每个 scroll 事件都发请求（无新数据也会重复调用）
let lastLoadNewerAttempt = 0;
const LOAD_NEWER_COOLDOWN = 3000;
const loadNewerRecords = async () => {
  if (isLoadingNewer.value || isLoading.value) return;
  lastLoadNewerAttempt = Date.now();
  isLoadingNewer.value = true;
  try {
    const storyType = selectedType.value == 'all' ? '' : selectedType.value;
    const response = await api.singleTaskList(1, pageSize.value, storyType) as any;
    if (response.code == 200) {
      const dataList = response.data.data_list || response.data.list || [];
      const fetched = dataList.map(normalizeSimpleRecord);
      const existingIds = new Set(records.value.map((r: any) => r.session_id));
      const newer = fetched.filter((r: any) => r.session_id && !existingIds.has(r.session_id));
      if (newer.length > 0) {
        const prevDisplayLen = displayRecords.value.length;
        records.value = [...records.value, ...newer];
        // 只渲染"原有窗口 + 本次新增的更新数据"，避免一次性渲染全部记录
        displayRecords.value = records.value.slice(records.value.length - (prevDisplayLen + newer.length));
        totalCount.value = response.data.data_total || response.data.total || totalCount.value;
        newer.forEach((r: any) => {
          if (isTaskProcessing(r.step_status || r.status)) {
            startPolling(r.session_id);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading newer records:', error);
  } finally {
    isLoadingNewer.value = false;
  }
};

const handleScroll = () => {
  if (isPositioningTarget.value) return;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // If displayRecords is a subset of records, expand display range when scrolling
  if (displayRecords.value.length < records.value.length && !isLoading.value) {
    const halfCount = Math.floor(displayCount.value / 2);

    // Find the first and last displayed record indices in the full records list
    const firstDisplayed = records.value.findIndex(r => r.session_id === displayRecords.value[0]?.session_id);
    const lastDisplayed = records.value.findIndex(r => r.session_id === displayRecords.value[displayRecords.value.length - 1]?.session_id);

    // If scrolled to top, show more records from the beginning
    if (scrollTop < 100 && firstDisplayed > 0) {
      const newStartIndex = Math.max(0, firstDisplayed - halfCount);
      const newEndIndex = Math.min(records.value.length, lastDisplayed + 1);
      displayRecords.value = records.value.slice(newStartIndex, newEndIndex);
      return;
    }

    // If scrolled to bottom, show more records from the end
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    if (scrollTop > documentHeight - windowHeight - 100 && lastDisplayed < records.value.length - 1) {
      const newStartIndex = Math.max(0, firstDisplayed);
      const newEndIndex = Math.min(records.value.length, lastDisplayed + halfCount + 1);
      displayRecords.value = records.value.slice(newStartIndex, newEndIndex);
      return;
    }
  }

  // If we've shown all loaded records, load more from server
  // 滚动到顶部：加载"更旧"的数据（页码递增，prepend 到顶部）
  if (scrollTop < 50 && !isLoading.value && records.value.length > 0) {
    const totalPages = Math.ceil(totalCount.value / pageSize.value);
    if (currentPage.value < totalPages) {
      currentPage.value++;
      loadRecords(true);
    }
  }

  // 滚动到底部且内存中的记录已展示到最后一条：加载"更新"的数据（追加到底部）
  const docHeightForNewer = document.documentElement.scrollHeight;
  const winHeightForNewer = window.innerHeight || document.documentElement.clientHeight;
  const lastRecordShown =
    displayRecords.value.length > 0 &&
    displayRecords.value[displayRecords.value.length - 1]?.session_id ===
      records.value[records.value.length - 1]?.session_id;
  if (
    scrollTop > docHeightForNewer - winHeightForNewer - 100 &&
    !isLoading.value &&
    !isLoadingNewer.value &&
    Date.now() - lastLoadNewerAttempt > LOAD_NEWER_COOLDOWN &&
    records.value.length > 0 &&
    lastRecordShown
  ) {
    loadNewerRecords();
  }
};

function setSeoMeta(tab: string) {
  const seoKeyMap: Record<string, string> = {
    'photo': 'seo.home.photo',
    'video': 'seo.home.video'
  };
  const seoKey = seoKeyMap[tab];
  if (!seoKey) return;

  const title = t(`${seoKey}.title`);
  const keywords = t(`${seoKey}.keywords`);
  const description = t(`${seoKey}.description`);

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

const selectType = (type: string) => {
  selectedType.value = type;
  showTypeDropdown.value = false;
  currentPage.value = 1;

  loadRecords();
};

const scrollToRecord = (sessionId: string) => {
  if (!sessionId) return false;
  const targetElement = document.getElementById(`record-${sessionId}`);
  if (!targetElement) return false;

  isPositioningTarget.value = true;
  const rect = targetElement.getBoundingClientRect();
  const bottomGenerator = document.querySelector('.bottom-generator') as HTMLElement | null;
  const bottomHeight = bottomGenerator ? bottomGenerator.offsetHeight : 0;
  const headerHeight = 140;
  const visibleCenter = (window.innerHeight - bottomHeight - headerHeight) / 2 + headerHeight;
  const targetCenter = rect.top + window.scrollY + rect.height / 2;
  const targetScrollTop = Math.max(0, targetCenter - visibleCenter);
  window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });

  localStorage.removeItem('targetSessionId');
  localStorage.removeItem('targetSessionType');
  sessionStorage.removeItem('targetGenerateRecord');

  // 等平滑滚动结束后再释放定位守卫，避免滚动动画期间触发窗口扩展
  let lastScrollTop = -1;
  let stableFrames = 0;
  const startTime = Date.now();
  const releaseWhenSettled = () => {
    const current = window.scrollY || document.documentElement.scrollTop;
    const reachedTarget = Math.abs(current - targetScrollTop) < 2;
    const isStable = current === lastScrollTop;
    lastScrollTop = current;

    // 位置稳定连续若干帧、或已到达目标、或超过最大兜底时长，则释放守卫
    if ((isStable && (stableFrames >= 3 || reachedTarget)) || Date.now() - startTime > 1200) {
      isPositioningTarget.value = false;
      return;
    }
    stableFrames = isStable ? stableFrames + 1 : 0;
    window.requestAnimationFrame(releaseWhenSettled);
  };
  window.requestAnimationFrame(releaseWhenSettled);
  return true;
};

const getCountry = () => {
  return new Promise<void>((resolve) => {
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
      resolve();
    }).catch(err => {
      console.log(err);
      userRegion.value = false;
      resolve();
    });
  });
};

const getUserInfo = () => {
  api.userInfo().then((res: any) => {
    if (res.code == 0) {
      userInfo.value = res.data;
    }
  }).catch(err => {
    console.log(err);
  });
};

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  // 目标定位记录通过 sessionStorage 传递（不再从 URL query 读取 session_id，
  // 避免地址栏残留导致刷新后反复定位）
  const targetRecordJson = sessionStorage.getItem('targetGenerateRecord');
  let targetRecord: any = null;
  if (targetRecordJson) {
    try {
      targetRecord = JSON.parse(targetRecordJson);
    } catch {
      // ignore parse error
    }
  }
  const targetSessionId = localStorage.getItem('targetSessionId') || targetRecord?.session_id || '';
  // 读取后立即消费，确保只定位一次，刷新后不再重复定位
  sessionStorage.removeItem('targetGenerateRecord');
  localStorage.removeItem('targetSessionId');

  setSeoMeta(bottomActiveTab.value);

  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'instant' });

  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('scroll', handleScrollForInput);

  // 获取用户区域和用户信息
  getCountry();
  getUserInfo();

  // 启动打字机效果
  checkReducedMotion();
  if (bottomActiveTab.value === 'photo') {
    startPhotoTypewriter();
  } else {
    startVideoTypewriter();
  }

  if (targetSessionId) {
    // 有目标记录，从第一页开始查找
    currentPage.value = 1;
    loadRecords(false, targetSessionId, targetRecord);
  } else {
    // 没有目标记录，正常加载
    loadRecords();
  }
});

watch(() => locale.value, () => {
  setSeoMeta(bottomActiveTab.value);
  if (bottomActiveTab.value === 'photo') {
    startPhotoTypewriter();
  } else {
    startVideoTypewriter();
  }
});



onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('scroll', handleScrollForInput);
  pollingTimers.value.forEach(timer => clearInterval(timer));
  pollingTimers.value.clear();
  pollingTasks.value.clear();
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
  if (photoTypewriterTimer) {
    clearTimeout(photoTypewriterTimer);
    photoTypewriterTimer = null;
  }
  if (videoTypewriterTimer) {
    clearTimeout(videoTypewriterTimer);
    videoTypewriterTimer = null;
  }
});

const openImageViewer = (imageUrl: string) => {
  zoomedCoverImage.value = imageUrl;
  showCoverZoomModal.value = true;
};

const closeCoverZoomModal = () => {
  showCoverZoomModal.value = false;
  zoomedCoverImage.value = '';
};

const closeVideoModal = () => {
  showVideoModal.value = false;
  playingVideoUrl.value = '';
};

const viewMoreImages = (record: any) => {
  // TODO: 查看更多图片
};

const downloadRecord = (record: any) => {
  // TODO: 下载记录
};

const shareRecord = (record: any) => {
  // TODO: 分享记录
};

const playVideo = (record: any) => {
  const videoUrl = record.videoUrl || record.result_async?.final_video || record.video_url;
  if (!videoUrl) {
    toast(t('fail'));
    return;
  }
  playingVideoUrl.value = videoUrl;
  playingVideoRatio.value = record.ratio || '16:9';
  playingVideoIsUnlimited.value = record.user_selected?.story_mode == 'nsfw';
  showVideoModal.value = true;
};

const playVideoItem = (item: any) => {
  if (item.type === 'video' && item.image) {
    playingVideoUrl.value = item.image;
    showVideoModal.value = true;
  } else {
    console.log('[playVideoItem] not a video or no image:', item.type, item.image);
  }
};

const downloadVideo = (record: any) => {
  try {
    const videoUrl = record.result_async?.final_videos?.[0]?.video_url || record.result_async?.final_video || record.video_url;
    if (!videoUrl) {
      toast(t('fail'));
      return;
    }
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `video_${Date.now()}.mp4`;
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading video:', error);
    toast(t('fail'));
  }
};

const shareVideo = (record: any) => {
  // TODO: 分享视频
};

const playUploadedVideo = (ref: any) => {
  if (ref.type === 'video' && (ref.videoUrl || ref.image)) {
    playingVideoUrl.value = ref.videoUrl || ref.image;
    showVideoModal.value = true;
  }
};

const regenerateRecord = (record: any) => {
  if (record.type == 'photo') {
    bottomActiveTab.value = 'photo';

    // 展开输入框并重置折叠状态
    isPhotoInputCollapsed.value = false;
    lastCollapseState = null;

    const userSelected = record.user_selected || {};
    const others = userSelected.others || {};
    const content = others.content || '';
    const list = others.list || [];

    uploadedPhotoImages.value = list.map((item: any, index: number) => ({
      id: item.id || Date.now() + index.toString(),
      name: item.name || `image${index + 1}`,
      image: item.image || item.url || '',
      type: item.type || 'image'
    }));

    if (userSelected.ratio) {
      selectedPhotoRatio.value = userSelected.ratio;
    }
    if (userSelected.simple_image_resolution) {
      selectedPhotoQuality.value = userSelected.simple_image_resolution;
    }
    if (userSelected.story_mode) {
      // Map nsfw to unlimited mode, but check if user is teenager
      const mode = userSelected.story_mode == 'nsfw' ? 'unlimited' : userSelected.story_mode;
      // If user is teenager, cannot use unlimited mode
      currentPhotoMode.value = isTeenager.value && mode == 'unlimited' ? 'normal' : mode;
    } else {
      currentPhotoMode.value = 'normal';
    }

    photoInputKey.value++;

    setTimeout(() => {
      if (photoEditableInputRef.value) {
        photoEditableInputRef.value.innerHTML = formatContent(content, record);
      }
    }, 100);
  } else if (record.type == 'video') {
    const userSelected = record.user_selected || {};
    const isVideoExtensionMode = userSelected.simple_video_generate_mode == 'video_extension';

    // 检查是否使用了无限制模式且是视频续写类型
    const storyMode = userSelected.story_mode;
    const usedUnlimitedMode = (storyMode == 'nsfw' || storyMode == 'unlimited') && isVideoExtensionMode;

    // 检查限制条件
    const hasUnlimitedModeRestriction = !userRegion.value || isTeenager.value;

    if (usedUnlimitedMode && hasUnlimitedModeRestriction) {
      toast(t('home.error.unlimitedModeRestricted'));
      return;
    }

    bottomActiveTab.value = 'video';

    // 展开输入框并重置折叠状态
    isVideoInputCollapsed.value = false;
    lastCollapseState = null;

    const others = userSelected.others || {};
    const content = others.content || record.topic || record.description || '';

    const list = others.list || [];

    uploadedVideoRefs.value = list.map((item: any, index: number) => ({
      id: item.id || Date.now() + index.toString(),
      name: item.name || `file${index + 1}`,
      image: item.image || item.url || '',
      type: item.type || 'image',
      cover: item.cover || ''
    }));

    if (userSelected.ratio) {
      selectedVideoRatio.value = userSelected.ratio;
    }
    if (userSelected.simple_video_resolution) {
      selectedVideoQuality.value = userSelected.simple_video_resolution.toUpperCase();
    }
    if (userSelected.simple_video_duration) {
      selectedVideoDuration.value = userSelected.simple_video_duration.toString();
    }
    // 回显时读取记录中的模式
    if (userSelected.story_mode) {
      const mode = userSelected.story_mode == 'nsfw' ? 'unlimited' : userSelected.story_mode;
      currentVideoMode.value = isTeenager.value && mode == 'unlimited' ? 'normal' : mode;
    } else {
      currentVideoMode.value = 'normal';
    }

    if (userSelected.simple_video_generate_mode == 'first_last_frames') {
      selectedVideoMultimodal.value = 'startEndFrames';
      const referenceImages = userSelected.reference_images || [];
      startFrameImage.value = referenceImages[0]?.url || '';
      endFrameImage.value = referenceImages[1]?.url || '';
      videoInput.value = content;
    } else if (isVideoExtensionMode) {
      selectedVideoMultimodal.value = 'videoExtend';
      uploadedVideoRefs.value = [];
      uploadedVideo.value = '';
      uploadedVideoCover.value = '';

      const videoItem = list.find((item: any) => item.type === 'video');
      if (videoItem) {
        const videoUrl = videoItem.image || videoItem.url || '';
        if (videoUrl) {
          uploadedVideo.value = videoUrl;
          uploadedVideoCover.value = videoItem.cover || '';
        }
      }

      videoInput.value = content;
    } else {
      selectedVideoMultimodal.value = 'multimodal';

      setTimeout(() => {
        if (videoEditableInputRef.value) {
          videoEditableInputRef.value.innerHTML = formatContent(content, record);
        }
      }, 100);
    }
  }
};

const showPhotoMoreOptions = (record: any, event: Event) => {
  const target = event.target as HTMLElement;
  calculatePopupPosition(target, 'photo');

  if (activeRecord.value?.id == record.id) {
    showMoreOptions.value = !showMoreOptions.value;
  } else {
    activeRecord.value = record;
    showMoreOptions.value = true;
  }
};

const deleteRecord = (record: any) => {
  recordToDelete.value = record;
  showDeleteRecordModal.value = true;
  showMoreOptions.value = false;
};

function goRecharge(){
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-recharge');
  showInsufficientBalanceModal.value = false;
};

const handleCloseDeleteModal = () => {
  showDeleteRecordModal.value = false;
  recordToDelete.value = null;
};

const handleConfirmDelete = async () => {
  if (!recordToDelete.value) return;

  try {
    const response = await api.deleteProject({ session_id: recordToDelete.value.session_id }) as any;
    if (response.code == 200) {
      const index = records.value.findIndex(r => r.session_id == recordToDelete.value.session_id);
      if (index !== -1) {
        records.value.splice(index, 1);
        totalCount.value--;
      }
      // Update displayRecords to reflect the deletion
      displayRecords.value = records.value;
      toast(t('success'));
    } else {
      toast(response.message || t('fail'));
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    toast(t('fail'));
  }

  showDeleteRecordModal.value = false;
  recordToDelete.value = null;
};

const editImage = (record: any, index: number) => {
  bottomActiveTab.value = 'photo';

  // 展开输入框并重置折叠状态
  isPhotoInputCollapsed.value = false;
  lastCollapseState = null;

  if (photoEditableInputRef.value) {
    photoEditableInputRef.value.innerHTML = '';
    const textNode = document.createTextNode(record.topic || record.description || '');
    photoEditableInputRef.value.appendChild(textNode);
  }

  const images = record.images || [];
  if (images[index]) {
    uploadedPhotoImages.value = [{
      id: Date.now().toString(),
      name: `image${index + 1}`,
      image: images[index],
      type: 'image'
    }];
  } else {
    uploadedPhotoImages.value = [];
  }

  // 回显设置项
  if (record.user_selected) {
    if (record.user_selected.ratio) {
      selectedPhotoRatio.value = record.user_selected.ratio;
    }
    if (record.user_selected.resolution || record.user_selected.simple_image_resolution) {
      selectedPhotoQuality.value = record.user_selected.resolution || record.user_selected.simple_image_resolution;
    }
    if (record.user_selected.story_mode) {
      const mode = record.user_selected.story_mode == 'nsfw' ? 'unlimited' : record.user_selected.story_mode;
      currentPhotoMode.value = isTeenager.value && mode == 'unlimited' ? 'normal' : mode;
    }
  }

  photoInputKey.value++;

  nextTick(() => {
    const recordElement = document.querySelector(`[data-session-id="${record.session_id}"]`);
    if (recordElement) {
      recordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

const downloadSingleImage = (imageUrl: string) => {
  try {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `image_${Date.now()}.png`;
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading image:', error);
    toast(t('fail'));
  }
};

const showVideoMoreOptions = (record: any, event: Event) => {
  const target = event.target as HTMLElement;
  calculatePopupPosition(target, 'video');

  if (activeVideoRecord.value?.id == record.id) {
    showVideoMoreOptionsVisible.value = !showVideoMoreOptionsVisible.value;
  } else {
    activeVideoRecord.value = record;
    showVideoMoreOptionsVisible.value = true;
  }
};

const calculatePopupPosition = (target: HTMLElement, type: 'photo' | 'video') => {
  const rect = target.getBoundingClientRect();
  const popupHeight = 44; // 弹窗高度
  const windowHeight = window.innerHeight;
  const distanceToBottom = windowHeight - rect.bottom;

  if (distanceToBottom < popupHeight + 20) {
    // 距离底部不够，显示在上方
    if (type == 'photo') {
      photoPopupPosition.value = 'top';
    } else {
      videoPopupPosition.value = 'top';
    }
  } else {
    // 距离底部足够，显示在下方
    if (type == 'photo') {
      photoPopupPosition.value = 'bottom';
    } else {
      videoPopupPosition.value = 'bottom';
    }
  }
};

const deleteVideoRecord = (record: any) => {
  recordToDelete.value = record;
  showDeleteRecordModal.value = true;
  showVideoMoreOptionsVisible.value = false;
};

const getVideoPlayerStyle = (ratio: string) => {
  let width = 198;
  let height = 198;

  if (ratio == '9:16') {
    width = 198;
    height = 352;
  } else if (ratio == '16:9') {
    width = 352;
    height = 198;
  } else if (ratio == '1:1') {
    width = 198;
    height = 198;
  }

  return {
    width: `${width}px`,
    height: `${height}px`
  };
};

const getLoadingGif = (ratio: string) => {
  if (ratio == '9:16') {
    return loadingGif916;
  } else if (ratio == '16:9') {
    return loadingGif169;
  } else {
    return loadingGif11;
  }
};

const getPositionInText = (element: HTMLElement, range: Range): number => {
  let position = 0;

  const calculatePosition = (node: Node, endNode: Node, endOffset: number): boolean => {
    if (node === endNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        let parent = node.parentElement;
        let isInNonEditable = false;
        while (parent) {
          if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
            isInNonEditable = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!isInNonEditable) {
          position += Math.min(endOffset, node.textContent?.length || 0);
        }
      }
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      let parent = node.parentElement;
      let isInNonEditable = false;
      while (parent) {
        if (parent.hasAttribute('contenteditable') && parent.contentEditable === 'false') {
          isInNonEditable = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isInNonEditable) {
        position += node.textContent?.length || 0;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return false;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        if (calculatePosition(node.childNodes[i], endNode, endOffset)) {
          return true;
        }
      }
    }

    return false;
  };

  calculatePosition(element, range.startContainer, range.startOffset);
  return position;
};

const checkAgeForUnlimitedMode = (modeType: string): boolean => {
  if (!userInfo.value) {
    return false;
  }

  // 未满18岁（详情接口 is_adult != 1）：弹出「是否满18岁」问询
  if (isTeenager.value) {
    pendingModeType.value = modeType;
    showUnderageNoBirthdayModal.value = true;
    return true;
  }

  return false;
};

const handleUnlimitedAgeConfirm = async (isAdult: boolean) => {
  showUnderageNoBirthdayModal.value = false;
  // 选择"否"：未满18岁，直接关闭不开启
  if (!isAdult) {
    return;
  }
  // 选择"是"：声明已满18岁，写回后端 is_adult
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

  // 确认满18岁后直接开启无限制模式（不再二次弹「是否开启无限制」确认）
  confirmUnlimitedMode();
};

const switchPhotoMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    if (checkAgeForUnlimitedMode('photo')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentPhotoMode.value = 'unlimited';
    } else {
      pendingModeType.value = 'photo';
      showUnlimitedModal.value = true;
    }
  } else {
    currentPhotoMode.value = 'normal';
  }
};

const switchVideoMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    if (checkAgeForUnlimitedMode('video')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentVideoMode.value = 'unlimited';
    } else {
      pendingModeType.value = 'video';
      showUnlimitedModal.value = true;
    }
  } else {
    currentVideoMode.value = 'normal';
    // 如果当前选中的是视频续写模式，切换回多模态模式
    if (selectedVideoMultimodal.value === 'videoExtend') {
      selectedVideoMultimodal.value = 'multimodal';
    }
  }
};

const confirmUnlimitedMode = () => {
  if (pendingModeType.value === 'video') {
    currentVideoMode.value = 'unlimited';
  } else if (pendingModeType.value === 'photo') {
    currentPhotoMode.value = 'unlimited';
  }
  showUnlimitedModal.value = false;
};
</script>

<style lang="scss" scoped>
  @use '@/scss/Generate.scss';
</style>
