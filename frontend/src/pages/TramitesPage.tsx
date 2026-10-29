import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
} from 'lucide-react'
import Layout from '../components/Layout'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorPanel,
  Input,
  Label,
  Modal,
  Notice,
  Select,
  Spinner,
  StatCard,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { roleHome } from '../services/auth'
import {
  portalService,
  type AdminPeriod,
  type AdminUser,
  type Tramite,
} from '../services/portal'
import { formatDate } from '../lib/format'

const ESTADOS = ['Pendiente', 'En proceso', 'Aprobado', 'Rechazado', 'Cancelado']

const TIPOS = [
  'Certificado de calificaciones',
  'Certificado de estudios',
  'Constancia de matrícula',
  'Cancelación de materia',
  'Homologación de materias',
  'Otro',
]

/**
 * Devuelve el tono visual asociado al estado de un trámite.
 * @param estado Estado actual del trámite.
 * @returns Tono compatible con el componente `Badge`.
 */
const statusTone = (estado: string) => {
  if (estado === 'Aprobado') return 'success' as const
  if (estado === 'Rechazado') return 'danger' as const
  if (estado === 'En proceso') return 'brand' as const
  if (estado === 'Cancelado') return 'neutral' as const
  return 'warning' as const
}

/**
 * Indica si un trámite todavía requiere gestión administrativa.
 * @param estado Estado actual del trámite.
 * @returns `true` cuando está pendiente o en proceso.
 */
const isPending = (estado: string) => estado === 'Pendiente' || estado === 'En proceso'

/**
 * Página dedicada a la consulta y radicación de trámites académicos.
 * Los estudiantes solo ven sus radicados y los administradores pueden crearlos.
 */
export default function TramitesPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'ADMINISTRADOR'

  const [tramites, setTramites] = useState<Tramite[]>([])
  const [students, setStudents] = useState<AdminUser[]>([])
  const [periods, setPeriods] = useState<AdminPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Tramite | null>(null)
  const [form, setForm] = useState({
    estudiante_id: '',
    periodo_id: '',
    tipo_tramite: '',
    estado: 'Pendiente',
    detalles: '',
  })

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    const requests: Promise<unknown>[] = [portalService.listTramites()]

    if (isAdmin) {
      requests.push(portalService.students(), portalService.periods())
    }

    Promise.all(requests)
      .then(([tramiteList, studentList, periodList]) => {
        setTramites(tramiteList as Tramite[])
        if (isAdmin) {
          setStudents(studentList as AdminUser[])
          setPeriods(periodList as AdminPeriod[])
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los trámites'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  useEffect(load, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return tramites
    return tramites.filter((tramite) =>
      `${tramite.estudiante} ${tramite.tipoTramite} ${tramite.estado} ${tramite.documento}`
        .toLowerCase()
        .includes(term),
    )
  }, [tramites, query])

  const pending = tramites.filter((tramite) => isPending(tramite.estado)).length
  const resolved = tramites.filter(
    (tramite) => tramite.estado === 'Aprobado' || tramite.estado === 'Rechazado',
  ).length

  const nav = user
    ? [
        { label: 'Panel', href: roleHome[user.rol], icon: LayoutDashboard },
        { label: 'Trámites', href: '/tramites', icon: FileText },
      ]
    : []

  const openCreate = () => {
    setNotice(null)
    setForm({
      estudiante_id: '',
      periodo_id: '',
      tipo_tramite: '',
      estado: 'Pendiente',
      detalles: '',
    })
    setCreateOpen(true)
  }

  const createTramite = async (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)

    if (!form.estudiante_id || !form.tipo_tramite) {
      setNotice({ tone: 'error', text: 'Selecciona el estudiante y escribe el tipo de trámite.' })
      return
    }

    setSaving(true)

    try {
      const created = await portalService.createTramite({
        estudiante_id: Number(form.estudiante_id),
        periodo_id: form.periodo_id ? Number(form.periodo_id) : null,
        tipo_tramite: form.tipo_tramite,
        estado: form.estado,
        detalles: form.detalles,
      })
      setTramites((current) => [created, ...current])
      setCreateOpen(false)
      setNotice({ tone: 'success', text: `Trámite #${created.id} radicado correctamente.` })
    } catch (err) {
      setNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'No se pudo radicar el trámite',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Trámites" nav={nav}>
        <Spinner label="Cargando trámites..." />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Trámites" nav={nav}>
        <ErrorPanel message={error} onRetry={load} />
      </Layout>
    )
  }

  return (
    <Layout
      title={isAdmin ? 'Gestión de trámites' : 'Mis trámites'}
      subtitle={
        isAdmin
          ? 'Radica y consulta las solicitudes académicas de los estudiantes'
          : 'Consulta el estado y las observaciones de tus solicitudes'
      }
      nav={nav}
    >
      <div className="space-y-5">
        {notice && (
          <Notice tone={notice.tone} onClose={() => setNotice(null)}>
            {notice.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {notice.text}
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ClipboardList} label="Total" value={tramites.length} hint="Radicados visibles" />
          <StatCard
            icon={FileText}
            label="En curso"
            value={pending}
            hint="Pendientes o en proceso"
            tone="warning"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resueltos"
            value={resolved}
            hint="Aprobados o rechazados"
            tone="success"
          />
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isAdmin ? 'Radicados registrados' : 'Tus radicados'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Crea un trámite para cualquier estudiante y consulta su estado.'
                  : 'Solo se muestran las solicitudes asociadas a tu perfil.'}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={openCreate} variant="brand">
                <Plus className="h-3.5 w-3.5" /> Nuevo trámite
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por estudiante, tipo o estado"
                className="pl-9"
              />
            </div>
            <Badge tone="neutral">{filtered.length} resultado(s)</Badge>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FileText}
                title="Sin trámites registrados"
                description={
                  isAdmin
                    ? 'Radica el primer trámite con el botón “Nuevo trámite”.'
                    : 'Cuando la administración radique una solicitud aparecerá aquí.'
                }
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-bold">Radicado</th>
                    {isAdmin && <th className="px-4 py-2 font-bold">Estudiante</th>}
                    <th className="px-4 py-2 font-bold">Tipo</th>
                    <th className="px-4 py-2 font-bold">Periodo</th>
                    <th className="px-4 py-2 font-bold">Solicitud</th>
                    <th className="px-4 py-2 font-bold">Estado</th>
                    <th className="px-4 py-2 text-right font-bold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((tramite) => (
                    <tr key={tramite.id}>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">#{tramite.id}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {tramite.estudiante}
                          </p>
                          <p className="text-xs text-slate-400">{tramite.documento}</p>
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tramite.tipoTramite}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {tramite.periodo || 'Sin periodo'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(tramite.fechaSolicitud)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(tramite.estado)}>{tramite.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" onClick={() => setSelected(tramite)}>
                          Ver
                        </Button>
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo trámite"
        subtitle="Radicación administrativa"
      >
        <form className="space-y-4" onSubmit={createTramite}>
          <div>
            <Label>Estudiante *</Label>
            <Select
              value={form.estudiante_id}
              onChange={(event) => setForm((current) => ({ ...current, estudiante_id: event.target.value }))}
              placeholder="Selecciona un estudiante"
              required
            >
              {students
                .filter((student) => student.estudiante_id)
                .map((student) => (
                  <option key={student.estudiante_id} value={student.estudiante_id}>
                    {student.nombre} {student.apellido} · {student.documento}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <Label>Periodo académico</Label>
            <Select
              value={form.periodo_id}
              onChange={(event) => setForm((current) => ({ ...current, periodo_id: event.target.value }))}
              placeholder="Sin periodo específico"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Tipo de trámite *</Label>
            <Input
              list="tipos-tramite"
              value={form.tipo_tramite}
              onChange={(event) => setForm((current) => ({ ...current, tipo_tramite: event.target.value }))}
              placeholder="Ej. Certificado de calificaciones"
              required
            />
            <datalist id="tipos-tramite">
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Estado</Label>
            <Select
              value={form.estado}
              onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))}
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Detalles u observaciones</Label>
            <textarea
              value={form.detalles}
              onChange={(event) => setForm((current) => ({ ...current, detalles: event.target.value }))}
              rows={4}
              placeholder="Información adicional del radicado"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" loading={saving}>
              Radicar trámite
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Trámite #${selected.id}` : 'Trámite'}
        subtitle={selected?.tipoTramite}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={statusTone(selected.estado)}>{selected.estado}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Solicitud: {formatDate(selected.fechaSolicitud)}
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Estudiante" value={selected.estudiante} />
              <Detail label="Documento" value={selected.documento} />
              <Detail label="Periodo" value={selected.periodo || 'Sin periodo'} />
              <Detail label="Tipo" value={selected.tipoTramite} />
              <Detail label="Resolución" value={formatDate(selected.fechaResolucion)} />
              <Detail label="Correo" value={selected.email} />
            </dl>

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Detalles u observaciones
              </p>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                {selected.detalles || 'Sin observaciones registradas.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

/**
 * Fila de detalle usada en el resumen de un trámite.
 * @param props Etiqueta y valor a mostrar.
 */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  )
}
