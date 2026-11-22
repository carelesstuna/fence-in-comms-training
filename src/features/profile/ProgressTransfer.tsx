/**
 * Profil-Sektion „Fortschritt sichern“: Export/Import als Datei, dauerhafter Speicher und
 * die Sicherung beschädigter Daten.
 */
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../state/store'
import { clearBackup, parseJson, readBackup } from '../../state/persisted'
import {
  downloadFile,
  downloadProgress,
  isStoragePersisted,
  MAX_IMPORT_BYTES,
  parseImport,
  requestPersistentStorage,
  type ImportResult,
} from '../../state/transfer'
import type { ProgressState } from '../../core/progress/progress'

type Pending = Extract<ImportResult, { ok: true }> & { fileName: string }

const formatDate = (iso: string | undefined) => {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
    : null
}
const summary = (p: ProgressState) => {
  const n = Object.keys(p.lessons).length
  return `${n} ${n === 1 ? 'Lektion' : 'Lektionen'}, ${p.xp} XP`
}
const button = 'rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white/5'

export function ProgressTransfer() {
  const progress = useApp((s) => s.progress)
  const importState = useApp((s) => s.importState)
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [backup, setBackup] = useState(() => readBackup())

  useEffect(() => {
    let alive = true
    void isStoragePersisted().then((p) => alive && setPersisted(p))
    return () => {
      alive = false
    }
  }, [])

  const onFile = async (file: File) => {
    setMessage(null)
    setPending(null)
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({
        ok: false,
        text: 'Die Datei ist zu groß für eine Sicherung von Fence In Comms Training.',
      })
      return
    }
    const r = parseImport(await file.text())
    if (r.ok) setPending({ ...r, fileName: file.name })
    else setMessage({ ok: false, text: r.error })
  }

  const confirmImport = () => {
    if (!pending) return
    importState(pending.state)
    setPending(null)
    setMessage({ ok: true, text: `Sicherung eingelesen: ${summary(pending.state.progress)}.` })
  }

  const askPersist = async () => {
    const p = await requestPersistentStorage()
    setPersisted(p)
    if (p === false)
      setMessage({
        ok: false,
        text: 'Der Browser hat abgelehnt. Dann hilft nur, ab und zu eine Sicherungsdatei herunterzuladen.',
      })
  }

  const downloadBackup = () => {
    if (!backup) return
    let json = true
    try {
      parseJson(backup.raw)
    } catch {
      json = false
    }
    downloadFile(
      `fence-in-comms-training-original-${(backup.at || 'unbekannt').slice(0, 10)}.${json ? 'json' : 'txt'}`,
      backup.raw,
      json ? 'application/json' : 'text/plain',
    )
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <h3 className="mb-1 font-semibold">Fortschritt sichern</h3>
      <p className="text-sm text-muted">
        Der Fortschritt liegt nur in diesem Browser auf diesem Gerät, es gibt kein Konto und keinen
        Server. Wer die Browserdaten löscht oder das Gerät wechselt, verliert ihn – außer es gibt
        eine Sicherungsdatei. Mit ihr lässt er sich wiederherstellen oder auf ein anderes Gerät
        übertragen.
      </p>
      {persisted === true && (
        <p className="mt-2 text-sm text-phosphor">
          ✓ Der Browser löscht diese Daten nicht von selbst.
        </p>
      )}
      {persisted === false && (
        <p className="mt-2 text-sm text-muted">
          Der Browser darf diese Daten bei Speichermangel oder nach längerer Zeit ohne Besuch
          löschen (Safari nach sieben Tagen).{' '}
          <button
            type="button"
            onClick={() => void askPersist()}
            className="text-amber-hud underline-offset-2 hover:underline"
          >
            Dauerhaft speichern anfragen
          </button>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMessage(
              downloadProgress()
                ? { ok: true, text: 'Die Sicherungsdatei wurde heruntergeladen.' }
                : { ok: false, text: 'Der Download ist fehlgeschlagen.' },
            )
          }}
          className={button}
        >
          Sicherung herunterladen
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={button}>
          Sicherung einlesen …
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Sicherungsdatei auswählen"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </div>

      {pending && (
        <div className="mt-3 rounded-lg border border-amber-hud/40 bg-amber-hud/5 p-3 text-sm">
          <p>
            <span className="font-semibold">{pending.fileName}</span>
            {formatDate(pending.exportedAt) && <> vom {formatDate(pending.exportedAt)}</>}:{' '}
            {summary(pending.state.progress)}.
          </p>
          <p className="mt-1">
            Einlesen ersetzt den aktuellen Stand ({summary(progress)}) samt Profil vollständig. Das
            lässt sich nur mit einer vorher heruntergeladenen Sicherung rückgängig machen.
          </p>
          {pending.repaired.length > 0 && (
            <p className="mt-1 text-muted">
              {pending.repaired.length === 1 ? 'Ein Wert' : `${pending.repaired.length} Werte`} in
              der Datei waren ungültig und werden durch Standardwerte ersetzt.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg bg-amber-hud px-3 py-1.5 text-sm font-semibold text-ink"
            >
              Ja, einlesen
            </button>
            <button type="button" onClick={() => downloadProgress()} className={button}>
              Aktuellen Stand vorher sichern
            </button>
            <button type="button" onClick={() => setPending(null)} className={button}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 text-sm ${message.ok ? 'text-phosphor' : 'text-red-300'}`}
        >
          {message.text}
        </p>
      )}

      {backup && (
        <div className="mt-4 rounded-lg border border-line bg-panel-2 p-3 text-sm">
          <p>
            Beim Laden {formatDate(backup.at) ? `am ${formatDate(backup.at)} ` : ''}waren
            gespeicherte Daten beschädigt. Die App hat mit reparierten Daten weitergemacht, das
            Original liegt als Sicherung bereit.
          </p>
          {backup.reason && <p className="mt-1 text-xs break-words text-muted">{backup.reason}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={downloadBackup} className={button}>
              Original herunterladen
            </button>
            <button
              type="button"
              onClick={() => {
                clearBackup()
                setBackup(null)
              }}
              className={button}
            >
              Sicherung löschen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
