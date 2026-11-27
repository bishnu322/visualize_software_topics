import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DeepDiveToggle, ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
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

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-slate-200 lg:block dark:border-slate-800">
          <Sidebar />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
              <div className="flex justify-end p-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </Button>
              </div>
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
