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
      // 特殊规则：处理/api/api/dynamics路径
      '/api/api/dynamics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('\n[特殊处理] 拦截到错误路径:', path);
          // 直接重写为/blog/dynamics
          const rewritten = '/blog/dynamics' + path.replace('/api/api/dynamics', '');
          console.log('[特殊处理] 重写为:', rewritten);
          console.log('[特殊处理] 最终请求URL:', 'http://127.0.0.1:8000' + rewritten);
          return rewritten;
        }
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 记录重写前的路径
          console.log('\n[API代理] 接收请求:', path);
          
          // 处理重复前缀的情况
          let rewritten = path;
          if (path.startsWith('/api/api/')) {
            console.log('[API代理] 检测到重复前缀，从 /api/api/ 修正为 /api/');
            rewritten = path.replace(/^\/api\/api\//, '/api/');
          } else {
            // 正常移除一个/api前缀
            rewritten = path.replace(/^\/api/, '');
          }
          
          console.log('[API代理] 重写后:', rewritten);
          console.log('[API代理] 最终请求URL:', 'http://127.0.0.1:8000' + rewritten);
          return rewritten;
        }
      },
      '/blog': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 记录重写前的路径
          console.log('\n[Blog代理] 接收请求:', path);
          let rewritten = path;
          console.log('[Blog代理] 重写后:', rewritten);
          console.log('[Blog代理] 最终请求URL:', 'http://127.0.0.1:8000' + rewritten);
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
