import request from '@/utils/request'

export function listUsers() {
  return request.get('/users')
}

export function createUser(payload) {
  return request.post('/users', payload)
}

export function updateUser(userId, payload) {
  return request.patch(`/users/${userId}`, payload)
}

export function setUserModules(userId, moduleCodes) {
  return request.put(`/users/${userId}/modules`, { module_codes: moduleCodes })
}

export function resetUserPassword(userId, password) {
  return request.post(`/users/${userId}/reset-password`, { password })
}
