import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { clearSession, getToken } from '@/utils/auth'

const service = axios.create({
  // 同源反代：生产由 Nginx 把 /api/ 转发到后端；需要直连时用 VITE_API_BASE_URL 覆盖
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

function isSuccessCode(code) {
  if (code === null || code === undefined) return true
  // 业务响应里的 code 可能是“模块编码”等普通字符串（如 parts），
  // 只有数字状态码才按成功/失败判断，避免把正常模块数据当失败。
  if (typeof code !== 'number' && !(typeof code === 'string' && /^\d+$/.test(code))) {
    return true
  }
  const numericCode = Number(code)
  return numericCode === 0 || (numericCode >= 200 && numericCode < 300)
}

function getPayloadMessage(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') {
    return payload.length > 200 ? '' : payload
  }

  const detail = payload.detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === 'string'
          ? item
          : item?.msg || item?.message || item?.loc?.at(-1),
      )
      .filter(Boolean)
      .join('；')
  }

  return (
    payload.message ||
    payload.msg ||
    payload.detail ||
    payload.error ||
    payload.errors?.message ||
    ''
  )
}

const statusText = {
  400: '请求参数有误，请检查后重试',
  401: '登录状态已失效，请重新登录',
  403: '当前账号没有操作权限',
  404: '请求的资源不存在',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  422: '提交的数据格式不正确',
  429: '操作过于频繁，请稍后再试',
  500: '服务器开小差了，请稍后重试',
  502: '网关异常，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
  504: '网关超时，请稍后重试',
}

export function getErrorMessage(error, fallback = '操作失败，请稍后重试') {
  if (!error) return fallback
  return (
    getPayloadMessage(error.response?.data) ||
    error.message ||
    fallback
  )
}

function isLoginRequest(config) {
  return String(config?.url || '').includes('/auth/login')
}

function showError(message) {
  ElMessage.error({
    message: message || '操作失败，请稍后重试',
    grouping: true,
    duration: 3200,
  })
}

function redirectToLogin() {
  clearSession()
  const currentRoute = router.currentRoute.value

  if (currentRoute.name === 'Login') return

  router
    .replace({
      name: 'Login',
      query:
        currentRoute.fullPath && currentRoute.fullPath !== '/'
          ? { redirect: currentRoute.fullPath }
          : {},
    })
    .catch(() => {})
}

function handleUnauthorized(message, config) {
  if (isLoginRequest(config)) {
    clearSession()
    showError(message || '账号或密码错误')
    return
  }

  redirectToLogin()
  ElMessage.error({
    message: message || '登录状态已失效，请重新登录',
    grouping: true,
    duration: 3200,
  })
}

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    // 登录接口不携带旧 Token，避免过期凭证干扰身份校验。
    if (token && !isLoginRequest(config)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const body = response.data

    // 后端可能以 HTTP 200 + 业务 code 的形式返回失败。
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, 'code')
    ) {
      if (!isSuccessCode(body.code)) {
        const message = getPayloadMessage(body) || '操作失败，请稍后重试'
        const error = new Error(message)
        error.code = body.code
        error.config = response.config
        error.response = response
        error.isBusinessError = true
        error.isAuthError = Number(body.code) === 401

        if (error.isAuthError) {
          handleUnauthorized(message, response.config)
        } else if (!response.config?.skipErrorMessage) {
          showError(message)
        }

        return Promise.reject(error)
      }
    }

    return body
  },
  (error) => {
    const config = error.config || {}
    const status = error.response?.status
    const messageFromServer = getPayloadMessage(error.response?.data)
    let message = messageFromServer || statusText[status] || ''

    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = '请求超时，请检查网络后重试'
      } else if (error.code === 'ERR_CANCELED') {
        message = ''
      } else if (!error.response) {
        message = '无法连接后端服务，请确认服务已启动'
      } else {
        message = '网络异常，请稍后重试'
      }
    }

    error.isAuthError = status === 401

    if (status === 401) {
      handleUnauthorized(messageFromServer, config)
    } else if (!config.skipErrorMessage && message) {
      showError(message)
    }

    if (message) {
      error.message = message
    }

    return Promise.reject(error)
  },
)

export default service
