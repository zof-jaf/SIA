import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Save,
  Users,
} from 'lucide-react'
import Layout from '../components/Layout'
import {
  ActionRow,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorPanel,
  FormCard,
  Input,
  Label,
  Modal,
  SectionHead,
  Spinner,
  StatCard,
  cn,
} from '../components/ui'
import {
  portalService,
  type OfferingStudent,
  type ProfessorDashboardData,
} from '../services/portal'
import { gradeTone } from '../lib/format'

const NAV = [
  { label: 'Mis cursos', href: '#cursos', icon: BookOpen },
]

interface GradeDraft {
  nota: string
  observaciones: string
}

export default function ProfessorDashboard() {
  const [data, setData] = useState<ProfessorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [students, setStudents] = useState<OfferingStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    portalService
      .professorDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el panel'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const selectedOffering = useMemo(
    () => data?.offerings.find((offering) => offering.id === selectedId) ?? null,
    [data, selectedId],
  )

  const openOffering = async (offeringId: number) => {
    setSelectedId(offeringId)
    setStudents([])
    setStudentsError('')
    setNotice(null)
    setStudentsLoading(true)

    try {
      const result = await portalService.offeringStudents(offeringId)
      setStudents(result)
      setDrafts(
        Object.fromEntries(
          result.map((student) => [
            student.matriculaId,
            {
              nota: student.nota !== null ? String(student.nota) : '',
              observaciones: student.observaciones || '',
            },
          ]),
        ),
      )
    } catch (err) {
      setStudentsError(err instanceof Error ? err.message : 'No se pudieron cargar los estudiantes')
    } finally {
      setStudentsLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedId(null)
    setStudents([])
    setDrafts({})
    setNotice(null)
  }

  const updateDraft = (matriculaId: number, patch: Partial<GradeDraft>) => {
    setDrafts((current) => ({
      ...current,
      [matriculaId]: { ...current[matriculaId], ...patch },
    }))
  }

  const saveGrade = async (student: OfferingStudent) => {
    const draft = drafts[student.matriculaId]
    const nota = Number(draft?.nota)

    if (draft?.nota === '' || Number.isNaN(nota) || nota < 0 || nota > 5) {
      setNotice({ type: 'error', text: 'La nota debe estar entre 0.0 y 5.0.' })
      return
    }

    setSavingId(student.matriculaId)
    setNotice(null)

    try {
      await portalService.saveGrade(student.matriculaId, nota, draft.observaciones)
      setStudents((current) =>
        current.map((item) =>
          item.matriculaId === student.matriculaId
            ? { ...item, nota, observaciones: draft.observaciones }
            : item,
        ),
      )
      setNotice({ type: 'success', text: `Nota registrada para ${student.nombreCompleto}.` })
      portalService.professorDashboard().then(setData).catch(() => {})
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo registrar la calificación',
      })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <Layout title="Mis cursos" nav={NAV}>
        <Spinner />
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout title="Mis cursos" nav={NAV}>
        <ErrorPanel message={error || 'No se pudo cargar la información.'} onRetry={load} />
      </Layout>
    )
  }

  const { profile, period, stats, offerings } = data

  return (
    <Layout
      title="Mis cursos"
      subtitle={`${profile.especialidad || 'Docente'} · Periodo ${period?.nombre || 'actual'}`}
      nav={NAV}
    >
      <div className="space-y-6">
        <Card id="cursos">
          <SectionHead label="Cursos asignados" icon={BookOpen} />

          {offerings.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin cursos asignados"
              description="Aún no tienes ofertas académicas asignadas en el periodo activo."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerings.map((offering) => {
                const occupancy = offering.cupo > 0 ? Math.round((offering.estudiantes / offering.cupo) * 100) : 0

                return (
                  <Card
                    key={offering.id}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {offering.materia}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {offering.codigo} · Grupo {offering.grupo} · {offering.periodo}
                      </p>
                      {offering.horario && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {offering.horario}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-200 px-3 py-2 text-center dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400">Estudiantes</p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {offering.estudiantes}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 px-3 py-2 text-center dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400">Calificados</p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {offering.calificados}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => openOffering(offering.id)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Users className="h-3.5 w-3.5" /> Ver estudiantes y notas
                    </Button>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>

        <StatsRow stats={stats} />
      </div>

      <Modal
        open={selectedId !== null}
        onClose={closeModal}
        title={selectedOffering ? `${selectedOffering.materia} · ${selectedOffering.grupo}` : 'Curso'}
        subtitle={
          selectedOffering
            ? `${selectedOffering.codigo} · ${selectedOffering.periodo}`
            : undefined
        }
        wide
      >
        {studentsLoading ? (
          <Spinner label="Cargando estudiantes..." />
        ) : studentsError ? (
          <ErrorPanel message={studentsError} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin estudiantes matriculados"
            description="No hay matrículas activas registradas para este curso."
          />
        ) : (
          <>
            {notice && (
              <div
                className={cn(
                  'mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold',
                  notice.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
                )}
              >
                {notice.type === 'success' ? <ClipboardList className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {notice.text}
              </div>
            )}

            <div className="space-y-3">
              {students.map((student) => {
                const draft = drafts[student.matriculaId] || { nota: '', observaciones: '' }
                const saving = savingId === student.matriculaId

                return (
                  <Card
                    key={student.matriculaId}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {student.nombreCompleto}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {student.email} · Doc. {student.documento}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24">
                        <Label className="text-[10px]">Nota (0-5)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          value={draft.nota}
                          onChange={(event) =>
                            updateDraft(student.matriculaId, { nota: event.target.value })
                          }
                          className="text-sm"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Label className="text-[10px]">Observaciones</Label>
                        <Input
                          type="text"
                          value={draft.observaciones}
                          onChange={(event) =>
                            updateDraft(student.matriculaId, { observaciones: event.target.value })
                          }
                          placeholder="Observación opcional"
                        />
                      </div>

                      <Button
                        onClick={() => saveGrade(student)}
                        disabled={saving}
                        loading={saving}
                        variant="brand"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Guardando' : 'Guardar'}
                      </Button>
                    </div>

                    <Badge tone={gradeTone(student.nota)}>
                      {student.nota !== null ? `Nota ${student.nota.toFixed(2)}` : 'Sin nota'}
                    </Badge>
                  </Card>
                )
              })}
            </div>

            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              Cada guardado registra una nueva evaluación en el histórico del estudiante.
            </p>
          </>
        )}
      </Modal>
    </Layout>
  )
}

function StatsRow({ stats }: { stats: ProfessorDashboardData['stats'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={BookOpen}
        label="Cursos asignados"
        value={stats.courses}
        hint="Ofertas del periodo"
      />
      <StatCard
        icon={Users}
        label="Estudiantes"
        value={stats.students}
        hint="Inscripciones activas"
      />
      <StatCard
        icon={ClipboardList}
        label="Notas registradas"
        value={stats.graded}
        hint="Evaluaciones del periodo"
      />
      <StatCard
        icon={GraduationCap}
        label="Promedio general"
        value={stats.average !== null ? stats.average.toFixed(2) : '—'}
        hint="Promedio de tus cursos"
      />
    </div>
  )
}
