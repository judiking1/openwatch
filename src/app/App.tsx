import { lazy, Suspense, useEffect, useRef } from 'react'
import { Gallery } from '../features/gallery/Gallery'
import { OrbitalHandsPrototype } from '../features/prototype/OrbitalHandsPrototype'
import { concepts, getConcept } from '../watches/registry'
import { useTimeStore } from '../stores/timeStore'
import { atTimeOfDay, parseClock } from '../utils/time'
import { parseRoute, useHashRoute } from './useHashRoute'

import { parseToneMapping } from '../features/viewer/toneMapping'

const WatchViewer = lazy(() => import('../features/viewer/WatchViewer'))
const ModelLab = lazy(() => import('../features/import/ModelLab'))

/**
 * `?t=HH:MM:SS` freezes the clock at that time (screenshots, sharing a reading).
 * Leaving such a link returns the clock to live time.
 */
function useTimeParam(route: string) {
  const frozenByLink = useRef(false)
  useEffect(() => {
    const parsed = parseClock(parseRoute(route).params.get('t') ?? '')
    const store = useTimeStore.getState()
    if (parsed) {
      store.setManualTime(atTimeOfDay(Date.now(), parsed.hours, parsed.minutes, parsed.seconds))
      store.setPaused(true)
      frozenByLink.current = true
    } else if (frozenByLink.current) {
      store.goLive()
      frozenByLink.current = false
    }
  }, [route])
}

function Page({ hash }: { hash: string }) {
  const { path, params } = parseRoute(hash)
  if (path === '/lab/orbital-hands-2d') return <OrbitalHandsPrototype />
  if (path === '/lab/import')
    return (
      <Suspense fallback={<div className="placeholder">Loading model lab…</div>}>
        <ModelLab />
      </Suspense>
    )

  const watchMatch = path.match(/^\/watch\/([\w-]+)$/)
  if (watchMatch) {
    const concept = getConcept(watchMatch[1])
    if (!concept) return <div className="placeholder">Unknown watch “{watchMatch[1]}”.</div>
    const index = concepts.indexOf(concept)
    return (
      <Suspense fallback={<div className="placeholder">Loading viewer…</div>}>
        <WatchViewer
          key={concept.metadata.id}
          concept={concept}
          prev={concepts[index - 1]}
          next={concepts[index + 1]}
          bare={params.has('bare')}
          stats={params.has('stats')}
          tone={parseToneMapping(params.get('tone'))}
        />
      </Suspense>
    )
  }

  return <Gallery concepts={concepts} />
}

export function App() {
  const route = useHashRoute()
  const bare = parseRoute(route).params.has('bare')

  useTimeParam(route)

  return (
    <div className="app">
      {!bare && (
        <header className="topbar">
          <a href="#/" className="brand">
            Orbital Watch Lab <span className="version">v{__APP_VERSION__}</span>
          </a>
          <nav>
            <a href="#/">Exhibition</a>
            <a href="#/lab/import">Import</a>
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
