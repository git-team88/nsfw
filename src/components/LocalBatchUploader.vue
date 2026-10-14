<template>
  <!-- 本地批量上传：一次最多 maxFiles 个视频，列表顺序就是合集里的集数顺序 -->
  <div class="upload-tabs batch-local-upload">
    <div class="form-label-box">
      <span><b>*</b>{{ t("submit.video.videoLabel") }}</span>
      <span class="batch-file-count" v-if="items.length">{{ items.length }}/{{ maxFiles }}</span>
    </div>

    <!-- 还没选文件：和单个上传一样的上传框，支持多选 / 拖多个 -->
    <!-- 文件 input 不再铺满整块区域（原来那样会盖住下面的文件列表，点播放 / 上移全变成选文件），
         整个上传框点哪都能选文件靠这里的 @click -->
    <div v-if="items.length === 0" class="upload-area-box" @dragover.prevent @drop.prevent="onDropLocalFiles">
      <div class="upload-area" @click="pickLocalFiles">
        <div class="upload-info">
          <p>{{ t("submit.video.batchUploadCta", { max: maxFiles }) }}</p>
          <button class="btn" @click.stop="pickLocalFiles">{{ t("submit.video.uploadBtn") }}</button>
        </div>
        <div class="upload-spec">
          <div class="upload-spec-item">
            <span class="upload-spec-title">{{ t("submit.video.specFormat") }}</span>
            <span>{{ t("submit.video.formatInfo") }}</span>
          </div>
          <div class="upload-spec-item">
            <span class="upload-spec-title">{{ t("submit.video.specSize") }}</span>
            <div class="upload-spec-info">
              <span>{{ t("submit.video.sizeInfo1") }}</span>
              <span>|</span>
              <span>{{ t("submit.video.sizeInfo2") }}</span>
            </div>
          </div>
          <div class="upload-spec-item">
            <span class="upload-spec-title">{{ t("submit.video.specResolution") }}</span>
            <span>{{ t("submit.video.resolutionInfo") }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 已选文件列表：每个文件自己的进度 / 状态，可上移下移、删除、失败重试 -->
    <div v-else class="batch-file-list" @dragover.prevent @drop.prevent="onDropLocalFiles">
      <div v-for="(item, index) in items" :key="item.uid" class="batch-file-item" :class="item.status">
        <span class="batch-file-index">{{ index + 1 }}</span>
        <div class="batch-file-main">
          <div class="batch-file-head">
            <span class="batch-file-name" :title="item.name">{{ item.name }}</span>
            <span class="batch-file-meta">{{ item.size }}MB · {{ item.duration }}s</span>
          </div>
          <div class="status-progress-bar">
            <div
              class="progress-fill"
              :class="{ success: item.status === 'success', error: item.status === 'fail', uploading: item.status === 'uploading' }"
              :style="{ width: item.progress + '%' }"
            ></div>
          </div>
          <div class="batch-file-foot">
            <span class="batch-file-status" :class="item.status">{{ localItemStatusText(item) }}</span>
            <!-- 传完（成功 / 失败）才出操作；上传中和排队中不显示 -->
            <div class="batch-file-actions" v-if="item.status === 'success' || item.status === 'fail'">
              <span class="action-link play" v-if="item.status === 'success'" @click="previewLocalItem(item)">{{ t('submit.video.playBtn') }}</span>
              <span class="action-link retry" v-if="item.status === 'fail'" @click="retryLocalItem(item)">{{ t('submit.video.batchRetry') }}</span>
              <span class="action-link reupload" @click="pickReplaceFile(item)">{{ t('submit.video.reuploadBtn') }}</span>
              <span class="action-link move" :class="{ disabled: index === 0 }" @click="moveLocalItem(index, -1)">{{ t('submit.video.batchMoveUp') }}</span>
              <span class="action-link move" :class="{ disabled: index === items.length - 1 }" @click="moveLocalItem(index, 1)">{{ t('submit.video.batchMoveDown') }}</span>
              <span class="action-link remove" @click="removeLocalItem(item)">{{ t('submit.video.batchRemove') }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="batch-file-add" v-if="canAddMore">
        <button class="btn" @click="pickLocalFiles">{{ t('submit.video.batchAddMore') }}</button>
        <span class="batch-file-add-tip">{{ t('submit.video.batchUploadCta', { max: maxFiles }) }}</span>
      </div>
    </div>

    <input
      ref="localInputRef"
      type="file"
      accept="video/mp4,video/quicktime"
      multiple
      class="hidden-file"
      title=""
      @change="onLocalFilesPicked"
    />
    <!-- 「重新上传」：单选，换掉列表里某一个文件 -->
    <input
      ref="replaceInputRef"
      type="file"
      accept="video/mp4,video/quicktime"
      class="hidden-file"
      title=""
      @change="onReplaceFilePicked"
    />

    <!-- 播放：传完了放线上那份，没传完放本地 blob -->
    <PreviewModal
      :visible="showPreviewModal"
      :videoUrl="videoPreviewUrl"
      @close="closePreview"
    />
    <!-- 上传进度（上传期间遮罩整页，全部有结果后自动关） -->
    <BatchUploadProgressDialog :visible="isUploadingAny" :items="items" />
  </div>
</template>

<script lang="ts">
export type LocalItemStatus = 'waiting' | 'uploading' | 'success' | 'fail';
export interface LocalItem {
  uid: number;
  file: File;
  name: string;
  /** 发布用的标题，默认文件名去掉扩展名 */
  title: string;
  /** 发布用的描述，可空 */
  desc: string;
  size: number;
  duration: number;
  status: LocalItemStatus;
  progress: number;
  url: string;
  errorMsg: string;
  localSessionId: string;
}
</script>

<script setup lang="ts">
// 本地批量上传：选文件 / 校验 / 并发上传 / 列表操作（上移下移、删除、重传、播放）。
// 只负责把文件变成「可发布的列表」，合集、权限、发布都在页面里。
// 一次最多 maxFiles 个；同时只传 UPLOAD_CONCURRENCY 个，传完一个补一个；每个文件各自的进度 / 状态。
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { uploadVideoFile, PartUploadError } from "@/util/uploadVideo";
import PreviewModal from "@/components/PreviewModal.vue";
import BatchUploadProgressDialog from "@/components/BatchUploadProgressDialog.vue";

const props = withDefaults(defineProps<{
  /** 一次最多几个文件 */
  maxFiles?: number;
  /** 发布中：锁住删除 / 排序 / 重传 */
  locked?: boolean;
}>(), { maxFiles: 20, locked: false });

const items = defineModel<LocalItem[]>({ required: true });

const { t, locale } = useI18n();

function getI18nMsg(res: any) {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: 'msg_cn', jp: 'msg_jp', tc: 'msg_tc' };
  const key = msgMap[lang];
  return (key && res?.[key]) || res?.msg || t('fail');
}

const ALLOWED_EXTENSIONS = ['mp4', 'mov'];

function validateVideoFormat(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    toast(t('submit.video.formatError'));
    return false;
  }
  return true;
}

const showPreviewModal = ref(false);
const videoPreviewUrl = ref("");

const isUploadingAny = computed(() => items.value.some(i => i.status === 'uploading' || i.status === 'waiting'));

const UPLOAD_CONCURRENCY = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

const localInputRef = ref<HTMLInputElement | null>(null);
let localItemSeq = 0;
let activeUploads = 0;
const canAddMore = computed(() => items.value.length < props.maxFiles);
function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function localItemStatusText(item: LocalItem): string {
  switch (item.status) {
    case 'uploading': return `${t('submit.video.uploading')} ${item.progress}%`;
    case 'success': return t('submit.video.uploadSuccess');
    case 'fail': return item.errorMsg || t('submit.video.uploadFailed');
    default: return t('submit.video.batchWaiting');
  }
}

/** 读时长 / 校验文件能不能解码，和单个上传的判法一致 */
function readVideoMetadata(file: File): Promise<{ ok: true; duration: number } | { ok: false; reason: 'duration' | 'timeout' | 'corrupted' }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    let settled = false;
    const done = (r: { ok: true; duration: number } | { ok: false; reason: 'duration' | 'timeout' | 'corrupted' }) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(video.src);
      resolve(r);
    };
    video.onloadedmetadata = () => {
      if (video.duration > 3600) return done({ ok: false, reason: 'duration' });
      if (video.duration === 0 || isNaN(video.duration) || video.videoWidth === 0) return done({ ok: false, reason: 'corrupted' });
      done({ ok: true, duration: Math.round(video.duration) });
    };
    video.onerror = () => done({ ok: false, reason: 'corrupted' });
    setTimeout(() => done({ ok: false, reason: 'timeout' }), 15000);
  });
}

function pickLocalFiles() {
  localInputRef.value?.click();
}

async function onLocalFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  await addLocalFiles(files);
}

async function onDropLocalFiles(e: DragEvent) {
  await addLocalFiles(Array.from(e.dataTransfer?.files || []));
}

async function addLocalFiles(files: File[]) {
  if (!files.length) return;
  const room = props.maxFiles - items.value.length;
  if (room <= 0) {
    toast(t('submit.video.batchLimit', { max: props.maxFiles }));
    return;
  }
  let list = files;
  if (files.length > room) {
    toast(t('submit.video.batchLimit', { max: props.maxFiles }));
    list = files.slice(0, room);
  }
  // 不合格的跳过、其余照常；原因先攒着，最后合成一条提示，不一个文件弹一次
  const skipped: Record<SkipReason, number> = { format: 0, size: 0, duration: 0, timeout: 0, corrupted: 0 };
  for (const file of list) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) { skipped.format++; continue; }
    if (file.size > MAX_FILE_SIZE) { skipped.size++; continue; }
    const meta = await readVideoMetadata(file);
    if (!meta.ok) { skipped[meta.reason]++; continue; }
    items.value.push({
      uid: ++localItemSeq,
      file,
      name: file.name,
      title: fileBaseName(file.name).substring(0, 60),
      desc: '',
      size: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
      duration: meta.duration,
      status: 'waiting',
      progress: 0,
      url: '',
      errorMsg: '',
      localSessionId: '',
    });
  }
  toastSkipped(skipped);
  pumpUploads();
}

type SkipReason = 'format' | 'size' | 'duration' | 'timeout' | 'corrupted';
const SKIP_REASON_KEY: Record<SkipReason, string> = {
  format: 'submit.video.batchSkipFormat',
  size: 'submit.video.batchSkipSize',
  duration: 'submit.video.batchSkipDuration',
  timeout: 'submit.video.batchSkipTimeout',
  corrupted: 'submit.video.batchSkipCorrupted',
};

/** 「已跳过 N 个文件：格式不支持 ×1、超过 5GB ×2」，一批只弹一次 */
function toastSkipped(skipped: Record<SkipReason, number>) {
  const total = Object.values(skipped).reduce((a, b) => a + b, 0);
  if (!total) return;
  const reasons = (Object.keys(skipped) as SkipReason[])
    .filter(k => skipped[k] > 0)
    .map(k => `${t(SKIP_REASON_KEY[k])} ×${skipped[k]}`)
    .join('、');
  toast(t('submit.video.batchSkipped', { count: total, reasons }));
}

/** 补位：没到并发上限就从等待队列里拿下一个开始传 */
function pumpUploads() {
  while (activeUploads < UPLOAD_CONCURRENCY) {
    const next = items.value.find(i => i.status === 'waiting');
    if (!next) break;
    uploadLocalItem(next);
  }
}

async function uploadLocalItem(item: LocalItem) {
  activeUploads++;
  item.status = 'uploading';
  item.progress = 0;
  item.errorMsg = '';
  try {
    item.url = await uploadVideoFile(item.file, (percent) => {
      item.progress = percent;
    });
    item.progress = 100;
    item.status = 'success';
  } catch (error: any) {
    item.status = 'fail';
    item.errorMsg = error instanceof PartUploadError ? getI18nMsg(error.payload) : t('fail');
  } finally {
    activeUploads--;
    pumpUploads();
  }
}

// 「重新上传」：换掉列表里某一个文件，位置、序号不变；换完按新文件重走校验和上传
const replaceInputRef = ref<HTMLInputElement | null>(null);
let replaceTargetUid = 0;

function pickReplaceFile(item: LocalItem) {
  if (props.locked) return;
  replaceTargetUid = item.uid;
  replaceInputRef.value?.click();
}

async function onReplaceFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  const item = items.value.find(i => i.uid === replaceTargetUid);
  replaceTargetUid = 0;
  if (!file || !item) return;
  if (!validateVideoFormat(file)) return;
  if (file.size > MAX_FILE_SIZE) {
    toast(t('submit.video.sizeError'));
    return;
  }
  const meta = await readVideoMetadata(file);
  if (!meta.ok) {
    toast(t(
      meta.reason === 'duration'
        ? 'submit.video.durationLimit'
        : meta.reason === 'timeout'
          ? 'submit.video.readTimeoutError'
          : 'submit.video.corruptedError',
    ));
    return;
  }
  // 标题没改过（还是旧文件名）就跟着换成新文件名，改过的保留
  const untouched = item.title === fileBaseName(item.name).substring(0, 60);
  item.file = file;
  item.name = file.name;
  if (untouched) item.title = fileBaseName(file.name).substring(0, 60);
  item.size = parseFloat((file.size / (1024 * 1024)).toFixed(1));
  item.duration = meta.duration;
  item.status = 'waiting';
  item.progress = 0;
  item.url = '';
  item.errorMsg = '';
  pumpUploads();
}

function retryLocalItem(item: LocalItem) {
  if (item.status !== 'fail') return;
  item.status = 'waiting';
  item.progress = 0;
  pumpUploads();
}

function removeLocalItem(item: LocalItem) {
  if (props.locked) return;
  const idx = items.value.indexOf(item);
  if (idx !== -1) items.value.splice(idx, 1);
  // 正在传的那份删了也拦不住分片请求，让它传完就是了，结果不会再写回列表
}

function moveLocalItem(index: number, delta: number) {
  if (props.locked) return;
  const target = index + delta;
  if (target < 0 || target >= items.value.length) return;
  const list = items.value;
  [list[index], list[target]] = [list[target], list[index]];
}

function previewLocalItem(item: LocalItem) {
  closePreview();
  // 传完了就放线上那份，验证真正入库的地址能不能播
  videoPreviewUrl.value = item.url || URL.createObjectURL(item.file);
  showPreviewModal.value = true;
}

/** 关预览。blob 地址不释放会一直把整个文件钉在内存里 */
function closePreview() {
  if (videoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoPreviewUrl.value);
  }
  videoPreviewUrl.value = '';
  showPreviewModal.value = false;
}

defineExpose({ addFiles: addLocalFiles });
</script>

<style lang="scss" scoped>
@use '@/scss/LocalBatchUploader.scss';
</style>
