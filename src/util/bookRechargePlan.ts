import api from "@/api/index";
import { fiatPrefix, fiatSuffix, scaleFiatPrice } from "@/util/currency";

// ---------------------------------------------------------------------------
// 漫剧合集的收费档位。
//
// 档位由 book/getBookRechargePlan 下发，前端不写死金额。返回形如：
//   data.plan_list: [{ id, plan_id, price: "1000.00", currency: "usd", sort_num: "100", ... }]
//
// price 是美分（后端 usd 一律下发分），展示要除以 100 —— 这件事交给
// util/currency 的 scaleFiatPrice，日元不缩放的规则也在那儿。
// ---------------------------------------------------------------------------

export interface BookRechargePlan {
  id: string;
  plan_id?: string;
  /** 原始金额，usd 下是美分 */
  price: string;
  currency?: string;
  price_id?: string;
  sort_num?: string;
}

// 档位是站点级配置，一次会话里拿一次就够。inflight 保证并发调用只打一个请求。
let plansCache: BookRechargePlan[] | null = null;
let plansInflight: Promise<BookRechargePlan[]> | null = null;

/** 退出登录或切站点配置时清掉 */
export function resetBookRechargePlans() {
  plansCache = null;
  plansInflight = null;
}

function sortPlans(list: BookRechargePlan[]): BookRechargePlan[] {
  return [...list].sort((a, b) => {
    const sa = Number(a.sort_num);
    const sb = Number(b.sort_num);
    if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) return sa - sb;
    return Number(a.price || 0) - Number(b.price || 0);
  });
}

export async function fetchBookRechargePlans(): Promise<BookRechargePlan[]> {
  if (plansCache) return plansCache;

  if (!plansInflight) {
    plansInflight = (async () => {
      try {
        const res = (await api.getBookRechargePlan()) as any;
        const ok = res && (res.code === 0 || res.code === 200);
        const list = ok ? res.data?.plan_list || res.data?.planList || [] : [];
        plansCache = sortPlans(Array.isArray(list) ? list : []);
        return plansCache;
      } catch {
        // 拿不到就当没有档位，价格那一行不渲染，不挡住保存
        return [];
      }
    })().finally(() => {
      plansInflight = null;
    });
  }
  return plansInflight;
}

/**
 * 档位的展示文案，例：$10 / 1000日元。
 *
 * 后端下发的是美分，展示要除以 100。scaleFiatPrice 只在「明确是 usd」时才缩放，
 * 所以 currency 缺省时这里补成 usd —— 漫剧收费的金额一律是美分，不补的话
 * 1000 会原样显示成 $1000。
 */
export function planPriceText(plan: BookRechargePlan | null | undefined, yenUnit = ""): string {
  if (!plan) return "";
  const currency = plan.currency || "usd";
  return `${fiatPrefix(currency)}${scaleFiatPrice(plan.price, currency)}${fiatSuffix(currency, yenUnit)}`;
}

/** 后端存的是原始金额，回显时要按金额找回是哪个档位 */
export function findPlanByPrice(
  plans: BookRechargePlan[],
  price: unknown,
): BookRechargePlan | undefined {
  const raw = String(price ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return plans.find((p) => (Number.isFinite(n) ? Number(p.price) === n : p.price === raw));
}
