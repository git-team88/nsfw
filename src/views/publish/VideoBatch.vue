<template>
  <div class="submit-video" :class="isBatchPublish ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- 本地批量上传：一次最多 MAX_LOCAL_FILES（20）个视频，列表顺序就是合集里的集数顺序 -->
      <div class="upload-tabs batch-local-upload">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.video.videoLabel") }}</span>
          <span class="batch-file-count" v-if="localItems.length">{{ localItems.length }}/{{ MAX_LOCAL_FILES }}</span>
        </div>

        <!-- 还没选文件：和单个上传一样的上传框，支持多选 / 拖多个 -->
        <!-- 文件 input 不再铺满整块区域（原来那样会盖住下面的文件列表，点播放 / 上移全变成选文件），
             整个上传框点哪都能选文件靠这里的 @click -->
        <div v-if="localItems.length === 0" class="upload-area-box" @dragover.prevent @drop.prevent="onDropLocalFiles">
          <div class="upload-area" @click="pickLocalFiles">
            <div class="upload-info">
              <p>{{ t("submit.video.batchUploadCta", { max: MAX_LOCAL_FILES }) }}</p>
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
          <div v-for="(item, index) in localItems" :key="item.uid" class="batch-file-item" :class="item.status">
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
                  <span class="action-link move" :class="{ disabled: index === localItems.length - 1 }" @click="moveLocalItem(index, 1)">{{ t('submit.video.batchMoveDown') }}</span>
                  <span class="action-link remove" @click="removeLocalItem(item)">{{ t('submit.video.batchRemove') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="batch-file-add" v-if="canAddMore">
            <button class="btn" @click="pickLocalFiles">{{ t('submit.video.batchAddMore') }}</button>
            <span class="batch-file-add-tip">{{ t('submit.video.batchUploadCta', { max: MAX_LOCAL_FILES }) }}</span>
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
      </div>

      <!-- 本地批量上传：选好文件后下面才出合集 / 权限 / 每集标题 -->
      <div class="content-wrapper" v-if="isBatchPublish">
        <!-- Batch mode: collection + batch settings in one white container -->
        <div class="batch-collection-perm-wrapper">
          <div class="collection-section">
            <div class="form-item">
              <div class="collection-row">
                <div class="collection-group">
                  <div class="form-label-inner">
                    <label class="form-label"><b>*</b>{{ t("submit.collection") }}</label>

                    <div class="info-icon" @mouseover="adjustTooltipPosition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <div class="info-tooltip">
                        <div class="tooltip-content">
                          <div v-html="t('submit.collectionInfo')"></div>
                        </div>
                      </div>
                    </div>

                    <span v-if="publishedCount > 0" class="batch-published-info">{{ t('novel.batchPublish.publishedInCollection', { count: publishedCount }) }}</span>

                    <div class="switch-collection-btn" @click="openCollectionListModal">
                      <span>{{ t('collection.switchCollection') }}</span>
                      <img src="@/assets/images/publish/switch.png" alt="" />
                    </div>
                  </div>

                  <div class="collection-display">
                    <div class="collection-info" v-if="selectedCollection">
                      <img v-if="selectedCollection.cover" :src="processImageUrl(selectedCollection.cover)" alt="" class="collection-cover" />
                      <div class="collection-text">
                        <div class="collection-top">
                          <!-- 标题单独一行；价格挪到下面「是否含敏感内容」开关后面 -->
                          <div class="collection-title-row">
                            <span class="collection-name">{{ selectedCollection.name }}</span>
                          </div>
                          <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
                        </div>

                        <div class="content-sensitive" v-if="contentSwitch.showSensitiveToggle">
                          <div class="sensitive-left" v-if="contentSwitch.showSensitiveToggle">
                            <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>

                            <div class="info-icon" @mouseover="adjustTooltipPosition">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              <div class="info-tooltip">
                                <div class="tooltip-content">
                                  <div v-html="t('submit.sensitiveContent')"></div>
                                </div>
                              </div>
                            </div>

                            <img
                              class="sensitive-switch"
                              :src="selectedCollection?.is_nsfw == 1 ? requireSwitchOn : requireSwitchOff"
                              alt=""
                              @click="toggleCollectionSensitive"
                            />
                          </div>
                        </div>
                        <div class="content-language">
                          <label class="form-label">{{ t('submit.language') }}</label>
                          <!-- 下拉框和「修改合集信息」同一行；窄屏下换成两行 -->
                          <div class="lang-row">
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
                                  :class="{ active: collectionLanguage === opt.key }"
                                  @click="handleCollectionLanguageChange(opt.key)"
                                >{{ t(opt.labelKey) }}</div>
                              </div>
                            </div>
                            <span class="modify-link" v-if="selectedCollection" @click="handleEditCollection">{{ t('collection.modifyCollection') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="collection-info clickable" @click="openCollectionListModal" v-else>
                      <span class="collection-name no-collection">{{ t('collection.noCollection') }}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div class="batch-perm-settings">
            <span class="batch-perm-title">{{ t('novel.batchPublish.batchSettings') }}</span>
            <div class="batch-perm-options">
              <div
                class="perm-option"
                :class="{ active: batchPermission === opt.key }"
                v-for="(opt, index) in batchPermOptions"
                :key="opt.key"
                @click="handleBatchPermissionChange(opt.key, index)"
              >
                <img :src="batchPermission === opt.key ? selectActive : select" alt="" />
                <span v-if="opt.key === 'partial'">
                  {{ t('novel.batchPublish.partialStart') }}
                  <span class="partial-chapter-inline-select" @click.stop="handleInlineChapterSelect($event)">
                    <input
                      type="number"
                      class="partial-chapter-inline-input"
                      v-model.number="batchPartialStartChapter"
                      @click.stop
                      :min="1"
                    />
                    <img src="@/assets/images/publish/arrow_icon.png" alt="Down" />
                    <div v-if="showBatchChapterDropdown && batchPermission === 'partial'" class="partial-chapter-dropdown">
                      <div
                        v-for="ch in batchCollectionChapterList"
                        :key="ch"
                        class="partial-chapter-dropdown-item"
                        :class="{ selected: batchPartialStartChapter === ch }"
                        @click.stop="selectBatchPartialStart(ch)"
                      >
                        {{ ch }}
                      </div>
                    </div>
                  </span>
                  {{ t('novel.batchPublish.partialEndDrama') }}
                </span>
                <span v-else>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
            <!-- 选了「付费用户可见」：列出合集的付费档位，发布时同步到合集 -->
            <div class="plan-list" v-if="batchPermission === 'partial' && bookPlans.length">
              <span class="plan-list-label">{{ t('submit.singlePrice') }}</span>
              <div class="plan-options">
                <div class="plan-option" v-for="plan in bookPlans" :key="planKey(plan)" @click="selectedPlanId = planKey(plan)">
                  <img :src="selectedPlanId === planKey(plan) ? selectActive : select" alt="" />
                  <span>{{ planLabel(plan) }}</span>
                </div>
              </div>
              <!-- 右侧：收益分成说明，点图标弹说明弹窗 -->
              <span class="plan-revenue" @click.stop="showRevenueInfo = true">{{ t('submit.revenueShare') }}<svg class="revenue-info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span>
            </div>
          </div>
        </div>

        <!-- 每集标题：默认取文件名，合集中的序号按列表顺序接在已有集数后面 -->
        <div class="batch-chapter-edit-section">
          <span class="batch-edit-title">{{ t('novel.batchPublish.chapterTitleEdit') }}</span>

          <div class="batch-chapter-list">
            <div
              v-for="chapter in batchVisibleChapters"
              :key="chapter.uid"
              class="batch-chapter-item"
            >
              <span class="batch-chapter-label">{{ t('submit.video.episode', { episode: chapter.chapter }) }}：{{ chapter.title }}</span>
              <div class="batch-chapter-fields">
                <div class="batch-field-label">
                  <span class="required">*</span>
                  <span class="field-name">{{ t('novel.batchPublish.chapterTitleLabel') }}</span>
                </div>
                <span class="batch-char-count">({{ getBatchChapterTitleLength(chapter.chapter) }}/60)</span>
                <div class="batch-field-order">
                  <span class="order-label">{{ t('novel.batchPublish.collectionOrder') }}</span>
                  <span class="order-value">{{ getCollectionOrder(chapter.chapter) }}</span>
                </div>
              </div>
              <div class="batch-chapter-input-wrap">
                <input
                  type="text"
                  class="batch-chapter-input"
                  :value="getBatchChapterTitle(chapter.chapter)"
                  @input="updateBatchChapterTitle(chapter.chapter, $event)"
                  :placeholder="t('novel.batchPublish.chapterTitlePlaceholder')"
                  maxlength="60"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span class="agreement-text"
            >{{ t("submit.agree") }}<span class="terms-text">{{ t("submit.terms") }}</span></span
          >
        </div>
        <!-- Submit -->
        <div class="submit-row">
          <button class="submit" :disabled="isPublishing" @click="onBatchPublish">
            {{ t("submit.submit") }}
          </button>
        </div>
      </div>
    </div>

    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
    />

    <ConfirmLeaveModal :show="isShowConfirm" @confirm="confirmLeave" @cancel="cancelLeave" />

    <PreviewModal
      :visible="showPreviewModal"
      :videoUrl="videoPreviewUrl"
      @close="closePreview"
    />

    <CustomToast :visible="toastShow" :message="toastMsg" :icon="toastIcon" :theme="toastTheme" />

    <!-- Community Convention Modal -->
    <CommunityConventionModal
      :visible="showConventionModal"
      @cancel="closeConventionModal"
      @confirm="confirmConvention"
    />

    <!-- 已发布 N 部单部付费漫剧但没开通订阅：点「付费用户可见」时引导设置订阅月费 -->
    <DramaSubscribePromptModal
      :visible="showSubscribePrompt"
      :count="paidDramaCount"
      @cancel="onSubscribePromptCancel"
      @saved="onSubscribePromptSaved"
    />
    <!-- 「收益分成80%」旁的说明 -->
    <TextInfoModal :visible="showRevenueInfo" :text="t('user.subscription.tip')" @close="showRevenueInfo = false" />

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-if="showEditCollectionModal"
      :visible="showEditCollectionModal"
      :is-edit="editingCollectionId !== null"
      :collection-id="editingCollectionId || ''"
      :collection-name="isCreateFromCollectionList ? projectNameForNewCollection : ''"
      :cover-url="isCreateFromCollectionList ? projectCoverForNewCollection : ''"
      :is-nsfw="0"
      :type="3"
      :session-id="''"
      :story-summary="''"
      :language="collectionLanguage"
      @close="handleCloseEditCollectionModal"
      @save="handleSaveCollection"
    />

    <!-- Switch Collection Confirm Modal -->
    <SwitchCollectionModal
      :visible="showSwitchCollectionModal"
      @close="handleCloseSwitchCollectionModal"
      @confirm="handleConfirmSwitchCollection"
    />

    <!-- Collection List Modal -->
    <CollectionListModal
      v-model="collectionListSelectedId"
      :visible="showCollectionListModal"
      :uid="uid"
      :type="3"
      @close="handleCloseCollectionListModal"
      @select="handleSelectCollectionCard"
      @confirm="handleSelectCollectionFromModal"
      @create="handleCreateCollectionFromModal"
    />

    <!-- 本地批量上传进度（上传期间遮罩整页） -->
    <BatchUploadProgressDialog :visible="isUploadingAny" :items="localItems" />

    <!-- Batch Publish Progress Dialog -->
    <BatchPublishProgressDialog
      :visible="showBatchPublishProgress"
      :chapters="batchPublishChapterStatuses"
      @close="showBatchPublishProgress = false"
      @complete="handleBatchPublishComplete"
    />

    <!-- Batch Publish Fail Dialog -->
    <BatchPublishFailDialog
      :visible="showBatchPublishFail"
      :chapters="batchPublishFailChapters"
      :failed-chapter="batchPublishFailedChapter"
      @close="showBatchPublishFail = false"
      @exit="handleBatchPublishExit"
      @retry="handleBatchPublishRetry"
    />
  </div>
</template>

<script setup lang="ts" name="PublishVideoBatch">
import Header from "@/components/Header.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import CustomToast from "@/components/CustomToast.vue";
import PreviewModal from "@/components/PreviewModal.vue";
import CommunityConventionModal from "@/components/CommunityConventionModal.vue";
import DramaSubscribePromptModal from "@/components/DramaSubscribePromptModal.vue";
import TextInfoModal from "@/components/TextInfoModal.vue";
import CollectionListModal from "@/components/CollectionListModal.vue";
import EditCollectionModal from "@/components/EditCollectionModal.vue";
import SwitchCollectionModal from "@/components/SwitchCollectionModal.vue";
import BatchPublishProgressDialog from "@/components/BatchPublishProgressDialog.vue";
import BatchUploadProgressDialog from "@/components/BatchUploadProgressDialog.vue";
import BatchPublishFailDialog from "@/components/BatchPublishFailDialog.vue";
import api from "@/api/index";
import { useContentSwitchStore } from "@/stores/contentSwitch";
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import {
  fetchBookRechargePlans,
  planPriceText,
  planPriceOf,
  planCurrencyOf,
  planIdOf,
  type BookRechargePlan,
} from "@/util/bookRechargePlan";
import { trackClickPublishButton } from "@/utils/analytics";
import router from "@/router";
import { processImageUrl, apiErrorMessage } from '@/util/utils';

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import checkboxActive from "@/assets/images/register/check_active.png";
import checkboxInactive from "@/assets/images/register/check.png";
import requireSwitchOn from "@/assets/images/home/open.png";
import requireSwitchOff from "@/assets/images/publish/close.png";
import { baseUrl } from "@/util/config";
import { uploadVideoFile, PartUploadError } from "@/util/uploadVideo";

const isEditing = computed(() => !!postId.value);

const { t, locale } = useI18n();
const contentSwitch = useContentSwitchStore();

function getI18nMsg(res: any) {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: 'msg_cn', jp: 'msg_jp', tc: 'msg_tc' };
  const key = msgMap[lang];
  return (key && res?.[key]) || res?.msg || t('fail');
}

// State
const isUpload = ref(false);

function adjustTooltipPosition(event: MouseEvent) {
  const infoIcon = event.currentTarget as HTMLElement;
  const tooltip = infoIcon.querySelector('.info-tooltip') as HTMLElement;
  if (tooltip) {
    tooltip.classList.remove('tooltip-align-left', 'tooltip-fixed', 'tooltip-above');
    tooltip.style.position = '';
    tooltip.style.top = '';
    tooltip.style.bottom = '';
    tooltip.style.left = '';
    tooltip.style.right = '';
    tooltip.style.marginTop = '';
    tooltip.style.removeProperty('--arrow-left');

    const infoIconRect = infoIcon.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const tooltipWidth = 280;
    const margin = 10;

    const wouldOverflowLeft = infoIconRect.right - tooltipWidth < margin;
    const wouldOverflowRight = infoIconRect.left + tooltipWidth > windowWidth - margin;

    // 下方放不下（且上方放得下）就翻到图标上方显示
    const tooltipHeight = tooltip.offsetHeight || 0;
    const spaceBelow = window.innerHeight - infoIconRect.bottom;
    const showAbove = tooltipHeight > 0
      && spaceBelow < tooltipHeight + margin + 10
      && infoIconRect.top > tooltipHeight + margin + 10;
    if (showAbove) tooltip.classList.add('tooltip-above');

    if (!wouldOverflowLeft) return;

    if (!wouldOverflowRight) {
      tooltip.classList.add('tooltip-align-left');
      return;
    }

    tooltip.classList.add('tooltip-align-left', 'tooltip-fixed');
    tooltip.style.position = 'fixed';
    tooltip.style.top = showAbove
      ? `${infoIconRect.top - tooltipHeight - 10}px`
      : `${infoIconRect.bottom + 10}px`;
    tooltip.style.left = `${margin}px`;
    tooltip.style.right = 'auto';
    tooltip.style.marginTop = '0';

    const iconCenterX = infoIconRect.left + infoIconRect.width / 2;
    const arrowOffset = iconCenterX - margin;
    tooltip.style.setProperty('--arrow-left', `${Math.max(8, Math.min(arrowOffset, tooltipWidth - 20))}px`);
  }
}

const uploadSuccess = ref(false);

const isBatchRoute = computed(() => route.query.batch === 'true');
const uploadError = ref("");
const uploadProgress = ref(0);
// 仅用于分片上传期间的遮罩文案；uploadProgress 需在上传完成后保持 100 以撑满进度条
const videoUploadPercent = ref(0);
const videoSize = ref(0);
const videoDuration = ref(0);
const videoType = ref("");
const videoFile = ref<File | null>(null);
const videoUrl = ref("");
const coverPreview = ref("");
const showCoverModal = ref(false);
const agreeTerms = ref(true);
const sessionId = ref("");

const videoInputRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const captionRef = ref<HTMLDivElement | null>(null);

// Check if in edit mode
const route = useRoute();
const postId = ref(route.query.post_id as string);
const chapterIdForPublish = ref<number | null>(null);

const showPreviewModal = ref(false);
const videoPreviewUrl = ref("");

const isShowConfirm = ref(false);
const pendingRoute = ref<{ path: string } | null>(null);
const tabIndex = ref(-1);

const TITLE_MAX = 60;
const DESC_MAX = 4000;

const uid = localStorage.getItem("uid") || '';

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "yes",
});

const defaultLang = ({ en: "en", jp: "jp", zh: "cn", tc: "tc", ko: "ko", th: "th" }[locale.value] || "en");

const langOptions = [
  { key: "en", labelKey: "submit.langEn" },
  { key: "jp", labelKey: "submit.langJp" },
  { key: "cn", labelKey: "submit.langZh" },
  { key: "tc", labelKey: "submit.langTc" },
  { key: "ko", labelKey: "submit.langKo" },
  { key: "th", labelKey: "submit.langTh" },
];

const langDropdownOpen = ref(false);
const langDropdownUp = ref(false);
const langDropdownRef = ref<HTMLElement | null>(null);
const collectionLanguage = ref(defaultLang);

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
  const opt = langOptions.find((o) => o.key === collectionLanguage.value);
  return opt ? t(opt.labelKey) : "";
});

async function handleCollectionLanguageChange(key: string) {
  langDropdownOpen.value = false;
  if (key === collectionLanguage.value) return;
  const prevLang = collectionLanguage.value;
  collectionLanguage.value = key;
  if (selectedCollection.value) {
    try {
      await api.modifyCollection({ book_id: selectedCollection.value.id, language: key });
    } catch (e) {
      collectionLanguage.value = prevLang;
      toast(t('fail'));
    }
  }
}

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  // 漫剧的「订阅用户可见」对外叫「付费用户可见」（值还是 partial / access_rights 2，只是文案）
  { key: "partial", labelKey: "submit.permPaid" },
  // 漫剧不提供「仅自己可见」
];

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

// Dropdown state
const showDropdown = ref(false);
const isComposingText = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);

const showSensitiveConfirm = ref(false);
const pendingCollectionIdForSensitive = ref<number | null>(null);

const toastShow = ref(false);
const toastMsg = ref("");
const toastIcon = ref("");
const toastTheme = ref("pink");
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const titleError = ref(false);

const userRegion = ref(false);
const hasActiveSubscription = ref(false);
const isAdult = ref(false);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const uploadOption = ref('local'); // 这页只有本地上传

const uploadOptions = [
  {
    id: 'history',
    value: 'history',
    label: 'submit.image.uploadFromHistory'
  },
  {
    id: 'local',
    value: 'local',
    label: 'submit.video.localUpload'
  }
];

// Tab list
const tabList = [
  {
    name: t("submit.tabs.video"),
    path: "/publish/clip",
  },
  {
    name: t("submit.tabs.photo"),
    path: "/publish/image",
  },
  {
    name: t("submit.tabs.manhua"),
    path: "/publish/comic",
  },
  {
    name: t("submit.tabs.novel"),
    path: "/publish/novel",
  }
];


// Project list
const projects = ref<any[]>([]);
const selectedProjectId = ref('');
const selectedProject = ref<any>(null);
const isLoadingProjects = ref(true);

// Pagination
const currentPage = ref(1);
const totalProjects = ref(1000);
const pageSize = ref(8);

// Episode selection
const selectedEpisode = ref<number | null>(null);

// View modal
const showViewModal = ref(false);
const selectedModalEpisode = ref(null);

// Chapter dropdown
const showChapterDropdown = ref(false);
const chapterDropdownPosition = ref<'top' | 'bottom'>('bottom');

// Project details cache
const projectDetailsCache = ref<Record<string, any>>({});

// Preview modal project (separate from selected project)
const previewProject = ref<any>(null);

// Collection
const selectedCollection = ref<{ id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number; language?: string; price?: string | number; currency?: string; plan_id?: string } | null>(null);

// --- 漫剧合集的收费档 -------------------------------------------------------
// 页面本身不拉档位列表：合集的 price / currency 都由接口（或编辑弹窗）直接给，
// 这里只把它换算成展示文案。合集没存过价格，这一行就不渲染。

// 「付费用户可见」下面的合集付费档位列表。页面加载时拉一次（fetch 内部有缓存）。
const bookPlans = ref<BookRechargePlan[]>([]);
const selectedPlanId = ref<string>('');
const planKey = (plan: BookRechargePlan) => String(plan.plan_id ?? plan.id ?? '');
const planLabel = (plan: BookRechargePlan) => `${planPriceText(plan, t('aiRecharge.unit'))}/${t('submit.perSeries')}`;
async function loadBookPlans() {
  try {
    bookPlans.value = await fetchBookRechargePlans();
  } catch {
    bookPlans.value = [];
  }
  syncSelectedPlanFromCollection();
}
// 默认选中：合集已设的档位（按价格匹配），没有就第一档
function syncSelectedPlanFromCollection() {
  const plans = bookPlans.value;
  if (!plans.length) return;
  const curId = selectedCollection.value?.plan_id;
  const price = selectedCollection.value?.price;
  const hit = (curId && curId !== '0' ? plans.find(pl => planKey(pl) === curId) : undefined)
    || (price !== undefined && price !== null && price !== ''
      ? plans.find(pl => String(pl.price) === String(price))
      : undefined);
  selectedPlanId.value = planKey(hit || plans[0]);
}
watch(() => selectedCollection.value?.id, () => syncSelectedPlanFromCollection());
/**
 * 发布前把列表里选的档位同步到合集：「付费用户可见」且已有合集时，每次发布都调修改合集接口传 plan_id。
 * 失败只提示，不阻塞发布（作品照常发，价格保持合集原来的）。
 */
async function syncCollectionPlan(permission: string) {
  if (permission !== 'partial' || !selectedCollection.value?.id) return;
  const plan = bookPlans.value.find(pl => planKey(pl) === selectedPlanId.value);
  if (!plan) return;
  // 每次发布都把选中的档位写到合集上：old_plan_id = 合集当前档位（没设过传 0），new_plan_id = 选中的档位
  try {
    const res = await api.modifyCollection({
      book_id: selectedCollection.value.id,
      old_plan_id: selectedCollection.value.plan_id || 0,
      new_plan_id: planKey(plan),
    }) as any;
    if (res.code == 0 || res.code == 200) {
      selectedCollection.value.plan_id = planKey(plan);
      selectedCollection.value.price = plan.price;
      selectedCollection.value.currency = plan.currency || selectedCollection.value.currency;
    } else {
      toast(apiErrorMessage(res) || t('fail'));
    }
  } catch (e) {
    console.error('sync collection plan failed', e);
  }
}
const collectionPriceText = computed(() => {
  const price = selectedCollection.value?.price;
  if (price === undefined || price === null || price === '') return '';
  // 金额是美分，currency 缺省时也按 usd 缩放
  const currency = selectedCollection.value?.currency || 'usd';
  return planPriceText({ id: '', price: String(price), currency }, t('aiRecharge.unit'));
});

// 来源作品生成时用的是不是无限制模式。
// switch_no = 0 时发布页不显示「敏感内容」勾选，is_nsfw 只能由这里推导。
const sourceIsNsfw = computed(() => {
  const project: any = selectedProject.value;
  const storyMode = project?.user_selected?.story_mode || project?.story_mode;
  return storyMode === 'nsfw' ? 1 : 0;
});

const computedIsNsfw = computed(() => {
  // 中国地区 + 后端下发 2：展示上按普通模式走，但内容仍是 NSFW，发布照 1 传
  if (contentSwitch.nsfwDowngraded) return 1;
  // switch_no = 0：允许创作 NSFW，但发布页不给手动勾选，按生成时的模式判定
  if (contentSwitch.mode === 0) return sourceIsNsfw.value;
  if (contentSwitch.mode === 2) return 1;
  return selectedCollection.value?.is_nsfw ?? 0;
});
const editingCollectionId = ref<string | number | null>(null);
const showEditCollectionModal = ref(false);
const isCollectionHovered = ref(false);
const selectedCollectionId = ref<number | ''>(''); // Keep for backward compatibility
const selectedEpisodeNumber = ref('1');
const showCollectionDropdown = ref(false);
const showEpisodeDropdown = ref(false);
const collectionDropdownPosition = ref<'top' | 'bottom'>('bottom');
const episodeDropdownPosition = ref<'top' | 'bottom'>('bottom');
const showCollectionListModal = ref(false);
const collectionListSelectedId = ref<string | number | null>(null);
const isCreateFromCollectionList = ref(false);
const projectNameForNewCollection = ref('');
const projectCoverForNewCollection = ref('');
const showSwitchCollectionModal = ref(false);
const switchCollectionWarningShown = ref(false);
const pendingCollectionId = ref<number | null>(null);
const pendingCollectionData = ref<any>(null);
const isEditingWork = ref(false);
const isNoCollection = ref(true);
const collections = ref<any[]>([]);
const episodes = ref([
  { value: '1', label: '1' },
]);

// Collection pagination
const collectionDropdownRef = ref<HTMLDivElement | null>(null);
const currentCollectionPage = ref(1);
const collectionPageSize = ref(20);
const hasMoreCollections = ref(true);
const isLoadingCollections = ref(false);

// Community Convention Modal
const showConventionModal = ref(false);

// 漫剧发布页不检查博主有没有开通订阅（选「付费用户可见」直接生效）。
// 只在「已发布 ≥ PAID_DRAMA_PROMPT_COUNT 部单部付费漫剧、且还没开通订阅」时，点「付费用户可见」弹一次引导设置订阅月费。
const PAID_DRAMA_PROMPT_COUNT = 10;
const paidDramaCount = ref(0);
const showSubscribePrompt = ref(false);
const showRevenueInfo = ref(false);
// 只要还没开通订阅且付费漫剧已满 10 部，每次点「付费用户可见」都弹；保存成功后 hasActiveSubscription 变 true 就不再弹。
// 页面进入时拉的数据可能已经过期（另一个窗口发了作品 / 设了订阅），所以每次点击都重新拉一次
// 个人信息（priced_book_count）和订阅状态再判断；请求期间重复点击直接忽略。
// 返回 true 表示弹了窗（这次不选中「付费用户可见」，等弹窗里设置成功后再补选）；返回 false 表示可以直接选中。
let checkingPaidDrama = false;
let pendingPaidAction: (() => void) | null = null;
async function maybePromptSubscription(permission: string): Promise<boolean> {
  if (permission !== 'partial') return false;
  if (checkingPaidDrama) return true;
  checkingPaidDrama = true;
  try {
    const [infoRes] = await Promise.all([
      api.userInfo() as Promise<any>,
      checkSubscriptionStatus(),
    ]);
    if (infoRes?.code === 0 && infoRes.data) {
      paidDramaCount.value = Number(infoRes.data.priced_book_count ?? 0) || 0;
    }
  } catch (e) {
    console.error('refresh paid drama count failed', e);
  } finally {
    checkingPaidDrama = false;
  }
  if (hasActiveSubscription.value || paidDramaCount.value < PAID_DRAMA_PROMPT_COUNT) return false;
  showSubscribePrompt.value = true;
  return true;
}
// 弹窗点「不设置订阅」/ 关闭：不选中付费，丢掉待执行的选择
function onSubscribePromptCancel() {
  showSubscribePrompt.value = false;
  pendingPaidAction = null;
}
// 弹窗里已调 modifySubscription 设好订阅价格；这里先按已开通处理，再重新拉一次订阅状态以服务端为准
function onSubscribePromptSaved() {
  showSubscribePrompt.value = false;
  hasActiveSubscription.value = true;
  checkSubscriptionStatus();
  // 订阅设好了，补上刚才被拦下的「付费用户可见」选择
  const action = pendingPaidAction;
  pendingPaidAction = null;
  action?.();
}

// Computed
const captionLength = ref(0);
const canSubmit = computed(() => {
  return uploadSuccess.value && selectedCollection.value && coverPreview.value;
});



// Check if selected chapter is already published
const isChapterPublished = computed(() => {
  if (!selectedProject.value?.chapters || !selectedEpisode.value) return false;
  const chapter = selectedProject.value.chapters.find((c: any) => c.chapter === selectedEpisode.value);
  return chapter?.is_publish == 1;
});

const isLoadingBatchPublish = ref(false);
const isSelectionLoading = ref(false);
let isSelectionCancelled = false;

const batchChapterTitles = ref<Record<number, string>>({});
const batchChapterContents = ref<Record<number, string>>({});

const batchPermission = ref<'public' | 'partial' | 'private'>('public');
const batchPartialStartChapter = ref<number>(1);
const showBatchChapterDropdown = ref(false);

const batchPermOptions = [
  { key: 'public', labelKey: 'submit.permPublic' },
  { key: 'partial', labelKey: 'submit.permPaid' },
  // 漫剧不提供「仅自己可见」
];

// ============================== 本地批量上传 ==============================
// 一次最多 MAX_LOCAL_FILES 个视频；列表顺序 = 合集里的集数顺序（接在合集已有集数后面）。
// 同时只传 UPLOAD_CONCURRENCY 个，传完一个补一个；每个文件各自的进度 / 状态。
// 封面：和单个本地上传一样，用合集的封面（同一合集各集封面相同），不截视频帧。
const MAX_LOCAL_FILES = 20;
const UPLOAD_CONCURRENCY = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

type LocalItemStatus = 'waiting' | 'uploading' | 'success' | 'fail';
interface LocalItem {
  uid: number;
  file: File;
  name: string;
  /** 发布用的标题，默认文件名去掉扩展名 */
  title: string;
  size: number;
  duration: number;
  status: LocalItemStatus;
  progress: number;
  url: string;
  errorMsg: string;
  localSessionId: string;
}

const localItems = ref<LocalItem[]>([]);
const localInputRef = ref<HTMLInputElement | null>(null);
let localItemSeq = 0;
let activeUploads = 0;
const isPublishing = ref(false);

const isBatchPublish = computed(() => localItems.value.length > 0);
const canAddMore = computed(() => localItems.value.length < MAX_LOCAL_FILES);
const allUploaded = computed(() => localItems.value.length > 0 && localItems.value.every(i => i.status === 'success'));
/** 还有在传 / 排队的就罩住整页，传完（成功或失败）自动放开 */
const isUploadingAny = computed(() => localItems.value.some(i => i.status === 'uploading' || i.status === 'waiting'));
/** 第 1..n 个文件，沿用批量发布那套按「章节号」走的逻辑（权限起始集、进度弹窗） */
const selectedChapters = computed(() => localItems.value.map((_, i) => i + 1));
/** 合集里已有的集数：新一集的序号 - 1 */
const publishedCount = computed(() => Math.max(0, (parseInt(selectedEpisodeNumber.value) || 1) - 1));
const batchVisibleChapters = computed(() => localItems.value.map((item, i) => ({ chapter: i + 1, title: item.name, uid: item.uid })));

function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function getBatchChapterTitle(chapterNum: number): string {
  return localItems.value[chapterNum - 1]?.title || '';
}

function getBatchChapterTitleLength(chapterNum: number): number {
  return getBatchChapterTitle(chapterNum).length;
}

function getCollectionOrder(chapterNum: number): number {
  const start = parseInt(selectedEpisodeNumber.value) || 1;
  return start + chapterNum - 1;
}

function updateBatchChapterTitle(chapterNum: number, event: Event) {
  const item = localItems.value[chapterNum - 1];
  if (item) item.title = (event.target as HTMLInputElement).value;
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
  const room = MAX_LOCAL_FILES - localItems.value.length;
  if (room <= 0) {
    toast(t('submit.video.batchLimit', { max: MAX_LOCAL_FILES }));
    return;
  }
  let list = files;
  if (files.length > room) {
    toast(t('submit.video.batchLimit', { max: MAX_LOCAL_FILES }));
    list = files.slice(0, room);
  }
  for (const file of list) {
    if (!validateVideoFormat(file)) continue;
    if (file.size > MAX_FILE_SIZE) {
      toast(t('submit.video.sizeError'));
      continue;
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
      continue;
    }
    localItems.value.push({
      uid: ++localItemSeq,
      file,
      name: file.name,
      title: fileBaseName(file.name).substring(0, 60),
      size: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
      duration: meta.duration,
      status: 'waiting',
      progress: 0,
      url: '',
      errorMsg: '',
      localSessionId: '',
    });
  }
  pumpUploads();
}

/** 补位：没到并发上限就从等待队列里拿下一个开始传 */
function pumpUploads() {
  while (activeUploads < UPLOAD_CONCURRENCY) {
    const next = localItems.value.find(i => i.status === 'waiting');
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
  if (isPublishing.value) return;
  replaceTargetUid = item.uid;
  replaceInputRef.value?.click();
}

async function onReplaceFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  const item = localItems.value.find(i => i.uid === replaceTargetUid);
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
  if (isPublishing.value) return;
  const idx = localItems.value.indexOf(item);
  if (idx !== -1) localItems.value.splice(idx, 1);
  // 正在传的那份删了也拦不住分片请求，让它传完就是了，结果不会再写回列表
}

function moveLocalItem(index: number, delta: number) {
  if (isPublishing.value) return;
  const target = index + delta;
  if (target < 0 || target >= localItems.value.length) return;
  const list = localItems.value;
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

// 还在传 / 还在发布时关页面或刷新，浏览器先问一声
function warnBeforeUnload(e: BeforeUnloadEvent) {
  const busy = isPublishing.value || localItems.value.some(i => i.status === 'uploading' || i.status === 'waiting');
  if (!busy) return;
  e.preventDefault();
  e.returnValue = '';
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload));

function goBack() {
  if (localItems.value.length > 0) {
    isShowConfirm.value = true;
    return;
  }
  router.go(-1);
}

async function onBatchPublish() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }
  if (localItems.value.length === 0) {
    toast(t('submit.video.batchNoFile'));
    return;
  }
  if (!allUploaded.value) {
    toast(t('submit.video.batchNotFinished'));
    return;
  }
  if (!selectedCollection.value) {
    toast(t('collection.noCollection'));
    return;
  }
  if (!agreeTerms.value) {
    showConventionModal.value = true;
    return;
  }

  batchPublishChapterStatuses.value = selectedChapters.value.map(chapter => ({
    chapter,
    status: 'waiting' as const
  }));
  showBatchPublishProgress.value = true;

  await runBatchPublishLoop();
}

async function runBatchPublishLoop() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  isPublishing.value = true;
  const collectionStart = parseInt(selectedEpisodeNumber.value) || 1;
  const items = localItems.value.slice();

  for (let i = 0; i < items.length; i++) {
    // 跳过已发布成功的，仅重试失败 / 未发布的
    if (batchPublishChapterStatuses.value[i]?.status === 'success') {
      continue;
    }

    const item = items[i];
    const collectionChapterIndex = collectionStart + i;
    batchPublishChapterStatuses.value[i].status = 'publishing';

    try {
      const title = (item.title.trim() || fileBaseName(item.name)).substring(0, 60);

      const accessRights = batchPermission.value === 'partial'
        ? (collectionChapterIndex >= batchPartialStartChapter.value ? 2 : 1)
        : batchPermission.value === 'private' ? 3 : 1;

      const payload: any = {
        type: 3,
        title,
        cover: coverPreview.value || (selectedCollection.value?.cover || ''),
        content: '',
        is_nsfw: computedIsNsfw.value,
        access_rights: accessRights,
        video_url: item.url,
        book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
        chapter_index: collectionChapterIndex,
        cover_color: '',
        cover_title: '',
      };

      const headers = new Headers();
      const { ts, sign } = window.AntiCrawler.generateAuthParams(token);
      headers.append("token", token);
      headers.append("ts", ts);
      headers.append("sign", sign);
      headers.append("Content-Type", "application/json");
      headers.append("Platform", "web");

      const response = await fetch(`${baseUrl}post/addPost`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const result = await response.text();
      const res = JSON.parse(result);

      if (res.code == 0 || res.code == 200) {
        batchPublishChapterStatuses.value[i].status = 'success';
      } else {
        batchPublishChapterStatuses.value[i].status = 'fail';
        for (let j = i + 1; j < items.length; j++) {
          if (batchPublishChapterStatuses.value[j].status !== 'success') {
            batchPublishChapterStatuses.value[j].status = 'unpublished';
          }
        }
        break;
      }
    } catch (error) {
      console.error(`Error publishing local video ${i + 1}:`, error);
      batchPublishChapterStatuses.value[i].status = 'fail';
      for (let j = i + 1; j < items.length; j++) {
        if (batchPublishChapterStatuses.value[j].status !== 'success') {
          batchPublishChapterStatuses.value[j].status = 'unpublished';
        }
      }
      break;
    }
  }

  // 至少有一集发布成功后，再把「付费用户可见」下选的档位同步到合集
  if (batchPublishChapterStatuses.value.some(item => item.status === 'success')) {
    await syncCollectionPlan(batchPermission.value);
  }
  isPublishing.value = false;
  handleBatchPublishComplete();
}

const batchCollectionChapterList = computed(() => {
  const start = parseInt(selectedEpisodeNumber.value) || 1;
  const count = selectedChapters.value.length;
  const list: number[] = [];
  for (let i = 0; i < count; i++) {
    list.push(start + i);
  }
  return list;
});

watch(batchCollectionChapterList, (list) => {
  if (list.length > 0) {
    if (!list.includes(batchPartialStartChapter.value)) {
      batchPartialStartChapter.value = list[0];
    }
  }
}, { immediate: true });

async function handleBatchPermissionChange(permission: string, _index: number) {
  if (await maybePromptSubscription(permission)) {
    // 先弹订阅设置弹窗，不选中；设置成功后再回来选
    pendingPaidAction = () => handleBatchPermissionChange(permission, _index);
    return;
  }
  batchPermission.value = permission as 'public' | 'partial' | 'private';

  if (permission === 'partial' && batchCollectionChapterList.value.length > 0) {
    batchPartialStartChapter.value = batchCollectionChapterList.value[0];
  }
}

function handleInlineChapterSelect(event: Event) {
  event.stopPropagation();
  if (batchPermission.value !== 'partial') {
    batchPermission.value = 'partial';
    if (batchCollectionChapterList.value.length > 0) {
      batchPartialStartChapter.value = batchCollectionChapterList.value[0];
    }
  }
  showBatchChapterDropdown.value = !showBatchChapterDropdown.value;
}

function selectBatchPartialStart(ch: number) {
  batchPartialStartChapter.value = ch;
  showBatchChapterDropdown.value = false;
}

const showBatchPublishProgress = ref(false);
const showBatchPublishFail = ref(false);
const batchPublishChapterStatuses = ref<{ chapter: number; status: 'success' | 'publishing' | 'waiting' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailChapters = ref<{ chapter: number; status: 'success' | 'fail' | 'unpublished' }[]>([]);
const batchPublishFailedChapter = ref<number | undefined>(undefined);

function handleBatchPublishComplete() {
  showBatchPublishProgress.value = false;
  const successCount = batchPublishChapterStatuses.value.filter(c => c.status === 'success').length;
  const totalCount = batchPublishChapterStatuses.value.length;
  if (successCount === totalCount) {
    handleBatchPublishAllSuccess(totalCount);
  } else {
    batchPublishFailChapters.value = batchPublishChapterStatuses.value.map(c => ({
      chapter: c.chapter,
      status: c.status as 'success' | 'fail' | 'unpublished'
    }));
    const failItem = batchPublishChapterStatuses.value.find(c => c.status === 'fail');
    batchPublishFailedChapter.value = failItem?.chapter;
    showBatchPublishFail.value = true;
  }
}

function handleBatchPublishAllSuccess(count: number) {
  toast(t('novel.batchPublish.allPublishSuccess', { count, unit: t('novel.batchPublish.allPublishSuccessUnitChapter') }));
  // 全部发布成功后和单个发布一样进成功页；「继续发布」回到本页
  router.push('/publish/success?type=batch');
}

function handleBatchPublishExit() {
  showBatchPublishFail.value = false;
  router.push(`/user-home/${uid}?type=3`);
}

function handleBatchPublishRetry() {
  // 将失败/未发布的章节重置为等待状态，保留已成功的章节
  batchPublishChapterStatuses.value.forEach(item => {
    if (item.status !== 'success') {
      item.status = 'waiting';
    }
  });
  showBatchPublishFail.value = false;
  showBatchPublishProgress.value = true;
  runBatchPublishLoop();
}

// Check if a project is selected
const isProjectSelected = computed(() => {
  return !!selectedProject.value && !!selectedEpisode.value;
});

// Collection methods
function toggleCollectionDropdown(event: Event) {
  event.stopPropagation();

  if (!showCollectionDropdown.value) {
    // Calculate dropdown position based on element position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 350; // Estimated dropdown height

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > windowHeight) {
        // Not enough space below, check if there's enough space above
        if (rect.top > dropdownHeight) {
          // Show above
          collectionDropdownPosition.value = 'top';
        } else {
          // Not enough space above either, show below but limit height
          collectionDropdownPosition.value = 'bottom';
        }
      } else {
        // Enough space below, show normally
        collectionDropdownPosition.value = 'bottom';
      }
    } else {
      // Default to bottom if target is not available
      collectionDropdownPosition.value = 'bottom';
    }
  }

  showCollectionDropdown.value = !showCollectionDropdown.value;
  showEpisodeDropdown.value = false;

  if (showCollectionDropdown.value) {
    // Reset pagination and clear collections first
    hasMoreCollections.value = true;
    collections.value = [];
    currentCollectionPage.value = 1;
    fetchCollections(false);
  }
}

function toggleEpisodeDropdown(event: Event) {
  event.stopPropagation();

  if (!showEpisodeDropdown.value) {
    // Calculate dropdown position based on element position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 300; // Estimated dropdown height

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > windowHeight) {
        // Not enough space below, show above
        episodeDropdownPosition.value = 'top';
      } else {
        // Enough space below, show normally
        episodeDropdownPosition.value = 'bottom';
      }
    }
  }

  showEpisodeDropdown.value = !showEpisodeDropdown.value;
  showCollectionDropdown.value = false;
}

function createNewCollection() {
  editingCollectionId.value = null;
  isCreateFromCollectionList.value = false;
  showEditCollectionModal.value = true;
  showCollectionDropdown.value = false;
}

function openCollectionListModal() {
  collectionListSelectedId.value = selectedCollection.value?.id || null;
  showCollectionListModal.value = true;
}

function handleCloseCollectionListModal() {
  showCollectionListModal.value = false;
}

function handleSelectCollectionCard(collection: any) {
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== collection.id) {
    pendingCollectionId.value = collection.id;
    pendingCollectionData.value = collection;
    showSwitchCollectionModal.value = true;
  } else {
    collectionListSelectedId.value = collection.id;
  }
}

async function handleSelectCollectionFromModal(collection: any) {
  showCollectionListModal.value = false;
  await doSelectCollection(collection.id, true, collection);
}

function handleCreateCollectionFromModal() {
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value) {
    pendingCollectionId.value = null;
    pendingCollectionData.value = null;
    showSwitchCollectionModal.value = true;
    return;
  }
  editingCollectionId.value = null;
  isCreateFromCollectionList.value = true;
  showEditCollectionModal.value = true;
}

function handleEditCollection() {
  showCollectionDropdown.value = false;

  if (selectedCollection.value) {
    const currentCollection = selectedCollection.value;
    editingCollectionId.value = currentCollection.id;

    // Ensure cover and description are available - fetch from collections array if missing
    const collection = collections.value.find(c => c.id === currentCollection.id);

    if (collection) {
      selectedCollection.value = {
        ...currentCollection,
        cover: collection.cover || currentCollection.cover,
        description: collection.description || currentCollection.description
      };
    }
  } else {
    editingCollectionId.value = null;
  }

  isCreateFromCollectionList.value = false;
  showEditCollectionModal.value = true;
}

function handleCloseEditCollectionModal() {
  showEditCollectionModal.value = false;
}

async function selectCollection(id: number) {
  if (!route.query.session_id && !selectedProject.value?.session_id && !sessionId.value && !postId.value) {
    await doSelectCollection(id);
    return;
  }
  if (uploadOption.value !== 'local' && isEditingWork.value && !switchCollectionWarningShown.value && selectedCollection.value && selectedCollection.value.id !== id) {
    pendingCollectionId.value = id;
    showSwitchCollectionModal.value = true;
    showCollectionDropdown.value = false;
    return;
  }

  await doSelectCollection(id);
}

async function doSelectCollection(id: number, skipSensitiveCheck = false, collectionData?: any) {
  const collection = collectionData || collections.value.find(c => c.id === id);
  if (collection) {
    if (!skipSensitiveCheck && collection.is_nsfw == 1 && form.value.content == 'no') {
      const dontAsk = localStorage.getItem('sensitiveDontAsk');
      if (dontAsk == '1') {
        form.value.content = 'yes';
      } else {
        pendingCollectionIdForSensitive.value = id;
        showSensitiveConfirm.value = true;
        return;
      }
    }

    selectedCollection.value = {
      id: collection.id,
      name: collection.title,
      cover: collection.cover,
      description: collection.description,
      is_nsfw: collection.is_nsfw ?? 0,
      language: collection.language || collectionLanguage.value,
      // 价格读接口新下发的 plan，没有再退回老的顶层 price
      price: planPriceOf(collection),
      currency: planCurrencyOf(collection),
      plan_id: planIdOf(collection)
    };

    coverPreview.value = collection.cover || '';

    try {
      // Request collection details to get the current chapter count
      const response = await api.singleCollectionIndex(id) as any;
      if (response.code == 0 && response.data) {
        // Get the total chapter count from the response
        const allnum = response.data.count || 0;
        const defaultEpisode = parseInt(allnum) + 1;
        selectedEpisodeNumber.value = defaultEpisode.toString();

        // Update episodes array based on collection chapters
        episodes.value = [];
        // 先添加已有的章节
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: (index + 1).toString()
            });
          });
        } else if (collection.chapters && collection.chapters.length > 0) {
          // Fallback to collection.chapters if response.data.data is not available
          collection.chapters.forEach((chapter: any, index: number) => {
            episodes.value.push({
              value: (index + 1).toString(),
              label: (index + 1).toString()
            });
          });
        }
        // 添加新的一集
        episodes.value.push({
          value: defaultEpisode.toString(),
          label: defaultEpisode.toString()
        });
      }
    } catch (error) {
      console.error('Error fetching collection details:', error);
      // Fallback to local chapter count if API call fails
      const chapterCount = collection.chapters ? collection.chapters.length : 0;
      const defaultEpisode = chapterCount + 1;
      selectedEpisodeNumber.value = defaultEpisode.toString();

      // Update episodes array based on collection chapters
      episodes.value = [];
      // 先添加已有的章节
      if (collection.chapters && collection.chapters.length > 0) {
        collection.chapters.forEach((chapter: any, index: number) => {
          episodes.value.push({
            value: (index + 1).toString(),
            label: (index + 1).toString()
          });
        });
      }
      // 添加新的一集
      episodes.value.push({
        value: defaultEpisode.toString(),
        label: defaultEpisode.toString()
      });
    }
  }
  showCollectionDropdown.value = false;
  isNoCollection.value = false;
}

function clearCollection() {
  selectedCollection.value = null;
  showCollectionDropdown.value = false;
  showEpisodeDropdown.value = false;
  isNoCollection.value = true;
}

function handleCloseSwitchCollectionModal() {
  showSwitchCollectionModal.value = false;
  collectionListSelectedId.value = selectedCollection.value?.id || null;
  pendingCollectionId.value = null;
  pendingCollectionData.value = null;
}

async function handleConfirmSwitchCollection() {
  switchCollectionWarningShown.value = true;
  showSwitchCollectionModal.value = false;

  if (pendingCollectionId.value !== null) {
    collectionListSelectedId.value = pendingCollectionId.value;
    pendingCollectionId.value = null;
    pendingCollectionData.value = null;
  } else {
    showCollectionListModal.value = false;
    editingCollectionId.value = null;
    isCreateFromCollectionList.value = true;
    showEditCollectionModal.value = true;
  }
}

function selectEpisode(value: string) {
  selectedEpisodeNumber.value = value;
  showEpisodeDropdown.value = false;
}

function getEpisodeLabel(value: string) {
  const episode = episodes.value.find(ep => ep.value === value);
  return episode ? episode.label : '1';
}

// Fetch collections
async function fetchCollections(loadMore = false) {
  if (isLoadingCollections.value || (!loadMore && !hasMoreCollections.value)) return;

  isLoadingCollections.value = true;

  try {
    const page = loadMore ? currentCollectionPage.value + 1 : 1;
    const response = await api.getCollection(3, page, collectionPageSize.value, uid) as any;

    if (response.code == 0) {
      const newCollections = response.data?.data || [];

      if (loadMore) {
        collections.value = [...collections.value, ...newCollections];
        currentCollectionPage.value = page;
      } else {
        collections.value = newCollections;
        currentCollectionPage.value = 1;
      }

      hasMoreCollections.value = newCollections.length === collectionPageSize.value;
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  } finally {
    isLoadingCollections.value = false;
  }
}

// Handle collection dropdown scroll
function handleCollectionDropdownScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreCollections.value && !isLoadingCollections.value) {
    fetchCollections(true);
  }
}

async function handleSaveCollection(collection: { id: string | number; name: string; cover?: string; description?: string; is_nsfw?: number; language?: string }) {
  showEditCollectionModal.value = false;
  // 弹窗里可能改过语言，同步回页面的语言下拉，否则下拉一直显示旧值，
  // 之后再触发自动创建还会拿这个过期的值去建合集
  if (collection.language) collectionLanguage.value = collection.language;

  if (editingCollectionId.value === null) {
    selectedCollection.value = {
      id: collection.id,
      name: collection.name,
      cover: collection.cover,
      description: collection.description,
      is_nsfw: collection.is_nsfw ?? 0,
      language: collection.language || collectionLanguage.value,
      price: '',
      plan_id: ''
    };

    if (collection.is_nsfw == 1) {
      form.value.content = 'yes';
    }

    coverPreview.value = collection.cover || '';

    await fetchCollections();

    const chapterCount = 0;
    const defaultEpisode = chapterCount + 1;
    selectedEpisodeNumber.value = defaultEpisode.toString();
    episodes.value = [];
    for (let i = 1; i <= defaultEpisode; i++) {
      episodes.value.push({
        value: i.toString(),
        label: i.toString()
      });
    }

    if (isCreateFromCollectionList.value) {
      showCollectionListModal.value = false;
    }
  } else {
    if (selectedCollection.value && selectedCollection.value.id === collection.id) {
      selectedCollection.value.name = collection.name;
      selectedCollection.value.description = collection.description;
      if (collection.cover) {
        selectedCollection.value.cover = collection.cover;
        coverPreview.value = collection.cover;
      }
      selectedCollection.value.is_nsfw = collection.is_nsfw ?? 0;
      if (collection.is_nsfw == 1) {
        form.value.content = 'yes';
      } else if (collection.is_nsfw == 0 && form.value.content !== 'no') {
        form.value.content = 'no';
      }
    }

    const index = collections.value.findIndex(c => c.id === collection.id);
    if (index !== -1) {
      collections.value[index].title = collection.name;
      collections.value[index].description = collection.description;
      if (collection.cover) {
        collections.value[index].cover = collection.cover;
      }
      collections.value[index].is_nsfw = collection.is_nsfw ?? 0;
    }
  }
}

const pendingSensitiveFromSwitch = ref(false);

async function toggleCollectionSensitive() {
  if (!selectedCollection.value) return;

  const newNsfw = selectedCollection.value.is_nsfw == 1 ? 0 : 1;

  if (newNsfw == 1) {
    const dontAsk = localStorage.getItem('sensitiveDontAsk');
    if (dontAsk == '1') {
      await doToggleCollectionSensitive();
    } else {
      pendingSensitiveFromSwitch.value = true;
      showSensitiveConfirm.value = true;
    }
  } else {
    await doToggleCollectionSensitive();
  }
}

async function doToggleCollectionSensitive() {
  if (!selectedCollection.value) return;

  const newNsfw = selectedCollection.value.is_nsfw == 1 ? 0 : 1;

  try {
    const res = await api.modifyCollection({
      book_id: selectedCollection.value.id,
      is_nsfw: newNsfw,
    }) as any;

    if (res.code == 0 || res.code == 200) {
      selectedCollection.value.is_nsfw = newNsfw;
      form.value.content = newNsfw == 1 ? 'yes' : 'no';
    } else {
      toast(apiErrorMessage(res));
    }
  } catch (error) {
    console.error('Toggle sensitive error:', error);
    toast(t('fail'));
  }
}

// Community Convention Modal methods
function closeConventionModal() {
  showConventionModal.value = false;
}

function confirmConvention() {
  showConventionModal.value = false;
  agreeTerms.value = true;
  onBatchPublish();
}

// 查询当前用户是否已设置订阅价格。返回：'active' 已设置 / 'inactive' 确认没设置 / 'error' 请求失败或返回码不是 0。
// notifyError：点击「订阅用户可见」时触发的检查，失败要提示用户
async function checkSubscriptionStatus(notifyError = false): Promise<'active' | 'inactive' | 'error'> {
  try {
    const response = await api.getSubscription();
    const data = response as any;

    if (data.code === 0) {
      const subscription = data.data;
      hasActiveSubscription.value = !!(subscription && subscription.plan && parseFloat(subscription.plan.price) > 0);
      return hasActiveSubscription.value ? 'active' : 'inactive';
    }
    if (notifyError) toast(apiErrorMessage(data));
  } catch (error) {
    console.error("Subscription check error:", error);
    hasActiveSubscription.value = false;
    if (notifyError) toast(t("fail"));
  }
  return 'error';
}

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      console.log()
    }
  }).catch(err => {
    console.log(err);
  })
}

function confirmLeave() {
  if (pendingRoute.value) {
    router.push(pendingRoute.value.path);
  } else {
    router.go(-1);
  }
}

function cancelLeave() {
  isShowConfirm.value = false;
}

function handleUserInfoLoaded(userInfo: any) {
  if (userInfo) {
    isAdult.value = userInfo.is_adult == 1;
    // 已发布的单部付费漫剧数量：个人信息接口顶层的 priced_book_count
    paidDramaCount.value = Number(userInfo.priced_book_count ?? 0) || 0;
  }
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

// 文件拖到没有拖放处理的地方（标题 / 简介输入框、页面空白处）时，别让浏览器把文件直接打开。
// 只管「带文件」的拖拽，拖文字不受影响。上传框、封面弹窗这些真正的拖放区域会在自己的
// @dragover.prevent / @drop 里先 preventDefault，这里看到 defaultPrevented 就不再干预；
// 没人处理的才拦下来，并把光标设成「禁止」。
function blockUnhandledFileDrop(e: DragEvent) {
  const types = e.dataTransfer?.types;
  if (!types || !Array.from(types).includes('Files')) return;
  if (e.defaultPrevented) return;
  e.preventDefault();
  if (e.type === 'dragover' && e.dataTransfer) {
    e.dataTransfer.dropEffect = 'none';
  }
}
onMounted(() => {
  window.addEventListener('dragover', blockUnhandledFileDrop);
  window.addEventListener('drop', blockUnhandledFileDrop);
});
onBeforeUnmount(() => {
  window.removeEventListener('dragover', blockUnhandledFileDrop);
  window.removeEventListener('drop', blockUnhandledFileDrop);
});

/** 关预览。blob 地址不释放会一直把整个文件钉在内存里，5GB 的视频尤其要命 */
function toggleSensitive(val: string) {
  if (form.value.content === val) return;

  const dontAsk = localStorage.getItem('sensitiveDontAsk');

  if (val == 'yes') {
    if (dontAsk == '1') {
      form.value.content = val;
    } else {
      showSensitiveConfirm.value = true;
    }
  } else {
    form.value.content = val;
  }
}

async function handlePermissionChange(permission: string, _index: number) {
  if (await maybePromptSubscription(permission)) {
    // 先弹订阅设置弹窗，不选中；设置成功后再回来选
    pendingPaidAction = () => handlePermissionChange(permission, _index);
    return;
  }
  form.value.permission = permission;
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
  pendingSensitiveFromSwitch.value = false;
  if (pendingCollectionIdForSensitive.value !== null) {
    doSelectCollection(pendingCollectionIdForSensitive.value, true);
    pendingCollectionIdForSensitive.value = null;
    showCollectionListModal.value = false;
  }
}

async function confirmSensitive() {
  form.value.content = "yes";
  showSensitiveConfirm.value = false;
  if (pendingSensitiveFromSwitch.value) {
    pendingSensitiveFromSwitch.value = false;
    await doToggleCollectionSensitive();
  } else if (pendingCollectionIdForSensitive.value !== null) {
    doSelectCollection(pendingCollectionIdForSensitive.value);
    pendingCollectionIdForSensitive.value = null;
    showCollectionListModal.value = false;
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (isOpeningDropdown.value) return;

  if (showDropdown.value &&
      !document.querySelector(".mention-dropdown")?.contains(target) &&
      !captionRef.value?.contains(target)) {
    showDropdown.value = false;
  }

  // Handle chapter dropdown
  const chapterDropdown = document.querySelector(".chapter-dropdown");
  if (showChapterDropdown.value && chapterDropdown && !chapterDropdown.contains(target)) {
    showChapterDropdown.value = false;
  }

  // Handle collection and episode dropdowns
  const collectionSelect = document.querySelector(".collection-select");
  if (showCollectionDropdown.value && collectionSelect && !collectionSelect.contains(target)) {
    showCollectionDropdown.value = false;
  }
  if (showEpisodeDropdown.value && collectionSelect && !collectionSelect.contains(target)) {
    showEpisodeDropdown.value = false;
  }

  // 语言下拉框：点到外面就收起
  if (langDropdownOpen.value && !langDropdownRef.value?.contains(target)) {
    langDropdownOpen.value = false;
  }
}

function showToast(msg: string, icon: string) {
  toastMsg.value = msg;
  toastIcon.value = icon;
  toastShow.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastShow.value = false;
  }, 3000);
}

function openCommunityConvention() {
  localStorage.setItem("isBack", "1");
  window.open("/community-convention", "_blank", 'noopener,noreferrer');
}

onMounted(async () => {
    loadBookPlans();
    await contentSwitch.ensureLoaded();
    document.addEventListener("click", handleClickOutside);

    getCountry();
    await checkSubscriptionStatus();
  });

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
 @use '@/scss/Video.scss';
 @use '@/scss/VideoBatch.scss';

/* 标题 + 价格同一行 */
.collection-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;

  /* 标题吃掉剩余宽度、价格始终贴右；标题太长自己截断，价格不缩 */
  .collection-name {
    flex: 1 1 auto;
    min-width: 0;
  }
}

/* 整本价格：「整本价格：$20 (说明)」一行。标签复用 .form-label，和前面敏感开关的标签同样式；
   说明文字直接跟在金额后面，不再用悬浮图标。窄屏放不下时说明文字换行，标签和金额不拆开 */
.collection-price {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 6px;
  row-gap: 4px;
  min-width: 0;
  line-height: 1.4;

  .price-label,
  .price-amount {
    white-space: nowrap;
  }
}

.collection-price .price-amount {
  font-size: 18px;
  font-weight: 800;
  color: #FA2D47;
}

.collection-price .price-hint {
  font-size: 12px;
  color: #999;
}
</style>
