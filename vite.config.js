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
      cors: true,
      proxy: {
        // 后台管理API代理规则
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
          // 增加代理超时设置
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.error('[代理服务器错误]', err);
              // 确保响应对象存在并且可写入
              if (res.writableEnded === false) {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify({
                  code: 500,
                  message: '代理请求失败，请检查后端服务是否正常运行',
                  error: err.message
                }));
              }
            });
            // 增加超时设置
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // 完整记录目标请求URL
              const targetUrl = `http://127.0.0.1:8000${proxyReq.path}`;
              console.log(`[代理请求] ${req.method} ${req.url} -> ${targetUrl}`);
              proxyReq.setSocketKeepAlive(true);
            });
          },
          rewrite: (path) => {
            // 记录请求路径
            console.log('\n[后台API] 原始请求路径:', path);
            
            // 修复重复的/api前缀问题 - 确保只保留一个/api前缀
            let rewrittenPath = path;
            
            // 如果是重复的 /api/api 路径，替换为单个 /api
            if (path.startsWith('/api/api/')) {
              rewrittenPath = path.replace('/api/api/', '/api/');
            }
            
            console.log('[后台API] 重写后路径:', rewrittenPath);
            const finalUrl = `http://127.0.0.1:8000${rewrittenPath}`;
            console.log('[后台API] 最终请求URL:', finalUrl);
            return rewrittenPath;
          },
          // 添加错误处理
          onError: (err, req, res) => {
            console.error('[代理错误]', err);
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({
                code: 500,
                message: '代理请求失败，请检查后端服务是否正常运行',
                error: err.message
              }));
            }
          },
          // 自定义请求头
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Proxy-By': 'Vite'
          }
        },
        // 博客前台API代理规则
        '/blog': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
          // 增加代理超时和日志设置
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.error('[博客代理错误]', err);
              // 确保响应对象存在并且可写入
              if (res.writableEnded === false) {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify({
                  code: 500,
                  message: '博客API代理请求失败，请检查后端服务是否正常运行',
                  error: err.message
                }));
              }
            });
            
            // 记录完整的博客API请求
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const targetUrl = `http://127.0.0.1:8000${proxyReq.path}`;
              console.log(`[博客代理请求] ${req.method} ${req.url} -> ${targetUrl}`);
              proxyReq.setSocketKeepAlive(true);
            });
          },
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
            
            // 所有其他请求正常代理
            console.log('[博客请求] 正常代理:', url);
            return false;
          },
          rewrite: (path) => {
            // 记录重写前的路径
            console.log('[博客重写] 原始路径:', path);
            const finalUrl = `http://127.0.0.1:8000${path}`;
            console.log('[博客重写] 最终请求URL:', finalUrl);
            return path;
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Proxy-By': 'Vite'
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