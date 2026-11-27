import { useMemo } from 'react'
import { JOURNEY_DEVICES, JOURNEY_LINKS, journeySteps } from '@/engine/http'
import { OSI_LAYERS } from '@/engine/osi'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { Device, Link, Packet, SceneCanvas } from '@/components/three'
import { StepPlayer } from '@/components/lesson/StepPlayer'
import { VizFrame } from '@/components/lesson/VizFrame'

const PHASES = [
  { id: 'arp', label: 'ARP' },
  { id: 'dns', label: 'DNS' },
  { id: 'tcp', label: 'TCP' },
  { id: 'tls', label: 'TLS' },
  { id: 'http', label: 'HTTP' },
  { id: 'render', label: 'Render' },
] as const

export function Journey3D() {
  const steps = useMemo(() => journeySteps(), [])
  const ctl = useStepAnimation(steps, 3400)
  const { path, packet, color, layers, phase } = ctl.step.data
  const pos = useMemo(() => Object.fromEntries(JOURNEY_DEVICES.map((d) => [d.id, d.position])), [])
  const onPath = (a: string, b: string) => path.some((p, i) => i > 0 && ((path[i - 1] === a && p === b) || (path[i - 1] === b && p === a)))

  return (
    <VizFrame title="From URL to web page" hint="Press play and follow the packet">
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3">
        {PHASES.map((p) => (
          <span
            key={p.id}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
              phase === p.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}
          >
            {p.label}
          </span>
        ))}
        <span className="ml-auto flex gap-1">
          {OSI_LAYERS.slice().reverse().map((l) => (
            <span
              key={l.n}
              title={`L${l.n} ${l.name}`}
              className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition-all"
              style={{ background: layers.includes(l.n) ? l.color : `${l.color}22`, color: layers.includes(l.n) ? 'white' : l.color }}
            >
              L{l.n}
            </span>
          ))}
        </span>
      </div>
      <SceneCanvas camera={[0, 9, 11]}>
        {JOURNEY_LINKS.map((l) => (
          <Link key={`${l.from}-${l.to}`} from={pos[l.from]} to={pos[l.to]} active={onPath(l.from, l.to)} />
        ))}
        {JOURNEY_DEVICES.map((d) => (
          <Device
            key={d.id}
            type={d.type}
            position={d.position}
            label={d.label}
            active={path.includes(d.id) || (path.length === 0 && d.id === 'laptop')}
            color={d.id === 'web' ? '#ec4899' : d.id === 'dns' ? '#eab308' : d.id === 'laptop' ? '#22c55e' : '#0ea5e9'}
          />
        ))}
        {path.length > 1 && <Packet key={ctl.index} points={path.map((id) => pos[id])} duration={0.75 * path.length} color={color} label={packet} />}
      </SceneCanvas>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
