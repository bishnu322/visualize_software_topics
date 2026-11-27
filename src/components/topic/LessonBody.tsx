import { Suspense } from 'react'
import type { LessonMeta } from '@/content/registry'

/** Renders the lesson's MDX with typography styles. */
export function LessonBody({ lesson }: { lesson: LessonMeta }) {
  const { Component } = lesson
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-a:text-brand-600 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium dark:prose-code:bg-slate-800 prose-table:text-sm prose-table:block prose-table:overflow-x-auto">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />}>
        <Component key={`${lesson.course}/${lesson.slug}`} />
      </Suspense>
    </div>
  )
}
