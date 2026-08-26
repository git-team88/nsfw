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
        marginBottom: "8px",
      };
    } else {
      popStyle.value = {
        top: "100%",
        bottom: "auto",
        marginTop: "8px",
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
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  background: #1a1a1a;
  color: #f5f5f5;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  box-shadow: none;

  &:hover {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }
  &:active {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
}

.drp-trigger .icon {
  width: 16px;
  height: 16px;
}

.drp-trigger .text {
  font-size: 14px;
  color: #f5f5f5;
}

.drp-trigger .arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  &.open {
    transform: rotate(180deg);
  }
}

.drp-pop {
  position: absolute;
  left: 0;
  top: 50px;
  width: 360px;
  padding: 20px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  z-index: 500;
}

.field label {
  display: block;
  font-size: 14px;
  color: #f5f5f5;
  font-weight: 800;
  margin-bottom: 7px;
}

.date-input-wrapper {
  position: relative;
  width: 100%;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #777;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.14s;
  z-index: 10;

  &:hover {
    color: #f5f5f5;
  }
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  width: 152px;
  height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
}

.btn.cancel {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  color: #f5f5f5;
  box-shadow: none;

  &:hover {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    color: #ff4f9a;
    border-color: #ff4f9a;
  }
  &:active {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
}

.btn.apply {
  border: 1px solid #3d3d3d;
  color: #f5f5f5;
  box-shadow: none;

  &:hover:not(:disabled) {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }
  &:active {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
}

.theme-blue .drp-trigger {
  &:hover {
    border-color: #00d3f2;
  }
}

.theme-blue .field {
  margin-bottom: 16px;

  :deep(.el-date-editor.el-input) {
    width: 100%;
    height: 40px;
  }
  :deep(.el-input__wrapper) {
    height: 40px;
    border: 1px solid #3d3d3d !important;
    border-radius: 12px !important;
    background: #1a1a1a !important;
    box-shadow: none !important;
  }
  :deep(.el-input__wrapper:hover) {
    border-color: #00d3f2 !important;
  }
  :deep(.el-input__wrapper.is-focus) {
    border-color: #00d3f2 !important;
    box-shadow: none !important;
  }
  :deep(.el-input__inner) {
    color: #f5f5f5 !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }
}

.theme-blue .btn.cancel:hover {
  color: #00d3f2;
  border-color: #00d3f2;
}

.theme-blue .btn.apply {
  background: #00d3f2;
}

.theme-pink .drp-trigger {
  &:hover {
    border-color: #ff4f9a;
  }
}

.theme-pink .field {
  margin-bottom: 16px;

  :deep(.el-date-editor.el-input) {
    width: 100%;
    height: 40px;
  }
  :deep(.el-input__wrapper) {
    height: 40px;
    border: 1px solid #3d3d3d !important;
    border-radius: 12px !important;
    background: #1a1a1a !important;
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #ff4f9a !important;
    box-shadow: none !important;
  }
  :deep(.el-input__inner) {
    color: #f5f5f5 !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }
}

.theme-pink .btn.cancel:hover {
  color: #ff4f9a;
  border-color: #ff4f9a;
}

.theme-pink .btn.apply {
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
}
</style>
