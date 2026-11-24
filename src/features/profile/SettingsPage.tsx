/**
 * Einstellungen in drei Reitern: Flugprofil (Sims, Flugzeuge, Rufzeichen, Phraseologie), Hören (Sprachausgabe,
 * Empfang) und Sprechen (Mikrofon, Erkennung). Der Reiter steht in der Adresse: /einstellungen/hoeren.
 */
import { Link, NavLink, useParams } from 'react-router'
import { CallsignFields, PhraseologyField, SimFields } from './ProfileFields'
import { SpeechSettings } from './SpeechSettings'
import { AudioSettings } from './AudioSettings'

const TABS = [
  { id: 'flugprofil', label: 'Flugprofil' },
  { id: 'hoeren', label: 'Hören' },
  { id: 'sprechen', label: 'Sprechen' },
] as const
type Tab = (typeof TABS)[number]['id']

export function SettingsPage() {
  const { tab: raw } = useParams()
  const tab: Tab = TABS.some((t) => t.id === raw) ? (raw as Tab) : 'flugprofil'
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Einstellungen</h1>
      <nav className="flex flex-wrap gap-1 border-b border-line" aria-label="Bereiche der Einstellungen">
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={`/einstellungen/${t.id}`}
            className={() =>
              `-mb-px rounded-t-md border px-3 py-1.5 text-sm ${
                t.id === tab ? 'border-line border-b-ink bg-panel text-phosphor' : 'border-transparent text-muted hover:text-text'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      {tab === 'flugprofil' && (
        <>
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
        </>
      )}
      {tab === 'hoeren' && <AudioSettings />}
      {tab === 'sprechen' && <SpeechSettings />}
      <p className="text-sm text-muted">
        <Link to="/lizenzen" className="underline hover:text-text">
          Lizenzen und rechtliche Hinweise
        </Link>
      </p>
    </div>
  )
}
