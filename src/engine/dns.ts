import type { Step } from './types'

export type DnsActor = 'browser' | 'resolver' | 'root' | 'tld' | 'authoritative'

export interface DnsStepData {
  from: DnsActor
  to: DnsActor
  kind: 'query' | 'response' | 'local'
  message: string
}

export const DNS_ACTORS: { id: DnsActor; label: string; sub: string }[] = [
  { id: 'browser', label: 'Your device', sub: 'browser + OS cache' },
  { id: 'resolver', label: 'Recursive resolver', sub: 'ISP / 1.1.1.1 / 8.8.8.8' },
  { id: 'root', label: 'Root server', sub: '13 named clusters (a–m)' },
  { id: 'tld', label: 'TLD server', sub: '.com / .org / .np …' },
  { id: 'authoritative', label: 'Authoritative NS', sub: "the domain's own DNS" },
]

export function dnsSteps(domain = 'www.example.com', ip = '93.184.215.14'): Step<DnsStepData>[] {
  const labels = domain.split('.').filter(Boolean)
  const tld = labels[labels.length - 1] ?? 'com'
  const zone = labels.slice(-2).join('.')
  return [
    {
      title: 'Check local caches',
      caption: `The browser and OS look for ${domain} in their caches (and the hosts file). Not found.`,
      detail: 'Cached records live for their TTL. On a cache hit the whole lookup ends here in ~0 ms.',
      data: { from: 'browser', to: 'browser', kind: 'local', message: 'cache miss' },
    },
    {
      title: 'Ask the resolver',
      caption: `Device asks its recursive resolver: "What is the A record for ${domain}?"`,
      detail: 'Stub → resolver queries are recursive (RD=1): "give me the final answer". Sent over UDP port 53 (or DoH/DoT on 443/853).',
      data: { from: 'browser', to: 'resolver', kind: 'query', message: `A ${domain}?` },
    },
    {
      title: 'Ask a root server',
      caption: `Resolver (cache miss) asks a root server. Root doesn't know, but knows who handles ".${tld}".`,
      detail: 'Resolver → server queries are iterative: each server returns a referral (NS records + glue A records) instead of the answer.',
      data: { from: 'resolver', to: 'root', kind: 'query', message: `A ${domain}?` },
    },
    {
      title: 'Referral to TLD',
      caption: `Root: "Ask the .${tld} servers."`,
      data: { from: 'root', to: 'resolver', kind: 'response', message: `NS .${tld}` },
    },
    {
      title: 'Ask the TLD server',
      caption: `Resolver asks the .${tld} server, which knows which name servers are authoritative for ${zone}.`,
      data: { from: 'resolver', to: 'tld', kind: 'query', message: `A ${domain}?` },
    },
    {
      title: 'Referral to authoritative',
      caption: `TLD: "${zone} is handled by ns1.${zone}."`,
      data: { from: 'tld', to: 'resolver', kind: 'response', message: `NS ns1.${zone}` },
    },
    {
      title: 'Ask the authoritative server',
      caption: `Resolver asks ns1.${zone}, which actually owns the records.`,
      data: { from: 'resolver', to: 'authoritative', kind: 'query', message: `A ${domain}?` },
    },
    {
      title: 'The answer',
      caption: `Authoritative server: "${domain} is ${ip}."`,
      detail: 'Response has the AA (authoritative answer) flag and a TTL, e.g. 3600s. The resolver caches it.',
      data: { from: 'authoritative', to: 'resolver', kind: 'response', message: `A ${ip}` },
    },
    {
      title: 'Answer returned',
      caption: `Resolver caches the answer and returns ${ip} to your device. The browser can now open a TCP connection.`,
      data: { from: 'resolver', to: 'browser', kind: 'response', message: `A ${ip}` },
    },
  ]
}
