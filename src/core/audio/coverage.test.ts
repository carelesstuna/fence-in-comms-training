/**
 * Jedes Wort, das die Inhalte sprechen können, hat eine Aussprache – aus den misaki-Lexika, als Wortform
 * oder zusammengesetzt, sonst von Hand in `lexicon-extra.ts`. Buchstabiert werden nur echte Abkürzungen.
 *
 * Läuft nur, wenn die Lexika lokal liegen (`npm run fetch-asr -- tts`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contentResult } from '../../content'
import { resolveExchange, resolveScenario } from '../drills/resolve'
import { createRng } from '../random/rng'
import { randomSelf } from '../random/vars'
import { asrDir } from '../../../scripts/local-dirs'
import { tokenize, wordPhonemes, type Dialect } from './g2p'
import { flattenLexicon, makeLookup, type RawLexicon } from './lexicon'
import { spokenText } from './speech-text'
import type { ResolvedTransmission } from '../drills/types'

/** Abkürzungen, die im Funk wirklich buchstabiert werden. */
// prettier-ignore
export const SPELLED_OK = new Set([
  'EPU', 'AB', 'IP', 'CP', 'BP', 'TOT', 'BDA', 'ILS', 'IFR', 'VFR', 'UHF', 'VHF', 'FM', 'AM', 'GCI', 'RTB', 'EWR', 'CAP', 'DME', 'NM', 'IR',
  'HF', 'SAM', 'AAA', 'FAC', 'SEAD', 'TCN', 'ICS', 'ETA', 'RV', 'TACP', 'MSL', 'AGL', 'QNH', 'QFE', 'PAPI', 'NDB', 'VOR', 'MGRS',
  'BMP', 'BTR', 'ZSU', 'GBU', 'AGM', 'CBU', 'SA', 'GPS',
])

const dir = join(asrDir(), 'tts')
const files = (d: Dialect) =>
  [`misaki-${d}_gold.json`, `misaki-${d}_silver.json`].map((f) => join(dir, f))

describe.skipIf(!files('us').concat(files('gb')).every(existsSync))(
  'Aussprache aller Inhalte',
  () => {
    const index = contentResult.index!
    const transmissions: ResolvedTransmission[] = []
    for (let i = 0; i < 25; i++) {
      const rng = createRng(`abdeckung-${i}`)
      const env = { rng, content: index, self: randomSelf(rng, index) }
      for (const x of index.exchanges.values())
        transmissions.push(...resolveExchange(x, env).transmissions)
      for (const sc of index.scenarios.values()) {
        const r = resolveScenario(sc, env)
        for (const st of r.steps)
          transmissions.push(...st.hear, ...st.reply, ...(st.you ? [st.you.transmission] : []))
      }
    }
    const words = new Set(
      transmissions
        .filter((t) => !t.skip)
        .flatMap((t) => tokenize(spokenText(t)).filter((w) => /^[A-Za-z]/.test(w))),
    )

    for (const dialect of ['us', 'gb'] as const) {
      it(`kennt jedes Wort (${dialect.toUpperCase()})`, () => {
        const lexicons = files(dialect).map((f) =>
          flattenLexicon(JSON.parse(readFileSync(f, 'utf8')) as RawLexicon),
        )
        const lookup = makeLookup(dialect, lexicons)
        const missing = [...words]
          .filter((w) => wordPhonemes(w, lookup, dialect).via === 'spelled' && !SPELLED_OK.has(w))
          .sort()
        expect(words.size).toBeGreaterThan(300)
        expect(missing).toEqual([])
      })
    }
  },
)
