/**
 * Desktop-App: ein fehlendes Modell auf Klick nachladen – von der Originalquelle (Hugging Face,
 * fester Stand), mit Fortschritt und Abbrechen. Rust prüft Größe und SHA-256, erst dann liegt die
 * Datei im eigenen Modell-Ordner. Ohne Klick geht die App nie ins Internet.
 */
import { useEffect, useState } from 'react'
import { startAsrDownload, useAsrDownload } from '../../platform/asr-download'
import { whisperModel } from '../../platform/whisper-config'
import {
  asrStatus,
  cancelDownload,
  openModelDir,
  type AsrModelStatus,
} from '../../platform/whisper-recognizer'

const mb = (bytes: number) => `${Math.round(bytes / 1e6)} MB`

/**
 * `onDone`: Das Modell liegt geprüft im Ordner. Die Bestätigung zeigt der Aufrufer weiter an – dieser
 * Kasten verschwindet, sobald das Modell als vorhanden gilt. Der Download läuft weiter, wenn der Kasten
 * verschwindet (`asr-download.ts`). `blocked`: Warum gerade nicht geladen werden kann (z. B. weil die
 * Sprachausgabe lädt – es lädt immer nur eins).
 */
export function ModelDownload({
  modelId,
  onDone,
  blocked,
}: {
  modelId: string
  onDone: () => void
  blocked?: string
}) {
  const [status, setStatus] = useState<{ model: AsrModelStatus; dir: string } | null>(null)
  const dl = useAsrDownload()

  // Neu prüfen, sobald ein Download fertig ist (auch einer, der vor dem Öffnen dieses Kastens begann)
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
  }, [modelId, dl.finished])

  if (!status || status.model.path) return null
  const label = whisperModel(modelId)?.label ?? modelId
  const { model, dir } = status
  const running = dl.running
  const mine = running?.modelId === modelId
  const other = running && !mine ? (whisperModel(running.modelId)?.label ?? running.modelId) : null
  const error = dl.error?.modelId === modelId ? dl.error.message : null
  const waitFor = blocked ?? (other ? `Es lädt gerade ${other} – es lädt immer nur eins.` : undefined)

  const start = () =>
    void startAsrDownload(modelId, model.download).then((ok) => {
      if (ok) onDone()
    })

  return (
    <div className="space-y-1.5 rounded-lg border border-line bg-black/20 p-3 text-sm">
      <p>
        Das Modell <b>{label}</b> fehlt noch ({model.missing.join(', ')}).
      </p>
      {mine ? (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded bg-black/40">
            <div
              className="h-full bg-phosphor transition-[width]"
              style={{ width: `${Math.round((running.done / Math.max(1, running.total)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              {mb(running.done)} von {mb(running.total)} von huggingface.co
            </span>
            <button className="underline hover:text-text" onClick={() => void cancelDownload()}>
              Abbrechen
            </button>
          </div>
          {running.retry && <p className="text-xs text-amber-hud">{running.retry}</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-md border border-phosphor px-2.5 py-1 hover:bg-phosphor/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!!waitFor}
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
      {waitFor && !mine && <p className="text-xs text-amber-hud">{waitFor}</p>}
      {error && <p className="text-red-300">{error}</p>}
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
