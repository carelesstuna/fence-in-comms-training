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
    // Aufbau wie in der installierten Desktop-App (WebView2 157) mit drei Mikrofonen; Gerätenamen verallgemeinert
    const list = micList([
      mic(
        'default',
        'Default - Kopfhörermikrofon (Wireless Gaming Headset) (1a2b:3c4d)',
      ),
      mic(
        'communications',
        'Communications - Kopfhörermikrofon (Wireless Gaming Headset) (1a2b:3c4d)',
      ),
      mic('a1b2c3d4', 'Mikrofon (Virtual Streaming Microphone)'),
      mic('e5f6a7b8', 'Mikrofon (USB Webcam) (5e6f:7a8b)'),
      mic('c9d0e1f2', 'Kopfhörermikrofon (Wireless Gaming Headset) (1a2b:3c4d)'),
      { deviceId: 'out1', label: 'Lautsprecher', kind: 'audiooutput' },
    ])
    expect(list.named).toBe(true)
    expect(list.devices).toEqual([
      { deviceId: 'a1b2c3d4', label: 'Mikrofon (Virtual Streaming Microphone)' },
      { deviceId: 'e5f6a7b8', label: 'Mikrofon (USB Webcam)' },
      {
        deviceId: 'c9d0e1f2',
        label: 'Kopfhörermikrofon (Wireless Gaming Headset)',
      },
    ])
    expect(list.defaultLabel).toBe('Kopfhörermikrofon (Wireless Gaming Headset)')
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
    expect(micLabel('Mikrofon (USB Webcam) (5e6f:7a8b)')).toBe(
      'Mikrofon (USB Webcam)',
    )
    expect(micLabel('Mikrofon (Virtual Streaming Microphone)')).toBe(
      'Mikrofon (Virtual Streaming Microphone)',
    )
  })
})
