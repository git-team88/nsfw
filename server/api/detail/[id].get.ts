import { defineEventHandler } from 'h3';
import { api } from '@/api';

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params;
    const response = await api.getDetail({ id });
    return {
      success: true,
      data: response.data,
      message: '获取作品详情成功'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '获取作品详情失败'
    };
  }
});
