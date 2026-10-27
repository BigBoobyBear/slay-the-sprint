import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (Latin subset): no render-blocking third-party CSS.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/kreon/latin-400.css'
import '@fontsource/kreon/latin-700.css'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) void import('./dev')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
