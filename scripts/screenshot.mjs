/**
 * 视觉核对：用本机 Chromium（Edge / Chrome）通过 DevTools 协议截图到 .review/。
 *
 *   pnpm build && pnpm preview   # 先构建并起预览服务
 *   node scripts/screenshot.mjs  # 或 pnpm shots
 *
 * 选项：--url=<url> --out=<dir> --theme=light|dark|both --only=<name>
 *
 * 账户面板 / 管理后台需要登录态，脚本会在页面加载前注入一个假的 fetch，
 * 让 /identity/* 返回固定的示例数据——这样不用连后端也能核对视觉。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=')
    return [k, v]
  }),
)
const URL_BASE = args.get('url') ?? 'http://localhost:4173/'
const OUT = args.get('out') ?? '.review'
const PORT = Number(args.get('port') ?? 9337)

const BROWSERS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]
const browser = BROWSERS.find((p) => existsSync(p))
if (!browser) throw new Error('no Chromium browser found; add its path to BROWSERS')

const THEMES = args.get('theme') === 'both' ? ['light', 'dark'] : [args.get('theme') ?? 'dark']
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]
const ROUTES = [
  { name: 'login', path: 'login', auth: false },
  { name: 'register', path: 'register', auth: false },
  { name: 'forgot', path: 'forgot', auth: false },
  { name: 'reset', path: 'reset', auth: false },
  { name: 'terms', path: 'terms', auth: false },
  { name: 'authorize', path: 'authorize?ticket=shot-ticket', auth: true },
  { name: 'account', path: 'account', auth: true },
  { name: 'password', path: 'password', auth: true },
  { name: 'admin-accounts', path: 'admin/accounts', auth: true },
  { name: 'admin-providers', path: 'admin/providers', auth: true },
]
const ONLY = args.get('only')

/* 假后端：只为截图服务，返回形状与真实接口一致 */
const MOCK = `
  (() => {
    const json = (data, status = 200) =>
      Promise.resolve(new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }))
    const profile = {
      id: '3f2a91c4-77b0-4d38-9c62-1a8f0b7e5d21',
      username: 'cloudery',
      email: 'hello@cldery.com',
      avatar: null,
      role: 'admin',
      createdAt: '2024-03-18T10:24:00Z',
      lastLoginAt: '2026-11-05T09:12:00Z',
      hasLocalPassword: true,
      isAdmin: true,
      bindings: [
        { provider: 'github', providerName: 'GitHub', displayName: 'cloudery', createdAt: '2024-04-02T08:00:00Z' },
        { provider: 'qq', providerName: 'QQ', displayName: '云术', createdAt: '2025-01-11T15:30:00Z' },
      ],
    }
    const account = {
      id: '3f2a91c4-77b0-4d38-9c62-1a8f0b7e5d21',
      username: 'cloudery',
      email: 'hello@cldery.com',
      role: 'admin',
      hasPassword: true,
      passwordAlgorithm: 'pbkdf2',
      casdoorId: 'cas-1001',
      status: 'active',
      createdAt: '2024-03-18T10:24:00Z',
      lastLoginAt: '2026-11-05T09:12:00Z',
      bindingCount: 2,
    }
    const providers = [
      { id: 'p1', name: 'github', displayName: 'GitHub', kind: 'oauth2', enabled: true, icon: 'github',
        clientId: 'Iv1.abc', hasSecret: true, authorizeUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token', userInfoUrl: 'https://api.github.com/user',
        scope: 'read:user', apiUrl: null, type: null, fieldMapping: '{"id":"id","name":"login"}', bindingCount: 12 },
      { id: 'p2', name: 'qq', displayName: 'QQ', kind: 'rainbow', enabled: true, icon: 'qq',
        clientId: '1024', hasSecret: true, authorizeUrl: null, tokenUrl: null, userInfoUrl: null,
        scope: null, apiUrl: 'https://u.arsn.cn/', type: 'qq', fieldMapping: null, bindingCount: 4 },
      { id: 'p3', name: 'wechat', displayName: '微信', kind: 'rainbow', enabled: false, icon: 'wechat',
        clientId: '2048', hasSecret: false, authorizeUrl: null, tokenUrl: null, userInfoUrl: null,
        scope: null, apiUrl: 'https://u.arsn.cn/', type: 'wx', fieldMapping: null, bindingCount: 0 },
    ]
    const external = providers.map((p) => ({ name: p.name, displayName: p.displayName, icon: p.icon, kind: p.kind }))
    const signedIn = () => window.localStorage.getItem('identity-shots-auth') === '1'
    const routes = [
      [/\\/identity\\/auth\\/status/, () => json(signedIn()
        ? { success: true, isAuthenticated: true, authorizeConfirmSeconds: 5,
            user: { id: profile.id, username: profile.username, email: profile.email, avatar: null } }
        : { success: true, isAuthenticated: false, authorizeConfirmSeconds: 5 })],
      [/\\/identity\\/auth\\/authorize/, () => json({ success: true, redirectUrl: '/account' })],
      [/\\/identity\\/account\\/profile/, () => json({ success: true, user: profile })],
      [/\\/identity\\/external\\/providers/, () => json(external)],
      [/\\/identity\\/admin\\/accounts\\//, () => json({ success: true, sites: ['identity', 'sccode', 'mhop', 'lkdns'], roles: [{ site: 'identity', role: 'admin', updatedAt: '2025-06-01T00:00:00Z' }] })],
      [/\\/identity\\/admin\\/accounts/, (m) => json({ success: true, total: 3, page: 1, pageSize: 20, items: [
        account,
        { ...account, id: 'b8112730-11aa-4c1f-9c11-55de22a0c1e0', username: 'natayark', email: null, role: 'member', status: 'active', bindingCount: 1, lastLoginAt: null },
        { ...account, id: 'cc0192aa-31b7-49aa-bb02-11a0cf22e419', username: 'legacy_user', email: 'legacy@example.com', role: null, status: 'disabled', hasPassword: false, passwordAlgorithm: null, bindingCount: 0 },
      ] })],
      [/\\/identity\\/admin\\/providers/, () => json({ success: true, items: providers })],
    ]
    const original = window.fetch
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url
      for (const [pattern, handler] of routes) {
        if (pattern.test(url)) return handler(url)
      }
      return original(input, init)
    }
  })()
`

mkdirSync(OUT, { recursive: true })

const browserProcess = spawn(
  browser,
  [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + (process.env.TEMP ?? '.') + '/identity-shots',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const target = await (async () => {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json()
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page
    } catch { /* devtools not up yet */ }
    await sleep(250)
  }
  throw new Error('DevTools endpoint never became reachable on port ' + PORT)
})()

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })

let nextId = 1
const pending = new Map()
const listeners = new Set()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  } else if (msg.method) {
    for (const listener of listeners) listener(msg)
  }
}

const send = (method, params = {}) => {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
const waitFor = (method, timeout = 30000) =>
  new Promise((resolve, reject) => {
    const listener = (msg) => { if (msg.method === method) { listeners.delete(listener); resolve(msg.params) } }
    listeners.add(listener)
    setTimeout(() => { listeners.delete(listener); reject(new Error('timed out waiting for ' + method)) }, timeout)
  })
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result.value
}
const capture = async (name) => {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const path = OUT + '/' + name + '.png'
  writeFileSync(path, Buffer.from(shot.data, 'base64'))
  console.log('  ' + path)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK })

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const label = route.name + '-' + viewport.name + '-' + theme
      if (ONLY && !label.includes(ONLY)) continue
      console.log(label)
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width < 600,
      })
      // 先把主题写进 localStorage（首次导航只为拿到同源存储），再进目标路由
      await send('Page.navigate', { url: URL_BASE })
      await waitFor('Page.loadEventFired')
      await evaluate(
        "localStorage.setItem('cloudery-theme', '" + theme + "');" +
        "localStorage.setItem('identity-shots-auth', '" + (route.auth ? '1' : '0') + "')",
      )

      const loaded = waitFor('Page.loadEventFired')
      await send('Page.navigate', { url: new URL(route.path, URL_BASE).href })
      await loaded.catch(() => {})
      await sleep(1600)
      await evaluate('window.scrollTo(0, 0)')
      await capture(label)
    }
  }
}

ws.close()
browserProcess.kill()
console.log('screenshots written to ' + OUT + '/')