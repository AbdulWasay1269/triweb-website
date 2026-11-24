import Page from '../components/Page.jsx'
import { PageHero, CTA } from '../components/UI.jsx'
import { WorkGrid } from '../blocks/Work.jsx'
import TriReel from '../blocks/TriReel.jsx'
import { reel, alt } from '../data/media.js'

const reels = [
  { id: 'sweet-dreams-boba', caption: 'Product reels', media: reel('sweet-dreams-boba') },
  { id: 'mansion', caption: 'Property films', media: alt.mansionPool },
  { id: 'kashmir-cloth', caption: 'Fashion campaigns', media: reel('kashmir-cloth') },
]

export default function Portfolio() {
  return (
    <Page>
      <PageHero lit horizon="mountains" label="Portfolio" title={<>Selected work</>} aside={<div className="mx-auto w-[min(100%,26rem)] lg:w-full"><TriReel items={reels} /></div>}>
        Reels, ads and films produced for the brands we work with. Select any piece to watch it in HD with sound.
      </PageHero>
      <section className="pb-24" aria-label="Portfolio">
        <div className="container-x">
          <WorkGrid />
        </div>
      </section>
      <CTA />
    </Page>
  )
}
