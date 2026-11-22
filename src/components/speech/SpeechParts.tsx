/**
 * Bausteine für das Sprechen: PTT-Knopf für die Maus und Pegelanzeige des Mikrofons.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import type { AudioCapture } from '../../platform/audio-capture'
import { dbfs } from '../../core/speech/pcm'

/**
 * Sprechtaste für die Maus: gedrückt halten = senden. Verlässt der Zeiger den Knopf, endet die
 * Sendung ebenfalls. Im Umschaltmodus startet ein Klick die Sendung, der nächste beendet sie.
 */
export function PttButton({
  sending,
  disabled,
  toggle,
  onPress,
  onRelease,
  children,
}: {
  sending: boolean
  disabled?: boolean
  toggle?: boolean
  onPress: () => void
  onRelease: () => void
  children?: ReactNode
}) {
  const end = () => {
    if (!toggle && sending) onRelease()
  }
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={sending}
      // Fokus bleibt, wo er ist – sonst würde die Leertaste diesen Knopf auslösen
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        if (toggle) {
          if (sending) onRelease()
          else onPress()
        } else onPress()
      }}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none rounded-lg px-4 py-2 font-semibold transition disabled:opacity-40 ${
        sending ? 'bg-red-500 text-white shadow-[0_0_0_3px_rgba(239,68,68,0.35)]' : 'bg-amber-hud text-ink hover:brightness-110'
      }`}
    >
      {children ?? (sending ? '● Sendet …' : 'PTT halten')}
    </button>
  )
}

/** Pegel des Mikrofons in dBFS (-60 bis 0), aktualisiert pro Bild. */
export function LevelMeter({ capture, className = '' }: { capture: AudioCapture | null; className?: string }) {
  const bar = useRef<HTMLDivElement>(null)
  const peak = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!capture) return
    let raf = 0
    let hold = 0
    const tick = () => {
      const { rms, peak: p } = capture.level
      const pct = (x: number) => Math.max(0, Math.min(100, ((dbfs(x) + 60) / 60) * 100))
      hold = Math.max(pct(p), hold - 1.5)
      if (bar.current) bar.current.style.width = `${pct(rms)}%`
      if (peak.current) peak.current.style.left = `${hold}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [capture])
  return (
    <div className={`relative h-2.5 overflow-hidden rounded-full bg-black/40 ${className}`} role="meter" aria-label="Mikrofonpegel" aria-valuemin={-60} aria-valuemax={0}>
      <div ref={bar} className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-red-500" style={{ width: '0%' }} />
      <div ref={peak} className="absolute top-0 h-full w-0.5 bg-white/80" style={{ left: '0%' }} />
    </div>
  )
}
