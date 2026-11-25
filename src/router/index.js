import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import {
  canAccessModule,
  defaultHomePath,
  firstAllowedPath,
} from '@/utils/modules'
import { isBoss } from '@/utils/permission'

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
        meta: { title: '经营报表', module: 'dashboard', requiresBoss: true },
      },
      {
        path: 'parts',
        name: 'Parts',
        component: () => import('@/views/PartsView.vue'),
        meta: { title: '配件管理', module: 'parts' },
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/views/PurchaseView.vue'),
        meta: { title: '采购入库', module: 'purchase' },
      },
      {
        path: 'sale',
        name: 'Sale',
        component: () => import('@/views/SaleView.vue'),
        meta: { title: '销售出库', module: 'sale' },
      },
      {
        path: 'sales',
        name: 'SalesRecords',
        component: () => import('@/views/SalesRecordsView.vue'),
        meta: { title: '销售记录', module: 'sales' },
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/CustomersView.vue'),
        meta: { title: '客户管理', module: 'customers' },
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/SuppliersView.vue'),
        meta: { title: '供应商管理', module: 'suppliers', requiresBoss: true },
      },
      {
        path: 'warning',
        name: 'Warning',
        component: () => import('@/views/WarningView.vue'),
        meta: { title: '库存预警', module: 'warning' },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/AuditView.vue'),
        meta: { title: '操作日志', module: 'audit' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UsersView.vue'),
        meta: { title: '用户管理', module: 'users', requiresBoss: true },
      },
      {
        path: 'modules',
        name: 'Modules',
        component: () => import('@/views/ModulesView.vue'),
        meta: { title: '模块配置', module: 'modules', requiresBoss: true },
      },
      {
        path: 'no-access',
        name: 'NoAccess',
        component: () => import('@/views/NoAccessView.vue'),
        meta: { title: '暂无权限' },
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
    return { path: defaultHomePath() }
  }

  if (!requiresAuth) return true

  const moduleCode = to.meta.module
  if (moduleCode && !canAccessModule(moduleCode)) {
    return { path: firstAllowedPath() }
  }

  if (to.meta.requiresBoss && !isBoss()) {
    return { path: firstAllowedPath() }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · 农机配件进销存 ERP`
    : '农机配件进销存 ERP'
})

export default router
