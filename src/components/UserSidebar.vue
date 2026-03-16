<template>
  <div class="user-sidebar">
    <div class="title">{{ t("user.sidebar.title") }}</div>
    <div class="items">
      <div
        class="item"
        v-for="it in items"
        :key="it.key"
        :class="{ on: it.key === modelValue }"
        @click="
          $emit('update:modelValue', it.key);
          navigate(it);
        "
      >
        <span>{{ t(it.label) }}</span>
      </div>
    </div>
    <div class="logout" @click="showLogoutModal">{{ t("user.sidebar.logout") }}</div>

    <LogoutModal
      :visible="isShowLogoutModal"
      @close="cancelLogout"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup lang="ts" name="UserSidebar">
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import LogoutModal from "@/components/LogoutModal.vue";
import router from "@/router";

const { t, locale } = useI18n();
const props = defineProps<{ modelValue: string }>();
defineEmits(["update:modelValue"]);
void props.modelValue;

const isShowLogoutModal = ref(false);

const items = [
  { key: "personal", label: "user.sidebar.personalInfo", path: "/user-personal" },
  { key: "account", label: "user.sidebar.account", path: "/user-account" },
  { key: "profile", label: "user.sidebar.profile", path: "/user-profile" },
  { key: "subscription", label: "user.sidebar.subscription", path: "/user-subscription" },
  { key: "inviteRevenue", label: "user.sidebar.inviteRevenue", path: "/user-invite" },
  { key: "revenue", label: "user.sidebar.revenue", path: "/user-revenue" },
  { key: "interactive", label: "user.sidebar.interactive", path: "/user-interactive" },
  { key: "messages", label: "user.sidebar.messages", path: "/user-message" },
  { key: "privacy", label: "user.sidebar.privacy", path: "/user-privacy" },
  { key: "payment-history", label: "user.paymentHistory.title", path: "/user-payment-history" },
];

function navigate(it: { path: string }) {
  router.push(it.path);
}

function showLogoutModal() {
  isShowLogoutModal.value = true;
}

function confirmLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("connect");
  localStorage.removeItem("uid");

  isShowLogoutModal.value = false;

  const currentPath = window.location.pathname;
  const keepPaths = ["/detail", "/user-home", "character-library", "search"];
  const shouldKeepPath = keepPaths.some(path => currentPath.includes(path));

  if (!shouldKeepPath) {
    router.push("/");
  } else {
    window.location.reload();
  }
}

function cancelLogout() {
  isShowLogoutModal.value = false;
}
</script>

<style scoped lang="scss">
.user-sidebar {
  width: 29rem;
  padding: 12rem 1.2rem 2rem;
  border-right: 1px solid rgba(251, 100, 182, 0.2);
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  overflow: auto;
}
.title {
  height: 4.8rem;
  display: flex;
  align-items: center;
  padding: 0 1.8rem;
  font-weight: 500;
  font-size: 1.8rem;
  color: #101828;
  margin-bottom: 0.2rem;
}
.items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.item {
  height: 4.8rem;
  display: flex;
  align-items: center;
  padding: 0 0 0 1.8rem;
  border-radius: 0.8rem;
  cursor: pointer;
  color: #6a7282;
  position: relative;
}
.item:hover {
  background: rgba(251, 100, 182, 0.04);
  color: #fb64b6;
}
.item.on {
  font-weight: 500;
  background: rgba(251, 100, 182, 0.08);
  color: #fb64b6;
}
.item.on::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 0.3rem;
  height: 2.4rem;
  background: #fb64b6;
  border-radius: 0.2rem;
  transform: translateY(-50%);
}
.logout {
  position: absolute;
  left: 3.6rem;
  bottom: 2.4rem;
  font-size: 1.4rem;
  color: #99a1af;
  cursor: pointer;
}
</style>
