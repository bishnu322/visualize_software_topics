import { describe, expect, it } from 'vitest'
import { dijkstraSteps, routingTable, type Graph } from '@/engine/routing'

const g: Graph = {
  nodes: ['R1', 'R2', 'R3', 'R4', 'R5'],
  edges: [
    { a: 'R1', b: 'R2', cost: 2 },
    { a: 'R1', b: 'R3', cost: 5 },
    { a: 'R2', b: 'R3', cost: 1 },
    { a: 'R2', b: 'R4', cost: 7 },
    { a: 'R3', b: 'R4', cost: 2 },
    { a: 'R4', b: 'R5', cost: 1 },
  ],
}

describe('routing', () => {
  it('finds shortest paths', () => {
    const table = Object.fromEntries(routingTable(g, 'R1').map((r) => [r.destination, r]))
    expect(table.R3.cost).toBe(3)
    expect(table.R3.path).toEqual(['R1', 'R2', 'R3'])
    expect(table.R5.cost).toBe(6)
    expect(table.R5.nextHop).toBe('R2')
  })

  it('visits every node and ends with Done', () => {
    const steps = dijkstraSteps(g, 'R1')
    const last = steps[steps.length - 1]
    expect(last.title).toBe('Done')
    expect(last.data.visited).toHaveLength(5)
  })

  it('skips unreachable nodes', () => {
    const table = routingTable({ nodes: ['A', 'B', 'C'], edges: [{ a: 'A', b: 'B', cost: 1 }] }, 'A')
    expect(table.map((r) => r.destination)).toEqual(['B'])
  })
})

import { buildTopology, findPath, edgeKey } from '@/engine/topology'

describe('topology', () => {
  it('mesh has n(n-1)/2 links', () => {
    expect(buildTopology('mesh', 6).edges).toHaveLength(15)
  })
  it('ring reroutes around a broken link', () => {
    const t = buildTopology('ring', 6)
    expect(findPath(t, 'PC1', 'PC2')).toEqual(['PC1', 'PC2'])
    expect(findPath(t, 'PC1', 'PC2', new Set([edgeKey('PC1', 'PC2')]))).toHaveLength(6)
  })
  it('star fails when a spoke breaks', () => {
    const t = buildTopology('star', 6)
    expect(findPath(t, 'PC1', 'PC3', new Set([edgeKey('SW', 'PC1')]))).toEqual([])
  })
})

import { longestPrefixMatch, type Route } from '@/engine/routing'

describe('longest prefix match', () => {
  const table: Route[] = [
    { prefix: '0.0.0.0/0', nextHop: 'ISP', iface: 'g0/0', source: 'S*', ad: 1, metric: 0 },
    { prefix: '10.0.0.0/8', nextHop: 'R2', iface: 'g0/1', source: 'O', ad: 110, metric: 20 },
    { prefix: '10.1.0.0/16', nextHop: 'R3', iface: 'g0/2', source: 'O', ad: 110, metric: 30 },
  ]
  it('picks the most specific route', () => {
    expect(longestPrefixMatch(table, '10.1.2.3').best).toBe(2)
    expect(longestPrefixMatch(table, '10.9.9.9').best).toBe(1)
    expect(longestPrefixMatch(table, '8.8.8.8')).toEqual({ best: 0, matches: [0] })
  })
})
