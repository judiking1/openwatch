import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { preloadBodyAssets } from './three/parts/bodyAssets'

// Every watch uses the Blender body parts: fetch them while the page starts.
preloadBodyAssets()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
