import { useEffect, useRef, useState } from 'react'
import { useIsDark } from '@/hooks/useTheme'

export interface Series {
  name: string
  values: number[]
}

// Validated categorical palette (dataviz validator: light on #fff, dark on #0f172a).
const PALETTE = { light: ['#0284c7', '#d97706'], dark: ['#0ea5e9', '#d97706'] }

interface Props {
  series: Series[]
  /** Fixed y maximum; defaults to the data max. */
  yMax?: number
  format?: (v: number) => string
  height?: number
  /** Accessible name; also the visible title when there is one series. */
  label: string
  xLabel?: string
}

/** Small time-series chart: 2px lines, recessive grid, crosshair + tooltip on hover. */
export function LineChart({ series, yMax, format = (v) => String(Math.round(v)), height = 150, label, xLabel = 'time' }: Props) {
  const dark = useIsDark()
  const colors = PALETTE[dark ? 'dark' : 'light']
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = Math.max(2, ...series.map((s) => s.values.length))
  const max = yMax ?? Math.max(1, ...series.flatMap((s) => s.values))
  const pad = { l: 36, r: 8, t: 8, b: 18 }
  const w = Math.max(50, width - pad.l - pad.r)
  const h = height - pad.t - pad.b
  const x = (i: number) => pad.l + (i / (n - 1)) * w
  const y = (v: number) => pad.t + h - (Math.min(v, max) / max) * h
  const ticks = [0, 0.5, 1].map((t) => t * max)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / w) * (n - 1))
    setHover(i >= 0 && i < n ? i : null)
  }

  return (
    <div ref={wrap} className="relative w-full">
      {series.length >= 2 && (
        <div className="mb-1 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
          {series.map((s, i) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: colors[i] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block touch-none"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">{format(t)}</text>
          </g>
        ))}
        <text x={pad.l + w} y={height - 4} textAnchor="end" className="fill-slate-400 text-[10px]">{xLabel} →</text>
        {series.map((s, si) =>
          s.values.length > 1 ? (
            <polyline
              key={s.name}
              fill="none"
              stroke={colors[si]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} className="stroke-slate-400" strokeWidth={1} />
            {series.map((s, si) =>
              s.values[hover] !== undefined ? (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={colors[si]} className="stroke-white dark:stroke-slate-900" strokeWidth={2} />
              ) : null,
            )}
          </g>
        )}
      </svg>
      {hover !== null && series.some((s) => s.values[hover] !== undefined) && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900"
          style={{ left: Math.min(x(hover) + 8, width - 120) }}
        >
          {series.map((s, si) =>
            s.values[hover] !== undefined ? (
              <div key={s.name} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: colors[si] }} />
                <b className="font-mono text-slate-900 dark:text-white">{format(s.values[hover])}</b>
                <span className="text-slate-500">{s.name}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
