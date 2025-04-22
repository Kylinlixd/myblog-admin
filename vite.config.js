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
        bypass: (req, res, proxyOptions) => {
          // 如果是对 /blog/ 的 GET 请求，直接返回 200 状态码，不发送到后端
          if (req.url === '/blog/' && req.method === 'GET') {
            console.log('[博客API] 拦截对根路径的请求:', req.url);
            return true; // 返回 true 表示绕过代理
          }
          
          // 其他请求正常代理
          console.log('[博客API] 正常代理请求:', req.url);
          return false;
        },
        rewrite: (path) => {
          // 记录请求路径
          console.log('\n[博客API] 原始请求路径:', path);
          
          // 如果路径是/blog，重写为/blog/
          if (path === '/blog') {
            console.log('[博客API] 将/blog重写为/blog/');
            return '/blog/';
          }
          
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
