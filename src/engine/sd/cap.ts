import type { Step } from '../types'

export type CapMode = 'CP' | 'AP'
export type NodeId = 'A' | 'B' | 'C'

export interface Replica {
  value: number
  /** Logical timestamp of the last write (used for last-write-wins). */
  ts: number
  available: boolean
}

export interface CapStepData {
  nodes: Record<NodeId, Replica>
  partitioned: boolean
  /** Client operation shown this step. */
  op: { kind: 'write' | 'read' | 'sync'; node: NodeId; value?: number; result: 'ok' | 'stale' | 'error' | 'conflict' } | null
  /** Replication messages flowing this step. */
  flows: [NodeId, NodeId][]
}

const ALL: NodeId[] = ['A', 'B', 'C']

/** Scenario: 3 replicas of key x. A partition isolates C. Shows what CP and AP systems do. */
export function capSteps(mode: CapMode): Step<CapStepData>[] {
  const nodes: Record<NodeId, Replica> = {
    A: { value: 1, ts: 1, available: true },
    B: { value: 1, ts: 1, available: true },
    C: { value: 1, ts: 1, available: true },
  }
  const steps: Step<CapStepData>[] = []
  const snap = (partitioned: boolean, op: CapStepData['op'], flows: CapStepData['flows'] = []): CapStepData => ({
    nodes: JSON.parse(JSON.stringify(nodes)),
    partitioned,
    op,
    flows,
  })
  const write = (ids: NodeId[], value: number, ts: number) => ids.forEach((id) => Object.assign(nodes[id], { value, ts }))

  steps.push({ title: 'Three replicas', caption: 'The value x = 1 is stored on three nodes. Everything is connected and in sync.', data: snap(false, null) })

  write(ALL, 2, 2)
  steps.push({
    title: 'Normal write',
    caption: 'A client writes x = 2 to node A. A replicates it to B and C. All good: consistent AND available.',
    detail: 'Without a partition you can have both C and A. The theorem is about what you give up WHEN the network splits.',
    data: snap(false, { kind: 'write', node: 'A', value: 2, result: 'ok' }, [['A', 'B'], ['A', 'C']]),
  })

  steps.push({
    title: 'Network partition!',
    caption: 'A cable fails. Node C can no longer talk to A or B. Partitions WILL happen in distributed systems, so P is not optional.',
    data: snap(true, null),
  })

  if (mode === 'CP') {
    write(['A', 'B'], 3, 3)
    nodes.C.available = false
    steps.push({
      title: 'Write on the majority side',
      caption: 'A client writes x = 3 to A. A and B are a majority (2 of 3), so the write is accepted on both.',
      detail: 'Quorum writes: with N = 3 replicas, W = 2 acknowledgements make a majority. The minority side cannot form a quorum.',
      data: snap(true, { kind: 'write', node: 'A', value: 3, result: 'ok' }, [['A', 'B']]),
    })
    steps.push({
      title: 'Read from the minority: refused',
      caption: 'Another client reads x from C. C knows it might be out of date, so it returns an ERROR instead of a possibly wrong answer. Consistent, but not available.',
      detail: 'Examples: ZooKeeper, etcd, HBase, MongoDB (majority writes), Spanner. Used for leader election, config, money.',
      data: snap(true, { kind: 'read', node: 'C', result: 'error' }),
    })
    nodes.C.available = true
    write(['C'], 3, 3)
    steps.push({
      title: 'Partition heals',
      caption: 'The link comes back. C catches up from the majority (x = 3) and starts serving again. No conflicts were ever possible.',
      data: snap(false, { kind: 'sync', node: 'C', value: 3, result: 'ok' }, [['A', 'C']]),
    })
  } else {
    write(['A', 'B'], 3, 3)
    steps.push({
      title: 'Write on one side',
      caption: 'A client writes x = 3 to A. A and B accept it. C doesn\'t hear about it.',
      data: snap(true, { kind: 'write', node: 'A', value: 3, result: 'ok' }, [['A', 'B']]),
    })
    steps.push({
      title: 'Read from C: stale but available',
      caption: 'Another client reads x from C. C answers right away with x = 2, an old value. Available, but not consistent.',
      detail: 'Examples: Cassandra, DynamoDB, Riak, CouchDB, DNS. Good for carts, likes, feeds, where a slightly old value is acceptable.',
      data: snap(true, { kind: 'read', node: 'C', result: 'stale' }),
    })
    write(['C'], 4, 4)
    steps.push({
      title: 'Conflicting write on C',
      caption: 'A third client writes x = 4 to C. C accepts it too. Now the two sides disagree: 3 vs 4.',
      data: snap(true, { kind: 'write', node: 'C', value: 4, result: 'conflict' }),
    })
    write(['A', 'B'], 4, 4)
    steps.push({
      title: 'Partition heals: resolve the conflict',
      caption: 'Nodes exchange data and must pick a winner. With last-write-wins, x = 4 (the newer timestamp) wins and x = 3 is silently lost.',
      detail: 'Alternatives to LWW: vector clocks (keep both versions, let the app merge, as Dynamo did), or CRDTs that merge automatically (counters, sets).',
      data: snap(false, { kind: 'sync', node: 'A', value: 4, result: 'ok' }, [['C', 'A'], ['C', 'B']]),
    })
  }
  steps.push({
    title: 'Eventually consistent',
    caption: mode === 'CP' ? 'CP chose correctness: some requests failed during the partition.' : 'AP chose availability: every request got an answer, but some answers were stale and one write was lost.',
    data: snap(false, null),
  })
  return steps
}
