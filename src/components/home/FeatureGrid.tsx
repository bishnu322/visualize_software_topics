import { Box, Layers3, Microscope, MousePointerClick } from 'lucide-react'

const FEATURES = [
  { icon: Box, t: '3D scenes', d: 'Rotate real topologies and architectures; watch requests flow.' },
  { icon: MousePointerClick, t: 'Step-by-step', d: 'Play, pause or step through every protocol and algorithm.' },
  { icon: Layers3, t: 'Hands-on tools', d: 'Subnet calculator, load balancer, cache and queue simulators.' },
  { icon: Microscope, t: 'Deep dive mode', d: 'Toggle on for header fields, numbers and interview-level detail.' },
]

export function FeatureGrid() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
      {FEATURES.map(({ icon: Icon, t, d }) => (
        <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Icon className="text-brand-500" size={22} />
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{t}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p>
        </div>
      ))}
    </section>
  )
}
