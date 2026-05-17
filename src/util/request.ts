import axios from 'axios'
import qs from 'qs'
import { baseUrl } from '../util/config'
import router from '@/router'
import '@/util/antiCrawler'

declare global {
  interface Window {
    AntiCrawler: {
      generateAuthParams: (token: string) => { ts: string; sign: string }
    }
  }
}

class Request {
  baseURL: string;
  timeout: number;
  constructor() {
    this.baseURL = baseUrl
    this.timeout = 180000
  }
  setInterceptor = (instance: any) => {
    instance.interceptors.request.use((config: {
      url: string, method: string; paramsSerializer: (params: any) => string; header: any; data: string; headers: { token?: any; "Content-Type"?: string; };
}) => {
      if (config.method == 'GET') {
        config.paramsSerializer = function (params) {
          return qs.stringify({
            ...params
          })
        }
      } else {
        if (config.header) {
          config.data = JSON.stringify(config.data)
        } else {
          config.data = qs.stringify(config.data)
        }
      }

      if (config.header) {
        config.headers = config.header
      } else {
        config.headers = {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }

      const token = localStorage.getItem('token')
      if (token) {
        config.headers.token = token
      }

      const url = config.url || '';
      const usePublicToken = url.includes('Public');

      let authToken: string;
      if (usePublicToken) {
        authToken = '';
      } else {
        authToken = token || '';
      }

      const { ts, sign } = window.AntiCrawler.generateAuthParams(authToken);
      ;(config.headers as any).ts = ts
      ;(config.headers as any).sign = sign

      return config
    }, (err: any) => Promise.reject(err))

    instance.interceptors.response.use((res: { data: { code: any; }; }) => {
      const code = res.data.code
      if (code == 101 || code == 100 || code == 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('uid')
        localStorage.removeItem('userInfo')

        const logoutEvent = new Event('userLogout');
        window.dispatchEvent(logoutEvent);

        router.push("/");
      }
      return res.data
    }, (err: any) => {
      if (err.message?.includes('timeout')) {
        return Promise.reject(err)
      }
      let msg: string
      switch (err.response?.status) {
        case 400:
          msg = `${err.response.config.url}`
          break
        case 401:
          msg = err.response.data.msg
          break
        case 422:
          msg = err.response.data.data[0].msg
          break
        case 500:
          msg = `${err.response.config.url}`
          break
        case 503:
          msg = ``
          break
        default:
          msg = err
      }
      console.log(msg)
      return Promise.reject(msg)
    })
  }

  request = (options: any) => {
    const instance = axios.create()
    const config = {
      timeout: this.timeout,
      baseURL: options.baseURL || this.baseURL,
      ...options
    }
    this.setInterceptor(instance)
    return instance(config)
  }
}

export default new Request()
