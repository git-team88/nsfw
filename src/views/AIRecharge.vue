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
              v-for="plan in rechargePlans"
              :key="plan.plan_id"
              class="plan-item"
              :class="{ active: selectedPlan === plan.plan_id }"
              @click="selectPlan(plan.plan_id)"
            >
              <span class="plan-title">{{ t(`aiRecharge.${plan.title}`) }}</span>
              <div class="plan-price-container">
                <span class="plan-price">{{ plan.price }}</span>
                <span class="plan-period">{{ plan.period ? t(`aiRecharge.${plan.period}`) : '' }}</span>
              </div>
              <span class="plan-credits">{{ plan.credits }} {{ t('aiRecharge.compute') }}</span>
              <span class="plan-valid">{{ t(`aiRecharge.${plan.valid}`) }}</span>
            </div>
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
  </div>
</template>

<script setup lang="ts" name="AIRecharge">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";
import { set } from "lodash-es";

const { t, locale } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const rechargePlans = ref([
  { plan_id: 1, title: 'monthlyAutoRenew', price: '$7', period: 'periodMonth', credits: "980", valid: 'valid6Months' },
  { plan_id: 2, title: 'quarterlyAutoRenewal', price: '$20', period: 'period3Month', credits: "3,000", valid: 'valid6Months' },
  { plan_id: 3, title: 'semiAnnualAutoRenewal', price: '$50', period: 'period6Month', credits: "6,300", valid: 'valid6Months' },
  { plan_id: 4, title: 'annualAutoRenewal', price: '$98', period: 'periodYear', credits: "13,200", valid: 'valid12Months' },
  { plan_id: 5, title: 'computePack', price: '$7', period: '', credits: "950", valid: 'valid6Months' },
  { plan_id: 6, title: 'computePack', price: '$20', period: '', credits: "2,800", valid: 'valid6Months' },
  { plan_id: 7, title: 'computePack', price: '$50', period: '', credits: "6,500", valid: 'valid6Months' },
  { plan_id: 8, title: 'computePack', price: '$98', period: '', credits: "13,000", valid: 'valid6Months' }
]);

const selectedPlan = ref(1);
const agreeTerms = ref(true);
const isLoading = ref(false);

function selectPlan(planId: number) {
  selectedPlan.value = planId;
}

async function handleRecharge() {
  if (!agreeTerms.value) return;

  isLoading.value = true;
  try {
    if (!selectedPlan.value) {
      return false;
    }

    const response = await api.AIRecharge({
      plan_id: selectedPlan.value
    });

    const data = response as any;
    if (data.code === 0 || data.code === 200) {
      if (data.data) {
        window.location.href = data.data.url.url;
      }
    } else {
      toast(locale.value == 'jp' ? data.msg_jp : data.msg);
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

function openLink() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}

function goToComputingPowerRules() {
  localStorage.setItem("isBack", "1");
  window.open("/computing-rules", "_blank");
}
</script>

<style lang="scss" scoped>
.ai-recharge {
  width: 100%;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}

.container {
  max-width: 90ch;
  min-height: calc(100vh - 14rem);
  margin: 12rem auto 2rem;
  padding: 2.4rem 3rem;
  position: relative;
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);

  .back {
    position: fixed;
    left: 50%;
    top: 12rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-55rem);
    border: 1px solid rgba(251, 100, 182, 0.2);
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    cursor: pointer;
    z-index: 10;

    &:hover {
      border: 1px solid rgba(251, 100, 182, 0.5);
      background: rgba(251, 100, 182, 0.06);
    }

    img {
      width: 2.4rem;
      height: 2.4rem;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    padding-bottom: 1.6rem;
    font-size: 2.4rem;
    font-weight: 500;
    text-align: center;
    color: #fb64b6;
    margin-bottom: 3.6rem;

    &::after{
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      content: '';
      width: 6rem;
      height: .4rem;
      border-radius: .4rem;
      background: linear-gradient(0deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
    }
  }

  .section-title-box{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2.4rem;
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
        color: #00D3F2;
        cursor: pointer;

        &:last-child{
          margin-left: 3rem;
          color: #FB64B6;
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
    margin-bottom: 2.4rem;

    .plan-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 1.4rem;
      margin-bottom: 2.4rem;

      .plan-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 20rem;
        height: 21.6rem;
        border: 1px solid rgba(251, 100, 182, 0.2);
        border-radius: 1.2rem;
        font-size: 1.4rem;
        color: #6A7282;
        cursor: pointer;
        padding: 1.6rem;

        &:hover {
          border-color: #fb64b6;
        }

        &.active {
          border-color: #fb64b6;
          background-color: rgba(251,100,182,0.12);
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
          font-size: 2.4rem;
          font-weight: 600;
          color: #FB64B6;
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
    justify-content: center;
    align-items: center;
    gap: 1.2rem;
    margin-bottom: 1.4rem;

    .check-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.4rem;
      color: #6a7282;

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
    width: 24rem;
    height: 4.8rem;
    margin: 0 auto;
    background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
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
        background: rgba(255, 255, 255, 0.2);
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
    background-color: rgba(0, 0, 0, 0.5);
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
        border: 0.4rem solid rgba(251, 100, 182, 0.3);
        border-radius: 50%;
        border-top-color: #fb64b6;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1.6rem;
      }

      span {
        font-size: 1.6rem;
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
          font-weight: bold;
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