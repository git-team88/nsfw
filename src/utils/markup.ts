// 标记修改（标记修图）核心纯逻辑。
// 从 canvas-frontend(feat-markup-edit) 的 MarkupImageEditor.tsx 移植而来，
// 全部为与框架无关的纯函数：坐标计算、命中检测、橡皮擦、马赛克采样、导出等。

export type MarkupTool =
  | 'select'
  | 'eraser'
  | 'brush'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'mosaic'
  | 'number'
  | 'text';

export type MarkupPoint = { x: number; y: number };
export type MarkupMosaicBlock = { color: string; height: number; offsetX: number; offsetY: number; width: number };
export type MarkupAnnotation = {
  id: string;
  tool: Exclude<MarkupTool, 'select' | 'eraser'>;
  color: string;
  visible: boolean;
  strokeWidth: number;
  intensity: number;
  fontSize: number;
  points: MarkupPoint[];
  text?: string;
  number?: number;
  mosaicBlocks?: MarkupMosaicBlock[];
};
export type MarkupTextInputState = { point: MarkupPoint; value: string } | null;
export type MarkupDragState = { annotationId: string; originalPoints: MarkupPoint[]; startPoint: MarkupPoint } | null;

export type MarkupTranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const markupColors = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be',
  '#0a84ff', '#af52de', '#ffffff', '#000000',
];

export const markupTools: Array<{ id: MarkupTool; labelKey: string }> = [
  { id: 'select', labelKey: 'markupToolSelect' },
  { id: 'eraser', labelKey: 'markupToolEraser' },
  { id: 'brush', labelKey: 'markupToolBrush' },
  { id: 'line', labelKey: 'markupToolLine' },
  { id: 'arrow', labelKey: 'markupToolArrow' },
  { id: 'rect', labelKey: 'markupToolRect' },
  { id: 'circle', labelKey: 'markupToolCircle' },
  { id: 'mosaic', labelKey: 'markupToolMosaic' },
  { id: 'number', labelKey: 'markupToolNumber' },
  { id: 'text', labelKey: 'markupToolText' },
];

export function createMarkupId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `mark_${crypto.randomUUID()}`;
  return `mark_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// 图片转 webp（走 OSS imageMogr2）减小加载体积。
// 主图默认 format/webp 不带 quality 保清晰（导出标记图用的是它）；示例图可再压 quality。
export function toWebp(url: string, mogr = 'format/webp') {
  if (!url || url.includes('imageMogr2')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}imageMogr2/${mogr}`;
}

export function getMarkupLayerIcon(tool: MarkupAnnotation['tool']) {
  if (tool === 'text') return 'T';
  if (tool === 'number') return '#';
  if (tool === 'mosaic') return '▦';
  if (tool === 'circle') return '○';
  if (tool === 'rect') return '□';
  if (tool === 'line') return '━';
  if (tool === 'arrow') return '↗';
  return '✎';
}

export function getMarkupLayerLabel(annotation: MarkupAnnotation, index: number, t: MarkupTranslateFn) {
  const labels: Record<MarkupAnnotation['tool'], string> = {
    arrow: t('markupLabelArrow'), brush: t('markupLabelBrush'), circle: t('markupLabelCircle'),
    line: t('markupLabelLine'), mosaic: t('markupLabelMosaic'),
    number: `${t('markupLabelNumber')} ${annotation.number ?? index}`, rect: t('markupLabelRect'),
    text: `${t('markupLabelText')}：${annotation.text ?? t('markupToolText')}`,
  };
  return labels[annotation.tool];
}

export function getMarkupBounds(annotation: MarkupAnnotation) {
  const xs = annotation.points.map((point) => point.x);
  const ys = annotation.points.map((point) => point.y);
  let x = Math.min(...xs);
  let y = Math.min(...ys);
  let width = Math.max(...xs) - x;
  let height = Math.max(...ys) - y;
  if (annotation.tool === 'number') {
    const radius = Math.max(0.6, annotation.fontSize / 5);
    x = annotation.points[0].x - radius;
    y = annotation.points[0].y - radius;
    width = radius * 2;
    height = radius * 2;
  }
  if (annotation.tool === 'text') {
    width = Math.max(width, Math.max(5, (annotation.text?.length ?? 2) * annotation.fontSize * 0.18));
    height = Math.max(height, Math.max(2.4, annotation.fontSize * 0.36));
  }
  if (annotation.tool === 'brush' || annotation.tool === 'line' || annotation.tool === 'arrow') {
    const padding = Math.max(1.2, annotation.strokeWidth / 5);
    x -= padding; y -= padding; width += padding * 2; height += padding * 2;
  }
  if (annotation.tool === 'mosaic') {
    width = Math.max(width, 0.1);
    height = Math.max(height, 0.1);
  }
  return { height, width, x, y };
}

export function containsMarkupPoint(annotation: MarkupAnnotation, point: MarkupPoint) {
  const bounds = getMarkupBounds(annotation);
  const tolerance = 1.5;
  return point.x >= bounds.x - tolerance && point.x <= bounds.x + bounds.width + tolerance
    && point.y >= bounds.y - tolerance && point.y <= bounds.y + bounds.height + tolerance;
}

export function moveMarkupPoints(points: MarkupPoint[], deltaX: number, deltaY: number) {
  return points.map((point) => ({
    x: Math.min(100, Math.max(0, point.x + deltaX)),
    y: Math.min(100, Math.max(0, point.y + deltaY)),
  }));
}

export function scaledDistanceToSegment(
  point: MarkupPoint,
  start: MarkupPoint,
  end: MarkupPoint,
  radiusX: number,
  radiusY: number,
) {
  const safeRadiusX = Math.max(radiusX, 0.001);
  const safeRadiusY = Math.max(radiusY, 0.001);
  const pointX = point.x / safeRadiusX;
  const pointY = point.y / safeRadiusY;
  const startX = start.x / safeRadiusX;
  const startY = start.y / safeRadiusY;
  const endX = end.x / safeRadiusX;
  const endY = end.y / safeRadiusY;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const projection = lengthSquared === 0
    ? 0
    : Math.min(1, Math.max(0, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  const nearestX = startX + projection * deltaX;
  const nearestY = startY + projection * deltaY;
  return Math.hypot(pointX - nearestX, pointY - nearestY);
}

export function eraseBrushAnnotation(
  annotation: MarkupAnnotation,
  eraserPoint: MarkupPoint,
  radiusX: number,
  radiusY: number,
): MarkupAnnotation[] {
  const erasedPoints = annotation.points.map((point, index, points) => {
    const previous = points[index - 1];
    const next = points[index + 1];
    return scaledDistanceToSegment(eraserPoint, point, point, radiusX, radiusY) <= 1
      || (previous ? scaledDistanceToSegment(eraserPoint, previous, point, radiusX, radiusY) <= 1 : false)
      || (next ? scaledDistanceToSegment(eraserPoint, point, next, radiusX, radiusY) <= 1 : false);
  });
  if (!erasedPoints.some(Boolean)) return [annotation];

  const segments: MarkupPoint[][] = [];
  let currentSegment: MarkupPoint[] = [];
  annotation.points.forEach((point, index) => {
    if (erasedPoints[index]) {
      if (currentSegment.length >= 2) segments.push(currentSegment);
      currentSegment = [];
      return;
    }
    currentSegment.push(point);
  });
  if (currentSegment.length >= 2) segments.push(currentSegment);

  return segments.map((points, index) => ({
    ...annotation,
    id: index === 0 ? annotation.id : createMarkupId(),
    points,
  }));
}

export function annotationIntersectsEraser(
  annotation: MarkupAnnotation,
  eraserPoint: MarkupPoint,
  radiusX: number,
  radiusY: number,
) {
  if (annotation.tool === 'line' || annotation.tool === 'arrow') {
    return scaledDistanceToSegment(
      eraserPoint,
      annotation.points[0],
      annotation.points[annotation.points.length - 1],
      radiusX,
      radiusY,
    ) <= 1;
  }
  const bounds = getMarkupBounds(annotation);
  return eraserPoint.x >= bounds.x - radiusX
    && eraserPoint.x <= bounds.x + bounds.width + radiusX
    && eraserPoint.y >= bounds.y - radiusY
    && eraserPoint.y <= bounds.y + bounds.height + radiusY;
}

// 采样图片区域生成马赛克块（需要图片允许跨域，否则 getImageData 会抛异常）
export function createMosaicBlocks(
  annotation: MarkupAnnotation,
  image: HTMLImageElement | null,
  imageBox: { width: number; height: number },
): MarkupMosaicBlock[] {
  const displayedWidth = Math.max(1, Math.round(imageBox.width));
  const displayedHeight = Math.max(1, Math.round(imageBox.height));
  if (!image || !displayedWidth || !displayedHeight) return [];
  const bounds = getMarkupBounds(annotation);
  const canvas = document.createElement('canvas');
  canvas.width = displayedWidth;
  canvas.height = displayedHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, displayedWidth, displayedHeight);
  let imageData: ImageData;
  try { imageData = context.getImageData(0, 0, displayedWidth, displayedHeight); } catch { return []; }
  const sourceX = Math.max(0, Math.round((bounds.x / 100) * displayedWidth));
  const sourceY = Math.max(0, Math.round((bounds.y / 100) * displayedHeight));
  const sourceWidth = Math.max(1, Math.round((bounds.width / 100) * displayedWidth));
  const sourceHeight = Math.max(1, Math.round((bounds.height / 100) * displayedHeight));
  const blockWidth = Math.max(0.35, (annotation.intensity / displayedWidth) * 100);
  const blockHeight = Math.max(0.35, (annotation.intensity / displayedHeight) * 100);
  const blocks: MarkupMosaicBlock[] = [];
  for (let offsetY = 0; offsetY < bounds.height; offsetY += blockHeight) {
    for (let offsetX = 0; offsetX < bounds.width; offsetX += blockWidth) {
      const width = Math.min(blockWidth, bounds.width - offsetX);
      const height = Math.min(blockHeight, bounds.height - offsetY);
      const pixelX = sourceX + Math.floor((offsetX / bounds.width) * sourceWidth);
      const pixelY = sourceY + Math.floor((offsetY / bounds.height) * sourceHeight);
      const pixelWidth = Math.max(1, Math.ceil((width / bounds.width) * sourceWidth));
      const pixelHeight = Math.max(1, Math.ceil((height / bounds.height) * sourceHeight));
      let red = 0; let green = 0; let blue = 0; let count = 0;
      for (let y = pixelY; y < Math.min(displayedHeight, pixelY + pixelHeight); y += 1) {
        for (let x = pixelX; x < Math.min(displayedWidth, pixelX + pixelWidth); x += 1) {
          const index = (y * displayedWidth + x) * 4;
          red += imageData.data[index] ?? 0;
          green += imageData.data[index + 1] ?? 0;
          blue += imageData.data[index + 2] ?? 0;
          count += 1;
        }
      }
      blocks.push({
        color: count > 0
          ? `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})`
          : 'rgb(148, 163, 184)',
        height, offsetX, offsetY, width,
      });
    }
  }
  return blocks;
}

export async function renderMarkedImageToBlob(
  image: HTMLImageElement,
  annotations: MarkupAnnotation[],
  errors: { canvas: string; export: string },
) {
  const width = Math.max(1, image.naturalWidth || image.width);
  const height = Math.max(1, image.naturalHeight || image.height);
  // 导出文字沿用页面字体；先等字体加载完成，避免 canvas 用 fallback 字体
  const fontFamily = (typeof document !== 'undefined' && getComputedStyle(document.body).fontFamily) || 'sans-serif';
  try { await document.fonts?.ready; } catch { /* 忽略：字体状态不可用时回退默认字体 */ }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(errors.canvas);
  context.drawImage(image, 0, 0, width, height);
  annotations.forEach((annotation) => drawMarkupAnnotation(context, annotation, width, height, fontFamily));
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error(errors.export);
  return blob;
}

export function drawMarkupAnnotation(
  context: CanvasRenderingContext2D,
  annotation: MarkupAnnotation,
  width: number,
  height: number,
  fontFamily: string = 'sans-serif',
) {
  const toCanvasPoint = (point: MarkupPoint) => ({ x: (point.x / 100) * width, y: (point.y / 100) * height });
  const startPoint = toCanvasPoint(annotation.points[0]);
  const endPoint = toCanvasPoint(annotation.points[annotation.points.length - 1]);
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = annotation.strokeWidth;
  context.strokeStyle = annotation.color;
  context.fillStyle = annotation.color;
  if (annotation.tool === 'brush') {
    context.beginPath();
    annotation.points.forEach((point, index) => {
      const canvasPoint = toCanvasPoint(point);
      if (index === 0) context.moveTo(canvasPoint.x, canvasPoint.y);
      else context.lineTo(canvasPoint.x, canvasPoint.y);
    });
    context.stroke();
    context.restore();
    return;
  }
  if (annotation.tool === 'line' || annotation.tool === 'arrow') {
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.stroke();
    if (annotation.tool === 'arrow') {
      const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
      const size = Math.max(12, annotation.strokeWidth * 3.2);
      context.beginPath();
      context.moveTo(endPoint.x, endPoint.y);
      context.lineTo(endPoint.x - size * Math.cos(angle - Math.PI / 6), endPoint.y - size * Math.sin(angle - Math.PI / 6));
      context.lineTo(endPoint.x - size * Math.cos(angle + Math.PI / 6), endPoint.y - size * Math.sin(angle + Math.PI / 6));
      context.closePath();
      context.fill();
    }
    context.restore();
    return;
  }
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const boxWidth = Math.abs(endPoint.x - startPoint.x);
  const boxHeight = Math.abs(endPoint.y - startPoint.y);
  if (annotation.tool === 'rect') {
    context.strokeRect(x, y, boxWidth, boxHeight);
    context.restore();
    return;
  }
  if (annotation.tool === 'circle') {
    context.beginPath();
    context.ellipse(x + boxWidth / 2, y + boxHeight / 2, boxWidth / 2, boxHeight / 2, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    return;
  }
  if (annotation.tool === 'mosaic') {
    const bounds = getMarkupBounds(annotation);
    const mosaicX = (bounds.x / 100) * width;
    const mosaicY = (bounds.y / 100) * height;
    if (annotation.mosaicBlocks?.length) {
      annotation.mosaicBlocks.forEach((block) => {
        context.fillStyle = block.color;
        context.fillRect(
          mosaicX + (block.offsetX / 100) * width,
          mosaicY + (block.offsetY / 100) * height,
          (block.width / 100) * width,
          (block.height / 100) * height,
        );
      });
    } else {
      context.fillStyle = 'rgba(15, 23, 42, 0.35)';
      context.fillRect(mosaicX, mosaicY, (bounds.width / 100) * width, (bounds.height / 100) * height);
    }
    context.restore();
    return;
  }
  if (annotation.tool === 'number') {
    const radius = Math.max(6, (annotation.fontSize / 5 / 100) * Math.min(width, height));
    const labelSize = Math.max(8, radius * 1.05);
    context.beginPath();
    context.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = `900 ${labelSize}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(annotation.number ?? ''), startPoint.x, startPoint.y);
    context.restore();
    return;
  }
  const textSize = Math.max(12, (annotation.fontSize / 3 / 100) * height);
  context.font = `900 ${textSize}px ${fontFamily}`;
  context.lineWidth = Math.max(2, textSize * 0.12);
  context.lineJoin = 'round';
  context.strokeStyle = '#000000';
  context.strokeText(annotation.text ?? '', startPoint.x, startPoint.y);
  context.fillStyle = annotation.color;
  context.fillText(annotation.text ?? '', startPoint.x, startPoint.y);
  context.restore();
}
