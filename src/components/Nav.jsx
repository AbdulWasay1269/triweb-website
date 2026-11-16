import { useEffect, useRef, useState } from 'react'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import Logo from './Logo.jsx'
import { Link } from '../router.jsx'
import RollText from './RollText.jsx'
import { gsap, reducedMotion } from '../lib/motion.js'
import { startScroll, stopScroll } from '../lib/scroll.js'

export const NAV = [
  { to: '', label: 'Home' },
  { to: 'about', label: 'About' },
  { to: 'media', label: 'Media Productions' },
  { to: 'software', label: 'Software' },
  { to: 'work', label: 'Portfolio' },
]

/** Always-visible nav: transparent at the top, glass once you scroll. */
export default function Nav({ route }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const list = useRef(null)
  const pill = useRef(null)
  const panel = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 24)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Sliding pill follows the hovered link, rests on the current page
  const moveTo = (el, instant) => {
    if (!el || !pill.current || !list.current) return
    const a = el.getBoundingClientRect()
    const b = list.current.getBoundingClientRect()
    gsap.to(pill.current, { x: a.left - b.left, width: a.width, opacity: 1, duration: instant ? 0 : 0.45, ease: 'expo.out' })
  }
  const restOnActive = (instant) => {
    const el = list.current?.querySelector('[aria-current="page"]')
    if (el) moveTo(el, instant)
    else gsap.to(pill.current, { opacity: 0, duration: 0.3 })
  }
  useEffect(() => {
    const id = requestAnimationFrame(() => restOnActive(true))
    const onResize = () => restOnActive(true)
    addEventListener('resize', onResize)
    document.fonts?.ready.then(() => restOnActive(true))
    return () => {
      cancelAnimationFrame(id)
      removeEventListener('resize', onResize)
    }
  }, [route])

  useEffect(() => {
    if (!open) return
    stopScroll()
    if (!reducedMotion) {
      gsap.fromTo(panel.current, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.8, ease: 'expo.out' })
      gsap.from('.mnav-link', { y: 40, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out', delay: 0.1 })
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => {
      startScroll()
      removeEventListener('keydown', onKey)
    }
  }, [open])
  useEffect(() => setOpen(false), [route])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className={`container-x transition-[padding] duration-500 ${scrolled ? 'pt-3' : 'pt-5'}`}>
          <nav
            aria-label="Main"
            className={`flex items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-4 ${scrolled ? 'glass-blur shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)]' : 'border border-transparent'}`}
          >
            <Link to="" aria-label="TriWeb Solutions home" className="group rounded-xl px-1 py-1">
              <Logo />
            </Link>

            <ul ref={list} className="relative hidden items-center lg:flex" onMouseLeave={() => restOnActive(false)}>
              <span ref={pill} className="absolute left-0 top-0 h-full rounded-xl bg-white/[0.07] opacity-0" aria-hidden="true" />
              {NAV.map((item) => {
                const current = route === item.to
                return (
                  <li key={item.label} className="relative">
                    <Link
                      to={item.to}
                      onMouseEnter={(e) => moveTo(e.currentTarget)}
                      onFocus={(e) => moveTo(e.currentTarget)}
                      aria-current={current ? 'page' : undefined}
                      className={`roll-host relative block rounded-xl px-4 py-2 text-[0.92rem] font-medium transition-colors ${current ? 'text-bone' : 'text-mist hover:text-bone'}`}
                    >
                      <RollText>{item.label}</RollText>
                      {current && <span className="absolute inset-x-4 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-vermilion to-steel" />}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2">
              <Link
                to="contact"
                aria-current={route === 'contact' ? 'page' : undefined}
                data-jelly="soft"
                className="roll-host group relative isolate hidden items-center gap-1.5 overflow-hidden rounded-xl bg-bone px-4 py-2.5 text-sm font-semibold text-obsidian transition-colors hover:bg-vermilion sm:inline-flex"
              >
                <RollText>Contact us</RollText>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <button
                className="ico grid h-11 w-11 place-items-center rounded-xl border hairline bg-white/5 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {open && (
        <div id="mobile-menu" ref={panel} className="fixed inset-0 z-[60] flex flex-col bg-night lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_0%_100%,rgba(255,58,32,0.16),transparent),radial-gradient(70%_50%_at_100%_0%,rgba(255,106,61,0.2),transparent)]" />
          <div className="container-x relative flex items-center justify-between pt-6">
            <Logo />
            <button className="ico grid h-11 w-11 place-items-center rounded-xl border hairline" onClick={() => setOpen(false)} aria-label="Close menu" autoFocus>
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="container-x relative mt-10 flex flex-1 flex-col">
            {[...NAV, { to: 'contact', label: 'Contact' }].map((item) => (
              <li key={item.label} className="border-b hairline">
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  aria-current={route === item.to ? 'page' : undefined}
                  className={`mnav-link flex items-center justify-between py-4 text-[1.9rem] font-bold tracking-[-0.02em] ${route === item.to ? 'text-vermilion' : ''}`}
                >
                  {item.label}
                  <ArrowUpRight className="h-6 w-6 text-mist" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
