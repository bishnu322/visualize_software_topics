import { usePlayground } from '@/components/playground/usePlayground'
import { ModeHint, PlaygroundToolbar } from '@/components/playground/PlaygroundToolbar'
import { PlaygroundScene } from '@/components/playground/PlaygroundScene'
import { PingPanel } from '@/components/playground/PingPanel'
import { ConsoleLog } from '@/components/playground/ConsoleLog'

export default function Playground() {
  const pg = usePlayground()
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Network Playground</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Build your own topology, cable it up, and ping between devices. Your network is saved in this browser.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PlaygroundToolbar pg={pg} />
        <ModeHint pg={pg} />
        <PlaygroundScene pg={pg} />
        <div className="grid gap-4 border-t border-slate-200 p-4 md:grid-cols-2 dark:border-slate-800">
          <PingPanel pg={pg} />
          <ConsoleLog lines={pg.log} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Simplification: this sandbox finds the shortest cabled path. A real network also needs correct IP addressing, subnets and routing tables; those are covered in the lessons.
      </p>
    </div>
  )
}
