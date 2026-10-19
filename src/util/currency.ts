// 法币金额的显示形式，按接口下发的 currency 字段决定：
//   usd -> $ 前缀                        例：$1,200
//   其他（jpy / 缺省 / 认不出）-> 日元后缀   例：1,200 日元
// USDT 等加密支付不走这里，仍然是「数字 + USDT」。
//
// 兜底方向是「日元」：只有明确拿到 usd 才显示 $，取不到 currency 一律按日元显示。
// 日元金额按原值展示，不除以 100。

const USD_CODES = ['usd', 'us', 'usa', 'dollar', 'dollars', '$', '美元', '美金'];

// 是否用美元形式显示（$ 前缀）
export function isUsdDisplay(currency: unknown): boolean {
  return isExplicitUsd(currency);
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
// 美元价格后端下发的是「美分」—— 9900 表示 $99，展示前要除以 100。
// 日元金额按原值展示；USDT 是链上金额，不走这里。
export const USD_PRICE_SCALE = 100;

// 只有明确下发 usd 才除以 100；jpy / 缺省一律原值
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

/**
 * 去掉小数末尾多余的 0，纯字符串处理，不经过 Number，不会变成科学计数法：
 *   "5.000000" -> "5"，"9.90" -> "9.9"，"12.5" -> "12.5"，"100" -> "100"
 */
export function trimTrailingZeros(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw.includes('.')) return raw;
  return raw.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
