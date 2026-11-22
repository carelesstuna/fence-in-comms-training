import { useState } from 'react'
import { SIMS, type Sim } from '../../core/content/schema'
import { aircraftByEra, FLYING_SIMS } from '../../core/content/aircraft'
import { createRng, newSeed } from '../../core/random/rng'
import { useApp } from '../../state/store'
import { ERA_LABELS, SIM_LABELS, SIM_SHORT } from '../../ui/labels'
import { content } from '../../ui/run'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function Chip({ on, onClick, title, children }: { on: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`rounded-lg border px-3 py-2 text-sm transition ${on ? 'border-phosphor bg-phosphor/10 text-phosphor' : 'border-line bg-panel-2 text-muted hover:text-text'}`}
    >
      {on ? '✓ ' : ''}
      {children}
    </button>
  )
}

/** Flugzeugauswahl, gruppiert nach Epoche und gefiltert nach den gewählten Sims. */
function AircraftFields() {
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const [showAll, setShowAll] = useState(false)
  const types = content.aircraftTypes
  const groups = aircraftByEra(types, { sims: profile.sims, selected: profile.aircraft, showAll })
  const shown = groups.reduce((n, g) => n + g.items.length, 0)
  const filtered = profile.sims.some((s) => FLYING_SIMS.includes(s))
  return (
    <div>
      <h3 className="mb-2 font-semibold">Welche Flugzeuge fliegst du?</h3>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.era}>
            <h4 className="mb-1.5 text-xs font-semibold tracking-wider text-muted uppercase">{ERA_LABELS[g.era]}</h4>
            <div className="flex flex-wrap gap-2">
              {g.items.map((a) => (
                <Chip
                  key={a.id}
                  on={profile.aircraft.includes(a.id)}
                  onClick={() => setProfile({ aircraft: toggle(profile.aircraft, a.id) })}
                  title={a.group ? a.note : [...a.radios, a.note].filter(Boolean).join(' · ') || undefined}
                >
                  {a.label}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {a.sims
                      .filter((s) => FLYING_SIMS.includes(s))
                      .map((s) => SIM_SHORT[s])
                      .join('·')}
                  </span>
                </Chip>
              ))}
            </div>
            {g.items
              .filter((a) => a.group && a.note)
              .map((a) => (
                <p key={a.id} className="mt-1 text-xs text-muted">
                  {a.label}: {a.note}
                </p>
              ))}
          </div>
        ))}
      </div>
      {filtered && (showAll || shown < types.length) && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="accent-[#7dd87d]" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Auch Muster anderer Sims zeigen{!showAll && ` (${types.length - shown} weitere)`}
        </label>
      )}
      <p className="mt-2 text-sm text-muted">
        Kästen zu deinen Flugzeugen und ihrer Epoche werden in den Lektionen aufgeklappt. Ohne Auswahl sind alle offen.
      </p>
    </div>
  )
}

export function SimFields() {
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-semibold">Welche Sims nutzt du?</h3>
        <div className="flex flex-wrap gap-2">
          {SIMS.map((s: Sim) => (
            <Chip key={s} on={profile.sims.includes(s)} onClick={() => setProfile({ sims: toggle(profile.sims, s) })}>
              {SIM_LABELS[s]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">Hinweise zu deinen Sims werden in den Lektionen aufgeklappt, alle anderen bleiben einklappbar sichtbar.</p>
        {SIMS.includes('srs') && (
          <p className="mt-1 text-sm text-muted">
            <b className="font-semibold text-text/90">{SIM_LABELS.srs}</b> ist kein Flugsimulator, sondern ein Funkprogramm, mit dem auf vielen
            DCS-Multiplayer-Servern gefunkt wird. Nicht sicher? Lass es an.
          </p>
        )}
      </div>
      <AircraftFields />
    </div>
  )
}

/** Kompaktmodus für Lektionen – im Profil und schon im Onboarding (U1-09). */
export function CompactField({ note = 'Gilt ab dem nächsten Lektionsstart.' }: { note?: string }) {
  const compact = useApp((s) => !!s.profile.compact)
  const setProfile = useApp((s) => s.setProfile)
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
      <input type="checkbox" className="mt-1 accent-[#7dd87d]" checked={compact} onChange={() => setProfile({ compact: !compact })} />
      <span>
        <span className="font-semibold">Kompaktmodus für Lektionen</span>
        <span className="block text-sm text-muted">
          Leseseiten werden eingeklappt und hängen an der nächsten Übung – zum Aufklappen, wenn du etwas nachlesen willst. Übungen und Szenarien
          bleiben vollständig. {note}
        </span>
      </span>
    </label>
  )
}

/** Phraseologie der Lotsen: immer US-Form (Standard) oder je nach Karte. */
export function PhraseologyField() {
  const setting = useApp((s) => s.profile.phraseology)
  const setProfile = useApp((s) => s.setProfile)
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
        <input type="radio" name="phraseology" className="mt-1 accent-[#7dd87d]" checked={setting !== 'map'} onChange={() => setProfile({ phraseology: 'us' })} />
        <span>
          <span className="font-semibold">Immer US-Form (FAA)</span> <span className="text-xs text-phosphor">Standard</span>
          <span className="block text-sm text-muted">
            „altimeter“ in inHg, „descend and maintain …“, Sicht in Meilen – so funkt man in den meisten Sim-Staffeln, auch auf Karten außerhalb
            der USA.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
        <input type="radio" name="phraseology" className="mt-1 accent-[#7dd87d]" checked={setting === 'map'} onChange={() => setProfile({ phraseology: 'map' })} />
        <span>
          <span className="font-semibold">Kartenabhängig</span> <span className="text-xs text-muted">realistischer</span>
          <span className="block text-sm text-muted">
            An Plätzen in Georgien und am Golf nach ICAO: „QNH“ in hPa, „descend to …“, Sicht in km. In Nevada, auf Guam und in Korea die
            US-Form.
          </span>
        </span>
      </label>
      <p className="text-sm text-muted">
        Liest du die jeweils andere Form zurück, zählt das als richtig, aber nicht voll. Mindesthöhen richten sich immer nach dem Platz. Gilt ab
        der nächsten Lektion oder Übung.
      </p>
    </div>
  )
}

export function CallsignFields() {
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const names = [...new Set([...(content.callsigns.fighter ?? []), ...(content.callsigns.attack ?? [])])].sort()
  const roll = () => {
    const rng = createRng(newSeed())
    setProfile({ callsignName: rng.pick(names), flightNum: rng.int(1, 9) })
  }
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
        <input type="radio" className="mt-1 accent-[#7dd87d]" checked={profile.randomCallsign} onChange={() => setProfile({ randomCallsign: true })} />
        <span>
          <span className="font-semibold">Bei jeder Übung neu würfeln</span> <span className="text-xs text-phosphor">empfohlen</span>
          <span className="block text-sm text-muted">
            Du bist mal Uzi 3-1, mal Hawg 7-1 – so gewöhnst du dich an wechselnde Rufzeichen wie im Multiplayer. „3-1“ heißt: Flight 3, Position 1
            (der Lead); mehr dazu in Modul 1.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
        <input type="radio" className="mt-1 accent-[#7dd87d]" checked={!profile.randomCallsign} onChange={() => setProfile({ randomCallsign: false })} />
        <span className="flex-1">
          <span className="font-semibold">Festes Rufzeichen</span>
          <span className="block text-sm text-muted">Zum Beispiel ein festes Rufzeichen aus dem Missionsbriefing.</span>
          {!profile.randomCallsign && (
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <input
                list="callsign-names"
                value={profile.callsignName}
                onChange={(e) => setProfile({ callsignName: e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 14) })}
                className="w-36 rounded-md border border-line bg-black/30 px-2 py-1 font-mono"
              />
              <datalist id="callsign-names">
                {names.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <select
                value={profile.flightNum}
                onChange={(e) => setProfile({ flightNum: Number(e.target.value) })}
                className="rounded-md border border-line bg-black/30 px-2 py-1 font-mono"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="font-mono text-amber-hud">
                → {profile.callsignName || '…'} {profile.flightNum}-1
              </span>
              <button type="button" onClick={roll} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-text">
                ⟳ würfeln
              </button>
            </span>
          )}
        </span>
      </label>
    </div>
  )
}
