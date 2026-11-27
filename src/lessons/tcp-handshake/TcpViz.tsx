import { useMemo } from 'react'
import { tcpSteps } from '@/engine/tcp'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { SequenceDiagram, type SeqMessage } from '@/components/viz/SequenceDiagram'
import { StepPlayer } from '@/components/lesson/StepPlayer'
import { VizFrame } from '@/components/lesson/VizFrame'
import { Badge } from '@/components/ui'

const PHASE_COLOR = { setup: '#22c55e', data: '#0ea5e9', teardown: '#ef4444' } as const

export function TcpViz() {
  const steps = useMemo(() => tcpSteps(), [])
  const ctl = useStepAnimation(steps, 2600)

  const { messages, msgIndexForStep } = useMemo(() => {
    const messages: SeqMessage[] = []
    const msgIndexForStep: number[] = []
    steps.forEach((s) => {
      const seg = s.data.segment
      if (seg) {
        messages.push({
          from: seg.from === 'client' ? 0 : 1,
          to: seg.from === 'client' ? 1 : 0,
          label: seg.flags.join(', '),
          sub: `seq=${seg.seq}${seg.ack !== undefined ? ` ack=${seg.ack}` : ''}${seg.len ? ` len=${seg.len}` : ''}`,
          color: PHASE_COLOR[s.data.phase],
        })
      }
      msgIndexForStep.push(messages.length - 1)
    })
    return { messages, msgIndexForStep }
  }, [steps])

  const { client, server, phase, segment } = ctl.step.data

  return (
    <VizFrame title="TCP connection lifecycle" hint="Handshake → data → teardown">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        {(['setup', 'data', 'teardown'] as const).map((p) => (
          <span
            key={p}
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity"
            style={{ background: `${PHASE_COLOR[p]}22`, color: PHASE_COLOR[p], opacity: phase === p ? 1 : 0.4 }}
          >
            {p === 'setup' ? '3-way handshake' : p === 'data' ? 'Data transfer' : '4-way teardown'}
          </span>
        ))}
        {segment && (
          <span className="ml-auto flex flex-wrap gap-1">
            {['SYN', 'ACK', 'PSH', 'FIN'].map((f) => (
              <Badge key={f} color={segment.flags.includes(f) ? 'brand' : 'slate'} className={segment.flags.includes(f) ? '' : 'opacity-40'}>
                {f}
              </Badge>
            ))}
          </span>
        )}
      </div>
      <div className="max-h-[520px] overflow-y-auto px-2 py-2">
        <SequenceDiagram lanes={['Client', 'Server']} messages={messages} upTo={msgIndexForStep[ctl.index]} laneStates={[client, server]} />
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
