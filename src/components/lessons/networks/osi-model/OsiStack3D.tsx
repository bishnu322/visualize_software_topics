import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { OSI_LAYERS, type OsiLayer } from '@/engine/osi'
import { SceneCanvas, Label3D } from '@/components/shared/three'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Badge, Tabs } from '@/components/shared/ui'

const H = 0.5
const GAP = 0.12
const yOf = (n: number) => (n - 1) * (H + GAP)

function Slab({ layer, selected, onSelect }: { layer: OsiLayer; selected: boolean; onSelect: () => void }) {
  const ref = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  useFrame(() => {
    if (!ref.current) return
    const tx = selected ? 1.2 : hover ? 0.3 : 0
    ref.current.position.x += (tx - ref.current.position.x) * 0.12
  })
  return (
    <group ref={ref} position={[0, yOf(layer.n), 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <boxGeometry args={[4, H, 2.4]} />
        <meshStandardMaterial
          color={layer.color}
          roughness={0.35}
          emissive={layer.color}
          emissiveIntensity={selected ? 0.5 : hover ? 0.25 : 0.05}
          transparent
          opacity={0.92}
        />
      </mesh>
      <Label3D position={[0, 0, 1.25]} tone={selected ? 'active' : 'default'}>
        L{layer.n} · {layer.name}
      </Label3D>
    </group>
  )
}

function TcpIpColumn() {
  const groups: { name: string; from: number; to: number; color: string }[] = [
    { name: 'Application', from: 5, to: 7, color: '#f97316' },
    { name: 'Transport', from: 4, to: 4, color: '#22c55e' },
    { name: 'Internet', from: 3, to: 3, color: '#06b6d4' },
    { name: 'Link', from: 1, to: 2, color: '#6366f1' },
  ]
  return (
    <group position={[-3.6, 0, 0]}>
      {groups.map((g) => {
        const y0 = yOf(g.from) - H / 2
        const y1 = yOf(g.to) + H / 2
        const h = y1 - y0
        return (
          <group key={g.name} position={[0, y0 + h / 2, 0]}>
            <mesh>
              <boxGeometry args={[2.4, h, 2.4]} />
              <meshStandardMaterial color={g.color} transparent opacity={0.55} roughness={0.5} />
            </mesh>
            <Label3D position={[0, 0, 1.25]}>{g.name}</Label3D>
          </group>
        )
      })}
      <Label3D position={[0, yOf(7) + 0.75, 0]} tone="muted">TCP/IP</Label3D>
    </group>
  )
}

export function OsiStack3D() {
  const [sel, setSel] = useState<number>(4)
  const [mode, setMode] = useState<'osi' | 'both'>('osi')
  const layer = OSI_LAYERS.find((l) => l.n === sel)!
  return (
    <VizFrame title="The OSI stack in 3D" hint="Click a layer to pull it out">
      <div className="flex justify-end px-4 pt-3">
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: 'osi', label: 'OSI (7 layers)' },
            { value: 'both', label: 'Compare with TCP/IP' },
          ]}
        />
      </div>
      <SceneCanvas camera={mode === 'both' ? [3, 4.5, 10] : [5, 4, 8]} target={[mode === 'both' ? -1 : 0, 1.9, 0]}>
        {OSI_LAYERS.map((l) => (
          <Slab key={l.n} layer={l} selected={l.n === sel} onSelect={() => setSel(l.n)} />
        ))}
        {mode === 'both' && <TcpIpColumn />}
      </SceneCanvas>
      <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-[1fr_auto] dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: layer.color }} />
            <span className="text-lg font-bold">Layer {layer.n}: {layer.name}</span>
            <Badge color="brand">PDU: {layer.pdu}</Badge>
            <Badge>TCP/IP: {layer.tcpip}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{layer.role}</p>
          <p className="mt-2 text-sm"><span className="font-semibold">Devices:</span> {layer.devices}</p>
        </div>
        <div className="flex flex-wrap content-start gap-1.5 sm:max-w-56 sm:justify-end">
          {layer.examples.map((e) => (
            <span key={e} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">{e}</span>
          ))}
        </div>
      </div>
    </VizFrame>
  )
}
