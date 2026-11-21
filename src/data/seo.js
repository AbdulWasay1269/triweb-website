/**
 * ============================================================
 *  PAGES & SEO — one entry per page.
 * ============================================================
 *  key          internal page name used by the code (don't change)
 *  path         the clean web address of the page
 *  title        browser-tab and Google title (aim for under ~60 characters)
 *  description  Google snippet and share text (aim for ~150 characters)
 *
 *  This file is also read at build time to write each page's own HTML,
 *  sitemap.xml and robots.txt, so keep it plain JavaScript.
 */
export const PAGES = [
  {
    key: '',
    path: '/',
    label: 'Home',
    title: 'TriWeb Solutions | Media Production & Software Agency',
    description:
      'TriWeb Solutions builds brands and engineers digital infrastructure: branding, ad production and video through TriWeb Media Productions, websites and AI automation through TriWeb Software Company.',
  },
  {
    key: 'about',
    path: '/about',
    label: 'About',
    title: 'About TriWeb Solutions | Our Story, Team & Two Divisions',
    description:
      'Founded by three friends, TriWeb Solutions is a parent company with two specialised divisions: TriWeb Media Productions for brands and video, and TriWeb Software Company for websites and AI automation.',
  },
  {
    key: 'media',
    path: '/media',
    label: 'Media Productions',
    title: 'TriWeb Media Productions | Branding, Ads & Video Production',
    description:
      'Branding and logo design, ad production, short-form video and digital marketing by TriWeb Media Productions. See our restaurant, fashion and real estate campaigns.',
  },
  {
    key: 'software',
    path: '/software',
    label: 'Software Company',
    title: 'TriWeb Software Company | Web Development & AI Automation',
    description:
      'Custom websites, web apps and AI automations by TriWeb Software Company, built to save your team time and help your business grow.',
  },
  {
    key: 'work',
    path: '/portfolio',
    label: 'Portfolio',
    title: 'Portfolio | TriWeb Solutions Client Work',
    description:
      'Real client work from TriWeb Solutions: brand films, social ads and short-form reels for restaurants, fashion and real estate businesses.',
  },
  {
    key: 'contact',
    path: '/contact',
    label: 'Contact',
    title: 'Contact TriWeb Solutions | Start Your Project',
    description:
      'Tell us about your project. Reach TriWeb Solutions by form, WhatsApp, phone or email for branding, video, websites and AI automation.',
  },
]

/** Old addresses that still work: they send visitors to the new page. */
export const ALIASES = { work: 'work', portfolio: 'work', home: '', index: '' }

export const OG_IMAGE = '/og-image.jpg'
