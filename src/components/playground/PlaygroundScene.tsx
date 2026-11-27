import { Grid } from '@react-three/drei'
import { Device, Link, Packet, SceneCanvas } from '@/components/shared/three'
import { edgeKey } from '@/engine/topology'
import { useIsDark } from '@/hooks/useTheme'
import { COLORS } from './presets'
import type { PlaygroundState } from './usePlayground'

export function PlaygroundScene({ pg }: { pg: PlaygroundState }) {
  const dark = useIsDark()
  const { topo, pos, mode, ping, pending, pingSrc, pingDst } = pg
  const onPingPath = (a: string, b: string) => !!ping && ping.path.some((p, i) => i > 0 && edgeKey(ping.path[i - 1], p) === edgeKey(a, b))
  const editing = mode.kind === 'connect' || mode.kind === 'delete'

  return (
    <SceneCanvas camera={[0, 12, 12]} className="!h-[420px] sm:!h-[520px]">
      {/* invisible floor that receives "place device" clicks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onClick={(e) => { e.stopPropagation(); pg.place(e.point.x, e.point.z) }}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Grid args={[30, 30]} cellSize={1} sectionSize={5} cellColor={dark ? '#1e293b' : '#e2e8f0'} sectionColor={dark ? '#334155' : '#cbd5e1'} fadeDistance={35} position={[0, -0.005, 0]} />
      {topo.edges.map((e) =>
        pos[e.a] && pos[e.b] ? (
          <Link
            key={edgeKey(e.a, e.b)}
            from={pos[e.a]}
            to={pos[e.b]}
            active={onPingPath(e.a, e.b)}
            onClick={mode.kind === 'delete' ? () => pg.deleteEdge(e.a, e.b) : undefined}
          />
        ) : null,
      )}
      {topo.nodes.map((n) => (
        <Device
          key={n.id}
          type={n.type}
          position={n.pos}
          label={n.id}
          color={COLORS[n.type]}
          active={pending === n.id || (!!ping && (n.id === pingSrc || n.id === pingDst))}
          onClick={editing ? () => pg.clickDevice(n.id) : undefined}
        />
      ))}
      {ping && <Packet key={ping.id} points={ping.path.map((id) => pos[id]).filter(Boolean)} duration={0.6 * ping.path.length} label="ICMP echo" color="#f59e0b" />}
    </SceneCanvas>
  )
}
