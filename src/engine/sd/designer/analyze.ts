import { metrics, queueingFactor } from '../capacity'
import {
  COMPONENTS, DB_SHARD_STORAGE_GB, DB_WRITE_COST, EDGE_RTT_MS, OBJECT_STORAGE_GB_COST, ORIGIN_RTT_MS, isDataStore,
} from './components'
import { fmtAvail, fmtDowntime, fmtGb, fmtMoney, fmtNum, fmtPct } from './format'
import type { ComponentKind, Design, DesignNode, FlowKind, Requirements } from './types'

/**
 * A toy, deterministic capacity model of a whole architecture.
 *
 * Traffic is split into three flows (static reads, dynamic reads, writes) and pushed from the
 * client nodes along the directed edges. Each component decides what to do with each flow:
 * CDNs and caches answer a share of reads themselves, queues acknowledge writes early, databases
 * terminate. Pass 1 measures load; pass 2 replays the traffic with each node's latency and error
 * rate to get end-to-end p99 latency and failures.
 */

export const FLOWS: FlowKind[] = ['static', 'read', 'write']

export interface Derived {
  avgRps: number
  peakRps: number
  readRps: number
  staticRps: number
  dynamicReadRps: number
  writeRps: number
  writesPerDay: number
  storageGb: number
}

export function derive(r: Requirements): Derived {
  const perDay = Math.max(0, r.dau) * Math.max(0, r.requestsPerUser)
  const avgRps = perDay / 86400
  const peakRps = r.rpsOverride && r.rpsOverride > 0 ? r.rpsOverride : avgRps * Math.max(1, r.peakFactor)
  const readShare = Math.max(0, r.readRatio) / (Math.max(0, r.readRatio) + 1)
  const readRps = peakRps * readShare
  const staticRps = readRps * (Math.min(Math.max(r.staticPct, 0), 100) / 100)
  const writesPerDay = perDay * (1 - readShare)
  const storageGb = (writesPerDay * Math.max(0, r.objectSizeKb) * 365 * Math.max(0, r.retentionYears)) / 1e6
  return { avgRps, peakRps, readRps, staticRps, dynamicReadRps: readRps - staticRps, writeRps: peakRps - readRps, writesPerDay, storageGb }
}

type FlowLoad = Record<FlowKind, number>

export interface NodeMetrics {
  id: string
  kind: ComponentKind
  load: FlowLoad
  total: number
  /** Requests/second this node can take (∞ for managed services). */
  capacity: number
  utilisation: number
  latencyMs: number
  errorRate: number
  availability: number
  cost: number
  spof: boolean
  /** False when no traffic reaches this node. */
  reachable: boolean
  /** Share of the required data stored here, and how much fits. */
  storedGb: number
  storageCapacityGb: number
}

/** One route a slice of traffic took, ending where it was answered. */
export interface FlowEnd {
  flow: FlowKind
  rate: number
  latency: number
  path: string[]
  /** Background work after a queue acknowledged the write; not part of user-facing latency. */
  async: boolean
}

export interface Check {
  id: 'throughput' | 'read' | 'write' | 'availability' | 'storage' | 'cost'
  label: string
  pass: boolean
  actual: string
  target: string
}

export interface Report {
  valid: boolean
  errors: string[]
  derived: Derived
  nodes: Record<string, NodeMetrics>
  ends: FlowEnd[]
  readP99: number
  writeP99: number
  /** Share of peak requests that fail (overload, 429s, nowhere to go). */
  errorRate: number
  availability: number
  storageCapacityGb: number
  cost: number
  checks: Check[]
  hints: string[]
  /** 0–100: share of checks passed. */
  score: number
}

const ELIGIBLE: Record<FlowKind, Set<ComponentKind>> = {
  static: new Set(['dns', 'cdn', 'rateLimiter', 'loadBalancer', 'appServer', 'objectStorage']),
  read: new Set(['dns', 'cdn', 'rateLimiter', 'loadBalancer', 'appServer', 'cache', 'database']),
  write: new Set(['dns', 'cdn', 'rateLimiter', 'loadBalancer', 'appServer', 'queue', 'worker', 'database', 'objectStorage']),
}
/** When a node has several kinds of children, these win (e.g. reads try the cache first). */
const PREFERRED: Record<FlowKind, ComponentKind[]> = { static: ['cdn', 'objectStorage'], read: ['cache'], write: ['queue', 'objectStorage'] }
/** Where a flow may end when there is nowhere further to send it. */
const TERMINAL: Record<FlowKind, Set<ComponentKind>> = {
  static: new Set(['appServer', 'objectStorage']),
  read: new Set(['database']),
  write: new Set(['database', 'objectStorage']),
}

/** Which children receive a flow. Traffic is split evenly between them. */
export function route(flow: FlowKind, children: DesignNode[]): DesignNode[] {
  const eligible = children.filter((c) => ELIGIBLE[flow].has(c.kind))
  for (const kind of PREFERRED[flow]) {
    const tier = eligible.filter((c) => c.kind === kind)
    if (tier.length) return tier
  }
  const rest = eligible.filter((c) => c.kind !== 'cdn')
  return rest.length ? rest : eligible
}

const zero = (): FlowLoad => ({ static: 0, read: 0, write: 0 })
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
const parallel = (xs: number[]) => 1 - xs.reduce((p, a) => p * (1 - a), 1)

interface Graph {
  byId: Map<string, DesignNode>
  kids: (id: string) => DesignNode[]
  parents: (id: string) => DesignNode[]
}

function graph(design: Design): Graph {
  const byId = new Map(design.nodes.map((n) => [n.id, n]))
  const edges = design.edges.filter((e) => byId.has(e.from) && byId.has(e.to) && e.from !== e.to)
  const out = new Map<string, DesignNode[]>()
  const inc = new Map<string, DesignNode[]>()
  for (const e of edges) {
    out.set(e.from, [...(out.get(e.from) ?? []), byId.get(e.to)!])
    inc.set(e.to, [...(inc.get(e.to) ?? []), byId.get(e.from)!])
  }
  return { byId, kids: (id) => out.get(id) ?? [], parents: (id) => inc.get(id) ?? [] }
}

function findCycle(design: Design, g: Graph): string[] | null {
  const state = new Map<string, 1 | 2>()
  const stack: string[] = []
  const dfs = (id: string): string[] | null => {
    state.set(id, 1)
    stack.push(id)
    for (const k of g.kids(id)) {
      if (state.get(k.id) === 1) return [...stack.slice(stack.indexOf(k.id)), k.id]
      if (!state.has(k.id)) {
        const c = dfs(k.id)
        if (c) return c
      }
    }
    stack.pop()
    state.set(id, 2)
    return null
  }
  for (const n of design.nodes) {
    if (!state.has(n.id)) {
      const c = dfs(n.id)
      if (c) return c
    }
  }
  return null
}

interface Pass {
  load: Record<string, FlowLoad>
  ends: FlowEnd[]
  failed: number
  unserved: Record<string, number>
  dropped: Record<string, number>
  backlog: Record<string, number>
}

function simulate(design: Design, g: Graph, d: Derived, req: Requirements, m?: Record<string, NodeMetrics>): Pass {
  const p: Pass = { load: {}, ends: [], failed: 0, unserved: {}, dropped: {}, backlog: {} }
  const add = (rec: Record<string, number>, id: string, v: number) => (rec[id] = (rec[id] ?? 0) + v)

  const forward = (from: DesignNode, next: DesignNode[], flow: FlowKind, rate: number, lat: number, path: string[], async: boolean) => {
    const share = rate / next.length
    for (const c of next) {
      // The user's network round trip is paid once, on the first hop past the client (DNS is just resolution).
      const firstHop = c.kind !== 'dns' && path.every((id) => ['client', 'dns'].includes(g.byId.get(id)!.kind))
      const hop = firstHop ? (c.kind === 'cdn' ? EDGE_RTT_MS : ORIGIN_RTT_MS) : 0
      const miss = visit(c.id, flow, share, lat + hop, path, async)
      if (!miss) continue
      // Cache-aside: the cache has nothing behind it, so the caller fetches misses itself.
      const fallback = route(flow, g.kids(from.id).filter((k) => k.kind !== 'cache'))
      if (fallback.length) forward(from, fallback, flow, miss.rate, miss.lat, [...miss.path, from.id], async)
      else lose(c.id, miss.rate, async, true)
    }
  }

  const lose = (id: string, rate: number, async: boolean, unserved: boolean) => {
    if (async) add(p.backlog, id, rate)
    else {
      p.failed += rate
      add(unserved ? p.unserved : p.dropped, id, rate)
    }
  }

  const visit = (id: string, flow: FlowKind, rate: number, lat: number, path: string[], async: boolean): { rate: number; lat: number; path: string[] } | null => {
    const n = g.byId.get(id)!
    if (rate <= 1e-9 || path.includes(id)) return null
    path = [...path, id]
    if (n.kind !== 'client') {
      const l = (p.load[id] ??= zero())
      l[flow] += rate
      if (m) {
        const lost = rate * m[id].errorRate
        if (lost > 0) lose(id, lost, async, false)
        rate -= lost
        lat += m[id].latencyMs
      }
    }
    const end = (r: number) => r > 1e-9 && p.ends.push({ flow, rate: r, latency: lat, path, async })

    if ((n.kind === 'cdn' && flow === 'static') || (n.kind === 'cache' && flow === 'read')) {
      const hits = rate * clamp01(n.config.hitRatio)
      end(hits)
      rate -= hits
      if (rate <= 1e-9) return null
      if (n.kind === 'cache' && route(flow, g.kids(id)).length === 0) return { rate, lat, path }
    }
    if (n.kind === 'queue' && flow === 'write' && req.asyncWrites && !async) {
      end(rate) // the client gets its "OK" as soon as the message is safely queued
      async = true
    }
    const next = route(flow, g.kids(id))
    if (next.length) forward(n, next, flow, rate, lat, path, async)
    else if (TERMINAL[flow].has(n.kind)) end(rate)
    else lose(id, rate, async, true)
    return null
  }

  const clients = design.nodes.filter((n) => n.kind === 'client')
  const rates: FlowLoad = { static: d.staticRps, read: d.dynamicReadRps, write: d.writeRps }
  for (const c of clients) for (const f of FLOWS) visit(c.id, f, rates[f] / clients.length, 0, [], false)
  return p
}

function nodeMetrics(n: DesignNode, load: FlowLoad, storedGb: number): Omit<NodeMetrics, 'spof'> {
  const spec = COMPONENTS[n.kind]
  const c = n.config
  const total = load.static + load.read + load.write
  const inst = Math.max(1, Math.round(c.instances))
  const per = spec.perInstanceRps(c)
  let capacity: number
  let utilisation: number
  let errorRate = 0
  let availability: number
  let cost: number
  let storageCapacityGb = 0

  if (n.kind === 'database') {
    const shards = Math.max(1, Math.round(c.shards))
    const copies = 1 + Math.max(0, Math.round(c.replicas))
    // Writes all hit each shard's primary; reads spread over the primary and its replicas.
    const primaryLoad = (DB_WRITE_COST * load.write) / shards + (load.read + load.static) / (shards * copies)
    capacity = per * shards * copies
    utilisation = primaryLoad / per
    errorRate = metrics(primaryLoad, per, 0).errorRate
    availability = (1 - (1 - spec.availability) ** copies) ** shards
    cost = spec.unitCost(c) * shards * copies
    storageCapacityGb = DB_SHARD_STORAGE_GB * shards
  } else if (spec.managed) {
    capacity = Infinity
    utilisation = 0
    availability = spec.availability
    cost = n.kind === 'objectStorage' ? spec.unitCost(c) + storedGb * OBJECT_STORAGE_GB_COST : spec.unitCost(c)
    storageCapacityGb = n.kind === 'objectStorage' ? Infinity : 0
  } else {
    capacity = per * inst
    utilisation = total / capacity
    errorRate = metrics(total, capacity, 0).errorRate
    availability = 1 - (1 - spec.availability) ** inst
    cost = spec.unitCost(c) * inst
  }
  if (n.kind === 'rateLimiter' && total > c.limitRps) errorRate = Math.max(errorRate, 1 - Math.max(0, c.limitRps) / total)

  return {
    id: n.id, kind: n.kind, load, total, capacity, utilisation, errorRate, availability, cost, storedGb, storageCapacityGb,
    latencyMs: spec.baseLatencyMs * queueingFactor(utilisation),
    reachable: n.kind === 'client' || total > 0,
  }
}

function p99(ends: FlowEnd[]): number {
  const list = ends.filter((e) => !e.async).sort((a, b) => a.latency - b.latency)
  const total = list.reduce((s, e) => s + e.rate, 0)
  if (total === 0) return 0
  let acc = 0
  for (const e of list) {
    acc += e.rate
    if (acc >= 0.99 * total - 1e-9) return e.latency
  }
  return list[list.length - 1].latency
}

const label = (n: { id: string; kind: ComponentKind }) => `${n.id} (${COMPONENTS[n.kind].label.toLowerCase()})`

const SCALE_TIP: Partial<Record<ComponentKind, string>> = {
  appServer: 'add instances or pick a bigger size',
  worker: 'add workers, or the queue backlog grows forever',
  cache: 'add cache instances',
  loadBalancer: 'add load balancer instances',
  rateLimiter: 'add rate limiter instances',
  queue: 'add queue partitions (instances)',
  database: 'add read replicas or a cache for reads; shard it to spread writes',
}

export function analyze(design: Design, req: Requirements): Report {
  const derived = derive(req)
  const g = graph(design)
  const errors: string[] = []
  if (!design.nodes.some((n) => n.kind === 'client')) errors.push('Add Clients: that is where traffic comes from.')
  if (!design.nodes.some((n) => isDataStore(n.kind))) errors.push('Add a Database or Object storage so data has somewhere to live.')
  const cycle = findCycle(design, g)
  if (cycle) errors.push(`There is a loop (${cycle.join(' → ')}). Requests must flow one way, from clients towards storage.`)

  const empty: Report = {
    valid: false, errors, derived, nodes: {}, ends: [], readP99: 0, writeP99: 0, errorRate: 1, availability: 0,
    storageCapacityGb: 0, cost: 0, checks: [], hints: [], score: 0,
  }
  if (errors.length) return empty

  // Pass 1: load only.
  const p1 = simulate(design, g, derived, req)
  const loadOf = (id: string) => p1.load[id] ?? zero()

  // Spread the stored data over the data stores in proportion to the writes they receive.
  const stores = design.nodes.filter((n) => isDataStore(n.kind) && loadOf(n.id).write > 0)
  const storeWrites = stores.reduce((s, n) => s + loadOf(n.id).write, 0)
  const storedOf = (n: DesignNode) => (isDataStore(n.kind) && storeWrites > 0 ? (derived.storageGb * loadOf(n.id).write) / storeWrites : 0)

  const nodes: Record<string, NodeMetrics> = {}
  for (const n of design.nodes) nodes[n.id] = { ...nodeMetrics(n, loadOf(n.id), storedOf(n)), spof: false }

  // Single point of failure: carries traffic, runs as one copy, and has no same-kind sibling to fail over to.
  for (const n of design.nodes) {
    const nm = nodes[n.id]
    const single = n.kind === 'database' ? n.config.replicas < 1 : Math.round(n.config.instances) <= 1
    const hasTwin = g.parents(n.id).some((par) => g.kids(par.id).filter((k) => k.kind === n.kind).length > 1)
    nm.spof = nm.total > 0 && !COMPONENTS[n.kind].managed && single && !hasTwin
  }

  // Pass 2: replay with latency and errors.
  const p2 = simulate(design, g, derived, req, nodes)
  const readEnds = p2.ends.filter((e) => e.flow !== 'write')
  const readP99 = p99(readEnds)
  const writeP99 = p99(p2.ends.filter((e) => e.flow === 'write'))
  const errorRate = derived.peakRps > 0 ? Math.min(1, p2.failed / derived.peakRps) : 0

  // Availability: a node needs itself AND (any one of) the children it routes to.
  const avail = (id: string, flow: FlowKind, seen: Set<string>): number => {
    const n = g.byId.get(id)!
    const a = n.kind === 'client' ? 1 : nodes[id].availability
    if (seen.has(id)) return a
    if ((n.kind === 'queue' && flow === 'write' && req.asyncWrites) || (n.kind === 'cdn' && flow === 'static')) return a
    const next = route(flow, g.kids(id))
    if (!next.length) return a
    const s = new Set(seen).add(id)
    let down = parallel(next.map((k) => avail(k.id, flow, s)))
    if (next.every((k) => k.kind === 'cache' && route(flow, g.kids(k.id)).length === 0)) {
      const fb = route(flow, g.kids(id).filter((k) => k.kind !== 'cache'))
      if (fb.length) down *= parallel(fb.map((k) => avail(k.id, flow, s)))
    }
    return a * down
  }
  const rates: FlowLoad = { static: derived.staticRps, read: derived.dynamicReadRps, write: derived.writeRps }
  const clients = design.nodes.filter((n) => n.kind === 'client')
  const availability = Math.min(1, ...FLOWS.filter((f) => rates[f] > 0).flatMap((f) => clients.map((c) => avail(c.id, f, new Set()))))

  const storageCapacityGb = stores.reduce((s, n) => s + nodes[n.id].storageCapacityGb, 0)
  const storageFits = stores.length > 0 && stores.every((n) => nodes[n.id].storedGb <= nodes[n.id].storageCapacityGb + 1e-9)
  const cost = Object.values(nodes).reduce((s, n) => s + n.cost, 0)

  const checks: Check[] = [
    { id: 'throughput', label: 'Handles peak traffic', pass: errorRate <= 0.001, actual: `${fmtPct(errorRate)} of ${fmtNum(derived.peakRps)} req/s fail`, target: '≤ 0.1% errors' },
    { id: 'read', label: 'Read latency (p99)', pass: derived.readRps === 0 || (readEnds.length > 0 && readP99 <= req.readLatencyMs), actual: `${Math.round(readP99)} ms`, target: `≤ ${req.readLatencyMs} ms` },
    { id: 'write', label: 'Write latency (p99)', pass: derived.writeRps === 0 || (writeP99 > 0 && writeP99 <= req.writeLatencyMs), actual: `${Math.round(writeP99)} ms`, target: `≤ ${req.writeLatencyMs} ms` },
    { id: 'availability', label: 'Availability', pass: availability * 100 >= req.availability - 1e-9, actual: `${fmtAvail(availability)} (${fmtDowntime(availability)})`, target: `≥ ${req.availability}%` },
    { id: 'storage', label: 'Storage', pass: derived.storageGb === 0 || storageFits, actual: `${fmtGb(derived.storageGb)} in ${fmtGb(storageCapacityGb)}`, target: `fits ${fmtGb(derived.storageGb)}` },
    { id: 'cost', label: 'Monthly cost', pass: cost <= req.budget, actual: fmtMoney(cost), target: `≤ ${fmtMoney(req.budget)}` },
  ]

  const hints: string[] = []
  for (const [id, r] of Object.entries(p2.unserved)) {
    const n = g.byId.get(id)!
    hints.push(n.kind === 'cache'
      ? `${label(n)} misses (${fmtNum(r)} req/s) have nowhere to go. Connect the cache, or the component in front of it, to a database.`
      : n.kind === 'cdn'
        ? `${label(n)} has no origin for cache misses. Connect it to object storage or a load balancer.`
        : `${label(n)} can't pass on ${fmtNum(r)} req/s: connect it to what comes next (app servers, cache, database…).`)
  }
  for (const n of design.nodes) {
    const nm = nodes[n.id]
    if (!nm.reachable) hints.push(`${label(n)} gets no traffic${nm.cost ? ` but still costs ${fmtMoney(nm.cost)}/mo` : ''}. Connect it, or remove it.`)
    else if (n.kind === 'rateLimiter' && nm.total > n.config.limitRps) hints.push(`${label(n)} rejects ${fmtNum(nm.total - n.config.limitRps)} req/s with HTTP 429. Its limit is below your peak traffic.`)
    else if (nm.utilisation > 1) hints.push(`${label(n)} is at ${Math.round(nm.utilisation * 100)}% of capacity and dropping requests: ${SCALE_TIP[n.kind] ?? 'scale it up'}.`)
    else if (nm.utilisation > 0.8) hints.push(`${label(n)} is running hot (${Math.round(nm.utilisation * 100)}%). Latency climbs steeply near 100%.`)
    if (nm.spof) hints.push(`${label(n)} is a single point of failure: ${n.kind === 'database' ? 'add a replica' : 'run at least 2 instances'}.`)
    if (n.kind === 'database' && nm.storedGb > nm.storageCapacityGb) hints.push(`${label(n)} must hold ${fmtGb(nm.storedGb)} but its shards fit ${fmtGb(nm.storageCapacityGb)}: add shards, or keep large blobs in object storage.`)
    if (n.kind === 'queue' && nm.total > 0 && route('write', g.kids(n.id)).length === 0) hints.push(`${label(n)} has no consumers, so messages pile up. Connect it to workers.`)
  }
  for (const [id, r] of Object.entries(p2.backlog)) {
    if (g.byId.get(id)!.kind !== 'queue') hints.push(`Background work at ${label(g.byId.get(id)!)} falls behind by ${fmtNum(r)} msg/s, so the queue backlog keeps growing.`)
  }
  if (!checks[1].pass && derived.staticRps > 0 && !design.nodes.some((n) => n.kind === 'cdn')) hints.push('A CDN would serve the static content from the edge, which is faster and takes load off your servers.')
  if (!checks[1].pass && derived.dynamicReadRps > 0 && !design.nodes.some((n) => n.kind === 'cache')) hints.push('A cache in front of the database would answer most reads in ~1 ms.')
  if (!checks[2].pass && req.asyncWrites && !design.nodes.some((n) => n.kind === 'queue')) hints.push('Writes may be async here: put a message queue (plus workers) in the write path to acknowledge writes immediately.')
  if (!checks[5].pass) {
    const top = Object.values(nodes).sort((a, b) => b.cost - a.cost)[0]
    hints.push(`Over budget by ${fmtMoney(cost - req.budget)}. The biggest cost is ${label(top)} at ${fmtMoney(top.cost)}/mo.`)
  }

  const passed = checks.filter((c) => c.pass).length
  return {
    valid: true, errors, derived, nodes, ends: p2.ends, readP99, writeP99, errorRate, availability, storageCapacityGb, cost, checks,
    hints: [...new Set(hints)], score: Math.round((100 * passed) / checks.length),
  }
}
