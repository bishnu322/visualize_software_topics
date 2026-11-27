import { ChevronDown, Microscope } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSettings } from '@/store/settings'

/** Collapsible advanced section. Opens automatically when global Deep Dive mode is on. */
export function DeepDive({ title = 'Deep dive', children }: { title?: string; children: ReactNode }) {
  const deepDive = useSettings((s) => s.deepDive)
  const [manual, setManual] = useState<boolean | null>(null)
  const open = manual ?? deepDive
  return (
    <section className="not-prose my-6 rounded-2xl border border-purple-200 bg-purple-50/60 dark:border-purple-500/30 dark:bg-purple-500/5">
      <button
        onClick={() => setManual(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-purple-900 dark:text-purple-200"
      >
        <Microscope size={18} />
        <span className="flex-1">{title}</span>
        <span className="rounded-full bg-purple-200/70 px-2 py-0.5 text-xs dark:bg-purple-500/20">CCNA level</span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="prose prose-slate max-w-none px-4 pb-4 text-[15px] dark:prose-invert prose-headings:text-purple-950 dark:prose-headings:text-purple-100">
          {children}
        </div>
      )}
    </section>
  )
}
