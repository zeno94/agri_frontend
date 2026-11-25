/**
 * 功能模块与导航。
 *
 * 登录/刷新后会从 /auth/me 取得 user.modules；旧会话没有 modules 字段时，
 * 用内置 fallback 保持可用，避免升级后空白页。
 */
import {
  Box,
  DataBoard,
  Document,
  Grid,
  Sell,
  Setting,
  ShoppingCart,
  Tickets,
  User,
  UserFilled,
  Van,
  Warning,
} from '@element-plus/icons-vue'
import { getCurrentUser } from '@/utils/auth'

export const MODULE_ICONS = {
  DataBoard,
  Box,
  ShoppingCart,
  Sell,
  Tickets,
  UserFilled,
  Van,
  Warning,
  Document,
  User,
  Setting,
  Grid,
}

export const FALLBACK_MODULES = [
  { code: 'dashboard', name: '经营报表', path: '/dashboard', icon: 'DataBoard', sort_order: 10, is_active: true, is_admin_only: true },
  { code: 'parts', name: '配件管理', path: '/parts', icon: 'Box', sort_order: 20, is_active: true, is_admin_only: false },
  { code: 'purchase', name: '采购入库', path: '/purchase', icon: 'ShoppingCart', sort_order: 30, is_active: true, is_admin_only: false },
  { code: 'sale', name: '销售出库', path: '/sale', icon: 'Sell', sort_order: 40, is_active: true, is_admin_only: false },
  { code: 'sales', name: '销售记录', path: '/sales', icon: 'Tickets', sort_order: 50, is_active: true, is_admin_only: false },
  { code: 'customers', name: '客户管理', path: '/customers', icon: 'UserFilled', sort_order: 60, is_active: true, is_admin_only: false },
  { code: 'suppliers', name: '供应商管理', path: '/suppliers', icon: 'Van', sort_order: 70, is_active: true, is_admin_only: true },
  { code: 'warning', name: '库存预警', path: '/warning', icon: 'Warning', sort_order: 80, is_active: true, is_admin_only: false },
  { code: 'audit', name: '操作日志', path: '/audit', icon: 'Document', sort_order: 90, is_active: true, is_admin_only: false },
  { code: 'users', name: '用户管理', path: '/users', icon: 'User', sort_order: 100, is_active: true, is_admin_only: true },
  { code: 'modules', name: '模块配置', path: '/modules', icon: 'Setting', sort_order: 110, is_active: true, is_admin_only: true },
]

export function isAdmin(user = getCurrentUser()) {
  return String(user?.role || '').toLowerCase() === 'boss'
}

export function moduleIcon(name) {
  return MODULE_ICONS[name] || Grid
}

export function allowedModules(user = getCurrentUser()) {
  const admin = isAdmin(user)
  const source = Array.isArray(user?.modules) ? user.modules : FALLBACK_MODULES
  return source
    .filter((module) => module && module.is_active !== false)
    .filter((module) => admin || !module.is_admin_only)
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
}

export function canAccessModule(code, user = getCurrentUser()) {
  if (!code) return true
  // 管理员绕过模块开关：停用模块只从导航隐藏，直接访问仍可用（与后端一致）。
  if (isAdmin(user)) return true
  return allowedModules(user).some((module) => module.code === code)
}

export function firstAllowedPath(user = getCurrentUser()) {
  const modules = allowedModules(user)
  return modules[0]?.path || '/no-access'
}

export function defaultHomePath(user = getCurrentUser()) {
  if (isAdmin(user) && canAccessModule('dashboard', user)) return '/dashboard'
  return firstAllowedPath(user)
}
