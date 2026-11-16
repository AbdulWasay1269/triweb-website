import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initJelly } from './lib/jelly.js'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

console.info('%cTriWeb Solutions: build 2026-11-16h (Sheet connected)', 'color:#ff3a20;font-weight:bold')

initJelly()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
