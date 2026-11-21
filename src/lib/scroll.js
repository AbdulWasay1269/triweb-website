import Lenis from 'lenis'
import { gsap, ScrollTrigger, reducedMotion } from './motion.js'

let lenis = null
export const scrollState = { y: 0, velocity: 0, progress: 0 }

/**
 * Scrollable height of the page, cached. Reading scrollHeight inside scroll
 * handlers forced the browser to recalculate layout on every scroll event;
 * now it's re-measured only when the page's size actually changes.
 */
let maxScroll = 0
let sizeWatch = null
const measure = () => (maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight))
export function pageMax() {
  if (!sizeWatch && typeof ResizeObserver !== 'undefined') {
    sizeWatch = new ResizeObserver(measure)
    sizeWatch.observe(document.body)
    addEventListener('resize', measure, { passive: true })
    measure()
  }
  return maxScroll
}

export function initSmoothScroll() {
  const onNative = () => {
    const max = pageMax()
    scrollState.y = scrollY
    scrollState.progress = max > 0 ? scrollY / max : 0
  }
  if (reducedMotion) {
    addEventListener('scroll', onNative, { passive: true })
    return () => removeEventListener('scroll', onNative)
  }
  lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true, syncTouch: false })
  lenis.on('scroll', (l) => {
    ScrollTrigger.update()
    scrollState.y = l.scroll
    scrollState.velocity = l.velocity
    scrollState.progress = l.progress || 0
  })
  const tick = (time) => lenis && lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function stopScroll() {
  lenis?.stop()
  document.documentElement.style.overflow = 'hidden'
}
export function startScroll() {
  lenis?.start()
  document.documentElement.style.overflow = ''
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true })
  else window.scrollTo(0, 0)
}

export function scrollToTarget(target, { offset = -88 } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4, force: true })
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reducedMotion ? 'auto' : 'smooth' })
}
