<template>
  <div class="user-revenue">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>

    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-title">{{ t("user.sidebar.revenue") }}</div>
          <div class="metrics">
            <div class="metric fans">
              <div class="metric-label">{{ t("user.revenue.withdrawn") }}</div>
              <div class="metric-value pink">
                {{ pendingJpy != null ? `${formatSci(pendingJpy)}` : "--" }}
              </div>
            </div>
            <div class="metric comments">
              <div class="metric-label">{{ t("user.revenue.pending") }}</div>
              <div class="metric-value orange">
                {{ (availableJpy != null) ? `${formatSci(availableJpy)}` : "--" }}
              </div>
            </div>
          </div>

          <div class="withdraw-banner">
            <div class="banner-left">
              <div class="banner-tip">
                {{ t("user.revenue.withdrawTip") }}
                <span class="pink" @click="openCommunityConvention">{{ t("user.revenue.communityRule") }}</span>
                {{ t("user.revenue.withdrawTipEnd") }}
              </div>
            </div>
            <div class="btn-group">
              <button class="withdraw-btn secondary" @click="openWithdrawRecord">
                {{ t("user.revenue.withdrawRecord") }}
              </button>
              <button class="withdraw-btn primary" @click="openWithdrawModal">
                {{ t("user.revenue.withdraw") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <WithdrawModal
      :visible="showWithdrawModal"
      :total-withdrawable="availableJpy"
      @close="closeWithdrawModal"
      @confirm="confirmWithdraw"
    />

    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="UserRevenue">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import WithdrawModal from "@/components/WithdrawModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {toast} from "@/util/toast";
import api from "@/api/index";

const { t, locale } = useI18n();
const sidebarKey = ref("revenue");

const availableJpy = ref<number | null>(null);
const pendingJpy = ref<number | null>(null);

const hasAccount = ref(false);
const isLoading = ref(false);

// Withdraw modal state
const showWithdrawModal = ref(false);

async function fetchBalance() {
  try {
    const res = await api.balance();
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };

    if (data.code === 200 || data.code === 0) {
      availableJpy.value = data.data?.available_jpy || 0;
      pendingJpy.value = data.data?.pending_jpy || 0;
    }
  } catch (error) {
    toast(t("fail"));
  }
}

function openWithdrawModal() {
  if (availableJpy.value && availableJpy.value > 0) {
    showWithdrawModal.value = true;
  } else {
    toast(t("user.revenue.noProfit"));
  }
}

function closeWithdrawModal() {
  showWithdrawModal.value = false;
}

function confirmWithdraw() {
  closeWithdrawModal();
  openWithdrawRecord();
}

async function openWithdrawRecord() {
  if (hasAccount.value) {
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
  } else {
    handleCreateAccount()
  }
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
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchBalance();
});

function handleUserInfoLoaded(userData: any) {
  hasAccount.value = userData?.info?.blogger_status === '1';
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank");
}

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}


</script>

<style scoped lang="scss">
.user-revenue {
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
.panel-title {
  margin-bottom: 2.4rem;
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}
.metrics {
  display: flex;
  gap: 3rem;
  margin: 0 0 2.4rem;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 14.6rem;
  border-radius: 0.8rem;
  padding: 2.4rem;
  background: #F5F5F5;
}

.metric-label {
  color: #99A1AF;
  font-size: 1.4rem;
}
.metric-value {
  margin-top: 1.6rem;
  font-weight: 500;
  font-size: 3.2rem;
  color: #364153;
}

.withdraw-banner {
  .banner-left {
    .banner-tip {
      font-size: 1.2rem;
      color: #6A7282;
      margin-bottom: 2.4rem;
      .pink {
        cursor: pointer;
        color: #fb64b6;
      }
    }
  }

  .btn-group {
    display: flex;
    gap: 2.4rem;
    align-items: center;
    justify-content: flex-end;
    margin-top: 2.4rem;
  }

  .withdraw-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-width: 13.6rem;
    height: 4.8rem;
    padding: 0 2.4rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;

    img {
      width: 2.4rem;
      height: 2.4rem;
    }

    &.primary {
      background: #FB64B6;
      border: none;
      color: #FFFFFF;

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

    &.secondary {
      background: #F5F5F5;
      border: none;
      color: #6A7282;

      &:hover{
        color: #FB64B6;
      }
    }
  }
}

.tabs {
  display: flex;
  gap: 3rem;
  padding: 0 3.6rem 2rem;
  position: relative;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}
.tabs span {
  height: auto;
  cursor: pointer;
  font-size: 1.4rem;
  color: #6a7282;
  position: relative;
}
.tabs span.on {
  font-weight: 500;
  color: #101828;
}
.tabs span.on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rem;
  height: 2px;
  background: #fb64b6;
}
.block {
  border: none;
  border-radius: 0.8rem;
  padding: 0;
  background: #fff;
}
.block-title {
  display: flex;
  align-items: center;
  height: 4rem;
  font-size: 1.4rem;
  padding: 0 3.6rem;
}
.block.overall {
  border-color: rgba(251, 100, 182, 0.2);
}
.block.overall .block-title {
  color: #fb64b6;
  background: linear-gradient(90deg, rgba(251, 100, 182, 0.1) 0%, rgba(251, 100, 182, 0) 100%);
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}
.block.work {
  border-color: rgba(0, 211, 242, 0.2);
}
.block.work .block-title {
  color: #00d3f2;
  background: linear-gradient(90deg, rgba(0, 211, 242, 0.1) 0%, rgba(0, 211, 242, 0) 100%);
  border-top: 1px solid rgba(0, 211, 242, 0.2);
  border-bottom: 1px solid rgba(0, 211, 242, 0.2);
}
.block-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3.6rem;
  margin: 2.4rem 0;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0;
  border: none;
  border-radius: 0.6rem;
  background: #fff;
}
.date-range input {
  height: 2.8rem;
  border: none;
  outline: none;
  color: #6a7282;
}
.download {
  height: 4rem;
  padding: 0 1.2rem;
  border: none;
  border-radius: 0.6rem;
  background: #00d3f2;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}
.block.overall .download {
  background: #fb64b6;
}
.block.work .download {
  background: #00d3f2;
}
.download:hover {
  position: relative;
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.1);
    z-index: 3;
  }
}
.dl-icon {
  width: 1.6rem;
  height: 1.6rem;
}

.table {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  overflow: hidden;
  margin: 0 3.6rem;
}
.thead,
.tr {
  display: grid;
}
.table.overall {
  border: 1px solid rgba(251, 100, 182, 0.1);
}
.table.work {
  border: 1px solid rgba(0, 211, 242, 0.1);
}
.table.record {
  border: 1px solid rgba(251, 100, 182, 0.1);
}
.table.overall .thead,
.table.overall .tr {
  grid-template-columns: 1fr 1fr 1fr;
}
.table.work .thead,
.table.work .tr {
  grid-template-columns: 1fr 1fr;
}
.table.record .thead,
.table.record .tr {
  grid-template-columns: 1fr 1fr;
}
.th,
.td {
  display: flex;
  align-items: center;
  height: 5.2rem;
  padding: 0 2rem;
  font-size: 1.4rem;
}
.num-green {
  color: #05df72;
}
.num-red {
  color: #fb4d64;
}
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 36rem;
  padding: 2rem;
  border-radius: 1rem;
  background: #fff;
  position: relative;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}
.modal-close {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  cursor: pointer;
}
.modal-close img {
  width: 1.6rem;
  height: 1.6rem;
}
.modal-title {
  font-size: 1.4rem;
  color: #6a7282;
  margin-bottom: 1rem;
}
.modal-amount {
  font-size: 3rem;
  color: #ff9e45;
  margin-bottom: 1.2rem;
}
.modal-confirm {
  height: 4rem;
  padding: 0 1.6rem;
  border: none;
  border-radius: 0.8rem;
  background: #fb64b6;
  color: #fff;
  cursor: pointer;
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: default;
}


.table.overall .thead,
.table.overall .tr {
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
}
.table.work .thead,
.table.work .tr {
  border-bottom: 1px solid rgba(0, 211, 242, 0.05);
}
.table.record .thead,
.table.record .tr {
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
}
.th {
  color: #6a7282;
}
td {
  color: #364153;
}
.table.overall .th {
  background: none;
}
.table.work .th {
  background: none;
}
.table.record .th {
  background: none;
}
.table.overall .tbody .tr:hover {
  background: rgba(251, 100, 182, 0.04);
}
.table.work .tbody .tr:hover {
  background: rgba(0, 211, 242, 0.04);
}
.table.record .tbody .tr:hover {
  background: rgba(251, 100, 182, 0.04);
}
.block .pagination {
  margin: 2.4rem 0;
  justify-content: center;
}
</style>
