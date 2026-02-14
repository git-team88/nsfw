<template>
  <div class="user-payment-history">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.paymentHistory.title") }}</div>
          </div>

          <div class="tabs-row">
            <div class="tabs">
              <div
                class="tab-item"
                :class="{ active: activeTab === 'subscribe' }"
                @click="switchTab('subscribe')"
              >
                {{ t("user.paymentHistory.tabSubscribe") }}
              </div>
              <div
                class="tab-item"
                :class="{ active: activeTab === 'recharge' }"
                @click="switchTab('recharge')"
              >
                {{ t("user.paymentHistory.tabRecharge") }}
              </div>
            </div>
            <div class="date-range">
              <DateRangePicker v-model="range" theme="pink" />
            </div>
          </div>

          <div class="loading-box" v-if="loading">
            <img src="@/assets/images/base/load.png" alt="" />
          </div>

          <template v-else>
            <div class="table">
              <div class="tbody">
                <div class="tr" v-for="item in listData" :key="item.id">
                  <div class="td time">{{ item.pay_time }}</div>
                  <div class="td info">{{ t('user.paymentHistory.subscriptionType')}}</div>
                  <div class="td quantity">1</div>
                  <div class="td amount">${{ item.amount }}</div>
                  <div class="td actions">
                    <template v-if="item.is_invoiced === '1'">
                      <button class="btn-view" @click="viewInvoice(item)">
                        {{ t("user.paymentHistory.viewInvoice") }}
                      </button>
                      <button class="btn-download" @click="downloadInvoice(item)">
                        {{ t("user.paymentHistory.downloadInvoice") }}
                      </button>
                    </template>
                    <template v-else>
                      <button class="btn-invoice" @click="openInvoiceModal(item)">
                        {{ t("user.paymentHistory.issueInvoice") }}
                      </button>
                    </template>

                  </div>
                </div>
              </div>
              <EmptyState v-if="!listData.length" />
            </div>

            <div class="pagination-wrap" v-if="total > pageSize">
              <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Invoice Modal -->
    <div class="modal-mask" v-if="showInvoiceModal">
      <div class="modal">
        <img
          class="modal-close"
          src="@/assets/images/base/close.png"
          alt=""
          @click="showInvoiceModal = false"
        />
        <div class="modal-title">{{ t("user.paymentHistory.modalTitle") }}</div>
        <div class="modal-tip">{{ t("user.paymentHistory.modalTip") }}</div>
        <div class="form-item">
          <label>{{ t("user.paymentHistory.emailLabel") }}</label>
          <input
            type="text"
            v-model="invoiceEmail"
            :placeholder="t('user.paymentHistory.emailPlaceholder')"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showInvoiceModal = false">
            {{ t("user.interactive.cancel") }}
          </button>
          <button class="btn-confirm" @click="confirmInvoice">
            {{ t("user.interactive.apply") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import EmptyState from "@/components/EmptyState.vue";
import Pagination from "@/components/Pagination.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";
import api from "@/api/index";
import { toast } from "@/util/toast";

const { t, locale } = useI18n();
const router = useRouter();
const sidebarKey = ref("payment-history");
const activeTab = ref<"subscribe" | "recharge">("subscribe");

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getSevenDaysBeforeCurrent = () => {
  return dayjs().subtract(6, "day").format("YYYY-MM-DD");
};

const range = ref({ start: getSevenDaysBeforeCurrent(), end: getCurrentDate() });

const loading = ref(false);
const listData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const showInvoiceModal = ref(false);
const showPreviewModal = ref(false);
const invoiceEmail = ref("");
const currentItem = ref<any>(null);
const invoiceData = ref({
  number: "",
  date: "",
  amount: 0,
  itemName: "",
});

function generateInvoiceNumber() {
  const chars = "0123456789ABCDEF";
  let res = "";
  for (let i = 0; i < 8; i++) res += chars[Math.floor(Math.random() * 16)];
  res += "-";
  for (let i = 0; i < 4; i++) res += chars[Math.floor(Math.random() * 16)];
  return res;
}

function formatDate(date: Date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function switchTab(tab: "subscribe" | "recharge") {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  listData.value = [];

  try {
    const res = await api.userPayList(page.value, pageSize.value) as any;
    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || res.data || [];

      listData.value = data.filter((item: any) => {
        if (activeTab.value === "subscribe") {
          return item.name !== "AI Tool Recharge";
        } else {
          return item.name === "AI Tool Recharge";
        }
      });

      total.value = res.data?.allnums || 0;
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}

watch([page, range], () => {
  fetchData();
});

function openInvoiceModal(item: any) {
  currentItem.value = item;
  showInvoiceModal.value = true;
}

async function confirmInvoice() {
  if (currentItem.value && invoiceEmail.value) {
    try {
      const res = await api.issueInvoice({
        order_id: currentItem.value.order_id,
        email: invoiceEmail.value
      }) as any;

      if (res.code === 0 || res.code === 200) {
        currentItem.value.is_invoiced = '1';
        showInvoiceModal.value = false;
        invoiceEmail.value = '';
        toast(t('success'));
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    } catch (error) {
      toast(t('fail'));
    }
  } else {
    toast(t('user.paymentHistory.emailRequired'));
  }
}

async function viewInvoice(item: any) {
  try {
    const id = item.order_id;
    if (!id) {
      toast(t('fail'));
      return;
    }

    const res = await api.downInvoice(id) as any;

    if (res instanceof Blob) {
      const url = window.URL.createObjectURL(res);
      window.open(url, '_blank');
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

async function downloadInvoice(item: any) {
  try {
    const id = item.order_id;
    if (!id) {
      toast(t('fail'));
      return;
    }

    const res = await api.downInvoice(id) as any;

    if (res instanceof Blob) {
      const url = window.URL.createObjectURL(res);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  }
}

function downloadPDF() {
  const content = document.getElementById("invoice-content");
  if (!content) return;

  const opt = {
    margin: 0.5,
    filename: `invoice_${invoiceData.value.number}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 1.5, useCORS: true },
    jsPDF: { unit: "in", format: "letter" },
    pagebreak: { mode: "avoid-all" },
  };

  html2pdf().from(content).set(opt).save();
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.invoice-preview-container {
  position: relative;
  width: 80rem;
  max-height: 90vh;
  background: #f5f5f5;
  border-radius: 1.2rem;
  padding: 2.4rem;
  overflow-y: auto;

  .preview-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.6rem;
    margin-bottom: 2rem;

    .btn-download-pdf {
      padding: 0.8rem 1.6rem;
      background: #fb64b6;
      color: #fff;
      border: none;
      border-radius: 0.6rem;
      cursor: pointer;
      font-size: 1.4rem;
    }

    .preview-close {
      width: 2.4rem;
      height: 2.4rem;
      cursor: pointer;
    }
  }
}

.invoice-paper {
  width: 100%;
  min-height: 80rem;
  background: #fff;
  padding: 4rem 3rem;
  box-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.1);
  color: #333;
  font-family: Arial, sans-serif;

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4rem;

    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      .logo-icon {
        width: 2rem;
        height: 2rem;
        background: #0061ff;
        border-radius: 50%;
      }
      .logo-text {
        font-size: 2rem;
        color: #333;
        b {
          font-weight: bold;
        }
        span {
          color: #0061ff;
        }
      }
    }

    .invoice-title {
      font-size: 3rem;
      color: #333;
    }
  }

  .invoice-meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3rem;

    .company-info {
      font-size: 1.2rem;
      line-height: 1.5;
      .company-name {
        font-weight: bold;
        font-size: 1.4rem;
        margin-bottom: 0.3rem;
      }
    }

    .invoice-details {
      text-align: right;
      .detail-item {
        margin-bottom: 0.4rem;
        font-size: 1.2rem;
        .label {
          color: #666;
          margin-right: 0.6rem;
        }
        .value {
          font-weight: 500;
        }
      }
    }
  }

  .bill-to {
    margin-bottom: 3rem;
    .section-label {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 0.3rem;
    }
    .bill-email {
      font-weight: bold;
      font-size: 1.2rem;
    }
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 3rem;

    th {
      text-align: left;
      padding: 0.8rem 0;
      border-bottom: 1px solid #0061ff;
      color: #0061ff;
      font-size: 1.2rem;
      font-weight: 500;
    }

    td {
      padding: 1.2rem 0;
      font-size: 1.2rem;
      color: #333;
    }

    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
  }

  .invoice-summary {
    width: 25rem;
    margin-left: auto;

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.8rem;
      font-size: 1.2rem;

      &.total {
        margin-top: 1.2rem;
        padding-top: 0.8rem;
        font-weight: bold;
        font-size: 1.4rem;
      }

      &.paid {
        font-weight: bold;
      }
    }
  }

  .invoice-footer {
    margin-top: 6rem;
    font-size: 1.1rem;
    color: #666;
  }
}

@media print {
  body * {
    visibility: hidden;
  }
  #invoice-content,
  #invoice-content * {
    visibility: visible;
  }
  #invoice-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none;
    padding: 0;
  }
  .no-print {
    display: none !important;
  }
}

.user-payment-history {
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
  padding: 2.4rem 0;
}
.panel-top {
  margin-bottom: 1.6rem;
  padding: 0 3.6rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}

.tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
  margin-bottom: 2.4rem;
  padding: 0 3.6rem 1.2rem;
}
.tabs {
  display: flex;
  align-items: center;
  gap: 3rem;
  height: 4rem;
}
.tab-item {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 1.6rem;
  color: #6a7282;
  cursor: pointer;
  position: relative;
  &.active {
    color: #101828;
    font-weight: 500;
    &::after {
      content: "";
      position: absolute;
      bottom: -1.2rem;
      left: 0;
      width: 100%;
      height: 2px;
      background: #fb64b6;
      border-radius: 2px;
    }
  }
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40rem;
  img {
    width: 4rem;
    height: 4rem;
    animation: rotate 1.5s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.table {
  padding: 0 3.6rem;
  min-height: 40rem;
}
.tbody {
  border-top: 1px solid rgba(251, 100, 182, 0.05);
}
.tr {
  display: flex;
  align-items: center;
  padding: 1.4rem 2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
  cursor: pointer;

  &:hover {
    background: rgba(251, 100, 182, 0.04);
  }
}
.td {
  font-size: 1.4rem;
  color: #364153;
}
.time {
  width: 17rem;
}
.info {
  flex: 1;
}
.quantity {
  width: 13rem;
  text-align: center;
}
.amount {
  width: 13rem;
  text-align: center;
}
.actions {
  width: 32.4rem;
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
}

.btn-invoice {
  width: 13.6rem;
  height: 4rem;
  background: #fb64b6;
  border-radius: 0.8rem;
  border: none;
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
}

.btn-view {
  width: 13.6rem;
  height: 4rem;
  border: 1px solid #fb64b6;
  border-radius: 0.8rem;
  color: #fb64b6;
  background: none;
  font-size: 1.4rem;
  background: rgba(251, 100, 182, 0.08);
  cursor: pointer;
}

.btn-download {
  width: 13.6rem;
  height: 4rem;
  background: #fb64b6;
  border-radius: 0.8rem;
  border: none;
  color: #ffffff;
  font-size: 1.4rem;
  cursor: pointer;
}

.pagination-wrap {
  margin-top: 2.4rem;
  display: flex;
  justify-content: center;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}
.modal {
  width: 52rem;
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 1.8rem 0;
  position: relative;

  .modal-close {
    position: absolute;
    right: 2rem;
    top: 2rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }
  .modal-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #101828;
    padding: 0 2.4rem 1.8rem;
    border-bottom: 1px solid rgba(251, 100, 182, 0.2);
  }
  .modal-tip {
    margin: 1.8rem 2.4rem;
    font-size: 1.4rem;
    color: #99a1af;
    border-radius: 0.8rem;
  }
  .form-item {
    margin-bottom: 1.8rem;
    padding: 0 2.4rem 1.8rem;
    border-bottom: 1px solid rgba(251, 100, 182, 0.2);

    label {
      display: block;
      font-size: 1.4rem;
      color: #4a5565;
      margin-bottom: 1.2rem;
    }
    input {
      width: 100%;
      height: 5rem;
      border: 1px solid #fccee8;
      border-radius: 0.8rem;
      padding: 0 1.6rem;
      font-size: 1.4rem;
      background: rgba(255, 255, 255, 0.9);
      outline: none;
      &::placeholder {
        color: #99a1af;
      }
      &:focus {
        border-color: #fb64b6;
      }
    }
  }
  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 2.4rem;
    button {
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
    }
    .btn-cancel {
      border: 1px solid #fb64b6;
      background: none;
      color: #fb64b6;

      &:hover {
        background: rgba(251, 100, 182, 0.12);
      }
    }
    .btn-confirm {
      background: #fb64b6;
      color: #ffffff;

      &:hover {
        position: relative;
        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0.6rem;
          background: rgba(255, 255, 255, 0.2);
          z-index: 3;
        }
      }
    }
  }
}
</style>
