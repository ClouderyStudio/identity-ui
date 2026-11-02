import { computed, onMounted, ref, watch } from 'vue'

export type ThemeMode = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'cloudery-identity-theme'

/** 系统偏好（SSR 安全：window 不存在时当作深色）。 */
function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 主题：深色 / 浅色 / 跟随系统，写 localStorage。
 *
 * 只切根元素的 `data-theme`，所有颜色都由 tokens.css 的语义变量提供，
 * 组件里不出现任何硬编码颜色 —— 这样新增主题不需要改组件。
 */
export function useTheme() {
  const mode = ref<ThemeMode>('dark')
  const resolved = ref<'dark' | 'light'>('dark')

  const apply = (next: ThemeMode) => {
    resolved.value = next === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : next
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved.value)
    }
  }

  const setMode = (next: ThemeMode) => {
    mode.value = next
    apply(next)
    if (typeof window !== 'undefined') {
      if (next === 'system') window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, next)
    }
  }

  const toggle = () => setMode(resolved.value === 'dark' ? 'light' : 'dark')

  onMounted(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    setMode(stored === 'light' || stored === 'dark' ? stored : 'system')

    // 跟随系统时要响应系统切换
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (mode.value === 'system') apply('system')
    }
    media.addEventListener('change', onChange)
    watch(mode, () => apply(mode.value))
  })

  return {
    mode,
    resolved,
    isDark: computed(() => resolved.value === 'dark'),
    setMode,
    toggle,
  }
}
