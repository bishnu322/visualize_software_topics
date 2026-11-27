export interface SubnetInfo {
  ip: string
  prefix: number
  mask: string
  wildcard: string
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  totalAddresses: number
  usableHosts: number
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E'
  isPrivate: boolean
  ipBinary: string
  maskBinary: string
}

export function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.')
  return (
    parts.length === 4 &&
    parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)
  )
}

export function ipToInt(ip: string): number {
  if (!isValidIp(ip)) throw new Error(`Invalid IPv4 address: ${ip}`)
  return ip
    .trim()
    .split('.')
    .reduce((acc, o) => ((acc << 8) | Number(o)) >>> 0, 0)
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.')
}

export function prefixToMask(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error(`Invalid prefix: ${prefix}`)
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
}

export function maskToPrefix(mask: string): number {
  const n = ipToInt(mask)
  const prefix = n.toString(2).replace(/0+$/, '').length
  if (prefixToMask(prefix) !== n) throw new Error(`Non-contiguous mask: ${mask}`)
  return prefix
}

/** "11000000.10101000.00000001.00000001" */
export function toBinary(n: number): string {
  return [24, 16, 8, 0]
    .map((s) => ((n >>> s) & 255).toString(2).padStart(8, '0'))
    .join('.')
}

export function parseCidr(cidr: string): { ip: string; prefix: number } {
  const [ip, p = '32'] = cidr.trim().split('/')
  const prefix = Number(p)
  if (!isValidIp(ip) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR: ${cidr}`)
  }
  return { ip, prefix }
}

function classOf(firstOctet: number): SubnetInfo['ipClass'] {
  if (firstOctet < 128) return 'A'
  if (firstOctet < 192) return 'B'
  if (firstOctet < 224) return 'C'
  if (firstOctet < 240) return 'D'
  return 'E'
}

function isPrivateInt(n: number): boolean {
  const inRange = (base: string, prefix: number) =>
    ((n & prefixToMask(prefix)) >>> 0) === ipToInt(base)
  return inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16)
}

export function subnetInfo(ip: string, prefix: number): SubnetInfo {
  const ipInt = ipToInt(ip)
  const mask = prefixToMask(prefix)
  const network = (ipInt & mask) >>> 0
  const broadcast = (network | ~mask) >>> 0
  const total = 2 ** (32 - prefix)

  // /31 (RFC 3021 point-to-point) and /32 (host route) have no network/broadcast reservation.
  let first = network + 1
  let last = broadcast - 1
  let usable = total - 2
  if (prefix === 32) {
    first = last = network
    usable = 1
  } else if (prefix === 31) {
    first = network
    last = broadcast
    usable = 2
  }

  return {
    ip,
    prefix,
    mask: intToIp(mask),
    wildcard: intToIp(~mask >>> 0),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(first),
    lastHost: intToIp(last),
    totalAddresses: total,
    usableHosts: usable,
    ipClass: classOf(ipInt >>> 24),
    isPrivate: isPrivateInt(ipInt),
    ipBinary: toBinary(ipInt),
    maskBinary: toBinary(mask),
  }
}

/** Split a network into 2^bits equal subnets (VLSM-style borrowing). */
export function splitSubnet(cidr: string, borrowBits: number): SubnetInfo[] {
  const { ip, prefix } = parseCidr(cidr)
  const newPrefix = prefix + borrowBits
  if (newPrefix > 32) throw new Error('Cannot borrow that many bits')
  const base = ipToInt(subnetInfo(ip, prefix).network)
  const size = 2 ** (32 - newPrefix)
  const count = Math.min(2 ** borrowBits, 256)
  return Array.from({ length: count }, (_, i) => subnetInfo(intToIp(base + i * size), newPrefix))
}
