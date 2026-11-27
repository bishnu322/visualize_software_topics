import { X } from 'lucide-react'
import { Button } from '@/components/shared/ui'
import { Sidebar } from './Sidebar'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </Button>
        </div>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  )
}
