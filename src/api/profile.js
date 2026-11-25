import request from '@/utils/request'

export function getMe() {
  return request.get('/auth/me')
}
