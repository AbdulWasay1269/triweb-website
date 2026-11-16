import { useState } from 'react'
import { Megaphone, Film, PenTool, Scissors, Play, Check } from 'lucide-react'
import Reel from '../components/Reel.jsx'
import { SectionHeader, TiltCard } from '../components/UI.jsx'
import { useLightbox } from '../components/Lightbox.jsx'
import { portfolio } from '../data/portfolio.js'
import { reel, alt } from '../data/media.js'
import { isTouch } from '../lib/motion.js'
import { MarketingVisual, AdVisual, DesignVisual, EditingVisual } from '../visuals/MediaVisuals.jsx'

const services = [
  { id: 'marketing', name: 'Digital marketing', Icon: Megaphone, line: 'Audiences that grow and campaigns that convert.', points: ['Performance marketing', 'Social media marketing', 'Social media handling and management', 'Campaign strategy and audience growth'], Visual: MarketingVisual },
  { id: 'ads', name: 'Ad production', Icon: Film, line: 'Commercials made to stop the scroll.', points: ['Commercial advertisements', 'Promotional videos', 'Product advertisements', 'Creative campaign production'], Visual: AdVisual },
  { id: 'design', name: 'Graphic designing', Icon: PenTool, line: 'Identities people remember.', points: ['Logo design', 'Brand identity', 'Social media creatives', 'Marketing materials', 'Visual branding'], Visual: DesignVisual },
  { id: 'editing', name: 'Video editing', Icon: Scissors, line: 'Rhythm, pacing and polish in every frame.', points: ['Professional video editing', 'Reels and short-form content', 'Promotional videos', 'Cinematic video production'], Visual: EditingVisual },
]

/** Service tabs with a live visual for each service. */
export function ServicesExplorer() {
  const [active, setActive] = useState(0)
  const S = services[active]
  return (
    <section className="section" aria-labelledby="media-services-title">
      <div className="container-x">
        <SectionHeader id="media-services-title" label="What we do" title="Four services, one creative studio">
          Choose a service to see how it comes together.
        </SectionHeader>

        {/* Tabs */}
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Media Productions services" data-reveal>
          {services.map((s, i) => {
            const on = i === active
            return (
              <button
                key={s.id}
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={on}
                aria-controls="media-service-panel"
                onClick={() => setActive(i)}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-4 text-left transition-all duration-500 ${on ? 'bg-vermilion text-obsidian shadow-[0_14px_40px_-14px_rgba(255,58,32,0.8)]' : 'bg-white/[0.04] text-bone ring-1 ring-inset ring-bone/10 hover:bg-white/[0.08]'}`}
              >
                <s.Icon className={`h-5 w-5 shrink-0 transition-transform duration-500 group-hover:rotate-[-10deg] group-hover:scale-110 ${on ? '' : 'text-vermilion'}`} aria-hidden="true" />
                <span className="font-semibold leading-tight">{s.name}</span>
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div data-push id="media-service-panel" role="tabpanel" aria-labelledby={`tab-${S.id}`} className="mt-6 grid items-stretch gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div key={S.id} className="card flex flex-col justify-center p-8 sm:p-10 [animation:none]">
            <S.Icon className="h-8 w-8 text-vermilion" aria-hidden="true" />
            <h3 className="h-section mt-6 !text-[clamp(1.8rem,3vw,2.5rem)]">{S.name}</h3>
            <p className="serif mt-2 text-2xl text-vermilion">{S.line}</p>
            <ul className="mt-8 space-y-3">
              {S.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-bone/90">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vermilion/15">
                    <Check className="h-3.5 w-3.5 text-vermilion" aria-hidden="true" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[480px] sm:h-[560px]">
            {services.map((s, i) => (
              <div key={s.id} aria-hidden={i !== active} className={`absolute inset-0 transition-all duration-700 ease-[var(--ease-expo)] ${i === active ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-6 opacity-0'}`}>
                <s.Visual active={i === active} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Infinite strip of reels; hover pauses and plays the reel. */
export function ReelStrip() {
  const { open } = useLightbox()
  const [hover, setHover] = useState(null)
  const items = portfolio.filter((p) => p.category !== 'software')
  return (
    <div className="relative overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]" aria-label="Reels by TriWeb Media Productions">
      <ul className="flex w-max gap-4 [animation:marquee_80s_linear_infinite] hover:[animation-play-state:paused]">
        {[...items, ...items].map((item, i) => (
          <li key={i} aria-hidden={i >= items.length ? 'true' : undefined}>
            <button
              onClick={() => open(items, i % items.length)}
              onMouseEnter={() => !isTouch && setHover(i)}
              onMouseLeave={() => setHover(null)}
              tabIndex={i >= items.length ? -1 : 0}
              className="group relative block aspect-[9/16] w-40 overflow-hidden rounded-2xl ring-1 ring-bone/10 transition-all duration-500 ease-[var(--ease-expo)] hover:-translate-y-3 hover:ring-vermilion/60 sm:w-48 md:w-52"
              aria-label={`Play ${item.title}`}
              data-cursor="Play"
            >
              <Reel media={item.media} mode="manual" active={hover === i} />
              <span className="absolute inset-0 bg-gradient-to-t from-obsidian/90 to-transparent to-50%" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-left text-sm font-semibold leading-tight">{item.title}</span>
              <Play className="absolute right-3 top-3 h-4 w-4 text-bone opacity-0 transition-opacity group-hover:opacity-100" fill="currentColor" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const brandBook = [
  ['Custom logo design', 'A mark that works everywhere, from a storefront to an app icon.'],
  ['Visual themes & colour palettes', 'A consistent look across every post, ad and page.'],
  ['Brand voice', 'How you sound, so every caption feels like you.'],
  ['Mission & vision', 'What you stand for and where you are going.'],
  ['Core strategic goals', 'Clear targets the brand is built to reach.'],
]
export function BrandIdentity() {
  return (
    <section className="section" aria-labelledby="brand-title">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader id="brand-title" label="Brand identity" title="Complete branding, from the ground up">
            We don't just market businesses. We build iconic brands from the ground up and craft high-impact visual media that drives real revenue.
          </SectionHeader>
        </div>
        <ul className="space-y-3" data-reveal-group>
          {brandBook.map(([t, d], i) => (
            <li key={t}>
              <TiltCard division="media" max={3} className="group flex items-start gap-5 p-5 sm:p-6">
                <span className="serif w-8 shrink-0 text-3xl leading-none text-vermilion/80 transition-transform duration-500 group-hover:scale-125">{['i', 'ii', 'iii', 'iv', 'v'][i]}</span>
                <span>
                  <span className="block text-lg font-bold">{t}</span>
                  <span className="mt-0.5 block text-[0.95rem] text-mist">{d}</span>
                </span>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const industries = [
  { name: 'Cafes & restaurants', line: 'Food that looks as good on screen as it tastes, and venues people want to visit.', media: reel('flame-karahi') },
  { name: 'Fashion & clothing brands', line: 'Campaign films and content that sell fabric, fit and feeling.', media: alt.fashionFabric },
  { name: 'Real estate', line: 'Property films that let buyers walk through before they arrive.', media: alt.mansionStairs },
  { name: 'Airbnb & short-term rentals', line: 'Listing videos and social content that keep calendars booked.', media: alt.mansionPool },
]
/** Four industries as tall cards; the hovered one widens and plays. */
export function Industries() {
  const [active, setActive] = useState(0)
  return (
    <section className="section" aria-labelledby="industries-title">
      <div className="container-x">
        <SectionHeader id="industries-title" label="Industry specializations" title="Industries we know inside out">
          Deep, hands-on experience in four fields where visuals decide who gets the customer.
        </SectionHeader>
        <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 md:mx-0 md:h-[540px] md:overflow-visible md:px-0 md:pb-0" data-reveal>
          {industries.map((ind, i) => {
            const on = i === active
            return (
              <button
                key={ind.name}
                onMouseEnter={() => !isTouch && setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={on}
                data-cursor="Watch"
                className={`group relative isolate h-[460px] w-[76vw] shrink-0 snap-center overflow-hidden rounded-[1.6rem] text-left ring-1 transition-[flex,box-shadow] duration-700 ease-[var(--ease-expo)] sm:w-[320px] md:h-full md:w-auto md:shrink ${
                  on ? 'ring-vermilion/60 shadow-[0_30px_80px_-30px_rgba(255,58,32,0.5)] md:flex-[2.6]' : 'ring-bone/10 md:flex-[1]'
                }`}
              >
                <div className="absolute inset-0 -z-20">
                  <Reel media={ind.media} mode={isTouch ? 'auto' : 'manual'} active={on} />
                </div>
                <div className={`absolute inset-0 -z-10 transition-colors duration-700 ${on ? 'bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent' : 'bg-obsidian/55 md:bg-obsidian/65'}`} />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <h3 className="text-[1.45rem] font-bold leading-tight tracking-[-0.02em]">{ind.name}</h3>
                  <p className={`mt-2 max-w-sm text-[0.98rem] text-bone/85 transition-all duration-700 ${on ? 'translate-y-0 opacity-100' : 'opacity-100 md:translate-y-4 md:opacity-0'}`}>{ind.line}</p>
                </div>
                <span className={`absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-vermilion text-obsidian transition-all duration-500 ${on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
