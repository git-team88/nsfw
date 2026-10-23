<template>
  <div class="submit-video" :class="isBatchPublish ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- 短剧本地批量上传：选文件 / 校验 / 并发上传 / 列表操作都在 LocalBatchUploader 里，这页只拿 localItems -->
      <LocalBatchUploader ref="uploaderRef" v-model="localItems" :max-files="CLIP_BATCH_MAX" :locked="isPublishing" />

      <!-- 选好文件后下面才出每个作品的封面 / 标题 / 描述，以及整批共用的设置；版式和单个短剧发布页（Clip.vue）一致 -->
      <div v-if="isBatchPublish" class="full-content">
        <!-- 每个作品一组：封面 + 标题/描述（视频本身的状态在上面的列表里） -->
        <div v-for="(item, index) in localItems" :key="item.uid" class="clip-batch-item">
          <div class="clip-batch-item-head">
            <span class="clip-batch-item-no">{{ t('submit.video.clipBatchItemLabel', { n: index + 1 }) }}</span>
            <span class="clip-batch-item-name" :title="item.name">{{ item.name }}</span>
          </div>

          <!-- Cover Image -->
          <div class="section">
            <div class="form-label-box">
              <span><b>*</b>{{ t('submit.coverLabel') }}</span>
            </div>
            <div class="cover-row">
              <div class="cover-upload">
                <img v-if="coverOf(item)" :src="processImageUrl(coverOf(item))" alt="" class="cover-preview" />
                <div v-else-if="coverPending(item)" class="cover-placeholder cover-generating">
                  <span class="cover-spinner"></span>
                  <span>{{ t('submit.video.clipCoverGenerating') }}</span>
                </div>
                <div v-else class="cover-placeholder">
                  <img src="@/assets/images/user/upload.png" alt="" />
                  <span>{{ t('collection.uploadCover') }}</span>
                </div>
              </div>
              <button class="set-cover-btn" :disabled="item.status !== 'success' || isPublishing" @click="openCoverModal(item)">{{ t('submit.image.setting') }}</button>
            </div>
          </div>

          <!-- Title + Description -->
          <div class="content-section">
            <div class="form-item">
              <div class="caption-container">
                <div class="label-row">
                  <label class="form-label">{{ t('submit.titleLabel') }}</label>
                  <span class="char-count">{{ item.title.length }}/{{ TITLE_MAX }}</span>
                </div>
                <div class="title-input-wrap">
                  <input
                    v-model="item.title"
                    class="title-input"
                    type="text"
                    :maxlength="TITLE_MAX"
                    :placeholder="t('submit.titlePlaceholder')"
                  />
                </div>
              </div>
            </div>

            <div class="form-item">
              <div class="caption-container">
                <div class="label-row">
                  <label class="form-label">{{ t('submit.descriptionLabel') }}</label>
                  <span class="char-count">{{ item.desc.length }}/{{ DESC_MAX }}</span>
                </div>
                <CaptionEditor
                  v-model="item.desc"
                  :max-length="DESC_MAX"
                  :placeholder="t('submit.descriptionPlaceholder')"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 敏感内容 / 语言 / 可见范围：整批共用，和单个短剧发布页同一块 -->
        <div class="content-section meta-section">
          <div class="inline-perm-row" v-if="contentSwitch.showSensitiveToggle">
            <div class="perm-group">
              <span class="perm-label">{{ t('submit.contentSettings') }}</span>
              <div class="perm-options">
                <div
                  class="perm-option"
                  :class="{ active: batchContent === opt.key }"
                  v-for="opt in contentOptions"
                  :key="opt.key"
                  @click="batchContent = opt.key"
                >
                  <img :src="batchContent === opt.key ? selectActive : select" alt="" />
                  <span>{{ t(opt.labelKey) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="inline-perm-row">
            <div class="perm-group">
              <span class="perm-label">{{ t('submit.language') }}</span>
              <div class="lang-dropdown" :class="{ open: langDropdownOpen }" ref="langDropdownRef">
                <div class="lang-dropdown-trigger" @click.stop="langDropdownOpen = !langDropdownOpen">
                  <span>{{ currentLangLabel }}</span>
                  <svg class="lang-arrow" :class="{ rotated: langDropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div class="lang-dropdown-menu" v-if="langDropdownOpen">
                  <div
                    class="lang-dropdown-item"
                    v-for="opt in langOptions"
                    :key="opt.key"
                    :class="{ active: batchLanguage === opt.key }"
                    @click="batchLanguage = opt.key; langDropdownOpen = false"
                  >{{ t(opt.labelKey) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="inline-perm-row">
            <div class="perm-group">
              <span class="perm-label">{{ t('submit.permission') }}</span>
              <div class="perm-options">
                <div
                  class="perm-option"
                  :class="{ active: batchPermission === opt.key }"
                  v-for="opt in permOptions"
                  :key="opt.key"
                  @click="handlePermissionChange(opt.key)"
                >
                  <img :src="batchPermission === opt.key ? selectActive : select" alt="" />
                  <span>{{ t(opt.labelKey) }}</span><template v-if="opt.key == 'partial'"><span class="revenue-hint">（{{ t('submit.revenueShare') }}<svg class="revenue-info-icon" @click.stop="showRevenueInfo = true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>）</span></template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Publish button -->
        <div class="submit-btn-wrap">
          <button class="submit-btn" :disabled="isPublishing || isWaitingCovers" @click="onBatchPublish">{{ isPublishing || isWaitingCovers ? t('submit.count') : t('submit.submit') }}</button>
          <div class="agreement-row">
            <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
              <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
              <img v-else src="@/assets/images/register/check.png" alt="" />
            </div>
            <span class="agreement-text"
              >{{ t("submit.agree") }}<span class="terms-text">{{ t("submit.terms") }}</span></span
            >
          </div>
        </div>
      </div>
    </div>

    <ConfirmLeaveModal :show="isShowConfirm" @confirm="confirmLeave" @cancel="cancelLeave" />

    <!-- Community Convention Modal -->
    <CommunityConventionModal
      :visible="showConventionModal"
      @cancel="showConventionModal = false"
      @confirm="confirmConvention"
    />

    <!-- 选「订阅用户可见」但还没设订阅价：引导设置（和单个短剧发布页一致） -->
    <SubscriptionPriceModal
      :visible="showSubscriptionModal"
      @cancel="closeSubscriptionModal"
      @saved="onSubscriptionSaved"
    />
    <TextInfoModal :visible="showRevenueInfo" :text="t('user.subscription.tip')" @close="showRevenueInfo = false" />

    <!-- 封面弹窗：按当前在编辑的那个视频抽帧 / 上传 -->
    <SetCoverModal
      v-model:visible="showCoverModal"
      :video-file="coverEditingItem?.file || null"
      :video-url="coverEditingItem?.url || ''"
      :cover-url="coverEditingItem ? coverOf(coverEditingItem) : ''"
      :extract-all-frames="true"
      @confirm="onCoverConfirmed"
    />

    <!-- Batch Publish Progress Dialog -->
    <BatchPublishProgressDialog
      :visible="showBatchPublishProgress"
      :chapters="batchPublishChapterStatuses"
      item-label-key="submit.video.clipBatchItemLabel"
      @close="showBatchPublishProgress = false"
      @complete="handleBatchPublishComplete"
    />

    <!-- Batch Publish Fail Dialog -->
    <BatchPublishFailDialog
      :visible="showBatchPublishFail"
      :chapters="batchPublishFailChapters"
      :failed-chapter="batchPublishFailedChapter"
      item-label-key="submit.video.clipBatchItemLabel"
      fail-message-key="submit.video.clipBatchFailMessage"
      @close="showBatchPublishFail = false"
      @exit="handleBatchPublishExit"
      @retry="handleBatchPublishRetry"
    />
  </div>
</template>

<script setup lang="ts" name="PublishClipBatch">
// 短剧本地批量上传发布页（/publish/clip-batch）。
// 和漫剧批量页（VideoBatch.vue）同一套：LocalBatchUploader 负责选文件 / 上传，这页负责
// 整批设置（敏感内容 / 语言 / 可见范围）、每个作品的标题 / 描述 / 封面，以及逐个调 post/addPost。
// 短剧没有合集，payload 和单个短剧发布页（Clip.vue）一致：type 5 + language + duration。
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import SubscriptionPriceModal from "@/components/SubscriptionPriceModal.vue";
import TextInfoModal from "@/components/TextInfoModal.vue";
import SetCoverModal from "@/components/SetCoverModal.vue";
import BatchPublishProgressDialog from "@/components/BatchPublishProgressDialog.vue";
import BatchPublishFailDialog from "@/components/BatchPublishFailDialog.vue";
import LocalBatchUploader, { type LocalItem } from "@/components/LocalBatchUploader.vue";
import CaptionEditor from "@/components/CaptionEditor.vue";
import api from "@/api/index";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import router from "@/router";
import { processImageUrl, apiErrorMessage } from "@/util/utils";
import { useContentSwitchStore } from "@/stores/contentSwitch";
import { baseUrl } from "@/util/config";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();

/** 一次最多传几个 */
const CLIP_BATCH_MAX = 20;
const TITLE_MAX = 60;
const DESC_MAX = 4000;

const headerRef = ref<InstanceType<typeof Header> | null>(null);
const uid = localStorage.getItem("uid") || "";

// ============================== 文件列表 ==============================
const localItems = ref<LocalItem[]>([]);
const uploaderRef = ref<InstanceType<typeof LocalBatchUploader> | null>(null);
const isPublishing = ref(false);

const isBatchPublish = computed(() => localItems.value.length > 0);
const allUploaded = computed(() => localItems.value.length > 0 && localItems.value.every(i => i.status === "success"));

// ============================== 整批设置 ==============================
const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc", ko: "ko", th: "th" }[locale.value] || "en");
const batchContent = ref<"yes" | "no">("no");
const batchLanguage = ref(defaultLang);
const batchPermission = ref<"public" | "partial">("public");
const agreeTerms = ref(true);
const showConventionModal = ref(false);
const showRevenueInfo = ref(false);

// 语言下拉（和 Clip.vue 一样）
const langDropdownOpen = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);
const currentLangLabel = computed(() => t(langOptions.find(o => o.key === batchLanguage.value)?.labelKey || "submit.langEn"));
function handleClickOutside(e: MouseEvent) {
  if (langDropdownRef.value && !langDropdownRef.value.contains(e.target as Node)) langDropdownOpen.value = false;
}

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
];
const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
] as const;
const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
  { key: "ko", labelKey: "submit.langKo" },
  { key: "th", labelKey: "submit.langTh" },
];

// 和 Clip.vue 一致：中国地区降级照 1 传；mode 0 不显示敏感勾选（本地上传没有生成模式可推导，按非敏感）；2 强制敏感；1 由用户勾
const contentSwitch = useContentSwitchStore();
const computedIsNsfw = computed(() => {
  if (contentSwitch.nsfwDowngraded) return 1;
  if (contentSwitch.mode === 0) return 0;
  if (contentSwitch.mode === 2) return 1;
  return batchContent.value === "yes" ? 1 : 0;
});

// ---- 「订阅用户可见」要先设过订阅价（和 Clip.vue 一样的流程） ----
const hasActiveSubscription = ref(false);
const showSubscriptionModal = ref(false);
let pendingSubscriptionAction: (() => void) | null = null;
let checkingSubscription = false;

async function checkSubscriptionStatus(notifyError = false): Promise<"active" | "inactive" | "error"> {
  try {
    const data = (await api.getSubscription()) as any;
    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = !!(subscription && subscription.plan && parseFloat(subscription.plan.price) > 0);
      return hasActiveSubscription.value ? "active" : "inactive";
    }
    if (notifyError) toast(apiErrorMessage(data));
  } catch (error) {
    console.error("Subscription check error:", error);
    hasActiveSubscription.value = false;
    if (notifyError) toast(t("fail"));
  }
  return "error";
}

async function ensureSubscriptionOrPrompt(action: () => void): Promise<boolean> {
  if (hasActiveSubscription.value) return true;
  if (checkingSubscription) return false;
  checkingSubscription = true;
  let result: "active" | "inactive" | "error";
  try {
    result = await checkSubscriptionStatus(true);
  } finally {
    checkingSubscription = false;
  }
  if (result === "active") return true;
  if (result === "inactive") {
    pendingSubscriptionAction = action;
    showSubscriptionModal.value = true;
  }
  return false;
}

async function handlePermissionChange(permission: string) {
  if (permission === "partial" && !(await ensureSubscriptionOrPrompt(() => handlePermissionChange(permission)))) {
    return;
  }
  batchPermission.value = permission as "public" | "partial";
}

function closeSubscriptionModal() {
  showSubscriptionModal.value = false;
  pendingSubscriptionAction = null;
}

function onSubscriptionSaved(planId: string) {
  showSubscriptionModal.value = false;
  const action = pendingSubscriptionAction;
  pendingSubscriptionAction = null;
  if (planId && planId != "0") {
    hasActiveSubscription.value = true;
    action?.();
  }
}

function confirmConvention() {
  agreeTerms.value = true;
  showConventionModal.value = false;
}

// ============================== 封面 ==============================
// 每个视频一张封面，按 uid 存；上传成功后自动抽第一帧并传到图床当默认封面，用户可以在弹窗里改。
const covers = ref<Record<number, string>>({});
const coverGenerating = ref<Record<number, boolean>>({});
// 每张封面对应的是哪个文件：「重新上传」换了视频但 uid 不变，靠这个识别出封面已经过期
const coverFiles = new Map<number, File>();
// 正在抽帧 / 上传的默认封面任务，按 uid 存；点发布时如果还有没完成的，先等它们
const coverTasks = new Map<number, Promise<void>>();
const isWaitingCovers = ref(false);
const showCoverModal = ref(false);
const coverEditingItem = ref<LocalItem | null>(null);

function coverOf(item: LocalItem): string {
  return covers.value[item.uid] || "";
}
function coverPending(item: LocalItem): boolean {
  return !!coverGenerating.value[item.uid];
}

function openCoverModal(item: LocalItem) {
  coverEditingItem.value = item;
  showCoverModal.value = true;
}

function onCoverConfirmed(url: string) {
  if (coverEditingItem.value && url) {
    covers.value[coverEditingItem.value.uid] = url;
    coverFiles.set(coverEditingItem.value.uid, coverEditingItem.value.file);
  }
}

// 列表变化：新上传成功且还没封面的，去抽帧；被删掉的，清掉它的封面
watch(
  () => localItems.value.map(i => `${i.uid}:${i.status}`).join(","),
  () => {
    const alive = new Set(localItems.value.map(i => i.uid));
    for (const key of Object.keys(covers.value)) {
      if (!alive.has(Number(key))) { delete covers.value[Number(key)]; coverFiles.delete(Number(key)); }
    }
    for (const item of localItems.value) {
      // 「重新上传」换了视频：旧封面是上一个视频的，丢掉，等新视频传成功再抽帧
      if (covers.value[item.uid] && coverFiles.get(item.uid) !== item.file) {
        delete covers.value[item.uid];
        coverFiles.delete(item.uid);
      }
      if (item.status === "success" && !covers.value[item.uid] && !coverGenerating.value[item.uid]) {
        coverTasks.set(item.uid, generateDefaultCover(item).finally(() => coverTasks.delete(item.uid)));
      }
    }
  },
);

async function generateDefaultCover(item: LocalItem) {
  coverGenerating.value[item.uid] = true;
  try {
    const dataUrl = await extractFirstFrame(item.file);
    if (!dataUrl) return;
    const url = await uploadCoverDataUrl(dataUrl);
    // 抽帧期间用户可能已经手动设了封面、删了文件或换了视频（uid 不变但 file 变了）
    const current = localItems.value.find(i => i.uid === item.uid);
    if (url && !covers.value[item.uid] && current && current.file === item.file) {
      covers.value[item.uid] = url;
      coverFiles.set(item.uid, item.file);
    }
  } catch (e) {
    console.warn("[clip-batch] 默认封面生成失败", e);
  } finally {
    delete coverGenerating.value[item.uid];
  }
}

/** 取视频第一帧，按封面 3:4 居中裁剪，返回 jpeg dataURL；失败返回空串 */
function extractFirstFrame(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const done = (v: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
      resolve(v);
    };
    const timer = window.setTimeout(() => done(""), 15000);
    video.onerror = () => done("");
    video.onloadedmetadata = () => {
      // 0 秒常常是黑场，往后挪一点
      video.currentTime = Math.min(0.5, Math.max(0, (video.duration || 1) / 10));
    };
    video.onseeked = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return done("");
        // 3:4 居中裁剪，最长边不超过 1200
        const ratio = 3 / 4;
        let sw = vw, sh = vh;
        if (vw / vh > ratio) sw = Math.round(vh * ratio);
        else sh = Math.round(vw / ratio);
        const sx = Math.round((vw - sw) / 2);
        const sy = Math.round((vh - sh) / 2);
        const scale = Math.min(1, 1200 / sh);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return done("");
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        done("");
      }
    };
    video.src = objectUrl;
  });
}

/** 和 SetCoverModal 一样走 user/uploadImage，拿到图床地址 */
async function uploadCoverDataUrl(dataUrl: string): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) return "";
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", file);
  const authHeaders = window.AntiCrawler.generateAuthParams(token);
  const res = await fetch(baseUrl + "user/uploadImage", {
    method: "POST",
    headers: { token, Platform: "web", siteid: "1", ...authHeaders },
    body: formData,
  });
  const data = await res.json();
  if (data.code === 0 || data.code === 200) return data.data?.url || "";
  return "";
}

// ============================== 发布 ==============================
const showBatchPublishProgress = ref(false);
const showBatchPublishFail = ref(false);
const batchPublishChapterStatuses = ref<{ uid: number; chapter: number; status: "success" | "publishing" | "waiting" | "fail" | "unpublished" }[]>([]);

// 按当前列表重建进度：同一个文件（uid）上一轮已发成功的保留 success，关掉弹窗后增删 / 排序也不会错位
function rebuildBatchStatuses() {
  const done = new Set(batchPublishChapterStatuses.value.filter(c => c.status === "success").map(c => c.uid));
  batchPublishChapterStatuses.value = localItems.value.map((item, i) => ({
    uid: item.uid,
    chapter: i + 1,
    status: done.has(item.uid) ? "success" as const : "waiting" as const
  }));
}
const batchPublishFailChapters = ref<{ chapter: number; status: "success" | "fail" | "unpublished" }[]>([]);
const batchPublishFailedChapter = ref<number | undefined>(undefined);

function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

async function onBatchPublish() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }
  if (localItems.value.length === 0) {
    toast(t("submit.video.batchNoFile"));
    return;
  }
  if (!allUploaded.value) {
    toast(t("submit.video.batchNotFinished"));
    return;
  }
  // 视频刚传完、默认封面还在抽帧上传：等它们做完再校验，按钮期间置灰
  if (coverTasks.size > 0) {
    isWaitingCovers.value = true;
    try {
      await Promise.all(Array.from(coverTasks.values()));
    } finally {
      isWaitingCovers.value = false;
    }
  }
  const missingCover = localItems.value.findIndex(i => !coverOf(i));
  if (missingCover >= 0) {
    toast(`${t("submit.video.clipBatchItemLabel", { n: missingCover + 1 })}：${t("submit.video.toastSetCover")}`);
    return;
  }
  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  if (isPublishing.value) return;
  rebuildBatchStatuses();
  showBatchPublishProgress.value = true;

  await runBatchPublishLoop();
}

async function runBatchPublishLoop() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  isPublishing.value = true;
  const items = localItems.value.slice();

  for (let i = 0; i < items.length; i++) {
    // 跳过已发布成功的，仅重试失败 / 未发布的
    if (batchPublishChapterStatuses.value[i]?.status === "success") continue;

    const item = items[i];
    batchPublishChapterStatuses.value[i].status = "publishing";

    try {
      const title = (item.title.trim() || fileBaseName(item.name)).substring(0, TITLE_MAX);

      // 和 Clip.vue 单个发布的 payload 一致
      const payload: any = {
        type: 5,
        title,
        cover: coverOf(item),
        content: item.desc.trim().substring(0, DESC_MAX),
        is_nsfw: computedIsNsfw.value,
        access_rights: batchPermission.value === "partial" ? 2 : 1,
        video_url: item.url,
        language: batchLanguage.value,
        duration: item.duration || 0,
      };

      const headers = new Headers();
      const { ts, sign } = window.AntiCrawler.generateAuthParams(token);
      headers.append("token", token);
      headers.append("ts", ts);
      headers.append("sign", sign);
      headers.append("Content-Type", "application/json");
      headers.append("Platform", "web");
      headers.append("siteid", "1");

      const response = await fetch(`${baseUrl}post/addPostFive`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const res = JSON.parse(await response.text());

      if (res.code == 0 || res.code == 200) {
        batchPublishChapterStatuses.value[i].status = "success";
      } else {
        markFailFrom(i);
        break;
      }
    } catch (error) {
      console.error(`Error publishing local clip ${i + 1}:`, error);
      markFailFrom(i);
      break;
    }
  }

  isPublishing.value = false;
  handleBatchPublishComplete();
}

function markFailFrom(i: number) {
  batchPublishChapterStatuses.value[i].status = "fail";
  for (let j = i + 1; j < batchPublishChapterStatuses.value.length; j++) {
    if (batchPublishChapterStatuses.value[j].status !== "success") {
      batchPublishChapterStatuses.value[j].status = "unpublished";
    }
  }
}

function handleBatchPublishComplete() {
  showBatchPublishProgress.value = false;
  const successCount = batchPublishChapterStatuses.value.filter(c => c.status === "success").length;
  const totalCount = batchPublishChapterStatuses.value.length;
  if (successCount === totalCount) {
    toast(t("novel.batchPublish.allPublishSuccess", { count: totalCount, unit: t("submit.video.clipUnit") }));
    // 全部发布成功后和单个短剧发布一样进成功页；「继续发布」回到本页
    router.push("/publish/success?type=clip-batch");
  } else {
    batchPublishFailChapters.value = batchPublishChapterStatuses.value.map(c => ({
      chapter: c.chapter,
      status: c.status as "success" | "fail" | "unpublished",
    }));
    batchPublishFailedChapter.value = batchPublishChapterStatuses.value.find(c => c.status === "fail")?.chapter;
    showBatchPublishFail.value = true;
  }
}

function handleBatchPublishExit() {
  showBatchPublishFail.value = false;
  router.push(`/user-home/${uid}?type=5`);
}

function handleBatchPublishRetry() {
  if (isPublishing.value) return;
  // 按当前列表重建：失败 / 未发布的回到等待，已成功的保留
  rebuildBatchStatuses();
  showBatchPublishFail.value = false;
  showBatchPublishProgress.value = true;
  runBatchPublishLoop();
}

// ============================== 离开保护 ==============================
const isShowConfirm = ref(false);

function warnBeforeUnload(e: BeforeUnloadEvent) {
  const busy = isPublishing.value || localItems.value.some(i => i.status === "uploading" || i.status === "waiting");
  if (!busy) return;
  e.preventDefault();
  e.returnValue = "";
}

function goBack() {
  if (localItems.value.length > 0) {
    isShowConfirm.value = true;
    return;
  }
  router.go(-1);
}
function confirmLeave() {
  router.go(-1);
}
function cancelLeave() {
  isShowConfirm.value = false;
}

// 文件拖到没有拖放处理的地方时，别让浏览器把文件直接打开
function blockUnhandledFileDrop(e: DragEvent) {
  if (e.defaultPrevented) return;
  if (!e.dataTransfer?.types?.includes("Files")) return;
  e.preventDefault();
  if (e.type === "dragover") e.dataTransfer.dropEffect = "none";
}

function handleUserInfoLoaded(_userInfo: any) {}

onMounted(async () => {
  window.addEventListener("beforeunload", warnBeforeUnload);
  document.addEventListener("dragover", blockUnhandledFileDrop);
  document.addEventListener("drop", blockUnhandledFileDrop);
  document.addEventListener("click", handleClickOutside);
  await contentSwitch.ensureLoaded();
  if (contentSwitch.mode === 2) batchContent.value = "yes";
  await checkSubscriptionStatus();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", warnBeforeUnload);
  document.removeEventListener("dragover", blockUnhandledFileDrop);
  document.removeEventListener("drop", blockUnhandledFileDrop);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
@use '@/scss/Clip.scss';
@use '@/scss/ClipBatch.scss';
</style>
