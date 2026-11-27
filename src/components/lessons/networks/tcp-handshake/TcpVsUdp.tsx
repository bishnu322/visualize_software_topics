import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/shared/ui'
import { VizFrame } from '@/components/shared/lesson/VizFrame'

const N = 6
const LOST = 2 // packet #3 gets lost

type Status = 'waiting' | 'flying' | 'lost' | 'delivered' | 'retransmit'

/** Side-by-side race: packet 3 is lost. TCP retransmits, UDP doesn't care. */
export function TcpVsUdp() {
  const [t, setT] = useState(-1)
  useEffect(() => {
    if (t < 0 || t > 14) return
    const id = setTimeout(() => setT((x) => x + 1), 450)
    return () => clearTimeout(id)
  }, [t])

  const statusAt = (i: number, proto: 'tcp' | 'udp'): Status => {
    const sent = i * 1 // packet i leaves at tick i
    if (t < sent) return 'waiting'
    if (i === LOST) {
      if (proto === 'udp') return t < sent + 2 ? 'flying' : 'lost'
      // TCP: lost, timeout, then retransmitted at tick 9, arrives at 11
      if (t < sent + 2) return 'flying'
      if (t < 9) return 'lost'
      if (t < 11) return 'retransmit'
      return 'delivered'
    }
    return t < sent + 2 ? 'flying' : 'delivered'
  }

  const lane = (proto: 'tcp' | 'udp') => {
    const done = Array.from({ length: N }, (_, i) => statusAt(i, proto)).filter((s) => s === 'delivered').length
    return (
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">{proto === 'tcp' ? 'TCP: reliable' : 'UDP: fire and forget'}</span>
          <span className="font-mono text-xs text-slate-500">received {done}/{N}</span>
        </div>
        <div className="relative h-[180px]">
          <div className="absolute inset-y-0 left-0 w-14 rounded-lg bg-slate-100 text-center text-[10px] font-semibold leading-[180px] dark:bg-slate-800">Sender</div>
          <div className="absolute inset-y-0 right-0 w-14 rounded-lg bg-slate-100 text-center text-[10px] font-semibold leading-[180px] dark:bg-slate-800">Receiver</div>
          {Array.from({ length: N }, (_, i) => {
            const s = statusAt(i, proto)
            const left = s === 'waiting' ? '0%' : s === 'flying' || s === 'retransmit' ? '45%' : s === 'lost' ? '45%' : '100%'
            return (
              <motion.div
                key={i}
                className={`absolute flex h-6 w-9 items-center justify-center rounded font-mono text-[11px] font-bold text-white ${
                  s === 'lost' ? 'bg-red-500' : s === 'retransmit' ? 'bg-amber-500' : s === 'delivered' ? 'bg-emerald-500' : 'bg-brand-500'
                }`}
                style={{ top: 6 + i * 28 }}
                initial={false}
                animate={{
                  left: s === 'delivered' ? 'calc(100% - 3.25rem)' : s === 'waiting' ? '0.5rem' : `calc(${left} - 1.1rem)`,
                  opacity: s === 'lost' ? 0.35 : 1,
                  rotate: s === 'lost' ? 20 : 0,
                }}
                transition={{ duration: 0.4 }}
              >
                {i + 1}
              </motion.div>
            )
          })}
        </div>
        <p className="mt-2 min-h-10 text-xs text-slate-600 dark:text-slate-400">
          {proto === 'tcp'
            ? t >= 11 ? 'Packet 3 was retransmitted after the timeout. All data arrived, in order.' : t >= 4 ? 'Packet 3 lost… no ACK received. Waiting for timeout.' : ''
            : t >= 4 ? 'Packet 3 is simply gone. Good for live video/games, where late data is useless anyway.' : ''}
        </p>
      </div>
    )
  }

  return (
    <VizFrame title="TCP vs UDP when a packet is lost" hint="Packet 3 will be dropped by the network">
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {lane('tcp')}
        {lane('udp')}
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <Button variant="primary" size="sm" onClick={() => setT(0)}>{t < 0 ? 'Send 6 packets' : 'Run again'}</Button>
      </div>
    </VizFrame>
  )
}
