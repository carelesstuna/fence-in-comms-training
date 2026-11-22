import { describe, expect, it } from 'vitest'
import { micLabel, micList, type DeviceInfo } from './mics'

const mic = (deviceId: string, label: string): DeviceInfo => ({
  deviceId,
  label,
  kind: 'audioinput',
})

describe('Mikrofonliste', () => {
  it('vor der Freigabe: nur ein namenloser Eintrag – keine Auswahl, Liste gesperrt', () => {
    // So liefert es WebView2 in der frisch installierten Desktop-App
    const list = micList([mic('', ''), { deviceId: '', label: '', kind: 'audiooutput' }])
    expect(list).toEqual({ devices: [], defaultLabel: '', named: false })
  })

  it('nach der Freigabe: alle Mikrofone, Standardgerät erkannt, Sammel-Einträge weg', () => {
    // Gemessen in der installierten Desktop-App (WebView2 157) mit drei Mikrofonen
    const list = micList([
      mic(
        'default',
        'Default - Kopfhörermikrofon (CORSAIR HS80 MAX WIRELESS Gaming Headset) (1b1c:0a97)',
      ),
      mic(
        'communications',
        'Communications - Kopfhörermikrofon (CORSAIR HS80 MAX WIRELESS Gaming Headset) (1b1c:0a97)',
      ),
      mic('748432b0', 'Mikrofon (Steam Streaming Microphone)'),
      mic('d46ab3dd', 'Mikrofon (Logi 4K Stream Edition) (046d:086b)'),
      mic('4b956504', 'Kopfhörermikrofon (CORSAIR HS80 MAX WIRELESS Gaming Headset) (1b1c:0a97)'),
      { deviceId: 'out1', label: 'Lautsprecher', kind: 'audiooutput' },
    ])
    expect(list.named).toBe(true)
    expect(list.devices).toEqual([
      { deviceId: '748432b0', label: 'Mikrofon (Steam Streaming Microphone)' },
      { deviceId: 'd46ab3dd', label: 'Mikrofon (Logi 4K Stream Edition)' },
      {
        deviceId: '4b956504',
        label: 'Kopfhörermikrofon (CORSAIR HS80 MAX WIRELESS Gaming Headset)',
      },
    ])
    expect(list.defaultLabel).toBe('Kopfhörermikrofon (CORSAIR HS80 MAX WIRELESS Gaming Headset)')
  })

  it('Standardgerät: der längste passende Name gewinnt, auch bei anderer Sprache', () => {
    const list = micList([
      mic('default', 'Standard - USB Mikrofon'),
      mic('a', 'Mikrofon'),
      mic('b', 'USB Mikrofon'),
    ])
    expect(list.defaultLabel).toBe('USB Mikrofon')
  })

  it('ohne Eintrag „default“ (z. B. Firefox): Standardgerät unbekannt, Liste trotzdem da', () => {
    const list = micList([mic('a', 'Headset'), mic('b', '')])
    expect(list.devices).toEqual([
      { deviceId: 'a', label: 'Headset' },
      { deviceId: 'b', label: 'Mikrofon 2' },
    ])
    expect(list.defaultLabel).toBe('')
  })

  it('Gerätenamen ohne angehängte USB-Nummer', () => {
    expect(micLabel('Mikrofon (Logi 4K Stream Edition) (046d:086b)')).toBe(
      'Mikrofon (Logi 4K Stream Edition)',
    )
    expect(micLabel('Mikrofon (Steam Streaming Microphone)')).toBe(
      'Mikrofon (Steam Streaming Microphone)',
    )
  })
})
