import { useMemo, useState } from 'react'
import { dijkstraSteps, pathTo, routingTable, type Graph } from '@/engine/routing'
import { useStepAnimation } from '@/hooks/useStepAnimation'
import { GraphView, type GNode } from '@/components/shared/viz/GraphView'
import { StepPlayer } from '@/components/shared/lesson/StepPlayer'
import { VizFrame } from '@/components/shared/lesson/VizFrame'
import { Panel } from '@/components/shared/ui'

const NODES: GNode[] = [
  { id: 'R1', x: 70, y: 180 },
  { id: 'R2', x: 210, y: 70 },
  { id: 'R3', x: 230, y: 290 },
  { id: 'R4', x: 390, y: 170 },
  { id: 'R5', x: 400, y: 310 },
  { id: 'R6', x: 540, y: 120 },
]

const INITIAL: Graph = {
  nodes: NODES.map((n) => n.id),
  edges: [
    { a: 'R1', b: 'R2', cost: 4 },
    { a: 'R1', b: 'R3', cost: 2 },
    { a: 'R2', b: 'R3', cost: 1 },
    { a: 'R2', b: 'R4', cost: 5 },
    { a: 'R3', b: 'R4', cost: 8 },
    { a: 'R3', b: 'R5', cost: 10 },
    { a: 'R4', b: 'R5', cost: 2 },
    { a: 'R4', b: 'R6', cost: 6 },
    { a: 'R5', b: 'R6', cost: 3 },
  ],
}

const k = (a: string, b: string) => [a, b].sort().join('-')

export function RoutingViz() {
  const [graph, setGraph] = useState(INITIAL)
  const [source, setSource] = useState('R1')
  const [dest, setDest] = useState('R6')
  const steps = useMemo(() => dijkstraSteps(graph, source), [graph, source])
  const ctl = useStepAnimation(steps, 1800)
  const { dist, prev, visited, current, relaxing } = ctl.step.data
  const table = useMemo(() => routingTable(graph, source), [graph, source])
  const finalPath = ctl.isLast ? pathTo(prev, dest) : []
  const pathEdges = finalPath.slice(1).map((n, i) => k(finalPath[i], n))

  const bumpCost = (a: string, b: string) =>
    setGraph((g) => ({
      ...g,
      edges: g.edges.map((e) => (k(e.a, e.b) === k(a, b) ? { ...e, cost: (e.cost % 10) + 1 } : e)),
    }))

  return (
    <VizFrame title="Dijkstra's shortest path (what OSPF runs)" hint="Click a router to set the source · click a cost to change it">
      <div className="px-2 pt-2">
        <GraphView
          nodes={NODES}
          edges={graph.edges.map((e) => ({ ...e, label: e.cost }))}
          activeNodes={current ? [current] : []}
          doneNodes={visited.filter((v) => v !== current)}
          activeEdges={relaxing ? [k(relaxing.a, relaxing.b)] : []}
          pathEdges={pathEdges}
          nodeBadges={Object.fromEntries(Object.entries(dist).map(([n, d]) => [n, d === Infinity ? '∞' : String(d)]))}
          onNodeClick={(id) => (id === source ? undefined : setSource(id))}
          onEdgeClick={(e) => bumpCost(e.a, e.b)}
        />
      </div>
      <div className="flex flex-wrap gap-4 px-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-400" /> current</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /> finalised</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-brand-500" /> unvisited</span>
        <span className="flex items-center gap-1"><span className="h-1 w-4 rounded bg-amber-500" /> checking link</span>
        <span>Badge = best known cost from <b>{source}</b></span>
      </div>
      <div className="grid gap-3 p-4 text-sm md:grid-cols-2">
        <Panel title={`Routing table of ${source} (result)`}>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-slate-500"><th>Dest</th><th>Next hop</th><th>Cost</th><th>Path</th></tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr
                  key={r.destination}
                  onClick={() => setDest(r.destination)}
                  className={`cursor-pointer ${r.destination === dest ? 'text-emerald-600 dark:text-emerald-400' : ''} ${ctl.isLast ? '' : 'opacity-40'}`}
                >
                  <td>{r.destination}</td><td>{r.nextHop}</td><td>{r.cost}</td><td>{r.path.join('→')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ctl.isLast && <p className="mt-2 text-xs text-slate-500">Finish the animation to fill in the table.</p>}
          {ctl.isLast && <p className="mt-2 text-xs text-slate-500">Click a row to highlight that path.</p>}
        </Panel>
        <Panel title="Notice">
          <p className="text-slate-600 dark:text-slate-300">
            The router only installs the <b>next hop</b>, not the whole path. Each router along the way runs the same calculation and makes its own decision. Try raising the cost of R1–R3 to 10 and watch the routes change.
          </p>
        </Panel>
      </div>
      <StepPlayer ctl={ctl} />
    </VizFrame>
  )
}
