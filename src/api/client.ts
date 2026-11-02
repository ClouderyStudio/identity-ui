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
  /** 是否管理员：由后端按 Authorization:Admins 名单判定，前端**不要**用 role 自行推断。 */
  isAdmin: boolean
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

  /** 发送邮箱验证码（注册 / 找回共用）。purpose: register | reset */
  sendEmailCode(payload: { email: string; purpose?: 'register' | 'reset' }): Promise<unknown> {
    return request('/identity/account/email-code', { method: 'POST', body: JSON.stringify(payload) })
  },

  /** 申请重置口令：无论邮箱是否存在都返回同一句受理提示。 */
  forgotPassword(email: string): Promise<unknown> {
    return request('/identity/account/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  },

  /** 用邮件里的令牌重置口令。 */
  resetPassword(payload: { token: string; newPassword: string }): Promise<unknown> {
    return request('/identity/account/reset-password', { method: 'POST', body: JSON.stringify(payload) })
  },

  /** 登出：清服务端会话（与 /identity/auth/logout 等价，走身份中心自己的端点）。 */
  async signOut(): Promise<void> {
    await request('/identity/account/logout', { method: 'POST', body: JSON.stringify({}) })
  },

  /** 注册；claimKey 来自第三方回调（未绑定身份的认领票据），带上后会自动绑定并直接建立会话。 */
  register(payload: { username: string; email: string; code: string; password: string; claimKey?: string }): Promise<unknown> {
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


/** 管理员后台：账号列表项（GET /identity/admin/accounts）。 */
export interface AdminAccount {
  id: string
  username: string
  email?: string | null
  avatar?: string | null
  role?: string | null
  hasPassword: boolean
  /** null = 没有口令；pbkdf2 / bcrypt / unknown 只是形状标签，**不是**哈希本体。 */
  passwordAlgorithm?: string | null
  casdoorId: string
  createdAt: string
  lastLoginAt?: string | null
  bindingCount: number
}

export interface AdminAccountPage {
  total: number
  page: number
  pageSize: number
  items: AdminAccount[]
}

export interface AdminAccountDetail {
  account: AdminAccount
  providers: string[]
}

/** 管理员后台：登录方式（密钥只回 hasSecret 布尔，永远不回密钥本体）。 */
export interface AdminProvider {
  id: string
  name: string
  displayName: string
  kind: 'oauth2' | 'rainbow'
  enabled: boolean
  icon?: string | null
  clientId?: string | null
  hasSecret: boolean
  authorizeUrl?: string | null
  tokenUrl?: string | null
  userInfoUrl?: string | null
  scope?: string | null
  apiUrl?: string | null
  type?: string | null
  fieldMapping?: string | null
  bindingCount: number
}

/** 新建 / 修改登录方式的请求体；clientSecret 留空表示保留原密钥。 */
export interface AdminProviderInput {
  name?: string
  displayName: string
  kind: string
  enabled: boolean
  icon?: string | null
  clientId?: string | null
  clientSecret?: string | null
  authorizeUrl?: string | null
  tokenUrl?: string | null
  userInfoUrl?: string | null
  scope?: string | null
  apiUrl?: string | null
  type?: string | null
  fieldMapping?: string | null
}

/** 管理员后台接口。全部走 /identity/admin/*，由 [AdminOnly] 校验管理员名单。 */
export const identityAdminApi = {
  async accounts(keyword: string, page: number, pageSize: number): Promise<AdminAccountPage> {
    const query = new URLSearchParams({
      ...(keyword ? { keyword } : {}),
      page: String(page),
      pageSize: String(pageSize),
    })
    const body = await request<{ success: boolean; total: number; page: number; pageSize: number; items: AdminAccount[] }>(
      '/identity/admin/accounts?' + query.toString(),
    )
    return { total: body.total, page: body.page, pageSize: body.pageSize, items: body.items }
  },

  async account(id: string): Promise<AdminAccountDetail> {
    const body = await request<{ success: boolean; account: AdminAccount; providers: string[] }>(
      '/identity/admin/accounts/' + encodeURIComponent(id),
    )
    return { account: body.account, providers: body.providers }
  },

  setRole(id: string, role: string | null): Promise<unknown> {
    return request('/identity/admin/accounts/' + encodeURIComponent(id) + '/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  },

  /** 重置口令：返回的临时口令只出现这一次，页面必须提示管理员立刻转告用户。 */
  async resetPassword(id: string): Promise<string> {
    const body = await request<{ success: boolean; temporaryPassword: string }>(
      '/identity/admin/accounts/' + encodeURIComponent(id) + '/reset-password',
      { method: 'POST', body: JSON.stringify({}) },
    )
    return body.temporaryPassword
  },

  async providers(): Promise<AdminProvider[]> {
    const body = await request<{ success: boolean; items: AdminProvider[] }>('/identity/admin/providers')
    return body.items
  },

  createProvider(input: AdminProviderInput): Promise<unknown> {
    return request('/identity/admin/providers', { method: 'POST', body: JSON.stringify(input) })
  },

  updateProvider(id: string, input: AdminProviderInput): Promise<unknown> {
    return request('/identity/admin/providers/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  deleteProvider(id: string): Promise<unknown> {
    return request('/identity/admin/providers/' + encodeURIComponent(id), { method: 'DELETE' })
  },

  setProviderEnabled(id: string, enabled: boolean): Promise<unknown> {
    return request('/identity/admin/providers/' + encodeURIComponent(id) + '/enabled', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    })
  },
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'detail' in value && 'status' in value
}