/**
 * Abschnitt „Weg für Erfahrene“ auf der Seite Fortschritt: Einstufungstests jederzeit, Freischaltungen und Kompaktmodus.
 */
import { Link } from 'react-router'
import {
  doneVia,
  isModuleSkipped,
  isOpenedBySkip,
  moduleState,
  placeableModules,
  relockModule,
} from '../../core/progress/progress'
import { useApp } from '../../state/store'
import { content } from '../../ui/run'
import { CompactField } from '../profile/ProfileFields'

const DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })
const pct = (x: number) => `${Math.round(x * 100)} %`

export function FastTrackSection() {
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)
  const modules = placeableModules(content)

  return (
    <section id="weg-fuer-erfahrene" className="rounded-xl border border-line bg-panel p-5">
      <h3 className="mb-1 font-semibold">Einstufung &amp; Abkürzungen</h3>
      <p className="mb-3 text-sm text-muted">
        Für alle, die die Grundlagen schon kennen: Jeder Einstufungstest geht jederzeit und beliebig
        oft – bestanden bleibt bestanden, und das Modul gilt als erledigt.
      </p>
      <ul className="divide-y divide-line/60">
        {modules.map((m) => {
          const state = moduleState(content, progress, m.id)
          const r = progress.placements?.[m.id]
          const unlocked = isOpenedBySkip(content, progress, m.id)
          let status: string
          if (r?.passed)
            status = `bestanden${r.passedAt ? ` am ${DATE.format(new Date(r.passedAt))}` : ''} · bestes Ergebnis ${pct(r.bestScore ?? r.score)}`
          else if (r)
            status = `noch nicht bestanden · zuletzt ${pct(r.score)}${r.attempts && r.attempts > 1 ? ` · ${r.attempts} Versuche` : ''}`
          else if (state === 'done') status = doneVia(m, progress) === 'exam' ? 'per Modulprüfung erledigt' : 'per Lektionen erledigt'
          else status = 'noch kein Test'
          const extra =
            state === 'locked'
              ? 'gesperrt'
              : isModuleSkipped(content, progress, m.id)
                ? 'übersprungen'
                : unlocked
                  ? 'direkt freigeschaltet'
                  : ''
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  Modul {m.code}: {m.title}
                </div>
                <div className="text-xs text-muted">
                  {status}
                  {extra && ` · ${extra}`}
                </div>
              </div>
              {unlocked && (
                <button
                  onClick={() => setProgress(relockModule(progress, m.id))}
                  className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
                  title="Das Modul wird wieder gesperrt, bis das Modul davor erledigt ist. Gespielte Lektionen bleiben."
                >
                  Freischaltung zurücknehmen
                </button>
              )}
              <Link
                to={`/placement/${m.id}`}
                className="rounded-lg border border-line px-3 py-1 text-sm text-text hover:border-phosphor-dim"
              >
                {r ? 'Test wiederholen' : 'Einstufungstest'}
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Gesperrte Module lassen sich im Ausbildungsweg auch direkt freischalten – sie zählen dann
        aber nicht als erledigt.
      </p>

      <div className="mt-4">
        <CompactField />
      </div>
    </section>
  )
}
