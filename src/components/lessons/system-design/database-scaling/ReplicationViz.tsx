import { useMemo } from 'react'
import { replicationSteps, type DbNode } from '@/engine/sd/replication'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'

const POS: Record<DbNode | 'app', [number, number, number]> = {
  app: [0, 0, 4],
  P: [0, 0, -1],
  R1: [-4.5, 0, -2.5],
  R2: [4.5, 0, -2.5],
}

export function ReplicationViz() {
  const steps = useMemo(() => replicationSteps(), [])
  const ctl = useStepAnimation(steps, 3000)
  const { nodes, op, flows } = ctl.step.data

  return (
    <>
      <SceneCanvas camera={[0, 8, 10]}>
        <Device type="laptop" position={POS.app} label="App" color="#64748b" />
        {(Object.keys(nodes) as DbNode[]).map((id) => {
          const node = nodes[id]
          return (
            <group key={id}>
              <Link from={POS.app} to={POS[id]} color="#e2e8f0" active={op?.node === id} />
              <Device
                type="database"
                position={POS[id]}
                label={node.role === 'down' ? `${id} · DOWN` : `${id} · ${node.role}`}
                sublabel={node.role === 'down' ? undefined : `x=${node.value}`}
                color={node.role === 'primary' ? '#eab308' : node.role === 'replica' ? '#0ea5e9' : '#ef4444'}
                muted={node.role === 'down'}
                active={op?.node === id}
              />
            </group>
          )
        })}
        <Link from={POS.P} to={POS.R1} color="#cbd5e1" broken={nodes.P.role === 'down'} />
        <Link from={POS.P} to={POS.R2} color="#cbd5e1" broken={nodes.P.role === 'down'} />
        {nodes.R1.role === 'primary' && <Link from={POS.R1} to={POS.R2} color="#cbd5e1" />}
        {op && (
          <Packet
            key={`op${ctl.index}`}
            points={op.kind === 'write' ? [POS.app, POS[op.node]] : [POS[op.node], POS.app]}
            duration={1.2}
            color={op.stale ? '#ef4444' : op.kind === 'write' ? '#eab308' : '#22c55e'}
            label={op.kind === 'write' ? `write x=${op.value}` : `x=${op.value}${op.stale ? ' (stale!)' : ''}`}
          />
        )}
        {flows.map(([a, b]) => (
          <Packet key={`f${ctl.index}${a}${b}`} points={[POS[a], POS[b]]} duration={1.4} color="#0ea5e9" label="replicate" />
        ))}
      </SceneCanvas>
      <StepPlayer ctl={ctl} />
    </>
  )
}
