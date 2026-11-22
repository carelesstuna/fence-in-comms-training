/**
 * Baut aus den rohen Inhaltsdateien (Pfad → Text) einen geprüften Inhaltsindex.
 * Wird im Browser (über import.meta.glob) und im Node-Validator (über fs) genutzt.
 */
import { parse as parseYaml } from 'yaml'
import type { z } from 'zod'
import {
  achievementsSchema,
  aircraftPoolSchema,
  airfieldSchema,
  basicsSchema,
  brevitySchema,
  carrierPoolSchema,
  callsignPoolSchema,
  casPoolSchema,
  curriculumSchema,
  drillFileSchema,
  exchangeFileSchema,
  hangarMetaSchema,
  lessonMetaSchema,
  mapSchema,
  phoneticSchema,
  prowordsSchema,
  rolesFileSchema,
  scenarioSchema,
  topicMetaSchema,
  SIMS,
  FLIGHT_STATIONS,
  ERAS,
  LAYERS,
  type Achievement,
  type AircraftType,
  type Airfield,
  type BasicTerm,
  type BrevityTerm,
  type CallsignPools,
  type Carrier,
  type CasPools,
  type Curriculum,
  type Drill,
  type Exchange,
  type HangarMeta,
  type LessonMeta,
  type MapInfo,
  type Module,
  type Phonetic,
  type Proword,
  type RoleInfo,
  type Scenario,
  type TopicMeta,
  type Transmission,
  type VarSpec,
} from './schema'
import { findDirectives, findInternalLinks, findTerms, soleLeafDirective, splitFrontmatter, splitPages } from './parse'
import { buildGlossary, lookupTerm, norm } from '../glossary/glossary'
import { checkMoreTarget } from '../glossary/more'
import { BUILTIN_VARS, findPlaceholders } from '../random/template'
import { CHART_ELEMENTS } from '../charts/chart'
import { COMMPLAN_KEYS } from '../random/vars'

const APPROACH_ONLY = ['navaid', 'course', 'faf', 'da', 'msa', 'missed', 'minima', 'iaf']

export type LessonStep =
  | { kind: 'read'; markdown: string }
  | { kind: 'drill'; drillId: string }
  | { kind: 'hangar'; cardId: string }
  | { kind: 'scenario'; scenarioId: string }

export interface Lesson extends LessonMeta {
  steps: LessonStep[]
  file: string
}

export interface HangarCard extends HangarMeta {
  markdown: string
  file: string
}

/** Themenseite (`content/topics/<id>.md`): ausführliche Erklärung eines Grundbegriffs. */
export interface Topic extends TopicMeta {
  markdown: string
  file: string
}

export interface ContentIndex {
  curriculum: Curriculum
  modules: Map<string, Module>
  lessons: Map<string, Lesson>
  hangar: Map<string, HangarCard>
  topics: Map<string, Topic>
  drills: Map<string, Drill>
  exchanges: Map<string, Exchange>
  scenarios: Map<string, Scenario>
  callsigns: CallsignPools
  maps: Map<string, MapInfo>
  airfields: Airfield[]
  carriers: Carrier[]
  aircraftTypes: AircraftType[]
  /** Würfelpools für den CAS-Einsatzraum (Spur C). */
  cas: CasPools
  phonetic: Phonetic
  roles: Map<string, RoleInfo>
  prowords: Proword[]
  brevity: BrevityTerm[]
  basics: BasicTerm[]
  achievements: Achievement[]
}

export interface ContentError {
  file: string
  message: string
}

export interface BuildResult {
  index: ContentIndex | null
  errors: ContentError[]
}

const EMPTY_PHONETIC: Phonetic = { letters: [], digits: [] }

function rel(path: string): string {
  const i = path.replace(/\\/g, '/').indexOf('content/')
  return i >= 0 ? path.replace(/\\/g, '/').slice(i) : path
}

/** Erstellt den Inhaltsindex und sammelt dabei alle Fehler (Schema und Querverweise). */
export function buildContentIndex(rawFiles: Record<string, string>): BuildResult {
  const errors: ContentError[] = []
  const files = Object.fromEntries(Object.entries(rawFiles).map(([p, t]) => [rel(p), t]))

  // Steuerzeichen (z. B. ein Byte 0x03 aus einem „\03“ in YAML) zeigt die App als Leerstelle an (P2-14)
  for (const [file, text] of Object.entries(files)) {
    // eslint-disable-next-line no-control-regex
    const m = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.exec(text)
    if (m) {
      const line = text.slice(0, m.index).split('\n').length
      errors.push({ file, message: `Zeile ${line}: Steuerzeichen (Byte 0x${m[0].charCodeAt(0).toString(16).padStart(2, '0')}) im Text` })
    }
  }

  function check<T>(schema: z.ZodType<T>, data: unknown, file: string): T | null {
    const r = schema.safeParse(data)
    if (r.success) return r.data
    for (const issue of r.error.issues) {
      errors.push({ file, message: `${issue.path.join('.') || '(Wurzel)'}: ${issue.message}` })
    }
    return null
  }

  function yaml(file: string): unknown {
    try {
      return parseYaml(files[file].replace(/\r\n/g, '\n'))
    } catch (e) {
      errors.push({ file, message: `YAML-Fehler: ${(e as Error).message}` })
      return undefined
    }
  }

  function required(file: string): boolean {
    if (files[file] !== undefined) return true
    errors.push({ file, message: 'Datei fehlt' })
    return false
  }

  const paths = Object.keys(files).sort()
  const under = (prefix: string, ext: string) => paths.filter((p) => p.startsWith(prefix) && p.endsWith(ext))

  // --- Einzeldateien ---------------------------------------------------------
  const curriculum = required('content/curriculum.yaml')
    ? check(curriculumSchema, yaml('content/curriculum.yaml'), 'content/curriculum.yaml')
    : null
  const callsigns = required('content/pools/callsigns.yaml')
    ? check(callsignPoolSchema, yaml('content/pools/callsigns.yaml'), 'content/pools/callsigns.yaml')
    : null
  const mapsList = required('content/pools/maps.yaml')
    ? check(mapSchema, yaml('content/pools/maps.yaml'), 'content/pools/maps.yaml')
    : null
  const phonetic = required('content/glossary/phonetic.yaml')
    ? check(phoneticSchema, yaml('content/glossary/phonetic.yaml'), 'content/glossary/phonetic.yaml')
    : null
  const rolesList = required('content/glossary/roles.yaml')
    ? check(rolesFileSchema, yaml('content/glossary/roles.yaml'), 'content/glossary/roles.yaml')
    : null
  const carriers = required('content/pools/carriers.yaml')
    ? check(carrierPoolSchema, yaml('content/pools/carriers.yaml'), 'content/pools/carriers.yaml')
    : null
  const aircraftTypes = required('content/pools/aircraft.yaml')
    ? check(aircraftPoolSchema, yaml('content/pools/aircraft.yaml'), 'content/pools/aircraft.yaml')
    : null
  const cas = required('content/pools/cas.yaml') ? check(casPoolSchema, yaml('content/pools/cas.yaml'), 'content/pools/cas.yaml') : null
  const prowords = required('content/glossary/prowords.yaml')
    ? check(prowordsSchema, yaml('content/glossary/prowords.yaml'), 'content/glossary/prowords.yaml')
    : null
  const brevity = required('content/glossary/brevity.yaml')
    ? check(brevitySchema, yaml('content/glossary/brevity.yaml'), 'content/glossary/brevity.yaml')
    : null

  const achievements = required('content/achievements.yaml')
    ? check(achievementsSchema, yaml('content/achievements.yaml'), 'content/achievements.yaml')
    : null

  const basics = required('content/glossary/basics.yaml')
    ? check(basicsSchema, yaml('content/glossary/basics.yaml'), 'content/glossary/basics.yaml')
    : null

  // --- Glossar: doppelte Begriffe, Verweise ---------------------------------------
  const glossary = buildGlossary(brevity ?? [], prowords ?? [], basics ?? [])
  for (const [file, list] of [
    ['content/glossary/brevity.yaml', brevity ?? []],
    ['content/glossary/basics.yaml', basics ?? []],
  ] as const) {
    const seen = new Map<string, string>()
    for (const t of list) {
      for (const n of [t.word, ...t.aliases]) {
        const k = norm(n)
        if (seen.has(k)) errors.push({ file, message: `"${n}" kommt doppelt vor (auch bei ${seen.get(k)})` })
        else seen.set(k, t.word)
      }
      for (const s of t.see) {
        if (!lookupTerm(glossary, s)) errors.push({ file, message: `${t.word}: Verweis "${s}" gibt es im Glossar nicht` })
      }
    }
  }

  // --- Sammlungen ---------------------------------------------------------------
  const drills = new Map<string, Drill>()
  const drillFile = new Map<string, string>()
  for (const file of under('content/drills/', '.yaml')) {
    const list = check(drillFileSchema, yaml(file), file) ?? []
    for (const d of list) {
      if (drills.has(d.id)) errors.push({ file, message: `Übung "${d.id}" ist doppelt (auch in ${drillFile.get(d.id)})` })
      drills.set(d.id, d)
      drillFile.set(d.id, file)
    }
  }

  const exchanges = new Map<string, Exchange>()
  const exchangeFile = new Map<string, string>()
  for (const file of under('content/calls/', '.yaml')) {
    const list = check(exchangeFileSchema, yaml(file), file) ?? []
    for (const x of list) {
      if (exchanges.has(x.id)) errors.push({ file, message: `Funkspruch "${x.id}" ist doppelt (auch in ${exchangeFile.get(x.id)})` })
      exchanges.set(x.id, x)
      exchangeFile.set(x.id, file)
    }
  }

  const airfields: Airfield[] = []
  for (const file of under('content/airfields/', '.yaml')) {
    const a = check(airfieldSchema, yaml(file), file)
    if (a) airfields.push(a)
  }

  const scenarios = new Map<string, Scenario>()
  const scenarioFile = new Map<string, string>()
  for (const file of under('content/scenarios/', '.yaml')) {
    const sc = check(scenarioSchema, yaml(file), file)
    if (!sc) continue
    if (scenarios.has(sc.id)) errors.push({ file, message: `Szenario "${sc.id}" ist doppelt` })
    scenarios.set(sc.id, sc)
    scenarioFile.set(sc.id, file)
  }

  const hangar = new Map<string, HangarCard>()
  for (const file of under('content/hangar/', '.md')) {
    const { data, body } = safeFrontmatter(file)
    const meta = check(hangarMetaSchema, data, file)
    if (!meta) continue
    if (hangar.has(meta.id)) errors.push({ file, message: `Hangar-Karte "${meta.id}" ist doppelt` })
    hangar.set(meta.id, { ...meta, markdown: body.trim(), file })
  }

  const topics = new Map<string, Topic>()
  for (const file of under('content/topics/', '.md')) {
    const { data, body } = safeFrontmatter(file)
    const meta = check(topicMetaSchema, data, file)
    if (!meta) continue
    if (topics.has(meta.id)) errors.push({ file, message: `Themenseite "${meta.id}" ist doppelt (auch in ${topics.get(meta.id)!.file})` })
    if (file !== `content/topics/${meta.id}.md`) errors.push({ file, message: `Dateiname und id passen nicht zusammen (erwartet: content/topics/${meta.id}.md)` })
    topics.set(meta.id, { ...meta, markdown: body.trim(), file })
  }

  const lessons = new Map<string, Lesson>()
  for (const file of under('content/lessons/', '.md')) {
    const { data, body } = safeFrontmatter(file)
    const meta = check(lessonMetaSchema, data, file)
    if (!meta) continue
    const steps: LessonStep[] = []
    for (const page of splitPages(body)) {
      const directive = soleLeafDirective(page)
      if (directive?.name === 'drill') {
        const repeat = Math.max(1, Number(directive.attributes.repeat ?? 1) || 1)
        for (let i = 0; i < repeat; i++) steps.push({ kind: 'drill', drillId: directive.attributes.id ?? '' })
      } else if (directive?.name === 'hangar') {
        steps.push({ kind: 'hangar', cardId: directive.attributes.id ?? '' })
      } else if (directive?.name === 'scenario') {
        steps.push({ kind: 'scenario', scenarioId: directive.attributes.id ?? '' })
      } else {
        steps.push({ kind: 'read', markdown: page })
      }
    }
    if (lessons.has(meta.id)) errors.push({ file, message: `Lektion "${meta.id}" ist doppelt` })
    lessons.set(meta.id, { ...meta, steps, file })
  }

  function safeFrontmatter(file: string) {
    try {
      return splitFrontmatter(files[file])
    } catch (e) {
      errors.push({ file, message: `Frontmatter-Fehler: ${(e as Error).message}` })
      return { data: {}, body: '' }
    }
  }

  if (!curriculum || !callsigns || !mapsList || !phonetic || !rolesList || !prowords || !carriers || !aircraftTypes || !cas) {
    return { index: null, errors }
  }

  const maps = new Map(mapsList.map((m) => [m.id, m]))
  const modules = new Map(curriculum.modules.map((m) => [m.id, m]))
  const roles = new Map(rolesList.map((r) => [r.role, r]))
  const topicIds = new Set(topics.keys())
  for (const r of rolesList) {
    for (const m of r.more ?? []) {
      const problem = checkMoreTarget(m.to, topicIds)
      if (problem) errors.push({ file: 'content/glossary/roles.yaml', message: `Rolle "${r.role}": more – ${problem}` })
    }
  }

  // --- Querverweise -------------------------------------------------------------
  const CUR = 'content/curriculum.yaml'
  const AC = 'content/pools/aircraft.yaml'
  const aircraftIds = new Set<string>()
  for (const a of aircraftTypes) {
    if (aircraftIds.has(a.id)) errors.push({ file: AC, message: `Flugzeug "${a.id}" ist doppelt` })
    aircraftIds.add(a.id)
  }
  /** Prüft Flugzeug-IDs (Profilfilter, Module) gegen content/pools/aircraft.yaml. */
  const checkAircraft = (ids: readonly string[] | undefined, file: string, where: string) => {
    for (const a of ids ?? []) {
      if (!aircraftIds.has(a)) errors.push({ file, message: `${where}: unbekanntes Flugzeug "${a}" (steht nicht in ${AC})` })
    }
  }
  for (const w of cas.weapons) checkAircraft(w.aircraft, 'content/pools/cas.yaml', `Waffe "${w.id}"`)
  /** Prüft einen Rufzeichen-Pool (callsignPool an Funkspruch, Übung, Szenario). */
  const checkCallsignPool = (pool: string | undefined, file: string, where: string) => {
    if (pool !== undefined && !callsigns[pool]) errors.push({ file, message: `${where}: callsignPool "${pool}" steht nicht in content/pools/callsigns.yaml` })
  }
  /** Prüft das Ziel eines „Mehr dazu“ am Segment. */
  const checkMore = (more: { to: string } | undefined, file: string, where: string) => {
    const problem = more && checkMoreTarget(more.to, topicIds)
    if (problem) errors.push({ file, message: `${where}: more – ${problem}` })
  }
  for (const m of curriculum.modules) checkAircraft(m.aircraft, CUR, `Modul "${m.id}"`)
  const lessonOwner = new Map<string, string>()
  for (const m of curriculum.modules) {
    for (const lid of m.lessons) {
      const lesson = lessons.get(lid)
      if (!lesson) {
        errors.push({ file: CUR, message: `Modul "${m.id}": Lektion "${lid}" existiert nicht` })
        continue
      }
      if (lessonOwner.has(lid)) errors.push({ file: CUR, message: `Lektion "${lid}" ist mehreren Modulen zugeordnet` })
      lessonOwner.set(lid, m.id)
      if (lesson.module !== m.id) {
        errors.push({ file: lesson.file, message: `module: "${lesson.module}" passt nicht zu Modul "${m.id}" im Lehrplan` })
      }
    }
    if (m.status === 'available' && m.lessons.length === 0) {
      errors.push({ file: CUR, message: `Modul "${m.id}" ist verfügbar, hat aber keine Lektionen` })
    }
    for (const did of m.placement?.drills ?? []) {
      if (!drills.has(did)) errors.push({ file: CUR, message: `Modul "${m.id}": Einstufungs-Übung "${did}" existiert nicht` })
    }
  }
  // --- Modulprüfung: Prüfungsfragen gehören zu einer Lektion und kommen nur in der Prüfung vor ------
  {
    const used = new Set<string>()
    for (const l of lessons.values()) for (const step of l.steps) if (step.kind === 'drill') used.add(step.drillId)
    for (const m of curriculum.modules) for (const did of m.placement?.drills ?? []) used.add(did)
    const lessonOf = (drillId: string) => curriculum.modules.find((m) => m.lessons.some((lid) => drillId.startsWith(`${lid}-`)))
    for (const d of drills.values()) {
      if (!d.exam) continue
      const file = drillFile.get(d.id)!
      const owner = lessonOf(d.id)
      if (!owner) errors.push({ file, message: `Prüfungsfrage "${d.id}": Die ID muss mit der ID einer Lektion beginnen (z. B. m3-l5-x-…)` })
      else if (!owner.exam) errors.push({ file, message: `Prüfungsfrage "${d.id}": Modul "${owner.id}" hat keinen Eintrag exam im Lehrplan` })
      if (used.has(d.id)) errors.push({ file, message: `Prüfungsfrage "${d.id}" kommt in einer Lektion oder Einstufung vor – dort gehört sie nicht hin` })
    }
    for (const m of curriculum.modules) {
      if (!m.exam) continue
      if (m.status !== 'available') errors.push({ file: CUR, message: `Modul "${m.id}": Eine Prüfung gibt es nur für spielbare Module` })
      let total = 0
      for (const lid of m.lessons) {
        const n = [...drills.values()].filter((d) => d.exam && d.id.startsWith(`${lid}-`)).length
        total += n
        // Lektionen ohne Übungen (z. B. ein Checkride, nur ein Szenario) brauchen keine Prüfungsfragen
        const teaches = lessons.get(lid)?.steps.some((step) => step.kind === 'drill')
        if (teaches && n < 2) errors.push({ file: CUR, message: `Modul "${m.id}": Zu Lektion "${lid}" gibt es ${n} Prüfungsfragen, nötig sind mindestens 2 (exam: true, ID beginnt mit ${lid}-)` })
      }
      if (total < m.exam.size) errors.push({ file: CUR, message: `Modul "${m.id}": Der Prüfungspool hat ${total} Fragen, die Prüfung soll ${m.exam.size} haben` })
    }
  }
  {
    const ACH = 'content/achievements.yaml'
    const ids = new Set<string>()
    for (const a of achievements ?? []) {
      if (ids.has(a.id)) errors.push({ file: ACH, message: `Abzeichen "${a.id}" kommt doppelt vor` })
      ids.add(a.id)
      if (a.rule.module && !modules.has(a.rule.module)) errors.push({ file: ACH, message: `${a.id}: Modul "${a.rule.module}" existiert nicht` })
      if (a.rule.rank && !curriculum.ranks.some((r) => r.id === a.rule.rank)) errors.push({ file: ACH, message: `${a.id}: Rang "${a.rule.rank}" existiert nicht` })
    }
  }
  curriculum.ranks.forEach((r, i) => {
    const prev = curriculum.ranks[i - 1]
    if (prev && r.xp < prev.xp) errors.push({ file: CUR, message: `Rang "${r.id}": XP (${r.xp}) kleiner als beim Rang davor (${prev.xp})` })
    if (!r.checkride) return
    if (i === 0) errors.push({ file: CUR, message: `Rang "${r.id}": Der erste Rang kann keinen Checkride haben` })
    if (!scenarios.has(r.checkride.scenario)) errors.push({ file: CUR, message: `Rang "${r.id}": Checkride-Szenario "${r.checkride.scenario}" existiert nicht` })
    for (const req of r.checkride.requires) {
      if (!modules.has(req) && !lessons.has(req)) errors.push({ file: CUR, message: `Rang "${r.id}": Voraussetzung "${req}" ist weder Modul noch Lektion` })
    }
  })
  for (const lesson of lessons.values()) {
    if (!lessonOwner.has(lesson.id)) errors.push({ file: lesson.file, message: `Lektion "${lesson.id}" ist keinem Modul zugeordnet` })
    for (const step of lesson.steps) {
      if (step.kind === 'drill' && !drills.has(step.drillId)) {
        errors.push({ file: lesson.file, message: `Übung "${step.drillId}" existiert nicht` })
      }
      if (step.kind === 'hangar' && !hangar.has(step.cardId)) {
        errors.push({ file: lesson.file, message: `Hangar-Karte "${step.cardId}" existiert nicht` })
      }
      if (step.kind === 'scenario' && !scenarios.has(step.scenarioId)) {
        errors.push({ file: lesson.file, message: `Szenario "${step.scenarioId}" existiert nicht` })
      }
      if (step.kind === 'read') checkMarkdown(step.markdown, lesson.file, undefined)
    }
  }
  for (const card of hangar.values()) checkMarkdown(card.markdown, card.file, undefined)

  // --- Themenseiten: Text, Glossar-Begriffe und Verweise vom Glossar auf die Seiten ---------------
  const termOwner = new Map<string, string>()
  for (const topic of topics.values()) {
    checkMarkdown(topic.markdown, topic.file, undefined)
    // Ganzseitige Bausteine einer Lektion gibt es auf einer Themenseite nicht
    for (const d of findDirectives(topic.markdown)) {
      if (['drill', 'hangar', 'scenario'].includes(d.name)) errors.push({ file: topic.file, message: `::${d.name} gibt es nur auf Lektionsseiten, nicht in Themenseiten` })
    }
    for (const term of topic.terms) {
      const entry = lookupTerm(glossary, term)
      if (!entry) {
        errors.push({ file: topic.file, message: `terms: "${term}" steht nicht im Glossar (brevity.yaml, prowords.yaml oder basics.yaml)` })
        continue
      }
      if (entry.topic && entry.topic !== topic.id) errors.push({ file: topic.file, message: `terms: "${term}" verweist im Glossar auf die Themenseite "${entry.topic}", nicht auf diese` })
      const other = termOwner.get(entry.key)
      if (other && other !== topic.id) errors.push({ file: topic.file, message: `terms: "${term}" gehört schon zur Themenseite "${other}"` })
      termOwner.set(entry.key, topic.id)
    }
  }
  for (const [file, list] of [
    ['content/glossary/brevity.yaml', brevity ?? []],
    ['content/glossary/prowords.yaml', prowords ?? []],
    ['content/glossary/basics.yaml', basics ?? []],
  ] as const) {
    for (const t of list) {
      if (t.topic && !topics.has(t.topic)) errors.push({ file, message: `${t.word}: Themenseite "${t.topic}" gibt es nicht (content/topics/${t.topic}.md)` })
    }
  }

  /** Prüft einen Verweis innerhalb der App (`[Text](/wissen/<id>)`). Ergibt eine Fehlermeldung oder null. */
  function checkInternalLink(to: string): string | null {
    const [path] = to.split(/[?#]/)
    const [, area, rest, ...more] = path.split('/')
    if (more.length > 0) return 'unbekanntes Ziel'
    if (area === 'wissen') return rest === undefined || rest === '' || topics.has(rest) ? null : `Themenseite "${rest}" gibt es nicht`
    if (area === 'lesson') return rest && lessons.has(rest) ? null : `Lektion "${rest ?? ''}" gibt es nicht`
    if (['hangar', 'glossary', 'profile'].includes(area) && rest === undefined) return null
    return 'unbekanntes Ziel (erlaubt: /wissen/<id>, /lesson/<id>, /hangar, /glossary, /profile)'
  }

  function checkMarkdown(markdown: string, file: string, vars: Record<string, VarSpec> | undefined) {
    for (const to of findInternalLinks(markdown)) {
      const problem = checkInternalLink(to)
      if (problem) errors.push({ file, message: `Link (${to}): ${problem}` })
    }
    for (const d of findDirectives(markdown)) {
      switch (d.name) {
        case 'call': {
          const x = exchanges.get(d.attributes.id ?? '')
          if (!x) errors.push({ file, message: `::call: Funkspruch "${d.attributes.id}" existiert nicht` })
          else if (d.attributes.as && !(x.perspective ?? []).includes(d.attributes.as)) {
            errors.push({ file, message: `::call: "${d.attributes.as}" ist keine Perspektive von "${x.id}" (perspective: [${(x.perspective ?? []).join(', ')}])` })
          }
          break
        }
        case 'sim':
          if (!SIMS.includes(d.attributes.sim as never)) errors.push({ file, message: `:::sim: unbekannte Sim "${d.attributes.sim}" (erlaubt: ${SIMS.join(', ')})` })
          break
        case 'aircraft': {
          // Ein Kasten darf für mehrere Muster gelten: :::aircraft{aircraft=p51,p47}
          const ids = (d.attributes.aircraft ?? '').split(',').map((s) => s.trim()).filter(Boolean)
          if (!ids.length) errors.push({ file, message: `:::aircraft: Flugzeug fehlt` })
          for (const a of ids) {
            if (!aircraftIds.has(a)) errors.push({ file, message: `:::aircraft: unbekanntes Flugzeug "${a}" (steht nicht in ${AC})` })
          }
          break
        }
        case 'era': {
          // Auch für mehrere Epochen: :::era{era=ww2,cold-war}
          const eras = (d.attributes.era ?? '').split(',').map((s) => s.trim()).filter(Boolean)
          if (!eras.length) errors.push({ file, message: `:::era: Epoche fehlt` })
          for (const e of eras) {
            if (!ERAS.includes(e as never)) errors.push({ file, message: `:::era: unbekannte Epoche "${e}" (erlaubt: ${ERAS.join(', ')})` })
          }
          break
        }
        case 'layer':
          if (!LAYERS.includes(d.attributes.layer as never)) errors.push({ file, message: `:::layer: unbekannte Ebene "${d.attributes.layer}"` })
          break
        case 'chart': {
          if (!['airport', 'approach'].includes(d.attributes.kind ?? '')) errors.push({ file, message: `::chart: kind muss airport oder approach sein` })
          if (d.attributes.airfield && !airfields.some((a) => a.id === d.attributes.airfield)) {
            errors.push({ file, message: `::chart: Flugplatz "${d.attributes.airfield}" existiert nicht` })
          }
          if (d.attributes.freqs && !['sim', 'real'].includes(d.attributes.freqs)) errors.push({ file, message: `::chart: freqs muss sim oder real sein` })
          break
        }
        case 'tip':
        case 'warn':
        case 'example':
        case 'drill':
        case 'hangar':
        case 'scenario':
          break
        default:
          errors.push({ file, message: `Unbekannte Direktive "${d.name}"` })
      }
    }
    for (const term of findTerms(markdown)) {
      if (!lookupTerm(glossary, term)) errors.push({ file, message: `:term[${term}]: Begriff steht nicht im Glossar (brevity.yaml, prowords.yaml oder basics.yaml)` })
    }
    checkPlaceholders(markdown, vars, file, 'Text')
  }

  function checkVarSpecs(vars: Record<string, VarSpec> | undefined, file: string, where: string) {
    const seen: string[] = []
    const kinds = new Map<string, string>()
    for (const [name, spec] of Object.entries(vars ?? {})) {
      if (BUILTIN_VARS.includes(name as never)) errors.push({ file, message: `${where}: Variable "${name}" überschreibt eine eingebaute Variable` })
      if ('pool' in spec) {
        const ok =
          ['airfields', 'maps', 'carriers', 'aircraft'].includes(spec.pool) ||
          (spec.pool.startsWith('callsigns.') && callsigns![spec.pool.slice(10)] !== undefined)
        if (!ok) errors.push({ file, message: `${where}: unbekannter Pool "${spec.pool}"` })
        if (spec.sameMap !== undefined && (spec.pool !== 'airfields' || kinds.get(spec.sameMap) !== 'airfields')) {
          errors.push({ file, message: `${where}: sameMap "${spec.sameMap}" braucht pool: airfields und eine vorher definierte Flugplatz-Variable` })
        }
        kinds.set(name, spec.pool)
      }
      if ('distinctFrom' in spec) {
        for (const other of spec.distinctFrom ?? []) {
          if (!seen.includes(other) && !BUILTIN_VARS.includes(other as never)) {
            errors.push({ file, message: `${where}: distinctFrom "${other}" muss vor "${name}" definiert sein` })
          }
        }
      }
      if (('weather' in spec || 'commplan' in spec) && spec.airfield !== undefined) {
        if (kinds.get(spec.airfield) !== 'airfields') {
          errors.push({ file, message: `${where}: airfield "${spec.airfield}" muss eine vorher definierte Variable mit pool: airfields sein` })
        }
      }
      if ('number' in spec && spec.range && spec.range[0] > spec.range[1]) {
        errors.push({ file, message: `${where}: range von "${name}" ist verkehrt herum` })
      }
      if ('int' in spec && spec.int[0] > spec.int[1]) errors.push({ file, message: `${where}: int von "${name}" ist verkehrt herum` })
      if ('derive' in spec) {
        const refs = [...(spec.from ? [spec.from] : []), ...(spec.of ?? [])]
        if ((spec.derive === 'offset' || spec.derive === 'reciprocal') && !spec.from) {
          errors.push({ file, message: `${where}: derive ${spec.derive} braucht "from"` })
        }
        if ((spec.derive === 'min' || spec.derive === 'max' || spec.derive === 'sum') && !spec.of) {
          errors.push({ file, message: `${where}: derive ${spec.derive} braucht "of"` })
        }
        for (const r of refs) {
          if (!seen.includes(r) && !BUILTIN_VARS.includes(r as never)) errors.push({ file, message: `${where}: derive-Quelle "${r}" muss vor "${name}" definiert sein` })
        }
      }
      if ('geo' in spec) kinds.set(name, 'geo')
      if ('casArea' in spec) {
        kinds.set(name, 'casArea')
        if (!aircraftIds.has(spec.aircraft)) errors.push({ file, message: `${where}: casArea "${name}": unbekanntes Flugzeug "${spec.aircraft}"` })
        else if (!cas!.weapons.some((w) => w.aircraft.includes(spec.aircraft))) {
          errors.push({ file, message: `${where}: casArea "${name}": keine Waffe für "${spec.aircraft}" in content/pools/cas.yaml` })
        }
      }
      if ('number' in spec && spec.digits !== undefined && spec.number !== 'mgrs') errors.push({ file, message: `${where}: digits gibt es nur bei number: mgrs` })
      // Luftdruck nach der Phraseologie des Platzes: Ohne Platz wüsste der Würfel nicht, ob inHg oder hPa (E3-12)
      if ('number' in spec && spec.number === 'pressure') {
        if (spec.airfield === undefined || kinds.get(spec.airfield) !== 'airfields') {
          errors.push({ file, message: `${where}: number: pressure "${name}" braucht airfield = vorher definierte Flugplatz-Variable` })
        }
        if (spec.range || spec.step || spec.above) {
          errors.push({ file, message: `${where}: number: pressure "${name}" hat kein range, step oder above (inHg oder hPa je nach Platz)` })
        }
      } else if ('number' in spec && spec.airfield !== undefined) {
        errors.push({ file, message: `${where}: airfield gibt es bei number nur für pressure` })
      }
      if ('weather' in spec) kinds.set(name, 'weather')
      if ('commplan' in spec) kinds.set(name, 'commplan')
      if ('chart' in spec) {
        kinds.set(name, `chart:${spec.chart}`)
        if (kinds.get(spec.airfield) !== 'airfields') errors.push({ file, message: `${where}: chart braucht airfield = vorher definierte Flugplatz-Variable` })
        if (spec.commplan && kinds.get(spec.commplan) !== 'commplan') errors.push({ file, message: `${where}: commplan "${spec.commplan}" muss eine vorher definierte commplan-Variable sein` })
        if (spec.weather && kinds.get(spec.weather) !== 'weather') errors.push({ file, message: `${where}: weather "${spec.weather}" muss eine vorher definierte Wetter-Variable sein` })
      }
      seen.push(name)
    }
  }

  /** `when: cas.laser` wie einen Platzhalter prüfen. */
  const whenText = (when: string | undefined) => (when ? `{${when.replace(/^!/, '')}}` : '')

  function checkPlaceholders(text: string, vars: Record<string, VarSpec> | undefined, file: string, where: string) {
    for (const p of findPlaceholders(text)) {
      if (!BUILTIN_VARS.includes(p.root as never) && !(vars && p.root in vars)) {
        errors.push({ file, message: `${where}: Platzhalter "{${p.raw}}" ist nicht definiert` })
      }
    }
  }

  for (const x of exchanges.values()) {
    const file = exchangeFile.get(x.id)!
    const where = `Funkspruch "${x.id}"`
    checkVarSpecs(x.vars, file, where)
    checkAircraft(x.aircraft, file, where)
    checkCallsignPool(x.callsignPool, file, where)
    const texts = [x.title, x.context ?? '', x.freq ?? '']
    for (const t of x.transmissions) {
      texts.push(t.speaker, t.note ?? '', whenText(t.when))
      for (const s of t.segments) {
        texts.push(s.text, s.note ?? '', whenText(s.when))
        checkMore(s.more, file, `${where}, „${s.text}“`)
      }
      if (!roles.has(t.segments[0].role)) errors.push({ file, message: `${where}: Rolle fehlt in roles.yaml` })
    }
    for (const t of texts) checkPlaceholders(t, x.vars, file, where)
    const stations = new Set(x.transmissions.map((t) => t.station).filter(Boolean))
    for (const p of x.perspective ?? []) {
      // Flight-Positionen dürfen auch stumm sein (z. B. Two nach „push“)
      if (!stations.has(p) && !(p in FLIGHT_STATIONS)) {
        errors.push({ file, message: `${where}: Perspektive "${p}" hat keine Übertragung mit station: ${p}` })
      }
    }
  }

  for (const d of drills.values()) {
    const file = drillFile.get(d.id)!
    const where = `Übung "${d.id}"`
    checkVarSpecs(d.vars, file, where)
    checkAircraft(d.aircraft, file, where)
    checkCallsignPool(d.callsignPool, file, where)
    const texts: string[] = [d.prompt ?? '', d.explain ?? '']
    // V1: Übungen mit Funkspruch kennen auch dessen Variablen
    const callId = 'call' in d ? d.call : undefined
    const x = callId ? exchanges.get(callId) : undefined
    if (callId && !x) errors.push({ file, message: `${where}: Funkspruch "${callId}" existiert nicht` })
    const scope = { ...(x?.vars ?? {}), ...(d.vars ?? {}) }
    const transmissionOf = (index: number | undefined) => {
      if (!x) return null
      const idx = index ?? Math.max(0, x.transmissions.findIndex((t) => t.you))
      const t = x.transmissions[idx]
      if (!t) errors.push({ file, message: `${where}: Übertragung ${index ?? '(you)'} existiert nicht in "${callId}"` })
      return t ? { t, idx } : null
    }

    switch (d.type) {
      case 'choice': {
        texts.push(...d.options)
        const answers = Array.isArray(d.answer) ? d.answer : [d.answer]
        for (const a of answers) {
          if (a >= d.options.length) errors.push({ file, message: `${where}: answer ${a} liegt außerhalb der Optionen` })
        }
        if (new Set(answers).size !== answers.length) errors.push({ file, message: `${where}: answer enthält Doppelungen` })
        break
      }
      case 'match':
        texts.push(...d.pairs.flat())
        break
      case 'input':
        texts.push(...d.accept, d.hint ?? '', d.placeholder ?? '')
        break
      case 'build': {
        texts.push(...d.distractors)
        const r = transmissionOf(d.transmission)
        if (r && r.t.segments.length < 2) errors.push({ file, message: `${where}: Baukasten braucht mindestens 2 Segmente` })
        break
      }
      case 'anatomy': {
        const r = transmissionOf(d.transmission)
        if (r && !r.t.segments.some((s) => s.role === d.target)) {
          errors.push({ file, message: `${where}: Rolle "${d.target}" kommt in Übertragung ${r.idx} nicht vor` })
        }
        break
      }
      case 'cloze': {
        const r = transmissionOf(d.transmission)
        if (r) {
          for (const b of d.blanks) {
            if (b >= r.t.segments.length) errors.push({ file, message: `${where}: Lücke ${b} gibt es in Übertragung ${r.idx} nicht` })
          }
          if (d.blanks.length >= r.t.segments.length) errors.push({ file, message: `${where}: Mindestens ein Segment muss sichtbar bleiben` })
        }
        break
      }
      case 'sequence': {
        if (!d.items && !d.call) errors.push({ file, message: `${where}: sequence braucht items oder call` })
        if (d.items && d.call) errors.push({ file, message: `${where}: sequence hat items UND call – bitte nur eins` })
        if (d.items) texts.push(...d.items)
        if (x) {
          const list = d.transmissions ?? x.transmissions.map((_, i) => i)
          if (list.length < 2) errors.push({ file, message: `${where}: mindestens 2 Übertragungen nötig` })
          for (const i of list) {
            if (!x.transmissions[i]) errors.push({ file, message: `${where}: Übertragung ${i} existiert nicht in "${callId}"` })
          }
        }
        break
      }
      case 'form': {
        texts.push(d.context ?? '')
        if (d.chart && !(scope[d.chart] && 'chart' in scope[d.chart])) errors.push({ file, message: `${where}: "${d.chart}" ist keine Karten-Variable` })
        for (const f of d.fields) texts.push(f.label, f.placeholder ?? '', ...f.accept)
        if (x) transmissionOf(d.transmission)
        break
      }
      case 'call': {
        texts.push(d.hint ?? '')
        if (x && d.as && !(x.perspective ?? []).includes(d.as)) {
          errors.push({ file, message: `${where}: "${d.as}" ist keine Perspektive von "${callId}"` })
        }
        if (x && d.expect === 'call') {
          const hasYou = d.transmission !== undefined || x.transmissions.some((t) => t.you) || (x.perspective?.length ?? 0) > 0
          if (!hasYou) errors.push({ file, message: `${where}: keine eigene Übertragung (you, station oder transmission)` })
          if (d.transmission !== undefined) transmissionOf(d.transmission)
        }
        if (x && d.show !== undefined && d.show > x.transmissions.length) {
          errors.push({ file, message: `${where}: show ${d.show} ist größer als die Zahl der Übertragungen` })
        }
        break
      }
      case 'chart-tap': {
        const spec = scope[d.chart]
        if (!spec || !('chart' in spec)) {
          errors.push({ file, message: `${where}: "${d.chart}" ist keine Karten-Variable` })
        } else {
          for (const t of Array.isArray(d.target) ? d.target : [d.target]) {
            const ok = CHART_ELEMENTS.includes(t as never) || t === 'rwy:active' || /^rwy:\d{2}[LRC]?$/.test(t)
            if (!ok) errors.push({ file, message: `${where}: unbekanntes Kartenelement "${t}"` })
            if (spec.chart === 'airport' && APPROACH_ONLY.includes(t)) errors.push({ file, message: `${where}: "${t}" gibt es nur auf der Anflugkarte` })
          }
        }
        break
      }
      case 'plot': {
        texts.push(d.context ?? '')
        const spec = scope[d.geo]
        if (!spec || !('geo' in spec)) errors.push({ file, message: `${where}: "${d.geo}" ist keine geo-Variable` })
        break
      }
      case 'nineline': {
        const rb = d.readback ? exchanges.get(d.readback) : undefined
        if (d.readback && !rb) errors.push({ file, message: `${where}: Readback-Funkspruch "${d.readback}" existiert nicht` })
        if (rb && !rb.transmissions.some((t) => t.you)) errors.push({ file, message: `${where}: Readback "${d.readback}" hat keine eigene Übertragung (you: true)` })
        const full = { ...scope, ...(rb?.vars ?? {}) }
        const areas = Object.entries(full).filter(([, spec]) => 'casArea' in spec)
        if (d.area ? !(full[d.area] && 'casArea' in full[d.area]) : areas.length === 0) {
          errors.push({ file, message: `${where}: ${d.area ? `"${d.area}" ist keine casArea-Variable` : 'keine casArea-Variable im Funkspruch oder in der Übung'}` })
        }
        break
      }
      case 'generated':
        break
    }
    for (const t of texts) checkPlaceholders(t, scope, file, where)
  }

  for (const sc of scenarios.values()) {
    const file = scenarioFile.get(sc.id)!
    const where = `Szenario "${sc.id}"`
    checkVarSpecs(sc.vars, file, where)
    checkAircraft(sc.aircraft, file, where)
    checkCallsignPool(sc.callsignPool, file, where)
    const texts: string[] = [sc.title, sc.summary]
    const tr = (t: Transmission) => {
      texts.push(t.speaker, t.note ?? '', whenText(t.when))
      for (const seg of t.segments) {
        texts.push(seg.text, seg.note ?? '', ...(seg.alt ?? []), whenText(seg.when))
        checkMore(seg.more, file, `${where}, „${seg.text}“`)
      }
    }
    sc.steps.forEach((st, i) => {
      texts.push(st.stage, st.situation ?? '', st.freq ?? '', st.explain ?? '')
      st.hear.forEach(tr)
      st.reply.forEach(tr)
      if (st.you) {
        tr(st.you.transmission)
        texts.push(...st.you.distractors, ...(st.you.wrong ?? []), st.you.hint ?? '')
        if (st.you.mode === 'choice' && !st.you.wrong) errors.push({ file, message: `${where}, Schritt ${i + 1}: mode choice braucht "wrong"` })
        if (st.you.mode === 'build' && st.you.transmission.segments.length < 2) errors.push({ file, message: `${where}, Schritt ${i + 1}: Baukasten braucht mindestens 2 Segmente` })
      }
      if (st.you && st.silence) errors.push({ file, message: `${where}, Schritt ${i + 1}: you und silence schließen sich aus` })
      if (st.decode) {
        const spec = sc.vars?.[st.decode.area]
        if (!spec || !('casArea' in spec)) errors.push({ file, message: `${where}, Schritt ${i + 1}: decode.area "${st.decode.area}" ist keine casArea-Variable` })
        if (st.you || st.silence) errors.push({ file, message: `${where}, Schritt ${i + 1}: decode schließt you und silence aus` })
      }
      if (st.tune) texts.push(st.tune.name, st.tune.freq, st.tune.channel ?? '', ...Object.values(st.tune.where ?? {}))
    })
    const kb = sc.kneeboard
    if (kb) {
      texts.push(kb.title ?? '', ...kb.rows.flatMap((r) => [r.label, r.value]), ...Object.values(kb.where ?? {}))
      const spec = (name: string | undefined) => (name ? sc.vars?.[name] : undefined)
      const cp = spec(kb.commplan)
      if (kb.commplan && !(cp && 'commplan' in cp)) errors.push({ file, message: `${where}: kneeboard.commplan "${kb.commplan}" ist keine commplan-Variable` })
      for (const k of kb.stations ?? []) {
        if (!COMMPLAN_KEYS.includes(k)) errors.push({ file, message: `${where}: unbekannte Comm-Plan-Station "${k}" (erlaubt: ${COMMPLAN_KEYS.join(', ')})` })
      }
      if (kb.stations && !kb.commplan) errors.push({ file, message: `${where}: kneeboard.stations braucht kneeboard.commplan` })
      const af = spec(kb.airfield)
      if (kb.airfield && !(af && 'pool' in af && af.pool === 'airfields')) errors.push({ file, message: `${where}: kneeboard.airfield "${kb.airfield}" ist keine Flugplatz-Variable` })
      const ch = spec(kb.chart)
      if (kb.chart && !(ch && 'chart' in ch)) errors.push({ file, message: `${where}: kneeboard.chart "${kb.chart}" ist keine Karten-Variable` })
    }
    if (sc.steps.some((st) => st.tune) && !kb) errors.push({ file, message: `${where}: Schritte mit tune brauchen ein kneeboard – sonst gibt es nichts zum Nachschlagen` })
    for (const t of texts) checkPlaceholders(t, sc.vars, file, where)
    if (sc.sketch) {
      const af = sc.vars?.[sc.sketch.airfield]
      if (!af || !('pool' in af) || af.pool !== 'airfields') errors.push({ file, message: `${where}: sketch.airfield "${sc.sketch.airfield}" muss eine Flugplatz-Variable sein` })
      const wx = sc.sketch.weather ? sc.vars?.[sc.sketch.weather] : undefined
      if (sc.sketch.weather && (!wx || !('weather' in wx))) errors.push({ file, message: `${where}: sketch.weather "${sc.sketch.weather}" muss eine Wetter-Variable sein` })
    }
  }

  for (const a of airfields) {
    if (!maps.has(a.map)) errors.push({ file: `content/airfields/${a.map}/${a.id}.yaml`, message: `Karte "${a.map}" fehlt in maps.yaml` })
  }
  if (airfields.length === 0) errors.push({ file: 'content/airfields/', message: 'Keine Flugplätze vorhanden' })

  const index: ContentIndex = {
    curriculum,
    modules,
    lessons,
    hangar,
    topics,
    drills,
    exchanges,
    scenarios,
    callsigns,
    maps,
    airfields,
    carriers,
    aircraftTypes,
    cas,
    phonetic: phonetic ?? EMPTY_PHONETIC,
    roles,
    prowords,
    brevity: brevity ?? [],
    basics: basics ?? [],
    achievements: achievements ?? [],
  }
  return { index, errors }
}
