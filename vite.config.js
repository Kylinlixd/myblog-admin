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
      // 优化后的代理规则
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 记录重写前的路径
          console.log('\n[API代理] 接收请求:', path);
          
          // 检测重复前缀，例如/api/api/xxx
          if (path.match(/^\/api\/api\//)) {
            console.log('[API代理] 检测到重复前缀，将/api/api/修正为/api/');
            const fixed = path.replace(/^\/api\/api\//, '/api/');
            console.log('[API代理] 修正后:', fixed);
            // 去掉第一个/api前缀
            const rewritten = fixed.replace(/^\/api/, '');
            console.log('[API代理] 最终重写为:', rewritten);
            console.log('[API代理] 最终请求URL:', 'http://127.0.0.1:8000' + rewritten);
            return rewritten;
          }
          
          // 正常移除一个/api前缀
          const rewritten = path.replace(/^\/api/, '');
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
          // 这里不进行路径重写，保持原样
          console.log('[Blog代理] 保持原始路径:', path);
          console.log('[Blog代理] 最终请求URL:', 'http://127.0.0.1:8000' + path);
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
