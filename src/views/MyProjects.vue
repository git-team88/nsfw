<template>
  <div class="my-projects" ref="myProjectsRef">
    <Header :cur="1"></Header>

    <div class="container">
      <div class="projects-header">
        <h2>{{ t('myProjects.title') }}</h2>

        <!-- <div class="main-tabs">
          <div
            v-for="tab in mainTabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeMainTab === tab.value }"
            @click="switchMainTab(tab.value)"
          >
            {{ t(`myProjects.tabs.${tab.value}`) }}
          </div>
        </div> -->

        <!-- Status Tabs: Unpublished / Released -->
        <div class="status-tabs">
          <div
            v-for="tab in statusTabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeStatusTab === tab.value }"
            @click="switchStatusTab(tab.value)"
          >
            {{ t(`myProjects.status.${tab.value}`) }}
          </div>
        </div>
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
            :style="{ height: containerHeight + 'px' }"
          >
            <div
              class="project-card"
              v-for="project in projects"
              :key="project.id"
              :style="project.style"
              ref="projectCardRefs"
            >
              <!-- Publish Button -->
              <div class="publish-btn" v-if="activeMainTab == 'unpublished'">{{ t('myProjects.buttons.publish') }}</div>

              <!-- Project Cover -->
              <div class="card-cover">
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
                <div class="video-overlay" v-if="project.type === 'video' && (project.videoUrl || project.video_url || project.result_async?.final_video_output?.video_url)" @click="playVideo(project.videoUrl || project.video_url || project.result_async?.final_video_output?.video_url)">
                  <img src="@/assets/images/detail/play.png" :alt="t('myProjects.labels.play')" />
                </div>
              </div>

              <!-- Edit Button -->
              <div class="edit-btn" @click="openEditPage(project.session_id)">{{ t('myProjects.buttons.edit') }}</div>

              <!-- Project Info -->
              <div class="card-info">
                <div class="card-desc">{{ project.name || '' }}</div>
                <div class="card-footer">
                  <span class="time">{{ project.created_at || project.updated_at || '' }}</span>
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
    </div>
  </div>
</template>

<script setup lang="ts" name="MyProjects">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import Header from '@/components/Header.vue';
import EmptyState from '@/components/EmptyState.vue';
import PreviewModal from '@/components/PreviewModal.vue';
import { aiUrl } from '@/util/config';
import pic from '@/assets/images/base/cover.png'

const { t, locale } = useI18n();

// State
const activeMainTab = ref('series');
const activeStatusTab = ref('unpublished');
const projects = ref<any[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const showVideoModal = ref(false);
const currentVideoUrl = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const myProjectsRef = ref<HTMLElement | null>(null);

// Waterfall layout state
const waterfallRef = ref<HTMLElement | null>(null);
const projectCardRefs = ref<HTMLElement[]>([]);
const containerHeight = ref(0);
const loadingSentinel = ref<HTMLElement | null>(null);

// Tabs Data
const mainTabs = ref([
  { value: 'series' },
  { value: 'videos' },
  { value: 'images' }
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

function openEditPage(projectId: number) {
  window.open(`/tools/space/${projectId}`, '_blank');
}

function playVideo(videoUrl: string) {
  currentVideoUrl.value = videoUrl;
  showVideoModal.value = true;
}

function closeVideoModal() {
  showVideoModal.value = false;
  currentVideoUrl.value = '';
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
      'unpublished': 1,
      'released': 2
    };

    const typeMap: Record<string, string> = {
      'series': 'story',
      'videos': 'normal_video',
      'images': 'normal_image'
    };

    const params = new URLSearchParams({
      is_publish: activeStatusTab.value == 'unpublished' ? '2' : '1',
      project_type: typeMap[activeMainTab.value]?.toString() || 'story',
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

        // Add style property for waterfall layout
        newProjects.forEach((project: any) => {
          project.style = {
            position: "absolute",
            left: "0",
            top: "0",
            width: "25.8rem"
          } as CSSProperties;
        });

        if (currentPage.value === 1) {
          projects.value = newProjects;
        } else {
          projects.value = [...projects.value, ...newProjects];
        }

        // Check if there are more pages based on data_count
        const totalCount = data.data?.data_count || data.data_count || 0;
        hasMore.value = projects.value.length < totalCount;

        // Wait for images to load before layout
        nextTick(() => {
          let loadedCount = 0;
          const total = newProjects.length;
          if (total === 0) {
            // Set loading to false before layout to ensure DOM is rendered
            loadingMore.value = false;
            loading.value = false;
            // Use nextTick to ensure DOM is updated
            nextTick(() => {
              layoutWaterfall();
            });
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
                  // Set loading to false before layout to ensure DOM is rendered
                  loadingMore.value = false;
                  loading.value = false;
                  // Use nextTick to ensure DOM is updated
                  nextTick(() => {
                    layoutWaterfall();
                  });
                }
              };
            } else {
              loadedCount++;
              if (loadedCount === total) {
                // Set loading to false before layout to ensure DOM is rendered
                loadingMore.value = false;
                loading.value = false;
                // Use nextTick to ensure DOM is updated
                nextTick(() => {
                  layoutWaterfall();
                });
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

function layoutWaterfall() {
  if (!waterfallRef.value || !projects.value || projects.value.length === 0) return;

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const cardWidthRem = 25.8;
  const gapRem = 1.6;
  const cols = 4;

  const columnHeights = new Array(cols).fill(0);

  // Use a small delay to ensure DOM is ready
  setTimeout(() => {
    const cards = projectCardRefs.value;
    if (!cards || cards.length === 0) return;

    projects.value.forEach((project, index) => {
      const cardEl = cards[index];
      if (!cardEl) return;

      const minHeight = Math.min(...columnHeights);
      const colIndex = columnHeights.indexOf(minHeight);

      const leftRem = colIndex * (cardWidthRem + gapRem);
      const topRem = minHeight / rootFontSize;

      project.style = {
        position: "absolute",
        left: `${leftRem}rem`,
        top: `${topRem}rem`,
        width: `${cardWidthRem}rem`,
        opacity: 1,
      };

      columnHeights[colIndex] += cardEl.offsetHeight + gapRem * rootFontSize;
    });

    containerHeight.value = Math.max(...columnHeights);
  }, 50);
}

// Lifecycle
onMounted(async () => {
  window.addEventListener("resize", layoutWaterfall);

  // Load initial projects
  await loadProjects(true);

  // Add scroll event listener for auto loading
  if (myProjectsRef.value) {
    myProjectsRef.value.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", layoutWaterfall);

  // Remove scroll event listener
  if (myProjectsRef.value) {
    myProjectsRef.value.removeEventListener('scroll', handleScroll);
  }
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
  height: 100vh;
  overflow-y: auto;
  padding: 12rem 0 0;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
  scroll-behavior: smooth;
}

.container {
  max-width: 112.8rem;
  min-height: calc(100vh - 14rem);
  margin: 0 auto 2rem;
  padding: 2.4rem;
  border: 1px solid rgba(251,100,182,0.2);
  border-radius: 1.2rem;
  background: rgba(255,255,255,0.8);
}

.projects-header {
  margin-bottom: 2.4rem;

  h2 {
    font-weight: 500;
    font-size: 2rem;
    color: #101828;
    margin-bottom: 2.4rem;
  }

  .main-tabs {
    display: flex;
    gap: 3rem;
    border-bottom: 1px solid rgba(251,100,182,0.2);
    margin-bottom: 1.6rem;

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

    .tab-item {
      display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      border: 1px solid transparent;
      color: #6a7282;
      cursor: pointer;

      &:hover{
        border-color: rgba(251,100,182,0.2);
      }

      &.active {
        border-color: #FB64B6;
        background: rgba(251, 100, 182, 0.12);
        color: #fb64b6;
      }
    }
  }
}

.projects-box {
  min-height: 40rem;
  padding: 0 0.8rem;
}

.projects-container {
  min-height: 40rem;

  .waterfall {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .project-card {
    position: relative;
    overflow: hidden;
    break-inside: avoid;

    .publish-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fb64b6;
      color: #ffffff;
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

    .edit-btn {
      position: absolute;
      bottom: 10rem;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient( 155deg, #FB64B6 0%, #FF94CE 50%, #FB64B6 100%);
      color: #ffffff;
      padding: 1.2rem 2rem;
      min-width: 9.8rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      text-align: center;
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      .publish-btn,
      .edit-btn {
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
          color: #99a1af;
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
  padding: 5rem 0 0;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(251, 100, 182, 0.1);
    border-radius: 50%;
    border-top-color: #fb64b6;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
  }

  p {
    font-size: 1.6rem;
    color: #6a7282;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>