/** Small seeded PRNG (mulberry32) so simulations are reproducible and testable. */
export function rng(seed = 42) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Zipf-distributed key picker: a few keys are very popular, most are rare (like real traffic). */
export function zipf(n: number, s = 1.1, random = rng()) {
  const weights = Array.from({ length: n }, (_, i) => 1 / (i + 1) ** s)
  const total = weights.reduce((a, b) => a + b, 0)
  const cdf: number[] = []
  weights.reduce((acc, w, i) => (cdf[i] = acc + w / total), 0)
  return () => {
    const r = random()
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < r) lo = mid + 1
      else hi = mid
    }
    return lo
  }
}

/** FNV-1a 32-bit string hash + MurmurHash3 finalizer, so similar strings ("s1#0", "s1#1") spread evenly. */
export function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
