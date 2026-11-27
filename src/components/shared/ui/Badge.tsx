import clsx from 'clsx'
import type { ReactNode } from 'react'

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
