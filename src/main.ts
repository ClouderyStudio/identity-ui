import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { initTheme } from '@/composables/useTheme'
import { vRipple } from '@/directives/ripple'
import { vReveal } from '@/directives/reveal'
import '@/styles/index.css'

// 首屏前套上用存储的配色（index.html 的内联脚本已经先做过一次，这里负责跟随系统）
initTheme()

// 演示模式：装上内存里的假后端。生产构建里 __MOCK__ 为 false，这段会被摇掉。
async function bootstrap() {
  if (__MOCK__) {
    const { installMockApi } = await import('./api/mock')
    installMockApi()
  }

  createApp(App)
    .directive('ripple', vRipple)
    .directive('reveal', vReveal)
    .use(router)
    .mount('#app')
}

void bootstrap()
