<template>
  <div class="user-subscription-edit">
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
            <div class="section">
              <div class="label">
                {{ t("user.subscription.priceLabel") }}
                <span class="info">{{ t("user.subscription.priceLimit") }}</span>
              </div>
              <div class="price-options">
                <div class="price-option" @click="selectedId = '0'">
                  <div class="radio-circle">
                    <img src="@/assets/images/header/check_active.png" alt="" v-if="selectedId == '0'" />
                    <img src="@/assets/images/header/check.png" alt="" v-else />
                  </div>
                  <span class="price-text">{{ t("user.subscription.cancel") }}</span>
                </div>
                <div
                  class="price-option"
                  v-for="option in priceOptions"
                  :key="option.plan_id"
                  @click="selectedId = option.plan_id"
                >
                  <div class="radio-circle">
                    <img src="@/assets/images/header/check_active.png" alt="" v-if="selectedId == option.plan_id" />
                    <img src="@/assets/images/header/check.png" alt="" v-else />
                  </div>
                  <span class="price-text">{{ trimZeros(option.price) }} {{ t('aiRecharge.unit') }}（{{ trimZeros(option.web3?.price || '') }} USDT）</span>
                </div>
              </div>
            </div>
            <div class="section">
              <div class="label">
                {{ t("user.subscription.benefitsLabel") }}
                <span class="count">{{ benefits.length }}/500</span>
              </div>
              <textarea
                class="textarea"
                v-model="benefits"
                :maxlength="500"
                spellcheck="false"
                :placeholder="t('user.subscription.benefitsText')"
              ></textarea>
            </div>
            <div class="actions">
              <button class="btn btn-cancel" @click="onCancel">
                {{ t("user.interactive.cancel") }}
              </button>
              <button class="btn btn-save" :disabled="saving" @click="onSave">
                {{ t("user.profile.save") }}
              </button>
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

<script setup lang="ts" name="UserSubscriptionEdit">
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
const priceOptions = ref<any[]>([]);
const selectedId = ref('');
const benefits = ref("");
const originalSelectedId = ref('');
const originalBenefits = ref("");
const initialBenefits = ref("");
const initialSelectedId = ref('');
const saving = ref(false);
const loading = ref(false);
const plan = ref<any>(null);
const isLoading = ref(false);
const accountStatus = ref<'success' | 'failed' | 'none'>('none');

const showKycRequiredModal = ref(false);
const showKycReviewingModal = ref(false);
const showAccountRequiredModal = ref(false);
const showAccountFailedModal = ref(false);
const showCountrySelectModal = ref(false);

onMounted(async () => {
  await fetchSubscriptionList();
  await fetchSubscription();
});

async function fetchSubscriptionList() {
  try {
    const res = await api.subscriptionList() as any;

    if (res.code == 200 || res.code == 0) {
      priceOptions.value = res.data.plans || [];
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Error fetching subscription list:', error);
  }
}

function handleUserInfoLoaded(userData: any) {
  const bloggerStatus = userData?.info?.blogger_status;
  const hasStripeAccount = userData?.info?.has_stripe_account;
  if (bloggerStatus == '1' || bloggerStatus == 1) {
    accountStatus.value = 'success';
  } else if ((bloggerStatus == '0' || bloggerStatus == 0) && (hasStripeAccount == '1' || hasStripeAccount == 1)) {
    accountStatus.value = 'failed';
  } else {
    accountStatus.value = 'none';
  }
}

async function fetchSubscription() {
  loading.value = true;
  try {
    const data = await api.getSubscription() as any;

    if (data.code === 200 || data.code === 0) {
      plan.value = data.data?.plan;
      const description = data.data?.plan?.description;
      const planId = data.data?.plan?.plan_id;

      if (plan.value) {
        const option = priceOptions.value.find(opt => opt.plan_id == planId);
        selectedId.value = option?.plan_id || '0';
      } else {
        selectedId.value = '0';
      }

      benefits.value = description || "";
      originalSelectedId.value = selectedId.value;
      originalBenefits.value = benefits.value;
      initialBenefits.value = benefits.value;
      initialSelectedId.value = selectedId.value;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    console.error(error);
    toast(t("fail"));
  } finally {
    loading.value = false;
  }
}

function onCancel() {
  router.push("/user-subscription");
}

async function handleCreateAccount() {
  if (!checkLogin()) return;
  try {
    const kycRes = (await api.kycDetail()) as any;
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;

      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        showKycRequiredModal.value = true;
        return;
      } else {
        const status = kycData.status;
        if (status == 0 || status == '0' || status == 2 || status == '2') {
          showKycReviewingModal.value = true;
          return;
        }
      }
    } else {
      toast(locale.value == 'en' ? kycRes.msg : locale.value == 'zh' ? kycRes.msg_cn : locale.value == 'tc' ? kycRes.msg_tc : kycRes.msg_jp);
      return;
    }

    showCountrySelectModal.value = true;
  } catch (error) {
    toast(t("fail"));
  }
}

async function handleCountrySelected(country: string) {
  showCountrySelectModal.value = false;
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

    if (data.code == 200 || data.code == 0) {
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

async function onSave() {
  if (!checkLogin()) return;
  saving.value = true;
  try {
    const onlyDescChanged = selectedId.value === originalSelectedId.value && benefits.value !== originalBenefits.value;

    let res;
    if (onlyDescChanged) {
      res = await api.modifySubscriptionDesc({ description: benefits.value });
    } else {
      const params = {
        plan_id: selectedId.value,
        description: benefits.value
      };
      res = await api.modifySubscription(params);
    }

    const data = res as any;

    if (data.code === 200 || data.code === 0) {
      toast(t('success'));
      setTimeout(() => {
        window.location.href = '/user-subscription';
      }, 500);
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    console.error(error);
    toast(t("fail"));
  } finally {
    saving.value = false;
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
.user-subscription-edit {
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
.tip {
  display: flex;
  align-items: center;
  height: 54px;
  margin: 0 0 12px;
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

.account-right {
  display: flex;
  align-items: center;
  gap: 30px;
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

.account-status-text {
  font-size: 14px;
  color: #f5f5f5;
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
  transition: transform 0.15s;

  &:hover {
    
  }
  &:active {
    
  }
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

.account-tip {
  font-size: 14px;
  color: #777;
  line-height: 1.5;
}
.sections-wrap {
  padding: 16px;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
}
.section {
  margin-bottom: 24px;
}
.label {
  font-size: 14px;
  font-weight: 800;
  color: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 8px;

  .count {
    font-size: 12px;
    font-weight: 800;
    color: #f5f5f5;
  }

  .info {
    font-size: 12px;
    font-weight: 800;
    color: #f5f5f5;
  }
}
.price-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 16px;
  gap: 20px;
}
.price-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .radio-circle {
    width: 24px;
    height: 24px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .price-text {
    font-size: 16px;
    font-weight: 800;
    color: #f5f5f5;
  }
}
.textarea {
  width: 100%;
  height: 140px;
  margin-top: 16px;
  padding: 18px 16px;
  font-family: inherit;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: #111;
  outline: none;
  color: #f5f5f5;
}
.textarea:focus {
  border-color: #ff4f9a;
  box-shadow: 0 0 0 2px rgba(255,79,154,0.25);
}
.textarea::placeholder {
  color: #f5f5f5;
  opacity: 0.4;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.btn {
  height: 48px;
  min-width: 136px;
  padding: 0 16px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  position: relative;
}
.btn-cancel {
  background: rgba(255,255,255,0.06);
  color: #f5f5f5;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  transition: box-shadow 0.15s;
}
.btn-save {
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  border: 2px solid #ff9aca;
  color: #FFFFFF;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  transition: box-shadow 0.15s;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
  transform: none;
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
  .price-options {
    gap: 16px;
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
    margin: 0 0 12px;
    padding: 10px 12px;
  }
  .account-section {
    margin: 0;
  }
  .sections-wrap {
    padding: 12px;
  }
  .price-options {
    gap: 12px;
  }
  .textarea {
    height: 120px;
  }
  .btn {
    min-width: auto;
    flex: 1;
  }
  .actions {
    gap: 8px;
  }
  .account-info img {
    width: 36px;
    height: 36px;
  }
}
</style>
