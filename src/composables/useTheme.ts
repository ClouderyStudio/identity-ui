import { computed, ref, watch } from 'vue'

/**
 * 主题：与 official-site 完全同一套约定，四个前端接进来不会打架。
 *
 *   - localStorage 键固定为 `cloudery-theme`（light | dark | system）
 *   - 解析结果写在 <html> 的 `.dark` 类上（M3 令牌就按这个类切换）
 *   - 切换瞬间给 <html> 挂 `.md-theme-transition`，让所有表面交叉淡入而不是硬切
 *
 * 首屏防闪由 index.html 的内联脚本完成；这里负责后续切换与跟随系统。
 */
export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'cloudery-theme'

const mode = ref<ThemeMode>('system')
const systemDark = ref(false)
let initialized = false
let transitionTimer = 0

const isDark = computed(() =>
  mode.value === 'system' ? systemDark.value : mode.value === 'dark',
)

/** 把解析出的配色写回 <html>；切换时短暂挂上交叉淡入类。 */
function apply(animate = true): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (animate) {
    root.classList.add('md-theme-transition')
    window.clearTimeout(transitionTimer)
    transitionTimer = window.setTimeout(() => root.classList.remove('md-theme-transition'), 400)
  }

  root.classList.toggle('dark', isDark.value)
  root.style.colorScheme = isDark.value ? 'dark' : 'light'
}

/** 幂等初始化：读存储偏好、跟随系统、写首屏状态。 */
export function initTheme(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') mode.value = stored

  const query = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = query.matches
  query.addEventListener('change', (event) => {
    systemDark.value = event.matches
    apply()
  })

  apply(false)
}

export function useTheme() {
  if (typeof window !== 'undefined') initTheme()

  function setMode(next: ThemeMode): void {
    mode.value = next
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
    apply()
  }

  function setPreference(next: ThemeMode): void {
    setMode(next)
  }

  function toggle(): void {
    setMode(isDark.value ? 'light' : 'dark')
  }

  // 组件外部（例如系统偏好变化）改动 mode 时同样落到 DOM 上
  watch(mode, () => apply(), { flush: 'sync' })

  return { mode, isDark, setMode, setPreference, toggle }
}
