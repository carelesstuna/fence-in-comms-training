/**
 * Themenseiten (#/wissen und #/wissen/:id): ausführliche Erklärungen zu Grundbegriffen, aus Lektionen und
 * Glossar-Popovern aufrufbar. Eine ganz normale Route – der Rückweg ist die Zurück-Taste bzw. „← Zurück“.
 */
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import type { Topic } from '../../core/content/index'
import { lookupTerm } from '../../core/glossary/glossary'
import { content } from '../../ui/run'
import { glossary, glossaryLink } from '../../ui/glossary'
import { ERA_SHORT } from '../../ui/labels'
import { Markdown } from '../../components/Markdown'

/** „← Zurück“: dorthin, woher man kam (Lektion, Popover, Glossar). Ohne Vorgeschichte: zur Übersicht. */
function BackButton({ fallback, label }: { fallback: string; label: string }) {
  const navigate = useNavigate()
  const { key } = useLocation()
  // Die erste Adresse nach dem Start hat den Schlüssel „default“ – davor gibt es nichts in der App
  const canGoBack = key !== 'default'
  return (
    <button
      type="button"
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))}
      className="text-sm text-muted hover:text-text"
    >
      ← {canGoBack ? 'Zurück' : label}
    </button>
  )
}

function Chips({ topic }: { topic: Topic }) {
  return (
    <>
      {topic.layer === 'community' && (
        <span className="rounded border border-sky-400/40 px-1.5 py-0.5 text-[11px] text-sky-200">
          Praxis
        </span>
      )}
      {topic.era && (
        <span className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
          {ERA_SHORT[topic.era]}
        </span>
      )}
    </>
  )
}

export function TopicPage() {
  const { id = '' } = useParams()
  const topic = content.topics.get(id)
  if (!topic) {
    return (
      <div className="space-y-3">
        <BackButton fallback="/wissen" label="Alle Themenseiten" />
        <p>
          Diese Themenseite gibt es nicht. <Link to="/wissen">Alle Themenseiten</Link>
        </p>
      </div>
    )
  }
  const terms = topic.terms.map((t) => lookupTerm(glossary, t)).filter((e) => !!e)
  return (
    <div className="space-y-4">
      <BackButton fallback="/wissen" label="Alle Themenseiten" />
      <article className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-5 py-2.5">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            Wissen
          </span>
          <Chips topic={topic} />
        </div>
        <div className="px-5 py-4">
          <h1 className="text-xl font-semibold text-white">{topic.title}</h1>
          <p className="mt-1 text-muted italic">{topic.summary}</p>
          <Markdown text={topic.markdown} className="mt-4" />
          {terms.length > 0 && (
            <div className="mt-5 border-t border-line pt-3 text-xs text-muted">
              <div className="mb-1.5 font-semibold">Im Glossar</div>
              <ul className="flex flex-wrap gap-1.5">
                {terms.map((e) => (
                  <li key={e.key}>
                    <Link
                      to={glossaryLink(e)}
                      title={e.meaning}
                      className="rounded border border-line px-1.5 py-0.5 font-mono hover:border-amber-hud hover:text-amber-hud"
                    >
                      {e.word}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 border-t border-line pt-3 text-xs text-muted">
            <div className="mb-1 font-semibold">Quellen</div>
            <ul className="space-y-0.5">
              {topic.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-text"
                    >
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </div>
  )
}

/** Übersicht aller Themenseiten (#/wissen). */
export function TopicsIndexPage() {
  const topics = [...content.topics.values()]
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Wissen</h1>
      <p className="mt-1 mb-5 text-muted">
        Ausführliche Erklärungen zu Grundbegriffen des Flugfunks. Die Lektionen und das Glossar
        verlinken hierher, wenn ein Begriff mehr Platz braucht.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            to={`/wissen/${t.id}`}
            className="rounded-xl border border-line bg-panel p-4 transition hover:border-phosphor-dim"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Chips topic={t} />
            </div>
            <div className="font-semibold text-white">{t.title}</div>
            <div className="mt-1 text-sm text-muted">{t.summary}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
