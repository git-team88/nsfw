// 法币金额的显示形式，按接口下发的 currency 字段决定：
//   jpy -> 保持日元后缀             例：1,200 日元
//   其他（usd / 缺省 / 认不出）-> $ 前缀   例：$1,200
// USDT 等加密支付不走这里，仍然是「数字 + USDT」。
//
// 兜底方向是「美元」：只有明确拿到 jpy 才显示日元，取不到 currency 一律按 $ 显示。

const YEN_CODES = ['jpy', 'jp', '円', '日元', '日圓'];

// 是否用美元形式显示（$ 前缀）
export function isUsdDisplay(currency: unknown): boolean {
  const c = String(currency ?? '').trim().toLowerCase();
  return !YEN_CODES.includes(c);
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
