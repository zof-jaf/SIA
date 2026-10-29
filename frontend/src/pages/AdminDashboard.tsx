import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react'
import Layout from '../components/Layout'
import { ProgramForm, SubjectForm, UserForm, type UserKind } from '../components/AdminForms'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorPanel,
  Notice,
  SectionHead,
  Spinner,
  StatCard,
  cn,
} from '../components/ui'
import {
  portalService,
  type AdminDashboardData,
  type AdminPeriod,
  type AdminUser,
  type CreateAdminInput,
  type CreateProfessorInput,
  type CreateProgramInput,
  type CreateStudentInput,
  type CreateSubjectInput,
  type Program,
  type Subject,
} from '../services/portal'
import { formatDate } from '../lib/format'

type Tab = 'resumen' | 'usuarios' | 'catalogo' | 'oferta'
type UserTab = 'estudiantes' | 'profesores'

const NAV = [
  { label: 'Resumen', href: '#resumen', icon: LayoutDashboard },
  { label: 'Usuarios', href: '#usuarios', icon: Users },
  { label: 'Catálogo', href: '#catalogo', icon: BookOpen },
  { label: 'Oferta académica', href: '#oferta', icon: CalendarRange },
]

const TAB_TITLES: Record<Tab, { title: string; subtitle: string }> = {
  resumen: { title: 'Resumen general', subtitle: 'Indicadores del sistema académico' },
  usuarios: { title: 'Gestión de usuarios', subtitle: 'Estudiantes, profesores y administradores' },
  catalogo: { title: 'Catálogo académico', subtitle: 'Programas y materias' },
  oferta: { title: 'Oferta académica', subtitle: 'Cursos abiertos y su ocupación' },
}

/**
 * Devuelve el tono visual usado para representar cada rol.
 * @param rol Nombre del rol.
 */
const roleTone = (rol: string) => {
  if (rol === 'ADMINISTRADOR') return 'brand' as const
  if (rol === 'PROFESOR') return 'warning' as const
  return 'success' as const
}

/**
 * Panel de administración. Reutiliza el layout común y concentra usuarios,
 * catálogo y oferta académica en pestañas con navegación por hash.
 */
export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [students, setStudents] = useState<AdminUser[]>([])
  const [professors, setProfessors] = useState<AdminUser[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [periods, setPeriods] = useState<AdminPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tab, setTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace('#', '') as Tab
    return ['resumen', 'usuarios', 'catalogo', 'oferta'].includes(hash) ? hash : 'resumen'
  })
  const [userTab, setUserTab] = useState<UserTab>('estudiantes')
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingUser, setCreatingUser] = useState<UserKind | null>(null)
  const [creatingProgram, setCreatingProgram] = useState(false)
  const [creatingSubject, setCreatingSubject] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    Promise.all([
      portalService.adminDashboard(),
      portalService.students(),
      portalService.professors(),
      portalService.programs(),
      portalService.subjects(),
      portalService.periods(),
    ])
      .then(([dashboard, studentList, professorList, programList, subjectList, periodList]) => {
        setData(dashboard)
        setStudents(studentList)
        setProfessors(professorList)
        setPrograms(programList)
        setSubjects(subjectList)
        setPeriods(periodList)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['resumen', 'usuarios', 'catalogo', 'oferta'].includes(hash)) setTab(hash)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const currentUsers = userTab === 'estudiantes' ? students : professors

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return currentUsers
    return currentUsers.filter((user) =>
      `${user.nombre} ${user.apellido} ${user.email} ${user.documento || ''}`
        .toLowerCase()
        .includes(term),
    )
  }, [currentUsers, query])

  const toggleStatus = async (user: AdminUser) => {
    setUpdatingId(user.usuario_id)
    setNotice(null)

    try {
      await portalService.setUserStatus(user.usuario_id, !user.activo)
      const updated = { ...user, activo: !user.activo }

      if (userTab === 'estudiantes') {
        setStudents((current) => current.map((item) => (item.usuario_id === user.usuario_id ? updated : item)))
      } else {
        setProfessors((current) => current.map((item) => (item.usuario_id === user.usuario_id ? updated : item)))
      }

      setData((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                activos: current.stats.activos + (updated.activo ? 1 : -1),
                inactivos: current.stats.inactivos + (updated.activo ? -1 : 1),
              },
            }
          : current,
      )
      setNotice({
        type: 'success',
        text: `${updated.nombre} ${updated.apellido} quedó ${updated.activo ? 'activo' : 'inactivo'}.`,
      })
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo actualizar el estado del usuario',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const createUser = async (input: CreateStudentInput | CreateProfessorInput | CreateAdminInput) => {
    setNotice(null)
    setSaving(true)

    try {
      if (creatingUser === 'estudiante') {
        await portalService.createStudent(input as CreateStudentInput)
      } else if (creatingUser === 'profesor') {
        await portalService.createProfessor(input as CreateProfessorInput)
      } else {
        await portalService.createAdmin(input as CreateAdminInput)
      }

      setCreatingUser(null)
      load()
      setNotice({ type: 'success', text: 'Usuario creado correctamente.' })
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo crear el usuario',
      })
    } finally {
      setSaving(false)
    }
  }

  const createProgram = async (input: CreateProgramInput) => {
    setNotice(null)
    setSaving(true)

    try {
      await portalService.createProgram(input)
      setCreatingProgram(false)
      load()
      setNotice({ type: 'success', text: 'Programa académico creado correctamente.' })
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo crear el programa',
      })
    } finally {
      setSaving(false)
    }
  }

  const createSubject = async (input: CreateSubjectInput) => {
    setNotice(null)
    setSaving(true)

    try {
      await portalService.createSubject(input)
      setCreatingSubject(false)
      load()
      setNotice({ type: 'success', text: 'Materia creada correctamente.' })
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo crear la materia',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Panel de administración" nav={NAV}>
        <Spinner />
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout title="Panel de administración" nav={NAV}>
        <ErrorPanel message={error || 'No se pudo cargar la información.'} onRetry={load} />
      </Layout>
    )
  }

  const heading = TAB_TITLES[tab]

  return (
    <Layout title={heading.title} subtitle={heading.subtitle} nav={NAV}>
      <div className="space-y-6">
        {notice && (
          <Notice tone={notice.type} onClose={() => setNotice(null)}>
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {notice.text}
          </Notice>
        )}

        {tab === 'resumen' && (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="brand">
                    <ShieldCheck className="h-3.5 w-3.5" /> Administrador
                  </Badge>
                  {data.period && (
                    <Badge tone="success">Periodo {data.period.nombre}</Badge>
                  )}
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Gestión integral del SIA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Administra usuarios, catálogo académico y oferta del periodo.
                </p>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Usuarios" value={data.stats.usuarios} hint={`${data.stats.activos} activos`} />
              <StatCard icon={GraduationCap} label="Estudiantes" value={data.stats.estudiantes} hint="Con perfil académico" />
              <StatCard icon={UserCheck} label="Profesores" value={data.stats.profesores} hint="Docentes registrados" />
              <StatCard icon={Building2} label="Programas" value={data.stats.programas} hint="Programas activos" />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="lg:col-span-7">
                <SectionHead label="Usuarios recientes" icon={Users} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                        <th className="pb-2 font-bold">Usuario</th>
                        <th className="pb-2 font-bold">Rol</th>
                        <th className="pb-2 font-bold">Estado</th>
                        <th className="pb-2 font-bold">Registro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.recentUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="py-2.5 pr-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{user.nombreCompleto}</p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge tone={roleTone(user.rol)}>{user.rol}</Badge>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge tone={user.activo ? 'success' : 'danger'}>
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="lg:col-span-5">
                <SectionHead label="Estudiantes por programa" icon={Building2} />
                <div className="mt-4 space-y-3">
                  {data.programs.length === 0 ? (
                    <EmptyState icon={Building2} title="Sin programas registrados" />
                  ) : (
                    data.programs.map((program) => {
                      const max = Math.max(...data.programs.map((p) => p.estudiantes), 1)
                      return (
                        <div key={program.id}>
                          <div className="flex items-center justify-between gap-2 text-xs mb-1">
                            <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                              {program.nombre}
                            </span>
                            <span className="shrink-0 font-bold text-slate-500 dark:text-slate-400">
                              {program.estudiantes}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.round((program.estudiantes / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'usuarios' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
                {(['estudiantes', 'profesores'] as UserTab[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setUserTab(option)
                      setQuery('')
                    }}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition',
                      userTab === option
                        ? 'bg-white text-brand shadow-sm ring-1 ring-brand dark:bg-slate-700 dark:text-white dark:ring-brand'
                        : 'text-slate-500 dark:text-slate-400',
                    )}
                  >
                    {option} ({option === 'estudiantes' ? students.length : professors.length})
                  </button>
                ))}
              </div>

              {creatingUser === null && (
                <Button
                  onClick={() => setCreatingUser('estudiante')}
                  variant="outline"
                  className="w-auto"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Crear estudiante
                </Button>
              )}

              {creatingUser === null && (
                <Button
                  onClick={() => setCreatingUser('profesor')}
                  variant="outline"
                  className="w-auto"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Crear profesor
                </Button>
              )}

              {creatingUser === null && (
                <Button
                  onClick={() => setCreatingUser('administrador')}
                  variant="outline"
                  className="w-auto"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Crear administrador
                </Button>
              )}

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre, correo o documento"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                />
              </div>
            </div>

            {creatingUser && (
              <UserForm
                kind={creatingUser}
                programs={programs}
                submitting={saving}
                onCancel={() => setCreatingUser(null)}
                onSubmit={createUser}
              />
            )}

            <div className="mt-4 overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Sin usuarios encontrados"
                  description="Prueba con otro término de búsqueda."
                />
              ) : (
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="pb-2 font-bold">Usuario</th>
                      <th className="pb-2 font-bold">Documento</th>
                      <th className="pb-2 font-bold">{userTab === 'estudiantes' ? 'Programa' : 'Especialidad'}</th>
                      <th className="pb-2 font-bold">Estado</th>
                      <th className="pb-2 text-right font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user) => {
                      const program = programs.find((item) => item.id === user.programa_id)

                      return (
                        <tr key={user.usuario_id}>
                          <td className="py-3 pr-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {user.nombre} {user.apellido}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </td>
                          <td className="py-3 pr-3 text-xs text-slate-500 dark:text-slate-400">
                            {user.documento || '—'}
                          </td>
                          <td className="py-3 pr-3 text-xs text-slate-600 dark:text-slate-300">
                            {userTab === 'estudiantes' ? program?.nombre || 'Sin programa' : user.especialidad || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge tone={user.activo ? 'success' : 'danger'}>
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => toggleStatus(user)}
                              disabled={updatingId === user.usuario_id}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50',
                                user.activo
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
                              )}
                            >
                              {user.activo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              {updatingId === user.usuario_id
                                ? 'Guardando...'
                                : user.activo
                                  ? 'Desactivar'
                                  : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'catalogo' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={Building2} label="Programas" value={programs.length} hint="Catálogo académico" />
              <StatCard icon={BookOpen} label="Materias" value={subjects.length} hint="Materias registradas" />
              <StatCard icon={CalendarRange} label="Periodos" value={periods.length} hint={`${periods.filter((p) => p.activo).length} activo(s)`} />
            </div>

            {creatingProgram && (
              <ProgramForm
                submitting={saving}
                onCancel={() => setCreatingProgram(false)}
                onSubmit={createProgram}
              />
            )}

            {creatingSubject && (
              <SubjectForm
                submitting={saving}
                onCancel={() => setCreatingSubject(false)}
                onSubmit={createSubject}
              />
            )}

            <Card>
              <SectionHead
                label="Programas académicos"
                icon={Building2}
                action={
                  <Button onClick={() => setCreatingProgram(true)} variant="outline">
                    <Plus className="h-3.5 w-3.5" /> Nuevo programa
                  </Button>
                }
              />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="pb-2 font-bold">Código</th>
                      <th className="pb-2 font-bold">Programa</th>
                      <th className="pb-2 font-bold">Duración</th>
                      <th className="pb-2 font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {programs.map((program) => (
                      <tr key={program.id}>
                        <td className="py-2.5 pr-3 font-mono text-xs text-slate-500 dark:text-slate-400">{program.codigo}</td>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{program.nombre}</p>
                          <p className="text-[11px] text-slate-400">{program.descripcion || 'Sin descripción'}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 dark:text-slate-400">
                          {program.duracion_semestres ? `${program.duracion_semestres} semestres` : '—'}
                        </td>
                        <td className="py-2.5">
                          <Badge tone={program.activo ? 'success' : 'danger'}>
                            {program.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <SectionHead
                  label="Materias"
                  icon={BookOpen}
                  action={
                    <Button onClick={() => setCreatingSubject(true)} variant="outline">
                      <Plus className="h-3.5 w-3.5" /> Nueva materia
                    </Button>
                  }
                />
                <div className="mt-3 space-y-2">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{subject.nombre}</p>
                        <p className="text-[11px] text-slate-400">{subject.codigo}</p>
                      </div>
                      <Badge tone="brand">{subject.creditos} créditos</Badge>
                    </div>
                  ))}
                  {subjects.length === 0 && <EmptyState icon={BookOpen} title="Sin materias registradas" />}
                </div>
              </Card>

              <Card>
                <SectionHead label="Periodos académicos" icon={CalendarRange} />
                <div className="mt-3 space-y-2">
                  {periods.map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{period.nombre}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(period.fecha_inicio)} — {formatDate(period.fecha_fin)}
                        </p>
                      </div>
                      <Badge tone={period.activo ? 'success' : 'neutral'}>
                        {period.activo ? 'Activo' : 'Cerrado'}
                      </Badge>
                    </div>
                  ))}
                  {periods.length === 0 && <EmptyState icon={CalendarRange} title="Sin periodos registrados" />}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'oferta' && (
          <Card>
            <SectionHead label="Oferta académica" icon={CalendarRange} />
            <div className="mt-3 overflow-x-auto">
              {data.offerings.length === 0 ? (
                <EmptyState icon={CalendarRange} title="Sin ofertas registradas" />
              ) : (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="pb-2 font-bold">Materia</th>
                      <th className="pb-2 font-bold">Profesor</th>
                      <th className="pb-2 font-bold">Periodo</th>
                      <th className="pb-2 font-bold">Grupo</th>
                      <th className="pb-2 font-bold">Ocupación</th>
                      <th className="pb-2 font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.offerings.map((offering) => (
                      <tr key={offering.id}>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{offering.materia}</p>
                          <p className="text-[11px] text-slate-400">{offering.codigo}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-600 dark:text-slate-300">{offering.profesor}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 dark:text-slate-400">{offering.periodo}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 dark:text-slate-400">{offering.grupo}</td>
                        <td className="py-2.5 pr-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {offering.estudiantes} / {offering.cupo}
                        </td>
                        <td className="py-2.5">
                          <Badge tone={offering.estado === 'ABIERTA' ? 'success' : 'neutral'}>
                            {offering.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
