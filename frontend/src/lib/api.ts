const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/**
 * Error lanzado cuando la API responde con un estado HTTP no exitoso.
 */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Ejecuta una petición JSON contra la API conservando la cookie de sesión.
 * @param path Ruta relativa de la API, por ejemplo `/api/auth/login`.
 * @param options Opciones nativas de `fetch`.
 * @returns Cuerpo de la respuesta tipado.
 * @throws {ApiError} Cuando el backend responde con un error.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (rest.body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...rest,
    headers: requestHeaders,
  })

  const rawBody = await response.text()
  let payload: Record<string, unknown> = {}

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      payload = {}
    }
  }

  if (!response.ok) {
    const data = payload.data as Record<string, unknown> | undefined
    const message =
      (payload.message as string | undefined) ||
      (payload.error as string | undefined) ||
      (data?.message as string | undefined) ||
      'Ocurrió un error inesperado'

    throw new ApiError(message, response.status)
  }

  return payload as T
}
