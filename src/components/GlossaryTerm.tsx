/**
 * Glossar im Text: `:term[tally]` in Lektionen und Hinweise zu einzelnen Teilen eines Funkspruchs.
 */
import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { lookupTerm, termsForSegment } from '../core/glossary/glossary'
import { glossary, glossaryLink, topicOf } from '../ui/glossary'

/** Begriff im Fließtext: antippen zeigt die Bedeutung, mit Link ins Glossar. */
export function GlossaryTerm({ term, children }: { term: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  // Steht der Begriff nahe am rechten Rand, schiebt sich das Fenster nach links (statt die Seite breiter zu machen).
  const [shift, setShift] = useState(0)
  const wrap = useRef<HTMLSpanElement>(null)
  const entry = lookupTerm(glossary, term)
  if (!entry) return <>{children ?? term}</>
  const toggle = () => {
    if (!open && wrap.current) {
      const left = wrap.current.getBoundingClientRect().left
      const viewport = document.documentElement.clientWidth
      const width = Math.min(288, viewport * 0.8)
      setShift(Math.min(0, viewport - 8 - left - width))
    }
    setOpen(!open)
  }
  const topic = topicOf(entry)
  return (
    <span ref={wrap} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={entry.meaning}
        className="cursor-help font-mono text-[0.95em] text-amber-hud underline decoration-dotted underline-offset-4"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          role="tooltip"
          style={{ left: shift }}
          className="absolute top-full left-0 z-20 mt-1 block w-72 max-w-[80vw] rounded-lg border border-line bg-panel-2 p-3 text-left text-sm font-normal shadow-xl"
        >
          <span className="block font-mono font-semibold text-amber-hud">{entry.word}</span>
          <span className="mt-0.5 block text-text">{entry.meaning}</span>
          {topic && (
            <Link to={topic.to} title={topic.title} className="mt-1.5 block text-xs text-amber-hud hover:underline">
              Ausführlich lesen →
            </Link>
          )}
          <Link to={glossaryLink(entry)} className="mt-1.5 block text-xs text-phosphor hover:underline">
            Im Glossar ansehen →
          </Link>
        </span>
      )}
    </span>
  )
}

/** Glossar-Einträge zu einem Teil eines Funkspruchs (unter der Anatomie-Erklärung). */
export function SegmentGlossary({ text, role }: { text: string; role: string }) {
  const hits = termsForSegment(glossary, text, role)
  if (hits.length === 0) return null
  return (
    <ul className="mt-1.5 space-y-0.5 text-sm">
      {hits.map((e) => (
        <li key={e.key}>
          <Link to={glossaryLink(e)} className="font-mono font-semibold text-amber-hud hover:underline">
            {e.word}
          </Link>
          <span className="text-muted"> – {e.meaning}</span>
        </li>
      ))}
    </ul>
  )
}
