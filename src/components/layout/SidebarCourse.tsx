import { CheckCircle2, ChevronDown, Circle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { lessonPath, lessonsByCourse, type Course } from '@/content/registry'
import { useProgress } from '@/store/progress'

interface Props {
  course: Course
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}

/** One collapsible course group: header with progress, then its numbered lessons. */
export function SidebarCourse({ course, open, onToggle, onNavigate }: Props) {
  const completed = useProgress((s) => s.completed)
  const lessons = lessonsByCourse(course.id)
  const done = lessons.filter((l) => completed.includes(l.slug)).length
  const Icon = course.icon

  return (
    <section className="mt-3">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/70"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white" style={{ background: course.color }}>
          <Icon size={14} />
        </span>
        <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">{course.title}</span>
        <span className="font-mono text-xs text-slate-400">{done}/{lessons.length}</span>
        <ChevronDown size={16} className={clsx('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      <div className="mx-3 mt-1 mb-1 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full transition-all" style={{ width: `${(done / lessons.length) * 100}%`, background: course.color }} />
      </div>

      {open && (
        <div className="mt-1 flex flex-col gap-0.5">
          {lessons.map((l, i) => {
            const isDone = completed.includes(l.slug)
            return (
              <NavLink
                key={l.slug}
                to={lessonPath(l)}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg py-1.5 pr-3 pl-5 text-sm transition-colors',
                    isActive
                      ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70',
                  )
                }
              >
                {isDone ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> : <Circle size={15} className="shrink-0 opacity-40" />}
                <span className="font-mono text-xs opacity-50">{String(i + 1).padStart(2, '0')}</span>
                <span className="truncate">{l.title}</span>
              </NavLink>
            )
          })}
        </div>
      )}
    </section>
  )
}
