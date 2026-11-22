/**
 * „Direkt zu Modul X“: ein gesperrtes Kernmodul bewusst freischalten – mit Warnhinweis und Bestätigung.
 */
import { useState } from 'react'
import {
  checkridesRequiring,
  moduleState,
  modulesSkippedBy,
  unlockModule,
} from '../../core/progress/progress'
import { useApp } from '../../state/store'
import { content } from '../../ui/run'

const list = (items: string[]) =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`

export function SkipToModule({ moduleId }: { moduleId: string }) {
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)
  const [asking, setAsking] = useState(false)
  const m = content.modules.get(moduleId)
  if (!m || m.group !== 'core' || moduleState(content, progress, moduleId) !== 'locked') return null

  if (!asking) {
    return (
      <button
        onClick={() => setAsking(true)}
        className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-amber-hud/60 hover:text-text"
      >
        Direkt zu Modul {m.code} …
      </button>
    )
  }

  const skipped = modulesSkippedBy(content, progress, moduleId)
  // Checkrides, für die übersprungene Module (oder dieses selbst) noch erledigt werden müssen
  const affected = [...skipped, m].flatMap((x) =>
    checkridesRequiring(content, x.id)
      .filter((r) => !progress.checkrides?.[r.id]?.passed)
      .map((r) => ({ module: x, rank: r })),
  )
  const confirm = () => {
    setProgress(unlockModule(content, progress, moduleId))
    setAsking(false)
  }
  return (
    <div
      role="alertdialog"
      aria-labelledby={`skip-${m.id}`}
      className="w-full rounded-lg border border-amber-hud/50 bg-amber-hud/5 p-3 text-sm"
    >
      <div id={`skip-${m.id}`} className="font-semibold text-amber-hud">
        ⚠ Direkt zu Modul {m.code}: {m.title}?
      </div>
      <p className="mt-1">
        Damit öffnest du Modul {m.code}
        {skipped.length > 0 && (
          <>
            {' '}
            und überspringst {skipped.length === 1 ? 'Modul' : 'die Module'}{' '}
            {list(skipped.map((x) => x.code))}
          </>
        )}
        . Übersprungene Module gelten nicht als erledigt – ihre Lektionen kannst du jederzeit
        nachholen.
      </p>
      {affected.length > 0 && (
        <p className="mt-1">
          Für den Checkride zum {list([...new Set(affected.map((a) => a.rank.name))])} zählt{' '}
          {list([...new Set(affected.map((a) => `Modul ${a.module.code}`))])} erst, wenn alle
          Lektionen gespielt sind oder die Einstufung bestanden ist.
        </p>
      )}
      {m.placement && (
        <p className="mt-1 text-muted">
          Tipp: Mit bestandenem Einstufungstest gilt das Modul gleich als erledigt.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={confirm}
          className="rounded-lg bg-amber-hud px-3 py-1.5 font-semibold text-ink"
        >
          Ja, Modul {m.code} freischalten
        </button>
        <button
          onClick={() => setAsking(false)}
          className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-text"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
