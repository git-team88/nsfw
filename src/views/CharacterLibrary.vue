<template>
  <div class="character-library">
    <Header :cur="2"></Header>

    <div class="container">
      <!-- Page Title -->
      <h2 class="page-title">{{ t('characterLibrary.title') }}</h2>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <span
          class="tab"
          :class="{ active: activeTab === 'official' }"
          @click="activeTab = 'official'"
        >
          {{ t('home.characterSelect.officialCharacters') }}
        </span>
        <span
          class="tab"
          :class="{ active: activeTab === 'my' }"
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
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ t('characterLibrary.loading') }}</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-message">{{ error }}</div>
        <!-- <button class="retry-button" @click="loadCharacters">{{ t('characterLibrary.retry') }}</button> -->
      </div>

      <!-- Character Grid -->
      <div v-else-if="filteredCharacters.length > 0" class="character-grid">
        <!-- Create New Button -->
        <!-- <div class="create-new-card" @click="goToCreatePage" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
          <div class="create-new-icon">
            <img :src="isHovering ? addHoverIcon : addIcon" alt="Create New" />
          </div>
          <div class="create-new-text">{{ t('characterLibrary.createNew') }}</div>
        </div> -->

        <!-- Character Cards -->
        <div
          v-for="(character, index) in currentPageCharacters"
          :key="character.id"
          class="character-card"
          @click="openCharacterDetail(character)"
        >
          <!-- Power标识 -->
          <div v-if="activeTab === 'official' && character.useCostPoints" class="character-power">
            <img class="power-icon" src="@/assets/images/project/coin.png" alt="" />
            <span class="power-value">{{ character.useCostPoints }}</span>
          </div>
          <img class="character-img" :src="character.image" :alt="character.name" />
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
const activeTab = ref('official');

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
  isLoading.value = true;
  error.value = null;
  try {
    // Use type 2 for official characters, 1 for user characters
    const type = activeTab.value === 'official' ? 2 : 1;
    const response = await api.getCharacters(type, currentPage.value, itemsPerPage) as any;
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

// Lifecycle
onMounted(() => {
  loadCharacters();
});
</script>

<style lang="scss" scoped>
.character-library {
  width: 100%;
  min-height: 100vh;
  padding: 14rem 0 0;
  background: #FFFFFF;
}

.container {
  max-width: 108rem;
  margin: 0 auto 2rem;
}

.page-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
  margin-bottom: 2.4rem;
}

.tab-navigation {
  display: flex;
  gap: 3rem;
  margin-bottom: 2.4rem;
  border-bottom: 1px solid #F5F5F5;

  .tab {
    flex: 0 0 auto;
    padding: 0 0 1.8rem;
    font-size: 1.6rem;
    color: #6A7282;
    cursor: pointer;
    position: relative;
    margin-right: 1.2rem;

    &:hover{
      color: #101828;
    }

    &.active {
      color: #101828;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #fb64b6;
        border-radius: 1px;
      }
    }
  }
}

/* Process Section */
.process-section {
  margin-bottom: 3.2rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2.2rem;
}

.create-new-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20rem;
  height: 26.7rem;
  border-radius:0.8rem;
  background: linear-gradient( 90deg, rgba(194, 122, 255, 0.08) 0%, rgba(255, 127, 250, 0.08) 50%, rgba(251, 100, 243, 0.08) 100%);
  cursor: pointer;

  .create-new-icon {
    width: 8rem;
    height: 8rem;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .create-new-text {
    font-weight: 500;
    font-size: 1.4rem;
    text-transform: none;
    background: linear-gradient(90deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.character-card {
  position: relative;
  width: 20rem;
  height: 26.7rem;
  border-radius: 0.8rem;
  box-shadow: 0px 0px 6px 0px rgba(0,0,0,0.12);
  cursor: pointer;

  .character-img {
    width: 100%;
    height: 100%;
    border-radius: 0.8rem;
    aspect-ratio: 3/4;
    object-fit: cover;
  }

  .character-name {
    position: absolute;
    left: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 4.4rem;
    font-size: 1.4rem;
    border-radius: 0 0 0.8rem 0.8rem;
    color: #101828;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: rgba(255,255,255,0.9);
  }

  .character-power {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.9);
    color: #99A1AF;
    padding: 0.4rem;
    border-radius: 0.4rem;
    font-size: 1.2rem;
    z-index: 1;

    .power-icon {
      width: 1.2rem;
      height: 1.2rem;
      margin-right: 0.4rem;
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
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 0.4rem solid #F5F5F5;
  border-top: 0.4rem solid #6A7282;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.6rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.6rem;
  color: #6A7282;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40rem;
  text-align: center;
}

.error-message {
  font-size: 1.4rem;
  color: #ff4d4f;
  margin-bottom: 1.6rem;
}

.retry-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24rem;
  height: 4.8rem;
  padding: 0.8rem 2.4rem;
  font-size: 1.4rem;
  color: #fff;
  background: #fb64b6;
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}
</style>