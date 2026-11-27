import { useState } from 'react'
import { ConsoleLog } from '@/components/playground/ConsoleLog'
import { PlaygroundTabs } from '@/components/playground/PlaygroundTabs'
import { DesignerHint, DesignerToolbar } from '@/components/playground/system-design/DesignerToolbar'
import { DesignerScene } from '@/components/playground/system-design/DesignerScene'
import { InspectorPanel } from '@/components/playground/system-design/InspectorPanel'
import { ReportPanel } from '@/components/playground/system-design/ReportPanel'
import { RequirementsPanel } from '@/components/playground/system-design/RequirementsPanel'
import { useDesigner } from '@/components/playground/system-design/useDesigner'

export default function SystemDesignPlayground() {
  const d = useDesigner()
  const [simulating, setSimulating] = useState(false)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <PlaygroundTabs />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">System Design Playground</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Set the requirements, wire up an architecture, and see whether it holds: load, p99 latency, availability, storage and cost update as you build. Your design is saved in this browser.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <DesignerToolbar d={d} simulating={simulating} onToggleSim={() => setSimulating((s) => !s)} />
        <DesignerHint d={d} simulating={simulating} />
        <DesignerScene d={d} simulating={simulating} />
        <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-3 dark:border-slate-800">
          <RequirementsPanel d={d} />
          <div className="space-y-4">
            <InspectorPanel d={d} />
            <ConsoleLog lines={d.log} />
          </div>
          <ReportPanel d={d} />
        </div>
      </div>
    </div>
  )
}
