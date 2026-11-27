import { useMemo, useState } from 'react'
import { DNS_ACTORS, dnsSteps, type DnsActor } from '@/engine/dns'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { Device, Link, Packet, SceneCanvas } from '@/components/three'
import { StepPlayer } from '@/components/lesson/StepPlayer'
import { VizFrame } from '@/components/lesson/VizFrame'
import type { DeviceType } from '@/engine/types'

const POS: Record<DnsActor, [number, number, number]> = {
  browser: [-6, 0, 2.5],
  resolver: [-1.5, 0, 2.5],
  root: [-1, 0, -3],
  tld: [3, 0, -2],
  authoritative: [6, 0, 1.5],
}
const TYPE: Record<DnsActor, DeviceType> = { browser: 'laptop', resolver: 'server', root: 'server', tld: 'server', authoritative: 'server' }
const COLOR: Record<DnsActor, string> = { browser: '#0ea5e9', resolver: '#a855f7', root: '#ef4444', tld: '#f59e0b', authoritative: '#22c55e' }

const isValidDomain = (d: string) => /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(d)

export function DnsViz3D() {
  const [domain, setDomain] = useState('www.example.com')
  const [input, setInput] = useState(domain)
  const steps = useMemo(() => dnsSteps(domain), [domain])
  const ctl = useStepAnimation(steps, 2600)
  const { from, to, kind, message } = ctl.step.data
  const involved = new Set([from, to])

  return (
    <VizFrame title="DNS resolution, step by step" hint="Recursive query → iterative lookups">
      <form
        className="flex flex-wrap items-center gap-2 px-4 pt-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault()
          if (isValidDomain(input.trim())) setDomain(input.trim().toLowerCase())
        }}
      >
        <label htmlFor="dns-domain" className="font-medium">Look up</label>
        <input
          id="dns-domain"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className={`h-9 w-56 rounded-lg border bg-white px-3 font-mono dark:bg-slate-800 ${isValidDomain(input.trim()) ? 'border-slate-300 dark:border-slate-700' : 'border-red-500'}`}
        />
        <button className="h-9 rounded-lg bg-brand-600 px-3 font-medium text-white hover:bg-brand-700">Resolve</button>
      </form>
      <SceneCanvas camera={[0, 8, 10]} target={[0, 0, 0]}>
        {(['root', 'tld', 'authoritative'] as const).map((a) => (
          <Link key={a} from={POS.resolver} to={POS[a]} active={involved.has(a) && involved.has('resolver')} color="#cbd5e1" />
        ))}
        <Link from={POS.browser} to={POS.resolver} active={involved.has('browser') && involved.has('resolver')} />
        {DNS_ACTORS.map((a) => (
          <Device
            key={a.id}
            type={TYPE[a.id]}
            position={POS[a.id]}
            label={a.label}
            color={COLOR[a.id]}
            active={involved.has(a.id)}
            muted={!involved.has(a.id) && ctl.index > 0}
          />
        ))}
        {kind !== 'local' && (
          <Packet
            key={ctl.index}
            points={[POS[from], POS[to]]}
            duration={1.5}
            color={kind === 'query' ? '#f59e0b' : '#22c55e'}
            label={message}
          />
        )}
      </SceneCanvas>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3 text-xs dark:border-slate-800">
        {DNS_ACTORS.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[a.id] }} />
            <b>{a.label}</b> <span className="text-slate-500">{a.sub}</span>
          </span>
        ))}
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
