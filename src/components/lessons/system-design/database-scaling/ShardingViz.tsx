import { useMemo, useState } from 'react'
import { ConsistentHashRing, hashModShard, movedFraction } from '@/engine/sd/sharding'
import { hash } from '@/engine/sd/random'
import { Badge, Button, Tabs } from '@/components/shared/ui'

type Method = 'mod' | 'ring'
const SHARD_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6']
const KEYS = Array.from({ length: 48 }, (_, i) => `user:${i * 7 + 3}`)
const BIG = Array.from({ length: 10000 }, (_, i) => `k${i}`)
const VNODES = 4 // few virtual nodes so the ring stays readable

const names = (n: number) => Array.from({ length: n }, (_, i) => `S${i + 1}`)
const owner = (method: Method, n: number) => {
  if (method === 'mod') return (k: string) => `S${hashModShard(k, n) + 1}`
  const ring = new ConsistentHashRing(names(n), VNODES)
  return (k: string) => ring.get(k)
}

export function ShardingViz() {
  const [method, setMethod] = useState<Method>('ring')
  const [n, setN] = useState(4)
  const [prevN, setPrevN] = useState<number | null>(null)

  const own = useMemo(() => owner(method, n), [method, n])
  const prevOwn = useMemo(() => (prevN ? owner(method, prevN) : null), [method, prevN])
  const moved = new Set(prevOwn ? KEYS.filter((k) => prevOwn(k) !== own(k)) : [])
  const bigMoved = useMemo(() => (prevN ? movedFraction(BIG, owner(method, prevN), owner(method, n)) : 0), [method, n, prevN])
  const ring = useMemo(() => new ConsistentHashRing(names(n), VNODES), [n])

  const change = (delta: number) => {
    const next = Math.max(2, Math.min(6, n + delta))
    if (next === n) return
    setPrevN(n)
    setN(next)
  }
  const color = (shard: string) => SHARD_COLORS[Number(shard.slice(1)) - 1]
  const angle = (h: number) => (h / 2 ** 32) * Math.PI * 2 - Math.PI / 2

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={method} onChange={(m) => { setMethod(m); setPrevN(null) }} options={[{ value: 'mod', label: 'hash(key) % N' }, { value: 'ring', label: 'Consistent hashing' }]} />
        <Button size="sm" onClick={() => change(1)} disabled={n >= 6}>+ Add shard</Button>
        <Button size="sm" onClick={() => change(-1)} disabled={n <= 2}>− Remove shard</Button>
        <span className="font-mono text-sm">{n} shards</span>
      </div>

      {method === 'ring' ? (
        <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-md" role="img" aria-label="Consistent hash ring">
          <circle cx={200} cy={200} r={150} fill="none" strokeWidth={10} className="stroke-slate-200 dark:stroke-slate-800" />
          {ring.points().map((p, i) => {
            const a = angle(p.pos)
            return <rect key={i} x={200 + Math.cos(a) * 150 - 7} y={200 + Math.sin(a) * 150 - 7} width={14} height={14} rx={3} fill={color(p.node)} className="stroke-white dark:stroke-slate-900" strokeWidth={2} />
          })}
          {KEYS.map((k) => {
            const a = angle(hash(k))
            const r = moved.has(k) ? 118 : 125
            return <circle key={k} cx={200 + Math.cos(a) * r} cy={200 + Math.sin(a) * r} r={moved.has(k) ? 6 : 4} fill={color(own(k))} stroke={moved.has(k) ? '#000' : 'none'} strokeWidth={1.5} />
          })}
          <text x={200} y={196} textAnchor="middle" className="fill-slate-700 text-[13px] font-semibold dark:fill-slate-200">Hash ring</text>
          <text x={200} y={214} textAnchor="middle" className="fill-slate-500 text-[11px]">key → next square clockwise</text>
        </svg>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {names(n).map((s) => (
            <div key={s} className="rounded-xl border-2 p-2" style={{ borderColor: color(s) }}>
              <div className="mb-1 text-center text-xs font-bold" style={{ color: color(s) }}>{s}</div>
              <div className="flex flex-wrap justify-center gap-1">
                {KEYS.filter((k) => own(k) === s).map((k) => (
                  <span key={k} className={`h-3 w-3 rounded-full ${moved.has(k) ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} style={{ background: color(s) }} title={k} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {prevN ? (
          <>
            <span>Went from {prevN} → {n} shards.</span>
            <Badge color={bigMoved > 0.5 ? 'red' : 'green'}>{Math.round(bigMoved * 100)}% of keys had to move</Badge>
            <span className="text-slate-500">(outlined dots; measured over 10,000 keys)</span>
          </>
        ) : (
          <span className="text-slate-500">Add or remove a shard to see how many keys must move to a different server.</span>
        )}
      </div>
    </div>
  )
}
