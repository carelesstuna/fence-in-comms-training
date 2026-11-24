/**
 * Zod-Schemas für alle Inhaltsdateien unter `content/`.
 * Jede Inhaltsdatei wird beim Laden (Browser) und beim `npm run validate` (Node) hiermit geprüft.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Grundbegriffe
// ---------------------------------------------------------------------------

/** Wissensebene: offizielle Phraseologie, Community-Praxis oder Sim-/Flugzeug-Detail. */
export const LAYERS = ['core', 'community', 'sim'] as const
export const layerSchema = z.enum(LAYERS)
export type Layer = z.infer<typeof layerSchema>

export const SIMS = ['dcs', 'bms', 'il2', 'srs'] as const
export const simSchema = z.enum(SIMS)
export type Sim = z.infer<typeof simSchema>

/**
 * Flugzeug-ID. Welche IDs es gibt, steht allein in content/pools/aircraft.yaml – der Validator prüft
 * jeden Verweis (:::aircraft, Profilfilter, Module) gegen diese Liste.
 */
export const aircraftSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'Flugzeug-IDs bestehen aus a-z, 0-9 und Bindestrichen')
export type Aircraft = z.infer<typeof aircraftSchema>

/** Epochen nach Funk-Merkmalen (docs/content-plan/flugzeuge-und-epochen.md). */
export const ERAS = ['ww2', 'cold-war', 'modern'] as const
export const eraSchema = z.enum(ERAS)
export type Era = z.infer<typeof eraSchema>

/** Feste Skizzen für Leseseiten (::sketch{kind=…}), gezeichnet in src/components/BullseyeSketch.tsx. */
export const SKETCHES = ['bullseye', 'from-to', 'variation'] as const
export type SketchKind = (typeof SKETCHES)[number]

/**
 * Phraseologie einer Karte (E3-12): `faa` = US-Form („altimeter“ in inHg, „descend and maintain“, Sicht in Meilen),
 * `icao` = ICAO-Form („QNH“ in hPa, „descend to“, Sicht in Kilometern). Würfel und Funksprüche folgen dem Platz, wenn
 * im Profil „Kartenabhängig“ eingestellt ist; Standard ist überall die US-Form (`spokenPhraseology`).
 */
export const PHRASEOLOGIES = ['faa', 'icao'] as const
export const phraseologySchema = z.enum(PHRASEOLOGIES, { error: 'phraseology fehlt oder ist ungültig: faa oder icao' })
export type Phraseology = z.infer<typeof phraseologySchema>

/** Rollen der Segmente eines Funkspruchs (Funkspruch-Anatomie). Labels/Farben: content/glossary/roles.yaml */
export const ROLES = [
  'addressee',
  'callsign',
  'position',
  'intent',
  'info',
  'request',
  'instruction',
  'value',
  'proword',
  'brevity',
] as const
export const roleSchema = z.enum(ROLES)
export type Role = z.infer<typeof roleSchema>

export const ROLE_COLORS = ['sky', 'amber', 'violet', 'teal', 'slate', 'green', 'orange', 'pink', 'lime', 'red'] as const

/**
 * „Mehr dazu“: Link unter der Erklärung eines Funkspruch-Teils. `to` ist ein Pfad in der App (das Glossar
 * /glossary mit ?q=, ?tab=, ?cat= oder eine Themenseite /wissen/<id>; geprüft vom Validator, siehe
 * core/glossary/more.ts), `label` der Text des Links ohne „Mehr dazu:“ davor.
 */
const moreFields = { to: z.string().min(1), label: z.string().min(1) }
export const moreSchema = z.object(moreFields).strict()
export type More = z.infer<typeof moreSchema>

function isRegex(source: string): boolean {
  try {
    new RegExp(source, 'i')
    return true
  } catch {
    return false
  }
}

/** Standardziel einer Rolle. `when` (regulärer Ausdruck, Groß-/Kleinschreibung egal): Link nur, wenn der Text des Teils passt. */
export const roleMoreOneSchema = z
  .object({ ...moreFields, when: z.string().min(1).refine(isRegex, 'kein gültiger regulärer Ausdruck').optional() })
  .strict()
export type RoleMoreOne = z.infer<typeof roleMoreOneSchema>
/**
 * Ein Ziel oder eine Liste: Es gilt das erste, dessen `when` zum Text des Teils passt (eines ohne `when` passt immer, es
 * steht dann am Ende). Ein einzelnes Ziel wird zur Liste mit einem Eintrag.
 */
export const roleMoreSchema = z.preprocess((v) => (Array.isArray(v) ? v : v === undefined ? v : [v]), z.array(roleMoreOneSchema).min(1))
export type RoleMore = z.infer<typeof roleMoreSchema>

const sourceSchema = z.object({
  title: z.string(),
  url: z.url().optional(),
})
export type Source = z.infer<typeof sourceSchema>

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'IDs bestehen aus a-z, 0-9 und Bindestrichen')

// ---------------------------------------------------------------------------
// Zufallsvariablen (Platzhalter in Texten: {name}, {name.feld}, {name|spoken})
// ---------------------------------------------------------------------------

export const NUMBER_KINDS = [
  'heading',
  'bearing',
  'altitude',
  'angels',
  /** Tausend Fuß mit Hunderterstelle, wie im blind-Ruf: 16.9 = 16.900 ft, „one six point niner“. */
  'thousands',
  'uhf',
  'vhf',
  'vhf-fm',
  'altimeter',
  'qnh',
  /**
   * Luftdruck nach der Phraseologie des Platzes (`airfield` ist Pflicht): US-Form 29.92 („altimeter two niner niner
   * two“), ICAO 1013 („QNH one zero one three“). Felder `word`, `other`, `unit`.
   */
  'pressure',
  'fuel',
  'time',
  'runway',
  'channel',
  'squawk',
  'speed',
  'mach',
  'playtime',
  'modex',
  /** Geländehöhe in ft MSL (Line 4 im 9-Line), Ziffer für Ziffer: 1250 → „one two five zero“. */
  'elevation',
  /** Laser-Code, vier Ziffern: erste 1, zweite 1–7, dritte und vierte 1–8 (1111–1788). */
  'lasercode',
  /** Seemeilen mit einer Nachkommastelle (Line 3): 8.5 → „eight point five“. */
  'nm',
  /**
   * Entfernung in ganzen Seemeilen wie in Bullseye und BRAA (ATP 3-52.4): 25 → „twenty-five“. Feld `digits` ist die
   * ziffernweise Form („two five“), damit Antworten beide Sprechweisen annehmen können.
   */
  'distance',
  /** Meter als ganze Zahl (Line 8, Talk-on): 1200 → „one thousand two hundred“. */
  'meters',
  /** Himmelsrichtung der 8er-Rose („south“), Unterfeld `opposite`. */
  'cardinal',
  /** MGRS-Koordinate (Line 6): „NK 1234 5678“ → „November Kilo one two three four five six seven eight“. */
  'mgrs',
  /** Zwei Buchstaben, gesprochen im Alphabet (Initialen bei Danger Close): „AK“ → „Alfa Kilo“. */
  'initials',
] as const
export type NumberKind = (typeof NUMBER_KINDS)[number]

export const PICTURE_LABELS = ['single', 'azimuth', 'range', 'wall', 'ladder', 'vic', 'champagne'] as const
export type PictureLabel = (typeof PICTURE_LABELS)[number]

/** Gemeinsame Felder: distinctFrom = muss sich von diesen (vorher definierten) Variablen unterscheiden. */
const distinct = { distinctFrom: z.array(z.string()).optional() }

/**
 * Höhe über dem Platz (E3-01): Der Bereich wird so weit nach oben geschoben, dass der kleinste Wert mindestens
 * Platzhöhe + `add` Fuß ist. `airfield` = vorher definierte Flugplatz-Variable; `unit` = Fuß pro Einheit des
 * Bereichs (1000, wenn der Bereich in Tausend Fuß zählt, z. B. `int: [2, 4]` für „leaving {altA}000“).
 */
const aboveSchema = z
  .object({
    airfield: z.string(),
    add: z.number().nonnegative().default(0),
    unit: z.number().positive().default(1),
  })
  .strict()

const oneOfItem = z.union([z.string(), z.object({ text: z.string(), spoken: z.string() }).strict()])

export const varSpecSchema = z.union([
  z
    .object({
      pool: z.string(),
      where: z.record(z.string(), z.unknown()).optional(),
      /** Nur Einträge, bei denen diese Felder gesetzt sind, z. B. [realFreqs, elevationFt]. */
      require: z.array(z.string()).optional(),
      /** Nur Flugplätze auf derselben Karte wie dieser (vorher definierte) Flugplatz, z. B. Zielplatz zum Startplatz. */
      sameMap: z.string().optional(),
      ...distinct,
    })
    .strict(),
  z
    .object({
      int: z.tuple([z.number().int(), z.number().int()]),
      step: z.number().int().positive().optional(),
      above: aboveSchema.optional(),
      ...distinct,
    })
    .strict(),
  z.object({ letter: z.literal(true), ...distinct }).strict(),
  z.object({ oneOf: z.array(oneOfItem).min(1), ...distinct }).strict(),
  z
    .object({
      number: z.enum(NUMBER_KINDS),
      /** Wertebereich in der natürlichen Einheit der Zahlenart (Fuß, MHz, Grad, Knoten …). */
      range: z.tuple([z.number(), z.number()]).optional(),
      step: z.number().positive().optional(),
      above: aboveSchema.optional(),
      /** Nur bei pressure (dort Pflicht): vorher definierte Flugplatz-Variable, deren Karte die Form bestimmt. */
      airfield: z.string().optional(),
      /** Nur bei mgrs: Stellen der Koordinate (6 = 100 m, 8 = 10 m, 10 = 1 m genau). */
      digits: z.union([z.literal(6), z.literal(8), z.literal(10)]).optional(),
      ...distinct,
    })
    .strict(),
  z
    .object({
      /**
       * Einsatzraum für CAS (Spur C): würfelt Ziel, IP, Freundkräfte, Bedrohung, Gelände und JTAC und leitet daraus
       * alle Werte des 9-Line ab ({cas.hdg}, {cas.grid}, {cas.fah.from} …). Felder: content/README.md, „Einsatzraum“.
       */
      casArea: z.literal(true),
      /** Control Type 1–3 oder gewürfelt (gleich verteilt, ⚠ Gewichtung offen). */
      control: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal('any')]).default('any'),
      terrain: z.enum(['any', 'flat', 'hills', 'mountains']).default('any'),
      time: z.enum(['any', 'day', 'night']).default('any'),
      /** Markierung in Line 7. */
      mark: z.enum(['any', 'laser', 'wp', 'ir', 'none']).default('any'),
      /**
       * Danger Close (Freunde näher als die Schwelle der Waffe). Standard `no`; ein fester Funkspruch nimmt die
       * Ansage bei `any` über `when: cas.dc` mit.
       */
      dangerClose: z.enum(['any', 'yes', 'no']).default('no'),
      /** Flugzeug-ID für die Bewaffnung (a10, f16, ah64). */
      aircraft: z.string().default('a10'),
      /** Stellen der Koordinate in Line 6. */
      gridDigits: z.union([z.literal(6), z.literal(8), z.literal(10)]).default(8),
    })
    .strict(),
  z
    .object({
      /** Wetter; mit `airfield` wird die aktive Runway gegen den Wind abgeleitet. */
      weather: z.literal(true),
      airfield: z.string().optional(),
      wind: z.enum(['any', 'calm', 'light', 'strong']).default('any'),
      sky: z.enum(['any', 'vmc', 'imc']).default('any'),
    })
    .strict(),
  z
    .object({
      /** Gewürfelter, in sich stimmiger Comm Plan (Kanäle + Frequenzen). */
      commplan: z.literal(true),
      airfield: z.string().optional(),
    })
    .strict(),
  z
    .object({
      /**
       * Abgeleiteter Wert aus vorher definierten Variablen:
       * offset (from + add), reciprocal (Gegenkurs/Gegenbahn), min/max/sum (über `of`).
       */
      derive: z.enum(['offset', 'reciprocal', 'min', 'max', 'sum']),
      from: z.string().optional(),
      of: z.array(z.string()).min(2).optional(),
      add: z.number().optional(),
      /** Zahlenart für das Format; Standard: die Art der Ausgangsvariable. */
      kind: z.enum(NUMBER_KINDS).optional(),
    })
    .strict(),
  z
    .object({
      /**
       * Schematische Platz- oder Anflugkarte aus Flugplatzdaten (und optional Comm Plan / Wetter).
       * Die Kartenwerte stehen als Felder bereit: {apc.faf.alt}, {apc.tower}, {apc.msa} …
       */
      chart: z.enum(['airport', 'approach']),
      airfield: z.string(),
      commplan: z.string().optional(),
      weather: z.string().optional(),
      /** sim = Frequenzen aus der Sim/dem Comm Plan, real = laut echtem AIP (realFreqs). */
      freqs: z.enum(['sim', 'real']).default('sim'),
    })
    .strict(),
  z
    .object({
      /** Lagegeometrie für AWACS: Gruppen, Bullseye, BRAA, Aspekt, Picture-Label – alles stimmig berechnet. */
      geo: z.literal(true),
      groups: z.number().int().min(1).max(3).optional(),
      label: z.enum(PICTURE_LABELS).optional(),
      id: z.enum(['hostile', 'bandit', 'bogey', 'mixed']).default('hostile'),
      /** false = Core Information (vor dem Commit): nur die Gesamtzahl, jede Gruppe „group bullseye …“. */
      labelled: z.boolean().optional(),
    })
    .strict(),
])
export type VarSpec = z.infer<typeof varSpecSchema>
const varsSchema = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/), varSpecSchema).superRefine((vars, ctx) => {
  // above.airfield muss eine vorher definierte Flugplatz-Variable sein
  const before = new Map<string, VarSpec>()
  for (const [name, spec] of Object.entries(vars)) {
    const above = 'int' in spec || 'number' in spec ? spec.above : undefined
    if (above) {
      const af = before.get(above.airfield)
      if (!af || !('pool' in af) || af.pool !== 'airfields') {
        ctx.addIssue({
          code: 'custom',
          path: [name, 'above', 'airfield'],
          message: `above.airfield "${above.airfield}" muss eine vorher definierte Variable mit pool: airfields sein`,
        })
      }
    }
    before.set(name, spec)
  }
})

/** Optionaler Profil-Filter für Übungen und Funksprüche. */
const profileFilter = {
  sims: z.array(simSchema).optional(),
  aircraft: z.array(aircraftSchema).optional(),
}

// ---------------------------------------------------------------------------
// Funksprüche (Funkspruch-Anatomie)
// ---------------------------------------------------------------------------

/** Bedingung für Segmente und Übertragungen: Pfad einer Variablen, optional mit `!` verneint. */
export const whenSchema = z.string().regex(/^!?[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/, 'when: Pfad wie cas.laser oder !cas.laser')

export const segmentSchema = z
  .object({
    text: z.string().min(1),
    role: roleSchema,
    note: z.string().optional(),
    /** Beim Tippen/Sprechen: darf fehlen. */
    optional: z.boolean().optional(),
    /** Beim Tippen/Sprechen: Pflichtteil, der nie fehlen darf (hold short, Rufzeichen …). */
    critical: z.boolean().optional(),
    /** Gleichwertige Formulierungen, z. B. ["five by five"] für "loud and clear". */
    alt: z.array(z.string()).optional(),
    /**
     * Formulierungen, die gelten, aber nicht der Vorschrift entsprechen (z. B. „Two“ statt des vollen
     * Flight-Rufzeichens): richtig mit Teilpunkten und Hinweis. `weakNote` sagt, was die Vorschrift verlangt.
     */
    weak: z.array(z.string()).optional(),
    weakNote: z.string().optional(),
    /** Erlaubte Abweichung bei Zahlen, z. B. 3 für ±3° bei Peilungen. */
    tolerance: z.number().nonnegative().optional(),
    /** Darf an beliebiger Stelle im Funkspruch stehen. */
    free: z.boolean().optional(),
    /** „Mehr dazu“-Link in der Erklärung dieses Teils; übersteuert das Standardziel der Rolle (roles.yaml). */
    more: moreSchema.optional(),
    /**
     * Nur, wenn dieser Wert gesetzt ist (Pfad ohne Klammern, z. B. `cas.laser`); mit `!` davor nur, wenn nicht.
     * Leerer Text, „no“ und „false“ gelten als nicht gesetzt.
     */
    when: whenSchema.optional(),
  })
  .strict()
export type Segment = z.infer<typeof segmentSchema>

/** Stationen mit Positionsbezug: lead/two/three/four setzen die eigene Position im Flight. */
export const FLIGHT_STATIONS = { lead: 1, two: 2, three: 3, four: 4 } as const

/** Funkgeräte an einer Übertragung (Anzeige, später Klang). */
export const RADIOS = ['uhf', 'vhf', 'fm', 'intercom'] as const
export type RadioKind = (typeof RADIOS)[number]

export const transmissionSchema = z
  .object({
    /** Anzeigename der sprechenden Station, z. B. "{airfield.name} Ground" oder "{callsign}". */
    speaker: z.string(),
    /** true = das ist der Funkspruch des Nutzers (wird im Baukasten geübt). */
    you: z.boolean().default(false),
    /**
     * Station dieser Übertragung (lead, two, three, four, front, rear, pilot, rio …).
     * Mit `perspective` am Funkspruch wird die gewählte Station zu „du“.
     */
    station: z.string().regex(/^[a-z][a-z0-9-]*$/).optional(),
    channel: z.enum(['radio', 'intercom']).default('radio'),
    /**
     * Funkgerät, auf dem gesprochen wird (C-F6): uhf, vhf (AM), fm (VHF-FM, JTAC und Bodentruppen) oder intercom.
     * Wird beim Sprecher angezeigt; später wählt die Audio-Kette danach den Klang.
     */
    radio: z.enum(RADIOS).optional(),
    /**
     * Lesbarkeit beim Empfänger, 1 (unlesbar) bis 5 (einwandfrei), wie auf der ICAO-Skala. Ohne Angabe würfelt die
     * Wiedergabe 4 oder 5. Als Text mit Platzhalter („{rd}“), wenn die Übung sie würfelt (Zahl oder one … five).
     */
    readability: z.union([z.number().int().min(1).max(5), z.string()]).optional(),
    /** Störungen (Knacken, Aussetzer, Schwund): none, light, heavy. Ohne Angabe folgt sie der Lesbarkeit. */
    interference: z.enum(['none', 'light', 'heavy']).optional(),
    /** Sprechweise: lines = Teil für Teil mit Pause, zum Mitschreiben (9-Line, Readback dazu). */
    pace: z.enum(['lines']).optional(),
    /**
     * Überlagerung: Diese Übertragung ist das, was bei Dritten ankommt, wenn die zwei genannten Übertragungen (Indizes)
     * gleichzeitig senden – beide Stimmen verstümmelt unter einem lauten Pfeifton. Die Segmente beschreiben das Geräusch
     * in eckigen Klammern, z. B. „[Pfeifton]“.
     */
    mix: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]).optional(),
    segments: z.array(segmentSchema).min(1),
    note: z.string().optional(),
    /** Nur, wenn dieser Wert gesetzt ist (wie `when` am Segment). */
    when: whenSchema.optional(),
  })
  .strict()
export type Transmission = z.infer<typeof transmissionSchema>

export const exchangeSchema = z
  .object({
    id,
    title: z.string(),
    /** Erklärung zum Funkspruch für Leseseiten. In Übungen erscheint sie nicht – dort steht die Lage der Übung. */
    context: z.string().optional(),
    /**
     * Funkgerät, auf dem der Austausch läuft: Station und Frequenz, z. B. "Ground · {airfield.gnd} {airfield.gnd.band}".
     * Steht in Übungen in der Rahmenleiste unter „Funk“.
     */
    freq: z.string().optional(),
    /** Ort für die Rahmenleiste: Flugplatz oder kurz, wo du bist (z. B. "{airfield.name}", "Unterwegs zur CAP"). */
    place: z.string().optional(),
    layer: layerSchema.default('core'),
    ...profileFilter,
    /** Stationen, aus deren Sicht der Austausch gespielt werden kann (z. B. [lead, two]). */
    perspective: z.array(z.string()).min(1).optional(),
    /** Eigenes Rufzeichen aus diesem Pool (z. B. attack: „Hawg 1-1“), auch wenn das Profil ein anderes nennt (C-F5). */
    callsignPool: z.string().optional(),
    vars: varsSchema.optional(),
    transmissions: z.array(transmissionSchema).min(1),
  })
  .strict()
export type Exchange = z.infer<typeof exchangeSchema>
export const exchangeFileSchema = z.array(exchangeSchema)

// ---------------------------------------------------------------------------
// Übungen (Drills)
// ---------------------------------------------------------------------------

const drillBase = {
  id,
  prompt: z.string().optional(),
  explain: z.string().optional(),
  layer: layerSchema.default('core'),
  ...profileFilter,
  vars: varsSchema.optional(),
  /**
   * Prüfungsfrage (S-15): kommt nur in der Modulprüfung vor, in keiner Lektion und keiner Einstufung. Die Lektion, zu der
   * sie gehört, steht am Anfang der ID (`m3-l5-x-…` gehört zu `m3-l5`). Der `prompt` muss für sich allein verständlich sein.
   */
  exam: z.boolean().optional(),
  /** Eigenes Rufzeichen aus diesem Pool (C-F5); ohne Angabe gilt der Pool des Funkspruchs (`call`). */
  callsignPool: z.string().optional(),
}

/**
 * Rahmen und Lage für Übungen, in denen du selbst funkst (call, build, cloze). Oben steht die Rahmenleiste (Rufzeichen,
 * Ort, Funk), darunter die Lage (`situation`) und der Auftrag (`prompt`).
 */
const radioTask = {
  /** Lage: Zustand des Flugzeugs, genaue Position, was du weißt (z. B. ATIS gehört). Ohne Rufzeichen – das steht im Rahmen. */
  situation: z.string().optional(),
  /** Ort, falls er vom Funkspruch abweicht (sonst gilt `place` des Funkspruchs). */
  place: z.string().optional(),
  /** Funk, falls er vom Funkspruch abweicht (sonst gilt `freq` des Funkspruchs). */
  freq: z.string().optional(),
  /** Rufzeichen in der Rahmenleiste, wenn du jemand anderes spielst (Rollentausch, z. B. "{jtac}"). */
  self: z.string().optional(),
}

/**
 * Hörprobe für Auswahl- und Freitext-Übungen: Eine Übertragung aus `call` steht über der Frage und lässt sich abspielen
 * (z. B. der Ruf, dessen Lesbarkeit du melden sollst). Die Variablen der Übung gelten auch im Funkspruch.
 */
const hearProbe = {
  call: id.optional(),
  /** Index der Übertragung (Standard 0). */
  transmission: z.number().int().nonnegative().optional(),
  /** Ersatz ohne Sprachausgabe: was du sonst gehört hättest (z. B. „Du verstehst ihn nur mit Mühe.“). */
  noAudio: z.string().optional(),
}

/** Quelle einer Merk-Übung: was du hörst und was du danach zurückliest. */
const memorySource = z
  .object({
    /** Funkspruch mit dem, was du hörst. */
    call: id,
    /** Übertragung(en), die du hörst – ein Index oder eine Liste (z. B. die drei Teile des 9-Line). */
    heard: z.union([z.number().int().nonnegative(), z.array(z.number().int().nonnegative()).min(1)]),
    /** Funkspruch mit deinem Readback, falls es ein anderer ist (die Variablen gelten für beide). */
    answerCall: id.optional(),
    /** Übertragung mit deinem Readback; Standard: die erste eigene nach dem Gehörten (bzw. im answerCall). */
    answer: z.number().int().nonnegative().optional(),
    /** Lage für diese Quelle (sonst die der Übung). */
    situation: z.string().optional(),
  })
  .strict()

export const GENERATORS = [
  'phonetic-letter-to-word',
  'phonetic-word-to-letter',
  'phonetic-spell',
  'number-to-spoken',
  'spoken-to-number',
  'flight-position',
  /** Welcher Laser-Code ist gültig? (1111–1788, ohne 0 und 9) */
  'lasercode-valid',
  /** MGRS-Koordinate aus der Sprechform aufschreiben. */
  'mgrs-spoken-to-text',
] as const
export const generatorSchema = z.enum(GENERATORS)
export type GeneratorId = z.infer<typeof generatorSchema>

/** Felder des 9-Line-/5-Line-Decoders: Zeilennummer oder Remarks (Final Attack Heading, Laser-Target Line, TOT). */
const nineLineFieldKey = z.union([z.number().int().min(1).max(9), z.enum(['fah', 'ltl', 'tot'])])
export type NineLineFieldKey = z.infer<typeof nineLineFieldKey>

export const drillSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...drillBase,
      type: z.literal('choice'),
      prompt: z.string(),
      ...hearProbe,
      options: z.array(z.string()).min(2),
      /** Index der richtigen Option (vor dem Mischen) – oder mehrere Indizes für Mehrfachauswahl. */
      answer: z.union([z.number().int().nonnegative(), z.array(z.number().int().nonnegative()).min(1)]),
      shuffle: z.boolean().default(true),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      type: z.literal('match'),
      prompt: z.string(),
      pairs: z.array(z.tuple([z.string(), z.string()])).min(2),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      type: z.literal('build'),
      ...radioTask,
      call: id,
      /** Perspektive (Station), aus der der Funkspruch gespielt wird. */
      as: z.string().optional(),
      /** Index der Übertragung im Funkspruch; Standard: erste mit `you: true`. */
      transmission: z.number().int().nonnegative().optional(),
      distractors: z.array(z.string()).default([]),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      type: z.literal('anatomy'),
      prompt: z.string(),
      call: id,
      as: z.string().optional(),
      transmission: z.number().int().nonnegative().optional(),
      /** Gesuchte Rolle; jedes Segment mit dieser Rolle gilt als richtig. */
      target: roleSchema,
    })
    .strict(),
  z
    .object({
      ...drillBase,
      type: z.literal('input'),
      prompt: z.string(),
      ...hearProbe,
      accept: z.array(z.string()).min(1),
      hint: z.string().optional(),
      placeholder: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      type: z.literal('generated'),
      generator: generatorSchema,
      params: z.record(z.string(), z.unknown()).default({}),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /**
       * Merk-Übung zum Readback: Die Gegenstelle spricht, der Text erscheint Teil für Teil und verschwindet je nach Stufe
       * wieder (FIFO). Danach liest du aus dem Kopf oder vom Kneeboard zurück. Acht Stufen: Text bleibt, verschwindet
       * langsam, schnell, nur hören – jeweils mit wenig (`few`) und mit vielen Angaben (`many`).
       */
      type: z.literal('memory'),
      prompt: z.string(),
      ...radioTask,
      few: memorySource,
      many: memorySource,
      /** Stufe, mit der die Übung beginnt (1–8); danach gilt die zuletzt erreichte. */
      level: z.number().int().min(1).max(8).default(1),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /** Lückentext: einzelne Segmente einer Übertragung werden zu Eingabefeldern. */
      type: z.literal('cloze'),
      ...radioTask,
      call: id,
      transmission: z.number().int().nonnegative().optional(),
      as: z.string().optional(),
      blanks: z.array(z.number().int().nonnegative()).min(1),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /**
       * Funkspruch selbst tippen (später sprechen). Bewertet wird Segment für Segment.
       * expect: silence = die richtige Antwort ist, nichts zu sagen (z. B. nach „push“).
       */
      type: z.literal('call'),
      ...radioTask,
      call: id,
      transmission: z.number().int().nonnegative().optional(),
      as: z.string().optional(),
      expect: z.enum(['call', 'silence']).default('call'),
      /** Wie viele Übertragungen vorher zu hören sind (Standard: alle vor der eigenen). */
      show: z.number().int().nonnegative().optional(),
      hint: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /**
       * Lagebild-Decoder: place = Gruppe nach einem Call auf der Bullseye-Karte setzen,
       * bullseye/braa = Peilung und Entfernung einer gezeigten Gruppe ablesen.
       */
      type: z.literal('plot'),
      prompt: z.string(),
      /** Name der geo-Variable (in vars der Übung oder des Funkspruchs). */
      geo: z.string(),
      mode: z.enum(['place', 'bullseye', 'braa']),
      group: z.number().int().min(1).max(3).default(1),
      call: id.optional(),
      context: z.string().optional(),
      bearingTolerance: z.number().positive().default(5),
      rangeTolerance: z.number().positive().default(3),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /** Auf das richtige Element einer schematischen Karte tippen (Frequenz, FAF, MSA, Runway …). */
      type: z.literal('chart-tap'),
      prompt: z.string(),
      /** Name der Karten-Variable ({ chart: airport|approach, airfield: … }). */
      chart: z.string(),
      /** Element-ID(s), die als richtig gelten, z. B. tower oder [approach, departure]. */
      target: z.union([z.string(), z.array(z.string()).min(1)]),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /** Reihenfolge: Einträge (oder Übertragungen eines Funkspruchs) in die richtige Ordnung bringen. */
      type: z.literal('sequence'),
      prompt: z.string(),
      items: z.array(z.string()).min(2).optional(),
      call: id.optional(),
      transmissions: z.array(z.number().int().nonnegative()).min(2).optional(),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /** Formular: mehrere Felder mit eigener accept-Liste, z. B. ATIS- oder 9-Line-Decoder. */
      type: z.literal('form'),
      prompt: z.string(),
      /** Optional ein Funkspruch, der als „Mitschrift-Vorlage“ angezeigt wird. */
      call: id.optional(),
      transmission: z.number().int().nonnegative().optional(),
      /** Optionaler Markdown-Text (z. B. eine ATIS-Durchsage), Platzhalter erlaubt. */
      context: z.string().optional(),
      /** Optional eine Karten-Variable ({ chart: … }), die als Vorlage angezeigt wird. */
      chart: z.string().optional(),
      fields: z
        .array(
          z
            .object({
              label: z.string(),
              accept: z.array(z.string()).min(1),
              placeholder: z.string().optional(),
            })
            .strict(),
        )
        .min(1),
    })
    .strict(),
  z
    .object({
      ...drillBase,
      /**
       * 9-Line- bzw. 5-Line-Decoder (C-F3): Der Brief (`call`) kommt Übertragung für Übertragung, du schreibst Zeile für
       * Zeile mit (Bewertung je Zeile mit Toleranzen), danach optional der Readback (`readback`, Funkspruch mit Pflicht-Slots).
       */
      type: z.literal('nineline'),
      prompt: z.string().optional(),
      /** Der Brief des JTAC als Funkspruch (alle Übertragungen werden nacheinander gezeigt). */
      call: id,
      /** Name der casArea-Variable; ohne Angabe die erste im Funkspruch bzw. in der Übung. */
      area: z.string().optional(),
      format: z.enum(['nineline', 'fiveline']).default('nineline'),
      /** Teilmenge der Felder: Zeilennummern 1–9 und fah, ltl, tot. Ohne Angabe alle des Formats. */
      fields: z.array(nineLineFieldKey).min(1).optional(),
      /** Funkspruch mit dem Readback (die eigene Übertragung zählt, Pflicht-Slots über critical). */
      readback: id.optional(),
      /** step = Übertragungen nacheinander auf Knopfdruck, click = verdeckt bis zum Klick (später: abspielen), all = alle sofort. */
      reveal: z.enum(['step', 'click', 'all']).default('step'),
      /** Lageskizze nach dem Prüfen zeigen. */
      sketch: z.boolean().default(true),
    })
    .strict(),
])
export type Drill = z.infer<typeof drillSchema>
export const drillFileSchema = z.array(drillSchema)

// ---------------------------------------------------------------------------
// Szenarien (Walkthrough mit Funk-Log)
// ---------------------------------------------------------------------------

/** Position des eigenen Flugzeugs in der Platzskizze. */
export const SKETCH_POSITIONS = ['parking', 'taxi', 'holdshort', 'runway', 'airborne', 'pattern', 'final', 'landed'] as const

/** Fundort einer Information je Sim, z. B. wo die Frequenz im Spiel oder im Briefing steht. */
export const whereSchema = z
  .object({
    dcs: z.string().optional(),
    bms: z.string().optional(),
    il2: z.string().optional(),
    srs: z.string().optional(),
  })
  .strict()

/** Kneeboard bzw. Comm Card eines Szenarios – vor dem Start als Briefing, danach jederzeit aufklappbar. */
export const kneeboardSchema = z
  .object({
    title: z.string().optional(),
    /** Comm-Plan-Variable; ihre Stationen erscheinen als Tabelle (Kanal, Frequenz). */
    commplan: z.string().optional(),
    /** Teilmenge der Comm-Plan-Stationen, z. B. [atis, ground, tower, departure]. */
    stations: z.array(z.string()).optional(),
    /** Flugplatz-Variable für den Platzblock (Höhe, Bahnen, TACAN, ILS). */
    airfield: z.string().optional(),
    /** Karten-Variable ({ chart: … }), aufklappbar im Kneeboard. */
    chart: z.string().optional(),
    /** Eigene Zeilen, z. B. { label: "Platzfrequenz (Traffic)", value: "{af.uhf}" }. */
    rows: z.array(z.object({ label: z.string(), value: z.string() }).strict()).default([]),
    /** Wo die Werte in der jeweiligen Sim bzw. im Briefing stehen. */
    where: whereSchema.optional(),
  })
  .strict()

export const scenarioStepSchema = z
  .object({
    /** Phase für die Stufenleiste, z. B. "Startup" oder "Taxi". */
    stage: z.string(),
    /**
     * Vor diesem Schritt das Funkgerät selbst einstellen: Kanal oder Frequenz aus dem Kneeboard.
     * Erst danach ist die Station zu hören. Eine falsche Frequenz hat Folgen.
     */
    tune: z
      .object({
        /** Anzeigename der Station, z. B. "{af.name} Ground". */
        name: z.string(),
        /** Sollfrequenz, z. B. "{cp.ground.freq}". */
        freq: z.string(),
        /** Optional der Kanal (Preset), z. B. "{cp.ground.channel}". */
        channel: z.string().optional(),
        where: whereSchema.optional(),
      })
      .strict()
      .optional(),
    /** Lage: was gerade passiert und was du weißt (Markdown, Platzhalter erlaubt). */
    situation: z.string().optional(),
    /** Auftrag: was du in diesem Schritt tun sollst, ein Satz (z. B. „Melde dich beim AWACS an.“). */
    task: z.string().optional(),
    /** Ort ab diesem Schritt (Rahmenleiste), z. B. "Unterwegs zur CAP". Gilt, bis ein Schritt einen neuen nennt. */
    place: z.string().optional(),
    /** Anzeige des aktiven Funkgeräts ohne Einstellen, „Station · Frequenz“, z. B. "Crew Chief · Intercom". */
    freq: z.string().optional(),
    pos: z.enum(SKETCH_POSITIONS).optional(),
    /** Was du vor deinem Zug hörst. */
    hear: z.array(transmissionSchema).default([]),
    /** Dein Funkspruch – getippt, als Baukasten oder als Auswahl. */
    you: z
      .object({
        mode: z.enum(['type', 'build', 'choice']).default('type'),
        transmission: transmissionSchema,
        distractors: z.array(z.string()).default([]),
        /** Für mode: choice – falsche Alternativen als ganze Funksprüche. */
        wrong: z.array(z.string()).min(1).optional(),
        hint: z.string().optional(),
      })
      .strict()
      .optional(),
    /**
     * Mitschreiben im Szenario (9-Line- bzw. 5-Line-Decoder): was du in diesem Schritt hörst, schreibst du Zeile für
     * Zeile auf. `area` ist die casArea-Variable des Szenarios.
     */
    decode: z
      .object({
        area: z.string(),
        format: z.enum(['nineline', 'fiveline']).default('nineline'),
        fields: z.array(nineLineFieldKey).min(1).optional(),
      })
      .strict()
      .optional(),
    /** Die richtige Antwort ist, nichts zu sagen. */
    silence: z.boolean().default(false),
    /** Was nach deinem Zug kommt. */
    reply: z.array(transmissionSchema).default([]),
    /** Erklärung nach dem Schritt (Markdown). */
    explain: z.string().optional(),
    /**
     * Im Checkride ein kritischer Schritt: Ist hier etwas falsch (Frequenz, Funkspruch, Schweigen),
     * gilt der Checkride als nicht bestanden – egal wie gut der Rest war.
     */
    critical: z.boolean().optional(),
  })
  .strict()
export type ScenarioStep = z.infer<typeof scenarioStepSchema>

export const scenarioSchema = z
  .object({
    id,
    title: z.string(),
    summary: z.string(),
    layer: layerSchema.default('core'),
    ...profileFilter,
    vars: varsSchema.optional(),
    /** Eigene Station/Position (lead, two, three, four …). */
    as: z.string().optional(),
    /** Eigenes Rufzeichen aus diesem Pool (C-F5), z. B. attack. */
    callsignPool: z.string().optional(),
    /** Ort zu Beginn (Rahmenleiste), z. B. "{af.name}". Schritte können ihn mit `place` ändern. */
    place: z.string().optional(),
    /** Platzskizze: Flugplatz-Variable und optional Wetter-Variable (Wind-Pfeil, aktive Runway). */
    sketch: z.object({ airfield: z.string(), weather: z.string().optional() }).strict().optional(),
    /** Kneeboard/Comm Card: vor dem Start als Briefing, danach jederzeit aufklappbar. */
    kneeboard: kneeboardSchema.optional(),
    sources: z.array(sourceSchema).default([]),
    steps: z.array(scenarioStepSchema).min(1),
  })
  .strict()
export type Scenario = z.infer<typeof scenarioSchema>

// ---------------------------------------------------------------------------
// Lektionen und Hangar-Wissen (Markdown mit YAML-Frontmatter)
// ---------------------------------------------------------------------------

export const lessonMetaSchema = z
  .object({
    id,
    module: id,
    order: z.number().int(),
    title: z.string(),
    summary: z.string(),
    minutes: z.number().int().positive(),
    xp: z.number().int().positive(),
    layer: layerSchema.default('core'),
    sources: z.array(sourceSchema).default([]),
  })
  .strict()
export type LessonMeta = z.infer<typeof lessonMetaSchema>

export const HANGAR_CATEGORIES = ['technik', 'physik', 'geschichte', 'hintergrund', 'praxis'] as const
export const hangarMetaSchema = z
  .object({
    id,
    title: z.string(),
    category: z.enum(HANGAR_CATEGORIES),
    teaser: z.string(),
    /** Epoche, zu der die Karte gehört (Filter im Hangar). Ohne Angabe: epochenübergreifend. */
    era: eraSchema.optional(),
    sources: z.array(sourceSchema).default([]),
  })
  .strict()
export type HangarMeta = z.infer<typeof hangarMetaSchema>

/**
 * Themenseiten (`content/topics/<id>.md`): ausführliche Erklärung eines Grundbegriffs, aus Lektionen
 * (`[Text](/wissen/<id>)`) und aus dem Glossar („Ausführlich lesen“) aufrufbar, Route `#/wissen/<id>`.
 */
export const topicMetaSchema = z
  .object({
    id,
    title: z.string(),
    /** Ein bis zwei Sätze für die Übersicht und unter dem Titel. */
    summary: z.string(),
    layer: layerSchema.default('core'),
    /** Epoche, falls die Seite nur für eine gilt. Ohne Angabe: epochenübergreifend. */
    era: eraSchema.optional(),
    /**
     * Glossar-Begriffe (Wort oder Schreibweise), die die Seite abdeckt. Das Glossar verlinkt von dort aus auf
     * die Seite – außer ein Eintrag nennt mit `topic` selbst eine andere.
     */
    terms: z.array(z.string()).default([]),
    sources: z.array(sourceSchema).min(1, 'Eine Themenseite braucht mindestens eine Quelle'),
  })
  .strict()
export type TopicMeta = z.infer<typeof topicMetaSchema>

// ---------------------------------------------------------------------------
// Lehrplan
// ---------------------------------------------------------------------------

export const moduleSchema = z
  .object({
    id,
    code: z.string(),
    title: z.string(),
    subtitle: z.string(),
    group: z.enum(['core', 'track', 'later']),
    status: z.enum(['available', 'planned']),
    plannedFor: z.string().optional(),
    description: z.string(),
    aircraft: z.array(aircraftSchema).default([]),
    lessons: z.array(id).default([]),
    /**
     * Zahlen dürfen getippt auch in Ziffern stehen (Spur C: Grids, Höhen, Laser-Codes). Sonst gilt beim Tippen: Zahlen
     * in Worten, so wie man sie spricht. Gesprochen gelten immer beide Formen.
     */
    typedDigits: z.boolean().default(false),
    placement: z
      .object({
        drills: z.array(id).min(3),
        passScore: z.number().min(0).max(1).default(0.8),
      })
      .strict()
      .optional(),
    /**
     * Modulprüfung (S-15): Fragen aus dem Pool der Übungen mit `exam: true`, je Lektion höchstens zwei, bunt gemischt.
     * Wer besteht, hat das Modul abgeschlossen. Ohne diesen Eintrag gibt es keine Prüfung.
     */
    exam: z
      .object({
        /** Fragen je Prüfung (weniger, wenn der Pool kleiner ist). */
        size: z.number().int().min(4).max(30).default(14),
        passScore: z.number().min(0).max(1).default(0.8),
      })
      .strict()
      .optional(),
  })
  .strict()
export type Module = z.infer<typeof moduleSchema>

/** Rangprüfung: ein Szenario ohne Hilfen, bewertet erst am Ende. */
export const checkrideSchema = z
  .object({
    scenario: id,
    /** Was vorher erledigt sein muss: Modul- oder Lektions-IDs. */
    requires: z.array(id).default([]),
    /** Mindestergebnis (0–1). */
    passScore: z.number().min(0).max(1).default(0.8),
    /** Bestanden nur ohne kritischen Fehler (Pflichtteile, kritische Schritte). */
    noCritical: z.boolean().default(true),
  })
  .strict()
export type CheckrideRule = z.infer<typeof checkrideSchema>

export const rankSchema = z
  .object({
    id,
    name: z.string(),
    /** Mindest-XP für den Rang (bzw. für die Zulassung zum Checkride). */
    xp: z.number().int().nonnegative(),
    description: z.string(),
    /** Ohne Checkride gibt es den Rang allein über XP. */
    checkride: checkrideSchema.optional(),
  })
  .strict()
export type Rank = z.infer<typeof rankSchema>

export const curriculumSchema = z
  .object({
    ranks: z.array(rankSchema).min(1),
    modules: z.array(moduleSchema).min(1),
  })
  .strict()
export type Curriculum = z.infer<typeof curriculumSchema>

// ---------------------------------------------------------------------------
// Würfelpools, Flugplätze, Glossar
// ---------------------------------------------------------------------------

export const callsignPoolSchema = z.record(z.string(), z.array(z.string().min(2)).min(3))
export type CallsignPools = z.infer<typeof callsignPoolSchema>

export const mapSchema = z.array(
  z
    .object({
      id,
      name: z.string(),
      era: eraSchema.optional(),
      /** In welchen Sims es die Karte gibt. Nutzer mit dieser Sim im Profil bekommen nur Plätze solcher Karten (wenn es passende gibt). */
      sims: z.array(simSchema).optional(),
      /** Wie die Lotsen auf dieser Karte sprechen: faa (US-Form) oder icao. Pflicht, damit keine Karte stillschweigend US-Form bekommt. */
      phraseology: phraseologySchema,
    })
    .strict(),
)
export type MapInfo = z.infer<typeof mapSchema>[number]

const freq = z.number().positive()
export const airfieldSchema = z
  .object({
    id,
    /** Funkname wie im Funkspruch („Gunsan Ground“): ohne „AB“/„AFB“. Dient auch als Überschrift (Karte, Kneeboard). */
    name: z.string().refine((n) => !/\b(AB|AFB|Air Base)\b/.test(n), 'name ist der Funkname – ohne „AB“/„AFB“'),
    /** Weitere gebräuchliche Namen, z. B. [Kunsan] zu Gunsan. Der erste steht als {af.alias} bereit. */
    aliases: z.array(z.string()).default([]),
    map: id,
    icao: z.string().optional(),
    elevationFt: z.number().optional(),
    /** Runways als Paar, z. B. "13/31" oder "03L/21R". */
    runways: z.array(z.string().regex(/^\d{2}[LRC]?\/\d{2}[LRC]?$/)).min(1),
    /**
     * ATC-Frequenzen in der Sim (Tower; in DCS sprechen Ground, Tower und Approach auf derselben). Mindestens
     * eine von uhf/vhf. hf und vhfLow (Kurzwelle, tiefes VHF) zeigt DCS im Flugplatzfenster der F10-Karte.
     */
    atc: z
      .object({ uhf: freq.optional(), vhf: freq.optional(), hf: freq.optional(), vhfLow: freq.optional() })
      .strict()
      .refine((a) => a.uhf !== undefined || a.vhf !== undefined, 'atc braucht uhf oder vhf'),
    tacan: z.string().optional(),
    ils: z.string().optional(),
    tower: z.boolean().default(true),
    /** Zusätzliche Frequenzen, falls bekannt (sonst würfelt der Comm Plan sie). */
    freqs: z
      .object({ atis: freq.optional(), ground: freq.optional(), departure: freq.optional(), approach: freq.optional() })
      .strict()
      .optional(),
    /** Benannte Abstellpositionen, z. B. "apron one", "shelter 12". */
    parking: z.array(z.string()).optional(),
    /** Rollwegfolge pro Bahnrichtung, z. B. { "31": ["Alpha", "Bravo"] }. */
    taxiways: z.record(z.string(), z.array(z.string()).min(1)).optional(),
    /** Bezeichnung der Arming-/EOR-Fläche, falls bekannt. */
    arming: z.string().optional(),
    /** In der Sim mitgelieferte Karten (Kneeboard-Datei in DCS, KTO-Chart in BMS …). */
    charts: z
      .array(z.object({ sim: simSchema, name: z.string(), path: z.string().optional() }).strict())
      .optional(),
    /** Frequenzen laut echtem AIP – getrennt von den Sim-Frequenzen in `atc`/`freqs`. */
    realFreqs: z
      .object({
        atis: freq.optional(),
        clearance: freq.optional(),
        ground: freq.optional(),
        tower: freq.optional(),
        approach: freq.optional(),
        departure: freq.optional(),
      })
      .strict()
      .optional(),
    /** Quelle der echten Frequenzen, z. B. eAIP-Link mit Stand. */
    realSource: z.string().optional(),
    /** Herkunft/Verlässlichkeit der Daten. */
    verified: z.enum(['dcs-data', 'community', 'unverified']),
    notes: z.array(z.string()).default([]),
  })
  .strict()
export type Airfield = z.infer<typeof airfieldSchema>

/**
 * Würfelpools für den CAS-Einsatzraum (Spur C, content/pools/cas.yaml): benannte Punkte, Ziele, Bedrohungen und Waffen.
 */
export const casPoolSchema = z
  .object({
    /** Benannte Punkte für IP und Egress (frei erfunden). */
    ips: z.array(z.string().min(2)).min(4),
    targets: z
      .array(
        z
          .object({
            /** Line 5, wie der JTAC sie spricht: "two BMP-2 in the open". */
            text: z.string(),
            spoken: z.string().optional(),
            count: z.number().int().min(1),
            /** Stichwort für die Bewertung der Mitschrift (z. B. BMP); weitere über `alt`. */
            keyword: z.string(),
            alt: z.array(z.string()).default([]),
            kind: z.enum(['armor', 'vehicle', 'infantry', 'artillery', 'aaa']),
            /** BDA nach einem Treffer, z. B. "two BMP-2 destroyed". */
            bda: z.string(),
          })
          .strict(),
      )
      .min(3),
    threats: z
      .array(
        z
          .object({
            name: z.string(),
            spoken: z.string().optional(),
            kind: z.enum(['manpads', 'aaa', 'sam-ir']),
            /** Mindestabstand über Grund in ft (Community-Faustregel, ⚠). */
            agl: z.number().int().positive(),
          })
          .strict(),
      )
      .min(2),
    /** Radargelenkte SAM für MAGNUM/SLAPSHOT (Lektion 7). */
    sams: z.array(z.string()).min(2),
    weapons: z
      .array(
        z
          .object({
            id,
            name: z.string(),
            spoken: z.string().optional(),
            aircraft: z.array(aircraftSchema).min(1),
            class: z.enum(['bomb', 'missile', 'rocket', 'gun']),
            guidance: z.enum(['laser', 'gps', 'none', 'ir']).default('none'),
            /** Wirkung im Game Plan, z. B. "one GBU-12". */
            effect: z.string(),
            /** Ruf beim Auslösen (bombs away ⚠, rifle, guns …). */
            call: z.string(),
          })
          .strict(),
      )
      .min(3),
    /** Danger-Close-Schwelle je Waffenklasse in Metern (vereinfacht, ⚠ Werte nicht belegt). */
    dangerClose: z.object({ bomb: z.number(), missile: z.number(), rocket: z.number(), gun: z.number() }).strict(),
  })
  .strict()
export type CasPools = z.infer<typeof casPoolSchema>
export type CasTarget = CasPools['targets'][number]
export type CasThreat = CasPools['threats'][number]
export type CasWeapon = CasPools['weapons'][number]

export const carrierPoolSchema = z.array(
  z
    .object({
      id,
      name: z.string(),
      hull: z.string(),
      /** Kurzname im Funk/Alltag, z. B. "Lincoln". */
      short: z.string(),
      class: z.string(),
      notes: z.array(z.string()).default([]),
    })
    .strict(),
)
export type Carrier = z.infer<typeof carrierPoolSchema>[number]

/**
 * Flugzeuge: einzige Quelle der Flugzeugliste (Profilauswahl, Kästen, Würfelpool).
 * Sammel-Einträge (`group: true`) stehen nur im Profil, nie im Würfelpool.
 */
export const aircraftPoolSchema = z.array(
  z
    .object({
      id: aircraftSchema,
      /** Anzeigename, z. B. "F/A-18C Hornet". */
      label: z.string(),
      /** Typbezeichnung im Text, z. B. "F/A-18C". */
      type: z.string(),
      /** Rufname des Typs im Funk, z. B. "Hornet" im Ball Call. Fehlt nur bei Sammel-Einträgen. */
      radio: z.string().optional(),
      era: eraSchema,
      /** In welchen Sims das Muster fliegbar ist. */
      sims: z.array(simSchema).min(1),
      /** Herkunftsland des Vorbilds (ISO-ähnlich: us, gb, de, su, se, fr …). */
      nation: z.string().optional(),
      service: z.enum(['usaf', 'usaaf', 'usn', 'usmc', 'usa', 'other']),
      seats: z.number().int().min(1).max(4),
      role: z.enum(['fighter', 'attack', 'multirole', 'helicopter', 'trainer', 'transport', 'bomber']),
      /** Funkgeräte in Kurzform (nur Anzeige). */
      radios: z.array(z.string()).default([]),
      /** Sammel-Eintrag „andere Muster“ einer Epoche – nicht im Würfelpool. */
      group: z.boolean().default(false),
      /** Erklärung im Profil, z. B. welche Muster ein Sammel-Eintrag umfasst. */
      note: z.string().optional(),
    })
    .strict(),
)
export type AircraftType = z.infer<typeof aircraftPoolSchema>[number]

export const phoneticSchema = z
  .object({
    letters: z.array(z.object({ letter: z.string().length(1), word: z.string(), say: z.string() }).strict()).length(26),
    digits: z.array(z.object({ digit: z.string().length(1), word: z.string(), icao: z.string(), say: z.string() }).strict()).length(10),
  })
  .strict()
export type Phonetic = z.infer<typeof phoneticSchema>

export const rolesFileSchema = z.array(
  z
    .object({
      role: roleSchema,
      label: z.string(),
      question: z.string(),
      color: z.enum(ROLE_COLORS),
      /** Standardziel für „Mehr dazu“ in der Segment-Erklärung; fehlt es, gibt es keinen Link. */
      more: roleMoreSchema.optional(),
    })
    .strict(),
)
export type RoleInfo = z.infer<typeof rolesFileSchema>[number]

export const prowordsSchema = z.array(
  z
    .object({
      word: z.string(),
      meaning: z.string(),
      note: z.string().optional(),
      layer: layerSchema.default('core'),
      /** Themenseite mit der ausführlichen Erklärung (ID aus content/topics/). */
      topic: id.optional(),
    })
    .strict(),
)
export type Proword = z.infer<typeof prowordsSchema>[number]

/** Grundbegriffe (Flight, Lead, AWACS, PTT …) – weder Brevity noch Standardwort. */
export const basicsSchema = z.array(
  z
    .object({
      word: z.string(),
      meaning: z.string(),
      note: z.string().optional(),
      example: z.string().optional(),
      see: z.array(z.string()).default([]),
      aliases: z.array(z.string()).default([]),
      layer: layerSchema.default('core'),
      /** Themenseite mit der ausführlichen Erklärung (ID aus content/topics/). */
      topic: id.optional(),
    })
    .strict(),
)
export type BasicTerm = z.infer<typeof basicsSchema>[number]

/** Gruppen im Brevity-Glossar (Reihenfolge = Anzeige). */
export const BREVITY_CATEGORIES = [
  'identitaet',
  'anfragen',
  'sicht',
  'sensoren',
  'waffen',
  'treibstoff',
  'manoever',
  'aspekt',
  'ablauf',
  'lagebild',
  'kontrolle',
] as const
export type BrevityCategory = (typeof BREVITY_CATEGORIES)[number]

export const brevitySchema = z.array(
  z
    .object({
      /** Wie im Original, meist in Großbuchstaben. */
      word: z.string(),
      meaning: z.string(),
      category: z.enum(BREVITY_CATEGORIES),
      note: z.string().optional(),
      /** Kurzes Beispiel im Original-Wortlaut. */
      example: z.string().optional(),
      /** Verwandte Einträge (Brevity oder Standardwort). */
      see: z.array(z.string()).default([]),
      /** Weitere Schreibweisen für Suche und Erkennung, z. B. "fox 3", "spike". */
      aliases: z.array(z.string()).default([]),
      layer: layerSchema.default('core'),
      /** Quellen weichen ab oder Bedeutung ist umstritten. */
      check: z.boolean().default(false),
      /** Themenseite mit der ausführlichen Erklärung (ID aus content/topics/). */
      topic: id.optional(),
    })
    .strict(),
)
export type BrevityTerm = z.infer<typeof brevitySchema>[number]

// ---------------------------------------------------------------------------
// Abzeichen (Achievements)
// ---------------------------------------------------------------------------

const count = z.number().int().positive()
/** Genau eine Bedingung je Abzeichen – die Engine kennt nur diese Arten. */
export const achievementRuleSchema = z
  .object({
    lessons: count.optional(),
    module: id.optional(),
    placement: z.literal(true).optional(),
    exams: count.optional(),
    rank: id.optional(),
    xp: count.optional(),
    streak: count.optional(),
    dailyDays: count.optional(),
    matureCards: count.optional(),
    hangar: count.optional(),
    correctCalls: count.optional(),
    cleanCalls: count.optional(),
    silences: count.optional(),
    tunes: count.optional(),
    perfectScenarios: count.optional(),
  })
  .strict()
  .refine((r) => Object.values(r).filter((v) => v !== undefined).length === 1, 'rule braucht genau eine Bedingung')
export type AchievementRule = z.infer<typeof achievementRuleSchema>

export const achievementsSchema = z.array(
  z
    .object({
      id,
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      rule: achievementRuleSchema,
      /** Geheim, bis es erreicht ist. */
      hidden: z.boolean().default(false),
    })
    .strict(),
)
export type Achievement = z.infer<typeof achievementsSchema>[number]
