import request from '@/utils/request'

export function listModules() {
  return request.get('/modules')
}

export function updateModule(moduleId, payload) {
  return request.put(`/modules/${moduleId}`, payload)
}
