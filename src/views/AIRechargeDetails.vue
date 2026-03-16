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

        <!-- Tabs and Date Range -->
        <div class="filter-section">
          <div class="tabs">
            <span
              v-for="tab in tabs"
              :key="tab.value"
              class="tab"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
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
              :class="{ active: activeSubTab === subtab.value }"
              @click="activeSubTab = subtab.value"
            >
              {{ subtab.label }}
            </span>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="transaction-list">
          <EmptyState v-if="filteredTransactions.length === 0" />
          <div
            v-else
            v-for="(item, index) in filteredTransactions"
            :key="index"
            class="transaction-item"
            :class="{ 'consumption': activeSubTab === 'subscribe', 'recharge': activeSubTab == 'boost-pack', 'invite': activeSubTab == 'invite' }"
          >

            <template v-if="activeSubTab == 'invite'">
              <div class="transaction-column user-column">
                <div class="transaction-icon">
                  <img src="@/assets/images/user/rise.png" alt="" />
                </div>
                <div class="column-content">
                  <div class="reward-source">{{ getTypeName(item.type) }}</div>
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
                  <div class="reward-source">{{ getTypeName(item.type) }}</div>
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

        <div class="pagination-wrap" v-if="computedTotal > pageSize">
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
const isMounting = ref(true);

onMounted(() => {
  // 处理URL中的type参数
  const type = route.query.type as string;
  if (type === '3') {
    activeTab.value = 'recharge';
    activeSubTab.value = 'invite';
  }

  fetchTransactions();

  // 挂载完成后设置标志为false
  setTimeout(() => {
    isMounting.value = false;
  }, 0);
});

function handleBalanceLoaded(data: any) {
  balance.value = data?.balance.toString();
}

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
  if (activeTab.value === 'recharge') {
    return [
      { value: 'subscribe', label: t('aiRechargeDetails.subscribe') },
      { value: 'boost-pack', label: t('aiRechargeDetails.boostPack') },
      { value: 'invite', label: t('aiRechargeDetails.inviteRewards') }
    ];
  } else if (activeTab.value === 'consumption') {
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

const filteredTransactions = computed(() => {
  return transactions.value;
});

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalFromApi = ref(0);

const computedTotal = computed(() => {
  return totalFromApi.value > 0 ? totalFromApi.value : filteredTransactions.value.length;
});

watch(activeTab, (newTab) => {
  if (newTab === 'recharge') {
    activeSubTab.value = 'subscribe';
  } else if (newTab === 'consumption') {
    activeSubTab.value = 'generate';
  }
  // 切换tab时移除URL中的type参数
  router.replace({ path: router.currentRoute.value.path });
});

watch(activeSubTab, (newSubTab) => {
  // 挂载时不重复调用fetchTransactions
  if (!isMounting.value) {
    fetchTransactions();
    // 切换子tab时移除URL中的type参数
    if (route.query.type) {
      router.replace({ path: router.currentRoute.value.path });
    }
  }
});

watch(page, () => {
  fetchTransactions();
});

watch(dateRange, () => {
  fetchTransactions();
});

function fetchTransactions() {
  let type = 0;

  if (activeTab.value === 'recharge') {
    if (activeSubTab.value === 'subscribe') {
      type = 1;
    } else if (activeSubTab.value === 'boost-pack') {
      type = 2;
    } else if (activeSubTab.value === 'invite') {
      type = 3;
    }
  } else if (activeTab.value === 'consumption') {
    if (activeSubTab.value === 'expired') {
      type = 100;
    }
  }

  if (activeTab.value === 'consumption' && activeSubTab.value === 'generate') {
    api.computeConsume(dateRange.value.start, dateRange.value.end, page.value, pageSize.value).then((res: any) => {
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
              amount: item.change_amount ? Math.abs(parseInt(item.change_amount)) : '0'
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
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    }).catch((error) => {
      toast(t('fatl'))
    });
  } else {
    api.computeDetail(type, dateRange.value.start, dateRange.value.end, page.value, pageSize.value).then((res: any) => {
      if (res.code == 200) {
        if (res.data && Array.isArray(res.data.data_list)) {
          transactions.value = res.data.data_list.map((item: any) => {
            let name = '';
            if (item.source_type === 'payment') {
              name = 'Payment';
            } else if (item.source_type === 'invite') {
              name = 'Invite Reward';
            } else if (item.source_type === 'expired') {
              name = 'Expired';
            } else {
              name = item.source_type || 'Unknown';
            }

            return {
              type: activeTab.value === 'recharge' ? 'recharge' : 'consumption',
              name: name,
              date: item.issued_at || item.created_at || item.date || '',
              amount: activeSubTab.value === 'expired' ? (item.remaining_amount || '0') : (item.change_amount ? Math.abs(parseInt(item.change_amount)) : (item.amount || item.credit || '0')),
              from_user_info: item.from_user_info || null
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
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      }
    }).catch((error) => {
      toast(t('fatl'))
    });
  }
}

function getTypeName(type: string) {
  if (activeTab.value === 'recharge') {
    if (activeSubTab.value === 'subscribe') {
      return t('aiRechargeDetails.subscribe');
    } else if (activeSubTab.value === 'boost-pack') {
      return t('aiRechargeDetails.boostPack');
    } else if (activeSubTab.value === 'invite') {
      return t('aiRechargeDetails.inviteRewards');
    }
  } else if (activeTab.value === 'consumption') {
    if (activeSubTab.value === 'generate') {
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

function goToPaymentHistory() {
  router.push('/user-payment-history?type=4');
}
</script>

<style lang="scss" scoped>
.ai-recharge-details {
  width: 100%;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}

.container {
  max-width: 90ch;
  min-height: calc(100vh - 14rem);
  margin: 12rem auto 2rem;
  padding: 2.4rem 0;
  position: relative;
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);

  .back {
    position: fixed;
    left: 50%;
    top: 12rem;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-55rem);
    border: 1px solid rgba(251, 100, 182, 0.2);
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    cursor: pointer;
    z-index: 10;

    &:hover {
      border: 1px solid rgba(251, 100, 182, 0.5);
      background: rgba(251, 100, 182, 0.06);
    }

    img {
      width: 2.4rem;
      height: 2.4rem;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    padding-bottom: 1.6rem;
    font-size: 2.4rem;
    font-weight: 500;
    text-align: center;
    color: #fb64b6;
    margin-bottom: 3.6rem;

    &::after{
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      content: '';
      width: 6rem;
      height: .4rem;
      border-radius: .4rem;
      background: linear-gradient(0deg, #C27AFF 0%, #FF7FFA 50%, #FB64F3 100%);
    }
  }

  // Balance Section
  .balance-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 3rem 2.4rem;
    padding: 2.4rem;
    background-color: rgba(251,100,182,0.06);
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
      }

      .payment-history-btn {
        background-color: #ffffff;
        color: #fb64b6;
        border: 1px solid #fb64b6;
      }
    }
  }

  // Filter Section
  .filter-section {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.6rem;
    padding: 0 3rem 1.2rem;
    border-bottom: 1px solid rgba(251,100,182,0.2);

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

        &.active {
          color: #fb64b6;
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
    padding: 0 3rem;

    .subnav-tabs {
      display: flex;
      gap: 1.2rem;

      .subtab {
        display: flex;
        align-items: center;
        height: 3.2rem;
        padding: 0 1.6rem;
        font-size: 1.4rem;
        color: #6A7282;
        cursor: pointer;
        border-radius: 0.8rem;

        &.active {
          color: #fb64b6;
          background: rgba(251,100,182,0.12);
          border: 1px solid #fb64b6;
        }
      }
    }
  }

  // Transaction List
  .transaction-list {
    margin: 0 3rem 2.4rem;

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
          width: 5.2rem;
          height: 5.2rem;
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
        color: #101828;
      }

      .transaction-type {
        font-size: 1.2rem;
        color: #99A1AF;
        margin-top: 0.4rem;
      }

      .transaction-amount {
        font-size: 1.6rem;
        color: #6A7282;
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
        color: #364153;

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