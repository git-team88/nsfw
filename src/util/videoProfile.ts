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

// 可选版本 = f(普通 or NSFW 模式, 视频模式)
export function videoVersionsFor(mode: string, videoMode: string): VideoVersion[] {
  const isEdit = videoMode === 'videoModify' || videoMode === 'videoExtend';
  if (mode === 'unlimited') return isEdit ? ['enhanced', 'super'] : ['fast', 'enhanced', 'super'];
  return isEdit ? ['super'] : ['fast', 'super'];
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
  if (modelType === 'fast') return 'fast';
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
  },
  normal: {
    maxInputChars: 5000,
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
  },
};

export function profileOf(limitMode: string): VideoProfile {
  return VIDEO_PROFILES[limitMode] || VIDEO_PROFILES.normal;
}

// 页面初始状态：默认极速版 + 普通模式。分辨率 / 比例 / 时长这几个 ref 的初始值
// 必须从这里取，写死 720P / 30s 会和默认版本对不上（极速版是 480P / 15s）。
export const DEFAULT_VIDEO_VERSION: VideoVersion = 'fast';
export const DEFAULT_VIDEO_PROFILE: VideoProfile =
  profileOf(videoLimitModeOf(DEFAULT_VIDEO_VERSION, 'normal'));
