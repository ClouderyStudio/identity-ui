/**
 * 后端契约的最小封装。**只依赖已存在的接口**：
 *   POST /identity/account/register   注册（P2 落地）
 *   POST /identity/account/password   改密（P2 落地，需登录）
 *   GET  /identity/auth/status        登录态
 *   GET  /identity/auth/logout        登出
 *   GET  /identity/external/providers 可用第三方平台（E4 落地）
 *   /identity/external/{provider}/challenge 第三方登录跳转（E1 落地）
 *
 * 后端错误体统一是 { detail }（AGENTS.md 硬约束），所以错误提示优先读 detail；
 * 读不到时才退回按状态码给的兜底文案。
 */

export interface ApiError {
  status: number
  detail: string
  retryAfterSeconds?: number
}

export interface CurrentUser {
  id: string
  username: string
  email?: string | null
  avatar?: string | null
}

/** 账户资料（GET /identity/account/profile，本人可见）。 */
export interface AccountBinding {
  provider: string
  providerName: string
  displayName?: string | null
  createdAt: string
}

export interface AccountProfile {
  id: string
  username: string
  email?: string | null
  avatar?: string | null
  role?: string | null
  createdAt: string
  lastLoginAt?: string | null
  hasLocalPassword: boolean
  bindings: AccountBinding[]
}

export interface ExternalProvider {
  name: string
  displayName: string
  icon?: string | null
  kind: string
}

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(BASE + path, {
      credentials: 'include', // 会话是 HttpOnly Cookie，必须带凭据
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      ...init,
    })
  } catch {
    throw { status: 0, detail: '网络异常，请检查连接后重试' } satisfies ApiError
  }

  if (response.status === 204) return undefined as T

  let body: unknown = null
  const text = await response.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const record = (body ?? {}) as Record<string, unknown>
    const detail = typeof record.detail === 'string' ? record.detail : undefined
    const retryAfter = typeof record.retryAfterSeconds === 'number' ? record.retryAfterSeconds : undefined
    throw {
      status: response.status,
      detail: detail ?? defaultDetail(response.status),
      ...(retryAfter !== undefined ? { retryAfterSeconds: retryAfter } : {}),
    } satisfies ApiError
  }

  return body as T
}

/** 与后端 ApiError.DefaultDetail 同口径的兜底文案（中文文案不在这里发明新说法）。 */
function defaultDetail(status: number): string {
  switch (status) {
    case 400: return '请求参数有误'
    case 401: return '请先登录'
    case 403: return '没有访问权限'
    case 409: return '请求与当前资源状态冲突'
    case 429: return '请求过于频繁，请稍后再试'
    default: return status >= 500 ? '服务器内部错误' : '请求失败'
  }
}

export const identityApi = {
  /** 当前登录态；未登录时返回 null（后端 /identity/auth/status 匿名可读）。 */
  async status(): Promise<CurrentUser | null> {
    const body = await request<{ success: boolean; isAuthenticated: boolean; user?: CurrentUser }>(
      '/identity/auth/status',
    )
    return body.isAuthenticated && body.user ? body.user : null
  },

  /**
   * 口令登录：服务端校验并**签发会话 Cookie**（不是拿 OIDC token）。
   * 账户面板读的是 Cookie 会话，所以面板场景必须走这条，而不是 /connect/token。
   */
  async login(payload: { account: string; password: string }): Promise<CurrentUser> {
    const body = await request<{ success: boolean; user: CurrentUser }>('/identity/account/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return body.user
  },

  /** 账户资料；未登录时后端回 401，这里转成 null。 */
  async profile(): Promise<AccountProfile | null> {
    try {
      const body = await request<{ success: boolean; user: AccountProfile }>('/identity/account/profile')
      return body.user
    } catch (error) {
      if (isApiError(error) && error.status === 401) return null
      throw error
    }
  },

  register(payload: { username: string; email: string; password: string }): Promise<unknown> {
    return request('/identity/account/register', { method: 'POST', body: JSON.stringify(payload) })
  },

  changePassword(payload: { currentPassword: string; newPassword: string }): Promise<unknown> {
    return request('/identity/account/password', { method: 'POST', body: JSON.stringify(payload) })
  },

  async logout(): Promise<void> {
    await request('/identity/auth/logout', { method: 'POST', body: JSON.stringify({}) })
  },

  async providers(): Promise<ExternalProvider[]> {
    try {
      return await request<ExternalProvider[]>('/identity/external/providers')
    } catch {
      // 第三方登录未启用时不该挡住主流程
      return []
    }
  },

  /** 第三方登录：整页跳转（浏览器要经过上游授权页）。 */
  startExternalLogin(provider: string, returnUrl: string): void {
    const target = `${BASE}/identity/external/${encodeURIComponent(provider)}/challenge?returnUrl=${encodeURIComponent(returnUrl)}`
    window.location.assign(target)
  },
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'detail' in value && 'status' in value
}