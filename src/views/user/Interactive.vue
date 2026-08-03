<template>
  <div class="user-interactive">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.interactive.title") }}</div>
        </div>
        <div class="content">
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">{{ t("user.interactive.fansTotal") }}</div>
              <div class="metric-value">{{ formatSci(fansTotal) }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">{{ t("user.interactive.likesTotal") }}</div>
              <div class="metric-value">{{ formatSci(likesTotal) }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">{{ t("user.interactive.commentsTotal") }}</div>
              <div class="metric-value">{{ formatSci(commentsTotal) }}</div>
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
                @click="downloadFanData"
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
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
                </div>
                <div v-else-if="pagedFan.length == 0" class="empty-row">
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
            <Pagination v-if="!loadingFan && totalFan > limit" v-model="pageFan" :total="totalFan" :pageSize="limit" theme="pink" />
          </div>

          <div class="block overall" v-if="tab === 'work'">
            <div class="block-title">{{ t("user.interactive.overall") }}</div>
            <div class="block-tools">
              <div class="date-range">
                <DateRangePicker v-model="range1" theme="pink" />
              </div>
              <button
                class="download"
                @click="downloadOverallData"
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
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
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
              v-if="!loadingOverall && totalOverall > limit"
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
                <DateRangePicker v-model="range2" theme="pink" />
              </div>
              <button
                class="download"
                @click="downloadSingleWorkData"
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
                  <div class="loading-spinner"></div>
                  <span>{{ t('home.loading') }}</span>
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
            <Pagination v-if="!loadingWork && totalWork > limit" v-model="pageWork" :total="totalWork" :pageSize="limit" theme="blue" />
          </div>
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
import { formatTimestamp, formatDateOnly } from "@/util/utils";

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

// Request identifiers to avoid race conditions
const currentFanRequestId = ref(0);
const currentOverallRequestId = ref(0);
const currentWorkRequestId = ref(0);

function formatSci(n: number | null) {
  if (n == null) return "";
  return Number(n).toLocaleString();
}
function formatChange(n: number) {
  const abs = formatSci(Math.abs(n));
  return `${n >= 0 ? "+" : "-"}${abs}`;
}

function getDefaultDateRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const oneMonthBefore = new Date(yesterday);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);

  return {
    start: oneMonthBefore.toISOString().split("T")[0],
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
  // Generate a unique request ID for this request
  const requestId = ++currentFanRequestId.value;
  // Store the current range at the time of the request
  const currentRange1 = range1.value;

  loadingFan.value = true;
  try {
    const res = await api.userFansList(page, limit, range1.value.start, range1.value.end) as any;

    // Check if this request is still the latest one
    if (requestId !== currentFanRequestId.value) {
      loadingFan.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the range has changed while the request was in flight
    if (currentRange1.start !== range1.value.start || currentRange1.end !== range1.value.end) {
      loadingFan.value = false;
      return; // Skip processing this response as the range has changed
    }

    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalFan.value = parseInt(res.data?.allnums || "0");

      // Transform data
      fanRows.value = data.map((item: any) => {
        const date = new Date(item.stat_date);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
        const weekday = date.toLocaleDateString('en-US', options);
        return {
          id: parseInt(item.id || "0"),
          dateLabel: formatDateOnly(item.stat_date),
          change: parseInt(item.follower_delta || "0"),
          total: parseInt(item.follower_total || "0"),
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
  // Generate a unique request ID for this request
  const requestId = ++currentOverallRequestId.value;
  // Store the current range at the time of the request
  const currentRange1 = range1.value;

  loadingOverall.value = true;
  try {
    const res = await api.userWorkList(page, limit, range1.value.start, range1.value.end) as any;

    // Check if this request is still the latest one
    if (requestId !== currentOverallRequestId.value) {
      loadingOverall.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the range has changed while the request was in flight
    if (currentRange1.start !== range1.value.start || currentRange1.end !== range1.value.end) {
      loadingOverall.value = false;
      return; // Skip processing this response as the range has changed
    }

    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalOverall.value = parseInt(res.data?.allnums || "0");

      // Transform data
      overallRows.value = data.map((item: any, index: number) => ({
        id: index + 1,
        dateLabel: formatDateOnly(item.created_date),
        likes: parseInt(item.like_counts || "0"),
        comments: parseInt(item.comment_count || "0"),
      }));

      pagedOverall.value = overallRows.value;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    console.error('Error fetching overall work data:', error);
  } finally {
    loadingOverall.value = false;
  }
}

// Fetch individual work data
async function fetchWork(page: number) {
  // Generate a unique request ID for this request
  const requestId = ++currentWorkRequestId.value;
  // Store the current range at the time of the request
  const currentRange2 = range2.value;

  loadingWork.value = true;
  try {
    const res = await api.userSingleWorkList(page, limit, range2.value.start, range2.value.end) as any;

    // Check if this request is still the latest one
    if (requestId !== currentWorkRequestId.value) {
      loadingWork.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the range has changed while the request was in flight
    if (currentRange2.start !== range2.value.start || currentRange2.end !== range2.value.end) {
      loadingWork.value = false;
      return; // Skip processing this response as the range has changed
    }

    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      totalWork.value = parseInt(res.data?.allnums || "0");

      // Transform data
      workRows.value = data.map((item: any) => ({
        id: parseInt(item.id || "0"),
        dateLabel: formatDateOnly(item.created_date),
        title: item.title || "",
        cover: item.cover || "",
        likes: parseInt(item.like_counts || "0"),
        comments: parseInt(item.comment_count || "0"),
      }));

      pagedWork.value = workRows.value
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  () => [range1.value.start, range1.value.end],
  () => {
    // Reset to first page when date range changes
    if (tab.value === 'fan') {
      pageFan.value = 1;
      fetchFan(pageFan.value);
    } else if (tab.value === 'work') {
      pageOverall.value = 1;
      fetchOverall(pageOverall.value);
    }
  },
);

watch(
  () => [range2.value.start, range2.value.end],
  () => {
    // Only fetch work data when range2 changes and we're on work tab
    if (tab.value === 'work') {
      pageWork.value = 1;
      fetchWork(pageWork.value);
    }
  },
);

function downloadCsv(rows: Array<Record<string, unknown>>, cols: string[]) {
  // Check if rows is empty
  if (!rows || rows.length === 0) {
    toast(t('user.interactive.noData'));
    return;
  }

  // Get translated headers
  const header = cols.map(col => {
    // Map dateLabel to date for translation
    const translatedCol = col === 'dateLabel' ? 'date' : col;
    return t(`user.interactive.csvHeaders.${translatedCol}`);
  }).join(",");
  const body = rows.map((r) => cols.map((c) => String(r[c] ?? "")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t('user.interactive.csvFileName')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateFileName(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}_${random}.csv`;
}

async function downloadFanData() {
  const startDate = range1.value.start;
  const endDate = range1.value.end;

  try {
    const res = await api.downloadUserFansList(startDate, endDate) as any;
    const fileName = generateFileName();

    if (typeof res === 'string') {
      const csvContent = res;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else if (res.code === 200) {
      const csvContent = res.data;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast(locale.value === 'jp' ? res.msg_jp : res.msg || t('user.interactive.downloadFailed'));
    }
  } catch (error) {
    console.error('Download fan data error:', error);
    toast(t('user.interactive.downloadFailed'));
  }
}

async function downloadOverallData() {
  const startDate = range1.value.start;
  const endDate = range1.value.end;

  try {
    const res = await api.downloadUserWorkList(startDate, endDate) as any;
    const fileName = generateFileName();

    if (typeof res === 'string') {
      const csvContent = res;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else if (res.code === 200) {
      const csvContent = res.data;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast(locale.value === 'jp' ? res.msg_jp : res.msg || t('user.interactive.downloadFailed'));
    }
  } catch (error) {
    console.error('Download overall data error:', error);
    toast(t('user.interactive.downloadFailed'));
  }
}

async function downloadSingleWorkData() {
  const startDate = range2.value.start;
  const endDate = range2.value.end;

  try {
    const res = await api.downloadUuserSingleWorkList(startDate, endDate) as any;
    const fileName = generateFileName();

    if (typeof res === 'string') {
      const csvContent = res;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else if (res.code === 200) {
      const csvContent = res.data;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast(locale.value === 'jp' ? res.msg_jp : res.msg || t('user.interactive.downloadFailed'));
    }
  } catch (error) {
    console.error('Download single work data error:', error);
    toast(t('user.interactive.downloadFailed'));
  }
}
</script>

<style scoped lang="scss">
.user-interactive {
  width: 100%;
  min-height: 100vh;
  background: #FFFBF4;
}
.container {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 100px 30px 24px;
}
.main {
  flex: 1;
  padding: 24px;
  border: 2.5px solid #161122;
  border-radius: 14px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #161122;
  position: relative;
  padding-bottom: 10px;
}
.panel-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #FF4D8D;
}

.metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 146px;
  padding: 24px;
  background: #FFFDF7;
  border: 2px solid #161122;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}
.metric::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
}
.metric:nth-child(1)::before {
  background: #FF4D8D;
}
.metric:nth-child(2)::before {
  background: #FFD23F;
}
.metric:nth-child(3)::before {
  background: #7FD8E8;
}
.metric-label {
  color: #161122;
  font-size: 14px;
  font-weight: 600;
  padding-top: 6px;
}
.metric-value {
  font-size: 32px;
  color: #161122;
  font-weight: 700;
}

.tabs {
  display: inline-flex;
  gap: 0;
  padding: 5px;
  border: 2px solid #161122;
  border-radius: 14px;
  background: #FFFDF7;
  margin-bottom: 24px;
}
.tabs span {
  height: auto;
  cursor: pointer;
  font-size: 14px;
  color: #161122;
  padding: 8px 20px;
  border-radius: 10px;
  transition: all 0.15s ease;
}
.tabs span.on {
  font-weight: 700;
  color: #FFFDF7;
  background: #161122;
  border-radius: 10px;
}

.block-title {
  display: flex;
  align-items: center;
  height: 40px;
  font-size: 14px;
  font-weight: 700;
  padding: 0 36px;
  color: #161122;
}
.block.overall .block-title {
  color: #FF4D8D;
}
.block.work .block-title {
  color: #7FD8E8;
}
.block-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}

.date-range {
  display: flex;
  align-items: center;
}
.date-range input {
  height: 28px;
  border: none;
  outline: none;
  color: #161122;
}
.download {
  height: 40px;
  padding: 0 12px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #FF4D8D;
  color: #FFFDF7;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.download:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}
.download:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #161122;
}
.block.overall .download {
  background: #FF4D8D;
}
.block.work .download {
  background: #7FD8E8;
}
.dl-icon {
  width: 16px;
  height: 16px;
}
.table {
  border: 2px solid #161122;
  border-radius: 13px;
  overflow: hidden;
  margin: 0 0 24px;
  background: #FFFDF7;
}
.thead,
.tr {
  display: grid;
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
  height: 54px;
  padding: 0 20px;
  font-size: 14px;
}
.num-green {
  color: #05df72;
  font-weight: 700;
}
.num-red {
  color: #fb4d64;
  font-weight: 700;
}

.table.overall .thead,
.table.overall .tr {
  border-bottom: 1px solid #161122;
}
.table.work .thead,
.table.work .tr {
  border-bottom: 1px solid #161122;
}
.thead {
  background: #161122;
}
.th {
  color: #FFFDF7;
  font-weight: 700;
}
.td {
  color: #161122;
}
.table.overall .tbody .tr:hover {
  background: #FFF0F5;
}
.table.work .tbody .tr:hover {
  background: #F0F8FF;
}
.table.work .tbody .td.info {
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 2px solid #161122;
    object-fit: cover;
  }

  span {
    flex: 1;
    font-size: 14px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
}
.empty-row {
  padding: 0 0 100px;
}
.loading-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px 0;
  gap: 12px;

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e7e1d8;
    border-top: 3px solid #161122;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    box-sizing: border-box;
  }
  span {
    font-size: 16px;
    color: #161122;
    font-weight: 600;
  }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.block .pagination {
  margin: 24px 0;
  justify-content: center;
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
  padding: 24px;
  margin-left: 0;
  }
  .metric {
    height: auto;
    padding: 20px;
  }
  .metric-value {
    font-size: 24px;
  }
  .table {
    overflow-x: auto;
  }
  .table.overall .thead,
  .table.overall .tr {
    grid-template-columns: 1fr 1fr 1fr;
    min-width: 400px;
  }
  .table.work .thead,
  .table.work .tr {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    min-width: 500px;
  }
  .block-tools {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .metrics {
    flex-direction: column;
    gap: 12px;
  }
  .metric {
    padding: 16px;
  }
  .metric-value {
    font-size: 20px;
  }
  .block {
    padding: 16px;
  }
  .tabs span {
    padding: 8px 16px;
    font-size: 13px;
  }
  .block-title {
    padding: 0 16px;
  }
  .th, .td {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
