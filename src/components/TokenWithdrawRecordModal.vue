<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
    <div class="modal record-modal">
      <div class="modal-header">
        <span class="modal-title">{{ t("user.revenue.tokenWithdrawDetail") }}</span>
        <button class="modal-close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#101828" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="record-table">
        <div class="record-thead">
          <span class="col col-status">{{ t("user.revenue.recordStatus") }}</span>
          <span class="col col-apply-time">{{ t("user.revenue.recordApplyTime") }}</span>
          <span class="col col-success-time">{{ t("user.revenue.recordSuccessTime") }}</span>
          <span class="col col-wallet">{{ t("user.revenue.recordWallet") }}</span>
          <span class="col col-amount">{{ t("user.revenue.recordAmount") }}</span>
        </div>
        <div class="record-tbody">
          <div class="record-row" v-for="(item, index) in records" :key="index">
            <span class="col col-status" :class="{ pending: item.status === 'pending' }">{{ item.statusText }}</span>
            <span class="col col-apply-time">{{ item.applyTime }}</span>
            <span class="col col-success-time">{{ item.successTime }}</span>
            <span class="col col-wallet">{{ item.walletAddress }}</span>
            <span class="col col-amount">{{ item.amount }}</span>
          </div>
          <div class="no-data" v-if="records.length === 0">{{ t("user.revenue.noData") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="TokenWithdrawRecordModal">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  visible: boolean;
  records: Array<{
    status: string;
    statusText: string;
    applyTime: string;
    successTime: string;
    walletAddress: string;
    amount: string;
  }>;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style scoped lang="scss">
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
  width: 880px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #101828;
  box-shadow: 3px 3px 0 #101828;
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
  color: #101828;
  letter-spacing: -0.3px;
  white-space: nowrap;
  line-height: 30px;
}
.modal-close {
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

.record-table {
  margin: 20px;
  border: 2px solid #101828;
  border-radius: 12px;
  overflow: hidden;
}
.record-thead {
  display: flex;
  align-items: center;
  height: 56px;
  background: rgba(255, 77, 142, 0.3);
}
.record-tbody {
  max-height: 400px;
  overflow-y: auto;
}
.record-row {
  display: flex;
  align-items: center;
  height: 56px;
  border-top: 1px solid rgba(16, 24, 40, 0.1);
}
.col {
  font-size: 16px;
  font-weight: 500;
  color: #101828;
  white-space: nowrap;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}
.record-thead .col {
  font-weight: 600;
}
.col-status {
  flex: 0 0 100px;
  padding-left: 30px;
  &.pending {
    color: #FF9E45;
  }
}
.col-apply-time {
  flex: 1;
}
.col-success-time {
  flex: 1;
}
.col-wallet {
  flex: 1.5;
}
.col-amount {
  flex: 0 0 120px;
  text-align: right;
  padding-right: 30px;
}
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 14px;
  color: #99A1AF;
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
    flex: 0 0 80px;
    padding-right: 12px;
  }
  .record-thead,
  .record-row {
    height: 48px;
  }
}
</style>
