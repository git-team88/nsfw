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
            <span class="change-account-btn" v-else-if="accountStatus == 'failed'" @click="handleViewAccount">{{ t("user.subscription.viewAccount") }}</span>
            <button class="create-account-btn" v-else @click="handleCreateAccount">{{ t("user.subscription.createAccount") }}</button>
          </div>

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
                  <span class="price-text">{{ option.price }} {{ t('aiRecharge.unit') }}</span>
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

<script setup lang="ts" name="UserSubscriptionEdit">
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
    }

    if (accountStatus.value === 'failed') {
      showAccountFailedModal.value = true;
      return;
    }

    if (accountStatus.value === 'none') {
      showAccountRequiredModal.value = true;
      return;
    }

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
        // Use window.location.href to ensure page refresh after save
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
  } catch (e) {
    console.error(e);
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
  background: #FFFBF4;
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
  border: 3px solid #161122;
  border-radius: 14px;
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
  color: #161122;
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
  background: #FF4D8D;
}
.tip {
  display: flex;
  align-items: center;
  height: 54px;
  margin: 0 0 12px;
  padding: 10px 16px;
  border: 2px solid #161122;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 800;
  background: #FFFDF7;
  color: #161122;
}

.account-section {
  margin: 0 0 24px;
  padding: 16px;
  border: 2px solid #161122;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFDF7;
}

.account-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;

  img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 2px solid #161122;
  }
}

.section-title {
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 16px;
  color: #161122;
}

.account-content {
  font-size: 14px;
  color: #161122;
  flex: 1;
}

.create-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: #FF4D8D;
  color: #FFFFFF;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}

.change-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: #FFFFFF;
  color: #161122;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}

.account-status {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 800;
  color: #161122;
  gap: 4px;

  img {
    width: 20px;
    height: 20px;
  }
}
.sections-wrap {
  padding: 16px;
  border: 2px solid #161122;
  border-radius: 13px;
  background: #FFFDF7;
}
.section {
  margin-bottom: 24px;
}
.label {
  font-size: 14px;
  font-weight: 800;
  color: #161122;
  display: flex;
  align-items: center;
  gap: 8px;

  .count {
    font-size: 12px;
    font-weight: 800;
    color: #161122;
  }

  .info {
    font-size: 12px;
    font-weight: 800;
    color: #161122;
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
    color: #161122;
  }
}
.textarea {
  width: 100%;
  height: 140px;
  margin-top: 16px;
  padding: 18px 16px;
  font-family: inherit;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FFFFFF;
  outline: none;
  color: #161122;
}
.textarea:focus {
  border-color: #FF4D8D;
  box-shadow: 3px 3px 0 #FF4D8D;
}
.textarea::placeholder {
  color: #161122;
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
  border-radius: 13px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  position: relative;
}
.btn-cancel {
  background: #FFFFFF;
  color: #161122;
  border: 2.5px solid #161122;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}
.btn-save {
  background: #FF4D8D;
  border: 2.5px solid #161122;
  color: #FFFFFF;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: 1px 1px 0 #161122;
  transform: none;
}
@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
  padding: 24px;
  }
  .account-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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
    margin: 0 0 24px;
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
