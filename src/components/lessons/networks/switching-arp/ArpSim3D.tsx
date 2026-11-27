import { useMemo } from 'react'
import { arpSteps, DEFAULT_HOSTS } from '@/engine/arp'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Panel } from '@/components/shared/ui'

const SWITCH: [number, number, number] = [0, 0, 0]
const HOST_POS: Record<string, [number, number, number]> = {
  A: [-4.5, 0, -2.2],
  B: [4.5, 0, -2.2],
  C: [4.5, 0, 2.6],
  D: [-4.5, 0, 2.6],
}

export function ArpSim3D() {
  const steps = useMemo(() => arpSteps(DEFAULT_HOSTS, 'A', 'C'), [])
  const ctl = useStepAnimation(steps, 3200)
  const { activeHosts, direction, frame, macTable, arpCaches } = ctl.step.data
  const color = frame?.type === 'ARP Request' ? '#f59e0b' : frame?.type === 'ARP Reply' ? '#22c55e' : '#0ea5e9'
  const short = frame?.type === 'IPv4' ? 'IP packet' : frame?.type

  return (
    <VizFrame title="ARP + MAC learning on a switch" hint="A (192.168.1.10) wants to reach C (192.168.1.30)">
      <SceneCanvas camera={[0, 8, 9]}>
        <Device type="switch" position={SWITCH} label="Switch" active={direction !== 'none'} color="#0ea5e9" />
        {DEFAULT_HOSTS.map((h) => (
          <group key={h.id}>
            <Link from={HOST_POS[h.id]} to={SWITCH} active={activeHosts.includes(h.id)} />
            <Device
              type="pc"
              position={HOST_POS[h.id]}
              label={`${h.id} · port ${h.port}`}
              sublabel={`.${h.ip.split('.')[3]}`}
              color={h.id === 'A' ? '#22c55e' : h.id === 'C' ? '#f59e0b' : '#64748b'}
              active={activeHosts.includes(h.id) && direction !== 'none'}
            />
          </group>
        ))}
        {direction !== 'none' &&
          activeHosts.map((id) => (
            <Packet
              key={`${ctl.index}-${id}`}
              points={direction === 'to-switch' ? [HOST_POS[id], SWITCH] : [SWITCH, HOST_POS[id]]}
              duration={1.4}
              color={color}
              label={activeHosts.length === 1 ? short : undefined}
            />
          ))}
      </SceneCanvas>

      <div className="grid gap-3 border-t border-slate-200 p-4 text-sm md:grid-cols-3 dark:border-slate-800">
        <Panel title="Frame on the wire">
          {frame ? (
            <dl className="space-y-1 font-mono text-xs">
              <div><dt className="inline text-slate-500">type </dt><dd className="inline font-semibold" style={{ color }}>{frame.type}</dd></div>
              <div><dt className="inline text-slate-500">dst  </dt><dd className="inline">{frame.dstMac}</dd></div>
              <div><dt className="inline text-slate-500">src  </dt><dd className="inline">{frame.srcMac}</dd></div>
              <div className="pt-1 font-sans text-slate-700 dark:text-slate-300">{frame.info}</div>
            </dl>
          ) : (
            <span className="text-slate-400">No frame yet</span>
          )}
        </Panel>
        <Panel title="Switch MAC address table">
          {macTable.length === 0 ? (
            <span className="text-slate-400">Empty: the switch hasn't learned anything</span>
          ) : (
            <table className="w-full font-mono text-xs">
              <thead><tr className="text-left text-slate-500"><th>MAC</th><th>Port</th></tr></thead>
              <tbody>
                {macTable.map((e) => (
                  <tr key={e.mac}><td>{e.mac}</td><td>Fa0/{e.port}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="ARP caches">
          {(['A', 'C'] as const).map((id) => (
            <div key={id} className="mb-1 font-mono text-xs">
              <span className="font-sans font-semibold">{id}: </span>
              {arpCaches[id].length ? arpCaches[id].map((e) => `${e.ip} → ${e.mac}`).join(', ') : <span className="text-slate-400">empty</span>}
            </div>
          ))}
        </Panel>
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
