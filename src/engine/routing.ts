import { ipToInt, parseCidr, prefixToMask } from './subnet'
import type { Step } from './types'

export interface Edge {
  a: string
  b: string
  cost: number
}

export interface Graph {
  nodes: string[]
  edges: Edge[]
}

export interface DijkstraState {
  dist: Record<string, number>
  prev: Record<string, string | null>
  visited: string[]
  current: string | null
  /** Edge currently being relaxed, if any. */
  relaxing: Edge | null
}

export interface RouteEntry {
  destination: string
  nextHop: string
  cost: number
  path: string[]
}

export function neighbors(graph: Graph, node: string): { node: string; edge: Edge }[] {
  return graph.edges.flatMap((e) =>
    e.a === node ? [{ node: e.b, edge: e }] : e.b === node ? [{ node: e.a, edge: e }] : [],
  )
}

/** Dijkstra's algorithm as an explainable sequence of steps (what OSPF does internally). */
export function dijkstraSteps(graph: Graph, source: string): Step<DijkstraState>[] {
  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  for (const n of graph.nodes) {
    dist[n] = Infinity
    prev[n] = null
  }
  dist[source] = 0
  const visited: string[] = []
  const steps: Step<DijkstraState>[] = []
  const snap = (current: string | null, relaxing: Edge | null): DijkstraState => ({
    dist: { ...dist },
    prev: { ...prev },
    visited: [...visited],
    current,
    relaxing,
  })

  steps.push({
    title: 'Initialize',
    caption: `${source} knows the cost to itself is 0. Every other router starts at ∞ (unknown).`,
    detail: 'In OSPF, each router first floods Link-State Advertisements (LSAs) so every router has the full topology (LSDB), then runs SPF (Dijkstra) locally.',
    data: snap(null, null),
  })

  while (visited.length < graph.nodes.length) {
    const candidates = graph.nodes.filter((n) => !visited.includes(n) && dist[n] < Infinity)
    if (candidates.length === 0) break
    const u = candidates.reduce((best, n) => (dist[n] < dist[best] ? n : best))
    visited.push(u)
    steps.push({
      title: `Visit ${u}`,
      caption: `${u} has the lowest known cost (${dist[u]}) among unvisited routers, so its path is now final.`,
      data: snap(u, null),
    })

    for (const { node: v, edge } of neighbors(graph, u)) {
      if (visited.includes(v)) continue
      const alt = dist[u] + edge.cost
      const improved = alt < dist[v]
      const old = dist[v]
      if (improved) {
        dist[v] = alt
        prev[v] = u
      }
      steps.push({
        title: `Check ${u} → ${v}`,
        caption: improved
          ? `Going through ${u} costs ${dist[u]} + ${edge.cost} = ${alt}, better than ${old === Infinity ? '∞' : old}. Update ${v}.`
          : `Going through ${u} would cost ${alt}, not better than ${old}. Keep current path.`,
        data: snap(u, edge),
      })
    }
  }

  steps.push({
    title: 'Done',
    caption: 'All shortest paths are known. The router installs the next hop for each destination in its routing table.',
    data: snap(null, null),
  })
  return steps
}

export function pathTo(prev: Record<string, string | null>, dest: string): string[] {
  const path: string[] = []
  let cur: string | null = dest
  while (cur) {
    path.unshift(cur)
    cur = prev[cur]
  }
  return path
}

export function routingTable(graph: Graph, source: string): RouteEntry[] {
  const steps = dijkstraSteps(graph, source)
  const { dist, prev } = steps[steps.length - 1].data
  return graph.nodes
    .filter((n) => n !== source && dist[n] < Infinity)
    .map((n) => {
      const path = pathTo(prev, n)
      return { destination: n, nextHop: path[1], cost: dist[n], path }
    })
}

// ---------- Longest prefix match (how a router picks a route) ----------

export interface Route {
  prefix: string // CIDR
  nextHop: string
  iface: string
  source: 'C' | 'S' | 'O' | 'S*'
  ad: number
  metric: number
}

/** Returns the index of the most specific matching route, or -1. Also returns all matches. */
export function longestPrefixMatch(table: Route[], dest: string): { best: number; matches: number[] } {
  const d = ipToInt(dest)
  const matches: number[] = []
  let best = -1
  let bestLen = -1
  table.forEach((r, i) => {
    const { ip, prefix } = parseCidr(r.prefix)
    const mask = prefixToMask(prefix)
    if (((d & mask) >>> 0) === ((ipToInt(ip) & mask) >>> 0)) {
      matches.push(i)
      if (prefix > bestLen) {
        bestLen = prefix
        best = i
      }
    }
  })
  return { best, matches }
}
