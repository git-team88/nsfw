<template>
  <div class="subscription-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
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
          <div class="price-tag"><span>{{ subscriptionPlans.price }} {{t('aiRecharge.unit')}}</span>/{{ t("subscribe.month") }}</div>
        </div>

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
              <a href="#" @click.prevent="openLink">{{ t("subscribe.paymentTerms") }}</a>
            </span>
          </div>
        </div>

        <!-- Pay Button -->
        <button class="pay-btn" :disabled="!paymentAgree || isLoading" @click="handlePay">
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
import { ref, onMounted } from "vue";
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

const subscriptionPlans = ref({
  price: ''
});

const paymentMethods = ref([
  { id: "A", name: "Paypal" }
]);

const selectedMethod = ref("A");
const autoRenewAgree = ref(true);
const paymentAgree = ref(true);
const isLoading = ref(false);

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
  if (!paymentAgree.value) return;

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
  fetchAuthorInfo();
});
</script>

<style scoped lang="scss">
.subscription-page {
  width: 100%;
  background: #FFFFFF;
}

.container {
  max-width: 65rem;
  margin: 14rem auto 2rem;

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
    font-size: 2rem;
    font-weight: 500;
    color: #99A1AF;
    margin-bottom: 2.4rem;
  }

  .creator-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;

    .info-left {
      display: flex;
      gap: 0.8rem;
      align-items: center;
      .avatar {
        width: 4.8rem;
        height: 4.8rem;
        border-radius: 0.8rem;
        object-fit: cover;
      }
      .meta {
        .nickname {
          font-size: 1.6rem;
          font-weight: 500;
          color: #101828;
          margin-bottom: 0.4rem;
        }
        .id {
          font-size: 1.4rem;
          color: #99a1af;
        }
      }
    }

    .price-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 12.8rem;
      height: 4.8rem;
      padding: 0.8rem 1.6rem;
      background: #F5F5F5;
      color: #6A7282;
      border-radius: 0.8rem;
      font-weight: 500;
      font-size: 1.4rem;

      span{
        font-size: 1.8rem;
        color: #fb64b6;
      }
    }
  }

  .desc {
    font-size: 1.2rem;
    color: #6A7282;
    line-height: 2rem;
    margin-bottom: 2.4rem;
  }

  .section-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
    margin-bottom: 1.2rem;
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-bottom: 2.4rem;

    .method-item {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      padding: 1.4rem 1.8rem;
      background: #f5f5f5;
      border-radius: 0.8rem;
      cursor: pointer;
      border: 1px solid #e5e7eb;

      .radio {
        width: 2.8rem;
        height: 2.8rem;
        img {
          width: 100%;
          height: 100%;
        }
      }

      span {
        font-size: 1.4rem;
        color: #101828;
        font-weight: 500;
      }
    }
  }

  .agreements {
    display: flex;
    flex-direction: column;
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
    width: 100%;
    height: 4.8rem;
    background: #fb64b6;
    color: #ffffff;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

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
  }

  .auto-renewal-note {
    margin-top: 1.2rem;
    font-size: 1.2rem;
    color: #99A1AF;
    line-height: 1.8rem;
  }
}
</style>
