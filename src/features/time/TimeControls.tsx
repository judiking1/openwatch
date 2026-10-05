import { useTimeStore } from '../../stores/timeStore'
import { clockTimeFromMs, formatClock } from '../../utils/time'
import { useDisplayedTime } from './useDisplayedTime'

const SPEEDS = [1, 10, 60, 600, 3600]

function withTimeOfDay(baseMs: number, value: string): number {
  const [h = 0, m = 0, s = 0] = value.split(':').map(Number)
  const d = new Date(baseMs)
  d.setHours(h, m, s, 0)
  return d.getTime()
}

export function TimeControls() {
  const ms = useDisplayedTime()
  const model = useTimeStore((s) => s.model)
  const { goLive, setSpeed, setPaused, setManualTime } = useTimeStore.getState()
  const clock = formatClock(clockTimeFromMs(ms))
  const live = model.mode === 'live'

  return (
    <section className="panel-section">
      <h3>Time</h3>
      <div className="clock-readout">{clock}</div>
      <div className="button-row">
        <button className={live ? 'active' : ''} onClick={goLive}>
          Live
        </button>
        <button onClick={() => setPaused(!model.paused || live)}>
          {model.paused && !live ? 'Play' : 'Pause'}
        </button>
      </div>
      <label className="field">
        <span>Set time</span>
        <input
          type="time"
          step={1}
          value={clock}
          onChange={(e) => e.target.value && setManualTime(withTimeOfDay(ms, e.target.value))}
        />
      </label>
      <label className="field">
        <span>Speed</span>
        <select value={live ? 1 : model.speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              ×{s}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
