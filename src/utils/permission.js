/**
 * 角色与模块权限判断。
 *
 * 后端 user.role: boss=管理员 / employee=普通用户。
 * user.modules 由后端按管理员分配返回；这里只做导航与路由显隐，
 * 真正的接口权限仍以后端 403 为准。
 */
import { getCurrentUser } from '@/utils/auth'
import {
  allowedModules,
  canAccessModule,
  defaultHomePath as moduleDefaultHomePath,
  isAdmin,
} from '@/utils/modules'

export function getUserRole() {
  const user = getCurrentUser()
  const raw = user?.role?.name || user?.role || ''
  return String(raw).trim().toLowerCase()
}

export function isBoss() {
  return isAdmin(getCurrentUser())
}

export function roleLabel() {
  return isBoss() ? '管理员' : '普通用户'
}

export function defaultHomePath() {
  return moduleDefaultHomePath(getCurrentUser())
}

export function canManageMasterData() {
  return isBoss()
}

export function canManageSuppliers() {
  return isBoss()
}

export function hasModule(code) {
  return canAccessModule(code, getCurrentUser())
}

export function navModules() {
  return allowedModules(getCurrentUser())
}

/** 路由是否允许当前用户访问（按 route.meta.module） */
export function canAccessPath(path, moduleCode) {
  if (moduleCode) return canAccessModule(moduleCode, getCurrentUser())
  if (String(path).startsWith('/dashboard')) return canAccessModule('dashboard')
  return true
}
