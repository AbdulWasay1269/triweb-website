import { PAGES, ALIASES, OG_IMAGE } from '../data/seo.js'
import { site } from '../data/site.js'

/**
 * Clean-URL routing helpers (plain JS, shared by the app and the 3D engine).
 * Pages live at /, /about, /media, /software, /portfolio and /contact.
 */
export const ROUTES = Object.fromEntries(PAGES.map((p) => [p.key, p]))

export const pathFor = (key) => ROUTES[key]?.path ?? '/'

/** Page key for a path, or null when the path isn't one of our pages. */
export function routeFromPath(pathname = location.pathname) {
  const slug = decodeURIComponent(pathname)
    .replace(/\.html$/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
  if (slug in ALIASES) return ALIASES[slug]
  return slug && slug in ROUTES ? slug : null
}

/** The page currently shown, from the address bar. */
export const currentRoute = () => routeFromPath() ?? ''

/**
 * Runs once at start-up, before the first render:
 *  - old hash links (/#media, /#/media, /#work) move to their clean address
 *  - /work and /index.html settle on their proper address
 *  - an unknown address (served by 404.html) falls back to the home page
 * Ordinary in-page anchors such as #main or #process are left alone.
 */
export function upgradeLegacyUrl() {
  const word = location.hash.match(/^#\/?([a-z-]+)\/?$/i)?.[1].toLowerCase()
  if (word && (word in ROUTES || word in ALIASES)) {
    history.replaceState(history.state, '', pathFor(routeFromPath('/' + word)) + location.search)
    return
  }
  const here = routeFromPath()
  const target = here === null ? '/' : pathFor(here)
  if (target !== location.pathname) history.replaceState(history.state, '', target + location.search + location.hash)
}

/** Absolute address of the live site, for canonical links and share previews. */
export const siteUrl = () => (import.meta.env.VITE_SITE_URL || site.url || location.origin).replace(/\/+$/, '')

const setTag = (selector, make, attr, value) => {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = make()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}
const meta = (key, name, value) =>
  setTag(
    `meta[${key}="${name}"]`,
    () => {
      const el = document.createElement('meta')
      el.setAttribute(key, name) // 'property' isn't a DOM property, so it must be set as an attribute
      return el
    },
    'content',
    value,
  )

/** Keep the page's title, description, canonical link and share tags in step with the page shown. */
export function applyMeta(key) {
  const page = ROUTES[key] ?? ROUTES['']
  const url = siteUrl() + page.path
  document.title = page.title
  meta('name', 'description', page.description)
  meta('name', 'robots', 'index, follow')
  setTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url)
  meta('property', 'og:url', url)
  meta('property', 'og:title', page.title)
  meta('property', 'og:description', page.description)
  meta('property', 'og:image', siteUrl() + OG_IMAGE)
  meta('name', 'twitter:title', page.title)
  meta('name', 'twitter:description', page.description)
}
