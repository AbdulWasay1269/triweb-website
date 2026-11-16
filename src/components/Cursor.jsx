import { useEffect, useRef } from 'react'
import { gsap, isTouch, reducedMotion } from '../lib/motion.js'

/**
 * Liquid-glass cursor (mouse and trackpad only; touch screens keep their
 * natural behaviour).
 *
 * A small lens of glass rides with the pointer. In Chromium browsers it
 * genuinely refracts the page behind it: an SVG displacement map applied as a
 * backdrop filter magnifies gently at the centre and bends light at the rim.
 * The cost is only the cursor's own few thousand pixels, never the page.
 * Other browsers get the same glass body without the refraction.
 *
 * - Movement: the lens follows with a little liquid inertia, stretching along
 *   its direction of travel; its glint and orange reflection drift with it.
 * - Buttons and links: it swells into a softer, warmer lens.
 * - Cards and media: a larger lens with stronger magnification.
 * - Text: a small, gentle lens, so words stay readable.
 * - Labels (projects, 3D objects): a glass pill carrying the action's name.
 * - Click: the glass presses in and a ripple spreads from it.
 *
 * The system cursor stays visible, every part has pointer-events: none, and
 * one GSAP ticker drives it with direct style writes (no React re-renders),
 * going quiet as soon as the lens has settled.
 */

const REFRACT = (() => {
  if (typeof CSS === 'undefined' || !CSS.supports?.('backdrop-filter', 'url(#a)')) return false
  const ua = navigator.userAgent
  return /Chrome\/|Edg\//.test(ua) && !/Firefox\//.test(ua)
})()

/** Displacement map for a glass lens: gentle pull toward the centre, strongest at the rim. */
function lensMap() {
  const N = 128
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')
  const im = g.createImageData(N, N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = ((x + 0.5) / N) * 2 - 1
      const dy = ((y + 0.5) / N) * 2 - 1
      const r = Math.hypot(dx, dy)
      const k = r < 1 ? 0.35 * r + 0.65 * Math.pow(r, 4) : 0
      const i = (y * N + x) * 4
      im.data[i] = 128 - dx * k * 127
      im.data[i + 1] = 128 - dy * k * 127
      im.data[i + 2] = 128
      im.data[i + 3] = 255
    }
  }
  g.putImageData(im, 0, 0)
  return c.toDataURL()
}

const SIZES = { idle: 38, text: 30, field: 16, link: 56, card: 74, label: 36 }
const STRETCH = { idle: 1, text: 0.7, field: 0, link: 0.45, card: 0.6, label: 0 }

export default function Cursor() {
  const root = useRef(null)
  const shape = useRef(null)
  const text = useRef(null)
  const ripple = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (isTouch) return
    if (REFRACT) {
      const url = lensMap()
      map.current?.querySelectorAll('feImage').forEach((el) => el.setAttribute('href', url))
    }
    const el = root.current
    const sh = shape.current
    const p = { x: -100, y: -100, px: -100, py: -100, vx: 0, vy: 0, ang: 0, press: 1, pv: 0, pressTo: 1 }
    let mode = ''
    let shown = false
    let settled = true
    let lastW = SIZES.idle

    const setMode = (m, label = '') => {
      if (m === mode && (m !== 'label' || text.current.textContent === label)) return
      mode = m
      el.dataset.mode = m
      text.current.textContent = label
      // Size the glass for the new state; the CSS transition makes it flow
      let w = SIZES[m] ?? SIZES.idle
      let h = w
      if (m === 'label') {
        w = Math.max(64, text.current.scrollWidth + 34)
        h = SIZES.label
      }
      sh.style.width = `${w}px`
      sh.style.height = `${h}px`
      lastW = w
      settled = false
    }

    const tick = (time, deltaMs) => {
      if (settled || !shown) return
      const dt = Math.min(deltaMs / 1000, 0.05) || 0.016
      const follow = reducedMotion ? 1 : 1 - Math.exp(-dt * 26)
      const ox = p.px
      const oy = p.py
      p.px += (p.x - p.px) * follow
      p.py += (p.y - p.py) * follow
      p.vx = p.vx * 0.6 + ((p.px - ox) / dt) * 0.4
      p.vy = p.vy * 0.6 + ((p.py - oy) / dt) * 0.4
      // Press spring (soft overshoot on release)
      p.pv += (p.pressTo - p.press) * 320 * dt
      p.pv *= Math.exp(-dt * 18)
      p.press += p.pv * dt
      const speed = Math.hypot(p.vx, p.vy)
      const stretch = reducedMotion ? 0 : Math.min(speed / 2600, 0.3) * (STRETCH[mode] ?? 1)
      if (stretch > 0.01) p.ang = Math.atan2(p.vy, p.vx)
      el.style.transform = `translate3d(${p.px}px, ${p.py}px, 0)`
      const sx = (1 + stretch) * p.press
      const sy = (1 - stretch * 0.5) * p.press
      sh.style.transform = stretch > 0.01 ? `translate(-50%, -50%) rotate(${p.ang}rad) scale(${sx}, ${sy}) rotate(${-p.ang}rad)` : `translate(-50%, -50%) scale(${p.press})`
      // Glint drifts against the motion and with the light from the top-left
      const gx = 3 - Math.max(-2.5, Math.min(2.5, p.vx * 0.0025)) - (p.px / innerWidth - 0.5) * 2
      const gy = 4 - Math.max(-2.5, Math.min(2.5, p.vy * 0.0025)) - (p.py / innerHeight - 0.5) * 1.6
      sh.style.setProperty('--gx', `${gx.toFixed(2)}px`)
      sh.style.setProperty('--gy', `${gy.toFixed(2)}px`)
      if (Math.abs(p.x - p.px) < 0.05 && Math.abs(p.y - p.py) < 0.05 && speed < 2 && Math.abs(p.press - p.pressTo) < 0.002 && Math.abs(p.pv) < 0.01) {
        settled = true
      }
    }
    gsap.ticker.add(tick)

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      p.x = e.clientX
      p.y = e.clientY
      if (!shown) {
        shown = true
        p.px = p.x
        p.py = p.y
        el.style.opacity = '1'
      }
      settled = false
    }
    let over3d = ''
    let lastTarget = null
    const onOver = (e) => {
      const t = e.target
      lastTarget = t
      if (!t?.closest) return
      if (over3d && !t.closest('a, button, input, textarea, select, label, [data-cursor], [role="button"], [role="tab"]')) return setMode('label', over3d)
      const lab = t.closest('[data-cursor]')
      if (lab) setMode('label', lab.getAttribute('data-cursor'))
      else if (t.closest('input, textarea, select')) setMode('field')
      else if (t.closest('a, button, [role="button"], [role="tab"], label, summary')) setMode('link')
      else if (t.closest('.card, video, img, figure')) setMode('card')
      else if (t.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd, figcaption')) setMode('text')
      else setMode('idle')
    }
    // Hovering an interactive object in the 3D background shows its action
    const on3d = (e) => {
      over3d = e.detail.label || ''
      if (over3d) setMode('label', over3d)
      else if (lastTarget) onOver({ target: lastTarget })
    }
    const onDown = (e) => {
      if (e.pointerType === 'touch') return
      p.pressTo = 0.84
      settled = false
      if (!reducedMotion && ripple.current?.animate) {
        ripple.current.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0.75 },
            { transform: 'translate(-50%, -50%) scale(2.3)', opacity: 0 },
          ],
          { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
      }
    }
    const onUp = () => {
      p.pressTo = 1
      settled = false
    }
    const onLeave = () => {
      el.style.opacity = '0'
      shown = false
    }
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerover', onOver, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    addEventListener('pointerup', onUp, { passive: true })
    addEventListener('triweb:3dhover', on3d)
    document.documentElement.addEventListener('pointerleave', onLeave)
    setMode('idle')
    return () => {
      gsap.ticker.remove(tick)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerover', onOver)
      removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
      removeEventListener('triweb:3dhover', on3d)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  if (isTouch) return null
  return (
    <>
      <div ref={root} className={`lq cursor-ring ${REFRACT ? 'lq-refract' : 'lq-lite'}`} data-mode="idle" aria-hidden="true">
        <div ref={shape} className="lq-shape">
          <div className="lq-glass" />
        </div>
        <span ref={text} className="lq-label" />
        <i ref={ripple} className="lq-ripple" />
      </div>
      {REFRACT && (
        <svg ref={map} width="0" height="0" className="pointer-events-none absolute" aria-hidden="true" focusable="false">
          {[
            ['lq-soft', 0.05],
            ['lq-mid', 0.09],
            ['lq-strong', 0.13],
          ].map(([id, scale]) => (
            <filter key={id} id={id} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
              <feImage x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
        </svg>
      )}
    </>
  )
}
