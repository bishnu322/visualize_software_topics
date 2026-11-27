import { useMemo, useState } from 'react'
import { horizontalMetrics, SIZES, verticalMetrics } from '@/engine/sd/capacity'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Tabs } from '@/components/shared/ui'

type Mode = 'vertical' | 'horizontal'

const LB: [number, number, number] = [0, 0, 0]

export function ScalingViz() {
  const [mode, setMode] = useState<Mode>('vertical')
  const [rps, setRps] = useState(300)
  const [size, setSize] = useState(0)
  const [count, setCount] = useState(1)
  const m = mode === 'vertical' ? verticalMetrics(rps, size) : horizontalMetrics(rps, count)
  const failing = m.errorRate > 0
  const slow = !failing && m.utilisation > 0.75
  const clients = Math.min(6, 1 + Math.floor(rps / 400))

  const clientPos = useMemo(
    () => Array.from({ length: clients }, (_, i): [number, number, number] => [-6, 0, (i - (clients - 1) / 2) * 1.6]),
    [clients],
  )
  const serverPos = useMemo<[number, number, number][]>(
    () =>
      mode === 'vertical'
        ? [[4, 0, 0]]
        : Array.from({ length: count }, (_, i) => {
            const cols = Math.ceil(count / 5)
            const col = Math.floor(i / 5)
            const row = i % 5
            const rows = Math.min(5, count - col * 5)
            return [3.5 + col * 1.8 - (cols - 1) * 0.9, 0, (row - (rows - 1) / 2) * 1.5]
          }),
    [mode, count],
  )
  const packetColor = failing ? '#ef4444' : slow ? '#f59e0b' : '#22c55e'
  const status = failing ? { c: 'red' as const, t: `Overloaded: ${Math.round(m.errorRate * 100)}% of requests fail` } : slow ? { c: 'amber' as const, t: 'Busy: latency climbing' } : { c: 'green' as const, t: 'Healthy' }

  return (
    <VizFrame title="Scale up or scale out?" hint="Raise the traffic until it breaks, then fix it">
      <div className="flex flex-wrap items-center gap-4 px-4 pt-3">
        <Tabs value={mode} onChange={setMode} options={[{ value: 'vertical', label: 'Vertical (bigger)' }, { value: 'horizontal', label: 'Horizontal (more)' }]} />
        <label className="min-w-52 flex-1 text-sm">
          <span className="flex justify-between font-medium"><span>Traffic</span><span className="font-mono">{rps.toLocaleString()} req/s</span></span>
          <input type="range" min={50} max={4000} step={50} value={rps} onChange={(e) => setRps(Number(e.target.value))} className="w-full accent-sky-500" />
        </label>
      </div>
      <SceneCanvas camera={[0, 8, 11]}>
        {mode === 'horizontal' && <Device type="loadbalancer" position={LB} label="Load balancer" color="#22c55e" />}
        {clientPos.map((p, i) => (
          <group key={`c${i}`}>
            <Device type="laptop" position={p} color="#64748b" />
            <Link from={p} to={mode === 'vertical' ? serverPos[0] : LB} />
          </group>
        ))}
        {mode === 'horizontal' && serverPos.map((p, i) => <Link key={`l${i}`} from={LB} to={p} />)}
        {serverPos.map((p, i) => (
          <Device
            key={`s${i}`}
            type="server"
            position={p}
            scale={mode === 'vertical' ? 0.8 + size * 0.22 : 0.75}
            color={failing ? '#ef4444' : slow ? '#f59e0b' : '#0ea5e9'}
            label={mode === 'vertical' ? `${SIZES[size].vcpu} vCPU` : i === 0 ? `${count}× 4 vCPU` : undefined}
            active={failing}
          />
        ))}
        {clientPos.map((p, i) => (
          <Packet
            key={`p${mode}-${i}-${count}-${clients}`}
            points={mode === 'vertical' ? [p, serverPos[0]] : [p, LB, serverPos[i % serverPos.length]]}
            duration={1.2 + i * 0.17}
            color={packetColor}
            loop
          />
        ))}
      </SceneCanvas>
      <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
        {mode === 'vertical' ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Machine size:</span>
            {SIZES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSize(i)}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${i === size ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700'}`}
              >
                {s.vcpu} vCPU
              </button>
            ))}
            {size === SIZES.length - 1 && <Badge color="purple">Largest machine available: no further vertical scaling</Badge>}
          </div>
        ) : (
          <label className="block text-sm">
            <span className="flex justify-between font-medium"><span>Number of servers</span><span className="font-mono">{count}</span></span>
            <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-sky-500" />
          </label>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat k="Capacity" v={`${m.capacity.toLocaleString()} req/s`} />
          <Stat k="Load vs capacity"v={`${Math.min(999, Math.round(m.utilisation * 100))}%`} bar={Math.min(1, m.utilisation)} />
          <Stat k="Avg latency" v={`${m.latencyMs} ms`} />
          <Stat k="Monthly cost" v={`$${m.cost.toLocaleString()}`} />
        </div>
        <Badge color={status.c}>{status.t}</Badge>
      </div>
    </VizFrame>
  )
}

function Stat({ k, v, bar }: { k: string; v: string; bar?: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500">{k}</div>
      <div className="font-mono font-semibold">{v}</div>
      {bar !== undefined && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full ${bar >= 1 ? 'bg-red-500' : bar > 0.75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${bar * 100}%` }} />
        </div>
      )}
    </div>
  )
}
