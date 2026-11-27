import type { ReactNode } from 'react'
import clsx from 'clsx'

/** Card wrapper for visualizations inside MDX (escapes prose styles). */
export function VizFrame({ title, hint, children, className }: { title?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <figure className={clsx('not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      {(title || hint) && (
        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          {title && <span className="font-semibold text-slate-900 dark:text-white">{title}</span>}
          {hint && <span className="text-xs text-slate-500">{hint}</span>}
        </figcaption>
      )}
      {children}
    </figure>
  )
}
