<template>
  <div v-if="visible" class="cover-history-modal" @click="$emit('cancel')">
    <div class="cover-history-content" @click.stop>
      <div class="cover-history-header">
        <h3 class="cover-history-title">{{ t('novel.coverHistoryTitle') }}</h3>
        <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />
      </div>
      <div class="cover-history-list">
        <div
          v-for="(coverUrl, index) in coverList"
          :key="index"
          class="cover-history-item"
          :class="{ active: coverUrl == selectedCover }"
          @click="selectedCover = coverUrl"
        >
          <img :src="coverUrl + '?imageMogr2/format/webp/quality/60'" alt="" />
        </div>
      </div>
      <div v-if="coverList.length == 0" class="cover-history-empty">
        <span>{{ t('novel.coverHistoryEmpty') }}</span>
      </div>
      <div class="cover-history-footer" v-if="coverList.length > 0">
        <button class="confirm-btn" @click="handleConfirm">{{ t('novel.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  coverList: string[];
  currentCover: string;
}>();

const emit = defineEmits<{
  cancel: [];
  select: [coverUrl: string];
}>();

const selectedCover = ref<string>('');

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedCover.value = props.currentCover;
  }
});

const handleConfirm = () => {
  if (selectedCover.value) {
    emit('select', selectedCover.value);
  }
};
</script>

<style scoped lang="scss">
.cover-history-modal {
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

  .cover-history-content {
    position: relative;
    background: #FFFFFF;
    border-radius: 1.2rem;
    width: 70.2rem;
    padding: 1.8rem 0;
    display: flex;
    flex-direction: column;

    .cover-history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.8rem 1.8rem 2.4rem;
      border-bottom: 1px solid #F5F5F5;

      .cover-history-title {
        font-size: 1.6rem;
        font-weight: 500;
        color: #364153;
        text-align: left;
        margin: 0;
      }

      .close-btn {
        width: 2rem;
        height: 2rem;
        cursor: pointer;
      }
    }

    .cover-history-list {
      display: grid;
      grid-template-columns: repeat(3, 21rem);
      gap: 1.2rem;
      justify-content: center;
      max-height: 48rem;
      padding: 2rem 2.4rem;
      overflow-y: auto;

      .cover-history-item {
        width: 21rem;
        height: 28rem;
        border-radius: 0.6rem;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        border: 0.3rem solid transparent;

        &.active {
          border-color: #FB64B6;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .cover-history-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 20rem;
      font-size: 1.4rem;
      color: #99A1AF;
      padding: 0 3rem 4rem;
    }

    .cover-history-footer {
      padding: 1.8rem 3rem 0;
      border-top: 1px solid #F5F5F5;
      display: flex;
      justify-content: center;

      .confirm-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        background: #FB64B6;
        color: #ffffff;

        &:hover {
          position: relative;

          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  }
}
</style>
