import { useState } from 'react'
import { TimeControls } from '../time/TimeControls'
import { useDisplayedTime } from '../time/useDisplayedTime'
import {
  defaultOrbitalHandsLayout,
  type OrbitalHandsLayout,
} from '../../watches/orbital-hands/config'
import { OrbitalHandsDial2D } from '../../watches/orbital-hands/OrbitalHandsDial2D'

const SLIDERS: Array<{ key: keyof OrbitalHandsLayout; label: string; min: number; max: number }> = [
  { key: 'numeralRadius', label: 'Numeral radius', min: 15, max: 60 },
  { key: 'hourOrbitRadius', label: 'Hour orbit', min: 40, max: 98 },
  { key: 'minuteOrbitRadius', label: 'Minute orbit', min: 40, max: 98 },
  { key: 'secondOrbitRadius', label: 'Second orbit', min: 40, max: 98 },
  { key: 'indicatorLength', label: 'Indicator length', min: 4, max: 30 },
  { key: 'indicatorWidth', label: 'Indicator width', min: 1, max: 12 },
]

/** Phase 1 logic prototype: validates the orbital time-display math in 2D. */
export function OrbitalHandsPrototype() {
  const timeMs = useDisplayedTime()
  const [layout, setLayout] = useState(defaultOrbitalHandsLayout)
  const [showTracks, setShowTracks] = useState(true)

  return (
    <div className="split-layout">
      <div className="stage stage-2d">
        <OrbitalHandsDial2D timeMs={timeMs} layout={layout} showTracks={showTracks} />
      </div>
      <aside className="panel">
        <TimeControls />
        <section className="panel-section">
          <h3>Layout</h3>
          {SLIDERS.map(({ key, label, min, max }) => (
            <label key={key} className="field">
              <span>
                {label} <em>{layout[key]}</em>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={layout[key]}
                onChange={(e) => setLayout({ ...layout, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={showTracks}
              onChange={(e) => setShowTracks(e.target.checked)}
            />
            <span>Show orbit tracks</span>
          </label>
          <button onClick={() => setLayout(defaultOrbitalHandsLayout)}>Reset layout</button>
        </section>
      </aside>
    </div>
  )
}
