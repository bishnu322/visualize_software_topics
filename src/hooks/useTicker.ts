import { useEffect, useRef, useState } from 'react'

/**
 * Runs `onTick` every `tickMs / speed` while running. For continuous simulations
 * (queues, load balancers, rate limiters) as opposed to step-by-step animations.
 */
export function useTicker(onTick: () => void, tickMs = 400, autoStart = false) {
  const [running, setRunning] = useState(autoStart)
  const [speed, setSpeed] = useState(1)
  const cb = useRef(onTick)
  cb.current = onTick

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => cb.current(), tickMs / speed)
    return () => clearInterval(id)
  }, [running, tickMs, speed])

  return {
    running,
    speed,
    setSpeed,
    start: () => setRunning(true),
    stop: () => setRunning(false),
    toggle: () => setRunning((r) => !r),
  }
}
