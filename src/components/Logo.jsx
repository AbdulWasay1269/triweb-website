import { LOGO_H, LOGO_PATH, LOGO_W } from './logoPath.js'

/**
 * Official TriWeb icon: the vermilion box with "tri / web", traced to a
 * vector so it stays sharp at any size. `tone="navy"` gives the dark variant.
 */
export function LogoIcon({ className = 'h-9', tone = 'vermilion', title }) {
  return (
    <svg viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} className={`logo-icon ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width={LOGO_W} height={LOGO_H} fill={tone === 'navy' ? '#0b1220' : '#ff3a20'} />
      <path d={LOGO_PATH} fill="#ffffff" />
    </svg>
  )
}

/** Backwards-compatible name used by older components. */
export const LogoMark = LogoIcon

/**
 * Secondary logo lockup from the brand guide: icon + "triweb" (bold)
 * + "solutions" (light), set in Outfit.
 */
export default function Logo({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="logo-flip relative block overflow-hidden rounded-[6px] [perspective:400px]">
        <LogoIcon className="h-9 w-auto" />
      </span>
      {!compact && (
        <span className="text-[1.3rem] leading-none tracking-[-0.035em]">
          <span className="font-bold">triweb</span>
          <span className="font-light">solutions</span>
        </span>
      )}
    </span>
  )
}
