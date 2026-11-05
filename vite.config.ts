import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'

// 两种产物：
//   dev / build      —— 站点本体（index.html）：登录 / 注册 / 账户面板 / 管理后台 / 法务页
//   build --mode lib —— 可复用库（ESM），四个前端按需 import，样式单独导出
//
// 设计系统与 official-site 保持一致：Material Design 3 官方令牌 + 自研 M3 组件库，
// 图标由 unplugin-icons 在构建期编译成内联 SVG（Material Symbols + Simple Icons）。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 后端地址：开发时把 /identity 代理过去（默认本机 ClouderyApi）
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5171'

  const isLib = mode === 'lib'
  // 演示模式：装上 src/api/mock.ts 里的假后端，后端没起也能点着玩
  const isMock = mode === 'mock'

  return {
    plugins: [
      vue(),
      // Material Symbols + Simple Icons，编译成按需引用的内联 SVG 组件
      Icons({ compiler: 'vue3', scale: 1, defaultClass: 'md-icon-svg' }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: { __MOCK__: JSON.stringify(isMock) },
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
            // 样式出口名；下面 assetFileNames 再把它固定到 dist 根目录
            cssFileName: 'identity-ui',
          },
          rollupOptions: {
            external: ['vue', 'vue-router'],
            output: {
              // 样式固定落在 dist/identity-ui.css（package.json 的 ./style.css 指向它），
              // 字体等其余静态资源走 assets/
              assetFileNames: (asset) =>
                asset.names?.some((name) => name.endsWith('.css')) || asset.name?.endsWith('.css')
                  ? 'identity-ui.css'
                  : 'assets/[name]-[hash][extname]',
            },
          },
          // 库里没有 <img> 引用，不把 public/ 的示例背景图一起发出去
          copyPublicDir: false,
          /*
           * 库产物输出到 dist-lib/，**不能**和站点产物共用 dist/。
           * 两者共用会互相 emptyOutDir：先 pnpm build 再 pnpm build:lib，站点就被删没了；
           * 反过来则库文件被删。分开之后谁也不会踩到谁。
           */
          outDir: 'dist-lib',
          emptyOutDir: true,
        }
      : { outDir: isMock ? 'dist-mock' : 'dist', emptyOutDir: true },
  }
})