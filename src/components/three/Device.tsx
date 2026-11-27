import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import type { DeviceType } from '@/engine/types'
import { Label3D } from './Label3D'

interface Props {
  type: DeviceType
  position: [number, number, number]
  label?: string
  sublabel?: string
  color?: string
  active?: boolean
  muted?: boolean
  scale?: number
  onClick?: () => void
}

const BODY = '#e2e8f0'
const DARK = '#334155'

/** Low-poly network devices built from primitives (no external models needed). */
export function Device({ type, position, label, sublabel, color = '#0ea5e9', active, muted, scale = 1, onClick }: Props) {
  const ref = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const accent = muted ? '#94a3b8' : color

  useFrame((state) => {
    if (!ref.current) return
    const target = active ? 1.12 : hover ? 1.06 : 1
    const s = ref.current.scale.x + (target * scale - ref.current.scale.x) * 0.15
    ref.current.scale.setScalar(s)
    ref.current.position.y = position[1] + (active ? Math.sin(state.clock.elapsedTime * 4) * 0.05 + 0.08 : 0)
  })

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        if (!onClick) return
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        if (onClick) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      <Model type={type} accent={accent} glow={!!active} muted={!!muted} />
      {label && (
        <Label3D position={[0, labelHeight[type], 0]} tone={active ? 'active' : muted ? 'muted' : 'default'}>
          {label}
          {sublabel && <span className="ml-1 font-mono font-normal opacity-75">{sublabel}</span>}
        </Label3D>
      )}
    </group>
  )
}

const labelHeight: Record<DeviceType, number> = { pc: 1.6, laptop: 1.2, router: 1.1, switch: 0.8, server: 2.3, cloud: 1.6 }

function Mat({ color, glow, muted, emissive }: { color: string; glow?: boolean; muted?: boolean; emissive?: string }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.45}
      metalness={0.15}
      emissive={glow ? (emissive ?? color) : '#000000'}
      emissiveIntensity={glow ? 0.45 : 0}
      transparent={muted}
      opacity={muted ? 0.45 : 1}
    />
  )
}

function Model({ type, accent, glow, muted }: { type: DeviceType; accent: string; glow: boolean; muted: boolean }) {
  switch (type) {
    case 'pc':
      return (
        <group>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.2, 0.8, 0.08]} />
            <Mat color={DARK} muted={muted} />
          </mesh>
          <mesh position={[0, 0.75, 0.045]}>
            <planeGeometry args={[1.08, 0.68]} />
            <Mat color={accent} glow={glow} muted={muted} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4]} />
            <Mat color={BODY} muted={muted} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.35]} />
            <Mat color={BODY} muted={muted} />
          </mesh>
        </group>
      )
    case 'laptop':
      return (
        <group>
          <mesh position={[0, 0.03, 0.1]}>
            <boxGeometry args={[1.2, 0.06, 0.8]} />
            <Mat color={BODY} muted={muted} />
          </mesh>
          <group position={[0, 0.06, -0.3]} rotation={[-0.25, 0, 0]}>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[1.2, 0.8, 0.05]} />
              <Mat color={DARK} muted={muted} />
            </mesh>
            <mesh position={[0, 0.4, 0.03]}>
              <planeGeometry args={[1.08, 0.68]} />
              <Mat color={accent} glow={glow} muted={muted} />
            </mesh>
          </group>
        </group>
      )
    case 'router':
      return (
        <group>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.3, 32]} />
            <Mat color={accent} glow={glow} muted={muted} />
          </mesh>
          {/* the classic router symbol: four arrows on top */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((r) => (
            <mesh key={r} position={[Math.cos(r) * 0.32, 0.31, Math.sin(r) * 0.32]} rotation={[-Math.PI / 2, 0, -r + Math.PI / 2]}>
              <coneGeometry args={[0.1, 0.22, 3]} />
              <meshStandardMaterial color="#ffffff" transparent={muted} opacity={muted ? 0.5 : 1} />
            </mesh>
          ))}
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} position={[x, 0.6, -0.35]}>
              <cylinderGeometry args={[0.025, 0.025, 0.6]} />
              <Mat color={DARK} muted={muted} />
            </mesh>
          ))}
        </group>
      )
    case 'switch':
      return (
        <group>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.8, 0.3, 0.9]} />
            <Mat color={accent} glow={glow} muted={muted} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-0.7 + i * 0.2, 0.15, 0.455]}>
              <planeGeometry args={[0.13, 0.12]} />
              <meshStandardMaterial color={i % 3 === 0 ? '#4ade80' : '#1e293b'} emissive={i % 3 === 0 ? '#22c55e' : '#000'} emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      )
    case 'server':
      return (
        <group>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.9, 1.8, 0.9]} />
            <Mat color={DARK} muted={muted} />
          </mesh>
          {[0.3, 0.75, 1.2, 1.6].map((y) => (
            <mesh key={y} position={[0, y, 0.455]}>
              <planeGeometry args={[0.75, 0.22]} />
              <Mat color={accent} glow={glow} muted={muted} />
            </mesh>
          ))}
        </group>
      )
    case 'cloud':
      return (
        <group position={[0, 0.6, 0]}>
          {[
            [0, 0, 0, 0.6],
            [-0.6, -0.15, 0, 0.45],
            [0.6, -0.15, 0, 0.45],
            [0.25, 0.3, -0.1, 0.45],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[r, 24, 24]} />
              <Mat color={accent} glow={glow} muted={muted} />
            </mesh>
          ))}
        </group>
      )
  }
}
