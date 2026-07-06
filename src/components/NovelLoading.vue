<template>
  <div class="process-steps" ref="processStepsRef">
    <div
      v-for="(step, index) in allSteps"
      :key="index"
      class="process-step"
      :class="{
        'step-active': currentStepIndex == index,
        'step-completed': stepPhases[index] === 'completed' || stepPhases[index] === 'joined',
        'step-working': stepPhases[index] === 'working',
        'step-hidden': stepPhases[index] === undefined,
        'step-frozen': isFrozenAtPenultimate && index === penultimateIndex,
      }"
    >
      <div class="step-content">
        <!-- Progress message (show for all non-hidden steps) -->
        <div v-if="stepPhases[index] === 'working' || stepPhases[index] === 'completed' || stepPhases[index] === 'joined'" class="step-with-role">
          <div class="role-avatar-container">
            <img
              v-if="step.expertKey"
              :src="roleImages[step.expertKey as RoleKey]"
              class="role-avatar"
            />
          </div>
          <div class="role-content">
            <div class="role-name">{{ step.expert }}</div>
            <div class="step-description-container">
              <div class="step-description" :class="{ 'with-progress': stepPhases[index] === 'working' }">
                <div
                  v-if="stepPhases[index] === 'working'"
                  class="progress-background"
                  :style="{ width: currentStepIndex === index ? (currentStepProgress * 100) + '%' : '100%' }"
                ></div>
                <div class="step-text">
                  <template v-if="stepPhases[index] === 'working'">
                    <span class="active-text">
                      {{ step.workingText }}
                      <img :src="loadingIcon" class="loading-icon" />
                    </span>
                  </template>
                  <template v-else>
                    {{ step.completedText }}
                  </template>
                </div>
              </div>
              <div
                v-if="stepPhases[index] === 'working' && currentStepIndex === index"
                class="progress-percentage"
              >
                {{ Math.round(currentStepProgress * 100) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Team message (show for completed/joined steps with joinedMember) -->
        <div v-if="(stepPhases[index] === 'completed' || stepPhases[index] === 'joined') && step.joinedMember" class="team-message">
          <img :src="roleImages[(step.inviterKey || step.expertKey) as RoleKey]" class="team-avatar" />
          <span class="team-username">@{{ step.inviter || step.expert }}</span>
          <span class="team-action">{{ t('submit.teamMessage.invited') }}</span>
          <div class="team-target">
            <img
              v-if="step.joinedMemberKey"
              :src="roleImages[step.joinedMemberKey as RoleKey]"
              class="team-target-avatar"
            />
            <span v-if="step.joinedMember" class="team-target-username">@{{ step.joinedMember }}</span>
          </div>
          <span class="team-action">{{ t('submit.teamMessage.joinStudio') }}</span>
        </div>

        <!-- Working message for joined state (when transition to next step) -->
        <div v-if="stepPhases[index] === 'joined' && !step.joinedMember" class="step-with-role">
          <div class="role-avatar-container">
            <img
              v-if="step.expertKey"
              :src="roleImages[step.expertKey as RoleKey]"
              class="role-avatar"
            />
          </div>
          <div class="role-content">
            <div class="role-name">{{ step.expert }}</div>
            <div class="step-description-container">
              <div class="step-description">
                <div class="step-text">
                  {{ step.completedText }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

import generalAssistant from '@/assets/images/role/general_assistant.png';
import generalAssistantAll from '@/assets/images/role/general_assistant_all.png';
import plotArchitect from '@/assets/images/role/plot_architect.png';
import worldviewDesigner from '@/assets/images/role/worldview_designer.png';
import characterDesigner from '@/assets/images/role/character_designer.png';
import coverDesigner from '@/assets/images/role/cover_designer.png';
import chapterScreenwriter from '@/assets/images/role/chapter_screenwriter.png';
import detailDescriber from '@/assets/images/role/detail_describer.png';
import logicVerifier from '@/assets/images/role/logic_verifier.png';
import loadingIcon from '@/assets/images/role/load.png';

const props = defineProps<{
  processType: 'outline' | 'chapter';
  remainingTime?: number;
  estimatedTime?: number;
  isStreaming?: boolean;
  hasStreamingContent?: boolean;
  hasStreamData?: boolean;
  taskStatus?: 'DOING' | 'SUCCESS' | 'FAIL' | 'PREPARE';
  startFromBeginning?: boolean;
  animationStartTime?: number;
}>();

const emit = defineEmits(['loadingComplete', 'update:animationStartTime']);

const { t } = useI18n();

type RoleKey = 'novelExpert' | 'chapterExpert' | 'plotArchitect' | 'worldDesigner' | 'characterDesigner' | 'coverDesigner' | 'chapterWriter' | 'detailWriter' | 'logicChecker' | 'allMembers';

const roleImages: Record<RoleKey, string> = {
  novelExpert: generalAssistant,
  chapterExpert: generalAssistant,
  plotArchitect: plotArchitect,
  worldDesigner: worldviewDesigner,
  characterDesigner: characterDesigner,
  coverDesigner: coverDesigner,
  chapterWriter: chapterScreenwriter,
  detailWriter: detailDescriber,
  logicChecker: logicVerifier,
  allMembers: generalAssistantAll
};

interface LoadingStep {
  expert: string;
  expertKey: string;
  workingText: string;
  completedText: string;
  joinedMember?: string;
  joinedMemberKey?: string;
  inviter?: string;
  inviterKey?: string;
  weight: number;
}

const outlineSteps: LoadingStep[] = [
  {
    expert: t('novel.role.novelExpert'),
    expertKey: 'novelExpert',
    workingText: t('novel.outline_active_1'),
    completedText: t('novel.outline_completed_1'),
    joinedMember: t('novel.role.plotArchitect'),
    joinedMemberKey: 'plotArchitect',
    inviter: t('novel.role.novelExpert'),
    inviterKey: 'novelExpert',
    weight: 1,
  },
  {
    expert: t('novel.role.plotArchitect'),
    expertKey: 'plotArchitect',
    workingText: t('novel.outline_active_4'),
    completedText: t('novel.outline_completed_4'),
    joinedMember: t('novel.role.worldDesigner'),
    joinedMemberKey: 'worldDesigner',
    inviter: t('novel.role.novelExpert'),
    inviterKey: 'novelExpert',
    weight: 3,
  },
  {
    expert: t('novel.role.worldDesigner'),
    expertKey: 'worldDesigner',
    workingText: t('novel.outline_active_7'),
    completedText: t('novel.outline_completed_7'),
    joinedMember: t('novel.role.characterDesigner'),
    joinedMemberKey: 'characterDesigner',
    inviter: t('novel.role.novelExpert'),
    inviterKey: 'novelExpert',
    weight: 4,
  },
  {
    expert: t('novel.role.characterDesigner'),
    expertKey: 'characterDesigner',
    workingText: t('novel.outline_active_10'),
    completedText: t('novel.outline_completed_10'),
    weight: 5,
  },
  {
    expert: t('novel.role.plotArchitect'),
    expertKey: 'plotArchitect',
    workingText: t('novel.outline_active_12'),
    completedText: t('novel.outline_completed_12'),
    joinedMember: t('novel.role.allMembers'),
    joinedMemberKey: 'allMembers',
    inviter: t('novel.role.novelExpert'),
    inviterKey: 'novelExpert',
    weight: 6,
  },
  {
    expert: t('novel.role.allMembers'),
    expertKey: 'allMembers',
    workingText: t('novel.outline_active_14'),
    completedText: t('novel.outline_completed_14'),
    joinedMember: t('novel.role.coverDesigner'),
    joinedMemberKey: 'coverDesigner',
    inviter: t('novel.role.novelExpert'),
    inviterKey: 'novelExpert',
    weight: 7,
  },
  {
    expert: t('novel.role.coverDesigner'),
    expertKey: 'coverDesigner',
    workingText: t('novel.outline_active_17'),
    completedText: t('novel.outline_completed_17'),
    weight: 6,
  },
  {
    expert: t('novel.role.novelExpert'),
    expertKey: 'novelExpert',
    workingText: t('novel.outline_active_19'),
    completedText: t('novel.outline_completed_19'),
    weight: 3,
  },
];

const chapterSteps: LoadingStep[] = [
  {
    expert: t('novel.role.chapterExpert'),
    expertKey: 'chapterExpert',
    workingText: t('novel.chapter_active_1'),
    completedText: t('novel.chapter_completed_1'),
    joinedMember: t('novel.role.chapterWriter'),
    joinedMemberKey: 'chapterWriter',
    inviter: t('novel.role.chapterExpert'),
    inviterKey: 'chapterExpert',
    weight: 1,
  },
  {
    expert: t('novel.role.chapterWriter'),
    expertKey: 'chapterWriter',
    workingText: t('novel.chapter_active_4'),
    completedText: t('novel.chapter_completed_4'),
    joinedMember: t('novel.role.detailWriter'),
    joinedMemberKey: 'detailWriter',
    inviter: t('novel.role.chapterExpert'),
    inviterKey: 'chapterExpert',
    weight: 3,
  },
  {
    expert: t('novel.role.detailWriter'),
    expertKey: 'detailWriter',
    workingText: t('novel.chapter_active_7'),
    completedText: t('novel.chapter_completed_7'),
    weight: 4,
  },
  {
    expert: t('novel.role.chapterWriter'),
    expertKey: 'chapterWriter',
    workingText: t('novel.chapter_active_9'),
    completedText: t('novel.chapter_completed_9'),
    joinedMember: t('novel.role.logicChecker'),
    joinedMemberKey: 'logicChecker',
    inviter: t('novel.role.chapterExpert'),
    inviterKey: 'chapterExpert',
    weight: 5,
  },
  {
    expert: t('novel.role.logicChecker'),
    expertKey: 'logicChecker',
    workingText: t('novel.chapter_active_12'),
    completedText: t('novel.chapter_completed_12'),
    weight: 5,
  },
  {
    expert: t('novel.role.detailWriter'),
    expertKey: 'detailWriter',
    workingText: t('novel.chapter_active_14'),
    completedText: t('novel.chapter_completed_14'),
    weight: 4,
  },
  {
    expert: t('novel.role.chapterExpert'),
    expertKey: 'chapterExpert',
    workingText: t('novel.chapter_active_16'),
    completedText: t('novel.chapter_completed_16'),
    weight: 2,
  },
];

const allSteps = computed(() => {
  return props.processType === 'outline' ? outlineSteps : chapterSteps;
});

const currentStepIndex = ref(-1);
const currentStepProgress = ref(0);
const stepPhases = ref<string[]>([]);
const isFrozenAtPenultimate = ref(false);
const totalDurationMs = ref(300000);

const processStepsRef = ref<HTMLElement | null>(null);
let animationTimer: number | null = null;

const penultimateIndex = computed(() => allSteps.value.length - 1);

function isAnimating() {
  return props.taskStatus === 'DOING';
}

function scrollToLatestStep() {
  if (processStepsRef.value && processStepsRef.value.offsetParent !== null) {
    const parentContainer = document.querySelector('.outline-content');
    if (parentContainer) {
      (parentContainer as HTMLElement).scrollTop = (parentContainer as HTMLElement).scrollHeight;
    } else {
      processStepsRef.value.scrollTop = processStepsRef.value.scrollHeight;
    }
  }
}

function calculateTotalWeight() {
  return allSteps.value.reduce((sum, s) => sum + s.weight, 0);
}

function getStepDurationMs(index: number) {
  const totalWeight = calculateTotalWeight();
  const step = allSteps.value[index];
  return Math.min(
    Math.max(
      Math.round(totalDurationMs.value * step.weight / totalWeight),
      1000
    ),
    totalDurationMs.value
  );
}

function fastForwardAndResume(elapsedMs: number) {
  const totalWeight = calculateTotalWeight();
  let accumulatedMs = 0;
  const stepsBeforeLast = allSteps.value.length - 1;

  for (let i = 0; i < stepsBeforeLast; i++) {
    const step = allSteps.value[i];
    const stepMs = Math.min(
      Math.max(
        Math.round(totalDurationMs.value * step.weight / totalWeight),
        1000
      ),
      totalDurationMs.value
    );
    const transitionMs = 2000 + (step.joinedMember ? 2000 : 0);
    const fullStepMs = stepMs + transitionMs;

    if (accumulatedMs + fullStepMs <= elapsedMs) {
      stepPhases.value.push(step.joinedMember ? 'joined' : 'completed');
      accumulatedMs += fullStepMs;
    } else {
      const inStepElapsed = elapsedMs - accumulatedMs;

      if (inStepElapsed <= stepMs) {
        let progress = Math.min(Math.max(inStepElapsed / stepMs, 0), 1);
        const isPenultimate = (i === penultimateIndex.value);

        if (isPenultimate && progress >= 0.99 && isAnimating()) {
          progress = 0.99;
          isFrozenAtPenultimate.value = true;
        }

        stepPhases.value.push('working');
        currentStepIndex.value = i;
        currentStepProgress.value = progress;
        notify();

        if (!isFrozenAtPenultimate.value) {
          resumeWorkingFrom(i, progress, stepMs);
        }
        return;
      } else {
        stepPhases.value.push(step.joinedMember ? 'joined' : 'completed');
        accumulatedMs += fullStepMs;
      }
    }
  }

  if (isAnimating()) {
    const penultIdx = penultimateIndex.value;
    while (stepPhases.value.length < penultIdx) {
      const idx = stepPhases.value.length;
      const s = allSteps.value[idx];
      stepPhases.value.push(s.joinedMember ? 'joined' : 'completed');
    }

    if (stepPhases.value.length > penultIdx) {
      stepPhases.value[penultIdx] = 'working';
    } else {
      stepPhases.value.push('working');
    }

    currentStepIndex.value = penultIdx;
    currentStepProgress.value = 0.99;
    isFrozenAtPenultimate.value = true;
  } else {
    const lastIndex = allSteps.value.length - 1;
    while (stepPhases.value.length < lastIndex) {
      const idx = stepPhases.value.length;
      const s = allSteps.value[idx];
      stepPhases.value.push(s.joinedMember ? 'joined' : 'completed');
    }
    stepPhases.value.push('completed');
    currentStepIndex.value = lastIndex;
    currentStepProgress.value = 1.0;
  }
  notify();
}

function resumeWorkingFrom(stepIndex: number, startProgress: number, totalStepMs: number) {
  const remainingMs = Math.round((1.0 - startProgress) * totalStepMs);
  if (remainingMs <= 0) {
    transitionToCompleted();
    return;
  }

  const INTERVAL_MS = 100;
  let elapsed = 0;

  clearTimer();
  animationTimer = window.setInterval(() => {
    elapsed += INTERVAL_MS;
    const additionalProgress = elapsed / totalStepMs;
    const progress = Math.min(startProgress + additionalProgress, 1.0);

    const isPenultimate = (stepIndex === penultimateIndex.value);
    if (isPenultimate && progress >= 0.99 && isAnimating()) {
      clearTimer();
      currentStepProgress.value = 0.99;
      isFrozenAtPenultimate.value = true;
      notify();
      return;
    }

    currentStepProgress.value = progress;
    notify();

    if (elapsed >= remainingMs) {
      clearTimer();
      transitionToCompleted();
    }
  }, INTERVAL_MS);
}

function fastForwardAndFreezeAt99() {
  const penultIdx = penultimateIndex.value;
  while (stepPhases.value.length < penultIdx) {
    const idx = stepPhases.value.length;
    const s = allSteps.value[idx];
    stepPhases.value.push(s.joinedMember ? 'joined' : 'completed');
  }

  if (stepPhases.value.length > penultIdx) {
    stepPhases.value[penultIdx] = 'working';
  } else {
    stepPhases.value.push('working');
  }

  currentStepIndex.value = penultIdx;
  currentStepProgress.value = 0.99;
  isFrozenAtPenultimate.value = true;
  notify();
}

function startWorking() {
  const index = currentStepIndex.value;
  const durationMs = getStepDurationMs(index);

  const INTERVAL_MS = 100;
  let elapsed = 0;

  clearTimer();
  animationTimer = window.setInterval(() => {
    elapsed += INTERVAL_MS;
    const progress = Math.min(elapsed / durationMs, 1.0);

    const isPenultimate = (index === penultimateIndex.value);
    if (isPenultimate && progress >= 0.99 && isAnimating()) {
      clearTimer();
      currentStepProgress.value = 0.99;
      isFrozenAtPenultimate.value = true;
      notify();
      return;
    }

    currentStepProgress.value = progress;
    notify();

    if (elapsed >= durationMs) {
      clearTimer();
      transitionToCompleted();
    }
  }, INTERVAL_MS);
}

function transitionToCompleted() {
  if (currentStepIndex.value >= 0 && currentStepIndex.value < stepPhases.value.length) {
    stepPhases.value[currentStepIndex.value] = 'completed';
  }
  notify();

  clearTimer();
  const step = allSteps.value[currentStepIndex.value];
  if (step && step.joinedMember) {
    transitionToJoined();
  } else {
    advanceToNextStep();
  }
}

function transitionToJoined() {
  if (currentStepIndex.value >= 0 && currentStepIndex.value < stepPhases.value.length) {
    stepPhases.value[currentStepIndex.value] = 'joined';
  }
  notify();

  clearTimer();
  advanceToNextStep();
}

function advanceToNextStep() {
  const nextIndex = currentStepIndex.value + 1;
  if (nextIndex >= allSteps.value.length) return;

  // Push new step phase first to ensure it's defined before updating currentStepIndex
  stepPhases.value.push('working');
  currentStepIndex.value = nextIndex;
  currentStepProgress.value = 0.0;
  notify();
  startWorking();
}

function unfreeze() {
  if (!isFrozenAtPenultimate.value) return;
  isFrozenAtPenultimate.value = false;

  if (currentStepIndex.value >= 0 && currentStepIndex.value < stepPhases.value.length) {
    stepPhases.value[currentStepIndex.value] = 'completed';
  }
  currentStepProgress.value = 1.0;
  notify();

  clearTimer();
  animationTimer = window.setTimeout(() => {
    const lastIndex = allSteps.value.length - 1;
    currentStepIndex.value = lastIndex;
    currentStepProgress.value = 1.0;
    stepPhases.value.push('completed');
    notify();

    setTimeout(() => {
      emit('loadingComplete');
    }, 800);
  }, 800);
}

function fastForwardRemaining() {
  clearTimer();
  isFrozenAtPenultimate.value = false;
  executeFastForward(() => {
    emit('loadingComplete');
  });
}

function executeFastForward(onComplete?: () => void) {
  const lastIndex = allSteps.value.length - 1;

  if (currentStepIndex.value >= lastIndex) {
    if (currentStepIndex.value >= 0 && stepPhases.value.length > currentStepIndex.value) {
      stepPhases.value[currentStepIndex.value] = 'completed';
    }
    currentStepProgress.value = 1.0;
    notify();
    onComplete?.();
    return;
  }

  if (currentStepIndex.value >= 0) {
    const step = allSteps.value[currentStepIndex.value];
    if (currentStepIndex.value < stepPhases.value.length) {
      stepPhases.value[currentStepIndex.value] = step.joinedMember ? 'joined' : 'completed';
    }
    currentStepProgress.value = 1.0;
  }

  clearTimer();
  animationTimer = window.setTimeout(() => {
    const nextIndex = currentStepIndex.value + 1;
    currentStepIndex.value = nextIndex;
    currentStepProgress.value = 1.0;

    if (nextIndex >= lastIndex) {
      stepPhases.value.push('completed');
      notify();
      onComplete?.();
    } else {
      stepPhases.value.push('working');
      notify();
      clearTimer();
      animationTimer = window.setTimeout(() => {
        executeFastForward(onComplete);
      }, 300);
    }
  }, 300);
}

function notify() {
  scrollToLatestStep();
}

function clearTimer() {
  if (animationTimer) {
    clearInterval(animationTimer);
    clearTimeout(animationTimer);
    animationTimer = null;
  }
}

const hasStarted = ref(false);

function start() {
  currentStepIndex.value = -1;
  currentStepProgress.value = 0;
  stepPhases.value = [];
  isFrozenAtPenultimate.value = false;

  const defaultRemainingMinutes = props.processType === 'outline' ? 2 : 1;
  const estimatedSeconds = props.estimatedTime || (defaultRemainingMinutes * 60);
  const remainingSeconds = props.remainingTime || estimatedSeconds;

  totalDurationMs.value = estimatedSeconds * 1000;

  if (props.startFromBeginning) {
    emit('update:animationStartTime', Date.now());
    currentStepIndex.value = 0;
    stepPhases.value.push('working');
    notify();
    startWorking();
    hasStarted.value = true;
    return;
  }

  const elapsedSeconds = estimatedSeconds - remainingSeconds;
  const elapsedMs = Math.max(0, elapsedSeconds * 1000);

  emit('update:animationStartTime', Date.now() - elapsedMs);

  const progressRatio = elapsedMs / totalDurationMs.value;

  if (isAnimating() && (progressRatio >= 0.95 || remainingSeconds <= 60)) {
    fastForwardAndFreezeAt99();
  } else if (elapsedMs <= 0) {
    currentStepIndex.value = 0;
    stepPhases.value.push('working');
    notify();
    startWorking();
  } else {
    fastForwardAndResume(elapsedMs);
  }
  hasStarted.value = true;
}

watch(() => props.taskStatus, (newStatus) => {
  if (newStatus === 'SUCCESS') {
    if (isFrozenAtPenultimate.value) {
      unfreeze();
    } else {
      fastForwardRemaining();
    }
  }
});

watch(() => props.processType, (newType, oldType) => {
  if (newType !== oldType) {
    hasStarted.value = false;
    start();
  }
});

watch(
  () => [props.estimatedTime, props.remainingTime],
  ([newEstimated, newRemaining], [oldEstimated, oldRemaining]) => {
    const hasValidNewValues =
      (newEstimated != null && newEstimated > 0) ||
      (newRemaining != null && newRemaining > 0);

    if (!hasValidNewValues) return;

    if (isFrozenAtPenultimate.value) return;

    if (hasStarted.value) {
      const prevHadEstimated = oldEstimated != null && oldEstimated !== undefined;
      const prevHadRemaining = oldRemaining != null && oldRemaining !== undefined;
      const estimatedChanged = newEstimated !== oldEstimated && prevHadEstimated;
      const remainingChanged = newRemaining !== oldRemaining && prevHadRemaining;
      const newEstimatedArrived = !prevHadEstimated && (newEstimated != null && newEstimated !== undefined);
      const newRemainingArrived = !prevHadRemaining && (newRemaining != null && newRemaining !== undefined);
      if (!estimatedChanged && !remainingChanged && !newEstimatedArrived && !newRemainingArrived) return;
    }

    start();
  },
  { flush: 'post' }
);

onMounted(() => {
  if (props.estimatedTime != null || props.remainingTime != null) {
    if (props.animationStartTime && props.animationStartTime > 0 && !props.startFromBeginning) {
      const estimatedSeconds = props.estimatedTime || (props.processType === 'outline' ? 120 : 60);
      const elapsedMs = Math.min(Date.now() - props.animationStartTime, estimatedSeconds * 1000);
      if (elapsedMs > 0) {
        fastForwardAndResume(elapsedMs);
        hasStarted.value = true;
        return;
      }
    }
    start();
  }
});

onUnmounted(() => {
  clearTimer();
});

defineExpose({
  fastForwardRemaining,
  unfreeze,
});
</script>

<style lang="scss" scoped>
.process-steps {
  position: relative;
  width: 100%;
  margin: 0 auto;
  padding: 2.4rem 0;
}

.process-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 3.6rem;
  opacity: 1;
  transition: all 0.3s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &.step-hidden {
    display: none;
  }

}

.step-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  gap: 2.4rem;
  width: 100%;
}

.step-with-role {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.role-avatar-container {
  flex-shrink: 0;
}

.role-avatar {
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.role-name {
  font-size: 1.6rem;
  color: #364153;
}

.step-description-container {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.step-description {
  font-size: 1.4rem;
  line-height: 1.8rem;
  color: #364153;
  padding: 1.2rem;
  border: 1px solid rgba(251, 100, 182, 0.3);
  border-radius: 0.8rem;
  background: rgba(251, 100, 182, 0.12);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: max-content;
  box-sizing: border-box;
  overflow: hidden;

  &.with-progress {
    background: transparent;
  }
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(251, 100, 182, 0.12);
  border-radius: 0.8rem;
  transition: width 0.2s ease;
  z-index: 0;
}

.step-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex: 1;
}

.progress-percentage {
  font-size: 1.4rem;
  color: #99A1AF;
  white-space: nowrap;
  z-index: 1;
}

.loading-icon {
  display: inline-block;
  width: 2.2rem;
  height: 2.2rem;
  margin-left: 1.2rem;
  vertical-align: middle;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.team-message {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1.4rem;
  line-height: 1.8rem;

  .team-avatar {
    width: 2.2rem;
    height: 2.2rem;
  }

  .team-username {
    margin-right: 1rem;
    color: #FB64B6;
  }

  .team-action {
    color: #99A1AF;
  }

  .team-target {
    display: flex;
    align-items: center;
    margin: 0 1rem 0 1.6rem;

    .team-target-avatar {
      width: 2.2rem;
      height: 2.2rem;
    }

    .team-target-username {
      color: #364153;
    }
  }
}
</style>