import { useCallback, useEffect, useState } from 'react'
import type { Step } from '@/engine/types'

export interface StepController<T> {
  steps: Step<T>[]
  index: number
  step: Step<T>
  total: number
  playing: boolean
  speed: number
  isFirst: boolean
  isLast: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  reset: () => void
  goTo: (i: number) => void
  setSpeed: (s: number) => void
}

/** Drives a Step[] over time. `baseMs` is the time per step at 1× speed. */
export function useStepAnimation<T>(steps: Step<T>[], baseMs = 2600): StepController<T> {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const total = steps.length
  const safeIndex = Math.min(index, total - 1)

  // Restart when the step list changes (e.g. user changed inputs).
  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [steps])

  useEffect(() => {
    if (!playing) return
    if (safeIndex >= total - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setIndex((i) => i + 1), baseMs / speed)
    return () => clearTimeout(t)
  }, [playing, safeIndex, total, baseMs, speed])

  const goTo = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total])

  return {
    steps,
    index: safeIndex,
    step: steps[safeIndex],
    total,
    playing,
    speed,
    isFirst: safeIndex === 0,
    isLast: safeIndex === total - 1,
    play: () => {
      if (safeIndex >= total - 1) setIndex(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    toggle: () => {
      if (playing) setPlaying(false)
      else {
        if (safeIndex >= total - 1) setIndex(0)
        setPlaying(true)
      }
    },
    next: () => {
      setPlaying(false)
      goTo(safeIndex + 1)
    },
    prev: () => {
      setPlaying(false)
      goTo(safeIndex - 1)
    },
    reset: () => {
      setPlaying(false)
      setIndex(0)
    },
    goTo: (i) => {
      setPlaying(false)
      goTo(i)
    },
    setSpeed,
  }
}
