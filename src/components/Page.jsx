import { useLayoutEffect, useRef } from 'react'
import { initPageAnimations, ScrollTrigger } from '../lib/motion.js'

/**
 * Wraps each page. Scroll animations start once the page-transition curtain
 * lifts, so nothing animates unseen behind it.
 */
export default function Page({ children }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    let cleanup = () => {}
    const start = () => {
      cleanup = initPageAnimations(ref.current)
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    if (window.__triwebRevealed) start()
    else window.addEventListener('triweb:revealed', start, { once: true })
    return () => {
      window.removeEventListener('triweb:revealed', start)
      cleanup()
    }
  }, [])
  return <div ref={ref}>{children}</div>
}
