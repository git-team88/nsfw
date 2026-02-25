<template>
  <div class="user-revenue">
    <Header :cur="-1"></Header>

    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-title">{{ t("user.interactive.title") }}</div>
          <div class="metrics">
            <div class="metric fans">
              <div class="metric-label">{{ t("user.revenue.total") }}</div>
              <div class="metric-value pink">
                {{ totalRevenue != null ? `$${formatSci(totalRevenue)}` : "--" }}
              </div>
            </div>
            <div class="metric likes">
              <div class="metric-label">{{ t("user.revenue.withdrawn") }}</div>
              <div class="metric-value blue">
                {{ withdrawnRevenue != null ? `$${formatSci(withdrawnRevenue)}` : "--" }}
              </div>
            </div>
            <div class="metric comments">
              <div class="metric-label">{{ t("user.revenue.pending") }}</div>
              <div class="metric-value orange">
                {{ pendingRevenue != null ? `$${formatSci(pendingRevenue)}` : "--" }}
              </div>
            </div>
          </div>

          <div class="withdraw-banner">
            <div class="banner-left">
              <div class="banner-label">
                {{ t("user.revenue.totalWithdrawable") }} <span class="amount">--</span>
              </div>
              <div class="banner-tip">
                {{ t("user.revenue.withdrawTip") }}
                <span class="pink" @click="openCommunityConvention">{{ t("user.revenue.communityRule") }}</span>
                {{ t("user.revenue.withdrawTipEnd") }}
              </div>
            </div>
            <button class="withdraw-btn" @click="openWithdraw">
              <img src="@/assets/images/user/withdraw_icon.png" alt="" />
              {{ t("user.revenue.withdraw") }}
            </button>
          </div>

          <div class="tabs">
            <span :class="{ on: tab === 'detail' }" @click="tab = 'detail'">{{
              t("user.revenue.tabDetail")
            }}</span>
            <span :class="{ on: tab === 'record' }" @click="tab = 'record'">{{
              t("user.revenue.tabRecord")
            }}</span>
          </div>

          <div class="block overall" v-if="tab === 'detail'">
            <div class="block-tools">
              <div class="date-range">
                <DateRangePicker v-model="range1" theme="pink" />
              </div>
              <button
                class="download"
                @click="downloadCsv(revenueRows, ['timeLabel', 'period', 'revenue'])"
              >
                <img class="dl-icon" :src="downloadIcon" alt="" />
                <span>{{ t("user.interactive.download") }}</span>
              </button>
            </div>
            <div class="table overall">
              <div class="thead">
                <div class="th">{{ t("user.revenue.time") }}</div>
                <div class="th">{{ t("user.revenue.period") }}</div>
                <div class="th">{{ t("user.revenue.revenue") }}</div>
              </div>
              <div class="tbody">
                <div class="tr" v-for="row in pagedRevenue" :key="row.id">
                  <div class="td">{{ row.timeLabel }}</div>
                  <div class="td">{{ row.period }}</div>
                  <div class="td">
                    <span class="num-green">+{{ formatSci(row.revenue) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <EmptyState v-if="revenueRows.length === 0" />
            <Pagination
              v-if="Math.ceil(revenueRows.length / 5) > 1"
              v-model="pageRevenue"
              :total="revenueRows.length"
              :pageSize="5"
              theme="pink"
            />
          </div>

          <div class="block overall" v-if="tab === 'record'">
            <div class="block-tools">
              <div class="date-range">
                <DateRangePicker v-model="range1" theme="pink" />
              </div>
              <button
                class="download"
                @click="downloadCsv(withdrawRows, ['timeLabel', 'withdraw'])"
              >
                <img class="dl-icon" :src="downloadIcon" alt="" />
                <span>{{ t("user.interactive.download") }}</span>
              </button>
            </div>
            <div class="table record">
              <div class="thead">
                <div class="th">{{ t("user.revenue.time") }}</div>
                <div class="th">{{ t("user.revenue.withdraw") }}</div>
              </div>
              <div class="tbody">
                <div class="tr" v-for="row in pagedWithdraw" :key="row.id">
                  <div class="td">{{ row.timeLabel }}</div>
                  <div class="td">
                    <span class="num-red">-{{ formatSci(row.withdraw) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <EmptyState v-if="withdrawRows.length === 0" />
            <Pagination
              v-if="Math.ceil(withdrawRows.length / 5) > 1"
              v-model="pageWithdraw"
              :total="withdrawRows.length"
              :pageSize="5"
              theme="pink"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserRevenue">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import Pagination from "@/components/Pagination.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import EmptyState from "@/components/EmptyState.vue";
import downloadIcon from "@/assets/images/user/download.png";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import dayjs from "dayjs";
import {toast} from "@/util/toast";

const { t, locale } = useI18n();
const sidebarKey = ref("revenue");
const tab = ref<"detail" | "record">("detail");

const totalRevenue = ref<number | null>(null);
const withdrawnRevenue = ref<number | null>(null);
const pendingRevenue = ref<number | null>(null);

function openWithdraw() {
  toast('There is currently no profit')
  // router.push("/user-withdraw");
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank");
}

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getSevenDaysBeforeCurrent = () => {
  return dayjs().subtract(6, "day").format("YYYY-MM-DD");
};

const range1 = ref({ start: getSevenDaysBeforeCurrent(), end: getCurrentDate() });

type RevenueRow = { id: number; timeLabel: string; period: string; revenue: number };
type WithdrawRow = { id: number; timeLabel: string; withdraw: number };
const revenueRows = ref<RevenueRow[]>([]);
const withdrawRows = ref<WithdrawRow[]>([]);
const pageRevenue = ref(1);
const pageWithdraw = ref(1);
const pagedRevenue = ref<RevenueRow[]>([]);
const pagedWithdraw = ref<WithdrawRow[]>([]);
async function fetchRevenue(page: number) {
  const start = (page - 1) * 5;
  await new Promise((r) => setTimeout(r, 120));
  pagedRevenue.value = revenueRows.value.slice(start, start + 5);
}
async function fetchWithdraw(page: number) {
  const start = (page - 1) * 5;
  await new Promise((r) => setTimeout(r, 120));
  pagedWithdraw.value = withdrawRows.value.slice(start, start + 5);
}
fetchRevenue(pageRevenue.value);
fetchWithdraw(pageWithdraw.value);
watch(pageRevenue, (p) => {
  fetchRevenue(p);
});
watch(pageWithdraw, (p) => {
  fetchWithdraw(p);
});

function downloadCsv(rows: Array<Record<string, unknown>>, cols: string[]) {
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => String(r[c] ?? "")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.csv";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped lang="scss">
.user-revenue {
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
  margin-bottom: 2rem;
  padding: 12rem 0 0;
}
.panel {
  min-height: calc(100vh - 14rem);
  padding-top: 2.4rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
}
.panel-title {
  margin: 0 3.6rem;
  font-size: 1.8rem;
  color: #101828;
  margin-bottom: 2.4rem;
}
.metrics {
  display: flex;
  gap: 2rem;
  margin: 0 3.6rem 2.4rem;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 14.6rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  padding: 2.4rem;
  background: #fff;
}
.metric.fans {
  border-color: rgba(251, 100, 182, 0.2);
  box-shadow: 0px 2px 8px 0px rgba(251, 100, 182, 0.05);
}
.metric.likes {
  border-color: rgba(0, 211, 242, 0.2);
  box-shadow: 0px 2px 8px 0px rgba(0, 211, 242, 0.05);
}
.metric.comments {
  border-color: rgba(255, 158, 69, 0.2);
  box-shadow: 0px 2px 8px 0px rgba(255, 105, 0, 0.05);
}
.metric-label {
  color: #6a7282;
  font-size: 1.2rem;
}
.metric-value {
  margin-top: 1.6rem;
  font-weight: 500;
  font-size: 3.2rem;
  &.pink {
    color: #fb64b6;
  }
  &.blue {
    color: #00d3f2;
  }
  &.orange {
    color: #ff9d00;
  }
}

.withdraw-banner {
  margin: 0 3.6rem 2.4rem;
  padding: 1.6rem 2.4rem;
  background: rgba(251, 100, 182, 0.06);
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .banner-left {
    .banner-label {
      font-size: 1.6rem;
      color: #6a7282;
      .amount {
        font-weight: 500;
        font-size: 2.8rem;
        color: #ff6900;
        margin-left: 0.8rem;
      }
    }
    .banner-tip {
      font-size: 1.2rem;
      color: #6a7282;
      margin-top: 0.8rem;
      .pink {
        cursor: pointer;
        color: #fb64b6;
      }
    }
  }

  .withdraw-btn {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 13.6rem;
    height: 4.8rem;
    padding: 0 2.4rem;
    background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
    border-radius: 0.8rem;
    border: none;
    color: #ffffff;
    font-size: 1.6rem;
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
  }
}

.tabs {
  display: flex;
  gap: 3rem;
  padding: 0 3.6rem 2rem;
  position: relative;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}
.tabs span {
  height: auto;
  cursor: pointer;
  font-size: 1.4rem;
  color: #6a7282;
  position: relative;
}
.tabs span.on {
  color: #101828;
}
.tabs span.on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rem;
  height: 2px;
  background: #fb64b6;
}
.block {
  border: none;
  border-radius: 0.8rem;
  padding: 0;
  background: #fff;
}
.block-title {
  display: flex;
  align-items: center;
  height: 4rem;
  font-size: 1.4rem;
  padding: 0 3.6rem;
}
.block.overall {
  border-color: rgba(251, 100, 182, 0.2);
}
.block.overall .block-title {
  color: #fb64b6;
  background: linear-gradient(90deg, rgba(251, 100, 182, 0.1) 0%, rgba(251, 100, 182, 0) 100%);
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}
.block.work {
  border-color: rgba(0, 211, 242, 0.2);
}
.block.work .block-title {
  color: #00d3f2;
  background: linear-gradient(90deg, rgba(0, 211, 242, 0.1) 0%, rgba(0, 211, 242, 0) 100%);
  border-top: 1px solid rgba(0, 211, 242, 0.2);
  border-bottom: 1px solid rgba(0, 211, 242, 0.2);
}
.block-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3.6rem;
  margin: 2.4rem 0;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0;
  border: none;
  border-radius: 0.6rem;
  background: #fff;
}
.date-range input {
  height: 2.8rem;
  border: none;
  outline: none;
  color: #6a7282;
}
.download {
  height: 4rem;
  padding: 0 1.2rem;
  border: none;
  border-radius: 0.6rem;
  background: #00d3f2;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}
.block.overall .download {
  background: #fb64b6;
}
.block.work .download {
  background: #00d3f2;
}
.download:hover {
  position: relative;
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
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
.dl-icon {
  width: 1.6rem;
  height: 1.6rem;
}
.withdraw-btn {
  height: 14.6rem;
  min-width: 14rem;
  margin-left: auto;
  padding: 0 2rem;
  border: none;
  border-radius: 0.8rem;
  background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
  color: #fff;
  cursor: pointer;
  font-size: 1.6rem;
}
.table {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  overflow: hidden;
  margin: 0 3.6rem;
}
.thead,
.tr {
  display: grid;
}
.table.overall {
  border: 1px solid rgba(251, 100, 182, 0.1);
}
.table.work {
  border: 1px solid rgba(0, 211, 242, 0.1);
}
.table.record {
  border: 1px solid rgba(251, 100, 182, 0.1);
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
  height: 5.2rem;
  padding: 0 2rem;
  font-size: 1.4rem;
}
.num-green {
  color: #05df72;
}
.num-red {
  color: #fb4d64;
}
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 36rem;
  padding: 2rem;
  border-radius: 1rem;
  background: #fff;
  position: relative;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}
.modal-close {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  cursor: pointer;
}
.modal-close img {
  width: 1.6rem;
  height: 1.6rem;
}
.modal-title {
  font-size: 1.4rem;
  color: #6a7282;
  margin-bottom: 1rem;
}
.modal-amount {
  font-size: 3rem;
  color: #ff9e45;
  margin-bottom: 1.2rem;
}
.modal-confirm {
  height: 4rem;
  padding: 0 1.6rem;
  border: none;
  border-radius: 0.8rem;
  background: #fb64b6;
  color: #fff;
  cursor: pointer;
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: default;
}
.modal-agree {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
  margin-top: 1rem;
  color: #6a7282;
  font-size: 1.2rem;
}
.check-btn {
  width: 1.8rem;
  height: 1.8rem;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.check-btn img {
  width: 1.8rem;
  height: 1.8rem;
}
.modal-agree .terms {
  color: #fb64b6;
  text-decoration: none;
  cursor: pointer;
}
.modal-agree .terms:hover {
  text-decoration: underline;
}

.table.overall .thead,
.table.overall .tr {
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
}
.table.work .thead,
.table.work .tr {
  border-bottom: 1px solid rgba(0, 211, 242, 0.05);
}
.table.record .thead,
.table.record .tr {
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
}
.th {
  color: #6a7282;
}
td {
  color: #364153;
}
.table.overall .th {
  background: none;
}
.table.work .th {
  background: none;
}
.table.record .th {
  background: none;
}
.table.overall .tbody .tr:hover {
  background: rgba(251, 100, 182, 0.04);
}
.table.work .tbody .tr:hover {
  background: rgba(0, 211, 242, 0.04);
}
.table.record .tbody .tr:hover {
  background: rgba(251, 100, 182, 0.04);
}
.block .pagination {
  margin: 2.4rem 0;
  justify-content: center;
}
</style>
