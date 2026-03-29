<template>
  <div v-if="isLogin" class="process-container">
    <div class="process-header" @click="toggleDropdown">
      <div class="process-title">
        <img class="status-icon" src="@/assets/images/process/doing.png" alt="status" />
        <span>{{ t('process.taskProgress') }} ({{ doingCount }}/{{ totalCount }})</span>
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
              :src="getStatusIcon(category.items[category.currentIndex].status, category.items[category.currentIndex])"
              alt="status"
            />
              <div class="item-info">
                <div class="item-type">{{ getItemLabel(category.type, category.items[category.currentIndex]) }}</div>
                <div class="item-title">{{ category.items[category.currentIndex].name }}</div>
              </div>
            </div>

            <div v-if="isTaskWaiting(category.items[category.currentIndex])" class="item-waiting">
              <span class="waiting-text">
                {{ $i18n.locale === 'zh' ? `${t('process.inQueue')}，前面还有${category.items[category.currentIndex].queue_count || 0}个任务` : `${t('process.inQueue')}, there are ${category.items[category.currentIndex].queue_count || 0} tasks ahead` }}
              </span>
            </div>

            <div v-else-if="category.items[category.currentIndex].status != 'FAIL'" class="item-progress">
              <div
                class="progress-bar"
              >
                <div
                  class="progress-fill"
                  :class="{
                    'success': category.items[category.currentIndex].status == 'SUCCESS',
                    'doing': category.items[category.currentIndex].status == 'DOING'
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

const { t } = useI18n();
const router = useRouter();

const processData = ref<any>(null);
const isDropdownOpen = ref(false);
const categoryIndices = ref<{ [key: string]: number }>({
  novel: 0,
  manhua: 0,
  manju: 0
});
const isLogin = ref(false);
let pollingTimer: number | null = null;

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
    }
  ];

  return cats.filter(category => category.items.length > 0);
});

const totalCount = computed(() => {
  if (!processData.value) return 0;
  return (processData.value.novel_list?.length || 0) +
         (processData.value.manhua_list?.length || 0) +
         (processData.value.manju_list?.length || 0);
});

const doingCount = computed(() => {
  if (!processData.value) return 0;
  return (processData.value.novel_doing_count || 0) +
         (processData.value.manhua_doing_count || 0) +
         (processData.value.manju_doing_count || 0);
});

const getStatusIcon = (status: string, item?: any) => {
  if (item?.type === 'novel' && item?.steps) {
    const chapterStep = item.steps.find((step: any) => step.step_name === 'chapter');
    if (chapterStep) {
      if (chapterStep.step_status === 'SUCCESS' && chapterStep.step_chapter_index === item.total_chapters) {
        return successIcon;
      } else if (chapterStep.step_status === 'DOING') {
        return doingIcon;
      } else if (chapterStep.step_status === 'PREPARE') {
        return doingIcon; // 等待中也显示doing图标
      } else if (chapterStep.step_status === 'FAIL') {
        return failIcon; // 失败状态显示fail图标
      }
    }
  }
  if (status === 'SUCCESS') {
    return successIcon;
  } else if (status === 'DOING' || status === 'PREPARE') {
    return doingIcon;
  } else if (status === 'FAIL') {
    return failIcon;
  }
  return doingIcon;
};

const getCompletedCount = (items: any[]) => {
  return items.filter(item => {
    if (item.type === 'novel' && item.steps) {
      const chapterStep = item.steps.find((step: any) => step.step_name === 'chapter');
      if (chapterStep) {
        return chapterStep.step_status === 'SUCCESS' &&
               chapterStep.step_chapter_index === item.total_chapters;
      }
    }
    return item.status === 'SUCCESS';
  }).length;
};

const isTaskWaiting = (item: any) => {
  if (item.type === 'novel' && item.steps) {
    const currentStep = item.steps.find((step: any) => step.step_status === 'DOING') || item.steps[0];
    return currentStep && currentStep.step_status === 'PREPARE';
  }
  return item.status === 'PREPARE';
};

const getProgress = (item: any) => {
  if (item.type === 'novel' && item.steps) {
    // 找到当前步骤
    const currentStep = item.steps.find((step: any) => step.step_status === 'DOING') || item.steps[0];

    if (currentStep) {
      if (currentStep.step_status === 'FAIL') {
        // 失败状态，显示当前进度
        if (item.is_batch_chapter === 1 && currentStep.step_name === 'chapter' && item.total_chapters) {
          const currentChapter = currentStep.step_chapter_index || 1;
          const totalChapters = item.total_chapters;
          return Math.min(100, Math.round((currentChapter / totalChapters) * 100));
        }
        return 0;
      }

      if (item.is_batch_chapter === 1) {
        // 生成全部章节，根据当前章节数计算进度
        if (currentStep.step_name === 'chapter' && item.total_chapters) {
          const currentChapter = currentStep.step_chapter_index || 1;
          const totalChapters = item.total_chapters;
          return Math.min(100, Math.round((currentChapter / totalChapters) * 100));
        }
      } else if (item.is_batch_chapter === 2) {
        // 单章生成，根据时间计算进度
        if (item.task_start_at && item.current_timestamp) {
          // 转换开始时间为时间戳（秒）
          const startTimestamp = new Date(item.task_start_at).getTime() / 1000;
          const currentTimestamp = item.current_timestamp;

          // 计算已过时间（秒）
          const elapsedSeconds = currentTimestamp - startTimestamp;

          // 根据当前步骤选择预估时间
          let estimatedSeconds = 600; // 默认10分钟
          if (currentStep.step_name === 'outline' && item.max_outline_estimate_seconds) {
            estimatedSeconds = item.max_outline_estimate_seconds;
          } else if (currentStep.step_name === 'chapter' && item.max_chapter_estimate_seconds) {
            estimatedSeconds = item.max_chapter_estimate_seconds;
          }

          // 计算进度，最大100%
          const progress = Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100));
          return progress;
        }
      }
    }
  }
  // 默认返回item中的progress值或0
  return item.progress || 0;
};

const fetchProcessData = async () => {
  try {
    // 真实API调用
    const res = await api.totalProcess() as any;
    if (res.code === 200) {
      processData.value = res.data;
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
    pollingTimer = window.setInterval(fetchProcessData, 10000);
  }
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

const getItemLabel = (type: string, item: any) => {
  if (type == 'novel') {
    if (item.steps) {
      const currentStep = item.steps.find((step: any) => step.step_status === 'DOING') || item.steps[0];
      if (currentStep && currentStep.step_name == 'chapter') {
        return t('process.novel') + '-' + t('process.chapter');
      } else {
        return t('process.novel') + '-' + t('process.outline');
      }
    } else {
      return t('process.novel') + '-' + t('process.outline');
    }
  } else if (type == 'manhua') {
    return t('process.comic') + '-' + t('process.script');
  } else if (type == 'manju') {
    return t('process.manju');
  }
  return '';
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

const navigateToItem = (item: any, type: string) => {
  if (type === 'novel') {
    router.push(`/novel/${item.session_id}`);
  } else if (type === 'manhua') {
    window.open(`/tools/comic/${item.session_id}`, _blank);
  } else if (type === 'manju') {
    window.open(`/tools/space/${item.session_id}`, _blank);
  }
};

const clearCompleted = async () => {
  try {
    const res = await api.readProject() as any;
    if (res.code === 200) {
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
          const index = processData.value[listKey].findIndex((i: any) => i.session_id === item.session_id);
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

onMounted(() => {
  checkLoginStatus();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
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
        }

        .item-info {
          flex: 1;

          .item-type {
            font-size: 1.2rem;
            color: #364153;
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
            font-size: 1.2rem;
            color: #99A1AF;
          }
        }

        .item-waiting {
          display: flex;
          align-items: center;
          margin-top: 0.6rem;

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
