import { useState } from 'react'

export interface HeaderField {
  name: string
  bits: number
  value?: string
  desc: string
}

/** Header drawn as the classic 32-bit-wide RFC diagram. Click a field for its meaning. */
export function PacketHeader({ title, fields, color = '#0ea5e9' }: { title: string; fields: HeaderField[]; color?: string }) {
  const [sel, setSel] = useState<number | null>(null)
  // Split fields into 32-bit rows
  const rows: { f: HeaderField; i: number; bits: number }[][] = [[]]
  let used = 0
  fields.forEach((f, i) => {
    let remaining = f.bits
    while (remaining > 0) {
      const room = 32 - used
      const take = Math.min(room, remaining)
      rows[rows.length - 1].push({ f, i, bits: take })
      used += take
      remaining -= take
      if (used === 32) {
        rows.push([])
        used = 0
      }
    }
  })
  if (rows[rows.length - 1].length === 0) rows.pop()

  return (
    <div className="not-prose">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide">{title}</span>
        <span className="font-mono">0 ……… 31 bits</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px] space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-[repeat(32,minmax(0,1fr))] gap-1">
              {row.map(({ f, i, bits }, ci) => (
                <button
                  key={ci}
                  onClick={() => setSel(sel === i ? null : i)}
                  style={{
                    gridColumn: `span ${bits}`,
                    borderColor: sel === i ? color : undefined,
                    backgroundColor: sel === i ? `${color}22` : undefined,
                  }}
                  className="truncate rounded-md border border-slate-200 bg-slate-50 px-1 py-2 text-center text-[11px] leading-tight hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/70"
                  title={`${f.name} (${f.bits} bits)`}
                >
                  <div className="truncate font-semibold">{f.name}</div>
                  {f.value && <div className="truncate font-mono text-[10px] text-slate-500">{f.value}</div>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 min-h-10 text-sm text-slate-600 dark:text-slate-300">
        {sel !== null ? (
          <>
            <b style={{ color }}>{fields[sel].name}</b> <span className="font-mono text-xs text-slate-500">({fields[sel].bits} bits)</span>: {fields[sel].desc}
          </>
        ) : (
          <span className="text-slate-400">Click a field to see what it does.</span>
        )}
      </p>
    </div>
  )
}
