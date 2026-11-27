import type { Step } from '../types'

export type WritePolicy = 'cache-aside' | 'write-through' | 'write-back'

/** Lanes: 0 = App, 1 = Cache, 2 = Database */
export interface FlowMsg {
  from: number
  to: number
  label: string
  sub?: string
}

const FLOWS: Record<WritePolicy, { msg: FlowMsg; title: string; caption: string; detail?: string }[]> = {
  'cache-aside': [
    { msg: { from: 0, to: 1, label: 'GET user:42' }, title: 'Check cache', caption: 'The app asks the cache first.' },
    { msg: { from: 1, to: 0, label: 'miss', sub: '~1 ms' }, title: 'Miss', caption: 'Not there yet.' },
    { msg: { from: 0, to: 2, label: 'SELECT … id=42' }, title: 'Read the database', caption: 'The app reads from the database (slow).' },
    { msg: { from: 2, to: 0, label: 'row', sub: '~50 ms' }, title: 'Got it', caption: 'The database returns the row.' },
    { msg: { from: 0, to: 1, label: 'SET user:42 (TTL 300s)' }, title: 'Populate cache', caption: 'The app stores it in the cache with an expiry, so the next read is fast.', detail: 'Lazy loading: only data that is actually requested gets cached. Most common pattern (Memcached/Redis + any DB).' },
    { msg: { from: 0, to: 2, label: 'UPDATE … id=42' }, title: 'Later: a write', caption: 'When the data changes, the app writes to the database…' },
    { msg: { from: 0, to: 1, label: 'DEL user:42' }, title: 'Invalidate', caption: '…and deletes the cached copy so nobody reads stale data. The next read reloads it.', detail: 'Delete rather than update: avoids races where two writers set the cache in the wrong order.' },
  ],
  'write-through': [
    { msg: { from: 0, to: 1, label: 'SET user:42' }, title: 'Write to cache', caption: 'The app writes to the cache.' },
    { msg: { from: 1, to: 2, label: 'UPDATE … id=42' }, title: 'Cache writes DB', caption: 'The cache synchronously writes the same data to the database.' },
    { msg: { from: 2, to: 1, label: 'ok' }, title: 'DB confirms', caption: 'The database confirms.' },
    { msg: { from: 1, to: 0, label: 'ok', sub: 'write latency = cache + DB' }, title: 'Done', caption: 'Only now is the write acknowledged. Cache and DB are always in sync.', detail: 'Pro: reads are never stale. Con: every write pays DB latency, and rarely-read data fills the cache.' },
    { msg: { from: 0, to: 1, label: 'GET user:42' }, title: 'Read', caption: 'Reads come straight from the cache.' },
    { msg: { from: 1, to: 0, label: 'hit', sub: '~1 ms' }, title: 'Hit', caption: 'Fast and fresh.' },
  ],
  'write-back': [
    { msg: { from: 0, to: 1, label: 'SET user:42' }, title: 'Write to cache only', caption: 'The app writes to the cache.' },
    { msg: { from: 1, to: 0, label: 'ok', sub: '~1 ms' }, title: 'Acknowledged immediately', caption: 'The write is confirmed right away, before the database has it. Very fast writes.' },
    { msg: { from: 0, to: 1, label: 'SET user:42 (again)' }, title: 'More writes', caption: 'Several updates to the same key are absorbed by the cache.' },
    { msg: { from: 1, to: 1, label: 'batch timer' }, title: 'Wait…', caption: 'The cache marks the entry "dirty" and waits, collecting more writes.' },
    { msg: { from: 1, to: 2, label: 'flush batch' }, title: 'Flush to database', caption: 'Later, the cache writes the latest value (and others) to the DB in one batch.', detail: 'Pro: fast writes, fewer DB writes. Con: if the cache crashes before flushing, those writes are LOST. Used in CPU caches, disk controllers, some analytics counters.' },
  ],
}

export function cacheFlow(policy: WritePolicy) {
  const flow = FLOWS[policy]
  const steps: Step<{ upTo: number }>[] = flow.map((f, i) => ({ title: f.title, caption: f.caption, detail: f.detail, data: { upTo: i } }))
  return { messages: flow.map((f) => f.msg), steps }
}
