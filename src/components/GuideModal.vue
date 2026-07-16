<template>
  <div v-if="visible" class="guide-modal-overlay" @click="handleOverlayClick">
    <div class="guide-modal" @click.stop>
      <div class="guide-content">
        <!-- Step 1 -->
        <div v-if="currentStep == 1" class="guide-one">
          <img
            :src="getGuideImage('step_one')"
            alt=""
            class="guide-image"
          />

          <div class="guide-actions">
            <span class="next-btn" @click="handleNext"></span>
            <span class="skip-btn" @click="handleSkip"></span>
          </div>
        </div>

        <!-- Step 2 -->
        <div v-else-if="currentStep == 2" class="guide-two">
          <img
            :src="getGuideImage('step_two')"
            alt=""
            class="guide-image"
          />

          <div class="guide-actions">
            <span class="next-btn" @click="handleNext"></span>
            <span class="skip-btn" @click="handleSkip"></span>
          </div>
        </div>

        <!-- Step 3 (right-aligned) -->
        <div v-else-if="currentStep == 3" class="guide-three">
          <img
            :src="getGuideImage('step_three')"
            alt=""
            class="guide-image"
          />

          <div class="guide-actions">
            <span class="next-btn" @click="handleNext"></span>
            <span class="skip-btn" @click="handleSkip"></span>
          </div>
        </div>

        <!-- Step 4 (right-aligned) -->
        <div v-else-if="currentStep == 4" class="guide-four">
          <img
            :src="getGuideImage('step_four')"
            alt=""
            class="guide-image"
          />

          <div class="guide-next" @click="handleNext"></div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

// Import all guide images statically
import stepOneZh from '@/assets/images/guide/step_one_zh.png';
import stepOneEn from '@/assets/images/guide/step_one_en.png';
import stepOneJp from '@/assets/images/guide/step_one_jp.png';

import stepTwoZh from '@/assets/images/guide/step_two_zh.png';
import stepTwoEn from '@/assets/images/guide/step_two_en.png';
import stepTwoJp from '@/assets/images/guide/step_two_jp.png';

import stepThreeZh from '@/assets/images/guide/step_three_zh.png';
import stepThreeEn from '@/assets/images/guide/step_three_en.png';
import stepThreeJp from '@/assets/images/guide/step_three_jp.png';

import stepFourZh from '@/assets/images/guide/step_four_zh.png';
import stepFourEn from '@/assets/images/guide/step_four_en.png';
import stepFourJp from '@/assets/images/guide/step_four_jp.png';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const { t, locale } = useI18n();

const currentStep = ref(1);
const totalSteps = 4;

const guideImages: Record<string, Record<string, string>> = {
  step_one: { zh: stepOneZh, en: stepOneEn, jp: stepOneJp },
  step_two: { zh: stepTwoZh, en: stepTwoEn, jp: stepTwoJp },
  step_three: { zh: stepThreeZh, en: stepThreeEn, jp: stepThreeJp },
  step_four: { zh: stepFourZh, en: stepFourEn, jp: stepFourJp }
};

const getGuideImage = (step: string) => {
  const images = guideImages[step];
  const currentLocale = locale.value;
  if (images && images[currentLocale]) {
    return images[currentLocale];
  }
  return stepOneZh;
};

onMounted(() => {
  currentStep.value = 1;
});

const handleNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    handleSkip();
  }
};

const handleSkip = () => {
  emit('close');
};

const handleOverlayClick = () => {
  handleSkip();
};
</script>

<style scoped lang="scss">
.guide-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(22, 17, 34, 0.4);
  z-index: 500;
}

.guide-modal {
  position: relative;
}

.guide-content {
  position: relative;
  width: 1392px;
  height: 100%;
  margin: 0 auto;
}

.guide-one{
  position: absolute;
  width: 1080px;
  height: 420px;
  top: 260px;
  left: 50%;
  transform: translateX(-50%);
}

.guide-two{
  position: absolute;
  width: 272px;
  height: 250px;
  top: 35px;
  left: 190px;
}

.guide-three{
  position: absolute;
  width: 272px;
  height: 240px;
  top: 40px;
  right: -14px;
}

.guide-four{
  position: absolute;
  width: 320px;
  height: 250px;
  top: 90px;
  right: 20px;

  .guide-next{
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    width: 140px;
    height: 40px;
    cursor: pointer;
    z-index: 520;
  }
}

.guide-image{
  width: 100%;
  height: 100%;
}

.guide-actions {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  z-index: 510;
}

.skip-btn {
  width: 140px;
  height: 40px;
  cursor: pointer;
}

.next-btn {
  width: 140px;
  height: 40px;
  cursor: pointer;
}
</style>