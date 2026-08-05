<template>
  <div class="user-revenue">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>

    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.sidebar.revenue") }}</div>
        </div>
        <div class="content">
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
                <span class="pink">{{ t("user.revenue.communityRule") }}</span>
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

const accountStatus = ref('');
const isLoading = ref(false);

// Withdraw modal state
const showWithdrawModal = ref(false);

async function fetchBalance() {
  try {
    const res = await api.balance();
    const data = res as any;

    if (data.code == 200 || data.code == 0) {
      availableJpy.value = data.data.balance?.available_jpy || 0;
      pendingJpy.value = data.data.balance?.pending_jpy || 0;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
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
  if (accountStatus.value == 'success') {
    try {
      isLoading.value = true;
      const res = await api.benefit();
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
  } else if (accountStatus.value == 'failed') {
    handleViewAccount()
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

onMounted(() => {
  fetchBalance();
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

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}


</script>

<style scoped lang="scss">
.user-revenue {
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
.content {
}
.metrics {
  display: flex;
  gap: 30px;
  margin: 0 0 24px;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 146px;
  border: 2px solid #161122;
  border-radius: 14px;
  padding: 24px;
  background: #FFFDF7;
}
.metric.fans {
  border-top: 5px solid #FF4D8D;
}
.metric.comments {
  border-top: 5px solid #FF9E45;
}
.metric-label {
  color: #161122;
  font-size: 14px;
  font-weight: 500;
}
.metric-value {
  margin-top: 16px;
  font-weight: 700;
  font-size: 32px;
  color: #161122;
}
.metric-value.pink {
  color: #FF4D8D;
}
.metric-value.orange {
  color: #FF9E45;
}

.withdraw-banner {
  .banner-left {
    .banner-tip {
      font-size: 12px;
      color: #161122;
      margin-bottom: 24px;
      .pink {
        color: #FF4D8D;
      }
    }
  }

  .btn-group {
    display: flex;
    gap: 24px;
    align-items: center;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .withdraw-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 136px;
    height: 48px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;

    img {
      width: 24px;
      height: 24px;
    }

    &.primary {
      background: #FF4D8D;
      border: 2.5px solid #161122;
      border-radius: 13px;
      color: #FFFFFF;
      box-shadow: 3px 3px 0 #161122;

      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 2px 2px 0 #161122;
      }
    }

    &.secondary {
      background: #FFFDF7;
      border: 2.5px solid #161122;
      border-radius: 13px;
      color: #161122;
      box-shadow: 3px 3px 0 #161122;

      &:hover {
        color: #FF4D8D;
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 2px 2px 0 #161122;
      }
    }
  }
}

.tabs {
  display: flex;
  gap: 30px;
  padding: 0 36px 20px;
  position: relative;
  border-bottom: 2.5px solid #161122;
}
.tabs span {
  height: auto;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #161122;
  position: relative;
  padding: 6px 0;
}
.tabs span.on {
  font-weight: 700;
  color: #161122;
}
.tabs span.on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -20px;
  height: 4px;
  background: #FF4D8D;
  border-radius: 2px;
}
.block {
  border: 2px solid #161122;
  border-radius: 13px;
  padding: 0;
  background: #FFFDF7;
}
.block-title {
  display: flex;
  align-items: center;
  height: 40px;
  font-size: 14px;
  font-weight: 700;
  padding: 0 36px;
  color: #161122;
}
.block.overall {
  border-color: #161122;
}
.block.overall .block-title {
  color: #FF4D8D;
  background: #FFF0F5;
  border-bottom: 2.5px solid #FF4D8D;
}
.block.work {
  border-color: #161122;
}
.block.work .block-title {
  color: #00D3F2;
  background: #F0FFFE;
  border-bottom: 2.5px solid #00D3F2;
}
.block-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  margin: 24px 0;
}

.date-range {
  display: flex;
  align-items: center;
}
.date-range input {
  height: 28px;
  border: none;
  outline: none;
  color: #161122;
  background: transparent;
}
.download {
  height: 40px;
  padding: 0 12px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #00D3F2;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 #161122;
  }
}
.block.overall .download {
  background: #FF4D8D;
}
.block.work .download {
  background: #00D3F2;
}
.dl-icon {
  width: 16px;
  height: 16px;
}

.table {
  border: 2px solid #161122;
  border-radius: 13px;
  overflow: hidden;
  margin: 0 36px;
}
.thead,
.tr {
  display: grid;
}
.table.overall {
  border-color: #161122;
}
.table.work {
  border-color: #161122;
}
.table.record {
  border-color: #161122;
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
  height: 52px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
}
.num-green {
  color: #05DF72;
  font-weight: 700;
}
.num-red {
  color: #FF4D64;
  font-weight: 700;
}
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 360px;
  padding: 20px;
  border-radius: 18px;
  background: #FFFDF7;
  border: 2px solid #161122;
  position: relative;
  text-align: center;
}
.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}
.modal-close img {
  width: 16px;
  height: 16px;
}
.modal-title {
  font-size: 14px;
  color: #161122;
  margin-bottom: 10px;
  font-weight: 500;
}
.modal-amount {
  font-size: 30px;
  color: #FF9E45;
  margin-bottom: 12px;
  font-weight: 700;
}
.modal-confirm {
  height: 40px;
  padding: 0 16px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 #161122;
  }
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.table.overall .thead,
.table.overall .tr {
  border-bottom: 2.5px solid #161122;
}
.table.work .thead,
.table.work .tr {
  border-bottom: 2.5px solid #161122;
}
.table.record .thead,
.table.record .tr {
  border-bottom: 2.5px solid #161122;
}
.th {
  color: #161122;
  font-weight: 700;
  background: #FFF0F5;
}
td {
  color: #161122;
}
.table.overall .th {
  background: #FFF0F5;
}
.table.work .th {
  background: #F0FFFE;
}
.table.record .th {
  background: #FFF0F5;
}
.table.overall .tbody .tr:hover {
  background: #FFF0F5;
}
.table.work .tbody .tr:hover {
  background: #F0FFFE;
}
.table.record .tbody .tr:hover {
  background: #FFF0F5;
}
.block .pagination {
  margin: 24px 0;
  justify-content: center;
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
  .metrics {
    flex-direction: column;
    gap: 16px;
  }
  .metric {
    min-height: auto;
    padding: 20px;
  }
  .metric-value {
    font-size: 24px;
  }
  .withdraw-banner .btn-group {
    flex-wrap: wrap;
    gap: 12px;
  }
  .table {
    margin: 0 16px;
    overflow-x: auto;
  }
  .block-tools {
    flex-wrap: wrap;
    gap: 12px;
    padding: 0 16px;
  }
  .modal {
    width: min(360px, calc(100vw - 32px));
  }
}
@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .content {
    padding: 16px;
  }
  .metric {
    padding: 16px;
  }
  .metric-value {
    font-size: 20px;
  }
  .withdraw-btn {
    width: 100%;
    min-width: auto;
  }
  .tabs {
    padding: 0 16px 16px;
    gap: 16px;
  }
  .th, .td {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
