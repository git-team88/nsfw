<template>
  <div class="user-subscription-edit">
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
      const params = {
        plan_id: selectedId.value,
        description: benefits.value
      };

      const res = await api.modifySubscription(params);
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
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 4.8rem;
  padding-right: 4.8rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
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
  color: #99A1AF;
}
.tip {
  display: flex;
  align-items: center;
  height: 5.4rem;
  margin: 0 1.2rem 1.2rem;
  padding: 1rem 1.6rem;
  border: 1px solid rgba(251,100,182,0.2);;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  background: rgba(251,100,182,0.06);
  color: #364153;
}

.account-section {
  margin: 0 1.2rem 2.4rem;
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
  background: #F5F5F5;;
}
.section {
  margin-bottom: 2.4rem;
}
.label {
  font-size: 1.4rem;
  color: #6A7282;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  .count {
    font-size: 1.2rem;
    color: #99a1af;
    font-weight: normal;
  }

  .info{
    font-size: 1.2rem;
    color: #99a1af;
    font-weight: normal;
  }
}
.price-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1.6rem;
  gap: 3.2rem;
}
.price-option {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  .radio-circle {
    width: 2.4rem;
    height: 2.4rem;
    img{
      width: 100%;
      height: 100%;
    }
  }
  .price-text {
    font-size: 1.6rem;
    color: #364153;
  }
}
.textarea {
  width: 100%;
  height: 14rem;
  margin-top: 1.6rem;
  padding: 1.8rem 1.6rem;
  font-family: inherit;
  border: 1px solid #FFFFFF;
  border-radius: 0.8rem;
  background: #FFFFFF;
  outline: none;
  color: #364153;
}
.textarea:focus {
  border: 1px solid #fb64b6;
}
.textarea::placeholder {
  color: #99A1AF;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}
.btn {
  height: 4.8rem;
  min-width: 13.6rem;
  padding: 0 1.6rem;
  border-radius: 0.8rem;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
}
.btn-cancel {
  background: #FFFFFF;
  color: #6A7282;
}
.btn-cancel:hover {
  color: #fb64b6;
}
.btn-save {
  background: #fb64b6;
  border: none;
  color: #fff;
}
.btn-save:hover::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
