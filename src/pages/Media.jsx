import { useState } from 'react'
import { Play } from 'lucide-react'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Reel from '../components/Reel.jsx'
import { PageHero, SectionHeader, CTA, Marquee } from '../components/UI.jsx'
import { useLightbox } from '../components/Lightbox.jsx'
import { ServicesExplorer, ReelStrip, BrandIdentity, Industries } from '../blocks/MediaBlocks.jsx'
import { WorkGrid } from '../blocks/Work.jsx'
import { ExpandReel } from '../blocks/Cinematic.jsx'
import { portfolio } from '../data/portfolio.js'
import { isTouch } from '../lib/motion.js'

/** Three reels fanned out in 3D; hovering spreads them apart. */
function ReelFan() {
  const { open } = useLightbox()
  const [spread, setSpread] = useState(false)
  const ids = ['sweet-dreams-boba', 'ootak-bbq', 'kashmir-cloth']
  const items = ids.map((id) => portfolio.find((p) => p.id === id))
  const pose = [
    { r: -14, x: spread ? -66 : -52, y: 18, z: -60 },
    { r: 0, x: 0, y: 0, z: 40 },
    { r: 14, x: spread ? 66 : 52, y: 18, z: -60 },
  ]
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[520px] [perspective:1400px] sm:h-[520px]" onMouseEnter={() => !isTouch && setSpread(true)} onMouseLeave={() => setSpread(false)}>
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => open(portfolio, portfolio.indexOf(item))}
          className="group absolute left-1/2 top-1/2 aspect-[9/16] w-[46%] overflow-hidden rounded-[1.4rem] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] ring-1 ring-bone/15 transition-transform duration-700 ease-[var(--ease-expo)] hover:ring-vermilion/70"
          style={{ transform: `translate(-50%, -50%) translate3d(${pose[i].x}%, ${pose[i].y}px, ${pose[i].z}px) rotateY(${pose[i].r}deg) rotateZ(${pose[i].r * 0.3}deg)`, zIndex: i === 1 ? 2 : 1 }}
          aria-label={`Play ${item.title}`}
          data-cursor="Play"
        >
          <Reel media={item.media} priority={i === 1} />
          <span className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent to-50%" />
          <span className="absolute inset-x-0 bottom-0 p-3 text-left">
            <span className="block text-sm font-semibold">{item.title}</span>
            <span className="serif text-vermilion">{item.brand}</span>
          </span>
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-bone text-obsidian opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true" />
          </span>
        </button>
      ))}
      <div className="pointer-events-none absolute -bottom-2 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,58,32,0.45),transparent)] blur-xl" aria-hidden="true" />
    </div>
  )
}

export default function Media() {
  return (
    <Page>

      <PageHero
        lit
        horizon="wave"
        label="TriWeb Media Productions"
        title={
          <>
            We build iconic brands <span className="serif font-normal text-vermilion">from the ground up.</span>
          </>
        }
        aside={<ReelFan />}
        actions={
          <>
            <Button to="contact" variant="warm" size="lg">
              Start a project
            </Button>
            <Button to="work" variant="ghost" size="lg">
              See our work
            </Button>
          </>
        }
      >
        We don't just market businesses. We create high-impact visual media that drives real revenue, for cafes and restaurants, fashion brands, real estate and short-term rentals.
      </PageHero>

      <ExpandReel
        items={['kashmir-cloth', 'ootak-bbq', 'mansion'].map((id) => portfolio.find((p) => p.id === id))}
        left="Media"
        right="Studio."
        caption="Crafting stories. Building brands. Driving growth."
        sub="Commercials, reels and brand films that turn viewers into customers."
      />

      <div className="border-y hairline bg-obsidian/85 py-5">
        <Marquee reverse speed={45} className="serif text-[clamp(1.4rem,2.6vw,2.2rem)] text-bone/85" items={['Commercials', 'Brand films', 'Reels & short-form', 'Product ads', 'Logo design', 'Social media creatives', 'Campaign strategy']} />
      </div>

      <ServicesExplorer />

      <section className="pb-8" aria-label="Reels">
        <ReelStrip />
      </section>

      <BrandIdentity />
      <Industries />

      <section className="section" aria-labelledby="media-work-title">
        <div className="container-x">
          <SectionHeader id="media-work-title" label="Recent productions" title="Work from the studio">
            Select any piece to watch it in HD with sound.
          </SectionHeader>
          <div className="mt-10">
            <WorkGrid limitTo={['restaurants', 'fashion', 'real-estate']} />
          </div>
        </div>
      </section>

      <CTA />
    </Page>
  )
}
