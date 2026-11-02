import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '@/composables/useSession'

/**
 * 站点路由。
 *
 * 守卫规则（见需求）：
 *   - 已登录访问 /login、/register、/forgot、/reset → 直接进 /account（dashboard）
 *   - 未登录访问 /account、/password → 回 /login，并带上 returnUrl
 *   - 条款 / 隐私页对所有人开放
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: () => import('../pages/RegisterPage.vue'), meta: { guestOnly: true } },
    { path: '/forgot', name: 'forgot', component: () => import('../pages/ForgotPasswordPage.vue'), meta: { guestOnly: true } },
    // reset 不能算 guestOnly：用户可能是登录状态下收到邮件链接，仍然要能重置
    { path: '/reset', name: 'reset', component: () => import('../pages/ResetPasswordPage.vue') },
    { path: '/account', name: 'account', component: () => import('../pages/AccountPanelPage.vue'), meta: { requiresAuth: true } },
    { path: '/password', name: 'password', component: () => import('../pages/ChangePasswordPage.vue'), meta: { requiresAuth: true } },
    // 管理员后台：requiresAuth 只保证「已登录」，是不是管理员由后端 [AdminOnly] 判定。
    // 前端刻意不做管理员判定——名单在服务端配置里，前端拿不到也不该复制一份。
    { path: '/admin/accounts', name: 'admin-accounts', component: () => import('../pages/AdminAccountsPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/providers', name: 'admin-providers', component: () => import('../pages/AdminProvidersPage.vue'), meta: { requiresAuth: true } },
    { path: '/terms', name: 'terms', component: () => import('../pages/TermsPage.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('../pages/PrivacyPage.vue') },
    { path: '/gallery', name: 'gallery', component: () => import('./GalleryPage.vue') },
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
    return { path: '/account' }
  }

  return true
})
