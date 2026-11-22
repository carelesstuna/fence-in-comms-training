/**
 * „Mehr dazu: …“ unter der Erklärung eines Funkspruch-Teils. Ein echter Link (Tastatur, Screenreader).
 * Eine Themenseite (`/wissen/<id>`) öffnet im selben Fenster: Sie ist eine normale Seite der App, und die Zurück-Taste führt
 * zur Lektion zurück, die ihren Stand in der History behält. Das Glossar öffnet in einem neuen Tab, weil dort kein
 * Rückweg zum Stand der Lektion besteht.
 */
import { Link } from 'react-router'
import { isTopicTarget, type MoreLink } from '../core/glossary/more'

const LINK =
  'font-medium text-phosphor underline underline-offset-2 hover:text-text focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor'

export function MoreLinkLine({ link }: { link: MoreLink }) {
  const sameWindow = isTopicTarget(link.to)
  return (
    <p className="mt-1.5 text-sm text-muted">
      Mehr dazu:{' '}
      {sameWindow ? (
        <Link to={link.to} className={LINK}>
          {link.label}
          <span aria-hidden="true"> →</span>
        </Link>
      ) : (
        <Link to={link.to} target="_blank" rel="noopener" className={LINK}>
          {link.label}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (öffnet in neuem Tab)</span>
        </Link>
      )}
    </p>
  )
}
