<template>
  <div class="creative-partner-pricing">
    <Header ref="headerRef" :cur="-1"></Header>

    <!-- ===== Hero ===== -->
    <div class="hero">
      <div class="hero-deco deco-1"></div>
      <div class="hero-deco deco-2"></div>
      <div class="hero-inner">
        <div class="hero-eyebrow">{{ t('creativePartner.heroEyebrow') }}</div>
        <div class="hero-discount-badge">
          <span class="badge-off">{{ t('creativePartner.pricingBadgeOff') }}</span>
          <span class="badge-text">{{ t('creativePartner.pricingBadgeText') }}</span>
        </div>
        <h1 class="hero-title">{{ t('creativePartner.pricingTitle') }}</h1>
        <p class="hero-sub">{{ t('creativePartner.pricingHeroSub') }}</p>
      </div>
    </div>

    <div class="container">

      <!-- ===== Tab Switcher ===== -->
      <div class="plan-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'subscription' }" @click="activeTab = 'subscription'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
          {{ t('creativePartner.tabSubscription') }}
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'pack' }" @click="activeTab = 'pack'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m7.5 4.27 9 5.15"/>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
          {{ t('creativePartner.tabComputePack') }}
        </button>
      </div>

      <!-- ===== Subscription Plans ===== -->
      <div class="plan-grid" v-if="activeTab === 'subscription'">
        <div
          v-for="plan in subscriptionPlans"
          :key="plan.plan_id"
          class="plan-card"
          :class="{ active: selectedPlan === plan.plan_id, recommended: plan.plan_id === 4 }"
          @click="selectPlan(plan.plan_id)"
        >
          <div class="recommended-tag" v-if="plan.plan_id === 4">{{ t('creativePartner.recommendedTag') }}</div>
          <div class="discount-ribbon">{{ t('creativePartner.discountRibbon') }}</div>
          <div class="plan-name">{{ t(`aiRecharge.${plan.title}`) }}</div>
          <div class="plan-pricing">
            <span class="original">{{ plan.price }}{{ t('aiRecharge.unit') }}</span>
            <div class="discounted">
              <span class="price">{{ getDiscountPrice(plan.price) }}</span>
              <span class="unit">{{ t('aiRecharge.unit') }}{{ plan.period ? t(`aiRecharge.${plan.period}`) : '' }}</span>
            </div>
            <div class="savings-badge">{{ getSavings(plan.price) }}{{ t('aiRecharge.unit') }} {{ t('creativePartner.savingsSuffix') }}</div>
          </div>
          <div class="plan-divider"></div>
          <div class="plan-credits-row">
            <span class="credits-value">{{ plan.credits }}</span>
            <span class="credits-label">{{ t('aiRecharge.compute') }}</span>
          </div>
          <div class="plan-valid-row">{{ t(`aiRecharge.${plan.valid}`) }}</div>
          <div class="plan-select-indicator">
            <div class="indicator-dot"></div>
          </div>
        </div>
      </div>

      <!-- ===== Compute Packs ===== -->
      <div class="plan-grid" v-if="activeTab === 'pack'">
        <div
          v-for="plan in packPlans"
          :key="plan.plan_id"
          class="plan-card"
          :class="{ active: selectedPlan === plan.plan_id, recommended: plan.plan_id === 7 }"
          @click="selectPlan(plan.plan_id)"
        >
          <div class="recommended-tag" v-if="plan.plan_id === 7">{{ t('creativePartner.recommendedTag') }}</div>
          <div class="discount-ribbon">{{ t('creativePartner.discountRibbon') }}</div>
          <div class="plan-name">{{ plan.price }}{{ t('aiRecharge.unit') }} {{ t('creativePartner.packSuffix') }}</div>
          <div class="plan-pricing">
            <span class="original">{{ plan.price }}{{ t('aiRecharge.unit') }}</span>
            <div class="discounted">
              <span class="price">{{ getDiscountPrice(plan.price) }}</span>
              <span class="unit">{{ t('aiRecharge.unit') }}</span>
            </div>
            <div class="savings-badge">{{ getSavings(plan.price) }}{{ t('aiRecharge.unit') }} {{ t('creativePartner.savingsSuffix') }}</div>
          </div>
          <div class="plan-divider"></div>
          <div class="plan-credits-row">
            <span class="credits-value">{{ plan.credits }}</span>
            <span class="credits-label">{{ t('aiRecharge.compute') }}</span>
          </div>
          <div class="plan-valid-row">{{ t(`aiRecharge.${plan.valid}`) }}</div>
          <div class="plan-select-indicator">
            <div class="indicator-dot"></div>
          </div>
        </div>
      </div>

      <!-- ===== Links ===== -->
      <div class="links-row">
        <span @click="goToComputingPowerRules">{{ t('aiRecharge.computingPowerRules') }} →</span>
        <span @click="goToPointsDetails">{{ t('aiRecharge.pointsDetails') }} →</span>
      </div>

      <!-- ===== Checkout ===== -->
      <div class="checkout-box">
        <div class="agreements">
          <div class="checkbox" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span>
            {{ t("subscribe.agree") }}
            <a href="#" @click.prevent="openLink">{{ t("subscribe.paymentTerms") }}</a>
          </span>
        </div>
        <button class="pay-btn" :disabled="!agreeTerms || isLoading" :class="{ loading: isLoading }" @click="handleRecharge">
          <span>{{ t('aiRecharge.subscribeNow') }}</span>
        </button>
      </div>

    </div>

    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="CreativePartnerPricing">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";

const { t, locale } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const DISCOUNT = 0.8;
const activeTab = ref<'subscription' | 'pack'>('subscription');

const allPlans = [
  { plan_id: 1, title: 'monthlyAutoRenew',      price: '1000', period: 'periodMonth',  credits: "980",    valid: 'valid6Months' },
  { plan_id: 2, title: 'quarterlyAutoRenewal',   price: '2000', period: 'period3Month', credits: "3,000",  valid: 'valid6Months' },
  { plan_id: 3, title: 'semiAnnualAutoRenewal',  price: '4000', period: 'period6Month', credits: "6,300",  valid: 'valid6Months' },
  { plan_id: 4, title: 'annualAutoRenewal',       price: '8000', period: 'periodYear',   credits: "13,200", valid: 'valid12Months' },
  { plan_id: 5, title: 'computePack', price: '1000', period: '', credits: "950",    valid: 'valid6Months' },
  { plan_id: 6, title: 'computePack', price: '2000', period: '', credits: "2,800",  valid: 'valid6Months' },
  { plan_id: 7, title: 'computePack', price: '4000', period: '', credits: "6,500",  valid: 'valid6Months' },
  { plan_id: 8, title: 'computePack', price: '8000', period: '', credits: "13,000", valid: 'valid6Months' },
];

const subscriptionPlans = allPlans.slice(0, 4);
const packPlans = allPlans.slice(4);

const selectedPlan = ref(1);
const agreeTerms = ref(true);
const isLoading = ref(false);

// onMounted(() => {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     router.push('/login');
//   }
// });

function getDiscountPrice(price: string): string {
  return Math.floor(parseInt(price) * DISCOUNT).toString();
}

function getSavings(price: string): string {
  return (parseInt(price) - Math.floor(parseInt(price) * DISCOUNT)).toString();
}

function selectPlan(planId: number) {
  selectedPlan.value = planId;
}

async function handleRecharge() {
  if (!agreeTerms.value) return;
  isLoading.value = true;
  try {
    const response = await api.AIRechargePartner({ plan_id: selectedPlan.value, is_partner: true });
    const data = response as any;
    if (data.code === 0 || data.code === 200) {
      if (data.data) window.open(data.data?.url.url, '_blank');
    } else {
      toast(locale.value == 'jp' ? data.msg_jp : data.msg);
    }
  } catch {
    toast(t('error'));
  } finally {
    isLoading.value = false;
  }
}

function goToPointsDetails() { router.push('/ai-points-details'); }
function openLink() { localStorage.setItem("isBack", "1"); window.open("/payment-terms", "_blank"); }
function goToComputingPowerRules() { localStorage.setItem("isBack", "1"); window.open("/computing-rules", "_blank"); }
</script>

<style lang="scss" scoped>
.creative-partner-pricing {
  width: 100%;
  background: #FFFFFF;
  padding-bottom: 6rem;
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
    width: 36rem;
    height: 36rem;
    background: rgba(251, 100, 182, 0.2);
    top: -12rem;
    left: -8rem;
  }
  .deco-2 {
    width: 24rem;
    height: 24rem;
    background: rgba(130, 80, 255, 0.15);
    bottom: -8rem;
    right: -4rem;
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 64rem;
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
    margin-bottom: 2.4rem;
  }

  .hero-discount-badge {
    display: inline-flex;
    align-items: center;
    gap: 1.2rem;
    padding: 0.8rem 2.8rem;
    background: linear-gradient(90deg, rgba(251, 100, 182, 0.2), rgba(196, 113, 237, 0.2));
    border: 1px solid rgba(251, 100, 182, 0.4);
    border-radius: 10rem;
    margin-bottom: 2.4rem;

    .badge-off {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fb64b6;
      letter-spacing: 0.1rem;
      text-shadow: 0 0 20px rgba(251, 100, 182, 0.6);
    }

    .badge-text {
      font-size: 1.3rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .hero-title {
    font-size: 3.2rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 1.4rem;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .hero-sub {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 2.4rem;
  }
}

// ===========================
// Container
// ===========================
.container {
  width: 85.6rem;
  margin: 0 auto;
  padding-top: 4rem;
}

// ===========================
// Tabs
// ===========================
.plan-tabs {
  display: flex;
  gap: 0;
  background: #F5F5F5;
  border-radius: 1.2rem;
  padding: 0.5rem;
  width: fit-content;
  margin: 0 auto 3.6rem;

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1.1rem 3.2rem;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: #6A7282;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;

    svg { opacity: 0.5; transition: opacity 0.2s; }

    &.active {
      background: #ffffff;
      color: #101828;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      font-weight: 600;

      svg { opacity: 1; stroke: #fb64b6; }
    }
  }
}

// ===========================
// Plan Cards Grid
// ===========================
.plan-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.6rem;
  margin-bottom: 2rem;
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.6rem 2rem;
  background: #FAFAFA;
  border: 2px solid #EFEFEF;
  border-radius: 1.6rem;
  cursor: pointer;
  transition: all 0.25s;
  text-align: center;

  &:hover {
    border-color: rgba(251, 100, 182, 0.4);
    box-shadow: 0 8px 28px rgba(251, 100, 182, 0.1);
    transform: translateY(-3px);
  }

  &.active {
    border-color: #fb64b6;
    background: #fff;
    box-shadow: 0 8px 32px rgba(251, 100, 182, 0.15);

    .indicator-dot {
      background: #fb64b6;
      border-color: #fb64b6;
      box-shadow: 0 0 0 3px rgba(251, 100, 182, 0.2);
    }
  }

  &.recommended {
    border-color: #fb64b6;
    background: #fff;
  }

  .recommended-tag {
    position: absolute;
    top: -1.2rem;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #fb64b6, #e84fa5);
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    padding: 0.3rem 1.4rem;
    border-radius: 10rem;
    white-space: nowrap;
    letter-spacing: 0.05rem;
  }

  .discount-ribbon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: linear-gradient(135deg, #ff3b9a, #fb64b6);
    color: #fff;
    font-size: 1rem;
    font-weight: 800;
    padding: 0.25rem 0.8rem;
    border-radius: 0.5rem;
    letter-spacing: 0.05rem;
    box-shadow: 0 2px 8px rgba(251, 100, 182, 0.4);
  }

  .plan-name {
    font-size: 1.3rem;
    font-weight: 600;
    color: #364153;
    margin-bottom: 1.6rem;
  }

  .plan-pricing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.8rem;

    .original {
      font-size: 1.2rem;
      color: #B0B8C4;
      text-decoration: line-through;
    }

    .discounted {
      display: flex;
      align-items: baseline;
      gap: 0.3rem;

      .price {
        font-size: 2.8rem;
        font-weight: 700;
        color: #fb64b6;
        line-height: 1;
      }

      .unit {
        font-size: 1.3rem;
        color: #6A7282;
      }
    }

    .savings-badge {
      display: inline-block;
      background: #fff0f8;
      color: #e84fa5;
      font-size: 1.1rem;
      font-weight: 700;
      padding: 0.25rem 1rem;
      border-radius: 10rem;
      border: 1px solid rgba(251, 100, 182, 0.3);
      margin-top: 0.2rem;
    }
  }

  .plan-divider {
    width: 100%;
    height: 1px;
    background: #EFEFEF;
    margin: 1.2rem 0;
  }

  .plan-credits-row {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: 0.6rem;

    .credits-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #101828;
    }

    .credits-label {
      font-size: 1.2rem;
      color: #99A1AF;
    }
  }

  .plan-valid-row {
    font-size: 1.1rem;
    color: #B0B8C4;
    margin-bottom: 1.6rem;
  }

  .plan-select-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: auto;

    .indicator-dot {
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 50%;
      border: 2px solid #D0D5DD;
      background: transparent;
      transition: all 0.2s;
    }
  }
}

// ===========================
// Links
// ===========================
.links-row {
  display: flex;
  justify-content: flex-end;
  gap: 2.4rem;
  margin-bottom: 3.2rem;

  span {
    font-size: 1.3rem;
    color: #99A1AF;
    cursor: pointer;
    transition: color 0.2s;

    &:hover { color: #fb64b6; }
  }
}

// ===========================
// Checkout
// ===========================
.checkout-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3.6rem;
  background: #FAFAFA;
  border-radius: 2rem;
  border: 1px solid #EFEFEF;

  .agreements {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.4rem;
    color: #99A1AF;

    .checkbox {
      width: 2.4rem;
      height: 2.4rem;
      cursor: pointer;
      flex-shrink: 0;

      img { width: 100%; height: 100%; }
    }

    a {
      color: #fb64b6;
      text-decoration: none;
      margin-left: 0.2rem;
    }
  }

  .pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34rem;
    height: 5.6rem;
    background: linear-gradient(90deg, #fb64b6, #e84fa5);
    color: #ffffff;
    border: none;
    border-radius: 10rem;
    font-size: 1.8rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(251, 100, 182, 0.4);
    transition: all 0.25s;
    letter-spacing: 0.02rem;

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

    &.loading span::before {
      content: '';
      display: inline-block;
      width: 1.6rem;
      height: 1.6rem;
      margin-right: 0.8rem;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }

    span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ===========================
// Mobile
// ===========================
@media screen and (max-width: 768px) {
  .hero {
    padding: 5rem 2rem 4rem;

    .hero-title {
      font-size: 2.4rem;
    }

    .hero-sub {
      font-size: 1.3rem;
    }

    .hero-discount-badge {
      padding: 0.6rem 2rem;
      gap: 0.8rem;

      .badge-off { font-size: 1.8rem; }
      .badge-text { font-size: 1.2rem; }
    }
  }

  .container {
    width: 100%;
    padding: 3rem 1.6rem 0;
  }

  .plan-tabs {
    margin-bottom: 2.4rem;

    .tab-btn {
      padding: 0.9rem 2rem;
      font-size: 1.3rem;
      gap: 0.5rem;

      svg { width: 14px; height: 14px; }
    }
  }

  .plan-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
  }

  .plan-card {
    padding: 2.4rem 1.2rem 1.8rem;

    .discount-ribbon {
      font-size: 0.9rem;
      padding: 0.2rem 0.6rem;
      top: 0.8rem;
      right: 0.8rem;
    }

    .plan-name {
      font-size: 1.1rem;
      margin-bottom: 1.2rem;
    }

    .plan-pricing {
      .original { font-size: 1.1rem; }

      .discounted .price { font-size: 2.2rem; }
      .discounted .unit { font-size: 1.1rem; }

      .savings-badge {
        font-size: 1rem;
        padding: 0.2rem 0.8rem;
      }
    }

    .plan-credits-row {
      .credits-value { font-size: 1.5rem; }
      .credits-label { font-size: 1.1rem; }
    }

    .plan-valid-row { font-size: 1rem; }
  }

  .links-row {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2.4rem;
  }

  .checkout-box {
    padding: 2.4rem 2rem;
    border-radius: 1.6rem;

    .agreements {
      font-size: 1.2rem;
      text-align: left;
    }

    .pay-btn {
      width: 100%;
      height: 5.2rem;
      font-size: 1.6rem;
    }
  }
}
</style>
