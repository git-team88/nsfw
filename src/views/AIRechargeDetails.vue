<template>
  <div class="ai-recharge-details">
    <Header ref="headerRef" :cur="-1" @balanceInfoLoaded="handleBalanceLoaded"></Header>
    <div class="container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="content-box">
        <h1 class="page-title">{{ t('aiRechargeDetails.title') }}</h1>

        <!-- Balance and Action Buttons -->
        <div class="balance-section">
          <div class="balance-box">
            <img src="@/assets/images/user/coin.png" alt="" />
            <div class="balance-info">
              <span class="balance-label">{{ t('aiRechargeDetails.balance') }}</span>
              <span class="balance-amount">{{ balance }}</span>
            </div>
          </div>
          <div class="action-buttons">
            <button class="recharge-btn" @click="goToRecharge">{{ t('aiRechargeDetails.recharge') }}</button>
            <button class="payment-history-btn" @click="goToPaymentHistory">{{ t('aiRechargeDetails.paymentHistory') }}</button>
          </div>
        </div>

        <!-- Frozen Computing Power -->
        <div class="frozen-power-section">
          <div class="frozen-power-info">
            <span class="frozen-power-label">{{ t('aiRechargeDetails.frozenPower') }}</span>
            <span class="frozen-power-amount">{{ frozenBalance }}</span>
          </div>
          <div class="tooltip-wrapper"
               @mouseenter="showFreezeTooltip = true"
               @mouseleave="showFreezeTooltip = false">
            <img src="@/assets/images/base/intro.png" alt="" class="info-icon" />
            <div class="tooltip-content" v-if="showFreezeTooltip">
              <div class="tooltip-title">{{ t('aiRechargeDetails.frozenPowerTitle') }}</div>
              <div class="tooltip-rules" v-html="t('aiRechargeDetails.frozenPowerRules')"></div>
            </div>
          </div>
        </div>

        <!-- Tabs and Date Range -->
        <div class="filter-section">
          <div class="tabs">
            <span
              v-for="tab in tabs"
              :key="tab.value"
              class="tab"
              :class="{ active: activeTab === tab.value }"
              @click="switchTab(tab.value)"
            >{{ tab.label }}</span>
          </div>
          <!-- <div class="date-range">
            <DateRangePicker v-model="dateRange" theme="pink" />
          </div> -->
        </div>

        <!-- Sub Navigation -->
        <div class="subnav-section">
          <div class="subnav-tabs">
            <span
              v-for="subtab in subTabs"
              :key="subtab.value"
              class="subtab"
              :class="{ active: activeSubTab == subtab.value }"
              @click="switchSubTab(subtab.value)"
            >
              <span>{{ subtab.label }}</span>
            </span>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="transaction-list">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>
          <!-- Empty State -->
          <EmptyState v-else-if="filteredTransactions.length === 0" />
          <!-- Transaction Items -->
          <div
            v-else
            v-for="(item, index) in filteredTransactions"
            :key="index"
            class="transaction-item"
            :style="{ animationDelay: `${Math.min(index, 10) * 45}ms` }"
            :class="{ 'consumption': activeSubTab == 'subscribe' || activeSubTab == 'other', 'recharge': activeSubTab == 'boost-pack', 'invite': activeSubTab == 'invite' }"
          >

            <template v-if="activeSubTab == 'invite'">
              <div class="transaction-column user-column">
                <div class="transaction-icon">
                  <img src="@/assets/images/user/rise.png" alt="" />
                </div>
                <div class="column-content">
                  <div class="reward-source">{{ getTypeName(item) }}</div>
<div class="transaction-date">{{ formatTimestamp(item.date) }}</div>
                 </div>
               </div>
               <div class="transaction-column source-column">
                <div class="column-content">
                  <div class="user-info">
                    <img :src="item.from_user_info?.avatar" alt="" class="user-avatar-small" />
                    <p class="user-nickname">{{ item.from_user_info?.nickname || '' }} <span>({{ t('aiRechargeDetails.invited') }})</span></p>
                  </div>
                </div>
              </div>
              <div class="transaction-column amount-column">
                <div class="column-content">
                  <div class="transaction-amount positive">
                    +{{ item.amount }}
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="transaction-column recharge-left-column">
                <div class="transaction-icon">
                  <img src="@/assets/images/user/decline.png" alt="" v-if="activeTab == 'consumption'" />
                  <img src="@/assets/images/user/rise.png" alt="" v-else />
                </div>
                <div class="column-content">
                  <div class="reward-source">{{ getTypeName(item) }}</div>
<div class="transaction-date">{{ formatTimestamp(item.date) }}</div>
                 </div>
               </div>

              <div class="transaction-column recharge-right-column">
                <div class="column-content">
                  <div class="transaction-amount">
                    {{ activeTab == 'consumption' ? `-${item.amount}` : `+${item.amount}` }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="pagination-wrap" v-if="!loading && filteredTransactions.length > 0 && computedTotal > pageSize">
          <Pagination :total="computedTotal" :pageSize="pageSize" v-model="page" theme="pink" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AIRechargeDetails">
import Header from "@/components/Header.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import Pagination from "@/components/Pagination.vue";
import EmptyState from "@/components/EmptyState.vue";

import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";
import { formatTimestamp } from "@/util/utils";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const balance = ref('0');
const totalBalance = ref('0');
const isMounting = ref(true);
const showFreezeTooltip = ref(false);

onMounted(() => {
  // 处理URL中的type参数
  const type = route.query.type as string;
  if (type === '3') {
    activeTab.value = 'recharge';
    activeSubTab.value = 'invite';
  } else if (type === '4') {
    // type=4 对应任意 subTab，保持默认即可
    // 这里不需要做特别处理，保持默认的 subTab 选中状态
  }

  fetchTransactions();

  // 挂载完成后设置标志为false
  setTimeout(() => {
    isMounting.value = false;
  }, 0);
});

function handleBalanceLoaded(data: any) {
  balance.value = (data?.balance || 0).toString();
  totalBalance.value = (data?.total_balance || 0).toString();
}

const frozenBalance = computed(() => {
  const total = parseInt(totalBalance.value) || 0;
  const bal = parseInt(balance.value) || 0;
  return (total - bal).toString();
});

const dateRange = ref({ start: '', end: '' });

const tabs = ref([
  { value: 'recharge', label: t('aiRechargeDetails.earned') },
  { value: 'consumption', label: t('aiRechargeDetails.consumption') }
]);
const activeTab = ref('recharge');

watch(locale, () => {
  tabs.value = [
    { value: 'recharge', label: t('aiRechargeDetails.earned') },
    { value: 'consumption', label: t('aiRechargeDetails.consumption') }
  ];
});

const subTabs = computed(() => {
  if (activeTab.value == 'recharge') {
    return [
      { value: 'subscribe', label: t('aiRechargeDetails.subscribe') },
      { value: 'boost-pack', label: t('aiRechargeDetails.boostPack') },
      { value: 'invite', label: t('aiRechargeDetails.inviteRewards') },
      { value: 'other', label: t('aiRechargeDetails.other') }
    ];
  } else if (activeTab.value == 'consumption') {
    return [
      { value: 'generate', label: t('aiRechargeDetails.generate') },
      { value: 'expired', label: t('aiRechargeDetails.expired') }
    ];
  }
  return [];
});
const activeSubTab = ref('subscribe');

interface Transaction {
  type: string;
  name: string;
  date: string;
  amount: string;
  from_user_info?: { nickname: string; avatar: string } | null;
}

const transactions = ref<Transaction[]>([]);
const loading = ref(false);

const filteredTransactions = computed(() => {
  return transactions.value;
});

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalFromApi = ref(0);

const computedTotal = computed(() => {
  const total = Number(totalFromApi.value) || 0;
  return total > 0 ? total : filteredTransactions.value.length;
});

watch(subTabs, () => {
  const validValues = subTabs.value.map(tab => tab.value);
  if (!validValues.includes(activeSubTab.value)) {
    activeSubTab.value = validValues[0] || '';
  }
});

function switchTab(tab: string) {
  if (loading.value) return;
  activeTab.value = tab;
  if (tab === 'recharge') {
    activeSubTab.value = 'subscribe';
  } else if (tab === 'consumption') {
    activeSubTab.value = 'generate';
  }
  router.replace({
    path: router.currentRoute.value.path,
    query: {}  // 显式清空 query 参数
  });
  page.value = 1;
  fetchTransactions();
}

watch(page, () => {
  fetchTransactions();
});

// watch(dateRange, () => {
//   fetchTransactions();
// });

function fetchTransactions() {
  loading.value = true;
  let type = 0;

  if (activeTab.value == 'recharge') {
    if (activeSubTab.value == 'subscribe') {
      type = 1;
    } else if (activeSubTab.value == 'boost-pack') {
      type = 2;
    } else if (activeSubTab.value == 'invite') {
      type = 3;
    } else if (activeSubTab.value == 'other') {
      type = 4;
    }
  } else if (activeTab.value == 'consumption') {
    if (activeSubTab.value == 'expired') {
      type = 100;
    } else if (activeSubTab.value == 'other') {
      type = 101;
    }
  }

  if (activeTab.value == 'consumption' && activeSubTab.value == 'generate') {
    api.computeConsume(dateRange.value.start, dateRange.value.end, page.value, pageSize.value).then((res: any) => {
      loading.value = false;
      if (res.code == 200) {
        if (res.data && Array.isArray(res.data.data_list)) {
          transactions.value = res.data.data_list.map((item: any) => {

            let name = '';
            if (item.source_type === 'generate') {
              name = 'Generate';
            } else {
              name = item.source_type || 'Unknown';
            }

            return {
              type: 'consumption',
              name: name,
              date: item.issued_at || item.created_at || item.date || '',
              amount: item.change_amount ? Math.abs(parseInt(item.change_amount)) : '0',
              reason: item.reason || '',
            };
          });

          totalFromApi.value = res.data.data_count || res.data.data_list.length;
        } else {
          transactions.value = [];
          totalFromApi.value = 0;
        }
      } else {
        transactions.value = [];
        totalFromApi.value = 0;
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }).catch((error) => {
      loading.value = false;
      toast(t('fatl'))
    });
  } else if (activeTab.value == 'consumption' && activeSubTab.value == 'expired') {
    api.computeExpired(dateRange.value.start, dateRange.value.end, page.value, pageSize.value).then((res: any) => {
      loading.value = false;

      if (res.code == 0) {
        if (res.data && Array.isArray(res.data.data)) {
          transactions.value = res.data.data.map((item: any) => {
            let name = '';
            if (item.source_type == 'expired') {
              name = 'Expired';
            }

            return {
              type: 'consumption',
              name: name,
              date: item.issued_at || '',
              amount: item.remaining_amount || '0'
            };
          });
          totalFromApi.value = res.data.allnums;
        } else {
          transactions.value = [];
          totalFromApi.value = 0;
        }
      } else {
        transactions.value = [];
        totalFromApi.value = 0;
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }).catch((error) => {
      console.log(error)
      loading.value = false;
      toast(t('fail'))
    });
  } else {
    api.computeDetail(type, dateRange.value.start, dateRange.value.end, page.value, pageSize.value).then((res: any) => {
      loading.value = false;

      if (res.code == 0) {
        if (res.data && Array.isArray(res.data.data)) {
          transactions.value = res.data.data.map((item: any) => {
            let name = '';
            if (item.source_type == 'payment') {
              name = 'Payment';
            } else if (item.source_type == 'invite') {
              name = 'Invite Reward';
            } else if (item.source_type == 'reg') {
              name = t('header.register');
            } else {
              name = item.source_type || 'Unknown';
            }

            return {
              type: activeTab.value === 'recharge' ? 'recharge' : 'consumption',
              name: name,
              date: item.issued_at || '',
              amount: item.amount || '0',
              from_user_info: item.from_user || null
            };
          });
          totalFromApi.value = res.data.allnums;
        } else {
          transactions.value = [];
          totalFromApi.value = 0;
        }
      } else {
        transactions.value = [];
        totalFromApi.value = 0;
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    }).catch((error) => {
      console.log(error)
      loading.value = false;
      toast(t('fail'))
    });
  }
}

function getTypeName(item: any) {
  if (activeTab.value === 'recharge') {
    if (activeSubTab.value === 'subscribe') {
      return t('aiRechargeDetails.subscribe');
    } else if (activeSubTab.value === 'boost-pack') {
      return t('aiRechargeDetails.boostPack');
    } else if (activeSubTab.value === 'invite') {
      return t('aiRechargeDetails.inviteRewards');
    } else if (activeSubTab.value === 'other') {
      return t('aiRechargeDetails.other');
    }
  } else if (activeTab.value === 'consumption') {
    if (item.reason) {
      const reason = item.reason.toLowerCase();
      if (reason.includes('novel')) {
        return t('aiRechargeDetails.novelGenerate');
      } else if (reason.includes('manhua')) {
        return t('aiRechargeDetails.comicGenerate');
      } else if (reason.includes('manju')) {
        return t('aiRechargeDetails.videoGenerate');
      } else if (reason.includes('simple_image')) {
        return t('aiRechargeDetails.imageGenerate');
      } else if (reason.includes('simple_video')) {
        return t('aiRechargeDetails.simpleVideoGenerate');
      }
      return item.reason;
    } else if (activeSubTab.value === 'generate') {
      return t('aiRechargeDetails.generate');
    } else if (activeSubTab.value === 'expired') {
      return t('aiRechargeDetails.expired');
    }
  }
  return '';
}


function goBack() {
  router.back();
}

function goToRecharge() {
  router.push('/ai-recharge');
}

function switchSubTab(subTabValue: string) {
  if (loading.value) return;
  activeSubTab.value = subTabValue;
  page.value = 1;
  fetchTransactions();
}

function goToPaymentHistory() {
  router.push('/user-payment-history?type=2');
}
</script>

<style lang="scss" scoped>
$ink: #f5f5f5;
$paper: #1a1a1a;
$cream: #111111;
$pink: #ff4f9a;
$muted: #777;
$sub: #aaa;
$line: #2c2c2c;
$yellow: #FFD23F;
$green: #22A06B;
$highlight: rgba(255,255,255,0.06);

.ai-recharge-details {
  width: 100%;
  background: $cream;
}

.container {
  max-width: 1160px;
  margin: 140px auto 20px;
  padding: 0 30px;
  position: relative;

  .back {
    position: absolute;
    top: -52px;
    left: 30px;
    width: auto;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f5f5f5;
    cursor: pointer;
    z-index: 10;
    border: 1px solid #3d3d3d;
    border-radius: 13px;
    background: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    padding: 0 10px;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    .back-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    font-size: 20px;
    font-weight: 800;
    color: $ink;
    margin-bottom: 24px;
    text-align: center;
  }

  .balance-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 24px;
    padding: 24px;
    background: $paper;
    border: 1px solid #3d3d3d;
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    animation: chPanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
    flex-wrap: wrap;
    gap: 16px;

    .balance-box {
      display: flex;
      align-items: center;
      gap: 12px;

      img {
        width: 56px;
        height: 56px;
      }

      .balance-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .balance-label {
        font-size: 13px;
        font-weight: 700;
        color: $muted;
      }

      .balance-amount {
        font-size: 28px;
        font-weight: 800;
        color: $ink;
      }
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .recharge-btn,
      .payment-history-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 136px;
        height: 44px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        border: 1px solid #3d3d3d;
        border-radius: 13px;
        transition: box-shadow 0.16s;
      }

      .recharge-btn {
        background: linear-gradient(145deg, #ff74b3, #f73382);
        color: #ffffff;
        box-shadow: 0 0 18px rgba(255,60,140,0.45), 0 4px 12px rgba(0,0,0,0.3);

        &:hover {
          box-shadow: 0 0 24px rgba(255,60,140,0.55), 0 6px 16px rgba(0,0,0,0.4);
        }

        &:active {
          box-shadow: 0 0 12px rgba(255,60,140,0.35), 0 2px 8px rgba(0,0,0,0.3);
        }
      }

      .payment-history-btn {
        background: $paper;
        color: $sub;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);

        &:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
          color: $ink;
        }

        &:active {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      }
    }

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: stretch;
      padding: 18px;

      .action-buttons {
        flex-direction: column;
        gap: 10px;

        .recharge-btn,
        .payment-history-btn {
          min-width: 0;
          width: 100%;
        }
      }
    }
  }

  .frozen-power-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 24px;

    .frozen-power-info {
      display: flex;
      align-items: center;
    }

    .frozen-power-label {
      font-size: 16px;
      font-weight: 800;
      color: $ink;
    }

    .frozen-power-amount {
      font-size: 16px;
      font-weight: 800;
      color: $pink;
    }

    .tooltip-wrapper {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;

      .info-icon {
        width: 20px;
        height: 20px;
        filter: brightness(0) invert(1);
      }

      .tooltip-content {
        position: absolute;
        left: 50%;
        top: calc(100% + 12px);
        width: 360px;
        padding: 12px 16px;
        transform: translateX(-50%);
        background: #222;
        border: 1px solid #3d3d3d;
        border-radius: 10px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
        z-index: 100;

        &::before {
          content: '';
          position: absolute;
          left: 50%;
          top: -8px;
          width: 0;
          height: 0;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #3d3d3d;
        }
        &::after {
          content: '';
          position: absolute;
          left: 50%;
          top: -5px;
          width: 0;
          height: 0;
          transform: translateX(-50%);
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 7px solid #222;
        }

        .tooltip-title {
          font-size: 14px;
          font-weight: 800;
          color: $ink;
          margin-bottom: 6px;
        }

        .tooltip-rules {
          font-size: 12px;
          font-weight: 600;
          color: $sub;
          line-height: 20px;
        }
      }
    }
  }

  .filter-section {
    display: flex;
    align-items: flex-end;
    margin-bottom: 24px;
    border-bottom: 1px solid #303030;
    padding-bottom: 12px;

    .tabs {
      display: flex;
      align-items: flex-end;
      gap: 28px;

      .tab {
        position: relative;
        display: flex;
        align-items: center;
        height: 40px;
        font-size: 16px;
        font-weight: 900;
        color: #555;
        cursor: pointer;
        padding: 0 6px;
        border-radius: 0;
        background: transparent;
        transition: color 0.15s;

        &:hover:not(.active) {
          color: #aaa;
        }

        &.active {
          color: #e7e7e7;

          &::after {
            content: "";
            position: absolute;
            right: 6px;
            bottom: -13px;
            left: 6px;
            height: 4px;
            border-radius: 4px 4px 0 0;
            background: #ff4f9a;
          }
        }
      }
    }
  }

  .subnav-section {
    margin-bottom: 16px;

    .subnav-tabs {
      display: flex;
      align-items: center;
      gap: 8px;

      .subtab {
        display: flex;
        align-items: center;
        height: 36px;
        padding: 0 20px;
        font-size: 14px;
        font-weight: 800;
        color: $ink;
        cursor: pointer;
        border-radius: 10px;
        border: 1px solid #3d3d3d;
        transition: background-color 0.15s, color 0.15s, border-color 0.15s;
        background: transparent;

        &:hover:not(.active) {
          border-color: #ff4f9a;
          color: #fff;
        }

        &.active {
          background: linear-gradient(145deg, #ff74b3, #f73382);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 0 18px rgba(255,60,140,0.45);
        }
      }
    }
  }

  .transaction-list {
    margin: 0 0 24px;

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 400px;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.1);
        border-top: 4px solid $ink;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
      }

      .loading-text {
        font-size: 14px;
        font-weight: 700;
        color: $ink;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .loading-spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
        display: inline-block;
      }
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 18px;
      border-radius: 13px;
      border: 1px solid #3d3d3d;
      background: $paper;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: rkRow 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      transition: box-shadow 0.12s;

      &:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .transaction-column {
        display: flex;
        align-items: center;
        gap: 12px;

        &.user-column {
          flex: 0 0 40%;
          min-width: 200px;
        }

        &.source-column {
          flex: 1;
        }

        &.amount-column {
          flex: 0 0 15%;
          min-width: 100px;
          justify-content: flex-end;
        }

        &.recharge-left-column {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        &.recharge-right-column {
          flex: 0 0 15%;
          min-width: 100px;
          justify-content: flex-end;
        }

        .column-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      }

      .transaction-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 22px;
          height: 22px;
          filter: brightness(0) invert(1);
        }
      }

      .user-name {
        font-size: 16px;
        color: $ink;
        font-weight: 800;
      }

      .transaction-date {
        font-size: 14px;
        font-weight: 600;
        color: $muted;
      }

      .reward-source {
        margin-bottom: 6px;
        font-size: 16px;
        font-weight: 800;
        color: $ink;
      }

      .transaction-type {
        font-size: 12px;
        font-weight: 600;
        color: $muted;
        margin-top: 4px;
      }

      .transaction-amount {
        font-weight: 800;
        font-size: 16px;
        color: $ink;
        text-align: right;

        &.positive {
          color: $pink;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .user-avatar-small {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid #3d3d3d;
        object-fit: cover;
      }

      .user-nickname {
        font-size: 12px;
        font-weight: 700;
        color: $sub;

        span {
          color: $muted;
        }
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

@keyframes chPanelIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes rkRow {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .balance-section,
  .transaction-item,
  .seg-btn,
  .subtab.active {
    animation: none !important;
  }
}
</style>