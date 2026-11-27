import { useEffect, useMemo, useState } from 'react'
import { edgeKey, findPath, type Topology } from '@/engine/topology'
import type { DeviceType } from '@/engine/types'
import { PREFIX, PRESET, STORAGE_KEY } from './presets'

export type Mode = { kind: 'select' } | { kind: 'place'; type: DeviceType } | { kind: 'connect' } | { kind: 'delete' }

function load(): Topology {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const t = JSON.parse(raw) as Topology
      if (Array.isArray(t.nodes) && Array.isArray(t.edges)) return t
    }
  } catch {
    /* storage unavailable, fall back to preset */
  }
  return PRESET
}

/** All Playground state and actions: the topology, edit mode, ping and console log. */
export function usePlayground() {
  const [topo, setTopo] = useState<Topology>(load)
  const [mode, setModeRaw] = useState<Mode>({ kind: 'select' })
  const [pending, setPending] = useState<string | null>(null)
  const [src, setSrc] = useState('')
  const [dst, setDst] = useState('')
  const [ping, setPing] = useState<{ id: number; path: string[] } | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topo))
    } catch {
      /* ignore */
    }
  }, [topo])

  const pos = useMemo(() => Object.fromEntries(topo.nodes.map((n) => [n.id, n.pos])), [topo])
  const endpoints = topo.nodes.filter((n) => n.type !== 'switch' && n.type !== 'router')
  const pingSrc = src && pos[src] ? src : endpoints[0]?.id ?? ''
  const pingDst = dst && pos[dst] && dst !== pingSrc ? dst : endpoints.find((n) => n.id !== pingSrc)?.id ?? ''

  const addLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 6))

  const nextId = (type: DeviceType) => {
    let i = 1
    while (topo.nodes.some((n) => n.id === `${PREFIX[type]}${i}`)) i++
    return `${PREFIX[type]}${i}`
  }

  const setMode = (m: Mode) => {
    setModeRaw(m)
    setPending(null)
  }

  const place = (x: number, z: number) => {
    if (mode.kind !== 'place') return
    const p: [number, number, number] = [Math.round(x), 0, Math.round(z)]
    if (topo.nodes.some((n) => Math.hypot(n.pos[0] - p[0], n.pos[2] - p[2]) < 1.5)) return
    const id = nextId(mode.type)
    setTopo((t) => ({ ...t, nodes: [...t.nodes, { id, type: mode.type, pos: p }] }))
    addLog(`Added ${id}`)
  }

  const clickDevice = (id: string) => {
    if (mode.kind === 'delete') {
      setTopo((t) => ({ nodes: t.nodes.filter((n) => n.id !== id), edges: t.edges.filter((e) => e.a !== id && e.b !== id) }))
      addLog(`Removed ${id}`)
    } else if (mode.kind === 'connect') {
      if (!pending) setPending(id)
      else if (pending === id) setPending(null)
      else {
        const k = edgeKey(pending, id)
        if (!topo.edges.some((e) => edgeKey(e.a, e.b) === k)) {
          setTopo((t) => ({ ...t, edges: [...t.edges, { a: pending, b: id }] }))
          addLog(`Connected ${pending} ↔ ${id}`)
        }
        setPending(null)
      }
    }
  }

  const deleteEdge = (a: string, b: string) =>
    setTopo((t) => ({ ...t, edges: t.edges.filter((x) => edgeKey(x.a, x.b) !== edgeKey(a, b)) }))

  const sendPing = () => {
    if (!pingSrc || !pingDst) return
    const path = findPath(topo, pingSrc, pingDst)
    if (path.length < 2) {
      setPing(null)
      addLog(`✗ ${pingSrc} → ${pingDst}: Destination host unreachable`)
    } else {
      setPing({ id: Date.now(), path })
      addLog(`✓ ${pingSrc} → ${pingDst}: reply via ${path.join(' → ')} (${path.length - 1} hops)`)
    }
  }

  const reset = (t: Topology) => {
    setTopo(t)
    setPing(null)
  }

  return {
    topo, pos, mode, pending, endpoints, pingSrc, pingDst, ping, log,
    setMode, setSrc, setDst, place, clickDevice, deleteEdge, sendPing,
    loadExample: () => reset(PRESET),
    clear: () => reset({ nodes: [], edges: [] }),
  }
}

export type PlaygroundState = ReturnType<typeof usePlayground>
