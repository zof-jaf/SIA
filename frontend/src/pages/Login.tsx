import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { resolveRoleHome, type Role } from '../services/auth'
import { ThemeButton } from '../components/Layout'

interface DemoAccount {
  role: Role
  label: string
  email: string
  password: string
}

const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || ''
const DEMO_ACCOUNTS: DemoAccount[] = (
  [
    { role: 'ESTUDIANTE', label: 'Estudiante', email: import.meta.env.VITE_DEMO_ESTUDIANTE_EMAIL },
    { role: 'PROFESOR', label: 'Profesor', email: import.meta.env.VITE_DEMO_PROFESOR_EMAIL },
    { role: 'ADMINISTRADOR', label: 'Administrador', email: import.meta.env.VITE_DEMO_ADMINISTRADOR_EMAIL },
  ] as { role: Role; label: string; email?: string }[]
)
  .filter((account): account is { role: Role; label: string; email: string } => Boolean(account.email))
  .map((account) => ({ ...account, password: DEMO_PASSWORD }))

const DEMO_ENABLED =
  import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true' && Boolean(DEMO_PASSWORD) && DEMO_ACCOUNTS.length > 0

const FEATURES = [
  { icon: CalendarDays, title: 'Horario y clases', text: 'Consulta tus materias, aulas y docentes del periodo activo.' },
  { icon: BookOpen, title: 'Notas y progreso', text: 'Revisa calificaciones, créditos aprobados y avance del plan.' },
  { icon: GraduationCap, title: 'Gestión académica', text: 'Administra matrículas, oferta y usuarios desde un solo lugar.' },
]

/**
 * Pantalla de inicio de sesión. Tras autenticar, resuelve el panel según el rol
 * devuelto por la API y evita cualquier redirección fija al panel de estudiante.
 */
export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      const home = resolveRoleHome(user.rol)

      if (!home) {
        throw new Error('Tu usuario no tiene un rol habilitado para acceder al portal.')
      }

      navigate(home, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Rellena el formulario con una cuenta de demostración configurada por entorno.
   * @param account Cuenta seleccionada.
   */
  const fillDemo = (account: DemoAccount) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#121417]">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-950/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold backdrop-blur">
            U
          </div>
          <div>
            <p className="font-display text-lg font-extrabold leading-tight">SIA-UCALDAS</p>
            <p className="text-xs text-white/70">Sistema Integrado Académico</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Universidad de Caldas · Versión 5.2
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1]">
            Tu vida académica, en un solo lugar.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Consulta horarios, calificaciones, avance de tu plan de estudios y la gestión
            académica de la universidad desde una plataforma única.
          </p>

          <div className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">{feature.title}</p>
                  <p className="text-xs text-white/70">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          © 2026 SIA-UCALDAS · Universidad de Caldas · Soporte TIC: soporte@ucaldas.edu.co
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">
              U
            </div>
            <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              SIA-UCALDAS
            </p>
          </div>
          <div className="ml-auto">
            <ThemeButton />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ingresa con tus credenciales institucionales para continuar.
              </p>
            </div>

            {DEMO_ENABLED && (
              <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/25 dark:bg-sky-500/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" /> Cuentas de demostración
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-slate-900/40 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-sky-700/80 dark:text-sky-300/70">
                  Credenciales de demostración configuradas por variables de entorno.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Correo institucional
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuario@ucaldas.edu.co"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Mesa de Ayuda TIC: soporte@ucaldas.edu.co')}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verificando credenciales...' : 'Ingresar al SIA'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Soporte TIC · soporte@ucaldas.edu.co · Universidad de Caldas
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
