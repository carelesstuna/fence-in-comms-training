/**
 * Fängt Fehler beim Anzeigen (auch in useMemo beim Würfeln) und zeigt statt einer weißen Seite
 * eine Fehlerseite: was passiert ist, Neu laden, Zur Startseite, Fortschritt sichern.
 */
import { Component, useState, type ErrorInfo, type ReactNode } from 'react'
import { downloadProgress } from '../state/transfer'
import { lastRunSeed } from '../ui/run'

interface Props {
  children: ReactNode
  /** Ändert sich der Wert (z. B. die Route), wird die Seite neu versucht. */
  resetKey?: string
  /** „Zur Startseite“ – ohne Angabe über die Adresszeile. */
  onHome?: () => void
  /** Ganze Seite statt Inhaltsbereich (Fehler außerhalb des Seitenrahmens). */
  fullPage?: boolean
}

interface State {
  error: Error | null
  route?: string
  seed?: string | null
  at?: string
  componentStack?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      route: window.location.hash.replace(/^#/, '') || '/',
      seed: lastRunSeed(),
      at: new Date().toISOString(),
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Fence In Comms Training: Fehler beim Anzeigen', error)
    this.setState({ componentStack: info.componentStack ?? undefined })
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.reset()
  }

  reset = () => this.setState({ error: null, componentStack: undefined })

  home = () => {
    if (this.props.onHome) this.props.onHome()
    else window.location.hash = '#/'
    this.reset()
  }

  render() {
    const { error, route, seed, at, componentStack } = this.state
    if (!error) return this.props.children
    const details = [
      `Fehler: ${error.name}: ${error.message}`,
      `Route: ${route}`,
      seed ? `Seed (letzter Durchlauf): ${seed}` : null,
      `Zeit: ${at}`,
      `Browser: ${navigator.userAgent}`,
      componentStack ? `\nKomponenten:${componentStack}` : null,
    ]
      .filter((x) => x !== null)
      .join('\n')
    const page = <ErrorPage details={details} onHome={this.home} />
    return this.props.fullPage ? <div className="mx-auto max-w-3xl px-4 py-10">{page}</div> : page
  }
}

function ErrorPage({ details, onHome }: { details: string; onHome: () => void }) {
  const [saved, setSaved] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard
      ?.writeText(details)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }
  const button = 'rounded-lg border border-line px-4 py-2 text-sm hover:bg-white/5'
  return (
    <div role="alert" className="rounded-xl border border-red-400/40 bg-panel p-6">
      <h1 className="text-xl font-semibold text-red-300">
        Diese Seite konnte nicht angezeigt werden
      </h1>
      <p className="mt-2 text-muted">
        Beim Aufbau der Seite ist ein Fehler aufgetreten. Der gespeicherte Fortschritt bleibt
        erhalten; eine gerade laufende Lektion oder Übung muss neu begonnen werden. Meist hilft es,
        die Seite neu zu laden oder zur Startseite zurückzukehren.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink transition hover:brightness-110"
        >
          Neu laden
        </button>
        <button type="button" onClick={onHome} className={button}>
          Zur Startseite
        </button>
        <button type="button" onClick={() => setSaved(downloadProgress())} className={button}>
          Fortschritt sichern (Export)
        </button>
      </div>
      {saved === true && (
        <p className="mt-3 text-sm text-phosphor">Die Sicherungsdatei wurde heruntergeladen.</p>
      )}
      {saved === false && (
        <p className="mt-3 text-sm text-red-300">
          Es gab nichts zu sichern oder der Download ist fehlgeschlagen.
        </p>
      )}
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-muted hover:text-text">Technische Details</summary>
        <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-xs whitespace-pre-wrap text-text">
          {details}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="mt-2 rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-text"
        >
          {copied ? '✓ Kopiert' : 'Details kopieren'}
        </button>
      </details>
    </div>
  )
}
