import { readonly, ref } from 'vue'

/**
 * 全局提示（MD3 Snackbar）。
 *
 * 用来替代 `window.alert`：alert 会阻塞整个页面、样式不可控、在移动端与无障碍上都不理想。
 * 这里是一个单实例队列：任意组件调用 `useToast().error('...')`，
 * 由挂在 App 根部的 <IdToastHost /> 统一渲染并自动消失。
 *
 * 用法：
 *   const toast = useToast()
 *   toast.error('连接第三方登录服务超时，请稍后重试')
 *   toast.success('已解绑')
 *   toast.show('提示文本', { tone: 'warning', title: '注意', timeout: 6000 })
 */
export type ToastTone = 'neutral' | 'success' | 'error' | 'warning'

export interface ToastOptions {
  tone?: ToastTone
  /** 可选的粗体标题。 */
  title?: string
  /** 毫秒；0 表示不自动消失。 */
  timeout?: number
}

export interface ToastMessage {
  id: number
  text: string
  tone: ToastTone
  title?: string
}

const current = ref<ToastMessage | null>(null)
let nextId = 1
let timer = 0

function dismiss(): void {
  window.clearTimeout(timer)
  current.value = null
}

function show(text: string, options: ToastOptions = {}): void {
  if (!text) return
  const tone = options.tone ?? 'neutral'
  // 错误默认停留更久：用户往往需要读完再决定下一步
  const timeout = options.timeout ?? (tone === 'error' ? 6000 : 4000)

  window.clearTimeout(timer)
  current.value = { id: nextId++, text, tone, ...(options.title ? { title: options.title } : {}) }
  if (timeout > 0) timer = window.setTimeout(dismiss, timeout)
}

export function useToast() {
  return {
    current: readonly(current),
    show,
    dismiss,
    success: (text: string, title?: string) => show(text, { tone: 'success', ...(title ? { title } : {}) }),
    error: (text: string, title?: string) => show(text, { tone: 'error', ...(title ? { title } : {}) }),
    warning: (text: string, title?: string) => show(text, { tone: 'warning', ...(title ? { title } : {}) }),
  }
}
