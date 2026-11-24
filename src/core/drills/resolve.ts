/**
 * Macht aus Inhalts-Definitionen (mit Platzhaltern) konkrete, gewürfelte Funksprüche, Übungen und Szenarien.
 */
import {
  FLIGHT_STATIONS,
  type Aircraft,
  type Airfield,
  type Drill,
  type Exchange,
  type Scenario,
  type Sim,
  type Transmission,
  type VarSpec,
} from '../content/schema'
import { createRng, type Rng } from '../random/rng'
import { fillTemplate, spokenPlaceholders, type Value } from '../random/template'
import { numOf, resolveVars, type ResolveEnv } from '../random/vars'
import type { GeoPicture } from '../random/geo'
import type { ChartData } from '../charts/chart'
import { normalizeTokens } from '../phraseology/normalize'
import { runGenerator } from './generators'
import type { HearProbe, MemorySet, RadioTaskFrame, ResolvedDrill, ResolvedExchange, ResolvedScenario, ResolvedSegment, ResolvedTransmission, WhereMap } from './types'
import type { RadioStation } from '../scoring/tune'
import { isFillerText, misplacedIssue, orderMatters } from '../scoring/score'
import type { CasArea } from '../random/cas'
import { nineLineFields } from '../scoring/nineline'

// ---------------------------------------------------------------------------
// Perspektive
// ---------------------------------------------------------------------------

/** Station, aus deren Sicht gespielt wird: explizit (as) oder gewürfelt aus der Perspektivliste. */
export function chooseStation(x: Pick<Exchange, 'perspective'>, as: string | undefined, rng: Rng): string | undefined {
  if (as) return as
  if (x.perspective?.length) return rng.pick(x.perspective)
  return undefined
}

/** Setzt die eigene Position im Flight passend zur Station (lead → 1, two → 2 …). */
export function envForStation(env: ResolveEnv, station: string | undefined): ResolveEnv {
  const pos = station ? FLIGHT_STATIONS[station as keyof typeof FLIGHT_STATIONS] : undefined
  if (!pos) return env
  // Wer Three oder Four spielt, fliegt zwangsläufig im 4-ship
  const size = Math.max(env.self.size ?? 4, pos > 2 ? 4 : 2)
  return { ...env, self: { ...env.self, position: pos, size } }
}

/**
 * Bedingung `when: cas.laser` (bzw. `!cas.laser`): gesetzt ist ein Wert, der aufgelöst wird und weder leer noch
 * „no“/„false“ ist.
 */
export function whenHolds(when: string | undefined, f: (s: string) => string): boolean {
  if (!when) return true
  const negate = when.startsWith('!')
  const path = negate ? when.slice(1) : when
  const v = f(`{${path}}`).trim()
  const set = v !== `{${path}}` && v !== '' && !/^(no|false)$/i.test(v)
  return negate ? !set : set
}

const READ_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 }

/** Lesbarkeit aus dem Inhalt: Zahl oder Text mit Platzhalter („{rd}“ → „3“ oder „three“). */
export function readabilityOf(r: number | string | undefined, f: (s: string) => string): number | undefined {
  if (r === undefined) return undefined
  if (typeof r === 'number') return r
  const t = f(r).trim().toLowerCase()
  const n = READ_WORDS[t] ?? Number(t)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined
}

function transmission(t: Transmission, f: (s: string) => string, station: string | undefined, usesStations: boolean, size: number): ResolvedTransmission {
  const pos = t.station ? FLIGHT_STATIONS[t.station as keyof typeof FLIGHT_STATIONS] : undefined
  return {
    speaker: f(t.speaker),
    you: station && usesStations ? t.station === station : t.you,
    station: t.station,
    skip: (pos !== undefined && pos > size) || !whenHolds(t.when, f),
    channel: t.channel,
    radio: t.radio,
    readability: readabilityOf(t.readability, f),
    interference: t.interference,
    pace: t.pace,
    mix: t.mix,
    note: t.note && f(t.note),
    segments: t.segments.filter((s) => whenHolds(s.when, f)).map((s) => ({
      text: f(s.text),
      role: s.role,
      note: s.note && f(s.note),
      optional: s.optional,
      critical: s.critical,
      alt: s.alt?.map(f),
      weak: s.weak?.map(f),
      weakNote: s.weakNote && f(s.weakNote),
      tolerance: s.tolerance,
      free: s.free,
      more: s.more,
      spoken: f(spokenPlaceholders(s.text)),
    })),
  }
}

function applyVars(x: Exchange, vars: Record<string, Value>, station?: string, size = 4): ResolvedExchange {
  const f = (t: string) => fillTemplate(t, vars)
  const usesStations = x.transmissions.some((t) => t.station)
  return {
    id: x.id,
    title: f(x.title),
    context: x.context && f(x.context),
    freq: x.freq && f(x.freq),
    place: x.place && f(x.place),
    layer: x.layer,
    transmissions: x.transmissions.map((t) => transmission(t, f, station, usesStations, size)),
  }
}

/**
 * Eigenes Rufzeichen aus einem Pool (C-F5): Wer im Profil „Viper“ heißt, ist in der A-10-Spur „Hawg“. Der Name
 * hängt nur vom eigenen Rufzeichen ab, damit ein Durchlauf (Lektion, Szenario) durchgehend denselben hat.
 */
export function envForPool(env: ResolveEnv, pool: string | undefined): ResolveEnv {
  const names = pool ? env.content.callsigns[pool] : undefined
  if (!names?.length || names.includes(env.self.name)) return env
  const name = createRng(`pool/${pool}/${env.self.name}/${env.self.flight}`).pick(names)
  return { ...env, self: { ...env.self, name } }
}

export function resolveExchange(x: Exchange, env: ResolveEnv, opts: { as?: string; extra?: Record<string, VarSpec> } = {}): ResolvedExchange {
  const station = chooseStation(x, opts.as, env.rng)
  const e = envForStation(envForPool(env, x.callsignPool), station)
  const vars = resolveVars({ ...x.vars, ...opts.extra }, e)
  return applyVars(x, vars, station, e.self.size)
}

function defaultTransmission(x: ResolvedExchange, index: number | undefined): number {
  if (index !== undefined) return index
  const i = x.transmissions.findIndex((t) => t.you && !t.skip)
  return i >= 0 ? i : 0
}

const same = (a: string, b: string) => normalizeTokens(a).join(' ') === normalizeTokens(b).join(' ')

/** Funkspruch + Variablen einer Übung auflösen (Übungs-Variablen überschreiben die des Funkspruchs). */
function withCall(drill: Drill & { call?: string; as?: string }, env: ResolveEnv) {
  const x = drill.call ? env.content.exchanges.get(drill.call) : undefined
  if (drill.call && !x) throw new Error(`Funkspruch "${drill.call}" fehlt`)
  const station = x ? chooseStation(x, drill.as, env.rng) : undefined
  const e = envForStation(envForPool(env, drill.callsignPool ?? x?.callsignPool), station)
  const vars = resolveVars({ ...x?.vars, ...drill.vars }, e)
  return { x, vars, exchange: x ? applyVars(x, vars, station, e.self.size) : undefined, f: (t: string) => fillTemplate(t, vars) }
}

/**
 * Quelle einer Merk-Übung auflösen: gehörter Funkspruch und Readback mit denselben Variablen (Übungs-Variablen
 * überschreiben die der Funksprüche), damit der Readback zu dem passt, was man gehört hat.
 */
function memorySet(
  drill: Extract<Drill, { type: 'memory' }>,
  src: Extract<Drill, { type: 'memory' }>['few'],
  env: ResolveEnv,
): { set: MemorySet; vars: Record<string, Value> } {
  const hx = env.content.exchanges.get(src.call)
  const ax = src.answerCall ? env.content.exchanges.get(src.answerCall) : hx
  if (!hx || !ax) throw new Error(`Funkspruch "${!hx ? src.call : src.answerCall}" fehlt`)
  const e = envForPool(env, drill.callsignPool ?? hx.callsignPool ?? ax.callsignPool)
  const vars = resolveVars({ ...hx.vars, ...(ax !== hx ? ax.vars : {}), ...drill.vars }, e)
  const exchange = applyVars(hx, vars, undefined, e.self.size)
  const answerExchange = ax === hx ? exchange : applyVars(ax, vars, undefined, e.self.size)
  const heard = Array.isArray(src.heard) ? src.heard : [src.heard]
  const last = Math.max(...heard)
  const answer =
    src.answer ??
    (ax === hx
      ? exchange.transmissions.findIndex((t, i) => i > last && t.you && !t.skip)
      : answerExchange.transmissions.findIndex((t) => t.you && !t.skip))
  const f = (t: string) => fillTemplate(t, vars)
  const frame = radioFrame({ ...drill, situation: src.situation ?? drill.situation }, exchange, f, vars)
  return {
    set: { ...frame, self: frame.self ?? vars.callsign?.text, exchange, heard, answerExchange, answer },
    vars,
  }
}

/** Hörprobe einer Auswahl- oder Freitext-Übung (nur mit `call`). */
function hearOf(
  drill: { call?: string; transmission?: number; noAudio?: string },
  exchange: ResolvedExchange | undefined,
  f: (t: string) => string,
): HearProbe | undefined {
  if (!drill.call || !exchange) return undefined
  return { exchange, transmission: drill.transmission ?? 0, noAudio: drill.noAudio && f(drill.noAudio) }
}

/** Rahmenleiste und Lage (call, build, cloze): Rufzeichen, Ort, Funk – Ort und Funk der Übung ersetzen die des Funkspruchs. */
function radioFrame(
  drill: { situation?: string; place?: string; freq?: string; self?: string },
  x: ResolvedExchange,
  f: (t: string) => string,
  vars: Record<string, Value>,
): RadioTaskFrame {
  return {
    self: drill.self ? f(drill.self) : vars.callsign?.text,
    place: drill.place ? f(drill.place) : x.place,
    freq: drill.freq ? f(drill.freq) : x.freq,
    situation: drill.situation && f(drill.situation),
  }
}

// ---------------------------------------------------------------------------
// Übungen
// ---------------------------------------------------------------------------

export function resolveDrill(drill: Drill, env: ResolveEnv): ResolvedDrill {
  const { rng } = env
  switch (drill.type) {
    case 'choice': {
      const { f, exchange } = withCall(drill, env)
      const order = drill.shuffle ? rng.shuffle(drill.options.map((_, i) => i)) : drill.options.map((_, i) => i)
      const answers = Array.isArray(drill.answer) ? drill.answer : [drill.answer]
      return {
        kind: 'choice',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        options: order.map((i) => f(drill.options[i])),
        correct: answers.map((a) => order.indexOf(a)).sort((a, b) => a - b),
        multi: Array.isArray(drill.answer),
        hear: hearOf(drill, exchange, f),
      }
    }
    case 'match': {
      const { f } = withCall(drill, env)
      const pairs = rng.shuffle(drill.pairs)
      const rightOrder = rng.shuffle(pairs.map((_, i) => i))
      return {
        kind: 'match',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        left: pairs.map((p) => f(p[0])),
        right: rightOrder.map((i) => f(pairs[i][1])),
        solution: pairs.map((_, i) => rightOrder.indexOf(i)),
      }
    }
    case 'build':
    case 'anatomy':
    case 'cloze': {
      const { exchange, f, vars } = withCall(drill, env)
      const transmission = defaultTransmission(exchange!, drill.transmission)
      const base = { id: drill.id, explain: drill.explain && f(drill.explain), exchange: exchange!, transmission }
      const frame = drill.type === 'anatomy' ? {} : radioFrame(drill, exchange!, f, vars)
      if (drill.type === 'anatomy') return { ...base, kind: 'anatomy', prompt: f(drill.prompt), target: drill.target }
      if (drill.type === 'cloze') {
        return { ...base, ...frame, kind: 'cloze', prompt: f(drill.prompt ?? 'Fülle die Lücken im Funkspruch.'), blanks: [...drill.blanks].sort((a, b) => a - b) }
      }
      const solution = exchange!.transmissions[transmission].segments.map((s) => s.text)
      const distractors = drill.distractors.map(f).filter((d) => !solution.some((s) => same(s, d)))
      const tiles = rng.shuffle([...solution, ...distractors]).map((text, i) => ({ key: `t${i}`, text }))
      return { ...base, ...frame, kind: 'build', prompt: f(drill.prompt ?? 'Bring die Bausteine in die richtige Reihenfolge.'), tiles, solution }
    }
    case 'memory': {
      const few = memorySet(drill, drill.few, env)
      const many = memorySet(drill, drill.many, env)
      const f = (t: string) => fillTemplate(t, few.vars)
      return {
        kind: 'memory',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        few: few.set,
        many: many.set,
        level: drill.level,
      }
    }
    case 'call': {
      const { exchange, f, vars } = withCall(drill, env)
      const x = exchange!
      const base = radioFrame(drill, x, f, vars)
      const frame = { ...base, self: base.self ?? vars.callsign.text }
      const visible = x.transmissions.filter((t) => !t.skip).length
      if (drill.expect === 'silence') {
        return {
          ...frame,
          kind: 'call',
          id: drill.id,
          prompt: f(drill.prompt ?? 'Was funkst du jetzt?'),
          explain: drill.explain && f(drill.explain),
          exchange: x,
          transmission: null,
          heard: drill.show ?? x.transmissions.length,
          expect: 'silence',
          hint: drill.hint && f(drill.hint),
        }
      }
      const t = defaultTransmission(x, drill.transmission)
      return {
        ...frame,
        kind: 'call',
        id: drill.id,
        prompt: f(drill.prompt ?? 'Du bist dran. Was funkst du?'),
        explain: drill.explain && f(drill.explain),
        exchange: x,
        transmission: t,
        heard: Math.min(drill.show ?? t, visible),
        expect: 'call',
        hint: drill.hint && f(drill.hint),
      }
    }
    case 'plot': {
      const { exchange, vars, f } = withCall(drill, env)
      const picture = vars[drill.geo]?.data as GeoPicture | undefined
      if (!picture) throw new Error(`Übung "${drill.id}": geo-Variable "${drill.geo}" fehlt`)
      return {
        kind: 'plot',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        mode: drill.mode,
        picture,
        group: Math.min(drill.group, picture.groups.length) - 1,
        context: drill.context && f(drill.context),
        exchange,
        bearingTolerance: drill.bearingTolerance,
        rangeTolerance: drill.rangeTolerance,
      }
    }
    case 'chart-tap': {
      const { vars, f } = withCall(drill, env)
      const chart = vars[drill.chart]?.data as ChartData | undefined
      if (!chart) throw new Error(`Übung "${drill.id}": Karten-Variable "${drill.chart}" fehlt`)
      const targets = (Array.isArray(drill.target) ? drill.target : [drill.target]).map((t) =>
        t === 'rwy:active' ? `rwy:${chart.activeEnd}` : t,
      )
      return { kind: 'chart-tap', id: drill.id, prompt: f(drill.prompt), explain: drill.explain && f(drill.explain), chart, targets }
    }
    case 'sequence': {
      const { exchange, f } = withCall(drill, env)
      const items = exchange
        ? (drill.transmissions ?? exchange.transmissions.map((_, i) => i))
            .filter((ti) => !exchange.transmissions[ti].skip)
            .map((ti) => {
              const t = exchange.transmissions[ti]
              return { key: `s${ti}`, label: t.segments.map((s) => s.text).join(', '), speaker: t.you ? 'Du' : t.speaker, t }
            })
        : (drill.items ?? []).map((text, i) => ({ key: `s${i}`, label: f(text) }))
      return {
        kind: 'sequence',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        exchange,
        items: rng.shuffle(items),
        solution: items.map((i) => i.key),
      }
    }
    case 'form': {
      const { x, exchange, f, vars } = withCall(drill, env)
      return {
        kind: 'form',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        context: drill.context && f(drill.context),
        chart: drill.chart ? (vars[drill.chart]?.data as ChartData | undefined) : undefined,
        exchange,
        transmission: x ? (drill.transmission ?? (x.transmissions.length === 1 ? 0 : undefined)) : undefined,
        fields: drill.fields.map((fl) => ({ label: f(fl.label), accept: fl.accept.map(f), placeholder: fl.placeholder && f(fl.placeholder) })),
      }
    }
    case 'input': {
      const { f, exchange } = withCall(drill, env)
      return {
        kind: 'input',
        id: drill.id,
        prompt: f(drill.prompt),
        explain: drill.explain && f(drill.explain),
        hear: hearOf(drill, exchange, f),
        accept: drill.accept.map(f),
        hint: drill.hint && f(drill.hint),
        placeholder: drill.placeholder && f(drill.placeholder),
      }
    }
    case 'nineline': {
      const x = env.content.exchanges.get(drill.call)
      if (!x) throw new Error(`Funkspruch "${drill.call}" fehlt`)
      const rb = drill.readback ? env.content.exchanges.get(drill.readback) : undefined
      const e = envForPool(env, drill.callsignPool ?? x.callsignPool ?? rb?.callsignPool)
      const specs = { ...x.vars, ...rb?.vars, ...drill.vars }
      const vars = resolveVars(specs, e)
      const f = (t: string) => fillTemplate(t, vars)
      const areaName = drill.area ?? Object.keys(specs).find((k) => 'casArea' in specs[k])
      const area = areaName ? (vars[areaName]?.data as CasArea | undefined) : undefined
      if (!area) throw new Error(`Übung "${drill.id}": casArea-Variable fehlt`)
      let exchange = applyVars(x, vars, undefined, e.self.size)
      let readback = rb ? applyVars(rb, vars, undefined, e.self.size) : undefined
      // Brief und Readback im selben Funkspruch (z. B. 5-Line): Der Brief endet vor dem eigenen Readback
      if (readback && rb === x) {
        const idx = defaultTransmission(readback, undefined)
        exchange = { ...exchange, transmissions: exchange.transmissions.slice(0, idx) }
        readback = { ...readback, transmissions: readback.transmissions.slice(idx) }
      }
      if (readback) readback = withExtras(readback, exchange)
      const fiveline = drill.format === 'fiveline'
      return {
        kind: 'nineline',
        id: drill.id,
        prompt: f(drill.prompt ?? (fiveline ? 'Schreib den 5-Line mit.' : 'Schreib den 9-Line Zeile für Zeile mit.')),
        explain: drill.explain && f(drill.explain),
        format: drill.format,
        exchange,
        fields: nineLineFields(area, drill.format, drill.fields, exchange.transmissions.find((t) => !t.you)?.speaker),
        area,
        readback: readback ? { exchange: readback, transmission: defaultTransmission(readback, undefined) } : undefined,
        reveal: drill.reveal,
        sketch: drill.sketch,
        self: vars.callsign.text,
      }
    }
    case 'generated': {
      const resolved = runGenerator(drill.generator, drill.params, env)
      return {
        ...resolved,
        id: drill.id,
        prompt: drill.prompt ? fillTemplate(drill.prompt, resolveVars(drill.vars, env)) : resolved.prompt,
        explain: drill.explain ?? resolved.explain,
      }
    }
  }
}

/**
 * Readback zum 9-Line: Was der JTAC sonst noch gesagt hat (IP, Kurs, Freunde …), darf man zurücklesen. Es hängt als
 * optionaler Teil an beliebiger Stelle an – dann zählt es nicht als Fehler, und die Übung meldet es als „zusätzlich“.
 */
function withExtras(rb: ResolvedExchange, brief: ResolvedExchange): ResolvedExchange {
  const idx = defaultTransmission(rb, undefined)
  const own = rb.transmissions[idx]
  if (!own) return rb
  const key = (t: string) => normalizeTokens(t).join(' ')
  const have = new Set(own.segments.map((s) => key(s.text)))
  const extras = brief.transmissions
    .filter((t) => !t.you && !t.skip)
    .flatMap((t) => t.segments)
    .filter((s) => ['value', 'position', 'info', 'instruction'].includes(s.role) && !have.has(key(s.text)))
    .filter((s, i, all) => all.findIndex((o) => key(o.text) === key(s.text)) === i)
    .map((s) => ({ text: s.text, role: s.role, note: `Darfst du zurücklesen, musst du aber nicht.${s.note ? ` ${s.note}` : ''}`, optional: true, free: true }))
  const transmissions = rb.transmissions.map((t, i) => (i === idx ? { ...t, segments: [...t.segments, ...extras] } : t))
  return { ...rb, transmissions }
}

// ---------------------------------------------------------------------------
// Szenarien
// ---------------------------------------------------------------------------

export function resolveScenario(sc: Scenario, env: ResolveEnv): ResolvedScenario {
  const e = envForStation(envForPool(env, sc.callsignPool), sc.as)
  const vars = resolveVars(sc.vars, e)
  const f = (t: string) => fillTemplate(t, vars)
  const size = e.self.size ?? 4
  const tr = (t: Transmission) => transmission(t, f, sc.as, false, size)
  const visible = (list: Transmission[]) => list.map(tr).filter((t) => !t.skip)

  // Ort fortschreiben: Ein Schritt mit `place` gilt, bis ein späterer einen neuen nennt
  let place = sc.place && f(sc.place)
  const steps = sc.steps.map((st) => {
    if (st.place) place = f(st.place)
    const you = st.you
      ? (() => {
          const t = { ...tr(st.you.transmission), you: true }
          const solution = t.segments.map((s) => s.text)
          const distractors = st.you.distractors.map(f).filter((d) => !solution.some((s) => same(s, d)))
          const tiles = env.rng.shuffle([...solution, ...distractors]).map((text, i) => ({ key: `t${i}`, text }))
          const full = solution.join(', ')
          const options = env.rng.shuffle([full, ...(st.you.wrong ?? []).map(f)])
          return { mode: st.you.mode, transmission: t, tiles, options, correct: options.indexOf(full), hint: st.you.hint && f(st.you.hint) }
        })()
      : undefined
    return {
      stage: f(st.stage),
      tune: st.tune
        ? {
            name: f(st.tune.name),
            freq: f(st.tune.freq),
            channel: st.tune.channel && f(st.tune.channel),
            where: fillWhere(st.tune.where, f) ?? fillWhere(sc.kneeboard?.where, f),
          }
        : undefined,
      situation: st.situation && f(st.situation),
      task: st.task && f(st.task),
      place,
      freq: st.freq && f(st.freq),
      pos: st.pos,
      hear: visible(st.hear),
      you,
      silence: st.silence,
      decode: st.decode
        ? (() => {
            const area = vars[st.decode.area]?.data as CasArea
            const observer = st.hear.length ? f(st.hear[0].speaker) : undefined
            return { format: st.decode.format, area, fields: nineLineFields(area, st.decode.format, st.decode.fields, observer) }
          })()
        : undefined,
      reply: visible(st.reply),
      explain: st.explain && f(st.explain),
      critical: st.critical,
    }
  })

  let sketch: ResolvedScenario['sketch']
  if (sc.sketch) {
    const af = vars[sc.sketch.airfield]
    const wx = sc.sketch.weather ? vars[sc.sketch.weather] : undefined
    if (af?.data) {
      sketch = {
        airfield: af.data as Airfield,
        runway: af.fields?.runway?.text,
        wind: wx?.fields?.windSpeed
          ? { dir: numOf(wx.fields.windDir) ?? 0, speed: numOf(wx.fields.windSpeed) ?? 0, text: wx.fields.wind.text }
          : undefined,
      }
    }
  }
  // Alle Comm-Plan-Stationen (für „falsche Frequenz erwischt“) und das Kneeboard
  const commplanVar = Object.entries(sc.vars ?? {}).find(([, spec]) => 'commplan' in spec)?.[0]
  const cpFields = commplanVar ? vars[commplanVar]?.fields ?? {} : {}
  const station = (k: string) => {
    const s = cpFields[k]?.fields
    return s ? { name: s.name.text, channel: s.channel.text, freq: s.freq.text } : null
  }
  const stations: RadioStation[] = Object.keys(cpFields)
    .map(station)
    .filter((s): s is NonNullable<typeof s> => !!s)

  let kneeboard: ResolvedScenario['kneeboard']
  const kb = sc.kneeboard
  if (kb) {
    const kbFields = kb.commplan ? vars[kb.commplan]?.fields ?? {} : {}
    const keys = kb.stations ?? Object.keys(kbFields)
    const kbStations = keys
      .map((k) => kbFields[k]?.fields)
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => ({ name: s.name.text, channel: s.channel.text, freq: s.freq.text }))
    const afv = kb.airfield ? vars[kb.airfield] : undefined
    const a = afv?.data as Airfield | undefined
    const airfieldRows = a
      ? [
          { label: 'Platz', value: `${a.name}${a.icao ? ` (${a.icao})` : ''}` },
          { label: 'Platzhöhe', value: afv!.fields?.elevation?.text ?? 'unbekannt' },
          { label: 'Bahnen', value: a.runways.join(', ') },
          ...(a.tacan ? [{ label: 'TACAN', value: a.tacan }] : []),
          ...(a.ils ? [{ label: 'ILS', value: a.ils }] : []),
        ]
      : []
    kneeboard = {
      title: kb.title ? f(kb.title) : 'Comm Card',
      stations: kbStations,
      airfieldRows,
      rows: kb.rows.map((r) => ({ label: f(r.label), value: f(r.value) })),
      chart: kb.chart ? (vars[kb.chart]?.data as ChartData | undefined) : undefined,
      where: fillWhere(kb.where, f),
    }
  }
  return { id: sc.id, title: f(sc.title), summary: f(sc.summary), self: e.self, steps, sketch, kneeboard, stations }
}

function fillWhere(where: Partial<Record<string, string>> | undefined, f: (t: string) => string): WhereMap | undefined {
  if (!where) return undefined
  const out: WhereMap = {}
  for (const [k, v] of Object.entries(where)) if (v) out[k as keyof WhereMap] = f(v)
  return Object.keys(out).length ? out : undefined
}

// ---------------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------------

/** Prüft eine Baukasten-Lösung streng gegen die Musterreihenfolge (Texte in Reihenfolge). */
export function checkBuild(answer: readonly string[], solution: readonly string[]): boolean {
  return answer.length === solution.length && answer.every((a, i) => same(a, solution[i]))
}

/** Was der Baukasten von einem Teil des Funkspruchs braucht. */
export type BuildSegment = Pick<ResolvedSegment, 'text' | 'role' | 'alt' | 'free' | 'optional' | 'critical'>

/**
 * Bewertung eines gewählten Bausteins: `ok`, `moved` (steht woanders als in der Musterlösung), `extra` (gehört nicht
 * in den Funkspruch) oder `duplicate` (derselbe Teil zum zweiten Mal, z. B. als Variante).
 */
export type BuildTileStatus = 'ok' | 'moved' | 'extra' | 'duplicate'

export interface BuildCheck {
  correct: boolean
  /** Je gewählter Baustein, in der Reihenfolge der Antwort: zugeordneter Teil (Index) und Bewertung. */
  tiles: { segment: number | null; status: BuildTileStatus }[]
  /** Pflichtteile, die fehlen. */
  missing: number[]
  /** Optionale Teile, die weggelassen wurden. */
  skipped: number[]
  /** Mindestens ein Baustein steht woanders als in der Musterlösung (bei richtiger Antwort: „auch richtig, üblicher ist …“). */
  reordered: boolean
  /** Hinweise auf Deutsch, je Fehler einer – wie bei der Funkspruch-Bewertung. */
  issues: string[]
}

/** Passt der Text eines Bausteins zu einem Teil – wörtlich oder als gleichwertige Formulierung (`alt`)? */
export function tileMatches(text: string, seg: Pick<BuildSegment, 'text' | 'alt'>): boolean {
  return same(seg.text, text) || (seg.alt ?? []).some((a) => same(a, text))
}

/**
 * Baukasten-Antwort nach denselben Regeln wie ein getippter Funkspruch (`scoreCall`):
 * - Teile mit `free` dürfen an beliebiger Stelle stehen („request startup, information Golf“).
 * - Varianten (`alt`) gelten wie der Text.
 * - Optionale Teile dürfen fehlen.
 * - Die Reihenfolge ist Pflicht nur für den Aufbau – erst wen du rufst, dann wer du bist (`orderMatters`). Steht ein
 *   anderer Teil woanders als in der Musterlösung, ist die Antwort richtig, mit Hinweis auf die übliche Reihenfolge.
 * Falsch sind überzählige Bausteine (Störbausteine), fehlende Pflichtteile und ein falscher Aufbau.
 */
export function evaluateBuild(answer: readonly string[], segments: readonly BuildSegment[], roleLabel: (role: string) => string = (r) => r): BuildCheck {
  const taken = segments.map(() => false)
  const tiles: BuildCheck['tiles'] = answer.map((text) => {
    const candidates = segments.map((_, i) => i).filter((i) => tileMatches(text, segments[i]))
    if (candidates.length === 0) return { segment: null, status: 'extra' }
    const open = candidates.find((i) => !taken[i])
    if (open === undefined) return { segment: candidates[0], status: 'duplicate' }
    taken[open] = true
    return { segment: open, status: 'ok' }
  })

  // Reihenfolge: Die längste Folge von Bausteinen in Musterreihenfolge bleibt stehen, die übrigen gelten als verschoben.
  // Adressat und Rufzeichen wiegen schwerer – verschoben ist dann eher eine Ergänzung als der Aufbau.
  const placed = tiles.filter((t) => t.status === 'ok' && !segments[t.segment!].free)
  const weight = (t: (typeof placed)[number]): number => (orderMatters(segments[t.segment!], segments) ? 100 : 1)
  const best = placed.map(weight)
  const prev = placed.map(() => -1)
  for (let b = 0; b < placed.length; b++) {
    for (let a = 0; a < b; a++) {
      if (placed[a].segment! < placed[b].segment! && best[a] + weight(placed[b]) > best[b]) {
        best[b] = best[a] + weight(placed[b])
        prev[b] = a
      }
    }
  }
  let end = -1
  for (let k = 0; k < placed.length; k++) if (end < 0 || best[k] > best[end]) end = k
  const keep = new Set<number>()
  for (let k = end; k >= 0; k = prev[k]) keep.add(k)
  placed.forEach((t, k) => {
    if (!keep.has(k)) t.status = 'moved'
  })

  const missing = segments.map((_, i) => i).filter((i) => !taken[i] && !segments[i].optional)
  const skipped = segments.map((_, i) => i).filter((i) => !taken[i] && segments[i].optional)
  const issues: string[] = []
  const label = (i: number) => `„${segments[i].text}“ (${roleLabel(segments[i].role)})`
  tiles.forEach((t, pos) => {
    if (t.status === 'extra') {
      issues.push(isFillerText(answer[pos]) ? `Überflüssig: „${answer[pos]}“ – im Funk gilt: so kurz wie möglich.` : `Gehört nicht hinein: „${answer[pos]}“.`)
    }
    if (t.status === 'duplicate') issues.push(`Doppelt: „${answer[pos]}“ – ${label(t.segment!)} kommt nur einmal vor.`)
  })
  for (const i of missing) issues.push(`${segments[i].critical ? 'Pflichtteil fehlt' : 'Es fehlt'}: ${label(i)}.`)
  for (const t of tiles) if (t.status === 'moved') issues.push(misplacedIssue(t.segment!, segments, roleLabel))
  for (const i of skipped) issues.push(`Weggelassen (optional): ${label(i)}.`)

  const correct =
    missing.length === 0 && tiles.every((t) => t.status === 'ok' || (t.status === 'moved' && !orderMatters(segments[t.segment!], segments)))
  return { correct, tiles, missing, skipped, reordered: tiles.some((t) => t.status === 'moved'), issues }
}

const ABBREVIATIONS = new Set(['bzw', 'ca', 'nr', 'vgl', 'ggf', 'usw', 'inkl', 'evtl', 'etc', 'abs', 'kap', 'ff', 'sog'])

/** Erklärtext in Sätze teilen – ohne an Abkürzungen („z. B.“, „bzw.“) zu trennen. */
function sentences(text: string): string[] {
  const out: string[] = []
  let start = 0
  const re = /[.!?]["“)*_]*\s+/g
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const before = text.slice(start, m.index)
    const word = /([\p{L}]+)$/u.exec(before)?.[1] ?? ''
    if (word.length === 1 || ABBREVIATIONS.has(word.toLowerCase())) continue
    out.push(text.slice(start, m.index + m[0].length).trim())
    start = m.index + m[0].length
  }
  if (start < text.length) out.push(text.slice(start).trim())
  return out.filter(Boolean)
}

/**
 * Erklärung einer Baukasten-Übung nach einer falschen Antwort: Sätze, die einen Störbaustein zitieren, den man gar
 * nicht gewählt hat („„request taxi“ wäre der nächste Schritt …“), passen nicht zum Fehler und fallen weg – außer, sie
 * zitieren auch einen Teil der Lösung („„ready for departure“, nicht „ready for takeoff““). Übrig bleibt, was allgemein
 * gilt. `undefined`, wenn nichts übrig bleibt.
 */
export function explainForBuild(
  explain: string | undefined,
  unchosenDistractors: readonly string[],
  segments: readonly Pick<BuildSegment, 'text' | 'alt'>[] = [],
): string | undefined {
  if (!explain || unchosenDistractors.length === 0) return explain
  const quotes = (s: string) => [...s.matchAll(/[„"]([^“"]+)[“"]/g)].map((m) => m[1].replace(/[*_`]/g, ''))
  const offTopic = (s: string) => {
    const q = quotes(s)
    return q.some((x) => unchosenDistractors.some((d) => same(d, x))) && !q.some((x) => segments.some((seg) => tileMatches(x, seg)))
  }
  const all = sentences(explain)
  const kept: string[] = []
  all.forEach((s, i) => {
    if (offTopic(s)) return
    // „Und das Rufzeichen …“ ohne den Satz davor: ohne „Und“
    const dangling = i > 0 && offTopic(all[i - 1]) && /^Und \S/.test(s)
    kept.push(dangling ? s.charAt(4).toUpperCase() + s.slice(5) : s)
  })
  return kept.length ? kept.join(' ') : undefined
}

export interface ProfileFilter {
  sims: readonly Sim[]
  aircraft: readonly Aircraft[]
}

/**
 * Passt eine Übung zum Profil? Ohne sims/aircraft-Angabe immer. Mit Angabe nur, wenn sich die Listen
 * überschneiden. Ein leeres Profil (nichts gewählt) zeigt alles.
 */
export function matchesProfile(item: { sims?: readonly Sim[]; aircraft?: readonly Aircraft[] }, profile: ProfileFilter): boolean {
  const simOk = !item.sims?.length || !profile.sims.length || item.sims.some((s) => profile.sims.includes(s))
  const acOk = !item.aircraft?.length || !profile.aircraft.length || item.aircraft.some((a) => profile.aircraft.includes(a))
  return simOk && acOk
}
