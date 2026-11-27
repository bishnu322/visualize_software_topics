import { Cable, Eraser, LayoutTemplate, MousePointer2, Pause, Play, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/shared/ui'
import { COMPONENTS, PALETTE } from '@/engine/sd/designer/components'
import { FLOW_STYLE, KIND_ICONS } from './kindIcons'
import type { DesignerMode, DesignerState } from './useDesigner'

const sameMode = (a: DesignerMode, b: DesignerMode) => a.kind === b.kind && (a.kind !== 'place' || (b.kind === 'place' && a.type === b.type))

export function DesignerToolbar({ d, simulating, onToggleSim }: { d: DesignerState; simulating: boolean; onToggleSim: () => void }) {
  const tool = (m: DesignerMode, icon: ReactNode, label: string, title = label) => (
    <Button size="sm" variant={sameMode(m, d.mode) ? 'primary' : 'secondary'} onClick={() => d.setMode(m)} title={title}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-1.5 p-3 pb-2">
        {tool({ kind: 'select' }, <MousePointer2 size={16} />, 'Select')}
        {tool({ kind: 'connect' }, <Cable size={16} />, 'Connect')}
        {tool({ kind: 'delete' }, <Trash2 size={16} />, 'Delete')}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <Button size="sm" variant={simulating ? 'primary' : 'secondary'} onClick={onToggleSim} title="Animate requests flowing through the design">
          {simulating ? <Pause size={16} /> : <Play size={16} />}
          <span className="hidden sm:inline">{simulating ? 'Pause' : 'Simulate'}</span>
        </Button>
        <span className="ml-auto flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={d.loadExample} title="Load example"><LayoutTemplate size={16} /><span className="hidden md:inline">Example</span></Button>
          <Button size="sm" variant="ghost" onClick={d.clear} title="Clear the design"><Eraser size={16} /><span className="hidden md:inline">Clear</span></Button>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-3" role="toolbar" aria-label="Components">
        {PALETTE.map((kind) => {
          const Icon = KIND_ICONS[kind]
          const spec = COMPONENTS[kind]
          const on = sameMode({ kind: 'place', type: kind }, d.mode)
          return (
            <Button key={kind} size="sm" variant={on ? 'primary' : 'secondary'} onClick={() => d.setMode({ kind: 'place', type: kind })} title={spec.description}>
              <Icon size={15} style={on ? undefined : { color: spec.color }} />
              <span className="text-xs sm:text-sm">{spec.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function DesignerHint({ d, simulating }: { d: DesignerState; simulating: boolean }) {
  const { mode, pending } = d
  const text =
    mode.kind === 'place' ? `Click the floor to place a ${COMPONENTS[mode.type].label.toLowerCase()}.`
    : mode.kind === 'connect' ? (pending ? `Now click where ${pending} sends its requests.` : 'Click the sender, then the receiver. Requests flow in the arrow’s direction.')
    : mode.kind === 'delete' ? 'Click a component or connection to delete it.'
    : 'Click a component to configure it; click a connection to flip its direction. Drag to rotate.'
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">
      <span>{text}</span>
      {simulating && (
        <span className="ml-auto flex gap-3 text-xs">
          {Object.values(FLOW_STYLE).map((f) => (
            <span key={f.name} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: f.color }} /> {f.name}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}
