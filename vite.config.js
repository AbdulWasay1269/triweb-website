import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PAGES, OG_IMAGE } from './src/data/seo.js'
import { site } from './src/data/site.js'
import { LOGO_W, LOGO_H, LOGO_PATH } from './src/components/logoPath.js'

/**
 * The live web address, used for canonical links, the sitemap and share previews.
 * Order: SITE_URL environment variable → site.url in src/data/site.js →
 * the project's main domain on Vercel. When none is known (a local build),
 * address-dependent tags are left out rather than pointing at the wrong site.
 */
const SITE_URL = (
  process.env.SITE_URL ||
  site.url ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/+$/, '')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The <head> tags for one page. */
function seoTags(page, { noindex = false } = {}) {
  const url = SITE_URL + page.path
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`,
    noindex || !SITE_URL ? '' : `<link rel="canonical" href="${url}" />`,
    SITE_URL ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${SITE_URL}${OG_IMAGE}" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/**
 * Writes a real HTML file for every page (about.html, media.html, …) with its own
 * title, description and canonical link, plus 404.html, sitemap.xml and robots.txt.
 * Each page therefore opens directly, survives a refresh and previews correctly
 * when shared, even before any JavaScript runs.
 */
const PAGE_FILES = { about: 'About', media: 'Media', software: 'Software', work: 'Portfolio', contact: 'Contact' }

function seoPages() {
  let outDir = 'dist'
  const home = PAGES.find((p) => p.key === '')
  const pageChunks = {} // page key → its JS files, so each page's HTML can fetch them straight away
  let brandFont = '' // the Outfit (Latin) font file, preloaded so text appears in the brand font from the start
  return {
    name: 'triweb-seo-pages',
    configResolved(c) {
      outDir = c.build.outDir
    },
    generateBundle(_, bundle) {
      brandFont = Object.keys(bundle).find((f) => /outfit-latin-wght-normal.*\.woff2$/.test(f)) || ''
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')
      const byName = Object.fromEntries(chunks.map((c) => [c.fileName, c]))
      const entry = chunks.find((c) => c.isEntry)
      const inEntry = new Set([entry.fileName, ...entry.imports])
      for (const [key, file] of Object.entries(PAGE_FILES)) {
        const chunk = chunks.find((c) => c.facadeModuleId?.endsWith(`/src/pages/${file}.jsx`))
        if (!chunk) continue
        const files = new Set([chunk.fileName])
        const add = (c) => c.imports.forEach((f) => !inEntry.has(f) && !files.has(f) && (files.add(f), add(byName[f])))
        add(chunk)
        pageChunks[key] = [...files]
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace('<!--seo-->', seoTags(home))
          .replaceAll('__SITE_URL__', SITE_URL)
          .replace('<!--splash-logo-->', `<svg viewBox="0 0 ${LOGO_W} ${LOGO_H}"><rect width="${LOGO_W}" height="${LOGO_H}" fill="#ff3a20"/><path d="${LOGO_PATH}" fill="#fff"/></svg>`),
    },
    closeBundle() {
      let base = readFileSync(join(outDir, 'index.html'), 'utf8')
      if (brandFont) {
        base = base.replace('<meta name="theme-color"', `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${brandFont}" />\n    <meta name="theme-color"`)
        writeFileSync(join(outDir, 'index.html'), base)
      }
      const homeTags = seoTags(home)
      for (const page of PAGES) {
        if (page.key === '') continue
        const preload = (pageChunks[page.key] || []).map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`).join('\n    ')
        writeFileSync(join(outDir, `${page.path.slice(1)}.html`), base.replace(homeTags, seoTags(page)).replace('</head>', `    ${preload}\n  </head>`))
      }
      writeFileSync(join(outDir, '404.html'), base.replace(homeTags, seoTags(home, { noindex: true })))
      if (!SITE_URL) {
        writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n`)
        this.warn('No site address known, so no sitemap.xml or canonical links were written. Set url in src/data/site.js (Vercel builds fill it in automatically).')
        return
      }
      const today = new Date().toISOString().slice(0, 10)
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          PAGES.map((p) => `  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.key === '' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n') +
          `\n</urlset>\n`,
      )
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
    },
  }
}

export default defineConfig({
  // Absolute asset paths, needed now that pages live at /about, /media and so on
  base: '/',
  plugins: [react(), tailwindcss(), seoPages()],
  define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(SITE_URL) },
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  // A dedicated address, so an older copy of the site still running on Vite's
  // default port (5173) can never be mistaken for this one. Opens automatically.
  server: { port: 5190, strictPort: true, open: true },
  preview: { port: 5191, strictPort: true, open: true },
})
