/**
 * Hover text roll: on hover of the nearest `.group` (or the text itself)
 * each letter slides up and an identical copy rolls in from below, letter
 * by letter. Screen readers get the plain text once.
 */
export default function RollText({ children, className = '' }) {
  const text = String(children)
  const letters = [...text]
  const row = (cls) =>
    letters.map((c, i) => (
      <span key={i} className={`${cls} inline-block`} style={{ transitionDelay: `${i * 16}ms`, '--i': i }}>
        {c === ' ' ? ' ' : c}
      </span>
    ))
  return (
    <span className={`roll relative inline-flex overflow-hidden align-bottom ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="flex" aria-hidden="true">
        {row('roll-a')}
      </span>
      <span className="absolute inset-0 flex" aria-hidden="true">
        {row('roll-b')}
      </span>
    </span>
  )
}
