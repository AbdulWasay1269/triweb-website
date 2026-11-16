import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import Reel from '../components/Reel.jsx'
import { useLightbox } from '../components/Lightbox.jsx'
import { gsap, isTouch, reducedMotion } from '../lib/motion.js'
import { portfolio } from '../data/portfolio.js'

/**
 * Three reels standing on the points of a triangle, revolving like a display
 * stand. Front reel plays; click any reel to watch it in HD with sound.
 */
export default function TriReel({ items }) {
  const stage = useRef(null)
  const spinner = useRef(null)
  const cards = useRef([])
  const [front, setFront] = useState(0)
  const { open } = useLightbox()

  useEffect(() => {
    const rot = { y: 0 }
    let r = (stage.current?.offsetWidth || 300) * 0.34
    const apply = () => {
      if (!spinner.current) return
      let best = 0
      let bestCos = -2
      cards.current.forEach((c, i) => {
        if (!c) return
        const world = i * 120 - rot.y
        c.style.transform = `translate(-50%, -50%) rotateY(${world}deg) translateZ(${r}px) rotateY(${-world * 0.85}deg)`
        const cos = Math.cos((world * Math.PI) / 180)
        c.style.filter = `brightness(${0.4 + 0.6 * ((cos + 1) / 2)})`
        c.style.zIndex = String(Math.round((cos + 1) * 10))
        if (cos > bestCos) {
          bestCos = cos
          best = i
        }
      })
      setFront((f) => (f === best ? f : best))
    }
    const ro = new ResizeObserver(() => {
      r = (stage.current?.offsetWidth || 300) * 0.34
      apply()
    })
    ro.observe(stage.current)

    let spin
    if (reducedMotion) apply()
    else {
      spin = gsap.timeline({ repeat: -1, onUpdate: apply })
      for (let k = 1; k <= 3; k++) spin.to(rot, { y: k * 120, duration: 1.5, ease: 'expo.inOut' }, '+=3')
      apply()
    }
    let onMove
    if (!isTouch && !reducedMotion) {
      const rx = gsap.quickTo(stage.current, 'rotationX', { duration: 1, ease: 'power3.out' })
      const ry = gsap.quickTo(stage.current, 'rotationY', { duration: 1, ease: 'power3.out' })
      onMove = (e) => {
        rx((e.clientY / innerHeight - 0.5) * -12)
        ry((e.clientX / innerWidth - 0.5) * 16)
      }
      addEventListener('pointermove', onMove)
    }
    return () => {
      spin?.kill()
      ro.disconnect()
      if (onMove) removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px] [perspective:1400px]">
      <div ref={stage} className="absolute inset-0 [transform-style:preserve-3d]">
        <div ref={spinner} className="absolute inset-0 [transform-style:preserve-3d]">
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => (cards.current[i] = el)}
              onClick={() => open(portfolio, Math.max(0, portfolio.findIndex((p) => p.id === item.id)))}
              className="group absolute left-1/2 top-1/2 aspect-[9/16] w-[44%] overflow-hidden rounded-[1.4rem] bg-night shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95)] ring-1 ring-bone/15 [backface-visibility:hidden]"
              aria-label={`Play ${item.caption} video`}
              data-cursor="Play"
              tabIndex={front === i ? 0 : -1}
            >
              <Reel media={item.media} mode="manual" active={front === i} priority />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/95 via-obsidian/40 to-transparent p-4 pt-16 text-left">
                <span className="serif block text-xl leading-tight text-bone">{item.caption}</span>
              </span>
              <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-bone/90 text-obsidian opacity-0 transition-all duration-300 group-hover:opacity-100">
                <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
              </span>
              <span className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            </button>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-4 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,106,61,0.4),rgba(255,58,32,0.15),transparent)] blur-xl" aria-hidden="true" />
    </div>
  )
}
