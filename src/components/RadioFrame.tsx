/**
 * Rahmen und Lage für Übungen, in denen du funkst: oben die Rahmenleiste (Rufzeichen, Ort, Funk) – immer an derselben
 * Stelle –, darunter die Lage (was ist, was du weißt) und der Auftrag (was du tun sollst).
 */
import type { RadioTaskFrame } from '../core/drills/types'
import { InlineMarkdown } from './Markdown'

const label = 'font-mono text-[10px] tracking-[0.2em] text-muted uppercase'

/** Rahmenleiste. `idle`: Funkgerät noch nicht eingestellt (Szenario) – „Funk“ dann grau statt grün. */
export function FrameBar({
  self,
  place,
  freq,
  idle = false,
}: {
  self?: string
  place?: string
  freq?: string
  idle?: boolean
}) {
  const cells = [
    { name: 'Rufzeichen', value: self, tone: 'text-amber-hud' },
    { name: 'Ort', value: place, tone: 'text-text' },
    { name: 'Funk', value: freq, tone: idle ? 'text-muted' : 'text-phosphor' },
  ].filter((c) => c.value)
  if (cells.length === 0) return null
  return (
    // gap-px auf der Linienfarbe: Trennlinien auch dann, wenn die Zellen auf schmalen Bildschirmen umbrechen –
    // eine umgebrochene Zelle füllt ihre Zeile (flex-1), so bleibt keine leere Lücke
    <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-line bg-line">
      {cells.map((c) => (
        <div key={c.name} className="min-w-[9rem] flex-1 bg-panel-2 px-3 py-1.5">
          <div className={label}>{c.name}</div>
          <div className={`font-mono text-sm ${c.tone}`}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}

export function SituationTask({ situation, task }: { situation?: string; task?: string }) {
  if (!situation && !task) return null
  return (
    <div className="space-y-3">
      {situation && (
        <div>
          <div className={label}>Lage</div>
          <div className="mt-0.5 text-[0.95rem]">
            <InlineMarkdown text={situation} />
          </div>
        </div>
      )}
      {task && (
        <div>
          <div className={label}>Auftrag</div>
          <div className="mt-0.5 text-lg font-medium text-white">
            <InlineMarkdown text={task} />
          </div>
        </div>
      )}
    </div>
  )
}

/** Lage (klein) und Auftrag in einer Zeile für Fehlerlisten – der Auftrag allein („Lies sie zurück.“) ist dort zu knapp. */
export function TaskLine({ drill }: { drill: { prompt: string; situation?: string } }) {
  return (
    <>
      {drill.situation && (
        <div className="text-sm text-muted">
          <InlineMarkdown text={drill.situation} />
        </div>
      )}
      <InlineMarkdown text={drill.prompt} />
    </>
  )
}

/**
 * Kopf einer Funkspruch-Übung: Art der Übung, Rahmenleiste, Lage, Auftrag (der `prompt`). Ohne Rahmen (Baukasten im
 * Szenario – Rahmen, Lage und Auftrag stehen dort schon über dem Funk-Log) nur die Art und die Anweisung.
 */
export function RadioTaskHeader({
  kind,
  drill,
}: {
  kind: string
  drill: RadioTaskFrame & { prompt: string }
}) {
  const kindLabel = (
    <div className="font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">{kind}</div>
  )
  if (!drill.self && !drill.situation) {
    return (
      <div className="mb-4">
        <div className="mb-1">{kindLabel}</div>
        <div className="text-lg">
          <InlineMarkdown text={drill.prompt} />
        </div>
      </div>
    )
  }
  return (
    <div className="mb-4 space-y-3">
      {kindLabel}
      <FrameBar self={drill.self} place={drill.place} freq={drill.freq} />
      <SituationTask situation={drill.situation} task={drill.prompt} />
    </div>
  )
}
