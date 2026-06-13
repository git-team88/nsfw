import { baseUrl } from './config';
import i18n from '../lang/i18n';
import api from '../api';

// 初始化语言设置
export async function initLanguage() {
  const savedLang = localStorage.getItem('lang');
  if (savedLang) {
    return savedLang;
  }

  try {
    const res: any = await api.getCode();
    if (res.code === 0 && res.data?.countryCode) {
      const countryCode = res.data.countryCode;
      let lang = 'en';

      if (countryCode === 'CN') {
        lang = 'zh';
      } else if (countryCode === 'JP') {
        lang = 'jp';
      } else if (countryCode === 'TW' || countryCode === 'HK') {
        lang = 'tc';
      }

      localStorage.setItem('lang', lang);
      i18n.global.locale.value = lang;
      return lang;
    }
  } catch (error) {
    console.error('Failed to get country code:', error);
  }

  return 'en';
}

export function formatQuantity(num: number) {
  if (typeof num != 'number' || !Number.isInteger(num)) {
    return false
  }

  if (Math.abs(num) <= 1000) return num.toString()

  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDecimal(num: string) {
  const number = Number(num)
  if (isNaN(number)) return false

  if (Number.isInteger(num)) {
    return num
  }

  const [integerPart, decimalPart] = num.split('.')

  if (Math.abs( Number(integerPart)) <= 1000) return num

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${formattedInteger}.${decimalPart}`
}

export function filterAddress(address: string) {
  if (address) {
    if (address.length > 9) {
      return address.slice(0,4) + '***' + address.slice(-4);
    } else {
      return address;
    }
  }

  return ''
}

export function formatTimestamp(timestamp: number | string): string {
  let date;

  if (typeof timestamp == 'number') {
    date = new Date(timestamp * 1000);
  } else if (typeof timestamp == 'string') {
    const numTimestamp = parseInt(timestamp);
    if (!isNaN(numTimestamp)) {
      date = new Date(numTimestamp * 1000);
    } else {
      date = new Date(timestamp);
    }
  } else {
    return '';
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export interface TimeFormatResult {
  key: string;
  params?: Record<string, number>;
}

export function formatUpdateTime(timeStr: string): TimeFormatResult {
  if (!timeStr) return { key: '' };

  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const months = Math.floor(days / 30);

  if (hours < 1) {
    return { key: 'home.updateTime.justNow' };
  } else if (hours < 24) {
    return { key: 'home.updateTime.hoursAgo', params: { hours } };
  } else if (days <= 29) {
    return { key: 'home.updateTime.daysAgo', params: { days } };
  } else if (months <= 11) {
    return { key: 'home.updateTime.monthsAgo', params: { months } };
  } else {
    return { key: 'home.updateTime.yearsAgo', params: { years: Math.floor(months / 12) } };
  }
}

export function processImageUrl(url: string | undefined, quality: number = 60): string {
  if (!url) return '';
  const formatParam = `imageMogr2/format/webp/quality/${quality}`;
  if (url.includes('?')) {
    return url + '&' + formatParam;
  }
  return url + '?' + formatParam;
}
