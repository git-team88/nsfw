<template>
  <div class="ai-creations-modal-overlay" @click.self="closeModal">
    <div class="ai-creations-modal">
      <img
        class="close-btn"
        src="@/assets/images/base/close.png"
        alt=""
        @click="closeModal"
      />

      <!-- Modal Header -->
      <div class="modal-header">
        <h3>{{ t('aiCreations.title') }}</h3>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Filter Tabs -->
        <div class="filter-box">
          <!-- <div class="filter-tabs">
            <span
              class="tab-btn"
              :class="{ active: activeFilter === 'all' }"
              @click="setFilter('all')"
            >
              {{ t('aiCreations.filter.all') }}
            </span>
            <span
              class="tab-btn"
              :class="{ active: activeFilter === 'video' }"
              @click="setFilter('video')"
            >
              {{ t('aiCreations.filter.video') }}
            </span>
            <span
              class="tab-btn"
              :class="{ active: activeFilter === 'image' }"
              @click="setFilter('image')"
            >
              {{ t('aiCreations.filter.image') }}
            </span>
          </div> -->

          <!-- Sort Option -->
          <div class="sort-option" @click="toggleSortOrder">
            <span class="sort-text">{{ sortOrder === 'asc' ? t('aiCreations.sort.asc') : t('aiCreations.sort.desc') }}</span>
            <img src="../assets/images/project/sort.png" alt="" />
          </div>
        </div>

        <div class="creations-options">
        <!-- AI Creations Grid -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <span>{{ t('home.loading') }}</span>
          </div>
          <div v-else class="creations-grid">
            <div
              v-for="creation in currentPageCreations"
              :key="creation.id"
              class="creation-card"
              :class="{ selected: isSelected(creation) }"
              @click="selectCreation(creation)"
            >

              <div class="creation-thumbnail">
                <img :src="creation.result_async.final_video_output.video_cover_url" alt="" class="cover-img" />

                <div class="video-overlay" @click.stop="openPreviewModal(creation)">
                  <img class="play-icon-img" src="@/assets/images/detail/play.png" alt="" />
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination-container" v-if="!loading && totalCreations > 0 && Math.ceil(totalCreations / itemsPerPage) > 1">
            <Pagination
              :total="totalCreations"
              :page-size="itemsPerPage"
              v-model:model-value="currentPage"
              theme="pink"
            />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="selection">
          <!-- Selection Info -->
          <!-- <div class="selection-info">
            <p>{{ t('aiCreations.selectionInfo') }}</p>
            <span class="clear-all-btn" @click="clearAllSelections">
              {{ t('aiCreations.clearAll') }}
            </span>
          </div> -->

          <!-- Selected Items Preview -->
          <!-- <div v-if="selectedCreations.length > 0" class="selected-items">
            <div
              v-for="item in selectedCreations"
              :key="item.id"
              class="selected-item"
            >
              <img class="selected-img" :src="item.final_video_cover || item.video_cover || item.thumbnail" :alt="item.title" />
              <div v-if="item.type === 'video'" class="video-badge" @click.stop="openPreviewModal(item)">
                <img src="@/assets/images/detail/play.png" alt="Play" class="play-icon-small" />
              </div>
              <img src="@/assets/images/project/delete.png" class="remove-item-btn" @click.stop="removeSelection(item)" />
            </div>
          </div> -->
        </div>

        <div class="modal-btn">
          <span class="cancel-btn" @click="closeModal">
          {{ t('aiCreations.cancel') }}
          </span>
          <span class="confirm-btn" @click="confirmSelection" :disabled="selectedCreations.length === 0">
            {{ t('aiCreations.confirm') }}
          </span>
        </div>

      </div>
    </div>

    <PreviewModal
      v-if="showPreviewModal"
      :visible="showPreviewModal"
      :video-url="previewCreation"
      @close="closePreviewModal"
    />

  </div>
</template>

<script setup lang="ts" name="AICreationsModal">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Pagination from './Pagination.vue';
import PreviewModal from './PreviewModal.vue';
import { toast } from '@/util/toast';
import api from '@/api/index';

const { t, locale } = useI18n();
const router = useRouter();

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// State
const activeFilter = ref('all');
const sortOrder = ref('desc');
const currentPage = ref(1);
const itemsPerPage = 10;
const selectedCreations = ref<any[]>([]);
const showPreviewModal = ref(false);
const previewCreation = ref<any>(null);
const creations = ref<any[]>([]);
const loading = ref(false);
const totalCreations = ref(0);

// Fetch AI creations data
async function fetchCreations() {
  loading.value = true;
  try {
    const res = await api.getProject(2, 1, 'story', currentPage.value, itemsPerPage, sortOrder.value, 1);
    const data = res as unknown as { code: number; data?: any };
    if (data.code === 0 || data.code === 200) {
      creations.value = data.data?.data_list || [];
      totalCreations.value = data.data?.data_count || 0;
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}

// Computed
const filteredCreations = computed(() => {
  let result = [...creations.value];

  // Filter by type
  if (activeFilter.value !== 'all') {
    result = result.filter(creation => creation.type === activeFilter.value);
  }

  // Sort by time
  result.sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt).getTime();
    const dateB = new Date(b.created_at || b.createdAt).getTime();
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return result;
});

// Lifecycle
onMounted(() => {
  fetchCreations();
});

// Watch for page changes
watch(currentPage, () => {
  fetchCreations();
});

const currentPageCreations = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredCreations.value.slice(startIndex, endIndex);
});

// Methods
const closeModal = () => {
  emit('close');
};

const setFilter = (filter: string) => {
  activeFilter.value = filter;
  currentPage.value = 1;
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  currentPage.value = 1;
  fetchCreations();
};

const isSelected = (creation: any) => {
  return selectedCreations.value.some(item => item.id === creation.id);
};

const selectCreation = (creation: any) => {
  const existingIndex = selectedCreations.value.findIndex(item => item.id === creation.id);
  if (existingIndex > -1) {
    selectedCreations.value = [];
  } else {
    selectedCreations.value = [creation];
  }
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
  previewCreation.value = null;
};

const clearAllSelections = () => {
  selectedCreations.value = [];
};

const removeSelection = (creation: any) => {
  const index = selectedCreations.value.findIndex(item => item.id === creation.id);
  if (index > -1) {
    selectedCreations.value.splice(index, 1);
  }
};

const confirmSelection = () => {
  if (selectedCreations.value.length === 0) {
    toast(t('aiCreations.selectVideoFirst'));
    return;
  }

  const selectedCreation = selectedCreations.value[0];
  const videoUrl = selectedCreation.result_async.final_video_output.video_url;
  const coverUrl = selectedCreation.result_async.final_video_output.video_cover_url;
  const sessionId = selectedCreation.session_id || selectedCreation.sessionId;

  router.push({
    path: '/publish/video',
    query: {
      session_id: sessionId,
      url: videoUrl,
      cover: coverUrl,
    }
  });

  closeModal();
};

const openPreviewModal = (creation: any) => {
  previewCreation.value = creation;
  showPreviewModal.value = true;
};
</script>

<style lang="scss" scoped>
.ai-creations-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ai-creations-modal {
  position: relative;
  background: #FFFFFF;
  border-radius: 1.2rem;
  width: 76.8rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  right: 1.8rem;
  top: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.8rem 2rem;
  border-bottom: 1px solid #F5F5F5;

  h3 {
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
    margin: 0;
  }
}

.modal-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.filter-box{
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

.filter-tabs {
  display: flex;
  align-items: center;

  .tab-btn {
    padding: 0.8rem 1.6rem;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    color: #6a7282;
    cursor: pointer;
    margin-right: 1rem;

    &.active {
      background: #fb64b6;
      color: #FFFFFF;
      border-color: #fb64b6;
    }

    &:hover:not(.active) {
      border-color: #F5F5F5;
    }
  }
}

.sort-option {
  color: #6A7282;
  cursor: pointer;
  font-size: 1.4rem;
  display: flex;
  align-items: center;

  .sort-text {
    margin-right: 0.4rem;
  }

  img{
    width: 1.6rem;
    height: 1.6rem;
  }
}

.creations-options{
  height: 45rem;
  overflow-y: auto;
}

.creations-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2.4rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 45rem;
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 0.4rem solid #F5F5F5;
  border-top: 0.4rem solid #6A7282;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.creation-card {
  width: 13.6rem;
  height: 18.1rem;
  border-radius: 0.8rem;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;

  &.selected {
    border-color: #fb64b6;
  }

  .creation-thumbnail {
    width: 100%;
    height: 100%;
    position: relative;

    .character-images {
      width: 100%;
      height: 100%;
    }

    .cover-img{
      width: 100%;
      height: 100%;
      border-radius: 0.8rem;
      object-fit: cover;
    }

    .character-image-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        border-radius: 0.8rem;
        object-fit: cover;
      }
    }

    .play-button {
      position: absolute;
      top: 50%;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%) translateY(-42%);
      cursor: pointer;

      .play-icon-img {
        width: 7rem;
        height: 7rem;
        object-fit: contain;
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.selection{
  width: 50rem;
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    font-size: 1.4rem;
    color: #6a7282;
    margin: 0;
  }

  .clear-all-btn {
    color: #fb64b6;
    cursor: pointer;
    font-size: 1.4rem;
  }
}

.selected-items {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  margin-top: 1.2rem;

  .selected-item {
    position: relative;
    width: 6.6rem;
    height: 8.8rem;

    .selected-img {
      width: 6.6rem;
      height: 8.8rem;
      object-fit: cover;
      border-radius: 0.4rem;
    }

    .remove-item-btn {
      position: absolute;
      top: 0.2rem;
      right: 0.2rem;
      width: 1.6rem;
      height: 1.6rem;
      cursor: pointer;
      z-index: 10;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.2rem;
  padding: 1.2rem 2rem 1.8rem;
  border-top: 1px solid #F5F5F5;

  .modal-btn{
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }
  .cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    background: #F5F5F5;
    color: #6A7282;
    cursor: pointer;

    &:hover {
      color: #FB64B6;
    }
  }

  .confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    background: #FB64B6;
    color: #ffffff;
    cursor: pointer;

    &:disabled {
      background: #f8d7e8;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      position: relative;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}


/* Video Badge in Selected Items */
.selected-item {
  position: relative;

  .video-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%) translateY(-42%);
    cursor: pointer;

    .play-icon-small {
      width: 4rem;
      height: 4rem;
      object-fit: contain;
    }
  }
}
</style>