import Page from '../components/Page.jsx'
import { PageHero, SectionHeader } from '../components/UI.jsx'
import { ContactForm, ContactDetails, FAQ } from '../blocks/ContactBlocks.jsx'

export default function Contact() {
  return (
    <Page>
      <PageHero label="Contact" tone="uv" title={<>Ready to build & scale your brand?</>}>
        Let's shape the future of your business together. Tell us what you need and the right division will get back to you.
      </PageHero>

      <section className="pb-20" aria-label="Contact form">
        <div data-push className="container-x grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="card p-6 sm:p-10" data-reveal>
            <h2 className="h-card">Tell us about your project</h2>
            <p className="mt-2 text-mist">It takes about a minute.</p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
          <div className="card p-4 sm:p-6" data-reveal data-delay="0.1">
            <ContactDetails />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="lg:sticky lg:top-32">
              <SectionHeader id="faq-title" label="FAQ" tone="uv" title="Questions, answered" />
            </div>
          </div>
          <FAQ />
        </div>
      </section>
    </Page>
  )
}
