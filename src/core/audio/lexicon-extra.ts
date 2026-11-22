/**
 * Aussprache von Hand – für Wörter, die in den misaki-Lexika fehlen oder dort für den Funk falsch
 * stehen: Ortsnamen der Karten, Rufzeichen, Brevity-Wörter. `coverage.test.ts` meldet, was fehlt.
 *
 * Schreibweise wie bei misaki (Kokoro-Phoneme): ˈ Hauptbetonung, ˌ Nebenbetonung; US: A = eɪ, I = aɪ,
 * O = oʊ, W = aʊ, Y = ɔɪ, ɹ für r; GB zusätzlich Q = əʊ, ː für lange Vokale, kein r am Silbenende.
 * Schlüssel klein geschrieben. Fehlt „gb“, gilt „us“ auch für britische Stimmen.
 */
export const LEXICON_EXTRA: Readonly<Record<string, { us: string; gb?: string }>> = {
  // Zahlen und Funkwörter
  niner: { us: 'nˈInəɹ', gb: 'nˈInə' },
  braa: { us: 'bɹˈɑ', gb: 'bɹˈɑː' },
  // „lead“ im Flight ist immer der Führende (nicht das Metall)
  lead: { us: 'lˈid', gb: 'lˈiːd' },
  juliett: { us: 'ʤˈuliˌɛt', gb: 'ʤˈuːliˌɛt' },
  rolex: { us: 'ɹˈOlˌɛks', gb: 'ɹˈQlɛks' },
  vic: { us: 'vˈɪk' },
  hawg: { us: 'hˈɔɡ', gb: 'hˈɔːɡ' },
  jtac: { us: 'ʤˈAtˌæk', gb: 'ʤˈAtak' },
  atis: { us: 'ˈAtɪs' },
  tacan: { us: 'tˈækˌæn', gb: 'tˈakan' },
  // „Willie Pete“: Markierungsrakete mit weißem Phosphor
  willie: { us: 'wˈɪli' },
  // Flugplätze (Kaukasus, Persischer Golf, NTTR, Marianen, Korea)
  al: { us: 'ˈæl', gb: 'ˈal' },
  andersen: { us: 'ˈændəɹsən', gb: 'ˈandəsən' },
  batumi: { us: 'bɑtˈumi', gb: 'batˈuːmi' },
  cheongju: { us: 'ʧˈʌŋʤˌu', gb: 'ʧˈʌŋʤuː' },
  creech: { us: 'kɹˈiʧ', gb: 'kɹˈiːʧ' },
  daegu: { us: 'dˈAɡu', gb: 'dˈAɡuː' },
  dhafra: { us: 'dˈɑfɹə', gb: 'dˈafɹə' },
  enfield: { us: 'ˈɛnfˌild', gb: 'ˈɛnfiːld' },
  gwangju: { us: 'ɡwˈɑŋʤˌu', gb: 'ɡwˈaŋʤuː' },
  khasab: { us: 'kˈɑsəb', gb: 'kˈasab' },
  kobuleti: { us: 'kˌObulˈɛti', gb: 'kˌQbʊlˈɛti' },
  kolkhi: { us: 'kˈOlki', gb: 'kˈQlki' },
  nellis: { us: 'nˈɛlɪs' },
  osan: { us: 'ˈOsˌɑn', gb: 'ˈQsan' },
  senaki: { us: 'sənˈɑki', gb: 'sənˈɑːki' },
  seosan: { us: 'sˈʌsˌɑn', gb: 'sˈʌsan' },
}
