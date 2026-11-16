import { useRef, useState } from 'react'
import { Check, Send, Plus, Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import { Instagram } from '../components/SocialIcons.jsx'
import Button from '../components/Button.jsx'
import { site } from '../data/site.js'

const interests = ['Media Productions', 'Software Company', 'Both divisions', 'Not sure yet']
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

function Field({ id, label, error, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-semibold text-bone/90">
        {label}
        {optional && <span className="text-xs font-normal text-mist">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-ember" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm() {
  const [v, setV] = useState({ name: '', email: '', company: '', interest: 'Not sure yet', message: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle')
  const formRef = useRef(null)
  const trap = useRef(null)
  const [ref, setRef] = useState('')

  const validate = (val) => {
    const e = {}
    if (val.name.trim().length < 2) e.name = 'Enter your name.'
    if (!val.email.trim()) e.email = 'Enter your email address.'
    else if (!emailOk(val.email)) e.email = 'Enter an email address like name@example.com.'
    if (val.message.trim().length < 10) e.message = 'Tell us a little about your project (at least 10 characters).'
    return e
  }
  const set = (k) => (ev) => {
    const next = { ...v, [k]: ev.target.value }
    setV(next)
    if (touched[k]) setErrors(validate(next))
  }
  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors(validate(v))
  }
  const submit = async (ev) => {
    ev.preventDefault()
    const e = validate(v)
    setErrors(e)
    setTouched({ name: true, email: true, message: true })
    if (Object.keys(e).length) {
      formRef.current.querySelector(`#cf-${Object.keys(e)[0]}`)?.focus()
      return
    }
    const subject = `New project enquiry: ${v.interest}`
    const body = `Name: ${v.name}\nEmail: ${v.email}\nCompany: ${v.company || '-'}\nInterested in: ${v.interest}\n\n${v.message}`
    const mailto = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Preferred: straight into the Google Sheet
    if (site.contact.sheetEndpoint) {
      setStatus('sending')
      const payload = JSON.stringify({
        sid: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        name: v.name.trim(),
        email: v.email.trim(),
        company: v.company.trim(),
        interest: v.interest,
        message: v.message.trim(),
        website: trap.current?.value || '',
        page: location.href,
        agent: navigator.userAgent,
      })
      // text/plain keeps this a "simple" request that Google Apps Script accepts
      const send = (mode, signal) => fetch(site.contact.sheetEndpoint, { method: 'POST', mode, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload, signal })
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 20000)
      try {
        const out = await (await send('cors', ctrl.signal)).json()
        if (!out.ok) throw new Error(out.error || 'not_saved')
        setRef(out.ref || '')
        setStatus('saved')
      } catch (err) {
        if (err?.name === 'TypeError') {
          // Some browsers can't read Google's reply. Send again without reading it;
          // the sheet ignores the copy if the first one already arrived.
          try {
            await send('no-cors', ctrl.signal)
            setRef('')
            setStatus('saved')
          } catch {
            setStatus('failed')
          }
        } else setStatus('failed')
      } finally {
        clearTimeout(timer)
      }
      return
    }

    if (!site.contact.email) {
      setStatus('unconfigured')
      return
    }
    window.location.href = mailto
    setStatus('sent')
  }

  const input = 'w-full rounded-xl border bg-obsidian/70 px-4 py-3.5 text-bone placeholder:text-mist/60 outline-none transition-all duration-300 hover:border-bone/30 focus:border-vermilion focus:shadow-[0_0_0_4px_rgba(255,58,32,0.15)]'
  const border = (k) => (errors[k] && touched[k] ? 'border-ember/70' : 'border-bone/15')

  if (status === 'saved')
    return (
      <div className="flex min-h-[420px] flex-col items-start justify-center gap-4" role="status">
        <span className="ico grid h-14 w-14 place-items-center rounded-full bg-ice text-obsidian">
          <Check className="h-6 w-6" />
        </span>
        <p className="text-2xl font-bold">Thanks, {v.name.trim().split(/\s+/)[0]}. Your message has been sent.</p>
        <p className="text-mist">
          We'll reply to {v.email.trim()} as soon as possible.{ref && <> Your reference is <span className="font-semibold text-bone">{ref}</span>.</>}
        </p>
        <button
          className="mt-2 text-sm font-semibold text-vermilion underline-offset-4 hover:underline"
          onClick={() => {
            setV({ name: '', email: '', company: '', interest: 'Not sure yet', message: '' })
            setTouched({})
            setErrors({})
            setStatus('idle')
          }}
        >
          Send another message
        </button>
      </div>
    )

  if (status === 'sent')
    return (
      <div className="flex min-h-[420px] flex-col items-start justify-center gap-4" role="status">
        <span className="ico grid h-14 w-14 place-items-center rounded-full bg-ice text-obsidian">
          <Check className="h-6 w-6" />
        </span>
        <p className="text-2xl font-bold">Your email app has opened with the message ready.</p>
        <p className="text-mist">Press send there and we'll reply as soon as possible. Nothing opened? Write to us at {site.contact.email}.</p>
        <button className="mt-2 text-sm font-semibold text-vermilion underline-offset-4 hover:underline" onClick={() => setStatus('idle')}>
          Edit the message
        </button>
      </div>
    )

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2" aria-label="Project enquiry">
      <Field id="cf-name" label="Your name" error={touched.name && errors.name}>
        <input id="cf-name" className={`${input} ${border('name')}`} value={v.name} onChange={set('name')} onBlur={blur('name')} autoComplete="name" aria-invalid={!!(touched.name && errors.name)} aria-describedby="cf-name-err" placeholder="Jane Smith" />
      </Field>
      <Field id="cf-email" label="Email" error={touched.email && errors.email}>
        <input id="cf-email" type="email" className={`${input} ${border('email')}`} value={v.email} onChange={set('email')} onBlur={blur('email')} autoComplete="email" aria-invalid={!!(touched.email && errors.email)} aria-describedby="cf-email-err" placeholder="jane@company.com" />
      </Field>
      <div className="sm:col-span-2">
        <Field id="cf-company" label="Business name" optional>
          <input id="cf-company" className={`${input} border-bone/15`} value={v.company} onChange={set('company')} autoComplete="organization" />
        </Field>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-semibold text-bone/90">I'm interested in</legend>
        <div className="flex flex-wrap gap-2">
          {interests.map((o) => (
            <label
              key={o}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ice ${
                v.interest === o ? 'bg-vermilion text-obsidian' : 'bg-white/5 text-mist ring-1 ring-inset ring-bone/10 hover:text-bone'
              }`}
            >
              <input type="radio" name="interest" value={o} checked={v.interest === o} onChange={set('interest')} className="sr-only" />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <Field id="cf-message" label="About your project" error={touched.message && errors.message}>
          <textarea
            id="cf-message"
            rows={5}
            className={`${input} resize-y ${border('message')}`}
            value={v.message}
            onChange={set('message')}
            onBlur={blur('message')}
            placeholder="What are you building, and where do you want it to go?"
            aria-invalid={!!(touched.message && errors.message)}
            aria-describedby="cf-message-err"
          />
        </Field>
      </div>
      <div className="flex flex-col items-start gap-4 sm:col-span-2">
        {/* Spam trap: hidden from people, bots fill it in */}
        <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
        <Button type="submit" icon={Send} size="lg" disabled={status === 'sending'} aria-busy={status === 'sending'} className={status === 'sending' ? 'pointer-events-none opacity-70' : ''}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
        {status === 'failed' && (
          <div className="text-sm text-bone/90" role="alert">
            <p className="font-semibold text-vermilion">Your message didn't go through. Your details are still here, so please try again.</p>
            <p className="mt-1 text-mist">
              Or send it another way:{' '}
              <a className="link-u text-bone" href={`mailto:${site.contact.email}?subject=${encodeURIComponent(`New project enquiry: ${v.interest}`)}&body=${encodeURIComponent(`Name: ${v.name}\nEmail: ${v.email}\nCompany: ${v.company || '-'}\nInterested in: ${v.interest}\n\n${v.message}`)}`}>
                by email
              </a>
              {site.contact.whatsapp && (
                <>
                  {' '}or{' '}
                  <a className="link-u text-bone" href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(`Hi TriWeb, I'm ${v.name}. ${v.message}`)}`} target="_blank" rel="noopener noreferrer">
                    on WhatsApp
                  </a>
                </>
              )}
              .
            </p>
          </div>
        )}
        {status === 'unconfigured' && (
          <p className="text-sm text-vermilion" role="alert">
            The contact email hasn't been set up yet. Add it in src/data/site.js.
          </p>
        )}
      </div>
    </form>
  )
}

export function ContactDetails() {
  const { email, phone, location } = site.contact
  const row = 'flex items-start gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.04]'
  const icon = 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-vermilion/12 text-vermilion ring-1 ring-vermilion/25'
  return (
    <ul className="space-y-2">
      <li className={row}>
        <span className={icon}>
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm text-mist">Email</span>
          {email ? (
            <a href={`mailto:${email}`} className="link-u text-lg font-semibold">
              {email}
            </a>
          ) : (
            <span className="text-lg font-semibold text-vermilion">Email address to be added</span>
          )}
        </span>
      </li>
      {phone && (
        <li className={row}>
          <span className={icon}>
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm text-mist">Phone</span>
            <a href={`tel:${site.contact.phoneIntl || phone.replace(/\s/g, '')}`} className="link-u text-lg font-semibold">
              {phone}
            </a>
          </span>
        </li>
      )}
      {site.contact.whatsapp && (
        <li className={row}>
          <span className={icon}>
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm text-mist">WhatsApp</span>
            <a href={`https://wa.me/${site.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-u text-lg font-semibold">
              Chat on WhatsApp
            </a>
          </span>
        </li>
      )}
      {site.social.instagram && (
        <li className={row}>
          <span className={icon}>
            <Instagram className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm text-mist">Instagram</span>
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-u text-lg font-semibold">
              {site.instagramHandle}
            </a>
          </span>
        </li>
      )}
      {location && (
        <li className={row}>
          <span className={icon}>
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm text-mist">Location</span>
            <span className="text-lg font-semibold">{location}</span>
          </span>
        </li>
      )}
      <li className={row}>
        <span className={icon}>
          <Clock className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm text-mist">Working with clients</span>
          <span className="text-lg font-semibold">Across multiple countries, including the United States</span>
        </span>
      </li>
    </ul>
  )
}

const faqs = [
  ['What is the difference between TriWeb Media Productions and TriWeb Software Company?', 'Media Productions handles everything people see and feel about your brand: branding, logo design, ad production, video editing, social media management and digital marketing. Software Company builds the systems behind your business: websites, web applications, e-commerce, AI automations and system integrations.'],
  ['Can I work with both divisions on one project?', 'Yes. Many clients start with a brand identity and content from Media Productions, then add a website or automated workflows from Software Company. You get one team and one point of contact across both.'],
  ['Which industries do you specialize in?', 'Our media work focuses on cafes and restaurants, fashion and clothing brands, real estate, and Airbnb or short-term rental properties. Our software services work for any business that wants to operate more efficiently.'],
  ['Do you work with clients in other countries?', 'Yes. TriWeb Solutions works with businesses across multiple countries, including the United States, and runs projects remotely with clear communication at every step.'],
  ['Can you manage our social media accounts on an ongoing basis?', 'Yes. Social media handling and management is one of our core media services, alongside content creation, campaign strategy and performance marketing.'],
  ['What can an AI automation do for my business?', 'Typical automations answer common customer questions, sort and reply to emails, record leads and bookings in your CRM or spreadsheets, and alert your team when a person needs to step in. We design each workflow around the tools you already use.'],
  ['How does a project start?', "Send us a message using the form. We'll learn about your business and goals in a discovery conversation, then come back with a tailored strategy and proposal."],
]

export function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <ul className="space-y-3" data-reveal-group>
      {faqs.map(([q, a], i) => {
        const on = open === i
        return (
          <li key={q} className={`card overflow-hidden transition-colors duration-500 ${on ? 'border-vermilion/40' : 'hover:border-bone/20'}`}>
            <h3>
              <button id={`faq-q-${i}`} aria-expanded={on} aria-controls={`faq-a-${i}`} onClick={() => setOpen(on ? -1 : i)} className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left">
                <span className="text-[1.05rem] font-semibold leading-snug sm:text-lg">{q}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 ${on ? 'rotate-45 bg-vermilion text-obsidian' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-expo)] ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="px-6 pb-6 leading-relaxed text-mist">{a}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
