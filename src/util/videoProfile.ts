// 视频版本三档的可选性矩阵与参数/文件限制。
// Home.vue 和 Generate.vue 共用，避免两处各写一份而走偏。
//
//   fast       极速版  minimax h3 max  —— 480P/768P、5-15s、参考视频 50MB 且最多 3 段总计 15s
//   enhanced   加强版  wan3.0          —— 仅 NSFW 模式可选，原「无限制」那套（图 20MB/10 张、视频 100MB/15s）
//   super      超级版  seedance2.5     —— 原「普通」那套（图 30MB/30 张、视频 200MB/30s）
//
// 提交给后端的字段是 video_nsfw_model_type: fast / plus / super。

export const MB = 1024 * 1024;

export const VIDEO_VERSION_ORDER = ['fast', 'enhanced', 'super'] as const;
export type VideoVersion = typeof VIDEO_VERSION_ORDER[number];

// 极速版入口的总开关。关掉后可选版本里不再出现 fast：
// 普通模式只剩超级版（选择器 length > 1 判据自动不显示），NSFW 模式回到加强版 / 超级版两档。
// 极速版本身的档位配置、限制、计价都保留着，改回 true 即可整体放出。
export const FAST_VERSION_ENABLED = false;

// 可选版本 = f(普通 or NSFW 模式, 视频模式)
export function videoVersionsFor(mode: string, videoMode: string): VideoVersion[] {
  const isEdit = videoMode === 'videoModify' || videoMode === 'videoExtend';
  const list: VideoVersion[] = mode === 'unlimited'
    ? (isEdit ? ['enhanced', 'super'] : ['fast', 'enhanced', 'super'])
    : (isEdit ? ['super'] : ['fast', 'super']);
  return FAST_VERSION_ENABLED ? list : list.filter((v) => v !== 'fast');
}

// 默认极速；当前版本不在可选范围里就按 fast → enhanced → super 取第一个能用的
export function pickVideoVersion(preferred: string, list: VideoVersion[]): VideoVersion {
  if (list.includes(preferred as VideoVersion)) return preferred as VideoVersion;
  return VIDEO_VERSION_ORDER.find((v) => list.includes(v)) as VideoVersion;
}

// 版本 -> 限制档位。加强版只在 NSFW 模式下成立，其余都按 normal 那套走。
export function videoLimitModeOf(version: string, effectiveMode: string): string {
  if (version === 'fast') return 'fast';
  return effectiveMode === 'unlimited' && version === 'enhanced' ? 'unlimited' : 'normal';
}

// 版本 <-> 接口字段 video_nsfw_model_type
export function toModelType(version: string): string {
  if (version === 'fast') return 'fast';
  return version === 'super' ? 'super' : 'plus';
}
export function fromModelType(modelType: any): VideoVersion {
  // 极速版关掉时，旧作品重新编辑不能把已经隐藏的档位选回来，落到加强版。
  if (modelType === 'fast' && FAST_VERSION_ENABLED) return 'fast';
  return modelType === 'super' ? 'super' : 'enhanced';
}

export interface VideoProfile {
  maxInputChars: number;
  qualityOptions: { value: string; label: string }[];
  defaultQuality: string;
  ratioOptions: { value: string; label: string }[];
  defaultRatio: string;
  durationMin: number;
  durationMax: number;
  defaultDuration: string;
  durationMarks: number[];
  imageMaxCount: number;
  imageMaxSize: number;
  videoMaxSize: number;
  audioMaxSize: number;
  refVideoMinSeconds: number;
  refVideoMaxSeconds: number;
  refVideoBudget: number;
  refVideoMaxClips: number;
  refAudioMinSeconds: number;
  refAudioMaxSeconds: number;
  refAudioBudget: number;
  refAudioMaxClips: number;
  modifyMinSeconds: number;
  extendMinSeconds: number;
  dimMin: number;
  dimMax: number;
  ratioMin: number;
  ratioMax: number;
  // 参考视频的宽 × 高 像素总数区间，0 表示该档位不校验
  areaMin: number;
  areaMax: number;
}

// refVideoMaxClips / refAudioMaxClips / audioMaxSize 为 0 表示不限制
export const VIDEO_PROFILES: Record<string, VideoProfile> = {
  fast: {
    maxInputChars: 7000,
    qualityOptions: [{ value: '480P', label: '480P' }, { value: '768P', label: '768P' }],
    defaultQuality: '480P',
    ratioOptions: [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }],
    defaultRatio: '9:16',
    durationMin: 5, durationMax: 15, defaultDuration: '15', durationMarks: [5, 10, 15],
    imageMaxCount: 9, imageMaxSize: 30 * MB, videoMaxSize: 50 * MB, audioMaxSize: 15 * MB,
    refVideoMinSeconds: 2, refVideoMaxSeconds: 15, refVideoBudget: 15, refVideoMaxClips: 3,
    refAudioMinSeconds: 2, refAudioMaxSeconds: 15, refAudioBudget: 15, refAudioMaxClips: 3,
    modifyMinSeconds: 2, extendMinSeconds: 2,
    dimMin: 256, dimMax: 5760, ratioMin: 0.4, ratioMax: 2.5,
    areaMin: 0, areaMax: 0,
  },
  unlimited: {
    maxInputChars: 20000,
    qualityOptions: [{ value: '720P', label: '720P' }, { value: '1080P', label: '1080P' }],
    defaultQuality: '720P',
    ratioOptions: [{ value: '9:16', label: '9:16' }, { value: '16:9', label: '16:9' }],
    defaultRatio: '9:16',
    durationMin: 2, durationMax: 30, defaultDuration: '30', durationMarks: [2, 10, 20, 30],
    imageMaxCount: 10, imageMaxSize: 20 * MB, videoMaxSize: 100 * MB, audioMaxSize: 0,
    refVideoMinSeconds: 1, refVideoMaxSeconds: 15, refVideoBudget: 30, refVideoMaxClips: 0,
    refAudioMinSeconds: 0, refAudioMaxSeconds: 0, refAudioBudget: 0, refAudioMaxClips: 0,
    modifyMinSeconds: 1, extendMinSeconds: 1,
    dimMin: 240, dimMax: 4096, ratioMin: 1 / 8, ratioMax: 8,
    areaMin: 0, areaMax: 0,
  },
  normal: {
    // 超级版（super）：普通模式和无限制模式都落到这一档
    maxInputChars: 20000,
    qualityOptions: [{ value: '720P', label: '720P' }, { value: '1080P', label: '1080P' }],
    defaultQuality: '720P',
    ratioOptions: [{ value: '9:16', label: '9:16' }, { value: '16:9', label: '16:9' }],
    defaultRatio: '9:16',
    durationMin: 4, durationMax: 30, defaultDuration: '30', durationMarks: [4, 10, 20, 30],
    imageMaxCount: 30, imageMaxSize: 30 * MB, videoMaxSize: 200 * MB, audioMaxSize: 0,
    refVideoMinSeconds: 2, refVideoMaxSeconds: 30, refVideoBudget: 30, refVideoMaxClips: 0,
    refAudioMinSeconds: 0, refAudioMaxSeconds: 0, refAudioBudget: 0, refAudioMaxClips: 0,
    modifyMinSeconds: 4, extendMinSeconds: 2,
    dimMin: 300, dimMax: 6000, ratioMin: 0.4, ratioMax: 2.5,
    // 超级版参考视频还要求宽 × 高 落在 [614×664, 3326×2494] 之间
    areaMin: 614 * 664, areaMax: 3326 * 2494,
  },
};

export function profileOf(limitMode: string): VideoProfile {
  return VIDEO_PROFILES[limitMode] || VIDEO_PROFILES.normal;
}

// 页面初始状态：普通模式下的默认版本。分辨率 / 比例 / 时长这几个 ref 的初始值
// 必须从这里取，写死 720P / 30s 会和默认版本对不上（极速版是 480P / 15s）。
// 极速版开着时这里是 fast，关掉后自动落到超级版。
export const DEFAULT_VIDEO_VERSION: VideoVersion = videoVersionsFor('normal', 'multimodal')[0];
export const DEFAULT_VIDEO_PROFILE: VideoProfile =
  profileOf(videoLimitModeOf(DEFAULT_VIDEO_VERSION, 'normal'));

// 按输入框的计数规则（不可编辑的 @ 引用标签算 7 个字符）把提示词 HTML 截到 max 字符以内。
// 切档位时用：极速版只有 7000 字，从加强版 20000 字切过来会超标，而现有的字数限制
// 是「拒绝输入」不是「截断」—— 超标内容留在框里，用户一个字都打不进去，却还能点生成
// 然后被后端拒。这里在切换时就把它收敛掉。
export function clampPromptHtml(
  html: string,
  max: number,
): { html: string; text: string; clamped: boolean } {
  if (!html || typeof document === 'undefined') return { html: html || '', text: '', clamped: false };
  const box = document.createElement('div');
  box.innerHTML = html;
  let count = 0;
  let clamped = false;

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (count >= max) {
        child.parentNode?.removeChild(child);
        clamped = true;
        continue;
      }
      if (child.nodeType === 3) {
        const text = child.textContent || '';
        if (count + text.length > max) {
          child.textContent = text.slice(0, max - count);
          count = max;
          clamped = true;
        } else {
          count += text.length;
        }
      } else if (child.nodeType === 1) {
        const el = child as HTMLElement;
        // 引用标签整块算 7 个字符，放不下就整块丢掉，不能截半个标签
        if (el.hasAttribute('contenteditable') && el.contentEditable === 'false') {
          if (count + 7 > max) {
            el.parentNode?.removeChild(el);
            clamped = true;
          } else {
            count += 7;
          }
        } else {
          walk(el);
        }
      }
    }
  };
  walk(box);
  return { html: box.innerHTML, text: box.textContent || '', clamped };
}
