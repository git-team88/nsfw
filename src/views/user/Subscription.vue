<template>
  <div class="user-subscription">
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
                  <div class="label">{{ t("user.subscription.priceLabel") }}</div>
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
</template>

<script setup lang="ts" name="UserSubscription">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
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

onMounted(async () => {
  await fetchSubscription();
});

async function fetchSubscription() {
  loading.value = true;
  try {
    const res = await api.getSubscription();

    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      plan.value = data.data?.plan || null;
      price.value = data.data?.plan?.price || "0";
      description.value = data.data?.plan?.description || t("user.subscription.benefitsText")
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

function goEdit() {
  router.push("/user-subscription-edit");
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
  font-weight: bold;
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
