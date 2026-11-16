/**
 * ============================================================
 *  AUTOMATION CASE STUDIES — shown on the Software page and in
 *  the Portfolio under "Software". Text and figures are taken
 *  exactly from the supplied case-study screenshots.
 * ============================================================
 *  To link a card to its own page, add  url: 'https://...'
 *  (otherwise "Learn more" opens CASE_STUDIES_URL).
 */
export const CASE_STUDIES_URL = 'https://abdullahmustafa.site'

export const caseCategories = [
  { id: 'all', label: 'All case studies' },
  { id: 'leads', label: 'Lead generation & sales' },
  { id: 'content', label: 'Content & marketing' },
  { id: 'ops', label: 'Operations & HR' },
]

export const caseStudies = [
  {
    n: '01', title: 'FASSET', category: 'leads', icon: 'inbox',
    points: ['AI inbound lead handling, start to finish', 'Automated prospecting research per lead', 'Custom CRM with real-time pipeline tracking'],
    stats: [['−97%', 'Response time'], ['3×+', 'Pipeline capacity'], ['−90%', 'Manual sales effort']],
  },
  {
    n: '02', title: 'ARD Global', category: 'ops', icon: 'fingerprint',
    points: ['WhatsApp HR agent, live 24/7', 'Multilingual — Urdu, English, Punjabi', 'Fingerprint attendance tracking, 100% accurate'],
    stats: [['−85%', 'HR query handling time'], ['100%', 'Attendance accuracy'], ['−70%', 'Leave processing time']],
  },
  {
    n: '03', title: 'Axiom Strat Cap', category: 'content', icon: 'video',
    points: ['Fully automated, end-to-end VSL pipeline', 'Voice-cloned via ElevenLabs, stitched via FFmpeg', '15-minute end-to-end delivery'],
    stats: [['−98%', 'VSL production time'], ['Zero', 'Camera hours per lead'], ['∞', 'Pipeline scalability']],
  },
  {
    n: '04', title: 'crypto.pk · ethereum.pk', category: 'content', icon: 'newspaper',
    points: ['Daily content generation, zero missed days', 'Automated scraping + sentiment analysis pipeline', 'SEO-optimised through multi-pass review'],
    stats: [['−95%', 'Content production time'], ['Daily', 'Publishing consistency'], ['85+', 'Avg. SEO score']],
  },
  {
    n: '05', title: 'Ad Intelligence Engine', category: 'content', icon: 'radar',
    points: ['Scrapes the Meta Ads library, niche-wide', 'Per-platform hook + sentiment analysis', 'Repurposes winning ads in your brand voice'],
    stats: [['Continuous', 'Niche coverage'], ['Evidence-first', 'Campaign briefs'], ['Zero', 'Straight copies shipped']],
  },
  {
    n: '06', title: 'R-Space', category: 'ops', icon: 'dashboard',
    points: ['One-click task completion, zero training', 'Timestamped logs build the report automatically', 'Individual, team & quarterly dashboards'],
    stats: [['2nd branch', 'Launched'], ['Zero', 'Training required'], ['Daily', 'Automatic reports']],
  },
  {
    n: '07', title: 'Worldwide Waves — Instagram', category: 'leads', icon: 'at',
    points: ['Seed one account, get a filtered lead list', "Automatic filtering against the firm's criteria", 'Deep research + personalized opener per lead'],
    stats: [['~10 min', 'Per account (was 1 day)'], ['1 seed', 'Starts the full pipeline'], ['0', 'Generic openers sent']],
  },
  {
    n: '08', title: 'Worldwide Waves — Cold Calling', category: 'leads', icon: 'phone',
    points: ["Apollo pull scripted to the firm's filter", 'Double-filtered for tight profile fit', 'Phonebook interface, not a CRM to dig through'],
    stats: [['2-pass', 'Filtering before the dial'], ['0', 'Hallucinated details'], ['100%', 'Call-ready context']],
  },
  {
    n: '09', title: 'Apex Technologies', category: 'leads', icon: 'layers',
    points: ['6 platforms scraped in one coordinated pass', 'Keyword-filtered for genuine reader intent', '2-pass enrichment — every lead contactable'],
    stats: [['6', 'Platforms covered'], ['2-pass', 'Email enrichment'], ['1 sheet', 'Single source of truth']],
  },
  {
    n: '10', title: 'Smile More Solutions', category: 'leads', icon: 'map',
    points: ['Targeted Google Maps scraping by client filter', 'Full enrichment — socials, email, phone', 'Writes straight into GoHighLevel, ready to work'],
    stats: [['Full contact', 'Every kept lead'], ['Direct', 'CRM write, no import step'], ['0', 'Manual enrichment steps']],
  },
  {
    n: '11', title: 'Content Engine', category: 'content', icon: 'pen',
    points: ['Scans the site and runs a full SEO audit itself', 'Turns findings into plain-language topics to approve', 'Writes, illustrates & publishes to WordPress automatically'],
    stats: [['1 click', 'Human involvement'], ['Audit-grounded', 'Every topic'], ['Zero', 'Manual publishing steps']],
  },
]
