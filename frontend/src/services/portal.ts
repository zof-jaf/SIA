import { apiRequest } from '../lib/api'

export interface Profile {
  id: number
  nombre: string
  apellido: string
  nombreCompleto: string
  email: string
  rol: 'ESTUDIANTE' | 'PROFESOR' | 'ADMINISTRADOR'
  activo: boolean
  documento: string | null
  programa: string | null
  programaCodigo: string | null
  duracionSemestres: number | null
  especialidad: string | null
  estudianteId: number | null
  profesorId: number | null
}

export interface Period {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export interface ScheduleItem {
  materia: string
  codigo: string
  profesor: string
  dia: string
  inicio: string
  fin: string
  aula: string
}

export interface StudentCourse {
  matriculaId: number
  ofertaId: number
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  grupo: string
  cupo: number
  periodo: string
  periodoActivo: boolean
  profesor: string
  estado: string
  nota: number | null
  observaciones: string | null
  horarios: { dia: string; inicio: string; fin: string; aula: string }[]
}

export interface StudentGrade {
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  periodoId: number
  periodo: string
  periodoActivo: boolean
  nota: number | null
  evaluaciones: number
  fechaRegistro: string
  observaciones: string | null
}

export interface ProgressCourse {
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  nota?: number
  semestre?: number | null
}

export interface StudentProgress {
  totalCredits: number
  approvedCredits: number
  pendingCredits: number
  percentage: number
  average: number | null
  approvedCourses: ProgressCourse[]
  pendingCourses: ProgressCourse[]
  hasCurriculum: boolean
}

export interface StudentDashboardData {
  profile: Profile
  period: Period | null
  courses: StudentCourse[]
  pendingCourses: StudentCourse[]
  schedule: ScheduleItem[]
  grades: StudentGrade[]
  history: StudentGrade[]
  progress: StudentProgress
}

export interface Tramite {
  id: number
  estudianteId: number
  documento: string
  estudiante: string
  email: string
  periodoId: number | null
  periodo: string | null
  tipoTramite: string
  estado: string
  fechaSolicitud: string
  fechaResolucion: string | null
  detalles: string | null
}

export interface CreateTramiteInput {
  estudiante_id: number
  periodo_id?: number | null
  tipo_tramite: string
  estado?: string
  detalles?: string
}

export interface ProfessorOffering {
  id: number
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  grupo: string
  cupo: number
  estado: string
  periodo: string
  periodoActivo: boolean
  estudiantes: number
  calificados: number
  promedio: number | null
  horario: string | null
  horarios: { dia: string; inicio: string; fin: string; aula: string }[]
}

export interface ProfessorDashboardData {
  profile: Profile
  period: Period | null
  stats: {
    courses: number
    students: number
    graded: number
    average: number | null
  }
  offerings: ProfessorOffering[]
}

export interface OfferingStudent {
  matriculaId: number
  estudianteId: number
  documento: string
  nombre: string
  apellido: string
  nombreCompleto: string
  email: string
  nota: number | null
  observaciones: string | null
  fechaRegistro: string | null
}

export interface AdminOffering {
  id: number
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  grupo: string
  cupo: number
  estado: string
  periodoId: number
  periodo: string
  periodoActivo: boolean
  profesorId: number | null
  profesor: string
  estudiantes: number
  calificados: number
  horario: string | null
}

export interface AdminDashboardData {
  period: Period | null
  stats: {
    usuarios: number
    estudiantes: number
    profesores: number
    administradores: number
    activos: number
    inactivos: number
    programas: number
    materias: number
    periodos: number
    ofertas: number
    matriculas: number
  }
  recentUsers: {
    id: number
    nombre: string
    apellido: string
    nombreCompleto: string
    email: string
    rol: string
    activo: boolean
    createdAt: string
  }[]
  offerings: AdminOffering[]
  programs: { id: number; codigo: string; nombre: string; estudiantes: number }[]
}

export interface AvailableOffering {
  id: number
  materiaId: number
  codigo: string
  materia: string
  creditos: number
  grupo: string
  cupo: number
  estado: string
  periodo: string
  periodoActivo: boolean
  profesor: string
  estudiantes: number
  matriculado: boolean
  horario: string | null
}

export interface AdminUser {
  estudiante_id?: number
  profesor_id?: number
  usuario_id: number
  nombre: string
  apellido: string
  email: string
  activo: boolean
  fecha_nacimiento?: string | null
  programa_id?: number | null
  documento?: string
  especialidad?: string
}

export interface Program {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  duracion_semestres: number | null
  activo: boolean
}

export interface Subject {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  creditos: number
  semestre: number | null
  activo: boolean
}

export interface AdminPeriod {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export interface CreateStudentInput {
  nombre: string
  apellido: string
  email: string
  password: string
  programa_id?: number
  documento?: string
  activo?: boolean
}

export interface CreateProfessorInput {
  nombre: string
  apellido: string
  email: string
  password: string
  especialidad?: string
  documento?: string
  activo?: boolean
}

export interface CreateAdminInput {
  nombre: string
  apellido: string
  email: string
  password: string
  cargo?: string
  activo?: boolean
}

export interface CreateProgramInput {
  nombre: string
  codigo: string
  descripcion?: string
  duracion_semestres?: number
  activo?: boolean
}

export interface CreateSubjectInput {
  nombre: string
  codigo: string
  descripcion?: string
  creditos: number
  semestre?: number
  activo?: boolean
  profesor_id?: number
  periodo_id?: number
  grupo?: string
  cupo?: number
}

export interface CreateOfferingSchedule {
  dia_semana: string
  hora_inicio: string
  hora_fin: string
  aula?: string
}

export interface CreateOfferingInput {
  materia_id: number
  profesor_id: number
  periodo_id: number
  grupo?: string
  cupo?: number
  estado?: 'ABIERTA' | 'ACTIVA' | 'CERRADA'
  horarios?: CreateOfferingSchedule[]
}

interface Envelope<T> {
  success: boolean
  data: T
}

export const portalService = {
  studentDashboard: async () => {
    const res = await apiRequest<Envelope<StudentDashboardData>>('/api/portal/student/dashboard')
    return res.data
  },

  availableOfferings: async () => {
    const res = await apiRequest<Envelope<AvailableOffering[]>>('/api/matriculas/ofertas')
    return res.data
  },

  enroll: async (ofertaId: number) => {
    const res = await apiRequest<Envelope<unknown>>('/api/matriculas', {
      method: 'POST',
      body: JSON.stringify({ oferta_materia_id: ofertaId }),
    })
    return res.data
  },

  professorDashboard: async () => {
    const res = await apiRequest<Envelope<ProfessorDashboardData>>('/api/portal/professor/dashboard')
    return res.data
  },

  offeringStudents: async (offeringId: number) => {
    const res = await apiRequest<Envelope<OfferingStudent[]>>(
      `/api/portal/professor/offerings/${offeringId}/students`,
    )
    return res.data
  },

  adminOfferingStudents: async (offeringId: number) => {
    const res = await apiRequest<Envelope<OfferingStudent[]>>(
      `/api/portal/admin/offerings/${offeringId}/students`,
    )
    return res.data
  },

  enrollStudent: async (estudianteId: number, ofertaId: number) => {
    const res = await apiRequest<Envelope<unknown>>('/api/matriculas', {
      method: 'POST',
      body: JSON.stringify({ estudiante_id: estudianteId, oferta_materia_id: ofertaId }),
    })
    return res.data
  },

  createOffering: async (data: CreateOfferingInput) => {
    const res = await apiRequest<Envelope<unknown>>('/api/academic/offerings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  adminDashboard: async () => {
    const res = await apiRequest<Envelope<AdminDashboardData>>('/api/portal/admin/dashboard')
    return res.data
  },

  listTramites: async (filters: { estado?: string; tipo_tramite?: string; estudiante_id?: number } = {}) => {
    const params = new URLSearchParams()
    if (filters.estado) params.set('estado', filters.estado)
    if (filters.tipo_tramite) params.set('tipo_tramite', filters.tipo_tramite)
    if (filters.estudiante_id) params.set('estudiante_id', String(filters.estudiante_id))
    const query = params.toString()
    const res = await apiRequest<Envelope<Tramite[]>>(`/api/tramites${query ? `?${query}` : ''}`)
    return res.data
  },

  getTramite: async (id: number) => {
    const res = await apiRequest<Envelope<Tramite>>(`/api/tramites/${id}`)
    return res.data
  },

  createTramite: async (data: CreateTramiteInput) => {
    const res = await apiRequest<Envelope<Tramite>>('/api/tramites', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  students: async () => {
    const res = await apiRequest<Envelope<AdminUser[]>>('/api/users/students')
    return res.data
  },

  professors: async () => {
    const res = await apiRequest<Envelope<AdminUser[]>>('/api/users/professors')
    return res.data
  },

  setUserStatus: async (userId: number, activo: boolean) => {
    const res = await apiRequest<Envelope<AdminUser>>(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    })
    return res.data
  },

  programs: async () => {
    const res = await apiRequest<Envelope<Program[]>>('/api/academic/programs')
    return res.data
  },

  subjects: async () => {
    const res = await apiRequest<Envelope<Subject[]>>('/api/academic/subjects')
    return res.data
  },

  periods: async () => {
    const res = await apiRequest<Envelope<AdminPeriod[]>>('/api/matriculas/periodos')
    return res.data
  },

  saveGrade: async (matriculaId: number, nota: number, observaciones: string) => {
    const res = await apiRequest<Envelope<unknown>>('/api/calificaciones', {
      method: 'POST',
      body: JSON.stringify({ matricula_id: matriculaId, nota, observaciones }),
    })
    return res.data
  },

  createStudent: async (data: {
    nombre: string
    apellido: string
    email: string
    password: string
    programa_id?: number
    documento?: string
    activo?: boolean
  }) => {
    const res = await apiRequest<Envelope<unknown>>('/api/users/students', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  createProfessor: async (data: {
    nombre: string
    apellido: string
    email: string
    password: string
    especialidad?: string
    documento?: string
    activo?: boolean
  }) => {
    const res = await apiRequest<Envelope<unknown>>('/api/users/professors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  createAdmin: async (data: {
    nombre: string
    apellido: string
    email: string
    password: string
    cargo?: string
    activo?: boolean
  }) => {
    const res = await apiRequest<Envelope<unknown>>('/api/users/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  createProgram: async (data: {
    nombre: string
    codigo: string
    descripcion?: string
    duracion_semestres?: number
    activo?: boolean
  }) => {
    const res = await apiRequest<Envelope<unknown>>('/api/academic/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  createSubject: async (data: CreateSubjectInput) => {
    const res = await apiRequest<Envelope<Subject>>('/api/academic/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },
}
