/**
 * Stellt die Funk-Wiedergabe bereit (React-Context): Gegenstellen sprechen mit Kokoro-82M, durch die
 * Funkkette (AM, FM, Intercom). Die Sprachausgabe ist ein optionaler Download wie die Whisper-Modelle;
 * ohne sie bleibt alles Text. Geladen wird sie erst, wenn etwas abgespielt werden soll.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../state/store'
import {
  RadioAudioContext,
  type EngineState,
  type FilesState,
  type PlayRequest,
  type RadioAudioValue,
} from './audio-context'
import { playBuffer, setVolume, stopPlayback } from './radio-player'
import { prepareVoice, renderVoice, voiceRequest } from './radio-voice'
import { TtsEngine } from './tts-engine'
import { clearBrowserStore, pickStore, type DownloadProgress, type TtsStore } from './tts-files'

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function AudioProvider({ children }: { children: ReactNode }) {
  const settings = useApp((s) => s.profile.audio)
  const [store, setStore] = useState<TtsStore | null>(null)
  const [files, setFiles] = useState<FilesState>('checking')
  const [engineState, setEngineState] = useState<EngineState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [download, setDownload] = useState<DownloadProgress | null>(null)
  const [current, setCurrent] = useState<RadioAudioValue['current']>(null)
  const [rtf, setRtf] = useState(0)
  const engine = useRef<TtsEngine | null>(null)
  const abort = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => setVolume(settings.volume), [settings.volume])

  const check = useCallback(async (s: TtsStore) => {
    try {
      setFiles((await s.missing()).length ? 'missing' : 'present')
    } catch {
      setFiles('missing')
    }
  }, [])

  useEffect(() => {
    let alive = true
    void pickStore().then((s) => {
      if (!alive) return
      setStore(s)
      void check(s)
    })
    return () => {
      alive = false
      engine.current?.dispose()
      stopPlayback()
    }
  }, [check])

  const ensureLoaded = useCallback(async () => {
    if (!store || files !== 'present') throw new Error('Die Sprachausgabe ist noch nicht geladen.')
    engine.current ??= new TtsEngine(store, false)
    const e = engine.current
    if (e.ready) return
    setEngineState('loading')
    setError(null)
    try {
      await e.load(setProgress)
      setEngineState('ready')
    } catch (err) {
      setEngineState('error')
      setError(message(err))
      engine.current = null
      throw err
    }
  }, [store, files])

  // Eingeschaltet und vorhanden: kurz nach dem Start im Hintergrund laden – sonst wartet der erste Funkspruch
  // aufs Laden und Aufwärmen (einige Sekunden)
  useEffect(() => {
    if (!settings.enabled || files !== 'present') return
    const id = setTimeout(() => void ensureLoaded().catch(() => undefined), 2500)
    return () => clearTimeout(id)
  }, [settings.enabled, files, ensureLoaded])

  const stop = useCallback(() => {
    generation.current++
    stopPlayback()
    setCurrent(null)
  }, [])

  const play = useCallback(
    async (r: PlayRequest): Promise<boolean> => {
      const s = settingsRef.current
      if (!s.enabled || files !== 'present') return false
      const gen = ++generation.current
      stopPlayback()
      setCurrent({ key: r.key, phase: 'preparing' })
      try {
        await ensureLoaded()
        const buf = await renderVoice(engine.current!, voiceRequest(r, s), 'now')
        setRtf(engine.current?.rtf ?? 0)
        if (gen !== generation.current) return false
        if (!buf) {
          setCurrent(null)
          return true
        }
        setCurrent({ key: r.key, phase: 'playing' })
        const done = await playBuffer(buf)
        if (gen === generation.current) setCurrent(null)
        return done && gen === generation.current
      } catch (err) {
        if (gen === generation.current) {
          setCurrent(null)
          setError(message(err))
        }
        return false
      }
    },
    [files, ensureLoaded],
  )

  const prefetch = useCallback(
    (list: readonly PlayRequest[]) => {
      const s = settingsRef.current
      if (!s.enabled || files !== 'present' || !list.length) return
      void ensureLoaded()
        .then(() => {
          for (const r of list)
            prepareVoice(engine.current!, voiceRequest(r, s), 'later').catch(() => undefined)
        })
        .catch(() => undefined)
    },
    [files, ensureLoaded],
  )

  const startDownload = useCallback(async () => {
    if (!store) return
    const ctrl = new AbortController()
    abort.current = ctrl
    setError(null)
    setDownload({ file: '', done: 0, total: 1 })
    try {
      await store.download(setDownload, ctrl.signal)
      await check(store)
    } catch (err) {
      setError(ctrl.signal.aborted ? 'Abgebrochen.' : message(err))
    } finally {
      abort.current = null
      setDownload(null)
    }
  }, [store, check])

  const cancelDownload = useCallback(() => abort.current?.abort(), [])

  const removeFiles = useCallback(async () => {
    stop()
    engine.current?.dispose()
    engine.current = null
    setEngineState('idle')
    await clearBrowserStore()
    if (store) await check(store)
  }, [stop, store, check])

  // Ausgeschaltet: laufende Wiedergabe beenden, Vorab-Rechnen verwerfen
  useEffect(() => {
    if (!settings.enabled) {
      generation.current++
      stopPlayback()
      engine.current?.dropLater()
    }
  }, [settings.enabled])

  const value = useMemo<RadioAudioValue>(() => {
    const available = settings.enabled && files === 'present'
    return {
      enabled: settings.enabled,
      files,
      engine: engineState,
      progress,
      error,
      rtf,
      available,
      listening: available && !settings.alwaysText,
      autoplay: available && settings.autoplay,
      storeKind: store?.kind ?? null,
      download,
      startDownload,
      cancelDownload,
      removeFiles,
      ensureLoaded,
      play,
      prefetch,
      stop,
      current: settings.enabled ? current : null,
    }
  }, [
    settings,
    files,
    engineState,
    progress,
    error,
    rtf,
    store,
    download,
    startDownload,
    cancelDownload,
    removeFiles,
    ensureLoaded,
    play,
    prefetch,
    stop,
    current,
  ])

  return <RadioAudioContext.Provider value={value}>{children}</RadioAudioContext.Provider>
}
