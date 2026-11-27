/** Display helpers shared by the analyser's messages and the playground UI. */

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  const a = Math.abs(n)
  if (a >= 1e9) return `${+(n / 1e9).toFixed(1)}B`
  if (a >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (a >= 1e4) return `${Math.round(n / 1e3)}k`
  if (a >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  if (a >= 10) return `${Math.round(n)}`
  return `${+n.toFixed(1)}`
}

export function fmtGb(gb: number): string {
  if (!Number.isFinite(gb)) return 'unlimited'
  if (gb >= 1e6) return `${+(gb / 1e6).toFixed(1)} PB`
  if (gb >= 1e3) return `${+(gb / 1e3).toFixed(1)} TB`
  if (gb >= 1) return `${+gb.toFixed(gb >= 10 ? 0 : 1)} GB`
  return `${Math.round(gb * 1000)} MB`
}

/** 0.99993 → "99.993%" (enough decimals to see the nines). */
export function fmtAvail(a: number): string {
  const p = a * 100
  if (p >= 100) return '100%'
  const digits = Math.min(4, Math.max(1, Math.ceil(-Math.log10(100 - p)) + 1))
  return `${p.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '')}%`
}

export function fmtDowntime(a: number): string {
  const hours = (1 - a) * 365 * 24
  if (hours >= 48) return `${Math.round(hours / 24)} days/yr down`
  if (hours >= 1) return `${+hours.toFixed(1)} h/yr down`
  return `${Math.round(hours * 60)} min/yr down`
}

export const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export function fmtPct(f: number): string {
  const p = f * 100
  if (p === 0) return '0%'
  if (p < 0.1) return '<0.1%'
  return `${+p.toFixed(p < 10 ? 1 : 0)}%`
}
