/**
 * Übungskomponenten: Multiple Choice, Zuordnen, Baukasten, Anatomie, Freitext.
 */
import { useState, type ReactNode } from 'react'
import type {
  AnatomyDrill,
  BuildDrill,
  CallDrill,
  ChartTapDrill,
  ChoiceDrill,
  ClozeDrill,
  FormDrill,
  InputDrill,
  MatchDrill,
  PlotDrill,
  ResolvedDrill,
  SequenceDrill,
  SequenceItem,
} from '../core/drills/types'
import { evaluateBuild, explainForBuild, tileMatches, type BuildTileStatus } from '../core/drills/resolve'
import { restatesSolution } from '../core/drills/solution'
import { matchAny, normalizeTokens, sameToken, segmentAnswers, type SpellingFix } from '../core/phraseology/normalize'
import { InlineMarkdown } from './Markdown'
import { RadioPanel, RoleLegend, SegmentDetail, TransmissionLine } from './CallAnatomy'
import { roleInfo } from '../ui/roles'
import { toItems } from '../core/scoring/score'
import { angleDiff, bearingDeg, distNm, type Point } from '../core/random/geo'
import { CallInput } from './CallInput'
import { hintContextForExchange } from '../ui/speech'
import { useApp } from '../state/store'
import { Scope, ScopeLegend, type ScopeMarker } from './Scope'
import { Chart, type ChartMark } from './Chart'
import { NineLineDrillView } from './NineLine'

type Answer = (correct: boolean) => void

export function DrillView({ drill, onAnswered }: { drill: ResolvedDrill; onAnswered: Answer }) {
  switch (drill.kind) {
    case 'choice':
      return <Choice drill={drill} onAnswered={onAnswered} />
    case 'match':
      return <Match drill={drill} onAnswered={onAnswered} />
    case 'build':
      return <Build drill={drill} onAnswered={onAnswered} />
    case 'anatomy':
      return <Anatomy drill={drill} onAnswered={onAnswered} />
    case 'input':
      return <Input drill={drill} onAnswered={onAnswered} />
    case 'cloze':
      return <Cloze drill={drill} onAnswered={onAnswered} />
    case 'sequence':
      return <Sequence drill={drill} onAnswered={onAnswered} />
    case 'form':
      return <Form drill={drill} onAnswered={onAnswered} />
    case 'call':
      return <CallDrillView drill={drill} onAnswered={onAnswered} />
    case 'plot':
      return <PlotDrillView drill={drill} onAnswered={onAnswered} />
    case 'chart-tap':
      return <ChartTapView drill={drill} onAnswered={onAnswered} />
    case 'nineline':
      return <NineLineDrillView drill={drill} onAnswered={onAnswered} />
  }
}

function Prompt({ text, kind }: { text: string; kind: string }) {
  return (
    <div className="mb-4">
      <div className="mb-1 font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">{kind}</div>
      <div className="text-lg">
        <InlineMarkdown text={text} />
      </div>
    </div>
  )
}

export function Feedback({ correct, explain, children }: { correct: boolean; explain?: string; children?: ReactNode }) {
  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 ${correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}
      role="status"
    >
      <div className={`font-semibold ${correct ? 'text-emerald-300' : 'text-red-300'}`}>
        {correct ? '✓ Richtig' : '✗ Nicht ganz'}
      </div>
      {children}
      {explain && (
        <div className="mt-1 text-[0.95rem]">
          <InlineMarkdown text={explain} />
        </div>
      )}
    </div>
  )
}

/** Hinweis auf verziehene Tippfehler bei Buchstabierwörtern: Die Antwort zählt als richtig, die Schreibung wird gezeigt. */
function SpellingNote({ fixes }: { fixes: SpellingFix[] }) {
  if (fixes.length === 0) return null
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
  return (
    <p className="mt-1 text-sm text-muted">
      Schreibung:{' '}
      {fixes.map((f, i) => (
        <span key={i}>
          {i > 0 && ', '}
          <span className="font-mono text-text">{cap(f.want)}</span> statt „{f.got}“
        </span>
      ))}
    </p>
  )
}

function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------

function Choice({ drill, onAnswered }: { drill: ChoiceDrill; onAnswered: Answer }) {
  const [picked, setPicked] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const isCorrect = (sel: number[]) => sel.length === drill.correct.length && drill.correct.every((c) => sel.includes(c))
  const submit = (sel: number[]) => {
    setPicked(sel)
    setDone(true)
    onAnswered(isCorrect(sel))
  }
  return (
    <div>
      <Prompt text={drill.prompt} kind={drill.multi ? 'Mehrfachauswahl' : 'Auswahl'} />
      {drill.multi && !done && <p className="-mt-2 mb-3 text-sm text-muted">Alles Zutreffende ankreuzen, dann prüfen.</p>}
      <div className="grid gap-2">
        {drill.options.map((o, i) => {
          const isRight = drill.correct.includes(i)
          const isPicked = picked.includes(i)
          // Rahmen und Hintergrund nur je Zustand setzen: Zwei Rahmenfarben in einer Klassenliste entscheidet Tailwind
          // nach seiner eigenen Reihenfolge, nicht nach der hier – das Grün der richtigen Antwort ging so verloren.
          const state = !done
            ? isPicked
              ? 'border-phosphor bg-phosphor/10'
              : 'border-line bg-panel-2 hover:border-phosphor-dim'
            : isRight
              ? 'border-emerald-400 bg-emerald-500/10'
              : isPicked
                ? 'border-red-400 bg-red-500/10'
                : 'border-line bg-panel-2 opacity-50'
          return (
            <button
              key={i}
              disabled={done}
              aria-pressed={drill.multi ? isPicked : undefined}
              onClick={() => (drill.multi ? setPicked(isPicked ? picked.filter((p) => p !== i) : [...picked, i]) : submit([i]))}
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-left transition ${drill.mono ? 'font-mono' : ''} ${state}`}
            >
              {drill.multi && <span className="mt-0.5 font-mono text-phosphor">{isPicked ? '[x]' : '[ ]'}</span>}
              <span className="flex-1">{o}</span>
              {/* Nicht nur Farbe: Die richtige Antwort und die falsch gewählte stehen auch als Text da */}
              {done && isRight && <span className="shrink-0 font-sans text-sm font-semibold text-emerald-300">✓ richtig</span>}
              {done && isPicked && !isRight && <span className="shrink-0 font-sans text-sm font-semibold text-red-300">✗ falsch</span>}
            </button>
          )
        })}
      </div>
      {drill.multi && !done && (
        <div className="mt-4">
          <Btn disabled={picked.length === 0} onClick={() => submit(picked)}>
            Prüfen
          </Btn>
        </div>
      )}
      {done && <Feedback correct={isCorrect(picked)} explain={drill.explain} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

const PAIR_COLORS = ['bg-sky-400', 'bg-amber-400', 'bg-violet-400', 'bg-teal-400', 'bg-pink-400', 'bg-lime-400', 'bg-orange-400', 'bg-red-400']

function Match({ drill, onAnswered }: { drill: MatchDrill; onAnswered: Answer }) {
  const [assign, setAssign] = useState<Record<number, number>>({})
  const [activeLeft, setActiveLeft] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const leftOfRight = (r: number) => Number(Object.keys(assign).find((l) => assign[Number(l)] === r) ?? -1)
  const allSet = Object.keys(assign).length === drill.left.length
  const correct = drill.left.every((_, i) => assign[i] === drill.solution[i])

  const pickRight = (r: number) => {
    if (checked || activeLeft === null) return
    const next = { ...assign }
    const prev = leftOfRight(r)
    if (prev >= 0) delete next[prev]
    next[activeLeft] = r
    setAssign(next)
    const open = drill.left.findIndex((_, i) => next[i] === undefined)
    setActiveLeft(open >= 0 ? open : null)
  }

  return (
    <div>
      <Prompt text={drill.prompt} kind="Zuordnen" />
      <p className="mb-3 text-sm text-muted">Erst links wählen, dann rechts das Passende antippen.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid content-start gap-2">
          {drill.left.map((l, i) => {
            const pairColor = assign[i] !== undefined ? PAIR_COLORS[i % PAIR_COLORS.length] : ''
            const verdict = checked ? (assign[i] === drill.solution[i] ? 'border-emerald-400' : 'border-red-400') : activeLeft === i ? 'border-phosphor' : 'border-line'
            return (
              <button
                key={i}
                disabled={checked}
                onClick={() => setActiveLeft(i)}
                className={`flex items-center gap-2 rounded-lg border bg-panel-2 px-3 py-2 text-left font-mono ${verdict}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${pairColor || 'bg-white/10'}`} />
                {l}
              </button>
            )
          })}
        </div>
        <div className="grid content-start gap-2">
          {drill.right.map((r, ri) => {
            const l = leftOfRight(ri)
            return (
              <button
                key={ri}
                disabled={checked}
                onClick={() => pickRight(ri)}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 py-2 text-left text-[0.95rem] hover:border-phosphor-dim"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l >= 0 ? PAIR_COLORS[l % PAIR_COLORS.length] : 'bg-white/10'}`} />
                {r}
              </button>
            )
          })}
        </div>
      </div>
      {!checked && (
        <div className="mt-4">
          <Btn
            disabled={!allSet}
            onClick={() => {
              setChecked(true)
              onAnswered(correct)
            }}
          >
            Prüfen
          </Btn>
        </div>
      )}
      {checked && (
        <Feedback correct={correct} explain={drill.explain}>
          {!correct && (
            <ul className="mt-2 space-y-0.5 text-sm">
              {drill.left.map((l, i) => (
                <li key={i}>
                  <span className="font-mono">{l}</span> → {drill.right[drill.solution[i]]}
                </li>
              ))}
            </ul>
          )}
        </Feedback>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

/** Markierung der gewählten Bausteine nach dem Funken – Farbe plus Zeichen, damit Farbe nicht das einzige Mittel ist. */
const TILE_VERDICT: Record<BuildTileStatus, { cls: string; mark: string; title: string }> = {
  ok: { cls: 'bg-emerald-500/15 text-emerald-100', mark: '', title: '' },
  moved: { cls: 'bg-amber-hud/20 text-amber-100 underline decoration-dotted', mark: '⇄ ', title: 'steht woanders als in der Musterlösung' },
  extra: { cls: 'bg-red-500/15 text-red-200 line-through', mark: '✗ ', title: 'gehört nicht in diesen Funkspruch' },
  duplicate: { cls: 'bg-red-500/15 text-red-200 line-through', mark: '✗ ', title: 'doppelt' },
}

function Build({ drill, onAnswered }: { drill: BuildDrill; onAnswered: Answer }) {
  const [picked, setPicked] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [sel, setSel] = useState<[number, number] | null>(null)
  const pool = drill.tiles.filter((t) => !picked.includes(t.key))
  const answer = picked.map((k) => drill.tiles.find((t) => t.key === k)!.text)
  const segments = drill.exchange.transmissions[drill.transmission].segments
  // Wie beim getippten Funkspruch: freie Teile überall, Varianten gelten, Rückmeldung je Fehler
  const result = evaluateBuild(answer, segments, (r) => roleInfo(r).label)
  const correct = result.correct
  const before = drill.exchange.transmissions.slice(0, drill.transmission)
  // Die Erklärung nach einem Fehler ohne Sätze zu Störbausteinen, die man gar nicht gewählt hat
  const unchosen = pool.filter((t) => !segments.some((s) => tileMatches(t.text, s))).map((t) => t.text)
  const explain = correct ? drill.explain : explainForBuild(drill.explain, unchosen, segments)
  const shown = new Set(result.tiles.map((t) => t.status))

  return (
    <div>
      <Prompt text={drill.prompt} kind="Funkspruch-Baukasten" />
      {drill.exchange.context && <p className="mb-3 text-sm text-muted italic">{drill.exchange.context}</p>}
      {before.length > 0 && !checked && (
        <div className="mb-3 space-y-2 rounded-lg border border-line bg-panel px-3 py-2">
          {before.map((t, i) => (
            <TransmissionLine key={i} t={t} />
          ))}
        </div>
      )}
      <div className="min-h-14 rounded-lg border border-dashed border-phosphor-dim/60 bg-black/20 p-2">
        <div className="mb-1 font-mono text-[11px] tracking-wider text-amber-hud uppercase">Du ▸ {drill.exchange.freq ?? ''}</div>
        <div className="flex flex-wrap gap-1.5">
          {picked.length === 0 && <span className="px-1 py-1 text-sm text-muted">Tippe unten die Bausteine in der richtigen Reihenfolge an …</span>}
          {picked.map((k, pos) => {
            const v = checked ? TILE_VERDICT[result.tiles[pos].status] : null
            return (
              <button
                key={k}
                disabled={checked}
                title={v?.title || undefined}
                onClick={() => setPicked(picked.filter((p) => p !== k))}
                className={`rounded-md px-2 py-1 font-mono ${v ? v.cls : 'bg-amber-hud/15 text-amber-100 hover:bg-amber-hud/25'}`}
              >
                {v?.mark}
                {drill.tiles.find((t) => t.key === k)!.text}
                {v?.title && <span className="sr-only"> ({v.title})</span>}
              </button>
            )
          })}
          {checked &&
            result.missing.map((i) => (
              <span key={`m${i}`} title="fehlt" className="rounded-md border border-dashed border-red-400/70 px-2 py-1 font-mono text-red-200">
                <span className="font-sans text-xs text-red-300">fehlt: </span>
                {segments[i].text}
              </span>
            ))}
        </div>
        {checked && (shown.has('extra') || shown.has('duplicate') || shown.has('moved') || result.missing.length > 0) && (
          <p className="mt-1.5 text-xs text-muted">
            {[
              (shown.has('extra') || shown.has('duplicate')) && '✗ gehört nicht hinein',
              shown.has('moved') && '⇄ steht woanders',
              result.missing.length > 0 && 'gestrichelt: fehlt',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      {!checked && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pool.map((t) => (
            <button
              key={t.key}
              onClick={() => setPicked([...picked, t.key])}
              className="rounded-md border border-line bg-panel-2 px-2 py-1 font-mono hover:border-phosphor-dim"
            >
              {t.text}
            </button>
          ))}
        </div>
      )}
      {!checked && (
        <div className="mt-4 flex gap-2">
          <Btn
            disabled={picked.length === 0}
            onClick={() => {
              setChecked(true)
              onAnswered(correct)
            }}
          >
            Funken
          </Btn>
          {picked.length > 0 && (
            <button onClick={() => setPicked([])} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-text">
              Zurücksetzen
            </button>
          )}
        </div>
      )}
      {checked && (
        <Feedback correct={correct} explain={explain}>
          {result.issues.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {result.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-sm text-muted">
            {!correct ? 'Richtig wäre:' : result.reordered ? 'Auch richtig – üblicher ist diese Reihenfolge:' : 'So sieht dein Funkspruch aufgeschlüsselt aus:'}
          </p>
          <div className="mt-2 space-y-3">
            <RadioPanel exchange={drill.exchange}>
              {drill.exchange.transmissions.map((t, ti) => (
                <TransmissionLine key={ti} t={t} selectedIndex={sel?.[0] === ti ? sel[1] : null} onSelect={(si) => setSel([ti, si])} />
              ))}
              <div className="rounded-lg bg-black/20 px-3 py-2.5">
                <SegmentDetail seg={sel ? drill.exchange.transmissions[sel[0]].segments[sel[1]] : null} />
              </div>
              <RoleLegend exchange={drill.exchange} />
            </RadioPanel>
          </div>
        </Feedback>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

/** Bestimmter Artikel zum Rollen-Label aus `content/glossary/roles.yaml` (Adressat, Rufzeichen, Position …). */
const ROLE_ARTICLE: Record<string, string> = {
  addressee: 'der',
  callsign: 'das',
  position: 'die',
  intent: 'die',
  info: 'die',
  request: 'die',
  instruction: 'die',
  value: 'der',
  proword: 'das',
  brevity: 'der',
}

/** „das Rufzeichen“, „der Adressat“ – für Sätze wie „das ist das Rufzeichen, gesucht war der Adressat“. */
function withArticle(role: string): string {
  const { label } = roleInfo(role)
  return ROLE_ARTICLE[role] ? `${ROLE_ARTICLE[role]} ${label}` : label
}

function Anatomy({ drill, onAnswered }: { drill: AnatomyDrill; onAnswered: Answer }) {
  const [picked, setPicked] = useState<number | null>(null)
  const t = drill.exchange.transmissions[drill.transmission]
  const done = picked !== null
  const correct = done && t.segments[picked].role === drill.target
  const verdicts: Record<number, 'right' | 'wrong'> = {}
  if (done) {
    t.segments.forEach((s, i) => {
      if (s.role === drill.target) verdicts[i] = 'right'
    })
    if (!correct) verdicts[picked] = 'wrong'
  }
  return (
    <div>
      <Prompt text={drill.prompt} kind="Funkspruch-Anatomie" />
      <RadioPanel exchange={drill.exchange}>
        <TransmissionLine
          t={t}
          neutral={!done}
          verdicts={verdicts}
          onSelect={
            done
              ? undefined
              : (i) => {
                  setPicked(i)
                  onAnswered(t.segments[i].role === drill.target)
                }
          }
        />
      </RadioPanel>
      {done && (
        <Feedback correct={correct} explain={drill.explain}>
          <div className="mt-2 rounded-lg bg-black/20 px-3 py-2.5">
            <SegmentDetail seg={t.segments.find((s) => s.role === drill.target) ?? null} />
          </div>
          {!correct && (
            <p className="mt-2 text-sm text-muted">
              Du hast „{t.segments[picked].text}“ gewählt – das ist {withArticle(t.segments[picked].role)}, gesucht war{' '}
              {withArticle(drill.target)}.
            </p>
          )}
        </Feedback>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function Input({ drill, onAnswered }: { drill: InputDrill; onAnswered: Answer }) {
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const match = matchAny(text, drill.accept)
  const correct = match !== null
  const submit = () => {
    if (!text.trim() || checked) return
    setChecked(true)
    // Getippte Funk-Wendung: zählt für Abzeichen wie „Mikrofon offen“ (genau getroffen = sauber)
    useApp.getState().track({ kind: 'call', correct, clean: correct })
    onAnswered(correct)
  }
  return (
    <div>
      <Prompt text={drill.prompt} kind="Freitext" />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          autoFocus
          value={text}
          disabled={checked}
          onChange={(e) => setText(e.target.value)}
          placeholder={drill.placeholder ?? 'Funkspruch eintippen …'}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 rounded-lg border border-line bg-black/30 px-3 py-2 font-mono text-text outline-none focus:border-phosphor"
        />
        {!checked && (
          <Btn onClick={submit} disabled={!text.trim()}>
            Funken
          </Btn>
        )}
      </form>
      {drill.hint && !checked && (
        <button onClick={() => setShowHint(true)} className="mt-2 text-sm text-muted hover:text-text">
          {showHint ? `Hinweis: ${drill.hint}` : 'Hinweis anzeigen'}
        </button>
      )}
      {checked && (
        // Sagt die Erklärung nur die Lösung („Richtig ist: …“), steht sie nach einer falschen Antwort schon unter „Erwartet“
        <Feedback correct={correct} explain={!correct && restatesSolution(drill.explain, drill.accept.slice(0, 1)) ? undefined : drill.explain}>
          {correct ? <SpellingNote fixes={match} /> : <InputDiff got={text} expected={drill.accept[0]} />}
        </Feedback>
      )}
    </div>
  )
}

/** Eigene Eingabe und erwartete Antwort – abweichende Wörter der Antwort sind markiert. */
function InputDiff({ got, expected }: { got: string; expected: string }) {
  const have = normalizeTokens(got)
  const words = expected.split(/\s+/)
  const missing = words.map((w) => {
    const t = normalizeTokens(w)
    if (t.length === 0) return false
    // Buchstabierwörter mit einem Tippfehler zählen als getroffen (wie bei der Wertung)
    const at = (x: string) => have.findIndex((h) => sameToken(h, x))
    const hit = t.every((x) => at(x) >= 0)
    if (hit) for (const x of t) have.splice(at(x), 1)
    return !hit
  })
  return (
    <div className="mt-1 space-y-0.5 text-sm">
      <p>
        <span className="text-muted">Du: </span>
        <span className="font-mono">„{got}“</span>
      </p>
      <p>
        <span className="text-muted">Erwartet: </span>
        <span className="font-mono">
          {words.map((w, i) => (
            <span key={i}>
              {i > 0 && ' '}
              {missing[i] ? <mark className="rounded bg-amber-hud/25 px-0.5 text-amber-hud">{w}</mark> : w}
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Cloze({ drill, onAnswered }: { drill: ClozeDrill; onAnswered: Answer }) {
  const t = drill.exchange.transmissions[drill.transmission]
  const [values, setValues] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  // Neben dem Segmenttext gelten auch seine gleichwertigen Formulierungen (`alt`), wie bei der Funkspruch-Bewertung
  const matchOf = (i: number) => matchAny(values[i] ?? '', segmentAnswers(t.segments[i]))
  const ok = (i: number) => matchOf(i) !== null
  const allFilled = drill.blanks.every((b) => (values[b] ?? '').trim())
  const correct = drill.blanks.every(ok)
  const before = drill.exchange.transmissions.slice(0, drill.transmission)
  const submit = () => {
    if (!allFilled || checked) return
    setChecked(true)
    onAnswered(correct)
  }
  return (
    <div>
      <Prompt text={drill.prompt} kind="Lückentext" />
      <RadioPanel exchange={drill.exchange}>
        {before.map((bt, i) => (
          <TransmissionLine key={i} t={bt} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3"
        >
          <div className="flex shrink-0 items-center gap-2 pt-1 sm:w-44">
            <span className={`h-2 w-2 rounded-full ${t.you ? 'bg-amber-hud' : 'bg-phosphor'}`} />
            <span className={`font-mono text-xs tracking-wide uppercase ${t.you ? 'text-amber-hud' : 'text-phosphor'}`}>{t.you ? 'Du' : t.speaker}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {t.segments.map((seg, i) => {
              if (!drill.blanks.includes(i)) {
                return (
                  <span key={i} className="rounded-md bg-white/5 px-2 py-1 font-mono text-[0.95rem]">
                    {seg.text}
                  </span>
                )
              }
              const verdict = checked ? (ok(i) ? 'border-emerald-400' : 'border-red-400') : 'border-phosphor-dim focus:border-phosphor'
              return (
                <input
                  key={i}
                  autoFocus={i === drill.blanks[0]}
                  disabled={checked}
                  value={values[i] ?? ''}
                  onChange={(e) => setValues({ ...values, [i]: e.target.value })}
                  placeholder={roleInfo(seg.role).label}
                  spellCheck={false}
                  autoComplete="off"
                  style={{ width: `${Math.max(8, seg.text.length + 2)}ch` }}
                  className={`rounded-md border bg-black/30 px-2 py-1 font-mono text-[0.95rem] outline-none ${verdict}`}
                />
              )
            })}
            <button type="submit" className="hidden" />
          </div>
        </form>
      </RadioPanel>
      {!checked && (
        <div className="mt-4">
          <Btn disabled={!allFilled} onClick={submit}>
            Funken
          </Btn>
        </div>
      )}
      {checked && (
        <Feedback correct={correct} explain={drill.explain}>
          {correct && <SpellingNote fixes={drill.blanks.flatMap((b) => matchOf(b) ?? [])} />}
          {!correct && (
            <p className="mt-1 text-sm">
              Richtig: <span className="font-mono">{t.segments.map((s) => s.text).join(', ')}</span>
            </p>
          )}
        </Feedback>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function SequenceItemView({ item, n }: { item: SequenceItem; n?: number }) {
  return (
    <span className="flex items-start gap-2 text-left">
      {n !== undefined && <span className="font-mono text-phosphor">{n}.</span>}
      <span>
        {item.speaker && <span className="mr-2 font-mono text-xs tracking-wide text-muted uppercase">{item.speaker}</span>}
        <span className={item.speaker ? 'font-mono' : ''}>{item.label}</span>
      </span>
    </span>
  )
}

function Sequence({ drill, onAnswered }: { drill: SequenceDrill; onAnswered: Answer }) {
  const [order, setOrder] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const byKey = (k: string) => drill.items.find((i) => i.key === k)!
  const pool = drill.items.filter((i) => !order.includes(i.key))
  const correct = order.length === drill.solution.length && order.every((k, i) => k === drill.solution[i])
  return (
    <div>
      <Prompt text={drill.prompt} kind="Reihenfolge" />
      <div className="min-h-14 space-y-1.5 rounded-lg border border-dashed border-phosphor-dim/60 bg-black/20 p-2">
        {order.length === 0 && <p className="px-1 py-1 text-sm text-muted">Tippe die Einträge unten in der richtigen Reihenfolge an …</p>}
        {order.map((k, i) => {
          const verdict = checked ? (drill.solution[i] === k ? 'border-emerald-400' : 'border-red-400') : 'border-line'
          return (
            <button
              key={k}
              disabled={checked}
              onClick={() => setOrder(order.filter((o) => o !== k))}
              className={`block w-full rounded-md border bg-panel-2 px-3 py-2 ${verdict}`}
            >
              <SequenceItemView item={byKey(k)} n={i + 1} />
            </button>
          )
        })}
      </div>
      {!checked && (
        <div className="mt-3 space-y-1.5">
          {pool.map((it) => (
            <button
              key={it.key}
              onClick={() => setOrder([...order, it.key])}
              className="block w-full rounded-md border border-line bg-panel-2 px-3 py-2 hover:border-phosphor-dim"
            >
              <SequenceItemView item={it} />
            </button>
          ))}
        </div>
      )}
      {!checked && (
        <div className="mt-4">
          <Btn
            disabled={pool.length > 0}
            onClick={() => {
              setChecked(true)
              onAnswered(correct)
            }}
          >
            Prüfen
          </Btn>
        </div>
      )}
      {checked && (
        <Feedback correct={correct} explain={drill.explain}>
          {!correct && (
            <ol className="mt-2 space-y-1 text-sm">
              {drill.solution.map((k, i) => (
                <li key={k}>
                  <SequenceItemView item={byKey(k)} n={i + 1} />
                </li>
              ))}
            </ol>
          )}
        </Feedback>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function Form({ drill, onAnswered }: { drill: FormDrill; onAnswered: Answer }) {
  const [values, setValues] = useState<string[]>(drill.fields.map(() => ''))
  const [checked, setChecked] = useState(false)
  const matchOf = (i: number) => matchAny(values[i], drill.fields[i].accept)
  const ok = (i: number) => matchOf(i) !== null
  const correct = drill.fields.every((_, i) => ok(i))
  const allFilled = values.every((v) => v.trim())
  const submit = () => {
    if (!allFilled || checked) return
    setChecked(true)
    onAnswered(correct)
  }
  const shown = drill.exchange
    ? drill.transmission !== undefined
      ? [drill.exchange.transmissions[drill.transmission]]
      : drill.exchange.transmissions
    : []
  return (
    <div>
      <Prompt text={drill.prompt} kind="Mitschreiben" />
      {drill.chart && (
        <div className="mb-3">
          <Chart data={drill.chart} />
        </div>
      )}
      {drill.context && (
        <div className="mb-3 rounded-lg border border-line bg-black/20 px-4 py-3 font-mono text-[0.95rem]">
          <InlineMarkdown text={drill.context} />
        </div>
      )}
      {drill.exchange && (
        <div className="mb-3">
          <RadioPanel exchange={drill.exchange} listen>
            {shown.map((t, i) => (
              <TransmissionLine key={i} t={t} neutral />
            ))}
          </RadioPanel>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="grid gap-2 sm:grid-cols-2"
      >
        {drill.fields.map((f, i) => (
          <label key={i} className="block">
            <span className="mb-1 block text-sm text-muted">{f.label}</span>
            <input
              autoFocus={i === 0}
              disabled={checked}
              value={values[i]}
              onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={f.placeholder}
              spellCheck={false}
              autoComplete="off"
              className={`w-full rounded-lg border bg-black/30 px-3 py-2 font-mono outline-none ${checked ? (ok(i) ? 'border-emerald-400' : 'border-red-400') : 'border-line focus:border-phosphor'}`}
            />
            {checked && !ok(i) && <span className="mt-0.5 block text-xs text-red-300">Richtig: {f.accept[0]}</span>}
            {checked && ok(i) && <SpellingNote fixes={matchOf(i) ?? []} />}
          </label>
        ))}
        <button type="submit" className="hidden" />
      </form>
      {!checked && (
        <div className="mt-4">
          <Btn disabled={!allFilled} onClick={submit}>
            Prüfen
          </Btn>
        </div>
      )}
      {checked && <Feedback correct={correct} explain={drill.explain} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

function CallDrillView({ drill, onAnswered }: { drill: CallDrill; onAnswered: Answer }) {
  const [done, setDone] = useState(false)
  const visible = drill.exchange.transmissions.map((t, i) => ({ t, i })).filter(({ t }) => !t.skip)
  const heard = visible.slice(0, drill.heard)
  const after = done ? visible.filter(({ i }) => i !== drill.transmission).slice(drill.heard) : []
  const expected = drill.transmission !== null ? drill.exchange.transmissions[drill.transmission] : undefined
  return (
    <div>
      <Prompt text={drill.prompt} kind={drill.expect === 'silence' ? 'Funkdisziplin' : 'Funkspruch'} />
      <p className="-mt-2 mb-3 text-sm text-muted">
        Du bist <span className="font-mono text-amber-hud">{drill.self}</span>.
      </p>
      <RadioPanel exchange={drill.exchange} listen>
        {heard.length === 0 && <p className="text-sm text-muted">Die Frequenz ist frei.</p>}
        {heard.map(({ t, i }) => (
          <TransmissionLine key={i} t={t} />
        ))}
        {after.map(({ t, i }) => (
          <div key={i} className="opacity-80">
            <TransmissionLine t={t} />
          </div>
        ))}
      </RadioPanel>
      <div className="mt-4">
        <CallInput
          expected={expected}
          expectSilence={drill.expect === 'silence'}
          hint={drill.hint}
          explain={drill.explain}
          hintContext={hintContextForExchange(drill.exchange)}
          onDone={(r) => {
            setDone(true)
            onAnswered(r.correct)
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function readNumber(input: string): number | null {
  const n = toItems(input).find((i) => i.kind === 'num')
  return n && n.kind === 'num' ? n.n : null
}

function PlotDrillView({ drill, onAnswered }: { drill: PlotDrill; onAnswered: Answer }) {
  const p = drill.picture
  const g = p.groups[drill.group]
  const [pick, setPick] = useState<Point | null>(null)
  const [bearing, setBearing] = useState('')
  const [range, setRange] = useState('')
  const [result, setResult] = useState<{ correct: boolean; text: string } | null>(null)
  const origin = drill.mode === 'braa' ? p.own : { x: 0, y: 0 }
  const trueBearing = bearingDeg(origin, g)
  const trueRange = Math.round(distNm(origin, g))
  const fmt = (b: number, r: number) => `${String(b).padStart(3, '0')}/${r}`

  const checkPlace = () => {
    if (!pick) return
    const miss = distNm(pick, g)
    const allowed = Math.max(drill.rangeTolerance * 2, 0.12 * distNm({ x: 0, y: 0 }, g))
    const userB = bearingDeg({ x: 0, y: 0 }, pick)
    const userR = Math.round(distNm({ x: 0, y: 0 }, pick))
    const correct = miss <= allowed
    setResult({
      correct,
      text: `Du hast bullseye ${fmt(userB, userR)} gesetzt, richtig ist ${fmt(bearingDeg({ x: 0, y: 0 }, g), Math.round(distNm({ x: 0, y: 0 }, g)))} – Abweichung ${Math.round(miss)} NM (erlaubt ${Math.round(allowed)} NM).`,
    })
    onAnswered(correct)
  }

  const checkRead = () => {
    const b = readNumber(bearing)
    const r = readNumber(range)
    if (b === null || r === null) return
    const okB = angleDiff(b, trueBearing) <= drill.bearingTolerance
    const okR = Math.abs(r - trueRange) <= drill.rangeTolerance
    const correct = okB && okR
    const tip =
      !okB && angleDiff(b, (trueBearing + 180) % 360) <= drill.bearingTolerance
        ? ' Tipp: Du hast die Gegenrichtung genommen – die Peilung zeigt immer VOM Bezugspunkt ZUR Gruppe.'
        : ''
    setResult({
      correct,
      text: `Du: ${fmt(b, r)}, richtig: ${fmt(trueBearing, trueRange)} (Toleranz ±${drill.bearingTolerance}° / ±${drill.rangeTolerance} NM).${tip}`,
    })
    onAnswered(correct)
  }

  const revealed = result !== null
  const showGroups = drill.mode === 'place' ? (revealed ? p.groups.map((_, i) => i) : []) : [drill.group]
  const markers: ScopeMarker[] = []
  if (pick) markers.push({ ...pick, tone: 'user', label: 'du' })
  const lines: [Point, Point][] = revealed && pick ? [[pick, g]] : drill.mode === 'braa' && revealed ? [[p.own, g]] : []
  const context = drill.context ?? (drill.mode === 'place' && !drill.exchange ? `„${groupCallText(drill)}“` : undefined)

  return (
    <div>
      <Prompt text={drill.prompt} kind="Lagebild" />
      {context && (
        <div className="mb-3 rounded-lg border border-line bg-black/20 px-4 py-3 font-mono text-[0.95rem]">
          <InlineMarkdown text={context} />
        </div>
      )}
      {drill.exchange && (
        <div className="mb-3">
          <RadioPanel exchange={drill.exchange} listen>
            {drill.exchange.transmissions.map((t, i) => (t.skip ? null : <TransmissionLine key={i} t={t} />))}
          </RadioPanel>
        </div>
      )}
      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div className="w-full max-w-[460px]">
          <Scope
            picture={p}
            showGroups={showGroups}
            highlight={drill.group}
            showOwn={drill.mode !== 'bullseye' || revealed}
            markers={markers}
            lines={lines}
            onPick={drill.mode === 'place' && !revealed ? setPick : undefined}
          />
          <div className="mt-2">
            <ScopeLegend showOwn={drill.mode !== 'bullseye'} />
          </div>
        </div>
        <div className="w-full flex-1">
          {drill.mode === 'place' ? (
            <>
              <p className="text-sm text-muted">Tippe auf die Karte, wo die Gruppe steht. Peilung VOM Bullseye, Entfernung in NM.</p>
              {pick && !revealed && (
                <p className="mt-2 font-mono text-sm text-amber-hud">
                  bullseye {fmt(bearingDeg({ x: 0, y: 0 }, pick), Math.round(distNm({ x: 0, y: 0 }, pick)))}
                </p>
              )}
              {!revealed && (
                <div className="mt-3">
                  <Btn disabled={!pick} onClick={checkPlace}>
                    Prüfen
                  </Btn>
                </div>
              )}
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                checkRead()
              }}
              className="grid gap-2"
            >
              <p className="text-sm text-muted">
                {drill.mode === 'braa'
                  ? 'Peilung und Entfernung VON DIR (blaues Dreieck) zur roten Gruppe.'
                  : 'Peilung und Entfernung VOM Bullseye zur roten Gruppe.'}
              </p>
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Peilung (°)</span>
                <input
                  autoFocus
                  disabled={revealed}
                  value={bearing}
                  onChange={(e) => setBearing(e.target.value)}
                  placeholder="z. B. 045"
                  className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 font-mono outline-none focus:border-phosphor"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Entfernung (NM)</span>
                <input
                  disabled={revealed}
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="z. B. 40"
                  className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 font-mono outline-none focus:border-phosphor"
                />
              </label>
              <button type="submit" className="hidden" />
              {!revealed && (
                <div className="mt-1">
                  <Btn disabled={readNumber(bearing) === null || readNumber(range) === null} onClick={checkRead}>
                    Prüfen
                  </Btn>
                </div>
              )}
            </form>
          )}
          {result && (
            <Feedback correct={result.correct} explain={drill.explain}>
              <p className="mt-1 text-sm">{result.text}</p>
            </Feedback>
          )}
        </div>
      </div>
    </div>
  )
}

function groupCallText(drill: PlotDrill): string {
  const p = drill.picture
  const g = p.groups[drill.group]
  const b = bearingDeg({ x: 0, y: 0 }, g)
  const r = Math.round(distNm({ x: 0, y: 0 }, g))
  return `${g.name} bullseye ${String(b).padStart(3, '0')}/${r}, ${Math.round(g.altFt / 1000)} thousand, ${g.id}`
}

// ---------------------------------------------------------------------------

const ELEMENT_LABELS: Record<string, string> = {
  atis: 'ATIS-Frequenz',
  clearance: 'Clearance Delivery',
  ground: 'Ground-Frequenz',
  tower: 'Tower-Frequenz',
  approach: 'Approach-Frequenz',
  departure: 'Departure-Frequenz',
  elevation: 'Platzhöhe',
  tacan: 'TACAN',
  navaid: 'Navigationshilfe',
  course: 'Endanflugkurs',
  faf: 'Final Approach Fix (FAF)',
  da: 'Entscheidungs- bzw. Mindesthöhe',
  msa: 'Mindestsicherheitshöhe (MSA)',
  missed: 'Fehlanflugverfahren',
  minima: 'Minima-Zeile',
  iaf: 'Initial Approach Fix (IAF)',
}

function chartElementLabel(id: string): string {
  return id.startsWith('rwy:') ? `Runway ${id.slice(4)}` : (ELEMENT_LABELS[id] ?? id)
}

function ChartTapView({ drill, onAnswered }: { drill: ChartTapDrill; onAnswered: Answer }) {
  const [picked, setPicked] = useState<string | null>(null)
  const correct = picked !== null && drill.targets.includes(picked)
  const marks: Record<string, ChartMark> = {}
  if (picked) {
    for (const t of drill.targets) marks[t] = 'right'
    if (!correct) marks[picked] = 'wrong'
  }
  return (
    <div>
      <Prompt text={drill.prompt} kind="Karte" />
      <p className="-mt-2 mb-3 text-sm text-muted">Tippe auf das passende Element der Karte.</p>
      <Chart
        data={drill.chart}
        marks={marks}
        onTap={
          picked
            ? undefined
            : (id) => {
                setPicked(id)
                onAnswered(drill.targets.includes(id))
              }
        }
      />
      {picked && (
        <Feedback correct={correct} explain={drill.explain}>
          {!correct && (
            <p className="mt-1 text-sm">
              Du hast „{chartElementLabel(picked)}“ gewählt. Richtig: {drill.targets.map(chartElementLabel).join(' oder ')} (grün markiert).
            </p>
          )}
        </Feedback>
      )}
    </div>
  )
}
