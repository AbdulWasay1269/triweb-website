import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Code2 } from 'lucide-react'
import Reel from '../components/Reel.jsx'
import { useLightbox } from '../components/Lightbox.jsx'
import { categories, portfolio } from '../data/portfolio.js'
import { gsap, ScrollTrigger, isSmallScreen, isTouch, reducedMotion, tiltHandlers } from '../lib/motion.js'
import Button from '../components/Button.jsx'
import { CaseStudyGrid } from './CaseStudies.jsx'
import { caseStudies } from '../data/caseStudies.js'

/** A single piece of work: tilts, plays its loop on hover, opens the HD player on click. */
export function WorkCard({ item, onOpen, className = '', sizes = '' }) {
  const [hover, setHover] = useState(false)
  const isVideo = !!item.media.loop
  const tilt = tiltHandlers({ max: 6, scale: 1.02 })
  return (
    <button
      onClick={onOpen}
      onPointerEnter={(e) => {
        setHover(true)
        tilt.onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHover(false)
        tilt.onPointerLeave?.(e)
      }}
      onPointerMove={tilt.onPointerMove}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`spotlight group relative block aspect-[9/16] w-full overflow-hidden rounded-[1.4rem] bg-night text-left ring-1 ring-bone/10 [transform-style:preserve-3d] ${sizes} ${className}`}
      aria-label={`${isVideo ? 'Play' : 'View'} ${item.title}${item.brand ? `, ${item.brand}` : ''}`}
      data-cursor={isVideo ? 'Play' : 'View'}
    >
      <span className="sheen" aria-hidden="true" />
      {isVideo ? (
        <span className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.06]">
          <Reel media={item.media} mode="manual" active={hover} />
        </span>
      ) : (
        <img src={item.media.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
      {/* Play button */}
      <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full bg-bone/95 text-obsidian opacity-0 shadow-[0_0_40px_rgba(245,243,239,0.35)] transition-all duration-500 ease-[var(--ease-expo)] group-hover:scale-100 group-hover:opacity-100">
        <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" aria-hidden="true" />
      </span>
      {/* Category chip */}
      <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-bone/90">{item.format}</span>
      {/* Details slide up */}
      <span className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1 sm:p-5">
        <span className="block text-[1.02rem] font-bold leading-snug text-bone sm:text-[1.1rem]">{item.title}</span>
        {item.brand && <span className="serif mt-0.5 block text-[1.05rem] text-vermilion">{item.brand}</span>}
      </span>
    </button>
  )
}

/**
 * Portfolio card: a large, consistently framed visual with the project's
 * title, client and service set clearly beneath it. Hover zooms the frame
 * slowly and plays the clip; click opens the project page.
 */
export function ProjectCard({ item, onOpen }) {
  const [hover, setHover] = useState(false)
  const isVideo = !!item.media.loop
  const cat = categories.find((c) => c.id === item.category)?.label
  return (
    <button
      onClick={onOpen}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group block w-full text-left"
      aria-label={`Open project: ${item.title}${item.brand ? `, ${item.brand}` : ''}`}
      data-cursor="View"
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-night ring-1 ring-bone/10 transition-[box-shadow,ring-color] duration-700 group-hover:shadow-[0_40px_80px_-40px_rgba(255,58,32,0.65)] group-hover:ring-vermilion/40">
        <span className="absolute inset-0 transition-transform duration-[1.6s] ease-[var(--ease-expo)] group-hover:scale-[1.07]">
          {isVideo ? <Reel media={item.media} mode="manual" active={hover} /> : <img src={item.media.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </span>
        <span className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-40" />
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2 text-sm font-semibold text-obsidian opacity-0 shadow-lg transition-all duration-500 ease-[var(--ease-expo)] group-hover:opacity-100 max-md:opacity-100 md:translate-y-3 md:group-hover:translate-y-0">
          <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
          View project
        </span>
      </span>
      <span className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-vermilion/12 px-3 py-1 text-vermilion ring-1 ring-vermilion/25">{cat}</span>
        <span className="rounded-full px-3 py-1 text-mist ring-1 ring-bone/12">{item.format}</span>
      </span>
      <span className="mt-3 block text-xl font-bold leading-snug text-bone transition-colors group-hover:text-ember">{item.title}</span>
      {item.brand && <span className="serif mt-0.5 block text-lg text-mist">{item.brand}</span>}
    </button>
  )
}

/** Filterable grid used on the Portfolio page. */
export function WorkGrid({ initial = 'all', limitTo }) {
  const [filter, setFilter] = useState(initial)
  const { open } = useLightbox()
  const grid = useRef(null)
  const source = limitTo ? portfolio.filter((p) => limitTo.includes(p.category)) : portfolio
  const cats = categories.filter((c) => c.id === 'all' || !limitTo || limitTo.includes(c.id))
  const counts = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.id === 'software' ? caseStudies.length : c.id === 'all' ? source.length : source.filter((p) => p.category === c.id).length])), [])
  const items = filter === 'all' ? source : source.filter((p) => p.category === filter)

  useEffect(() => {
    if (reducedMotion || !grid.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        grid.current.children,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: grid.current, start: 'top 90%', once: true },
        },
      )
    }, grid.current)
    // Re-measure the page's scroll animations after the new cards have painted,
    // so a filter click shows its result straight away
    let t = 0
    const raf = requestAnimationFrame(() => (t = setTimeout(() => ScrollTrigger.refresh(), 0)))
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      ctx.revert()
    }
  }, [filter])

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter work by category">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            data-jelly="soft"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ${
              filter === c.id ? 'bg-bone text-obsidian shadow-[0_8px_30px_-10px_rgba(245,243,239,0.6)]' : 'bg-white/5 text-mist ring-1 ring-inset ring-bone/10 hover:bg-white/10 hover:text-bone'
            }`}
          >
            {c.label}
            <span className={`ml-2 tabular-nums ${filter === c.id ? 'text-obsidian/55' : 'text-mist/60'}`}>{counts[c.id]}</span>
          </button>
        ))}
      </div>

      {filter === 'software' ? (
        <div className="mt-10">
          <CaseStudyGrid />
        </div>
      ) : items.length ? (
        <ul ref={grid} key={filter} className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <ProjectCard item={item} onOpen={() => open(items, i)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-10 grid place-items-center px-6 py-20 text-center">
          <span className="ico grid h-14 w-14 place-items-center rounded-2xl bg-ice/10 text-ice">
            <Code2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="h-card mt-5">Software case studies are on their way</p>
          <p className="mt-2 max-w-md text-mist">Websites and automation projects from TriWeb Software Company will appear here. Ask us for examples relevant to your business.</p>
          <div className="mt-6">
            <Button to="contact" variant="cool">
              Ask for examples
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Featured work that scrolls sideways while the section is pinned (desktop).
 * Cards turn in 3D as they cross the screen. Phones get a swipeable row.
 */
export function WorkShowcase({ items }) {
  const section = useRef(null)
  const track = useRef(null)
  const { open } = useLightbox()

  useEffect(() => {
    if (reducedMotion || isSmallScreen()) return
    const ctx = gsap.context(() => {
      const el = track.current
      const distance = () => el.scrollWidth - innerWidth + 64
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: 'none',
        // Pin by transform while smooth scrolling drives the page: same look, but the
        // section no longer swaps to position:fixed, which the browser counted as a big layout shift
        scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${distance()}`, pin: true, pinType: isTouch ? 'fixed' : 'transform', scrub: 0.8, invalidateOnRefresh: true },
      })
      gsap.utils.toArray('.show-card').forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: -20 },
          { rotateY: 20, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } },
        )
      })
    }, section.current)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={section} className="relative overflow-hidden py-20 md:flex md:min-h-[100svh] md:flex-col md:justify-center md:pb-10 md:pt-28" aria-labelledby="featured-title">
      <div className="container-x flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="label text-vermilion" data-reveal>
            <i aria-hidden="true" />
            <span className="text-bone/90">Featured work</span>
          </span>
          <h2 id="featured-title" data-split className="h-section mt-5">
            Stories we've brought to the screen
          </h2>
        </div>
        <div data-reveal>
          <Button to="work" variant="ghost">
            View all work
          </Button>
        </div>
      </div>
      <div className="mt-12 [perspective:1600px] max-md:-mx-0 max-md:overflow-x-auto max-md:pb-4 max-md:[scroll-snap-type:x_mandatory]">
        <ul ref={track} className="pointer-events-none flex w-max gap-4 px-5 md:gap-7 md:px-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))] [transform-style:preserve-3d]">
          {items.map((item, i) => (
            <li key={item.id} className="show-card pointer-events-auto w-[64vw] shrink-0 [scroll-snap-align:center] sm:w-[300px] md:w-[min(25vw,330px)]">
              <WorkCard item={item} onOpen={() => open(items, i)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
