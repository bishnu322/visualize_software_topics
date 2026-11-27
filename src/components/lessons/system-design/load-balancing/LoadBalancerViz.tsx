import { Pause, Play, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { LoadBalancer, type LbAlgorithm, type LbServer } from '@/engine/sd/lb'
import { rng } from '@/engine/sd/random'
import { useTicker } from '@/hooks/useTicker'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Button, Tabs } from '@/components/shared/ui'

const ALGOS: { value: LbAlgorithm; label: string; note: string }[] = [
  { value: 'round-robin', label: 'Round robin', note: 'Takes turns: 1, 2, 3, 4, 1, 2… Simple, but ignores how busy each server is.' },
  { value: 'least-connections', label: 'Least connections', note: 'Sends each request to the server with the fewest in-flight requests. Great when some requests are slow.' },
  { value: 'weighted', label: 'Weighted', note: 'S1 is a bigger machine (weight 3), so it gets 3× the traffic of the others.' },
  { value: 'ip-hash', label: 'IP hash', note: 'hash(client IP) picks the server, so each client always lands on the same one ("sticky sessions").' },
]

const CLIENTS = ['10.0.0.11', '10.0.0.27', '10.0.0.42', '10.0.0.58', '10.0.0.73']
const CLIENT_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ec4899']
const LB_POS: [number, number, number] = [0, 0, 0]
const clientPos = (i: number): [number, number, number] => [-6, 0, (i - 2) * 1.7]
const serverPos = (i: number): [number, number, number] => [5.5, 0, (i - 1.5) * 2.2]

const freshServers = (): LbServer[] =>
  [3, 1, 1, 1].map((w, i) => ({ id: `S${i + 1}`, weight: w, healthy: true, active: 0, total: 0 }))

interface Req {
  id: number
  client: number
  server: number
  left: number
}

export function LoadBalancerViz() {
  const [algo, setAlgo] = useState<LbAlgorithm>('round-robin')
  const lb = useRef(new LoadBalancer(freshServers()))
  const random = useRef(rng(7))
  const inflight = useRef<Req[]>([])
  const nextId = useRef(1)
  const [, force] = useState(0)
  const [recent, setRecent] = useState<Req[]>([])
  const [dropped, setDropped] = useState(0)

  const tick = () => {
    // finish requests
    inflight.current = inflight.current.filter((r) => {
      r.left--
      if (r.left <= 0) lb.current.finish(r.server)
      return r.left > 0
    })
    // new request from a random client; ~1 in 4 is a slow "heavy" request
    const client = Math.floor(random.current() * CLIENTS.length)
    const server = lb.current.pick(algo, CLIENTS[client])
    if (server < 0) {
      setDropped((d) => d + 1)
    } else {
      const heavy = random.current() < 0.25
      const req = { id: nextId.current++, client, server, left: heavy ? 12 : 2 }
      inflight.current.push(req)
      setRecent((r) => [...r, req].slice(-5))
    }
    force((n) => n + 1)
  }
  const ticker = useTicker(tick, 650)

  const reset = () => {
    lb.current = new LoadBalancer(freshServers())
    inflight.current = []
    setRecent([])
    setDropped(0)
    force((n) => n + 1)
  }
  const toggleServer = (i: number) => {
    const s = lb.current.servers[i]
    s.healthy = !s.healthy
    if (!s.healthy) {
      // in-flight requests on a dead server are lost
      inflight.current = inflight.current.filter((r) => r.server !== i)
      s.active = 0
    }
    force((n) => n + 1)
  }

  const servers = lb.current.servers
  const maxTotal = Math.max(1, ...servers.map((s) => s.total))
  const note = ALGOS.find((a) => a.value === algo)!.note

  return (
    <VizFrame title="Load balancer simulator" hint="Press start · click a server to crash or revive it">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Tabs value={algo} onChange={setAlgo} options={ALGOS.map((a) => ({ value: a.value, label: a.label }))} />
      </div>
      <p className="px-4 pt-2 text-sm text-slate-600 dark:text-slate-300">{note}</p>
      <SceneCanvas camera={[0, 9, 10]}>
        <Device type="loadbalancer" position={LB_POS} label="Load balancer" color="#22c55e" active={ticker.running} />
        {CLIENTS.map((ip, i) => (
          <group key={ip}>
            <Device type="laptop" position={clientPos(i)} color={CLIENT_COLORS[i]} label={`.${ip.split('.')[3]}`} />
            <Link from={clientPos(i)} to={LB_POS} />
          </group>
        ))}
        {servers.map((s, i) => (
          <group key={s.id}>
            <Link from={LB_POS} to={serverPos(i)} broken={!s.healthy} />
            <Device
              type="server"
              position={serverPos(i)}
              scale={s.weight > 1 && algo === 'weighted' ? 1 : 0.8}
              color={s.healthy ? '#0ea5e9' : '#ef4444'}
              muted={!s.healthy}
              label={s.healthy ? `${s.id} · ${s.active} active` : `${s.id} · DOWN`}
              onClick={() => toggleServer(i)}
            />
          </group>
        ))}
        {recent.map((r) => (
          <Packet key={r.id} points={[clientPos(r.client), LB_POS, serverPos(r.server)]} duration={0.9} color={CLIENT_COLORS[r.client]} />
        ))}
      </SceneCanvas>
      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={ticker.toggle}>
            {ticker.running ? <Pause size={16} /> : <Play size={16} />} {ticker.running ? 'Pause' : 'Start traffic'}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw size={16} /> Reset</Button>
          {dropped > 0 && <Badge color="red">{dropped} requests failed: no healthy servers</Badge>}
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {servers.map((s) => (
            <div key={s.id} className={`rounded-lg p-2 text-xs ${s.healthy ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <div className="flex justify-between font-semibold">
                <span>{s.id}{algo === 'weighted' ? ` (w=${s.weight})` : ''}</span>
                <span className="font-mono">{s.healthy ? `${s.total} total` : 'down'}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(s.total / maxTotal) * 100}%` }} />
              </div>
              <div className="mt-1 text-slate-500">{s.active} in flight</div>
            </div>
          ))}
        </div>
      </div>
    </VizFrame>
  )
}
