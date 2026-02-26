<template>
  <div class="character-library">
    <Header :cur="2"></Header>

    <div class="container">
      <!-- Page Title -->
      <h2 class="page-title">{{ t('characterLibrary.title') }}</h2>

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
      <div v-else-if="characters.length > 0" class="character-grid">
        <!-- Create New Button -->
        <!-- <div class="create-new-card" @click="goToCreatePage" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
          <div class="create-new-icon">
            <img :src="isHovering ? addHoverIcon : addIcon" alt="Create New" />
          </div>
          <div class="create-new-text">{{ t('characterLibrary.createNew') }}</div>
        </div> -->

        <!-- Character Cards -->
        <div
          v-for="character in currentPageCharacters"
          :key="character.id"
          class="character-card"
          @click="openCharacterDetail(character)"
        >
          <img :src="character.image" :alt="character.name" />
          <span class="character-name">{{ character.name }}</span>
        </div>
      </div>

      <EmptyState
        v-else
        :title="t('characterLibrary.emptyState.title')"
        :description="t('characterLibrary.emptyState.description')"
        @action="goToCreatePage"
      />

      <div class="pagination-container" v-if="!isLoading && !error && totalPages > 1">
        <Pagination
          :total="characters.length"
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
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import CharacterDetailModal from '@/components/CharacterDetailModal.vue';
import Pagination from '@/components/Pagination.vue';
import EmptyState from '@/components/EmptyState.vue';
import addIcon from '@/assets/images/project/add.png';
import addHoverIcon from '@/assets/images/project/add_hover.png';
import api from '@/api/index';

const { t, locale } = useI18n();
const router = useRouter();

// State
const characters = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 20;
const showDetailModal = ref(false);
const selectedCharacter = ref<any>(null);
const isHovering = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed
const totalPages = computed(() => {
  return Math.ceil(characters.value.length / itemsPerPage);
});

const currentPageCharacters = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return characters.value.slice(startIndex, endIndex);
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
    const response = await api.getCharacters();
    if (response && response.data) {
      characters.value = response.data.map((item: any) => ({
        id: item.id || item.character_id,
        name: item.name || item.character_name,
        image: item.image || item.character_image,
        description: item.description || item.character_description,
        designSheet: item.design_sheet || item.character_design_sheet
      }));
    }
  } catch (err) {
    console.error('Failed to load characters:', err);
    error.value = t('characterLibrary.error.loadFailed');
    characters.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadCharacters();
});
</script>

<style lang="scss" scoped>
.character-library {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}

.container {
  max-width: 112.8rem;
  min-height: calc(100vh - 14rem);
  margin: 0 auto 2rem;
  padding: 2.4rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);
}

.page-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
  margin-bottom: 2.4rem;
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
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  cursor: pointer;

  img {
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
    backdrop-filter: blur(2px);
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
  border: 0.4rem solid rgba(251, 100, 182, 0.2);
  border-top: 0.4rem solid #fb64b6;
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
  color: #666;
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