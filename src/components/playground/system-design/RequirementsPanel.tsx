import { Lightbulb } from 'lucide-react'
import { Button, Panel } from '@/components/shared/ui'
import { CHALLENGES } from '@/engine/sd/designer/challenges'
import { fmtGb, fmtNum } from '@/engine/sd/designer/format'
import { Field, Group, NumberField, inputCls } from './fields'
import type { DesignerState } from './useDesigner'

const NINES = [99, 99.5, 99.9, 99.95, 99.99, 99.999]

export function RequirementsPanel({ d }: { d: DesignerState }) {
  const { req, setReq, challenge } = d
  const { derived } = d.report
  return (
    <Panel title="Requirements">
      <div className="space-y-3">
        <Field label="Challenge">
          <select className={inputCls} value={challenge?.id ?? ''} onChange={(e) => d.pickChallenge(e.target.value || null)}>
            <option value="">Free design (your own requirements)</option>
            {CHALLENGES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>
        {challenge && (
          <div className="rounded-lg bg-brand-50 p-2 text-xs text-slate-700 dark:bg-brand-500/10 dark:text-slate-300">
            {challenge.brief}
            <Button size="sm" variant="ghost" className="mt-1 !h-7 !px-1.5 text-xs" onClick={d.showSolution}>
              <Lightbulb size={14} /> Show a solution
            </Button>
          </div>
        )}

        <Group title="Traffic">
          <NumberField label="Daily active users" value={req.dau} step={100000} onChange={(v) => setReq({ dau: v })} />
          <NumberField label="Requests / user / day" value={req.requestsPerUser} onChange={(v) => setReq({ requestsPerUser: v })} />
          <NumberField label="Peak ÷ average" value={req.peakFactor} min={1} step={0.5} onChange={(v) => setReq({ peakFactor: v })} />
          <NumberField label="Reads per write" hint={`${fmtNum(req.readRatio)}:1`} value={req.readRatio} step={1} onChange={(v) => setReq({ readRatio: v })} />
          <NumberField label="Static content %" hint="of reads" value={req.staticPct} max={100} onChange={(v) => setReq({ staticPct: v })} />
          <Field label="Peak RPS override" hint="blank = auto">
            <input
              type="number"
              className={inputCls}
              min={0}
              value={req.rpsOverride ?? ''}
              placeholder={fmtNum(derived.avgRps * req.peakFactor)}
              onChange={(e) => setReq({ rpsOverride: Number.isFinite(e.target.valueAsNumber) && e.target.valueAsNumber > 0 ? e.target.valueAsNumber : null })}
            />
          </Field>
          <p className="col-span-2 text-xs text-slate-500">
            Peak ≈ <b className="font-mono">{fmtNum(derived.peakRps)}</b> req/s: {fmtNum(derived.readRps)} reads ({fmtNum(derived.staticRps)} static) + {fmtNum(derived.writeRps)} writes
          </p>
        </Group>

        <Group title="Latency (p99)">
          <NumberField label="Reads ≤ ms" value={req.readLatencyMs} onChange={(v) => setReq({ readLatencyMs: v })} />
          <NumberField label="Writes ≤ ms" value={req.writeLatencyMs} onChange={(v) => setReq({ writeLatencyMs: v })} />
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={req.asyncWrites} onChange={(e) => setReq({ asyncWrites: e.target.checked })} />
            Writes may be processed asynchronously (eventual consistency)
          </label>
        </Group>

        <Group title="Availability & storage">
          <Field label="Uptime target">
            <select className={inputCls} value={req.availability} onChange={(e) => setReq({ availability: Number(e.target.value) })}>
              {NINES.map((n) => <option key={n} value={n}>{n}%</option>)}
            </select>
          </Field>
          <NumberField label="Retention (years)" value={req.retentionYears} step={1} onChange={(v) => setReq({ retentionYears: v })} />
          <NumberField label="Size per write (KB)" value={req.objectSizeKb} step={0.5} onChange={(v) => setReq({ objectSizeKb: v })} />
          <div className="self-end pb-1.5 text-xs text-slate-500">
            ≈ <b className="font-mono">{fmtGb(derived.storageGb)}</b> to store
          </div>
        </Group>

        <Group title="Cost">
          <NumberField label="Monthly budget ($)" value={req.budget} step={100} onChange={(v) => setReq({ budget: v })} />
        </Group>
      </div>
    </Panel>
  )
}
