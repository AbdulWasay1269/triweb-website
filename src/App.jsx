import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import { ScrollProgress, BackToTop, WhatsAppButton, SpeedVignette } from './components/Chrome.jsx'
import { LightboxProvider } from './components/Lightbox.jsx'
import { LogoIcon } from './components/Logo.jsx'
import Cursor from './components/Cursor.jsx'
import { pageFor, loadPage, prefetchPages } from './pages/index.js'
import { pathFor, currentRoute, useRequestedRoute } from './router.jsx'
import { applyMeta } from './lib/routes.js'
import { initSmoothScroll, scrollToTarget, scrollToTop } from './lib/scroll.js'
import { gsap, ScrollTrigger, reducedMotion } from './lib/motion.js'

// The 3D engine (and Three.js) starts downloading straight away and sets
// itself up behind the opening logo, so the page opens with everything ready
// (see the opening below). Devices without proper 3D support skip it.
const Universe = lazy(() => import('./universe/Universe.jsx'))

// The opening logo stays up until the 3D scene has drawn its first frame, but
// never past this point (ms after the page started loading); after that the
// page opens anyway and the scene fades in when ready.
const OPEN_BY = 2600
const sceneReady = () =>
  new Promise((resolve) => {
    if (window.__u3dState === 'ready' || window.__u3dState === 'failed') return resolve()
    addEventListener('triweb:3dready', resolve, { once: true })
    addEventListener('triweb:3dfail', resolve, { once: true })
    setTimeout(resolve, Math.max(300, OPEN_BY - performance.now()))
  })

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const requested = useRequestedRoute()
  const curtain = useRef(null)
  const pendingSection = useRef(null)
  const busy = useRef(false)
  const queued = useRef(null)
  const firstPaint = useRef(true)

  useEffect(() => initSmoothScroll(), [])
  // The hero shows a still of the 3D scene until the live scene is ready (index.css)
  useLayoutEffect(() => document.documentElement.classList.add('u3d-still'), [])

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
      if (push) history.pushState(null, '', pathFor(to))
      pendingSection.current = section || null
      // Each page's code is its own file; start fetching it while the curtain closes
      const ready = loadPage(to)
      if (reducedMotion) {
        ready.then(() => setRoute(to))
        return
      }
      busy.current = true
      window.__triwebRevealed = false
      gsap
        .timeline()
        .set(curtain.current, { display: 'flex' })
        .fromTo('.curtain-panel', { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'expo.inOut', stagger: 0.05 })
        .fromTo('.curtain-logo', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25 }, '-=0.25')
        .call(() => ready.then(() => setRoute(to)))
    },
    [route],
  )

  useEffect(() => {
    const onNav = (e) => go(e.detail.to, e.detail.section, true)
    addEventListener('triweb:navigate', onNav)
    return () => removeEventListener('triweb:navigate', onNav)
  }, [go])

  // Browser back/forward
  useEffect(() => {
    if (requested !== route) go(requested, null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])

  // New page is mounted under the curtain: reset scroll, then reveal
  useLayoutEffect(() => {
    applyMeta(route)
    scrollToTop(true)
    const finish = () => {
      window.__triwebRevealed = true
      window.dispatchEvent(new Event('triweb:revealed'))
      // Other pages download later, so they don't compete with this one's
      // images and the 3D scene in the first seconds
      setTimeout(prefetchPages, 6000)
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
      // Kept brisk: the page is ready underneath, so the logo only says hello
      tl.fromTo('.curtain-logo', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out' }).fromTo('.curtain-logo svg', { rotateY: -90 }, { rotateY: 0, duration: 0.55, ease: 'expo.out' }, '<')
      // Hold on the logo until the 3D scene is ready (gently breathing, a CSS
      // animation that keeps moving even while the browser is busy setting up)
      tl.add(() => {
        tl.pause()
        document.documentElement.classList.add('curtain-wait')
        sceneReady().then(() => {
          document.documentElement.classList.remove('curtain-wait')
          tl.resume()
        })
      })
    }
    tl.to('.curtain-logo', { autoAlpha: 0, duration: 0.2 }, '+=0.02')
      .add(finish)
      .to('.curtain-panel', { yPercent: -100, duration: 0.6, ease: 'expo.inOut', stagger: 0.05 }, '<')
    return () => tl.kill()
  }, [route])

  const dispatchQueued = (q) => window.dispatchEvent(new CustomEvent('triweb:navigate', { detail: { to: q.to, section: q.section } }))

  const PageComponent = pageFor(route)

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
