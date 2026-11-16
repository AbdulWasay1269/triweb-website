import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)
export { gsap, ScrollTrigger, SplitText }

export const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches
export const isSmallScreen = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

/** Scoped GSAP context that reverts automatically on unmount. */
export function useGsap(callback, deps = []) {
  const scope = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context((self) => callback(self, scope.current), scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return scope
}

/**
 * Declarative scroll animations used on every page.
 *   data-reveal            fade + rise + un-blur when scrolled into view
 *   data-reveal="left"     slide in from the left   ("right", "scale" also available)
 *   data-reveal-group      children reveal with a stagger
 *   data-split             heading words rise out of a mask
 *   data-parallax="0.15"   moves at a different speed while scrolling
 *   data-zoom              image/video scales down from 1.15 as it scrolls in
 */
export function initPageAnimations(root) {
  if (!root || reducedMotion) return () => {}
  const ctx = gsap.context(() => {
    const from = {
      up: { y: 48, opacity: 0 },
      left: { x: -60, opacity: 0 },
      right: { x: 60, opacity: 0 },
      scale: { scale: 0.92, opacity: 0 },
    }
    root.querySelectorAll('[data-reveal]').forEach((el) => {
      const kind = el.getAttribute('data-reveal') || 'up'
      gsap.from(el, {
        ...(from[kind] || from.up),
        duration: 1.1,
        ease: 'expo.out',
        clearProps: 'filter',
        delay: Number(el.getAttribute('data-delay') || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    })
    root.querySelectorAll('[data-reveal-group]').forEach((group) => {
      gsap.from(group.children, {
        y: 56,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.1,
        clearProps: 'filter',
        scrollTrigger: { trigger: group, start: 'top 86%', once: true },
      })
    })
    root.querySelectorAll('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        mask: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 110,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.04,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        },
      })
    })
    root.querySelectorAll('[data-parallax]').forEach((el) => {
      const s = Number(el.getAttribute('data-parallax')) || 0.15
      gsap.fromTo(el, { yPercent: s * 100 }, { yPercent: -s * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    // Camera push-in: big panels glide forward as they scroll into view
    root.querySelectorAll('[data-push]').forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 0.88, y: 80, opacity: 0.35, transformOrigin: '50% 100%' },
        { scale: 1, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: 0.6 } },
      )
    })
    // Section headings drift slightly slower than the page (depth)
    root.querySelectorAll('[data-depth]').forEach((el) => {
      gsap.fromTo(el, { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    root.querySelectorAll('[data-zoom]').forEach((el) => {
      gsap.fromTo(el, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true } })
    })
  }, root)
  return () => ctx.revert()
}

/**
 * Pointer-driven 3D tilt + spotlight variables. One set of quickTo tweens is
 * created per element and reused, so moving the mouse never allocates new
 * animations (smooth even with many cards on screen).
 */
const tiltCache = new WeakMap()
function tiltFor(el, max, scale) {
  let t = tiltCache.get(el)
  if (!t) {
    gsap.set(el, { transformPerspective: 1100 })
    t = {
      rx: gsap.quickTo(el, 'rotateX', { duration: 0.5, ease: 'power3.out' }),
      ry: gsap.quickTo(el, 'rotateY', { duration: 0.5, ease: 'power3.out' }),
      sc: gsap.quickTo(el, 'scale', { duration: 0.5, ease: 'power3.out' }),
      rect: null,
    }
    tiltCache.set(el, t)
  }
  return t
}
export function tiltHandlers({ max = 7, scale = 1.015 } = {}) {
  const spot = (el, x, y) => {
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
  }
  if (isTouch || reducedMotion) return {}
  return {
    onPointerEnter: (e) => {
      const t = tiltFor(e.currentTarget, max, scale)
      t.rect = e.currentTarget.getBoundingClientRect()
    },
    onPointerMove: (e) => {
      const el = e.currentTarget
      const t = tiltFor(el, max, scale)
      const r = t.rect || (t.rect = el.getBoundingClientRect())
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      spot(el, x, y)
      t.ry((x / r.width - 0.5) * max * 2)
      t.rx((0.5 - y / r.height) * max * 2)
      t.sc(scale)
    },
    onPointerLeave: (e) => {
      const t = tiltFor(e.currentTarget, max, scale)
      t.rect = null
      t.rx(0)
      t.ry(0)
      t.sc(1)
    },
  }
}

/** Run `fn` once the page-transition curtain has lifted (immediately if it already has). */
export function whenRevealed(fn) {
  if (typeof window === 'undefined') return () => {}
  if (window.__triwebRevealed) {
    fn()
    return () => {}
  }
  const h = () => fn()
  window.addEventListener('triweb:revealed', h, { once: true })
  return () => window.removeEventListener('triweb:revealed', h)
}
