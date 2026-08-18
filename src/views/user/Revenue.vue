<template>
  <div class="user-revenue">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>

    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.sidebar.revenue") }}</div>
          <div class="panel-tip">
            {{ t("user.revenue.withdrawTip") }}
            <span class="pink">{{ t("user.revenue.communityRule") }}</span>
            {{ t("user.revenue.withdrawTipEnd") }}
          </div>
        </div>

        <div class="content">
          <div class="token-section">
            <div class="token-metrics">
              <div class="metric token-withdrawable">
                <div class="metric-label">{{ t("user.revenue.pending") }}</div>
                <div class="metric-value">
                  {{ availableJpy != null ? `${formatSci(availableJpy)}` : "--" }}
                </div>
                <img class="metric-icon" src="@/assets/images/user/withdraw_icon.png" alt="" />
              </div>
              <div class="metric token-withdrawing">
                <div class="metric-label">{{ t("user.revenue.tokenWithdrawing") }}</div>
                <div class="metric-value">
                  {{ pendingJpy != null ? `${formatSci(pendingJpy)}` : "--" }}
                </div>
              </div>
            </div>
            <div class="token-info">
              <div class="info-tip">{{ t("user.revenue.tokenWithdrawTip") }}</div>
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

          <div class="cash-section">
            <div class="cash-metrics">
              <div class="metric cash-frozen">
                <div class="metric-label">{{ t("user.revenue.withdrawn") }}</div>
                <div class="metric-value">
                  {{ pendingJpy != null ? `${formatSci(pendingJpy)}` : "--" }}
                </div>
                <img class="metric-icon" src="@/assets/images/user/withdraw_icon.png" alt="" />
              </div>
            </div>
            <div class="cash-info">
              <div class="info-tip">{{ t("user.revenue.cashWithdrawTip") }}</div>
              <button class="withdraw-btn secondary cash-record-btn" @click="openWithdrawRecord">
                {{ t("user.revenue.cashWithdrawRecord") }}
              </button>
            </div>
            <div class="cash-withdrawing-card">
              <div class="metric cash-withdrawing">
                <div class="metric-label">{{ t("user.revenue.cashWithdrawing") }}</div>
                <div class="metric-value">
                  {{ availableJpy != null ? `${formatSci(availableJpy)}` : "--" }}
                </div>
              </div>
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

    <CountrySelectModal :visible="showCountrySelectModal" @close="showCountrySelectModal = false" @select="handleCountrySelected" />
  </div>
</template>

<script setup lang="ts" name="UserRevenue">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import WithdrawModal from "@/components/WithdrawModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import CountrySelectModal from "@/components/CountrySelectModal.vue";
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
const showCountrySelectModal = ref(false);

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

function handleCreateAccount() {
  showCountrySelectModal.value = true;
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
  border: 3px solid #101828;
  border-radius: 12px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
  background: #FEFDF8;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 20px;
}
.panel-title {
  width: 56px;
  height: 42px;
  font-weight: 900;
  font-size: 28px;
  color: #101828;
  letter-spacing: -0.3px;
  white-space: nowrap;
  line-height: 42px;
}
.panel-tip {
  font-size: 16px;
  color: #99A1AF;
  letter-spacing: -0.15px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 24px;
  margin-top: 13px;
  .pink {
    color: #FF4D8E;
  }
}

.content {
}
.token-section {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #101828;
  padding: 0;
  margin-bottom: 14px;
}
.token-metrics {
  display: flex;
  gap: 14px;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 12px;
  border: 2px solid #101828;
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.metric.token-withdrawable {
  width: 484px;
  height: 134px;
  margin: 20px 0 20px 20px;
  background: #FFFDF7;
}
.metric.token-withdrawing {
  width: 484px;
  height: 134px;
  margin: 20px 0;
  background: #FFFDF7;
}
.metric-label {
  color: #101828;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 24px;
}
.metric-value {
  margin-top: 20px;
  font-weight: 700;
  font-size: 32px;
  color: #101828;
  letter-spacing: -0.5px;
  white-space: nowrap;
  line-height: 40px;
}
.metric-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 120px;
  height: 120px;
}

.token-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 30px 20px 20px 54px;
  height: 134px;
}
.token-info .info-tip {
  font-size: 16px;
  color: #99A1AF;
  letter-spacing: -0.15px;
  font-weight: 500;
  line-height: 24px;
}
.btn-group {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 18px;
  margin-left: auto;
}

.cash-section {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #101828;
  padding: 0;
  margin-bottom: 14px;
  position: relative;
}
.cash-metrics {
  display: flex;
  gap: 14px;
}
.metric.cash-frozen {
  width: 484px;
  height: 134px;
  margin: 20px 0 20px 20px;
  background: #FFFDF7;
}
.cash-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 30px 20px 20px 0;
  height: 114px;
}
.cash-info .info-tip {
  font-size: 16px;
  color: #99A1AF;
  letter-spacing: -0.15px;
  font-weight: 500;
  line-height: 24px;
}
.cash-record-btn {
  margin-left: auto;
  margin-top: 18px;
}
.cash-withdrawing-card {
  position: relative;
}
.metric.cash-withdrawing {
  width: 484px;
  height: 134px;
  margin: 20px 20px 20px 0;
  background: #FFFDF7;
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
  border-radius: 12px;

  &.primary {
    background: #FF4D8E;
    border: 2px solid #101828;
    color: #FFFFFF;

    &:hover {
      transform: translate(-1px, -1px);
    }

    &:active {
      transform: translate(1px, 1px);
    }
  }

  &.secondary {
    background: #FFFFFF;
    border: 2px solid #101828;
    color: #101828;

    &:hover {
      color: #FF4D8E;
    }

    &:active {
      transform: translate(1px, 1px);
    }
  }
}

.tabs {
  display: flex;
  gap: 30px;
  padding: 0 36px 20px;
  position: relative;
  border-bottom: 2.5px solid #101828;
}
.tabs span {
  height: auto;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #101828;
  position: relative;
  padding: 6px 0;
}
.tabs span.on {
  font-weight: 700;
  color: #101828;
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
  border: 2px solid #101828;
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
  color: #101828;
}
.block.overall {
  border-color: #101828;
}
.block.overall .block-title {
  color: #FF4D8D;
  background: #FFF0F5;
  border-bottom: 2.5px solid #FF4D8D;
}
.block.work {
  border-color: #101828;
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
  color: #101828;
  background: transparent;
}
.download {
  height: 40px;
  padding: 0 12px;
  border: 2.5px solid #101828;
  border-radius: 13px;
  background: #00D3F2;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 3px 3px 0 #101828;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #101828;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 #101828;
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
  border: 2px solid #101828;
  border-radius: 13px;
  overflow: hidden;
  margin: 0 36px;
}
.thead,
.tr {
  display: grid;
}
.table.overall {
  border-color: #101828;
}
.table.work {
  border-color: #101828;
}
.table.record {
  border-color: #101828;
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
  border: 2px solid #101828;
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
  border: 2px solid #101828;
  box-shadow: 2px 2px 0 #101828;
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
  color: #101828;
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
  border: 2.5px solid #101828;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 3px 3px 0 #101828;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #101828;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 #101828;
  }
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.table.overall .thead,
.table.overall .tr {
  border-bottom: 2.5px solid #101828;
}
.table.work .thead,
.table.work .tr {
  border-bottom: 2.5px solid #101828;
}
.table.record .thead,
.table.record .tr {
  border-bottom: 2.5px solid #101828;
}
.th {
  color: #101828;
  font-weight: 700;
  background: #FFF0F5;
}
td {
  color: #101828;
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
  .token-section {
    flex-direction: column;
  }
  .token-metrics {
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .metric.token-withdrawable,
  .metric.token-withdrawing {
    width: auto;
    margin: 0;
  }
  .token-info {
    padding: 16px 20px 20px 0;
    margin-left: 20px;
  }
  .cash-section {
    flex-direction: column;
  }
  .metric.cash-frozen {
    width: auto;
    margin: 0;
  }
  .cash-info {
    padding: 16px 20px 20px 0;
    margin-left: 20px;
  }
  .metric.cash-withdrawing {
    width: auto;
    margin: 0;
  }
  .metric-value {
    font-size: 24px;
  }
  .btn-group {
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
  .panel-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .panel-tip {
    white-space: normal;
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
