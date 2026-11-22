import { useEffect, useState } from 'react'
import { mirrorLocation } from '../../platform/desktop'
import { Link, useNavigate } from 'react-router'
import { useApp } from '../../state/store'
import { CallsignFields, PhraseologyField, SimFields } from './ProfileFields'
import { AchievementList } from '../../components/Achievements'
import { FastTrackSection } from '../path/FastTrackSection'
import { ProgressTransfer } from './ProgressTransfer'
import { SpeechSettings } from './SpeechSettings'
import { AudioSettings } from './AudioSettings'

export function ProfilePage() {
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
      <h1 className="text-2xl font-semibold text-white">Profil</h1>
      <section id="abzeichen" className="rounded-xl border border-line bg-panel p-5">
        <AchievementList />
      </section>
      <section className="rounded-xl border border-line bg-panel p-5">
        <SimFields />
      </section>
      <section className="rounded-xl border border-line bg-panel p-5">
        <h3 className="mb-3 font-semibold">Rufzeichen</h3>
        <CallsignFields />
      </section>
      <section id="phraseologie" className="rounded-xl border border-line bg-panel p-5">
        <h3 className="mb-3 font-semibold">Phraseologie der Lotsen</h3>
        <PhraseologyField />
      </section>
      <AudioSettings />
      <SpeechSettings />
      <FastTrackSection />
      <ProgressTransfer />
      <section className="rounded-xl border border-line bg-panel p-5">
        <h3 className="mb-1 font-semibold">Fortschritt</h3>
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
      <p className="text-sm text-muted">
        <Link to="/lizenzen" className="underline hover:text-text">
          Lizenzen und rechtliche Hinweise
        </Link>
      </p>
    </div>
  )
}
