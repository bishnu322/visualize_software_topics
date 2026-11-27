/** A single frame of an explainable animation. Every visualization plays a Step[]. */
export interface Step<T = unknown> {
  title: string
  caption: string
  /** Extra CCNA-level detail shown when Deep Dive is enabled. */
  detail?: string
  data: T
}

export type DeviceType = 'pc' | 'laptop' | 'router' | 'switch' | 'server' | 'cloud' | 'database' | 'loadbalancer' | 'queue' | 'cache'

export interface Device {
  id: string
  type: DeviceType
  label: string
  position: [number, number, number]
}

export interface Link {
  from: string
  to: string
}
