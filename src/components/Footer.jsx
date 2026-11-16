import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import Logo from './Logo.jsx'
import { Link } from '../router.jsx'
import RollText from './RollText.jsx'
import { site } from '../data/site.js'
import { Instagram, Facebook, Linkedin, Youtube, TikTok, XLogo } from './SocialIcons.jsx'

const pages = [
  { to: '', label: 'Home' },
  { to: 'about', label: 'About' },
  { to: 'media', label: 'Media Productions' },
  { to: 'software', label: 'Software Company' },
  { to: 'work', label: 'Portfolio' },
  { to: 'contact', label: 'Contact' },
]
const services = [
  { to: 'media', label: 'Branding & logo design' },
  { to: 'media', label: 'Ad production' },
  { to: 'media', label: 'Social media management' },
  { to: 'software', label: 'Web development' },
  { to: 'software', label: 'AI automations' },
]
const icons = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube, tiktok: TikTok, x: XLogo }
const names = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok', x: 'X' }

export default function Footer() {
  const socials = Object.entries(site.social).filter(([, url]) => url)
  const { email, phone, location } = site.contact
  return (
    <footer className="relative border-t hairline bg-obsidian">
      <div className="container-x grid gap-12 pb-12 pt-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div className="group w-fit">
          <Logo />
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-mist">{site.description}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media">
              {socials.map(([k, url]) => {
                const Icon = icons[k]
                return (
                  <li key={k}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`TriWeb Solutions on ${names[k]}`} className="ico grid h-11 w-11 place-items-center rounded-xl border hairline transition hover:-translate-y-1 hover:border-vermilion hover:text-vermilion">
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <nav aria-label="Footer pages">
          <p className="font-semibold">Pages</p>
          <ul className="mt-4 space-y-2.5">
            {pages.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="roll-host text-[0.95rem] text-mist transition-colors hover:text-bone">
                  <RollText>{l.label}</RollText>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer services">
          <p className="font-semibold">Services</p>
          <ul className="mt-4 space-y-2.5">
            {services.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="roll-host text-[0.95rem] text-mist transition-colors hover:text-bone">
                  <RollText>{l.label}</RollText>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-semibold">Get in touch</p>
          <ul className="mt-4 space-y-3 text-[0.95rem] text-mist">
            <li className="flex items-start gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              {email ? (
                <a href={`mailto:${email}`} className="link-u hover:text-bone">
                  {email}
                </a>
              ) : (
                <span className="text-vermilion/90">Email address to be added</span>
              )}
            </li>
            {phone && (
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:${site.contact.phoneIntl || phone.replace(/\s/g, '')}`} className="link-u hover:text-bone">
                  {phone}
                </a>
              </li>
            )}
            {site.social.instagram && (
              <li className="flex items-start gap-3">
                <Instagram className="mt-1 h-4 w-4 shrink-0" />
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-u hover:text-bone">
                  {site.instagramHandle}
                </a>
              </li>
            )}
            {location && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                {location}
              </li>
            )}
          </ul>
          <Link to="contact" className="group mt-6 inline-flex items-center gap-2 font-semibold text-vermilion">
            <span className="link-u">Start a project</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="container-x flex flex-col gap-2 border-t hairline pb-24 pt-6 pr-20 text-sm text-mist sm:flex-row sm:justify-between sm:pb-6 sm:pr-24">
        <p>© {new Date().getFullYear()} TriWeb Solutions. All rights reserved.</p>
        <p className="serif text-base text-bone/70">{site.tagline}</p>
      </div>
    </footer>
  )
}
