import { useState, type ReactNode } from 'react'
import { LogOut, Menu, Moon, Sun, X, type LucideIcon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../services/auth'
import { cn } from './ui'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export function ThemeButton() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-brand dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

const initials = (nombre: string, apellido: string) =>
  `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase()

export default function Layout({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string
  subtitle?: string
  nav: NavItem[]
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(nav[0]?.href ?? '#inicio')

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-[#121417] dark:text-slate-200">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-[#181b20] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white shadow-lg shadow-brand/25">
              U
            </div>
            <div>
              <p className="font-display text-[15px] font-extrabold leading-tight text-slate-900 dark:text-white">
                SIA-UCALDAS
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Sistema Académico
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menú principal
          </p>
          {nav.map((item) => {
            const isActive = active === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => {
                  setActive(item.href)
                  setOpen(false)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {initials(user?.nombre || '', user?.apellido || '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {user ? roleLabel[user.rol] : ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-400">SIA-UCALDAS · v5.2</p>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#121417]/80">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                aria-label="Abrir menú"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeButton />
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:flex dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  {initials(user?.nombre || '', user?.apellido || '')}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{user?.nombre}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {user ? roleLabel[user.rol] : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
