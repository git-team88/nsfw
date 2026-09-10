// 法币金额的显示形式，按接口下发的 currency 字段决定：
//   usd -> $ 前缀                        例：$1,200
//   其他（jpy / 缺省 / 认不出）-> 日元后缀   例：1,200 日元
// USDT 等加密支付不走这里，仍然是「数字 + USDT」。
//
// 兜底方向是「日元」：只有明确拿到 usd 才显示 $，取不到 currency 一律按日元显示。

const USD_CODES = ['usd', 'us', 'usa', 'dollar', 'dollars', '$', '美元', '美金'];

// 是否用美元形式显示（$ 前缀）
export function isUsdDisplay(currency: unknown): boolean {
  const c = String(currency ?? '').trim().toLowerCase();
  return USD_CODES.includes(c);
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
export function pickCurrency(...candidates: unknown[]): string {
  for (const c of candidates) {
    const v = String(c ?? '').trim();
    if (v) return v;
  }
  return '';
}
