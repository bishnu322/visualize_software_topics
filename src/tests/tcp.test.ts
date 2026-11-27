import { describe, expect, it } from 'vitest'
import { tcpSteps } from '@/engine/tcp'
import { arpSteps } from '@/engine/arp'
import { dnsSteps } from '@/engine/dns'

describe('tcp', () => {
  const steps = tcpSteps({ clientIsn: 100, serverIsn: 300, requestBytes: 50, responseBytes: 20 })
  const segs = steps.map((s) => s.data.segment).filter((s) => s !== null)

  it('does the 3-way handshake in order', () => {
    expect(segs.slice(0, 3).map((s) => s.flags.join('-'))).toEqual(['SYN', 'SYN-ACK', 'ACK'])
    expect(segs[1].ack).toBe(101)
    expect(segs[2].ack).toBe(301)
    expect(steps[3].data.client).toBe('ESTABLISHED')
  })

  it('acknowledges data bytes', () => {
    expect(segs[4].ack).toBe(151) // 101 + 50
    expect(segs[5].ack).toBe(321) // 301 + 20
  })

  it('ends closed on both sides', () => {
    const last = steps[steps.length - 1].data
    expect([last.client, last.server]).toEqual(['CLOSED', 'CLOSED'])
  })
})

describe('arp + dns', () => {
  it('switch learns both MACs and ends with unicast to the target', () => {
    const steps = arpSteps()
    const last = steps[steps.length - 1].data
    expect(last.macTable).toHaveLength(2)
    expect(last.activeHosts).toEqual(['C'])
    expect(last.arpCaches.A[0].mac).toBe('CC:CC:CC:00:00:0C')
  })

  it('dns goes root → tld → authoritative', () => {
    const queried = dnsSteps().filter((s) => s.data.kind === 'query').map((s) => s.data.to)
    expect(queried).toEqual(['resolver', 'root', 'tld', 'authoritative'])
  })
})
