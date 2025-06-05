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
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue']
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
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
        credentials: true,
        maxAge: 86400
      },
      proxy: {
        // 后台管理API代理规则
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
          selfHandleResponse: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.error('[代理服务器错误]', err);
              if (res && !res.writableEnded) {
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
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // 只设置必要的请求头
              proxyReq.setHeader('Host', '127.0.0.1:8000');
              
              // 保留原始请求的Content-Type
              if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
              }
              
              // 保留认证信息
              const token = req.headers.authorization;
              if (token) {
                proxyReq.setHeader('Authorization', token);
              }
              
              console.log('[请求头]', proxyReq.getHeaders());
              console.log(`[代理请求] ${req.method} ${req.url} -> http://127.0.0.1:8000${proxyReq.path}`);
              proxyReq.setSocketKeepAlive(true);
            });
            
            // 添加响应日志
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`[代理响应] ${req.method} ${req.url} - 状态: ${proxyRes.statusCode}`);
              
              // 记录响应头，帮助调试跨域问题
              console.log('[响应头]', proxyRes.headers);
              
              // 如果状态码为500，添加更多调试信息
              if (proxyRes.statusCode === 500) {
                console.error('[代理错误] 后端返回500错误，请检查后端日志');
                
                // 捕获响应内容进行分析
                let responseBody = '';
                proxyRes.on('data', function(chunk) {
                  responseBody += chunk;
                });
                
                proxyRes.on('end', function() {
                  console.log('[500错误响应内容]', responseBody);
                  
                  // 尝试转换为格式正确的响应
                  try {
                    const responseJson = JSON.parse(responseBody);
                    // 如果存在code字段并且值为200，说明内容可能正确但HTTP状态码错误
                    if (responseJson.code === 200) {
                      console.log('[响应修正] 内容正常但状态码错误，尝试修正');
                      
                      // 直接传递原始内容，忽略状态码
                      if (!res.headersSent) {
                        Object.keys(proxyRes.headers).forEach(key => {
                          res.setHeader(key, proxyRes.headers[key]);
                        });
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 200;
                        res.end(responseBody);
                        return true; // 阻止http-proxy继续处理
                      }
                    }
                  } catch (e) {
                    console.error('[响应分析] JSON解析失败', e);
                  }
                });
              }
            });
          },
          rewrite: (path) => path,
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
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.error('[博客代理错误]', err);
              if (res && !res.writableEnded) {
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
            
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              const targetUrl = `http://127.0.0.1:8000${proxyReq.path}`;
              console.log(`[博客代理请求] ${req.method} ${req.url} -> ${targetUrl}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[博客代理响应] ${req.method} ${req.url} - 状态: ${proxyRes.statusCode}`);
            });
          },
          rewrite: (path) => {
            console.log('[博客重写] 原始路径:', path);
            return path;
          },
          bypass: (req, res, options) => {
            // 如果是HTML请求，不进行代理
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
              console.log('[博客代理] 检测到HTML请求，不进行代理:', req.url);
              return req.url;
            }
            
            // 其他请求都进行代理
            console.log('[博客代理] 进行代理:', req.url);
            return null;
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