import clsx from 'clsx'
import { Boxes, Network } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/playground', label: 'Network', icon: Network },
  { to: '/playground/system-design', label: 'System Design', icon: Boxes },
]

/** Switch between the two playgrounds. */
export function PlaygroundTabs() {
  return (
    <nav className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Playgrounds">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )
          }
        >
          <Icon size={15} /> {label}
        </NavLink>
      ))}
    </nav>
  )
}
