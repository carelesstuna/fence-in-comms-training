/**
 * Glossar im Text: `:term[tally]` in Lektionen und Hinweise zu einzelnen Teilen eines Funkspruchs.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router'
import { lookupTerm, termsForSegment } from '../core/glossary/glossary'
import { glossary, glossaryLink, topicOf } from '../ui/glossary'

// Höchstens ein Begriff zeigt sein Fenster: Öffnet sich ein zweiter, schließt sich der erste.
let openTerm: string | null = null
const listeners = new Set<() => void>()
function setOpenTerm(id: string | null) {
  if (openTerm === id) return
  openTerm = id
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const getOpenTerm = () => openTerm

/**
 * Begriff im Fließtext: antippen zeigt die Bedeutung, mit Link ins Glossar.
 * Zu geht das Fenster über das ×, Escape, einen Klick daneben oder erneutes Antippen des Begriffs.
 */
export function GlossaryTerm({ term, children }: { term: string; children?: ReactNode }) {
  const id = useId()
  const open = useSyncExternalStore(subscribe, getOpenTerm) === id
  // Steht der Begriff nahe am rechten Rand, schiebt sich das Fenster nach links (statt die Seite breiter zu machen).
  const [shift, setShift] = useState(0)
  const wrap = useRef<HTMLSpanElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpenTerm(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenTerm(null)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Verschwindet der Begriff (Seitenwechsel), darf sein Fenster nicht als „offen“ stehen bleiben.
  useEffect(
    () => () => {
      if (openTerm === id) setOpenTerm(null)
    },
    [id],
  )

  const entry = lookupTerm(glossary, term)
  if (!entry) return <>{children ?? term}</>
  const toggle = () => {
    if (open) return setOpenTerm(null)
    if (wrap.current) {
      const left = wrap.current.getBoundingClientRect().left
      const viewport = document.documentElement.clientWidth
      const width = Math.min(288, viewport * 0.8)
      setShift(Math.min(0, viewport - 8 - left - width))
    }
    setOpenTerm(id)
  }
  const close = () => {
    setOpenTerm(null)
    trigger.current?.focus()
  }
  const topic = topicOf(entry)
  return (
    <span ref={wrap} className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={entry.meaning}
        className="cursor-help font-mono text-[0.95em] text-amber-hud underline decoration-dotted underline-offset-4"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          aria-label={entry.word}
          style={{ left: shift }}
          className="absolute top-full left-0 z-20 mt-1 block w-72 max-w-[80vw] rounded-lg border border-line bg-panel-2 p-3 text-left text-sm font-normal shadow-xl"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Schließen"
            title="Schließen"
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded text-base leading-none text-muted hover:bg-line hover:text-text"
          >
            ×
          </button>
          <span className="block pr-6 font-mono font-semibold text-amber-hud">{entry.word}</span>
          <span className="mt-0.5 block text-text">{entry.meaning}</span>
          {topic && (
            <Link
              to={topic.to}
              title={topic.title}
              onClick={() => setOpenTerm(null)}
              className="mt-1.5 block text-xs text-amber-hud hover:underline"
            >
              Ausführlich lesen →
            </Link>
          )}
          <Link
            to={glossaryLink(entry)}
            onClick={() => setOpenTerm(null)}
            className="mt-1.5 block text-xs text-phosphor hover:underline"
          >
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
