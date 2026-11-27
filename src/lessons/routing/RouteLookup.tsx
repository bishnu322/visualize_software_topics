import { useMemo, useState } from 'react'
import { longestPrefixMatch, type Route } from '@/engine/routing'
import { isValidIp } from '@/engine/subnet'
import { VizFrame } from '@/components/lesson/VizFrame'

const TABLE: Route[] = [
  { prefix: '192.168.1.0/24', nextHop: 'directly connected', iface: 'Gi0/0', source: 'C', ad: 0, metric: 0 },
  { prefix: '10.0.0.0/8', nextHop: '172.16.0.2', iface: 'Gi0/1', source: 'O', ad: 110, metric: 20 },
  { prefix: '10.1.0.0/16', nextHop: '172.16.0.6', iface: 'Gi0/2', source: 'O', ad: 110, metric: 30 },
  { prefix: '10.1.5.0/24', nextHop: '172.16.0.10', iface: 'Gi0/3', source: 'S', ad: 1, metric: 0 },
  { prefix: '0.0.0.0/0', nextHop: '203.0.113.1', iface: 'Gi0/4', source: 'S*', ad: 1, metric: 0 },
]
const EXAMPLES = ['10.1.5.20', '10.1.9.9', '10.200.0.1', '192.168.1.55', '8.8.8.8']

export function RouteLookup() {
  const [dest, setDest] = useState('10.1.5.20')
  const valid = isValidIp(dest)
  const { best, matches } = useMemo(() => (valid ? longestPrefixMatch(TABLE, dest) : { best: -1, matches: [] }), [dest, valid])
  return (
    <VizFrame title="Routing table lookup: longest prefix match" hint="Type a destination IP">
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            spellCheck={false}
            className={`h-9 w-40 rounded-lg border bg-white px-3 font-mono text-sm dark:bg-slate-800 ${valid ? 'border-slate-300 dark:border-slate-700' : 'border-red-500'}`}
          />
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => setDest(e)} className="rounded-md border border-slate-200 px-2 py-1 font-mono text-xs hover:border-brand-400 dark:border-slate-700">
              {e}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] font-mono text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="p-2">Code</th><th className="p-2">Network</th><th className="p-2">[AD/metric]</th><th className="p-2">Next hop</th><th className="p-2">Interface</th></tr>
            </thead>
            <tbody>
              {TABLE.map((r, i) => (
                <tr
                  key={r.prefix}
                  className={`border-t border-slate-100 transition-colors dark:border-slate-800 ${
                    i === best
                      ? 'bg-emerald-100 font-bold text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
                      : matches.includes(i)
                        ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                        : 'opacity-50'
                  }`}
                >
                  <td className="p-2">{r.source}</td><td className="p-2">{r.prefix}</td><td className="p-2">[{r.ad}/{r.metric}]</td><td className="p-2">{r.nextHop}</td><td className="p-2">{r.iface}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {!valid ? 'Enter a valid IPv4 address.' : best === -1 ? 'No route: packet dropped.' : (
            <>{matches.length} route{matches.length > 1 ? 's' : ''} match (amber). The router picks the <b className="text-emerald-600">most specific one: {TABLE[best].prefix}</b> → out {TABLE[best].iface}.</>
          )}
        </p>
      </div>
    </VizFrame>
  )
}
