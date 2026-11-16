import { gsap, isTouch, reducedMotion } from './motion.js'

/**
 * Jelly buttons: any element with `data-jelly` wobbles like soft jelly when
 * the pointer arrives. It squashes along the direction you came in from,
 * springs back with a giggle, and squishes when pressed. One delegated
 * listener covers every button on the site.
 */
export function initJelly() {
  if (typeof window === 'undefined' || isTouch || reducedMotion) return
  const host = (t) => (t instanceof Element ? t.closest('[data-jelly]') : null)

  document.addEventListener('pointerover', (e) => {
    const el = host(e.target)
    if (!el || el.contains(e.relatedTarget)) return
    const r = el.getBoundingClientRect()
    // Where did the pointer come in? -1…1 on each axis
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)))
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)))
    const side = Math.abs(nx) > Math.abs(ny) * 0.6
    const k = el.dataset.jelly === 'soft' ? 0.6 : 1
    gsap.killTweensOf(el, 'scaleX,scaleY,rotation,skewX')
    gsap.fromTo(
      el,
      { scaleX: 1 + (side ? -0.1 : 0.14) * k, scaleY: 1 + (side ? 0.12 : -0.12) * k, skewX: -nx * 6 * k },
      { scaleX: 1, scaleY: 1, skewX: 0, duration: 1.25, ease: 'elastic.out(1.3, 0.34)', overwrite: false },
    )
    gsap.fromTo(
      el,
      { rotation: 0 },
      { keyframes: [{ rotation: -2.6 * k * (nx || 1) }, { rotation: 1.9 * k * (nx || 1) }, { rotation: -1 * k * (nx || 1) }, { rotation: 0.4 * k * (nx || 1) }, { rotation: 0 }], duration: 0.62, ease: 'sine.inOut', overwrite: false },
    )
  })

  document.addEventListener('pointerdown', (e) => {
    const el = host(e.target)
    if (!el) return
    gsap.to(el, { scaleX: 1.06, scaleY: 0.9, duration: 0.12, ease: 'power2.out', overwrite: 'auto' })
  })
  const release = (e) => {
    const el = host(e.target)
    if (!el) return
    gsap.to(el, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'elastic.out(1.3, 0.3)', overwrite: 'auto' })
  }
  document.addEventListener('pointerup', release)
  document.addEventListener('pointerout', (e) => {
    const el = host(e.target)
    if (el && !el.contains(e.relatedTarget)) release(e)
  })
  document.addEventListener('pointercancel', release)
}
