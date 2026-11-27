import { describe, expect, it } from 'vitest'
import { horizontalMetrics, verticalMetrics, SIZES } from '@/engine/sd/capacity'
import { LoadBalancer, type LbServer } from '@/engine/sd/lb'
import { LFUCache, LRUCache, hitRatio } from '@/engine/sd/cache'
import { requestLatency, USERS } from '@/engine/sd/cdn'
import { ConsistentHashRing, hashModShard, movedFraction } from '@/engine/sd/sharding'
import { initQueue, tickQueue } from '@/engine/sd/queue'
import { FixedWindow, SlidingWindowLog, TokenBucket } from '@/engine/sd/rateLimit'
import { capSteps } from '@/engine/sd/cap'
import { rng, zipf } from '@/engine/sd/random'

const servers = (n: number, weights: number[] = []): LbServer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `S${i + 1}`, weight: weights[i] ?? 1, healthy: true, active: 0, total: 0 }))

describe('capacity', () => {
  it('overload causes errors; scaling out fixes it', () => {
    expect(verticalMetrics(500, 0).errorRate).toBeCloseTo(0.6)
    expect(horizontalMetrics(500, 2).errorRate).toBe(0)
    expect(verticalMetrics(100, 0).latencyMs).toBeLessThan(verticalMetrics(190, 0).latencyMs)
  })
  it('vertical scaling has a ceiling', () => {
    const biggest = SIZES.length - 1
    expect(verticalMetrics(5000, biggest).errorRate).toBeGreaterThan(0)
    expect(horizontalMetrics(5000, 13).errorRate).toBe(0)
  })
})

describe('load balancer', () => {
  it('round robin rotates and skips unhealthy servers', () => {
    const lb = new LoadBalancer(servers(3))
    expect([0, 1, 2, 3].map(() => lb.pick('round-robin'))).toEqual([0, 1, 2, 0])
    lb.servers[1].healthy = false
    const picks = Array.from({ length: 4 }, () => lb.pick('round-robin'))
    expect(picks).not.toContain(1)
  })
  it('least connections picks the idlest', () => {
    const lb = new LoadBalancer(servers(3))
    lb.servers[0].active = 5
    lb.servers[1].active = 1
    lb.servers[2].active = 3
    expect(lb.pick('least-connections')).toBe(1)
  })
  it('weighted follows the weights', () => {
    const lb = new LoadBalancer(servers(2, [3, 1]))
    for (let i = 0; i < 40; i++) lb.pick('weighted')
    expect(lb.servers.map((s) => s.total)).toEqual([30, 10])
  })
  it('ip hash is sticky', () => {
    const lb = new LoadBalancer(servers(4))
    const first = lb.pick('ip-hash', '10.0.0.7')
    expect(lb.pick('ip-hash', '10.0.0.7')).toBe(first)
  })
  it('returns -1 when everything is down', () => {
    const lb = new LoadBalancer(servers(2))
    lb.servers.forEach((s) => (s.healthy = false))
    expect(lb.pick('round-robin')).toBe(-1)
  })
})

describe('cache', () => {
  it('LRU evicts the least recently used', () => {
    const c = new LRUCache<string>(2)
    c.put('a')
    c.put('b')
    c.get('a')
    expect(c.put('c')).toBe('b')
    expect(c.keys()).toEqual(['a', 'c'])
  })
  it('LFU evicts the least frequently used', () => {
    const c = new LFUCache<string>(2)
    c.put('a')
    c.get('a')
    c.put('b')
    expect(c.put('c')).toBe('b')
  })
  it('bigger cache → higher hit ratio on skewed traffic', () => {
    const next = zipf(200, 1.1, rng(1))
    const keys = Array.from({ length: 4000 }, next)
    const small = hitRatio(new LRUCache<number>(5), keys)
    const big = hitRatio(new LRUCache<number>(50), keys)
    expect(big).toBeGreaterThan(small)
    expect(big).toBeGreaterThan(0.5)
  })
})

describe('cdn', () => {
  it('edge hit is much faster than origin for far users', () => {
    const sydney = USERS.find((u) => u.id === 'sydney')!
    const origin = requestLatency(sydney, false, false).latency
    const hit = requestLatency(sydney, true, true).latency
    const miss = requestLatency(sydney, true, false).latency
    expect(hit).toBeLessThan(origin / 5)
    expect(miss).toBeGreaterThan(hit)
  })
})

describe('sharding', () => {
  const keys = Array.from({ length: 5000 }, (_, i) => `user:${i}`)
  it('hash mod N moves most keys when adding a shard', () => {
    expect(movedFraction(keys, (k) => hashModShard(k, 4), (k) => hashModShard(k, 5))).toBeGreaterThan(0.7)
  })
  it('consistent hashing moves about 1/N keys', () => {
    const before = new ConsistentHashRing(['s1', 's2', 's3', 's4'])
    const after = new ConsistentHashRing(['s1', 's2', 's3', 's4', 's5'])
    const moved = movedFraction(keys, (k) => before.get(k), (k) => after.get(k))
    expect(moved).toBeGreaterThan(0.1)
    expect(moved).toBeLessThan(0.3)
  })
})

describe('queue', () => {
  it('grows when producers outpace consumers, drains otherwise', () => {
    let s = initQueue(1)
    for (let i = 0; i < 20; i++) s = tickQueue(s, 2, 1, 1)
    const grown = s.queue.length
    expect(grown).toBeGreaterThan(10)
    for (let i = 0; i < 20; i++) s = tickQueue(s, 0, 4, 1)
    expect(s.queue.length).toBe(0)
    expect(s.consumed + s.queue.length + s.working.filter((w) => w !== null).length + s.dropped).toBe(s.produced)
  })
})

describe('rate limiting', () => {
  it('token bucket allows a burst then refills', () => {
    const b = new TokenBucket(5, 5)
    const burst = Array.from({ length: 8 }, () => b.allow(0)).filter(Boolean).length
    expect(burst).toBe(5)
    expect(b.allow(1000)).toBe(true)
  })
  it('fixed window allows 2x limit across a boundary; sliding window does not', () => {
    const f = new FixedWindow(5, 1000)
    const s = new SlidingWindowLog(5, 1000)
    const times = [...Array(5).fill(990), ...Array(5).fill(1010)]
    expect(times.filter((t) => f.allow(t)).length).toBe(10)
    expect(times.filter((t) => s.allow(t)).length).toBe(5)
  })
})

describe('CAP', () => {
  it('CP refuses the minority read; AP returns stale', () => {
    const cpRead = capSteps('CP').find((s) => s.data.op?.kind === 'read')!
    const apRead = capSteps('AP').find((s) => s.data.op?.kind === 'read')!
    expect(cpRead.data.op!.result).toBe('error')
    expect(apRead.data.op!.result).toBe('stale')
    expect(apRead.data.nodes.C.value).toBe(2)
  })
  it('both end consistent', () => {
    for (const mode of ['CP', 'AP'] as const) {
      const last = capSteps(mode).at(-1)!.data.nodes
      expect(new Set([last.A.value, last.B.value, last.C.value]).size).toBe(1)
    }
  })
})
