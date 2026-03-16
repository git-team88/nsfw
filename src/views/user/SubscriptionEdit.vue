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
                  <div v-if="hasAccount" class="account-status">
                    <img src="@/assets/images/user/success.png" alt="" />
                    {{ t("user.subscription.accountCreated") }}
                  </div>
                  <span v-else>{{ t("user.subscription.accountContent") }}</span>
                </div>
              </div>
            </div>
            <button class="create-account-btn" v-if="!hasAccount" @click="handleCreateAccount">{{ t("user.subscription.createAccount") }}</button>
            <span class="change-account-btn" v-else @click="handleChangeAccount">{{ t("user.subscription.changeAccount") }}</span>
          </div>

          <div class="sections-wrap">
            <div class="section">
              <div class="label">
                {{ t("user.subscription.priceLabel") }}
                <span class="info">{{ t("user.subscription.priceLimit") }}</span>
              </div>
              <div class="price-options">
                <div class="price-option" @click="selectedId = 0">
                  <div class="radio-circle" :class="{ active: selectedId === 0 }"></div>
                  <span class="price-text">{{ t("user.subscription.cancel") }}</span>
                </div>
                <div
                  class="price-option"
                  v-for="option in priceOptions"
                  :key="option.id"
                  @click="selectedId = option.id"
                >
                  <div class="radio-circle" :class="{ active: selectedId === option.id }"></div>
                  <span class="price-text">$ {{ option.price }}</span>
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
</template>

<script setup lang="ts" name="UserSubscriptionEdit">
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
const priceOptions = [
  { id: 45, price: "9.90" },
  { id: 46, price: "19.90" },
  { id: 47, price: "29.90" }
];
const selectedId = ref(0);
const benefits = ref("");
const saving = ref(false);
const loading = ref(false);
const plan = ref<any>(null);
const isLoading = ref(false);
const hasAccount = ref(false);

onMounted(async () => {
  await fetchSubscription();
});

function handleUserInfoLoaded(userData: any) {
  hasAccount.value = userData?.info?.blogger_status === '1';
}

async function fetchSubscription() {
  loading.value = true;
  try {
    const res = await api.getSubscription();
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      plan.value = data.data?.plan;
      const price = data.data?.plan?.price;
      const description = data.data?.plan?.description;

      if (plan.value) {
        // 找到对应的id
        const option = priceOptions.find(opt => opt.price === price);
        selectedId.value = option?.id || 1;
      } else {
        selectedId.value = 0;
      }

      benefits.value = description || "";
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
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

async function onSave() {
  if (!hasAccount.value) {
    await handleCreateAccount();

    return false;
  }

  saving.value = true;
  try {
    const params = {
      plan_id: selectedId.value,
      description: benefits.value
    };

    const res = await api.modifySubscription(params);
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      toast(t('success'));

      router.push("/user-subscription");
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error(error);
    toast(t("fail"));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.user-subscription-edit {
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
  background: rgba(251, 100, 182, 0.04);
}
.section {
  margin-bottom: 2.4rem;
}
.label {
  font-size: 1.4rem;
  color: #364153;
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
    width: 2rem;
    height: 2rem;
    border: 1px solid #99a1af;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    &.active {
      border-color: #fb64b6;
      &::after {
        content: "";
        width: 1rem;
        height: 1rem;
        background: #fb64b6;
        border-radius: 50%;
      }
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
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  background: #ffffff;
  outline: none;
  color: #364153;
}
.textarea:focus {
  border: 1px solid #fb64b6;
}
.textarea::placeholder {
  color: #99a1af;
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
  border: 1px solid #fb64b6;
  background: none;
  color: #fb64b6;
}
.btn-cancel:hover {
  background: rgba(251, 100, 182, 0.06);
  border-color: rgba(251, 100, 182, 0.35);
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
  background: rgba(255, 255, 255, 0.2);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
