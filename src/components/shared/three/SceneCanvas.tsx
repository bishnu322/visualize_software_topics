import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { createContext, Suspense, useRef, type ReactNode, type RefObject } from 'react'
import clsx from 'clsx'

interface Props {
  children: ReactNode
  camera?: [number, number, number]
  fov?: number
  className?: string
  autoRotate?: boolean
  shadows?: boolean
  target?: [number, number, number]
  enableZoom?: boolean
}

/**
 * Stable DOM target for drei <Html> labels. Without it, Html re-targets when the canvas
 * event system connects, unmounting the label root mid-render (labels vanish).
 */
export const LabelPortal = createContext<RefObject<HTMLDivElement | null> | null>(null)

/** Standard 3D stage: camera, lights, orbit controls, soft ground shadow. */
export function SceneCanvas({
  children,
  camera = [0, 7, 12],
  fov = 45,
  className,
  autoRotate = false,
  shadows = true,
  target = [0, 0, 0],
  enableZoom = true,
}: Props) {
  const overlay = useRef<HTMLDivElement>(null)
  return (
    <div className={clsx('relative h-[360px] w-full sm:h-[440px]', className)}>
      <div ref={overlay} className="pointer-events-none absolute inset-0 z-10 overflow-hidden" />
      <LabelPortal.Provider value={overlay}>
      <Canvas camera={{ position: camera, fov }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} />
        <directionalLight position={[-6, 4, -4]} intensity={0.35} />
        <Suspense fallback={null}>
          {children}
          {shadows && <ContactShadows position={[0, -0.6, 0]} opacity={0.35} scale={30} blur={2.5} far={6} />}
        </Suspense>
        <OrbitControls
          makeDefault
          target={target}
          enablePan={false}
          enableZoom={enableZoom}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          minDistance={4}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
      </LabelPortal.Provider>
      <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-400">drag to rotate · scroll to zoom</div>
    </div>
  )
}
