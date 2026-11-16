import { useEffect, useMemo, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from '../components/Button.jsx'
import { gsap, isTouch, reducedMotion, isSmallScreen, whenRevealed } from '../lib/motion.js'
import { scrollToTarget } from '../lib/scroll.js'

/* ------------------------------------------------------------------
   Procedural mountain ridges (midpoint displacement), seeded so the
   landscape is identical on every visit.
------------------------------------------------------------------- */
function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function ridgePath({ seed, w = 1600, h = 600, base, amp, sides = 0, freq = 1, n = 160 }) {
  const r = rng(seed)
  const ph = [r() * 10, r() * 10, r() * 10, r() * 10]
  const ridge = (t) => 1 - Math.abs(Math.sin(t)) // sharp peaks, rounded valleys
  const pts = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const v = 0.55 * ridge(u * Math.PI * 2.1 * freq + ph[0]) + 0.3 * ridge(u * Math.PI * 5.2 * freq + ph[1]) + 0.15 * ridge(u * Math.PI * 11.5 * freq + ph[2]) + 0.04 * Math.sin(u * 90 + ph[3])
    const edge = Math.pow(Math.abs(u - 0.5) * 2, 2.4) // 0 in the centre, 1 at the edges
    const y = base - amp * v - sides * edge
    pts.push([u * w, Math.max(8, Math.min(h, y))])
  }
  return `M0 ${h} ` + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ` L${w} ${h} Z`
}

export function Ridge({ className, style, d, fill, id, glow }) {
  return (
    <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill[0]} />
          <stop offset="1" stopColor={fill[1]} />
        </linearGradient>
        {glow && (
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={glow} stopOpacity="0.55" />
            <stop offset="0.06" stopColor={glow} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {glow && <path d={d} fill={`url(#${id}-rim)`} />}
    </svg>
  )
}

/**
 * Home hero: a cinematic world in layers. Scrolling moves each layer at its
 * own speed: the sky and portal drift back, the headline sinks behind the
 * mountains and the foreground cliffs rise to fill the screen.
 */
export default function LayeredHero() {
  const root = useRef(null)
  const paths = useMemo(
    () => ({
      far: ridgePath({ seed: 11, base: 380, amp: 230, sides: 40, freq: 1.1 }),
      mid: ridgePath({ seed: 23, base: 430, amp: 190, sides: 110, freq: 0.9 }),
      near: ridgePath({ seed: 37, base: 500, amp: 150, sides: 230, freq: 1.2 }),
      front: ridgePath({ seed: 51, base: 575, amp: 110, sides: 420, freq: 0.8 }),
    }),
    [],
  )
  const stars = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 90 }, () => ({ x: r() * 100, y: r() * 55, s: 0.6 + r() * 1.8, d: r() * 4 }))
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    let offReveal = () => {}
    const ctx = gsap.context(() => {
      const small = isSmallScreen()
      gsap.set('.lh-portal', { yPercent: -50 })
      // Intro (uses px "y"; the scroll timeline uses "yPercent", so they never fight)
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true })
      intro
        .from('.lh-sky', { opacity: 0, duration: 1.6 })
        .from('.lh-portal-in', { y: 160, opacity: 0, scale: 0.6, duration: 2.2 }, 0.1)
        .from('.lh-far', { y: 140, duration: 2 }, 0.15)
        .from('.lh-mid', { y: 200, duration: 2 }, 0.22)
        .from('.lh-near', { y: 260, duration: 2 }, 0.3)
        .from('.lh-front', { y: 320, duration: 2 }, 0.36)
        .from('.lh-copy > *', { y: 40, opacity: 0, duration: 1.4, stagger: 0.12 }, 0.55)
      offReveal = whenRevealed(() => intro.play())

      // Scroll: pinned, every layer travels at its own speed
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: small ? '+=70%' : '+=110%', pin: true, scrub: 0.6, anticipatePin: 1 },
      })
      tl.to('.lh-sky', { yPercent: 8, scale: 1.08 }, 0)
        .to('.lh-portal', { yPercent: -160, scale: 1.5 }, 0)
        .to('.lh-beam', { opacity: 0.2, scaleY: 1.4 }, 0)
        .to('.lh-far', { yPercent: 6 }, 0)
        .to('.lh-mid', { yPercent: -4, scale: 1.05 }, 0)
        .to('.lh-copy', { yPercent: small ? 55 : 75, scale: 0.92, opacity: 0 }, 0)
        .to('.lh-near', { yPercent: -16, scale: 1.12 }, 0)
        .to('.lh-front', { yPercent: -38, scale: 1.3 }, 0)
        .to('.lh-fog', { yPercent: -30, opacity: 0.9 }, 0)
        .to('.lh-shade', { opacity: 0.75 }, 0.55)

      // Pointer parallax: nearer layers move further
      if (!isTouch) {
        const layers = [
          ['.lh-sky', 6],
          ['.lh-portal', -10],
          ['.lh-far', 10],
          ['.lh-mid', 18],
          ['.lh-near', 28],
          ['.lh-front', 42],
        ].map(([sel, amt]) => [gsap.quickTo(sel, 'x', { duration: 1.2, ease: 'power3.out' }), amt])
        const light = root.current.querySelector('.lh-light')
        const lx = gsap.quickTo(light, 'x', { duration: 0.6, ease: 'power3.out' })
        const ly = gsap.quickTo(light, 'y', { duration: 0.6, ease: 'power3.out' })
        const onMove = (e) => {
          const nx = e.clientX / innerWidth - 0.5
          layers.forEach(([to, amt]) => to(-nx * amt))
          lx(e.clientX - 380)
          ly(e.clientY - 380)
          light.style.opacity = '1'
        }
        addEventListener('pointermove', onMove)
        return () => removeEventListener('pointermove', onMove)
      }
    }, root.current)
    return () => {
      offReveal()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={root} data-occlude className="relative h-[100svh] min-h-[620px] overflow-hidden" aria-labelledby="hero-title">
      {/* Sky */}
      <div className="lh-sky absolute inset-0 origin-bottom bg-[linear-gradient(180deg,#060a14_0%,#0b1220_30%,#1d2442_52%,#5a2636_70%,#c2341f_86%,#ff7a45_100%)]">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-bone"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: 0.6, animation: `pulse-dot ${2 + s.d}s ease-in-out ${s.d}s infinite` }}
          />
        ))}
      </div>

      {/* Portal: a vermilion sun rising behind the mountains */}
      <div className="pointer-events-none absolute inset-x-0 top-[68%] flex justify-center" aria-hidden="true">
        <div className="lh-portal relative" style={{ transform: 'translateY(-50%)' }}>
          <div className="lh-portal-in relative">
            <div className="absolute left-1/2 top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,58,32,0.7),rgba(255,122,69,0.25)_45%,transparent)] blur-2xl" />
            <div className="lh-beam absolute left-1/2 top-1/2 h-[120vh] w-24 -translate-x-1/2 origin-top bg-[linear-gradient(180deg,rgba(255,214,170,0.55),transparent_70%)] blur-xl" />
            <div className="relative h-[15vmin] w-[15vmin] rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff3e6_0%,#ffc2a6_30%,#ff7a45_62%,#ff3a20_100%)] shadow-[0_0_80px_30px_rgba(255,90,40,0.55)] [animation:float-y_6s_ease-in-out_infinite]" />
            {/* Anamorphic lens streak */}
            <div className="absolute left-1/2 top-1/2 h-[3px] w-[140vw] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,170,130,0.55)_35%,rgba(255,240,225,0.9)_50%,rgba(255,170,130,0.55)_65%,transparent)] blur-[1.5px]" />
          </div>
        </div>
      </div>

      {/* Far + mid ridges */}
      <Ridge id="r-far" className="lh-far absolute inset-x-[-4%] bottom-0 h-[62%] w-[108%] origin-bottom" d={paths.far} fill={['#33304f', '#1b2238']} glow="#ff7a45" />
      <div className="lh-fog pointer-events-none absolute inset-x-0 bottom-[22%] h-[26%] bg-[radial-gradient(60%_60%_at_50%_60%,rgba(255,140,110,0.28),transparent)] blur-2xl" aria-hidden="true" />
      <Ridge id="r-mid" className="lh-mid absolute inset-x-[-4%] bottom-0 h-[48%] w-[108%] origin-bottom" d={paths.mid} fill={['#1f2440', '#121a2e']} glow="#ff3a20" />

      {/* Headline sits between the layers */}
      <div className="lh-copy absolute inset-x-0 top-[17%] z-[1] px-5 text-center md:top-[15%]">
        <p className="label mx-auto text-vermilion">
          <i aria-hidden="true" />
          <span className="text-bone/90">Three minds. One mission. Limitless impact.</span>
        </p>
        <h1 id="hero-title" className="mx-auto mt-6 max-w-5xl text-[clamp(2.8rem,7.6vw,6.8rem)] leading-[0.95] tracking-[-0.045em] text-bone [text-shadow:0_10px_60px_rgba(0,0,0,0.55)]">
          <span className="font-bold">We build brands.</span>
          <br />
          <span className="font-extralight text-[#ffd2bd]">We engineer the future.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-bone/85">
          From powerful visual storytelling to intelligent digital infrastructure, we help ambitious businesses build, grow, and scale.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button to="media" variant="warm" size="lg">
            Explore Media Productions
          </Button>
          <Button to="software" variant="ghost" size="lg">
            Explore Software Solutions
          </Button>
        </div>
      </div>

      {/* Warm light that follows the cursor across the mountains */}
      <div className="lh-light pointer-events-none absolute left-0 top-0 z-[2] h-[760px] w-[760px] opacity-0 transition-opacity duration-700 will-change-transform" style={{ background: 'radial-gradient(closest-side, rgba(255,90,40,0.28), transparent)' }} aria-hidden="true" />

      {/* Near + front ridges rise over the headline */}
      <Ridge id="r-near" className="lh-near pointer-events-none absolute inset-x-[-5%] bottom-0 z-[2] h-[34%] w-[110%] origin-bottom" d={paths.near} fill={['#131b30', '#0b1220']} glow="#ff3a20" />
      <Ridge id="r-front" className="lh-front pointer-events-none absolute inset-x-[-6%] bottom-[-2%] z-[3] h-[30%] w-[112%] origin-bottom" d={paths.front} fill={['#0b1220', '#070c17']} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-b from-transparent to-obsidian" aria-hidden="true" />
      <div className="lh-shade pointer-events-none absolute inset-0 z-[4] bg-obsidian opacity-0" aria-hidden="true" />

      <button
        onClick={() => scrollToTarget('#home-marquee', { offset: 0 })}
        className="group absolute bottom-6 left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center gap-2 text-sm text-bone/80 transition-colors hover:text-bone"
        aria-label="Scroll to explore"
      >
        <span className="text-xs tracking-wide">Scroll to explore</span>
        <ChevronDown className="h-5 w-5 [animation:float-y_1.6s_ease-in-out_infinite]" aria-hidden="true" />
      </button>
    </section>
  )
}

/**
 * The same mountain horizon, used at the foot of every inner page header so
 * all pages share one cinematic world. Layers drift at different speeds.
 */
export function PageHorizon() {
  const paths = useMemo(
    () => ({
      far: ridgePath({ seed: 19, base: 420, amp: 200, sides: 60, freq: 1.2 }),
      mid: ridgePath({ seed: 29, base: 470, amp: 160, sides: 120, freq: 1 }),
      near: ridgePath({ seed: 41, base: 540, amp: 110, sides: 200, freq: 1.3 }),
    }),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[62%]" aria-hidden="true">
      <div className="absolute bottom-[18%] left-1/2 h-[46vmin] w-[90vmin] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,90,40,0.5),rgba(255,58,32,0.18)_55%,transparent)] blur-2xl" data-parallax="0.35" />
      <div className="absolute bottom-[34%] left-1/2 h-[2px] w-[120vw] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,170,130,0.5)_40%,rgba(255,235,220,0.8)_50%,rgba(255,170,130,0.5)_60%,transparent)] blur-[1px]" data-parallax="0.35" />
      <div className="absolute inset-x-0 bottom-0 h-full" data-parallax="0.25">
        <Ridge id="ph-far" className="absolute inset-x-[-4%] bottom-0 h-[80%] w-[108%] opacity-90" d={paths.far} fill={['#2c2a48', '#171f35']} glow="#ff7a45" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-full" data-parallax="0.12">
        <Ridge id="ph-mid" className="absolute inset-x-[-4%] bottom-0 h-[60%] w-[108%]" d={paths.mid} fill={['#1b2139', '#111a2e']} glow="#ff3a20" />
      </div>
      <Ridge id="ph-near" className="absolute inset-x-[-5%] bottom-0 h-[38%] w-[110%]" d={paths.near} fill={['#111a2e', '#0b1220']} glow="#ff3a20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-obsidian" />
    </div>
  )
}
