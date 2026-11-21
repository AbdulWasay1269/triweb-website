import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { currentRoute } from '../lib/routes.js'
import { reducedMotion } from '../lib/motion.js'

const POSTERS = ['ootak-bbq', 'sweet-dreams-boba', 'mansion-a', 'by-the-flame', 'kashmir-cloth', 'tree-house', 'cactus-cafe', 'sweet-factory', 'flame-karahi', 'pocket-pizza', 'special-momos', 'tres-leches'].map(
  // The 3D film frames are 270 px wide, so the 360 px posters are plenty
  (s) => `${import.meta.env.BASE_URL}media/posters/${s}-360.webp`,
)

/** True while something opaque fills the whole screen (full-screen reel, video player). */
function isCovered() {
  if (window.__lightboxOpen) return true
  const els = document.querySelectorAll('[data-occlude]')
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.top <= 1 && r.bottom >= innerHeight - 1 && r.left <= 1 && r.right >= innerWidth - 1) return true
  }
  return false
}

/**
 * Can this device draw the 3D world on a graphics chip? Without one (WebGL
 * missing, or emulated in software such as SwiftShader or llvmpipe, which is
 * what Google's PageSpeed test machine and browsers with hardware acceleration
 * switched off use), the 3D would tie up the processor for seconds. Those
 * devices get the designed still background instead, and never download the
 * 3D engine at all.
 */
const detected = { gpu: '(not checked)' }
function hasHardwareWebGL() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return false
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    detected.gpu = name
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
  } catch {
    return false
  }
}

/**
 * The cinematic 3D universe behind every page. It sits under all content
 * (z -10, no pointer capture); the engine listens to window pointer events
 * and ignores anything over buttons, links, cards and forms.
 */
export default function Universe() {
  const ref = useRef(null)
  const sweep = useRef(null)
  const [altered, setAltered] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  // Pages whose 3D mood should show through more strongly
  useEffect(() => {
    const sync = () => {
      const route = currentRoute()
      document.documentElement.classList.toggle('page-vivid', route === 'media' || route === 'work')
    }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('triweb:revealed', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('triweb:revealed', sync)
      document.documentElement.classList.remove('page-vivid')
    }
  }, [])

  useEffect(() => {
    const forced = /[?&]quality=(high|mid|low)\b/.test(location.search)
    if (/[?&]no3d\b/.test(location.search) || (!forced && !hasHardwareWebGL())) {
      document.documentElement.classList.add('no-webgl')
      setFailed(true)
      return
    }
    let u
    let cancelled = false
    let idleId = 0
    const onState = (e) => setAltered(e.detail.altered)
    const onReady = () => setReady(true)
    addEventListener('triweb:3dready', onReady)
    // A soft band of warm light crosses the scene at each section change
    const onSection = () => {
      const el = sweep.current
      if (!el || reducedMotion || !el.animate) return
      el.animate(
        [
          { transform: 'translateX(-60%) skewX(-18deg)', opacity: 0 },
          { opacity: 1, offset: 0.35 },
          { transform: 'translateX(160%) skewX(-18deg)', opacity: 0 },
        ],
        { duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
    }
    addEventListener('triweb:3dsection', onSection)
    const fail = (err) => {
      console.warn('3D background unavailable', err)
      document.documentElement.classList.add('no-webgl')
      setFailed(true)
    }
    const start = () => {
      if (cancelled) return
      // The engine (and Three.js) downloads only on devices that will use it
      import('./engine.js')
        .then(({ createUniverse }) => {
          if (cancelled) return
          u = createUniverse(ref.current, { posters: POSTERS, reducedMotion, isCovered })
          window.__universe = u
          addEventListener('triweb:3dstate', onState)
        })
        .catch(fail)
    }
    // Start the 3D world only after the page itself has loaded and the browser
    // is idle, so the first view, fonts and videos come first.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300))
    const schedule = () => (idleId = idle(start, { timeout: 700 }))
    if (document.readyState === 'complete') schedule()
    else addEventListener('load', schedule, { once: true })
    return () => {
      cancelled = true
      removeEventListener('load', schedule)
      ;(window.cancelIdleCallback || clearTimeout)(idleId)
      removeEventListener('triweb:3dstate', onState)
      removeEventListener('triweb:3dready', onReady)
      removeEventListener('triweb:3dsection', onSection)
      u?.dispose()
      delete window.__universe
    }
  }, [])

  return (
    <>
      <Debug3D />
      <div className="universe-fallback pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div ref={ref} className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${failed ? 'hidden' : ready ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 overflow-hidden">
          <div ref={sweep} className="absolute inset-y-[-10%] left-0 w-[70%] opacity-0 [background:linear-gradient(90deg,transparent,rgba(255,122,69,0.10)_40%,rgba(255,210,189,0.16)_50%,rgba(255,122,69,0.10)_60%,transparent)]" />
        </div>
                {/* Same readability veil the previous background used, so text contrast is unchanged */}
        <div className="universe-veil absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,0.55)_0%,rgba(11,18,32,0.35)_45%,rgba(11,18,32,0.45)_100%)]" />
        <div className="universe-veil absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,transparent,rgba(11,18,32,0.55))]" />
      </div>
      <button
        type="button"
        onClick={() => dispatchEvent(new Event('triweb:3dreset'))}
        className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-night/90 px-4 py-2.5 text-sm font-semibold text-bone ring-1 ring-vermilion/50 shadow-[0_10px_40px_-10px_rgba(255,58,32,0.6)] transition-all duration-500 hover:bg-vermilion hover:ring-vermilion ${
          altered ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        aria-hidden={!altered}
        tabIndex={altered ? 0 : -1}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset scene
      </button>
    </>
  )
}

/**
 * Diagnostics panel, shown only when the address has ?debug3d.
 * Reports what the 3D background is doing on this device.
 */
export function Debug3D() {
  const [info, setInfo] = useState(null)
  useEffect(() => {
    if (!/[?&]debug3d\b/.test(location.search)) return
    let last = null
    const id = setInterval(() => {
      const u = window.__universe
      const s = u?.stats?.()
      const fps = s && last ? s.frames - last : null
      last = s ? s.frames : null
      setInfo({
        running: !!u,
        noWebgl: document.documentElement.classList.contains('no-webgl'),
        detectedGpu: detected.gpu,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        touch: matchMedia('(pointer: coarse)').matches,
        screen: `${innerWidth}×${innerHeight} @${devicePixelRatio}x`,
        fps,
        ...s,
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])
  if (!info) return null
  return (
    <pre className="fixed bottom-24 left-2 z-[300] max-w-[92vw] whitespace-pre-wrap rounded-lg bg-black/85 p-3 font-mono text-[11px] leading-snug text-[#9effa1]">
      {Object.entries(info)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')}
    </pre>
  )
}
