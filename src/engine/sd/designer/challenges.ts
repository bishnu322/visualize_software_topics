import { newConfig } from './components'
import type { ComponentKind, Design, DesignNode, NodeConfig, Requirements } from './types'

/** Compact builders for hand-written designs. */
export function node(id: string, kind: ComponentKind, x: number, z: number, cfg: Partial<NodeConfig> = {}): DesignNode {
  return { id, kind, pos: [x, 0, z], config: { ...newConfig(kind), ...cfg } }
}
/** edges('A>B', 'B>C') */
export function edges(...specs: string[]) {
  return specs.map((s) => {
    const [from, to] = s.split('>')
    return { from, to }
  })
}

export const DEFAULT_REQUIREMENTS: Requirements = {
  dau: 1_000_000,
  requestsPerUser: 20,
  peakFactor: 3,
  rpsOverride: null,
  readRatio: 10,
  staticPct: 20,
  readLatencyMs: 200,
  writeLatencyMs: 500,
  availability: 99.9,
  objectSizeKb: 2,
  retentionYears: 2,
  budget: 3000,
  asyncWrites: false,
}

export interface Challenge {
  id: string
  title: string
  brief: string
  requirements: Requirements
  /** One design that passes every check. Others exist; this is just a reference. */
  solution: Design
}

const starter: Design = { nodes: [node('Users1', 'client', -9, 0)], edges: [] }
export const starterDesign = (): Design => structuredClone(starter)

export const CHALLENGES: Challenge[] = [
  {
    id: 'url-shortener',
    title: 'URL shortener',
    brief: 'Turn long links into short ones and redirect fast. Reads (redirects) outnumber writes 100 to 1, and every redirect must feel instant.',
    requirements: {
      ...DEFAULT_REQUIREMENTS,
      dau: 10_000_000, requestsPerUser: 10, peakFactor: 3, readRatio: 100, staticPct: 0,
      readLatencyMs: 100, writeLatencyMs: 300, availability: 99.99, objectSizeKb: 0.5, retentionYears: 5, budget: 2500,
    },
    solution: {
      nodes: [
        node('Users1', 'client', -9, 0),
        node('LB1', 'loadBalancer', -5, 0, { instances: 2 }),
        node('App1', 'appServer', -1, 0, { instances: 3 }),
        node('Cache1', 'cache', 3, -3, { instances: 2, hitRatio: 0.9 }),
        node('DB1', 'database', 3, 3, { replicas: 1 }),
      ],
      edges: edges('Users1>LB1', 'LB1>App1', 'App1>Cache1', 'App1>DB1'),
    },
  },
  {
    id: 'chat',
    title: 'Chat app',
    brief: 'Users send and read messages all day: half of all traffic is writes. Sending must feel instant, and a year of history has to be kept.',
    requirements: {
      ...DEFAULT_REQUIREMENTS,
      dau: 1_000_000, requestsPerUser: 100, peakFactor: 3, readRatio: 1, staticPct: 0,
      readLatencyMs: 200, writeLatencyMs: 100, availability: 99.9, objectSizeKb: 1, retentionYears: 1, budget: 4000, asyncWrites: true,
    },
    solution: {
      nodes: [
        node('Users1', 'client', -10, 0),
        node('LB1', 'loadBalancer', -6, 0, { instances: 2 }),
        node('App1', 'appServer', -2, 0, { instances: 3 }),
        node('Cache1', 'cache', 2, -4, { instances: 2, hitRatio: 0.7 }),
        node('Q1', 'queue', 2, 4, { instances: 2 }),
        node('Worker1', 'worker', 6, 4, { instances: 2 }),
        node('DB1', 'database', 7, -1, { replicas: 1, shards: 5 }),
      ],
      edges: edges('Users1>LB1', 'LB1>App1', 'App1>Cache1', 'App1>DB1', 'App1>Q1', 'Q1>Worker1', 'Worker1>DB1'),
    },
  },
  {
    id: 'news-feed',
    title: 'News feed',
    brief: 'A social feed: people scroll far more than they post, and a third of reads are images. The feed must load quickly and stay up.',
    requirements: {
      ...DEFAULT_REQUIREMENTS,
      dau: 2_000_000, requestsPerUser: 50, peakFactor: 3, readRatio: 50, staticPct: 30,
      readLatencyMs: 150, writeLatencyMs: 400, availability: 99.95, objectSizeKb: 1, retentionYears: 2, budget: 3000,
    },
    solution: {
      nodes: [
        node('Users1', 'client', -10, 0),
        node('CDN1', 'cdn', -5, -5, { hitRatio: 0.9 }),
        node('Blob1', 'objectStorage', 0, -6),
        node('LB1', 'loadBalancer', -5, 2, { instances: 2 }),
        node('App1', 'appServer', -1, 2, { instances: 3 }),
        node('Cache1', 'cache', 4, -1, { instances: 2, hitRatio: 0.85 }),
        node('DB1', 'database', 4, 5, { replicas: 2 }),
      ],
      edges: edges('Users1>CDN1', 'CDN1>Blob1', 'Users1>LB1', 'LB1>App1', 'App1>Cache1', 'App1>DB1'),
    },
  },
  {
    id: 'video',
    title: 'Video streaming',
    brief: 'Almost every request is a chunk of video. Uploads are rare but huge (20 MB each), so storage dwarfs everything else.',
    requirements: {
      ...DEFAULT_REQUIREMENTS,
      dau: 5_000_000, requestsPerUser: 30, peakFactor: 4, readRatio: 5000, staticPct: 90,
      readLatencyMs: 80, writeLatencyMs: 2000, availability: 99.9, objectSizeKb: 20_000, retentionYears: 1, budget: 9000,
    },
    solution: {
      nodes: [
        node('Users1', 'client', -10, 0),
        node('CDN1', 'cdn', -5, -5, { hitRatio: 0.95 }),
        node('LB1', 'loadBalancer', -5, 2, { instances: 2 }),
        node('App1', 'appServer', -1, 2, { instances: 2 }),
        node('Cache1', 'cache', 3, 0, { instances: 2, hitRatio: 0.9 }),
        node('DB1', 'database', 3, 5, { replicas: 1 }),
        node('Blob1', 'objectStorage', 3, -5),
      ],
      edges: edges('Users1>CDN1', 'CDN1>Blob1', 'Users1>LB1', 'LB1>App1', 'App1>Cache1', 'App1>DB1', 'App1>Blob1'),
    },
  },
]

/** The "Load example" design: a bit of everything, for the default requirements. */
export const EXAMPLE_DESIGN: Design = {
  nodes: [
    node('Users1', 'client', -10, 0),
    node('DNS1', 'dns', -7, -4),
    node('CDN1', 'cdn', -4, -6),
    node('Blob1', 'objectStorage', 1, -7),
    node('RL1', 'rateLimiter', -7, 2, { instances: 2, limitRps: 5000 }),
    node('LB1', 'loadBalancer', -4, 2, { instances: 2 }),
    node('App1', 'appServer', 0, 2, { instances: 2 }),
    node('Cache1', 'cache', 4, -2, { instances: 2 }),
    node('DB1', 'database', 8, 1, { replicas: 1 }),
    node('Q1', 'queue', 3, 6, { instances: 2 }),
    node('Worker1', 'worker', 7, 6, { instances: 2 }),
  ],
  edges: edges('Users1>DNS1', 'DNS1>CDN1', 'CDN1>Blob1', 'DNS1>RL1', 'RL1>LB1', 'LB1>App1', 'App1>Cache1', 'App1>DB1', 'App1>Q1', 'Q1>Worker1', 'Worker1>DB1'),
}
