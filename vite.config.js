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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [
      vue(),
      pdfWorkerPlugin(),
      Components({
        dts: false,
        resolvers: [AntDesignVueResolver({ importStyle: false })]
      })
    ],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '')
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
