<template>
  <div class="submit-image" :class="imageUrls.length > 0 ? 'on' : ''">
    <Header :cur="-1"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- Top Nav Tabs -->
      <div class="main-tabs">
        <div
          class="main-tab"
          :class="{ active: tabIndex == index }"
          v-for="(tab, index) in tabList"
          :key="index"
          @click="changeTab(tab, index)"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Loading Detail State -->
      <div v-if="isLoadingDetail" class="loading-detail-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">{{ t('loading') }}</span>
      </div>

      <!-- Upload Method Section (hidden once images are chosen) -->
      <div class="upload-tabs" v-else-if="!showFullContent">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.image.imageLabel") }}</span>
        </div>

        <!-- Upload Method Tabs -->
        <div class="upload-options">
          <div
            v-for="option in uploadOptions"
            :key="option.id"
            class="option-item"
            :class="{ active: uploadOption === option.value }"
            @click="uploadOption = option.value"
          >
            <span class="radio-dot">
              <span class="radio-inner"></span>
            </span>
            <span class="option-label">{{ t(option.label) }}</span>
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="uploadOption === 'history'" class="history-list">
          <!-- Loading State -->
          <div v-if="isLoadingProjects" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('loading') }}</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="projects.length === 0" class="empty-state">
            <div class="empty-icon">
              <img src="@/assets/images/publish/empty.png" alt="No data" />
            </div>
            <div class="empty-text">
              {{ t('emptyState.noProjects') }}
              <span class="empty-link" @click="goToHome">{{ t('emptyState.generate') }}</span>
            </div>
          </div>

          <div v-else>
            <!-- Project Grid -->
            <div class="project-grid">
              <div
                v-for="(project, index) in projects"
                :key="project.id"
                class="project-item"
                :class="{ selected: selectedProjectIds.includes(project.id) }"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
                @click="toggleProjectSelection(project)"
              >
                <img :src="processImageUrl(getProjectCover(project))" alt="" class="project-image" />
                <div class="view-icon" @click.stop="openImageView(project)">
                  <img src="@/assets/images/publish/view.png" alt="View" />
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <Pagination
              v-if="projects.length > 0 && totalProjects > pageSize"
              :total="totalProjects"
              :page-size="pageSize"
              v-model="currentPage"
              theme="pink"
            />

            <!-- Confirm Button -->
            <div class="confirm-section">
              <button class="confirm-btn" :disabled="selectedProjectIds.length === 0" @click="confirmSelectedProjects">
                {{ t('submit.cover.confirm') }}{{ selectedProjectIds.length > 0 ? ` (${selectedProjectIds.length}/12)` : '' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Local Upload Tab -->
        <!-- 拖放挂在外层带边框的框上：框内上下各有 40px 内边距，挂在里层 .upload-area 上时这两条区域接不到 -->
        <div v-else-if="uploadOption === 'local'" class="upload-area-box" @dragover.prevent="onDragOver" @drop.prevent="onDropImages">
          <div class="upload-area">
            <div class="upload-info">
              <p>{{ t("submit.image.uploadCta") }}</p>
              <button class="btn" @click="pickImages" :disabled="imageFiles.length >= 12">
                {{ t("submit.image.uploadBtn") }}
              </button>
            </div>
            <div class="upload-spec">
              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specFormat") }}</span>
                <span>{{ t("submit.image.formatInfo") }}</span>
              </div>

              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specSize") }}</span>
                <span>{{ t("submit.image.sizeInfo") }}</span>
              </div>

              <div class="upload-spec-item">
                <span class="upload-spec-title">{{ t("submit.image.specResolution") }}</span>
                <span>{{ t("submit.image.resolutionInfo") }}</span>
              </div>
            </div>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              title=""
              class="hidden-file"
              @click.stop
              @change="onImagesPicked"
            />
          </div>
        </div>
      </div>

      <!-- Image Preview Area -->
      <div class="preview-section" v-if="showFullContent && imageUrls.length > 0">
        <div class="form-label-box">
          <span><b>*</b>{{ t('submit.image.imageLabel') }}</span>
          <button v-if="imageUrls.length < 15" class="add-more-btn" @click="addMoreImages">{{ t('submit.image.add') }}</button>
          <input
            ref="addImagesInputRef"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            title=""
            class="hidden-file"
            @change="onAddImagesPicked"
          />
        </div>
        <div class="image-list-box">
          <!-- 按住拖动可以换顺序，第一张就是封面。
               key 用图片地址而不是下标：换位置时 Vue 只挪 DOM 节点，不会整排重建、图片重新加载；
               让位动画由 flipSiblings 手写（见下方脚本），不用 TransitionGroup -->
          <div class="image-list">
            <div
              v-for="(item, index) in imageItems"
              :key="item.key"
              class="image-item"
              :class="{ 'is-dragging': dragState.key === item.key }"
              :style="dragItemStyle(item.key)"
              :data-index="index"
              @pointerdown="onImagePointerDown($event, item.key)"
              @click.capture="onImageClickCapture"
              @dragstart.prevent
            >
              <img class="image" :src="processImageUrl(item.url)" alt="" draggable="false" />
              <div class="image-btn">
                <div class="reload">
                  <img
                    src="@/assets/images/publish/reload.png"
                    alt=""
                    @click.stop="reloadImage(index)"
                  />
                </div>
                <img
                  src="@/assets/images/publish/delete.png"
                  alt=""
                  @click="removeImage(index)"
                  v-if="imageUrls.length > 1"
                />
              </div>
            </div>
          </div>
        </div>

        <input
          ref="reuploadInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          class="hidden-file"
          style="display: none;"
          @change="onReuploadPicked"
        />

        <!-- Permission -->
        <div class="inline-perm-row">
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.permission') }}</span>
            <div class="perm-options">
              <div
                class="perm-option"
                :class="{ active: form.permission === opt.key }"
                v-for="opt in permOptions"
                :key="opt.key"
                @click="handlePermissionChange(opt.key)"
              >
                <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                <span>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Publish Form -->
      <div class="form-section" v-if="showFullContent">
        <!-- Title -->
        <div class="form-item">
          <div class="form-label-box">
            <span>{{ t('submit.titleLabel') }}</span>
            <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
          </div>
          <input
            type="text"
            class="form-input"
            v-model="form.title"
            :placeholder="t('submit.titlePlaceholder')"
            :maxlength="TITLE_MAX"
          />
        </div>

        <!-- Description -->
        <div class="form-item">
          <div class="form-label-box">
            <span>{{ t('submit.descriptionLabel') }}</span>
            <span class="char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
          </div>
          <div class="desc-input-wrap">
            <div
              ref="captionRef"
              class="description-content"
              contenteditable="true"
              :placeholder="t('submit.descriptionPlaceholder')"
              @input="handleCaptionInput"
              @keydown="handleCaptionKeydown"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
              @click="handleCaptionClick"
              @blur="onCaptionBlur"
              @paste="handlePaste"
            ></div>
            <div class="caption-actions-box">
              <div class="caption-actions">
                <button class="action-btn" @click="onActionBtnClick('#')">
                  #{{ t("submit.topic") }}
                </button>
                <button class="action-btn" @click="onActionBtnClick('@')">
                  @{{ t("submit.mention") }}
                </button>
              </div>
            </div>
          </div>

          <!-- Mention/Topic Dropdown -->
          <div
            v-if="showDropdown"
            class="mention-dropdown"
            :style="getDropdownStyle()"
          >
            <div class="dropdown-list">
              <div v-if="isDropdownLoading" class="dropdown-loading">
                <div class="loading-spinner"></div>
                <span>{{ t('loading') }}</span>
              </div>
              <template v-else>
                <div
                  v-for="item in dropdownItems"
                  :key="item.value"
                  class="dropdown-item"
                  @click="selectDropdownItem(item)"
                >
                  <div class="item-left">
                    <img v-if="dropdownType === '@'" :src="item.avatar" class="avatar" alt="" />
                    <span class="label">{{ item.label }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Content Settings -->
        <div class="inline-perm-row" v-if="contentSwitch.showSensitiveToggle">
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.contentSettings') }}</span>
            <div class="perm-options">
              <div
                class="perm-option"
                :class="{ active: form.content === opt.key }"
                v-for="opt in contentOptions"
                :key="opt.key"
                @click="form.content = opt.key"
              >
                <img :src="form.content === opt.key ? selectActive : select" alt="" />
                <span>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Language -->
        <div class="inline-perm-row">
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.language') }}</span>
            <div class="lang-dropdown" :class="{ open: langDropdownOpen, up: langDropdownUp }" ref="langDropdownRef">
              <div class="lang-dropdown-trigger" @click="toggleLangDropdown">
                <span>{{ currentLangLabel }}</span>
                <svg class="lang-arrow" :class="{ rotated: langDropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <div class="lang-dropdown-menu" v-if="langDropdownOpen">
                <div
                  class="lang-dropdown-item"
                  v-for="opt in langOptions"
                  :key="opt.key"
                  :class="{ active: form.language === opt.key }"
                  @click="form.language = opt.key; langDropdownOpen = false"
                >{{ t(opt.labelKey) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Publish Button -->
      <div class="submit-section" v-if="showFullContent">
        <button class="publish-btn" :disabled="isUploading" @click="onSubmit">
          {{ isUploading ? t('submit.publishing') : t('submit.submit') }}
        </button>
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

    <!-- Media Preview Modal -->
    <MediaPreviewModal
      v-model:visible="showPreviewMedia"
      :type="previewMediaType"
      :url="previewMediaUrl"
    />

    <!-- Subscription Prompt Modal -->
    <SubscriptionPromptModal
      :visible="showSubscriptionModal"
      @cancel="closeSubscriptionModal"
      @go-to-settings="goToSubscriptionSettings"
    />

    <!-- Community Convention Modal -->
    <CommunityConventionModal
      :visible="showConventionModal"
      @cancel="closeConventionModal"
      @confirm="confirmConvention"
    />

    <UploadMask :visible="isUploadingImages" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { useContentSwitchStore } from "@/stores/contentSwitch";
import { processImageUrl } from "@/util/utils";
import Header from "@/components/Header.vue";
import Pagination from "@/components/Pagination.vue";
import MediaPreviewModal from "@/components/MediaPreviewModal.vue";
import SubscriptionPromptModal from "@/components/SubscriptionPromptModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import UploadMask from "@/components/UploadMask.vue";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const contentSwitch = useContentSwitchStore();
const { t, locale } = useI18n();

// 来源作品生成时用的是不是无限制模式。
// switch_no = 0 时发布页不显示「敏感内容」勾选，is_nsfw 只能由这里推导。
const sourceIsNsfw = computed(() => {
  const project: any = selectedProjectsMap.value.get(selectedProjectIds.value[0]);
  const storyMode = project?.user_selected?.story_mode || project?.story_mode;
  return storyMode === 'nsfw' ? 1 : 0;
});

const computedIsNsfw = computed(() => {
  // 中国地区 + 后端下发 2：展示上按普通模式走，但内容仍是 NSFW，发布照 1 传
  if (contentSwitch.nsfwDowngraded) return 1;
  // switch_no = 0：允许创作 NSFW，但发布页不给手动勾选，按生成时的模式判定
  if (contentSwitch.mode === 0) return sourceIsNsfw.value;
  if (contentSwitch.mode === 2) return 1;
  return form.value.content === "yes" ? 1 : 0;
});
const route = useRoute();

const TITLE_MAX = 60;
const DESC_MAX = 4000;
const pageSize = 15;

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
];

const langDropdownOpen = ref(false);
const langDropdownUp = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);

function toggleLangDropdown() {
  if (langDropdownOpen.value) {
    langDropdownOpen.value = false;
    return;
  }
  const el = langDropdownRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    langDropdownUp.value = spaceBelow < 200;
  }
  langDropdownOpen.value = true;
}

const currentLangLabel = computed(() => {
  const opt = langOptions.find((o) => o.key === form.value.language);
  return opt ? t(opt.labelKey) : "";
});

interface TabItem {
  name: string;
  path: string;
}

const tabList = ref<TabItem[]>([]);
const tabIndex = ref(1);

const uploadOption = ref("history");
const uploadOptions = [
  { id: "history", value: "history", label: "submit.image.uploadFromHistory" },
  { id: "local", value: "local", label: "submit.image.localUpload" },
];

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc" }[locale.value] || "jp");

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "yes",
  language: defaultLang,
});

const session_id = ref("");
const imageUrls = ref<string[]>([]);
const imageSessionMap = ref<Map<string, string>>(new Map());
const showFullContent = ref(false);
const isUploading = ref(false);
const editPostId = ref("");
const previewImageUrl = ref("");
const showPreviewMedia = ref(false);
const previewMediaType = ref<'image' | 'video'>('image');
const previewMediaUrl = ref("");

const hasActiveSubscription = ref(false);
const showSubscriptionModal = ref(false);
const agreeTerms = ref(true);
const showConventionModal = ref(false);

const isLoadingDetail = ref(false);
const isUploadingImages = ref(false);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const reuploadIndex = ref<number | null>(null);

// History list state
const projects = ref<any[]>([]);
const totalProjects = ref(0);
const currentPage = ref(1);
// 初始值就是 true：历史列表那块一挂载就渲染，
// 起手是 false 的话，在 onMounted 拉到数据之前会先闪一下「暂无作品」。
const isLoadingProjects = ref(true);
const selectedProjectIds = ref<(number | string)[]>([]);
const selectedProjectsMap = ref<Map<number | string, any>>(new Map());

// Local upload state
type PreviewFile = File & { _key: string; _preview: string; _url?: string };
const imageFiles = ref<PreviewFile[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);
const addImagesInputRef = ref<HTMLInputElement | null>(null);

const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

const showDropdown = ref(false);
const isComposingText = ref(false);
const dropdownType = ref<"" | "#" | "@">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number; align?: 'right' }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);

function addMoreImages() {
  addImagesInputRef.value?.click();
}

async function onAddImagesPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  const maxCount = 12;
  if (imageUrls.value.length + files.length > maxCount) {
    toast(t("submit.image.maxSelectTip"));
    return;
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const validFiles: File[] = [];
  for (const f of files) {
    if (!validTypes.includes(f.type)) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast(t("submit.image.uploadTip"));
      continue;
    }
    if (!(await checkImageDimensions(f))) continue;
    validFiles.push(f);
  }

  if (validFiles.length === 0) return;

  isUploadingImages.value = true;
  Promise.all(validFiles.map(f => uploadImageForAdd(f))).finally(() => {
    isUploadingImages.value = false;
  });
}

async function uploadImageForAdd(file: File) {
  const token = localStorage.getItem("token");
  if (!token) { router.push("/login"); return; }
  const formData = new FormData();
  formData.append("file", file);
  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);
  try {
    const res = await fetch(baseUrl + "user/uploadImage", {
      method: "POST",
      headers: { token, Platform: "web", siteid: "1", ...authHeaders },
      body: formData,
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === "string" && url) {
        imageUrls.value.push(url);
        imageSessionMap.value.set(url, "");
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
  }
}

// --- 封面 / 排序 / 语言 / 尺寸校验 ---------------------------------------------

// 封面固定用第一张图（提交时取 imageUrls[0]），不再单独设置。拖动排序把哪张换到第一个，哪张就是封面。

// 按住拖动调整图片顺序（和首页输入框里的参考素材同一套做法）：
// 用 Pointer Events 自己实现，不走原生 draggable —— 原生那套会拖出一张半透明的暗图，
// 移动端也不支持。被拖的那张只加 transform 跟着指针走，其它图原地不动；
// 盖住某张超过一半（重叠面积）就把它挪到那个位置，数组一变 Vue 自动重排，
// 让位的兄弟由 flipSiblings 做一段平滑位移。
//
// 不用 TransitionGroup：它做 FLIP 时不分谁在被拖，会把正在拖那张的行内 transform 覆盖掉；
// 而且让位动画进行中兄弟的 getBoundingClientRect 是半路上的值，拿它算重叠会
// 一会儿判定换、一会儿判定换回来，图就来回闪。这里两件事都自己管。
const dragState = reactive({ key: '', dx: 0, dy: 0 });
// 给每张图一个稳定的 key（同一地址出现多次时加序号），拖动换位时节点跟着走，不重建
const imageItems = computed(() => {
  const seen = new Map<string, number>();
  return imageUrls.value.map((url) => {
    const n = seen.get(url) || 0;
    seen.set(url, n + 1);
    return { url, key: `${url}#${n}` };
  });
});
interface ImageDragCtx {
  key: string;
  el: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  /** 指针相对缩略图左上角的偏移，拖动时保持不变，图才不会跳到指针下 */
  grabX: number;
  grabY: number;
  active: boolean;
  moved: boolean;
  timer: number | null;
}
let imageDragCtx: ImageDragCtx | null = null;
// 拖完松手会冒一个 click，这个时间点之前的 click 一律吞掉，别把删除 / 重传点出来
let suppressImageClickUntil = 0;

const DRAG_START_DISTANCE = 4;
const TOUCH_DRAG_HOLD_MS = 200;
const TOUCH_CANCEL_DISTANCE = 8;

const dragItemStyle = (key: string) =>
  dragState.key === key ? { transform: `translate(${dragState.dx}px, ${dragState.dy}px)` } : undefined;

function onImageClickCapture(e: Event) {
  if (Date.now() < suppressImageClickUntil) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function onImagePointerDown(e: PointerEvent, key: string) {
  if (e.button !== 0) return;
  if ((e.target as HTMLElement | null)?.closest?.('.image-btn')) return;
  if (imageUrls.value.length < 2) return;
  // 缩略图是 <img>，鼠标按下不拦的话浏览器会启动原生拖拽（暗图 + pointercancel）
  if (e.pointerType === 'mouse') e.preventDefault();
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  imageDragCtx = {
    key, el, pointerId: e.pointerId,
    startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY,
    grabX: e.clientX - rect.left, grabY: e.clientY - rect.top,
    active: false, moved: false, timer: null,
  };
  window.addEventListener('pointermove', onImagePointerMove, { passive: false });
  window.addEventListener('pointerup', onImagePointerUp);
  window.addEventListener('pointercancel', onImagePointerUp);
  // 触屏：长按一小会儿再进入拖拽，免得和页面滚动打架；鼠标：移动超过几像素就开始
  if (e.pointerType !== 'mouse') {
    imageDragCtx.timer = window.setTimeout(startImageDrag, TOUCH_DRAG_HOLD_MS);
  }
}

function startImageDrag() {
  const ctx = imageDragCtx;
  if (!ctx || ctx.active) return;
  ctx.active = true;
  ctx.timer = null;
  dragState.key = ctx.key;
  dragState.dx = 0;
  dragState.dy = 0;
  // 它可能刚做完让位动画，行内还挂着 transition，清掉才能跟得上指针
  ctx.el.style.transition = '';
  try { ctx.el.setPointerCapture(ctx.pointerId); } catch { /* 部分浏览器不支持，忽略 */ }
}

function onImagePointerMove(e: PointerEvent) {
  const ctx = imageDragCtx;
  if (!ctx) return;
  ctx.lastX = e.clientX;
  ctx.lastY = e.clientY;
  const dist = Math.hypot(e.clientX - ctx.startX, e.clientY - ctx.startY);
  if (!ctx.active) {
    if (e.pointerType === 'mouse') {
      if (dist < DRAG_START_DISTANCE) return;
      startImageDrag();
    } else {
      // 长按还没到就滑开了：当成普通触摸，不拖
      if (dist >= TOUCH_CANCEL_DISTANCE) finishImageDrag();
      return;
    }
  }
  if (!ctx.active) return;
  e.preventDefault();
  ctx.moved = true;
  updateImageDragPosition();
  const from = imageItems.value.findIndex((it) => it.key === ctx.key);
  if (from < 0) return;
  const to = resolveImageDragTarget(from);
  if (to !== from) {
    flipSiblings(() => {
      const next = [...imageUrls.value];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      imageUrls.value = next;
    });
    // 换位后这张落到新槽位，按最后的指针位置重算一次 translate，视觉上才不会跳
    nextTick(updateImageDragPosition);
  }
}

/** 元素「该在」的位置：去掉当前 transform 的影响（让位动画进行中 rect 是半路上的） */
function untransformedRect(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  const m = new DOMMatrixReadOnly(t);
  return { left: r.left - m.e, top: r.top - m.f, right: r.right - m.e, bottom: r.bottom - m.f, width: r.width, height: r.height };
}

const SIBLING_MOVE_TRANSITION = 'transform 0.18s ease';

/**
 * 给让位的兄弟做 FLIP：改数组前记下它们此刻「看得见」的位置，DOM 更新后
 * 先无过渡地把它们摆回原地，再放开让它们滑到新槽位。被拖的那张不参与。
 * 从上一次动画的半路接着滑也没问题 —— 记的是视觉位置，不是逻辑槽位。
 */
function flipSiblings(mutate: () => void) {
  const ctx = imageDragCtx;
  const list = ctx?.el.parentElement;
  const before = new Map<HTMLElement, DOMRect>();
  if (ctx && list) {
    for (const c of Array.from(list.children) as HTMLElement[]) {
      if (c !== ctx.el && c.classList.contains('image-item')) before.set(c, c.getBoundingClientRect());
    }
  }
  mutate();
  nextTick(() => {
    before.forEach((old, el) => {
      if (!el.isConnected) return;
      const now = untransformedRect(el);
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      void el.offsetWidth; // 强制回流，让「摆回原地」先生效
      el.style.transition = SIBLING_MOVE_TRANSITION;
      el.style.transform = '';
      // 滑完把行内 transition 清掉，否则它下次被拖时会盖过 .is-dragging 的 transition: none
      const done = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return;
        el.style.transition = '';
        el.removeEventListener('transitionend', done);
      };
      el.addEventListener('transitionend', done);
    });
  });
}

/** 缩略图该在的左上角 = 指针 - 抓取偏移；减去它当前的布局位置就是 translate */
function updateImageDragPosition() {
  const ctx = imageDragCtx;
  if (!ctx || !ctx.active) return;
  const rect = ctx.el.getBoundingClientRect();
  const baseLeft = rect.left - dragState.dx;
  const baseTop = rect.top - dragState.dy;
  dragState.dx = ctx.lastX - ctx.grabX - baseLeft;
  dragState.dy = ctx.lastY - ctx.grabY - baseTop;
}

/** 被拖的那张盖住哪张超过一半（重叠面积 > 对方面积的一半），就落到它的位置；盖住多张取最多的 */
function resolveImageDragTarget(from: number): number {
  const ctx = imageDragCtx;
  if (!ctx) return from;
  const dL = ctx.lastX - ctx.grabX;
  const dT = ctx.lastY - ctx.grabY;
  const dR = dL + ctx.el.offsetWidth;
  const dB = dT + ctx.el.offsetHeight;
  const siblings = Array.from(ctx.el.parentElement?.children || [])
    .filter((c) => c.classList.contains('image-item')) as HTMLElement[];
  let target = from;
  let best = 0.5;
  siblings.forEach((sib) => {
    if (sib === ctx.el) return;
    const idx = Number(sib.dataset.index);
    if (Number.isNaN(idx)) return;
    // 用去掉 transform 的位置：兄弟正在让位滑动时也按它的目标槽位算，不会来回触发换位
    const r = untransformedRect(sib);
    if (r.width <= 0 || r.height <= 0) return;
    const overlapW = Math.max(0, Math.min(dR, r.right) - Math.max(dL, r.left));
    const overlapH = Math.max(0, Math.min(dB, r.bottom) - Math.max(dT, r.top));
    const ratio = (overlapW * overlapH) / (r.width * r.height);
    if (ratio > best) {
      best = ratio;
      target = idx;
    }
  });
  return target;
}

function onImagePointerUp() {
  const ctx = imageDragCtx;
  if (!ctx) return;
  const wasActive = ctx.active;
  finishImageDrag();
  if (wasActive) suppressImageClickUntil = Date.now() + 300;
}

function finishImageDrag() {
  const ctx = imageDragCtx;
  if (!ctx) return;
  if (ctx.timer) window.clearTimeout(ctx.timer);
  try { ctx.el.releasePointerCapture(ctx.pointerId); } catch { /* 没 capture 过会抛，忽略 */ }
  window.removeEventListener('pointermove', onImagePointerMove);
  window.removeEventListener('pointerup', onImagePointerUp);
  window.removeEventListener('pointercancel', onImagePointerUp);
  dragState.key = '';
  dragState.dx = 0;
  dragState.dy = 0;
  imageDragCtx = null;
}

// 语言默认值优先级：AI 生成时配置的语言 > 进入发布页时地址栏带的 language > 站点当前语言。
// 只是默认值，用户随时可以在下拉框里切。
const LANG_KEYS = langOptions.map((o) => o.key);
function applyNavLanguage() {
  const navLang = (route.query.language || route.query.lang) as string;
  if (navLang && LANG_KEYS.includes(navLang)) form.value.language = navLang;
}
function applyProjectLanguage(project: any) {
  const ra = typeof project?.result_async === 'string'
    ? (() => { try { return JSON.parse(project.result_async || '{}'); } catch { return {}; } })()
    : (project?.result_async || {});
  const lang = project?.user_selected?.language || ra?.user_selected?.language;
  if (lang && LANG_KEYS.includes(lang)) form.value.language = lang;
}

// 手动上传的图片限制：宽高都在 300–6000px、宽高比（宽/高）在 0.4–2.5 之间，都是开区间，和后端口径一致
const IMAGE_SIDE_MIN = 300;
const IMAGE_SIDE_MAX = 6000;
const IMAGE_RATIO_MIN = 0.4;
const IMAGE_RATIO_MAX = 2.5;
function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
async function checkImageDimensions(file: File): Promise<boolean> {
  const size = await readImageSize(file);
  if (!size || !size.width || !size.height) {
    toast(t("submit.image.uploadFormatError"));
    return false;
  }
  const sideOk = size.width > IMAGE_SIDE_MIN && size.width < IMAGE_SIDE_MAX
    && size.height > IMAGE_SIDE_MIN && size.height < IMAGE_SIDE_MAX;
  if (!sideOk) {
    toast(t("submit.image.sizeError"));
    return false;
  }
  const ratio = size.width / size.height;
  if (ratio <= IMAGE_RATIO_MIN || ratio >= IMAGE_RATIO_MAX) {
    toast(t("submit.image.ratioError"));
    return false;
  }
  return true;
}

function reloadImage(idx: number) {
  reuploadIndex.value = idx;
  reuploadInputRef.value?.click();
}

function removeImage(idx: number) {
  const removedUrl = imageUrls.value[idx];
  imageUrls.value.splice(idx, 1);
  imageSessionMap.value.delete(removedUrl);
}

async function onReuploadPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  input.value = "";
  if (reuploadIndex.value === null || !file) return;

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    toast(t("submit.image.uploadFormatError"));
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast(t("submit.image.uploadTip"));
    return;
  }
  if (!(await checkImageDimensions(file))) return;

  const token = localStorage.getItem("token");
  if (!token) { router.push("/login"); return; }

  isUploadingImages.value = true;
  const formData = new FormData();
  formData.append("file", file);
  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);
  try {
    const res = await fetch(baseUrl + "user/uploadImage", {
      method: "POST",
      headers: { token, Platform: "web", siteid: "1", ...authHeaders },
      body: formData,
    });
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url === "string" && url) {
        const idx = reuploadIndex.value;
        const oldUrl = imageUrls.value[idx];
        imageUrls.value.splice(idx, 1, url);
        imageSessionMap.value.delete(oldUrl);
        imageSessionMap.value.set(url, "");
      }
    }
  } catch (error) {
    console.error("Reupload error:", error);
  } finally {
    isUploadingImages.value = false;
    reuploadIndex.value = null;
  }
}

function buildTabList(): TabItem[] {
  return [
    { name: t("submit.tabs.video"), path: "/publish/clip" },
    { name: t("submit.tabs.photo"), path: "/publish/image" },
    { name: t("submit.tabs.manhua"), path: "/publish/comic" },
    { name: t("submit.tabs.novel"), path: "/publish/novel" },
  ];
}

function getProjectCover(project: any): string {
  const ra = typeof project.result_async === 'string' ? JSON.parse(project.result_async || '{}') : (project.result_async || {});
  return (ra.final_images && ra.final_images[0]) || project.cover || "";
}

function goBack() {
  router.go(-1);
}

function goToHome() {
  router.push("/");
}

function openImageView(project: any) {
  const cover = getProjectCover(project);
  if (cover) {
    previewMediaType.value = 'image';
    previewMediaUrl.value = processImageUrl(cover);
    showPreviewMedia.value = true;
  }
}

function changeTab(item: TabItem, index: number) {
  if (tabIndex.value === index) {
    return;
  }
  tabIndex.value = index;
  router.replace(item.path);
}

// Fetch photo generation history
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = await api.singleTaskList(currentPage.value, pageSize, "simple_image", true) as any;
    if (response.code !== 200) {
      toast(t("fail"));
      return;
    }

    projects.value = response.data.data_list || [];

    if (response.data.data_total) {
      totalProjects.value = response.data.data_total;
    } else if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }

    if (projects.value.length > 0 && selectedProjectIds.value.length === 0) {
      selectedProjectIds.value = [projects.value[0].id];
      selectedProjectsMap.value.set(projects.value[0].id, projects.value[0]);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    isLoadingProjects.value = false;
  }
}

function toggleProjectSelection(project: any) {
  const idx = selectedProjectIds.value.indexOf(project.id);
  if (idx >= 0) {
    selectedProjectIds.value.splice(idx, 1);
    selectedProjectsMap.value.delete(project.id);
  } else {
    if (selectedProjectIds.value.length >= 12) {
      toast(t("submit.image.maxSelectTip"));
      return;
    }
    selectedProjectIds.value.push(project.id);
    selectedProjectsMap.value.set(project.id, project);
  }
}

async function confirmSelectedProjects() {
  if (selectedProjectIds.value.length === 0) return;

  const selected = selectedProjectIds.value.map(id => selectedProjectsMap.value.get(id)).filter(Boolean);
  const allUrls: string[] = [];

  for (const project of selected) {
    let urls: string[] = [];
    const ra = project.result_async;
    if (ra && Array.isArray(ra.final_images) && ra.final_images.length > 0) {
      urls = ra.final_images;
    } else if (ra && Array.isArray(ra.images) && ra.images.length > 0) {
      urls = ra.images;
    }

    if (urls.length === 0 && project.session_id) {
      try {
        const detailRes = await api.detailProject(project.session_id) as any;
        if (detailRes.code === 200 && detailRes.data) {
          Object.assign(project, detailRes.data);
        }
        const dRA = project.result_async;
        if (dRA && Array.isArray(dRA.final_images) && dRA.final_images.length > 0) {
          urls = dRA.final_images;
        } else if (dRA && Array.isArray(dRA.images) && dRA.images.length > 0) {
          urls = dRA.images;
        }
        if (urls.length === 0) {
          const episode = project.episode || project.chapter || 1;
          const chapterRes = await api.detailChapter(project.session_id, episode) as any;
          if (chapterRes.code === 200 && chapterRes.data) {
            const cd = chapterRes.data;
            let cRA = cd.result_async;
            if (typeof cRA === "string") {
              try { cRA = JSON.parse(cRA); } catch { cRA = null; }
            }
            if (Array.isArray(cd.final_images) && cd.final_images.length > 0) {
              urls = cd.final_images;
            } else if (Array.isArray(cd.images) && cd.images.length > 0) {
              urls = cd.images;
            } else if (cRA && Array.isArray(cRA.final_images) && cRA.final_images.length > 0) {
              urls = cRA.final_images;
            } else if (cRA && Array.isArray(cRA.images) && cRA.images.length > 0) {
              urls = cRA.images;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project detail:", error);
      }
    }

    allUrls.push(...urls);
    const sid = project.session_id || session_id.value || "";
    for (const u of urls) {
      imageSessionMap.value.set(u, sid);
    }
  }

  if (allUrls.length === 0) {
    toast(t("fail"));
    return;
  }

  imageUrls.value = allUrls.slice(0, 15);
  const firstProject = selected[0];
  applyProjectLanguage(firstProject);
  session_id.value = firstProject?.session_id || "";
  showFullContent.value = true;
  if (firstProject?.name) {
    form.value.title = firstProject.name;
  }
}

function handlePermissionChange(permission: string) {
  if (permission === "partial" && !hasActiveSubscription.value) {
    showSubscriptionModal.value = true;
    return;
  }
  form.value.permission = permission;
}

async function checkSubscriptionStatus() {
  try {
    const response = await api.getSubscription();
    const data = response as any;
    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = subscription && subscription.plan && parseFloat(subscription.plan.price) > 0;
    }
  } catch (error) {
    console.error("Subscription check error:", error);
    hasActiveSubscription.value = false;
  }
}

function closeSubscriptionModal() {
  showSubscriptionModal.value = false;
}

function goToSubscriptionSettings() {
  showSubscriptionModal.value = false;
  window.location.href = '/user-subscription';
}

function closeConventionModal() {
  showConventionModal.value = false;
}

function confirmConvention() {
  showConventionModal.value = false;
  agreeTerms.value = true;
  onSubmit();
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

// --- Local upload helpers ---
function pickImages() {
  if (imageFiles.value.length >= 12) {
    toast(t("submit.image.maxSelectTip"));
    return;
  }
  imageInputRef.value?.click();
}

function onImagesPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  appendFiles(files);
}

function onDragOver() {}

function onDropImages(e: DragEvent) {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  const files = Array.from(e.dataTransfer?.files ?? []);
  appendFiles(files);
}

function isImageCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width === 0 || img.height === 0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

async function appendFiles(files: File[]) {
  const maxCount = 12;
  const maxSize = 10 * 1024 * 1024;
  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const validFiles: PreviewFile[] = [];

  for (const f of files) {
    if (imageFiles.value.length + validFiles.length >= maxCount) {
      toast(t("submit.image.maxSelectTip"));
      break;
    }
    if (!validImageTypes.includes(f.type)) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > maxSize) {
      toast(t("home.error.maxPhotoSize", { max: 10 }));
      continue;
    }

    const corrupted = await isImageCorrupted(f);
    if (corrupted) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }

    if (!(await checkImageDimensions(f))) continue;

    const pf = f as PreviewFile;
    pf._key = `${Date.now()}_${Math.random()}`;
    pf._preview = URL.createObjectURL(f);

    validFiles.push(pf);
  }

  if (validFiles.length === 0) return;

  isUploadingImages.value = true;

  const uploadPromises = validFiles.map((pf) => uploadImageAsync(pf));
  const results = await Promise.allSettled(uploadPromises);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      const pf = validFiles[i];
      imageFiles.value.push(pf);
      if (pf._url) {
        imageUrls.value.push(pf._url);
        imageSessionMap.value.set(pf._url, "");
      }
    }
  }

  if (imageUrls.value.length > 0) {
    showFullContent.value = true;
  }

  isUploadingImages.value = false;
}

async function uploadImageAsync(pf: PreviewFile): Promise<boolean> {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return false;
  }

  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validImageTypes.includes(pf.type)) {
    toast(t("submit.image.uploadFormatError"));
    return false;
  }

  const formData = new FormData();
  formData.append("file", pf);

  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);

  try {
    const response = await fetch(baseUrl + "user/uploadImage", {
      method: "POST",
      headers: {
        token: token,
        Platform: "web",
        siteid: "1",
        ...authHeaders,
      },
      body: formData,
    });
    const res = await response.json();
    if (res.code === 0 || res.code === 200) {
      const url = (res?.data && (res.data.url || res.data)) || res?.url;
      if (typeof url === "string") {
        pf._url = url;
        return true;
      }
    } else {
      toast(locale.value === "en" ? res.msg : locale.value === "zh" ? res.msg_cn : locale.value === "tc" ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    toast(String(error));
  }

  return false;
}

// Keep imageUrls in sync with uploaded files (first is cover)

// --- Contenteditable helpers ---
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
  isDropdownLoading.value = true;
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    dropdownItems.value = [];
  } finally {
    isDropdownLoading.value = false;
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

async function searchTagsImmediate(type: "#" | "@", query: string) {
  isDropdownLoading.value = true;
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    dropdownItems.value = [];
  } finally {
    isDropdownLoading.value = false;
  }
}

function updateCaptionStats() {
  if (captionRef.value) {
    captionLength.value = captionRef.value.innerText.replace(/\n$/, "").length;
  }
}

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;
  const range = selection.getRangeAt(0).cloneRange();
  let rect: DOMRect;
  if (range.collapsed) {
    const marker = document.createElement('span');
    marker.textContent = '\u200B';
    range.insertNode(marker);
    rect = marker.getBoundingClientRect();
    marker.parentNode?.removeChild(marker);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    rect = range.getBoundingClientRect();
  }
  let absTop = rect.bottom + 5;
  let absLeft = rect.left;
  if ((rect.width === 0 && rect.height === 0) || absTop < 100 || absLeft < 10) {
    const captionRect = captionRef.value.getBoundingClientRect();
    absTop = captionRect.top + 26;
    absLeft = captionRect.left;
  }
  const dropdownHeight = 250;
  const dropdownWidth = 480;
  if (absTop + dropdownHeight > window.innerHeight) {
    const spaceAbove = rect.top;
    if (spaceAbove >= dropdownHeight) {
      dropdownPosition.value = { top: 0, position: 'above', bottom: window.innerHeight - rect.top + 5, left: absLeft + 2 };
    } else {
      dropdownPosition.value = { top: 50, left: absLeft + 2 };
    }
  } else {
    dropdownPosition.value = { top: absTop, left: absLeft + 2 };
  }
  if (absLeft + dropdownWidth > window.innerWidth) {
    dropdownPosition.value.left = Math.max(10, window.innerWidth - dropdownWidth - 20);
    dropdownPosition.value.right = undefined;
  }
}

function getDropdownStyle(): Record<string, string> {
  const style: Record<string, string> = {};
  if (dropdownPosition.value.position === 'above') {
    style.bottom = `${dropdownPosition.value.bottom}px`;
  } else {
    style.top = `${dropdownPosition.value.top}px`;
  }
  if (dropdownPosition.value.right !== undefined) {
    style.right = `${dropdownPosition.value.right}px`;
  } else if (dropdownPosition.value.left !== undefined) {
    style.left = `${dropdownPosition.value.left}px`;
  }
  return style;
}

function onActionBtnClick(symbol: "#" | "@") {
  if (!captionRef.value) return;
  captionRef.value.focus();
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(captionRef.value);
    range.collapse(false);
  }
  range.deleteContents();
  const textNode = document.createTextNode(symbol);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  const insertedNode = textNode;
  dropdownType.value = symbol;
  nextTick(async () => {
    await searchTagsImmediate(symbol, "");
    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.rangeCount === 0) return;
    const currentRange = currentSelection.getRangeAt(0);
    lastRange.value = currentRange.cloneRange();
    const symbolRange = document.createRange();
    symbolRange.selectNodeContents(insertedNode);
    const rect = symbolRange.getBoundingClientRect();
    const captionRect = captionRef.value?.getBoundingClientRect();
    let absTop = rect.bottom + 5;
    let absLeft = rect.left;
    if ((rect.width === 0 && rect.height === 0) || !captionRect || absTop < 50 || absLeft < 10 || absTop > window.innerHeight - 50) {
      if (captionRect) { absTop = captionRect.top + 26; absLeft = captionRect.left; }
    }
    dropdownPosition.value = { top: absTop, left: absLeft };
    const dropdownHeight = 250;
    const dropdownWidth = 280;
    if (absTop + dropdownHeight > window.innerHeight) {
      const spaceAbove = absTop - (captionRect?.top || 0);
      if (spaceAbove >= dropdownHeight) { dropdownPosition.value.top = absTop - dropdownHeight - 8; }
      else { dropdownPosition.value.top = 100; }
    }
    if (absLeft + dropdownWidth > window.innerWidth) {
      dropdownPosition.value.left = Math.max(10, window.innerWidth - dropdownWidth - 10);
    }
    showDropdown.value = true;
    captionRef.value?.focus();
  });
}

async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;
  if (isComposingText.value || (e as InputEvent).isComposing) {
    captionLength.value = (target.innerText || "").replace(/\n$/, "").length;
    return;
  }
  if (captionRef.value) {
    captionRef.value.querySelectorAll('.tag').forEach((span: Element) => {
      const el = span as HTMLElement;
      el.style.color = '#00d3f2';
      el.contentEditable = 'false';
    });
  }
  const text = target.innerText || "";
  const trimmedText = text.replace(/\n$/, "");
  const currentLength = trimmedText.length;
  if (currentLength > DESC_MAX) {
    captionLength.value = DESC_MAX;
    return;
  }
  captionLength.value = currentLength;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') { inSpan = true; break; }
    node = node.parentNode;
  }
  if (inSpan) { showDropdown.value = false; return; }
  const caretPos = resolveCaretPosition(range);
  const textBefore = caretPos
    ? (caretPos.node.textContent || "").substring(0, caretPos.offset)
    : (range.startContainer.textContent?.substring(0, range.startOffset) || "");
  const match = textBefore.match(/([#@])([^#@\s]*)$/u);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
    setTimeout(() => { isOpeningDropdown.value = false; }, 100);
  } else {
    showDropdown.value = false;
  }
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') { inSpan = true; break; }
    node = node.parentNode;
  }
  if (inSpan) { showDropdown.value = false; return; }
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  if (textBefore.endsWith('#') || textBefore.endsWith('@')) {
    const trigger = textBefore.endsWith('#') ? '#' : '@';
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, '');
    setTimeout(() => { isOpeningDropdown.value = false; }, 100);
  } else {
    showDropdown.value = false;
  }
}

function handleCompositionStart() {
  isComposingText.value = true;
  showDropdown.value = false;
}

function handleCompositionEnd(e: CompositionEvent) {
  isComposingText.value = false;
  handleCaptionInput(e as unknown as Event);
}

function resolveCaretPosition(range: Range): { node: Node; offset: number } | null {
  let node: Node = range.startContainer;
  let offset = range.startOffset;

  if (node.nodeType === Node.TEXT_NODE) {
    return { node, offset };
  }

  while (node.nodeType === Node.ELEMENT_NODE) {
    if (offset <= 0) return null;
    const child: Node | undefined = node.childNodes[offset - 1];
    if (!child) return null;
    if (child.nodeType === Node.TEXT_NODE) {
      const len = (child.textContent || "").length;
      if (len === 0) {
        offset -= 1;
        continue;
      }
      return { node: child, offset: len };
    }
    return null;
  }
  return null;
}

function handleCaptionKeydown(e: KeyboardEvent) {
  if (isComposingText.value || e.isComposing || e.keyCode === 229) return;

  if (e.key === " " || e.key === "Spacebar") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === 'SPAN') {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            node.textContent = '\u0020' + (node.textContent || '');
            const newRange = document.createRange();
            newRange.setStart(node, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
      if (node === captionRef.value && range.startOffset > 0) {
        const child = node.childNodes[range.startOffset - 1];
        if (child?.nodeName === 'SPAN') {
          const span = child as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            const space = document.createTextNode('\u0020');
            node.insertBefore(space, node.childNodes[range.startOffset] || null);
            const newRange = document.createRange();
            newRange.setStart(space, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
    }
    const caretPos = resolveCaretPosition(range);
    const textNode = caretPos ? caretPos.node : range.startContainer;
    const caretOffset = caretPos ? caretPos.offset : range.startOffset;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBefore = textNode.textContent?.substring(0, caretOffset) || "";
      const hashMatch = textBefore.match(/#([\p{L}\p{N}\p{M}_]+)$/u);
      if (hashMatch) {
        const tagContent = hashMatch[1];
        const hasChineseChars = /[\u4e00-\u9fa5]/.test(tagContent);
        const hasSpaces = tagContent.includes(" ");
        if (hasChineseChars || hasSpaces) {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              toast(t('submit.video.toastTopicLimit'));
              return;
            }
          }
          const fullMatch = "#" + tagContent.trim();
          const currentText = captionRef.value?.innerText || "";
          if (currentText.length + 1 > DESC_MAX) { e.preventDefault(); return; }
          e.preventDefault();
          const matchStartIndex = hashMatch.index!;
          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, caretOffset);
          tagRange.deleteContents();
          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";
          tagRange.insertNode(span);
          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);
          tagRange.setStart(space, 1);
          tagRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(tagRange);
          showDropdown.value = false;
          updateCaptionStats();
          return;
        } else {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) { e.preventDefault(); toast(t('submit.video.toastTopicLimit')); return; }
          }
          const fullMatch = "#" + tagContent;
          const currentText = captionRef.value?.innerText || "";
          if (currentText.length + 1 > DESC_MAX) { e.preventDefault(); return; }
          e.preventDefault();
          const matchStartIndex = hashMatch.index!;
          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, caretOffset);
          tagRange.deleteContents();
          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";
          tagRange.insertNode(span);
          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);
          tagRange.setStart(space, 1);
          tagRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(tagRange);
          showDropdown.value = false;
          updateCaptionStats();
          return;
        }
      }
    }
  }
  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      const node = range.startContainer;
      const offset = range.startOffset;
      if (offset === 0 && node.previousSibling?.nodeName === "SPAN") {
        const span = node.previousSibling as HTMLElement;
        if (span.classList.contains("tag")) {
          e.preventDefault();
          span.remove();
          showDropdown.value = false;
          updateCaptionStats();
          return;
        }
      }
      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === "SPAN") {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains("tag")) {
            e.preventDefault();
            span.remove();
            showDropdown.value = false;
            updateCaptionStats();
            return;
          }
        }
      }
    }
  }
}

function onCaptionBlur() {
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain') || '';
  const selection = window.getSelection();
  if (!selection) return;
  const range = selection.getRangeAt(0);
  const currentText = captionRef.value?.innerText || '';
  const remainingLength = DESC_MAX - currentText.length;
  const pasteText = remainingLength > 0 ? text.substring(0, remainingLength) : '';
  range.deleteContents();
  const textNode = document.createTextNode(pasteText);
  range.insertNode(textNode);
  const newRange = document.createRange();
  newRange.setStartAfter(textNode);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  captionRef.value?.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });
  updateCaptionStats();
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;
  const selection = window.getSelection();
  if (!selection) return;
  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) { toast(t("submit.video.toastTopicLimit")); showDropdown.value = false; return; }
  }
  const currentText = captionRef.value.innerText || "";
  const tagText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  const spaceText = " ";
  if (currentText.length + tagText.length + spaceText.length > DESC_MAX) { showDropdown.value = false; return; }
  const range = lastRange.value;
  const caretPos = resolveCaretPosition(range);
  const textNode = caretPos ? caretPos.node : range.startContainer;
  const offset = caretPos ? caretPos.offset : range.startOffset;
  const textContent = textNode.textContent || "";
  const textBefore = textContent.substring(0, offset);
  const match = textBefore.match(/([#@])([^#@\s]*)$/);
  if (match) {
    const triggerIndex = match.index!;
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }
  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  span.innerText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  span.style.color = "#00d3f2";
  range.insertNode(span);
  const space = document.createTextNode("\u0020");
  range.setStartAfter(span);
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  showDropdown.value = false;
  updateCaptionStats();
  captionRef.value.focus();
}

// --- Submit ---
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  // 标题改成非必填，校验先注释掉留着，要恢复直接放开
  // if (!form.value.title.trim()) {
  //   toast(t("submit.titleRequired"));
  //   return;
  // }

  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }

  // Merge uploaded local files into imageUrls if present
  // imageUrls 就是页面上的顺序（含拖动后的），提交按这个顺序，第一张是封面
  const finalUrls = imageUrls.value;

  if (finalUrls.length === 0) {
    toast(t("submit.image.uploadFirst"));
    return;
  }

  const finalCover = finalUrls[0] || "";
  if (!finalCover) {
    toast(t("submit.image.setCover"));
    return;
  }

  isUploading.value = true;

  try {
    const imageUrlsPayload: string[] = finalUrls.map((url: string) => {
      const sid = imageSessionMap.value.get(url) ?? '';
      return `${sid}|${url}`;
    });

    const isEditMode = !!editPostId.value;
    const payload = {
      type: 4,
      title: form.value.title.trim(),
      cover: finalCover,
      content: form.value.description.trim(),
      is_nsfw: computedIsNsfw.value,
      access_rights: form.value.permission === "partial" ? 2 : form.value.permission === "private" ? 3 : 1,
      image_urls: imageUrlsPayload,
      language: form.value.language,
      ...(isEditMode && { post_id: editPostId.value }),
    };

    const headers = new Headers();
    const { ts, sign } = (window as any).AntiCrawler.generateAuthParams(token);
    headers.append("token", token);
    headers.append("ts", ts);
    headers.append("sign", sign);
    headers.append("Content-Type", "application/json");
    headers.append("Platform", "web");
    headers.append("siteid", "1");

    const data = JSON.stringify(payload);
    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data,
    };

    const url = isEditMode
      ? `${baseUrl}post/modifyPostFour`
      : `${baseUrl}post/addPostFour`;
    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      toast(t("success"));
      router.push(`/publish/success?type=${4}`);
    } else {
      toast(locale.value === "en" ? res.msg : locale.value === "zh" ? res.msg_cn : locale.value === "tc" ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("fail"));
  } finally {
    isUploading.value = false;
  }
}

function renderCaptionContent() {
  if (!captionRef.value) return;
  const content = form.value.description || "";
  captionRef.value.innerHTML = '';

  const regex = /\[mention:(\d+)\|([^\]]+)\]|(?<=^|\s)(#[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      captionRef.value!.appendChild(document.createTextNode(textBefore));
    }

    if (match[1] !== undefined) {
      const value = parseInt(match[1]);
      const username = match[2];

      if (value > 0) {
        const span = document.createElement('span');
        span.className = 'tag mention';
        span.style.color = '#00d3f2';
        span.style.marginRight = '4px';
        span.contentEditable = 'false';
        span.textContent = username;
        captionRef.value!.appendChild(span);
      } else {
        captionRef.value!.appendChild(document.createTextNode(username));
      }
    } else if (match[3] !== undefined) {
      const span = document.createElement('span');
      span.className = 'tag topic';
      span.style.color = '#00d3f2';
      span.style.marginRight = '4px';
      span.contentEditable = 'false';
      span.textContent = match[3];
      captionRef.value!.appendChild(span);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    captionRef.value!.appendChild(document.createTextNode(textAfter));
  }

  captionLength.value = captionRef.value.innerText.length;
}

// --- URL jump entry ---
onMounted(async () => {
  await contentSwitch.ensureLoaded();
  tabList.value = buildTabList();
  checkSubscriptionStatus();

  applyNavLanguage();

  const sessionId = route.query.session_id as string;
  const postId = route.query.post_id as string;

  if (postId || sessionId) {
    isLoadingDetail.value = true;
  }

  if (postId) {
    editPostId.value = postId;
    try {
      const postRes = await api.modifyPostDetail(postId) as any;
      if ((postRes.code === 200 || postRes.code === 0) && postRes.data) {
        const post = postRes.data.post || postRes.data;
        form.value.title = post.title || "";
        const rawContent = post.content_replace || post.content || "";
        form.value.description = rawContent;
        if (post.is_nsfw == 1 || post.is_nsfw == '1') form.value.content = "yes";
        if (post.access_rights == 2 || post.access_rights == '2') form.value.permission = "partial";
        if (post.access_rights == 3 || post.access_rights == '3') form.value.permission = "private";
        if (post.language) form.value.language = post.language;
        const postCover: string = post.cover || "";
        if (post.image_urls && Array.isArray(post.image_urls) && post.image_urls.length > 0) {
          imageUrls.value = post.image_urls.slice(0, 15);
          for (const u of imageUrls.value) {
            imageSessionMap.value.set(u, post.session_id || "");
          }
        } else if (post.images && Array.isArray(post.images) && post.images.length > 0) {
          imageUrls.value = post.images.map((img: any) => img.image_url || img).filter(Boolean).slice(0, 15);
          for (const u of imageUrls.value) {
            imageSessionMap.value.set(u, post.session_id || "");
          }
        } else {
          const dataImages = postRes.data.images;
          if (dataImages && Array.isArray(dataImages) && dataImages.length > 0) {
            imageUrls.value = dataImages.map((img: any) => img.image_url || img).filter(Boolean).slice(0, 15);
            for (const u of imageUrls.value) {
              imageSessionMap.value.set(u, post.session_id || "");
            }
          }
        }
        // 封面就是第一张：原帖的封面如果在图片列表里，挪到最前面，编辑时封面不变
        if (postCover) {
          const ci = imageUrls.value.indexOf(postCover);
          if (ci > 0) imageUrls.value.unshift(...imageUrls.value.splice(ci, 1));
        }
        if (post.session_id) session_id.value = post.session_id;
        isLoadingDetail.value = false;
        showFullContent.value = true;
        await nextTick();
        renderCaptionContent();
        return;
      }
    } catch (error) {
      console.error("Error fetching post detail:", error);
    }
    isLoadingDetail.value = false;
  }

  if (sessionId) {
    session_id.value = sessionId;
    // 通过 session_id 请求详情接口获取图片数据
    try {
      const detailRes = await api.detailProject(sessionId) as any;
      if (detailRes.code === 200 && detailRes.data) {
        const ra = typeof detailRes.data.result_async === 'string'
          ? (() => { try { return JSON.parse(detailRes.data.result_async || '{}'); } catch { return {}; } })()
          : (detailRes.data.result_async || {});
        let urls: string[] = [];
        if (Array.isArray(ra.final_images) && ra.final_images.length > 0) {
          urls = ra.final_images.slice(0, 15);
        } else if (Array.isArray(detailRes.data.final_images) && detailRes.data.final_images.length > 0) {
          urls = detailRes.data.final_images.slice(0, 15);
        } else if (Array.isArray(detailRes.data.images) && detailRes.data.images.length > 0) {
          urls = detailRes.data.images.slice(0, 15);
        }
        if (urls.length > 0) {
          imageUrls.value = urls;
          for (const u of urls) {
            imageSessionMap.value.set(u, sessionId);
          }
          applyProjectLanguage(detailRes.data);
          isLoadingDetail.value = false;
          showFullContent.value = true;
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching project detail:", error);
    }
    isLoadingDetail.value = false;
  }

  // Otherwise load history list
  await fetchProjects();
});

// Watch route path to update tabIndex
watch(
  () => route.path,
  (newPath) => {
    const tab = tabList.value.find((tItem) => tItem.path === newPath);
    if (tab) {
      const index = tabList.value.indexOf(tab);
      tabIndex.value = index;
    }
  }
);

// Watch currentPage to reload history
watch(currentPage, () => {
  if (!showFullContent.value) {
    fetchProjects();
  }
});

// Watch locale to rebuild tab names
watch(locale, () => {
  tabList.value = buildTabList();
});
</script>

<style lang="scss" scoped>
@use '@/scss/Image.scss';
</style>

