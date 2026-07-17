<template>
  <div v-if="isLogin && totalCount > 0" class="process-container">
    <div class="process-header" :class="{ 'has-success': completedCount > 0 }" @click="toggleDropdown">
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
import { parseToUnixTimestamp } from '@/util/utils';
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
    const startTimestamp = parseToUnixTimestamp(item.task_start_at);
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

const hasUnfinishedTasks = () => {
  if (!processData.value) return false;
  const allLists = [
    ...(processData.value.novel_list || []),
    ...(processData.value.manhua_list || []),
    ...(processData.value.manju_list || []),
    ...(processData.value.simple_image_list || []),
    ...(processData.value.simple_video_list || [])
  ];
  if (allLists.length === 0) return false;
  return allLists.some(item => item.step_status !== 'SUCCESS' && item.step_status !== 'FAIL');
};

const startPolling = async () => {
  if (isLogin.value) {
    await fetchProcessData();
    if (hasUnfinishedTasks()) {
      pollingTimer = window.setInterval(async () => {
        await fetchProcessData();
        if (!hasUnfinishedTasks()) {
          stopPolling();
        }
      }, 20000);
    }
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
  } else if (item.step_name == 'renew_novel_cover') {
    if (type == 'novel') return t('process.novel') + '-' + t('process.coverChange');
  } else if (item.step_name == 'renew_manhua_cover') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.coverChange');
  } else if (item.step_name == 'renew_manhua_scene') {
    return t('process.comic') + '-' + t('process.sceneEdit');
  } else if (item.step_name == 'renew_manju_scene') {
    return t('process.manju') + '-' + t('process.storyboardEdit');
  } else if (item.step_name == 'renew_manhua_character') {
    return t('process.comic') + '-' + t('process.characterEdit');
  } else if (item.step_name == 'renew_manju_character') {
    return t('process.manju') + '-' + t('process.characterEdit');
  } else if (item.step_name == 'edit_single_scene_image' || item.step_name == 'edit_single_daoju_image') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.renewGlobalAssets');
    if (type == 'manju') return t('process.manju') + '-' + t('process.renewGlobalAssets');
  } else if (item.step_name == 'global_assets') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.globalAssets');
    if (type == 'manju') return t('process.manju') + '-' + t('process.globalAssets');
  } else if (item.step_name == 'renew_global_assets') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.renewGlobalAssets');
    if (type == 'manju') return t('process.manju') + '-' + t('process.renewGlobalAssets');
  } else if (item.step_name == 'renew_manju_cover') {
    if (type == 'manju') return t('process.manju') + '-' + t('process.coverChange');
  } else if (item.step_name == 'merge_videos') {
    if (type == 'manju') return t('process.manju') + '-' + t('process.mergeVideos');
  } else if (item.step_name == 'refresh_manhua_scene') {
    if (type == 'manhua') return t('process.comic') + '-' + t('process.sceneRefresh');
  } else if (item.step_name == 'refresh_manju_scene') {
    if (type == 'manju') return t('process.manju') + '-' + t('process.storyboardRefresh');
  } else if (item.step_name == 'chapter') {
    // Handle chapter step differently based on status and type
    if (item.step_status == 'DOING' && item.is_batch_chapter != 1) {
      if (type == 'novel') return t('process.novel') + '-' + t('novel.newChapter');
      if (type == 'manhua') return t('process.comic') + '-' + t('novel.newChapter');
      if (type == 'manju') return t('process.manju') + '-' + t('novel.newChapter');
    } else if (item.step_status == 'SUCCESS' && item.step_chapter_index) {
      // SUCCESS status: show chapter/episode number
      const chapterIndex = item.step_chapter_index;
      if (type == 'novel') {
        return t('process.novel') + '-' + t('novel.chapter', { chapter: chapterIndex });
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
  api.readSingleProject({ session_id: item.session_id });
  if (type == 'novel') {
    router.push(`/novel/${item.session_id}`);
  } else if (type == 'manhua') {
    window.location.href = `/tools/comic/${item.session_id}`;
  } else if (type == 'manju') {
    window.location.href = `/tools/video/${item.session_id}`;
  } else if (type == 'image') {
    await api.detailProject(item.session_id);
    localStorage.setItem('targetSessionId', item.session_id);
    router.push({ name: 'Generate' });
  } else if (type == 'video') {
    await api.detailProject(item.session_id);
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
$ink: #161122;
$paper: #FFFDF7;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;
$line: #F0EADF;

.process-container {
  position: fixed;
  top: 110px;
  right: 16px;
  width: 240px;
  z-index: 100;
  animation: tdIn .3s cubic-bezier(.16,1,.3,1) both;
  transform-origin: top right;

  .process-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    background: $paper;
    border: 3px solid $ink;
    border-radius: 999px;
    box-shadow: 4px 4px 0 $ink;
    z-index: 101;
    transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;

    &:hover {
      transform: translate(-1px, -2px);
      box-shadow: 5px 6px 0 $ink;
    }

    &:active {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 $ink;
    }

    &.has-success {
      .process-title .status-icon {
        animation: tdPulse 1.8s ease-out infinite;
      }
    }

    .process-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      font-size: 13.5px;
      color: $ink;

      .status-icon {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        border: 1.5px solid $ink;
        background: #cfc9d6;
      }
    }

    .dropdown-arrow {
      width: 20px;
      height: 20px;
      transform: rotate(180deg);
      transition: transform 0.3s cubic-bezier(.16,1,.3,1);

      &.rotated {
        transform: rotate(0deg);
      }
    }
  }

  .process-content {
    margin-top: 6px;
    background: $paper;
    border: 3px solid $ink;
    border-radius: 16px;
    box-shadow: 6px 6px 0 $ink;
    overflow: hidden;
    animation: tdPanelIn .3s cubic-bezier(.16,1,.3,1) both;

    .process-list {
      padding: 10px 10px 0;
    }

    .process-category {
      margin-bottom: 8px;

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .category-name {
          font-weight: 700;
          font-size: 12px;
          color: $sub;
        }

        .category-nav {
          display: flex;
          gap: 4px;

          .nav-btn {
            width: 20px;
            height: 20px;
            cursor: pointer;
            border: 2px solid $ink;
            border-radius: 6px;
            background: #fff;
            box-shadow: 2px 2px 0 $ink;
            transition: transform .14s cubic-bezier(.34,1.56,.64,1), box-shadow .14s ease-out;

            &:hover {
              transform: translate(-1px, -1px);
              box-shadow: 3px 3px 0 $ink;
            }
          }
        }
      }

      .category-item {
        padding: 10px;
        background: #fff;
        border: 2px solid $ink;
        border-radius: 12px;
        cursor: pointer;
        transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 $ink;
        }

        .item-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .item-status {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          border: 2px solid $ink;
          background: #FFF3D6;
          color: $ink;
          flex-shrink: 0;

          &.doing {
            background: #FFF3D6;
            animation: tdSpin 1s linear infinite;
          }

          img {
            width: 14px;
            height: 14px;
          }
        }

        .item-info {
          flex: 1;
          min-width: 0;

          .item-type {
            font-weight: 800;
            font-size: 12.5px;
            color: $ink;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .item-title {
            margin-top: 2px;
            font-weight: 800;
            font-size: 11px;
            color: $ink;
            opacity: 0.55;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .item-progress {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-top: 8px;

          .progress-bar {
            flex: 1;
            height: 8px;
            background: $line;
            border-radius: 999px;
            border: 1.5px solid $ink;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              border-radius: 999px;
              transition: width .45s cubic-bezier(.16,1,.3,1);

              &.success {
                background: linear-gradient(90deg, #22C55E, #A3E635);
              }

              &.doing {
                background: linear-gradient(90deg, $pink, #FF9E45);
              }
            }
          }

          .progress-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 800;
            font-size: 11px;
            color: $ink;
          }
        }

        .item-waiting {
          display: flex;
          align-items: center;
          margin-top: 6px;

          .waiting-text {
            font-weight: 600;
            font-size: 11px;
            color: $sub;
          }
        }

        .item-fail {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;

          .fail-text {
            font-weight: 800;
            font-size: 11.5px;
            color: #E5484D;
          }

          .clear-task {
            font-weight: 800;
            font-size: 11.5px;
            color: $ink;
            background: #fff;
            border: 2px solid $ink;
            border-radius: 999px;
            padding: 3px 10px;
            cursor: pointer;
            box-shadow: 2px 2px 0 $ink;
            transition: transform .14s cubic-bezier(.34,1.56,.64,1), box-shadow .14s ease-out;

            &:hover {
              transform: translate(-1px, -1px);
              box-shadow: 3px 3px 0 $ink;
            }
          }
        }

        .item-queue-info {
          margin-top: 6px;

          .queue-text {
            font-weight: 600;
            font-size: 11px;
            color: $sub;
          }
        }
      }
    }

    .process-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 0;
      border-top: 2px solid rgba(22,17,34,.12);
      cursor: pointer;

      .clear-text {
        font-weight: 800;
        font-size: 12px;
        color: $ink;
        text-align: center;
      }
    }
  }
}

@keyframes tdIn {
  0% { opacity: 0; transform: scale(.9) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes tdPanelIn {
  0% { opacity: 0; transform: scale(.92) translateY(-6px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes tdSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes tdPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
  60% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}

@media (prefers-reduced-motion: reduce) {
  .process-container {
    animation: none !important;
  }
  .process-content {
    animation: none !important;
  }
  .item-status.doing {
    animation: none !important;
  }
  .process-header.has-success .status-icon {
    animation: none !important;
  }
  .progress-fill {
    transition: none !important;
  }
  .process-header, .nav-btn, .clear-task, .category-item {
    transition: none !important;
  }
  .process-header:hover, .process-header:active {
    transform: none !important;
  }
  .category-item:hover {
    transform: none !important;
  }
  .nav-btn:hover, .clear-task:hover {
    transform: none !important;
  }
}
</style>
