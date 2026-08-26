<template>
  <div ref="host" class="hero-3d-bg" aria-hidden="true"></div>
</template>

<script setup lang="ts">
/**
 * Hero3DBackground — 首页 Hero 区背景的 3D 漂浮漫画分格卡片动效。
 * 从 moegen-web (React) 移植：Three.js 逻辑 1:1 照搬，仅把 hook 换成 Vue 生命周期。
 * コンセプト: 物語の断片(漫画コマ)が最奥で生まれ、読者へゆっくり漂い流れ着いては、
 * 手前で光に溶けて次の物語へと入れ替わる。
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';

const props = withDefaults(defineProps<{ paused?: boolean; scattered?: boolean }>(), {
  paused: false,
  scattered: false,
});

const host = ref<HTMLDivElement>();
const pausedRef = { value: props.paused };
const scatteredRef = { value: props.scattered };
watch(() => props.paused, (v) => { pausedRef.value = v; });
watch(() => props.scattered, (v) => { scatteredRef.value = v; });

let cleanup: (() => void) | null = null;

// design 文件夹里的示例封面（随机贴到漂浮分格上）
const DESIGN_IMAGES = Object.values(
  import.meta.glob('../assets/images/design/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })
) as string[];

/** 漫画分格的粗黑外框 */
function drawPanelFrame(g: CanvasRenderingContext2D) {
  g.strokeStyle = '#f5f5f5';
  g.lineWidth = 12;
  g.strokeRect(6, 6, 244, 328);
}

/** 随机取一张 design 封面 */
function randomDesignUrl(): string {
  return DESIGN_IMAGES[Math.floor(Math.random() * DESIGN_IMAGES.length)];
}

interface PanelTex {
  texture: THREE.CanvasTexture;
  load: (url: string) => void;
}

/** 用 design 图片生成漫画分格纹理（cover 填充 + 粗黑框）。复用同一画布，可随时 load 新图重绘。 */
function makeImagePanel(): PanelTex {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 340;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#2c2c2c';
  g.fillRect(0, 0, 256, 340);
  drawPanelFrame(g);

  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  let token = 0;
  const load = (url: string) => {
    const my = ++token; // 防止旧图片回调覆盖新图
    const img = new Image();
    img.onload = () => {
      if (my !== token) return;
      g.clearRect(0, 0, 256, 340);
      const scale = Math.max(256 / img.width, 340 / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      g.drawImage(img, (256 - dw) / 2, (340 - dh) / 2, dw, dh);
      drawPanelFrame(g);
      texture.needsUpdate = true;
    };
    img.src = url;
  };

  return { texture, load };
}

/** 256x340 漫画コマ風テクスチャ(グラデ地×ハーフトーン×集中線×太枠) */
function makePanelTexture(c1: string, c2: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 340;
  const g = cv.getContext('2d')!;

  const grad = g.createLinearGradient(0, 0, 256, 340);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 340);

  g.fillStyle = 'rgba(255,255,255,0.16)';
  for (let yy = 6; yy < 340; yy += 15) {
    for (let xx = 6; xx < 256; xx += 15) {
      g.beginPath();
      g.arc(xx, yy, 1.8, 0, Math.PI * 2);
      g.fill();
    }
  }

  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(256, i * 36);
    g.stroke();
  }

  g.strokeStyle = '#f5f5f5';
  g.lineWidth = 12;
  g.strokeRect(6, 6, 244, 328);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const GRADIENTS: [string, string][] = [
  ['#FF5FA2', '#FF9E45'],
  ['#7FD8E8', '#3B82F6'],
  ['#8B7CF6', '#C9B6FF'],
  ['#22C55E', '#A3E635'],
  ['#FFE885', '#FF5FA2'],
  ['#6C5CE7', '#00CEC9'],
];

const PANEL_COUNT = 14;

interface PanelData {
  spd: number;
  rot: number;
  vx: number;
  vy: number;
  scale: number;
}

function resetPanel(m: THREE.Mesh, initial: boolean) {
  m.position.z = initial ? Math.random() * 15 - 8 : -8 - Math.random() * 2.5;
  m.position.x = (Math.random() * 2 - 1) * 3.4;
  m.position.y = (Math.random() * 2 - 1) * 2.3;
  const data: PanelData = {
    spd: Math.random() * 1.5,
    rot: (Math.random() - 0.5) * 0.7,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.28,
    scale: 0.7 + Math.random() * 0.7,
  };
  m.userData = data;
  m.rotation.z = Math.random() * Math.PI;
  m.scale.setScalar(data.scale);
}

function depthOpacity(z: number): number {
  const inFactor = THREE.MathUtils.clamp((z + 9) / 3, 0, 1);
  const outFactor = THREE.MathUtils.clamp((7.5 - z) / 3, 0, 1);
  return Math.min(inFactor, outFactor) * 0.9;
}

onMounted(() => {
  const hostEl = host.value;
  if (!hostEl) return;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let w = hostEl.clientWidth || 1;
  let h = hostEl.clientHeight || 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);
  camera.lookAt(0, 0, 0);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return; // WebGL 不可用则不渲染 3D 层
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity .6s cubic-bezier(0.16,1,0.3,1)';
  hostEl.appendChild(canvas);

  const geo = new THREE.PlaneGeometry(2.0, 2.65);
  const panels: THREE.Mesh[] = [];
  const textures: THREE.CanvasTexture[] = [];
  const painters: (PanelTex | null)[] = [];
  for (let i = 0; i < PANEL_COUNT; i++) {
    let tex: THREE.CanvasTexture;
    if (DESIGN_IMAGES.length) {
      // 从 design 文件夹随机取一张封面
      const p = makeImagePanel();
      p.load(randomDesignUrl());
      painters.push(p);
      tex = p.texture;
    } else {
      const [c1, c2] = GRADIENTS[i % GRADIENTS.length];
      tex = makePanelTexture(c1, c2);
      painters.push(null);
    }
    textures.push(tex);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    resetPanel(m, true);
    mat.opacity = depthOpacity(m.position.z);
    m.renderOrder = m.position.z;
    scene.add(m);
    panels.push(m);
  }

  let raf = 0;
  let last = performance.now();
  const renderOnce = () => renderer.render(scene, camera);

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 16.6667, 4);
    last = now;

    if (scatteredRef.value) {
      for (const m of panels) {
        const d = m.userData as PanelData;
        const mat = m.material as THREE.MeshBasicMaterial;
        m.position.x += (m.position.x >= 0 ? 1 : -1) * (0.6 + Math.abs(m.position.x)) * dt * 0.05;
        m.position.y += (m.position.y >= 0 ? 1 : -1) * (0.5 + Math.abs(m.position.y)) * dt * 0.05;
        m.position.z += 0.14 * dt;
        m.rotation.z += d.rot * dt * 0.04;
        mat.opacity = Math.max(0, mat.opacity - 0.03 * dt);
      }
    } else if (!pausedRef.value) {
      for (let i = 0; i < panels.length; i++) {
        const m = panels[i];
        const d = m.userData as PanelData;
        m.position.z += d.spd * dt * 0.02;
        m.rotation.z += d.rot * dt * 0.01;
        m.position.x += d.vx * dt * 0.01;
        m.position.y += d.vy * dt * 0.01;
        if (m.position.z > 7.5) {
          resetPanel(m, false);
          // 回收重生时重新随机换一张 design 封面
          painters[i]?.load(randomDesignUrl());
        }
        m.renderOrder = m.position.z;
        (m.material as THREE.MeshBasicMaterial).opacity = depthOpacity(m.position.z);
      }
    }
    renderer.render(scene, camera);
  };

  if (reduced) {
    renderOnce();
    requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  } else {
    requestAnimationFrame(() => { canvas.style.opacity = '1'; });
    raf = requestAnimationFrame(loop);
  }

  const resize = () => {
    const nw = hostEl.clientWidth || 1;
    const nh = hostEl.clientHeight || 1;
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (reduced) renderOnce();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(hostEl);
  window.addEventListener('resize', resize);

  cleanup = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('resize', resize);
    geo.dispose();
    textures.forEach((t) => t.dispose());
    panels.forEach((m) => (m.material as THREE.MeshBasicMaterial).dispose());
    renderer.dispose();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});
</script>

<style scoped lang="scss">
.hero-3d-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
