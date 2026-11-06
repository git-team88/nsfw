// 漫剧会员（平台会员）：「我的漫剧订阅列表」接口（book/getMyMongaSubList）的解析。
// 接口每条：{ plan_id, status(1 自动续费中 / 0 已取消续费 / 2 已到期), current_period_end, cancel_at_period_end, created_at, platform, site_id }
// 没有价格和套餐名，页面按 plan_id 去套餐列表（getMongaPlanListPublic）里取。
import api from "@/api/index";

export interface DramaMemberSub {
  id: string | number;
  planId: string;
  /** 套餐名：接口 plan 里的 title_xx，按语言在页面里取 */
  plan: Record<string, unknown> | null;
  price: string | number;
  currency: string;
  /** 时间戳（秒）或日期串，原样给页面格式化 */
  startTime: string | number;
  endTime: string | number;
  /** 自动续费是否开着（cancel_at_period_end = 1 表示已取消续费） */
  autoRenew: boolean;
  /** 现在是否在有效期内 */
  active: boolean;
  raw: any;
}

function toMs(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number" || /^\d+$/.test(String(v))) {
    const n = Number(v);
    return n < 1e12 ? n * 1000 : n;
  }
  const t = new Date(String(v).replace(/-/g, "/")).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function normalizeDramaMemberSub(item: any): DramaMemberSub {
  const plan = item?.plan && typeof item.plan === "object" ? item.plan : null;
  const endTime = item?.current_period_end ?? item?.expire_at ?? "";
  const status = String(item?.status ?? "");
  return {
    id: item?.id ?? item?.order_id ?? `${item?.plan_id ?? ""}_${endTime}`,
    planId: String(item?.plan_id ?? plan?.plan_id ?? plan?.id ?? ""),
    plan,
    price: item?.price ?? plan?.price ?? "",
    currency: item?.currency || plan?.currency || "jpy",
    startTime: item?.created_at ?? item?.start_at ?? "",
    endTime,
    // 1 = 自动续费中；0 = 已取消续费（到期前还能看）；2 = 已到期
    autoRenew: status === "1",
    active: status !== "2" && (status === "1" || status === "0") && (toMs(endTime) === 0 || toMs(endTime) > Date.now()),
    raw: item,
  };
}

/** 拉我的漫剧订阅列表；接口失败返回空数组 */
export async function fetchMyDramaMemberSubs(): Promise<DramaMemberSub[]> {
  const res = (await api.getMyDramaMemberList()) as any;
  if (!(res?.code === 0 || res?.code === 200)) throw new Error(res?.msg || "fail");
  const list = res.data?.list || res.data?.data || res.data || [];
  return (Array.isArray(list) ? list : []).map(normalizeDramaMemberSub);
}

/** 当前生效的那条（有效期内、最晚到期的） */
export function pickActiveDramaMemberSub(list: DramaMemberSub[]): DramaMemberSub | null {
  const active = list.filter((s) => s.active);
  if (!active.length) return null;
  return active.sort((a, b) => toMs(b.endTime) - toMs(a.endTime))[0];
}

/** 到期时间显示：YYYY-MM-DD */
export function formatDramaMemberDate(v: unknown): string {
  const ms = toMs(v);
  if (!ms) return String(v ?? "");
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
