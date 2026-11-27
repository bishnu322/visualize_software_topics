import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3, type Group } from 'three'
import { Label3D } from './Label3D'

interface Props {
  /** Waypoints the packet travels through (device positions). */
  points: [number, number, number][]
  /** Seconds for the whole path. */
  duration?: number
  color?: string
  label?: string
  loop?: boolean
  height?: number
  onArrive?: () => void
}

/** A glowing packet that travels along a polyline. Remount (change `key`) to restart. */
export function Packet({ points, duration = 1.6, color = '#f59e0b', label, loop = false, height = 0.45, onArrive }: Props) {
  const ref = useRef<Group>(null)
  const start = useRef<number | null>(null)
  const arrived = useRef(false)

  const { vecs, cumulative, total } = useMemo(() => {
    const vecs = points.map((p) => new Vector3(p[0], p[1] + height, p[2]))
    const cumulative = [0]
    for (let i = 1; i < vecs.length; i++) cumulative.push(cumulative[i - 1] + vecs[i].distanceTo(vecs[i - 1]))
    return { vecs, cumulative, total: cumulative[cumulative.length - 1] || 1 }
  }, [points, height])

  useFrame((state) => {
    if (!ref.current || vecs.length === 0) return
    if (start.current === null) start.current = state.clock.elapsedTime
    let t = (state.clock.elapsedTime - start.current) / duration
    if (loop) t %= 1
    else if (t >= 1) {
      t = 1
      if (!arrived.current) {
        arrived.current = true
        onArrive?.()
      }
    }
    // ease in-out
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
    const d = e * total
    let i = 1
    while (i < cumulative.length - 1 && cumulative[i] < d) i++
    const segLen = cumulative[i] - cumulative[i - 1] || 1
    const local = (d - cumulative[i - 1]) / segLen
    ref.current.position.lerpVectors(vecs[i - 1] ?? vecs[0], vecs[i] ?? vecs[0], Math.min(1, Math.max(0, local)))
    ref.current.rotation.y += 0.05
  })

  return (
    <group ref={ref} position={vecs[0]}>
      <mesh>
        <boxGeometry args={[0.32, 0.22, 0.22]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <pointLight color={color} intensity={2} distance={2.5} />
      {label && (
        <Label3D position={[0, 0.45, 0]}>
          <span style={{ color }}>■</span> {label}
        </Label3D>
      )}
    </group>
  )
}
