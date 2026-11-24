import { lazy, Suspense } from 'react'
import { Code2, Workflow, Building2, Plug, Headset, MailCheck, CalendarCheck, Database, FileBarChart, UserPlus, Check } from 'lucide-react'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { PageHero, SectionHeader, TiltCard, CTA, Marquee } from '../components/UI.jsx'
import { BrowserVisual, WorkflowVisual } from '../visuals/SoftwareVisuals.jsx'
import CaseStudies from '../blocks/CaseStudies.jsx'

const NetworkGlobe = lazy(() => import('../three/NetworkGlobe.jsx'))

const services = [
  {
    id: 'web',
    Icon: Code2,
    label: 'Web development',
    title: 'Websites and web apps that turn visitors into customers',
    points: ['Modern business websites', 'Custom web applications', 'Responsive website development', 'E-commerce solutions', 'Professional UI/UX experiences'],
    Visual: BrowserVisual,
    hint: 'Try it: switch between desktop and mobile, or peel back the design to the wireframe.',
  },
  {
    id: 'ai',
    Icon: Workflow,
    label: 'AI automations',
    title: 'Intelligent workflows that answer, sort, record and follow up for you',
    points: ['AI-powered business workflows', 'Intelligent AI agents', 'Customer support automation', 'Email automation', 'Business process automation', 'System integrations'],
    Visual: WorkflowVisual,
    hint: 'Try it: select any step of the workflow to see what it does.',
  },
]

const useCases = [
  { Icon: Headset, t: 'Customer support assistant', d: 'Answers common questions instantly on your website, inbox or social channels.' },
  { Icon: MailCheck, t: 'Email automation', d: 'Sorts incoming mail, drafts replies and sends follow-ups on time.' },
  { Icon: UserPlus, t: 'Lead capture', d: 'New enquiries land in your CRM with the details already filled in.' },
  { Icon: CalendarCheck, t: 'Bookings & reservations', d: 'Confirmations, reminders and calendar updates without manual work.' },
  { Icon: Database, t: 'Data entry', d: 'Orders and forms flow straight into spreadsheets and business systems.' },
  { Icon: FileBarChart, t: 'Reporting', d: 'Regular summaries compiled and delivered to your team automatically.' },
]

export default function Software() {
  return (
    <Page>
      <PageHero
        horizon="neon"
        label="TriWeb Software Company"
        tone="cool"
        title={
          <>
            Engineering the future <span className="text-ice">of business.</span>
          </>
        }
        aside={
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <div className="absolute inset-[14%] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,61,0.35),transparent)] blur-2xl" aria-hidden="true" />
            <Suspense fallback={null}>
              <NetworkGlobe />
            </Suspense>
          </div>
        }
        actions={
          <>
            <Button to="contact" variant="cool" size="lg">
              Discuss your project
            </Button>
            <Button to="software" section="case-studies" variant="ghost" size="lg">
              See case studies
            </Button>
          </>
        }
      >
        We equip businesses with robust digital infrastructure and intelligent automated workflows designed to simplify operations, improve efficiency, and scale businesses effortlessly.
      </PageHero>

      <div className="border-y hairline bg-obsidian/85 py-5">
        <Marquee speed={50} className="font-mono text-[clamp(1rem,1.6vw,1.3rem)] text-ice/85" items={['websites', 'web apps', 'e-commerce', 'ai agents', 'workflow automation', 'system integrations', 'ui/ux']} />
      </div>

      {services.map((s, i) => (
        <section key={s.id} className="section" aria-labelledby={`sw-${s.id}`}>
          <div className={`container-x grid items-center gap-12 lg:gap-16 ${i % 2 ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'}`}>
            <div className={i % 2 ? 'lg:order-2' : ''}>
              <SectionHeader id={`sw-${s.id}`} label={s.label} tone="cool" title={s.title} />
              <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2" data-reveal-group>
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ice/12 ring-1 ring-ice/30">
                      <Check className="h-3.5 w-3.5 text-ice" aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-mist" data-reveal>
                {s.hint}
              </p>
            </div>
            <div className={`relative ${s.id === 'web' ? 'min-h-[420px] sm:min-h-[500px]' : 'h-[660px] sm:h-[520px]'}`} data-push>
              <s.Visual />
            </div>
          </div>
        </section>
      ))}

      <CaseStudies />

      <section className="section" aria-labelledby="usecases-title">
        <div className="container-x">
          <SectionHeader id="usecases-title" label="What we automate" tone="cool" title="Automations that give you time back" align="center">
            Typical workflows we design and connect to the tools you already use.
          </SectionHeader>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {useCases.map(({ Icon, t, d }) => (
              <TiltCard key={t} division="software" spot="rgba(255,179,143,0.8)" className="group p-7">
                <span className="ico grid h-12 w-12 place-items-center rounded-xl bg-ice/10 text-ice ring-1 ring-ice/25 transition-all duration-500 group-hover:bg-ice group-hover:text-obsidian">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-[0.95rem] text-mist">{d}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Enterprise software and integrations">
        <div className="container-x grid gap-5 md:grid-cols-2" data-reveal-group>
          {[
            { Icon: Building2, t: 'Enterprise software solutions', d: 'Custom internal tools and platforms shaped around how your business actually operates.' },
            { Icon: Plug, t: 'Seamless system integrations', d: 'Your website, CRM, payments, inbox and spreadsheets connected so data flows without manual work.' },
          ].map(({ Icon, t, d }) => (
            <TiltCard key={t} division="software" spot="rgba(255,106,61,0.85)" className="group overflow-hidden p-9">
              <div className="blueprint absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-60" aria-hidden="true" />
              <Icon className="relative h-8 w-8 text-steel" aria-hidden="true" />
              <h3 className="h-card relative mt-6">{t}</h3>
              <p className="relative mt-2 max-w-md text-mist">{d}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      <CTA />
    </Page>
  )
}
