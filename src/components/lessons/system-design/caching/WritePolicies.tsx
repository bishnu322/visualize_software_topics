import { useMemo, useState } from 'react'
import { cacheFlow, type WritePolicy } from '@/engine/sd/cacheFlows'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { SequenceDiagram } from '@/components/shared/viz/SequenceDiagram'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Tabs } from '@/components/shared/ui'

const COLORS = { 'cache-aside': '#0ea5e9', 'write-through': '#22c55e', 'write-back': '#a855f7' }

export function WritePolicies() {
  const [policy, setPolicy] = useState<WritePolicy>('cache-aside')
  const { messages, steps } = useMemo(() => cacheFlow(policy), [policy])
  const ctl = useStepAnimation(steps, 2400)
  return (
    <VizFrame title="Cache read & write strategies" hint="Pick a strategy and press play">
      <div className="px-4 pt-3">
        <Tabs
          value={policy}
          onChange={setPolicy}
          options={[
            { value: 'cache-aside', label: 'Cache-aside' },
            { value: 'write-through', label: 'Write-through' },
            { value: 'write-back', label: 'Write-back' },
          ]}
        />
      </div>
      <div className="px-2 py-2">
        <SequenceDiagram
          lanes={['App', 'Cache', 'Database']}
          messages={messages.map((m) => ({ ...m, color: COLORS[policy] }))}
          upTo={ctl.step.data.upTo}
        />
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
