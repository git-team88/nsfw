<template>
  <div class="ai-recharge-details">
    <Header ref="headerRef" :cur="-1" @balanceInfoLoaded="handleBalanceLoaded"></Header>
    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
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
            >
              {{ tab.label }}
            </span>
          </div>
          <div class="date-range">
            <DateRangePicker v-model="dateRange" theme="pink" />
          </div>
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
            :class="{ 'consumption': activeSubTab == 'subscribe' || activeSubTab == 'other', 'recharge': activeSubTab == 'boost-pack', 'invite': activeSubTab == 'invite' }"
          >

            <template v-if="activeSubTab == 'invite'">
              <div class="transaction-column user-column">
                <div class="transaction-icon">
                  <img src="@/assets/images/user/rise.png" alt="" />
                </div>
                <div class="column-content">
                  <div class="reward-source">{{ getTypeName(item) }}</div>
                  <div class="transaction-date">{{ formatDate(item.date) }}</div>
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
                  <div class="transaction-date">{{ formatDate(item.date) }}</div>
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

watch(dateRange, () => {
  fetchTransactions();
});

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

function formatDate(date: string) {
  if (!date) return '';
  return date.replace('T', ' ');
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
.ai-recharge-details {
  width: 100%;
  background: #FFFFFF;
}

.container {
  width: 84rem;
  margin: 14rem auto 2rem;
  position: relative;

  .back {
    position: fixed;
    left: 50%;
    top: 14rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-55rem);
    cursor: pointer;
    z-index: 10;

    img {
      width: 4rem;
      height: 4rem;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    font-size: 2.4rem;
    font-weight: 500;
    text-align: center;
    color: #101828;
    margin-bottom: 3.6rem;
  }

  // Balance Section
  .balance-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 3rem;
    padding: 2.4rem;
    background-color: #F5F5F5;
    border-radius: 1.2rem;

    .balance-box {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      img{
        width: 5.6rem;
        height: 5.6rem;
      }

      .balance-info{
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .balance-label {
        font-size: 1.2rem;
        color: #99A1AF;
      }

      .balance-amount {
        font-size: 2.4rem;
        font-weight: 500;
        color: #101828;
      }
    }

    .action-buttons {
      display: flex;
      gap: 1.8rem;

      .recharge-btn,
      .payment-history-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
      }

      .recharge-btn {
        background-color: #fb64b6;
        color: #ffffff;

        &:hover{
          position: relative;
          &::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }

      .payment-history-btn {
        background-color: #ffffff;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }
    }
  }

  // Frozen Computing Power Section
  .frozen-power-section {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin: 0 0 3rem;

    .frozen-power-info {
      display: flex;
      align-items: center;
    }

    .frozen-power-label {
      font-size: 1.6rem;
      color: #101828;
    }

    .frozen-power-amount {
      font-size: 1.6rem;
      color: #FB64B6;
    }

    .tooltip-wrapper {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;

      .info-icon {
        width: 2rem;
        height: 2rem;
      }

      .tooltip-content {
        position: absolute;
        left: 50%;
        top: calc(100% + 1.2rem);
        width: 36rem;
        padding: 1.6rem;
        transform: translateX(-50%);
        background-color: #FFFFFF;
        border-radius: 0.8rem;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 100;

        &::before {
          content: '';
          position: absolute;
          left: 50%;
          top: -1.2rem;
          width: 3.2rem;
          height: 1.2rem;
          transform: translateX(-50%);
          background: url('@/assets/images/base/icon.png') no-repeat center center;
          background-size: contain;
        }

        .tooltip-title {
          font-size: 1.2rem;
          color: #364153;
          margin-bottom: 0.4rem;
        }

        .tooltip-rules {
          font-size: 1.2rem;
          color: #364153;
          line-height: 2rem;
        }
      }
    }
  }

  // Filter Section
  .filter-section {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding: 0 0 1.2rem;
    border-bottom: 1px solid #F5F5F5;

    .tabs {
      display: flex;
      gap: 3rem;
      height: 100%;

      .tab {
        display: flex;
        align-items: center;
        height: 4rem;
        font-size: 1.6rem;
        color: #6A7282;
        cursor: pointer;
        position: relative;

        &:hover{
          color: #101828;
        }

        &.active {
          color: #101828;
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            bottom: -1.2rem;
            left: 0;
            width: 100%;
            height: 0.2rem;
            background-color: #fb64b6;
          }
        }
      }
    }

    .date-range {
      display: flex;
      align-items: center;
    }
  }

  .subnav-section {
    margin-bottom: 1.6rem;

    .subnav-tabs {
      display: flex;
      gap: 1.2rem;

      .subtab {
        display: flex;
        align-items: center;
        height: 3.2rem;
        padding: 0 1.6rem;
        font-size: 1.4rem;
        color: #99A1AF;
        cursor: pointer;
        border-radius: 0.8rem;

        &:hover{
          color: #6A7282;
        }

        &.active {
          color: #6A7282;
          background: #F5F5F5;
        }
      }
    }
  }

  // Transaction List
  .transaction-list {
    margin: 0 0 2.4rem;

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 40rem;

      .loading-spinner {
        width: 4rem;
        height: 4rem;
        border: 0.4rem solid #F5F5F5;
        border-top: 0.4rem solid #6A7282;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 2rem;
      }

      .loading-text {
        font-size: 1.4rem;
        color: #99A1AF;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .loading-spinner-small {
        width: 1.6rem;
        height: 1.6rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #FFFFFF;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
        display: inline-block;
      }
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1.8rem;
      border-radius: 0.8rem;
      margin-bottom: 1.2rem;

      &:hover{
        box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .transaction-column {
        display: flex;
        align-items: center;
        gap: 1.2rem;

        &.user-column {
          flex: 0 0 40%;
          min-width: 20rem;
        }

        &.source-column {
          flex: 1;
        }

        &.amount-column {
          flex: 0 0 15%;
          min-width: 10rem;
          justify-content: flex-end;
        }

        &.recharge-left-column {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        &.recharge-right-column {
          flex: 0 0 15%;
          min-width: 10rem;
          justify-content: flex-end;
        }

        .column-content {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
      }

      .transaction-icon {
        width: 5.2rem;
        height: 5.2rem;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 2.2rem;
          height: 2.2rem;
        }
      }

      .user-name {
        font-size: 1.6rem;
        color: #101828;
        font-weight: 500;
      }

      .transaction-date {
        font-size: 1.4rem;
        color: #99A1AF;
      }

      .reward-source {
        margin-bottom: 0.6rem;
        font-size: 1.6rem;
        color: #364153;
      }

      .transaction-type {
        font-size: 1.2rem;
        color: #99A1AF;
        margin-top: 0.4rem;
      }

      .transaction-amount {
        font-weight: 500;
        font-size: 1.6rem;
        color: #364153;
        text-align: right;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }

      .user-avatar-small {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 0.4rem;
        object-fit: cover;
      }

      .user-nickname {
        font-size: 1.2rem;
        color: #6A7282;

        span{
          color: #99A1AF;
        }
      }
    }


  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: 2.4rem;
  }
}
</style>