<template>
  <div class="user-subscription">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.subscription.title") }}</div>
          </div>

          <div class="tip">{{ t("user.subscription.tip") }}</div>

          <div class="account-section">
            <div class="account-info">
              <img src="@/assets/images/user/account.png" alt="" />
              <div>
                <div class="section-title">
                  {{ t("user.subscription.accountTitle") }}
                </div>
                <div class="account-content">
                  <div v-if="hasAccount" class="account-status">
                    <img src="@/assets/images/user/success.png" alt="" />
                    {{ t("user.subscription.accountCreated") }}
                  </div>
                  <span v-else>{{ t("user.subscription.accountContent") }}</span>
                </div>
              </div>
            </div>

            <span class="change-account-btn" v-if="hasAccount" @click="handleChangeAccount">{{ t("user.subscription.changeAccount") }}</span>
            <button class="create-account-btn" v-else @click="handleCreateAccount">{{ t("user.subscription.createAccount") }}</button>

          </div>

          <div class="sections-wrap">
            <div class="section" v-if="!plan">
              <div class="disabled-box">
                <span>{{ t("user.subscription.disabled") }}</span>
                <button class="edit-link" @click="goEdit">
                  {{ t("user.subscription.edit") }}
                </button>
              </div>
            </div>
            <div class="section-info" v-else>
              <div class="section">
                <div class="label-row">
                  <div class="label">
                    {{ t("user.subscription.priceLabel") }}
                    <span>{{ t("user.subscription.priceLimit") }}</span>
                  </div>
                  <button class="edit-link" @click="goEdit">
                    {{ t("user.subscription.edit") }}
                  </button>
                </div>
                <div class="price-row">
                  <span class="price">${{ price }}</span>
                  <span class="per">{{ t("user.subscription.perMonth") }}</span>
                </div>
              </div>

              <div class="section">
                <div class="label">{{ t("user.subscription.benefitsLabel") }}</div>
                <div class="benefits">{{ description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <UploadMask :visible="isLoading" :text="t('loading')" />
</template>

<script setup lang="ts" name="UserSubscription">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import api from "@/api/index";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

const sidebarKey = ref("subscription");
const price = ref("");
const description = ref("");
const plan = ref<any>(null);
const loading = ref(false);
const isLoading = ref(false);
const hasAccount = ref(false);

onMounted(async () => {
  await fetchSubscription();
});

function handleUserInfoLoaded(userData: any) {
  hasAccount.value = userData?.info?.blogger_status === '1';
}

async function fetchSubscription() {
  try {
    const res = await api.getSubscription();

    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      plan.value = data.data?.plan || null;
      price.value = data.data?.plan?.price || "0";
      description.value = data.data?.plan?.description || t("user.subscription.benefitsText")
    } else {
      toast(locale.value == 'jp' ? data.msg_jp : data.msg)
    }
  } catch (error) {
    toast(t("fail"));
  }
}

function goEdit() {
  // toast(t("user.subscription.priceChangeLimit"));
  // return false;
  router.push("/user-subscription-edit");
}

async function handleCreateAccount() {
  try {
    isLoading.value = true;
    const res = await api.createAccount();
    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      window.open(data.data?.url, '_blank');
    } else {
      toast(locale.value == 'jp' ? data.msg_jp : data.msg);
      isLoading.value = false;
    }
  } catch (error) {
    isLoading.value = false;
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

async function handleChangeAccount() {
  try {
    isLoading.value = true;
    const res = await api.benefit();
    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      window.open(data.data?.url, '_blank');
    } else {
      toast(locale.value == 'jp' ? data.msg_jp : data.msg);
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped lang="scss">
.user-subscription {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  max-width: 139.2rem;
  margin: 0 auto;
  display: flex;
  gap: 2.4rem;
}
.main {
  flex: 1;
  padding-top: 12rem;
}
.panel {
  min-height: calc(100vh - 14rem);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
  padding: 2.4rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem 1.2rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}
.edit-link {
  background: none;
  border: none;
  color: #fb64b6;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0;
}
.tip {
  display: flex;
  align-items: center;
  height: 5.4rem;
  margin: 0 1.2rem 1.2rem;
  padding: 1rem 1.6rem;
  border: 1px solid rgba(0, 211, 242, 0.2);
  border-radius: 0.8rem;
  font-size: 1.4rem;
  background: rgba(0, 211, 242, 0.06);
  color: #364153;
}

.account-section {
  margin: 0 1.2rem 2.4rem;
  padding: 1.6rem;
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(251, 100, 182, 0.06);
}

.account-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.2rem;

  img{
    width: 5.2rem;
    height: 5.2rem;
  }
}

.section-title {
  margin-bottom: 0.8rem;
  font-weight: 500;
  font-size: 1.6rem;
  color: #101828;
  gap: 0.8rem;
}

.account-content {
  font-size: 1.4rem;
  color: #99A1AF;
  flex: 1;
}

.create-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 13.6rem;
  height: 4.8rem;
  background: #fb64b6;
  color: #ffffff;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;

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
      z-index: 1;
    }
  }
}

.change-account-btn {
  color: #FB64B6;
  font-size: 1.4rem;
  cursor: pointer;
}

.account-status {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  color: #6A7282;
  gap: 0.4rem;

  img{
    width: 2rem;
    height: 2rem;
  }
}

.sections-wrap {
  padding: 1.2rem;
  border-radius: 1.2rem;
}
.sections-wrap:hover {
  background: rgba(251, 100, 182, 0.04);
}
.section {
  margin-bottom: 2.4rem;
}
.section:last-child {
  margin-bottom: 0;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.disabled-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 5.4rem;
  padding: 1.8rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  background: #ffffff;
  font-size: 1.4rem;
  color: #364153;
}
.label {
  font-size: 1.4rem;
  color: #364153;

  span{
    font-size: 1.2rem;
    color: #99a1af;
    font-weight: normal;
  }
}
.price-row {
  display: flex;
  align-items: baseline;
  margin-top: 1.6rem;
  font-size: 1.6rem;
  gap: 0.2rem;
}
.price {
  font-size: 4.8rem;
  color: #fb64b6;
}
.per {
  font-size: 1.6rem;
  color: #99a1af;
}
.benefits {
  min-height: 5.4rem;
  display: flex;
  align-items: center;
  margin-top: 1.6rem;
  padding: 1.6rem 1.2rem;
  font-size: 1.4rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.6rem;
  color: #364153;
  background: #ffffff;
}
</style>
