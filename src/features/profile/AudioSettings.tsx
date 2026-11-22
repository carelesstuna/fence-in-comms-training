/**
 * Einstellungen fürs Hören: Gegenstellen sprechen lassen (Sprachausgabe einmalig laden), Lautstärke, Tempo,
 * Empfang, automatisch abspielen, Text immer zeigen – dazu Hörproben für AM, FM und Intercom.
 */
import type { ResolvedTransmission } from '../../core/drills/types'
import { useApp, type AudioSettings as Settings } from '../../state/store'
import { useRadioAudio } from '../../platform/audio-context'
import { TTS_DOWNLOAD_MB, VOICES } from '../../platform/tts-config'
import { isTauri } from '../../platform/speech-context'
import { openModelDir } from '../../platform/whisper-recognizer'
import { AudioSetup, ExchangeAudio } from '../../components/audio/ExchangeAudio'
import { TransmissionLine } from '../../components/CallAnatomy'

const line = (
  speaker: string,
  text: string,
  extra: Partial<ResolvedTransmission> = {},
): ResolvedTransmission => ({
  speaker,
  you: false,
  channel: 'radio',
  segments: [{ text, role: 'info' }],
  ...extra,
})

/** Hörproben: je ein Klang. */
function samples(): ResolvedTransmission[] {
  return [
    line(
      'Kutaisi Tower',
      'Viper one one, runway two five, wind two seven zero at one two, cleared for takeoff',
    ),
    line(
      'Darkstar',
      'Viper one one, single group, BRAA two seven zero, forty-five, twenty-five thousand, hot, hostile',
    ),
    line(
      'JTAC',
      'Hawg one one, type two control, bomb on coordinate, advise when ready for nine line',
      { radio: 'fm' },
    ),
    line('Crew Chief', 'Loud and clear. Chocks in, fire guard posted, cleared to start', {
      channel: 'intercom',
    }),
    line('zwei Stationen gleichzeitig', '[Pfeifton und Wortfetzen]'),
    line('Viper 1-1', 'Kutaisi Tower, Viper one one, request taxi', { you: true }),
  ]
}

const PROBE = samples()

const SIGNAL: { id: Settings['signal']; label: string }[] = [
  { id: 'good', label: 'gut (fünf auf fünf)' },
  { id: 'fair', label: 'mittel' },
  { id: 'weak', label: 'schwach, verrauscht' },
]

export function AudioSettings() {
  const s = useApp((st) => st.profile.audio)
  const set = (patch: Partial<Settings>) =>
    useApp.getState().setProfile({ audio: { ...useApp.getState().profile.audio, ...patch } })
  const audio = useRadioAudio()
  const probe = PROBE
  const desktop = isTauri()

  return (
    <section
      className="space-y-4 rounded-xl border border-line bg-panel p-5"
      aria-labelledby="hoeren"
    >
      <div>
        <h3 id="hoeren" className="font-semibold">
          Hören
        </h3>
        <p className="mt-1 text-sm text-muted">
          Tower, AWACS, JTAC, Wingman und Crew Chief sprechen ihre Funksprüche – mit Funkklang
          (UHF/VHF-AM, FM beim JTAC, trocken über Intercom) und je eigener Stimme. Ohne Ton bleibt
          alles als Text lösbar.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
        />
        Gegenstellen hörbar machen
      </label>

      {s.enabled && (
        <>
          <div className="text-sm">
            <span className="text-muted">Sprachausgabe: </span>
            {audio.files === 'checking' && <span className="text-muted">wird geprüft …</span>}
            {audio.files === 'present' && (
              <span>
                <span className="text-emerald-300">✓ geladen</span> – Kokoro-82M mit {VOICES.length}{' '}
                Stimmen (US und GB)
                {audio.engine === 'loading' && (
                  <span className="text-muted">
                    {' '}
                    · startet … {Math.round(audio.progress * 100)} %
                  </span>
                )}
                {audio.engine === 'ready' && (
                  <span className="text-muted"> · bereit, rechnet auf der CPU</span>
                )}
                {audio.rtf > 0 && (
                  <span className="text-muted">
                    {' '}
                    · {audio.rtf.toFixed(2).replace('.', ',')} s Rechenzeit pro Sekunde Sprache
                  </span>
                )}
              </span>
            )}
            {audio.files === 'missing' && (
              <span className="text-amber-hud">noch nicht geladen</span>
            )}
          </div>
          {audio.files === 'missing' && <AudioSetup compact />}
          {audio.files === 'present' && audio.storeKind === 'browser' && (
            <button
              type="button"
              onClick={() => void audio.removeFiles()}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text"
            >
              Aus dem Browser entfernen ({TTS_DOWNLOAD_MB} MB)
            </button>
          )}
          {desktop && (
            <button
              type="button"
              onClick={() => void openModelDir()}
              className="ml-2 rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text"
            >
              Modell-Ordner öffnen
            </button>
          )}
          {audio.error && audio.files === 'present' && (
            <p className="text-sm text-red-300">{audio.error}</p>
          )}

          <div className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr] sm:items-center">
            <label htmlFor="audio-volume" className="text-muted">
              Lautstärke
            </label>
            <div className="flex items-center gap-3">
              <input
                id="audio-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={s.volume}
                onChange={(e) => set({ volume: Number(e.target.value) })}
                className="w-48"
              />
              <span className="w-12 font-mono text-xs text-muted">
                {Math.round(s.volume * 100)} %
              </span>
            </div>

            <label htmlFor="audio-tempo" className="text-muted">
              Tempo
            </label>
            <div className="flex items-center gap-3">
              <input
                id="audio-tempo"
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={s.tempo}
                onChange={(e) => set({ tempo: Number(e.target.value) })}
                className="w-48"
              />
              <span className="w-24 font-mono text-xs text-muted">
                {s.tempo < 0.97 ? 'langsamer' : s.tempo > 1.03 ? 'schneller' : 'normal'} (
                {s.tempo.toFixed(2).replace('.', ',')})
              </span>
            </div>

            <span className="text-muted">Empfang</span>
            <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Empfang">
              {SIGNAL.map((o) => (
                <label key={o.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audio-signal"
                    checked={s.signal === o.id}
                    onChange={() => set({ signal: o.id })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={s.autoplay}
                onChange={(e) => set({ autoplay: e.target.checked })}
              />
              <span>Funksprüche im Szenario sofort abspielen, wenn sie kommen</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={s.alwaysText}
                onChange={(e) => set({ alwaysText: e.target.checked })}
              />
              <span>
                Text immer gleich zeigen
                <span className="block text-muted">
                  Sonst erscheint er in Hörübungen und im Szenario erst, wenn du den Funkspruch
                  gehört hast.
                </span>
              </span>
            </label>
          </div>

          {audio.files === 'present' && (
            <div className="rounded-lg border border-line bg-black/20 px-3 py-3">
              <div className="mb-2 text-sm text-muted">
                Hörproben – AM, FM, Intercom, zwei Sender gleichzeitig („blocked“), dein eigener
                Funkspruch:
              </div>
              <ExchangeAudio transmissions={probe} cast="profil-hoerprobe">
                <div className="space-y-2">
                  {probe.map((t, i) => (
                    <TransmissionLine key={i} t={t} neutral />
                  ))}
                </div>
              </ExchangeAudio>
            </div>
          )}
        </>
      )}
    </section>
  )
}
