import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { minify } from 'terser'

let outDirAbs = ''

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
    // 打包时去掉 index.html 内联 <script> 里的 // 和 /* */ 注释（只删注释和空白，代码不变；仅 build 生效）。
    // 跳过带 src 的、JSON-LD、module、importmap
    {
      name: 'strip-inline-script-comments',
      apply: 'build',
      async transformIndexHtml(html: string) {
        const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
        let out = '';
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(html))) {
          const attrs = m[1] || '';
          const code = m[2];
          let tag = m[0];
          if (code.trim() && !/\bsrc\s*=/i.test(attrs) && !/type\s*=\s*["']?(application\/ld\+json|module|importmap)/i.test(attrs)) {
            const r = await minify(code, { compress: false, mangle: false, format: { comments: false } });
            if (r.code) tag = `<script${attrs}>${r.code}</script>`;
          }
          out += html.slice(last, m.index) + tag;
          last = re.lastIndex;
        }
        return out + html.slice(last);
      },
    },
    // public/maidian-sdk.js 原样复制不压缩，打包完再用 terser 压一遍：去注释、缩体积（源文件不动；仅 build 生效）
    {
      name: 'minify-maidian-sdk',
      apply: 'build',
      configResolved(config) {
        outDirAbs = resolve(config.root, config.build.outDir);
      },
      async closeBundle() {
        const f = resolve(outDirAbs, 'maidian-sdk.js');
        if (!existsSync(f)) return;
        const r = await minify(readFileSync(f, 'utf8'), { compress: true, mangle: true, format: { comments: false } });
        if (r.code) writeFileSync(f, r.code);
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
