<template>
  <div class="ai-recharge">
    <Header ref="headerRef" :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="content-box">
        <h1 class="page-title">{{ t('aiRecharge.title') }}</h1>

        <div class="tab-box">
          <div class="tab-group">
            <div
              class="tab-item"
              :class="{ active: activeTab === 'subscription' }"
              @click="switchTab('subscription')"
            >
              {{ t('aiRecharge.subscriptionTab') }}
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'credits_pack' }"
              @click="switchTab('credits_pack')"
            >
              {{ t('aiRecharge.creditsPackTab') }}
            </div>
          </div>

          <div class="rules-links">
            <span @click="goToComputingPowerRules">{{ t('aiRecharge.computingPowerRules') }} →</span>
            <span @click="goToPointsDetails">{{ t('aiRecharge.pointsDetails') }} →</span>
          </div>
        </div>

        <div class="recharge-plan-section">

          <div v-if="activeTab == 'subscription' && hasFirstMonthDiscount" class="first-month-off-banner">
            <span class="banner-highlight">{{ t('aiRecharge.firstMonth30OffPrefix') }}</span>{{ t('aiRecharge.firstMonth30OffSuffix') }}
          </div>

          <div v-if="activeTab == 'credits_pack'" class="credits-pack-tip">
            {{ t('aiRecharge.creditsPackTip') }}
          </div>

          <div v-if="isLoading && rechargePlans.length === 0" class="list-loading">
            <div class="list-loading-spinner"></div>
            <div class="list-loading-text">{{ t('loading') }}</div>
          </div>

          <div v-else class="plan-grid">
            <div
              v-for="(plan, index) in rechargePlans"
              :key="plan.plan_id"
              class="plan-card"
              @click="selectPlan(plan.plan_id)"
            >
              <div v-if="index == 0 && isUserNew && promotionTitle" class="zero-plan-badge">{{ promotionTitle }}</div>

              <img v-if="selectedPlan != plan.plan_id" class="plan-bg" src="@/assets/images/recharge/bg.png" alt="" />

              <div class="plan-card-inner" :class="{ active: selectedPlan == plan.plan_id, 'discount-card': activeTab == 'subscription' && hasFirstMonthDiscount, 'credits-card': activeTab == 'credits_pack' }">
                <span class="plan-mode" v-if="getPlanTitle(plan) !== t('aiRecharge.unknownPlan')">{{ getPlanTitle(plan) }}</span>

                <div v-if="activeTab == 'subscription' && hasFirstMonthDiscount" class="plan-price-section">
                  <div class="plan-discount-price">
                    <span class="price-num">{{ formatPrice(getFirstMonthPrice(plan)) }}</span>
                    <span class="price-unit">{{ t('aiRecharge.unit') }}{{ getBillingPeriodText(plan.billing_period || '1') }}</span>
                  </div>
                  <div class="plan-original-price">{{ formatPrice(plan.price) }}{{ t('aiRecharge.unit') }}</div>
                  <div class="plan-price-desc">
                    <span class="desc-highlight">{{ t('aiRecharge.firstMonth30Off') }}，</span><br>
                    <span class="desc-then">{{ t('aiRecharge.firstMonth30OffThenPrice', { price: formatPrice(plan.price), unit: t('aiRecharge.unit') }) }}。</span>
                  </div>
                </div>

                <div v-else class="plan-price-section">
                  <div class="plan-price-value">
                    <span class="price-num">{{ formatPrice(plan.price) }}</span>
                    <span class="price-unit">{{ t('aiRecharge.unit') }}{{ activeTab == 'credits_pack' ? '' : getBillingPeriodText(plan.billing_period || '1') }}</span>
                  </div>
                  <div v-if="activeTab === 'credits_pack' && plan.original_price" class="plan-strikethrough-price">
                    <span>{{ formatPrice(plan.original_price) }}{{ t('aiRecharge.unit') }}</span>
                  </div>
                </div>

                <div class="plan-credits-box">
                  <div class="plan-credits-main">
                    <span class="credits-label">{{ t('aiRecharge.includes') }}</span>
                    <span class="credits-value">{{ formatCredits(plan.credits) }}</span>
                    <span class="credits-label"> {{ t('aiRecharge.compute') }}</span>
                  </div>
                  <div class="plan-credits-bonus" v-if="plan.bonus_credits && plan.bonus_credits !== '0' && activeTab === 'subscription'">
                    <span class="bonus-includes">{{ t('aiRecharge.bonusGift') }}</span>
                    <span class="bonus-value">{{ formatCredits(plan.bonus_credits) }} {{ t('aiRecharge.compute') }}</span>
                  </div>
                  <div class="plan-credits-valid" v-if="activeTab === 'credits_pack'">{{ t('aiRecharge.permanentValid') }}</div>
                  <div class="plan-credits-valid" v-else>{{ getValidityText(plan.expiry_months) }}</div>
                </div>

                <div v-if="activeTab == 'subscription'" class="plan-estimated-output">
                  <div class="estimated-title">{{ t('aiRecharge.estimatedOutput') }}</div>
                  <div class="estimated-list">
                    <div class="estimated-item" v-if="plan.estimated_novel_chapters !== '0'">{{ t('aiRecharge.novelLabel') }}<span class="estimated-num">{{ plan.estimated_novel_chapters }}</span>{{ t('aiRecharge.novelUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_comic_episodes !== '0'">{{ t('aiRecharge.comicLabel') }}<span class="estimated-num">{{ plan.estimated_comic_episodes }}</span>{{ t('aiRecharge.comicUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_short_drama_episodes !== '0'">{{ t('aiRecharge.mangaLabel') }}<span class="estimated-num">{{ plan.estimated_short_drama_episodes }}</span>{{ t('aiRecharge.mangaUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_images !== '0'">{{ t('aiRecharge.imageLabel') }}<span class="estimated-num">{{ plan.estimated_images }}</span>{{ t('aiRecharge.imageUnitSuffix') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_video !== '0'">{{ t('aiRecharge.videoLabel') }}<span class="estimated-num">{{ plan.estimated_video }}</span>{{ t('aiRecharge.videoUnitSuffix') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isUserNew && promotionContent" class="zero-plan-rules">
          <img src="@/assets/images/home/arrow.png" alt="" />
          <div class="rules-content" v-html="promotionContent"></div>
        </div>

        <div v-if="rechargePlans.length > 0" class="bottom-bar">
          <div class="bottom-block">
            <div class="block-label">{{ t('aiRecharge.originalPrice') }}</div>
            <div class="block-value"><span class="price-num">{{ formatPrice(planOriginalPrice.toString()) }}</span><span class="price-unit">{{ t('aiRecharge.yen') }}</span></div>
          </div>

          <div v-if="activeTab !== 'subscription' || !hasFirstMonthDiscount" class="bottom-bar-divider"></div>

          <div v-if="activeTab !== 'subscription' || !hasFirstMonthDiscount" class="bottom-block">
            <div class="block-label">
              {{ t('aiRecharge.coupon') }}
              <div class="coupon-info-icon">
                <img src="@/assets/images/user/notice.png" alt="Info" />
                <div class="coupon-tooltip">
                  {{ t('aiRecharge.couponInfo') }}
                </div>
              </div>
            </div>
            <div class="block-value" v-if="couponCode">
              <button class="cancel-coupon-btn" @click="cancelCoupon">{{ t('aiRecharge.cancelCoupon') }}</button>
              <span class="discount-amount">-<span class="price-num">{{ formatPrice(discountAmount.toString()) }}</span><span class="price-unit">{{ t('aiRecharge.yen') }}</span></span>
            </div>
            <div class="block-value" v-else>
              <span class="coupon-link" @click="goToCoupon">{{ t('aiRecharge.addCoupon') }}></span>
            </div>
          </div>

          <div class="bottom-bar-divider"></div>

          <div class="bottom-block">
            <div class="block-label">{{ t('aiRecharge.actualAmount') }}</div>
            <div class="block-value total-value"><span class="price-num">{{ formatPrice(discountedPrice.toString()) }}</span><span class="price-unit">{{ t('aiRecharge.yen') }}</span></div>
          </div>

          <div class="bottom-bar-divider"></div>

          <div class="bottom-block bottom-block-btn">
            <div class="agreements">
              <div class="check-item">
                <div class="checkbox" @click="agreeTerms = !agreeTerms">
                  <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
                  <img v-else src="@/assets/images/register/check.png" alt="" />
                </div>
                <span>
                  {{ t("subscribe.agree") }}
                  <a>{{ t("subscribe.paymentTerms") }}</a>
                </span>
              </div>
            </div>
            <button class="pay-btn" :disabled="isPaying" :class="{ loading: isPaying }" @click="handleRecharge">
              <span>{{ t('aiRecharge.subscribeNow') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <UploadMask :visible="isPaying" :text="t('loading')" />

    <CouponModal
      :visible="showCouponModal"
      @close="handleCouponClose"
      @confirm="handleCouponConfirm"
    />
  </div>
</template>

<script setup lang="ts" name="AIRecharge">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import CouponModal from "@/components/CouponModal.vue";
import { ref, watch, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";

const { t, locale } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

interface RechargePlan {
  plan_id: number | string;
  info: Array<{
    language: string;
    name: string;
    promotion_title?: string;
    promotion_content?: string;
  }>;
  price: string;
  period: string;
  credits: string;
  expiry_months?: number;
  billing_period?: string;
  bonus_credits?: string;
  discount_desc?: any[];
  discount_price?: string;
  original_price?: string;
  estimated_novel_chapters?: string;
  estimated_comic_episodes?: string;
  estimated_short_drama_episodes?: string;
  estimated_images?: string;
  estimated_video?: string;
}

const rechargePlans = ref<RechargePlan[]>([]);
const selectedPlan = ref<number | string>(0);
const agreeTerms = ref(true);
const isLoading = ref(false);
const isPaying = ref(false);
const showCouponModal = ref(false);
const couponCode = ref('');
const couponInfo = ref<{ code: string; type: string; discount_value: string; } | null>(null);
const isUserNew = ref(false);
const promotionTitle = ref('');
const promotionContent = ref('');
const activeTab = ref('subscription');
const hasFirstMonthDiscount = ref(false);

const tabModeMap: Record<string, string> = {
  subscription: 'subscription',
  credits_pack: 'payment',
};

const planOriginalPrice = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return 0;
  return parseFloat(plan.price);
});

const originalPrice = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return 0;
  if (activeTab.value == 'subscription' && hasFirstMonthDiscount.value) {
    return getFirstMonthPrice(plan);
  }
  return parseFloat(plan.price);
});

const discountAmount = computed(() => {
  const price = originalPrice.value;
  if (!couponInfo.value) return 0;

  const { type, discount_value } = couponInfo.value;
  const discountValue = parseInt(discount_value);

  if (type == '1') {
    return discountValue;
  } else if (type == '2') {
    return Math.round(price * (1 - discountValue / 100));
  }

  return 0;
});

const discountedPrice = computed(() => {
  const price = originalPrice.value;
  return Math.max(0, price - discountAmount.value);
});

const currentBillingPeriod = computed(() => {
  if (activeTab.value !== 'subscription') return '';
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return '';
  return getBillingPeriodText(plan.billing_period || '1');
});

watch(locale, (newLang) => {
  if (isUserNew.value && rechargePlans.value.length > 0) {
    const firstPlan = rechargePlans.value[0];
    if (firstPlan.info && Array.isArray(firstPlan.info)) {
      const currentLang = newLang == 'zh' ? 'cn' : newLang;

      const infoItem = firstPlan.info.find((item: any) => item.language == currentLang);
      if (infoItem) {
        promotionTitle.value = infoItem.promotion_title || '';
        promotionContent.value = infoItem.promotion_content || '';
      }
    }
  }
});

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  await checkFirstMonthDiscount();
  getList();
});

async function checkFirstMonthDiscount() {
  try {
    const res = await api.getFirstMonthDiscountStatus() as any;
    if (res.code == 0) {
      const isFirstMonth = res.data?.is_first_month;
      hasFirstMonthDiscount.value = isFirstMonth == 1;
      if (isFirstMonth == 0) {
        await checkRechargeUser();
      }
    }
  } catch (error) {
    console.error('Error checking first month discount:', error);
  }
}

async function checkRechargeUser() {
  try {
    const response = await api.checkRechargeUser({});
    const res = response.data;

    let userData = null;
    if (res.code !== undefined) {
      if (res.code == 0) {
        userData = res.data;
      }
    } else {
      userData = res;
    }

    if (userData) {
      isUserNew.value = userData.is_user_new || false;
    }
  } catch (error) {
    console.error('Error checking recharge user:', error);
  }
}

function getList() {
  isLoading.value = true;
  const mode = tabModeMap[activeTab.value] || activeTab.value;
  api.aIRechargePlan(mode).then((res: any) => {
    if (res.code == 0) {
      if (res.data && Array.isArray(res.data)) {
        rechargePlans.value = res.data.map((plan: any) => {
          return {
            plan_id: plan.plan_id || plan.id || Math.random(),
            info: plan.info || [],
            price: plan.price || '0',
            period: plan.period || '',
            credits: plan.credits || '0',
            expiry_months: plan.expiry_months,
            billing_period: plan.billing_period,
            bonus_credits: plan.bonus_credits,
            discount_desc: plan.discount_desc || [],
            discount_price: plan.discount_price || '0',
            original_price: plan.original_price || '',
            estimated_novel_chapters: plan.estimated_novel_chapters || '0',
            estimated_comic_episodes: plan.estimated_comic_episodes || '0',
            estimated_short_drama_episodes: plan.estimated_short_drama_episodes || '0',
            estimated_images: plan.estimated_images || '0',
            estimated_video: plan.estimated_video || '0'
          };
        });
        if (rechargePlans.value.length > 0) {
          selectedPlan.value = rechargePlans.value[0].plan_id;

          if (isUserNew.value) {
            const firstPlan = rechargePlans.value[0];
            if (firstPlan.info && Array.isArray(firstPlan.info)) {
              const currentLang = locale.value == 'zh' ? 'cn' : locale.value;
              const infoItem = firstPlan.info.find((item: any) => item.language == currentLang);
              if (infoItem) {
                promotionTitle.value = infoItem.promotion_title || '';
                promotionContent.value = infoItem.promotion_content || '';
              }
            }
          }
        }
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  }).catch((error) => {
    console.error('Error fetching recharge plans:', error);
    toast(t('error'));
  }).finally(() => {
    isLoading.value = false;
  });
}

function switchTab(tab: string) {
  activeTab.value = tab;
  selectedPlan.value = 0;
  couponCode.value = '';
  couponInfo.value = null;
  rechargePlans.value = [];
  getList();
}

function selectPlan(planId: number | string) {
  selectedPlan.value = planId;
  if (couponCode.value) {
    couponCode.value = '';
    couponInfo.value = null;
  }
}

function getFirstMonthPrice(plan: RechargePlan): number {
  if (plan.discount_price) {
    return parseInt(plan.discount_price) || 0;
  }
  const price = parseFloat(plan.price);
  const discount = (plan.discount_desc && plan.discount_desc[0]) || 30;
  return Math.round(price * (1 - discount / 100));
}

function formatCredits(credits: string | undefined): string {
  if (!credits) return '0';
  const num = parseInt(credits);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function handleRecharge() {
  if (!agreeTerms.value) {
    toast(t('subscribe.agreeFirst'));
    return;
  }
  isPaying.value = true;
  try {
    if (!selectedPlan.value) {
      return false;
    }

    const params: any = {
      plan_id: selectedPlan.value,
      promo_code: couponCode.value
    };

    const response = await api.AIRecharge(params);

    const data = response as any;
    if (data.code == 0 || data.code == 200) {
      if (data.data) {
        window.location.href = data.data?.url.url;
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t('error'));
  } finally {
    isPaying.value = false;
  }
}

function goToPointsDetails() {
  router.push('/ai-points-details');
}

function goBack() {
  router.back();
}

function getPlanTitle(plan: any) {
  if (plan.info && Array.isArray(plan.info)) {
    const currentLang = locale.value || 'zh';
    const infoItem = plan.info.find((item: any) => item.language === currentLang);
    if (infoItem && infoItem.name) {
      return infoItem.name;
    } else if (plan.info.length > 0) {
      return plan.info[0].name || t('aiRecharge.unknownPlan');
    }
  }
  return t('aiRecharge.unknownPlan');
}

function getBillingPeriodText(billingPeriod: String) {
  switch (billingPeriod) {
    case '1':
      return t('aiRecharge.periodMonth');
    case '3':
      return t('aiRecharge.period3Month');
    case '6':
      return t('aiRecharge.period6Month');
    case '12':
      return t('aiRecharge.periodYear');
    default:
      return t('aiRecharge.periodMonth');
  }
}

function getValidityText(expiryMonths: number | undefined) {
  if (expiryMonths) {
    return t('aiRecharge.validityPeriod', { months: expiryMonths });
  }
  return t('aiRecharge.permanentValid');
}

function formatPrice(price: string | number): string {
  const cleanPrice = String(price).replace(/[^0-9.]/g, '');
  const parts = cleanPrice.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function openLink() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}

function goToComputingPowerRules() {
  localStorage.setItem("isBack", "1");
  window.open("/computing-rules", "_blank");
}

function goToCoupon() {
  showCouponModal.value = true;
}

function handleCouponClose() {
  showCouponModal.value = false;
}

function handleCouponConfirm(info: any) {
  couponCode.value = info.code;
  couponInfo.value = info;
  showCouponModal.value = false;
}

function cancelCoupon() {
  couponCode.value = '';
  couponInfo.value = null;
}
</script>

<style lang="scss" scoped>
$ink: #161122;
$paper: #FFFDF7;
$cream: #FFFBF4;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;
$line: #e7e1d8;
$yellow: #FFD23F;
$green: #22A06B;

.ai-recharge {
  width: 100%;
  background: $cream;
}

.container {
  max-width: 1160px;
  margin: 14rem auto 2rem;
  padding: 0 1.2rem;
  position: relative;

  @media (min-width: 768px) {
    padding: 0 1.6rem;
  }

  .back {
    position: absolute;
    top: 0;
    left: 1.2rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;

    @media (min-width: 768px) {
      left: 1.6rem;
    }

    img {
      width: 4rem;
      height: 4rem;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    font-size: 3rem;
    font-weight: 800;
    color: $ink;
    margin-bottom: 2rem;
    letter-spacing: 0.01em;
  }

  .tab-box {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;

    .tab-group {
      display: flex;
      background: #fff;
      border: 2.5px solid $ink;
      border-radius: 1.4rem;
      padding: 5px;
    }

    .tab-item {
      display: flex;
      align-items: center;
      height: 3.6rem;
      font-size: 1.45rem;
      font-weight: 800;
      color: $ink;
      cursor: pointer;
      padding: 0 2rem;
      border-radius: 1rem;
      transition: background-color 0.16s, color 0.16s;
      background: transparent;

      &.active {
        background: $ink;
        color: #fff;
      }

      &:hover:not(.active) {
        background: $paper;
      }
    }

    .rules-links {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      gap: 1rem;

      span {
        font-weight: 700;
        font-size: 1.3rem;
        color: $muted;
        cursor: pointer;
        transition: color 0.16s;

        &:hover {
          color: $pink;
        }
      }
    }
  }

  .first-month-off-banner {
    font-size: 1.6rem;
    color: $ink;
    margin: 1rem 0 0;
    text-align: center;
    font-weight: 700;

    .banner-highlight {
      font-weight: 800;
      color: $pink;
    }
  }

  .credits-pack-tip {
    font-size: 1.4rem;
    color: $muted;
    font-weight: 600;
    margin-top: 1rem;
    text-align: center;
  }

  .list-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 0;

    .list-loading-spinner {
      width: 4rem;
      height: 4rem;
      border: 0.4rem solid $line;
      border-top: 0.4rem solid $ink;
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1.6rem;
    }

    .list-loading-text {
      font-size: 1.4rem;
      color: $muted;
      font-weight: 600;
    }
  }

  .recharge-plan-section {
    margin: 0 0 3rem;

    .plan-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.6rem;
      margin-top: 2.4rem;
      animation: chUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.26s backwards;

      @media (max-width: 720px) {
        grid-template-columns: 1fr;
      }

      .plan-card {
        position: relative;

        .plan-bg {
          position: absolute;
          right: 0;
          top: 0;
          width: 12rem;
          pointer-events: none;
          z-index: 10;
        }

        .plan-card-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 3px solid $ink;
          border-radius: 1.6rem;
          box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
          font-size: 1.4rem;
          color: $muted;
          cursor: pointer;
          padding: 2.4rem 2rem;
          z-index: 5;
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          animation: chPlanIn 0.6s cubic-bezier(0.16,1,0.3,1) var(--d, 0ms) backwards;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 7px 9px 0 rgba(22,17,34,0.18);
          }

          &.discount-card {
            background: #FFF3D6;
          }

          &.credits-card {
            height: auto;
          }

          &.active {
            background: #FFF3D6;
            border-color: $ink;
            box-shadow: 4px 4px 0 $ink;

            &:hover {
              box-shadow: 7px 9px 0 $ink;
            }

            .plan-credits-box {
              background: rgba(255,77,141,0.12);
            }
          }

          .plan-mode {
            font-size: 1.4rem;
            font-weight: 800;
            color: $muted;
            margin-bottom: 2rem;
            text-align: left;
          }

          .plan-price-section {
            margin-bottom: 1.2rem;

            .plan-discount-price {
              display: flex;
              align-items: baseline;
              margin-bottom: 0.4rem;

              .price-num {
                font-size: 2.8rem;
                font-weight: 800;
                color: $ink;
              }

              .price-unit {
                font-size: 1.5rem;
                color: $sub;
                margin-left: 0.4rem;
              }
            }

            .plan-original-price {
              font-size: 1.2rem;
              color: $muted;
              text-decoration: line-through;
              margin-bottom: 1rem;
            }

            .plan-price-desc {
              font-size: 1.2rem;
              line-height: 1.6rem;

              .desc-highlight {
                color: $pink;
                font-weight: 800;
              }

              .desc-then {
                color: $muted;
                font-weight: 600;
              }
            }

            .plan-price-value {
              display: flex;
              align-items: baseline;

              .price-num {
                font-size: 2.8rem;
                font-weight: 800;
                color: $ink;
              }

              .price-unit {
                font-size: 1.5rem;
                color: $sub;
                margin-left: 0.4rem;
              }
            }

            .plan-strikethrough-price {
              font-size: 1.4rem;
              color: $muted;
              text-decoration: line-through;
              margin-top: 0.4rem;
            }
          }

          .plan-credits-box {
            width: 100%;
            background: #F7F7F8;
            border-radius: 1.2rem;
            padding: 1.2rem;
            display: flex;
            flex-direction: column;

            .plan-credits-main {
              font-size: 1.4rem;
              color: $sub;
              margin-bottom: 0.6rem;

              .credits-value {
                margin: 0 0.4rem;
                color: $ink;
                font-weight: 800;
              }
            }

            .plan-credits-bonus {
              font-size: 1.4rem;
              color: $sub;
              margin-bottom: 0.6rem;

              .bonus-includes {
                margin-right: 0.4rem;
                color: $pink;
                font-weight: 800;
              }

              .bonus-value {
                color: $sub;
              }
            }

            .plan-credits-valid {
              font-size: 1.4rem;
              color: $sub;
            }
          }

          .plan-estimated-output {
            margin-top: 1.6rem;

            .estimated-title {
              font-size: 1.4rem;
              font-weight: 800;
              color: $ink;
              margin-bottom: 0.8rem;
            }

            .estimated-list {
              .estimated-item {
                font-size: 1.4rem;
                line-height: 2rem;
                color: $muted;
                margin-bottom: 0.6rem;

                &:last-child {
                  margin-bottom: 0;
                }

                .estimated-num {
                  margin: 0 0.2rem;
                  color: $pink;
                  font-weight: 800;
                }
              }
            }
          }
        }

        .zero-plan-badge {
          position: absolute;
          top: -2.6rem;
          left: 0;
          right: 0;
          height: 4rem;
          border-radius: 1.2rem 1.2rem 0 0;
          background: $pink;
          color: #ffffff;
          font-weight: 800;
          font-size: 1.2rem;
          padding-top: 0.6rem;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 2px solid $ink;
          box-shadow: 2px 2px 0 $ink;
          animation: chChip 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s backwards;
        }
      }
    }
  }

  .bottom-bar {
    display: flex;
    align-items: stretch;
    margin-top: 3rem;
    background: $paper;
    border: 3px solid $ink;
    border-radius: 2.4rem;
    box-shadow: 6px 6px 0 rgba(22,17,34,0.14);
    padding: 2.4rem 0;
    animation: chPanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;

    @media (max-width: 720px) {
      flex-direction: column;
      padding: 2rem;
      border-radius: 1.6rem;
    }

    .bottom-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: 0 2rem;

      @media (max-width: 720px) {
        padding: 1rem 0;
        align-items: center;
      }

      &.bottom-block-btn {
        align-items: center;
      }

      .block-label {
        font-size: 1.4rem;
        font-weight: 800;
        color: $ink;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;

        @media (max-width: 720px) {
          margin-bottom: 1rem;
        }

        .coupon-info-icon {
          position: relative;
          margin-left: 0.6rem;
          cursor: pointer;

          img {
            width: 1.6rem;
            height: 1.6rem;
          }

          .coupon-tooltip {
            display: none;
            position: absolute;
            left: 2rem;
            top: -1rem;
            max-width: 28rem;
            width: max-content;
            padding: 1rem 1.6rem;
            background: #FFFFFF;
            border: 2px solid $ink;
            box-shadow: 3px 3px 0 $ink;
            color: $muted;
            font-size: 1.2rem;
            font-weight: 600;
            border-radius: 1rem;
            z-index: 100;
          }

          &:hover .coupon-tooltip {
            display: block;
          }
        }
      }

      .block-value {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;

        .price-num {
          font-size: 2rem;
          font-weight: 800;
          color: $ink;
        }

        .price-unit {
          font-size: 1.5rem;
          color: $sub;
        }

        &.total-value {
          .price-num {
            font-size: 2.4rem;
            color: $pink;
          }
        }
      }

      .coupon-link {
        color: $pink;
        font-weight: 800;
        font-size: 1.4rem;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .discount-amount {
        font-size: 1.4rem;
        color: $ink;
        font-weight: 800;
      }

      .cancel-coupon-btn {
        min-width: 8rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 800;
        color: $muted;
        border: 2px solid $line;
        background: none;
        cursor: pointer;
        padding: 0.4rem 1rem;
        border-radius: 1rem;
        transition: background-color 0.2s;

        &:hover {
          background-color: $line;
        }
      }

      &.bottom-block-btn {
        .agreements {
          margin-bottom: 2rem;
        }
      }
    }

    .bottom-bar-divider {
      width: 1px;
      background: $line;
      align-self: stretch;

      @media (max-width: 720px) {
        width: 100%;
        height: 1px;
      }
    }
  }

  .agreements {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;

    .check-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.3rem;
      font-weight: 700;
      color: $muted;
      cursor: pointer;

      .checkbox {
        width: 2.2rem;
        height: 2.2rem;
        border: 2.5px solid $ink;
        border-radius: 0.7rem;
        background: #fff;
        position: relative;
        display: inline-block;
        cursor: pointer;
        transition: background 0.16s;

        img {
          width: 100%;
          height: 100%;
        }
      }

      .checkbox.on {
        background: $pink;
        animation: chCheckBounce 0.38s cubic-bezier(0.34,1.56,0.64,1);

        &::after {
          content: '';
          position: absolute;
          left: 0.6rem;
          top: 0.2rem;
          width: 0.6rem;
          height: 1.1rem;
          border: solid #fff;
          border-width: 0 3px 3px 0;
          transform: rotate(45deg);
        }
      }

      a {
        color: $pink;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }
    }
  }

  .pay-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 20rem;
    height: 4.4rem;
    background: linear-gradient(135deg, $pink, #FF7A45);
    color: #ffffff;
    border: 2.5px solid $ink;
    border-radius: 1.3rem;
    font-size: 1.45rem;
    font-weight: 800;
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

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: 3px 3px 0 $ink;
      }
    }

    &.loading {
      span::before {
        content: '';
        display: inline-block;
        width: 1.6rem;
        height: 1.6rem;
        margin-right: 0.8rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s ease-in-out infinite;
      }
    }

    span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .zero-plan-rules {
    position: relative;
    border: 2px solid rgba(255,77,141,0.1);
    background: rgba(255,77,141,0.06);
    border-radius: 1.2rem;
    padding: 1rem;

    img {
      position: absolute;
      top: calc(-1.2rem - 1px);
      left: 8.6rem;
      width: 3.1rem;
      height: 1.2rem;
      z-index: 10;
    }

    .rules-content {
      font-size: 1.2rem;
      color: $muted;
      font-weight: 600;
      line-height: 2.4rem;
      white-space: pre-line;
      position: relative;

      &::before {
        content: '';
        display: inline-block;
        width: 1.8rem;
        height: 1.4rem;
      }

      &::first-line {
        font-size: 1.4rem;
        color: $sub;
        font-weight: 800;
      }
    }
  }
}

@keyframes chPanelIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes chPlanIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: none; }
}

@keyframes chChip {
  from { opacity: 0; transform: scale(0.4) rotate(-12deg); }
  to { opacity: 1; transform: none; }
}

@keyframes chCheckBounce {
  0% { transform: scale(1); }
  45% { transform: scale(1.22); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes chUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .plan-card-inner,
  .bottom-bar,
  .zero-plan-badge {
    animation: none !important;
  }
  .plan-card-inner:hover,
  .pay-btn:hover {
    transform: none;
  }
}
</style>
