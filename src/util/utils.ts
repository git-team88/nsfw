import { baseUrl } from './config';
import i18n from '../lang/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const SERVER_TIMEZONE = 'Asia/Shanghai';

export function parseToUnixTimestamp(value: number | string): number {
  if (!value) return 0;

  if (typeof value === 'number') {
    return value;
  }

  const str = String(value).trim();

  if (/^\d+$/.test(str)) {
    return Number(str);
  }

  const hasTz = /[Zz]$|[+-]\d{2}:\d{2}$/.test(str);
  if (hasTz) {
    return dayjs(str).unix();
  }

  return dayjs.tz(str, SERVER_TIMEZONE).unix();
}

// 初始化语言设置
export async function initLanguage() {
  const savedLang = localStorage.getItem('lang');
  if (savedLang) {
    return savedLang;
  }

  const lang = 'en';
  localStorage.setItem('lang', lang);
  i18n.global.locale.value = lang;
  return lang;
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
  const unix = parseToUnixTimestamp(timestamp);
  if (!unix) return '';

  const date = new Date(unix * 1000);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDateOnly(timestamp: number | string): string {
  const unix = parseToUnixTimestamp(timestamp);
  if (!unix) return '';

  const date = new Date(unix * 1000);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

  const unix = parseToUnixTimestamp(timeStr);
  if (!unix) return { key: '' };

  const date = new Date(unix * 1000);
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
