import { hash } from './random'

export function hashModShard(key: string, shards: number): number {
  return hash(key) % shards
}

/** Consistent hashing ring with virtual nodes. Positions are in [0, 2^32). */
export class ConsistentHashRing {
  private ring: { pos: number; node: string }[] = []

  constructor(nodes: string[] = [], private vnodes = 50) {
    nodes.forEach((n) => this.add(n))
  }

  add(node: string) {
    for (let v = 0; v < this.vnodes; v++) this.ring.push({ pos: hash(`${node}#${v}`), node })
    this.ring.sort((a, b) => a.pos - b.pos)
  }

  remove(node: string) {
    this.ring = this.ring.filter((p) => p.node !== node)
  }

  /** First ring position clockwise from the key's hash. */
  get(key: string): string {
    if (this.ring.length === 0) throw new Error('Ring is empty')
    const h = hash(key)
    let lo = 0
    let hi = this.ring.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.ring[mid].pos < h) lo = mid + 1
      else hi = mid
    }
    return this.ring[lo % this.ring.length].node
  }

  points() {
    return this.ring
  }
}

/** Fraction of keys whose owner changed between two assignments. */
export function movedFraction(keys: string[], before: (k: string) => string | number, after: (k: string) => string | number) {
  const moved = keys.filter((k) => before(k) !== after(k)).length
  return keys.length ? moved / keys.length : 0
}
