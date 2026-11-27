export interface Place {
  id: string
  name: string
  /** Rough great-circle coordinates in degrees. */
  lat: number
  lon: number
}

export const ORIGIN: Place = { id: 'origin', name: 'Origin (Virginia, US)', lat: 38.9, lon: -77.4 }

export const USERS: Place[] = [
  { id: 'ny', name: 'New York', lat: 40.7, lon: -74 },
  { id: 'london', name: 'London', lat: 51.5, lon: -0.1 },
  { id: 'kathmandu', name: 'Kathmandu', lat: 27.7, lon: 85.3 },
  { id: 'sydney', name: 'Sydney', lat: -33.9, lon: 151.2 },
  { id: 'saopaulo', name: 'São Paulo', lat: -23.5, lon: -46.6 },
]

/** One edge PoP near each user region. */
export const EDGES: Record<string, Place> = {
  ny: { id: 'edge-ny', name: 'Edge NYC', lat: 40.7, lon: -74.2 },
  london: { id: 'edge-lon', name: 'Edge London', lat: 51.5, lon: -0.5 },
  kathmandu: { id: 'edge-del', name: 'Edge Delhi', lat: 28.6, lon: 77.2 },
  sydney: { id: 'edge-syd', name: 'Edge Sydney', lat: -33.9, lon: 151 },
  saopaulo: { id: 'edge-sp', name: 'Edge São Paulo', lat: -23.5, lon: -46.8 },
}

export function distanceKm(a: Place, b: Place): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Round-trip time: light in fiber covers ~200 km per ms one way; real routes are ~1.5× longer
 * than great-circle, plus a few ms of processing.
 */
export function rttMs(a: Place, b: Place): number {
  return Math.round(((distanceKm(a, b) * 1.5) / 200) * 2 + 4)
}

export type CdnResult = { latency: number; via: 'origin' | 'edge-hit' | 'edge-miss' }

/** Latency for one request. Page loads typically need several round trips, so we multiply by `rtts`. */
export function requestLatency(user: Place, cdn: boolean, edgeHasContent: boolean, rtts = 3): CdnResult {
  if (!cdn) return { latency: rttMs(user, ORIGIN) * rtts, via: 'origin' }
  const edge = EDGES[user.id]
  const toEdge = rttMs(user, edge) * rtts
  if (edgeHasContent) return { latency: toEdge, via: 'edge-hit' }
  return { latency: toEdge + rttMs(edge, ORIGIN), via: 'edge-miss' }
}
