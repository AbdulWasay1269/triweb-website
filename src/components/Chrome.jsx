import { useEffect, useRef, useState } from 'react'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { scrollToTop, scrollState, pageMax } from '../lib/scroll.js'
import { reducedMotion } from '../lib/motion.js'
import { site } from '../data/site.js'

export function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const onScroll = () => {
      const max = pageMax()
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
      <div ref={ref} className="h-full origin-left bg-gradient-to-r from-vermilion via-ember to-steel" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

export function BackToTop() {
  const [show, setShow] = useState(false)
  const ring = useRef(null)
  const C = 2 * Math.PI * 22
  useEffect(() => {
    const onScroll = () => {
      setShow(scrollY > innerHeight)
      const max = pageMax()
      if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - (max > 0 ? scrollY / max : 0)))
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [C])
  return (
    <button
      onClick={() => scrollToTop(false)}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      className={`glass group fixed bottom-5 right-5 z-40 grid place-items-center rounded-full transition-all duration-500 hover:scale-110 sm:bottom-7 sm:right-7 ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}
      style={{ width: 52, height: 52 }}
    >
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle ref={ring} cx="26" cy="26" r="22" fill="none" stroke="url(#btt)" strokeWidth="2" strokeDasharray={C} strokeDashoffset={C} strokeLinecap="round" />
        <defs>
          <linearGradient id="btt">
            <stop offset="0" stopColor="#ff3a20" />
            <stop offset="1" stopColor="#ff6a3d" />
          </linearGradient>
        </defs>
      </svg>
      <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
    </button>
  )
}

/** Appears only once a WhatsApp number is set in src/data/site.js */
export function WhatsAppButton() {
  const n = site.contact.whatsapp.replace(/\D/g, '')
  if (!n) return null
  return (
    <a
      href={`https://wa.me/${n}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with TriWeb Solutions on WhatsApp"
      className="fixed bottom-5 left-5 z-40 grid place-items-center rounded-full bg-[#25D366] text-obsidian shadow-[0_10px_40px_-10px_#25D366] transition hover:scale-110 sm:bottom-7 sm:left-7"
      style={{ width: 52, height: 52 }}
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] [animation:ping-ring_2s_ease-out_infinite]" aria-hidden="true" />
      <MessageCircle className="relative h-6 w-6" />
    </a>
  )
}

/** Edges of the screen darken briefly while scrolling fast, like motion in film. */
export function SpeedVignette() {
  const ref = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let v = 0
    const tick = () => {
      const target = Math.min(Math.abs(scrollState.velocity) / 60, 1)
      v += (target - v) * 0.12
      if (ref.current) ref.current.style.opacity = v.toFixed(3)
      raf = v > 0.003 || target > 0 ? requestAnimationFrame(tick) : 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="speed-vignette pointer-events-none fixed inset-0 z-[45]" aria-hidden="true" />
}
