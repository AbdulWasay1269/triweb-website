import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import Reel from '../components/Reel.jsx'
import { useLightbox } from '../components/Lightbox.jsx'
import { gsap, ScrollTrigger, reducedMotion, isTouch } from '../lib/motion.js'

/**
 * Scroll into the film (inspired by the "Vela" style). A reel starts as a
 * small card between two giant words. As you scroll, the words slide apart
 * and the card opens into a full-screen triptych of three vertical reels,
 * each shown close to its native 9:16 shape so nothing is stretched.
 * Phones get a single full-screen reel.
 */
export function ExpandReel({ items, left, right, caption, sub, tone = 'text-vermilion' }) {
  const root = useRef(null)
  const { open } = useLightbox()
  const [l, c, r] = items

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const frame = root.current.querySelector('.er-frame')
      const box = () => {
        const w = Math.min(innerWidth * (innerWidth < 640 ? 0.5 : 0.26), 320, innerHeight * 0.62 * (9 / 16))
        const h = (w * 16) / 9
        return { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2 }
      }
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          invalidateOnRefresh: true,
          // Once the film fills the screen, let the background stop drawing
          onUpdate: (self) => frame.toggleAttribute('data-occlude', self.progress > 0.8),
          onLeave: () => frame.removeAttribute('data-occlude'),
          onLeaveBack: () => frame.removeAttribute('data-occlude'),
        },
      })
      tl.fromTo('.er-frame', { clipPath: () => `inset(${box().y}px ${box().x}px ${box().y}px ${box().x}px round 28px)` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1 }, 0)
        .fromTo('.er-side-l', { xPercent: 30, opacity: 0.2 }, { xPercent: 0, opacity: 1, duration: 0.9 }, 0.05)
        .fromTo('.er-side-r', { xPercent: -30, opacity: 0.2 }, { xPercent: 0, opacity: 1, duration: 0.9 }, 0.05)
        .fromTo('.er-center', { scale: 1.12 }, { scale: 1, duration: 1 }, 0)
        .fromTo('.er-left', { xPercent: 0 }, { xPercent: -130, opacity: 0, duration: 0.7 }, 0)
        .fromTo('.er-right', { xPercent: 0 }, { xPercent: 130, opacity: 0, duration: 0.7 }, 0)
        .fromTo('.er-shade', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.72)
        .fromTo('.er-caption > *', { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.25 }, 0.78)
    }, root.current)
    return () => ctx.revert()
  }, [])

  const panel = 'relative overflow-hidden'
  return (
    <section ref={root} className={`relative ${reducedMotion ? '' : 'h-[280vh]'}`} aria-label={caption}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Giant words */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between px-[3vw] py-[13vh] sm:flex-row sm:py-0" aria-hidden="true">
          <span className="er-left text-[clamp(3rem,11vw,11rem)] font-extrabold leading-none tracking-[-0.05em] text-bone">{left}</span>
          <span className={`er-right serif text-[clamp(3rem,11vw,11rem)] leading-none ${tone}`}>{right}</span>
        </div>
        {/* Film: triptych */}
        <div className="er-frame absolute inset-0 bg-obsidian" style={reducedMotion ? { clipPath: 'inset(6% 8% round 28px)' } : undefined}>
          <div className="absolute inset-0 grid grid-cols-1 gap-1.5 md:grid-cols-3">
            <div className={`er-side-l ${panel} hidden md:block`}>
              <Reel media={l.media} />
            </div>
            <div className={`er-center ${panel}`}>
              <Reel media={c.media} priority />
            </div>
            <div className={`er-side-r ${panel} hidden md:block`}>
              <Reel media={r.media} />
            </div>
          </div>
          <div className="er-shade absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-obsidian/5 opacity-0" />
          <div className="er-caption absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 sm:p-12 md:p-16">
            <p className="max-w-3xl text-[clamp(2rem,5vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">{caption}</p>
            {sub && <p className="lead max-w-xl !text-bone/85">{sub}</p>}
            <button onClick={() => open(items, 1)} className="group mt-2 inline-flex items-center gap-3 rounded-full bg-bone py-2 pl-2 pr-6 font-semibold text-obsidian transition hover:bg-vermilion">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-obsidian text-bone transition-transform duration-500 group-hover:scale-110">
                <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
              </span>
              Watch with sound
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Giant kinetic typography (inspired by lenis.dev): huge words slide in
 * opposite directions as you scroll and lean with your scroll speed.
 */
/**
 * Movie-title sequence: the section pins and its words play one at a time.
 * Each word rises out of depth letter by letter, lands under a soft light,
 * holds while its caption appears, then drifts toward the viewer and fades
 * as the next one arrives. Scrolling drives the timing.
 */
export function GiantType({ lines }) {
  const root = useRef(null)
  const stage = useRef(null)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray('.ts-word')
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top 75%',
          end: 'bottom bottom',
          scrub: 0.9,
          onUpdate: (self) => setActive(Math.min(words.length - 1, Math.floor(self.progress * words.length))),
        },
      })
      words.forEach((w, i) => {
        const chars = w.querySelectorAll('.ts-ch')
        const inner = w.querySelector('.ts-inner')
        const cap = w.querySelector('.ts-cap')
        const glow = w.querySelector('.ts-glow')
        const at = i * 3
        gsap.set(w, { autoAlpha: 1 })
        if (!chars.length) tl.fromTo(inner, { opacity: 0, rotateX: -70, z: -300 }, { opacity: 1, rotateX: 0, z: 0, duration: 1.2 }, at)
        if (chars.length) tl.fromTo(chars, { opacity: 0, rotateX: -95, z: -260, yPercent: 35 }, { opacity: 1, rotateX: 0, z: 0, yPercent: 0, duration: 1.1, stagger: 0.06 }, at)
        tl.fromTo(inner, { scale: 0.86, letterSpacing: '0.06em' }, { scale: 1, letterSpacing: '-0.055em', duration: 1.4, ease: 'power2.out' }, at)
          .fromTo(glow, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2 }, at + 0.3)
          .fromTo(cap, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, at + 0.9)
        if (i < words.length - 1) {
          tl.to(inner, { z: 420, rotateX: 14, opacity: 0, duration: 1, ease: 'power2.in' }, at + 2.3)
            .to(cap, { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' }, at + 2.3)
            .to(glow, { opacity: 0, duration: 0.8, ease: 'power2.in' }, at + 2.4)
        } else {
          tl.to({}, { duration: 1 })
        }
      })
      // The stage turns a few degrees toward the cursor, so the words feel lit in 3D
      if (!isTouch) {
        const rx = gsap.quickTo(stage.current, 'rotateX', { duration: 0.9, ease: 'power3.out' })
        const ry = gsap.quickTo(stage.current, 'rotateY', { duration: 0.9, ease: 'power3.out' })
        const onMove = (e) => {
          ry((e.clientX / innerWidth - 0.5) * 8)
          rx((0.5 - e.clientY / innerHeight) * 5)
        }
        root.current.addEventListener('pointermove', onMove)
        return () => root.current?.removeEventListener('pointermove', onMove)
      }
    }, root.current)
    return () => ctx.revert()
  }, [])

  const wordClass = (l) =>
    l.style === 'outline'
      ? 'font-extrabold text-transparent [-webkit-text-stroke:2px_rgba(245,243,239,0.75)]'
      : l.style === 'serif'
        ? 'serif text-gradient'
        : 'font-extrabold text-bone'

  if (reducedMotion) {
    return (
      <section ref={root} data-title-sequence className="section text-center" aria-label={lines.map((l) => l.text).join(' ')}>
        {lines.map((l) => (
          <div key={l.text} className="py-6">
            <p className={`gt-line text-[clamp(3.4rem,14vw,11rem)] leading-none tracking-[-0.055em] ${wordClass(l)}`}>{l.text}</p>
            {l.caption && <p className="mt-3 text-lg text-mist">{l.caption}</p>}
          </div>
        ))}
      </section>
    )
  }

  return (
    <section ref={root} data-title-sequence className="relative" style={{ height: `${lines.length * 95 + 40}svh` }} aria-label={lines.map((l) => l.text).join(' ')}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden [perspective:1100px]">
        <div ref={stage} className="relative h-full w-full [transform-style:preserve-3d]">
          {lines.map((l, i) => (
            <div key={l.text} className="ts-word gt-line invisible absolute inset-0 flex flex-col items-center justify-center px-4 text-center [transform-style:preserve-3d]" aria-hidden="true">
              <span className="ts-glow pointer-events-none absolute left-1/2 top-1/2 h-[42vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,58,32,0.22),transparent)]" />
              <span
                className={`ts-inner relative inline-block whitespace-nowrap text-[clamp(3.6rem,17vw,15rem)] leading-[0.95] tracking-[-0.055em] [transform-style:preserve-3d] ${wordClass(l)}`}
                style={{ textShadow: l.style === 'outline' ? 'none' : '0 28px 70px rgba(0,0,0,0.55)' }}
              >
                {l.style === 'serif'
                  ? l.text
                  : [...l.text].map((ch, j) => (
                      <span key={j} className="ts-ch inline-block [backface-visibility:hidden] [transform-origin:50%_100%_-30px]">
                        {ch}
                      </span>
                    ))}
              </span>
              {l.caption && <p className="ts-cap relative mt-5 max-w-xl text-base text-bone/80 sm:text-lg">{l.caption}</p>}
            </div>
          ))}
        </div>
        {/* Which title is on screen */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden="true">
          {lines.map((l, i) => (
            <span key={l.text} className={`h-1 rounded-full transition-all duration-500 ${i === active ? 'w-10 bg-vermilion' : 'w-4 bg-bone/25'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
