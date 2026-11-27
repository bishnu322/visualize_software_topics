import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { courseById, lessonsByCourse, type LessonMeta } from '@/content/registry'
import { Badge } from '@/components/shared/ui'

export function LessonHeader({ lesson }: { lesson: LessonMeta }) {
  const course = courseById(lesson.course)!
  const n = lessonsByCourse(lesson.course).indexOf(lesson) + 1
  const Icon = lesson.icon
  return (
    <header className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: lesson.color }}>
          <Icon size={18} />
        </span>
        <Link to={`/learn/${course.id}`} className="text-sm font-semibold hover:underline" style={{ color: course.color }}>
          {course.title}
        </Link>
        <span className="font-mono text-sm text-slate-500">· Lesson {n}</span>
        <Badge color={lesson.level === 'Beginner' ? 'green' : 'amber'}>{lesson.level}</Badge>
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Clock size={14} /> {lesson.minutes} min
        </span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{lesson.title}</h1>
      <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{lesson.short}</p>
    </header>
  )
}
