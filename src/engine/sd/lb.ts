import { hash } from './random'

export type LbAlgorithm = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'

export interface LbServer {
  id: string
  weight: number
  healthy: boolean
  /** Requests currently being processed. */
  active: number
  /** Requests handled in total. */
  total: number
}

/** Load balancer state machine. `pick` chooses a server; the caller tracks request completion. */
export class LoadBalancer {
  private rr = 0
  private current: number[] = [] // smooth weighted round-robin state

  constructor(public servers: LbServer[]) {}

  healthyIndexes() {
    return this.servers.map((s, i) => (s.healthy ? i : -1)).filter((i) => i >= 0)
  }

  /** Returns the chosen server index, or -1 if none are healthy. */
  pick(algo: LbAlgorithm, clientIp = '0.0.0.0'): number {
    const healthy = this.healthyIndexes()
    if (healthy.length === 0) return -1
    let idx: number
    switch (algo) {
      case 'round-robin':
        idx = healthy[this.rr++ % healthy.length]
        break
      case 'least-connections':
        idx = healthy.reduce((best, i) => (this.servers[i].active < this.servers[best].active ? i : best))
        break
      case 'weighted': {
        // nginx's smooth weighted round robin: spreads picks evenly instead of bursting.
        const total = healthy.reduce((t, i) => t + this.servers[i].weight, 0)
        healthy.forEach((i) => (this.current[i] = (this.current[i] ?? 0) + this.servers[i].weight))
        idx = healthy.reduce((best, i) => ((this.current[i] ?? 0) > (this.current[best] ?? 0) ? i : best))
        this.current[idx] -= total
        break
      }
      case 'ip-hash':
        idx = healthy[hash(clientIp) % healthy.length]
        break
    }
    this.servers[idx].active++
    this.servers[idx].total++
    return idx
  }

  finish(idx: number) {
    if (this.servers[idx]) this.servers[idx].active = Math.max(0, this.servers[idx].active - 1)
  }
}
