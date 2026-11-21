import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PAGES, OG_IMAGE } from './src/data/seo.js'
import { site } from './src/data/site.js'

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
function seoPages() {
  let outDir = 'dist'
  const home = PAGES.find((p) => p.key === '')
  return {
    name: 'triweb-seo-pages',
    configResolved(c) {
      outDir = c.build.outDir
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!--seo-->', seoTags(home)).replaceAll('__SITE_URL__', SITE_URL),
    },
    closeBundle() {
      const base = readFileSync(join(outDir, 'index.html'), 'utf8')
      const homeTags = seoTags(home)
      for (const page of PAGES) {
        if (page.key === '') continue
        writeFileSync(join(outDir, `${page.path.slice(1)}.html`), base.replace(homeTags, seoTags(page)))
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
