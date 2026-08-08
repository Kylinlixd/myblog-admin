import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

import { shouldBypassBlogProxy } from './src/config/devProxy.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [vue()],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '')
    },
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
        }
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
            'ant-design': ['ant-design-vue', '@ant-design/icons-vue'],
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
