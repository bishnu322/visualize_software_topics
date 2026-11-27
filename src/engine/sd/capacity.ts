/** Toy capacity model for the scaling lesson. */

export interface ServerSize {
  name: string
  vcpu: number
  /** Requests/second one server of this size can handle. */
  capacity: number
  /** Monthly cost in $. Bigger machines cost disproportionately more. */
  cost: number
}

export const SIZES: ServerSize[] = [
  { name: 'small', vcpu: 2, capacity: 200, cost: 30 },
  { name: 'medium', vcpu: 4, capacity: 400, cost: 70 },
  { name: 'large', vcpu: 8, capacity: 750, cost: 160 },
  { name: 'xlarge', vcpu: 16, capacity: 1300, cost: 380 },
  { name: '2xlarge', vcpu: 32, capacity: 2200, cost: 900 },
]

export interface Metrics {
  capacity: number
  utilisation: number
  latencyMs: number
  errorRate: number
  cost: number
}

const BASE_LATENCY = 40

/** M/M/1 queueing: response time grows by 1 / (1 − ρ). Capped at ρ = 0.95 so it stays finite. */
export function queueingFactor(utilisation: number): number {
  return 1 / (1 - Math.min(Math.max(utilisation, 0), 0.95))
}

/**
 * Latency rises sharply as utilisation approaches 100% (queueing theory, M/M/1: W = S / (1 − ρ)).
 * Above capacity, the excess requests fail.
 */
export function metrics(rps: number, capacity: number, cost: number): Metrics {
  const utilisation = capacity > 0 ? rps / capacity : Infinity
  const latencyMs = Math.round(BASE_LATENCY * queueingFactor(utilisation))
  const errorRate = utilisation > 1 ? (rps - capacity) / rps : 0
  return { capacity, utilisation, latencyMs, errorRate, cost }
}

export function verticalMetrics(rps: number, sizeIndex: number): Metrics {
  const s = SIZES[sizeIndex]
  return metrics(rps, s.capacity, s.cost)
}

/** N medium servers behind a load balancer (LB adds a small fixed cost). */
export function horizontalMetrics(rps: number, servers: number): Metrics {
  const m = SIZES[1]
  return metrics(rps, m.capacity * servers, m.cost * servers + 20)
}
