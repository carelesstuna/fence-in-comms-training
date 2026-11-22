/**
 * Vite-Plugins nur für den Entwicklungsserver (`npm run dev`):
 *
 * - **Messreihe:** Die Aufnahme-Seite (`#/dev/aufnahme`) speichert Aufnahmen als WAV samt JSON
 *   außerhalb des Repos (siehe `messreiheDir`). Nur Anfragen vom eigenen Server werden angenommen.
 * - **Modelle:** `/models/…` liefert die mit `npm run fetch-asr` geladenen transformers.js-Modelle
 *   aus `.asr/transformers` – die App lädt zur Laufzeit nichts aus dem Internet.
 * - **Sprachausgabe:** `/tts/…` liefert Kokoro, Stimmen und Lexika aus `.asr/tts`. Liegen sie dort,
 *   braucht der Dev-Server keinen Download im Browser (sonst lädt die App sie auf Klick nach).
 */
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { recordingDraftSchema, recordingMetaSchema, type RecordingMeta } from '../src/core/speech/recording.ts'
import { asrDir, messreiheDir } from './local-dirs.ts'

const MAX_BODY = 8 * 1024 * 1024

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((ok, fail) => {
    let size = 0
    const parts: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        fail(new Error('Zu groß'))
        req.destroy()
      } else parts.push(c)
    })
    req.on('end', () => ok(Buffer.concat(parts).toString('utf8')))
    req.on('error', fail)
  })
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/** Nur Anfragen von der eigenen Seite (localhost) – keine fremde Webseite darf hier schreiben. */
function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin
  const host = req.headers.host
  if (!origin || !host) return false
  try {
    const o = new URL(origin)
    return o.host === host && ['localhost', '127.0.0.1', '[::1]'].includes(o.hostname)
  } catch {
    return false
  }
}

function listRecordings(dir: string): RecordingMeta[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /^\d{4}-[a-z-]+\.json$/.test(f))
    .flatMap((f) => {
      try {
        const r = recordingMetaSchema.safeParse(JSON.parse(readFileText(join(dir, f))))
        return r.success ? [r.data] : []
      } catch {
        return []
      }
    })
}

function readFileText(path: string): string {
  return statSync(path).size > MAX_BODY ? '' : readFileSync(path, 'utf8')
}

export function messreihePlugin(): Plugin {
  return {
    name: 'fence-in-comms-training-messreihe',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__messreihe', (req, res) => {
        void (async () => {
          const dir = messreiheDir()
          const url = new URL(req.url ?? '/', 'http://x')
          if (req.method === 'GET' && url.pathname === '/status') {
            const list = listRecordings(dir)
            return send(res, 200, { dir, recordings: list.map((r) => ({ id: r.id, kind: r.kind })) })
          }
          if (req.method !== 'POST' || !sameOrigin(req) || !req.headers['content-type']?.startsWith('application/json')) {
            return send(res, 403, { error: 'Nicht erlaubt' })
          }
          const body = JSON.parse(await readBody(req)) as { draft?: unknown; wav?: unknown; id?: unknown }
          if (url.pathname === '/save') {
            const draft = recordingDraftSchema.safeParse(body.draft)
            if (!draft.success || typeof body.wav !== 'string') return send(res, 400, { error: 'Ungültige Aufnahme' })
            const wav = Buffer.from(body.wav, 'base64')
            if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF') return send(res, 400, { error: 'Keine WAV-Datei' })
            mkdirSync(dir, { recursive: true })
            const used = readdirSync(dir).flatMap((f) => (/^(\d{4})-/.exec(f) ? [Number(f.slice(0, 4))] : []))
            const id = String(Math.max(0, ...used) + 1).padStart(4, '0')
            const base = `${id}-${draft.data.kind}`
            const meta: RecordingMeta = { ...draft.data, id, audio: { ...draft.data.audio, file: `${base}.wav` } }
            writeFileSync(join(dir, `${base}.wav`), wav)
            writeFileSync(join(dir, `${base}.json`), JSON.stringify(meta, null, 2) + '\n')
            return send(res, 200, { id, file: `${base}.wav` })
          }
          if (url.pathname === '/delete') {
            if (typeof body.id !== 'string' || !/^\d{4}$/.test(body.id)) return send(res, 400, { error: 'Ungültige Nummer' })
            const removed = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(`${body.id}-`) && /\.(wav|json)$/.test(f)) : []
            for (const f of removed) rmSync(join(dir, f))
            return send(res, 200, { removed })
          }
          return send(res, 404, { error: 'Unbekannt' })
        })().catch((e: unknown) => send(res, 500, { error: e instanceof Error ? e.message : String(e) }))
      })
    },
  }
}

const TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.onnx': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
}

/** Liefert Dateien aus einem Unterordner von `.asr` aus (nur GET/HEAD, nur innerhalb des Ordners). */
function serveAsrFiles(server: ViteDevServer, prefix: string, sub: string, missing: string): void {
  server.middlewares.use(prefix, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const base = resolve(asrDir(), sub)
    const rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
    const file = resolve(base, `.${rel}`)
    if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404
      return res.end(missing)
    }
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
    res.setHeader('Content-Length', statSync(file).size)
    if (req.method === 'HEAD') return res.end()
    createReadStream(file).pipe(res)
  })
}

export function asrModelsPlugin(): Plugin {
  return {
    name: 'fence-in-comms-training-asr-models',
    apply: 'serve',
    configureServer(server) {
      serveAsrFiles(server, '/models', 'transformers', 'Modell fehlt – bitte „npm run fetch-asr“ ausführen.')
      serveAsrFiles(server, '/tts', 'tts', 'Sprachausgabe fehlt – bitte „npm run fetch-asr -- tts“ ausführen.')
    },
  }
}
