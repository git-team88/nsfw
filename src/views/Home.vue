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
            <!-- Mode Switch -->
            <div class="mode-switch">
              <div
                class="mode-btn"
                :class="{ active: currentMode === 'normal' }"
                @click="switchMode('normal', 1)"
              >
                <div class="mode-img">
                  <img :src="currentMode == 'normal' ? normalActiveIcon : normalIcon" alt="" />
                </div>
                <span>{{ t('home.mode.normal') }}</span>
              </div>

              <div
                class="mode-btn"
                :class="{ active: currentMode === 'unlimited' }"
                @click="switchMode('unlimited', 2)"
                v-if="userRegion"
              >
                <div class="mode-img">
                  <img :src="currentMode == 'unlimited' ? activeIcon : icon" alt="" />
                </div>
                <span>{{ t('home.mode.unlimited') }}</span>
              </div>

              <!-- <div
                v-for="(mode, index) in modeOptions"
                :key="mode.id"
                class="mode-btn"
                :class="{ active: currentMode === mode.id }"
                @click="switchMode(mode.id)"
              >
                <div class="mode-img" v-if="index == 1">
                  <img :src="currentMode === mode.id ? activeIcon : icon" alt="" />
                </div>
                <div class="mode-img" v-else>
                  <img :src="currentMode === mode.id ? normalActiveIcon : normalIcon" alt="" />
                </div>
                <span>{{ t(mode.label) }}</span>
              </div> -->
            </div>

            <!-- Text Input -->
            <div class="input-area" :class="currentMode == 'unlimited' ? 'unlimit' : ''">
              <div class="input-inner">
                <!-- Selected Characters List -->
                <div class="selected-characters" v-if="selectedCharacters.length > 0">
                  <div
                    v-for="character in selectedCharacters"
                    :key="character.id"
                    class="character-tag"
                  >
                    <img :src="character.image" :alt="character.name" class="character-avatar" />
                    <span class="character-name">{{ character.name }}</span>
                    <img class="remove-btn" src="@/assets/images/home/delete.png" alt="Remove" @click="removeCharacter(character)" />
                  </div>
                </div>

                <!-- Uploaded Images List -->
                <div class="uploaded-images" v-if="uploadedImages.length > 0">
                  <div
                    v-for="(image, index) in uploadedImages"
                    :key="image.id"
                    class="uploaded-image-item"
                  >
                    <span class="image-index">{{ index + 1 }}</span>
                    <img :src="image.image" :alt="image.name" class="uploaded-image" />
                    <img class="remove-btn" src="@/assets/images/home/remove.png" alt="Remove" @click="removeUploadedImage(image.id)" />
                  </div>
                </div>

                <div
                  ref="editableInputRef"
                  class="input-textarea"
                  contenteditable="true"
                  @input="handleInput"
                  @keydown="handleKeydown"
                  @click="handleInputClick"
                  @blur="handleInputBlur"
                  @paste="handlePaste"
                  @focus="handleInputFocus"
                >
                  <span v-if="isInputEmpty && !isInputFocused" class="placeholder">{{ t('home.input.placeholder') }}</span>
                </div>

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
                    @click="selectAtItem(item)"
                  >
                    <img :src="item.image" :alt="item.name" />
                    <span>{{ t('home.img') }}{{ index+1 }}</span>
                  </div>
                </div>

                <div class="input-box">
                  <div class="input-options">
                    <div class="option-btn character-btn" @click="() => { if (checkLogin()) showCharacterModal = true }">
                      <img src="@/assets/images/home/role_icon.png" alt="" />
                      <span>{{ t('home.option.character') }}</span>
                    </div>
                    <div class="option-btn reference-btn" @click="() => { if (checkLogin()) triggerFileUpload() }">
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

                  <div class="generate-btn" :class="currentMode == 'unlimited' ? 'unlimit' : ''" @click="generateVideo">
                    <b></b>
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

        <!-- <div class="filter-container">
          <div class="content-type-filter">
            <span
              v-for="type in contentTypes"
              :key="type.id"
              class="type-btn"
              :class="{ active: activeContentType === type.id }"
              @click="activeContentType = type.id"
            >
              {{ t('home.contentType.' + type.label) }}
            </span>
          </div>

          <div class="sort-filter">
            <span
              v-for="option in sortOptions"
              :key="option.id"
              class="filter-btn"
              :class="{ active: sortOrder === option.id }"
              @click="sortOrder = option.id"
            >
              {{ t(option.label) }}
            </span>
          </div>
        </div> -->

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
                <!-- Video Play Icon -->
                <div v-if="item.type == '3'" class="play-icon">
                  <img src="@/assets/images/detail/play.png" alt="" />
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
                  <div class="content-stats" @click.stop="toggleLike(item)">
                    <img :src="item.is_liked == 1 ? likeActive : like" alt="" />
                    <span>{{ item.like_count || 0 }}</span>
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
import Pagination from '@/components/Pagination.vue';
import Footer from '@/components/Footer.vue';
import router from '@/router';
import api from '@/api/index';
import { aiUrl, baseUrl } from '@/util/config';
import normalIcon from '@/assets/images/home/normal.png';
import normalActiveIcon from '@/assets/images/home/normal_active.png';

import icon from '@/assets/images/home/select.png';
import activeIcon from '@/assets/images/home/select_active.png';

import likeActive from '@/assets/images/detail/like_active.png';
import like from '@/assets/images/detail/like.png';

const { t, locale } = useI18n();

// State
const currentMode = ref('normal');
const activeContentTab = ref('suggested');
const searchQuery = ref('');
const sortOrder = ref('hot');
const loading = ref(false);
const activeContentType = ref('0');
const isSearchFocused = ref(false);
const selectedCharacters = ref<any[]>([]);
const showAtDropdown = ref(false);
const atDropdownItems = ref<any[]>([]);
const editableInputRef = ref<HTMLElement | null>(null);
const isInputEmpty = ref(true);
const isInputFocused = ref(false);
const uploadedImages = ref<any[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);



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
  { id: '0', label: 'all' },
  { id: '1', label: 'video' },
  { id: '2', label: 'image' },
  { id: '3', label: 'article' }
]);

// Sort Options
const sortOptions = ref([
  { id: 'hot', label: 'home.filter.trending' },
  { id: 'new', label: 'home.filter.latest' }
]);

// Mode Options
const modeOptions = ref([
  { id: 'normal', label: 'home.mode.normal' },
  { id: 'unlimited', label: 'home.mode.unlimited' }
]);

const userRegion = ref(false);

// Modals
const showUnlimitedModal = ref(false);
const showCharacterModal = ref(false);
const showReferenceModal = ref(false);
const showScriptModal = ref(false);
const showStyleModal = ref(false);
const showSettingsModal = ref(false);
const showVideoSettingsModal = ref(false);
const showUserInfoModal = ref(false);

const headerRef = ref<InstanceType<typeof Header> | null>(null);
const userInfo = ref<any>(null);

function handleUserInfoLoaded(info: any) {
  userInfo.value = info;
  // Update userRegion based on user info
  updateUnlimitedModeVisibility();
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

// Content Pagination
const currentPage = ref(1);
const limit = ref(50);

// Mock Data
const characters = ref([]);
const styles = ref<Array<{
  id: string;
  name: string;
  name_cn?: string;
  name_jp?: string;
  image: string;
}>>([]);

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
const switchMode = (mode: string, index: number) => {
  if (index == 2) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }
  }

  if (mode === 'unlimited' && currentMode.value !== 'unlimited') {
    const hasConfirmed = localStorage.getItem('unlimitedModeConfirmed') === 'true';
    if (hasConfirmed) {
      currentMode.value = 'unlimited';
    } else {
      showUnlimitedModal.value = true;
    }
  } else if (mode === 'normal') {
    currentMode.value = 'normal';
  }
};

const confirmUnlimitedMode = () => {
  currentMode.value = 'unlimited';
  showUnlimitedModal.value = false;
};

const selectCharacter = (characters: any[]) => {
  // Append new characters instead of replacing
  characters.forEach(newChar => {
    // Only add if not already in the list
    if (!selectedCharacters.value.some(c => c.id === newChar.id)) {
      selectedCharacters.value.push(newChar);
    }
  });

  // Do not save to local storage - only characters from CharacterLibrary should be cached

  showCharacterModal.value = false;
};

const removeCharacter = (character: any) => {
  selectedCharacters.value = selectedCharacters.value.filter(c => c.id !== character.id);

  // Do not update local storage - only characters from CharacterLibrary should be cached
};

const selectStyle = (style: any) => {
  if (style) {
    const styleName = style.name;
    localStorage.setItem('selectedStyle', styleName);
    currentStyleName.value = styleName;
  }
  showStyleModal.value = false;
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
    // Prepare data for ai_director
    const aiDirectorData = {
      storyType: currentMode.value == 'unlimited' ? "nsfw_story" : "short_story",
      initialPrompt: inputContent.trim(),
      selectedStyle: null as string | null,
      selectedCharacter: null,
      referenceImages: uploadedImages.value.map(img => img.image),
      characters: selectedCharacters.value,
      timestamp: Date.now()
    };

    try {
      let savedStyle = localStorage.getItem('selectedStyle');
      if (!savedStyle && styles.value.length > 0) {
        const firstStyle = styles.value[0];
        if (firstStyle && firstStyle.name) {
          savedStyle = firstStyle.name ? firstStyle.name : 'Ghibli Style';
          localStorage.setItem('selectedStyle', savedStyle);
        }
      } else {
        localStorage.setItem('selectedStyle', 'Ghibli Style');
      }
      if (savedStyle) {
        aiDirectorData.selectedStyle = savedStyle;
      }
    } catch (error) {
      console.error('Error loading selected style:', error);
    }

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
      localStorage.setItem('videoSettings', JSON.stringify(videoSettings));
    }

    let storyStyle = "";
    try {
      let savedStyle = localStorage.getItem('selectedStyle');
      if (!savedStyle && styles.value.length > 0) {
        const firstStyle = styles.value[0];
        if (firstStyle) {
          let localeStyleName: string | undefined;
          localeStyleName = firstStyle.name;

          if (localeStyleName) {
            savedStyle = localeStyleName;
            localStorage.setItem('selectedStyle', savedStyle);
          }
        }
      }
      if (savedStyle) {
        storyStyle = savedStyle;
      }
    } catch (error) {
      console.error('Error loading selected style:', error);
    }

    const params = {
      ratio: videoSettings.aspectRatio,
      language: videoSettings.language,
      story_type: currentMode.value == 'unlimited' ? "nsfw_story" : "short_story",
      story_style: storyStyle,
      reference_images: uploadedImages.value.map(img => img.image),
      others: {},
      addition_role: selectedCharacters.value.map(character => ({
        role_id: character.id,
        role_name: character.name,
        role_image: character.image
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
        const contentToSave = inputContent.trim() + `<MARKED>${videoSettings.language},${videoSettings.aspectRatio},${storyStyle ? storyStyle : 'Ghibli Style'},情绪跳过不选择</MARKED>`;

        localStorage.setItem('generatedContent', contentToSave);

        window.open(`/tools/space/${sessionId}`, '_blank');

        // Clear input content after successful generation
        if (editableInputRef.value) {
          editableInputRef.value.textContent = '';
          isInputEmpty.value = true;
        }
      } else {
        toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
      }
    } else {
      toast(t('fail'));
    }
  } catch (error) {
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

  activeContentTab.value = tabId;
  tabCur.value = index;
  currentPage.value = 1;
  allContent.value = []; // Clear old data to show loading state
  contentCardRefs.value = []; // Clear card refs to reset layout

  // Use nextTick to ensure DOM is updated before loading new content
  nextTick(() => {
    loadContent(1);
  });
};

// Trigger file upload dialog
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    isUploading.value = true;

    try {
      const files = Array.from(input.files);
      const uploadPromises = files.map(async (file, index) => {
        try {
          const uploadedUrl = await uploadImage(file, currentMode.value);

          uploadedImages.value.push({
            id: Date.now() + index.toString(),
            name: file.name,
            image: uploadedUrl
          });
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
  // First, remove references from input-textarea
  if (editableInputRef.value) {
    const imageTags = editableInputRef.value.querySelectorAll('.image-tag');
    imageTags.forEach(tag => {
      const img = tag.querySelector('img');
      if (img) {
        // Find the image being removed
        const imageToRemove = uploadedImages.value.find(img => img.id === id);
        if (imageToRemove && (img.src.includes(imageToRemove.image) || imageToRemove.image.includes(img.src))) {
          // If this tag corresponds to the image being removed, remove it
          tag.remove();
        }
      }
    });

    // Update input empty state
    const inputContent = editableInputRef.value.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

  // Then remove from uploadedImages array
  uploadedImages.value = uploadedImages.value.filter(img => img.id !== id);
};

// Handle input for @ dropdown
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement;
  const text = target.textContent || '';
  isInputEmpty.value = text.trim() === '';

  const cursorPosition = getCursorPosition(target);
  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  // Only show dropdown if:
  // 1. There's an @ symbol
  // 2. @ is the last character before cursor (just typed)
  // 3. There are uploaded images
  if (atIndex !== -1 &&
      atIndex === textBeforeCursor.length - 1 &&
      uploadedImages.value.length > 0) {
    showAtDropdown.value = true;
    atDropdownItems.value = uploadedImages.value;

    // Calculate dropdown position based on cursor position
    try {
      if (editableInputRef.value) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          // Create a new range that spans from the @ symbol to the cursor
          const atRange = document.createRange();
          const textNode = range.startContainer;
          if (textNode.nodeType === Node.TEXT_NODE) {
            atRange.setStart(textNode, atIndex);
            atRange.setEnd(textNode, cursorPosition);

            const rect = atRange.getBoundingClientRect();
            const inputInner = editableInputRef.value.parentElement;
            const dropdown = document.querySelector('.at-dropdown') as HTMLElement;

            if (inputInner && dropdown) {
                const inputInnerRect = inputInner.getBoundingClientRect();
                // Calculate position relative to input-inner
                const relativeTop = rect.bottom - inputInnerRect.top;
                const relativeLeft = rect.right - inputInnerRect.left;

                dropdown.style.top = `${relativeTop + 5}px`; // Add small margin
                dropdown.style.left = `${relativeLeft}px`; // Position after the @ symbol
              }
          }
        }
      }
    } catch (error) {
      console.error('Error positioning dropdown:', error);
    }
  } else {
    showAtDropdown.value = false;
  }
};

// Handle keydown events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showAtDropdown.value = false;
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

    // Only show dropdown if:
    // 1. There's an @ symbol
    // 2. @ is the last character before cursor (just typed)
    // 3. There are uploaded images
    if (atIndex !== -1 &&
        atIndex === textBeforeCursor.length - 1 &&
        uploadedImages.value.length > 0) {
      showAtDropdown.value = true;
      atDropdownItems.value = uploadedImages.value;

      // Calculate dropdown position based on @ symbol position
      try {
        // Find the @ symbol position in the text
        let currentPosition = 0;
        let foundAtSymbol = false;
        let targetNode: Text | null = null;
        let atSymbolIndex = 0;

        // Traverse all text nodes to find the @ symbol
        const traverseNodes = (node: Node) => {
          if (foundAtSymbol) return;

          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            const nodeAtIndex = text.indexOf('@', Math.max(0, atIndex - currentPosition));

            if (nodeAtIndex !== -1 && currentPosition + nodeAtIndex === atIndex) {
              targetNode = node as Text;
              atSymbolIndex = nodeAtIndex;
              foundAtSymbol = true;
              return;
            }
            currentPosition += text.length;
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              traverseNodes(node.childNodes[i]);
              if (foundAtSymbol) return;
            }
          }
        };

        traverseNodes(editableInputRef.value);

        if (foundAtSymbol && targetNode) {
          // Create a range for the @ symbol
          const range = document.createRange();
          range.setStart(targetNode, atSymbolIndex);
          range.setEnd(targetNode, atSymbolIndex + 1);

          const rect = range.getBoundingClientRect();
          const inputInner = editableInputRef.value.parentElement;
          const dropdown = document.querySelector('.at-dropdown') as HTMLElement;

          if (inputInner && dropdown) {
            const inputInnerRect = inputInner.getBoundingClientRect();
            // Calculate position relative to input-inner
            const relativeTop = rect.bottom - inputInnerRect.top;
            const relativeLeft = rect.right - inputInnerRect.left;

            dropdown.style.top = `${relativeTop + 5}px`; // Add small margin
            dropdown.style.left = `${relativeLeft}px`; // Position after the @ symbol
          }
        }
      } catch (error) {
        console.error('Error positioning dropdown:', error);
      }
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
  }, 200);
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
  if (!editableInputRef.value) return;

  const target = editableInputRef.value;
  const text = target.textContent || '';
  const cursorPosition = getCursorPosition(target);
  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf('@');

  if (atIndex !== -1) {
    // Get the content before and after the @ symbol
    const contentBeforeAt = text.substring(0, atIndex);
    const contentAfterCursor = text.substring(cursorPosition);

    // Create image tag
    const imageTag = document.createElement('span');
    imageTag.className = 'image-tag';
    imageTag.contentEditable = 'false'; // Make the image tag non-editable

    // Create image element
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.className = 'image-tag-img';

    // Create text node with image index
    const imageIndex = uploadedImages.value.findIndex(img => img.id === item.id) + 1;
    const textNode = document.createTextNode(`image${imageIndex}`);

    // Append image and text to tag
    imageTag.appendChild(img);
    imageTag.appendChild(textNode);

    // Clear the content
    target.innerHTML = '';

    // Create text nodes for the content before and after
    const beforeNode = document.createTextNode(contentBeforeAt);
    const afterNode = document.createTextNode('\u0020' + contentAfterCursor);

    // Append everything to the target
    target.appendChild(beforeNode);
    target.appendChild(imageTag);

    // Add a space after the image tag to ensure content doesn't go inside it
    const spaceNode = document.createTextNode('\u0020');
    target.appendChild(spaceNode);

    // Add the content after cursor
    target.appendChild(afterNode);

    // Set cursor position after the space node (before afterNode if it exists)
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      if (afterNode.textContent && afterNode.textContent.trim()) {
        // If there's content after, set cursor before it
        range.setStartBefore(afterNode);
      } else {
        // If no content after, set cursor after the space
        range.setStartAfter(spaceNode);
      }
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Update input empty state after inserting image tag
    const inputContent = target.textContent || '';
    isInputEmpty.value = inputContent.trim() === '';
  }

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
        res = await api.homePostList(page, pageSize.value, '', 0) as any;
        break;
      case 'following':
        res = await api.homeFollowList(page, pageSize.value, 0) as any;
        break;
      case 'subscriptions':
        res = await api.homeSubscriptionList(page, pageSize.value, 0) as any;
        break;
      default:
        res = await api.homePostList(page, pageSize.value, '', 0) as any;
    }

    if (res.code === 0 || res.code === 200) {
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

const navigateToDetail = (id: string) => {
  router.push({ path: '/detail', query: { id: id , type: (tabCur.value + 1) } });
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
        name_jp: item.name_jp,
        image: item.image
      }));

      // Initialize currentStyleName if not set
      if (!currentStyleName.value) {
        let savedStyle = localStorage.getItem('selectedStyle');
        if (!savedStyle && styles.value.length > 0) {
          const firstStyle = styles.value[0];
          if (firstStyle && firstStyle.name) {
            savedStyle = firstStyle.name;
            localStorage.setItem('selectedStyle', savedStyle);
          }
        }
        if (savedStyle) {
          currentStyleName.value = savedStyle;
        }
      }
    }
  } catch (error) {
    console.error('Error loading styles:', error);
  }
};

onMounted(() => {
  getCountry();

  // Load selected characters from local storage (only for characters cast from CharacterLibrary)
  try {
    const storedCharacters = localStorage.getItem('selectedCharacters');
    if (storedCharacters) {
      selectedCharacters.value = JSON.parse(storedCharacters);
      // Clear the cache after loading to ensure characters are only displayed once
      localStorage.removeItem('selectedCharacters');
    }
  } catch (error) {
    console.error('Error loading selected characters:', error);
  }

  loadContent(1);
  loadStyles();

  window.addEventListener('resize', handleResize);

  checkFirstRegister();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
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
  const isFirstRegister = localStorage.getItem('isFirstRegister');
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
}

function handleUserInfoCancel() {
  showUserInfoModal.value = false;
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadContent(page);

  if (homePageRef.value) {
    homePageRef.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<style scoped lang="scss">
.home-page {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-image: url('@/assets/images/home/bg.png');
  scroll-behavior: smooth;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.main-content {
  position: relative;
  width: 108rem;
  margin: 0 auto;
  padding: 14rem 0 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Hero Section */
.hero-section {
  position: relative;

  .hero-content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .hero-title {
      width: 100%;
      font-size: 3.6rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 3rem;
      font-style: italic;
      background: linear-gradient(90deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Mode Switch */
    .mode-switch {
      display: flex;
      gap: 0.8rem;
      padding: 0 1.2rem;

      .mode-btn {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem 1.2rem;
        border-radius: 0.6rem 0.6rem 0 0;
        cursor: pointer;

        .mode-img{
          display: flex;
          align-items: center;
          justify-content: center;
          width: 0.8rem;
          height: 0.8rem;

          img {
            width: 0.8rem;
            height: 0.8rem;
          }
        }

        span {
          font-size: 1.4rem;
        }

        &:first-child{
          border: 1px solid rgba(251,100,182,0.2);
          border-bottom: none;
          background: rgba(251,100,182,0.03);

          span{
            color: rgba(251,100,182,0.6);
          }

          &.active {
            background: rgba(251,100,182,0.12);
            border: 1px solid #FB64B6;
            border-bottom: none;
            color: #FB64B6;

            span{
              color: #FB64B6;
            }
          }
        }

        &:nth-of-type(2){
          background: linear-gradient( 135deg, rgba(194, 122, 255, 0.1) 0%, rgba(255, 127, 250, 0.1) 50%, rgba(251, 100, 243, 0.1) 100%), #FFFFFF;

          &:before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: inherit;
            background: linear-gradient(360deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1));
            padding: 1px 1px 0;
            -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
            mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            z-index: 1;
          }

          span{
            background: linear-gradient(45deg, rgba(194, 122, 255, 0.6), rgba(255, 127, 250, 0.6), rgba(251, 100, 243, 0.6));
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }

          &.active {
            background: linear-gradient( 135deg, rgba(194, 122, 255, 0.2) 0%, rgba(255, 127, 250, 0.2) 50%, rgba(251, 100, 243, 0.2) 100%), #FFFFFF;

            &:before {
              background: linear-gradient(360deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1));
            }

            span{
              background: linear-gradient(45deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1));
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              color: transparent;
            }
          }

        }
      }
    }

    /* Input Area */
    .input-area {
      position: relative;
      width: 108rem;
      padding: 1.6rem;
      background: rgba(255,255,255,0.8);
      box-shadow: 0px 0px 15px -3px rgba(251,100,182,0.2);
      border: 2px solid #FB64B6;
      border-radius: 1.2rem;

      &.unlimit{
        border: none;
        &::before{
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          background: linear-gradient(360deg, rgba(194, 122, 255, 1), rgba(255, 127, 250, 1), rgba(251, 100, 243, 1));
          padding: 2px;
          -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
          mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          z-index: 1;
        }
      }

      .input-inner{
        position: relative;
        z-index: 10;
      }

      .selected-characters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;

        .character-tag {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.4rem 0.8rem 0.4rem 0.4rem;
          background: #F5F5F5;
          border-radius: 0.4rem;
          font-size: 1.4rem;

          .character-avatar {
            width: 2.1rem;
            height: 2.8rem;
            border-radius: 0.2rem;
            overflow: hidden;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .character-name {
            color: #6A7282;
          }

          .remove-btn {
            width: 1.2rem;
            height: 1.2rem;
            cursor: pointer;
          }
        }
      }

      .uploaded-images {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        margin-bottom: 1.2rem;

        .uploaded-image-item {
          position: relative;
          display: flex;
          align-items: center;

          .image-index {
            position: absolute;
            top: .2rem;
            left: .2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 1.2rem;
            height: 1.2rem;
            font-size: 0.8rem;
            border-radius: 0.2rem;
            background: rgba(245, 245, 245, 0.8);
            color: #364153;
            z-index: 5;
          }

          .uploaded-image {
            width: 4.4rem;
            height: 4.4rem;
            object-fit: cover;
            border-radius: 0.4rem;
          }

          .remove-btn {
            position: absolute;
            top: .2rem;
            right: .2rem;
            width: 1.2rem;
            height: 1.2rem;
            cursor: pointer;
          }
        }
      }

      .input-textarea {
        position: relative;
        width: 100%;
        min-height: 9rem;
        max-height: 24rem;
        font-family: inherit;
        font-size: 1.4rem;
        line-height: 2rem;
        resize: none;
        outline: none;

        .placeholder {
          color: #99A1AF;
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          padding: 0;
          margin: 0;
          line-height: 2rem;
        }

        :deep(.image-tag) {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.2rem;
          background: rgba(251,100,182,0.12);
          border-radius: 0.2rem;
          font-size: 1.2rem;
          color: #6A7282;
          margin: 0 0.6rem;
          pointer-events: none;
          user-select: none;
          cursor: default;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          position: relative;
          z-index: 1;

          .image-tag-img {
            width: 2rem;
            height: 2rem;
            border-radius: 0.2rem;
            object-fit: cover;
            pointer-events: none;
            user-select: none;
          }
        }
      }

      .at-dropdown {
        position: absolute;
        width: 11rem;
        padding: 1.2rem;
        border: 1px solid rgba(251,100,182,0.2);
        border-radius: 0.8rem;
        background: rgba(255,255,255,0.9);
        box-shadow: 0px 0px 12px -4px rgba(0,0,0,0.18);
        z-index: 100;
        max-height: 20rem;
        overflow-y: auto;

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 1.2rem;
          cursor: pointer;

          &:last-child{
            margin-bottom: 0;
          }

          &:hover{
            span{
              color: #6A7282;
            }
          }

          img {
            width: 2rem;
            height: 2rem;
            border-radius: 0.2rem;
            object-fit: cover;
          }

          span {
            font-size: 1.4rem;
            color: #99A1AF;
          }
        }
      }

      .input-box{
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1.6rem;
        border-top: 1px solid rgba(251,100,182,0.1);
      }

      .input-options {
        display: flex;
        align-items: center;

        .option-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 1.2rem;
          border-radius: 0.84rem;
          cursor: pointer;

          img {
            width: 2rem;
            height: 2rem;
          }

          span {
            font-size: 1.4rem;
            color: #99A1AF;
          }

          &:hover {
            background: #F5F5F5;
          }
        }
      }

      .generate-btn {
        display: flex;
        width: 4.4rem;
        height: 4.4rem;
        cursor: pointer;

        b {
          width: 4.4rem;
          height: 4.4rem;
          background: url('@/assets/images/detail/send.png') no-repeat;
          background-size: cover;
          cursor: pointer;
          transform: all 0.3s ease-in;

          &:hover {
            background: url('@/assets/images/detail/send_hover.png') no-repeat;
            background-size: cover;
          }
        }

        &.unlimit{
          b {
            background: url('@/assets/images/home/send.png') no-repeat;
            background-size: cover;
          }

          &:hover {
            opacity: 0.7;
          }
        }
      }
    }
  }
}

/* Event Banner */
.event-banner {
  margin-top: 4rem;
  .event-content {
    display: flex;
    align-items: center;

    img {
      width: 100%;
    }
  }
}

/* Content Section */
.content-section {
  margin-top: 4rem;

  /* Content Header */
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.4rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid rgba(251,100,182,0.2);

    /* Content Tabs */
    .content-tabs {
      display: flex;
      align-items: center;
      height: 4.8rem;
      gap: 3rem;

      .tab-btn {
        display: flex;
        align-items: center;
        height: 100%;
        font-size: 1.6rem;
        color: #6a7282;
        cursor: pointer;
        position: relative;

        &.active {
          color: #101828;
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            bottom: -1.2rem;
            left: 0;
            right: 0;
            height: 0.2rem;
            background: #fb64b6;
          }
        }

        &:hover:not(.active) {
          color: #6a7282;
        }
      }
    }

    /* Search */
    .search-box {
      position: relative;
      width: 32rem;
      height: 4.8rem;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(251, 100, 182, 0.2);
      border-radius: 0.8rem;
      transition: all 0.3s ease;

      &:has(.search-input:focus) {
        border-color: #fb64b6;
      }

      .search-input {
        flex: 1;
        height: 100%;
        padding: 1rem 1.2rem;
        font-size: 1.4rem;
        outline: none;
        background: transparent;

        &::placeholder {
          color: #99a1af;
        }
      }

      .search-icon {
        width: 3.6rem;
        height: 3.6rem;
        cursor: pointer;
      }
    }
  }

  .filter-container{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Content Type Filter */
  .content-type-filter {
    display: flex;
    gap: 1.2rem;
    margin-bottom: 2rem;

    .type-btn {
       display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      border: 1px solid transparent;
      color: #6a7282;
      cursor: pointer;

      &:hover{
        border-color: rgba(251,100,182,0.2);
      }

      &.active {
        border-color: #FB64B6;
        background: rgba(251, 100, 182, 0.12);
        color: #fb64b6;
      }
    }
  }

  /* Sort Filter */
  .sort-filter {
    display: flex;
    gap: 1.2rem;
    margin-bottom: 3rem;

    .filter-btn {
      display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border: 1px solid #F5F5F5;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      background: #F5F5F5;
      color: #4A5565;
      cursor: pointer;

      &.active {
        background: #FFFFFF;
        border-color: rgba(251,100,182,0.2);
      }

      &:hover:not(.active) {
        border-color: rgba(251,100,182,0.2);
      }
    }
  }

  /* Content Grid */
  .content-grid {
    flex: 1; /* 自动填充剩余空间 */
    min-height: calc(100vh - 60rem); /* 确保填充到页脚之前: 全屏 - header - hero - footer */
    position: relative;
    display: flex;
    flex-direction: column;

    .waterfall {
      display: flex;
      flex-wrap: wrap;
      gap: 1.6rem;
      width: 100%;
      margin: 0 auto;
    }

    .content-item {
      width: 25.8rem;
      height: auto;
      cursor: pointer;
      overflow: hidden;
      break-inside: avoid;

      .content-image {
        width: 100%;
        height: 34.4rem;
        border-radius: 0.8rem;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          border-radius: 0.8rem;
          object-fit: cover;
        }

        /* Play Icon */
        .play-icon {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translateX(-50%) translateY(-42%);
          z-index: 1;

          img {
            width: 9rem;
            height: 9rem;
            object-fit: contain;
          }
        }
      }

      .content-info {
        padding: 1.2rem 0 0;

        .content-desc {
          font-size: 1.4rem;
          color: #101828;
          line-height: 2rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-all;
        }

        .content-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.2rem;

          .author-info {
            display: flex;
            align-items: center;
            gap: 0.6rem;

            .author-avatar {
              width: 3rem;
              height: 3rem;
              border-radius: 0.4rem;
              object-fit: cover;
            }

            .author-name {
              font-size: 1.2rem;
              color: #6A7282;
            }
          }

          .content-stats {
            display: flex;
            align-items: center;
            gap: 0.6rem;

            span {
              font-size: 1.2rem;
              color: #6a7282;
            }

            img{
              width: 1.8rem;
              height: 1.8rem;
            }
          }
        }
      }
    }
  }
}

.loading-more,
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;

  img {
    width: 2rem;
    height: 2rem;
    animation: spin 1s linear infinite;
  }

  span {
    font-size: 1.4rem;
    color: #6a7282;
  }

  &.load-more {
    cursor: pointer;

    &:hover {
      color: #fb64b6;

      span {
        color: #fb64b6;
      }
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40rem;
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 0.4rem solid rgba(251, 100, 182, 0.2);
  border-top: 0.4rem solid #fb64b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.6rem;
}

.loading-text {
  font-size: 1.6rem;
  color: #666;
}

.pagination-wrapper {
  margin-top: 3rem;
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>