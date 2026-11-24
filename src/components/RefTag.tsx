/**
 * Unaufdringliche Referenz unter einer Übung – für Feedback. Sie nennt, wo man ist (Lektion, Schritt, Übungs- oder
 * Szenario-ID wie in content/) und den Würfel-Schlüssel des Durchlaufs, mit dem sich die Zufallswerte nachbauen lassen.
 * Ein Klick kopiert sie, damit man sie in eine Rückmeldung einfügen kann.
 */
import { useEffect, useRef, useState } from 'react'

function refText(parts: (string | false | null | undefined)[], seed: string): string {
  return ['Ref', [...parts.filter(Boolean), `#${seed}`].join(' · ')].join(' ')
}

export function RefTag({
  parts,
  seed,
  className = 'mt-2',
}: {
  parts: (string | false | null | undefined)[]
  seed: string
  className?: string
}) {
  const text = refText(parts, seed)
  const textRef = useRef<HTMLSpanElement>(null)
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle')
  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), state === 'copied' ? 1500 : 4000)
    return () => clearTimeout(t)
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      return
    } catch {
      // Zwischenablage gesperrt oder nicht vorhanden – unten der Ersatzweg
    }
    // Text markieren: execCommand kopiert dann meist doch, sonst bleibt er für Strg+C markiert
    const el = textRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    const range = document.createRange()
    range.selectNodeContents(el)
    sel.removeAllRanges()
    sel.addRange(range)
    let ok: boolean
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    if (ok) sel.removeAllRanges()
    setState(ok ? 'copied' : 'selected')
  }

  return (
    <div className={`flex justify-end ${className}`}>
      <button
        type="button"
        onClick={() => void copy()}
        title="Referenz für Feedback – Klick kopiert sie"
        aria-label={`${text} – kopieren`}
        className="rounded px-1 font-mono text-[10px] text-muted/50 transition select-text hover:text-muted"
      >
        <span ref={textRef}>{text}</span>
        {state === 'copied' && <span className="text-phosphor"> ✓ kopiert</span>}
        {state === 'selected' && (
          <span className="text-amber-hud"> – markiert, Strg+C kopiert</span>
        )}
      </button>
    </div>
  )
}
