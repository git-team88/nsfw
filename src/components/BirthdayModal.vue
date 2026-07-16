<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal">
      <!-- <img src="@/assets/images/base/close.png" class="close-btn" @click="close" /> -->
      <div class="title">{{ t("birthday.title") }}</div>

      <div class="date-picker">
        <div class="label"><span>*</span>{{ t("birthday.label") }}</div>

        <BirthPicker v-model="dateValue" @change="handleDateChange" />
      </div>

      <button class="confirm-btn" :disabled="!isValid" @click="confirm">
        {{ t("birthday.confirm") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import BirthPicker from "./BirthPicker.vue";

const { t, locale } = useI18n();
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(["close", "confirm"]);

const dateValue = ref<{ year: number | ""; month: number | ""; day: number | "" }>({
  year: "",
  month: "",
  day: "",
});

const isValid = computed(() => {
  return dateValue.value.year && dateValue.value.month && dateValue.value.day;
});

function handleDateChange(value: { year: number | ""; month: number | ""; day: number | "" }) {
  dateValue.value = value;
}

function confirm() {
  if (isValid.value) {
    emit("confirm", {
      year: dateValue.value.year,
      month: dateValue.value.month,
      day: dateValue.value.day,
    });
  }
}

function close() {
  emit("close");
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}
.modal {
  width: 520px;
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 0;
  position: relative;
}
.close-btn {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.title {
  font-size: 16px;
  font-weight: 500;
  color: #101828;
  margin-bottom: 18px;
  margin-left: 18px;
}
.date-picker {
  margin-bottom: 18px;
  padding: 18px 32px;
  border-top: 1px solid rgba(251, 100, 182, 0.2);
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
}

.label {
  font-size: 14px;
  color: #4a5565;
  margin-bottom: 12px;
  span {
    color: #fa2d47;
    margin-right: 4px;
  }
}
.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 48px;
  margin: 0 auto;
  background: #fb64b6;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
.confirm-btn:disabled {
  position: relative;
  cursor: not-allowed;
  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    z-index: 1;
  }
}
</style>
