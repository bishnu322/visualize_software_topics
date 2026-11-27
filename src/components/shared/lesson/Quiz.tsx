import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useProgress } from '@/store/progress'
import { Button } from '@/components/shared/ui'

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  why: string
}

export function Quiz({ slug, questions }: { slug: string; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null))
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const answered = picked.filter((p) => p !== null).length
  const correct = picked.filter((p, i) => p === questions[i].answer).length

  const pick = (qi: number, oi: number) => {
    if (picked[qi] !== null) return
    const next = picked.map((p, i) => (i === qi ? oi : p))
    setPicked(next)
    if (next.every((p) => p !== null)) {
      recordQuiz(slug, next.filter((p, i) => p === questions[i].answer).length, questions.length)
    }
  }

  return (
    <section className="not-prose my-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Check your understanding</h2>
        <span className="font-mono text-sm text-slate-500">
          {correct}/{questions.length}
        </span>
      </div>
      <ol className="space-y-5">
        {questions.map((q, qi) => (
          <li key={qi} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-medium text-slate-900 dark:text-white">
              {qi + 1}. {q.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = picked[qi] === oi
                const done = picked[qi] !== null
                const isAnswer = oi === q.answer
                return (
                  <button
                    key={oi}
                    onClick={() => pick(qi, oi)}
                    disabled={done}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      done && isAnswer
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : chosen
                          ? 'border-red-400 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200'
                          : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    } ${done ? 'cursor-default' : ''}`}
                  >
                    {done && isAnswer && <CheckCircle2 size={16} className="shrink-0" />}
                    {chosen && !isAnswer && <XCircle size={16} className="shrink-0" />}
                    {o}
                  </button>
                )
              })}
            </div>
            {picked[qi] !== null && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{q.why}</p>}
          </li>
        ))}
      </ol>
      {answered === questions.length && (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-sm font-medium">
            You scored {correct}/{questions.length}. {correct === questions.length ? 'Lesson complete! 🎉' : 'Review the lesson and try again.'}
          </p>
          {correct < questions.length && (
            <Button size="sm" onClick={() => setPicked(questions.map(() => null))}>
              Retry
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
