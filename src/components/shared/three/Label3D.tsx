import { Html } from '@react-three/drei'
import clsx from 'clsx'
import { useContext, type ReactNode, type RefObject } from 'react'
import { LabelPortal } from './SceneCanvas'

export function Label3D({
  position,
  children,
  tone = 'default',
  className,
}: {
  position: [number, number, number]
  children: ReactNode
  tone?: 'default' | 'active' | 'muted'
  className?: string
}) {
  const portal = useContext(LabelPortal)
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }} portal={(portal ?? undefined) as RefObject<HTMLElement> | undefined}>
      <div
        className={clsx(
          'whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold shadow-sm ring-1 backdrop-blur select-none',
          tone === 'default' && 'bg-white/85 text-slate-700 ring-slate-200 dark:bg-slate-900/85 dark:text-slate-200 dark:ring-slate-700',
          tone === 'active' && 'bg-brand-500 text-white ring-brand-600',
          tone === 'muted' && 'bg-white/60 text-slate-400 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-500 dark:ring-slate-800',
          className,
        )}
      >
        {children}
      </div>
    </Html>
  )
}
