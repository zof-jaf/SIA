import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type Role, type User } from '../services/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  hasRole: (roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provider encargado de restaurar la sesión desde la cookie httpOnly y exponer
 * las operaciones de autenticación a toda la aplicación.
 * @param props Componentes hijos de la aplicación.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    authService
      .me()
      .then((current) => {
        if (mounted) setUser(current)
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const current = await authService.login(email, password)
    setUser(current)
    return current
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const hasRole = useCallback(
    (roles: Role[]) => (user ? roles.includes(user.rol) : false),
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, login, logout, hasRole }),
    [user, loading, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook de acceso al contexto de autenticación.
 * @returns Usuario, estado de carga y acciones de sesión.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
