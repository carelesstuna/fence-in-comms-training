/**
 * Mikrofonliste aus `enumerateDevices()` für die Auswahl aufbereiten.
 *
 * Vor der ersten Freigabe des Mikrofons verrät Chromium (auch WebView2 in der Desktop-App) weder Namen
 * noch Geräte-IDs: Es kommt nur ein namenloser Eintrag mit leerer ID. Erst nach dem ersten Zugriff
 * (`getUserMedia`) stehen alle Mikrofone da; die Freigabe bleibt danach im Profil gespeichert.
 */

export interface Mic {
  deviceId: string
  label: string
}

export interface MicList {
  /** Wählbare Mikrofone (ohne die Sammel-Einträge „default“ und „communications“). */
  devices: Mic[]
  /** Name des Standardmikrofons; leer, wenn unbekannt. */
  defaultLabel: string
  /** false: Namen und IDs sind noch gesperrt, erst die Freigabe zeigt die Liste. */
  named: boolean
}

/** Was von `MediaDeviceInfo` gebraucht wird. */
export type DeviceInfo = Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>

/** Chromium hängt bei USB-Geräten Hersteller- und Produktnummer an: „Headset (1a2b:3c4d)“. */
export function micLabel(label: string): string {
  return label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim()
}

export function micList(infos: readonly DeviceInfo[]): MicList {
  const inputs = infos.filter((d) => d.kind === 'audioinput')
  const named = inputs.some((d) => d.label !== '' && d.deviceId !== '')
  if (!named) return { devices: [], defaultLabel: '', named: false }
  const devices = inputs
    .filter((d) => d.deviceId !== '' && d.deviceId !== 'default' && d.deviceId !== 'communications')
    .map((d, i) => ({ deviceId: d.deviceId, label: micLabel(d.label) || `Mikrofon ${i + 1}` }))
  // Der Eintrag „default“ heißt „Default - <Name>“ (je nach Sprache auch anders): das Gerät suchen, auf das
  // er zeigt – bei mehreren passenden Namen den längsten („USB Mikrofon“ vor „Mikrofon“)
  const fallback = inputs.find((d) => d.deviceId === 'default')
  const target = fallback
    ? devices
        .map((d) => inputs.find((i) => i.deviceId === d.deviceId)?.label ?? '')
        .filter((label) => label !== '' && fallback.label.endsWith(label))
        .sort((a, b) => b.length - a.length)[0]
    : undefined
  return { devices, defaultLabel: target ? micLabel(target) : '', named }
}
