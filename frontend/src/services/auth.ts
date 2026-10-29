import { apiRequest } from '../lib/api'

export const ROLES = ['ESTUDIANTE', 'PROFESOR', 'ADMINISTRADOR'] as const

export type Role = (typeof ROLES)[number]

const ROLE_ALIASES: Record<string, Role> = {
  ESTUDIANTE: 'ESTUDIANTE',
  ALUMNO: 'ESTUDIANTE',
  STUDENT: 'ESTUDIANTE',
  PROFESOR: 'PROFESOR',
  PROFESSOR: 'PROFESOR',
  DOCENTE: 'PROFESOR',
  TEACHER: 'PROFESOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
  ADMINISTRATOR: 'ADMINISTRADOR',
  ADMIN: 'ADMINISTRADOR',
}

export interface User {
  id: number
  nombre: string
  apellido: string
  name?: string
  email: string
  rol: Role
}

interface UserPayload extends Omit<User, 'rol'> {
  rol: string
}

interface AuthResponse {
  success: boolean
  user: UserPayload
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

/**
 * Convierte el rol recibido de la API a la representación canónica usada en el frontend.
 * Acepta variantes en mayúsculas, minúsculas y alias habituales del backend.
 * @param value Valor devuelto por la API.
 * @returns Rol canónico o `null` si no es reconocido.
 */
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null
  return ROLE_ALIASES[value.trim().toUpperCase()] ?? null
}

/**
 * Comprueba si un valor corresponde a un rol soportado por la aplicación.
 * @param value Valor a validar.
 * @returns `true` cuando el valor es un rol canónico.
 */
export function isRole(value: unknown): value is Role {
  return normalizeRole(value) !== null
}

/**
 * Obtiene la ruta inicial asociada a un rol, normalizándolo previamente.
 * @param role Rol recibido de la API o del contexto de autenticación.
 * @returns Ruta del panel o `null` cuando el rol no es válido.
 */
export function resolveRoleHome(role: unknown): string | null {
  const normalized = normalizeRole(role)
  return normalized ? roleHome[normalized] : null
}

/**
 * Normaliza la respuesta de usuario y rechaza roles desconocidos para evitar
 * redirecciones ambiguas después del login.
 * @param payload Usuario entregado por la API.
 * @returns Usuario listo para el contexto de autenticación.
 */
function parseUser(payload: UserPayload): User {
  const rol = normalizeRole(payload.rol)

  if (!rol) {
    throw new Error('El servidor devolvió un rol no reconocido. Contacta a soporte TIC.')
  }

  return {
    id: payload.id,
    nombre: payload.nombre,
    apellido: payload.apellido,
    name: payload.name,
    email: payload.email,
    rol,
  }
}

export const authService = {
  /**
   * Autentica al usuario contra la API. La sesión se mantiene mediante cookie httpOnly.
   * @param email Correo institucional.
   * @param password Contraseña.
   * @returns Usuario autenticado con su rol canónico.
   */
  login: async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    return parseUser(data.user)
  },

  /**
   * Recupera la sesión activa desde la cookie httpOnly.
   * @returns Usuario autenticado.
   */
  me: async (): Promise<User> => {
    const data = await apiRequest<AuthResponse>('/api/auth/me')
    return parseUser(data.user)
  },

  /**
   * Cierra la sesión en el backend y elimina la cookie.
   */
  logout: async (): Promise<void> => {
    await apiRequest<{ success: boolean }>('/api/auth/logout', { method: 'POST' })
  },
}
