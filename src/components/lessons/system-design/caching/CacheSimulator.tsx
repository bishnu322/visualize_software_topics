import { Pause, Play, RotateCcw } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { cacheAsideRead, makeCache, type Cache, type EvictionPolicy } from '@/engine/sd/cache'
import { rng, zipf } from '@/engine/sd/random'
import { useTicker } from '@/hooks/useTicker'
import { LineChart } from '@/components/shared/viz/LineChart'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Button, Tabs } from '@/components/shared/ui'

const KEYS = 60

interface Stats {
  hits: number
  misses: number
  totalLatency: number
  last: { key: number; hit: boolean; evicted?: number } | null
  ratio: number[]
}
const empty = (): Stats => ({ hits: 0, misses: 0, totalLatency: 0, last: null, ratio: [] })

export function CacheSimulator() {
  const [policy, setPolicy] = useState<EvictionPolicy>('LRU')
  const [size, setSize] = useState(8)
  const cache = useRef<Cache<number>>(makeCache(policy, size))
  const next = useMemo(() => zipf(KEYS, 1.0, rng(3)), [])
  const [s, setS] = useState<Stats>(empty)

  const restart = (p = policy, n = size) => {
    cache.current = makeCache<number>(p, n)
    setS(empty())
  }

  const ticker = useTicker(() => {
    const key = next()
    const r = cacheAsideRead(cache.current, key)
    setS((p) => {
      const hits = p.hits + (r.hit ? 1 : 0)
      const misses = p.misses + (r.hit ? 0 : 1)
      return { hits, misses, totalLatency: p.totalLatency + r.latency, last: { key, hit: r.hit, evicted: r.evicted }, ratio: [...p.ratio, (hits / (hits + misses)) * 100].slice(-120) }
    })
  }, 250)

  const total = s.hits + s.misses
  const keys = cache.current.keys()
  const last = s.last

  return (
    <VizFrame title="Cache simulator (cache-aside)" hint="Popular keys are requested far more often, like real traffic">
      <div className="flex flex-wrap items-center gap-4 px-4 pt-3">
        <Tabs value={policy} onChange={(p) => { setPolicy(p); restart(p, size) }} options={[{ value: 'LRU', label: 'LRU' }, { value: 'LFU', label: 'LFU' }]} />
        <label className="min-w-48 flex-1 text-sm">
          <span className="flex justify-between font-medium"><span>Cache size</span><span className="font-mono">{size} of {KEYS} keys</span></span>
          <input type="range" min={1} max={30} value={size} onChange={(e) => { const n = Number(e.target.value); setSize(n); restart(policy, n) }} className="w-full accent-sky-500" />
        </label>
      </div>

      {/* App → Cache → DB pipeline */}
      <div className="grid grid-cols-3 items-center gap-2 p-4 text-center text-sm">
        <Box title="App" sub={last ? `GET key ${last.key}` : 'idle'} active={!!last} />
        <Box title="Cache" sub={last ? (last.hit ? 'HIT · 1 ms' : 'MISS') : '1 ms'} tone={last ? (last.hit ? 'hit' : 'miss') : undefined} />
        <Box title="Database" sub={last && !last.hit ? 'read · 50 ms' : '50 ms'} active={!!last && !last.hit} />
      </div>

      <div className="px-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cache contents {policy === 'LRU' ? '(least recently used first →  evicted next)' : '(fewest uses evicted next)'}
        </div>
        <div className="flex min-h-9 flex-wrap gap-1">
          {keys.map((k) => (
            <span
              key={k}
              className={`flex h-8 w-9 items-center justify-center rounded-md font-mono text-xs font-semibold transition-colors ${
                last?.key === k ? (last.hit ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white') : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {k}
            </span>
          ))}
          {Array.from({ length: Math.max(0, size - keys.length) }, (_, i) => (
            <span key={`e${i}`} className="h-8 w-9 rounded-md border border-dashed border-slate-300 dark:border-slate-700" />
          ))}
        </div>
        <p className="mt-1 h-5 text-xs text-slate-500">{last?.evicted !== undefined ? `Evicted key ${last.evicted} to make room for ${last.key}` : ''}</p>
      </div>

      <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-[1fr_200px] dark:border-slate-800">
        <div>
          <div className="mb-1 text-sm font-semibold">Hit ratio over time</div>
          <LineChart label="Hit ratio over time" series={[{ name: 'hit ratio', values: s.ratio }]} yMax={100} format={(v) => `${Math.round(v)}%`} xLabel="requests" />
        </div>
        <dl className="grid grid-cols-2 content-start gap-2 text-sm sm:grid-cols-1">
          <Stat k="Hit ratio" v={total ? `${Math.round((s.hits / total) * 100)}%` : '–'} />
          <Stat k="Avg latency" v={total ? `${(s.totalLatency / total).toFixed(1)} ms` : '–'} />
          <Stat k="DB reads saved" v={`${s.hits} of ${total}`} />
        </dl>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <Button size="sm" variant="primary" onClick={ticker.toggle}>
          {ticker.running ? <Pause size={16} /> : <Play size={16} />} {ticker.running ? 'Pause' : 'Send requests'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => restart()}><RotateCcw size={16} /> Reset</Button>
      </div>
    </VizFrame>
  )
}

function Box({ title, sub, active, tone }: { title: string; sub: string; active?: boolean; tone?: 'hit' | 'miss' }) {
  const cls =
    tone === 'hit' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
    : tone === 'miss' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
    : active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
    : 'border-slate-200 dark:border-slate-700'
  return (
    <div className={`rounded-xl border-2 p-3 transition-colors ${cls}`}>
      <div className="font-bold">{title}</div>
      <div className="font-mono text-xs text-slate-600 dark:text-slate-300">{sub}</div>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="font-mono font-semibold">{v}</dd>
    </div>
  )
}
