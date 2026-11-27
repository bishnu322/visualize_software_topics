import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { COURSES, courseById, lessonPath, lessonsByCourse, type LessonMeta } from '@/content/registry'

const card = 'group flex flex-1 flex-col rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-400 dark:border-slate-800'

/** Prev/next within the course; at the end of a course, point to the next course (or the playground). */
export function LessonNav({ lesson }: { lesson: LessonMeta }) {
  const list = lessonsByCourse(lesson.course)
  const i = list.indexOf(lesson)
  const prev = list[i - 1]
  const next = list[i + 1]
  const nextCourse = COURSES[COURSES.findIndex((c) => c.id === lesson.course) + 1]
  const nextCourseFirst = nextCourse ? lessonsByCourse(nextCourse.id)[0] : undefined

  return (
    <nav className="mt-12 flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link to={lessonPath(prev)} className={card}>
          <span className="flex items-center gap-1 text-xs text-slate-500"><ArrowLeft size={14} /> Previous</span>
          <span className="font-semibold group-hover:text-brand-600">{prev.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link to={lessonPath(next)} className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-xs text-slate-500">Next <ArrowRight size={14} /></span>
          <span className="font-semibold group-hover:text-brand-600">{next.title}</span>
        </Link>
      ) : nextCourseFirst ? (
        <Link to={lessonPath(nextCourseFirst)} className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            Course complete! Start {courseById(nextCourseFirst.course)!.title} <ArrowRight size={14} />
          </span>
          <span className="font-semibold group-hover:text-brand-600">{nextCourseFirst.title}</span>
        </Link>
      ) : (
        <Link to="/playground" className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-xs text-slate-500">Up next <ArrowRight size={14} /></span>
          <span className="font-semibold group-hover:text-brand-600">Build your own network in the Playground</span>
        </Link>
      )}
    </nav>
  )
}
