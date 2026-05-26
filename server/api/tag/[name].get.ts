import { defineEventHandler } from 'h3';
import { api } from '@/api';

export default defineEventHandler(async (event) => {
  try {
    const { name } = event.context.params;
    const { page = 1, limit = 20 } = getQuery(event);
    const response = await api.getTagList({ tag: name, page, limit });
    return {
      success: true,
      data: response.data,
      message: `获取${name}标签列表成功`
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: '获取标签列表失败'
    };
  }
});
