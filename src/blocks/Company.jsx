import { useEffect, useRef, useState } from 'react'
import { Orbit, Globe2, Puzzle, Search, Compass, Hammer, Rocket, TrendingUp, Clapperboard, Cpu, Check } from 'lucide-react'
import { SectionHeader, TiltCard } from '../components/UI.jsx'
import Button from '../components/Button.jsx'
import Reel from '../components/Reel.jsx'
import { LogoIcon } from '../components/Logo.jsx'
import { reel } from '../data/media.js'
import { gsap, ScrollTrigger, SplitText, reducedMotion } from '../lib/motion.js'

/* ------------------------------ Divisions ------------------------------ */
export function Divisions() {
  const media = [reel('ootak-bbq'), reel('sweet-dreams-boba'), reel('kashmir-cloth')]
  return (
    <section id="divisions" className="section" aria-labelledby="divisions-title">
      <div className="container-x">
        <SectionHeader id="divisions-title" label="Our two divisions" title="One company. Two specialized divisions." align="center">
          Media Productions tells your story and builds your brand. Software Company builds the systems that run and scale your business.
        </SectionHeader>

        {/* TriWeb Solutions = Media Production + Software & AI, at a glance */}
        <div className="mx-auto mt-12 flex max-w-3xl items-center justify-center gap-1.5 whitespace-nowrap sm:gap-4" data-reveal aria-label="TriWeb Solutions has two divisions: Media Production, and Software and AI">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-vermilion/12 px-3 py-1.5 text-xs font-semibold text-vermilion ring-1 ring-vermilion/30 sm:gap-2 sm:px-5 sm:py-2 sm:text-base">
            <Clapperboard className="h-4 w-4" aria-hidden="true" />
            Media Production
          </span>
          <span className="h-px w-3 bg-gradient-to-l from-vermilion to-transparent sm:w-16" aria-hidden="true" />
          <LogoIcon className="h-10 shrink-0 rounded-md sm:h-14 shadow-[0_10px_40px_-8px_rgba(255,58,32,0.8)]" title="TriWeb Solutions" />
          <span className="h-px w-3 bg-gradient-to-r from-ice to-transparent sm:w-16" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ice/10 px-3 py-1.5 text-xs font-semibold text-ice ring-1 ring-ice/30 sm:gap-2 sm:px-5 sm:py-2 sm:text-base">
            <Cpu className="h-4 w-4" aria-hidden="true" />
            Software &amp; AI
          </span>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2" data-push>
          {/* Media */}
          <TiltCard division="media" spot="rgba(255,58,32,0.85)" max={4} className="group flex flex-col overflow-hidden p-0">
            <div className="relative h-64 overflow-hidden sm:h-72">
              <div className="absolute inset-0 grid grid-cols-3 gap-1.5 p-1.5">
                {media.map((m, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-110">
                      <Reel media={m} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent" />
            </div>
            <div className="relative flex flex-1 flex-col p-7 sm:p-9">
              <span className="ico grid h-12 w-12 place-items-center rounded-2xl bg-vermilion/15 text-vermilion ring-1 ring-vermilion/30">
                <Clapperboard className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-sm font-semibold text-vermilion">Media Production division</p>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]">TriWeb Media Productions</h3>
              <p className="serif mt-1 text-xl text-vermilion">Crafting stories. Building brands. Driving growth.</p>
              <p className="mt-4 text-mist">We build iconic brands from the ground up and create high-impact visual media that drives real revenue.</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.95rem]">
                {['Digital marketing', 'Ad production', 'Graphic designing', 'Video editing'].map((s) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-1">
                <Button to="media" variant="warm">
                  Explore Media Productions
                </Button>
              </div>
            </div>
          </TiltCard>

          {/* Software */}
          <TiltCard division="software" spot="rgba(255,179,143,0.85)" max={4} className="group flex flex-col overflow-hidden p-0">
            <div className="relative h-64 overflow-hidden bg-obsidian/60 sm:h-72">
              <div className="blueprint absolute inset-0 opacity-70" />
              <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_70%_20%,rgba(255,106,61,0.35),transparent)]" />
              <pre className="absolute left-6 top-6 font-mono text-[0.78rem] leading-6 text-ice/80 transition-transform duration-700 group-hover:-translate-y-2 sm:left-9 sm:top-8" aria-hidden="true">
                {`const workflow = await triweb.automate({
  trigger: 'new-customer-message',
  agent:   'ai-assistant',
  actions: ['reply', 'update-crm', 'notify-team'],
})

deploy(website, { fast: true, responsive: true })`}
              </pre>
              <div className="absolute bottom-5 right-5 flex gap-2 sm:bottom-6 sm:right-8">
                {['Web', 'AI', 'APIs'].map((t, i) => (
                  <span key={t} className="glass rounded-full px-3 py-1 font-mono text-xs text-ice transition-transform duration-500 group-hover:-translate-y-1" style={{ transitionDelay: `${i * 60}ms` }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent" />
            </div>
            <div className="relative flex flex-1 flex-col p-7 sm:p-9">
              <span className="ico grid h-12 w-12 place-items-center rounded-2xl bg-ice/10 text-ice ring-1 ring-ice/30">
                <Cpu className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-5 font-mono text-sm font-semibold text-ice">Software &amp; AI division</p>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]">TriWeb Software Company</h3>
              <p className="mt-1 text-xl font-semibold text-ice">Engineering the future of business.</p>
              <p className="mt-4 text-mist">Robust digital infrastructure and intelligent automated workflows that simplify operations and scale with you.</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.95rem]">
                {['Web development', 'AI automations', 'Enterprise software', 'System integrations'].map((s) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-ice" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-1">
                <Button to="software" variant="cool">
                  Explore Software Solutions
                </Button>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Why choose ------------------------------ */
const reasons = [
  { Icon: Orbit, title: 'Complete 360-degree growth partner', body: 'From brand strategy and logo design to web architecture and AI, we build and manage your entire business presence under one roof.', color: '#ff3a20' },
  { Icon: Globe2, title: 'Global reach, local impact', body: 'Modern, high-performing strategies tested and proven across international markets, including the United States.', color: '#ff6a3d' },
  { Icon: Puzzle, title: 'Tailored frameworks', body: 'Custom AI, branding, and marketing solutions built specifically around your niche and long-term goals.', color: '#ffb38f' },
]

export function WhyChoose() {
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="container-x">
        <SectionHeader id="why-title" label="Why TriWeb" tone="uv" title="Why businesses choose TriWeb Solutions" align="center" />
        <div className="mt-14 grid gap-5 md:grid-cols-3" data-reveal-group>
          {reasons.map(({ Icon, title, body, color }) => (
            <TiltCard key={title} spot={color} className="group overflow-hidden p-8 sm:p-9">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60" style={{ background: color }} aria-hidden="true" />
              <span className="ico relative grid h-14 w-14 place-items-center rounded-2xl ring-1 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:rotate-[-6deg]" style={{ color, background: `${color}1a`, '--tw-ring-color': `${color}55` }}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="h-card relative mt-7">{title}</h3>
              <p className="relative mt-3 text-mist">{body}</p>
              <span className="relative mt-8 block h-px w-full origin-left scale-x-[0.2] transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-x-100" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Process ------------------------------ */
const steps = [
  { Icon: Search, title: 'Discover', body: 'We understand your business, goals and requirements.' },
  { Icon: Compass, title: 'Strategize', body: 'We develop a customized creative or technical strategy.' },
  { Icon: Hammer, title: 'Create & engineer', body: 'We design, develop, produce and implement.' },
  { Icon: Rocket, title: 'Launch', body: 'We deliver the final solution, tested and ready.' },
  { Icon: TrendingUp, title: 'Grow & scale', body: 'We optimize and keep improving business performance.' },
]

export function Process() {
  const root = useRef(null)
  const [reached, setReached] = useState(reducedMotion ? 4 : -1)
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.p-line', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.p-list', start: 'top 75%', end: 'bottom 45%', scrub: 0.6 } })
      gsap.fromTo('.p-line-v', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.p-list', start: 'top 70%', end: 'bottom 55%', scrub: 0.6 } })
      gsap.utils.toArray('.p-step').forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: 'top 70%', onEnter: () => setReached((r) => Math.max(r, i)), onLeaveBack: () => setReached(i - 1) })
      })
    }, root.current)
    return () => ctx.revert()
  }, [])
  return (
    <section ref={root} className="section" aria-labelledby="process-title">
      <div className="container-x">
        <SectionHeader id="process-title" label="Our process" tone="gel" title="How we work" align="center">
          The same five steps guide every project, whether it's a brand launch or an AI workflow.
        </SectionHeader>
        <ol className="p-list relative mt-16 grid gap-8 pl-16 lg:grid-cols-5 lg:gap-6 lg:pl-0">
          <span className="absolute bottom-6 left-[27px] top-6 w-px bg-bone/10 lg:hidden" aria-hidden="true" />
          <span className="p-line-v absolute bottom-6 left-[27px] top-6 w-px origin-top bg-gradient-to-b from-vermilion via-ember to-steel lg:hidden" aria-hidden="true" />
          <span className="absolute left-[10%] right-[10%] top-[27px] hidden h-px bg-bone/10 lg:block" aria-hidden="true" />
          <span className="p-line absolute left-[10%] right-[10%] top-[27px] hidden h-px origin-left bg-gradient-to-r from-vermilion via-ember to-steel lg:block" aria-hidden="true" />
          {steps.map(({ Icon, title, body }, i) => {
            const on = i <= reached
            return (
              <li
                key={title}
                className={`p-step group relative rounded-2xl p-4 transition-all duration-700 lg:p-5 lg:text-center ${
                  i === reached ? 'bg-night/80 ring-1 ring-vermilion/40 shadow-[0_24px_60px_-28px_rgba(255,58,32,0.7)] lg:-translate-y-2' : 'ring-1 ring-transparent'
                }`}
                aria-current={i === reached ? 'step' : undefined}
              >
                <span
                  className={`absolute -left-16 top-4 grid h-14 w-14 place-items-center rounded-2xl transition-all duration-500 lg:static lg:mx-auto ${
                    on ? 'bg-gradient-to-br from-vermilion to-steel text-obsidian shadow-[0_10px_40px_-8px_rgba(255,106,61,0.7)]' : 'bg-night text-mist ring-1 ring-bone/15'
                  } group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className={`text-sm font-semibold tabular-nums transition-colors lg:mt-6 ${on ? 'text-vermilion' : 'text-mist'}`}>Step {i + 1}</p>
                <h3 className={`mt-1 text-xl font-bold transition-colors duration-500 ${on ? 'text-bone' : 'text-bone/50'}`}>{title}</h3>
                <p className={`mt-2 text-[0.95rem] leading-relaxed transition-colors duration-500 lg:mx-auto lg:max-w-[14rem] ${on ? 'text-mist' : 'text-mist/50'}`}>{body}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------ Founders ------------------------------ */
const founders = ['Syed Hamza Ali Zaidi', 'Muhammad Rahim', 'Anasha Hayyah Khan']
export function FounderTriangle() {
  const ref = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'center 50%', scrub: 1 } })
      tl.fromTo('.ft-edge', { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.25, ease: 'none' })
        .from('.ft-node', { scale: 0, transformOrigin: 'center', stagger: 0.2, ease: 'back.out(2)' }, 0.1)
        .from('.ft-name', { autoAlpha: 0, y: 12, stagger: 0.2 }, 0.3)
        .from('.ft-core', { autoAlpha: 0, scale: 0.8, transformOrigin: 'center' }, 0.6)
      gsap.to('.ft-spin', { rotate: 360, duration: 40, repeat: -1, ease: 'none', transformOrigin: '200px 235px' })
    }, ref.current)
    return () => ctx.revert()
  }, [])
  const pts = [
    [200, 40],
    [370, 330],
    [30, 330],
  ]
  const colors = ['#ff3a20', '#ff6a3d', '#f5f3ef']
  return (
    <figure ref={ref} className="relative mx-auto w-full max-w-[480px]">
      <svg viewBox="-50 -20 500 420" className="w-full overflow-visible" role="img" aria-label="Founded by Syed Hamza Ali Zaidi, Muhammad Rahim and Anasha Hayyah Khan">
        <defs>
          <radialGradient id="ftg">
            <stop offset="0" stopColor="#ff6a3d" stopOpacity=".4" />
            <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="235" r="150" fill="url(#ftg)" className="ft-core" />
        <circle cx="200" cy="235" r="185" fill="none" stroke="rgba(245,243,239,0.12)" strokeDasharray="3 10" className="ft-spin" />
        {pts.map((p, i) => {
          const q = pts[(i + 1) % 3]
          return <line key={i} className="ft-edge" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={colors[i]} strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" />
        })}
        <text x="200" y="245" textAnchor="middle" fill="#f5f3ef" fontSize="30" fontWeight="800" className="ft-core" fontFamily="Outfit Variable, sans-serif" letterSpacing="-1">
          TriWeb
        </text>
        {pts.map((p, i) => (
          <g key={i}>
            <circle className="ft-node" cx={p[0]} cy={p[1]} r="11" fill="#0b1220" stroke={colors[i]} strokeWidth="3" />
            <text className="ft-name" x={p[0]} y={i === 0 ? p[1] - 26 : p[1] + 42} textAnchor={i === 0 ? 'middle' : i === 1 ? 'end' : 'start'} dx={i === 1 ? 40 : i === 2 ? -40 : 0} fill="#f5f3ef" fontSize="20" fontFamily="Outfit Variable, sans-serif" fontWeight="300">
              {founders[i]}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  )
}

/* ------------------------------ Quote ------------------------------ */
export function StoryQuote() {
  const ref = useRef(null)
  useEffect(() => {
    if (reducedMotion) return
    const split = SplitText.create(ref.current.querySelector('.q-text'), { type: 'words' })
    const tw = gsap.fromTo(split.words, { opacity: 0.15 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 75%', end: 'bottom 55%', scrub: true } })
    return () => {
      tw.scrollTrigger?.kill()
      tw.kill()
      split.revert()
    }
  }, [])
  return (
    <section className="section" aria-label="Our story">
      <figure ref={ref} className="container-x relative mx-auto max-w-5xl text-center">
        <span className="serif pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 text-[9rem] leading-none text-gradient opacity-70 md:-top-16 md:text-[12rem]" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote className="relative">
          <p className="q-text serif text-[clamp(1.9rem,4.6vw,4rem)] leading-[1.12]">We set out to change the way local businesses run. Today, we are scaling enterprises across the globe.</p>
        </blockquote>
        <figcaption className="mt-8 text-mist">The founders of TriWeb Solutions</figcaption>
      </figure>
    </section>
  )
}
