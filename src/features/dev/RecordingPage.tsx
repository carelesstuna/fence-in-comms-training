/**
 * Messreihe (nur im Entwicklungsmodus, `#/dev/aufnahme`): gewürfelte Funksprüche einsprechen,
 * richtige und absichtlich falsche. Gespeichert wird nur, wenn „Aufnahmen speichern“ eingeschaltet
 * ist – als WAV (16 kHz mono) samt JSON außerhalb des Repos. `scripts/asr-bench.ts` wertet sie aus.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { content } from '../../ui/run'
import { createRng, newSeed } from '../../core/random/rng'
import { encodeWav, dbfs } from '../../core/speech/pcm'
import { checkRecording, DISCARD_TEXT } from '../../core/speech/transcript'
import { callsignPool, makeVariant, speakableCalls, VARIANT_LABEL, type CallVariant, type SpeakableCall, type VariantKind } from '../../core/speech/variants'
import { RECORDING_VERSION, type RecordingDraft } from '../../core/speech/recording'
import { acquireMicrophone, listMicrophones, PRE_ROLL_MS, TAIL_MS, type AudioCapture } from '../../platform/audio-capture'
import { usePushToTalk } from '../../platform/usePushToTalk'
import { LevelMeter, PttButton } from '../../components/speech/SpeechParts'

/** Vorschlag für die Messreihe: 80 Aufnahmen. */
const TARGET: Record<VariantKind, number> = { correct: 40, 'wrong-number': 16, 'wrong-callsign': 16, silence: 8 }
const KINDS = Object.keys(TARGET) as VariantKind[]

interface Card {
  seed: string
  call: SpeakableCall
  variant: CallVariant
}

interface Take {
  url: string
  wav: Uint8Array
  heldMs: number
  peak: number
  rms: number
  nativeRate: number
  savedId?: string
  error?: string
  warning?: string
}

interface Status {
  dir: string
  recordings: { id: string; kind: VariantKind }[]
}

/** Nächste Art: zufällig, gewichtet nach dem, was zum Ziel noch fehlt. */
function nextKind(counts: Record<VariantKind, number>): VariantKind {
  const missing = KINDS.map((k) => Math.max(0, TARGET[k] - counts[k]))
  const weights = missing.some((m) => m > 0) ? missing : KINDS.map((k) => TARGET[k])
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < KINDS.length; i++) {
    r -= weights[i]
    if (r < 0) return KINDS[i]
  }
  return 'correct'
}

function drawCard(kind: VariantKind): Card {
  const pool = callsignPool(content)
  for (let attempt = 0; ; attempt++) {
    const seed = newSeed(6)
    const rng = createRng(seed)
    const calls = speakableCalls(content, rng)
    const call = rng.pick(calls)
    // Gibt es die gewünschte Art bei diesem Funkspruch nicht, einen anderen nehmen (notfalls richtig)
    const variant = makeVariant(call.segments, attempt < 40 ? kind : 'correct', rng.fork('variant'), pool)
    if (variant) return { seed, call, variant }
  }
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/__messreihe/${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export default function RecordingPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [save, setSave] = useState(false)
  const [filters, setFilters] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([])
  const [capture, setCapture] = useState<AudioCapture | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [card, setCard] = useState<Card>(() => drawCard('correct'))
  const [take, setTake] = useState<Take | null>(null)
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const c = { correct: 0, 'wrong-number': 0, 'wrong-callsign': 0, silence: 0 } as Record<VariantKind, number>
    for (const r of status?.recordings ?? []) c[r.kind]++
    return c
  }, [status])

  const refresh = useCallback(() => {
    api<Status>('status')
      .then((s) => {
        setStatus(s)
        setStatusError(null)
      })
      .catch((e: unknown) => setStatusError(e instanceof Error ? e.message : String(e)))
  }, [])
  useEffect(refresh, [refresh])

  // Mikrofon nur, solange es eingeschaltet ist
  useEffect(() => {
    if (!micOn) return
    let release: (() => void) | null = null
    let cancelled = false
    acquireMicrophone({ deviceId, filters })
      .then((m) => {
        if (cancelled) return m.release()
        release = m.release
        setCapture(m.capture)
        setMicError(null)
        void listMicrophones().then((l) => setDevices(l.devices))
      })
      .catch((e: unknown) => {
        if (!cancelled) setMicError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
      setCapture(null)
      release?.()
    }
  }, [micOn, deviceId, filters])

  useEffect(() => () => void (take && URL.revokeObjectURL(take.url)), [take])

  const press = () => {
    if (!capture || busy || sending) return
    capture.start()
    setSending(true)
  }

  const release = () => {
    if (!capture || !sending) return
    setSending(false)
    setBusy(true)
    void capture
      .stop()
      .then(async (rec) => {
        const wav = encodeWav(rec.pcm, 16000)
        const url = URL.createObjectURL(new Blob([wav as BlobPart], { type: 'audio/wav' }))
        const problem = card.variant.kind === 'silence' ? undefined : checkRecording(rec.stats)
        const t: Take = { url, wav, heldMs: Math.round(rec.stats.durationMs), peak: rec.stats.peak, rms: rec.stats.rms, nativeRate: rec.nativeRate, warning: problem && DISCARD_TEXT[problem] }
        if (save) {
          const draft: RecordingDraft = {
            version: RECORDING_VERSION,
            createdAt: new Date().toISOString(),
            kind: card.variant.kind,
            text: card.variant.text,
            shouldAccept: card.variant.shouldAccept,
            change: card.variant.change,
            source: card.call.source,
            seed: card.seed,
            // Ohne die Erklärtexte – die Bewertung braucht sie nicht
            segments: card.call.segments.map((s) => ({ text: s.text, role: s.role, optional: s.optional, critical: s.critical, alt: s.alt, tolerance: s.tolerance, free: s.free })),
            hintContext: { moduleId: card.call.moduleId, stations: card.call.stations },
            audio: { rate: 16000, heldMs: t.heldMs, peak: t.peak, rms: t.rms, preRollMs: PRE_ROLL_MS, tailMs: TAIL_MS, filters, nativeRate: rec.nativeRate },
          }
          try {
            const r = await api<{ id: string }>('save', { draft, wav: toBase64(wav) })
            t.savedId = r.id
            refresh()
          } catch (e) {
            t.error = `Nicht gespeichert: ${e instanceof Error ? e.message : String(e)}`
          }
        }
        setTake(t)
      })
      .finally(() => setBusy(false))
  }

  usePushToTalk({ enabled: !!capture, keyCode: 'Space', mode: 'hold', sending, onPress: press, onRelease: release })

  const next = () => {
    setTake(null)
    setCard(drawCard(nextKind(counts)))
  }

  const discard = async () => {
    if (take?.savedId) {
      try {
        await api('delete', { id: take.savedId })
        refresh()
      } catch (e) {
        setTake({ ...take, error: `Nicht gelöscht: ${e instanceof Error ? e.message : String(e)}` })
        return
      }
    }
    setTake(null)
  }

  // Eingabe = weiter
  useEffect(() => {
    if (!take || sending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const total = status?.recordings.length ?? 0
  const v = card.variant

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-semibold">Messreihe: Aufnahmen für die Spracherkennung</h1>
        <p className="mt-1 text-sm text-muted">
          Nur im Entwicklungsmodus. Die Aufnahmen bleiben auf diesem Rechner und werden nur gespeichert, wenn du es unten einschaltest.
        </p>
      </header>

      <section className="rounded-lg border border-line bg-black/20 p-4 text-sm leading-relaxed">
        <h2 className="mb-1 font-semibold">So geht’s</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Mikrofon einschalten, Pegel prüfen: beim Sprechen etwa im gelben Bereich, nicht rot.</li>
          <li>
            <b>Leertaste halten</b> (oder den PTT-Knopf mit der Maus), <b>erst dann</b> sprechen, nach dem letzten Wort loslassen.
          </li>
          <li>Den Text so sprechen, wie er dasteht – auch die absichtlich falschen Stellen (gelb markiert). Ziffern einzeln, wie im Funk („niner“, „tree“ und „fife“ sind erlaubt).</li>
          <li>Versprochen? „Verwerfen“ und noch einmal. Sonst Eingabe oder „Weiter“.</li>
        </ol>
        <p className="mt-2 text-muted">
          Ziel: {TARGET.correct} richtige, {TARGET['wrong-number']} mit falscher Zahl, {TARGET['wrong-callsign']} mit falschem Rufzeichen und {TARGET.silence}× Stille, zusammen{' '}
          {KINDS.reduce((n, k) => n + TARGET[k], 0)}. Mehrere kurze Runden sind besser als eine lange.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-line p-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          <span>
            <b>Aufnahmen speichern</b>
          </span>
        </label>
        <label className="flex items-center gap-2" title="Echo- und Rauschunterdrückung sowie automatische Lautstärke des Browsers">
          <input type="checkbox" checked={filters} onChange={(e) => setFilters(e.target.checked)} />
          Browser-Filter
        </label>
        {!micOn ? (
          <button className="rounded-md border border-line px-3 py-1.5 hover:border-phosphor" onClick={() => setMicOn(true)}>
            🎙 Mikrofon einschalten
          </button>
        ) : (
          <button className="rounded-md border border-line px-3 py-1.5 text-muted hover:text-text" onClick={() => setMicOn(false)}>
            Mikrofon aus
          </button>
        )}
        {devices.length > 1 && (
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="rounded-md border border-line bg-black/30 px-2 py-1.5">
            <option value="">Standardmikrofon</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        )}
        <div className="w-full">
          <LevelMeter capture={capture} />
          {capture && <div className="mt-1 text-xs text-muted">{capture.deviceLabel}</div>}
          {micError && <div className="mt-1 text-red-300">{micError}</div>}
        </div>
        <div className="w-full text-xs text-muted">
          {statusError ? (
            <span className="text-red-300">Dev-Server nicht erreichbar: {statusError}</span>
          ) : (
            <>
              Ordner: <span className="font-mono">{status?.dir ?? '…'}</span> · gespeichert: {total} ({KINDS.map((k) => `${counts[k]}/${TARGET[k]} ${VARIANT_LABEL[k]}`).join(', ')})
            </>
          )}
        </div>
      </section>

      <section className={`rounded-lg border p-5 ${v.kind === 'correct' ? 'border-emerald-400/40' : v.kind === 'silence' ? 'border-line' : 'border-amber-400/50'}`}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className={v.kind === 'correct' ? 'text-emerald-300' : v.kind === 'silence' ? 'text-muted' : 'text-amber-hud'}>
            {v.kind === 'correct' ? 'Richtig sprechen' : v.kind === 'silence' ? 'Stille' : `Absichtlich falsch: ${VARIANT_LABEL[v.kind]}`}
          </span>
          <span className="font-mono text-xs text-muted">
            {card.call.source} · #{card.seed}
          </span>
        </div>
        {v.kind === 'silence' ? (
          <p className="text-lg">Sprechtaste etwa zwei Sekunden halten und <b>nichts sagen</b>. Atmen, Räuspern oder Tastengeräusche sind in Ordnung.</p>
        ) : (
          <p lang="en" className="font-mono text-xl leading-relaxed">
            {card.call.segments.map((s, i) => (
              <span key={i}>
                {i > 0 && ', '}
                {v.change?.segment === i ? (
                  <mark className="rounded bg-amber-400/25 px-1 text-amber-200" title={`richtig wäre: ${v.change.from}`}>
                    {v.change.to}
                  </mark>
                ) : (
                  s.text
                )}
              </span>
            ))}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PttButton sending={sending} disabled={!capture || busy} onPress={press} onRelease={release} />
          {!take && (
            <button className="text-sm text-muted hover:text-text" onClick={() => setCard(drawCard(v.kind))}>
              Anderer Funkspruch
            </button>
          )}
          {busy && <span className="text-sm text-muted">verarbeite …</span>}
        </div>
      </section>

      {take && (
        <section className="space-y-3 rounded-lg border border-line bg-black/20 p-4 text-sm">
          <audio controls src={take.url} className="w-full" />
          <div className="text-muted">
            gehalten {(take.heldMs / 1000).toFixed(1)} s · Spitze {dbfs(take.peak).toFixed(0)} dBFS · Mittel {dbfs(take.rms).toFixed(0)} dBFS · Mikrofon {take.nativeRate / 1000} kHz
          </div>
          {take.warning && <div className="text-amber-hud">⚠ {take.warning}</div>}
          {take.error && <div className="text-red-300">{take.error}</div>}
          <div className="flex flex-wrap items-center gap-3">
            {take.savedId ? <span className="text-emerald-300">✓ gespeichert als {take.savedId}</span> : !take.error && <span className="text-muted">nicht gespeichert (Speichern ist aus)</span>}
            <button className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink hover:brightness-110" onClick={next}>
              Weiter ⏎
            </button>
            <button className="rounded-lg border border-line px-3 py-2 hover:border-red-400" onClick={() => void discard()}>
              Verwerfen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
