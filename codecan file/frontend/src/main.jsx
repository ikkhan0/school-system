import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile-responsive.css'
import './print.css'
import './i18n/rtl.css' // RTL support
import './i18n' // Initialize i18n
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
