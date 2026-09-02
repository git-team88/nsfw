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
            <div class="metric token-withdrawable">
              <img class="metric-bg-icon" src="@/assets/images/user/usdt_icon.png" alt="" />
              <div class="metric-label">{{ t("user.revenue.pending") }}</div>
              <div class="metric-value">
                {{ tokenBalance != null ? `${formatSci(tokenBalance)} USDT` : "--" }}
              </div>
            </div>
            <div class="metric token-withdrawing">
              <div class="metric-label">{{ t("user.revenue.tokenWithdrawing") }}</div>
              <div class="metric-value">
                {{ tokenWithdrawing != null ? `${formatSci(tokenWithdrawing)} USDT` : "--" }}
              </div>
            </div>
            <div class="token-info">
              <div class="info-tip">
                <img class="info-icon" src="@/assets/images/publish/info.png" alt="" />
                {{ t("user.revenue.tokenWithdrawTip") }}
              </div>
              <div class="btn-group">
                <button class="withdraw-btn secondary" @click="showTokenWithdrawRecordModal = true">
                  {{ t("user.revenue.withdrawRecord") }}
                </button>
                <button class="withdraw-btn primary" @click="handleTokenWithdraw">
                  {{ t("user.revenue.withdraw") }}
                </button>
              </div>
            </div>
          </div>

          <div class="cash-section">
            <div class="metric cash-frozen">
              <img class="metric-bg-icon" src="@/assets/images/user/cash_icon.png" alt="" />
              <div class="metric-label">{{ t("user.revenue.withdrawn") }}</div>
              <div class="metric-value">
                {{ pendingJpy != null ? `${formatSci(pendingJpy)} ${t('user.revenue.yen')}` : "--" }}
              </div>
            </div>
            <div class="metric cash-withdrawing">
              <div class="metric-label">{{ t("user.revenue.cashPending") }}</div>
              <div class="metric-value">
                {{ availableJpy != null ? `${formatSci(availableJpy)} ${t('user.revenue.yen')}` : "--" }}
              </div>
            </div>
            <div class="cash-info">
              <div class="info-tip">
                <img class="info-icon" src="@/assets/images/publish/info.png" alt="" />
                {{ t("user.revenue.cashWithdrawTip") }}
              </div>
              <div class="cash-btn-group">
                <button class="withdraw-btn secondary" @click="openWithdrawRecord">
                  {{ t("user.revenue.cashWithdrawRecord") }}
                </button>
                <button class="withdraw-btn primary" @click="openCashWithdrawModal">
                  {{ t("user.revenue.cashWithdraw") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TokenWithdrawRecordModal
      :visible="showTokenWithdrawRecordModal"
      @close="showTokenWithdrawRecordModal = false"
    />

    <TokenWithdrawModal
      :visible="showTokenWithdrawModal"
      :amount="tokenBalance"
      @close="showTokenWithdrawModal = false"
    />

    <WithdrawModal
      :visible="showCashWithdrawModal"
      :total-withdrawable="availableJpy"
      @close="showCashWithdrawModal = false"
      @confirm="confirmCashWithdraw"
    />

    <KycRequiredModal :visible="showKycRequiredModal" :message="t('user.revenue.kycRequiredMessage')" @close="showKycRequiredModal = false" />
    <KycReviewingModal :visible="showKycReviewingModal" :message="t('user.revenue.kycReviewingMessage')" @close="showKycReviewingModal = false" />

    <UploadMask :visible="isLoading" :text="t('loading')" />

    <CountrySelectModal :visible="showCountrySelectModal" @close="showCountrySelectModal = false" @select="handleCountrySelected" />
  </div>
</template>

<script setup lang="ts" name="UserRevenue">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import TokenWithdrawModal from "@/components/TokenWithdrawModal.vue";
import TokenWithdrawRecordModal from "@/components/TokenWithdrawRecordModal.vue";
import WithdrawModal from "@/components/WithdrawModal.vue";
import KycRequiredModal from "@/components/KycRequiredModal.vue";
import KycReviewingModal from "@/components/KycReviewingModal.vue";
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

const showTokenWithdrawModal = ref(false);
const showTokenWithdrawRecordModal = ref(false);
const showCashWithdrawModal = ref(false);
const showKycRequiredModal = ref(false);
const showKycReviewingModal = ref(false);
const showCountrySelectModal = ref(false);

const kycStatusChecked = ref(false);

const tokenBalance = ref<number | string | null>(null);
const tokenWithdrawing = ref<number | string | null>(null);

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

async function fetchTokenBalance() {
  try {
    const res = await api.tokenBalance();
    const data = res as any;
    if (data.code == 200 || data.code == 0) {
      tokenBalance.value = data.data?.balanceInfo?.balance_available ?? 0;
      tokenWithdrawing.value = data.data?.balanceInfo?.balance_frozen ?? 0;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
  }
}

async function handleTokenWithdraw() {
  if (!tokenBalance.value || Number(tokenBalance.value) <= 0) {
    toast(t("user.revenue.noProfit"));
    return;
  }

  if (Number(tokenBalance.value) < 2) {
    toast(t("user.revenue.withdrawMinTip"));
    return;
  }

  if (!kycStatusChecked.value) {
    await fetchKycDetail();
    if (!kycStatusChecked.value) return;
  }

  showTokenWithdrawModal.value = true;
}

async function fetchKycDetail() {
  try {
    const kycRes = (await api.kycDetail()) as any;
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;
      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        showKycRequiredModal.value = true;
      } else {
        const status = kycData.status;
        if (status == 0 || status == '0' || status == 2 || status == '2') {
          showKycReviewingModal.value = true;
        } else {
          kycStatusChecked.value = true;
        }
      }
    } else {
      toast(locale.value == 'en' ? kycRes.msg : locale.value == 'zh' ? kycRes.msg_cn : locale.value == 'tc' ? kycRes.msg_tc : kycRes.msg_jp);
    }
  } catch (e) {
    console.error(e);
  }
}

function openCashWithdrawModal() {
  if (availableJpy.value && availableJpy.value > 0) {
    showCashWithdrawModal.value = true;
  } else {
    toast(t("user.revenue.noProfit"));
  }
}

function confirmCashWithdraw() {
  showCashWithdrawModal.value = false;
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
  // showCountrySelectModal.value = true;
  handleCountrySelected('JP');
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
  fetchTokenBalance();
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

function formatSci(n: number | string | null) {
  if (n == null) return "";
  const num = Number(n);
  if (!Number.isInteger(num)) {
    return parseFloat(num.toFixed(8)).toLocaleString();
  }
  return num.toLocaleString();
}
</script>

<style scoped lang="scss">
.user-revenue {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
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
  padding: 24px 16px;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
  background: #1a1a1a;
}
.panel-top {
  display: flex;
  align-items: baseline;
  margin: 0 0 20px;
  gap: 20px;
}
.panel-title {
  width: 56px;
  height: 42px;
  font-weight: 900;
  font-size: 28px;
  color: #f5f5f5;
  white-space: nowrap;
  line-height: 42px;
}
.panel-tip {
  font-size: 16px;
  color: #777;
  font-weight: 500;
  white-space: nowrap;
  line-height: 24px;
  .pink {
    color: #ff4f9a;
  }
}

.token-section {
  display: flex;
  align-items: stretch;
  gap: 10px;
  background: rgba(255,255,255,0.06);
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  padding: 14px;
  margin-bottom: 14px;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  padding: 14px;
  position: relative;
  overflow: hidden;
}
.metric-bg-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  width: 70px;
  height: 70px;
  transform: translateY(-50%);
  pointer-events: none;
}
.metric.token-withdrawable {
  background: linear-gradient(90deg, rgba(27,162,122,0) 0%, #1BA27A 100%);
}
.metric.token-withdrawing {
  background: linear-gradient(90deg, rgba(27,162,122,0) 0%, #1BA27A 100%);
}
.metric-label {
  color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 24px;
}
.metric-value {
  margin-top: 16px;
  font-weight: 700;
  font-size: 28px;
  color: #f5f5f5;
  white-space: normal;
  word-break: break-word;
  line-height: 36px;
}

.token-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.token-info .info-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #777;
  font-weight: 500;
  line-height: 24px;
  white-space: pre-line;
}
.info-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
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
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.06);
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  padding: 14px;
  margin-bottom: 14px;
}
.metric.cash-frozen {
  background: linear-gradient(90deg, rgba(251,188,5,0) 0%, #FBBC05 100%);
}
.metric.cash-withdrawing {
  background: linear-gradient(90deg, rgba(251,188,5,0) 0%, #FBBC05 100%);
}
.cash-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.cash-info .info-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  color: #777;
  font-weight: 500;
  line-height: 24px;
}
.cash-btn-group {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 18px;
  margin-left: auto;
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
  transition: transform 0.1s;
  border-radius: 14px;
  box-shadow: none;

  &.primary {
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    border: 2px solid #ff9aca;
    color: #FFFFFF;
    box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  }

  &.secondary {
    background: rgba(255,255,255,0.06);
    border: 1px solid #3d3d3d;
    color: #f5f5f5;

    &:hover {
      color: #ff4f9a;
    }
  }
}

.tabs {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  border-bottom: 1px solid #303030;
  padding: 0;
  background: transparent;
}
.tabs span {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 8px;
  font-size: 15px;
  font-weight: 900;
  color: #555;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s;
}
.tabs span.on {
  color: #e7e7e7;
}
.tabs span.on::after {
  content: "";
  position: absolute;
  right: 8px;
  bottom: -1px;
  left: 8px;
  height: 4px;
  border-radius: 4px 4px 0 0;
  background: #ff4f9a;
}
.tabs span:hover:not(.on) {
  color: #aaa;
}
.block {
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  padding: 0;
  background: #1a1a1a;
}
.block-title {
  display: flex;
  align-items: center;
  height: 40px;
  font-size: 14px;
  font-weight: 700;
  padding: 0 36px;
  color: #f5f5f5;
}
.block.overall {
  border-color: #3d3d3d;
}
.block.overall .block-title {
  color: #ff4f9a;
  background: rgba(255,79,154,0.12);
  border-bottom: 1px solid #ff4f9a;
}
.block.work {
  border-color: #3d3d3d;
}
.block.work .block-title {
  color: #00D3F2;
  background: rgba(0,211,242,0.12);
  border-bottom: 1px solid #00D3F2;
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
  color: #f5f5f5;
  background: transparent;
}
.download {
  height: 40px;
  padding: 0 12px;
  border: 2px solid #00D3F2;
  border-radius: 14px;
  background: #00D3F2;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 0 16px rgba(0, 211, 242, .3);
  transition: transform 0.1s;
}
.block.overall .download {
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  border: 2px solid #ff9aca;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
}
.block.work .download {
  background: #00D3F2;
  border: 2px solid #00D3F2;
  box-shadow: 0 0 16px rgba(0, 211, 242, .3);
}
.dl-icon {
  width: 16px;
  height: 16px;
}

.table {
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  overflow: hidden;
  margin: 0 36px;
}
.thead,
.tr {
  display: grid;
}
.table.overall {
  border-color: #3d3d3d;
}
.table.work {
  border-color: #3d3d3d;
}
.table.record {
  border-color: #3d3d3d;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 360px;
  padding: 20px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
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
  background: rgba(255,255,255,0.06);
  border: 1px solid #3d3d3d;
  box-shadow: none;
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
  color: #f5f5f5;
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
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  border: 2px solid #ff9aca;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(255, 61, 134, .25);
  transition: box-shadow 0.1s;
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.table.overall .thead,
.table.overall .tr {
  border-bottom: 1px solid #2c2c2c;
}
.table.work .thead,
.table.work .tr {
  border-bottom: 1px solid #2c2c2c;
}
.table.record .thead,
.table.record .tr {
  border-bottom: 1px solid #2c2c2c;
}
.th {
  color: #f5f5f5;
  font-weight: 700;
  background: rgba(255,79,154,0.12);
}
td {
  color: #f5f5f5;
}
.table.overall .th {
  background: rgba(255,79,154,0.12);
}
.table.work .th {
  background: rgba(0,211,242,0.12);
}
.table.record .th {
  background: rgba(255,79,154,0.12);
}
.table.overall .tbody .tr:hover {
  background: rgba(255,79,154,0.06);
}
.table.work .tbody .tr:hover {
  background: rgba(0,211,242,0.06);
}
.table.record .tbody .tr:hover {
  background: rgba(255,79,154,0.06);
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
  .cash-section {
    flex-direction: column;
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
  .metric-value {
    font-size: 20px;
  }
  .withdraw-btn {
    width: 100%;
    min-width: auto;
  }
  .tabs {
    flex-wrap: wrap;
    gap: 16px;
  }
  .tabs span {
    font-size: 13px;
  }
  .th, .td {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
