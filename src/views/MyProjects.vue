<template>
  <div class="my-projects" ref="myProjectsRef">
    <Header :cur="1"></Header>

    <div class="container">
      <div class="projects-header">
        <h2>{{ t('myProjects.title') }}</h2>
        <p class="projects-sub">{{ t('myProjects.sub') }}</p>

        <!-- Main Tabs: 小说, 漫画, 漫剧, 图片, 视频 -->
        <div class="main-tabs">
          <div
            v-for="tab in mainTabs.filter(t => t.value !== 'manju')"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeMainTab === tab.value }"
            @click="switchMainTab(tab.value)"
          >
            {{ t(`myProjects.tabs.${tab.value}`) }}
          </div>
        </div>

        <!-- Status Tabs: Unpublished / Released (only for 漫剧) -->
        <!-- <div v-if="activeMainTab == 'manju'" class="status-tabs">
          <div
            v-for="tab in statusTabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeStatusTab === tab.value }"
            @click="switchStatusTab(tab.value)"
          >
            {{ t(`myProjects.status.${tab.value}`) }}
          </div>
        </div> -->
      </div>

      <!-- Process List -->
      <div class="process-section">
        <ProcessList />
      </div>

      <!-- Projects List -->
      <div class="projects-box">
        <!-- Waterfall List -->
        <div
          class="projects-container"
        >
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ t('home.loading') }}</div>
          </div>

          <!-- Empty State -->
          <EmptyState v-else-if="projects.length === 0 && !loadingMore" />

          <div
            v-else
            class="waterfall"
            ref="waterfallRef"
          >
            <div
              class="project-card"
              :class="{ 'menu-open': activeMenuProjectId === project.id }"
              v-for="(project, index) in projects"
              :key="project.id"
              ref="projectCardRefs"
              :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
            >

              <!-- Project Cover -->
              <div class="card-cover" v-if="activeMainTab == 'manju'">
                <div class="publish-btn" @click="toPublish(project)" v-if="activeStatusTab == 'unpublished' && project.is_final == 1"> {{ t('myProjects.buttons.publish') }}</div>

                <!-- Use video cover from result_async.final_video_output if available -->
                <div v-if="project.result_async?.final_video_output?.video_cover_url" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.final_video_output.video_cover_url)" alt="" />
                  </div>
                </div>
                <!-- Use generate_manju_cover if available -->
                <div v-else-if="project.result_async?.generate_manju_cover" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_manju_cover)" alt="" />
                  </div>
                </div>
                <!-- Use images from result_async.generate_character_main_views if no manju cover -->
                <div v-else-if="project.result_async?.generate_character_main_views && project.result_async.generate_character_main_views.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_character_main_views[0].main_image_url)" alt="" />
                  </div>
                </div>
                <!-- Use images from result_async.generate_character_images if no main views -->
                <div v-else-if="project.result_async?.generate_character_images && project.result_async.generate_character_images.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_character_images[0].main_image_url)" alt="" />
                  </div>
                </div>
                <!-- Fallback to original cover if no character images -->
                <img v-else :src="project.cover ? processImageUrl(project.cover) : pic" alt="" class="cover-img" />
                <!-- Video Play Overlay -->
                <div class="video-overlay" v-if="project.result_async?.final_video_output?.video_url" @click="playVideo(project.result_async?.final_video_output?.video_url)">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>
                <!-- Edit Button -->
                <div class="edit-btn" @click="openEditPage(project.session_id, 1)">{{ t('myProjects.buttons.edit') }}</div>
              </div>

              <div class="card-cover" v-if="activeMainTab == 'manhua'">
                <!-- Use generate_manhua_cover if available -->
                <div v-if="project.result_async?.generate_manhua_cover" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_manhua_cover)" alt="" />
                  </div>
                </div>
                <!-- Use images from result_async.generate_character_main_views if no manhua cover -->
                <div v-else-if="project.result_async?.generate_character_main_views && project.result_async.generate_character_main_views.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_character_main_views[0].main_image_url)" alt="" />
                  </div>
                </div>
                <!-- Use images from result_async.generate_character_images if no main views -->
                <div v-else-if="project.result_async?.generate_character_images && project.result_async.generate_character_images.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="processImageUrl(project.result_async.generate_character_images[0].main_image_url)" alt="" />
                  </div>
                </div>
                <!-- Fallback to original cover if no character images -->
                <img v-else :src="project.cover ? processImageUrl(project.cover) : pic" alt="" class="cover-img" />

                <div class="edit-btn" @click="openEditPage(project.session_id, 2)">{{ t('myProjects.buttons.edit') }}</div>
              </div>

              <div v-else-if="activeMainTab == 'novel'">
                <div v-if="project.result_async && project.result_async.generate_novel_cover" class="card-cover">
                  <img :src="processImageUrl(project.result_async.generate_novel_cover)" alt="" class="cover-img" />
                  <div class="edit-btn" @click="openEditPage(project.session_id, 3)">{{ t('myProjects.buttons.edit') }}</div>
                </div>

                <div v-else-if="project.name" class="novel-cover">
                  <b>“</b>
                  <span>{{ project.name }}</span>
                  <div class="edit-btn" @click="openEditPage(project.session_id, 3)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
                <div v-else class="card-cover">
                  <img :src="pic" alt="" class="cover-img" />
                  <div class="edit-btn" @click="openEditPage(project.session_id, 3)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
              </div>

              <!-- Photo Tab - 图片类型 -->
              <div v-else-if="activeMainTab == 'photo'">
                <div class="card-cover photo-cover">
                  <!-- 只有1张：填满显示 -->
                  <div v-if="project.images && project.images.length === 1" class="single-image">
                    <img :src="processImageUrl(project.images[0])" alt="" class="single-image-img" />
                  </div>
                  <!-- 多张：final_images 返回几张就显示几张 -->
                  <div v-else-if="project.images && project.images.length > 0" class="grid-images">
                    <div
                      class="grid-image-item"
                      v-for="(img, index) in project.images"
                      :key="index"
                    >
                      <img :src="processImageUrl(img)" alt="" />
                    </div>
                  </div>
                  <div v-else class="default-cover">
                    <img :src="pic" alt="" class="cover-img" />
                  </div>
                  <!-- 悬浮编辑按钮 -->
                  <div class="photo-edit-btn" @click="goToGenerate(project)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
              </div>

              <!-- Video Tab - 视频类型 -->
              <div v-else-if="activeMainTab == 'video'">
                <div class="card-cover video-cover">
                  <img :src="project.result_async?.final_videos?.[0]?.video_cover_url ? processImageUrl(project.result_async.final_videos[0].video_cover_url) : (project.cover ? processImageUrl(project.cover) : pic)" alt="" class="cover-img" />

                  <div class="video-edit-btn" @click="goToGenerate(project)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
              </div>

              <!-- Project Info -->
              <div class="card-info">
                <div class="card-desc" v-if="project.name">{{ project.name }}</div>
                <div class="card-footer">
                  <span class="time">{{ formatTimestamp(project.created_at || project.updated_at || '') }}</span>
                  <!-- Three-dot Menu -->
                  <div class="more-btn-wrap" :ref="(el) => setMenuRef(el, project.id)">
                    <img
                      src="@/assets/images/detail/menu.png"
                      @click.stop="toggleMenu(project.id, $event)"
                    />
                    <!-- Dropdown Menu -->
                    <div
                      class="dropdown-menu"
                      v-if="activeMenuProjectId === project.id"
                      :class="dropdownPos"
                    >
                      <!-- 重命名只对小说、漫画、漫剧显示 -->
                      <div v-if="activeMainTab === 'novel' || activeMainTab === 'manhua' || activeMainTab === 'manju'" class="menu-item" @click="openRenameModal(project.session_id, project.name)">{{ t('myProjects.menu.rename') }}</div>
                      <div class="menu-item delete" @click="openDeleteModal(project)">{{ t('myProjects.menu.delete') }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="loading-trigger" ref="loadingSentinel" v-if="loadingMore">
            <span>{{ t('home.loading') }}</span>
          </div>
        </div>
      </div>

      <!-- Video Preview Modal -->
      <PreviewModal
        :visible="showVideoModal"
        :videoUrl="currentVideoUrl"
        @close="closeVideoModal"
      />

      <!-- Rename Modal -->
      <RenameModal
        :visible="showRenameModal"
        :projectId="selectedProjectId"
        :currentName="selectedProjectName"
        @close="closeRenameModal"
        @confirm="handleRenameConfirm"
      />

      <!-- Delete Confirm Modal -->
      <DeleteRecordModal
        :visible="showDeleteRecordModal"
        @close="handleCloseDeleteModal"
        @confirm="handleConfirmDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="MyProjects">
import { ref, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import Header from '@/components/Header.vue';
import EmptyState from '@/components/EmptyState.vue';
import PreviewModal from '@/components/PreviewModal.vue';
import RenameModal from '@/components/RenameModal.vue';
import DeleteRecordModal from '@/components/DeleteRecordModal.vue';
import ProcessList from '@/components/ProcessList.vue';
import { aiUrl } from '@/util/config';
import pic from '@/assets/images/base/cover.png'
import api from '@/api/index';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import { toast } from '@/util/toast';
import router from '@/router';
import { formatTimestamp, processImageUrl } from '@/util/utils';

const { t, locale } = useI18n();
const contentSwitch = useContentSwitchStore();

const route = useRoute();

// State
const activeMainTab = ref('video');
const activeStatusTab = ref('unpublished');
const projects = ref<any[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const showVideoModal = ref(false);
const currentVideoUrl = ref('');
const currentPage = ref(1);
const showDeleteRecordModal = ref(false);
const projectToDelete = ref<any>(null);
const itemsPerPage = ref(20);
const myProjectsRef = ref<HTMLElement | null>(null);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

// Menu and Rename State
const activeMenuProjectId = ref<number | null>(null);
const showRenameModal = ref(false);
const selectedProjectId = ref<string | number>('');
const selectedProjectName = ref('');
const menuRefs = new Map<string | number, HTMLElement>();
const dropdownPos = ref("bottom");

// Layout state
const projectCardRefs = ref<HTMLElement[]>([]);
const loadingSentinel = ref<HTMLElement | null>(null);

// Tabs Data
const mainTabs = ref([
  { value: 'video', id: 5 },
  { value: 'photo', id: 4 },
  { value: 'manhua', id: 2 },
  { value: 'manju', id: 3 },
  { value: 'novel', id: 1 }
]);

const statusTabs = ref([
  { value: 'unpublished' },
  { value: 'released' }
]);

// Methods
function switchMainTab(tab: string) {
  activeMainTab.value = tab;
  currentPage.value = 1;
  projects.value = [];
  hasMore.value = true;
  const tabItem = mainTabs.value.find(t => t.value === tab);
  router.replace({ path: '/my-projects', query: { ...route.query, tab: tabItem?.id } });
  loadProjects(true);
}

function switchStatusTab(tab: string) {
  activeStatusTab.value = tab;
  currentPage.value = 1;
  projects.value = [];
  hasMore.value = true;
  loadProjects(true);
}

function toPublish(project: any) {
  const videoUrl = project.result_async.final_video_output.video_url;
  const coverUrl = project.result_async.final_video_output.video_cover_url;
  const sessionId = project.session_id;

  router.push({
    path: '/publish/video',
    query: {
      session_id: sessionId,
      url: videoUrl,
      cover: coverUrl,
    }
  });
}

function openEditPage(sessionId: string, type: number) {
  if (type == 3) {
    router.push(`/novel/${sessionId}`);
  } else if (type == 2) {
    window.location.href = `/tools/comic/${sessionId}`;
    // window.open(`/tools/comic/${sessionId}`, '_blank');
  } else {
    window.location.href = `/tools/video/${sessionId}`;
    // window.open(`/tools/video/${sessionId}`, '_blank');
  }
}

function goToGenerate(project: any) {
  try {
    sessionStorage.setItem('targetGenerateRecord', JSON.stringify(project));
  } catch {
    sessionStorage.removeItem('targetGenerateRecord');
  }
  // 不把 session_id 放进 URL query，避免刷新后地址栏残留 session_id 导致反复定位；
  // 定位所需的目标记录通过 sessionStorage 传递（Generate 页用完即清除）
  router.push({ name: 'Generate' });
}

function playVideo(videoUrl: string) {
  currentVideoUrl.value = videoUrl;
  showVideoModal.value = true;
}

function closeVideoModal() {
  showVideoModal.value = false;
  currentVideoUrl.value = '';
}

function setMenuRef(el: object | null, id: number) {
  if (el) menuRefs.set(id, el as HTMLElement);
}

function toggleMenu(projectId: number, event?: MouseEvent) {
  if (activeMenuProjectId.value === projectId) {
    activeMenuProjectId.value = null;
  } else {
    activeMenuProjectId.value = projectId;
    if (event) {
      const clickY = event.clientY;
      const screenHeight = window.innerHeight;
      // If click is in the bottom 30% of the screen, show menu on top
      if (clickY > screenHeight * 0.7) {
        dropdownPos.value = "top";
      } else {
        dropdownPos.value = "bottom";
      }
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;

  // Close menu if clicked outside
  if (activeMenuProjectId.value !== null) {
    const el = menuRefs.get(activeMenuProjectId.value);
    if (el && !el.contains(target)) {
      activeMenuProjectId.value = null;
    }
  }
}

function openRenameModal(projectId: string | number, projectName: string) {
  selectedProjectId.value = projectId;
  selectedProjectName.value = projectName;
  showRenameModal.value = true;
  activeMenuProjectId.value = null;
}

function closeRenameModal() {
  showRenameModal.value = false;
  selectedProjectId.value = '';
  selectedProjectName.value = '';
}

async function handleRenameConfirm(newName: string) {
  try {
    const response = await api.modifyProject({
      session_id: selectedProjectId.value,
      name: newName
    });

    const data = response as any;
    if (data.code == 200) {
      // Temporarily remove scroll event listener to prevent duplicate requests
      if (myProjectsRef.value) {
        myProjectsRef.value.removeEventListener('scroll', handleScroll);
      }

      await loadProjects(true);

      if (myProjectsRef.value) {
        myProjectsRef.value.scrollTop = 0;
        // Re-add scroll event listener after a short delay
        setTimeout(() => {
          myProjectsRef.value?.addEventListener('scroll', handleScroll);
        }, 500);
      }

      closeRenameModal();
    } else {
      toast(data.message);
    }
  } catch (error) {
    toast(t('fail'));
  }
}

function openDeleteModal(project: any) {
  projectToDelete.value = project;
  showDeleteRecordModal.value = true;
  activeMenuProjectId.value = null;
}

function handleCloseDeleteModal() {
  showDeleteRecordModal.value = false;
  projectToDelete.value = null;
}

async function handleConfirmDelete() {
  if (!projectToDelete.value) return;

  try {
    const response = await api.deleteProject({
      session_id: projectToDelete.value.session_id
    });

    const data = response as any;
    if (data.code == 200) {
      // Temporarily remove scroll event listener to prevent duplicate requests
      if (myProjectsRef.value) {
        myProjectsRef.value.removeEventListener('scroll', handleScroll);
      }

      // Reset current page before loading projects
      currentPage.value = 1;
      projects.value = [];
      hasMore.value = true;

      // Load projects with reset=true
      await loadProjects(true);

      // Scroll to top
      if (myProjectsRef.value) {
        myProjectsRef.value.scrollTop = 0;
        // Re-add scroll event listener after a short delay
        setTimeout(() => {
          myProjectsRef.value?.addEventListener('scroll', handleScroll);
        }, 500);
      }

      activeMenuProjectId.value = null;
    } else {
      toast(data.message);
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    showDeleteRecordModal.value = false;
    projectToDelete.value = null;
  }
}

async function loadProjects(reset = false) {
  if (reset) {
    currentPage.value = 1;
    projects.value = [];
    hasMore.value = true;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab combination at the time of the request
  const currentTab = activeMainTab.value;
  const currentStatus = activeStatusTab.value;

  try {
    await contentSwitch.ensureLoaded();
    const projectNsfw = contentSwitch.projectNsfwFilter;
    let response;
    if (activeMainTab.value == 'photo') {
      response = await api.getProject(0, 'simple_image', currentPage.value, itemsPerPage.value, 0, projectNsfw) as any;
    } else if (activeMainTab.value === 'video') {
      response = await api.getProject(0, 'simple_video', currentPage.value, itemsPerPage.value, 0, projectNsfw) as any;
    } else {
      response = await api.getProject(0, activeMainTab.value, currentPage.value, itemsPerPage.value, 0, projectNsfw) as any;
    }

    // Check if this request is still the latest one
    if (requestId != currentRequestId.value) {
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab has changed while the request was in flight
    if (currentTab !== activeMainTab.value || currentStatus !== activeStatusTab.value) {
      return; // Skip processing this response as the tab has changed
    }

    if (response.code == 200 || response.code == 0) {
      let newProjects = response.data?.data_list || response.data_list || [];

      // Process projects based on tab type
      newProjects = newProjects.map((project: any) => {
        const processedProject = { ...project };

        if (activeMainTab.value == 'photo') {
          // result_async may be an object or a JSON string
          let ra = project.result_async;
          if (typeof ra === 'string') {
            try { ra = JSON.parse(ra); } catch (e) { ra = null; }
          }
          // Extract images from result_async.final_images for photo projects
          processedProject.images = ra?.final_images || [];

          // user_selected may be an object or a JSON string; story_mode may also live under result_async
          let us = project.user_selected;
          if (typeof us === 'string') {
            try { us = JSON.parse(us); } catch (e) { us = null; }
          }
          // Save story_mode for display logic (nsfw -> single image, otherwise 4-grid)
          processedProject.story_mode = us?.story_mode ?? ra?.user_selected?.story_mode ?? project.story_mode;
        } else if (activeMainTab.value == 'video') {
          // result_async may be an object or a JSON string
          let ra = project.result_async;
          if (typeof ra === 'string') {
            try { ra = JSON.parse(ra); } catch (e) { ra = null; }
          }
          processedProject.result_async = ra;
          // Extract video info for video projects
          if (ra?.final_video_output) {
            processedProject.videoUrl = ra.final_video_output.video_url;
            processedProject.cover = ra.final_video_output.video_cover_url || project.cover;
          } else if (ra?.final_videos?.[0]) {
            processedProject.videoUrl = ra.final_videos[0].video_url;
            processedProject.cover = ra.final_videos[0].video_cover_url || project.cover;
          }
        }

        return processedProject;
      });

      if (currentPage.value == 1) {
        projects.value = newProjects;
      } else {
        projects.value = [...projects.value, ...newProjects];
      }

      const rawProjectCount = response.data?.count || response.data?.data?.length || newProjects.length;
      if (rawProjectCount < itemsPerPage.value) {
        hasMore.value = false;
      } else {
        const totalCount = response.data?.data_count || response.data_count || 0;
        hasMore.value = projects.value.length < totalCount;
      }

      // Wait for images to load before updating loading state
      nextTick(() => {
        let loadedCount = 0;
        const total = newProjects.length;
        if (total === 0) {
          loadingMore.value = false;
          loading.value = false;
          return;
        }

        newProjects.forEach((project: any) => {
          // Load cover image
          if (project.cover || project.cover_image) {
            const img = new Image();
            img.src = project.cover || project.cover_image;
            img.onload = img.onerror = () => {
              loadedCount++;
              if (loadedCount === total) {
                loadingMore.value = false;
                loading.value = false;
              }
            };
          } else {
            loadedCount++;
            if (loadedCount === total) {
              loadingMore.value = false;
              loading.value = false;
            }
          }
        });
      });

      currentPage.value++;
    } else {
      console.error('API Error:', response.msg || 'Unknown error');
      if (currentPage.value === 1) {
        projects.value = [];
      }
      hasMore.value = false;
      loadingMore.value = false;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    if (currentPage.value === 1) {
      projects.value = [];
    }
    hasMore.value = false;
    loadingMore.value = false;
    loading.value = false;
  } finally {
    if (!reset) {
      loadingMore.value = false;
    }
  }
}

async function loadMoreProjects() {
  if (loadingMore.value || !hasMore.value) return;

  loadingMore.value = true;
  await loadProjects(false);
}

// Lifecycle
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  window.scrollTo(0, 0);

  // Check for tab parameter in route query
  const tabParam = route.query.tab as string;
  if (tabParam) {
    const tabItem = mainTabs.value.find(t => String(t.id) === tabParam);
    if (tabItem) {
      activeMainTab.value = tabItem.value;
    }
  }

  // Load initial projects
  await loadProjects(true);

  // Add scroll event listener for auto loading
  if (myProjectsRef.value) {
    myProjectsRef.value.addEventListener('scroll', handleScroll);
  }

  // Add click outside event listener
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  // Remove scroll event listener
  if (myProjectsRef.value) {
    myProjectsRef.value.removeEventListener('scroll', handleScroll);
  }

  // Remove click outside event listener
  document.removeEventListener('click', handleClickOutside);
});

// Handle scroll event for auto loading
function handleScroll() {
  if (loadingMore.value || !hasMore.value || !myProjectsRef.value) return;

  const scrollTop = myProjectsRef.value.scrollTop;
  const scrollHeight = myProjectsRef.value.scrollHeight;
  const clientHeight = myProjectsRef.value.clientHeight;

  // Check if scroll is near bottom (10px threshold)
  if (scrollHeight - scrollTop - clientHeight < 10) {
    loadMoreProjects();
  }
}
</script>

<style lang="scss" scoped>
$ink: #f5f5f5;
$paper: #1a1a1a;
$cream: #111111;
$pink: #ff4f9a;
$muted: #777;
$sub: #aaa;
$line: #2c2c2c;
$yellow: #FFD23F;

.my-projects {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
  scroll-behavior: smooth;
  overflow-y: auto;
  max-height: 100vh;
}

.container {
  max-width: 1280px;
  margin: 0 auto 20px;
  padding: 100px 12px 20px;

  @media (min-width: 768px) {
    padding: 100px 16px 24px;
  }
}

.projects-header {
  margin-bottom: 24px;

  h2 {
    font-weight: 800;
    font-size: 26px;
    color: $ink;
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  .projects-sub {
    font-size: 13px;
    color: $muted;
    font-weight: 600;
    margin-bottom: 18px;
  }

  .main-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;

    .tab-item {
      font-weight: 800;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 25px;
      border: 1px solid #404040;
      cursor: pointer;
      transition: all 0.16s;
      background: #1a1a1a;
      color: #888;

      &.active {
        color: #fff;
        border: 1px solid #ff9aca;
        border-radius: 18px;
        background: linear-gradient(145deg, #ff65ab, #f02c80);
        box-shadow: 0 0 23px rgba(255, 50, 140, .65);
      }

      &:hover:not(.active) {
        color: $ink;
      }
    }
  }

  .status-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .tab-item {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 16px;
      border-radius: 6px;
      font-size: 14px;
      color: $muted;
      cursor: pointer;
      position: relative;

      &:hover {
        color: $sub;
      }

      &.active {
        background: $paper;
        color: $ink;
      }
    }
  }
}

/* Process Section */
.process-section {
  margin-bottom: 10px;
}

.projects-box {
  min-height: 400px;
}

.projects-container {
  min-height: 400px;
  overflow: visible;

  .waterfall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 16px;
    width: 100%;
    margin: 0 auto;
    overflow: visible;
  }

  .project-card {
    position: relative;
    break-inside: avoid;
    background: #1a1a1a;
    border: 1px solid #2c2c2c;
    border-radius: 12px;
    box-shadow: none;
    cursor: pointer;
    overflow: visible;
    transition: border-color 0.15s;

    &.menu-open {
      z-index: 100;
    }

    &:hover {
      border-color: #ff4f9a;
    }

    .publish-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      border: 1px solid #3d3d3d;
      color: #ddd;
      font-weight: 800;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 999px;
      cursor: pointer;
      z-index: 10;
      box-shadow: none;
      opacity: 0;

      &:hover {
        border-color: #ff4f9a;
        color: #fff;
      }
    }

    .card-cover {
      position: relative;
      width: 100%;
      height: 260px;
      overflow: hidden;
      border-radius: 11px 11px 0 0;

      .cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
      }

      .character-images {
        width: 100%;
        height: 100%;
      }

      .character-image-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
      }

      .video-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -42%);
        cursor: pointer;
        z-index: 5;

        img {
          width: 60px;
          height: 60px;
        }
      }
    }

    .novel-cover {
      display: flex;
      justify-content: center;
      position: relative;
      height: 260px;
      padding: 70px 30px 0;
    font-size: 26px;
      line-height: 30px;
      background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
      color: #f5f5f5;
      overflow: hidden;
      border-radius: 11px 11px 0 0;

      &:hover {
        .edit-btn {
          opacity: 1;
        }
      }

      b {
        position: absolute;
        left: 30px;
        top: 40px;
        font-weight: 800;
        font-size: 48px;
        color: #f5f5f5;
      }

      span {
        height: 80px;
        overflow-y: hidden;
        word-break: break-all;
      }
    }

    .edit-btn {
      position: absolute;
      bottom: 12px;
      left: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      padding: 0 24px;
      height: 42px;
      border: 2px solid #ff9aca;
      border-radius: 18px;
      box-shadow: 0 0 16px rgba(255, 50, 140, .65);
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1);

      &:hover {
        transform: translateX(-50%);
      }
    }

    .card-cover:hover,
    .novel-cover:hover {
      .edit-btn {
        opacity: 1;
      }
    }

    .photo-cover {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grid-images {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      width: 100%;
      height: 100%;
      border-radius: 12px 12px 0 0;
      overflow: hidden;
    }

    .grid-image-item {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e7e1d8;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .single-image {
      width: 100%;
      height: 100%;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .single-image-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: $muted;
      font-size: 14px;
    }

    .photo-edit-btn {
      position: absolute;
      bottom: 12px;
      left: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      padding: 0 24px;
      height: 42px;
      border: 2px solid #ff9aca;
      border-radius: 18px;
      box-shadow: 0 0 16px rgba(255, 50, 140, .65);
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1);

      &:hover {
        transform: translateX(-50%);
      }
    }

    .photo-cover:hover {
      .photo-edit-btn {
        opacity: 1;
      }
    }

    .default-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px 12px 0 0;
      overflow: hidden;

      .cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .video-edit-btn {
      position: absolute;
      bottom: 12px;
      left: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      padding: 0 24px;
      height: 42px;
      border: 2px solid #ff9aca;
      border-radius: 18px;
      box-shadow: 0 0 16px rgba(255, 50, 140, .65);
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1);

      &:hover {
        transform: translateX(-50%);
      }
    }

    .video-cover:hover {
      .video-edit-btn {
        opacity: 1;
      }
    }

    &:hover {
      .publish-btn {
        opacity: 1;
      }
    }

    .card-info {
      padding: 12px 14px 14px;

      .card-desc {
        font-size: 14px;
        font-weight: 800;
        color: #f5f5f5;
        margin-bottom: 8px;
        line-height: 20px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .time {
          font-size: 12px;
          color: #777;
          font-weight: 600;
        }

        .more-btn-wrap {
          position: relative;

          img {
            width: 18px;
            height: 18px;
            cursor: pointer;
            filter: brightness(0) invert(1);
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            border: 1px solid #3d3d3d;
            border-radius: 10px;
            padding: 4px 0;
            z-index: 9999;
            min-width: 100px;
            background: #1a1a1a;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);

            &.bottom {
              top: 100%;
              margin-top: 4px;
            }
            &.top {
              bottom: 100%;
              margin-bottom: 4px;
            }

            .menu-item {
              padding: 6px 12px;
              font-size: 13px;
              font-weight: 700;
              color: #ddd;
              cursor: pointer;
              text-align: center;

              &:hover {
                color: #fff;
              }

              &.delete {
                color: #E5484D;
              }
            }
          }
        }
      }
    }
  }

  .loading-trigger {
    text-align: center;
    padding: 20px 0;
    color: #777;
    font-size: 14px;
    font-weight: 600;
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 400px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #2c2c2c;
    border-top: 3px solid #ff4f9a;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 20px;
  }

  .loading-text {
    font-size: 14px;
    color: #777;
    font-weight: 600;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 720px) {
  .container {
    padding: 100px 16px;
  }

  .projects-header .main-tabs .tab-item {
    font-size: 12px;
    padding: 6px 12px;
  }

  .project-card .card-cover,
  .project-card .novel-cover {
    height: 180px;
  }

  .project-card .card-info .card-desc {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    animation: none !important;
  }
}
</style>