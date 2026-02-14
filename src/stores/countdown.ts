import { defineStore } from 'pinia';
import { ref, onUnmounted } from 'vue';

export const useCountdownStore = defineStore('countdown', () => {
  const remainingTime = ref<number>(86399);
  let timer: number;

  const start = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (remainingTime.value <= 0) {
        clearInterval(timer!);
        return;
      }
      remainingTime.value--;
    }, 1000) as unknown as number;
  };

  const reset = (seconds: number = 86399) => {
    remainingTime.value = seconds;
    start();
  };

  const stop = () => {
    if (timer) clearInterval(timer);
  };

  onUnmounted(() => stop());

  return { remainingTime, reset, stop, start };
});