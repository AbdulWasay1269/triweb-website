import { useEffect, useState } from 'react'

/**
 * Tiny hash router. Pages live at #about, #media, #software, #work, #contact
 * (the home page has no hash). Hash URLs work on any static host with no
 * server configuration, and every page can be bookmarked or shared.
 */
export const ROUTES = {
  '': { title: 'TriWeb Solutions | Media Production & Software Agency', label: 'Home' },
  about: { title: 'About | TriWeb Solutions', label: 'About' },
  media: { title: 'TriWeb Media Productions | Branding, Ads & Video', label: 'Media Productions' },
  software: { title: 'TriWeb Software Company | Web Development & AI Automation', label: 'Software Company' },
  work: { title: 'Portfolio | TriWeb Solutions', label: 'Portfolio' },
  contact: { title: 'Contact | TriWeb Solutions', label: 'Contact' },
}

export function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  return h in ROUTES ? h : ''
}

/**
 * Ask the app to go to a page. `section` (optional) is an element id on the
 * destination page to scroll to after the transition.
 */
export function navigate(to, section) {
  window.dispatchEvent(new CustomEvent('triweb:navigate', { detail: { to, section } }))
}

export function useRequestedRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onPop = () => setRoute(parseHash())
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onPop)
    }
  }, [])
  return route
}

export function Link({ to, section, children, onClick, ...rest }) {
  return (
    <a
      href={to ? `#${to}` : './'}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
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
