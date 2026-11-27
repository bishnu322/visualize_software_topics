import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { useProgress } from '@/store/progress'

export function CompleteBanner({ slug }: { slug: string }) {
  const { completed, markComplete } = useProgress()
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      {completed.includes(slug) ? (
        <span className="flex items-center gap-2 font-medium text-emerald-600">
          <CheckCircle2 size={18} /> Lesson completed
        </span>
      ) : (
        <>
          <span className="text-sm text-slate-600 dark:text-slate-400">Finished reading? Get every quiz question right, or</span>
          <Button size="sm" variant="primary" onClick={() => markComplete(slug)}>Mark as complete</Button>
        </>
      )}
    </div>
  )
}
