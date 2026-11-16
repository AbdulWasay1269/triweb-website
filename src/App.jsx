import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import { ScrollProgress, BackToTop, WhatsAppButton, SpeedVignette } from './components/Chrome.jsx'
import { LightboxProvider } from './components/Lightbox.jsx'
import { LogoIcon } from './components/Logo.jsx'
import Cursor from './components/Cursor.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Media from './pages/Media.jsx'
import Software from './pages/Software.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Contact from './pages/Contact.jsx'
import { ROUTES, parseHash, useRequestedRoute } from './router.jsx'
import { initSmoothScroll, scrollToTarget, scrollToTop } from './lib/scroll.js'
import { gsap, ScrollTrigger, reducedMotion } from './lib/motion.js'

// The 3D engine (and Three.js) downloads only after the page has finished loading
const afterLoad = () => new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })))
const Universe = lazy(() => afterLoad().then(() => import('./universe/Universe.jsx')))
const PAGES = { '': Home, about: About, media: Media, software: Software, work: Portfolio, contact: Contact }

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const requested = useRequestedRoute()
  const curtain = useRef(null)
  const pendingSection = useRef(null)
  const busy = useRef(false)
  const queued = useRef(null)
  const firstPaint = useRef(true)

  useEffect(() => initSmoothScroll(), [])

  // Cover the screen, swap the page, then reveal (see useLayoutEffect below)
  const go = useCallback(
    (to, section, push) => {
      // A click during a transition is remembered and runs right after it
      if (busy.current) {
        queued.current = { to, section, push }
        return
      }
      if (to === route) {
        if (section) scrollToTarget(`#${section}`)
        else scrollToTop(false)
        return
      }
      if (push) history.pushState(null, '', to ? `#${to}` : location.pathname + location.search)
      pendingSection.current = section || null
      if (reducedMotion) {
        setRoute(to)
        return
      }
      busy.current = true
      window.__triwebRevealed = false
      gsap
        .timeline()
        .set(curtain.current, { display: 'flex' })
        .fromTo('.curtain-panel', { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'expo.inOut', stagger: 0.05 })
        .fromTo('.curtain-logo', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25 }, '-=0.25')
        .call(() => setRoute(to))
    },
    [route],
  )

  useEffect(() => {
    const onNav = (e) => go(e.detail.to, e.detail.section, true)
    addEventListener('triweb:navigate', onNav)
    return () => removeEventListener('triweb:navigate', onNav)
  }, [go])

  // Browser back/forward and manually edited hashes
  useEffect(() => {
    if (requested !== route) go(requested, null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])

  // New page is mounted under the curtain: reset scroll, then reveal
  useLayoutEffect(() => {
    document.title = ROUTES[route].title
    scrollToTop(true)
    const finish = () => {
      window.__triwebRevealed = true
      window.dispatchEvent(new Event('triweb:revealed'))
      ScrollTrigger.refresh()
      if (pendingSection.current) {
        const id = pendingSection.current
        pendingSection.current = null
        setTimeout(() => scrollToTarget(`#${id}`), 150)
      }
    }
    if (reducedMotion) {
      finish()
      return
    }
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(curtain.current, { display: 'none' })
        busy.current = false
        const q = queued.current
        queued.current = null
        if (q) dispatchQueued(q)
      },
    })
    if (firstPaint.current) {
      // Opening: curtain already covers the screen
      firstPaint.current = false
      tl.fromTo('.curtain-logo', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' }).fromTo('.curtain-logo svg', { rotateY: -90 }, { rotateY: 0, duration: 0.9, ease: 'expo.out' }, '<')
    }
    tl.to('.curtain-logo', { autoAlpha: 0, duration: 0.2 }, '+=0.02')
      .add(finish)
      .to('.curtain-panel', { yPercent: -100, duration: 0.6, ease: 'expo.inOut', stagger: 0.05 }, '<')
    return () => tl.kill()
  }, [route])

  const dispatchQueued = (q) => window.dispatchEvent(new CustomEvent('triweb:navigate', { detail: { to: q.to, section: q.section } }))

  const PageComponent = PAGES[route]

  return (
    <LightboxProvider>
      <a href="#main" className="sr-only z-[200] rounded-xl bg-bone px-5 py-3 font-semibold text-obsidian focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Suspense fallback={<div className="universe-fallback fixed inset-0 -z-10" />}>
        <Universe />
      </Suspense>
      <ScrollProgress />
      <SpeedVignette />
      <Nav route={route} />
      <main id="main" tabIndex={-1} className="relative outline-none">
        <PageComponent key={route} />
      </main>
      <Footer />
      <BackToTop />
      <WhatsAppButton />
      <Cursor />

      {/* Page-transition curtain: three panels, one per brand colour */}
      <div ref={curtain} className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center" style={{ display: reducedMotion ? 'none' : 'flex' }} aria-hidden="true">
        <div className="curtain-panel absolute inset-0 bg-vermilion" />
        <div className="curtain-panel absolute inset-0 bg-night" />
        <div className="curtain-panel absolute inset-0 bg-obsidian" />
        <div className="curtain-logo relative flex flex-col items-center gap-5 [perspective:600px]">
          <LogoIcon className="h-24 w-auto rounded-md shadow-[0_20px_80px_-10px_rgba(255,58,32,0.7)]" />
          <span className="text-xl tracking-[-0.035em]">
            <span className="font-bold">triweb</span>
            <span className="font-light">solutions</span>
          </span>
        </div>
      </div>
    </LightboxProvider>
  )
}
