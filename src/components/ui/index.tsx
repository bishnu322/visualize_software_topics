import clsx from 'clsx'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'h-8 px-2.5 text-sm' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' &&
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    />
  )
}

const badgeColors = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

export function Badge({ color = 'slate', children, className }: { color?: keyof typeof badgeColors; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', badgeColors[color], className)}>
      {children}
    </span>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  return (
    <div role="tablist" className={clsx('flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Panel({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60', className)}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      {children}
    </div>
  )
}
