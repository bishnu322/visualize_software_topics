import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  ArrowLeftRight, Binary, Boxes, Database, Earth, Gauge, Globe, Handshake, Inbox, Layers, Network,
  Route, Share2, Split, Triangle, TrendingUp, Workflow, Zap, type LucideIcon,
} from 'lucide-react'

export type CourseId = 'networks' | 'system-design'

export interface Course {
  id: CourseId
  title: string
  short: string
  icon: LucideIcon
  color: string
}

export interface LessonMeta {
  course: CourseId
  slug: string
  title: string
  short: string
  level: 'Beginner' | 'Intermediate'
  minutes: number
  icon: LucideIcon
  color: string
  Component: LazyExoticComponent<ComponentType>
}

export const COURSES: Course[] = [
  { id: 'networks', title: 'Computer Networks', short: 'How data actually moves: layers, addresses, switching, routing and protocols.', icon: Workflow, color: '#0ea5e9' },
  { id: 'system-design', title: 'System Design', short: 'How large systems stay fast and reliable: scaling, caching, queues and distributed data.', icon: Boxes, color: '#a855f7' },
]

type Def = Omit<LessonMeta, 'course' | 'Component'>

// Each entry's lesson text lives at src/content/<course>/<slug>/lesson.mdx
const NETWORKS: Def[] = [
  { slug: 'osi-model', title: 'The OSI & TCP/IP Models', short: 'The 7 layers, encapsulation, and how data is wrapped for the trip.', level: 'Beginner', minutes: 12, icon: Layers, color: '#ef4444' },
  { slug: 'topologies', title: 'Network Topologies', short: 'Bus, star, ring, mesh, tree. Break links and see what survives.', level: 'Beginner', minutes: 8, icon: Share2, color: '#f97316' },
  { slug: 'ip-subnetting', title: 'IP Addressing & Subnetting', short: 'IPv4, masks, CIDR in binary, with a live subnet calculator.', level: 'Intermediate', minutes: 15, icon: Binary, color: '#eab308' },
  { slug: 'switching-arp', title: 'Switching & ARP', short: 'How switches learn MAC addresses and how ARP finds them.', level: 'Beginner', minutes: 10, icon: ArrowLeftRight, color: '#22c55e' },
  { slug: 'routing', title: 'Routing & Shortest Paths', short: 'Routing tables, static vs dynamic, and Dijkstra step by step.', level: 'Intermediate', minutes: 12, icon: Route, color: '#06b6d4' },
  { slug: 'tcp-handshake', title: 'TCP & UDP', short: 'The 3-way handshake, sequence numbers, and teardown.', level: 'Intermediate', minutes: 12, icon: Handshake, color: '#3b82f6' },
  { slug: 'dns', title: 'DNS: The Internet’s Phonebook', short: 'From a name to an IP: resolver, root, TLD, authoritative.', level: 'Beginner', minutes: 8, icon: Network, color: '#a855f7' },
  { slug: 'http-journey', title: 'What Happens When You Type a URL', short: 'Everything together: ARP, DNS, TCP, TLS, HTTP, end to end in 3D.', level: 'Intermediate', minutes: 10, icon: Globe, color: '#ec4899' },
]

const SYSTEM_DESIGN: Def[] = [
  { slug: 'scaling', title: 'Scaling: Vertical vs Horizontal', short: 'What happens when traffic grows, and the two ways to handle it.', level: 'Beginner', minutes: 8, icon: TrendingUp, color: '#0ea5e9' },
  { slug: 'load-balancing', title: 'Load Balancing', short: 'Round robin, least connections, IP hash, and health checks.', level: 'Beginner', minutes: 10, icon: Split, color: '#22c55e' },
  { slug: 'caching', title: 'Caching', short: 'Hit ratio, eviction (LRU/LFU), and cache write strategies.', level: 'Intermediate', minutes: 12, icon: Zap, color: '#ef4444' },
  { slug: 'cdn', title: 'Content Delivery Networks', short: 'Serve content from the edge, close to every user.', level: 'Beginner', minutes: 8, icon: Earth, color: '#f97316' },
  { slug: 'database-scaling', title: 'Replication & Sharding', short: 'Copies for reads and failover; splitting data with consistent hashing.', level: 'Intermediate', minutes: 15, icon: Database, color: '#eab308' },
  { slug: 'message-queues', title: 'Message Queues', short: 'Decouple services, absorb spikes, fan out events.', level: 'Intermediate', minutes: 10, icon: Inbox, color: '#14b8a6' },
  { slug: 'rate-limiting', title: 'Rate Limiting', short: 'Token bucket, fixed and sliding windows, and HTTP 429.', level: 'Intermediate', minutes: 10, icon: Gauge, color: '#6366f1' },
  { slug: 'cap-consistency', title: 'CAP Theorem & Consistency', short: 'Partitions force a choice: consistency or availability.', level: 'Intermediate', minutes: 12, icon: Triangle, color: '#ec4899' },
]

// Vite needs statically analysable import paths, so collect every lesson.mdx with a glob.
const modules = import.meta.glob<{ default: ComponentType }>('./*/*/lesson.mdx')

const build = (course: CourseId, defs: Def[]): LessonMeta[] =>
  defs.map((d) => {
    const load = modules[`./${course}/${d.slug}/lesson.mdx`]
    if (!load) throw new Error(`Missing lesson file: src/content/${course}/${d.slug}/lesson.mdx`)
    return { ...d, course, Component: lazy(load) }
  })

export const LESSONS: LessonMeta[] = [...build('networks', NETWORKS), ...build('system-design', SYSTEM_DESIGN)]

export const lessonsByCourse = (id: CourseId) => LESSONS.filter((l) => l.course === id)
export const findLesson = (course: string, slug: string) => LESSONS.find((l) => l.course === course && l.slug === slug)
export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug)
export const courseById = (id: string) => COURSES.find((c) => c.id === id)
export const lessonPath = (l: Pick<LessonMeta, 'course' | 'slug'>) => `/learn/${l.course}/${l.slug}`
