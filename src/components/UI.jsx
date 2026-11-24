import { useEffect, useRef } from 'react'
import { tiltHandlers } from '../lib/motion.js'
import { PageHorizon, NeonHorizon, NeonRidges, WaveHorizon } from '../blocks/LayeredHero.jsx'

import Button from './Button.jsx'

const tones = { warm: 'text-vermilion', cool: 'text-ice', uv: 'text-steel', gel: 'text-ember', bone: 'text-bone' }

/** Small pill label above a heading. */
export function Label({ tone = 'warm', children }) {
  return (
    <span className={`label ${tones[tone]}`}>
      <i aria-hidden="true" />
      <span className="text-bone/90">{children}</span>
    </span>
  )
}

/** Standard section header: label, title, optional description. */
export function SectionHeader({ label, tone, title, children, align = 'left', id, className = '' }) {
  const center = align === 'center'
  return (
    <header data-depth className={`${center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      {label && (
        <div data-reveal>
          <Label tone={tone}>{label}</Label>
        </div>
      )}
      <h2 id={id} data-split className="h-section mt-5">
        {title}
      </h2>
      {children && (
        <p data-reveal data-delay="0.1" className={`lead mt-5 ${center ? 'mx-auto' : ''} max-w-2xl`}>
          {children}
        </p>
      )}
    </header>
  )
}

/**
 * Card with 3D tilt, cursor-following spotlight border and soft glare.
 * `spot` sets the spotlight colour.
 */
export function TiltCard({ as: Tag = 'div', className = '', spot, children, max, division, ...rest }) {
  return (
    <Tag
      className={`card spotlight lift [transform-style:preserve-3d] will-change-transform ${division ? `div-${division}` : ''} ${className}`}
      style={spot ? { '--spot': spot } : undefined}
      {...tiltHandlers({ max })}
      {...rest}
    >
      {division && <span className="div-mark" aria-hidden="true" />}
      {children}
      <span className="sheen" aria-hidden="true" />
      <span className="beam" aria-hidden="true" />
    </Tag>
  )
}

/** Infinite text band; direction and speed set by props. */
export function Marquee({ items, reverse = false, speed = 40, className = '' }) {
  const row = (aria) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={aria}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span>{t}</span>
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-vermilion" aria-hidden="true">
            <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  )
  return (
    <div className={`flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] ${className}`}>
      <div className="flex w-max" style={{ animation: `marquee ${speed}s linear infinite ${reverse ? 'reverse' : ''}` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

/** Closing call-to-action shown at the end of most pages. */
export function CTA() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-28" aria-labelledby="cta-title">
      {/* The 3D finale (a vermilion star) burns behind this section; these
          layers only keep the words readable over its brightest core. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(46%_30%_at_50%_42%,rgba(11,18,32,0.55),transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-obsidian/80 to-transparent" aria-hidden="true" />
      <span className="tri-watermark pointer-events-none absolute -bottom-[4%] left-1/2 -z-[5] -translate-x-1/2 text-[30vw] !text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.1)]" aria-hidden="true">
        tri
      </span>
      <div className="container-x text-center">
        <p data-reveal className="text-[clamp(1.05rem,1.6vw,1.3rem)] font-semibold text-ember">
          Ready to build & scale your brand?
        </p>
        <h2 id="cta-title" data-split className="mx-auto mt-5 max-w-5xl text-[clamp(2.6rem,7vw,6.4rem)] font-extrabold leading-[0.98] tracking-[-0.045em] [text-shadow:0_20px_60px_rgba(0,0,0,0.5)]">
          Have an idea? <span className="serif text-gradient">Let's build something extraordinary.</span>
        </h2>
        <p data-reveal className="mx-auto mt-7 max-w-xl text-lg text-bone/80">
          Tell us what you're planning. We'll reply with how Media Productions and Software Company can bring it to life.
        </p>
        <div data-reveal data-delay="0.15" className="mt-11 flex justify-center">
          <span className="relative inline-flex">
            <span className="pointer-events-none absolute -inset-3 rounded-full bg-vermilion/40 blur-2xl [animation:cta-breathe_3.2s_ease-in-out_infinite]" aria-hidden="true" />
            <Button to="contact" size="lg">
              Start your project
            </Button>
          </span>
        </div>
      </div>
    </section>
  )
}

/** Hero block used at the top of every inner page. */
export function PageHero({ label, tone = 'warm', title, children, aside, actions, lit = false, horizon = 'ridges' }) {
  const ref = useRef(null)
  // `lit` (used by the About page): while this header fills the screen, the
  // site-wide readability shade steps back so the 3D twilight sky shows.
  useEffect(() => {
    if (!lit) return
    const html = document.documentElement
    const io = new IntersectionObserver(([e]) => html.classList.toggle('hero-lit', e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.6] })
    io.observe(ref.current)
    return () => {
      io.disconnect()
      html.classList.remove('hero-lit')
    }
  }, [lit])
  return (
    <section ref={ref} className="relative isolate flex min-h-[88svh] items-center overflow-hidden pb-40 pt-36 md:pb-48 md:pt-40">
      <span data-parallax="0.25" className="tri-watermark pointer-events-none absolute -right-[4vw] top-[8%] -z-10 hidden text-[34vw] md:block" aria-hidden="true">
        tri
      </span>
      {horizon === 'neon' ? <NeonHorizon /> : horizon === 'wave' ? <WaveHorizon /> : horizon === 'mountains' ? <PageHorizon /> : <NeonRidges />}
      {/* Neon header: a soft shade behind the text column, over the lit city */}
      {horizon === 'neon' && <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_45%_at_40%_40%,rgba(11,18,32,0.7),rgba(11,18,32,0.3)_70%,rgba(11,18,32,0)_100%)] md:bg-[linear-gradient(90deg,rgba(11,18,32,0.72)_0%,rgba(11,18,32,0.45)_34%,rgba(11,18,32,0)_58%)]" aria-hidden="true" />}
      {/* Lit headers on phones: a soft shade behind the copy, which sits over the glowing sky */}
      {lit && <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(85%_32%_at_45%_36%,rgba(11,18,32,0.72),rgba(11,18,32,0.35)_70%,rgba(11,18,32,0)_100%)] md:hidden" aria-hidden="true" />}
      {/* ...and on larger screens, the same soft shade behind the text column the home hero uses */}
      {lit && <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(11,18,32,0.66)_0%,rgba(11,18,32,0.42)_32%,rgba(11,18,32,0)_56%)] md:block" aria-hidden="true" />}
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div data-reveal>
            <Label tone={tone}>{label}</Label>
          </div>
          <h1 data-split className="h-page mt-6">
            {title}
          </h1>
          {children && (
            <p data-reveal data-delay="0.15" className="lead mt-6 max-w-xl">
              {children}
            </p>
          )}
          {actions && (
            <div data-reveal data-delay="0.25" className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions}
            </div>
          )}
        </div>
        {aside && <div className="relative">{aside}</div>}
      </div>
    </section>
  )
}
