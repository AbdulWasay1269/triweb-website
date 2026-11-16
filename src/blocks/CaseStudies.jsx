import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ArrowUpRight, Inbox, Fingerprint, Video, Newspaper, Radar, LayoutDashboard, AtSign, PhoneCall, Layers, MapPin, PenLine } from 'lucide-react'
import { SectionHeader, TiltCard } from '../components/UI.jsx'
import Button from '../components/Button.jsx'
import { caseStudies, caseCategories, CASE_STUDIES_URL } from '../data/caseStudies.js'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/motion.js'

const ICONS = { inbox: Inbox, fingerprint: Fingerprint, video: Video, newspaper: Newspaper, radar: Radar, dashboard: LayoutDashboard, at: AtSign, phone: PhoneCall, layers: Layers, map: MapPin, pen: PenLine }
const CAT_LABEL = Object.fromEntries(caseCategories.map((c) => [c.id, c.label]))

/** Figures like "−97%", "3×+", "85+", "~10 min" count up from zero when they scroll in. */
function Stat({ value, label }) {
  const ref = useRef(null)
  const m = value.match(/^([−\-~]?)(\d+)(.*)$/)
  useEffect(() => {
    if (!m || reducedMotion) return
    const [, pre, num, post] = m
    const target = Number(num)
    if (target === 0) return
    const obj = { v: 0 }
    const el = ref.current
    el.textContent = `${pre}0${post}`
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = `${pre}${Math.round(obj.v)}${post}`),
        }),
    })
    return () => st.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <div className="min-w-0">
      <dd ref={ref} className="text-[clamp(1.25rem,1.7vw,1.5rem)] font-extrabold leading-tight tracking-[-0.02em] text-bone tabular-nums [overflow-wrap:anywhere]">
        {value}
      </dd>
      <dt className="mt-1 text-[0.82rem] leading-snug text-mist">{label}</dt>
    </div>
  )
}

export function CaseStudyCard({ s }) {
  const Icon = ICONS[s.icon] || Layers
  return (
    <TiltCard as="article" spot="rgba(255,179,143,0.8)" max={4} className="group flex h-full flex-col !bg-night/90 p-7 sm:p-8" aria-labelledby={`cs-${s.n}`} data-cursor="Read">
      <div className="flex items-start justify-between gap-4">
        <span className="ico relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-ice/25 via-steel/25 to-steel/10 text-ice ring-1 ring-ice/30 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
          <Icon className="jiggle h-6 w-6" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-medium text-mist ring-1 ring-inset ring-bone/10">{CAT_LABEL[s.category]}</span>
      </div>
      <h3 id={`cs-${s.n}`} className="mt-6 text-[1.4rem] font-bold leading-snug tracking-[-0.02em]">
        <span className="mr-2.5 font-medium tabular-nums text-mist/80">{s.n}</span>
        {s.title}
      </h3>
      <ul className="mt-5 space-y-2.5">
        {s.points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-[0.97rem] leading-snug text-bone/85">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ice" aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
      <dl className="mt-6 grid gap-x-5 gap-y-5 border-t hairline pt-6 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        {s.stats.map(([v, l]) => (
          <Stat key={l} value={v} label={l} />
        ))}
      </dl>
      <div className="mt-auto pt-7">
        <a
          href={s.url || CASE_STUDIES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group/l inline-flex items-center gap-2 font-semibold text-bone transition-colors hover:text-ice"
          aria-label={`Learn more about ${s.title} (opens in a new tab)`}
        >
          <span className="link-u">Learn more</span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </TiltCard>
  )
}

/** Filterable grid of all case studies. */
export function CaseStudyGrid() {
  const [cat, setCat] = useState('all')
  const grid = useRef(null)
  const counts = useMemo(() => Object.fromEntries(caseCategories.map((c) => [c.id, c.id === 'all' ? caseStudies.length : caseStudies.filter((s) => s.category === c.id).length])), [])
  const items = cat === 'all' ? caseStudies : caseStudies.filter((s) => s.category === cat)

  useEffect(() => {
    if (reducedMotion || !grid.current) return
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(grid.current.children, {
        start: 'top 92%',
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
      })
      ScrollTrigger.refresh()
    }, grid.current)
    return () => ctx.revert()
  }, [cat])

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter case studies">
        {caseCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            aria-pressed={cat === c.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
              cat === c.id ? 'bg-ice text-obsidian shadow-[0_8px_30px_-10px_rgba(255,179,143,0.7)]' : 'bg-white/5 text-mist ring-1 ring-inset ring-bone/10 hover:bg-white/10 hover:text-bone'
            }`}
          >
            {c.label}
            <span className={`ml-2 tabular-nums ${cat === c.id ? 'text-obsidian/55' : 'text-mist/60'}`}>{counts[c.id]}</span>
          </button>
        ))}
      </div>
      <ul ref={grid} key={cat} className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <li key={s.n}>
            <CaseStudyCard s={s} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Software page section. */
export default function CaseStudies() {
  return (
    <section id="case-studies" className="section" aria-labelledby="case-studies-title">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="case-studies-title" label="Automation case studies" tone="cool" title="AI automations running in real businesses">
            Lead generation, content, advertising and operations: eleven systems, each built around one business's workflow.
          </SectionHeader>
          <div className="shrink-0" data-reveal>
            <Button href={CASE_STUDIES_URL} variant="cool" icon={ArrowUpRight}>
              View all case studies
            </Button>
          </div>
        </div>
        <div className="mt-12">
          <CaseStudyGrid />
        </div>
        <p className="mt-10 text-center text-sm text-mist" data-reveal>
          Full write-ups at{' '}
          <a href={CASE_STUDIES_URL} target="_blank" rel="noopener noreferrer" className="link-u font-semibold text-ice">
            abdullahmustafa.site
          </a>
        </p>
      </div>
    </section>
  )
}
