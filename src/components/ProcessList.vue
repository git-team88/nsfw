<template>
  <div v-if="isLogin && totalCount > 0" class="process-container">
    <div class="process-header" @click="toggleDropdown">
      <div class="process-title">
          <img class="status-icon" src="@/assets/images/process/wait.png" alt="status" />
          <span>{{ t('process.taskProgress') }}{{ totalCount >= 1 ? ` (${completedCount}/${totalCount})` : '' }}</span>
        </div>
      <img class="dropdown-arrow" :src="arrowIcon" :class="{ 'rotated': isDropdownOpen }" alt="arrow" />
    </div>

    <div class="process-content" v-if="isDropdownOpen">
      <div class="process-list">
        <div v-for="(category, index) in categories" :key="index" class="process-category">
          <div class="category-header">
            <span class="category-name">{{ category.label }} ({{ getCompletedCount(category.items) }}/{{ category.items.length }})</span>
            <div class="category-nav">
              <img
                v-if="category.currentIndex > 0"
                class="nav-btn prev"
                :src="prevIcon"
                alt="prev"
                @click.stop="prevItem(index)"
              />
              <img
                v-if="category.currentIndex < category.items.length - 1"
                class="nav-btn next"
                :src="nextIcon"
                alt="next"
                @click.stop="nextItem(index)"
              />
            </div>
          </div>

          <div
            v-if="category.items.length > 0"
            class="category-item"
            @click="navigateToItem(category.items[category.currentIndex], category.type)"
          >
            <div class="item-top">
              <img
              class="item-status"
              :class="{'doing': category.items[category.currentIndex].step_status == 'DOING'}"
              :src="getStatusIcon(category.items[category.currentIndex].step_status)"
              alt="status"
            />
              <div class="item-info">
                <div class="item-type">{{ getItemLabel(category.type, category.items[category.currentIndex]) }}</div>
                <div class="item-title" v-if="category.items[category.currentIndex].name">{{ category.items[category.currentIndex].name }}</div>
              </div>
            </div>

            <!-- Queue information -->
            <div v-if="shouldShowQueueInfo(category.items[category.currentIndex]) && getQueuePosition(category.items[category.currentIndex]) > 0" class="item-queue-info">
              <span class="queue-text">
                {{ t('process.queueInfo', { count: getQueuePosition(category.items[category.currentIndex]) }) }}
              </span>
            </div>

            <!-- <div v-else-if="isTaskWaiting(category.items[category.currentIndex])" class="item-waiting">
              <span class="waiting-text">
                {{ t('process.queueInfo', { count: getQueueCount(category.type) }) }}
              </span>
            </div> -->

            <div v-else-if="category.items[category.currentIndex].step_status == 'PREPARE'" class="item-waiting">
              <span class="waiting-text">{{ t('process.queueInfo', { count: getQueuePosition(category.items[category.currentIndex]) }) }}</span>
            </div>
            <div v-else-if="category.items[category.currentIndex].step_status != 'FAIL'" class="item-progress">
              <div
                class="progress-bar"
              >
                <div
                  class="progress-fill"
                  :class="{
                    'success': category.items[category.currentIndex].step_status == 'SUCCESS',
                    'doing': category.items[category.currentIndex].step_status == 'DOING'
                  }"
                  :style="{ width: getProgress(category.items[category.currentIndex]) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ getProgress(category.items[category.currentIndex]) }}%</span>
            </div>

            <div v-else class="item-fail">
              <span class="fail-text">{{ t('process.generateFailed') }}</span>
              <span class="clear-task" @click.stop="clearTask(category.items[category.currentIndex])">{{ t('process.clearTask') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="process-footer" @click="clearCompleted">
        <span class="clear-text">{{ t('process.clearCompleted') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import api from '@/api/index';
import prevIcon from '@/assets/images/process/prev.png';
import nextIcon from '@/assets/images/process/next.png';
import arrowIcon from '@/assets/images/process/arrow.png';
import successIcon from '@/assets/images/process/success.png';
import doingIcon from '@/assets/images/process/doing.png';
import failIcon from '@/assets/images/process/fail.png';
import waitIcon from '@/assets/images/process/wait.png';

const { t } = useI18n();
const router = useRouter();

const processData = ref<any>(null);
const isDropdownOpen = ref(false);
const categoryIndices = ref<{ [key: string]: number }>({
  novel: 0,
  manhua: 0,
  manju: 0,
  image: 0,
  video: 0
});
const isLogin = ref(false);
let pollingTimer: number | null = null;

// Track start times for batch generation tasks
const batchTaskStartTimes = ref<Map<string, number>>(new Map());

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const categories = computed(() => {
  if (!processData.value) return [];

  const cats = [
    {
      type: 'novel',
      label: t('process.novel'),
      itemLabel: t('process.novel') + '-' + t('process.outline'),
      items: processData.value.novel_list || [],
      currentIndex: categoryIndices.value.novel
    },
    {
      type: 'manhua',
      label: t('process.comic'),
      itemLabel: t('process.comic') + '-' + t('process.script'),
      items: processData.value.manhua_list || [],
      currentIndex: categoryIndices.value.manhua
    },
    {
      type: 'manju',
      label: t('process.manju'),
      itemLabel: t('process.manju'),
      items: processData.value.manju_list || [],
      currentIndex: categoryIndices.value.manju
    },
    {
      type: 'image',
      label: t('home.contentType.photo'),
      itemLabel: t('home.img'),
      items: processData.value.simple_image_list || [],
      currentIndex: categoryIndices.value.image
    },
    {
      type: 'video',
      label: t('home.contentType.video'),
      itemLabel: t('home.video'),
      items: processData.value.simple_video_list || [],
      currentIndex: categoryIndices.value.video
    }
  ];

  return cats.filter(category => category.items.length > 0);
});

const totalCount = computed(() => {
  if (!processData.value) return 0;
  return processData.value.total_count || 0;
});

const completedCount = computed(() => {
  if (!processData.value) return 0;
  return processData.value.success_count || 0;
});

const getQueueCount = (type: string) => {
  if (!processData.value) return 0;
  if (type == 'novel') {
    return processData.value.novel_doing_count || 0;
  } else if (type == 'manhua') {
    return processData.value.manhua_doing_count || 0;
  } else if (type == 'manju') {
    return processData.value.manju_doing_count || 0;
  } else if (type == 'image') {
    return processData.value.simple_image_doing_count || 0;
  } else if (type == 'video') {
    return processData.value.simple_video_doing_count || 0;
  }
  return 0;
};

const getStatusIcon = (status: string, item?: any) => {
  // if (item?.type == 'novel' && item?.steps) {
  //   const chapterStep = item.steps.find((step: any) => step.step_name == 'chapter');
  //   if (chapterStep) {
  //     if (chapterStep.step_status == 'SUCCESS' && chapterStep.step_chapter_index == item.total_chapters) {
  //       return successIcon;
  //     } else if (chapterStep.step_status == 'DOING') {
  //       return doingIcon;
  //     } else if (chapterStep.step_status == 'PREPARE') {
  //       return waitIcon; // 等待中显示wait图标
  //     } else if (chapterStep.step_status == 'FAIL') {
  //       return failIcon; // 失败状态显示fail图标
  //     }
  //   }
  // }

  if (status == 'SUCCESS') {
    return successIcon; // 等待中显示success图标
  } else if (status == 'DOING') {
    return doingIcon; // 等待中显示doing图标
  } else if (status == 'PREPARE') {
    return waitIcon; // 等待中显示wait图标
  } else if (status == 'FAIL') {
    return failIcon; // 失败状态显示fail图标
  }
};

const getCompletedCount = (items: any[]) => {
  return items.filter(item => {
    return item.step_status == 'SUCCESS';
  }).length;
};

const getQueuePosition = (item: any) => {
  return item.queue_position || 0;
};

const shouldShowQueueInfo = (item: any) => {
  if (item.step_status == 'PREPARE' &&
    (!item.step_name || item.step_name == 'outline')) {
    return true;
  }
  return false;
};

const getProgress = (item: any) => {
  // For SUCCESS status, show 100%
  if (item.step_status == 'SUCCESS') {
    return 100;
  }

  // For FAIL status, show 0% (failure content is displayed separately)
  if (item.step_status == 'FAIL') {
    return 0;
  }

  let progress = 0;

  if (item.task_start_at && processData.value.current_timestamp) {
    const startTimestamp = new Date(item.task_start_at).getTime() / 1000;
    const currentTimestamp = processData.value.current_timestamp;
    const elapsedSeconds = currentTimestamp - startTimestamp;

    // Get estimated time based on step type
    let estimatedSeconds = 600; // Default 10 minutes
    if (item.step_name == 'outline') {
      estimatedSeconds = processData.value?.max_outline_estimate_seconds || 600;
    } else {
      estimatedSeconds = processData.value?.max_chapter_estimate_seconds || 600;
    }

    // Calculate remaining time in minutes
    const remainingSeconds = Math.max(1, estimatedSeconds - elapsedSeconds);
    const remainingMinutes = remainingSeconds / 60;

    if (remainingMinutes <= 1) {
      // If remaining time is 1 minute or less, show 99%
      progress = 99;
    } else {
      // Calculate progress based on remaining time
      // Total estimated time in minutes
      const totalMinutes = estimatedSeconds / 60;
      // Progress = (1 - (remaining minutes / total minutes)) * 100
      progress = Math.min(99, Math.round((1 - (remainingMinutes / totalMinutes)) * 100));
    }
  } else {
    // If no time data, start at 20%
    progress = 20;
  }

  return progress;
};

const fetchProcessData = async () => {
  try {
    // 真实API调用
    const res = await api.totalProcess(true) as any;
    if (res.code == 200) {
      // Clear start times for completed or failed tasks
      if (res.data) {
        const allTasks = [
          ...(res.data.novel_list || []),
          ...(res.data.manhua_list || []),
          ...(res.data.manju_list || [])
        ];

        allTasks.forEach(task => {
          if (task.status === 'SUCCESS' || task.status === 'FAIL') {
            const taskKey = task.session_id || task.id;
            batchTaskStartTimes.value.delete(taskKey);
          }
        });
      }

      // Filter out empty/invalid tasks from the lists
      const filteredData = res.data || {};

      // Filter novel_list
      if (Array.isArray(filteredData.novel_list)) {
        filteredData.novel_list = filteredData.novel_list.filter((task: any) =>
          task && task.session_id && task.step_status
        );
      }

      // Filter manhua_list
      if (Array.isArray(filteredData.manhua_list)) {
        filteredData.manhua_list = filteredData.manhua_list.filter((task: any) =>
          task && task.session_id && task.step_status
        );
      }

      // Filter manju_list
      if (Array.isArray(filteredData.manju_list)) {
        filteredData.manju_list = filteredData.manju_list.filter((task: any) =>
          task && task.session_id && task.step_status
        );
      }

      // Filter simple_image_list
      if (Array.isArray(filteredData.simple_image_list)) {
        filteredData.simple_image_list = filteredData.simple_image_list.filter((task: any) =>
          task && task.session_id && task.step_status
        );
      }

      // Filter simple_video_list
      if (Array.isArray(filteredData.simple_video_list)) {
        filteredData.simple_video_list = filteredData.simple_video_list.filter((task: any) =>
          task && task.session_id && task.step_status
        );
      }

      processData.value = filteredData;
    }
  } catch (error) {
    console.error('Error fetching process data:', error);
  }
};

const startPolling = () => {
  if (isLogin.value) {
    // 立即执行一次
    fetchProcessData();
    // 设置10秒轮询
    pollingTimer = window.setInterval(fetchProcessData, 20000);
  }
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

const getItemLabel = (type: string, item: any) => {
  if (item.step_name == 'outline') {
    if (type == 'novel') return t('process.novel') + '-' + t('process.outline');
    if (type == 'manhua') return t('process.comic') + '-' + t('process.outline');
    if (type == 'manju') return t('process.manju') + '-' + t('process.outline');
  } else if (item.step_name == 'character') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.character');
    if (type == 'manju') return t('process.manju') + '-' + t('process.character');
  } else if (item.step_name == 'cover') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.cover');
    if (type == 'manju') return t('process.manju') + '-' + t('process.cover');
  } else if (item.step_name == 'chapter') {
    // Handle chapter step differently based on status and type
    if (item.step_status == 'DOING' && item.is_batch_chapter != 1) {
      // Non-batch generation, DOING status: show "新章节" (New Chapter)
      if (type == 'novel') return t('process.novel') + '-' + t('novel.newChapter');
      if (type == 'manhua') return t('process.comic') + '-' + t('novel.newChapter');
      if (type == 'manju') return t('process.manju') + '-' + t('novel.newChapter');
    } else if (item.step_status == 'SUCCESS' && item.step_chapter_index) {
      // SUCCESS status: show chapter/episode number
      const chapterIndex = item.step_chapter_index;
      if (type == 'novel') {
        return t('process.novel') + '-' + t('novel.chapter') + chapterIndex;
      } else if (type == 'manhua') {
        return t('process.comic') + '-' + t('submit.image.episode', { episode: chapterIndex });
      } else if (type == 'manju') {
        return t('process.manju') + '-' + t('submit.image.episode', { episode: chapterIndex });
      }
    } else {
      // Default chapter label
      if (type == 'novel') return t('process.novel') + '-' + t('novel.newChapter');
      if (type == 'manhua') return t('process.comic') + '-' + t('novel.newChapter');
      if (type == 'manju') return t('process.manju') + '-' + t('novel.newChapter');
    }
  }

  // Default labels
  if (type == 'novel') {
    return t('process.novel') + '-' + t('process.outline');
  } else if (type == 'manhua') {
    return t('process.comic') + '-' + t('process.script');
  } else if (type == 'manju') {
    return t('process.manju');
  } else if (type == 'image') {
    // 处理图片类型，显示 topic 内容并替换标签
    return formatTopicContent(item.topic);
  } else if (type == 'video') {
    // 处理视频类型，显示 topic 内容并替换标签
    return formatTopicContent(item.topic);
  }
  return '';
};

// 格式化 topic 内容，将标签替换为可读文本
const formatTopicContent = (topic: string): string => {
  if (!topic) return '';

  // 替换 <ref_x> 为 "图片X"
  let result = topic.replace(/<ref_(\d+)>/g, (match, num) => {
    return t('home.img') + num;
  });

  // 替换 <aud_x> 为 "音频X"
  result = result.replace(/<aud_(\d+)>/g, (match, num) => {
    return t('home.audio') + num;
  });

  // 替换 <vid_x> 为 "视频X"
  result = result.replace(/<vid_(\d+)>/g, (match, num) => {
    return t('home.video') + num;
  });

  return result;
};

const prevItem = (categoryIndex: number) => {
  const category = categories.value[categoryIndex];
  if (category.currentIndex > 0) {
    categoryIndices.value[category.type]--;
  }
};

const nextItem = (categoryIndex: number) => {
  const category = categories.value[categoryIndex];
  if (category.currentIndex < category.items.length - 1) {
    categoryIndices.value[category.type]++;
  }
};

const navigateToItem = async (item: any, type: string) => {
  if (type == 'novel') {
    router.push(`/novel/${item.session_id}`);
  } else if (type == 'manhua') {
    window.location.href = `/tools/comic/${item.session_id}`;
  } else if (type == 'manju') {
    window.location.href = `/tools/video/${item.session_id}`;
  } else if (type == 'image') {
    // 先请求项目详情接口
    await api.detailProject(item.session_id);
    // 请求后直接跳转
    localStorage.setItem('targetSessionId', item.session_id);
    router.push({ name: 'Generate' });
  } else if (type == 'video') {
    // 先请求项目详情接口
    await api.detailProject(item.session_id);
    // 请求后直接跳转
    localStorage.setItem('targetSessionId', item.session_id);
    router.push({ name: 'Generate' });
  }
};

const clearCompleted = async () => {
  try {
    const res = await api.readProject() as any;
    if (res.code == 200) {
      await fetchProcessData();
    }
  } catch (error) {
    console.error('Error clearing completed:', error);
  }
};

const clearTask = async (item: any) => {
  try {
    // 调用项目详情接口
    const res = await api.detailProject(item.session_id) as any;
    if (res.code === 200) {
      // 从当前列表中移除该项
      if (processData.value) {
        const listKey = `${item.type}_list`;
        if (processData.value[listKey]) {
          const index = processData.value[listKey].findIndex((i: any) => i.session_id == item.session_id);
          if (index > -1) {
            processData.value[listKey].splice(index, 1);
            // 如果当前显示的索引超出范围，重置为0
            if (categoryIndices.value[item.type] >= processData.value[listKey].length) {
              categoryIndices.value[item.type] = Math.max(0, processData.value[listKey].length - 1);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error clearing task:', error);
  }
};

const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLogin.value = !!token;
};

// Handle click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  const processContainer = document.querySelector('.process-container');
  if (processContainer && !processContainer.contains(event.target as Node) && isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

const handleLogout = () => {
  isLogin.value = false;
  stopPolling();
};

onMounted(() => {
  checkLoginStatus();
  startPolling();
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('userLogout', handleLogout);
});

onUnmounted(() => {
  stopPolling();
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('userLogout', handleLogout);
});
</script>

<style scoped lang="scss">
.process-container {
  position: fixed;
  top: 13rem;
  left: 50%;
  width: 24rem;
  transform: translateX(46rem);
  z-index: 100;

  .process-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.4rem 1.2rem;
    cursor: pointer;
    background: #FFFFFF;
    border: 1px solid #F5F5F5;
    border-radius: 1.2rem;
    box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
    z-index: 101;

    .process-title {
      display: flex;
      align-items: center;
      font-size: 1.4rem;
      color: #364153;

      .status-icon {
        width: 1.8rem;
        height: 1.8rem;
        margin-right: 0.6rem;
      }
    }

    .dropdown-arrow {
      width: 2rem;
      height: 2rem;
      transform: rotate(180deg);
      transition: transform 0.3s;

      &.rotated {
        transform: rotate(0deg);
      }
    }
  }

  .process-content {
    margin-top: -1.2rem;
    background: #FFFFFF;
    border: 1px solid #F5F5F5;
    border-radius: 1.2rem;
    box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);

    .process-list{
      padding: 2.6rem 1.2rem 0;
    }

    .process-category {
      margin-bottom: 1.4rem;

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;

        .category-name {
          font-size: 1.2rem;
          color: #99A1AF;
        }

        .category-nav {
          display: flex;
          gap: 0.4rem;

          .nav-btn {
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            transition: opacity 0.2s;
          }
        }
      }

      .category-item {
        padding: 0.6rem;
        background: #F5F5F5;
        border-radius: 0.6rem;
        cursor: pointer;

        .item-top{
          display: flex;
        }

        .item-status {
          width: 1.8rem;
          height: 1.8rem;
          margin-right: 0.6rem;

          &.doing {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        }

        .item-info {
          flex: 1;
          min-width: 0;

          .item-type {
            font-size: 1.2rem;
            color: #364153;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .item-title {
            margin-top: 0.6rem;
            font-size: 1.2rem;
            color: #6A7282;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .item-progress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.6rem;
          padding-left: 2.4rem;

          .progress-bar {
            flex: 1;
            height: 0.4rem;
            background: #DDDDDD;
            border-radius: 0.2rem;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              border-radius: 0.2rem;
              transition: width 0.3s;

              &.success {
                background: #05DF4B;
              }

              &.doing {
                background: #FBBC05;
              }
            }
          }

          .progress-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 1.2rem;
            color: #99A1AF;
          }
        }

        .item-waiting {
          display: flex;
          align-items: center;
          margin-top: 0.6rem;
          padding-left: 2.4rem;

          .waiting-text {
            font-size: 1.2rem;
            color: #99A1AF;
          }
        }

        .item-fail {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.6rem;
          padding-left: 2.4rem;

          .fail-text {
            font-size: 1.2rem;
            color: #FF5252;
          }

          .clear-task {
            font-size: 1.2rem;
            color: #99A1AF;
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
              color: #364153;
            }
          }
        }

        .item-queue-info {
          margin-top: 0.6rem;
          padding-left: 2.4rem;

          .queue-text {
            font-size: 1.2rem;
            color: #99A1AF;
          }
        }
      }
    }

    .process-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.4rem 0;
      border-top: 1px solid #F5F5F5;
      cursor: pointer;

      .clear-text {
        font-size: 1.2rem;
        color: #99A1AF;
        text-align: center;
      }
    }
  }
}
</style>
