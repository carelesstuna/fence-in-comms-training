/**
 * Funksprüche, die nur als Zitat in einer Aufgabe stehen („Batumi Tower: „Viper one one, contact departure …““),
 * sollen sich auch anhören lassen. Erkannt wird ein Zitat als Funkspruch, wenn davor eine sprechende Station steht
 * („Batumi Tower:“, „Dein Lead ruft“, „Approach meldet“) und es aus mindestens zwei englischen Wörtern besteht.
 * Einzelne Begriffe („roger“, „bandit“) bleiben Text.
 */

export interface QuotedCall {
  speaker: string
  text: string
}

/** Verben, mit denen eine Aufgabe einen gehörten Funkspruch einleitet. */
const SAYS = /\b(ruft|rufen|meldet|melden|sagt|sagen|funkt|antwortet|fragt|hörst|hören|kommt|gibt|befiehlt|sendet|weist)\b/

/** Station vor einem Doppelpunkt: „Batumi Tower:“, „Darkstar:“, „Lead:“. */
const LABEL = /([A-Z][\w-]*(?:\s+[A-Z0-9][\w-]*){0,3})\s*:\s*$/

/** Station vor dem Verb: „Dein Lead ruft“, „Approach meldet“, „der JTAC sagt“. */
const BEFORE_VERB = /(?:^|[\s(])(?:[Dd]ein(?:e|en)?\s+|[Dd]er\s+|[Dd]ie\s+|[Dd]as\s+|[Ee]ine?\s+)?([A-Z][\w-]*(?:\s+[A-Z0-9][\w-]*){0,3})\s+(?:\S+\s+){0,3}$/

/** Englisch genug für einen Funkspruch: nur Buchstaben, Ziffern, Satzzeichen, mindestens zwei Wörter. */
function looksLikeRadio(text: string): boolean {
  const t = text.trim()
  if (!/^[A-Za-z0-9\s,.'’?!\-/]+$/.test(t)) return false
  return t.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length >= 2
}

/** Fragen nach einem Begriff („Warum sagt man „two five zero“ …?“) zitieren keinen Funkspruch zum Anhören. */
const QUESTION = /^(Warum|Wann|Wie|Was|Welche[rsmn]?|Wer|Wo|Wozu|Weshalb|Wieso)\b/

/** Wörter, die vor dem Verb stehen können, aber keine Station sind. */
const NOT_A_STATION = new Set(['Du', 'Er', 'Sie', 'Es', 'Auf', 'In', 'Im', 'Erst', 'Dann', 'Beim', 'Bei', 'Antwort', 'Nach', 'Vor', 'Jetzt', 'Danach', 'Flugzeugen'])

/** Zitierte Funksprüche einer Aufgabe, in der Reihenfolge des Textes. */
export function quotedCalls(prompt: string): QuotedCall[] {
  const plain = prompt.replace(/\*\*/g, '')
  const out: QuotedCall[] = []
  for (const m of plain.matchAll(/„([^“]+)“/g)) {
    const text = m[1].replace(/…/g, '').replace(/\s+/g, ' ').trim()
    if (!looksLikeRadio(text)) continue
    // Nur der Satz vor dem Zitat zählt
    const before = (plain.slice(0, m.index).split(/[.!?]\s+(?=[A-ZÄÖÜ])/).pop() ?? '').trimStart()
    if (QUESTION.test(before)) continue
    const label = LABEL.exec(before)
    if (label) {
      out.push({ speaker: NOT_A_STATION.has(label[1]) ? 'Gegenstelle' : label[1], text })
      continue
    }
    const verb = SAYS.exec(before.slice(-60))
    if (!verb) continue
    const head = before.slice(0, before.lastIndexOf(verb[0]))
    const who = BEFORE_VERB.exec(head)?.[1]
    out.push({ speaker: who && !NOT_A_STATION.has(who.split(' ')[0]) ? who : 'Gegenstelle', text })
  }
  return out
}
