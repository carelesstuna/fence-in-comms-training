/**
 * Desktop-App: ein fehlendes Modell auf Klick nachladen – von der Originalquelle (Hugging Face,
 * fester Stand), mit Fortschritt und Abbrechen. Rust prüft Größe und SHA-256, erst dann liegt die
 * Datei im eigenen Modell-Ordner. Ohne Klick geht die App nie ins Internet.
 */
import { useEffect, useState } from 'react'
import { whisperModel } from '../../platform/whisper-config'
import {
  asrStatus,
  cancelDownload,
  downloadModel,
  openModelDir,
  type AsrModelStatus,
} from '../../platform/whisper-recognizer'

const mb = (bytes: number) => `${Math.round(bytes / 1e6)} MB`

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; done: number; total: number; retry?: string }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

/**
 * `onDone`: Das Modell liegt geprüft im Ordner. Die Bestätigung zeigt der Aufrufer weiter an – dieser
 * Kasten verschwindet, sobald das Modell als vorhanden gilt.
 */
export function ModelDownload({ modelId, onDone }: { modelId: string; onDone: () => void }) {
  const [status, setStatus] = useState<{ model: AsrModelStatus; dir: string } | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  useEffect(() => {
    let cancelled = false
    asrStatus()
      .then((s) => {
        const model = s.models.find((m) => m.id === modelId)
        if (!cancelled && model) setStatus({ model, dir: s.modelDir })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [modelId])

  if (!status || status.model.path) return null
  const label = whisperModel(modelId)?.label ?? modelId
  const { model, dir } = status

  const start = () => {
    // Fortschritt über alle Dateien (large-v3-turbo bringt das VAD-Modell mit)
    const doneByFile = new Map<string, number>()
    setPhase({ kind: 'loading', done: 0, total: model.download })
    const done = () => [...doneByFile.values()].reduce((a, b) => a + b, 0)
    downloadModel(modelId, (e) => {
      if (e.kind === 'progress') {
        doneByFile.set(e.file, e.done)
        setPhase({ kind: 'loading', done: done(), total: model.download })
      } else if (e.kind === 'retry') {
        setPhase({
          kind: 'loading',
          done: done(),
          total: model.download,
          retry: `Verbindung abgerissen – geht an derselben Stelle weiter (${e.attempt}/${e.max}) …`,
        })
      }
    })
      .then(() => {
        setPhase({ kind: 'done' })
        onDone()
      })
      .catch((e: unknown) =>
        setPhase({ kind: 'error', message: e instanceof Error ? e.message : String(e) }),
      )
  }

  if (phase.kind === 'done') return <ModelLoaded label={label} />

  return (
    <div className="space-y-1.5 rounded-lg border border-line bg-black/20 p-3 text-sm">
      <p>
        Das Modell <b>{label}</b> fehlt noch ({model.missing.join(', ')}).
      </p>
      {phase.kind === 'loading' ? (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded bg-black/40">
            <div
              className="h-full bg-phosphor transition-[width]"
              style={{ width: `${Math.round((phase.done / Math.max(1, phase.total)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              {mb(phase.done)} von {mb(phase.total)} von huggingface.co
            </span>
            <button className="underline hover:text-text" onClick={() => void cancelDownload()}>
              Abbrechen
            </button>
          </div>
          {phase.retry && <p className="text-xs text-amber-hud">{phase.retry}</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-md border border-phosphor px-2.5 py-1 hover:bg-phosphor/10"
            onClick={start}
          >
            Laden ({mb(model.download)} von huggingface.co)
          </button>
          <span className="text-xs text-muted">
            oder selbst in den{' '}
            <button className="underline hover:text-text" onClick={() => void openModelDir()}>
              Modell-Ordner
            </button>{' '}
            legen: <span className="font-mono">{dir}</span>
          </span>
        </div>
      )}
      {phase.kind === 'error' && <p className="text-red-300">{phase.message}</p>}
      <p className="text-xs text-muted">
        Quelle: die whisper.cpp-Modelle auf Hugging Face (fester Stand). Die App prüft Größe und
        Prüfsumme; sonst geht sie nicht ins Internet.
      </p>
    </div>
  )
}

/** Bestätigung nach dem Laden; `next` sagt, wie es weitergeht (z. B. „Spracherkennung bereit“). */
export function ModelLoaded({ label, next }: { label: string; next?: string }) {
  return (
    <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
      ✓ <b>{label}</b> geladen und geprüft.{next ? ` ${next}` : ''}
    </p>
  )
}
