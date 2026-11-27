import { CheckCircle2, Circle, Home, FlaskConical } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { LESSONS } from '@/lessons/registry'
import { useProgress } from '@/store/progress'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const completed = useProgress((s) => s.completed)
  const pct = Math.round((completed.length / LESSONS.length) * 100)
  const item = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70',
    )

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Lessons">
      <NavLink to="/" end className={item} onClick={onNavigate}>
        <Home size={16} /> Home
      </NavLink>
      <NavLink to="/playground" className={item} onClick={onNavigate}>
        <FlaskConical size={16} /> Playground
      </NavLink>

      <div className="mt-4 mb-1 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span>Lessons</span>
        <span className="font-mono normal-case">{pct}%</span>
      </div>
      <div className="mx-3 mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {LESSONS.map((l, i) => {
        const done = completed.includes(l.slug)
        return (
          <NavLink key={l.slug} to={`/learn/${l.slug}`} className={item} onClick={onNavigate}>
            {done ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <Circle size={16} className="shrink-0 opacity-40" />}
            <span className="font-mono text-xs opacity-50">{String(i + 1).padStart(2, '0')}</span>
            <span className="truncate">{l.title}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
