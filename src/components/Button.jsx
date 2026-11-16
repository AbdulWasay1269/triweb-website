import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, isTouch, reducedMotion } from '../lib/motion.js'
import { Link } from '../router.jsx'
import RollText from './RollText.jsx'

const variants = {
  primary: { base: 'bg-bone text-obsidian', sweep: 'bg-vermilion', hoverText: 'group-hover:text-obsidian' },
  warm: { base: 'bg-vermilion text-obsidian', sweep: 'bg-bone', hoverText: 'group-hover:text-obsidian' },
  cool: { base: 'bg-transparent text-ice ring-1 ring-inset ring-ice/60', sweep: 'bg-ice', hoverText: 'group-hover:text-obsidian' },
  ghost: { base: 'bg-white/5 text-bone ring-1 ring-inset ring-bone/15', sweep: 'bg-bone', hoverText: 'group-hover:text-obsidian' },
}

/**
 * Pill button: colour sweeps up from below on hover, the arrow slides
 * through, and the whole button is gently magnetic on desktop.
 * `to` = page link, `onClick` = action, `type="submit"` for forms.
 */
export default function Button({ to, section, href, variant = 'primary', children, icon: Icon = ArrowRight, className = '', size = 'md', ...rest }) {
  const ref = useRef(null)
  const v = variants[variant]
  const onMove = (e) => {
    if (isTouch || reducedMotion) return
    const r = ref.current.getBoundingClientRect()
    gsap.to(ref.current, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.5, ease: 'power3.out' })
  }
  const onLeave = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' })
  const pad = size === 'lg' ? 'px-7 py-4 text-base' : 'px-6 py-3.5 text-[0.95rem]'

  const cls = `roll-host group relative isolate inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-semibold transition-shadow duration-500 hover:shadow-[0_12px_40px_-12px_rgba(255,58,32,0.55)] ${pad} ${v.base} ${className}`
  const inner = (
    <>
      <span className="jelly-shine" aria-hidden="true" />
      <span className={`absolute inset-0 -z-10 translate-y-[101%] rounded-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0 ${v.sweep}`} aria-hidden="true" />
      <span className={`transition-colors duration-300 ${v.hoverText}`}>{typeof children === 'string' ? <RollText>{children}</RollText> : children}</span>
      {Icon && (
        <span className={`relative h-4 w-4 overflow-hidden transition-colors duration-300 ${v.hoverText}`} aria-hidden="true">
          <Icon className="absolute inset-0 h-4 w-4 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-[150%]" />
          <Icon className="absolute inset-0 h-4 w-4 -translate-x-[150%] transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0" />
        </span>
      )}
    </>
  )
  if (href) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" data-jelly="" className={cls} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
        {inner}
      </a>
    )
  }
  if (to !== undefined) {
    return (
      <Link ref={ref} to={to} section={section} data-jelly="" className={cls} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
        {inner}
      </Link>
    )
  }
  return (
    <button ref={ref} data-jelly="" className={cls} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
      {inner}
    </button>
  )
}
