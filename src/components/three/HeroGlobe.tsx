import { Canvas } from '@react-three/fiber'
import { NetworkGlobe } from './NetworkGlobe'

export default function HeroGlobe({ dark }: { dark: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0, 7.2], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <NetworkGlobe dark={dark} />
    </Canvas>
  )
}
