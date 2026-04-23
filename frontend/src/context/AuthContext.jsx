/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [savedState, setSavedState] = useState(null)
  const [status, setStatus] = useState('loading')
  const [authError, setAuthError] = useState('')

  const applyAuthPayload = useCallback((payload) => {
    setUser(payload.user)
    setSavedState(payload.state ?? null)
    setStatus('authenticated')
  }, [])

  const refreshSession = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setSavedState(null)
      setStatus('signed_out')
      return
    }

    setStatus('loading')

    try {
      const response = await apiFetch('/api/auth/me')

      if (!response.ok) {
        clearAuthToken()
        setUser(null)
        setSavedState(null)
        setStatus('signed_out')
        return
      }

      const payload = await response.json()
      applyAuthPayload(payload)
    } catch {
      clearAuthToken()
      setUser(null)
      setSavedState(null)
      setStatus('signed_out')
    }
  }, [applyAuthPayload])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const authenticate = useCallback(async (path, body) => {
    setStatus('loading')
    setAuthError('')

    try {
      const response = await apiFetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Authentication failed.')
      }

      if (payload?.token) {
        setAuthToken(payload.token)
      }

      applyAuthPayload(payload)
    } catch (error) {
      clearAuthToken()
      setAuthError(error.message || 'Authentication failed.')
      setStatus('signed_out')
    }
  }, [applyAuthPayload])

  const signup = useCallback(async ({ email, name, password }) => {
    await authenticate('/api/auth/signup', { email, name, password })
  }, [authenticate])

  const login = useCallback(async ({ email, password }) => {
    await authenticate('/api/auth/login', { email, password })
  }, [authenticate])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    }).catch(() => null)

    clearAuthToken()
    setUser(null)
    setSavedState(null)
    setStatus('signed_out')
  }, [])

  const consumeSavedState = useCallback(() => {
    const snapshot = savedState
    setSavedState(null)
    return snapshot
  }, [savedState])

  const value = useMemo(() => ({
    authError,
    consumeSavedState,
    login,
    logout,
    refreshSession,
    signup,
    status,
    user,
  }), [authError, consumeSavedState, login, logout, refreshSession, signup, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
