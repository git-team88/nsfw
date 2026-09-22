import { ref } from 'vue';

/**
 * 作品详情页「上一个 / 下一个」的整页滑动方向。
 * Detail.vue 在换 id 之前设上，App.vue 的 <Transition> 读它决定往哪滑，动画结束清空。
 * 'up' = 去下一个（当前页往上出、新页从下进），'down' = 回上一个。
 * 新挂载的 Detail 实例在 onMounted 时也看它：是滑动切过来的就不弹全屏加载遮罩。
 */
export const pageSlideDir = ref<'' | 'up' | 'down'>('');
