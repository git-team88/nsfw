<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt="Close"
        @click="handleClose"
      />

      <h3 class="modal-title">{{ t('home.characterSelect.title') }}</h3>

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

      <div class="modal-body" ref="characterGridRef">
        <div class="character-list" v-if="filteredCharacters.length > 0">
          <div
            v-for="character in filteredCharacters"
            :key="character.id"
            class="character-item"
            :class="{ selected: selectedCharacters.some(c => c.id === character.id) }"
            @click="toggleCharacterSelection(character)"
          >
            <div class="character-avatar">
              <img :src="character.image" :alt="character.name" />
            </div>
            <div class="character-info">
              <div class="character-name-box">
                <span class="character-name">{{ character.name }}</span>
                <span class="character-cost" v-if="activeTab === 'official' && character.useCostPoints">
                  {{ character.useCostPoints }} {{ t('aiRecharge.credits') }}
                </span>
              </div>
              <div class="character-description" v-if="character.description">{{ character.description }}</div>
            </div>

          </div>
        </div>

        <div class="loading-more" v-if="loading">
          <img src="@/assets/images/base/load.png" alt="Loading" />
          <span>{{ t('home.loading') }}</span>
        </div>

        <div class="loading-more" v-if="loadingMore">
          <img src="@/assets/images/base/load.png" alt="Loading" />
          <span>{{ t('home.loading') }}</span>
        </div>

        <div class="no-characters" v-if="!loading && !loadingMore && filteredCharacters.length === 0">
          <span>{{ t('home.characterSelect.noCharacters') }}</span>
        </div>

        <!-- <div class="add-character" @click="addNewCharacter" v-if="!loading && !loadingMore">
          <b></b>
          <span>{{ t('home.characterSelect.new') }}</span>
        </div> -->
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="modal-btn confirm" @click="handleConfirm">
          {{ t('home.styleSelect.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from '@/util/toast';
import { aiUrl } from '@/util/config';

const { t } = useI18n();
const router = useRouter();

const emit = defineEmits<{
  close: [];
  confirm: [characters: Array<{
    id: string;
    name: string;
    image: string;
    description: string;
    isOfficial: boolean;
    useCostPoints?: number;
    tri_image?: string;
  }>];
  delete: [id: string];
  loadMore: [];
}>();

const selectedCharacters = ref<Array<{
  id: string;
  name: string;
  image: string;
  description: string;
  isOfficial: boolean;
  useCostPoints?: number;
  tri_image?: string;
}>>([]);
const loading = ref(false);
const loadingMore = ref(false);
const characterGridRef = ref<HTMLElement | null>(null);
const activeTab = ref('official');
const currentPage = ref(1);
const hasMore = ref(true);

// Filtered characters based on active tab
const filteredCharacters = ref<Array<{
  id: string;
  name: string;
  image: string;
  description: string;
  isOfficial: boolean;
  useCostPoints?: number;
  tri_image?: string;
}>>([]);

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
  }
});

const toggleCharacterSelection = (character: {
  id: string;
  name: string;
  image: string;
  description: string;
  isOfficial: boolean;
  useCostPoints?: number;
  tri_image?: string;
}) => {
  const index = selectedCharacters.value.findIndex(c => c.id === character.id);
  if (index === -1) {
    if (selectedCharacters.value.length >= 7) {
      toast(t('home.characterSelect.limit'));
      return;
    }
    selectedCharacters.value.push(character);
  } else {
    selectedCharacters.value.splice(index, 1);
  }
};



const handleClose = () => {
  selectedCharacters.value = [];
  emit('close');
};

const handleConfirm = () => {
  emit('confirm', selectedCharacters.value);
  handleClose();
};

const loadCharacters = async (isLoadMore = false) => {
  if (loading.value || loadingMore.value) return;

  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    currentPage.value = 1;
    filteredCharacters.value = [];
    hasMore.value = true;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      loading.value = false;
      loadingMore.value = false;
      return;
    }

    // Use type 2 for official characters, 1 for user characters
    const type = activeTab.value === 'official' ? 2 : 1;
    const response = await fetch(`${aiUrl}app/config/characters?type=${type}&page=${isLoadMore ? currentPage.value + 1 : 1}&limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });

    if (response.ok) {
      const data = await response.json();
      let newCharacters = data.data?.data_list || [];

      // Map the response data to the expected format
      newCharacters = newCharacters.map((character: { id: number; name: string; main_image_url: string; desc: string; use_cost_points: number; tri_view_url: string }) => ({
        id: character.id.toString(),
        name: character.name,
        image: character.main_image_url,
        description: character.desc,
        useCostPoints: character.use_cost_points,
        tri_image: character.tri_view_url,
        isOfficial: activeTab.value === 'official'
      }));

      if (isLoadMore) {
        filteredCharacters.value = [...filteredCharacters.value, ...newCharacters];
      } else {
        filteredCharacters.value = newCharacters;
      }

      // Check if there are more characters to load
      hasMore.value = newCharacters.length === 20;
      currentPage.value = isLoadMore ? currentPage.value + 1 : 1;
    }
  } catch (error) {
    console.error('Failed to load characters:', error);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// Watch for tab changes
watch(activeTab, () => {
  loadCharacters(false);
});

const handleScroll = () => {
  if (!characterGridRef.value) return;

  const { scrollTop, clientHeight, scrollHeight } = characterGridRef.value;
  const threshold = 100;

  if (scrollHeight - scrollTop - clientHeight < threshold && !loading.value && !loadingMore.value && hasMore.value) {
    loadCharacters(true);
  }
};

onMounted(() => {
  loadCharacters();
  if (characterGridRef.value) {
    characterGridRef.value.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  if (characterGridRef.value) {
    characterGridRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 500;
}

.modal-content {
  background: #ffffff;
  border-radius: 1.2rem;
  width: 48rem;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-close {
  position: absolute;
  right: 1.2rem;
  top: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-title {
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
  margin: 0;
  padding: 1.8rem 2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}

.tab-navigation {
  display: flex;
  gap: 1.2rem;
  margin: 1.6rem 2.4rem;

  .tab {
    display: flex;
    align-items: center;
    height: 3.2rem;
    text-align: center;
    padding: 0 1.6rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(251,100,182,0.2);
    font-size: 1.4rem;
    color: #6a7282;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;

    &.active {
      border: 1px solid #FB64B6;
      background: rgba(251,100,182,0.12);
      color: #fb64b6;
    }
  }
}

.modal-body {
  max-height: 42rem;
  padding: 0 2.4rem 2rem;
  overflow-y: auto;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}

.character-item {
  display: flex;
  cursor: pointer;
  border: 2px solid #F5F5F5;
  border-radius: 0.8rem;
  padding: 1.2rem;
  background: #F5F5F5;

  &.selected {
    border-color: #fb64b6;
  }
}

.character-avatar {
  position: relative;
  width: 7.4rem;
  height: 9.8rem;
  border-radius: 0.8rem;
  overflow: hidden;
  margin-right: 1.6rem;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.character-info {
  flex: 1;
  min-width: 0;

  .character-name-box{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .character-name {
    font-weight: bold;
    font-size: 1.6rem;
    color: #0A0A0A;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .character-cost {
    font-size: 1.2rem;
    color: #fb64b6;
    white-space: nowrap;
  }

  .character-description {
    font-size: 1.2rem;
    color: #364153;
    line-height: 1.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2.4rem;
  padding: 1.8rem 2.4rem ;
  border-top: 1px solid rgba(251, 100, 182, 0.2);

  .modal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;

    &.cancel {
      border: 1px solid #fb64b6;
      background: none;
      color: #fb64b6;

      &:hover {
        background: rgba(251, 100, 182, 0.06);
      }
    }

    &.confirm {
      background: #fb64b6;
      color: #ffffff;

      &:hover:not(:disabled) {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
        }
      }

      &:disabled {
        background: #f8d7e8;
        color: white;
        cursor: not-allowed;
      }
    }
  }
}

.no-characters{
  text-align: center;
  font-size: 1.4rem;
  color: #6a7282;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 0;

  img {
    width: 2rem;
    height: 2rem;
    animation: spin 1s linear infinite;
  }

  span {
    font-size: 1.4rem;
    color: #6a7282;
  }
}

.add-character {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: linear-gradient( 90deg, rgba(194, 122, 255, 0.08) 0%, rgba(255, 127, 250, 0.08) 50%, rgba(251, 100, 243, 0.08) 100%);
  cursor: pointer;
  transition: all 0.2s ease-in;

  &:hover{
    b {
      background: url('@/assets/images/project/add_hover.png') no-repeat;
      background-size: 100% 100%;
    }
  }

  b {
    width: 8rem;
    height: 8rem;
    background: url('@/assets/images/project/add.png') no-repeat;
    background-size: 100% 100%;
  }

  span {
    font-weight: 500;
    font-size: 1.4rem;
    text-transform: none;
    background: linear-gradient(90deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
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