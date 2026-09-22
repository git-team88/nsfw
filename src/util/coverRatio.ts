// ---------------------------------------------------------------------------
// 封面图宽高比缓存。
//
// 列表接口不返回图片尺寸，但瀑布流需要在图片真正加载完之前就把卡片高度撑好，
// 否则卡片会先塌成窄窄一条、图片到了再被撑开。这里在渲染时顺手用 new Image()
// 量一次原始宽高，量到之前先按占位比例给高度；结果按 URL 缓存，翻页 / 返回不用再量。
//
// 占位比例是「本次会话已经量到的封面的平均比例」，从 3:4 起步，量得越多越准，
// 所以越往后翻，卡片从占位切到真实比例的那一下幅度越小。
// 每个 URL 的占位值在第一次渲染时就定下来不再变，免得平均值一动、整屏跟着抖。
// ---------------------------------------------------------------------------
import { reactive } from "vue";

/** 宽 / 高。一张都还没量到时按竖图 3:4 占位，和非瀑布流的网格保持一致 */
export const DEFAULT_COVER_RATIO = 3 / 4;

const ratios = reactive(new Map<string, number>());
/** 每个 URL 第一次渲染时定下的占位比例，之后不再变 */
const placeholders = new Map<string, number>();
const measuring = new Set<string>();

let ratioSum = 0;
let ratioCount = 0;

function averageRatio() {
  return ratioCount > 0 ? ratioSum / ratioCount : DEFAULT_COVER_RATIO;
}

function remember(url: string, ratio: number) {
  measuring.delete(url);
  ratioSum += ratio;
  ratioCount += 1;
  ratios.set(url, ratio);
}

function measure(url: string) {
  if (measuring.has(url) || ratios.has(url)) return;
  measuring.add(url);
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    remember(url, w && h ? w / h : averageRatio());
  };
  // 加载失败就按占位值算了，别让卡片一直悬着
  img.onerror = () => {
    measuring.delete(url);
    ratios.set(url, placeholders.get(url) ?? averageRatio());
  };
  img.src = url;
}

/**
 * 给 CSS aspect-ratio 用的值，顺带触发一次测量。
 * 模板里直接 :style="{ aspectRatio: coverAspect(item.cover) }"
 */
export function coverAspect(url?: string | null): string {
  if (!url) return String(DEFAULT_COVER_RATIO);
  const known = ratios.get(url);
  if (known !== undefined) return String(known);
  measure(url);
  let placeholder = placeholders.get(url);
  if (placeholder === undefined) {
    placeholder = averageRatio();
    placeholders.set(url, placeholder);
  }
  return String(placeholder);
}

/** 拿到列表数据后可以提前批量量一遍，卡片渲染时就已经有比例了 */
export function preloadCoverRatios(urls: Array<string | null | undefined>) {
  for (const url of urls) {
    if (url) measure(url);
  }
}
