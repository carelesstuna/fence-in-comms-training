/**
 * Funkspruch-Anatomie: Funksprüche als farbige, antippbare Segmente mit Erklärung.
 */
import { useMemo, useState } from 'react'
import type { ResolvedExchange, ResolvedSegment, ResolvedTransmission } from '../core/drills/types'
import type { RadioKind } from '../core/content/schema'
import { resolveExchange } from '../core/drills/resolve'
import { content, useRun } from '../ui/run'
import { moreForSegment } from '../core/glossary/more'
import { glossary } from '../ui/glossary'
import { roleInfo } from '../ui/roles'
import { SegmentGlossary } from './GlossaryTerm'
import { MoreLinkLine } from './MoreLink'
import { ExchangeAudio, HiddenLine, LinePlayButton, PlayAllButton } from './audio/ExchangeAudio'
import { useLineAudio } from './audio/exchange-audio'

export type Verdict = 'right' | 'wrong' | 'warn' | 'dim'

export function SegmentChip({
  seg,
  selected = false,
  neutral = false,
  verdict,
  onClick,
}: {
  seg: ResolvedSegment
  selected?: boolean
  neutral?: boolean
  verdict?: Verdict
  onClick?: () => void
}) {
  const { cls, label } = roleInfo(seg.role)
  const base = neutral ? 'bg-white/5 text-text hover:bg-white/10' : cls.chip
  const ring =
    verdict === 'right'
      ? 'ring-2 ring-emerald-400'
      : verdict === 'wrong'
        ? 'ring-2 ring-red-400'
        : verdict === 'warn'
          ? 'ring-2 ring-amber-400'
          : verdict === 'dim'
            ? 'opacity-50'
            : selected
              ? `ring-2 ${cls.ring}`
              : ''
  return (
    <button
      type="button"
      onClick={onClick}
      title={neutral ? undefined : label}
      className={`rounded-md px-2 py-1 font-mono text-[0.95rem] leading-snug transition ${base} ${ring} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {seg.text}
    </button>
  )
}

const RADIO_BADGE: Record<RadioKind, { label: string; title: string; cls: string }> = {
  uhf: { label: 'UHF', title: 'gesendet auf UHF (AM)', cls: 'bg-sky-500/20 text-sky-200' },
  vhf: { label: 'VHF', title: 'gesendet auf VHF-AM', cls: 'bg-teal-500/20 text-teal-200' },
  fm: { label: 'FM', title: 'gesendet auf VHF-FM („fox mike“)', cls: 'bg-lime-500/20 text-lime-200' },
  intercom: { label: 'ICS', title: 'Bordsprechanlage (Intercom)', cls: 'bg-violet-500/20 text-violet-200' },
}

/** Funkgerät einer Übertragung (C-F6), z. B. FM beim JTAC. */
export function RadioBadge({ radio }: { radio: RadioKind }) {
  const b = RADIO_BADGE[radio]
  return (
    <span title={b.title} className={`rounded px-1 font-mono text-[10px] ${b.cls}`}>
      {b.label}
    </span>
  )
}

export function TransmissionLine({
  t,
  selectedIndex,
  onSelect,
  neutral = false,
  verdicts,
  label,
  model = false,
}: {
  t: ResolvedTransmission
  selectedIndex?: number | null
  onSelect?: (i: number) => void
  neutral?: boolean
  verdicts?: Record<number, Verdict>
  /** Statt „Du“ bzw. der Station, z. B. „Musterlösung“. */
  label?: string
  /** Musterlösung, nicht gesendet: gedimmt und mit hohlem Punkt. */
  model?: boolean
}) {
  // Abspielen (▶) und Hörübung, wenn die Zeile zu einem Funkspruch mit Ton gehört
  const line = useLineAudio(t)
  return (
    <div className={`flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3 ${model ? 'opacity-75' : ''}`}>
      <div className="flex shrink-0 items-center gap-2 pt-1 sm:w-44">
        <span className={`h-2 w-2 rounded-full ${model ? 'border border-muted' : t.you ? 'bg-amber-hud' : 'bg-phosphor'}`} />
        <span className={`font-mono text-xs tracking-wide uppercase ${model ? 'text-muted' : t.you ? 'text-amber-hud' : 'text-phosphor'}`}>
          {label ?? (t.you ? 'Du' : t.speaker)}
        </span>
        {t.channel === 'intercom' && !t.radio && <span className="rounded bg-violet-500/20 px-1 text-[10px] text-violet-200">ICS</span>}
        {t.radio && <RadioBadge radio={t.radio} />}
        {line && <LinePlayButton line={line} />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {line?.hidden ? (
          <HiddenLine line={line} />
        ) : (
          t.segments.map((s, i) => (
            <SegmentChip
              key={i}
              seg={s}
              neutral={neutral}
              selected={selectedIndex === i}
              verdict={verdicts?.[i]}
              onClick={onSelect ? () => onSelect(i) : undefined}
            />
          ))
        )}
        {/* Regieanweisung zur Übertragung („Auf der neuen Frequenz.“, „Lesbarkeit 3“) – nur auf Leseseiten */}
        {!neutral && t.note && !line?.hidden && <span className="basis-full text-xs text-muted italic">{t.note}</span>}
      </div>
    </div>
  )
}

export function SegmentDetail({ seg }: { seg: ResolvedSegment | null }) {
  if (!seg) {
    return <p className="text-sm text-muted">Tippe auf einen farbigen Teil, um zu sehen, was er aussagt.</p>
  }
  const { label, question, cls } = roleInfo(seg.role)
  const more = moreForSegment(seg, content.roles, glossary)
  return (
    <div className="flex gap-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${cls.dot}`} />
      <div>
        <div className="text-sm">
          <span className={`font-semibold ${cls.text}`}>{label}</span>
          <span className="text-muted"> – {question}</span>
        </div>
        <div className="mt-0.5 font-mono text-sm text-text">„{seg.text}“</div>
        {seg.note && <p className="mt-1 text-[0.95rem] text-text/90">{seg.note}</p>}
        <SegmentGlossary text={seg.text} role={seg.role} />
        {more && <MoreLinkLine link={more} />}
      </div>
    </div>
  )
}

export function RoleLegend({ exchange }: { exchange: ResolvedExchange }) {
  const roles = [...new Set(exchange.transmissions.flatMap((t) => t.segments.map((s) => s.role)))]
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {roles.map((r) => {
        const { label, cls } = roleInfo(r)
        return (
          <span key={r} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${cls.dot}`} />
            {label}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Funkspruch im Kasten. Sichtbare Zeilen lassen sich abspielen; mit `listen` ist es eine Hörübung:
 * Der Text der Gegenstellen erscheint erst nach dem Hören (ohne Ton oder mit „Text immer zeigen“ sofort).
 */
/**
 * Funkspruch im Kasten. `neutral` (in Übungen): nur, was auf der Frequenz zu hören ist – ohne Titel, Frequenz und
 * Erklärung; Rufzeichen, Ort und Funk stehen dort in der Rahmenleiste, die Lage darunter.
 */
export function RadioPanel({
  exchange,
  listen = false,
  neutral = false,
  children,
}: {
  exchange: ResolvedExchange
  listen?: boolean
  neutral?: boolean
  children: React.ReactNode
}) {
  return (
    <ExchangeAudio transmissions={exchange.transmissions} listen={listen}>
      <div className="scanlines overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-panel-2 px-4 py-2">
          <span className="text-sm font-semibold text-text">{neutral ? 'Auf der Frequenz' : exchange.title}</span>
          <span className="flex items-center gap-2">
            <PlayAllButton />
            {!neutral && exchange.freq && <span className="font-mono text-xs text-phosphor">◉ {exchange.freq}</span>}
          </span>
        </div>
        <div className="space-y-3 px-4 py-3">
          {!neutral && exchange.context && <p className="text-sm text-muted italic">{exchange.context}</p>}
          {children}
        </div>
      </div>
    </ExchangeAudio>
  )
}

/** Interaktiver Funkspruch in Leseseiten (::call{id=…}). */
export function CallAnatomy({ exchangeId, as }: { exchangeId: string; as?: string }) {
  const run = useRun()
  const [roll, setRoll] = useState(0)
  const [sel, setSel] = useState<[number, number] | null>(null)
  const exchange = useMemo(() => {
    const x = content.exchanges.get(exchangeId)
    return x ? resolveExchange(x, run.envFor(`call:${exchangeId}:${roll}`), { as }) : null
  }, [exchangeId, roll, run, as])
  if (!exchange) return <p className="text-red-300">Funkspruch „{exchangeId}“ fehlt.</p>
  const selected = sel ? exchange.transmissions[sel[0]]?.segments[sel[1]] ?? null : null
  return (
    <RadioPanel exchange={exchange}>
      <div className="space-y-3">
        {exchange.transmissions.map((t, ti) =>
          t.skip ? null : <TransmissionLine key={ti} t={t} selectedIndex={sel?.[0] === ti ? sel[1] : null} onSelect={(si) => setSel([ti, si])} />,
        )}
      </div>
      <div className="rounded-lg bg-black/20 px-3 py-2.5">
        <SegmentDetail seg={selected} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RoleLegend exchange={exchange} />
        <button
          onClick={() => {
            setRoll((r) => r + 1)
            setSel(null)
          }}
          className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-phosphor-dim hover:text-phosphor"
          title="Andere Flugplätze, Frequenzen und Werte würfeln"
        >
          ⟳ Neu würfeln
        </button>
      </div>
    </RadioPanel>
  )
}
