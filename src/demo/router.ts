import { createRouter, createWebHistory } from 'vue-router'

/**
 * demo 路由。库本身不依赖路由（宿主应用怎么路由是它自己的事），
 * 这里只为预览五个页面与组件总览。
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue') },
    { path: '/register', name: 'register', component: () => import('../pages/RegisterPage.vue') },
    { path: '/forgot', name: 'forgot', component: () => import('../pages/ForgotPasswordPage.vue') },
    { path: '/password', name: 'password', component: () => import('../pages/ChangePasswordPage.vue') },
    { path: '/account', name: 'account', component: () => import('../pages/AccountPanelPage.vue') },
    { path: '/gallery', name: 'gallery', component: () => import('./GalleryPage.vue') },
  ],
})
