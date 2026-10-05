import { useState } from 'react'
import { ORIGIN_LABEL, type WatchConcept } from '../../types/watch'

type Props = {
  concepts: WatchConcept[]
}

const ALL = 'All'

export function Gallery({ concepts }: Props) {
  const categories = [ALL, ...new Set(concepts.map((c) => c.metadata.category))]
  const [category, setCategory] = useState(ALL)
  const visible = concepts.filter((c) => category === ALL || c.metadata.category === category)

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

      <div className="gallery-grid">
        {visible.map(({ metadata: m }) => (
          <a key={m.id} href={`#/watch/${m.id}`} className="gallery-card">
            <div className="thumb">
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
    </div>
  )
}
