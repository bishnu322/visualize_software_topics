import { Cable, Eraser, Laptop, LayoutTemplate, Monitor, MousePointer2, Network as SwitchIcon, Router, Server, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/shared/ui'
import type { Mode, PlaygroundState } from './usePlayground'

const sameMode = (a: Mode, b: Mode) => a.kind === b.kind && (a.kind !== 'place' || (b.kind === 'place' && a.type === b.type))

export function PlaygroundToolbar({ pg }: { pg: PlaygroundState }) {
  const tool = (m: Mode, icon: ReactNode, label: string) => (
    <Button size="sm" variant={sameMode(m, pg.mode) ? 'primary' : 'secondary'} onClick={() => pg.setMode(m)} title={label}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
  const sep = <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 p-3 dark:border-slate-800">
      {tool({ kind: 'select' }, <MousePointer2 size={16} />, 'View')}
      {sep}
      {tool({ kind: 'place', type: 'pc' }, <Monitor size={16} />, 'PC')}
      {tool({ kind: 'place', type: 'laptop' }, <Laptop size={16} />, 'Laptop')}
      {tool({ kind: 'place', type: 'server' }, <Server size={16} />, 'Server')}
      {tool({ kind: 'place', type: 'switch' }, <SwitchIcon size={16} />, 'Switch')}
      {tool({ kind: 'place', type: 'router' }, <Router size={16} />, 'Router')}
      {sep}
      {tool({ kind: 'connect' }, <Cable size={16} />, 'Cable')}
      {tool({ kind: 'delete' }, <Trash2 size={16} />, 'Delete')}
      <span className="ml-auto flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={pg.loadExample} title="Load example"><LayoutTemplate size={16} /><span className="hidden md:inline">Example</span></Button>
        <Button size="sm" variant="ghost" onClick={pg.clear} title="Clear all"><Eraser size={16} /><span className="hidden md:inline">Clear</span></Button>
      </span>
    </div>
  )
}

export function ModeHint({ pg }: { pg: PlaygroundState }) {
  const { mode, pending } = pg
  const text =
    mode.kind === 'place' ? `Click the floor to place a ${mode.type}.`
    : mode.kind === 'connect' ? (pending ? `Now click a second device to connect it to ${pending}.` : 'Click a device, then another, to run a cable.')
    : mode.kind === 'delete' ? 'Click a device or cable to delete it.'
    : 'Drag to rotate the view. Pick a tool to edit the network.'
  return <div className="bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">{text}</div>
}
