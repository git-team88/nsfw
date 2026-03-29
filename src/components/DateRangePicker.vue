<template>
  <div class="drp" :class="`theme-${theme}`" ref="rootRef">
    <button class="drp-trigger" @click="toggle($event)">
      <img class="icon" :src="theme == 'pink' ? dateIcon : dateGreenIcon" alt="" />
      <span class="text">{{ displayText }}</span>
      <img class="arrow" :class="{ open }" :src="arrowDown" alt="" />
    </button>
    <div class="drp-pop" v-if="open" :style="popStyle">
      <div class="field">
        <label>{{ t("user.interactive.startDate") }}</label>
        <div class="date-input-wrapper">
          <el-date-picker
            v-model="tempStart"
            type="date"
            :placeholder="t('user.interactive.startDate')"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
          <button
            v-if="tempStart"
            class="clear-btn"
            @click.stop="tempStart = ''"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
      <div class="field">
        <label>{{ t("user.interactive.endDate") }}</label>
        <div class="date-input-wrapper">
          <el-date-picker
            v-model="tempEnd"
            type="date"
            :placeholder="t('user.interactive.endDate')"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
          <button
            v-if="tempEnd"
            class="clear-btn"
            @click.stop="tempEnd = ''"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
      <div class="actions">
        <button class="btn cancel" @click="onCancel">{{ t("user.interactive.cancel") }}</button>
        <button class="btn apply" @click="onApply">{{ t("user.interactive.apply") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DateRangePicker">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import arrowDown from "@/assets/images/user/arrow.png";
import dateIcon from "@/assets/images/user/date.png";
import dateGreenIcon from "@/assets/images/user/date_green.png";
import dayjs from "dayjs";

const { t, locale } = useI18n();
const props = defineProps<{
  modelValue: { start: string; end: string };
  theme?: "pink" | "blue";
}>();
const emit = defineEmits(["update:modelValue", "change"]);
const open = ref(false);
const popStyle = ref<Record<string, string>>({});

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getSevenDaysBeforeCurrent = () => {
  return dayjs().subtract(7, "day").format("YYYY-MM-DD");
};

// 实际显示的值
const start = ref(props.modelValue.start || '');
const end = ref(props.modelValue.end || '');

// 临时值，用于弹窗中的选择
const tempStart = ref(start.value);
const tempEnd = ref(end.value);

watch(
  () => props.modelValue,
  (v) => {
    start.value = v.start || '';
    end.value = v.end || '';
    tempStart.value = start.value;
    tempEnd.value = end.value;
  },
  { immediate: true },
);

const displayText = computed(() => {
  if (!start.value && !end.value) {
    return `${t("user.interactive.startDate")} ~ ${t("user.interactive.endDate")}`;
  }
  if (!start.value) {
    return `${t("user.interactive.startDate")} ~ ${end.value}`;
  }
  if (!end.value) {
    return `${start.value} ~ ${t("user.interactive.endDate")}`;
  }
  return `${start.value} ~ ${end.value}`;
});

// Only disable future dates
function disabledDate(time: Date) {
  const today = dayjs();
  return dayjs(time).isAfter(today, 'day');
}

function toggle(event: MouseEvent) {
  open.value = !open.value;
  if (open.value) {
    tempStart.value = start.value;
    tempEnd.value = end.value;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const popHeight = 400; // Increased for el-date-picker
    const popWidth = 400; // Based on CSS width

    // Reset styles first
    popStyle.value = {};

    // Vertical positioning
    if (rect.bottom + popHeight > screenHeight) {
      popStyle.value = {
        bottom: "100%",
        top: "auto",
        marginTop: "0",
        marginBottom: "0.8rem",
      };
    } else {
      popStyle.value = {
        top: "100%",
        bottom: "auto",
        marginTop: "0.8rem",
        marginBottom: "0",
      };
    }

    // Horizontal positioning
    if (rect.right + popWidth > screenWidth) {
      popStyle.value.left = "auto";
      popStyle.value.right = "0";
    } else {
      popStyle.value.left = "0";
      popStyle.value.right = "auto";
    }
  }
}

function onCancel() {
  open.value = false;
  tempStart.value = start.value;
  tempEnd.value = end.value;
}

function onApply() {
  let s = tempStart.value;
  let e = tempEnd.value;

  if (dayjs(s).isAfter(dayjs(e))) {
    [s, e] = [e, s];
  }

  const diffYears = dayjs(e).diff(dayjs(s), "year", true);
  if (diffYears > 1) {
    toast(t("user.interactive.maxOneYear"));
    return;
  }

  start.value = s;
  end.value = e;
  tempStart.value = s;
  tempEnd.value = e;
  emit("update:modelValue", { start: s, end: e });
  emit("change", { start: s, end: e });
  open.value = false;
}

const theme = computed(() => props.theme ?? "blue");
const rootRef = ref<HTMLElement | null>(null);

function handleDoc(ev: MouseEvent) {
  if (!open.value) return;

  const target = ev.target as HTMLElement;

  // Check if click is inside the component root
  if (rootRef.value && rootRef.value.contains(target)) {
    return;
  }

  // Check if the target or any parent has a class that starts with 'el-'
  // This covers all Element Plus components
  let element: HTMLElement | null = target;
  while (element) {
    if (element.classList) {
      const classList = Array.from(element.classList);
      // Check if any class starts with 'el-'
      if (classList.some(cls => cls.startsWith('el-'))) {
        return; // Don't close if clicking inside any Element Plus component
      }
    }
    element = element.parentElement;
  }

  // Click is outside both our component and Element Plus elements
  open.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleDoc);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDoc);
});
</script>

<style scoped lang="scss">
.drp {
  position: relative;
}

.drp-trigger {
  height: 4rem;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-radius: 0.6rem;
  background: #F5F5F5;
  color: #6a7282;
  cursor: pointer;
}

.drp-trigger .icon {
  width: 1.6rem;
  height: 1.6rem;
}

.drp-trigger .text {
  font-size: 1.4rem;
  color: #6a7282;
}

.drp-trigger .arrow {
  width: 1.6rem;
  height: 1.6rem;
  transition: transform 0.2s ease;
  &.open {
    transform: rotate(180deg);
  }
}

.drp-pop {
  position: absolute;
  left: 0;
  top: 5rem;
  width: 36rem;
  padding: 2rem;
  border-radius: 0.8rem;
  background: #FFFFFF;
  box-shadow: 0px 0px 30px 0px rgba(0,0,0,0.1);
  z-index: 500;
}

.field label {
  display: block;
  font-size: 1.4rem;
  color: #364153;
  margin-bottom: 0.7rem;
}

.date-input-wrapper {
  position: relative;
  width: 100%;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #ccc;
  font-size: 2.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  z-index: 10;

  &:hover {
    color: #999;
  }
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  width: 15.2rem;
  height: 4rem;
  padding: 0 1.2rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
}

.btn.cancel {
  background: #F5F5F5;
  cursor: pointer;
}

.btn.apply {
  border: none;
  color: #FFFFFF;
  cursor: pointer;
}

.theme-blue .drp-trigger {
  border-color: rgba(0, 211, 242, 0.2);
}

.theme-blue .drp-trigger:hover {
  border-color: #00d3f2;
}

.theme-blue .drp-pop {
  border-color: rgba(0, 211, 242, 0.2);
}

.theme-blue .field {
  margin-bottom: 1.6rem;

  :deep(.el-date-editor.el-input) {
    width: 100%;
    height: 4rem;
  }
  :deep(.el-input__wrapper) {
    height: 4rem;
    border: 1px solid #F5F5F5 !important;
    border-radius: 0.8rem !important;
    background: #F5F5F5 !important;
    box-shadow: none !important;
  }
  :deep(.el-input__wrapper:hover) {
    border-color: #00d3f2 !important;
  }
  :deep(.el-input__wrapper.is-focus) {
    border-color: #00d3f2 !important;
  }
  :deep(.el-input__inner) {
    color: #364153 !important;
    font-size: 1.4rem !important;
  }
}

.theme-blue .btn.cancel {
  border-color: rgba(0, 211, 242, 0.6);
  color: #00d3f2;
}

.theme-blue .btn.cancel:hover {
  background: rgba(0, 211, 242, 0.12);
}

.theme-blue .btn.apply {
  background: #00d3f2;
}

.theme-pink .drp-trigger {
  border-color: rgba(251, 100, 182, 0.2);
}

.theme-pink .drp-trigger:hover {
  border-color: #fb64b6;
}

.theme-pink .drp-pop {
  border-color: rgba(251, 100, 182, 0.2);
}

.theme-pink .field {
  margin-bottom: 1.6rem;

  :deep(.el-date-editor.el-input) {
    width: 100%;
    height: 4rem;
  }
  :deep(.el-input__wrapper) {
    height: 4rem;
    border: 1px solid #F5F5F5 !important;
    border-radius: 0.8rem !important;
    background: #F5F5F5 !important;
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #fb64b6 !important;
  }
  :deep(.el-input__inner) {
    color: #364153 !important;
    font-size: 1.4rem !important;
  }
}

.theme-pink .btn.cancel {
  background: #F5F5F5;
  color: #6A7282;
}

.theme-pink .btn.cancel:hover {
  color: #FB64B6;
}

.theme-pink .btn.apply {
  background: #fb64b6;

  &:hover{
    position: relative;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
  }
}
</style>
