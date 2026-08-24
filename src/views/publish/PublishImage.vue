<template>
  <div class="publish-image" :class="imageUrls.length > 0 ? 'on' : ''">
    <Header :cur="-1"></Header>

    <div class="publish-container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <!-- Image Preview Area -->
      <div class="preview-section" v-if="imageUrls.length > 0">
        <div class="form-label-box">
          <span><b>*</b>{{ t('submit.image.imageLabel') }}</span>
        </div>
        <div class="preview-grid">
          <div
            v-for="(url, index) in imageUrls"
            :key="index"
            class="preview-item"
            :class="{ 'is-cover': index === 0 }"
          >
            <img :src="processImageUrl(url)" alt="" class="preview-img" />
            <span v-if="index === 0" class="cover-badge">{{ t('submit.coverLabel') }}</span>
          </div>
        </div>
      </div>

      <!-- Form Area -->
      <div class="form-section">
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

        <!-- Permission -->
        <div class="form-item">
          <div class="form-label-box">
            <span>{{ t('submit.permission') }}</span>
          </div>
          <div class="perm-options">
            <div
              class="perm-option"
              v-for="(opt, index) in permOptions"
              :key="opt.key"
              @click="handlePermissionChange(opt.key, index)"
            >
              <img :src="form.permission === opt.key ? selectActive : select" alt="" />
              <span>{{ t(opt.labelKey) }}</span>
            </div>
          </div>
        </div>

        <!-- Original Content -->
        <div class="form-item">
          <div class="form-label-box">
            <span>{{ t('submit.contentSettings') }}</span>
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

      <!-- Collection Section -->
      <div class="collection-section">
        <div class="form-item">
          <div class="form-label-box">
            <label class="form-label"><b>*</b>{{ t('submit.collection') }}</label>
            <div class="switch-collection-btn" @click="openCollectionSearch">
              <span>{{ t('collection.switchCollection') }}</span>
            </div>
          </div>

          <div class="collection-display" v-if="selectedCollection">
            <img v-if="selectedCollection.cover" :src="processImageUrl(selectedCollection.cover)" alt="" class="collection-cover" />
            <div class="collection-text">
              <span class="collection-name">{{ selectedCollection.name }}</span>
              <span class="collection-desc" v-if="selectedCollection.description">{{ selectedCollection.description }}</span>
              <span class="collection-episode">{{ t('collection.orderInCollection') }}{{ selectedEpisodeNumber }}</span>
            </div>
          </div>
          <div class="collection-info" v-else>
            <span class="collection-name no-collection" @click="openCollectionSearch">{{ t('collection.noCollection') }}</span>
          </div>
        </div>

        <!-- Collection Search Panel -->
        <div class="collection-search-panel" v-if="showCollectionSearch">
          <div class="search-header">
            <input
              type="text"
              class="search-input"
              v-model="collectionSearchKeyword"
              :placeholder="t('collection.placeholder')"
              @keyup.enter="searchCollections"
            />
            <button class="search-btn" @click="searchCollections">{{ t('collection.selectCollection') }}</button>
            <button class="new-btn" @click="showNewCollectionForm = !showNewCollectionForm">{{ t('collection.newCollection') }}</button>
          </div>

          <!-- New Collection Form -->
          <div class="new-collection-form" v-if="showNewCollectionForm">
            <input
              type="text"
              class="form-input"
              v-model="newCollectionName"
              :placeholder="t('collection.collectionName')"
            />
            <textarea
              class="form-textarea"
              v-model="newCollectionDesc"
              :placeholder="t('collection.descriptionPlaceholder')"
              rows="3"
            ></textarea>
            <button class="create-btn" @click="createNewCollection">{{ t('collection.createCollection') }}</button>
          </div>

          <!-- Search Results -->
          <div class="search-results" v-if="collectionResults.length > 0">
            <div
              v-for="item in collectionResults"
              :key="item.id"
              class="result-item"
              @click="selectCollection(item)"
            >
              <img v-if="item.cover" :src="processImageUrl(item.cover)" alt="" class="result-cover" />
              <div class="result-text">
                <span class="result-name">{{ item.title || item.name }}</span>
                <span class="result-desc" v-if="item.description">{{ item.description }}</span>
              </div>
            </div>
          </div>
          <div class="no-results" v-else-if="hasSearched">
            <span>{{ t('collection.noCollection') }}</span>
          </div>
        </div>
      </div>

      <!-- Publish Button -->
      <div class="submit-section">
        <button class="publish-btn" :disabled="isUploading" @click="onSubmit">
          {{ isUploading ? t('submit.publishing') : t('submit.submit') }}
        </button>
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

const permOptions = [
  { key: "public", labelKey: "submit.permPublic" },
  { key: "partial", labelKey: "submit.permPartial" },
  { key: "private", labelKey: "submit.permPrivate" },
];

const contentOptions = [
  { key: "yes", labelKey: "submit.yes" },
  { key: "no", labelKey: "submit.no" },
];

interface CollectionInfo {
  id: string | number;
  name: string;
  cover?: string;
  description?: string;
  is_nsfw?: number;
}

const form = ref({
  title: "",
  description: "",
  permission: "public",
  content: "no",
});

const session_id = ref("");
const imageUrls = ref<string[]>([]);
const coverUrl = ref("");
const isUploading = ref(false);
const titleError = ref(false);

// Collection state
const selectedCollection = ref<CollectionInfo | null>(null);
const selectedEpisodeNumber = ref("1");
const showCollectionSearch = ref(false);
const collectionSearchKeyword = ref("");
const collectionResults = ref<any[]>([]);
const hasSearched = ref(false);
const showNewCollectionForm = ref(false);
const newCollectionName = ref("");
const newCollectionDesc = ref("");
const uid = localStorage.getItem("uid") || "";

const coverPreview = computed(() => coverUrl.value || (imageUrls.value.length > 0 ? imageUrls.value[0] : ""));

onMounted(async () => {
  const sessionId = route.query.session_id as string;
  const imageUrlsQuery = route.query.image_urls as string;
  const cover = route.query.cover as string;

  if (sessionId) {
    session_id.value = sessionId;
  }

  if (imageUrlsQuery) {
    imageUrls.value = imageUrlsQuery.split(",").filter((u) => u.trim());
  }

  if (cover) {
    coverUrl.value = cover;
  }

  // Try to find existing collection by session_id
  if (sessionId) {
    await tryFindCollectionBySession(sessionId);
  }
});

async function tryFindCollectionBySession(sessionId: string) {
  try {
    const searchRes = await api.searchSessionId({ session_id: sessionId, type: 1 }) as any;
    if (searchRes?.code == 0 && searchRes.data?.book_id) {
      const book_id = searchRes.data.book_id;
      const collectionRes = await api.singleCollectionIndex(book_id) as any;
      if (collectionRes?.code == 0 && collectionRes.data) {
        const allnums = collectionRes.data.count || 0;
        const episodeNumber = parseInt(allnums) + 1;
        selectedCollection.value = {
          id: book_id,
          name: searchRes.data?.book_info?.title || "",
          cover: searchRes.data?.book_info?.cover,
          description: searchRes.data?.book_info?.description || "",
          is_nsfw: searchRes.data?.book_info?.is_nsfw ?? 0,
        };
        selectedEpisodeNumber.value = episodeNumber.toString();
      }
    }
  } catch (error) {
    console.error("Error finding collection by session:", error);
  }
}

function handlePermissionChange(permission: string, _index: number) {
  form.value.permission = permission;
}

function goBack() {
  router.go(-1);
}

function openCollectionSearch() {
  showCollectionSearch.value = !showCollectionSearch.value;
  if (!showCollectionSearch.value) {
    hasSearched.value = false;
    collectionResults.value = [];
    collectionSearchKeyword.value = "";
  }
}

async function searchCollections() {
  const keyword = collectionSearchKeyword.value.trim();
  if (!keyword) {
    toast(t("collection.enterName"));
    return;
  }

  try {
    const searchRes = await api.searchFullCollection({ title: keyword, type: 1 }) as any;
    if (searchRes?.code == 0) {
      const list = searchRes.data?.data || searchRes.data?.list || [];
      collectionResults.value = Array.isArray(list) ? list : [];
      hasSearched.value = true;
    } else {
      collectionResults.value = [];
      hasSearched.value = true;
    }
  } catch (error) {
    console.error("Error searching collections:", error);
    collectionResults.value = [];
    hasSearched.value = true;
  }
}

async function selectCollection(collection: any) {
  const book_id = collection.id || collection.book_id;
  if (!book_id) return;

  try {
    const collectionRes = await api.singleCollectionIndex(book_id) as any;
    let episodeNumber = 1;
    if (collectionRes?.code == 0 && collectionRes.data) {
      const allnums = collectionRes.data.count || 0;
      episodeNumber = parseInt(allnums) + 1;
    }

    selectedCollection.value = {
      id: book_id,
      name: collection.title || collection.name || "",
      cover: collection.cover,
      description: collection.description || "",
      is_nsfw: collection.is_nsfw ?? 0,
    };
    selectedEpisodeNumber.value = episodeNumber.toString();
    showCollectionSearch.value = false;
    hasSearched.value = false;
    collectionResults.value = [];
    collectionSearchKeyword.value = "";
  } catch (error) {
    console.error("Error selecting collection:", error);
  }
}

async function createNewCollection() {
  const name = newCollectionName.value.trim();
  if (!name) {
    toast(t("collection.enterName"));
    return;
  }

  try {
    const createRes = await api.addCollection({
      title: name,
      type: 1,
      cover: coverPreview.value || "",
      description: newCollectionDesc.value || t("collectionSettings.sampleDescription"),
      is_nsfw: 0,
    }) as any;

    if (createRes?.code == 0 && createRes.data?.book_id) {
      selectedCollection.value = {
        id: createRes.data.book_id,
        name: name,
        cover: coverPreview.value || "",
        description: newCollectionDesc.value || t("collectionSettings.sampleDescription"),
        is_nsfw: 0,
      };
      selectedEpisodeNumber.value = "1";
      showCollectionSearch.value = false;
      showNewCollectionForm.value = false;
      newCollectionName.value = "";
      newCollectionDesc.value = "";
      toast(t("collection.createSuccess"));
    } else {
      toast(createRes?.msg || t("fail"));
    }
  } catch (error) {
    console.error("Error creating collection:", error);
    toast(t("fail"));
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
    titleError.value = true;
    return;
  }

  if (imageUrls.value.length === 0) {
    toast(t("submit.image.uploadFirst"));
    return;
  }

  if (!coverPreview.value) {
    toast(t("submit.image.setCover"));
    return;
  }

  if (!selectedCollection.value) {
    toast(t("collection.noCollection"));
    return;
  }

  if (!selectedEpisodeNumber.value) {
    toast(t("collection.enterEpisode"));
    return;
  }

  isUploading.value = true;

  const payload = {
    type: 1,
    title: form.value.title.trim(),
    cover: coverPreview.value,
    content: form.value.description.trim(),
    is_nsfw: selectedCollection.value?.is_nsfw ?? 0,
    access_rights: form.value.permission == "partial" ? 2 : form.value.permission == "private" ? 3 : 1,
    image_urls: imageUrls.value,
    book_id: selectedCollection.value ? (selectedCollection.value.id || 0) : 0,
    chapter_index: selectedCollection.value ? parseInt(selectedEpisodeNumber.value) : 0,
    cover_color: "",
    cover_title: "",
    ...(session_id.value ? { session_id: session_id.value } : {}),
  };

  try {
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

    if (res.code == 0 || res.code == 200) {
      toast(t("success"));
      router.push(`/publish/success?type=${1}`);
    } else {
      toast(
        locale.value == "en"
          ? res.msg
          : locale.value == "zh"
            ? res.msg_cn
            : locale.value == "tc"
              ? res.msg_tc
              : res.msg_jp
      );
    }
  } catch (error) {
    console.error("Publish error:", error);
    toast(t("fail"));
  } finally {
    isUploading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use '@/scss/PublishImage.scss';
</style>
