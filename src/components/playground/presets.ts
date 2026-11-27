import type { Topology } from '@/engine/topology'
import type { DeviceType } from '@/engine/types'

export const STORAGE_KEY = 'netviz-playground'

export const PREFIX: Partial<Record<DeviceType, string>> = { pc: 'PC', laptop: 'Laptop', router: 'R', switch: 'SW', server: 'Srv', cloud: 'Net' }

export const COLORS: Partial<Record<DeviceType, string>> = { pc: '#0ea5e9', laptop: '#22c55e', router: '#06b6d4', switch: '#6366f1', server: '#ec4899', cloud: '#94a3b8' }

export const PRESET: Topology = {
  nodes: [
    { id: 'R1', type: 'router', pos: [0, 0, -4] },
    { id: 'SW1', type: 'switch', pos: [-4, 0, 0] },
    { id: 'SW2', type: 'switch', pos: [4, 0, 0] },
    { id: 'PC1', type: 'pc', pos: [-6, 0, 4] },
    { id: 'PC2', type: 'pc', pos: [-2, 0, 4] },
    { id: 'Laptop1', type: 'laptop', pos: [2, 0, 4] },
    { id: 'Srv1', type: 'server', pos: [6, 0, 4] },
  ],
  edges: [
    { a: 'R1', b: 'SW1' },
    { a: 'R1', b: 'SW2' },
    { a: 'SW1', b: 'PC1' },
    { a: 'SW1', b: 'PC2' },
    { a: 'SW2', b: 'Laptop1' },
    { a: 'SW2', b: 'Srv1' },
  ],
}
