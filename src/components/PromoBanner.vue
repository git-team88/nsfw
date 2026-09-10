<template>
  <div class="promo-banner">
    <!-- 左下角流动光带：网格纹理 + 波形蒙版 + 撒点 -->
    <svg class="pb-wave" viewBox="0 0 1656 348" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <!-- 网格纹理：两组交叉细线，做出地形网面的感觉 -->
        <pattern :id="`meshA${uid}`" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#ff2f6e" stroke-width=".4" />
        </pattern>
        <pattern :id="`meshB${uid}`" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(56)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#ff2f6e" stroke-width=".4" />
        </pattern>
        <!-- 横向淡出：整块纹理只在左边，往右消失 -->
        <linearGradient :id="`fade${uid}`" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".55" />
          <stop offset=".14" stop-color="#fff" stop-opacity="1" />
          <stop offset=".48" stop-color="#fff" stop-opacity=".65" />
          <stop offset=".74" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <mask :id="`mfade${uid}`"><rect width="1656" height="348" :fill="`url(#fade${uid})`" /></mask>
        <!-- 波形蒙版：网格只贴在这几条波带上 -->
        <filter :id="`bandblur${uid}`" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
        <mask :id="`mbands${uid}`">
          <g fill="none" stroke="#fff" :filter="`url(#bandblur${uid})`">
            <path d="M0 236 C 240 216, 430 272, 700 246 S 1180 210, 1656 238" stroke-width="34" stroke-opacity=".9" />
            <path d="M0 274 C 260 246, 470 306, 760 270 S 1240 238, 1656 268" stroke-width="46" stroke-opacity="1" />
            <path d="M0 306 C 300 288, 520 328, 820 300 S 1300 268, 1656 296" stroke-width="30" stroke-opacity=".75" />
          </g>
        </mask>
        <!-- 噪声：给网格再加一层疏密不均，不是死板的格子 -->
        <filter :id="`nz${uid}`" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="6" result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 -.25" />
        </filter>
        <mask :id="`mnz${uid}`"><rect width="1656" height="348" :filter="`url(#nz${uid})`" /></mask>
        <!-- 撒在网格上的细小光点 -->
        <filter :id="`nzdot${uid}`" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="2" seed="9" result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -7.1" />
        </filter>
        <mask :id="`mdots${uid}`"><rect width="1656" height="348" :filter="`url(#nzdot${uid})`" /></mask>
        <filter :id="`soft2${uid}`" x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation="1.3" /></filter>
      </defs>

      <!-- 网格：贴在波带上，再叠噪声让疏密不均 -->
      <g :mask="`url(#mfade${uid})`" opacity=".8">
        <g :mask="`url(#mbands${uid})`">
          <g :mask="`url(#mnz${uid})`">
            <rect width="1656" height="348" :fill="`url(#meshA${uid})`" />
            <rect width="1656" height="348" :fill="`url(#meshB${uid})`" opacity=".7" />
          </g>
        </g>
      </g>

      <!-- 细小光点，撒在同一片波带上 -->
      <g :mask="`url(#mfade${uid})`">
        <g :mask="`url(#mbands${uid})`">
          <g :mask="`url(#mdots${uid})`"><rect width="1656" height="348" fill="#ffb3cf" /></g>
        </g>
      </g>

      <!-- 波峰上的两道亮线 -->
      <g :mask="`url(#mfade${uid})`" fill="none" :filter="`url(#soft2${uid})`">
        <path d="M0 274 C 260 246, 470 306, 760 270 S 1240 238, 1656 268" stroke="rgba(255,150,190,.55)" stroke-width="1.5" />
        <path d="M0 236 C 240 216, 430 272, 700 246 S 1180 210, 1656 238" stroke="rgba(255,120,175,.4)" stroke-width="1.1" />
      </g>

    </svg>

    <!-- 底部地面光：牌子立在光带上，整块的亮部集中在下方 -->
    <div class="pb-floor" aria-hidden="true"></div>

    <!-- 文案由外部传入，组件不内置任何文字 -->
    <div class="pb-copy">
      <slot name="title"></slot>
      <slot name="sub"></slot>
    </div>

    <!-- 卡片 A：图片 -->
    <div class="pb-card pb-card-a">
      <img v-if="image" :src="image" alt="" />
    </div>

    <!-- 卡片左侧的像素消散（压在卡片上方，像左边缘被打散） -->
    <div class="pb-pixels" aria-hidden="true">
      <i v-for="(p, i) in pixels" :key="i" :style="p"></i>
    </div>

    <!-- 箭头左边的拖影和碎块 -->
    <div class="pb-streak" aria-hidden="true"></div>
    <div class="pb-pixels pb-pixels-arrow" aria-hidden="true">
      <i v-for="(p, i) in arrowPixels" :key="i" :style="p"></i>
    </div>

    <div class="pb-arrow" aria-hidden="true">
      <svg viewBox="0 0 269 269">
        <defs>
          <linearGradient :id="arrowId" x1="0" x2="1">
            <stop offset="0" stop-color="#ff3d86" stop-opacity=".25" />
            <stop offset=".45" stop-color="#ff8fbc" stop-opacity=".85" />
            <stop offset=".8" stop-color="#fff" stop-opacity="1" />
            <stop offset="1" stop-color="#fff" stop-opacity="1" />
          </linearGradient>
          <radialGradient :id="coreId">
            <stop offset="0" stop-color="#ff2f74" stop-opacity=".5" />
            <stop offset="1" stop-color="#ff2f74" stop-opacity="0" />
          </radialGradient>
          <linearGradient :id="flareId" x1="0" x2="1">
            <stop offset="0" stop-color="#ff5c99" stop-opacity="0" />
            <stop offset=".5" stop-color="#ffd0e2" stop-opacity=".9" />
            <stop offset="1" stop-color="#ff5c99" stop-opacity="0" />
          </linearGradient>
        </defs>
        <circle cx="150" cy="134" r="110" :fill="`url(#${coreId})`" />
        <!-- 光圈是完整的圆，不再是断开的弧段；箭头杆从左边压在圈上，看起来像"开口在左" -->
        <g fill="none" transform="translate(150 134)">
          <!-- 外圈：完整的圆，细而淡 -->
          <circle r="108" stroke="rgba(255,140,185,.45)" stroke-width="1.2" />
          <!-- 内圈：左侧留一个开口，箭头杆从这里穿出 -->
          <circle r="88" pathLength="100" stroke="rgba(255,195,220,.95)" stroke-width="2.4" stroke-dasharray="74 26" stroke-dashoffset="-63" stroke-linecap="round" />
          <!-- 四个方向的短刻度 -->
          <g stroke="rgba(255,200,220,.7)" stroke-width="1.4" stroke-linecap="round">
            <line x1="0" y1="-124" x2="0" y2="-114" />
            <line x1="0" y1="114" x2="0" y2="124" />
            <line x1="124" y1="0" x2="134" y2="0" />
          </g>
        </g>
        <rect x="20" y="130" width="240" height="1.6" :fill="`url(#${flareId})`" />
        <!-- 箭头尾巴的运动残影 -->
        <g :fill="`url(#${arrowId})`" opacity=".28" style="filter: blur(2px)">
          <rect x="-30" y="96" width="120" height="5" />
          <rect x="-6" y="120" width="150" height="9" />
          <rect x="10" y="146" width="120" height="6" />
          <rect x="-40" y="164" width="90" height="4" />
        </g>
        <path
          d="M33 111.5h95V89l60 45-60 45v-22.5H33z"
          :fill="`url(#${arrowId})`"
          style="filter: drop-shadow(0 0 6px rgba(255, 120, 175, 0.95)) drop-shadow(0 0 18px rgba(255, 50, 120, 0.8))"
        />
        <path d="M33 111.5h95V89l60 45-60 45v-22.5H33z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".6" />
      </svg>
    </div>

    <!-- 卡片 B：视频，静音循环 -->
    <div class="pb-card pb-card-b">
      <video
        v-if="video"
        :src="video"
        :poster="poster || undefined"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      ></video>
    </div>

    <div class="pb-vignette"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineProps<{
  image?: string;
  video?: string;
  poster?: string;
}>();

// 同一页面可能出现多个实例，渐变 id 不能撞
const uid = Math.random().toString(36).slice(2, 8);
const arrowId = `pbArrow${uid}`;
const coreId = `pbCore${uid}`;
const flareId = `pbFlare${uid}`;

// 像素消散用定死的伪随机，保证预渲染和客户端渲染结果一致，不会闪一下
const makePixels = (seedInit: number, count: number, maxSize: number) => {
  let seed = seedInit;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: count }, () => {
    const t = rand();
    const size = (0.18 + rand() * maxSize).toFixed(2);
    return {
      // 越靠右（贴着牌子）越密
      left: `${(Math.pow(t, 0.62) * 100).toFixed(1)}%`,
      top: `${(Math.pow(rand(), 0.95) * 100).toFixed(1)}%`,
      width: `${size}cqw`,
      height: `${size}cqw`,
      opacity: (0.1 + Math.pow(t, 1.5) * 0.85).toFixed(2),
    };
  });
};

const pixels = computed(() => makePixels(20240607, 140, 0.5));
const arrowPixels = computed(() => makePixels(781205, 22, 0.55));
</script>

<style scoped>
/* 设计稿 1656x348。整块靠容器查询等比缩放：
   cqw = 容器宽度的 1%，卡片、文字、箭头全用它，改宽度整块一起缩。
   卡片是真实元素，图片和视频放在卡片里面铺满，天然对齐，不存在"贴坐标"这回事。
   牌子按设计稿是"立在地上"的大板子：高度超过画布，顶部被裁掉，底边贴着地面光。 */
.promo-banner {
  position: relative;
  width: 100%;
  aspect-ratio: 1656 / 348;
  container-type: inline-size;
  overflow: hidden;
  background:
    /* 地面正上方的粉光 */
    radial-gradient(34% 42% at 74% 96%, rgba(255, 35, 100, 0.6) 0%, rgba(255, 40, 105, 0) 100%),
    /* 右上角被牌子霓虹带亮 */
    radial-gradient(30% 55% at 97% 20%, rgba(255, 40, 110, 0.5) 0%, rgba(255, 40, 110, 0) 100%),
    /* 卡片附近的高光 */
    radial-gradient(26% 70% at 88% 60%, rgba(255, 40, 110, 0.28) 0%, rgba(255, 40, 110, 0) 100%),
    /* 整体由右下向左上压暗，最左边接近全黑 */
    radial-gradient(90% 135% at 80% 92%, #5c0620 0%, #2d0410 38%, #140208 68%, #070103 100%),
    #060103;
}

/* 地面：整条横贯画布的地平线光带 + 上方压暗的天、下方压暗的地 */
.pb-floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34%;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.06) 18%, rgba(0, 0, 0, 0) 34%),
    radial-gradient(56% 100% at 72% 110%, rgba(255, 40, 105, 0.5) 0%, rgba(255, 35, 100, 0.12) 54%, rgba(255, 35, 100, 0) 100%);
}
.pb-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(72% 130% at 70% 66%, rgba(0, 0, 0, 0) 26%, rgba(0, 0, 0, 0.42) 74%, rgba(0, 0, 0, 0.72) 100%);
}

.pb-wave {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

/* ---------- 文案 ---------- */
.pb-copy {
  position: absolute;
  left: 4.4cqw;
  top: 47%;
  transform: translateY(-50%);
  /* 限宽，保证再长的文案也不会顶到卡片上（卡片从 ~56% 开始）；超出自动换行 */
  max-width: 45cqw;
  z-index: 7;
  color: #fff;
}
/* 插槽内容由外部提供，这里只给排版；:deep 让 scoped 样式作用到插槽元素上 */
.pb-copy :deep(h1),
.pb-copy :deep(h2),
.pb-copy :deep(.pb-title) {
  margin: 0 0 1.7cqw;
  font-size: 2.98cqw;
  font-weight: 800;
  line-height: 1.45;
  letter-spacing: 0.01em;
  /* text-shadow: 0 0.15cqw 1.1cqw rgba(0, 0, 0, 0.6); */
}

.pb-copy :deep(h2){
  background: linear-gradient(90deg, #d9919e 0%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 整体轻微发光 */
  /* filter: drop-shadow(0 0 3px rgba(255, 51, 102, 0.2)); */
}
.pb-copy :deep(p),
.pb-copy :deep(.pb-sub) {
  margin: 0;
  font-size: 1.4cqw;
  font-weight: 600;
  line-height: 1.6;
  color: #f6e2ea;
  text-shadow: 0 0.1cqw 0.7cqw rgba(0, 0, 0, 0.5);
}
.pb-copy :deep(em) {
  font-style: normal;
  color: #ff4f9a;
  -webkit-text-fill-color: #ff4f9a;
  background: none;
}

/* ---------- 两块牌子 ---------- */
/* left 是卡片中心（配合 translateX(-50%)），要挪位置只动这一个数；
   bottom 定底边，height 比画布高，顶部自然裁掉。 */
.pb-card {
  position: absolute;
  z-index: 3;
  border-radius: 1.1cqw;
  overflow: hidden;
  background: #1e0710;
  box-shadow:
    0 0 0 0.18cqw rgba(255, 238, 246, 1),
    0 0 0.9cqw rgba(255, 170, 205, 1),
    0 0 3.4cqw rgba(255, 45, 115, 1),
    0 0 9cqw rgba(255, 25, 95, 0.65),
    0 1cqw 3cqw rgba(0, 0, 0, 0.55);
}
.pb-card > img,
.pb-card > video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pb-card-a {
  left: 61.8%;
  bottom: 0.6cqw;
  width: 11.7cqw;
  height: 21cqw;
  transform: translateX(-50%) rotate(-4deg);
  transform-origin: 50% 100%;
}
.pb-card-b {
  left: 85.7%;
  bottom: 0.8cqw;
  width: 11cqw;
  height: 21cqw;
  transform: translateX(-50%) rotate(8deg);
  transform-origin: 50% 100%;
}

/* ---------- 中间的箭头 ---------- */
/* 环是 SVG 弧段，不是几个整圆：右侧留缺口让箭头穿出去 */
.pb-arrow {
  position: absolute;
  left: 75.3%;
  top: 47%;
  transform: translate(-50%, -50%);
  width: 8cqw;
  height: 8cqw;
  z-index: 4;
  pointer-events: none;
}
.pb-arrow svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 箭头左边的速度拖影 */
.pb-streak {
  position: absolute;
  left: 69.6%;
  top: 47%;
  transform: translateY(-50%);
  width: 6cqw;
  height: 0.85cqw;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255, 60, 130, 0) 0%, rgba(255, 120, 175, 0.5) 68%, rgba(255, 155, 195, 0.8) 100%);
  filter: blur(0.16cqw);
}

/* ---------- 像素消散 ---------- */
.pb-pixels {
  position: absolute;
  left: 47.2%;
  top: -0.5cqw;
  width: 8.8cqw;
  height: 14cqw;
  z-index: 4;
  pointer-events: none;
}
.pb-pixels i {
  position: absolute;
  display: block;
  background: #ff3179;
  box-shadow: 0 0 0.5cqw rgba(255, 49, 121, 0.95);
}
.pb-pixels-arrow {
  left: 68.4%;
  top: 47%;
  bottom: auto;
  transform: translateY(-50%);
  width: 5.4cqw;
  height: 8cqw;
}

/* 窄屏：牌子和文字都会等比缩到很小，这里把文案放大一点保证可读 */
@container (max-width: 700px) {
  .pb-copy :deep(h1),
  .pb-copy :deep(h2),
  .pb-copy :deep(.pb-title) {
    font-size: 4.2cqw;
    margin-bottom: 1.4cqw;
  }
  .pb-copy :deep(p),
  .pb-copy :deep(.pb-sub) {
    font-size: 1.9cqw;
    line-height: 1.7;
  }
}
</style>
