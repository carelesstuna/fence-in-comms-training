/**
 * Markdown mit den Inhalts-Bausteinen (::call, :::sim, :::tip …) und Platzhaltern ({callsign} …).
 */
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import { fillTemplate } from '../core/random/template'
import { builtinVars } from '../core/random/vars'
import { useRun } from '../ui/run'
import { CallAnatomy } from './CallAnatomy'
import { ChartBlock } from './ChartBlock'
import { Callout, LayerNote, SimNote, AircraftNote, EraNote } from './Notes'
import { GlossaryTerm } from './GlossaryTerm'

interface DirectiveNode {
  type: string
  name: string
  attributes?: Record<string, string | null | undefined>
  children: { type: string; value?: string }[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

function remarkRadio() {
  return (tree: Root) => {
    visit(tree, (node) => {
      const n = node as unknown as DirectiveNode
      if (n.type !== 'containerDirective' && n.type !== 'leafDirective' && n.type !== 'textDirective') return
      const data = (n.data ??= {})
      const attrs = n.attributes ?? {}
      if (n.type === 'textDirective') {
        // :term[tally] → Glossar-Begriff zum Antippen
        if (n.name === 'term') {
          data.hName = 'glossary-term'
          data.hProperties = { term: n.children.map((c) => c.value ?? '').join('') }
          return
        }
        // Sonst kein Text-Baustein vorgesehen → als normalen Text zurückgeben (z. B. "14:30")
        data.hName = 'span'
        n.children.unshift({ type: 'text', value: `:${n.name}` })
        return
      }
      switch (n.name) {
        case 'call':
          data.hName = 'radio-call'
          data.hProperties = { call: attrs.id, as: attrs.as }
          break
        case 'chart':
          data.hName = 'chart-block'
          data.hProperties = { kind: attrs.kind, airfield: attrs.airfield, freqs: attrs.freqs }
          break
        case 'sim':
          data.hName = 'sim-note'
          data.hProperties = { sim: attrs.sim }
          break
        case 'aircraft':
          data.hName = 'aircraft-note'
          data.hProperties = { aircraft: attrs.aircraft }
          break
        case 'era':
          data.hName = 'era-note'
          data.hProperties = { era: attrs.era }
          break
        case 'layer':
          data.hName = 'layer-note'
          data.hProperties = { layer: attrs.layer }
          break
        case 'tip':
        case 'warn':
        case 'example':
          data.hName = 'call-out'
          data.hProperties = { kind: n.name }
          break
        default:
          data.hName = 'div'
      }
    })
  }
}

type P = { children?: ReactNode; [k: string]: unknown }

const components = {
  'radio-call': (p: P) => <CallAnatomy exchangeId={String(p.call)} as={p.as ? String(p.as) : undefined} />,
  'chart-block': (p: P) => (
    <ChartBlock
      kind={p.kind === 'approach' ? 'approach' : 'airport'}
      airfield={p.airfield ? String(p.airfield) : undefined}
      freqs={p.freqs === 'real' ? 'real' : 'sim'}
    />
  ),
  'sim-note': (p: P) => <SimNote sim={String(p.sim)}>{p.children}</SimNote>,
  'aircraft-note': (p: P) => <AircraftNote aircraft={String(p.aircraft)}>{p.children}</AircraftNote>,
  'era-note': (p: P) => <EraNote era={String(p.era)}>{p.children}</EraNote>,
  'layer-note': (p: P) => <LayerNote layer={String(p.layer)}>{p.children}</LayerNote>,
  'call-out': (p: P) => <Callout kind={String(p.kind)}>{p.children}</Callout>,
  'glossary-term': (p: P) => <GlossaryTerm term={String(p.term)}>{p.children}</GlossaryTerm>,
  // Breite Tabellen scrollen im schmalen Fenster seitlich, statt aus der Karte zu ragen
  table: (p: P) => (
    <div className="overflow-x-auto">
      <table>{p.children}</table>
    </div>
  ),
  a: (p: P) => {
    const href = String(p.href ?? '')
    // Verweise innerhalb der App ([Text](/wissen/<id>), [Text](/lesson/<id>)) öffnen im selben Fenster über den Router
    if (/^\/(?!\/)/.test(href)) return <Link to={href}>{p.children}</Link>
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {p.children}
      </a>
    )
  },
} as unknown as Components

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const run = useRun()
  const filled = useMemo(() => fillTemplate(text, builtinVars(run.self)), [text, run.self])
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkRadio]} components={components}>
        {filled}
      </ReactMarkdown>
    </div>
  )
}

/** Kurzer Inline-Markdown-Text (Prompts, Erklärungen) ohne Bausteine. */
export function InlineMarkdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}
