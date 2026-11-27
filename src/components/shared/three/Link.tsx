import { Line } from '@react-three/drei'

/** A cable between two points, drawn slightly above the floor. */
export function Link({
  from,
  to,
  color = '#94a3b8',
  active,
  broken,
  width = 2,
  onClick,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
  active?: boolean
  broken?: boolean
  width?: number
  onClick?: () => void
}) {
  const y = 0.12
  return (
    <Line
      points={[
        [from[0], from[1] + y, from[2]],
        [to[0], to[1] + y, to[2]],
      ]}
      color={broken ? '#ef4444' : active ? '#0ea5e9' : color}
      lineWidth={active ? width * 2 : width}
      dashed={broken}
      dashSize={0.2}
      gapSize={0.15}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerOver={onClick ? () => (document.body.style.cursor = 'pointer') : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = '') : undefined}
    />
  )
}
