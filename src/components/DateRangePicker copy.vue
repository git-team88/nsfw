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
        <el-date-picker
          v-model="tempStart"
          type="date"
          :placeholder="t('user.interactive.startDate')"
          :disabled-date="disabledDate"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="onDateChange"
        />
      </div>
      <div class="field">
        <label>{{ t("user.interactive.endDate") }}</label>
        <el-date-picker
          v-model="tempEnd"
          type="date"
          :placeholder="t('user.interactive.endDate')"
          :disabled-date="disabledDate"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="onDateChange"
        />
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
import arrowDown from "@/assets/images/user/arrow.png";
import dateIcon from "@/assets/images/user/date.png";
import dateGreenIcon from "@/assets/images/user/date_green.png";
import dayjs from "dayjs";

const { t, locale } = useI18n();
const props = defineProps<{
  modelValue: { start: string; end: string };
  theme?: "pink" | "blue";
}>();
const emit = defineEmits(["update:modelValue"]);
const open = ref(false);
const popStyle = ref<Record<string, string>>({});

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getSevenDaysBeforeCurrent = () => {
  return dayjs().subtract(7, "day").format("YYYY-MM-DD");
};

// 实际显示的值
const start = ref(props.modelValue.start || getSevenDaysBeforeCurrent());
const end = ref(props.modelValue.end || getCurrentDate());

// 临时值，用于弹窗中的选择
const tempStart = ref(start.value);
const tempEnd = ref(end.value);

watch(
  () => props.modelValue,
  (v) => {
    start.value = v.start || getSevenDaysBeforeCurrent();
    end.value = v.end || getCurrentDate();
    tempStart.value = start.value;
    tempEnd.value = end.value;
  },
  { immediate: true },
);

const displayText = computed(() => {
  return `${start.value}~${end.value}`;
});

function disabledDate(time: Date) {
  return time.getTime() > Date.now(); // Disable future dates only, allow today
}

function onDateChange() {
  // Logic handled by v-model, but we can add validation here if needed
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

  if (!s || !e) {
    open.value = false;
    return;
  }

  // Validate range: s <= e
  if (dayjs(s).isAfter(dayjs(e))) {
    [s, e] = [e, s];
  }

  // Validate range: max 3 months
  const diffMonths = dayjs(e).diff(dayjs(s), "month", true);
  if (diffMonths > 3) {
    e = dayjs(s).add(3, "month").format("YYYY-MM-DD");
    // Ensure e is not in the future
    if (dayjs(e).isAfter(dayjs().subtract(1, "day"))) {
      e = getCurrentDate();
      s = dayjs(e).subtract(3, "month").format("YYYY-MM-DD");
    }
  }

  start.value = s;
  end.value = e;
  emit("update:modelValue", { start: s, end: e });
  open.value = false;
}

const theme = computed(() => props.theme ?? "blue");
const rootRef = ref<HTMLElement | null>(null);

function handleDoc(ev: MouseEvent) {
  const t = ev.target as Node;
  // el-date-picker panels are outside the component root
  // We need to check if the click is on an element that belongs to the date picker
  const isClickInsideElPicker =
    !!(t as HTMLElement).closest(".el-picker-panel") ||
    !!(t as HTMLElement).closest(".el-date-table") ||
    !!(t as HTMLElement).closest(".el-date-picker__header");

  if (rootRef.value && !rootRef.value.contains(t) && !isClickInsideElPicker) {
    open.value = false;
  }
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
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.6rem;
  background: #fff;
  color: #6a7282;
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.drp-trigger .icon {
  width: 1.6rem;
  height: 1.6rem;
}

.drp-trigger .text {
  font-size: 1.4rem;
  color: #364153;
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
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  background: #ffffff;
  box-shadow: 0px 10px 30px 0px rgba(0, 0, 0, 0.1);
  z-index: 2000;
}

.field label {
  display: block;
  font-size: 1.4rem;
  color: #364153;
  margin-bottom: 0.7rem;
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
  background: #fff;
  border: 1px solid;
  cursor: pointer;
}

.btn.apply {
  border: none;
  color: #fff;
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
    border: 1px solid rgba(0, 211, 242, 0.2) !important;
    border-radius: 0.8rem !important;
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
    border: 1px solid rgba(251, 100, 182, 0.2) !important;
    border-radius: 0.8rem !important;
    box-shadow: none !important;
  }
  :deep(.el-input__wrapper:hover) {
    border-color: #fb64b6 !important;
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
  border-color: rgba(251, 100, 182, 0.6);
  color: #fb64b6;
}

.theme-pink .btn.cancel:hover {
  background: rgba(251, 100, 182, 0.12);
}

.theme-pink .btn.apply {
  background: #fb64b6;
}
</style>
