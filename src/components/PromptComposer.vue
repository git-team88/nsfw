<template>
           <div
             v-if="isVisible"
             ref="inputAreaBoxRef"
             class="input-area-box"
             :class="{
               'is-sticky': showStickyInput,
               'is-expanded': showStickyInput && stickyInputExpanded,
               'is-panel': isPanelPlacement,
               'is-standalone': isBottomPlacement,
               'is-loading': composerLoading
             }"
           >
            <!-- 收起态类型栏是隐藏的，关闭按钮浮在折叠条右上角外侧 -->
            <button
              v-if="props.closable && isStickyCollapsed"
              class="composer-close-btn is-outside"
              type="button"
              aria-label="close"
              @mousedown.prevent
              @click.stop="closeComposer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
            </button>

            <div class="input-type-box" :class="{ 'no-tabs': simplifyForMakeSource }" v-show="!isStickyCollapsed">
              <!-- Content Type Selector：做同款 / 做续集 / 图片做视频时来源已经定了类型，不给切 -->
              <div class="content-type-selector" v-if="!simplifyForMakeSource">
                <div
                  v-for="(type, index) in contentTypeOptions"
                  :key="type.value"
                  class="type-btn"
                  :class="{ active: contentType == type.value }"
                  @click="selectContentType(type.value)"
                >
                  <span>{{ type.label }}</span>
                </div>
              </div>

              <div class="main-right">
                <!-- Help Button with Dropdown -->
                <!-- <div class="help-btn-container" @mouseenter="showHelpDropdown = true" @mouseleave="showHelpDropdown = false">
                  <img src="@/assets/images/home/info.png" alt="" class="help-btn" />
                  <div class="help-dropdown">
                    <div class="help-dropdown-content">
                      <ul>
                        <li>{{ t('home.help.item1') }}</li>
                        <li>{{ t('home.help.item2') }}</li>
                        <li>{{ t('home.help.item3') }}</li>
                        <li>{{ t('home.help.item4') }}</li>
                      </ul>
                    </div>
                  </div>
                </div> -->

                <div class="input-role">
                  <img src="@/assets/images/home/role.png" alt="" />
                </div>

                <!-- 关闭：清空内容并收起输入框，只有作品详情页需要 -->
                <button
                  v-if="props.closable"
                  class="composer-close-btn"
                  type="button"
                  aria-label="close"
                  @mousedown.prevent
                  @click.stop="closeComposer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <!-- Video Mode Content -->
            <div v-if="contentType == 'video'">
              <!-- Input Area -->
              <div class="input-area">
                <div class="input-inner" :class="{ collapsed: isStickyCollapsed }">
                  <template v-if="selectedVideoMultimodal == 'multimodal'">
                    <!-- Combined Characters and Images List -->
                    <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                      <div
                        v-for="(item, index) in combinedItems"
                        :key="item.id"
                        :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                        :style="dragItemStyle(item.id)"
                        @pointerdown="onItemPointerDown($event, item.id)"
                        @click.capture="onItemClickCapture"
                        @dragstart.prevent
                      >
                        <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'video'">{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'audio'">{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <div class="image-box" @click="item.type === 'video' ? playUploadedVideo(item) : item.type === 'audio' ? playAudio(item) : openImageViewer(item.image)">
                          <div class="uploaded-item-wrapper">
                            <img v-if="item.type === 'image'" :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />
                            <div v-else-if="item.type === 'video'" class="video-thumbnail-box">
                              <img :src="item.cover || item.image" :alt="item.name" class="uploaded-image" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                            <div v-else-if="item.type === 'audio'" class="audio-thumbnail-box">
                              <img src="@/assets/images/home/audio.png" :alt="item.name" class="uploaded-image audio-icon" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                          </div>
                          <span class="img-bg"></span>
                        </div>
                        <span class="tooltip-name">{{ item.name }}</span>
                        <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                        <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'video'" class="image-name" @click="playUploadedVideo(item)">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'audio'" class="image-name" @click="playAudio(item)">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                      </div>
                    </div>

                    <div
                      ref="editableInputRef"
                      :data-tab="contentType"
                      :data-mode="selectedVideoMultimodal"
                      @vue:mounted="onVideoInputMounted"
                      :key="`input-${inputKey}`"
                      :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                      contenteditable="true"
                      spellcheck="false"
                      autocorrect="off"
                      autocapitalize="none"
                      @input="handleInput"
                      @compositionstart="handleCompositionStart"
                      @compositionend="handleCompositionEnd"
                      @keydown="handleKeydown"
                      @click="handleInputClick"
                      @blur="handleInputBlur"
                      @paste="handlePaste"
                      @focus="handleInputFocus"
                      :data-placeholder="typedPlaceholder"
                    ></div>

                    <!-- Hidden file input for image upload -->
                    <input
                      ref="fileInputRef"
                      type="file"
                      multiple
                      :accept="'image/*,video/mp4,video/quicktime,audio/mp3,audio/wav'"
                      class="file-input"
                      style="display: none;"
                      @change="handleFileChange"
                    />

                    <!-- @ Dropdown -->
                    <div v-if="showAtDropdown" class="at-dropdown">
                      <div
                        v-for="(item, index) in atDropdownItems"
                        :key="index"
                        class="dropdown-item"
                        @mousedown.prevent="selectAtItem(item)"
                      >
                        <div class="dropdown-img">
                          <img :src="item.type === 'audio' ? audioIcon : item.type === 'video' ? (item.cover || item.image) : item.image" :alt="item.name" />
                        </div>
                        <span v-if="item.type === 'character'">{{ item.name }}</span>
                        <span v-else-if="item.type === 'video'">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id == item.id) + 1 }}</span>
                        <span v-else-if="item.type === 'audio'">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id == item.id) + 1 }}</span>
                        <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      </div>
                    </div>
                  </template>

                  <!-- Start and End Frames Mode - Show start/end image upload -->
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
                        :class="['frames-textarea', { collapsed: isStickyCollapsed }]"
                        :placeholder="typedPlaceholder"
                        v-model="framesInput"
                        spellcheck="false"
                        @input="handleTextareaInput"
                        @click="handleFramesTextareaClick"
                      ></textarea>
                    </div>
                  </template>

                  <!-- Video Modify Mode -->
                  <template v-else-if="selectedVideoMultimodal == 'videoModify'">
                    <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                      <div
                        v-for="(item, index) in combinedItems"
                        :key="item.id"
                        :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                        :style="dragItemStyle(item.id)"
                        @pointerdown="onItemPointerDown($event, item.id)"
                        @click.capture="onItemClickCapture"
                        @dragstart.prevent
                      >
                        <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'video'">{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 2 }}</span>
                        <span class="image-index" v-if="item.type == 'audio'">{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <div class="image-box" @click="item.type === 'video' ? playUploadedVideo(item) : item.type === 'audio' ? playAudio(item) : openImageViewer(item.image)">
                          <div class="uploaded-item-wrapper">
                            <img v-if="item.type === 'image'" :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />
                            <div v-else-if="item.type === 'video'" class="video-thumbnail-box">
                              <img :src="item.cover || item.image" :alt="item.name" class="uploaded-image" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                            <div v-else-if="item.type === 'audio'" class="audio-thumbnail-box">
                              <img src="@/assets/images/home/audio.png" :alt="item.name" class="uploaded-image audio-icon" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                          </div>
                          <span class="img-bg"></span>
                        </div>
                        <span class="tooltip-name">{{ item.name }}</span>
                        <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                        <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'video'" class="image-name" @click="playUploadedVideo(item)">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 2 }}</span>
                        <span v-if="item.type === 'audio'" class="image-name" @click="playAudio(item)">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                      </div>
                    </div>

                    <div class="video-extend-input">
                      <div class="video-upload" :class="{ uploaded: uploadedVideo }">
                        <input
                          ref="videoInput"
                          type="file"
                          accept="video/mp4,video/quicktime"
                          class="file-input"
                          style="display: none;"
                          @change="handleVideoUpload"
                        />
                        <div class="upload-area" @click="uploadedVideo && !isUploading ? playUploadedVideo({ url: uploadedVideo, cover: uploadedVideoCover }) : triggerVideoUpload()">
                          <template v-if="uploadedVideo">
                            <img v-if="uploadedVideoCover" :src="uploadedVideoCover" class="preview-video" />
                            <video v-else :src="uploadedVideo" class="preview-video" muted preload="metadata"></video>
                            <span class="image-name">{{ t('home.video') }}1</span>
                            <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="removeVideo" />
                            <img class="play-icon" src="@/assets/images/detail/play.png" alt="Play" />
                          </template>
                          <template v-else>
                            <img class="upload-icon video-icon" src="@/assets/images/home/img_icon.png" alt="Upload" />
                            <span class="upload-label">{{ t('home.contentType.video') }}</span>
                          </template>
                        </div>
                      </div>

                      <div
                        ref="editableInputRef"
                        :data-tab="contentType"
                        :data-mode="selectedVideoMultimodal"
                        @vue:mounted="onVideoInputMounted"
                        :key="`input-${inputKey}`"
                        :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                        contenteditable="true"
                        spellcheck="false"
                        autocorrect="off"
                        autocapitalize="none"
                        @input="handleInput"
                        @compositionstart="handleCompositionStart"
                        @compositionend="handleCompositionEnd"
                        @keydown="handleKeydown"
                        @click="handleInputClick"
                        @blur="handleInputBlur"
                        @paste="handlePaste"
                        @focus="handleInputFocus"
                        :data-placeholder="typedPlaceholder"
                      ></div>

                      <input
                        ref="fileInputRef"
                        type="file"
                        multiple
                        :accept="'image/*,video/mp4,video/quicktime,audio/mp3,audio/wav'"
                        class="file-input"
                        style="display: none;"
                        @change="handleFileChange"
                      />

                      <div v-if="showAtDropdown" class="at-dropdown">
                        <div
                          v-for="(item, index) in atDropdownItems"
                          :key="index"
                          class="dropdown-item"
                          @mousedown.prevent="selectAtItem(item)"
                        >
                          <div class="dropdown-img">
                            <img :src="item.type === 'audio' ? audioIcon : item.type === 'video' ? (item.cover || item.image) : item.image" :alt="item.name" />
                          </div>
                          <span v-if="item.type === 'character'">{{ item.name }}</span>
                          <span v-else-if="item.type === 'video'">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id == item.id) + 2 }}</span>
                          <span v-else-if="item.type === 'audio'">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id == item.id) + 1 }}</span>
                          <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Video Extend Mode - Show video upload -->
                  <template v-else-if="selectedVideoMultimodal == 'videoExtend'">
                    <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                      <div
                        v-for="(item, index) in combinedItems"
                        :key="item.id"
                        :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                        :style="dragItemStyle(item.id)"
                        @pointerdown="onItemPointerDown($event, item.id)"
                        @click.capture="onItemClickCapture"
                        @dragstart.prevent
                      >
                        <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'video'">{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 2 }}</span>
                        <span class="image-index" v-if="item.type == 'audio'">{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <div class="image-box" @click="item.type === 'video' ? playUploadedVideo(item) : item.type === 'audio' ? playAudio(item) : openImageViewer(item.image)">
                          <div class="uploaded-item-wrapper">
                            <img v-if="item.type === 'image'" :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />
                            <div v-else-if="item.type === 'video'" class="video-thumbnail-box">
                              <img :src="item.cover || item.image" :alt="item.name" class="uploaded-image" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                            <div v-else-if="item.type === 'audio'" class="audio-thumbnail-box">
                              <img src="@/assets/images/home/audio.png" :alt="item.name" class="uploaded-image audio-icon" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                          </div>
                          <span class="img-bg"></span>
                        </div>
                        <span class="tooltip-name">{{ item.name }}</span>
                        <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                        <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'video'" class="image-name" @click="playUploadedVideo(item)">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 2 }}</span>
                        <span v-if="item.type === 'audio'" class="image-name" @click="playAudio(item)">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                      </div>
                    </div>

                    <div class="video-extend-input">
                      <div class="video-upload" :class="{ uploaded: uploadedVideo }">
                        <input
                          ref="videoInput"
                          type="file"
                          accept="video/mp4,video/quicktime"
                          class="file-input"
                          style="display: none;"
                          @change="handleVideoUpload"
                        />
                        <div class="upload-area" @click="uploadedVideo && !isUploading ? playUploadedVideo({ url: uploadedVideo, cover: uploadedVideoCover }) : triggerVideoUpload()">
                          <template v-if="uploadedVideo">
                            <img v-if="uploadedVideoCover" :src="uploadedVideoCover" class="preview-video" />
                            <video v-else :src="uploadedVideo" class="preview-video" muted preload="metadata"></video>
                            <span class="image-name">{{ t('home.video') }}1</span>
                            <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="removeVideo" />
                            <img class="play-icon" src="@/assets/images/detail/play.png" alt="Play" />
                          </template>
                          <template v-else>
                            <img class="upload-icon video-icon" src="@/assets/images/home/img_icon.png" alt="Upload" />
                            <span class="upload-label">{{ t('home.contentType.video') }}</span>
                          </template>
                        </div>
                      </div>

                      <div
                        ref="editableInputRef"
                        :data-tab="contentType"
                        :data-mode="selectedVideoMultimodal"
                        @vue:mounted="onVideoInputMounted"
                        :key="`input-${inputKey}`"
                        :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                        contenteditable="true"
                        spellcheck="false"
                        autocorrect="off"
                        autocapitalize="none"
                        @input="handleInput"
                        @compositionstart="handleCompositionStart"
                        @compositionend="handleCompositionEnd"
                        @keydown="handleKeydown"
                        @click="handleInputClick"
                        @blur="handleInputBlur"
                        @paste="handlePaste"
                        @focus="handleInputFocus"
                        :data-placeholder="typedPlaceholder"
                      ></div>

                      <input
                        ref="fileInputRef"
                        type="file"
                        multiple
                        :accept="'image/*,video/mp4,video/quicktime,audio/mp3,audio/wav'"
                        class="file-input"
                        style="display: none;"
                        @change="handleFileChange"
                      />

                      <div v-if="showAtDropdown" class="at-dropdown">
                        <div
                          v-for="(item, index) in atDropdownItems"
                          :key="index"
                          class="dropdown-item"
                          @mousedown.prevent="selectAtItem(item)"
                        >
                          <div class="dropdown-img">
                            <img :src="item.type === 'audio' ? audioIcon : item.type === 'video' ? (item.cover || item.image) : item.image" :alt="item.name" />
                          </div>
                          <span v-if="item.type === 'character'">{{ item.name }}</span>
                          <span v-else-if="item.type === 'video'">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id == item.id) + 2 }}</span>
                          <span v-else-if="item.type === 'audio'">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id == item.id) + 1 }}</span>
                          <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div class="input-box" :class="{ collapsed: isStickyCollapsed }">
                    <div class="input-options" v-show="!isStickyCollapsed">
                      <!-- Mode Switch for Video - only show if not a teenager -->
                      <div v-if="contentSwitch.loaded && contentSwitch.showCreateNsfwToggle && userRegion" class="unlimited-switch" @click="switchVideoMode(currentVideoMode == 'normal' ? 'unlimited' : 'normal', currentVideoMode == 'normal' ? 2 : 1)">
                        <span class="nsfw-btn" :class="{ on: effectiveVideoMode == 'unlimited' }">
                          <span class="nsfw-dot"></span>
                          {{ t('home.mode.unlimited') }}
                        </span>
                      </div>

                      <!-- Multimodal Selector：拍同款 / 做续集 / 图片做视频时模式是来源定的，不给切 -->
                      <div v-if="!isVideoMakeSource" class="video-selector" @click="showVideoMultimodalDropdown = !showVideoMultimodalDropdown; showVideoSettings = false" :class="{ open: showVideoMultimodalDropdown }">
                        <div class="selector-header">
                          <span>{{ videoMultimodalOptions.find(opt => opt.value === selectedVideoMultimodal)?.label || selectedVideoMultimodal }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showVideoMultimodalDropdown">
                          <div
                            v-for="option in videoMultimodalOptions"
                            :key="option.value"
                            class="dropdown-item"
                            :class="{ active: selectedVideoMultimodal == option.value }"
                            @click.stop="switchVideoMultimodal(option.value)"
                          >
                            <span>{{ option.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 版本选择器：普通模式也要出（极速版/超级版），只有一个可选时不展示 -->
                      <div v-if="nsfwVersionOptions.length > 1" class="video-selector nsfw-version-selector"
                        @click="showNsfwVersionDropdown = !showNsfwVersionDropdown; showVideoMultimodalDropdown = false; showVideoSettings = false"
                        :class="{ open: showNsfwVersionDropdown }">
                        <div class="selector-header">
                          <span>{{ nsfwVersionOptions.find(opt => opt.value === selectedNsfwVersion)?.label || selectedNsfwVersion }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showNsfwVersionDropdown">
                          <div
                            v-for="option in nsfwVersionOptions"
                            :key="option.value"
                            class="dropdown-item"
                            :class="{ active: selectedNsfwVersion == option.value }"
                            @click.stop="selectNsfwVersion(option.value)"
                          >
                            <span>{{ option.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Reference Button - Only show in multimodal mode -->
                      <div v-if="selectedVideoMultimodal == 'multimodal' || selectedVideoMultimodal == 'videoModify' || selectedVideoMultimodal == 'videoExtend'" class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) { if ((selectedVideoMultimodal == 'videoModify' || selectedVideoMultimodal == 'videoExtend') && !uploadedVideo) { toast(t('home.error.videoModifyRequired')); return; } triggerFileUpload() } }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>

                      <!-- Video Settings Selector -->
                      <div class="video-settings-selector" @click="showVideoSettings = !showVideoSettings; showVideoMultimodalDropdown = false" :class="{ open: showVideoSettings }">
                        <div class="selector-header">
                          <span>{{ selectedVideoQuality }}</span>

                          <!-- 拍同款 / 做续集：比例、时长都跟着原视频走（自动），这两段不显示，只留画质 -->
                          <template v-if="!hideVideoAutoSettings">
                            <span class="settings-divider"></span>
                            <span v-if="selectedVideoMultimodal == 'startEndFrames' || selectedVideoMultimodal == 'videoModify' || selectedVideoMultimodal == 'videoExtend'">{{ t('home.videoSettings.ratioAuto') }}</span>
                            <span v-else class="settings-ratio"><RatioIcon :value="selectedVideoRatio" />{{ selectedVideoRatio }}</span>
                            <span class="settings-divider"></span>
                            <span>{{ (selectedVideoMultimodal == 'videoModify' || selectedVideoMultimodal == 'videoExtend') ? t('home.videoSettings.durationAuto') : `${selectedVideoDuration}s` }}</span>
                          </template>
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
                          <div class="settings-section" v-if="selectedVideoMultimodal != 'startEndFrames' && selectedVideoMultimodal != 'videoModify' && selectedVideoMultimodal != 'videoExtend'">
                            <span class="settings-label">{{ t('home.videoSettings.ratio') }}</span>
                            <div class="settings-options">
                              <div
                                v-for="ratio in videoRatioOptions"
                                :key="ratio.value"
                                class="dropdown-item"
                                :class="{ active: selectedVideoRatio == ratio.value }"
                                @click.stop="selectedVideoRatio = ratio.value"
                              >
                                <RatioIcon :value="ratio.value" />{{ ratio.label }}
                              </div>
                            </div>
                          </div>
                          <div class="settings-section" v-else-if="!hideVideoAutoSettings">
                            <span class="settings-label">{{ t('home.videoSettings.ratio') }}</span>
                            <div class="settings-options">
                              <div class="dropdown-item active">
                                {{ t('home.videoSettings.ratioAuto') }}
                              </div>
                            </div>
                          </div>
                          <div class="settings-section" v-if="selectedVideoMultimodal != 'videoModify' && selectedVideoMultimodal != 'videoExtend'">
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
                                :min="videoProfile.durationMin"
                                  :max="videoProfile.durationMax"
                                step="1"
                                :value="selectedVideoDuration"
                                @input="onVideoDurationChange"
                                @mousedown="saveLastValidDuration"
                                @mouseup="validateDurationAndRestore"
                                @click.stop
                                class="slider-input"
                              />
                            </div>
                          </div>
                          <div class="settings-section" v-else-if="!hideVideoAutoSettings">
                            <span class="settings-label">{{ t('home.videoSettings.duration') }}</span>
                            <div class="settings-options">
                              <div class="dropdown-item active">
                                {{ t('home.videoSettings.durationAuto') }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="selectedVideoMultimodal != 'videoModify' && selectedVideoMultimodal != 'videoExtend'" class="optimize-prompt-switch" @click="enableVideoOptimizePrompt = !enableVideoOptimizePrompt">
                        {{ t('home.option.optimizePrompt') }}
                        <img class="optimize-prompt-icon" :src="enableVideoOptimizePrompt ? optimizePromptOn : optimizePromptOff" alt="" />
                      </div>

                    </div>

                    <div class="generate-box">
                      <!-- <div v-if="isLoggedIn" class="cover-cost-display">
                        <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                      </div> -->
                      <div class="generate-btn" :class="[effectiveVideoMode == 'unlimited' ? 'unlimit' : '', { loading: isGeneratingVideo }]" @click="generateVideo">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedVideoComputingPower }}</span>
                          <div v-if="isGeneratingVideo" class="loading-spinner-small"></div>
                          <img v-else src="@/assets/images/home/power.png" alt="Power" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!--// Drama Mode Content -->
            <div v-else-if="contentType == 'drama'">
              <!-- Input Area -->
               <div class="input-area">
                 <div class="input-inner" :class="{ collapsed: isStickyCollapsed }">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                      :style="dragItemStyle(item.id)"
                      @pointerdown="onItemPointerDown($event, item.id)"
                      @click.capture="onItemClickCapture"
                      @dragstart.prevent
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <div class="image-box" @click="openImageViewer(item.image)">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                        <span class="img-bg"></span>
                      </div>
                      <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                      <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :key="`input-${inputKey}`"
                    :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @compositionstart="handleCompositionStart"
                    @compositionend="handleCompositionEnd"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="typedPlaceholder"
                    :data-tab="contentType"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    multiple
                    accept="image/*"
                    class="file-input"
                    style="display: none;"
                    @change="handleFileChange"
                  />

                  <!-- @ Dropdown -->
                  <div v-if="showAtDropdown" class="at-dropdown">
                    <div
                      v-for="(item, index) in atDropdownItems"
                      :key="index"
                      class="dropdown-item"
                      @mousedown.prevent="selectAtItem(item)"
                    >
                      <div class="dropdown-img">
                        <img :src="item.image" :alt="item.name" />
                      </div>
                      <span v-if="item.type === 'character'">{{ item.name }}</span>
                      <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                    </div>
                  </div>

                  <div class="input-box" :class="{ collapsed: isStickyCollapsed }">
                    <div class="input-options" v-show="!isStickyCollapsed">
                      <!-- Mode Switch for Comic Video - only show if not a teenager -->
                      <div class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchDramaMode(currentDramaMode == 'normal' ? 'unlimited' : 'normal', currentDramaMode == 'normal' ? 2 : 1)">
                        <img
                          v-if="isTeenager"
                          src="@/assets/images/home/not_allow.png"
                          alt="Unlimited disabled"
                          class="unlimited-icon"
                        />
                        <img
                          v-else-if="currentDramaMode == 'unlimited'"
                          src="@/assets/images/home/open.png"
                          alt="Unlimited on"
                          class="unlimited-icon"
                        />
                        <img
                          v-else
                          src="@/assets/images/home/close.png"
                          alt="Unlimited off"
                          class="unlimited-icon"
                        />
                        <span class="unlimited-label">{{ t('home.mode.unlimited') }}</span>
                      </div>

                      <div class="option-btn character-btn" @click="() => { if (checkLogin() && checkItemLimit()) showCharacterModal = true }">
                        <img src="@/assets/images/home/role_icon.png" alt="" />
                        <span>{{ t('home.option.character') }}</span>
                      </div>
                      <div class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) triggerFileUpload() }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>
                    </div>

                    <div class="generate-btn" :class="[currentDramaMode == 'unlimited' ? 'unlimit' : '', { loading: isGeneratingDrama }]" @click="generateDrama">
                      <div class="generate-comic-btn">
                        <span v-if="isGeneratingDrama" class="loading-spinner-small"></span>
                        <img v-else src="@/assets/images/home/send.png" alt="Send" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Photo Mode Content -->
            <div v-else-if="contentType == 'photo'">
              <!-- Input Area -->
               <div class="input-area">
                 <div class="input-inner" :class="{ collapsed: isStickyCollapsed }">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                      :style="dragItemStyle(item.id)"
                      @pointerdown="onItemPointerDown($event, item.id)"
                      @click.capture="onItemClickCapture"
                      @dragstart.prevent
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <div class="image-box" @click="openImageViewer(item.image)">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                        <span class="img-bg"></span>
                      </div>
                      <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                      <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :data-tab="contentType"
                    :key="`input-${inputKey}`"
                    :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @compositionstart="handleCompositionStart"
                    @compositionend="handleCompositionEnd"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="typedPlaceholder"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    multiple
                    accept="image/*"
                    class="file-input"
                    style="display: none;"
                    @change="handleFileChange"
                  />

                  <!-- @ Dropdown -->
                  <div v-if="showAtDropdown" class="at-dropdown">
                    <div
                      v-for="(item, index) in atDropdownItems"
                      :key="index"
                      class="dropdown-item"
                      @mousedown.prevent="selectAtItem(item)"
                    >
                      <div class="dropdown-img">
                        <img :src="item.image" :alt="item.name" />
                      </div>
                      <span v-if="item.type === 'character'">{{ item.name }}</span>
                      <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                    </div>
                  </div>

                  <div class="input-box" :class="{ collapsed: isStickyCollapsed }">
                    <div class="input-options" v-show="!isStickyCollapsed">
                      <!-- Mode Switch for Photo - only show if not a teenager -->
                      <div v-if="contentSwitch.loaded && contentSwitch.showCreateNsfwToggle && userRegion" class="unlimited-switch" @click="switchPhotoMode(currentPhotoMode == 'normal' ? 'unlimited' : 'normal', currentPhotoMode == 'normal' ? 2 : 1)">
                        <span class="nsfw-btn" :class="{ on: currentPhotoMode == 'unlimited' }">
                          <span class="nsfw-dot"></span>
                          {{ t('home.mode.unlimited') }}
                        </span>
                      </div>

                      <div class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) triggerFileUpload() }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>

                      <!-- Photo Settings Selector -->
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
                                <RatioIcon :value="ratio.value" />{{ ratio.label }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="optimize-prompt-switch" @click="enablePhotoOptimizePrompt = !enablePhotoOptimizePrompt">
                        {{ t('home.option.optimizePrompt') }}
                        <img class="optimize-prompt-icon" :src="enablePhotoOptimizePrompt ? optimizePromptOn : optimizePromptOff" alt="" />
                      </div>
                    </div>

                    <div class="generate-box">
                      <!-- <div v-if="isLoggedIn" class="cover-cost-display">
                        <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                      </div> -->
                      <div class="generate-btn" :class="[currentPhotoMode == 'unlimited' ? 'unlimit' : '', { loading: isGeneratingPhoto }]" @click="generatePhoto">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedPhotoComputingPower }}</span>
                          <div v-if="isGeneratingPhoto" class="loading-spinner-small"></div>
                          <img v-else src="@/assets/images/home/power.png" alt="Power" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comic Mode Content -->
            <div v-else-if="contentType == 'comic'">
              <!-- Input Area -->
               <div class="input-area">
                 <div class="input-inner" :class="{ collapsed: isStickyCollapsed }">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <!-- Combined Items -->
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item', { 'is-dragging': dragState.id === item.id }]"
                      :style="dragItemStyle(item.id)"
                      @pointerdown="onItemPointerDown($event, item.id)"
                      @click.capture="onItemClickCapture"
                      @dragstart.prevent
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>

                      <div class="image-box" @click="openImageViewer(item.image)">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />

                        <span class="img-bg"></span>
                      </div>

                      <span v-if="item.type === 'character'" class="character-name" @click="openImageViewer(item.image)">{{ item.name }}</span>
                      <span v-if="item.type === 'image'" class="image-name" @click="openImageViewer(item.image)">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click.stop="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :data-tab="contentType"
                    :key="`input-${inputKey}`"
                    :class="['input-textarea', { collapsed: isStickyCollapsed }]"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @compositionstart="handleCompositionStart"
                    @compositionend="handleCompositionEnd"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="typedPlaceholder"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    multiple
                    accept="image/*"
                    class="file-input"
                    style="display: none;"
                    @change="handleFileChange"
                  />

                  <!-- @ Dropdown -->
                  <div v-if="showAtDropdown" class="at-dropdown">
                    <div
                      v-for="(item, index) in atDropdownItems"
                      :key="index"
                      class="dropdown-item"
                      @mousedown.prevent="selectAtItem(item)"
                    >
                      <div class="dropdown-img">
                        <img :src="item.image" :alt="item.name" />
                      </div>

                      <span v-if="item.type === 'character'">{{ item.name }}</span>
                      <span v-else>{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                    </div>
                  </div>

                  <div class="input-box" :class="{ collapsed: isStickyCollapsed }">
                    <div class="input-options" v-show="!isStickyCollapsed">
                      <!-- Mode Switch for Comic - only show if not a teenager -->
                      <div v-if="contentSwitch.loaded && contentSwitch.showCreateNsfwToggle && userRegion" class="unlimited-switch" @click="switchComicMode(currentComicMode == 'normal' ? 'unlimited' : 'normal', currentComicMode == 'normal' ? 2 : 1)">
                        <span class="nsfw-btn" :class="{ on: currentComicMode == 'unlimited' }">
                          <span class="nsfw-dot"></span>
                          {{ t('home.mode.unlimited') }}
                        </span>
                      </div>

                      <div class="option-btn character-btn" @click="() => { if (checkLogin() && checkItemLimit()) showCharacterModal = true }">
                        <img src="@/assets/images/home/role_icon.png" alt="" />
                        <span>{{ t('home.option.character') }}</span>
                      </div>
                      <div class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) triggerFileUpload() }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>
                    </div>

                    <div class="generate-btn" :class="[currentComicMode == 'unlimited' ? 'unlimit' : '', { loading: isGeneratingComic }]" @click="generateComic">
                      <div class="generate-comic-btn">
                        <span v-if="isGeneratingComic" class="loading-spinner-small"></span>
                        <img v-else src="@/assets/images/home/send.png" alt="Send" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Novel Mode Content -->
            <div v-else-if="contentType == 'novel'" class="novel-mode-content">
               <div class="input-area novel-input-area">
                 <div class="input-inner" :class="{ collapsed: isStickyCollapsed }">
                   <textarea
                     :class="['novel-textarea', { collapsed: isStickyCollapsed }]"
                     :placeholder="typedPlaceholder"
                     v-model="novelInput"
                     spellcheck="false"
                     @input="handleTextareaInput"
                     @focus="handleNovelTextareaFocus"
                     @blur="isInputFocused = false"
                     @click="handleNovelTextareaClick"
                   ></textarea>

                  <div class="input-box" :class="{ collapsed: isStickyCollapsed }">
                    <div class="input-options novel-input-options" v-show="!isStickyCollapsed">
                      <div v-if="contentSwitch.loaded && contentSwitch.showCreateNsfwToggle && userRegion" class="unlimited-switch" @click="switchNovelMode(currentNovelMode == 'normal' ? 'unlimited' : 'normal', currentNovelMode == 'normal' ? 2 : 1)">
                        <span class="nsfw-btn" :class="{ on: currentNovelMode == 'unlimited' }">
                          <span class="nsfw-dot"></span>
                          {{ t('home.mode.unlimited') }}
                        </span>
                      </div>

                     <!-- Word Count Selector -->
                      <div class="novel-selector" @click="toggleWordCountDropdown" :class="{ open: showWordCountDropdown }">
                        <div class="selector-header">
                          <span>{{ t('home.totalWords') }}: {{ displayWordCount }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showWordCountDropdown">
                          <div
                            v-for="count in wordCountOptions"
                            :key="count.value"
                            class="dropdown-item"
                            :class="{ active: selectedWordCount == count.value }"
                            @click.stop="selectWordCount(count.value)"
                          >
                            <span>{{ locale === 'jp' && count.jpLabel ? count.jpLabel : count.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Language Selector -->
                      <div class="novel-selector" @click="toggleLanguageDropdown" :class="{ open: showLanguageDropdown }">
                        <div class="selector-header">
                          <span>{{ selectedLanguageText }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showLanguageDropdown">
                          <div
                            v-for="lang in languageOptions"
                            :key="lang.value"
                            class="dropdown-item"
                            :class="{ active: selectedLanguage == lang.value }"
                            @click.stop="selectLanguage(lang)"
                          >
                            <span>{{ lang.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Insert Image Selector -->
                      <div v-if="showNovelInsertImageSelector" class="novel-selector" @click="toggleInsertImageDropdown" :class="{ open: showInsertImageDropdown }">
                        <div class="selector-header">
                          <span>{{ t('home.insertImage') }}：{{ selectedInsertImageText }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showInsertImageDropdown">
                          <div
                            v-for="option in insertImageOptions"
                            :key="option.value"
                            class="dropdown-item"
                            :class="{ active: selectedInsertImage == option.value }"
                            @click.stop="selectInsertImage(option.value)"
                          >
                            <span>{{ option.label }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="generate-box">
                      <div class="generate-btn" :class="{ loading: isGeneratingNovel }" @click="navigateToNovelGenerate">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedComputingPower }}</span>
                          <div v-if="isGeneratingNovel" class="loading-spinner-small"></div>
                          <img v-else src="@/assets/images/home/power.png" alt="Send" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="showStickyInput && !isPanelPlacement"
            class="sticky-input-spacer"
            :style="{ height: `${stickyInputPlaceholderHeight}px` }"
            aria-hidden="true"
          ></div>

    <!-- Modals -->
    <UnlimitedModeModal
      v-if="showUnlimitedModal"
      @close="showUnlimitedModal = false"
      @confirm="confirmUnlimitedMode"
    />

    <UnderageNoBirthdayModal
      v-if="showUnderageNoBirthdayModal"
      @close="showUnderageNoBirthdayModal = false"
      @confirm="handleUnlimitedAgeConfirm"
    />

    <CharacterSelectModal
      v-if="showCharacterModal"
      :characters="characters"
      :selectedCharacters="selectedCharacters"
      @close="showCharacterModal = false"
      @confirm="selectCharacter"
    />

    <UploadMask :visible="isUploading" />
    <UploadMask :visible="isMakeSimilarLoading" :text="t('home.loading')" />
    <UploadMask :visible="isMakeSimilarVideoLoading" :text="t('home.loading')" />
    <UploadMask :visible="isMakeSequelLoading" :text="t('home.loading')" />

    <ModeSwitchFileWarningModal
      :visible="showModeSwitchFileWarning"
      :variant="modeSwitchWarningVariant"
      @cancel="cancelModeSwitchFileWarning"
      @confirm="confirmModeSwitchFileWarning"
    />

    <MakeSequelSubscribeModal
      :visible="showMakeSequelSubscribeModal"
      @go-subscribe="goMakeSequelSubscribe"
      @close="showMakeSequelSubscribeModal = false"
    />


    <!-- Insufficient Balance Modal -->
    <InsufficientBalanceModal
      :visible="showInsufficientBalanceModal"
      :estimated-frozen-power="insufficientBalanceEstimatedFrozen"
      :available-balance="insufficientBalanceAvailable"
      :system-frozen-balance="insufficientBalanceFrozen"
      @cancel="closeInsufficientBalanceModal"
      @recharge="goRecharge"
    />

    <!-- Task Limit Exceeded Modal -->
    <TaskLimitExceededModal
      :visible="showTaskLimitExceededModal"
      @close="showTaskLimitExceededModal = false"
    />

    <!-- Unreferenced Files Modal -->
    <UnreferencedFilesModal
      v-if="showUnreferencedFilesModal"
      :labels="unreferencedFileLabels"
      @skip="handleUnreferencedSkip"
      @goBack="handleUnreferencedGoBack"
    />


    <MakeSequelSubscribeModal
      :visible="showMakeSequelSubscribeModal"
      @go-subscribe="goMakeSequelSubscribe"
      @close="showMakeSequelSubscribeModal = false"
    />

    <!-- 预览弹窗：组件自带一份，详情页里也能用 -->
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
</template>

<script setup lang="ts">
import RatioIcon from '@/components/RatioIcon.vue';
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast, limitToast } from '@/util/toast';
import { v4 as uuidv4 } from 'uuid';
import MakeSequelSubscribeModal from '@/components/MakeSequelSubscribeModal.vue';
import UnlimitedModeModal from '@/components/UnlimitedModeModal.vue';
import UnderageNoBirthdayModal from '@/components/UnderageNoBirthdayModal.vue';
import CharacterSelectModal from '@/components/CharacterSelectModal.vue';
import UploadMask from '@/components/UploadMask.vue';
import ModeSwitchFileWarningModal from '@/components/ModeSwitchFileWarningModal.vue';
// import EventModal from '@/components/EventModal.vue';
import TaskLimitExceededModal from '@/components/TaskLimitExceededModal.vue';
import InsufficientBalanceModal from '@/components/InsufficientBalanceModal.vue';
import UnreferencedFilesModal from '@/components/UnreferencedFilesModal.vue';
import router from '@/router';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import { trackClickContentCover, trackClickPromptBox, trackContentPublished, trackClickGenerateButton } from '@/utils/analytics';
import { aiUrl, baseUrl } from '@/util/config';
import { formatDuration, formatUpdateTime, initLanguage, processImageUrl } from '@/util/utils';

import defaultAvatar from "@/assets/images/base/avatar.png";
import defaultCover from "@/assets/images/base/cover.png";
import audioIcon from "@/assets/images/home/audio.png";
import optimizePromptOn from "@/assets/images/project/opne.png";
import optimizePromptOff from "@/assets/images/project/close.png";
import {
  MB, VIDEO_PROFILES, profileOf, videoVersionsFor, pickVideoVersion,
  videoLimitModeOf, toModelType, fromModelType, DEFAULT_VIDEO_PROFILE, DEFAULT_VIDEO_VERSION,
  clampPromptHtml,
} from '@/util/videoProfile';

import { ensureRegion, userRegion } from '@/util/region';

// ---------------------------------------------------------------------------
// 输入框组件：原来整块长在 Home.vue 里，首页和详情页现在共用这一份。
// placement = 'home'   跟着 hero 滚出视口才吸底（首页原有行为）
// placement = 'bottom' 常驻页面底部（详情页 / 搜索页 / 个人主页 / 合集详情）
// 做同款、做续集、图片做视频由外部页面调用 expose 出去的 applyMake* 直接回填，
// 不再经由 localStorage + 跳首页。
// ---------------------------------------------------------------------------
const props = withDefaults(defineProps<{
  /**
   * home   跟着 hero 滚出视口才吸底（首页）
   * bottom 固定在视口底部（搜索页 / 个人主页 / 小说详情 / 合集详情）
   * panel  排在宿主容器底部、参与布局，把上面的内容顶上去（详情页的图片 / 视频 / 漫剧）
   */
  placement?: 'home' | 'bottom' | 'panel';
  userInfo?: any;
  balanceInfo?: any;
  /** 是否消费 localStorage / URL 上的做同款来源（只有首页需要） */
  consumeMakeSource?: boolean;
  /** 右上角要不要显示关闭按钮（只有作品详情页 Detail.vue 需要） */
  closable?: boolean;
}>(), {
  placement: 'home',
  userInfo: null,
  balanceInfo: null,
  consumeMakeSource: undefined,
  closable: false,
});

const emit = defineEmits<{
  /** 内容类型变化，宿主页面自行决定要不要改 SEO */
  (e: 'seo', type?: string): void;
  /** 输入框被点亮（首页拿它触发 hero 拟声词炸开） */
  (e: 'input-active'): void;
  /** 做同款 / 做续集的来源已经回填完 */
  (e: 'make-source-applied'): void;
  /** 输入框亮出来了，宿主页面据此调整自己的布局 */
  (e: 'active-change', active: boolean): void;
  /** 输入框当前高度（收起 / 展开不一样），宿主页面拿去避让 */
  (e: 'height-change', height: number): void;
  /** 正在请求做同款 / 做续集的来源数据，宿主页面可以据此显示 loading */
  (e: 'loading-change', loading: boolean): void;
}>();

const isPanelPlacement = computed(() => props.placement === 'panel');
const isBottomPlacement = computed(() => props.placement !== 'home');
// 常驻底部的用法先藏着，点了做同款 / 做续集才出现；首页一直在
const bottomActive = ref(false);
// 回填数据还在请求中。这时组件要先挂上（回填要往 contenteditable 里写内容，
// DOM 不在就写不进去），但整块挪到屏幕外，接口回来才露出。
const composerLoading = ref(false);
const isVisible = computed(
  () => !isBottomPlacement.value || bottomActive.value || composerLoading.value,
);
const shouldConsumeMakeSource = computed(
  () => props.consumeMakeSource ?? props.placement === 'home',
);

// 宿主页面注入的用户信息与余额（原来是 Home 自己从 Header 事件里收的）。
// 生成前组件会自己再拉一次余额，所以这里是可写的 ref，跟着 props 同步。
const userInfo = ref<any>(props.userInfo);
const balanceInfo = ref<any>(props.balanceInfo);
watch(() => props.userInfo, (v) => { userInfo.value = v; });
watch(() => props.balanceInfo, (v) => { balanceInfo.value = v; });

// 当前选中的风格名
const currentStyleName = ref('');

// SEO 交回宿主页面：详情页不该被输入框改标题
function setSeoMeta(type?: string) { emit('seo', type); }
// hero 拟声词是首页的东西，这里只发个信号
function popHeroParts() { emit('input-active'); }

const uid = localStorage.getItem('uid');
const route = useRoute();
const contentSwitch = useContentSwitchStore();

// 地区走共享模块，首页与详情页只会请求一次；内容开关走 contentSwitch store
function getCountry(): Promise<void> {
  return ensureRegion();
}

// 是否未成年：以详情接口 is_adult 字段为准（is_adult == 1 为已满18岁）
const isTeenager = computed(() => !userInfo.value || userInfo.value.is_adult != 1);

// 预览弹窗（组件自带一份，详情页里也要能用）
const showVideoModal = ref(false);
const playingVideoUrl = ref('');
const closeVideoModal = () => { showVideoModal.value = false; playingVideoUrl.value = ''; };
const showAudioModal = ref(false);
const playingAudioUrl = ref('');
const closeAudioModal = () => { showAudioModal.value = false; playingAudioUrl.value = ''; };
const showImageZoomModal = ref(false);
const zoomedImageUrl = ref('');
const closeImageZoomModal = () => { showImageZoomModal.value = false; zoomedImageUrl.value = ''; };

const { t, locale } = useI18n();

// State
const currentNovelMode = ref('normal');

// Loading states for generate buttons
const isGeneratingVideo = ref(false);
const isGeneratingComic = ref(false);
const isGeneratingDrama = ref(false);
const isGeneratingPhoto = ref(false);
const isGeneratingNovel = ref(false);

// Helper functions to get current state based on contentType
const getSelectedCharacters = () => {
  switch (contentType.value) {
    case 'video': return selectedCharactersVideo;
    case 'comic': return selectedCharactersComic;
    case 'drama': return selectedCharactersDrama;
    default: return selectedCharactersVideo;
  }
};
const getUploadedImages = () => {
  switch (contentType.value) {
    case 'video': return uploadedImagesVideo;
    case 'comic': return uploadedImagesComic;
    case 'drama': return uploadedImagesDrama;
    case 'photo': return uploadedImagesPhoto;
    default: return uploadedImagesVideo;
  }
};
const getCombinedItems = () => {
  switch (contentType.value) {
    case 'video': return combinedItemsVideo;
    case 'comic': return combinedItemsComic;
    case 'drama': return combinedItemsDrama;
    case 'photo': return combinedItemsPhoto;
    default: return combinedItemsVideo;
  }
};
const getIsInputEmpty = () => {
  switch (contentType.value) {
    case 'video': return isInputEmptyVideo;
    case 'comic': return isInputEmptyComic;
    case 'drama': return isInputEmptyDrama;
    case 'photo': return isInputEmptyPhoto;
    default: return isInputEmptyVideo;
  }
};
const getCurrentVideoMode = () => {
  switch (contentType.value) {
    case 'video': return currentVideoMode;
    case 'comic': return currentComicMode;
    case 'drama': return currentDramaMode;
    case 'photo': return currentPhotoMode;
    default: return currentVideoMode;
  }
};
const getCurrentPlaceholder = () => {
  if (isMakeVideoMode.value) {
    return t('home.input.placeholderMakeVideo');
  }
  // 拍续集放在拍同款前面：两个入口的标记可能同时为真（同一次会话里先拍同款再拍续集），
  // 这时要显示的是当前这次操作的文案。两个入口的文案必须区分开，别共用一条。
  if (isMakeVideoSequelMode.value) {
    return t('home.input.placeholderMakeSequel');
  }
  if (isMakeVideoSimilarMode.value) {
    return t('home.input.placeholderMakeSimilarVideo');
  }
  switch (contentType.value) {
    case 'video': return t('home.input.placeholderVideo');
    case 'comic': return t('home.input.placeholderComic');
    case 'drama': return t('home.input.placeholderDrama');
    case 'photo': return t('home.input.placeholderPhoto');
    case 'novel': return t('home.input.placeholderNovel');
    default: return t('home.input.placeholder');
  }
};

// State for video tab
const selectedCharactersVideo = ref<any[]>([]);
const uploadedImagesVideo = ref<any[]>([]);
const uploadedVideosVideo = ref<any[]>([]);
const uploadedAudiosVideo = ref<any[]>([]);
const combinedItemsVideo = ref<any[]>([]);
const isInputEmptyVideo = ref(true);

const playUploadedVideo = (item: any) => {
  if (item.type === 'video' && (item.url || item.videoUrl || item.image)) {
    playingVideoUrl.value = item.url || item.videoUrl || item.image;
    showVideoModal.value = true;
  } else if (item.url) {
    playingVideoUrl.value = item.url;
    showVideoModal.value = true;
  }
};


const playAudio = (item: any) => {
  if (item.image || item.url) {
    playingAudioUrl.value = item.image || item.url;
    showAudioModal.value = true;
  }
};


const openImageViewer = (imageUrl: string) => {
  zoomedImageUrl.value = imageUrl;
  showImageZoomModal.value = true;
};


// State for comic tab
const selectedCharactersComic = ref<any[]>([]);
const uploadedImagesComic = ref<any[]>([]);
const combinedItemsComic = ref<any[]>([]);
const isInputEmptyComic = ref(true);
const inputContentVideo = ref('');
const inputContentComic = ref('');
const inputHtmlVideo = ref('');
const inputHtmlComic = ref('');

// State for drama tab
const selectedCharactersDrama = ref<any[]>([]);
const uploadedImagesDrama = ref<any[]>([]);
const combinedItemsDrama = ref<any[]>([]);
const isInputEmptyDrama = ref(true);
const inputContentDrama = ref('');
const inputHtmlDrama = ref('');

// State for photo tab
const uploadedImagesPhoto = ref<any[]>([]);
const combinedItemsPhoto = ref<any[]>([]);
const isInputEmptyPhoto = ref(true);
const inputContentPhoto = ref('');
const inputHtmlPhoto = ref('');

// Mode states - separate for video, comic, drama and photo
const currentVideoMode = ref('normal');
const overrideNormalVideoMode = ref(false);
const effectiveVideoMode = computed(() => {
  if (overrideNormalVideoMode.value) return 'normal';
  return contentSwitch.mode === 2 ? 'unlimited' : currentVideoMode.value;
});
const selectedNsfwVersion = ref<string>(DEFAULT_VIDEO_VERSION);

// 视频版本三档：极速版 fast(minimax h3 max) / 加强版 enhanced(wan3.0) / 超级版 super(seedance2.5)。
// 可选范围按「普通 or NSFW 模式 × 视频模式」决定；默认极速，取不到就按 fast → enhanced → super 往后落。
const videoLimitMode = computed(() => videoLimitModeOf(selectedNsfwVersion.value, effectiveVideoMode.value));

const videoProfile = computed(() => profileOf(videoLimitMode.value));


// 计价用的画质档。极速版是 480P / 768P，余额接口还没有对应的每秒单价字段，
// 暂时按 720P 计价 —— 否则两个分支都不命中，costPerSecond 恒为 0，算力永远显示 1。
// 等后端下发 480p / 768p 单价后，把这里换成真实字段即可。
const pricingQuality = computed(() => (selectedVideoQuality.value === '1080P' ? '1080P' : '720P'));

const refVideoMaxSeconds = computed(() => videoProfile.value.refVideoMaxSeconds);
const clampRefVideoDuration = (d: number) => Math.min(d, refVideoMaxSeconds.value);
const showNsfwVersionDropdown = ref(false);
const currentComicMode = ref('normal');
const currentDramaMode = ref('normal');
const currentPhotoMode = ref('normal');
const enablePhotoOptimizePrompt = ref(false);
const enableVideoOptimizePrompt = ref(false);

// ---------------------------------------------------------------------------
// 草稿缓存：小说 / 漫画 / 漫剧 tab 来回切时保留已填内容
// 只在停留在首页期间有效：tab 来回切、切 NSFW 模式都保留已填的内容。
// 刷新、关闭页面、跳去别的页面都不保留 —— 组件卸载，这些 ref 跟着一起没。
// 图片和视频 tab 输入结构更复杂，暂不接入。
// ---------------------------------------------------------------------------
type DraftTab = 'novel' | 'comic' | 'drama' | 'photo' | 'video';
const DRAFT_TABS: DraftTab[] = ['novel', 'comic', 'drama', 'photo', 'video'];

function isDraftTab(type: string): type is DraftTab {
  return (DRAFT_TABS as string[]).includes(type);
}

function syncEditableInputToDraft(type: string) {
  // 视频走按模式分桶的暂存，DOM 读取与守卫都在 stashVideoDraft 里处理
  if (type === 'video') {
    const mode = currentVideoMode2();
    lastVideoMode.value = mode;
    stashVideoDraft(mode);
    return;
  }
  if (type !== 'comic' && type !== 'drama' && type !== 'photo') return;
  const el = editableInputRef.value;
  if (!el) return;
  if (el.dataset.tab !== type) return;
  if (type === 'comic') {
    inputHtmlComic.value = el.innerHTML;
    inputContentComic.value = el.textContent || '';
  } else if (type === 'drama') {
    inputHtmlDrama.value = el.innerHTML;
    inputContentDrama.value = el.textContent || '';
  } else {
    inputHtmlPhoto.value = el.innerHTML;
    inputContentPhoto.value = el.textContent || '';
  }
}

function restoreEditableInput(type: string) {
  const expectedHtml = () => {
    if (type === 'comic') return inputHtmlComic.value || '';
    if (type === 'drama') return inputHtmlDrama.value || '';
    if (type === 'photo') return inputHtmlPhoto.value || '';
    return '';
  };

  const write = () => {
    // 视频 tab 的回填由输入框自己的 @vue:mounted 钩子负责，这里不重复写。
    // 切模式会重建元素、必然触发挂载；不重建则内容本来就在，无需回填。
    if (type === 'video') return;

    const el = resolveInputEl(type);
    if (!el) return;

    const want = expectedHtml();
    if (el.innerHTML === want) return;   // 已经对了就别动，避免打断光标
    el.innerHTML = want;

    previousInputHtml.value = el.innerHTML;
    isInputEmpty.value = (el.textContent || '').trim() === '';
    syncStickyInputPreview();
  };

  // 切 v-if 分支时新输入框可能还没挂上，挂上之后也可能被后续一轮渲染清掉。
  // 连着比对三帧，内容和 ref 不一致就补写；一致则直接返回，不会打断用户输入。
  nextTick(() => {
    write();
    requestAnimationFrame(() => {
      write();
      requestAnimationFrame(write);
    });
  });
}

function clearDraftFor(type: DraftTab) {
  if (type === 'video') {
    // 只清当前模式那一桶，其他模式用户可能还留着内容
    videoDrafts.value[currentVideoMode2()] = emptyVideoModeDraft();
    resetVideoInputs();
    framesInput.value = '';
    return;
  }
  if (type === 'novel') {
    novelInput.value = '';
  } else if (type === 'photo') {
    uploadedImagesPhoto.value = [];
    combinedItemsPhoto.value = [];
    inputContentPhoto.value = '';
    inputHtmlPhoto.value = '';
    isInputEmptyPhoto.value = true;
  } else if (type === 'comic') {
    selectedCharactersComic.value = [];
    uploadedImagesComic.value = [];
    combinedItemsComic.value = [];
    inputContentComic.value = '';
    inputHtmlComic.value = '';
    isInputEmptyComic.value = true;
  } else {
    selectedCharactersDrama.value = [];
    uploadedImagesDrama.value = [];
    combinedItemsDrama.value = [];
    inputContentDrama.value = '';
    inputHtmlDrama.value = '';
    isInputEmptyDrama.value = true;
  }
}

function closeComicInputDropdowns() {
  showAtDropdown.value = false;
  atDropdownItems.value = [];
  runTypewriter();
}

function closeDramaInputDropdowns() {
  showAtDropdown.value = false;
  atDropdownItems.value = [];
  runTypewriter();
}

function closeNovelInputDropdowns() {
  showModeDropdown.value = false;
  showWordCountDropdown.value = false;
  showInsertImageDropdown.value = false;
  runTypewriter();
}

// Photo settings
const showPhotoSettings = ref(false);
const selectedPhotoQuality = ref('1K');
const selectedPhotoRatio = ref('16:9');
const photoQualityOptions = computed(() => {
  const optionsByMode = {
    normal: [{ value: '1K', label: '1K' }, { value: '2K', label: '2K' }],
    unlimited: [{ value: '1K', label: '1K' }, { value: '2K', label: '2K' }],
  };
  return optionsByMode[currentPhotoMode.value === 'unlimited' ? 'unlimited' : 'normal'];
});
const photoRatioOptions = computed(() => {
  const optionsByMode = {
    normal: [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }],
    unlimited: [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }],
  };
  return optionsByMode[currentPhotoMode.value === 'unlimited' ? 'unlimited' : 'normal'];
});

// Video settings
const showVideoMultimodalDropdown = ref(false);
const selectedVideoMultimodal = ref('multimodal');

// 当前「模式 × 视频模式」下可选的版本。只有一个可选时不展示下拉。
const availableVideoVersions = computed(() =>
  videoVersionsFor(effectiveVideoMode.value, selectedVideoMultimodal.value)
);
const nsfwVersionOptions = computed(() =>
  availableVideoVersions.value.map((v) => ({ value: v, label: t(`home.nsfwVersion.${v}`) }))
);
const videoMultimodalOptions = computed(() => {
  const options = [
    { value: 'multimodal', label: t('home.videoMode.multimodal') },
    { value: 'startEndFrames', label: t('home.videoMode.startEndFrames') },
    { value: 'videoModify', label: t('home.videoMode.videoModify') },
    { value: 'videoExtend', label: t('home.videoMode.videoExtend') }
  ];
  return options;
});

// Video mode state
const startFrameImage = ref<string | null>(null);
const endFrameImage = ref<string | null>(null);
const uploadedVideo = ref<string | null>(null);
const uploadedVideoCover = ref<string | null>(null);
const uploadedVideoDuration = ref<number>(0);
const startFrameInput = ref<HTMLInputElement | null>(null);
const endFrameInput = ref<HTMLInputElement | null>(null);
const videoInput = ref<HTMLInputElement | null>(null);



// Reset video inputs when switching mode
function resetVideoInputs() {
  startFrameImage.value = null;
  endFrameImage.value = null;
  uploadedVideo.value = null;
  uploadedVideoCover.value = null;
  uploadedVideoDuration.value = 0;
  combinedItemsVideo.value = [];
  novelInput.value = '';
  selectedCharactersVideo.value = [];
  uploadedImagesVideo.value = [];
  inputContentVideo.value = '';
  inputHtmlVideo.value = '';
  isMakeVideoMode.value = false;
  // 时长回当前档位的默认值，别写死 30s —— 极速版最长 15s
  selectedVideoDuration.value = videoProfile.value.defaultDuration;
  lastValidVideoDuration.value = videoProfile.value.defaultDuration;
  inputKey.value++;
  nextTick(() => {
    if (editableInputRef.value) {
      editableInputRef.value.innerHTML = '';
    }
    isInputEmpty.value = true;
    runTypewriter();
  });
}

// 切换 NSFW 版本。两个版本的参考文件限制不一样（加强版更严：图片 20MB/10 张、
// 视频 100MB、单个参考视频 15s、多模态总时长 15s；超级版按普通模式走），
// 已经填的内容换个版本很可能就超标了，所以切换时直接清空重来。
function selectNsfwVersion(version: string) {
  showNsfwVersionDropdown.value = false;
  if (selectedNsfwVersion.value === version) return;

  // 加强版限制更严（图片 20MB/10 张、参考视频 15s、总时长 15s），超级版按普通模式走。
  // 档位变了参考文件大概率超标：先问一句，确认后丢掉超标文件；提示词始终保留。
  const prevLimitMode = videoLimitMode.value;
  const nextLimitMode = version === 'fast'
    ? 'fast'
    : (effectiveVideoMode.value === 'unlimited' && version === 'enhanced' ? 'unlimited' : 'normal');
  requestVideoLimitModeChange(nextLimitMode, () => {
    stashCurrentVideoPrompt();
    selectedNsfwVersion.value = version;
    applyVideoLimitModeChange(prevLimitMode);
    restoreEditableInput('video');
  });
}

// Start/End Frames upload handlers
function triggerStartFrameUpload() {
  if (!checkLogin()) return;
  startFrameInput.value?.click();
}

function triggerEndFrameUpload() {
  if (!checkLogin()) return;
  endFrameInput.value?.click();
}

function handleFramesTextareaClick() {
  if (isStickyCollapsed.value) {
    expandStickyInput();
    return;
  }
  trackClickPromptBox();
  checkLogin();
}

function handleNovelTextareaFocus() {
  if (isStickyCollapsed.value) {
    expandStickyInput();
    return;
  }
  isInputFocused.value = true;
  popHeroParts();
}

function handleNovelTextareaClick() {
  if (isStickyCollapsed.value) {
    expandStickyInput();
    return;
  }
  trackClickPromptBox();
  checkLogin();
}

async function handleStartFrameChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast(t('home.error.invalidPhotoFormat'));
      target.value = '';
      return;
    }
    const maxFileSizeBytes = videoProfile.value.imageMaxSize;
    const maxFileSizeMB = Math.round(maxFileSizeBytes / MB);
    if (file.size > maxFileSizeBytes) {
      toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
      target.value = '';
      return;
    }
    const isCorrupted = await isImageCorrupted(file);
    if (isCorrupted) {
      toast(t('home.error.corruptedImage'));
      target.value = '';
      return;
    }
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, currentVideoMode.value);
      if (uploadedUrl) {
        startFrameImage.value = uploadedUrl;
      }
    } catch (error) {
      console.error('Failed to upload start frame:', error);
      toast((error as Error).message);
    } finally {
      isUploading.value = false;
    }
  }
}

async function handleEndFrameChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast(t('home.error.invalidPhotoFormat'));
      target.value = '';
      return;
    }
    const maxFileSizeBytes = videoProfile.value.imageMaxSize;
    const maxFileSizeMB = Math.round(maxFileSizeBytes / MB);
    if (file.size > maxFileSizeBytes) {
      toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
      target.value = '';
      return;
    }
    const isCorrupted = await isImageCorrupted(file);
    if (isCorrupted) {
      toast(t('home.error.corruptedImage'));
      target.value = '';
      return;
    }
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, currentVideoMode.value);
      if (uploadedUrl) {
        endFrameImage.value = uploadedUrl;
      }
    } catch (error) {
      console.error('Failed to upload end frame:', error);
      toast((error as Error).message);
    } finally {
      isUploading.value = false;
    }
  }
}

function removeStartFrame() {
  startFrameImage.value = null;
}

function removeEndFrame() {
  endFrameImage.value = null;
}

function swapFrames() {
  const temp = startFrameImage.value;
  startFrameImage.value = endFrameImage.value;
  endFrameImage.value = temp;
}

// Video Extend upload handlers
const videoDimensionError = async (file: File): Promise<string> => {
  return new Promise<string>((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) { resolve(''); return; }
      const ratio = width / height;
      // 极速版 [0.4,2.5] / [256,5760]，加强版 1:8~8:1 / [240,4096]，超级版与普通 [0.4,2.5] / [300,6000]
      const pf = videoProfile.value;
      if (ratio < pf.ratioMin || ratio > pf.ratioMax) {
        resolve(t('home.error.videoRatioLimit')); return;
      }
      if (width < pf.dimMin || width > pf.dimMax || height < pf.dimMin || height > pf.dimMax) {
        resolve(t('home.error.videoDimensionLimit')); return;
      }
      // 超级版还卡宽 × 高：[614×664, 3326×2494]。areaMax 为 0 的档位不校验。
      if (pf.areaMax > 0 && (width * height < pf.areaMin || width * height > pf.areaMax)) {
        resolve(t('home.error.videoAreaLimit')); return;
      }
      resolve('');
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    video.src = url;
  });
};

const validateVideoDimensions = async (file: File): Promise<boolean> => {
  const err = await videoDimensionError(file);
  if (err) toast(err);
  return !err;
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

function triggerVideoUpload() {
  videoInput.value?.click();
}

async function handleVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const videoExtensions = ['.mp4', '.mov'];
    const videoExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!videoExtensions.includes(videoExtension)) {
      toast(t('home.error.invalidVideoFormat'));
      target.value = '';
      return;
    }
    const maxVideoSizeBytes = videoProfile.value.videoMaxSize;
    const maxVideoSizeMB = Math.round(maxVideoSizeBytes / MB);
    if (file.size > maxVideoSizeBytes) {
      toast(t('home.error.maxVideoSize', { max: maxVideoSizeMB }));
      target.value = '';
      return;
    }
    const duration = await getVideoDuration(file);

    const validDimensions = await validateVideoDimensions(file);
    if (!validDimensions) {
      target.value = '';
      return;
    }

    // 本次上传允许的时长上限。修改 / 续写按档位取；
    // 多模态还要再扣掉已有参考视频占掉的时长，所以在下面的分支里改写。
    let uploadMaxSeconds = refVideoMaxSeconds.value;

    if (selectedVideoMultimodal.value === 'videoModify') {
      // 视频修改：普通模式和超级版 4s 起，加强版 1s 起；
      // 上限放宽到「上限 + 1 秒」以内，超过上限的上传后由后端裁到上限
      const modifyMinSeconds = videoProfile.value.modifyMinSeconds;
      if (duration < modifyMinSeconds || duration >= refVideoMaxSeconds.value + 1) {
        toast(t('home.error.videoUploadedDuration', { min: modifyMinSeconds, max: refVideoMaxSeconds.value }));
        target.value = '';
        return;
      }
    } else if (selectedVideoMultimodal.value === 'videoExtend') {
      // 视频续写：普通模式和超级版 2s 起，加强版 1s 起；
      // 上限放宽到「上限 + 1 秒」以内，超过上限的上传后由后端裁到上限
      const extendMinSeconds = videoProfile.value.extendMinSeconds;
      if (duration < extendMinSeconds || duration >= refVideoMaxSeconds.value + 1) {
        toast(t('home.error.videoUploadedDuration', { min: extendMinSeconds, max: refVideoMaxSeconds.value }));
        target.value = '';
        return;
      }
    } else if (selectedVideoMultimodal.value === 'multimodal') {
      // 多模态参考：普通模式 2-30s，无限制模式 1-15s
      const minDuration = videoProfile.value.refVideoMinSeconds;
      const maxDuration = videoProfile.value.refVideoMaxSeconds;
      if (duration < minDuration) {
        toast(t('home.error.videoDurationTooShort', { min: minDuration }));
        target.value = '';
        return;
      }
      // 放宽到「上限 + 1 秒」以内，超过上限的上传后由后端裁到上限
      if (duration >= maxDuration + 1) {
        toast(t('home.error.videoDurationTooLong', { max: maxDuration }));
        target.value = '';
        return;
      }
      uploadMaxSeconds = maxDuration;
    }

    isUploading.value = true;
    try {
      let coverUrl = '';
      // Capture and upload video cover first
      try {
        const frameDataUrl = await captureVideoFirstFrame(file);
        const coverFile = dataURLToFile(frameDataUrl, `${file.name}_cover.jpg`);
        coverUrl = await uploadImage(coverFile, currentVideoMode.value);
        uploadedVideoCover.value = coverUrl;
      } catch (error) {
        console.error('Failed to capture video cover:', error);
        uploadedVideoCover.value = null;
      }

      // Upload the video
      let uploadedUrl = await uploadVideo(file);
      let refDuration = duration;

      // 视频修改 / 续写放宽到 31s 以内，但模型只接受 30s：
      // 超过 30s 的先让后端裁到 30s，拿到裁好的地址再回显到参考视频位置。
      const needsTrim =
        !!uploadedUrl &&
        duration > uploadMaxSeconds &&
        (selectedVideoMultimodal.value === 'videoModify'
          || selectedVideoMultimodal.value === 'videoExtend'
          || selectedVideoMultimodal.value === 'multimodal');
      if (needsTrim) {
        const trimRes = await api.extractVideoTail({ video_url: uploadedUrl, tail_seconds: uploadMaxSeconds }) as any;
        if ((trimRes.code === 0 || trimRes.code === 200) && trimRes.data?.video_url) {
          uploadedUrl = trimRes.data.video_url;
          refDuration = uploadMaxSeconds;
        } else {
          uploadedVideoCover.value = null;
          toast(trimRes.message || t('fail'));
          target.value = '';
          return;
        }
      }

      if (uploadedUrl) {
        uploadedVideo.value = uploadedUrl;
        uploadedVideoDuration.value = refDuration;
        lastValidVideoDuration.value = selectedVideoDuration.value;

        if (videoLimitMode.value === 'unlimited' && selectedVideoMultimodal.value === 'multimodal') {
          const maxDuration = refDuration > 0 ? Math.floor(30 - refDuration) : 30;
          selectedVideoDuration.value = Math.max(maxDuration, 2).toString();
          lastValidVideoDuration.value = selectedVideoDuration.value;
        } else {
          const currentDuration = parseInt(selectedVideoDuration.value);
          if (currentDuration <= refDuration) {
            const minDuration = videoProfile.value.durationMin;
            const newDuration = Math.max(refDuration + 1, minDuration);
            selectedVideoDuration.value = Math.min(newDuration, videoProfile.value.durationMax).toString();
            lastValidVideoDuration.value = selectedVideoDuration.value;
          }
        }
      }
    } catch (error) {
      toast(t('fail'));
    } finally {
      isUploading.value = false;
    }
  }
}

function removeVideo() {
  uploadedVideo.value = null;
  uploadedVideoCover.value = null;
  uploadedVideoDuration.value = 0;
}

const showVideoSettings = ref(false);
// 初始值跟默认版本（极速版）走，别写死 —— 否则一进页面就是 720P / 30s，和档位对不上
const selectedVideoQuality = ref(DEFAULT_VIDEO_PROFILE.defaultQuality);
const selectedVideoRatio = ref(DEFAULT_VIDEO_PROFILE.defaultRatio);
const selectedVideoDuration = ref(DEFAULT_VIDEO_PROFILE.defaultDuration);
const lastValidVideoDuration = ref(DEFAULT_VIDEO_PROFILE.defaultDuration);
const videoQualityOptions = computed(() => videoProfile.value.qualityOptions);
const videoRatioOptions = computed(() => videoProfile.value.ratioOptions);
const videoDurationOptions = computed(() => {
  const { durationMin, durationMax } = videoProfile.value;
  const steps = [durationMin, 5, 10, 15, 20, 30]
    .filter((v, i, a) => v >= durationMin && v <= durationMax && a.indexOf(v) === i)
    .sort((a, b) => a - b);
  return steps.map((v) => ({ value: String(v), label: `${v}s` }));
});

const saveLastValidDuration = () => {
  lastValidVideoDuration.value = selectedVideoDuration.value;
};

const onVideoDurationChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  selectedVideoDuration.value = target.value;
};

const getUploadedVideoDurationSum = () => {
  const videoItems = combinedItemsVideo.value.filter((item: any) => item.type === 'video' && item.duration);
  if (videoItems.length > 0) {
    return videoItems.reduce((sum: number, item: any) => sum + item.duration, 0);
  }
  return 0;
};

const validateDurationAndRestore = () => {
  if (videoLimitMode.value === 'unlimited' && selectedVideoMultimodal.value === 'multimodal') {
    const totalVideoDuration = getUploadedVideoDurationSum();
    const newDuration = parseInt(selectedVideoDuration.value);
    const maxDuration = totalVideoDuration > 0 ? Math.floor(30 - totalVideoDuration) : 30;
    if (totalVideoDuration > 0 && newDuration > maxDuration) {
      selectedVideoDuration.value = maxDuration.toString();
      lastValidVideoDuration.value = maxDuration.toString();
      toast(t('home.error.videoDurationSumExceed'));
    } else {
      lastValidVideoDuration.value = selectedVideoDuration.value;
    }
  } else {
    lastValidVideoDuration.value = selectedVideoDuration.value;
  }
};

const sliderMarks = computed(() => {
  const { durationMin: min, durationMax: max, durationMarks } = videoProfile.value;
  return durationMarks.map(value => ({
    value,
    position: `${((value - min) / (max - min)) * 100}%`
  }));
});

const getSliderValuePosition = () => {
  const { durationMin: min, durationMax: max } = videoProfile.value;
  const value = parseInt(selectedVideoDuration.value);
  const percentage = ((value - min) / (max - min)) * 100;
  return `${Math.min(100, Math.max(0, percentage))}%`;
};

const showAtDropdown = ref(false);
const atDropdownItems = ref<any[]>([]);
const editableInputRef = ref<HTMLElement | null>(null);
const inputAreaBoxRef = ref<HTMLElement | null>(null);

const showStickyInput = ref(false);
const stickyInputExpanded = ref(false);
const stickyInputPlaceholderHeight = ref(0);
const stickyInputPreview = ref('');
let stickyExpandedAtScrollY = 0;
const isInputFocused = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isMakeSimilarLoading = ref(false);
const isMakeSameMode = ref(false);
// 做同款回填时所在的 tab。各 tab 的草稿是各自保留的，做同款的标记也只对那个 tab 生效：
// 切到别的 tab 提交是普通生成，不能把原作品的 session 带过去（后端会按做同款处理）。
const makeSameTab = ref('');
function isMakeSameOn(tab: string): boolean {
  return isMakeSameMode.value && makeSameTab.value === tab;
}
const isMakeSimilar = ref(false);
const makeSimilarSessionId = ref('');
const originSessionId = ref('');
const isMakeExtensionMode = ref(false);
const originPostId = ref('');
const originSessionIdForExtension = ref('');
const originVideoUrlForTail = ref('');
const isMakeVideoSimilarMode = ref(false);
const isMakeVideoSequelMode = ref(false);
const isMakeVideoMode = ref(false);
const makeSequelPostId = ref('');
const isMakeSequelLoading = ref(false);
const isMakeSimilarVideoLoading = ref(false);
const showMakeSequelSubscribeModal = ref(false);
const makeSequelAuthorId = ref('');
const inputKey = ref(0);
const previousInputHtml = ref('');

// Computed properties for template
const selectedCharacters = computed(() => getSelectedCharacters().value);
const uploadedImages = computed(() => getUploadedImages().value);
const combinedItems = computed(() => getCombinedItems().value);
const isInputEmpty = computed({
  get: () => getIsInputEmpty().value,
  set: (value: boolean) => {
    getIsInputEmpty().value = value;
  }
});

const currentPlaceholder = computed(() => {
  return getCurrentPlaceholder();
});

const stickyInputDisplayText = computed(() => stickyInputPreview.value || currentPlaceholder.value);
const isStickyCollapsed = computed(() => showStickyInput.value && !stickyInputExpanded.value);
const stickyInputPreviewItems = computed(() => combinedItems.value.slice(0, 4).map((item: any, index: number) => ({
  key: `${item.id || item.type}-${index}`,
  src: item.type === 'audio' ? audioIcon : item.cover || item.image || item.url || defaultCover
})));

const syncStickyInputPreview = () => {
  if (contentType.value === 'novel') {
    stickyInputPreview.value = novelInput.value.replace(/\s+/g, ' ').trim();
  } else if (editableInputRef.value) {
    stickyInputPreview.value = (editableInputRef.value.innerText || '').replace(/\s+/g, ' ').trim();
  }
};

const submitStickyInput = () => {
  switch (contentType.value) {
    case 'video': return generateVideo();
    case 'photo': return generatePhoto();
    case 'comic': return generateComic();
    case 'drama': return generateDrama();
    case 'novel': return navigateToNovelGenerate();
  }
};
const collapseStickyInput = () => {
  stickyInputExpanded.value = false;
  showAtDropdown.value = false;
  isInputFocused.value = false;
  editableInputRef.value?.blur();
  document.querySelector<HTMLTextAreaElement>('.input-area-box .novel-textarea')?.blur();
  const activeElement = document.activeElement as HTMLElement | null;
  if (activeElement && inputAreaBoxRef.value?.contains(activeElement)) {
    activeElement.blur();
  }
};

// 弹窗 / 遮罩 / 全局提示：里面的点击不算「点了别处」——选角色、二次确认这些关掉之后
// 还要回到展开态接着编辑，收起来会把刚插进去的内容藏到折叠条里。
const STICKY_KEEP_OPEN_SELECTOR =
  '[class*="modal"], [class*="overlay"], [class*="mask"], [class*="dialog"], [class*="popup"], [class*="toast"]';

// 吸底输入框展开后，点输入框以外的地方就收起来（滚动收起的逻辑在 updateStickyInputVisibility 里）。
const collapseStickyInputOnOutsideClick = (target: HTMLElement) => {
  if (!showStickyInput.value || !stickyInputExpanded.value) return;
  // 点的节点已经被自己的处理函数从 DOM 里摘掉了（删除按钮之类），这时算不出它在不在输入框里，不收
  if (!target.isConnected) return;
  const box = inputAreaBoxRef.value;
  if (!box || box.contains(target)) return;
  if (target.closest(STICKY_KEEP_OPEN_SELECTOR)) return;
  collapseStickyInput();
};

const expandStickyInput = () => {
  stickyExpandedAtScrollY = window.scrollY;
  stickyInputExpanded.value = true;
  nextTick(() => {
    if (contentType.value === 'novel') {
      document.querySelector<HTMLElement>('.input-area-box.is-expanded .novel-textarea')?.focus();
    } else {
      editableInputRef.value?.focus();
    }
  });
};

const handleStickyUserScroll = () => {
  if (showStickyInput.value && stickyInputExpanded.value) {
    collapseStickyInput();
  }
};

const blurHomeInputOnScroll = () => {
  // 做同款/做续集回填后输入框是钉在底部并主动聚焦的，
  // 这时滚动列表不该把焦点抢走（否则刚跳过来就失焦）
  if (stickyInputPinned.value) return;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    if (activeElement.matches('.input-textarea, .novel-textarea') ||
        inputAreaBoxRef.value?.contains(activeElement)) {
      activeElement.blur();
    }
  }
  isInputFocused.value = false;
};

// 做同款 / 做续集回填后，输入框强制吸底：不管页面滚到哪儿都固定在底部并保持展开，
// 直到来源被清掉（发起生成、或用户手动清空）。
// 不钉住的话，只有 hero 已经滚出视口时输入框才会吸底，在页面顶部点做同款，
// 内容会回填进 hero 里那个输入框，用户看不见。
const stickyInputPinned = ref(false);

// 钉住时的滚动位置，用来判断用户是不是主动往上滚了
let pinnedAtScrollY = 0;
const PIN_RELEASE_DISTANCE = 60;


// 回填成功的计数。各个 make* 分支只有走完整条回填才会调 pinStickyInput，
// 中途 toast 报错 / 弹订阅窗都是提前 return，靠它判断这次到底成没成。
let backfillMarker = 0;

const pinStickyInput = () => {
  backfillMarker++;
  // 从非吸底切过来要先量占位高度，否则 hero 里会塌掉一块
  if (!showStickyInput.value) {
    stickyInputPlaceholderHeight.value = inputAreaBoxRef.value?.offsetHeight || 0;
    syncStickyInputPreview();
  }
  stickyInputPinned.value = true;
  pinnedAtScrollY = window.scrollY;
  showStickyInput.value = true;
  stickyInputExpanded.value = true;
  stickyExpandedAtScrollY = window.scrollY;
};

const unpinStickyInput = () => {
  if (!stickyInputPinned.value) return;
  stickyInputPinned.value = false;
  updateStickyInputVisibility();
};

const updateStickyInputVisibility = () => {
  // 常驻底部的用法没有 hero 可参照，一直吸底；
  // 但滚动时跟首页一样把展开的输入框收成一条，别挡着列表看内容
  if (isBottomPlacement.value) {
    showStickyInput.value = true;
    if (stickyInputExpanded.value && Math.abs(window.scrollY - stickyExpandedAtScrollY) > 4) {
      collapseStickyInput();
    }
    return;
  }
  const hero = document.querySelector('.hero-section') as HTMLElement | null;
  if (!hero) return;
  const outOfView = hero.getBoundingClientRect().bottom <= 0;
  // 钉住期间保持吸底。只有用户主动往上滚（离开落地位置一定距离）才交还给正常逻辑——
  // 不能用「hero 是否可见」判断：落地滚动常停在 hero 还露一点的位置，
  // 那样刚钉上就被自己解开，输入框又跳回 hero 里。
  if (stickyInputPinned.value) {
    if (window.scrollY >= pinnedAtScrollY - PIN_RELEASE_DISTANCE) {
      showStickyInput.value = true;
      return;
    }
    stickyInputPinned.value = false;
  }
  if (!outOfView) {
    showStickyInput.value = false;
    stickyInputExpanded.value = false;
    return;
  }
  if (!showStickyInput.value) {
    syncStickyInputPreview();
    stickyInputPlaceholderHeight.value = inputAreaBoxRef.value?.offsetHeight || 0;
  }
  showStickyInput.value = true;
  if (stickyInputExpanded.value && Math.abs(window.scrollY - stickyExpandedAtScrollY) > 4) {
    collapseStickyInput();
  }
};

// 做同款 / 做续集 / 图片做视频 这些入口是带着来源内容进来的，
// 占位文字停在完整文案上，不再跑打字机 —— 回填后旁边还在一个字一个字地打很干扰。
// 走 make 标志位而不是新加开关：clearVideoMakeFlags() 在切模式 / 切档位时会清掉它们，
// 打字机自然恢复，不用再单独维护一份重置逻辑。
// 各 tab 的来源标记只在自己的 tab 下算数：视频那几个只看视频 tab，做同款看它回填时的 tab。
const isMakeSourceActive = computed(() =>
  (contentType.value === 'video' && (isMakeVideoSimilarMode.value || isMakeVideoSequelMode.value || isMakeVideoMode.value))
  || isMakeSameOn(contentType.value)
);

// 带来源进来（做同款 / 做续集 / 图片做视频）时要不要把输入框简化（藏类型 tab、模式下拉、自动项）。
// 详情页 / 搜索页 / 个人主页这些底部吸附的用法一律简化；
// 首页只在吸底（滚出 hero）时简化，滚回 hero 区域还是完整的输入框。
const simplifyForMakeSource = computed(() =>
  isMakeSourceActive.value && (isBottomPlacement.value || showStickyInput.value)
);
// 视频 tab 的三个带来源入口（拍同款 / 做续集 / 图片做视频）：模式由来源决定，模式下拉不显示
const isVideoMakeSource = computed(() =>
  simplifyForMakeSource.value
  && (isMakeVideoSimilarMode.value || isMakeVideoSequelMode.value || isMakeVideoMode.value)
);
// 拍同款（视频修改）/ 做续集（视频续写）：比例和时长都跟原视频走，是「自动」，
// 设置条上这两段和下拉里对应的两个 section 都不显示，只留画质。
// 图片做视频走的是多模态，比例 / 时长是真的可选，照常显示。
const hideVideoAutoSettings = computed(() =>
  simplifyForMakeSource.value && (isMakeVideoSimilarMode.value || isMakeVideoSequelMode.value)
);



const typedPlaceholder = ref('');
let typeTimer: ReturnType<typeof setTimeout> | undefined;
const runTypewriter = () => {
  if (typeTimer) clearTimeout(typeTimer);
  const full = currentPlaceholder.value || '';
  if (isInputFocused.value || !isInputEmpty.value || isMakeSourceActive.value) {
    typedPlaceholder.value = full;
    return;
  }
  let i = 0;
  let phase: 'typing' | 'holding' | 'deleting' = 'typing';
  const TYPE_MS = 55;
  const DELETE_MS = 30;
  const HOLD_FULL_MS = 1600;
  const HOLD_EMPTY_MS = 500;
  const step = () => {
    if (isInputFocused.value || !isInputEmpty.value || isMakeSourceActive.value) { typedPlaceholder.value = full; return; }
    const cur = currentPlaceholder.value || '';
    if (cur !== full) { runTypewriter(); return; }

    if (phase === 'typing') {
      typedPlaceholder.value = full.slice(0, i);
      if (i >= full.length) { phase = 'holding'; typeTimer = setTimeout(() => { phase = 'deleting'; step(); }, HOLD_FULL_MS); return; }
      i += 1;
      typeTimer = setTimeout(step, TYPE_MS);
    } else if (phase === 'deleting') {
      typedPlaceholder.value = full.slice(0, i);
      if (i <= 0) { phase = 'typing'; typeTimer = setTimeout(step, HOLD_EMPTY_MS); return; }
      i -= 1;
      typeTimer = setTimeout(step, DELETE_MS);
    }
  };
  typedPlaceholder.value = '';
  step();
};
// 占位文字打字机的 watch 在 onMounted 里注册（此处 contentType 等尚未声明，
// 直接 watch computed 会在 setup 阶段立即求值触发 TDZ 错误）

// Content type
const contentType = ref('video'); // video, comic, novel, photo
const showHelpDropdown = ref(false); // Control help dropdown visibility
// 「R18」前缀只在强制展示 NSFW 时挂（中国地区已在 store 里降级，标题不带前缀）。
// 改成 computed：contentSwitch 是异步加载的，用 ref 会固化成首屏那一刻的值。
const adultPrefix = computed(() => (contentSwitch.showAdultLabel ? 'R18 ' : ''));
const contentTypeOptions = computed(() => [
  { value: 'video', label: adultPrefix.value + t('home.contentType.video') },
  { value: 'photo', label: adultPrefix.value + t('home.contentType.photo') },
  { value: 'comic', label: adultPrefix.value + t('home.contentType.comic') },
  { value: 'novel', label: adultPrefix.value + t('home.contentType.novel') },
]);

// Word count and language settings
const selectedWordCount = ref('30K');
const showWordCountDropdown = ref(false);
const wordCountOptions = ref([
  { value: '30K', label: '30K', jpLabel: '30,000字' },
  { value: '100K', label: '100K', jpLabel: '100,000字' },
  { value: '300K', label: '300K', jpLabel: '300,000字' },
]);

const displayWordCount = computed(() => {
  const option = wordCountOptions.value.find(opt => opt.value === selectedWordCount.value);
  if (locale.value === 'jp' && option?.jpLabel) {
    return option.jpLabel;
  }
  return selectedWordCount.value;
});

const selectedLanguage = ref('');
const showLanguageDropdown = ref(false);
const languageOptions = computed(() => [
  { value: 'jp', label: t('novel.language.jp') },
  { value: 'en', label: t('novel.language.en') },
  { value: 'tc', label: t('novel.language.tc') },
  { value: 'cn', label: t('novel.language.zh') }
]);

const selectedLanguageText = computed(() => {
  const lang = languageOptions.value.find(l => l.value === selectedLanguage.value);
  return lang ? lang.label : '';
});

// Insert image (illustration) settings
const selectedInsertImage = ref(4);
const showInsertImageDropdown = ref(false);
const insertImageOptions = computed(() => [
  { value: 0, label: t('home.insertImageNone') },
  { value: 4, label: t('home.insertImage4') },
]);

const showNovelInsertImageSelector = computed(() => currentNovelMode.value === 'unlimited' || contentSwitch.mode === 2);

const selectedInsertImageText = computed(() => {
  const option = insertImageOptions.value.find(o => o.value === selectedInsertImage.value);
  return option ? option.label : '';
});

// Mode dropdown for novel mode
const showModeDropdown = ref(false);
const novelInput = ref('');
// 首尾帧模式的提示词。原来和小说 tab 共用 novelInput，两边会互相串，拆开独立持有。
const framesInput = ref('');

// ---------------------------------------------------------------------------
// 视频 tab 的草稿与切换迁移
//
// 视频比其他 tab 复杂在三点：4 个模式各有独立的 DOM 分支、参考文件分四类
// （角色/图片/视频/音频）外加首尾帧与原视频、生成时长的可选范围随限制档位变化。
// 所以不能沿用其他 tab 那套「一个 tab 一份草稿」，改成按模式分桶 + 统一迁移入口。
//
// videoLimitMode 是这里的核心判据（已有 computed）：
//   加强版             -> 'unlimited'  图片 20MB/10 张、视频 100MB、单个 15s、总时长 15s，时长下限 2s
//   普通模式 / 超级版  -> 'normal'     参考文件按普通模式，时长下限 4s
// 档位不变 => 已填内容仍然合法，保留；档位变化 => 大概率超标，清空重来。
// ---------------------------------------------------------------------------
type VideoMode = 'multimodal' | 'startEndFrames' | 'videoModify' | 'videoExtend';
const VIDEO_MODES: VideoMode[] = ['multimodal', 'startEndFrames', 'videoModify', 'videoExtend'];

interface VideoModeDraft {
  text: string;
  html: string;
  characters: any[];
  images: any[];
  videos: any[];
  audios: any[];
  combined: any[];
  startFrame: string | null;
  endFrame: string | null;
  sourceVideo: string | null;
  sourceCover: string | null;
  sourceDuration: number;
}

function emptyVideoModeDraft(): VideoModeDraft {
  return {
    text: '', html: '',
    characters: [], images: [], videos: [], audios: [], combined: [],
    startFrame: null, endFrame: null,
    sourceVideo: null, sourceCover: null, sourceDuration: 0,
  };
}

const videoDrafts = ref<Record<VideoMode, VideoModeDraft>>({
  multimodal: emptyVideoModeDraft(),
  startEndFrames: emptyVideoModeDraft(),
  videoModify: emptyVideoModeDraft(),
  videoExtend: emptyVideoModeDraft(),
});

// 切回视频 tab 时恢复到离开前所在的模式
const lastVideoMode = ref<VideoMode>('multimodal');

function currentVideoMode2(): VideoMode {
  return (VIDEO_MODES.includes(selectedVideoMultimodal.value as VideoMode)
    ? selectedVideoMultimodal.value
    : 'multimodal') as VideoMode;
}

// editableInputRef 被 6 个输入框共用（视频 3 个模式 + 漫画/漫剧/图片各一个）。
// 切换 v-if 分支时 Vue 会卸载旧元素、挂载新元素，卸载会把这个共用 ref 置空，
// nextTick 里拿到的可能是 null 或上一个分支的元素。所以先校验 ref 的 data 属性，
// 对不上就直接按 data 属性查 DOM 兜底。
function resolveInputEl(type: string): HTMLElement | null {
  const mode = type === 'video' ? currentVideoMode2() : '';
  const matches = (e: HTMLElement | null | undefined) =>
    !!e && e.dataset.tab === type && (type !== 'video' || e.dataset.mode === mode);

  const current = editableInputRef.value;
  if (matches(current)) return current;

  const selector = type === 'video'
    ? `[data-tab="video"][data-mode="${mode}"]`
    : `[data-tab="${type}"]`;
  return document.querySelector<HTMLElement>(selector);
}

// 做同款 / 做续集 / 做视频 这些入口会同时改 contentType、视频模式、NSFW 模式，
// 输入框所在的 v-if 分支会被重建 —— editableInputRef 在这一帧可能还是 null，
// 或者仍指向已卸载的旧分支元素，直接拿它 focus 会落空（表现就是回填了但光标没进去）。
// 统一走 resolveInputEl 按 data-tab + data-mode 命中当前分支，拿不到就下一帧再试一次。
//
// 这里的 el.focus() 是我们自己代码触发的程序化聚焦，但浏览器分发的 focus 事件和用户手动点进去
// 完全一样，会原样触发输入框上绑定的 @focus="handleInputFocus" —— 那里未登录会直接 checkLogin()
// 跳登录页。回填内容本来就是给未登录用户看的（做同款/做续集不要求登录），所以这个标志位用来告诉
// handleInputFocus：这次 focus 是程序化触发的，跳过登录校验；用户自己点输入框的 focus 不受影响。
let isProgrammaticInputFocus = false;

function focusCurrentInput() {
  let tries = 0;

  const apply = () => {
    const el = resolveInputEl(contentType.value);
    // 隐藏元素 focus() 是空操作，必须等它真的渲染出来
    if (!el || (el.offsetParent === null && el.getClientRects().length === 0)) return false;

    isProgrammaticInputFocus = true;
    el.focus();
    isProgrammaticInputFocus = false;

    // contenteditable 只 focus 不给 selection，光标不会显示，用户看着就是「没聚焦」。
    // 把光标放到内容末尾，回填的内容后面可以直接接着打字。
    if (el.isContentEditable) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else if (el instanceof HTMLTextAreaElement) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }

    // 程序化 focus 未必触发 @focus（元素可能本来就是焦点），显式同步
    isInputFocused.value = true;
    if (typeTimer) clearTimeout(typeTimer);
    typedPlaceholder.value = currentPlaceholder.value;

    return document.activeElement === el;
  };

  // 回填过程中会连着改 contentType / 视频模式 / NSFW 模式，输入框所在的 v-if 分支
  // 可能重建好几次，一次 nextTick 抢不到。逐帧重试，直到 activeElement 真的是它。
  const attempt = () => {
    if (apply()) return;
    if (++tries >= 10) return;
    requestAnimationFrame(attempt);
  };
  nextTick(attempt);
}

// 把视频输入框的现状同步进 ref。
// 每次输入 / 插入 @ 标签都调一次，让 inputContentVideo / inputHtmlVideo 始终是最新的。
// 这样切模式时读 ref 就够了，不用在 DOM 正被 v-if 分支重建的时刻去抢着读它。
function syncVideoPromptFromDom(el?: HTMLElement | null) {
  if (contentType.value !== 'video') return;
  const mode = currentVideoMode2();
  if (mode === 'startEndFrames') return;
  const target = el && el.dataset.mode === mode ? el : resolveInputEl('video');
  if (!target) return;
  inputContentVideo.value = target.textContent || '';
  inputHtmlVideo.value = target.innerHTML;
  isInputEmptyVideo.value = !(target.textContent || '').trim();
}

// 视频输入框挂载时直接把内容写进去。
//
// 之前靠 restoreEditableInput 在 nextTick 里找元素再写，踩了两个坑：
// editableInputRef 被 6 个输入框共用，切 v-if 分支时会被旧元素的卸载置空；
// 就算查到了元素，也可能赶在新分支挂载完成之前。
// 挂载钩子拿到的就是刚插入 DOM 的那个元素本身，没有查找、没有时序问题。
function onVideoInputMounted(vnode: any) {
  const el = vnode?.el as HTMLElement | null | undefined;
  if (!el) return;
  const html = inputHtmlVideo.value || '';
  if (el.innerHTML !== html) el.innerHTML = html;
  previousInputHtml.value = el.innerHTML;
  isInputEmptyVideo.value = !(el.textContent || '').trim();
  syncStickyInputPreview();
}

// 读当前模式的提示词。首尾帧走 textarea(framesInput)，其余三个模式走 contenteditable。
// DOM 停在别的 tab / 别的模式时不回读，否则内容会串到新模式上。
function readVideoPrompt(mode: VideoMode): { text: string; html: string } {
  if (mode === 'startEndFrames') {
    return { text: framesInput.value, html: '' };
  }
  // 内容由 syncVideoPromptFromDom 持续同步，这里直接读 ref。
  // 之前在这里读 DOM，切模式时元素正被销毁重建，读到的可能是空的或旧分支的。
  if (mode === currentVideoMode2()) {
    syncVideoPromptFromDom();
  }
  return { text: inputContentVideo.value, html: inputHtmlVideo.value };
}

// 把当前 live 状态存进指定模式的桶
function stashVideoDraft(mode: VideoMode) {
  const { text, html } = readVideoPrompt(mode);
  videoDrafts.value[mode] = {
    text, html,
    characters: [...selectedCharactersVideo.value],
    images: [...uploadedImagesVideo.value],
    videos: [...uploadedVideosVideo.value],
    audios: [...uploadedAudiosVideo.value],
    combined: [...combinedItemsVideo.value],
    startFrame: startFrameImage.value,
    endFrame: endFrameImage.value,
    sourceVideo: uploadedVideo.value,
    sourceCover: uploadedVideoCover.value,
    sourceDuration: uploadedVideoDuration.value,
  };
}

// 把指定模式的桶写回 live 状态。DOM 由 restoreEditableInput 在 nextTick 里补。
function applyVideoDraft(mode: VideoMode) {
  const d = videoDrafts.value[mode];
  selectedCharactersVideo.value = [...d.characters];
  uploadedImagesVideo.value = [...d.images];
  uploadedVideosVideo.value = [...d.videos];
  uploadedAudiosVideo.value = [...d.audios];
  combinedItemsVideo.value = [...d.combined];
  startFrameImage.value = d.startFrame;
  endFrameImage.value = d.endFrame;
  uploadedVideo.value = d.sourceVideo;
  uploadedVideoCover.value = d.sourceCover;
  uploadedVideoDuration.value = d.sourceDuration;
  // text 兜底：来源只留了 html 时（例如富文本里只有标签），从 html 还原纯文本，
  // 免得进首尾帧模式看到空白
  const text = d.text || (d.html ? htmlToText(d.html) : '');
  inputContentVideo.value = text;
  inputHtmlVideo.value = d.html || (text ? textToHtml(text) : '');
  framesInput.value = mode === 'startEndFrames' ? text : '';
  isInputEmptyVideo.value = !text.trim();
  inputKey.value++;
}

// 每个模式自己的分辨率 / 比例 / 时长。切走时记一份，切回来盖回去。
// 参考文件切模式就丢（见 carryPromptToMode），参数不跟着丢 —— 视频修改 / 视频续写
// 的时长是上传原视频时自动算出来的（原视频 4s 就顶成 5s），界面上是「自适应」根本看不见，
// 不单独记的话切到多模态就会带出一个莫名其妙的 5s。
// null 表示这个模式还没进去过，进去时交给 migrateVideoParams：当前值能用就沿用，不能用回默认。
interface VideoModeParams {
  quality: string;
  ratio: string;
  duration: string;
}

const videoModeParams = ref<Record<VideoMode, VideoModeParams | null>>({
  multimodal: null,
  startEndFrames: null,
  videoModify: null,
  videoExtend: null,
});

function stashVideoModeParams(mode: VideoMode) {
  videoModeParams.value[mode] = {
    quality: selectedVideoQuality.value,
    ratio: selectedVideoRatio.value,
    duration: selectedVideoDuration.value,
  };
}

function applyVideoModeParams(mode: VideoMode) {
  const p = videoModeParams.value[mode];
  if (!p) return;
  selectedVideoQuality.value = p.quality;
  selectedVideoRatio.value = p.ratio;
  selectedVideoDuration.value = p.duration;
}

// 只把提示词带到目标模式，参考文件一律不带（spec 四：模式之间只回显提示词）
// 首尾帧是纯文本 textarea，readVideoPrompt 给它的 html 恒为空。
// 带到 contenteditable 模式（多模态/视频修改/视频续写）时不能直接用这个空 html，
// 否则目标输入框被写成空的 —— 按纯文本转义成 html 再带过去。
function htmlToText(html: string) {
  const box = document.createElement('div');
  box.innerHTML = html;
  return box.textContent || '';
}

function textToHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// 输入框里的 @ 引用标签（角色/图片/视频/音频）是手工建的 span，指向具体的已上传文件。
// 切模式时参考文件不带走，这些 span 就成了指向不存在文件的空引用 —— 显示还在、
// 提交时却取不到对应素材。所以带提示词过去之前要把它们摘掉。
const REF_TAG_SELECTOR = 'span.character-tag-input, span.image-tag, span.video-tag, span.audio-tag';

function stripRefTags(html: string): { html: string; text: string } {
  const box = document.createElement('div');
  box.innerHTML = html;
  box.querySelectorAll(REF_TAG_SELECTOR).forEach((el) => el.remove());
  // 摘掉标签后常留下孤立的空格和连续 <br>，顺手收一下
  box.innerHTML = box.innerHTML.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>').replace(/^\s+|\s+$/g, '');
  return { html: box.innerHTML, text: box.textContent || '' };
}

// 只摘掉「引用的文件已经不在了」的那些标签，留下的标签对应的文件仍然存在。
// 切档位时会按新限制筛掉超标文件，对应的引用标签必须跟着消失。
function stripDanglingRefTags(html: string, keepIds: Set<string>): { html: string; text: string } {
  if (!html) return { html: '', text: '' };
  const box = document.createElement('div');
  box.innerHTML = html;
  box.querySelectorAll(REF_TAG_SELECTOR).forEach((el) => {
    const id = (el as HTMLElement).dataset.itemId || '';
    // 角色标签不受参考文件筛选影响，没有 id 的老标签也一并保留
    if (id && !keepIds.has(id) && !el.classList.contains('character-tag-input')) {
      el.remove();
    }
  });
  return { html: box.innerHTML, text: box.textContent || '' };
}

function carryPromptToMode(from: VideoMode, to: VideoMode) {
  const raw = readVideoPrompt(from);
  const rawHtml = raw.html || (raw.text ? textToHtml(raw.text) : '');
  const cleaned = rawHtml ? stripRefTags(rawHtml) : { html: '', text: raw.text };
  videoDrafts.value[to] = { ...emptyVideoModeDraft(), text: cleaned.text, html: cleaned.html };
}

// ---------------------------------------------------------------------------
// 参考文件的迁移能力表
//
// 数值抽自上传校验里那套判断（见 handleFileUpload / checkItemLimit），
// 迁移时用同一套规则决定哪些参考文件带得过去，避免两处规则各写一份而走偏。
// ---------------------------------------------------------------------------

interface RefLimits {
  imageMaxCount: number;
  imageMaxSize: number;
  videoMaxSize: number;
  videoMaxSeconds: number;
  acceptsVideo: boolean;
  acceptsAudio: boolean;
}

function refLimitsFor(tab: string, mode: string, videoMode?: VideoMode): RefLimits {
  // 视频 tab 的多模态 / 视频修改 / 视频续写：接受图片 + 视频 + 音频
  if (tab === 'video' && videoMode && videoMode !== 'startEndFrames') {
    const pf = VIDEO_PROFILES[mode] || VIDEO_PROFILES.normal;
    return {
      imageMaxCount: pf.imageMaxCount,
      imageMaxSize: pf.imageMaxSize,
      videoMaxSize: pf.videoMaxSize,
      videoMaxSeconds: pf.refVideoMaxSeconds,
      acceptsVideo: true,
      acceptsAudio: true,
    };
  }
  if (tab === 'photo') {
    return mode === 'unlimited'
      ? { imageMaxCount: 10, imageMaxSize: 30 * MB, videoMaxSize: 0, videoMaxSeconds: 0, acceptsVideo: false, acceptsAudio: false }
      : { imageMaxCount: 7, imageMaxSize: 10 * MB, videoMaxSize: 0, videoMaxSeconds: 0, acceptsVideo: false, acceptsAudio: false };
  }
  if (tab === 'comic' || tab === 'drama') {
    return { imageMaxCount: 7, imageMaxSize: 10 * MB, videoMaxSize: 0, videoMaxSeconds: 0, acceptsVideo: false, acceptsAudio: false };
  }
  // 首尾帧模式、小说 tab：不接受任何参考文件
  return { imageMaxCount: 0, imageMaxSize: 0, videoMaxSize: 0, videoMaxSeconds: 0, acceptsVideo: false, acceptsAudio: false };
}

// 按目标限制筛一遍参考文件。
// 做同款回填和早期上传的老数据没有 size / duration 字段，无从判断，按合规处理，
// 只受数量上限约束 —— 与 pickPhotoImagesForNormalMode 的既有口径保持一致。
function filterRefFiles(
  images: any[], videos: any[], audios: any[], limits: RefLimits,
): { images: any[]; videos: any[]; audios: any[]; dropped: any[] } {
  const keptImages: any[] = [];
  const dropped: any[] = [];

  images.forEach((img: any) => {
    const size = Number(img.size) || 0;
    if (keptImages.length >= limits.imageMaxCount || (size > 0 && size > limits.imageMaxSize)) {
      dropped.push(img);
    } else {
      keptImages.push(img);
    }
  });

  const keptVideos: any[] = [];
  videos.forEach((v: any) => {
    const size = Number(v.size) || 0;
    const dur = Number(v.duration) || 0;
    if (!limits.acceptsVideo
      || (size > 0 && size > limits.videoMaxSize)
      || (dur > 0 && dur > limits.videoMaxSeconds)) {
      dropped.push(v);
    } else {
      keptVideos.push(v);
    }
  });

  const keptAudios: any[] = [];
  audios.forEach((a: any) => {
    if (!limits.acceptsAudio) dropped.push(a);
    else keptAudios.push(a);
  });

  return { images: keptImages, videos: keptVideos, audios: keptAudios, dropped };
}

// 把筛过的参考文件写回视频 tab 的 live 状态
function applyVideoRefFiles(kept: { images: any[]; videos: any[]; audios: any[] }) {
  uploadedImagesVideo.value = kept.images;
  uploadedVideosVideo.value = kept.videos;
  uploadedAudiosVideo.value = kept.audios;
  combinedItemsVideo.value = [...kept.images, ...kept.videos, ...kept.audios];
  inputKey.value++;
}

// 把输入框里正在编辑的提示词回读到 ref。
// applyVideoRefFiles 里的 inputKey++ 会重建输入框 DOM，重建后 restoreEditableInput
// 用的是 inputHtmlVideo —— 不先回读的话，写回去的是上一次进 tab 时的旧值，
// 用户刚敲的内容就被盖没了。所有会改动视频状态的入口都必须先调它。
function stashCurrentVideoPrompt() {
  const mode = currentVideoMode2();
  const { text, html } = readVideoPrompt(mode);
  inputContentVideo.value = text;
  inputHtmlVideo.value = html;
  if (mode === 'startEndFrames') framesInput.value = text;
  isInputEmptyVideo.value = !text.trim();
}

// 按目标档位预演一遍当前视频参考文件
function previewVideoRefsFor(nextLimitMode: string) {
  return filterRefFiles(
    uploadedImagesVideo.value, uploadedVideosVideo.value, uploadedAudiosVideo.value,
    refLimitsFor('video', nextLimitMode, currentVideoMode2()),
  );
}

// 「做同款 / 续写 / 首尾帧延续」这些一次性入口的标志位。切模式、切档位时必须清掉，
// 否则会带着上一次的来源身份进入新模式，提交时参数对不上。
function clearVideoMakeFlags() {
  isMakeVideoSimilarMode.value = false;
  isMakeVideoSequelMode.value = false;
  isMakeVideoMode.value = false;
  originVideoUrlForTail.value = '';
}

// 限制档位变化时用：所有模式的草稿一起作废
function clearAllVideoDrafts() {
  VIDEO_MODES.forEach((m) => { videoDrafts.value[m] = emptyVideoModeDraft(); });
}

// 参数迁移：当前值在新档位/新模式下仍可选就沿用，否则回默认值
function migrateVideoParams() {
  const pf = videoProfile.value;
  const d = parseInt(selectedVideoDuration.value);
  if (!Number.isFinite(d) || d < pf.durationMin || d > pf.durationMax) {
    selectedVideoDuration.value = pf.defaultDuration;
  }
  lastValidVideoDuration.value = selectedVideoDuration.value;
  if (!videoRatioOptions.value.some((o) => o.value === selectedVideoRatio.value)) {
    selectedVideoRatio.value = pf.defaultRatio;
  }
  if (!videoQualityOptions.value.some((o) => o.value === selectedVideoQuality.value)) {
    selectedVideoQuality.value = pf.defaultQuality;
  }
}

function resetVideoParams() {
  const pf = videoProfile.value;
  selectedVideoRatio.value = pf.defaultRatio;
  selectedVideoQuality.value = pf.defaultQuality;
  selectedVideoDuration.value = pf.defaultDuration;
  lastValidVideoDuration.value = pf.defaultDuration;
  enableVideoOptimizePrompt.value = false;
}

// spec 四：模式之间切换。只回显提示词；涉及多模态的切换参数尽量沿用，
// 首尾帧/视频修改/视频续写 三者互切一律回默认参数。
// 当前模式里挂着的参考文件数量（含角色、首尾帧、原视频）。
// 切模式一律不带走，有内容就先问一句，别让用户一点就丢。
function currentVideoRefCount() {
  return uploadedImagesVideo.value.length
    + uploadedVideosVideo.value.length
    + uploadedAudiosVideo.value.length
    + selectedCharactersVideo.value.length
    + (startFrameImage.value ? 1 : 0)
    + (endFrameImage.value ? 1 : 0)
    + (uploadedVideo.value ? 1 : 0);
}

function switchVideoMultimodal(next: string) {
  showVideoMultimodalDropdown.value = false;
  const from = currentVideoMode2();
  const target = next as VideoMode;
  if (!VIDEO_MODES.includes(target) || target === from) return;

  // 有参考文件要被丢弃就先确认；取消则留在当前模式，内容原样不动
  if (currentVideoRefCount() > 0) {
    pendingModeSwitchAction.value = () => doSwitchVideoMultimodal(from, target);
    modeSwitchWarningVariant.value = 'mode';
    showModeSwitchFileWarning.value = true;
    return;
  }
  doSwitchVideoMultimodal(from, target);
}

function doSwitchVideoMultimodal(from: VideoMode, target: VideoMode) {
  const prevLimitMode = videoLimitMode.value;
  // 参考文件切模式就丢，但把当前模式的分辨率 / 比例 / 时长记一份，切回来能还原
  stashVideoModeParams(from);
  carryPromptToMode(from, target);
  // 参数怎么带：
  //   多模态 -> 其他模式：沿用当前的分辨率 / 比例 / 时长，新模式用不了的由 migrateVideoParams 回默认；
  //   首尾帧 / 视频编辑 / 视频续写之间：一律回默认值。
  const keepParamsFromCurrent = from === 'multimodal';
  clearVideoMakeFlags();
  selectedVideoMultimodal.value = target;
  lastVideoMode.value = target;
  // 目标模式不支持当前版本（如切到视频修改，普通模式下只有超级版）就按 fast → enhanced → super 往后落
  selectedNsfwVersion.value = pickVideoVersion(
    selectedNsfwVersion.value,
    videoVersionsFor(effectiveVideoMode.value, target),
  );
  applyVideoDraft(target);
  if (!keepParamsFromCurrent) resetVideoParams();

  // 档位跟着版本变了就走统一的档位变更流程（文件按新档位筛掉超标的，参数回默认）
  if (videoLimitMode.value !== prevLimitMode) {
    applyVideoLimitModeChange(prevLimitMode);
  }
  // 分辨率 / 比例 / 时长：在目标档位里能用的就沿用，不能用的回该档位默认值
  migrateVideoParams();
  enableVideoOptimizePrompt.value = false;
  restoreEditableInput('video');
}


// 「做同款」「续写」等外部入口会直接改 selectedVideoMultimodal，不走 switchVideoMultimodal。
// 用 watch 兜底，保证 lastVideoMode 始终跟得上，切走再切回来能回到正确的模式。
watch(selectedVideoMultimodal, (m) => {
  if (VIDEO_MODES.includes(m as VideoMode)) lastVideoMode.value = m as VideoMode;
});

// spec 二：NSFW 开关 / 版本切换落定后统一走这里。
// 档位不变 -> 内容与参数原样保留。
// 档位变化 -> 提示词保留，参考文件按新档位重新筛（超标的丢掉），参数回默认值。
function applyVideoLimitModeChange(prevLimitMode: string) {
  if (videoLimitMode.value === prevLimitMode) {
    migrateVideoParams();
    return;
  }
  stashCurrentVideoPrompt();
  const kept = previewVideoRefsFor(videoLimitMode.value);
  applyVideoRefFiles(kept);

  // 被筛掉的文件，其引用标签也要从提示词里摘掉，否则留下指向不存在素材的空引用
  const keptIds = new Set<string>(
    [...kept.images, ...kept.videos, ...kept.audios].map((f: any) => String(f.id)),
  );
  const cleaned = stripDanglingRefTags(inputHtmlVideo.value, keptIds);
  inputHtmlVideo.value = cleaned.html;
  inputContentVideo.value = cleaned.text;
  isInputEmptyVideo.value = !cleaned.text.trim();
  // 其余模式的暂存也按新档位筛一遍，否则切回去还是超标的旧文件
  VIDEO_MODES.forEach((m) => {
    if (m === currentVideoMode2()) return;
    const d = videoDrafts.value[m];
    const r = filterRefFiles(d.images, d.videos, d.audios,
      refLimitsFor('video', videoLimitMode.value, m));
    const ids = new Set<string>(
      [...r.images, ...r.videos, ...r.audios].map((f: any) => String(f.id)),
    );
    const c = stripDanglingRefTags(d.html, ids);
    videoDrafts.value[m] = {
      ...d,
      text: c.text || d.text, html: c.html,
      images: r.images, videos: r.videos, audios: r.audios,
      combined: [...r.images, ...r.videos, ...r.audios],
    };
  });
  clampVideoPromptsToLimit();
  clearVideoMakeFlags();
  resetVideoParams();
}

// 新档位的字数上限可能比原来小（加强版 20000 → 极速版 7000）。
// 提示词是保留的，超标部分必须在这里截掉：现有的字数限制是「拒绝输入」而不是「截断」，
// 留着超标内容用户一个字都打不进去，却还能点生成然后被后端拒。
function clampVideoPromptsToLimit() {
  const max = videoProfile.value.maxInputChars;
  let clamped = false;

  const cur = clampPromptHtml(inputHtmlVideo.value, max);
  if (cur.clamped) {
    inputHtmlVideo.value = cur.html;
    inputContentVideo.value = cur.text;
    isInputEmptyVideo.value = !cur.text.trim();
    clamped = true;
  }
  if (framesInput.value.length > max) {
    framesInput.value = framesInput.value.slice(0, max);
    clamped = true;
  }

  VIDEO_MODES.forEach((m) => {
    if (m === currentVideoMode2()) return;
    const d = videoDrafts.value[m];
    const c = clampPromptHtml(d.html, max);
    const overText = d.text.length > max;
    if (c.clamped || overText) {
      videoDrafts.value[m] = {
        ...d,
        html: c.clamped ? c.html : d.html,
        text: c.clamped ? c.text : d.text.slice(0, max),
      };
      clamped = true;
    }
  });

  if (clamped) toast(t('home.error.maxInputLimit', { max }));
}

// 切档位前先预演：有参考文件留不下就先问一句，确认后才真正切；取消则什么都不变。
function requestVideoLimitModeChange(nextLimitMode: string, apply: () => void) {
  if (nextLimitMode !== videoLimitMode.value && previewVideoRefsFor(nextLimitMode).dropped.length > 0) {
    pendingModeSwitchAction.value = apply;
    // 首尾帧模式下能被丢掉的只有图片，文案单独一条
    modeSwitchWarningVariant.value = currentVideoMode2() === 'startEndFrames' ? 'images' : 'files';
    showModeSwitchFileWarning.value = true;
    return;
  }
  apply();
}

// 当前输入载体是不是视频首尾帧那个 textarea（小说 tab 的 textarea 走 novelInput）
function isFramesTextarea() {
  return contentType.value === 'video' && selectedVideoMultimodal.value === 'startEndFrames';
}

// Mode dropdown for video mode
const showVideoModeDropdown = ref(false);

const navigateToNovelGenerate = async () => {
  trackClickGenerateButton();
  if (isGeneratingNovel.value) return;
  isGeneratingNovel.value = true;

  // 走 checkLogin：保存做同款/做续集的来源 + 记住回跳地址
  if (!checkLogin()) {
    isGeneratingNovel.value = false;
    return;
  }
  const token = localStorage.getItem('token') || '';

  if (!novelInput.value.trim()) {
    toast(t('home.error.emptyInput'));
    isGeneratingNovel.value = false;
    return;
  }

  // Check if user has sufficient balance
  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedComputingPower.value || 1;

    const requiredBalance = Math.round(coverCost * overFreezeRate);

    const userBalance = balanceInfo.value.balance || 0;
    if (requiredBalance > userBalance) {
      insufficientBalanceEstimatedFrozen.value = Math.round(coverCost * overFreezeRate);
      insufficientBalanceAvailable.value = userBalance;
      insufficientBalanceFrozen.value = Math.max(0, (balanceInfo.value.total_balance || 0) - userBalance);
      showInsufficientBalanceModal.value = true;
      isGeneratingNovel.value = false;
      return;
    }
  }

  try {
    // Check if user has reached the task limit
    const totalProcessRes = await api.totalProcess(true) as any;
    if (totalProcessRes.code == 200 && totalProcessRes.data?.novel_doing_count >= 10) {
      showTaskLimitExceededModal.value = true;
      isGeneratingNovel.value = false;
      return;
    }

    const sessionId = uuidv4();

    const params = {
      ratio: "9:16",
      language: selectedLanguage.value,
      story_type: "novel",
      story_mode: (contentSwitch.mode === 2 || currentNovelMode.value == 'unlimited') ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: [],
      emotion: "",
      others: {
        content: novelInput.value.trim()
      },
      addition_characters: [],
      total_words: selectedWordCount.value == '100K' ? '10' : selectedWordCount.value == '300K' ? '30' : '3',
      insert_image_count: contentSwitch.mode === 2 ? Math.max(4, selectedInsertImage.value) : selectedInsertImage.value,
      ...(isMakeSameOn('novel') ? { is_make_same: 1, origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value ? { is_make_extension: 1, origin_post_id: originPostId.value, ...(isMakeVideoSequelMode.value ? {} : { origin_session_id: originSessionIdForExtension.value }) } : {}),
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code == 200 || data.code == 0) {
        trackContentPublished(sessionId);
        clearDraftFor('novel');
        router.push(`/novel/${sessionId}`);
      } else {
        toast(data.message);
      }
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    console.error('Error in navigateToNovelGenerate:', error);
    toast(t('fail'));
  } finally {
    isGeneratingNovel.value = false;
  }
}

function goRecharge() {
  if (!checkLogin()) return false;

  router.push('/ai-recharge');
  showInsufficientBalanceModal.value = false;
};

const closeInsufficientBalanceModal = () => {
  showInsufficientBalanceModal.value = false;
  insufficientBalanceEstimatedFrozen.value = 0;
};


// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token');
});


// Modals
const showUnlimitedModal = ref(false);
const showUnderageNoBirthdayModal = ref(false);
const pendingModeType = ref('video');
const showModeSwitchFileWarning = ref(false);
// 这次弹窗是哪种场景（见 ModeSwitchFileWarningModal 的 variant）
const modeSwitchWarningVariant = ref<'files' | 'images' | 'mode'>('files');
const showCharacterModal = ref(false);
const showStyleModal = ref(false);
const showVideoSettingsModal = ref(false);
const showComputingPowerEstimateModal = ref(false);


// Task limit modal
const showTaskLimitExceededModal = ref(false);
const showInsufficientBalanceModal = ref(false);
const insufficientBalanceEstimatedFrozen = ref(0);
const insufficientBalanceAvailable = ref(0);
const insufficientBalanceFrozen = ref(0);


const showUnreferencedFilesModal = ref(false);
const unreferencedFileLabels = ref<string[]>([]);
const pendingGenerateCallback = ref<(() => void) | null>(null);

const checkUnreferencedFiles = (): boolean => {
  // Only check for comic and drama types
  if (contentType.value !== 'comic' && contentType.value !== 'drama') return false;
  if (!editableInputRef.value) return false;

  const currentCombinedItems = getCombinedItems().value;
  const checkItems = currentCombinedItems.filter((item: any) => item.type === 'image' || item.type === 'character');
  if (checkItems.length === 0) return false;

  const referencedItemIds = new Set<string>();
  const spans = editableInputRef.value.querySelectorAll('span.image-tag, span.character-tag-input');
  spans.forEach((span: Element) => {
    const itemId = (span as HTMLElement).dataset.itemId;
    if (itemId) referencedItemIds.add(itemId);
  });

  const unreferenced = checkItems.filter((item: any) => !referencedItemIds.has(item.id));
  if (unreferenced.length === 0) return false;

  const currentUploadedImages = getUploadedImages();
  const labels: string[] = [];
  for (const item of unreferenced) {
    if (item.type === 'character') {
      labels.push(t('home.unreferencedFiles.characterLabel') + item.name);
    } else if (item.type === 'image') {
      const idx = currentUploadedImages.value.findIndex((img: any) => img.id === item.id) + 1;
      if (idx > 0) labels.push(t('home.unreferencedFiles.imageLabel') + idx);
    }
  }

  if (labels.length === 0) return false;
  unreferencedFileLabels.value = labels;
  return true;
};

const handleUnreferencedSkip = () => {
  showUnreferencedFilesModal.value = false;
  if (pendingGenerateCallback.value) {
    pendingGenerateCallback.value();
    pendingGenerateCallback.value = null;
  }
};

const handleUnreferencedGoBack = () => {
  showUnreferencedFilesModal.value = false;
  pendingGenerateCallback.value = null;
  if (editableInputRef.value) {
    editableInputRef.value.focus();
  }
};


// Computed property to calculate estimated computing power for story/novel
const estimatedComputingPower = computed(() => {
  if (!balanceInfo.value) {
    return 1;
  }

  // Calculate estimated computing power using outline_cost + single_image_cost
  const manhuaManjuOutlineBase = Number(balanceInfo.value.outline_cost) || 0;
  const singleImageCost = Number(balanceInfo.value.single_image_cost) || 0;

  const total = manhuaManjuOutlineBase + singleImageCost;

  // Ensure minimum value is 1
  return Math.max(1, total);
});

// Computed property to calculate estimated computing power for photo
const estimatedPhotoComputingPower = computed(() => {
  if (!balanceInfo.value) {
    return 1;
  }

  let cost = 0;
  if (selectedPhotoQuality.value === '1K') {
    cost = Number(balanceInfo.value.single_image_cost) || 5;
  } else if (selectedPhotoQuality.value === '2K') {
    cost = Number(balanceInfo.value.single_image_cost_2k) || 10;
  }

  if (enablePhotoOptimizePrompt.value && currentPhotoMode.value !== 'unlimited') {
    cost += Number(balanceInfo.value.additional_optimize_prompt_cost) || 0;
  }

  return Math.max(1, cost);
});

// Computed property to calculate estimated computing power for video
const estimatedVideoComputingPower = computed(() => {
  if (!balanceInfo.value) {
    return 1;
  }

  let duration: number;
  if (selectedVideoMultimodal.value === 'videoModify') {
    duration = uploadedVideoDuration.value > 0 ? Math.ceil(uploadedVideoDuration.value) : 1;
  } else if (selectedVideoMultimodal.value === 'videoExtend') {
    duration = uploadedVideoDuration.value > 0 ? Math.ceil(uploadedVideoDuration.value) : 30;
  } else if (videoLimitMode.value === 'unlimited' && selectedVideoMultimodal.value === 'multimodal') {
    duration = Math.ceil((parseInt(selectedVideoDuration.value) || 30) + getUploadedVideoDurationSum());
  } else {
    duration = parseInt(selectedVideoDuration.value) || 30;
  }
  let costPerSecond = 0;

  if (pricingQuality.value === '720P') {
    if (effectiveVideoMode.value === 'unlimited') {
      costPerSecond = Number(balanceInfo.value.single_video_cost_720p_per_second_nsfw);
    } else {
      costPerSecond = Number(balanceInfo.value.single_video_cost_720p_per_second);
    }
  } else if (pricingQuality.value === '1080P') {
    if (effectiveVideoMode.value === 'unlimited') {
      costPerSecond = Number(balanceInfo.value.single_video_cost_1080p_per_second_nsfw);
    } else {
      costPerSecond = Number(balanceInfo.value.single_video_cost_1080p_per_second);
    }
  }

  let totalCost = Math.ceil(costPerSecond * duration);
  if (enableVideoOptimizePrompt.value && selectedVideoMultimodal.value !== 'videoModify' && selectedVideoMultimodal.value !== 'videoExtend') {
    totalCost += Math.ceil(Number(balanceInfo.value.additional_optimize_prompt_cost) || 0);
  }
  return Math.max(1, totalCost);
});

// Check if user is logged in
// 做同款 / 做同款视频 / 做续集的回填内容是纯内存态，未登录时点输入框会被跳去登录页、页面随之卸载。
// 跳登录前把这次回填的来源连页面地址一起存下来，登录回来落回同一个页面时自动重新回填。
function keepMakeSourceForLogin() {
  if (lastMakeSource) {
    try {
      localStorage.setItem(MAKE_SOURCE_RESUME_KEY, JSON.stringify({
        ...lastMakeSource,
        path: route.fullPath,
        at: Date.now(),
      }));
    } catch {
      /* 忽略 */
    }
  }
}

// 登录/注册回来后，落回同一个页面就把刚才的回填重做一遍
const RESUME_MAX_AGE = 30 * 60 * 1000;
async function resumeMakeSourceAfterLogin(): Promise<boolean> {
  let saved: any = null;
  try {
    const raw = localStorage.getItem(MAKE_SOURCE_RESUME_KEY);
    if (!raw) return false;
    saved = JSON.parse(raw);
  } catch {
    localStorage.removeItem(MAKE_SOURCE_RESUME_KEY);
    return false;
  }
  if (!saved || !saved.kind) {
    localStorage.removeItem(MAKE_SOURCE_RESUME_KEY);
    return false;
  }
  // 地址对不上说明落到了别的页面，留着等它自己那一页来消费；放太久的直接丢掉
  if (saved.at && Date.now() - saved.at > RESUME_MAX_AGE) {
    localStorage.removeItem(MAKE_SOURCE_RESUME_KEY);
    return false;
  }
  if (!isSameLoginReturnTarget(saved.path)) return false;
  localStorage.removeItem(MAKE_SOURCE_RESUME_KEY);
  await applySource(saved.kind, saved.payload);
  return true;
}

// 判断当前页面是不是当初跳登录时那一页。
// 优先整串比对；对不上再退一步按「路径 + id」比，避免 query 顺序变了或页面自己
// router.replace 补了参数就认不出来（详情页有好几处会补 tab / type）。
function isSameLoginReturnTarget(savedPath: string): boolean {
  if (!savedPath) return false;
  if (savedPath === route.fullPath) return true;
  try {
    const saved = new URL(savedPath, window.location.origin);
    if (saved.pathname !== route.path) return false;
    const savedId = saved.searchParams.get('id');
    const currentId = (route.query.id as string | undefined) ?? null;
    return (savedId ?? null) === currentId;
  } catch {
    return false;
  }
}


const checkLogin = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    keepMakeSourceForLogin();
    // 记住当前地址，登录/注册成功后回到同一个页面（首页则回到同一个内容类型 tab）
    try {
      localStorage.setItem('loginRedirect', route.fullPath);
    } catch {
      /* 忽略 */
    }
    // 走到这一步的基本是新用户，直接去注册页，注册页上有「已有账号去登录」的入口
    router.push('/register');
    return false;
  }
  return true;
};

// Check if total items (characters + images) has reached the limit
const checkItemLimit = () => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();

  // Get current mode based on content type
  let currentMode = 'normal';
  switch (contentType.value) {
    case 'video':
      currentMode = videoLimitMode.value;
      break;
    case 'drama':
      currentMode = currentDramaMode.value;
      break;
    case 'photo':
      currentMode = currentPhotoMode.value;
      break;
    case 'comic':
      currentMode = currentComicMode.value;
      break;
    case 'novel':
      currentMode = currentNovelMode.value;
      break;
  }

  // Photo upload limits based on mode
  let maxPhotos = currentMode === 'unlimited' ? 10 : 7;
  if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
    maxPhotos = videoProfile.value.imageMaxCount;
  }

  const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length;
  if (totalItems >= maxPhotos) {
    const isComicOrDrama = contentType.value === 'comic' || contentType.value === 'drama';
    toast(t(isComicOrDrama ? 'home.error.maxItemReached' : 'home.error.maxPhotoReached', { max: maxPhotos }));
    return false;
  }
  return true;
};

const limit = ref(48);

// Mock Data
const characters = ref([]);

const checkAgeForUnlimitedMode = (modeType: string): boolean => {
  if (!userInfo.value) {
    return false;
  }

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

const switchVideoMode = (mode: string, index: number) => {
  if (index == 2) {
    if (!checkLogin()) return false;

    if (checkAgeForUnlimitedMode('video')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      // 四个模式在加强版下都可用，切 NSFW 不改变当前模式
      const prevLimitMode = videoLimitMode.value;
      // 切 NSFW 不动档位：当前版本在无限制模式下还能选就保持不变（参数、参考文件都不受影响），
      // 选不了了才按 加强版 -> 超级版 -> 极速版 回落
      const nextVersion = pickVideoVersion(
        selectedNsfwVersion.value,
        videoVersionsFor('unlimited', selectedVideoMultimodal.value),
      );
      requestVideoLimitModeChange(videoLimitModeOf(nextVersion, 'unlimited'), () => {
        stashCurrentVideoPrompt();
        currentVideoMode.value = 'unlimited';
        selectedNsfwVersion.value = nextVersion;
        enableVideoOptimizePrompt.value = false;
        applyVideoLimitModeChange(prevLimitMode);
        restoreEditableInput('video');
      });
      showVideoModeDropdown.value = false;
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    const prevLimitMode = videoLimitMode.value;
    showVideoModeDropdown.value = false;
    // 切回普通同样保持当前版本：普通模式下选不了的（加强版）才回落
    const nextVersion = pickVideoVersion(
      selectedNsfwVersion.value,
      videoVersionsFor('normal', selectedVideoMultimodal.value),
    );
    requestVideoLimitModeChange(nextVersion === 'fast' ? 'fast' : 'normal', () => {
      stashCurrentVideoPrompt();
      currentVideoMode.value = 'normal';
      selectedNsfwVersion.value = nextVersion;
      enableVideoOptimizePrompt.value = false;
      applyVideoLimitModeChange(prevLimitMode);
      restoreEditableInput('video');
    });
  }
};

const switchNovelMode = (mode: string, index: number) => {
  if (index == 2) {
    if (!checkLogin()) return false;

    if (checkAgeForUnlimitedMode('novel')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentNovelMode.value = 'unlimited';
      closeNovelInputDropdowns();
      selectedInsertImage.value = 4;
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentNovelMode.value = 'normal';
    closeNovelInputDropdowns();
    selectedInsertImage.value = 0;
    showInsertImageDropdown.value = false;
  }
};

const switchComicMode = (mode: string, index: number) => {
  if (index == 2) {
    if (!checkLogin()) return false;

    if (checkAgeForUnlimitedMode('comic')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentComicMode.value = 'unlimited';
      closeComicInputDropdowns();
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentComicMode.value = 'normal';
    closeComicInputDropdowns();
  }
};

const switchDramaMode = (mode: string, index: number) => {
  if (index == 2) {
    if (!checkLogin()) return false;

    if (checkAgeForUnlimitedMode('drama')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentDramaMode.value = 'unlimited';
      closeDramaInputDropdowns();
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentDramaMode.value = 'normal';
    closeDramaInputDropdowns();
  }
};

const PHOTO_NORMAL_MAX_COUNT = 7;
const PHOTO_NORMAL_MAX_SIZE = 10 * 1024 * 1024;

function pickPhotoImagesForNormalMode() {
  const kept: any[] = [];
  const rejected: any[] = [];
  uploadedImagesPhoto.value.forEach((img: any) => {
    const size = Number(img.size) || 0;
    if (size > PHOTO_NORMAL_MAX_SIZE || kept.length >= PHOTO_NORMAL_MAX_COUNT) {
      rejected.push(img);
    } else {
      kept.push(img);
    }
  });
  return { kept, rejected };
}

function applyPhotoNormalMode(removeRejected = false) {
  if (removeRejected) {
    const rejectedIds = pickPhotoImagesForNormalMode().rejected.map((img: any) => img.id);
    rejectedIds.forEach((id: string) => removeUploadedImage(id));
  }
  currentPhotoMode.value = 'normal';
  enablePhotoOptimizePrompt.value = false;
}

// 这个弹窗被多条切换链路共用（图片切档位、视频切模式、视频切档位），
// 用 pending 记住「确认之后要执行什么」，取消则原样不动。
const pendingModeSwitchAction = ref<(() => void) | null>(null);

function confirmModeSwitchFileWarning() {
  showModeSwitchFileWarning.value = false;
  const act = pendingModeSwitchAction.value;
  pendingModeSwitchAction.value = null;
  if (act) {
    act();
    return;
  }
  applyPhotoNormalMode(true);
}

function cancelModeSwitchFileWarning() {
  showModeSwitchFileWarning.value = false;
  pendingModeSwitchAction.value = null;
}

const switchPhotoMode = (mode: string, index: number) => {
  if (index == 2) {
    if (!checkLogin()) return false;

    if (checkAgeForUnlimitedMode('photo')) {
      return;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentPhotoMode.value = 'unlimited';
      enablePhotoOptimizePrompt.value = false;
      uploadedImagesPhoto.value = [];
      combinedItemsPhoto.value = [];
      inputContentPhoto.value = '';
      inputHtmlPhoto.value = '';
      inputKey.value++;
      nextTick(() => { if (editableInputRef.value) editableInputRef.value.innerHTML = ''; isInputEmpty.value = true; runTypewriter(); });
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    if (currentPhotoMode.value === 'unlimited' && pickPhotoImagesForNormalMode().rejected.length > 0) {
      showModeSwitchFileWarning.value = true;
      return;
    }
    applyPhotoNormalMode();
  }
};

const confirmUnlimitedMode = () => {
  if (contentType.value === 'video') {
    showUnlimitedModal.value = false;
    // 首次开 NSFW 会先弹这个说明框，确认后要和 switchVideoMode 走同一条路：
    // 提示词保留、参数不动，只按新档位筛掉超标的参考文件。不能再全清。
    const prevLimitMode = videoLimitMode.value;
    // 当前版本在无限制模式下还能选就不动，选不了了才回落
    const nextVersion = pickVideoVersion(
      selectedNsfwVersion.value,
      videoVersionsFor('unlimited', selectedVideoMultimodal.value),
    );
    requestVideoLimitModeChange(videoLimitModeOf(nextVersion, 'unlimited'), () => {
      stashCurrentVideoPrompt();
      currentVideoMode.value = 'unlimited';
      selectedNsfwVersion.value = nextVersion;
      enableVideoOptimizePrompt.value = false;
      applyVideoLimitModeChange(prevLimitMode);
      restoreEditableInput('video');
    });
    return;
  }
  if (contentType.value === 'comic') {
    currentComicMode.value = 'unlimited';
    closeComicInputDropdowns();
  } else if (contentType.value === 'novel') {
    currentNovelMode.value = 'unlimited';
    closeNovelInputDropdowns();
    selectedInsertImage.value = 4;
  } else if (contentType.value === 'drama') {
    currentDramaMode.value = 'unlimited';
    closeDramaInputDropdowns();
  } else if (contentType.value === 'photo') {
    currentPhotoMode.value = 'unlimited';
    enablePhotoOptimizePrompt.value = false;
    uploadedImagesPhoto.value = [];
    combinedItemsPhoto.value = [];
    inputContentPhoto.value = '';
    inputHtmlPhoto.value = '';
    inputKey.value++;
    nextTick(() => { if (editableInputRef.value) editableInputRef.value.innerHTML = ''; isInputEmpty.value = true; runTypewriter(); });
  }
  showUnlimitedModal.value = false;
};

const selectCharacter = (characters: any[]) => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  // Check total count before adding new characters
  const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length + characters.length;
  if (totalItems > 7) {
    toast(t('home.error.maxItemsReached'));
    showCharacterModal.value = false;
    return;
  }

  // Append new characters instead of replacing
  characters.forEach(newChar => {
    // Check if character is already selected
    if (currentSelectedCharacters.value.some(c => c.id === newChar.id)) {
      // Show toast if trying to add duplicate character
      toast(t('home.characterSelect.alreadySelected'));
    } else {
      currentSelectedCharacters.value.push(newChar);
      // Add to combined items array with type information
      currentCombinedItems.value.push({ ...newChar, type: 'character' });

      // Insert character tag into input-textarea
      if (editableInputRef.value) {
        const target = editableInputRef.value;

        // Clear any existing content if input is empty
        if (target.textContent?.trim() === '') {
          target.innerHTML = '';
        }

        // Create character tag
        const characterTag = document.createElement('span');
        characterTag.className = 'character-tag-input';
        characterTag.contentEditable = 'false'; // Make the character tag non-editable
        characterTag.dataset.characterId = newChar.id;
        characterTag.dataset.itemId = newChar.id;

        // Create image element
        const img = document.createElement('img');
        img.src = newChar.image;
        img.alt = newChar.name;
        img.className = 'character-tag-img';

        // Create text node with character name
        const textNode = document.createTextNode(newChar.name);

        // Append image and text to tag
        characterTag.appendChild(img);
        characterTag.appendChild(textNode);

        // Append character tag to the end
        target.appendChild(characterTag);

        // 标签后面补一个不断行空格：光标要落在真实文本节点里，否则输入法
        // 在 contenteditable="false" 的标签旁边没有组合目标，中文会被拆开
        const spaceNode = document.createTextNode('\u00A0');
        target.appendChild(spaceNode);

        // Focus the input to ensure cursor is visible
        target.focus();

        // 光标放进空格节点内部
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStart(spaceNode, spaceNode.length);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Update input empty state (Vue will handle placeholder)
        isInputEmpty.value = false;

        previousInputHtml.value = target.innerHTML;
      }
    }
  });

  // Do not save to local storage - only characters from CharacterLibrary should be cached

  showCharacterModal.value = false;
};

const removeCharacter = (character: any) => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentCombinedItems = getCombinedItems();

  // First, remove references from input-textarea
  if (editableInputRef.value) {
    const characterTags = editableInputRef.value.querySelectorAll('.character-tag-input');
    characterTags.forEach(tag => {
      const img = tag.querySelector('img');
      if (img && (img.src.includes(character.image) || character.image.includes(img.src))) {
        // If this tag corresponds to the character being removed, remove it
        // Check if there's a space after the tag and remove it too
        const nextSibling = tag.nextSibling;
        if (nextSibling && nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
          nextSibling.remove();
        }
        tag.remove();
      }
    });

    // Update input empty state
    const inputContent = editableInputRef.value.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

  // Then remove from selectedCharacters array
  currentSelectedCharacters.value = currentSelectedCharacters.value.filter(c => c.id !== character.id);
  // Also remove from combinedItems array
  currentCombinedItems.value = currentCombinedItems.value.filter(item => !(item.type === 'character' && item.id === character.id));

  // Do not update local storage - only characters from CharacterLibrary should be cached
};


// Content type selection
const selectContentType = (type: string) => {
  const i18nToUrlLang: Record<string, string> = { 'jp': 'ja', 'en': 'en', 'zh': 'zh-cn', 'tc': 'zh-tw' };
  const urlLang = i18nToUrlLang[locale.value] || 'ja';
  const targetPath = `/${urlLang}/${type}`;
  // 用 router.replace 而非 history.replaceState：后者不会更新 vue-router 的 route，
  // 导致 App.vue 里依赖 route 的 canonical/alternate/hreflang 不会随内容类型切换而更新。
  if (route.path !== targetPath) {
    router.replace(targetPath);
  }

  // 离开当前 tab 前，把富文本框里的内容同步回 ref。
  // 这一步必须在改 contentType 之前做：切换之后 DOM 还没更新，
  // 那时读到的还是上一个 tab 的输入框。
  if (isDraftTab(contentType.value)) {
    syncEditableInputToDraft(contentType.value);
  }

  // 各 tab 的输入、参考图、选项都由草稿保留，这里不再清空（视频见下）。
  // 图片 tab 的内容、模式、画质 / 比例以前在这里被清掉，切走再回来就没了，现在一并保留。
  // 做同款 / 做续集 / 图片做视频这些来源标记也跟各自 tab 的草稿一起保留，
  // 提交时只对回填时所在的 tab 生效（见 isMakeSameOn），不会串到别的 tab。
  previousInputHtml.value = '';

  // Switch content type
  contentType.value = type;

  // 进入视频 tab：回到离开前所在的模式，并把那一桶内容写回。
  // 离开视频 tab：内容已在上面的 syncEditableInputToDraft 里存好，这里什么都不用做。
  if (type === 'video') {
    selectedVideoMultimodal.value = lastVideoMode.value;
    applyVideoDraft(lastVideoMode.value);
    migrateVideoParams();
  }

  // 图片 / 视频的「优化提示词」开关跟各自的草稿一起保留，切去别的 tab 再回来不重置；
  // 切模式 / 档位时由各自的流程清。

  // Update SEO meta tags when switching content type
  setSeoMeta(type);

  // 回填新 tab 的富文本内容（非草稿 tab 仍然清空）
  restoreEditableInput(type);
};

const handleMakeVideo = async (imageUrl: string, isNsfw: boolean) => {
  const isUnlimited = isNsfw && userRegion.value;

  contentType.value = 'video';
  setSeoMeta('video');

  if (isUnlimited) {
    currentVideoMode.value = 'unlimited';
    enableVideoOptimizePrompt.value = false;
  } else {
    currentVideoMode.value = 'normal';
    enableVideoOptimizePrompt.value = false;
  }

  // 下面回填的是 720P / 30s，只有超级版支持，极速版放出后默认档位不再是它，要跟着定死
  selectedNsfwVersion.value = 'super';
  selectedVideoMultimodal.value = 'multimodal';
  selectedVideoRatio.value = '16:9';
  selectedVideoQuality.value = '720P';
  selectedVideoDuration.value = '30';

  isMakeVideoMode.value = true;

  const imgItem = {
    id: Date.now().toString(),
    name: 'image1',
    image: imageUrl,
    type: 'image' as const
  };
  uploadedImagesVideo.value = [imgItem];
  selectedCharactersVideo.value = [];
  uploadedVideosVideo.value = [];
  uploadedAudiosVideo.value = [];
  combinedItemsVideo.value = [imgItem];

  isInputEmptyVideo.value = false;
  isInputEmpty.value = false;

  nextTick(() => {
    if (editableInputRef.value) {
      editableInputRef.value.innerHTML = '';
      const itemTag = document.createElement('span');
      itemTag.className = 'image-tag';
      itemTag.contentEditable = 'false';
      itemTag.dataset.itemId = imgItem.id;
      const img = document.createElement('img');
      img.src = imgItem.image;
      img.alt = imgItem.name;
      img.className = 'image-tag-img';
      itemTag.appendChild(img);
      const textNode = document.createTextNode(`${t('home.img')}1`);
      itemTag.appendChild(textNode);
      editableInputRef.value.appendChild(itemTag);

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStartAfter(itemTag);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    isInputEmpty.value = false;

    const token = localStorage.getItem('token');
    if (!token) {
      pinStickyInput();
      return;
    }
    // 回填后输入框强制吸底，页面停在哪儿都固定在底部
    pinStickyInput();
    focusCurrentInput();
  });
};

// 回显时，输入框里的引用标签和右侧的图片 / 角色列表要靠同一个 id 对上
// （删掉列表里某一项时，是按标签上的 data-item-id 去找要摘掉的标签）。
// 接口给的 others.list / addition_characters 不一定带 id，回显前先统一补上，
// 之后格式化标签和生成列表用的都是这一份，id 才对得上。
function ensureRefIds(list: any, prefix: string): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((it: any, idx: number) => ({ ...(it || {}), id: it?.id || `${prefix}_${Date.now()}_${idx}` }));
}

// 输入框里「用户真正敲进去的文字」：递归收集所有文本节点，跳过 contenteditable=false 的引用标签。
// 判断 @ 是否在光标前一位时用的就是它，得和 getCursorPosition 的口径一致（后者也是递归算的），
// 只数直接子节点的话，回显内容一旦有嵌套结构，光标位置和文本就对不上，@ 下拉永远弹不出来。
function collectEditableText(root: HTMLElement): string {
  let text = '';
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      text += node.textContent || '';
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    if (el !== root && el.hasAttribute('contenteditable') && el.contentEditable === 'false') return;
    el.childNodes.forEach(walk);
  };
  walk(root);
  return text;
}

const formatReplayContent = (content: string, list: any[], chars: any[] = []) => {
  if (!content) return '';
  const getList = list || [];

  const getTagHtml = (index: string, tagType: string, originalMatch: string) => {
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

    const filteredList = getList.filter((i: any) => i.type === targetType);
    const item = filteredList[arrayIndex];

    if (item) {
      const imgUrl = item.image || item.url || '';
      let tagClass = 'image-tag';
      let innerClass = 'image-tag-img';
      let iconUrl = imgUrl;
      let label = '';

      if (item.type === 'audio') {
        tagClass = 'audio-tag';
        innerClass = 'audio-tag-img';
        iconUrl = audioIcon;
        label = `${t('home.audio')}${refIndex}`;
      } else if (item.type === 'video') {
        tagClass = 'video-tag';
        innerClass = 'video-tag-img';
        iconUrl = item.cover || imgUrl;
        label = `${t('home.video')}${refIndex}`;
      } else {
        label = `${t('home.img')}${refIndex}`;
      }

      return `<span class="${tagClass}" contenteditable="false" data-item-id="${item.id || ''}"><img src="${iconUrl}" class="${innerClass}" />${label}</span>`;
    }

    return originalMatch.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // 角色引用 <chr_N>：N 是角色在 addition_characters 里的序号（生成时按 selectedCharacters 的顺序编的）。
  // 还原成和手动 @ 选角色时一样的 character-tag-input 标签，data-item-id 用列表项的 id，删角色时才能对上。
  const getCharTag = (index: string, originalMatch: string) => {
    const c = chars[parseInt(index) - 1];
    if (!c) return originalMatch.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const image = c.image || c.main_image_url || c.cover || c.url || '';
    const name = c.name || `character${index}`;
    return `<span class="character-tag-input" contenteditable="false" data-character-id="${c.id}" data-item-id="${c.id}"><img src="${image}" alt="${name}" class="character-tag-img" />${name}</span>`;
  };

  let result = content;

  result = result.replace(/<vid_(\d+)>/gi, (match, index) => getTagHtml(index, 'vid', match));
  result = result.replace(/<vid_(\d+)><\/vid_\d+>/gi, (match, index) => getTagHtml(index, 'vid', match));
  result = result.replace(/<aud_(\d+)>/gi, (match, index) => getTagHtml(index, 'aud', match));
  result = result.replace(/<aud_(\d+)><\/aud_\d+>/gi, (match, index) => getTagHtml(index, 'aud', match));
  result = result.replace(/<ref_(\d+)>/gi, (match, index) => getTagHtml(index, 'ref', match));
  result = result.replace(/<ref_(\d+)><\/ref_\d+>/gi, (match, index) => getTagHtml(index, 'ref', match));
  result = result.replace(/&lt;vid_(\d+)&gt;/gi, (match, index) => getTagHtml(index, 'vid', match));
  result = result.replace(/&lt;vid_(\d+)&gt;&lt;\/vid_\d+&gt;/gi, (match, index) => getTagHtml(index, 'vid', match));
  result = result.replace(/&lt;aud_(\d+)&gt;/gi, (match, index) => getTagHtml(index, 'aud', match));
  result = result.replace(/&lt;aud_(\d+)&gt;&lt;\/aud_\d+&gt;/gi, (match, index) => getTagHtml(index, 'aud', match));
  result = result.replace(/&lt;ref_(\d+)&gt;/gi, (match, index) => getTagHtml(index, 'ref', match));
  result = result.replace(/&lt;ref_(\d+)&gt;&lt;\/ref_\d+&gt;/gi, (match, index) => getTagHtml(index, 'ref', match));


  // <chr_N> 不转成标签的话，浏览器会把它当未知元素，后面的文字全被套进去，
  // innerHTML 再读出来就多出一串 </chr_N>；成对写法和转义写法也一并处理，残留的闭合标签直接丢掉
  result = result.replace(/<chr_(\d+)><\/chr_\d+>/gi, (m, i) => getCharTag(i, m));
  result = result.replace(/<chr_(\d+)>/gi, (m, i) => getCharTag(i, m));
  result = result.replace(/<\/chr_\d+>/gi, '');
  result = result.replace(/&lt;chr_(\d+)&gt;&lt;\/chr_\d+&gt;/gi, (m, i) => getCharTag(i, m));
  result = result.replace(/&lt;chr_(\d+)&gt;/gi, (m, i) => getCharTag(i, m));
  result = result.replace(/&lt;\/chr_\d+&gt;/gi, '');

  return result;
};

const handleMakeSimilar = async (item: any) => {
  const sessionId = item.session_id;
  if (!sessionId) return;

  // 先确保地区结果已就绪再判断。以前是 hasFetchedRegion && !userRegion：
  // 地区还没拉回来时 hasFetchedRegion 是 false，这条拦截会被整个跳过，
  // 中国地区点首页卡片的做同款就漏进去了（首页 onMounted 慢一步就会碰上）。
  await getCountry();
  if (!userRegion.value) {
    toast(t('home.makeSimilarChinaNotSupported'));
    return;
  }

  isMakeSimilarLoading.value = true;
  isMakeSameMode.value = true;
  isMakeSimilar.value = true;
  makeSimilarSessionId.value = sessionId;
  originSessionId.value = sessionId;

  try {
    const res = await api.getProjectInfoPublic(sessionId) as any;
    if (res.code != 200 && res.code != 0) {
      toast(res.message || t('home.error.generateFailed'));
      return;
    }

    const data = res.data || {};
    const userSelected = data.user_selected || {};
    const storyType = userSelected.story_type || data.story_type || '';
    const others = userSelected.others || {};
    // 先给参考素材和角色补上稳定 id，回显的标签和右侧列表共用（见 ensureRefIds）
    others.list = ensureRefIds(others.list, 'ref');
    userSelected.addition_characters = ensureRefIds(userSelected.addition_characters, 'chr');
    const content = data.topic || others.content || '';
    const optimizedPrompt = data.optimized_prompt || '';
    const shouldReplayOptimizedPrompt =
      (storyType == 'simple_image' || storyType == 'simple_video') &&
      userSelected.enable_optimize_prompt == true &&
      Boolean(optimizedPrompt);
    const replayContent = shouldReplayOptimizedPrompt ? optimizedPrompt : content;

    const typeToContentType: Record<string, string> = {
      'simple_video': 'video',
      'manju': 'drama',
      'simple_image': 'photo',
      'manhua': 'comic',
      'novel': 'novel'
    };
    const targetContentType = typeToContentType[storyType];
    if (!targetContentType) {
      toast(t('home.error.generateFailed'));
      return;
    }

    contentType.value = targetContentType;
    makeSameTab.value = targetContentType;
    setSeoMeta(targetContentType);

    const storyMode = userSelected.story_mode;
    const mode = storyMode == 'nsfw' ? 'unlimited' : (storyMode || 'normal');
    const safeMode = isTeenager.value && mode == 'unlimited' ? 'normal' : mode;

    if (targetContentType === 'video') {
      currentVideoMode.value = safeMode;
      if (userSelected.ratio) selectedVideoRatio.value = userSelected.ratio;
      if (userSelected.simple_video_resolution) selectedVideoQuality.value = userSelected.simple_video_resolution.toUpperCase();
      if (userSelected.simple_video_duration) selectedVideoDuration.value = userSelected.simple_video_duration.toString();
      enableVideoOptimizePrompt.value = shouldReplayOptimizedPrompt ? false : (userSelected.enable_optimize_prompt === true);

      const generateMode = userSelected.simple_video_generate_mode;
      if (generateMode == 'first_last_frames') {
        selectedVideoMultimodal.value = 'startEndFrames';
        const refImages = userSelected.reference_images || [];
        startFrameImage.value = refImages[0]?.url || '';
        endFrameImage.value = refImages[1]?.url || '';
      } else if (generateMode == 'video_edit') {
        selectedVideoMultimodal.value = 'videoModify';
      } else if (generateMode == 'video_extension') {
        selectedVideoMultimodal.value = 'videoExtend';
      } else {
        selectedVideoMultimodal.value = 'multimodal';
      }

      // 做同款：档位按原作的设置回填。极速版放出后默认档位不再是超级版，
      // 不显式回填的话，档位会停在极速版、参数却是原作的 720P / 30s，对不上。
      // 原作档位在「当前模式 × 视频模式」下不可选时，按 加强版 -> 超级版 -> 极速版 落到第一个能用的。
      selectedNsfwVersion.value = pickVideoVersion(
        fromModelType(userSelected.video_nsfw_model_type),
        videoVersionsFor(safeMode, selectedVideoMultimodal.value),
      );

      const list = others.list || [];
      const refImages = userSelected.reference_images || [];
      uploadedImagesVideo.value = list.filter((i: any) => i.type !== 'video' && i.type !== 'audio').map((img: any, idx: number) => ({
        id: img.id || Date.now() + idx.toString(),
        name: img.name || `image${idx + 1}`,
        image: img.image || img.url || '',
        type: 'image'
      }));
      uploadedVideosVideo.value = list.filter((i: any) => i.type === 'video').map((v: any, idx: number) => ({
        id: v.id || Date.now() + idx.toString(),
        name: v.name || `video${idx + 1}`,
        image: v.cover || v.image || v.url || '',
        url: v.url || v.image || '',
        type: 'video',
        cover: v.cover || '',
        duration: v.duration || 0
      }));
      uploadedAudiosVideo.value = list.filter((i: any) => i.type === 'audio').map((a: any, idx: number) => ({
        id: a.id || Date.now() + idx.toString(),
        name: a.name || `audio${idx + 1}`,
        image: a.image || a.url || '',
        url: a.url || a.image || '',
        type: 'audio'
      }));
      selectedCharactersVideo.value = [];
      combinedItemsVideo.value = [...uploadedImagesVideo.value, ...uploadedVideosVideo.value, ...uploadedAudiosVideo.value];

      const formattedReplayContent = formatReplayContent(replayContent, others.list || [], userSelected.addition_characters);

      nextTick(() => {
        if (editableInputRef.value) {
          editableInputRef.value.innerHTML = formattedReplayContent;
          isInputEmpty.value = !replayContent.trim();
        }
      });

    } else if (targetContentType === 'photo') {
      currentPhotoMode.value = safeMode;
      if (userSelected.ratio) selectedPhotoRatio.value = userSelected.ratio;
      if (userSelected.simple_image_resolution) selectedPhotoQuality.value = userSelected.simple_image_resolution;
      enablePhotoOptimizePrompt.value = shouldReplayOptimizedPrompt ? false : (userSelected.enable_optimize_prompt === true);

      const list = others.list || [];
      uploadedImagesPhoto.value = list.map((img: any, idx: number) => ({
        id: img.id || Date.now() + idx.toString(),
        name: img.name || `image${idx + 1}`,
        image: img.image || img.url || '',
        type: 'image'
      }));
      combinedItemsPhoto.value = [...uploadedImagesPhoto.value];

      const formattedReplayContent = formatReplayContent(replayContent, others.list || [], userSelected.addition_characters);

      nextTick(() => {
        if (editableInputRef.value) {
          editableInputRef.value.innerHTML = formattedReplayContent;
          isInputEmpty.value = !replayContent.trim();
        }
      });

    } else if (targetContentType === 'comic') {
      currentComicMode.value = safeMode;

      const list = others.list || [];
      const charList = userSelected.addition_characters || [];
      uploadedImagesComic.value = list.filter((i: any) => i.type !== 'character').map((img: any, idx: number) => ({
        id: img.id || Date.now() + idx.toString(),
        name: img.name || `image${idx + 1}`,
        image: img.image || img.url || '',
        type: 'image'
      }));
      selectedCharactersComic.value = charList.map((c: any, idx: number) => ({
        id: c.id || Date.now() + idx.toString(),
        name: c.name || `character${idx + 1}`,
        // 生成时角色头像是按 main_image_url 存进 addition_characters 的（见 addition_characters 的组装），
        // 回显只认 image 的话取不到，右侧列表就会落到默认头像
        image: c.image || c.main_image_url || c.cover || c.url || '',
        type: 'character'
      }));
      combinedItemsComic.value = [...uploadedImagesComic.value, ...selectedCharactersComic.value];

      const formattedContent = formatReplayContent(content, others.list || [], userSelected.addition_characters);

      nextTick(() => {
        if (editableInputRef.value) {
          editableInputRef.value.innerHTML = formattedContent;
          isInputEmpty.value = !content.trim();
        }
      });

    } else if (targetContentType === 'drama') {
      currentDramaMode.value = safeMode;

      const list = others.list || [];
      const charList = userSelected.addition_characters || [];
      uploadedImagesDrama.value = list.filter((i: any) => i.type !== 'character').map((img: any, idx: number) => ({
        id: img.id || Date.now() + idx.toString(),
        name: img.name || `image${idx + 1}`,
        image: img.image || img.url || '',
        type: 'image'
      }));
      selectedCharactersDrama.value = charList.map((c: any, idx: number) => ({
        id: c.id || Date.now() + idx.toString(),
        name: c.name || `character${idx + 1}`,
        // 生成时角色头像是按 main_image_url 存进 addition_characters 的（见 addition_characters 的组装），
        // 回显只认 image 的话取不到，右侧列表就会落到默认头像
        image: c.image || c.main_image_url || c.cover || c.url || '',
        type: 'character'
      }));
      combinedItemsDrama.value = [...uploadedImagesDrama.value, ...selectedCharactersDrama.value];

      const formattedContent = formatReplayContent(content, others.list || [], userSelected.addition_characters);

      nextTick(() => {
        if (editableInputRef.value) {
          editableInputRef.value.innerHTML = formattedContent;
          isInputEmpty.value = !content.trim();
        }
      });

    } else if (targetContentType === 'novel') {
      currentNovelMode.value = safeMode;
      if (userSelected.total_words) {
        const words = userSelected.total_words;
        if (words >= 300000) selectedWordCount.value = '300K';
        else if (words >= 100000) selectedWordCount.value = '100K';
        else selectedWordCount.value = '30K';
      }
      if (userSelected.language) selectedLanguage.value = userSelected.language;
      if (userSelected.insert_image_count !== undefined) selectedInsertImage.value = userSelected.insert_image_count;

      novelInput.value = content;
    }

    previousInputHtml.value = '';

    // 回填后输入框强制吸底，页面停在哪儿都固定在底部
    pinStickyInput();

    nextTick(() => {
      nextTick(() => {
        if (targetContentType !== 'novel') {
          const el = editableInputRef.value;
          if (el) {
            while (el.firstChild) {
              el.removeChild(el.firstChild);
            }
            el.innerHTML = formatReplayContent(replayContent || content || '', others.list || [], userSelected.addition_characters);
            isInputEmpty.value = !(replayContent || content || '').trim();
          }
        }
        if (isLoggedIn.value) {
          if (targetContentType === 'novel') {
            const ta = document.querySelector<HTMLTextAreaElement>('.input-area-box.is-expanded .novel-textarea');
            if (ta) {
              ta.focus();
              ta.setSelectionRange(ta.value.length, ta.value.length);
            }
          } else {
            const el = editableInputRef.value;
            if (el) {
              el.focus();
              const range = document.createRange();
              range.selectNodeContents(el);
              range.collapse(false);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }
      });
    });

  } catch (error) {
    console.error('Error fetching project detail for make similar:', error);
    toast(t('home.error.generateFailed'));
  } finally {
    isMakeSimilarLoading.value = false;
  }
};

const extractVideoTail = async (videoUrl: string): Promise<string> => {
  try {
    const res = await api.extractVideoTail({ video_url: videoUrl, tail_seconds: 30 }) as any;
    if ((res.code === 0 || res.code === 200) && res.data?.video_url) {
      return res.data.video_url;
    }
  } catch (e) {
    console.error('Error extracting video tail:', e);
  }
  return videoUrl;
};

const handleMakeSimilarVideo = async (item: any) => {
  if (isMakeSimilarVideoLoading.value) return;
  isMakeSimilarVideoLoading.value = true;

  try {
    const token = localStorage.getItem('token') || '';
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
    const res = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_id: item.id, fromIndexRecommend: { tab: 'hot' } }),
    }).then(r => r.json());

    if (res.code != 0 && res.code != 200) {
      toast(res.message || t('fail'));
      return;
    }

    const data = res.data.post || res.data;
    const authorId = res.data.author?.id || data.author_id || '';
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

    await getCountry();

    const isUnlimited = isNsfw && userRegion.value;

    isMakeVideoSimilarMode.value = true;
    isMakeVideoSequelMode.value = false;
    isMakeSameMode.value = true;
    makeSameTab.value = 'video';
    originPostId.value = String(data.id || item.id);

    contentType.value = 'video';
    setSeoMeta('video');

    if (isUnlimited) {
      currentVideoMode.value = 'unlimited';
      selectedNsfwVersion.value = 'super';
      overrideNormalVideoMode.value = false;
    } else {
      currentVideoMode.value = 'normal';
      overrideNormalVideoMode.value = true;
    }

    selectedVideoMultimodal.value = 'videoModify';
    enableVideoOptimizePrompt.value = false;

    uploadedVideo.value = videoUrl;
    uploadedVideoCover.value = cover || null;
    uploadedVideoDuration.value = videoDuration;

    uploadedImagesVideo.value = [];
    selectedCharactersVideo.value = [];
    combinedItemsVideo.value = [];

    nextTick(() => {
      // 输入框所在的 v-if 分支刚重建，按 data-tab + data-mode 取当前分支的元素
      const el = resolveInputEl(contentType.value);
      if (el) { el.innerHTML = ''; isInputEmpty.value = true; }

      const token = localStorage.getItem('token');
      if (!token) {
        pinStickyInput();
        return;
      }
      // 回填后输入框强制吸底，页面停在哪儿都固定在底部
      pinStickyInput();
      focusCurrentInput();
    });
  } catch (error) {
    console.error("Error fetching post detail for make similar video:", error);
    toast(t('fail'));
  } finally {
    isMakeSimilarVideoLoading.value = false;
  }
};

const handleMakeSequelFromList = async (item: any) => {
  if (isMakeSequelLoading.value) return;
  isMakeSequelLoading.value = true;

  try {
    const token = localStorage.getItem('token') || '';
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
    const res = await fetch(`${baseUrl}post/getPostDetailByListPublic`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_id: item.id, fromIndexRecommend: { tab: 'hot' } }),
    }).then(r => r.json());

    if (res.code != 0 && res.code != 200) {
      toast(res.message || t('fail'));
      return;
    }

    const data = res.data.post || res.data;
    const authorId = res.data.author?.id || data.author_id || '';
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
    await getCountry();
    await handleMakeSequelFromCache(videoUrl, cover, data.type, data.id || item.id, isNsfw, videoDuration);
  } catch (error) {
    console.error('Error fetching post detail for make sequel:', error);
    toast(t('fail'));
  } finally {
    isMakeSequelLoading.value = false;
  }
};

const handleMakeSequelFromCache = async (videoUrl: string, cover: string, type: string, postId: string, isNsfw: boolean, duration?: number) => {
  const isUnlimited = isNsfw && userRegion.value;

  isMakeExtensionMode.value = true;
  isMakeVideoSequelMode.value = true;
  isMakeVideoSimilarMode.value = false;
  originPostId.value = postId || '';
  originVideoUrlForTail.value = videoUrl;
  originSessionIdForExtension.value = postId || '';

  contentType.value = 'video';
  setSeoMeta('video');

  if (isUnlimited) {
    currentVideoMode.value = 'unlimited';
    selectedNsfwVersion.value = 'super';
    overrideNormalVideoMode.value = false;
  } else {
    currentVideoMode.value = 'normal';
    overrideNormalVideoMode.value = true;
  }

  selectedVideoMultimodal.value = 'videoExtend';
  enableVideoOptimizePrompt.value = false;

  uploadedVideo.value = videoUrl;
  uploadedVideoCover.value = cover || null;
  uploadedVideoDuration.value = duration || 0;

  uploadedImagesVideo.value = [];
  selectedCharactersVideo.value = [];
  combinedItemsVideo.value = [];

  nextTick(() => {
    // 输入框所在的 v-if 分支刚重建，按 data-tab + data-mode 取当前分支的元素
    const el = resolveInputEl(contentType.value);
    if (el) { el.innerHTML = ''; isInputEmpty.value = true; }

    const token = localStorage.getItem('token');
    if (!token) {
      pinStickyInput();
      return;
    }
    // 回填后输入框强制吸底，页面停在哪儿都固定在底部
    pinStickyInput();
    focusCurrentInput();
  });
};

function goMakeSequelSubscribe() {
  showMakeSequelSubscribeModal.value = false;
  if (!checkLogin()) return;
  if (makeSequelAuthorId.value) {
    router.push(`/subscription-payment?id=${makeSequelAuthorId.value}`);
  }
}

// Mode dropdown for novel mode
const toggleModeDropdown = () => {
  showModeDropdown.value = !showModeDropdown.value;
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
  showVideoModeDropdown.value = false;
};

// Mode dropdown for video mode
const toggleVideoModeDropdown = () => {
  showVideoModeDropdown.value = !showVideoModeDropdown.value;
  showModeDropdown.value = false;
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
};

// Word count and language selection methods
const toggleWordCountDropdown = () => {
  showWordCountDropdown.value = !showWordCountDropdown.value;
  showLanguageDropdown.value = false;
  showModeDropdown.value = false;
  showInsertImageDropdown.value = false;
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
  showWordCountDropdown.value = false;
  showModeDropdown.value = false;
  showInsertImageDropdown.value = false;
};

const toggleInsertImageDropdown = () => {
  showInsertImageDropdown.value = !showInsertImageDropdown.value;
  showWordCountDropdown.value = false;
  showLanguageDropdown.value = false;
  showModeDropdown.value = false;
};

const selectInsertImage = (value: number) => {
  selectedInsertImage.value = value;
  showInsertImageDropdown.value = false;
};

const selectWordCount = (value: string) => {
  selectedWordCount.value = value;
  showWordCountDropdown.value = false;
};

const selectLanguage = (item: any) => {
  selectedLanguage.value = item.value;
  showLanguageDropdown.value = false;

  // Update SEO meta tags when language changes
  nextTick(() => {
    const seoTypeMap: Record<string, string> = { 'novel': 'novel', 'comic': 'comic', 'drama': 'drama' };
    setSeoMeta(seoTypeMap[contentType.value]);
  });
};

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.novel-selector') && !target.closest('.video-selector') && !target.closest('.photo-settings-selector') && !target.closest('.video-settings-selector') && !target.closest('.at-dropdown')) {
    showWordCountDropdown.value = false;
    showLanguageDropdown.value = false;
    showModeDropdown.value = false;
    showVideoModeDropdown.value = false;
    showPhotoSettings.value = false;
    showVideoMultimodalDropdown.value = false;
    showVideoSettings.value = false;
    showInsertImageDropdown.value = false;
    showNsfwVersionDropdown.value = false;
  }
  collapseStickyInputOnOutsideClick(target);
};


const generateVideo = async () => {
  trackClickGenerateButton();
  if (isGeneratingVideo.value) return;
  isGeneratingVideo.value = true;

  // 走 checkLogin：保存做同款/做续集的来源 + 记住回跳地址，
  // 否则登录回来来源没了、输入框也空了
  if (!checkLogin()) {
    isGeneratingVideo.value = false;
    return;
  }

  let inputContent = '';

  if (selectedVideoMultimodal.value === 'startEndFrames') {
    // 首尾帧的输入框是独立的 framesInput，不是小说 tab 的 novelInput
    inputContent = framesInput.value || '';
  } else {
    if (!editableInputRef.value) {
      toast(t('home.error.emptyInput'));
      isGeneratingVideo.value = false;
      return;
    }
    inputContent = editableInputRef.value.textContent || '';
  }

  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    isGeneratingVideo.value = false;
    return;
  }

  // 首尾帧模式验证：首帧必须上传，尾帧可以不上传
  if (selectedVideoMultimodal.value === 'startEndFrames' && !startFrameImage.value) {
    toast(t('home.error.startFrameRequired'));
    isGeneratingVideo.value = false;
    return;
  }

  if (selectedVideoMultimodal.value === 'videoModify' && !uploadedVideo.value) {
    toast(t('home.error.videoModifyRequired'));
    isGeneratingVideo.value = false;
    return;
  }

  if (selectedVideoMultimodal.value === 'videoExtend' && !uploadedVideo.value) {
    toast(t('home.error.videoModifyRequired'));
    isGeneratingVideo.value = false;
    return;
  }

  doGenerateVideo();
};

const doGenerateVideo = async () => {
  // Fetch latest balance before checking
  try {
    const balanceResponse = await api.userBalance() as any;
    if (balanceResponse.code == 200) {
      balanceInfo.value = balanceResponse.data;
    } else {
      toast(locale.value == 'en' ? balanceResponse.msg : locale.value == 'zh' ? balanceResponse.msg_cn : locale.value == 'tc' ? balanceResponse.msg_tc : balanceResponse.msg_jp);
    }
  } catch (error) {
    console.log('Failed to fetch balance:', error);
  }

  try {
    const token = localStorage.getItem('token') || '';

    let inputContent = '';
    if (selectedVideoMultimodal.value === 'startEndFrames') {
      // 首尾帧的输入框是独立的 framesInput，不是小说 tab 的 novelInput
      inputContent = framesInput.value || '';
    } else if (editableInputRef.value) {
      inputContent = editableInputRef.value.textContent || '';
    }

    // Default video settings
    const videoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value,
      aspectRatio: "9:16"
    };

    // 生成图片、视频和音频的索引映射（按类型单独计数）
    const imageMap: Record<string, number> = {};
    const videoMap: Record<string, number> = {};
    const audioMap: Record<string, number> = {};

    let imageCount = 0;
    let videoCount = 0;
    let audioCount = 0;

    const isVideoExtendOrModify = selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify';
    if (isVideoExtendOrModify && uploadedVideo.value) {
      videoCount = 1;
    }

    // 按类型单独计数
    combinedItemsVideo.value.forEach((item) => {
      if (item.type === 'image') {
        imageCount++;
        imageMap[item.id] = imageCount;
      } else if (item.type === 'video') {
        videoCount++;
        videoMap[item.id] = videoCount;
      } else if (item.type === 'audio') {
        audioCount++;
        audioMap[item.id] = audioCount;
      }
    });

    // 先创建一个干净的文本内容，不包含标签
    let processedContent = '';
    if (editableInputRef.value) {
      // 遍历所有子节点，构建干净的文本内容
      const processNode = (node: Node) => {
        if (node.nodeType == 3) { // 文本节点
          processedContent += node.textContent || '';
        } else if (node.nodeType == 1) { // 元素节点
          const element = node as Element;
          if (element.classList.contains('image-tag')) {
            // 处理图片标签
            const imgElement = element.querySelector('img');
            if (imgElement) {
              const image = combinedItemsVideo.value.find(item =>
                item.type === 'image' && (item.image === imgElement.src || imgElement.src.includes(item.image))
              );
              if (image) {
                const imgIndex = imageMap[image.id] || 1;
                processedContent += `<ref_${imgIndex}>`;
              }
            }
          } else if (element.classList.contains('video-tag')) {
            // 处理视频标签
            const imgElement = element.querySelector('img');
            const itemId = (element as HTMLElement).dataset.itemId;
            if (itemId === 'uploaded-video' && isVideoExtendOrModify && uploadedVideo.value) {
              processedContent += `<vid_1>`;
            } else if (imgElement) {
              const video = combinedItemsVideo.value.find(item =>
                item.type === 'video' && (item.image === imgElement.src || imgElement.src.includes(item.image))
              );
              if (video) {
                const videoIndex = videoMap[video.id] || 1;
                processedContent += `<vid_${videoIndex}>`;
              }
            }
          } else if (element.classList.contains('audio-tag')) {
            const itemId = (element as HTMLElement).dataset.itemId;
            if (itemId) {
              const audio = combinedItemsVideo.value.find(item =>
                item.type === 'audio' && item.id === itemId
              );
              if (audio) {
                const audioIndex = audioMap[audio.id] || 1;
                processedContent += `<aud_${audioIndex}>`;
              }
            }
          } else {
            // 处理其他元素节点
            for (let i = 0; i < element.childNodes.length; i++) {
              processNode(element.childNodes[i]);
            }
          }
        }
      };

      // 处理输入框的所有子节点
      for (let i = 0; i < editableInputRef.value.childNodes.length; i++) {
        processNode(editableInputRef.value.childNodes[i]);
      }
    } else {
      processedContent = inputContent.trim();
    }

    const sessionId = uuidv4();

    const videoGenerateMode = selectedVideoMultimodal.value == 'multimodal' ? 'multi_modal_reference' :
                              selectedVideoMultimodal.value == 'startEndFrames' ? 'first_last_frames' :
                              selectedVideoMultimodal.value == 'videoModify' ? 'video_edit' : 'video_extension';

    let reference_images: any[] = [];
    if (selectedVideoMultimodal.value === 'startEndFrames') {
      if (startFrameImage.value) {
        reference_images.push({ type: "first_frame", url: startFrameImage.value });
      }
      if (endFrameImage.value) {
        reference_images.push({ type: "last_frame", url: endFrameImage.value });
      }
    } else if (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify') {
      reference_images = combinedItemsVideo.value.filter(item => item.type === 'image').map(item => item.image);
    } else {
      reference_images = combinedItemsVideo.value.filter(item => item.type === 'image').map(item => item.image);
    }

    let reference_videos: any[] = [];
    if (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify') {
      if (uploadedVideo.value) {
        let effectiveVideoUrl = uploadedVideo.value;
        // 做续集：原视频要先取尾 30 秒再送去生成。
        // 裁剪放在这里而不是点「做续集」的入口 —— 那时用户还没决定要不要生成，
        // 提前调等于白烧一次转码，还会把跳转卡在 await 上。
        if (isMakeExtensionMode.value && originVideoUrlForTail.value) {
          try {
            const tailUrl = await extractVideoTail(originVideoUrlForTail.value);
            if (tailUrl) {
              effectiveVideoUrl = tailUrl;
              uploadedVideo.value = tailUrl;
            }
          } catch (e) {
            console.error('Error extracting video tail:', e);
            toast(t('fail'));
            isGeneratingVideo.value = false;
            return;
          }
        }
        reference_videos = [effectiveVideoUrl];
      }
      reference_videos = reference_videos.concat(combinedItemsVideo.value.filter(item => item.type === 'video').map(item => item.url || item.videoUrl || item.image));
    } else {
      reference_videos = combinedItemsVideo.value.filter(item => item.type === 'video').map(item => item.url || item.videoUrl || item.image);
    }

    const params = {
      ratio: (selectedVideoMultimodal.value === 'startEndFrames' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend') ? '9:16' : selectedVideoRatio.value,
      language: locale.value == 'zh' ? 'cn' : locale.value,
      story_type: "simple_video",
      story_mode: effectiveVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      // 模型档位：极速版 fast / 加强版 plus / 超级版 super。普通模式也能选极速与超级，所以始终要传。
      video_nsfw_model_type: toModelType(selectedNsfwVersion.value),
      story_style: "",
      reference_images: reference_images,
      reference_videos: reference_videos,
      reference_audios: combinedItemsVideo.value.filter(item => item.type === 'audio').map(item => item.image),
      emotion: "",
      others: {
        content: processedContent.replace(/\u00A0/g, ' '),
        list: (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify') && uploadedVideo.value
          ? [{ id: 'uploaded-video', name: 'uploaded-video', type: 'video', image: uploadedVideo.value, cover: uploadedVideoCover.value || '', url: uploadedVideo.value }, ...combinedItemsVideo.value]
          : combinedItemsVideo.value
      },
      simple_video_resolution: selectedVideoQuality.value.toLowerCase(),
      simple_video_duration: (selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend') ? Math.ceil(uploadedVideoDuration.value || 30) : (videoLimitMode.value === 'unlimited' && selectedVideoMultimodal.value === 'multimodal') ? Math.ceil(parseInt(selectedVideoDuration.value) + getUploadedVideoDurationSum()) : parseInt(selectedVideoDuration.value),
      simple_video_generate_mode: videoGenerateMode,
      enable_optimize_prompt: (selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend') ? false : enableVideoOptimizePrompt.value,
      ...(isMakeSameOn('video') ? { is_make_same: 1, ...(isMakeVideoSimilarMode.value ? { origin_post_id: originPostId.value } : { origin_session_id: originSessionId.value }) } : {}),
      ...(isMakeExtensionMode.value ? { is_make_extension: 1, origin_post_id: originPostId.value, ...(isMakeVideoSequelMode.value ? {} : { origin_session_id: originSessionIdForExtension.value }) } : {}),
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
      toast(settingsData.message || t('fail'));
      return;
    }

    const response = await api.generateSingleVideo({
      session_id: sessionId,
      topic: processedContent,
      ...(isMakeSameMode.value && !isMakeVideoSimilarMode.value ? { origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value && !isMakeVideoSequelMode.value ? { origin_session_id: originSessionIdForExtension.value } : {})
    }) as any;

    if (response.code == 200) {
      trackContentPublished(sessionId);
      router.push('/generate');

      if (editableInputRef.value) {
        editableInputRef.value.textContent = '';
        isInputEmptyVideo.value = true;
        isInputEmpty.value = true;
        selectedCharactersVideo.value = [];
        uploadedImagesVideo.value = [];
        uploadedVideosVideo.value = [];
        uploadedAudiosVideo.value = [];
        combinedItemsVideo.value = [];
        inputContentVideo.value = '';
        inputHtmlVideo.value = '';
        uploadedVideo.value = '';
        uploadedVideoCover.value = '';
        uploadedVideoDuration.value = 0;
      }
    } else {
      toast(response.message || t('fail'));
    }
  } catch (error) {
    console.log(error);
    toast(t('fail'));
  } finally {
    isGeneratingVideo.value = false;
  }
};

const generateComic = async () => {
  trackClickGenerateButton();
  if (isGeneratingComic.value) return;
  isGeneratingComic.value = true;

  // 走 checkLogin：保存做同款/做续集的来源 + 记住回跳地址，
  // 否则登录回来来源没了、输入框也空了
  if (!checkLogin()) {
    isGeneratingComic.value = false;
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    isGeneratingComic.value = false;
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    isGeneratingComic.value = false;
    return;
  }

  if (checkUnreferencedFiles()) {
    isGeneratingComic.value = false;
    pendingGenerateCallback.value = () => { isGeneratingComic.value = true; doGenerateComic(); };
    showUnreferencedFilesModal.value = true;
    return;
  }

  doGenerateComic();
};

const doGenerateComic = async () => {
  try {
    const token = localStorage.getItem('token') || '';
    const sessionId = uuidv4();

    // 生成角色和图片的索引映射
    const characterMap: Record<string, number> = {};
    const imageMap: Record<string, number> = {};

    // 角色索引基于角色列表的顺序
    selectedCharactersComic.value.forEach((character, index) => {
      characterMap[character.id] = index + 1;
    });

    // 图片索引基于图片列表的顺序
    uploadedImagesComic.value.forEach((image, index) => {
      imageMap[image.id] = index + 1;
    });

    // 先创建一个干净的文本内容，不包含标签
    let processedContent = '';
    if (editableInputRef.value) {
      // 遍历所有子节点，构建干净的文本内容
      const processNode = (node: Node) => {
        if (node.nodeType === 3) { // 文本节点
          processedContent += node.textContent || '';
        } else if (node.nodeType === 1) { // 元素节点
          const element = node as Element;
          if (element.classList.contains('character-tag-input')) {
              // 处理角色标签
              const img = element.querySelector('img');
              if (img) {
                const character = selectedCharactersComic.value.find(c =>
                  c.image == img.src || img.src.includes(c.image)
                );
                if (character) {
                  const charIndex = characterMap[character.id] || 1;
                  processedContent += `<chr_${charIndex}>`;
                }
              }
            } else if (element.classList.contains('image-tag')) {
              // 处理图片标签
              const imgElement = element.querySelector('img');
              if (imgElement) {
                const image = uploadedImagesComic.value.find(img =>
                  img.image === imgElement.src || imgElement.src.includes(img.image)
                );
                if (image) {
                  const imgIndex = imageMap[image.id] || 1;
                  processedContent += `<ref_${imgIndex}>`;
                }
              }
          } else {
            // 处理其他元素节点
            for (let i = 0; i < element.childNodes.length; i++) {
              processNode(element.childNodes[i]);
            }
          }
        }
      };

      // 处理输入框的所有子节点
      for (let i = 0; i < editableInputRef.value.childNodes.length; i++) {
        processNode(editableInputRef.value.childNodes[i]);
      }
    }

    const params = {
      ratio: "9:16",
      language: locale.value == 'zh' ? 'cn' : locale.value,
      story_type: "manhua",
      story_mode: currentComicMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: uploadedImagesComic.value.map(img => img.image),
      emotion: "",
      others: {
        content: processedContent.replace(/\u00A0/g, ' '),
        list: combinedItemsComic.value
      },
      addition_characters: selectedCharactersComic.value.map(character => ({
        id: character.id,
        name: character.name,
        desc: character.description,
        main_image_url: character.image,
        tri_view_url: character.tri_image
      })),
      ...(isMakeSameOn('comic') ? { is_make_same: 1, origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value ? { is_make_extension: 1, origin_post_id: originPostId.value, ...(isMakeVideoSequelMode.value ? {} : { origin_session_id: originSessionIdForExtension.value }) } : {}),
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code == 200 || data.code == 0) {
        trackContentPublished(sessionId);
        // window.open(`/tools/comic/${sessionId}`, '_blank');
        window.location.href = `/tools/comic/${sessionId}`;

        clearDraftFor('comic');
        inputKey.value++;
        nextTick(() => { if (editableInputRef.value) editableInputRef.value.innerHTML = ''; isInputEmpty.value = true; runTypewriter(); });
      } else {
        toast(data.message)
      }
    } else {
      toast(t('fail'));
    }
    isGeneratingComic.value = false;
  }
  catch (error) {
    console.error('Error in generateComic:', error);
    toast(t('fail'));
    isGeneratingComic.value = false;
  }
};

const generateDrama = async () => {
  trackClickGenerateButton();
  if (isGeneratingDrama.value) return;
  isGeneratingDrama.value = true;

  // 走 checkLogin：保存做同款/做续集的来源 + 记住回跳地址，
  // 否则登录回来来源没了、输入框也空了
  if (!checkLogin()) {
    isGeneratingDrama.value = false;
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    isGeneratingDrama.value = false;
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    isGeneratingDrama.value = false;
    return;
  }

  if (checkUnreferencedFiles()) {
    isGeneratingDrama.value = false;
    pendingGenerateCallback.value = () => { isGeneratingDrama.value = true; doGenerateDrama(); };
    showUnreferencedFilesModal.value = true;
    return;
  }

  doGenerateDrama();
};

const doGenerateDrama = async () => {
  try {
    const token = localStorage.getItem('token') || '';
    const sessionId = uuidv4();

    const characterMap: Record<string, number> = {};
    const imageMap: Record<string, number> = {};

    selectedCharactersDrama.value.forEach((character, index) => {
      characterMap[character.id] = index + 1;
    });

    uploadedImagesDrama.value.forEach((image, index) => {
      imageMap[image.id] = index + 1;
    });

    let processedContent = '';
    if (editableInputRef.value) {
      const processNode = (node: Node) => {
        if (node.nodeType === 3) {
          processedContent += node.textContent || '';
        } else if (node.nodeType === 1) {
          const element = node as Element;
          if (element.classList.contains('character-tag-input')) {
            const img = element.querySelector('img');
            if (img) {
              const character = selectedCharactersDrama.value.find(c =>
                c.image == img.src || img.src.includes(c.image)
              );
              if (character) {
                const charIndex = characterMap[character.id] || 1;
                processedContent += `<chr_${charIndex}>`;
              }
            }
          } else if (element.classList.contains('image-tag')) {
            const imgElement = element.querySelector('img');
            if (imgElement) {
              const image = uploadedImagesDrama.value.find(img =>
                img.image === imgElement.src || imgElement.src.includes(img.image)
              );
              if (image) {
                const imgIndex = imageMap[image.id] || 1;
                processedContent += `<ref_${imgIndex}>`;
              }
            }
          } else {
            for (let i = 0; i < element.childNodes.length; i++) {
              processNode(element.childNodes[i]);
            }
          }
        }
      };

      for (let i = 0; i < editableInputRef.value.childNodes.length; i++) {
        processNode(editableInputRef.value.childNodes[i]);
      }
    }

    const params = {
      ratio: "9:16",
      language: locale.value == 'zh' ? 'cn' : locale.value,
      story_type: "manju",
      story_mode: currentDramaMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: uploadedImagesDrama.value.map(img => img.image),
      emotion: "",
      others: {
        content: processedContent.replace(/\u00A0/g, ' ').trim(),
        list: combinedItemsDrama.value
      },
      addition_characters: selectedCharactersDrama.value.map(character => ({
        id: character.id,
        name: character.name,
        desc: character.description,
        main_image_url: character.image,
        tri_view_url: character.tri_image
      })),
      ...(isMakeSameOn('drama') ? { is_make_same: 1, origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value ? { is_make_extension: 1, origin_post_id: originPostId.value, ...(isMakeVideoSequelMode.value ? {} : { origin_session_id: originSessionIdForExtension.value }) } : {}),
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'web',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code == 200 || data.code == 0) {
        trackContentPublished(sessionId);
        window.location.href = `/tools/video/${sessionId}`;

        clearDraftFor('drama');
        inputKey.value++;
        nextTick(() => { if (editableInputRef.value) editableInputRef.value.innerHTML = ''; isInputEmpty.value = true; runTypewriter(); });
      } else {
        toast(data.message);
      }
    } else {
      toast(t('fail'));
    }
    isGeneratingDrama.value = false;
  } catch (error) {
    console.error('Error in generateDrama:', error);
    toast(t('fail'));
    isGeneratingDrama.value = false;
  }
};

const convertImageTagsToRef = (inputElement: HTMLElement | null, imageList: any[]): string => {
  if (!inputElement) return '';

  let result = '';

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      if (element.classList.contains('image-tag')) {
        const itemId = element.dataset.itemId;
        if (itemId) {
          const index = imageList.findIndex(img => img.id === itemId);
          if (index !== -1) {
            result += `<ref_${index + 1}>`;
            return;
          }
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        processNode(node.childNodes[i]);
      }
    }
  };

  for (let i = 0; i < inputElement.childNodes.length; i++) {
    processNode(inputElement.childNodes[i]);
  }

  return result.trim();
};

const generatePhoto = async () => {
  trackClickGenerateButton();
  if (isGeneratingPhoto.value) return;
  isGeneratingPhoto.value = true;

  // 走 checkLogin：保存做同款/做续集的来源 + 记住回跳地址，
  // 否则登录回来来源没了、输入框也空了
  if (!checkLogin()) {
    isGeneratingPhoto.value = false;
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    isGeneratingPhoto.value = false;
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    isGeneratingPhoto.value = false;
    return;
  }

  doGeneratePhoto();
};

const doGeneratePhoto = async () => {
  // Fetch latest balance before checking
  try {
    const balanceResponse = await api.userBalance() as any;
    if (balanceResponse.code == 200) {
      balanceInfo.value = balanceResponse.data;
    } else {
      toast(locale.value == 'en' ? balanceResponse.msg : locale.value == 'zh' ? balanceResponse.msg_cn : locale.value == 'tc' ? balanceResponse.msg_tc : balanceResponse.msg_jp);
    }
  } catch (error) {
    console.log('Failed to fetch balance:', error);
  }

  // Check if user has sufficient balance
  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedPhotoComputingPower.value || 1;

    const requiredBalance = Math.round(coverCost * overFreezeRate);
    const userBalance = balanceInfo.value.balance || 0;

    if (requiredBalance > userBalance) {
      insufficientBalanceEstimatedFrozen.value = Math.round(coverCost * overFreezeRate);
      insufficientBalanceAvailable.value = userBalance;
      insufficientBalanceFrozen.value = Math.max(0, (balanceInfo.value.total_balance || 0) - userBalance);
      showInsufficientBalanceModal.value = true;
      return;
    }
  }

  try {
    const sessionId = uuidv4();
    const token = localStorage.getItem('token') || '';
    const photoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value,
      aspectRatio: selectedPhotoRatio.value,
      resolution: selectedPhotoQuality.value
    };

    // Convert image tags to <ref_x> format
    const contentWithRefTags = convertImageTagsToRef(editableInputRef.value, combinedItemsPhoto.value);

    // Update user settings first
    const settingsParams = {
      ratio: photoSettings.aspectRatio,
      language: photoSettings.language,
      story_type: "simple_image",
      simple_image_resolution: photoSettings.resolution,
      story_mode: currentPhotoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: uploadedImagesPhoto.value.map(img => img.image),
      emotion: "",
      others: {
        content: contentWithRefTags,
        list: combinedItemsPhoto.value
      },
      addition_characters: [],
      enable_optimize_prompt: currentPhotoMode.value !== 'unlimited' && enablePhotoOptimizePrompt.value,
      ...(isMakeSameOn('photo') ? { is_make_same: 1, origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value ? { is_make_extension: 1, origin_post_id: originPostId.value, ...(isMakeVideoSequelMode.value ? {} : { origin_session_id: originSessionIdForExtension.value }) } : {}),
    };

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
      const data = await settingsResponse.json();
      toast(data.message || t('fail'));
      return;
    }

    const settingsData = await settingsResponse.json();
    if (settingsData.code != 200 && settingsData.code != 0) {
      toast(settingsData.message || t('fail'));
      return;
    }

    // Settings updated successfully, now generate photo
    const params = {
      session_id: sessionId,
      topic: contentWithRefTags,
      ...(isMakeSameMode.value && !isMakeVideoSimilarMode.value ? { origin_session_id: originSessionId.value } : {}),
      ...(isMakeExtensionMode.value && !isMakeVideoSequelMode.value ? { origin_session_id: originSessionIdForExtension.value } : {})
    };

    const response = await api.generateSinglePhoto(params) as any;

    if (response.code == 200) {
      trackContentPublished(sessionId);
      router.push('/generate');

      if (editableInputRef.value) {
        editableInputRef.value.textContent = '';
        isInputEmptyPhoto.value = true;
        isInputEmpty.value = true;
        uploadedImagesPhoto.value = [];
        combinedItemsPhoto.value = [];
        inputContentPhoto.value = '';
        inputHtmlPhoto.value = '';
      }
    } else {
      toast(response.message);
    }
  } catch (error) {
    console.error('Error in generatePhoto:', error);
    toast(t('fail'));
  } finally {
    isGeneratingPhoto.value = false;
  }
};

const openVideoSettingsModal = () => {
  showVideoSettingsModal.value = true;
};

const closeVideoSettingsModal = () => {
  showVideoSettingsModal.value = false;
};

const confirmVideoSettings = (settings: { language: string; aspectRatio: string }) => {
  showVideoSettingsModal.value = false;
};

// Trigger file upload dialog
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// Check if image file is corrupted
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

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
};

const imageDimensionError = async (file: File): Promise<string> => {
  const { width, height } = await getImageDimensions(file);
  if (width === 0 || height === 0) return t('home.error.corruptedImage');
  const ratio = width / height;
  const isPhotoUnlimited = contentType.value === 'photo' && currentPhotoMode.value === 'unlimited';
  const isVideoUnlimited = contentType.value === 'video' && videoLimitMode.value === 'unlimited';
  if (isPhotoUnlimited) {
    if (ratio < 1 / 16 || ratio > 16) {
      return t('home.error.imageRatioLimit');
    }
    if (width < 14 || height < 14) {
      return t('home.error.imageDimensionLimit');
    }
    if (width > 6000 || height > 6000) {
      return t('home.error.imageDimensionLimit');
    }
  } else if (contentType.value === 'video' && videoLimitMode.value === 'fast') {
    // 极速版视频参考图片：宽高比 [0.4, 2.5]，像素 [256, 5760]
    if (ratio < 0.4 || ratio > 2.5) {
      return t('home.error.imageRatioLimit');
    }
    if (width < 256 || width > 5760 || height < 256 || height > 5760) {
      return t('home.error.imageDimensionLimit');
    }
  } else if (isVideoUnlimited) {
    // 无限制视频参考图片：宽高比 1:8~8:1，像素 [240, 8000]
    if (ratio < 1 / 8 || ratio > 8) {
      return t('home.error.imageRatioLimit');
    }
    if (width < 240 || width > 8000 || height < 240 || height > 8000) {
      return t('home.error.imageDimensionLimit');
    }
  } else {
    if (ratio < 0.4 || ratio > 2.5) {
      return t('home.error.imageRatioLimit');
    }
    if (width < 300 || width > 6000 || height < 300 || height > 6000) {
      return t('home.error.imageDimensionLimit');
    }
  }
  return '';
};

const validateImageDimensions = async (file: File): Promise<boolean> => {
  const err = await imageDimensionError(file);
  if (err) toast(err);
  return !err;
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

const captureVideoFirstFrame = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
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
        reject(new Error(t('home.error.videoLoadFailed')));
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

const handleFileChange = async (event: Event) => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    // 批量选择后这一批可能会被裁剪（图片类 tab 超量只收前面能放下的），
    // 所以后面一律用 pickedFiles，不再直接读 input.files。
    let pickedFiles = Array.from(input.files);
    const isVideoRefMode = contentType.value === 'video'
      && (selectedVideoMultimodal.value === 'multimodal'
        || selectedVideoMultimodal.value === 'videoModify'
        || selectedVideoMultimodal.value === 'videoExtend');
    const isImageFile = (f: File) => !f.type.startsWith('video/') && !f.type.startsWith('audio/');
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Check total count before uploading new images
    // Get current mode based on content type
    let currentMode = 'normal';
    switch (contentType.value) {
      case 'video':
        currentMode = videoLimitMode.value;
        break;
      case 'drama':
        currentMode = currentDramaMode.value;
        break;
      case 'photo':
        currentMode = currentPhotoMode.value;
        break;
      case 'comic':
        currentMode = currentComicMode.value;
        break;
      case 'novel':
        currentMode = currentNovelMode.value;
        break;
    }

    // Photo upload limits based on mode
    let maxPhotos = currentMode === 'unlimited' ? 10 : 7;
    let maxFileSizeBytes = currentMode === 'unlimited' ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    let maxFileSizeMB = currentMode === 'unlimited' ? 20 : 10;

    if (contentType.value === 'photo' && currentMode === 'unlimited') {
      maxFileSizeBytes = 30 * 1024 * 1024;
      maxFileSizeMB = 30;
    }

    // Comic and Drama modes have 10MB image size limit
    if (contentType.value === 'comic' || contentType.value === 'drama') {
      maxFileSizeBytes = 10 * 1024 * 1024;
      maxFileSizeMB = 10;
    }
    let maxVideoSizeBytes = currentMode === 'unlimited' ? 100 * 1024 * 1024 : 200 * 1024 * 1024;
    let maxAudioSizeBytes = 15 * 1024 * 1024;

    // 视频 tab 的参考文件限制按版本档位走（极速版：图 9 张/30MB、视频 50MB、音频 15MB）
    if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
      const pf = videoProfile.value;
      maxPhotos = pf.imageMaxCount;
      maxFileSizeBytes = pf.imageMaxSize;
      maxFileSizeMB = Math.round(pf.imageMaxSize / MB);
      maxVideoSizeBytes = pf.videoMaxSize;
      if (pf.audioMaxSize > 0) maxAudioSizeBytes = pf.audioMaxSize;
    }

    // Check total count limit
    // 视频 tab 里视频和音频各有自己的段数上限，不占图片的名额
    const newImageCount = isVideoRefMode ? pickedFiles.filter(isImageFile).length : pickedFiles.length;
    const usedSlots = currentSelectedCharacters.value.length + currentUploadedImages.value.length;
    const totalItems = usedSlots + newImageCount;
    // 图片类 tab（漫画 / 漫剧 / 图片）批量选择：能收多少收多少 ——
    // 不合格式的跳过，超出数量的截掉，最后只弹一条提示。
    // 视频 tab 不走这里：参考文件要么整批收下，要么整批不收（下面的校验遇错就整批 return）。
    if (!isVideoRefMode) {
      const kept: File[] = [];
      let firstError = '';
      for (const file of pickedFiles) {
        let err = '';
        if (!validImageTypes.includes(file.type)) {
          err = t('home.error.invalidPhotoFormat');
        } else if (file.size > maxFileSizeBytes) {
          err = t('home.error.maxPhotoSize', { max: maxFileSizeMB });
        } else if (await isImageCorrupted(file)) {
          err = t('home.error.corruptedImage');
        } else if (contentType.value !== 'comic' && contentType.value !== 'drama') {
          err = await imageDimensionError(file);
        }
        if (err) {
          if (!firstError) firstError = err;
          continue;
        }
        kept.push(file);
      }

      const capacity = Math.max(0, maxPhotos - usedSlots);
      const overflow = kept.length > capacity;
      pickedFiles = kept.slice(0, capacity);

      // 数量超限优先提示，其次才是具体的格式错误
      if (overflow) {
        const isCharacterMixed = contentType.value === 'comic' || contentType.value === 'drama';
        toast(isCharacterMixed
          ? t('home.error.maxItemsReached', { max: maxPhotos })
          : t('home.error.maxPhotoReached', { max: maxPhotos }));
      } else if (firstError) {
        toast(firstError);
      }

      if (!pickedFiles.length) {
        input.value = '';
        return;
      }
    }

    if (isVideoRefMode && totalItems > maxPhotos) {
      toast(t('home.error.maxPhotoReached', { max: maxPhotos }));
      input.value = '';
      return;
    }

    // 段数上限要排在格式校验前面：数量超限的提示优先级更高
    if (isVideoRefMode) {
      const pf = videoProfile.value;
      const isUnlimited = videoLimitMode.value === 'unlimited';
      const isEdit = selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend';
      const newVideoCount = pickedFiles.filter((f) => f.type.startsWith('video/')).length;
      const newAudioCount = pickedFiles.filter((f) => f.type.startsWith('audio/')).length;
      const existVideoCount = combinedItemsVideo.value.filter((i: any) => i.type === 'video').length;
      const existAudioCount = combinedItemsVideo.value.filter((i: any) => i.type === 'audio').length;

      // 极速版限制参考视频 / 音频的段数（各最多 3 段）
      if (pf.refVideoMaxClips > 0 && existVideoCount + newVideoCount > pf.refVideoMaxClips) {
        toast(t('home.error.maxVideoClips', { max: pf.refVideoMaxClips }));
        input.value = '';
        return;
      }
      if (pf.refAudioMaxClips > 0 && existAudioCount + newAudioCount > pf.refAudioMaxClips) {
        toast(t('home.error.maxAudioClips', { max: pf.refAudioMaxClips }));
        input.value = '';
        return;
      }

      // 没有段数上限的档位（加强版 / 超级版）也要兜底按条数拦，
      // 否则数量超了会先撞上时长、比例这些格式提示 —— 和 Generate 页保持一致。
      const maxVideoCount = isUnlimited ? 5 : 10;
      // 改写 / 续写的原视频本身占掉一条名额
      const maxExtraVideoCount = isEdit ? maxVideoCount - 1 : maxVideoCount;
      if (existVideoCount + newVideoCount > maxExtraVideoCount) {
        toast(t('home.error.maxVideoCount', { max: maxExtraVideoCount }));
        input.value = '';
        return;
      }
      const maxAudioCount = isUnlimited ? 5 : 10;
      if (existAudioCount + newAudioCount > maxAudioCount) {
        toast(t('home.error.maxAudioCount', { max: maxAudioCount }));
        input.value = '';
        return;
      }
    }

    // Check individual file size and format for images
    for (const file of isVideoRefMode ? pickedFiles : []) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        // Check image format
        if (!validImageTypes.includes(file.type)) {
          toast(t('home.error.invalidPhotoFormat'));
          input.value = '';
          return;
        }
        // Check image file size
        if (file.size > maxFileSizeBytes) {
          toast(t('home.error.maxPhotoSize', { max: maxFileSizeMB }));
          input.value = '';
          return;
        }
        // Check if image is corrupted
        const isCorrupted = await isImageCorrupted(file);
        if (isCorrupted) {
          toast(t('home.error.corruptedImage'));
          input.value = '';
          return;
        }
        // Check image dimensions (ratio and size) - not for comic/drama
        if (contentType.value !== 'comic' && contentType.value !== 'drama') {
          const validDimensions = await validateImageDimensions(file);
          if (!validDimensions) {
            input.value = '';
            return;
          }
        }
      }
    }

    // Check individual video/audio duration for video multimodal mode
    if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
      const pf = videoProfile.value;
      const isUnlimited = videoLimitMode.value === 'unlimited';

      for (const file of pickedFiles) {
        if (file.type.startsWith('video/')) {
          const duration = await getMediaDuration(file);
          const minDuration = pf.refVideoMinSeconds;
          const maxDuration = refVideoMaxSeconds.value;
          // 放宽到「上限 + 1 秒」以内，超出的在上传后裁掉
          if (duration < minDuration || duration >= maxDuration + 1) {
            toast(t('home.error.videoUploadedDuration', { min: minDuration, max: maxDuration }));
            input.value = '';
            return;
          }
        } else if (file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(file);
          const audioMinDuration = pf.refAudioMinSeconds > 0 ? pf.refAudioMinSeconds : (isUnlimited ? 1 : 2);
          const audioMaxDuration = pf.refAudioMaxSeconds > 0 ? pf.refAudioMaxSeconds : (isUnlimited ? 15 : 30);
          if (duration < audioMinDuration || duration > audioMaxDuration) {
            toast(t('home.error.audioUploadedDuration', { min: audioMinDuration, max: audioMaxDuration }));
            input.value = '';
            return;
          }
        }
      }
    }

    // Check video/audio total duration limit for video multimodal mode
    if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
      const isUnlimited = videoLimitMode.value === 'unlimited';
      let totalVideoDuration = 0;
      let totalAudioDuration = 0;

      if ((selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend') && uploadedVideoDuration.value > 0) {
        totalVideoDuration += uploadedVideoDuration.value;
      }

      const existingVideoDurations: number[] = [];
      for (const item of combinedItemsVideo.value) {
        if (item.type === 'video' && item.duration) {
          existingVideoDurations.push(item.duration);
        } else if (item.type === 'audio' && item.duration) {
          totalAudioDuration += item.duration;
        }
      }

      const newFileVideoDurations: number[] = [];
      for (const file of pickedFiles) {
        if (file.type.startsWith('video/')) {
          const duration = await getMediaDuration(file);
          // 按裁剪后的时长算，超出上限的部分上传后会被裁掉
          newFileVideoDurations.push(clampRefVideoDuration(duration));
        } else if (file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(file);
          totalAudioDuration += duration;
        }
      }

      if (isUnlimited && selectedVideoMultimodal.value === 'multimodal') {
        const allVideoDurations = [...existingVideoDurations, ...newFileVideoDurations];
        if (allVideoDurations.length === 1) {
          totalVideoDuration += Math.ceil(allVideoDurations[0]);
        } else if (allVideoDurations.length > 1) {
          totalVideoDuration += Math.ceil(allVideoDurations.reduce((sum, d) => sum + d, 0));
        }
      } else {
        totalVideoDuration += existingVideoDurations.reduce((sum, d) => sum + d, 0) + newFileVideoDurations.reduce((sum, d) => sum + d, 0);
      }

      const pf2 = videoProfile.value;
      const maxTotalVideoDuration = pf2.refVideoBudget > 0 && videoLimitMode.value === 'fast'
        ? pf2.refVideoBudget
        : (isUnlimited ? 15 : 30);
      const maxTotalAudioDuration = pf2.refAudioBudget > 0
        ? pf2.refAudioBudget
        : (isUnlimited ? 15 : 30);

      if (totalVideoDuration > maxTotalVideoDuration) {
        toast(t('home.error.videoDurationLimit', { max: maxTotalVideoDuration }));
        input.value = '';
        return;
      }

      if (totalAudioDuration > maxTotalAudioDuration) {
        toast(t('home.error.audioTotalDurationLimit', { max: maxTotalAudioDuration }));
        input.value = '';
        return;
      }
    }

    isUploading.value = true;

    try {
      const files = pickedFiles;
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Determine file type
          let fileType = 'image';
          if (file.type.startsWith('video/')) {
            fileType = 'video';
            // Validate video format
            const videoExtensions = ['.mp4', '.mov'];
            const videoExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!videoExtensions.includes(videoExtension)) {
              toast(t('home.error.invalidVideoFormat'));
              return;
            }
            // Check video file size
            if (file.size > maxVideoSizeBytes) {
              toast(t('home.error.maxVideoSize', { max: currentMode === 'unlimited' ? 100 : 200 }));
              return;
            }
            // Check video dimensions (ratio and size)
            const validVideoDimensions = await validateVideoDimensions(file);
            if (!validVideoDimensions) {
              return;
            }
            // Check video duration for video reference modes
            if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
              const videoDuration = await getMediaDuration(file);
              const minDuration = currentMode === 'unlimited' ? 1 : 2;
              const maxDuration = refVideoMaxSeconds.value;
              if (videoDuration < minDuration || videoDuration >= maxDuration + 1) {
                toast(t('home.error.videoUploadedDuration', { min: minDuration, max: maxDuration }));
                return;
              }
            }
            // Check video count limit for video reference modes
            if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
              const isEdit = selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend';
              const maxVideos = currentMode === 'unlimited' ? 5 : 10;
              const maxExtraVideos = isEdit ? maxVideos - 1 : maxVideos;
              const existingVideos = uploadedVideosVideo.value.length;
              const newVideos = files.filter(f => f.type.startsWith('video/')).length;
              if (existingVideos + newVideos > maxExtraVideos) {
                toast(t('home.error.maxVideoCount', { max: maxExtraVideos }));
                return;
              }
            }
          } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
            const audioExtensions = ['.mp3', '.wav'];
            const audioExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!audioExtensions.includes(audioExtension)) {
              toast(t('home.error.invalidAudioFormat'));
              return;
            }
            if (file.size > maxAudioSizeBytes) {
              toast(t('home.error.maxAudioSize', { max: 15 }));
              return;
            }
            const audioDuration = await getMediaDuration(file);
            const isUnlimitedVideo = contentType.value === 'video' && currentMode === 'unlimited';
            const audioMinDuration = isUnlimitedVideo ? 1 : 2;
            const audioMaxDuration = isUnlimitedVideo ? 15 : 30;
            if (audioDuration < audioMinDuration || audioDuration > audioMaxDuration) {
              toast(t('home.error.audioUploadedDuration', { min: audioMinDuration, max: audioMaxDuration }));
              return;
            }
            if (contentType.value === 'video' && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend')) {
              const maxAudioCount = currentMode === 'unlimited' ? 5 : 10;
              const existingAudios = uploadedAudiosVideo.value.length;
              const newAudios = files.filter(f => f.type.startsWith('audio/')).length;
              if (existingAudios + newAudios > maxAudioCount) {
                toast(t('home.error.maxAudioCount', { max: maxAudioCount }));
                return;
              }
            }
          }

          let coverUrl = '';
          let mediaDuration = 0;

          // Capture and upload video cover if it's a video
          if (fileType === 'video') {
            try {
              const frameDataUrl = await captureVideoFirstFrame(file);
              const coverFile = dataURLToFile(frameDataUrl, `${file.name}_cover.jpg`);
              coverUrl = await uploadImage(coverFile, currentVideoMode.value);
            } catch (error) {
              console.error('Failed to capture video cover:', error);
            }
            // Get video duration
            mediaDuration = await getMediaDuration(file);
          } else if (fileType === 'audio') {
            // Get audio duration (already checked earlier, but need to store it)
            mediaDuration = await getMediaDuration(file);
          }

          // Upload using appropriate API
          let uploadedUrl = fileType === 'video'
            ? await uploadVideo(file)
            : fileType === 'audio'
            ? await uploadAudio(file)
            : await uploadImage(file, getCurrentVideoMode().value);

          // 参考视频超过上限的，先让后端裁到上限，再拿裁好的地址入列
          if (fileType === 'video' && uploadedUrl && mediaDuration > refVideoMaxSeconds.value) {
            const trimRes = await api.extractVideoTail({ video_url: uploadedUrl, tail_seconds: refVideoMaxSeconds.value }) as any;
            if ((trimRes.code === 0 || trimRes.code === 200) && trimRes.data?.video_url) {
              uploadedUrl = trimRes.data.video_url;
              mediaDuration = refVideoMaxSeconds.value;
            } else {
              toast(trimRes.message || t('fail'));
              return;
            }
          }

          const newItem = fileType === 'video' ? {
            id: Date.now() + index.toString(),
            name: file.name,
            image: coverUrl,
            url: uploadedUrl,
            type: fileType,
            cover: coverUrl,
            duration: mediaDuration
          } : fileType === 'audio' ? {
            id: Date.now() + index.toString(),
            name: file.name,
            image: uploadedUrl,
            type: fileType,
            cover: coverUrl,
            duration: mediaDuration    // 保存音频时长
          } : {
            id: Date.now() + index.toString(),
            name: file.name,
            image: uploadedUrl,
            type: fileType,
            cover: coverUrl
          };

          // Add to appropriate array based on type (only for video mode)
          const isVideoMode = contentType.value === 'video';
          const isVideoRefMode = isVideoMode && (selectedVideoMultimodal.value === 'multimodal' || selectedVideoMultimodal.value === 'videoModify' || selectedVideoMultimodal.value === 'videoExtend');
          if (isVideoRefMode) {
            if (fileType === 'image') {
              uploadedImagesVideo.value.push(newItem);
            } else if (fileType === 'video') {
              uploadedVideosVideo.value.push(newItem);
            } else if (fileType === 'audio') {
              uploadedAudiosVideo.value.push(newItem);
            }
            // Add to combined items array with type information
            currentCombinedItems.value.push(newItem);

            // Update selectedVideoDuration after video upload in multimodal mode
            if (fileType === 'video' && selectedVideoMultimodal.value === 'multimodal') {
              const totalUploadedVideoDuration = getUploadedVideoDurationSum();
              const maxGenDuration = Math.floor(30 - Math.ceil(totalUploadedVideoDuration));
              const currentDuration = parseInt(selectedVideoDuration.value);
              if (maxGenDuration > 0) {
                const targetDuration = maxGenDuration;
                if (currentDuration > maxGenDuration || currentDuration < targetDuration) {
                  selectedVideoDuration.value = targetDuration.toString();
                  lastValidVideoDuration.value = targetDuration.toString();
                }
              }
            }
          } else {
            currentUploadedImages.value.push(newItem);
            currentCombinedItems.value.push(newItem);
          }

          // Insert tag into input-textarea
          if (editableInputRef.value) {
            const target = editableInputRef.value;

            // Create tag element based on type
            const itemTag = document.createElement('span');
            if (fileType === 'image') {
              itemTag.className = 'image-tag';
            } else if (fileType === 'video') {
              itemTag.className = 'video-tag';
            } else if (fileType === 'audio') {
              itemTag.className = 'audio-tag';
            }
            itemTag.contentEditable = 'false';
            itemTag.dataset.itemId = newItem.id;

            // Create media element based on type
            if (fileType === 'image') {
              const img = document.createElement('img');
              img.src = newItem.image;
              img.alt = newItem.name;
              img.className = 'image-tag-img';
              itemTag.appendChild(img);
            } else if (fileType === 'video') {
              const img = document.createElement('img');
              img.src = newItem.cover || newItem.image;
              img.alt = newItem.name;
              img.className = 'video-tag-img';
              itemTag.appendChild(img);
            } else if (fileType === 'audio') {
              const img = document.createElement('img');
              img.src = audioIcon;
              img.alt = newItem.name;
              img.className = 'audio-tag-img';
              itemTag.appendChild(img);
            }

            // Create text node with index (1-based)
            let itemIndex = 0;
            let typeLabel = fileType;
            if (fileType === 'image') {
              const currentUploadedImages = getUploadedImages();
              itemIndex = currentUploadedImages.value.length;
              typeLabel = t('home.img');
            } else if (fileType === 'video') {
              const isVideoExtendOrModify = contentType.value === 'video' && (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify');
              itemIndex = uploadedVideosVideo.value.length + (isVideoExtendOrModify ? 1 : 0);
              typeLabel = t('home.video');
            } else if (fileType === 'audio') {
              itemIndex = uploadedAudiosVideo.value.length;
              typeLabel = t('home.audio');
            }
            const textNode = document.createTextNode(`${typeLabel}${itemIndex}`);

            // Append text to tag (media element was already appended)
            itemTag.appendChild(textNode);

            // Append tag to the end
        target.appendChild(itemTag);

        // 清理标签前可能产生的 br 或 div 换行
        const prevSibling = itemTag.previousSibling;
        if (prevSibling && prevSibling.nodeName === 'BR') {
          prevSibling.remove();
        }
        const parentDiv = itemTag.parentElement;
        if (parentDiv && parentDiv !== target && parentDiv.nodeName === 'DIV') {
          while (parentDiv.firstChild) {
            target.insertBefore(parentDiv.firstChild, parentDiv);
          }
          target.removeChild(parentDiv);
        }

        // Focus the input to ensure cursor is visible
        target.focus();

        // Set cursor position after the item tag
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStartAfter(itemTag);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

            // Update input empty state (Vue will handle placeholder)
            isInputEmpty.value = false;
          }
        } catch (error) {
          console.error('Upload error for file', file.name, error);
          toast(t('fail'));
        }
      });

      await Promise.all(uploadPromises);

      input.value = '';
    } catch (error) {
      toast(t('fail'));
    } finally {
      isUploading.value = false;
    }
  }
};

// Upload image to server
async function uploadImage(file: File, mode: string): Promise<string> {
  if (!checkLogin()) return '';
  const token = localStorage.getItem("token") || '';

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

  const res = await fetch(baseUrl + "user/uploadImage", parma);
  const data = await res.json();
  if (data.code === 0 || data.code === 200) {
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
    headers: {
      'Content-Type': 'audio/mpeg',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }

  // Replace domain in URL
  const cleanUrl = presignedUrl.split('?')[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, 'https://static.moegen.ai');
}

// Remove uploaded image
const removeUploadedImage = (id: string) => {
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  // Find the item type first
  const itemToRemove = currentCombinedItems.value.find(item => item.id === id);
  const itemType = itemToRemove?.type || 'image';

  // First, remove references from input-textarea
  if (editableInputRef.value) {
    // Use a more general selector to find all types of media tags
    const tags = editableInputRef.value.querySelectorAll('.image-tag, .video-tag, .audio-tag');

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

    // Update input empty state
    const inputContent = editableInputRef.value.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

  // Then remove from the appropriate array based on type
  if (itemType === 'image') {
    // Remove from the current contentType's image array
    switch (contentType.value) {
      case 'video':
        uploadedImagesVideo.value = uploadedImagesVideo.value.filter(item => item.id !== id);
        break;
      case 'comic':
        uploadedImagesComic.value = uploadedImagesComic.value.filter(item => item.id !== id);
        break;
      case 'drama':
        uploadedImagesDrama.value = uploadedImagesDrama.value.filter(item => item.id !== id);
        break;
      case 'photo':
        uploadedImagesPhoto.value = uploadedImagesPhoto.value.filter(item => item.id !== id);
        break;
      default:
        uploadedImagesVideo.value = uploadedImagesVideo.value.filter(item => item.id !== id);
    }
  } else if (itemType === 'video') {
    uploadedVideosVideo.value = uploadedVideosVideo.value.filter(item => item.id !== id);
  } else if (itemType === 'audio') {
    uploadedAudiosVideo.value = uploadedAudiosVideo.value.filter(item => item.id !== id);
  }

  // Also remove from combinedItems array
  currentCombinedItems.value = currentCombinedItems.value.filter(item => item.id !== id);

  // Update selectedVideoDuration after removing a video in multimodal mode
  if (itemType === 'video' && contentType.value === 'video' && selectedVideoMultimodal.value === 'multimodal' && videoLimitMode.value === 'unlimited') {
    const totalUploadedVideoDuration = getUploadedVideoDurationSum();
    const maxGenDuration = Math.floor(30 - Math.ceil(totalUploadedVideoDuration));
    const currentDuration = parseInt(selectedVideoDuration.value);
    if (maxGenDuration > 0) {
      const targetDuration = Math.min(15, maxGenDuration);
      if (currentDuration > maxGenDuration || currentDuration < targetDuration) {
        selectedVideoDuration.value = targetDuration.toString();
        lastValidVideoDuration.value = targetDuration.toString();
      }
    }
  }

  // 素材少了一个，输入框里后面的「图片N」都要往前挪一号
  nextTick(() => renumberInputTags());
};

// 按素材在数组里的当前位置，刷新输入框里引用标签显示的序号（图片N / 视频N / 音频N）。
// 删除素材和拖拽排序之后都要调：标签靠 data-item-id 认素材，序号只是显示，位置一变就得重算。
function renumberInputTags() {
  if (!editableInputRef.value) return;
  try {
    // 重新编号：优先按 data-item-id 找这条素材在数组里的位置，拿不到 id 才退回 src 匹配。
    // 原来只按 src 匹配有两个坑：
    //   1) 素材的 image 为空串时，img.src.includes('') 恒真 —— 所有标签都会匹配到
    //      数组第一条，全被改成「图片1」；
    //   2) 同一张图传两次（两个 id、同一个 url），find 只会返回第一条，两个标签撞号。
    // 音频标签更是全都用同一个本地图标，src 根本匹配不到素材，以前压根不会重新编号。
    const findItemPos = (tag: Element, img: HTMLImageElement | null, list: any[]): number => {
      const itemId = (tag as HTMLElement).dataset.itemId || '';
      if (itemId) {
        const byId = list.findIndex((it: any) => String(it.id) === itemId);
        if (byId >= 0) return byId;
      }
      const src = img?.src || '';
      if (!src) return -1;
      return list.findIndex((it: any) => {
        const url = it.image || it.cover || '';
        return !!url && (url === src || src.includes(url));
      });
    };
    const setTagText = (tag: Element, text: string) => {
      const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
      if (textNode) textNode.textContent = text;
      (tag as HTMLElement).dataset.name = text;
    };

    // Update image tags based on current content type
    const currentUploadedImages = getUploadedImages();
    const imageTags = editableInputRef.value.querySelectorAll('.image-tag');
    imageTags.forEach(tag => {
      const pos = findItemPos(tag, tag.querySelector('img'), currentUploadedImages.value);
      if (pos >= 0) setTagText(tag, `${t('home.img')}${pos + 1}`);
    });

    // Update video tags
    const videoTags = editableInputRef.value.querySelectorAll('.video-tag');
    videoTags.forEach(tag => {
      if ((tag as HTMLElement).dataset.itemId === 'uploaded-video') {
        setTagText(tag, `${t('home.video')}1`);
        return;
      }
      const pos = findItemPos(tag, tag.querySelector('img'), uploadedVideosVideo.value);
      if (pos < 0) return;
      // 视频修改 / 视频续写 里原视频占掉了视频1，参考视频从 2 起
      const isVideoExtendOrModify = contentType.value === 'video'
        && (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify');
      setTagText(tag, `${t('home.video')}${pos + (isVideoExtendOrModify ? 2 : 1)}`);
    });

    // Update audio tags
    const audioTags = editableInputRef.value.querySelectorAll('.audio-tag');
    audioTags.forEach(tag => {
      const pos = findItemPos(tag, tag.querySelector('img'), uploadedAudiosVideo.value);
      if (pos >= 0) setTagText(tag, `${t('home.audio')}${pos + 1}`);
    });

    // Update character tags (for comic/drama tabs)
    const characterTags = editableInputRef.value.querySelectorAll('.character-tag-input');
    characterTags.forEach(tag => {
      const characterName = tag.querySelector('.character-name-input');
      if (characterName) {
        const currentSelectedCharacters = getSelectedCharacters();
        const character = currentSelectedCharacters.value.find(char =>
          char.name === characterName.textContent
        );
        if (character) {
          const charIndex = currentSelectedCharacters.value.findIndex(char => char.id === character.id) + 1;
          const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
          if (textNode) {
            textNode.textContent = `${character.name}`;
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating image order:', error);
  }
}

// ---------------------------------------------------------------------------
// 参考素材拖拽排序
// 用 Pointer Events 自己实现，不用原生 draggable：原生那套会拖出一张半透明的「暗图」，
// 移动端还不支持。被拖的缩略图只加 transform 跟着指针走，其它项原地不动；
// 被拖项的中心越过某个兄弟的一半就把它挪到那个位置，数组一变 Vue 自动重排。
// 松手后按新顺序重建各类型数组（图片 / 视频 / 音频 / 角色），再刷新输入框里的序号。
// ---------------------------------------------------------------------------
const dragState = reactive({ id: '', dx: 0, dy: 0 });

interface ItemDragCtx {
  id: string;
  el: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  /** 指针相对缩略图左上角的偏移，拖动时保持不变，缩略图才不会跳到指针下 */
  grabX: number;
  grabY: number;
  active: boolean;
  moved: boolean;
  timer: number | null;
}
let itemDragCtx: ItemDragCtx | null = null;
// 拖完松手会冒一个 click，在这个时间点之前的 click 一律吞掉，别把预览 / 播放弹出来
let suppressItemClickUntil = 0;

const DRAG_START_DISTANCE = 4;
const TOUCH_DRAG_HOLD_MS = 200;
const TOUCH_CANCEL_DISTANCE = 8;

const dragItemStyle = (id: string) =>
  dragState.id === id ? { transform: `translate(${dragState.dx}px, ${dragState.dy}px)` } : undefined;

function onItemClickCapture(e: Event) {
  if (Date.now() < suppressItemClickUntil) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function onItemPointerDown(e: PointerEvent, id: string) {
  if (e.button !== 0) return;
  if ((e.target as HTMLElement | null)?.closest?.('.remove-btn')) return;
  if (getCombinedItems().value.length < 2) return;
  // 缩略图是 <img>，浏览器默认会对它启动原生拖拽：拖出一张半透明的暗图，同时给我们发 pointercancel，
  // 松手还可能把图片「放」进 contenteditable 的输入框里。鼠标按下就拦掉默认行为，原生拖拽和选中文字都不会起来
  if (e.pointerType === 'mouse') e.preventDefault();
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  itemDragCtx = {
    id, el, pointerId: e.pointerId,
    startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY,
    grabX: e.clientX - rect.left, grabY: e.clientY - rect.top,
    active: false, moved: false, timer: null,
  };
  window.addEventListener('pointermove', onItemPointerMove, { passive: false });
  window.addEventListener('pointerup', onItemPointerUp);
  window.addEventListener('pointercancel', onItemPointerUp);
  // 触屏：长按一小会儿再进入拖拽；鼠标：移动超过几像素就开始
  if (e.pointerType !== 'mouse') {
    itemDragCtx.timer = window.setTimeout(startItemDrag, TOUCH_DRAG_HOLD_MS);
  }
}

function startItemDrag() {
  const ctx = itemDragCtx;
  if (!ctx || ctx.active) return;
  ctx.active = true;
  ctx.timer = null;
  dragState.id = ctx.id;
  dragState.dx = 0;
  dragState.dy = 0;
  try { ctx.el.setPointerCapture(ctx.pointerId); } catch { /* 部分浏览器不支持，忽略 */ }
}

function onItemPointerMove(e: PointerEvent) {
  const ctx = itemDragCtx;
  if (!ctx) return;
  ctx.lastX = e.clientX;
  ctx.lastY = e.clientY;
  const dist = Math.hypot(e.clientX - ctx.startX, e.clientY - ctx.startY);
  if (!ctx.active) {
    if (e.pointerType === 'mouse') {
      if (dist < DRAG_START_DISTANCE) return;
      startItemDrag();
    } else {
      // 长按还没到就滑开了：当成普通触摸，不拖
      if (dist >= TOUCH_CANCEL_DISTANCE) finishItemDrag();
      return;
    }
  }
  if (!ctx.active) return;
  e.preventDefault();
  ctx.moved = true;
  updateDragPosition();
  const from = getCombinedItems().value.findIndex((it: any) => it.id === ctx.id);
  if (from < 0) return;
  const to = resolveDragTarget(from);
  if (to !== from) {
    const list = getCombinedItems();
    const next = [...list.value];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    list.value = next;
    // 列表上的角标（图片1 / 2…）读的是各类型数组的位置，拖动过程中就跟着换
    syncTypedListsFromCombined();
    // 数组重排后缩略图落到新槽位，按最后的指针位置重算一次 translate，视觉上才不会跳
    nextTick(updateDragPosition);
  }
}

/** 缩略图该在的左上角 = 指针 - 抓取偏移；减去它当前的布局位置就是 translate */
function updateDragPosition() {
  const ctx = itemDragCtx;
  if (!ctx || !ctx.active) return;
  const rect = ctx.el.getBoundingClientRect();
  const baseLeft = rect.left - dragState.dx;
  const baseTop = rect.top - dragState.dy;
  dragState.dx = ctx.lastX - ctx.grabX - baseLeft;
  dragState.dy = ctx.lastY - ctx.grabY - baseTop;
}

/** 被拖的缩略图盖住哪个兄弟超过一半（重叠面积 > 兄弟面积的一半），就该落到哪个位置；盖住多个取盖得最多的那个 */
function resolveDragTarget(from: number): number {
  const ctx = itemDragCtx;
  if (!ctx) return from;
  const rect = ctx.el.getBoundingClientRect();
  // 被拖项此刻的真实位置：指针减去抓取偏移（不依赖 transform 是否已经渲染出来）
  const dL = ctx.lastX - ctx.grabX;
  const dT = ctx.lastY - ctx.grabY;
  const dR = dL + rect.width;
  const dB = dT + rect.height;
  const siblings = Array.from(ctx.el.parentElement?.children || [])
    .filter((c) => c.classList.contains('item-tag')) as HTMLElement[];
  let target = from;
  let best = 0.5;
  siblings.forEach((sib, idx) => {
    if (sib === ctx.el) return;
    const r = sib.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const overlapW = Math.max(0, Math.min(dR, r.right) - Math.max(dL, r.left));
    const overlapH = Math.max(0, Math.min(dB, r.bottom) - Math.max(dT, r.top));
    const ratio = (overlapW * overlapH) / (r.width * r.height);
    if (ratio > best) {
      best = ratio;
      target = idx;
    }
  });
  return target;
}

function onItemPointerUp() {
  const ctx = itemDragCtx;
  if (!ctx) return;
  const { active, moved } = ctx;
  finishItemDrag();
  if (!active) return;
  suppressItemClickUntil = Date.now() + 300;
  if (moved) {
    syncTypedListsFromCombined();
    nextTick(() => renumberInputTags());
  }
}

function finishItemDrag() {
  const ctx = itemDragCtx;
  if (!ctx) return;
  if (ctx.timer) window.clearTimeout(ctx.timer);
  try { ctx.el.releasePointerCapture(ctx.pointerId); } catch { /* 没 capture 过就会抛，忽略 */ }
  window.removeEventListener('pointermove', onItemPointerMove);
  window.removeEventListener('pointerup', onItemPointerUp);
  window.removeEventListener('pointercancel', onItemPointerUp);
  dragState.id = '';
  dragState.dx = 0;
  dragState.dy = 0;
  itemDragCtx = null;
}

/** 按 combinedItems 的新顺序重建各类型数组：「图片1」永远是列表里的第一张图，提交时 <ref_1> 也是它 */
function syncTypedListsFromCombined() {
  const list = getCombinedItems().value;
  const ofType = (type: string) => list.filter((it: any) => it.type === type);
  switch (contentType.value) {
    case 'video':
      uploadedImagesVideo.value = ofType('image');
      uploadedVideosVideo.value = ofType('video');
      uploadedAudiosVideo.value = ofType('audio');
      break;
    case 'comic':
      uploadedImagesComic.value = ofType('image');
      selectedCharactersComic.value = ofType('character');
      break;
    case 'drama':
      uploadedImagesDrama.value = ofType('image');
      selectedCharactersDrama.value = ofType('character');
      break;
    case 'photo':
      uploadedImagesPhoto.value = ofType('image');
      break;
  }
}

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

const getMaxInputLimit = (): number => {
  switch (contentType.value) {
    case 'comic':
    case 'drama':
    case 'novel':
      return 20000;
    case 'photo':
      return currentPhotoMode.value === 'unlimited' ? 1000 : 5000;
    case 'video':
      return videoProfile.value.maxInputChars;
    default:
      return 5000;
  }
};

// Handle input for @ dropdown
// 输入法组合中（拼音 / 注音的候选还没上屏）。
// 组合期间绝对不能动 contenteditable 的 DOM：下面 handleInput 里的 div/br 清理、
// 超长回滚都会把正在组合的文本节点整个换掉，IME 当场失去目标，
// 打「加一个人」会变成「j下一个人」。
const isComposingInput = ref(false);

const handleCompositionStart = () => {
  isComposingInput.value = true;
};

const handleCompositionEnd = (event: Event) => {
  isComposingInput.value = false;
  // 组合结束后浏览器不一定再补一次 input，这里主动跑一遍清理与 @ 检测
  handleInput(event);
};

const handleInput = (event: Event) => {
  // 输入法组合没结束就什么都不做，等 compositionend 再统一处理
  if (isComposingInput.value || (event as InputEvent).isComposing) return;
  const target = event.target as HTMLElement;

  // 清理 contenteditable 中浏览器自动生成的 div 包裹，避免换行问题
  const divs = target.querySelectorAll('div');
  divs.forEach(div => {
    while (div.firstChild) {
      target.insertBefore(div.firstChild, div);
    }
    target.removeChild(div);
  });
  // 清理标签前后的多余 br
  const brs = target.querySelectorAll('br');
  brs.forEach(br => {
    const prev = br.previousSibling;
    const next = br.nextSibling;
    const isBeforeTag = (next && next.nodeType === 1 && ((next as HTMLElement).classList.contains('character-tag-input') || (next as HTMLElement).classList.contains('image-tag') || (next as HTMLElement).classList.contains('video-tag') || (next as HTMLElement).classList.contains('audio-tag')));
    const isAfterTag = (prev && prev.nodeType === 1 && ((prev as HTMLElement).classList.contains('character-tag-input') || (prev as HTMLElement).classList.contains('image-tag') || (prev as HTMLElement).classList.contains('video-tag') || (prev as HTMLElement).classList.contains('audio-tag')));
    const isBetweenTextAndTag = (prev && prev.nodeType === 3) && isBeforeTag;
    const isBetweenTagAndText = (next && next.nodeType === 3) && isAfterTag;
    const isLeadingBr = !prev && isBeforeTag;
    if (isBetweenTextAndTag || isBetweenTagAndText || isLeadingBr) {
      br.remove();
    }
  });

  const maxLimit = getMaxInputLimit();
  const currentCharCount = getInputCharCount(target);
  if (currentCharCount > maxLimit) {
    target.innerHTML = previousInputHtml.value;
    isInputEmpty.value = previousInputHtml.value.trim() === '' || (target.textContent || '').trim() === '';
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    return;
  }
  previousInputHtml.value = target.innerHTML;

  // 计算实际的文本内容，排除非可编辑标签中的文本
  const actualText = collectEditableText(target);

  isInputEmpty.value = actualText.trim() === '';
  stickyInputPreview.value = actualText.replace(/\s+/g, ' ').trim();

  const cursorPosition = getCursorPosition(target);
  const textBeforeCursor = actualText.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  const isVideoExtendOrModify = contentType.value === 'video' && (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify');
  const uploadedVideoItem = isVideoExtendOrModify && uploadedVideo.value
    ? [{ id: 'uploaded-video', name: 'uploaded-video', type: 'video', image: uploadedVideo.value, cover: uploadedVideoCover.value || '', url: uploadedVideo.value }]
    : [];
  const dropdownSourceItems = [...uploadedVideoItem, ...currentCombinedItems.value];

  const hasItems = dropdownSourceItems.length > 0;

  if (atIndex !== -1 &&
      atIndex === textBeforeCursor.length - 1 &&
      hasItems) {

    showAtDropdown.value = true;
    atDropdownItems.value = dropdownSourceItems;

    // Calculate dropdown position based on @ symbol position
    nextTick(() => {
      try {
        if (editableInputRef.value) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            // 找到 @ 符号的位置
            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            // 遍历所有子节点查找 @ 符号
            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) { // TEXT_NODE
                // 跳过非可编辑标签中的文本节点
                if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
                  return false;
                }

                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                // 检查 @ 是否在当前节点中
                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) { // ELEMENT_NODE
                // 跳过非可编辑标签
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

            findAtSymbol(editableInputRef.value);

            if (foundAtNode) {
              // 创建一个 range 定位到 @ 符号后面
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = editableInputRef.value.parentElement;
              const dropdown = document.querySelector('.at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                // 计算相对于 input-inner 的位置
                const relativeLeft = rect.left - inputInnerRect.left;
                const dropdownHeight = 200;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                if (spaceBelow >= dropdownHeight + 10) {
                  // 下方空间足够，显示在 @ 下方
                  dropdown.style.top = `${rect.bottom - inputInnerRect.top + 5}px`;
                  dropdown.style.bottom = '';
                } else if (spaceAbove >= dropdownHeight + 10) {
                  // 上方空间足够，显示在 @ 上方
                  dropdown.style.bottom = `${inputInnerRect.bottom - rect.top + 5}px`;
                  dropdown.style.top = '';
                } else {
                  // 两边都不够，优先显示在空间较大的一侧
                  if (spaceAbove >= spaceBelow) {
                    dropdown.style.bottom = `${inputInnerRect.bottom - rect.top + 5}px`;
                    dropdown.style.top = '';
                  } else {
                    dropdown.style.top = `${rect.bottom - inputInnerRect.top + 5}px`;
                    dropdown.style.bottom = '';
                  }
                }
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
    showAtDropdown.value = false;
  }
};

// Handle keydown events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showAtDropdown.value = false;
  }

  // 回车自己插一个 <br>。不能交给浏览器默认行为：Chrome 会把新起的一行包成
  // <div>…</div>，而 handleInput 里为了避免换行错乱会把所有 <div> 拆包摊平，
  // 于是这一行又被并回上一行，看起来就是回车没反应。
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    document.execCommand('insertLineBreak');
    return;
  }

  const maxLimit = getMaxInputLimit();
  if (editableInputRef.value) {
    const currentCharCount = getInputCharCount(editableInputRef.value);
    if (currentCharCount >= maxLimit && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
      return;
    }
  }

  if (event.key === 'Backspace') {
    if (editableInputRef.value) {
      const target = editableInputRef.value;
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if cursor is at the start of the input
        if (range.startOffset === 0 && range.startContainer === target.firstChild) {
          return; // Do nothing if at the start
        }

        // Check if cursor is in the middle of a text node
        if (range.startContainer.nodeType === 3 && range.startOffset > 0) {
          // If there's text before the cursor, let the default backspace behavior happen
          const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || '';
          if (textBeforeCursor.trim() !== '') {
            return; // Let default backspace handle text deletion
          }
        }

        // Check if cursor is right after a character or image tag
        let previousSibling: Node | null = range.startContainer;
        if (range.startOffset > 0) {
          // If cursor is at the end of a text node, check the previous node
          if (previousSibling && previousSibling.nodeType === 3) { // Text node
            const textBeforeCursor = previousSibling.textContent?.substring(0, range.startOffset) || '';
            if (textBeforeCursor.trim() === '') {
              // If only whitespace before cursor, check previous element
              previousSibling = previousSibling.previousSibling;
            } else {
              return; // Let default backspace handle text deletion
            }
          }
        } else {
          // If cursor is at the start of a node, check the previous node
          previousSibling = previousSibling?.previousSibling || null;
        }

        // Check if previous sibling is a character or image tag
        while (previousSibling) {
          if (previousSibling.nodeType === 1) { // Element node
            const element = previousSibling as HTMLElement;
            if (element.classList.contains('character-tag-input') || element.classList.contains('image-tag') || element.classList.contains('video-tag') || element.classList.contains('audio-tag')) {
              // Check if there's any non-whitespace text between the cursor and the tag
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
                // Delete the tag and any preceding whitespace
                const whitespaceNode = element.previousSibling;
                if (whitespaceNode && whitespaceNode.nodeType === 3 && whitespaceNode.textContent?.trim() === '') {
                  whitespaceNode.remove();
                }
                element.remove();

                // Update input empty state
                const inputContent = target.textContent || '';
                isInputEmpty.value = inputContent.trim() === '';

                // Prevent default backspace behavior
                event.preventDefault();
                return;
              } else {
                return; // Let default backspace handle text deletion
              }
            }
          } else if (previousSibling.nodeType === 3) {
            // If there's a text node with non-whitespace content, let default backspace handle it
            if (previousSibling.textContent?.trim() !== '') {
              return;
            }
          }
          previousSibling = previousSibling.previousSibling;
        }
      }
    }
  }
};

// Handle input click
const handleInputClick = () => {
  if (isStickyCollapsed.value) {
    expandStickyInput();
    return;
  }
  trackClickPromptBox();
  // Only handle @ dropdown logic, don't update isInputEmpty
  if (editableInputRef.value) {
    const target = editableInputRef.value;

    const actualText = collectEditableText(target);

    const cursorPosition = getCursorPosition(target);
    const textBeforeCursor = actualText.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const currentSelectedCharacters = getSelectedCharacters();
    const currentUploadedImages = getUploadedImages();
    const currentCombinedItems = getCombinedItems();

    const isVideoExtendOrModify2 = contentType.value === 'video' && (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify');
    const uploadedVideoItem2 = isVideoExtendOrModify2 && uploadedVideo.value
      ? [{ id: 'uploaded-video', name: 'uploaded-video', type: 'video', image: uploadedVideo.value, cover: uploadedVideoCover.value || '', url: uploadedVideo.value }]
      : [];
    const dropdownSourceItems2 = [...uploadedVideoItem2, ...currentCombinedItems.value];

    const hasItems = dropdownSourceItems2.length > 0;

    if (atIndex !== -1 &&
        atIndex === textBeforeCursor.length - 1 &&
        hasItems) {
      showAtDropdown.value = true;
      atDropdownItems.value = dropdownSourceItems2;

      // Calculate dropdown position based on @ symbol position
      nextTick(() => {
        try {
          if (editableInputRef.value) {
            // 找到 @ 符号的位置
            let currentPos = 0;
            let foundAtNode: Node | null = null;
            let atNodeOffset = 0;

            // 遍历所有子节点查找 @ 符号
            const findAtSymbol = (node: Node): boolean => {
              if (node.nodeType === 3) { // TEXT_NODE
                if (node.parentElement?.hasAttribute('contenteditable') && node.parentElement.contentEditable === 'false') {
                  return false;
                }

                const nodeText = node.textContent || '';
                const nodeLength = nodeText.length;

                // 检查 @ 是否在当前节点中
                if (currentPos <= atIndex && atIndex < currentPos + nodeLength) {
                  foundAtNode = node;
                  atNodeOffset = atIndex - currentPos;
                  return true;
                }
                currentPos += nodeLength;
              } else if (node.nodeType === 1) { // ELEMENT_NODE
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

            findAtSymbol(editableInputRef.value);

            if (foundAtNode) {
              // 创建一个 range 定位到 @ 符号后面
              const atRange = document.createRange();
              atRange.setStart(foundAtNode as Node, atNodeOffset);
              atRange.setEnd(foundAtNode as Node, atNodeOffset + 1);

              const rect = atRange.getBoundingClientRect();
              const inputInner = editableInputRef.value.parentElement;
              const dropdown = document.querySelector('.at-dropdown') as HTMLElement;

              if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                // 计算相对于 input-inner 的位置
                const relativeLeft = rect.left - inputInnerRect.left;
                const dropdownHeight = 200;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                if (spaceBelow >= dropdownHeight + 10) {
                  // 下方空间足够，显示在 @ 下方
                  dropdown.style.top = `${rect.bottom - inputInnerRect.top + 5}px`;
                  dropdown.style.bottom = '';
                } else if (spaceAbove >= dropdownHeight + 10) {
                  // 上方空间足够，显示在 @ 上方
                  dropdown.style.bottom = `${inputInnerRect.bottom - rect.top + 5}px`;
                  dropdown.style.top = '';
                } else {
                  // 两边都不够，优先显示在空间较大的一侧
                  if (spaceAbove >= spaceBelow) {
                    dropdown.style.bottom = `${inputInnerRect.bottom - rect.top + 5}px`;
                    dropdown.style.top = '';
                  } else {
                    dropdown.style.top = `${rect.bottom - inputInnerRect.top + 5}px`;
                    dropdown.style.bottom = '';
                  }
                }
                dropdown.style.left = `${relativeLeft}px`;
              }
            }
          }
        } catch (error) {
          console.error('Error positioning dropdown:', error);
        }
      });
    } else {
      showAtDropdown.value = false;
    }
  }
};

// Handle input focus
const handleInputFocus = () => {
  if (isStickyCollapsed.value) {
    expandStickyInput();
    return;
  }
  popHeroParts();
  // 做同款/做续集回填后由 focusCurrentInput() 程序化聚焦，不算用户主动点输入框，不应该被顶去登录页
  if (!isProgrammaticInputFocus) {
    checkLogin();
  }
  isInputFocused.value = true;
  if (editableInputRef.value) {
    previousInputHtml.value = editableInputRef.value.innerHTML;
  }
};

// Handle input blur
const handleInputBlur = () => {
  isInputFocused.value = false;

  // Update input empty state
  if (editableInputRef.value) {
    const inputContent = editableInputRef.value.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

  // Delay hiding dropdown to allow click on dropdown items
  setTimeout(() => {
    showAtDropdown.value = false;
  }, 300);
};

// Handle paste event to remove formatting
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();

  if (!editableInputRef.value) return;

  const maxLimit = getMaxInputLimit();
  const currentCharCount = getInputCharCount(editableInputRef.value);
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
    editableInputRef.value.textContent += text;
  }

  // Update input empty state
  const inputContent = editableInputRef.value.textContent || '';
  isInputEmpty.value = inputContent.trim() === '';
  previousInputHtml.value = editableInputRef.value.innerHTML;
  editableInputRef.value.scrollTop = editableInputRef.value.scrollHeight;
};

const handleTextareaInput = () => {
  const maxLimit = getMaxInputLimit();
  if (novelInput.value.length > maxLimit) {
    novelInput.value = novelInput.value.substring(0, maxLimit);
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
  }
  stickyInputPreview.value = novelInput.value.replace(/\s+/g, ' ').trim();
};

// Select @ dropdown item
const selectAtItem = (item: any) => {
  if (!editableInputRef.value) {
    return;
  }

  const target = editableInputRef.value;
  const savedHtml = target.innerHTML;

  // Clear any existing content if input is empty
  if (target.textContent?.trim() === '') {
    target.innerHTML = '';
  }

  // Create appropriate tag based on item type
  let itemTag: HTMLElement;
  let textNode: Text;

  if (item.type === 'character') {
    // Create character tag
    itemTag = document.createElement('span');
    itemTag.className = 'character-tag-input';
    itemTag.contentEditable = 'false';
    itemTag.dataset.itemId = item.id;

    // Create image element
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'character-tag-img';
    itemTag.appendChild(img);

    // Create text node with character name
    textNode = document.createTextNode(item.name);
  } else if (item.type === 'video') {
    // Create video tag
    itemTag = document.createElement('span');
    itemTag.className = 'video-tag';
    itemTag.contentEditable = 'false';
    itemTag.dataset.itemId = item.id;

    // Create video element
    const img = document.createElement('img');
    img.src = item.cover || item.image;
    img.className = 'video-tag-img';
    itemTag.appendChild(img);

    const isVideoExtendOrModify = contentType.value === 'video' && (selectedVideoMultimodal.value === 'videoExtend' || selectedVideoMultimodal.value === 'videoModify');
    const videoIndex = uploadedVideosVideo.value.findIndex(v => v.id === item.id) + (isVideoExtendOrModify ? 2 : 1);
    textNode = document.createTextNode(`${t('home.video')}${videoIndex}`);
  } else if (item.type === 'audio') {
    // Create audio tag
    itemTag = document.createElement('span');
    itemTag.className = 'audio-tag';
    itemTag.contentEditable = 'false';
    itemTag.dataset.itemId = item.id;

    // Create image element - use fixed audio icon
    const img = document.createElement('img');
    img.src = audioIcon;
    img.alt = item.name;
    img.className = 'audio-tag-img';
    itemTag.appendChild(img);

    const audioIndex = uploadedAudiosVideo.value.findIndex(a => a.id === item.id) + 1;
    textNode = document.createTextNode(`${t('home.audio')}${audioIndex}`);
  } else {
    // Create image tag
    itemTag = document.createElement('span');
    itemTag.className = 'image-tag';
    itemTag.contentEditable = 'false';
    itemTag.dataset.itemId = item.id;

    // Create image element
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';
    itemTag.appendChild(img);

    const currentUploadedImages = getUploadedImages();
    const imageIndex = currentUploadedImages.value.findIndex(imgItem => imgItem.id === item.id) + 1;
    textNode = document.createTextNode(`${t('home.img')}${imageIndex}`);
  }

  // Append text to tag
  itemTag.appendChild(textNode);

  // 查找光标位置前的 @ 符号
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.appendChild(itemTag);
    target.appendChild(document.createTextNode(' '));
    target.focus();
    showAtDropdown.value = false;
    return;
  }

  const range = selection.getRangeAt(0);

  // 获取光标位置（排除非可编辑标签）
  const cursorPos = getCursorPosition(target);

  // 查找光标前最后一个 @ 符号
  let atNode: Node | null = null;
  let atOffset = 0;
  let currentCharPos = 0;

  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 检查是否在非可编辑标签内
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
        const text = node.textContent || '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '@' && currentCharPos + i <= cursorPos) {
            atNode = node;
            atOffset = i;
          }
        }
        currentCharPos += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 跳过非可编辑标签
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        walkNodes(node.childNodes[i]);
      }
    }
  };

  walkNodes(target);

  if (atNode) {
    // 创建 range 删除 @ 符号
    const atRange = document.createRange();
    atRange.setStart(atNode, atOffset);
    atRange.setEnd(atNode, atOffset + 1);

    // 删除 @
    atRange.deleteContents();

    // 在删除位置插入 item tag
    atRange.insertNode(itemTag);

    // 标签后面补一个不断行空格，两个作用：
    // 1) 光标必须落在真实的文本节点里 —— 停在 contenteditable="false" 的标签旁边时
    //    输入法没有可组合的目标，打「加一个人」会被拆成「j下一个人」；
    // 2) 普通空格在行尾会被折叠，看起来光标就贴着标签，\u00A0 不会。
    //    序列化时统一换回普通空格，不会带进提交内容。
    const spaceNode = document.createTextNode('\u00A0');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 光标放进空格节点内部，而不是它后面的父节点位置
    const cursorRange = document.createRange();
    cursorRange.setStart(spaceNode, spaceNode.length);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  } else {
    // 没有找到 @，直接在光标位置插入
    range.insertNode(itemTag);

    // 标签后面补一个不断行空格，两个作用：
    // 1) 光标必须落在真实的文本节点里 —— 停在 contenteditable="false" 的标签旁边时
    //    输入法没有可组合的目标，打「加一个人」会被拆成「j下一个人」；
    // 2) 普通空格在行尾会被折叠，看起来光标就贴着标签，\u00A0 不会。
    //    序列化时统一换回普通空格，不会带进提交内容。
    const spaceNode = document.createTextNode('\u00A0');
    itemTag.parentNode?.insertBefore(spaceNode, itemTag.nextSibling);

    // 光标放进空格节点内部，而不是它后面的父节点位置
    const cursorRange = document.createRange();
    cursorRange.setStart(spaceNode, spaceNode.length);
    cursorRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(cursorRange);

    target.focus();
  }

  // Update input empty state after inserting image tag
  const inputContent = target.textContent || '';
  isInputEmpty.value = inputContent.trim() === '';

  const maxLimit = getMaxInputLimit();
  if (getInputCharCount(target) > maxLimit) {
    target.innerHTML = savedHtml;
    isInputEmpty.value = savedHtml.trim() === '' || (target.textContent || '').trim() === '';
    limitToast(t('home.error.maxInputLimit', { max: maxLimit }));
    showAtDropdown.value = false;
    return;
  }

  previousInputHtml.value = target.innerHTML;

  showAtDropdown.value = false;
};

// Get cursor position in contenteditable
const getCursorPosition = (element: HTMLElement): number => {
  let position = 0;
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    // 计算从元素开始到光标位置的文本长度，排除非可编辑标签中的文本
    const calculateTextLength = (node: Node, endNode: Node, endOffset: number): number => {
      let length = 0;

      if (node === endNode) {
        if (node.nodeType === Node.TEXT_NODE) {
          // 检查节点是否在非可编辑标签内
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
            length += Math.min(endOffset, node.textContent?.length || 0);
          }
        }
        return length;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // 检查节点是否在非可编辑标签内
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
          length += node.textContent?.length || 0;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 检查元素是否为非可编辑标签
        if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
          return 0;
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          const childLength = calculateTextLength(node.childNodes[i], endNode, endOffset);
          length += childLength;
          if (node.childNodes[i] === endNode) {
            break;
          }
        }
      }

      return length;
    };

    position = calculateTextLength(element, range.endContainer, range.endOffset);
  }
  return position;
};

// Set cursor position in contenteditable
const setCursorPosition = (element: HTMLElement, position: number) => {
  const range = document.createRange();
  const selection = window.getSelection();
  let currentPosition = 0;
  let found = false;

  const traverseNodes = (node: Node) => {
    if (found) return;

    if (node.nodeType === Node.TEXT_NODE) {
      // 检查节点是否在非可编辑标签内
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
        const nodeLength = node.textContent?.length || 0;
        if (currentPosition + nodeLength >= position) {
          range.setStart(node, position - currentPosition);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          found = true;
          return;
        }
        currentPosition += nodeLength;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 检查元素是否为非可编辑标签
      if ((node as HTMLElement).hasAttribute('contenteditable') && (node as HTMLElement).contentEditable === 'false') {
        return;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverseNodes(node.childNodes[i]);
        if (found) return;
      }
    }
  };

  traverseNodes(element);
};



// ---------------------------------------------------------------------------
// 生命周期
// ---------------------------------------------------------------------------
// 导航语言变了，小说 tab 的语言选择跟着走
watch(() => locale.value, (newLocale) => {
  selectedLanguage.value = newLocale == 'zh' ? 'cn' : newLocale == 'en' ? 'en' : newLocale == 'tc' ? 'tc' : 'jp';
});

// ---------------------------------------------------------------------------
// 做同款 / 做续集 / 图片做视频的回填入口。
// 首页从 localStorage、URL 上取来源调它们；详情页、搜索页、个人主页、合集详情
// 直接带着已经取到的数据调，不再跳首页。
// ---------------------------------------------------------------------------
interface MakeSimilarVideoPayload {
  videoUrl: string;
  cover?: string;
  isNsfw?: boolean;
  duration?: number | string;
  postId?: string | number;
  sessionId?: string;
}

async function applyMakeSimilarVideoData(payload: MakeSimilarVideoPayload) {
  const { videoUrl, cover, isNsfw, duration, postId } = payload || ({} as MakeSimilarVideoPayload);
  if (!videoUrl) return;
  await getCountry();

  const isUnlimited = isNsfw && userRegion.value;

  isMakeVideoSimilarMode.value = true;
  isMakeVideoSequelMode.value = false;
  isMakeSameMode.value = true;
  makeSameTab.value = 'video';
  originPostId.value = postId ? String(postId) : '';

  contentType.value = 'video';
  setSeoMeta('video');

  if (isUnlimited) {
    currentVideoMode.value = 'unlimited';
    selectedNsfwVersion.value = 'super';
    overrideNormalVideoMode.value = false;
  } else {
    currentVideoMode.value = 'normal';
    overrideNormalVideoMode.value = true;
  }

  selectedVideoMultimodal.value = 'videoModify';
  enableVideoOptimizePrompt.value = false;

  uploadedVideo.value = videoUrl;
  uploadedVideoCover.value = cover || null;
  uploadedVideoDuration.value = Number(duration) || 0;

  uploadedImagesVideo.value = [];
  selectedCharactersVideo.value = [];
  uploadedVideosVideo.value = [];
  uploadedAudiosVideo.value = [];
  combinedItemsVideo.value = [];

  isInputEmptyVideo.value = true;
  isInputEmpty.value = true;

  nextTick(() => {
    // 输入框所在的 v-if 分支刚重建，按 data-tab + data-mode 取当前分支的元素
    const el = resolveInputEl(contentType.value);
    if (el) { el.innerHTML = ''; isInputEmpty.value = true; }
    // 回填后输入框强制吸底，页面停在哪儿都固定在底部。
    // 未登录不要程序化 focus：focus 会触发 handleInputFocus -> checkLogin()，
    // 把刚回填好内容、还没登录的用户直接顶去登录页。
    pinStickyInput();
    if (!localStorage.getItem('token')) return;
    focusCurrentInput();
  });
}

onMounted(async () => {
  // 做同款/做续集的来源被清掉后（发起生成、或用户手动清空），解除输入框的强制吸底，
  // 之后重新按滚动位置决定。注册在 onMounted 里：watch 一个 computed 会在注册时立即求值，
  // 写在 setup 顶部会 TDZ。
  watch(isMakeSourceActive, (active) => {
    if (!active) unpinStickyInput();
  });

  // 档位变了就把画质 / 比例 / 时长校回新档位的合法范围。
  // 做同款、做续集、历史回填会直接改 selectedNsfwVersion，不走切换 handler，这里兜一道。
  // 必须在 onMounted 里注册：watch 一个 computed 会在注册时立即求值，写在 setup 顶部时
  // videoLimitMode 会顺着 effectiveVideoMode 摸到还没声明的 contentSwitch，直接 TDZ 报错。
  // 放在 onMounted 最前面，保证后面消费 localStorage 的做同款 / 做续集回填也能被兜到。
  watch(videoLimitMode, () => { migrateVideoParams(); });
  await contentSwitch.ensureLoaded();
  // 生效模式要等 content switch 回来才定：后端下发 2（强制 NSFW）时一进页面就是无限制模式，
  // 而 selectedNsfwVersion 的初始值是按普通模式算的（超级版），会停在超级版上。
  // 这里按当时真实的可选列表重取默认（fast → enhanced → super 顺序的第一个）：
  // 普通模式 → 超级版，无限制模式 → 加强版。
  selectedNsfwVersion.value = availableVideoVersions.value[0];
  if (contentSwitch.mode === 2) {
    currentNovelMode.value = 'unlimited';
    selectedInsertImage.value = 4;
  }
  window.addEventListener('scroll', updateStickyInputVisibility, { passive: true });
  window.addEventListener('scroll', blurHomeInputOnScroll, { passive: true });
  window.addEventListener('wheel', handleStickyUserScroll, { passive: true });
  window.addEventListener('touchmove', handleStickyUserScroll, { passive: true });

  // 启动占位打字机 + 注册相关 watch（此时所有依赖 ref 已声明）
  runTypewriter();
  watch(currentPlaceholder, () => runTypewriter());
  watch(isInputFocused, (f) => { if (f) { if (typeTimer) clearTimeout(typeTimer); typedPlaceholder.value = currentPlaceholder.value; } else runTypewriter(); });

  nextTick(() => { updateStickyInputVisibility(); });

  // 语言 -> 小说语言选择
  try {
    const systemLocale = locale.value;
    selectedLanguage.value = systemLocale == 'zh' ? 'cn' : systemLocale == 'en' ? 'en' : systemLocale == 'tc' ? 'tc' : 'jp';
  } catch (error) {
    console.error('Error loading novel settings:', error);
  }

  // 早期版本把选中的角色写进过 localStorage，现在改成纯内存，顺手清掉残留
  try {
    localStorage.removeItem('selectedCharacters');
  } catch (error) {
    /* 存储不可用，忽略 */
  }

  // Check for casted character from CharacterDetailModal
  try {
    const castedCharacter = localStorage.getItem('castedCharacter');
    if (castedCharacter) {
      const character = JSON.parse(castedCharacter);
      const castType = character.castType || null;

      const currentSelectedCharacters = getSelectedCharacters();
      const currentUploadedImages = getUploadedImages();
      const currentCombinedItems = getCombinedItems();

      // Check if character is already in the list
      if (!currentSelectedCharacters.value.some(c => c.id === character.id)) {
        // Check if total items exceed limit
        if (currentSelectedCharacters.value.length + currentUploadedImages.value.length < 7) {
          currentSelectedCharacters.value.push(character);
          currentCombinedItems.value.push({ ...character, type: 'character' });

          // Insert character tag into input-textarea after DOM update
          await nextTick();
          if (editableInputRef.value) {
            const target = editableInputRef.value;

            const characterTag = document.createElement('span');
            characterTag.className = 'character-tag-input';
            characterTag.contentEditable = 'false';
            characterTag.dataset.characterId = character.id;
            characterTag.dataset.itemId = character.id;

            const img = document.createElement('img');
            img.src = character.image;
            img.alt = character.name;
            img.className = 'character-tag-img';

            const textNode = document.createTextNode(character.name);

            characterTag.appendChild(img);
            characterTag.appendChild(textNode);

            target.appendChild(characterTag);

            const spaceNode = document.createTextNode(' ');
            target.appendChild(spaceNode);

            target.focus();

            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.setStartAfter(spaceNode);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            isInputEmpty.value = false;

            previousInputHtml.value = target.innerHTML;
          }

          localStorage.removeItem('castedCharacter');
        }
      } else {
        localStorage.removeItem('castedCharacter');
      }
    }
  } catch (error) {
    console.error('Error loading casted character:', error);
    localStorage.removeItem('castedCharacter');
  }

  document.addEventListener('click', handleClickOutside);

  // 宿主页面没有 Header 可以喂数据时（详情页这类），自己拉一次
  if (localStorage.getItem('token')) {
    if (!props.userInfo) {
      api.userInfo().then((r: any) => {
        if (r.code == 200 || r.code == 0) userInfo.value = r.data;
      }).catch(() => {});
    }
    if (!props.balanceInfo) {
      api.userBalance().then((r: any) => {
        if (r.code == 200 || r.code == 0) balanceInfo.value = r.data;
      }).catch(() => {});
    }
  }

  // 常驻底部的用法（详情页 / 搜索页 / 个人主页 / 合集详情）：
  // 一进页面先不占位，等外部调 applyMake* 时再亮出来；
  // 但如果是刚从注册/登录页回来的，把之前那次回填接上
  if (isBottomPlacement.value) {
    resumeMakeSourceAfterLogin();
    return;
  }

  // 以下只有首页需要：登录回来接上做同款、按地址栏识别内容类型
  if (!shouldConsumeMakeSource.value) return;

  await initLanguage();

  // 首页里点卡片做同款 / 做续集后被跳去登录，登录回来落回首页时把那次回填接上。
  // 回填落在推荐列表旁的吸底输入框里，通知首页滚过去
  const resumedAfterLogin = await resumeMakeSourceAfterLogin();
  if (resumedAfterLogin) emit('make-source-applied');

  // 根据 URL 识别内容类型
  const routeContentType = route.meta.contentType as string | undefined;
  const path = window.location.pathname;
  const pathSegments = path
    .replace(/^\/(ja|en|zh-cn|zh-tw)/, '')
    .replace(/\/index\.html$/, '')
    .split('/')
    .filter(Boolean);
  const validTypes = ['novel', 'comic', 'photo', 'video'];
  const pathContentType = pathSegments.length > 0 && validTypes.includes(pathSegments[0]) ? pathSegments[0] : '';

  const detectedContentType = routeContentType || pathContentType || null;

  // 预渲染/SEO 抓取时（prerender.mjs、seo-server.mjs 会注入 window.__SEO_PRERENDER__ = true）：
  //   按 URL 显示对应内容类型 tab，保留地址与对应 meta，保证爬虫抓到正确的正文与元信息。
  // 真实用户：切换 tab 会 router.replace 到 /{lang}/{type} 虚拟路由并触发重挂载，
  //   这里按 URL 识别的内容类型恢复 contentType（保证一次点击即生效，且地址栏保留虚拟路由）。
  const isSeoPrerender = (window as any).__SEO_PRERENDER__ === true;
  if (detectedContentType && !resumedAfterLogin) {
    contentType.value = detectedContentType;
  }

  // Set SEO meta tags: 预渲染按 URL 内容类型；真实用户按实际显示的（默认）内容类型
  if (!resumedAfterLogin) {
    setSeoMeta(isSeoPrerender ? (detectedContentType || undefined) : contentType.value);
  }
});

onBeforeUnmount(() => {
  finishItemDrag();
  bodyPadObserver?.disconnect();
  bodyPadObserver = null;
  if (props.placement === 'bottom') document.body.style.paddingBottom = '';
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updateStickyInputVisibility);
  window.removeEventListener('scroll', blurHomeInputOnScroll);
  window.removeEventListener('wheel', handleStickyUserScroll);
  window.removeEventListener('touchmove', handleStickyUserScroll);
  if (typeTimer) clearTimeout(typeTimer);
});

// 外部页面（详情页、搜索页、个人主页、合集详情）用这些入口在本页回填，
// 不再写 localStorage 然后跳首页。
// ---------------------------------------------------------------------------
// 关闭（首页不显示这个按钮）：清空已填内容，再把底部输入框收掉
// ---------------------------------------------------------------------------
function closeComposer() {
  lastMakeSource = null;
  try {
    localStorage.removeItem(MAKE_SOURCE_RESUME_KEY);
  } catch {
    /* 忽略 */
  }
  resetVideoInputs();
  clearVideoMakeFlags();

  novelInput.value = '';
  framesInput.value = '';
  inputHtmlComic.value = '';
  inputHtmlDrama.value = '';
  inputHtmlPhoto.value = '';
  selectedCharactersComic.value = [];
  selectedCharactersDrama.value = [];
  uploadedImagesComic.value = [];
  uploadedImagesDrama.value = [];
  uploadedImagesPhoto.value = [];
  combinedItemsComic.value = [];
  combinedItemsDrama.value = [];
  combinedItemsPhoto.value = [];
  isInputEmptyComic.value = true;
  isInputEmptyDrama.value = true;
  isInputEmptyPhoto.value = true;
  isInputEmpty.value = true;

  isMakeSameMode.value = false;
  isMakeExtensionMode.value = false;
  originSessionId.value = '';
  originPostId.value = '';
  originSessionIdForExtension.value = '';

  showAtDropdown.value = false;
  if (editableInputRef.value) editableInputRef.value.innerHTML = '';
  stickyInputPreview.value = '';

  stickyInputPinned.value = false;
  stickyInputExpanded.value = false;
  showStickyInput.value = false;
  bottomActive.value = false;
  emit('active-change', false);
}

// ---------------------------------------------------------------------------
// 吸在视口底部时给页面垫出等高的底部内边距，免得挡住列表最后几行。
// 展开 / 收起高度不一样，用 ResizeObserver 跟着实际高度走。
// 常驻底部的用法垫在 body 上；首页由 Home.vue 拿 height-change 垫在列表里；
// panel 模式是排在容器里的，本来就占位，不需要垫。
// ---------------------------------------------------------------------------
const BODY_PAD_GAP = 24;
let bodyPadObserver: ResizeObserver | null = null;

function syncBodyPadding() {
  const el = inputAreaBoxRef.value;
  const on = isVisible.value && showStickyInput.value && !!el;
  const height = on ? el!.offsetHeight : 0;
  // 宿主页面拿它排版（详情页漫画类型要把章节条抬到输入框上面）
  emit('height-change', height);
  if (props.placement !== 'bottom') return;
  document.body.style.paddingBottom = on ? `${height + BODY_PAD_GAP}px` : '';
}

function refreshBodyPadding() {
  bodyPadObserver?.disconnect();
  bodyPadObserver = null;
  const el = inputAreaBoxRef.value;
  if (el && typeof ResizeObserver !== 'undefined') {
    bodyPadObserver = new ResizeObserver(() => syncBodyPadding());
    bodyPadObserver.observe(el);
  }
  syncBodyPadding();
}

watch([isVisible, showStickyInput, stickyInputExpanded, contentType], () => {
  nextTick(refreshBodyPadding);
});

// 外部入口统一走这里：先把输入框亮出来，回填完再吸底并聚焦
// 一次回填的来源描述。未登录被顶去注册/登录页时存起来，回来后照原样再回填一次。
type MakeSourceKind =
  | 'same' | 'similarItem' | 'similarVideoItem' | 'sequelItem'
  | 'makeVideo' | 'similarVideoData' | 'sequelData' | 'makeVideoData';
interface MakeSource { kind: MakeSourceKind; payload: any }

const MAKE_SOURCE_RESUME_KEY = 'composerMakeSourceResume';
let lastMakeSource: MakeSource | null = null;

function runMakeSource(src: MakeSource): any {
  const p = src.payload;
  switch (src.kind) {
    case 'same': return handleMakeSimilar({ session_id: p });
    case 'similarItem': return handleMakeSimilar(p);
    case 'similarVideoItem': return handleMakeSimilarVideo(p);
    case 'sequelItem': return handleMakeSequelFromList(p);
    case 'makeVideo': return handleMakeVideo(p.imageUrl, p.isNsfw);
    case 'similarVideoData': return applyMakeSimilarVideoData(p);
    case 'sequelData': return handleMakeSequelFromCache(
      p.videoUrl, p.cover, p.type, p.postId ? String(p.postId) : '', p.isNsfw, Number(p.duration) || 0,
    );
    case 'makeVideoData': return handleMakeVideo(p.imageUrl, p.isNsfw);
  }
}

function applySource(kind: MakeSourceKind, payload: any) {
  return activateAndApply(() => runMakeSource({ kind, payload }), { kind, payload });
}

async function activateAndApply(run: () => any, source?: MakeSource) {
  lastMakeSource = source ?? null;

  // 首页的输入框本来就常驻，直接跑；其余页面先隐藏挂载，接口回来再决定露不露
  if (!isBottomPlacement.value) {
    await getCountry();
    await run();
    await nextTick();
    pinStickyInput();
    if (localStorage.getItem('token')) focusCurrentInput();
    return;
  }

  composerLoading.value = true;
  emit('loading-change', true);
  await nextTick();

  const before = backfillMarker;
  try {
    // 先确认地区 / 内容开关已就绪：详情页这些页面不像首页会在 onMounted 里拉一次，
    // 不等它的话 userRegion 还是初始的 false，NSFW 来源会被误判成「地区不支持」
    await getCountry();
    await run();
    // 各个分支的收尾都在 nextTick 里，多等两轮让它们跑完
    await nextTick();
    await nextTick();
  } catch (error) {
    console.error('make source failed:', error);
  } finally {
    composerLoading.value = false;
    emit('loading-change', false);
  }

  // 没回填成功（接口报错、需要订阅、素材不合规…）：错误提示由各分支自己弹，这里不显示输入框
  if (backfillMarker === before) {
    lastMakeSource = null;
    return;
  }

  bottomActive.value = true;
  emit('active-change', true);
  // 直接以展开态出现，不要先收起再展开闪一下。
  // stickyExpandedAtScrollY 对齐当前位置，否则滚动收起的判定会拿旧值，刚展开就被收掉。
  showStickyInput.value = true;
  stickyInputExpanded.value = true;
  stickyInputPinned.value = true;
  stickyExpandedAtScrollY = window.scrollY;
  pinnedAtScrollY = window.scrollY;
  await nextTick();
  // 未登录不 focus，否则会被 checkLogin 顶去登录页，回填就白做了
  if (localStorage.getItem('token')) focusCurrentInput();
}

defineExpose({
  /** ?make=session_id 那条：按 session 还原整套创作参数（小说 / 漫画 / 图片 / 视频都走它） */
  applyMakeSame: (sessionId: string) => applySource('same', sessionId),
  applyMakeSimilar: (item: any) => applySource('similarItem', item),
  applyMakeSimilarVideo: (item: any) => applySource('similarVideoItem', item),
  applyMakeSequel: (item: any) => applySource('sequelItem', item),
  applyMakeVideo: (imageUrl: string, isNsfw: boolean) => applySource('makeVideo', { imageUrl, isNsfw }),
  /** 详情页已经取到数据时直接回填，省掉组件内部再请求一次 */
  applyMakeSimilarVideoData: (p: MakeSimilarVideoPayload) => applySource('similarVideoData', p),
  applyMakeSequelData: (p: any) => applySource('sequelData', p),
  applyMakeVideoData: (p: any) => applySource('makeVideoData', p),
  expand: () => { bottomActive.value = true; showStickyInput.value = true; expandStickyInput(); },
  collapse: () => collapseStickyInput(),
  close: () => closeComposer(),
  pin: () => pinStickyInput(),
  /** 首页切换推荐/关注/订阅时，清掉输入框里已填的内容并把模式复位 */
  resetOnTabSwitch: () => {
    // Update input key to force re-render of input elements
    inputKey.value++;

    // Clear selected characters and images for both video and comic modes
    selectedCharactersVideo.value = [];
    uploadedImagesVideo.value = [];
    uploadedVideosVideo.value = [];
    uploadedAudiosVideo.value = [];
    combinedItemsVideo.value = [];
    inputContentVideo.value = '';
    inputHtmlVideo.value = '';
    isInputEmptyVideo.value = true;
    enableVideoOptimizePrompt.value = false;
    // 视频 / 漫画的内容都清了，落在这两个 tab 上的做同款标记也一起清，
    // 否则接着随便输入生成，请求里还会带着原作品的 session
    if (makeSameTab.value === 'video' || makeSameTab.value === 'comic') {
      isMakeSameMode.value = false;
      originSessionId.value = '';
      makeSameTab.value = '';
    }
    clearVideoMakeFlags();

    selectedCharactersComic.value = [];
    uploadedImagesComic.value = [];
    combinedItemsComic.value = [];
    inputContentComic.value = '';
    inputHtmlComic.value = '';
    isInputEmptyComic.value = true;

    // Clear novel input
    novelInput.value = '';

    // Reset mode, style, and settings to original values
    currentNovelMode.value = 'normal';
    currentVideoMode.value = 'normal';
    currentComicMode.value = 'normal';
    selectedWordCount.value = '30K';
    currentStyleName.value = '';

    // Clear current content type's input
    // 输入框所在的 v-if 分支刚重建，按 data-tab + data-mode 取当前分支的元素
    const el = resolveInputEl(contentType.value);
    if (el) { el.innerHTML = ''; isInputEmpty.value = true; }
  },
});

</script>

<style lang="scss" scoped>
@use '@/scss/PromptComposer.scss';
</style>
