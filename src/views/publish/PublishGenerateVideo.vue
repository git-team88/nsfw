<template>
  <div class="publish-generate-video">
    <Header :cur="-1"></Header>

    <div class="submit-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

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

        <!-- Permission -->
        <div class="perm-box">
          <div class="form-label-inner">
            <label class="form-label">{{ t('submit.permission') }}:</label>
          </div>
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

        <!-- Original / Sensitive content -->
        <div class="perm-box">
          <div class="form-label-inner">
            <label class="form-label">{{ t('submit.contentSettings') }}:</label>
          </div>
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

      <!-- Collection selection area -->
      <div class="collection-section">
        <div class="form-item">
          <div class="form-label-inner">
            <label class="form-label"><b>*</b>{{ t('submit.collection') }}</label>
          </div>

          <div class="collection-row">
            <!-- Selected collection -->
            <div class="collection-info" v-if="selectedCollection">
              <img
                v-if="selectedCollection.cover"
                :src="processImageUrl(selectedCollection.cover)"
                alt=""
                class="collection-cover"
              />
              <div class="collection-text">
                <span class="collection-name">{{ selectedCollection.name }}</span>
                <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
              </div>
              <span class="modify-link" @click="createNewCollection">{{ t('collection.newCollection') }}</span>
            </div>

            <!-- No collection -->
            <span
              v-else
              class="collection-name no-collection"
              @click="createNewCollection"
            >{{ t('collection.noCollection') }}</span>
          </div>

          <!-- Episode selector -->
          <div class="collection-group" v-if="!isNoCollection">
            <div class="form-label-inner">
              <label class="form-label">{{ t('collection.episodeLabel') }}</label>
            </div>
            <select v-model="selectedEpisodeNumber" class="episode-select">
              <option
                v-for="ep in episodes"
                :key="ep.value"
                :value="ep.value"
              >{{ ep.label }}</option>
            </select>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";
import { processImageUrl } from "@/util/utils";
import Header from "@/components/Header.vue";
import select from "@/assets/images/publish/select.png";
import selectActive from "@/assets/images/publish/select_active.png";

const { t, locale } = useI18n();
const route = useRoute();

const TITLE_MAX = 60;
const DESC_MAX = 4000;

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

// Route params
const sessionId = ref("");
const videoUrl = ref("");
const coverUrl = ref("");

// Collection state
const selectedCollection = ref<{
  id: string | number;
  name: string;
  cover?: string;
  description?: string;
  is_nsfw?: number;
} | null>(null);
const selectedEpisodeNumber = ref("1");
const isNoCollection = ref(true);
const episodes = ref<{ value: string; label: string }[]>([{ value: "1", label: "1" }]);

const isUpload = ref(false);

const accessRights = computed(() => {
  if (form.value.permission === "partial") return 2;
  if (form.value.permission === "private") return 3;
  return 1;
});

function goBack() {
  router.go(-1);
}

function createNewCollection() {
  // Open collection creation modal — placeholder for now
  toast(t("collection.createCollection"));
}

function getI18nMsg(res: any): string {
  const lang = locale.value;
  const msgMap: Record<string, string> = { zh: "msg_cn", jp: "msg_jp", tc: "msg_tc" };
  return (res as any)[msgMap[lang] || "msg"] || res.msg;
}

/**
 * Setup collection via session_id.
 * Reuses Video.vue's searchSessionId -> searchFullCollection -> addCollection -> singleCollectionIndex pattern.
 */
async function setupCollectionFromSession(currentSessionId: string) {
  try {
    let searchRes: any = null;
    if (currentSessionId) {
      searchRes = (await api.searchSessionId({
        session_id: currentSessionId,
        type: 3,
      })) as any;
    }
    if (!searchRes || searchRes.code != 0 || !searchRes.data?.book_id) {
      // No session-based collection; leave unselected (user can create one)
      return;
    }

    if (searchRes.code === 0) {
      const book_id = searchRes.data?.book_id || 0;

      if (book_id === 0) {
        // Should not happen here since searchRes has no book_id path already returned,
        // but keep the create branch for safety
        const createRes = (await api.addCollection({
          title: form.value.title || "",
          type: 3,
          cover: coverUrl.value || "",
          description: t("collectionSettings.sampleDescription"),
          is_nsfw: 0,
        })) as any;

        if (createRes.code === 0 && createRes.data?.book_id) {
          selectedCollection.value = {
            id: createRes.data.book_id,
            name: form.value.title || "",
            cover: coverUrl.value || "",
            description: t("collectionSettings.sampleDescription"),
            is_nsfw: 0,
          };
          selectedEpisodeNumber.value = "1";
          isNoCollection.value = false;
        }
      } else {
        const collectionRes = (await api.singleCollectionIndex(book_id)) as any;

        if (collectionRes.code === 0 && collectionRes.data) {
          const allnum = collectionRes.data.count || 0;
          const episodeNumber = parseInt(allnum) + 1;

          selectedCollection.value = {
            id: book_id,
            name: searchRes.data?.book_info?.title || "",
            cover: searchRes.data?.book_info?.cover || "",
            description: searchRes.data?.book_info?.description || "",
            is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0,
          };
          selectedEpisodeNumber.value = episodeNumber.toString();
          isNoCollection.value = false;

          episodes.value = [];
          for (let i = 1; i <= episodeNumber; i++) {
            episodes.value.push({ value: i.toString(), label: i.toString() });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error setting up collection from session:", error);
  }
}

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
      is_nsfw: selectedCollection.value?.is_nsfw ?? (form.value.content === "yes" ? 1 : 0),
      access_rights: accessRights.value,
      video_url: videoUrl.value,
      book_id: selectedCollection.value ? selectedCollection.value.id || 0 : 0,
      chapter_index: selectedCollection.value
        ? parseInt(selectedEpisodeNumber.value)
        : 0,
      cover_color: "",
      cover_title: "",
      ...(sessionId.value ? { session_id: sessionId.value } : {}),
    };

    const headers = new Headers();
    const { ts, sign } = window.AntiCrawler.generateAuthParams(token);
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

onMounted(async () => {
  const sid = route.query.session_id as string;
  const vurl = route.query.video_url as string;
  const cover = route.query.cover as string;

  if (sid) sessionId.value = sid;
  if (vurl) videoUrl.value = vurl;
  if (cover) coverUrl.value = cover;

  if (sessionId.value) {
    await setupCollectionFromSession(sessionId.value);
  }
});
</script>

<style lang="scss" scoped>
@use "@/scss/PublishGenerateVideo.scss";

/* Fallback inline styles so the component compiles even before the scss file exists */
.publish-generate-video {
  width: 100%;
  min-height: 100vh;
  padding: 140px 0 40px;
  background: #fffbf4;
  box-sizing: border-box;

  .submit-container {
    width: 800px;
    max-width: 92%;
    margin: 0 auto;
    position: relative;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #161122;
    cursor: pointer;
    margin-bottom: 20px;
    user-select: none;
  }

  .video-preview-section {
    margin-bottom: 24px;

    .video-preview-wrap {
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .video-player {
        width: 100%;
        max-height: 420px;
        object-fit: contain;
        display: block;
      }

      .cover-preview {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        display: block;
      }
    }
  }

  .content-section,
  .collection-section {
    background: #fff;
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }

  .form-item {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .caption-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .char-count {
      font-size: 12px;
      color: #9b9aa5;
    }
  }

  .form-label {
    font-size: 14px;
    color: #161122;
    font-weight: 600;

    b {
      color: #e8506f;
      margin-right: 2px;
    }
  }

  .form-label-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .title-input-wrap {
    .title-input {
      width: 100%;
      height: 44px;
      border: 1px solid #e6e0d6;
      border-radius: 10px;
      padding: 0 14px;
      font-size: 14px;
      color: #161122;
      background: #fff;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #161122;
      }
    }
  }

  .desc-input-wrap {
    .description-content {
      width: 100%;
      min-height: 120px;
      border: 1px solid #e6e0d6;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #161122;
      background: #fff;
      box-sizing: border-box;
      resize: vertical;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #161122;
      }
    }
  }

  .perm-box {
    margin-bottom: 16px;

    .perm-options {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;

      .perm-option {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;

        img {
          width: 18px;
          height: 18px;
        }

        span {
          font-size: 14px;
          color: #161122;
        }
      }
    }
  }

  .collection-row {
    .collection-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .collection-cover {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: 8px;
      }

      .collection-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;

        .collection-name {
          font-size: 14px;
          font-weight: 600;
          color: #161122;
        }

        .collection-desc {
          font-size: 12px;
          color: #9b9aa5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .modify-link {
        color: #e8506f;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
      }
    }

    .collection-name.no-collection {
      color: #9b9aa5;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .collection-group {
    margin-top: 16px;

    .episode-select {
      width: 100%;
      height: 44px;
      border: 1px solid #e6e0d6;
      border-radius: 10px;
      padding: 0 14px;
      font-size: 14px;
      color: #161122;
      background: #fff;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #161122;
      }
    }
  }

  .submit-btn-wrap {
    margin-top: 24px;
    text-align: center;

    .submit-btn {
      width: 220px;
      height: 50px;
      border: none;
      border-radius: 25px;
      background: #161122;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
