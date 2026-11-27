import { useMemo, useState } from 'react'
import { capSteps, type CapMode, type NodeId } from '@/engine/sd/cap'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Tabs } from '@/components/shared/ui'

const POS: Record<NodeId, [number, number, number]> = {
  A: [-3.5, 0, -1],
  B: [0, 0, -3.5],
  C: [4.5, 0, 1.5],
}
const clientNear = (id: NodeId): [number, number, number] => [POS[id][0], 0, POS[id][2] + 3]

const RESULT = {
  ok: { color: 'green' as const, text: 'OK' },
  stale: { color: 'amber' as const, text: 'Stale value returned' },
  error: { color: 'red' as const, text: 'Error: unavailable' },
  conflict: { color: 'purple' as const, text: 'Accepted, but conflicts with the other side' },
}

export function CapViz() {
  const [mode, setMode] = useState<CapMode>('CP')
  const steps = useMemo(() => capSteps(mode), [mode])
  const ctl = useStepAnimation(steps, 3000)
  const { nodes, partitioned, op, flows } = ctl.step.data
  const links: [NodeId, NodeId][] = [['A', 'B'], ['A', 'C'], ['B', 'C']]

  return (
    <VizFrame title="A network partition forces a choice" hint="Run the same scenario as CP, then as AP">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-3">
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: 'CP', label: 'CP: consistency first' },
            { value: 'AP', label: 'AP: availability first' },
          ]}
        />
        {op && <Badge color={RESULT[op.result].color}>{op.kind.toUpperCase()} on {op.node}{op.value !== undefined ? ` (x=${op.value})` : ''}: {RESULT[op.result].text}</Badge>}
      </div>
      <SceneCanvas camera={[0, 9, 10]}>
        {links.map(([a, b]) => (
          <Link key={a + b} from={POS[a]} to={POS[b]} broken={partitioned && (a === 'C' || b === 'C')} width={3} />
        ))}
        {(Object.keys(POS) as NodeId[]).map((id) => {
          const n = nodes[id]
          const differs = n.value !== nodes.A.value
          return (
            <Device
              key={id}
              type="database"
              position={POS[id]}
              label={`Node ${id}`}
              sublabel={n.available ? `x=${n.value}` : 'refusing'}
              color={!n.available ? '#ef4444' : differs ? '#f59e0b' : '#0ea5e9'}
              muted={!n.available}
              active={op?.node === id}
            />
          )
        })}
        {op && op.kind !== 'sync' && (
          <>
            <Device type="laptop" position={clientNear(op.node)} color="#64748b" label="client" scale={0.7} />
            <Packet
              key={`op${mode}${ctl.index}`}
              points={op.kind === 'write' ? [clientNear(op.node), POS[op.node]] : [POS[op.node], clientNear(op.node)]}
              duration={1.2}
              color={op.result === 'error' ? '#ef4444' : op.result === 'stale' ? '#f59e0b' : '#22c55e'}
              label={op.kind === 'write' ? `x=${op.value}` : op.result === 'error' ? 'error' : `x=${nodes[op.node].value}`}
            />
          </>
        )}
        {flows.map(([a, b]) => (
          <Packet key={`f${mode}${ctl.index}${a}${b}`} points={[POS[a], POS[b]]} duration={1.3} color="#0ea5e9" />
        ))}
      </SceneCanvas>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
