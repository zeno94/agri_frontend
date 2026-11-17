export const TOKEN_KEY = 'agri_erp_token'
export const USER_KEY = 'agri_erp_user'

function readJSON(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getCurrentUser() {
  return readJSON(USER_KEY)
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function saveSession(token, user) {
  setToken(token)
  if (user) {
    setCurrentUser(user)
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return Boolean(getToken())
}
