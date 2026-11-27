import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { encapsulationSteps, OSI_LAYERS } from '@/engine/osi'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'
import { VizFrame } from '@/components/shared/lesson/VizFrame'

const HEADER_COLOR: Record<string, string> = { Eth: '#3b82f6', IP: '#06b6d4', TCP: '#22c55e' }

function Stack({ side, active }: { side: string; active: number | null }) {
  return (
    <div className="flex w-24 flex-col gap-1 sm:w-32">
      <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{side}</div>
      {OSI_LAYERS.map((l) => (
        <div
          key={l.n}
          className="rounded-md px-2 py-1 text-center text-[11px] font-semibold transition-all sm:text-xs"
          style={{
            background: active === l.n ? l.color : `${l.color}22`,
            color: active === l.n ? 'white' : undefined,
            transform: active === l.n ? 'scale(1.06)' : undefined,
          }}
        >
          {l.n} {l.name}
        </div>
      ))}
    </div>
  )
}

export function Encapsulation() {
  const steps = useMemo(() => encapsulationSteps(), [])
  const ctl = useStepAnimation(steps, 2800)
  const { layer, headers, trailer, side } = ctl.step.data
  const pdu = layer >= 5 ? 'Data' : OSI_LAYERS.find((l) => l.n === layer)!.pdu

  return (
    <VizFrame title="Encapsulation: wrapping data layer by layer" hint="Press play">
      <div className="flex items-start justify-between gap-2 p-4 sm:gap-4">
        <Stack side="Sender" active={side === 'sender' || side === 'wire' ? layer : null} />
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center self-stretch">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {side === 'wire' ? 'On the wire' : `PDU: ${pdu}`}
          </div>
          <motion.div
            className="flex max-w-full flex-wrap items-stretch justify-center overflow-hidden rounded-lg font-mono text-[11px] font-semibold text-white shadow-lg sm:text-xs"
            animate={{ x: side === 'sender' ? -8 : side === 'receiver' ? 8 : 0 }}
          >
            <AnimatePresence initial={false}>
              {headers.map((h) => (
                <motion.div
                  key={h}
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="px-2 py-3 sm:px-3"
                  style={{ background: HEADER_COLOR[h] }}
                >
                  {h}
                </motion.div>
              ))}
              <motion.div key="data" layout className="bg-red-500 px-3 py-3 sm:px-5">DATA</motion.div>
              {trailer && (
                <motion.div key="fcs" layout initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="bg-blue-700 px-2 py-3">
                  FCS
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {side === 'wire' && (
            <div className="mt-4 w-full overflow-hidden font-mono text-xs text-purple-500">
              <motion.div animate={{ x: ['-30%', '30%'] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }} className="whitespace-nowrap text-center">
                1011001010110100101101001101
              </motion.div>
            </div>
          )}
        </div>
        <Stack side="Receiver" active={side === 'receiver' ? layer : null} />
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
