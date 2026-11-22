import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useApp } from '../state/store'
import { checkrideStatus, rankFor } from '../core/progress/progress'
import { currentStreak } from '../core/progress/review'
import { AchievementToasts } from './Achievements'
import { content } from '../ui/run'

export function RankBar({ compact = false }: { compact?: boolean }) {
  const p = useApp((s) => s.progress)
  const xp = p.xp
  const { current, next, progress, checkrideDue } = rankFor(content, p)
  // „Jetzt fehlt nur noch der Checkride“ nur, wenn er wirklich offen ist – sonst sagen, was fehlt
  const status = next && checkrideDue ? checkrideStatus(content, p, next.id) : null
  const ready = status?.state === 'available'
  if (compact) {
    const streak = currentStreak(p.daily, new Date())
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs whitespace-nowrap">
        {streak > 0 && (
          <span className="text-amber-hud" title={`Funk-Drill: ${streak} ${streak === 1 ? 'Tag' : 'Tage'} in Folge`}>
            🔥 {streak}
          </span>
        )}
        <span className="font-semibold text-amber-hud">{current.name}</span>
        <span className="font-mono text-muted">{xp} XP</span>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Dienstgrad</div>
          <div className="text-xl font-semibold text-amber-hud">{current.name}</div>
        </div>
        <div className="text-right font-mono text-sm text-muted">
          <div>
            {xp} XP{next && !checkrideDue && <span> / {next.xp}</span>}
          </div>
          {content.achievements.length > 0 && (
            <Link to="/profile" className="text-xs hover:text-amber-hud" title="Abzeichen ansehen">
              🏅 {Object.keys(p.achievements ?? {}).filter((id) => content.achievements.some((a) => a.id === id)).length}/
              {content.achievements.length}
            </Link>
          )}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-amber-hud transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {current.description}
        {next && !checkrideDue && (
          <>
            {' '}
            Nächster Rang: <span className="text-text">{next.name}</span>
            {next.checkride ? ' – mit Checkride' : ''}.
          </>
        )}
        {next && checkrideDue && ready && (
          <>
            {' '}
            Die XP für <span className="text-text">{next.name}</span> hast du – jetzt fehlt nur noch der{' '}
            <Link to={`/checkride/${next.id}`} className="text-amber-hud underline-offset-2 hover:underline">
              Checkride
            </Link>
            .
          </>
        )}
        {next && checkrideDue && !ready && (
          <>
            {' '}
            Die XP für <span className="text-text">{next.name}</span> hast du. Für den Checkride fehlt noch: {status?.missing.join(', ')}.
          </>
        )}
      </p>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const nav = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2.5 py-1.5 text-sm transition ${isActive ? 'bg-phosphor/10 text-phosphor' : 'text-muted hover:text-text'}`
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="hidden font-mono text-sm font-semibold tracking-[0.14em] whitespace-nowrap text-phosphor md:inline">FENCE IN COMMS TRAINING</span>
          </Link>
          <nav className="ml-2 flex gap-1">
            <NavLink to="/" end className={nav}>
              Ausbildung
            </NavLink>
            <NavLink to="/hangar" className={nav}>
              Hangar
            </NavLink>
            <NavLink to="/glossary" className={nav}>
              Glossar
            </NavLink>
            <NavLink to="/profile" className={nav}>
              Profil
            </NavLink>
          </nav>
          <div className="ml-auto">
            <RankBar compact />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <AchievementToasts />
    </div>
  )
}
