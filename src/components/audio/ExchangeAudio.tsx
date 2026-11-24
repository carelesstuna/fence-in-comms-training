/**
 * Funk-Wiedergabe in der Oberfläche:
 *
 * - `ExchangeAudio` umschließt einen Funkspruch (RadioPanel, Funk-Log im Szenario). Seine Zeilen bekommen
 *   ▶, im Hörmodus erscheint ihr Text erst nach dem Hören, im Szenario spielen neue Funksprüche von selbst.
 *   Die Stimmen werden gerechnet, sobald die Zeilen zu sehen sind – nicht erst beim Klick auf ▶.
 * - `PlayAllButton` spielt alle sichtbaren Zeilen nacheinander.
 * - `AudioSetup` bietet den einmaligen Download der Sprachausgabe an.
 *
 * Alles bleibt ohne Ton lösbar: ohne Sprachausgabe oder mit „Text immer zeigen“ steht der Text sofort da,
 * und „Text zeigen“ gibt ihn jederzeit frei. Alle Knöpfe sind normale Buttons (Tab, Enter, Leertaste).
 */
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ResolvedTransmission } from '../../core/drills/types'
import { useRadioAudio } from '../../platform/audio-context'
import { TTS_DOWNLOAD_MB } from '../../platform/tts-config'
import {
  castKeyFor,
  ExchangeAudioContext,
  waitGap,
  type ExchangeAudioValue,
  type LineAudio,
} from './exchange-audio'

let nextPanel = 1


export function ExchangeAudio({
  transmissions,
  cast,
  listen = false,
  autoplay = false,
  upcoming,
  children,
}: {
  transmissions: readonly ResolvedTransmission[]
  /** Besetzung der Stimmen (Standard: je Funkspruch). */
  cast?: string
  /** Hörübung: Text erst nach dem Hören. */
  listen?: boolean
  /** Neue Zeilen von selbst abspielen (Szenario). */
  autoplay?: boolean
  /** Was gleich kommt – wird vorab gerechnet. */
  upcoming?: readonly ResolvedTransmission[]
  children: ReactNode
}) {
  const audio = useRadioAudio()
  const [id] = useState(() => `p${nextPanel++}`)
  const castKey = cast ?? castKeyFor(transmissions)
  const [registered, setRegistered] = useState<ReadonlySet<number>>(new Set())
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set())
  const [setup, setSetup] = useState(false)
  const audioRef = useRef(audio)
  useEffect(() => {
    audioRef.current = audio
  }, [audio])

  const listening = listen && audio.listening && audio.engine !== 'error'

  const register = useCallback((index: number) => {
    setRegistered((s) => new Set(s).add(index))
    return () =>
      setRegistered((s) => {
        const n = new Set(s)
        n.delete(index)
        return n
      })
  }, [])
  const reveal = useCallback(
    (index: number) => setRevealed((s) => (s.has(index) ? s : new Set(s).add(index))),
    [],
  )
  const request = useCallback(
    (index: number, tempo?: number) => ({
      key: `${id}:${index}`,
      transmissions,
      index,
      cast: castKey,
      tempo,
    }),
    [id, transmissions, castKey],
  )

  const playLine = useCallback(
    async (index: number, tempo?: number) => {
      const a = audioRef.current
      if (!a.available) {
        setSetup(true)
        return false
      }
      const ok = await a.play(request(index, tempo))
      if (ok || audioRef.current.error) reveal(index)
      return ok
    },
    [request, reveal],
  )

  // Szenario: neue Funksprüche nacheinander abspielen, sobald sie im Log stehen
  const seen = useRef(new Set<number>())
  const queue = useRef<number[]>([])
  const running = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const runQueue = useCallback(async () => {
    if (running.current) return
    running.current = true
    try {
      let played = false
      while (queue.current.length) {
        const i = queue.current.shift()!
        if (!audioRef.current.available) {
          reveal(i)
          continue
        }
        // Zwischen zwei Funksprüchen eine kurze Pause wie im echten Funk
        if (played && !(await waitGap(() => !mounted.current))) {
          queue.current = []
          break
        }
        if (!(await playLine(i))) {
          queue.current = []
          break
        }
        played = true
      }
    } finally {
      running.current = false
    }
  }, [playLine, reveal])

  useEffect(() => {
    if (!autoplay || !audio.autoplay) return
    const fresh = [...registered].filter((i) => !seen.current.has(i)).sort((a, b) => a - b)
    if (!fresh.length) return
    for (const i of fresh) seen.current.add(i)
    queue.current.push(...fresh.filter((i) => !transmissions[i]?.you))
    void runQueue()
  }, [autoplay, audio.autoplay, registered, transmissions, runQueue])

  // Vorab rechnen, sobald die Zeilen zu sehen sind: von oben nach unten, die Gegenstellen vor den eigenen
  // Funksprüchen (im Szenario spielen nur die Gegenstellen), danach was gleich kommt
  const warmKey = `${[...registered].sort((a, b) => a - b).join(',')}|${upcoming?.length ?? 0}`
  useEffect(() => {
    const a = audioRef.current
    if (!a.available) return
    const shown = [...registered].sort((x, y) => x - y)
    const others = shown.filter((i) => !transmissions[i]?.you)
    const own = autoplay ? [] : shown.filter((i) => transmissions[i]?.you)
    const next = (upcoming ?? []).map((_, i) => ({
      key: `${id}:u${i}`,
      transmissions: upcoming!,
      index: i,
      cast: castKey,
    }))
    a.prefetch([...[...others, ...own].map((i) => request(i)), ...next], id)
    // warmKey fasst registered und upcoming zusammen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warmKey, audio.available, autoplay])

  // Beim Verlassen nichts weiterspielen und nicht mehr für diese Seite rechnen
  useEffect(
    () => () => {
      audioRef.current.stop()
      audioRef.current.release(id)
    },
    [id],
  )

  const value = useMemo<ExchangeAudioValue>(
    () => ({
      id,
      transmissions,
      cast: castKey,
      listening,
      revealed,
      register,
      reveal,
      playLine,
      request,
      registered,
      askSetup: () => setSetup(true),
    }),
    [
      id,
      transmissions,
      castKey,
      listening,
      revealed,
      register,
      reveal,
      playLine,
      request,
      registered,
    ],
  )

  return (
    <ExchangeAudioContext.Provider value={value}>
      {setup && !audio.available && audio.enabled && <AudioSetup onClose={() => setSetup(false)} />}
      {children}
    </ExchangeAudioContext.Provider>
  )
}

/** Rechnet Übertragungen vorab, ohne etwas zu zeigen (z. B. den ersten Schritt während des Briefings). */
export function PrefetchAudio({
  transmissions,
  cast,
}: {
  transmissions: readonly ResolvedTransmission[]
  cast: string
}) {
  const { available, prefetch, release } = useRadioAudio()
  const [owner] = useState(() => `vorab${nextPanel++}`)
  useEffect(() => {
    if (available && transmissions.length)
      prefetch(
        transmissions.map((_, index) => ({ key: `vorab:${index}`, transmissions, index, cast })),
        owner,
      )
  }, [available, prefetch, transmissions, cast, owner])
  useEffect(() => () => release(owner), [release, owner])
  return null
}

const btn =
  'inline-flex items-center justify-center rounded border font-mono text-[11px] leading-none transition disabled:opacity-40'

/** ▶ an einer Zeile: abspielen, während der Wiedergabe ■ (stoppen). */
export function LinePlayButton({ line }: { line: LineAudio }) {
  const busy = line.state !== 'idle'
  const label = busy ? `Wiedergabe stoppen` : `Funkspruch von ${line.speaker} abspielen`
  return (
    <button
      type="button"
      onClick={busy ? line.stop : line.play}
      onPointerEnter={line.warm}
      onFocus={line.warm}
      aria-label={label}
      title={
        busy
          ? line.state === 'preparing'
            ? 'Stimme wird gerechnet … (Klick stoppt)'
            : 'Stopp'
          : 'Abspielen'
      }
      className={`${btn} h-5 w-5 ${busy ? 'border-phosphor bg-phosphor/15 text-phosphor' : 'border-line text-muted hover:border-phosphor-dim hover:text-phosphor'}`}
    >
      {line.state === 'preparing' ? <span className="animate-pulse">…</span> : busy ? '■' : '▶'}
    </button>
  )
}

/** Platzhalter für verborgenen Text (Hörübung). */
export function HiddenLine({ line }: { line: LineAudio }) {
  const busy = line.state !== 'idle'
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-line bg-black/20 px-2.5 py-1.5 text-sm">
      <span className="font-mono text-muted" aria-hidden>
        {busy ? (line.state === 'preparing' ? '… gleich' : '▮▮▮ ▮▮ ▮▮▮▮ ▮▮▮') : '▯▯▯ ▯▯ ▯▯▯▯ ▯▯▯'}
      </span>
      <span className="sr-only">Text verborgen, erst anhören.</span>
      {!busy && (
        <button
          type="button"
          onClick={line.play}
          className="rounded-md bg-phosphor/15 px-2 py-0.5 text-phosphor hover:bg-phosphor/25"
        >
          ▶ Anhören
        </button>
      )}
      <button
        type="button"
        onClick={line.reveal}
        className="rounded-md px-1.5 py-0.5 text-xs text-muted underline-offset-2 hover:text-text hover:underline"
      >
        Text zeigen
      </button>
    </div>
  )
}

/** Alle sichtbaren Zeilen des Funkspruchs nacheinander abspielen. */
export function PlayAllButton({ className = '' }: { className?: string }) {
  const audio = useRadioAudio()
  const ctx = useContext(ExchangeAudioContext)
  const [running, setRunning] = useState(false)
  const stopRef = useRef(false)
  if (!ctx || !audio.enabled || ctx.registered.size === 0) return null
  const start = async () => {
    if (!audio.available) return ctx.askSetup()
    stopRef.current = false
    setRunning(true)
    let first = true
    for (const i of [...ctx.registered].sort((a, b) => a - b)) {
      if (ctx.transmissions[i]?.skip) continue
      // Kurze Pause zwischen den Funksprüchen, wie im echten Funk
      if (!first && !(await waitGap(() => stopRef.current))) break
      first = false
      if (stopRef.current || !(await ctx.playLine(i))) break
    }
    setRunning(false)
  }
  const stop = () => {
    stopRef.current = true
    audio.stop()
    setRunning(false)
  }
  return (
    <button
      type="button"
      onClick={running ? stop : () => void start()}
      aria-label={running ? 'Wiedergabe stoppen' : 'Funkspruch abspielen'}
      className={`rounded-md border px-2 py-0.5 text-xs ${running ? 'border-phosphor text-phosphor' : 'border-line text-muted hover:border-phosphor-dim hover:text-phosphor'} ${className}`}
    >
      {running ? '■ Stopp' : '▶ Abspielen'}
    </button>
  )
}

/**
 * Einmaliger Download der Sprachausgabe – im Onboarding, im Profil und dort, wo man zum ersten Mal ▶ drückt.
 * `blocked`: Warum gerade nicht geladen werden kann (z. B. weil ein Sprachmodell lädt – es lädt immer nur eins).
 */
export function AudioSetup({
  onClose,
  compact = false,
  blocked,
}: {
  onClose?: () => void
  compact?: boolean
  blocked?: string
}) {
  const audio = useRadioAudio()
  const d = audio.download
  const pct = d ? Math.round((d.done / Math.max(1, d.total)) * 100) : 0
  if (audio.files === 'present') return null
  return (
    <div
      role="region"
      aria-label="Funk-Audio einrichten"
      className={`rounded-lg border border-amber-hud/40 bg-amber-hud/5 px-3 py-2.5 text-sm ${compact ? '' : 'mb-2'}`}
    >
      <p>
        <b className="text-amber-hud">Funk hörbar machen:</b> Die Sprachausgabe (Kokoro-82M mit acht
        Stimmen) wird einmalig geladen – {TTS_DOWNLOAD_MB} MB von huggingface.co und github.com,
        danach geht alles offline. Ohne sie bleibt alles als Text lesbar.
      </p>
      {audio.storeKind === 'dev' ? (
        <p className="mt-1 text-muted">
          Dev-Server: <code>npm run fetch-asr -- tts</code>
        </p>
      ) : d ? (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded bg-black/40"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Download"
          >
            <div className="h-full bg-phosphor transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-24 text-right font-mono text-xs text-muted">
            {Math.round(d.done / 1e6)} / {Math.round(d.total / 1e6)} MB
          </span>
          <button
            type="button"
            onClick={audio.cancelDownload}
            className="rounded-md border border-line px-2 py-0.5 text-xs"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void audio.startDownload()}
            disabled={!!blocked}
            className="rounded-md bg-phosphor px-3 py-1 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Laden ({TTS_DOWNLOAD_MB} MB)
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line px-3 py-1"
            >
              Nicht jetzt
            </button>
          )}
        </div>
      )}
      {blocked && !d && <p className="mt-1 text-xs text-amber-hud">{blocked}</p>}
      {d?.retry && <p className="mt-1 text-xs text-amber-hud">{d.retry}</p>}
      {audio.error && !d && <p className="mt-1 text-xs text-red-300">{audio.error}</p>}
    </div>
  )
}
