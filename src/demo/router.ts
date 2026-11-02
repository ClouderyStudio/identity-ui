import { createRouter, createWebHistory } from 'vue-router'

/**
 * 站点路由（正式站用，demo 也复用它）。
 *
 * 路径刻意保持简短（/login、/register、/reset），因为重置链接会直接写进邮件正文，
 * 地址越短越不容易在邮件客户端里被折断。
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue') },
    { path: '/register', name: 'register', component: () => import('../pages/RegisterPage.vue') },
    { path: '/forgot', name: 'forgot', component: () => import('../pages/ForgotPasswordPage.vue') },
    { path: '/reset', name: 'reset', component: () => import('../pages/ResetPasswordPage.vue') },
    { path: '/password', name: 'password', component: () => import('../pages/ChangePasswordPage.vue') },
    { path: '/account', name: 'account', component: () => import('../pages/AccountPanelPage.vue') },
    { path: '/gallery', name: 'gallery', component: () => import('./GalleryPage.vue') },
  ],
})
