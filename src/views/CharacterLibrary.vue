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

      <!-- Character Grid -->
      <div v-else-if="characters.length > 0" class="character-grid">
        <!-- Character Cards -->
        <div
          v-for="(character, index) in characters"
          :key="character.id"
          class="character-card"
          :style="{ animationDelay: `${Math.min((index + 1) * 45, 400)}ms` }"
          @click="openCharacterDetail(character)"
        >
          <div class="character-img-wrap">
            <img class="character-img" :src="processImageUrl(character.image)" :alt="character.name" />
            <span class="halftone" aria-hidden="true"></span>
            <span class="char-sheen" aria-hidden="true"></span>
          </div>
          <span class="character-name">{{ character.name }}</span>
        </div>
      </div>

      <EmptyState v-else :text="t('characterLibrary.emptyState.description')" />

      <div class="pagination-container" v-if="!isLoading && totalCount > 0 && totalPages > 1">
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
import api from '@/api/index';
import { toast } from '@/util/toast';
import { processImageUrl, apiErrorMessage } from '@/util/utils';

const { t, locale } = useI18n();
const router = useRouter();

// State
const characters = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 20;
const totalCount = ref(0);
const showDetailModal = ref(false);
const selectedCharacter = ref<any>(null);
const isLoading = ref(false);
const activeTab = ref('my');

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

// Computed
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage);
});

function openCharacterDetail(character: any) {
  selectedCharacter.value = character;
  showDetailModal.value = true;
}

function closeCharacterDetail() {
  showDetailModal.value = false;
  selectedCharacter.value = null;
}

async function loadCharacters() {
  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab and page at the time of the request
  const currentTab = activeTab.value;
  const currentPageValue = currentPage.value;

  isLoading.value = true;
  try {
    // 只有「我的角色」一个 tab：type 固定 1
    const type = 1;
    const response = await api.getCharacters(type, currentPage.value, itemsPerPage) as any;

    // 过期响应（已经发了更新的请求 / 页码变了）：直接丢，不碰 loading —— 那是新请求的
    if (requestId !== currentRequestId.value) return;
    if (currentTab !== activeTab.value || currentPageValue !== currentPage.value) return;

    if (response.code == 200 && response.data) {
      if (response.data.data_list) {
        characters.value = response.data.data_list.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.main_image_url,
          tri_image: item.tri_view_url,
          description: item.desc,
          useCostPoints: item.use_cost_points,
          isOfficial: false
        }));
        // Capture total count from API response
        totalCount.value = response.data.data_count || 0;
      } else {
        toast(t('fail'));
        characters.value = [];
        totalCount.value = 0;
      }
    } else {
      toast(apiErrorMessage(response) || t('fail'))
      characters.value = [];
      totalCount.value = 0;
    }
    isLoading.value = false;
  } catch (err) {
    if (requestId !== currentRequestId.value) return;
    toast(t('fail'));
    characters.value = [];
    totalCount.value = 0;
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
  // 未登录：和 Header 入口、我的项目一致，去登录页（不然私有接口回来会弹「登录已过期」）
  if (!localStorage.getItem('token')) {
    router.push('/login');
    return;
  }
  window.scrollTo(0, 0);

  setSeoMeta();

  loadCharacters();
});

watch(() => locale.value, () => {
  setSeoMeta();
});
</script>

<style lang="scss" scoped>
$ink: #f5f5f5;
$paper: #1a1a1a;
$cream: #111111;
$pink: #ff4f9a;
$muted: #777;
$sub: #aaa;
$line: #2c2c2c;
$yellow: #FFD23F;

$role-accents: #FFC24B, #C9B6FF, #7FD8E8, #FF9EC4, #A3E635, #FFD23F;

.character-library {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
}

.container {
  max-width: 1280px;
  margin: 0 auto 20px;
  padding: 100px 20px 20px;

  @media (min-width: 768px) {
    padding: 100px 24px 24px;
  }
}

.page-title {
  font-weight: 800;
  font-size: 26px;
  color: $ink;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.page-sub {
  font-size: 13px;
  color: $muted;
  font-weight: 600;
  margin-bottom: 18px;
}

.count-badge {
  font-weight: 800;
  font-size: 13px;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
  padding: 4px 14px;
  background: #1a1a1a;
  box-shadow: none;
  margin-left: auto;
}

.tab-navigation {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .tab {
    font-weight: 800;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 25px;
    border: 1px solid #404040;
    cursor: pointer;
    transition: all 0.16s;
    background: #1a1a1a;
    color: #888;

    &.active {
      color: #fff;
      border: 1px solid #ff9aca;
      border-radius: 18px;
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      box-shadow: 0 0 23px rgba(255, 50, 140, .65);
    }

    &:hover:not(.active) {
      color: #ccc;
      border-color: #555;
    }
  }
}

/* Process Section */
.process-section {
  margin-bottom: 10px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.create-new-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  border-radius: 16px;
  border: 1px dashed #404040;
  background: #1a1a1a;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);

  &:hover {
    border-color: #ff4f9a;
    border-style: dashed;

    .create-new-icon {
      transform: rotate(12deg);
      border-style: solid;
      border-color: #ff4f9a;
      background: $pink;
      color: #fff;
    }
  }

  .create-new-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 2px dashed #404040;
    background: transparent;
    color: #888;
    transition: all 0.42s cubic-bezier(0.34,1.56,0.64,1);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .create-new-text {
    font-weight: 800;
    font-size: 14px;
    color: #888;
    margin-top: 12px;
  }
}

.character-card {
  position: relative;
  background: #1a1a1a;
  border: 1px solid #2c2c2c;
  border-radius: 12px;
  box-shadow: none;
  cursor: pointer;
  overflow: visible;
  transition: border-color 0.15s;

  &:hover {
    border-color: #ff4f9a;
  }

  .character-img-wrap {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
    border-radius: 11px 11px 0 0;

    .character-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }

    .halftone {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.16;
      mix-blend-mode: overlay;
      background-image: radial-gradient(#000 1px, transparent 1.4px);
      background-size: 9px 9px;
    }
  }

  .character-name {
    display: block;
    padding: 8px 14px 12px;
    font-weight: 800;
    font-size: 15px;
    color: #f5f5f5;
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
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    color: #ccc;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 11px;
    z-index: 1;
    box-shadow: none;

    .power-icon {
      width: 12px;
      height: 12px;

      img {
        filter: brightness(0) invert(1);
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #2c2c2c;
    border-top: 3px solid #ff4f9a;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 20px;
  }

  .loading-text {
    font-size: 14px;
    color: #777;
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
  min-height: 400px;
  text-align: center;
  grid-column: 1 / -1;
}

.error-message {
  font-size: 14px;
  color: #E5484D;
  font-weight: 800;
  margin-bottom: 16px;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, $pink, #FF7A45);
  border: none;
  border-radius: 14px;
  padding: 10px 24px;
  cursor: pointer;
  box-shadow: none;

  &:hover {
    filter: brightness(1.08);
  }
}

/* Responsive */
@media (max-width: 720px) {
  .container {
    padding: 100px 16px;
  }

  .character-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .tab-navigation .tab {
    font-size: 12px;
    padding: 6px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .character-card {
    transition: none !important;
  }
  .create-new-icon {
    transition: none !important;
  }
}
</style>