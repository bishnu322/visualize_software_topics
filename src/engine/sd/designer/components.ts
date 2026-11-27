import type { DeviceType } from '@/engine/types'
import { SIZES } from '../capacity'
import type { ComponentKind, NodeConfig } from './types'

export type ConfigField = 'instances' | 'size' | 'hitRatio' | 'replicas' | 'shards' | 'limitRps'

export interface ComponentSpec {
  kind: ComponentKind
  label: string
  description: string
  /** Which 3D model to draw. */
  device: DeviceType
  color: string
  /** Id prefix for new nodes (App1, App2…). */
  prefix: string
  fields: ConfigField[]
  /** Managed/global services: effectively unlimited capacity, no instance count. */
  managed: boolean
  /** Processing time at low load; grows with utilisation (queueing). */
  baseLatencyMs: number
  /** Availability of a single instance, 0..1. */
  availability: number
  /** Requests/second one instance handles. */
  perInstanceRps: (c: NodeConfig) => number
  /** $/month for one instance. */
  unitCost: (c: NodeConfig) => number
}

/** Network round trip from a user to a nearby CDN edge vs. to the origin data centre. */
export const EDGE_RTT_MS = 10
export const ORIGIN_RTT_MS = 40
/** Storage one database shard can hold. */
export const DB_SHARD_STORAGE_GB = 4000
/** Object storage price per GB-month. */
export const OBJECT_STORAGE_GB_COST = 0.023
/** A write costs a database about twice as much as a read (index updates, fsync, replication). */
export const DB_WRITE_COST = 2

const size = (c: NodeConfig) => SIZES[Math.min(Math.max(c.size, 0), SIZES.length - 1)]

export const COMPONENTS: Record<ComponentKind, ComponentSpec> = {
  client: {
    kind: 'client', label: 'Clients', description: 'Your users (browsers, mobile apps). All traffic starts here.',
    device: 'laptop', color: '#0ea5e9', prefix: 'Users', fields: [], managed: true,
    baseLatencyMs: 0, availability: 1, perInstanceRps: () => Infinity, unitCost: () => 0,
  },
  dns: {
    kind: 'dns', label: 'DNS', description: 'Resolves your domain. Managed and cached, so it adds almost no latency.',
    device: 'router', color: '#94a3b8', prefix: 'DNS', fields: [], managed: true,
    baseLatencyMs: 0, availability: 0.99999, perInstanceRps: () => Infinity, unitCost: () => 5,
  },
  cdn: {
    kind: 'cdn', label: 'CDN', description: 'Edge caches close to users. Serves static content (images, video, JS) without touching your servers.',
    device: 'cloud', color: '#f97316', prefix: 'CDN', fields: ['hitRatio'], managed: true,
    baseLatencyMs: 5, availability: 0.9999, perInstanceRps: () => Infinity, unitCost: () => 200,
  },
  rateLimiter: {
    kind: 'rateLimiter', label: 'Rate limiter', description: 'Rejects traffic above a limit with HTTP 429, protecting everything behind it.',
    device: 'switch', color: '#6366f1', prefix: 'RL', fields: ['instances', 'limitRps'], managed: false,
    baseLatencyMs: 1, availability: 0.999, perInstanceRps: () => 20000, unitCost: () => 20,
  },
  loadBalancer: {
    kind: 'loadBalancer', label: 'Load balancer', description: 'Spreads requests across the components behind it and skips unhealthy ones.',
    device: 'loadbalancer', color: '#22c55e', prefix: 'LB', fields: ['instances'], managed: false,
    baseLatencyMs: 1, availability: 0.999, perInstanceRps: () => 20000, unitCost: () => 25,
  },
  appServer: {
    kind: 'appServer', label: 'App server', description: 'Runs your business logic. Stateless, so add instances to scale out.',
    device: 'server', color: '#ec4899', prefix: 'App', fields: ['instances', 'size'], managed: false,
    baseLatencyMs: 15, availability: 0.995, perInstanceRps: (c) => size(c).capacity * 5, unitCost: (c) => size(c).cost,
  },
  cache: {
    kind: 'cache', label: 'Cache', description: 'In-memory key/value store (Redis, Memcached). Hits skip the database entirely.',
    device: 'cache', color: '#ef4444', prefix: 'Cache', fields: ['instances', 'size', 'hitRatio'], managed: false,
    baseLatencyMs: 1, availability: 0.999, perInstanceRps: (c) => size(c).capacity * 100, unitCost: (c) => Math.round(size(c).cost * 1.5),
  },
  database: {
    kind: 'database', label: 'Database', description: 'Source of truth. Replicas scale reads; shards scale writes and storage.',
    device: 'database', color: '#eab308', prefix: 'DB', fields: ['size', 'replicas', 'shards'], managed: false,
    baseLatencyMs: 8, availability: 0.999, perInstanceRps: (c) => size(c).capacity * 2.5, unitCost: (c) => size(c).cost * 2,
  },
  queue: {
    kind: 'queue', label: 'Message queue', description: 'Buffers work (Kafka, SQS). Writes are acknowledged fast and processed later by workers.',
    device: 'queue', color: '#14b8a6', prefix: 'Q', fields: ['instances'], managed: false,
    baseLatencyMs: 3, availability: 0.999, perInstanceRps: () => 50000, unitCost: () => 80,
  },
  worker: {
    kind: 'worker', label: 'Worker', description: 'Consumes messages from a queue and does the slow work (writing to the DB, encoding video…).',
    device: 'server', color: '#a855f7', prefix: 'Worker', fields: ['instances', 'size'], managed: false,
    baseLatencyMs: 10, availability: 0.995, perInstanceRps: (c) => size(c).capacity * 5, unitCost: (c) => size(c).cost,
  },
  objectStorage: {
    kind: 'objectStorage', label: 'Object storage', description: 'Blob store (S3). Practically unlimited space for files, images and video; pay per GB.',
    device: 'database', color: '#64748b', prefix: 'Blob', fields: [], managed: true,
    baseLatencyMs: 30, availability: 0.9999, perInstanceRps: () => Infinity, unitCost: () => 10,
  },
}

export const PALETTE: ComponentKind[] = [
  'client', 'dns', 'cdn', 'rateLimiter', 'loadBalancer', 'appServer', 'cache', 'database', 'queue', 'worker', 'objectStorage',
]

export const DEFAULT_CONFIG: NodeConfig = { instances: 1, size: 1, hitRatio: 0.8, replicas: 0, shards: 1, limitRps: 5000 }

export function newConfig(kind: ComponentKind): NodeConfig {
  return { ...DEFAULT_CONFIG, hitRatio: kind === 'cdn' ? 0.9 : DEFAULT_CONFIG.hitRatio }
}

export const isDataStore = (k: ComponentKind) => k === 'database' || k === 'objectStorage'
