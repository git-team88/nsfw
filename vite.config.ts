import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    // 打包时去除 index.html 中的 HTML 注释（仅 build 生效，不影响 dev）
    {
      name: 'strip-html-comments',
      apply: 'build',
      transformIndexHtml(html: string) {
        return html.replace(/<!--[\s\S]*?-->/g, '');
      },
    },
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
        // SEO T17：element-plus 已改按需（只有日期组件用），mammoth/cfb 只在发布小说页用，
        // 都不再手动分包，让它们跟着各自的页面懒加载；之前 doc 包被入口 modulepreload 了 95KB。
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vue-i18n', 'pinia'],
          utils: ['axios', 'dayjs', 'bignumber.js', 'uuid']
        }
      }
    },
    chunkSizeWarningLimit: 1500
  },
})
