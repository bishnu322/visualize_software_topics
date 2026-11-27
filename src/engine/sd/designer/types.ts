export type ComponentKind =
  | 'client'
  | 'dns'
  | 'cdn'
  | 'rateLimiter'
  | 'loadBalancer'
  | 'appServer'
  | 'cache'
  | 'database'
  | 'queue'
  | 'worker'
  | 'objectStorage'

/** The three kinds of traffic the analyser follows through a design. */
export type FlowKind = 'static' | 'read' | 'write'

export interface NodeConfig {
  /** Identical copies running in parallel (servers, LB nodes, brokers…). */
  instances: number
  /** Index into SIZES (small … 2xlarge). */
  size: number
  /** Cache / CDN hit ratio, 0..1. */
  hitRatio: number
  /** Database read replicas per shard. */
  replicas: number
  /** Database shards (horizontal partitions). */
  shards: number
  /** Rate limiter: total requests/second allowed through. */
  limitRps: number
}

export interface DesignNode {
  id: string
  kind: ComponentKind
  pos: [number, number, number]
  config: NodeConfig
}

/** Directed: requests travel from → to. */
export interface DesignEdge {
  from: string
  to: string
}

export interface Design {
  nodes: DesignNode[]
  edges: DesignEdge[]
}

export interface Requirements {
  /** Daily active users. */
  dau: number
  /** Requests each user makes per day. */
  requestsPerUser: number
  /** Peak traffic ÷ average traffic. */
  peakFactor: number
  /** Optional: use this peak RPS instead of deriving it from DAU. */
  rpsOverride: number | null
  /** Reads per write (10 means 10:1). */
  readRatio: number
  /** % of reads that are static content (images, video, JS/CSS). */
  staticPct: number
  /** p99 latency targets in ms. */
  readLatencyMs: number
  writeLatencyMs: number
  /** Uptime target in %, e.g. 99.9. */
  availability: number
  /** Average size of one written record in KB. */
  objectSizeKb: number
  /** How long data is kept. */
  retentionYears: number
  /** Monthly budget in $. */
  budget: number
  /** Writes may be acknowledged before they are stored (lets a queue absorb them). */
  asyncWrites: boolean
}
