import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setupBlankLinks, setupDesktopStorage } from './platform/desktop'

// In der Desktop-App muss der Datei-Spiegel stehen, bevor der Store seinen Stand lädt –
// deshalb wird die App erst danach importiert. Im Browser passiert dabei nichts.
async function start() {
  // Links mit target="_blank" in der Desktop-App (zweites Fenster, Systembrowser); im Browser ohne Wirkung
  setupBlankLinks()
  try {
    await setupDesktopStorage()
  } catch (e) {
    console.warn('Fence In Comms Training: Datei-Spiegel nicht verfügbar.', e)
  }
  const { default: App } = await import('./App')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
