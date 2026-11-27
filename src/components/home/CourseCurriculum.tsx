import { lessonsByCourse, type Course } from '@/content/registry'
import { useProgress } from '@/store/progress'
import { LessonCard } from './LessonCard'

export function CourseCurriculum({ course }: { course: Course }) {
  const completed = useProgress((s) => s.completed)
  const lessons = lessonsByCourse(course.id)
  const done = lessons.filter((l) => completed.includes(l.slug)).length
  const Icon = course.icon
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: course.color }}>
          <Icon size={18} />
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{course.title}</h2>
        <span className="font-mono text-sm text-slate-500">{done}/{lessons.length} done</span>
      </div>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{course.short}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l, i) => (
          <LessonCard key={l.slug} lesson={l} index={i} done={completed.includes(l.slug)} />
        ))}
      </div>
    </section>
  )
}
