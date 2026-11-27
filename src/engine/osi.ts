import type { Step } from './types'

export interface OsiLayer {
  n: number
  name: string
  pdu: string
  color: string
  role: string
  examples: string[]
  devices: string
  tcpip: 'Application' | 'Transport' | 'Internet' | 'Link'
  header?: string
}

export const OSI_LAYERS: OsiLayer[] = [
  { n: 7, name: 'Application', pdu: 'Data', color: '#ef4444', role: 'Network services the user\'s apps talk to.', examples: ['HTTP', 'DNS', 'SMTP', 'FTP', 'SSH'], devices: 'Hosts', tcpip: 'Application' },
  { n: 6, name: 'Presentation', pdu: 'Data', color: '#f97316', role: 'Formatting, encryption and compression of data.', examples: ['TLS', 'JPEG', 'UTF-8', 'JSON'], devices: 'Hosts', tcpip: 'Application' },
  { n: 5, name: 'Session', pdu: 'Data', color: '#eab308', role: 'Opens, manages and closes conversations.', examples: ['NetBIOS', 'RPC', 'Sockets'], devices: 'Hosts', tcpip: 'Application' },
  { n: 4, name: 'Transport', pdu: 'Segment', color: '#22c55e', role: 'End-to-end delivery between processes (ports), reliability, flow control.', examples: ['TCP', 'UDP', 'QUIC'], devices: 'Hosts, firewalls', tcpip: 'Transport', header: 'TCP' },
  { n: 3, name: 'Network', pdu: 'Packet', color: '#06b6d4', role: 'Logical addressing (IP) and routing between networks.', examples: ['IPv4', 'IPv6', 'ICMP', 'OSPF'], devices: 'Routers, L3 switches', tcpip: 'Internet', header: 'IP' },
  { n: 2, name: 'Data Link', pdu: 'Frame', color: '#3b82f6', role: 'Delivery to the next device on the same link using MAC addresses.', examples: ['Ethernet', 'Wi-Fi (802.11)', 'ARP', 'VLAN'], devices: 'Switches, bridges, NICs', tcpip: 'Link', header: 'Eth' },
  { n: 1, name: 'Physical', pdu: 'Bits', color: '#a855f7', role: 'Raw bits as electrical, light or radio signals.', examples: ['Copper (UTP)', 'Fiber', 'Radio', 'Hubs'], devices: 'Cables, hubs, repeaters', tcpip: 'Link' },
]

export interface EncapData {
  /** Layer currently being processed. */
  layer: number
  /** Headers wrapped around the data so far, outermost first. */
  headers: string[]
  trailer: boolean
  side: 'sender' | 'wire' | 'receiver'
}

/** Encapsulation down the sender stack and decapsulation up the receiver stack. */
export function encapsulationSteps(): Step<EncapData>[] {
  const steps: Step<EncapData>[] = []
  steps.push({ title: 'Application creates data', caption: 'Your browser creates an HTTP request: "GET /index.html". Layers 7–5 prepare it (encryption by TLS, sessions).', data: { layer: 7, headers: [], trailer: false, side: 'sender' } })
  steps.push({ title: 'Transport adds a TCP header', caption: 'Layer 4 wraps the data with a TCP header: source and destination ports, sequence numbers. Now it is a segment.', detail: 'TCP header is 20–60 bytes: src port, dst port, seq, ack, flags, window, checksum, options.', data: { layer: 4, headers: ['TCP'], trailer: false, side: 'sender' } })
  steps.push({ title: 'Network adds an IP header', caption: 'Layer 3 adds an IP header with source and destination IP addresses. Now it is a packet.', detail: 'IPv4 header is 20+ bytes: version, IHL, DSCP, total length, ID, flags, fragment offset, TTL, protocol (6=TCP), checksum, src/dst IP.', data: { layer: 3, headers: ['IP', 'TCP'], trailer: false, side: 'sender' } })
  steps.push({ title: 'Data Link adds a frame header + trailer', caption: 'Layer 2 adds MAC addresses (header) and an error-check FCS (trailer). Now it is a frame.', detail: 'Ethernet II: dst MAC (6B), src MAC (6B), EtherType (2B, 0x0800 = IPv4), payload 46–1500B, FCS (4B CRC-32).', data: { layer: 2, headers: ['Eth', 'IP', 'TCP'], trailer: true, side: 'sender' } })
  steps.push({ title: 'Physical sends bits', caption: 'Layer 1 turns the frame into signals: voltages on copper, light pulses in fiber, or radio waves.', detail: 'A preamble (7B) + SFD (1B) is sent before the frame so the receiver can sync its clock.', data: { layer: 1, headers: ['Eth', 'IP', 'TCP'], trailer: true, side: 'wire' } })
  steps.push({ title: 'Receiver: Data Link checks the frame', caption: 'The receiver checks the destination MAC and FCS, then strips the Ethernet header and trailer.', data: { layer: 2, headers: ['IP', 'TCP'], trailer: false, side: 'receiver' } })
  steps.push({ title: 'Receiver: Network checks the IP', caption: 'The IP header shows the packet is for this host. It is removed and passed to TCP (protocol 6).', data: { layer: 3, headers: ['TCP'], trailer: false, side: 'receiver' } })
  steps.push({ title: 'Receiver: Transport delivers to the port', caption: 'TCP checks sequence numbers, sends an ACK, and delivers the data to the process on port 80/443.', data: { layer: 4, headers: [], trailer: false, side: 'receiver' } })
  steps.push({ title: 'Application reads the data', caption: 'The web server receives "GET /index.html". Each layer only talked to its peer layer on the other side.', data: { layer: 7, headers: [], trailer: false, side: 'receiver' } })
  return steps
}
