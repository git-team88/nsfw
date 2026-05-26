import { defineNuxtConfig } from 'nuxt/config';
import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  devtools: { enabled: true },
  
  app: {
    baseURL: '/',
    head: {
      htmlAttrs: {
        lang: 'zh'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],

  i18n: {
    locales: [
      { code: 'zh', name: '中文', file: 'zh.ts' },
      { code: 'en', name: 'English', file: 'en.ts' },
      { code: 'jp', name: '日本語', file: 'jp.ts' }
    ],
    defaultLocale: 'zh',
    lazy: true,
    langDir: 'lang/'
  },

  pinia: {
    storesDirs: ['./stores/**']
  },

  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  },

  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    routeRules: {
      '/': { ssr: true },
      '/comic': { ssr: true },
      '/video': { ssr: true },
      '/category/**': { ssr: true },
      '/tag/**': { ssr: true },
      '/detail/**': { ssr: true },
      '/chapter/**': { ssr: true }
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  hooks: {
    'nitro:config': (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {};
      nitroConfig.alias['@'] = fileURLToPath(new URL('./src', import.meta.url));
    }
  }
});
