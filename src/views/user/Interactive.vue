<template>
  <div class="user-interactive">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-title">{{ t("user.interactive.title") }}</div>
        <div class="metrics">
          <div class="metric fans">
            <div class="metric-label">{{ t("user.interactive.fansTotal") }}</div>
            <div class="metric-value pink">{{ formatSci(fansTotal) }}</div>
          </div>
          <div class="metric likes">
            <div class="metric-label">{{ t("user.interactive.likesTotal") }}</div>
            <div class="metric-value blue">{{ formatSci(likesTotal) }}</div>
          </div>
          <div class="metric comments">
            <div class="metric-label">{{ t("user.interactive.commentsTotal") }}</div>
            <div class="metric-value orange">{{ formatSci(commentsTotal) }}</div>
          </div>
        </div>

        <div class="tabs">
          <span :class="{ on: tab === 'fan' }" @click="tab = 'fan'">{{
            t("user.interactive.tabFan")
          }}</span>
          <span :class="{ on: tab === 'work' }" @click="tab = 'work'">{{
            t("user.interactive.tabWork")
          }}</span>
        </div>

        <div class="block overall" v-if="tab === 'fan'">
          <div class="block-tools">
            <div class="date-range">
              <DateRangePicker v-model="range1" theme="pink" />
            </div>
            <button
              class="download"
              @click="downloadCsv(fanRows, ['dateLabel', 'change', 'total'])"
            >
              <img class="dl-icon" :src="downloadIcon" alt="" />
              <span>{{ t("user.interactive.download") }}</span>
            </button>
          </div>
          <div class="table overall">
            <div class="thead">
              <div class="th">{{ t("user.interactive.date") }}</div>
              <div class="th">{{ t("user.interactive.followerChange") }}</div>
              <div class="th">{{ t("user.interactive.totalFollowers") }}</div>
            </div>
            <div class="tbody">
              <div v-if="loadingFan" class="loading-row">
                <div class="td" colspan="3">
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
                </div>
              </div>
              <div v-else-if="pagedFan.length === 0" class="empty-row">
                <EmptyState />
              </div>
              <div v-else class="tr" v-for="row in pagedFan" :key="row.id">
                <div class="td">{{ row.dateLabel }}</div>
                <div class="td">
                  <span :class="row.change >= 0 ? 'num-green' : 'num-red'">
                    {{ formatChange(row.change) }}
                  </span>
                </div>
                <div class="td">{{ formatSci(row.total) }}</div>
              </div>
            </div>
          </div>
          <Pagination v-if="totalFan > limit" v-model="pageFan" :total="totalFan" :pageSize="limit" theme="pink" />
        </div>

        <div class="block overall" v-if="tab === 'work'">
          <div class="block-title">{{ t("user.interactive.overall") }}</div>
          <div class="block-tools">
            <div class="date-range">
              <DateRangePicker v-model="range1" theme="pink" />
            </div>
            <button
              class="download"
              @click="downloadCsv(overallRows, ['dateLabel', 'likes', 'comments'])"
            >
              <img class="dl-icon" :src="downloadIcon" alt="" />
              <span>{{ t("user.interactive.download") }}</span>
            </button>
          </div>
          <div class="table overall">
            <div class="thead">
              <div class="th">{{ t("user.interactive.date") }}</div>
              <div class="th">{{ t("user.interactive.dailyLikes") }}</div>
              <div class="th">{{ t("user.interactive.dailyComments") }}</div>
            </div>
            <div class="tbody">
              <div v-if="loadingOverall" class="loading-row">
                <div class="td" colspan="3">
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
                </div>
              </div>
              <div v-else-if="pagedOverall.length === 0" class="empty-row">
                <EmptyState />
              </div>
              <div v-else class="tr" v-for="row in pagedOverall" :key="row.id">
                <div class="td">{{ row.dateLabel }}</div>
                <div class="td">{{ formatSci(row.likes) }}</div>
                <div class="td">{{ formatSci(row.comments) }}</div>
              </div>
            </div>
          </div>
          <Pagination
            v-if="totalOverall > limit"
            v-model="pageOverall"
            :total="totalOverall"
            :pageSize="limit"
            theme="pink"
          />
        </div>

        <div class="block work" v-if="tab === 'work'">
          <div class="block-title">{{ t("user.interactive.individual") }}</div>
          <div class="block-tools">
            <div class="date-range">
              <DateRangePicker v-model="range2" theme="blue" />
            </div>
            <button
              class="download"
              @click="downloadCsv(workRows, ['dateLabel', 'title', 'likes', 'comments'])"
            >
              <img class="dl-icon" :src="downloadIcon" alt="" />
              <span>{{ t("user.interactive.download") }}</span>
            </button>
          </div>
          <div class="table work">
            <div class="thead">
              <div class="th">{{ t("user.interactive.date") }}</div>
              <div class="th">{{ t("user.interactive.workTitle") }}</div>
              <div class="th">{{ t("user.interactive.dailyLikes") }}</div>
              <div class="th">{{ t("user.interactive.dailyComments") }}</div>
            </div>
            <div class="tbody">
              <div v-if="loadingWork" class="loading-row">
                <div class="td" colspan="4">
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
                </div>
              </div>
              <div v-else-if="pagedWork.length === 0" class="empty-row">
                <EmptyState />
              </div>
              <div v-else class="tr" v-for="row in pagedWork" :key="row.id">
                <div class="td">{{ row.dateLabel }}</div>
                <div class="td info">
                  <img :src="row.cover" alt="" />
                  <span>{{ row.title }}</span>
                </div>
                <div class="td">{{ formatSci(row.likes) }}</div>
                <div class="td">{{ formatSci(row.comments) }}</div>
              </div>
            </div>
          </div>
          <Pagination v-if="totalWork > limit" v-model="pageWork" :total="totalWork" :pageSize="limit" theme="blue" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserInteractive">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import Pagination from "@/components/Pagination.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import EmptyState from "@/components/EmptyState.vue";
import downloadIcon from "@/assets/images/user/download.png";
import { ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api";
import { toast } from "@/util/toast";

const { t, locale } = useI18n();

const sidebarKey = ref("interactive");
const tab = ref<"fan" | "work">("fan");

const fansTotal = ref<number | null>(null);
const likesTotal = ref<number | null>(null);
const commentsTotal = ref<number | null>(null);

function handleUserInfoLoaded(userInfo: any) {
  if (userInfo) {
    fansTotal.value = userInfo.fans_count || 0;
    likesTotal.value = userInfo.like_count || 0;
    commentsTotal.value = userInfo.comment_count || 0;
  }
}

// Loading states
const loadingFan = ref(false);
const loadingOverall = ref(false);
const loadingWork = ref(false);

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}
function formatChange(n: number) {
  const abs = formatSci(Math.abs(n));
  return `${n >= 0 ? "+" : ""}${abs}`;
}

function getDefaultDateRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysBefore = new Date(yesterday);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 6);

  return {
    start: sevenDaysBefore.toISOString().split("T")[0],
    end: yesterday.toISOString().split("T")[0],
  };
}

const range1 = ref(getDefaultDateRange());
const range2 = ref(getDefaultDateRange());

type FanRow = { id: number; dateLabel: string; change: number; total: number };
type OverallRow = { id: number; dateLabel: string; likes: number; comments: number };
type WorkRow = { id: number; dateLabel: string; title: string; cover: string; likes: number; comments: number };

const fanRows = ref<FanRow[]>([]);
const overallRows = ref<OverallRow[]>([]);
const workRows = ref<WorkRow[]>([]);

const totalFan = ref(0);
const totalOverall = ref(0);
const totalWork = ref(0);

const pageFan = ref(1);
const pageOverall = ref(1);
const pageWork = ref(1);
const pagedFan = ref<FanRow[]>([]);
const pagedOverall = ref<OverallRow[]>([]);
const pagedWork = ref<WorkRow[]>([]);

const limit = 10;

// Fetch fans data
async function fetchFan(page: number) {
  loadingFan.value = true;
  try {
    const res = await api.userFansList(page, limit, range1.value.start, range1.value.end) as any;
    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalFan.value = parseInt(res.data?.allnums || "0");

      // Transform data
      fanRows.value = data.map((item: any, index: number) => {
        const date = new Date(item.created_date);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
        const weekday = date.toLocaleDateString('en-US', options);
        return {
          id: index + 1,
          dateLabel: `${item.created_date} (${weekday})`,
          change: parseInt(item.like_counts || "0"),
          total: parseInt(item.comment_count || "0"),
        };
      });

      pagedFan.value = fanRows.value;
    }
  } catch (error) {
    console.error('Error fetching fan data:', error);
  } finally {
    loadingFan.value = false;
  }
}

// Fetch overall work data
async function fetchOverall(page: number) {
  loadingOverall.value = true;
  try {
    const res = await api.userWorkList(page, limit, range1.value.start, range1.value.end) as any;
    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalOverall.value = parseInt(res.data?.allnums || "0");

      // Transform data
      overallRows.value = data.map((item: any, index: number) => ({
        id: index + 1,
        dateLabel: item.created_date,
        likes: parseInt(item.like_counts || "0"),
        comments: parseInt(item.comment_count || "0"),
      }));

      pagedOverall.value = overallRows.value;
    }
  } catch (error) {
    console.error('Error fetching overall work data:', error);
  } finally {
    loadingOverall.value = false;
  }
}

// Fetch individual work data
async function fetchWork(page: number) {
  loadingWork.value = true;
  try {
    const res = await api.userSingleWorkList(page, limit, range2.value.start, range2.value.end) as any;
    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalWork.value = parseInt(res.data?.allnums || "0");

      // Transform data
      workRows.value = data.map((item: any) => ({
        id: parseInt(item.id || "0"),
        dateLabel: item.created_date,
        title: item.title || "",
        cover: item.cover || "",
        likes: parseInt(item.like_counts || "0"),
        comments: parseInt(item.comment_count || "0"),
      }));

      pagedWork.value = workRows.value
    }
  } catch (error) {
    console.error('Error fetching individual work data:', error);
  } finally {
    loadingWork.value = false;
  }
}

// Fetch initial data
onMounted(() => {
  // Default to fetch only fan data
  fetchFan(pageFan.value);
});

// Watch for page changes
watch(pageFan, (p) => {
  fetchFan(p);
});
watch(pageOverall, (p) => {
  fetchOverall(p);
});
watch(pageWork, (p) => {
  fetchWork(p);
});

// Watch for tab changes
watch(tab, (newTab) => {
  // Reset pages and fetch data when tab changes
  if (newTab === 'fan') {
    pageFan.value = 1;
    fetchFan(pageFan.value);
  } else if (newTab === 'work') {
    pageOverall.value = 1;
    pageWork.value = 1;
    fetchOverall(pageOverall.value);
    fetchWork(pageWork.value);
  }
});

// Watch for date range changes
watch(
  [range1, range2],
  () => {
    // Reset to first page when date range changes
    pageFan.value = 1;
    pageOverall.value = 1;
    pageWork.value = 1;

    // Fetch new data
    fetchFan(pageFan.value);
    fetchOverall(pageOverall.value);
    fetchWork(pageWork.value);
  },
  { deep: true },
);

function downloadCsv(rows: Array<Record<string, unknown>>, cols: string[]) {
  // Check if rows is empty
  if (!rows || rows.length === 0) {
    toast(t('user.interactive.noData'));
    return;
  }

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
.user-interactive {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  max-width: 139.2rem;
  min-height: calc(100vh - 14rem);
  margin: 0 auto;
  display: flex;
  gap: 2.4rem;
}
.main {
  flex: 1;
  margin: 12rem 0 2rem;
  padding-top: 2.4rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
}

.panel-title {
  margin: 0 3.6rem;
  font-weight: 500;
  font-size: 2rem;
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
  font-size: 3.2rem;
}
.metric-value.pink {
  color: #fb64b6;
}
.metric-value.blue {
  color: #00d3f2;
}
.metric-value.orange {
  color: #ff9e45;
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
.table {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  overflow: hidden;
  margin: 0 3.6rem 2.4rem;
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
.table.overall .thead,
.table.overall .tr {
  grid-template-columns: 1fr 1fr 1fr;
}
.table.work .thead,
.table.work .tr {
  grid-template-columns: 1fr 1fr 1fr 1fr;
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

.table.overall .thead,
.table.overall .tr {
  border-bottom: 1px solid rgba(251, 100, 182, 0.05);
}
.table.work .thead,
.table.work .tr {
  border-bottom: 1px solid rgba(0, 211, 242, 0.05);
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
.table.overall .tbody .tr:hover {
  background: rgba(251, 100, 182, 0.04);
}
.table.work .tbody .tr:hover {
  background: rgba(0, 211, 242, 0.04);
}
.table.work .tbody .td.info {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  img{
    width: 4rem;
    height: 4rem;
    border-radius: 0.4rem;
    object-fit: cover;
  }
}
.empty-row{
  padding: 0 0 10rem;
}
.block .pagination {
  margin: 2.4rem 0;
  justify-content: center;
}
</style>
