import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 两种产物：
//   dev / build      —— demo 应用（index.html），用来预览全部组件与页面状态
//   build --mode lib —— 可复用库（ESM），四个前端按需 import，样式单独导出
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 后端地址：开发时把 /identity 代理过去（默认本机 ClouderyApi）
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5171'

  const isLib = mode === 'lib'

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: isLib ? {} : { __DEMO__: 'true' },
    server: {
      port: 5176,
      proxy: {
        '/identity': { target: proxyTarget, changeOrigin: true },
        '/connect': { target: proxyTarget, changeOrigin: true },
      },
    },
    build: isLib
      ? {
          lib: {
            entry: fileURLToPath(new URL('./src/lib.ts', import.meta.url)),
            name: 'ClouderyIdentityUi',
            fileName: 'identity-ui',
            formats: ['es'],
          },
          rollupOptions: {
            external: ['vue', 'vue-router'],
            output: { assetFileNames: 'identity-ui.[ext]' },
          },
        }
      : { outDir: 'dist' },
  }
})
