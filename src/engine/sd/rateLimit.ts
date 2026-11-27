export type LimiterKind = 'token-bucket' | 'fixed-window' | 'sliding-window'

export interface Limiter {
  /** Try to admit a request at time `now` (ms). */
  allow(now: number): boolean
  /** A number to visualise: tokens left, or requests counted in the current window. */
  level(now: number): number
}

/** Bucket holds up to `capacity` tokens, refilled at `ratePerSec`. Each request takes one. Allows bursts. */
export class TokenBucket implements Limiter {
  private tokens: number
  private last = 0
  constructor(public capacity: number, public ratePerSec: number) {
    this.tokens = capacity
  }
  private refill(now: number) {
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.ratePerSec)
    this.last = now
  }
  allow(now: number) {
    this.refill(now)
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    return false
  }
  level(now: number) {
    this.refill(now)
    return this.tokens
  }
}

/** At most `limit` requests per aligned window. Cheap, but allows 2× limit around a boundary. */
export class FixedWindow implements Limiter {
  private window = -1
  private count = 0
  constructor(public limit: number, public windowMs: number) {}
  private roll(now: number) {
    const w = Math.floor(now / this.windowMs)
    if (w !== this.window) {
      this.window = w
      this.count = 0
    }
  }
  allow(now: number) {
    this.roll(now)
    if (this.count < this.limit) {
      this.count++
      return true
    }
    return false
  }
  level(now: number) {
    this.roll(now)
    return this.count
  }
}

/** Keeps a timestamp per accepted request; at most `limit` in any rolling window. Precise, more memory. */
export class SlidingWindowLog implements Limiter {
  private log: number[] = []
  constructor(public limit: number, public windowMs: number) {}
  private trim(now: number) {
    while (this.log.length && this.log[0] <= now - this.windowMs) this.log.shift()
  }
  allow(now: number) {
    this.trim(now)
    if (this.log.length < this.limit) {
      this.log.push(now)
      return true
    }
    return false
  }
  level(now: number) {
    this.trim(now)
    return this.log.length
  }
}

export function makeLimiter(kind: LimiterKind, limit: number, windowMs: number): Limiter {
  if (kind === 'token-bucket') return new TokenBucket(limit, (limit * 1000) / windowMs)
  if (kind === 'fixed-window') return new FixedWindow(limit, windowMs)
  return new SlidingWindowLog(limit, windowMs)
}
