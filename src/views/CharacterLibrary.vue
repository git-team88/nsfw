<template>
  <div class="character-library">
    <Header :cur="2"></Header>

    <div class="container">
      <!-- Page Title -->
      <h2 class="page-title">{{ t('characterLibrary.title') }}</h2>
      <p class="page-sub">{{ t('characterLibrary.sub') }}</p>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <span
          class="tab"
          :class="{ active: activeTab == 'my' }"
          @click="activeTab = 'my'"
        >
          {{ t('home.characterSelect.myCharacters') }}
        </span>
      </div>

      <!-- Process List -->
      <div class="process-section">
        <ProcessList />
      </div>

      <!-- Loading State -->
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ t('characterLibrary.loading') }}</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-message">{{ error }}</div>
      </div>

      <!-- Character Grid -->
      <div v-else-if="filteredCharacters.length > 0" class="character-grid">
        <!-- Character Cards -->
        <div
          v-for="(character, index) in currentPageCharacters"
          :key="character.id"
          class="character-card"
          :style="{ animationDelay: `${Math.min((index + 1) * 45, 400)}ms` }"
          @click="openCharacterDetail(character)"
        >
          <!-- Power标识 -->
          <div v-if="activeTab === 'official' && character.useCostPoints" class="character-power">
            <img class="power-icon" src="@/assets/images/project/coin.png" alt="" />
            <span class="power-value">{{ character.useCostPoints }}</span>
          </div>
          <div class="character-img-wrap">
            <img class="character-img" :src="processImageUrl(character.image)" :alt="character.name" />
            <span class="halftone" aria-hidden="true"></span>
            <span class="char-sheen" aria-hidden="true"></span>
          </div>
          <span class="character-name">{{ character.name }}</span>
        </div>
      </div>

      <EmptyState
        v-else
        :title="t('characterLibrary.emptyState.title')"
        :description="t('characterLibrary.emptyState.description')"
        @action="goToCreatePage"
      />

      <div class="pagination-container" v-if="!isLoading && !error && totalCount > 0 && totalPages > 1">
        <Pagination
          :total="totalCount"
          :page-size="itemsPerPage"
          v-model:model-value="currentPage"
          theme="pink"
        />
      </div>
    </div>

    <CharacterDetailModal
      :visible="showDetailModal"
      :character="selectedCharacter"
      @close="closeCharacterDetail"
      @cast="handleCastCharacter"
    />
  </div>
</template>

<script setup lang="ts" name="CharacterLibrary">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import CharacterDetailModal from '@/components/CharacterDetailModal.vue';
import Pagination from '@/components/Pagination.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProcessList from '@/components/ProcessList.vue';
import addIcon from '@/assets/images/project/add.png';
import addHoverIcon from '@/assets/images/project/add_hover.png';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { processImageUrl } from '@/util/utils';

const { t, locale } = useI18n();
const router = useRouter();

// State
const characters = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 20;
const totalCount = ref(0);
const showDetailModal = ref(false);
const selectedCharacter = ref<any>(null);
const isHovering = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref('my');

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

// Computed
const filteredCharacters = computed(() => {
  return characters.value;
});

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage);
});

const currentPageCharacters = computed(() => {
  return characters.value;
});

// Methods
function goToCreatePage() {
  // Navigate to create new character page
  router.push('/create-character');
}

function openCharacterDetail(character: any) {
  selectedCharacter.value = character;
  showDetailModal.value = true;
}

function closeCharacterDetail() {
  showDetailModal.value = false;
  selectedCharacter.value = null;
}

function handleCastCharacter(character: any) {
  // Store character in local storage
  try {
    // Get existing characters from local storage
    let selectedCharacters = JSON.parse(localStorage.getItem('selectedCharacters') || '[]');

    // Check if character is already selected
    const isCharacterExists = selectedCharacters.some((c: any) => c.id === character.id);
    if (!isCharacterExists) {
      // Add new character to the list
      selectedCharacters.push(character);
      // Save back to local storage
      localStorage.setItem('selectedCharacters', JSON.stringify(selectedCharacters));
    }
  } catch (error) {
    console.error('Error storing character:', error);
  }

  // Close the modal
  closeCharacterDetail();

  // Navigate to home page
  router.push('/');
}

async function loadCharacters() {
  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab and page at the time of the request
  const currentTab = activeTab.value;
  const currentPageValue = currentPage.value;

  isLoading.value = true;
  error.value = null;
  try {
    // Use type 2 for official characters, 1 for user characters
    const type = activeTab.value == 'official' ? 2 : 1;
    const response = await api.getCharacters(type, currentPage.value, itemsPerPage) as any;

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      isLoading.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab or page has changed while the request was in flight
    if (currentTab !== activeTab.value || currentPageValue !== currentPage.value) {
      isLoading.value = false;
      return; // Skip processing this response as the tab or page has changed
    }

    if (response.code == 200 && response.data) {
      if (response.data.data_list) {
        characters.value = response.data.data_list.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.main_image_url,
          tri_image: item.tri_view_url,
          description: item.desc,
          useCostPoints: item.use_cost_points,
          isOfficial: activeTab.value === 'official'
        }));
        // Capture total count from API response
        totalCount.value = response.data.data_count || 0;
      } else {
        toast(t('fail'));
        characters.value = [];
        totalCount.value = 0;
      }
    } else {
      toast(locale.value == 'jp' ?  response.msg_jp : response.msg)
      characters.value = [];
      totalCount.value = 0;
    }
  } catch (err) {
    toast(t('fail'));
    characters.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

// Watchers
watch(activeTab, () => {
  currentPage.value = 1;
  loadCharacters();
});

watch(currentPage, () => {
  loadCharacters();
});

function setSeoMeta() {
  document.title = t('seo.characterLibrary.title');
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.characterLibrary.keywords'));
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.characterLibrary.description'));
}

// Lifecycle
onMounted(() => {
  window.scrollTo(0, 0);

  setSeoMeta();

  loadCharacters();
});

watch(() => locale.value, () => {
  setSeoMeta();
});
</script>

<style lang="scss" scoped>
$ink: #161122;
$paper: #FFFDF7;
$cream: #FFFBF4;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;
$line: #e7e1d8;
$yellow: #FFD23F;

$role-accents: #FFC24B, #C9B6FF, #7FD8E8, #FF9EC4, #A3E635, #FFD23F;

.character-library {
  width: 100%;
  min-height: 100vh;
  background: $cream;
}

.container {
  max-width: 1160px;
  margin: 0 auto 2rem;
  padding: 100px 20px;

  @media (min-width: 768px) {
    padding: 100px 24px;
  }
}

.page-title {
  font-weight: 800;
  font-size: 26px;
  color: $ink;
  margin-bottom: 0.6rem;
  letter-spacing: 0.02em;
}

.page-sub {
  font-size: 13px;
  color: $muted;
  font-weight: 600;
  margin-bottom: 1.8rem;
}

.count-badge {
  font-weight: 800;
  font-size: 1.3rem;
  border: 2px solid $ink;
  border-radius: 999px;
  padding: 0.4rem 1.4rem;
  background: #fff;
  box-shadow: 2px 2px 0 $ink;
  margin-left: auto;
}

.tab-navigation {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 2.4rem;

  .tab {
    font-weight: 800;
    font-size: 1.3rem;
    padding: 0.8rem 1.6rem;
    border-radius: 999px;
    border: 2px solid $ink;
    cursor: pointer;
    transition: all 0.16s;
    background: #fff;
    color: $ink;

    &.active {
      background: $ink;
      color: #fff;
    }

    &:hover:not(.active) {
      background: $paper;
    }
  }
}

/* Process Section */
.process-section {
  margin-bottom: 1rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.6rem;
}

.create-new-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 22rem;
  border-radius: 1.6rem;
  border: 3px dashed rgba(22,17,34,0.3);
  background: rgba(255,255,255,0.5);
  padding: 3rem 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);

  &:hover {
    transform: translateY(-4px);
    border-style: solid;
    border-color: $ink;
    background: #fff;
    box-shadow: 6px 6px 0 $ink;

    .create-new-icon {
      transform: rotate(12deg);
      border-style: solid;
      border-color: $ink;
      background: $pink;
      color: #fff;
    }
  }

  .create-new-icon {
    width: 5.6rem;
    height: 5.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 3px dashed rgba(22,17,34,0.4);
    background: transparent;
    color: $ink;
    transition: all 0.42s cubic-bezier(0.34,1.56,0.64,1);
    animation: charBreathe 4.4s ease-in-out infinite;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &:hover .create-new-icon {
    animation-play-state: paused;
  }

  .create-new-text {
    font-weight: 800;
    font-size: 1.4rem;
    color: $ink;
    margin-top: 1.2rem;
  }
}

.character-card {
  position: relative;
  background: #fff;
  border: 3px solid $ink;
  border-radius: 16px;
  box-shadow: 4px 4px 0 $ink;
  cursor: pointer;
  overflow: visible;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 6px 6px 0 $ink;

    .char-sheen {
      transform: translateX(140%);
    }

    .character-power {
      transform: translateY(-2px) rotate(-3deg);
    }
  }

  .character-img-wrap {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
    border-radius: 16px 16px 0 0;

    .character-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }

    .char-sheen {
      position: absolute;
      inset: 0;
      pointer-events: none;
      transform: translateX(-140%) rotate(6deg);
      transition: transform 900ms cubic-bezier(0.16,1,0.3,1);
      background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.55) 50%, transparent 58%);
    }

    .halftone {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.16;
      mix-blend-mode: overlay;
      background-image: radial-gradient($ink 1px, transparent 1.4px);
      background-size: 9px 9px;
    }
  }

  .character-name {
    display: block;
    padding: 8px 14px 12px;
    font-weight: 800;
    font-size: 15px;
    color: $ink;
    line-height: 1.4;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .character-power {
    position: absolute;
    top: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: $yellow;
    border: 2px solid $ink;
    color: $ink;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 11px;
    z-index: 1;
    box-shadow: 2px 2px 0 $ink;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);

    .power-icon {
      width: 12px;
      height: 12px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2.4rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40rem;

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid $line;
    border-top: 0.4rem solid $ink;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
  }

  .loading-text {
    font-size: 1.4rem;
    color: $muted;
    font-weight: 600;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40rem;
  text-align: center;
  grid-column: 1 / -1;
}

.error-message {
  font-size: 1.4rem;
  color: #E5484D;
  font-weight: 800;
  margin-bottom: 1.6rem;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
  color: #fff;
  background: linear-gradient(135deg, $pink, #FF7A45);
  border: none;
  border-radius: 1.4rem;
  padding: 1rem 2.4rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 $ink;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 $ink;
  }
}

@keyframes charCardIn {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes charBreathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,77,141,0); }
  50% { box-shadow: 0 0 0 7px rgba(255,77,141,0.14); }
}

/* Responsive */
@media (max-width: 720px) {
  .container {
    padding: 100px 16px;
  }

  .character-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
  }

  .tab-navigation .tab {
    font-size: 1.2rem;
    padding: 0.6rem 1.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .character-card {
    animation: none !important;
  }
  .character-card:hover {
    transform: none;
    box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
  }
  .create-new-card:hover {
    transform: none;
  }
  .create-new-icon {
    animation: none !important;
  }
}
</style>