import Page from '../components/Page.jsx'
import { Marquee, CTA } from '../components/UI.jsx'
import CinematicHero from '../blocks/CinematicHero.jsx'
import { ExpandReel, GiantType } from '../blocks/Cinematic.jsx'
import { Divisions, WhyChoose, Process } from '../blocks/Company.jsx'
import { WorkShowcase } from '../blocks/Work.jsx'
import { portfolio } from '../data/portfolio.js'

const featured = ['ootak-bbq', 'sweet-dreams-boba', 'mansion', 'by-the-flame', 'kashmir-cloth', 'tree-house', 'cactus-cafe', 'sweet-factory'].map((id) => portfolio.find((p) => p.id === id))

export default function Home() {
  return (
    <Page>
      <CinematicHero />
      <div id="home-marquee" className="border-y hairline bg-obsidian/85 py-6">
        <Marquee
          className="text-[clamp(1.3rem,2.4vw,2rem)] font-bold tracking-[-0.02em] text-bone/85"
          items={['Brand identity', 'Ad production', 'Social media management', 'Video editing', 'Web development', 'AI automations', 'System integrations', 'Performance marketing']}
        />
      </div>
      <Divisions />
      <GiantType
        lines={[
          { text: 'Create.', caption: 'Brands, campaigns and films from TriWeb Media Productions.' },
          { text: 'Engineer.', style: 'outline', caption: 'Websites, software and AI automation from TriWeb Software Company.' },
          { text: 'Scale.', style: 'serif', caption: 'One partner for your whole business presence, as you grow.' },
        ]}
      />
      <ExpandReel
        items={['by-the-flame', 'flame-karahi', 'sweet-dreams-boba'].map((id) => portfolio.find((p) => p.id === id))}
        left="Real"
        right="stories."
        caption="Cinematic content that stops the scroll."
        sub="Ad production, reels and brand films from TriWeb Media Productions."
      />
      <WorkShowcase items={featured} />
      <WhyChoose />
      <Process />
      <CTA />
    </Page>
  )
}
