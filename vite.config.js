import path from 'node:path'
import fs from 'node:fs'

import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig, loadEnv } from 'vite'

import { shouldBypassBlogProxy } from './src/config/devProxy.js'

const pdfWorkerPlugin = () => ({
  name: 'serve-pdf-worker',
  configureServer(server) {
    server.middlewares.use('/assets/pdf.worker.mjs', (_request, response) => {
      response.setHeader('Content-Type', 'text/javascript')
      response.end(fs.readFileSync(path.resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs')))
    })
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'assets/pdf.worker.mjs',
      source: fs.readFileSync(path.resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs'))
    })
  }
})

// 构建标识：每次 build 生成唯一 id，注入进应用（define）并落为 dist/version.json。
// 应用运行时对比两者，不一致即说明服务器已发布新版本，提示用户刷新。
const buildId = Date.now().toString(36)

// 生成 dist/version.json（nginx 对其配置 no-cache，客户端每次都能拿到最新值）
const appVersionPlugin = () => ({
  name: 'emit-app-version',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId })
    })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [
      vue(),
      pdfWorkerPlugin(),
      appVersionPlugin(),
      Components({
        dts: false,
        resolvers: [AntDesignVueResolver({ importStyle: false })]
      })
    ],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      // __APP_BUILD_ID__ 内联进每个 chunk，作为「我是什么版本」的依据
      __APP_BUILD_ID__: JSON.stringify(buildId)
    },
    // JSON（语言包 chunk）编译为 JSON.parse("...")：解析速度远快于 JS 对象字面量求值。
    // 注意：Vite 6.4 的 json 插件里 namedExports 分支在 stringify 之前提前 return，
    // 必须同时关掉 namedExports，stringify 才会生效（本项目 key 含 "." 本就不可能命名导出）。
    json: { namedExports: false, stringify: true },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/blog': {
          target: apiTarget,
          changeOrigin: true,
          bypass(request) {
            if (shouldBypassBlogProxy(request.headers.accept)) return '/index.html'
          }
        },
        '/media': { target: apiTarget, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            network: ['axios']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]'
        }
      }
    }
  }
})
