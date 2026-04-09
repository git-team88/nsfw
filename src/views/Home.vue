<template>
  <div class="home-page" ref="homePageRef">
    <Header ref="headerRef" :cur="0" @user-info-loaded="handleUserInfoLoaded"></Header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">{{ t('home.hero.title') }}</h1>

          <!-- Input Area -->
          <div class="input-area-box">
            <!-- Content Type Selector -->
            <div class="content-type-selector">
              <div
              v-for="(type, index) in contentTypeOptions"
              :key="type.value"
              class="type-btn"
              :class="{ active: contentType == type.value }"
              @click="selectContentType(type.value)"
            >
              <img :src="contentType == type.value ? normalActiveIcon : normalIcon" alt="" />
              <span>{{ t(type.label) }}</span>
            </div>
            </div>

            <!-- Video Mode Content -->
            <div v-if="contentType == 'video'">
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
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />

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
                      <!-- Mode Selector for Video -->
                      <div class="video-selector" @click="toggleVideoModeDropdown" :class="{ open: showVideoModeDropdown }">
                        <div class="selector-header">
                          <div class="selector-img" v-if="currentVideoMode == 'normal'">
                            <img :src="novelNormalIcon" alt="" />
                          </div>
                          <div class="selector-img" v-else>
                            <img :src="novelUnlimitIcon" alt="" />
                          </div>
                          <span>{{ t(currentVideoMode == 'normal' ? 'home.mode.normal' : 'home.mode.unlimited') }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showVideoModeDropdown">
                          <div
                            v-for="mode in modeOptions"
                            :key="mode.name"
                            class="dropdown-item"
                            :class="{ active: currentVideoMode == mode.name }"
                            @click.stop="switchVideoMode(mode.name, mode.name == 'normal' ? 1 : 2)"
                          >

                            <div class="item-img" v-if="mode?.name == 'normal'">
                              <img :src="novelNormalIcon" alt="" />
                            </div>
                            <div class="item-img" v-if="userRegion && mode?.name == 'unlimited'">
                              <img :src="novelUnlimitIcon" alt="" />
                            </div>
                            <span>{{ t(mode.label || '') }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="option-btn character-btn" @click="() => { if (checkLogin() && checkItemLimit()) showCharacterModal = true }">
                        <img src="@/assets/images/home/role_icon.png" alt="" />
                        <span>{{ t('home.option.character') }}</span>
                      </div>
                      <div class="option-btn reference-btn" @click="() => { if (checkLogin() && checkItemLimit()) triggerFileUpload() }">
                        <img src="@/assets/images/home/img_icon.png" alt="" />
                        <span>{{ t('home.option.reference') }}</span>
                      </div>
                      <div class="option-btn style-btn" @click="() => { if (checkLogin()) showStyleModal = true }">
                        <img src="@/assets/images/home/style_icon.png" alt="" />
                        <span>{{ isLoggedIn ? (currentStyleName || t('home.option.style')) : t('home.option.style') }}</span>
                      </div>
                      <!-- <div class="option-btn script-btn" @click="showScriptModal = true">
                        <img src="@/assets/images/home/text_icon.png" alt="" />
                        <span>{{ t('home.option.script') }}</span>
                      </div> -->
                      <div class="option-btn settings-btn" @click="() => { if (checkLogin()) openVideoSettingsModal() }">
                      <img src="@/assets/images/home/set_icon.png" alt="" />
                      <span>{{ t('home.option.settings') }}</span>
                    </div>
                    </div>

                    <div class="generate-btn" :class="currentVideoMode == 'unlimited' ? 'unlimit' : ''" @click="generateVideo">
                      <img src="@/assets/images/home/send.png" alt="Send" />
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
                        <img :src="item.image" :alt="item.name" :class="item.type === 'character' ? 'character-avatar' : 'uploaded-image'" />

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
                      <!-- Mode Selector for Comic -->
                      <div class="video-selector" @click="toggleVideoModeDropdown" :class="{ open: showVideoModeDropdown }">
                        <div class="selector-header">
                          <div class="selector-img" v-if="currentVideoMode == 'normal'">
                            <img :src="novelNormalIcon" alt="" />
                          </div>
                          <div class="selector-img" v-else>
                            <img :src="novelUnlimitIcon" alt="" />
                          </div>
                          <span>{{ t(currentVideoMode === 'normal' ? 'home.mode.normal' : 'home.mode.unlimited') }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showVideoModeDropdown">
                          <div
                            v-for="mode in modeOptions"
                            :key="mode.name"
                            class="dropdown-item"
                            :class="{ active: currentVideoMode == mode.name }"
                            @click.stop="switchVideoMode(mode.name, mode.name == 'normal' ? 1 : 2)"
                          >

                            <div class="item-img" v-if="mode?.name == 'normal'">
                              <img :src="novelNormalIcon" alt="" />
                            </div>
                            <div class="item-img" v-if="userRegion && mode?.name == 'unlimited'">
                              <img :src="novelUnlimitIcon" alt="" />
                            </div>
                            <span>{{ t(mode.label || '') }}</span>
                          </div>
                        </div>
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

                    <div class="generate-btn" :class="currentVideoMode == 'unlimited' ? 'unlimit' : ''" @click="generateComic">
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
                      <!-- Mode Selector -->
                      <div class="novel-selector" @click="toggleModeDropdown" :class="{ open: showModeDropdown }">
                        <div class="selector-header">
                          <div class="selector-img" v-if="currentNovelMode === 'normal'">
                            <img :src="novelNormalIcon" alt="" />
                          </div>
                          <div class="selector-img" v-else>
                            <img :src="novelUnlimitIcon" alt="" />
                          </div>
                          <span>{{ t(currentNovelMode === 'normal' ? 'home.mode.normal' : 'home.mode.unlimited') }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown mode" v-if="showModeDropdown">
                          <div
                            v-for="mode in modeOptions"
                            :key="mode.name"
                            class="dropdown-item"
                            :class="{ active: currentNovelMode == mode?.name }"
                            @click.stop="switchNovelMode(mode.name, mode.name === 'normal' ? 1 : 2)"
                          >
                            <div class="item-img" v-if="mode.name == 'normal'">
                              <img :src="novelNormalIcon" alt="" />
                            </div>
                            <div class="item-img" v-else-if="mode.name == 'unlimited' || userRegion">
                              <img :src="novelUnlimitIcon" alt="" />
                            </div>
                            <span>{{ t(mode?.label || '') }}</span>
                          </div>
                        </div>
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
                            :class="{ active: selectedWordCount === count.value }"
                            @click.stop="selectWordCount(count.value)"
                          >
                            <span>{{ count.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Language Selector -->
                      <div class="novel-selector" @click="toggleLanguageDropdown" :class="{ open: showLanguageDropdown }">
                        <div class="selector-header">
                          <span>{{ selectedLanguage }}</span>
                          <img class="dropdown-arrow" src="@/assets/images/novel/arrow.png" alt="" />
                        </div>
                        <div class="dropdown" v-if="showLanguageDropdown">
                          <div
                            v-for="lang in languageOptions"
                            :key="lang.value"
                            class="dropdown-item"
                            :class="{ active: selectedLanguage == lang.value }"
                            @click.stop="selectLanguage(lang.value)"
                          >
                            <span>{{ lang.label }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="generate-btn" @click="navigateToNovelGenerate">
                      <img src="@/assets/images/home/send.png" alt="Send" />
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
        <div class="event-content">
          <img src="@/assets/images/home/banner.png" alt="" />
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
              @click="navigateToDetail(item.id, parseInt(item.type))"
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
                    <img :src="item.author?.avatar || ''" alt="" class="author-avatar" />
                    <span class="author-name">{{ item.author?.nickname }}</span>
                  </div>
                  <div class="author-info" v-else>
                    <img :src="item.author_info?.avatar || ''" alt="" class="author-avatar" />
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
            <Pagination
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

    <StyleSelectModal
      v-if="showStyleModal"
      :categories="styleCategories"
      :currentSelectedStyle="currentStyleName"
      @close="showStyleModal = false"
      @confirm="selectStyle"
    />

    <VideoSettingsModal
      :visible="showVideoSettingsModal"
      @close="closeVideoSettingsModal"
      @confirm="confirmVideoSettings"
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

    <!-- Footer -->
    <Footer
      :total-pages="Math.ceil(totalPosts / pageSize)"
      :current-page="currentPage"
      @page-change="handlePageChange"
    ></Footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from '@/util/toast';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/Header.vue';
import UnlimitedModeModal from '@/components/UnlimitedModeModal.vue';
import CharacterSelectModal from '@/components/CharacterSelectModal.vue';
import StyleSelectModal from '@/components/StyleSelectModal.vue';
import VideoSettingsModal from '@/components/VideoSettingsModal.vue';
import UploadMask from '@/components/UploadMask.vue';
import EmptyState from '@/components/EmptyState.vue';
import UserInfoModal from '@/components/UserInfoModal.vue';
import InviteCodeModal from '@/components/InviteCodeModal.vue';
import GuideModal from '@/components/GuideModal.vue';
import Pagination from '@/components/Pagination.vue';
import Footer from '@/components/Footer.vue';
import ProcessList from '@/components/ProcessList.vue';
import router from '@/router';
import api from '@/api/index';
import { aiUrl, baseUrl } from '@/util/config';
import normalIcon from '@/assets/images/home/normal.png';
import normalActiveIcon from '@/assets/images/home/normal_active.png';
import novelNormalIcon from '@/assets/images/novel/normal.png';
import novelUnlimitIcon from '@/assets/images/novel/unlimit.png';

import likeActive from '@/assets/images/detail/like_active.png';
import like from '@/assets/images/home/like.png';

const { t, locale } = useI18n();

// State
const currentNovelMode = ref('normal');
const activeContentTab = ref('suggested');
const searchQuery = ref('');
const sortOrder = ref('hot');
const loading = ref(false);
const activeContentType = ref(0);
const isSearchFocused = ref(false);

// Helper functions to get current state based on contentType
const getSelectedCharacters = () => contentType.value === 'video' ? selectedCharactersVideo : selectedCharactersComic;
const getUploadedImages = () => contentType.value === 'video' ? uploadedImagesVideo : uploadedImagesComic;
const getCombinedItems = () => contentType.value === 'video' ? combinedItemsVideo : combinedItemsComic;
const getIsInputEmpty = () => contentType.value === 'video' ? isInputEmptyVideo : isInputEmptyComic;
const getCurrentVideoMode = () => contentType.value === 'video' ? currentVideoMode : currentComicMode;
const getCurrentPlaceholder = () => contentType.value === 'video' ? t('home.input.placeholder') : t('home.input.placeholderComic');

// State for video tab
const selectedCharactersVideo = ref<any[]>([]);
const uploadedImagesVideo = ref<any[]>([]);
const combinedItemsVideo = ref<any[]>([]);
const isInputEmptyVideo = ref(true);

// State for comic tab
const selectedCharactersComic = ref<any[]>([]);
const uploadedImagesComic = ref<any[]>([]);
const combinedItemsComic = ref<any[]>([]);
const isInputEmptyComic = ref(true);
const inputContentVideo = ref('');
const inputContentComic = ref('');
const inputHtmlVideo = ref('');
const inputHtmlComic = ref('');

// Mode states - separate for video and comic
const currentVideoMode = ref('normal');
const currentComicMode = ref('normal');

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

const currentPlaceholder = computed(() => getCurrentPlaceholder());

// Content type
const contentType = ref('novel'); // video, comic, novel
const contentTypeOptions = ref([
  { value: 'novel', label: 'home.contentType.novel' },
  { value: 'comic', label: 'home.contentType.comic' },
  { value: 'video', label: 'home.contentType.video' }
]);

// Word count and language settings
const selectedWordCount = ref('100K');
const showWordCountDropdown = ref(false);
const wordCountOptions = ref([
  { value: '100K', label: '100K' },
  { value: '500K', label: '500K' },
  { value: '10M', label: '10M' }
]);

const selectedLanguage = ref(t('novel.language.en'));
const showLanguageDropdown = ref(false);
const languageOptions = [
  { value: 'zh', label: t('novel.language.zh') },
  { value: 'en', label: t('novel.language.en') },
  { value: 'jp', label: t('novel.language.jp') }
];

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

  try {
    const sessionId = uuidv4();

    const params = {
      ratio: "9:16",
      language: selectedLanguage.value == 'Chinese' ? 'cn' : selectedLanguage.value == 'English' ? 'en' : 'jp',
      story_type: "novel",
      story_mode: currentNovelMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: "",
      reference_images: [],
      emotion: "",
      others: {
        content: novelInput.value.trim()
      },
      addition_characters: [],
      total_words: selectedWordCount.value == '10M' ? '100' : selectedWordCount.value == '500K' ? '50' : '10',
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
        const novelSettings = {
          wordCount: selectedWordCount.value,
          language: selectedLanguage.value
        };
        localStorage.setItem('novelSettings', JSON.stringify(novelSettings));

        router.push(`/novel/${sessionId}`);
      } else {
        toast(data.message);
      }
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    toast(t('fail'));
  }
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
  { id: 3, label: 'video' }
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

// Modals
const showUnlimitedModal = ref(false);
const showCharacterModal = ref(false);
const showStyleModal = ref(false);
const showVideoSettingsModal = ref(false);
const showUserInfoModal = ref(false);
const showInviteCodeModal = ref(false);
const showGuideModal = ref(false);

const headerRef = ref<InstanceType<typeof Header> | null>(null);
const userInfo = ref<any>(null);

function handleUserInfoLoaded(info: any) {
  userInfo.value = info;
  // Update userRegion based on user info
  updateUnlimitedModeVisibility();
}

// Load selected style from localStorage on component mount
function loadSelectedStyle() {
  try {
    const savedStyleData = localStorage.getItem('selectedStyle');
    if (savedStyleData) {
      try {
        // 尝试解析为对象
        const styleData = JSON.parse(savedStyleData);
        // 根据当前语言显示对应的名称
        let displayName = styleData.name;
        if (locale.value === 'zh' && styleData.name_cn) {
          displayName = styleData.name_cn;
        } else if (locale.value === 'jp' && styleData.name_ja) {
          displayName = styleData.name_ja;
        }
        currentStyleName.value = displayName;
      } catch (e) {
        // 如果解析失败，可能是旧的字符串格式
        currentStyleName.value = savedStyleData;
      }
    } else if (styles.value.length > 0) {
        // 如果没有保存的风格，使用第一个风格
        const firstStyle = styles.value[0];
        if (firstStyle) {
          // 存储包含三种语言名称和图片的对象到 localStorage
          const styleData = {
            name: firstStyle.name, // 英文名称，用于接口调用
            name_cn: firstStyle.name_cn, // 中文名称
            name_ja: firstStyle.name_ja, // 日文名称
            image: firstStyle.image // 风格图片
          };
          localStorage.setItem('selectedStyle', JSON.stringify(styleData));

          // 根据当前语言显示对应的名称
          let displayName = firstStyle.name;
          if (locale.value === 'zh' && firstStyle.name_cn) {
            displayName = firstStyle.name_cn;
          } else if (locale.value === 'jp' && firstStyle.name_ja) {
            displayName = firstStyle.name_ja;
          }
          currentStyleName.value = displayName;
        }
      }
  } catch (error) {
    console.error('Error loading selected style:', error);
  }
}

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

  const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length;
  if (totalItems >= 7) {
    toast(t('home.error.maxItemsReached'));
    return false;
  }
  return true;
};

// Content Pagination
const currentPage = ref(1);
const limit = ref(50);

// Mock Data
const characters = ref([]);
const styles = ref<Array<{ id: string; name: string; name_cn?: string; name_ja?: string; image: string }>>([]);

const styleCategories = ref([
  { id: 'all', name: t('home.styleCategory.all') },
  { id: 'anime', name: t('home.styleCategory.anime') },
  { id: 'realistic', name: t('home.styleCategory.realistic') },
  { id: 'cartoon', name: t('home.styleCategory.cartoon') },
  { id: 'fantasy', name: t('home.styleCategory.fantasy') }
]);

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

const confirmUnlimitedMode = () => {
  if (contentType.value === 'video') {
    currentVideoMode.value = 'unlimited';
  } else if (contentType.value === 'comic') {
    currentComicMode.value = 'unlimited';
  } else if (contentType.value === 'novel') {
    currentNovelMode.value = 'unlimited';
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

const selectStyle = (style: any) => {
  if (style) {
    // 根据当前语言显示对应的名称
    let displayName = style.name;
    if (locale.value === 'zh' && style.name_cn) {
      displayName = style.name_cn;
    } else if (locale.value === 'jp' && style.name_ja) {
      displayName = style.name_ja;
    }
    currentStyleName.value = displayName;
  }
  showStyleModal.value = false;
};

// Content type selection
const selectContentType = (type: string) => {
  // If we just switched tabs, don't save or restore content
  if (justSwitchedTab.value) {
    contentType.value = type;
    // Ensure input is cleared
    nextTick(() => {
      if (editableInputRef.value) {
        editableInputRef.value.innerHTML = '';
        isInputEmpty.value = true;
      }
    });
    return;
  }

  // Save current content before switching
  if (editableInputRef.value) {
    if (contentType.value == 'video') {
      inputContentVideo.value = editableInputRef.value.textContent || '';
      inputHtmlVideo.value = editableInputRef.value.innerHTML;
    } else if (contentType.value == 'comic') {
      inputContentComic.value = editableInputRef.value.textContent || '';
      inputHtmlComic.value = editableInputRef.value.innerHTML;
    }
  }

  contentType.value = type;

  currentVideoMode.value = 'normal'
  currentComicMode.value = 'normal'
  currentNovelMode.value = 'normal'

  nextTick(() => {
    if (editableInputRef.value) {
      if (type === 'video') {
        editableInputRef.value.innerHTML = inputHtmlVideo.value;
        isInputEmpty.value = inputContentVideo.value.trim() === '';
      } else if (type === 'comic') {
        editableInputRef.value.innerHTML = inputHtmlComic.value;
        isInputEmpty.value = inputContentComic.value.trim() === '';
      } else {
        editableInputRef.value.textContent = '';
      }
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

const selectLanguage = (value: string) => {
  selectedLanguage.value = value;
  showLanguageDropdown.value = false;
};

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.novel-selector') && !target.closest('.video-selector')) {
    showWordCountDropdown.value = false;
    showLanguageDropdown.value = false;
    showModeDropdown.value = false;
    showVideoModeDropdown.value = false;
  }
};

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        const token = localStorage.getItem('token');
        if (token && userInfo.value && userInfo.value.info?.show_nsfw == '1') {
          userRegion.value = true;
        } else if (!token) {
          userRegion.value = true;
        } else {
          userRegion.value = false;
        }
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
        // Not in China, check user's show_nsfw setting
        if (userInfo.value && userInfo.value.info?.show_nsfw == '1') {
          userRegion.value = true;
        } else if (userInfo.value && userInfo.value.info?.show_nsfw == '0') {
          userRegion.value = false;
        } else {
          // User info not loaded yet or no show_nsfw field, default to true for non-CN
          userRegion.value = true;
        }
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
    let savedStyleData = null;
    let storyStyle = "";
    let currentStyleData = null;

    try {
      savedStyleData = localStorage.getItem('selectedStyle');
      if (!savedStyleData && styles.value.length > 0) {
        const firstStyle = styles.value[0];
        if (firstStyle) {
          const styleData = {
            name: firstStyle.name,
            name_cn: firstStyle.name_cn,
            name_ja: firstStyle.name_ja,
            image: firstStyle.image
          };
          savedStyleData = JSON.stringify(styleData);
          localStorage.setItem('selectedStyle', savedStyleData);

          let displayName = firstStyle.name;
          if (locale.value === 'zh' && firstStyle.name_cn) {
            displayName = firstStyle.name_cn;
          } else if (locale.value === 'jp' && firstStyle.name_ja) {
            displayName = firstStyle.name_ja;
          }
          currentStyleName.value = displayName;
          storyStyle = firstStyle.name;
          currentStyleData = styleData;
        }
      } else if (savedStyleData) {
        try {
          const styleData = JSON.parse(savedStyleData);
          storyStyle = styleData.name;

          let styleImage = styleData.image;
          if (!styleImage && styles.value && styles.value.length > 0) {
            const matchingStyle = styles.value.find(s =>
              s.name === styleData.name ||
              s.name_cn === styleData.name ||
              s.name_ja === styleData.name ||
              s.name === styleData.name_cn ||
              s.name === styleData.name_ja
            );
            if (matchingStyle && matchingStyle.image) {
              styleImage = matchingStyle.image;
            }
          }

          currentStyleData = {
            name: styleData.name,
            name_cn: styleData.name_cn || styleData.name,
            name_ja: styleData.name_ja || styleData.name,
            image: styleImage || ''
          };

          localStorage.setItem('selectedStyle', JSON.stringify(currentStyleData));

          let displayName = styleData.name;
          if (locale.value === 'zh' && styleData.name_cn) {
            displayName = styleData.name_cn;
          } else if (locale.value === 'jp' && styleData.name_ja) {
            displayName = styleData.name_ja;
          }
          currentStyleName.value = displayName;
        } catch (e) {
          console.log(e)
        }
      }
    } catch (error) {
      console.error('Error loading selected style:', error);
    }

    // Prepare data for ai_director
    const aiDirectorData = {
      storyType: currentVideoMode.value == 'unlimited' ? "nsfw_story" : "short_story",
      initialPrompt: inputContent.trim(),
      selectedStyle: storyStyle || null,
      selectedCharacter: null,
      referenceImages: uploadedImagesVideo.value.map(img => img.image),
      characters: selectedCharactersVideo.value,
      timestamp: Date.now()
    };

    const sessionId = uuidv4();

    let videoSettings = {
      language: locale.value == 'en' ? 'english' : locale.value == 'jp' ? 'japanese' : 'chinese',
      aspectRatio: "9:16"
    };

    try {
      const savedSettings = localStorage.getItem('videoSettings');
      if (savedSettings) {
        videoSettings = JSON.parse(savedSettings);
      } else {
        localStorage.setItem('videoSettings', JSON.stringify(videoSettings));
      }
    } catch (error) {
      console.error('Error loading video settings:', error);
    }

    // 生成角色和图片的索引映射
    const characterMap: Record<string, number> = {};
    const imageMap: Record<string, number> = {};

    // 角色索引基于角色列表的顺序
    selectedCharactersVideo.value.forEach((character, index) => {
      characterMap[character.id] = index + 1;
    });

    // 图片索引基于图片列表的顺序
    uploadedImagesVideo.value.forEach((image, index) => {
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
              const character = selectedCharactersVideo.value.find(c =>
                c.image === img.src || img.src.includes(c.image)
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
              const image = uploadedImagesVideo.value.find(img =>
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
      ratio: videoSettings.aspectRatio,
      language: videoSettings.language,
      story_type: "manju",
      story_mode: currentVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
      story_style: storyStyle,
      reference_images: uploadedImagesVideo.value.map(img => img.image),
      emotion: "",
      others: {
        content: processedContent,
        list: combinedItemsVideo.value,
        style: currentStyleData,
        use_computing: 0
      },
      addition_characters: selectedCharactersVideo.value.map(character => ({
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
      if (data.code === 200 || data.code === 0) {
        window.open(`/tools/space/${sessionId}`, '_blank');

        if (editableInputRef.value) {
          editableInputRef.value.textContent = '';
          isInputEmptyVideo.value = true;
          isInputEmpty.value = true;
          selectedCharactersVideo.value = [];
          uploadedImagesVideo.value = [];
          combinedItemsVideo.value = [];
          inputContentVideo.value = '';
          inputHtmlVideo.value = '';
        }
      } else {
        toast(data.message)
      }
    } else {
      toast(t('fail'));
    }
  } catch (error) {
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
    language: "",
    story_type: "manhua",
    story_mode: currentVideoMode.value == 'unlimited' ? 'nsfw' : 'normal',
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
    if (data.code === 200 || data.code === 0) {
      window.open(`/tools/space/${sessionId}`, '_blank');

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
  } else {
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

  // Clear selected characters and images for both video and comic modes
  selectedCharactersVideo.value = [];
  uploadedImagesVideo.value = [];
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
  selectedWordCount.value = '100K';
  selectedLanguage.value = 'English';
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

const handleFileChange = async (event: Event) => {
  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    // Check total count before uploading new images
    const totalItems = currentSelectedCharacters.value.length + currentUploadedImages.value.length + input.files.length;
    if (totalItems > 7) {
      toast(t('home.error.maxItemsReached'));
      input.value = '';
      return;
    }

    isUploading.value = true;

    try {
      const files = Array.from(input.files);
      const uploadPromises = files.map(async (file, index) => {
        try {
          const uploadedUrl = await uploadImage(file, currentVideoMode.value);

          const newImage = {
            id: Date.now() + index.toString(),
            name: file.name,
            image: uploadedUrl
          };

          currentUploadedImages.value.push(newImage);
          // Add to combined items array with type information
          currentCombinedItems.value.push({ ...newImage, type: 'image' });

          // Insert image tag into input-textarea
          if (editableInputRef.value) {
            const target = editableInputRef.value;
            const text = target.textContent || '';
            const isEmpty = text.trim() === '';

            // Create image tag
            const imageTag = document.createElement('span');
            imageTag.className = 'image-tag';
            imageTag.contentEditable = 'false'; // Make the image tag non-editable

            // Create image element
            const img = document.createElement('img');
            img.src = newImage.image;
            img.alt = newImage.name;
            img.className = 'image-tag-img';

            // Create text node with image index
            const imageIndex = currentUploadedImages.value.length;
            const textNode = document.createTextNode(`image${imageIndex}`);

            // Append image and text to tag
            imageTag.appendChild(img);
            imageTag.appendChild(textNode);

            // Insert image tag into input-textarea
            // Always append to the end to ensure existing .image-tag tags are not removed

            // Append image tag to the end
        target.appendChild(imageTag);

        // Focus the input to ensure cursor is visible
        target.focus();

        // Set cursor position after the image tag
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStartAfter(imageTag);
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

  const parma = {
    method: "POST",
    headers: {
      token: token,
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

// Remove uploaded image
const removeUploadedImage = (id: string) => {
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  // First, remove references from input-textarea
  if (editableInputRef.value) {
    const imageTags = editableInputRef.value.querySelectorAll('.image-tag');
    imageTags.forEach(tag => {
      const img = tag.querySelector('img');
      if (img) {
        // Find the image being removed
        const imageToRemove = currentUploadedImages.value.find(img => img.id === id);
        if (imageToRemove && (img.src.includes(imageToRemove.image) || imageToRemove.image.includes(img.src))) {
          // If this tag corresponds to the image being removed, remove it
          // Check if there's a space after the tag and remove it too
          const nextSibling = tag.nextSibling;
          if (nextSibling && nextSibling.nodeType === 3 && nextSibling.textContent?.trim() === '') {
            nextSibling.remove();
          }
          tag.remove();
        }
      }
    });

    // Update input empty state
    const inputContent = editableInputRef.value.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

  // Then remove from uploadedImages array
  currentUploadedImages.value = currentUploadedImages.value.filter(img => img.id !== id);
  // Also remove from combinedItems array
  currentCombinedItems.value = currentCombinedItems.value.filter(item => !(item.type === 'image' && item.id === id));

  // Update image order in input-textarea
  // Note: Using nextTick to ensure DOM is updated before modifying it
  nextTick(() => {
    if (editableInputRef.value) {
      try {
        const imageTags = editableInputRef.value.querySelectorAll('.image-tag');
        imageTags.forEach(tag => {
          const img = tag.querySelector('img');
          if (img) {
            // Find the corresponding image in currentUploadedImages
            const image = currentUploadedImages.value.find(imgItem =>
              imgItem.image === img.src || img.src.includes(imgItem.image)
            );
            if (image) {
              // Update the image index
              const imageIndex = currentUploadedImages.value.findIndex(imgItem => imgItem.id === image.id) + 1;
              // Update the text content
              const textNode = Array.from(tag.childNodes).find(node => node.nodeType === 3) as Text;
              if (textNode) {
                textNode.textContent = `image${imageIndex}`;
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
  const text = target.textContent || '';
  isInputEmpty.value = text.trim() === '';

  const cursorPosition = getCursorPosition(target);
  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  const currentSelectedCharacters = getSelectedCharacters();
  const currentUploadedImages = getUploadedImages();
  const currentCombinedItems = getCombinedItems();

  // Only show dropdown if:
  // 1. There's an @ symbol
  // 2. @ is the last character before cursor (just typed)
  // 3. There are uploaded images or selected characters
  if (atIndex !== -1 &&
      atIndex === textBeforeCursor.length - 1 &&
      (currentUploadedImages.value.length > 0 || currentSelectedCharacters.value.length > 0)) {
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

        // Check if cursor is right after a character or image tag
        let previousSibling: Node | null = range.startContainer;
        if (range.startOffset > 0) {
          // If cursor is in the middle of a text node, check the previous node
          if (previousSibling && previousSibling.nodeType === 3) { // Text node
            const textBeforeCursor = previousSibling.textContent?.substring(0, range.startOffset) || '';
            if (textBeforeCursor.trim() === '') {
              // If only whitespace before cursor, check previous element
              previousSibling = previousSibling.previousSibling;
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
    // 3. There are uploaded images or selected characters
    if (atIndex !== -1 &&
        atIndex === textBeforeCursor.length - 1 &&
        (currentUploadedImages.value.length > 0 || currentSelectedCharacters.value.length > 0)) {
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
  let img: HTMLImageElement;
  let textNode: Text;

  if (item.type === 'character') {
    // Create character tag
    itemTag = document.createElement('span');
    itemTag.className = 'character-tag-input';
    itemTag.contentEditable = 'false'; // Make the character tag non-editable
    itemTag.dataset.itemId = item.id; // Add item ID for easier removal

    // Create image element
    img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'character-tag-img';

    // Create text node with character name
    textNode = document.createTextNode(item.name);
  } else {
    // Create image tag
    itemTag = document.createElement('span');
    itemTag.className = 'image-tag';
    itemTag.contentEditable = 'false'; // Make the image tag non-editable
    itemTag.dataset.itemId = item.id; // Add item ID for easier removal

    // Create image element
    img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';

    const currentUploadedImages = getUploadedImages();
    // Create text node with image index
    const imageIndex = currentUploadedImages.value.findIndex(img => img.id === item.id) + 1;
    textNode = document.createTextNode(`image${imageIndex}`);
  }

  // Append image and text to tag
  itemTag.appendChild(img);
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
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    position = preCaretRange.toString().length;
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
    } else {
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
  if (loading.value) return;

  const currentActiveTab = activeContentTab.value;
  loading.value = true;
  try {
    let res;

    switch (currentActiveTab) {
      case 'suggested':
        res = await api.homePostList(page, pageSize.value, '', activeContentType.value) as any;
        break;
      case 'following':
        res = await api.homeFollowList(page, pageSize.value, activeContentType.value) as any;
        break;
      case 'subscriptions':
        res = await api.homeSubscriptionList(page, pageSize.value, activeContentType.value) as any;
        break;
      default:
        res = await api.homePostList(page, pageSize.value, '', activeContentType.value) as any;
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
      totalPosts.value = Number(res.data?.allnums) || 0;

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

const navigateToDetail = (id: string, type: number) => {
  // if (type == 2) {
  //   router.push({ path: '/novel-detail', query: { id: id , type: type } });
  // } else {
    router.push({ path: '/detail', query: { id: id , type: type } });
  // }
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
    if (postIndex === -1) return;

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

// Watch for language changes and update style display accordingly
watch(() => locale.value, (newLang) => {
  loadSelectedStyle();
});

const loadStyles = async () => {
  if (!isLoggedIn.value) {
    return;
  }

  try {
    const response = await api.getStoryStyles();
    if (response && response.data) {
      styles.value = response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        name_cn: item.name_cn,
        name_ja: item.name_ja, // 改为 name_ja
        image: item.image
      }));

      // Initialize currentStyleName if not set
      if (!currentStyleName.value) {
        let savedStyleData = localStorage.getItem('selectedStyle');
        if (!savedStyleData && styles.value.length > 0) {
          const firstStyle = styles.value[0];
          if (firstStyle) {
            // 存储包含三种语言名称和图片的对象到 localStorage
            const styleData = {
              name: firstStyle.name, // 英文名称，用于接口调用
              name_cn: firstStyle.name_cn, // 中文名称
              name_ja: firstStyle.name_ja, // 日文名称
              image: firstStyle.image // 风格图片
            };
            savedStyleData = JSON.stringify(styleData);
            localStorage.setItem('selectedStyle', savedStyleData);

            // 根据当前语言显示对应的名称
            let displayName = firstStyle.name;
            if (locale.value === 'zh' && firstStyle.name_cn) {
              displayName = firstStyle.name_cn;
            } else if (locale.value === 'jp' && firstStyle.name_ja) {
              displayName = firstStyle.name_ja;
            }
            currentStyleName.value = displayName;
          }
        } else if (savedStyleData) {
          try {
            // 尝试解析为对象
            const styleData = JSON.parse(savedStyleData);
            // 根据当前语言显示对应的名称
            let displayName = styleData.name;
            if (locale.value === 'zh' && styleData.name_cn) {
              displayName = styleData.name_cn;
            } else if (locale.value === 'jp' && styleData.name_jp) {
              displayName = styleData.name_jp;
            }
            currentStyleName.value = displayName;
          } catch (e) {
            // 如果解析失败，可能是旧的字符串格式
            currentStyleName.value = savedStyleData;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading styles:', error);
  }
};

onMounted(() => {
  getCountry();
  loadSelectedStyle();

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

  // Load novel settings from local storage
  try {
    const storedNovelSettings = localStorage.getItem('novelSettings');
    if (storedNovelSettings) {
      const novelSettings = JSON.parse(storedNovelSettings);
      if (novelSettings.wordCount) {
        selectedWordCount.value = novelSettings.wordCount;
      }
      if (novelSettings.language) {
        selectedLanguage.value = novelSettings.language;
      }
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
  loadStyles();

  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClickOutside);

  checkFirstRegister();
});

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

  if (homePageRef.value) {
    homePageRef.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<style lang="scss" scoped>
  @use '@/scss/Home.scss';
</style>