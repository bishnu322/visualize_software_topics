export interface GNode {
  id: string
  x: number
  y: number
}
export interface GEdge {
  a: string
  b: string
  label?: string | number
}

/** Simple SVG node/edge graph with highlight sets. Coordinates are in a 600×360 space. */
export function GraphView({
  nodes,
  edges,
  activeNodes = [],
  doneNodes = [],
  activeEdges = [],
  pathEdges = [],
  nodeBadges = {},
  onNodeClick,
  onEdgeClick,
}: {
  nodes: GNode[]
  edges: GEdge[]
  activeNodes?: string[]
  doneNodes?: string[]
  activeEdges?: string[]
  pathEdges?: string[]
  nodeBadges?: Record<string, string>
  onNodeClick?: (id: string) => void
  onEdgeClick?: (e: GEdge) => void
}) {
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const key = (e: GEdge) => [e.a, e.b].sort().join('-')
  return (
    <svg viewBox="0 0 600 360" className="w-full select-none" role="img" aria-label="Network graph">
      {edges.map((e) => {
        const a = pos[e.a]
        const b = pos[e.b]
        const k = key(e)
        const active = activeEdges.includes(k)
        const path = pathEdges.includes(k)
        return (
          <g key={k} onClick={() => onEdgeClick?.(e)} className={onEdgeClick ? 'cursor-pointer' : ''}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={18} />
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeWidth={active || path ? 5 : 3}
              className={active ? 'stroke-amber-500' : path ? 'stroke-emerald-500' : 'stroke-slate-300 dark:stroke-slate-600'}
              strokeLinecap="round"
            />
            {e.label !== undefined && (
              <g>
                <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r={13} className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-600" />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 4} textAnchor="middle" className="fill-slate-700 font-mono text-[12px] font-bold dark:fill-slate-200">
                  {e.label}
                </text>
              </g>
            )}
          </g>
        )
      })}
      {nodes.map((n) => {
        const active = activeNodes.includes(n.id)
        const done = doneNodes.includes(n.id)
        return (
          <g key={n.id} onClick={() => onNodeClick?.(n.id)} className={onNodeClick ? 'cursor-pointer' : ''}>
            <circle
              cx={n.x}
              cy={n.y}
              r={24}
              className={
                active
                  ? 'fill-amber-400 stroke-amber-600'
                  : done
                    ? 'fill-emerald-500 stroke-emerald-700'
                    : 'fill-brand-500 stroke-brand-700'
              }
              strokeWidth={3}
            />
            <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-white text-[14px] font-bold">
              {n.id}
            </text>
            {nodeBadges[n.id] !== undefined && (
              <g>
                <rect x={n.x - 22} y={n.y - 50} width={44} height={20} rx={10} className="fill-slate-800 dark:fill-slate-100" />
                <text x={n.x} y={n.y - 36} textAnchor="middle" className="fill-white font-mono text-[12px] font-bold dark:fill-slate-900">
                  {nodeBadges[n.id]}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
