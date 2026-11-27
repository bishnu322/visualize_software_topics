import { ArrowRight } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { LESSONS, lessonPath } from '@/content/registry'
import { useIsDark } from '@/hooks/useTheme'
import { useProgress } from '@/store/progress'
import { Badge } from '@/components/shared/ui'

const HeroGlobe = lazy(() => import('./HeroGlobe'))

export function Hero() {
  const dark = useIsDark()
  const completed = useProgress((s) => s.completed)
  const next = LESSONS.find((l) => !completed.includes(l.slug)) ?? LESSONS[0]

  return (
    <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-100),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,#0c4a6e55,transparent_60%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-4 py-10 sm:px-8 md:grid-cols-2 md:py-16">
        <div>
          <Badge color="brand">Interactive · 2D + 3D</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Computer networks & system design, <span className="text-brand-500">visualized</span>.
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Watch packets move and systems scale. Every concept, from TCP handshakes to load balancers and sharding, is an animation you can pause, step through and play with.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={lessonPath(next)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
              {completed.length ? 'Continue learning' : 'Start learning'} <ArrowRight size={18} />
            </Link>
            <Link to="/playground" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              Open playground
            </Link>
          </div>
        </div>
        <div className="h-[300px] sm:h-[420px]" aria-hidden>
          <Suspense fallback={<div className="mx-auto mt-10 h-64 w-64 animate-pulse rounded-full bg-brand-100 dark:bg-slate-800" />}>
            <HeroGlobe dark={dark} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
