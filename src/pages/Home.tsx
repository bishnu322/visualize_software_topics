import { lazy, Suspense } from 'react'
import { ArrowRight, Box, Layers3, MousePointerClick, Microscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LESSONS } from '@/lessons/registry'
import { useIsDark } from '@/hooks/useTheme'
import { useProgress } from '@/store/progress'
import { Badge } from '@/components/ui'

const HeroGlobe = lazy(() => import('@/components/three/HeroGlobe'))

export default function Home() {
  const dark = useIsDark()
  const completed = useProgress((s) => s.completed)
  const nextLesson = LESSONS.find((l) => !completed.includes(l.slug)) ?? LESSONS[0]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-100),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,#0c4a6e55,transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-4 py-10 sm:px-8 md:grid-cols-2 md:py-16">
          <div>
            <Badge color="brand">Interactive · 2D + 3D</Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              See how the internet <span className="text-brand-500">actually works</span>.
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Learn computer networking by watching packets move. Every concept, from the OSI layers to TCP handshakes, is an animation you can pause, step through and play with.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/learn/${nextLesson.slug}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
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

      {/* How it works */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {[
          { icon: Box, t: '3D scenes', d: 'Rotate real topologies and watch packets hop between devices.' },
          { icon: MousePointerClick, t: 'Step-by-step', d: 'Play, pause or step through every protocol exchange.' },
          { icon: Layers3, t: 'Hands-on tools', d: 'Subnet calculator, routing graph, network sandbox.' },
          { icon: Microscope, t: 'Deep dive mode', d: 'Toggle on for header fields and CCNA-level detail.' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <Icon className="text-brand-500" size={22} />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{t}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p>
          </div>
        ))}
      </section>

      {/* Curriculum */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Follow in order, or jump to any topic.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((l, i) => {
            const Icon = l.icon
            const done = completed.includes(l.slug)
            return (
              <Link
                key={l.slug}
                to={`/learn/${l.slug}`}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: l.color }}>
                    <Icon size={20} />
                  </span>
                  <span className="font-mono text-sm text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  {done && <Badge color="green" className="ml-auto">Done</Badge>}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white">{l.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{l.short}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Badge color={l.level === 'Beginner' ? 'green' : 'amber'}>{l.level}</Badge>
                  <span>{l.minutes} min</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
