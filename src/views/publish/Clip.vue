<template>
  <div class="submit-video" :class="showFullContent ? 'on' : ''">
    <Header ref="headerRef" :cur="-1" @user-info-loaded="handleUserInfoLoaded"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="tabs" :class="showFullContent ? 'on' : ''">
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

      <!-- Upload Tabs -->
      <div class="upload-tabs" v-if="!showFullContent">
        <div class="form-label-box">
          <span><b>*</b>{{ t("submit.video.videoLabel") }}</span>
        </div>

        <!-- Upload Options -->
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

        <!-- History List -->
        <div v-if="uploadOption == 'history'" class="history-list">
          <!-- Loading State -->
          <div v-if="isLoadingProjects" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('loading') }}</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="projects.length == 0" class="empty-state">
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
                :class="{ selected: selectedProjectId == project.id }"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
                @click="selectProject(project)"
              >
                <img :src="getProjectCover(project)" alt="" class="project-image" />
                <div class="view-icon" @click.stop="openViewModal(project)">
                  <img src="@/assets/images/publish/play.png" alt="Play" />
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
          </div>
        </div>

        <!-- Local Upload -->
        <div v-else-if="uploadOption == 'local'" class="upload-area-box">
          <div class="upload-area" @dragover.prevent @drop.prevent="onDropFile">
            <div class="upload-info">
              <p>{{ t("submit.video.uploadCta") }}</p>
              <button class="btn" @click="pickVideo">{{ t("submit.video.uploadBtn") }}</button>
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
            <input
              ref="videoInputRef"
              type="file"
              accept="video/mp4,video/quicktime"
              class="hidden-file"
              title=""
              @change="onVideoPicked"
            />
          </div>

          <!-- Upload Progress -->
          <div v-if="isUpload" class="upload-progress-box">
            <div class="upload-progress-bar">
              <div class="upload-progress-inner" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <span class="upload-progress-text">{{ uploadProgress }}%</span>
          </div>
        </div>
      </div>

      <!-- Full Publish Form -->
      <div v-if="showFullContent" class="full-content">
        <!-- Video preview area -->
        <div class="video-preview-section">
          <div class="video-preview-wrap">
            <video
              v-if="videoUrl"
              class="video-player"
              :src="videoUrl"
              :poster="coverUrl ? processImageUrl(coverUrl) : ''"
              controls
              playsinline
            ></video>
            <img
              v-if="coverUrl"
              class="cover-preview"
              :src="processImageUrl(coverUrl)"
              alt="cover"
            />
          </div>

          <!-- Permission (inline under video preview) -->
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

        <!-- Form area -->
        <div class="content-section">
          <!-- Title -->
          <div class="form-item">
            <div class="caption-container">
              <div class="label-row">
                <label class="form-label"><b>*</b>{{ t('submit.titleLabel') }}</label>
                <span class="char-count">{{ form.title.length }}/{{ TITLE_MAX }}</span>
              </div>
              <div class="title-input-wrap">
                <input
                  v-model="form.title"
                  class="title-input"
                  type="text"
                  :maxlength="TITLE_MAX"
                  :placeholder="t('submit.titlePlaceholder')"
                />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="form-item">
            <div class="caption-container">
              <div class="label-row">
                <label class="form-label">{{ t('submit.descriptionLabel') }}</label>
                <span class="char-count">{{ form.description.length }}/{{ DESC_MAX }}</span>
              </div>
              <div class="desc-input-wrap">
                <textarea
                  v-model="form.description"
                  class="description-content"
                  :maxlength="DESC_MAX"
                  :placeholder="t('submit.descriptionPlaceholder')"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Publish button -->
        <div class="submit-btn-wrap">
          <button
            class="submit-btn"
            :disabled="isUpload"
            @click="onSubmit"
          >{{ isUpload ? t('submit.count') : t('submit.submit') }}</button>
        </div>
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

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
});

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

// Top navigation tabs (5)
const tabList = [
  { name: t("submit.tabs.novel"), path: "/publish/novel" },
  { name: t("submit.tabs.manhua"), path: "/publish/comic" },
  { name: t("submit.tabs.manju"), path: "/publish/video" },
  { name: t("submit.tabs.photo"), path: "/publish/image" },
  { name: t("submit.tabs.video"), path: "/publish/clip" },
];
const tabIndex = ref(4);

function changeTab(tab: { name: string; path: string }, _index: number) {
  if (tab.path === route.path) return;
  router.replace(tab.path);
}

// Upload method tabs
const uploadOption = ref("history");
const uploadOptions = [
  { id: "history", value: "history", label: "submit.image.uploadFromHistory" },
  { id: "local", value: "local", label: "submit.video.localUpload" },
];

watch(uploadOption, (newOption) => {
  if (newOption === "history") {
    isLoadingProjects.value = true;
    fetchProjects();
  } else if (newOption === "local") {
    selectedProject.value = null;
    selectedProjectId.value = "";
    coverUrl.value = "";
    videoUrl.value = "";
  }
});

// Project list (history)
const projects = ref<any[]>([]);
const selectedProjectId = ref<string | number>("");
const selectedProject = ref<any>(null);
const isLoadingProjects = ref(true);

const currentPage = ref(1);
const totalProjects = ref(0);
const pageSize = 10;

// Full publish form state
const showFullContent = ref(false);
const videoUrl = ref("");
const coverUrl = ref("");
const sessionId = ref("");
const isUpload = ref(false);
const uploadProgress = ref(0);

// Local upload file input
const videoInputRef = ref<HTMLInputElement | null>(null);

const accessRights = computed(() => {
  if (form.value.permission === "partial") return 2;
  if (form.value.permission === "private") return 3;
  return 1;
});

function handleUserInfoLoaded() {
  // placeholder for header user-info callback
}

function goBack() {
  router.go(-1);
}

function goToHome() {
  router.push("/");
}

function getProjectCover(project: any): string {
  const ra = typeof project.result_async === 'string' ? (() => { try { return JSON.parse(project.result_async || '{}'); } catch { return {}; } })() : (project.result_async || {});
  const finalVideos = ra.final_videos || [];
  const firstVideo = finalVideos[0] || ra.final_video_output || {};
  return firstVideo.video_cover_url || ra.cover_url || ra.cover || ra.final_video_cover || project.cover || project.video_cover_url || "";
}

function getI18nMsg(res: any): string {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: "msg_cn", jp: "msg_jp", tc: "msg_tc" };
  return (res as any)[msgMap[lang] || "msg"] || res?.msg || "";
}

// Project list loading
async function fetchProjects() {
  isLoadingProjects.value = true;
  try {
    const response = (await api.singleTaskList(currentPage.value, 10, "simple_video")) as any;
    if (response.code != 200) {
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

watch(currentPage, () => {
  if (uploadOption.value === "history") {
    isLoadingProjects.value = true;
    fetchProjects();
  }
});

// Select a project from history → fetch video URL & cover → go straight to publish form
async function selectProject(project: any) {
  selectedProjectId.value = project.id;
  selectedProject.value = project;

  const cover = project?.result_async?.generate_manju_cover || project?.cover || "";
  coverUrl.value = cover;

  const currentSessionId: string =
    (project?.session_id as string) || (route.query.session_id as string) || "";
  if (currentSessionId) {
    sessionId.value = currentSessionId;
  }

  // Try to get video URL directly from result_async.final_videos first
  let url = "";
  if (project?.result_async?.final_videos?.length > 0) {
    url = project.result_async.final_videos[0].video_url || "";
  }

  // Fallback: fetch via detailChapter (episode 1)
  if (!url && currentSessionId) {
    try {
      const chapterRes = (await api.detailChapter(currentSessionId, 1)) as any;
      if (chapterRes.code == 200 && chapterRes.data) {
        const resultAsync = chapterRes.data.result_async;
        if (resultAsync?.final_video_output) {
          url =
            resultAsync.final_video_output.video_url_1080p ||
            resultAsync.final_video_output.video_url ||
            "";
        }
        if (!url && resultAsync?.final_videos?.length > 0) {
          url = resultAsync.final_videos[0].video_url || "";
        }
        if (!cover && resultAsync?.generate_manju_cover) {
          coverUrl.value = resultAsync.generate_manju_cover;
        }
        if (chapterRes.data.title) {
          form.value.title = chapterRes.data.title;
        }
        if (chapterRes.data.chapter_description) {
          form.value.description = chapterRes.data.chapter_description;
        }
      }
    } catch (error) {
      console.error("Error fetching chapter details for publish:", error);
    }
  }

  if (url) {
    videoUrl.value = url;
    showFullContent.value = true;
  } else {
    toast(t("submit.video.noVideoContent"));
  }
}

function openViewModal(project: any) {
  const url =
    project?.result_async?.final_videos?.[0]?.video_url ||
    project?.video_url ||
    "";
  if (url) {
    window.open(url, "_blank");
  }
}

// Local upload handlers
function pickVideo() {
  videoInputRef.value?.click();
}

function onDropFile(e: DragEvent) {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleVideoFile(files[0]);
  }
}

function onVideoPicked(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleVideoFile(file);
  }
  target.value = "";
}

async function handleVideoFile(file: File) {
  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  if (extension !== "mp4" && extension !== "mov") {
    toast(t("submit.video.formatError"));
    return;
  }

  isUpload.value = true;
  uploadProgress.value = 0;

  try {
    // Validate metadata first
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    const metadataOk = await new Promise<boolean>((resolve) => {
      video.onloadedmetadata = () => {
        if (video.duration > 3600) {
          resolve(false);
          return;
        }
        if (video.duration === 0 || isNaN(video.duration) || video.videoWidth === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 15000);
    });

    if (!metadataOk) {
      URL.revokeObjectURL(video.src);
      isUpload.value = false;
      if (video.duration > 3600) {
        toast(t("submit.video.durationLimit"));
      } else {
        toast(t("submit.video.corruptedError"));
      }
      return;
    }

    URL.revokeObjectURL(video.src);

    // 1. Get uploadId + fileKey
    const videoIdResponse = (await api.getVideoId({
      filename: file.name,
      filesize: file.size,
    })) as any;
    if (!videoIdResponse || videoIdResponse.code != 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoIdResponse));
      return;
    }

    uploadProgress.value = 30;
    const { uploadId, fileKey } = videoIdResponse.data;

    // 2. Upload parts in 5MB chunks
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const uploadedParts: { PartNumber: number; ETag: string }[] = [];

    for (let i = 1; i <= totalParts; i++) {
      const start = (i - 1) * CHUNK_SIZE;
      const end = Math.min(i * CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("key", fileKey);
      formData.append("partNumber", String(i));
      formData.append("file", chunk);

      const authToken = localStorage.getItem("token") ?? "";
      const authHeaders = (window as any).AntiCrawler.generateAuthParams(authToken);
      const videoUrlResponse = await fetch(baseUrl + "user/uploadCosPart", {
        method: "POST",
        headers: {
          token: authToken || undefined,
          Platform: "web",
          ...authHeaders,
        } as Record<string, string>,
        body: formData,
      });
      const videoUrlData = await videoUrlResponse.json();
      if (!videoUrlData || videoUrlData.code !== 0) {
        isUpload.value = false;
        toast(getI18nMsg(videoUrlData));
        return;
      }

      const etag = videoUrlData.data?.etag || "";
      uploadedParts.push({ PartNumber: i, ETag: etag });

      uploadProgress.value = Math.round(30 + (i / totalParts) * 60);
    }

    // 3. Merge parts
    const videoMergeResponse = (await api.getVideoMerge({
      uploadId,
      key: fileKey,
      parts: JSON.stringify(uploadedParts),
    })) as any;
    if (!videoMergeResponse || videoMergeResponse.code !== 0) {
      isUpload.value = false;
      toast(getI18nMsg(videoMergeResponse));
      return;
    }

    videoUrl.value = videoMergeResponse.data.url || "";
    uploadProgress.value = 100;

    // Capture first frame as cover
    await captureFirstFrame(file);

    isUpload.value = false;
    showFullContent.value = true;
  } catch (error) {
    isUpload.value = false;
    toast(t("fail"));
  }
}

async function captureFirstFrame(file: File) {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
      resolve();
    };
    video.onerror = () => resolve();
  });

  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
    setTimeout(() => resolve(), 3000);
  });

  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    await mockUploadCover(dataUrl);
  } catch (error) {
    console.error("Error capturing first frame:", error);
  }

  URL.revokeObjectURL(video.src);
}

async function mockUploadCover(dataUrl: string) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], "cover.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);

    const authHeaders = (window as any).AntiCrawler.generateAuthParams(token);

    const res = await fetch(baseUrl + "user/uploadFile", {
      method: "POST",
      headers: {
        token: token,
        Platform: "web",
        ...authHeaders,
      } as Record<string, string>,
      body: formData,
    });
    const data = await res.json();
    if (data && (data.code === 0 || data.code === 200) && data.data?.url) {
      coverUrl.value = data.data.url;
    }
  } catch (error) {
    console.error("Error uploading cover:", error);
  }
}

// Publish submit
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

  if (!videoUrl.value) {
    toast(t("submit.video.toastUploadFirst"));
    return;
  }

  if (!coverUrl.value) {
    toast(t("submit.video.toastSetCover"));
    return;
  }

  isUpload.value = true;

  try {
    const payload = {
      type: 3,
      title: form.value.title.trim(),
      cover: coverUrl.value,
      content: form.value.description.trim(),
      is_nsfw: form.value.content === "yes" ? 1 : 0,
      access_rights: accessRights.value,
      video_url: videoUrl.value,
      book_id: 0,
      chapter_index: 0,
      cover_color: "",
      cover_title: "",
      ...(sessionId.value ? { session_id: sessionId.value } : {}),
    };

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
      router.push("/publish/success?type=3");
    } else {
      toast(getI18nMsg(res));
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isUpload.value = false;
  }
}

// URL jump entry
onMounted(async () => {
  const sid = route.query.session_id as string;

  if (sid) {
    sessionId.value = sid;
    // 通过 session_id 请求详情接口获取视频数据
    try {
      const detailRes = await api.detailProject(sid) as any;
      if (detailRes.code === 200 && detailRes.data) {
        const ra = typeof detailRes.data.result_async === 'string'
          ? (() => { try { return JSON.parse(detailRes.data.result_async || '{}'); } catch { return {}; } })()
          : (detailRes.data.result_async || {});
        const finalVideos = ra.final_videos || [];
        const firstVideo = finalVideos[0] || ra.final_video_output || {};
        const vUrl = firstVideo.video_url || ra.final_video || detailRes.data.video_url || '';
        const vCover = firstVideo.video_cover_url || ra.cover_url || ra.cover || ra.final_video_cover || detailRes.data.cover || '';
        if (vUrl) {
          videoUrl.value = vUrl;
          coverUrl.value = vCover;
          showFullContent.value = true;
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching project detail:", error);
    }
  }

  // default to history tab
  isLoadingProjects.value = true;
  fetchProjects();
});
</script>

<style lang="scss" scoped>
@use "@/scss/Clip.scss";
</style>
