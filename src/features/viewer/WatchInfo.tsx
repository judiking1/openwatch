import { ORIGIN_LABEL, type WatchMetadata } from '../../types/watch'

const FEASIBILITY_LABEL: Record<WatchMetadata['feasibility'], string> = {
  unknown: 'Unknown',
  conceptual: 'Conceptual',
  plausible: 'Plausible',
  'prototype-tested': 'Prototype tested',
}

/** Title block: number, name, tagline and classification badges. */
export function WatchHeader({ meta }: { meta: WatchMetadata }) {
  return (
    <section className="panel-section watch-info">
      <div className="watch-number">No. {meta.number}</div>
      <h2>{meta.name}</h2>
      <p className="tagline">{meta.tagline}</p>
      <div className="badges">
        <span className="badge">{meta.category}</span>
        <span className="badge">{ORIGIN_LABEL[meta.origin.type]}</span>
        <span className="badge">{FEASIBILITY_LABEL[meta.feasibility]}</span>
      </div>
    </section>
  )
}

/** The concept's story: how to read it, what it is, what is experimental. */
export function WatchStory({ meta }: { meta: WatchMetadata }) {
  return (
    <section className="panel-section watch-info">
      <h3>How to read</h3>
      <ul>
        {meta.howToRead.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <h3>About</h3>
      <p>{meta.description}</p>
      <h3>Experimental</h3>
      <p>{meta.experimental}</p>
      {meta.origin.note && <p className="note">{meta.origin.note}</p>}
    </section>
  )
}
