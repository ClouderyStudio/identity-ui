/**
 * 演示数据（Mock API）。
 *
 * 只在 `pnpm dev:mock` / `pnpm build:mock`（Vite 的 mock 模式）下装配，
 * 生产构建里 __MOCK__ 是 false，整个文件会被摇掉，不会进包。
 *
 * 它拦截 `/identity/*` 的请求并返回与真实后端同形状的响应，
 * 并且**带状态**：停用账号、改角色、重置口令、删除登录方式都会真的改内存数据，
 * 所以管理后台可以点着玩，不是一张静态截图。
 */

interface MockBinding {
  provider: string
  providerName: string
  displayName?: string | null
  createdAt: string
}

interface MockAccount {
  id: string
  username: string
  email: string | null
  avatar: string | null
  role: string | null
  hasPassword: boolean
  passwordAlgorithm: string | null
  casdoorId: string
  status: 'active' | 'disabled'
  createdAt: string
  lastLoginAt: string | null
  bindings: string[]
}

interface MockProvider {
  id: string
  name: string
  displayName: string
  kind: 'oauth2' | 'rainbow'
  enabled: boolean
  icon: string | null
  clientId: string | null
  hasSecret: boolean
  authorizeUrl: string | null
  tokenUrl: string | null
  userInfoUrl: string | null
  scope: string | null
  apiUrl: string | null
  type: string | null
  fieldMapping: string | null
  bindingCount: number
}

const SITES = ['identity', 'sccode', 'mhop', 'lkdns', 'mls', 'shiyu']

function iso(daysAgo: number, hour = 10): string {
  const d = new Date('2026-11-05T12:00:00+08:00')
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, (daysAgo * 7) % 60, 0, 0)
  return d.toISOString()
}

const providers: MockProvider[] = [
  {
    id: 'prov_github',
    name: 'github',
    displayName: 'GitHub',
    kind: 'oauth2',
    enabled: true,
    icon: 'github',
    clientId: 'Iv1.9f2c4a1b8d3e',
    hasSecret: true,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
    apiUrl: null,
    type: null,
    fieldMapping: '{"id":"id","name":"login","avatar":"avatar_url","email":"email"}',
    bindingCount: 18,
  },
  {
    id: 'prov_qq',
    name: 'qq',
    displayName: 'QQ',
    kind: 'rainbow',
    enabled: true,
    icon: 'qq',
    clientId: '102864731',
    hasSecret: true,
    authorizeUrl: null,
    tokenUrl: null,
    userInfoUrl: null,
    scope: null,
    apiUrl: 'https://u.arsn.cn/',
    type: 'qq',
    fieldMapping: null,
    bindingCount: 41,
  },
  {
    id: 'prov_wechat',
    name: 'wechat',
    displayName: '微信',
    kind: 'rainbow',
    enabled: true,
    icon: 'wechat',
    clientId: '204811903',
    hasSecret: true,
    authorizeUrl: null,
    tokenUrl: null,
    userInfoUrl: null,
    scope: null,
    apiUrl: 'https://u.arsn.cn/',
    type: 'wx',
    fieldMapping: null,
    bindingCount: 7,
  },
  {
    id: 'prov_bilibili',
    name: 'bilibili',
    displayName: '哔哩哔哩',
    kind: 'rainbow',
    enabled: false,
    icon: 'bilibili',
    clientId: '3381920',
    hasSecret: false,
    authorizeUrl: null,
    tokenUrl: null,
    userInfoUrl: null,
    scope: null,
    apiUrl: 'https://u.arsn.cn/',
    type: 'bili',
    fieldMapping: null,
    bindingCount: 0,
  },
  {
    id: 'prov_gitee',
    name: 'gitee',
    displayName: 'Gitee',
    kind: 'oauth2',
    enabled: false,
    icon: 'gitee',
    clientId: 'cloudery-gitee',
    hasSecret: true,
    authorizeUrl: 'https://gitee.com/oauth/authorize',
    tokenUrl: 'https://gitee.com/oauth/token',
    userInfoUrl: 'https://gitee.com/api/v5/user',
    scope: 'user_info',
    apiUrl: null,
    type: null,
    fieldMapping: '{"id":"id","name":"name","avatar":"avatar_url"}',
    bindingCount: 2,
  },
]

const rawAccounts: Array<Partial<MockAccount> & { username: string }> = [
  { username: 'cloudery', email: 'hello@cloudery.cn', role: 'admin', hasPassword: true, bindings: ['github', 'qq'], isMe: true } as never,
  { username: 'natayark', email: 'natayark@cloudery.cn', role: 'member', hasPassword: true, bindings: ['qq'] },
  { username: 'zhuxs', email: 'zhuxs@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'lkdns_admin', email: 'ops@lkdns.com', role: 'admin', hasPassword: true, bindings: ['github', 'wechat', 'qq'] },
  { username: 'shiyu', email: 'shiyu@example.com', role: 'member', hasPassword: true, bindings: ['bilibili'] },
  { username: 'legacy_casdoor', email: 'legacy@example.com', role: null, hasPassword: false, bindings: ['gitee'] },
  { username: 'qisoul', email: null, role: null, hasPassword: true, bindings: [] },
  { username: 'mhop_bot', email: 'bot@mhop.example', role: 'member', hasPassword: true, bindings: [] },
  { username: 'test_account_01', email: 'test01@example.com', role: null, hasPassword: true, bindings: ['qq'] },
  { username: 'test_account_02', email: 'test02@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'spam_1337', email: 'spam@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'april', email: 'april@example.com', role: 'member', hasPassword: true, bindings: ['github'] },
  { username: 'tilab', email: 'tilab@example.com', role: null, hasPassword: true, bindings: ['wechat'] },
  { username: 'domweb', email: 'domweb@example.com', role: null, hasPassword: false, bindings: ['qq', 'github'] },
  { username: 'guest_preview', email: null, role: null, hasPassword: true, bindings: [] },
  { username: 'deleted_edge', email: 'edge@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'kuma', email: 'kuma@example.com', role: 'member', hasPassword: true, bindings: ['qq'] },
  { username: 'sccode_ops', email: 'ops@sccode.cn', role: 'admin', hasPassword: true, bindings: ['github'] },
  { username: 'yunshu', email: 'yunshu@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'novice_0921', email: 'novice0921@example.com', role: null, hasPassword: true, bindings: [] },
  { username: 'qisoul_beta', email: null, role: null, hasPassword: false, bindings: ['bilibili'] },
  { username: 'old_mhop', email: 'old@mhop.example', role: null, hasPassword: true, bindings: [] },
  { username: 'zhuxs_alt', email: 'zhuxs+alt@example.com', role: null, hasPassword: true, bindings: [] },
]

interface SeedAccount extends Partial<MockAccount> {
  username: string
  isMe?: boolean
}

const seeds = rawAccounts as SeedAccount[]

const accounts: MockAccount[] = seeds.map((seed, index) => ({
  id: String(1000 + index * 977).padStart(8, '0') + '-7c2a-4f19-9a51-' + String(index * 31).padStart(12, '0'),
  username: seed.username,
  email: seed.email ?? null,
  avatar: seed.avatar ?? null,
  role: seed.role ?? null,
  hasPassword: seed.hasPassword ?? true,
  passwordAlgorithm: (seed.hasPassword ?? true) ? 'pbkdf2' : null,
  casdoorId: 'cas-' + (4200 + index),
  status: seed.status ?? (seed.username === 'spam_1337' || seed.username === 'deleted_edge' ? 'disabled' : 'active'),
  createdAt: iso(320 - index * 12, 9 + (index % 8)),
  lastLoginAt: index % 5 === 4 ? null : iso(index * 2 + 1, 18),
  bindings: seed.bindings ?? [],
}))

/** 每个账号的分站职权；演示时改这里的数据会真的影响界面。 */
const siteRoles: Record<string, Record<string, string>> = {
  [accounts[0]!.id]: { identity: 'admin', sccode: 'admin' },
  [accounts[3]!.id]: { lkdns: 'admin', mls: 'admin' },
  [accounts[17]!.id]: { sccode: 'admin' },
}

const ME = accounts[0]!

function toAdminAccount(account: MockAccount) {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    avatar: account.avatar,
    role: account.role,
    hasPassword: account.hasPassword,
    passwordAlgorithm: account.passwordAlgorithm,
    casdoorId: account.casdoorId,
    status: account.status,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
    bindingCount: account.bindings.length,
  }
}

function toProfile(account: MockAccount) {
  const bindings: MockBinding[] = account.bindings.map((name) => {
    const provider = providers.find((item) => item.name === name)
    return {
      provider: name,
      providerName: provider?.displayName ?? name,
      displayName: account.username,
      createdAt: account.createdAt,
    }
  })
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    avatar: account.avatar,
    role: account.role,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
    hasLocalPassword: account.hasPassword,
    bindings,
    isAdmin: Boolean(account.role === 'admin' || Object.keys(siteRoles[account.id] ?? {}).length > 0),
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fail = (detail: string, status = 400) => json({ detail }, status)

function body(init?: RequestInit): Record<string, unknown> {
  if (!init?.body || typeof init.body !== 'string') return {}
  try {
    return JSON.parse(init.body) as Record<string, unknown>
  } catch {
    return {}
  }
}

function tempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 14; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

/** 路由表：按顺序匹配，第一条命中即返回。 */
async function handle(url: URL, init: RequestInit): Promise<Response | null> {
  const path = url.pathname
  const method = (init.method ?? 'GET').toUpperCase()

  if (!path.startsWith('/identity/')) return null

  /* ---------- 公开 ---------- */
  if (path === '/identity/auth/status') {
    return json({
      success: true,
      isAuthenticated: true,
      user: { id: ME.id, username: ME.username, email: ME.email, avatar: ME.avatar },
    })
  }

  if (path === '/identity/account/profile') {
    return json({ success: true, user: toProfile(ME) })
  }

  if (path === '/identity/external/providers') {
    return json(
      providers
        .filter((provider) => provider.enabled)
        .map((provider) => ({
          name: provider.name,
          displayName: provider.displayName,
          icon: provider.icon,
          kind: provider.kind,
        })),
    )
  }

  if (path === '/identity/account/logout' || path === '/identity/auth/logout') {
    return json({ success: true })
  }

  if (path === '/identity/account/password' && method === 'POST') {
    const payload = body(init)
    if (String(payload.currentPassword ?? '').length < 4) return fail('当前密码不正确', 400)
    return json({ success: true })
  }

  if (path === '/identity/account/login' && method === 'POST') {
    return json({ success: true, user: { id: ME.id, username: ME.username, email: ME.email } })
  }

  /* ---------- 管理后台：登录方式 ---------- */
  if (path === '/identity/admin/providers') {
    if (method === 'GET') {
      return json({ success: true, items: providers.map((provider) => ({ ...provider })) })
    }
    if (method === 'POST') {
      const payload = body(init)
      const name = String(payload.name ?? '').trim()
      if (!name) return fail('标识不能为空', 400)
      if (providers.some((provider) => provider.name === name)) return fail('该标识已存在', 409)
      providers.push({
        id: 'prov_' + name,
        name,
        displayName: String(payload.displayName ?? name),
        kind: payload.kind === 'rainbow' ? 'rainbow' : 'oauth2',
        enabled: Boolean(payload.enabled),
        icon: (payload.icon as string | null) ?? null,
        clientId: (payload.clientId as string | null) ?? null,
        hasSecret: Boolean(payload.clientSecret),
        authorizeUrl: (payload.authorizeUrl as string | null) ?? null,
        tokenUrl: (payload.tokenUrl as string | null) ?? null,
        userInfoUrl: (payload.userInfoUrl as string | null) ?? null,
        scope: (payload.scope as string | null) ?? null,
        apiUrl: (payload.apiUrl as string | null) ?? null,
        type: (payload.type as string | null) ?? null,
        fieldMapping: (payload.fieldMapping as string | null) ?? null,
        bindingCount: 0,
      })
      return json({ success: true })
    }
  }

  const providerIdMatch = /^\/identity\/admin\/providers\/([^/]+)$/.exec(path)
  if (providerIdMatch) {
    const provider = providers.find((item) => item.id === providerIdMatch[1])
    if (!provider) return fail('登录方式不存在', 404)

    if (method === 'PUT') {
      const payload = body(init)
      provider.displayName = String(payload.displayName ?? provider.displayName)
      provider.kind = payload.kind === 'rainbow' ? 'rainbow' : 'oauth2'
      provider.enabled = Boolean(payload.enabled)
      provider.icon = (payload.icon as string | null) ?? null
      provider.clientId = (payload.clientId as string | null) ?? null
      if (payload.clientSecret) provider.hasSecret = true
      provider.authorizeUrl = (payload.authorizeUrl as string | null) ?? null
      provider.tokenUrl = (payload.tokenUrl as string | null) ?? null
      provider.userInfoUrl = (payload.userInfoUrl as string | null) ?? null
      provider.scope = (payload.scope as string | null) ?? null
      provider.apiUrl = (payload.apiUrl as string | null) ?? null
      provider.type = (payload.type as string | null) ?? null
      provider.fieldMapping = (payload.fieldMapping as string | null) ?? null
      return json({ success: true })
    }

    if (method === 'DELETE') {
      if (provider.bindingCount > 0) return fail('已有用户绑定，请改为停用', 409)
      providers.splice(providers.indexOf(provider), 1)
      return json({ success: true })
    }
  }

  const enabledMatch = /^\/identity\/admin\/providers\/([^/]+)\/enabled$/.exec(path)
  if (enabledMatch && method === 'POST') {
    const provider = providers.find((item) => item.id === enabledMatch[1])
    if (!provider) return fail('登录方式不存在', 404)
    provider.enabled = Boolean(body(init).enabled)
    return json({ success: true })
  }

  /* ---------- 管理后台：账号 ---------- */
  if (path === '/identity/admin/accounts') {
    if (method === 'GET') {
      const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase()
      const page = Number(url.searchParams.get('page') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20')
      const filtered = keyword
        ? accounts.filter(
            (account) =>
              account.username.toLowerCase().includes(keyword) ||
              (account.email ?? '').toLowerCase().includes(keyword) ||
              account.id.toLowerCase().includes(keyword),
          )
        : accounts
      const start = (page - 1) * pageSize
      return json({
        success: true,
        total: filtered.length,
        page,
        pageSize,
        items: filtered.slice(start, start + pageSize).map(toAdminAccount),
      })
    }

    if (method === 'POST') {
      const payload = body(init)
      const username = String(payload.username ?? '').trim()
      if (!username) return fail('用户名不能为空', 400)
      const created: MockAccount = {
        id: String(Math.floor(Math.random() * 1e8)).padStart(8, '0') + '-mock-4f19-9a51-000000000000',
        username,
        email: (payload.email as string | null) ?? null,
        avatar: null,
        role: null,
        hasPassword: true,
        passwordAlgorithm: 'pbkdf2',
        casdoorId: 'cas-mock-' + accounts.length,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        bindings: [],
      }
      accounts.unshift(created)
      return json({ success: true, id: created.id })
    }
  }

  const accountMatch = /^\/identity\/admin\/accounts\/([^/]+)$/.exec(path)
  if (accountMatch && method === 'GET') {
    const account = accounts.find((item) => item.id === accountMatch[1])
    if (!account) return fail('账号不存在', 404)
    return json({ success: true, account: toAdminAccount(account), providers: [...account.bindings] })
  }

  const roleMatch = /^\/identity\/admin\/accounts\/([^/]+)\/role$/.exec(path)
  if (roleMatch && method === 'PUT') {
    const account = accounts.find((item) => item.id === roleMatch[1])
    if (!account) return fail('账号不存在', 404)
    const next = body(init).role
    account.role = typeof next === 'string' && next ? next : null
    return json({ success: true })
  }

  const statusMatch = /^\/identity\/admin\/accounts\/([^/]+)\/status$/.exec(path)
  if (statusMatch && method === 'PUT') {
    const account = accounts.find((item) => item.id === statusMatch[1])
    if (!account) return fail('账号不存在', 404)
    if (account.id === ME.id) return fail('不能停用自己的账号', 400)
    account.status = body(init).status === 'disabled' ? 'disabled' : 'active'
    return json({ success: true })
  }

  const unbindMatch = /^\/identity\/admin\/accounts\/([^/]+)\/bindings\/([^/]+)$/.exec(path)
  if (unbindMatch && method === 'DELETE') {
    const account = accounts.find((item) => item.id === unbindMatch[1])
    if (!account) return fail('账号不存在', 404)
    const provider = decodeURIComponent(unbindMatch[2]!)
    if (account.bindings.length <= 1 && !account.hasPassword) {
      return fail('这是该账号唯一的登录方式，不能解绑', 409)
    }
    account.bindings = account.bindings.filter((name) => name !== provider)
    return json({ success: true })
  }

  const rolesMatch = /^\/identity\/admin\/accounts\/([^/]+)\/roles$/.exec(path)
  if (rolesMatch && method === 'GET') {
    const account = accounts.find((item) => item.id === rolesMatch[1])
    if (!account) return fail('账号不存在', 404)
    const current = siteRoles[account.id] ?? {}
    return json({
      success: true,
      sites: SITES,
      roles: Object.entries(current).map(([site, role]) => ({
        site,
        role,
        grantedBy: ME.username,
        updatedAt: iso(30),
      })),
    })
  }

  const siteRoleMatch = /^\/identity\/admin\/accounts\/([^/]+)\/roles\/([^/]+)$/.exec(path)
  if (siteRoleMatch && method === 'PUT') {
    const account = accounts.find((item) => item.id === siteRoleMatch[1])
    if (!account) return fail('账号不存在', 404)
    const site = decodeURIComponent(siteRoleMatch[2]!)
    const role = body(init).role
    const current = { ...(siteRoles[account.id] ?? {}) }
    if (typeof role === 'string' && role) current[site] = role
    else delete current[site]
    siteRoles[account.id] = current
    return json({ success: true })
  }

  const resetMatch = /^\/identity\/admin\/accounts\/([^/]+)\/reset-password$/.exec(path)
  if (resetMatch && method === 'POST') {
    const account = accounts.find((item) => item.id === resetMatch[1])
    if (!account) return fail('账号不存在', 404)
    account.hasPassword = true
    account.passwordAlgorithm = 'pbkdf2'
    return json({ success: true, temporaryPassword: tempPassword() })
  }

  return fail('演示数据没有实现这个接口：' + method + ' ' + path, 501)
}

/** 把 fetch 换成 mock；返回卸载函数。 */
export function installMockApi(): () => void {
  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin)
    const response = await handle(url, init ?? {})
    if (response) {
      // 模拟一点网络延迟，加载态才看得出来
      await new Promise((resolve) => setTimeout(resolve, 120))
      return response
    }
    return original(input as RequestInfo, init)
  }

  // 角落里挂一个提示，避免把演示数据当成真实数据
  const badge = document.createElement('div')
  badge.textContent = '演示数据 · Mock'
  badge.setAttribute('aria-hidden', 'true')
  Object.assign(badge.style, {
    position: 'fixed',
    insetInlineEnd: '12px',
    insetBlockEnd: '10px',
    zIndex: '9999',
    padding: '4px 10px',
    borderRadius: '9999px',
    background: 'rgba(0,0,0,.55)',
    color: '#fff',
    font: '500 11px/16px system-ui, sans-serif',
    letterSpacing: '.04em',
    pointerEvents: 'none',
    backdropFilter: 'blur(6px)',
  })
  document.body.appendChild(badge)

  return () => {
    window.fetch = original
    badge.remove()
  }
}
