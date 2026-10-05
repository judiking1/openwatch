import { lazy, Suspense, useEffect } from 'react'
import { Gallery } from '../features/gallery/Gallery'
import { OrbitalHandsPrototype } from '../features/prototype/OrbitalHandsPrototype'
import { concepts, getConcept } from '../watches/registry'
import { useTimeStore } from '../stores/timeStore'
import { parseRoute, useHashRoute } from './useHashRoute'

const WatchViewer = lazy(() => import('../features/viewer/WatchViewer'))

/** `?t=HH:MM:SS` freezes the clock at that time (handy for screenshots and sharing). */
function applyTimeParam(params: URLSearchParams) {
  const t = params.get('t')
  if (!t) return
  const [h = 0, m = 0, s = 0] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, s, 0)
  const store = useTimeStore.getState()
  store.setManualTime(d.getTime())
  store.setPaused(true)
}

function Page({ hash }: { hash: string }) {
  const { path, params } = parseRoute(hash)
  if (path === '/lab/orbital-hands-2d') return <OrbitalHandsPrototype />

  const watchMatch = path.match(/^\/watch\/([\w-]+)$/)
  if (watchMatch) {
    const concept = getConcept(watchMatch[1])
    if (!concept) return <div className="placeholder">Unknown watch “{watchMatch[1]}”.</div>
    return (
      <Suspense fallback={<div className="placeholder">Loading viewer…</div>}>
        <WatchViewer key={concept.metadata.id} concept={concept} bare={params.has('bare')} />
      </Suspense>
    )
  }

  return <Gallery concepts={concepts} />
}

export function App() {
  const route = useHashRoute()
  const bare = parseRoute(route).params.has('bare')

  useEffect(() => applyTimeParam(parseRoute(route).params), [route])

  return (
    <div className="app">
      {!bare && (
        <header className="topbar">
          <a href="#/" className="brand">
            Orbital Watch Lab <span className="version">v{__APP_VERSION__}</span>
          </a>
          <nav>
            <a href="#/">Exhibition</a>
            <a href="#/lab/orbital-hands-2d">2D Lab</a>
          </nav>
        </header>
      )}
      <main className="app-main">
        <Page hash={route} />
      </main>
    </div>
  )
}
