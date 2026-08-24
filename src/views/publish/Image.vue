<template>
  <div class="submit-image" :class="imageUrls.length > 0 ? 'on' : ''">
    <Header :cur="-1"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- Top Nav Tabs -->
      <div class="tabs" :class="imageUrls.length > 0 ? 'on' : ''">
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

      <!-- Upload Method Section (hidden once images are chosen) -->
      <div class="upload-tabs" v-if="!showFullContent">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.image.imageLabel") }}</span>
        </div>

        <!-- Upload Method Tabs -->
        <div class="tab-buttons">
          <button
            class="tab-btn"
            :class="uploadOption === 'history' ? 'active' : ''"
            @click="uploadOption = 'history'"
          >
            {{ t("submit.image.uploadFromHistory") }}
          </button>
          <button
            class="tab-btn"
            :class="uploadOption === 'local' ? 'active' : ''"
            @click="uploadOption = 'local'"
          >
            {{ t("submit.image.localUpload") }}
          </button>
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
                :class="{ selected: selectedProjectId === project.id }"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
                @click="selectProject(project)"
              >
                <div class="project-image-container">
                  <img :src="processImageUrl(getProjectCover(project))" alt="" class="project-image" />
                </div>
                <div v-if="project.name" class="project-title">{{ project.name }}</div>
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
          </div>
        </div>

        <!-- Local Upload Tab -->
        <div v-else-if="uploadOption === 'local'" class="upload-area-box">
          <div
            class="upload-area"
            @dragover.prevent="onDragOver"
            @drop.prevent="onDropImages"
          >
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
        </div>
        <div class="image-list-box">
          <div class="image-list">
            <div
              v-for="(url, index) in imageUrls"
              :key="index"
              class="image-item"
              :class="{ 'is-cover': index === 0 }"
            >
              <img class="image" :src="processImageUrl(url)" alt="" />
              <span v-if="index === 0" class="cover-badge">{{ t('submit.coverLabel') }}</span>
            </div>
          </div>
        </div>

        <!-- Permission (inline under images) -->
        <div class="inline-perm-row">
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.permission') }}</span>
            <div class="perm-options">
              <div
                class="perm-option"
                v-for="opt in permOptions"
                :key="opt.key"
                @click="form.permission = opt.key"
              >
                <img :src="form.permission === opt.key ? selectActive : select" alt="" />
                <span>{{ t(opt.labelKey) }}</span>
              </div>
            </div>
          </div>
          <div class="perm-group">
            <span class="perm-label">{{ t('submit.contentSettings') }}</span>
            <div class="perm-options">
              <div
                class="perm-option"
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
      </div>

      <!-- Publish Form -->
      <div class="form-section" v-if="showFullContent">
        <!-- Title -->
        <div class="form-item">
          <div class="form-label-box">
            <span><b>*</b>{{ t('submit.titleLabel') }}</span>
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
            <span class="char-count">{{ form.description.length }}/{{ DESC_MAX }}</span>
          </div>
          <textarea
            class="form-textarea"
            v-model="form.description"
            :placeholder="t('submit.descriptionPlaceholder')"
            :maxlength="DESC_MAX"
            rows="6"
          ></textarea>
        </div>
      </div>

      <!-- Publish Button -->
      <div class="submit-section" v-if="showFullContent">
        <button class="publish-btn" :disabled="isUploading" @click="onSubmit">
          {{ isUploading ? t('submit.publishing') : t('submit.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { processImageUrl } from "@/util/utils";
import Header from "@/components/Header.vue";
import Pagination from "@/components/Pagination.vue";

import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();
const route = useRoute();

const TITLE_MAX = 60;
const DESC_MAX = 4000;
const pageSize = 12;

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

interface TabItem {
  name: string;
  path: string;
}

const tabList = ref<TabItem[]>([]);
const tabIndex = ref(3);

const uploadOption = ref<"history" | "local">("history");

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
});

const session_id = ref("");
const imageUrls = ref<string[]>([]);
const coverPreview = ref("");
const showFullContent = ref(false);
const isUploading = ref(false);
const isUpload = ref(false);

// History list state
const projects = ref<any[]>([]);
const totalProjects = ref(0);
const currentPage = ref(1);
const isLoadingProjects = ref(false);
const selectedProjectId = ref<number | string>("");

// Local upload state
type PreviewFile = File & { _key: string; _preview: string; _url?: string };
const imageFiles = ref<PreviewFile[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);

function buildTabList(): TabItem[] {
  return [
    { name: t("submit.tabs.novel"), path: "/publish/novel" },
    { name: t("submit.tabs.manhua"), path: "/publish/comic" },
    { name: t("submit.tabs.manju"), path: "/publish/video" },
    { name: t("submit.tabs.photo"), path: "/publish/image" },
    { name: t("submit.tabs.video"), path: "/publish/clip" },
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
    const response = await api.singleTaskList(currentPage.value, pageSize, "simple_image") as any;
    if (response.code !== 200) {
      toast(t("fail"));
      return;
    }

    projects.value = response.data.data_list || [];

    if (response.data.data_count) {
      totalProjects.value = response.data.data_count;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    isLoadingProjects.value = false;
  }
}

// Click a project -> extract image URLs -> enter publish form
async function selectProject(project: any) {
  selectedProjectId.value = project.id;

  let urls: string[] = [];

  // Try to read images directly from project result_async
  const ra = project.result_async;
  if (ra && Array.isArray(ra.final_images) && ra.final_images.length > 0) {
    urls = ra.final_images.slice(0, 12);
  } else if (ra && Array.isArray(ra.images) && ra.images.length > 0) {
    urls = ra.images.slice(0, 12);
  }

  // If not available, try fetching project detail then chapter detail
  if (urls.length === 0 && project.session_id) {
    try {
      const detailRes = await api.detailProject(project.session_id) as any;
      if (detailRes.code === 200 && detailRes.data) {
        Object.assign(project, detailRes.data);
      }

      const dRA = project.result_async;
      if (dRA && Array.isArray(dRA.final_images) && dRA.final_images.length > 0) {
        urls = dRA.final_images.slice(0, 12);
      } else if (dRA && Array.isArray(dRA.images) && dRA.images.length > 0) {
        urls = dRA.images.slice(0, 12);
      }

      // Try chapter detail (episode 1) if still empty
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
            urls = cd.final_images.slice(0, 12);
          } else if (Array.isArray(cd.images) && cd.images.length > 0) {
            urls = cd.images.slice(0, 12);
          } else if (cRA && Array.isArray(cRA.final_images) && cRA.final_images.length > 0) {
            urls = cRA.final_images.slice(0, 12);
          } else if (cRA && Array.isArray(cRA.images) && cRA.images.length > 0) {
            urls = cRA.images.slice(0, 12);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching project detail:", error);
    }
  }

  if (urls.length === 0) {
    toast(t("fail"));
    return;
  }

  imageUrls.value = urls;
  coverPreview.value = urls[0] || "";
  session_id.value = project.session_id || "";
  showFullContent.value = true;

  if (project.name) {
    form.value.title = project.name;
  }
}

// --- Local upload helpers ---
function pickImages() {
  if (imageFiles.value.length >= 12) {
    toast(t("submit.image.uploadTip"));
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

  for (const f of files) {
    if (imageFiles.value.length >= maxCount) {
      toast(t("submit.image.uploadTip"));
      break;
    }
    if (!validImageTypes.includes(f.type)) {
      toast(t("submit.image.uploadFormatError"));
      continue;
    }
    if (f.size > maxSize) {
      toast(t("submit.image.uploadTip"));
      continue;
    }

    const corrupted = await isImageCorrupted(f);
    if (corrupted) {
      toast(t("submit.image.uploadFormatError"));
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
    router.push("/login");
    return false;
  }

  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validImageTypes.includes(pf.type)) {
    toast(t("submit.image.uploadFormatError"));
    return false;
  }

  isUpload.value = true;

  const formData = new FormData();
  formData.append("file", pf);

  const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);

  const parma = {
    method: "POST",
    headers: {
      token: token,
      Platform: "web",
      ...authHeaders,
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

        imageFiles.value.push(pf);

        if (imageFiles.value.length === 1) {
          coverPreview.value = pf._url || pf._preview;
        }

        showFullContent.value = true;
        isUpload.value = false;
      } else {
        toast(locale.value === "en" ? res.msg : locale.value === "zh" ? res.msg_cn : locale.value === "tc" ? res.msg_tc : res.msg_jp);
        isUpload.value = false;
      }
    })
    .catch((error: unknown) => {
      toast(String(error));
      isUpload.value = false;
    });

  return true;
}

// Keep imageUrls in sync with uploaded files (first is cover)
const uploadedUrls = computed(() => imageFiles.value.filter((f) => f._url).map((f) => f._url!));

// --- Submit ---
async function onSubmit() {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }

  if (!form.value.title.trim()) {
    toast(t("submit.titleRequired"));
    return;
  }

  // Merge uploaded local files into imageUrls if present
  const finalUrls = uploadedUrls.value.length > 0 ? uploadedUrls.value : imageUrls.value;

  if (finalUrls.length === 0) {
    toast(t("submit.image.uploadFirst"));
    return;
  }

  const finalCover = coverPreview.value || finalUrls[0] || "";
  if (!finalCover) {
    toast(t("submit.image.setCover"));
    return;
  }

  isUploading.value = true;

  const payload = {
    type: 1,
    title: form.value.title.trim(),
    cover: finalCover,
    content: form.value.description.trim(),
    is_nsfw: form.value.content === "yes" ? 1 : 0,
    access_rights: form.value.permission === "partial" ? 2 : form.value.permission === "private" ? 3 : 1,
    image_urls: finalUrls,
    book_id: 0,
    chapter_index: 0,
    cover_color: "",
    cover_title: "",
    ...(session_id.value ? { session_id: session_id.value } : {}),
  };

  try {
    const headers = new Headers();
    const { ts, sign } = (window as any).AntiCrawler.generateAuthParams(token);
    headers.append("token", token);
    headers.append("ts", ts);
    headers.append("sign", sign);
    headers.append("Content-Type", "application/json");
    headers.append("Platform", "web");

    const data = JSON.stringify(payload);
    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data,
    };

    const url = `${baseUrl}post/addPost`;
    const response = await fetch(url, requestOptions);
    const result = await response.text();
    const res = JSON.parse(result);

    if (res.code === 0 || res.code === 200) {
      toast(t("success"));
      router.push(`/publish/success?type=${1}`);
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

// --- URL jump entry ---
onMounted(async () => {
  tabList.value = buildTabList();

  const sessionId = route.query.session_id as string;

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
          urls = ra.final_images.slice(0, 12);
        } else if (Array.isArray(detailRes.data.final_images) && detailRes.data.final_images.length > 0) {
          urls = detailRes.data.final_images.slice(0, 12);
        } else if (Array.isArray(detailRes.data.images) && detailRes.data.images.length > 0) {
          urls = detailRes.data.images.slice(0, 12);
        }
        if (urls.length > 0) {
          imageUrls.value = urls;
          coverPreview.value = urls[0];
          showFullContent.value = true;
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching project detail:", error);
    }
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
