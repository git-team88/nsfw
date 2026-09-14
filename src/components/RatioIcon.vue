<template>
  <span class="ratio-icon" :class="`ratio-icon--${shape}`" aria-hidden="true"><i></i></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 比例前面的小图标：宽 > 高 画横向长方形（16:9），高 > 宽 画竖向长方形（9:16），
// 相等画正方形（1:1）。比例串直接解析，以后加 4:3、3:4 这类值不用再改这里。
//
// 配色走三个 CSS 变量，缺省值是 currentColor —— 不设变量时跟着所在按钮的文字颜色走。
// 本项目在 Home.scss / Generate.scss 里按自己的主题覆盖：未选中一套边框，选中另一套。
// 自定义属性会穿过组件边界继承下来，所以不用给子组件写 :deep()。
const props = defineProps<{ value: string }>();

const shape = computed(() => {
  const [w, h] = String(props.value).split(':').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || !w || !h) return 'square';
  if (w === h) return 'square';
  return w > h ? 'landscape' : 'portrait';
});
</script>

<style scoped lang="scss">
.ratio-icon {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  flex: none;
  border: 1px solid currentColor;
  border-radius: 2px;

  i {
    position: absolute;
    inset: 0;
    border-radius: 2px;
  }

  &--landscape {
    width: 14px;
    height: 8px;
  }

  &--portrait {
    width: 8px;
    height: 14px;
  }

  &--square {
    width: 14px;
    height: 14px;
  }
}
</style>
