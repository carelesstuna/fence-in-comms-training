/**
 * Hinweis unter einem Eingabefeld, wie Zahlen getippt zählen: in Worten, so wie man sie spricht – oder (Spur C, Rechen-
 * und Einstell-Aufgaben) auch in Ziffern. Gesprochen gelten immer beide Formen.
 */
export function TypedNumbersNote({
  digits,
  className = '',
}: {
  digits: boolean
  className?: string
}) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      {digits
        ? 'Tippen: Zahlen darfst du hier auch als Ziffern schreiben.'
        : 'Tippen: Zahlen in Worten, so wie du sie sprichst.'}
    </p>
  )
}

/**
 * Unter einem gesprochenen Funkspruch, dessen Zahlen die Anzeige ausgeschrieben hat: Die Erkennung schreibt Ziffern
 * und kann nicht unterscheiden, ob Ziffer für Ziffer gesprochen wurde (bekannte Grenze, docs/spracherkennung.md).
 */
export function SpokenNumbersNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Die Erkennung schreibt Zahlen als Ziffern – hier ausgeschrieben. Ob du sie Ziffer für Ziffer
      gesprochen hast, kann sie nicht unterscheiden.
    </p>
  )
}
