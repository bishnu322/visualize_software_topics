import { AnimatePresence, motion } from 'framer-motion'
import { Mail, BarChart3, Package, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Button } from '@/components/shared/ui'

const SUBSCRIBERS = [
  { id: 'email', label: 'Email service', icon: Mail, color: '#0ea5e9', action: 'sends receipt' },
  { id: 'inventory', label: 'Inventory', icon: Package, color: '#22c55e', action: 'reserves stock' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: '#a855f7', action: 'records sale' },
]

/** One event published to a topic is delivered to every subscriber, independently. */
export function PubSubDemo() {
  const [events, setEvents] = useState<number[]>([])
  const [handled, setHandled] = useState<Record<string, number>>({})
  const publish = () => {
    const id = (events.at(-1) ?? 1000) + 1
    setEvents((e) => [...e, id].slice(-3))
    setTimeout(() => setHandled((h) => Object.fromEntries(SUBSCRIBERS.map((s) => [s.id, (h[s.id] ?? 0) + 1]))), 900)
  }
  const last = events.at(-1)

  return (
    <VizFrame title="Pub/Sub: one event, many listeners" hint="The checkout service doesn't know who is listening">
      <div className="grid items-center gap-4 p-4 sm:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <ShoppingCart size={18} /> Checkout
          </div>
          <Button size="sm" variant="primary" onClick={publish}>Place order</Button>
        </div>
        <div className="relative flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <span className="absolute top-1 left-2 text-[11px] text-slate-500">topic: order.placed</span>
          <AnimatePresence>
            {last && (
              <motion.span key={last} initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ duration: 0.5 }} className="rounded-md bg-amber-500 px-2 py-1 font-mono text-xs font-bold text-white">
                order #{last}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-2">
          {SUBSCRIBERS.map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.id + (handled[s.id] ?? 0)}
                initial={{ scale: handled[s.id] ? 1.08 : 1 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: s.color }}
              >
                <Icon size={16} style={{ color: s.color }} />
                <span className="font-medium">{s.label}</span>
                <span className="ml-auto font-mono text-xs text-slate-500">{handled[s.id] ? `${s.action} ×${handled[s.id]}` : 'waiting'}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </VizFrame>
  )
}
