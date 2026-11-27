import type { DeviceType } from './types'

export type TopologyKind = 'bus' | 'star' | 'ring' | 'mesh' | 'tree'

export interface TNode {
  id: string
  type: DeviceType
  pos: [number, number, number]
}
export interface TEdge {
  a: string
  b: string
}
export interface Topology {
  nodes: TNode[]
  edges: TEdge[]
}

export const edgeKey = (a: string, b: string) => [a, b].sort().join('|')

export function buildTopology(kind: TopologyKind, n = 6): Topology {
  const pcs = (count: number, f: (i: number) => [number, number, number]): TNode[] =>
    Array.from({ length: count }, (_, i) => ({ id: `PC${i + 1}`, type: 'pc', pos: f(i) }))
  const circle = (r: number) => (i: number): [number, number, number] => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2
    return [Math.cos(t) * r, 0, Math.sin(t) * r]
  }

  switch (kind) {
    case 'bus': {
      // The bus "backbone" is modelled as a chain of taps T1..Tn; each PC hangs off a tap.
      const span = 10
      const taps: TNode[] = Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, type: 'cloud', pos: [-span / 2 + (i * span) / (n - 1), 0, 0] }))
      const nodes = pcs(n, (i) => [taps[i].pos[0], 0, i % 2 ? 2 : -2])
      const edges: TEdge[] = []
      for (let i = 0; i < n - 1; i++) edges.push({ a: taps[i].id, b: taps[i + 1].id })
      nodes.forEach((p, i) => edges.push({ a: p.id, b: taps[i].id }))
      return { nodes: [...nodes, ...taps], edges }
    }
    case 'star': {
      const hub: TNode = { id: 'SW', type: 'switch', pos: [0, 0, 0] }
      const nodes = pcs(n, circle(4))
      return { nodes: [hub, ...nodes], edges: nodes.map((p) => ({ a: hub.id, b: p.id })) }
    }
    case 'ring': {
      const nodes = pcs(n, circle(4))
      return { nodes, edges: nodes.map((p, i) => ({ a: p.id, b: nodes[(i + 1) % n].id })) }
    }
    case 'mesh': {
      const nodes = pcs(n, circle(4))
      const edges: TEdge[] = []
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push({ a: nodes[i].id, b: nodes[j].id })
      return { nodes, edges }
    }
    case 'tree': {
      const root: TNode = { id: 'Core', type: 'router', pos: [0, 0, -3.5] }
      const sw: TNode[] = [
        { id: 'SW1', type: 'switch', pos: [-3.5, 0, 0] },
        { id: 'SW2', type: 'switch', pos: [3.5, 0, 0] },
      ]
      const nodes = pcs(n, (i) => {
        const side = i < n / 2 ? -3.5 : 3.5
        const k = i % Math.ceil(n / 2)
        return [side + (k - 1) * 2, 0, 3.5]
      })
      const edges: TEdge[] = [
        { a: 'Core', b: 'SW1' },
        { a: 'Core', b: 'SW2' },
        ...nodes.map((p, i) => ({ a: i < n / 2 ? 'SW1' : 'SW2', b: p.id })),
      ]
      return { nodes: [root, ...sw, ...nodes], edges }
    }
  }
}

/** Breadth-first shortest path that avoids broken links. Returns [] if unreachable. */
export function findPath(topo: Topology, from: string, to: string, broken: Set<string> = new Set()): string[] {
  if (from === to) return [from]
  const prev = new Map<string, string>()
  const seen = new Set([from])
  const queue = [from]
  while (queue.length) {
    const u = queue.shift()!
    for (const e of topo.edges) {
      if (broken.has(edgeKey(e.a, e.b))) continue
      const v = e.a === u ? e.b : e.b === u ? e.a : null
      if (!v || seen.has(v)) continue
      seen.add(v)
      prev.set(v, u)
      if (v === to) {
        const path = [to]
        while (path[0] !== from) path.unshift(prev.get(path[0])!)
        return path
      }
      queue.push(v)
    }
  }
  return []
}

export const TOPOLOGY_INFO: Record<TopologyKind, { title: string; pros: string[]; cons: string[]; where: string }> = {
  bus: { title: 'Bus', pros: ['Very little cable', 'Simple to set up'], cons: ['One break splits the whole network', 'Shared medium means collisions'], where: 'Early Ethernet (10BASE2 coax). Mostly historical.' },
  star: { title: 'Star', pros: ['One cable failing affects only one PC', 'Easy to add devices and troubleshoot'], cons: ['The central switch is a single point of failure', 'More cable than bus'], where: 'Almost every modern LAN: PCs → switch.' },
  ring: { title: 'Ring', pros: ['Predictable, ordered access (token passing)', 'Dual rings can heal one break'], cons: ['A single break disrupts a single ring', 'Adding nodes interrupts the ring'], where: 'Token Ring, FDDI, SONET/metro fiber rings.' },
  mesh: { title: 'Full mesh', pros: ['Highly redundant: many paths', 'No single point of failure'], cons: ['Links grow as n(n−1)/2', 'Expensive and complex'], where: 'WAN cores, data-center fabrics (partial mesh), wireless mesh.' },
  tree: { title: 'Tree (hierarchical)', pros: ['Scales well, easy to manage in layers', 'Matches core/distribution/access design'], cons: ['Upper links/devices are critical', 'Needs redundancy added at upper tiers'], where: 'Campus networks: core → distribution → access switches.' },
}
