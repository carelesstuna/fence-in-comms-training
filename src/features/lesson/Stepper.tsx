/**
 * Gemeinsame Bausteine für Lektionen und Einstufungstests.
 */
import type { ReactNode } from 'react'

export function StepHeader({ title, sub, step, total, onExit }: { title: string; sub: string; step: number; total: number; onExit: () => void }) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">{sub}</div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>
        <button onClick={onExit} className="rounded-md border border-line px-2.5 py-1 text-sm text-muted hover:text-text">
          Abbrechen
        </button>
      </div>
      <div className="mt-3 flex gap-1" aria-label={`Schritt ${step + 1} von ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-phosphor' : i === step ? 'bg-phosphor/60' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  )
}

export function StepFooter({
  canBack,
  canNext,
  last,
  onBack,
  onNext,
  hint,
}: {
  canBack: boolean
  canNext: boolean
  last: boolean
  onBack: () => void
  onNext: () => void
  hint?: ReactNode
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
      <button
        onClick={onBack}
        disabled={!canBack}
        className="rounded-lg px-3 py-2 text-sm text-muted hover:text-text disabled:invisible"
      >
        ← Zurück
      </button>
      <span className="text-sm text-muted">{hint}</span>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="rounded-lg bg-phosphor px-5 py-2 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {last ? 'Abschließen' : 'Weiter →'}
      </button>
    </div>
  )
}

export function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const r = 34
  const c = 2 * Math.PI * r
  const color = score >= 0.8 ? '#7dd87d' : score >= 0.5 ? '#f2c14e' : '#f87171'
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" role="img" aria-label={`${pct} Prozent`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${c * score} ${c}`}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-white font-mono text-[16px] font-semibold">
        {pct}%
      </text>
    </svg>
  )
}
