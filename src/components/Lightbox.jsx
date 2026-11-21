import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, RotateCcw, ArrowUpRight } from 'lucide-react'
import { gsap, reducedMotion } from '../lib/motion.js'
import { startScroll, stopScroll } from '../lib/scroll.js'
import { suspendLoops } from './Reel.jsx'
import { navigate } from '../router.jsx'
import { categories } from '../data/portfolio.js'

const categoryLabel = (id) => categories.find((c) => c.id === id)?.label

const LightboxContext = createContext({ open: () => {} })
export const useLightbox = () => useContext(LightboxContext)

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null)
  const open = useCallback((items, index = 0) => setState({ items, index }), [])
  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {state && <Player {...state} setIndex={(i) => setState((s) => ({ ...s, index: i }))} onClose={() => setState(null)} />}
    </LightboxContext.Provider>
  )
}

/** Full-screen HD player: loading state, error recovery, keyboard + swipe. */
function Player({ items, index, setIndex, onClose }) {
  const root = useRef(null)
  const frame = useRef(null)
  const closeBtn = useRef(null)
  const lastFocus = useRef(null)
  const touchX = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [attempt, setAttempt] = useState(0)
  const item = items[index]
  const many = items.length > 1
  // Portfolio projects open as a project page: video plus details
  const detail = !!item.category

  const go = useCallback(
    (d) => {
      setStatus('loading')
      setIndex((index + d + items.length) % items.length)
    },
    [index, items.length, setIndex],
  )

  useEffect(() => {
    lastFocus.current = document.activeElement
    stopScroll()
    suspendLoops(true)
    window.__lightboxOpen = true
    closeBtn.current?.focus()
    if (!reducedMotion) {
      gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 })
      gsap.fromTo(frame.current, { y: 40, scale: 0.94 }, { y: 0, scale: 1, duration: 0.7, ease: 'expo.out' })
    }
    return () => {
      startScroll()
      suspendLoops(false)
      window.__lightboxOpen = false
      lastFocus.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && many) go(1)
      if (e.key === 'ArrowLeft' && many) go(-1)
      if (e.key === 'Tab') {
        const f = [...root.current.querySelectorAll('button, video')]
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [go, many, onClose])

  const navBtn = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border hairline bg-night/70 text-bone transition hover:scale-105 hover:bg-bone hover:text-obsidian'

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      data-lenis-prevent
      className={`fixed inset-0 z-[90] flex justify-center overflow-y-auto bg-obsidian/95 p-3 sm:p-6 ${detail ? 'items-start pt-20 md:items-center md:pt-6' : 'items-center'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null || !many) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <button ref={closeBtn} onClick={onClose} className={`${navBtn} absolute right-4 top-4 z-10`} aria-label="Close player">
        <X className="h-5 w-5" />
      </button>

      {detail ? (
        <div className="flex w-full max-w-6xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-center md:gap-10">
          <figure ref={frame} className="shrink-0">
          <div className="relative aspect-[9/16] h-[min(58dvh,calc((100vw-1.5rem)*16/9))] md:h-[min(84dvh,calc((100vw-1.5rem)*16/9))] overflow-hidden rounded-2xl bg-night shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-bone/10">
            <img src={item.media.poster || item.media.image} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
            {item.media.full ? (
              <video
                key={`${item.media.full}-${attempt}`}
                src={item.media.full}
                poster={item.media.poster}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="relative h-full w-full bg-black object-contain"
                onLoadStart={() => setStatus('loading')}
                onCanPlay={() => setStatus('ready')}
                onPlaying={() => setStatus('ready')}
                onError={() => setStatus('error')}
              />
            ) : (
              <img src={item.media.image} alt={item.title} className="relative h-full w-full object-contain" />
            )}
            {status === 'loading' && item.media.full && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="polite">
                <span className="h-12 w-12 rounded-full border-2 border-bone/20 border-t-vermilion [animation:spin_0.9s_linear_infinite]" />
                <span className="sr-only">Loading video</span>
              </span>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 grid place-items-center bg-obsidian/80 p-6 text-center" role="alert">
                <div>
                  <p className="font-semibold">This video didn't load.</p>
                  <p className="mt-1 text-sm text-mist">Check your connection and try again.</p>
                  <button onClick={() => setAttempt((a) => a + 1)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-obsidian">
                    <RotateCcw className="h-4 w-4" /> Try again
                  </button>
                </div>
              </div>
            )}
          </div>
          </figure>
          <aside className="w-full max-w-md pb-6 md:pb-0" aria-label="Project details">
            <p className="text-sm font-semibold text-vermilion">{categoryLabel(item.category)}</p>
            <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.02em]">{item.title}</h2>
            {item.brand && <p className="serif mt-1 text-2xl text-ember">{item.brand}</p>}
            <dl className="mt-7 grid grid-cols-2 gap-4 border-t hairline pt-6 text-sm">
              <div>
                <dt className="text-mist">Service</dt>
                <dd className="mt-1 font-semibold text-bone">{item.format}</dd>
              </div>
              <div>
                <dt className="text-mist">Division</dt>
                <dd className="mt-1 font-semibold text-bone">{item.category === 'software' ? 'TriWeb Software Company' : 'TriWeb Media Productions'}</dd>
              </div>
              {item.brand && (
                <div>
                  <dt className="text-mist">Client</dt>
                  <dd className="mt-1 font-semibold text-bone">{item.brand}</dd>
                </div>
              )}
              <div>
                <dt className="text-mist">Format</dt>
                <dd className="mt-1 font-semibold text-bone">{item.media.full ? 'Vertical video, full HD' : 'Image'}</dd>
              </div>
            </dl>
            {/* Optional write-up, shown only when real text is supplied in data/portfolio.js */}
            {item.summary && <p className="mt-6 leading-relaxed text-bone/80">{item.summary}</p>}
            {(item.challenge || item.solution || item.result) && (
              <dl className="mt-6 space-y-4 text-sm">
                {[
                  ['Challenge', item.challenge],
                  ['Solution', item.solution],
                  ['Result', item.result],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-semibold text-ember">{k}</dt>
                      <dd className="mt-1 leading-relaxed text-bone/80">{v}</dd>
                    </div>
                  ))}
              </dl>
            )}
            <button
              onClick={() => {
                onClose()
                navigate('contact')
              }}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-vermilion px-6 py-3.5 font-semibold text-bone shadow-[0_14px_40px_-12px_rgba(255,58,32,0.8)] transition hover:bg-ember"
            >
              Start a similar project
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            {many && (
              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-mist">More projects</p>
                  <span className="flex items-center gap-2">
                    <span className="mr-1 text-sm tabular-nums text-mist">
                      {index + 1} / {items.length}
                    </span>
                    <button onClick={() => go(-1)} aria-label="Previous project" className="grid h-10 w-10 place-items-center rounded-full border hairline transition hover:bg-bone hover:text-obsidian">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => go(1)} aria-label="Next project" className="grid h-10 w-10 place-items-center rounded-full border hairline transition hover:bg-bone hover:text-obsidian">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </span>
                </div>
                <ul className="mt-4 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((d) => {
                    const j = (index + d) % items.length
                    const it = items[j]
                    if (j === index) return null
                    return (
                      <li key={it.id}>
                        <button onClick={() => (setStatus('loading'), setIndex(j))} className="group block w-full text-left" aria-label={`Open ${it.title}`}>
                          <span className="block aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-bone/10">
                            <img src={it.media.posterSmall || it.media.poster || it.media.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          </span>
                          <span className="mt-2 block truncate text-xs text-mist group-hover:text-bone">{it.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </aside>
        </div>
      ) : (
      <div className="flex w-full max-w-6xl items-center justify-center gap-6">
          {many && (
            <button onClick={() => go(-1)} aria-label="Previous video" className={`${navBtn} hidden md:grid`}>
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <figure ref={frame} className="flex flex-col items-center gap-4">
            <div className="relative aspect-[9/16] h-[min(82dvh,calc((100vw-1.5rem)*16/9))] overflow-hidden rounded-2xl bg-night shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-bone/10">
              <img src={item.media.poster || item.media.image} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
              {item.media.full ? (
                <video
                  key={`${item.media.full}-${attempt}`}
                  src={item.media.full}
                  poster={item.media.poster}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="relative h-full w-full bg-black object-contain"
                  onLoadStart={() => setStatus('loading')}
                  onCanPlay={() => setStatus('ready')}
                  onPlaying={() => setStatus('ready')}
                  onError={() => setStatus('error')}
                />
              ) : (
                <img src={item.media.image} alt={item.title} className="relative h-full w-full object-contain" />
              )}
              {status === 'loading' && item.media.full && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="polite">
                  <span className="h-12 w-12 rounded-full border-2 border-bone/20 border-t-vermilion [animation:spin_0.9s_linear_infinite]" />
                  <span className="sr-only">Loading video</span>
                </span>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 grid place-items-center bg-obsidian/80 p-6 text-center" role="alert">
                  <div>
                    <p className="font-semibold">This video didn't load.</p>
                    <p className="mt-1 text-sm text-mist">Check your connection and try again.</p>
                    <button onClick={() => setAttempt((a) => a + 1)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-obsidian">
                      <RotateCcw className="h-4 w-4" /> Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
            <figcaption className="flex w-full items-center justify-between gap-4 text-sm">
              <span>
                <span className="block font-semibold text-bone">{item.title}</span>
                <span className="text-mist">{[item.brand, item.format].filter(Boolean).join(', ')}</span>
              </span>
              {many && (
                <span className="flex shrink-0 items-center gap-2">
                  <span className="mr-1 tabular-nums text-mist">
                    {index + 1} / {items.length}
                  </span>
                  <button onClick={() => go(-1)} aria-label="Previous video" className="grid h-10 w-10 place-items-center rounded-full border hairline md:hidden">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => go(1)} aria-label="Next video" className="grid h-10 w-10 place-items-center rounded-full border hairline md:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </span>
              )}
            </figcaption>
          </figure>
          {many && (
            <button onClick={() => go(1)} aria-label="Next video" className={`${navBtn} hidden md:grid`}>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
