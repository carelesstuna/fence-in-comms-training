/**
 * Sprechen statt tippen: Sprechtaste (Leertaste oder Maus), Aufnahme, Erkennung und Prüfen des
 * Transkripts. Das Mikrofon ist nur offen, solange dieser Teil zu sehen ist.
 *
 * Ist das Transkript laut Bewertung richtig, wird sofort gewertet. Sonst kann man es werten lassen
 * oder als „nicht richtig erkannt“ verwerfen – das zählt als Verwurf. Im Checkride (blind) gibt es
 * keine Vorab-Bewertung: Man bestätigt nur, dass das Transkript stimmt.
 */
import { useEffect, useReducer, useRef, useState } from 'react'
import { useApp } from '../../state/store'
import { content } from '../../ui/run'
import { buildHints, type HintContext } from '../../core/speech/hints'
import { initialSpeech, keyLabel, speechReducer, type SpeechPhase } from '../../core/speech/flow'
import { checkRecording, cleanTranscript, DISCARD_TEXT } from '../../core/speech/transcript'
import { acquireMicrophone, type AudioCapture } from '../../platform/audio-capture'
import { isTauri, useSpeech } from '../../platform/speech-context'
import { usePushToTalk } from '../../platform/usePushToTalk'
import { squelch } from '../../platform/squelch'
import { LevelMeter, PttButton } from './SpeechParts'
import { ModelDownload, ModelLoaded } from './ModelDownload'
import { whisperModel } from '../../platform/whisper-config'

const CAN_PRESS: readonly SpeechPhase[] = ['ready', 'review', 'discarded', 'error']

export function SpeakPanel({
  blind,
  hintContext,
  judge,
  onCommit,
}: {
  blind: boolean
  hintContext?: HintContext
  /** Wäre dieses Transkript richtig? (Nur ohne `blind` genutzt.) */
  judge: (text: string) => boolean
  /** Transkript werten; `rejected`: verworfene Versuche davor. */
  onCommit: (text: string, rejected: number) => void
}) {
  const settings = useApp((s) => s.profile.speech)
  const speech = useSpeech()
  const [state, dispatch] = useReducer(speechReducer, initialSpeech)
  const [capture, setCapture] = useState<AudioCapture | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  /** Verwürfe vor dem laufenden Versuch (für die automatische Wertung nach der Erkennung). */
  const rejectedBefore = useRef(0)
  /** Modell eben nachgeladen: Bestätigung zeigen, bis zum ersten Drücken der Sprechtaste. */
  const [justLoaded, setJustLoaded] = useState(false)
  const ensureLoaded = speech.ensureLoaded

  // Modell im Hintergrund laden, sobald jemand sprechen will
  useEffect(() => {
    ensureLoaded().catch(() => undefined)
  }, [ensureLoaded])

  // Mikrofon nur, solange ein Funkspruch erwartet wird
  useEffect(() => {
    let release: (() => void) | null = null
    let cancelled = false
    acquireMicrophone({ deviceId: settings.micId || undefined, filters: settings.micFilters })
      .then((m) => {
        if (cancelled) return m.release()
        release = m.release
        setCapture(m.capture)
        setMicError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setMicError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
      release?.()
    }
  }, [settings.micId, settings.micFilters])

  const sending = state.phase === 'sending'

  const press = () => {
    if (!capture || !CAN_PRESS.includes(state.phase)) return
    setJustLoaded(false)
    rejectedBefore.current = state.rejected + (state.phase === 'review' ? 1 : 0)
    capture.start()
    if (settings.squelch) squelch('open')
    dispatch({ type: 'press', at: performance.now() })
  }

  const release = () => {
    if (!capture || state.phase !== 'sending') return
    dispatch({ type: 'release', at: performance.now() })
    if (settings.squelch) squelch('close')
    const hints = buildHints(content, hintContext ?? {})
    void capture
      .stop()
      .then(async (rec) => {
        dispatch({ type: 'recorded', stats: rec.stats })
        if (checkRecording(rec.stats)) return
        const recognizer = await ensureLoaded()
        const out = await recognizer.transcribe(rec.pcm, hints)
        dispatch({ type: 'recognized', raw: out.text })
        const t = cleanTranscript(out.text)
        // Richtig erkannt und richtig: sofort werten
        if (!t.discarded && !blind && judge(t.text)) {
          dispatch({ type: 'accept' })
          onCommit(t.text, rejectedBefore.current)
        }
      })
      .catch((e: unknown) => dispatch({ type: 'failed', error: e instanceof Error ? e.message : String(e) }))
  }

  usePushToTalk({ enabled: !!capture && state.phase !== 'done', keyCode: settings.pttKey, mode: settings.pttMode, sending, onPress: press, onRelease: release })

  const toggle = settings.pttMode === 'toggle'
  const key = keyLabel(settings.pttKey)
  const transcript = state.transcript?.text ?? ''

  return (
    <div className="rounded-lg border border-line bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <PttButton sending={sending} toggle={toggle} disabled={!capture || state.phase === 'recognizing' || state.phase === 'done'} onPress={press} onRelease={release} />
        <div className="min-w-0 flex-1 text-sm">
          {state.phase === 'sending' ? (
            <span className="font-semibold text-red-300">● Sendet – {toggle ? `${key} noch einmal drücken` : 'loslassen'}, wenn du fertig bist.</span>
          ) : state.phase === 'recognizing' ? (
            <span className="text-muted">Erkenne …</span>
          ) : (
            <span className="text-muted">
              {toggle ? `${key} drücken, sprechen, ${key} wieder drücken` : `${key} halten, sprechen, nach dem letzten Wort loslassen`} – oder den Knopf mit der Maus.
            </span>
          )}
          <LevelMeter capture={capture} className="mt-1.5" />
        </div>
      </div>

      {micError && <p className="mt-2 text-sm text-red-300">🎙 {micError}</p>}
      {speech.status === 'loading' && (
        <p className="mt-2 text-xs text-muted">
          Spracherkennung wird vorbereitet ({speech.engineLabel}) …{speech.progress > 0 && ` ${Math.round(speech.progress * 100)} %`}
        </p>
      )}
      {speech.status === 'error' && (
        <p className="mt-2 text-sm text-red-300">
          {speech.error}
          {speech.missingModel && <span className="block text-muted">Tippen geht weiterhin.</span>}
        </p>
      )}
      {speech.status === 'error' && speech.missingModel && isTauri() && (
        <div className="mt-2">
          <ModelDownload
            modelId={settings.desktopModel}
            onDone={() => {
              setJustLoaded(true)
              void ensureLoaded().catch(() => undefined)
            }}
          />
        </div>
      )}
      {justLoaded && speech.status !== 'error' && (
        <div className="mt-2">
          <ModelLoaded
            label={whisperModel(settings.desktopModel)?.label ?? settings.desktopModel}
            next={speech.status === 'ready' ? `Bereit – ${toggle ? `${key} drücken` : `${key} halten`} und sprechen.` : 'Spracherkennung wird vorbereitet …'}
          />
        </div>
      )}

      {state.phase === 'discarded' && state.discard && (
        <p className="mt-2 text-sm text-amber-hud">
          {DISCARD_TEXT[state.discard]} {state.transcript?.raw ? <span className="text-muted">(erkannt: „{state.transcript.raw.trim()}“)</span> : null}
        </p>
      )}
      {state.phase === 'error' && (
        <p className="mt-2 text-sm text-red-300">
          Erkennung fehlgeschlagen: {state.error}{' '}
          <button className="underline" onClick={() => dispatch({ type: 'again' })}>
            Nochmal
          </button>
        </p>
      )}

      {state.phase === 'review' && (
        <div className="mt-3 space-y-2 text-sm" role="status">
          <div>
            <span className="text-muted">{blind ? 'So wird gesendet: ' : 'Erkannt: '}</span>
            <span lang="en" className="font-mono">
              „{transcript}“
            </span>
          </div>
          {!blind && <div className="text-amber-hud">Laut Bewertung nicht ganz richtig. Stimmt das Transkript?</div>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-phosphor px-3 py-1.5 font-semibold text-ink hover:brightness-110"
              onClick={() => {
                dispatch({ type: 'accept' })
                onCommit(transcript, state.rejected)
              }}
            >
              {blind ? 'Senden' : 'Werten'}
            </button>
            <button className="rounded-lg border border-line px-3 py-1.5 hover:border-amber-hud" onClick={() => dispatch({ type: 'reject' })}>
              Nicht richtig erkannt? Nochmal
            </button>
            <span className="text-xs text-muted">oder gleich die Sprechtaste drücken</span>
          </div>
        </div>
      )}
      {state.rejected > 0 && state.phase !== 'review' && <p className="mt-2 text-xs text-muted">Verworfen: {state.rejected}×</p>}
    </div>
  )
}
