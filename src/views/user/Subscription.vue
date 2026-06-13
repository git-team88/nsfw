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
                  <div v-if="accountStatus == 'success'" class="account-status">
                    <img src="@/assets/images/user/success.png" alt="" />
                    {{ t("user.subscription.accountCreated") }}
                  </div>
                  <div v-else-if="accountStatus == 'failed'" class="account-status">
                    <img src="@/assets/images/user/fail.png" alt="" />
                    {{ t("user.subscription.accountFailed") }}
                  </div>
                  <span v-else>{{ t("user.subscription.accountContent") }}</span>
                </div>
              </div>
            </div>

            <span class="change-account-btn" v-if="accountStatus == 'success'" @click="handleChangeAccount">{{ t("user.subscription.changeAccount") }}</span>
            <span class="modify-account-btn" v-else-if="accountStatus == 'failed'" @click="handleViewAccount">{{ t("user.subscription.viewAccount") }}</span>
            <button class="create-account-btn" v-else @click="handleCreateAccount">{{ t("user.subscription.createAccount") }}</button>

          </div>

          <div class="sections-wrap">
            <div class="section" v-if="!plan">
              <div class="disabled-box">
                <span>{{ t("user.subscription.disabled") }}</span>
                <button class="edit-link" @click="handleEditClick">
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
                  <button class="edit-link" @click="handleEditClick">
                    {{ t("user.subscription.edit") }}
                  </button>
                </div>
                <div class="price-row">
                  <span class="price">{{ price }} {{ t('aiRecharge.unit') }}</span>
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

  <KycRequiredModal :visible="showKycRequiredModal" @close="showKycRequiredModal = false" />

  <KycReviewingModal :visible="showKycReviewingModal" @close="showKycReviewingModal = false" />

  <AccountRequiredModal :visible="showAccountRequiredModal" @close="showAccountRequiredModal = false" @create="handleAccountRequiredCreate" />

  <AccountFailedModal :visible="showAccountFailedModal" @close="showAccountFailedModal = false" @modify="handleAccountFailedModify" />
</template>

<script setup lang="ts" name="UserSubscription">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import UploadMask from "@/components/UploadMask.vue";
import KycRequiredModal from "@/components/KycRequiredModal.vue";
import KycReviewingModal from "@/components/KycReviewingModal.vue";
import AccountRequiredModal from "@/components/AccountRequiredModal.vue";
import AccountFailedModal from "@/components/AccountFailedModal.vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import api from "@/api/index";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

const sidebarKey = ref("subscription");
const price = ref("");
const description = ref("");
const plan = ref<any>(null);
const loading = ref(false);
const isLoading = ref(false);
const accountStatus = ref<'success' | 'failed' | 'none'>('none');

// KYC 相关状态
const showKycRequiredModal = ref(false);
const showKycReviewingModal = ref(false);
const kycStatusChecked = ref(false);
const showAccountRequiredModal = ref(false);
const showAccountFailedModal = ref(false);

onMounted(async () => {
  await fetchSubscription();
});

function handleUserInfoLoaded(userData: any) {
  const bloggerStatus = userData?.info?.blogger_status;
  const hasStripeAccount = userData?.info?.has_stripe_account;
  if (bloggerStatus == '1') {
    accountStatus.value = 'success';
  } else if ((bloggerStatus == '0') && (hasStripeAccount == '1')) {
    accountStatus.value = 'failed';
  } else {
    accountStatus.value = 'none';
  }
}

async function fetchKycDetail() {
  try {
    const kycRes = (await api.kycDetail()) as any;
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;

      // 检查数据是否为空
      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        // 未认证，显示需要认证弹窗
        showKycRequiredModal.value = true;
      } else {
        // 有数据，检查 status
        const status = kycData.status;
        if (status == 0 || status == '0' || status == 2 || status == '2') {
          // 审核中或未通过，显示审核弹窗
          showKycReviewingModal.value = true;
        } else {
          kycStatusChecked.value = true;
        }
      }
    } else {
      toast(locale.value == 'en' ? kycRes.msg : locale.value == 'zh' ? kycRes.msg_cn : locale.value == 'tc' ? kycRes.msg_tc : kycRes.msg_jp);
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchSubscription() {
  try {
    const res = await api.getSubscription();

    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      plan.value = data.data?.plan || null;
      price.value = data.data?.plan?.price || "0";
      description.value = data.data?.plan?.description || t("user.subscription.benefitsText")
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    toast(t("fail"));
  }
}

async function handleEditClick() {
  if (!checkLogin()) return;
  try {
    const kycRes = (await api.kycDetail()) as any;
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;

      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        showKycRequiredModal.value = true;
      } else {
        const status = kycData.status;
        if (status == '0' || status == '2') {
          showKycReviewingModal.value = true;
        } else {
          if (accountStatus.value === 'failed') {
            showAccountFailedModal.value = true;
          } else if (accountStatus.value === 'none') {
            showAccountRequiredModal.value = true;
          } else {
            // Force navigation with full page refresh to ensure component update
            window.location.href = '/user-subscription-edit';
          }
        }
      }
    } else {
      toast(locale.value == 'en' ? kycRes.msg : locale.value == 'zh' ? kycRes.msg_cn : locale.value == 'tc' ? kycRes.msg_tc : kycRes.msg_jp);
    }
  } catch (e) {
    console.error('Error in handleEditClick:', e);
  }
}

async function handleCreateAccount() {
  if (!checkLogin()) return;
  try {
    isLoading.value = true;
    const res = await api.createAccount();
    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      window.location.href = data.data?.url;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

async function handleChangeAccount() {
  if (!checkLogin()) return;
  try {
    isLoading.value = true;
    const res = await api.updateAccount();
    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      window.location.href = data.data?.url;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

async function handleViewAccount() {
  if (!checkLogin()) return;
  try {
    isLoading.value = true;
    const res = await api.updateAccount();
    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      window.location.href = data.data?.url;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

async function handleAccountRequiredCreate() {
  showAccountRequiredModal.value = false;
  await handleCreateAccount();
}

async function handleAccountFailedModify() {
  showAccountFailedModal.value = false;
  await handleChangeAccount();
}
</script>

<style scoped lang="scss">
.user-subscription {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}

.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 6rem;
  padding-right: 6rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}
.edit-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 8.8rem;
  height: 4rem;
  background: #FB64B6;
  border: none;
  border-radius: 0.8rem;
  color: #FFFFFF;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0 1rem;
}
.tip {
  display: flex;
  align-items: center;
  height: 5.4rem;
  margin: 0 0 2.4rem;
  padding: 1rem 1.6rem;
  border: 1px solid rgba(251,100,182,0.2);;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  background: rgba(251,100,182,0.06);
  color: #364153;
}

.account-section {
  margin: 0 0 2.4rem;
  padding: 1.6rem;
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F5F5F5;
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
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
  }
}

.change-account-btn {
  color: #99A1AF;
  font-size: 1.4rem;
  cursor: pointer;
}

.modify-account-btn{
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
  font-size: 1.4rem;
  color: #364153;
}
.label {
  font-size: 1.4rem;
  color: #99A1AF;
}
.price-row {
  display: flex;
  align-items: baseline;
  margin-top: 1.6rem;
  font-size: 1.6rem;
  gap: 0.2rem;
}
.price {
  font-size: 3.6rem;
  color: #fb64b6;
}
.per {
  font-size: 1.6rem;
  color: #364153;
}
.benefits {
  display: flex;
  align-items: center;
  margin-top: 1.6rem;
  font-size: 1.4rem;
  color: #364153;
}
</style>
