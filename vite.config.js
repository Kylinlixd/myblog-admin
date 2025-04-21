import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      'md-editor-v3',
      'vue',
      'vue-router',
      'pinia',
      'ant-design-vue',
      'axios',
      'lodash-es',
      '@vueuse/core',
      'dayjs',
      'chart.js'
    ],
    force: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    hmr: true,
    open: true,
    proxy: {
      // 后台管理API代理规则 - 修改为不移除/api前缀
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 记录请求路径
          console.log('\n[后台API] 原始请求路径:', path);
          console.log('[后台API] 不移除/api前缀，保持原样:', path);
          console.log('[后台API] 最终请求URL:', 'http://127.0.0.1:8000' + path);
          // 不移除/api前缀，直接返回原始路径
          return path;
        }
      },
      // 博客前台API代理规则
      '/blog': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 记录请求路径
          console.log('\n[博客API] 原始请求路径:', path);
          // 保持原始路径不变
          console.log('[博客API] 最终请求URL:', 'http://127.0.0.1:8000' + path);
          return path;
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design-vue': ['ant-design-vue'],
          'vue': ['vue', 'vue-router', 'pinia'],
          'utils': ['axios', 'dayjs']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
