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

            <span @click="goToComputingPowerRules">{{ t('aiRecharge.computingPowerRules') }} →</span>
          </div>

          <div class="plan-grid">
            <div
              v-for="(plan, index) in rechargePlans"
              :key="index"
              class="plan-item"
              :class="{ active: selectedPlan === index }"
              @click="selectPlan(index)"
            >
              <span class="plan-price">{{ plan.price }}</span>
            <span class="plan-credits">{{ plan.credits }}</span>
            <span>{{ t('aiRecharge.credits') }}</span>
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

        <button class="pay-btn" :disabled="!agreeTerms">
          {{ t('aiRecharge.subscribeNow') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AIRecharge">
import Header from "@/components/Header.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

// Recharge plans data
const rechargePlans = ref([
  { price: "$7", credits: "980" },
  { price: "$20", credits: "2800" },
  { price: "$50", credits: "7000" },
  { price: "$100", credits: "14000" },
  { price: "$200", credits: "28000" }
]);

const selectedPlan = ref(0);
const agreeTerms = ref(true);

function selectPlan(index: number) {
  selectedPlan.value = index;
}

function goBack() {
  router.back();
}

function openLink() {
  window.open("/payment-terms", "_blank");
}

function goToComputingPowerRules() {
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

    span{
      font-size: 1.4rem;
      color: #FB64B6;
      cursor: pointer;
    }
  }

  .recharge-plan-section {
    margin-bottom: 2.4rem;

    .plan-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2.4rem;

      .plan-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 15.2rem;
        height: 15.2rem;
        border: 1px solid rgba(251, 100, 182, 0.2);
        border-radius: 1.2rem;
        font-size: 1.4rem;
        color: #6A7282;
        cursor: pointer;

        &:hover {
          border-color: #fb64b6;
        }

        &.active {
          background-color: #FB64B6;
          color: #ffffff;

          .plan-price {
            color: #ffffff;
          }
        }

        .plan-price {
          font-size: 2.4rem;
          font-weight: 600;
          color: #364153;
          margin-bottom: 2.4rem;
        }

        .plan-credits {
          margin-bottom: .4rem;
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
    display: block;
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