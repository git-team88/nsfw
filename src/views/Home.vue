<template>
  <div class="home-page" ref="homePageRef">
    <Header ref="headerRef" :cur="0" @user-info-loaded="handleUserInfoLoaded" @balance-info-loaded="handleBalanceInfoLoaded"></Header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">{{ t('home.hero.title') }}</h1>

          <!-- Input Area -->
           <div class="input-area-box">
            <div class="input-type-box">
              <!-- Content Type Selector -->
              <div class="content-type-selector">
                <div
                  v-for="(type, index) in contentTypeOptions"
                  :key="type.value"
                  class="type-btn"
                  :class="{ active: contentType == type.value }"
                  @click="selectContentType(type.value)"
                >
                  <span>{{ t(type.label) }}</span>
                </div>
              </div>

              <div class="main-right">
                <!-- Help Button with Dropdown -->
                <div class="help-btn-container" @mouseenter="showHelpDropdown = true" @mouseleave="showHelpDropdown = false">
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
                </div>

                <div class="input-role">
                  <img src="@/assets/images/home/role.png" alt="" />
                </div>
              </div>
            </div>

            <!-- Video Mode Content -->
            <div v-if="contentType == 'video'">
              <!-- Input Area -->
              <div class="input-area">
                <div class="input-inner">
                  <!-- Multimodal Mode - Show image upload button -->
                  <template v-if="selectedVideoMultimodal === 'multimodal'">
                    <!-- Combined Characters and Images List -->
                    <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                      <div
                        v-for="(item, index) in combinedItems"
                        :key="item.id"
                        :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item']"
                      >
                        <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'video'">{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 1 }}</span>
                        <span class="image-index" v-if="item.type == 'audio'">{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <div class="image-box">
                          <div class="uploaded-item-wrapper">
                            <img v-if="item.type === 'image'" :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />
                            <div v-else-if="item.type === 'video'" class="video-thumbnail-box" @click="playUploadedVideo(item)">
                              <img :src="item.cover || item.image" :alt="item.name" class="uploaded-image" />
                              <div class="play-overlay-small">
                                <img src="@/assets/images/detail/play.png" alt="play" class="play-icon-small" />
                              </div>
                            </div>
                            <img v-else-if="item.type === 'audio'" src="@/assets/images/home/audio.png" :alt="item.name" class="uploaded-image audio-icon" />
                          </div>
                          <span class="img-bg"></span>
                        </div>
                        <span class="tooltip-name">{{ item.name }}</span>
                        <span v-if="item.type === 'character'" class="character-name">{{ item.name }}</span>
                        <span v-if="item.type === 'image'" class="image-name">{{ t('home.img') }}{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'video'" class="image-name">{{ t('home.video') }}{{ uploadedVideosVideo.findIndex(v => v.id === item.id) + 1 }}</span>
                        <span v-if="item.type === 'audio'" class="image-name">{{ t('home.audio') }}{{ uploadedAudiosVideo.findIndex(a => a.id === item.id) + 1 }}</span>
                        <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                      </div>
                    </div>

                    <div
                      ref="editableInputRef"
                      :key="`input-${inputKey}`"
                      class="input-textarea"
                      contenteditable="true"
                      spellcheck="false"
                      @input="handleInput"
                      @keydown="handleKeydown"
                      @click="handleInputClick"
                      @blur="handleInputBlur"
                      @paste="handlePaste"
                      @focus="handleInputFocus"
                      :data-placeholder="currentPlaceholder"
                    ></div>

                    <!-- Hidden file input for image upload -->
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/*,video/mp4,video/quicktime,audio/mp3,audio/wav"
                      multiple
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
                  <template v-else-if="selectedVideoMultimodal === 'startEndFrames'">
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
                        class="frames-textarea"
                        :placeholder="t('home.input.placeholder')"
                        v-model="novelInput"
                        spellcheck="false"
                      ></textarea>
                    </div>
                  </template>

                  <!-- Video Extend Mode - Show video upload -->
                  <template v-else-if="selectedVideoMultimodal == 'videoExtend'">
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
                        class="video-textarea"
                        :placeholder="t('home.input.placeholder')"
                        v-model="novelInput"
                        spellcheck="false"
                      ></textarea>
                    </div>
                  </template>

                  <div class="input-box">
                    <div class="input-options">
                      <!-- Mode Switch for Video - only show if not a teenager -->
                      <div v-if="userRegion" class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchVideoMode(currentVideoMode == 'normal' ? 'unlimited' : 'normal', currentVideoMode == 'normal' ? 2 : 1)">
                        <img
                          v-if="isTeenager"
                          src="@/assets/images/home/not_allow.png"
                          alt="Unlimited disabled"
                          class="unlimited-icon"
                        />
                        <img
                          v-else-if="currentVideoMode == 'unlimited'"
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

                      <!-- Multimodal Selector -->
                      <div class="video-selector" @click="showVideoMultimodalDropdown = !showVideoMultimodalDropdown" :class="{ open: showVideoMultimodalDropdown }">
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
                            @click.stop="selectedVideoMultimodal = option.value; showVideoMultimodalDropdown = false; resetVideoInputs()"
                          >
                            <span>{{ option.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Reference Button - Only show in multimodal mode -->
                      <div v-if="selectedVideoMultimodal == 'multimodal'" class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) triggerFileUpload() }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>

                      <!-- Video Settings Selector -->
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
                              <div class="slider-value" :style="{ left: getSliderValuePosition() }">
                                {{ selectedVideoDuration }}s
                              </div>
                              <div class="slider-track"></div>
                              <div class="slider-marks">
                                <div class="mark" :style="{ left: '0%', transform: 'translateX(-50%)' }"></div>
                                <div class="mark" :style="{ left: '23.08%', transform: 'translateX(-50%)' }"></div>
                                <div class="mark" :style="{ left: '61.54%', transform: 'translateX(-50%)' }"></div>
                                <div class="mark" :style="{ left: '100%', transform: 'translateX(-50%)' }"></div>
                              </div>
                              <input
                                type="range"
                                min="2"
                                max="15"
                                step="1"
                                :value="selectedVideoDuration"
                                @input="onVideoDurationChange"
                                @mousedown.stop
                                @mouseup.stop
                                @click.stop
                                class="slider-input"
                              />
                              <div class="slider-labels">
                                <span>2s</span>
                                <span>5s</span>
                                <span>10s</span>
                                <span>15s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div class="generate-box">
                      <div v-if="isLoggedIn" class="cover-cost-display">
                        <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                      </div>
                      <div class="generate-btn" :class="currentVideoMode == 'unlimited' ? 'unlimit' : ''" @click="generateVideo">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedVideoComputingPower }}</span>
                          <img src="@/assets/images/home/power.png" alt="Power" />
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
                <div class="input-inner">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item']"
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <div class="image-box">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                        <span class="img-bg"></span>
                      </div>
                      <span v-if="item.type === 'character'" class="character-name">{{ item.name }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :key="`input-${inputKey}`"
                    class="input-textarea"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="currentPlaceholder"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    multiple
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

                  <div class="input-box">
                    <div class="input-options">
                      <!-- Mode Switch for Comic Video - only show if not a teenager -->
                      <div v-if="userRegion" class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchDramaMode(currentDramaMode == 'normal' ? 'unlimited' : 'normal', currentDramaMode == 'normal' ? 2 : 1)">
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

                    <div class="generate-btn" :class="currentDramaMode == 'unlimited' ? 'unlimit' : ''" @click="generateDrama">
                      <img src="@/assets/images/home/send.png" alt="Send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Photo Mode Content -->
            <div v-else-if="contentType == 'photo'">
              <!-- Input Area -->
              <div class="input-area">
                <div class="input-inner">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item']"
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>
                      <div class="image-box">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                        <span class="img-bg"></span>
                      </div>
                      <span v-if="item.type === 'character'" class="character-name">{{ item.name }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :key="`input-${inputKey}`"
                    class="input-textarea"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="currentPlaceholder"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    multiple
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

                  <div class="input-box">
                    <div class="input-options">
                      <!-- Mode Switch for Photo - only show if not a teenager -->
                      <div v-if="userRegion" class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchPhotoMode(currentPhotoMode == 'normal' ? 'unlimited' : 'normal', currentPhotoMode == 'normal' ? 2 : 1)">
                        <img
                          v-if="isTeenager"
                          src="@/assets/images/home/not_allow.png"
                          alt="Unlimited disabled"
                          class="unlimited-icon"
                        />
                        <img
                          v-else-if="currentPhotoMode == 'unlimited'"
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
                                {{ ratio.label }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="generate-box">
                      <div v-if="isLoggedIn" class="cover-cost-display">
                        <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                      </div>
                      <div class="generate-btn" :class="currentPhotoMode == 'unlimited' ? 'unlimit' : ''" @click="generatePhoto">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedPhotoComputingPower }}</span>
                          <img src="@/assets/images/home/power.png" alt="Power" />
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
                <div class="input-inner">
                  <!-- Combined Characters and Images List -->
                  <div class="selected-items" v-if="combinedItems.length > 0" :key="`selected-items-${inputKey}`">
                    <!-- Combined Items -->
                    <div
                      v-for="(item, index) in combinedItems"
                      :key="item.id"
                      :class="['item-tag', item.type === 'character' ? 'character-tag' : 'uploaded-image-item']"
                    >
                      <span class="image-index" v-if="item.type == 'image'">{{ uploadedImages.findIndex(img => img.id === item.id) + 1 }}</span>

                      <div class="image-box">
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />

                        <span class="img-bg"></span>
                      </div>

                      <span v-if="item.type === 'character'" class="character-name">{{ item.name }}</span>
                      <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="item.type === 'character' ? removeCharacter(item) : removeUploadedImage(item.id)" />
                    </div>
                  </div>

                  <div
                    ref="editableInputRef"
                    :key="`input-${inputKey}`"
                    class="input-textarea"
                    contenteditable="true"
                    spellcheck="false"
                    @input="handleInput"
                    @keydown="handleKeydown"
                    @click="handleInputClick"
                    @blur="handleInputBlur"
                    @paste="handlePaste"
                    @focus="handleInputFocus"
                    :data-placeholder="currentPlaceholder"
                  ></div>

                  <!-- Hidden file input for image upload -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    multiple
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

                  <div class="input-box">
                    <div class="input-options">
                      <!-- Mode Switch for Comic - only show if not a teenager -->
                      <div v-if="userRegion" class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchComicMode(currentComicMode == 'normal' ? 'unlimited' : 'normal', currentComicMode == 'normal' ? 2 : 1)">
                        <img
                          v-if="isTeenager"
                          src="@/assets/images/home/not_allow.png"
                          alt="Unlimited disabled"
                          class="unlimited-icon"
                        />
                        <img
                          v-else-if="currentComicMode == 'unlimited'"
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

                    <div class="generate-btn" :class="currentComicMode == 'unlimited' ? 'unlimit' : ''" @click="generateComic">
                      <img src="@/assets/images/home/send.png" alt="Send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Novel Mode Content -->
            <div v-else-if="contentType == 'novel'" class="novel-mode-content">
              <div class="input-area novel-input-area">
                <div class="input-inner">
                  <textarea
                    class="novel-textarea"
                    :placeholder="t('home.novel.placeholder')"
                    v-model="novelInput"
                    spellcheck="false"
                  ></textarea>

                  <div class="input-box">
                    <div class="input-options novel-input-options">
                      <!-- Mode Switch - only show if not a teenager -->
                      <div v-if="userRegion" class="unlimited-switch" :class="{ disabled: isTeenager }" @click="!isTeenager && switchNovelMode(currentNovelMode == 'normal' ? 'unlimited' : 'normal', currentNovelMode == 'normal' ? 2 : 1)">
                        <img
                          v-if="isTeenager"
                          src="@/assets/images/home/not_allow.png"
                          alt="Unlimited disabled"
                          class="unlimited-icon"
                        />
                        <img
                          v-else-if="currentNovelMode == 'unlimited'"
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

                     <!-- Word Count Selector -->
                      <div class="novel-selector" @click="toggleWordCountDropdown" :class="{ open: showWordCountDropdown }">
                        <div class="selector-header">
                          <span>{{ t('home.totalWords') }}: {{ selectedWordCount }}</span>
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
                            <span>{{ count.label }}</span>
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
                    </div>

                    <div class="generate-box">
                      <div v-if="isLoggedIn" class="cover-cost-display">
                        <img class="info-icon" src="@/assets/images/home/intro.png" alt="" @click="showComputingPowerEstimateModal = true" />
                      </div>
                      <div class="generate-btn" @click="navigateToNovelGenerate">
                        <div class="generate-novel-btn">
                          <span>{{ estimatedComputingPower }}</span>
                          <img src="@/assets/images/home/power.png" alt="Send" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Banner -->
      <div class="event-banner">
        <div v-if="banners.length > 0" class="swiper-outer banner-swiper">
          <div class="swiper-container">
            <div class="swiper-wrapper">
              <div class="swiper-slide" v-for="(banner, index) in banners" :key="index">
                <!-- <a :href="banner.jump_url" target="_blank" v-if="banner.jump_url">
                  <img class="banner-img" :src="banner.cover" alt="" />
                </a> -->
                <img class="banner-img" :src="banner.cover" alt="" />
              </div>
            </div>
            <div class="swiper-pagination"></div>
          </div>
        </div>
      </div>

      <ProcessList />

      <!-- Content Section -->
      <div class="content-section">
        <!-- Tabs and Search -->
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

        <div class="filter-container">
          <div class="content-type-filter">
            <span
              v-for="type in contentTypes"
              :key="type.id"
              class="type-btn"
              :class="{ active: activeContentType == type.id }"
              @click="activeContentType = type.id"
            >
              {{ t('home.contentType.' + type.label) }}
            </span>
          </div>

          <!-- <div class="sort-filter">
            <span
              v-for="option in sortOptions"
              :key="option.id"
              class="filter-btn"
              :class="{ active: sortOrder === option.id }"
              @click="sortOrder = option.id"
            >
              {{ t(option.label) }}
            </span>
          </div> -->
        </div>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Empty State -->
          <EmptyState v-if="!loading && allContent.length === 0" />

          <!-- Waterfall Layout -->
          <div
            v-else-if="allContent.length > 0"
            class="waterfall"
            ref="waterfallRef"
            :key="`waterfall-${activeContentTab}`"
          >
            <div
              v-for="(item, index) in displayContent"
              :key="item.id"
              class="content-item"
              :ref="(el) => setContentCardRef(el, index)"
              @click="navigateToDetail(item.id)"
            >
              <div class="content-image">
                <img :src="item.cover" alt="" />
                <!-- Type Icon -->
                <div class="type-icon" v-if="item.type">
                  <img v-if="item.type == '2'" src="@/assets/images/home/novel_icon.png" alt="" />
                  <img v-else-if="item.type == '1'" src="@/assets/images/home/comic_icon.png" alt="" />
                  <img v-else-if="item.type == '3'" src="@/assets/images/home/video_icon.png" alt="" />
                </div>
                <!-- Video Play Icon -->
                <div v-if="item.type == '3'" class="play-icon">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>

                <div class="content-bottom">
                  <!-- Like Count -->
                  <div class="content-stats" @click.stop="toggleLike(item)">
                    <img :src="item.is_liked == 1 ? likeActive : like" alt="" />
                    <span>{{ item.like_count || 0 }}</span>
                  </div>
                  <!-- Video Duration -->
                  <div class="video-duration" v-if="item.type == '3' && item.duration">
                    {{ formatDuration(item.duration) }}
                  </div>
                </div>

              </div>
              <div class="content-info">
                <div class="content-desc" v-if="item.title || item.description">{{ item.title ? item.title : item.description ? item.description : '' }}</div>
                <div class="content-meta">
                  <div class="author-info" v-if="activeContentTab != 'suggested'">
                    <img :src="item.author?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                    <span class="author-name">{{ item.author?.nickname }}</span>
                  </div>
                  <div class="author-info" v-else>
                    <img :src="item.author_info?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                    <span class="author-name">{{ item.author_info?.nickname }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>

          <!-- Pagination -->
          <div v-if="!loading && allContent.length > 0 && Math.ceil(totalPosts / pageSize) > 1" class="pagination-wrapper">
            <PaginationComp
              v-model="currentPage"
              :total="totalPosts"
              :page-size="pageSize"
              theme="pink"
              @update:modelValue="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <UnlimitedModeModal
      v-if="showUnlimitedModal"
      @close="showUnlimitedModal = false"
      @confirm="confirmUnlimitedMode"
    />

    <CharacterSelectModal
      v-if="showCharacterModal"
      :characters="characters"
      :selectedCharacters="selectedCharacters"
      @close="showCharacterModal = false"
      @confirm="selectCharacter"
    />

    <UploadMask :visible="isUploading" />

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

    <!-- Insufficient Balance Modal -->
    <InsufficientBalanceModal
      :visible="showInsufficientBalanceModal"
      @cancel="showInsufficientBalanceModal = false"
      @recharge="goRecharge"
    />

    <!-- Computing Power Estimate Modal -->
    <ComputingPowerEstimateModal
      :visible="showComputingPowerEstimateModal"
      @cancel="showComputingPowerEstimateModal = false"
      @confirm="showComputingPowerEstimateModal = false"
    />

    <!-- Task Limit Exceeded Modal -->
    <TaskLimitExceededModal
      :visible="showTaskLimitExceededModal"
      @close="showTaskLimitExceededModal = false"
    />

    <!-- Footer -->
    <Footer
      :total-pages="Math.ceil(totalPosts / pageSize)"
      :current-page="currentPage"
      @page-change="handlePageChange"
    ></Footer>

    <!-- Video Player Modal -->
    <div v-if="showVideoModal" class="video-modal">
      <div class="video-modal-content">
        <img class="close-video-btn" src="@/assets/images/novel/close.png" alt="Close" @click="closeVideoModal" />
        <video :src="playingVideoUrl" controls autoplay class="video-player" playsinline></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from '@/util/toast';
import { v4 as uuidv4 } from 'uuid';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';
import Header from '@/components/Header.vue';
import UnlimitedModeModal from '@/components/UnlimitedModeModal.vue';
import CharacterSelectModal from '@/components/CharacterSelectModal.vue';
import ComputingPowerEstimateModal from '@/components/ComputingPowerEstimateModal.vue';
import UploadMask from '@/components/UploadMask.vue';
import EmptyState from '@/components/EmptyState.vue';
import UserInfoModal from '@/components/UserInfoModal.vue';
import InviteCodeModal from '@/components/InviteCodeModal.vue';
import GuideModal from '@/components/GuideModal.vue';
import PaginationComp from '@/components/Pagination.vue';
import Footer from '@/components/Footer.vue';
import ProcessList from '@/components/ProcessList.vue';
import TaskLimitExceededModal from '@/components/TaskLimitExceededModal.vue';
import InsufficientBalanceModal from '@/components/InsufficientBalanceModal.vue';
import router from '@/router';
import api from '@/api/index';
import { aiUrl, baseUrl } from '@/util/config';

import likeActive from '@/assets/images/detail/like_active.png';
import like from '@/assets/images/home/like.png';
import defaultAvatar from "@/assets/images/base/avatar.png";
import bannerImg from "@/assets/images/home/banner.png";
import audioIcon from "@/assets/images/home/audio.png";

const { t, locale } = useI18n();

// State
const currentNovelMode = ref('normal');
const activeContentTab = ref('suggested');
const searchQuery = ref('');
const sortOrder = ref('hot');
const loading = ref(false);
const activeContentType = ref(0);
const isSearchFocused = ref(false);

// Banner data
const banners = ref<any[]>([]);
let bannerSwiper = ref<Swiper | null>(null);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

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
  switch (contentType.value) {
    case 'video': return t('home.input.placeholder');
    case 'comic': return t('home.input.placeholderComic');
    case 'drama': return t('home.input.placeholder');
    case 'photo': return t('home.input.placeholder');
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
const showVideoModal = ref(false);
const playingVideoUrl = ref('');

const playUploadedVideo = (item: any) => {
  if (item.type === 'video' && (item.videoUrl || item.image)) {
    playingVideoUrl.value = item.videoUrl || item.image;
    showVideoModal.value = true;
  } else if (item.url) {
    playingVideoUrl.value = item.url;
    showVideoModal.value = true;
  }
};

const closeVideoModal = () => {
  showVideoModal.value = false;
  playingVideoUrl.value = '';
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
const currentComicMode = ref('normal');
const currentDramaMode = ref('normal');
const currentPhotoMode = ref('normal');

// Photo settings
const showPhotoSettings = ref(false);
const selectedPhotoQuality = ref('1K');
const selectedPhotoRatio = ref('9:16');
const photoQualityOptions = ref([
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' }
]);
const photoRatioOptions = ref([
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' }
]);

// Video settings
const showVideoMultimodalDropdown = ref(false);
const selectedVideoMultimodal = ref('multimodal');
const videoMultimodalOptions = computed(() => {
  if (currentVideoMode.value === 'unlimited') {
    return [
      { value: 'multimodal', label: t('home.videoMode.multimodal') },
      { value: 'startEndFrames', label: t('home.videoMode.startEndFrames') },
      { value: 'videoExtend', label: t('home.videoMode.videoExtend') }
    ];
  }
  return [
    { value: 'multimodal', label: t('home.videoMode.multimodal') },
    { value: 'startEndFrames', label: t('home.videoMode.startEndFrames') }
  ];
});

// Video mode state
const startFrameImage = ref<string | null>(null);
const endFrameImage = ref<string | null>(null);
const uploadedVideo = ref<string | null>(null);
const uploadedVideoCover = ref<string | null>(null);
const startFrameInput = ref<HTMLInputElement | null>(null);
const endFrameInput = ref<HTMLInputElement | null>(null);
const videoInput = ref<HTMLInputElement | null>(null);

// Reset video inputs when switching mode
function resetVideoInputs() {
  startFrameImage.value = null;
  endFrameImage.value = null;
  uploadedVideo.value = null;
  uploadedVideoCover.value = null;
  novelInput.value = '';
  inputKey.value++;
}

// Start/End Frames upload handlers
function triggerStartFrameUpload() {
  startFrameInput.value?.click();
}

function triggerEndFrameUpload() {
  endFrameInput.value?.click();
}

async function handleStartFrameChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, currentVideoMode.value);
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
}

async function handleEndFrameChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    isUploading.value = true;
    try {
      const uploadedUrl = await uploadImage(file, currentVideoMode.value);
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
    // Video duration validation
    const duration = await getVideoDuration(file);
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
      const uploadedUrl = await uploadVideo(file);
      if (uploadedUrl) {
        uploadedVideo.value = uploadedUrl;

        if (selectedVideoMultimodal.value === 'videoExtend') {
          combinedItemsVideo.value.push({
            id: Date.now().toString(),
            name: file.name,
            image: uploadedUrl,
            type: 'video',
            cover: coverUrl
          });
        }
      }
    } catch (error) {
      console.error('Failed to upload video:', error);
      toast((error as Error).message || '上传失败');
    } finally {
      isUploading.value = false;
    }
  }
}

function removeVideo() {
  uploadedVideo.value = null;
  uploadedVideoCover.value = null;
  if (selectedVideoMultimodal.value === 'videoExtend') {
    combinedItemsVideo.value = combinedItemsVideo.value.filter(item => item.type !== 'video');
  }
}

const showVideoSettings = ref(false);
const selectedVideoQuality = ref('1080P');
const selectedVideoRatio = ref('9:16');
const selectedVideoDuration = ref('15');
const videoQualityOptions = ref([
  { value: '1080P', label: '1080P' },
  { value: '720P', label: '720P' }
]);
const videoRatioOptions = ref([
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' }
]);
const videoDurationOptions = ref([
  { value: '2', label: '2' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' }
]);

const onVideoDurationChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  selectedVideoDuration.value = target.value;
};

const getSliderValuePosition = () => {
  const min = 2;
  const max = 15;
  const value = parseInt(selectedVideoDuration.value);
  const percentage = (((value - min) / (max - min)) * 100);
  return `${percentage}%`;
};

const showAtDropdown = ref(false);
const atDropdownItems = ref<any[]>([]);
const editableInputRef = ref<HTMLElement | null>(null);
const isInputFocused = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const justSwitchedTab = ref(false);
const inputKey = ref(0);

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
  const hasImagesOrCharacters =
    getSelectedCharacters().value.length > 0 ||
    getUploadedImages().value.length > 0;

  if (hasImagesOrCharacters && isInputEmpty.value && contentType.value !== 'novel') {
    return t('home.input.placeholderAt');
  }

  return getCurrentPlaceholder();
});

// Content type
const contentType = ref('novel'); // video, comic, novel
const showHelpDropdown = ref(false); // Control help dropdown visibility
const contentTypeOptions = ref([
  { value: 'novel', label: 'home.contentType.novel' },
  { value: 'comic', label: 'home.contentType.comic' },
  { value: 'drama', label: 'home.contentType.drama' },
  { value: 'photo', label: 'home.contentType.photo' },
  { value: 'video', label: 'home.contentType.video' }
]);

// Word count and language settings
const selectedWordCount = ref('30K');
const showWordCountDropdown = ref(false);
const wordCountOptions = ref([
  { value: '30K', label: '30K' },
  { value: '100K', label: '100K' },
  { value: '300K', label: '300K' },
]);

const selectedLanguage = ref('');
const showLanguageDropdown = ref(false);
const languageOptions = computed(() => [
  { value: 'cn', label: t('novel.language.zh') },
  { value: 'en', label: t('novel.language.en') },
  { value: 'jp', label: t('novel.language.jp') }
]);

const selectedLanguageText = computed(() => {
  const lang = languageOptions.value.find(l => l.value === selectedLanguage.value);
  return lang ? lang.label : '';
});

// Mode dropdown for novel mode
const showModeDropdown = ref(false);
const novelInput = ref('');

// Mode dropdown for video mode
const showVideoModeDropdown = ref(false);

const navigateToNovelGenerate = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (!novelInput.value.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  // Check if user has sufficient balance
  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedComputingPower.value || 1;

    const requiredBalance = Math.round(coverCost * overFreezeRate);

    const userBalance = balanceInfo.value.balance || 0;
    if (requiredBalance > userBalance) {
      showInsufficientBalanceModal.value = true;
      return;
    }
  }

  try {
    // Check if user has reached the task limit
    const totalProcessRes = await api.totalProcess(false) as any;
    if (totalProcessRes.code == 200 && totalProcessRes.data?.novel_doing_count >= 4) {
      showTaskLimitExceededModal.value = true;
      return;
    }

    const sessionId = uuidv4();

    const params = {
      ratio: "9:16",
      language: selectedLanguage.value,
      story_type: "novel",
      story_mode: currentNovelMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: [],
      emotion: "",
      others: {
        content: novelInput.value.trim()
      },
      addition_characters: [],
      total_words: selectedWordCount.value == '100K' ? '10' : selectedWordCount.value == '300K' ? '30' : '3',
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code == 200 || data.code == 0) {
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
  }
}

function goRecharge() {
  router.push('/ai-recharge');
  showInsufficientBalanceModal.value = false;
};

// Pagination variables
const totalPosts = ref(0);
const pageSize = ref(50);
const homePageRef = ref<HTMLElement | null>(null);
const currentStyleName = ref(''); // Current selected style name

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token');
});

// Waterfall layout state
const waterfallRef = ref<HTMLElement | null>(null);
const contentCardRefs = ref<(HTMLElement | null)[]>([]);

// Function to set content card ref at specific index
const setContentCardRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el && el instanceof HTMLElement) {
    contentCardRefs.value[index] = el;
  }
};

// Content Types
const contentTypes = ref([
  { id: 0, label: 'all' },
  { id: 2, label: 'novel' },
  { id: 1, label: 'comic' },
  { id: 3, label: 'drama' }
]);

// Sort Options
const sortOptions = ref([
  { id: 'hot', label: 'home.filter.trending' },
  { id: 'new', label: 'home.filter.latest' }
]);

// Mode Options
const modeOptions = ref([
  { id: 'normal', label: 'home.mode.normal', name: 'normal' },
  { id: 'unlimited', label: 'home.mode.unlimited', name: 'unlimited' }
]);

const userRegion = ref(false);
const isTeenager = computed(() => userInfo.value && userInfo.value.is_teenager == '1');

// Modals
const showUnlimitedModal = ref(false);
const showCharacterModal = ref(false);
const showStyleModal = ref(false);
const showVideoSettingsModal = ref(false);
const showUserInfoModal = ref(false);
const showInviteCodeModal = ref(false);
const showGuideModal = ref(false);
const showComputingPowerEstimateModal = ref(false);

// Balance info
const balanceInfo = ref<any>(null);

// Task limit modal
const showTaskLimitExceededModal = ref(false);
const showInsufficientBalanceModal = ref(false);

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

// Computed property to calculate estimated computing power for story/novel
const estimatedComputingPower = computed(() => {
  if (!balanceInfo.value || !balanceInfo.value.single_image_cost) {
    return 1;
  }

  // Convert selected word count to number of words in thousands
  let wordCountInThousands = 0;
   if (selectedWordCount.value == '30K') {
    wordCountInThousands = 3;
  } else if (selectedWordCount.value == '100K') {
    wordCountInThousands = 10;
  } else if (selectedWordCount.value == '300K') {
    wordCountInThousands = 30;
  }

  // Calculate estimated computing power
  const outlineRate = Number(balanceInfo.value.outline_rate);
  if (isNaN(outlineRate) || outlineRate <= 0) {
    return 1;
  }

  const estimatedPower = wordCountInThousands * outlineRate;

  // Round to nearest integer and ensure minimum value is 1
  const roundedPower = Math.round(estimatedPower);
  return Math.max(1, roundedPower);
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

  return Math.max(1, cost * 4);
});

// Computed property to calculate estimated computing power for video
const estimatedVideoComputingPower = computed(() => {
  if (!balanceInfo.value) {
    return 1;
  }

  const duration = parseInt(selectedVideoDuration.value) || 15;
  let costPerSecond = 0;

  if (selectedVideoQuality.value === '720P') {
    costPerSecond = Number(balanceInfo.value.single_video_cost_720p_per_second) || 5;
  } else if (selectedVideoQuality.value === '1080P') {
    costPerSecond = Number(balanceInfo.value.single_video_cost_1080p_per_second) || 6;
  }

  const totalCost = costPerSecond * duration;
  return Math.max(1, totalCost);
});

// Check if user is logged in
const checkLogin = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
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
      currentMode = currentVideoMode.value;
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
  const maxPhotos = currentMode === 'unlimited' ? 3 : 7;

  const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length;
  if (totalItems >= maxPhotos) {
    toast(t('home.error.maxPhotoReached', { max: maxPhotos }));
    return false;
  }
  return true;
};

// Content Pagination
const currentPage = ref(1);
const limit = ref(50);

// Mock Data
const characters = ref([]);

// Content Tabs
const contentTabs = ref([
  { id: 'suggested', label: 'home.tab.suggested' },
  { id: 'following', label: 'home.tab.following' },
  { id: 'subscriptions', label: 'home.tab.subscriptions' }
]);

const tabCur = ref(0);

// Content data
const allContent = ref<any[]>([]);

// Computed
const displayContent = computed(() => {
  return allContent.value;
});

// Methods
const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const switchVideoMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentVideoMode.value = 'unlimited';

      showVideoModeDropdown.value = false;
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentVideoMode.value = 'normal';
    showVideoModeDropdown.value = false;
  }
};

const switchNovelMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentNovelMode.value = 'unlimited';
      showModeDropdown.value = false;
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentNovelMode.value = 'normal';
    showModeDropdown.value = false;
  }
};

const switchComicMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentComicMode.value = 'unlimited';
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentComicMode.value = 'normal';
  }
};

const switchDramaMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentDramaMode.value = 'unlimited';
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentDramaMode.value = 'normal';
  }
};

const switchPhotoMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }

    const hasConfirmed = localStorage.getItem('unlimitedDontAsk') == '1';
    if (hasConfirmed) {
      currentPhotoMode.value = 'unlimited';
    } else {
      showUnlimitedModal.value = true;
    }
  } else {
    currentPhotoMode.value = 'normal';
  }
};

const confirmUnlimitedMode = () => {
  if (contentType.value === 'video') {
    currentVideoMode.value = 'unlimited';
  } else if (contentType.value === 'comic') {
    currentComicMode.value = 'unlimited';
  } else if (contentType.value === 'novel') {
    currentNovelMode.value = 'unlimited';
  } else if (contentType.value === 'drama') {
    currentDramaMode.value = 'unlimited';
  } else if (contentType.value === 'photo') {
    currentPhotoMode.value = 'unlimited';
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
    // Only add if not already in the list
    if (!currentSelectedCharacters.value.some(c => c.id === newChar.id)) {
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
        characterTag.dataset.characterId = newChar.id; // Add character ID for easier removal

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

        // Add a space after the character tag for better readability
        const spaceNode = document.createTextNode(' ');
        target.appendChild(spaceNode);

        // Focus the input to ensure cursor is visible
        target.focus();

        // Set cursor position after the space
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStartAfter(spaceNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Update input empty state (Vue will handle placeholder)
        isInputEmpty.value = false;
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
  // Reset all content and settings when switching content types
  // Clear video-related content
  selectedCharactersVideo.value = [];
  uploadedImagesVideo.value = [];
  combinedItemsVideo.value = [];
  inputContentVideo.value = '';
  inputHtmlVideo.value = '';

  // Clear comic-related content
  selectedCharactersComic.value = [];
  uploadedImagesComic.value = [];
  combinedItemsComic.value = [];
  inputContentComic.value = '';
  inputHtmlComic.value = '';

  // Clear novel-related content
  novelInput.value = '';

  // Reset novel settings to default
  selectedWordCount.value = '30K';
  currentStyleName.value = '';

  // Clear drama-related content
  selectedCharactersDrama.value = [];
  uploadedImagesDrama.value = [];
  combinedItemsDrama.value = [];
  inputContentDrama.value = '';
  inputHtmlDrama.value = '';

  // Clear photo-related content
  uploadedImagesPhoto.value = [];
  combinedItemsPhoto.value = [];
  inputContentPhoto.value = '';
  inputHtmlPhoto.value = '';

  // Reset modes to default
  currentVideoMode.value = 'normal';
  currentComicMode.value = 'normal';
  currentDramaMode.value = 'normal';
  currentNovelMode.value = 'normal';
  selectedVideoMultimodal.value = 'multimodal'; // Reset video mode to default

  // Reset video settings to default
  selectedVideoQuality.value = '1080P';
  selectedVideoRatio.value = '9:16';
  selectedVideoDuration.value = '15';

  // Reset photo settings to default
  selectedPhotoQuality.value = '1K';
  selectedPhotoRatio.value = '9:16';

  // Switch content type
  contentType.value = type;

  // Clear input area
  nextTick(() => {
    if (editableInputRef.value) {
      editableInputRef.value.innerHTML = '';
      isInputEmpty.value = true;
    }
  });
};

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
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
  showWordCountDropdown.value = false;
  showModeDropdown.value = false;
};

const selectWordCount = (value: string) => {
  selectedWordCount.value = value;
  showWordCountDropdown.value = false;
};

const selectLanguage = (item: any) => {
  selectedLanguage.value = item.value;
  showLanguageDropdown.value = false;
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
  }
};

function getCountry() {
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
  })
}

// Update unlimited mode visibility based on country and user info
function updateUnlimitedModeVisibility() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        // Not in China, show unlimited mode for all users (teenagers will see disabled icon)
        userRegion.value = true;
      } else {
        // In China, never show unlimited mode
        userRegion.value = false;
      }
    }
  }).catch(err => {
    console.log(err);
  })
}

const generateVideo = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  let inputContent = '';

  if (selectedVideoMultimodal.value === 'startEndFrames' || selectedVideoMultimodal.value === 'videoExtend') {
    inputContent = novelInput.value || '';
  } else {
    if (!editableInputRef.value) {
      toast(t('home.error.emptyInput'));
      return;
    }
    inputContent = editableInputRef.value.textContent || '';
  }

  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  try {
    // Default video settings
    const videoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
      aspectRatio: "9:16"
    };

    // 生成图片、视频和音频的索引映射（按类型单独计数）
    const imageMap: Record<string, number> = {};
    const videoMap: Record<string, number> = {};
    const audioMap: Record<string, number> = {};

    let imageCount = 0;
    let videoCount = 0;
    let audioCount = 0;

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
            if (imgElement) {
              const video = combinedItemsVideo.value.find(item =>
                item.type === 'video' && (item.image === imgElement.src || imgElement.src.includes(item.image))
              );
              if (video) {
                const videoIndex = videoMap[video.id] || 1;
                processedContent += `<vid_${videoIndex}>`;
              }
            }
          } else if (element.classList.contains('audio-tag')) {
            // 处理音频标签
            const imgElement = element.querySelector('img');
            if (imgElement) {
              const audio = combinedItemsVideo.value.find(item =>
                item.type === 'audio' && (item.image === imgElement.src || imgElement.src.includes(item.image))
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
                              selectedVideoMultimodal.value == 'startEndFrames' ? 'first_last_frames' : 'video_extension';

    let reference_images: any[] = [];
    if (selectedVideoMultimodal.value === 'startEndFrames') {
      if (startFrameImage.value) {
        reference_images.push({ type: "first_frame", url: startFrameImage.value });
      }
      if (endFrameImage.value) {
        reference_images.push({ type: "last_frame", url: endFrameImage.value });
      }
    } else {
      reference_images = combinedItemsVideo.value.filter(item => item.type === 'image').map(item => item.image);
    }

    let reference_videos: any[] = [];
    if (selectedVideoMultimodal.value === 'videoExtend') {
      if (uploadedVideo.value) {
        reference_videos = [uploadedVideo.value];
      }
    } else {
      reference_videos = combinedItemsVideo.value.filter(item => item.type === 'video').map(item => item.image);
    }

    const params = {
      ratio: selectedVideoRatio.value,
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
      story_type: "simple_video",
      story_mode: currentVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: reference_images,
      reference_videos: reference_videos,
      reference_audios: combinedItemsVideo.value.filter(item => item.type === 'audio').map(item => item.image),
      emotion: "",
      others: {
        content: processedContent,
        list: combinedItemsVideo.value
      },
      simple_video_resolution: selectedVideoQuality.value.toLowerCase(),
      simple_video_duration: parseInt(selectedVideoDuration.value),
      simple_video_generate_mode: videoGenerateMode
    };

    const settingsResponse = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      topic: processedContent
    }) as any;

    if (response.code == 200) {
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
      }
    } else {
      toast(response.message || t('fail'));
    }
  } catch (error) {
    console.log(error);
    toast(t('fail'));
  }
};

const generateComic = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  try {
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
  } else {
    processedContent = inputContent.trim();
  }

  const params = {
    ratio: "9:16",
    language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
    story_type: "manhua",
    story_mode: currentComicMode.value == 'unlimited' ? 'nsfw' : 'normal',
    story_style: "",
    reference_images: uploadedImagesComic.value.map(img => img.image),
    emotion: "",
    others: {
      content: processedContent,
      list: combinedItemsComic.value
    },
    addition_characters: selectedCharactersComic.value.map(character => ({
      id: character.id,
      name: character.name,
      desc: character.description,
      main_image_url: character.image,
      tri_view_url: character.tri_image
    }))
  };

  const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token
    },
    body: JSON.stringify(params)
  });

  if (response.ok) {
    const data = await response.json();
    if (data.code == 200 || data.code == 0) {
      // window.open(`/tools/comic/${sessionId}`, '_blank');
      window.location.href = `/tools/comic/${sessionId}`;

      if (editableInputRef.value) {
        editableInputRef.value.textContent = '';
        isInputEmptyComic.value = true;
        isInputEmpty.value = true;
        selectedCharactersComic.value = [];
        uploadedImagesComic.value = [];
        combinedItemsComic.value = [];
        inputContentComic.value = '';
        inputHtmlComic.value = '';
      }
    } else {
      toast(data.message)
    }
  }
  }
  catch (error) {
    console.error('Error in generateComic:', error);
    toast(t('fail'));
  }
};

const generateDrama = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  try {
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
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
      story_type: "manju",
      story_mode: currentDramaMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: uploadedImagesDrama.value.map(img => img.image),
      emotion: "",
      others: {
        content: processedContent.trim(),
        list: combinedItemsDrama.value
      },
      addition_characters: selectedCharactersDrama.value.map(character => ({
        id: character.id,
        name: character.name,
        desc: character.description,
        main_image_url: character.image,
        tri_view_url: character.tri_image
      }))
    };

    const response = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code == 200 || data.code == 0) {
        window.location.href = `/tools/video/${sessionId}`;

        if (editableInputRef.value) {
          editableInputRef.value.textContent = '';
          isInputEmptyDrama.value = true;
          isInputEmpty.value = true;
          selectedCharactersDrama.value = [];
          uploadedImagesDrama.value = [];
          combinedItemsDrama.value = [];
          inputContentDrama.value = '';
          inputHtmlDrama.value = '';
        }
      } else {
        toast(data.message);
      }
    }
  } catch (error) {
    console.error('Error in generateDrama:', error);
    toast(t('fail'));
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
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  if (!editableInputRef.value) {
    toast(t('home.error.emptyInput'));
    return;
  }

  const inputContent = editableInputRef.value.textContent || '';
  if (!inputContent.trim()) {
    toast(t('home.error.emptyInput'));
    return;
  }

  // Check if user has sufficient balance
  if (balanceInfo.value) {
    const overFreezeRate = balanceInfo.value.over_freeze_rate || 1;
    const coverCost = estimatedPhotoComputingPower.value || 1;

    const requiredBalance = Math.round(coverCost * overFreezeRate);
    const userBalance = balanceInfo.value.balance || 0;

    if (requiredBalance > userBalance) {
      showInsufficientBalanceModal.value = true;
      return;
    }
  }

  try {
    const sessionId = uuidv4();

    // Photo settings
    const photoSettings = {
      language: locale.value == 'zh' ? 'cn' : locale.value == 'jp' ? 'jp' : 'en',
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
      addition_characters: []
    };

    const settingsResponse = await fetch(`${aiUrl}app/config/user-selected?session_id=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      topic: inputContent.trim()
    };

    const response = await api.generateSinglePhoto(params) as any;

    if (response.code == 200) {
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

// Switch content tab and reload data
const switchContentTab = (tabId: string, index: number) => {
  // Check if user is logged in when switching to following or subscriptions tabs
  if ((tabId === 'following' || tabId === 'subscriptions')) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }

  // Set flag to prevent content restoration
  justSwitchedTab.value = true;

  // Update input key to force re-render of input elements
  inputKey.value++;

  activeContentTab.value = tabId;
  tabCur.value = index;
  currentPage.value = 1;
  activeContentType.value = 0; // Reset to 'all' tab in content-type-filter
  allContent.value = []; // Clear old data to show loading state
  contentCardRefs.value = []; // Clear card refs to reset layout
  loading.value = false; // Reset loading state to allow new request

  // Clear selected characters and images for both video and comic modes
  selectedCharactersVideo.value = [];
  uploadedImagesVideo.value = [];
  uploadedVideosVideo.value = [];
  uploadedAudiosVideo.value = [];
  combinedItemsVideo.value = [];
  inputContentVideo.value = '';
  inputHtmlVideo.value = '';
  isInputEmptyVideo.value = true;

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
  if (editableInputRef.value) {
    editableInputRef.value.innerHTML = '';
    isInputEmpty.value = true;
  }

  // Use nextTick to ensure DOM is updated before loading new content
  nextTick(() => {
    loadContent(1);
    // Reset flag after a short delay
    setTimeout(() => {
      justSwitchedTab.value = false;
    }, 100);
  });
};

// Trigger file upload dialog
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
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

const handleFileChange = async (event: Event) => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    // Check video/audio total duration limit (14 seconds) for video multimodal mode
    if (contentType.value === 'video' && selectedVideoMultimodal.value === 'multimodal') {
      let totalDuration = 0;
      for (const file of Array.from(input.files)) {
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(file);
          totalDuration += duration;
        }
      }

      if (totalDuration > 14) {
        toast(t('home.error.videoAudioDurationLimit'));
        input.value = '';
        return;
      }
    }

    // Check total count before uploading new images
    // Get current mode based on content type
    let currentMode = 'normal';
    switch (contentType.value) {
      case 'video':
        currentMode = currentVideoMode.value;
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
    const maxPhotos = currentMode === 'unlimited' ? 3 : 7;
    const maxFileSizeBytes = currentMode === 'unlimited' ? 20 * 1024 * 1024 : 30 * 1024 * 1024;
    const maxVideoSizeBytes = currentMode === 'unlimited' ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    const maxAudioSizeBytes = 15 * 1024 * 1024;

    // Check total count limit
    const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length + input.files.length;
    if (totalItems > maxPhotos) {
      toast(t('home.error.maxPhotoReached', { max: maxPhotos }));
      input.value = '';
      return;
    }

    // Check individual file size for images
    for (const file of Array.from(input.files)) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        if (file.size > maxFileSizeBytes) {
          toast(t('home.error.maxPhotoSize', { max: currentMode === 'unlimited' ? 20 : 30 }));
          input.value = '';
          return;
        }
      }
    }

    isUploading.value = true;

    try {
      const files = Array.from(input.files);
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
              toast(t('home.error.maxVideoSize', { max: currentMode === 'unlimited' ? 100 : 50 }));
              return;
            }
            // Check video/audio count limit for multimodal mode
            if (contentType.value === 'video' && selectedVideoMultimodal.value === 'multimodal') {
              const existingVideos = uploadedVideosVideo.value.length;
              const newVideos = files.filter(f => f.type.startsWith('video/')).length;
              if (existingVideos + newVideos > 3) {
                toast(t('home.error.maxVideoCount'));
                return;
              }
            }
          } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
            // Validate audio format
            const audioExtensions = ['.mp3', '.wav'];
            const audioExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!audioExtensions.includes(audioExtension)) {
              toast(t('home.error.invalidAudioFormat'));
              return;
            }
            // Check audio file size
            if (file.size > maxAudioSizeBytes) {
              toast(t('home.error.maxAudioSize', { max: 15 }));
              return;
            }
            // Check audio duration (min 2 seconds)
            const audioDuration = await getMediaDuration(file);
            if (audioDuration < 2) {
              toast(t('home.error.audioDurationTooShort', { min: 2 }));
              return;
            }
            // Check video/audio count limit for multimodal mode
            if (contentType.value === 'video' && selectedVideoMultimodal.value === 'multimodal') {
              const existingAudios = uploadedAudiosVideo.value.length;
              const newAudios = files.filter(f => f.type.startsWith('audio/')).length;
              if (existingAudios + newAudios > 3) {
                toast(t('home.error.maxAudioCount'));
                return;
              }
            }
          }

          let coverUrl = '';

          // Capture and upload video cover if it's a video
          if (fileType === 'video') {
            try {
              const frameDataUrl = await captureVideoFirstFrame(file);
              const coverFile = dataURLToFile(frameDataUrl, `${file.name}_cover.jpg`);
              coverUrl = await uploadImage(coverFile, currentVideoMode.value);
            } catch (error) {
              console.error('Failed to capture video cover:', error);
            }
          }

          // Upload using appropriate API
          const uploadedUrl = fileType === 'video'
            ? await uploadVideo(file)
            : fileType === 'audio'
            ? await uploadAudio(file)
            : await uploadImage(file, currentVideoMode.value);

          const newItem = fileType === 'video' ? {
            id: Date.now() + index.toString(),
            name: file.name,
            image: coverUrl,           // 视频类型：image存封面
            videoUrl: uploadedUrl,     // 视频地址单独存
            type: fileType,
            cover: coverUrl            // 保持cover字段兼容
          } : {
            id: Date.now() + index.toString(),
            name: file.name,
            image: uploadedUrl,
            type: fileType,
            cover: coverUrl
          };

          // Add to appropriate array based on type (only for video mode multimodal)
          if (contentType.value === 'video' && selectedVideoMultimodal.value === 'multimodal') {
            if (fileType === 'image') {
              uploadedImagesVideo.value.push(newItem);
            } else if (fileType === 'video') {
              uploadedVideosVideo.value.push(newItem);
            } else if (fileType === 'audio') {
              uploadedAudiosVideo.value.push(newItem);
            }
            // Add to combined items array with type information
            currentCombinedItems.value.push(newItem);
          } else {
            currentUploadedImages.value.push(newItem);
            currentCombinedItems.value.push({ ...newItem, type: 'image' });
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
              itemIndex = uploadedVideosVideo.value.length;
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
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return '';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const authHeaders = window.AntiCrawler.generateAuthParams(token);

  const parma = {
    method: "POST",
    headers: {
      token: token,
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
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }

  const cleanUrl = presignedUrl.split('?')[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, 'https://ddu2v98cehw9k.cloudfront.net');
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

  // Replace domain in URL
  const cleanUrl = presignedUrl.split('?')[0];
  return cleanUrl.replace(/^https?:\/\/[^/]+/, 'https://ddu2v98cehw9k.cloudfront.net');
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
      const tagItemId = tag.dataset.itemId;
      if (tagItemId === id) {
        tagsToRemove.push(tag as HTMLElement);
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

  // Update image order in input-textarea
  // Note: Using nextTick to ensure DOM is updated before modifying it
  nextTick(() => {
    if (editableInputRef.value) {
      try {
        // Update image tags based on current content type
        const currentUploadedImages = getUploadedImages();
        const imageTags = editableInputRef.value.querySelectorAll('.image-tag');
        imageTags.forEach(tag => {
          const img = tag.querySelector('img');
          if (img) {
            const image = currentUploadedImages.value.find(imgItem =>
              imgItem.image === img.src || img.src.includes(imgItem.image)
            );
            if (image) {
              const imageIndex = currentUploadedImages.value.findIndex(imgItem => imgItem.id === image.id) + 1;
              const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
              if (textNode) {
                textNode.textContent = `${t('home.img')}${imageIndex}`;
              }
            }
          }
        });

        // Update video tags
        const videoTags = editableInputRef.value.querySelectorAll('.video-tag');
        videoTags.forEach(tag => {
          const video = tag.querySelector('video');
          if (video) {
            const videoItem = uploadedVideosVideo.value.find(item =>
              item.image === video.src || video.src.includes(item.image)
            );
            if (videoItem) {
              const videoIndex = uploadedVideosVideo.value.findIndex(item => item.id === videoItem.id) + 1;
              const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
              if (textNode) {
                textNode.textContent = `${t('home.video')}${videoIndex}`;
              }
            }
          }
        });

        // Update audio tags
        const audioTags = editableInputRef.value.querySelectorAll('.audio-tag');
        audioTags.forEach(tag => {
          const img = tag.querySelector('img');
          if (img) {
            const audio = uploadedAudiosVideo.value.find(item =>
              item.image === img.src || img.src.includes(item.image)
            );
            if (audio) {
              const audioIndex = uploadedAudiosVideo.value.findIndex(item => item.id === audio.id) + 1;
              const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
              if (textNode) {
                textNode.textContent = `${t('home.audio')}${audioIndex}`;
              }
            }
          }
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
  });
};

// Handle input for @ dropdown
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement;

  // 计算实际的文本内容，排除非可编辑标签中的文本
  let actualText = '';
  const textNodes = Array.from(target.childNodes).filter(node => {
    if (node.nodeType === 3) {
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
      return !isInNonEditable;
    }
    return false;
  });
  textNodes.forEach(node => {
    actualText += node.textContent || '';
  });

  isInputEmpty.value = actualText.trim() === '';

  const cursorPosition = getCursorPosition(target);
  const textBeforeCursor = actualText.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  // Check if there are any items to show in dropdown (including videos and audios for video tab)
  const hasItems = currentCombinedItems.value.length > 0;

  if (atIndex !== -1 &&
      atIndex === textBeforeCursor.length - 1 &&
      hasItems) {

    showAtDropdown.value = true;
    // Use the existing combinedItems array
    atDropdownItems.value = currentCombinedItems.value;

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
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.top = `${relativeTop + 5}px`; // @ 符号下方 5px
                dropdown.style.left = `${relativeLeft}px`; // @ 符号左侧对齐
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
  } else if (event.key === 'Backspace') {
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
            if (element.classList.contains('character-tag-input') || element.classList.contains('image-tag')) {
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
  // Only handle @ dropdown logic, don't update isInputEmpty
  if (editableInputRef.value) {
    const target = editableInputRef.value;
    const text = target.textContent || '';
    const cursorPosition = getCursorPosition(target);
    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const currentSelectedCharacters = getSelectedCharacters();
    const currentUploadedImages = getUploadedImages();
    const currentCombinedItems = getCombinedItems();

    // Only show dropdown if:
    // 1. There's an @ symbol
    // 2. @ is the last character before cursor (just typed)
    // 3. There are any items (images, videos, audios, characters)
    const hasItems = currentCombinedItems.value.length > 0;

    if (atIndex !== -1 &&
        atIndex === textBeforeCursor.length - 1 &&
        hasItems) {
      showAtDropdown.value = true;
      // Use the existing combinedItems array
      atDropdownItems.value = currentCombinedItems.value;

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
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.left - inputInnerRect.left;

                dropdown.style.top = `${relativeTop + 5}px`; // @ 符号下方 5px
                dropdown.style.left = `${relativeLeft}px`; // @ 符号左侧对齐
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
  checkLogin();
  isInputFocused.value = true;
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

  // Get plain text from clipboard
  const text = event.clipboardData?.getData('text/plain') || '';

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
};

// Select @ dropdown item
const selectAtItem = (item: any) => {
  if (!editableInputRef.value) {
    return;
  }

  const target = editableInputRef.value;

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
    img.src = item.cover;
    img.className = 'video-tag-img';
    itemTag.appendChild(img);

    const videoIndex = uploadedVideosVideo.value.findIndex(v => v.id === item.id) + 1;
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

  // Find and remove @ symbol from the text content
  const text = target.textContent || '';
  const lastAtIndex = text.lastIndexOf('@');

  if (lastAtIndex !== -1) {
    // Get all nodes and find the @ position
    let currentPos = 0;
    let foundAtNode: Node | null = null;
    let atNodeOffset = 0;

    const findAtSymbol = (node: Node): boolean => {
      if (node.nodeType === 3) { // TEXT_NODE
        const nodeText = node.textContent || '';
        const nodeLength = nodeText.length;

        // Check if @ is in this node
        if (currentPos <= lastAtIndex && lastAtIndex < currentPos + nodeLength) {
          foundAtNode = node;
          atNodeOffset = lastAtIndex - currentPos;
          return true;
        }
        currentPos += nodeLength;
      } else if (node.nodeType === 1) { // ELEMENT_NODE
        for (let i = 0; i < node.childNodes.length; i++) {
          if (findAtSymbol(node.childNodes[i])) {
            return true;
          }
        }
      }
      return false;
    };

    findAtSymbol(target);

    if (foundAtNode) {
      try {
        // Create a range to delete @ and insert image tag
        const range = document.createRange();
        range.setStart(foundAtNode, atNodeOffset);
        range.setEnd(foundAtNode, atNodeOffset + 1);

        // Delete the @ symbol
        range.deleteContents();

        // Insert the item tag
        range.insertNode(itemTag);

        // Add a space after the item tag for better readability
        const spaceNode = document.createTextNode(' ');
        if (itemTag.parentNode) {
          itemTag.parentNode.insertBefore(spaceNode, itemTag.nextSibling);
        }

        // 确保itemTag已经在DOM中
        if (spaceNode.parentNode) {
          const tagRange = document.createRange();
          tagRange.setStartAfter(spaceNode);
          tagRange.collapse(true);

          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(tagRange);
          }
        }

        // Focus back to the input
        target.focus();
      } catch (error) {
        console.log('[selectAtItem] 插入失败:', error);
        // 失败时直接在末尾添加
        target.appendChild(itemTag);
        // Add a space after the item tag
        target.appendChild(document.createTextNode(' '));
        target.focus();
      }
    } else {
      console.log('[selectAtItem] 未找到 @ 符号所在节点');
      // 未找到时直接在末尾添加
      target.appendChild(itemTag);
      // Add a space after the item tag
      target.appendChild(document.createTextNode(' '));
      target.focus();
    }
  } else {
    console.log('[selectAtItem] 文本中没有 @ 符号');
    // 没有@符号时直接在末尾添加
    target.appendChild(itemTag);
    // Add a space after the item tag
    target.appendChild(document.createTextNode(' '));
    target.focus();
  }

  // Update input empty state after inserting image tag
  const inputContent = target.textContent || '';
  isInputEmpty.value = inputContent.trim() === '';

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

// Load content from API
const loadContent = async (page = 1) => {
  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab combination at the time of the request
  const currentActiveTab = activeContentTab.value;
  const currentContentType = activeContentType.value;
  const currentSortOrder = sortOrder.value;

  loading.value = true;
  try {
    let res;

    switch (currentActiveTab) {
      case 'suggested':
        res = await api.homePostList(page, pageSize.value, '', currentContentType, locale.value == 'zh' ? 'cn' : locale.value) as any;
        break;
      case 'following':
        res = await api.homeFollowList(page, pageSize.value, currentContentType) as any;
        break;
      case 'subscriptions':
        res = await api.homeSubscriptionList(page, pageSize.value, currentContentType) as any;
        break;
      default:
        res = await api.homePostList(page, pageSize.value, '', currentContentType, locale.value == 'zh' ? 'cn' : locale.value) as any;
    }

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab or content type has changed while the request was in flight
    if (currentActiveTab !== activeContentTab.value || currentContentType !== activeContentType.value || currentSortOrder !== sortOrder.value) {
      return; // Skip processing this response as the tab has changed
    }

    if (res.code == 0 || res.code == 200) {
      const data = res.data?.data || res.data || [];

      data.forEach((item: any) => {
        if (activeContentTab.value == 'suggested') {
          item.is_liked = item.is_liked || 0;
        } else {
          item.is_liked = item.is_liked ? 1 : 0;
        }
      });

      // Always replace content for pagination (not append)
      allContent.value = data;

      // Update total count for pagination
      const totalNum = res.data?.allnums;
      totalPosts.value = typeof totalNum === 'number' && !isNaN(totalNum) ? totalNum : (typeof totalNum === 'string' && !isNaN(Number(totalNum)) ? Number(totalNum) : 0);

      nextTick(() => {
        layoutWaterfall();
      });
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
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

const navigateToDetail = (id: string) => {
  const type = activeContentTab.value == 'following' ? 2 : activeContentTab.value == 'subscriptions' ? 3 : 1;
  // Save current tab and content type before navigating
  localStorage.setItem('homeContentTab', activeContentTab.value);
  localStorage.setItem('homeContentType', activeContentType.value.toString());
  router.push({ path: '/detail', query: { id: id , type: type } });
};

async function toggleLike(item: any) {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

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
        allContent.value[postIndex].like_count = isCurrentlyLiked
          ? (parseInt(allContent.value[postIndex].like_count || "0") - 1).toString()
          : (parseInt(allContent.value[postIndex].like_count || "0") + 1).toString();
      }
    }
  } catch (error) {
    console.error('Like/unlike error:', error);
  }
}

const handleSearch = () => {
  router.push({ path: "/search", query: { keyword: searchQuery.value.trim(), type: "post" } });
};

watch(activeContentType, () => {
  currentPage.value = 1;
  allContent.value = [];
  loadContent(1);
});

watch(sortOrder, () => {
  currentPage.value = 1;
  allContent.value = [];
  loadContent(1);
});

watch(() => locale.value, () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  currentPage.value = 1;
  allContent.value = [];
  loadContent(1);
});

onMounted(() => {
  window.scrollTo(0, 0);

  getCountry();

  // Load video mode settings from local storage
  try {
    const storedVideoMode = localStorage.getItem('currentVideoMode');
    if (storedVideoMode) {
      currentVideoMode.value = storedVideoMode;
    }
    const storedComicMode = localStorage.getItem('currentComicMode');
    if (storedComicMode) {
      currentComicMode.value = storedComicMode;
    }
  } catch (error) {
    console.error('Error loading video mode settings:', error);
  }

  // Restore last content tab and content type if coming back from detail page
  try {
    const homeContentTab = localStorage.getItem('homeContentTab');
    if (homeContentTab && (homeContentTab == 'suggested' || homeContentTab == 'following' || homeContentTab == 'subscriptions')) {
      activeContentTab.value = homeContentTab;
      localStorage.removeItem('homeContentTab');
    }

    const homeContentType = localStorage.getItem('homeContentType');
    if (homeContentType !== null) {
      const contentTypeNum = parseInt(homeContentType, 10);
      if (!isNaN(contentTypeNum)) {
        activeContentType.value = contentTypeNum;
      }
      localStorage.removeItem('homeContentType');
    }
  } catch (error) {
    console.error('Error loading last content tab or type:', error);
  }

  // Load novel settings from local storage
  try {
    const systemLocale = locale.value;
    if (systemLocale == 'zh') {
      selectedLanguage.value = 'cn';
    } else if (systemLocale == 'jp') {
      selectedLanguage.value = 'jp';
    } else {
      selectedLanguage.value = 'en';
    }
  } catch (error) {
    console.error('Error loading novel settings:', error);
  }

  // Load selected characters from local storage (only for characters cast from CharacterLibrary)
  try {
    const storedCharacters = localStorage.getItem('selectedCharacters');
    if (storedCharacters) {
      // Clear the cache after loading as we no longer use the old variable
      localStorage.removeItem('selectedCharacters');
    }
  } catch (error) {
    console.error('Error loading selected characters:', error);
  }

  // Check for casted character from CharacterDetailModal
  try {
    const castedCharacter = localStorage.getItem('castedCharacter');
    if (castedCharacter) {
      const character = JSON.parse(castedCharacter);

      const currentSelectedCharacters = getSelectedCharacters();
      const currentUploadedImages = getUploadedImages();
      const currentCombinedItems = getCombinedItems();

      // Check if character is already in the list
      if (!currentSelectedCharacters.value.some(c => c.id === character.id)) {
        // Check if total items exceed limit
        if (currentSelectedCharacters.value.length + currentUploadedImages.value.length < 7) {
          currentSelectedCharacters.value.push(character);
          currentCombinedItems.value.push({ ...character, type: 'character' });

          // Insert character tag into input-textarea
          if (editableInputRef.value) {
            const target = editableInputRef.value;

            // Create character tag
            const characterTag = document.createElement('span');
            characterTag.className = 'character-tag-input';
            characterTag.contentEditable = 'false'; // Make the character tag non-editable

            // Create image element
            const img = document.createElement('img');
            img.src = character.image;
            img.alt = character.name;
            img.className = 'character-tag-img';

            // Create text node with character name
            const textNode = document.createTextNode(character.name);

            // Append image and text to tag
            characterTag.appendChild(img);
            characterTag.appendChild(textNode);

            // Append character tag to the end
            target.appendChild(characterTag);

            // Focus the input to ensure cursor is visible
            target.focus();

            // Set cursor position after the character tag
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.setStartAfter(characterTag);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            // Update input empty state
            isInputEmpty.value = false;
          }

          // Remove from cache
          localStorage.removeItem('castedCharacter');
        }
      }
    }
  } catch (error) {
    console.error('Error loading casted character:', error);
    localStorage.removeItem('castedCharacter');
  }

  loadContent(1);
  loadBanners();

  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClickOutside);

  checkFirstRegister();
});

// Load banners
const loadBanners = async () => {
  try {
    const res = await api.getBanner() as any;
    if (res.code == 0 || res.code == 200) {
      banners.value = res.data.banners || [];

      await nextTick();
      initBannerSwiper();
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg);
    }
  } catch (error) {
    toast(t('fail'));
  }
};

// Initialize banner swiper
const initBannerSwiper = () => {
  bannerSwiper.value = new Swiper('.banner-swiper .swiper-container', {
    modules: [Autoplay, Pagination],
    slidesPerView: 1,
    spaceBetween: 0,
    loop: banners.value.length > 1,
    autoplay: banners.value.length > 1 ? {
      delay: 5000,
      disableOnInteraction: false
    } : false,
    pagination: {
      el: '.banner-swiper .swiper-pagination',
      clickable: true,
      enabled: true
    },
  })
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', handleClickOutside);
});

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

  if (isFirstLogin == '1') {
    showInviteCodeModal.value = true;
    localStorage.removeItem("isFirstLogin");
  }

  if (isFirstRegister == '1') {
    showUserInfoModal.value = true;
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
            toast(locale.value == 'jp' ?  res.msg_jp : res.msg);
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
            toast(locale.value == 'jp' ?  res.msg_jp : res.msg);
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
            toast(locale.value == 'jp' ?  res.msg_jp : res.msg);
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
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
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
</script>

<style lang="scss" scoped>
  @use '@/scss/Home.scss';
</style>