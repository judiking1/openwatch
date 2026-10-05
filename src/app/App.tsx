import { OrbitalHandsViewer } from '../features/viewer/OrbitalHandsViewer'
import { OrbitalHandsPrototype } from '../features/prototype/OrbitalHandsPrototype'
import { useHashRoute } from './useHashRoute'

export function App() {
  const route = useHashRoute()

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          Orbital Watch Lab
        </a>
        <nav>
          <a href="#/watch/orbital-hands">Orbital Hands</a>
          <a href="#/lab/orbital-hands-2d">2D Lab</a>
        </nav>
      </header>
      <main className="app-main">
        {route === '/lab/orbital-hands-2d' ? (
          <OrbitalHandsPrototype />
        ) : route === '/watch/orbital-hands' ? (
          <OrbitalHandsViewer />
        ) : (
          <div className="placeholder">
            <p>
              Start with the <a href="#/lab/orbital-hands-2d">Orbital Hands 2D prototype</a>.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
