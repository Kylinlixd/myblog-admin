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
      '@ant-design/icons-vue',
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
        bypass: function(req, res, proxyOptions) {
          // 获取请求信息
          const url = req.url;
          const method = req.method;
          const acceptHeader = req.headers.accept || '';
          const isHtmlRequest = acceptHeader.includes('text/html');
          
          // 调试信息
          console.log(`[博客请求] ${method} ${url}`, isHtmlRequest ? '(HTML页面请求)' : '(API请求)');
          
          // 处理刷新页面情况 - 任何HTML请求都由Vite处理
          if (isHtmlRequest) {
            console.log('[博客页面] 检测到HTML请求，交给Vite处理:', url);
            return '/'; // 关键修改：返回根路径，让Vite的SPA路由处理
          }
          
          // 拦截一般API请求
          if (/^\/blog(\/)?$/.test(url) && method === 'GET' && !isHtmlRequest) {
            console.log('[博客API] 拦截一般API请求:', url);
            res.statusCode = 200;
            res.end('{"success":true}');
            return true;
          }
          
          // 所有其他请求正常代理
          console.log('[博客请求] 正常代理:', url);
          return false;
        },
        rewrite: (path) => {
          // 记录重写前的路径
          console.log('[博客重写] 原始路径:', path);
          
          // 统一blog路径格式
          if (path === '/blog') {
            console.log('[博客重写] 将/blog改为/blog/');
            return '/blog/';
          }
          
          // 其他路径保持不变
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
