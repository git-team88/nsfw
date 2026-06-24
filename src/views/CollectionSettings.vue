<template>
  <div class="collection-settings">
    <Header :cur="-1"></Header>

    <div class="content-container">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </button>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <div class="page-header">
          <h1 class="page-title">{{ t('collectionSettings.title') }}</h1>
          <div class="action-buttons">
            <button class="btn btn-delete" @click="handleDelete">{{ t('collectionSettings.delete') }}</button>
            <button
              class="btn btn-finish"
              :class="{ 'disabled': collection.status == '2' }"
              :disabled="collection.status == '2'"
              @click="handleFinish"
            >{{ collection.status == '2' ? t('collectionSettings.statusFinished') : t('collectionSettings.setFinish') }}</button>
            <button class="btn btn-edit" @click="goEditCollection">{{ t('collectionSettings.edit') }}</button>
          </div>
        </div>

        <!-- Basic Info Section -->
        <div class="section">
          <div class="cover-section">
            <div class="cover-info">
              <img :src="collection.cover || defaultCover" alt="" class="cover-image" />
              <div class="r18-overlay" v-if="collection.is_nsfw == '1'">
                <span class="r18-text">R18</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="info-item">
              <span class="info-label">{{ t('collectionSettings.collectionName') }}：</span>
              <span class="info-value">{{ collection.title }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">{{ t('collectionSettings.description') }}：</span>
              <span class="info-value description">{{ collection.description }}</span>
            </div>
          </div>
        </div>

        <!-- Other Info Section -->
        <div class="section">
          <h2 class="section-title">{{ t('collectionSettings.otherInfo') }}</h2>

          <div class="info-grid">
            <div class="info-card">
              <span class="info-label">{{ t('collectionSettings.status') }}：</span>
              <span class="info-value status">{{ getStatusText(collection.status) }}</span>
            </div>
            <div class="info-card">
              <span class="info-label">{{ getPublishedLabel() }}：</span>
              <span class="info-value">{{ collection.chapter_count }}{{ getPublishedUnit() }}<b v-if="collection.chapter_count_private > 0" class="private-hint">{{ t('collectionSettings.privateChapterHint', { count: collection.chapter_count_private }) }}</b></span>
            </div>
            <div class="info-card">
              <span class="info-label">{{ t('collectionSettings.createdAt') }}：</span>
              <span class="info-value">{{ collection.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <FinishNoticeModal
      :visible="showFinishNotice"
      @close="showFinishNotice = false"
      @next="handleFinishNext"
    />

    <ConfirmFinishModal
      :visible="showConfirmFinish"
      :collection="collectionInfo"
      @close="showConfirmFinish = false"
      @confirm="confirmFinish"
    />

    <DeleteNoticeModal
      :visible="showDeleteNotice"
      @close="showDeleteNotice = false"
      @next="handleDeleteNext"
    />

    <ConfirmDeleteModal
      :visible="showConfirmDelete"
      :collection="collectionInfo"
      @close="showConfirmDelete = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts" name="CollectionSettings">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/util/toast';
import api from '@/api/index';
import FinishNoticeModal from '@/components/FinishNoticeModal.vue';
import ConfirmFinishModal from '@/components/ConfirmFinishModal.vue';
import DeleteNoticeModal from '@/components/DeleteNoticeModal.vue';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue';
import defaultCover from '@/assets/images/base/cover.png';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(false);

const showFinishNotice = ref(false);
const showConfirmFinish = ref(false);
const showDeleteNotice = ref(false);
const showConfirmDelete = ref(false);

const collection = ref({
  id: '',
  title: '',
  cover: '',
  description: '',
  status: '0',
  type: '2',
  publishedChapters: 0,
  createdAt: '',
  chapter_count: '',
  chapter_count_private: 0,
  user_id: '',
  is_nsfw: '0'
});

const collectionInfo = computed(() => ({
  cover: collection.value.cover || defaultCover,
  title: collection.value.title,
  chapterCount: parseInt(collection.value.chapter_count) || collection.value.publishedChapters || 0,
  type: collection.value.type
}));

onMounted(async () => {
  const bookIdParam = route.params.id;
  if (!bookIdParam) {
    toast(t('collectionSettings.notFound'));
    return;
  }

  const bookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;
  loading.value = true;
  try {
    const res = await api.getSelfCollectionDetail(bookId) as any;
    if (res.code == 0 || res.code == 200) {
      const data = res.data || {};
      const bookInfo = data.book_info || {};
      collection.value = {
          id: bookInfo.id || bookInfo.book_id || bookId,
          title: bookInfo.title || '',
          cover: bookInfo.cover || '',
          description: bookInfo.description || '',
          status: bookInfo.status || '0',
          type: bookInfo.type || '2',
          publishedChapters: data.chatpers?.length || 0,
          createdAt: bookInfo.created_at || '',
          chapter_count: bookInfo.chapter_count || '',
          chapter_count_private: bookInfo.chapter_count_private || 0,
          user_id: bookInfo.user_id || '',
          is_nsfw: bookInfo.is_nsfw || '0',
        };
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
});

function goBack() {
  router.back();
}

function goEditCollection() {
  router.push(`/create-collection?id=${collection.value.id}`);
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    '0': t('collectionSettings.statusOngoing'),
    '2': t('collectionSettings.statusFinished')
  };
  return statusMap[status] || status;
}

function getPublishedLabel(): string {
  const type = collection.value.type;
  if (type === '1' || type === '3') {
    return t('collectionSettings.publishedEpisodes');
  }
  return t('collectionSettings.publishedChapters');
}

function getPublishedUnit(): string {
  const type = collection.value.type;
  if (type === '1' || type === '3') {
    return t('collectionSettings.unitEpisode');
  }
  return t('collectionSettings.unitChapter');
}

function handleFinish() {
  showFinishNotice.value = true;
}

function handleFinishNext() {
  showFinishNotice.value = false;
  showConfirmFinish.value = true;
}

async function confirmFinish() {
  try {
    const finishRes = await api.finishCollection({
      book_id: collection.value.id
    }) as any;
    if (finishRes.code == 0 || finishRes.code == 200) {
      showConfirmFinish.value = false;
      toast(t('success'));

      try {
        const detailRes = await api.getSelfCollectionDetail(collection.value.id) as any;
        if (detailRes.code == 0 || detailRes.code == 200) {
          const data = detailRes.data || {};
          const bookInfo = data.book_info || {};
          collection.value.status = bookInfo.status || '1';
        }
      } catch (detailError) {
        console.error('Failed to fetch collection detail:', detailError);
        collection.value.status = '1';
      }
    } else {
      toast(locale.value == 'en' ? finishRes.msg : locale.value == 'zh' ? finishRes.msg_cn : locale.value == 'tc' ? finishRes.msg_tc : finishRes.msg_jp);
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}

function handleDelete() {
  showDeleteNotice.value = true;
}

function handleDeleteNext() {
  showDeleteNotice.value = false;
  showConfirmDelete.value = true;
}

async function confirmDelete() {
  try {
    const res = await api.deleteCollection({ book_id: collection.value.id }) as any;
    if (res.code == 0 || res.code == 200) {
      showConfirmDelete.value = false;
      toast(t('collectionSettings.deleteSuccess'));

      setTimeout(() => {
        router.push(`/user-home?id=${collection.value.user_id}`);
      }, 1000);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}
</script>

<style lang="scss" scoped>
.collection-settings {
  min-height: 100vh;
  background-color: #FFFFFF;
}

.content-container {
  max-width: 84rem;
  margin: 0 auto;
  padding: 13rem 0 2.4rem;
}

.back-btn {
  position: fixed;
  left: 50%;
  top: 14rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-54rem);
  cursor: pointer;
  z-index: 10;

  img {
    width: 4rem;
    height: 4rem;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;

  .page-title {
    font-size: 2rem;
    font-weight: 600;
    color: #101828;
    margin: 0;
  }

  .action-buttons {
    display: flex;
    gap: 1.2rem;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    padding: 0 1.6rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-delete {
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #FB64B6;
      }
    }

    &.btn-finish {
      background: #00D3F2;
      color: #FFFFFF;

      &:hover {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 5;
        }
      }

      &.disabled {
        background: #F5F5F5;
        color: #6A7282;
        cursor: not-allowed;

        &:hover {
          &::before {
            display: none;
          }
        }
      }
    }

    &.btn-edit {
      background: #FB64B6;
      color: #FFFFFF;

      &:hover {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 5;
        }
      }
    }
  }
}

.section {
  .section-title {
    font-size: 1.6rem;
    font-weight: 600;
    color: #101828;
    margin: 0 0 2rem 0;
  }
}

.cover-section {
  margin-bottom: 2rem;

  .cover-info{
    position: relative;
    width: 18rem;
    height: 24rem;
  }
  .cover-image {
    width: 18rem;
    height: 24rem;
    object-fit: cover;
    border-radius: 1.2rem;
  }

  .r18-overlay {
    position: absolute;
    top: 0;
    right: 0;
    width: 10rem;
    height: 10rem;
    background: linear-gradient(222deg, #FB64B6 0%, rgba(251,100,182,0) 50%);
    border-radius: 0 1.2rem 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 0.6rem;

    .r18-text {
      font-size: 1.6rem;
      font-weight: 500;
      color: #FFFFFF;
      text-shadow: 0px 0px 8px rgba(0,0,0,0.18);
    }
  }
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 4rem;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .info-label {
      font-weight: 500;
      font-size: 1.6rem;
      color: #99A1AF;
    }

    .info-value {
      font-size: 1.6rem;
      color: #364153;
      font-weight: 500;

      &.description {
        line-height: 2.4rem;
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;

      .tag {
        padding: 0.4rem 1rem;
        background: #f0f0f0;
        color: #666;
        border-radius: 0.4rem;
        font-size: 1.2rem;
      }
    }
  }

  .r18-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 3rem;
    background: rgba(251, 100, 182, 0.2);
    border-radius: 0.4rem;
    color: #FB64B6;
    font-size: 1.4rem;
  }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .info-label {
    font-weight: 500;
    font-size: 1.6rem;
    color: #99A1AF;
  }

  .info-value {
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;

    .private-hint {
      font-weight: normal;
      color: #99A1AF;
    }
  }
}
</style>
