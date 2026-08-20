<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ t('home.characterSelect.title') }}</h3>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
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
              <img :src="processImageUrl(character.image)" :alt="character.name" />
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
import { processImageUrl } from '@/util/utils';
import { aiUrl } from '@/util/config';

const { t } = useI18n();
const router = useRouter();

const props = defineProps<{
  characters: Array<{
    id: string;
    name: string;
    image: string;
    description: string;
    isOfficial: boolean;
    useCostPoints?: number;
    tri_image?: string;
  }>;
  selectedCharacters: Array<{
    id: string;
    name: string;
    image: string;
    description: string;
    isOfficial: boolean;
    useCostPoints?: number;
    tri_image?: string;
  }>;
}>();

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

// Don't sync selectedCharacters from parent - we don't want to show already selected characters

const loading = ref(false);
const loadingMore = ref(false);
const characterGridRef = ref<HTMLElement | null>(null);
const activeTab = ref('my');
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
    selectedCharacters.value = [character];
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
        'Platform': 'web',
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
  background: rgba(22, 17, 34, 0.4);
  z-index: 500;
}

.modal-content {
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  width: 480px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #161122;
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);
}

.tab-navigation {
  display: flex;
  gap: 12px;
  margin: 16px 24px;

  .tab {
    display: flex;
    align-items: center;
    height: 32px;
    text-align: center;
    padding: 0 16px;
    border: 2px solid #161122;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 800;
    background: #fff;
    color: #161122;
    cursor: pointer;
    position: relative;
    box-shadow: 2px 2px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      color: #FF4D8D;
    }

    &.active {
      background: #FF4D8D;
      color: #fff;

      &:hover {
        color: #fff;
      }
    }
  }
}

.modal-body {
  max-height: 420px;
  padding: 0 24px 20px;
  overflow-y: auto;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.character-item {
  display: flex;
  cursor: pointer;
  border: 2px solid rgba(22, 17, 34, 0.12);
  border-radius: 8px;
  padding: 12px;
  background: rgba(22, 17, 34, 0.06);

  &.selected {
    border-color: #FF4D8D;
  }
}

.character-avatar {
  position: relative;
  width: 74px;
  height: 98px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
  background: #FFFFFF;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.character-info {
  flex: 1;
  min-width: 0;

  .character-name-box{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .character-name {
    font-weight: 600;
    font-size: 16px;
    color: #0A0A0A;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .character-cost {
    font-size: 12px;
    color: #FF4D8D;
    white-space: nowrap;
  }

  .character-description {
    font-size: 12px;
    color: #161122;
    line-height: 18px;
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
  gap: 24px;
  padding: 18px 24px ;
  border-top: 1px solid rgba(22, 17, 34, 0.12);

  .modal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 136px;
    height: 48px;
    border: 2.5px solid #161122;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 2px 2px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }

    &:active:not(:disabled) {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #161122;
    }

    &.cancel {
      background: #fff;
      color: #161122;

      &:hover {
        color: #FF4D8D;
      }
    }

    &.confirm {
      background: #FF4D8D;
      color: #ffffff;

      &:disabled {
        background: #f8d7e8;
        color: white;
        cursor: not-allowed;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.3);
      }
    }
  }
}

.no-characters{
  text-align: center;
  font-size: 14px;
  color: #5b5566;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 0;

  img {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  span {
    font-size: 14px;
    color: #5b5566;
  }
}

.add-character {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
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
    width: 80px;
    height: 80px;
    background: url('@/assets/images/project/add.png') no-repeat;
    background-size: 100% 100%;
  }

  span {
    font-weight: 600;
    font-size: 14px;
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
