import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Inbox, Loader2, Mail, Lock, User, Building, Book, Plus, type LucideIcon } from 'lucide-react'

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Card({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-[#181b20]',
        className,
      )}
    >
      {children}
    </section>
  )
}

const badgeTones = {
  brand: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  danger:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25',
  neutral:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof badgeTones
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'brand',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  tone?: keyof typeof badgeTones
}) {
  return (
    <Card className="flex items-start gap-4 !p-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', badgeTones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </Card>
  )
}

export function Donut({
  percentage,
  label,
  caption,
  size = 132,
}: {
  percentage: number
  label: string
  caption?: string
  size?: number
}) {
  const safe = Math.max(0, Math.min(100, percentage))

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3.5"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${safe}, 100`}
          className="stroke-brand transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{label}</span>
        {caption && <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{caption}</span>}
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-modal-in relative max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#181b20]',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[calc(92vh-80px)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
      <Icon className="h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  )
}

export function Spinner({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
      <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-500 dark:hover:bg-rose-500/10"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        'block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1',
        className,
      )}
    >
      {children}
    </label>
  )
}

export function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  className,
  ...props
}: {
  id?: string
  label?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
          'focus:border-brand focus:ring-1 focus:ring-brand',
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

export function Select({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  disabled,
  children,
  className,
}: {
  id?: string
  label?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  required?: boolean
  error?: string
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
          'focus:border-brand focus:ring-1 focus:ring-brand',
          disabled && 'bg-slate-100 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 cursor-not-allowed',
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white',
          className,
        )}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && <p className="text-[10px] text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'brand',
  disabled,
  loading,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'brand' | 'outline' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  const variants = {
    brand:
      'rounded-lg border border-brand bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-50 dark:hover:bg-brand-dark',
    outline:
      'rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand dark:hover:text-white',
    ghost:
      'rounded-lg border border-transparent bg-transparent px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
    danger:
      'rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20',
  }

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={cn('flex items-center justify-center gap-2', variants[variant], className)}
    >
      {loading && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      )}
      {children}
    </button>
  )
}

export function FormCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('!p-6', className)}>
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

export function ActionRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-end gap-3 pt-4', className)}>
      {children}
    </div>
  )
}

export function SectionHead({
  label,
  icon: Icon,
  action,
}: {
  label: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      {action}
    </div>
  )
}

/**
 * Banner reutilizable para confirmaciones y errores de operaciones asíncronas.
 * @param props Tipo de aviso, contenido y acción opcional de cierre.
 */
export function Notice({
  tone,
  children,
  onClose,
}: {
  tone: 'success' | 'error' | 'info'
  children: ReactNode
  onClose?: () => void
}) {
  const tones = {
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    error:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
    info:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  }

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold',
        tones[tone],
      )}
    >
      <span className="flex items-center gap-2">{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="text-xs underline">
          Cerrar
        </button>
      )}
    </div>
  )
}
