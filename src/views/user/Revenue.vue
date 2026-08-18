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
              <div class="metric-label">{{ t("user.revenue.pending") }}</div>
              <div class="metric-value">
                {{ availableJpy != null ? `${formatSci(availableJpy)} USDT` : "--" }}
              </div>
            </div>
            <div class="metric token-withdrawing">
              <div class="metric-label">{{ t("user.revenue.tokenWithdrawing") }}</div>
              <div class="metric-value">
                {{ pendingJpy != null ? `${formatSci(pendingJpy)} USDT` : "--" }}
              </div>
            </div>
            <div class="token-info">
              <div class="info-tip">
                <img class="info-icon" src="@/assets/images/user/info.png" alt="" />
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
              <div class="metric-label">{{ t("user.revenue.withdrawn") }}</div>
              <div class="metric-value">
                {{ pendingJpy != null ? `${formatSci(pendingJpy)} 日元` : "--" }}
              </div>
            </div>
            <div class="metric cash-withdrawing">
              <div class="metric-label">{{ t("user.revenue.cashWithdrawing") }}</div>
              <div class="metric-value">
                {{ availableJpy != null ? `${formatSci(availableJpy)} 日元` : "--" }}
              </div>
            </div>
            <div class="cash-info">
              <div class="info-tip">
                <img class="info-icon" src="@/assets/images/user/info.png" alt="" />
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
      :records="tokenWithdrawRecords"
      @close="showTokenWithdrawRecordModal = false"
    />

    <TokenWithdrawModal
      :visible="showTokenWithdrawModal"
      :amount="availableJpy"
      @close="showTokenWithdrawModal = false"
      @confirm="confirmTokenWithdraw"
    />

    <WithdrawModal
      :visible="showCashWithdrawModal"
      :total-withdrawable="availableJpy"
      @close="showCashWithdrawModal = false"
      @confirm="confirmCashWithdraw"
    />

    <KycRequiredModal :visible="showKycRequiredModal" @close="showKycRequiredModal = false" />
    <KycReviewingModal :visible="showKycReviewingModal" @close="showKycReviewingModal = false" />

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

interface TokenWithdrawRecord {
  status: string;
  statusText: string;
  applyTime: string;
  successTime: string;
  walletAddress: string;
  amount: string;
}

const tokenWithdrawRecords = ref<TokenWithdrawRecord[]>([]);

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

async function handleTokenWithdraw() {
  if (!availableJpy.value || availableJpy.value <= 0) {
    toast(t("user.revenue.noProfit"));
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

function confirmTokenWithdraw() {
  showTokenWithdrawModal.value = false;
  toast(t("user.revenue.withdrawSuccess"));
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
  border: 3px solid #161122;
  border-radius: 12px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
  background: #FEFDF8;
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
  color: #161122;
  white-space: nowrap;
  line-height: 42px;
}
.panel-tip {
  font-size: 16px;
  color: #99A1AF;
  font-weight: 500;
  white-space: nowrap;
  line-height: 24px;
  .pink {
    color: #FF4D8E;
  }
}

.token-section {
  display: flex;
  align-items: stretch;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #161122;
  padding: 20px;
  margin-bottom: 14px;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 12px;
  border: 2px solid #161122;
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.metric.token-withdrawable {
  background: #FFFDF7;
}
.metric.token-withdrawing {
  background: #FFFDF7;
}
.metric-label {
  color: #161122;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 24px;
}
.metric-value {
  margin-top: 16px;
  font-weight: 700;
  font-size: 28px;
  color: #161122;
  white-space: nowrap;
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
  color: #99A1AF;
  font-weight: 500;
  line-height: 24px;
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
  align-items: stretch;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #161122;
  padding: 20px;
  margin-bottom: 14px;
}
.metric.cash-frozen {
  background: #FFFDF7;
}
.metric.cash-withdrawing {
  background: #FFFDF7;
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
  color: #99A1AF;
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
  transition: transform 0.1s, box-shadow 0.1s;
  border-radius: 12px;
  box-shadow: 3px 3px 0 #101828;

  &.primary {
    background: #FF4D8E;
    border: 2px solid #101828;
    color: #FFFFFF;

    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 #101828;
    }

    &:active {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 #101828;
    }
  }

  &.secondary {
    background: #FFFFFF;
    border: 2px solid #101828;
    color: #101828;

    &:hover {
      color: #FF4D8E;
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 #101828;
    }

    &:active {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 #101828;
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
  .token-section {
    flex-direction: column;
    gap: 12px;
  }
  .cash-section {
    flex-direction: column;
    gap: 12px;
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
