<script setup lang="ts">
// 标记修改（标记修图）编辑器：从 canvas-frontend(feat-markup-edit) 的
// MarkupImageEditor.tsx 移植到 Vue 3。核心绘图/坐标/导出逻辑见 @/utils/markup。
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from '@/util/toast';
import coinIcon from '@/assets/images/novel/coin.png';
import MarkupIcon from './MarkupIcon.vue';
import {
  markupColors,
  markupTools,
  createMarkupId,
  toWebp,
  getMarkupBounds,
  containsMarkupPoint,
  moveMarkupPoints,
  eraseBrushAnnotation,
  annotationIntersectsEraser,
  createMosaicBlocks,
  getMarkupLayerIcon,
  getMarkupLayerLabel,
  renderMarkedImageToBlob,
  type MarkupAnnotation,
  type MarkupPoint,
  type MarkupTool,
  type MarkupDragState,
  type MarkupTextInputState,
} from '@/utils/markup';

const props = defineProps<{
  initialInstruction: string;
  imageName: string;
  imageUrl: string;
  showGuide: boolean;
  estimatedPoints?: number;
  onClose: () => void;
  onSend: (markedImageBlob: Blob, instruction: string) => Promise<void> | void;
  onDismissGuide: (dontShowAgain: boolean) => void;
  onRequestGuide: () => void;
}>();

const { t } = useI18n();
// markup 翻译键统一放在 `markup` 命名空间下
const mt = (key: string, params?: Record<string, string | number>) => t(`markup.${key}`, params ?? {});

// 每个工具的图标名（对应 MarkupIcon）
const toolIconName: Record<MarkupTool, string> = {
  select: 'select', eraser: 'eraser', brush: 'brush', line: 'line', arrow: 'arrow',
  rect: 'rect', circle: 'circle', mosaic: 'mosaic', number: 'hash', text: 'text',
};

const activeTool = ref<MarkupTool>('brush');
const color = ref(markupColors[0]);
const strokeWidth = ref(6);
const eraserSize = ref(28);
const intensity = ref(12);
const fontSize = ref(18);
const annotations = ref<MarkupAnnotation[]>([]);
const draftAnnotation = ref<MarkupAnnotation | null>(null);
const selectedAnnotationId = ref<string | null>(null);
const dragState = ref<MarkupDragState>(null);
const numberCounter = ref(1);
const imageBox = ref({ width: 0, height: 0 });
const textInput = ref<MarkupTextInputState>(null);
const isSending = ref(false);
const instruction = ref(props.initialInstruction);
const mobilePanelTab = ref<'layers' | 'instruction'>('instruction');
const commitError = ref<string | null>(null);
const eraserCursor = ref<MarkupPoint | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null);
let isErasing = false;

// 文字输入框出现后手动聚焦，preventScroll 避免浏览器把画布滚动（导致图片左移）
watch(() => textInput.value !== null, (has) => {
  if (has) nextTick(() => textInputRef.value?.focus({ preventScroll: true }));
});

function syncImageBox() {
  const image = imageRef.value;
  if (!image?.naturalWidth || !image.naturalHeight) return;
  const compactLayout = window.innerWidth <= 880;
  // 右侧面板固定 300px（与 CSS 一致）；预留=面板+画布内边距/边框/居中留白
  const rightPanel = 300;
  const maxWidth = compactLayout
    ? Math.max(180, window.innerWidth - 24)
    : Math.max(180, Math.min(1120, window.innerWidth - (rightPanel + 88)));
  const maxHeight = compactLayout
    ? Math.max(150, Math.min(window.innerHeight * 0.5, window.innerHeight - 180))
    : Math.max(120, window.innerHeight - 154);
  const aspectRatio = image.naturalWidth / image.naturalHeight;
  let width = maxWidth;
  let height = width / aspectRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  const current = imageBox.value;
  if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) return;
  imageBox.value = { width, height };
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !textInput.value) {
    props.onClose();
    return;
  }
  if (activeTool.value !== 'select' || !selectedAnnotationId.value) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    annotations.value = annotations.value.filter((item) => item.id !== selectedAnnotationId.value);
    selectedAnnotationId.value = null;
    return;
  }
  const movement: Record<string, MarkupPoint> = {
    ArrowLeft: { x: -0.35, y: 0 }, ArrowRight: { x: 0.35, y: 0 },
    ArrowUp: { x: 0, y: -0.35 }, ArrowDown: { x: 0, y: 0.35 },
  };
  const delta = movement[event.key];
  if (!delta) return;
  event.preventDefault();
  annotations.value = annotations.value.map((item) =>
    item.id === selectedAnnotationId.value
      ? { ...item, points: moveMarkupPoints(item.points, delta.x, delta.y) } : item,
  );
}

onMounted(() => {
  syncImageBox();
  window.addEventListener('resize', syncImageBox);
  window.visualViewport?.addEventListener('resize', syncImageBox);
  window.addEventListener('keydown', handleKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', syncImageBox);
  window.visualViewport?.removeEventListener('resize', syncImageBox);
  window.removeEventListener('keydown', handleKeyDown);
});

function getPointFromClient(clientX: number, clientY: number, fallbackBox: DOMRect): MarkupPoint {
  const box = imageRef.value?.getBoundingClientRect() ?? fallbackBox;
  if (!box.width || !box.height) return { x: 0, y: 0 };
  return {
    x: Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)),
    y: Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100)),
  };
}
function getPoint(event: PointerEvent): MarkupPoint {
  const target = event.currentTarget as HTMLElement;
  return getPointFromClient(event.clientX, event.clientY, target.getBoundingClientRect());
}
function openTextInputAt(clientX: number, clientY: number, fallbackBox: DOMRect) {
  textInput.value = { point: getPointFromClient(clientX, clientY, fallbackBox), value: '' };
  draftAnnotation.value = null;
}

const selectedAnnotation = computed(() =>
  annotations.value.find((item) => item.id === selectedAnnotationId.value) ?? null,
);
function updateSelectedAnnotation(patch: Partial<MarkupAnnotation>) {
  if (!selectedAnnotationId.value) return;
  annotations.value = annotations.value.map((item) =>
    item.id === selectedAnnotationId.value ? { ...item, ...patch } : item);
}

const currentControl = computed(() => {
  // 选中已有标记时（选择工具），滑块调整该标记自身的属性（文字/数字改字号、形状改粗细）
  if (activeTool.value === 'select' && selectedAnnotation.value) {
    const a = selectedAnnotation.value;
    if (a.tool === 'text') {
      return { label: mt('markupCtrlFontSize'), value: a.fontSize, min: 12, max: 48, suffix: 'px', setter: (v: number) => updateSelectedAnnotation({ fontSize: v }) };
    }
    if (a.tool === 'number') {
      return { label: mt('markupCtrlSize'), value: a.fontSize, min: 8, max: 44, suffix: 'px', setter: (v: number) => updateSelectedAnnotation({ fontSize: v }) };
    }
    return { label: mt('markupCtrlStroke'), value: a.strokeWidth, min: 2, max: 18, suffix: 'px', setter: (v: number) => updateSelectedAnnotation({ strokeWidth: v }) };
  }
  if (activeTool.value === 'eraser') {
    return { label: mt('markupCtrlSize'), value: eraserSize.value, min: 8, max: 72, suffix: 'px', setter: (v: number) => { eraserSize.value = v; } };
  }
  if (activeTool.value === 'mosaic') {
    return { label: mt('markupCtrlIntensity'), value: intensity.value, min: 6, max: 48, suffix: 'px', setter: (v: number) => { intensity.value = v; } };
  }
  if (activeTool.value === 'number') {
    return { label: mt('markupCtrlSize'), value: fontSize.value, min: 8, max: 44, suffix: 'px', setter: (v: number) => { fontSize.value = v; } };
  }
  if (activeTool.value === 'text') {
    return { label: mt('markupCtrlFontSize'), value: fontSize.value, min: 12, max: 48, suffix: 'px', setter: (v: number) => { fontSize.value = v; } };
  }
  return { label: mt('markupCtrlStroke'), value: strokeWidth.value, min: 2, max: 18, suffix: 'px', setter: (v: number) => { strokeWidth.value = v; } };
});

function eraseAtPoint(point: MarkupPoint) {
  if (!imageBox.value.width || !imageBox.value.height) return;
  const radiusX = (eraserSize.value / 2 / imageBox.value.width) * 100;
  const radiusY = (eraserSize.value / 2 / imageBox.value.height) * 100;
  annotations.value = annotations.value.flatMap((annotation) => {
    if (!annotation.visible) return [annotation];
    if (annotation.tool === 'brush') {
      return eraseBrushAnnotation(annotation, point, radiusX, radiusY);
    }
    return annotationIntersectsEraser(annotation, point, radiusX, radiusY) ? [] : [annotation];
  });
  selectedAnnotationId.value = null;
}

function startAnnotation(event: PointerEvent) {
  if (event.button !== 0) return;
  const target = event.currentTarget as HTMLElement;
  if (activeTool.value === 'select') {
    const point = getPoint(event);
    const hit = annotations.value.slice().reverse()
      .find((annotation) => annotation.visible && containsMarkupPoint(annotation, point));
    selectedAnnotationId.value = hit?.id ?? null;
    if (hit) {
      target.setPointerCapture(event.pointerId);
      dragState.value = { annotationId: hit.id, originalPoints: hit.points, startPoint: point };
    }
    return;
  }
  const point = getPoint(event);
  if (activeTool.value === 'eraser') {
    target.setPointerCapture(event.pointerId);
    isErasing = true;
    eraserCursor.value = point;
    eraseAtPoint(point);
    return;
  }
  if (activeTool.value === 'text') return;
  target.setPointerCapture(event.pointerId);
  selectedAnnotationId.value = null;
  draftAnnotation.value = {
    id: createMarkupId(), tool: activeTool.value, color: color.value, visible: true,
    strokeWidth: strokeWidth.value, intensity: intensity.value, fontSize: fontSize.value, points: [point, point],
    number: activeTool.value === 'number' ? numberCounter.value : undefined,
  };
}

function updateAnnotation(event: PointerEvent) {
  if (activeTool.value === 'eraser') {
    const point = getPoint(event);
    eraserCursor.value = point;
    if (isErasing) eraseAtPoint(point);
    return;
  }
  if (dragState.value) {
    const point = getPoint(event);
    const deltaX = point.x - dragState.value.startPoint.x;
    const deltaY = point.y - dragState.value.startPoint.y;
    const ds = dragState.value;
    annotations.value = annotations.value.map((item) =>
      item.id === ds.annotationId
        ? { ...item, points: moveMarkupPoints(ds.originalPoints, deltaX, deltaY) } : item,
    );
    return;
  }
  if (!draftAnnotation.value) return;
  const point = getPoint(event);
  const current = draftAnnotation.value;
  if (current.tool === 'brush') draftAnnotation.value = { ...current, points: [...current.points, point] };
  else draftAnnotation.value = { ...current, points: [current.points[0], point] };
}

function finishAnnotation(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  if (activeTool.value === 'eraser') {
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    isErasing = false;
    return;
  }
  if (dragState.value) {
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    dragState.value = null;
    return;
  }
  if (!draftAnnotation.value) return;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  const draft = draftAnnotation.value;
  const draftBounds = getMarkupBounds(draft);
  if (draft.tool === 'mosaic' && (draftBounds.width < 0.4 || draftBounds.height < 0.4)) {
    draftAnnotation.value = null;
    return;
  }
  const finished = draft.tool === 'mosaic'
    ? { ...draft, mosaicBlocks: createMosaicBlocks(draft, imageRef.value, imageBox.value) }
    : draft;
  annotations.value = [...annotations.value, finished];
  if (draft.tool === 'number') numberCounter.value += 1;
  draftAnnotation.value = null;
}

function clear() {
  annotations.value = [];
  draftAnnotation.value = null;
  textInput.value = null;
  selectedAnnotationId.value = null;
  numberCounter.value = 1;
}
function commitTextInput() {
  const value = textInput.value?.value.trim();
  if (!textInput.value || !value) {
    textInput.value = null;
    return;
  }
  annotations.value = [...annotations.value, {
    id: createMarkupId(), tool: 'text', color: color.value, visible: true,
    strokeWidth: strokeWidth.value, intensity: intensity.value, fontSize: fontSize.value,
    points: [textInput.value.point, textInput.value.point], text: value,
  }];
  textInput.value = null;
}
// 输入过程中点击工具栏（颜色/字号等）会让输入框失焦：此时不提交，保持编辑并把焦点还给输入框
function handleTextInputBlur(event: FocusEvent) {
  const next = event.relatedTarget as HTMLElement | null;
  if (next && next.closest('.comic-markup-toolbar')) {
    const isRange = next instanceof HTMLInputElement && next.type === 'range';
    if (!isRange) requestAnimationFrame(() => textInputRef.value?.focus({ preventScroll: true }));
    return;
  }
  commitTextInput();
}
function deleteAnnotation(id: string) {
  annotations.value = annotations.value.filter((item) => item.id !== id);
  if (selectedAnnotationId.value === id) selectedAnnotationId.value = null;
}
function toggleAnnotation(id: string) {
  annotations.value = annotations.value.map((item) => item.id === id ? { ...item, visible: !item.visible } : item);
}
function moveAnnotation(id: string, direction: -1 | 1) {
  const items = annotations.value;
  const index = items.findIndex((item) => item.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (!item) return;
  next.splice(targetIndex, 0, item);
  annotations.value = next;
}
function selectTool(tool: MarkupTool) {
  activeTool.value = tool;
  draftAnnotation.value = null;
  isErasing = false;
  if (tool !== 'eraser') eraserCursor.value = null;
  selectedAnnotationId.value = null;
  textInput.value = null;
}

const renderedAnnotations = computed(() =>
  draftAnnotation.value ? [...annotations.value, draftAnnotation.value] : annotations.value,
);
const visibleRendered = computed(() => renderedAnnotations.value.filter((a) => a.visible));
const overlayAnnotations = computed(() =>
  renderedAnnotations.value.filter((a) => a.visible && (a.tool === 'text' || a.tool === 'number')),
);
const pendingTextValue = computed(() => textInput.value?.value.trim() ?? '');
const hasVisibleMarkup = computed(() =>
  Boolean(pendingTextValue.value) || renderedAnnotations.value.some((a) => a.visible),
);

function isSelected(a: MarkupAnnotation) {
  return activeTool.value === 'select' && selectedAnnotationId.value === a.id;
}
// SVG 形状几何辅助
function shapeX(a: MarkupAnnotation) { return Math.min(a.points[0].x, a.points[a.points.length - 1].x); }
function shapeY(a: MarkupAnnotation) { return Math.min(a.points[0].y, a.points[a.points.length - 1].y); }
function shapeW(a: MarkupAnnotation) { return Math.abs(a.points[a.points.length - 1].x - a.points[0].x); }
function shapeH(a: MarkupAnnotation) { return Math.abs(a.points[a.points.length - 1].y - a.points[0].y); }
function brushPointsStr(a: MarkupAnnotation) { return a.points.map((p) => `${p.x},${p.y}`).join(' '); }
function boundsOf(a: MarkupAnnotation) { return getMarkupBounds(a); }
// 文字/数字 HTML 叠加层样式
function numberDiameter(a: MarkupAnnotation) {
  const scaleMin = Math.min(imageBox.value.width, imageBox.value.height);
  return Math.max(14, (a.fontSize / 5 / 100) * scaleMin * 2);
}
function textLabelSize(a: MarkupAnnotation) {
  return a.fontSize;
}

function textLabelClass(a: MarkupAnnotation) {
  const x = a.points[0].x;
  const textWidth = (a.text?.length || 0) * a.fontSize * 0.6;
  const availableRight = ((100 - x) / 100) * imageBox.value.width;
  const availableLeft = (x / 100) * imageBox.value.width;
  if (x > 50 && textWidth > availableRight) {
    if (textWidth <= availableLeft) return 'align-right';
    return 'align-right wrap';
  }
  if (textWidth > availableRight && textWidth > availableLeft) return 'wrap';
  return '';
}

function textLabelMaxWidth(a: MarkupAnnotation) {
  const x = a.points[0].x;
  const textWidth = (a.text?.length || 0) * a.fontSize * 0.6;
  const availableRight = ((100 - x) / 100) * imageBox.value.width;
  const availableLeft = (x / 100) * imageBox.value.width;
  if (x > 50 && textWidth > availableRight) {
    return `${x}%`;
  }
  if (textWidth > availableRight) {
    return `${100 - x}%`;
  }
  return undefined;
}
// 文字输入框与确定后的文字标记保持同样的实际渲染尺寸（避免失焦后文字突然变大）
const textInputFontSize = computed(() => fontSize.value);

async function exportMarkedImage() {
  const image = imageRef.value;
  if (!image) return null;
  const exportAnnotations: MarkupAnnotation[] = textInput.value && pendingTextValue.value
    ? [...renderedAnnotations.value, {
        id: createMarkupId(), tool: 'text', color: color.value, visible: true,
        strokeWidth: strokeWidth.value, intensity: intensity.value, fontSize: fontSize.value,
        points: [textInput.value.point, textInput.value.point], text: pendingTextValue.value,
      }]
    : renderedAnnotations.value;
  return renderMarkedImageToBlob(image, exportAnnotations.filter((a) => a.visible), {
    canvas: mt('markupErrorCanvas'),
    export: mt('markupErrorExport'),
  }, imageBox.value);
}

async function sendMarkedImage() {
  if (isSending.value) return;
  const trimmedInstruction = instruction.value.trim();
  if (!hasVisibleMarkup.value) { toast(mt('markupNeedMarkup')); return; }
  if (!trimmedInstruction) { toast(mt('markupNeedInstruction')); return; }
  commitError.value = null;
  isSending.value = true;
  try {
    const markedImageBlob = await exportMarkedImage();
    if (!markedImageBlob) throw new Error(mt('markupErrorReadImage'));
    await props.onSend(markedImageBlob, trimmedInstruction);
  } catch (error) {
    commitError.value = error instanceof Error ? error.message : mt('markupErrorSendFailed');
  } finally {
    isSending.value = false;
  }
}

function onStageClick(event: MouseEvent) {
  if (activeTool.value === 'text' && !textInput.value) {
    const target = event.currentTarget as HTMLElement;
    openTextInputAt(event.clientX, event.clientY, target.getBoundingClientRect());
  }
}
function onStagePointerLeave() {
  if (!isErasing) eraserCursor.value = null;
}
function onInstructionKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    void sendMarkedImage();
  }
}

const stageStyle = computed(() =>
  imageBox.value.width > 0 && imageBox.value.height > 0
    ? { height: `${imageBox.value.height}px`, width: `${imageBox.value.width}px` }
    : undefined,
);

// 暴露给模板
const layerList = computed(() =>
  annotations.value.map((annotation, index) => ({ annotation, index })).reverse(),
);
</script>

<template>
  <Teleport to="body">
    <div
      class="comic-markup-overlay"
      :data-active-tool="activeTool"
      role="dialog"
      aria-modal="true"
      :aria-label="mt('markupTitle')"
      @click.stop
      @pointerdown.stop
    >
      <header class="comic-markup-header">
        <div class="comic-markup-title">
          <strong>{{ mt('markupTitle') }}</strong>
          <span>{{ imageName }}</span>
        </div>
        <div class="comic-markup-header-actions">
          <span v-if="commitError" class="comic-markup-error">{{ commitError }}</span>
          <button :aria-label="mt('markupHelp')" type="button" @click="onRequestGuide">
            <MarkupIcon name="help" :size="18" />
          </button>
          <button class="comic-markup-close" :aria-label="mt('markupCloseAria')" type="button" @click="onClose">
            <MarkupIcon name="close" :size="18" />
          </button>
        </div>
      </header>

      <main class="comic-markup-main">
        <section class="comic-markup-canvas">
          <div
            class="comic-markup-stage"
            :style="stageStyle"
            @click="onStageClick"
            @pointercancel="finishAnnotation"
            @pointerdown="startAnnotation"
            @pointerleave="onStagePointerLeave"
            @pointermove="updateAnnotation"
            @pointerup="finishAnnotation"
          >
            <img
              :alt="imageName"
              crossorigin="anonymous"
              :draggable="false"
              ref="imageRef"
              :src="toWebp(imageUrl)"
              @dragstart.prevent
              @load="syncImageBox"
            />
            <svg
              class="comic-markup-svg"
              :style="stageStyle"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <marker id="comic-markup-arrow" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="5" refY="3">
                  <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
                </marker>
              </defs>
              <template v-for="a in visibleRendered" :key="a.id">
                <g v-if="a.tool !== 'text' && a.tool !== 'number'">
                  <polyline
                    v-if="a.tool === 'brush'"
                    fill="none"
                    :points="brushPointsStr(a)"
                    :stroke="a.color"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-width="a.strokeWidth / 4"
                  />
                  <line
                    v-else-if="a.tool === 'line' || a.tool === 'arrow'"
                    :marker-end="a.tool === 'arrow' ? 'url(#comic-markup-arrow)' : undefined"
                    :x1="a.points[0].x"
                    :x2="a.points[a.points.length - 1].x"
                    :y1="a.points[0].y"
                    :y2="a.points[a.points.length - 1].y"
                    :stroke="a.color"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-width="a.strokeWidth / 4"
                  />
                  <rect
                    v-else-if="a.tool === 'rect'"
                    fill="none"
                    :x="shapeX(a)"
                    :y="shapeY(a)"
                    :width="shapeW(a)"
                    :height="shapeH(a)"
                    :stroke="a.color"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-width="a.strokeWidth / 4"
                  />
                  <ellipse
                    v-else-if="a.tool === 'circle'"
                    fill="none"
                    :cx="shapeX(a) + shapeW(a) / 2"
                    :cy="shapeY(a) + shapeH(a) / 2"
                    :rx="shapeW(a) / 2"
                    :ry="shapeH(a) / 2"
                    :stroke="a.color"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-width="a.strokeWidth / 4"
                  />
                  <g v-else-if="a.tool === 'mosaic'">
                    <template v-if="a.mosaicBlocks && a.mosaicBlocks.length">
                      <rect
                        v-for="(block, bi) in a.mosaicBlocks"
                        :key="`${bi}-${block.offsetX}-${block.offsetY}`"
                        :fill="block.color"
                        :height="block.height"
                        :width="block.width"
                        :x="shapeX(a) + block.offsetX"
                        :y="shapeY(a) + block.offsetY"
                      />
                    </template>
                    <rect
                      v-else
                      class="comic-markup-mosaic-preview"
                      :height="Math.max(shapeH(a), 0.1)"
                      :width="Math.max(shapeW(a), 0.1)"
                      :x="shapeX(a)"
                      :y="shapeY(a)"
                    />
                  </g>
                  <rect
                    v-if="isSelected(a)"
                    class="comic-markup-selection"
                    :height="Math.max(boundsOf(a).height, 1)"
                    :width="Math.max(boundsOf(a).width, 1)"
                    :x="boundsOf(a).x"
                    :y="boundsOf(a).y"
                  />
                </g>
              </template>
            </svg>
            <!-- 文字/数字标记用 HTML 叠加层渲染，避免 SVG 非等比缩放导致拉伸变形 -->
            <template v-if="imageBox.width > 0 && imageBox.height > 0">
              <template v-for="a in overlayAnnotations" :key="a.id">
                <span
                  v-if="a.tool === 'number'"
                  class="comic-markup-badge"
                  :class="{ selected: isSelected(a) }"
                  :style="{
                    left: `${a.points[0].x}%`,
                    top: `${a.points[0].y}%`,
                    width: `${numberDiameter(a)}px`,
                    height: `${numberDiameter(a)}px`,
                    background: a.color,
                    fontSize: `${numberDiameter(a) * 0.6}px`,
                  }"
                >{{ a.number }}</span>
                <span
                  v-else
                  class="comic-markup-text-label"
                  :class="textLabelClass(a)"
                  :style="{
                    left: `${a.points[0].x}%`,
                    top: `${a.points[0].y}%`,
                    maxWidth: textLabelMaxWidth(a),
                    color: a.color,
                    fontSize: `${textLabelSize(a)}px`,
                  }"
                >{{ a.text }}</span>
              </template>
            </template>
            <span
              v-if="activeTool === 'eraser' && eraserCursor"
              class="comic-markup-eraser-cursor"
              :style="{
                height: `${eraserSize}px`,
                width: `${eraserSize}px`,
                left: `${eraserCursor.x}%`,
                top: `${eraserCursor.y}%`,
              }"
            />
            <input
              v-if="textInput"
              ref="textInputRef"
              class="comic-markup-text-input"
              :value="textInput.value"
              :placeholder="mt('markupTextPlaceholder')"
              :style="{
                color,
                fontSize: `${textInputFontSize}px`,
                left: `${textInput.point.x}%`,
                top: `${textInput.point.y}%`,
                transform: textInput.point.x > 50 ? 'translate(-100%, -50%)' : 'translateY(-50%)',
                maxWidth: textInput.point.x > 50 ? `${textInput.point.x}%` : `${100 - textInput.point.x}%`,
              }"
              @blur="handleTextInputBlur"
              @input="textInput && (textInput.value = ($event.target as HTMLInputElement).value)"
              @click.stop
              @pointerdown.stop
              @keydown.enter.prevent="commitTextInput"
              @keydown.esc.prevent="textInput = null"
            />
          </div>

          <div class="comic-markup-toolbar" @pointerdown.stop>
            <div class="comic-markup-tool-buttons" :aria-label="mt('markupToolsAria')">
              <button
                v-for="tool in markupTools"
                :key="tool.id"
                :aria-label="mt(tool.labelKey)"
                :class="{ active: activeTool === tool.id }"
                :title="mt(tool.labelKey)"
                type="button"
                @click="selectTool(tool.id)"
              >
                <MarkupIcon :name="toolIconName[tool.id]" :size="17" />
              </button>
            </div>
            <div
              v-if="activeTool !== 'mosaic' && activeTool !== 'eraser'"
              class="comic-markup-colors"
              :aria-label="mt('markupColorsAria')"
            >
              <button
                v-for="item in markupColors"
                :key="item"
                :aria-label="`${mt('markupColorsAria')} ${item}`"
                :class="{ active: color === item }"
                :style="{ background: item }"
                type="button"
                @mousedown.prevent
                @click="color = item"
              />
            </div>
            <label class="comic-markup-range">
              <span>{{ currentControl.label }}</span>
              <input
                :max="currentControl.max"
                :min="currentControl.min"
                type="range"
                :value="currentControl.value"
                @input="currentControl.setter(Number(($event.target as HTMLInputElement).value))"
                @pointerup="textInputRef?.focus({ preventScroll: true })"
              />
              <strong>{{ `${currentControl.value}${currentControl.suffix}` }}</strong>
            </label>
          </div>
        </section>

        <aside class="comic-markup-layers" :data-mobile-tab="mobilePanelTab">
          <div class="comic-markup-mobile-tabs" role="tablist" :aria-label="mt('markupTitle')">
            <button
              :aria-selected="mobilePanelTab === 'layers'"
              :class="{ active: mobilePanelTab === 'layers' }"
              role="tab"
              type="button"
              @click="mobilePanelTab = 'layers'"
            >
              <MarkupIcon name="layers" :size="15" />
              {{ mt('markupLayers') }}
              <span>{{ annotations.length }}</span>
            </button>
            <button
              :aria-selected="mobilePanelTab === 'instruction'"
              :class="{ active: mobilePanelTab === 'instruction' }"
              role="tab"
              type="button"
              @click="mobilePanelTab = 'instruction'"
            >
              <MarkupIcon name="message" :size="15" />
              {{ mt('markupInstruction') }}
            </button>
          </div>
          <header>
            <strong><MarkupIcon name="layers" :size="17" />{{ mt('markupLayers') }}<span>{{ annotations.length }}</span></strong>
            <button :aria-label="mt('markupClearLayers')" :disabled="annotations.length === 0" type="button" @click="clear">
              <MarkupIcon name="trash" :size="15" />
            </button>
          </header>
          <p>{{ mt('markupLayerHint') }}</p>
          <div v-if="annotations.length === 0" class="comic-markup-empty">
            <MarkupIcon name="layers" :size="34" />
            <strong>{{ mt('markupEmpty') }}</strong>
            <span>{{ mt('markupEmptyHint') }}</span>
          </div>
          <ul v-else>
            <li
              v-for="{ annotation, index } in layerList"
              :key="annotation.id"
              :class="[annotation.visible ? '' : 'muted', selectedAnnotationId === annotation.id ? 'selected' : '']"
              @click="() => { activeTool = 'select'; selectedAnnotationId = annotation.id; }"
            >
              <span class="comic-markup-layer-icon" :style="{ color: annotation.color }">
                {{ getMarkupLayerIcon(annotation.tool) }}
              </span>
              <strong>{{ getMarkupLayerLabel(annotation, index + 1, mt) }}</strong>
              <div class="comic-markup-layer-actions">
                <button
                  :aria-label="mt('markupLayerUp')"
                  :disabled="index === annotations.length - 1"
                  type="button"
                  @click.stop="moveAnnotation(annotation.id, 1)"
                ><MarkupIcon name="arrowUp" :size="13" /></button>
                <button
                  :aria-label="mt('markupLayerDown')"
                  :disabled="index === 0"
                  type="button"
                  @click.stop="moveAnnotation(annotation.id, -1)"
                ><MarkupIcon name="arrowDown" :size="13" /></button>
                <button
                  :aria-label="annotation.visible ? mt('markupLayerHide') : mt('markupLayerShow')"
                  type="button"
                  @click.stop="toggleAnnotation(annotation.id)"
                ><MarkupIcon :name="annotation.visible ? 'eye' : 'eyeOff'" :size="13" /></button>
                <button
                  :aria-label="mt('markupLayerDelete')"
                  type="button"
                  @click.stop="deleteAnnotation(annotation.id)"
                ><MarkupIcon name="trash" :size="13" /></button>
              </div>
            </li>
          </ul>
          <section class="comic-markup-send-panel">
            <div class="comic-markup-send-title">
              <strong>{{ mt('markupInstruction') }}</strong>
              <span>{{ instruction.length }} / 5000</span>
            </div>
            <textarea
              v-model="instruction"
              :maxlength="5000"
              :placeholder="mt('markupInstructionPlaceholder')"
              @keydown="onInstructionKeydown"
            />
            <p>{{ mt('markupSendHint') }}</p>
            <button
              class="comic-markup-direct-send"
              :disabled="isSending"
              type="button"
              @click="sendMarkedImage"
            >
              <span v-if="isSending" class="comic-markup-send-spinner" />
              <span
                v-else-if="typeof estimatedPoints === 'number' && estimatedPoints > 0"
                class="comic-markup-send-cost"
              >
                {{ estimatedPoints }}
                <img :src="coinIcon" alt="" />
              </span>
              <template v-else>{{ mt('markupSend') }}</template>
            </button>
          </section>
        </aside>
      </main>

      <div v-if="showGuide" class="comic-markup-guide-backdrop">
        <section class="comic-markup-guide-card">
          <div class="comic-markup-guide-copy">
            <span>{{ mt('markupGuideBadge') }}</span>
            <h2>{{ mt('markupGuideTitle') }}</h2>
            <p>{{ mt('markupGuideDesc') }}</p>
          </div>
          <div class="comic-markup-guide-example">
            <div>
              <img :alt="mt('markupGuideBadge')" :src="toWebp(imageUrl, 'format/webp/quality/60')" />
              <span class="comic-markup-guide-circle" />
              <span class="comic-markup-guide-arrow">{{ mt('markupGuideExample') }}</span>
            </div>
          </div>
          <div class="comic-markup-guide-actions">
            <button type="button" @click="onDismissGuide(false)">{{ mt('markupGuideGotIt') }}</button>
            <button type="button" @click="onDismissGuide(true)">{{ mt('markupGuideDontShow') }}</button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.comic-markup-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  width: 100vw;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: 58px minmax(0, 1fr);
  color: #f5f5f5;
  background: #1a1a1a;
}

.comic-markup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #2c2c2c;
  background: #1a1a1a;
}

.comic-markup-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.comic-markup-title strong { font-size: 16px; font-weight: 800; color: #f5f5f5; }
.comic-markup-title span {
  max-width: 36vw;
  overflow: hidden;
  color: #777;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comic-markup-header-actions,
.comic-markup-tool-buttons,
.comic-markup-colors,
.comic-markup-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.comic-markup-header button,
.comic-markup-tool-buttons button,
.comic-markup-toolbar-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: #f5f5f5;
  cursor: pointer;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background: #1a1a1a;
  box-shadow: none;
  transition: 0.12s ease;
}

.comic-markup-header button:hover,
.comic-markup-tool-buttons button:hover,
.comic-markup-toolbar-actions button:hover,
.comic-markup-tool-buttons button.active {
  color: #ffffff;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
}

.comic-markup-header button:disabled,
.comic-markup-toolbar-actions button:disabled,
.comic-markup-layers button:disabled { cursor: not-allowed; opacity: 0.38; box-shadow: none; }

/* 圆形黑边关闭按钮（新 UI 规范） */
.comic-markup-header button.comic-markup-close {
  width: 2.25rem;
  height: 2.25rem;
  border: 0.15625rem solid #3d3d3d;
  border-radius: 999px;
  background: #1a1a1a;
  box-shadow: none;
}
.comic-markup-header button.comic-markup-close:hover { background: linear-gradient(135deg, #ff4f9a, #ff2d7f); color: #FFFFFF; }

.comic-markup-error {
  max-width: min(360px, 32vw);
  overflow: hidden;
  color: #e11d48;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comic-markup-main { display: grid; grid-template-columns: minmax(0, 1fr) 300px; min-height: 0; }
.comic-markup-canvas {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) 58px;
  place-items: center;
  padding: 0 18px;
  overflow: hidden;
}

.comic-markup-stage {
  position: relative;
  display: block;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  border-radius: 8px;
  border: 1px solid #3d3d3d;
  background: #1a1a1a;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}

.comic-markup-stage img {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
}

.comic-markup-svg { position: absolute; inset: 0; cursor: crosshair; touch-action: none; }
.comic-markup-overlay[data-active-tool='select'] .comic-markup-svg { cursor: grab; }
.comic-markup-overlay[data-active-tool='eraser'] .comic-markup-stage,
.comic-markup-overlay[data-active-tool='eraser'] .comic-markup-svg { cursor: none; }
.comic-markup-svg * { pointer-events: none; }
.comic-markup-eraser-cursor {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  border: 1px solid #3d3d3d;
  border-radius: 50%;
  background: rgba(255, 77, 142, 0.2);
  box-shadow: 0 0 0 1px rgba(255, 77, 142, 0.95);
  transform: translate(-50%, -50%);
}
.comic-markup-mosaic-preview {
  fill: rgba(255, 77, 142, 0.16);
  stroke: #ff4f9a;
  stroke-dasharray: 1.4 1.2;
  stroke-width: 0.35;
}
.comic-markup-selection {
  fill: none;
  stroke: #ff4f9a;
  stroke-dasharray: 1.3 1;
  stroke-width: 0.3;
}

.comic-markup-text-input {
  position: absolute;
  z-index: 2;
  min-width: 110px;
  padding: 5px 8px;
  font-weight: 800;
  outline: none;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  background: #1a1a1a;
  box-shadow: none;
  transform: translateY(-50%);
}
.comic-markup-text-input::placeholder { color: #777; }

/* 数字标记 / 文字 的 HTML 叠加层（不受 SVG 非等比缩放影响） */
.comic-markup-badge {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 900;
  line-height: 1;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}
.comic-markup-text-label {
  position: absolute;
  z-index: 2;
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  transform: translateY(-50%);
  -webkit-text-stroke: 3px #000;
  paint-order: stroke fill;
  text-shadow:
    -1px -1px 0 #000, 1px -1px 0 #000,
    -1px 1px 0 #000, 1px 1px 0 #000;
}
.comic-markup-text-label.align-right {
  text-align: right;
  transform: translate(-100%, -50%);
}
.comic-markup-text-label.wrap {
  white-space: pre-wrap;
  word-break: break-all;
}
.comic-markup-text-label.align-right {
  text-align: right;
  transform: translate(-100%, -50%);
}
.comic-markup-badge.selected { box-shadow: 0 0 0 2px #1a1a1a, 0 0 0 4px #ff4f9a; }
.comic-markup-text-label.selected { outline: 2px dashed #ff4f9a; outline-offset: 3px; }

.comic-markup-toolbar {
  display: flex;
  align-items: center;
  align-self: stretch;
  width: calc(100vw - 272px);
  min-height: 58px;
  gap: 14px;
  padding: 0 18px;
  overflow-x: auto;
  border-top: 1px solid #2c2c2c;
  background: #1a1a1a;
}

.comic-markup-colors { padding-left: 14px; border-left: 1px solid #2c2c2c; }
.comic-markup-colors button {
  width: 22px;
  height: 22px;
  padding: 0;
  cursor: pointer;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
}
.comic-markup-colors button.active { box-shadow: 0 0 0 2px #1a1a1a, 0 0 0 4px #3d3d3d; }

.comic-markup-range {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
  padding-left: 14px;
  color: #777;
  font-size: 12px;
  font-weight: 700;
  border-left: 1px solid #2c2c2c;
}

.comic-markup-range input {
  width: 116px;
  cursor: pointer;
  accent-color: #ff4f9a;
  -webkit-appearance: auto;
  appearance: auto;
  height: auto;
  padding: 0;
  border: 0;
  background: none;
}
.comic-markup-range strong { min-width: 34px; color: #f5f5f5; }
.comic-markup-toolbar-actions { margin-left: auto; padding-left: 14px; border-left: 1px solid #2c2c2c; }

.comic-markup-layers {
  display: grid;
  min-height: 0;
  padding: 18px 16px 24px;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  border-left: 1px solid #2c2c2c;
  background: #1a1a1a;
}
.comic-markup-mobile-tabs { display: none; }
.comic-markup-layers header { display: flex; align-items: center; justify-content: space-between; }
.comic-markup-layers header strong { display: inline-flex; align-items: center; gap: 7px; font-size: 15px; color: #f5f5f5; }
.comic-markup-layers header strong span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  border-radius: 999px;
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
}

.comic-markup-layers header button,
.comic-markup-layer-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #f5f5f5;
  cursor: pointer;
  border: 1px solid #3d3d3d;
  border-radius: 7px;
  background: #1a1a1a;
  box-shadow: none;
}
.comic-markup-layers > p { margin: 14px 0 18px; color: #777; font-size: 12px; line-height: 1.6; }
.comic-markup-empty {
  align-self: center;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #777;
  text-align: center;
}
.comic-markup-empty strong { color: #777; }
.comic-markup-layers ul {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 8px;
  padding: 0;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  list-style: none;
}
.comic-markup-layers li {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  height: 40px;
  gap: 10px;
  padding: 7px 10px;
  color: #f5f5f5;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 10px;
}
.comic-markup-layers li:hover,
.comic-markup-layers li.selected { border-color: #3d3d3d; background: rgba(255, 79, 154, 0.12); padding-right: 116px; }
.comic-markup-layers li.muted { opacity: 0.46; }
.comic-markup-layer-icon { width: 20px; font-size: 18px; font-weight: 900; line-height: 1; }
.comic-markup-layers li > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comic-markup-layer-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.comic-markup-layers li:hover .comic-markup-layer-actions,
.comic-markup-layers li.selected .comic-markup-layer-actions { opacity: 1; }
.comic-markup-layer-actions button { width: 27px; height: 27px; }
.comic-markup-layer-actions button:hover:not(:disabled),
.comic-markup-layers header button:hover:not(:disabled) {
  color: #ffffff;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
}

.comic-markup-send-panel {
  display: grid;
  gap: 9px;
  margin-top: 14px;
  padding-top: 14px;
    border-top: 1px solid #2c2c2c;
}

.comic-markup-send-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comic-markup-send-title strong { color: #f5f5f5; font-size: 13px; }
.comic-markup-send-title span { color: #777; font-size: 10px; }

.comic-markup-send-panel textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px;
  color: #f5f5f5;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.55;
  resize: vertical;
  outline: none;
  border: 1px solid #3d3d3d;
  border-radius: 9px;
  background: #1a1a1a;
}

.comic-markup-send-panel textarea:focus {
  border-color: #ff4f9a;
}

.comic-markup-send-panel textarea::placeholder { color: #777; }
.comic-markup-send-panel > p { margin: 0; color: #777; font-size: 10px; line-height: 1.5; }

.comic-markup-send-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 800;
}
.comic-markup-send-cost img { width: 16px; height: 16px; display: block; }

.comic-markup-send-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: comic-markup-spin 0.7s linear infinite;
}
@keyframes comic-markup-spin { to { transform: rotate(360deg); } }

.comic-markup-direct-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 38px;
  gap: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid #3d3d3d;
  border-radius: 9px;
  background: linear-gradient(145deg, #ff74b3, #f73382);
  box-shadow: none;
  transition: transform 0.2s ease;
}

.comic-markup-direct-send:hover { transform: translate(-1px, -1px); }
.comic-markup-direct-send:disabled { cursor: not-allowed; opacity: 0.42; box-shadow: none; transform: none; }

.comic-markup-guide-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3002;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
}
.comic-markup-guide-card {
  display: grid;
  width: min(760px, calc(100vw - 48px));
  grid-template-columns: 0.9fr 1.1fr;
  gap: 18px;
  padding: 22px;
  color: #f5f5f5;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  background: #1a1a1a;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}
.comic-markup-guide-copy { display: flex; flex-direction: column; justify-content: center; padding: 8px; }
.comic-markup-guide-copy > span {
  width: fit-content;
  padding: 5px 10px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
}
.comic-markup-guide-copy h2 { margin: 16px 0 10px; font-size: 24px; line-height: 1.25; color: #f5f5f5; }
.comic-markup-guide-copy p { margin: 0; color: #777; font-size: 14px; line-height: 1.75; }
.comic-markup-guide-example > div {
  position: relative;
  height: 360px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #3d3d3d;
  background: #1a1a1a;
}
.comic-markup-guide-example img { width: 100%; height: 100%; object-fit: cover; }
.comic-markup-guide-circle {
  position: absolute;
  top: 24%;
  left: 22%;
  width: 44%;
  height: 30%;
  border: 5px solid #ff4f9a;
  border-radius: 50%;
  transform: rotate(-10deg);
}
.comic-markup-guide-arrow {
  position: absolute;
  right: 16px;
  bottom: 24px;
  padding: 7px 10px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  border-radius: 7px;
  border: 1px solid #3d3d3d;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  box-shadow: none;
  box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
}
.comic-markup-guide-actions {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.comic-markup-guide-actions button {
  min-height: 42px;
  cursor: pointer;
  color: #f5f5f5;
  font-weight: 800;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  background: #1a1a1a;
  box-shadow: none;
  transition: transform 0.16s;

  &:hover { transform: translate(-1px, -1px); }
}
.comic-markup-guide-actions button:last-child { color: #ffffff; background: linear-gradient(135deg, #ff4f9a, #ff2d7f); }

@media (max-width: 980px) {
  .comic-markup-main { grid-template-columns: minmax(0, 1fr) 240px; }
  .comic-markup-toolbar { width: calc(100vw - 240px); }
  .comic-markup-colors { display: none; }
}

@media (max-width: 880px) {
  .comic-markup-overlay {
    grid-template-rows: 56px minmax(0, 1fr);
  }

  .comic-markup-header {
    min-width: 0;
    padding: env(safe-area-inset-top, 0) 10px 0;
  }

  .comic-markup-title { min-width: 0; }
  .comic-markup-title strong { font-size: 14px; white-space: nowrap; }
  .comic-markup-title span { display: none; }
  .comic-markup-header-actions { min-width: 0; gap: 7px; }
  .comic-markup-header button {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
  }
  .comic-markup-error {
    max-width: min(180px, 42vw);
    font-size: 10px;
  }

  .comic-markup-main {
    display: block;
    min-width: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .comic-markup-canvas {
    display: grid;
    min-width: 0;
    min-height: 0;
    grid-template-rows: auto auto;
    place-items: center;
    gap: 10px;
    padding: 12px 12px 0;
    overflow: visible;
  }

  .comic-markup-stage {
    max-width: 100%;
    max-height: 50dvh;
  }

  .comic-markup-toolbar {
    display: grid;
    width: calc(100vw - 24px);
    min-height: 0;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    gap: 9px 8px;
    padding: 8px;
    overflow: hidden;
    border: 1px solid #3d3d3d;
    border-radius: 12px 12px 0 0;
    background: #1a1a1a;
  }

  .comic-markup-tool-buttons {
    grid-column: 1 / -1;
    justify-content: flex-start;
    width: 100%;
    gap: 7px;
    padding: 2px 1px 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .comic-markup-tool-buttons::-webkit-scrollbar { display: none; }
  .comic-markup-tool-buttons button {
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
  }

  .comic-markup-colors { display: none; }
  .comic-markup-range {
    grid-column: 1;
    min-width: 0;
    gap: 7px;
    padding-left: 2px;
    border-left: 0;
  }
  .comic-markup-range span { flex: 0 0 auto; }
  .comic-markup-range input { width: min(42vw, 180px); min-width: 86px; }
  .comic-markup-range strong { min-width: 32px; font-size: 11px; }
  .comic-markup-toolbar-actions {
    grid-column: 2;
    margin-left: 0;
    padding-left: 8px;
    border-left: 0;
  }
  .comic-markup-toolbar-actions button {
    width: 38px;
    height: 38px;
  }

  .comic-markup-layers {
    display: grid;
    min-height: 320px;
    padding: 12px 12px calc(14px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid #2c2c2c;
    border-left: 0;
  }

  .comic-markup-mobile-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 4px;
    margin-bottom: 10px;
    border: 1px solid #3d3d3d;
    border-radius: 11px;
    background: #1a1a1a;
  }

  .comic-markup-mobile-tabs button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 40px;
    gap: 6px;
    padding: 0 8px;
    color: #777;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    border: 0;
    border-radius: 8px;
    background: transparent;
  }

  .comic-markup-mobile-tabs button.active {
    color: #ffffff;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  }

  .comic-markup-mobile-tabs button > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
  }

  .comic-markup-layers[data-mobile-tab='layers'] {
    grid-template-rows: auto auto auto minmax(0, 1fr);
  }

  .comic-markup-layers[data-mobile-tab='layers'] .comic-markup-send-panel { display: none; }

  .comic-markup-layers[data-mobile-tab='instruction'] {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .comic-markup-layers[data-mobile-tab='instruction'] > header,
  .comic-markup-layers[data-mobile-tab='instruction'] > p,
  .comic-markup-layers[data-mobile-tab='instruction'] > ul,
  .comic-markup-layers[data-mobile-tab='instruction'] > .comic-markup-empty {
    display: none;
  }

  .comic-markup-layers[data-mobile-tab='instruction'] .comic-markup-send-panel {
    align-content: start;
    min-height: 0;
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }

  .comic-markup-layers[data-mobile-tab='instruction'] .comic-markup-send-panel textarea {
    min-height: 132px;
  }

  .comic-markup-layers > p { margin: 7px 0 9px; font-size: 10px; }
  .comic-markup-layers ul { min-height: 0; max-height: none; height: 100%; }
  .comic-markup-layers li { padding-right: 120px; }
  .comic-markup-layer-actions { opacity: 1; }
  .comic-markup-empty { min-height: 72px; align-self: stretch; align-content: center; }
  .comic-markup-empty svg { width: 26px; height: 26px; }

  .comic-markup-send-panel { margin-top: 10px; padding-top: 10px; }
  .comic-markup-send-panel textarea { min-height: 82px; resize: none; }
  .comic-markup-direct-send { min-height: 44px; font-size: 13px; }

  .comic-markup-guide-backdrop {
    align-items: flex-start;
    padding: max(12px, env(safe-area-inset-top, 0)) 12px max(12px, env(safe-area-inset-bottom, 0));
    overflow-y: auto;
  }
  .comic-markup-guide-card {
    width: 100%;
    max-height: calc(100dvh - 24px);
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
    overflow-y: auto;
  }
  .comic-markup-guide-copy { padding: 0; }
  .comic-markup-guide-copy h2 { margin: 10px 0 7px; font-size: 20px; }
  .comic-markup-guide-copy p { font-size: 12px; line-height: 1.6; }
  .comic-markup-guide-example > div { height: min(230px, 34dvh); }
  .comic-markup-guide-actions { position: sticky; bottom: 0; gap: 8px; padding-top: 4px; background: #1a1a1a; }
}

@media (max-width: 420px) {
  .comic-markup-header { padding-right: 7px; padding-left: 8px; }
  .comic-markup-header-actions { gap: 5px; }
  .comic-markup-header button { width: 36px; height: 36px; flex-basis: 36px; }
  .comic-markup-error { display: none; }
  .comic-markup-canvas { padding-right: 8px; padding-left: 8px; }
  .comic-markup-toolbar { width: calc(100vw - 16px); }
  .comic-markup-range input { width: min(38vw, 140px); }
  .comic-markup-layers { padding-right: 10px; padding-left: 10px; }
  .comic-markup-guide-actions { grid-template-columns: 1fr; }
}

@media (max-height: 520px) and (max-width: 880px) {
  .comic-markup-stage { max-height: 42dvh; }
  .comic-markup-layers { min-height: 285px; }
  .comic-markup-guide-example { display: none; }
}
</style>
