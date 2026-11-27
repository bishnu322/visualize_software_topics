import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw, Send, Cog } from 'lucide-react'
import { useState } from 'react'
import { initQueue, MAX_QUEUE, tickQueue } from '@/engine/sd/queue'
import { useTicker } from '@/hooks/useTicker'
import { LineChart } from '@/components/shared/viz/LineChart'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Button } from '@/components/shared/ui'

const CONSUME_RATE = 0.5 // each consumer finishes a message every 2 ticks

export function QueueSimulator() {
  const [rate, setRate] = useState(1.5)
  const [consumers, setConsumers] = useState(2)
  const [s, setS] = useState(() => initQueue(2))
  const ticker = useTicker(() => setS((p) => tickQueue(p, rate, consumers, CONSUME_RATE)), 500)

  const capacity = consumers * CONSUME_RATE
  const trend = rate > capacity ? { c: 'red' as const, t: `Growing: producing ${rate}/tick, consuming ${capacity}/tick` } : rate < capacity ? { c: 'green' as const, t: `Keeping up: capacity ${capacity}/tick ≥ ${rate}/tick` } : { c: 'amber' as const, t: 'Exactly at capacity: no headroom' }
  const visible = s.queue.slice(0, 24)

  return (
    <VizFrame title="Producers → queue → consumers" hint="Make the queue grow, then add consumers">
      <div className="grid gap-4 px-4 pt-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="flex justify-between font-medium"><span>Producer rate</span><span className="font-mono">{rate} msg/tick</span></span>
          <input type="range" min={0} max={4} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-sky-500" />
        </label>
        <label className="text-sm">
          <span className="flex justify-between font-medium"><span>Consumers (workers)</span><span className="font-mono">{consumers}</span></span>
          <input type="range" min={1} max={8} value={consumers} onChange={(e) => setConsumers(Number(e.target.value))} className="w-full accent-sky-500" />
        </label>
      </div>

      <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 p-4 sm:grid-cols-[90px_1fr_auto]">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-sky-50 p-2 text-center text-xs font-semibold text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">
          <Send size={18} /> Producer
        </div>
        <div className="relative min-h-[76px] overflow-hidden rounded-xl border-2 border-dashed border-slate-300 p-2 dark:border-slate-700">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>Queue (FIFO) → oldest at the right</span>
            <span className="font-mono">{s.queue.length}/{MAX_QUEUE}</span>
          </div>
          <div className="flex flex-row-reverse flex-wrap gap-1">
            <AnimatePresence initial={false}>
              {visible.map((id) => (
                <motion.span
                  key={id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex h-6 w-8 items-center justify-center rounded bg-brand-500 font-mono text-[10px] font-bold text-white"
                >
                  {id}
                </motion.span>
              ))}
            </AnimatePresence>
            {s.queue.length > visible.length && <span className="self-center text-xs text-slate-500">+{s.queue.length - visible.length} more</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {s.working.slice(0, consumers).map((w, i) => (
            <div key={i} className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-[11px] ${w !== null ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              <Cog size={12} className={w !== null && ticker.running ? 'animate-spin' : ''} /> W{i + 1}: {w ?? 'idle'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-[1fr_200px] dark:border-slate-800">
        <div>
          <div className="mb-1 text-sm font-semibold">Queue depth (messages waiting)</div>
          <LineChart label="Queue depth over time" series={[{ name: 'depth', values: s.depthHistory }]} yMax={MAX_QUEUE} xLabel="ticks" />
        </div>
        <div className="space-y-2 text-sm">
          <Badge color={trend.c}>{trend.t}</Badge>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <span>produced {s.produced}</span>
            <span>consumed {s.consumed}</span>
            <span className={s.dropped ? 'text-red-500' : ''}>dropped {s.dropped}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <Button size="sm" variant="primary" onClick={ticker.toggle}>
          {ticker.running ? <Pause size={16} /> : <Play size={16} />} {ticker.running ? 'Pause' : 'Start'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setS(initQueue(consumers))}><RotateCcw size={16} /> Reset</Button>
      </div>
    </VizFrame>
  )
}
