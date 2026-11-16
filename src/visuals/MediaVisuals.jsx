import { useEffect, useRef, useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import Reel from '../components/Reel.jsx'
import { reel } from '../data/media.js'
import { reducedMotion } from '../lib/motion.js'

const P = (s) => reel(s).poster

/* ---------- Digital marketing: a living social feed + growth curve ---------- */
export function MarketingVisual({ active }) {
  const feed = ['sweet-dreams-boba', 'by-the-flame', 'cactus-cafe', 'ootak-bbq', 'kashmir-cloth', 'sweet-factory', 'tree-house', 'mansion', 'special-momos', 'pocket-pizza', 'noodles', 'tres-leches']
  return (
    <div className="relative flex h-full items-center justify-center">
      {/* Phone */}
      <div className="relative z-10 aspect-[9/19] h-[88%] overflow-hidden rounded-[2.2rem] border-[6px] border-dusk bg-obsidian shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2.5 border-b hairline px-3 py-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-vermilion to-ember p-[2px]">
            <div className="h-full w-full rounded-full bg-obsidian" />
          </div>
          <div className="h-2 w-16 rounded bg-bone/25" />
        </div>
        <div className="relative h-full overflow-hidden">
          <div className={`grid grid-cols-3 gap-[2px] ${active && !reducedMotion ? '[animation:marquee-y_14s_linear_infinite]' : ''}`}>
            {[...feed, ...feed].map((s, i) => (
              <img key={i} src={P(s)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
            ))}
          </div>
        </div>
      </div>
      {/* Floating engagement */}
      {[
        { Icon: Heart, c: 'text-ember', pos: 'left-[8%] top-[22%]', d: '0s' },
        { Icon: MessageCircle, c: 'text-vermilion', pos: 'right-[8%] top-[34%]', d: '.6s' },
        { Icon: Send, c: 'text-bone', pos: 'left-[12%] bottom-[24%]', d: '1.2s' },
        { Icon: Bookmark, c: 'text-vermilion', pos: 'right-[12%] bottom-[16%]', d: '1.8s' },
      ].map(({ Icon, c, pos, d }, i) => (
        <span
          key={i}
          className={`glass absolute ${pos} z-20 grid h-12 w-12 place-items-center rounded-2xl transition-all duration-700 ${active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
          style={{ transitionDelay: d, animation: active ? `float-y 4s ${d} ease-in-out infinite` : undefined }}
        >
          <Icon className={`h-5 w-5 ${c}`} fill="currentColor" />
        </span>
      ))}
      {/* Growth curve (illustrative, no figures) */}
      <svg viewBox="0 0 400 200" className="absolute inset-x-0 bottom-[6%] z-0 h-1/2 w-full" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gc" x1="0" x2="1">
            <stop offset="0" stopColor="#ff3a20" stopOpacity="0" />
            <stop offset=".5" stopColor="#ff3a20" />
            <stop offset="1" stopColor="#ff4f7b" />
          </linearGradient>
        </defs>
        <path
          d="M0 180 C 60 175, 90 160, 130 150 S 200 120, 240 100 S 320 40, 400 15"
          fill="none"
          stroke="url(#gc)"
          strokeWidth="3"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={active ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(.16,1,.3,1) .2s' }}
        />
      </svg>
    </div>
  )
}

/* ---------- Ad production: camera viewfinder over a real ad ---------- */
export function AdVisual({ active }) {
  const media = reel('ootak-bbq')
  const [tc, setTc] = useState('00:00:00:00')
  const onTime = (v) => {
    const t = v.currentTime
    const f = Math.floor((t % 1) * 30)
    const s = Math.floor(t)
    setTc(`00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`)
  }
  return (
    <div className="group/vf relative mx-auto aspect-[9/16] h-full max-h-full overflow-hidden rounded-3xl bg-obsidian">
      <Reel media={media} mode="manual" active={active} onTime={onTime} label="Ootak Restaurant BBQ platter advertisement" />
      <div className="pointer-events-none absolute inset-0">
        {/* corners */}
        {['left-4 top-4 border-l-2 border-t-2', 'right-4 top-4 border-r-2 border-t-2', 'left-4 bottom-4 border-l-2 border-b-2', 'right-4 bottom-4 border-r-2 border-b-2'].map((c) => (
          <span key={c} className={`absolute h-8 w-8 border-bone/90 ${c}`} />
        ))}
        {/* rule of thirds appears on hover */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/vf:opacity-100">
          <span className="absolute inset-y-0 left-1/3 w-px bg-bone/30" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-bone/30" />
          <span className="absolute inset-x-0 top-1/3 h-px bg-bone/30" />
          <span className="absolute inset-x-0 top-2/3 h-px bg-bone/30" />
        </div>
        {/* focus box */}
        <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-vermilion/90 transition-all duration-500 group-hover/vf:h-14 group-hover/vf:w-14 group-hover/vf:border-vermilion" />
        <div className="absolute left-8 top-8 flex items-center gap-2 font-mono text-xs text-bone">
          <span className="h-2.5 w-2.5 rounded-full bg-ember [animation:pulse-dot_1.2s_infinite]" /> REC
        </div>
        <div className="absolute right-8 top-8 font-mono text-xs tabular-nums text-bone">{tc}</div>
        <div className="absolute inset-x-8 bottom-8 flex items-center justify-between font-mono text-[0.7rem] text-bone/80">
          <span>9:16</span>
          <span className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-3 w-1 rounded-sm ${i < 8 ? 'bg-ice/80' : i < 10 ? 'bg-vermilion' : 'bg-bone/20'}`} />
            ))}
          </span>
          <span>ISO 800</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Graphic design: an artboard where a brand comes together ---------- */
export function DesignVisual({ active }) {
  const [k, setK] = useState(0) // re-trigger drawing on hover
  const swatches = ['#ff3a20', '#ff4f7b', '#f5f3ef', '#161827', '#ff6a3d']
  const draw = active ? 0 : 1
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl border hairline bg-dusk/60 [background-image:radial-gradient(rgba(237,232,223,0.12)_1px,transparent_1px)] [background-size:22px_22px]"
      onMouseEnter={() => setK((v) => v + 1)}
    >
      {/* Layers panel */}
      <div className="glass absolute left-4 top-4 hidden w-40 rounded-xl p-3 text-xs sm:block">
        <p className="mb-2 font-semibold text-bone/80">Layers</p>
        {['Logo mark', 'Wordmark', 'Palette', 'Social post'].map((l, i) => (
          <p key={l} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? 'bg-vermilion/15 text-vermilion' : 'text-mist'}`}>
            <span className="h-2 w-2 rounded-sm border border-current" />
            {l}
          </p>
        ))}
      </div>
      {/* Artboard */}
      <div className="absolute left-1/2 top-1/2 w-[62%] max-w-[340px] -translate-x-1/2 -translate-y-[58%]">
        <p className="mb-1.5 text-[0.7rem] text-mist">Artboard</p>
        <div className="relative aspect-square rounded-lg bg-bone shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <svg key={k} viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              d="M100 30 C 140 30, 170 60, 170 100 C 170 140, 140 170, 100 170 C 70 170, 45 150, 38 122 L 100 100 L 62 52 C 72 38, 86 30, 100 30 Z"
              fill="none"
              stroke="#161827"
              strokeWidth="5"
              strokeLinejoin="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={draw}
              style={{ transition: 'stroke-dashoffset 2.2s cubic-bezier(.65,0,.35,1)' }}
            />
            <circle cx="100" cy="100" r="9" fill="#ff4f7b" style={{ transform: `scale(${active ? 1 : 0})`, transformOrigin: '100px 100px', transition: 'transform .6s 1.8s cubic-bezier(.34,1.56,.64,1)' }} />
            {/* anchor points & handles */}
            {[
              [100, 30],
              [170, 100],
              [100, 170],
              [38, 122],
              [62, 52],
            ].map(([x, y], i) => (
              <g key={i} style={{ opacity: active ? 1 : 0, transition: `opacity .3s ${0.3 + i * 0.35}s` }}>
                <rect x={x - 4} y={y - 4} width="8" height="8" fill="#f5f3ef" stroke="#ff6a3d" strokeWidth="1.5" />
              </g>
            ))}
            <line x1="100" y1="30" x2="140" y2="30" stroke="#ff6a3d" strokeWidth="1" style={{ opacity: active ? 1 : 0, transition: 'opacity .3s .5s' }} />
            <circle cx="140" cy="30" r="3" fill="#ff6a3d" style={{ opacity: active ? 1 : 0, transition: 'opacity .3s .5s' }} />
          </svg>
        </div>
      </div>
      {/* Palette + type specimen */}
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
        <div className="glass flex items-center gap-1.5 rounded-xl p-2.5">
          {swatches.map((c, i) => (
            <span
              key={c}
              className="h-8 w-8 rounded-full border border-bone/20 transition-transform duration-500"
              style={{ background: c, transform: active ? `translateY(0)` : 'translateY(12px)', transitionDelay: `${0.8 + i * 0.08}s`, opacity: active ? 1 : 0 }}
            />
          ))}
        </div>
        <div className="glass rounded-xl px-4 py-2 text-right">
          <span className="serif-voice block text-4xl leading-none text-bone">Aa</span>
          <span className="text-[0.7rem] text-mist">Brand typeface</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Video editing: monitor + timeline you can scrub ---------- */
export function EditingVisual({ active }) {
  const media = reel('by-the-flame')
  const video = useRef(null)
  const [p, setP] = useState(0)
  const scrubbing = useRef(false)
  const clips = [
    ['by-the-flame', 'flame-karahi', 'noodles'],
    ['sweet-dreams-boba', 'tres-leches', 'special-momos', 'pocket-pizza'],
  ]
  const onTime = (v) => !scrubbing.current && v.duration && setP(v.currentTime / v.duration)
  const scrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    scrubbing.current = true
    setP(x)
    const v = video.current
    if (v?.duration) {
      v.pause()
      v.currentTime = x * v.duration
    }
  }
  const release = () => {
    scrubbing.current = false
    if (active && !reducedMotion) video.current?.play().catch(() => {})
  }
  useEffect(() => {
    if (!active) scrubbing.current = false
  }, [active])
  const bars = useRef(Array.from({ length: 64 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75)).current

  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl border hairline bg-dusk/60 p-3 sm:p-4">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-obsidian">
        <div className="relative aspect-[9/16] h-full max-h-full overflow-hidden">
          <Reel ref={video} media={media} mode="manual" active={active} onTime={onTime} label="By the Flame cheese-pull naan reel" />
        </div>
      </div>
      <div
        className="relative cursor-ew-resize select-none rounded-xl bg-obsidian/80 p-2.5"
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && scrub(e)}
        onPointerDown={scrub}
        onPointerLeave={release}
        onPointerUp={release}
        data-cursor="Scrub"
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          const v = video.current
          if (!v?.duration) return
          if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 0.5)
          if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 0.5)
        }}
      >
        {clips.map((track, t) => (
          <div key={t} className="mb-1.5 flex h-9 gap-1">
            <span className="grid w-7 shrink-0 place-items-center font-mono text-[0.65rem] text-mist">V{2 - t}</span>
            {track.map((s, i) => (
              <span
                key={s}
                className={`h-full overflow-hidden rounded-md border ${t === 0 ? 'border-vermilion/60' : 'border-ember/50'}`}
                style={{ flex: 1 + ((i * 7 + t * 3) % 4) * 0.4, backgroundImage: `url(${P(s)})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }}
              />
            ))}
          </div>
        ))}
        <div className="flex h-8 gap-1">
          <span className="grid w-7 shrink-0 place-items-center font-mono text-[0.65rem] text-mist">A1</span>
          <div className="flex flex-1 items-center gap-[2px] rounded-md border border-ice/40 bg-ice/5 px-1">
            {bars.map((h, i) => (
              <span key={i} className="flex-1 rounded-full bg-ice/70" style={{ height: `${h * 80}%` }} />
            ))}
          </div>
        </div>
        {/* playhead */}
        <span className="pointer-events-none absolute bottom-1 top-1 w-0.5 bg-ember shadow-[0_0_12px_var(--color-ember)]" style={{ left: `calc(2.75rem + (100% - 3.4rem) * ${p})` }}>
          <span className="absolute -left-[5px] -top-1 h-3 w-3 rotate-45 bg-ember" />
        </span>
      </div>
    </div>
  )
}
