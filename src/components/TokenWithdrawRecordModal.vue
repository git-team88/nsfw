<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal record-modal">
      <div class="modal-header">
        <span class="modal-title">{{ t("user.revenue.tokenWithdrawDetail") }}</span>
        <button class="modal-close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="record-table">
        <div class="record-thead">
          <span class="col col-status">{{ t("user.revenue.recordStatus") }}</span>
          <span class="col col-amount">{{ t("user.revenue.recordAmount") }}</span>
          <span class="col col-real-amount">
            <span>{{ t("user.revenue.recordRealAmount") }}</span>
            <span class="real-amount-header-fee">{{ t('user.revenue.deductFee') }}</span>
          </span>
          <span class="col col-apply-time">{{ t("user.revenue.recordApplyTime") }}</span>
          <span class="col col-success-time">{{ t("user.revenue.recordSuccessTime") }}</span>
          <span class="col col-wallet">{{ t("user.revenue.recordWallet") }}</span>
        </div>
        <div class="record-tbody">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('loading') }}</div>
          </div>
          <template v-else>
            <div class="record-row" v-for="(item, index) in records" :key="index">
              <span class="col col-status" :class="statusClass(item.status)">{{ statusText(item.status) }}</span>
              <span class="col col-amount">{{ trimTrailingZeros(item.amount) }} USDT</span>
              <span class="col col-real-amount">
                <span class="real-amount-value">{{ trimTrailingZeros(item.real_amount) }} USDT</span>
              </span>
              <span class="col col-apply-time">{{ item.created_at }}</span>
              <span class="col col-success-time">{{ item.completed_at || '--' }}</span>
              <span class="col col-wallet">{{ formatWallet(item.to_wallet) }}</span>
            </div>
            <div class="no-data" v-if="records.length === 0">
              <img class="no-data-icon" src="@/assets/images/base/no_data.png" alt="" />
              <span>{{ t("user.revenue.noData") }}</span>
            </div>
          </template>
        </div>
      </div>

      <div class="record-pagination" v-if="total > pageSize">
        <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="TokenWithdrawRecordModal">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Pagination from "@/components/Pagination.vue";
import api from "@/api/index";

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

defineEmits<{
  close: [];
}>();

interface WithdrawRecord {
  status: string;
  amount: string;
  real_amount: string;
  fee: string;
  created_at: string;
  completed_at: string | null;
  to_wallet: string;
}

const records = ref<WithdrawRecord[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);

function trimTrailingZeros(value: string) {
  if (!value) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return String(num);
}

function formatWallet(address: string) {
  if (!address || address.length <= 10) return address;
  return address.slice(0, 6) + '...' + address.slice(-4);
}

function statusText(status: string | number) {
  if (status === 'success' || status === '1' || status === 1) return t('user.revenue.withdrawSuccess');
  return t('user.revenue.withdrawPending');
}

function statusClass(status: string | number) {
  if (status === 'success' || status === '1' || status === 1) return 'success';
  return 'pending';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await api.getCoinWithdrawList(page.value, pageSize.value) as any;
    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || res.data || [];
      records.value = data;
      total.value = res.data?.allnums || 0;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    page.value = 1;
    fetchData();
  }
});

watch(page, () => {
  if (props.visible) {
    fetchData();
  }
});
</script>

<style scoped lang="scss">
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
  width: 980px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  overflow: hidden;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  position: relative;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}
.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #f5f5f5;
  letter-spacing: -0.3px;
  white-space: nowrap;
  line-height: 30px;
}
.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #1a1a1a;
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

.record-table {
  margin: 20px;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  overflow: hidden;
}
.record-thead {
  display: flex;
  align-items: center;
  min-height: 56px;
  background: rgba(255, 79, 154, 0.15);
}
.record-tbody {
  max-height: 400px;
  overflow-y: auto;
}
.record-row {
  display: flex;
  align-items: center;
  min-height: 56px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.col {
  font-size: 16px;
  font-weight: 500;
  color: #f5f5f5;
  white-space: nowrap;
  line-height: 24px;
  padding: 0 4px;
  text-align: center;
}
.record-thead .col {
  font-weight: 600;
}
.col-status {
  flex: 0 0 100px;
  padding-left: 14px;
  &.pending {
    color: #f5f5f5;
  }
  &.success {
    color: #34A853;
  }
}
.col-amount {
  flex: 0 0 160px;
  font-weight: 700;
  padding-right: 10px;
  text-align: left;
}
.record-thead .col-amount {
  text-align: left;
}
.col-real-amount {
  flex: 0 0 160px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding-right: 10px;
}
.record-thead .col-real-amount {
  align-items: flex-start;
}
.real-amount-value {
  font-size: 16px;
  font-weight: 700;
  color: #f5f5f5;
}
.real-amount-header-fee {
  font-size: 12px;
  font-weight: 500;
  color: #f5f5f5;
}
.col-apply-time {
  flex: 1;
}
.col-success-time {
  flex: 1;
}
.col-wallet {
  flex: 1;
  padding-right: 14px;
}
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  font-size: 14px;
  color: #777;
  gap: 12px;
}
.no-data-icon {
  width: 120px;
  height: 120px;
  opacity: 0.6;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.08);
    border-top: 4px solid #f5f5f5;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 20px;
  }

  .loading-text {
    font-size: 14px;
    color: #777;
    font-weight: 600;
  }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.record-pagination {
  margin: 16px 20px 20px;
}

@media (max-width: 768px) {
  .modal {
    width: calc(100vw - 32px);
  }
  .col {
    font-size: 12px;
    padding: 0 6px;
  }
  .col-status {
    flex: 0 0 70px;
    padding-left: 12px;
  }
  .col-amount {
    flex: 0 0 110px;
    font-size: 14px;
    padding-right: 12px;
  }
  .col-real-amount {
    flex: 0 0 110px;
    padding-right: 12px;
  }
  .real-amount-value {
    font-size: 12px;
  }
  .real-amount-fee {
    font-size: 10px;
  }
  .col-wallet {
    padding-right: 12px;
  }
  .record-thead,
  .record-row {
    height: 48px;
  }
}
</style>
