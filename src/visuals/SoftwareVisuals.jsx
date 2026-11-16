import { useEffect, useRef, useState } from 'react'
import { Monitor, Smartphone, Layers, Paintbrush, Mail, MessageSquare, Database, Bot, Bell, ShoppingCart } from 'lucide-react'
import { reel } from '../data/media.js'

/* ---------- Web development: a site that builds itself, desktop or mobile ---------- */
export function BrowserVisual() {
  const [device, setDevice] = useState('desktop')
  const [mode, setMode] = useState('design')
  const [built, setBuilt] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setBuilt(true), { threshold: 0.4 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const wire = mode === 'wire' || !built
  const mobile = device === 'mobile'
  const hero = reel('mansion').poster
  const cards = ['sweet-factory', 'by-the-flame', 'cactus-cafe'].map((s) => reel(s).poster)

  const Seg = ({ value, set, opts }) => (
    <div className="flex rounded-full border border-ice/25 bg-obsidian/60 p-1" role="radiogroup">
      {opts.map(([v, label, Icon]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => set(v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${value === v ? 'bg-ice text-obsidian' : 'text-mist hover:text-bone'}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )

  const block = (cls, styled) => `transition-all duration-700 ease-[var(--ease-expo)] ${wire ? 'border border-dashed border-ice/40 bg-transparent' : styled} ${cls}`

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Seg value={device} set={setDevice} opts={[['desktop', 'Desktop', Monitor], ['mobile', 'Mobile', Smartphone]]} />
        <Seg value={mode} set={setMode} opts={[['design', 'Design', Paintbrush], ['wire', 'Wireframe', Layers]]} />
      </div>
      <div className="flex flex-1 items-start justify-center">
        <div
          className={`overflow-hidden border border-bone/15 bg-obsidian shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] transition-all duration-700 ease-[var(--ease-expo)] ${
            mobile ? 'aspect-[9/17] w-[min(100%,260px)] rounded-[2rem]' : 'aspect-[16/10] w-full rounded-2xl'
          }`}
          aria-label={`Example ${mobile ? 'mobile' : 'desktop'} restaurant website in ${wire ? 'wireframe' : 'design'} view`}
          role="img"
        >
          {/* chrome */}
          <div className={`flex items-center gap-1.5 border-b border-bone/10 bg-night px-3 ${mobile ? 'justify-center py-2' : 'py-2.5'}`}>
            {!mobile && ['bg-ember', 'bg-vermilion', 'bg-ice'].map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
            <span className={`rounded-full bg-obsidian px-3 py-0.5 font-mono text-[0.6rem] text-mist ${mobile ? '' : 'ml-3 flex-1'}`}>yourbrand.com</span>
          </div>
          <div className={`flex flex-col gap-2.5 p-3 ${mobile ? '' : 'sm:gap-3 sm:p-4'}`}>
            <div className="flex items-center justify-between">
              <span className={block('h-3 w-16 rounded', 'bg-vermilion')} />
              {!mobile && (
                <span className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={block('h-2 w-10 rounded', 'bg-bone/30')} />
                  ))}
                </span>
              )}
            </div>
            <div className={block(`relative overflow-hidden rounded-xl ${mobile ? 'h-40' : 'aspect-[16/5]'}`, 'border border-transparent')}>
              <img src={hero} alt="" className={`absolute inset-0 h-full w-full object-cover object-[center_75%] transition-opacity duration-700 ${wire ? 'opacity-0' : 'opacity-80'}`} />
              <div className={`absolute inset-0 bg-gradient-to-r from-obsidian/80 to-transparent transition-opacity duration-700 ${wire ? 'opacity-0' : 'opacity-100'}`} />
              <div className="absolute bottom-3 left-3 space-y-1.5">
                <span className={block('block h-3 w-32 rounded', 'bg-bone')} />
                <span className={block('block h-2 w-20 rounded', 'bg-bone/60')} />
                <span className={block('mt-2 block h-5 w-16 rounded-full', 'bg-vermilion')} />
              </div>
            </div>
            <div className={`grid gap-2 ${mobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {cards.slice(0, mobile ? 2 : 3).map((c, i) => (
                <div key={i} className={block('overflow-hidden rounded-lg', 'border border-bone/10 bg-night')} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className={`relative ${mobile ? 'h-16' : 'aspect-[4/3]'}`}>
                    <img src={c} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${wire ? 'opacity-0' : 'opacity-100'}`} />
                  </div>
                  <div className="space-y-1 p-2">
                    <span className={block('block h-2 w-3/4 rounded', 'bg-bone/50')} />
                    <span className={block('block h-1.5 w-1/2 rounded', 'bg-bone/25')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- AI automations: a workflow you can inspect ---------- */
const NODES = [
  { id: 'trigger', x: 60, y: 160, Icon: MessageSquare, label: 'New customer message', desc: 'A message arrives by email, website chat or social inbox, and the workflow starts on its own.' },
  { id: 'agent', x: 280, y: 160, Icon: Bot, label: 'AI agent', desc: 'An AI agent trained on your business reads the message, understands the intent and decides what happens next.', core: true },
  { id: 'reply', x: 500, y: 50, Icon: Mail, label: 'Instant reply', desc: 'Common questions get an accurate, on-brand answer in seconds, at any hour.' },
  { id: 'crm', x: 520, y: 160, Icon: Database, label: 'Update records', desc: 'Contact details, bookings and orders are written into your CRM or spreadsheet, with no copying and pasting.' },
  { id: 'order', x: 500, y: 270, Icon: ShoppingCart, label: 'Create order', desc: 'Orders and bookings are created in the systems you already use, through integrations.' },
  { id: 'team', x: 700, y: 160, Icon: Bell, label: 'Notify your team', desc: 'When a human is needed, the right person is alerted with a summary of everything so far.' },
]
// Vertical layout for narrow screens
const VERTICAL = {
  trigger: [180, 50],
  agent: [180, 170],
  reply: [60, 300],
  crm: [180, 300],
  order: [300, 300],
  team: [180, 430],
}
const EDGES = [
  ['trigger', 'agent'],
  ['agent', 'reply'],
  ['agent', 'crm'],
  ['agent', 'order'],
  ['crm', 'team'],
  ['order', 'team'],
]

function useNarrow() {
  const q = '(max-width: 639px)'
  const [narrow, setNarrow] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const h = () => setNarrow(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return narrow
}

export function WorkflowVisual() {
  const [sel, setSel] = useState('agent')
  const narrow = useNarrow()
  const nodes = narrow ? NODES.map((n) => ({ ...n, x: VERTICAL[n.id][0], y: VERTICAL[n.id][1] })) : NODES
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const path = (a, b) => {
    if (narrow) {
      const my = (a.y + b.y) / 2
      return `M${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`
    }
    const mx = (a.x + b.x) / 2
    return `M${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
  }
  const current = byId[sel]
  const labelSize = narrow ? 12 : 13
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-ice/20 bg-obsidian/70">
        <div className="blueprint absolute inset-0 opacity-60" aria-hidden="true" />
        <svg viewBox={narrow ? '0 0 360 490' : '-40 0 800 320'} className="relative h-full w-full" role="group" aria-label="AI automation workflow">
          <defs>
            <linearGradient id="edge" x1="0" x2="1">
              <stop offset="0" stopColor="#ffb38f" />
              <stop offset="1" stopColor="#ff6a3d" />
            </linearGradient>
          </defs>
          {EDGES.map(([a, b], i) => {
            const d = path(byId[a], byId[b])
            const lit = sel === a || sel === b
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="rgba(237,232,223,0.12)" strokeWidth="2" />
                <path d={d} fill="none" stroke="url(#edge)" strokeWidth={lit ? 2.5 : 1.5} strokeDasharray="6 14" style={{ animation: `dash 1.${i}s linear infinite`, opacity: lit ? 1 : 0.55 }} />
                <circle r="4" fill="#ffb38f">
                  <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                </circle>
              </g>
            )
          })}
          {nodes.map((n) => {
            const on = sel === n.id
            const w = n.core ? 64 : 52
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - w / 2} ${n.y - w / 2})`}
                className="cursor-pointer"
                onClick={() => setSel(n.id)}
                onMouseEnter={() => setSel(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(n.id))}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={n.label}
              >
                {n.core && <circle cx={w / 2} cy={w / 2} r={w * 0.85} fill="rgba(255,106,61,0.18)" className="origin-center [animation:pulse-dot_2.4s_ease-in-out_infinite]" />}
                <rect width={w} height={w} rx={n.core ? 20 : 16} fill={on ? (n.core ? '#ff6a3d' : '#ffb38f') : '#111a2e'} stroke={n.core ? '#ff6a3d' : '#ffb38f'} strokeOpacity={on ? 1 : 0.5} strokeWidth="1.5" style={{ transition: 'fill .3s' }} />
                <foreignObject width={w} height={w}>
                  <div className="grid h-full w-full place-items-center">
                    <n.Icon className="h-6 w-6" style={{ color: on ? '#0b1220' : n.core ? '#ff6a3d' : '#ffb38f' }} aria-hidden="true" />
                  </div>
                </foreignObject>
                <text x={w / 2} y={w + 20} textAnchor="middle" fill={on ? '#f5f3ef' : '#a4adbf'} fontSize={labelSize} fontFamily="Outfit Variable, sans-serif" fontWeight="600">
                  {n.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="glass flex items-start gap-4 rounded-2xl p-5" aria-live="polite">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ice/15 text-ice">
          <current.Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">{current.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-mist">{current.desc}</p>
        </div>
      </div>
    </div>
  )
}

