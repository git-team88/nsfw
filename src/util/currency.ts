// 法币金额的显示形式，按接口下发的 currency 字段决定：
//   jpy -> 日元后缀                       例：1,200 日元
//   其他（usd / 缺省 / 认不出）-> $ 前缀     例：$1,200
// USDT 等加密支付不走这里，仍然是「数字 + USDT」。
//
// 兜底方向是「美元」：只有明确拿到日元相关的 currency 才显示日元，
// 取不到 currency、或者认不出的值，一律按美元显示。

const JPY_CODES = ['jpy', 'jp', 'yen', 'yens', '¥', '日元', '日圓', '円'];

// 是否用美元形式显示（$ 前缀）
export function isUsdDisplay(currency: unknown): boolean {
  const c = String(currency ?? '').trim().toLowerCase();
  return !JPY_CODES.includes(c);
}

// 放在金额数字前面的部分
export function fiatPrefix(currency: unknown): string {
  return isUsdDisplay(currency) ? '$' : '';
}

// 放在金额数字后面的部分。yenUnit 传各页面原本用的 t('aiRecharge.unit') / t('user.revenue.yen')
export function fiatSuffix(currency: unknown, yenUnit: string): string {
  return isUsdDisplay(currency) ? '' : yenUnit;
}

// 从接口返回里捞 currency，字段可能挂在不同层级，逐个试
// 美元价格后端下发的是「千分之一美元」—— 9900 表示 $9.9，展示前要除以 1000。
// 日元金额按原值展示；USDT 是链上金额，不走这里。
export const USD_PRICE_SCALE = 1000;

// 注意这里用的是「明确下发 usd」而不是 isUsdDisplay。
// isUsdDisplay 的兜底方向是美元（取不到 currency 也当美元，为的是显示 $ 前缀），
// 拿它来判断要不要除以 1000 的话，接口没回 currency 时金额会凭空缩小 1000 倍。
const USD_CODES = ['usd', 'us', 'usa', 'dollar', 'dollars', '$', '美元', '美金'];
function isExplicitUsd(currency: unknown): boolean {
  return USD_CODES.includes(String(currency ?? '').trim().toLowerCase());
}

/** 数值形态：缩放后还要参与计算时用 */
export function scaleFiatAmount(value: unknown, currency: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return isExplicitUsd(currency) ? n / USD_PRICE_SCALE : n;
}

/** 字符串形态：直接拿去显示。不是数字就原样返回（接口回空串之类） */
export function scaleFiatPrice(value: unknown, currency: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return raw;
  if (!isExplicitUsd(currency)) return raw;
  const n = Number(raw.replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(n)) return raw;
  return String(parseFloat((n / USD_PRICE_SCALE).toFixed(6)));
}

export function pickCurrency(...candidates: unknown[]): string {
  for (const c of candidates) {
    const v = String(c ?? '').trim();
    if (v) return v;
  }
  return '';
}
