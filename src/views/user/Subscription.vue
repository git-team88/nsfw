<template>
  <div class="user-subscription">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.subscription.title") }}</div>
        </div>
        <div class="content">

          <div class="tip">{{ t("user.subscription.tip") }}</div>

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
                  <span class="price">{{ trimZeros(price) }} {{ t('aiRecharge.unit') }}<template v-if="web3Price">（{{ trimZeros(web3Price) }} USDT）</template></span>
                  <span class="per">{{ t("user.subscription.perMonth") }}</span>
                </div>
              </div>

              <div class="section">
                <div class="label">{{ t("user.subscription.benefitsLabel") }}</div>
                <div class="benefits">{{ description }}</div>
              </div>
            </div>
          </div>

          <div class="account-title">{{ t("user.subscription.paymentAccountTitle") }}</div>
          <div class="account-tip" v-html="t('user.subscription.accountTip')"></div>
          <div class="account-section">
            <div class="account-item">
              <div class="account-info">
                <img class="account-icon" src="@/assets/images/user/usdt.png" alt="" />
                <div class="account-name">{{ t("user.subscription.tokenAccount") }}</div>
              </div>
              <div class="account-right">
                <div class="account-status">
                  <img src="@/assets/images/user/success.png" alt="" />
                  {{ t("user.subscription.accountCreated") }}
                </div>
              </div>
            </div>
          </div>
          <div class="account-section">
            <div class="account-item">
              <div class="account-info">
                <img class="account-icon" src="@/assets/images/user/account.png" alt="" />
                <div class="account-name">{{ t("user.subscription.cashAccount") }}</div>
              </div>
              <div class="account-right">
                <template v-if="accountStatus == 'success'">
                  <div class="account-status">
                    <img src="@/assets/images/user/success.png" alt="" />
                    {{ t("user.subscription.accountCreated") }}
                  </div>
                  <span class="change-account-btn" @click="handleChangeAccount">{{ t("user.subscription.changeAccount") }}</span>
                </template>
                <template v-else-if="accountStatus == 'failed'">
                  <div class="account-status">
                    <img src="@/assets/images/user/fail.png" alt="" />
                    {{ t("user.subscription.accountFailed") }}
                  </div>
                  <span class="change-account-btn" @click="handleViewAccount">{{ t("user.subscription.viewAccount") }}</span>
                </template>
                <template v-else>
                  <span class="account-status-text">{{ t("user.subscription.accountContent") }}</span>
                  <button class="create-account-btn" @click="handleCreateAccount">{{ t("user.subscription.createAccount") }}</button>
                </template>
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

  <CountrySelectModal :visible="showCountrySelectModal" @close="showCountrySelectModal = false" @select="handleCountrySelected" />
</template>

<script setup lang="ts" name="UserSubscription">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import UploadMask from "@/components/UploadMask.vue";
import KycRequiredModal from "@/components/KycRequiredModal.vue";
import KycReviewingModal from "@/components/KycReviewingModal.vue";
import AccountRequiredModal from "@/components/AccountRequiredModal.vue";
import AccountFailedModal from "@/components/AccountFailedModal.vue";
import CountrySelectModal from "@/components/CountrySelectModal.vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import api from "@/api/index";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

function trimZeros(val: string | number): string {
  const s = String(val);
  if (s === '' || s === '0') return s;
  const num = parseFloat(s);
  if (isNaN(num)) return s;
  return num.toString();
}

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
const web3Price = ref("");
const description = ref("");
const plan = ref<any>(null);
const loading = ref(false);
const isLoading = ref(false);
const accountStatus = ref<'success' | 'failed' | 'none'>('none');

const showKycRequiredModal = ref(false);
const showKycReviewingModal = ref(false);
const kycStatusChecked = ref(false);
const showAccountRequiredModal = ref(false);
const showAccountFailedModal = ref(false);
const showCountrySelectModal = ref(false);
const selectedCountry = ref('');

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

      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        showKycRequiredModal.value = true;
      } else {
        const status = kycData.status;
        if (status == 0 || status == '0' || status == 2 || status == '2') {
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
      web3Price.value = data.data?.plan?.web3?.price || "";
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

function handleCreateAccount() {
  if (!checkLogin()) return;
  // showCountrySelectModal.value = true;
  handleCountrySelected('JP');
}

async function handleCountrySelected(country: string) {
  showCountrySelectModal.value = false;
  selectedCountry.value = country;
  try {
    isLoading.value = true;

    var params = {
      country: country
    };
    const res = await api.createAccount(params);
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
  background: #1a1a1a;
}

.container {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 100px 30px 24px;
}
.main {
  flex: 1;
  padding: 24px;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #f5f5f5;
  position: relative;
  padding-bottom: 10px;
}
.panel-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #ff4f9a;
}
.edit-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  border: 2px solid #ff9aca;
  border-radius: 14px;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  color: #FFFFFF;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  padding: 0 10px;
  transition: box-shadow 0.15s;
}
.tip {
  display: flex;
  align-items: center;
  height: 54px;
  margin: 0 0 24px;
  padding: 10px 16px;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  background: rgba(255,255,255,0.06);
  color: #f5f5f5;
}

.account-section {
  margin: 12px 0 0;
  padding: 16px;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
}

.account-section:first-of-type {
  margin-top: 0;
}

.account-title {
  font-weight: 800;
  font-size: 20px;
  color: #f5f5f5;
  margin: 30px 0 8px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.account-icon {
  width: 36px;
  height: 36px;
}

.account-name {
  font-weight: 700;
  font-size: 14px;
  color: #f5f5f5;
}

.account-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-status-text {
  font-size: 14px;
  color: #f5f5f5;
}

.account-tip {
  font-size: 14px;
  color: #777;
  line-height: 1.5;
}

.create-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  color: #FFFFFF;
  border: 2px solid #ff9aca;
  border-radius: 14px;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.change-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: rgba(255,255,255,0.06);
  color: #f5f5f5;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  box-shadow: none;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.account-status {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 800;
  color: #f5f5f5;
  gap: 4px;

  img {
    width: 20px;
    height: 20px;
  }
}

.section {
  margin-bottom: 24px;
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
  font-size: 14px;
  font-weight: 800;
  color: #f5f5f5;
}
.label {
  font-size: 14px;
  font-weight: 800;
  color: #f5f5f5;

  span {
    font-size: 12px;
    border: 1px solid #3d3d3d;
    border-radius: 999px;
    font-weight: 800;
    padding: 2px 8px;
    color: #f5f5f5;
  }
}
.price-row {
  display: flex;
  align-items: baseline;
  margin-top: 16px;
  font-size: 16px;
  gap: 2px;
}
.price {
  font-size: 36px;
  font-weight: 800;
  color: #ff4f9a;
}
.per {
  font-size: 16px;
  color: #f5f5f5;
}
.benefits {
  display: flex;
  align-items: center;
  margin-top: 16px;
  font-size: 14px;
  color: #f5f5f5;
}
@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
    padding: 24px;
    margin-left: 0;
  }
  .account-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .create-account-btn,
  .change-account-btn {
    width: 100%;
    min-width: auto;
  }
}
@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .content {
    padding: 16px;
  }
  .tip {
    height: auto;
    padding: 10px 12px;
  }
  .account-info img {
    width: 36px;
    height: 36px;
  }
}
</style>
