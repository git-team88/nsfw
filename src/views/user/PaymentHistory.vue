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
              <div
                class="tab-item"
                :class="{ active: activeSubTab == 'topup' }"
                @click="switchTab('topup')"
              >
                {{ t("user.paymentHistory.tabTopUp") }}
              </div>
            </div>
            <div class="actions-right" v-if="hasData">
              <button class="view-all-btn" @click="viewAllPaymentHistory">
                {{ t('user.paymentHistory.viewAll') }}
              </button>
              <div class="info-icon" @mouseenter="showInfo = true" @mouseleave="showInfo = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div class="info-tooltip" v-if="showInfo">
                  {{ t('user.paymentHistory.infoTooltip') }}
                </div>
              </div>
            </div>
          </div>

          <template v-if="loading">
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t('home.loading') }}</div>
            </div>
          </template>
          <template v-else>
            <!-- Processing Tab Content -->
            <div v-if="activeMainTab == 'processing'">
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
                        {{ t('user.paymentHistory.valid') }} {{ formatTimestamp(item.startTime) }}-{{ formatTimestamp(item.endTime) }}
                      </div>
                    </div>

                    <div class="operate-box">
                      <div class="more-box" v-if="!item.autoRenew">
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

                      <div class="menu-auto" v-else @click="turnOnAutoRenewal(item.id, 1)">
                        <b></b>
                        {{ t("user.myFollowsSubs.autoRenewOn") }}
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
                      <div class="plan-name">{{ getLocalizedPlanDesc(item.plan_desc).name || item.plan_info?.name }}</div>
                      <div class="compute-info">{{ getLocalizedPlanDesc(item.plan_desc).description || item.plan_info?.description }}</div>
                    </div>
                  </div>
                  <div class="right">
                    <div class="price-info">
                      <div class="price">{{ item.plan_info?.price }} {{ t('aiRecharge.unit') }}{{ getTimeUnit(item.plan_info?.billing_period || '1') }}</div>
                      <div class="date">{{ t('user.paymentHistory.valid') }} {{ formatTimestamp(item.startTime) }}-{{ formatTimestamp(item.endTime) }}</div>
                    </div>

                    <div class="operate-box">
                      <div class="more-box" v-if="!item.autoRenew">
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
                      <div class="menu-auto" v-else @click="turnOnAutoRenewal(item.id, 2)">
                        <b></b>
                        {{ t("user.myFollowsSubs.autoRenewOn") }}
                      </div>
                    </div>
                  </div>
                </div>
                <EmptyState v-if="!processingList.length" />
              </div>

              <div class="list-area" v-else-if="activeSubTab === 'topup'">
                <div class="sub-item" v-for="item in topupProcessingList" :key="item.id">
                  <div class="left">
                    <div class="plan-info">
                      <div class="plan-name">{{ item.plan_info?.name || item.name }}</div>
                      <div class="compute-info">{{ item.plan_info?.description || item.description }}</div>
                    </div>
                  </div>
                  <div class="right">
                    <div class="price-info">
                      <div class="price">{{ item.price }} {{ t('aiRecharge.unit') }}</div>
                    </div>
                  </div>
                </div>
                <EmptyState v-if="!topupProcessingList.length" />
              </div>

              <div class="pagination-wrap" v-if="activeMainTab === 'processing' && (activeSubTab === 'recharge' || activeSubTab === 'topup') && total > pageSize">
                <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
              </div>
            </div>

            <!-- Order History Tab Content -->
            <div v-else-if="activeMainTab === 'orderHistory'">
              <div class="table">
                <div class="tbody" v-if="listData.length">
                  <div class="tr" v-for="item in listData" :key="item.id">
                    <div class="td time">{{ formatTimestamp(item.issued_at || item.pay_time) }}</div>
                    <div class="td info">{{ activeSubTab == 'recharge' ? t('user.paymentHistory.tabRecharge') : activeSubTab == 'topup' ? t('user.paymentHistory.tabTopUp') : t('user.paymentHistory.subscriptionType')}}</div>
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
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";
import { formatTimestamp } from "@/util/utils";
import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();

function getPlanDescLang() {
  if (locale.value === 'zh') return 'cn';
  return locale.value;
}

function getLocalizedPlanDesc(planDesc: any[]) {
  if (!planDesc || !planDesc.length) return { name: '', description: '' };
  const lang = getPlanDescLang();
  const matched = planDesc.find((d: any) => d.language == lang);
  const fallback = planDesc.find((d: any) => d.language == 'en') || planDesc[0];
  const desc = matched || fallback;
  return { name: desc.name || '', description: desc.description || '' };
}
const router = useRouter();
const route = useRoute();
const sidebarKey = ref("payment-history");
const activeMainTab = ref<"processing" | "orderHistory">("processing");
const activeSubTab = ref<"subscribe" | "recharge" | "topup">("subscribe");
const activeOrderHistoryTab = ref<"subscribe" | "recharge" | "topup">("subscribe");

const loading = ref(false);
const listData = ref<any[]>([]);
const processingList = ref<any[]>([]);
const topupProcessingList = ref<any[]>([]);
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
    if (activeSubTab.value === 'topup') {
      return topupProcessingList.value.length > 0;
    }
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

function switchTab(tab: "subscribe" | "recharge" | "topup") {
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
      res = await api.userPayList(page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || res.data || [];
        listData.value = data;
        total.value = res.data?.allnums || 0;
      }
    } else if (activeSubTab.value === "recharge") {
      res = await api.userAiPayList(page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || res.data || [];

        listData.value = data;
        total.value = res.data?.allnums || 0;
      }
    } else if (activeSubTab.value === "topup") {
      res = await api.userPaymentOrderList(page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || res.data || [];
        listData.value = data;
        total.value = res.data?.allnums || 0;
      }
    }
    if (res && (res.code !== 0 && res.code !== 200)) {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
          startTime: item.start_at || item.created_at || '',
          endTime: item.expire_at || '',
          autoRenew: item.cancel_at_period_end == '1'
        }));
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else if (activeSubTab.value === 'recharge') {
      const res = await api.userAiSubscribeList(page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || [];
        // 这里可以根据实际API返回的数据结构进行处理
        processingList.value = data.map((item: any) => ({
          id: item.id,
          avatar: '',
          price: item.amount || 0,
          startTime: item.created_at || '',
          endTime: item.current_period_end || '',
          autoRenew: item.cancel_at_period_end == '1',
          plan_desc: item.plan_desc || [],
          plan_info: {
            name: item.plan?.name || '',
            description: item.plan?.description || '',
            price: item.plan?.price || 0,
            billing_period: item.plan?.billing_period || '',
            plan_id: item.plan?.plan_id || 1
          }
        }));

        total.value = res.data?.allnums || 0;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    } else if (activeSubTab.value === 'topup') {
      const res = await api.userPaymentOrderList(page.value, pageSize.value) as any;
      if (res.code === 0 || res.code === 200) {
        const data = res.data?.data || [];
        topupProcessingList.value = data.map((item: any) => ({
          id: item.id,
          name: item.plan_desc?.[0]?.name || item.plan?.name || '',
          description: item.plan_desc?.[0]?.description || item.plan?.description || '',
          price: item.amount || item.plan?.price || 0,
          pay_time: item.pay_time || item.created_at || '',
          plan_info: {
            name: item.plan_desc?.[0]?.name || item.plan?.name || '',
            description: item.plan_desc?.[0]?.description || item.plan?.description || '',
          }
        }));
        total.value = res.data?.allnums || 0;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
function getTimeUnit(billingPeriod: string) {
  switch(billingPeriod) {
    case '1':
      return t('aiRecharge.periodMonth');
    case '3':
      return t('aiRecharge.period3Month');
    case '6':
      return t('aiRecharge.period6Month');
    case '12':
      return t('aiRecharge.periodYear');
    default:
      return t('aiRecharge.periodMonth');
  }
}

watch(page, () => {
  if (activeMainTab.value === 'processing' && (activeSubTab.value === 'recharge' || activeSubTab.value === 'topup')) {
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
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    autoRenewLoading.value = false;
  }
}

async function turnOnAutoRenewal(itemId: string, type: number) {
  showMoreMenu.value[itemId] = false;
  autoRenewLoading.value = true;

  try {
    const res = await api.cancelSubscribe() as any;
    if (res.code == 0 || res.code == 200) {
      window.location.href = res.data?.url;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
    toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  const type = route.query.type as string;
  if (type == '1') {
    activeSubTab.value = 'subscribe';
    page.value = 1;
    fetchProcessingData();
  } else if (type == '2') {
    activeSubTab.value = 'recharge';
    page.value = 1;
    fetchProcessingData();
  } else if (type == '3') {
    activeSubTab.value = 'topup';
    page.value = 1;
    fetchProcessingData();
  } else {
    page.value = 1;
    fetchProcessingData();
  }
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
  width: 800px;
  max-height: 90vh;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  padding: 24px;
  overflow-y: auto;

  .preview-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .btn-download-pdf {
      padding: 8px 16px;
      background: #FF4D8D;
      color: #fff;
      border: 2.5px solid #161122;
      border-radius: 13px;
      box-shadow: 3px 3px 0 #161122;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
    }

    .preview-close {
      width: 24px;
      height: 24px;
      cursor: pointer;
    }
  }
}

.invoice-paper {
  width: 100%;
  min-height: 800px;
  background: #FFFDF7;
  padding: 40px 30px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  color: #161122;
  font-family: Arial, sans-serif;

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      .logo-icon {
        width: 20px;
        height: 20px;
        background: #FF4D8D;
        border-radius: 50%;
        border: 2px solid #161122;
      }
      .logo-text {
        font-size: 20px;
        color: #161122;
        b {
          font-weight: 800;
        }
        span {
          color: #FF4D8D;
        }
      }
    }

    .invoice-title {
      font-size: 30px;
      color: #161122;
      font-weight: 800;
    }
  }

  .invoice-meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;

    .company-info {
      font-size: 12px;
      line-height: 1.5;
      .company-name {
        font-weight: 800;
        font-size: 14px;
        margin-bottom: 3px;
      }
    }

    .invoice-details {
      text-align: right;
      .detail-item {
        margin-bottom: 4px;
        font-size: 12px;
        .label {
          color: #161122;
          margin-right: 6px;
        }
        .value {
          font-weight: 700;
        }
      }
    }
  }

  .bill-to {
    margin-bottom: 30px;
    .section-label {
      font-size: 12px;
      color: #161122;
      margin-bottom: 3px;
    }
    .bill-email {
      font-weight: 800;
      font-size: 12px;
    }
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;

    th {
      text-align: left;
      padding: 8px 0;
      border-bottom: 2.5px solid #161122;
      color: #161122;
      font-size: 12px;
      font-weight: 700;
    }

    td {
      padding: 12px 0;
      font-size: 12px;
      color: #161122;
    }

    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
  }

  .invoice-summary {
    width: 250px;
    margin-left: auto;

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;

      &.total {
        margin-top: 12px;
        padding-top: 8px;
        font-weight: 800;
        font-size: 14px;
        border-top: 2.5px solid #161122;
      }

      &.paid {
        font-weight: 800;
      }
    }
  }

  .invoice-footer {
    margin-top: 60px;
    font-size: 11px;
    color: #161122;
  }
}

.user-payment-history {
  width: 100%;
  min-height: 100vh;
  background: #FFFBF4;
}
.container {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 0 30px;
}
.main {
  flex: 1;
  padding-top: 100px;
}

.panel {
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  padding: 24px;
}

.panel-top {
  margin-bottom: 24px;
}
.panel-title {
  font-weight: 800;
  font-size: 30px;
  color: #161122;
}

.tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.tabs {
  display: inline-flex;
  gap: 6px;
  background: #fff;
  border: 2.5px solid #161122;
  border-radius: 14px;
  padding: 5px;
}
.tab-item {
  font-size: 16px;
  color: #6A7282;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.15s ease;
  &:hover {
    color: #161122;
  }
  &.active {
    background: #161122;
    color: #fff;
    border-radius: 10px;
    font-weight: 800;
  }
}

.actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 136px;
  height: 44px;
  background: #FF4D8D;
  color: #fff;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  padding: 0 18px;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
}

.info-icon {
  position: relative;
  cursor: pointer;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px solid #161122;
  background: #FFF3D6;

  svg {
    width: 20px;
    height: 20px;
  }

  .info-tooltip {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    padding: 10px 14px;
    background: #FFFDF7;
    color: #161122;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.7;
    border-radius: 10px;
    border: 2.5px solid #161122;
    box-shadow: 3px 3px 0 #161122;
    white-space: nowrap;
    z-index: 100;

    &::before {
      content: "";
      position: absolute;
      top: -8px;
      right: 14px;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid #161122;
    }
    &::after {
      content: "";
      position: absolute;
      top: -5px;
      right: 14px;
      width: 0;
      height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 7px solid #FFFDF7;
    }
  }
}

.table {
  min-height: 400px;
}
.tbody {
  border-top: 2.5px solid #161122;
}
.tr {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FFFDF7;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  margin-bottom: 8px;

  &:hover {
    background: #FFF3D6;

    .btn-view {
      background: #FFFDF7;
    }
  }
}
.td {
  font-size: 14px;
  color: #161122;
}
.time {
  width: 170px;
  color: #161122;
}
.info {
  flex: 1;
}
.quantity {
  width: 130px;
  text-align: center;
  color: #161122;
}
.amount {
  width: 130px;
  text-align: center;
}
.actions {
  width: 324px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-invoice {
  min-width: 136px;
  height: 40px;
  background: #FF4D8D;
  color: #fff;
  border-radius: 13px;
  border: 2.5px solid #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
}

.btn-view {
  width: 136px;
  height: 40px;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 700;
  background: #FFF3D6;
  color: #161122;
  border: 2.5px solid #161122;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;

  &:hover {
    box-shadow: 1px 1px 0 #161122;
    transform: translate(2px, 2px);
    background: #FFFDF7;
  }
}

.btn-download {
  min-width: 136px;
  height: 40px;
  background: #FF4D8D;
  color: #fff;
  border-radius: 13px;
  border: 2.5px solid #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 12px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #FFF3D6;
    border-top: 4px solid #161122;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    box-sizing: border-box;
  }

  .loading-text {
    font-size: 16px;
    color: #161122;
    font-weight: 700;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.list-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 400px;
}

.sub-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 24px 18px 18px;
  border-radius: 13px;
  border: 2.5px solid #161122;
  background: #FFFDF7;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;

  &:hover {
    box-shadow: 1px 1px 0 #161122;
    transform: translate(2px, 2px);
  }
  .left {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 2px solid #161122;
      object-fit: cover;
    }
    .info {
      flex: 1;
      .name {
        max-width: 600px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 16px;
        color: #161122;
        font-weight: 700;
      }
      .id {
        font-size: 14px;
        color: #161122;
        margin-top: 8px;
      }
    }
    .plan-info {
      flex: 1;
    }
    .plan-name {
      font-size: 16px;
      color: #161122;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .compute-info {
      font-size: 14px;
      color: #161122;
    }
  }
  .right {
    display: flex;
    align-items: center;
    gap: 4px;
    .price-info {
      text-align: right;
      .price {
        font-size: 16px;
        color: #161122;
        font-weight: 700;
      }
      .date {
        font-size: 14px;
        color: #161122;
        margin-top: 6px;
      }
    }
    .operate-box {
      margin-left: 24px;
      .more-box {
        position: relative;
        .more-icon {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .more-menu {
          position: absolute;
          right: 0;
          top: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          min-width: 160px;
          border-radius: 6px;
          background: #FFFDF7;
          border: 2.5px solid #161122;
          box-shadow: 3px 3px 0 #161122;
          z-index: 10;

          .menu-item {
            width: 100%;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
            color: #161122;
            cursor: pointer;

            &:hover {
              background: #FFF3D6;
            }
          }
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 14px;
        color: #FF4D8D;
        font-weight: 700;

        b {
          width: 2px;
          height: 24px;
          background: #161122;
        }
      }
    }
    .auto-renew-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }
    .auto-renew {
      font-size: 14px;
      color: #161122;
      &.auto-renewal {
        color: #1B8f5a;
        background: #E7F8EE;
        border: 1.5px solid #9be0bd;
        border-radius: 999px;
        padding: 2px 8px;
      }
    }
    .auto-renew-btn {
      padding: 4px 12px;
      border: 2.5px solid #161122;
      border-radius: 999px;
      background: #FF4D8D;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 3px 3px 0 #161122;
    }
    .more-options {
      position: relative;
    }
    .more-btn {
      font-size: 16px;
      color: #161122;
      cursor: pointer;
      padding: 0 8px;
      font-weight: 700;
      &:hover {
        color: #FF4D8D;
      }
    }
    .more-menu {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 160px;
      border-radius: 6px;
      background: #FFFDF7;
      border: 2.5px solid #161122;
      box-shadow: 3px 3px 0 #161122;
      z-index: 10;

      .menu-item {
        width: 100%;
        padding: 8px 10px;
        font-size: 12px;
        color: #161122;
        font-weight: 700;
        cursor: pointer;

        &:hover {
          background: #FFF3D6;
        }
      }
    }
    .operate-box {
      .more-box {
        position: relative;
        .more-icon {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 14px;
        color: #FF4D8D;
        font-weight: 700;

        b {
          width: 2px;
          height: 24px;
          background: #161122;
        }
      }
    }
  }
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}
.modal {
  width: 520px;
  background: #FFFDF7;
  border-radius: 6px;
  border: 3px solid #161122;
  padding: 18px 0;
  position: relative;
  box-shadow: 6px 6px 0 #161122;

  .modal-close {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
  .modal-title {
    font-size: 30px;
    font-weight: 800;
    color: #161122;
    padding: 0 24px 18px;
    border-bottom: 2.5px solid #161122;
  }
  .modal-tip {
    margin: 18px 24px;
    font-size: 14px;
    color: #161122;
    border-radius: 6px;
  }
  .form-item {
    margin-bottom: 18px;
    padding: 0 24px 18px;
    border-bottom: 2.5px solid #161122;

    label {
      display: block;
      font-size: 14px;
      color: #161122;
      font-weight: 700;
      margin-bottom: 12px;
    }
    input {
      width: 100%;
      height: 50px;
      border: 2.5px solid #161122;
      border-radius: 13px;
      padding: 0 16px;
      font-size: 14px;
      background: #FFFDF7;
      color: #161122;
      outline: none;
      &::placeholder {
        color: #161122;
        opacity: 0.4;
      }
      &:focus {
        border-color: #FF4D8D;
        box-shadow: 3px 3px 0 rgba(255,77,141,.42);
      }
    }
  }
  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 24px;
    button {
      min-width: 136px;
      height: 48px;
      border: 2.5px solid #161122;
      border-radius: 13px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 3px 3px 0 #161122;
    }
    .btn-cancel {
      border: 2.5px solid #161122;
      background: #FFFDF7;
      color: #161122;

      &:hover {
        background: #FFF3D6;
        box-shadow: 1px 1px 0 #161122;
        transform: translate(2px, 2px);
      }
    }
    .btn-confirm {
      background: #FF4D8D;
      color: #fff;

      &:hover {
        box-shadow: 1px 1px 0 #161122;
        transform: translate(2px, 2px);
      }
    }
  }
}
</style>
