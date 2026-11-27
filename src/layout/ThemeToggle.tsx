import { Moon, Sun } from 'lucide-react'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/ui'

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettings()
  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}

export function DeepDiveToggle() {
  const { deepDive, setDeepDive } = useSettings()
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium select-none" title="Show CCNA-level details everywhere">
      <span className="hidden sm:inline">Deep dive</span>
      <span className="sm:hidden">CCNA</span>
      <button
        role="switch"
        aria-checked={deepDive}
        onClick={() => setDeepDive(!deepDive)}
        className={`relative h-6 w-11 rounded-full transition-colors ${deepDive ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${deepDive ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}
