import { ref } from "vue";
import api from "@/api";
import i18n from "@/lang/i18n";

/** 接口 book/getBookTagsListPublic 返回的一条分类 */
export interface BookTag {
  id: string | number;
  tag_id: string | number;
  name_jp?: string;
  name_en?: string;
  name_cn?: string;
  name_kr?: string;
  name_th?: string;
  name_tc?: string;
}

// 不做缓存：每次打开表单都重新拉一次，后台新增的分类立刻能看到；
// 只合并同一时刻的并发请求（两个表单同时初始化时不重复请求）
const tags = ref<BookTag[]>([]);
let loading: Promise<BookTag[]> | null = null;

/** 拉分类列表（每次调用都请求接口） */
export function loadBookTags(): Promise<BookTag[]> {
  if (!loading) {
    loading = (api.getBookTagsList() as Promise<any>)
      .then(res => {
        const list = res?.code === 0 ? (res.data?.tags || res.data?.list || []) : [];
        if (Array.isArray(list) && list.length) tags.value = list;
        return tags.value;
      })
      .catch(() => tags.value)
      .finally(() => { loading = null; });
  }
  return loading;
}

/** 按当前站点语言取分类名；没有对应语言时退到英文 / 中文 */
export function bookTagLabel(tag: BookTag | undefined): string {
  if (!tag) return "";
  const key = ({ jp: "name_jp", en: "name_en", zh: "name_cn", tc: "name_tc", ko: "name_kr", th: "name_th" } as Record<string, keyof BookTag>)[String(i18n.global.locale.value)] || "name_en";
  return String(tag[key] || tag.name_en || tag.name_cn || "");
}

export { tags as bookTags };
