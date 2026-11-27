import type { Step } from './types'

export interface Host {
  id: string
  ip: string
  mac: string
  port: number
}

export interface ArpStepData {
  /** Ports the frame is travelling on (host ids). */
  activeHosts: string[]
  direction: 'to-switch' | 'from-switch' | 'none'
  frame: { srcMac: string; dstMac: string; type: string; info: string } | null
  macTable: { mac: string; port: number }[]
  arpCaches: Record<string, { ip: string; mac: string }[]>
}

export const DEFAULT_HOSTS: Host[] = [
  { id: 'A', ip: '192.168.1.10', mac: 'AA:AA:AA:00:00:0A', port: 1 },
  { id: 'B', ip: '192.168.1.20', mac: 'BB:BB:BB:00:00:0B', port: 2 },
  { id: 'C', ip: '192.168.1.30', mac: 'CC:CC:CC:00:00:0C', port: 3 },
  { id: 'D', ip: '192.168.1.40', mac: 'DD:DD:DD:00:00:0D', port: 4 },
]

const BROADCAST = 'FF:FF:FF:FF:FF:FF'

/** Host `src` wants to send an IP packet to `dst` on the same LAN through a learning switch. */
export function arpSteps(hosts: Host[] = DEFAULT_HOSTS, srcId = 'A', dstId = 'C'): Step<ArpStepData>[] {
  const src = hosts.find((h) => h.id === srcId)!
  const dst = hosts.find((h) => h.id === dstId)!
  const others = hosts.filter((h) => h.id !== src.id).map((h) => h.id)
  const macTable: ArpStepData['macTable'] = []
  const arpCaches: ArpStepData['arpCaches'] = Object.fromEntries(hosts.map((h) => [h.id, []]))
  const steps: Step<ArpStepData>[] = []
  const snap = (
    activeHosts: string[],
    direction: ArpStepData['direction'],
    frame: ArpStepData['frame'],
  ): ArpStepData => ({
    activeHosts,
    direction,
    frame,
    macTable: macTable.map((e) => ({ ...e })),
    arpCaches: Object.fromEntries(Object.entries(arpCaches).map(([k, v]) => [k, v.map((e) => ({ ...e }))])),
  })

  steps.push({
    title: 'The problem',
    caption: `${src.id} (${src.ip}) wants to send to ${dst.ip}. It knows the IP but a switch forwards by MAC address. ${src.id}'s ARP cache is empty.`,
    detail: 'Since the destination is in the same subnet (checked with the subnet mask), the host ARPs for the destination itself. For a remote destination it would ARP for its default gateway instead.',
    data: snap([], 'none', null),
  })

  const request = { srcMac: src.mac, dstMac: BROADCAST, type: 'ARP Request', info: `Who has ${dst.ip}? Tell ${src.ip}` }
  steps.push({
    title: 'ARP request (broadcast)',
    caption: `${src.id} broadcasts: "Who has ${dst.ip}? Tell ${src.ip}." Destination MAC is FF:FF:FF:FF:FF:FF.`,
    detail: 'EtherType 0x0806, opcode 1. Target MAC field is 00:00:00:00:00:00 because it is unknown.',
    data: snap([src.id], 'to-switch', request),
  })

  macTable.push({ mac: src.mac, port: src.port })
  steps.push({
    title: 'Switch learns + floods',
    caption: `Switch learns "${src.mac} is on port ${src.port}". Broadcasts are flooded out every other port.`,
    detail: 'The switch learns from the SOURCE MAC of every frame it receives. Entries age out after 300 s by default (Cisco).',
    data: snap(others, 'from-switch', request),
  })

  arpCaches[dst.id].push({ ip: src.ip, mac: src.mac })
  const reply = { srcMac: dst.mac, dstMac: src.mac, type: 'ARP Reply', info: `${dst.ip} is at ${dst.mac}` }
  steps.push({
    title: 'Only the owner replies',
    caption: `Other hosts ignore it. ${dst.id} recognises its IP, caches ${src.id}'s MAC, and replies directly (unicast).`,
    detail: 'Opcode 2. The target learns the sender mapping from the request, saving a future ARP.',
    data: snap([dst.id], 'to-switch', reply),
  })

  macTable.push({ mac: dst.mac, port: dst.port })
  steps.push({
    title: 'Switch forwards reply',
    caption: `Switch learns ${dst.mac} is on port ${dst.port}. It already knows where ${src.mac} is, so it forwards only to port ${src.port}.`,
    data: snap([src.id], 'from-switch', reply),
  })

  arpCaches[src.id].push({ ip: dst.ip, mac: dst.mac })
  const data = { srcMac: src.mac, dstMac: dst.mac, type: 'IPv4', info: `${src.ip} → ${dst.ip}` }
  steps.push({
    title: 'Send the real data',
    caption: `${src.id} caches ${dst.ip} → ${dst.mac} and sends the actual IP packet inside an Ethernet frame.`,
    data: snap([src.id], 'to-switch', data),
  })

  steps.push({
    title: 'Unicast forwarding',
    caption: `Switch looks up ${dst.mac} in its MAC table → port ${dst.port}. Only ${dst.id} receives the frame. No flooding needed.`,
    detail: 'Known unicast = forward. Unknown unicast = flood. Broadcast = flood. This is why switches reduce collisions compared with hubs.',
    data: snap([dst.id], 'from-switch', data),
  })
  return steps
}
