<template>
  <div class="collection-list-modal" v-if="visible">
    <div class="modal-overlay" @click="handleClose"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ t('collection.selectCollection') }}</h3>
        <img class="close-btn" src="@/assets/images/base/close.png" alt="Close" @click="handleClose" />
      </div>

      <div class="new-collection-row" @click="handleCreateNew">
        <div class="new-collection-btn">
          <img src="@/assets/images/publish/plus_icon.png" alt="Plus" />
          <span>{{ t('collection.newCollection') }}</span>
        </div>
      </div>

      <div class="modal-body" @scroll="handleScroll">
        <div class="collection-grid">
          <div
            class="collection-card"
            v-for="collection in collections"
            :key="collection.id"
            :class="{ 'selected': localSelectedId && localSelectedId == collection.id }"
            @click="handleSelectCollection(collection)"
          >
            <div class="card-cover">
              <img v-if="collection.cover" :src="processImageUrl(collection.cover)" alt="" />
              <div v-else class="cover-placeholder"></div>
            </div>
            <div class="card-info">
              <span class="card-title">{{ collection.title }}</span>
              <!-- <span class="card-desc">{{ collection.description || '' }}</span> -->
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="loading-indicator">
          <div class="loading-spinner"></div>
          <span>{{ t('loading') }}</span>
        </div>
        <div v-else-if="!hasMore && collections.length > 0 && currentPage > 1" class="no-more">
          {{ t('emptyState.noMoreData') }}
        </div>
        <div v-if="!isLoading && collections.length === 0" class="empty-state">
          {{ t('common.noData') }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ t('collection.cancel') }}</button>
        <button class="btn btn-confirm" @click="handleConfirm">{{ t('collection.switchConfirm.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { processImageUrl } from '@/util/utils';
import { toast } from '@/util/toast';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  modelValue?: string | number | null;
  uid: string;
  type?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', collection: any): void;
  (e: 'create'): void;
  (e: 'confirm', collection: any): void;
  (e: 'update:modelValue', value: string | number | null): void;
}>();

const collections = ref<any[]>([]);
const isLoading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(20);
const localSelectedId = ref<string | number | null>(null);
const initialSelectedId = ref<string | number | null>(null);

async function fetchCollections(loadMore = false) {
  if (isLoading.value || (!loadMore && !hasMore.value)) return;

  isLoading.value = true;

  try {
    const page = loadMore ? currentPage.value + 1 : 1;
    const response = await api.getCollection(props.type || 2, page, pageSize.value, props.uid) as any;

    if (response.code == 0) {
      const newCollections = response.data?.data || [];

      if (loadMore) {
        collections.value = [...collections.value, ...newCollections];
        currentPage.value = page;
      } else {
        collections.value = newCollections;
        currentPage.value = 1;
      }

      hasMore.value = newCollections.length === pageSize.value;
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollHeight - scrollTop - clientHeight < 100 && hasMore.value && !isLoading.value) {
    fetchCollections(true);
  }
}

function handleSelectCollection(collection: any) {
  emit('select', collection);
}

function handleConfirm() {
  if (!localSelectedId.value) {
    toast(t('collection.selectCollectionTip'));
    return;
  }
  const selected = collections.value.find(c => c.id == localSelectedId.value);
  if (selected) {
    emit('confirm', selected);
  }
}

function handleCreateNew() {
  emit('create');
}

function handleClose() {
  emit('close');
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    hasMore.value = true;
    currentPage.value = 1;
    collections.value = [];
    localSelectedId.value = props.modelValue || null;
    initialSelectedId.value = props.modelValue || null;
    fetchCollections(false);
  }
});

watch(() => props.modelValue, (newVal) => {
  localSelectedId.value = newVal || null;
});
</script>

<style lang="scss" scoped>
.collection-list-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.modal-content {
  position: relative;
  width: 840px;
  max-height: 700px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #F5F5F5;
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #101828;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    cursor: pointer;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.new-collection-row {
  flex-shrink: 0;
  padding: 20px 24px 0;
  cursor: pointer;

  .new-collection-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 94px;
    border-radius: 8px;
    color: #99A1AF;
    font-size: 14px;
    background-color: #F9FAFB;

    img {
      width: 24px;
      height: 24px;
    }
  }
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.collection-card {
  display: flex;
  gap: 12px;
  border: 1px solid #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  background: #F9FAFB;

  &.selected {
    border-color: #FB64B6;
  }

  .card-cover {
    width: 72px;
    height: 96px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #F5F5F5;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      background: #F5F5F5;
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 10px 10px 0;
  }

  .card-title {
    font-size: 14px;
    color: #364153;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
  }

  .card-desc {
    font-size: 12px;
    color: #99A1AF;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  font-size: 14px;
  color: #99A1AF;

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #F5F5F5;
    border-top: 2px solid #6A7282;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: #99A1AF;
}

.empty-state {
  text-align: center;
  padding: 40px;
  font-size: 14px;
  color: #99A1AF;
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 20px 24px;
  border-top: 1px solid #F5F5F5;
  flex-shrink: 0;

  .btn {
    min-width: 136px;
    height: 48px;
    padding: 0 48px;
    border-radius: 8px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-cancel {
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #FB64B6;
      }
    }

    &.btn-confirm {
      background: #FB64B6;
      color: #fff;

      &:hover {
        position: relative;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}
</style>
