<template>
  <div class="creative-partner-review">
    <Header ref="headerRef" :cur="-1"></Header>

    <!-- ===== Hero ===== -->
    <div class="hero">
      <div class="hero-deco deco-1"></div>
      <div class="hero-deco deco-2"></div>
      <div class="hero-inner">
        <div class="hero-eyebrow">{{ t('creativePartner.heroEyebrow') }}</div>
        <h1 class="hero-title">{{ t('creativePartner.reviewHeroTitle') }}</h1>
        <p class="hero-sub">{{ t('creativePartner.reviewHeroSub') }}</p>
      </div>
    </div>

    <!-- ===== Progress ===== -->
    <div class="progress-bar">
      <div class="progress-inner">
        <div class="progress-step" v-for="s in steps" :key="s.num" :class="{ done: s.num <= 4, current: s.num === 5, future: s.num === 6 }">
          <div class="step-dot">
            <svg v-if="s.num <= 4" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span v-else>{{ s.num }}</span>
          </div>
          <div class="step-label">{{ s.label }}</div>
          <div class="step-line" v-if="s.num < 6"></div>
        </div>
      </div>
    </div>

    <div class="container">

      <!-- ===== Form ===== -->
      <div class="form-card" v-if="!isSubmitted">
        <div class="form-header">
          <div class="form-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb64b6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h2 class="form-title">{{ t('creativePartner.reviewFormTitle') }}</h2>
          <p class="form-subtitle">{{ t('creativePartner.reviewSubtitle') }}</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-item-box">
            <div class="form-item-title"><span>*</span>{{ t('creativePartner.moegenId') }}</div>
            <div class="form-item">
              <input class="form-ipt" type="text" v-model="form.moegenId"
                :placeholder="t('creativePartner.moegenIdPlaceholder')" spellcheck="false"
                @blur="validateField('moegenId')" />
            </div>
            <div class="form-error" v-if="errors.moegenId">{{ errors.moegenId }}</div>
          </div>

          <div class="form-item-box">
            <div class="form-item-title"><span>*</span>{{ t('creativePartner.workUrls') }}</div>
            <div class="form-item">
              <textarea class="form-textarea" v-model="form.workUrls"
                :placeholder="t('creativePartner.workUrlsPlaceholder')" rows="5" spellcheck="false"
                @blur="validateField('workUrls')"></textarea>
            </div>
            <div class="form-error" v-if="errors.workUrls">{{ errors.workUrls }}</div>
          </div>

          <div class="form-item-box">
            <div class="form-item-title"><span>*</span>{{ t('creativePartner.email') }}</div>
            <div class="form-item">
              <input class="form-ipt" type="email" v-model="form.email"
                :placeholder="t('creativePartner.emailPlaceholder')" spellcheck="false"
                @blur="validateField('email')" />
            </div>
            <div class="form-error" v-if="errors.email">{{ errors.email }}</div>
          </div>

          <button class="submit-btn" type="submit" :disabled="isLoading">
            <span>{{ t('creativePartner.reviewSubmit') }}</span>
          </button>
        </form>
      </div>

      <!-- ===== Success ===== -->
      <div class="success-section" v-if="isSubmitted">
        <div class="success-icon">✓</div>
        <h2 class="success-title">{{ t('creativePartner.reviewSuccessTitle') }}</h2>
        <p class="success-message">{{ t('creativePartner.reviewSuccessMessage') }}</p>
        <button class="home-btn" @click="goHome">{{ t('creativePartner.backToHome') }}</button>
      </div>

    </div>

    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="CreativePartnerReview">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import { partnerReviewFormUrl, partnerReviewEntries } from "@/util/config";

const { t } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const isLoading = ref(false);
const isSubmitted = ref(false);

const steps = computed(() => [
  { num: 1, label: t('creativePartner.stepRegister') },
  { num: 2, label: t('creativePartner.step1stApply') },
  { num: 3, label: t('creativePartner.step1stReview') },
  { num: 4, label: t('creativePartner.stepPostWork') },
  { num: 5, label: t('creativePartner.step2ndApply') },
  { num: 6, label: t('creativePartner.stepAccepted') },
]);

const form = reactive({
  moegenId: '',
  workUrls: '',
  email: ''
});

const errors = reactive({
  moegenId: '',
  workUrls: '',
  email: ''
});

function validateField(field: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  switch (field) {
    case 'moegenId':
      errors.moegenId = form.moegenId.trim() ? '' : t('creativePartner.required'); break;
    case 'workUrls':
      errors.workUrls = form.workUrls.trim() ? '' : t('creativePartner.required'); break;
    case 'email':
      if (!form.email.trim()) errors.email = t('creativePartner.required');
      else if (!emailRegex.test(form.email)) errors.email = t('creativePartner.invalidEmail');
      else errors.email = '';
      break;
  }
}

function validateAll(): boolean {
  validateField('moegenId'); validateField('workUrls'); validateField('email');
  return !errors.moegenId && !errors.workUrls && !errors.email;
}

async function handleSubmit() {
  if (!validateAll()) return;
  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append(partnerReviewEntries.moegenId, form.moegenId);
    formData.append(partnerReviewEntries.workUrls, form.workUrls);
    formData.append(partnerReviewEntries.email, form.email);
    await fetch(partnerReviewFormUrl, { method: 'POST', body: formData, mode: 'no-cors' });
    isSubmitted.value = true;
  } catch {
    toast(t('error'));
  } finally {
    isLoading.value = false;
  }
}

function goHome() { router.push('/'); }
</script>

<style lang="scss" scoped>
.creative-partner-review {
  width: 100%;
  background: #FFFFFF;
}

// ===========================
// Hero
// ===========================
.hero {
  position: relative;
  overflow: hidden;
  margin-top: 8rem;
  padding: 6rem 2rem 5rem;
  background: linear-gradient(135deg, #0d0d14 0%, #1a0d1f 40%, #160820 100%);
  text-align: center;

  .hero-deco {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .deco-1 {
    width: 30rem;
    height: 30rem;
    background: rgba(251, 100, 182, 0.2);
    top: -8rem;
    right: -5rem;
  }
  .deco-2 {
    width: 20rem;
    height: 20rem;
    background: rgba(130, 80, 255, 0.15);
    bottom: -6rem;
    left: -4rem;
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 60rem;
    margin: 0 auto;
  }

  .hero-eyebrow {
    display: inline-block;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.25rem;
    text-transform: uppercase;
    color: rgba(251, 100, 182, 0.9);
    border: 1px solid rgba(251, 100, 182, 0.35);
    padding: 0.4rem 1.4rem;
    border-radius: 10rem;
    margin-bottom: 2rem;
  }

  .hero-title {
    font-size: 3.6rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 1.6rem;
    letter-spacing: -0.02em;
  }

  .hero-sub {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 2.4rem;
  }
}

// ===========================
// Progress Bar
// ===========================
.progress-bar {
  background: #101828;
  padding: 2.4rem 2rem;
}

.progress-inner {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  max-width: 72rem;
  margin: 0 auto;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;

  .step-dot {
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    position: relative;
    z-index: 1;
    transition: all 0.2s;
  }

  .step-label {
    font-size: 1.1rem;
    margin-top: 0.8rem;
    white-space: nowrap;
    transition: color 0.2s;
  }

  .step-line {
    position: absolute;
    top: 1.8rem;
    left: calc(50% + 1.8rem);
    right: calc(-50% + 1.8rem);
    height: 2px;
    z-index: 0;
  }

  // States
  &.done {
    .step-dot {
      background: linear-gradient(135deg, #fb64b6, #e84fa5);
      box-shadow: 0 2px 10px rgba(251, 100, 182, 0.4);
    }
    .step-label { color: rgba(255, 255, 255, 0.7); }
    .step-line { background: #fb64b6; }
  }

  &.current {
    .step-dot {
      background: linear-gradient(135deg, #fb64b6, #c471ed);
      box-shadow: 0 0 0 4px rgba(251, 100, 182, 0.25), 0 4px 16px rgba(251, 100, 182, 0.5);
      width: 4rem;
      height: 4rem;
      margin-top: -0.2rem;
      font-size: 1.4rem;
    }
    .step-label { color: #fb64b6; font-weight: 600; }
    .step-line { background: linear-gradient(90deg, #fb64b6, rgba(255,255,255,0.15)); }
  }

  &.future {
    .step-dot {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .step-label { color: rgba(255, 255, 255, 0.3); }
  }
}

// ===========================
// Container
// ===========================
.container {
  width: 60rem;
  margin: 0 auto;
  padding: 5rem 0 6rem;
}

// ===========================
// Form Card
// ===========================
.form-card {
  background: #FAFAFA;
  border: 1px solid #EFEFEF;
  border-radius: 2rem;
  padding: 4.8rem 4rem;

  .form-header {
    text-align: center;
    margin-bottom: 4rem;

    .form-icon-wrap {
      width: 6rem;
      height: 6rem;
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border-radius: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
    }

    .form-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #101828;
      margin-bottom: 0.8rem;
    }

    .form-subtitle {
      font-size: 1.4rem;
      color: #6A7282;
      line-height: 2.2rem;
    }
  }

  .form-item-box {
    margin: 0 0 2rem;

    .form-item-title {
      font-size: 1.4rem;
      color: #364153;
      font-weight: 500;
      margin-bottom: 0.6rem;

      span { color: #fa2d47; }
    }

    .form-item {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      margin: 0.4rem 0 0;

      .form-ipt {
        width: 100%;
        height: 4.8rem;
        padding: 1rem 1.6rem;
        font-size: 1.4rem;
        border-radius: 1rem;
        background: #FFFFFF;
        color: #101828;
        border: 1.5px solid #E5E7EB;
        transition: border-color 0.2s, box-shadow 0.2s;

        &::placeholder { color: #99A1AF; }
        &:hover { border-color: #D0D5DD; }
        &:focus { border-color: #fb64b6; box-shadow: 0 0 0 3px rgba(251, 100, 182, 0.1); outline: none; }
      }

      .form-textarea {
        width: 100%;
        padding: 1.4rem 1.6rem;
        font-size: 1.4rem;
        border-radius: 1rem;
        background: #FFFFFF;
        color: #101828;
        border: 1.5px solid #E5E7EB;
        resize: vertical;
        font-family: inherit;
        transition: border-color 0.2s, box-shadow 0.2s;

        &::placeholder { color: #99A1AF; }
        &:hover { border-color: #D0D5DD; }
        &:focus { border-color: #fb64b6; box-shadow: 0 0 0 3px rgba(251, 100, 182, 0.1); outline: none; }
      }
    }

    .form-error {
      margin-top: 0.4rem;
      font-size: 1.2rem;
      color: #fa2d47;
    }
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 5.2rem;
    margin-top: 3.2rem;
    background: linear-gradient(90deg, #fb64b6, #e84fa5);
    color: #fff;
    border: none;
    border-radius: 10rem;
    font-size: 1.7rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(251, 100, 182, 0.4);
    transition: all 0.25s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 32px rgba(251, 100, 182, 0.55);
    }

    &:disabled {
      background: linear-gradient(90deg, rgba(251,100,182,0.4), rgba(232,79,165,0.4));
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
  }
}

// ===========================
// Success
// ===========================
.success-section {
  text-align: center;
  padding: 6rem 2rem;

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 7.2rem;
    height: 7.2rem;
    margin: 0 auto 2.8rem;
    background: linear-gradient(135deg, #fb64b6, #e84fa5);
    color: #fff;
    border-radius: 50%;
    font-size: 3.2rem;
    box-shadow: 0 8px 32px rgba(251, 100, 182, 0.4);
  }

  .success-title {
    font-size: 2.8rem;
    font-weight: 700;
    color: #101828;
    margin-bottom: 1.4rem;
  }

  .success-message {
    font-size: 1.6rem;
    color: #6A7282;
    line-height: 2.6rem;
    max-width: 48rem;
    margin: 0 auto;
  }

  .home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22rem;
    height: 5.2rem;
    margin-top: 3.6rem;
    background: linear-gradient(90deg, #fb64b6, #e84fa5);
    color: #fff;
    border: none;
    border-radius: 10rem;
    font-size: 1.6rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(251, 100, 182, 0.4);
    transition: all 0.25s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 32px rgba(251, 100, 182, 0.55);
    }
  }
}

// ===========================
// Mobile
// ===========================
@media screen and (max-width: 768px) {
  .hero {
    padding: 5rem 2rem 4rem;

    .hero-title {
      font-size: 2.6rem;
    }

    .hero-sub {
      font-size: 1.3rem;
    }
  }

  .progress-bar {
    padding: 2rem 1rem;
    overflow-x: auto;
  }

  .progress-inner {
    min-width: 48rem;
  }

  .progress-step {
    .step-dot {
      width: 3rem;
      height: 3rem;
      font-size: 1.1rem;
    }

    .step-label {
      font-size: 1rem;
    }

    .step-line {
      top: 1.5rem;
      left: calc(50% + 1.5rem);
      right: calc(-50% + 1.5rem);
    }

    &.current .step-dot {
      width: 3.4rem;
      height: 3.4rem;
      margin-top: -0.2rem;
      font-size: 1.2rem;
    }
  }

  .container {
    width: 100%;
    padding: 3rem 2rem 4rem;
  }

  .form-card {
    padding: 3.2rem 2rem;
    border-radius: 1.6rem;

    .form-header {
      margin-bottom: 3rem;

      .form-title { font-size: 1.8rem; }
      .form-subtitle { font-size: 1.3rem; }
    }

    .submit-btn {
      width: 100%;
    }
  }

  .success-section {
    padding: 4rem 1rem;

    .success-title { font-size: 2.2rem; }
    .success-message { font-size: 1.4rem; }
    .home-btn { min-width: 18rem; }
  }
}
</style>
