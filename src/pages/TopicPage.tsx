import { CheckCircle2, Clock } from 'lucide-react'
import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { LESSONS, lessonBySlug } from '@/lessons/registry'
import { LessonNav } from '@/components/lesson/LessonNav'
import { Badge, Button } from '@/components/ui'
import { useProgress } from '@/store/progress'
import NotFound from './NotFound'

export default function TopicPage() {
  const { slug = '' } = useParams()
  const lesson = lessonBySlug(slug)
  const { completed, markComplete } = useProgress()
  if (!lesson) return <NotFound />
  const { Component, icon: Icon } = lesson
  const n = LESSONS.indexOf(lesson) + 1
  const done = completed.includes(slug)

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: lesson.color }}>
            <Icon size={18} />
          </span>
          <span className="font-mono text-sm text-slate-500">Lesson {n}</span>
          <Badge color={lesson.level === 'Beginner' ? 'green' : 'amber'}>{lesson.level}</Badge>
          <span className="flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> {lesson.minutes} min</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{lesson.title}</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{lesson.short}</p>
      </header>

      <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-a:text-brand-600 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium dark:prose-code:bg-slate-800 prose-table:text-sm prose-table:block prose-table:overflow-x-auto">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />}>
          <Component key={slug} />
        </Suspense>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        {done ? (
          <span className="flex items-center gap-2 font-medium text-emerald-600"><CheckCircle2 size={18} /> Lesson completed</span>
        ) : (
          <>
            <span className="text-sm text-slate-600 dark:text-slate-400">Finished reading? Get every quiz question right, or</span>
            <Button size="sm" variant="primary" onClick={() => markComplete(slug)}>Mark as complete</Button>
          </>
        )}
      </div>

      <LessonNav slug={slug} />
    </article>
  )
}
