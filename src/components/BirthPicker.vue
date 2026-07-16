<template>
  <div class="date-row">
    <!-- Month -->
    <div class="select-container">
      <div class="select-box" :class="{ active: showMonth, 'edit': isEdit }" @click.stop="toggleMonth">
        <span class="selected" :class="month ? 'on' : ''">{{ month || "MM" }}</span>
        <img src="@/assets/images/user/down.png" class="arrow" />
        <div class="options" v-if="showMonth">
          <div
            class="opt"
            :class="month == m ? 'on' : ''"
            v-for="m in monthOptions"
            :key="m"
            @click.stop="selectMonth(m)"
          >
            {{ m }}
          </div>
        </div>
      </div>
      <div class="date-text">{{ t("birthday.month") }}</div>
    </div>

    <!-- Day -->
    <div class="select-container">
      <div class="select-box" :class="{ active: showDay, 'edit': isEdit }" @click.stop="toggleDay">
        <div class="selected" :class="day ? 'on' : ''">{{ day || "DD" }}</div>
        <img src="@/assets/images/user/down.png" class="arrow" />
        <div class="options" v-if="showDay">
          <div
            class="opt"
            :class="day == d ? 'on' : ''"
            v-for="d in dayOptions"
            :key="d"
            @click.stop="selectDay(d)"
          >
            {{ d }}
          </div>
        </div>
      </div>

      <div class="date-text">{{ t("birthday.day") }}</div>
    </div>

    <!-- Year -->
    <div class="select-container">
      <div class="select-box" :class="{ active: showYear, 'edit': isEdit }" @click.stop="toggleYear">
        <div class="selected" :class="year ? 'on' : ''">{{ year || "YYYY" }}</div>
        <img src="@/assets/images/user/down.png" class="arrow" />
        <div class="options" v-if="showYear">
          <div
            class="opt"
            :class="year == y ? 'on' : ''"
            v-for="y in yearOptions"
            :key="y"
            @click.stop="selectYear(y)"
          >
            {{ y }}
          </div>
        </div>
      </div>

      <div class="date-text">{{ t("birthday.year") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    modelValue?: { year: number | ""; month: number | ""; day: number | "" };
    isEdit?: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  "update:modelValue": [value: { year: number | ""; month: number | ""; day: number | "" }];
  change: [value: { year: number | ""; month: number | ""; day: number | "" }];
}>();

const { t, locale } = useI18n();

const startYear = ref(1900);
const endYear = ref(new Date().getFullYear());
const month = ref(props.modelValue?.month || "");
const day = ref(props.modelValue?.day || "");
const year = ref(props.modelValue?.year || "");

const showMonth = ref(false);
const showDay = ref(false);
const showYear = ref(false);

// Computed
const monthOptions = computed(() => {
  const options = [];
  for (let m = 1; m <= 12; m++) {
    options.push(m);
  }
  return options;
});

const dayOptions = computed(() => {
  if (!month.value) return Array.from({ length: 31 }, (_, i) => i + 1);

  const m = Number(month.value);
  if ([1, 3, 5, 7, 8, 10, 12].includes(m)) return Array.from({ length: 31 }, (_, i) => i + 1);
  if ([4, 6, 9, 11].includes(m)) return Array.from({ length: 30 }, (_, i) => i + 1);

  if (m === 2) {
    if (year.value && isLeap(Number(year.value)))
      return Array.from({ length: 29 }, (_, i) => i + 1);
    if (year.value && !isLeap(Number(year.value)))
      return Array.from({ length: 28 }, (_, i) => i + 1);
    return Array.from({ length: 29 }, (_, i) => i + 1); // Default to 29 for February
  }

  return Array.from({ length: 31 }, (_, i) => i + 1);
});

const yearOptions = computed(() => {
  const list = [];

  for (let y = endYear.value; y >= startYear.value; y--) {
    if (day.value === 29 && month.value === 2) {
      if (isLeap(y)) list.push(y);
    } else {
      list.push(y);
    }
  }
  return list;
});

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function toggleMonth() {
  if (showDay.value) showDay.value = false;
  if (showYear.value) showYear.value = false;
  showMonth.value = !showMonth.value;
}

function toggleDay() {
  if (showMonth.value) showMonth.value = false;
  if (showYear.value) showYear.value = false;
  showDay.value = !showDay.value;
}

function toggleYear() {
  if (showMonth.value) showMonth.value = false;
  if (showDay.value) showDay.value = false;
  showYear.value = !showYear.value;
}

function closeAll() {
  showMonth.value = false;
  showDay.value = false;
  showYear.value = false;
}

function selectMonth(m: number) {
  month.value = m;
  closeAll();
  emitValue();
}

function selectDay(d: number) {
  day.value = d;
  closeAll();
  emitValue();
}

function selectYear(y: number) {
  year.value = y;
  closeAll();
  emitValue();
}

function emitValue() {
  const value = {
    year: year.value,
    month: month.value,
    day: day.value,
  } as { year: number | ""; month: number | ""; day: number | "" };
  emit("update:modelValue", value);
  emit("change", value);
}

watch([month, day], () => {
  if (day.value && dayOptions.value && Number(day.value) > dayOptions.value.length) {
    day.value = "";
    emitValue();
  }
});

// Watch for external model value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      month.value = newValue.month || "";
      day.value = newValue.day || "";
      year.value = newValue.year || "";
    }
  },
  { deep: true },
);

// Close dropdowns on click outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element;
  if (!target.closest(".select-box")) {
    closeAll();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.date-row {
  display: flex;
  gap: 16px;
}

.select-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-box {
  flex: 1;
  width: 100px;
  height: 48px;
  border: 1px solid rgba(22, 17, 34, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  position: relative;
  cursor: pointer;
  background: rgba(22, 17, 34, 0.06);

  &.edit{
    background: #FFFFFF;
  }
}

.select-box.active {
  border-color: #FF4D8D;
}

.selected {
  font-size: 14px;
  color: #9a93a4;
}

.selected.on {
  color: #161122;
}

.date-text {
  color: #5b5566;
  font-size: 14px;
}

.arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.2s;
}

.select-box.active .arrow {
  transform: rotate(180deg);
}

.options {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 204px;
  padding: 6px 0;
  overflow-y: auto;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
  border-radius: 8px;
  margin-top: 8px;
  z-index: 10;
}

.opt {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #5b5566;
  cursor: pointer;
}

.opt:hover {
  color: #161122;
}

.opt.on {
  font-weight: 600;
  color: #161122;
}
</style>
