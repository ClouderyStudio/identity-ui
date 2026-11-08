import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '@/composables/useSession'

/**
 * 站点路由。
 *
 * 守卫规则：
 *   - 已登录访问 /login、/register、/forgot → 直接进 /account（账户面板）
 *   - 未登录访问 /account、/admin/* → 回 /login，并带上 returnUrl
 *
 * 服务条款、隐私政策、修改密码已改为对话框（components/identity），不再占用独立页面；
 * 旧地址只做重定向，避免历史书签落到空白页。
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: () => import('@/pages/RegisterPage.vue'), meta: { guestOnly: true } },
    { path: '/forgot', name: 'forgot', component: () => import('@/pages/ForgotPasswordPage.vue'), meta: { guestOnly: true } },
    // reset 不能算 guestOnly：用户可能是登录状态下收到邮件链接，仍然要能重置
    { path: '/reset', name: 'reset', component: () => import('@/pages/ResetPasswordPage.vue') },
    /**
     * 授权确认页（方案 A）：已登录用户从 /login/oauth/authorize 过来，先确认「现在是谁」。
     * 不能标 guestOnly —— 它恰恰是**已登录**用户才看得到的页面；
     * 未登录时由页面自己把用户送回登录页（并带上 returnUrl，登录完还能回来）。
     */
    { path: '/authorize', name: 'authorize', component: () => import('@/pages/AuthorizeConfirmPage.vue') },
    { path: '/account', name: 'account', component: () => import('@/pages/AccountPanelPage.vue'), meta: { requiresAuth: true } },
    // 管理员后台：requiresAuth 只保证「已登录」，是不是管理员由后端 [AdminOnly] 判定。
    // 前端刻意不做管理员判定——名单在服务端配置里，前端拿不到也不该复制一份。
    { path: '/admin/accounts', name: 'admin-accounts', component: () => import('@/pages/AdminAccountsPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/providers', name: 'admin-providers', component: () => import('@/pages/AdminProvidersPage.vue'), meta: { requiresAuth: true } },
    // 法务与改密现在是对话框：旧地址回落到入口页，不再渲染独立页面
    { path: '/terms', redirect: '/login' },
    { path: '/privacy', redirect: '/login' },
    { path: '/password', redirect: '/account' },
    // 其余地址一律回登录页，避免露出空白页
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const { ensureLoaded } = useSession()
  const current = await ensureLoaded()

  if (to.meta.requiresAuth && !current) {
    return { path: '/login', query: { returnUrl: to.fullPath } }
  }

  if (to.meta.guestOnly && current) {
    // 已登录却被送到登录页：多半是「未登录 → 登录页 → 登录完成」这条链里慢了半拍。
    // 带着 returnUrl 时必须回到那个目标，否则一次应用授权（/authorize?ticket=…）
    // 就被吞成账户面板——外部应用也就永远拿不到授权码。
    const target = typeof to.query.returnUrl === 'string' ? to.query.returnUrl : ''
    if (target.startsWith('/') && !target.startsWith('//')) {
      return { path: target }
    }
    return { path: '/account' }
  }

  return true
})
