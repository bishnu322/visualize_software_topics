import { useMemo, useState } from 'react'
import { buildTopology, edgeKey, findPath, TOPOLOGY_INFO, type TopologyKind } from '@/engine/topology'
import { Device, Link, Packet, SceneCanvas } from '@/components/three'
import { VizFrame } from '@/components/lesson/VizFrame'
import { Badge, Button, Tabs } from '@/components/ui'

const KINDS: TopologyKind[] = ['bus', 'star', 'ring', 'mesh', 'tree']

export function Topology3D({ initial = 'star' }: { initial?: TopologyKind }) {
  const [kind, setKind] = useState<TopologyKind>(initial)
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const [src, setSrc] = useState('PC1')
  const [dst, setDst] = useState('PC4')
  const [run, setRun] = useState(0)
  const topo = useMemo(() => buildTopology(kind, 6), [kind])
  const pos = useMemo(() => Object.fromEntries(topo.nodes.map((n) => [n.id, n.pos])), [topo])
  const path = useMemo(() => findPath(topo, src, dst, broken), [topo, src, dst, broken])
  const pcs = topo.nodes.filter((n) => n.type === 'pc')
  const info = TOPOLOGY_INFO[kind]

  const changeKind = (k: TopologyKind) => {
    setKind(k)
    setBroken(new Set())
    setRun(0)
  }
  const toggle = (a: string, b: string) => {
    const k = edgeKey(a, b)
    const next = new Set(broken)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setBroken(next)
  }
  const onPath = (a: string, b: string) => {
    for (let i = 0; i < path.length - 1; i++) if (edgeKey(path[i], path[i + 1]) === edgeKey(a, b)) return true
    return false
  }

  return (
    <VizFrame title="Topology explorer" hint="Click a cable to cut it · click a PC to pick the destination">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-3">
        <Tabs value={kind} onChange={changeKind} options={KINDS.map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) }))} />
      </div>
      <SceneCanvas camera={[0, 9, 9]}>
        {topo.edges.map((e) => (
          <Link
            key={edgeKey(e.a, e.b)}
            from={pos[e.a]}
            to={pos[e.b]}
            broken={broken.has(edgeKey(e.a, e.b))}
            active={run > 0 && onPath(e.a, e.b)}
            width={kind === 'bus' && e.a.startsWith('T') && e.b.startsWith('T') ? 5 : 2}
            onClick={() => toggle(e.a, e.b)}
          />
        ))}
        {topo.nodes.map((n) =>
          n.id.startsWith('T') && kind === 'bus' ? null : (
            <Device
              key={n.id}
              type={n.type}
              position={n.pos}
              label={n.id}
              color={n.id === src ? '#22c55e' : n.id === dst ? '#f59e0b' : '#0ea5e9'}
              active={n.id === src || n.id === dst}
              onClick={n.type === 'pc' && n.id !== src ? () => setDst(n.id) : undefined}
            />
          ),
        )}
        {run > 0 && path.length > 1 && <Packet key={`${run}-${path.join()}`} points={path.map((id) => pos[id])} duration={0.7 * path.length} label="ping" color="#f59e0b" />}
      </SceneCanvas>
      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>From</span>
          <select value={src} onChange={(e) => { const v = e.target.value; setSrc(v); if (v === dst) setDst(pcs.find((p) => p.id !== v)!.id); setRun(0) }} className="rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
            {pcs.map((p) => <option key={p.id}>{p.id}</option>)}
          </select>
          <span>to</span>
          <select value={dst} onChange={(e) => { setDst(e.target.value); setRun(0) }} className="rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
            {pcs.filter((p) => p.id !== src).map((p) => <option key={p.id}>{p.id}</option>)}
          </select>
          <Button size="sm" variant="primary" onClick={() => setRun((r) => r + 1)}>Send ping</Button>
          {broken.size > 0 && <Button size="sm" variant="ghost" onClick={() => setBroken(new Set())}>Repair all</Button>}
          <span className="ml-auto">
            {path.length > 1 ? (
              <Badge color="green">Reachable · {path.length - 1} hops</Badge>
            ) : (
              <Badge color="red">Unreachable!</Badge>
            )}
          </span>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="font-semibold text-emerald-600">Pros</div>
            <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">{info.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <div className="font-semibold text-red-500">Cons</div>
            <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">{info.cons.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <div className="font-semibold">Used in</div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{info.where}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{topo.edges.length} links · {broken.size} cut</p>
          </div>
        </div>
      </div>
    </VizFrame>
  )
}
