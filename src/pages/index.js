/**
 * Page code-splitting. Home ships with the main bundle (most visitors land
 * there); every other page is its own file, fetched while the page-transition
 * curtain closes, and prefetched in idle time once the first page is shown.
 */
import Home from './Home.jsx'

const LOADERS = {
  about: () => import('./About.jsx'),
  media: () => import('./Media.jsx'),
  software: () => import('./Software.jsx'),
  work: () => import('./Portfolio.jsx'),
  contact: () => import('./Contact.jsx'),
}
const loaded = { '': Home }
const pending = {}

/** The page component, once loaded (see loadPage). */
export const pageFor = (key) => loaded[key] ?? Home

/** Load a page's code (cached). Resolves when it can be rendered. */
export function loadPage(key) {
  if (loaded[key] || !LOADERS[key]) return Promise.resolve()
  pending[key] ??= LOADERS[key]()
    .then((m) => {
      loaded[key] = m.default
    })
    .catch((err) => {
      // A failed download (e.g. a new deploy replaced old files): reload the page fresh
      delete pending[key]
      console.warn('Page failed to load, reloading', err)
      location.reload()
    })
  return pending[key]
}

let prefetched = false
/** Fetch the remaining pages quietly, so later page changes are instant. */
export function prefetchPages() {
  if (prefetched) return
  prefetched = true
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500))
  const keys = Object.keys(LOADERS)
  const next = () => {
    const k = keys.shift()
    if (!k) return
    loadPage(k).then(() => idle(next, { timeout: 4000 }))
  }
  idle(next, { timeout: 4000 })
}
