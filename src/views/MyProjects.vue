<template>
  <div class="my-projects" ref="myProjectsRef">
    <Header :cur="1"></Header>

    <div class="container">
      <div class="projects-header">
        <h2>{{ t('myProjects.title') }}</h2>

        <!-- Main Tabs: 漫剧, 漫画, 小说 -->
        <div class="main-tabs">
          <div
            v-for="tab in mainTabs"
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
              v-for="project in projects"
              :key="project.id"
              ref="projectCardRefs"
            >

              <!-- Project Cover -->
              <div class="card-cover" v-if="activeMainTab == 'manju'">
                <div class="publish-btn" @click="toPublish(project)" v-if="activeStatusTab == 'unpublished' && project.is_final == 1"> {{ t('myProjects.buttons.publish') }}</div>

                <!-- Use video cover from result_async.final_video_output if available -->
                <div v-if="project.result_async?.final_video_output?.video_cover_url" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="project.result_async.final_video_output.video_cover_url" alt="" />
                  </div>
                </div>
                <!-- Use images from result_async.generate_character_images if no video cover -->
                <div v-else-if="project.result_async?.generate_character_images && project.result_async.generate_character_images.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="project.result_async.generate_character_images[0].main_image_url" alt="" />
                  </div>
                </div>
                <!-- Fallback to original cover if no character images -->
                <img v-else :src="project.cover || pic" alt="" class="cover-img" />
                <!-- Video Play Overlay -->
                <div class="video-overlay" v-if="project.result_async?.final_video_output?.video_url" @click="playVideo(project.result_async?.final_video_output?.video_url)">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>
                <!-- Edit Button -->
                <div class="edit-btn" @click="openEditPage(project.session_id, 1)">{{ t('myProjects.buttons.edit') }}</div>
              </div>

              <div class="card-cover" v-if="activeMainTab == 'manhua'">
                <div v-if="project.result_async?.generate_character_images && project.result_async.generate_character_images.length > 0" class="character-images">
                  <div
                    class="character-image-item"
                  >
                    <img :src="project.result_async.generate_character_images[0].main_image_url" alt="" />
                  </div>
                </div>

                <img v-else :src="project.cover || pic" alt="" class="cover-img" />

                <div class="edit-btn" @click="openEditPage(project.session_id, 2)">{{ t('myProjects.buttons.edit') }}</div>
              </div>

              <div v-else-if="activeMainTab == 'novel'">
                <div v-if="project.name" class="novel-cover">
                  <b>“</b>
                  <span>{{ project.name }}</span>
                  <div class="edit-btn" @click="openEditPage(project.session_id, 3)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
                <div v-else class="card-cover">
                  <img :src="pic" alt="" class="cover-img" />
                  <div class="edit-btn" @click="openEditPage(project.session_id, 3)">{{ t('myProjects.buttons.edit') }}</div>
                </div>
              </div>

              <!-- Project Info -->
              <div class="card-info">
                <div class="card-desc" v-if="project.name">{{ project.name }}</div>
                <div class="card-footer">
                  <span class="time">{{ project.created_at || project.updated_at || '' }}</span>
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
                      <div class="menu-item" @click="openRenameModal(project.session_id, project.name)">{{ t('myProjects.menu.rename') }}</div>
                      <div class="menu-item delete" @click="deleteProject(project.session_id)">{{ t('myProjects.menu.delete') }}</div>
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
    </div>
  </div>
</template>

<script setup lang="ts" name="MyProjects">
import { ref, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import Header from '@/components/Header.vue';
import EmptyState from '@/components/EmptyState.vue';
import PreviewModal from '@/components/PreviewModal.vue';
import RenameModal from '@/components/RenameModal.vue';
import ProcessList from '@/components/ProcessList.vue';
import { aiUrl } from '@/util/config';
import pic from '@/assets/images/base/cover.png'
import api from '@/api/index';
import { toast } from '@/util/toast';
import router from '@/router';

const { t, locale } = useI18n();

// State
const activeMainTab = ref('manju');
const activeStatusTab = ref('unpublished');
const projects = ref<any[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const showVideoModal = ref(false);
const currentVideoUrl = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const myProjectsRef = ref<HTMLElement | null>(null);

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
  { value: 'manju' },
  { value: 'manhua' },
  { value: 'novel' }
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
    window.open(`/tools/comic/${sessionId}`, '_blank');
  } else {
    window.open(`/tools/space/${sessionId}`, '_blank');
  }
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

    const data = response as unknown as { code: number; message: string; data?: any };
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

async function deleteProject(projectId: string) {
  try {
    const response = await api.deleteProject({
      session_id: projectId
    });

    const data = response as unknown as { code: number; message: string; data?: any };
    if (data.code === 200) {
      // Temporarily remove scroll event listener to prevent duplicate requests
      if (myProjectsRef.value) {
        myProjectsRef.value.removeEventListener('scroll', handleScroll);
      }

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

  try {
    // Map tab values to API parameters
    const statusMap: Record<string, number> = {
      'unpublished': 0,
      'released': 1
    };

    const params = new URLSearchParams({
      is_publish: '0',
      story_type: activeMainTab.value,
      page: currentPage.value.toString(),
      limit: itemsPerPage.value.toString()
    });

    // Add token to request headers
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['token'] = token;
    }

    const response = await fetch(`${aiUrl}app/project/list?${params.toString()}`, {
      headers
    });

    if (response.ok) {
      const data = await response.json();

      if (data.code === 200 || data.code === 0) {
        const newProjects = data.data?.data_list || data.data_list || [];

        if (currentPage.value === 1) {
          projects.value = newProjects;
        } else {
          projects.value = [...projects.value, ...newProjects];
        }

        // Check if there are more pages based on data_count
        const totalCount = data.data?.data_count || data.data_count || 0;
        hasMore.value = projects.value.length < totalCount;

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
        console.error('API Error:', data.msg || 'Unknown error');
        if (currentPage.value === 1) {
          projects.value = [];
        }
        hasMore.value = false;
        loadingMore.value = false;
      }
    } else {
      console.error('Failed to load projects:', response.status);
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
.my-projects {
  width: 100%;
  padding: 14rem 0 0;
  background: #FFFFFF;
  scroll-behavior: smooth;
}

.container {
  max-width: 108rem;
  margin: 0 auto 2rem;
}

.projects-header {
  margin-bottom: 2.4rem;

  h2 {
    font-weight: 500;
    font-size: 2rem;
    color: #99A1AF;
    margin-bottom: 2.4rem;
  }

  .main-tabs {
    display: flex;
    gap: 3rem;
    border-bottom: 1px solid #F5F5F5;
    margin-bottom: 2rem;

    .tab-item {
      padding: 0 0 2rem;
      font-size: 1.6rem;
      color: #6A7282;
      cursor: pointer;
      border-bottom: 2px solid transparent;

      &.active {
        font-weight: 500;
        color: #101828;
        border-bottom-color: #fb64b6;
      }
    }
  }

  .status-tabs {
    display: flex;
    gap: 1.2rem;
    margin-bottom: 1.6rem;

    .tab-item {
      display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      color: #99A1AF;
      cursor: pointer;
      position: relative;

      &:hover{
        color: #6A7282;
      }

      &.active {
        background: #F5F5F5;
        color: #6A7282;
      }
    }
  }
}

/* Process Section */
.process-section {
  margin-bottom: 3.2rem;
}

  // .status-tabs {
  //   display: flex;
  //   gap: 1.2rem;

  //   .tab-item {
  //     display: flex;
  //     align-items: center;
  //     height: 3.2rem;
  //     padding: 0 1.6rem;
  //     border-radius: 0.6rem;
  //     font-size: 1.4rem;
  //     border: 1px solid transparent;
  //     color: #6a7282;
  //     cursor: pointer;

  //     &:hover{
  //       border-color: rgba(251,100,182,0.2);
  //     }

  //     &.active {
  //       border-color: #FB64B6;
  //       background: rgba(251, 100, 182, 0.12);
  //       color: #fb64b6;
  //     }
  //   }
  // }

.projects-box {
  min-height: 40rem;
}

.projects-container {
  min-height: 40rem;

  .waterfall {
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    width: 100%;
    margin: 0 auto;
  }

  .project-card {
    width: 25.8rem;
    position: relative;
    break-inside: avoid;

    .publish-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      color: #364153;
      min-width: 6rem;
      height: 2.8rem;
      padding: 0 1rem;
      border-radius: 0.6rem;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card-cover {
      position: relative;
      width: 100%;
      height: 33.4rem;
      overflow: hidden;
      border-radius: 1.2rem;
      background: #F5F5F5;

      .cover-img {
        width: 100%;
        height: 100%;
        border-radius: 0.8rem;
        object-fit: cover;
        transition: transform 0.3s ease;
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
          border-radius: 0.8rem;
          object-fit: cover;
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
          width: 8rem;
          height: 8rem;
        }
      }
    }

    .novel-cover{
      display: flex;
      justify-content: center;
      position: relative;
      width: 25.8rem;
      height: 34.4rem;
      padding: 7rem 3.6rem 0;
      border-radius: 1.2rem;
      font-size: 2.4rem;
      line-height: 3.6rem;
      background: rgba(251, 100, 182, 0.5);
      color: #364153;

      &:hover {
        .edit-btn {
          opacity: 1;
        }
      }

      b{
        position: absolute;
        left: 3rem;
        top: 4rem;
        font-weight: normal;
        font-size: 4.8rem;
        color: #364153;
      }

      span{
        height: 22rem;
        overflow-y: hidden;
        word-break: break-all;
      }
    }

    .edit-btn {
      position: absolute;
      bottom: 2.4rem;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-50%);
      background: #FB64B6;
      color: #ffffff;
      padding: 0 2rem;
      min-width: 9.8rem;
      height: 4rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card-cover:hover {
      .edit-btn {
        opacity: 1;
      }
    }

    &:hover {
      .publish-btn {
        opacity: 1;
      }
    }

    .card-info {
      padding: 1.2rem 0 0;

      .card-desc {
        font-size: 1.4rem;
        color: #101828;
        margin-bottom: 1.2rem;
        line-height: 2rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .time {
          font-size: 1.2rem;
          color: #99A1AF;
        }

        .more-btn-wrap {
          position: relative;
          img {
            width: 1.8rem;
            height: 1.8rem;
            cursor: pointer;
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            border-radius: 0.8rem;
            padding: 0.6rem 0;
            z-index: 10;
            min-width: 10rem;
            background: #FFFFFF;
            box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);

            &.bottom {
              top: 100%;
              margin-top: 0.4rem;
            }
            &.top {
              bottom: 100%;
              margin-bottom: 0.4rem;
            }

            .menu-item {
              padding: 0.6rem 0;
              font-size: 1.4rem;
              color: #6a7282;
              cursor: pointer;
              text-align: center;
              &:hover {
                font-weight: bold;
                color: #101828;
              }
            }
          }
        }
      }
    }
  }

  .loading-trigger {
    text-align: center;
    padding: 2rem 0;
    color: #99a1af;
    font-size: 1.4rem;
  }
}

/* Loading and Empty States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40rem;

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid #F5F5F5;
    border-top: 0.4rem solid #6A7282;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
  }

  p {
    font-size: 1.6rem;
    color: #6A7282;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>