import { CircleAlert, CircleCheck, CircleX, Lightbulb } from 'lucide-react'
import { Badge, Panel } from '@/components/shared/ui'
import type { DesignerState } from './useDesigner'

export function ReportPanel({ d }: { d: DesignerState }) {
  const r = d.report
  if (!r.valid) {
    return (
      <Panel title="Design check">
        <ul className="space-y-2 text-sm">
          {r.errors.map((e) => (
            <li key={e} className="flex gap-2 text-amber-700 dark:text-amber-400"><CircleAlert size={16} className="mt-0.5 shrink-0" /> {e}</li>
          ))}
        </ul>
      </Panel>
    )
  }
  const tone = r.score === 100 ? 'green' : r.score >= 50 ? 'amber' : 'red'
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          Design check
          <Badge color={tone} className="ml-auto">{r.score === 100 ? 'All requirements met' : `${r.checks.filter((c) => c.pass).length}/${r.checks.length} met`}</Badge>
        </span>
      }
    >
      <ul className="space-y-1.5" data-testid="checks">
        {r.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.pass ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" /> : <CircleX size={16} className="mt-0.5 shrink-0 text-red-500" />}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 dark:text-slate-200">{c.label}</div>
              <div className="font-mono text-xs text-slate-500">{c.actual} <span className="text-slate-400">· target {c.target}</span></div>
            </div>
          </li>
        ))}
      </ul>

      {r.hints.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Suggestions</div>
          <ul className="space-y-1.5">
            {r.hints.slice(0, 8).map((h) => (
              <li key={h} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400"><Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" /> {h}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Toy model: per-machine capacities and prices are rough, latency grows with load (M/M/1 queueing), and p99 is taken across request paths.
      </p>
    </Panel>
  )
}
