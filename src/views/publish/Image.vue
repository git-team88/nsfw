<template>
  <div class="submit-image">
    <Header :cur="-1"></Header>

    <div class="container">
      <div class="back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="tabs">
        <span
          :class="tabIndex == index ? 'on' : ''"
          v-for="(tab, index) in tabList"
          :key="index"
          @click="changeTab(tab, index)"
        >
          {{ tab.name }}
          <b></b>
        </span>
      </div>

      <div class="section-image" v-if="imageFiles.length == 0 && !postId">
        <div class="form-label-box">
          <label class="form-label"><b>*</b>{{ t("submit.image.imageLabel") }}</label>
        </div>

        <div class="upload-area-box">
          <div
            class="upload-area"
            @dragover.prevent="onDragOver"
            @drop.prevent="onDropImages"
          >
            <div class="upload-info">
              <p>{{ t("submit.image.uploadCta") }}</p>
              <button class="btn" @click="pickImages" :disabled="imageFiles.length >= 10">
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
              accept="image/*"
              title=""
              class="hidden-file"
              @change="onImagesPicked"
            />
          </div>
        </div>
      </div>

      <div class="content" v-if="imageFiles.length || postId">
        <div class="list-section">
          <div class="form-label"><b>*</b>{{ t("submit.image.imageLabel") }}</div>

          <div class="image-list-box">
            <div class="image-list">
              <div class="image-item" v-for="(f, idx) in imageFiles" :key="f._key">
                <img class="image" :src="f._url || f._preview" alt="" />

                <div class="image-btn">
                  <div class="reload">
                    <img
                      src="@/assets/images/publish/reload.png"
                      alt=""
                      @click="reloadImage(idx)"
                    />
                    <input
                      ref="reuploadInputRef"
                      type="file"
                      accept="image/*"
                      title=""
                      class="reupload-input"
                      @change="onReuploadPicked"
                    />
                  </div>

                  <img
                    src="@/assets/images/publish/delete.png"
                    alt=""
                    @click="removeImage(idx)"
                    v-if="imageFiles.length > 1"
                  />
                </div>
              </div>
              <!-- Show placeholder in edit mode when no images -->
              <div v-if="postId && imageFiles.length === 0" class="image-item">
                <img src="@/assets/images/base/cover.png" alt="" class="image" />
                <div class="image-btn">
                  <div class="reload">
                    <img
                      src="@/assets/images/publish/reload.png"
                      alt=""
                      @click="pickImages"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="add-more-row" @click="pickImages" v-if="imageFiles.length < 10">
              <span class="add-btn">{{ t("submit.image.add") }}</span>
              <input
                ref="imageAddRef"
                type="file"
                accept="image/*"
                title=""
                class="add-file"
                @change="onImagesPicked"
              />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="form-item">
            <div class="perm-box">
              <div class="form-label">{{ t("submit.permission") }}</div>

              <div class="perm-options">
                <div
                  class="perm-option"
                  v-for="opt in permOptions"
                  :key="opt.key"
                  @click="form.permission = opt.key"
                >
                  <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                  <span
                    >{{ t(opt.labelKey) }}
                    <b v-if="opt.key == 'partial'">{{ t("submit.imgtip") }}</b></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="form-item">
            <label class="form-label"> <b>*</b>{{ t("submit.coverLabel") }} </label>

            <div class="cover-row">
              <div class="cover-box">
                <img v-if="coverPreview" :src="coverPreview" alt="" />
                <img v-else-if="!coverPreview" src="@/assets/images/base/cover.png" alt="" />
              </div>

              <div class="reupload-box">
                <button class="reupload" @click="openCoverModal">
                  {{ t("submit.video.reupload") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Caption -->
        <div class="section">
          <div class="form-item">
            <label class="form-label">{{ t("submit.titleLabel") }}</label>
            <div class="caption-container">
              <div class="input-wrap">
                <input
                  v-model="form.title"
                  class="title-input"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :placeholder="t('submit.titlePlaceholder')"
                />
                <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
              </div>
              <div class="caption-line"></div>
              <div class="textarea-wrap">
                <div
                  ref="captionRef"
                  class="description-content"
                  contenteditable="true"
                  :placeholder="t('submit.descriptionPlaceholder')"
                  @input="handleCaptionInput"
                  @keydown="handleCaptionKeydown"
                  @click="handleCaptionClick"
                  @blur="onCaptionBlur"
                  @paste="handlePaste"
                ></div>
              </div>

              <div class="caption-actions-box">
                <div class="caption-actions">
                  <button class="action-btn" @click="onActionBtnClick('#')">
                    #{{ t("submit.topic") }}
                  </button>
                  <button class="action-btn" @click="onActionBtnClick('@')">
                    @{{ t("submit.mention") }}
                  </button>
                </div>

                <span class="char-count">{{ captionLength }}/{{ DESC_MAX }}</span>
              </div>
            </div>

            <!-- Mention/Topic Dropdown -->
            <div
              v-if="showDropdown"
              class="mention-dropdown"
              :style="{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }"
            >
              <div class="dropdown-list">
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
                  <div class="item-right">
                    <span class="stats">
                      {{
                        dropdownType === "#" ? `${item.views} views` : `${item.followers} followers`
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-section">
          <div class="form-label-box">
            <label class="form-label"><b>*</b>{{ t("submit.contentSettings") }}</label>
          </div>

          <div class="content-options">
            <div
              class="content-option"
              v-for="a in contentOptions"
              :key="a.key"
              @click="toggleSensitive(a.key as 'yes' | 'no')"
            >
              <img :src="form.content === a.key ? selectActive : select" alt="" />
              <span>{{ t(a.labelKey) }}</span>
            </div>
          </div>
        </div>

        <div class="submit-row">
          <button class="submit" :disabled="!canSubmit || uploading" @click="onSubmit">
            {{ t("submit.submit") }}
          </button>
        </div>

        <div class="agreement-row">
          <div class="checkbox" :class="{ checked: agreeTerms }" @click="agreeTerms = !agreeTerms">
            <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
            <img v-else src="@/assets/images/register/check.png" alt="" />
          </div>
          <span
            >{{ t("submit.agree") }} <a href="#">{{ t("submit.terms") }}</a></span
          >
        </div>
      </div>
    </div>

    <UploadMask :visible="isUpload" :text="uploadTxt"></UploadMask>

    <ConfirmLeaveModal :show="isShowConfirm" @cancel="confirmStay" @confirm="confirmLeave" />
    <SensitiveConfirmModal
      :visible="showSensitiveConfirm"
      @cancel="cancelSensitive"
      @confirm="confirmSensitive"
    />

    <!-- Cover Selection Modal -->
    <SetImageCoverModal
      v-model:visible="showCoverModal"
      :images="imageFiles.map((f) => f._preview)"
      @confirm="onCoverConfirmed"
    />
  </div>
</template>

<script setup lang="ts" name="PublishImage">
import Header from "@/components/Header.vue";
import ConfirmLeaveModal from "@/components/ConfirmLeaveModal.vue";
import SensitiveConfirmModal from "@/components/SensitiveConfirmModal.vue";
import SetImageCoverModal from "@/components/SetImageCoverModal.vue";
import UploadMask from "@/components/UploadMask.vue";

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";
import { useRoute } from "vue-router";

const isUpload = ref(false);
const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

const TITLE_MAX = 100;
const DESC_MAX = 4000;

const tabList = ref([
  {
    name: t("submit.tabs.video"),
    path: "/publish/video",
  },
  {
    name: t("submit.tabs.image"),
    path: "/publish/image",
  },
  {
    name: t("submit.tabs.article"),
    path: "/publish/article",
  },
]);
const tabIndex = ref(1);
const pendingRoute = ref<{ path: string } | null>(null);
const isShowConfirm = ref(false);

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
  allowRepost: false,
});

const coverInputRef = ref<HTMLInputElement | null>(null);
const coverPreview = ref("");

const imageInputRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const reuploadIndex = ref<number | null>(null);
type PreviewFile = File & { _key: string; _preview: string; _url?: string };
const imageFiles = ref<PreviewFile[]>([]);
const uploading = ref(false);

const agreeTerms = ref(false);

// Cover selection state
const showCoverModal = ref(false);
const selectedCoverIndex = ref<number | null>(null);

// Sensitive content state
const showSensitiveConfirm = ref(false);
const dontAskSensitive = ref(localStorage.getItem("dont_ask_sensitive") === "true");
const pendingSensitiveValue = ref<"yes" | "no" | "">("");

// Caption state
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);

// Check if in edit mode
const route = useRoute();
const isEditMode = ref(route.query.edit === "1");
const postId = ref(route.query.post_id as string);

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

// Dropdown state
const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);

const uploadTxt = ref("");

const canSubmit = computed(() => {
  return imageFiles.value.length > 0 && coverPreview.value && agreeTerms.value;
});

watch(locale, () => {
  tabList.value = [
    {
      name: t("submit.tabs.video"),
      path: "/publish/video",
    },
    {
      name: t("submit.tabs.image"),
      path: "/publish/image",
    },
    {
      name: t("submit.tabs.article"),
      path: "/publish/article",
    },
  ];
});

function goBack() {
  const hasData =
    form.value.title.trim().length > 0 ||
    captionLength.value > 0 ||
    coverPreview.value !== "" ||
    imageFiles.value.length > 0;

  if (hasData) {
    isShowConfirm.value = true;
    return;
  }

  router.go(-1);
}

function changeTab(item: { path: string }, index: number) {
  if (tabIndex.value === index) {
    return false;
  }

  const hasData =
    form.value.title.trim().length > 0 ||
    captionLength.value > 0 ||
    coverPreview.value !== "" ||
    imageFiles.value.length > 0;

  if (hasData) {
    pendingRoute.value = item;
    isShowConfirm.value = true;
    return;
  }

  tabIndex.value = index;
  router.push(item.path);
}

function pickImages() {
  imageInputRef.value?.click();
}

function onImagesPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
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
    return false;
  }

  const files = Array.from(e.dataTransfer?.files ?? []).slice(0, 1);

  appendFiles(files);
}

function appendFiles(files: File[]) {
  const maxCount = 10;
  const maxSize = 10 * 1024 * 1024;

  for (const f of files) {
    if (imageFiles.value.length >= maxCount) break;
    if (!f.type.startsWith("image/")) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > maxSize) {
      toast(t("submit.image.uploadTip"));
      continue;
    }

    const pf = f as PreviewFile;
    pf._key = `${Date.now()}_${Math.random()}`;
    pf._preview = URL.createObjectURL(f);

    uploadImage(pf);
  }
}

function uploadImage(pf: PreviewFile) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  if (pf) {
    if (!pf.type.startsWith("image/")) {
      toast(t("submit.image.uploadFormatError"));
      return false;
    }

    isUpload.value = true;

    const formData = new FormData();
    formData.append("file", pf);

    const parma = {
      method: "POST",
      headers: {
        token: token,
      },
      body: formData,
    };

    fetch(baseUrl + "user/uploadImage", parma)
      .then((response) => response.json())
      .then((res: any) => {
        if (res.code === 0 || res.code === 200) {
          const url = (res?.data && (res.data.url || res.data)) || res?.url;
          if (typeof url === "string") {
            pf._url = url;
          }

          // Add to array only after successful upload
          imageFiles.value.push(pf);

          // Set first image as cover by default
          if (imageFiles.value.length === 1) {
            coverPreview.value = pf._url || pf._preview;
            selectedCoverIndex.value = 0;
          }

          isUpload.value = false;
        } else {
          toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
          isUpload.value = false;
        }
      })
      .catch((error: unknown) => {
        toast(String(error));
        isUpload.value = false;
      });
  }
}

function reloadImage(idx: number) {
  reuploadIndex.value = idx;
  reuploadInputRef.value?.click();
}

function onReuploadPicked(e: Event) {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  input.value = "";
  if (reuploadIndex.value === null || !file) return;
  if (!file.type.startsWith("image/")) {
    toast(t("submit.image.uploadFormatError"));
    return false;
  }
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    toast(t("submit.image.uploadTip"));
    return false;
  }
  isUpload.value = true;
  const formData = new FormData();
  formData.append("file", file);
  const parma = {
    method: "POST",
    headers: {
      token: token,
    },
    body: formData,
  };
  fetch(baseUrl + "user/uploadImage", parma)
    .then((response) => response.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const idx = reuploadIndex.value as number;
        const old = imageFiles.value[idx];
        URL.revokeObjectURL(old._preview);
        const pf = file as PreviewFile;
        pf._key = `${Date.now()}_${Math.random()}`;
        pf._preview = URL.createObjectURL(file);
        const url = (res?.data && (res.data.url || res.data)) || res?.url;
        if (typeof url === "string") {
          pf._url = url;
        }
        imageFiles.value.splice(idx, 1, pf);
        isUpload.value = false;
        reuploadIndex.value = null;

        // Update cover if the reuploaded image was the cover
        if (idx === selectedCoverIndex.value) {
          coverPreview.value = pf._preview;
        }
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      isUpload.value = false;
    });
}

function toggleSensitive(val: "yes" | "no") {
  if (form.value.content === val) return;

  if (dontAskSensitive.value) {
    form.value.content = val;
  } else {
    pendingSensitiveValue.value = val;
    showSensitiveConfirm.value = true;
  }
}

function cancelSensitive() {
  showSensitiveConfirm.value = false;
}

function confirmSensitive() {
  if (pendingSensitiveValue.value) {
    form.value.content = pendingSensitiveValue.value as "yes" | "no";
    if (dontAskSensitive.value) {
      localStorage.setItem("dont_ask_sensitive", "true");
    }
  }
  showSensitiveConfirm.value = false;
}

function removeImage(idx: number) {
  const pf = imageFiles.value[idx];
  URL.revokeObjectURL(pf._preview);
  imageFiles.value.splice(idx, 1);
  if (coverPreview.value && idx === selectedCoverIndex.value) {
    coverPreview.value = imageFiles.value.length > 0 ? imageFiles.value[0]._preview : "";
    selectedCoverIndex.value = imageFiles.value.length > 0 ? 0 : null;
  }
}

function openCoverModal() {
  if (imageFiles.value.length > 0) {
    showCoverModal.value = true;
  }
}

function selectCover(index: number) {
  selectedCoverIndex.value = index;
}

function onCoverConfirmed(coverUrl: string) {
  isUpload.value = true;

  const token = localStorage.getItem("token");
  if (!token) {
    isUpload.value = false;
    return;
  }

  // Convert data URL to Blob
  fetch(coverUrl)
    .then((response) => response.blob())
    .then((blob) => {
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);

      const parma = {
        method: "POST",
        headers: {
          token: token,
        },
        body: formData,
      };

      return fetch(baseUrl + "user/uploadImage", parma);
    })
    .then((response) => response.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const url = (res?.data && (res.data.url || res.data)) || res?.url;
        if (typeof url === "string") {
          coverPreview.value = url;
        }
        isUpload.value = false;
      } else {
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
        coverPreview.value = coverUrl;
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      coverPreview.value = coverUrl;
      isUpload.value = false;
    });
}


function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  updateCaptionStats();
}

// Caption functions
async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;
  const text = target.innerText || "";
  captionLength.value = text.replace(/\n$/, "").length;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  const match = textBefore.match(/([#@])([^#@\s]*)$/);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];

    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Debounced search function
const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
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
    console.error("Search error:", error);
    dropdownItems.value = [];
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
  } else {
    showDropdown.value = false;
  }
}

function handleCaptionKeydown(e: KeyboardEvent) {
  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    // Special deletion logic: if cursor is right after a tag, delete the whole tag
    const node = range.startContainer;
    if (range.startOffset === 0 && node.previousSibling?.nodeName === "SPAN") {
      const span = node.previousSibling as HTMLElement;
      if (span.classList.contains("tag")) {
        e.preventDefault();
        span.remove();
        updateCaptionStats();
      }
    }
  }
}

function updateCaptionStats() {
  if (captionRef.value) {
    const text = captionRef.value.innerText || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }
}

function onCaptionBlur() {
  // Save content to form if needed
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }
}

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getBoundingClientRect();

  // Position relative to the viewport (using fixed positioning)
  const absTop = rect.bottom + 5;
  const absLeft = rect.left;

  dropdownPosition.value = {
    top: absTop,
    left: absLeft + 2, // Small offset to the right
  };

  // Adjust if overflow bottom
  const dropdownHeight = 250;
  if (absTop + dropdownHeight > window.innerHeight) {
    dropdownPosition.value.top = rect.top - dropdownHeight - 5;
  }
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

  // Delete selection if any
  range.deleteContents();

  const textNode = document.createTextNode(symbol);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // Force show dropdown immediately after button click
  // Directly request API and show dropdown without waiting for input
  dropdownType.value = symbol;
  showDropdown.value = true;
  lastRange.value = range.cloneRange();
  updateDropdownPosition();
  // Always search with empty query to get all results immediately
  searchTags(symbol, "");
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  // Check topic limit
  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      toast(t("submit.video.toastTopicLimit"));
      showDropdown.value = false;
      return;
    }
  }

  const range = lastRange.value;
  const textNode = range.startContainer;
  const offset = range.startOffset;
  const textContent = textNode.textContent || "";
  const textBefore = textContent.substring(0, offset);
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const triggerIndex = match.index!;
    // Set range to cover the trigger and the typed query
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }

  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  span.innerText = dropdownType.value === "@" ? "@" + item.label : item.label;
  span.style.color = "#00d3f2";
  span.style.marginRight = "4px";

  range.insertNode(span);

  // Insert a space after the tag
  const space = document.createTextNode("\u00A0");
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

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (showDropdown.value && !document.querySelector(".mention-dropdown")?.contains(target)) {
    showDropdown.value = false;
  }
}

async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push('/login');
    return;
  }

  if (!imageFiles.value.length) {
    toast(t("submit.image.uploadFirst"));
    return;
  }
  if (!coverPreview.value) {
    toast(t("submit.image.setCover"));
    return;
  }
  if (!agreeTerms.value) {
    toast(t("submit.image.agreeTerms"));
    return;
  }

  uploadTxt.value = t("submit.publishing");
  isUpload.value = true;

  const payload = {
    type: 1,
    title: form.value.title.trim(),
    cover: coverPreview.value,
    content: form.value.description.trim(),
    is_nsfw: form.value.content === "yes" ? 1 : 0,
    access_rights: form.value.permission === "partial" ? 1 : form.value.permission === "private" ? 2 : 0,
    image_urls: imageFiles.value.filter(f => f._url).map((f) => f._url!)
  };

  try {
    const headers = new Headers();

    headers.append("token", token);
    headers.append("Content-Type", "application/json");

    const data = JSON.stringify(payload);

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data
    };

    const url = postId.value
      ? `${baseUrl}/post/modifyPost`
      : `${baseUrl}/post/addPost`;

    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      toast(t("success"));
      router.push(`/publish/success?type=${1}`);
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("fail"));
  } finally {
    isUpload.value = false;
    uploadTxt.value = '';
  }
}

function confirmStay() {
  isShowConfirm.value = false;
  pendingRoute.value = null;
}
function confirmLeave() {
  if (pendingRoute.value) {
    router.push(pendingRoute.value.path);
    pendingRoute.value = null;
    isShowConfirm.value = false;
  } else {
    router.go(-1);
  }
}

// Get post details for editing
async function getPostDetails() {
  if (!postId.value) return;

  try {
    const res = await api.postDetail(postId.value);
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 0 || data.code === 200) {
      const postData = data.data.post;
      form.value.title = postData.title || "";
      form.value.description = postData.content || "";
      form.value.permission = postData.access_rights === 2 ? "partial" : postData.access_rights === 3 ? "private" : "public";
      form.value.content = postData.is_nsfw === 1 ? "yes" : "no";
      coverPreview.value = postData.cover || "";

      // Update contenteditable div with description and handle #tags and @mentions
      if (captionRef.value) {
        const content = postData.content || "";
        // Clear the div
        captionRef.value.innerHTML = '';

        // Process content to handle #tags and @mentions
        let currentIndex = 0;
        let pos = 0;
        const contentLength = content.length;

        while (pos < contentLength) {
          // Find the next # or @
          const tagIndex = content.indexOf('#', pos);
          const mentionIndex = content.indexOf('@', pos);

          // Determine which comes first
          let nextMatchIndex = -1;
          let isTag = false;

          if (tagIndex === -1 && mentionIndex === -1) {
            // No more matches
            break;
          } else if (tagIndex === -1) {
            nextMatchIndex = mentionIndex;
            isTag = false;
          } else if (mentionIndex === -1) {
            nextMatchIndex = tagIndex;
            isTag = true;
          } else {
            nextMatchIndex = Math.min(tagIndex, mentionIndex);
            isTag = nextMatchIndex === tagIndex;
          }

          // Add text before the match
          if (nextMatchIndex > currentIndex) {
            const textBefore = content.substring(currentIndex, nextMatchIndex);
            const textNode = document.createTextNode(textBefore);
            captionRef.value?.appendChild(textNode);
          }

          // Find the end of the tag/mention (until whitespace or end of string)
          let endIndex = nextMatchIndex + 1;
          while (endIndex < contentLength) {
            const char = content[endIndex];
            if (char === ' ' || char === '\n' || char === '\t') {
              break;
            }
            endIndex++;
          }

          // Extract the match
          const matchText = content.substring(nextMatchIndex, endIndex);

          // Create span for the match
          const span = document.createElement('span');
          span.className = isTag ? 'tag topic' : 'tag mention';
          span.style.color = '#00d3f2';
          span.style.marginRight = '4px';
          span.contentEditable = 'false';
          span.textContent = matchText;
          captionRef.value?.appendChild(span);

          // Add a space after
          const space = document.createTextNode('\u0020');
          captionRef.value?.appendChild(space);

          // Update current index
          currentIndex = endIndex;
          pos = endIndex;
        }

        // Add remaining text
        if (currentIndex < content.length) {
          const textAfter = content.substring(currentIndex);
          const textNode = document.createTextNode(textAfter);
          captionRef.value?.appendChild(textNode);
        }

        // Update caption length
        captionLength.value = content.length;
      }

      // Handle images for edit mode
      if (res.data.images && Array.isArray(res.data.images)) {
        for (const url of res.data.images) {
          // Create a mock file object for existing images
          const mockFile = new File([], "existing_image.jpg", { type: "image/jpeg" }) as PreviewFile;
          mockFile._key = `${Date.now()}_${Math.random()}`;
          mockFile._preview = url.image_url;
          mockFile._url = url.image_url;
          imageFiles.value.push(mockFile);
        }

        if (!coverPreview.value) {
          coverPreview.value = imageFiles.value[0]._url || imageFiles.value[0]._preview;
        }
      }
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error("Get post details error:", error);
    toast(t('fail'));
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  // Get post details if postId exists
  if (postId.value) {
    getPostDetails();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  // Clean up object URLs to prevent memory leaks
  imageFiles.value.forEach((file) => {
    if (file._preview && !file._url) {
      URL.revokeObjectURL(file._preview);
    }
  });
});
</script>

<style lang="scss" scoped>
.submit-image {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  position: relative;
  max-width: 90rem;
  min-height: calc(100vh - 14rem);
  margin: 0 auto 2rem;
  padding: 0 0 2rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);
}

.back {
  position: fixed;
  left: 50%;
  top: 12rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-55rem);
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  cursor: pointer;
  z-index: 10;

  &:hover {
    border: 1px solid rgba(251, 100, 182, 0.5);
    background: rgba(251, 100, 182, 0.06);
  }

  img {
    width: 2.4rem;
    height: 2.4rem;
  }
}

.tabs {
  display: flex;
  align-items: center;
  gap: 3rem;
  height: 6.4rem;
  margin-bottom: 2.4rem;
  padding: 0 3rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);

  span {
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 1.6rem;
    color: #6a7282;
    cursor: pointer;

    &.on {
      position: relative;
      font-weight: 500;
      color: #101828;

      &::before {
        position: absolute;
        left: 0;
        bottom: 0;
        content: "";
        width: 100%;
        height: 0.2rem;
        background-color: #fb64b6;
      }
    }

    &:hover {
      color: #101828;
    }
  }
}
.content-section {
  margin: 0 3rem 2.4rem;
}
.list-section {
  margin: 0 3rem 2.4rem;
}

.form-item {
  position: relative;
  margin-bottom: 2.4rem;
  padding: 0 3rem;
}

.form-label-box {
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;

  span {
    font-size: 1.2rem;
    color: #99a1af;
  }
}
.form-label {
  font-size: 1.4rem;
  color: #101828;

  b {
    font-weight: normal;
    color: #fa2d47;
  }

  span {
    font-size: 1.2rem;
    color: #99a1af;
  }
}

.input,
.textarea,
.select {
  width: 100%;
  padding: 1.2rem;
  font-size: 1.6rem;
  border: 1px solid #fccee8;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.9);
  color: #101828;
}

.input {
  height: 5rem;

  ::placeholder {
    color: #99a1af;
  }

  &:focus {
    border: 1px solid #fb64b6;
  }
}

.textarea {
  height: 10rem;
  resize: none;

  &:focus {
    border: 1px solid #fb64b6;
  }
}

.select {
  width: 42rem;
  margin: 1.2rem 0 0;
}

.cover-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 1.2rem;
  margin-top: 1.2rem;
}
.cover-box {
  width: 9rem;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
  }
}
.cover-placeholder {
  width: 72px;
  height: 72px;
  background: linear-gradient(180deg, #eaeef5, #f7f9fc);
  border-radius: 8px;
}

.reupload-box {
  position: relative;
  cursor: pointer;
}

.reupload {
  font-size: 1.6rem;
  background: none;
  color: #fb64b6;
  cursor: pointer;
}

.section-image {
  margin-bottom: 2.4rem;
  padding: 0 3rem;
}

.upload-area-box {
  position: relative;
  padding: 4rem 0;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(251, 100, 182, 0.5);
  background: rgba(251, 100, 182, 0.04);
  cursor: pointer;

  &:hover {
    background: rgba(251, 100, 182, 0.08);
  }
}

.upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.upload-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  p {
    margin-bottom: 2.4rem;
    font-size: 1.4rem;
    color: #101828;
  }
}
.btn {
  height: 4rem;
  padding: 0 1.2rem;
  font-size: 1.4rem;
  border: none;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
  color: #ffffff;
  cursor: pointer;
}
.upload-spec {
  display: flex;
  flex-wrap: wrap;
  gap: 8rem;
  margin-top: 2.4rem;
  font-size: 1.2rem;
  color: #99a1af;

  .upload-spec-item {
    display: flex;
    flex-direction: column;
    color: #6a7282;

    .upload-spec-title {
      margin-bottom: 0.6rem;
      color: #99a1af;
    }

    .upload-spec-info {
      display: flex;
      align-items: center;

      span {
        &:nth-of-type(2) {
          margin: 0 0.6rem;
        }
      }
    }
  }
}
.image-list-box {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 2.4rem;
  margin-top: 1.2rem;
}
.image-list {
  display: flex;
  align-items: center;
  column-gap: 1.2rem;
  row-gap: 2.4rem;

  .image-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26.4rem;
    height: 19.8rem;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    overflow: hidden;

    .image {
      width: auto;
      max-width: 100%;
      height: 19.8rem;
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      object-fit: contain;
    }

    .image-btn {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      z-index: 5;
      opacity: 0;

      .reload {
        position: relative;
        margin-bottom: 0.6rem;
        cursor: pointer;

        .reupload-input {
          position: absolute;
          left: 0;
          width: 2.8rem;
          height: 2.8rem;
          opacity: 0;
          cursor: pointer;
        }
      }

      img {
        width: 2.8rem;
        height: 2.8rem;
        cursor: pointer;
      }
    }

    &:hover {
      .image-btn {
        opacity: 1;
      }
    }
  }
}

.add-more-row {
  display: flex;
  position: relative;
  cursor: pointer;
  .add-btn {
    position: relative;
    width: 11.2rem;
    height: 4rem;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-border-radius: 0.8rem;
    border-radius: 0.8rem;
    font: {
      size: 1.4rem;
    }
    background: #00d3f2;
    color: #ffffff;
    cursor: pointer;

    &:hover {
      position: relative;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        z-index: 5;
      }
    }
  }

  .add-file {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 5;
    cursor: pointer;
  }
}

.radio-row,
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 16px 24px;
  flex-wrap: wrap;
  label {
    font-size: 14px;
    color: #101828;
  }
}
.perm-box {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  margin: 0 0 2.4rem;
  padding: 1.2rem;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: rgba(251, 100, 182, 0.04);

  .form-label {
    color: #99a1af;
  }
}
.perm-options {
  display: flex;
  align-items: center;
  gap: 2.4rem;
}
.perm-option {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  img {
    width: 2.4rem;
    height: 2.4rem;
  }
  span {
    font-size: 1.4rem;
    color: #364153;

    b {
      font-weight: normal;
      font-size: 1.2rem;
      color: #99a1af;
    }
  }
}
.content-options {
  display: flex;
  align-items: center;
  gap: 2rem;
  .content-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #364153;
    }
  }
}
.interactive-options {
  display: flex;
  align-items: center;
  .interactive-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
    span {
      font-size: 1.4rem;
      color: #364153;
    }
  }
}
.submit-row {
  display: flex;
  justify-content: center;
}
.submit {
  min-width: 24rem;
  height: 4.8rem;
  border: none;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  font: {
    weight: 500;
    size: 1.6rem;
  }
  background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
  color: #ffffff;
  cursor: pointer;

  &:disabled {
    position: relative;
    cursor: not-allowed;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      z-index: 1;
    }
  }
}
.hidden-file {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 5;
  cursor: pointer;
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.2rem;
  font-size: 1.4rem;
  color: #6a7282;
  .checkbox {
    cursor: pointer;
    img {
      width: 2.4rem;
      height: 2.4rem;
    }
  }
  a {
    color: #fb64b6;
    text-decoration: none;
  }
}

.confirm-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  z-index: 500;
}
.confirm-modal {
  width: 36rem;
  padding: 1.6rem;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  background: #ffffff;
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);
}
.confirm-text {
  font-size: 1.4rem;
  color: #364153;
  margin-bottom: 1.2rem;
}
.confirm-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.2rem;
}
.confirm-btn {
  min-width: 10rem;
  height: 3.6rem;
  border: none;
  -webkit-border-radius: 0.6rem;
  border-radius: 0.6rem;
  font-size: 1.4rem;
  cursor: pointer;
  &.secondary {
    background: rgba(251, 100, 182, 0.06);
    color: #fb64b6;
  }
  &.primary {
    background: linear-gradient(155deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
    color: #ffffff;
  }
}

/* Cover Selection Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.cover-selection-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-preview {
  width: 100%;
  height: 200px;
  border: 2px dashed #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-selection {
  color: #999;
  font-size: 14px;
}

.cover-thumbs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.cover-thumb {
  width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

.cover-thumb:hover {
  border-color: #fb64b6;
}

.cover-thumb.selected {
  border-color: #fb64b6;
  box-shadow: 0 0 0 2px rgba(251, 100, 182, 0.2);
}

.cover-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn {
  padding: 8px 16px;
  border: 1px solid #fb64b6;
  border-radius: 4px;
  background-color: #fb64b6;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn:disabled {
  background-color: #f8d7e8;
  border-color: #f8d7e8;
  cursor: not-allowed;
}

/* Caption Styles */
.caption-container {
  margin-top: 1.2rem;
  border: 1px solid #fccee8;
  border-radius: 0.8rem;
  overflow: hidden;

  .input-wrap {
    position: relative;
    padding: 1.4rem 6rem 1.4rem 1.8rem;

    .char-count {
      position: absolute;
      top: 1.6rem;
      right: 1.4rem;
      font-size: 1.2rem;
      color: #99a1af;
    }
  }

  .caption-line {
    width: calc(100% - 3.6rem);
    height: 1px;
    margin: 0 1.8rem;
    background: rgba(251, 100, 182, 0.1);
  }

  .textarea-wrap {
    position: relative;
    padding: 1.4rem 1rem 0 1.8rem;
  }

  .title-input,
  .description-content {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 1.4rem;
    color: #101828;
    &::placeholder {
      color: #99a1af;
    }
  }

  .description-content {
    height: 10rem;
    word-break: break-all;
    white-space: pre-wrap;
    overflow-y: auto;
    &:focus {
      outline: none;
    }
    &[contenteditable="true"]:empty:before {
      content: attr(placeholder);
      color: #99a1af;
      pointer-events: none;
      display: block;
    }

    .tag {
      color: #00d3f2;
      margin-right: 0.4rem;
      user-select: none;
    }
  }
}

.caption-actions-box {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.2rem 1.2rem 1.2rem 1.8rem;
  background: rgba(255, 255, 255, 0.9);

  .char-count {
    font-size: 1.2rem;
    color: #99a1af;
  }
}

.caption-actions {
  display: flex;
  gap: 1.2rem;

  .action-btn {
    padding: 0.7rem 1.6rem;
    border-radius: 0.6rem;
    border: none;
    background: #f5f5f5;
    color: #4a5565;
    font-size: 1.2rem;
    cursor: pointer;
  }
}

/* Mention Dropdown Styles */
.mention-dropdown {
  position: fixed;
  width: 48rem;
  background: #ffffff;
  border-radius: 0.8rem;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  .dropdown-list {
    max-height: 24rem;
    padding: 0.8rem 0;
    overflow-y: auto;
  }
  .dropdown-item {
    padding: 0.6rem 1.6rem;
    min-height: 4rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    &:hover {
      background: rgba(251, 100, 182, 0.06);
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      .avatar {
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 50%;
        object-fit: cover;
      }
      .label {
        font-size: 1.4rem;
        color: #364153;
      }
    }

    .item-right {
      .stats {
        font-size: 1.2rem;
        color: #99a1af;
      }
    }
  }
}
</style>
