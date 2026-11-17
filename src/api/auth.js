import request from '@/utils/request'
import { unwrapData } from '@/utils/normalize'

export async function loginApi(credentials) {
  const response = await request.post('/auth/login', credentials)
  const payload = unwrapData(response)
  const body =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {}

  const token =
    (typeof payload === 'string' ? payload : '') ||
    body.token ||
    body.access_token ||
    body.accessToken ||
    response?.token

  if (!token) {
    throw new Error('登录接口未返回 Token，请检查后端响应结构')
  }

  const user = body.user || body.user_info || body.userInfo || response?.user

  return {
    token,
    user: user || { username: credentials.username },
  }
}
