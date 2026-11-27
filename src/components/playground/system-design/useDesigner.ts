import { useEffect, useMemo, useState } from 'react'
import { analyze } from '@/engine/sd/designer/analyze'
import { CHALLENGES, DEFAULT_REQUIREMENTS, EXAMPLE_DESIGN, starterDesign } from '@/engine/sd/designer/challenges'
import { COMPONENTS, newConfig } from '@/engine/sd/designer/components'
import type { ComponentKind, Design, NodeConfig, Requirements } from '@/engine/sd/designer/types'

export type DesignerMode = { kind: 'select' } | { kind: 'place'; type: ComponentKind } | { kind: 'connect' } | { kind: 'delete' }

const STORAGE_KEY = 'netviz-sd-playground'

interface Saved {
  design: Design
  req: Requirements
  challengeId: string | null
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      if (Array.isArray(s.design?.nodes) && Array.isArray(s.design?.edges) && s.design.nodes.every((n) => n.kind in COMPONENTS)) {
        return { design: s.design, req: { ...DEFAULT_REQUIREMENTS, ...s.req }, challengeId: s.challengeId ?? null }
      }
    }
  } catch {
    /* storage unavailable, fall back to the example */
  }
  return { design: structuredClone(EXAMPLE_DESIGN), req: DEFAULT_REQUIREMENTS, challengeId: null }
}

/** All System Design Playground state: the architecture, requirements, edit mode and live analysis. */
export function useDesigner() {
  const [initial] = useState(load)
  const [design, setDesign] = useState<Design>(initial.design)
  const [req, setReqRaw] = useState<Requirements>(initial.req)
  const [challengeId, setChallengeId] = useState<string | null>(initial.challengeId)
  const [mode, setModeRaw] = useState<DesignerMode>({ kind: 'select' })
  const [pending, setPending] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ design, req, challengeId } satisfies Saved))
    } catch {
      /* ignore */
    }
  }, [design, req, challengeId])

  const report = useMemo(() => analyze(design, req), [design, req])
  const pos = useMemo(() => Object.fromEntries(design.nodes.map((n) => [n.id, n.pos])), [design])
  const challenge = CHALLENGES.find((c) => c.id === challengeId) ?? null
  const selectedNode = design.nodes.find((n) => n.id === selected) ?? null

  const addLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 8))

  const nextId = (kind: ComponentKind) => {
    const prefix = COMPONENTS[kind].prefix
    let i = 1
    while (design.nodes.some((n) => n.id === `${prefix}${i}`)) i++
    return `${prefix}${i}`
  }

  const setMode = (m: DesignerMode) => {
    setModeRaw(m)
    setPending(null)
  }

  const place = (x: number, z: number) => {
    if (mode.kind !== 'place') {
      setSelected(null)
      return
    }
    const p: [number, number, number] = [Math.round(x), 0, Math.round(z)]
    if (design.nodes.some((n) => Math.hypot(n.pos[0] - p[0], n.pos[2] - p[2]) < 2)) return
    const id = nextId(mode.type)
    setDesign((d) => ({ ...d, nodes: [...d.nodes, { id, kind: mode.type, pos: p, config: newConfig(mode.type) }] }))
    setSelected(id)
    addLog(`Added ${id} (${COMPONENTS[mode.type].label})`)
  }

  const removeNode = (id: string) => {
    setDesign((d) => ({ nodes: d.nodes.filter((n) => n.id !== id), edges: d.edges.filter((e) => e.from !== id && e.to !== id) }))
    if (selected === id) setSelected(null)
    addLog(`Removed ${id}`)
  }

  const clickNode = (id: string) => {
    if (mode.kind === 'delete') removeNode(id)
    else if (mode.kind === 'connect') {
      if (!pending) setPending(id)
      else if (pending === id) setPending(null)
      else {
        const exists = design.edges.some((e) => (e.from === pending && e.to === id) || (e.from === id && e.to === pending))
        if (!exists) {
          setDesign((d) => ({ ...d, edges: [...d.edges, { from: pending, to: id }] }))
          addLog(`Connected ${pending} → ${id}`)
        }
        setPending(null)
      }
    } else setSelected(id)
  }

  const deleteEdge = (from: string, to: string) => {
    setDesign((d) => ({ ...d, edges: d.edges.filter((e) => !(e.from === from && e.to === to)) }))
    addLog(`Disconnected ${from} → ${to}`)
  }

  const reverseEdge = (from: string, to: string) =>
    setDesign((d) => ({ ...d, edges: d.edges.map((e) => (e.from === from && e.to === to ? { from: to, to: from } : e)) }))

  const updateConfig = (id: string, patch: Partial<NodeConfig>) =>
    setDesign((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, config: { ...n.config, ...patch } } : n)) }))

  const setReq = (patch: Partial<Requirements>) => setReqRaw((r) => ({ ...r, ...patch }))

  const reset = (d: Design, msg: string) => {
    setDesign(d)
    setSelected(null)
    setPending(null)
    addLog(msg)
  }

  const pickChallenge = (id: string | null) => {
    setChallengeId(id)
    const c = CHALLENGES.find((x) => x.id === id)
    if (c) {
      setReqRaw(c.requirements)
      reset(starterDesign(), `Challenge: ${c.title}. Build a design that passes every check.`)
    } else {
      setReqRaw(DEFAULT_REQUIREMENTS)
      addLog('Free design: set your own requirements.')
    }
  }

  return {
    design, req, report, pos, mode, pending, selected, selectedNode, challenge, log,
    setMode, setSelected, place, clickNode, removeNode, deleteEdge, reverseEdge, updateConfig, setReq, pickChallenge,
    showSolution: () => challenge && reset(structuredClone(challenge.solution), `Loaded a reference solution for ${challenge.title}.`),
    loadExample: () => reset(structuredClone(EXAMPLE_DESIGN), 'Loaded the example architecture.'),
    clear: () => reset(starterDesign(), 'Cleared. Clients stay: traffic starts there.'),
  }
}

export type DesignerState = ReturnType<typeof useDesigner>
