import { motion } from 'framer-motion'

export interface SeqMessage {
  from: number
  to: number
  label: string
  sub?: string
  color?: string
}

/**
 * Lanes (vertical lifelines) with arrows between them.
 * Messages up to `upTo` are shown; the last one animates in.
 */
export function SequenceDiagram({
  lanes,
  messages,
  upTo,
  laneStates,
}: {
  lanes: string[]
  messages: SeqMessage[]
  upTo: number
  laneStates?: string[]
}) {
  const W = 640
  const rowH = 54
  const top = 56
  const H = top + Math.max(messages.length, 1) * rowH + 40
  const x = (i: number) => 70 + (i * (W - 140)) / Math.max(1, lanes.length - 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Sequence diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>
      {lanes.map((l, i) => (
        <g key={l}>
          <rect x={x(i) - 60} y={6} width={120} height={30} rx={8} className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" />
          <text x={x(i)} y={26} textAnchor="middle" className="fill-slate-800 text-[13px] font-semibold dark:fill-slate-100">
            {l}
          </text>
          <line x1={x(i)} y1={36} x2={x(i)} y2={H - 30} strokeDasharray="4 4" className="stroke-slate-300 dark:stroke-slate-600" />
          {laneStates?.[i] && (
            <g>
              <rect x={x(i) - 60} y={H - 28} width={120} height={22} rx={11} className="fill-brand-100 dark:fill-brand-500/20" />
              <text x={x(i)} y={H - 13} textAnchor="middle" className="fill-brand-700 font-mono text-[11px] font-semibold dark:fill-brand-400">
                {laneStates[i]}
              </text>
            </g>
          )}
        </g>
      ))}
      {messages.slice(0, upTo + 1).map((m, i) => {
        const y = top + i * rowH + 24
        const x1 = x(m.from)
        const x2 = x(m.to)
        const latest = i === upTo
        const color = m.color ?? '#0ea5e9'
        const same = m.from === m.to
        return (
          <g key={i} opacity={latest ? 1 : 0.55}>
            {same ? (
              <motion.path
                d={`M${x1},${y} h40 v18 h-40`}
                fill="none"
                stroke={color}
                strokeWidth={2}
                markerEnd="url(#arrow)"
                initial={{ pathLength: latest ? 0 : 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
            ) : (
              <motion.line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y + 14}
                stroke={color}
                strokeWidth={latest ? 2.5 : 2}
                markerEnd="url(#arrow)"
                initial={{ pathLength: latest ? 0 : 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              />
            )}
            <text
              x={same ? x1 + 48 : (x1 + x2) / 2}
              y={m.sub ? y - 17 : y - 5}
              textAnchor={same ? 'start' : 'middle'}
              className="font-mono text-[12px] font-semibold"
              fill={color}
            >
              {m.label}
            </text>
            {m.sub && (
              <text x={same ? x1 + 48 : (x1 + x2) / 2} y={y - 4} textAnchor={same ? 'start' : 'middle'} className="fill-slate-500 font-mono text-[10.5px] dark:fill-slate-400">
                {m.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
