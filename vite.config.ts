import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        evaluate: true,
        booleans: true,
        loops: true,
        unused: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        collapse_vars: true,
        reduce_vars: true,
        negate_iife: true,
        pure_getters: false,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        unsafe: false,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        keep_fnames: false,
        keep_classnames: false
      },
      mangle: {
        toplevel: true,
        eval: true,
        keep_fnames: false,
        keep_classnames: false,
        reserved: [
          'generateAuthParams',
          'getDefaultToken',
          'AntiCrawler',
          '$',
          'jQuery',
          'Vue',
          'axios',
          'router',
          'store',
          'pinia',
          'i18n',
          'dayjs',
          'locale',
          'useI18n',
          't'
        ]
      },
      output: {
        comments: false,
        beautify: false,
        quote_style: 3
      }
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vue-i18n', 'pinia'],
          ui: ['element-plus', 'ant-design-vue'],
          utils: ['axios', 'dayjs', 'bignumber.js', 'uuid'],
          pdf: ['html2pdf.js', 'pdfjs-dist'],
          doc: ['mammoth']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
