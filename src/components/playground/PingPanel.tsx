import { Send } from 'lucide-react'
import { Badge, Button } from '@/components/shared/ui'
import type { PlaygroundState } from './usePlayground'

const select = 'h-9 rounded-lg border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-800'

export function PingPanel({ pg }: { pg: PlaygroundState }) {
  const { endpoints, pingSrc, pingDst, topo } = pg
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ping</div>
      {endpoints.length < 2 ? (
        <p className="text-sm text-slate-500">Add at least two PCs, laptops or servers to ping between.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select value={pingSrc} onChange={(e) => pg.setSrc(e.target.value)} className={select} aria-label="Source">
            {endpoints.map((n) => <option key={n.id}>{n.id}</option>)}
          </select>
          <span>→</span>
          <select value={pingDst} onChange={(e) => pg.setDst(e.target.value)} className={select} aria-label="Destination">
            {endpoints.filter((n) => n.id !== pingSrc).map((n) => <option key={n.id}>{n.id}</option>)}
          </select>
          <Button size="sm" variant="primary" onClick={pg.sendPing}><Send size={14} /> Ping</Button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge>{topo.nodes.length} devices</Badge>
        <Badge>{topo.edges.length} cables</Badge>
      </div>
    </div>
  )
}
