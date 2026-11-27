import { Link } from 'react-router-dom'
import { lessonPath, type LessonMeta } from '@/content/registry'
import { Badge } from '@/components/shared/ui'

export function LessonCard({ lesson, index, done }: { lesson: LessonMeta; index: number; done: boolean }) {
  const Icon = lesson.icon
  return (
    <Link
      to={lessonPath(lesson)}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: lesson.color }}>
          <Icon size={20} />
        </span>
        <span className="font-mono text-sm text-slate-400">{String(index + 1).padStart(2, '0')}</span>
        {done && <Badge color="green" className="ml-auto">Done</Badge>}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white">{lesson.title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{lesson.short}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Badge color={lesson.level === 'Beginner' ? 'green' : 'amber'}>{lesson.level}</Badge>
        <span>{lesson.minutes} min</span>
      </div>
    </Link>
  )
}
