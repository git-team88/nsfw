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
                :class="{ active: activeSubTab == 'subscribe' }"
                @click="switchTab('subscribe')"
              >
                {{ t("user.paymentHistory.tabSubscribe") }}
              </div>
              <div
                class="tab-item"
                :class="{ active: activeSubTab == 'recharge' }"
                @click="switchTab('recharge')"
              >
                {{ t("user.paymentHistory.tabRecharge") }}
              </div>
            </div>
            <div class="actions-right" v-if="hasData">
              <button class="view-all-btn" @click="viewAllPaymentHistory">
                {{ t('user.paymentHistory.viewAll') }}
              </button>
              <div class="info-icon" @mouseenter="showInfo = true" @mouseleave="showInfo = false">
                <img src="@/assets/images/novel/intro.png" alt="Info" />
                <div class="info-tooltip" v-if="showInfo">
                  {{ t('user.paymentHistory.infoTooltip') }}
                </div>
              </div>
            </div>
          </div>

          <template v-if="!loading && !autoRenewLoading">
            <!-- Processing Tab Content -->
            <div v-if="activeMainTab === 'processing'">
              <div class="list-area" v-if="activeSubTab === 'subscribe'">
                <div class="sub-item" v-for="item in processingList" :key="item.id">
                  <div class="left">
                    <img class="avatar" :src="item.avatar || defaultAvatar" alt="" @click="goUserHome(item.userId)" @error="($event.target as HTMLImageElement).src = defaultAvatar" />
                    <div class="info">
                      <div class="name">{{ item.name }}</div>
                      <div class="id">{{ t('user.paymentHistory.id') }}{{ item.userId }}</div>
                    </div>
                  </div>
                  <div class="right">
                    <div class="price-info">
                      <div class="price">{{ item.price }} {{ t('aiRecharge.unit') }}{{ t('user.paymentHistory.month') }}</div>
                      <div class="date">
                        {{ t('user.paymentHistory.valid') }} {{ formatDate(item.startTime) }}-{{ formatDate(item.endTime) }}
                      </div>
                    </div>

                    <div class="operate-box">
                      <div class="menu-auto" v-if="!item.autoRenew" @click="turnOnAutoRenewal(item, 1)">
                        <b></b>
                        {{ t("user.myFollowsSubs.autoRenewOn") }}
                      </div>

                      <div class="more-box" v-else>
                        <img
                          class="more-icon"
                          src="@/assets/images/detail/menu.png"
                          alt=""
                          @click="toggleMoreMenu(item.id, $event)"
                        />
                        <div class="more-menu" v-if="showMoreMenu[item.id]" :style="menuStyle[item.id]">
                          <div class="menu-item" @click="turnOffAutoRenewal(item.id)">
                            {{ t("user.myFollowsSubs.autoRenewOff") }}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                <EmptyState v-if="!processingList.length" />
              </div>

              <div class="list-area" v-else-if="activeSubTab === 'recharge'">
                <div class="sub-item" v-for="item in processingList" :key="item.id">
                  <div class="left">
                    <div class="plan-info">
                      <div class="plan-name">{{ item.plan_info?.name }}</div>
                      <div class="compute-info">{{ item.plan_info?.description }}</div>
                    </div>
                  </div>
                  <div class="right">
                    <div class="price-info">
                      <div class="price">{{ item.plan_info?.price }} {{ t('aiRecharge.unit') }}{{ getTimeUnit(item.plan_info?.plan_id || 1) }}</div>
                      <div class="date">{{ t('user.paymentHistory.valid') }} {{ formatDate(item.startTime) }}-{{ formatDate(item.endTime) }}</div>
                    </div>

                    <div class="operate-box">
                      <div class="more-box" v-if="item.subscription_info && item.subscription_info.cancel_at_period_end == 0">
                        <img
                          class="more-icon"
                          src="@/assets/images/detail/menu.png"
                          alt=""
                          @click="toggleMoreMenu(item.id, $event)"
                        />
                        <div class="more-menu" v-if="showMoreMenu[item.id]" :style="menuStyle[item.id]">
                          <div class="menu-item" @click="turnOffAutoRenewal(item.id)">
                            {{ t("user.myFollowsSubs.autoRenewOff") }}
                          </div>
                        </div>
                      </div>
                      <div class="menu-auto" v-else @click="turnOnAutoRenewal(item, 2)">
                        <b></b>
                        {{ t("user.myFollowsSubs.autoRenewOn") }}
                      </div>
                    </div>
                  </div>
                </div>
                <EmptyState v-if="!processingList.length" />
              </div>

              <div class="pagination-wrap" v-if="activeMainTab === 'processing' && activeSubTab === 'recharge' && total > pageSize">
                <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
              </div>
            </div>

            <!-- Order History Tab Content -->
            <div v-else-if="activeMainTab === 'orderHistory'">
              <div class="table">
                <div class="tbody" v-if="listData.length">
                  <div class="tr" v-for="item in listData" :key="item.id">
                    <div class="td time">{{ formatDate(item.issued_at || item.pay_time) }}</div>
                    <div class="td info">{{ activeSubTab == 'recharge' ? t('user.paymentHistory.tabRecharge') : t('user.paymentHistory.subscriptionType')}}</div>
                    <div class="td quantity">{{ item.quantity || 1 }}</div>
                    <div class="td amount">{{ item.amount || item.price }}{{ t('aiRecharge.unit') }}</div>
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

    <UploadMask :visible="autoRenewLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import EmptyState from "@/components/EmptyState.vue";
import Pagination from "@/components/Pagination.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import dayjs from "dayjs";
import api from "@/api/index";
import { toast } from "@/util/toast";
import { formatTimestamp } from "@/util/utils";
import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const sidebarKey = ref("payment-history");
const activeMainTab = ref<"processing" | "orderHistory">("processing");
const activeSubTab = ref<"subscribe" | "recharge">("subscribe");
const activeOrderHistoryTab = ref<"subscribe" | "recharge">("subscribe");

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getOneMonthBeforeCurrent = () => {
  return dayjs().subtract(1, "month").format("YYYY-MM-DD");
};

const range = ref({ start: getOneMonthBeforeCurrent(), end: getCurrentDate() });

const loading = ref(false);
const listData = ref<any[]>([]);
const processingList = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const showInvoiceModal = ref(false);
const invoiceEmail = ref("");
const currentItem = ref<any>(null);

const showMoreMenu = ref<Record<string, boolean>>({});
const menuStyle = ref<Record<string, any>>({});
const autoRenewLoading = ref(false);
const showInfo = ref(false);

const hasData = computed(() => {
  if (activeMainTab.value === 'processing') {
    return processingList.value.length > 0;
  } else {
    return listData.value.length > 0;
  }
});

function switchMainTab(tab: "processing" | "orderHistory") {
  if (activeMainTab.value === tab) return;
  activeMainTab.value = tab;
  activeSubTab.value = 'subscribe';
  router.replace({
    path: '/user-payment-history'
  });
  if (tab === 'processing') {
    fetchProcessingData();
  } else {
    page.value = 1;
    fetchData();
  }
}

function switchTab(tab: "subscribe" | "recharge") {
  router.replace({
    path: '/user-payment-history'
  });

  if (activeMainTab.value === 'processing') {
    if (activeSubTab.value === tab) return;
    activeSubTab.value = tab;
    fetchProcessingData();
  } else {
    if (activeSubTab.value === tab) return;
    activeSubTab.value = tab;
    page.value = 1;
    fetchData();
  }
}

async function fetchData() {
  loading.value = true;
  listData.value = [];

  try {
    let res;
    if (activeSubTab.value === "subscribe") {
      res = await api.userPayList(page.value, pageSize.value, range.value.start, range.value.end) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || res.data || [];
        listData.value = data;
        total.value = res.data?.allnums || 0;
      }
    } else {
      res = await api.userAiPayList(page.value, pageSize.value, range.value.start, range.value.end) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || res.data || [];

        listData.value = data;
        total.value = res.data?.allnums || 0;
      }
    }
    if (res && (res.code !== 0 && res.code !== 200)) {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}

async function fetchProcessingData() {
  loading.value = true;
  processingList.value = [];

  try {
    if (activeSubTab.value === 'subscribe') {
      const res = await api.userSubscribeList(1, 10) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || [];

        processingList.value = data.map((item: any) => ({
          id: item.id,
          userId: item.author?.id || item.author_id,
          name: item.author?.nickname || '',
          avatar: item.author?.avatar || '',
          price: item.plan?.price || 0,
          startTime: item.start_at ? formatTimestamp(item.start_at) : item.created_at,
          endTime: item.expire_at ? formatTimestamp(item.expire_at) : '',
          autoRenew: item.status == '1'
        }));
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    } else if (activeSubTab.value === 'recharge') {
      const res = await api.computeDetail(101, '', '', page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data_list || [];
        // 这里可以根据实际API返回的数据结构进行处理
        processingList.value = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          planName: item.plan_name || item.planName ,
          computeValue: item.compute_value || item.computeValue,
          validPeriod: item.valid_period || item.validPeriod,
          avatar: '',
          price: item.amount || item.price || 0,
          startTime: item.issued_at ? formatDate(item.issued_at) : item.created_at,
          endTime: item.expire_at ? formatDate(item.expire_at) : '',
          autoRenew: item.auto_renew || item.autoRenew || false,
          subscription_info: item.subscription_info || null,
          plan_info: {
            name: item.plan_info?.name || '',
            description: item.plan_info?.description || '',
            price: item.plan_info?.price || 0,
            plan_id: item.plan_info?.plan_id || 1
          }
        }));
        total.value = res.data?.data_count || 0;
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}

function goUserHome(userId: string) {
  router.push(`/user-home?id=${userId}`);
}

// Get time unit based on plan_id
function getTimeUnit(planId: number) {
  switch(planId) {
    case 1:
      return t('user.paymentHistory.month');
    case 2:
      return t('aiRecharge.period3Month');
    case 3:
      return t('aiRecharge.period6Month');
    case 4:
      return t('aiRecharge.periodYear');
    default:
      return t('user.paymentHistory.month');
  }
}

function formatDate(date: string) {
  if (!date) return '';
  return date.replace('T', ' ');
}

watch([page, range], () => {
  if (activeMainTab.value === 'processing' && activeSubTab.value === 'recharge') {
    fetchProcessingData();
  } else {
    fetchData();
  }
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
      window.location.href = url;
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

function toggleMoreMenu(itemId: string, event: MouseEvent) {
  if (showMoreMenu.value[itemId]) {
    showMoreMenu.value[itemId] = false;
    return;
  }
  // 先关闭所有其他菜单
  Object.keys(showMoreMenu.value).forEach(id => {
    showMoreMenu.value[id] = false;
  });
  // 打开当前菜单
  showMoreMenu.value[itemId] = true;
  // 计算菜单位置
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const screenHeight = window.innerHeight;
  const menuHeight = 40; // 估计高度

  if (rect.bottom + menuHeight > screenHeight) {
    menuStyle.value[itemId] = {
      bottom: "100%",
      top: "auto",
      marginTop: "0",
      marginBottom: "0.4rem",
    };
  } else {
    menuStyle.value[itemId] = {
      top: "100%",
      bottom: "auto",
      marginTop: "0.4rem",
      marginBottom: "0",
    };
  }
}

async function turnOffAutoRenewal(itemId: string) {
  showMoreMenu.value[itemId] = false;
  autoRenewLoading.value = true;
  try {
    const res = await api.cancelSubscribe() as any;
    if (res.code === 0 || res.code === 200) {
      window.location.href = res.data?.url;
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    autoRenewLoading.value = false;
  }
}

async function turnOnAutoRenewal(item: any, type: number) {
  showMoreMenu.value[item.id] = false;
  autoRenewLoading.value = true;
  try {
    var id = '';
    if (type == 1) {
      id = item.user_id
    } else {
      id = item.author_id
    }
    const res = await api.subscribe({ creator_id: id }) as any;
    if (res.code == 0 || res.code == 200) {
      window.location.href = res.data?.url;
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    autoRenewLoading.value = false;
  }
}

async function viewAllPaymentHistory() {
  const uid = localStorage.getItem('uid');
  const res = await api.cancelSubscribe() as any;
  if (res.code == 0 || res.code == 200) {
    window.location.href = res.data?.url;
  } else {
    toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".more-box")) {
    // 关闭所有菜单
    Object.keys(showMoreMenu.value).forEach(id => {
      showMoreMenu.value[id] = false;
    });
  }
}

onMounted(() => {
  // 处理URL中的type参数
  const type = route.query.type as string;
  if (type == '1') {
    activeSubTab.value = 'subscribe';
    fetchProcessingData();
  } else if (type == '2') {
    activeSubTab.value = 'recharge';
    fetchProcessingData();
  } else if (type == '4') {
    // 跳转到支付历史下的AI充值工具tab
    activeMainTab.value = 'orderHistory';
    activeSubTab.value = 'recharge';
    page.value = 1;
    fetchData();
  } else {
    fetchProcessingData();
  }
  // 添加点击外部关闭菜单的事件监听器
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  // 移除点击外部关闭菜单的事件监听器
  document.removeEventListener("click", handleClickOutside);
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

.user-payment-history {
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

.panel-top {
  margin-bottom: 2.4rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}

.tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 6rem;
  margin-bottom: 2.4rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #F5F5F5;
}
.tabs {
  display: flex;
  gap: 3.2rem;
  height: 100%;
}
.tab-item {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 1.6rem;
  color: #6A7282;
  cursor: pointer;
  position: relative;

  &:hover{color: #6A7282;}
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

.actions-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18rem;
  height: 4.8rem;
  background: #fb64b6;
  color: #fff;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0 1.6rem;

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
      z-index: 5;
    }
  }
}

.info-icon {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .info-tooltip {
    position: absolute;
    top: 100%;
    right: -1.6rem;
    margin-top: 1.6rem;
    padding: 1rem;
    background: #FFFFFF;
    color: #6A7282;
    font-size: 1.2rem;
    border-radius: 0.8rem;
    white-space: nowrap;
    z-index: 100;
    box-shadow: 0 0.4rem 1.2rem rgba(0, 0, 0, 0.06);

    &::before {
      content: "";
      position: absolute;
      top: -1rem;
      right: 0.8rem;
      width: 3.4rem;
      height: 1.2rem;
      background: url('@/assets/images/detail/intro.png') no-repeat center center;
      background-size: 100% 100%;
    }
  }
}

.table {
  min-height: 40rem;
}
.tbody {
  border-top: 1px solid #F5F5F5;
}
.tr {
  display: flex;
  align-items: center;
  padding: 1.4rem 2rem;
  border-bottom: 1px solid #F5F5F5;
  cursor: pointer;

  &:hover {
    background: #F5F5F5;

    .btn-view{
      background: #FFFFFF;
    }
  }
}
.td {
  font-size: 1.4rem;
  color: #364153;
}
.time {
  width: 17rem;
  color: #6A7282;
}
.info {
  flex: 1;
}
.quantity {
  width: 13rem;
  text-align: center;
  color: #6A7282;
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
  color: #FFFFFF;
  font-size: 1.4rem;
  cursor: pointer;

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
      z-index: 5;
    }
  }
}

.btn-view {
  width: 13.6rem;
  height: 4rem;
  border-radius: 0.8rem;
  background: none;
  font-size: 1.4rem;
  background: #F5F5F5;
  color: #6A7282;
  cursor: pointer;

  &:hover{
    color: #FB64B6;
  }
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

.pagination-wrap {
  margin-top: 2.4rem;
  display: flex;
  justify-content: center;
}

.list-area {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-height: 40rem;
}

.sub-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.8rem 2.4rem 1.8rem 1.8rem;
  border-radius: 0.8rem;
  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
  }
  .left {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 1.2rem;
    .avatar {
      width: 5.2rem;
      height: 5.2rem;
      border-radius: 0.8rem;
      object-fit: cover;
    }
    .info {
      flex: 1;
      .name {
        max-width: 60rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1.6rem;
        color: #364153;
      }
      .id {
        font-size: 1.4rem;
        color: #99A1AF;
        margin-top: 0.8rem;
      }
    }
    .plan-info {
      flex: 1;
    }
    .plan-name {
      font-size: 1.6rem;
      color: #101828;
      margin-bottom: 0.8rem;
    }
    .compute-info {
      font-size: 1.4rem;
      color: #99A1AF;
    }
  }
  .right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    .price-info {
      text-align: right;
      .price {
        font-size: 1.6rem;
        color: #364153;
      }
      .date {
        font-size: 1.4rem;
        color: #99A1AF;
        margin-top: 0.6rem;
      }
    }
    .operate-box {
      margin-left: 2.4rem;
      .more-box {
        position: relative;
        .more-icon {
          width: 2.4rem;
          height: 2.4rem;
          cursor: pointer;
        }
        .more-menu {
          position: absolute;
          right: 0;
          top: 2.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          min-width: 16rem;
          border-radius: 0.6rem;
          background: #FFFFFF;
          box-shadow: 0px 0px 15px -3px rgba(0,0,0,0.08);
          z-index: 10;

          .menu-item {
            width: 100%;
            padding: 0.8rem 1rem;
            font-size: 1.2rem;
            text-align: center;
            color: #6a7282;
            cursor: pointer;
          }
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 2.4rem;
        font-size: 1.4rem;
        color: #FB64B6;

        b {
          width: 1px;
          height: 2.4rem;
          background: #F5F5F5;
        }
      }
    }
    .auto-renew-section {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      margin-top: 0.4rem;
    }
    .auto-renew {
      font-size: 1.4rem;
      color: #99a1af;
      &.auto-renewal {
        color: #4caf50;
      }
    }
    .auto-renew-btn {
      padding: 0.4rem 1.2rem;
      border: 1px solid #fb64b6;
      border-radius: 0.6rem;
      background: #fb64b6;
      color: #fff;
      font-size: 1.4rem;
      cursor: pointer;
    }
    .more-options {
      position: relative;
    }
    .more-btn {
      font-size: 1.6rem;
      color: #99a1af;
      cursor: pointer;
      padding: 0 0.8rem;
      &:hover {
        color: #6a7282;
      }
    }
    .more-menu {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 16rem;
      border-radius: 0.6rem;
      background: #ffffff;
      box-shadow: 0px 0px 15px -3px rgba(0,0,0,0.08);

      z-index: 10;
      .menu-item {
        width: 100%;
        padding: 0.8rem 1rem;
        font-size: 1.2rem;
        color: #6a7282;
        cursor: pointer;
      }
    }
    .operate-box {
      .more-box {
        position: relative;
        .more-icon {
          width: 2.4rem;
          height: 2.4rem;
          cursor: pointer;
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 2.4rem;
        font-size: 1.4rem;
        color: #FB64B6;

        b {
          width: 1px;
          height: 2.4rem;
          background: #F5F5F5;
        }
      }
    }
  }
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
          background: rgba(255, 255, 255, 0.1);
          z-index: 3;
        }
      }
    }
  }
}
</style>
