import { useState } from 'react'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Tabs } from '@/components/shared/ui'
import { ReplicationViz } from './ReplicationViz'
import { ShardingViz } from './ShardingViz'

export function DatabaseScalingViz({ initial = 'replication' }: { initial?: 'replication' | 'sharding' }) {
  const [tab, setTab] = useState(initial)
  return (
    <VizFrame title={tab === 'replication' ? 'Replication: copies of the same data' : 'Sharding: splitting data across servers'}>
      <div className="px-4 pt-3">
        <Tabs value={tab} onChange={setTab} options={[{ value: 'replication', label: 'Replication' }, { value: 'sharding', label: 'Sharding' }]} />
      </div>
      {tab === 'replication' ? <ReplicationViz /> : <ShardingViz />}
    </VizFrame>
  )
}
