import { createRouter, createWebHistory } from 'vue-router'
import { hasSession, getAccessToken, refreshTokens, clearSession } from '../api'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/products', name: 'products', component: () => import('../views/Products.vue') },
  { path: '/partners', name: 'partners', component: () => import('../views/Partners.vue') },
  { path: '/sales', name: 'sales', component: () => import('../views/Sales.vue') },
  { path: '/purchases', name: 'purchases', component: () => import('../views/Purchases.vue') },
  { path: '/stock', name: 'stock', component: () => import('../views/Placeholder.vue') },
  { path: '/users', name: 'users', component: () => import('../views/Users.vue') },
  { path: '/menus', name: 'menus', component: () => import('../views/Menus.vue') },
  { path: '/user-menus', name: 'user-menus', component: () => import('../views/Placeholder.vue') },
  { path: '/system-types', name: 'system-types', component: () => import('../views/Placeholder.vue') },
  { path: '/stock-movement', name: 'stock-movement', component: () => import('../views/Placeholder.vue') },
  { path: '/info-sales', name: 'info-sales', component: () => import('../views/Placeholder.vue') },
  { path: '/info-purchase', name: 'info-purchase', component: () => import('../views/Placeholder.vue') },
  { path: '/placeholder', name: 'placeholder', component: () => import('../views/Placeholder.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) {
    if (hasSession()) return '/'
    return true
  }
  if (!hasSession()) return '/login'
  if (!getAccessToken()) {
    try {
      await refreshTokens()
    } catch {
      // Hapus token yang sudah tidak valid, kalau tidak /login akan
      // menganggap masih ada sesi dan melempar balik ke / → tanpa henti.
      clearSession()
      return '/login'
    }
  }
  return true
})

export default router