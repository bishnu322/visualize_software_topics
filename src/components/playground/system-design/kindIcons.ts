import { Archive, Cpu, Database, Earth, Gauge, Inbox, Server, Signpost, Split, Users, Zap, type LucideIcon } from 'lucide-react'
import type { ComponentKind, FlowKind } from '@/engine/sd/designer/types'

export const KIND_ICONS: Record<ComponentKind, LucideIcon> = {
  client: Users,
  dns: Signpost,
  cdn: Earth,
  rateLimiter: Gauge,
  loadBalancer: Split,
  appServer: Server,
  cache: Zap,
  database: Database,
  queue: Inbox,
  worker: Cpu,
  objectStorage: Archive,
}

export const FLOW_STYLE: Record<FlowKind, { color: string; label: string; name: string }> = {
  static: { color: '#a855f7', label: 'GET img', name: 'static read' },
  read: { color: '#0ea5e9', label: 'GET', name: 'read' },
  write: { color: '#f59e0b', label: 'POST', name: 'write' },
}
