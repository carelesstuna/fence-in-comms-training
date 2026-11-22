/**
 * 9-Line- und 5-Line-Decoder (Spur C): den Brief des JTAC hören (vorerst lesen), Zeile für Zeile mitschreiben,
 * danach zurücklesen. Dazu die Lageskizze des Einsatzraums.
 *
 * Hören: `BriefLog` blendet die Übertragungen nacheinander ein (`step`), verdeckt bis zum Klick (`click`) oder alle
 * auf einmal (`all`). Mit Ton spielt der Knopf die Übertragung erst ab und zeigt danach den Text („abspielen, dann
 * Text zeigen“) – über den umgebenden RadioPanel oder ein eigenes `onPlay`. Ohne Ton kommt der Text sofort.
 */
import { useState, type ReactNode } from 'react'
import type { NineLineDrill, ResolvedTransmission } from '../core/drills/types'
import type { CasArea } from '../core/random/cas'
import { bearing, distance, NM, norm360 } from '../core/random/cas'
import { checkNineLine, extraReadback, type FieldCheck, type NineLineField, type NineLineResult } from '../core/scoring/nineline'
import { RadioPanel, SegmentDetail, TransmissionLine } from './CallAnatomy'
import { CallInput, type CallResult } from './CallInput'
import { InlineMarkdown } from './Markdown'
import { hintContextForExchange } from '../ui/speech'
import { useExchangePlay } from './audio/exchange-audio'

// ---------------------------------------------------------------------------
// Brief hören
// ---------------------------------------------------------------------------

export type RevealMode = 'step' | 'click' | 'all'

export function BriefLog({
  transmissions,
  reveal,
  neutral,
  onAllShown,
  onPlay,
}: {
  transmissions: ResolvedTransmission[]
  reveal: RevealMode
  /** Ohne Rollenfarben (während des Mitschreibens). */
  neutral: boolean
  onAllShown?: () => void
  /** Übertragung abspielen; erst danach wird der Text gezeigt. Standard: über den umgebenden RadioPanel. */
  onPlay?: (t: ResolvedTransmission) => Promise<void>
}) {
  const panelPlay = useExchangePlay()
  // Zwei Tempi (Spur C): langsam zum Mitschreiben, normal wie im Einsatz
  const [slow, setSlow] = useState(false)
  const play = onPlay ?? (panelPlay && ((t: ResolvedTransmission) => panelPlay(t, slow ? 0.8 : 1)))
  const list = transmissions.filter((t) => !t.skip)
  // Mit Ton beginnt auch der erste Teil verdeckt: erst hören, dann lesen
  const [shown, setShown] = useState(reveal === 'all' ? list.length : reveal === 'step' && !play ? 1 : 0)
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState<[number, number] | null>(null)
  const next = async () => {
    if (busy || shown >= list.length) return
    setBusy(true)
    try {
      await play?.(list[shown])
    } finally {
      setBusy(false)
    }
    const n = shown + 1
    setShown(n)
    if (n >= list.length) onAllShown?.()
  }
  return (
    <div className="space-y-2.5">
      {list.map((t, i) => {
        if (i < shown) {
          return (
            <TransmissionLine
              key={i}
              t={t}
              neutral={neutral}
              selectedIndex={sel?.[0] === i ? sel[1] : null}
              onSelect={neutral ? undefined : (si) => setSel([i, si])}
            />
          )
        }
        if (reveal === 'click') {
          const isNext = i === shown
          return (
            <button
              key={i}
              type="button"
              disabled={!isNext || busy}
              onClick={next}
              className={`flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-left text-sm ${isNext ? 'border-phosphor-dim text-text hover:border-phosphor' : 'border-line text-muted opacity-60'}`}
            >
              <span className="font-mono text-phosphor">{play ? '▶' : '◉'}</span>
              <span className="font-mono text-xs tracking-wide uppercase">{t.speaker}</span>
              <span className="text-muted">{isNext ? (play ? (busy ? 'läuft …' : 'abspielen') : 'antippen zum Aufdecken') : 'kommt danach'}</span>
            </button>
          )
        }
        return null
      })}
      {play && !onPlay && shown < list.length && (
        <button
          type="button"
          aria-pressed={slow}
          onClick={() => setSlow(!slow)}
          className={`mr-2 rounded-md border px-2 py-1 text-xs ${slow ? 'border-amber-hud text-amber-hud' : 'border-line text-muted hover:text-text'}`}
        >
          Tempo: {slow ? 'langsam' : 'normal'}
        </button>
      )}
      {reveal === 'step' && shown < list.length && (
        <button type="button" onClick={next} disabled={busy} className="rounded-md border border-phosphor-dim px-3 py-1.5 text-sm text-phosphor hover:border-phosphor">
          {play ? (busy ? '… läuft' : '▶ Weiter hören') : 'Weiter hören ▸'} ({shown}/{list.length})
        </button>
      )}
      {sel && !neutral && (
        <div className="rounded-lg bg-black/20 px-3 py-2.5">
          <SegmentDetail seg={list[sel[0]]?.segments[sel[1]] ?? null} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mitschreiben
// ---------------------------------------------------------------------------

function Mark({ c }: { c: FieldCheck }) {
  return <span className={c.ok ? 'text-emerald-300' : c.near ? 'text-amber-hud' : 'text-red-300'}>{c.ok ? '✓' : c.near ? '◐' : '✗'}</span>
}

/** Ergebnis je Zeile (Mitschrift, Sollwert, Hinweis) – auch fürs Checkride-Debriefing. */
export function NineLineResultList({ fields, result }: { fields: NineLineField[]; result: NineLineResult }) {
  return (
    <ul className="space-y-1 text-sm">
      {fields.map((f, i) => {
        const c = result.checks[i]
        return (
          <li key={f.key} className="flex gap-2">
            <Mark c={c} />
            <span>
              <span className="text-muted">{f.label}: </span>
              {c.ok ? (
                <span className="font-mono">{result.values[i]}</span>
              ) : (
                <>
                  <span className="font-mono">{result.values[i]?.trim() ? `„${result.values[i]}“` : '—'}</span>
                  <span className="text-muted"> → richtig </span>
                  <span className="font-mono text-text">{f.expected}</span>
                </>
              )}
              {c.note && <span className="block text-xs text-muted">{c.note}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Das Kneeboard zum Mitschreiben. `ready` = der Brief ist komplett, jetzt darf geprüft werden. Im Checkride (`blind`)
 * gibt es keine Bewertung je Zeile, nur „notiert“.
 */
export function NineLineForm({
  fields,
  ready,
  blind = false,
  title,
  onChecked,
}: {
  fields: NineLineField[]
  ready: boolean
  blind?: boolean
  title?: string
  onChecked: (r: NineLineResult) => void
}) {
  const [values, setValues] = useState<string[]>(fields.map(() => ''))
  const [result, setResult] = useState<NineLineResult | null>(null)
  const submit = () => {
    if (!ready || result) return
    const r = checkNineLine(fields, values)
    setResult(r)
    onChecked(r)
  }
  return (
    <div className="rounded-lg border border-amber-hud/30 bg-amber-hud/5 p-3">
      <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">{title ?? 'Kneeboard · Mitschrift'}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="grid gap-2 sm:grid-cols-2"
      >
        {fields.map((f, i) => {
          const c = result && !blind ? result.checks[i] : null
          const border = c ? (c.ok ? 'border-emerald-400' : c.near ? 'border-amber-400' : 'border-red-400') : 'border-line focus:border-phosphor'
          return (
            <label key={f.key} className="block">
              <span className="mb-0.5 block text-sm">
                <span className="font-mono text-xs text-phosphor">{f.label}</span>
                <span className="text-xs text-muted"> – {f.hint}</span>
              </span>
              <input
                disabled={!!result}
                value={values[i]}
                onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={f.placeholder}
                spellCheck={false}
                autoComplete="off"
                className={`w-full rounded-lg border bg-black/30 px-3 py-1.5 font-mono outline-none ${border}`}
              />
              {c && !c.ok && (
                <span className="mt-0.5 block text-xs text-red-300">
                  Richtig: <span className="font-mono">{f.expected}</span>
                  {c.note && <span className="text-muted"> – {c.note}</span>}
                </span>
              )}
              {c?.ok && c.note && <span className="mt-0.5 block text-xs text-muted">{c.note}</span>}
            </label>
          )
        })}
        <button type="submit" className="hidden" />
      </form>
      {!result && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {blind ? 'Mitschrift abschließen' : 'Prüfen'}
          </button>
          {!ready && <span className="text-sm text-muted">Erst den ganzen Brief hören.</span>}
        </div>
      )}
      {result && blind && <p className="mt-2 text-sm text-muted">Notiert. Die Auswertung kommt im Debriefing.</p>}
      {result && !blind && (
        <p className={`mt-2 text-sm font-semibold ${result.correct ? 'text-emerald-300' : 'text-amber-hud'}`}>
          {result.correct ? '✓ Alle Zeilen richtig mitgeschrieben.' : `${result.checks.filter((c) => c.ok).length} von ${fields.length} Zeilen richtig.`}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lageskizze
// ---------------------------------------------------------------------------

/**
 * Schematische Skizze des Einsatzraums, Norden oben, nicht maßstäblich: Ziel in der Mitte, Freunde und Bedrohung
 * nah, IP und Egress-Punkt am Rand. Dazu der Sektor, aus dem angegriffen werden darf, und bei Laser die
 * Laser-Target-Line.
 */
export function CasSketch({ area }: { area: CasArea }) {
  const C = 160
  const at = (brg: number, r: number) => {
    const rad = (brg * Math.PI) / 180
    return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) }
  }
  const T = { x: C, y: C }
  const rF = 34 + 56 * Math.min(1, area.friend.distM / 3000)
  const F = at(area.friend.brgTrue, rF)
  const TH = at(area.threat.brgTrue, 72 + 8 * area.threat.distKm)
  const IP = at(bearing(area.target, area.ip), 140)
  const EG = at(area.egress.brgTrue, 140)
  // Anflugsektor: Flugzeuge mit Kurs h kommen aus h + 180
  const fromTrue = area.fah.fromMag + area.magVar
  const toTrue = area.fah.toMag + area.magVar
  const width = norm360(toTrue - fromTrue)
  const a0 = at(fromTrue + 180, 120)
  const a1 = at(fromTrue + 180 + width, 120)
  const wedge = `M ${C} ${C} L ${a0.x} ${a0.y} A 120 120 0 0 1 ${a1.x} ${a1.y} Z`
  const ipNm = (distance(area.ip, area.target) / NM).toFixed(1)
  // Beschriftung neben dem Punkt, aber nie über den Rand hinaus (rund 5,5 px je Zeichen)
  const label = (p: { x: number; y: number }, text: string, cls: string) => {
    const w = text.length * 5.5
    const right = p.x > C ? p.x + 8 + w <= 316 : p.x - 8 - w < 4
    return (
      <text x={right ? p.x + 8 : p.x - 8} y={p.y + (p.y > C ? 14 : -8)} textAnchor={right ? 'start' : 'end'} className={`fill-current text-[10px] ${cls}`}>
        {text}
      </text>
    )
  }
  return (
    <figure className="rounded-lg border border-line bg-black/30 p-2">
      <svg viewBox="0 0 320 320" className="w-full max-w-[360px]" role="img" aria-label="Lageskizze des Einsatzraums">
        <path d={wedge} className="fill-emerald-400/10 stroke-emerald-400/50" strokeWidth={1} />
        <line x1={IP.x} y1={IP.y} x2={T.x} y2={T.y} className="stroke-amber-300" strokeWidth={1.5} strokeDasharray="5 4" />
        <line x1={T.x} y1={T.y} x2={EG.x} y2={EG.y} className="stroke-sky-300/70" strokeWidth={1.2} markerEnd="url(#cas-arrow)" />
        {area.mark === 'laser' && <line x1={F.x} y1={F.y} x2={T.x} y2={T.y} className="stroke-red-400" strokeWidth={1} strokeDasharray="2 3" />}
        <defs>
          <marker id="cas-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-sky-300/70" />
          </marker>
        </defs>
        <circle cx={TH.x} cy={TH.y} r={14} className="fill-red-500/10 stroke-red-400/60" strokeDasharray="3 3" />
        <circle cx={TH.x} cy={TH.y} r={3} className="fill-red-400" />
        <rect x={F.x - 5} y={F.y - 5} width={10} height={10} className="fill-sky-400" />
        <path d={`M ${T.x - 6} ${T.y - 6} L ${T.x + 6} ${T.y + 6} M ${T.x + 6} ${T.y - 6} L ${T.x - 6} ${T.y + 6}`} className="stroke-red-400" strokeWidth={2.5} />
        <path d={`M ${IP.x} ${IP.y - 6} L ${IP.x + 6} ${IP.y + 5} L ${IP.x - 6} ${IP.y + 5} Z`} className="fill-amber-300" />
        {label(IP, `IP ${area.ip.name} · ${ipNm} NM`, 'text-amber-200')}
        {label(T, 'Ziel', 'text-red-300')}
        {label(F, `Freunde/JTAC · ${area.friend.distM} m`, 'text-sky-300')}
        {label(TH, area.threat.type.name, 'text-red-300')}
        {label(EG, `Egress ${area.egress.to}`, 'text-sky-200')}
        <g transform="translate(296 26)">
          <path d="M 0 -14 L 5 2 L 0 -2 L -5 2 Z" className="fill-text" />
          <text y={14} textAnchor="middle" className="fill-current text-[10px] text-muted">N</text>
        </g>
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        Schematisch, nicht maßstäblich. Grün: Anflugsektor (Final Attack Heading {String(area.fah.fromMag).padStart(3, '0')}–
        {String(area.fah.toMag).padStart(3, '0')}){area.mark === 'laser' ? ', rot gestrichelt: Laser-Target-Line' : ''}. Missweisung {Math.abs(area.magVar)}°{' '}
        {area.magVar < 0 ? 'W' : 'E'}.
      </figcaption>
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Übung
// ---------------------------------------------------------------------------

function Box({ correct, title, children }: { correct: boolean; title: string; children?: ReactNode }) {
  return (
    <div role="status" className={`mt-4 rounded-lg border px-4 py-3 ${correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}>
      <div className={`font-semibold ${correct ? 'text-emerald-300' : 'text-red-300'}`}>{title}</div>
      {children}
    </div>
  )
}

export function NineLineDrillView({ drill, onAnswered }: { drill: NineLineDrill; onAnswered: (correct: boolean) => void }) {
  const [briefDone, setBriefDone] = useState(drill.reveal === 'all')
  const [form, setForm] = useState<NineLineResult | null>(null)
  const [rb, setRb] = useState<CallResult | null>(null)
  const readbackT = drill.readback ? drill.readback.exchange.transmissions[drill.readback.transmission] : undefined
  const before = drill.readback ? drill.readback.exchange.transmissions.slice(0, drill.readback.transmission).filter((t) => !t.skip) : []
  const after = drill.readback ? drill.readback.exchange.transmissions.slice(drill.readback.transmission + 1).filter((t) => !t.skip) : []
  const done = form !== null && (!drill.readback || rb !== null)
  const correct = !!form?.correct && (!drill.readback || !!rb?.correct)
  const extras = extraReadback(rb?.detail, readbackT?.segments ?? [])
  const name = drill.format === 'fiveline' ? '5-Line' : '9-Line'

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1 font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">{name}-Decoder</div>
        <div className="text-lg">
          <InlineMarkdown text={drill.prompt} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Du bist <span className="font-mono text-amber-hud">{drill.self}</span>. Schreib mit, während der Brief kommt – wie auf dem Kneeboard: Ziffern,
          Abkürzungen (S, NW, WP) und Kommas sind erlaubt.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <RadioPanel exchange={drill.exchange}>
            <BriefLog transmissions={drill.exchange.transmissions} reveal={drill.reveal} neutral={!form} onAllShown={() => setBriefDone(true)} />
          </RadioPanel>
          {form && drill.sketch && (
            <div className="mt-3">
              <CasSketch area={drill.area} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <NineLineForm
            fields={drill.fields}
            ready={briefDone}
            onChecked={(r) => {
              setForm(r)
              if (!drill.readback) onAnswered(r.correct)
            }}
          />
        </div>
      </div>

      {form && drill.readback && readbackT && (
        <div className="mt-4 rounded-xl border border-line bg-panel p-4">
          <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Readback</div>
          <p className="mb-2 text-sm text-muted">
            Lies jetzt zurück, was Pflicht ist. Lies aus dem Brief zurück, nicht aus deiner Mitschrift – wenn du dich verschrieben hast, merkt es sonst
            niemand.
          </p>
          {before.length > 0 && (
            <div className="mb-3 space-y-2 rounded-lg border border-line bg-black/20 px-3 py-2">
              {before.map((t, i) => (
                <TransmissionLine key={i} t={t} />
              ))}
            </div>
          )}
          <CallInput expected={readbackT} expectSilence={false} hintContext={hintContextForExchange(drill.readback.exchange)} onDone={(r) => {
            setRb(r)
            onAnswered(!!form.correct && r.correct)
          }} />
          {rb && extras.length > 0 && (
            <p className="mt-2 text-sm text-muted">
              Zusätzlich zurückgelesen: {extras.map((e) => `„${e}“`).join(', ')} – kein Fehler, aber auf einem vollen Netz kostet jedes Wort Zeit.
            </p>
          )}
          {rb && after.length > 0 && (
            <div className="mt-3 space-y-2 rounded-lg border border-line bg-black/20 px-3 py-2">
              {after.map((t, i) => (
                <TransmissionLine key={i} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {done && (
        <Box correct={correct} title={correct ? '✓ Richtig' : '✗ Nicht ganz'}>
          {!form.correct && <p className="mt-1 text-sm">Mitschrift: {form.checks.filter((c) => c.ok).length} von {drill.fields.length} Zeilen richtig.</p>}
          {drill.readback && rb && !rb.correct && <p className="mt-1 text-sm">Der Readback war nicht vollständig – Pflicht sind Line 4, Line 6 und jede Restriktion.</p>}
          {drill.explain && (
            <div className="mt-1 text-[0.95rem]">
              <InlineMarkdown text={drill.explain} />
            </div>
          )}
        </Box>
      )}
    </div>
  )
}
