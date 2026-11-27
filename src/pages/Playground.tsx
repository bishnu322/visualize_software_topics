import { Grid } from '@react-three/drei'
import { Cable, Laptop, Monitor, MousePointer2, Router, Server, Trash2, Network as SwitchIcon, Send, Eraser, LayoutTemplate } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Device, Link, Packet, SceneCanvas } from '@/components/three'
import { edgeKey, findPath, type TEdge, type TNode, type Topology } from '@/engine/topology'
import type { DeviceType } from '@/engine/types'
import { Badge, Button } from '@/components/ui'
import { useIsDark } from '@/hooks/useTheme'

type Mode = { kind: 'select' } | { kind: 'place'; type: DeviceType } | { kind: 'connect' } | { kind: 'delete' }

const STORAGE_KEY = 'netviz-playground'
const PREFIX: Record<DeviceType, string> = { pc: 'PC', laptop: 'Laptop', router: 'R', switch: 'SW', server: 'Srv', cloud: 'Net' }
const COLORS: Record<DeviceType, string> = { pc: '#0ea5e9', laptop: '#22c55e', router: '#06b6d4', switch: '#6366f1', server: '#ec4899', cloud: '#94a3b8' }

const PRESET: Topology = {
  nodes: [
    { id: 'R1', type: 'router', pos: [0, 0, -4] },
    { id: 'SW1', type: 'switch', pos: [-4, 0, 0] },
    { id: 'SW2', type: 'switch', pos: [4, 0, 0] },
    { id: 'PC1', type: 'pc', pos: [-6, 0, 4] },
    { id: 'PC2', type: 'pc', pos: [-2, 0, 4] },
    { id: 'Laptop1', type: 'laptop', pos: [2, 0, 4] },
    { id: 'Srv1', type: 'server', pos: [6, 0, 4] },
  ],
  edges: [
    { a: 'R1', b: 'SW1' },
    { a: 'R1', b: 'SW2' },
    { a: 'SW1', b: 'PC1' },
    { a: 'SW1', b: 'PC2' },
    { a: 'SW2', b: 'Laptop1' },
    { a: 'SW2', b: 'Srv1' },
  ],
}

function load(): Topology {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const t = JSON.parse(raw) as Topology
      if (Array.isArray(t.nodes) && Array.isArray(t.edges)) return t
    }
  } catch {
    /* storage unavailable, fall back to preset */
  }
  return PRESET
}

export default function Playground() {
  const dark = useIsDark()
  const [topo, setTopo] = useState<Topology>(load)
  const [mode, setMode] = useState<Mode>({ kind: 'select' })
  const [pending, setPending] = useState<string | null>(null)
  const [src, setSrc] = useState('')
  const [dst, setDst] = useState('')
  const [ping, setPing] = useState<{ id: number; path: string[] } | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topo))
    } catch {
      /* ignore */
    }
  }, [topo])

  const pos = useMemo(() => Object.fromEntries(topo.nodes.map((n) => [n.id, n.pos])), [topo])
  const endpoints = topo.nodes.filter((n) => n.type !== 'switch' && n.type !== 'router')
  const pingSrc = src && pos[src] ? src : endpoints[0]?.id ?? ''
  const pingDst = dst && pos[dst] && dst !== pingSrc ? dst : endpoints.find((n) => n.id !== pingSrc)?.id ?? ''

  const addLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 6))

  const nextId = (type: DeviceType) => {
    let i = 1
    while (topo.nodes.some((n) => n.id === `${PREFIX[type]}${i}`)) i++
    return `${PREFIX[type]}${i}`
  }

  const place = (x: number, z: number) => {
    if (mode.kind !== 'place') return
    const p: [number, number, number] = [Math.round(x), 0, Math.round(z)]
    if (topo.nodes.some((n) => Math.hypot(n.pos[0] - p[0], n.pos[2] - p[2]) < 1.5)) return
    const node: TNode = { id: nextId(mode.type), type: mode.type, pos: p }
    setTopo((t) => ({ ...t, nodes: [...t.nodes, node] }))
    addLog(`Added ${node.id}`)
  }

  const clickDevice = (id: string) => {
    if (mode.kind === 'delete') {
      setTopo((t) => ({ nodes: t.nodes.filter((n) => n.id !== id), edges: t.edges.filter((e) => e.a !== id && e.b !== id) }))
      addLog(`Removed ${id}`)
    } else if (mode.kind === 'connect') {
      if (!pending) setPending(id)
      else if (pending === id) setPending(null)
      else {
        const k = edgeKey(pending, id)
        if (!topo.edges.some((e) => edgeKey(e.a, e.b) === k)) {
          const edge: TEdge = { a: pending, b: id }
          setTopo((t) => ({ ...t, edges: [...t.edges, edge] }))
          addLog(`Connected ${pending} ↔ ${id}`)
        }
        setPending(null)
      }
    }
  }

  const sendPing = () => {
    if (!pingSrc || !pingDst) return
    const path = findPath(topo, pingSrc, pingDst)
    if (path.length < 2) {
      setPing(null)
      addLog(`✗ ${pingSrc} → ${pingDst}: Destination host unreachable`)
    } else {
      setPing({ id: Date.now(), path })
      addLog(`✓ ${pingSrc} → ${pingDst}: reply via ${path.join(' → ')} (${path.length - 1} hops)`)
    }
  }

  const tool = (m: Mode, icon: ReactNode, label: string) => {
    const active = m.kind === mode.kind && (m.kind !== 'place' || (mode.kind === 'place' && mode.type === m.type))
    return (
      <Button
        size="sm"
        variant={active ? 'primary' : 'secondary'}
        onClick={() => {
          setMode(m)
          setPending(null)
        }}
        title={label}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Button>
    )
  }

  const hint =
    mode.kind === 'place' ? `Click the floor to place a ${mode.type}.`
    : mode.kind === 'connect' ? (pending ? `Now click a second device to connect it to ${pending}.` : 'Click a device, then another, to run a cable.')
    : mode.kind === 'delete' ? 'Click a device or cable to delete it.'
    : 'Drag to rotate the view. Pick a tool to edit the network.'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Network Playground</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Build your own topology, cable it up, and ping between devices. Your network is saved in this browser.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 p-3 dark:border-slate-800">
          {tool({ kind: 'select' }, <MousePointer2 size={16} />, 'View')}
          <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          {tool({ kind: 'place', type: 'pc' }, <Monitor size={16} />, 'PC')}
          {tool({ kind: 'place', type: 'laptop' }, <Laptop size={16} />, 'Laptop')}
          {tool({ kind: 'place', type: 'server' }, <Server size={16} />, 'Server')}
          {tool({ kind: 'place', type: 'switch' }, <SwitchIcon size={16} />, 'Switch')}
          {tool({ kind: 'place', type: 'router' }, <Router size={16} />, 'Router')}
          <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          {tool({ kind: 'connect' }, <Cable size={16} />, 'Cable')}
          {tool({ kind: 'delete' }, <Trash2 size={16} />, 'Delete')}
          <span className="ml-auto flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => { setTopo(PRESET); setPing(null) }} title="Load example"><LayoutTemplate size={16} /><span className="hidden md:inline">Example</span></Button>
            <Button size="sm" variant="ghost" onClick={() => { setTopo({ nodes: [], edges: [] }); setPing(null) }} title="Clear all"><Eraser size={16} /><span className="hidden md:inline">Clear</span></Button>
          </span>
        </div>
        <div className="bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">{hint}</div>

        <SceneCanvas camera={[0, 12, 12]} className="!h-[420px] sm:!h-[520px]">
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onClick={(e) => { e.stopPropagation(); place(e.point.x, e.point.z) }}>
            <planeGeometry args={[30, 30]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          <Grid args={[30, 30]} cellSize={1} sectionSize={5} cellColor={dark ? '#1e293b' : '#e2e8f0'} sectionColor={dark ? '#334155' : '#cbd5e1'} fadeDistance={35} position={[0, -0.005, 0]} />
          {topo.edges.map((e) =>
            pos[e.a] && pos[e.b] ? (
              <Link
                key={edgeKey(e.a, e.b)}
                from={pos[e.a]}
                to={pos[e.b]}
                active={!!ping && ping.path.some((p, i) => i > 0 && edgeKey(ping.path[i - 1], p) === edgeKey(e.a, e.b))}
                onClick={mode.kind === 'delete' ? () => setTopo((t) => ({ ...t, edges: t.edges.filter((x) => edgeKey(x.a, x.b) !== edgeKey(e.a, e.b)) })) : undefined}
              />
            ) : null,
          )}
          {topo.nodes.map((n) => (
            <Device
              key={n.id}
              type={n.type}
              position={n.pos}
              label={n.id}
              color={COLORS[n.type]}
              active={pending === n.id || n.id === pingSrc && !!ping || n.id === pingDst && !!ping}
              onClick={mode.kind === 'connect' || mode.kind === 'delete' ? () => clickDevice(n.id) : undefined}
            />
          ))}
          {ping && <Packet key={ping.id} points={ping.path.map((id) => pos[id]).filter(Boolean)} duration={0.6 * ping.path.length} label="ICMP echo" color="#f59e0b" />}
        </SceneCanvas>

        <div className="grid gap-4 border-t border-slate-200 p-4 md:grid-cols-2 dark:border-slate-800">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ping</div>
            {endpoints.length < 2 ? (
              <p className="text-sm text-slate-500">Add at least two PCs, laptops or servers to ping between.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select value={pingSrc} onChange={(e) => setSrc(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-800">
                  {endpoints.map((n) => <option key={n.id}>{n.id}</option>)}
                </select>
                <span>→</span>
                <select value={pingDst} onChange={(e) => setDst(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-800">
                  {endpoints.filter((n) => n.id !== pingSrc).map((n) => <option key={n.id}>{n.id}</option>)}
                </select>
                <Button size="sm" variant="primary" onClick={sendPing}><Send size={14} /> Ping</Button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>{topo.nodes.length} devices</Badge>
              <Badge>{topo.edges.length} cables</Badge>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Console</div>
            <div className="h-28 overflow-y-auto rounded-lg bg-slate-950 p-2 font-mono text-xs text-emerald-400">
              {log.length === 0 ? <span className="text-slate-500">$ waiting for activity…</span> : log.map((l, i) => <div key={i} className={l.startsWith('✗') ? 'text-red-400' : ''}>{l}</div>)}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Simplification: this sandbox finds the shortest cabled path. A real network also needs correct IP addressing, subnets and routing tables; those are covered in the lessons.
      </p>
    </div>
  )
}
