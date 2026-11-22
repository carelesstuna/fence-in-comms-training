import type { HangarCard } from '../core/content/index'
import { HANGAR_CATEGORY } from '../ui/labels'
import { Markdown } from './Markdown'

export function HangarCardView({ card }: { card: HangarCard }) {
  const cat = HANGAR_CATEGORY[card.category]
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Hangar-Wissen</span>
        <span className={`rounded border px-1.5 py-0.5 text-[11px] ${cat.cls}`}>{cat.label}</span>
      </div>
      <div className="px-5 py-4">
        <h2 className="text-xl font-semibold text-white">{card.title}</h2>
        <p className="mt-1 text-muted italic">{card.teaser}</p>
        <Markdown text={card.markdown} className="mt-4" />
        {card.sources.length > 0 && (
          <div className="mt-5 border-t border-line pt-3 text-xs text-muted">
            <div className="mb-1 font-semibold">Quellen</div>
            <ul className="space-y-0.5">
              {card.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}
