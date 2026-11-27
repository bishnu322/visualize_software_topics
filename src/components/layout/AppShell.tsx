import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileDrawer } from './MobileDrawer'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh">
      <Header onOpenMenu={() => setOpen(true)} />
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-slate-200 lg:block dark:border-slate-800">
          <Sidebar />
        </aside>
        <MobileDrawer open={open} onClose={() => setOpen(false)} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
