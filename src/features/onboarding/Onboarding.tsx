import { useState } from 'react'
import { useNavigate } from 'react-router'
import { placeableModules } from '../../core/progress/progress'
import { useApp } from '../../state/store'
import { LEGAL_SHORT } from '../../ui/legal'
import { content } from '../../ui/run'
import { CallsignFields, CompactField, SimFields } from '../profile/ProfileFields'
import { VoiceStep } from './VoiceStep'

const STEPS = ['Willkommen', 'Sims & Flugzeuge', 'Rufzeichen', 'Hören & Sprechen', 'Einstufung'] as const

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [known, setKnown] = useState<string[]>([])
  const finishOnboarding = useApp((s) => s.finishOnboarding)
  const navigate = useNavigate()
  const placeable = placeableModules(content)

  const finish = () => {
    finishOnboarding()
    if (known.length) navigate(`/placement/${known[0]}?next=${known.slice(1).join(',')}`)
    else navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-phosphor' : 'bg-white/10'}`} />
            <div className={`mt-1 text-[11px] ${i === step ? 'text-phosphor' : 'text-muted'}`}>{s}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-panel p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div className="font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">Willkommen an Bord</div>
            <h1 className="text-2xl font-semibold text-white">Funken wie ein echter Kampfpilot.</h1>
            <p>
              Fence In Comms Training bringt dir militärischen Flugfunk bei – vom ersten Radio Check über Bodencrew und Tower bis zu Formationsfunk und
              AWACS, dazu eigene Spuren für Luftnahunterstützung mit JTAC und für Warbirds und den Kalten Krieg. Träger und Tanker sind in
              Vorbereitung. Erklärt auf Deutsch,
              gefunkt im englischen Original.
            </p>
            <ul className="space-y-1.5 text-[0.95rem]">
              <li>
                <span className="text-phosphor">▸</span> Jeder Funkspruch wird <b>zerlegt und erklärt</b> – du siehst, wofür jeder Satzteil da ist.
              </li>
              <li>
                <span className="text-phosphor">▸</span> Theorie und Praxis wechseln sich ab, dazwischen Wissen aus Technik, Physik und Geschichte.
              </li>
              <li>
                <span className="text-phosphor">▸</span> Rufzeichen, Flugplätze und Zahlen werden <b>jedes Mal neu gewürfelt</b>.
              </li>
              <li>
                <span className="text-phosphor">▸</span> Gilt für alle Sims – Details zu DCS, BMS, IL-2 und SRS bekommst du dort, wo sie wichtig sind.
              </li>
            </ul>
            <p className="text-xs text-muted">{LEGAL_SHORT} Mehr dazu unter Einstellungen → Lizenzen und rechtliche Hinweise.</p>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">Womit fliegst du?</h2>
            <SimFields />
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="mb-1 text-xl font-semibold text-white">Dein Rufzeichen</h2>
            <p className="mb-4 text-sm text-muted">Das kannst du später unter Einstellungen → Flugprofil jederzeit ändern.</p>
            <CallsignFields />
          </div>
        )}
        {step === 3 && <VoiceStep />}
        {step === 4 && (
          <div>
            <h2 className="mb-1 text-xl font-semibold text-white">Was kannst du schon?</h2>
            <p className="mb-4 text-sm text-muted">
              Markiere, was du schon sicher beherrschst. Du machst dann einen kurzen Einstufungstest – wer besteht, überspringt das Modul.
            </p>
            <div className="space-y-2">
              {placeable.map((m) => {
                const on = known.includes(m.id)
                return (
                  <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${on ? 'border-phosphor bg-phosphor/5' : 'border-line bg-panel-2'}`}>
                    <input
                      type="checkbox"
                      className="mt-1 accent-[#7dd87d]"
                      checked={on}
                      onChange={() => setKnown(on ? known.filter((k) => k !== m.id) : [...known, m.id])}
                    />
                    <span>
                      <span className="font-semibold">
                        Modul {m.code}: {m.title}
                      </span>
                      <span className="block text-sm text-muted">{m.subtitle}</span>
                    </span>
                  </label>
                )
              })}
              {placeable.length === 0 && <p className="text-muted">Noch keine Einstufungstests verfügbar.</p>}
            </div>
            <p className="mt-3 text-sm text-muted">
              Nichts markiert? Dann startest du ganz vorne – auch gut. Jeder Einstufungstest lässt sich später jederzeit im Ausbildungsweg oder unter
              Fortschritt machen und wiederholen.
            </p>
            <h3 className="mt-5 mb-2 font-semibold">Lieber kurz und praktisch?</h3>
            <CompactField note="Lässt sich unter Fortschritt jederzeit wieder ausschalten." />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <button onClick={() => setStep(step - 1)} className={`rounded-lg px-3 py-2 text-muted hover:text-text ${step === 0 ? 'invisible' : ''}`}>
          ← Zurück
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="rounded-lg bg-phosphor px-5 py-2 font-semibold text-ink">
            Weiter →
          </button>
        ) : (
          <button onClick={finish} className="rounded-lg bg-phosphor px-5 py-2 font-semibold text-ink">
            {known.length ? 'Einstufung starten →' : 'Los geht’s →'}
          </button>
        )}
      </div>
    </div>
  )
}
