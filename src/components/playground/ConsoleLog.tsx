export function ConsoleLog({ lines }: { lines: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Console</div>
      <div className="h-28 overflow-y-auto rounded-lg bg-slate-950 p-2 font-mono text-xs text-emerald-400" data-testid="console">
        {lines.length === 0 ? (
          <span className="text-slate-500">$ waiting for activity…</span>
        ) : (
          lines.map((l, i) => (
            <div key={i} className={l.startsWith('✗') ? 'text-red-400' : ''}>{l}</div>
          ))
        )}
      </div>
    </div>
  )
}
