import { useEffect, useState } from 'react'

/** Minimal hash router: returns the path after `#` (e.g. `/watch/orbital-hands`). */
export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
