/**
 * Glossar (#/glossary): Grundbegriffe, Brevity-Codes, Standardwörter, Alphabet und Zahlen – mit Suche.
 * ?q= Suchbegriff, ?tab= basics | brevity | prowords | alphabet, ?cat= Brevity-Gruppe.
 */
import { Link, useSearchParams } from 'react-router'
import { BREVITY_CATEGORIES, type BrevityCategory } from '../../core/content/schema'
import { CATEGORY_LABELS, lookupTerm, norm, searchGlossary, type GlossaryEntry, type GlossaryKind } from '../../core/glossary/glossary'
import type { GLOSSARY_TABS } from '../../core/glossary/more'
import { content } from '../../ui/run'
import { glossary, topicOf } from '../../ui/glossary'

// Die Reiter, die „Mehr dazu“-Links ansteuern dürfen, stehen in core/glossary/more.ts (der Validator prüft dagegen)
type Tab = 'all' | (typeof GLOSSARY_TABS)[number]
const TABS: [Tab, string][] = [
  ['all', 'Alle'],
  ['basics', 'Grundbegriffe'],
  ['brevity', 'Brevity'],
  ['prowords', 'Standardwörter'],
  ['alphabet', 'Alphabet & Zahlen'],
]
const TAB_KIND: Partial<Record<Tab, GlossaryKind>> = { basics: 'basic', brevity: 'brevity', prowords: 'proword' }

export function GlossaryPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const tab = (TABS.some(([t]) => t === params.get('tab')) ? params.get('tab') : 'all') as Tab
  const cat = BREVITY_CATEGORIES.includes(params.get('cat') as BrevityCategory) ? (params.get('cat') as BrevityCategory) : null

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const pool = glossary.filter((e) => !TAB_KIND[tab] || e.kind === TAB_KIND[tab])
  const hits = searchGlossary(pool, q).filter((e) => !cat || e.category === cat)
  const count = (k: GlossaryKind) => glossary.filter((e) => e.kind === k).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Glossar</h1>
        <p className="text-sm text-muted">
          {count('basic')} Grundbegriffe, {count('brevity')} Brevity-Codes, {count('proword')} Standardwörter, Alphabet und Zahlen. Suche auf Englisch oder Deutsch –
          im Begriff und in der Erklärung. Längere Erklärungen stehen auf den{' '}
          <Link to="/wissen" className="text-phosphor hover:underline">
            Themenseiten
          </Link>
          .
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-line bg-black/30 px-3 focus-within:border-phosphor">
        <span className="text-muted">⌕</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => set({ q: e.target.value || null })}
          placeholder="z. B. bogey, Treibstoff, fox"
          spellCheck={false}
          autoComplete="off"
          aria-label="Glossar durchsuchen"
          className="min-w-0 flex-1 bg-transparent py-2 font-mono text-text outline-none"
        />
        {q && (
          <button onClick={() => set({ q: null })} className="text-sm text-muted hover:text-text" aria-label="Suche leeren">
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => set({ tab: t === 'all' ? null : t, cat: null })}
            className={`rounded-md border px-2.5 py-1 text-sm ${tab === t ? 'border-phosphor bg-phosphor/10 text-phosphor' : 'border-line text-muted hover:text-text'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'brevity' && (
        <div className="flex flex-wrap gap-1.5">
          {BREVITY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => set({ cat: cat === c ? null : c })}
              aria-pressed={cat === c}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${cat === c ? 'border-amber-hud text-amber-hud' : 'border-line text-muted hover:text-text'}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      {tab === 'alphabet' ? (
        <Alphabet q={q} />
      ) : (
        <>
          <p className="text-xs text-muted">
            {hits.length} {hits.length === 1 ? 'Eintrag' : 'Einträge'}
            {q && <> für „{q}“</>}
          </p>
          {hits.length === 0 ? (
            <p className="rounded-xl border border-line bg-panel p-4 text-muted">Nichts gefunden. Probier ein anderes Wort – oder den Reiter „Alle“.</p>
          ) : (
            <ul className="space-y-2">
              {hits.map((e) => (
                <EntryCard key={e.key} e={e} onSee={(w) => set({ q: w.toLowerCase(), tab: null, cat: null })} />
              ))}
            </ul>
          )}
        </>
      )}

      <p className="border-t border-line pt-3 text-xs text-muted">
        Brevity sinngemäß nach den Multi-Service Brevity Codes (ATP 1-02.1, Ausgabe April 2025), abgeglichen mit der USAF Test Pilot
        School „Flight Test Brevity“ und Wikipedia. Maßgeblich ist das Original. ⚠ heißt: Die Quellen weichen voneinander ab, oder der
        Begriff steht nicht in allen Brevity-Listen.
        <br />
        Enthält bearbeitetes Material aus dem Wikipedia-Artikel{' '}
        <a href="https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code" target="_blank" rel="noreferrer" className="underline hover:text-text">
          „Multiservice tactical brevity code“
        </a>{' '}
        (Wikipedia-Autorinnen und -Autoren,{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.de" target="_blank" rel="noreferrer" className="underline hover:text-text">
          CC BY-SA 4.0
        </a>
        ), ins Deutsche übertragen und ergänzt. Die Erklärungen hier stehen ebenfalls unter CC BY-SA 4.0.
      </p>
    </div>
  )
}

function EntryCard({ e, onSee }: { e: GlossaryEntry; onSee: (word: string) => void }) {
  const topic = topicOf(e)
  return (
    <li id={e.key} className="rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-lg font-semibold text-amber-hud">{e.word}</span>
        {e.aliases.length > 0 && <span className="font-mono text-xs text-muted">auch: {e.aliases.join(', ')}</span>}
        <span className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
          {e.kind === 'brevity' ? (e.category ? CATEGORY_LABELS[e.category] : 'Brevity') : e.kind === 'proword' ? 'Standardwort' : 'Grundbegriff'}
        </span>
        {e.layer === 'community' && <span className="rounded border border-sky-400/40 px-1.5 py-0.5 text-[11px] text-sky-200">Praxis</span>}
        {e.check && (
          <span
            className="rounded border border-amber-hud/50 px-1.5 py-0.5 text-[11px] text-amber-hud"
            title="Die Quellen weichen voneinander ab, oder der Begriff steht nicht in allen Brevity-Listen"
          >
            ⚠ nicht eindeutig belegt
          </span>
        )}
      </div>
      <p className="mt-1">{e.meaning}</p>
      {e.note && <p className="mt-1 text-sm text-muted">{e.note}</p>}
      {e.example && <p className="mt-1.5 font-mono text-sm text-phosphor">„{e.example}“</p>}
      {topic && (
        <p className="mt-2 text-sm">
          <Link to={topic.to} className="text-amber-hud hover:underline">
            Ausführlich lesen: {topic.title} →
          </Link>
        </p>
      )}
      {e.see.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">siehe</span>
          {e.see.map((s) => {
            const target = lookupTerm(glossary, s)
            return (
              <button key={s} onClick={() => onSee(target?.word ?? s)} className="rounded border border-line px-1.5 py-0.5 font-mono hover:border-amber-hud hover:text-amber-hud">
                {target?.word ?? s}
              </button>
            )
          })}
        </div>
      )}
    </li>
  )
}

function Alphabet({ q }: { q: string }) {
  const n = norm(q)
  const letters = content.phonetic.letters.filter((l) => !n || norm(`${l.letter} ${l.word} ${l.say}`).includes(n))
  const digits = content.phonetic.digits.filter((d) => !n || norm(`${d.digit} ${d.word} ${d.icao} ${d.say}`).includes(n))
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-line bg-panel p-4">
        <h2 className="mb-2 font-semibold">Buchstaben (ICAO/NATO)</h2>
        <table className="w-full text-sm">
          <tbody>
            {letters.map((l) => (
              <tr key={l.letter} className="border-t border-line/50">
                <td className="py-1 pr-3 font-mono text-amber-hud">{l.letter}</td>
                <td className="py-1 pr-3 font-mono">{l.word}</td>
                <td className="py-1 text-muted">{l.say}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-line bg-panel p-4">
        <h2 className="mb-2 font-semibold">Zahlen</h2>
        <table className="w-full text-sm">
          <tbody>
            {digits.map((d) => (
              <tr key={d.digit} className="border-t border-line/50">
                <td className="py-1 pr-3 font-mono text-amber-hud">{d.digit}</td>
                <td className="py-1 pr-3 font-mono">{d.word}</td>
                <td className="py-1 pr-3 font-mono text-muted">{d.icao}</td>
                <td className="py-1 text-muted">{d.say}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
