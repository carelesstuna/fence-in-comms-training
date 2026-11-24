/**
 * Fortschritt: Abzeichen, Lektionen und XP, Einstufung und Abkürzungen, Fortschritt sichern oder übertragen und
 * zurücksetzen. Die Einstellungen (Flugprofil, Hören, Sprechen) stehen auf einer eigenen Seite.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { mirrorLocation } from '../../platform/desktop'
import { useApp } from '../../state/store'
import { AchievementList } from '../../components/Achievements'
import { FastTrackSection } from '../path/FastTrackSection'
import { ProgressTransfer } from './ProgressTransfer'

export function ProgressPage() {
  const resetAll = useApp((s) => s.resetAll)
  const progress = useApp((s) => s.progress)
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [mirror, setMirror] = useState<string | null>(null)
  useEffect(() => {
    void mirrorLocation().then(setMirror)
  }, [])
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Fortschritt</h1>
      <section className="rounded-xl border border-line bg-panel p-5">
        <h3 className="mb-1 font-semibold">Stand</h3>
        <p className="text-sm text-muted">
          {Object.keys(progress.lessons).length} Lektionen abgeschlossen, {progress.xp} XP.{' '}
          {mirror ? (
            <>
              Gespeichert in der App und zusätzlich als Datei: <span className="font-mono text-xs break-all">{mirror}</span>
            </>
          ) : (
            'Der Fortschritt wird nur in diesem Browser gespeichert.'
          )}
        </p>
      </section>
      <section id="abzeichen" className="rounded-xl border border-line bg-panel p-5">
        <AchievementList />
      </section>
      <FastTrackSection />
      <ProgressTransfer />
      <section className="rounded-xl border border-red-400/20 bg-panel p-5">
        <h3 className="mb-1 font-semibold">Neu anfangen</h3>
        <p className="text-sm text-muted">Löscht Fortschritt, XP, Abzeichen und alle Einstellungen.</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="mt-3 rounded-lg border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10">
            Alles zurücksetzen …
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm">Fortschritt, XP und Profil wirklich löschen? Das lässt sich nicht rückgängig machen.</span>
            <button
              onClick={() => {
                resetAll()
                navigate('/start')
              }}
              className="rounded-lg bg-red-500/80 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Ja, zurücksetzen
            </button>
            <button onClick={() => setConfirm(false)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
              Abbrechen
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
