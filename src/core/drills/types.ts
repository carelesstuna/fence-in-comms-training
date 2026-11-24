import type { Airfield, More, RadioKind, Role } from '../content/schema'
import type { CasArea } from '../random/cas'
import type { NineLineField } from '../scoring/nineline'
import type { GeoPicture } from '../random/geo'
import type { ChartData } from '../charts/chart'
import type { RadioStation } from '../scoring/tune'
import type { SelfCallsign } from '../random/vars'

export interface ResolvedSegment {
  text: string
  role: Role
  note?: string
  optional?: boolean
  critical?: boolean
  alt?: string[]
  /** Gilt, aber nicht nach Vorschrift: richtig mit Teilpunkten und Hinweis (`weakNote`). */
  weak?: string[]
  weakNote?: string
  tolerance?: number
  free?: boolean
  /** „Mehr dazu“ aus dem Inhalt; übersteuert das Standardziel der Rolle. */
  more?: More
  /** Sprechform für die Sprachausgabe: alle Platzhalter gesprochen („Viper one one“ statt „Viper 1-1“). */
  spoken?: string
}

export interface ResolvedTransmission {
  speaker: string
  you: boolean
  station?: string
  /** Entfällt in diesem Durchlauf (z. B. Three/Four im 2-ship oder `when` nicht erfüllt). */
  skip?: boolean
  channel: 'radio' | 'intercom'
  /** Funkgerät (C-F6), z. B. fm beim JTAC. */
  radio?: RadioKind
  /** Lesbarkeit 1–5 aus dem Inhalt; ohne Angabe würfelt die Wiedergabe. */
  readability?: number
  interference?: 'none' | 'light' | 'heavy'
  pace?: 'lines'
  /** Überlagerung zweier Übertragungen (Indizes im Funkspruch). */
  mix?: [number, number]
  segments: ResolvedSegment[]
  note?: string
}

export interface ResolvedExchange {
  id: string
  title: string
  context?: string
  freq?: string
  place?: string
  layer: string
  transmissions: ResolvedTransmission[]
}

interface Base {
  id: string
  prompt: string
  explain?: string
}

/** Rahmen und Lage einer Übung, in der du selbst funkst (call, build, cloze); `prompt` ist der Auftrag. */
export interface RadioTaskFrame {
  /** Eigenes Rufzeichen (Rahmenleiste); fehlt z. B. im Baukasten innerhalb eines Szenarios. */
  self?: string
  place?: string
  freq?: string
  situation?: string
}

/** Hörprobe über einer Auswahl- oder Freitext-Übung. */
export interface HearProbe {
  exchange: ResolvedExchange
  transmission: number
  noAudio?: string
}

export interface ChoiceDrill extends Base {
  kind: 'choice'
  hear?: HearProbe
  options: string[]
  /** Indizes der richtigen Optionen (nach dem Mischen). */
  correct: number[]
  /** Mehrfachauswahl: alle richtigen ankreuzen. */
  multi: boolean
  /** Optionen in Funk-Schrift (Monospace) anzeigen. */
  mono?: boolean
}

export interface MatchDrill extends Base {
  kind: 'match'
  left: string[]
  right: string[]
  /** solution[i] = Index in right, der zu left[i] gehört. */
  solution: number[]
}

export interface BuildTile {
  key: string
  text: string
}

export interface BuildDrill extends Base, RadioTaskFrame {
  kind: 'build'
  exchange: ResolvedExchange
  transmission: number
  tiles: BuildTile[]
  /** Richtige Reihenfolge als Texte. */
  solution: string[]
}

export interface AnatomyDrill extends Base {
  kind: 'anatomy'
  exchange: ResolvedExchange
  transmission: number
  target: Role
}

export interface InputDrill extends Base {
  kind: 'input'
  hear?: HearProbe
  accept: string[]
  hint?: string
  placeholder?: string
}

/** Eine Quelle der Merk-Übung: gehörte Übertragungen und der erwartete Readback. */
export interface MemorySet extends RadioTaskFrame {
  exchange: ResolvedExchange
  /** Indizes der gehörten Übertragungen in `exchange`. */
  heard: number[]
  /** Funkspruch mit dem Readback (oft derselbe wie `exchange`). */
  answerExchange: ResolvedExchange
  answer: number
}

export interface MemoryDrill extends Base {
  kind: 'memory'
  /** Wenig Angaben (Stufen 1, 3, 5, 7) und viele (2, 4, 6, 8). */
  few: MemorySet
  many: MemorySet
  /** Startstufe 1–8. */
  level: number
}

export interface ClozeDrill extends Base, RadioTaskFrame {
  kind: 'cloze'
  exchange: ResolvedExchange
  transmission: number
  /** Indizes der Segmente, die als Lücke erscheinen. */
  blanks: number[]
}

export interface SequenceItem {
  key: string
  label: string
  /** Optional: sprechende Station (bei Übertragungen). */
  speaker?: string
  /** Die Übertragung selbst (zum Anhören). */
  t?: ResolvedTransmission
}

export interface SequenceDrill extends Base {
  kind: 'sequence'
  items: SequenceItem[]
  /** Schlüssel in richtiger Reihenfolge. */
  solution: string[]
  /** Funkspruch, aus dem die Einträge stammen (zum Anhören). */
  exchange?: ResolvedExchange
}

export interface FormField {
  label: string
  accept: string[]
  placeholder?: string
}

export interface ChartTapDrill extends Base {
  kind: 'chart-tap'
  chart: ChartData
  /** Richtige Element-IDs (rwy:active ist schon zur konkreten Bahn aufgelöst). */
  targets: string[]
}

export interface FormDrill extends Base {
  kind: 'form'
  context?: string
  chart?: ChartData
  exchange?: ResolvedExchange
  transmission?: number
  fields: FormField[]
}

export interface CallDrill extends Base, RadioTaskFrame {
  kind: 'call'
  exchange: ResolvedExchange
  /** Index der eigenen Übertragung; null bei expect: silence. */
  transmission: number | null
  /** Anzahl Übertragungen, die vor dem eigenen Zug zu hören sind. */
  heard: number
  expect: 'call' | 'silence'
  hint?: string
  /** Eigenes Rufzeichen in dieser Perspektive, z. B. "Viper 1-2". */
  self: string
}

export interface PlotDrill extends Base {
  kind: 'plot'
  mode: 'place' | 'bullseye' | 'braa'
  picture: GeoPicture
  /** 0-basierter Index der gefragten Gruppe. */
  group: number
  context?: string
  exchange?: ResolvedExchange
  bearingTolerance: number
  rangeTolerance: number
}

/** 9-Line- bzw. 5-Line-Decoder: Brief hören, Zeile für Zeile mitschreiben, optional zurücklesen. */
export interface NineLineDrill extends Base {
  kind: 'nineline'
  format: 'nineline' | 'fiveline'
  /** Der Brief des JTAC (Übertragungen werden nacheinander gezeigt). */
  exchange: ResolvedExchange
  /** Felder des Formulars mit Sollwert und Prüfart. */
  fields: NineLineField[]
  area: CasArea
  /** Readback: Funkspruch und Index der eigenen Übertragung (Pflicht-Slots über critical). */
  readback?: { exchange: ResolvedExchange; transmission: number }
  reveal: 'step' | 'click' | 'all'
  sketch: boolean
  /** Eigenes Rufzeichen, z. B. "Hawg 1-1". */
  self: string
}

export type WhereMap = Partial<Record<'dcs' | 'bms' | 'il2' | 'srs', string>>

export interface ResolvedTune {
  name: string
  freq: string
  channel?: string
  where?: WhereMap
}

export interface KneeboardRow {
  label: string
  value: string
}

export interface ResolvedKneeboard {
  title: string
  /** Comm-Plan-Stationen in der gewünschten Reihenfolge. */
  stations: { name: string; channel: string; freq: string }[]
  /** Platzblock (Höhe, Bahnen, TACAN, ILS). */
  airfieldRows: KneeboardRow[]
  rows: KneeboardRow[]
  chart?: ChartData
  where?: WhereMap
}

export interface ResolvedScenarioStep {
  stage: string
  tune?: ResolvedTune
  situation?: string
  task?: string
  /** Ort ab diesem Schritt – schon fortgeschrieben aus früheren Schritten bzw. dem Szenario. */
  place?: string
  freq?: string
  pos?: string
  hear: ResolvedTransmission[]
  you?: {
    mode: 'type' | 'build' | 'choice'
    transmission: ResolvedTransmission
    tiles: BuildTile[]
    options: string[]
    correct: number
    hint?: string
  }
  silence: boolean
  /** Mitschreiben (9-Line/5-Line) aus dem, was in diesem Schritt zu hören ist. */
  decode?: { format: 'nineline' | 'fiveline'; fields: NineLineField[]; area: CasArea }
  reply: ResolvedTransmission[]
  explain?: string
  /** Im Checkride: Fehler in diesem Schritt sind kritisch. */
  critical?: boolean
}

export interface ScenarioSketch {
  airfield: Airfield
  runway?: string
  wind?: { dir: number; speed: number; text: string }
}

export interface ResolvedScenario {
  id: string
  title: string
  summary: string
  self: SelfCallsign
  steps: ResolvedScenarioStep[]
  sketch?: ScenarioSketch
  kneeboard?: ResolvedKneeboard
  /** Alle Stationen des Comm Plans – um bei falscher Frequenz zu zeigen, wen man stattdessen erreicht. */
  stations: RadioStation[]
}

export type ResolvedDrill =
  | ChoiceDrill
  | MatchDrill
  | BuildDrill
  | AnatomyDrill
  | InputDrill
  | ClozeDrill
  | MemoryDrill
  | SequenceDrill
  | FormDrill
  | CallDrill
  | PlotDrill
  | ChartTapDrill
  | NineLineDrill
