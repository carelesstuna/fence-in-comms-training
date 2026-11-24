/**
 * Merk-Übung zum Readback: Die Gegenstelle spricht, der Text erscheint Teil für Teil – im Takt der Sprachausgabe,
 * sofern sie läuft – und verschwindet je nach Stufe wieder (wer zuerst kam, geht zuerst). Danach liest du zurück,
 * aus dem Kopf oder von deinen Notizen auf dem Kneeboard.
 *
 * Acht Stufen, jeweils mit wenig und mit vielen Angaben: Text bleibt stehen, verschwindet langsam, verschwindet
 * schnell, nur hören. Die höchste geschaffte Stufe merkt sich der Fortschritt.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MemoryDrill, MemorySet, ResolvedTransmission } from '../core/drills/types'
import { resolveDrill } from '../core/drills/resolve'
import { pauseBefore } from '../core/audio/speech-text'
import { content, useRun } from '../ui/run'
import { useApp } from '../state/store'
import { useRadioAudio } from '../platform/audio-context'
import { castKeyFor, waitGap } from './audio/exchange-audio'
import { RadioTaskHeader } from './RadioFrame'
import { CallInput } from './CallInput'
import { RadioPanel, TransmissionLine } from './CallAnatomy'
import { hintContextForExchange, typedDigitsFor } from '../ui/speech'

type Show = 'stay' | 'slow' | 'fast' | 'none'

const MEMORY_LEVELS: { level: number; show: Show; many: boolean; label: string }[] = [
  { level: 1, show: 'stay', many: false, label: 'Text bleibt, wenig Angaben' },
  { level: 2, show: 'stay', many: true, label: 'Text bleibt, viele Angaben' },
  { level: 3, show: 'slow', many: false, label: 'Text verschwindet langsam, wenig Angaben' },
  { level: 4, show: 'slow', many: true, label: 'Text verschwindet langsam, viele Angaben' },
  { level: 5, show: 'fast', many: false, label: 'Text verschwindet schnell, wenig Angaben' },
  { level: 6, show: 'fast', many: true, label: 'Text verschwindet schnell, viele Angaben' },
  { level: 7, show: 'none', many: false, label: 'Nur hören, wenig Angaben' },
  { level: 8, show: 'none', many: true, label: 'Nur hören, viele Angaben' },
]

/** So lange bleibt ein Teil stehen, nachdem er gesprochen wurde (Sekunden). */
const SHOW_SECONDS: Record<Show, number> = { stay: Infinity, slow: 6, fast: 2.5, none: 0 }
/** Sprechtempo für den Zeitplan ohne Ton: Wörter pro Sekunde bei Tempo 1. */
const WORDS_PER_SECOND = 2.6
/** Vorlauf bis zur Stimme (Taste drücken, Rauschen), wie in der Funkkette. */
const LEAD_IN = 0.5

type Phase = 'ready' | 'transmit' | 'hold' | 'answer' | 'done'

const words = (t: string) => t.split(/\s+/).filter(Boolean).length

/** Zeitplan einer Übertragung: wann jeder Teil gesprochen wird (Sekunden ab Start der Stimme) und wie lange. */
function timeline(t: ResolvedTransmission, tempo: number): { at: number; dur: number }[] {
  let at = 0
  return t.segments.map((s, i) => {
    if (i > 0) at += 0.12 + pauseBefore(t.segments, i, t.pace)
    const dur = Math.max(0.45, words(s.spoken ?? s.text) / (WORDS_PER_SECOND * tempo))
    const slot = { at, dur }
    at += dur
    return slot
  })
}

const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000))

export function MemoryDrillView({ drill: first, onAnswered }: { drill: MemoryDrill; onAnswered: (correct: boolean) => void }) {
  const run = useRun()
  const audio = useRadioAudio()
  const tempo = useApp((s) => s.profile.audio.tempo)
  const passed = useApp((s) => s.progress.memory?.[first.id] ?? 0)
  const passMemoryLevel = useApp((s) => s.passMemoryLevel)
  const [level, setLevel] = useState(() => Math.min(8, Math.max(first.level, passed + 1)))
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [visible, setVisible] = useState<ReadonlySet<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const answered = useRef(false)
  const timers = useRef<number[]>([])
  /** Laufender Durchgang; jeder Neustart oder Abbruch zählt weiter, ältere Durchgänge hören dann auf. */
  const runId = useRef(0)
  const current = audio.current
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])

  // Neuer Versuch: neu gewürfelt (gleiche Übung, anderer Seed)
  const drill = useMemo<MemoryDrill>(() => {
    if (attempt === 0) return first
    const raw = content.drills.get(first.id)
    const d = raw ? resolveDrill(raw, run.envFor(`memory:${first.id}:${attempt}`)) : first
    return d.kind === 'memory' ? d : first
  }, [attempt, first, run])
  const meta = MEMORY_LEVELS[level - 1]
  const set: MemorySet = meta.many ? drill.many : drill.few
  const cast = castKeyFor(set.exchange)
  const sound = audio.enabled && audio.available
  // Nur hören geht nur mit Ton; ohne Ton wird daraus „verschwindet schnell“
  const show: Show = meta.show === 'none' && !sound ? 'fast' : meta.show
  const expected = set.answer >= 0 ? set.answerExchange.transmissions[set.answer] : undefined

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }
  useEffect(
    () => () => {
      runId.current++
      clearTimers()
    },
    [],
  )

  const reset = () => {
    runId.current++
    clearTimers()
    if (audio.current?.key.startsWith('mem:')) audio.stop()
    setVisible(new Set())
    setPhase('ready')
    setNotes('')
    setLastCorrect(null)
  }

  /** Teile einer Übertragung nach Zeitplan ein- und (je nach Stufe) wieder ausblenden; gibt die Dauer zurück. */
  const schedule = (ti: number, t: ResolvedTransmission, offset: number): number => {
    const slots = timeline(t, tempo)
    const keep = SHOW_SECONDS[show]
    slots.forEach(({ at, dur }, si) => {
      const key = `${ti}:${si}`
      if (show !== 'none') {
        timers.current.push(window.setTimeout(() => setVisible((v) => new Set(v).add(key)), (offset + at) * 1000))
      }
      if (Number.isFinite(keep) && show !== 'none') {
        timers.current.push(
          window.setTimeout(
            () =>
              setVisible((v) => {
                const n = new Set(v)
                n.delete(key)
                return n
              }),
            (offset + at + Math.max(dur, keep)) * 1000,
          ),
        )
      }
    })
    const last = slots[slots.length - 1]
    return offset + (last ? last.at + Math.max(last.dur, Number.isFinite(keep) ? keep : 0) : 0)
  }

  const start = async () => {
    reset()
    const my = runId.current
    const dead = () => runId.current !== my
    setPhase('transmit')
    let until = 0
    for (let k = 0; k < set.heard.length; k++) {
      const ti = set.heard[k]
      const t = set.exchange.transmissions[ti]
      if (!t || t.skip) continue
      if (k > 0 && !(await waitGap(dead))) return
      if (sound) {
        const req = { key: `mem:${cast}:${ti}`, transmissions: set.exchange.transmissions, index: ti, cast }
        const playing = audio.play(req)
        // Text im Takt: erst einplanen, wenn die Wiedergabe wirklich läuft (die Stimme wird vorher gerechnet)
        const t0 = Date.now()
        while (!dead() && !(currentRef.current?.key === req.key && currentRef.current.phase === 'playing')) {
          if (Date.now() - t0 > 20000) break
          await sleep(0.04)
        }
        const startedAt = Date.now()
        const end = schedule(ti, t, LEAD_IN)
        await playing
        until = Math.max(0, end - (Date.now() - startedAt) / 1000)
      } else {
        // Ohne Ton: so lange, wie das Sprechen ungefähr dauern würde
        const end = schedule(ti, t, 0.3)
        const slots = timeline(t, tempo)
        const spoken = 0.3 + (slots.length ? slots[slots.length - 1].at + slots[slots.length - 1].dur : 0)
        await sleep(spoken)
        until = Math.max(0, end - spoken)
      }
      if (dead()) return
    }
    if (show === 'stay') {
      setPhase('hold')
      return
    }
    // Erst wenn der letzte Teil weg ist, wird zurückgelesen
    await sleep(Math.min(until, 8))
    if (dead()) return
    clearTimers()
    setVisible(new Set())
    setPhase('answer')
  }

  const toAnswer = () => {
    clearTimers()
    setVisible(new Set())
    setPhase('answer')
  }

  const heard = set.heard.map((ti) => ({ ti, t: set.exchange.transmissions[ti] })).filter(({ t }) => t && !t.skip)

  return (
    <div>
      <RadioTaskHeader kind="Merken und zurücklesen" drill={{ ...set, prompt: drill.prompt }} />

      {/* Stufen */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Stufe">
        {MEMORY_LEVELS.map((l) => (
          <button
            key={l.level}
            role="radio"
            aria-checked={l.level === level}
            title={l.label}
            disabled={phase === 'transmit'}
            onClick={() => {
              setLevel(l.level)
              reset()
            }}
            className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
              l.level === level ? 'border-phosphor bg-phosphor/15 text-phosphor' : 'border-line text-muted hover:border-phosphor-dim'
            }`}
          >
            {l.level}
            {passed >= l.level ? ' ✓' : ''}
          </button>
        ))}
        <span className="text-sm text-muted">
          Stufe {level}: {meta.label}
          {meta.show === 'none' && !sound ? ' – ohne Ton: Text verschwindet schnell' : ''}
        </span>
      </div>

      {/* Funk: Teile erscheinen und verschwinden */}
      <div className="scanlines overflow-hidden rounded-xl border border-line bg-panel">
        <div className="border-b border-line bg-panel-2 px-4 py-2 text-sm font-semibold text-text">Auf der Frequenz</div>
        <div className="min-h-24 space-y-3 px-4 py-3">
          {phase === 'ready' && (
            <p className="text-sm text-muted">
              {show === 'none'
                ? 'Du hörst nur – Text gibt es auf dieser Stufe nicht.'
                : show === 'stay'
                  ? 'Der Text erscheint Teil für Teil und bleibt stehen, bis du zurückliest.'
                  : `Der Text erscheint Teil für Teil und ist nach ${String(SHOW_SECONDS[show]).replace('.', ',')} Sekunden wieder weg.`}{' '}
              Schreib mit, was du brauchst.
            </p>
          )}
          {(phase === 'transmit' || phase === 'hold') &&
            heard.map(({ ti, t }) => (
              <div key={ti} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                <div className="flex shrink-0 items-center gap-2 pt-1 sm:w-44">
                  <span className="h-2 w-2 rounded-full bg-phosphor" />
                  <span className="font-mono text-xs tracking-wide text-phosphor uppercase">{t.speaker}</span>
                  {audio.current?.key === `mem:${cast}:${ti}` && <span className="text-xs text-muted">◉</span>}
                </div>
                <div className="flex min-h-8 flex-wrap gap-1.5">
                  {t.segments.map((s, si) => (
                    <span
                      key={si}
                      className={`rounded-md bg-white/5 px-2 py-1 font-mono text-[0.95rem] transition-opacity duration-500 ${
                        visible.has(`${ti}:${si}`) ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden={!visible.has(`${ti}:${si}`)}
                    >
                      {s.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          {phase === 'answer' && <p className="text-sm text-muted">Jetzt du: Lies zurück, was du gehört hast.</p>}
          {phase === 'done' && (
            <RadioPanel exchange={set.exchange} neutral>
              {heard.map(({ ti, t }) => (
                <TransmissionLine key={ti} t={t} />
              ))}
            </RadioPanel>
          )}
        </div>
      </div>

      {/* Kneeboard */}
      {phase !== 'ready' && (
        <label className="mt-3 block rounded-xl border border-[#c9c2ae] bg-[#f3efe4] p-3 text-[#1d1d1b] shadow-inner">
          <span className="mb-1 flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#6b6657] uppercase">
            <span>Kneeboard – deine Notizen</span>
            <span className="font-normal normal-case">wird nicht bewertet</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="z. B. RWY 27 · A, B · HS 27"
            className="w-full resize-y bg-transparent font-mono text-[13px] outline-none placeholder:text-[#9b9481]"
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {phase === 'ready' && (
          <button onClick={() => void start()} className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink hover:brightness-110">
            ▶ Funkspruch {sound ? 'abspielen' : 'zeigen'}
          </button>
        )}
        {phase === 'transmit' && (
          <button onClick={reset} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-text">
            Abbrechen
          </button>
        )}
        {phase === 'hold' && (
          <button onClick={toAnswer} className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink hover:brightness-110">
            Zurücklesen – Text ausblenden
          </button>
        )}
      </div>

      {(phase === 'answer' || phase === 'done') && expected && (
        <div className="mt-4">
          <CallInput
            key={`${attempt}:${level}`}
            expected={expected}
            expectSilence={false}
            explain={drill.explain}
            hintContext={hintContextForExchange(set.exchange)}
            typedDigits={typedDigitsFor({ drillId: drill.id })}
            onDone={(r) => {
              setPhase('done')
              setLastCorrect(r.correct)
              if (r.correct) passMemoryLevel(first.id, level)
              if (!answered.current) {
                answered.current = true
                onAnswered(r.correct)
              }
            }}
          />
        </div>
      )}

      {phase === 'done' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {lastCorrect && level < 8 && (
            <button
              onClick={() => {
                setLevel(level + 1)
                setAttempt((a) => a + 1)
                reset()
              }}
              className="rounded-lg border border-phosphor px-3 py-2 text-sm text-phosphor hover:bg-phosphor/10"
            >
              Nächste Stufe ({level + 1}: {MEMORY_LEVELS[level].label})
            </button>
          )}
          <button
            onClick={() => {
              setAttempt((a) => a + 1)
              reset()
            }}
            className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-text"
          >
            Noch einmal, neu gewürfelt
          </button>
        </div>
      )}
    </div>
  )
}
