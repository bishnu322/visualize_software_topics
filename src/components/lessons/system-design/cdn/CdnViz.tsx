import { Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EDGES, ORIGIN, requestLatency, USERS, type CdnResult, type Place } from '@/engine/sd/cdn'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Button } from '@/components/shared/ui'

/** Display nudges so places that are close on the globe (Virginia vs New York) don't overlap. */
const NUDGE: Record<string, [number, number]> = { origin: [-0.6, 1.3], ny: [0.6, -1.1] }

/** Equirectangular projection of lat/lon onto the floor plane, centred on the shown places. */
const at = (p: Place, y = 0): [number, number, number] => {
  const [dx, dz] = NUDGE[p.id] ?? [0, 0]
  return [(p.lon - 37) / 14.5 + dx, y, -(p.lat - 8) / 8 + dz]
}
const edgeAt = (p: Place): [number, number, number] => {
  const [x, y, z] = at(p)
  return [x + 0.9, y, z + 0.9]
}

export function CdnViz() {
  const [cdn, setCdn] = useState(false)
  const [cached, setCached] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Record<string, CdnResult>>({})
  const [wave, setWave] = useState(0)

  const send = () => {
    const r: Record<string, CdnResult> = {}
    for (const u of USERS) r[u.id] = requestLatency(u, cdn, cached.has(u.id))
    setResults(r)
    if (cdn) setCached(new Set(USERS.map((u) => u.id)))
    setWave((w) => w + 1)
  }
  const toggle = () => {
    setCdn((c) => !c)
    setResults({})
  }

  const max = Math.max(1, ...Object.values(results).map((r) => r.latency))

  return (
    <VizFrame title="Origin only vs CDN" hint="Send a request from every city, twice">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Button size="sm" variant={cdn ? 'primary' : 'secondary'} onClick={toggle}>{cdn ? 'CDN: ON' : 'CDN: OFF'}</Button>
        <Button size="sm" variant="primary" onClick={send}><Send size={14} /> Load the page from every city</Button>
        {cdn && (
          <Button size="sm" variant="ghost" onClick={() => { setCached(new Set()); setResults({}) }}><Trash2 size={14} /> Purge edge caches</Button>
        )}
      </div>
      <SceneCanvas camera={[0, 14, 10.5]} target={[0, 0, 0.5]}>
        {/* faint world plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[19, 12]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.06} />
        </mesh>
        <Device type="server" position={at(ORIGIN)} label="Origin" color="#ec4899" scale={0.8} />
        {USERS.map((u) => {
          const r = results[u.id]
          const edge = EDGES[u.id]
          const target = cdn ? edgeAt(edge) : at(ORIGIN)
          return (
            <group key={u.id}>
              <Device
                type="laptop"
                position={at(u)}
                label={u.name}
                sublabel={r ? `${r.latency} ms` : undefined}
                color={r ? (r.latency < 100 ? '#22c55e' : r.latency < 300 ? '#f59e0b' : '#ef4444') : '#64748b'}
                scale={0.7}
              />
              {cdn && (
                <>
                  <Device type="cache" position={edgeAt(edge)} color={cached.has(u.id) ? '#22c55e' : '#94a3b8'} scale={0.55} />
                  <Link from={edgeAt(edge)} to={at(ORIGIN)} color="#cbd5e1" active={r?.via === 'edge-miss'} />
                </>
              )}
              <Link from={at(u)} to={target} />
              {r && (
                <Packet
                  key={`${wave}-${u.id}`}
                  points={r.via === 'edge-miss' ? [at(u), edgeAt(edge), at(ORIGIN), edgeAt(edge), at(u)] : [at(u), target, at(u)]}
                  duration={Math.max(0.8, r.latency / 220)}
                  color={r.via === 'edge-hit' ? '#22c55e' : r.via === 'edge-miss' ? '#f59e0b' : '#ef4444'}
                  height={0.6}
                />
              )}
            </group>
          )
        })}
      </SceneCanvas>
      <div className="space-y-2 border-t border-slate-200 p-4 text-sm dark:border-slate-800">
        {Object.keys(results).length === 0 ? (
          <p className="text-slate-500">Press <b>Load the page</b>. Each page load needs about 3 round trips (TCP + TLS + HTTP).</p>
        ) : (
          USERS.map((u) => {
            const r = results[u.id]
            return (
              <div key={u.id} className="grid grid-cols-[110px_1fr_70px_90px] items-center gap-2">
                <span className="truncate">{u.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="block h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(r.latency / max) * 100}%` }} />
                </span>
                <span className="text-right font-mono">{r.latency} ms</span>
                <Badge color={r.via === 'edge-hit' ? 'green' : r.via === 'edge-miss' ? 'amber' : 'slate'}>
                  {r.via === 'edge-hit' ? 'edge HIT' : r.via === 'edge-miss' ? 'edge MISS' : 'origin'}
                </Badge>
              </div>
            )
          })
        )}
      </div>
    </VizFrame>
  )
}
