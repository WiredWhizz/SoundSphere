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

const AuthContext = createContext(null)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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
    setStatus('loading')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        setSavedState(null)
        setStatus('signed_out')
        return
      }

      const payload = await response.json()
      applyAuthPayload(payload)
    } catch {
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
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Authentication failed.')
      }

      applyAuthPayload(payload)
    } catch (error) {
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
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)

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
