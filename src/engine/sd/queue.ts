export interface QueueState {
  /** Message ids waiting in the queue (oldest first). */
  queue: number[]
  /** Message id each consumer is working on (null = idle). */
  working: (number | null)[]
  nextId: number
  produced: number
  consumed: number
  /** Fractional accumulators so rates below 1/tick work. */
  produceAcc: number
  consumeAcc: number[]
  depthHistory: number[]
  dropped: number
}

export const MAX_QUEUE = 60

export function initQueue(consumers: number): QueueState {
  return {
    queue: [],
    working: Array(consumers).fill(null),
    nextId: 1,
    produced: 0,
    consumed: 0,
    produceAcc: 0,
    consumeAcc: Array(consumers).fill(0),
    depthHistory: [0],
    dropped: 0,
  }
}

/**
 * One tick: producers add `produceRate` messages; each consumer finishes its current message
 * after 1/consumeRate ticks, then takes the next. Pure: returns a new state.
 */
export function tickQueue(prev: QueueState, produceRate: number, consumers: number, consumeRate: number): QueueState {
  const s: QueueState = {
    ...prev,
    queue: [...prev.queue],
    working: [...prev.working],
    consumeAcc: [...prev.consumeAcc],
  }
  // resize the consumer pool
  while (s.working.length < consumers) {
    s.working.push(null)
    s.consumeAcc.push(0)
  }
  if (s.working.length > consumers) {
    // removed consumers put their in-flight message back at the front (at-least-once delivery)
    const removed = s.working.splice(consumers).filter((m): m is number => m !== null)
    s.queue.unshift(...removed)
    s.consumeAcc.length = consumers
  }

  s.produceAcc += produceRate
  while (s.produceAcc >= 1) {
    s.produceAcc -= 1
    s.produced++
    if (s.queue.length >= MAX_QUEUE) s.dropped++
    else s.queue.push(s.nextId++)
  }

  for (let c = 0; c < consumers; c++) {
    if (s.working[c] !== null) {
      s.consumeAcc[c] += consumeRate
      if (s.consumeAcc[c] >= 1) {
        s.consumeAcc[c] -= 1
        s.working[c] = null
        s.consumed++
      }
    }
    if (s.working[c] === null && s.queue.length) s.working[c] = s.queue.shift()!
  }

  s.depthHistory = [...prev.depthHistory, s.queue.length].slice(-80)
  return s
}
