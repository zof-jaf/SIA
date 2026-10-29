import { useState, type FormEvent } from 'react'
import { ActionRow, Button, FormCard, Input, Select } from './ui'
import type {
  AdminPeriod,
  AdminUser,
  CreateAdminInput,
  CreateOfferingInput,
  CreateProfessorInput,
  CreateProgramInput,
  CreateStudentInput,
  CreateSubjectInput,
  Program,
  Subject,
} from '../services/portal'

export type UserKind = 'estudiante' | 'profesor' | 'administrador'

type UserInput = CreateStudentInput | CreateProfessorInput | CreateAdminInput

const USER_LABEL: Record<UserKind, string> = {
  estudiante: 'estudiante',
  profesor: 'profesor',
  administrador: 'administrador',
}

/**
 * Formulario controlado y reutilizable para crear usuarios de cualquier rol.
 * @param props Rol a crear, programas disponibles y callbacks de envío/cancelación.
 */
export function UserForm({
  kind,
  programs,
  submitting,
  onCancel,
  onSubmit,
}: {
  kind: UserKind
  programs: Program[]
  submitting?: boolean
  onCancel: () => void
  onSubmit: (input: UserInput) => void
}) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    programa_id: '',
    documento: '',
    especialidad: '',
    cargo: '',
  })

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const base = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      password: form.password,
      activo: true,
    }

    if (kind === 'estudiante') {
      onSubmit({
        ...base,
        programa_id: form.programa_id ? Number(form.programa_id) : undefined,
        documento: form.documento.trim() || undefined,
      })
      return
    }

    if (kind === 'profesor') {
      onSubmit({
        ...base,
        especialidad: form.especialidad.trim() || undefined,
        documento: form.documento.trim() || undefined,
      })
      return
    }

    onSubmit({
      ...base,
      cargo: form.cargo.trim() || undefined,
    })
  }

  return (
    <FormCard title={`Crear ${USER_LABEL[kind]}`} subtitle="Completa los datos del nuevo usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombres"
            value={form.nombre}
            onChange={(event) => update('nombre', event.target.value)}
            placeholder="Nombres"
            required
          />
          <Input
            label="Apellidos"
            value={form.apellido}
            onChange={(event) => update('apellido', event.target.value)}
            placeholder="Apellidos"
            required
          />
          <Input
            label="Correo institucional"
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="usuario@ucaldas.edu.co"
            autoComplete="email"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {kind === 'estudiante' && (
            <>
              <Select
                label="Programa académico"
                value={form.programa_id}
                onChange={(event) => update('programa_id', event.target.value)}
                placeholder="Seleccionar programa"
              >
                {programs.map((program) => (
                  <option key={program.id} value={String(program.id)}>
                    {program.codigo} - {program.nombre}
                  </option>
                ))}
              </Select>
              <Input
                label="Documento"
                value={form.documento}
                onChange={(event) => update('documento', event.target.value)}
                placeholder="Número de documento"
              />
            </>
          )}

          {kind === 'profesor' && (
            <>
              <Input
                label="Especialidad"
                value={form.especialidad}
                onChange={(event) => update('especialidad', event.target.value)}
                placeholder="Ej. Ingeniería de Software y BD"
              />
              <Input
                label="Documento"
                value={form.documento}
                onChange={(event) => update('documento', event.target.value)}
                placeholder="Número de documento"
              />
            </>
          )}

          {kind === 'administrador' && (
            <Input
              label="Cargo"
              value={form.cargo}
              onChange={(event) => update('cargo', event.target.value)}
              placeholder="Ej. Decano, Coordinador, Rector"
            />
          )}
        </div>

        <ActionRow>
          <Button type="button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="brand" loading={submitting}>
            Crear usuario
          </Button>
        </ActionRow>
      </form>
    </FormCard>
  )
}

/**
 * Formulario controlado para registrar un programa académico.
 * @param props Callbacks de envío y cancelación.
 */
export function ProgramForm({
  submitting,
  onCancel,
  onSubmit,
}: {
  submitting?: boolean
  onCancel: () => void
  onSubmit: (input: CreateProgramInput) => void
}) {
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    duracion_semestres: '',
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || undefined,
      duracion_semestres: form.duracion_semestres ? Number(form.duracion_semestres) : undefined,
      activo: true,
    })
  }

  return (
    <FormCard title="Nuevo programa académico" subtitle="Registra un programa en el catálogo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            placeholder="Ej. Ingeniería de Software"
            required
          />
          <Input
            label="Código"
            value={form.codigo}
            onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
            placeholder="Ej. ING-SW"
            required
          />
          <Input
            label="Duración (semestres)"
            type="number"
            min={1}
            value={form.duracion_semestres}
            onChange={(event) =>
              setForm((current) => ({ ...current, duracion_semestres: event.target.value }))
            }
            placeholder="10"
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(event) =>
              setForm((current) => ({ ...current, descripcion: event.target.value }))
            }
            placeholder="Descripción opcional"
          />
        </div>

        <ActionRow>
          <Button type="button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="brand" loading={submitting}>
            Crear programa
          </Button>
        </ActionRow>
      </form>
    </FormCard>
  )
}

/**
 * Formulario controlado para registrar una materia en el catálogo.
 * @param props Callbacks de envío y cancelación.
 */
export function SubjectForm({
  professors,
  periods,
  submitting,
  onCancel,
  onSubmit,
}: {
  professors: AdminUser[]
  periods: AdminPeriod[]
  submitting?: boolean
  onCancel: () => void
  onSubmit: (input: CreateSubjectInput) => void
}) {
  const activePeriod = periods.find((period) => period.activo)
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    creditos: '3',
    semestre: '',
    profesor_id: '',
    periodo_id: activePeriod ? String(activePeriod.id) : '',
    grupo: 'A',
    cupo: '30',
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const assignment = form.profesor_id
      ? {
          profesor_id: Number(form.profesor_id),
          periodo_id: Number(form.periodo_id),
          grupo: form.grupo.trim().toUpperCase() || 'A',
          cupo: Number(form.cupo) || 30,
        }
      : {}

    onSubmit({
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || undefined,
      creditos: Number(form.creditos),
      semestre: form.semestre ? Number(form.semestre) : undefined,
      activo: true,
      ...assignment,
    })
  }

  return (
    <FormCard title="Nueva materia" subtitle="Registra la materia y, si lo deseas, asígnala a un profesor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            placeholder="Ej. Bases de Datos II"
            required
          />
          <Input
            label="Código"
            value={form.codigo}
            onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
            placeholder="Ej. BD-201"
            required
          />
          <Input
            label="Créditos"
            type="number"
            min={1}
            max={20}
            value={form.creditos}
            onChange={(event) => setForm((current) => ({ ...current, creditos: event.target.value }))}
            required
          />
          <Input
            label="Semestre"
            type="number"
            min={1}
            value={form.semestre}
            onChange={(event) => setForm((current) => ({ ...current, semestre: event.target.value }))}
            placeholder="Opcional"
          />
          <div className="sm:col-span-2">
            <Input
              label="Descripción"
              value={form.descripcion}
              onChange={(event) =>
                setForm((current) => ({ ...current, descripcion: event.target.value }))
              }
              placeholder="Descripción opcional"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Asignación docente (opcional)
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              label="Profesor"
              value={form.profesor_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, profesor_id: event.target.value }))
              }
              placeholder="Sin asignar"
            >
              {professors
                .filter((professor) => professor.activo)
                .map((professor) => (
                  <option key={professor.profesor_id} value={String(professor.profesor_id)}>
                    {professor.nombre} {professor.apellido}
                  </option>
                ))}
            </Select>
            <Select
              label="Periodo"
              value={form.periodo_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, periodo_id: event.target.value }))
              }
              placeholder="Seleccionar periodo"
              disabled={!form.profesor_id}
              required={Boolean(form.profesor_id)}
            >
              {periods.map((period) => (
                <option key={period.id} value={String(period.id)}>
                  {period.nombre} {period.activo ? '(activo)' : ''}
                </option>
              ))}
            </Select>
            <Input
              label="Grupo"
              value={form.grupo}
              onChange={(event) => setForm((current) => ({ ...current, grupo: event.target.value }))}
              placeholder="A"
              disabled={!form.profesor_id}
            />
            <Input
              label="Cupo"
              type="number"
              min={0}
              value={form.cupo}
              onChange={(event) => setForm((current) => ({ ...current, cupo: event.target.value }))}
              disabled={!form.profesor_id}
            />
          </div>
        </div>

        <ActionRow>
          <Button type="button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="brand" loading={submitting}>
            Crear materia
          </Button>
        </ActionRow>
      </form>
    </FormCard>
  )
}

/**
 * Formulario para asignar una materia existente a un profesor en un periodo.
 * @param props Catálogo disponible y callbacks de envío/cancelación.
 */
export function OfferingForm({
  subjects,
  professors,
  periods,
  submitting,
  onCancel,
  onSubmit,
}: {
  subjects: Subject[]
  professors: AdminUser[]
  periods: AdminPeriod[]
  submitting?: boolean
  onCancel: () => void
  onSubmit: (input: CreateOfferingInput) => void
}) {
  const activePeriod = periods.find((period) => period.activo)
  const [form, setForm] = useState({
    materia_id: '',
    profesor_id: '',
    periodo_id: activePeriod ? String(activePeriod.id) : '',
    grupo: 'A',
    cupo: '30',
    estado: 'ABIERTA',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
  })

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const hasSchedule = Boolean(form.dia_semana || form.hora_inicio || form.hora_fin)
    const horarios = hasSchedule
      ? [
          {
            dia_semana: form.dia_semana,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin,
            aula: form.aula.trim() || undefined,
          },
        ]
      : []

    onSubmit({
      materia_id: Number(form.materia_id),
      profesor_id: Number(form.profesor_id),
      periodo_id: Number(form.periodo_id),
      grupo: form.grupo.trim().toUpperCase() || 'A',
      cupo: Number(form.cupo) || 30,
      estado: form.estado as CreateOfferingInput['estado'],
      horarios,
    })
  }

  return (
    <FormCard title="Asignar materia a profesor" subtitle="Crea una oferta con periodo, grupo y horario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Materia"
            value={form.materia_id}
            onChange={(event) => update('materia_id', event.target.value)}
            placeholder="Seleccionar materia"
            required
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={String(subject.id)}>
                {subject.codigo} - {subject.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Profesor"
            value={form.profesor_id}
            onChange={(event) => update('profesor_id', event.target.value)}
            placeholder="Seleccionar profesor"
            required
          >
            {professors
              .filter((professor) => professor.activo)
              .map((professor) => (
                <option key={professor.profesor_id} value={String(professor.profesor_id)}>
                  {professor.nombre} {professor.apellido}
                </option>
              ))}
          </Select>
          <Select
            label="Periodo"
            value={form.periodo_id}
            onChange={(event) => update('periodo_id', event.target.value)}
            placeholder="Seleccionar periodo"
            required
          >
            {periods.map((period) => (
              <option key={period.id} value={String(period.id)}>
                {period.nombre} {period.activo ? '(activo)' : ''}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={form.estado}
            onChange={(event) => update('estado', event.target.value)}
          >
            <option value="ABIERTA">Abierta</option>
            <option value="ACTIVA">Activa</option>
            <option value="CERRADA">Cerrada</option>
          </Select>
          <Input
            label="Grupo"
            value={form.grupo}
            onChange={(event) => update('grupo', event.target.value)}
            required
          />
          <Input
            label="Cupo"
            type="number"
            min={0}
            value={form.cupo}
            onChange={(event) => update('cupo', event.target.value)}
            required
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Horario (opcional)
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              label="Día"
              value={form.dia_semana}
              onChange={(event) => update('dia_semana', event.target.value)}
              placeholder="Seleccionar día"
            >
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
            <Input
              label="Aula"
              value={form.aula}
              onChange={(event) => update('aula', event.target.value)}
              placeholder="Ej. B-204"
            />
            <Input
              label="Hora inicio"
              type="time"
              value={form.hora_inicio}
              onChange={(event) => update('hora_inicio', event.target.value)}
            />
            <Input
              label="Hora fin"
              type="time"
              value={form.hora_fin}
              onChange={(event) => update('hora_fin', event.target.value)}
            />
          </div>
        </div>

        <ActionRow>
          <Button type="button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="brand" loading={submitting}>
            Asignar materia
          </Button>
        </ActionRow>
      </form>
    </FormCard>
  )
}
