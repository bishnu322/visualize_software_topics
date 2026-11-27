import { Grid } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { COMPONENTS } from '@/engine/sd/designer/components'
import { useIsDark } from '@/hooks/useTheme'
import { useTicker } from '@/hooks/useTicker'
import { FLOW_STYLE } from './kindIcons'
import type { DesignerState } from './useDesigner'

type Vec3 = [number, number, number]

/** A small cone partway along a connection, pointing the way requests travel. */
function Arrow({ from, to, color }: { from: Vec3; to: Vec3; color: string }) {
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  const t = 0.62
  return (
    <group position={[from[0] + dx * t, 0.12, from[2] + dz * t]} rotation={[0, Math.atan2(dx, dz), 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.45, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

interface Flying {
  id: number
  points: Vec3[]
  color: string
  label: string
}

const statusColor = (u: number) => (u > 1 ? '#ef4444' : u > 0.8 ? '#f59e0b' : null)

export function DesignerScene({ d, simulating }: { d: DesignerState; simulating: boolean }) {
  const dark = useIsDark()
  const { design, pos, report, mode, pending, selected } = d
  const [packets, setPackets] = useState<Flying[]>([])
  const nextId = useRef(1)

  // Emit one request at a time, picked in proportion to how much traffic takes each route.
  const ticker = useTicker(() => {
    const ends = report.ends
    const total = ends.reduce((s, e) => s + e.rate, 0)
    if (!total) return
    let r = Math.random() * total
    const e = ends.find((x) => (r -= x.rate) <= 0) ?? ends[ends.length - 1]
    const points = e.path.map((id) => pos[id]).filter(Boolean)
    if (points.length < 2) return
    const f = FLOW_STYLE[e.flow]
    setPackets((ps) => [...ps.slice(-7), { id: nextId.current++, points, color: f.color, label: f.label }])
  }, 650)
  const { start, stop } = ticker
  useEffect(() => {
    if (simulating) start()
    else {
      stop()
      setPackets((ps) => (ps.length ? [] : ps))
    }
  }, [simulating, start, stop])

  const editing = mode.kind === 'connect' || mode.kind === 'delete'

  return (
    <SceneCanvas camera={[0, 15, 15]} className="!h-[440px] sm:!h-[540px]">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onClick={(e) => { e.stopPropagation(); d.place(e.point.x, e.point.z) }}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Grid args={[40, 40]} cellSize={1} sectionSize={5} cellColor={dark ? '#1e293b' : '#e2e8f0'} sectionColor={dark ? '#334155' : '#cbd5e1'} fadeDistance={45} position={[0, -0.005, 0]} />

      {design.edges.map((e) => {
        const a = pos[e.from]
        const b = pos[e.to]
        if (!a || !b) return null
        const touched = selected === e.from || selected === e.to
        const idle = !report.nodes[e.to]?.reachable
        const color = touched ? '#0ea5e9' : idle ? (dark ? '#334155' : '#cbd5e1') : '#94a3b8'
        return (
          <group key={`${e.from}>${e.to}`}>
            <Link
              from={a}
              to={b}
              color={color}
              width={touched ? 3 : 2}
              onClick={mode.kind === 'delete' ? () => d.deleteEdge(e.from, e.to) : mode.kind === 'select' ? () => d.reverseEdge(e.from, e.to) : undefined}
            />
            <Arrow from={a} to={b} color={color} />
          </group>
        )
      })}

      {design.nodes.map((n) => {
        const spec = COMPONENTS[n.kind]
        const m = report.nodes[n.id]
        const util = m && Number.isFinite(m.capacity) && m.total > 0 ? m.utilisation : null
        const copies = n.kind === 'database'
          ? `${n.config.shards > 1 ? `${n.config.shards} shards · ` : ''}${n.config.replicas > 0 ? `+${n.config.replicas} rep` : 'no rep'}`
          : spec.fields.includes('instances') ? `×${n.config.instances}` : ''
        const sub = [copies, util !== null ? `${Math.round(util * 100)}%` : ''].filter(Boolean).join(' · ')
        return (
          <Device
            key={n.id}
            type={spec.device}
            position={n.pos}
            label={m?.spof ? `⚠ ${n.id}` : n.id}
            sublabel={sub || undefined}
            color={(util !== null && statusColor(util)) || spec.color}
            active={pending === n.id || selected === n.id}
            muted={report.valid && !!m && !m.reachable}
            onClick={editing || mode.kind === 'select' ? () => d.clickNode(n.id) : undefined}
          />
        )
      })}

      {packets.map((p) => (
        <Packet
          key={p.id}
          points={p.points}
          duration={0.55 * p.points.length}
          color={p.color}
          label={p.label}
          onArrive={() => setPackets((ps) => ps.filter((x) => x.id !== p.id))}
        />
      ))}
    </SceneCanvas>
  )
}
