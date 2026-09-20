// 地区判断。原来长在 Home.vue 里（getCountry），输入框拆成组件后
// 首页和组件都要用，放到模块级：整个应用只请求一次，谁先调谁触发。
// 内容开关走 stores/contentSwitch，这里只管国家码。
import { ref } from 'vue';
import api from '@/api/index';

export const userRegion = ref(false);
export const hasFetchedRegion = ref(false);
export const isFetchingRegion = ref(false);

export function ensureRegion(): Promise<void> {
  if (hasFetchedRegion.value) return Promise.resolve();

  if (isFetchingRegion.value) {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (hasFetchedRegion.value) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  isFetchingRegion.value = true;

  return api.getCode().then((res: any) => {
    hasFetchedRegion.value = true;
    isFetchingRegion.value = false;
    userRegion.value = res.code == 0 ? res.data.countryCode != 'CN' : false;
  }).catch((err) => {
    console.log(err);
    userRegion.value = false;
    hasFetchedRegion.value = true;
    isFetchingRegion.value = false;
  });
}
