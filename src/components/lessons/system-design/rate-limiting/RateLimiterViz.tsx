import { Pause, Play, RotateCcw, Send, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { makeLimiter, type Limiter, type LimiterKind } from '@/engine/sd/rateLimit'
import { useTicker } from '@/hooks/useTicker'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Button, Tabs } from '@/components/shared/ui'

const LIMIT = 5
const WINDOW = 3000
const SPAN = 12000 // timeline length shown (ms)

const NOTES: Record<LimiterKind, string> = {
  'token-bucket': `Bucket holds ${LIMIT} tokens and refills 1 token every ${WINDOW / LIMIT / 1000}s. Each request spends a token. Bursts are fine until the bucket is empty.`,
  'fixed-window': `At most ${LIMIT} requests per ${WINDOW / 1000}s window, with the counter reset at fixed boundaries. Try a burst just before AND just after a boundary.`,
  'sliding-window': `At most ${LIMIT} requests in ANY ${WINDOW / 1000}s period (shaded). It remembers each request's timestamp, so there's no boundary loophole.`,
}

interface Hit {
  t: number
  ok: boolean
}

export function RateLimiterViz() {
  const [kind, setKind] = useState<LimiterKind>('token-bucket')
  const t0 = useRef(performance.now())
  const limiter = useRef<Limiter>(makeLimiter(kind, LIMIT, WINDOW))
  const [hits, setHits] = useState<Hit[]>([])
  const [now, setNow] = useState(0)

  // re-render ~10×/s so the bucket refill and timeline move smoothly
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now() - t0.current), 100)
    return () => clearInterval(id)
  }, [])

  const reset = (k = kind) => {
    t0.current = performance.now()
    limiter.current = makeLimiter(k, LIMIT, WINDOW)
    setHits([])
    setNow(0)
  }
  const send = (n = 1) => {
    const t = performance.now() - t0.current
    const fresh: Hit[] = Array.from({ length: n }, (_, i) => ({ t: t + i * 30, ok: limiter.current.allow(t + i * 30) }))
    setHits((h) => [...h.filter((x) => x.t > t - SPAN), ...fresh])
  }
  const auto = useTicker(() => Math.random() < 0.55 && send(1), 300)

  const level = limiter.current.level(now)
  const accepted = hits.filter((h) => h.ok).length
  const rejected = hits.length - accepted
  const x = (t: number) => 100 - ((now - t) / SPAN) * 100

  return (
    <VizFrame title="Rate limiter playground" hint={`Limit: ${LIMIT} requests per ${WINDOW / 1000} seconds`}>
      <div className="px-4 pt-3">
        <Tabs
          value={kind}
          onChange={(k) => { setKind(k); reset(k) }}
          options={[
            { value: 'token-bucket', label: 'Token bucket' },
            { value: 'fixed-window', label: 'Fixed window' },
            { value: 'sliding-window', label: 'Sliding window' },
          ]}
        />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{NOTES[kind]}</p>
      </div>

      <div className="grid items-center gap-4 p-4 sm:grid-cols-[150px_1fr]">
        {/* state gauge */}
        <div className="flex flex-col items-center">
          {kind === 'token-bucket' ? (
            <div className="relative h-32 w-24 overflow-hidden rounded-b-3xl border-4 border-t-0 border-slate-400 dark:border-slate-500">
              <div className="absolute inset-x-0 bottom-0 bg-brand-500/30 transition-all duration-100" style={{ height: `${(level / LIMIT) * 100}%` }} />
              <div className="absolute inset-x-0 bottom-1 flex flex-col-reverse items-center gap-1">
                {Array.from({ length: Math.floor(level) }, (_, i) => (
                  <span key={i} className="h-4 w-4 rounded-full bg-amber-400 shadow ring-2 ring-amber-600" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-32 w-24 flex-col-reverse gap-1 rounded-xl border-2 border-slate-300 p-1.5 dark:border-slate-600">
              {Array.from({ length: LIMIT }, (_, i) => (
                <span key={i} className={`flex-1 rounded ${i < level ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
              ))}
            </div>
          )}
          <span className="mt-2 font-mono text-xs text-slate-500">
            {kind === 'token-bucket' ? `${level.toFixed(1)} tokens` : `${level}/${LIMIT} used`}
          </span>
        </div>

        {/* timeline */}
        <div>
          <div className="relative h-24 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/60">
            {kind === 'fixed-window' &&
              Array.from({ length: Math.ceil(SPAN / WINDOW) + 1 }, (_, i) => {
                const b = (Math.floor(now / WINDOW) - i) * WINDOW
                return b >= 0 ? (
                  <div key={b} className="absolute inset-y-0 border-l-2 border-dashed border-slate-300 dark:border-slate-600" style={{ left: `${x(b)}%` }}>
                    <span className="ml-1 font-mono text-[10px] text-slate-400">{b / 1000}s</span>
                  </div>
                ) : null
              })}
            {kind === 'sliding-window' && (
              <div className="absolute inset-y-0 right-0 border-l-2 border-brand-500 bg-brand-500/10" style={{ width: `${(WINDOW / SPAN) * 100}%` }}>
                <span className="ml-1 text-[10px] font-semibold text-brand-600">last {WINDOW / 1000}s</span>
              </div>
            )}
            {hits.filter((h) => h.t > now - SPAN).map((h, i) => (
              <span
                key={i}
                title={h.ok ? '200 OK' : '429 Too Many Requests'}
                className={`absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-2 ring-white dark:ring-slate-900 ${h.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ left: `${x(h.t)}%`, top: `${(h.ok ? 52 : 8) + (i % 4) * 9}%` }}
              />
            ))}
            <span className="absolute right-1 bottom-1 text-[10px] text-slate-400">now</span>
          </div>
          <div className="mt-1 flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 200 accepted ({accepted})</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 429 rejected ({rejected})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        <Button size="sm" variant="primary" onClick={() => send(1)}><Send size={14} /> Send 1</Button>
        <Button size="sm" onClick={() => send(10)}><Zap size={14} /> Burst of 10</Button>
        <Button size="sm" onClick={auto.toggle}>{auto.running ? <Pause size={14} /> : <Play size={14} />} {auto.running ? 'Stop' : 'Random'} traffic</Button>
        <Button size="sm" variant="ghost" onClick={() => reset()}><RotateCcw size={14} /> Reset</Button>
        {hits.at(-1) && <Badge color={hits.at(-1)!.ok ? 'green' : 'red'} className="self-center">{hits.at(-1)!.ok ? 'HTTP 200' : 'HTTP 429 Too Many Requests'}</Badge>}
      </div>
    </VizFrame>
  )
}
