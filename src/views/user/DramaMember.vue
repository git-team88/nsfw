<template>
  <div class="user-drama-member">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.dramaMember.title") }}</div>
        </div>
        <div class="content">
          <!-- 当前会员状态：接口还没定，memberStatus 为空时整块不显示（见 loadMemberStatus） -->
          <div class="status-card" v-if="memberStatus">
            <div class="status-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18 2.8 7.5l4.7 3.7L12 5l4.5 6.2 4.7-3.7L19.5 18Z"/><path d="M5 21h14"/></svg>
              {{ t("user.dramaMember.statusActive") }}
            </div>
            <div class="status-row"><span class="status-label">{{ t("user.dramaMember.currentPlan") }}</span><span class="status-value">{{ memberStatus.planName }}</span></div>
            <div class="status-row"><span class="status-label">{{ t("user.dramaMember.validUntil") }}</span><span class="status-value">{{ memberStatus.validUntil }}</span></div>
            <div class="status-row">
              <span class="status-label">{{ t("user.dramaMember.autoRenew") }}</span>
              <span class="status-value">{{ memberStatus.autoRenew ? t("user.dramaMember.on") : t("user.dramaMember.off") }}<span class="manage-link" @click="goManage">{{ t("user.dramaMember.manage") }}</span></span>
            </div>
          </div>
          <!-- 没开通：权益横幅 -->
          <div class="banner" v-else>
            <div class="banner-title">{{ t("user.dramaMember.banner") }}</div>
            <div class="banner-sub">{{ t("user.dramaMember.bannerSub") }}</div>
          </div>

          <div class="section-label">{{ t("user.dramaMember.allPlans") }}</div>

          <div class="plan-empty" v-if="plansLoaded && !plans.length">{{ t("common.noData") }}</div>
          <div class="plan-list" v-else>
            <div
              class="plan-card"
              v-for="plan in plans"
              :key="planKey(plan)"
              :class="{ active: selectedId === planKey(plan), readonly: !!memberStatus }"
              @click="!memberStatus && (selectedId = planKey(plan))"
            >
              <span class="radio"><span class="radio-inner"></span></span>
              <div class="plan-main">
                <div class="plan-name">{{ planName(plan) }}</div>
                <div class="plan-equiv" v-if="compareText(plan)">{{ compareText(plan) }}</div>
              </div>
              <div class="plan-price">
                <span class="plan-amount">{{ priceText(plan) }}</span>
                <span class="plan-period">{{ periodText(plan) }}</span>
              </div>
            </div>
          </div>

          <!-- 已开通：要换套餐先取消当前的自动续费 -->
          <div class="switch-note" v-if="memberStatus">{{ t("user.dramaMember.switchNote", { date: memberStatus.validUntil }) }}</div>
          <template v-else>
          <!-- 续费说明跟着选中的套餐变：按月 / 季 / 半年 / 年，每期多少钱 -->
          <div class="renew-note" v-if="selectedPlan">{{ t("user.dramaMember.renewNote", { period: periodName(selectedPlan), price: priceText(selectedPlan) }) }}</div>

          <div class="agreement-row">
            <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
              <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
              <img v-else src="@/assets/images/register/check.png" alt="" />
            </div>
            <span class="agreement-text">{{ t("collection.payAgree") }}<span class="terms-link" @click.stop="openPaymentTerms">{{ t("subscribe.paymentTerms") }}</span></span>
          </div>

          <button class="confirm-btn" :disabled="!selectedPlan || !agreeTerms || isPaying" @click="handlePay">
            {{ t("user.dramaMember.confirm") }}<template v-if="selectedPlan"> · {{ priceText(selectedPlan) }}</template>
          </button>
          </template>
        </div>
      </div>
    </div>

    <UploadMask :visible="isPaying" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="UserDramaMember">
// 漫剧会员（平台会员）：套餐列表 index/getMongaPlanListPublic，下单 book/addMongaOrder → 跳 Stripe 结账页。
// 和博主订阅（user-subscription）、合集单部付费是三套独立的机制。
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import router from "@/router";
import api from "@/api/index";
import { toast } from "@/util/toast";
import { apiErrorMessage } from "@/util/utils";
import { fiatPrefix, fiatSuffix, scaleFiatPrice, isUsdDisplay } from "@/util/currency";
import { getGaClientId } from "@/utils/analytics";

const { t, locale } = useI18n();

interface MemberPlan {
  id?: string | number;
  plan_id?: string | number;
  price: string | number;
  currency?: string;
  valid_days?: string | number;
  sort_num?: string | number;
  [k: string]: unknown;
}

const sidebarKey = ref("drama-member");
const plans = ref<MemberPlan[]>([]);
const plansLoaded = ref(false);
const selectedId = ref("");
const agreeTerms = ref(true);
const isPaying = ref(false);
/** 当前会员状态；后端接口定了再在 loadMemberStatus 里填，为空时页面只显示横幅 */
const memberStatus = ref<{ planId: string; planName: string; validUntil: string; autoRenew: boolean } | null>(null);

const planKey = (plan: MemberPlan) => String(plan.plan_id ?? plan.id ?? "");
const selectedPlan = computed(() => plans.value.find(p => planKey(p) === selectedId.value) || null);
const days = (plan: MemberPlan) => Number(plan.valid_days) || 0;

/** 接口的 title_xx 按当前语言取；没填的按天数给默认名（30 月 / 90 季 / 180 半年 / 360 年） */
function planName(plan: MemberPlan): string {
  const l = String(locale.value || "");
  const suffix = l.startsWith("zh") ? "cn" : l === "tc" ? "tc" : l === "jp" || l.startsWith("ja") ? "ja" : l === "ko" ? "kr" : l === "th" ? "th" : "en";
  const titled = String(plan["title_" + suffix] || "").trim();
  if (titled && suffix !== "en") return titled;
  const d = days(plan);
  if (d === 30) return t("user.dramaMember.planMonth");
  if (d === 90) return t("user.dramaMember.planQuarter");
  if (d === 180) return t("user.dramaMember.planHalfYear");
  if (d === 360 || d === 365) return t("user.dramaMember.planYear");
  return titled || t("user.dramaMember.planDays", { days: d });
}
function periodText(plan: MemberPlan): string {
  const d = days(plan);
  if (d === 30) return t("user.dramaMember.perMonth");
  if (d === 90) return t("user.dramaMember.perQuarter");
  if (d === 180) return t("user.dramaMember.perHalfYear");
  if (d === 360 || d === 365) return t("user.dramaMember.perYear");
  return t("user.dramaMember.perDays", { days: d });
}
function priceText(plan: MemberPlan): string {
  const currency = plan.currency || "jpy";
  return `${fiatPrefix(currency)}${scaleFiatPrice(plan.price, currency)}${fiatSuffix(currency, t("aiRecharge.unit"))}`;
}
/** 周期名（续费说明用）：月 / 季 / 半年 / 年 */
function periodName(plan: MemberPlan): string {
  const d = days(plan);
  if (d === 30) return t("user.dramaMember.periodMonth");
  if (d === 90) return t("user.dramaMember.periodQuarter");
  if (d === 180) return t("user.dramaMember.periodHalfYear");
  if (d === 360 || d === 365) return t("user.dramaMember.periodYear");
  return t("user.dramaMember.periodDays", { days: d });
}
function fmt(amount: number, currency: string): string {
  const text = isUsdDisplay(currency) ? amount.toFixed(2) : String(Math.round(amount));
  return `${fiatPrefix(currency)}${text}${fiatSuffix(currency, t("aiRecharge.unit"))}`;
}
/** 和按月付比省多少：「连续月订 ¥11940 · 省 ¥660」= 月会员价 × 月数，减去本套餐总价；只给多于一个月、且比月付便宜的套餐显示 */
function compareText(plan: MemberPlan): string {
  const d = days(plan);
  const monthly = plans.value.find(p => days(p) === 30);
  if (d <= 30 || !monthly) return "";
  const currency = plan.currency || "jpy";
  const monthlyPrice = Number(scaleFiatPrice(monthly.price, monthly.currency || currency));
  const total = Number(scaleFiatPrice(plan.price, currency));
  if (!Number.isFinite(monthlyPrice) || !Number.isFinite(total)) return "";
  const byMonth = monthlyPrice * (d / 30);
  const save = byMonth - total;
  if (save <= 0) return "";
  return t("user.dramaMember.monthlyCompare", { total: fmt(byMonth, currency), save: fmt(save, currency) });
}

async function loadPlans() {
  try {
    const res = (await api.getDramaMemberPlans()) as any;
    if (res.code === 0 || res.code === 200) {
      const list = (res.data?.plans || []) as MemberPlan[];
      plans.value = list;
      // 默认选月会员（30 天），没有就第一档
      const month = list.find(p => days(p) === 30);
      selectedId.value = planKey(month || list[0] || ({} as MemberPlan));
    } else {
      toast(apiErrorMessage(res) || t("fail"));
    }
  } catch (e) {
    console.error(e);
    toast(t("fail"));
  } finally {
    plansLoaded.value = true;
  }
}

/** 当前会员状态：后端接口还没定（TODO），先不请求。拿到后把 planId 选中，列表只读 */
async function loadMemberStatus() {
  memberStatus.value = null;
  if (memberStatus.value && (memberStatus.value as any).planId) selectedId.value = String((memberStatus.value as any).planId);
}

/** 「管理」：去支付记录的「漫剧订阅」tab */
function goManage() {
  router.push("/user-payment-history?tab=drama-member");
}

function openPaymentTerms() {
  window.open(router.resolve("/payment-terms").href, "_blank");
}

async function handlePay() {
  if (!localStorage.getItem("token")) {
    toast(t("user.dramaMember.loginFirst"));
    router.push("/login");
    return;
  }
  const plan = selectedPlan.value;
  if (!plan || !agreeTerms.value || isPaying.value) return;
  isPaying.value = true;
  try {
    const res = (await api.addDramaMemberOrder({ plan_id: planKey(plan), client_id: await getGaClientId() })) as any;
    if (res.code === 0 || res.code === 200) {
      const url = res.data?.url?.url || res.data?.url;
      if (typeof url === "string" && url) {
        window.location.href = url;
        return;
      }
      toast(t("fail"));
    } else {
      toast(apiErrorMessage(res) || t("fail"));
    }
  } catch (e) {
    console.error(e);
    toast(t("fail"));
  } finally {
    isPaying.value = false;
  }
}

onMounted(() => {
  loadPlans();
  loadMemberStatus();
});
</script>

<style scoped lang="scss">
.user-drama-member {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
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
  border: 1px solid #3d3d3d;
  border-radius: 18px;
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
  color: #f5f5f5;
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
  background: #ff4f9a;
}
.content {
  max-width: 640px;
}
.banner {
  padding: 20px 24px;
  margin-bottom: 24px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  color: #fff;
  border: 2px solid #ff9aca;
  border-radius: 14px;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
}
.banner-title {
  font-size: 18px;
  font-weight: 800;
}
.banner-sub {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.9;
}
.status-card {
  padding: 18px 20px;
  margin-bottom: 24px;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
}
.status-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 800;
  color: #ff4f9a;
  color: #f5f5f5;
  margin-bottom: 10px;
}
.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #f5f5f5;
  padding: 4px 0;
}
.status-label {
  color: #777;
}
.manage-link {
  margin-left: 10px;
  color: #ff4f9a;
  cursor: pointer;
  text-decoration: underline;
}
.plan-card.readonly {
  cursor: default;
}
.switch-note {
  margin: 16px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #e5484d;
}
.section-label {
  font-size: 15px;
  font-weight: 800;
  color: #f5f5f5;
  margin: 0 0 12px;
}
.plan-empty {
  padding: 32px 0;
  text-align: center;
  color: #777;
  font-size: 14px;
}
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.plan-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  &.active {
    border-color: #ff4f9a;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  }
}
.radio {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2px solid #777;
  .radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fff;
    opacity: 0;
  }
  .plan-card.active & {
    border-color: #ff4f9a;
    background: #ff4f9a;
    .radio-inner { opacity: 1; }
  }
}
.plan-main {
  flex: 1;
  min-width: 0;
}
.plan-name {
  font-size: 16px;
  font-weight: 800;
  color: #f5f5f5;
}
.plan-equiv {
  margin-top: 4px;
  font-size: 12px;
  color: #777;
}
.plan-price {
  flex: 0 0 auto;
  text-align: right;
  color: #f5f5f5;
}
.plan-amount {
  font-size: 18px;
  font-weight: 800;
}
.plan-period {
  font-size: 13px;
  margin-left: 2px;
  color: #777;
}
.renew-note {
  margin: 16px 0 0;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255,79,154,0.12);
  color: #777;
}
.agreement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 20px;
  font-size: 13px;
  color: #f5f5f5;
  .checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    img { width: 100%; height: 100%; display: block; }
  }
  .terms-link {
    color: #ff4f9a;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 2px;
  }
}
.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  border: 2px solid #ff9aca;
  border-radius: 14px;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  color: #fff;
  &:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(255, 61, 134, .45);
  }
  &:active:not(:disabled) {
    box-shadow: none;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
    margin-left: 0;
    min-height: auto;
  }
  .content {
    max-width: none;
  }
}
@media (max-width: 420px) {
  .container {
    padding: 70px 12px 24px;
  }
  .main {
    padding: 16px;
  }
  .plan-card {
    flex-wrap: wrap;
    padding: 14px;
  }
  .plan-price {
    width: 100%;
    text-align: left;
    padding-left: 32px;
  }
}
</style>
