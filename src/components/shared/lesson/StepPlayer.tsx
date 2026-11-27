import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { StepController } from '@/hooks/useStepAnimation'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/shared/ui'

const SPEEDS = [0.5, 1, 1.5, 2]

/** Playback controls + the current step's explanation. */
export function StepPlayer<T>({ ctl }: { ctl: StepController<T> }) {
  const deepDive = useSettings((s) => s.deepDive)
  const { step, index, total } = ctl
  return (
    <div className="border-t border-slate-200 p-3 sm:p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={ctl.reset} aria-label="Restart" title="Restart">
          <RotateCcw size={16} />
        </Button>
        <Button size="sm" onClick={ctl.prev} disabled={ctl.isFirst} aria-label="Previous step">
          <ChevronLeft size={16} />
        </Button>
        <Button size="sm" variant="primary" onClick={ctl.toggle} className="min-w-20">
          {ctl.playing ? <Pause size={16} /> : <Play size={16} />}
          {ctl.playing ? 'Pause' : ctl.isLast ? 'Replay' : 'Play'}
        </Button>
        <Button size="sm" onClick={ctl.next} disabled={ctl.isLast} aria-label="Next step">
          <ChevronRight size={16} />
        </Button>
        <select
          value={ctl.speed}
          onChange={(e) => ctl.setSpeed(Number(e.target.value))}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          aria-label="Speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-xs text-slate-500">
          {index + 1} / {total}
        </span>
      </div>

      {/* progress dots */}
      <div className="mt-3 flex gap-1">
        {ctl.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => ctl.goTo(i)}
            title={s.title}
            aria-label={`Go to step ${i + 1}: ${s.title}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= index ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-3 min-h-16"
          aria-live="polite"
        >
          <div className="font-semibold text-slate-900 dark:text-white">{step.title}</div>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{step.caption}</p>
          {deepDive && step.detail && (
            <p className="mt-2 rounded-lg border-l-4 border-purple-500 bg-purple-50 px-3 py-2 text-sm text-purple-900 dark:bg-purple-500/10 dark:text-purple-200">
              <span className="font-semibold">Deep dive: </span>
              {step.detail}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
