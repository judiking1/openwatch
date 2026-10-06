import { useTimeStore } from '../../stores/timeStore'
import {
  atTimeOfDay,
  clockTimeFromMs,
  formatClock,
  parseClock,
  secondsOfDay,
} from '../../utils/time'
import { useDisplayedTime } from './useDisplayedTime'

const SPEEDS = [1, 10, 60, 600, 3600]

export function TimeControls() {
  const ms = useDisplayedTime()
  const model = useTimeStore((s) => s.model)
  const { goLive, setSpeed, setPaused, setManualTime } = useTimeStore.getState()
  const clock = clockTimeFromMs(ms)
  const live = model.mode === 'live'
  const paused = !live && model.paused

  const setClock = (hours: number, minutes: number, seconds: number) =>
    setManualTime(atTimeOfDay(ms, hours, minutes, seconds))

  return (
    <section className="panel-section">
      <h3>Time</h3>
      <div className="clock-readout" aria-live="off">
        {formatClock(clock)}
        <span className="clock-mode">{live ? 'live' : paused ? 'paused' : `×${model.speed}`}</span>
      </div>
      <div className="button-row">
        <button className={live ? 'active' : ''} onClick={goLive}>
          Live
        </button>
        <button onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button>
      </div>
      <label className="field">
        <span>Scrub the day</span>
        <input
          type="range"
          min={0}
          max={86_399}
          step={60}
          value={secondsOfDay(clock)}
          onChange={(e) => {
            const s = Number(e.target.value)
            setClock(Math.floor(s / 3600), Math.floor(s / 60) % 60, clock.seconds)
          }}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Set time</span>
          <input
            type="time"
            step={1}
            value={formatClock(clock)}
            onChange={(e) => {
              const parsed = parseClock(e.target.value)
              if (parsed) setClock(parsed.hours, parsed.minutes, parsed.seconds)
            }}
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
      </div>
    </section>
  )
}
