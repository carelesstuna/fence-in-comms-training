import { useState } from 'react'
import { ERAS, type Era } from '../../core/content/schema'
import { useApp } from '../../state/store'
import { content } from '../../ui/run'
import { ERA_SHORT, HANGAR_CATEGORY } from '../../ui/labels'
import { HangarCardView } from '../../components/HangarCard'

export function HangarPage() {
  const seen = useApp((s) => s.progress.hangarSeen)
  const allCards = [...content.hangar.values()]
  const [era, setEra] = useState<Era | null>(null)
  const cards = era ? allCards.filter((c) => c.era === era) : allCards
  const [open, setOpen] = useState<string | null>(null)
  const card = open ? content.hangar.get(open) : null
  if (card) {
    return (
      <div className="space-y-4">
        <button onClick={() => setOpen(null)} className="text-sm text-muted hover:text-text">
          ← Alle Karten
        </button>
        <HangarCardView card={card} />
      </div>
    )
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Hangar-Wissen</h1>
      <p className="mt-1 mb-5 text-muted">
        Technik, Physik, Geschichte und Hintergründe rund um den Flugfunk. Karten, die du in Lektionen entdeckt hast, kannst du hier
        jederzeit nachlesen. ({seen.length} von {allCards.length} entdeckt)
      </p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Nach Epoche filtern">
        {[null, ...ERAS].map((e) => (
          <button
            key={e ?? 'alle'}
            type="button"
            onClick={() => setEra(e)}
            aria-pressed={era === e}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${era === e ? 'border-phosphor bg-phosphor/10 text-phosphor' : 'border-line bg-panel-2 text-muted hover:text-text'}`}
          >
            {e ? ERA_SHORT[e] : 'Alle'}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const known = seen.includes(c.id)
          const cat = HANGAR_CATEGORY[c.category]
          return (
            <button
              key={c.id}
              disabled={!known}
              onClick={() => setOpen(c.id)}
              className={`rounded-xl border border-line bg-panel p-4 text-left transition ${known ? 'hover:border-phosphor-dim' : 'opacity-50'}`}
            >
              <span className={`rounded border px-1.5 py-0.5 text-[11px] ${cat.cls}`}>{cat.label}</span>
              {c.era && <span className="ml-1.5 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">{ERA_SHORT[c.era]}</span>}
              <div className="mt-2 font-semibold text-white">{known ? c.title : 'Noch nicht entdeckt'}</div>
              <div className="mt-1 text-sm text-muted">{known ? c.teaser : 'Diese Karte findest du in einer der Lektionen.'}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
