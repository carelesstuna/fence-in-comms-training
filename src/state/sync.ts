/**
 * Mehrere Fenster oder Tabs der App (z. B. über „Mehr dazu“ geöffnet) teilen sich den Speicher
 * (localStorage), halten ihren Stand aber im Arbeitsspeicher. Würde nur eines schreiben, überschriebe
 * das andere mit seinem alten Stand den Fortschritt, sobald es selbst etwas speichert. Deshalb lädt ein
 * Fenster neu, wenn ein anderes den Stand geschrieben hat.
 */
import { STORE_KEY } from './persisted'
import { useApp } from './store'

/** Das Ereignis, das der Browser den anderen Fenstern schickt (Teilmenge von StorageEvent). */
interface StorageChange {
  key: string | null
  newValue: string | null
  storageArea: unknown
}

/**
 * Ruft `reload`, sobald ein anderes Fenster den gespeicherten Stand der App geschrieben hat. Gelöscht
 * oder geleert (`newValue` fehlt) zählt nicht: Das Fenster behält seinen Stand und speichert ihn beim
 * nächsten Mal wieder. Ergibt eine Funktion, die das Beobachten beendet.
 */
export function onStateWrittenElsewhere(
  target: EventTarget,
  area: unknown,
  reload: () => void,
): () => void {
  const listener = (e: Event) => {
    const change = e as Event & StorageChange
    if (change.storageArea === area && change.key === STORE_KEY && change.newValue !== null)
      reload()
  }
  target.addEventListener('storage', listener)
  return () => target.removeEventListener('storage', listener)
}

/** Beobachtet die anderen Fenster der Browser-Seite bzw. der Desktop-App; ohne Speicher passiert nichts. */
export function watchOtherWindows(): () => void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return () => {}
    return onStateWrittenElsewhere(
      window,
      window.localStorage,
      () => void useApp.persist.rehydrate(),
    )
  } catch {
    // localStorage gesperrt: dann gibt es auch nichts zu teilen
    return () => {}
  }
}
