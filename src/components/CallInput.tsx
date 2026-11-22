/**
 * Eingabe eines eigenen Funkspruchs – tippen oder sprechen – mit Bewertung Segment für Segment.
 * Auch „Nichts sagen“ ist eine Antwort – manchmal die richtige (push, Meldungen für andere).
 *
 * Im Sprechmodus bleibt Tippen daneben möglich; das Textfeld bekommt dann aber nicht automatisch
 * den Fokus, damit die Leertaste als Sprechtaste frei ist.
 */
import { useEffect, useRef, useState } from 'react'
import type { ResolvedTransmission } from '../core/drills/types'
import type { CallScore } from '../core/scoring/score'
import type { HintContext } from '../core/speech/hints'
import { roleInfo } from '../ui/roles'
import { scoreTransmission } from '../ui/scoring'
import { useApp } from '../state/store'
import { InlineMarkdown } from './Markdown'
import { RoleLegend, SegmentDetail, TransmissionLine, type Verdict } from './CallAnatomy'
import { SpeakPanel } from './speech/SpeakPanel'
import { isTextField } from '../platform/usePushToTalk'
import { MODEL_LABEL } from '../ui/scenarioLog'

export interface CallResult {
  correct: boolean
  score: number
  silent: boolean
  text: string
  detail?: CallScore
  /** Gesprochen: `text` ist das Transkript der Spracherkennung. */
  spoken?: boolean
  /** Versuche, die vorher als „nicht richtig erkannt“ verworfen wurden. */
  rejected?: number
}

const STATUS_VERDICT: Record<string, Verdict> = { ok: 'right', wrong: 'wrong', missing: 'wrong', misplaced: 'warn', skipped: 'dim' }

export function CallInput({
  expected,
  expectSilence,
  hint,
  explain,
  blind = false,
  hintContext,
  onDone,
}: {
  expected?: ResolvedTransmission
  expectSilence: boolean
  hint?: string
  explain?: string
  /** Checkride: kein Hinweis, keine Bewertung sofort – die kommt erst im Debriefing. */
  blind?: boolean
  /** Für die Spracherkennung: Modul und Stationen (nie die Lösung). */
  hintContext?: HintContext
  onDone: (r: CallResult) => void
}) {
  const speech = useApp((s) => s.profile.speech)
  const speak = speech.input === 'speak'
  const [text, setText] = useState('')
  const [result, setResult] = useState<CallResult | null>(null)
  const [showHint, setShowHint] = useState(false)

  const evaluate = (input: string, spoken: boolean, rejected = 0): CallResult => {
    const extra = spoken ? { spoken, rejected } : {}
    if (expectSilence || !expected) return { correct: false, score: 0, silent: false, text: input, ...extra }
    const detail = scoreTransmission(input, expected, { source: spoken ? 'spoken' : 'typed' })
    return { correct: detail.correct, score: detail.score, silent: false, text: input, detail, ...extra }
  }

  const commit = (r: CallResult) => {
    if (result) return
    setResult(r)
    // Für Abzeichen zählen: richtiger Funkspruch (sauber = ohne überflüssiges Wort) bzw. richtiges Schweigen
    if (expectSilence) useApp.getState().track({ kind: 'silence', correct: r.correct })
    else useApp.getState().track({ kind: 'call', correct: r.correct, clean: r.correct && (r.detail?.extras.length ?? 0) === 0 })
    onDone(r)
  }

  const submit = (silent: boolean) => {
    if (silent) return commit({ correct: expectSilence, score: expectSilence ? 1 : 0, silent: true, text: '' })
    if (text.trim()) commit(evaluate(text, false))
  }

  const setSpeak = (on: boolean) => {
    // Steht der Cursor noch im Textfeld, würde die Leertaste dort tippen statt zu senden
    if (on && document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
    useApp.getState().setProfile({ speech: { ...speech, input: on ? 'speak' : 'type' } })
  }

  // Im Sprechmodus: Wer einfach lostippt, landet im Textfeld (die Sprechtaste selbst ausgenommen)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!speak || result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.code === speech.pttKey || e.ctrlKey || e.altKey || e.metaKey || isTextField(e.target)) return
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [speak, result, speech.pttKey])

  const skeleton = expected?.segments.filter((s) => !s.optional).map((s) => roleInfo(s.role).label).join(' – ')

  return (
    <div>
      {!result && (
        <>
          <div className="mb-2 flex items-center gap-1 text-xs" role="group" aria-label="Eingabe">
            <button
              type="button"
              aria-pressed={!speak}
              onClick={() => setSpeak(false)}
              className={`rounded-md px-2.5 py-1 ${!speak ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}`}
            >
              ⌨ Tippen
            </button>
            <button
              type="button"
              aria-pressed={speak}
              onClick={() => setSpeak(true)}
              className={`rounded-md px-2.5 py-1 ${speak ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}`}
            >
              🎙 Sprechen
            </button>
          </div>
          {speak && (
            <div className="mb-2">
              <SpeakPanel
                blind={blind}
                hintContext={hintContext}
                judge={(t) => evaluate(t, true).correct}
                onCommit={(t, rejected) => commit(evaluate(t, true, rejected))}
              />
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(false)
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-black/30 px-3 focus-within:border-phosphor">
              <span className="font-mono text-xs text-amber-hud">{speak ? '⌨ ▸' : 'PTT ▸'}</span>
              <input
                ref={inputRef}
                autoFocus={!speak}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={speak ? '… oder tippen (Teile mit Komma trennen)' : 'Funkspruch eintippen … (Teile mit Komma trennen)'}
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-2 font-mono text-text outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!text.trim()}
              className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
            >
              Funken
            </button>
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <button onClick={() => submit(true)} className="rounded-md border border-line px-2.5 py-1 text-muted hover:text-text" title="Bewusst nicht funken">
              🔇 Nichts sagen
            </button>
            {!blind && (hint || skeleton) && (
              <button onClick={() => setShowHint(true)} className="text-muted hover:text-text">
                {showHint ? `Hinweis: ${hint ?? skeleton}` : 'Hinweis anzeigen'}
              </button>
            )}
          </div>
        </>
      )}

      {result && blind && (
        <div role="status" className="mt-1 rounded-lg border border-line bg-black/20 px-4 py-2.5 text-sm">
          {result.silent ? (
            <span className="text-muted">🔇 Du schweigst.</span>
          ) : (
            <>
              <span className="text-muted">{result.spoken ? 'Gesendet (gesprochen): ' : 'Gesendet: '}</span>
              <span lang="en" className="font-mono">
                „{result.text}“
              </span>
            </>
          )}
        </div>
      )}
      {result && !blind && <CallFeedback result={result} expected={expected} expectSilence={expectSilence} explain={explain} />}
    </div>
  )
}

const HEARD_CLASS: Record<string, string> = {
  ok: 'text-emerald-300',
  misplaced: 'text-amber-300 underline decoration-dotted',
  wrong: 'text-red-300 underline decoration-wavy',
}

/**
 * Das Erkannte Wort für Wort: Farbe zeigt, ob es zum Segment passte (grün), an anderer Stelle stand
 * (gelb), nicht stimmte (rot) oder übrig blieb (durchgestrichen). Der Tooltip nennt das Segment.
 */
function HeardLine({ detail, expected }: { detail: CallScore; expected?: ResolvedTransmission }) {
  return (
    <span lang="en" className="font-mono">
      „
      {detail.heard.map((w, i) => {
        const slot = w.slot !== undefined ? detail.slots[w.slot] : undefined
        const seg = w.slot !== undefined ? expected?.segments[w.slot] : undefined
        return (
          <span key={i}>
            {i > 0 && ' '}
            <span
              className={slot ? (slot.weak ? HEARD_CLASS.misplaced : (HEARD_CLASS[slot.status] ?? '')) : 'text-muted line-through'}
              title={seg ? `${roleInfo(seg.role).label}: ${seg.text}` : 'passt zu keinem Teil'}
            >
              {w.text}
            </span>
          </span>
        )
      })}
      “
    </span>
  )
}

/** Bewertung eines Funkspruchs: richtig/falsch, Hinweise, aufgeschlüsselte Musterlösung, Erklärung. */
export function CallFeedback({
  result,
  expected,
  expectSilence,
  explain,
}: {
  result: CallResult
  expected?: ResolvedTransmission
  expectSilence: boolean
  explain?: string
}) {
  const [sel, setSel] = useState<number | null>(null)
  const verdicts: Record<number, Verdict> = {}
  // Geduldete Form (weak): gilt, aber nicht nach Vorschrift – gelb wie „andere Reihenfolge“
  result.detail?.slots.forEach((s) => (verdicts[s.index] = s.weak ? 'warn' : STATUS_VERDICT[s.status]))
  const skipped = result.silent ? [] : (result.detail?.slots ?? []).filter((s) => s.status === 'skipped').flatMap((s) => expected?.segments[s.index] ?? [])
  const weak = result.correct && !result.silent && !!result.detail?.weak
  return (
    <div
      role="status"
      className={`mt-1 rounded-lg border px-4 py-3 ${weak ? 'border-amber-400/40 bg-amber-500/10' : result.correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}
    >
      <div className={`font-semibold ${weak ? 'text-amber-300' : result.correct ? 'text-emerald-300' : 'text-red-300'}`}>
        {result.correct
          ? result.silent
            ? '✓ Richtig – hier sagt man nichts.'
            : weak
              ? `✓ Gilt – aber nicht ganz nach Vorschrift (${Math.min(99, Math.round(result.score * 100))} %)`
              : '✓ Sauber gefunkt'
          : result.silent
            ? '✗ Hier hättest du funken müssen.'
            : expectSilence
              ? '✗ Hier wäre Schweigen richtig gewesen.'
              : `✗ Nicht ganz (${Math.min(99, Math.round(result.score * 100))} %)`}
      </div>
      {!result.silent &&
        (result.spoken && result.detail ? (
          <div className="mt-1 text-sm">
            <span className="text-muted">Erkannt: </span>
            <HeardLine detail={result.detail} expected={expected} />
            {!!result.rejected && <span className="ml-2 text-xs text-muted">({result.rejected}× neu gesprochen)</span>}
          </div>
        ) : (
          <div className="mt-1 text-sm">
            <span className="text-muted">{result.spoken ? 'Erkannt: ' : 'Du: '}</span>
            <span lang="en" className="font-mono">
              „{result.text}“
            </span>
          </div>
        ))}
      {result.detail && result.detail.issues.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
          {result.detail.issues.map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ul>
      )}
      {expected && !expectSilence && (
        <div className="mt-3 rounded-lg bg-black/20 px-3 py-2.5">
          {/* Das ist die Musterlösung, nicht dein Wortlaut – der steht oben (U2-05, E1-20) */}
          <div className="mb-1.5 text-xs text-muted">
            {result.correct ? 'Musterlösung, aufgeschlüsselt – grün umrandet, was du gesagt hast:' : 'So wäre es richtig (Musterlösung):'}
          </div>
          <TransmissionLine t={expected} label={MODEL_LABEL} verdicts={verdicts} selectedIndex={sel} onSelect={setSel} />
          {skipped.length > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Optional, von dir weggelassen:{' '}
              {skipped.map((s, k) => (
                <span key={k}>
                  {k > 0 && ', '}
                  <span lang="en" className="font-mono">
                    „{s.text}“
                  </span>
                </span>
              ))}{' '}
              – tippe darauf, wofür {skipped.length > 1 ? 'sie gut sind' : 'es gut ist'}.
            </p>
          )}
          <div className="mt-2">
            <SegmentDetail seg={sel !== null ? expected.segments[sel] : null} />
          </div>
          <div className="mt-2">
            <RoleLegend exchange={{ id: '', title: '', layer: 'core', transmissions: [expected] }} />
          </div>
        </div>
      )}
      {explain && (
        <div className="mt-2 text-[0.95rem]">
          <InlineMarkdown text={explain} />
        </div>
      )}
    </div>
  )
}
