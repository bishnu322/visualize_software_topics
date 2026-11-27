import { describe, expect, it } from 'vitest'
import { analyze, derive } from '@/engine/sd/designer/analyze'
import { CHALLENGES, DEFAULT_REQUIREMENTS, EXAMPLE_DESIGN, edges, node, starterDesign } from '@/engine/sd/designer/challenges'
import type { Design, Requirements } from '@/engine/sd/designer/types'

const req = (r: Partial<Requirements> = {}): Requirements => ({ ...DEFAULT_REQUIREMENTS, staticPct: 0, ...r })
const check = (d: Design, r: Requirements, id: string) => analyze(d, r).checks.find((c) => c.id === id)!

/** Users → LB → App → DB, optionally with a cache next to the database. */
function basic({ cache = false, lb = 1, app = 2, replicas = 1 } = {}): Design {
  return {
    nodes: [
      node('Users1', 'client', -6, 0),
      node('LB1', 'loadBalancer', -3, 0, { instances: lb }),
      node('App1', 'appServer', 0, 0, { instances: app }),
      node('DB1', 'database', 3, 0, { replicas }),
      ...(cache ? [node('Cache1', 'cache', 3, -3, { instances: 2, hitRatio: 0.9 })] : []),
    ],
    edges: edges('Users1>LB1', 'LB1>App1', 'App1>DB1', ...(cache ? ['App1>Cache1'] : [])),
  }
}

describe('requirements', () => {
  it('derives peak RPS, read/write split and storage', () => {
    const d = derive(req({ dau: 864_000, requestsPerUser: 10, peakFactor: 2, readRatio: 4, objectSizeKb: 1, retentionYears: 1 }))
    expect(d.avgRps).toBeCloseTo(100)
    expect(d.peakRps).toBeCloseTo(200)
    expect(d.readRps).toBeCloseTo(160)
    expect(d.writeRps).toBeCloseTo(40)
    expect(d.storageGb).toBeCloseTo((8_640_000 / 5) * 365 / 1e6)
  })
  it('a manual RPS override wins', () => {
    expect(derive(req({ rpsOverride: 1234 })).peakRps).toBe(1234)
  })
})

describe('validation', () => {
  it('needs clients and a data store, and rejects loops', () => {
    expect(analyze({ nodes: [], edges: [] }, req()).errors).toHaveLength(2)
    expect(analyze(starterDesign(), req()).valid).toBe(false)
    const loop = basic()
    loop.edges.push({ from: 'DB1', to: 'LB1' })
    expect(analyze(loop, req()).errors.join()).toMatch(/loop/)
  })
})

describe('load and caching', () => {
  const heavy = req({ dau: 10_000_000, requestsPerUser: 10, readRatio: 100 })
  it('a read-heavy load overloads a lone database; a cache fixes it', () => {
    const without = analyze(basic({ app: 3 }), heavy)
    expect(without.nodes.DB1.utilisation).toBeGreaterThan(1)
    expect(without.errorRate).toBeGreaterThan(0.001)
    expect(without.hints.join()).toMatch(/DB1.*capacity/)

    const withCache = analyze(basic({ app: 3, cache: true }), heavy)
    expect(withCache.nodes.DB1.utilisation).toBeLessThan(1)
    expect(withCache.checks.find((c) => c.id === 'throughput')!.pass).toBe(true)
  })
  it('cache-aside: misses fall through to the database next to it', () => {
    const r = analyze(basic({ cache: true }), req())
    expect(r.nodes.DB1.load.read).toBeCloseTo(r.derived.readRps * 0.1)
  })
  it('a rate limiter below peak traffic rejects the excess', () => {
    const d = basic()
    d.nodes.push(node('RL1', 'rateLimiter', -8, 0, { instances: 2, limitRps: 100 }))
    d.edges = edges('Users1>RL1', 'RL1>LB1', 'LB1>App1', 'App1>DB1')
    const r = analyze(d, req())
    expect(r.errorRate).toBeGreaterThan(0.5)
    expect(r.hints.join()).toMatch(/429/)
  })
  it('traffic with nowhere to go is reported', () => {
    const d = basic()
    d.edges = edges('Users1>LB1', 'LB1>App1')
    const r = analyze(d, req())
    expect(r.errorRate).toBeGreaterThan(0.9)
    expect(r.hints.join()).toMatch(/App1/)
  })
})

describe('availability', () => {
  it('flags single-instance components as SPOFs', () => {
    const r = analyze(basic({ lb: 1, app: 1, replicas: 0 }), req())
    expect(r.nodes.LB1.spof && r.nodes.App1.spof && r.nodes.DB1.spof).toBe(true)
    const ok = analyze(basic({ lb: 2, app: 2, replicas: 1 }), req())
    expect(Object.values(ok.nodes).some((n) => n.spof)).toBe(false)
  })
  it('series multiply, parallel copies combine as 1 − (1 − a)ⁿ', () => {
    const r = analyze(basic({ lb: 1, app: 1, replicas: 0 }), req())
    expect(r.availability).toBeCloseTo(0.999 * 0.995 * 0.999, 9)
    const r2 = analyze(basic({ lb: 2, app: 2, replicas: 1 }), req())
    expect(r2.availability).toBeCloseTo((1 - 0.001 ** 2) * (1 - 0.005 ** 2) * (1 - 0.001 ** 2), 9)
  })
  it('two sibling app servers behind a balancer are redundant, not in series', () => {
    const d = basic({ app: 1 })
    d.nodes.push(node('App2', 'appServer', 0, 3))
    d.edges.push(...edges('LB1>App2', 'App2>DB1'))
    const r = analyze(d, req())
    expect(r.nodes.App1.spof).toBe(false)
    expect(r.nodes.App1.total).toBeCloseTo(r.nodes.App2.total)
  })
})

describe('queues', () => {
  const chatty = req({ readRatio: 1, asyncWrites: true, writeLatencyMs: 60 })
  const withQueue = (workers: number): Design => {
    const d = basic()
    d.nodes.push(node('Q1', 'queue', 0, 4, { instances: 2 }), node('Worker1', 'worker', 3, 4, { instances: workers, size: 0 }))
    d.edges.push(...edges('App1>Q1', 'Q1>Worker1', 'Worker1>DB1'))
    return d
  }
  it('an async queue takes the database off the write latency path', () => {
    const before = analyze(basic(), chatty)
    const after = analyze(withQueue(2), chatty)
    expect(after.writeP99).toBeLessThan(before.writeP99)
    expect(after.nodes.DB1.load.write).toBeCloseTo(after.derived.writeRps)
  })
  it('too few workers means a growing backlog', () => {
    const r = analyze(withQueue(1), req({ readRatio: 1, asyncWrites: true, rpsOverride: 4000 }))
    expect(r.nodes.Worker1.utilisation).toBeGreaterThan(1)
    expect(r.hints.join()).toMatch(/backlog/)
  })
})

describe('storage and cost', () => {
  it('storage must fit in the shards', () => {
    const big = req({ objectSizeKb: 100 })
    expect(check(basic(), big, 'storage').pass).toBe(false)
    const sharded = basic()
    sharded.nodes[3].config.shards = Math.ceil(derive(big).storageGb / 4000)
    expect(check(sharded, big, 'storage').pass).toBe(true)
  })
  it('budget is checked against the total monthly cost', () => {
    const r = analyze(basic(), req())
    expect(check(basic(), req({ budget: r.cost }), 'cost').pass).toBe(true)
    expect(check(basic(), req({ budget: r.cost - 1 }), 'cost').pass).toBe(false)
  })
})

describe('challenges', () => {
  it.each(CHALLENGES.map((c) => [c.id, c] as const))('%s: reference solution passes every check', (_, c) => {
    const r = analyze(c.solution, c.requirements)
    expect(r.checks.filter((k) => !k.pass)).toEqual([])
    expect(r.score).toBe(100)
  })
  it('the example design passes the default requirements', () => {
    expect(analyze(EXAMPLE_DESIGN, DEFAULT_REQUIREMENTS).score).toBe(100)
  })
})
