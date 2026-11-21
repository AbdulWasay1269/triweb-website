/**
 * Pauses decorative CSS animations (gradient shimmer, marquees, floating
 * badges, line dashes…) inside any section that is off-screen. They look
 * exactly the same whenever they can be seen, but stop costing repaints
 * while the visitor is elsewhere on the page.
 */
export function pauseOffscreen(root) {
  if (!root || typeof IntersectionObserver === 'undefined') return () => {}
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.removeAttribute('data-offscreen')
        else e.target.setAttribute('data-offscreen', '')
      }
    },
    { rootMargin: '200px 0px' },
  )
  const sections = root.querySelectorAll(':scope section, :scope > div > section')
  sections.forEach((s) => io.observe(s))
  return () => {
    io.disconnect()
    sections.forEach((s) => s.removeAttribute('data-offscreen'))
  }
}
