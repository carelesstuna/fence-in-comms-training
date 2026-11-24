/**
 * Abzeichen: Meldung bei neu erreichten Abzeichen und die Übersicht im Profil.
 */
import { useEffect } from 'react'
import { Link } from 'react-router'
import { ruleProgress } from '../core/progress/achievements'
import { useApp } from '../state/store'
import { content } from '../ui/run'

const SHOW_MS = 6000

/** Unten rechts: „Abzeichen erreicht“. Mehrere auf einmal werden zusammengefasst. */
export function AchievementToasts() {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismissToast)
  useEffect(() => {
    if (toasts.length === 0) return
    const ids = [...toasts]
    const t = window.setTimeout(() => ids.forEach(dismiss), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [toasts, dismiss])
  if (toasts.length === 0) return null
  const items = toasts.map((id) => content.achievements.find((a) => a.id === id)).filter((a) => !!a)
  const many = items.length > 2
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {(many ? items.slice(0, 1) : items).map((a) => (
        <div key={a.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-amber-hud/60 bg-panel-2 px-4 py-3 shadow-2xl">
          <span className="text-3xl leading-none">{a.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Abzeichen erreicht</div>
            <div className="font-semibold text-white">{a.title}</div>
            <div className="text-sm text-muted">
              {many ? (
                <>
                  … und {items.length - 1} weitere.{' '}
                  <Link to="/fortschritt#abzeichen" className="text-phosphor hover:underline" onClick={() => items.forEach((x) => dismiss(x.id))}>
                    Alle ansehen
                  </Link>
                </>
              ) : (
                a.description
              )}
            </div>
          </div>
          <button
            onClick={() => (many ? items.forEach((x) => dismiss(x.id)) : dismiss(a.id))}
            className="text-muted hover:text-text"
            aria-label="Meldung schließen"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

/** Übersicht aller Abzeichen: erreichte farbig mit Datum, offene mit Fortschritt, geheime verdeckt. */
export function AchievementList() {
  const progress = useApp((s) => s.progress)
  const earned = progress.achievements ?? {}
  const list = content.achievements
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">Abzeichen</h3>
        <span className="font-mono text-sm text-muted">
          {list.filter((a) => earned[a.id]).length} / {list.length}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((a) => {
          const got = earned[a.id]
          const secret = a.hidden && !got
          const rp = got ? null : ruleProgress(content, progress, a.rule)
          return (
            <li key={a.id} className={`flex gap-3 rounded-lg border p-3 ${got ? 'border-amber-hud/50 bg-amber-hud/5' : 'border-line bg-black/10'}`}>
              <span className={`text-2xl leading-none ${got ? '' : 'opacity-30 grayscale'}`}>{secret ? '❔' : a.icon}</span>
              <div className="min-w-0">
                <div className={`font-semibold ${got ? 'text-white' : 'text-muted'}`}>{secret ? 'Geheimes Abzeichen' : a.title}</div>
                <div className="text-sm text-muted">{secret ? 'Wird verraten, sobald du es hast.' : a.description}</div>
                {got && <div className="mt-0.5 text-xs text-amber-hud">erreicht am {new Date(got.at).toLocaleDateString('de-DE')}</div>}
                {!secret && rp?.target !== undefined && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-phosphor/70" style={{ width: `${Math.round(((rp.current ?? 0) / rp.target) * 100)}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {rp.current} / {rp.target}
                    </span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
