/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** 演示模式：由 Vite 的 mock 模式定义，生产构建里恒为 false。 */
declare const __MOCK__: boolean
