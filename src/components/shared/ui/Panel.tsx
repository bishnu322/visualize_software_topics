import clsx from 'clsx'
import type { ReactNode } from 'react'

export function Panel({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60', className)}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      {children}
    </div>
  )
}
