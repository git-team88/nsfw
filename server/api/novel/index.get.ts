import { defineEventHandler } from 'h3';
import { api } from '@/api';

export default defineEventHandler(async (event) => {
  try {
    const { page = 1, limit = 20 } = getQuery(event);
    const response = await api.getNovelList({ page, limit });
    return {
      success: true,
      data: response.data,
      message: '获取小说列表成功'
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: '获取小说列表失败'
    };
  }
});
