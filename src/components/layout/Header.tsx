import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/shared/ui'
import { DeepDiveToggle } from './DeepDiveToggle'
import { ThemeToggle } from './ThemeToggle'

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-14 items-center gap-3 px-4">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onOpenMenu} aria-label="Open menu">
          <Menu size={20} />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900 dark:text-white">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span>Net<span className="text-brand-500">Viz</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <DeepDiveToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
