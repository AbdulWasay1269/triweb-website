import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initJelly } from './lib/jelly.js'
import { upgradeLegacyUrl } from './lib/routes.js'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Old #media-style links move to their clean address before anything renders
upgradeLegacyUrl()

console.info('%cTriWeb Solutions: build 2026-11-21a (Clean URLs)', 'color:#ff3a20;font-weight:bold')

initJelly()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
