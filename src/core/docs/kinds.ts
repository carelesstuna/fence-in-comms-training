/** Arten der Musterdokumente (::muster{doc=…}); eigene Datei, damit der Validator nichts aus dem Würfel-Code lädt. */
export const SAMPLE_DOCS = ['frag', 'commcard', 'spins', 'sop'] as const
export type SampleDocKind = (typeof SAMPLE_DOCS)[number]
