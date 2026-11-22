/**
 * Metadaten einer Aufnahme der Messreihe (JSON neben der WAV-Datei). Die Aufnahme-Seite schreibt sie,
 * `scripts/asr-bench.ts` liest sie.
 */
import { z } from 'zod'

/** Arten von Aufnahmen: richtig, absichtlich falsch oder nichts gesagt. */
export const VARIANT_KINDS = ['correct', 'wrong-number', 'wrong-callsign', 'silence'] as const
export type VariantKind = (typeof VARIANT_KINDS)[number]

export const VARIANT_LABEL: Record<VariantKind, string> = {
  correct: 'richtig',
  'wrong-number': 'falsche Zahl',
  'wrong-callsign': 'falsches Rufzeichen',
  silence: 'Stille',
}

export const RECORDING_VERSION = 1

const segmentSchema = z.object({
  text: z.string(),
  role: z.string(),
  note: z.string().optional(),
  optional: z.boolean().optional(),
  critical: z.boolean().optional(),
  alt: z.array(z.string()).optional(),
  tolerance: z.number().optional(),
  free: z.boolean().optional(),
})

export const recordingMetaSchema = z.object({
  version: z.literal(RECORDING_VERSION),
  /** Laufende Nummer, vierstellig („0007“) – vergibt der Dev-Server. */
  id: z.string().regex(/^\d{4}$/),
  createdAt: z.string(),
  kind: z.enum(VARIANT_KINDS),
  /** Was gesprochen werden sollte (leer bei Stille). */
  text: z.string(),
  shouldAccept: z.boolean(),
  change: z.object({ segment: z.number().int(), from: z.string(), to: z.string() }).optional(),
  /** Herkunft im Inhalt, z. B. „exchange:m3-ready-departure#1“. */
  source: z.string(),
  seed: z.string(),
  /** Die erwartete Übertragung (Musterlösung) für die Bewertung. */
  segments: z.array(segmentSchema),
  /** Kontext für die Hinweise der Erkennung (nie die Lösung). */
  hintContext: z.object({ moduleId: z.string().optional(), stations: z.array(z.string()) }),
  audio: z.object({
    file: z.string().regex(/^\d{4}-[a-z-]+\.wav$/),
    rate: z.literal(16000),
    /** So lange war die Sprechtaste gedrückt (ms). */
    heldMs: z.number(),
    peak: z.number(),
    rms: z.number(),
    preRollMs: z.number(),
    tailMs: z.number(),
    /** Echo-/Rauschunterdrückung und automatische Lautstärke des Browsers. */
    filters: z.boolean(),
    nativeRate: z.number(),
  }),
  /** Anmerkung, z. B. „versprochen“ oder „Hintergrundgeräusch“. */
  note: z.string().optional(),
})

export type RecordingMeta = z.infer<typeof recordingMetaSchema>

/** Was die Aufnahme-Seite schickt; Nummer und Dateiname vergibt der Dev-Server. */
export const recordingDraftSchema = recordingMetaSchema.omit({ id: true }).extend({ audio: recordingMetaSchema.shape.audio.omit({ file: true }) })
export type RecordingDraft = z.infer<typeof recordingDraftSchema>
