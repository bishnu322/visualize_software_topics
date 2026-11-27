import { AlertTriangle, Info, Lightbulb, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

const styles = {
  tip: { icon: Lightbulb, cls: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100', label: 'Tip' },
  info: { icon: Info, cls: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100', label: 'Note' },
  warn: { icon: AlertTriangle, cls: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100', label: 'Watch out' },
  analogy: { icon: Sparkles, cls: 'border-pink-300 bg-pink-50 text-pink-900 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-100', label: 'Analogy' },
}

export function Callout({ type = 'info', title, children }: { type?: keyof typeof styles; title?: string; children: ReactNode }) {
  const s = styles[type]
  const Icon = s.icon
  return (
    <aside className={`not-prose my-6 flex gap-3 rounded-xl border p-4 ${s.cls}`}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="text-[15px] leading-relaxed">
        <div className="mb-1 font-semibold">{title ?? s.label}</div>
        <div className="[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm dark:[&_code]:bg-white/10 [&_p+p]:mt-2">{children}</div>
      </div>
    </aside>
  )
}
