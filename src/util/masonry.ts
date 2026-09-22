import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

// ---------------------------------------------------------------------------
// JS 瀑布流：图片（type 4）列表用。
//
// 卡片宽度一致（按列数平分容器宽度），高度按图片自身比例自适应；
// 按数据顺序逐个放到「当前最矮的那一列」，所以视觉顺序仍然是从左到右、从上到下，
// 和 CSS 多列（先填满一列再填下一列）不一样。
//
// 卡片用 left / top 绝对定位（不用 transform，避免和卡片 hover 的 3D 倾斜打架），
// 容器高度设成最高那一列的高度，下面的「加载更多」照常跟在后面。
//
// 什么时候重排：容器尺寸变（窗口缩放）、卡片尺寸变（图片加载完高度出来了）、
// 卡片增删（加载更多 / 切筛选）。三种都用观察器兜住，页面不用手动调。
//
// 换位动效分两件事：
// 1. 每张卡片「第一次落位」（首屏 / 加载更多）先临时关掉过渡，直接摆到位，
//    不会从 0,0 飘进来；
// 2. 首次布局的下一帧给容器加 .masonry-ready，CSS 这时才给卡片开 left / top 过渡，
//    于是之后的位置变化（图片加载完把某张卡片撑高、窗口缩放、切筛选）是下方卡片
//    顺势往下滑，而不是啪地跳一下。撑开这件事本身避不掉（接口不返回图片宽高），
//    但让它流动起来就不刺眼了。
// ---------------------------------------------------------------------------

const READY_CLASS = "masonry-ready";

export interface MasonryOptions {
  /** 卡片选择器，只匹配容器的直接子元素 */
  itemSelector: string;
  /** 列数：按容器宽 / 视口宽算，和页面原来 grid 的断点保持一致 */
  columns: (containerWidth: number, viewportWidth: number) => number;
  /** 列间距 = 行间距 */
  gap: (containerWidth: number, viewportWidth: number) => number;
  /** 为 false 时清掉所有内联定位，交还给原来的 grid 布局 */
  enabled: Ref<boolean>;
}

export function useMasonry(container: Ref<HTMLElement | null>, opts: MasonryOptions) {
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let raf = 0;
  let ready = false;
  const observed = new Set<Element>();
  /** 已经摆过一次的卡片；没摆过的这次不走过渡 */
  const placed = new WeakSet<HTMLElement>();

  function items(el: HTMLElement): HTMLElement[] {
    return Array.from(el.children).filter((c) => c.matches(opts.itemSelector)) as HTMLElement[];
  }

  function clear(el: HTMLElement) {
    el.style.height = "";
    el.classList.remove(READY_CLASS);
    for (const it of items(el)) {
      it.style.position = "";
      it.style.left = "";
      it.style.top = "";
      it.style.width = "";
      it.style.transition = "";
    }
  }

  function markReady(el: HTMLElement) {
    if (ready) return;
    ready = true;
    // 下一帧再加，保证首屏这一帧的落位是没有过渡的
    requestAnimationFrame(() => el.classList.add(READY_CLASS));
  }

  function layout() {
    const el = container.value;
    if (!el || !opts.enabled.value) return;
    const width = el.clientWidth;
    if (!width) return;
    const vw = window.innerWidth;
    const cols = Math.max(1, Math.floor(opts.columns(width, vw)));
    const gap = opts.gap(width, vw);
    const colWidth = (width - gap * (cols - 1)) / cols;
    const heights = new Array<number>(cols).fill(0);
    const fresh: HTMLElement[] = [];

    for (const it of items(el)) {
      // 第一次落位的卡片先关掉过渡，否则会从 0,0 滑到目标位置
      if (!placed.has(it)) {
        placed.add(it);
        fresh.push(it);
        it.style.transition = "none";
      }
      it.style.position = "absolute";
      it.style.width = `${colWidth}px`;
      let col = 0;
      for (let i = 1; i < cols; i++) {
        if (heights[i] < heights[col]) col = i;
      }
      it.style.left = `${col * (colWidth + gap)}px`;
      it.style.top = `${heights[col]}px`;
      heights[col] += it.offsetHeight + gap;
    }
    el.style.height = `${Math.max(0, Math.max(...heights) - gap)}px`;

    if (fresh.length) {
      void el.offsetHeight; // 强制回流，让「无过渡」的落位先生效
      requestAnimationFrame(() => {
        for (const it of fresh) it.style.transition = "";
      });
    }

    markReady(el);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      layout();
    });
  }

  function observeItems(el: HTMLElement) {
    if (!resizeObserver) return;
    const current = new Set<Element>(items(el));
    for (const it of current) {
      if (!observed.has(it)) {
        resizeObserver.observe(it);
        observed.add(it);
      }
    }
    for (const it of observed) {
      if (!current.has(it)) {
        resizeObserver.unobserve(it);
        observed.delete(it);
      }
    }
  }

  function detach() {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    resizeObserver = null;
    mutationObserver = null;
    observed.clear();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ready = false;
  }

  function attach() {
    detach();
    const el = container.value;
    if (!el || !opts.enabled.value) return;
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(el);
    mutationObserver = new MutationObserver(() => {
      observeItems(el);
      schedule();
    });
    mutationObserver.observe(el, { childList: true });
    observeItems(el);
    schedule();
  }

  watch(
    [container, opts.enabled],
    async () => {
      await nextTick();
      if (opts.enabled.value && container.value) {
        attach();
      } else {
        detach();
        if (container.value) clear(container.value);
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(detach);

  return { relayout: schedule };
}
