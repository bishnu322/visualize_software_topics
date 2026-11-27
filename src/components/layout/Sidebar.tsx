import { FlaskConical, Home } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { COURSES } from '@/content/registry'
import { SidebarCourse } from './SidebarCourse'
import { useOpenCourses } from './useOpenCourses'

const link = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70',
  )

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isOpen, toggle } = useOpenCourses()
  return (
    <nav className="flex h-full flex-col p-3" aria-label="Courses">
      <NavLink to="/" end className={link} onClick={onNavigate}>
        <Home size={16} /> Home
      </NavLink>
      <NavLink to="/playground" className={link} onClick={onNavigate}>
        <FlaskConical size={16} /> Playground
      </NavLink>
      <div className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Courses</div>
      {COURSES.map((c) => (
        <SidebarCourse key={c.id} course={c} open={isOpen(c.id)} onToggle={() => toggle(c.id)} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}
