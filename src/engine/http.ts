import type { Device, Step } from './types'

export interface JourneyStepData {
  /** Devices the packet hops through for this step (in order). Empty = local processing. */
  path: string[]
  packet: string
  color: string
  /** OSI layers mainly involved. */
  layers: number[]
  phase: 'dns' | 'arp' | 'tcp' | 'tls' | 'http' | 'render'
}

export const JOURNEY_DEVICES: Device[] = [
  { id: 'laptop', type: 'laptop', label: 'Your laptop', position: [-7, 0, 0] },
  { id: 'home', type: 'router', label: 'Home router (NAT)', position: [-3.5, 0, 1.5] },
  { id: 'isp', type: 'router', label: 'ISP router', position: [0, 0, -1] },
  { id: 'dns', type: 'server', label: 'DNS resolver', position: [0, 0, 3.5] },
  { id: 'core', type: 'router', label: 'Internet backbone', position: [3.5, 0, 1] },
  { id: 'web', type: 'server', label: 'example.com server', position: [7, 0, 0] },
]

export const JOURNEY_LINKS = [
  { from: 'laptop', to: 'home' },
  { from: 'home', to: 'isp' },
  { from: 'isp', to: 'dns' },
  { from: 'isp', to: 'core' },
  { from: 'core', to: 'web' },
]

const C = { dns: '#eab308', arp: '#3b82f6', tcp: '#22c55e', tls: '#a855f7', http: '#ef4444', render: '#06b6d4' }

export function journeySteps(url = 'https://example.com'): Step<JourneyStepData>[] {
  const host = url.replace(/^\w+:\/\//, '').split('/')[0]
  return [
    { title: 'You press Enter', caption: `The browser parses "${url}": scheme https (port 443), host ${host}, path /. It checks its HSTS list and caches.`,
      data: { path: [], packet: 'URL', color: C.render, layers: [7], phase: 'render' } },
    { title: 'ARP for the gateway', caption: 'To reach anything outside the LAN, the laptop needs the MAC of its default gateway (home router). It broadcasts an ARP request.',
      detail: 'The laptop compares the destination IP with its own subnet mask. Off-subnet → send to the gateway configured by DHCP.',
      data: { path: ['laptop', 'home'], packet: 'ARP', color: C.arp, layers: [2], phase: 'arp' } },
    { title: 'DNS query', caption: `The laptop asks the DNS resolver for the IP of ${host} (UDP port 53).`,
      detail: 'The home router performs NAT: it rewrites the private source IP (192.168.x.x) to its public IP and records the mapping.',
      data: { path: ['laptop', 'home', 'isp', 'dns'], packet: 'DNS?', color: C.dns, layers: [7, 4, 3] , phase: 'dns' } },
    { title: 'DNS answer', caption: `The resolver replies: ${host} = 93.184.215.14 (after root → TLD → authoritative lookups if not cached).`,
      data: { path: ['dns', 'isp', 'home', 'laptop'], packet: 'A rec', color: C.dns, layers: [7, 4, 3], phase: 'dns' } },
    { title: 'TCP SYN', caption: 'The browser opens a TCP connection to port 443. Each router on the way looks up the destination IP in its routing table and forwards.',
      detail: 'Every hop: Layer 2 header is rewritten (new src/dst MAC), TTL is decremented by 1, IP addresses stay the same (except at NAT).',
      data: { path: ['laptop', 'home', 'isp', 'core', 'web'], packet: 'SYN', color: C.tcp, layers: [4, 3, 2], phase: 'tcp' } },
    { title: 'TCP SYN-ACK', caption: 'The server agrees to connect.',
      data: { path: ['web', 'core', 'isp', 'home', 'laptop'], packet: 'SYN-ACK', color: C.tcp, layers: [4, 3, 2], phase: 'tcp' } },
    { title: 'TCP ACK', caption: 'The 3-way handshake is complete, so a reliable byte stream now exists.',
      data: { path: ['laptop', 'home', 'isp', 'core', 'web'], packet: 'ACK', color: C.tcp, layers: [4], phase: 'tcp' } },
    { title: 'TLS ClientHello', caption: 'Browser starts encryption: supported ciphers, a random value, and its key share.',
      detail: 'TLS 1.3 needs only 1 RTT. SNI (server name) tells the server which certificate to present.',
      data: { path: ['laptop', 'home', 'isp', 'core', 'web'], packet: 'Hello', color: C.tls, layers: [6], phase: 'tls' } },
    { title: 'TLS ServerHello + certificate', caption: "The server sends its key share and certificate. The browser checks the certificate chain against trusted CAs. Both sides derive the same session keys.",
      data: { path: ['web', 'core', 'isp', 'home', 'laptop'], packet: 'Cert', color: C.tls, layers: [6], phase: 'tls' } },
    { title: 'HTTP GET', caption: 'Now encrypted: "GET / HTTP/1.1, Host: example.com".',
      data: { path: ['laptop', 'home', 'isp', 'core', 'web'], packet: 'GET /', color: C.http, layers: [7], phase: 'http' } },
    { title: 'HTTP 200 OK', caption: 'The server responds with headers and the HTML document, split into many TCP segments.',
      detail: 'TCP slow start: the sender begins with a small congestion window (~10 segments) and grows it as ACKs arrive.',
      data: { path: ['web', 'core', 'isp', 'home', 'laptop'], packet: '200 OK', color: C.http, layers: [7, 4], phase: 'http' } },
    { title: 'Render', caption: 'The browser parses HTML, finds CSS/JS/images, and fetches them (reusing the connection). Then it paints the page.',
      data: { path: [], packet: 'HTML', color: C.render, layers: [7], phase: 'render' } },
  ]
}
