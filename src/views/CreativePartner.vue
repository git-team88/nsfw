<template>
  <div class="creative-partner">
    <Header ref="headerRef" :cur="-1"></Header>

    <!-- ===== Full-bleed Hero ===== -->
    <div class="hero">
      <div class="hero-deco deco-1"></div>
      <div class="hero-deco deco-2"></div>
      <div class="hero-deco deco-3"></div>
      <div class="hero-inner">
        <div class="hero-eyebrow">{{ t('creativePartner.heroEyebrow') }}</div>
        <h1 class="hero-title">
          {{ t('creativePartner.heroTitle1') }}<br />
          <span class="gradient-text">{{ t('creativePartner.heroTitle2') }}</span>
        </h1>
        <p class="hero-sub">
          {{ t('creativePartner.heroSub1') }}<br />
          {{ t('creativePartner.heroSub2') }}
        </p>
        <button class="cta-btn" @click="scrollToForm">
          {{ t('creativePartner.ctaButton') }} <span class="btn-arrow">→</span>
        </button>
      </div>
    </div>

    <!-- ===== Stats Bar ===== -->
    <div class="stats-bar">
      <div class="stat-item" v-for="(s, i) in stats" :key="i">
        <div class="stat-num">{{ s.num }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <div class="container">

      <!-- ===== Benefits ===== -->
      <section class="section benefits-section">
        <div class="section-eyebrow">BENEFITS</div>
        <h2 class="section-title">{{ t('creativePartner.benefitsTitle') }}</h2>
        <div class="benefits-grid">
          <div class="benefit-card" v-for="(b, i) in benefits" :key="i">
            <div class="benefit-icon-wrap">
              <!-- Rocket: 早期アクセス -->
              <svg v-if="i === 0" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb64b6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/>
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
              <!-- Tag: 20% OFF -->
              <svg v-if="i === 1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb64b6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                <path d="M7 7h.01"/>
              </svg>
              <!-- Headset: サポート -->
              <svg v-if="i === 2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb64b6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/>
                <path d="M21 16v2a4 4 0 0 1-4 4h-5"/>
              </svg>
              <!-- Megaphone: 先行情報 -->
              <svg v-if="i === 3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb64b6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 11 18-5v12L3 13v-2Z"/>
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
              </svg>
            </div>
            <h3 class="benefit-title">{{ b.title }}</h3>
            <p class="benefit-desc">{{ b.desc }}</p>
          </div>
        </div>
      </section>

      <!-- ===== Exchange (what we ask) ===== -->
      <section class="section exchange-section">
        <div class="section-eyebrow">WHAT WE ASK</div>
        <h2 class="section-title">{{ t('creativePartner.exchangeTitle') }}</h2>
        <p class="exchange-desc">
          {{ t('creativePartner.exchangeDesc1') }}<br />
          {{ t('creativePartner.exchangeDesc2') }}<code>#MoeGen</code> {{ t('creativePartner.exchangeHashtagNote') }}
        </p>
        <div class="sns-chips">
          <span class="chip">𝕏 Twitter</span>
          <span class="chip">Instagram</span>
          <span class="chip">TikTok</span>
          <span class="chip">YouTube</span>
        </div>
      </section>

      <!-- ===== Flow ===== -->
      <section class="section flow-section">
        <div class="section-eyebrow">HOW IT WORKS</div>
        <h2 class="section-title">{{ t('creativePartner.flowTitle') }}</h2>

        <div class="flow-track">
          <div class="flow-step" v-for="i in 6" :key="i" :class="{ final: i === 6 }">
            <div class="flow-node">
              <div class="flow-num">{{ i }}</div>
              <div class="flow-connector" v-if="i < 6"></div>
            </div>
            <div class="flow-body">
              <div class="flow-step-title">{{ t(`creativePartner.flowStep${i}Title`) }}</div>
              <div class="flow-step-desc">{{ t(`creativePartner.flowStep${i}Desc`) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Application Form ===== -->
      <section class="section form-section" id="apply-form" v-if="!isSubmitted">
        <div class="form-header">
          <div class="section-eyebrow">APPLY</div>
          <h2 class="section-title">{{ t('creativePartner.formTitle') }}</h2>
          <p class="form-subtitle">{{ t('creativePartner.formSubtitle') }}</p>
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
            <div class="form-item-title"><span>*</span>{{ t('creativePartner.snsLinks') }}</div>
            <div class="form-item">
              <textarea class="form-textarea" v-model="form.snsLinks"
                :placeholder="t('creativePartner.snsLinksPlaceholder')" rows="4" spellcheck="false"
                @blur="validateField('snsLinks')"></textarea>
            </div>
            <div class="form-error" v-if="errors.snsLinks">{{ errors.snsLinks }}</div>
          </div>

          <div class="form-item-box">
            <div class="form-item-title"><span>*</span>{{ t('creativePartner.message') }}</div>
            <div class="form-item">
              <textarea class="form-textarea message-textarea" v-model="form.message"
                :placeholder="t('creativePartner.messagePlaceholder')" rows="6" maxlength="1000" spellcheck="false"
                @blur="validateField('message')"></textarea>
            </div>
            <div class="form-meta">
              <div class="form-error" v-if="errors.message">{{ errors.message }}</div>
              <div class="char-counter" :class="{ warn: form.message.length >= 900 }">{{ form.message.length }}/1000</div>
            </div>
          </div>

          <div class="form-item-box">
            <div class="form-item-title">{{ t('creativePartner.portfolioUrl') }}</div>
            <div class="form-item">
              <input class="form-ipt" type="text" v-model="form.portfolioUrl"
                :placeholder="t('creativePartner.portfolioUrlPlaceholder')" spellcheck="false" />
            </div>
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
            <span>{{ t('creativePartner.submit') }}</span>
          </button>
        </form>
      </section>

      <!-- ===== Success ===== -->
      <div class="success-section" v-if="isSubmitted">
        <div class="success-icon">✓</div>
        <h2 class="success-title">{{ t('creativePartner.successTitle') }}</h2>
        <p class="success-message">{{ t('creativePartner.successMessage') }}</p>
        <button class="home-btn" @click="goHome">{{ t('creativePartner.backToHome') }}</button>
      </div>

    </div><!-- /container -->

    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="CreativePartner">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import { partnerApplyFormUrl, partnerApplyEntries } from "@/util/config";

const { t } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const isLoading = ref(false);
const isSubmitted = ref(false);

const stats = computed(() => [
  { num: t('creativePartner.stat1Num'), label: t('creativePartner.stat1Label') },
  { num: t('creativePartner.stat2Num'), label: t('creativePartner.stat2Label') },
  { num: t('creativePartner.stat3Num'), label: t('creativePartner.stat3Label') },
  { num: t('creativePartner.stat4Num'), label: t('creativePartner.stat4Label') },
]);

const benefits = computed(() => [
  { title: t('creativePartner.benefit1Title'), desc: t('creativePartner.benefit1Desc') },
  { title: t('creativePartner.benefit2Title'), desc: t('creativePartner.benefit2Desc') },
  { title: t('creativePartner.benefit3Title'), desc: t('creativePartner.benefit3Desc') },
  { title: t('creativePartner.benefit4Title'), desc: t('creativePartner.benefit4Desc') },
]);

const form = reactive({
  moegenId: '',
  snsLinks: '',
  message: '',
  portfolioUrl: '',
  email: ''
});

const errors = reactive({
  moegenId: '',
  snsLinks: '',
  message: '',
  email: ''
});

function validateField(field: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  switch (field) {
    case 'moegenId':
      errors.moegenId = form.moegenId.trim() ? '' : t('creativePartner.required'); break;
    case 'snsLinks':
      errors.snsLinks = form.snsLinks.trim() ? '' : t('creativePartner.required'); break;
    case 'message':
      if (!form.message.trim()) errors.message = t('creativePartner.required');
      else if (form.message.length > 1000) errors.message = t('creativePartner.messageTooLong');
      else errors.message = '';
      break;
    case 'email':
      if (!form.email.trim()) errors.email = t('creativePartner.required');
      else if (!emailRegex.test(form.email)) errors.email = t('creativePartner.invalidEmail');
      else errors.email = '';
      break;
  }
}

function validateAll(): boolean {
  validateField('moegenId'); validateField('snsLinks');
  validateField('message'); validateField('email');
  return !errors.moegenId && !errors.snsLinks && !errors.message && !errors.email;
}

async function handleSubmit() {
  if (!validateAll()) return;
  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append(partnerApplyEntries.moegenId, form.moegenId);
    formData.append(partnerApplyEntries.snsLinks, form.snsLinks);
    formData.append(partnerApplyEntries.message, form.message);
    formData.append(partnerApplyEntries.portfolioUrl, form.portfolioUrl);
    formData.append(partnerApplyEntries.email, form.email);
    await fetch(partnerApplyFormUrl, { method: 'POST', body: formData, mode: 'no-cors' });
    isSubmitted.value = true;
  } catch {
    toast(t('error'));
  } finally {
    isLoading.value = false;
  }
}

function scrollToForm() {
  document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' });
}

function goHome() {
  router.push('/');
}
</script>

<style lang="scss" scoped>
// ===========================
// Hero
// ===========================
.hero {
  position: relative;
  overflow: hidden;
  margin-top: 8rem;
  padding: 9rem 2rem 7rem;
  background: linear-gradient(135deg, #0d0d14 0%, #1a0d1f 40%, #160820 100%);
  text-align: center;

  .hero-deco {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .deco-1 {
    width: 40rem;
    height: 40rem;
    background: rgba(251, 100, 182, 0.25);
    top: -10rem;
    left: -10rem;
  }
  .deco-2 {
    width: 30rem;
    height: 30rem;
    background: rgba(130, 80, 255, 0.2);
    bottom: -8rem;
    right: -5rem;
  }
  .deco-3 {
    width: 20rem;
    height: 20rem;
    background: rgba(251, 100, 182, 0.15);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 72rem;
    margin: 0 auto;
  }

  .hero-eyebrow {
    display: inline-block;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.25rem;
    text-transform: uppercase;
    color: rgba(251, 100, 182, 0.9);
    border: 1px solid rgba(251, 100, 182, 0.35);
    padding: 0.5rem 1.6rem;
    border-radius: 10rem;
    margin-bottom: 2.8rem;
  }

  .hero-title {
    font-size: 5.2rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 2.4rem;
    letter-spacing: -0.02em;

    .gradient-text {
      background: linear-gradient(90deg, #fb64b6 0%, #c471ed 50%, #fb64b6 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
  }

  .hero-sub {
    font-size: 1.7rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 2.8rem;
    margin-bottom: 3.6rem;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1.4rem 4rem;
    background: linear-gradient(90deg, #fb64b6, #e84fa5);
    color: #fff;
    border: none;
    border-radius: 10rem;
    font-size: 1.8rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(251, 100, 182, 0.45);
    transition: all 0.25s;
    letter-spacing: 0.02em;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(251, 100, 182, 0.6);
    }

    .btn-arrow {
      font-size: 2rem;
      line-height: 1;
      transition: transform 0.2s;
    }
    &:hover .btn-arrow {
      transform: translateX(4px);
    }
  }
}

@keyframes shimmer {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}

// ===========================
// Stats Bar
// ===========================
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: #101828;
  padding: 2.4rem 4rem;

  .stat-item {
    flex: 1;
    text-align: center;
    padding: 0 2rem;
    border-right: 1px solid rgba(255, 255, 255, 0.1);

    &:last-child { border-right: none; }

    .stat-num {
      font-size: 2.4rem;
      font-weight: 800;
      color: #fb64b6;
      line-height: 1.2;
      margin-bottom: 0.4rem;
    }
    .stat-label {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.05rem;
    }
  }
}

// ===========================
// Container & shared
// ===========================
.container {
  width: 85.6rem;
  margin: 0 auto;
  padding-bottom: 6rem;
}

.section {
  padding: 7rem 0;
  border-bottom: 1px solid #F0F0F0;

  &:last-child { border-bottom: none; }
}

.section-eyebrow {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.2rem;
  color: #fb64b6;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
}

.section-title {
  font-size: 2.8rem;
  font-weight: 700;
  color: #101828;
  line-height: 1.3;
  margin-bottom: 4rem;
  text-align: center;

  &.left { text-align: left; }
}

// ===========================
// Benefits
// ===========================
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2.4rem;

  .benefit-card {
    padding: 3.6rem 3.2rem;
    background: #FAFAFA;
    border: 1px solid #EFEFEF;
    border-radius: 1.6rem;
    border-top: 3px solid #fb64b6;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 32px rgba(251, 100, 182, 0.1);
    }

    .benefit-icon-wrap {
      width: 5.6rem;
      height: 5.6rem;
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border-radius: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;

      svg {
        display: block;
      }
    }

    .benefit-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #101828;
      margin-bottom: 1.2rem;
    }

    .benefit-desc {
      font-size: 1.4rem;
      color: #6A7282;
      line-height: 2.4rem;
    }
  }
}

// ===========================
// Exchange Section
// ===========================
.exchange-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .exchange-desc {
    font-size: 1.5rem;
    color: #364153;
    line-height: 2.6rem;
    margin-bottom: 2.4rem;

    code {
      background: rgba(251, 100, 182, 0.1);
      color: #fb64b6;
      padding: 0.2rem 0.6rem;
      border-radius: 0.4rem;
      font-size: 1.4rem;
      font-family: inherit;
    }
  }

  .sns-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;

    .chip {
      padding: 0.6rem 1.6rem;
      background: #F5F5F5;
      border-radius: 10rem;
      font-size: 1.3rem;
      color: #364153;
      font-weight: 500;
    }
  }
}

// ===========================
// Flow Section
// ===========================
.flow-track {
  display: flex;
  flex-direction: column;
  gap: 0;

  .flow-step {
    display: flex;
    gap: 2.4rem;
    align-items: flex-start;

    .flow-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;

      .flow-num {
        width: 4.4rem;
        height: 4.4rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #fb64b6, #e84fa5);
        color: #fff;
        font-size: 1.6rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(251, 100, 182, 0.35);
        z-index: 1;
      }

      .flow-connector {
        width: 2px;
        flex: 1;
        min-height: 3.2rem;
        background: linear-gradient(180deg, #fb64b6 0%, rgba(251,100,182,0.15) 100%);
        margin: 0.4rem 0;
      }
    }

    .flow-body {
      padding: 0.8rem 0 3.2rem;

      .flow-step-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fb64b6;
        letter-spacing: 0.1rem;
        text-transform: uppercase;
        margin-bottom: 0.4rem;
      }

      .flow-step-desc {
        font-size: 1.5rem;
        color: #364153;
        line-height: 2.4rem;
      }
    }

    &.final {
      .flow-num {
        background: linear-gradient(135deg, #fb64b6, #c471ed);
        box-shadow: 0 4px 20px rgba(251, 100, 182, 0.5);
        width: 5rem;
        height: 5rem;
        font-size: 1.8rem;
      }
      .flow-step-desc {
        font-weight: 600;
        color: #101828;
      }
    }
  }
}

// ===========================
// Form Section
// ===========================
.form-section {
  .form-header {
    text-align: center;
    margin-bottom: 4rem;

    .section-title { margin-bottom: 0.8rem; }

    .form-subtitle {
      font-size: 1.4rem;
      color: #6A7282;
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
        background: #FAFAFA;
        color: #101828;
        border: 1.5px solid #EFEFEF;
        transition: border-color 0.2s;

        &::placeholder { color: #99A1AF; }
        &:hover, &:focus { border-color: #fb64b6; outline: none; }
      }

      .form-textarea {
        width: 100%;
        padding: 1.4rem 1.6rem;
        font-size: 1.4rem;
        border-radius: 1rem;
        background: #FAFAFA;
        color: #101828;
        border: 1.5px solid #EFEFEF;
        resize: vertical;
        font-family: inherit;
        transition: border-color 0.2s;

        &::placeholder { color: #99A1AF; }
        &:hover, &:focus { border-color: #fb64b6; outline: none; }
      }

      .message-textarea { min-height: 12rem; }
    }

    .form-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.4rem;
    }

    .form-error {
      margin-top: 0.4rem;
      font-size: 1.2rem;
      color: #fa2d47;
    }

    .char-counter {
      font-size: 1.2rem;
      color: #99A1AF;
      margin-left: auto;
      &.warn { color: #fb64b6; }
    }
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28rem;
    height: 5.2rem;
    margin: 3.6rem auto 0;
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
  padding: 8rem 2rem;

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
    max-width: 56rem;
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
    padding: 6rem 2rem 5rem;

    .hero-title {
      font-size: 3.2rem;
    }

    .hero-sub {
      font-size: 1.4rem;
      line-height: 2.4rem;
    }

    .cta-btn {
      padding: 1.2rem 3rem;
      font-size: 1.6rem;
    }
  }

  .stats-bar {
    flex-wrap: wrap;
    padding: 2rem;

    .stat-item {
      flex: 0 0 50%;
      padding: 1rem 0;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      &:nth-child(odd) { border-right: 1px solid rgba(255, 255, 255, 0.08); }
      &:nth-child(n+3) { border-bottom: none; }

      .stat-num { font-size: 2rem; }
      .stat-label { font-size: 1.1rem; }
    }
  }

  .container {
    width: 100%;
    padding: 0 2rem 4rem;
  }

  .section {
    padding: 5rem 0;
  }

  .section-title {
    font-size: 2.2rem;
    margin-bottom: 3rem;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
    gap: 1.6rem;

    .benefit-card {
      padding: 2.8rem 2.4rem;
    }
  }

  .exchange-section {
    .exchange-desc {
      font-size: 1.4rem;
      line-height: 2.4rem;
    }
  }

  .flow-track .flow-step {
    gap: 1.6rem;

    .flow-body {
      padding: 0.6rem 0 2.4rem;

      .flow-step-desc {
        font-size: 1.4rem;
      }
    }
  }

  .form-section {
    .submit-btn {
      width: 100%;
    }
  }

  .success-section {
    padding: 5rem 1rem;

    .success-title { font-size: 2.2rem; }
    .success-message { font-size: 1.4rem; }
    .home-btn { min-width: 18rem; }
  }
}
</style>
