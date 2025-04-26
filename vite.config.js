import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  
  return {
    base: '/',
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
        // 后台管理API代理规则 - 仅保留一个/api前缀
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // 记录请求路径
            console.log('\n[后台API] 原始请求路径:', path);
            // 修改：移除重复的/api前缀
            const rewrittenPath = path.replace(/^\/api\/api\//, '/api/');
            console.log('[后台API] 重写后路径:', rewrittenPath);
            console.log('[后台API] 最终请求URL:', 'http://127.0.0.1:8000' + rewrittenPath);
            // 返回处理后的路径
            return rewrittenPath;
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
              return '/'; // 使用根路径，确保强制刷新时能正确加载
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
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 启用源码映射以便调试
      sourcemap: !isProd,
      // 分块策略
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 拆分chunks，优化加载
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'ant-design': ['ant-design-vue', '@ant-design/icons-vue'],
            'ui-utils': ['@vueuse/core', 'lodash-es'],
            'network': ['axios']
          },
          // 自定义chunk文件名
          chunkFileNames: isProd 
            ? 'assets/js/[name]-[hash].js' 
            : 'assets/js/[name].js',
          // 自定义入口文件名
          entryFileNames: isProd 
            ? 'assets/js/[name]-[hash].js' 
            : 'assets/js/[name].js',
          // 自定义资产文件名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            let extType = info[info.length - 1]
            if (/\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/.test(assetInfo.name)) {
              extType = 'img'
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/.test(assetInfo.name)) {
              extType = 'fonts'
            }
            return `assets/${extType}/[name]-[hash][extname]`
          }
        }
      }
    }
  }
}) 