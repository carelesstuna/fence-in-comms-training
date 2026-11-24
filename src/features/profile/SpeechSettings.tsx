/**
 * Einstellungen fürs Sprechen: Eingabe, Sprechtaste (halten/umschalten), Mikrofon, Modell und ein
 * Mikrofontest mit Pegel und Transkript. Alles bleibt auf diesem Rechner; nichts wird gespeichert.
 * Mikrofon, Modell und Test nutzt auch das Onboarding (`VoiceStep`).
 */
import { useEffect, useReducer, useState } from 'react'
import { useApp, type SpeechSettings as Settings } from '../../state/store'
import { content } from '../../ui/run'
import { buildHints } from '../../core/speech/hints'
import { initialSpeech, keyLabel, speechReducer } from '../../core/speech/flow'
import { checkRecording, DISCARD_TEXT } from '../../core/speech/transcript'
import { dbfs } from '../../core/speech/pcm'
import { micLabel } from '../../core/speech/mics'
import { acquireMicrophone, type AudioCapture } from '../../platform/audio-capture'
import { isTauri, useSpeech } from '../../platform/speech-context'
import { usePushToTalk } from '../../platform/usePushToTalk'
import { squelch } from '../../platform/squelch'
import { TRANSFORMERS_MODELS } from '../../platform/transformers-config'
import { WHISPER_MODELS, whisperModel } from '../../platform/whisper-config'
import { asrStatus, openModelDir, type AsrStatus } from '../../platform/whisper-recognizer'
import { useAsrDownload } from '../../platform/asr-download'
import { LevelMeter, PttButton } from '../../components/speech/SpeechParts'
import { ModelDownload, ModelLoaded } from '../../components/speech/ModelDownload'
import { setSpeech, useMicList, type MicListState } from './speech-settings'

/** Diese Tasten taugen nicht als Sprechtaste. */
const RESERVED = new Set(['Escape', 'Enter', 'NumpadEnter', 'Tab', 'Backspace'])

export function SpeechSettings() {
  const s = useApp((st) => st.profile.speech)
  const set = setSpeech
  const speech = useSpeech()
  const micList = useMicList(s.input === 'speak')
  const [pickKey, setPickKey] = useState(false)
  const [testing, setTesting] = useState(false)

  // Nächste Taste als Sprechtaste übernehmen (Escape bricht ab)
  useEffect(() => {
    if (!pickKey) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code !== 'Escape' && !RESERVED.has(e.code)) setSpeech({ pttKey: e.code })
      setPickKey(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [pickKey])

  return (
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5">
      <div>
        <h3 className="font-semibold">Sprechen</h3>
        <p className="mt-1 text-sm text-muted">
          Eigene Funksprüche sprechen statt tippen. Die Erkennung läuft auf diesem Rechner; Aufnahmen werden nicht gespeichert. Tippen geht immer.
        </p>
      </div>

      <p className="text-xs text-muted">
        Bekannte Grenze: Die Erkennung schreibt Zahlen als Ziffern. Ob du „three five zero“ oder „three hundred fifty“ sagst, kann
        die App deshalb nicht unterscheiden – beides zählt. Sprich trotzdem Ziffer für Ziffer, so wie im Funk.
      </p>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="speech-input" checked={s.input === 'type'} onChange={() => set({ input: 'type' })} />
          Tippen
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="speech-input" checked={s.input === 'speak'} onChange={() => set({ input: 'speak' })} />
          Sprechen
        </label>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
        <span className="text-muted">Sprechtaste</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-line bg-black/30 px-2 py-0.5 font-mono">{keyLabel(s.pttKey)}</span>
          <button className="rounded-md border border-line px-2.5 py-1 hover:border-phosphor" onClick={() => setPickKey(true)}>
            {pickKey ? 'Taste drücken … (Esc bricht ab)' : 'Andere Taste'}
          </button>
          {s.pttKey !== 'Space' && (
            <button className="text-muted hover:text-text" onClick={() => set({ pttKey: 'Space' })}>
              Leertaste
            </button>
          )}
        </div>

        <span className="text-muted">Bedienung</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="ptt-mode" checked={s.pttMode === 'hold'} onChange={() => set({ pttMode: 'hold' })} />
            Halten (wie am Funkgerät)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="ptt-mode" checked={s.pttMode === 'toggle'} onChange={() => set({ pttMode: 'toggle' })} />
            Umschalten (drücken – sprechen – drücken)
          </label>
        </div>

        <span className="text-muted">Mikrofon</span>
        <MicField settings={s} list={micList} />

        <span className="text-muted">Modell</span>
        {isTauri() ? (
          <DesktopModel settings={s} set={set} />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select value={s.model} onChange={(e) => set({ model: e.target.value })} className="rounded-md border border-line bg-black/30 px-2 py-1">
              {TRANSFORMERS_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.sizeMb} MB, {m.note})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2" title="WebGPU: schneller, wenn die Grafikkarte mitspielt. Sonst rechnet die CPU.">
              <input type="checkbox" checked={s.gpu} onChange={(e) => set({ gpu: e.target.checked })} />
              Grafikkarte nutzen (experimentell)
            </label>
          </div>
        )}

        <span className="text-muted">Klick</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.squelch} onChange={(e) => set({ squelch: e.target.checked })} />
          Squelch-Klick beim Drücken und Loslassen
        </label>
      </div>

      <div className="text-sm">
        <span className="text-muted">Erkennung: </span>
        {speech.status === 'ready' && <span className="text-emerald-300">bereit ({speech.engineLabel})</span>}
        {speech.status === 'loading' && (
          <span>
            wird vorbereitet ({speech.engineLabel}) …{speech.progress > 0 && ` ${Math.round(speech.progress * 100)} %`}
          </span>
        )}
        {speech.status === 'idle' && (
          <button className="underline" onClick={() => void speech.ensureLoaded().catch(() => undefined)}>
            jetzt laden ({speech.engineLabel})
          </button>
        )}
        {speech.status === 'error' && <span className="text-red-300">{speech.error}</span>}
      </div>

      {!testing ? (
        <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-phosphor" onClick={() => setTesting(true)}>
          🎙 Mikrofontest
        </button>
      ) : (
        <MicTest settings={s} onOpened={micList.refresh} onClose={() => setTesting(false)} />
      )}
    </section>
  )
}

/**
 * Mikrofon wählen und die Browser-Filter. Die Namen der Mikrofone holt `useMicList(true)` beim Öffnen selbst; nur wenn
 * das scheitert (Freigabe abgelehnt), gibt es „Erneut versuchen“.
 */
export function MicField({ settings: s, list }: { settings: Settings; list: MicListState }) {
  const { mics, revealing, error: micError, reveal } = list
  const set = setSpeech
  const savedMissing = !!s.micId && !!mics && !mics.devices.some((d) => d.deviceId === s.micId)
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <select
          value={s.micId}
          onChange={(e) => set({ micId: e.target.value })}
          className="w-full min-w-0 truncate rounded-md border border-line bg-black/30 px-2 py-1 sm:w-auto sm:max-w-md"
        >
          <option value="">{mics?.defaultLabel ? `Standardmikrofon (${mics.defaultLabel})` : 'Standardmikrofon'}</option>
          {savedMissing && <option value={s.micId}>{mics?.named ? 'Gewähltes Mikrofon fehlt – es nimmt das Standardmikrofon' : 'Gewähltes Mikrofon'}</option>}
          {mics?.devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
        {revealing && <span className="text-xs text-muted">Suche Mikrofone …</span>}
        <label className="flex items-center gap-2" title="Echo- und Rauschunterdrückung sowie automatische Lautstärke des Browsers. Für die Erkennung meist besser aus.">
          <input type="checkbox" checked={s.micFilters} onChange={(e) => set({ micFilters: e.target.checked })} />
          Browser-Filter
        </label>
      </div>
      {micError && !mics?.named && (
        <p className="text-red-300">
          {micError}{' '}
          <button className="underline hover:text-text" onClick={reveal}>
            Erneut versuchen
          </button>
        </p>
      )}
    </div>
  )
}

/**
 * Desktop-App: whisper.cpp-Modelle (vorhanden oder nicht), Grafikkarte und der eigene Modell-Ordner.
 * `compact` (Onboarding): ohne Zeile zum Modell-Ordner. `blocked`: siehe `ModelDownload`.
 */
export function DesktopModel({
  settings,
  set,
  compact = false,
  blocked,
}: {
  settings: Settings
  set: (patch: Partial<Settings>) => void
  compact?: boolean
  blocked?: string
}) {
  const [status, setStatus] = useState<AsrStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checks, recheck] = useReducer((n: number) => n + 1, 0)
  const speech = useSpeech()
  // Ein fertiger Download (auch einer, der auf einer anderen Seite begann) ändert, was fehlt
  const { finished, lastFinished } = useAsrDownload()
  const [finishedAtMount] = useState(finished)

  useEffect(() => {
    let cancelled = false
    asrStatus()
      .then((st) => {
        if (cancelled) return
        setStatus(st)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [checks, finished])

  const found = (id: string) => status?.models.find((m) => m.id === id)
  const selected = found(settings.desktopModel)
  const again = () => {
    recheck()
    // Ein eben abgelegtes Modell gleich laden (ein Fehler vorher wird damit neu versucht)
    if (speech.status === 'error') void speech.ensureLoaded().catch(() => undefined)
  }
  // Eben geladen (solange diese Ansicht offen ist, auch wenn der Download vorher anderswo begann):
  // Bestätigung stehen lassen und die Erkennung gleich vorbereiten
  const justLoaded = finished > finishedAtMount && lastFinished === settings.desktopModel
  const downloaded = () => {
    recheck()
    void speech.ensureLoaded().catch(() => undefined)
  }
  const loadedLabel = whisperModel(settings.desktopModel)?.label ?? settings.desktopModel
  const next = speech.status === 'ready' ? 'Spracherkennung bereit – du kannst sprechen.' : speech.status === 'loading' ? 'Spracherkennung wird vorbereitet …' : ''

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <select value={settings.desktopModel} onChange={(e) => set({ desktopModel: e.target.value })} className="rounded-md border border-line bg-black/30 px-2 py-1">
          {WHISPER_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.sizeMb} MB, {m.note}){status && !found(m.id)?.path ? ' – fehlt' : ''}
            </option>
          ))}
        </select>
        <label
          className="flex items-center gap-2"
          title={status && !status.gpu ? 'Diese Version enthält keine Vulkan-Unterstützung – es rechnet die CPU.' : 'Vulkan: auf der Grafikkarte etwa fünfmal schneller. Klappt es nicht, rechnet von selbst die CPU.'}
        >
          <input type="checkbox" checked={settings.desktopGpu && status?.gpu !== false} disabled={status?.gpu === false} onChange={(e) => set({ desktopGpu: e.target.checked })} />
          Grafikkarte nutzen
        </label>
      </div>
      {error && <p className="text-red-300">{error}</p>}
      {status && !status.available && <p className="text-red-300">Die Spracherkennung ist in dieser Version nicht enthalten.</p>}
      {selected && !selected.path && <ModelDownload key={settings.desktopModel} modelId={settings.desktopModel} onDone={downloaded} blocked={blocked} />}
      {justLoaded && selected?.path && <ModelLoaded label={loadedLabel} next={next} />}
      {status && !compact && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>
            Modell-Ordner: <span className="font-mono">{status.modelDir}</span>
          </span>
          <button className="rounded border border-line px-2 py-0.5 hover:border-phosphor" onClick={() => void openModelDir().catch((e: unknown) => setError(String(e)))}>
            Ordner öffnen
          </button>
          <button className="rounded border border-line px-2 py-0.5 hover:border-phosphor" onClick={again}>
            Neu prüfen
          </button>
        </div>
      )}
    </div>
  )
}

/** Sprechtaste ausprobieren: Pegel, Länge und was erkannt wurde. */
export function MicTest({ settings, onOpened, onClose }: { settings: Settings; onOpened: () => void; onClose: () => void }) {
  const speech = useSpeech()
  const [state, dispatch] = useReducer(speechReducer, initialSpeech)
  const [capture, setCapture] = useState<AudioCapture | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const ensureLoaded = speech.ensureLoaded

  useEffect(() => {
    let release: (() => void) | null = null
    let cancelled = false
    ensureLoaded().catch(() => undefined)
    acquireMicrophone({ deviceId: settings.micId || undefined, filters: settings.micFilters })
      .then((m) => {
        if (cancelled) return m.release()
        release = m.release
        setCapture(m.capture)
        onOpened()
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
      release?.()
    }
  }, [settings.micId, settings.micFilters, ensureLoaded, onOpened])

  const sending = state.phase === 'sending'
  const press = () => {
    if (!capture || !['ready', 'review', 'discarded', 'error'].includes(state.phase)) return
    capture.start()
    if (settings.squelch) squelch('open')
    dispatch({ type: 'press', at: performance.now() })
  }
  const release = () => {
    if (!capture || !sending) return
    dispatch({ type: 'release', at: performance.now() })
    if (settings.squelch) squelch('close')
    void capture
      .stop()
      .then(async (rec) => {
        dispatch({ type: 'recorded', stats: rec.stats })
        setInfo(`${(rec.stats.durationMs / 1000).toFixed(1)} s gehalten, Spitze ${dbfs(rec.stats.peak).toFixed(0)} dBFS`)
        if (checkRecording(rec.stats)) return
        const r = await ensureLoaded()
        const out = await r.transcribe(rec.pcm, buildHints(content))
        setInfo((i) => `${i} · erkannt in ${(out.ms / 1000).toFixed(1)} s`)
        dispatch({ type: 'recognized', raw: out.text })
      })
      .catch((e: unknown) => dispatch({ type: 'failed', error: e instanceof Error ? e.message : String(e) }))
  }
  usePushToTalk({ enabled: !!capture, keyCode: settings.pttKey, mode: settings.pttMode, sending, onPress: press, onRelease: release })

  return (
    <div className="space-y-2 rounded-lg border border-line bg-black/20 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <PttButton sending={sending} toggle={settings.pttMode === 'toggle'} disabled={!capture || state.phase === 'recognizing'} onPress={press} onRelease={release} />
        <span className="text-muted">Sag zum Beispiel: „Radio check, how do you read?“</span>
        <button className="ml-auto text-muted hover:text-text" onClick={onClose}>
          Test beenden
        </button>
      </div>
      <LevelMeter capture={capture} />
      {capture?.deviceLabel && <p className="text-xs text-muted">Mikrofon: {micLabel(capture.deviceLabel)}</p>}
      {error && <p className="text-red-300">{error}</p>}
      {state.phase === 'recognizing' && <p className="text-muted">Erkenne …</p>}
      {state.phase === 'review' && (
        <p>
          Erkannt:{' '}
          <span lang="en" className="font-mono">
            „{state.transcript?.text}“
          </span>
        </p>
      )}
      {state.phase === 'discarded' && state.discard && <p className="text-amber-hud">{DISCARD_TEXT[state.discard]}</p>}
      {state.phase === 'error' && <p className="text-red-300">{state.error}</p>}
      {info && <p className="text-xs text-muted">{info}</p>}
    </div>
  )
}
