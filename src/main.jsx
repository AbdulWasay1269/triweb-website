import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initJelly } from './lib/jelly.js'
import { upgradeLegacyUrl, currentRoute } from './lib/routes.js'
import { loadPage } from './pages/index.js'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Old #media-style links move to their clean address before anything renders
upgradeLegacyUrl()

console.info('%cTriWeb Solutions: build 2026-11-21c (No-GPU fallback)', 'color:#ff3a20;font-weight:bold')

initJelly()

// The first page's code (preloaded by its HTML) is ready before the first render
loadPage(currentRoute()).then(() =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
