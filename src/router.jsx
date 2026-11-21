import { useEffect, useState } from 'react'
import { ROUTES, pathFor, currentRoute } from './lib/routes.js'

/**
 * Clean-URL router. Pages live at /, /about, /media, /software, /portfolio
 * and /contact (see src/data/seo.js). Uses the browser's history, so Back,
 * Forward, bookmarks and shared links all work.
 */
export { ROUTES, pathFor, currentRoute }

/**
 * Ask the app to go to a page. `section` (optional) is an element id on the
 * destination page to scroll to after the transition.
 */
export function navigate(to, section) {
  window.dispatchEvent(new CustomEvent('triweb:navigate', { detail: { to, section } }))
}

/** The page the address bar asks for; changes on Back / Forward. */
export function useRequestedRoute() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const onPop = () => setRoute(currentRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return route
}

export function Link({ to, section, children, onClick, ...rest }) {
  return (
    <a
      href={pathFor(to)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return
        e.preventDefault()
        onClick?.(e)
        navigate(to, section)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
