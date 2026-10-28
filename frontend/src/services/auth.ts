import { apiRequest } from '../lib/api'

export type Role = 'ESTUDIANTE' | 'PROFESOR' | 'ADMINISTRADOR'

export interface User {
  id: number
  nombre: string
  apellido: string
  name?: string
  email: string
  rol: Role
}

interface AuthResponse {
  success: boolean
  token?: string
  user: User
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return data.user
  },

  me: async (): Promise<User> => {
    const data = await apiRequest<AuthResponse>('/api/auth/me')
    return data.user
  },

  logout: async (): Promise<void> => {
    await apiRequest<{ success: boolean }>('/api/auth/logout', { method: 'POST' })
  },
}

export const roleHome: Record<Role, string> = {
  ESTUDIANTE: '/estudiante',
  PROFESOR: '/profesor',
  ADMINISTRADOR: '/admin',
}

export const roleLabel: Record<Role, string> = {
  ESTUDIANTE: 'Estudiante',
  PROFESOR: 'Profesor',
  ADMINISTRADOR: 'Administrador',
}
