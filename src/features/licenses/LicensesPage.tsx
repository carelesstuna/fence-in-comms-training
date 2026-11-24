/**
 * Lizenzen: die eigene Lizenz und alle Drittbausteine. Die Liste entsteht beim Build
 * (scripts/license-plugin.ts) und liegt als `licenses.json` bzw. `LICENSES.txt` neben der App.
 */
import { useEffect, useState } from 'react'
import { TTS_LICENSES } from '../../platform/tts-config'
import { LEGAL_NOTICE } from '../../ui/legal'

interface Entry {
  name: string
  version: string
  license: string
  url?: string
  text?: string
}

interface LicenseList {
  generated: string
  npm: Entry[]
  cargo: Entry[]
  /** Spracherkennung der Desktop-App (fehlt in älteren Listen). */
  asr?: Entry[]
}

function Table({ title, entries }: { title: string; entries: Entry[] }) {
  if (!entries.length) return null
  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <h3 className="mb-2 font-semibold">
        {title} <span className="text-sm font-normal text-muted">({entries.length})</span>
      </h3>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 pr-3 font-normal">Paket</th>
              <th className="py-1 pr-3 font-normal">Version</th>
              <th className="py-1 pr-3 font-normal">Lizenz</th>
              <th className="py-1 font-normal">Quelle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={`${e.name}@${e.version}`} className="border-t border-line/50">
                <td className="py-1 pr-3 font-mono text-xs">{e.name}</td>
                <td className="py-1 pr-3 font-mono text-xs text-muted">{e.version}</td>
                <td className="py-1 pr-3">{e.license}</td>
                {/* Als Text, nicht als Link: In der Desktop-App würde ein Link das Fenster wegnavigieren */}
                <td className="py-1 font-mono text-xs break-all text-muted select-all">{e.url ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function LicensesPage() {
  const [list, setList] = useState<LicenseList | null>(null)
  const [missing, setMissing] = useState(false)
  const [fullText, setFullText] = useState<string | null>(null)

  useEffect(() => {
    fetch('./licenses.json')
      .then((r) => (r.ok ? (r.json() as Promise<LicenseList>) : Promise.reject(new Error(String(r.status)))))
      .then(setList)
      .catch(() => setMissing(true))
  }, [])

  const showTexts = () => {
    fetch('./LICENSES.txt')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(setFullText)
      .catch(() => setFullText('Die Lizenztexte entstehen beim Build (npm run build).'))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Lizenzen und rechtliche Hinweise</h1>
      <section className="space-y-2 rounded-xl border border-line bg-panel p-5 text-[0.95rem]">
        <h3 className="font-semibold">Fence In Comms Training</h3>
        <p>
          Der Programmcode steht unter der <b>MIT-Lizenz</b>, die Lerninhalte (Lektionen, Übungen, Funksprüche, Szenarien, Glossar) unter{' '}
          <b>CC BY-SA 4.0</b> (Namensnennung, Weitergabe unter gleichen Bedingungen).
        </p>
        <p className="text-sm text-muted">
          Teile des Brevity-Glossars beruhen auf dem Wikipedia-Artikel „Multiservice tactical brevity code“ (Wikipedia-Autorinnen und -Autoren, CC BY-SA 4.0),
          ins Deutsche übertragen und ergänzt. Zitate aus Werken Dritter (etwa Funksprüche oder Menütexte aus Handbüchern) und Marken Dritter stehen nicht
          unter diesen Lizenzen; die Quellen stehen jeweils bei den Inhalten.
        </p>
        <p className="text-sm text-muted">
          Die App sendet keine Nutzungsdaten. Ins Internet geht sie nur auf Klick: Sprachmodelle von huggingface.co, Aussprache-Lexika von
          raw.githubusercontent.com. Sie nutzt die folgenden Bausteine Dritter, jeweils unter deren Lizenz. Alle Lizenztexte liegen der App auch als Datei
          „LICENSES.txt“ bei.
        </p>
      </section>

      <section id="rechtliches" className="space-y-2 rounded-xl border border-line bg-panel p-5 text-[0.95rem]">
        <h3 className="font-semibold">Rechtliche Hinweise</h3>
        <p>{LEGAL_NOTICE}</p>
        <p className="text-sm text-muted">
          Wer meint, dass hier Rechte verletzt werden, eröffnet bitte ein Issue unter github.com/carelesstuna/fence-in-comms-training/issues. Betroffene Inhalte werden nach Prüfung
          umgehend entfernt. Die vollständigen Hinweise stehen in „LICENSES.txt“ (Abschnitt „Legal notice“).
        </p>
      </section>

      {missing && <p className="text-sm text-muted">Die Liste der Drittbausteine entsteht beim Build (npm run build) und fehlt im Entwicklungsmodus.</p>}
      {list && (
        <>
          <Table title="Bausteine der Oberfläche (npm)" entries={list.npm} />
          <Table title="Bausteine der Desktop-App (Rust)" entries={list.cargo} />
          <Table title="Spracherkennung der Desktop-App (whisper.cpp und Modell)" entries={list.asr ?? []} />
          <p className="text-xs text-muted">Stand der Liste: {new Date(list.generated).toLocaleString('de-DE')}</p>
        </>
      )}

      {/* Nicht im Paket: lädt die App erst auf Klick von der Originalquelle (Einstellungen → Hören) */}
      <Table title="Sprachausgabe (auf Klick nachgeladen, nicht im Paket)" entries={[...TTS_LICENSES]} />

      <section className="rounded-xl border border-line bg-panel p-5">
        {fullText === null ? (
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-phosphor" onClick={showTexts}>
            Alle Lizenztexte anzeigen
          </button>
        ) : (
          <pre className="max-h-[32rem] overflow-auto text-xs whitespace-pre-wrap">{fullText}</pre>
        )}
      </section>
    </div>
  )
}
