<template>
  <div class="ai-recharge">
    <Header ref="headerRef" :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="content-box">
        <h1 class="page-title">{{ t('aiRecharge.title') }}</h1>

        <div class="recharge-plan-section">
          <div class="section-title-box">
            <div class="section-title">{{ t('aiRecharge.selectPlan') }}</div>

            <div class="rules-links">
              <span @click="goToComputingPowerRules">{{ t('aiRecharge.computingPowerRules') }} →</span>
              <span @click="goToPointsDetails">{{ t('aiRecharge.pointsDetails') }} →</span>
            </div>
          </div>

          <div class="plan-grid">
            <div
              v-for="(plan, index) in rechargePlans"
              :key="plan.plan_id"
              class="plan-item"
              @click="selectPlan(plan.plan_id)"
            >
              <div v-if="index == 0 && isUserNew && promotionTitle" class="zero-plan-badge">{{ promotionTitle }}</div>

              <div class="plan-inner":class="{ active: selectedPlan == plan.plan_id }">
                <span class="plan-title">{{ getPlanTitle(plan) }}</span>
                <div class="plan-price-container">
                  <span class="plan-price">{{ formatPrice(plan.price) }}{{ t('aiRecharge.unit') }}</span>
                  <span class="plan-period"><span v-if="plan.billing_period">{{ getBillingPeriodText(plan.billing_period) }}</span></span>
                </div>
                <span class="plan-credits">{{ plan.credits }} {{ t('aiRecharge.compute') }}</span>
                <span class="plan-valid">{{ getValidityText(plan.expiry_months) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isUserNew && promotionContent" class="zero-plan-rules">
          <img src="@/assets/images/home/arrow.png" alt="" />
          <!-- <div class="rules-title">{{ t('aiRecharge.zeroPlanRules') }}</div> -->
          <div class="rules-content" v-html="promotionContent">
          </div>
        </div>

        <div class="price-details">
          <div class="price-row">
            <span class="price-label">{{ t('aiRecharge.originalPrice') }}</span>
            <span class="price-value">{{ formatPrice(originalPrice.toString()) }}{{ t('aiRecharge.yen') }}</span>
          </div>
          <div class="price-row coupon-row">
            <div class="coupon-info-box">
              <span class="price-label">{{ t('aiRecharge.coupon') }}</span>
              <div class="coupon-info-icon">
                <img src="@/assets/images/user/notice.png" alt="Info" />
                <div class="coupon-tooltip">
                  {{ t('aiRecharge.couponInfo') }}
                </div>
              </div>
            </div>
            <div class="coupon-value" v-if="couponCode">
              <button class="cancel-coupon-btn" @click="cancelCoupon">{{ t('aiRecharge.cancelCoupon') }}</button>
              <span class="discount-amount">-{{ formatPrice(discountAmount.toString()) }}{{ t('aiRecharge.yen') }}</span>
            </div>
            <div class="coupon-value" v-else>
              <span class="price-value coupon-link" @click="goToCoupon">{{ t('aiRecharge.addCoupon') }}></span>
            </div>
          </div>
          <div class="price-row total-row">
            <span class="price-label">{{ t('aiRecharge.actualAmount') }}</span>
            <span class="price-value total-value">{{ formatPrice(discountedPrice.toString()) }}{{ t('aiRecharge.yen') }}</span>
          </div>
        </div>

        <div class="agreements">
          <div class="check-item">
            <div class="checkbox" @click="agreeTerms = !agreeTerms">
              <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
              <img v-else src="@/assets/images/register/check.png" alt="" />
            </div>
            <span>
              {{ t("subscribe.agree") }}
              <a href="#" @click.prevent="openLink">{{ t("subscribe.paymentTerms") }}</a>
            </span>
          </div>
        </div>

        <button class="pay-btn" :disabled="!agreeTerms || isLoading" :class="{ loading: isLoading }" @click="handleRecharge">
          <span>{{ t('aiRecharge.subscribeNow') }}</span>
        </button>
      </div>
    </div>

    <UploadMask :visible="isLoading" :text="t('loading')" />

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
import { set } from "lodash-es";

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
}

const rechargePlans = ref<RechargePlan[]>([]);
const selectedPlan = ref<number | string>(0);
const agreeTerms = ref(true);
const isLoading = ref(false);
const showCouponModal = ref(false);
const couponCode = ref('');
const couponInfo = ref<{ code: string; type: string; discount_value: string; } | null>(null);
const isUserNew = ref(false);
const promotionTitle = ref('');
const promotionContent = ref('');

const originalPrice = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  return plan ? parseFloat(plan.price) : 0;
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

  await checkRechargeUser();
  getList();
});

async function checkRechargeUser() {
  try {
    const response = await api.checkRechargeUser({});
    const res = response.data;

    // Handle both standard format {code: 0, data: {...}} and direct data format {is_user_new: true}
    let userData = null;
    if (res.code !== undefined) {
      // Standard format
      if (res.code == 0) {
        userData = res.data;
      }
    } else {
      // Direct data format
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
  api.aIRechargePlan().then((res: any) => {
    if (res.code == 0) {
      if (res.data && Array.isArray(res.data)) {
        // Map the data to ensure all required fields are present
        rechargePlans.value = res.data.map((plan: any) => {
          return {
            plan_id: plan.plan_id || plan.id || Math.random(),
            info: plan.info || [], // Store all language information
            price: plan.price || '0',
            period: plan.period || '',
            credits: plan.credits || '0',
            expiry_months: plan.expiry_months,
            billing_period: plan.billing_period
          };
        });
        // Select the first plan by default
        if (rechargePlans.value.length > 0) {
          selectedPlan.value = rechargePlans.value[0].plan_id;

          // Get promotion info if user is new
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

function selectPlan(planId: number | string) {
  selectedPlan.value = planId;
  // Clear coupon when switching plans
  if (couponCode.value) {
    couponCode.value = '';
    couponInfo.value = null;
  }
}

async function handleRecharge() {
  if (!agreeTerms.value) return;

  isLoading.value = true;
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
    isLoading.value = false;
  }
}

function goToPointsDetails() {
  router.push('/ai-points-details');
}

function goBack() {
  router.back();
}

// Get plan title based on current language
function getPlanTitle(plan: any) {
  if (plan.info && Array.isArray(plan.info)) {
    const currentLang = locale.value || 'zh';
    const infoItem = plan.info.find((item: any) => item.language === currentLang);
    if (infoItem && infoItem.name) {
      return infoItem.name;
    } else if (plan.info.length > 0) {
      // Fallback to first available language
      return plan.info[0].name || t('aiRecharge.unknownPlan');
    }
  }
  return t('aiRecharge.unknownPlan');
}

// Get billing period text based on current language
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

// Get validity text based on current language
function getValidityText(expiryMonths: number | undefined) {
  if (expiryMonths) {
    return t('aiRecharge.validityPeriod', { months: expiryMonths });
  }
  return t('aiRecharge.permanentValid');
}

// Format price with thousands separator
function formatPrice(price: string): string {
  // Remove any non-digit characters except decimal point
  const cleanPrice = price.replace(/[^0-9.]/g, '');
  // Split into integer and decimal parts
  const parts = cleanPrice.split('.');
  // Add thousands separator to integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Join back together
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
  width: 65rem;
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
    font-size: 2.4rem;
    font-weight: 500;
    text-align: center;
    color: #101828;
    margin-bottom: 3.6rem;
  }

  .section-title-box{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4.6rem;
    .section-title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
    }

    .rules-links {
      display: flex;
      align-items: center;
      span{
        font-size: 1.4rem;
        color: #99A1AF;
        cursor: pointer;

        &:last-child{
          margin-left: 3rem;
        }
      }
    }
  }

  .plan-type-title {
    font-size: 1.4rem;
    font-weight: 500;
    color: #364153;
    margin-bottom: 1.6rem;
    text-align: left;
  }

  .recharge-plan-section {
    margin-bottom: 2.2rem;

    .plan-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.6rem;
      margin-bottom: 2.4rem;

      .plan-item {
        position: relative;

        .plan-inner{
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 20rem;
          height: 21.6rem;
          border: 1px solid #F5F5F5;
          border-radius: 1.2rem;
          font-size: 1.4rem;
          background: #F5F5F5;
          color: #6A7282;
          cursor: pointer;
          padding: 1.6rem;
          z-index: 5;

          &:hover {
            border-color: #fb64b6;
          }

          &.active {
            border-color: #fb64b6;
          }

        }

        .zero-plan-badge {
          position: absolute;
          top: -2.6rem;
          left: 0;
          width: 20rem;
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

        .plan-title {
          font-size: 1.4rem;
          margin-bottom: 2.4rem;
          text-align: center;
        }

        .plan-price-container {
          display: flex;
          align-items: baseline;
          margin-bottom: 2.4rem;
        }

        .plan-price {
          font-size: 2.2rem;
          font-weight: 500;
          color: #364153;
        }

        .plan-period {
          font-size: 1.4rem;
          color: #6A7282;
          margin-left: 0.4rem;
        }

        .plan-credits {
          font-size: 1.6rem;
          font-weight: 500;
          margin-bottom: 1.6rem;
          color: #4A5565;
        }

        .plan-valid {
          font-size: 1.2rem;
          text-align: center;
          color: #99A1AF;
        }
      }
    }
  }

  .agreements {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-bottom: 1.8rem;

    .check-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.4rem;
      color: #99A1AF;

      .checkbox {
        width: 2.4rem;
        height: 2.4rem;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
        }
      }

      a {
        color: #fb64b6;
        text-decoration: none;
        margin-left: 0.4rem;
      }
    }
  }

  .pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 4.8rem;
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

  /* 加载遮罩层样式 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 0 2rem rgba(0, 0, 0, 0.2);

      .loading-spinner {
        width: 4rem;
        height: 4rem;
        border: 0.4rem solid #F5F5F5;
        border-top: 0.4rem solid #6A7282;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1.6rem;
      }

      span {
        font-size: 1.6rem;
        color: #6A7282;
      }
    }
  }

  .zero-plan-rules {
    position: relative;
    border: 1px solid rgba(251,100,182,0.1);
    background: rgba(251,100,182,0.06);
    border-radius: 1.2rem;
    padding: 1rem;

    img{
      position: absolute;
      top: calc(-1.2rem - 1px);
      left: 8.6rem;
      width: 3.1rem;
      height: 1.2rem;
      z-index: 10;
    }

    .rules-title {
      font-size: 1.4rem;
      font-weight: 500;
      color: #6A7282;
      margin-left: 1.8rem;
      margin-bottom: 0.6rem;
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

  .price-details {
    margin: 3rem 0 4rem;

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.coupon-row {
        margin-top: 1.6rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #F5F5F5;

        .coupon-info-box{
          display: flex;
          align-items: center;
        }
        .coupon-info-icon {
          position: relative;
          margin-left: 1rem;
          cursor: pointer;

          img {
            width: 2rem;
            height: 2rem;
          }

          .coupon-tooltip {
            display: none;
            position: absolute;
            left: 2.2rem;
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

        .coupon-value {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .coupon-link {
          color: #6A7282;
          cursor: pointer;
          font-size: 1.4rem;
        }

        .discount-amount {
          font-size: 1.4rem;
          color: #364153;
        }

        .cancel-coupon-btn {
          min-width: 10rem;
          height: 3.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #99A1AF;
          border: 1px solid #F5F5F5;
          background: none;
          cursor: pointer;
          padding: 0.6rem 1.2rem;
          border-radius: 0.8rem;
          transition: background-color 0.2s;

          &:hover {
            background-color: #F5F5F5;
          }
        }
      }

      &.total-row {
        padding-top: 2rem;

        .total-value {
          font-size: 1.6rem;
          font-weight: 500;
          color: #101828;
        }
      }

      .price-label {
        font-size: 1.4rem;
        color: #6A7282;
      }

      .price-value {
        font-size: 1.4rem;
        color: #364153;
      }
    }
  }

  .usage-rules {
    background-color: #f9fafb;
    border-radius: 0.8rem;
    padding: 2.4rem;

    h3 {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin-bottom: 1.6rem;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        font-size: 1.4rem;
        color: #6a7282;
        margin-bottom: 0.8rem;

        &:before {
          content: '•';
          color: #fb64b6;
          font-weight: 500;
          margin-right: 0.8rem;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>