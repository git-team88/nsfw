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
.ai-recharge {
  width: 100%;
  background: #FFFFFF;
}

.container {
  width: 100rem;
  margin: 14rem auto 2rem;
  position: relative;

  .back {
    position: fixed;
    left: 50%;
    top: 14rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-55rem);
    cursor: pointer;
    z-index: 10;

    img {
      width: 4rem;
      height: 4rem;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    font-size: 3.2rem;
    font-weight: 500;
    text-align: center;
    color: #101828;
    margin-bottom: 2rem;
  }

  .tab-box {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .tab-group {
      display: flex;
      background: #F5F5F5;
      border-radius: 2.2rem;
      padding: 0.4rem;
    }

    .tab-item {
      display: flex;
      align-items: center;
      height: 3.6rem;
      font-size: 1.6rem;
      font-weight: 500;
      color: #6A7282;
      cursor: pointer;
      padding: 0 2.2rem;
      border-radius: 2.2rem;

      &.active {
        color: #364153;
        background: #FFFFFF;
      }
    }

    .rules-links {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      span {
        font-size: 1.4rem;
        color: #99A1AF;
        cursor: pointer;

        &:last-child {
          margin-left: 3rem;
        }
      }
    }
  }

  .first-month-off-banner {
    font-size: 1.6rem;
    color: #364153;
    margin: 1rem 0 0;
    text-align: center;

    .banner-highlight {
      font-weight: 500;
      color: #FB64B6;
    }
  }

  .credits-pack-tip {
    font-size: 1.4rem;
    color: #6A7282;
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
      border: 0.4rem solid #F5F5F5;
      border-top: 0.4rem solid #6A7282;
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1.6rem;
    }

    .list-loading-text {
      font-size: 1.4rem;
      color: #6A7282;
    }
  }

  .recharge-plan-section {
    margin: 0 0 3rem;

    .plan-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-top: 2.4rem;

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
          width: 23rem;
          height: 42rem;
          background: #FFFFFF;
          border: 2px solid transparent;
          border-radius: 2.4rem;
          box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.08);
          font-size: 1.4rem;
          color: #6A7282;
          cursor: pointer;
          padding: 2rem;
          z-index: 5;
          overflow: hidden;

          &.discount-card {
            height: 48rem;
          }

          &.credits-card {
            height: auto;
          }

          &:hover {
            border-color: #fb64b6;
          }

          &.active {
            background: rgba(251,100,182,0.06);
            border: 2px solid #FB64B6;
            box-shadow: 0px 4px 16px 0px rgba(251,100,182,0.15);

            .plan-credits-box {
              background: rgba(251,100,182,0.12);
            }
          }

          .plan-mode {
            font-size: 1.4rem;
            font-weight: 500;
            color: #6A7282;
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
                font-weight: 700;
                color: #101828;
              }

              .price-unit {
                font-size: 1.6rem;
                color: #364153;
                margin-left: 0.4rem;
              }
            }

            .plan-original-price {
              font-size: 1.2rem;
              color: #99A1AF;
              text-decoration: line-through;
              margin-bottom: 1rem;
            }

            .plan-price-desc {
              font-size: 1.2rem;
              line-height: 1.6rem;

              .desc-highlight {
                margin-bottom: 0.4rem;
                color: #FB64B6;
                font-weight: 500;
              }

              .desc-then {
                color: #6A7282;
                font-weight: 500;
              }
            }

            .plan-price-value {
              display: flex;
              align-items: baseline;

              .price-num {
                font-size: 2.8rem;
                font-weight: 700;
                color: #101828;
              }

              .price-unit {
                font-size: 1.6rem;
                color: #364153;
                margin-left: 0.4rem;
              }
            }

            .plan-strikethrough-price {
              font-size: 1.4rem;
              color: #99A1AF;
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
              color: #4A5565;
              margin-bottom: 0.6rem;

              .credits-value {
                margin: 0 0.4rem;
                color: #101828;
                font-weight: 500;
              }
            }

            .plan-credits-bonus {
              font-size: 1.4rem;
              color: #4A5565;
              margin-bottom: 0.6rem;

              .bonus-includes {
                margin-right: 0.4rem;
                color: #FB64B6;
              }

              .bonus-value {
                color: #4A5565;
              }
            }

            .plan-credits-valid {
              font-size: 1.4rem;
              color: #4A5565;
            }
          }

          .plan-estimated-output {
            margin-top: 1.6rem;
            .estimated-title {
              font-size: 1.4rem;
              font-weight: 500;
              color: #364153;
              margin-bottom: 0.8rem;
            }

            .estimated-list {
              .estimated-item {
                font-size: 1.4rem;
                line-height: 2rem;
                color: #6A7282;
                margin-bottom: 0.6rem;

                &:last-child {
                  margin-bottom: 0;
                }

                .estimated-num {
                  margin: 0 0.2rem;
                  color: #FB64B6;
                }
              }
            }
          }
        }

        .zero-plan-badge {
          position: absolute;
          top: -2.6rem;
          left: 0;
          width: 23rem;
          height: 4rem;
          border-radius: 1.2rem 1.2rem 0 0;
          background: #FB64B6;
          color: #ffffff;
          font-size: 1.2rem;
          padding-top: 0.6rem;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .bottom-bar {
    display: flex;
    align-items: stretch;
    margin-top: 3rem;
    background: #FFFFFF;
    box-shadow: 0px 0px 24px 0px rgba(0,0,0,0.04);
    border-radius: 2.4rem;
    padding: 2.4rem 0;

    .bottom-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: 0 2rem;

      &.bottom-block-btn {
        align-items: center;
      }

      .block-label {
        font-size: 1.4rem;
        color: #364153;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;

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
            box-shadow: 0px 0px 18px 0px rgba(0,0,0,0.08);
            color: #6A7282;
            font-size: 1.2rem;
            border-radius: 0.8rem;
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
          font-weight: 700;
          color: #101828;
        }

        .price-unit {
          font-size: 1.6rem;
          color: #364153;
        }

        &.total-value {
          .price-num {
            font-size: 2.4rem;
            color: #FB64B6;
          }
        }
      }

      .coupon-link {
        color: #99A1AF;
        cursor: pointer;
        font-size: 1.4rem;
      }

      .discount-amount {
        font-size: 1.4rem;
        color: #364153;
      }

      .cancel-coupon-btn {
        min-width: 8rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        color: #99A1AF;
        border: 1px solid #E5E7EB;
        background: none;
        cursor: pointer;
        padding: 0.4rem 1rem;
        border-radius: 0.6rem;
        transition: background-color 0.2s;

        &:hover {
          background-color: #E5E7EB;
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
      background: #F7F7F8;
      align-self: stretch;
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
      gap: 0.6rem;
      font-size: 1.4rem;
      color: #99A1AF;

      .checkbox {
        width: 2rem;
        height: 2rem;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
        }
      }

      a {
        color: #fb64b6;
        text-decoration: none;
        margin-left: 0.2rem;
        cursor: default;
      }
    }
  }

  .pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 20rem;
    height: 4.4rem;
    margin: 0 auto;
    background: #fb64b6;
    color: #ffffff;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &:disabled {
      background: rgba(251, 100, 182, 0.5);
      cursor: not-allowed;

      &:hover {
        &::after {
          opacity: 0;
        }
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
    border: 1px solid rgba(251,100,182,0.1);
    background: rgba(251,100,182,0.06);
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
      color: #99A1AF;
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
        color: #6A7282;
      }
    }
  }
}
</style>
