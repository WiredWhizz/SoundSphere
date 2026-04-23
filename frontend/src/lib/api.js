const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const AUTH_TOKEN_KEY = 'soundsphere-auth-token'

export function getAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  return response
}
