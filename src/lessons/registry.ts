import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { ArrowLeftRight, Globe, Handshake, Layers, Network, Route, Share2, Binary, type LucideIcon } from 'lucide-react'

export interface LessonMeta {
  slug: string
  title: string
  short: string
  level: 'Beginner' | 'Intermediate'
  minutes: number
  icon: LucideIcon
  color: string
  Component: LazyExoticComponent<ComponentType>
}

export const LESSONS: LessonMeta[] = [
  {
    slug: 'osi-model',
    title: 'The OSI & TCP/IP Models',
    short: 'The 7 layers, encapsulation, and how data is wrapped for the trip.',
    level: 'Beginner',
    minutes: 12,
    icon: Layers,
    color: '#ef4444',
    Component: lazy(() => import('./osi-model/lesson.mdx')),
  },
  {
    slug: 'topologies',
    title: 'Network Topologies',
    short: 'Bus, star, ring, mesh, tree. Break links and see what survives.',
    level: 'Beginner',
    minutes: 8,
    icon: Share2,
    color: '#f97316',
    Component: lazy(() => import('./topologies/lesson.mdx')),
  },
  {
    slug: 'ip-subnetting',
    title: 'IP Addressing & Subnetting',
    short: 'IPv4, masks, CIDR in binary, with a live subnet calculator.',
    level: 'Intermediate',
    minutes: 15,
    icon: Binary,
    color: '#eab308',
    Component: lazy(() => import('./ip-subnetting/lesson.mdx')),
  },
  {
    slug: 'switching-arp',
    title: 'Switching & ARP',
    short: 'How switches learn MAC addresses and how ARP finds them.',
    level: 'Beginner',
    minutes: 10,
    icon: ArrowLeftRight,
    color: '#22c55e',
    Component: lazy(() => import('./switching-arp/lesson.mdx')),
  },
  {
    slug: 'routing',
    title: 'Routing & Shortest Paths',
    short: 'Routing tables, static vs dynamic, and Dijkstra step by step.',
    level: 'Intermediate',
    minutes: 12,
    icon: Route,
    color: '#06b6d4',
    Component: lazy(() => import('./routing/lesson.mdx')),
  },
  {
    slug: 'tcp-handshake',
    title: 'TCP & UDP',
    short: 'The 3-way handshake, sequence numbers, and teardown.',
    level: 'Intermediate',
    minutes: 12,
    icon: Handshake,
    color: '#3b82f6',
    Component: lazy(() => import('./tcp-handshake/lesson.mdx')),
  },
  {
    slug: 'dns',
    title: 'DNS: The Internet’s Phonebook',
    short: 'From a name to an IP: resolver, root, TLD, authoritative.',
    level: 'Beginner',
    minutes: 8,
    icon: Network,
    color: '#a855f7',
    Component: lazy(() => import('./dns/lesson.mdx')),
  },
  {
    slug: 'http-journey',
    title: 'What Happens When You Type a URL',
    short: 'Everything together: ARP, DNS, TCP, TLS, HTTP, end to end in 3D.',
    level: 'Intermediate',
    minutes: 10,
    icon: Globe,
    color: '#ec4899',
    Component: lazy(() => import('./http-journey/lesson.mdx')),
  },
]

export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug)
