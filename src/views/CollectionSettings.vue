<template>
  <div class="collection-settings">
    <Header :cur="-1"></Header>

    <div class="content-container">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Basic Info Card -->
        <div class="section">
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

          <div class="cover-section">
            <div class="cover-info">
              <img :src="processImageUrl(collection.cover) || defaultCover" alt="" class="cover-image" />
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
              <span class="info-value">{{ formatTimestamp(collection.createdAt) }}</span>
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
import { formatTimestamp, processImageUrl } from '@/util/utils';
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
  cover: processImageUrl(collection.value.cover) || defaultCover,
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
  background-color: #FFFDF7;
}

.content-container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 130px 24px 24px;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 0;
  left: -52px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #161122;
  cursor: pointer;
  z-index: 10;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FFFDF7;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 4px 4px 0 #161122;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(22, 17, 34, 0.12);

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #161122;
    margin: 0;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 136px;
    height: 48px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-delete {
      background: #FFFDF7;
      color: #5b5566;
      border: 2px solid #161122;
      box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

      &:hover {
        color: #FF4D8D;
        border-color: #FF4D8D;
      }
    }

    &.btn-finish {
      background: #00D3F2;
      color: #FFFFFF;
      border: 3px solid #161122;
      box-shadow: 2px 2px 0 #161122;

      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
      }

      &.disabled {
        background: rgba(22, 17, 34, 0.06);
        color: #5b5566;
        cursor: not-allowed;
        border: 2px solid #161122;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);
      }
    }

    &.btn-edit {
      background: #FF4D8D;
      color: #FFFFFF;
      border: 3px solid #161122;
      box-shadow: 2px 2px 0 #161122;

      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
      }
    }
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  padding: 20px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #161122;
    margin: 0 0 20px 0;
  }
}

.cover-section {
  margin-bottom: 20px;

  .cover-info{
    position: relative;
    width: 180px;
    height: 240px;
  }
  .cover-image {
    width: 180px;
    height: 240px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);
  }

  .r18-overlay {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: linear-gradient(222deg, #FF4D8D 0%, rgba(255,77,141,0) 50%);
    border-radius: 0 12px 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 6px;

    .r18-text {
      font-size: 16px;
      font-weight: 500;
      color: #FFFFFF;
      text-shadow: 0px 0px 8px rgba(0,0,0,0.18);
    }
  }
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .info-label {
      font-weight: 600;
      font-size: 16px;
      color: #9a93a4;
    }

    .info-value {
      font-size: 16px;
      color: #161122;
      font-weight: 500;

      &.description {
        line-height: 24px;
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag {
        padding: 4px 10px;
        background: #f0f0f0;
        color: #666;
        border-radius: 4px;
        font-size: 12px;
      }
    }
  }

  .r18-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 30px;
    background: rgba(255, 77, 141, 0.2);
    border-radius: 4px;
    color: #FF4D8D;
    font-size: 14px;
  }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .info-label {
    font-weight: 600;
    font-size: 16px;
    color: #9a93a4;
  }

  .info-value {
    font-size: 16px;
    font-weight: 500;
    color: #161122;

    .private-hint {
      font-weight: normal;
      color: #9a93a4;
    }
  }
}

@media (max-width: 1440px) {
  .content-container {
    max-width: 80.5556vw;
    padding: 9.0278vw 1.6667vw 1.6667vw;
  }
  .back-btn {
    top: 9.7222vw;
    width: 2.7778vw;
    height: 2.7778vw;
    left: -3.6111vw;
  }
  .page-header {
    margin-bottom: 1.3889vw;
    padding-bottom: 1.3889vw;
    border-bottom: 1px solid rgba(22, 17, 34, 0.12);
    .page-title {
      font-size: 1.3889vw;
    }
    .action-buttons {
      gap: 0.8333vw;
    }
    .btn {
      min-width: 9.4444vw;
      height: 3.3333vw;
      padding: 0 1.1111vw;
      border-radius: 0.5556vw;
      font-size: 0.9722vw;
    }
  }
  .main-content {
    gap: 1.6667vw;
  }
  .section {
    .section-title {
      font-size: 1.1111vw;
      margin: 0 0 1.3889vw 0;
    }
  }
  .cover-section {
    margin-bottom: 1.3889vw;
    .cover-info {
      width: 12.5vw;
      height: 16.6667vw;
    }
    .cover-image {
      width: 12.5vw;
      height: 16.6667vw;
      border-radius: 0.8333vw;
    }
    .r18-overlay {
      width: 6.9444vw;
      height: 6.9444vw;
      border-radius: 0 0.8333vw 0 0;
      padding: 0.4167vw;
      .r18-text {
        font-size: 1.1111vw;
      }
    }
  }
  .detail-section {
    gap: 1.3889vw;
    .info-item {
      gap: 0.6944vw;
      .info-label {
        font-size: 1.1111vw;
      }
      .info-value {
        font-size: 1.1111vw;
        &.description {
          line-height: 1.6667vw;
        }
      }
      .tag-list {
        gap: 0.5556vw;
        .tag {
          padding: 0.2778vw 0.6944vw;
          border-radius: 0.2778vw;
          font-size: 0.8333vw;
        }
      }
    }
    .r18-tag {
      width: 3.4722vw;
      height: 2.0833vw;
      border-radius: 0.2778vw;
      font-size: 0.9722vw;
    }
  }
  .info-grid {
    gap: 1.3889vw;
  }
  .info-card {
    gap: 0.6944vw;
    .info-label {
      font-size: 1.1111vw;
    }
    .info-value {
      font-size: 1.1111vw;
    }
  }

  .back-btn {
    top: 140px;
    width: 40px;
    height: 40px;
    left: -52px;
  }
  .page-header {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(22, 17, 34, 0.12);
    .page-title {
      font-size: 20px;
    }
    .action-buttons {
      gap: 12px;
    }
    .btn {
      min-width: 136px;
      height: 48px;
      padding: 0 16px;
      border-radius: 8px;
      font-size: 14px;
    }
  }
  .main-content {
    gap: 24px;
  }
  .section {
    .section-title {
      font-size: 16px;
      margin: 0 0 20px 0;
    }
  }
  .cover-section {
    margin-bottom: 20px;
    .cover-info {
      width: 180px;
      height: 240px;
    }
    .cover-image {
      width: 180px;
      height: 240px;
      border-radius: 12px;
    }
    .r18-overlay {
      width: 100px;
      height: 100px;
      border-radius: 0 12px 0 0;
      padding: 6px;
      .r18-text {
        font-size: 16px;
      }
    }
  }
  .detail-section {
    gap: 20px;
    .info-item {
      gap: 10px;
      .info-label {
        font-size: 16px;
      }
      .info-value {
        font-size: 16px;
        &.description {
          line-height: 24px;
        }
      }
      .tag-list {
        gap: 8px;
        .tag {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
    .r18-tag {
      width: 50px;
      height: 30px;
      border-radius: 4px;
      font-size: 14px;
    }
  }
  .info-grid {
    gap: 20px;
  }
  .info-card {
    gap: 10px;
    .info-label {
      font-size: 16px;
    }
    .info-value {
      font-size: 16px;
    }
  }
}

@media (max-width: 768px) {
  .content-container {
    max-width: 100%;
    padding: 80px 16px 16px;
  }
  .back-btn {
    position: fixed;
    top: 80px;
    left: 16px;
    width: 32px;
    height: 32px;
  }
  .page-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(22, 17, 34, 0.12);
    .page-title {
      font-size: 18px;
    }
    .action-buttons {
      gap: 8px;
    }
    .btn {
      min-width: 80px;
      height: 36px;
      padding: 0 10px;
      border-radius: 6px;
      font-size: 12px;
    }
  }
  .main-content {
    gap: 16px;
  }
  .section {
    .section-title {
      font-size: 14px;
      margin: 0 0 12px 0;
    }
  }
  .cover-section {
    margin-bottom: 16px;
    .cover-info {
      width: 140px;
      height: 186px;
    }
    .cover-image {
      width: 140px;
      height: 186px;
      border-radius: 8px;
    }
    .r18-overlay {
      width: 60px;
      height: 60px;
      border-radius: 0 8px 0 0;
      padding: 4px;
      .r18-text {
        font-size: 12px;
      }
    }
  }
  .detail-section {
    gap: 12px;
    .info-item {
      gap: 6px;
      .info-label {
        font-size: 14px;
      }
      .info-value {
        font-size: 14px;
        &.description {
          line-height: 20px;
        }
      }
      .tag-list {
        gap: 4px;
        .tag {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }
      }
    }
    .r18-tag {
      width: 40px;
      height: 24px;
      border-radius: 3px;
      font-size: 12px;
    }
  }
  .info-grid {
    gap: 12px;
  }
  .info-card {
    gap: 6px;
    .info-label {
      font-size: 14px;
    }
    .info-value {
      font-size: 14px;
    }
  }
}
</style>
