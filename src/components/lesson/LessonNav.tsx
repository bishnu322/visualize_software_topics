import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LESSONS } from '@/lessons/registry'

export function LessonNav({ slug }: { slug: string }) {
  const i = LESSONS.findIndex((l) => l.slug === slug)
  const prev = LESSONS[i - 1]
  const next = LESSONS[i + 1]
  const card = 'group flex flex-1 flex-col rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-400 dark:border-slate-800'
  return (
    <nav className="mt-12 flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link to={`/learn/${prev.slug}`} className={card}>
          <span className="flex items-center gap-1 text-xs text-slate-500"><ArrowLeft size={14} /> Previous</span>
          <span className="font-semibold group-hover:text-brand-600">{prev.title}</span>
        </Link>
      ) : <div className="flex-1" />}
      {next ? (
        <Link to={`/learn/${next.slug}`} className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-xs text-slate-500">Next <ArrowRight size={14} /></span>
          <span className="font-semibold group-hover:text-brand-600">{next.title}</span>
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
