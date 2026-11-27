import type { Step } from '../types'

export type DbNode = 'P' | 'R1' | 'R2'

export interface ReplicationData {
  nodes: Record<DbNode, { role: 'primary' | 'replica' | 'down'; value: number }>
  /** Client request this step: which node it hits and what it gets back. */
  op: { kind: 'write' | 'read'; node: DbNode; value: number; stale?: boolean } | null
  /** Replication messages flowing this step. */
  flows: [DbNode, DbNode][]
}

export function replicationSteps(): Step<ReplicationData>[] {
  const n: ReplicationData['nodes'] = {
    P: { role: 'primary', value: 1 },
    R1: { role: 'replica', value: 1 },
    R2: { role: 'replica', value: 1 },
  }
  const snap = (op: ReplicationData['op'], flows: ReplicationData['flows'] = []): ReplicationData => ({
    nodes: JSON.parse(JSON.stringify(n)),
    op,
    flows,
  })
  const steps: Step<ReplicationData>[] = []

  steps.push({ title: 'Primary + replicas', caption: 'One primary accepts all writes. Two replicas keep copies. Right now everyone has x = 1.', detail: 'Also called leader/follower or master/slave. The primary streams its change log (MySQL binlog, Postgres WAL) to replicas.', data: snap(null) })

  n.P.value = 2
  steps.push({ title: 'Write goes to the primary', caption: 'A user updates x = 2. Only the primary can accept writes, and it confirms immediately.', data: snap({ kind: 'write', node: 'P', value: 2 }) })

  steps.push({ title: 'Replication lag', caption: 'The same user refreshes, and the read goes to replica R1, which hasn\'t received the change yet. They see x = 1: their own update "disappeared"!', detail: 'Fix: read-your-own-writes, meaning route a user\'s reads to the primary for a few seconds after they write, or track the log position they have seen.', data: snap({ kind: 'read', node: 'R1', value: 1, stale: true }) })

  n.R1.value = 2
  n.R2.value = 2
  steps.push({ title: 'Replicas catch up', caption: 'Asynchronously (usually within milliseconds), the replicas apply the change. Now all three agree on x = 2.', data: snap(null, [['P', 'R1'], ['P', 'R2']]) })

  steps.push({ title: 'Reads scale out', caption: 'Most apps read far more than they write (often 10:1 or more). Spreading reads across replicas multiplies read capacity.', data: snap({ kind: 'read', node: 'R2', value: 2 }) })

  n.P.role = 'down'
  steps.push({ title: 'The primary crashes', caption: 'The primary dies. Reads still work from the replicas, but writes are failing.', data: snap(null) })

  n.R1.role = 'primary'
  steps.push({ title: 'Failover', caption: 'R1 (the most up-to-date replica) is promoted to primary. R2 now follows R1, and the app sends writes to R1.', detail: 'Automatic failover: Patroni, Orchestrator, AWS RDS Multi-AZ. Risk: writes the old primary accepted but never replicated are lost (with async replication).', data: snap(null, [['R1', 'R2']]) })

  n.R1.value = 3
  n.R2.value = 3
  steps.push({ title: 'Back in business', caption: 'New writes go to R1 and replicate to R2. When the old primary returns, it rejoins as a replica.', data: snap({ kind: 'write', node: 'R1', value: 3 }, [['R1', 'R2']]) })
  return steps
}
