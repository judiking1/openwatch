import { createRef, lazy, Suspense, useMemo, useState, type RefObject } from 'react'
import { ORIGIN_LABEL, type WatchConcept } from '../../types/watch'
import type { RendererMode } from '../viewer/rendererMode'

const LiveLayer = lazy(() => import('./LiveLayer'))

const LIVE_KEY = 'owl-gallery-live'

/** Live by default on desktop; stills on touch devices or with reduced motion. */
function initialLive(): boolean {
  try {
    const saved = localStorage.getItem(LIVE_KEY)
    if (saved !== null) return saved === '1'
  } catch {
    // Storage unavailable (private mode): fall through to the default.
  }
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return !coarse && !reduced
}

type Props = {
  concepts: WatchConcept[]
  /** Renderer for the live layer (`?renderer=`). */
  renderer?: RendererMode
}

const ALL = 'All'

export function Gallery({ concepts, renderer }: Props) {
  const categories = [ALL, ...new Set(concepts.map((c) => c.metadata.category))]
  const [category, setCategory] = useState(ALL)
  const visible = concepts.filter((c) => category === ALL || c.metadata.category === category)
  const [live, setLive] = useState(initialLive)
  const thumbs = useMemo(
    () =>
      Object.fromEntries(
        concepts.map((c) => [c.metadata.id, createRef<HTMLDivElement>()]),
      ) as Record<string, RefObject<HTMLDivElement | null>>,
    [concepts],
  )

  function toggleLive() {
    setLive(!live)
    try {
      localStorage.setItem(LIVE_KEY, live ? '0' : '1')
    } catch {
      // Not persisted; the toggle still works for this visit.
    }
  }

  return (
    <div className="gallery">
      <header className="gallery-hero">
        <p className="eyebrow">Exhibition</p>
        <h1>Watches that may not exist yet.</h1>
        <p>
          A growing laboratory of experimental ways to show time. Every piece runs in real time —
          open one, turn it over, speed time up and change its materials.
        </p>
      </header>

      <div className="gallery-toolbar">
        <div className="filters" role="tablist" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={c === category}
              className={c === category ? 'active' : ''}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          className={`live-toggle ${live ? 'active' : ''}`}
          aria-pressed={live}
          onClick={toggleLive}
          title="Render every watch in real time"
        >
          <span className="live-dot" /> {live ? 'Live' : 'Stills'}
        </button>
      </div>

      <div className="gallery-grid">
        {visible.map(({ metadata: m }) => (
          <a key={m.id} href={`#/watch/${m.id}`} className="gallery-card">
            <div className="thumb" ref={thumbs[m.id]}>
              <img
                src={`${import.meta.env.BASE_URL}thumbnails/${m.id}.png`}
                alt={`${m.name} watch`}
                loading="lazy"
              />
            </div>
            <div className="card-body">
              <div className="watch-number">No. {m.number}</div>
              <h2>{m.name}</h2>
              <p>{m.tagline}</p>
              <div className="badges">
                <span className="badge">{m.category}</span>
                <span className="badge">{ORIGIN_LABEL[m.origin.type]}</span>
                <span className="badge">{m.feasibility}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {live && (
        <Suspense fallback={null}>
          <LiveLayer concepts={visible} targets={thumbs} renderer={renderer} />
        </Suspense>
      )}
    </div>
  )
}
