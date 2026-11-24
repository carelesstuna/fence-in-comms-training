/**
 * Onboarding-Schritt „Hören & Sprechen“: gleich beim ersten Start entscheiden, ob die Gegenstellen sprechen
 * (Sprachausgabe laden und anhören) und ob man selbst spricht (Modell laden, Mikrofon wählen und testen).
 * Beides ist freiwillig und später im Profil änderbar. Ohne Download bleibt alles als Text lösbar; ins
 * Internet geht die App nur auf Klick. Laufende Downloads gehen weiter, wenn man weiterklickt.
 */
import { useState, type ReactNode } from 'react'
import type { ResolvedTransmission } from '../../core/drills/types'
import { keyLabel } from '../../core/speech/flow'
import { useApp, type AudioSettings } from '../../state/store'
import { useRadioAudio } from '../../platform/audio-context'
import { useAsrDownload } from '../../platform/asr-download'
import { isTauri, useSpeech } from '../../platform/speech-context'
import { modelInfo } from '../../platform/transformers-config'
import { TTS_DOWNLOAD_MB } from '../../platform/tts-config'
import { whisperModel } from '../../platform/whisper-config'
import { AudioSetup, ExchangeAudio } from '../../components/audio/ExchangeAudio'
import { TransmissionLine } from '../../components/CallAnatomy'
import { DesktopModel, MicField, MicTest } from '../profile/SpeechSettings'
import { setSpeech, useMicList } from '../profile/speech-settings'

/** Hörprobe: Funk (AM) und Intercom. */
const PROBE: readonly ResolvedTransmission[] = [
  {
    speaker: 'Kutaisi Tower',
    you: false,
    channel: 'radio',
    segments: [{ text: 'Viper one one, runway two five, wind two seven zero at one two, cleared for takeoff', role: 'info' }],
  },
  {
    speaker: 'Crew Chief',
    you: false,
    channel: 'intercom',
    segments: [{ text: 'Loud and clear. Chocks in, fire guard posted, cleared to start', role: 'info' }],
  },
]

const setAudio = (patch: Partial<AudioSettings>) => useApp.getState().setProfile({ audio: { ...useApp.getState().profile.audio, ...patch } })

export function VoiceStep() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-xl font-semibold text-white">Hören und sprechen</h2>
        <p className="text-sm text-muted">
          Beides ist freiwillig: Ohne Download bleibt jede Übung als Text lösbar. Alles läuft offline auf diesem Rechner – ins Internet geht die
          App nur, wenn du hier auf „Laden“ klickst. Ändern kannst du alles später unter Einstellungen → Hören und Sprechen.
        </p>
      </div>
      <ListenPart />
      <SpeakPart />
      <p className="text-xs text-muted">Ein laufender Download geht weiter, wenn du schon auf „Weiter“ klickst.</p>
    </div>
  )
}

function Part({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-line bg-panel-2 p-4">
      <h3 className="font-semibold">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      {children}
    </section>
  )
}

function Choice({ name, value, options, onChange }: { name: string; value: boolean; options: [string, string]; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm" role="radiogroup" aria-label={name}>
      {([true, false] as const).map((v, i) => (
        <label
          key={String(v)}
          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 ${value === v ? 'border-phosphor bg-phosphor/5' : 'border-line'}`}
        >
          <input type="radio" name={name} className="accent-[#7dd87d]" checked={value === v} onChange={() => onChange(v)} />
          {options[i]}
        </label>
      ))}
    </div>
  )
}

/** Gegenstellen hören: Sprachausgabe einschalten, laden und anhören. */
function ListenPart() {
  const enabled = useApp((s) => s.profile.audio.enabled)
  const audio = useRadioAudio()
  const asr = useAsrDownload()
  const asrLabel = asr.running ? (whisperModel(asr.running.modelId)?.label ?? asr.running.modelId) : null
  return (
    <Part icon="🔊" title="Gegenstellen hören">
      <p className="text-sm text-muted">
        Tower, AWACS, JTAC, Wingman und Crew Chief sprechen ihre Funksprüche – mit Funkklang und je eigener Stimme. Dafür lädt die App
        einmalig die Sprachausgabe ({TTS_DOWNLOAD_MB} MB).
      </p>
      <Choice name="Gegenstellen hören" value={enabled} options={['Ja, Funksprüche hören', 'Nein, nur lesen']} onChange={(v) => setAudio({ enabled: v })} />
      {enabled && audio.files === 'checking' && <p className="text-sm text-muted">Sprachausgabe wird geprüft …</p>}
      {enabled && audio.files === 'missing' && (
        <AudioSetup compact blocked={asrLabel ? `Erst wenn ${asrLabel} fertig geladen ist – es lädt immer nur eins.` : undefined} />
      )}
      {enabled && audio.files === 'present' && (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="text-emerald-300">✓ Sprachausgabe geladen.</span>{' '}
            <span className="text-muted">Hör mal rein – mit ▶ an der Zeile:</span>
          </p>
          <div className="rounded-lg border border-line bg-black/20 px-3 py-3">
            <ExchangeAudio transmissions={PROBE} cast="onboarding-hoerprobe">
              <div className="space-y-2">
                {PROBE.map((t, i) => (
                  <TransmissionLine key={i} t={t} neutral />
                ))}
              </div>
            </ExchangeAudio>
          </div>
          <p className="text-xs text-muted">Lautstärke, Tempo und Empfang stellst du unter Einstellungen → Hören ein.</p>
          {audio.error && <p className="text-sm text-red-300">{audio.error}</p>}
        </div>
      )}
    </Part>
  )
}

/** Selbst sprechen: Eingabe wählen, Modell laden, Mikrofon wählen und testen. */
function SpeakPart() {
  const s = useApp((st) => st.profile.speech)
  const speak = s.input === 'speak'
  const speech = useSpeech()
  const audio = useRadioAudio()
  const micList = useMicList(s.input === 'speak')
  const [testing, setTesting] = useState(false)
  const desktop = isTauri()
  const key = keyLabel(s.pttKey)
  const browserModel = modelInfo(s.model)
  const blocked = audio.download ? 'Erst wenn die Sprachausgabe fertig geladen ist – es lädt immer nur eins.' : undefined
  // Fehlt das Modell noch, gibt es nichts zu testen
  const canTest = !(speech.status === 'error' && speech.missingModel)
  return (
    <Part icon="🎙" title="Selbst funken">
      <p className="text-sm text-muted">
        Deine eigenen Funksprüche sprichst du, statt sie zu tippen: {key} halten, sprechen, nach dem letzten Wort loslassen. Die Erkennung
        (Whisper) läuft auf diesem Rechner, Aufnahmen werden nicht gespeichert. Tippen geht in jeder Übung trotzdem.
      </p>
      <p className="text-xs text-muted">
        Bekannte Grenze: Die Erkennung schreibt Zahlen als Ziffern. Ob du „three five zero“ oder „three hundred fifty“ sagst, kann die
        App deshalb nicht unterscheiden – beides zählt. Sprich trotzdem Ziffer für Ziffer, so wie im Funk.
      </p>
      <Choice name="Selbst funken" value={speak} options={['Ja, Funksprüche sprechen', 'Nein, tippen']} onChange={(v) => setSpeech({ input: v ? 'speak' : 'type' })} />
      {speak && (
        <div className="grid gap-3 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start">
          <span className="text-muted sm:pt-1">Modell</span>
          {desktop ? (
            <DesktopModel settings={s} set={setSpeech} compact blocked={blocked} />
          ) : (
            <p className="sm:pt-1">
              {browserModel?.label ?? s.model}
              <span className="text-muted">
                {' '}
                – im Browser liefert es der Dev-Server (<code>npm run fetch-asr</code>).
              </span>
            </p>
          )}

          <span className="text-muted sm:pt-1">Mikrofon</span>
          <MicField settings={s} list={micList} />

          <span className="text-muted sm:pt-1">Test</span>
          <div>
            {!canTest ? (
              <p className="text-muted sm:pt-1">Sobald das Modell geladen ist, kannst du hier ausprobieren, was die Erkennung versteht.</p>
            ) : !testing ? (
              <button className="rounded-lg border border-line px-3 py-1.5 hover:border-phosphor" onClick={() => setTesting(true)}>
                🎙 Mikrofon testen
              </button>
            ) : (
              <MicTest settings={s} onOpened={micList.refresh} onClose={() => setTesting(false)} />
            )}
            {speech.status === 'error' && !speech.missingModel && <p className="mt-1 text-red-300">{speech.error}</p>}
          </div>
        </div>
      )}
    </Part>
  )
}
