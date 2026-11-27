import { useMemo, useState } from 'react'
import { isValidIp, subnetInfo, toBinary, ipToInt } from '@/engine/subnet'
import { BinaryBits } from '@/components/viz/BinaryBits'
import { VizFrame } from '@/components/lesson/VizFrame'
import { Badge } from '@/components/ui'

const PRESETS = ['192.168.1.10/24', '10.0.5.77/8', '172.16.40.9/20', '192.168.1.130/26', '203.0.113.5/30']

export function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.1.130')
  const [prefix, setPrefix] = useState(26)
  const valid = isValidIp(ip)
  const info = useMemo(() => (valid ? subnetInfo(ip, prefix) : null), [ip, prefix, valid])

  return (
    <VizFrame title="Subnet calculator" hint="Drag the slider and watch the bits">
      <div className="space-y-5 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium">IP address</span>
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              spellCheck={false}
              className={`h-10 w-44 rounded-lg border bg-white px-3 font-mono dark:bg-slate-800 ${valid ? 'border-slate-300 dark:border-slate-700' : 'border-red-500'}`}
            />
          </label>
          <label className="min-w-56 flex-1 text-sm">
            <span className="mb-1 flex justify-between font-medium">
              <span>Prefix length</span>
              <span className="font-mono text-brand-600">/{prefix}</span>
            </span>
            <input type="range" min={0} max={32} value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} className="w-full accent-sky-500" />
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                const [a, b] = p.split('/')
                setIp(a)
                setPrefix(Number(b))
              }}
              className="rounded-md border border-slate-200 px-2 py-1 font-mono text-xs hover:border-brand-400 dark:border-slate-700"
            >
              {p}
            </button>
          ))}
        </div>

        {!info ? (
          <p className="text-sm text-red-500">Enter a valid IPv4 address (four numbers 0–255 separated by dots).</p>
        ) : (
          <>
            <div className="space-y-3 overflow-x-auto">
              <BinaryBits label={`IP address: ${info.ip}`} binary={info.ipBinary} prefix={prefix} />
              <BinaryBits label={`Subnet mask: ${info.mask}`} binary={info.maskBinary} prefix={prefix} />
              <BinaryBits label={`Network (IP AND mask): ${info.network}`} binary={toBinary(ipToInt(info.network))} prefix={prefix} />
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-500" /> Network bits ({prefix})</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-500/40" /> Host bits ({32 - prefix})</span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[
                ['Network', info.network],
                ['Broadcast', info.broadcast],
                ['First host', info.firstHost],
                ['Last host', info.lastHost],
                ['Usable hosts', info.usableHosts.toLocaleString()],
                ['Total addresses', info.totalAddresses.toLocaleString()],
                ['Mask', info.mask],
                ['Wildcard', info.wildcard],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-mono font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Badge color="brand">Class {info.ipClass}</Badge>
              <Badge color={info.isPrivate ? 'green' : 'amber'}>{info.isPrivate ? 'Private (RFC 1918)' : 'Public'}</Badge>
              {prefix >= 31 && <Badge color="purple">{prefix === 31 ? '/31 point-to-point (RFC 3021)' : '/32 single host'}</Badge>}
            </div>
          </>
        )}
      </div>
    </VizFrame>
  )
}
