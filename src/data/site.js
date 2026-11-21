/**
 * ============================================================
 *  SITE SETTINGS — edit this file to update contact details.
 * ============================================================
 *  Anything left as an empty string is hidden on the site
 *  (no fake emails, numbers or social accounts are ever shown).
 */
export const site = {
  name: 'TriWeb Solutions',
  // Your live web address, e.g. 'https://triwebsolutions.com'. Optional: when the site
  // is built on Vercel it uses the project's main domain automatically.
  url: '',
  instagramHandle: '@triwebsolutions',
  tagline: 'Creative Excellence. Intelligent Technology. Limitless Growth.',
  description:
    'A parent company with two specialized divisions: TriWeb Media Productions builds brands and visual media, and TriWeb Software Company engineers websites and AI automations.',

  contact: {
    email: 'triwebinnovations@gmail.com',
    // Shown as written; the tel: link uses the international form below
    phone: '0323 1554573',
    phoneIntl: '+923231554573',
    // WhatsApp number, digits only with country code. Clear it to hide the WhatsApp button.
    whatsapp: '923231554573',
    // Optional, e.g. 'Lahore, Pakistan · Serving clients in the US and beyond'
    location: '',
    // Google Sheet that receives the contact form (see google-sheet-setup/SETUP.txt).
    // Paste the web app link that ends in /exec. Leave empty to fall back to opening the visitor's email app.
    sheetEndpoint: 'https://script.google.com/macros/s/AKfycbzEOLWunk0SEu05U02LJw9W8fnNUAL8GBd3hPMB_vjnse9kX8Rx5DmJ7S7NDSKXW3yajg/exec',
  },

  // Full profile URLs. Empty entries are not displayed.
  social: {
    instagram: 'https://www.instagram.com/triwebsolutions/',
    facebook: '',
    linkedin: '',
    tiktok: '',
    youtube: '',
    x: '',
  },
}

export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Media', href: '#media' },
  { label: 'Software', href: '#software' },
  { label: 'Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
]
