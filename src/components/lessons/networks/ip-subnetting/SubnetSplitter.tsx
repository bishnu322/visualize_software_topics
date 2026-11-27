import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { splitSubnet } from '@/engine/subnet'
import { VizFrame } from '@/components/shared/lesson/VizFrame'

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#ec4899', '#6366f1']

export function SubnetSplitter() {
  const [borrow, setBorrow] = useState(2)
  const subnets = useMemo(() => splitSubnet('192.168.10.0/24', borrow), [borrow])
  return (
    <VizFrame title="Splitting 192.168.10.0/24 into subnets" hint="Borrow host bits to make more, smaller networks">
      <div className="space-y-4 p-4">
        <label className="block text-sm">
          <span className="mb-1 flex justify-between font-medium">
            <span>Borrowed bits: {borrow}</span>
            <span className="font-mono text-brand-600">
              2<sup>{borrow}</sup> = {2 ** borrow} subnets of /{24 + borrow}
            </span>
          </span>
          <input type="range" min={0} max={6} value={borrow} onChange={(e) => setBorrow(Number(e.target.value))} className="w-full accent-sky-500" />
        </label>
        {/* address space bar */}
        <div className="flex h-10 overflow-hidden rounded-lg">
          {subnets.map((s, i) => (
            <motion.div
              key={`${borrow}-${i}`}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex flex-1 items-center justify-center border-r border-white/60 text-[10px] font-bold text-white last:border-r-0"
              style={{ background: COLORS[i % COLORS.length] }}
              title={`${s.network}/${s.prefix}`}
            >
              {subnets.length <= 16 ? `.${s.network.split('.')[3]}` : ''}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between font-mono text-xs text-slate-500">
          <span>.0</span>
          <span>.255</span>
        </div>
        <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left font-mono text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2">Subnet</th>
                <th className="px-3 py-2">Hosts</th>
                <th className="hidden px-3 py-2 sm:table-cell">Range</th>
                <th className="px-3 py-2">Broadcast</th>
              </tr>
            </thead>
            <tbody>
              {subnets.map((s, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.network}/{s.prefix}
                  </td>
                  <td className="px-3 py-1.5">{s.usableHosts}</td>
                  <td className="hidden px-3 py-1.5 sm:table-cell">{s.firstHost} – {s.lastHost.split('.')[3]}</td>
                  <td className="px-3 py-1.5">{s.broadcast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </VizFrame>
  )
}
