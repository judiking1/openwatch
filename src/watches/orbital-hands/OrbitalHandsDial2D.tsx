import { clockTimeFromMs, dialPoint, handAngles } from '../../utils/time'
import type { IndicatorKind, OrbitalHandsLayout } from './config'
import { indicatorOutline, indicatorSize, orbitRadius } from './geometry'

const KINDS: IndicatorKind[] = ['hour', 'minute', 'second']
const COLORS: Record<IndicatorKind, string> = {
  hour: '#e8e4da',
  minute: '#c9a96e',
  second: '#e0533d',
}

type Props = {
  timeMs: number
  layout: OrbitalHandsLayout
  showTracks?: boolean
}

/** 2D (SVG) logic prototype of the Orbital Hands concept. */
export function OrbitalHandsDial2D({ timeMs, layout, showTracks = true }: Props) {
  const angles = handAngles(clockTimeFromMs(timeMs))

  return (
    <svg viewBox="-110 -110 220 220" className="dial-2d" role="img" aria-label="Orbital Hands dial">
      <circle r={104} fill="#1b1d24" stroke="#3a3d4a" strokeWidth={3} />
      <circle r={98} fill="#101116" />

      {showTracks &&
        KINDS.map((kind) => (
          <circle
            key={kind}
            r={orbitRadius(layout, kind)}
            fill="none"
            stroke="#2a2d38"
            strokeWidth={0.6}
            strokeDasharray="1.5 2.5"
          />
        ))}

      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0
        const r0 = layout.numeralRadius + 9
        const a = dialPoint(r0, i * 6)
        const b = dialPoint(r0 + (major ? 4 : 2), i * 6)
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={major ? '#8b8a86' : '#4a4c55'}
            strokeWidth={major ? 0.9 : 0.5}
          />
        )
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const n = i === 0 ? 12 : i
        const p = dialPoint(layout.numeralRadius, i * 30)
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            fill="#e8e4da"
            fontSize={9}
            fontWeight={500}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {n}
          </text>
        )
      })}

      {KINDS.map((kind) => {
        const { length, width } = indicatorSize(layout, kind)
        const points = indicatorOutline(orbitRadius(layout, kind), length, width)
        return (
          <g key={kind} transform={`rotate(${angles[kind]})`}>
            <polygon points={points.map((p) => p.join(',')).join(' ')} fill={COLORS[kind]} />
          </g>
        )
      })}

      <circle r={2} fill="#3a3d4a" />
    </svg>
  )
}
