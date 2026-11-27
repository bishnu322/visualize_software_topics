import { ArrowLeftRight, Trash2, X } from 'lucide-react'
import { Button, Panel } from '@/components/shared/ui'
import { SIZES } from '@/engine/sd/capacity'
import { COMPONENTS } from '@/engine/sd/designer/components'
import { fmtAvail, fmtGb, fmtMoney, fmtNum } from '@/engine/sd/designer/format'
import { Field, NumberField, Stat, inputCls } from './fields'
import { KIND_ICONS } from './kindIcons'
import type { DesignerState } from './useDesigner'

export function InspectorPanel({ d }: { d: DesignerState }) {
  const n = d.selectedNode
  if (!n) {
    return (
      <Panel title="Inspector">
        <p className="text-sm text-slate-500">Click a component in the scene to size it and see its load.</p>
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          <li><span className="font-semibold text-red-500">Red</span> = overloaded, <span className="font-semibold text-amber-500">amber</span> = above 80% busy.</li>
          <li><b>⚠</b> = single point of failure.</li>
          <li>Faded = gets no traffic (check the arrows).</li>
        </ul>
      </Panel>
    )
  }
  const spec = COMPONENTS[n.kind]
  const Icon = KIND_ICONS[n.kind]
  const m = d.report.nodes[n.id]
  const c = n.config
  const set = (patch: Partial<typeof c>) => d.updateConfig(n.id, patch)
  const links = d.design.edges.filter((e) => e.from === n.id || e.to === n.id)
  const util = m && Number.isFinite(m.capacity) ? m.utilisation : null

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Icon size={14} style={{ color: spec.color }} /> {n.id} · {spec.label}
          <button className="ml-auto text-slate-400 hover:text-slate-600" onClick={() => d.setSelected(null)} aria-label="Close inspector"><X size={14} /></button>
        </span>
      }
    >
      <p className="text-xs text-slate-500">{spec.description}</p>

      {spec.fields.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {spec.fields.includes('instances') && <NumberField label="Instances" value={c.instances} min={1} max={50} onChange={(v) => set({ instances: Math.round(v) })} />}
          {spec.fields.includes('size') && (
            <Field label="Machine size">
              <select className={inputCls} value={c.size} onChange={(e) => set({ size: Number(e.target.value) })}>
                {SIZES.map((s, i) => <option key={s.name} value={i}>{s.name} ({s.vcpu} vCPU)</option>)}
              </select>
            </Field>
          )}
          {spec.fields.includes('replicas') && <NumberField label="Read replicas" hint="per shard" value={c.replicas} max={10} onChange={(v) => set({ replicas: Math.round(v) })} />}
          {spec.fields.includes('shards') && <NumberField label="Shards" value={c.shards} min={1} max={64} onChange={(v) => set({ shards: Math.round(v) })} />}
          {spec.fields.includes('limitRps') && <NumberField label="Limit (req/s)" value={c.limitRps} step={100} onChange={(v) => set({ limitRps: v })} />}
          {spec.fields.includes('hitRatio') && (
            <Field label="Hit ratio" hint={`${Math.round(c.hitRatio * 100)}%`}>
              <input type="range" className="w-full" min={0} max={0.99} step={0.01} value={c.hitRatio} onChange={(e) => set({ hitRatio: Number(e.target.value) })} />
            </Field>
          )}
        </div>
      )}

      {m && n.kind !== 'client' && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Stat label="Load" value={`${fmtNum(m.total)}/s`} />
          <Stat label="Capacity" value={Number.isFinite(m.capacity) ? `${fmtNum(m.capacity)}/s` : '∞'} />
          <Stat label="Busy" value={util === null ? 'n/a' : `${Math.round(util * 100)}%`} tone={util === null ? undefined : util > 1 ? 'bad' : util > 0.8 ? 'warn' : 'good'} />
          <Stat label="Latency" value={`${m.latencyMs.toFixed(m.latencyMs < 10 ? 1 : 0)} ms`} />
          <Stat label="Uptime" value={fmtAvail(m.availability)} tone={m.spof ? 'warn' : undefined} />
          <Stat label="Cost/mo" value={fmtMoney(m.cost)} />
          {m.total > 0 && (
            <p className="col-span-3 text-[11px] text-slate-500">
              {fmtNum(m.load.read)} reads · {fmtNum(m.load.static)} static · {fmtNum(m.load.write)} writes per second
              {m.storedGb > 0 && ` · stores ${fmtGb(m.storedGb)} of ${fmtGb(m.storageCapacityGb)}`}
            </p>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Connections</div>
          {links.map((e) => (
            <div key={`${e.from}>${e.to}`} className="flex items-center gap-1 font-mono text-xs">
              <span className="flex-1">{e.from} → {e.to}</span>
              <button className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800" title="Flip direction" onClick={() => d.reverseEdge(e.from, e.to)}><ArrowLeftRight size={13} /></button>
              <button className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-500 dark:hover:bg-slate-800" title="Remove connection" onClick={() => d.deleteEdge(e.from, e.to)}><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <Button size="sm" variant="ghost" className="mt-3 text-red-600 dark:text-red-400" onClick={() => d.removeNode(n.id)}>
        <Trash2 size={14} /> Remove {n.id}
      </Button>
    </Panel>
  )
}
