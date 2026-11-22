/**
 * Szenario-Walkthrough: Schritt für Schritt durch einen Funkablauf.
 * Briefing mit Kneeboard, Stufenleiste, Funkgerät selbst einstellen, Funk-Log (mit Anatomie),
 * Platzskizze und Bewertung pro Schritt.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CheckrideRule } from '../core/content/schema'
import type { BuildDrill, ChoiceDrill, ResolvedScenario, ResolvedScenarioStep } from '../core/drills/types'
import { checkTune, type TuneResult } from '../core/scoring/tune'
import { evaluateCheckride, type CheckrideResult, type StepOutcome } from '../core/scoring/checkride'
import { InlineMarkdown } from './Markdown'
import { DrillView } from './Drills'
import { CallFeedback, CallInput, type CallResult } from './CallInput'
import { SegmentDetail, TransmissionLine } from './CallAnatomy'
import { ExchangeAudio, PrefetchAudio } from './audio/ExchangeAudio'
import { AirfieldSketch } from './AirfieldSketch'
import { Kneeboard, WhereHint } from './Kneeboard'
import { ScoreRing } from '../features/lesson/Stepper'
import { scenarioScore } from '../ui/scoring'
import { hintContextForScenario } from '../ui/speech'
import { useApp } from '../state/store'
import { scenarioLog } from '../ui/scenarioLog'
import { NineLineForm, NineLineResultList } from './NineLine'
import type { NineLineResult } from '../core/scoring/nineline'

interface Radio {
  name: string
  freq: string
}

// ---------------------------------------------------------------------------
// Funkgerät einstellen
// ---------------------------------------------------------------------------

function TunePanel({
  step,
  scenario,
  blind,
  onDone,
}: {
  step: ResolvedScenarioStep
  scenario: ResolvedScenario
  /** Checkride: keine Fundort-Hinweise, keine Wertung – nur, was am Funkgerät passiert. */
  blind: boolean
  onDone: (r: TuneResult) => void
}) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<TuneResult | null>(null)
  const tune = step.tune!
  const submit = () => {
    if (!text.trim() || result) return
    const r = checkTune(text, tune, scenario.stations)
    if (r.unreadable) {
      setResult(r)
      return
    }
    setResult(r)
    onDone(r)
  }
  const target = `${tune.channel ? `Kanal ${tune.channel} · ` : ''}${tune.freq}`
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Funkgerät einstellen</div>
      <p className="text-[0.95rem]">
        Stell dein Funkgerät auf <b>{tune.name}</b>. Kanal oder Frequenz stehen auf deinem Kneeboard.
      </p>
      {(!result || result.unreadable) && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-black/30 px-3 focus-within:border-phosphor">
            <span className="font-mono text-xs text-phosphor">◉</span>
            <input
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setResult(null)
              }}
              placeholder="z. B. Kanal 4, Kanal A oder 251.25"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-text outline-none"
            />
          </div>
          <button type="submit" disabled={!text.trim()} className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink disabled:opacity-40">
            Einstellen
          </button>
        </form>
      )}
      {result?.unreadable && <p className="mt-2 text-sm text-amber-hud">Das kann ich nicht lesen – gib einen Kanal („Kanal 4“, „Kanal A“) oder eine Frequenz („251.25“) ein.</p>}
      {result && !result.unreadable && blind && (
        <div role="status" className="mt-3 rounded-lg border border-line bg-black/20 px-4 py-2.5 text-sm">
          {result.correct ? (
            <span>
              ◉ <span className="font-mono">{result.tuned}</span> – {tune.name}
            </span>
          ) : (
            <span>
              {result.reached ? `Auf ${result.tuned} meldet sich ${result.reached.name} – nicht ${tune.name}.` : `Auf ${result.tuned} ist es still.`}{' '}
              <span className="text-muted">Du suchst die richtige Frequenz und stellst um.</span>
            </span>
          )}
        </div>
      )}
      {result && !result.unreadable && !blind && (
        <div
          role="status"
          className={`mt-3 rounded-lg border px-4 py-3 ${result.correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}
        >
          <div className={`font-semibold ${result.correct ? 'text-emerald-300' : 'text-red-300'}`}>
            {result.correct
              ? `✓ ${result.tuned} – ${tune.name}`
              : result.reached
                ? `✗ Auf ${result.tuned} meldet sich ${result.reached.name} – nicht ${tune.name}.`
                : `✗ Auf ${result.tuned} ist es still – niemand antwortet.`}
          </div>
          {!result.correct && (
            <p className="mt-1 text-sm">
              Richtig wäre <span className="font-mono">{target}</span>. Du stellst um – erst jetzt hörst du {tune.name}.
            </p>
          )}
          <WhereHint where={tune.where} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Szenario
// ---------------------------------------------------------------------------

export interface CheckrideMode {
  /** Wofür geprüft wird, z. B. "Wingman". */
  label: string
  rule: Pick<CheckrideRule, 'passScore' | 'noCritical'>
}

export function ScenarioPlayer({
  scenario,
  seed,
  checkride,
  onComplete,
  onCheckride,
  onRestart,
}: {
  scenario: ResolvedScenario
  seed: string
  /** Checkride: ohne Hilfen, alles wird getippt, bewertet erst im Debriefing. */
  checkride?: CheckrideMode
  /** Im Lektionsplayer: wird mit dem Ergebnis (0–1) aufgerufen, wenn alles durch ist. */
  onComplete?: (score: number) => void
  /** Checkride: Ergebnis samt Urteil, sobald abgeschlossen. */
  onCheckride?: (r: CheckrideResult) => void
  onRestart?: () => void
}) {
  const blind = !!checkride
  const [briefed, setBriefed] = useState(!scenario.kneeboard && !checkride)
  const [step, setStep] = useState(0)
  const [results, setResults] = useState<Record<number, number>>({})
  const [calls, setCalls] = useState<Record<number, CallResult>>({})
  const [tunes, setTunes] = useState<Record<number, number>>({})
  const [tuneResults, setTuneResults] = useState<Record<number, TuneResult>>({})
  const [decodes, setDecodes] = useState<Record<number, NineLineResult>>({})
  const [verdict, setVerdict] = useState<CheckrideResult | null>(null)
  const [radio, setRadio] = useState<Radio | null>(null)
  const [showKneeboard, setShowKneeboard] = useState(false)
  const [finished, setFinished] = useState(false)
  const [sel, setSel] = useState<[string, number] | null>(null)
  const st = scenario.steps[step]
  const hintContext = useMemo(() => hintContextForScenario(scenario), [scenario])
  const tuned = !st?.tune || tunes[step] !== undefined
  const interactive = !!st?.you || !!st?.silence || !!st?.decode
  const answered = tuned && (!interactive || results[step] !== undefined)

  // Im Log steht, was du wirklich gesagt hast – die Musterlösung gekennzeichnet daneben (im Checkride gar nicht)
  const log = useMemo(() => scenarioLog(scenario, { step, tuned, answered, blind, calls, results }), [scenario, step, answered, tuned, blind, calls, results])
  // Ton: das Log als ein Funkspruch (gleiche Stimmen im ganzen Szenario); was gleich kommt, wird vorab gerechnet
  const logTransmissions = useMemo(() => log.map((e) => e.t), [log])
  const upcoming = useMemo(
    () => [...(tuned ? [] : (st?.hear ?? [])), ...(answered ? [] : (st?.reply ?? [])), ...(scenario.steps[step + 1]?.hear ?? [])],
    [scenario, step, st, tuned, answered],
  )
  const castId = `szenario:${scenario.id}:${seed}`

  // Funk-Log immer zum neuesten Eintrag scrollen
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [log.length])

  const stages = scenario.steps.reduce<string[]>((acc, s) => (acc[acc.length - 1] === s.stage ? acc : [...acc, s.stage]), [])
  const currentStage = stages.lastIndexOf(st?.stage ?? '')
  // Anzeige: feste Angabe des Schritts (z. B. Intercom) oder das, was du eingestellt hast
  const display = st?.freq ?? (radio ? `${radio.freq} · ${radio.name}` : scenario.kneeboard ? 'nicht eingestellt' : '—')
  const selected = sel ? log.find((e) => e.key === sel[0])?.t.segments[sel[1]] ?? null : null
  const record = (score: number) => setResults((r) => ({ ...r, [step]: score }))
  const recordCall = (c: CallResult) => {
    setCalls((m) => ({ ...m, [step]: c }))
    record(c.score)
  }
  const score = scenarioScore(scenario, results, tunes)

  if (!briefed && (scenario.kneeboard || checkride)) {
    return (
      <div className="space-y-4 rounded-xl border border-line bg-panel p-5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            {checkride ? `Checkride ${checkride.label}` : 'Briefing'} · Mission #{seed}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-white">{scenario.title}</h2>
          <p className="mt-1 text-muted">{scenario.summary}</p>
        </div>
        {checkride && (
          <div className="rounded-lg border border-amber-hud/40 bg-amber-hud/5 px-4 py-3 text-[0.95rem]">
            <div className="mb-1 font-semibold text-amber-hud">Prüfungsflug – so läuft er ab</div>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>Keine Hinweise, keine Farben, keine Bausteine: Jeden Funkspruch tippst du selbst.</li>
              <li>Ob etwas richtig war, erfährst du erst im Debriefing – wie bei einem echten Checkride.</li>
              <li>
                Bestanden ab {Math.round(checkride.rule.passScore * 100)} %
                {checkride.rule.noCritical &&
                  ' und ohne kritischen Fehler: Pflichtteile wie Rufzeichen oder „hold short“ müssen sitzen, und besonders wichtige Schritte dürfen nicht danebengehen'}
                .
              </li>
              {scenario.kneeboard && <li>Das Kneeboard darfst du jederzeit benutzen.</li>}
            </ul>
          </div>
        )}
        {scenario.kneeboard && (
          <>
            <p className="text-[0.95rem]">
              Das ist dein Kneeboard für diese Mission. Die Frequenzen stellst du gleich selbst ein – du kannst das Kneeboard
              jederzeit wieder aufklappen.
            </p>
            <div className="max-w-md">
              <Kneeboard kb={scenario.kneeboard} />
            </div>
            {!checkride && <WhereHint where={scenario.kneeboard.where} title="Wo stehen die Frequenzen in deiner Sim?" />}
          </>
        )}
        <PrefetchAudio transmissions={scenario.steps[0]?.hear ?? []} cast={castId} />
        <button onClick={() => setBriefed(true)} className="rounded-lg bg-phosphor px-5 py-2 font-semibold text-ink">
          {checkride ? 'Checkride starten →' : 'Los geht’s →'}
        </button>
      </div>
    )
  }

  if (finished && checkride && verdict) {
    return <CheckrideDebrief scenario={scenario} seed={seed} mode={checkride} verdict={verdict} calls={calls} tuneResults={tuneResults} decodes={decodes} onRestart={onRestart} />
  }

  if (finished) {
    return (
      <ScenarioDebrief
        scenario={scenario}
        seed={seed}
        score={score}
        results={results}
        calls={calls}
        tuneResults={tuneResults}
        decodes={decodes}
        inLesson={!!onComplete}
        onRestart={onRestart}
      />
    )
  }

  const buildDrill: BuildDrill | null =
    st.you?.mode === 'build'
      ? {
          kind: 'build',
          id: `${scenario.id}-${step}`,
          prompt: 'Bau deinen Funkspruch.',
          exchange: { id: scenario.id, title: display, layer: 'core', transmissions: [st.you.transmission] },
          transmission: 0,
          tiles: st.you.tiles,
          solution: st.you.transmission.segments.map((s) => s.text),
          explain: st.explain,
        }
      : null
  const choiceDrill: ChoiceDrill | null =
    st.you?.mode === 'choice'
      ? { kind: 'choice', id: `${scenario.id}-${step}`, prompt: 'Was funkst du?', options: st.you.options, correct: [st.you.correct], multi: false, mono: true, explain: st.explain }
      : null

  return (
    <div className="space-y-4">
      {/* Stufenleiste und Kneeboard-Knopf */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ol className="flex flex-wrap gap-1.5" aria-label="Ablauf">
          {stages.map((name, i) => (
            <li
              key={name + i}
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase ${i < currentStage ? 'border-phosphor-dim text-phosphor/70' : i === currentStage ? 'border-phosphor bg-phosphor/10 text-phosphor' : 'border-line text-muted'}`}
            >
              {i + 1}. {name}
            </li>
          ))}
        </ol>
        {scenario.kneeboard && (
          <button
            onClick={() => setShowKneeboard(!showKneeboard)}
            aria-pressed={showKneeboard}
            className={`rounded-md border px-2.5 py-1 text-sm ${showKneeboard ? 'border-amber-hud text-amber-hud' : 'border-line text-muted hover:text-text'}`}
          >
            📋 Kneeboard
          </button>
        )}
      </div>
      {showKneeboard && scenario.kneeboard && (
        <div className="max-w-md">
          <Kneeboard kb={scenario.kneeboard} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-3">
          {st.situation && (
            <div className="rounded-lg border border-line bg-panel-2 px-4 py-3">
              <InlineMarkdown text={st.situation} />
            </div>
          )}

          {/* Funk-Log */}
          <div className="scanlines overflow-hidden rounded-xl border border-line bg-panel">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-panel-2 px-4 py-2">
              <span className="text-sm font-semibold">Funk-Log</span>
              <span className={`font-mono text-xs ${radio || st.freq ? 'text-phosphor' : 'text-muted'}`}>◉ {display}</span>
            </div>
            <ExchangeAudio transmissions={logTransmissions} cast={castId} listen autoplay upcoming={upcoming}>
            <div ref={logRef} className="max-h-[360px] space-y-2.5 overflow-y-auto px-4 py-3">
              {log.length === 0 && <p className="text-sm text-muted">Noch ist es still auf der Frequenz.</p>}
              {log.map((e) =>
                blind || e.neutral ? (
                  <TransmissionLine key={e.key} t={e.t} neutral label={e.label} model={e.model} />
                ) : (
                  <TransmissionLine
                    key={e.key}
                    t={e.t}
                    label={e.label}
                    model={e.model}
                    selectedIndex={sel?.[0] === e.key ? sel[1] : null}
                    onSelect={(i) => setSel([e.key, i])}
                  />
                ),
              )}
            </div>
            </ExchangeAudio>
            {selected && (
              <div className="border-t border-line bg-black/20 px-4 py-2.5">
                <SegmentDetail seg={selected} />
              </div>
            )}
          </div>

          {/* Eigener Zug */}
          <div className="space-y-4 rounded-xl border border-line bg-panel p-4" key={`${seed}-${step}`}>
            {st.tune && (
              <TunePanel
                step={st}
                scenario={scenario}
                blind={blind}
                onDone={(r) => {
                  useApp.getState().track({ kind: 'tune', correct: r.correct })
                  setTunes((t) => ({ ...t, [step]: r.correct ? 1 : 0 }))
                  setTuneResults((t) => ({ ...t, [step]: r }))
                  setRadio({ name: st.tune!.name, freq: st.tune!.freq })
                }}
              />
            )}
            {tuned && blind && (
              <>
                {st.you && (
                  <div>
                    <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Du bist dran</div>
                    <CallInput blind expected={st.you.transmission} expectSilence={false} hintContext={hintContext} onDone={recordCall} />
                  </div>
                )}
                {st.silence && (
                  <div>
                    <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Und jetzt?</div>
                    <CallInput blind expectSilence hintContext={hintContext} onDone={recordCall} />
                  </div>
                )}
                {st.decode && (
                  <NineLineForm fields={st.decode.fields} ready blind onChecked={(r) => {
                    setDecodes((m) => ({ ...m, [step]: r }))
                    record(r.score)
                  }} />
                )}
                {!interactive && !st.tune && <p className="text-sm text-muted">Hör zu.</p>}
              </>
            )}
            {tuned && !blind && (
              <>
                {st.you?.mode === 'type' && (
                  <div>
                    <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Du bist dran</div>
                    <CallInput expected={st.you.transmission} expectSilence={false} hint={st.you.hint} explain={st.explain} hintContext={hintContext} onDone={recordCall} />
                  </div>
                )}
                {st.silence && (
                  <div>
                    <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Und jetzt?</div>
                    <CallInput expectSilence explain={st.explain} hintContext={hintContext} onDone={recordCall} />
                  </div>
                )}
                {st.decode && (
                  <div>
                    <NineLineForm fields={st.decode.fields} ready onChecked={(r) => {
                      setDecodes((m) => ({ ...m, [step]: r }))
                      record(r.score)
                    }} />
                    {decodes[step] && st.explain && (
                      <div className="mt-2 text-[0.95rem]">
                        <InlineMarkdown text={st.explain} />
                      </div>
                    )}
                  </div>
                )}
                {buildDrill && <DrillView drill={buildDrill} onAnswered={(c) => record(c ? 1 : 0)} />}
                {choiceDrill && <DrillView drill={choiceDrill} onAnswered={(c) => record(c ? 1 : 0)} />}
                {!interactive && (
                  <div>
                    {!st.tune && <p className="text-sm text-muted">Hör zu – hier musst du nichts funken.</p>}
                    {st.explain && (
                      <div className="mt-2 text-[0.95rem]">
                        <InlineMarkdown text={st.explain} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end">
              <button
                disabled={!answered}
                onClick={() => {
                  setSel(null)
                  if (step === scenario.steps.length - 1) {
                    if (checkride) {
                      const outcomes: Record<number, StepOutcome> = {}
                      scenario.steps.forEach((_, i) => (outcomes[i] = { tune: tuneResults[i]?.correct, call: calls[i] }))
                      const v = evaluateCheckride(scenario, score, outcomes, checkride.rule)
                      setVerdict(v)
                      onCheckride?.(v)
                    }
                    setFinished(true)
                    useApp.getState().track({ kind: 'scenario', score })
                    // In Lektionen: Ergebnis sofort melden – weiter geht es mit dem Knopf der Lektion
                    onComplete?.(score)
                  } else setStep(step + 1)
                }}
                className="rounded-lg bg-phosphor px-5 py-2 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {step === scenario.steps.length - 1 ? 'Abschließen' : 'Weiter →'}
              </button>
            </div>
          </div>
        </div>

        {scenario.sketch && (
          <aside className="space-y-2">
            <AirfieldSketch sketch={scenario.sketch} pos={st.pos ?? [...scenario.steps.slice(0, step)].reverse().find((s) => s.pos)?.pos} />
            <div className="rounded-lg border border-line bg-panel px-3 py-2 font-mono text-xs text-muted">
              <div>
                Rufzeichen: <span className="text-amber-hud">{scenario.self.name} {scenario.self.flight}-{scenario.self.position}</span>
              </div>
              {scenario.sketch.runway && (
                <div>
                  Runway: <span className="text-phosphor">{scenario.sketch.runway}</span>
                </div>
              )}
              {scenario.sketch.wind && <div>Wind: {scenario.sketch.wind.text}</div>}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Debriefing (Übungsszenario)
// ---------------------------------------------------------------------------

const mark = (v: number) => (v >= 0.999 ? ['✓', 'text-emerald-300'] : v > 0 ? ['◐', 'text-amber-hud'] : ['✗', 'text-red-300'])

/** Der Funkspruch als Text, ohne optionale Teile (wie in den Fehlerlisten). */
const spokenText = (t: ResolvedScenarioStep['you']) =>
  (t?.transmission.segments ?? [])
    .filter((s) => !s.optional)
    .map((s) => s.text)
    .join(', ')

/**
 * Debriefing nach einem Übungsszenario (U1-13): je Schritt, was gefragt war – Funkgerät und Funkspruch –, und bei
 * Fehlern zum Aufklappen, was du gesagt hast und warum es anders gehört.
 */
function ScenarioDebrief({
  scenario,
  seed,
  score,
  results,
  calls,
  tuneResults,
  decodes,
  inLesson,
  onRestart,
}: {
  scenario: ResolvedScenario
  seed: string
  score: number
  results: Record<number, number>
  calls: Record<number, CallResult>
  tuneResults: Record<number, TuneResult>
  decodes: Record<number, NineLineResult>
  inLesson: boolean
  onRestart?: () => void
}) {
  const steps = scenario.steps.map((st, i) => ({ st, i })).filter(({ st }) => st.tune || st.you || st.silence || st.decode)
  const perfect = steps.filter(
    ({ st, i }) => (!st.tune || tuneResults[i]?.correct) && (!(st.you || st.silence || st.decode) || (results[i] ?? 0) >= 0.999),
  ).length
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Debriefing · Szenario #{seed}</div>
        <h2 className="mt-1 text-xl font-semibold text-white">{scenario.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <ScoreRing score={score} />
          <div className="space-y-1">
            <div className="text-lg">
              {perfect} von {steps.length} Schritten ohne Fehler
            </div>
            {perfect < steps.length && <p className="text-sm text-muted">Unten steht Schritt für Schritt, was gefragt war – Fehler zum Aufklappen.</p>}
          </div>
        </div>
        {inLesson && <p className="mt-4 text-sm text-muted">Das Ergebnis zählt für die Lektion – weiter geht es unten.</p>}
        {onRestart && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onRestart} className="rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim">
              ⟳ Nochmal (neu gewürfelt)
            </button>
          </div>
        )}
      </div>

      <ol className="space-y-2">
        {steps.map(({ st, i }) => {
          const tr = tuneResults[i]
          const call = calls[i]
          const value = results[i] ?? 0
          const [icon, cls] = mark(value)
          const talk = !!(st.you || st.silence)
          return (
            <li key={i} className="rounded-xl border border-line bg-panel px-4 py-3 text-sm">
              <div className="mb-1 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
                {i + 1}. {st.stage}
              </div>
              {st.tune && (
                <p className={tr?.correct ? 'text-emerald-300' : 'text-red-300'}>
                  {tr?.correct ? '✓' : '✗'} Funkgerät {st.tune.name}: {tr ? `eingestellt ${tr.tuned}` : 'nicht eingestellt'}
                  {!tr?.correct && (
                    <span className="text-text">
                      {' '}
                      – richtig: <span className="font-mono">{st.tune.channel ? `Kanal ${st.tune.channel} · ` : ''}{st.tune.freq}</span>
                    </span>
                  )}
                </p>
              )}
              {talk && (
                <p>
                  <span className={cls}>{icon}</span>{' '}
                  {st.silence ? (
                    <span className="text-muted">Richtig war: nichts sagen.</span>
                  ) : (
                    <>
                      <span className="text-muted">{value >= 0.999 ? 'Gefunkt: ' : 'Richtig wäre: '}</span>
                      <span lang="en" className="font-mono">
                        „{value >= 0.999 && call && !call.silent ? call.text : spokenText(st.you)}“
                      </span>
                    </>
                  )}
                </p>
              )}
              {st.decode && (
                <p>
                  <span className={cls}>{icon}</span>{' '}
                  <span className="text-muted">
                    Mitgeschrieben:{' '}
                    {decodes[i] ? `${decodes[i].checks.filter((c) => c.ok).length} von ${st.decode.fields.length} Zeilen richtig` : 'nicht mitgeschrieben'}
                  </span>
                </p>
              )}
              {st.decode && decodes[i] && value < 0.999 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-muted select-none hover:text-text">Was war los?</summary>
                  <div className="mt-1.5">
                    <NineLineResultList fields={st.decode.fields} result={decodes[i]} />
                  </div>
                </details>
              )}
              {talk && value < 0.999 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-muted select-none hover:text-text">Was war los?</summary>
                  <div className="mt-1.5">
                    {call ? (
                      <CallFeedback result={call} expected={st.you?.transmission} expectSilence={st.silence} explain={st.explain} />
                    ) : st.explain ? (
                      <div className="text-[0.95rem]">
                        <InlineMarkdown text={st.explain} />
                      </div>
                    ) : (
                      <p className="text-muted">Bausteine oder Auswahl passten nicht zur Musterlösung oben.</p>
                    )}
                  </div>
                </details>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checkride-Debriefing
// ---------------------------------------------------------------------------

function CheckrideDebrief({
  scenario,
  seed,
  mode,
  verdict,
  calls,
  tuneResults,
  decodes,
  onRestart,
}: {
  scenario: ResolvedScenario
  seed: string
  mode: CheckrideMode
  verdict: CheckrideResult
  calls: Record<number, CallResult>
  tuneResults: Record<number, TuneResult>
  decodes: Record<number, NineLineResult>
  onRestart?: () => void
}) {
  const pct = (x: number) => `${Math.round(x * 100)} %`
  const tooLow = verdict.score < verdict.passScore - 1e-9
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Debriefing · Checkride {mode.label} · Mission #{seed}
        </div>
        <h2 className="mt-1 text-xl font-semibold text-white">{scenario.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <ScoreRing score={verdict.score} />
          <div>
            <div className={`text-2xl font-semibold ${verdict.passed ? 'text-emerald-300' : 'text-red-300'}`}>
              {verdict.passed ? '✓ Bestanden' : '✗ Nicht bestanden'}
            </div>
            <p className="mt-1 text-sm text-muted">
              Ergebnis {pct(verdict.score)} – nötig {pct(verdict.passScore)}
              {mode.rule.noCritical && ' und kein kritischer Fehler'}.
            </p>
            {!verdict.passed && tooLow && <p className="text-sm text-red-300">Das Ergebnis liegt unter der Grenze.</p>}
          </div>
        </div>
        {verdict.critical.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3">
            <div className="font-semibold text-red-300">
              Kritische Fehler{!mode.rule.noCritical && <span className="font-normal text-muted"> – zählen in diesem Checkride nicht</span>}
            </div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {verdict.critical.map((c, k) => (
                <li key={k}>
                  <span className="text-muted">{c.stage}:</span> {c.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        {onRestart && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onRestart} className="rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim">
              ⟳ Neuer Versuch (neu gewürfelt)
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Schritt für Schritt</h3>
        {scenario.steps.map((st, i) => {
          const tr = tuneResults[i]
          const call = calls[i]
          if (!st.tune && !st.you && !st.silence && !st.decode) return null
          return (
            <section key={i} className="rounded-xl border border-line bg-panel p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
                  {i + 1}. {st.stage}
                </span>
                {st.critical && <span className="rounded border border-amber-hud/50 px-1.5 text-[11px] text-amber-hud">kritischer Schritt</span>}
              </div>
              {st.tune && (
                <p className={`text-sm ${tr?.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                  {tr?.correct ? '✓' : '✗'} Funkgerät {st.tune.name}: {tr ? `eingestellt ${tr.tuned}` : 'nicht eingestellt'}
                  {!tr?.correct && (
                    <span className="text-text">
                      {' '}
                      – richtig: <span className="font-mono">{st.tune.channel ? `Kanal ${st.tune.channel} · ` : ''}{st.tune.freq}</span>
                    </span>
                  )}
                </p>
              )}
              {st.tune && !tr?.correct && <WhereHint where={st.tune.where} />}
              {st.decode &&
                (decodes[i] ? <NineLineResultList fields={st.decode.fields} result={decodes[i]} /> : <p className="text-sm text-red-300">✗ Nicht mitgeschrieben</p>)}
              {(st.you || st.silence) &&
                (call ? (
                  <CallFeedback result={call} expected={st.you?.transmission} expectSilence={st.silence} explain={st.explain} />
                ) : (
                  <p className="text-sm text-red-300">✗ Keine Antwort</p>
                ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
