import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { QuadraticBezierCurve3, Vector3, type Group, type Mesh } from 'three'

const R = 2.4

function fibonacciSphere(n: number): Vector3[] {
  const pts: Vector3[] = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = phi * i
    pts.push(new Vector3(Math.cos(t) * r, y, Math.sin(t) * r).multiplyScalar(R))
  }
  return pts
}

function arc(a: Vector3, b: Vector3) {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  mid.setLength(R + a.distanceTo(b) * 0.35)
  return new QuadraticBezierCurve3(a, mid, b)
}

function ArcPacket({ curve, offset, speed, color }: { curve: QuadraticBezierCurve3; offset: number; speed: number; color: string }) {
  const ref = useRef<Mesh>(null)
  useFrame((s) => {
    const t = (s.clock.elapsedTime * speed + offset) % 1
    ref.current?.position.copy(curve.getPoint(t))
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

const COLORS = ['#38bdf8', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']

/** Decorative rotating globe of nodes with packets flying along arcs. */
export function NetworkGlobe({ dark }: { dark: boolean }) {
  const group = useRef<Group>(null)
  const nodes = useMemo(() => fibonacciSphere(46), [])
  const arcs = useMemo(() => {
    // deterministic pseudo-random pairs
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: 22 }, (_, i) => {
      const a = nodes[Math.floor(rnd() * nodes.length)]
      let b = nodes[Math.floor(rnd() * nodes.length)]
      if (a === b) b = nodes[(nodes.indexOf(a) + 9) % nodes.length]
      const curve = arc(a, b)
      return { curve, pts: curve.getPoints(32), color: COLORS[i % COLORS.length], offset: rnd(), speed: 0.15 + rnd() * 0.25 }
    })
  }, [nodes])

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.12
  })

  return (
    <group ref={group} rotation={[0.35, 0, 0.1]}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshStandardMaterial color={dark ? '#0f172a' : '#e0f2fe'} transparent opacity={0.85} roughness={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R, 24, 18]} />
        <meshBasicMaterial color={dark ? '#1e3a5f' : '#7dd3fc'} wireframe transparent opacity={0.35} />
      </mesh>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color={dark ? '#7dd3fc' : '#0284c7'} />
        </mesh>
      ))}
      {arcs.map((a, i) => (
        <group key={i}>
          <Line points={a.pts} color={a.color} lineWidth={1.2} transparent opacity={0.55} />
          <ArcPacket curve={a.curve} offset={a.offset} speed={a.speed} color={a.color} />
        </group>
      ))}
    </group>
  )
}
