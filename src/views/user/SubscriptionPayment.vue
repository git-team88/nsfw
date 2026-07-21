<template>
  <div class="subscription-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="content-box">
        <h1 class="page-title">{{ t("subscribe.title") }}</h1>

        <!-- Creator Info -->
        <div class="creator-info">
          <div class="info-left">
            <img :src="userInfo.avatar" class="avatar" />
            <div class="meta">
              <div class="nickname">{{ userInfo.nickname }}</div>
              <!-- <div class="id">ID: {{ userInfo.id }}</div> -->
            </div>
          </div>
          <div class="price-tag"><span>{{ subscriptionPrice }} {{t('aiRecharge.unit')}}</span>/{{ t("subscribe.month") }}</div>
        </div>

        <p v-if="subscriptionDescription" class="plan-desc">{{ subscriptionDescription }}</p>

        <p class="desc">{{ t("subscribe.desc") }}</p>

        <!-- Payment Methods -->
        <!-- <div class="section-title">{{ t("subscribe.method") }}</div>
        <div class="payment-methods">
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="method-item"
            @click="selectedMethod = method.id"
          >
            <div class="radio">
              <img
                v-if="selectedMethod == method.id"
                src="@/assets/images/header/check_active.png"
                alt=""
              />
              <img v-else src="@/assets/images/header/check.png" alt="" />
            </div>

            <span>{{ method.name }}</span>
          </div>
        </div> -->

        <!-- Agreements -->
        <div class="agreements">
          <div class="check-item">
            <div class="checkbox" @click="paymentAgree = !paymentAgree">
              <img v-if="paymentAgree" src="@/assets/images/register/check_active.png" alt="" />
              <img v-else src="@/assets/images/register/check.png" alt="" />
            </div>

            <span>
              {{ t("subscribe.agree") }}
              <span class="agreement-text">{{ t("subscribe.paymentTerms") }}</span>
            </span>
          </div>
        </div>

        <!-- Pay Button -->
        <button class="pay-btn" :disabled="isLoading" @click="handlePay">
          {{ t("subscribe.pay") }}
        </button>

        <!-- Auto-renewal Note -->
        <div class="auto-renewal-note">
          {{ t('subscribe.autoRenewalNote') }}
        </div>
      </div>
    </div>

    <!-- Loading Mask -->
    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="SubscriptionPayment">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import defaultAvatar from "@/assets/images/base/avatar.png";
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import api from "@/api/index";

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

// User info
const userInfo = ref({
  id: "",
  nickname: "",
  avatar: ""
});

interface SubscriptionPlan {
  price: string;
  id?: number;
  name?: string;
  description?: string;
}

const subscriptionPlans = ref<SubscriptionPlan | SubscriptionPlan[]>({
  price: ''
});

const paymentMethods = ref([
  { id: "A", name: "Paypal" }
]);

const selectedMethod = ref("A");
const autoRenewAgree = ref(true);
const paymentAgree = ref(true);
const isLoading = ref(false);

const subscriptionDescription = computed(() => {
  const plans = subscriptionPlans.value;
  if (Array.isArray(plans)) {
    return plans.length > 0 ? plans[0].description || '' : '';
  } else {
    return plans.description || '';
  }
});

const subscriptionPrice = computed(() => {
  const plans = subscriptionPlans.value;
  if (Array.isArray(plans)) {
    return plans.length > 0 ? plans[0].price : '';
  } else {
    return plans.price || '';
  }
});

function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

// Get author info from API
async function fetchAuthorInfo() {
  const uid = route.query.uid;
  if (!uid) {
    toast(t("error"));
    return;
  }

  const userId = Array.isArray(uid) ? uid[0] : uid;
  if (!userId) {
    toast(t("error"));
    return;
  }

  try {
    const res = await api.authorInfo(userId);
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      userInfo.value = {
        id: data.data?.user?.id || "",
        nickname: data.data?.user?.nickname || "",
        avatar: data.data?.user?.avatar || defaultAvatar,
      };

      subscriptionPlans.value = data.data?.subscription_plans || [];
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    console.error("Fetch author info error:", error);
    toast(t("error"));
  }
}

function openLink() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}

async function handlePay() {
  if (!checkLogin()) return;

  if (!paymentAgree.value) {
    toast(t("subscribe.agreeFirst"));
    return;
  }

  try {
    isLoading.value = true;

    const uid = route.query.uid;
    if (!uid) {
      toast(t("error"));
      return;
    }

    const userId = Array.isArray(uid) ? uid[0] : uid;
    if (!userId) {
      toast(t("error"));
      return;
    }

    const res = await api.subscribe({ creator_id: userId });
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      window.location.href = data.data?.url;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    toast(t("error"));
  } finally {
    isLoading.value = false;
  }
}

// Lifecycle hook
onMounted(() => {
  if (!checkLogin()) return;
  fetchAuthorInfo();
});
</script>

<style scoped lang="scss">
.subscription-page {
  width: 100%;
  background: #FFFDF7;
}

.container {
  max-width: 650px;
  margin: 140px auto 20px;
  position: relative;

  .back {
    position: absolute;
    top: -52px;
    left: 0;
    width: auto;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #161122;
    cursor: pointer;
    z-index: 10;
    border: 2.5px solid #161122;
    border-radius: 13px;
    box-shadow: 3px 3px 0 #161122;
    background: #FFFDF7;
    padding: 0 10px;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    .back-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 4px 4px 0 #161122;
    }
  }
}

.content-box {
  .page-title {
    font-size: 20px;
    font-weight: 800;
    color: #161122;
    margin-bottom: 24px;
  }

  .creator-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border: 2.5px solid #161122;
    border-radius: 13px;
    box-shadow: 3px 3px 0 #161122;
    padding: 16px;
    background: #FFFDF7;

    .info-left {
      display: flex;
      gap: 8px;
      align-items: center;

      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        object-fit: cover;
        border: 2.5px solid #161122;
      }

      .meta {
        .nickname {
          font-size: 16px;
          font-weight: 800;
          color: #161122;
          margin-bottom: 4px;
        }

        .id {
          font-size: 14px;
          color: #161122;
        }
      }
    }

    .price-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 128px;
      height: 48px;
      padding: 8px 16px;
      background: #FFFDF7;
      color: #161122;
      border-radius: 6px;
      font-weight: 800;
      font-size: 14px;
      border: 2.5px solid #161122;

      span {
        font-size: 18px;
        color: #FF4D8D;
      }
    }
  }

  .plan-desc {
    font-size: 14px;
    color: #161122;
    line-height: 20px;
    margin-bottom: 12px;
  }

  .desc {
    font-size: 14px;
    color: #161122;
    line-height: 20px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 800;
    color: #161122;
    margin-bottom: 12px;
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;

    .method-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: #FFFDF7;
      border-radius: 6px;
      cursor: pointer;
      border: 2.5px solid #161122;
      box-shadow: 3px 3px 0 #161122;

      .radio {
        width: 22px;
        height: 22px;
        border: 2.5px solid #161122;
        border-radius: 3px;
        background: #FFFDF7;

        img {
          width: 100%;
          height: 100%;
        }
      }

      span {
        font-size: 14px;
        color: #161122;
        font-weight: 800;
      }
    }
  }

  .agreements {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #161122;

      .checkbox {
        width: 22px;
        height: 22px;
        border: 2.5px solid #161122;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #FFFDF7;

        img {
          width: 14px;
          height: 14px;
        }
      }

      .agreement-text {
        color: #FF4D8D;
        font-weight: 800;
        margin-left: 4px;
      }
    }
  }

  .pay-btn {
    width: 100%;
    height: 48px;
    background: #FF4D8D;
    color: #FFFDF7;
    border: 2.5px solid #161122;
    border-radius: 13px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.1s, box-shadow 0.1s;

    &:hover {
      box-shadow: 1px 1px 0 #161122;
      transform: translate(2px, 2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  }

  .auto-renewal-note {
    margin-top: 12px;
    font-size: 12px;
    color: #161122;
    line-height: 18px;
  }
}

@media (max-width: 768px) {
  .container {
    margin: 100px 20px 20px;
  }
  .creator-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .price-tag {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .container {
    margin: 80px 12px 16px;
  }
  .content-box .page-title {
    font-size: 18px;
  }
  .content-box .creator-info {
    padding: 12px;
  }
  .content-box .creator-info .info-left .avatar {
    width: 40px;
    height: 40px;
  }
  .content-box .creator-info .price-tag {
    min-width: auto;
    height: 36px;
    padding: 6px 12px;
    font-size: 13px;
    span {
      font-size: 15px;
    }
  }
  .container .back {
    top: -44px;
    width: auto;
    height: 36px;
  }
}
</style>
