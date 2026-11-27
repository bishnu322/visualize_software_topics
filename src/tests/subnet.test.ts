import { describe, expect, it } from 'vitest'
import { ipToInt, intToIp, maskToPrefix, parseCidr, splitSubnet, subnetInfo } from '@/engine/subnet'

describe('subnet', () => {
  it('round-trips IPs', () => {
    expect(intToIp(ipToInt('192.168.1.200'))).toBe('192.168.1.200')
    expect(ipToInt('255.255.255.255')).toBe(4294967295)
  })

  it('computes a /26', () => {
    const s = subnetInfo('192.168.1.10', 26)
    expect(s.network).toBe('192.168.1.0')
    expect(s.broadcast).toBe('192.168.1.63')
    expect(s.firstHost).toBe('192.168.1.1')
    expect(s.lastHost).toBe('192.168.1.62')
    expect(s.usableHosts).toBe(62)
    expect(s.mask).toBe('255.255.255.192')
    expect(s.wildcard).toBe('0.0.0.63')
    expect(s.ipClass).toBe('C')
    expect(s.isPrivate).toBe(true)
  })

  it('handles edge prefixes', () => {
    expect(subnetInfo('10.0.0.5', 32).usableHosts).toBe(1)
    expect(subnetInfo('10.0.0.4', 31).usableHosts).toBe(2)
    expect(subnetInfo('8.8.8.8', 0).network).toBe('0.0.0.0')
    expect(subnetInfo('8.8.8.8', 8).isPrivate).toBe(false)
    expect(subnetInfo('172.20.1.1', 16).isPrivate).toBe(true)
  })

  it('parses masks and CIDR', () => {
    expect(maskToPrefix('255.255.240.0')).toBe(20)
    expect(() => maskToPrefix('255.0.255.0')).toThrow()
    expect(parseCidr('10.1.2.3/12')).toEqual({ ip: '10.1.2.3', prefix: 12 })
    expect(() => parseCidr('300.1.1.1/24')).toThrow()
  })

  it('splits subnets', () => {
    const subs = splitSubnet('192.168.0.0/24', 2)
    expect(subs.map((s) => `${s.network}/${s.prefix}`)).toEqual([
      '192.168.0.0/26', '192.168.0.64/26', '192.168.0.128/26', '192.168.0.192/26',
    ])
  })
})
