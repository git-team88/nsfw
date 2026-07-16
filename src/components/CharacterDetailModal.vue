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
          <button class="cast-btn" @click="castCharacter('comic')">{{ t('characterLibrary.applyToComic') }}<span v-if="character?.isOfficial && character?.useCostPoints"> / {{ character.useCostPoints }} {{ t('aiRecharge.credits') }}</span></button>
          <button class="cast-btn" @click="castCharacter('drama')">{{ t('characterLibrary.applyToDrama') }}<span v-if="character?.isOfficial && character?.useCostPoints"> / {{ character.useCostPoints }} {{ t('aiRecharge.credits') }}</span></button>
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

function castCharacter(type: string) {
  if (props.character) {
    localStorage.setItem('castedCharacter', JSON.stringify({ ...props.character, castType: type }));
    router.push(`/${type}`);
  }
}
</script>

<style lang="scss" scoped>
$ink: #161122;
$paper: #FFFDF7;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;

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
  background-color: rgba(22,17,34,0.4);
}

.modal-content {
  position: relative;
  background-color: $paper;
  border: 3px solid $ink;
  border-radius: 16px;
  width: 800px;
  max-width: 95vw;
  max-height: 90vh;
  box-shadow: 8px 8px 0 $ink;
  animation: modalIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: none; }
}

.close-btn {
  position: absolute;
  right: 18px;
  top: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border: 2.5px solid $ink;
  border-radius: 999px;
  background: #fff;
  box-shadow: 2px 2px 0 $ink;
  padding: 6px;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }
}

.modal-body {
  display: flex;
  max-height: 85vh;
}

.left-section {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px 20px;
  background: linear-gradient(135deg, #FFC24B 0%, #FF7AAE 100%);
  border-radius: 16px 0 0 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%);
    pointer-events: none;
  }
}

.character-image-container {
  position: relative;
  width: 200px;
  height: 260px;
  border-radius: 16px;
  border: 3px solid $ink;
  background: #FFFFFF;
  box-shadow: 4px 4px 0 $ink;
  overflow: hidden;

  .character-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    border-radius: 0;
  }
}

.cast-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, $pink, #FF7A45);
  color: #FFFFFF;
  border: 2.5px solid $ink;
  border-radius: 14px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 $ink;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 $ink;
  }

  &:active {
    transform: translate(0, 0);
    box-shadow: 2px 2px 0 $ink;
  }

  span {
    margin-left: 6px;
    font-size: 12px;
  }
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow-y: auto;
  gap: 16px;
  padding: 28px 24px;
}

.character-name {
  font-size: 28px;
  font-weight: 800;
  color: $ink;
  margin: 0;
  letter-spacing: 0.02em;
}

.character-description {
  font-size: 14px;
  line-height: 22px;
  color: $muted;
  font-weight: 600;
  margin: 0;
}

.design-sheet {
  width: 100%;
  border: 2px solid $ink;
  border-radius: 12px;
  overflow: hidden;

  .design-sheet-image {
    width: 100%;
    height: auto;
  }
}

@media (max-width: 720px) {
  .modal-content {
    width: 95vw;
  }

  .modal-body {
    flex-direction: column;
    max-height: 85vh;
  }

  .left-section {
    flex: none;
    border-radius: 16px 16px 0 0;
    padding: 20px 16px;
  }

  .character-image-container {
    width: 160px;
    height: 210px;
  }

  .right-section {
    padding: 20px 16px;
  }

  .character-name {
    font-size: 22px;
  }
}
</style>