import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Plus,
  User,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Layout from '../components/Layout'
import {
  Badge,
  Button,
  Card,
  Donut,
  EmptyState,
  ErrorPanel,
  Modal,
  Notice,
  Spinner,
  StatCard,
  cn,
} from '../components/ui'
import { portalService, type AvailableOffering, type StudentDashboardData } from '../services/portal'
import { formatDate, formatTime12, getNextClass, gradeTone, timeToMinutes } from '../lib/format'

type ModalName = 'schedule' | 'progress' | 'finance' | 'procedures' | null

const NAV = [
  { label: 'Inicio', href: '#inicio', icon: LayoutDashboard },
  { label: 'Matrícula', href: '#matricula', icon: Plus },
  { label: 'Mi horario', href: '#horario', icon: CalendarDays },
  { label: 'Mis materias', href: '#materias', icon: BookOpen },
  { label: 'Notas', href: '#notas', icon: Award },
  { label: 'Historial', href: '#historial', icon: FileText },
  { label: 'Progreso', href: '#progreso', icon: GraduationCap },
]

const DAY_ORDER: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
  domingo: 0,
}

/**
 * Panel del estudiante: resume matrículas, horario, calificaciones e historial
 * consumiendo el portal académico del backend.
 */
export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<ModalName>(null)
  const [hasDebt, setHasDebt] = useState(false)
  const [hasProcedure, setHasProcedure] = useState(true)
  const [offerings, setOfferings] = useState<AvailableOffering[]>([])
  const [offeringsLoading, setOfferingsLoading] = useState(true)
  const [offeringsError, setOfferingsError] = useState('')
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    portalService
      .studentDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel'))
      .finally(() => setLoading(false))
  }, [])

  const loadOfferings = useCallback(() => {
    setOfferingsLoading(true)
    setOfferingsError('')

    portalService
      .availableOfferings()
      .then(setOfferings)
      .catch((err) =>
        setOfferingsError(err instanceof Error ? err.message : 'No se pudo cargar la oferta académica'),
      )
      .finally(() => setOfferingsLoading(false))
  }, [])

  useEffect(() => {
    load()
    loadOfferings()
  }, [load, loadOfferings])

  /**
   * Registra la matrícula del estudiante en una oferta y refresca el panel.
   * @param offering Oferta seleccionada.
   */
  const enroll = async (offering: AvailableOffering) => {
    setEnrollingId(offering.id)
    setNotice(null)

    try {
      await portalService.enroll(offering.id)
      setNotice({ tone: 'success', text: `Matrícula registrada en ${offering.materia}.` })
      await Promise.all([
        portalService.studentDashboard().then(setData),
        portalService.availableOfferings().then(setOfferings),
      ])
    } catch (err) {
      setNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'No se pudo registrar la matrícula',
      })
    } finally {
      setEnrollingId(null)
    }
  }

  if (loading) {
    return (
      <Layout title="Panel del estudiante" nav={NAV}>
        <Spinner />
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout title="Panel del estudiante" nav={NAV}>
        <ErrorPanel message={error || 'No se pudo cargar la información.'} onRetry={load} />
      </Layout>
    )
  }

  const { profile, period, courses, schedule, grades, progress } = data
  const nextClass = getNextClass(schedule)
  const sortedSchedule = [...schedule].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dia?.toLowerCase()] ?? 9) - (DAY_ORDER[b.dia?.toLowerCase()] ?? 9)
    return dayDiff !== 0 ? dayDiff : timeToMinutes(a.inicio) - timeToMinutes(b.inicio)
  })
  const scoreLabel = progress.hasCurriculum
    ? `${progress.percentage}%`
    : `${progress.approvedCredits}`
  const scoreCaption = progress.hasCurriculum ? 'Avance' : 'Créditos'

  return (
    <Layout
      title="Panel del estudiante"
      subtitle={`${profile.programa || 'Programa no asignado'} · Código ${profile.documento || 'sin registrar'}`}
      nav={NAV}
    >
      <div className="animate-fade-up space-y-5">
        <Card id="inicio" className="relative overflow-hidden border-brand/20 bg-gradient-to-br from-white via-white to-sky-50 dark:border-brand/20 dark:from-[#181b20] dark:via-[#181b20] dark:to-[#13232d]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {profile.programa || 'Programa no asignado'}
                </Badge>
                {period && <Badge tone="success">Periodo {period.nombre}</Badge>}
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                Hola, {profile.nombre}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Este es el resumen de tu actividad académica. {profile.programaCodigo ? `Programa ${profile.programaCodigo} · ` : ''}
                {profile.duracionSemestres ? `${profile.duracionSemestres} semestres` : 'Duración no registrada'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setHasDebt((current) => !current)}
                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              >
                Simular: {hasDebt ? 'Al día' : 'Con deuda'}
              </button>
              <button
                onClick={() => setHasProcedure((current) => !current)}
                className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
              >
                Simular: {hasProcedure ? 'Sin trámites' : '1 trámite'}
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Materias"
            value={courses.length}
            hint={courses.length === 0 ? 'Sin matrículas activas' : 'Matriculadas'}
          />
          <StatCard
            icon={Award}
            label="Promedio"
            value={progress.average !== null ? progress.average.toFixed(2) : '—'}
            hint={grades.length ? 'Acumulado del periodo' : 'Aún sin calificaciones'}
            tone="success"
          />
          <StatCard
            icon={GraduationCap}
            label="Créditos"
            value={progress.approvedCredits}
            hint={progress.hasCurriculum ? `Aprobados de ${progress.totalCredits}` : 'Malla no registrada'}
            tone="brand"
          />
          <StatCard
            icon={ClipboardList}
            label="Financiero"
            value={hasDebt ? '$185.000' : '$0'}
            hint={hasDebt ? 'Cuota pendiente (demo)' : 'Al día (demo)'}
            tone={hasDebt ? 'warning' : 'success'}
          />
        </div>

        <Card id="matricula">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={ClipboardList} label="Matrícula académica" />
            <Badge tone="neutral">{offerings.filter((offering) => !offering.matriculado).length} ofertas disponibles</Badge>
          </div>

          {notice && (
            <div className="mt-4">
              <Notice tone={notice.tone} onClose={() => setNotice(null)}>
                {notice.tone === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {notice.text}
              </Notice>
            </div>
          )}

          {offeringsLoading ? (
            <div className="mt-4">
              <Spinner label="Cargando oferta académica..." />
            </div>
          ) : offeringsError ? (
            <div className="mt-4">
              <ErrorPanel message={offeringsError} onRetry={loadOfferings} />
            </div>
          ) : offerings.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={BookOpen}
                title="Sin ofertas disponibles"
                description="No hay materias abiertas para matrícula en el periodo activo."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="pb-2 font-bold">Materia</th>
                    <th className="pb-2 font-bold">Profesor</th>
                    <th className="pb-2 font-bold">Horario</th>
                    <th className="pb-2 font-bold">Cupos</th>
                    <th className="pb-2 text-right font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {offerings.map((offering) => {
                    const full = offering.cupo > 0 && offering.estudiantes >= offering.cupo

                    return (
                      <tr key={offering.id}>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900 dark:text-white">{offering.materia}</p>
                          <p className="text-xs text-slate-400">
                            {offering.codigo} · Grupo {offering.grupo} · {offering.creditos} créditos
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{offering.profesor}</td>
                        <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                          {offering.horario || 'Sin horario'}
                        </td>
                        <td className="py-3 pr-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {offering.estudiantes} / {offering.cupo}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            onClick={() => enroll(offering)}
                            disabled={offering.matriculado || full || enrollingId === offering.id}
                            loading={enrollingId === offering.id}
                            variant={offering.matriculado ? 'ghost' : 'brand'}
                            className="ml-auto"
                          >
                            {offering.matriculado ? 'Matriculado' : full ? 'Sin cupo' : 'Matricularme'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-12">
          <Card id="horario" className="lg:col-span-5">
            <SectionTitle icon={CalendarClock} label="Siguiente clase asignada" />
            {nextClass ? (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {nextClass.item.materia}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {nextClass.item.codigo} · {nextClass.item.profesor}
                    </p>
                  </div>
                  <Badge tone={nextClass.inProgress ? 'success' : 'brand'}>
                    {nextClass.inProgress ? 'En curso' : nextClass.isToday ? 'Hoy' : nextClass.item.dia}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <InfoLine icon={Clock} label="Hora" value={`${formatTime12(nextClass.item.inicio)} - ${formatTime12(nextClass.item.fin)}`} />
                  <InfoLine icon={MapPin} label="Salón" value={nextClass.item.aula || 'Sin aula'} />
                  <InfoLine icon={User} label="Docente" value={nextClass.item.profesor} />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={CalendarClock}
                  title="Sin clases programadas"
                  description="Aún no hay horarios registrados para tus materias del periodo activo."
                />
              </div>
            )}

            <button
              onClick={() => setModal('schedule')}
              className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand dark:border-slate-800"
            >
              Ver horario completo
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>

          <Card id="progreso" className="lg:col-span-7">
            <div className="flex items-start justify-between gap-3">
              <SectionTitle icon={TrendingUp} label="Avance académico" />
              <Badge tone={progress.hasCurriculum ? 'brand' : 'warning'}>
                {progress.hasCurriculum ? 'Plan de estudios' : 'Malla no registrada'}
              </Badge>
            </div>

            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
              <Donut percentage={progress.percentage} label={scoreLabel} caption={scoreCaption} />

              <div className="w-full flex-1 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    Aprobado
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {progress.approvedCredits} créditos
                    {progress.hasCurriculum ? ` (${progress.percentage}%)` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    Pendiente
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {progress.hasCurriculum ? `${progress.pendingCredits} créditos` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Promedio
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {progress.average !== null ? progress.average.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {!progress.hasCurriculum && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                La malla curricular del programa no está registrada. El avance se muestra con los créditos aprobados.
              </p>
            )}

            <button
              onClick={() => setModal('progress')}
              className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand dark:border-slate-800"
            >
              Ver materias aprobadas y pendientes
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <SectionTitle icon={Wallet} label="Estado financiero" />
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Saldo pendiente actual
              </p>
              <p className={cn('mt-1 text-3xl font-extrabold', hasDebt ? 'text-amber-500' : 'text-emerald-500')}>
                {hasDebt ? '$185.000 COP' : '$0 COP'}
              </p>
              <p className={cn('mt-1 flex items-center gap-1.5 text-xs font-semibold', hasDebt ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                {hasDebt ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {hasDebt ? 'Cuota 4 pendiente' : 'Al día · sin saldo pendiente'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Periodo {period?.nombre || 'actual'} · Datos demostrativos (módulo financiero no conectado).
              </p>
            </div>
            <button
              onClick={() => setModal('finance')}
              className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand dark:border-slate-800"
            >
              Ver detalle
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>

          <Card className="flex flex-col">
            <SectionTitle icon={Award} label="Procesos académicos" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Evaluación docente</h3>
            <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">
              Ingresa a la plataforma oficial para evaluar a tus profesores del periodo.
            </p>
            <a
              href="https://evaluaciondocente.ucaldas.edu.co"
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand dark:border-slate-800"
            >
              Acceder a la evaluación
              <ExternalLink className="h-4 w-4" />
            </a>
          </Card>

          <Card>
            <SectionTitle icon={FileText} label="Ventanilla académica" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Gestión de trámites</h3>
            <div
              className={cn(
                'mt-3 rounded-xl px-3 py-2.5 text-xs font-semibold',
                hasProcedure
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
              )}
            >
              {hasProcedure ? 'Tienes 1 trámite en curso (Certificado oficial)' : 'No tienes trámites pendientes'}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Radicación de certificados y constancias · Datos demostrativos.
            </p>
            <button
              onClick={() => setModal('procedures')}
              className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand dark:border-slate-800"
            >
              Ingresar a trámites
              <ChevronRight className="h-4 w-4" />
            </button>
          </Card>
        </div>

        <Card id="materias">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={BookOpen} label="Mis materias" />
            <Badge tone="neutral">{courses.length} matrículas</Badge>
          </div>

          {courses.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={BookOpen}
                title="Sin materias matriculadas"
                description="Cuando tengas matrículas activas aparecerán aquí con su docente y horario."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="pb-2 font-bold">Materia</th>
                    <th className="pb-2 font-bold">Docente</th>
                    <th className="pb-2 font-bold">Horario</th>
                    <th className="pb-2 font-bold">Créditos</th>
                    <th className="pb-2 font-bold">Nota</th>
                    <th className="pb-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courses.map((course) => (
                    <tr key={`${course.ofertaId}-${course.matriculaId}`}>
                      <td className="py-3 pr-4">
                        <p className="font-bold text-slate-900 dark:text-white">{course.materia}</p>
                        <p className="text-xs text-slate-400">
                          {course.codigo} · Grupo {course.grupo}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{course.profesor}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                        {course.horarios.length === 0 ? (
                          <span className="text-slate-400">Sin horario</span>
                        ) : (
                          course.horarios.map((h) => (
                            <span key={`${h.dia}-${h.inicio}`} className="block">
                              {h.dia} {formatTime12(h.inicio)} - {formatTime12(h.fin)} · {h.aula || 'Sin aula'}
                            </span>
                          ))
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-200">{course.creditos}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={gradeTone(course.nota)}>
                          {course.nota !== null ? course.nota.toFixed(2) : 'Sin nota'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge tone={course.estado === 'ACTIVA' ? 'success' : 'neutral'}>{course.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card id="notas">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={Award} label="Calificaciones" />
            <Badge tone={progress.average !== null && progress.average >= 3 ? 'success' : 'neutral'}>
              Promedio {progress.average !== null ? progress.average.toFixed(2) : '—'}
            </Badge>
          </div>

          {grades.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Award}
                title="Aún no tienes calificaciones"
                description="Las notas registradas por tus profesores aparecerán en esta sección."
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {grades.map((grade) => (
                <div
                  key={grade.materiaId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{grade.materia}</p>
                    <p className="text-xs text-slate-400">
                      {grade.codigo} · {grade.creditos} créditos · {grade.evaluaciones} evaluación(es)
                      {grade.fechaRegistro ? ` · ${formatDate(grade.fechaRegistro)}` : ''}
                    </p>
                  </div>
                  <Badge tone={gradeTone(grade.nota)} className="shrink-0 text-sm">
                    {grade.nota !== null ? grade.nota.toFixed(2) : '—'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card id="historial">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={FileText} label="Historial académico" />
            <Badge tone="neutral">{grades.length} materias con registro</Badge>
          </div>

          {grades.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FileText}
                title="Sin historial de calificaciones"
                description="El historial se construye con cada evaluación registrada por tus profesores."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="pb-2 font-bold">Materia</th>
                    <th className="pb-2 font-bold">Créditos</th>
                    <th className="pb-2 font-bold">Evaluaciones</th>
                    <th className="pb-2 font-bold">Último registro</th>
                    <th className="pb-2 font-bold">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {grades.map((grade) => (
                    <tr key={`history-${grade.materiaId}`}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{grade.materia}</p>
                        <p className="text-xs text-slate-400">{grade.codigo}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{grade.creditos}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{grade.evaluaciones}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(grade.fechaRegistro)}
                      </td>
                      <td className="py-3">
                        <Badge tone={gradeTone(grade.nota)}>
                          {grade.nota !== null ? grade.nota.toFixed(2) : 'Sin nota'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={modal === 'schedule'}
        onClose={() => setModal(null)}
        title="Horario semanal"
        subtitle={period ? `Periodo académico ${period.nombre}` : 'Periodo actual'}
        wide
      >
        {sortedSchedule.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin horario registrado"
            description="La universidad aún no ha registrado horarios para tus materias."
          />
        ) : (
          <div className="space-y-2">
            {sortedSchedule.map((item, index) => (
              <div
                key={`${item.codigo}-${item.dia}-${item.inicio}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.materia}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.profesor} · {item.aula || 'Sin aula'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone="brand">{item.dia}</Badge>
                  <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {formatTime12(item.inicio)} - {formatTime12(item.fin)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={modal === 'progress'}
        onClose={() => setModal(null)}
        title="Plan de estudios"
        subtitle={progress.hasCurriculum ? `${progress.totalCredits} créditos en total` : 'Malla curricular no registrada'}
        wide
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Aprobadas ({progress.approvedCourses.length})
            </h3>
            {progress.approvedCourses.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                Aún no tienes materias aprobadas.
              </p>
            ) : (
              <ul className="space-y-2">
                {progress.approvedCourses.map((course) => (
                  <li
                    key={course.materiaId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs dark:border-emerald-500/20 dark:bg-emerald-500/5"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{course.materia}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{course.nota?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" /> Pendientes ({progress.pendingCourses.length})
            </h3>
            {progress.pendingCourses.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                {progress.hasCurriculum ? '¡Has aprobado todas las materias del plan!' : 'Registra la malla curricular para ver las materias pendientes.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {progress.pendingCourses.map((course) => (
                  <li
                    key={course.materiaId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-800"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{course.materia}</span>
                    <span className="text-slate-400">{course.creditos} cr.</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'finance'}
        onClose={() => setModal(null)}
        title="Estado financiero"
        subtitle={`Periodo ${period?.nombre || 'actual'}`}
      >
        <div
          className={cn(
            'rounded-xl border px-4 py-5',
            hasDebt
              ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
          )}
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {hasDebt ? 'Tienes un saldo pendiente de $185.000 COP (Cuota 4).' : 'Estás al día con todos tus pagos.'}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Este módulo es demostrativo. El backend actual no cuenta con tablas de pagos o recibos.
          </p>
        </div>
      </Modal>

      <Modal
        open={modal === 'procedures'}
        onClose={() => setModal(null)}
        title="Trámites radicados"
        subtitle="Ventanilla académica"
      >
        {hasProcedure ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Certificado de calificaciones oficial</p>
                <p className="text-xs text-slate-400">Radicado: 2026-TR-0492</p>
              </div>
              <Badge tone="warning">En curso</Badge>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              Dato demostrativo. El backend no cuenta con un módulo de trámites.
            </p>
          </div>
        ) : (
          <EmptyState icon={FileText} title="No tienes trámites pendientes" />
        )}
      </Modal>
    </Layout>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand">{label}</span>
    </div>
  )
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="text-xs text-slate-400">{label}:</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

