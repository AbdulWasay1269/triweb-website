import { Clapperboard, Cpu, Sparkles, Crosshair, Gem } from 'lucide-react'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { PageHero, SectionHeader, TiltCard, CTA } from '../components/UI.jsx'
import { FounderTriangle, StoryQuote, WhyChoose, Process } from '../blocks/Company.jsx'

const values = [
  { Icon: Sparkles, title: 'Relentless innovation', body: 'We keep testing new formats, tools and ideas so our clients stay ahead.', color: '#ff3a20' },
  { Icon: Crosshair, title: 'Technical precision', body: 'Every build, workflow and edit is engineered carefully and tested properly.', color: '#ffb38f' },
  { Icon: Gem, title: 'Creative excellence', body: 'Work that looks premium, feels on-brand and earns attention.', color: '#ff6a3d' },
]

export default function About() {
  return (
    <Page>
      <PageHero lit label="About TriWeb Solutions" tone="gel" title={<>Three friends. <span className="text-gradient">One shared dream.</span></>} aside={<FounderTriangle />}>
        Founded by three visionaries, Syed Hamza Ali Zaidi, Muhammad Rahim and Anasha Hayyah Khan, TriWeb Solutions began as a shared dream among close friends and university students.
      </PageHero>

      <section className="section pt-8" aria-labelledby="who-title">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:gap-20">
          <SectionHeader id="who-title" label="Who we are" title="From local projects to a multinational agency" />
          <div className="lead space-y-5 text-bone/85" data-reveal>
            <p>
              What started with a mission to revolutionize how local businesses operate has rapidly evolved into a multinational agency driving digital transformation across multiple countries, including the United States.
            </p>
            <p className="text-mist">We bridge the gap between creative storytelling and cutting-edge technology, empowering businesses to dominate their markets both online and on the ground.</p>
          </div>
        </div>
      </section>

      <StoryQuote />

      <section className="section" aria-labelledby="values-title">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-20">
            <SectionHeader id="values-title" label="Our story & vision" tone="uv" title="Innovation should know no bounds" />
            <p className="lead" data-reveal>
              From our humble beginnings handling local projects to becoming a global partner for international brands, our core values remain unchanged.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3" data-reveal-group>
            {values.map(({ Icon, title, body, color }) => (
              <TiltCard key={title} spot={color} className="group p-8">
                <Icon className="h-7 w-7 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" style={{ color }} aria-hidden="true" />
                <h3 className="h-card mt-6">{title}</h3>
                <p className="mt-2 text-mist">{body}</p>
              </TiltCard>
            ))}
          </div>
          <p className="lead mx-auto mt-14 max-w-3xl text-center text-bone/85" data-reveal>
            Whether you are a startup looking to establish a complete brand identity, a restaurant aiming to fill seats, a property owner scaling rentals, or an enterprise automating operations with AI, TriWeb Solutions is your ultimate growth partner.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="arms-title">
        <div className="container-x">
          <SectionHeader id="arms-title" label="Our specialized arms" title="Two dedicated divisions" align="center">
            To deliver tailored excellence, TriWeb Solutions operates through two dedicated divisions.
          </SectionHeader>
          <div className="mt-12 grid gap-5 lg:grid-cols-2" data-reveal-group>
            <TiltCard division="media" spot="rgba(255,58,32,0.85)" max={4} className="flex flex-col p-8 sm:p-10">
              <Clapperboard className="h-7 w-7 text-vermilion" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold">TriWeb Media Productions</h3>
              <p className="serif mt-1 text-xl text-vermilion">Crafting stories, building brands, driving growth.</p>
              <dl className="mt-6 flex-1 space-y-4">
                <div>
                  <dt className="font-semibold">Complete brand identity & branding</dt>
                  <dd className="mt-1 text-mist">End-to-end brand creation, including custom logo design, visual themes and colour palettes, brand voice, mission, vision, and core strategic goals.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Industry specializations</dt>
                  <dd className="mt-1 text-mist">Cafes & restaurants, fashion & clothing brands, real estate, and Airbnb / short-term rental property marketing.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Core services</dt>
                  <dd className="mt-1 text-mist">Full-service ad production, social media handling & management, content creation, and performance digital marketing.</dd>
                </div>
              </dl>
              <div className="mt-8">
                <Button to="media" variant="warm">
                  Visit Media Productions
                </Button>
              </div>
            </TiltCard>
            <TiltCard division="software" spot="rgba(255,179,143,0.85)" max={4} className="flex flex-col p-8 sm:p-10">
              <Cpu className="h-7 w-7 text-ice" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold">TriWeb Software Company</h3>
              <p className="mt-1 text-xl font-semibold text-ice">Engineering the future of business.</p>
              <dl className="mt-6 flex-1 space-y-4">
                <div>
                  <dt className="font-semibold">What we do</dt>
                  <dd className="mt-1 text-mist">We equip businesses with robust digital infrastructure and modern automated workflows designed to scale operations effortlessly.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Core services</dt>
                  <dd className="mt-1 text-mist">Custom web development, intelligent AI automations, enterprise software solutions, and seamless system integrations.</dd>
                </div>
              </dl>
              <div className="mt-8">
                <Button to="software" variant="cool">
                  Visit Software Company
                </Button>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      <WhyChoose />
      <Process />
      <CTA />
    </Page>
  )
}
