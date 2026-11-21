import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from '../components/Button.jsx'
import { gsap, reducedMotion, isTouch, whenRevealed } from '../lib/motion.js'
import { scrollToTarget } from '../lib/scroll.js'

/**
 * Home hero: a cinematic opening shot.
 *
 * The 3D centrepiece (the TriWeb Gateway, in src/universe/stations/hero.js)
 * lives in the site's shared 3D world behind this section; this component
 * art-directs the words in front of it. The headline owns the left of the
 * frame, the sculpture the right; on phones the sculpture sits above the copy.
 */
export default function CinematicHero() {
  const root = useRef(null)

  // While the hero fills the screen, the site-wide readability shade steps
  // back so the opening shot is bright; it returns as you scroll on.
  useEffect(() => {
    const html = document.documentElement
    const io = new IntersectionObserver(([e]) => html.classList.toggle('hero-lit', e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.6] })
    io.observe(root.current)
    return () => {
      io.disconnect()
      html.classList.remove('hero-lit')
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    let offReveal = () => {}
    const ctx = gsap.context(() => {
      // Opening: label, then the headline line by line out of a mask,
      // a sweep of light across the second line, then copy and actions.
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      intro
        .from('.hero-label', { y: 18, opacity: 0, duration: 1.1 }, 0.15)
        .from('.hero-line-in', { yPercent: 115, rotateX: -35, opacity: 0, duration: 1.5, stagger: 0.16, transformOrigin: '50% 100%' }, 0.3)
        .fromTo('.hero-sheen', { backgroundPosition: '120% 0' }, { backgroundPosition: '-20% 0', duration: 2.4, ease: 'power2.inOut', clearProps: 'backgroundPosition' }, 0.9)
        .from('.hero-sub', { y: 24, opacity: 0, duration: 1.2 }, 0.95)
        .from('.hero-cta > *', { y: 22, opacity: 0, duration: 1.1, stagger: 0.1 }, 1.1)
        .from('.hero-foot', { opacity: 0, duration: 1.4 }, 1.5)
      offReveal = whenRevealed(() => intro.play())

      // Scrolling away: the copy drifts up and dims while the 3D camera
      // pulls through the sculpture toward the next scene.
      gsap.to('.hero-copy', {
        yPercent: -18,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
      })
      gsap.to('.hero-foot', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '25% top', scrub: true },
      })

      // The headline catches a little light from the cursor's direction
      if (!isTouch) {
        const h1 = root.current.querySelector('h1')
        const rx = gsap.quickTo(h1, 'rotateX', { duration: 1, ease: 'power3.out' })
        const ry = gsap.quickTo(h1, 'rotateY', { duration: 1, ease: 'power3.out' })
        const onMove = (e) => {
          const nx = e.clientX / innerWidth - 0.5
          const ny = e.clientY / innerHeight - 0.5
          ry(nx * 5)
          rx(-ny * 4)
          h1.style.setProperty('--lx', `${50 + nx * 60}%`)
        }
        addEventListener('pointermove', onMove, { passive: true })
        return () => removeEventListener('pointermove', onMove)
      }
    }, root.current)
    return () => {
      offReveal()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={root} className="hero-cine relative isolate flex min-h-[100svh] items-end overflow-hidden pb-24 pt-32 md:items-center md:pb-24" aria-labelledby="hero-title">
      {/* Readability: the copy side of the frame is gently darkened, the sculpture side is left clear */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(11,18,32,0.9)_0%,rgba(11,18,32,0.6)_42%,rgba(11,18,32,0)_62%)] md:bg-[linear-gradient(90deg,rgba(11,18,32,0.62)_0%,rgba(11,18,32,0.38)_30%,rgba(11,18,32,0)_54%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-obsidian" aria-hidden="true" />
      {/* Shown only when the 3D scene can't run: a still of the sculpture */}
      <div
        className="hero-still pointer-events-none absolute inset-0 -z-20 hidden bg-cover bg-center"
        aria-hidden="true"
      />

      <div className="container-x relative w-full">
        <div className="hero-copy max-w-[40rem] [perspective:900px]">
          <p className="hero-label label text-vermilion">
            <i aria-hidden="true" />
            <span className="text-bone/90">Three minds. One mission. Limitless impact.</span>
          </p>
          <h1
            id="hero-title"
            className="mt-5 text-[clamp(2.5rem,6.1vw,6rem)] md:mt-7 leading-[0.95] tracking-[-0.045em] [transform-style:preserve-3d] [text-shadow:0_14px_50px_rgba(0,0,0,0.55)]"
          >
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line-in block font-bold text-bone">We build brands.</span>
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <span className="hero-line-in hero-sheen block font-extralight">We engineer the future.</span>
            </span>
          </h1>
          <p className="hero-sub mt-5 max-w-[33rem] text-[clamp(0.98rem,1.2vw,1.16rem)] md:mt-7 leading-relaxed text-bone/80">
            Two specialised divisions under one roof: <strong className="font-semibold text-bone">Media Production</strong> for brands, campaigns and film, and{' '}
            <strong className="font-semibold text-bone">Software &amp; AI Solutions</strong> for websites, systems and automation.
          </p>
          <div className="hero-cta mt-7 flex flex-col gap-3 sm:flex-row md:mt-9">
            <Button to="media" variant="warm" size="lg">
              Explore Media Productions
            </Button>
            <Button to="software" variant="ghost" size="lg">
              Explore Software Solutions
            </Button>
          </div>
        </div>
      </div>

      <div className="hero-foot absolute inset-x-0 bottom-7 z-[2]">
        <div className="container-x flex items-end justify-between">
          <button
            onClick={() => scrollToTarget('#home-marquee', { offset: 0 })}
            className="group flex items-center gap-3 text-sm text-bone/75 transition-colors hover:text-bone"
            aria-label="Scroll to explore"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-bone/25 transition group-hover:ring-vermilion">
              <ChevronDown className="h-4 w-4 [animation:float-y_1.6s_ease-in-out_infinite]" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">Scroll to explore</span>
          </button>
          <p className="hidden text-right text-sm text-bone/60 md:block">
            <span className="text-bone/85">Media Production</span>
            <span className="mx-3 inline-block h-px w-8 translate-y-[-4px] bg-vermilion/70 align-middle" aria-hidden="true" />
            <span className="text-bone/85">Software &amp; AI</span>
          </p>
        </div>
      </div>
    </section>
  )
}
