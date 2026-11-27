import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-6xl font-bold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">Destination host unreachable</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">No route to this page. The packet was dropped (TTL exceeded).</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand-600 hover:underline">← Return to the default gateway</Link>
    </div>
  )
}
