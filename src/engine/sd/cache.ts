export type EvictionPolicy = 'LRU' | 'LFU'

export interface Cache<K> {
  get(key: K): boolean
  put(key: K): K | undefined // returns evicted key
  keys(): K[]
  readonly size: number
}

/** Least Recently Used: a Map keeps insertion order, so re-inserting on access moves a key to the end. */
export class LRUCache<K> implements Cache<K> {
  private map = new Map<K, true>()
  constructor(private capacity: number) {}
  get(key: K) {
    if (!this.map.has(key)) return false
    this.map.delete(key)
    this.map.set(key, true)
    return true
  }
  put(key: K) {
    if (this.capacity <= 0) return undefined
    if (this.map.has(key)) {
      this.get(key)
      return undefined
    }
    let evicted: K | undefined
    if (this.map.size >= this.capacity) {
      evicted = this.map.keys().next().value as K
      this.map.delete(evicted)
    }
    this.map.set(key, true)
    return evicted
  }
  /** Most recently used last. */
  keys() {
    return [...this.map.keys()]
  }
  get size() {
    return this.map.size
  }
}

/** Least Frequently Used (ties broken by least recent). */
export class LFUCache<K> implements Cache<K> {
  private freq = new Map<K, { count: number; tick: number }>()
  private tick = 0
  constructor(private capacity: number) {}
  get(key: K) {
    const e = this.freq.get(key)
    if (!e) return false
    e.count++
    e.tick = ++this.tick
    return true
  }
  put(key: K) {
    if (this.capacity <= 0) return undefined
    if (this.freq.has(key)) {
      this.get(key)
      return undefined
    }
    let evicted: K | undefined
    if (this.freq.size >= this.capacity) {
      let worst: [K, { count: number; tick: number }] | undefined
      for (const entry of this.freq) {
        if (!worst || entry[1].count < worst[1].count || (entry[1].count === worst[1].count && entry[1].tick < worst[1].tick)) worst = entry
      }
      evicted = worst![0]
      this.freq.delete(evicted)
    }
    this.freq.set(key, { count: 1, tick: ++this.tick })
    return evicted
  }
  keys() {
    return [...this.freq.keys()]
  }
  count(key: K) {
    return this.freq.get(key)?.count ?? 0
  }
  get size() {
    return this.freq.size
  }
}

export function makeCache<K>(policy: EvictionPolicy, capacity: number): Cache<K> {
  return policy === 'LRU' ? new LRUCache<K>(capacity) : new LFUCache<K>(capacity)
}

export const CACHE_LATENCY_MS = 1
export const DB_LATENCY_MS = 50

/** Cache-aside read: check cache, on miss read DB and populate cache. */
export function cacheAsideRead<K>(cache: Cache<K>, key: K): { hit: boolean; latency: number; evicted?: K } {
  if (cache.get(key)) return { hit: true, latency: CACHE_LATENCY_MS }
  const evicted = cache.put(key)
  return { hit: false, latency: CACHE_LATENCY_MS + DB_LATENCY_MS, evicted }
}

/** Run a key stream through a cache; returns the overall hit ratio. */
export function hitRatio<K>(cache: Cache<K>, keys: K[]): number {
  let hits = 0
  for (const k of keys) if (cacheAsideRead(cache, k).hit) hits++
  return keys.length ? hits / keys.length : 0
}
