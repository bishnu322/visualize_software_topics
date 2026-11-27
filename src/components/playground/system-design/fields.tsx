import type { ReactNode } from 'react'

export const inputCls =
  'h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 flex justify-between gap-2 font-medium text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        {hint && <span className="font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

/** Number input that ignores empty/invalid typing instead of storing NaN. */
export function NumberField({
  label, value, onChange, min = 0, max, step = 1, hint,
}: {
  label: ReactNode
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  hint?: ReactNode
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        className={inputCls}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = e.target.valueAsNumber
          if (Number.isFinite(v)) onChange(Math.min(max ?? Infinity, Math.max(min, v)))
        }}
      />
    </Field>
  )
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-slate-200 pt-3 dark:border-slate-800">
      <legend className="pr-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</legend>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </fieldset>
  )
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'bad' | 'warn' | 'good' }) {
  return (
    <div className="rounded-lg bg-white px-2 py-1.5 dark:bg-slate-900">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={
          'font-mono text-sm font-semibold ' +
          (tone === 'bad' ? 'text-red-600 dark:text-red-400' : tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100')
        }
      >
        {value}
      </div>
    </div>
  )
}
