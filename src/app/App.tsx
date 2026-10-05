import { lazy, Suspense } from 'react'
import { OrbitalHandsPrototype } from '../features/prototype/OrbitalHandsPrototype'
import { concepts, getConcept } from '../watches/registry'
import { useHashRoute } from './useHashRoute'

const WatchViewer = lazy(() => import('../features/viewer/WatchViewer'))

function Page({ route }: { route: string }) {
  if (route === '/lab/orbital-hands-2d') return <OrbitalHandsPrototype />

  const watchMatch = route.match(/^\/watch\/([\w-]+)$/)
  if (watchMatch) {
    const concept = getConcept(watchMatch[1])
    if (!concept) return <div className="placeholder">Unknown watch “{watchMatch[1]}”.</div>
    return (
      <Suspense fallback={<div className="placeholder">Loading viewer…</div>}>
        <WatchViewer key={concept.metadata.id} concept={concept} />
      </Suspense>
    )
  }

  return (
    <div className="placeholder">
      <ul>
        {concepts.map((c) => (
          <li key={c.metadata.id}>
            <a href={`#/watch/${c.metadata.id}`}>
              {c.metadata.number} — {c.metadata.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function App() {
  const route = useHashRoute()

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          Orbital Watch Lab
        </a>
        <nav>
          <a href="#/">Exhibition</a>
          <a href="#/lab/orbital-hands-2d">2D Lab</a>
        </nav>
      </header>
      <main className="app-main">
        <Page route={route} />
      </main>
    </div>
  )
}
