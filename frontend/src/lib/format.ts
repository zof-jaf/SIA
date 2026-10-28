import type { ScheduleItem } from '../services/portal'

export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime12(time: string) {
  const [hourRaw, minutes] = time.split(':').map(Number)
  const suffix = hourRaw >= 12 ? 'p. m.' : 'a. m.'
  const hour = hourRaw % 12 === 0 ? 12 : hourRaw % 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function getNextClass(schedule: ScheduleItem[]) {
  if (schedule.length === 0) return null

  const now = new Date()
  const today = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const ranked = schedule
    .map((item) => {
      const dayIndex = DAY_INDEX[item.dia?.toLowerCase?.() || ''] ?? 0
      let offset = (dayIndex - today + 7) % 7
      const start = timeToMinutes(item.inicio)
      const end = timeToMinutes(item.fin)

      if (offset === 0 && end <= nowMinutes) offset = 7

      return { item, offset, start, isToday: offset === 0, inProgress: offset === 0 && start <= nowMinutes }
    })
    .sort((a, b) => (a.offset === b.offset ? a.start - b.start : a.offset - b.offset))

  return ranked[0] ?? null
}

export function gradeTone(nota: number | null) {
  if (nota === null) return 'neutral' as const
  if (nota >= 4.5) return 'success' as const
  if (nota >= 3) return 'brand' as const
  return 'danger' as const
}
