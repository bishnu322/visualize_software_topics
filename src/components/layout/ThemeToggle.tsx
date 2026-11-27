import { Moon, Sun } from 'lucide-react'
import { useSettings } from '@/store/settings'
import { Button } from '@/components/shared/ui'

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettings()
  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}
