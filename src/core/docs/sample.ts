/**
 * Musterdokumente (::muster{doc=…}): gewürfelte Beispiele für Unterlagen, die in den Lektionen erklärt werden –
 * die eigene Zeile aus der ATO („Frag“), die Comm Card, ein Auszug aus den SPINS und aus einer SOP.
 *
 * Alles passt zum Durchlauf: eigenes Rufzeichen, Startplatz, Comm Plan und Rufzeichen von AWACS und Tanker kommen
 * aus denselben Würfeln wie in den Übungen. Es sind Lernbeispiele, keine Nachbildung echter Formulare.
 */
import type { AircraftType, VarSpec } from '../content/schema'
import { resolveVars, type ResolveEnv } from '../random/vars'
import type { Value } from '../random/template'

import type { SampleDocKind } from './kinds'
export { SAMPLE_DOCS, type SampleDocKind } from './kinds'

export interface SampleDocRow {
  label: string
  value: string
  /** Was der Eintrag bedeutet (Erklärung für Anfänger). */
  hint?: string
}

export interface SampleDoc {
  kind: SampleDocKind
  title: string
  /** Kopfzeile des Dokuments, z. B. Missionsnummer oder Einheit. */
  header: string
  rows: SampleDocRow[]
  /** Comm Card: Stationen in Reihenfolge. */
  stations?: { name: string; channel: string; freq: string }[]
}

const MISSIONS: Record<AircraftType['role'], { code: string; meaning: string }[]> = {
  fighter: [
    { code: 'DCA', meaning: 'Defensive Counter Air – eigenen Luftraum verteidigen (CAP)' },
    { code: 'SWEEP', meaning: 'Luftraum vor einem Angriff von gegnerischen Jägern freikämpfen' },
  ],
  multirole: [
    { code: 'DCA', meaning: 'Defensive Counter Air – eigenen Luftraum verteidigen (CAP)' },
    { code: 'CAS', meaning: 'Close Air Support – Luftnahunterstützung für Bodentruppen mit einem JTAC' },
    { code: 'SEAD', meaning: 'Suppression of Enemy Air Defenses – Flugabwehr niederhalten' },
  ],
  attack: [
    { code: 'CAS', meaning: 'Close Air Support – Luftnahunterstützung für Bodentruppen mit einem JTAC' },
    { code: 'AI', meaning: 'Air Interdiction – Nachschub und Reserven hinter der Front angreifen' },
  ],
  helicopter: [{ code: 'CAS', meaning: 'Close Air Support – Luftnahunterstützung für Bodentruppen mit einem JTAC' }],
  trainer: [{ code: 'TRNG', meaning: 'Übungsflug' }],
  transport: [{ code: 'AIRLIFT', meaning: 'Lufttransport' }],
  bomber: [{ code: 'STRIKE', meaning: 'Angriff auf ein festes Ziel' }],
}

/** Codenamen für den Bullseye-Bezugspunkt (frei erfunden, wie in Missionsunterlagen üblich). */
const BULLSEYE_NAMES = ['BULLDOG', 'ANVIL', 'MAGNUM', 'SHOTGUN', 'TOMAHAWK', 'GRANITE']
const ABORT_WORDS = ['BLUEBIRD', 'CHAMPAGNE', 'DIAMOND', 'SNOWFALL']

const pad = (n: number, len = 2) => String(n).padStart(len, '0')
const zulu = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}${pad(minutes % 60)}Z`
const field = (v: Value | undefined, key: string): Value | undefined => v?.fields?.[key]

function station(cp: Value, key: string) {
  const s = field(cp, key)
  return {
    name: field(s, 'name')?.text ?? key,
    channel: field(s, 'channel')?.text ?? '–',
    freq: field(s, 'freq')?.text ?? '–',
  }
}

export function buildSampleDoc(kind: SampleDocKind, env: ResolveEnv): SampleDoc {
  const specs: Record<string, VarSpec> = {
    af: { pool: 'airfields' },
    cp: { commplan: true, airfield: 'af' },
    // ATO, SPINS und Comm Card gehören zu heutigen Einsätzen – keine Warbirds oder MiG-15 auf der Frag-Zeile
    ac: { pool: 'aircraft', where: { era: 'modern' } },
    awacs: { pool: 'callsigns.awacs' },
    tanker: { pool: 'callsigns.tanker' },
    jtac: { pool: 'callsigns.jtac' },
    sq: { number: 'squawk' },
  }
  const v = resolveVars(specs, env)
  const { rng, self, content } = env
  const flightName = `${self.name} ${self.flight}`
  const acId = field(v.ac, 'id')?.text
  const role = content.aircraftTypes.find((a) => a.id === acId)?.role ?? 'multirole'
  const mission = rng.pick(MISSIONS[role] ?? MISSIONS.multirole)
  const count = rng.pick([2, 2, 4])
  const missionNo = rng.int(1000, 9899)
  const takeoff = rng.int(6 * 60, 15 * 60) - (rng.int(0, 11) % 12) * 5
  const onStation = takeoff + rng.int(4, 8) * 5
  const offStation = onStation + rng.pick([45, 60, 75])
  const bullseye = rng.pick(BULLSEYE_NAMES)
  const cp = v.cp
  const aw = station(cp, 'awacs')
  const tk = station(cp, 'tanker')
  const fl = station(cp, 'flight')
  const bearing = (n: number) => pad(n, 3)
  const capBrg = bearing(rng.int(0, 35) * 10)
  const capDist = rng.int(20, 60)
  const tankBrg = bearing(rng.int(0, 35) * 10)
  const tankFl = rng.pick([180, 200, 220, 240])
  const joker = rng.pick([4.0, 4.5, 5.0])
  const bingo = joker - 1
  const fuel = (n: number) => n.toFixed(1).replace('.', ',')

  switch (kind) {
    case 'frag': {
      const target =
        mission.code === 'CAS'
          ? { value: `JTAC ${v.jtac.text}, Raum Bullseye ${capBrg}/${capDist}`, hint: 'Wer dich am Boden einweist, und wo: Peilung und Entfernung vom Bullseye, dem Bezugspunkt der Mission (Modul 2, Lektion 9)' }
          : mission.code === 'DCA'
            ? { value: `CAP-Station Bullseye ${capBrg}/${capDist}`, hint: 'Wo du kreist und den Luftraum sicherst: Peilung und Entfernung vom Bullseye, dem Bezugspunkt der Mission (Modul 2, Lektion 9)' }
            : { value: `Zielraum Bullseye ${capBrg}/${capDist}`, hint: 'Wohin der Auftrag führt: Peilung und Entfernung vom Bullseye, dem Bezugspunkt der Mission (Modul 2, Lektion 9)' }
      return {
        kind,
        title: 'Frag – deine Zeile aus der ATO',
        header: `ATO · Mission ${missionNo}`,
        rows: [
          { label: 'Mission', value: String(missionNo), hint: 'Missionsnummer, nennst du beim Check-in' },
          { label: 'Rufzeichen', value: flightName.toUpperCase(), hint: 'Dein Flight-Rufzeichen für den ganzen Einsatz' },
          { label: 'Anzahl/Muster', value: `${count} × ${v.ac.text}`, hint: 'Wie viele Flugzeuge, welcher Typ' },
          { label: 'Auftrag', value: mission.code, hint: mission.meaning },
          { label: 'Startplatz', value: v.af.text, hint: 'Von hier startest du' },
          { label: 'Start', value: zulu(takeoff), hint: 'Startzeit in Zulu (UTC) – die „fragged“ Startzeit' },
          { label: mission.code === 'DCA' || mission.code === 'CAS' ? 'Station' : 'TOT', value: mission.code === 'DCA' || mission.code === 'CAS' ? `${zulu(onStation)}–${zulu(offStation)}` : zulu(onStation), hint: mission.code === 'DCA' || mission.code === 'CAS' ? 'Von wann bis wann du dort sein sollst' : 'Time on Target: wann die Waffen das Ziel treffen' },
          { label: 'Ziel/Raum', ...target },
          { label: 'Tanker', value: `${v.tanker.text}, Bullseye ${tankBrg}/${rng.int(30, 80)}, FL ${tankFl}`, hint: 'Wo du nachtanken kannst' },
          { label: 'Führung', value: `${v.awacs.text}, ${aw.channel === '–' ? aw.freq : `Kanal ${aw.channel}`}`, hint: 'Der AWACS, bei dem du dich anmeldest' },
          { label: 'IFF', value: `Mode 3 ${v.sq.text}`, hint: 'Code für den Transponder (squawk)' },
        ],
      }
    }
    case 'commcard': {
      const order = ['atis', 'ground', 'tower', 'departure', 'awacs', 'strike', 'tanker', 'flight', 'approach', 'guard']
      return {
        kind,
        title: 'Comm Card',
        header: `${flightName.toUpperCase()} · ${v.af.text}`,
        rows: [],
        stations: order.map((k) => station(cp, k)),
      }
    }
    case 'spins':
      return {
        kind,
        title: 'SPINS – Auszug',
        header: `Special Instructions zur ATO · gültig ab ${zulu(takeoff - 120)}`,
        rows: [
          { label: 'Bullseye', value: bullseye, hint: 'Codename des Bezugspunkts für alle Positionsangaben' },
          { label: 'Check-in', value: `${v.awacs.text} auf ${aw.channel === '–' ? aw.freq : `Kanal ${aw.channel}`}: Mission, Rufzeichen, Anzahl, Höhe, Auftrag – „as fragged“, wenn alles wie geplant`, hint: 'Wie und wo du dich anmeldest' },
          { label: 'Fence in', value: `An der Linie ${rng.pick(['PHASE LINE RED', 'PHASE LINE AXE', 'LINE ALPHA'])}: Checkliste FENCE (Waffen, Emitter und IFF, Navigation, Chaff/Flare, Master Arm)`, hint: 'Ab wo und wie du in den Einsatzraum einfliegst (Modul 4)' },
          { label: 'Abbruch', value: `Codewort ${rng.pick(ABORT_WORDS)} – alle Flights brechen den Auftrag ab`, hint: 'Gemeinsames Codewort für den Abbruch' },
          { label: 'Guard', value: '243.0 nur für Notfälle und Notrufe', hint: 'Wofür die Notfrequenz da ist' },
          { label: 'Tanker', value: `${v.tanker.text} auf ${tk.channel === '–' ? tk.freq : `Kanal ${tk.channel}`}`, hint: 'Rufzeichen und Kanal des Tankers' },
        ],
      }
    case 'sop':
      return {
        kind,
        title: 'SOP – Auszug',
        header: `Standard Operating Procedures · ${v.af.text}`,
        rows: [
          { label: 'Intra-Flight', value: `Kanal ${fl.channel} (${fl.freq})`, hint: 'Frequenz für den eigenen Flight' },
          { label: 'Check', value: `Nach jedem Kanalwechsel „${flightName}, check“ – Antwort nur mit der Nummer`, hint: 'Kommen alle mit? (Modul 4)' },
          { label: 'Rollen', value: 'Der Lead spricht für den Flight, die anderen hören mit', hint: 'Wer am Boden funkt' },
          { label: 'Treibstoff', value: `Joker ${fuel(joker)}, Bingo ${fuel(bingo)} (Tausend Pfund)`, hint: 'Ab wann umkehren (Modul 4)' },
          { label: 'Funkausfall', value: 'NORDO: Transponder 7600, im Verband Sichtzeichen geben, Mission endet, der Lead führt zum Platz', hint: 'Was ohne Funk gilt (Modul 4)' },
        ],
      }
  }
}
