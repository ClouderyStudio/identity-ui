import { ref } from 'vue'
import { identityApi, type CurrentUser } from '@/api/client'

/**
 * 会话状态：整站共享一份。
 *
 * 后端用 HttpOnly Cookie 保存会话，前端只需要知道「登录没登录、是谁」，
 * 所以这里只是一层内存缓存 + 刷新入口，不存任何凭据。
 */
const user = ref<CurrentUser | null>(null)
const loaded = ref(false)

export function useSession() {
  /** 重新从后端拉一次登录态。 */
  async function refresh(): Promise<CurrentUser | null> {
    try {
      user.value = await identityApi.status()
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
    return user.value
  }

  /** 确保至少拉过一次（路由守卫用）。 */
  async function ensureLoaded(): Promise<CurrentUser | null> {
    if (!loaded.value) await refresh()
    return user.value
  }

  /** 登录成功后写入（避免再多一次往返）。 */
  function set(next: CurrentUser | null) {
    user.value = next
    loaded.value = true
  }

  function clear() {
    user.value = null
    loaded.value = true
  }

  return { user, loaded, refresh, ensureLoaded, set, clear }
}
