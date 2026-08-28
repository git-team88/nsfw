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
import eventBus from "@/util/eventBus";

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

  eventBus.emit('userLoggedOut');

  const currentPath = window.location.pathname;
  const keepPaths = ["/detail", "/user-home", "character-library", "search"];
  const shouldKeepPath = keepPaths.some(path => currentPath.includes(path));

  if (!shouldKeepPath) {
    router.push("/");
  }
}

function cancelLogout() {
  isShowLogoutModal.value = false;
}
</script>

<style scoped lang="scss">
.user-sidebar {
  width: 220px;
  padding: 24px 14px;
  position: fixed;
  top: 100px;
  height: calc(100vh - 124px);
  overflow: auto;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  box-sizing: border-box;
  background: #1a1a1a;
}
.title {
  font-weight: 800;
  font-size: 20px;
  color: #f5f5f5;
  padding: 0 14px 8px;
  letter-spacing: 0.01em;
}
.items {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;
  color: #f5f5f5;
  transition: background 0.15s;
}
.item:hover {
  background: rgba(255,255,255,0.06);
}
.item.on {
  background: rgba(255,79,154,0.12);
  color: #ff4f9a;
}
.item.on::after {
  content: '';
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  animation: stDot 2.6s ease-in-out infinite;
}
@keyframes stDot {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.35); }
}
.logout {
  font-weight: 800;
  font-size: 13px;
  color: #E5484D;
  cursor: pointer;
  padding: 0 14px;
}
@media (max-width: 900px) {
  .user-sidebar {
    width: 100%;
    height: auto;
    position: static;
  }
  .title {
    margin-bottom: 8px;
  }
  .items {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .item {
    flex: none;
    width: 100%;
    white-space: normal;
  }
  .item.on::after {
    margin-left: auto;
  }
}
</style>