import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply Telegram theme CSS variables
const tg = (window as unknown as { Telegram?: { WebApp?: { themeParams?: Record<string, string> } } }).Telegram?.WebApp
if (tg?.themeParams) {
  const root = document.documentElement
  root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#051424')
  root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e4e1eb')
  root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#cbc3d7')
  root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#d0bcff')
  root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#d0bcff')
  root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#3c0091')
  root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#1f1f26')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
