import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { isTouch, reducedMotion } from '../lib/motion.js'

/* ------------------------------------------------------------------
   Playback manager: caps how many loops decode at once (smooth on
   phones), and pauses everything while the full-screen player is open.
------------------------------------------------------------------- */
const MAX_PLAYING = isTouch ? 2 : 3
const playing = new Set()
let suspended = false
const listeners = new Set()

export function suspendLoops(v) {
  suspended = v
  listeners.forEach((fn) => fn())
}

function requestPlay(video) {
  if (suspended || reducedMotion || !video) return
  playing.delete(video)
  playing.add(video)
  while (playing.size > MAX_PLAYING) {
    const oldest = playing.values().next().value
    playing.delete(oldest)
    oldest.pause()
  }
  const p = video.play()
  if (p?.catch) p.catch(() => playing.delete(video)) // autoplay refused: poster stays visible
}
function release(video) {
  if (!video) return
  playing.delete(video)
  video.pause()
}

/**
 * Silent looping video with a poster underneath.
 *  - The source is attached only when the element approaches the viewport.
 *  - The video fades in only once real frames are playing (no black flashes).
 *  - mode="auto":  plays while at least 35% visible.
 *  - mode="manual": plays while `active` is true (hover, selected tab…) and visible.
 *    On touch screens manual reels fall back to auto so phones still see motion.
 */
const Reel = forwardRef(function Reel(
  { media, mode = 'auto', active = false, className = '', fit = 'cover', position = 'center', label, onTime, priority = false },
  ref,
) {
  const video = useRef(null)
  const [near, setNear] = useState(priority)
  const [visible, setVisible] = useState(false)
  const [shown, setShown] = useState(false)
  const [, force] = useState(0)

  useImperativeHandle(ref, () => video.current)

  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  useEffect(() => {
    const el = video.current
    const ioNear = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '400px 0px' })
    const ioVis = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.35), { threshold: [0, 0.35, 0.7] })
    ioNear.observe(el)
    ioVis.observe(el)
    return () => {
      ioNear.disconnect()
      ioVis.disconnect()
      release(el)
    }
  }, [])

  const effectiveMode = mode === 'manual' && isTouch ? 'auto' : mode
  const want = near && visible && !suspended && (effectiveMode === 'auto' || active)

  useEffect(() => {
    const el = video.current
    if (!el || !near) return
    if (want) requestPlay(el)
    else release(el)
  }, [want, near])

  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover'
  return (
    <span className={`absolute inset-0 block overflow-hidden ${className}`}>
      <img src={media.poster} alt="" loading={priority ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 h-full w-full ${objectFit}`} style={{ objectPosition: position }} />
      <video
        ref={video}
        className={`absolute inset-0 h-full w-full ${objectFit} transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectPosition: position }}
        src={near && !reducedMotion ? media.loop : undefined}
        muted
        loop
        playsInline
        preload={priority || visible ? 'auto' : 'metadata'}
        disablePictureInPicture
        disableRemotePlayback
        aria-label={label}
        aria-hidden={label ? undefined : true}
        onPlaying={() => setShown(true)}
        onTimeUpdate={onTime ? (e) => onTime(e.currentTarget) : undefined}
        onError={() => setShown(false)}
      />
    </span>
  )
})

export default Reel
