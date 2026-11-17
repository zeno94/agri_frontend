import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/AppLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '数据看板' },
      },
      {
        path: 'parts',
        name: 'Parts',
        component: () => import('@/views/PartsView.vue'),
        meta: { title: '配件管理' },
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/views/PurchaseView.vue'),
        meta: { title: '采购入库' },
      },
      {
        path: 'sale',
        name: 'Sale',
        component: () => import('@/views/SaleView.vue'),
        meta: { title: '销售出库' },
      },
      {
        path: 'warning',
        name: 'Warning',
        component: () => import('@/views/WarningView.vue'),
        meta: { title: '库存预警' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const hasToken = Boolean(getToken())
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !hasToken) {
    return {
      name: 'Login',
      query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
    }
  }

  if (to.name === 'Login' && hasToken) {
    return { name: 'Dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · 农机配件进销存 ERP`
    : '农机配件进销存 ERP'
})

export default router
