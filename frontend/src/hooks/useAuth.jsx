import { useState, useEffect, createContext, useContext } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) setUser(null)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authService.login(email, password)
      localStorage.setItem('access_token', data.token)
      const me = await authService.me()
      localStorage.setItem('user', JSON.stringify(me.data))
      setUser(me.data)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.response?.data?.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (data) => {
    setLoading(true)
    try {
      const res = await authService.register(data)
      const { token, user } = res.data

      // Auto-login after successful registration
      const loginRes = await login(data.email, data.password)
      if (!loginRes.ok) throw new Error(loginRes.error)
      return { ok: true}
    } catch (e) {
      return { ok: false, error: e.response?.data?.message  || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
