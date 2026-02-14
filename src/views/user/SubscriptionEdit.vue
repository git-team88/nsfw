<template>
  <div class="user-subscription-edit">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.subscription.title") }}</div>
          </div>

          <div class="tip">{{ t("user.subscription.tip") }}</div>

          <div class="sections-wrap">
            <div class="section">
              <div class="label">{{ t("user.subscription.priceLabel") }}</div>
              <div class="price-options">
                <div class="price-option" @click="selectedPrice = '0'">
                  <div class="radio-circle" :class="{ active: selectedPrice === '0' }"></div>
                  <span class="price-text">{{ t("user.subscription.cancel") }}</span>
                </div>
                <div
                  class="price-option"
                  v-for="p in priceOptions"
                  :key="p"
                  @click="selectedPrice = p"
                >
                  <div class="radio-circle" :class="{ active: selectedPrice === p }"></div>
                  <span class="price-text">$ {{ p }}</span>
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
</template>

<script setup lang="ts" name="UserSubscriptionEdit">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import api from "@/api/index";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

const sidebarKey = ref("subscription");
const priceOptions = ["9.90", "19.90", "29.90"];
const selectedPrice = ref("");
const benefits = ref("");
const saving = ref(false);
const loading = ref(false);

onMounted(async () => {
  await fetchSubscription();
});

async function fetchSubscription() {
  loading.value = true;
  try {
    const res = await api.getSubscription();
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      const plan = data.data?.plan;
      const price = data.data?.plan?.price;
      const description = data.data?.plan?.description;

      if (plan) {
        selectedPrice.value = price || "9.90";
      } else {
        selectedPrice.value = "0";
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
async function onSave() {
  saving.value = true;
  try {
    const params = {
      price: selectedPrice.value === '0' ? 0 : selectedPrice.value,
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
  font-weight: bold;
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
