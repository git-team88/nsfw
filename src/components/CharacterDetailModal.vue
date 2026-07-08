<template>
  <div class="character-detail-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <img
        class="close-btn"
        src="@/assets/images/base/close.png"
        alt=""
        @click="closeModal"
      />

      <div class="modal-body">
        <!-- Left Side: Character Image with Background and Button -->
        <div class="left-section">
          <div class="character-image-container">
            <img :src="processImageUrl(character?.image)" :alt="character?.name" class="character-image" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
          </div>
          <button class="cast-btn" @click="castCharacter">{{ t('characterLibrary.castBtn') }}<span v-if="character?.isOfficial && character?.useCostPoints"> / {{ character.useCostPoints }} {{ t('aiRecharge.credits') }}</span></button>
        </div>

        <!-- Right Side: Character Info and Design Sheet -->
        <div class="right-section">
          <h3 class="character-name">{{ character?.name }}</h3>
          <p class="character-description">{{ character?.description }}</p>
          <div class="design-sheet" v-if="character?.tri_image">
            <img :src="processImageUrl(character?.tri_image)" alt="" class="design-sheet-image" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="CharacterDetailModal">
import { useI18n } from 'vue-i18n';
import router from '@/router';
import { processImageUrl } from '@/util/utils';
import defaultAvatar from '@/assets/images/base/avatar.png';

const props = defineProps<{
  visible: boolean;
  character: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'cast', character: any): void;
}>();

const { t, locale } = useI18n();

function closeModal() {
  emit('close');
}

function castCharacter() {
  if (props.character) {
    // 将角色对象存在缓存中
    localStorage.setItem('castedCharacter', JSON.stringify(props.character));
    // 跳转到首页
    router.push('/');
  }
}
</script>

<style lang="scss" scoped>
.character-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
}

.modal-content {
  position: relative;
  background-color: #ffffff;
  border-radius: 1.2rem;
  width: 98rem;
}

.close-btn {
  position: absolute;
  right: 1.8rem;
  top: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-body {
  display: flex;
}

.left-section {
  flex: 0 0 37.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.4rem;
  padding: 3.6rem;
  border-radius: 1.2rem;
  background: url('@/assets/images/project/bg.png') no-repeat;
  background-size: 100% 100%;
}

.character-image-container {
  position: relative;
  width: 30rem;
  height: 40rem;

  .character-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.8rem;
  }
}

.cast-btn {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  align-content: center;
  justify-content: center;
  width: 100%;
  height: 5.6rem;
  background: #FB64B6;
  color: #FFFFFF;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  cursor: pointer;

  &:hover {
    position: relative;

    &::after{
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  span {
    margin-left: 0.6rem;
    font-size: 1.2rem;
  }
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;
  gap: 2rem;
  padding: 2.4rem;
}

.character-name {
  font-size: 3.2rem;
  font-weight: 500;
  color: #364153;
  margin: 0;
}

.character-description {
  font-size: 1.4rem;
  line-height: 2rem;
  color: #6A7282;
  margin: 0;
}

.design-sheet {
  width: 100%;

  .design-sheet-image {
    width: 100%;
    height: auto;
    border-radius: 0.8rem;
  }
}
</style>