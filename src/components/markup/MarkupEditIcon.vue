<script setup lang="ts">
// 标记修改入口图标（图标 + hover 气泡提示）
import markEditIcon from '@/assets/images/novel/mark_edit.png';

withDefaults(defineProps<{
  label: string;
  side?: 'left' | 'right';
}>(), { side: 'left' });

const emit = defineEmits<{ (e: 'click'): void }>();
</script>

<template>
  <span class="markup-edit-tip">
    <img :src="markEditIcon" :alt="label" class="markup-edit-icon-img" @click="emit('click')" />
    <span class="markup-edit-tip__bubble" :class="`markup-edit-tip__bubble--${side}`" role="tooltip">{{ label }}</span>
  </span>
</template>

<style scoped>
.markup-edit-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.markup-edit-icon-img {
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: block;
}

.markup-edit-tip__bubble {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 5px 10px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  color: #f5f5f5;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.12s ease;
  z-index: 50;
}

.markup-edit-tip__bubble--right {
  left: calc(100% + 8px);
}

.markup-edit-tip__bubble--left {
  right: calc(100% + 8px);
}

.markup-edit-tip:hover .markup-edit-tip__bubble {
  opacity: 1;
  visibility: visible;
}
</style>